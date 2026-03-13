export type AudioSource = "file" | "microphone" | "demo";

export interface FrequencyBands {
  low: number; // 0-1 正規化済み (20-250Hz)
  mid: number; // 0-1 正規化済み (250-4kHz)
  high: number; // 0-1 正規化済み (4kHz-20kHz)
}

export interface AudioAnalysisData {
  frequencyData: Uint8Array; // 生の周波数データ
  waveformData: Uint8Array; // 波形データ
  bands: FrequencyBands; // 3帯域の正規化値
  volume: number; // 全体音量 (0-1)
  beat: boolean; // ビート検出フラグ
  bpm: number; // 推定BPM
}

export type VisualizerMode = "particle" | "warp" | "landscape";

export interface VisualizerParams {
  intensity: number; // ビジュアルの強さ (0-1)
  speed: number; // アニメーション速度 (0.1-3)
  colorShift: number; // 色相シフト (0-1)
  complexity: number; // 複雑さ (0-1)
}
