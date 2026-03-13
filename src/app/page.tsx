"use client";

import dynamic from "next/dynamic";
import { ControlPanel } from "@/components/ui/ControlPanel";
import { BottomNav } from "@/components/ui/BottomNav";

// R3F CanvasはSSR不可のためdynamic import
const Scene = dynamic(
  () => import("@/components/canvas/Scene").then((mod) => mod.Scene),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3Dキャンバス（全画面） */}
      <Scene />

      {/* UIオーバーレイ */}
      <ControlPanel />
      <BottomNav />
    </div>
  );
}
