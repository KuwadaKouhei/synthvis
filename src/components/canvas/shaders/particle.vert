uniform float uTime;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uIntensity;

attribute float aRandom;

varying float vIntensity;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  // 低音でY方向に膨張
  pos.y += sin(pos.x * 2.0 + uTime) * uLow * uIntensity * 2.0;

  // 中音でX方向に揺れ
  pos.x += cos(pos.y * 3.0 + uTime * 0.8) * uMid * uIntensity;

  // 高音でZ方向に散乱
  pos.z += sin(aRandom * 6.28 + uTime * 1.5) * uHigh * uIntensity;

  // サイズ（低音で大きく）
  gl_PointSize = (4.0 + uLow * 12.0) * uIntensity;

  vIntensity = (uLow + uMid + uHigh) / 3.0;

  // 帯域ごとに色を割り当て（HSL的なマッピング）
  vColor = vec3(
    0.2 + uLow * 0.8,     // R: 低音
    0.1 + uMid * 0.6,     // G: 中音
    0.5 + uHigh * 0.5     // B: 高音
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
