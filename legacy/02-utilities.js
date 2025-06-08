/**
 * 🛠️ ユーティリティクラス群
 * @description システムで使用される共通のヘルパークラス
 */

// =============================================================================
// 🎯 パフォーマンス改善: テーブル編集モード管理
// =============================================================================

/**
 * 🚀 テーブル編集モード管理システム
 * @description 段階的編集機能によるパフォーマンス改善を管理
 */
class TableEditModeManager {
  constructor() {
    this.isEditMode = false;           // 編集モードかどうか
    this.enabledRows = new Set();      // 編集可能な行番号のセット
    this.isInitialLoad = true;         // 初期読み込みかどうか
    this.lightweightMode = true;       // 軽量モードかどうか
  }

  /**
   * 初期読み込み完了をマーク
   */
  markInitialLoadComplete() {
    this.isInitialLoad = false;
  }

  /**
   * 編集モードを有効化
   */
  enableEditMode() {
    this.isEditMode = true;
    this.lightweightMode = false;
    console.log('🎯 編集モード有効化');
  }

  /**
   * 編集モードを無効化
   */
  disableEditMode() {
    this.isEditMode = false;
    this.lightweightMode = true;
    this.enabledRows.clear();
    console.log('🎯 編集モード無効化');
  }

  /**
   * 行を編集可能にする
   * @param {string} rowId - 行番号
   */
  enableRowEditing(rowId) {
    this.enabledRows.add(rowId);
    console.log(`🎯 行編集有効化: ${rowId}`);
  }

  /**
   * 行の編集を無効化
   * @param {string} rowId - 行番号
   */
  disableRowEditing(rowId) {
    this.enabledRows.delete(rowId);
    console.log(`🎯 行編集無効化: ${rowId}`);
  }

  /**
   * 行が編集可能かチェック
   * @param {string} rowId - 行番号
   * @returns {boolean} 編集可能かどうか
   */
  isRowEditable(rowId) {
    return this.isEditMode && this.enabledRows.has(rowId);
  }

  /**
   * 軽量モードかチェック
   * @returns {boolean} 軽量モードかどうか
   */
  isLightweightMode() {
    return this.lightweightMode && this.isInitialLoad;
  }

  /**
   * デバッグ情報を取得
   * @returns {Object} 現在の状態
   */
  getDebugInfo() {
    return {
      isEditMode: this.isEditMode,
      enabledRowsCount: this.enabledRows.size,
      enabledRows: Array.from(this.enabledRows),
      isInitialLoad: this.isInitialLoad,
      lightweightMode: this.lightweightMode
    };
  }
}

// グローバルインスタンスを作成
window.TableEditMode = new TableEditModeManager();

// =============================================================================

/**
 * 🎨 スタイル管理クラス
 * @description UI要素のスタイル管理
 */
class StyleManager {
  static getCellStyles(width) {
    return {
      border: "1px solid #ccc",
      padding: "1px",
      fontSize: "11px",
      width: width || "auto",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      boxSizing: "border-box",
      minWidth: width || "auto",
      maxWidth: width || "auto",
    };
  }

  static getInputStyles(width) {
    return {
      width: width,
      padding: "1px",
      margin: "0",
      fontSize: "11px",
      boxSizing: "border-box",
      minWidth: width,
      maxWidth: width,
    };
  }

  static applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  // =============================================================================
  // 🎯 CSS化ヘルパーメソッド
  // =============================================================================

  /**
   * セルにCSSクラスを適用（インラインスタイルの代替）
   * @param {HTMLElement} cell - セル要素
   * @param {number|string} width - セル幅
   * @param {boolean} isDraggable - ドラッグ可能かどうか
   */
  static applyCellClasses(cell, width, isDraggable = false) {
    // 基本セルクラスを適用
    cell.classList.add('table-cell');
    
    // ドラッグ可能クラスを適用
    if (isDraggable) {
      cell.classList.add('cell-draggable');
    }
    
    // 幅クラスを適用
    const widthClass = this.getWidthClass(width);
    if (widthClass) {
      cell.classList.add(widthClass);
    }
  }

  /**
   * フォーム要素にCSSクラスを適用
   * @param {HTMLElement} element - フォーム要素
   * @param {number|string} width - 要素幅
   * @param {string} type - 要素タイプ ('input' | 'select')
   */
  static applyFormClasses(element, width, type = 'input') {
    // 基本フォームクラスを適用
    if (type === 'input') {
      element.classList.add('table-input');
    } else if (type === 'select') {
      element.classList.add('table-select');
    }
    
    // 幅クラスを適用
    const inputWidthClass = this.getInputWidthClass(width);
    if (inputWidthClass) {
      element.classList.add(inputWidthClass);
    }
  }

  /**
   * ボタンにCSSクラスを適用
   * @param {HTMLElement} button - ボタン要素
   * @param {string} type - ボタンタイプ ('hide' | 'separate')
   */
  static applyButtonClasses(button, type) {
    if (type === 'hide') {
      button.classList.add('hide-button');
    } else if (type === 'separate') {
      button.classList.add('separate-button');
    }
  }

  /**
   * リンクにCSSクラスを適用
   * @param {HTMLElement} link - リンク要素
   * @param {string} type - リンクタイプ ('record')
   */
  static applyLinkClasses(link, type = 'record') {
    if (type === 'record') {
      link.classList.add('record-link');
    }
  }

  /**
   * フレックスコンテナにCSSクラスを適用
   * @param {HTMLElement} container - コンテナ要素
   * @param {HTMLElement} valueSpan - 値表示用スパン要素
   */
  static applyFlexClasses(container, valueSpan) {
    if (container) {
      container.classList.add('flex-container');
    }
    if (valueSpan) {
      valueSpan.classList.add('flex-value');
    }
  }

  /**
   * 幅からCSSクラス名を取得
   * @param {number|string} width - 幅
   * @returns {string|null} CSSクラス名
   */
  static getWidthClass(width) {
    const widthNum = parseInt(width);
    const widthMap = {
      35: 'cell-width-35',
      40: 'cell-width-40',
      70: 'cell-width-70',
      80: 'cell-width-80',
      90: 'cell-width-90',
      100: 'cell-width-100',
      130: 'cell-width-130',
      150: 'cell-width-150'
    };
    return widthMap[widthNum] || null;
  }

  /**
   * 入力要素の幅からCSSクラス名を取得
   * @param {number|string} width - 幅
   * @returns {string|null} CSSクラス名
   */
  static getInputWidthClass(width) {
    const widthStr = width.toString();
    if (widthStr.includes('68px')) return 'input-width-68';
    if (widthStr.includes('78px')) return 'input-width-78';
    if (widthStr.includes('98px')) return 'input-width-98';
    return null;
  }

  /**
   * インラインスタイルをCSSクラスに変換（既存要素向け）
   * @param {HTMLElement} element - 対象要素
   */
  static convertInlineStylesToClasses(element) {
    if (!element) return;

    // TD要素の場合
    if (element.tagName === 'TD') {
      const width = element.style.width;
      const isDraggable = element.getAttribute('draggable') === 'true';
      
      // インラインスタイルをクリア
      element.removeAttribute('style');
      
      // CSSクラスを適用
      this.applyCellClasses(element, width, isDraggable);
      
    }
    
    // INPUT要素の場合
    else if (element.tagName === 'INPUT') {
      const width = element.style.width;
      
      // インラインスタイルをクリア（ただし機能に必要なものは保持）
      const value = element.value;
      element.removeAttribute('style');
      element.value = value;
      
      // CSSクラスを適用
      this.applyFormClasses(element, width, 'input');
    }
    
    // SELECT要素の場合
    else if (element.tagName === 'SELECT') {
      const width = element.style.width;
      
      // 子要素のoption要素も処理
      const options = element.querySelectorAll('option');
      options.forEach(option => {
        option.removeAttribute('style');
      });
      
      // インラインスタイルをクリア
      element.removeAttribute('style');
      
      // CSSクラスを適用
      this.applyFormClasses(element, width, 'select');
    }
    
    // BUTTON要素の場合
    else if (element.tagName === 'BUTTON') {
      const title = element.title;
      let buttonType = 'separate';
      
      if (title && title.includes('非表示')) {
        buttonType = 'hide';
      }
      
      // インラインスタイルをクリア
      element.removeAttribute('style');
      
      // CSSクラスを適用
      this.applyButtonClasses(element, buttonType);
    }
    
    // A要素の場合
    else if (element.tagName === 'A') {
      // インラインスタイルをクリア
      element.removeAttribute('style');
      
      // CSSクラスを適用
      this.applyLinkClasses(element, 'record');
    }
    
    // DIV要素の場合（フレックスコンテナ）
    else if (element.tagName === 'DIV') {
      const style = element.getAttribute('style');
      if (style && style.includes('display: flex')) {
        // インラインスタイルをクリア
        element.removeAttribute('style');
        
        // フレックスコンテナクラスを適用
        element.classList.add('flex-container');
      }
    }
    
    // SPAN要素の場合
    else if (element.tagName === 'SPAN') {
      const style = element.getAttribute('style');
      if (style && style.includes('flex:')) {
        // インラインスタイルをクリア
        element.removeAttribute('style');
        
        // フレックス値クラスを適用
        element.classList.add('flex-value');
      }
    }
  }

  /**
   * 要素とその子要素のインラインスタイルをCSSクラスに一括変換
   * @param {HTMLElement} container - コンテナ要素
   */
  static convertContainerStylesToClasses(container) {
    if (!container) return;

    // 対象要素を取得
    const elements = container.querySelectorAll('td, input, select, button, a, div, span');
    
    // 各要素を変換
    elements.forEach(element => {
      this.convertInlineStylesToClasses(element);
    });
    
    // フレックスコンテナの処理
    const flexContainers = container.querySelectorAll('div[style*="display: flex"]');
    flexContainers.forEach(flexContainer => {
      const valueSpan = flexContainer.querySelector('span');
      flexContainer.removeAttribute('style');
      this.applyFlexClasses(flexContainer, valueSpan);
    });
  }

