"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import type { VisualizerMode } from "@/types/audio";

const modes: { key: VisualizerMode; label: string; shortcut: string }[] = [
  { key: "particle", label: "Particle", shortcut: "1" },
  { key: "warp", label: "Warp", shortcut: "2" },
  { key: "landscape", label: "Land", shortcut: "3" },
];

export function ModeSelector() {
  const mode = useVisualizerStore((s) => s.mode);
  const setMode = useVisualizerStore((s) => s.setMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "1":
          setMode("particle");
          break;
        case "2":
          setMode("warp");
          break;
        case "3":
          setMode("landscape");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setMode]);

  return (
    <div className="flex gap-1">
      {modes.map(({ key, label, shortcut }) => (
        <button
          key={key}
          onClick={() => setMode(key)}
          className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mode === key
              ? "text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {mode === key && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute inset-0 bg-white/15 rounded-lg"
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            />
          )}
          <span className="relative z-10">
            {label}
            <span className="ml-1 text-[9px] text-white/30">{shortcut}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
