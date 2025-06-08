 # 行番号による変更差分検出機能 実装計画


まだ統合キーベース
❌ 統合キーベース初期状態管理 (initialStates)
❌ 統合キーベース分離フィールド管理 (separatedFields)
❌ 統合キーベースレコードID管理 (recordIds)
❌ 手動入力監視での統合キー参照
❌ データ管理での統合キー依存
❌ セル交換での統合キー処理

🚀 作業実行の優先順位
Phase 7-1: 最重要 - 初期状態管理の重複排除
Phase 7-2: 重要 - 分離フィールド管理の重複排除
Phase 7-3: 中程度 - レコードID管理の統合
Phase 7-4: 中程度 - 統合キー生成機能の廃止
Phase 7-5: 低 - UI要素のクリーンアップ
Phase 7-6: 低 - 診断機能のクリーンアップ


セル変更検出 - 統合キーベースの初期状態比較
ハイライト表示 - 変更されたセルの視覚的フィードバック
分離処理 - 分離後の初期状態管理
セル交換 - 交換後の状態継承
手動入力監視 - 入力時の初期状態チェック
データ管理 - テーブル更新時の状態管理

## 📋 プロジェクト概要

### 目的
行番号を活用して、テーブル内の各行の変更差分を検出し、ユーザーに視覚的にフィードバックする機能を実装する。

### 背景
- 現在、セル交換時のハイライト解除が不安定
- 行の変更状態が分かりにくい
- どの行が編集されたか追跡が困難

## 🎯 実装済みの基盤機能

### ✅ 行番号システム
- グローバルカウンター（`globalRowCounter`）による固有番号管理
- `data-row-id`属性による行の一意識別
- 行番号列の表示（🔢アイコン、幅20px）

### ✅ 初期状態管理システム
- `window.cellStateManager`による初期状態保存
- `initialStates` Map での行ごとの初期値管理
- `modifiedCells` Set での変更セル追跡

## 🚀 実装予定機能

### Phase 1: 行レベル変更検出システム

#### 1.1 行変更状態管理クラス
```javascript
class RowChangeDetector {
  constructor() {
    this.initialRowStates = new Map();    // 行番号 → 初期状態
    this.currentRowStates = new Map();    // 行番号 → 現在状態
    this.changedRows = new Set();         // 変更された行番号のセット
  }
}
```

#### 1.2 行の初期状態保存
- 検索結果表示時に各行の全セル値を保存
- `data-row-id`をキーとして状態管理
- セル値、統合キー、レコードIDを含む包括的状態

#### 1.3 変更検出ロジック
- セル値変更時のイベントフック
- 行全体の状態比較関数
- リアルタイム変更検出

### Phase 2: 視覚的フィードバック機能

#### 2.1 行番号列での変更表示
- 変更ありの行：行番号を赤色で表示
- 変更なしの行：行番号をグレーで表示
- アイコン追加：変更行に警告マーク（⚠️）

#### 2.2 行全体のハイライト
- 変更行の背景色を薄い黄色に変更
- ホバー時の強調表示
- 変更箇所の境界線強調

#### 2.3 変更サマリー表示
- 「変更行数: X行」の表示
- 変更行へのジャンプ機能
- 一括リセット機能

### Phase 3: 高度な差分管理

#### 3.1 変更履歴機能
- 変更前後の値を保持
- 変更日時の記録
- undo/redo 機能の基盤

#### 3.2 変更タイプ分類
- `CELL_VALUE_CHANGED`: セル値の変更
- `ROW_POSITION_CHANGED`: 行位置の変更（ドラッグ&ドロップ）
- `CELL_EXCHANGED`: セル交換による変更

#### 3.3 バッチ変更検出
- 複数セルの同時変更検出
- セル交換時の一括変更処理
- パフォーマンス最適化

## 🔧 技術実装詳細

### データ構造設計

#### 行状態オブジェクト
```javascript
const rowState = {
  rowId: 1,                           // 行番号
  integrationKey: "SEAT:池袋19F-A1542|PC:PCAIT23N1542|EXT:701542|USER:BSS1542",
  cells: {
    seat_number: "池袋19F-A1542",
    pc_asset_no: "PCAIT23N1542",
    // ... 全セルの値
  },
  position: 0,                        // テーブル内の位置
  lastModified: new Date(),
  changeType: null
};
```

