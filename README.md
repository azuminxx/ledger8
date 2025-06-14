# 統合台帳管理システム - ファイル構成

## プロジェクト概要

kintone上で動作する統合台帳管理システムです。複数の台帳（座席、PC、内線、ユーザー）を統合表示し、不整合チェック、セル操作、履歴管理などの機能を提供します。

## フォルダ構成

```
ledger8/
├── pages/           # HTMLページ
├── styles/          # CSSファイル
│   ├── components/  # コンポーネント別CSS
│   ├── features/    # 機能別CSS
│   └── themes/      # テーマ・基本スタイル
├── scripts/         # JavaScriptファイル
│   ├── core/        # 基本機能
│   ├── table/       # テーブル関連
│   ├── modal/       # モーダル関連
│   ├── features/    # 機能別スクリプト
│   └── utils/       # ユーティリティ
├── logs/            # ログファイル
├── docs/            # ドキュメント（空）
├── dest/            # ビルド成果物
├── .vscode/         # VSCode設定
└── .git/            # Git管理
```

## 各フォルダの詳細

### pages/ (2ファイル)
- `index.html` - メインページ（統合台帳システム）
- `history.html` - 更新履歴管理システム

### styles/ (14ファイル)

#### components/ (7ファイル)
- `table-styles.css` - テーブル基本スタイル (27KB)
- `table-interaction.css` - テーブル操作関連スタイル (11KB)
- `table-components.css` - テーブルコンポーネント (7KB)
- `table-pagination.css` - ページネーション (5KB)
- `modal-ui.css` - モーダル基本UI (15KB)
- `modal-add-record.css` - レコード追加モーダル (11KB)
- `modal-styles.css` - その他モーダルスタイル (0KB)

#### features/ (5ファイル)
- `auto-filter.css` - 自動フィルタ機能 (12KB)
- `inconsistency.css` - 不整合チェック機能 (2KB)
- `feature-styles.css` - その他機能スタイル (12KB)
- `history.css` - 履歴管理機能 (20KB)
- `table-styles.css` - テーブル機能スタイル (27KB) ※重複

#### themes/ (2ファイル)
- `table-base.css` - テーブル基本テーマ (13KB)
- `table-theme.css` - テーブルテーマ設定 (5KB)

### scripts/ (14ファイル)

#### core/ (2ファイル)
- `core.js` - システム基本機能 (49KB)
- `config.js` - 設定ファイル (16KB)

#### table/ (6ファイル)
- `table-render.js` - テーブル描画・不整合チェック (78KB)
- `table-header.js` - テーブルヘッダー管理 (55KB)
- `table-pagination.js` - ページネーション機能 (38KB)
- `table-events.js` - テーブルイベント処理 (9KB)
- `cell-swap.js` - セル交換機能 (59KB)
- `cell-selection.js` - セル選択機能 (30KB)

#### modal/ (2ファイル)
- `modal-manager.js` - モーダル管理 (48KB)
- `modal-add-record.js` - レコード追加モーダル (33KB)

#### features/ (3ファイル)
- `auto-filter.js` - 自動フィルタ機能 (84KB)
- `history.js` - 履歴管理機能 (54KB)
- `background-process-monitor.js` - バックグラウンド処理監視 (15KB)

#### utils/ (1ファイル)
- `utils.js` - 共通ユーティリティ関数 (42KB)

### その他
- `logs/console_result.log` - システムログ (436KB)
- `dest/customize-manifest.json` - kintoneカスタマイズマニフェスト
- `customize-uploader.bat` - アップロードスクリプト
- `package-lock.json` - npm依存関係
- `.gitignore` - Git除外設定

## 主要機能

1. **統合台帳管理** - 複数台帳の統合表示・編集
2. **不整合チェック** - 台帳間の不整合検出・テーブル表示
3. **セル操作** - セル交換、分離、統合機能
4. **自動フィルタ** - 高度な検索・フィルタ機能
5. **履歴管理** - 更新履歴の追跡・申請管理
6. **モーダル操作** - レコード追加・編集UI
7. **ページネーション** - 大量データの効率的表示
8. **バックグラウンド処理** - 非同期処理の監視

## 技術仕様

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **プラットフォーム**: kintone
- **ファイル制限**: 30ファイル以内（kintone制限）
- **文字数制限**: 各ファイル1万文字以内（kintone制限）
- **総ファイル数**: 30ファイル（HTML: 2, CSS: 14, JS: 14）
- **総コード量**: 約700KB

## 開発ガイドライン

1. **ファイル分割**: 機能別・役割別にファイルを分割
2. **命名規則**: 機能を表す明確な名前を使用
3. **依存関係**: core → utils → components → features の順序
4. **スタイル**: themes → components → features の順序で読み込み
5. **コード品質**: console.logの削除、エラーハンドリングの実装
6. **パフォーマンス**: 大量データ処理の最適化

## 注意事項

- `styles/features/table-styles.css`と`styles/components/table-styles.css`が重複しています
- `modal-styles.css`は空ファイルです
- kintoneの制限により、各ファイルは1万文字以内に収める必要があります
- 本システムはkintone環境での動作を前提としています

## バージョン履歴

- **v2.3.1**: 不整合チェックのテーブル表示機能追加
- **v2.3.0**: 履歴管理システム追加
- **v2.2.0**: セル交換・分離機能追加
- **v2.1.0**: 自動フィルタ機能強化
- **v2.0.0**: フォルダ構成整理・機能分割 


統合前（10個）→ 統合後（4個）
├── table-styles.css ← table-base.css + table-components.css + table-theme.css + table-interaction.css + table-pagination.css
├── modal-styles.css ← modal-ui.css + modal-add-record.css
├── feature-styles.css ← auto-filter.css + inconsistency.css
└── history.css（独立維持）