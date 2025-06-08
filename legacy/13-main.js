/**
 * 🌟 統合台帳システム - エレガントバージョン
 * @description kintone上で動作する美しく整理された統合台帳システム
 * @version 2.3.1 - Phase 3: 重複コードの統合 + バグ修正
 * @author システム開発チーム
 */
(function () {
  "use strict";
  // =============================================================================
  // 📊 状態管理クラス（基盤ユーティリティに依存）
  // =============================================================================

  /**
   * 🎯 セル状態管理クラス
   * @description セルの初期状態、変更状態、分離状態を管理
   */
  class CellStateManager {
    constructor() {
      // 🗑️ 削除済み: this.initialStates - 統合キーベース初期状態管理
      this.modifiedCells = new Set(); // 変更されたセルを追跡
      // 🗑️ 削除済み: this.separatedFields - 統合キーベース分離フィールド管理
      // 💭 コメントアウト: this.recordIds - 統合キーベースレコードID管理
      // this.recordIds = new Map();
      
      // 🎯 初期状態の自動保存フラグを追加
      this.autoSaveInitialState = true;
      
      // 🆕 行変更状態管理システム
      this.rowStates = new Map(); // 行番号 → 行状態情報
      this.rowChanges = new Map(); // 行番号 → 変更情報
      this.rowHistory = new Map(); // 行番号 → 変更履歴
      this.rowInitialStates = new Map(); // 行番号 → 初期状態
      this.rowSeparatedFields = new Map(); // 行番号 → 分離フィールドSet（行番号ベース専用）
    }

    // 💭 コメントアウト: 統合キーベース初期状態保存
    /*
    saveInitialState(row) {
      const integrationKey =
        row.getAttribute("data-integration-key") ||
        row.getAttribute("data-record-key");
      if (!integrationKey) return;

      const headerRow = document.getElementById("my-thead-row");
      if (!headerRow) return;

      const headers = Array.from(headerRow.children);
      const rowState = {};

      headers.forEach((th, index) => {
        const field = fieldsConfig.find((f) => f.label === th.textContent);
        if (!field) return;

        const cell = row.children[index];
        if (!cell) return;

        rowState[field.fieldCode] = this._extractCellValue(cell, field);
      });

      // 🆕 行変更状態管理システムの初期状態も保存
      this.saveRowInitialState(row, 'initial');
    }
    */

    // 🗑️ 削除済み: markFieldsAsSeparated() - 統合キーベース分離フィールド管理
    // → markFieldsAsSeparatedByRowId() を使用してください

    // 💭 コメントアウト: 統合キーベースレコードID管理
    /*
    updateRecordIds(integrationKey, recordIds) {
      if (recordIds && Object.keys(recordIds).length > 0) {
        this.recordIds.set(integrationKey, { ...recordIds });
      }
    }

    getRecordIds(integrationKey) {
      return this.recordIds.get(integrationKey) || null;
    }
    */

    // 🗑️ 削除済み: isFieldSeparated() - 統合キーベース分離フィールド判定
    // → isFieldSeparatedByRowId() を使用してください

    /**
     * フィールドが分離されたものかどうかを判定（行番号ベース）
     */
    isFieldSeparatedByRowId(rowId, fieldCode) {
      const separatedSet = this.rowSeparatedFields.get(rowId);
      return separatedSet ? separatedSet.has(fieldCode) : false;
    }

    /**
     * 分離されたフィールドを記録（行番号ベース）
     */
    markFieldsAsSeparatedByRowId(rowId, fieldCodes) {
      if (!this.rowSeparatedFields.has(rowId)) {
        this.rowSeparatedFields.set(rowId, new Set());
      }

      const separatedSet = this.rowSeparatedFields.get(rowId);
      fieldCodes.forEach((fieldCode) => {
        separatedSet.add(fieldCode);
      });
    }



    /**
     * 🆕 行番号ベースの状態転送（セル交換用）
     * @param {string} sourceRowId - ソース行番号
     * @param {string} targetRowId - ターゲット行番号
     * @param {Array<string>} exchangedFields - 交換されたフィールド一覧
     */
    transferRowStatesByExchange(sourceRowId, targetRowId, exchangedFields) {
      //console.log('🔄 行番号ベース状態転送（交換）:', {
      //  sourceRowId,
      //  targetRowId,
      //  exchangedFields
      //});

      // 初期状態を部分的に交換
      this._transferInitialStatesByFields(sourceRowId, targetRowId, exchangedFields);
      
      // 分離フィールド状態を部分的に交換
      this._transferSeparatedFieldsByFields(sourceRowId, targetRowId, exchangedFields);
      
      // 変更状態をリセット（交換後は再評価が必要）
      this._resetExchangedFieldsStates(sourceRowId, targetRowId, exchangedFields);
    }

    /**
     * フィールド別初期状態転送
     */
    _transferInitialStatesByFields(sourceRowId, targetRowId, exchangedFields) {
      const sourceInitialState = this.rowInitialStates.get(sourceRowId) || {};
      const targetInitialState = this.rowInitialStates.get(targetRowId) || {};
      
      const newSourceState = { ...sourceInitialState };
      const newTargetState = { ...targetInitialState };
      
      // 交換されたフィールドの初期状態を交換
      exchangedFields.forEach(fieldCode => {
        if (targetInitialState[fieldCode] !== undefined) {
          newSourceState[fieldCode] = targetInitialState[fieldCode];
        }
        if (sourceInitialState[fieldCode] !== undefined) {
          newTargetState[fieldCode] = sourceInitialState[fieldCode];
        }
      });
      
      // 更新した初期状態を保存
      this.rowInitialStates.set(sourceRowId, newSourceState);
      this.rowInitialStates.set(targetRowId, newTargetState);
      
      // console.log('✅ 初期状態転送完了:', {
      //   sourceRowId,
      //   targetRowId,
      //   transferredFields: exchangedFields
      // });
    }

    /**
     * フィールド別分離状態転送
     */
    _transferSeparatedFieldsByFields(sourceRowId, targetRowId, exchangedFields) {
      const sourceSeparated = this.rowSeparatedFields.get(sourceRowId) || new Set();
      const targetSeparated = this.rowSeparatedFields.get(targetRowId) || new Set();
      
      const newSourceSeparated = new Set(sourceSeparated);
      const newTargetSeparated = new Set(targetSeparated);
      
      // 交換されたフィールドの分離状態を交換
      exchangedFields.forEach(fieldCode => {
        const sourceHadSeparated = sourceSeparated.has(fieldCode);
        const targetHadSeparated = targetSeparated.has(fieldCode);
        
        if (targetHadSeparated) {
          newSourceSeparated.add(fieldCode);
        } else {
          newSourceSeparated.delete(fieldCode);
        }
        
        if (sourceHadSeparated) {
          newTargetSeparated.add(fieldCode);
        } else {
          newTargetSeparated.delete(fieldCode);
        }
      });
      
      // 更新した分離状態を保存
      this.rowSeparatedFields.set(sourceRowId, newSourceSeparated);
      this.rowSeparatedFields.set(targetRowId, newTargetSeparated);
      
          // console.log('✅ 分離状態転送完了:', {
          //   sourceRowId,
          //   targetRowId,
          //   transferredFields: exchangedFields
          // });
    }

    /**
     * 交換されたフィールドの変更状態をリセット
     */
    _resetExchangedFieldsStates(sourceRowId, targetRowId, exchangedFields) {
      // 行番号ベースの変更状態から交換されたフィールドの状態を削除
      [sourceRowId, targetRowId].forEach(rowId => {
        const changeInfo = this.rowChanges.get(rowId);
        if (changeInfo && changeInfo.changedFields) {
          exchangedFields.forEach(fieldCode => {
            delete changeInfo.changedFields[fieldCode];
          });
          
          // 変更されたフィールドがなくなった場合は行全体をリセット
          if (Object.keys(changeInfo.changedFields).length === 0) {
            changeInfo.changeType = 'initial';
            changeInfo.hasChanges = false;
          }
        }
      });
      
      // console.log('✅ 交換フィールド状態リセット完了:', {
      //   sourceRowId,
      //   targetRowId,
      //   resetFields: exchangedFields
      // });
    }

    /**
     * 🔍 セル交換状態転送の診断情報取得
     */
    getExchangeTransferDiagnostics() {
      return {
        行番号ベース初期状態: this.rowInitialStates.size,
        行番号ベース分離フィールド: this.rowSeparatedFields.size,
        行番号ベース変更状態: this.rowChanges.size,
        
        // 詳細データ
        行番号ベース初期状態データ: Array.from(this.rowInitialStates.entries()).map(([rowId, state]) => ({
          行番号: rowId,
          フィールド数: Object.keys(state).length,
          フィールド: Object.keys(state)
        })),
        
        行番号ベース分離データ: Array.from(this.rowSeparatedFields.entries()).map(([rowId, fields]) => ({
          行番号: rowId,
          分離フィールド数: fields.size,
          分離フィールド: Array.from(fields)
        })),
        
        // 新しい診断情報
        new: {
          // ここに新しい診断情報を追加することができます
        }
      };
    }

    /**
     * 状態転送の整合性チェック
     */
    _checkTransferIntegrity() {
      const issues = [];
      
      // 現在のテーブル行と行番号ベース状態の整合性チェック
      const tbody = document.getElementById('my-tbody');
      if (tbody) {
        const rows = Array.from(tbody.children);
        
        rows.forEach((row, index) => {
          const rowId = row.getAttribute('data-row-id') || String(index + 1);
          const integrationKey = row.getAttribute('data-integration-key');
          
          const hasRowInitialState = this.rowInitialStates.has(rowId);
          
          if (!hasRowInitialState) {
            issues.push(`行番号${rowId}: 行番号ベース初期状態が不足`);
          }
        });
      }
      
      return {
        問題数: issues.length,
        問題詳細: issues,
        整合性状態: issues.length === 0 ? '正常' : '不整合あり'
      };
    }





    /**
     * セルの値を抽出
     */
    _extractCellValue(cell, field) {
      // utilities.jsのCellValueHelperを使用
      return CellValueHelper.extractSafely(cell, field);
    }

    /**
     * ハイライト状態を更新（行番号ベース）
     * @param {HTMLElement} row - 行要素
     * @param {string} fieldCode - フィールドコード
     */
    updateHighlightState(row, fieldCode) {
      // パラメータ検証
      if (!row || !fieldCode) {
        console.warn('⚠️ updateHighlightState: 無効なパラメータ', { row: !!row, fieldCode });
        return;
      }

      // セル要素を検索
      const cell = this._findCellInRow(row, fieldCode);
      if (!cell) {
        // 🔧 オートフィルタ問題の詳細デバッグ情報
        const headerRow = document.getElementById("my-thead-row");
        if (headerRow) {
          const headers = Array.from(headerRow.children);
          console.warn(`⚠️ セルが見つかりません: ${fieldCode}`);
          console.warn(`🔍 ヘッダー一覧:`, headers.map(h => h.textContent));
          console.warn(`🔍 検索対象フィールド:`, fieldsConfig.find(f => f.fieldCode === fieldCode));
        }
        return;
      }

      // 行番号を取得（複数の方法で試行）
      let rowId = row.getAttribute('data-row-id');
      if (!rowId) {
        // 行番号が設定されていない場合は、テーブル内の位置から取得
        const tbody = row.parentElement;
        if (tbody) {
          const rows = Array.from(tbody.children);
          const rowIndex = rows.indexOf(row);
          if (rowIndex >= 0) {
            rowId = String(rowIndex + 1);
            row.setAttribute('data-row-id', rowId); // 設定しておく
            //console.log(`🔧 行番号を自動設定: ${rowId}`);
          }
        }
      }

      if (!rowId) {
        console.warn('⚠️ 行番号を取得できません - フォールバック処理');
        // フォールバック: 直接ハイライト処理
        if (window.SimpleHighlightManager) {
          window.SimpleHighlightManager.markCellAsModified(cell);
          this.modifiedCells.add(cell);
        }
        return;
      }

      // 行番号ベースで初期状態を取得
      const rowInitialState = this.rowInitialStates.get(rowId);
      // 行番号ベース初期状態検索ログは冗長なため削除
      
      // 初期状態がない場合の処理
      if (!rowInitialState) {
        if (this.autoSaveInitialState) {
          //console.log(`🎯 初期状態未保存 - 自動保存実行: 行番号=${rowId}`);
          this.saveInitialState(row);
          // 行番号ベースでも保存
          this.saveRowInitialState(row, 'initial');
        } else {
          //console.log(`🎯 初期状態未保存 - セル変更をハイライト: ${fieldCode}`);
          
          // 初期状態がない場合は変更があったものとしてハイライト
          if (window.SimpleHighlightManager) {
            window.SimpleHighlightManager.markCellAsModified(cell);
            this.modifiedCells.add(cell);
          }
          
          // 行レベルの状態を再評価
          this._updateRowLevelHighlightByRowId(row, rowId);
          return;
        }
        
        // 自動保存後に再取得
        const newRowInitialState = this.rowInitialStates.get(rowId);
        if (!newRowInitialState) {
          console.warn(`⚠️ 自動保存後も初期状態が見つかりません: 行番号=${rowId}`);
          // フォールバック: 変更ありとしてハイライト
          if (window.SimpleHighlightManager) {
            window.SimpleHighlightManager.markCellAsModified(cell);
            this.modifiedCells.add(cell);
          }
          return;
        }
      }

      // フィールド設定を取得
      const field = fieldsConfig.find((f) => f.fieldCode === fieldCode);
      if (!field) {
        console.warn(`⚠️ フィールド設定が見つかりません: ${fieldCode}`);
        return;
      }

      // 現在の値と初期値を比較
      const currentValue = this._extractCellValue(cell, field);
      const finalRowInitialState = rowInitialState || this.rowInitialStates.get(rowId);
      
      // 🔧 安全性チェック: フィールドデータが存在しない場合のハンドリング
      const fieldData = finalRowInitialState?.fields?.[fieldCode];
      if (!fieldData) {
        console.warn(`⚠️ フィールドの初期状態が見つかりません: ${fieldCode} (行番号: ${rowId})`);
        console.warn(`利用可能フィールド:`, Object.keys(finalRowInitialState?.fields || {}));
        // 初期状態がない場合は変更なしとして扱う
        return;
      }
      
      const initialValue = fieldData.value;
      const isModified = currentValue !== initialValue;
      
      // 行番号ベースの分離フィールドチェック
      const isSeparated = this.isFieldSeparatedByRowId(rowId, fieldCode);

      // ハイライト判定ログは冗長なため削除

      // ハイライト状態を更新
      if (isModified || isSeparated) {
        // セルハイライト適用ログは冗長なため削除
        if (window.SimpleHighlightManager) {
          window.SimpleHighlightManager.markCellAsModified(cell);
          this.modifiedCells.add(cell);
        }
      } else {
        // セルハイライト削除ログは冗長なため削除
        if (window.SimpleHighlightManager) {
          window.SimpleHighlightManager.unmarkCellAsModified(cell);
          this.modifiedCells.delete(cell);
        }
      }

      // 行レベルの状態を再評価
      // 行レベルハイライト状態再評価ログは冗長なため削除
      this._updateRowLevelHighlightByRowId(row, rowId);
    }

    // 🗑️ 削除済み: _updateRowLevelHighlight (統合キーベース) 
    // 行番号ベースの _updateRowLevelHighlightByRowId を使用してください

    /**
     * 行レベルのハイライト状態を正確に更新（行番号ベース）
     * @param {HTMLElement} row - 行要素
     * @param {string} rowId - 行番号
     */
    _updateRowLevelHighlightByRowId(row, rowId) {
      if (!window.SimpleHighlightManager) return;

      // 🧹 UI制御用フィールドのハイライトを強制削除
      window.SimpleHighlightManager.clearUIControlFieldHighlights(row);

      // 行番号ベースで初期状態を取得
      const rowInitialState = this.rowInitialStates.get(rowId);
      if (!rowInitialState) return;

      // 行内の全フィールドをチェックして、変更があるかどうかを判定
      let hasAnyChanges = false;
      const fieldCodes = DOMHelper.getAllFieldCodesInRowForHighlight(row);

      for (const fieldCode of fieldCodes) {
        const cell = this._findCellInRow(row, fieldCode);
        if (!cell) continue;

        const field = fieldsConfig.find((f) => f.fieldCode === fieldCode);
        if (!field) continue;

        const currentValue = this._extractCellValue(cell, field);
        
        // 🔧 安全性チェック: フィールドデータの存在確認
        const fieldData = rowInitialState.fields?.[fieldCode];
        if (!fieldData) {
          console.warn(`⚠️ 行レベルハイライト更新: フィールドの初期状態が見つかりません: ${fieldCode} (行番号: ${rowId})`);
          continue; // このフィールドはスキップして次へ
        }
        
        const initialValue = fieldData.value;
        const isModified = currentValue !== initialValue;
        const isSeparated = this.isFieldSeparatedByRowId(rowId, fieldCode);

        if (isModified || isSeparated) {
          hasAnyChanges = true;
          break;
        }
      }

      // 行レベルのハイライトを更新
      if (hasAnyChanges) {
        window.SimpleHighlightManager.markRowAsModified(row);
        // 行レベルハイライト適用ログは冗長なため削除
      } else {
        window.SimpleHighlightManager.unmarkRowAsModified(row);
        // 行レベルハイライト削除ログは冗長なため削除
      }
    }

    /**
     * 行内の全フィールドをチェック（行番号ベース）
     */
    checkAllFieldsInRow(row) {
      const fieldCodes = DOMHelper.getAllFieldCodesInRowForHighlight(row);
      
      fieldCodes.forEach((fieldCode) => {
        this.updateHighlightState(row, fieldCode);
      });
    }

    /**
     * 行内でフィールドに対応するセルを検索
     */
    _findCellInRow(row, fieldCode) {
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

    // =============================================================================
    // 🆕 行変更状態管理システム
    // =============================================================================

    /**
     * 行の初期状態を記録（行番号ベース）
     * @param {HTMLElement} row - 行要素
     * @param {string} changeType - 変更タイプ（initial/added/separated）
     */
    saveRowInitialState(row, changeType = 'initial') {
      if (!row) return;

      const rowId = row.getAttribute('data-row-id');
      // 💭 コメントアウト: 統合キー取得
      // const integrationKey = row.getAttribute('data-integration-key') || row.getAttribute('data-record-key');
      
      if (!rowId) {
        console.warn('🆕 行番号が見つかりません:', row);
        return;
      }

      // 行の全フィールド値を取得
      const headerRow = document.getElementById("my-thead-row");
      if (!headerRow) return;

      const headers = Array.from(headerRow.children);
      const rowData = {
        rowId: rowId,
        // 💭 コメントアウト: 統合キー保存
        // integrationKey: integrationKey,
        changeType: changeType,
        timestamp: new Date().toISOString(),
        fields: {}
      };

      headers.forEach((th, index) => {
        // 🔧 オートフィルタによる"▼"サフィックスを正規化
        const headerText = th.textContent?.replace(/▼$/, '') || '';
        const field = fieldsConfig.find((f) => f.label === headerText);
        if (!field) return;

        const cell = row.children[index];
        if (!cell) return;

        rowData.fields[field.fieldCode] = {
          value: this._extractCellValue(cell, field),
          fieldType: field.cellType || 'text',
          isEditable: !field.isReadOnly
        };
      });

      // 行初期状態を保存（updateHighlightStateで使用するマップに統一）
      this.rowInitialStates.set(rowId, rowData);
      this.rowStates.set(rowId, rowData); // 後方互換性のために両方に保存
      
      // 変更履歴の初期化
      if (!this.rowHistory.has(rowId)) {
        this.rowHistory.set(rowId, []);
      }
      
      // 初期状態保存ログは冗長なため削除
    }

    /**
     * 行の変更を検出・記録
     * @param {HTMLElement} row - 変更された行
     * @param {string} changedFieldCode - 変更されたフィールドコード
     * @param {any} newValue - 新しい値
     * @param {any} oldValue - 古い値
     */
    detectRowChange(row, changedFieldCode, newValue, oldValue) {
      if (!row) return;

      const rowId = row.getAttribute('data-row-id');
      if (!rowId) return;

      const currentTime = new Date().toISOString();
      
      // 既存の変更情報を取得または新規作成
      let changeInfo = this.rowChanges.get(rowId) || {
        rowId: rowId,
        changeType: 'modified',
        modifiedFields: new Set(),
        changes: {},
        firstChangeTime: currentTime,
        lastChangeTime: currentTime
      };

      // フィールドの変更を記録
      changeInfo.modifiedFields.add(changedFieldCode);
      changeInfo.changes[changedFieldCode] = {
        oldValue: oldValue,
        newValue: newValue,
        timestamp: currentTime
      };
      changeInfo.lastChangeTime = currentTime;

      // 変更情報を保存
      this.rowChanges.set(rowId, changeInfo);

      // 変更履歴に追加
      const historyEntry = {
        timestamp: currentTime,
        fieldCode: changedFieldCode,
        oldValue: oldValue,
        newValue: newValue,
        action: 'field_modified'
      };
      
      if (!this.rowHistory.has(rowId)) {
        this.rowHistory.set(rowId, []);
      }
      this.rowHistory.get(rowId).push(historyEntry);

      // 行変更検出ログは冗長なため削除
      
      // 行レベルのハイライト更新
      this._updateRowChangeHighlight(row, changeInfo);
    }

    /**
     * 行の変更状態を取得
     * @param {string} rowId - 行番号
     * @returns {Object|null} 変更情報
     */
    getRowChangeInfo(rowId) {
      return this.rowChanges.get(rowId) || null;
    }

    /**
     * 行の初期状態を取得
     * @param {string} rowId - 行番号
     * @returns {Object|null} 初期状態情報
     */
    getRowInitialState(rowId) {
      return this.rowStates.get(rowId) || null;
    }

    /**
     * 行の変更履歴を取得
     * @param {string} rowId - 行番号
     * @returns {Array} 変更履歴
     */
    getRowHistory(rowId) {
      return this.rowHistory.get(rowId) || [];
    }

    /**
     * 行が変更されているかチェック
     * @param {string} rowId - 行番号
     * @returns {boolean} 変更されている場合true
     */
    isRowModified(rowId) {
      const changeInfo = this.rowChanges.get(rowId);
      return changeInfo && changeInfo.modifiedFields.size > 0;
    }

    /**
     * 全ての変更された行の一覧を取得
     * @returns {Array} 変更行の情報配列
     */
    getAllModifiedRows() {
      const modifiedRows = [];
      for (const [rowId, changeInfo] of this.rowChanges) {
        if (changeInfo.modifiedFields.size > 0) {
          modifiedRows.push({
            rowId: rowId,
            ...changeInfo,
            modifiedFields: Array.from(changeInfo.modifiedFields)
          });
        }
      }
      return modifiedRows;
    }

    /**
     * 行の変更状態をリセット
     * @param {string} rowId - 行番号
     */
    resetRowChangeState(rowId) {
      this.rowChanges.delete(rowId);
      
      // DOM要素からハイライトを削除
      const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
      if (row && window.SimpleHighlightManager) {
        window.SimpleHighlightManager.unmarkRowAsModified(row);
      }
      
      //console.log(`🔄 行変更状態をリセット: 行番号=${rowId}`);
    }

    /**
     * 全ての変更状態をクリア
     */
    clearAllRowChangeStates() {
      const modifiedRowIds = Array.from(this.rowChanges.keys());
      
      // 全ての変更状態をリセット
      modifiedRowIds.forEach(rowId => this.resetRowChangeState(rowId));
      
      // マップをクリア
      this.rowChanges.clear();
      this.rowStates.clear();
      this.rowHistory.clear();
      
      //console.log('🔄 全ての行変更状態をクリア');
    }

    /**
     * 行変更状態のハイライトを更新
     * @param {HTMLElement} row - 行要素
     * @param {Object} changeInfo - 変更情報
     * @private
     */
    _updateRowChangeHighlight(row, changeInfo) {
      if (!row) return;

      // SimpleHighlightManagerを使用してハイライト
      if (window.SimpleHighlightManager) {
        if (changeInfo.modifiedFields.size > 0) {
          window.SimpleHighlightManager.markRowAsModified(row);
        } else {
          window.SimpleHighlightManager.unmarkRowAsModified(row);
        }
      }
    }

    // =============================================================================
    // 🔍 デバッグ・確認用メソッド
    // =============================================================================

    /**
     * 行番号ベース初期状態の保存状況を確認
     * @returns {Object} 保存状況の詳細レポート
     */
    debugRowInitialStates() {
      const report = {
        totalRows: this.rowStates.size,
        rowDetails: [],
        summary: {}
      };

      //console.log('🔍 ===== 行番号ベース初期状態 デバッグレポート =====');
      //console.log(`📊 保存済み行数: ${this.rowStates.size}`);

      for (const [rowId, rowData] of this.rowStates) {
        const detail = {
          rowId: rowId,
          changeType: rowData.changeType,
          timestamp: rowData.timestamp,
          integrationKey: rowData.integrationKey ? rowData.integrationKey.substring(0, 50) + '...' : 'なし',
          fieldCount: Object.keys(rowData.fields).length,
          fields: Object.keys(rowData.fields)
        };

        report.rowDetails.push(detail);

        // console.log(`🔢 行番号 ${rowId}:`, {
        //   タイプ: rowData.changeType,
        //   統合キー: detail.integrationKey,
        //   フィールド数: detail.fieldCount,
        //   タイムスタンプ: rowData.timestamp
        // });
      }

      // サマリー情報
      report.summary = {
        changeTypes: [...new Set(report.rowDetails.map(d => d.changeType))],
        totalFields: report.rowDetails.reduce((sum, d) => sum + d.fieldCount, 0),
        hasIntegrationKeys: report.rowDetails.filter(d => d.integrationKey !== 'なし').length
      };

      //console.log('📋 サマリー:', report.summary);
      //console.log('🔍 ===============================================');

      return report;
    }

    /**
     * 特定の行番号の初期状態詳細を表示
     * @param {string} rowId - 行番号
     */
    debugRowDetail(rowId) {
      const rowData = this.rowStates.get(rowId);
      
      if (!rowData) {
        console.warn(`❌ 行番号 ${rowId} の初期状態が見つかりません`);
        return null;
      }

      // console.log(`🔍 行番号 ${rowId} の詳細:`, {
      //   rowId: rowData.rowId,
      //   changeType: rowData.changeType,
      //   timestamp: rowData.timestamp,
      //   integrationKey: rowData.integrationKey,
      //   fieldCount: Object.keys(rowData.fields).length
      // });

      // console.log('📝 フィールド詳細:');
      // for (const [fieldCode, fieldData] of Object.entries(rowData.fields)) {
      //   console.log(`  ${fieldCode}:`, {
      //     値: fieldData.value,
      //     タイプ: fieldData.fieldType,
      //     編集可能: fieldData.isEditable
      //   });
      // }

      return rowData;
    }

    /**
     * 現在のテーブル上の全行の行番号を確認
     */
    debugCurrentTableRows() {
      const tableRows = document.querySelectorAll('#my-tbody tr[data-row-id]');
      
      //console.log('🔍 ===== 現在のテーブル行状況 =====');
      //console.log(`📊 テーブル上の行数: ${tableRows.length}`);

      const currentRowIds = [];
      tableRows.forEach((row, index) => {
        const rowId = row.getAttribute('data-row-id');
        const integrationKey = row.getAttribute('data-integration-key');
        
        currentRowIds.push(rowId);
        
        //console.log(`🔢 ${index + 1}行目:`, {
        //  行番号: rowId,
        //  統合キー: integrationKey ? integrationKey.substring(0, 50) + '...' : 'なし',
        //  初期状態保存済み: this.rowStates.has(rowId)
        //});
      });

      //console.log('🔍 ===============================');
      return currentRowIds;
    }

    /**
     * 初期状態保存の整合性チェック
     */
    debugIntegrityCheck() {
      const currentRowIds = this.debugCurrentTableRows();
      const savedRowIds = Array.from(this.rowStates.keys());

      //console.log('🔍 ===== 整合性チェック =====');
      
      // テーブルにあるが初期状態が保存されていない行
      const missingStates = currentRowIds.filter(rowId => !this.rowStates.has(rowId));
      // if (missingStates.length > 0) {
      //   console.warn('⚠️ 初期状態未保存の行:', missingStates);
      // } else {
      //   console.log('✅ 全ての行の初期状態が保存済み');
      // }

      // 初期状態は保存されているがテーブルにない行
      const orphanedStates = savedRowIds.filter(rowId => !currentRowIds.includes(rowId));
      // if (orphanedStates.length > 0) {
      //   console.warn('⚠️ 孤立した初期状態:', orphanedStates);
      // } else {
      //   console.log('✅ 孤立した初期状態なし');
      // }

      //console.log('🔍 ========================');
      
      return {
        currentRows: currentRowIds.length,
        savedStates: savedRowIds.length,
        missingStates,
        orphanedStates
      };
    }

    /**
     * 🆕 分離処理用の行番号ベース初期状態管理
     * @param {HTMLElement} originalRow - 元の行（分離元）
     * @param {HTMLElement} separatedRow - 新しい行（分離先）
     * @param {Array<string>} separatedFields - 分離されたフィールド一覧
     * @param {string} sourceApp - 分離されたアプリタイプ
     */
    setupSeparationStates(originalRow, separatedRow, separatedFields, sourceApp) {
      // console.log('🔄 分離処理用行番号ベース状態管理開始:', {
      //   separatedFields,
      //   sourceApp
      // });

      try {
        // 1. 行番号を取得または設定
        const originalRowId = this._ensureRowId(originalRow);
        const separatedRowId = this._ensureRowId(separatedRow);

        if (!originalRowId || !separatedRowId) {
          console.warn('❌ 分離処理: 行番号取得失敗');
          return;
        }

        // 2. 分離先行の初期状態を設定（分離されたフィールドの値を初期状態として記録）
        this._setupSeparatedRowInitialState(separatedRow, separatedRowId, separatedFields, sourceApp);

        // 3. 分離元行の初期状態を更新（分離されたフィールドを除去）
        this._updateOriginalRowInitialState(originalRow, originalRowId, separatedFields, sourceApp);

        // 4. 分離フィールドマークを設定
        this._markSeparatedFields(originalRowId, separatedRowId, separatedFields, sourceApp);

        // console.log('✅ 分離処理用行番号ベース状態管理完了:', {
        //   originalRowId,
        //   separatedRowId,
        //   separatedFields
        // });

      } catch (error) {
        console.error('❌ 分離処理状態管理エラー:', error);
      }
    }

    /**
     * 分離先行の初期状態を設定
     */
    _setupSeparatedRowInitialState(separatedRow, separatedRowId, separatedFields, sourceApp) {
      const headerRow = document.getElementById("my-thead-row");
      if (!headerRow) return;

      const headers = Array.from(headerRow.children);
      const separatedInitialState = {
        rowId: separatedRowId,
        changeType: 'separated',
        timestamp: new Date().toISOString(),
        fields: {} // 🔧 正しい形式: fields オブジェクト内にフィールドデータを格納
      };

      headers.forEach((th, index) => {
        // 🔧 オートフィルタによる"▼"サフィックスを正規化
        const headerText = th.textContent?.replace(/▼$/, '') || '';
        const field = fieldsConfig.find((f) => f.label === headerText);
        if (!field) return;

        const cell = separatedRow.children[index];
        if (!cell) return;

        // 🔧 正しい形式でフィールドデータを保存
        separatedInitialState.fields[field.fieldCode] = {
          value: this._extractCellValue(cell, field),
          fieldType: field.cellType || 'text',
          isEditable: !field.isReadOnly
        };
      });

      // 分離先行の初期状態を保存
      this.rowInitialStates.set(separatedRowId, separatedInitialState);
      this.rowStates.set(separatedRowId, separatedInitialState); // 後方互換性
      
      // レコードIDフィールドも含めて記録
      const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
      if (!separatedFields.includes(recordIdField)) {
        separatedFields.push(recordIdField);
      }

      // console.log('✅ 分離先行初期状態設定:', {
      //   separatedRowId,
      //   フィールド数: Object.keys(separatedInitialState.fields).length
      // });
    }

    /**
     * 分離元行の初期状態を更新
     */
    _updateOriginalRowInitialState(originalRow, originalRowId, separatedFields, sourceApp) {
      const currentInitialState = this.rowInitialStates.get(originalRowId);
      if (!currentInitialState) {
        // 初期状態がない場合は新しく作成
        this.saveRowInitialState(originalRow, 'initial');
        return;
      }

      // 🔧 正しい形式で分離されたフィールドの初期状態を空値に更新
      const updatedInitialState = { 
        ...currentInitialState,
        fields: { ...currentInitialState.fields }
      };
      
      separatedFields.forEach(fieldCode => {
        if (updatedInitialState.fields[fieldCode]) {
          updatedInitialState.fields[fieldCode].value = '';
        }
      });

      // レコードIDフィールドも空値に設定
      const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
      if (updatedInitialState.fields[recordIdField]) {
        updatedInitialState.fields[recordIdField].value = '';
      }

      // 更新した初期状態を保存
      this.rowInitialStates.set(originalRowId, updatedInitialState);
      this.rowStates.set(originalRowId, updatedInitialState); // 後方互換性

      // console.log('✅ 分離元行初期状態更新:', {
      //   originalRowId,
      //   クリアしたフィールド: [...separatedFields, recordIdField]
      // });
    }

    /**
     * 分離フィールドマークを設定
     */
    _markSeparatedFields(originalRowId, separatedRowId, separatedFields, sourceApp) {
      // 分離先行：分離されたフィールドとしてマーク
      this.markFieldsAsSeparatedByRowId(separatedRowId, separatedFields);
      
      // レコードIDフィールドも分離マークを設定
      const recordIdField = `${sourceApp.toLowerCase()}_record_id`;
      this.markFieldsAsSeparatedByRowId(separatedRowId, [recordIdField]);

      // 分離元行：分離されたフィールドの分離マークは削除（もう存在しないため）
      const originalSeparatedFields = this.rowSeparatedFields.get(originalRowId) || new Set();
      separatedFields.forEach(fieldCode => {
        originalSeparatedFields.delete(fieldCode);
      });
      originalSeparatedFields.delete(recordIdField);

      // console.log('✅ 分離フィールドマーク設定:', {
      //   separatedRowId,
      //   マークしたフィールド: [...separatedFields, recordIdField],
      //   originalRowId,
      //   削除したマーク: [...separatedFields, recordIdField]
      // });
    }

    /**
     * 行番号を確実に取得または設定
     */
    _ensureRowId(row) {
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
            //console.log(`🔧 分離処理: 行番号を自動設定: ${rowId}`);
          }
        }
      }
      
      return rowId;
    }

    /**
     * 🔍 分離処理の診断情報取得
     */
    getSeparationDiagnostics() {
      const separationSummary = {
        行番号ベース分離フィールド数: this.rowSeparatedFields.size,
        // 🗑️ 削除: 統合キーベース分離フィールド数（行番号ベースに移行済み）
        行番号ベース初期状態数: this.rowInitialStates.size
      };

      const rowBasedSeparations = Array.from(this.rowSeparatedFields.entries()).map(([rowId, fields]) => ({
        行番号: rowId,
        分離フィールド数: fields.size,
        分離フィールド: Array.from(fields)
      }));

      return {
        サマリー: separationSummary,
        行番号ベース分離詳細: rowBasedSeparations.slice(0, 5), // 最初の5件のみ
        完全性チェック: this._validateSeparatedRows(),
        診断時刻: new Date().toISOString()
      };
    }

    /**
     * 分離行の完全性チェック
     */
    _validateSeparatedRows() {
      const issues = [];
      const tbody = document.getElementById('my-tbody');
      
      if (!tbody) {
        return { エラー: 'テーブルが見つかりません' };
      }

      const rows = tbody.querySelectorAll('tr[data-row-id]');
      
      rows.forEach(row => {
        const rowId = row.getAttribute('data-row-id');
        const integrationKey = row.getAttribute('data-integration-key');
        
        const hasRowSeparatedFields = this.rowSeparatedFields.has(rowId);
        
        if (!hasRowSeparatedFields) {
          // 分離フィールドが設定されていない行をチェック（必要に応じて）
        }
      });

      return {
        チェック行数: rows.length,
        問題数: issues.length,
        問題詳細: issues,
        整合性状態: issues.length === 0 ? '正常' : '不整合あり'
      };
    }

    // =============================================================================
    // 🎯 テーブル更新時の状態管理
    // =============================================================================

    /**
     * 🎯 テーブル更新時の行番号ベース状態同期
     * @param {HTMLElement} tbody - テーブルボディ要素
     * @param {string} updateType - 更新タイプ（new/append/refresh）
     */
    syncTableUpdateStates(tbody, updateType = 'refresh') {
      if (!tbody) return;

      // console.log('🎯 テーブル更新状態同期開始:', {
      //   updateType,
      //   既存行番号ベース状態: this.rowInitialStates.size
      // });

      const rows = Array.from(tbody.querySelectorAll("tr"));
      const syncResults = {
        totalRows: rows.length,
        rowsWithId: 0,
        newRowStates: 0,
        updatedRowStates: 0,
        orphanedStates: 0
      };

      // 現在のテーブル行の状態を確認・同期
      const currentRowIds = new Set();
      
      rows.forEach((row, index) => {
        let rowId = row.getAttribute('data-row-id');
        
        // 行番号がない場合は自動設定
        if (!rowId) {
          rowId = String(index + 1);
          row.setAttribute('data-row-id', rowId);
          //console.log(`🔧 行番号自動設定: 行${index + 1} → ${rowId}`);
        }
        
        currentRowIds.add(rowId);
        syncResults.rowsWithId++;

        // 行番号ベース初期状態の同期
        if (!this.rowInitialStates.has(rowId)) {
          this.saveRowInitialState(row, updateType === 'new' ? 'initial' : 'synced');
          syncResults.newRowStates++;
        } else {
          // 既存状態の更新判定（必要に応じて）
          if (updateType === 'refresh') {
            this._updateRowStateIfNeeded(row, rowId);
            syncResults.updatedRowStates++;
          }
        }
      });

      // 孤立した状態の検出・清理
      const orphanedRowIds = Array.from(this.rowInitialStates.keys()).filter(rowId => !currentRowIds.has(rowId));
      orphanedRowIds.forEach(rowId => {
        this.rowInitialStates.delete(rowId);
        this.rowStates.delete(rowId);
        this.rowChanges.delete(rowId);
        this.rowHistory.delete(rowId);
        this.rowSeparatedFields.delete(rowId);
        syncResults.orphanedStates++;
      });

      //console.log('🎯 テーブル更新状態同期完了:', syncResults);
      return syncResults;
    }

    /**
     * 必要に応じて行状態を更新
     */
    _updateRowStateIfNeeded(row, rowId) {
      const currentState = this.rowInitialStates.get(rowId);
      if (!currentState) return;

      // 統合キーの変更チェック
      const currentIntegrationKey = row.getAttribute('data-integration-key') || row.getAttribute('data-record-key');
      if (currentIntegrationKey && currentState.integrationKey !== currentIntegrationKey) {
        //console.log(`🔄 統合キー変更検出: 行番号=${rowId}`);
        currentState.integrationKey = currentIntegrationKey;
        currentState.lastUpdated = new Date().toISOString();
        this.rowInitialStates.set(rowId, currentState);
      }
    }

    /**
     * 🎯 テーブル更新時の診断情報を取得
     * @returns {Object} テーブル更新診断情報
     */
    getTableUpdateStateDiagnostics() {
      const tbody = document.getElementById('my-tbody');
      if (!tbody) return { error: 'テーブルが見つかりません' };

      const rows = Array.from(tbody.querySelectorAll('tr'));
      const rowsWithId = rows.filter(row => row.getAttribute('data-row-id'));
      
      // 状態の一致度チェック
      let stateMatchCount = 0;
      let stateMismatchCount = 0;
      
      rowsWithId.forEach(row => {
        const rowId = row.getAttribute('data-row-id');
        const integrationKey = row.getAttribute('data-integration-key');
        
        const hasRowState = this.rowInitialStates.has(rowId);
        
        if (hasRowState) {
          stateMatchCount++;
        } else {
          stateMismatchCount++;
        }
      });

      return {
        table: {
          totalRows: rows.length,
          rowsWithId: rowsWithId.length,
          rowIdCoverage: Math.round((rowsWithId.length / rows.length) * 100)
        },
        states: {
          rowBasedStates: this.rowInitialStates.size,
          matchingStates: stateMatchCount,
          mismatchingStates: stateMismatchCount,
          consistency: stateMismatchCount === 0 ? '一致' : '不整合'
        },
        performance: {
          rowStateHitRate: Math.round((stateMatchCount / Math.max(rowsWithId.length, 1)) * 100),
          totalStatesEfficiency: Math.round((this.rowInitialStates.size / rows.length) * 100)
        },
        timestamp: new Date().toISOString()
      };
    }

    /**
     * 🎯 行番号ベーステーブル更新の強制同期
     */
    forceTableStateSync() {
      //console.log('🔧 テーブル状態強制同期開始');
      
      const tbody = document.getElementById('my-tbody');
      if (!tbody) {
        console.error('❌ テーブルが見つかりません');
        return;
      }

      const results = this.syncTableUpdateStates(tbody, 'force');
      
      //console.log('🔧 テーブル状態強制同期完了:', results);
      return results;
    }

    // =============================================================================
    // 🎯 テーブル更新時の状態管理
    // =============================================================================

    /**
     * 🎯 テーブル更新時の行番号ベース状態同期
     * @param {HTMLElement} tbody - テーブルボディ要素
     * @param {string} updateType - 更新タイプ（new/append/refresh）
     */
    syncTableUpdateStates(tbody, updateType = 'refresh') {
      if (!tbody) return;

      // console.log('🎯 テーブル更新状態同期開始:', {
      //   updateType,
      //   既存行番号ベース状態: this.rowInitialStates.size,
      //   // 🗑️ 削除: 統合キーベース状態（行番号ベースに移行済み）
      // });

      const rows = Array.from(tbody.querySelectorAll("tr"));
      const syncResults = {
        totalRows: rows.length,
        rowsWithId: 0,
        newRowStates: 0,
        updatedRowStates: 0,
        orphanedStates: 0
      };

      // 現在のテーブル行の状態を確認・同期
      const currentRowIds = new Set();
      
      rows.forEach((row, index) => {
        let rowId = row.getAttribute('data-row-id');
        
        // 行番号がない場合は自動設定
        if (!rowId) {
          rowId = String(index + 1);
          row.setAttribute('data-row-id', rowId);
          // console.log(`🔧 行番号自動設定: 行${index + 1} → ${rowId}`);
        }
        
        currentRowIds.add(rowId);
        syncResults.rowsWithId++;

        // 行番号ベース初期状態の同期
        if (!this.rowInitialStates.has(rowId)) {
          this.saveRowInitialState(row, updateType === 'new' ? 'initial' : 'synced');
          syncResults.newRowStates++;
        } else {
          // 既存状態の更新判定（必要に応じて）
          if (updateType === 'refresh') {
            this._updateRowStateIfNeeded(row, rowId);
            syncResults.updatedRowStates++;
          }
        }
      });

      // 孤立した状態の検出・清理
      const orphanedRowIds = Array.from(this.rowInitialStates.keys()).filter(rowId => !currentRowIds.has(rowId));
      orphanedRowIds.forEach(rowId => {
        this.rowInitialStates.delete(rowId);
        this.rowStates.delete(rowId);
        this.rowChanges.delete(rowId);
        this.rowHistory.delete(rowId);
        this.rowSeparatedFields.delete(rowId);
        syncResults.orphanedStates++;
      });

      // console.log('🎯 テーブル更新状態同期完了:', syncResults);
      return syncResults;
    }

    /**
     * 必要に応じて行状態を更新
     */
    _updateRowStateIfNeeded(row, rowId) {
      const currentState = this.rowInitialStates.get(rowId);
      if (!currentState) return;

      // 統合キーの変更チェック
      const currentIntegrationKey = row.getAttribute('data-integration-key') || row.getAttribute('data-record-key');
      if (currentIntegrationKey && currentState.integrationKey !== currentIntegrationKey) {
        // console.log(`🔄 統合キー変更検出: 行番号=${rowId}`);
        currentState.integrationKey = currentIntegrationKey;
        currentState.lastUpdated = new Date().toISOString();
        this.rowInitialStates.set(rowId, currentState);
      }
    }

    /**
     * 🎯 テーブル更新時の診断情報を取得
     * @returns {Object} テーブル更新診断情報
     */
    getTableUpdateDiagnostics() {
      const tbody = document.getElementById('my-tbody');
      if (!tbody) return { error: 'テーブルが見つかりません' };

      const rows = Array.from(tbody.querySelectorAll('tr'));
      const rowsWithId = rows.filter(row => row.getAttribute('data-row-id'));
      
      // 状態の一致度チェック
      let stateMatchCount = 0;
      let stateMismatchCount = 0;
      
      rowsWithId.forEach(row => {
        const rowId = row.getAttribute('data-row-id');
        const integrationKey = row.getAttribute('data-integration-key');
        
        const hasRowState = this.rowInitialStates.has(rowId);
        // 🗑️ 削除: 統合キーベース状態チェック（行番号ベースに移行済み）
        
                  if (hasRowState) {
            stateMatchCount++;
          } else {
            stateMismatchCount++;
          }
      });

      return {
        table: {
          totalRows: rows.length,
          rowsWithId: rowsWithId.length,
          rowIdCoverage: Math.round((rowsWithId.length / rows.length) * 100)
        },
        states: {
          rowBasedStates: this.rowInitialStates.size,
          matchingStates: stateMatchCount,
          mismatchingStates: stateMismatchCount,
          consistency: stateMismatchCount === 0 ? '一致' : '不整合'
        },
        performance: {
          rowStateHitRate: Math.round((stateMatchCount / Math.max(rowsWithId.length, 1)) * 100),
          totalStatesEfficiency: Math.round((this.rowInitialStates.size / rows.length) * 100)
        },
        timestamp: new Date().toISOString()
      };
    }

    /**
     * 🎯 行番号ベーステーブル更新の強制同期
     */
    forceTableStateSync() {
      // console.log('🔧 テーブル状態強制同期開始');
      
      const tbody = document.getElementById('my-tbody');
      if (!tbody) {
        console.error('❌ テーブルが見つかりません');
        return;
      }

      const results = this.syncTableUpdateStates(tbody, 'force');
      
      // console.log('🔧 テーブル状態強制同期完了:', results);
      return results;
    }

    /**
     * 🔄 フィールドが編集可能かどうかを判定
     */
    _shouldMakeEditable(field) {
      // 静的フィールド（行番号、チェックボックス、ID系）は編集不可
      if (field.editableFrom === EDIT_MODES.STATIC ||
          field.isRowNumber ||
          field.isModificationCheckbox ||
          field.isHideButton ||
          field.isRecordId) {
        return false;
      }
      
      // ドロップダウンまたは入力フィールドのみ編集可能にする
      return field.cellType === FIELD_TYPES.DROPDOWN || 
             field.cellType === FIELD_TYPES.TEXT ||
             field.cellType === FIELD_TYPES.INPUT ||
             field.cellType === FIELD_TYPES.LOOKUP_TEXT ||
             field.cellType === FIELD_TYPES.DATE;
    }

    /**
     * 🎯 編集可能セルに変換
     */
    _convertCellsToEditable(row) {
      const cells = row.querySelectorAll("td[data-field-code]");
      const integrationKey = row.getAttribute("data-integration-key");
      const isIntegratedRecord = integrationKey !== "null" && integrationKey;
      
      cells.forEach(cell => {
        const fieldCode = cell.getAttribute("data-field-code");
        const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
        
        if (field && this._shouldMakeEditable(field)) {
          // 現在の値を取得
          let currentValue = "";
          
          // 🔧 新しいSeparateButtonManagerの値抽出メソッドを使用
          currentValue = SeparateButtonManager._extractCellValue(cell);
          
          console.log(`🔄 値復元: ${fieldCode} = "${currentValue}"`);
          
          // セルの軽量属性を削除
          cell.removeAttribute("data-lightweight");
          
          // 🎯 統合レコードで分離ボタン対象フィールドの場合は完全なセルを作成
          const shouldCreateSeparateButton = isIntegratedRecord && field.allowCellDragDrop && currentValue;
          console.log(`🎯 分離ボタン判定: ${fieldCode}, allowDragDrop=${field.allowCellDragDrop}, 値有り=${!!currentValue}, 作成=${shouldCreateSeparateButton}`);
          
          if (shouldCreateSeparateButton) {
            // 🎯 新しいSeparateButtonManagerを使用して分離ボタンを管理
            const recordData = {
              isIntegratedRecord: true,
              integrationKey: integrationKey
            };
            
            // 既存のセル属性を保持
            const originalFieldCode = cell.getAttribute("data-field-code");
            const originalClasses = cell.className;
            
            // 新しいマネージャーを使用して分離ボタンを作成
            SeparateButtonManager.updateButton(cell, field, recordData, currentValue);
            
            // 必要な属性を復元
            cell.setAttribute("data-field-code", originalFieldCode);
            
            // 元のクラスを復元してから編集可能クラスを追加
            cell.className = originalClasses;
            cell.classList.add("cell-editable");
            
            console.log(`🎯 分離ボタン付きセルに変換（SeparateButtonManager使用）: ${fieldCode} ✅`);
          } else {
            // 通常の編集要素を作成
            if (field.cellType === FIELD_TYPES.DROPDOWN) {
              const select = TableElementFactory.createDropdown(field, currentValue);
              this._replaceCellContent(cell, select);
            } else if (field.cellType === FIELD_TYPES.TEXT || 
                       field.cellType === FIELD_TYPES.INPUT ||
                       field.cellType === FIELD_TYPES.LOOKUP_TEXT) {
              const input = TableElementFactory.createInput(field, currentValue);
              this._replaceCellContent(cell, input);
            } else if (field.cellType === FIELD_TYPES.DATE) {
              const dateInput = TableElementFactory.createDateInput(field, currentValue);
              this._replaceCellContent(cell, dateInput);
            }
            
            // 編集可能セルのクラスを追加
            cell.classList.add("cell-editable");
          }
        }
      });
    }

    /**
     * 🎯 編集可能セルをプレーンテキストに戻す
     */
    _convertCellsToLightweight(row) {
      const cells = row.querySelectorAll("td[data-field-code]");
      
      cells.forEach(cell => {
        const fieldCode = cell.getAttribute("data-field-code");
        const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
        
        if (field && this._shouldMakeEditable(field)) {
          // 現在の値を取得
          let currentValue = "";
          const input = cell.querySelector("input");
          const select = cell.querySelector("select");
          
          if (input) {
            currentValue = input.value || "";
          } else if (select) {
            // selectの場合はvalueを取得（次回復元時のため）
            currentValue = select.value || "";
          } else {
            // 🔧 SeparateButtonManagerの値抽出メソッドを使用（分離ボタンアイコン除去）
            currentValue = SeparateButtonManager._extractCellValue(cell);
          }
          
          // 軽量セルに戻す（既存セルの内容のみ変更）
          cell.innerHTML = ""; // 内容をクリア
          cell.textContent = currentValue; // プレーンテキストとして設定
          
          // 編集可能セルのクラスを削除
          cell.classList.remove("cell-editable");
          // 軽量属性を追加
          cell.setAttribute("data-lightweight", "true");
        }
      });
    }

    /**
     * 🔄 セルの内容を置き換える
     */
    _replaceCellContent(cell, newElement) {
      // 既存の内容をクリア
      cell.innerHTML = "";
      
      // 新しい要素を追加
      if (typeof newElement === 'string') {
        cell.textContent = newElement;
      } else {
        cell.appendChild(newElement);
      }
    }

    /**
     * 🎯 ドラッグ&ドロップ機能を有効化
     */
    _enableDragAndDrop(row) {
      // ドラッグ&ドロップが許可されているセルに属性を追加
      const cells = row.querySelectorAll("td[data-field-code]");
      const rowId = row.getAttribute('data-row-id');
      
      console.log(`🔧 行${rowId} ドラッグ&ドロップ有効化開始: ${cells.length}個のセル`);
      
      cells.forEach(cell => {
        const fieldCode = cell.getAttribute("data-field-code");
        const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
        
        if (!field) {
          console.warn(`⚠️ フィールド設定が見つかりません: ${fieldCode}`);
          return;
        }
        
        // 🔧 分離対象フィールドまたはallowCellDragDropがtrueの場合はドラッグ可能にする
        const separationTargetFields = ['座席番号', 'PC番号', '内線番号', 'ユーザーID'];
        const shouldEnableDrag = field.allowCellDragDrop || separationTargetFields.includes(fieldCode);
        
        if (shouldEnableDrag) {
          cell.setAttribute("draggable", "true");
          cell.classList.add("draggable-cell");
          cell.style.cursor = "grab";
          
          // ドラッグイベントリスナーを追加
          this._addDragEventListeners(cell);
          
          console.log(`✅ ドラッグ&ドロップ有効化: ${fieldCode}`);
        } else {
          console.log(`🚫 ドラッグ&ドロップ無効: ${fieldCode} (権限なし)`);
        }
      });
      
      console.log(`✅ 行${rowId} ドラッグ&ドロップ有効化完了`);
    }

    /**
     * 🎯 ドラッグ&ドロップ機能を無効化
     */
    _disableDragAndDrop(row) {
      const cells = row.querySelectorAll("td[data-field-code]");
      
      cells.forEach(cell => {
        cell.removeAttribute("draggable");
        cell.classList.remove("draggable-cell");
        
        // ドラッグイベントリスナーを削除
        this._removeDragEventListeners(cell);
      });
    }

    /**
     * 🔄 ドラッグイベントリスナーを追加
     */
    _addDragEventListeners(cell) {
      // 簡単なドラッグ&ドロップ実装（Phase 4では基本機能のみ）
      cell.addEventListener('dragstart', this._handleDragStart.bind(this));
      cell.addEventListener('dragover', this._handleDragOver.bind(this));
      cell.addEventListener('drop', this._handleDrop.bind(this));
    }

    /**
     * 🔄 ドラッグイベントリスナーを削除
     */
    _removeDragEventListeners(cell) {
      cell.removeEventListener('dragstart', this._handleDragStart.bind(this));
      cell.removeEventListener('dragover', this._handleDragOver.bind(this));
      cell.removeEventListener('drop', this._handleDrop.bind(this));
    }

    /**
     * 🎯 編集機能を追加（分離ボタン、フィルハンドル等）
     */
    _addEditingFeatures(row) {
      // Phase 4では基本的な実装のみ
      // 分離ボタンは既存の機能を利用
      // 必要に応じて後のフェーズで詳細実装
      console.log(`🔧 編集機能追加 (基本実装):`, row.getAttribute('data-row-id'));
    }

    /**
     * 🎯 編集機能を削除
     */
    _removeEditingFeatures(row) {
      // Phase 4では基本的な実装のみ
      console.log(`🔧 編集機能削除 (基本実装):`, row.getAttribute('data-row-id'));
    }

    /**
     * 🎯 ドラッグ開始ハンドラー
     */
    _handleDragStart(event) {
      console.log('🎯 _handleDragStart呼び出し確認: ドラッグ開始イベント受信');
      const cell = event.target.closest('td');
      if (cell) {
        const row = cell.closest('tr');
        console.log(`🔍 ドラッグ開始セル: ${cell.getAttribute('data-field-code')}, 行ID=${row.getAttribute('data-row-id')}, 統合キー=${row.getAttribute('data-integration-key')}`);
        event.dataTransfer.setData('text/plain', cell.textContent);
        event.dataTransfer.effectAllowed = 'move';
        cell.classList.add('dragging');
        console.log('✅ ドラッグ開始完了: draggingクラス追加');
      } else {
        console.warn('⚠️ ドラッグ開始: セルが見つかりません');
      }
    }

    /**
     * 🎯 ドラッグオーバーハンドラー
     */
    _handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }

    /**
     * 🎯 ドロップハンドラー
     */
    _handleDrop(event) {
      event.preventDefault();
      const cell = event.target.closest('td');
      const draggedData = event.dataTransfer.getData('text/plain');
      
      if (cell && draggedData) {
        // 基本的なドロップ処理
        console.log(`🔄 ドロップ処理: ${draggedData} -> ${cell.textContent}`);
        
        // ドラッグ中クラスを削除
        document.querySelectorAll('.dragging').forEach(el => {
          el.classList.remove('dragging');
        });
      }
    }
  }

  // 行変更タイプの列挙
  const RowChangeType = {
    INITIAL: 'initial',     // 初期状態（変更なし）
    MODIFIED: 'modified',   // 変更済み
    ADDED: 'added',         // 新規追加
    SEPARATED: 'separated', // 分離で作成
    DELETED: 'deleted'      // 削除予定
  };

  // =============================================================================
  // 🎮 UI コントローラークラス
  // =============================================================================

  /**
   * 🎮 メインアプリケーションコントローラー
   */
  class LedgerSystemController {
    constructor() {
      this.headerManager = new TableHeaderManager();
      this.dataManager = new window.TableDataManager();
      this.filterManager = new window.FilterManager();
      this.searchEngine = new window.SearchEngine();
      this.integrationManager = new window.DataIntegrationManager();

      // グローバルなCellStateManagerインスタンスを初期化
      window.cellStateManager = new CellStateManager();

      // 🔍 オートフィルタ機能を初期化
      window.autoFilterManager = new AutoFilterManager();

      // ボタンのセットアップのみ実行（ヘッダーに依存しない）
      this._setupButtons();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
      this._setupFilterEvents();
    }

    /**
     * フィルターイベントを設定
     */
    _setupFilterEvents() {
      const filterRow = document.getElementById("my-filter-row");

      if (!filterRow) {
        return;
      }

      // 既にイベントリスナーが設定されているかチェック
      if (window.filterEventsSetup) {
        return;
      }

      const textInputs = filterRow.querySelectorAll('input[type="text"]');
      const selectElements = filterRow.querySelectorAll("select");

      let debounceTimer;
      const debounceDelay = TIMING.DEBOUNCE_DELAY;

      // 検索実行関数
      const executeFilterSearch = async () => {
        try {
          const conditions = this.filterManager.collectConditions();

          // 🚫 条件がnullの場合は複数台帳エラーのため検索を中止
          if (conditions === null) {
            // console.log('🚫 複数台帳検索エラーのため検索を中止');
            return;
          }

          if (!conditions) {
            return;
          }

          const allLedgerData =
            await this.integrationManager.fetchAllLedgerData(conditions);
          const integratedRecords =
            this.integrationManager.integrateData(allLedgerData);

          this.dataManager.displayResults(integratedRecords, "", null, true);
        } catch (error) {}
      };

      // 方法1: Enterキー検索のみ（イベント委譲）
      const setupEnterKeySearch = () => {
        // フィルタ行全体でEnterキーのみ監視
        filterRow.addEventListener(
          "keydown",
          (e) => {
            if (e.target.matches('input[type="text"]') && e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              clearTimeout(debounceTimer);
              executeFilterSearch();
            }
          },
          true
        );
      };

      // 方法2: グローバルEnterキー監視
      const setupGlobalEnterKeyMonitoring = () => {
        const globalKeydownHandler = (e) => {
          // フィルタ行内の要素かチェック
          if (
            e.target.closest("#my-filter-row") &&
            e.target.matches('input[type="text"]') &&
            e.key === "Enter"
          ) {
            e.preventDefault();
            e.stopPropagation();
            clearTimeout(debounceTimer);
            executeFilterSearch();
          }
        };

        document.addEventListener("keydown", globalKeydownHandler, true);

        // クリーンアップ用に保存
        window.globalKeydownHandler = globalKeydownHandler;
      };

      // 方法3: 直接要素Enterキー監視
      const setupDirectEnterKeyMonitoring = () => {
        const monitorElementForEnter = (element) => {
          const fieldName = element.getAttribute("data-field");

          const keydownHandler = (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              clearTimeout(debounceTimer);
              executeFilterSearch();
            }
          };

          // Enterキーのみ監視
          element.addEventListener("keydown", keydownHandler, false);
          element.addEventListener("keydown", keydownHandler, true); // キャプチャも

          // onプロパティでも設定
          const originalOnKeyDown = element.onkeydown;
          element.onkeydown = (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              executeFilterSearch();
            }
            if (originalOnKeyDown) originalOnKeyDown.call(element, e);
          };
        };

        // 既存要素にEnterキー監視を設定
        textInputs.forEach(monitorElementForEnter);

        // MutationObserverで新しい要素もEnterキー監視
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const newInputs = node.querySelectorAll
                  ? node.querySelectorAll('input[type="text"]')
                  : [];
                newInputs.forEach(monitorElementForEnter);
              }
            });
          });
        });

        observer.observe(filterRow, { childList: true, subtree: true });
        window.filterMutationObserver = observer;
      };

      // 方法4: セレクト要素の変更監視（自動検索有効）
      const setupSelectChangeMonitoring = () => {
        // フィルタ行全体でselect変更を監視
        filterRow.addEventListener(
          "change",
          (e) => {
            if (e.target.matches("select")) {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(executeFilterSearch, debounceDelay);
            }
          },
          true
        );
      };

      // 必要な監視のみ実行
      setupEnterKeySearch();
      setupGlobalEnterKeyMonitoring();
      setupDirectEnterKeyMonitoring();
      setupSelectChangeMonitoring();

      // グローバルフラグを設定
      window.filterEventsSetup = true;
    }

    /**
     * ボタンを設定
     */
    _setupButtons() {
      const space = kintone.app.getHeaderMenuSpaceElement();
      if (!space) return;

      // 既存のボタンをチェックして重複を防ぐ
      const existingSearchButton = space.querySelector(
        'button[data-button-type="search"]'
      );
      const existingClearButton = space.querySelector(
        'button[data-button-type="clear"]'
      );
      const existingEditButton = space.querySelector(
        'button[data-button-type="edit-mode"]'
      );

      if (!existingSearchButton) {
        const searchButton = this._createSearchButton();
        space.appendChild(searchButton);
      }

      if (!existingClearButton) {
        const clearButton = this._createClearButton();
        space.appendChild(clearButton);
      }

      // 🎯 パフォーマンス改善: 編集モードボタンを追加
      if (!existingEditButton) {
        const editButton = this._createEditModeButton();
        space.appendChild(editButton);
      }
    }

    /**
     * 検索ボタンを作成
     */
    _createSearchButton() {
      const button = document.createElement("button");
      button.textContent = "検索";
      button.setAttribute("data-button-type", "search"); // 識別用属性を追加
      StyleManager.applyStyles(button, {
        marginRight: "10px",
        padding: "8px 16px",
        fontSize: FONT_SIZES.NORMAL,
      });

      button.addEventListener("click", () => this._handleSearch());
      return button;
    }

    /**
     * クリアボタンを作成
     */
    _createClearButton() {
      const button = document.createElement("button");
      button.textContent = "クリア";
      button.setAttribute("data-button-type", "clear"); // 識別用属性を追加
      StyleManager.applyStyles(button, {
        padding: "8px 16px",
        fontSize: FONT_SIZES.NORMAL,
      });

      button.addEventListener("click", () => this._handleClear());
      return button;
    }

    /**
     * 🎯 編集モードボタンを作成
     */
    _createEditModeButton() {
      const button = document.createElement("button");
      button.textContent = "編集モード";
      button.setAttribute("data-button-type", "edit-mode"); // 識別用属性を追加
      StyleManager.applyStyles(button, {
        marginLeft: "10px",
        padding: "8px 16px",
        fontSize: FONT_SIZES.NORMAL,
        backgroundColor: "#f0f8ff",
        borderColor: "#007acc",
        color: "#007acc"
      });

      button.addEventListener("click", () => this._toggleEditMode());
      return button;
    }

    /**
     * 🎯 編集モード切り替え処理
     */
    _toggleEditMode() {
      if (!window.TableEditMode) {
        console.warn("⚠️ TableEditMode が初期化されていません");
        return;
      }

      const button = document.querySelector('button[data-button-type="edit-mode"]');
      
      if (window.TableEditMode.isLightweightMode()) {
        // 軽量モードから編集モードへ
        this._enableEditMode(button);
      } else {
        // 編集モードから軽量モードへ  
        this._disableEditMode(button);
      }
    }

    /**
     * 🎯 編集モードを有効化
     */
    _enableEditMode(button) {
      try {
        // 1. TableEditModeの状態変更
        window.TableEditMode.enableEditMode();
        
        // 2. ボタンの表示変更
        button.textContent = "表示モード";
        StyleManager.applyStyles(button, {
          backgroundColor: "#fff8e1",
          borderColor: "#ff9800", 
          color: "#ff9800"
        });
        
        // 3. チェックボックス列を表示
        this._showCheckboxColumns();
        
        console.log("🎯 編集モード有効化完了");
        
      } catch (error) {
        console.error("❌ 編集モード有効化エラー:", error);
      }
    }

    /**
     * 🎯 編集モードを無効化
     */
    _disableEditMode(button) {
      try {
        // 1. 編集中の行をすべて軽量モードに戻す（チェックボックス非表示前に実行）
        this._disableAllRowEditing();
        
        // 2. TableEditModeの状態変更
        window.TableEditMode.disableEditMode();
        
        // 3. ボタンの表示変更
        button.textContent = "編集モード";
        StyleManager.applyStyles(button, {
          backgroundColor: "#f0f8ff",
          borderColor: "#007acc",
          color: "#007acc"
        });
        
        // 4. チェックボックス列を非表示
        this._hideCheckboxColumns();
        
        console.log("🎯 軽量モード復帰完了");
        
      } catch (error) {
        console.error("❌ 軽量モード復帰エラー:", error);
      }
    }

    /**
     * 🎯 チェックボックス列を表示
     */
    _showCheckboxColumns() {
      // データ行のチェックボックス・非表示ボタンセルを表示
      const rows = document.querySelectorAll('#my-tbody tr[data-row-id]');
      rows.forEach(row => {
        const rowId = row.getAttribute('data-row-id');
        const checkboxCell = row.querySelector('td[data-field-code="_modification_checkbox"]');
        const hideButtonCell = row.querySelector('td[data-field-code="_hide_button"]');
        
        if (checkboxCell) {
          checkboxCell.style.display = '';
          // 軽量モードのチェックボックスセルにコンテンツを追加
          this._addCheckboxToCell(checkboxCell, row);
          
          // 🎯 以前の編集状態を復元
          // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
          // 自動更新は完全に無効化
          // const wasEditing = window.TableEditMode.isRowEditable(rowId);
          // if (wasEditing) {
          //   const checkbox = checkboxCell.querySelector('input[type="checkbox"]');
          //   if (checkbox) {
          //     checkbox.checked = true;
          //   }
          // }
        }
        if (hideButtonCell) {
          hideButtonCell.style.display = '';
          // 軽量モードの非表示ボタンセルにボタンを追加
          this._addHideButtonToCell(hideButtonCell, row);
        }
      });
    }

    /**
     * 🎯 チェックボックス列を非表示（軽量モード復帰）
     */
    _hideCheckboxColumns() {
      // データ行のチェックボックス・非表示ボタンセルを軽量モード状態に戻す
      const checkboxCells = document.querySelectorAll('td[data-field-code="_modification_checkbox"]');
      const hideButtonCells = document.querySelectorAll('td[data-field-code="_hide_button"]');
      
      checkboxCells.forEach(cell => {
        // display: none ではなく、内容のみクリアして軽量モード状態に戻す
        cell.style.display = ''; // 表示状態を復元
        cell.innerHTML = ''; // コンテンツをクリア
        // 軽量モード用クラスが既に適用されているので、空のセルとして表示される
      });
      
      hideButtonCells.forEach(cell => {
        // display: none ではなく、内容のみクリアして軽量モード状態に戻す
        cell.style.display = ''; // 表示状態を復元
        cell.innerHTML = ''; // コンテンツをクリア
        // 軽量モード用クラスが既に適用されているので、空のセルとして表示される
      });
    }

    /**
     * 🎯 軽量チェックボックスセルにチェックボックスを追加
     */
    _addCheckboxToCell(checkboxCell, row) {
      // 既にチェックボックスがある場合はスキップ
      if (checkboxCell.querySelector('input[type="checkbox"]')) {
        return;
      }

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('modification-checkbox');
      checkbox.addEventListener('change', (e) => this._onRowCheckboxChange(e, row));
      
      checkboxCell.appendChild(checkbox);
    }

    /**
     * 🎯 軽量非表示ボタンセルに非表示ボタンを追加
     */
    _addHideButtonToCell(hideButtonCell, row) {
      // 既にボタンがある場合はスキップ
      if (hideButtonCell.querySelector('button')) {
        return;
      }

      const hideButton = document.createElement("button");
      hideButton.textContent = "👁️‍🗨️";
      hideButton.title = "この行を表示から非表示にします";
      StyleManager.applyButtonClasses(hideButton, 'hide');
      
      hideButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._hideRow(row);
      });
      
      hideButtonCell.appendChild(hideButton);
    }

    /**
     * 🎯 行チェックボックス変更ハンドラー
     */
    _onRowCheckboxChange(event, row) {
      const rowId = row.getAttribute("data-row-id");
      const isChecked = event.target.checked;
      
      if (isChecked) {
        // 編集可能にする
        this._enableRowEditing(row, rowId);
        window.TableEditMode.enableRowEditing(rowId);
        console.log(`🎯 行 ${rowId} の編集を有効化`);
      } else {
        // 編集不可にする
        this._disableRowEditing(row, rowId);
        window.TableEditMode.disableRowEditing(rowId);
        console.log(`🎯 行 ${rowId} の編集を無効化`);
      }
    }

    /**
     * 🎯 行の編集機能を有効化
     */
    _enableRowEditing(row, rowId) {
      try {
        console.log(`🎯 行 ${rowId} の編集機能有効化開始`);
        
        // 1. プレーンテキストセルを編集可能セルに変換
        this._convertCellsToEditable(row);
        
        // 2. ドラッグ&ドロップ属性を追加
        this._enableDragAndDrop(row);
        
        // 3. 分離ボタンやフィルハンドルを追加
        this._addEditingFeatures(row);
        
        // 4. 編集モードのスタイルクラスを追加
        row.classList.add("row-editable");
        
        // 5. アニメーション効果を追加
        row.classList.add("newly-activated");
        setTimeout(() => {
          row.classList.remove("newly-activated");
        }, 500);
        
        console.log(`✅ 行 ${rowId} の編集機能有効化完了`);
        
      } catch (error) {
        console.error(`❌ 行 ${rowId} の編集機能有効化エラー:`, error);
      }
    }

    /**
     * 🎯 行の編集機能を無効化
     */
    _disableRowEditing(row, rowId) {
      try {
        console.log(`🎯 行 ${rowId} の編集機能無効化開始`);
        
        // 1. 編集可能セルをプレーンテキストに戻す
        this._convertCellsToLightweight(row);
        
        // 2. ドラッグ&ドロップ属性を削除
        this._disableDragAndDrop(row);
        
        // 3. 分離ボタンやフィルハンドルを削除
        this._removeEditingFeatures(row);
        
        // 4. 編集モードのスタイルクラスを削除
        row.classList.remove("row-editable");
        
        console.log(`✅ 行 ${rowId} の編集機能無効化完了`);
        
      } catch (error) {
        console.error(`❌ 行 ${rowId} の編集機能無効化エラー:`, error);
      }
    }

    /**
     * 🎯 すべての行の編集を無効化
     */
    _disableAllRowEditing() {
      // 🎯 TableEditModeManagerから編集中の行IDを取得
      const debugInfo = window.TableEditMode.getDebugInfo();
      const editingRowIds = debugInfo.enabledRows;
      
      console.log(`🎯 編集行無効化開始: ${editingRowIds.length}行`);
      
      // 編集中の各行を軽量モードに戻す
      editingRowIds.forEach(rowId => {
        const row = document.querySelector(`#my-tbody tr[data-row-id="${rowId}"]`);
        if (row) {
          // 1. セルをプレーンテキストに戻す
          this._disableRowEditing(row, rowId);
          // 2. TableEditModeManagerから削除
          window.TableEditMode.disableRowEditing(rowId);
          console.log(`✅ 行 ${rowId} の編集を無効化`);
        }
      });
      
      // 🎯 念のため、チェックボックスも確認して処理
      // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
      // 自動更新は完全に無効化
      // const checkboxes = document.querySelectorAll('#my-tbody input[type="checkbox"]');
      // checkboxes.forEach(checkbox => {
      //   if (checkbox.checked) {
      //     checkbox.checked = false;
      //     const row = checkbox.closest('tr');
      //     if (row) {
      //       const rowId = row.getAttribute('data-row-id');
      //       // 上で処理されていない場合のみ実行
      //       if (!editingRowIds.includes(rowId)) {
      //         this._disableRowEditing(row, rowId);
      //         window.TableEditMode.disableRowEditing(rowId);
      //         console.log(`✅ 未処理行 ${rowId} の編集を無効化`);
      //       }
      //     }
      //   }
      // });
      
      console.log(`🎯 編集行無効化完了`);
    }

    /**
     * 🎯 行を非表示にする
     */
    _hideRow(row) {
      row.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
      row.style.opacity = "0";
      row.style.transform = "translateX(-20px)";

      setTimeout(() => {
        row.style.display = "none";
      }, 400);
    }

    /**
     * 検索処理を実行
     */
    async _handleSearch() {
      const loadingDiv = LoadingManager.show("統合データを抽出中...");

      try {
        const conditions = this.filterManager.collectConditions();

        // 🚫 条件がnullの場合は複数台帳エラーのため検索を中止
        if (conditions === null) {
          // console.log('🚫 複数台帳検索エラーのため検索を中止');
          LoadingManager.hide();
          return;
        }

        // 全台帳からデータを取得
        const allLedgerData = await this.integrationManager.fetchAllLedgerData(
          conditions
        );

        // データを統合
        const integratedRecords =
          this.integrationManager.integrateData(allLedgerData);

        // 統合結果を表示
        this.dataManager.displayResults(integratedRecords, "", null, true);
      } catch (error) {
        console.error("統合検索エラー:", error);
        alert("検索中にエラーが発生しました");
      } finally {
        LoadingManager.hide();
      }
    }

    /**
     * クリア処理を実行
     */
    _handleClear() {
      try {
        this.filterManager.clear();
        this.dataManager.clear();
        
        // 🧹 複数台帳エラーメッセージもクリア
        if (this.filterManager._clearErrorMessages) {
          this.filterManager._clearErrorMessages();
        }

        // 🔍 オートフィルタもクリア
        if (window.autoFilterManager) {
          window.autoFilterManager.clearAllFilters();
        }
      } catch (error) {
        console.error("クリアエラー:", error);
        alert("クリア中にエラーが発生しました");
      }
    }

    /**
     * 🔄 フィールドが編集可能かどうかを判定
     */
    _shouldMakeEditable(field) {
      // 静的フィールド（行番号、チェックボックス、ID系）は編集不可
      if (field.editableFrom === EDIT_MODES.STATIC ||
          field.isRowNumber ||
          field.isModificationCheckbox ||
          field.isHideButton ||
          field.isRecordId) {
        return false;
      }
      
      // ドロップダウンまたは入力フィールドのみ編集可能にする
      return field.cellType === FIELD_TYPES.DROPDOWN || 
             field.cellType === FIELD_TYPES.TEXT ||
             field.cellType === FIELD_TYPES.INPUT ||
             field.cellType === FIELD_TYPES.LOOKUP_TEXT ||
             field.cellType === FIELD_TYPES.DATE;
    }

    /**
     * 🎯 プレーンテキストセルを編集可能セルに変換
     */
    _convertCellsToEditable(row) {
      const cells = row.querySelectorAll("td[data-field-code]");
      
      // 🎯 行の統合レコード情報を取得
      const integrationKey = row.getAttribute("data-integration-key");
      const isIntegratedRecord = !!integrationKey;
      
      console.log(`🎯 編集セル変換開始: 行=${row.getAttribute('data-row-id')}, 統合レコード=${isIntegratedRecord}, 統合キー=${integrationKey}`);
      
      cells.forEach(cell => {
        const fieldCode = cell.getAttribute("data-field-code");
        const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
        
        // 🎯 分離ボタン対象フィールドも処理対象に含める
        const shouldProcess = field && (this._shouldMakeEditable(field) || (isIntegratedRecord && field.allowCellDragDrop));
        console.log(`🎯 処理判定: ${fieldCode}, 編集可能=${field ? this._shouldMakeEditable(field) : false}, 分離対象=${field ? field.allowCellDragDrop : false}, 処理=${shouldProcess}`);
        
        if (shouldProcess) {
          // 🔧 軽量セルの現在のテキスト値を取得（SeparateButtonManagerを使用）
          const currentValue = SeparateButtonManager._extractCellValue(cell);
          console.log(`🔄 値復元: ${fieldCode} = "${currentValue}"`);
          
          // セルの軽量属性を削除
          cell.removeAttribute("data-lightweight");
          
          // 🎯 統合レコードで分離ボタン対象フィールドの場合は完全なセルを作成
          const shouldCreateSeparateButton = isIntegratedRecord && field.allowCellDragDrop && currentValue;
          console.log(`🎯 分離ボタン判定: ${fieldCode}, allowDragDrop=${field.allowCellDragDrop}, 値有り=${!!currentValue}, 作成=${shouldCreateSeparateButton}`);
          
          if (shouldCreateSeparateButton) {
            // 統合レコード情報を構築
            const recordData = {
              isIntegratedRecord: true,
              integrationKey: integrationKey
            };
            
            // 既存のセル属性を保持
            const originalFieldCode = cell.getAttribute("data-field-code");
            const originalClasses = cell.className;
            
            // 完全なセルを作成（分離ボタン付き）
            const tempTd = document.createElement("td");
            const newCell = TableElementFactory._createIntegratedCell(tempTd, field, currentValue, recordData);
            
            // 🎯 イベントリスナーを保持するため、DOMノードを直接移動
            cell.innerHTML = "";
            while (newCell.firstChild) {
              cell.appendChild(newCell.firstChild);
            }
            
            // 必要な属性を復元
            cell.setAttribute("data-field-code", originalFieldCode);
            
            // 元のクラスを復元してから編集可能クラスを追加
            cell.className = originalClasses;
            cell.classList.add("cell-editable");
            
            console.log(`🎯 分離ボタン付きセルに変換: ${fieldCode}`);
          } else {
            // 通常の編集要素を作成
            if (field.cellType === FIELD_TYPES.DROPDOWN) {
              const select = TableElementFactory.createDropdown(field, currentValue);
              this._replaceCellContent(cell, select);
            } else if (field.cellType === FIELD_TYPES.TEXT || 
                       field.cellType === FIELD_TYPES.INPUT ||
                       field.cellType === FIELD_TYPES.LOOKUP_TEXT) {
              const input = TableElementFactory.createInput(field, currentValue);
              this._replaceCellContent(cell, input);
            } else if (field.cellType === FIELD_TYPES.DATE) {
              const dateInput = TableElementFactory.createDateInput(field, currentValue);
              this._replaceCellContent(cell, dateInput);
            }
            
            // 編集可能セルのクラスを追加
            cell.classList.add("cell-editable");
          }
        }
      });
    }

    /**
     * 🎯 編集可能セルをプレーンテキストに戻す
     */
    _convertCellsToLightweight(row) {
      const cells = row.querySelectorAll("td[data-field-code]");
      
      cells.forEach(cell => {
        const fieldCode = cell.getAttribute("data-field-code");
        const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
        
        if (field && this._shouldMakeEditable(field)) {
          // 現在の値を取得
          let currentValue = "";
          const input = cell.querySelector("input");
          const select = cell.querySelector("select");
          
          if (input) {
            currentValue = input.value || "";
          } else if (select) {
            // selectの場合はvalueを取得（次回復元時のため）
            currentValue = select.value || "";
          } else {
            // 🔧 SeparateButtonManagerの値抽出メソッドを使用（分離ボタンアイコン除去）
            currentValue = SeparateButtonManager._extractCellValue(cell);
          }
          
          // 軽量セルに戻す（既存セルの内容のみ変更）
          cell.innerHTML = ""; // 内容をクリア
          cell.textContent = currentValue; // プレーンテキストとして設定
          
          // 編集可能セルのクラスを削除
          cell.classList.remove("cell-editable");
          // 軽量属性を追加
          cell.setAttribute("data-lightweight", "true");
        }
      });
    }

    /**
     * 🔄 セルの内容を置き換える
     */
    _replaceCellContent(cell, newElement) {
      // 既存の内容をクリア
      cell.innerHTML = "";
      
      // 新しい要素を追加
      if (typeof newElement === 'string') {
        cell.textContent = newElement;
      } else {
        cell.appendChild(newElement);
      }
    }

    /**
     * 🎯 ドラッグ&ドロップ機能を有効化
     */
    _enableDragAndDrop(row) {
      // ドラッグ&ドロップが許可されているセルに属性を追加
      const cells = row.querySelectorAll("td[data-field-code]");
      const rowId = row.getAttribute('data-row-id');
      
      console.log(`🔧 行${rowId} ドラッグ&ドロップ有効化開始: ${cells.length}個のセル`);
      
      cells.forEach(cell => {
        const fieldCode = cell.getAttribute("data-field-code");
        const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
        
        if (!field) {
          console.warn(`⚠️ フィールド設定が見つかりません: ${fieldCode}`);
          return;
        }
        
        // 🔧 分離対象フィールドまたはallowCellDragDropがtrueの場合はドラッグ可能にする
        const separationTargetFields = ['座席番号', 'PC番号', '内線番号', 'ユーザーID'];
        const shouldEnableDrag = field.allowCellDragDrop || separationTargetFields.includes(fieldCode);
        
        if (shouldEnableDrag) {
          cell.setAttribute("draggable", "true");
          cell.classList.add("draggable-cell");
          cell.style.cursor = "grab";
          
          // ドラッグイベントリスナーを追加
          this._addDragEventListeners(cell);
          
          console.log(`✅ ドラッグ&ドロップ有効化: ${fieldCode}`);
        } else {
          console.log(`🚫 ドラッグ&ドロップ無効: ${fieldCode} (権限なし)`);
        }
      });
      
      console.log(`✅ 行${rowId} ドラッグ&ドロップ有効化完了`);
    }

    /**
     * 🎯 ドラッグ&ドロップ機能を無効化
     */
    _disableDragAndDrop(row) {
      const cells = row.querySelectorAll("td[data-field-code]");
      
      cells.forEach(cell => {
        cell.removeAttribute("draggable");
        cell.classList.remove("draggable-cell");
        
        // ドラッグイベントリスナーを削除
        this._removeDragEventListeners(cell);
      });
    }

    /**
     * 🔄 ドラッグイベントリスナーを追加
     */
    _addDragEventListeners(cell) {
      // 簡単なドラッグ&ドロップ実装（Phase 4では基本機能のみ）
      cell.addEventListener('dragstart', this._handleDragStart.bind(this));
      cell.addEventListener('dragover', this._handleDragOver.bind(this));
      cell.addEventListener('drop', this._handleDrop.bind(this));
    }

    /**
     * 🔄 ドラッグイベントリスナーを削除
     */
    _removeDragEventListeners(cell) {
      cell.removeEventListener('dragstart', this._handleDragStart.bind(this));
      cell.removeEventListener('dragover', this._handleDragOver.bind(this));
      cell.removeEventListener('drop', this._handleDrop.bind(this));
    }

    /**
     * 🎯 編集機能を追加（分離ボタン、フィルハンドル等）
     */
    _addEditingFeatures(row) {
      // Phase 4では基本的な実装のみ
      // 分離ボタンは既存の機能を利用
      // 必要に応じて後のフェーズで詳細実装
      console.log(`🔧 編集機能追加 (基本実装):`, row.getAttribute('data-row-id'));
    }

    /**
     * 🎯 編集機能を削除
     */
    _removeEditingFeatures(row) {
      // Phase 4では基本的な実装のみ
      console.log(`🔧 編集機能削除 (基本実装):`, row.getAttribute('data-row-id'));
    }

    /**
     * 🎯 ドラッグ開始ハンドラー
     */
    _handleDragStart(event) {
      console.log('🎯 _handleDragStart呼び出し確認: ドラッグ開始イベント受信');
      const cell = event.target.closest('td');
      if (cell) {
        const row = cell.closest('tr');
        console.log(`🔍 ドラッグ開始セル: ${cell.getAttribute('data-field-code')}, 行ID=${row.getAttribute('data-row-id')}, 統合キー=${row.getAttribute('data-integration-key')}`);
        event.dataTransfer.setData('text/plain', cell.textContent);
        event.dataTransfer.effectAllowed = 'move';
        cell.classList.add('dragging');
        console.log('✅ ドラッグ開始完了: draggingクラス追加');
      } else {
        console.warn('⚠️ ドラッグ開始: セルが見つかりません');
      }
    }

    /**
     * 🎯 ドラッグオーバーハンドラー
     */
    _handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }

    /**
     * 🎯 ドロップハンドラー
     */
    async _handleDrop(event) {
      console.log('🎯 _handleDrop呼び出し確認: ドロップイベント受信');
      event.preventDefault();
      const targetCell = event.target.closest('td');
      const draggedData = event.dataTransfer.getData('text/plain');
      
      console.log(`🔍 ドロップ詳細: ターゲット=${targetCell ? targetCell.getAttribute('data-field-code') : 'なし'}, データ=${draggedData}`);
      
      // 🔧 ドラッグ中の要素を詳細に検索
      const allDraggingElements = document.querySelectorAll('.dragging');
      console.log(`🔍 .draggingクラス要素数: ${allDraggingElements.length}`);
      
      let sourceCell = null;
      if (allDraggingElements.length > 0) {
        // セル要素のみを検索
        for (const element of allDraggingElements) {
          console.log(`🔍 .dragging要素: ${element.tagName}, data-field-code=${element.getAttribute('data-field-code')}`);
          if (element.tagName === 'TD') {
            sourceCell = element;
            break;
          }
        }
      }
      
      // フォールバック: dataTransferからフィールドコードを取得して直接検索
      if (!sourceCell && draggedData) {
        console.log(`🔧 フォールバック検索: draggedData="${draggedData}"`);
        // ドラッグデータと一致するセルを検索
        const allCells = document.querySelectorAll('td[data-field-code]');
        for (const cell of allCells) {
          const cellValue = this._extractCellValue(cell);
          if (cellValue === draggedData) {
            console.log(`🔍 フォールバック一致: ${cell.getAttribute('data-field-code')} = "${cellValue}"`);
            sourceCell = cell;
            break;
          }
        }
      }
      
      console.log(`🔍 最終ソースセル: ${sourceCell ? sourceCell.getAttribute('data-field-code') : 'なし'}`);
      
      if (targetCell && sourceCell && sourceCell !== targetCell) {
        console.log(`🔄 ドロップ処理開始: ${draggedData} -> ${this._extractCellValue(targetCell)}`);
        
        try {
          // ソースとターゲットのデータを収集
          const sourceData = this._getCellExchangeData(sourceCell);
          const targetData = this._getCellExchangeData(targetCell);
          
          if (sourceData && targetData) {
            // CellExchangeManagerを使用してセル交換を実行
            await CellExchangeManager.execute(sourceData, targetData);
            console.log(`✅ セル交換完了: ${sourceData.fieldCode} ⇔ ${targetData.fieldCode}`);
            
            // 🎯 交換後のハイライト処理を明示的に実行
            this._updateHighlightAfterExchange(sourceData, targetData);
          } else {
            console.warn('⚠️ セル交換データの収集に失敗');
            console.log('ソースデータ:', sourceData);
            console.log('ターゲットデータ:', targetData);
          }
          
        } catch (error) {
          console.error('❌ セル交換エラー:', error);
        }
      } else {
        console.warn('⚠️ ドロップ処理スキップ:', {
          hasTargetCell: !!targetCell,
          hasSourceCell: !!sourceCell,
          areDifferent: sourceCell !== targetCell
        });
      }
      
      // ドラッグ中クラスを削除
      document.querySelectorAll('.dragging').forEach(el => {
        el.classList.remove('dragging');
      });
    }

    /**
     * 🎯 セル交換用データを収集
     */
    _getCellExchangeData(cell) {
      try {
        const row = cell.closest('tr');
        const fieldCode = cell.getAttribute('data-field-code');
        const rowId = row.getAttribute('data-row-id');
        const integrationKey = row.getAttribute('data-integration-key');
        
        if (!fieldCode || !rowId) {
          return null;
        }
        
        // 🔧 分離行（integration-key="null"）を検出
        const isSeparatedRow = integrationKey === 'null' || row.hasAttribute('data-separated');
        
        console.log(`🔍 セル交換データ収集: 行${rowId}, フィールド=${fieldCode}, 分離行=${isSeparatedRow}`);
        
        // CellExchangeManagerが期待するデータ構造に合わせる
        return {
          cell: cell,
          row: row,
          rowId: rowId,
          fieldCode: fieldCode,
          currentValue: this._extractCellValue(cell),
          // sourceAppを推定（ドラッグ&ドロップの場合、統合レコードのアプリを特定）
          sourceApp: this._detectSourceApp(row, fieldCode),
          // 🔧 分離行フラグを追加
          isSeparatedRow: isSeparatedRow,
          integrationKey: integrationKey
        };
        
      } catch (error) {
        console.error('セル交換データ収集エラー:', error);
        return null;
      }
    }

    /**
     * 🎯 ソースアプリを推定
     */
    _detectSourceApp(row, fieldCode) {
      // フィールドコードからアプリタイプを推定
      // PC番号 -> PC, 内線番号 -> EXT, 座席番号 -> SEAT, ユーザーID -> USER
      const fieldAppMap = {
        'PC番号': 'PC',
        'PC_PC番号': 'PC',
        '内線番号': 'EXT', 
        'EXT_内線番号': 'EXT',
        '座席番号': 'SEAT',
        'SEAT_座席番号': 'SEAT',
        'ユーザーID': 'USER',
        'USER_ユーザーID': 'USER'
      };
      
      // フィールドコードから直接マッピング
      if (fieldAppMap[fieldCode]) {
        return fieldAppMap[fieldCode];
      }
      
      // record_idパターンをチェック
      if (fieldCode.endsWith('_record_id')) {
        const appPrefix = fieldCode.replace('_record_id', '').toUpperCase();
        return appPrefix;
      }
      
      // 統合レコードの場合はPCをデフォルトとする（最も一般的）
      return 'PC';
    }

    /**
     * 🎯 セルから値を抽出
     */
    _extractCellValue(cell) {
      // 編集可能セルの場合
      const input = cell.querySelector('input');
      const select = cell.querySelector('select');
      
      if (input) {
        return input.value || '';
      } else if (select) {
        return select.value || '';
      } else {
        // 🔧 分離ボタン付きセル（flex-container）の場合
        const flexValue = cell.querySelector('.flex-value');
        if (flexValue) {
          return flexValue.textContent.trim();
        }
        
        // プレーンテキストセルの場合
        return cell.textContent.trim();
      }
    }

    /**
     * 🎯 交換後のハイライト処理
     */
    _updateHighlightAfterExchange(sourceData, targetData) {
      try {
        if (!window.cellStateManager) {
          console.warn('⚠️ CellStateManagerが利用できません');
          return;
        }
        
        // 両方の行のハイライト状態を完全に再評価
        [sourceData, targetData].forEach(data => {
          try {
            // 初期状態がない場合は現在の状態を保存
            const rowId = data.rowId;
            if (!window.cellStateManager.rowInitialStates.has(rowId)) {
              window.cellStateManager.saveRowInitialState(data.row, 'drag_drop_exchange');
            }
            
            // 🎯 行内の全フィールドを再チェック（個別フィールドだけでなく）
            window.cellStateManager.checkAllFieldsInRow(data.row);
            
            console.log(`🎯 行全体ハイライト再評価: 行${rowId}`);
            
          } catch (error) {
            console.warn(`⚠️ ハイライト更新エラー (行${data.rowId}):`, error);
          }
        });
        
      } catch (error) {
        console.error('❌ 交換後ハイライト処理エラー:', error);
      }
    }

    /**
     * 初期化
     */
    initialize() {
      // まずヘッダーを作成
      this.headerManager.update();

      // ヘッダー作成後にフィルターイベントを設定
      this.setupEventListeners();
    }
  }

  // =============================================================================
  // 🚀 メインエントリーポイント
  // =============================================================================

  /**
   * ✨ アプリケーション起動
   */
  kintone.events.on("app.record.index.show", (event) => {
    if (event.viewName !== "カスタマイズビュー") return;

    const app = new LedgerSystemController();
    app.initialize();

    // 📋 フィルハンドル機能の初期化（kintoneビュー表示時）
    setTimeout(() => {
      if (window.FillHandleManager && !window.fillHandleManager) {
        window.fillHandleManager = new FillHandleManager();
      }
    }, 500);

    // 🧪 分離行セル移動デバッグ機能
    window.debugSeparatedRowCellMovement = function() {
      console.log('🧪 === 分離行セル移動デバッグ開始 ===');
      
      // 1. 全ての行を確認
      const tbody = document.querySelector('#my-tbody');
      if (!tbody) {
        console.log('⚠️ テーブルボディが見つかりません');
        return;
      }
      
      const rows = tbody.querySelectorAll('tr');
      console.log(`📊 総行数: ${rows.length}`);
      
      rows.forEach((row, index) => {
        const rowId = row.getAttribute('data-row-id');
        const integrationKey = row.getAttribute('data-integration-key');
        console.log(`🔍 行 ${index + 1}: ID=${rowId}, 統合キー=${integrationKey}`);
        
        // 分離行セルのドラッグ&ドロップ設定を確認
        const cells = row.querySelectorAll('td[data-field-code]');
        let draggableCells = 0;
        let nondraggableCells = 0;
        
        cells.forEach(cell => {
          const fieldCode = cell.getAttribute('data-field-code');
          const isDraggable = cell.draggable;
          const hasEvents = cell.getAttribute('data-drag-drop-initialized');
          
          if (isDraggable) {
            draggableCells++;
            console.log(`  ✅ ドラッグ可能: ${fieldCode} (イベント初期化: ${hasEvents})`);
          } else {
            nondraggableCells++;
            console.log(`  ❌ ドラッグ不可: ${fieldCode} (イベント初期化: ${hasEvents})`);
          }
          
          // 分離ボタンの確認
          const separateButton = cell.querySelector('.separate-button');
          if (separateButton) {
            console.log(`  🔧 分離ボタン有り: ${fieldCode}`);
          }
        });
        
        console.log(`  📋 ドラッグ可能セル: ${draggableCells}, 不可: ${nondraggableCells}`);
      });
      
      console.log('🧪 === 分離行セル移動デバッグ完了 ===');
    };
    
    // 🧪 セル移動強制実行テスト
    window.debugForceCellMovement = function() {
      console.log('🧪 === セル移動強制実行テスト開始 ===');
      
      const tbody = document.querySelector('#my-tbody');
      if (!tbody) {
        console.log('⚠️ テーブルボディが見つかりません');
        return;
      }
      
      const rows = tbody.querySelectorAll('tr');
      if (rows.length < 2) {
        console.log('⚠️ 2つ以上の行が必要です');
        return;
      }
      
      // 最初の行の座席番号と2番目の行の座席番号を強制交換
      try {
        const sourceRow = rows[0];
        const targetRow = rows[1];
        
        const sourceCell = sourceRow.querySelector('[data-field-code="座席番号"]');
        const targetCell = targetRow.querySelector('[data-field-code="座席番号"]');
        
        if (!sourceCell || !targetCell) {
          console.log('⚠️ 座席番号フィールドが見つかりません');
          return;
        }
        
        console.log('🔄 強制セル移動実行中...');
        console.log(`ソース: ${sourceCell.textContent} (行: ${sourceRow.getAttribute('data-row-id')})`);
        console.log(`ターゲット: ${targetCell.textContent} (行: ${targetRow.getAttribute('data-row-id')})`);
        
        // CellExchangeManagerを使用した強制実行
        if (window.CellExchangeManager) {
          const sourceData = {
            fieldCode: '座席番号',
            sourceApp: 'SEAT',
            value: sourceCell.textContent.trim(),
            rowId: sourceRow.getAttribute('data-row-id'),
            isIntegratedRecord: true,
            cell: sourceCell,
            row: sourceRow
          };
          
          const targetData = {
            fieldCode: '座席番号',
            sourceApp: 'SEAT',
            value: targetCell.textContent.trim(),
            rowId: targetRow.getAttribute('data-row-id'),
            isIntegratedRecord: true,
            cell: targetCell,
            row: targetRow
          };
          
          window.CellExchangeManager.execute(sourceData, targetData);
          console.log('✅ 強制セル移動完了');
        } else {
          console.log('⚠️ CellExchangeManagerが見つかりません');
        }
        
      } catch (error) {
        console.error('❌ 強制セル移動エラー:', error);
      }
      
      console.log('🧪 === セル移動強制実行テスト完了 ===');
    };
    
    // 🧪 フィールド設定確認
    window.debugFieldConfiguration = function() {
      console.log('🧪 === フィールド設定確認 ===');
      
      if (!window.fieldsConfig) {
        console.log('⚠️ fieldsConfigが見つかりません');
        return;
      }
      
      window.fieldsConfig.forEach(field => {
        console.log(`🔍 ${field.fieldCode} (${field.label}):`);
        console.log(`  allowCellMove: ${field.allowCellMove}`);
        console.log(`  allowCellDragDrop: ${field.allowCellDragDrop}`);
        console.log(`  allowDragDrop: ${field.allowDragDrop}`);
        console.log(`  sourceApp: ${field.sourceApp}`);
      });
      
      console.log('🧪 === フィールド設定確認完了 ===');
    };

    // 🧪 ドラッグ&ドロップイベント確認
    window.debugDragDropEvents = function() {
      console.log('🧪 === ドラッグ&ドロップイベント確認 ===');
      
      const tbody = document.querySelector('#my-tbody');
      if (!tbody) {
        console.log('⚠️ テーブルボディが見つかりません');
        return;
      }
      
      const separatedRows = tbody.querySelectorAll('tr[data-integration-key="null"]');
      console.log(`🔍 分離行数: ${separatedRows.length}`);
      
      separatedRows.forEach((row, index) => {
        const rowId = row.getAttribute('data-row-id');
        console.log(`📋 分離行 ${index + 1} (ID: ${rowId}):`);
        
        const targetCells = row.querySelectorAll('[data-field-code="座席番号"], [data-field-code="PC番号"], [data-field-code="内線番号"], [data-field-code="ユーザーID"]');
        
        targetCells.forEach(cell => {
          const fieldCode = cell.getAttribute('data-field-code');
          console.log(`  🔍 ${fieldCode}:`);
          console.log(`    draggable: ${cell.draggable}`);
          console.log(`    data-drag-drop-initialized: ${cell.getAttribute('data-drag-drop-initialized')}`);
          console.log(`    data-exchanged: ${cell.getAttribute('data-exchanged')}`);
          console.log(`    cursor: ${cell.style.cursor}`);
          console.log(`    position: ${cell.style.position}`);
          
          // イベントリスナーの存在を間接的に確認
          const events = [];
          if (cell.ondragstart !== null) events.push('dragstart');
          if (cell.ondragover !== null) events.push('dragover');
          if (cell.ondrop !== null) events.push('drop');
          console.log(`    イベント: ${events.length > 0 ? events.join(', ') : 'なし'}`);
        });
      });
      
      console.log('🧪 === ドラッグ&ドロップイベント確認完了 ===');
    };

    // 🧪 手動ドラッグ&ドロップテスト
    window.debugManualDragDrop = function(sourceFieldCode = '座席番号', targetFieldCode = '座席番号') {
      console.log(`🧪 === 手動ドラッグ&ドロップテスト: ${sourceFieldCode} → ${targetFieldCode} ===`);
      
      const tbody = document.querySelector('#my-tbody');
      if (!tbody) {
        console.log('⚠️ テーブルボディが見つかりません');
        return;
      }
      
      const rows = tbody.querySelectorAll('tr');
      if (rows.length < 2) {
        console.log('⚠️ 2つ以上の行が必要です');
        return;
      }
      
      const sourceCell = rows[0].querySelector(`[data-field-code="${sourceFieldCode}"]`);
      const targetCell = rows[1].querySelector(`[data-field-code="${targetFieldCode}"]`);
      
      if (!sourceCell || !targetCell) {
        console.log(`⚠️ ${sourceFieldCode}または${targetFieldCode}フィールドが見つかりません`);
        return;
      }
      
      console.log('🎬 手動ドラッグ&ドロップイベント発生中...');
      
      // 1. DragStartイベントをシミュレート
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });
      
      dragStartEvent.dataTransfer.setData('text/plain', sourceCell.textContent);
      dragStartEvent.dataTransfer.effectAllowed = 'move';
      sourceCell.classList.add('dragging');
      
      console.log('🔄 dragstartイベント発火');
      sourceCell.dispatchEvent(dragStartEvent);
      
      // 2. DragOverイベントをシミュレート
      setTimeout(() => {
        const dragOverEvent = new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dragStartEvent.dataTransfer
        });
        
        console.log('🔄 dragoverイベント発火');
        targetCell.dispatchEvent(dragOverEvent);
        
        // 3. Dropイベントをシミュレート
        setTimeout(() => {
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dragStartEvent.dataTransfer
          });
          
          console.log('🔄 dropイベント発火');
          targetCell.dispatchEvent(dropEvent);
          
          console.log('✅ 手動ドラッグ&ドロップテスト完了');
        }, 100);
      }, 100);
    };

    console.log('✅ 分離行セル移動デバッグ機能が利用可能になりました');
    console.log('使用方法:');
    console.log('- debugSeparatedRowCellMovement() : 分離行のドラッグ&ドロップ設定を診断');
    console.log('- debugDragDropEvents() : ドラッグ&ドロップイベントの設定状況を確認');
    console.log('- debugManualDragDrop() : 手動でドラッグ&ドロップイベントをシミュレート');
    console.log('- debugForceCellMovement() : セル移動を強制実行テスト'); 
    console.log('- debugFieldConfiguration() : フィールド設定を確認');
  });

  // =============================================================================
  // システム初期化処理（ファイルの最下部）
  // =============================================================================

  // ウィンドウ読み込み完了時にシステムを初期化
      window.addEventListener("load", function () {
        try {
            // CellStateManagerのグローバルインスタンスを作成
            window.cellStateManager = new CellStateManager();
        
            // システムコントローラーの初期化
            const controller = new LedgerSystemController();
            controller.initialize();

                    // ヘッダー管理クラスの初期化
        const headerManager = new TableHeaderManager();
        headerManager.update();

        // 📋 フィルハンドル機能の初期化
        if (window.FillHandleManager && !window.fillHandleManager) {
            window.fillHandleManager = new window.FillHandleManager();
            window.fillHandleManager.initialize();
            // console.log('📋 フィルハンドル機能を初期化しました');
        }

        // 📝 手動入力監視システムの初期化
        if (window.ManualInputMonitor && !window.manualInputMonitor) {
            window.manualInputMonitor = new window.ManualInputMonitor();
            window.manualInputMonitor.initialize();
            // console.log('📝 手動入力監視システムを初期化しました');
        }

        // 🎨 テーブルCSS化の初期化（無効化 - 手動実行のみ）
        // StyleManager.initializeTableCSS();
        } catch (error) {
            console.error("システム初期化中にエラーが発生:", error);
        }
    });

  // 🆕 行変更タイプをグローバルに公開
  window.RowChangeType = RowChangeType;

  // 🎯 テーブル更新時状態管理のグローバル診断機能（CellStateManager版）
  window.debugTableStateManagement = function() {
    console.log('🎯=== テーブル更新時状態管理診断（CellStateManager） ===');
    
    if (!window.cellStateManager) {
      console.log('❌ CellStateManagerが初期化されていません');
      return;
    }

    const diagnostics = window.cellStateManager.getTableUpdateStateDiagnostics();
    if (diagnostics.error) {
      console.log('❌', diagnostics.error);
      return;
    }

    // console.log('📊 テーブル状況:', {
    //   総行数: diagnostics.table.totalRows,
    //   行番号付き行数: diagnostics.table.rowsWithId,
    //   行番号カバー率: diagnostics.table.rowIdCoverage + '%'
    // });

    // console.log('🎯 状態管理:', {
    //   行番号ベース状態数: diagnostics.states.rowBasedStates,
    //   統合キーベース状態数: diagnostics.states.integrationKeyStates,
    //   一致状態数: diagnostics.states.matchingStates,
    //   不一致状態数: diagnostics.states.mismatchingStates,
    //   整合性: diagnostics.states.consistency
    // });

    // console.log('⚡ パフォーマンス:', {
    //   行状態ヒット率: diagnostics.performance.rowStateHitRate + '%',
    //   総状態効率: diagnostics.performance.totalStatesEfficiency + '%'
    // });

    //console.log('🎯=== 診断完了 ===');
    return diagnostics;
  };

  // 🎯 強制状態同期機能
  window.forceTableSync = function() {
    if (!window.cellStateManager) {
      console.log('❌ CellStateManagerが初期化されていません');
      return;
    }

    return window.cellStateManager.forceTableStateSync();
  };

  // =============================================================================
  // 🔍 デバッグ機能のグローバル公開
  // =============================================================================

  /**
   * 行番号ベース初期状態の保存状況を確認（グローバル関数）
   */
  window.debugRowStates = function() {
    if (!window.cellStateManager) {
      console.error('❌ cellStateManager が初期化されていません');
      return null;
    }
    return window.cellStateManager.debugRowInitialStates();
  };

  /**
   * 特定の行番号の初期状態詳細を表示
   * @param {string} rowId - 行番号
   */
  window.debugRow = function(rowId) {
    if (!window.cellStateManager) {
      console.error('❌ cellStateManager が初期化されていません');
      return null;
    }
    return window.cellStateManager.debugRowDetail(rowId);
  };

  /**
   * 現在のテーブル行状況確認（グローバル関数）
   */
  window.debugTable = function() {
    if (!window.cellStateManager) {
      console.error('❌ cellStateManager が初期化されていません');
      return null;
    }
    return window.cellStateManager.debugCurrentTableRows();
  };

  /**
   * 初期状態保存の整合性チェック（グローバル関数）
   */
  window.debugIntegrity = function() {
    if (!window.cellStateManager) {
      console.error('❌ cellStateManager が初期化されていません');
      return null;
    }
    return window.cellStateManager.debugIntegrityCheck();
  };

  /**
   * デバッグ機能のヘルプ表示
   */
  window.debugHelp = function() {
//     console.log(`
// 🔍 ===== 行番号ベース初期状態 デバッグ機能 =====

// 利用可能なコマンド:

// 📊 debugRowStates()     - 全行の初期状態保存状況を確認
// 🔢 debugRow(rowId)      - 特定行番号の詳細確認（例: debugRow('1')）
// 📋 debugTable()         - 現在のテーブル行状況を確認
// ✅ debugIntegrity()     - 初期状態保存の整合性チェック
// ❓ debugHelp()          - このヘルプを表示

// 使用例:
//   debugRowStates()      // 全体の状況確認
//   debugRow('3')         // 行番号3の詳細確認
//   debugIntegrity()      // 整合性チェック

// 🔍 ================================================
//     `);
  };

  // 🔍 グローバル診断関数
  window.debugExchangeTransfer = function() {
    if (window.cellStateManager) {
      const diagnostics = window.cellStateManager.getExchangeTransferDiagnostics();
      //console.log('🔍 セル交換状態転送診断:', diagnostics);
      return diagnostics;
    } else {
      console.warn('⚠️ CellStateManager が見つかりません');
      return null;
    }
  };

  // 🔍 分離処理診断関数
  window.debugSeparationStates = function() {
    if (window.cellStateManager) {
      const diagnostics = window.cellStateManager.getSeparationDiagnostics();
      //console.log('🔍 分離処理状態診断:', diagnostics);
      return diagnostics;
    } else {
      console.warn('⚠️ CellStateManager が見つかりません');
      return null;
    }
  };

  // 🔍 強化版分離ボタン診断関数
  window.debugSeparateButtonsDetailed = function() {
    console.log('🔍 === 強化版分離ボタン診断開始 ===');
    
    const tbody = document.getElementById('my-tbody');
    if (!tbody) {
      console.log('❌ テーブルボディが見つかりません');
      return;
    }
    
    const separateButtons = tbody.querySelectorAll('.separate-button');
    console.log(`📊 発見された分離ボタン数: ${separateButtons.length}`);
    
    separateButtons.forEach((button, index) => {
      const cell = button.closest('td');
      const fieldCode = cell ? cell.getAttribute('data-field-code') : 'unknown';
      const row = button.closest('tr');
      const rowId = row ? row.getAttribute('data-row-id') : 'unknown';
      
      console.log(`🔘 ボタン${index + 1}: フィールド=${fieldCode}, 行=${rowId}`);
      console.log(`   - 要素:`, button);
      console.log(`   - クリック可能:`, !button.disabled);
      console.log(`   - 表示:`, window.getComputedStyle(button).display !== 'none');
      console.log(`   - pointer-events:`, window.getComputedStyle(button).pointerEvents);
      console.log(`   - z-index:`, window.getComputedStyle(button).zIndex);
      console.log(`   - data-debug:`, button.getAttribute('data-debug'));
      console.log(`   - onclick属性:`, button.getAttribute('onclick'));
      console.log(`   - セル構造:`, cell ? cell.innerHTML : 'no cell');
      
      // 強制的にクリックイベントをトリガー
      console.log(`🧪 強制クリックテスト: ${fieldCode}`);
      try {
        button.click();
      } catch (error) {
        console.error(`❌ 強制クリックエラー:`, error);
      }
    });
    
    console.log('🔍 === 強化版分離ボタン診断完了 ===');
    return separateButtons.length;
  };

  // 初期化実行
  setTimeout(() => {
    const controller = new LedgerSystemController();
    controller.initialize();
  }, 100);
})();