  /**
   * 🎯 ハイライト後のインラインスタイルを強制変換
   * @param {HTMLElement} container - コンテナ要素
   */
  static forceConvertAllInlineStyles(container) {
    if (!container) return;

    // 全ての要素のインラインスタイルを変換
    const allElements = container.querySelectorAll('*[style]');
    
    let convertedCount = 0;
    allElements.forEach(element => {
      try {
        this.convertInlineStylesToClasses(element);
        convertedCount++;
      } catch (error) {
        console.warn('要素のCSS化でエラー:', element, error);
      }
    });
  }

  /**
   * テーブル全体のCSS化を実行
   * @param {string} tableId - テーブルID（デフォルト: "my-tbody"）
   */
  static convertTableToCSS(tableId = "my-tbody") {
    const tbody = document.getElementById(tableId);
    if (!tbody) {
      return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let convertedCount = 0;

    rows.forEach((row, index) => {
      try {
        this.convertContainerStylesToClasses(row);
        convertedCount++;
      } catch (error) {
        console.warn(`行 ${index} のCSS化でエラー:`, error);
      }
    });
  }

  /**
   * ページ読み込み後にテーブルCSS化を実行（より慎重な実行）
   */
  static initializeTableCSS() {
    // 複数回の試行で確実にテーブルを見つける
    const tryConvertTable = (attemptCount = 0) => {
      const maxAttempts = 10;
      const delay = attemptCount * 500; // 0ms, 500ms, 1000ms, 1500ms...

      setTimeout(() => {
        const tbody = document.getElementById("my-tbody");
        if (tbody) {
          this.convertTableToCSS();
        } else if (attemptCount < maxAttempts) {
          console.log(`🔄 テーブル検索中... (試行 ${attemptCount + 1}/${maxAttempts + 1})`);
          tryConvertTable(attemptCount + 1);
        } else {
          console.log('📝 テーブルが見つからないため、CSS化をスキップしました');
        }
      }, delay);
    };

    // DOMContentLoadedイベントで実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => tryConvertTable());
    } else {
      // 既にDOMが読み込まれている場合
      tryConvertTable();
    }
  }
}

/**
 * 🔍 DOM要素検索・操作ヘルパー
 * @description DOM要素の検索、取得、操作に関する共通処理
 */
class DOMHelper {
  /**
   * ヘッダー行を取得
   * @returns {HTMLElement|null} ヘッダー行要素
   */
  static getHeaderRow() {
    return document.getElementById("my-thead-row");
  }

  /**
   * テーブルボディを取得
   * @returns {HTMLElement|null} テーブルボディ要素
   */
  static getTableBody() {
    return document.getElementById("my-tbody");
  }

  /**
   * 行内でフィールドに対応するセルを検索
   * @param {HTMLElement} row - 対象行
   * @param {string} fieldCode - フィールドコード
   * @returns {HTMLElement|null} セル要素
   */
  static findCellInRow(row, fieldCode) {
    const headerRow = this.getHeaderRow();
    if (!headerRow) return null;

    const headers = Array.from(headerRow.children);
    const fieldIndex = headers.findIndex((th) => {
      // 🔧 オートフィルタによる"▼"サフィックスを正規化
      const headerText = th.textContent?.replace(/▼$/, '') || '';
      const field = fieldsConfig.find((f) => f.label === headerText);
      return field && field.fieldCode === fieldCode;
    });

    if (fieldIndex >= 0 && row.children[fieldIndex]) {
      return row.children[fieldIndex];
    }

    return null;
  }

  /**
   * ヘッダーからフィールド順序を取得
   * @returns {Array<string>} フィールドコード配列
   */
  static getFieldOrderFromHeader() {
    const fieldOrder = [];
    const headerRow = this.getHeaderRow();

    if (headerRow) {
      Array.from(headerRow.children).forEach((th, index) => {
        const rawFieldLabel = th.textContent;
        // オートフィルタによる "▼" を除去して正規化
        const fieldLabel = rawFieldLabel.replace(/▼$/, '');
        
        const field = fieldsConfig.find((f) => f.label === fieldLabel);
        if (field) {
          fieldOrder.push(field.fieldCode);
        } else {
          console.log(`⚠️ DOMHelper フィールド設定未発見: "${fieldLabel}" (元: "${rawFieldLabel}")`);
        }
      });
    } else {
      console.error(`❌ DOMHelper ヘッダー行が見つかりません`);
    }
    
    return fieldOrder;
  }

  /**
   * 行に含まれる全フィールドコードを取得
   * @param {HTMLElement} row - 対象行
   * @returns {Array<string>} フィールドコード配列
   */
  static getAllFieldCodesInRow(row) {
    const headerRow = this.getHeaderRow();
    if (!headerRow) return [];

    const headers = Array.from(headerRow.children);
    const fieldCodes = [];

    headers.forEach((th, index) => {
      // 🔧 オートフィルタによる"▼"サフィックスを正規化
      const headerText = th.textContent?.replace(/▼$/, '') || '';
      const field = fieldsConfig.find((f) => f.label === headerText);
      if (field && row.children[index]) {
        // セルに実際に値が入っているフィールドのみを対象とする
        const cell = row.children[index];
        const value = CellValueHelper.extractSafely(cell, field);
        if (value && value.trim()) {
          fieldCodes.push(field.fieldCode);
        }
      }
    });

    return fieldCodes;
  }

  /**
   * ハイライトチェック用に行に含まれる全フィールドコードを取得（空セルも含む）
   * @param {HTMLElement} row - 対象行
   * @returns {Array<string>} フィールドコード配列
   */
  static getAllFieldCodesInRowForHighlight(row) {
    const headerRow = this.getHeaderRow();
    if (!headerRow) return [];

    const headers = Array.from(headerRow.children);
    const fieldCodes = [];

    // 🎯 UI制御用フィールドはハイライト判定から除外
    const UI_CONTROL_FIELDS = [
      '_row_number',           // 行番号
      '_modification_checkbox', // 変更チェックボックス
      '_hide_button'           // 非表示ボタン
    ];

    headers.forEach((th, index) => {
      // 🔧 オートフィルタによる"▼"サフィックスを正規化
      const headerText = th.textContent?.replace(/▼$/, '') || '';
      const field = fieldsConfig.find((f) => f.label === headerText);
      if (field && row.children[index]) {
        // 🎯 UI制御用フィールドを除外してハイライト対象を絞り込み
        if (!UI_CONTROL_FIELDS.includes(field.fieldCode)) {
          fieldCodes.push(field.fieldCode);
        }
      }
    });

    return fieldCodes;
  }

  /**
   * 統合キーまたはレコードキーを行から取得
   * @param {HTMLElement} row - 対象行
   * @returns {string|null} キー値
   */
  static getRowKey(row) {
    return (
      row.getAttribute("data-integration-key") ||
      row.getAttribute("data-record-key")
    );
  }
}

/**
 * 📝 セル値操作ヘルパー
 * @description セルの値取得・設定に関する共通処理
 */
class CellValueHelper {
  /**
   * セルから値を安全に取得
   * @param {HTMLElement} cell - 対象セル
   * @param {Object} field - フィールド設定（オプション）
   * @returns {string} セルの値
   */
  static extractSafely(cell, field = null) {
    if (!cell) return "";

    // レコードIDフィールドの場合
    if (field && field.fieldCode && field.fieldCode.endsWith("_record_id")) {
      const link = cell.querySelector("a");
      return link ? link.textContent.trim() : cell.textContent.trim();
    }

    // セレクト要素
    const select = cell.querySelector("select");
    if (select) {
      return select.value || "";
    }

    // 入力要素
    const input = cell.querySelector("input");
    if (input) {
      return input.value || "";
    }

    // 🔧 分離ボタン付きの要素（.flex-value）
    const flexValue = cell.querySelector(".flex-value");
    if (flexValue) {
      return flexValue.textContent.trim();
    }

    // 分離ボタン付きの要素（div > span構造）
    const span = cell.querySelector("div > span");
    if (span) {
      return span.textContent.trim();
    }

    // 通常のテキスト
    return cell.textContent.trim();
  }

