"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";

const DEMO_TRACKS = [
  { name: "Spotlight", url: "/audio/bensound-spotlight.mp3" },
  { name: "Stylish Car", url: "/audio/bensound-stylishcar.mp3" },
];

export function AudioUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { connectFile, connectMicrophone, connectDemo, disconnect } =
    useAudioAnalyser();
  const isPlaying = useVisualizerStore((s) => s.isPlaying);

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
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-2rem)]"
    >
      <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex items-center gap-3">
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              {/* 再生中インジケーター */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 items-end h-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-white/80 rounded-full"
                      animate={{
                        height: ["4px", "16px", "4px"],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
                <span className="text-sm text-white/80 max-w-[200px] truncate">
                  {fileName || "マイク入力"}
                </span>
              </div>
              <button
                onClick={handleStop}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
              >
                停止
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* デモ楽曲ボタン */}
              <div className="relative">
                <button
                  onClick={() => setShowDemoMenu(!showDemoMenu)}
                  className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white/90 text-sm transition-colors"
                >
                  デモ再生
                </button>
                <AnimatePresence>
                  {showDemoMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-full mb-2 left-0 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 p-1 min-w-[140px]"
                    >
                      {DEMO_TRACKS.map((track) => (
                        <button
                          key={track.url}
                          onClick={() => handleDemo(track)}
                          className="w-full text-left px-3 py-1.5 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {track.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ドラッグ&ドロップエリア */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`px-4 py-2 rounded-lg border border-dashed cursor-pointer transition-colors text-sm ${
                  isDragging
                    ? "border-white/60 bg-white/10 text-white"
                    : "border-white/20 hover:border-white/40 text-white/60 hover:text-white/80"
                }`}
              >
                <span className="hidden sm:inline">
                  音楽ファイルをドロップ / クリックで選択
                </span>
                <span className="sm:hidden">ファイルを選択</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* マイクボタン */}
              <button
                onClick={handleMicrophone}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                title="マイク入力"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
    </motion.div>
  );
}
