import { useRef, useCallback } from "react";
import { useVisualizerStore } from "./useVisualizerStore";

/**
 * 簡易ビート検出: 低音域のエネルギーが閾値を超えたらビートとみなす
 * より精密なBPM検出は将来的にオートコリレーション法に置き換え可能
 */
export function useBeatDetection() {
  const energyHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef(0);
  const beatIntervalsRef = useRef<number[]>([]);

  const { setAudioData } = useVisualizerStore();

  const detectBeat = useCallback(
    (lowEnergy: number) => {
      const now = performance.now();
      const history = energyHistoryRef.current;

      history.push(lowEnergy);
      if (history.length > 60) history.shift(); // 約1秒分保持

      // 平均エネルギーとの比較でビート検出
      const avg = history.reduce((a, b) => a + b, 0) / history.length;
      const threshold = avg * 1.4; // 平均の1.4倍を閾値
      const minInterval = 200; // 最小ビート間隔(ms)

      const isBeat =
        lowEnergy > threshold && now - lastBeatTimeRef.current > minInterval;

      if (isBeat) {
        const interval = now - lastBeatTimeRef.current;
        lastBeatTimeRef.current = now;

        if (interval > 0 && interval < 2000) {
          beatIntervalsRef.current.push(interval);
          if (beatIntervalsRef.current.length > 16) {
            beatIntervalsRef.current.shift();
          }
        }

        // BPM計算
        const intervals = beatIntervalsRef.current;
        if (intervals.length >= 4) {
          const avgInterval =
            intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const bpm = Math.round(60000 / avgInterval);
          setAudioData({ bpm: Math.max(60, Math.min(200, bpm)) });
        }
      }

      setAudioData({ beat: isBeat });
    },
    [setAudioData]
  );

  return { detectBeat };
}