  /**
   * セルに値を安全に設定（09版の高機能版を移植）
   * @param {HTMLElement} cell - 対象セル
   * @param {string} value - 設定する値
   * @param {Object} field - フィールド設定（オプション）
   * @returns {boolean} 設定成功/失敗
   */
  static setSafely(cell, value, field = null) {
    if (!cell) {
      console.warn("⚠️ セルが null/undefined です");
      return false;
    }

    try {
      const originalValue = this.extractSafely(cell, field);

      // input要素の場合
      const input = cell.querySelector("input");
      if (input) {
        input.value = value || "";
        // イベントを発火
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      // select要素の場合
      const select = cell.querySelector("select");
      if (select) {
        select.value = value || "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      // textarea要素の場合
      const textarea = cell.querySelector("textarea");
      if (textarea) {
        textarea.value = value || "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }

      // contenteditable要素の場合
      if (
        cell.hasAttribute("contenteditable") ||
        cell.contentEditable === "true"
      ) {
        cell.textContent = value || "";
        cell.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }

      // data-value属性がある場合
      if (cell.hasAttribute("data-value")) {
        cell.setAttribute("data-value", value || "");
        cell.textContent = value || "";
        return true;
      }

      // セル内に編集可能な要素を探す
      const editableElements = cell.querySelectorAll(
        '[contenteditable="true"], input, select, textarea'
      );
      if (editableElements.length > 0) {
        editableElements.forEach((element) => {
          if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
            element.value = value || "";
          } else if (element.tagName === "SELECT") {
            element.value = value || "";
          } else {
            element.textContent = value || "";
          }
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
        });
        return true;
      }

      // 🔧 分離ボタン付きの要素（.flex-value）の場合
      const flexValue = cell.querySelector(".flex-value");
      if (flexValue) {
        flexValue.textContent = value || "";
        return true;
      }

      // 分離ボタン付きの要素（div > span構造）の場合
      const span = cell.querySelector("div > span");
      if (span) {
        span.textContent = value || "";
        return true;
      }

      // 上記の方法が全て失敗した場合、直接textContentを設定
      cell.textContent = value || "";

      // 値が正しく設定されたかを確認
      const newValue = this.extractSafely(cell, field);
      if (newValue === (value || "")) {
        return true;
      } else {
        console.warn(
          `  ⚠️ 値設定確認失敗: 期待値"${value}" ≠ 実際値"${newValue}"`
        );

        // 強制的に値をクリア（空文字列の場合）
        if (!value || value === "") {
          cell.innerHTML = "";
          return true;
        }

        return false;
      }
    } catch (error) {
      console.error(`❌ セル値設定エラー:`, error);
      console.error(`  セル情報:`, {
        tagName: cell.tagName,
        className: cell.className,
        innerHTML: cell.innerHTML.substring(0, 100),
      });
      return false;
    }
  }

  /**
   * セルが編集可能かチェック（09版から移植）
   * @param {HTMLElement} cell - 対象セル
   * @returns {boolean} 編集可能/不可能
   */
  static isEditable(cell) {
    if (!cell) return false;

    const input = cell.querySelector("input, select, textarea");
    return !!input && !input.disabled && !input.readOnly;
  }
}

/**
 * 🔗 統合キー処理ヘルパー
 * @description 統合キーの生成・操作に関する共通処理
 * 💭 注意: このクラスは統合キー廃止のため無効化されています
 */
class IntegrationKeyHelper {
  // 💭 全メソッドを無効化（常にデフォルト値またはエラーを返す）
  /**
   * 主キーフィールドのマッピング
   */
  static get PRIMARY_KEY_FIELDS() {
    return {
      "🪑 座席番号": "SEAT",
      "💻 PC番号": "PC",
      "☎️ 内線番号": "EXT",
      "🆔 ユーザーID": "USER",
    };
  }

  /**
   * アプリタイプのプレフィックスマッピング
   */
  static get APP_PREFIXES() {
    return {
      SEAT: "SEAT:",
      PC: "PC:",
      EXT: "EXT:",
      USER: "USER:",
    };
  }

  // /**
  //  * アプリタイプのデータから統合キーを生成（09版の高機能版を移植）
  //  * @param {string} appType - アプリタイプ
  //  * @param {Object} appData - アプリデータ
  //  * @returns {string} 統合キー
  //  */
  // static generateFromAppData(appType, appData) {
  //   try {
  //     const prefix = this._getAppPrefix(appType);
  //     const primaryKey = this._getPrimaryKeyFromAppData(appType, appData);

  //     if (!primaryKey) {
  //       console.warn(`主キーが見つかりません: ${appType}`);
  //       return `${prefix}UNKNOWN_${Date.now()}`;
  //     }

  //     return `${prefix}${primaryKey}`;
  //   } catch (error) {
  //     console.error("統合キー生成エラー:", error);
  //     return `ERROR_${Date.now()}`;
  //   }
  // }

  // /**
  //  * 行から指定アプリの主キー値を取得
  //  * @param {HTMLElement} row - 対象行
  //  * @param {string} sourceApp - アプリタイプ
  //  * @returns {string|null} 主キー値
  //  */
  // static getAppPrimaryKeyFromRow(row, sourceApp) {
  //   const integrationKey = DOMHelper.getRowKey(row);
  //   if (!integrationKey) return null;

  //   const prefix = this.APP_PREFIXES[sourceApp];
  //   if (!prefix) return null;

  //   // 統合キーから該当アプリの部分を抽出
  //   const parts = integrationKey.split("|");
  //   for (const part of parts) {
  //     if (part.startsWith(prefix)) {
  //       return part;
  //     }
  //   }

  //   return null;
  // }

  /**
   * アプリのプレフィックスを取得（09版から移植）
   * @param {string} appType - アプリタイプ
   * @returns {string} プレフィックス
   */
  static _getAppPrefix(appType) {
    const prefixes = {
      SEAT: "SEAT:",
      PC: "PC:",
      EXT: "EXT:",
      USER: "USER:",
    };

    return prefixes[appType] || `${appType}:`;
  }

  /**
   * アプリの主キーフィールドを取得（09版から移植）
   * @param {string} appType - アプリタイプ
   * @returns {string} 主キーフィールド
   */
  static _getPrimaryFieldForApp(appType) {
    const primaryFields = {
      SEAT: "座席番号",
      PC: "PC番号",
      EXT: "内線番号",
      USER: "ユーザーID",
    };

    return primaryFields[appType];
  }

  /**
   * アプリデータから主キー値を抽出（09版から移植）
   * @param {string} appType - アプリタイプ
   * @param {Object} appData - アプリデータ
   * @returns {string|null} 主キー値
   */
  static _getPrimaryKeyFromAppData(appType, appData) {
    const primaryField = this._getPrimaryFieldForApp(appType);

    if (appData && appData[primaryField]) {
      return appData[primaryField].value || appData[primaryField];
    }

    return null;
  }

  /**
   * 行内のセルを検索（09版の4層検索戦略を移植）
   * @param {HTMLElement} row - 対象行
   * @param {string} fieldCode - フィールドコード
   * @returns {HTMLElement|null} セル要素
   */
  static _findCellInRow(row, fieldCode) {
    if (!row || !fieldCode) return null;

    // 4層検索戦略を実装
    try {
      // 第1層: data-field属性での検索
      let cell = row.querySelector(`td[data-field="${fieldCode}"]`);
      if (cell) {
        return cell;
      }

      // 第2層: data-field-code属性での検索
      cell = row.querySelector(`td[data-field-code="${fieldCode}"]`);
      if (cell) {
        return cell;
      }

      // 第3層: テーブルヘッダーベースの列インデックス検索
      const headerRow = document.getElementById("my-thead-row");
      if (headerRow) {
        const headers = Array.from(headerRow.children);
        const field = window.fieldsConfig?.find(
          (f) => f.fieldCode === fieldCode
        );

        if (field) {
          const headerIndex = headers.findIndex((th) => {
            // 🔧 オートフィルタによる"▼"サフィックスを正規化
            const headerText = th.textContent?.replace(/▼$/, '').trim() || '';
            return headerText === field.label;
          });
          if (headerIndex >= 0 && row.children[headerIndex]) {
            cell = row.children[headerIndex];
            return cell;
          }
        }
      }

      // 第4層: レコードIDフィールドの特別処理
      if (fieldCode.endsWith("_record_id")) {
        cell = this._findRecordIdCell(row, fieldCode);
        if (cell) {
          return cell;
        }
      }

      // 第5層: フォールバック - DOMHelperの検索
      if (DOMHelper?.findCellInRow) {
        cell = DOMHelper.findCellInRow(row, fieldCode);
        if (cell) {
          return cell;
        }
      }
      return null;
    } catch (error) {
      console.error(`❌ セル検索エラー(${fieldCode}):`, error);
      return null;
    }
  }

  /**
   * レコードIDセルの特別検索（09版から移植）
   * @param {HTMLElement} row - 対象行
   * @param {string} fieldCode - フィールドコード
   * @returns {HTMLElement|null} セル要素
   */
  static _findRecordIdCell(row, fieldCode) {
    try {
      // config.jsからアプリ別URL判定マップを取得
      const appUrlMap = window.APP_URL_MAPPINGS || {};

      const targetUrl = appUrlMap[fieldCode];
      if (!targetUrl) {
        console.warn(`⚠️ URLマッピングが見つかりません: ${fieldCode}`);
        return null;
      }

      // リンク要素から検索
      const links = row.querySelectorAll('a[href*="' + targetUrl + '"]');
      for (const link of links) {
        const cell = link.closest("td");
        if (cell) {
          return cell;
        }
      }

      return null;
    } catch (error) {
      console.error(`❌ レコードIDセル検索エラー(${fieldCode}):`, error);
      return null;
    }
  }
}

/**
 * 🎯 行操作ヘルパー
 * @description テーブル行の操作に関する共通処理
 */
class RowHelper {
  /**
   * 重要フィールドのラベル（空行判定用）
   */
  static get IMPORTANT_FIELD_LABELS() {
    return ["🪑 座席番号", "💻 PC番号", "☎️ 内線番号", "🆔 ユーザーID"];
  }

  /**
   * 行が空かどうかを判定
   * @param {HTMLElement} row - 対象行
   * @returns {boolean} 空行かどうか
   */
  static isEmpty(row) {
    try {
      const headerRow = DOMHelper.getHeaderRow();
      if (!headerRow) {
        console.error("ヘッダー行が見つかりません");
        return false;
      }

      const headers = Array.from(headerRow.children);
      let hasValue = false;

      headers.forEach((th, index) => {
        const rawFieldLabel = th.textContent.trim();
        // オートフィルタによる "▼" を除去して正規化
        const fieldLabel = rawFieldLabel.replace(/▼$/, '');

        // 重要なフィールドのみをチェック
        if (!this.IMPORTANT_FIELD_LABELS.includes(fieldLabel)) {
          //console.log(`🔍 空行判定: スキップ - "${fieldLabel}" は重要フィールドではありません`);
          return;
        }

        const cell = row.children[index];
        if (!cell) {
          return;
        }

        const cellValue = CellValueHelper.extractSafely(cell);
        // 値があるかチェック（空白や初期値も除外）
        if (cellValue && cellValue.trim() && cellValue.trim() !== "---") {
          hasValue = true;
        }
      });

      const isEmpty = !hasValue;
      
      return isEmpty;
    } catch (error) {
      console.error("空行判定中にエラーが発生:", error);
      // エラーが発生した場合は安全のため削除しない
      return false;
    }
  }

  /**
   * 行の縞模様を更新
   * @param {HTMLElement} tbody - テーブルボディ
   */
  static updateStripePattern(tbody) {
    const rows = Array.from(tbody.children).filter(
      (row) => row.style.display !== "none" && row.cells.length > 0
    );

    rows.forEach((row, index) => {
      // 分離された行や変更行は背景を維持
      if (!row.getAttribute("data-separated") && 
          !row.classList.contains("row-modified") &&
          !row.classList.contains("row-dragging")) {
        // 既存の縞模様クラスを削除
        row.classList.remove("row-even", "row-odd");
        
        // 新しい縞模様クラスを追加
        if (index % 2 === 0) {
          row.classList.add("row-even");
        } else {
          row.classList.add("row-odd");
        }
      }
    });
  }

  /**
   * 行から統合レコードオブジェクトを再構築
   * @param {HTMLElement} row - 対象行
   * @returns {Object|null} 統合レコードオブジェクト
   */
  static reconstructIntegratedRecord(row) {
    try {
      const record = { ledgerData: {} };
      const headerRow = DOMHelper.getHeaderRow();
      if (!headerRow) return null;

      const headers = Array.from(headerRow.children);

      headers.forEach((th, index) => {
        const cell = row.children[index];
        if (!cell) return;

        const field = fieldsConfig.find((f) => f.label === th.textContent);
        if (!field || !field.sourceApp) return;

        const cellValue = CellValueHelper.extractSafely(cell, field);

        // レコード構造に値を設定
        if (cellValue && cellValue.trim()) {
          if (!record.ledgerData[field.sourceApp]) {
            record.ledgerData[field.sourceApp] = {};
          }
          record.ledgerData[field.sourceApp][field.fieldCode] = {
            value: cellValue.trim(),
          };
        }
      });
      return record;
    } catch (error) {
      console.error("統合レコード再構築エラー:", error);
      return null;
    }
  }
}

/**
 * 💫 フィールド値処理ユーティリティ
 * @description レコードのフィールド値を適切な形式に変換する
 */
class FieldValueProcessor {
  /**
   * フィールド値を適切な形式に変換
   * @param {Object} record - レコードオブジェクト（統合レコードまたは単一レコード）
   * @param {string} fieldCode - フィールドコード
   * @param {string} selectedLedger - 選択された台帳種類
   * @returns {string} 変換された値
   */
  static process(record, fieldCode, selectedLedger) {
    // 統合レコードの場合の処理
    if (record.isIntegratedRecord) {
       return this._processIntegratedRecord(record, fieldCode);
    }

    // レコードIDフィールドの処理
    if (fieldCode.endsWith("_record_id")) {
      const sourceApp = fieldCode.replace("_record_id", "").toUpperCase();
      return record[`${sourceApp}_ID`] || "";
    }

    // 統合キーの処理
    if (fieldCode === "integration_key") {
      return record.integration_key || "";
    }

    const fieldValue = record[fieldCode];
    if (!fieldValue) return "";

    const processors = {
      CREATED_TIME: (val) => (val ? new Date(val).toLocaleString("ja-JP") : ""),
      UPDATED_TIME: (val) => (val ? new Date(val).toLocaleString("ja-JP") : ""),
      USER_SELECT: (val) => {
        if (!val) return "";
        return Array.isArray(val)
          ? val.map((user) => user.name).join(", ")
          : val.name || "";
      },
      CHECK_BOX: (val) => (Array.isArray(val) ? val.join(", ") : val || ""),
      DROP_DOWN: (val) => val || "",
      SINGLE_LINE_TEXT: (val) => val || "",
    };

    const processor =
      processors[fieldValue.type] || processors["SINGLE_LINE_TEXT"];
    return processor(fieldValue.value);
  }

  /**
   * 統合レコードからフィールド値を取得
   */
  static _processIntegratedRecord(record, fieldCode) {
    // レコードIDフィールドの処理
    if (fieldCode.endsWith("_record_id")) {
      const appType = fieldCode.replace("_record_id", "").toUpperCase();
      const recordIdValue = record.recordIds ? record.recordIds[appType] : null;

      return recordIdValue || "";
    }

    // 🔧 主キーフィールドの場合は統合キーから値を復元
    const fieldConfig = fieldsConfig.find((f) => f.fieldCode === fieldCode);
    if (fieldConfig && fieldConfig.isPrimaryKey && record.integrationKey) {
      const extractedValue = this._extractPrimaryKeyFromIntegrationKey(
        record.integrationKey,
        fieldConfig.sourceApp
      );
      if (extractedValue) {
        return extractedValue;
      }
    }

    // 各台帳のデータから値を取得
    if (!fieldConfig || !fieldConfig.sourceApp) {
      return "";
    }

    const sourceAppData = record.ledgerData[fieldConfig.sourceApp];
    if (!sourceAppData) {
      console.warn(
        `⚠️ ${fieldConfig.sourceApp}台帳のデータが見つかりません: ${fieldCode}`
      );
      return "";
    }

    const fieldValue = sourceAppData[fieldCode];
    if (!fieldValue) {
      console.warn(
        `⚠️ フィールド値が見つかりません: ${fieldCode} in ${fieldConfig.sourceApp}台帳`
      );
      return "";
    }

    // kintoneの標準データ構造 {type: "...", value: "..."} から value 部分を安全に抽出
    const finalValue = (typeof fieldValue === 'object' && fieldValue !== null) 
      ? (fieldValue.value !== undefined ? fieldValue.value : "") 
      : fieldValue || "";
    return finalValue;
  }

  /**
   * 🔧 統合キーから指定アプリの主キー値を抽出
   * @param {string} integrationKey - 統合キー（例：SEAT:池袋19F-A1541|PC:PCAIT23N1541|EXT:701541|USER:BSS1541）
   * @param {string} sourceApp - アプリタイプ（SEAT、PC、EXT、USER）
   * @returns {string|null} 主キー値
   */
  static _extractPrimaryKeyFromIntegrationKey(integrationKey, sourceApp) {
    if (!integrationKey || !sourceApp) return null;

    try {
      const parts = integrationKey.split("|");
      const prefix = `${sourceApp}:`;

      for (const part of parts) {
        if (part.startsWith(prefix)) {
          const value = part.substring(prefix.length);
          return value;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

/**
 * 🎯 UI ローディング管理
 * @description ローディング表示の汎用ユーティリティ
 */
class LoadingManager {
  static show(message = "データを抽出中...") {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-message";
    loadingDiv.textContent = message;
    StyleManager.applyStyles(loadingDiv, {
      padding: "10px",
      textAlign: "center",
      backgroundColor: "#f5f5f5",
      border: "1px solid #ccc",
      marginBottom: "10px",
      fontSize: "12px",
      fontWeight: "bold",
      color: "#666",
    });

    const myTable = document.getElementById("my-table");
    myTable.parentNode.insertBefore(loadingDiv, myTable);
    return loadingDiv;
  }

  static hide() {
    const loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) loadingDiv.remove();
  }

  static updateMessage(message) {
    const loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) loadingDiv.textContent = message;
  }
}

/**
 * 🔄 分離処理サービス（09版から移植）
 * @description フィールド分離処理の専門サービス
 */
class FieldSeparationService {
  /**
   * フィールドを分離
   * @param {Object} field - フィールド設定
   * @param {Object} record - レコードオブジェクト
   * @param {HTMLElement} currentRow - 現在の行
   */
  static async separateField(field, record, currentRow) {
    
    try {
      // 1. バリデーション
      if (!field.sourceApp || !record || !currentRow) {
        throw new Error('分離に必要なパラメータが不足しています');
      }

      // 2. 関連フィールドを取得
      const fieldsToSeparate = this._getRelatedFields(field.sourceApp);
      if (fieldsToSeparate.length === 0) {
        throw new Error(`${field.sourceApp} の関連フィールドが見つかりません`);
      }

      // 3. 元レコードを再構築
      const reconstructedRecord = this._reconstructFromRow(currentRow, record);
      if (!reconstructedRecord) {
        throw new Error('レコードの再構築に失敗しました');
      }

      // 4. 分離レコードを作成
      const newIntegratedRecord = this._createSeparatedRecord(
        reconstructedRecord,
        field.sourceApp,
        fieldsToSeparate
      );

      // 5. 元レコードから該当アプリデータを除去
      this._removeAppDataFromRecord(reconstructedRecord, field.sourceApp);
      
      // 6. DOM行からも該当アプリデータを除去
      try {
        await this._removeAppDataFromRow(currentRow, field.sourceApp);
      } catch (domError) {
        console.error(`❌ DOM除去処理失敗: ${domError.message}`);
      }
      
      // 7. 分離行を挿入
      const newRow = this._insertSeparatedRow(
        currentRow,
        newIntegratedRecord,
        fieldsToSeparate
      );

      // 8. 🆕 行番号ベース分離状態管理を実行
      if (window.cellStateManager && newRow) {
        
        // 行番号ベースの分離状態管理を実行
        window.cellStateManager.setupSeparationStates(
          currentRow,        // 分離元行
          newRow,           // 分離先行
          fieldsToSeparate, // 分離されたフィールド
          field.sourceApp   // 分離されたアプリ
        );
      }

      // 9. 🎯 分離完了後のハイライト状態を更新
      this._updateHighlightAfterSeparation(currentRow, newRow, field.sourceApp, fieldsToSeparate);
      
      return {
        success: true,
        originalRecord: reconstructedRecord,
        separatedRecord: newIntegratedRecord,
        newRow: newRow
      };

    } catch (error) {
      console.error(`❌ フィールド分離エラー: ${error.message}`);
      throw error;
    }
  }

  /**
   * 関連フィールドを取得
   * @param {string} sourceApp - アプリタイプ
   * @returns {Array} フィールドコード配列
   */
  static _getRelatedFields(sourceApp) {
    if (!window.fieldsConfig) return [];
    
    return window.fieldsConfig
      .filter(field => field.sourceApp === sourceApp)
      .filter(field => !field.isRecordId)
      .map(field => field.fieldCode);
  }

  /**
   * 行からレコードを再構築
   * @param {HTMLElement} row - 対象行
   * @param {Object} originalRecord - 元レコード
   * @returns {Object} 再構築されたレコード
   */
  static _reconstructFromRow(row, originalRecord) {
    try {
      const integrationKey = row.getAttribute('data-integration-key');
      if (!integrationKey) return null;

      // 🔧 DOM行から実際の値を取得してレコードを完全に再構築
      const reconstructedRecord = {
        integrationKey: integrationKey,
        isIntegratedRecord: true,
        ledgerData: {},
        recordIds: originalRecord.recordIds ? { ...originalRecord.recordIds } : {}
      };

      // 🔧 フィールド設定を使用して各台帳のデータを正しく再構築
      if (window.fieldsConfig) {
        window.fieldsConfig.forEach(field => {
          if (!field.sourceApp || field.fieldCode.includes('_record_id')) return;
          
          // セルから現在の値を取得
          const cell = IntegrationKeyHelper._findCellInRow(row, field.fieldCode);
          if (cell) {
            const currentValue = CellValueHelper.extractSafely(cell, field);
            
            // 値がある場合のみレコードに追加
            if (currentValue && currentValue.trim()) {
              if (!reconstructedRecord.ledgerData[field.sourceApp]) {
                reconstructedRecord.ledgerData[field.sourceApp] = {};
              }
              
              reconstructedRecord.ledgerData[field.sourceApp][field.fieldCode] = {
                value: currentValue.trim()
              };
            }
          }
        });
      }

      // 🔧 統合キーからも主キー値を復元して補完
      if (integrationKey && integrationKey.includes('|')) {
        const keyParts = integrationKey.split('|');
        keyParts.forEach(part => {
          const [appPrefix, value] = part.split(':');
          if (appPrefix && value) {
            const sourceApp = appPrefix;
            const fieldCodeMap = {
              'SEAT': '座席番号',
              'PC': 'PC番号', 
              'EXT': '内線番号',
              'USER': 'ユーザーID'
            };
            
            const fieldCode = fieldCodeMap[sourceApp];
            if (fieldCode) {
              if (!reconstructedRecord.ledgerData[sourceApp]) {
                reconstructedRecord.ledgerData[sourceApp] = {};
              }
              
              // DOM値が存在しない場合のみ統合キーから補完
              if (!reconstructedRecord.ledgerData[sourceApp][fieldCode]) {
                reconstructedRecord.ledgerData[sourceApp][fieldCode] = {
                  value: value
                };
              }
            }
          }
        });
      }

      console.log(`🔧 レコード再構築完了:`, {
        integrationKey,
        台帳数: Object.keys(reconstructedRecord.ledgerData).length,
        詳細: Object.entries(reconstructedRecord.ledgerData).map(([app, data]) => 
          `${app}: ${Object.keys(data).length}フィールド`
        )
      });

      return reconstructedRecord;
    } catch (error) {
      console.error('レコード再構築エラー:', error);
      return null;
    }
  }

  /**
   * 分離レコードを作成
   * @param {Object} originalRecord - 元レコード
   * @param {string} sourceApp - 分離するアプリ
   * @param {Array} fieldsToSeparate - 分離フィールド
   * @returns {Object} 分離レコード
   */
  static _createSeparatedRecord(originalRecord, sourceApp, fieldsToSeparate) {
    const separatedRecord = {
      integrationKey: null,
      isIntegratedRecord: true,
      ledgerData: {},
      recordIds: {}
    };

    // 指定アプリのデータのみをコピー
    if (originalRecord.ledgerData && originalRecord.ledgerData[sourceApp]) {
      separatedRecord.ledgerData[sourceApp] = { ...originalRecord.ledgerData[sourceApp] };
    }

    // レコードIDもコピー
    if (originalRecord.recordIds && originalRecord.recordIds[sourceApp]) {
      separatedRecord.recordIds[sourceApp] = originalRecord.recordIds[sourceApp];
    }

    return separatedRecord;
  }

  /**
   * レコードからアプリデータを削除
   * @param {Object} record - レコード
   * @param {string} sourceApp - 削除するアプリ
   */
  static _removeAppDataFromRecord(record, sourceApp) {
    if (record.ledgerData && record.ledgerData[sourceApp]) {
      delete record.ledgerData[sourceApp];
    }
    if (record.recordIds && record.recordIds[sourceApp]) {
      delete record.recordIds[sourceApp];
    }
  }

  /**
   * DOM行からアプリデータを削除
   * @param {HTMLElement} row - 対象行
   * @param {string} sourceApp - 削除するアプリ
   */
  static async _removeAppDataFromRow(row, sourceApp) {
    try {
      // 1. 通常フィールドをクリア
      const fieldCodes = this._getRelatedFields(sourceApp);
      
      for (const fieldCode of fieldCodes) {
        const cell = IntegrationKeyHelper._findCellInRow(row, fieldCode);
        if (cell) {
          CellValueHelper.setSafely(cell, "");
        }
      }

      // 2. レコードIDフィールドも削除
      const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
      const recordIdCell = IntegrationKeyHelper._findCellInRow(row, recordIdField);
      if (recordIdCell) {
        // リンク要素を削除
        const linkElement = recordIdCell.querySelector('a');
        if (linkElement) {
          linkElement.remove();
        }
        // セルの内容をクリア
        recordIdCell.innerHTML = '';
        recordIdCell.style.padding = '4px';
      }
      // 4. ハイライト処理の更新
      await this._updateRowHighlight(row);
      
    } catch (error) {
      console.error('❌ 行からアプリデータ削除エラー:', error);
    }
  }

  /**
   * 行のハイライト処理を更新
   * @param {HTMLElement} row - 対象行
   */
  static async _updateRowHighlight(row) {
    try {
      // 少し待ってからハイライト処理を実行
      setTimeout(() => {
        // インラインスタイルを削除してCSSクラスに任せる
        row.style.backgroundColor = '';
        
        // 🎯 分離行・交換行は必ず変更ハイライトを適用
        if (row.classList.contains('row-separated')) {
          // 分離行は実際に変更された行なので row-modified を適用
          if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.markRowAsModified === 'function') {
            window.SimpleHighlightManager.markRowAsModified(row);
          } else {
            row.classList.add('row-modified');
          }
        }
        
        // CSS変換を実行してハイライトを正しく適用
        if (window.StyleManager && typeof window.StyleManager.convertInlineStylesToClasses === 'function') {
          window.StyleManager.convertInlineStylesToClasses(row);
        }
        
        // ハイライト再適用のトリガー
        const event = new CustomEvent('rowUpdated', { 
          detail: { row: row } 
        });
        document.dispatchEvent(event);
      }, 100);
      
    } catch (error) {
      console.error('❌ ハイライト更新エラー:', error);  
    }
  }

  /**
   * 分離行を挿入
   * @param {HTMLElement} afterRow - 挿入基準行
   * @param {Object} newRecord - 新レコード
   * @param {Array} fieldsToShow - 表示フィールド
   * @returns {HTMLElement} 新しい行
   */
  static _insertSeparatedRow(afterRow, newRecord, fieldsToShow) {
    if (window.SeparatedRowBuilder) {
      return SeparatedRowBuilder.createAndInsert(afterRow, newRecord, fieldsToShow);
    } else {
      console.error('❌ SeparatedRowBuilderが見つかりません');
      return null;
    }
  }

  /**
   * 分離完了後のハイライト状態を更新
   * @param {HTMLElement} originalRow - 元の行
   * @param {HTMLElement} newRow - 新しい分離行
   * @param {string} sourceApp - 分離されたアプリ
   * @param {Array} fieldsToSeparate - 分離されたフィールド
   */
  static _updateHighlightAfterSeparation(originalRow, newRow, sourceApp, fieldsToSeparate) {
    try {
      setTimeout(() => {
        // 🎯 行番号ベースの分離フィールド記録
        if (window.cellStateManager && newRow) {
          const newRowId = newRow.getAttribute('data-row-id');
          if (newRowId) {
            //console.log(`🎯 行番号ベース分離フィールド記録: 行番号=${newRowId}, フィールド=${fieldsToSeparate.join(', ')}`);
            window.cellStateManager.markFieldsAsSeparatedByRowId(newRowId, fieldsToSeparate);
            
            // レコードIDフィールドも分離フィールドとして記録
            const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
            window.cellStateManager.markFieldsAsSeparatedByRowId(newRowId, [recordIdField]);
          }
        }
        
        // 🎯 行レベルハイライトを適用
        [originalRow, newRow].forEach(row => {
          if (!row) return;
          
          // インラインスタイルを削除
          row.style.backgroundColor = '';
          
          // 変更ハイライトを適用
          if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.markRowAsModified === 'function') {
            window.SimpleHighlightManager.markRowAsModified(row);
          } else {
            row.classList.add('row-modified');
          }
          
          // CSS変換を実行
          if (window.StyleManager && typeof window.StyleManager.convertInlineStylesToClasses === 'function') {
            window.StyleManager.convertInlineStylesToClasses(row);
          }
        });
        
        // 🎨 分離に関連するセルハイライトを適用
        this._applySeparationCellHighlights(originalRow, newRow, sourceApp, fieldsToSeparate);
        
        //console.log('🎯 分離後ハイライト更新完了');
      }, 150);
      
    } catch (error) {
      console.error('❌ 分離後ハイライト更新エラー:', error);
    }
  }

  /**
   * 分離処理に特化したセルハイライトを適用
   * @param {HTMLElement} originalRow - 元の行
   * @param {HTMLElement} newRow - 新しい分離行
   * @param {string} sourceApp - 分離されたアプリ
   * @param {Array} fieldsToSeparate - 分離されたフィールド
   */
  static _applySeparationCellHighlights(originalRow, newRow, sourceApp, fieldsToSeparate) {
    try {
      // 🎯 分離元の行：削除されたフィールドのハイライトを削除
      this._removeSeparatedFieldHighlights(originalRow, sourceApp);
      
      // 🎯 分離先の行：新しく追加されたフィールドをハイライト
      this._highlightAddedFields(newRow, sourceApp, fieldsToSeparate);
      
    } catch (error) {
      console.error('❌ 分離セルハイライト適用エラー:', error);
    }
  }

  /**
   * 分離元の行で指定されたアプリのフィールドのハイライトを削除
   * @param {HTMLElement} row - 分離元の行
   * @param {string} sourceApp - 分離されたアプリ
   */
  static _removeSeparatedFieldHighlights(row, sourceApp) {
    try {
      //console.log(`🎨 分離元ハイライト削除開始: ${sourceApp}`);
      
      const relatedFields = this._getRelatedFields(sourceApp);
      
      relatedFields.forEach(fieldCode => {
        const cell = IntegrationKeyHelper._findCellInRow(row, fieldCode);
        if (cell) {
          // ハイライトを削除
          if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.unmarkCellAsModified === 'function') {
            window.SimpleHighlightManager.unmarkCellAsModified(cell);
          } else {
            cell.classList.remove('cell-modified');
          }
          // 分離元ハイライト削除ログは冗長なため削除
        }
      });

      // レコードIDフィールドのハイライトも削除
      const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
      const recordIdCell = IntegrationKeyHelper._findCellInRow(row, recordIdField);
      if (recordIdCell) {
        if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.unmarkCellAsModified === 'function') {
          window.SimpleHighlightManager.unmarkCellAsModified(recordIdCell);
        } else {
          recordIdCell.classList.remove('cell-modified');
        }
        //console.log(`🎨 分離元レコードIDハイライト削除: ${recordIdField}`);
      }
      
    } catch (error) {
      console.error('❌ 分離元ハイライト削除エラー:', error);
    }
  }

  /**
   * 分離先の行で新しく追加されたフィールドをハイライト
   * @param {HTMLElement} row - 新しい分離行
   * @param {string} sourceApp - 分離されたアプリ
   * @param {Array} fieldsToSeparate - 分離されたフィールド
   */
  static _highlightAddedFields(row, sourceApp, fieldsToSeparate) {
    try {
      // 分離されたフィールドをハイライト
      fieldsToSeparate.forEach(fieldCode => {
        const cell = IntegrationKeyHelper._findCellInRow(row, fieldCode);
        if (cell) {
          const value = CellValueHelper.extractSafely(cell);
          if (value && value.trim()) {
            // 🎨 セルハイライト（薄い黄色）を適用
            if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.markCellAsModified === 'function') {
              window.SimpleHighlightManager.markCellAsModified(cell);
            } else {
              cell.classList.add('cell-modified');
            }
            // 分離先ハイライト適用ログは冗長なため削除
          }
        }
      });

      // レコードIDフィールドもハイライト
      const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
      const recordIdCell = IntegrationKeyHelper._findCellInRow(row, recordIdField);
      if (recordIdCell) {
        const value = CellValueHelper.extractSafely(recordIdCell);
        if (value && value.trim()) {
          if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.markCellAsModified === 'function') {
            window.SimpleHighlightManager.markCellAsModified(recordIdCell);
          } else {
            recordIdCell.classList.add('cell-modified');
          }
         // console.log(`🎨 分離先レコードIDハイライト適用: ${recordIdField} = "${value}"`);
        }
      }

      // 統合キーフィールドもハイライト（新しく生成されたため）
      const integrationKeyCell = IntegrationKeyHelper._findCellInRow(row, 'integration_key');
      if (integrationKeyCell) {
        if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.markCellAsModified === 'function') {
          window.SimpleHighlightManager.markCellAsModified(integrationKeyCell);
        } else {
          integrationKeyCell.classList.add('cell-modified');
        }
        //console.log(`🎨 分離先統合キーハイライト適用: integration_key`);
      }
      
    } catch (error) {
      console.error('❌ 分離先ハイライト適用エラー:', error);
    }
  }
}

