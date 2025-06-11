/**
 * 📋 テーブルコンポーネント - Phase 4-1
 * @description テーブル表示関連の専門クラス集
 * @version 2.3.1
 */

// =============================================================================
// 🏗️ 分離行作成ヘルパー（Phase 4-2新設）
// =============================================================================

/**
 * 🏗️ 分離行作成ヘルパー（Phase 4-2新設）
 * @description 分離処理で使用する行作成・セル作成の専門処理
 */
class SeparatedRowBuilder {
  /**
   * 分離された行を作成・挿入
   * @param {HTMLElement} afterRow - 挿入基準行
   * @param {Object} newRecord - 新しい統合レコード
   * @param {Array<string>} fieldsToShow - 表示するフィールド
   * @returns {HTMLElement} 作成された新しい行
   */
  static createAndInsert(afterRow, newRecord, fieldsToShow) {
    const tbody = afterRow.parentElement;
    const newRow = this._createRowElement(newRecord);

    // 行要素の参照をnewRecordに一時的に付けてセル作成時に使用
    newRecord.tempRow = newRow;

    // フィールド順序を取得してセルを作成
    // TableDataManagerのキャッシュ機能があれば使用、なければDOMHelperを使用
    let fieldOrder;
    if (window.LedgerApp?.dataManager?._getFieldOrder) {
      //console.log(`🔒 分離行作成: TableDataManagerのfieldOrderキャッシュを使用`);
      fieldOrder = window.LedgerApp.dataManager._getFieldOrder();
    } else {
      console.log(`🔄 分離行作成: DOMHelperのfieldOrder取得を使用（フォールバック）`);
      fieldOrder = DOMHelper.getFieldOrderFromHeader();
    }
    fieldOrder.forEach((fieldCode) => {
      const field = fieldsConfig.find((f) => f.fieldCode === fieldCode);
      if (field) {
        const td = this._createCellForField(
          field,
          fieldCode,
          newRecord,
          fieldsToShow
        );
        newRow.appendChild(td);
      }
    });

    // 一時的な参照を削除
    delete newRecord.tempRow;

    // 行を挿入
    this._insertRow(afterRow, newRow, tbody);

    // 行番号セルの値を更新（行がDOMに追加された後）
    const rowId = newRow.getAttribute('data-row-id');
    const rowNumberCell = newRow.querySelector('.row-number-cell');
    if (rowNumberCell && rowId) {
      rowNumberCell.textContent = rowId;
    }

    // 🆕 行番号ベース初期状態管理は分離処理で個別に実行
    // （統合キーベースの saveInitialState は呼び出さない）
    // 分離処理特有の初期状態管理は FieldSeparationService 側で実行

    // 🎯 分離行は変更行としてマーク（値が変更されているため）
    if (window.SimpleHighlightManager && typeof window.SimpleHighlightManager.markRowAsModified === 'function') {
      window.SimpleHighlightManager.markRowAsModified(newRow);
    } else {
      newRow.classList.add('row-modified');
    }

    return newRow;
  }

  /**
   * 行要素を作成
   * @param {Object} newRecord - 新しい統合レコード
   * @returns {HTMLElement} 行要素
   */
  static _createRowElement(newRecord) {
    const newRow = document.createElement("tr");
    // 🎯 分離行のスタイルはCSSクラスで管理
    newRow.classList.add("row-separated");
    newRow.setAttribute("data-integration-key", newRecord.integrationKey);
    newRow.setAttribute("data-separated", "true");
    
          // 分離行にも行番号を追加（getNextRowNumber統一）
    const rowId = window.dataManager.getNextRowNumber();
    newRow.setAttribute('data-row-id', rowId);
    
    return newRow;
  }

  /**
   * フィールドに対応するセルを作成
   * @param {Object} field - フィールド設定
   * @param {string} fieldCode - フィールドコード
   * @param {Object} newRecord - 新しい統合レコード
   * @param {Array<string>} fieldsToShow - 表示するフィールド
   * @returns {HTMLElement} セル要素
   */
  static _createCellForField(field, fieldCode, newRecord, fieldsToShow) {
    const td = document.createElement("td");
    
    // CSSクラスを適用（インラインスタイルの代わり）
    StyleManager.applyCellClasses(td, field.width, false);
    
    // セル要素にdata-field-code属性を設定
    td.setAttribute("data-field-code", field.fieldCode);

    // 行番号フィールドの場合
    if (field.isRowNumber) {
      // 行番号を直接渡すために、まず行から取得
      const row = newRecord.tempRow || td.closest('tr');
      const rowId = row?.getAttribute('data-row-id');
      return TableElementFactory._createRowNumberCell(td, newRecord, rowId);
    }

    // 変更チェックボックスフィールドの場合
    if (field.isModificationCheckbox) {
      return TableElementFactory._createModificationCheckboxCell(td, newRecord);
    }

    if (fieldsToShow.includes(fieldCode)) {
      // 分離されたフィールドの場合、値を表示
      this._createSeparatedFieldCell(td, field, fieldCode, newRecord);
    } else if (
      field.isHideButton ||
      field.isIntegrationKey ||
      field.isRecordId
    ) {
      // 共通フィールド（統合キー、レコードID、非表示ボタン）
      this._createCommonFieldCell(td, field, fieldCode, newRecord);
    } else {
      // 空フィールド
      this._createEmptyFieldCell(td, field, newRecord);
    }

    return td;
  }

  /**
   * 分離されたフィールドのセルを作成
   * @param {HTMLElement} td - セル要素
   * @param {Object} field - フィールド設定
   * @param {string} fieldCode - フィールドコード
   * @param {Object} newRecord - 新しい統合レコード
   */
  static _createSeparatedFieldCell(td, field, fieldCode, newRecord) {
    const value = FieldValueProcessor.process(newRecord, fieldCode, "");

    if (field.isHideButton) {
      TableElementFactory._createHideButtonCell(td, newRecord);
    } else if (
      field.isRecordId &&
      field.sourceApp &&
      newRecord.recordIds &&
      newRecord.recordIds[field.sourceApp]
    ) {
      // レコードIDフィールドの場合はリンクを作成
      const link = document.createElement("a");
      const appId = {
        SEAT: APP_IDS.SEAT,
        PC: APP_IDS.PC,
        EXT: APP_IDS.EXT,
        USER: APP_IDS.USER,
      }[field.sourceApp];

      link.href = `/k/${appId}/show#record=${
        newRecord.recordIds[field.sourceApp]
      }`;
      link.textContent = newRecord.recordIds[field.sourceApp];
      link.target = "_blank";
      // CSSクラスを適用（インラインスタイルの代わり）
      StyleManager.applyLinkClasses(link, 'record');
      td.appendChild(link);
    } else if (field.allowCellDragDrop && TableElementFactory._isFieldAllowedToMove(field)) {
      // ドラッグ&ドロップ機能付きセルを作成（セル移動権限がある場合のみ）
      this._createDragDropContainer(td, field, newRecord, value);
    } else {
      // 編集可能性を判定
      const isEditable =
        TableElementFactory._isFieldEditableForIntegratedRecord(field);

      if (isEditable) {
        // 編集可能な場合は適切なUI要素を作成
        const element =
          field.cellType === "dropdown"
            ? TableElementFactory.createDropdown(field, value || "")
            : TableElementFactory.createInput(field, value || "");

        // 統合レコード用のイベントを設定
        element.setAttribute("data-field", field.fieldCode);
        element.setAttribute(
          "data-integration-key",
          newRecord.integrationKey
        );
        element.setAttribute("data-is-integrated", "true");
        TableElementFactory._setupIntegratedElementEvents(
          element,
          field,
          newRecord
        );

        td.appendChild(element);
      } else {
        // 編集不可の場合はテキストとして表示
        td.textContent = value || "";
        // パディングはCSSクラスで適用
      }
    }

    // 📋 フィルハンドル機能を追加
    TableElementFactory._addFillHandleIfNeeded(td, field, value, newRecord);
  }

  /**
   * 共通フィールドのセルを作成
   * @param {HTMLElement} td - セル要素
   * @param {Object} field - フィールド設定
   * @param {string} fieldCode - フィールドコード
   * @param {Object} newRecord - 新しい統合レコード
   */
  static _createCommonFieldCell(td, field, fieldCode, newRecord) {
    const value = FieldValueProcessor.process(newRecord, fieldCode, "");

    if (field.isHideButton) {
      TableElementFactory._createHideButtonCell(td, newRecord);
    } else {
      TableElementFactory._createIntegratedCell(td, field, value, newRecord);
    }
  }

  /**
   * 空フィールドのセルを作成
   * @param {HTMLElement} td - セル要素
   * @param {Object} field - フィールド設定
   * @param {Object} newRecord - 新しい統合レコード
   */
  static _createEmptyFieldCell(td, field, newRecord) {
    if (field.allowCellDragDrop && TableElementFactory._isFieldAllowedToMove(field)) {
      // 主キーフィールドの場合、ドラッグ&ドロップ機能を設定（セル移動権限がある場合のみ）
      this._createDragDropContainer(td, field, newRecord);
    } else if (field.cellType === "dropdown" || field.cellType === "input") {
      // 編集可能フィールドの場合、UI要素を作成
      this._createEditableElement(td, field, newRecord);
    } else {
      // 通常の空セル
      td.textContent = "";
      // スタイルはCSSクラスで適用
      td.classList.add('cell-empty');
    }
  }

  /**
   * ドラッグ&ドロップ機能付きコンテナを作成
   * @param {HTMLElement} td - セル要素
   * @param {Object} field - フィールド設定
   * @param {Object} newRecord - 新しい統合レコード
   * @param {string} value - 表示値（オプション）
   */
  static _createDragDropContainer(td, field, newRecord, value = "") {
    // 🔄 セル移動権限をチェック
    if (!TableElementFactory._isFieldAllowedToMove(field)) {
      // セル移動不可の場合は、通常のテキスト表示に変更
      td.textContent = value || "";
      // パディングはCSSクラスで適用
      console.log(`🚫 分離行セル移動不可: ${field.fieldCode} (権限なし)`);
      return;
    }
    
    // 🎯 新しいSeparateButtonManagerを使用
    SeparateButtonManager.createAndAttach(td, field, newRecord, value);

    // 🔧 分離行のセルにdata-field-code属性を設定
    td.setAttribute('data-field-code', field.fieldCode);
    
    // ドラッグ&ドロップ機能を設定
    console.log(`🔧 分離行ドラッグ&ドロップ設定: ${field.fieldCode}`);
    TableElementFactory._setupCellDragAndDrop(td, field, value, newRecord);
    
    // 🔧 分離行の分離対象セルには必要な属性を設定
    if (TableElementFactory._isFieldAllowedToMove(field)) {
      td.setAttribute('data-exchanged', 'true');
      td.setAttribute('data-drag-drop-initialized', 'true');
      td.draggable = true;
      td.style.cursor = "grab";
      td.style.position = "relative";
      console.log(`🔧 分離行セルに必要属性を設定: ${field.fieldCode} (exchanged, drag-drop-initialized, draggable)`);
    }
    
    // ドラッグ&ドロップ設定後の確認
    if (td.draggable) {
      console.log(`✅ 分離行ドラッグ&ドロップ設定完了: ${field.fieldCode}`);
    } else {
      console.warn(`⚠️ 分離行ドラッグ&ドロップ設定失敗: ${field.fieldCode}`);
      // 分離行の場合、強制的にドラッグ可能にする
      td.draggable = true;
      td.style.cursor = "grab";
      console.log(`🔧 分離行ドラッグ強制有効化: ${field.fieldCode}`);
    }
  }

