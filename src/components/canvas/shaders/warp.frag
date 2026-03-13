varying vec3 vNormal;
varying float vDisplacement;

uniform float uColorShift;

void main() {
  // 変位量に基づくカラーマッピング
  vec3 color = vec3(
    0.3 + vDisplacement * 2.0 + uColorShift,
    0.1 + abs(vDisplacement) * 1.5,
    0.8 - vDisplacement
  );

  // 簡易ライティング
  float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
  light = 0.5 + 0.5 * light;

  gl_FragColor = vec4(color * light, 1.0);
}