/**
 * 🔄 セル交換管理（09版から完全移植）
 * @description 分離機能と通常のセル交換機能を両方提供
 */
class CellExchangeManager {
  /**
   * フィールドを新しい行に分離（FieldSeparationServiceに委譲）
   * @param {Object} field - フィールド設定
   * @param {Object} record - レコードオブジェクト
   * @param {HTMLElement} currentRow - 現在の行
   */
  static async _separateFieldToNewRow(field, record, currentRow) {
   // console.log(`📤 CellExchangeManager経由で分離実行: ${field.sourceApp}`);
    
    try {
      if (window.FieldSeparationService?.separateField) {
        return await window.FieldSeparationService.separateField(field, record, currentRow);
      } else if (FieldSeparationService?.separateField) {
        return await FieldSeparationService.separateField(field, record, currentRow);
      } else {
        throw new Error('FieldSeparationService が見つかりません');
      }
    } catch (error) {
      console.error(`❌ 分離処理エラー: ${error.message}`);
      alert(`分離処理中にエラーが発生しました: ${error.message}`);
      throw error;
    }
  }

  /**
   * セル交換処理を実行（09版から移植）
   * @param {Object} sourceData - ソースデータ
   * @param {Object} targetData - ターゲットデータ
   */
  static async execute(sourceData, targetData) {
    try {
      // 🔧 分離行対応チェック
      const sourceSeparated = sourceData.isSeparatedRow || sourceData.integrationKey === 'null';
      const targetSeparated = targetData.isSeparatedRow || targetData.integrationKey === 'null';
      
      console.log(`🔍 セル交換処理: ソース分離行=${sourceSeparated}, ターゲット分離行=${targetSeparated}`);
      
      // 分離行の場合は簡単な値交換のみ実行
      if (sourceSeparated || targetSeparated) {
        return await this._performSeparatedRowExchange(sourceData, targetData);
      }

      // 🎯 セル交換中は初期状態の自動保存を無効化
      let originalAutoSave = true;
      if (window.cellStateManager) {
        originalAutoSave = window.cellStateManager.autoSaveInitialState;
        window.cellStateManager.autoSaveInitialState = false;
       // console.log('🔧 初期状態自動保存を無効化');
      }

      try {
        // 🔧 行番号ベース: data-row-idで直接行を特定
        const sourceRow = this._findRowById(sourceData.rowId);
        const targetRow = this._findRowById(targetData.rowId);

        if (!sourceRow || !targetRow) {
          console.error('❌ セル交換: 行が見つかりません');
          return false;
        }

        // 🔧 同一行チェック: 行番号ベースで確実に判定
        const sourceRowId = parseInt(sourceRow.getAttribute('data-row-id'));
        const targetRowId = parseInt(targetRow.getAttribute('data-row-id'));

        if (sourceRowId && targetRowId && sourceRowId === targetRowId) {
          console.warn('⚠️ 同一行での操作はできません');
          return await this._showSameRowWarning();
        }

        // 交換前の状態を記録
        const preExchangeState = {
          sourceRowId,
          targetRowId
        };

        // フィールド交換実行
        const exchangeSuccess = await this._performFieldExchange(sourceRow, targetRow, sourceData, targetData);

        if (exchangeSuccess) {
                  // 🎯 交換完了後の処理
        this._updateHighlightStatesAfterExchange(sourceRow, targetRow, sourceData);
        this._updateInitialStatesForSeparationRestore(sourceRow, targetRow, sourceData);
        // 統合キー更新処理は廃止により削除
        this._removeEmptyRowsAfterExchange([sourceRow, targetRow]);
          
          //console.log('✅ セル交換完了');
          return true;
        } else {
          console.error('❌ セル交換失敗');
          return false;
        }

      } finally {
        // 🎯 自動保存フラグを元に戻す
        if (window.cellStateManager) {
          window.cellStateManager.autoSaveInitialState = originalAutoSave;
          //console.log('🔧 初期状態自動保存を復元');
        }
      }

    } catch (error) {
      console.error('❌ セル交換エラー:', error);
      return false;
    }
  }

