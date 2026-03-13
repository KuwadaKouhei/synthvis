uniform float uTime;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uSpeed;
uniform float uComplexity;

varying float vElevation;
varying vec2 vUv;

// 2D Simplex Noise (by Ian McEwan, Ashima Arts)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
   -0.577350269189626,   // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );

  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

void main() {
  vUv = uv;

  vec3 pos = position;

  // 多層ノイズで地形生成
  float elevation = 0.0;
  float freq = 1.0 + uComplexity * 3.0;
  float amp = 0.5 + uLow * 1.5;

  elevation += snoise(vec2(pos.x * freq + uTime * uSpeed * 0.1, pos.z * freq)) * amp;
  elevation += snoise(vec2(pos.x * freq * 2.0, pos.z * freq * 2.0 + uTime * uSpeed * 0.15)) * amp * 0.5;
  elevation += snoise(vec2(pos.x * freq * 4.0 + uTime * uSpeed * 0.05, pos.z * freq * 4.0)) * amp * 0.25;

  // 中音で波紋を追加
  elevation += sin(length(pos.xz) * 3.0 - uTime * 2.0) * uMid * 0.3;

  pos.y = elevation;
  vElevation = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
