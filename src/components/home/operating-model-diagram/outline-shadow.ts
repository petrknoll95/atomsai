import { Color, Mesh, Quaternion, ShaderMaterial, Shape, ShapeGeometry, Vector2, Vector3 } from 'three';

/** A soft inset wash, clipped to the same rounded silhouette as the dashes. */
export function createOutlineShadow(color: string) {
  const material = new ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      iris: { value: new Color(color) },
      strength: { value: 0 },
      edgeCount: { value: 0 },
      starts: { value: Array.from({ length: 8 }, () => new Vector2()) },
      ends: { value: Array.from({ length: 8 }, () => new Vector2()) },
    },
    vertexShader: `
      varying vec2 localPoint;
      void main() {
        localPoint = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 iris;
      uniform float strength;
      uniform int edgeCount;
      uniform vec2 starts[8];
      uniform vec2 ends[8];
      varying vec2 localPoint;
      void main() {
        float distanceToEdge = 100.0;
        for (int i = 0; i < 8; i++) {
          if (i >= edgeCount) break;
          vec2 edge = ends[i] - starts[i];
          vec2 offset = localPoint - starts[i];
          float along = clamp(dot(offset, edge) / dot(edge, edge), 0.0, 1.0);
          distanceToEdge = min(distanceToEdge, length(offset - edge * along));
        }
        float shadow = exp(-pow(distanceToEdge / 0.17, 1.5));
        gl_FragColor = vec4(iris, shadow * strength * 0.22);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new Mesh(new ShapeGeometry(), material);
  mesh.renderOrder = 3;
  mesh.visible = false;

  return {
    mesh,
    update(points: Vector2[], corners: Vector3[], rotation: Quaternion) {
      mesh.geometry.dispose();
      mesh.geometry = new ShapeGeometry(new Shape(points));
      mesh.quaternion.copy(rotation);
      material.uniforms.edgeCount.value = corners.length;
      corners.forEach((point, index) => {
        const next = corners[(index + 1) % corners.length];
        material.uniforms.starts.value[index].set(point.x, point.y);
        material.uniforms.ends.value[index].set(next.x, next.y);
      });
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
