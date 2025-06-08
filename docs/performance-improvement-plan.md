# テーブルパフォーマンス改善計画

## 📋 **概要**

現在のテーブルで1500件以上のデータを表示すると、各行にinput、select、ボタンなどのDOM要素が配置されることでブラウザが重くなる問題を解決する。

## 🎯 **完成目標**

### ①初期表示の軽量化
- ブラウザを開いて検索時、テーブルの初期表示はプレーンテキストのみ
- input、select、ボタン、ドラッグ&ドロップ属性は非表示
- **オートフィルタのみ搭載**

### ②編集モード切り替えUI
- テーブル上部に**編集ボタン**を設置

### ③段階的編集機能
- 編集ボタン押下で各レコードの**2列目にチェックボックス**が表示
- チェックボックスにチェックを入れた行のみ編集可能になる

### ④編集機能の動的有効化
- チェック後に以下が有効化される：
  - input、select要素
  - ドラッグ&ドロップ属性
  - フィルハンドル
  - 分離ボタン
  - セル移動機能
  - スタイル変化（classの着脱）

---

## 📅 **実装計画**

### **Phase 1: 現状分析と軽量テーブルモードの設計**

#### **1-1. 現在のテーブル作成フローの調査**
- `09-api-data-manager.js` の `_renderRecords()`
- `08-table-components.js` の `TableElementFactory.createCell()`
- `08-table-components.js` の `SeparatedRowBuilder`

#### **1-2. 新しいモード管理システムの設計**
```javascript
// グローバル状態管理
window.TableEditMode = {
  isEditMode: false,           // 編集モードかどうか
  enabledRows: new Set(),      // 編集可能な行番号のセット
  isInitialLoad: true          // 初期読み込みかどうか
};
```

### **Phase 2: 軽量テーブル作成機能の実装**

#### **2-1. 軽量セル作成関数の追加**
```javascript
// 新しい軽量セル作成メソッド
class TableElementFactory {
  // 既存のcreateCell()はそのまま残す
  static createLightweightCell(field, value, record, appId) {
    const td = document.createElement("td");
    
    // 基本スタイルのみ適用
    StyleManager.applyCellClasses(td, field.width, false);
    td.setAttribute("data-field-code", field.fieldCode);
    
    // プレーンテキストのみ設定
    td.textContent = value || "";
    
    return td;
  }
}
```

#### **2-2. モード別レンダリング切り替え**
```javascript
// TableDataManager._renderRecords() を修正
_renderRecords(tbody, records, existingKeys, fieldOrder, selectedLedger, targetAppId) {
  records.forEach((record, index) => {
    // モードに応じてセル作成方法を切り替え
    if (window.TableEditMode?.isInitialLoad && !window.TableEditMode?.isEditMode) {
      // 軽量モード：プレーンテキストのみ
      td = TableElementFactory.createLightweightCell(field, value, record, targetAppId);
    } else {
      // 通常モード：既存の重い処理
      td = TableElementFactory.createCell(field, value, record, targetAppId);
    }
  });
}
```

### **Phase 3: 編集モード切り替えUIの実装**

#### **3-1. 編集ボタンの追加**
```javascript
// 13-main.js のLedgerSystemController に追加
class LedgerSystemController {
  _setupButtons() {
    // 既存のボタン設定
    this._createSearchButton();
    this._createClearButton();
    
    // 新規追加
    this._createEditModeButton();
  }
  
  _createEditModeButton() {
    const container = document.getElementById("button-container");
    const editButton = document.createElement("button");
    editButton.textContent = "編集モード";
    editButton.id = "edit-mode-button";
    editButton.addEventListener("click", () => this._toggleEditMode());
    container.appendChild(editButton);
  }
  
  _toggleEditMode() {
    if (!window.TableEditMode.isEditMode) {
      this._enableEditMode();
    } else {
      this._disableEditMode();
    }
  }
}
```