  // /**
  //  * 分離ボタンを作成（新しいマネージャーを使用）
  //  * @param {Object} field - フィールド設定
  //  * @param {Object} newRecord - 新しい統合レコード
  //  * @returns {HTMLElement} 分離ボタン
  //  * @deprecated SeparateButtonManager.createAndAttach() を直接使用してください
  //  */
  // static _createSeparateButton(field, newRecord) {
  //   console.warn('⚠️ _createSeparateButton() は非推奨です。SeparateButtonManager.createAndAttach() を使用してください');
    
  //   // 新しいマネージャーのメソッドを使用
  //   const tempCell = document.createElement('td');
  //   return SeparateButtonManager._createButton(field, newRecord);
  // }

  /**
   * 編集可能要素を作成
   * @param {HTMLElement} td - セル要素
   * @param {Object} field - フィールド設定
   * @param {Object} newRecord - 新しい統合レコード
   */
  static _createEditableElement(td, field, newRecord) {
    const element =
      field.cellType === "dropdown"
        ? TableElementFactory.createDropdown(field, "")
        : TableElementFactory.createInput(field, "");

    element.setAttribute("data-field", field.fieldCode);
    element.setAttribute("data-integration-key", newRecord.integrationKey);
    element.setAttribute("data-is-integrated", "true");

    TableElementFactory._setupIntegratedElementEvents(element, field, newRecord);
    td.appendChild(element);

    // 📋 フィルハンドル機能を追加
    TableElementFactory._addFillHandleIfNeeded(td, field, "", newRecord);
  }

  /**
   * 行を挿入
   * @param {HTMLElement} afterRow - 挿入基準行
   * @param {HTMLElement} newRow - 新しい行
   * @param {HTMLElement} tbody - テーブルボディ
   */
  static _insertRow(afterRow, newRow, tbody) {
    afterRow.insertAdjacentElement("afterend", newRow);

    // 縞模様を再設定
    RowHelper.updateStripePattern(tbody);
  }

  /**
   * 🔧 fieldsConfigからアプリIDを動的取得
   * @param {string} fieldCode - フィールドコード
   * @returns {string|null} アプリID
   */
  static _getAppIdFromFieldsConfig(fieldCode) {
    if (!window.fieldsConfig || !window.APP_IDS) {
      console.error('❌ fieldsConfigまたはAPP_IDSが見つかりません');
      return null;
    }
    
    const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
    if (!field || !field.sourceApp) {
      console.warn(`⚠️ フィールド設定が見つかりません: ${fieldCode}`);
      return null;
    }
    
    // sourceAppからアプリIDマッピングを取得
    const appIdMapping = {
      'SEAT': window.APP_IDS.SEAT,
      'PC': window.APP_IDS.PC,
      'EXT': window.APP_IDS.EXT,
      'USER': window.APP_IDS.USER
    };
    
    const appId = appIdMapping[field.sourceApp];
    if (!appId) {
      console.warn(`⚠️ アプリID設定が見つかりません: ${field.sourceApp} (${fieldCode})`);
      return null;
    }
    return appId;
  }
}

// =============================================================================
// 🎯 分離ボタン管理（Phase 4-3 新設）
// =============================================================================

/**
 * 🎯 分離ボタン専用管理クラス
 * @description 分離ボタンの作成・削除・更新を一元管理し、重複や増殖を防ぐ
 */
class SeparateButtonManager {
  constructor() {
    throw new Error("SeparateButtonManager は静的メソッドのみ提供します");
  }

  /**
   * 分離ボタンを作成・配置（統一メソッド）
   * @param {HTMLElement} parentCell - 親セル要素
   * @param {Object} field - フィールド設定
   * @param {Object} record - レコードオブジェクト
   * @param {string} value - セル値
   * @returns {HTMLElement} 作成された分離ボタン
   */
  static createAndAttach(parentCell, field, record, value = "") {
    // 🔧 既存の分離関連要素を削除（増殖防止）
    this.removeExisting(parentCell);
    
    // 🔧 フレックスコンテナを常に新規作成して値を正しく設定
    const container = this._createFlexContainer(parentCell, value);
    
    // 分離ボタンを作成
    const button = this._createButton(field, record);
    
    // コンテナに追加
    container.appendChild(button);
    
    // イベントハンドラーを設定
    this._setupEventHandlers(button, field, record);
    
    console.log(`✅ 分離ボタン作成完了: ${field.fieldCode}`, button);
    
    return button;
  }

  /**
   * 既存の分離関連要素を削除（増殖防止）
   * @param {HTMLElement} cell - 対象セル
   */
  static removeExisting(cell) {
    const existingButtons = cell.querySelectorAll('.separate-button');
    const existingContainers = cell.querySelectorAll('.flex-container');
    
    let removedCount = 0;
    
    if (existingButtons.length > 0) {
      console.log(`🔧 分離ボタン重複削除: ${existingButtons.length}個`);
      existingButtons.forEach(btn => {
        btn.remove();
        removedCount++;
      });
    }
    
    // 空のコンテナも削除
    existingContainers.forEach(container => {
      if (!container.querySelector('.flex-value') || container.querySelector('.flex-value').textContent.trim() === '') {
        console.log(`🔧 空のflexコンテナ削除`);
        container.remove();
      } else if (container.children.length === 1 && container.querySelector('.flex-value')) {
        // 値のみでボタンがない場合は、コンテナを解除してプレーンテキストに戻す
        const valueSpan = container.querySelector('.flex-value');
        const parent = container.parentElement;
        parent.textContent = valueSpan.textContent;
        container.remove();
      }
    });
    
    if (removedCount > 0) {
      console.log(`🔧 分離ボタン増殖防止完了: ${removedCount}個削除`);
    }
  }

  /**
   * セル内の分離ボタンを更新
   * @param {HTMLElement} cell - 対象セル
   * @param {Object} field - フィールド設定
   * @param {Object} record - レコードオブジェクト
   * @param {string} value - 新しい値
   */
  static updateButton(cell, field, record, value) {
    // 既存を削除して新しく作成
    this.removeExisting(cell);
    
    // 値がある場合のみ分離ボタンを作成
    if (value && value.trim() !== '') {
      this.createAndAttach(cell, field, record, value);
    }
  }

  /**
   * フレックスコンテナを作成または更新
   * @param {HTMLElement} parentCell - 親セル
   * @param {string} value - セル値
   * @returns {HTMLElement} フレックスコンテナ
   */
  static _createFlexContainer(parentCell, value) {
    const container = document.createElement("div");
    container.className = "flex-container";
    
    // 値表示用スパンを作成
    const valueSpan = document.createElement("span");
    valueSpan.className = "flex-value";
    valueSpan.textContent = value || "";
    
    container.appendChild(valueSpan);
    
    // 既存の内容をクリアしてコンテナを追加
    parentCell.innerHTML = "";
    parentCell.appendChild(container);
    
    return container;
  }

  /**
   * 分離ボタン要素を作成
   * @param {Object} field - フィールド設定
   * @param {Object} record - レコードオブジェクト
   * @returns {HTMLElement} 分離ボタン
   */
  static _createButton(field, record) {
    const button = document.createElement("button");
    button.textContent = "↗️";
    button.className = "separate-button";
    button.title = `${field.fieldCode} ${field.label}とその関連フィールドを分離して新しい行に移動`;
    
    // データ属性を設定
    button.setAttribute("data-field-code", field.fieldCode);
    button.setAttribute("data-source-app", field.sourceApp);
    button.setAttribute("data-separation-button", "true");
    button.setAttribute("data-debug", "separate-button-manager-created");
    
    // CSSクラス適用（StyleManagerを使用）
    if (window.StyleManager && typeof window.StyleManager.applyButtonClasses === 'function') {
      window.StyleManager.applyButtonClasses(button, 'separate');
    }
    
    return button;
  }

  /**
   * イベントハンドラーを設定
   * @param {HTMLElement} button - 分離ボタン
   * @param {Object} field - フィールド設定
   * @param {Object} record - レコードオブジェクト
   */
  static _setupEventHandlers(button, field, record) {
    // クリックイベント
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      console.log(`🎯 分離ボタンクリック: ${field.fieldCode}`, { field, record });
      
      const currentRow = button.closest("tr");
      if (currentRow && record) {
        console.log(`🎯 分離処理開始: 行=${currentRow.getAttribute('data-row-id')}`);
        
        // CellExchangeManagerの分離メソッドを呼び出し
        if (window.CellExchangeManager && typeof window.CellExchangeManager._separateFieldToNewRow === 'function') {
          CellExchangeManager._separateFieldToNewRow(field, record, currentRow);
        } else {
          console.error(`❌ 分離処理メソッドが見つかりません`);
        }
      } else {
        console.error(`❌ 分離処理失敗: currentRow=${!!currentRow}, record=`, record);
      }
    });
    
    // テスト用イベント（デバッグ時に削除可能）
    button.addEventListener('mousedown', (e) => {
      console.log(`🧪 分離ボタンmousedown: ${field.fieldCode}`);
    });
    
    console.log(`✅ 分離ボタンイベント設定完了: ${field.fieldCode}`);
  }

  /**
   * セル内に分離ボタンが必要かどうかを判定
   * @param {Object} field - フィールド設定
   * @param {string} value - セル値
   * @param {boolean} isIntegratedRecord - 統合レコードかどうか
   * @returns {boolean} 分離ボタンが必要かどうか
   */
  static shouldCreateButton(field, value, isIntegratedRecord) {
    return isIntegratedRecord && 
           field.allowCellDragDrop && 
           value && 
           value.trim() !== '';
  }

  /**
   * 全ての分離ボタンを更新（テーブル全体）
   * @param {HTMLElement} tbody - テーブルボディ
   */
  static updateAllButtons(tbody) {
    const cells = tbody.querySelectorAll('td[data-field-code]');
    let updateCount = 0;
    
    cells.forEach(cell => {
      const fieldCode = cell.getAttribute('data-field-code');
      const field = window.fieldsConfig?.find(f => f.fieldCode === fieldCode);
      
      if (field && field.allowCellDragDrop) {
        const row = cell.closest('tr');
        const integrationKey = row?.getAttribute('data-integration-key');
        
        if (integrationKey && integrationKey !== 'null') {
          const value = this._extractCellValue(cell);
          
          if (this.shouldCreateButton(field, value, true)) {
            const record = { integrationKey };
            this.updateButton(cell, field, record, value);
            updateCount++;
          }
        }
      }
    });
    
    console.log(`🔄 分離ボタン一括更新完了: ${updateCount}個更新`);
  }

  /**
   * セルから値を抽出
   * @param {HTMLElement} cell - セル要素
   * @returns {string} セル値
   */
  static _extractCellValue(cell) {
    const input = cell.querySelector('input');
    const select = cell.querySelector('select');
    const flexValue = cell.querySelector('.flex-value');
    
    if (input) return input.value || '';
    if (select) return select.value || '';
    if (flexValue) {
      // 🔧 分離ボタンアイコン（↗️）を除去して純粋な値のみ取得
      let value = flexValue.textContent || '';
      return value.replace(/↗️/g, '').trim();
    }
    
    // フォールバック：セル全体から値を取得（分離ボタンアイコンを除去）
    let value = cell.textContent.trim() || '';
    return value.replace(/↗️/g, '').trim();
  }

  /**
   * デバッグ情報を取得
   * @param {HTMLElement} tbody - テーブルボディ
   * @returns {Object} デバッグ情報
   */
  static getDebugInfo(tbody) {
    const buttons = tbody.querySelectorAll('.separate-button');
    const containers = tbody.querySelectorAll('.flex-container');
    
    return {
      buttonCount: buttons.length,
      containerCount: containers.length,
      buttonsWithDebug: Array.from(buttons).filter(btn => btn.getAttribute('data-debug')?.includes('manager')).length,
      duplicateButtons: this._findDuplicateButtons(tbody)
    };
  }

  /**
   * 重複ボタンを検出
   * @param {HTMLElement} tbody - テーブルボディ
   * @returns {Array} 重複ボタン情報
   */
  static _findDuplicateButtons(tbody) {
    const duplicates = [];
    const cells = tbody.querySelectorAll('td[data-field-code]');
    
    cells.forEach(cell => {
      const buttons = cell.querySelectorAll('.separate-button');
      if (buttons.length > 1) {
        duplicates.push({
          fieldCode: cell.getAttribute('data-field-code'),
          count: buttons.length,
          cell: cell
        });
      }
    });
    
    return duplicates;
  }
}

