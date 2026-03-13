import type { FrequencyBands } from "@/types/audio";

/**
 * FFTデータから3つの周波数帯域に分離し正規化する
 * sampleRate: AudioContextのサンプルレート（通常 44100 or 48000）
 * fftSize: AnalyserNodeのfftSize（通常 2048）
 */
export function extractFrequencyBands(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number
): FrequencyBands {
  const nyquist = sampleRate / 2;
  const binCount = frequencyData.length;
  const binWidth = nyquist / binCount;

  // 周波数帯域のインデックス範囲を計算
  const lowEnd = Math.floor(250 / binWidth);
  const midEnd = Math.floor(4000 / binWidth);

  const low = averageRange(frequencyData, 0, lowEnd);
  const mid = averageRange(frequencyData, lowEnd, midEnd);
  const high = averageRange(frequencyData, midEnd, binCount);

  return {
    low: low / 255,
    mid: mid / 255,
    high: high / 255,
  };
}

function averageRange(data: Uint8Array, start: number, end: number): number {
  if (start >= end) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += data[i];
  }
  return sum / (end - start);
}
