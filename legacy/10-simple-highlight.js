// =============================================================================
// 🎯 シンプルハイライト管理システム
// =============================================================================
// 複雑な既存ハイライトシステムを置き換える軽量版
// 作成日: 2025年2月3日
// CSS化による安定化とパフォーマンス向上
// =============================================================================

(function () {
  "use strict";

  /**
   * 🎯 シンプルハイライト管理クラス
   * @description CSSクラスベースのシンプルなハイライトシステム
   */
  class SimpleHighlightManager {
    /**
     * 行レベルの変更をマーク
     * @param {HTMLElement} row - 行要素
     */
    static markRowAsModified(row) {
      if (!row) return;
      row.classList.add("row-modified");
      
      // 🎨 ハイライト設定時に自動でCSS化
      if (window.StyleManager && typeof window.StyleManager.forceConvertAllInlineStyles === 'function') {
        window.StyleManager.forceConvertAllInlineStyles(row);
      }

      // ✅ チェックボックス状態更新
      this._updateModificationCheckbox(row);
    }

    /**
     * セルレベルの変更をマーク
     * @param {HTMLElement} cell - セル要素
     */
    static markCellAsModified(cell) {
      if (!cell) return;

      // 適用前の状態を記録
      const beforeClasses = cell.className;
      const beforeStyle = cell.getAttribute("style") || "";

      cell.classList.add("cell-modified");
      
      // 🎨 ハイライト設定時に自動でCSS化（高さの問題を避けるため一時的に無効化）
      // if (window.StyleManager && typeof window.StyleManager.convertInlineStylesToClasses === 'function') {
      //   window.StyleManager.convertInlineStylesToClasses(cell);
      // }
      
      // 🎯 CSS化処理後のドラッグ&ドロップハンドラー再設定
      this._refreshCellDragDropAfterHighlight(cell);

      // ✅ チェックボックス状態更新
      const row = cell.closest('tr');
      this._updateModificationCheckbox(row);

      // 適用後の状態を記録
      const afterClasses = cell.className;
      const afterStyle = cell.getAttribute("style") || "";
      const computedStyle = window.getComputedStyle(cell);
      const backgroundColor = computedStyle.backgroundColor;

      // セル要素の詳細情報をログに出力
      const cellInfo = {
        tagName: cell.tagName,
        dataFieldCode: cell.getAttribute("data-field-code"),
        beforeClasses: beforeClasses,
        afterClasses: afterClasses,
        beforeStyle: beforeStyle,
        afterStyle: afterStyle,
        computedBackgroundColor: backgroundColor,
        cellIndex: cell.cellIndex,
        parentRowIndex: cell.parentElement
          ? cell.parentElement.rowIndex
          : "none",
        innerHTML: cell.innerHTML.substring(0, 30) + "...",
      };
    }

    /**
     * 行レベルの変更マークを削除
     * @param {HTMLElement} row - 行要素
     */
    static unmarkRowAsModified(row) {
      if (!row) return;
      
      const rowId = row.getAttribute('data-row-id');
      //console.log(`🎨 行ハイライト削除: 行番号=${rowId}`);
      
      row.classList.remove("row-modified");
      
      // 🎯 チェックボックスは手動操作のみで制御（自動更新は無効化済み）
      this._updateModificationCheckbox(row);
      
      //console.log(`🔍 チェックボックス更新完了: 行番号=${rowId}`);
    }

    /**
     * セルレベルの変更マークを削除
     * @param {HTMLElement} cell - セル要素
     */
    static unmarkCellAsModified(cell) {
      if (!cell) return;

      // セル要素の詳細情報をログに出力
      const cellInfo = {
        tagName: cell.tagName,
        className: cell.className,
        id: cell.id,
        dataFieldCode: cell.getAttribute("data-field-code"),
        dataField: cell.getAttribute("data-field"),
        innerHTML: cell.innerHTML.substring(0, 50) + "...",
        textContent: cell.textContent.substring(0, 50),
        cellIndex: cell.cellIndex,
        parentRowIndex: cell.parentElement
          ? cell.parentElement.rowIndex
          : "none",
      };

      cell.classList.remove("cell-modified");
      
      // 🎯 チェックボックスは手動操作のみで制御（自動更新は無効化済み）
      const row = cell.closest('tr');
      this._updateModificationCheckbox(row);
    }

    /**
     * 縞模様パターンを更新
     * @param {HTMLElement} tbody - テーブルボディ要素
     */
    static updateStripePattern(tbody) {
      if (!tbody) return;

      const rows = Array.from(tbody.children).filter(
        (row) => row.tagName === "TR" && row.style.display !== "none"
      );

      rows.forEach((row, index) => {
        // 既存の縞模様クラスを削除
        row.classList.remove("row-even", "row-odd");

        // 分離行や変更行でない場合のみ縞模様を適用
        if (
          !row.classList.contains("row-separated") &&
          !row.classList.contains("row-modified")
        ) {
          if (index % 2 === 0) {
            row.classList.add("row-even");
          } else {
            row.classList.add("row-odd");
          }
        }
      });
    }

    /**
     * 分離行としてマーク
     * @param {HTMLElement} row - 行要素
     */
    static markRowAsSeparated(row) {
      if (!row) return;
      row.classList.add("row-separated");
    }

    /**
     * 分離行マークを削除
     * @param {HTMLElement} row - 行要素
     */
    static unmarkRowAsSeparated(row) {
      if (!row) return;
      row.classList.remove("row-separated");
    }

      /**
   * 全ハイライトを削除
   * @param {HTMLElement} container - コンテナ要素（省略時はdocument全体）
   */
  static clearAllHighlights(container = document) {
    // 行レベルハイライトを削除
    const modifiedRows = container.querySelectorAll(".row-modified");
    modifiedRows.forEach((row) => {
      row.classList.remove("row-modified");
    });

    // セルレベルハイライトを削除
    const modifiedCells = container.querySelectorAll(".cell-modified");
    modifiedCells.forEach((cell) => {
      cell.classList.remove("cell-modified");
    });
  }

  /**
   * 🎯 UI制御用フィールドのハイライトを強制削除
   * @param {HTMLElement} row - 対象行
   */
  static clearUIControlFieldHighlights(row) {
    if (!row) return;

    // UI制御用フィールドのセレクタ
    const uiControlSelectors = [
      '[data-field-code="_row_number"]',
      '[data-field-code="_modification_checkbox"]', 
      '[data-field-code="_hide_button"]'
    ];

    uiControlSelectors.forEach(selector => {
      const cell = row.querySelector(selector);
      if (cell && cell.classList.contains('cell-modified')) {
        cell.classList.remove('cell-modified');
        console.log(`🧹 UI制御フィールドハイライト削除: ${selector}`);
      }
    });
  }

    /**
     * ハイライト状態の診断情報を取得
     * @param {HTMLElement} container - コンテナ要素（省略時はdocument全体）
     * @returns {Object} 診断情報
     */
    static getDiagnostics(container = document) {
      const modifiedRows = container.querySelectorAll(".row-modified");
      const modifiedCells = container.querySelectorAll(".cell-modified");
      const separatedRows = container.querySelectorAll(".row-separated");
      const evenRows = container.querySelectorAll(".row-even");
      const oddRows = container.querySelectorAll(".row-odd");

      return {
        modifiedRows: modifiedRows.length,
        modifiedCells: modifiedCells.length,
        separatedRows: separatedRows.length,
        evenRows: evenRows.length,
        oddRows: oddRows.length,
        totalRows: container.querySelectorAll("tr").length,
      };
    }
    
    /**
     * ✅ チェックボックス状態を更新する内部メソッド
     * @param {HTMLElement} row - 対象行
     */
    static _updateModificationCheckbox(row) {
      // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
      // 自動更新は完全に無効化
      // console.log('🎯 チェックボックス自動更新は無効化されています');
      return;
      
      // 無効化されたコード:
      // if (window.TableElementFactory && typeof window.TableElementFactory.updateModificationCheckboxState === 'function') {
      //   window.TableElementFactory.updateModificationCheckboxState(row);
      // } else if (window.TableComponentsFactory && typeof window.TableComponentsFactory.updateModificationCheckboxState === 'function') {
      //   window.TableComponentsFactory.updateModificationCheckboxState(row);
      // }
    }

    /**
     * 🎯 行番号ベースのハイライト診断情報を取得
     * @param {HTMLElement} container - コンテナ要素（省略時はdocument全体）
     * @returns {Object} 詳細診断情報
     */
    static getRowBasedDiagnostics(container = document) {
      const allRows = Array.from(container.querySelectorAll("#my-tbody tr[data-row-id]"));
      const modifiedRows = container.querySelectorAll("#my-tbody .row-modified[data-row-id]");
      const separatedRows = container.querySelectorAll("#my-tbody .row-separated[data-row-id]");
      
      const diagnostics = {
        summary: {
          totalRows: allRows.length,
          modifiedRows: modifiedRows.length,
          separatedRows: separatedRows.length,
          normalRows: allRows.length - modifiedRows.length - separatedRows.length
        },
        rowDetails: [],
        cellDetails: {
          totalCells: 0,
          modifiedCells: 0,
          cellsByRow: {}
        }
      };

      // 各行の詳細情報を取得
      allRows.forEach((row, index) => {
        const rowId = row.getAttribute('data-row-id');
        const isModified = row.classList.contains('row-modified');
        const isSeparated = row.classList.contains('row-separated');
        
        // 行内のセル情報を収集
        const cells = Array.from(row.children);
        const modifiedCells = cells.filter(cell => cell.classList.contains('cell-modified'));
        
        const rowDetail = {
          rowIndex: index + 1,
          rowId: rowId,
          isModified: isModified,
          isSeparated: isSeparated,
          totalCells: cells.length,
          modifiedCells: modifiedCells.length,
          classes: row.className
        };
        
        diagnostics.rowDetails.push(rowDetail);
        diagnostics.cellDetails.totalCells += cells.length;
        diagnostics.cellDetails.modifiedCells += modifiedCells.length;
        diagnostics.cellDetails.cellsByRow[rowId] = {
          total: cells.length,
          modified: modifiedCells.length
        };
      });

      // console.log('🔍 ===== 行番号ベースハイライト診断 =====');
      // console.log('📊 サマリー:', diagnostics.summary);
      // console.log('📊 セル統計:', diagnostics.cellDetails);
      // console.log('🔍 =========================================');

      return diagnostics;
    }

    /**
     * 🎯 ハイライト後のセルドラッグ&ドロップハンドラー再設定
     * @param {HTMLElement} cell - 対象セル
     */
    static _refreshCellDragDropAfterHighlight(cell) {
      if (!cell || !cell.hasAttribute('draggable')) return;
      
      const fieldCode = cell.getAttribute('data-field-code');
      const isAlreadyInitialized = cell.hasAttribute('data-drag-drop-initialized');
      
      // console.log(`🎯 ハイライト後のハンドラー再設定開始 [${fieldCode}]:`, {
      //   isDraggable: cell.hasAttribute('draggable'),
      //   isAlreadyInitialized: isAlreadyInitialized,
      //   className: cell.className
      // });
      
      try {
        // 行を取得
        const row = cell.closest('tr');
        if (!row) return;
        
        // TableElementFactoryが利用可能か確認
        if (!window.TableElementFactory || !window.TableElementFactory._reconstructIntegratedRecordFromRow) {
          console.warn('🎯 TableElementFactoryが利用できません');
          return;
        }
        
        // 行からレコード情報を再構築
        const record = window.TableElementFactory._reconstructIntegratedRecordFromRow(row);
        if (!record) {
          console.warn('🎯 レコード再構築に失敗しました:', row);
          return;
        }
        
        // フィールド情報を取得
        if (!fieldCode) return;
        
        const fieldConfig = window.FIELDS_CONFIG?.find(f => f.fieldCode === fieldCode);
        if (!fieldConfig) return;
        
        // セルの値を取得
        const cellValue = window.TableElementFactory._extractCellValueSafely(cell, fieldConfig);
        
        // 🎯 行番号ベースの情報を取得
        const rowId = row.getAttribute('data-row-id');
        
        // console.log(`🎯 ハイライト後再設定の詳細 [${fieldCode}]:`, {
        //   cellValue: cellValue,
        //   rowId: rowId,
        //   recordIntegrationKey: record.integrationKey?.substring(0, 50) + '...',
        //   isIntegratedRecord: record.isIntegratedRecord
        // });
        
        // 🚨 セルの複製・置換を避けて、既存イベントハンドラーのみ再設定
        // 既存のドラッグ&ドロップハンドラーを直接再設定
        window.TableElementFactory._setupCellDragAndDrop(cell, fieldConfig, cellValue, record);
        
        //console.log(`✅ ハイライト後にドラッグ&ドロップハンドラーを再設定完了 [${fieldCode}]`);
        
      } catch (error) {
        console.warn(`❌ ハイライト後のハンドラー再設定でエラー [${fieldCode}]:`, error);
      }
    }
  }

  // =============================================================================
  // 🌐 グローバル公開
  // =============================================================================

  // 初期化実行
  //SimpleHighlightManager.initialize();

  // windowオブジェクトに公開
  window.SimpleHighlightManager = SimpleHighlightManager;
  
  // 🎯 グローバル診断関数
  window.debugHighlights = function() {
    return SimpleHighlightManager.getDiagnostics();
  };
  
  window.debugRowHighlights = function() {
    return SimpleHighlightManager.getRowBasedDiagnostics();
  };
})();
