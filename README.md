# SynthVis

リアルタイム音楽ビジュアライザー。音楽ファイルをアップロード、マイク入力、またはデモ楽曲を選択すると、音の周波数・ビート・波形に連動した3Dビジュアルがリアルタイムに生成されます。

**このアプリケーションはClaudeCodeを用いたAI駆動開発で行っております。**

## デモ

[synthvis.vercel.app](https://synthvis.vercel.app)

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router / Turbopack)
- **言語**: TypeScript (strict mode)
- **3D描画**: React Three Fiber + drei
- **シェーダー**: カスタム GLSL (vertex / fragment)
- **状態管理**: Zustand
- **UIアニメーション**: Framer Motion
- **スタイリング**: Tailwind CSS v4
- **音声解析**: Web Audio API (AnalyserNode)

## 機能

- **音声入力** — ファイルアップロード（D&D対応）/ マイク入力 / デモ楽曲
- **3つのビジュアルモード** — Particle / Warp / Landscape（キーボード 1・2・3 で切替）
- **リアルタイム解析** — FFT周波数帯分離（低/中/高）、BPM検出、ボリュームメーター
- **パラメータ調整** — Intensity / Speed / Color Shift / Complexity
- **レスポンシブ対応** — モバイル・デスクトップ両対応
- **フルスクリーン** — ブラウザフルスクリーンAPI対応

## ビジュアルモード

- **Particle** — 3000個のパーティクルがGLSLシェーダーで駆動。低音でY膨張、中音でX揺れ、高音でZ散乱
- **Warp** — Icosahedronをsimplex noiseで変形。ビート検出時にパルス的に膨張
- **Landscape** — PlaneGeometryの頂点をPerlinノイズ+音声データで変位させたワイヤーフレーム地形

## ローカル開発

```bash
pnpm install
pnpm dev
```

<http://localhost:3000> でアクセスできます。

### その他のコマンド

```bash
pnpm build        # プロダクションビルド
pnpm lint         # ESLint実行
```

## プロジェクト構成

```text
src/
├── app/                     # Next.js App Router
├── components/
│   ├── canvas/              # 3Dシーン・ビジュアルモード・GLSLシェーダー
│   └── ui/                  # UIコンポーネント（ControlPanel, BottomNav等）
├── hooks/                   # useAudioAnalyser, useBeatDetection, useVisualizerStore
├── lib/                     # 音声解析・数学ユーティリティ
└── types/                   # 型定義
```

## ライセンス

MIT

## デモ楽曲クレジット

デモ楽曲は [Bensound](https://www.bensound.com/) より使用しています。
