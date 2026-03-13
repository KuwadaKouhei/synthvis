varying float vElevation;
varying vec2 vUv;

uniform float uColorShift;

void main() {
  // 標高に基づくグラデーション
  vec3 lowColor = vec3(0.05, 0.1, 0.3);   // 深い青
  vec3 midColor = vec3(0.1, 0.4, 0.5);    // ティール
  vec3 highColor = vec3(0.8, 0.3, 0.6);   // マゼンタ

  float t = clamp((vElevation + 1.0) * 0.5, 0.0, 1.0);

  vec3 color;
  if (t < 0.5) {
    color = mix(lowColor, midColor, t * 2.0);
  } else {
    color = mix(midColor, highColor, (t - 0.5) * 2.0);
  }

  // 色相シフト
  color = color + vec3(uColorShift * 0.3, -uColorShift * 0.1, uColorShift * 0.2);

  gl_FragColor = vec4(color, 1.0);
}
