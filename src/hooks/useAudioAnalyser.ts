import { useRef, useCallback, useEffect } from "react";
import { useVisualizerStore } from "./useVisualizerStore";
import { extractFrequencyBands } from "@/lib/audio/frequencyBands";

interface UseAudioAnalyserReturn {
  connectFile: (file: File) => Promise<void>;
  connectMicrophone: () => Promise<void>;
  connectDemo: (url: string) => Promise<void>;
  disconnect: () => void;
  audioElement: React.RefObject<HTMLAudioElement | null>;
}

export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null
  >(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const rafIdRef = useRef<number>(0);

  const { setAudioData, setIsPlaying } = useVisualizerStore();

  const initContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    return { ctx: audioContextRef.current, analyser: analyserRef.current };
  }, []);

  const startAnalysis = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;
    if (!analyser || !ctx) return;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const waveformData = new Uint8Array(analyser.frequencyBinCount);

    const analyze = () => {
      analyser.getByteFrequencyData(frequencyData);
      analyser.getByteTimeDomainData(waveformData);

      const bands = extractFrequencyBands(
        frequencyData,
        ctx.sampleRate,
        analyser.fftSize
      );

      // 全体音量
      const volume =
        frequencyData.reduce((sum, val) => sum + val, 0) /
        (frequencyData.length * 255);

      setAudioData({
        frequencyData: new Uint8Array(frequencyData),
        waveformData: new Uint8Array(waveformData),
        bands,
        volume,
      });

      rafIdRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, [setAudioData]);

  const disconnect = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    setIsPlaying(false);
  }, [setIsPlaying]);

  // 音声ファイル接続
  const connectFile = useCallback(
    async (file: File) => {
      disconnect();
      const { ctx, analyser } = initContext();

      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audioElementRef.current = audio;

      // MediaElementSourceは同一要素に対して1度しか作成できない
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      sourceRef.current = source;

      await ctx.resume();
      await audio.play();
      setIsPlaying(true);
      startAnalysis();
    },
    [disconnect, initContext, startAnalysis, setIsPlaying]
  );

  // マイク接続
  const connectMicrophone = useCallback(async () => {
    disconnect();
    const { ctx, analyser } = initContext();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    await ctx.resume();
    setIsPlaying(true);
    startAnalysis();
  }, [disconnect, initContext, startAnalysis, setIsPlaying]);

  // デモ楽曲接続
  const connectDemo = useCallback(
    async (url: string) => {
      disconnect();
      const { ctx, analyser } = initContext();

      const audio = new Audio(url);
      audio.crossOrigin = "anonymous";
      audioElementRef.current = audio;

      const source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      sourceRef.current = source;

      await ctx.resume();
      await audio.play();
      setIsPlaying(true);
      startAnalysis();
    },
    [disconnect, initContext, startAnalysis, setIsPlaying]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
    };
  }, []);

  return {
    connectFile,
    connectMicrophone,
    connectDemo,
    disconnect,
    audioElement: audioElementRef,
  };
}