  /**
   * 🔧 分離行での簡単な値交換処理
   * @param {Object} sourceData - ソースデータ
   * @param {Object} targetData - ターゲットデータ
   * @returns {Promise<boolean>} 交換成功可否
   */
  static async _performSeparatedRowExchange(sourceData, targetData) {
    try {
      console.log(`🔄 分離行セル交換: ${sourceData.fieldCode} ⇔ ${targetData.fieldCode}`);
      
      // 🔧 行とセルを直接取得
      const sourceRow = this._findRowById(sourceData.rowId);
      const targetRow = this._findRowById(targetData.rowId);
      const sourceCell = sourceData.cell;
      const targetCell = targetData.cell;
      
      if (!sourceCell || !targetCell) {
        console.error('❌ 分離行セル交換: セルが見つかりません');
        return false;
      }
      
      // 🔧 値を直接交換（分離ボタンコンテナ内の値部分）
      const sourceValueSpan = sourceCell.querySelector('.flex-value');
      const targetValueSpan = targetCell.querySelector('.flex-value');
      
      if (sourceValueSpan && targetValueSpan) {
        const tempValue = sourceValueSpan.textContent;
        sourceValueSpan.textContent = targetValueSpan.textContent;
        targetValueSpan.textContent = tempValue;
        
        // 交換完了マーカーを追加
        sourceCell.setAttribute('data-exchanged', 'true');
        targetCell.setAttribute('data-exchanged', 'true');
        
        console.log(`✅ 分離行セル交換完了: ${sourceData.fieldCode} ⇔ ${targetData.fieldCode}`);
        return true;
      } else {
        console.warn('⚠️ 分離行セル交換: flex-valueが見つかりません');
        return false;
      }
      
    } catch (error) {
      console.error('❌ 分離行セル交換エラー:', error);
      return false;
    }
  }

