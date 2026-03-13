# SynthVis 詳細設計書

## 実装フェーズと手順

このドキュメントはClaude Codeでの段階的な実装ガイドです。
各フェーズを順番に実行してください。

---

## Phase 1: プロジェクト初期化

### 1-1. Next.js プロジェクト作成

```bash
pnpm create next-app@latest synthvis --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd synthvis
```

### 1-2. 依存パッケージインストール

```bash
# 3D描画
pnpm add three @react-three/fiber @react-three/drei @react-three/postprocessing

# 状態管理
pnpm add zustand

# UIアニメーション
pnpm add framer-motion

# 型定義
pnpm add -D @types/three

# GLSLローダー（Next.js用）
pnpm add -D raw-loader
```

### 1-3. Next.js設定（next.config.ts）

GLSLファイルをraw textとしてインポートするためのwebpack設定:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
```

### 1-4. GLSL型宣言（src/types/glsl.d.ts）

```typescript
declare module "*.vert" {
  const value: string;
  export default value;
}
declare module "*.frag" {
  const value: string;
  export default value;
}
declare module "*.glsl" {
  const value: string;
  export default value;
}
```

---

## Phase 2: 音声解析エンジン

### 2-1. 型定義（src/types/audio.d.ts）

```typescript
export type AudioSource = "file" | "microphone" | "demo";

export interface FrequencyBands {
  low: number;    // 0-1 正規化済み (20-250Hz)
  mid: number;    // 0-1 正規化済み (250-4kHz)
  high: number;   // 0-1 正規化済み (4kHz-20kHz)
}

export interface AudioAnalysisData {
  frequencyData: Uint8Array;      // 生の周波数データ
  waveformData: Uint8Array;       // 波形データ
  bands: FrequencyBands;          // 3帯域の正規化値
  volume: number;                 // 全体音量 (0-1)
  beat: boolean;                  // ビート検出フラグ
  bpm: number;                    // 推定BPM
}

export type VisualizerMode = "particle" | "warp" | "landscape";

export interface VisualizerParams {
  intensity: number;     // ビジュアルの強さ (0-1)
  speed: number;         // アニメーション速度 (0.1-3)
  colorShift: number;    // 色相シフト (0-1)
  complexity: number;    // 複雑さ (0-1)
}
```

### 2-2. Zustand ストア（src/hooks/useVisualizerStore.ts）

```typescript
import { create } from "zustand";
import type { AudioAnalysisData, VisualizerMode, VisualizerParams } from "@/types/audio";

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
```

### 2-3. 周波数帯分離ロジック（src/lib/audio/frequencyBands.ts）

```typescript
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
```

### 2-4. useAudioAnalyser フック（src/hooks/useAudioAnalyser.ts）

```typescript
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
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null);
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
```

### 2-5. BPM検出フック（src/hooks/useBeatDetection.ts）

```typescript
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
```

---

## Phase 3: 3Dビジュアルモード実装

### 3-1. シーン設定（src/components/canvas/Scene.tsx）

```typescript
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import { Suspense } from "react";
import { useVisualizerStore } from "@/hooks/useVisualizerStore";
import { ParticleField } from "./modes/ParticleField";
import { GeometryWarp } from "./modes/GeometryWarp";
import { NoiseLandscape } from "./modes/NoiseLandscape";

