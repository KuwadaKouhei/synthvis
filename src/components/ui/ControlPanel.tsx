"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import { ParameterSlider } from "./ParameterSlider";

export function ControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const params = useVisualizerStore((s) => s.params);
  const setParams = useVisualizerStore((s) => s.setParams);
  const setIsFullscreen = useVisualizerStore((s) => s.setIsFullscreen);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [setIsFullscreen]);

  return (
    <>
      {/* トグルボタン */}
      <motion.button
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-colors"
        title="設定"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </motion.button>

      {/* パネル */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-16 sm:right-6 z-20 w-full sm:w-64 bg-black/80 sm:bg-black/60 backdrop-blur-md sm:rounded-xl rounded-t-xl border border-white/10 p-4"
          >
            <h3 className="text-sm font-medium text-white/80 mb-4">
              パラメータ
            </h3>

            <div className="flex flex-col gap-4">
              <ParameterSlider
                label="Intensity"
                value={params.intensity}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setParams({ intensity: v })}
              />
              <ParameterSlider
                label="Speed"
                value={params.speed}
                min={0.1}
                max={3}
                step={0.1}
                onChange={(v) => setParams({ speed: v })}
              />
              <ParameterSlider
                label="Color Shift"
                value={params.colorShift}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setParams({ colorShift: v })}
              />
              <ParameterSlider
                label="Complexity"
                value={params.complexity}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setParams({ complexity: v })}
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm transition-colors"
            >
              フルスクリーン
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