  /**
   * フィールド交換を実行
   * @param {HTMLElement} sourceRow - ソース行
   * @param {HTMLElement} targetRow - ターゲット行
   * @param {Object} sourceData - ソースデータ
   * @param {Object} targetData - ターゲットデータ
   * @returns {Promise<boolean>} 交換成功可否
   */
  static async _performFieldExchange(sourceRow, targetRow, sourceData, targetData) {
    try {
      // 関連フィールドを取得
      const relatedFields = this._getRelatedFields(sourceData.sourceApp);
      
      // 各フィールドの値を交換
      for (const fieldCode of relatedFields) {
        const sourceCell = IntegrationKeyHelper._findCellInRow(sourceRow, fieldCode);
        const targetCell = IntegrationKeyHelper._findCellInRow(targetRow, fieldCode);
        
        if (sourceCell && targetCell) {
          await this._exchangeSingleField(sourceCell, targetCell);
        }
      }

      // レコードIDも交換
      const recordIdField = `${sourceData.sourceApp.toLowerCase()}_record_id`;
      const sourceRecordIdCell = IntegrationKeyHelper._findCellInRow(sourceRow, recordIdField);
      const targetRecordIdCell = IntegrationKeyHelper._findCellInRow(targetRow, recordIdField);
      
      if (sourceRecordIdCell && targetRecordIdCell) {
        await this._exchangeSingleField(sourceRecordIdCell, targetRecordIdCell);
      }

      return true;
    } catch (error) {
      console.error('❌ フィールド交換エラー:', error);
      return false;
    }
  }

