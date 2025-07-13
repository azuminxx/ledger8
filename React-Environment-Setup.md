# React環境構築手順メモ

## 1. 基本環境構築

### 1.1 プロジェクト構造
```
ledger8/
├── scripts/          # 既存バニラJS（参照用）
├── styles/           # 既存CSS（参照用）
├── react-app/        # 新しいReactアプリ
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── React-Migration-Plan.md
```

### 1.2 Reactアプリ作成
```bash
# ledger8フォルダ内で実行
npm create vite@latest react-app -- --template react-ts
cd react-app
npm install
```

### 1.3 必要なライブラリインストール
```bash
# 状態管理・API
npm install @tanstack/react-query zustand

# UI・テーブル
npm install react-virtuoso @tanstack/react-table

# ドラッグ&ドロップ
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# フォーム・UI
npm install react-select

# スタイリング
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 1.4 TypeScript設定
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 1.5 Tailwind CSS設定
```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 2. 開発サーバー起動

### 2.1 PowerShellでの起動方法
```powershell
# 方法1: 段階的実行
cd react-app
npm run dev

# 方法2: 一行で実行（PowerShellの場合）
cd react-app; npm run dev
```

### 2.2 開発サーバー確認
- URL: http://localhost:5173
- ホットリロード対応
- TypeScriptコンパイルエラーの即座表示

## 3. プロジェクト構成

### 3.1 ソースコード構造
```
react-app/src/
├── components/          # UIコンポーネント
│   ├── Search/         # 検索関連
│   ├── Table/          # テーブル関連
│   └── Modal/          # モーダル関連
├── services/           # ビジネスロジック
│   ├── api.ts          # API管理
│   ├── dataIntegration.ts  # データ統合
│   └── search.ts       # 検索処理
├── types/              # 型定義
│   ├── kintone.ts      # kintone関連型
│   ├── ledger.ts       # 台帳関連型
│   └── config.ts       # 設定関連型
├── config/             # 設定ファイル
│   └── appConfig.ts    # アプリ設定
├── hooks/              # カスタムフック
├── utils/              # ユーティリティ
└── App.tsx             # メインアプリ
```

### 3.2 主要ファイル
- **App.tsx**: メインアプリケーション
- **services/api.ts**: kintone API管理
- **services/dataIntegration.ts**: 台帳データ統合処理
- **services/search.ts**: 検索機能
- **types/**: 型定義ファイル群
- **config/appConfig.ts**: 既存config.jsの移行版

## 4. 実装済み機能

### 4.1 型定義システム
- KintoneRecord, LedgerRecord, AppConfig等の完全な型定義
- 既存の複雑なフィールド設定を型安全に移植
- 統合キー、検索条件、ページング情報等の型定義

### 4.2 API管理
- APIManagerクラス: 500件以上のレコード取得、バッチ更新、レコード作成
- React Query統合: キャッシュ管理、エラーハンドリング
- kintone API型定義: window.kintoneのグローバル型定義

### 4.3 データ統合処理
- DataIntegrationManagerクラス: 4つの台帳（PC、ユーザー、座席、内線）の統合処理
- 統合キー生成: 複数台帳の主キーを組み合わせた統合キー
- 3段階検索ロジック: 効率的な段階的検索で関連データを取得
- 生データ管理: 各台帳の生データを効率的にキャッシュ

### 4.4 検索機能
- SearchPanelコンポーネント: 台帳別にグループ化されたフィールド検索UI
- SearchManagerクラス: 検索条件をkintoneクエリ文字列に変換
- 複数条件組み合わせ: AND条件で複数フィールドを組み合わせ
- 検索条件の可視化と統計情報表示

### 4.5 Virtual Scrollingテーブル
- react-virtuosoを使用した大量データ対応テーブル
- セルタイプ別表示: text, dropdown, checkbox, link等
- 行選択機能とインライン編集の基盤
- 統合レコードの適切な表示

## 5. 次のステップ

### 5.1 未実装機能
- インライン編集機能（現在実装中）
- ドラッグ&ドロップ機能
- モーダル機能

### 5.2 パフォーマンス最適化
- Virtual Scrollingの調整
- メモリ使用量の最適化
- キャッシュ戦略の改善

## 6. トラブルシューティング

### 6.1 PowerShellでのコマンド実行
```powershell
# && が使えない場合は ; を使用
cd react-app; npm run dev

# または段階的に実行
cd react-app
npm run dev
```

### 6.2 よくあるエラー
- `npm error Missing script: "dev"`: react-appフォルダ内で実行していない
- TypeScriptエラー: 型定義の不整合、インポートパスの間違い
- kintone API未定義: window.kintoneの型定義が必要

## 7. 参考情報

### 7.1 使用ライブラリ
- **React 18**: メインフレームワーク
- **TypeScript**: 型安全性
- **Vite**: 高速ビルドツール
- **Tailwind CSS**: スタイリング
- **React Query**: API状態管理
- **Zustand**: グローバル状態管理
- **react-virtuoso**: Virtual Scrolling

### 7.2 設定ファイル
- `vite.config.ts`: Vite設定
- `tsconfig.json`: TypeScript設定
- `tailwind.config.js`: Tailwind設定
- `package.json`: 依存関係とスクリプト

---

**作成日**: 2025-01-13  
**更新日**: 2025-01-13  
**バージョン**: 1.0 