#### 変更検出アルゴリズム
```javascript
function detectRowChanges(rowId) {
  const initial = initialRowStates.get(rowId);
  const current = getCurrentRowState(rowId);
  
  // セル値比較
  const changedCells = [];
  for (const [fieldCode, initialValue] of Object.entries(initial.cells)) {
    if (current.cells[fieldCode] !== initialValue) {
      changedCells.push({
        fieldCode,
        oldValue: initialValue,
        newValue: current.cells[fieldCode]
      });
    }
  }
  
  return {
    hasChanges: changedCells.length > 0,
    changedCells,
    changeType: determineChangeType(changedCells)
  };
}
```

### UI更新ロジック

#### 行番号列の更新
```javascript
function updateRowNumberDisplay(rowId, hasChanges) {
  const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
  const rowNumberCell = row.querySelector('.row-number-cell');
  
  if (hasChanges) {
    rowNumberCell.style.color = '#dc3545';        // 赤色
    rowNumberCell.style.fontWeight = 'bold';
    rowNumberCell.innerHTML = `${rowId} ⚠️`;
  } else {
    rowNumberCell.style.color = '#6c757d';        // グレー
    rowNumberCell.style.fontWeight = 'normal';
    rowNumberCell.textContent = rowId;
  }
}
```

#### 行全体のハイライト
```javascript
function updateRowHighlight(rowId, hasChanges) {
  const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
  
  if (hasChanges) {
    row.classList.add('row-modified');
    row.style.backgroundColor = '#fff3cd';        // 薄い黄色
    row.style.borderLeft = '3px solid #ffc107';   // 左境界線
  } else {
    row.classList.remove('row-modified');
    row.style.backgroundColor = '';
    row.style.borderLeft = '';
  }
}
```

## 📁 ファイル構成

### 新規作成予定ファイル
- `16-row-change-detector.js`: 変更検出メインロジック
- `17-change-visualizer.js`: 視覚的フィードバック機能
- `row-change-styles.css`: 変更表示用スタイル

### 既存ファイル修正予定
- `11-api-data-manager.js`: 初期状態保存タイミング追加
- `10-table-components.js`: セル変更イベントフック追加
- `13-main.js`: 変更管理システム初期化

## ⚡ パフォーマンス考慮事項

### 最適化ポイント
1. **差分計算の最適化**
   - 変更されたセルのみを比較
   - debounce による処理頻度制限

2. **DOM更新の最適化**
   - バッチ更新でリフロー削減
   - 仮想化による大量行対応

3. **メモリ管理**
   - 不要な状態データの定期削除
   - WeakMap使用による自動ガベージコレクション

## 🧪 テストケース

### 基本動作テスト
- [ ] 行番号による行の特定
- [ ] 初期状態の正確な保存
- [ ] セル値変更の検出
- [ ] 視覚的フィードバックの表示

### 複合操作テスト
- [ ] セル交換後の変更検出
- [ ] 行ドラッグ&ドロップ後の状態管理
- [ ] 複数行同時変更の処理

### エッジケーステスト
- [ ] 大量データでのパフォーマンス
- [ ] 統合レコードの変更検出
- [ ] 分離行作成時の状態管理

## 📅 実装スケジュール

### Week 1: Phase 1 実装
- 行変更検出システムの基盤構築
- 初期状態保存機能の拡張

### Week 2: Phase 2 実装
- 視覚的フィードバック機能
- 行番号列の変更表示

### Week 3: Phase 3 実装
- 高度な差分管理機能
- パフォーマンス最適化

### Week 4: テスト・調整
- 統合テスト
- UI/UX調整
- バグ修正

## 🎯 成功指標

1. **機能性**
   - 全ての行変更を正確に検出
   - リアルタイムでの視覚的フィードバック
   - パフォーマンス劣化なし

2. **ユーザビリティ**
   - 変更行の一目での識別
   - 直感的な操作性
   - エラー発生率の削減

3. **保守性**
   - クリーンなコード構造
   - 十分なテストカバレッジ
   - 明確なドキュメント

---

> **注意**: この計画は行番号機能の実装完了を前提としています。実装中に仕様変更や技術的課題が発生した場合は、適宜このドキュメントを更新してください。