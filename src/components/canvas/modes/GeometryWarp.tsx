"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import vertexShader from "../shaders/warp.vert";
import fragmentShader from "../shaders/warp.frag";

export function GeometryWarp() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const bands = useVisualizerStore((s) => s.audioData.bands);
  const beat = useVisualizerStore((s) => s.audioData.beat);
  const params = useVisualizerStore((s) => s.params);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLow: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uBeat: { value: 0 },
      uIntensity: { value: 0.7 },
      uColorShift: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    u.uTime.value += delta * params.speed;
    u.uLow.value = bands.low;
    u.uMid.value = bands.mid;
    u.uHigh.value = bands.high;
    u.uBeat.value = beat ? 1.0 : 0.0;
    u.uIntensity.value = params.intensity;
    u.uColorShift.value = params.colorShift;
  });

  return (
    <mesh>
      <icosahedronGeometry args={[1.5, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
