import { buildPatternModel } from './model';
import { blurShader, compositeShader, maskShader, vertexShader } from './shaders';
import type { PatternOptions } from './types';

type Target = { framebuffer: WebGLFramebuffer; textures: WebGLTexture[] };

/** Source masks are prepared once; optional motion changes only the final composite. */
export function createPatternRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error('WebGL2 is unavailable in this browser.');
  // Blend the original encoded P3 channels in the shader, then explicitly
  // convert to sRGB at presentation. This also makes Chromium/WebKit capture
  // reproducible: their offscreen P3 canvas surfaces can lose the profile.
  gl.drawingBufferColorSpace = 'srgb';
  const floatTargets = Boolean(gl.getExtension('EXT_color_buffer_float'));
  const programs: WebGLProgram[] = [];
  const textures: WebGLTexture[] = [];
  const targets: Target[] = [];
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.disable(gl.DITHER);

  function shader(type: number, source: string) {
    const value = gl!.createShader(type);
    if (!value) throw new Error('Could not allocate pattern shader.');
    gl!.shaderSource(value, source); gl!.compileShader(value);
    if (!gl!.getShaderParameter(value, gl!.COMPILE_STATUS)) {
      const error = gl!.getShaderInfoLog(value); gl!.deleteShader(value);
      throw new Error(`Pattern shader compilation failed: ${error}`);
    }
    return value;
  }
  function program(fragment: string) {
    const value = gl!.createProgram();
    if (!value) throw new Error('Could not allocate pattern program.');
    programs.push(value);
    let vertex: WebGLShader | null = null, pixel: WebGLShader | null = null;
    try {
      vertex = shader(gl!.VERTEX_SHADER, vertexShader); pixel = shader(gl!.FRAGMENT_SHADER, fragment);
      gl!.attachShader(value, vertex); gl!.attachShader(value, pixel); gl!.linkProgram(value);
      if (!gl!.getProgramParameter(value, gl!.LINK_STATUS)) throw new Error(`Pattern shader link failed: ${gl!.getProgramInfoLog(value)}`);
    } finally {
      gl!.deleteShader(vertex); gl!.deleteShader(pixel);
    }
    return value;
  }
  let masks: WebGLProgram, blur: WebGLProgram, composite: WebGLProgram;
  try {
    masks = program(maskShader); blur = program(blurShader); composite = program(compositeShader);
  } catch (error) {
    programs.forEach(value => gl.deleteProgram(value)); gl.deleteVertexArray(vao);
    throw error;
  }
  const locations = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  const uniform = (p: WebGLProgram, name: string) => {
    let values = locations.get(p);
    if (!values) { values = new Map(); locations.set(p, values); }
    if (!values.has(name)) values.set(name, gl.getUniformLocation(p, name));
    return values.get(name)!;
  };
  const motionLocation = uniform(composite, 'uMotion');
  const motionKindLocation = uniform(composite, 'uMotionKind');
  const motionPhaseLocation = uniform(composite, 'uMotionPhase');
  let prepared = false;
  function texture(width: number, height: number, data?: Float32Array) {
    const value = gl!.createTexture();
    if (!value) throw new Error('Could not allocate pattern texture.');
    textures.push(value);
    gl!.bindTexture(gl!.TEXTURE_2D, value);
    const filter = data ? gl!.NEAREST : gl!.LINEAR;
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    if (data) gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA32F, width, height, 0, gl!.RGBA, gl!.FLOAT, data);
    else gl!.texImage2D(gl!.TEXTURE_2D, 0, floatTargets ? gl!.RGBA16F : gl!.RGBA8, width, height, 0, gl!.RGBA, floatTargets ? gl!.HALF_FLOAT : gl!.UNSIGNED_BYTE, null);
    return value;
  }
  function target(size: number) {
    const framebuffer = gl!.createFramebuffer();
    if (!framebuffer) throw new Error('Could not allocate pattern framebuffer.');
    const value: Target = { framebuffer, textures: [] }; targets.push(value);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, framebuffer);
    const pair = [texture(size, size), texture(size, size)];
    pair.forEach((value, i) => gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0 + i, gl!.TEXTURE_2D, value, 0));
    gl!.drawBuffers([gl!.COLOR_ATTACHMENT0, gl!.COLOR_ATTACHMENT1]);
    if (gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) !== gl!.FRAMEBUFFER_COMPLETE) throw new Error('Pattern framebuffer is incomplete.');
    value.textures = pair; return value;
  }
  function bind(p: WebGLProgram, name: string, value: WebGLTexture, unit: number) {
    gl!.activeTexture(gl!.TEXTURE0 + unit); gl!.bindTexture(gl!.TEXTURE_2D, value);
    gl!.uniform1i(uniform(p, name), unit);
  }
  function releaseTargets(keep: WebGLTexture[] = []) {
    targets.splice(0).forEach(value => gl!.deleteFramebuffer(value.framebuffer));
    const removed = textures.splice(0);
    removed.forEach(value => { if (keep.includes(value)) textures.push(value); else gl!.deleteTexture(value); });
  }

  function render(options: PatternOptions, width: number, height: number, pixelRatio = 1, retain = false) {
    if (gl!.isContextLost()) return;
    const started = performance.now();
    releaseTargets();
    prepared = false;
    let retained: WebGLTexture[] = [];
    try {
      const model = buildPatternModel(options);
      const maxTexture = gl!.getParameter(gl!.MAX_TEXTURE_SIZE) as number;
      const dpr = retain ? Math.min(1.5, Math.max(1, pixelRatio), 1024 / Math.max(width, height)) : Math.min(2, Math.max(1, pixelRatio));
      canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
      const size = Math.min(2048, maxTexture, Math.ceil(Math.max(canvas.width, canvas.height) * 840 / 800));
      const gradientData = new Float32Array(128 * model.gradients.length * 4);
      model.gradients.forEach((gradient, row) => {
        const start = row * 128 * 4;
        gradientData.set([...gradient.matrix.slice(0, 3), gradient.stops.length, ...gradient.matrix.slice(3, 6), gradient.opacity], start);
        gradient.stops.forEach((stop, i) => gradientData.set([stop[0], stop[1], stop[2], stop[3], stop[4], 0, 0, 0], start + 8 + i * 8));
      });
      const allShapes = model.masks.flatMap(mask => mask.shapes);
      const shapeData = new Float32Array(allShapes.length * 8);
      allShapes.forEach((shape, i) => shapeData.set([shape.gradients[0] ?? -1, shape.gradients[1] ?? -1, shape.opacity, shape.outer ?? 0, shape.inner ?? 0, 0, 0, 0], i * 8));
      const gradientTexture = texture(128, model.gradients.length, gradientData);
      const shapeTexture = texture(2, allShapes.length, shapeData);
      const metadata = new Float32Array(32), sigma = new Float32Array(8);
      let offset = 0;
      model.masks.forEach((mask, i) => {
        metadata.set([offset, mask.shapes.length, mask.opacity, mask.alphaOnly ? 1 : 0], i * 4);
        // Figma's blur radius is the diameter-like UI value; Gaussian sigma is half.
        sigma[i] = mask.blur * 0.5 * size / 840 * (options.blurScale ?? 1);
        offset += mask.shapes.length;
      });
      const first = target(size);
      gl!.viewport(0, 0, size, size); gl!.useProgram(masks);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, first.framebuffer);
      bind(masks, 'uGradients', gradientTexture, 0); bind(masks, 'uShapes', shapeTexture, 1);
      gl!.uniform4fv(uniform(masks, 'uMasks[0]'), metadata);
      gl!.uniform1i(uniform(masks, 'uMaskCount'), model.masks.length);
      gl!.uniform1i(uniform(masks, 'uConcentric'), model.kind === 'concentric' ? 1 : 0);
      gl!.uniform1f(uniform(masks, 'uCount'), model.count);
      gl!.uniform1f(uniform(masks, 'uPitch'), model.ringPitch);
      gl!.uniform1f(uniform(masks, 'uFieldSize'), size);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      let finalMask = first;
      if (sigma.some(value => value > 0)) {
        const horizontal = target(size), vertical = target(size);
        gl!.useProgram(blur);
        for (const [input, output, dx, dy] of [[first, horizontal, 1 / size, 0], [horizontal, vertical, 0, 1 / size]] as const) {
          // Figma's layer blur is isotropic even when the instance is stretched.
          const blurAspect = options.fit === 'stretch' && dy ? width / height : 1;
          gl!.uniform4fv(uniform(blur, 'uSigmaA'), sigma.slice(0, 4).map(value => value * blurAspect));
          gl!.uniform4fv(uniform(blur, 'uSigmaB'), sigma.slice(4, 8).map(value => value * blurAspect));
          gl!.bindFramebuffer(gl!.FRAMEBUFFER, output.framebuffer);
          bind(blur, 'uMaskA', input.textures[0], 0); bind(blur, 'uMaskB', input.textures[1], 1);
          gl!.uniform2f(uniform(blur, 'uDirection'), dx, dy);
          gl!.drawArrays(gl!.TRIANGLES, 0, 3);
        }
        finalMask = vertical;
      }
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null); gl!.viewport(0, 0, canvas.width, canvas.height); gl!.useProgram(composite);
      bind(composite, 'uMaskA', finalMask.textures[0], 0); bind(composite, 'uMaskB', finalMask.textures[1], 1);
      const colors = new Float32Array(21); model.colors.forEach((color, i) => colors.set(color, i * 3));
      gl!.uniform3fv(uniform(composite, 'uColors[0]'), colors);
      gl!.uniform3fv(uniform(composite, 'uReflectionBase'), options.colors?.reflectionBase ?? [0, 0, 0]);
      gl!.uniform1i(uniform(composite, 'uKind'), ['drift', 'offset', 'single-band', 'concentric'].indexOf(model.kind));
      gl!.uniform2f(uniform(composite, 'uOutputSize'), canvas.width, canvas.height);
      gl!.uniform1i(uniform(composite, 'uStretch'), options.fit === 'stretch' ? 1 : 0);
      gl!.uniform1f(uniform(composite, 'uRotation'), (options.rotation ?? 0) * Math.PI / 180);
      gl!.uniform1f(uniform(composite, 'uZoom'), Math.max(1, options.zoom ?? 1));
      gl!.uniform2f(uniform(composite, 'uPan'), Math.max(-1, Math.min(1, options.panX ?? 0)), Math.max(-1, Math.min(1, options.panY ?? 0)));
      gl!.uniform1i(uniform(composite, 'uToSrgb'), 1);
      gl!.uniform4f(motionLocation, 0, 0, 0, 0);
      gl!.uniform1i(motionKindLocation, 0);
      gl!.uniform1f(motionPhaseLocation, 0);
      gl!.uniform1f(uniform(composite, 'uRingPitch'), model.ringPitch / 840);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      const error = gl!.getError();
      if (error !== gl!.NO_ERROR) throw new Error(`Pattern renderer WebGL error ${error}.`);
      canvas.dataset.renderState = 'ready';
      canvas.dataset.colorSpace = 'display-p3-to-srgb';
      canvas.dataset.maskPrecision = floatTargets ? 'float16' : 'uint8';
      canvas.dataset.renderMs = (performance.now() - started).toFixed(2);
      canvas.dataset.prepareCount = String(Number(canvas.dataset.prepareCount ?? 0) + 1);
      if (retain) { retained = finalMask.textures; prepared = true; }
      canvas.dataset.retainedMaskBytes = String(retain ? size * size * 2 * (floatTargets ? 8 : 4) : 0);
    } finally {
      // Animation retains only the two final masks, never gradients or blur scratch targets.
      releaseTargets(retained);
    }
  }
  return {
    render,
    prepare(options: PatternOptions, width: number, height: number, pixelRatio = 1) {
      render(options, width, height, pixelRatio, true);
    },
    drawMotion(kind: number, phase: number, intensity: number) {
      if (!prepared) return;
      const angle = ((phase % 1 + 1) % 1) * Math.PI * 2;
      gl.useProgram(composite);
      gl.uniform1i(motionKindLocation, kind);
      gl.uniform1f(motionPhaseLocation, ((phase % 1 + 1) % 1));
      gl.uniform4f(motionLocation, Math.sin(angle), Math.cos(angle) - 1, Math.sin(angle * 2), Math.max(0, Math.min(1, intensity)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() { releaseTargets(); programs.forEach(p => gl.deleteProgram(p)); gl.deleteVertexArray(vao); },
  };
}