  /**
   * 単一フィールドの値を交換
   * @param {HTMLElement} sourceCell - ソースセル
   * @param {HTMLElement} targetCell - ターゲットセル
   */
  static async _exchangeSingleField(sourceCell, targetCell) {
    try {
      // レコードIDフィールドかどうかを判定
      const sourceCellFieldCode = sourceCell.getAttribute('data-field-code');
      const isRecordIdField = sourceCellFieldCode && sourceCellFieldCode.endsWith('_record_id');
      
      if (isRecordIdField) {
        // レコードIDフィールドの場合はリンク要素を含めて交換
        await this._exchangeRecordIdField(sourceCell, targetCell);
      } else {
        // 通常フィールドの場合は従来の方法
        const sourceValue = CellValueHelper.extractSafely(sourceCell);
        const targetValue = CellValueHelper.extractSafely(targetCell);
        
        CellValueHelper.setSafely(sourceCell, targetValue);
        CellValueHelper.setSafely(targetCell, sourceValue);
      }
      
      // 交換後のハイライト処理
      this._highlightExchangedCell(sourceCell);
      this._highlightExchangedCell(targetCell);
      
    } catch (error) {
      console.error('❌ セル値交換エラー:', error);
    }
  }

  /**
   * レコードIDフィールドを交換（リンク要素を含む）
   * @param {HTMLElement} sourceCell - ソースセル
   * @param {HTMLElement} targetCell - ターゲットセル
   */
  static async _exchangeRecordIdField(sourceCell, targetCell) {
    try {
      // 各セルの内容を保存
      const sourceContent = sourceCell.innerHTML;
      const targetContent = targetCell.innerHTML;
      
      // 内容を交換
      sourceCell.innerHTML = targetContent;
      targetCell.innerHTML = sourceContent;
      
      // スタイルを復元
      sourceCell.style.padding = '4px';
      targetCell.style.padding = '4px';
      

      
    } catch (error) {
      console.error('❌ レコードIDフィールド交換エラー:', error);
    }
  }

  /**
   * 交換されたセルをハイライト（09版のロジック）
   * @param {HTMLElement} cell - ハイライト対象のセル
   */
  static _highlightExchangedCell(cell) {
    try {
      // 🎯 交換データ属性を追加（追跡用）- ハイライトは後で一括処理
      cell.setAttribute('data-exchanged', 'true');
      
      // 🎯 値が元の状態に戻った時のハイライト削除監視を設定
      const fieldCode = cell.getAttribute('data-field-code');
      if (fieldCode) {
        this._addInputListenerForHighlightRemoval(cell, fieldCode);
      }
      
    } catch (error) {
      console.error('❌ ハイライト設定エラー:', error);
    }
  }

  /**
   * 🎯 交換後ハイライト状態更新
   * @param {HTMLElement} sourceRow - ソース行
   * @param {HTMLElement} targetRow - ターゲット行  
   * @param {Object} sourceData - ソースデータ
   */
  static _updateHighlightStatesAfterExchange(sourceRow, targetRow, sourceData) {
    try {
      // CellStateManagerが利用可能な場合のみ実行
      if (!window.cellStateManager) return;
      
      //console.log('🎯 交換後ハイライト状態更新開始');
      
      // 🔧 高さに影響するインラインスタイルを強制削除
      [sourceRow, targetRow].forEach(row => {
        if (!row) return;
        
        // 行とセルの高さ関連スタイルを削除
        const allElements = row.querySelectorAll('*');
        allElements.forEach(element => {
          if (element.style) {
            // 高さに影響する可能性のあるプロパティを削除
            element.style.removeProperty('height');
            element.style.removeProperty('min-height');
            element.style.removeProperty('max-height');
            element.style.removeProperty('line-height');
          }
        });
      });
      
      // 関連フィールドを取得
      const relatedFields = this._getRelatedFields(sourceData.sourceApp);
      const recordIdField = `${sourceData.sourceApp.toLowerCase()}_record_id`;
      const allFields = [...relatedFields, recordIdField];
      
      // 自動保存フラグを一時的に有効化
      const originalAutoSave = window.cellStateManager.autoSaveInitialState;
      
      try {
        window.cellStateManager.autoSaveInitialState = true;
        
        // 両方の行の全フィールドをチェック
        [sourceRow, targetRow].forEach(row => {
          const rowId = row.getAttribute('data-row-id');
          if (!rowId) return;
          
          //console.log(`🎯 行番号${rowId}のハイライト状態更新`);
          
          // 初期状態がない場合は現在の状態を初期状態として保存
          if (!window.cellStateManager.rowInitialStates.has(rowId)) {
            window.cellStateManager.saveRowInitialState(row, 'exchange');
            //console.log(`✅ 交換時の初期状態保存: 行番号=${rowId}`);
          }
          
          allFields.forEach(fieldCode => {
            try {
              window.cellStateManager.updateHighlightState(row, fieldCode);
            } catch (error) {
              // 静かに失敗させる
            }
          });
        });
        
      } finally {
        // 自動保存フラグを元に戻す
        window.cellStateManager.autoSaveInitialState = originalAutoSave;
      }
      
      //console.log('✅ 交換後ハイライト状態更新完了');
      
    } catch (error) {
      console.error('❌ 交換後ハイライト更新エラー:', error);
    }
  }

  /**
   * セルに値が入力された時のハイライト削除リスナーを追加（09版から移植）
   * @param {HTMLElement} cell - セル要素
   * @param {string} fieldCode - フィールドコード
   */
  static _addInputListenerForHighlightRemoval(cell, fieldCode) {
    try {
      // input/select/textarea要素を取得
      const inputElements = cell.querySelectorAll('input, select, textarea');
      
      inputElements.forEach(element => {
        // 新しいリスナーを追加
        const handler = (event) => {
          const value = event.target.value?.trim();
          if (value && value !== '') {
            //console.log(`🎯 値入力検出 - ハイライト適用: ${fieldCode} = "${value}"`);
            this._addManualInputHighlight(cell);
            
            // 🎯 CellStateManagerのハイライト更新も呼び出し（セル交換中は初期状態保存を無効化）
            const row = cell.closest('tr');
            if (row && window.cellStateManager) {
              // 行番号を確認
              const rowId = row.getAttribute('data-row-id');
              if (!rowId) {
                console.warn('⚠️ 行番号が見つかりません - CellStateManagerハイライト更新をスキップ');
                return;
              }
              
              const originalAutoSave = window.cellStateManager.autoSaveInitialState;
              
              try {
                // セル交換中は初期状態の自動保存を無効化
                window.cellStateManager.autoSaveInitialState = false;
                window.cellStateManager.updateHighlightState(row, fieldCode);
              } finally {
                window.cellStateManager.autoSaveInitialState = originalAutoSave;
              }
            }
          }
        };
        
        element.addEventListener('input', handler);
        element.addEventListener('change', handler);
        
        // 入力監視設定ログは冗長なため削除
      });
      
    } catch (error) {
      console.error('❌ 入力監視設定エラー:', error);
    }
  }

