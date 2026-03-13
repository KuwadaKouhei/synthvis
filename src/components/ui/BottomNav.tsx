"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import { ModeSelector } from "./ModeSelector";

const DEMO_TRACKS = [
  { name: "Spotlight", url: "/audio/bensound-spotlight.mp3" },
  { name: "Stylish Car", url: "/audio/bensound-stylishcar.mp3" },
];

export function BottomNav() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connectFile, connectMicrophone, connectDemo, disconnect } =
    useAudioAnalyser();
  const isPlaying = useVisualizerStore((s) => s.isPlaying);
  const volume = useVisualizerStore((s) => s.audioData.volume);
  const bpm = useVisualizerStore((s) => s.audioData.bpm);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      await connectFile(file);
    },
    [connectFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleMicrophone = useCallback(async () => {
    setFileName(null);
    await connectMicrophone();
  }, [connectMicrophone]);

  const handleDemo = useCallback(
    async (track: (typeof DEMO_TRACKS)[number]) => {
      setFileName(track.name);
      setShowDemoMenu(false);
      await connectDemo(track.url);
    },
    [connectDemo]
  );

  const handleStop = useCallback(() => {
    disconnect();
    setFileName(null);
  }, [disconnect]);

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", damping: 20 }}
      className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-2rem)] max-w-2xl"
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative bg-black/40 backdrop-blur-2xl rounded-2xl border transition-all duration-300 ${
          isDragging
            ? "border-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.15)]"
            : "border-white/[0.06]"
        }`}
      >
        {/* ネオングロー上部ライン */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="px-4 py-3 flex items-center gap-3">
          {/* 左: モードセレクター */}
          <ModeSelector />

          {/* 中央: セパレーター */}
          <div className="w-px h-8 bg-white/[0.06]" />

          {/* 中央〜右: オーディオコントロール */}
          <div className="flex-1 flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex items-center gap-3"
                >
                  {/* ビジュアライザーバー */}
                  <div className="flex gap-[2px] items-end h-5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <motion.div
                        key={i}
                        className="w-[3px] rounded-full bg-gradient-to-t from-cyan-500 to-fuchsia-500"
                        animate={{
                          height: ["3px", `${8 + Math.random() * 12}px`, "3px"],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>

                  {/* トラック名 & BPM */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/70 truncate font-medium">
                      {fileName || "マイク入力"}
                    </div>
                    {bpm > 0 && (
                      <div className="text-[9px] text-fuchsia-400/60 font-mono">
                        {bpm} BPM
                      </div>
                    )}
                  </div>

                  {/* ボリュームメーター */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500"
                        animate={{ width: `${volume * 100}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>
                  </div>

                  {/* 停止ボタン */}
                  <button
                    onClick={handleStop}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all duration-200"
                    title="停止"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex items-center gap-2"
                >
                  {/* デモ再生 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDemoMenu(!showDemoMenu)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/15 to-fuchsia-500/15 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400/80 hover:text-cyan-300 text-[11px] font-medium tracking-wide transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                    >
                      DEMO
                    </button>
                    <AnimatePresence>
                      {showDemoMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full mb-2 left-0 bg-black/80 backdrop-blur-xl rounded-xl border border-cyan-500/15 p-1 min-w-[150px]"
                        >
                          {DEMO_TRACKS.map((track) => (
                            <button
                              key={track.url}
                              onClick={() => handleDemo(track)}
                              className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-white/60 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-200"
                            >
                              {track.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ファイル選択 */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-dashed border-white/10 hover:border-cyan-500/30 text-white/30 hover:text-white/60 text-[11px] transition-all duration-300 text-center"
                  >
                    <span className="hidden sm:inline">
                      ファイルをドロップ or クリック
                    </span>
                    <span className="sm:hidden">ファイル選択</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </button>

                  {/* マイクボタン */}
                  <button
                    onClick={handleMicrophone}
                    className="p-2 rounded-lg bg-white/5 hover:bg-fuchsia-500/15 text-white/30 hover:text-fuchsia-400 transition-all duration-300 hover:shadow-[0_0_12px_rgba(232,121,249,0.15)]"
                    title="マイク入力"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