// =============================================================================
// 🏭 テーブル要素ファクトリー
// =============================================================================

/**
 * 🏭 テーブル要素ファクトリー
 * @description テーブル内の各種UI要素を作成・管理
 */
class TableElementFactory {
  constructor() {
    throw new Error("TableElementFactory は静的メソッドのみ提供します");
  }

  /**
   * ドロップダウン要素を作成
   */
  static createDropdown(field, value) {
    const select = document.createElement("select");
    const width = field.width ? `calc(${field.width} - 2px)` : "100%";
    this._applyStylesToElement(select, StyleManager.getInputStyles(width));

    // 空の選択肢を追加
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "---";
    select.appendChild(emptyOption);

    // オプションを追加
    field.options?.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = opt.value === value;
      option.style.fontSize = "11px";
      select.appendChild(option);
    });

    return select;
  }
  
  // =============================================================================
  // 🎯 パフォーマンス改善: 軽量セル作成機能
  // =============================================================================

  /**
   * 🚀 軽量セル作成（パフォーマンス重視）
   * @description プレーンテキストのみの軽量セルを作成
   * @param {Object} field - フィールド設定
   * @param {string} value - セル値
   * @param {Object} record - レコードオブジェクト
   * @param {string} appId - アプリケーションID
   * @returns {HTMLElement} 軽量セル要素
   */
  static createLightweightCell(field, value, record, appId) {
    const td = document.createElement("td");
    
    // 基本スタイルのみ適用（ドラッグ無効）
    StyleManager.applyCellClasses(td, field.width, false);
    td.setAttribute("data-field-code", field.fieldCode);
    
    // 🎯 軽量モード用の特別処理
    if (field.isRowNumber) {
      return this._createLightweightRowNumberCell(td, record);
    }

    if (field.isModificationCheckbox) {
      // 軽量モードでは空のチェックボックスセルを作成（列数を維持）
      td.classList.add('lightweight-checkbox-cell');
      td.classList.add('modification-checkbox-cell'); // 検索で見つけられるようにクラス名を追加
      td.textContent = "";
      // display: noneは使わず、空のセルとして表示
      return td;
    }

    if (field.isHideButton) {
      // 軽量モードでは空の非表示ボタンセルを作成（列数を維持）
      td.classList.add('lightweight-hide-button-cell');
      td.textContent = "";
      // display: noneは使わず、空のセルとして表示
      return td;
    }

    // レコードIDフィールドの場合はリンクを作成（軽量版）
    if (field.isRecordId && value && appId) {
      this._createRecordIdLink(td, value, field.fieldCode, appId);
    } else {
      // プレーンテキストのみ設定（input/select要素は作成しない）
      td.textContent = value || "";
    }
    
    // 軽量モード識別用のマーカーを追加
    td.setAttribute("data-lightweight", "true");
    
    return td;
  }

  /**
   * 軽量版行番号セルを作成
   */
  static _createLightweightRowNumberCell(td, record, rowId = null) {
    let rowNumber = rowId;
    
    if (!rowNumber) {
      const row = td.closest('tr') || td.parentElement;
      if (row && row.getAttribute('data-row-id')) {
        rowNumber = row.getAttribute('data-row-id');
      }
    }
    
    if (!rowNumber) {
      rowNumber = "?";
    }
    
    td.textContent = rowNumber;
    td.classList.add("row-number-cell");
    td.setAttribute("data-lightweight", "true");
    
    return td;
  }

  // =============================================================================

  /**
   * セル要素を作成（メインエントリーポイント）
   */
  static createCell(field, value, record, appId) {
    const td = document.createElement("td");
    
    // CSSクラスを適用（インラインスタイルの代わり）
    StyleManager.applyCellClasses(td, field.width, false);

    // セル要素にdata-field-code属性を設定
    td.setAttribute("data-field-code", field.fieldCode);

          // 行番号フィールドの場合
    if (field.isRowNumber) {
      return this._createRowNumberCell(td, record);
    }

    // 変更チェックボックスフィールドの場合
    if (field.isModificationCheckbox) {
      return this._createModificationCheckboxCell(td, record);
    }

    // 非表示ボタンフィールドの場合
    if (field.isHideButton) {
      return this._createHideButtonCell(td, record);
    }

    // 統合レコードの場合の処理
    if (record.isIntegratedRecord) {
      return this._createIntegratedCell(td, field, value, record);
    }

    const ledgerType =
      record.$ledger_type?.value ||
      document.querySelector('select[data-field="$ledger_type"]')?.value ||
      "";

    const isEditable = this._isFieldEditable(field, ledgerType);

    if (!isEditable) {
      this._createStaticCell(td, field, value, record, appId);
    } else {
      this._createEditableCell(td, field, value, record);
    }

    return td;
  }

  /**
   * 入力要素を作成
   */
  static createInput(field, value) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    const width = field.width ? `calc(${field.width} - 2px)` : "100%";
    this._applyStylesToElement(input, StyleManager.getInputStyles(width));
    return input;
  }

  /**
   * スタイルを要素に適用
   */
  static _applyStylesToElement(element, styles) {
    Object.assign(element.style, styles);
  }

  /**
   * フィールドが編集可能かどうかを判定
   */
  static _isFieldEditable(field, ledgerType) {
    // 統合キーフィールドや非表示ボタンは編集不可
    if (field.isIntegrationKey || field.isHideButton) {
      return false;
    }

    // レコードIDフィールドは編集不可
    if (field.isRecordId) {
      return false;
    }

    // editableFromが設定されていない場合は編集可能
    if (!field.editableFrom || field.editableFrom.length === 0) {
      return true;
    }

    // ledgerTypeがeditableFromに含まれているかチェック
    return field.editableFrom.includes(ledgerType);
  }

  /**
   * 統合レコードでのフィールド編集可能性を判定
   */
  static _isFieldEditableForIntegratedRecord(field) {
    // 統合キーやレコードIDフィールドは編集不可
    if (field.isIntegrationKey || field.isRecordId) {
      return false;
    }

    // 非表示ボタンは編集不可
    if (field.isHideButton) {
      return false;
    }

    // cellTypeに基づいて判定
    return field.cellType === "input" || field.cellType === "dropdown";
  }

  // 基本的な静的セル作成
  static _createStaticCell(td, field, value, record, appId) {
    if (field.isRecordId && value && appId) {
      this._createRecordIdLink(td, value, field.fieldCode, appId);
    } else {
      td.textContent = value || "";
      // パディングはCSSクラスで適用
    }
  }

  // レコードIDリンク作成
  static _createRecordIdLink(td, recordId, fieldCode, appId) {
    const link = document.createElement("a");
    link.href = `/k/${appId}/show#record=${recordId}`;
    link.textContent = recordId;
    link.target = "_blank";
    // CSSクラスベースのスタイル適用
    StyleManager.applyLinkClasses(link, 'record');
    td.appendChild(link);
  }

  // 編集可能セル作成
  static _createEditableCell(td, field, value, record) {
    const element = field.cellType === "dropdown" 
      ? this.createDropdown(field, value || "")
      : this.createInput(field, value || "");

    element.setAttribute("data-field", field.fieldCode);
    this._setupElementEvents(element, field, record);
    td.appendChild(element);
  }

  // 基本イベント設定
  static _setupElementEvents(element, field, record) {
    // 基本的なイベントリスナー設定
    element.addEventListener("change", () => {
      //console.log(`フィールド変更: ${field.fieldCode} = ${element.value}`);
    });
  }

  /**
   * 行番号セルを作成
   */
  static _createRowNumberCell(td, record, rowId = null) {
    // 行番号を表示（引数で渡されるか、data-row-idから取得）
    let rowNumber = rowId;
    
    if (!rowNumber) {
      const row = td.closest('tr') || td.parentElement;
      if (row && row.getAttribute('data-row-id')) {
        rowNumber = row.getAttribute('data-row-id');
      }
    }
    
    // まだ行番号が取得できない場合は「?」を表示
    if (!rowNumber) {
      rowNumber = "?";
    }
    
    td.textContent = rowNumber;
    // スタイルはCSSクラスで適用済み
    td.classList.add("row-number-cell");

    return td;
  }

  /**
   * 変更チェックボックスセルを作成
   */
  static _createModificationCheckboxCell(td, record) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("modification-checkbox");
    
    // チェックボックスを中央揃えにするためのスタイル設定
    td.style.textAlign = "center";
    td.style.verticalAlign = "middle";
    
    // 初期状態でのチェック状態を確認
    // この時点では行がまだDOMに追加されていない可能性があるため、
    // 後でupdateModificationCheckboxStateを呼び出す
    checkbox.checked = false;
    
    // ✅ 手動操作イベントを追加
    checkbox.addEventListener('click', (event) => {
      const row = checkbox.closest('tr');
      if (row) {
        // 手動で外された場合の状態を記録
        if (!checkbox.checked) {
          row.setAttribute('data-checkbox-manually-unchecked', 'true');
          
          // ✅ デバッグログ（フィーチャーフラグで制御）
          if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
            //console.log('🔍 チェックボックス手動解除:', row.getAttribute('data-row-id'));
          }
        } else {
          // 手動でチェックを入れた場合は手動解除フラグを削除
          row.removeAttribute('data-checkbox-manually-unchecked');
          
          // ✅ デバッグログ（フィーチャーフラグで制御）
          if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
           // console.log('🔍 チェックボックス手動チェック:', row.getAttribute('data-row-id'));
          }
        }
      }
    });
    
    td.appendChild(checkbox);
    td.classList.add("modification-checkbox-cell");
    
    return td;
  }

  /**
   * 変更チェックボックスの状態を更新
   */
  static updateModificationCheckboxState(row) {
    // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
    // 自動更新は完全に無効化
    return;
    
    // 無効化されたコード:
    // if (!row) return;
    // 
    // // 🎯 パフォーマンス改善: 軽量モードではチェックボックス更新をスキップ
    // if (window.TableEditMode && window.TableEditMode.isLightweightMode()) {
    //   return; // 軽量モードでは何もしない
    // }
    // 
    // const rowId = row.getAttribute('data-row-id');
    // const checkboxCell = row.querySelector('.modification-checkbox-cell');
    // if (!checkboxCell) {
    //   // 軽量モードでない場合のみ警告を出力
    //   if (!window.TableEditMode || !window.TableEditMode.isLightweightMode()) {
    //     console.warn(`⚠️ チェックボックスセルが見つかりません: 行番号=${rowId}`);
    //   }
    //   return;
    // }
    // 
    // const checkbox = checkboxCell.querySelector('.modification-checkbox');
    // if (!checkbox) {
    //   console.warn(`⚠️ チェックボックスが見つかりません: 行番号=${rowId}`);
    //   return;
    // }
    // 
    // // 行にrow-modifiedクラスがあるか、または行内にcell-modifiedクラスのセルがあるかチェック
    // const hasRowModified = row.classList.contains('row-modified');
    // const hasCellModified = row.querySelector('.cell-modified') !== null;
    // const shouldAutoCheck = hasRowModified || hasCellModified;
    // 
    // // 手動で外されたかどうかをチェック
    // const isManuallyUnchecked = row.hasAttribute('data-checkbox-manually-unchecked');
    // 
    // const beforeChecked = checkbox.checked;
    // 
    // // 自動チェック条件を満たしている場合
    // if (shouldAutoCheck) {
    //   // 手動で外されていても、変更がある場合は自動でチェックを入れる
    //   // ただし、手動解除フラグは保持して、変更がなくなったときに再度外れるようにする
    //   checkbox.checked = true;
    // } else {
    //   // 変更がない場合
    //   if (isManuallyUnchecked) {
    //     // 手動で外された状態を維持
    //     checkbox.checked = false;
    //     // 変更がなくなったので手動解除フラグをクリア
    //     row.removeAttribute('data-checkbox-manually-unchecked');
    //   } else {
    //     // 通常の自動制御
    //     checkbox.checked = false;
    //   }
    // }
    // 
    // // 状態変更があった場合のみログ出力
    // if (beforeChecked !== checkbox.checked) {
    //   //console.log(`🔍 チェックボックス状態変更: 行番号=${rowId}, ${beforeChecked} → ${checkbox.checked}, row-modified=${hasRowModified}, cell-modified=${hasCellModified}, manually-unchecked=${isManuallyUnchecked}`);
    // }
  }

  /**
   * ✅ テーブル全体のチェックボックス状態を更新
   * @param {HTMLElement} tbody - テーブルボディ要素（省略時は自動検索）
   */
  static updateAllModificationCheckboxes(tbody = null) {
    // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
    // 自動更新は完全に無効化
    return;
    
    // 無効化されたコード:
    // if (!tbody) {
    //   tbody = document.querySelector('#my-tbody, tbody');
    // }
    // 
    // if (!tbody) {
    //   console.warn('⚠️ テーブルボディが見つかりません');
    //   return;
    // }
    // 
    // const rows = tbody.querySelectorAll('tr');
    // let updatedCount = 0;
    // 
    // rows.forEach(row => {
    //   this.updateModificationCheckboxState(row);
    //   updatedCount++;
    // });
    // 
    // // ✅ デバッグログ（フィーチャーフラグで制御）
    // //if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
    // //  console.log(`🔍 全チェックボックス状態更新完了: ${updatedCount}行`);
    // //}
  }

  /**
   * 行番号セルを作成（古いメソッド名との互換性保持）
   */
  static _createRowNumberCellLegacy(td, record, rowId = null) {
    return this._createRowNumberCell(td, record, rowId);
  }

  /**
   * 非表示ボタンセルを作成
   */
  static _createHideButtonCell(td, record) {
    const hideButton = document.createElement("button");
    hideButton.textContent = "👁️‍🗨️";
    hideButton.title = "この行を表示から非表示にします（データベースからは削除されません）";

    // CSSクラスベースのスタイル適用
    StyleManager.applyButtonClasses(hideButton, 'hide');

    // CSSクラスでホバー効果を処理（既存の.hide-button:hoverを使用）

    // クリックイベント
    hideButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const row = hideButton.closest("tr");
      if (row) {
        row.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
        row.style.opacity = "0";
        row.style.transform = "translateX(-20px)";

        setTimeout(() => {
          row.style.display = "none";

          const tbody = document.getElementById("my-tbody");
          if (tbody) {
            const visibleRows = Array.from(tbody.children).filter(
              (row) => row.style.display !== "none"
            );

            if (visibleRows.length === 0) {
              const tr = document.createElement("tr");
              const td = document.createElement("td");
              td.colSpan = fieldsConfig.length;
              td.textContent = "表示するデータがありません（非表示にした行があります）";
              td.className = "text-muted";
              td.style.textAlign = "center";
              td.style.padding = "20px";
              td.style.fontStyle = "italic";
              tr.appendChild(td);
              tbody.appendChild(tr);
            }
          }
        }, 400);
      }
    });

    td.appendChild(hideButton);
    return td;
  }

  // 統合セル作成の簡易版
  static _createIntegratedCell(td, field, value, record) {
    // レコードIDフィールドの場合
    if (field.isRecordId && value) {
      // fieldsConfigからアプリIDを動的に取得
      let appId = SeparatedRowBuilder._getAppIdFromFieldsConfig(field.fieldCode);
      
      if (appId) {
        this._createRecordIdLink(td, value, field.fieldCode, appId);
        this._setupCellDragAndDrop(td, field, value, record);
        return td;
      }
    }

    // 分離ボタン付きフィールドの場合（セル移動権限がある場合のみ）
    if (field.allowCellDragDrop && value && this._isFieldAllowedToMove(field)) {
      // 🎯 新しいSeparateButtonManagerを使用
      SeparateButtonManager.createAndAttach(td, field, record, value);
      
      // ドラッグ&ドロップ機能を設定
      this._setupCellDragAndDrop(td, field, value, record);
      return td;
    }

    // 基本的な統合セル作成
    if (field.cellType === "dropdown") {
      const element = this.createDropdown(field, value || "");
      element.setAttribute("data-field", field.fieldCode);
      element.setAttribute("data-integration-key", record.integrationKey);
      this._setupIntegratedElementEvents(element, field, record);
      td.appendChild(element);
    } else if (field.cellType === "input") {
      const element = this.createInput(field, value || "");
      element.setAttribute("data-field", field.fieldCode);
      element.setAttribute("data-integration-key", record.integrationKey);
      this._setupIntegratedElementEvents(element, field, record);
      td.appendChild(element);
    } else {
      td.textContent = value || "";
      // パディングはCSSクラスで適用
    }

    // セルドラッグアンドドロップ機能を設定
    this._setupCellDragAndDrop(td, field, value, record);

    // 📋 フィルハンドル機能を追加
    this._addFillHandleIfNeeded(td, field, value, record);

    return td;
  }

  // 統合要素イベント設定の簡易版
  static _setupIntegratedElementEvents(element, field, record) {
    element.addEventListener("change", () => {
    });
  }

  /**
   * キーから行を検索 (CellExchangeManagerが使用)
   * @param {string} recordKey - レコードキー
   * @param {boolean} isIntegratedRecord - 統合レコードかどうか
   * @returns {HTMLElement|null} 行要素
   */
  // static _findRowByKey(recordKey, isIntegratedRecord) {
  //   const tbody = document.getElementById("my-tbody");
  //   if (!tbody) return null;
    
  //   const attribute = isIntegratedRecord ? 'data-integration-key' : 'data-record-key';
  //   return tbody.querySelector(`tr[${attribute}="${recordKey}"]`);
  // }

  /**
   * 現在の統合キーで行を検索（フォールバック用）
   */
  static _findRowByCurrentIntegrationKey(data) {
    const tbody = document.getElementById("my-tbody");
    if (!tbody) return null;

    // 値が空の場合は、DOM要素から直接行を特定を試みる
    if (!data.value || data.value.trim() === "") {
      //console.log(`Attempting to find row for empty field by DOM context`);

      // ターゲット要素の参照があれば、それから行を特定（ドロップ先を優先）
      if (data.targetElement) {
        const row = data.targetElement.closest("tr");
        if (row && row.getAttribute("data-integration-key")) {
          console.log(
            `Found row by target element: ${row.getAttribute(
              "data-integration-key"
            )}`
          );
          return row;
        }
      }

      // ターゲット行の直接指定があれば使用（ドロップ先を優先）
      if (data.targetRow && data.targetRow.getAttribute("data-integration-key")) {
        console.log(
          `Found row by target row: ${data.targetRow.getAttribute(
            "data-integration-key"
          )}`
        );
        return data.targetRow;
      }

      // すべての行を調べて、該当するアプリのフィールドが空の行を探す
      const rows = Array.from(
        tbody.querySelectorAll("tr[data-integration-key]")
      );
      for (const row of rows) {
        const integrationKey = row.getAttribute("data-integration-key");
        const appPrimaryKey = this._getAppPrimaryKeyFromRow(
          row,
          data.sourceApp
        );

        // 該当アプリの主キーが統合キーに含まれていない（空フィールド）かチェック
        if (!appPrimaryKey) {
          console.log(
            `Found row with empty field for app ${data.sourceApp}: ${integrationKey}`
          );
          return row;
        }
      }

      console.log(
        `Could not find row with empty field for app: ${data.sourceApp}`
      );
      return null;
    }

    // 主キーフィールドの値から統合キーを構築して検索
    const rows = Array.from(
      tbody.querySelectorAll("tr[data-integration-key]")
    );

    for (const row of rows) {
      // 該当するアプリの主キーフィールドをチェック
      const appPrimaryKey = this._getAppPrimaryKeyFromRow(
        row,
        data.sourceApp
      );

      if (appPrimaryKey && data.value && appPrimaryKey.includes(data.value)) {
        console.log(
          `Found row by primary key value: ${
            data.value
          } in integration key: ${row.getAttribute("data-integration-key")}`
        );
        return row;
      }
    }

    console.log(
      `Could not find row with primary key value: ${data.value} for app: ${data.sourceApp}`
    );
    return null;
  }

  /**
   * 行から指定アプリの主キー値を取得
   */
  static _getAppPrimaryKeyFromRow(row, sourceApp) {
    const integrationKey = row.getAttribute("data-integration-key");
    if (!integrationKey) return null;

    const prefix = {
      SEAT: "SEAT:",
      PC: "PC:",
      EXT: "EXT:",
      USER: "USER:",
    }[sourceApp];

    if (!prefix) return null;

    // 統合キーから該当アプリの部分を抽出
    const parts = integrationKey.split("|");
    for (const part of parts) {
      if (part.startsWith(prefix)) {
        return part;
      }
    }

    return null;
  }

  /**
   * 関連フィールドを取得（指定アプリの）
   * @param {string} sourceApp - アプリタイプ
   * @returns {Array<string>} 関連フィールドコード配列
   */
  static _getRelatedFields(sourceApp) {
    return fieldsConfig
      .filter((field) => field.sourceApp === sourceApp)
      .filter((field) => !field.isRecordId) // 🔧 レコードIDフィールドを除外
      .map((field) => field.fieldCode);
  }

  /**
   * 行内のセルを検索
   * @param {HTMLElement} row - 行要素
   * @param {string} fieldCode - フィールドコード
   * @returns {HTMLElement|null} セル要素
   */
  static _findCellInRow(row, fieldCode) {
    if (!row) return null;

    const headerRow = document.getElementById("my-thead-row");
    if (!headerRow) return null;

    const headers = Array.from(headerRow.children);
    const field = fieldsConfig.find((f) => f.fieldCode === fieldCode);
    if (!field) return null;

    const headerIndex = headers.findIndex((th) => {
      // 🔧 オートフィルタによる"▼"サフィックスを正規化
      const headerText = th.textContent?.replace(/▼$/, '') || '';
      return headerText === field.label;
    });
    if (headerIndex === -1) return null;

    return row.children[headerIndex] || null;
  }

  /**
   * セルの値を交換
   * @param {HTMLElement} sourceRow - ソース行
   * @param {HTMLElement} targetRow - ターゲット行
   * @param {string} fieldCode - フィールドコード
   */
  static _exchangeCellValues(sourceRow, targetRow, fieldCode) {
    
    const sourceCell = this._findCellInRow(sourceRow, fieldCode);
    const targetCell = this._findCellInRow(targetRow, fieldCode);

    if (sourceCell && targetCell) {
      // レコードIDフィールドの特別処理
      if (fieldCode.endsWith("_record_id")) {
        this._exchangeRecordIdCells(sourceCell, targetCell, fieldCode);
        return;
      }

      const sourceSelect = sourceCell.querySelector("select");
      const targetSelect = targetCell.querySelector("select");

      if (sourceSelect && targetSelect) {
        // 両方がドロップダウンの場合
        const sourceValue = sourceSelect.value;
        const targetValue = targetSelect.value;
        sourceSelect.value = targetValue;
        targetSelect.value = sourceValue;
      } else if (sourceSelect && !targetSelect) {
        // sourceがドロップダウン、targetがテキストセル
        const sourceValue = sourceSelect.value;
        const targetValue = targetCell.textContent.trim();

        // targetセルにドロップダウンを作成
        this._recreateDropdownInCell(targetCell, fieldCode, sourceValue);

        // sourceセルをテキストセルに変更
        sourceCell.innerHTML = "";
        sourceCell.textContent = targetValue;
        sourceCell.style.padding = "4px";
      } else if (!sourceSelect && targetSelect) {
        // sourceがテキストセル、targetがドロップダウン
        const sourceValue = sourceCell.textContent.trim();
        const targetValue = targetSelect.value;

        // sourceセルにドロップダウンを作成
        this._recreateDropdownInCell(sourceCell, fieldCode, targetValue);

        // targetセルをテキストセルに変更
        targetCell.innerHTML = "";
        targetCell.textContent = sourceValue;
        targetCell.style.padding = "4px";
      } else {
        const sourceInput = sourceCell.querySelector("input");
        const targetInput = targetCell.querySelector("input");

        if (sourceInput && targetInput) {
          const sourceValue = sourceInput.value;
          const targetValue = targetInput.value;
          sourceInput.value = targetValue;
          targetInput.value = sourceValue;
        } else {
          // 分離ボタンがあるセル（div > span + button構造）の場合
          const sourceSpan = sourceCell.querySelector("div > span");
          const targetSpan = targetCell.querySelector("div > span");

          if (sourceSpan && targetSpan) {
            // span要素のtextContentのみを交換（ボタンの構造は保持）
            const sourceValue = sourceSpan.textContent;
            const targetValue = targetSpan.textContent;
            sourceSpan.textContent = targetValue;
            targetSpan.textContent = sourceValue;
          } else if (sourceSpan && !targetSpan) {
            // sourceが分離ボタンあり、targetが通常セル
            const sourceValue = sourceSpan.textContent;
            const targetValue = targetCell.textContent.trim();
            sourceSpan.textContent = targetValue;
            targetCell.textContent = sourceValue;
          } else if (!sourceSpan && targetSpan) {
            // sourceが通常セル、targetが分離ボタンあり
            const sourceValue = sourceCell.textContent.trim();
            const targetValue = targetSpan.textContent;
            sourceCell.textContent = targetValue;
            targetSpan.textContent = sourceValue;
          } else {
            // 両方とも通常セル
            const sourceValue = sourceCell.textContent.trim();
            const targetValue = targetCell.textContent.trim();
            sourceCell.textContent = targetValue;
            targetCell.textContent = sourceValue;
          }
        }
      }
    } else {
      console.log(`  ⚠️ セル交換スキップ: ${fieldCode} (セルが見つかりません)`);
    }
  }

  /**
   * セル内にドロップダウンを再作成
   * @param {HTMLElement} cell - セル要素
   * @param {string} fieldCode - フィールドコード
   * @param {string} value - 設定値
   */
  static _recreateDropdownInCell(cell, fieldCode, value) {
    const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
    if (!field) return;

    cell.innerHTML = "";
    const dropdown = this.createDropdown(field, value);
    dropdown.setAttribute("data-field", fieldCode);
    cell.appendChild(dropdown);
  }

  /**
   * レコードIDセルの交換
   * @param {HTMLElement} sourceCell - ソースセル
   * @param {HTMLElement} targetCell - ターゲットセル
   * @param {string} fieldCode - フィールドコード
   */
  static _exchangeRecordIdCells(sourceCell, targetCell, fieldCode) {
      
    const sourceLink = sourceCell.querySelector("a");
    const targetLink = targetCell.querySelector("a");

    if (sourceLink && targetLink) {
      // 両方がリンクの場合
      const sourceRecordId = sourceLink.textContent;
      const targetRecordId = targetLink.textContent;
      const sourceHref = sourceLink.href;
      const targetHref = targetLink.href;

      sourceLink.textContent = targetRecordId;
      sourceLink.href = targetHref;
      targetLink.textContent = sourceRecordId;
      targetLink.href = sourceHref;

    } else if (sourceLink && !targetLink) {
      // sourceがリンク、targetがテキスト
      const sourceRecordId = sourceLink.textContent;
      const sourceHref = sourceLink.href;
      const targetValue = targetCell.textContent.trim();

      // targetセルにリンクを作成
      if (sourceRecordId) {
        targetCell.innerHTML = "";
        // アプリIDを決定
        let appId = "";
        if (fieldCode === "seat_record_id") appId = APP_IDS.SEAT;
        else if (fieldCode === "pc_record_id") appId = APP_IDS.PC;
        else if (fieldCode === "ext_record_id") appId = APP_IDS.EXT;
        else if (fieldCode === "user_record_id") appId = APP_IDS.USER;
        
        if (appId) {
          this._createRecordIdLink(targetCell, sourceRecordId, fieldCode, appId);
        } else {
          targetCell.textContent = sourceRecordId;
          targetCell.style.padding = "4px";
        }
      }

      // sourceセルをテキストに変更
      sourceCell.innerHTML = "";
      sourceCell.textContent = targetValue;
      sourceCell.style.padding = "4px";
    } else if (!sourceLink && targetLink) {
      // sourceがテキスト、targetがリンク
      const targetRecordId = targetLink.textContent;
      const targetHref = targetLink.href;
      const sourceValue = sourceCell.textContent.trim();

      // sourceセルにリンクを作成
      if (targetRecordId) {
        sourceCell.innerHTML = "";
        // アプリIDを決定
        let appId = "";
        if (fieldCode === "seat_record_id") appId = APP_IDS.SEAT;
        else if (fieldCode === "pc_record_id") appId = APP_IDS.PC;
        else if (fieldCode === "ext_record_id") appId = APP_IDS.EXT;
        else if (fieldCode === "user_record_id") appId = APP_IDS.USER;
        
        if (appId) {
          this._createRecordIdLink(sourceCell, targetRecordId, fieldCode, appId);
        } else {
          sourceCell.textContent = targetRecordId;
          sourceCell.style.padding = "4px";
        }
      }

      // targetセルをテキストに変更
      targetCell.innerHTML = "";
      targetCell.textContent = sourceValue;
      targetCell.style.padding = "4px";
    } else {
      // 両方ともテキスト
      const sourceValue = sourceCell.textContent.trim();
      const targetValue = targetCell.textContent.trim();
      sourceCell.textContent = targetValue;
      targetCell.textContent = sourceValue;
    }
  }

  /**
   * 統合レコードを行から再構築
   * @param {HTMLElement} row - 対象行
   * @returns {Object|null} 統合レコードオブジェクト
   */
  static _reconstructIntegratedRecordFromRow(row) {
    try {
      // 🔧 統合レコードの基本構造を正しく初期化
      const integrationKey = row.getAttribute("data-integration-key");
      const record = { 
        ledgerData: {},
        isIntegratedRecord: true,
        integrationKey: integrationKey || "",
        recordIds: {}
      };
      
      const headerRow = document.getElementById("my-thead-row");
      if (!headerRow) return null;

      const headers = Array.from(headerRow.children);

      headers.forEach((th, index) => {
        const cell = row.children[index];
        if (!cell) return;

        const field = fieldsConfig.find((f) => f.label === th.textContent);
        if (!field || !field.sourceApp) return;

        // セル値を安全に取得
        const cellValue = this._extractCellValueSafely(cell, field);

        // レコード構造に値を設定
        if (cellValue && cellValue.trim()) {
          if (!record.ledgerData[field.sourceApp]) {
            record.ledgerData[field.sourceApp] = {};
          }
          record.ledgerData[field.sourceApp][field.fieldCode] = {
            value: cellValue.trim(),
          };
          
          // 🔧 レコードIDフィールドの場合、recordIdsにも追加
          if (field.isRecordId) {
            record.recordIds[field.sourceApp] = cellValue.trim();
          }
        }
      });
      
      // 🔧 recordIdsが空の場合、統合キーから再構築を試行
      if (Object.keys(record.recordIds).length === 0 && integrationKey) {
        this._extractRecordIdsFromIntegrationKey(record, integrationKey);
      }
      
      return record;
    } catch (error) {
      console.error("Error reconstructing record from row:", error);
      return null;
    }
  }

  /**
   * 統合キーからレコードIDを抽出
   * @param {Object} record - レコードオブジェクト
   * @param {string} integrationKey - 統合キー
   */
  static _extractRecordIdsFromIntegrationKey(record, integrationKey) {
    try {
      // 統合キーの形式: "SEAT:池袋19F-A1531|PC:PCAIT23N1531|EXT:701531|USER:BSS1531"
      const parts = integrationKey.split("|");
      
      parts.forEach(part => {
        const [appType, value] = part.split(":");
        if (appType && value) {
          record.recordIds[appType] = value;
        }
      });
    } catch (error) {
      console.warn("統合キーからレコードID抽出でエラー:", error);
    }
  }

  /**
   * セルから値を安全に抽出
   * @param {HTMLElement} cell - 対象セル
   * @param {Object} field - フィールド設定
   * @returns {string} セル値
   */
  static _extractCellValueSafely(cell, field = null) {
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

    // 分離ボタン付きの要素（div > span構造）
    const span = cell.querySelector("div > span");
    if (span) {
      return span.textContent.trim();
    }

    // 通常のテキスト
    return cell.textContent.trim();
  }

  /**
   * セルドラッグ&ドロップを設定
   */
  static _setupCellDragAndDrop(cell, field, value, record) {
    
    // 🔄 セル移動権限をチェック
    if (!this._isFieldAllowedToMove(field)) {
      return; // セル移動が許可されていない場合は早期リターン
    }
    
    // 🧹 既存のドラッグ&ドロップイベントハンドラーをクリーンアップ
    const shouldSkip = this._cleanupDragDropEvents(cell);
    if (shouldSkip) {
      return; // 重複設定を避けるため早期リターン
    }
    
    cell.draggable = true;
    cell.style.cursor = "grab"; 
    cell.style.position = "relative";

    // ドラッグ開始
    cell.addEventListener("dragstart", (e) => {
      e.stopPropagation();

      cell.style.cursor = "grabbing";
      cell.style.backgroundColor = "#e3f2fd";
      cell.style.border = "2px solid #1976d2";
      cell.style.zIndex = "1000";

      // 🔧 行番号ベース対応: recordKeyの代わりにrowIdを使用
      const sourceRow = cell.closest('tr');
      const sourceRowId = sourceRow.getAttribute('data-row-id');
      
      const dragData = {
        fieldCode: field.fieldCode,
        sourceApp: field.sourceApp,
        value: value,
        rowId: sourceRowId,  // 🆕 行番号ベース
        isIntegratedRecord: record.isIntegratedRecord || false,
      };

      e.dataTransfer.setData("application/json", JSON.stringify(dragData));
      e.dataTransfer.setData("text/plain", field.fieldCode);
      e.dataTransfer.effectAllowed = "move";

      window._draggedFieldCode = field.fieldCode;
      window._currentDraggedElement = cell;

    });

    // ドラッグ終了
    cell.addEventListener("dragend", (e) => {
      e.stopPropagation();

      cell.style.cursor = "grab";
      cell.style.backgroundColor = "";
      cell.style.border = "";
      cell.style.zIndex = "";

      window._draggedFieldCode = null;
      window._currentDraggedElement = null;

    });

    // ドロップ受け入れ
    cell.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (window._currentDraggedElement !== cell) {
        cell.style.backgroundColor = "#f3e5f5";
        cell.style.border = "2px dashed #9c27b0";
      }
    });

    // ドロップ離脱
    cell.addEventListener("dragleave", (e) => {
      e.preventDefault();
      if (window._currentDraggedElement !== cell) {
        cell.style.backgroundColor = "";
        cell.style.border = "";
      }
    });

    // ドロップ実行
    cell.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      cell.style.backgroundColor = "";
      cell.style.border = "";

      if (window._currentDraggedElement === cell) {
        return;
      }

      try {
        const dragDataStr = e.dataTransfer.getData("application/json");
        if (!dragDataStr) {
          return;
        }

        const sourceData = JSON.parse(dragDataStr);
        
        // ドロップ先の行を正確に特定
        const targetRow = cell.closest("tr");
        
        // 🔧 行番号ベース対応: recordKeyの代わりにrowIdを使用
        const targetRowId = targetRow.getAttribute('data-row-id');
        
        const targetData = {
          fieldCode: field.fieldCode,
          sourceApp: field.sourceApp,
          value: value,
          rowId: targetRowId,  // 🆕 行番号ベース
          isIntegratedRecord: record.isIntegratedRecord || false,
          targetElement: cell,  // ドロップ先のセル要素
          targetRow: targetRow   // ドロップ先の行要素
        };

        // 交換処理は既存のCellExchangeManagerに委譲
        try {
          if (typeof window.CellExchangeManager !== 'undefined') {
            window.CellExchangeManager.execute(sourceData, targetData);
          } else {
            console.error("❌ CellExchangeManagerが見つかりません");
            // 代替処理として基本的な値交換を実行
            
            // ソース側のセルを取得
            const sourceCell = window._currentDraggedElement;
            const targetCell = cell;
            
            if (sourceCell && targetCell) {
              // 値を交換
              const sourceValueSpan = sourceCell.querySelector('span');
              const targetValueSpan = targetCell.querySelector('span');
              
              if (sourceValueSpan && targetValueSpan) {
                const tempValue = sourceValueSpan.textContent;
                sourceValueSpan.textContent = targetValueSpan.textContent;
                targetValueSpan.textContent = tempValue;
              } else {
                console.log("⚠️ 値交換用のspan要素が見つかりません");
              }
            }
          }
        } catch (exchangeError) {
          console.error("❌ セル交換処理でエラー:", exchangeError);
        }
      } catch (error) {
        console.error("❌ ドロップ処理でエラー:", error);
      }
    });
    
    // 🏷️ イベントハンドラー設定完了のフラグを設定
    cell.setAttribute('data-drag-drop-initialized', 'true');
  }

  /**
   * 📋 フィルハンドル機能をセルに追加（必要に応じて）
   * @param {HTMLElement} cell - セル要素
   * @param {Object} field - フィールド設定
   * @param {string} value - セルの値
   * @param {Object} record - レコード情報
   */
  static _addFillHandleIfNeeded(cell, field, value, record) {
    // フィルハンドルマネージャーが利用可能かチェック
    if (!window.fillHandleManager || typeof window.fillHandleManager.addFillHandleToCell !== 'function') {
      return;
    }

    // allowFillHandleフラグがtrueのフィールドのみ対象
    if (!field.allowFillHandle) {
      return;
    }

    try {
      // フィルハンドルを追加
      window.fillHandleManager.addFillHandleToCell(cell, field, value, record);
      // console.log(`📋 フィルハンドル追加完了: ${field.fieldCode}`);
    } catch (error) {
      console.warn(`⚠️ フィルハンドル追加中にエラー [${field.fieldCode}]:`, error);
    }
  }

  /**
   * 🔄 フィールドがセル移動可能かどうかを判定
   * @param {Object} field - フィールド設定
   * @returns {boolean} セル移動可能かどうか
   */
  static _isFieldAllowedToMove(field) {
    console.log(`🔍 セル移動権限チェック: ${field.fieldCode}`, {
      allowCellMove: field.allowCellMove,
      isPrimaryKey: field.isPrimaryKey,
      allowCellDragDrop: field.allowCellDragDrop,
      allowDragDrop: field.allowDragDrop,
      CELL_MOVE_MODES: window.CELL_MOVE_MODES
    });

    // 🔧 分離対象フィールドは常にセル移動可能とする
    const separationTargetFields = ['座席番号', 'PC番号', '内線番号', 'ユーザーID'];
    if (separationTargetFields.includes(field.fieldCode)) {
      console.log(`✅ 分離対象フィールドは移動可能: ${field.fieldCode}`);
      return true;
    }

    // CELL_MOVE_MODESが定義されているかチェック
    if (!window.CELL_MOVE_MODES) {
      console.warn('⚠️ CELL_MOVE_MODESが定義されていません');
      // フォールバック: 既存のallowCellDragDropを使用
      const result = field.allowCellDragDrop === true;
      console.log(`🔧 フォールバック判定 (allowCellDragDrop): ${result}`);
      return result;
    }

    // allowCellMoveが明示的に設定されている場合
    if (field.allowCellMove !== undefined) {
      const result = field.allowCellMove === window.CELL_MOVE_MODES.PRIMARY_KEY_ONLY;
      console.log(`🔧 allowCellMove判定: ${result}`);
      return result;
    }

    // フォールバック: isPrimaryKeyとallowCellDragDropの組み合わせで判定
    const result = field.isPrimaryKey === true && field.allowCellDragDrop === true;
    console.log(`🔧 フォールバック判定 (isPrimaryKey && allowCellDragDrop): ${result}`);
    return result;
  }

  /**
   * 🧹 セルのドラッグ&ドロップイベントハンドラーをクリーンアップ
   * @param {HTMLElement} cell - 対象セル
   */
  static _cleanupDragDropEvents(cell) {
    const fieldCode = cell.getAttribute('data-field-code');
    const isInitialized = cell.hasAttribute('data-drag-drop-initialized');
    
    // 🚨 重複設定チェック：既にイベントハンドラーが設定済みかチェック
    if (isInitialized) {
      return true; // スキップしたことを示す
    }
    
    return false; // 新規設定することを示す
  }

  /**
   * 統合キーを交換後に更新
   * @param {HTMLElement} sourceRow - 交換元行
   * @param {HTMLElement} targetRow - 交換先行
   * @param {Object} sourceData - 交換元データ
   * @param {Object} targetData - 交換先データ
   */
  static _updateIntegrationKeysAfterExchange(
    sourceRow,
    targetRow,
    sourceData,
    targetData
  ) {
    setTimeout(() => {
      // 🔧 交換前に移動元のレコードIDを記録
      const sourcePreExchangeRecordIds = this._getCurrentRecordIds(sourceRow);
      const targetPreExchangeRecordIds = this._getCurrentRecordIds(targetRow);
      
      // 🔧 統合キー再生成前に不要なレコードIDを削除
      this._cleanupInvalidRecordIds(sourceRow, targetRow, sourceData, targetData);
      
      // 現在の統合キーを保存
      const oldSourceKey = sourceRow.getAttribute("data-integration-key");
      const oldTargetKey = targetRow.getAttribute("data-integration-key");

      // 統合キー処理は廃止により削除
      
      // 🆕 行番号ベースの状態転送（セル交換で実際に交換されたフィールドの状態継承）
      if (window.cellStateManager && sourceData && sourceData.sourceApp) {
        const sourceRowId = this._ensureRowId(sourceRow);
        const targetRowId = this._ensureRowId(targetRow);
        
        if (sourceRowId && targetRowId) {
          // 交換されたフィールドを特定
          const exchangedFields = this._getRelatedFields(sourceData.sourceApp);
          const recordIdField = `${sourceData.sourceApp.toLowerCase()}_record_id`;
          const allExchangedFields = [...exchangedFields, recordIdField];
          
          // console.log('🔄 table-components.js: 行番号ベース状態転送開始:', {
          //   sourceRowId,
          //   targetRowId,
          //   exchangedFields: allExchangedFields
          // });
          
          // 行番号ベースの状態転送を実行
          window.cellStateManager.transferRowStatesByExchange(sourceRowId, targetRowId, allExchangedFields);
        }
      }
    }, 100);
  }

  /**
   * 🔧 統合キー再生成前に不要なレコードIDフィールドを削除
   * @param {HTMLElement} sourceRow - 交換元行
   * @param {HTMLElement} targetRow - 交換先行
   * @param {Object} sourceData - 交換元データ
   * @param {Object} targetData - 交換先データ
   */
  static _cleanupInvalidRecordIds(sourceRow, targetRow, sourceData, targetData) {
    
    [
      { row: sourceRow, data: sourceData, label: 'source' },
      { row: targetRow, data: targetData, label: 'target' }
    ].forEach(({ row, data, label }) => {
      const existingApps = this._getExistingAppsFromRow(row);
      const recordIdFields = ['seat_record_id', 'pc_record_id', 'ext_record_id', 'user_record_id'];
      
      recordIdFields.forEach(recordIdField => {
        const appType = recordIdField.replace('_record_id', '').toUpperCase();
        
        // そのアプリの主キーフィールドが行に存在しない場合、レコードIDフィールドを削除
        if (!existingApps.has(appType)) {
          const cell = this._findCellInRow(row, recordIdField);
          if (cell) {
            // セルの内容を確認して値がある場合はクリア
            const cellValue = this._extractCellValueSafely(cell);
            if (cellValue && cellValue.trim()) {
              // セルの内容をクリア
              cell.innerHTML = '';
              cell.textContent = '';
              cell.style.padding = '4px';
            }
          }
        }
      });
    });
  }

  /**
   * 🔧 行から存在するアプリタイプを取得
   * @param {HTMLElement} row - 対象行
   * @returns {Set<string>} 存在するアプリタイプのセット
   */
  static _getExistingAppsFromRow(row) {
    const existingApps = new Set();
    const headerRow = document.getElementById("my-thead-row");
    if (!headerRow) return existingApps;
    
    const headers = Array.from(headerRow.children);
    
    headers.forEach((th, index) => {
      const fieldLabel = th.textContent.trim();
      const cell = row.children[index];
      if (!cell) return;
      
      // 主キーフィールドかチェック
      const primaryKeyCode = IntegrationKeyHelper.PRIMARY_KEY_FIELDS[fieldLabel];
      if (!primaryKeyCode) return;
      
      // セルに実際に値があるかチェック
      const cellValue = this._extractCellValueSafely(cell);
      if (cellValue && cellValue.trim()) {
        // 主キーフィールドから対応するアプリタイプを特定
        if (primaryKeyCode === 'SEAT') existingApps.add('SEAT');
        else if (primaryKeyCode === 'PC') existingApps.add('PC');
        else if (primaryKeyCode === 'EXT') existingApps.add('EXT');
        else if (primaryKeyCode === 'USER') existingApps.add('USER');
      }
    });
    
    return existingApps;
  }

  /**
   * 🔧 行から現在のレコードIDを取得
   * @param {HTMLElement} row - 対象行
   * @returns {Object} レコードID情報
   */
  static _getCurrentRecordIds(row) {
    const recordIds = {};
    const recordIdFields = ['seat_record_id', 'pc_record_id', 'ext_record_id', 'user_record_id'];
    
    recordIdFields.forEach(fieldCode => {
      const cell = this._findCellInRow(row, fieldCode);
      if (cell) {
        const value = this._extractCellValueSafely(cell);
        if (value && value.trim()) {
          const appType = fieldCode.replace('_record_id', '').toUpperCase();
          recordIds[appType] = value.trim();
        }
      }
    });
    
    return recordIds;
  }

  /**
   * 🔧 移動してきたデータのレコードIDを特定
   * @param {Object} sourceData - 移動元データ
   * @param {Object} targetData - 移動先データ
   * @param {Object} sourcePreRecordIds - 移動前の移動元レコードID
   * @param {Object} targetPreRecordIds - 移動前の移動先レコードID
   * @returns {Object} 移動してきたレコードID
   */
  static _getMovedRecordIds(sourceData, targetData, sourcePreRecordIds, targetPreRecordIds) {
    const movedRecordIds = {};
    
    // 移動元のアプリタイプに基づいて、対応するレコードIDを移動先に提供
    if (sourceData && sourceData.sourceApp && sourcePreRecordIds[sourceData.sourceApp]) {
      movedRecordIds[sourceData.sourceApp] = sourcePreRecordIds[sourceData.sourceApp];
    }
    
    return movedRecordIds;
  }

  /**
   * 🔧 行の現在状態に基づいて実際に存在するレコードIDを抽出
   * @param {HTMLElement} row - 対象行
   * @param {Object} allRecordIds - 全レコードID情報
   * @returns {Object} 実際に存在するレコードIDのみ
   */
  static _extractActualRecordIds(row, allRecordIds) {
    const actualRecordIds = {};
    
    if (!row || !allRecordIds) return actualRecordIds;
    
    // 🔧 実際の行のセル値を確認して、主キーフィールドが存在するアプリのレコードIDのみを保持
    const headerRow = document.getElementById("my-thead-row");
    if (!headerRow) return actualRecordIds;
    
    const headers = Array.from(headerRow.children);
    const existingApps = new Set();
    
    headers.forEach((th, index) => {
      const fieldLabel = th.textContent.trim();
      const cell = row.children[index];
      if (!cell) return;
      
      // 主キーフィールドかチェック
      const primaryKeyCode = IntegrationKeyHelper.PRIMARY_KEY_FIELDS[fieldLabel];
      if (!primaryKeyCode) return;
      
      // セルに実際に値があるかチェック
      const cellValue = this._extractCellValueSafely(cell);
      if (cellValue && cellValue.trim()) {
        // 主キーフィールドから対応するアプリタイプを特定
        if (primaryKeyCode === 'SEAT') existingApps.add('SEAT');
        else if (primaryKeyCode === 'PC') existingApps.add('PC');
        else if (primaryKeyCode === 'EXT') existingApps.add('EXT');
        else if (primaryKeyCode === 'USER') existingApps.add('USER');
      }
    });
    
    // 実際に主キーフィールドが存在するアプリのレコードIDのみを抽出
    Object.keys(allRecordIds).forEach(appType => {
      if (existingApps.has(appType)) {
        actualRecordIds[appType] = allRecordIds[appType];
      }
    });
    
    const integrationKey = row.getAttribute("data-integration-key");
    
    return actualRecordIds;
  }

  /**
   * 🔧 移動先行にレコードIDフィールドを復元
   * @param {HTMLElement} targetRow - 移動先行
   * @param {Object} recordIds - レコードID情報
   */
  static _restoreRecordIdsToRow(targetRow, recordIds) {
    if (!recordIds || Object.keys(recordIds).length === 0) return;
    
    Object.entries(recordIds).forEach(([appType, recordId]) => {
      const recordIdField = `${appType.toLowerCase()}_record_id`;
      const cell = this._findCellInRow(targetRow, recordIdField);
      
      if (cell && recordId) {
        // 現在セルが空の場合のみ復元
        const currentValue = this._extractCellValueSafely(cell);
        if (!currentValue || !currentValue.trim()) {
          // アプリIDを決定
          let appId = "";
          if (appType === 'SEAT') appId = APP_IDS.SEAT;
          else if (appType === 'PC') appId = APP_IDS.PC;
          else if (appType === 'EXT') appId = APP_IDS.EXT;
          else if (appType === 'USER') appId = APP_IDS.USER;
          
          if (appId) {
            cell.innerHTML = '';
            this._createRecordIdLink(cell, recordId, recordIdField, appId);
          }
        }
      }
    });
  }

  /**
   * 交換後に空になった行を削除
   * @param {Array<HTMLElement>} rows - チェック対象の行配列
   */
  static _removeEmptyRowsAfterExchange(rows) {
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

  /**
   * 行内の全フィールドコードを取得
   * @param {HTMLElement} row - 対象行
   * @returns {Array<string>} フィールドコード配列
   */
  static _getAllFieldCodesInRow(row) {
    const headerRow = document.getElementById("my-thead-row");
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
        const value = this._extractCellValueSafely(cell, field);
        if (value && value.trim()) {
          fieldCodes.push(field.fieldCode);
        }
      }
    });

    return fieldCodes;
  }

  /**
   * 🆕 行番号を確実に取得または設定
   */
  static _ensureRowId(row) {
    if (!row) return null;
    
    let rowId = row.getAttribute('data-row-id');
    if (!rowId) {
      // 行番号が設定されていない場合は、テーブル内の位置から取得
      const tbody = row.parentElement;
      if (tbody) {
        const rows = Array.from(tbody.children);
        const rowIndex = rows.indexOf(row);
        if (rowIndex >= 0) {
          rowId = String(rowIndex + 1);
          row.setAttribute('data-row-id', rowId);
          //console.log(`🔧 table-components.js: 行番号を自動設定: ${rowId}`);
        }
      }
    }
    
    return rowId;
  }
}

