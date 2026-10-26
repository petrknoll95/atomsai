/** GLSL ES 3.00. All geometry and paint values come from numeric source tables. */
export const vertexShader = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const maskShader = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uGradients;
uniform sampler2D uShapes;
uniform vec4 uMasks[8];
uniform int uMaskCount;
uniform bool uConcentric;
uniform float uCount;
uniform float uPitch;
uniform float uFieldSize;
layout(location=0) out vec4 maskA;
layout(location=1) out vec4 maskB;

vec4 stopColor(int gradient, int stopIndex) {
  return vec4(texelFetch(uGradients, ivec2(2 + stopIndex * 2, gradient), 0).yzw,
    texelFetch(uGradients, ivec2(3 + stopIndex * 2, gradient), 0).x);
}
float stopPosition(int gradient, int stopIndex) {
  return texelFetch(uGradients, ivec2(2 + stopIndex * 2, gradient), 0).x;
}
vec4 gradientColor(int id, vec2 local) {
  vec4 rowA = texelFetch(uGradients, ivec2(0, id), 0);
  vec4 rowB = texelFetch(uGradients, ivec2(1, id), 0);
  vec2 q = vec2(dot(rowA.xy, local) + rowA.z, dot(rowB.xy, local) + rowB.z);
  float t = 2.0 * length(q - 0.5);
  int lo = 0, hi = int(rowA.w) - 1;
  for (int step = 0; step < 6; ++step) {
    if (hi - lo <= 1) break;
    int middle = (lo + hi) / 2;
    if (t < stopPosition(id, middle)) hi = middle; else lo = middle;
  }
  float left = stopPosition(id, lo), right = stopPosition(id, hi);
  vec4 value = mix(stopColor(id, lo), stopColor(id, hi), clamp((t-left)/max(0.0000001,right-left),0.0,1.0));
  value.a *= rowB.w;
  return value;
}
float shapeValue(int index, vec2 local, bool alphaOnly) {
  vec4 shape = texelFetch(uShapes, ivec2(0,index),0);
  vec4 color = vec4(0.0);
  // Figma fills are stored top-first. Composite from the back in encoded P3.
  for (int paint = 1; paint >= 0; --paint) {
    int id = int(paint == 0 ? shape.x : shape.y);
    if (id < 0) continue;
    vec4 c = gradientColor(id, local);
    color = vec4(c.rgb*c.a + color.rgb*(1.0-c.a), c.a + color.a*(1.0-c.a));
  }
  return (alphaOnly ? color.a : dot(color.rgb,vec3(0.2126,0.7152,0.0722))) * shape.z;
}
float maskValue(int index, vec2 field) {
  if (index >= uMaskCount) return 0.0;
  vec4 mask = uMasks[index];
  if (!uConcentric) {
    vec2 local = vec2(fract(field.x/840.0*uCount),field.y/840.0);
    return shapeValue(int(mask.x),local,mask.w>0.5) * mask.z;
  }
  float radius = length(field-420.0);
  float pitch = index == 0 ? uPitch*0.5 : uPitch;
  int nearest = int(floor(radius/pitch));
  float pixel = 840.0/uFieldSize;
  float value = 0.0;
  for (int neighbor=-1;neighbor<=1;++neighbor) {
    int ring=nearest+neighbor;
    if (ring<0 || ring>=int(mask.y)) continue;
    int shapeId=int(mask.x)+ring;
    float outer=texelFetch(uShapes,ivec2(0,shapeId),0).w;
    float inner=texelFetch(uShapes,ivec2(1,shapeId),0).x;
    float coverage=clamp((outer-radius)/pixel+0.5,0.0,1.0);
    if(inner>0.0)coverage*=clamp((radius-inner)/pixel+0.5,0.0,1.0);
    if(coverage<=0.0)continue;
    vec2 local=(field-420.0)/(2.0*outer)+0.5;
    value+=shapeValue(shapeId,local,mask.w>0.5)*coverage;
  }
  return min(value,1.0)*mask.z;
}
void main() {
  // Texture rows use the same top-to-bottom convention as source coordinates.
  vec2 field=vUv*840.0;
  maskA=vec4(maskValue(0,field),maskValue(1,field),maskValue(2,field),maskValue(3,field));
  maskB=vec4(maskValue(4,field),maskValue(5,field),maskValue(6,field),maskValue(7,field));
}`;

export const blurShader = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uMaskA;
uniform sampler2D uMaskB;
uniform vec2 uDirection;
uniform vec4 uSigmaA;
uniform vec4 uSigmaB;
layout(location=0) out vec4 outA;
layout(location=1) out vec4 outB;
void main(){
  vec4 a=vec4(0.0),b=vec4(0.0),wa=vec4(0.0),wb=vec4(0.0);
  for(int i=-12;i<=12;++i){
    float x=float(i);
    vec4 ka=exp(-0.5*x*x/max(uSigmaA*uSigmaA,vec4(0.00001)));
    vec4 kb=exp(-0.5*x*x/max(uSigmaB*uSigmaB,vec4(0.00001)));
    a+=texture(uMaskA,vUv+x*uDirection)*ka;wa+=ka;
    b+=texture(uMaskB,vUv+x*uDirection)*kb;wb+=kb;
  }
  outA=a/wa;outB=b/wb;
}`;

