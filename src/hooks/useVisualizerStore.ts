import { create } from "zustand";
import type {
  AudioAnalysisData,
  VisualizerMode,
  VisualizerParams,
} from "@/types/audio";

interface VisualizerState {
  // 音声解析データ
  audioData: AudioAnalysisData;
  setAudioData: (data: Partial<AudioAnalysisData>) => void;

  // ビジュアルモード
  mode: VisualizerMode;
  setMode: (mode: VisualizerMode) => void;

  // パラメータ
  params: VisualizerParams;
  setParams: (params: Partial<VisualizerParams>) => void;

  // 再生状態
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;

  // フルスクリーン
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  audioData: {
    frequencyData: new Uint8Array(0),
    waveformData: new Uint8Array(0),
    bands: { low: 0, mid: 0, high: 0 },
    volume: 0,
    beat: false,
    bpm: 0,
  },
  setAudioData: (data) =>
    set((state) => ({
      audioData: { ...state.audioData, ...data },
    })),

  mode: "particle",
  setMode: (mode) => set({ mode }),

  params: {
    intensity: 0.7,
    speed: 1.0,
    colorShift: 0.0,
    complexity: 0.5,
  },
  setParams: (params) =>
    set((state) => ({
      params: { ...state.params, ...params },
    })),

  isPlaying: false,
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  isFullscreen: false,
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
}));
