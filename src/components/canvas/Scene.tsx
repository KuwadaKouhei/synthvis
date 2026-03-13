"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import { Suspense } from "react";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import { ParticleField } from "./modes/ParticleField";
import { GeometryWarp } from "./modes/GeometryWarp";
import { NoiseLandscape } from "./modes/NoiseLandscape";

function ModeRenderer() {
  const mode = useVisualizerStore((s) => s.mode);

  switch (mode) {
    case "particle":
      return <ParticleField />;
    case "warp":
      return <GeometryWarp />;
    case "landscape":
      return <NoiseLandscape />;
  }
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#050505"]} />
      <Suspense fallback={null}>
        <ModeRenderer />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
