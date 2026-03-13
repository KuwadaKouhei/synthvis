"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import vertexShader from "../shaders/landscape.vert";
import fragmentShader from "../shaders/landscape.frag";

export function NoiseLandscape() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const bands = useVisualizerStore((s) => s.audioData.bands);
  const params = useVisualizerStore((s) => s.params);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLow: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uSpeed: { value: 1.0 },
      uComplexity: { value: 0.5 },
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
    u.uSpeed.value = params.speed;
    u.uComplexity.value = params.complexity;
    u.uColorShift.value = params.colorShift;
  });

  return (
    <mesh rotation={[-Math.PI / 3, 0, 0]}>
      <planeGeometry args={[10, 10, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
}
