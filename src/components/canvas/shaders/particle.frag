varying float vIntensity;
varying vec3 vColor;

void main() {
  // 円形パーティクル
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // エッジのソフトフェード
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  alpha *= 0.5 + vIntensity * 0.5;

  gl_FragColor = vec4(vColor, alpha);
}
