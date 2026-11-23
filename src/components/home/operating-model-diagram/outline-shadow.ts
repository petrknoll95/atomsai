import { BufferGeometry, Color, Float32BufferAttribute, Mesh, Quaternion, ShaderMaterial, Vector2, Vector3 } from 'three';

const shadowDepth = .5;

/** A soft inset wash following the projected rim of the stack. */
export function createOutlineShadow(color: string) {
  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      iris: { value: new Color(color) },
      strength: { value: 0 },
    },
    vertexShader: `
      attribute float edgeDistance;
      varying float distanceToEdge;
      void main() {
        distanceToEdge = edgeDistance;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 iris;
      uniform float strength;
      varying float distanceToEdge;
      void main() {
        float shadow = exp(-pow(distanceToEdge / 0.17, 1.5));
        gl_FragColor = vec4(iris, shadow * strength * 0.22);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(new BufferGeometry(), material);
  mesh.renderOrder = 3;
  mesh.visible = false;

  return {
    mesh,
    update(rim: Vector3[], rotation: Quaternion) {
      const positions: number[] = [];
      const distances: number[] = [];
      const indices: number[] = [];
      // Inward normals form a strip on the clockwise rim, so the wash stays
      // inside the curve without evaluating every edge for every pixel.
      rim.forEach((point, index) => {
        const previous = rim[(index + rim.length - 1) % rim.length];
        const nextIndex = (index + 1) % rim.length;
        const next = rim[nextIndex];
        const incoming = new Vector2(point.y - previous.y, previous.x - point.x).normalize();
        const outgoing = new Vector2(next.y - point.y, point.x - next.x).normalize();
        const inset = incoming.clone().add(outgoing).multiplyScalar(shadowDepth / (1 + incoming.dot(outgoing)));
        positions.push(point.x, point.y, 0, point.x + inset.x, point.y + inset.y, 0);
        distances.push(0, shadowDepth);
        const outer = index * 2;
        const nextOuter = nextIndex * 2;
        indices.push(outer, outer + 1, nextOuter, nextOuter, outer + 1, nextOuter + 1);
      });

      const geometry = new BufferGeometry();
      geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
      geometry.setAttribute('edgeDistance', new Float32BufferAttribute(distances, 1));
      geometry.setIndex(indices);
      mesh.geometry.dispose();
      mesh.geometry = geometry;
      mesh.quaternion.copy(rotation);
    },
    setStrength(strength: number) {
      material.uniforms.strength.value = strength;
      mesh.visible = strength > 0;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