#### **3-2. チェックボックス列の動的追加**
```javascript
_enableEditMode() {
  window.TableEditMode.isEditMode = true;
  
  // 1. ヘッダーにチェックボックス列を追加
  this._addCheckboxColumn();
  
  // 2. 各行にチェックボックスセルを追加
  this._addCheckboxesToRows();
  
  // 3. ボタンテキストを変更
  document.getElementById("edit-mode-button").textContent = "表示モード";
}

_addCheckboxColumn() {
  const headerRow = document.getElementById("my-thead-row");
  const checkboxHeader = document.createElement("th");
  checkboxHeader.textContent = "編集";
  checkboxHeader.style.width = "50px";
  // 2列目に挿入（1列目は行番号）
  headerRow.insertBefore(checkboxHeader, headerRow.children[1]);
}

_addCheckboxesToRows() {
  const tbody = document.getElementById("my-tbody");
  const rows = tbody.querySelectorAll("tr[data-row-id]");
  
  rows.forEach(row => {
    const checkboxCell = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", (e) => this._onRowCheckboxChange(e, row));
    
    checkboxCell.appendChild(checkbox);
    // 2列目に挿入
    row.insertBefore(checkboxCell, row.children[1]);
  });
}
```

### **Phase 4: 行別編集機能の実装**

#### **4-1. チェックボックス変更ハンドラー**
```javascript
_onRowCheckboxChange(event, row) {
  const rowId = row.getAttribute("data-row-id");
  const isChecked = event.target.checked;
  
  if (isChecked) {
    // 編集可能にする
    this._enableRowEditing(row, rowId);
    window.TableEditMode.enabledRows.add(rowId);
  } else {
    // 編集不可にする
    this._disableRowEditing(row, rowId);
    window.TableEditMode.enabledRows.delete(rowId);
  }
}
```

#### **4-2. 行編集機能の動的有効化**
```javascript
_enableRowEditing(row, rowId) {
  // 1. プレーンテキストセルを編集可能セルに変換
  this._convertCellsToEditable(row);
  
  // 2. ドラッグ&ドロップ属性を追加
  this._enableDragAndDrop(row);
  
  // 3. 分離ボタンやフィルハンドルを追加
  this._addEditingFeatures(row);
  
  // 4. 編集モードのスタイルクラスを追加
  row.classList.add("row-editable");
}

_convertCellsToEditable(row) {
  const cells = row.querySelectorAll("td[data-field-code]");
  
  cells.forEach(cell => {
    const fieldCode = cell.getAttribute("data-field-code");
    const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
    
    if (field && this._shouldMakeEditable(field)) {
      // 現在の値を保持
      const currentValue = cell.textContent;
      
      // 編集可能な要素に置き換え
      if (field.cellType === "dropdown") {
        const select = TableElementFactory.createDropdown(field, currentValue);
        this._replaceCellContent(cell, select);
      } else if (field.cellType === "input") {
        const input = TableElementFactory.createInput(field, currentValue);
        this._replaceCellContent(cell, input);
      }
    }
  });
}
```

### **Phase 5: パフォーマンス最適化**

#### **5-1. 遅延ロード機能**
```javascript
// 大量データの場合は仮想スクロールまたはページング
_enableVirtualScrolling() {
  // 表示範囲のみレンダリング
  // 必要に応じて実装
}
```

#### **5-2. バッチ処理**
```javascript
// 複数行の一括編集モード切り替え
_batchEnableEditing(rowIds) {
  // requestAnimationFrameを使用した段階的処理
  const processChunk = (startIndex) => {
    const endIndex = Math.min(startIndex + 50, rowIds.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const row = document.querySelector(`tr[data-row-id="${rowIds[i]}"]`);
      if (row) this._enableRowEditing(row, rowIds[i]);
    }
    
    if (endIndex < rowIds.length) {
      requestAnimationFrame(() => processChunk(endIndex));
    }
  };
  
  processChunk(0);
}
```

---

## 🎯 **実装順序**

1. **TableEditMode状態管理の追加**
2. **軽量テーブル作成機能の実装** 
3. **編集ボタンとUIの実装**
4. **段階的編集機能の実装**
5. **パフォーマンステストと最適化**

## 📊 **期待効果**

- **初期表示速度**: 1500件データでも軽快な表示
- **メモリ使用量**: DOM要素数の大幅削減
- **操作性**: 必要な行のみ編集可能にすることで操作性向上
- **保守性**: 段階的な機能有効化で不具合の局所化

---

## 📝 **注意事項**

- オートフィルタ機能は初期表示から有効
- 既存の編集機能は保持（チェックボックスで有効化）
- data-integration-key属性は引き続き使用
- 既存のCSSクラス構造は維持

---

**作成日**: 2024年12月
**対象ファイル**: 02-utilities.js, 08-table-components.js, 09-api-data-manager.js, 13-main.js 