function ModeRenderer() {
  const mode = useVisualizerStore((s) => s.mode);

  switch (mode) {
    case "particle":
      return <ParticleField />;
    case "warp":
      return <GeometryWarp />;
    case "landscape":
      return <NoiseLandscape />;
  }
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#050505"]} />
      <Suspense fallback={null}>
        <ModeRenderer />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
```

### 3-2. モード1: パーティクルフィールド

GLSLシェーダーで数千のパーティクルを描画。
各パーティクルの位置・サイズ・色が音声データに反応する。

**particle.vert:**
```glsl
uniform float uTime;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uIntensity;

attribute float aRandom;

varying float vIntensity;
varying vec3 vColor;

void main() {
  vec3 pos = position;

  // 低音でY方向に膨張
  pos.y += sin(pos.x * 2.0 + uTime) * uLow * uIntensity * 2.0;

  // 中音でX方向に揺れ
  pos.x += cos(pos.y * 3.0 + uTime * 0.8) * uMid * uIntensity;

  // 高音でZ方向に散乱
  pos.z += sin(aRandom * 6.28 + uTime * 1.5) * uHigh * uIntensity;

  // サイズ（低音で大きく）
  gl_PointSize = (4.0 + uLow * 12.0) * uIntensity;

  vIntensity = (uLow + uMid + uHigh) / 3.0;

  // 帯域ごとに色を割り当て（HSL的なマッピング）
  vColor = vec3(
    0.2 + uLow * 0.8,     // R: 低音
    0.1 + uMid * 0.6,     // G: 中音
    0.5 + uHigh * 0.5     // B: 高音
  );

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

**particle.frag:**
```glsl
varying float vIntensity;
varying vec3 vColor;

void main() {
  // 円形パーティクル
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  // エッジのソフトフェード
  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  alpha *= 0.5 + vIntensity * 0.5;

  gl_FragColor = vec4(vColor, alpha);
}
```

**ParticleField.tsx の実装方針:**
- `useMemo` で BufferGeometry にランダム位置とaRandom属性を設定
- `useFrame` 内で uniform を毎フレーム更新
- `shaderMaterial` でカスタムシェーダーを適用
- パーティクル数は 3000 をデフォルト

### 3-3. モード2: ジオメトリワープ

IcosahedronGeometry を vertex shader で音声駆動で変形。

**warp.vert:**
```glsl
uniform float uTime;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uBeat; // 0 or 1
uniform float uIntensity;

varying vec3 vNormal;
varying float vDisplacement;

// Simplex noise関数（別途noise.glslとして切り出し可能）
// ... （3D simplex noiseの実装をここに含める）

void main() {
  vNormal = normalize(normalMatrix * normal);

  // ノイズベースの変形
  float noise = snoise(position * 2.0 + uTime * 0.3);

  // 低音でグローバル膨張
  float displacement = noise * (0.2 + uLow * uIntensity * 1.5);

  // ビート検出時にパルス的に膨張
  displacement += uBeat * 0.3;

  // 高音で高周波の微細変形
  displacement += snoise(position * 8.0 + uTime) * uHigh * 0.3;

  vec3 newPosition = position + normal * displacement;
  vDisplacement = displacement;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
```

**warp.frag:**
```glsl
varying vec3 vNormal;
varying float vDisplacement;

uniform float uColorShift;

void main() {
  // 変位量に基づくカラーマッピング
  vec3 color = vec3(
    0.3 + vDisplacement * 2.0 + uColorShift,
    0.1 + abs(vDisplacement) * 1.5,
    0.8 - vDisplacement
  );

  // 簡易ライティング
  float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
  light = 0.5 + 0.5 * light;

  gl_FragColor = vec4(color * light, 1.0);
}
```

### 3-4. モード3: ノイズランドスケープ

PlaneGeometry の頂点をPerlinノイズ + 音声データで変位させた地形。

**landscape.vert:**
```glsl
uniform float uTime;
uniform float uLow;
uniform float uMid;
uniform float uHigh;
uniform float uSpeed;
uniform float uComplexity;

varying float vElevation;
varying vec2 vUv;

// Perlin noise（またはsimplex noise）をここに含める

void main() {
  vUv = uv;

  vec3 pos = position;

  // 多層ノイズで地形生成
  float elevation = 0.0;
  float freq = 1.0 + uComplexity * 3.0;
  float amp = 0.5 + uLow * 1.5;

  elevation += snoise(vec2(pos.x * freq + uTime * uSpeed * 0.1, pos.z * freq)) * amp;
  elevation += snoise(vec2(pos.x * freq * 2.0, pos.z * freq * 2.0 + uTime * uSpeed * 0.15)) * amp * 0.5;
  elevation += snoise(vec2(pos.x * freq * 4.0 + uTime * uSpeed * 0.05, pos.z * freq * 4.0)) * amp * 0.25;

  // 中音で波紋を追加
  elevation += sin(length(pos.xz) * 3.0 - uTime * 2.0) * uMid * 0.3;

  pos.y = elevation;
  vElevation = elevation;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

**landscape.frag:**
```glsl
varying float vElevation;
varying vec2 vUv;

uniform float uColorShift;

void main() {
  // 標高に基づくグラデーション
  vec3 lowColor = vec3(0.05, 0.1, 0.3);   // 深い青
  vec3 midColor = vec3(0.1, 0.4, 0.5);    // ティール
  vec3 highColor = vec3(0.8, 0.3, 0.6);   // マゼンタ

  float t = clamp((vElevation + 1.0) * 0.5, 0.0, 1.0);

  vec3 color;
  if (t < 0.5) {
    color = mix(lowColor, midColor, t * 2.0);
  } else {
    color = mix(midColor, highColor, (t - 0.5) * 2.0);
  }

  // 色相シフト
  color = color + vec3(uColorShift * 0.3, -uColorShift * 0.1, uColorShift * 0.2);

  gl_FragColor = vec4(color, 1.0);
}
```

---

## Phase 4: UIコンポーネント

### 4-1. メインページ構成（src/app/page.tsx）

```
レイアウト:
┌─────────────────────────────────┐
│          3D Canvas (全画面)       │
│                                  │
│  ┌──────────┐                   │
│  │ モード    │     (左上)        │
│  │ セレクタ  │                   │
│  └──────────┘                   │
│                                  │
│              ┌─────────────┐    │
│              │ コントロール  │    │
│              │ パネル       │(右) │
│              └─────────────┘    │
│                                  │
│  ┌──────────────────────────┐   │
│  │ オーディオプレーヤー / アップロード │(下) │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### 4-2. UIコンポーネント仕様

**AudioUploader.tsx:**
- ドラッグ&ドロップ対応のファイルアップロードエリア
- accept: audio/* (mp3, wav, ogg, flac)
- マイク入力ボタン
- デモ楽曲セレクト（2-3曲、著作権フリー楽曲を public/ に配置）

**ModeSelector.tsx:**
- 3つのモードを視覚的にプレビュー表示（アイコン or ミニサムネイル）
- Framer Motion でモード切替時にフェードトランジション
- キーボードショートカット: 1, 2, 3 キーで切替

**ControlPanel.tsx:**
- Framer Motion の AnimatePresence で開閉アニメーション
- スライダー: Intensity, Speed, Color Shift, Complexity
- フルスクリーンボタン
- 開閉トグルボタン（右端に配置）

**ParameterSlider.tsx:**
- min/max/step/label を props で受け取る汎用スライダー
- Tailwind CSS でスタイリング
- 値変更時にZustandストアを更新

### 4-3. Framer Motion トランジション仕様

```typescript
// モード切替時
const modeTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 },
  transition: { duration: 0.6, ease: "easeInOut" },
};

// コントロールパネル開閉
const panelTransition = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring", damping: 25, stiffness: 200 },
};
```

---

## Phase 5: 仕上げ・最適化

### 5-1. パフォーマンス最適化チェックリスト

- [ ] `useFrame` 内でオブジェクト生成しない（事前にrefで保持）
- [ ] `useMemo` でジオメトリ・マテリアルをメモ化
- [ ] パーティクル描画に InstancedMesh または Points を使用
- [ ] Zustand の selector で必要な値だけ購読（再レンダリング最小化）
- [ ] R3F の `dpr` を `[1, 2]` に設定（Retina対応しつつ上限設定）
- [ ] `dispose` でジオメトリ・マテリアルを適切に解放

### 5-2. レスポンシブ対応

- Canvas は position: absolute + inset: 0 で全画面
- UI要素は Tailwind の responsive クラスで調整
- モバイル: コントロールパネルを下部シート化
- タッチ操作: OrbitControls のタッチ対応は drei が自動処理

### 5-3. メタ情報・OGP（src/app/layout.tsx）

```typescript
export const metadata: Metadata = {
  title: "SynthVis - Interactive Music Visualizer",
  description: "リアルタイム音楽ビジュアライザー。音楽をアップロードして3Dジェネラティブアートを体験。",
  openGraph: {
    title: "SynthVis - Interactive Music Visualizer",
    description: "リアルタイム音楽ビジュアライザー",
    images: ["/og-image.png"],
  },
};
```

### 5-4. デプロイ

```bash
# Vercelにデプロイ
pnpm build   # ビルド確認
vercel        # デプロイ
```

### 5-5. README.md 構成

```markdown
# SynthVis 🎵✨

リアルタイム音楽ビジュアライザー

## デモ
[synthvis.vercel.app](https://synthvis.vercel.app)

## スクリーンショット
（3モードのGIFまたはスクリーンショット）

## 技術スタック
- Next.js 15 / TypeScript / React Three Fiber
- カスタムGLSLシェーダー / Web Audio API
- Zustand / Framer Motion / Tailwind CSS

## 機能
- 🎧 音楽ファイルアップロード / マイク入力
- 🎨 3つのビジュアルモード（パーティクル / ワープ / ランドスケープ）
- 🎛️ リアルタイムパラメータ調整
- 📱 レスポンシブ対応

## アーキテクチャ
（アーキテクチャ図）

## ローカル開発
\```bash
pnpm install
pnpm dev
\```

## ライセンス
MIT
```

---

## 補足: デモ楽曲について

著作権フリーの音源を `public/audio/` に配置する。
以下のようなサイトから入手可能:
- https://freemusicarchive.org/ (CC-BY等)
- https://incompetech.com/ (Kevin MacLeod)
- https://www.bensound.com/ (フリープラン)

2-3曲用意し、ジャンルを変えると各モードの違いが際立つ:
- エレクトロ/EDM系（ビートが強い → GeometryWarpが映える）
- アンビエント系（周波数が広い → NoiseLandscapeが映える）
- ポップ/ロック系（バランス型 → ParticleFieldが映える）