  /**
   * 手動入力時のハイライトを追加
   * @param {HTMLElement} cell - セル要素
   */
  static _addManualInputHighlight(cell) {
    try {
      //console.log('🎨 手動入力ハイライト適用開始');
      
      const fieldCode = cell.getAttribute('data-field-code');
      const row = cell.closest('tr');
      
      if (row && fieldCode && window.cellStateManager) {
        // 行番号を確認
        const rowId = row.getAttribute('data-row-id');
        if (!rowId) {
          console.warn('⚠️ 行番号が見つかりません - CellStateManagerハイライト更新をスキップ');
          // フォールバックで直接ハイライト適用
          if (window.SimpleHighlightManager) {
            window.SimpleHighlightManager.markCellAsModified(cell);
          } else {
            cell.classList.add('cell-modified');
          }
          return;
        }
        
        // 🎯 手動入力時は初期状態の自動保存を制御
        const originalAutoSave = window.cellStateManager.autoSaveInitialState;
        
        try {
          // 🎯 行番号ベースの初期状態チェックに変更
          const hasInitialState = rowId && window.cellStateManager.rowInitialStates.has(rowId);
          
          if (!hasInitialState) {
            // 初期状態がない場合は自動保存を無効化して直接ハイライト適用
            window.cellStateManager.autoSaveInitialState = false;
          }
          
          // CellStateManagerの統一された状態更新を使用
          window.cellStateManager.updateHighlightState(row, fieldCode);
          
        } finally {
          window.cellStateManager.autoSaveInitialState = originalAutoSave;
        }
      } else {
        // フォールバック: 直接ハイライト適用
        if (window.SimpleHighlightManager) {
          window.SimpleHighlightManager.markCellAsModified(cell);
        } else {
          cell.classList.add('cell-modified');
        }
        
        if (row) {
          if (window.SimpleHighlightManager) {
            window.SimpleHighlightManager.markRowAsModified(row);
          } else {
            row.classList.add('row-modified');
          }
        }
      }
      
      // 手動入力マーカーを追加
      cell.setAttribute('data-manual-input', 'true');
      cell.setAttribute('data-input-timestamp', new Date().toISOString());
      
      //console.log('🎨 手動入力ハイライト適用完了');
      
    } catch (error) {
      console.error('🎨 手動入力ハイライト適用エラー:', error);
    }
  }

  /**
   * セル交換のハイライトを削除（09版から移植）
   * @param {HTMLElement} cell - セル要素
   */
  static _removeExchangeHighlight(cell) {
    try {
      //console.log('🎨 セル交換ハイライト削除開始');
      
      // 🎯 標準的なクラスベースハイライト削除
      if (window.SimpleHighlightManager) {
        window.SimpleHighlightManager.unmarkCellAsModified(cell);
      } else {
        cell.classList.remove('cell-modified');
      }
      
      // 交換データ属性を削除
      cell.removeAttribute('data-exchanged');
      
      //console.log('🎨 セル交換ハイライト削除完了');
      
    } catch (error) {
      console.error('🎨 セル交換ハイライト削除エラー:', error);
    }
  }

  /**
   * 関連フィールドを取得
   * @param {string} sourceApp - アプリタイプ
   * @returns {Array} フィールドコード配列
   */
  static _getRelatedFields(sourceApp) {
    if (!window.fieldsConfig) return [];
    
    return window.fieldsConfig
      .filter(field => field.sourceApp === sourceApp)
      .filter(field => !field.isRecordId)
      .map(field => field.fieldCode);
  }

  /**
   * 同一行警告を表示
   */
  static _showSameRowWarning() {
    const message = "同じ行内での操作はできません";
    console.warn('⚠️', message);
    
    // 簡易的な警告表示
    const warningDiv = document.createElement('div');
    warningDiv.textContent = message;
    warningDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff9800;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      font-weight: bold;
      z-index: 10000;
      animation: fadeOut 3s ease-in-out forwards;
    `;
    
    // アニメーション定義
    if (!document.querySelector('style[data-warning-animation]')) {
      const style = document.createElement('style');
      style.setAttribute('data-warning-animation', '');
      style.textContent = `
        @keyframes fadeOut {
          0% { opacity: 0; transform: translateX(100%); }
          20% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(100%); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(warningDiv);
    
    setTimeout(() => {
      if (warningDiv.parentElement) {
        warningDiv.remove();
      }
    }, 3000);
  }

  /**
   * 🔧 分離復元時の初期状態更新
   */
  static _updateInitialStatesForSeparationRestore(sourceRow, targetRow, sourceData) {
    try {
      if (!window.cellStateManager) return;
      
      const targetRowId = targetRow.getAttribute('data-row-id');
      if (!targetRowId) return;
      
      // 🔧 セル交換の場合は分離復元処理をスキップ
      // セル交換では両方の行に値が存在するため、復元検出ロジックが誤動作する
      const sourceRowId = sourceRow.getAttribute('data-row-id');
      const relatedFields = this._getRelatedFields(sourceData.sourceApp);
      const recordIdField = `${sourceData.sourceApp.toLowerCase()}_record_id`;
      const allFields = [...relatedFields, recordIdField];
      
      // ソース行にも同じフィールドが存在するかチェック（セル交換の判定）
      let sourceHasValues = false;
      allFields.forEach(fieldCode => {
        const sourceCell = this._findCellInRow(sourceRow, fieldCode);
        if (sourceCell) {
          const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
          if (field) {
            const sourceValue = window.cellStateManager._extractCellValue(sourceCell, field);
            if (sourceValue && sourceValue.trim() !== '') {
              sourceHasValues = true;
            }
          }
        }
      });
      
      // セル交換の場合（両方の行に値が存在）は復元処理をスキップ
      if (sourceHasValues) {
        return;
      }
      
      // 🔧 分離復元検出：移動されたフィールドの値が非空になった場合
      let foundNonEmptyField = false;
      const restoredFields = [];
      
      // 移動されたフィールドで値が入ったものをチェック
      allFields.forEach(fieldCode => {
        const cell = this._findCellInRow(targetRow, fieldCode);
        if (cell) {
          const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
          if (field) {
            const currentValue = window.cellStateManager._extractCellValue(cell, field);
            // 値が空でない場合、復元されたと判定
            if (currentValue && currentValue.trim() !== '') {
              foundNonEmptyField = true;
              restoredFields.push(fieldCode);
            }
          }
        }
      });
      
      // 復元が確認された場合、ハイライト状態を完全にクリア
      if (foundNonEmptyField) {
        //console.log('🔧 分離復元検出 - 復元フィールド:', restoredFields);
        this._clearAllHighlightStates(targetRow, allFields);
      }
      
    } catch (error) {
      console.error('❌ 分離復元エラー:', error);
    }
  }

  /**
   * 🔧 ハイライト状態の完全クリア
   */
  static _clearAllHighlightStates(row, fieldCodes) {
    try {
      const rowId = row.getAttribute('data-row-id');
      if (!rowId || !window.cellStateManager) return;
      
      // 行レベルのハイライトクラス除去
      row.classList.remove('row-modified');
      
      fieldCodes.forEach(fieldCode => {
        const cell = this._findCellInRow(row, fieldCode);
        if (cell) {
          // セルレベルのハイライトクラス・属性除去
          cell.classList.remove('cell-modified');
          cell.removeAttribute('data-exchanged');
          cell.removeAttribute('data-manual-input');
          cell.removeAttribute('data-input-timestamp');
          
          // 入力要素のハイライト属性も除去
          const inputs = cell.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            input.removeAttribute('data-manual-input');
            input.removeAttribute('data-input-timestamp');
          });
        }
      });
      
      // 初期状態をクリーンアップして新しい状態として保存
      if (window.cellStateManager.rowInitialStates.has(rowId)) {
        window.cellStateManager.saveRowInitialState(row, 'restore');
      }
      
    } catch (error) {
      console.error('❌ ハイライトクリアエラー:', error);
    }
  }

  /**
   * 🔧 行番号で行を検索（行番号ベースシステム用）
   */
  static _findRowById(rowId) {
    if (!rowId) return null;
    
    const tbody = DOMHelper.getTableBody();
    if (!tbody) return null;
    
    return tbody.querySelector(`tr[data-row-id="${rowId}"]`);
  }


  // /**
  //  * 行内でフィールドに対応するセルを検索
  //  */
  static _findCellInRow(row, fieldCode) {
    const headerRow = document.getElementById("my-thead-row");
    if (!headerRow) return null;

    const headers = Array.from(headerRow.children);
    const fieldIndex = headers.findIndex((th) => {
      // 🔧 オートフィルタによる"▼"サフィックスを正規化
      const headerText = th.textContent?.replace(/▼$/, '') || '';
      const field = fieldsConfig.find((f) => f.label === headerText);
      return field && field.fieldCode === fieldCode;
    });

    if (fieldIndex >= 0 && row.children[fieldIndex]) {
      return row.children[fieldIndex];
    }

    return null;
  }

  /**
   * 交換後に空になった行を削除
   * @param {Array<HTMLElement>} rows - チェック対象の行配列
   */
  static _removeEmptyRowsAfterExchange(rows) {
    // セル移動処理中は空行削除を無効化（誤削除を防ぐ）
    if (window.LedgerApp?.dataManager?._isProcessingCellExchange) {
      return;
    }

    rows.forEach((row) => {
      
      if (RowHelper.isEmpty(row)) {
        row.remove();

        // テーブルの縞模様を更新
        const tbody = DOMHelper.getTableBody();
        if (tbody) {
          RowHelper.updateStripePattern(tbody);
        }
      }
    });
  }

}

// グローバルに公開
window.FieldSeparationService = FieldSeparationService;
window.CellExchangeManager = CellExchangeManager;

// =============================================================================
// 🌐 グローバルユーティリティ関数
// =============================================================================

/**
 * テーブルCSS化をグローバルから実行可能にする
 */
window.convertTableToCSS = function() {
  StyleManager.convertTableToCSS();
};

/**
 * 特定の行のCSS化を実行
 * @param {HTMLElement|string} target - 行要素またはセレクタ
 */
window.convertRowToCSS = function(target) {
  let row;
  if (typeof target === 'string') {
    row = document.querySelector(target);
  } else {
    row = target;
  }
  
  if (row) {
    StyleManager.convertContainerStylesToClasses(row);
  } else {
    console.warn('行が見つかりません:', target);
  }
};

/**
 * 🎯 全てのインラインスタイルを強制変換（ハイライト後用）
 * @param {HTMLElement|string} target - 対象要素またはセレクタ（省略時はテーブル全体）
 */
window.forceConvertAllStyles = function(target) {
  let container;
  
  if (target) {
    if (typeof target === 'string') {
      container = document.querySelector(target);
    } else {
      container = target;
    }
  } else {
    container = document.getElementById('my-tbody');
  }
  
  if (container) {
    StyleManager.forceConvertAllInlineStyles(container);
  } else {
    console.warn('対象要素が見つかりません:', target);
  }
};
