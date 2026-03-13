# SynthVis - 音楽ビジュアライザー

## プロジェクト概要

音楽をリアルタイムに解析し、3Dジェネラティブアートとして描画するインタラクティブWebアプリケーション。
ユーザーが音楽ファイルをアップロード（またはマイク入力・デモ楽曲を選択）すると、音の周波数・ビート・波形に連動して3Dビジュアルがリアルタイム生成される。

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (strict mode)
- **3D描画**: React Three Fiber (@react-three/fiber) + drei (@react-three/drei)
- **シェーダー**: カスタム GLSL (vertex / fragment)
- **状態管理**: Zustand
- **UIアニメーション**: Framer Motion
- **スタイリング**: Tailwind CSS
- **音声解析**: Web Audio API (AnalyserNode)
- **デプロイ**: Vercel
- **パッケージマネージャ**: pnpm

## ディレクトリ構成

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # ルートレイアウト（メタ情報・フォント）
│   └── page.tsx                # メインページ（Canvas + UI）
├── components/
│   ├── canvas/                 # 3Dシーン関連
│   │   ├── Scene.tsx           # R3F Canvas + シーン設定
│   │   ├── modes/              # ビジュアルモード
│   │   │   ├── ParticleField.tsx    # モード1: パーティクルフィールド
│   │   │   ├── GeometryWarp.tsx     # モード2: ジオメトリワープ
│   │   │   └── NoiseLandscape.tsx   # モード3: ノイズランドスケープ
│   │   └── shaders/            # GLSLシェーダーファイル
│   │       ├── particle.vert
│   │       ├── particle.frag
│   │       ├── warp.vert
│   │       ├── warp.frag
│   │       ├── landscape.vert
│   │       └── landscape.frag
│   └── ui/                     # 2D UIコンポーネント
│       ├── ControlPanel.tsx    # メインコントロールパネル
│       ├── AudioUploader.tsx   # 音声ファイルアップロード
│       ├── ModeSelector.tsx    # ビジュアルモード切替
│       └── ParameterSlider.tsx # パラメータ調整スライダー
├── hooks/
│   ├── useAudioAnalyser.ts     # Web Audio API解析フック
│   ├── useBeatDetection.ts     # BPM検出フック
│   └── useVisualizerStore.ts   # Zustand ストア定義
├── lib/
│   ├── audio/
│   │   └── frequencyBands.ts   # 周波数帯分離ロジック（低/中/高）
│   └── math/
│       └── noise.ts            # Perlinノイズユーティリティ
└── types/
    └── audio.d.ts              # 音声関連の型定義
```

## コーディング規約

- コンポーネントは関数コンポーネント + React.FC は使わない（props の型を直接定義）
- hooks は `use` プレフィックス
- 型定義は `types/` に集約。コンポーネント固有の props 型はコンポーネントファイル内に定義
- GLSLファイルは `.vert` / `.frag` 拡張子。raw importで読み込み
- Zustand ストアは slice パターンで分割
- Tailwind CSS のユーティリティクラス優先。カスタムCSSは最小限
- コメントは日本語OK

## 重要な設計判断

### 音声解析アーキテクチャ
- `useAudioAnalyser` フックが Web Audio API の `AnalyserNode` をラップ
- FFTデータは毎フレーム `getByteFrequencyData()` で取得
- 周波数帯は3分割: 低音(20-250Hz), 中音(250-4kHz), 高音(4kHz-20kHz)
- 各帯域の平均強度を正規化(0-1)して Zustand ストアに格納
- R3Fの `useFrame` 内でストアの値を参照してビジュアルを駆動

### 3Dビジュアルモード
1. **ParticleField**: InstancedMesh + BufferGeometry。シェーダーで位置・サイズ・色を制御
2. **GeometryWarp**: IcosahedronGeometry を vertex shader で変形。ビートで膨張・収縮
3. **NoiseLandscape**: PlaneGeometry の頂点を Perlin ノイズ + 音声データで変位

### パフォーマンス目標
- 60fps 維持（requestAnimationFrame ベース）
- パーティクル数は動的調整（デバイス性能に応じて 1000〜5000）
- R3F の `frameloop="demand"` は使わない（常時アニメーション）

## よく使うコマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # プロダクションビルド
pnpm lint         # ESLint実行
pnpm type-check   # tsc --noEmit
```
