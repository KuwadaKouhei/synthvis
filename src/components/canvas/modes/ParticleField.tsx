"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import vertexShader from "../shaders/particle.vert";
import fragmentShader from "../shaders/particle.frag";

const PARTICLE_COUNT = 3000;

export function ParticleField() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const bands = useVisualizerStore((s) => s.audioData.bands);
  const params = useVisualizerStore((s) => s.params);

  const { positionAttr, randomAttr } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const randoms = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      randoms[i] = Math.random();
    }

    return {
      positionAttr: new THREE.BufferAttribute(positions, 3),
      randomAttr: new THREE.BufferAttribute(randoms, 1),
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLow: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uIntensity: { value: 0.7 },
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
    u.uIntensity.value = params.intensity;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positionAttr.array, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[randomAttr.array, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