export const compositeShader = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uMaskA;
uniform sampler2D uMaskB;
uniform vec3 uColors[7];
uniform vec3 uReflectionBase;
uniform int uKind;
uniform vec2 uOutputSize;
uniform bool uStretch;
uniform float uRotation;
uniform float uZoom;
uniform vec2 uPan;
uniform bool uToSrgb;
uniform vec4 uMotion;
uniform int uMotionKind;
uniform float uMotionPhase;
uniform float uRingPitch;
out vec4 result;
vec3 overlay(vec3 base,vec3 blend){return mix(2.0*base*blend,1.0-2.0*(1.0-base)*(1.0-blend),step(vec3(0.5),base));}
vec3 linearize(vec3 c){return mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),c));}
vec3 encode(vec3 c){c=max(c,vec3(0.0));return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c));}
// Advect the captured ring profile radially. The two samples differ by
// exactly one ring pitch, so their crests align while source envelopes blend.
vec4 radialMask(vec2 direction,float radius){
  float edge=0.499/max(abs(direction.x),abs(direction.y));
  if(radius>edge)radius-=ceil((radius-edge)/uRingPitch)*uRingPitch;
  return texture(uMaskA,0.5+direction*max(0.0,radius));
}
void main(){
  vec2 outputSize=uStretch?vec2(800.0):uOutputSize;
  vec2 p=vec2(vUv.x,1.0-vUv.y)*outputSize-outputSize*0.5;
  float c=cos(uRotation),s=sin(uRotation);
  vec2 bounds=vec2(abs(c)*outputSize.x+abs(s)*outputSize.y,abs(s)*outputSize.x+abs(c)*outputSize.y);
  float side=max(bounds.x,bounds.y)*uZoom;
  p=mat2(c,-s,s,c)*p+uPan*(side-bounds)*0.5;
  vec2 field=((p/side+0.5)*800.0+20.0)/840.0;
  vec4 a=texture(uMaskA,field),b=texture(uMaskB,field);
  if(uMotionKind==4 && uKind==3 && uMotion.w>0.0){
    vec2 radial=field-0.5;
    float radius=length(radial);
    vec2 direction=radius>0.000001?radial/radius:vec2(0.0,1.0);
    float phase=uMotionPhase;
    vec4 behind=radialMask(direction,radius-phase*uRingPitch);
    vec4 ahead=radialMask(direction,radius+(1.0-phase)*uRingPitch);
    vec4 waves=mix(behind,ahead,smoothstep(0.0,1.0,phase));
    // A small stationary center lets each new wave emerge without a singularity.
    float emergence=smoothstep(0.0,uRingPitch*0.65,radius);
    a=mix(a,waves,emergence*min(1.0,uMotion.w/0.7));
  }
  // Tonal studies retain fixed geometry. Ripple instead advects the rings.
  if(uMotion.w>0.0 && uMotionKind!=4){
    float signal=uMotion.x;
    if(uMotionKind==1){
      float y=field.y*4.08407045;
      signal=0.65*(uMotion.x*cos(y)+uMotion.y*sin(y));
    }else if(uMotionKind==2){
      vec2 q=(field-0.5)*2.0;
      signal=0.7*(q.x*uMotion.y+q.y*uMotion.x);
    }else if(uMotionKind==3){
      float diagonal=(field.x+field.y)*3.76991118;
      signal=0.5*(uMotion.x*cos(diagonal)+uMotion.y*sin(diagonal))
        +0.3*uMotion.z*cos((field.x-field.y)*4.39822972);
    }
    // Move the light through a useful range even where masks are nearly
    // opaque or faint. The old opposing additive weights mostly cancelled.
    float gain=exp2(3.2*uMotion.w*signal);
    vec4 lit=a*gain/(1.0+a*(gain-1.0));
    if(uKind==2){
      a.yzw=lit.yzw; // Keep the enclosing slit mask fixed.
      float reflectionGain=exp2(1.4*uMotion.w*signal);
      b.x=b.x*reflectionGain/(1.0+b.x*(reflectionGain-1.0));
      float shadeGain=1.0/gain;
      b.z=b.z*shadeGain/(1.0+b.z*(shadeGain-1.0));
    }else{
      a.xyz=lit.xyz;
      float reflectionGain=exp2(1.4*uMotion.w*signal);
      a.w=a.w*reflectionGain/(1.0+a.w*(reflectionGain-1.0));
    }
  }
  vec3 color=uColors[0];
  if(uKind==2){
    // The source's three masked fields share one enclosing mask.
    vec3 rgb=uColors[1]*a.y;
    float alpha=a.y;
    rgb=uColors[2]*a.z+rgb*(1.0-a.z);alpha=a.z+alpha*(1.0-a.z);
    rgb=uColors[3]*a.w+rgb*(1.0-a.w);alpha=a.w+alpha*(1.0-a.w);
    color=rgb*a.x+color*(1.0-alpha*a.x);
    color=mix(color,uColors[4],b.x);
    color=mix(color,overlay(color,uColors[5]),b.y);
    // This luminance mask has no opaque black backing. Figma's isolated
    // shade export verifies that premultiplied luminance is multiplied by
    // alpha again (unlike the other masks' opaque black backing).
    color=mix(color,uColors[6],b.z*b.z);
  }else{
    color=mix(color,uColors[1],a.x);
    color=mix(color,uColors[2],a.y);
    color=mix(color,uColors[3],a.z);
    color=min(vec3(1.0),color+mix(uReflectionBase,uColors[4],a.w));
  }
  if(uToSrgb){
    // Reproduce the original export's 8-bit P3 presentation surface before
    // converting it. The gradients and compositing above remain floating point.
    color=floor(color*255.0+0.5)/255.0;
    vec3 linear=linearize(color);
    // Display P3 -> linear sRGB, then encode for the explicit sRGB canvas path.
    color=encode(mat3(1.224745,-0.042058,-0.019642,-0.224904,1.042081,-0.078655,0.0,0.0,1.098537)*linear);
  }
  result=vec4(color,1.0);
}`;