// =============================================================================
// 📋 テーブルヘッダー管理
// =============================================================================

/**
 * 📋 テーブルヘッダー管理クラス
 * @description テーブルのヘッダー（カテゴリー行、フィールド行、フィルター行）を管理
 */
class TableHeaderManager {
  constructor() {
    this.table = document.getElementById("my-table");
  }

  /**
   * ヘッダーを更新
   */
  update() {
    if (!this.table) return;

    this._setupTableStyles();
    this._ensureColumnResizeStyles(); // 🎯 列リサイズ用CSSを追加
    const fieldsByCategory = this._groupFieldsByCategory();
    const categoryOrder = this._determineCategoryOrder(fieldsByCategory);

    this._generateHeader(categoryOrder, fieldsByCategory);
  }

  /**
   * テーブルスタイルを設定
   */
  _setupTableStyles() {
    StyleManager.applyStyles(this.table, {
      width: "auto",
      minWidth: "max-content",
      tableLayout: "fixed",
      borderCollapse: "collapse",
    });

    const tableContainer = this.table.parentElement;
    if (tableContainer) {
      StyleManager.applyStyles(tableContainer, {
        width: "100%",
        overflowX: "auto",
        display: "block",
      });
    }
  }

  /**
   * 列リサイズ用のCSSスタイルを確保
   */
  _ensureColumnResizeStyles() {
    const existingStyle = document.getElementById('column-resize-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'column-resize-styles';
    style.textContent = `
      /* 列リサイズハンドル */
      .column-resize-handle {
        position: absolute;
        top: 0;
        right: 0;
        width: 5px;
        height: 100%;
        cursor: col-resize;
        user-select: none;
        z-index: 10;
        background-color: transparent;
        transition: background-color 0.2s ease;
      }
      
      .column-resize-handle:hover {
        background-color: rgba(33, 150, 243, 0.3) !important;
      }
      
      .column-resize-handle:active {
        background-color: rgba(33, 150, 243, 0.6) !important;
      }
      
      /* リサイズ中のテーブル */
      .table-resizing {
        user-select: none;
        cursor: col-resize;
      }
      
      .table-resizing * {
        user-select: none;
        pointer-events: none;
      }
      
      .table-resizing .column-resize-handle {
        pointer-events: auto;
      }
      
      /* ヘッダーセルの基本スタイル */
      #my-thead-row th {
        position: relative;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      
      /* フィルター行も同様に */
      #my-filter-row td {
        position: relative;
        overflow: hidden;
      }
      
      /* データ行のセル */
      #my-tbody td {
        overflow: hidden;
        word-wrap: break-word;
      }
      
      /* リサイズ中の視覚的フィードバック */
      .column-resizing {
        border-right: 2px solid #2196f3 !important;
        background-color: rgba(33, 150, 243, 0.1) !important;
      }
      
      /* ツールチップ風の表示 */
      .column-resize-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        white-space: nowrap;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * フィールドをカテゴリー別にグループ化
   */
  _groupFieldsByCategory() {
    const fieldsByCategory = {};
    const categoryMapping = {
      共通: "共通項目",
      座席台帳: "座席情報",
      PC台帳: "PC情報",
      内線台帳: "内線情報",
      ユーザー台帳: "ユーザー情報",
    };

    fieldsConfig.forEach((field) => {
      // 🔧 テーブル表示対象外フィールドをスキップ
      if (field.isVisibleInTable === false) {
        return;
      }

      const mappedCategory =
        categoryMapping[field.category] || field.category;
      if (!fieldsByCategory[mappedCategory]) {
        fieldsByCategory[mappedCategory] = [];
      }
      fieldsByCategory[mappedCategory].push(field);
    });

    return fieldsByCategory;
  }

  /**
   * カテゴリー順序を決定
   */
  _determineCategoryOrder(fieldsByCategory) {
    // 統合表示では全カテゴリーを固定順序で表示
    const fixedOrder = [
      "共通項目",
      "座席情報",
      "PC情報",
      "内線情報",
      "ユーザー情報",
    ];

    return fixedOrder.filter(
      (category) =>
        fieldsByCategory[category] && fieldsByCategory[category].length > 0
    );
  }

  /**
   * ヘッダーを生成
   */
  _generateHeader(categoryOrder, fieldsByCategory) {
    const thead = this.table.tHead || this.table.createTHead();
    thead.innerHTML = "";

    const categoryRow = this._createCategoryRow();
    const headerRow = this._createHeaderRow();
    const filterRow = this._createFilterRow();

    thead.appendChild(categoryRow);
    thead.appendChild(headerRow);
    thead.appendChild(filterRow);

    categoryOrder.forEach((category) => {
      const fields = fieldsByCategory[category];
      if (!fields || fields.length === 0) return;

      this._addCategoryCell(categoryRow, category, fields);
      this._addFieldCells(headerRow, filterRow, fields);
    });
    
    // 🎯 列リサイズ機能を有効化
    this._enableColumnResize(headerRow);
  }

  /**
   * 列リサイズ機能を有効化
   */
  _enableColumnResize(headerRow) {
    const headers = Array.from(headerRow.children);
    
    headers.forEach((header, index) => {
      this._addResizeHandleToHeader(header, index);
    });
  }

  /**
   * ヘッダーセルにリサイズハンドルを追加
   */
  _addResizeHandleToHeader(header, columnIndex) {
    // ヘッダーセルを相対位置にする
    header.style.position = 'relative';
    header.style.cursor = 'default';
    
    // リサイズハンドル領域を作成
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'column-resize-handle';
    
    // リサイズハンドルのスタイル
    StyleManager.applyStyles(resizeHandle, {
      position: 'absolute',
      top: '0',
      right: '0',
      width: '5px',
      height: '100%',
      cursor: 'col-resize',
      userSelect: 'none',
      zIndex: '10',
      backgroundColor: 'transparent'
    });
    
    // ホバー効果
    resizeHandle.addEventListener('mouseenter', () => {
      resizeHandle.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
    });
    
    resizeHandle.addEventListener('mouseleave', () => {
      resizeHandle.style.backgroundColor = 'transparent';
    });
    
    // リサイズ機能を追加
    this._addResizeEventListeners(resizeHandle, header, columnIndex);
    
    header.appendChild(resizeHandle);
  }

  /**
   * リサイズイベントリスナーを追加
   */
  _addResizeEventListeners(resizeHandle, header, columnIndex) {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let tooltip = null;
    
    const startResize = (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = parseInt(window.getComputedStyle(header).width, 10);
      
      // ドキュメント全体でマウス移動を監視
      document.addEventListener('mousemove', doResize);
      document.addEventListener('mouseup', stopResize);
      
      // テーブル全体にリサイズクラスを追加
      this.table.classList.add('table-resizing');
      
      // リサイズ中の視覚的フィードバック
      header.classList.add('column-resizing');
      
      // ツールチップを作成
      tooltip = this._createResizeTooltip(e.clientX, e.clientY, startWidth);
      e.preventDefault();
      e.stopPropagation();
    };
    
    const doResize = (e) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(20, startWidth + deltaX); // 最小幅20px
      
      // リアルタイムで幅を更新
      this._updateColumnWidth(columnIndex, newWidth);
      
      // ツールチップの位置と内容を更新
      if (tooltip) {
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY - 30}px`;
        tooltip.textContent = `幅: ${newWidth}px`;
      }
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    const stopResize = (e) => {
      if (!isResizing) return;
      
      isResizing = false;
      
      // イベントリスナーを削除
      document.removeEventListener('mousemove', doResize);
      document.removeEventListener('mouseup', stopResize);
      
      // テーブルからリサイズクラスを削除
      this.table.classList.remove('table-resizing');
      
      // 視覚的フィードバックを削除
      header.classList.remove('column-resizing');
      
      // ツールチップを削除
      if (tooltip && tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
        tooltip = null;
      }
      
      const finalWidth = parseInt(window.getComputedStyle(header).width, 10);
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    resizeHandle.addEventListener('mousedown', startResize);
  }

  /**
   * リサイズツールチップを作成
   */
  _createResizeTooltip(x, y, width) {
    const tooltip = document.createElement('div');
    tooltip.className = 'column-resize-tooltip';
    tooltip.textContent = `幅: ${width}px`;
    
    // 位置を設定
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${x + 10}px`;
    tooltip.style.top = `${y - 30}px`;
    
    document.body.appendChild(tooltip);
    return tooltip;
  }

  /**
   * 列幅を更新
   */
  _updateColumnWidth(columnIndex, newWidth) {
    try {
      // ヘッダー行の該当列を更新
      const headerRow = document.getElementById('my-thead-row');
      if (headerRow && headerRow.children[columnIndex]) {
        headerRow.children[columnIndex].style.width = `${newWidth}px`;
        headerRow.children[columnIndex].style.minWidth = `${newWidth}px`;
        headerRow.children[columnIndex].style.maxWidth = `${newWidth}px`;
      }
      
      // フィルター行の該当列を更新
      const filterRow = document.getElementById('my-filter-row');
      if (filterRow && filterRow.children[columnIndex]) {
        filterRow.children[columnIndex].style.width = `${newWidth}px`;
        filterRow.children[columnIndex].style.minWidth = `${newWidth}px`;
        filterRow.children[columnIndex].style.maxWidth = `${newWidth}px`;
      }
      
      // データ行の該当列も更新
      const tbody = document.getElementById('my-tbody');
      if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
          if (row.children[columnIndex]) {
            row.children[columnIndex].style.width = `${newWidth}px`;
            row.children[columnIndex].style.minWidth = `${newWidth}px`;
            row.children[columnIndex].style.maxWidth = `${newWidth}px`;
          }
        });
      }
      
      // カテゴリー行の調整（複数列をスパンしている場合）
      this._adjustCategoryRowWidths();
      
    } catch (error) {
      console.error('🎯 列幅更新エラー:', error);
    }
  }

  /**
   * カテゴリー行の幅を調整
   */
  _adjustCategoryRowWidths() {
    try {
      const categoryRow = document.getElementById('my-category-row');
      const headerRow = document.getElementById('my-thead-row');
      
      if (!categoryRow || !headerRow) return;
      
      // カテゴリーセルごとに対応する列幅の合計を計算
      let headerIndex = 0;
      
      Array.from(categoryRow.children).forEach(categoryCell => {
        const colSpan = parseInt(categoryCell.getAttribute('colspan') || '1');
        let totalWidth = 0;
        
        // 対応する列の幅を合計
        for (let i = 0; i < colSpan; i++) {
          if (headerRow.children[headerIndex + i]) {
            const width = parseInt(window.getComputedStyle(headerRow.children[headerIndex + i]).width, 10);
            totalWidth += width;
          }
        }
        
        // カテゴリーセルの幅を設定
        if (totalWidth > 0) {
          categoryCell.style.width = `${totalWidth}px`;
          categoryCell.style.minWidth = `${totalWidth}px`;
          categoryCell.style.maxWidth = `${totalWidth}px`;
        }
        
        headerIndex += colSpan;
      });
      
    } catch (error) {
      console.error('🎯 カテゴリー行幅調整エラー:', error);
    }
  }

  /**
   * 各種行を作成
   */
  _createCategoryRow() {
    const row = document.createElement("tr");
    row.id = "my-category-row";
    row.style.backgroundColor = "#f0f0f0";
    return row;
  }

  _createHeaderRow() {
    const row = document.createElement("tr");
    row.id = "my-thead-row";
    return row;
  }

  _createFilterRow() {
    const row = document.createElement("tr");
    row.id = "my-filter-row";
    return row;
  }

  /**
   * カテゴリーセルを追加
   */
  _addCategoryCell(row, category, fields) {
    const th = document.createElement("th");
    th.colSpan = fields.length;
    th.textContent = category;
    StyleManager.applyStyles(th, {
      textAlign: "center",
      backgroundColor: "#f0f0f0",
      border: "1px solid #ccc",
      padding: "1px",
      margin: "1px",
      fontWeight: "bold",
      fontSize: FONT_SIZES.NORMAL,
      boxSizing: "border-box",
    });
    row.appendChild(th);
  }

  /**
   * フィールドセルを追加
   */
  _addFieldCells(headerRow, filterRow, fields) {
    fields.forEach((field) => {
      // ヘッダーセル
      const headerCell = this._createHeaderCell(field);
      headerRow.appendChild(headerCell);

      // フィルターセル
      const filterCell = this._createFilterCell(field);
      filterRow.appendChild(filterCell);
    });
  }

  /**
   * ヘッダーセルを作成
   */
  _createHeaderCell(field) {
    const th = document.createElement("th");
    th.textContent = field.label;
    StyleManager.applyStyles(th, StyleManager.getCellStyles(field.width));
    th.style.backgroundColor = "#f0f0f0";
    th.style.fontWeight = "bold";
    return th;
  }

  /**
   * フィルターセルを作成
   */
  _createFilterCell(field) {
    const td = document.createElement("td");
    StyleManager.applyStyles(td, StyleManager.getCellStyles(field.width));

    // 行番号フィールド、変更チェックボックス、非表示ボタンフィールドの場合は空のセルを作成
    if (field.isHideButton || field.isRowNumber || field.isModificationCheckbox) {
      return td;
    }

    let filterElement;
    if (field.filterType === FILTER_TYPES.DROPDOWN) {
      filterElement = TableElementFactory.createDropdown(field, "");
    } else {
      filterElement = TableElementFactory.createInput(field, "");
    }
    filterElement.setAttribute("data-field", field.fieldCode);

    td.appendChild(filterElement);
    return td;
  }
}

// =============================================================================
// 🌐 グローバルスコープ設定（即座に実行）
// =============================================================================

// クラスをグローバルスコープに設定
window.SeparatedRowBuilder = SeparatedRowBuilder;
window.TableElementFactory = TableElementFactory;
window.TableHeaderManager = TableHeaderManager;

// TableElementFactoryをグローバルに公開（ハイブリッドアプローチ）
window.TableComponentsFactory = TableElementFactory;

// デバッグ用：グローバル変数設定確認
// console.log('✅ TableElementFactory をグローバルに設定完了');
// console.log('✅ TableComponentsFactory をグローバルに設定完了');
// console.log('✅ SeparatedRowBuilder をグローバルに設定完了');
// console.log('✅ TableHeaderManager をグローバルに設定完了');