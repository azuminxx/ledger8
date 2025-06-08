/**
 * 🚀 統一データモデル対応コア機能 (Phase 6-3)
 * @description レガシー機能の統一データモデル移行
 * @version 1.0.0
 */

(() => {
  "use strict";

  /**
   * 🔄 統一セル交換管理クラス
   * @description レガシーCellExchangeManagerを統一データモデルで置き換え
   */
  class UnifiedCellExchangeManager {
    /**
     * セル交換処理のメイン実行（統一データモデル版）
     * @param {Object} sourceData - ドラッグ元データ
     * @param {Object} targetData - ドロップ先データ
     * @returns {Promise<boolean>} 処理成功可否
     */
    static async execute(sourceData, targetData) {
      try {
        // 1. 統一データモデルから行データ取得
        const sourceRow = await this._getRowFromDataModel(sourceData.recordKey);
        const targetRow = await this._getRowFromDataModel(targetData.recordKey);

        if (!sourceRow || !targetRow) {
          console.error("❌ 行データの取得に失敗");
          return false;
        }

        // 2. 同一行チェック
        if (sourceRow.getIntegrationKey() === targetRow.getIntegrationKey()) {
          this._showSameRowWarning();
          return false;
        }

        // 3. フィールド交換実行
        const success = await this._performUnifiedExchange(
          sourceRow,
          targetRow,
          sourceData,
          targetData
        );

        if (success) {
          // 4. UI更新通知
          await this._notifyUIUpdate(sourceRow, targetRow);

          // 5. レガシーシステムに同期（互換性維持）
          await this._syncToLegacySystem(sourceRow, targetRow);
        }

        return success;
      } catch (error) {
        console.error("❌ 統一セル交換エラー:", error);
        return false;
      }
    }

    /**
     * 統一データモデルから行データを取得
     * @param {string} recordKey - レコードキー（統合キーまたはレコードID）
     * @returns {Promise<RowDataModel|null>} 行データ
     */
    static async _getRowFromDataModel(recordKey) {
      try {
        // 統合キーでの検索を優先
        let row = dataModelManager.getRowByIntegrationKey(recordKey);

        if (!row) {
          // レコードIDでの検索を試行
          const allRows = dataModelManager.getAllRows();
          row = allRows.find(
            (r) =>
              r.getRecordId("SEAT") === recordKey ||
              r.getRecordId("PC") === recordKey ||
              r.getRecordId("EXT") === recordKey ||
              r.getRecordId("USER") === recordKey
          );
        }

        if (!row) {
          // レガシーシステムからの取得を試行
          row = await this._createRowFromLegacyData(recordKey);
        }

        return row;
      } catch (error) {
        console.error("❌ 行データ取得エラー:", error);
        return null;
      }
    }

    /**
     * レガシーデータから行データを作成
     * @param {string} recordKey - レコードキー
     * @returns {Promise<RowDataModel|null>} 作成された行データ
     */
    static async _createRowFromLegacyData(recordKey) {
      try {
        // レガシーシステムからデータを取得
        if (window.dataAccessLayer && window.dataAccessLayer.enabled) {
          const legacyRecord = await window.dataAccessLayer.getRecord(
            recordKey
          );
          if (legacyRecord) {
            // 統一データモデルに変換
            const row = new RowDataModel();
            // レガシーデータの変換ロジック（legacy-integration.jsと同様）
            if (legacyRecord.ledgerData) {
              for (const [appType, appData] of Object.entries(
                legacyRecord.ledgerData
              )) {
                if (appData && typeof appData === "object") {
                  for (const [fieldCode, fieldData] of Object.entries(
                    appData
                  )) {
                    if (fieldData && fieldData.value !== undefined) {
                      row.setField(appType, fieldCode, fieldData.value);
                    }
                  }
                }
              }
            }

            // レコードIDも設定
            if (legacyRecord.recordIds) {
              for (const [appType, recordId] of Object.entries(
                legacyRecord.recordIds
              )) {
                if (recordId) {
                  row.setRecordId(appType, recordId);
                }
              }
            }

            // データモデル管理システムに保存
            dataModelManager.setRow(row);
            return row;
          }
        }

        return null;
      } catch (error) {
        console.error("❌ レガシーデータ変換エラー:", error);
        return null;
      }
    }

    /**
     * 統一データモデルでのフィールド交換
     * @param {RowDataModel} sourceRow - ソース行
     * @param {RowDataModel} targetRow - ターゲット行
     * @param {Object} sourceData - ソースデータ
     * @param {Object} targetData - ターゲットデータ
     * @returns {Promise<boolean>} 処理成功可否
     */
    static async _performUnifiedExchange(
      sourceRow,
      targetRow,
      sourceData,
      targetData
    ) {
      try {
        // 関連フィールドを特定
        const relatedFields = this._getRelatedFields(sourceData.sourceApp);

        // フィールドごとに値を交換
        let updatedSourceRow = sourceRow;
        let updatedTargetRow = targetRow;

        for (const fieldCode of relatedFields) {
          const sourceField = sourceRow.getField(
            sourceData.sourceApp,
            fieldCode
          );
          const targetField = targetRow.getField(
            sourceData.sourceApp,
            fieldCode
          );

          // 値を交換（Immutableパターンで戻り値を受け取る）
          const sourceValue = sourceField ? sourceField.value : "";
          const targetValue = targetField ? targetField.value : "";

          updatedSourceRow = updatedSourceRow.setField(
            sourceData.sourceApp,
            fieldCode,
            targetValue
          );
          updatedTargetRow = updatedTargetRow.setField(
            sourceData.sourceApp,
            fieldCode,
            sourceValue
          );
        }

        // レコードIDも交換（Immutableパターンで戻り値を受け取る）
        const sourceRecordId = sourceRow.getRecordId(sourceData.sourceApp);
        const targetRecordId = targetRow.getRecordId(sourceData.sourceApp);

        updatedSourceRow = updatedSourceRow.setRecordId(
          sourceData.sourceApp,
          targetRecordId
        );
        updatedTargetRow = updatedTargetRow.setRecordId(
          sourceData.sourceApp,
          sourceRecordId
        );

        // データモデル管理システムに保存
        dataModelManager.setRow(updatedSourceRow);
        dataModelManager.setRow(updatedTargetRow);

        return true;
      } catch (error) {
        console.error("❌ フィールド交換エラー:", error);
        return false;
      }
    }

    /**
     * アプリタイプに関連するフィールドを取得
     * @param {string} appType - アプリタイプ
     * @returns {Array<string>} 関連フィールド配列
     */
    static _getRelatedFields(appType) {
      // fieldsConfigから動的にフィールドマップを生成
      if (!window.fieldsConfig) {
        console.error("❌ fieldsConfigが見つかりません");
        return [];
      }

      const fields = window.fieldsConfig
        .filter((field) => field.sourceApp === appType)
        .map((field) => field.fieldCode);
      return fields;
    }

    /**
     * UI更新通知
     * @param {RowDataModel} sourceRow - ソース行
     * @param {RowDataModel} targetRow - ターゲット行
     */
    static async _notifyUIUpdate(sourceRow, targetRow) {
      try {
        // カスタムイベントを発行してUI更新を通知
        const event = new CustomEvent("unifiedDataModelUpdate", {
          detail: {
            type: "cellExchange",
            sourceKey: sourceRow.getIntegrationKey(),
            targetKey: targetRow.getIntegrationKey(),
            timestamp: new Date().toISOString(),
          },
        });

        document.dispatchEvent(event);
      } catch (error) {
        console.error("❌ UI更新通知エラー:", error);
      }
    }

    /**
     * レガシーシステムへの同期
     * @param {RowDataModel} sourceRow - ソース行
     * @param {RowDataModel} targetRow - ターゲット行
     */
    static async _syncToLegacySystem(sourceRow, targetRow) {
      try {
        if (window.legacyIntegration) {
          // 統一データモデルの変更をレガシーシステムに反映
          await window.legacyIntegration._syncUnifiedToLegacy();
        }
      } catch (error) {
        console.warn("⚠️ レガシーシステム同期エラー（処理は継続）:", error);
      }
    }

    /**
     * 同一行警告表示
     */
    static _showSameRowWarning() {
      const warningMessage = document.createElement("div");
      warningMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ffeb3b;
        color: #333;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: bold;
        animation: fadeInOut 2s ease-in-out;
      `;
      warningMessage.textContent =
        "🔄 統一データモデル: 同じ行内での操作はできません";

      // アニメーション追加
      if (!document.querySelector("style[data-unified-warning-animation]")) {
        const style = document.createElement("style");
        style.setAttribute("data-unified-warning-animation", "");
        style.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(warningMessage);

      setTimeout(() => {
        if (warningMessage.parentElement) {
          warningMessage.remove();
        }
      }, 2000);
    }
  }

  /**
   * 🎯 統一レコードID管理クラス
   * @description レガシーCellStateManagerのレコードID管理を統一データモデルで置き換え
   */
  class UnifiedRecordManager {
    /**
     * レコードIDの統一設定
     * @param {string} integrationKey - 統合キー
     * @param {string} appType - アプリタイプ
     * @param {string} recordId - レコードID
     */
    static setRecordId(integrationKey, appType, recordId) {
      try {
        const row = dataModelManager.getRowByIntegrationKey(integrationKey);
        if (row) {
          // Immutableパターンで戻り値を受け取る
          const updatedRow = row.setRecordId(appType, recordId);
          dataModelManager.setRow(updatedRow);

          // レガシーシステムにも同期
          this._syncToLegacyRecordManager(integrationKey, appType, recordId);
        } else {
          console.warn(`⚠️ 統合キーが見つかりません: ${integrationKey}`);
        }
      } catch (error) {
        console.error("❌ レコードID設定エラー:", error);
      }
    }

    /**
     * レコードIDの統一取得
     * @param {string} integrationKey - 統合キー
     * @param {string} appType - アプリタイプ
     * @returns {string|null} レコードID
     */
    static getRecordId(integrationKey, appType) {
      try {
        const row = dataModelManager.getRowByIntegrationKey(integrationKey);
        if (row) {
          const recordId = row.getRecordId(appType);
          return recordId;
        }
        return null;
      } catch (error) {
        console.error("❌ レコードID取得エラー:", error);
        return null;
      }
    }

    /**
     * 統合キーに関連するすべてのレコードIDを取得
     * @param {string} integrationKey - 統合キー
     * @returns {Object} レコードIDマップ
     */
    static getAllRecordIds(integrationKey) {
      try {
        const row = dataModelManager.getRowByIntegrationKey(integrationKey);
        if (row) {
          const recordIds = {
            SEAT: row.getRecordId("SEAT"),
            PC: row.getRecordId("PC"),
            EXT: row.getRecordId("EXT"),
            USER: row.getRecordId("USER"),
          };
          return recordIds;
        }

        return {};
      } catch (error) {
        console.error("❌ 全レコードID取得エラー:", error);
        return {};
      }
    }

    /**
     * レガシーレコードマネージャーとの同期
     * @param {string} integrationKey - 統合キー
     * @param {string} appType - アプリタイプ
     * @param {string} recordId - レコードID
     */
    static _syncToLegacyRecordManager(integrationKey, appType, recordId) {
      try {
        if (
          window.cellStateManager &&
          typeof window.cellStateManager.setRecordId === "function"
        ) {
          window.cellStateManager.setRecordId(
            integrationKey,
            appType,
            recordId
          );
        }
      } catch (error) {
        console.warn("⚠️ レガシーレコードマネージャー同期エラー:", error);
      }
    }
  }

  /**
   * 🌉 統一分離処理クラス
   * @description レガシーの分離処理を統一データモデルで実装
   */
  class UnifiedSeparationManager {
    /**
     * 統一データモデルでの分離処理
     * @param {string} sourceIntegrationKey - 分離元統合キー
     * @param {Array} targetFields - 分離対象フィールド配列
     * @returns {Promise<boolean>} 処理成功可否
     */
    static async performSeparation(sourceIntegrationKey, targetFields) {
      try {
        // 1. 元データ取得
        const sourceRow =
          dataModelManager.getRowByIntegrationKey(sourceIntegrationKey);
        if (!sourceRow) {
          console.error("❌ 分離元行が見つかりません:", sourceIntegrationKey);
          return false;
        }

        // 2. 新しい行を作成
        let newRow = new RowDataModel();
        let updatedSourceRow = sourceRow;

        // 3. 指定フィールドを新行に移動
        for (const fieldInfo of targetFields) {
          const fieldValue = sourceRow.getField(
            fieldInfo.appType,
            fieldInfo.fieldCode
          );
          if (fieldValue && fieldValue.value) {
            // 新行にフィールドを設定（Immutableパターン）
            newRow = newRow.setField(
              fieldInfo.appType,
              fieldInfo.fieldCode,
              fieldValue.value
            );

            // 元行からフィールドを削除（Immutableパターン）
            updatedSourceRow = updatedSourceRow.removeField(
              fieldInfo.appType,
              fieldInfo.fieldCode
            );
          }
        }

        // 4. レコードIDの処理
        const { updatedSource, updatedNew } =
          await this._handleRecordIdDuringSeparation(
            updatedSourceRow,
            newRow,
            targetFields
          );

        // 5. 新しい行の主キーを確実に設定（バリデーション対策）
        const finalNewRow = this._ensurePrimaryKeyForNewRow(
          updatedNew,
          targetFields
        );

        // 6. 分離されたアプリタイプのAppDataを完全に削除
        let finalSourceRow = updatedSource;
        const separatedAppTypes = [
          ...new Set(targetFields.map((f) => f.appType)),
        ];

        for (const appType of separatedAppTypes) {
          // AppDataを非アクティブにする
          const currentAppData = finalSourceRow.getAppData(appType);
          if (currentAppData.isActive) {
            const emptyAppData = new AppData(appType);
            emptyAppData.isActive = false;
            finalSourceRow = finalSourceRow.setAppData(appType, emptyAppData);
          }
        }

        // 7. データモデル管理システムに保存
        dataModelManager.setRow(finalSourceRow); // 更新された元行（分離されたアプリを削除）
        dataModelManager.setRow(finalNewRow); // 新しい分離行

        // 8. UI更新通知
        await this._notifyUISeparation(finalSourceRow, finalNewRow);

        // 9. レガシーシステムに同期
        await this._syncSeparationToLegacy(finalSourceRow, finalNewRow);

        return true;
      } catch (error) {
        console.error("❌ 統一分離処理エラー:", error);
        return false;
      }
    }

    /**
     * 分離時のレコードID処理
     * @param {RowDataModel} sourceRow - 元行
     * @param {RowDataModel} newRow - 新行
     * @param {Array} targetFields - 分離対象フィールド
     * @returns {Object} 更新された行データ
     */
    static async _handleRecordIdDuringSeparation(
      sourceRow,
      newRow,
      targetFields
    ) {
      // 分離されるアプリタイプを特定
      const separatedAppTypes = [
        ...new Set(targetFields.map((f) => f.appType)),
      ];

      let updatedSourceRow = sourceRow;
      let updatedNewRow = newRow;

      for (const appType of separatedAppTypes) {
        const recordId = sourceRow.getRecordId(appType);
        if (recordId) {
          // 新行にレコードIDを移動（Immutableパターン）
          updatedNewRow = updatedNewRow.setRecordId(appType, recordId);

          // 元行からレコードIDを削除（Immutableパターン）
          updatedSourceRow = updatedSourceRow.setRecordId(appType, null);
        }
      }

      return { updatedSource: updatedSourceRow, updatedNew: updatedNewRow };
    }

    /**
     * 分離のUI更新通知
     * @param {RowDataModel} sourceRow - 元行
     * @param {RowDataModel} newRow - 新行
     */
    static async _notifyUISeparation(sourceRow, newRow) {
      try {
        const event = new CustomEvent("unifiedDataModelUpdate", {
          detail: {
            type: "separation",
            sourceKey: sourceRow.getIntegrationKey(),
            newKey: newRow.getIntegrationKey(),
            timestamp: new Date().toISOString(),
          },
        });

        document.dispatchEvent(event);
      } catch (error) {
        console.error("❌ 分離UI更新通知エラー:", error);
      }
    }

    /**
     * 分離のレガシーシステム同期
     * @param {RowDataModel} sourceRow - 元行
     * @param {RowDataModel} newRow - 新行
     */
    static async _syncSeparationToLegacy(sourceRow, newRow) {
      try {
        if (window.legacyIntegration) {
          await window.legacyIntegration._syncUnifiedToLegacy();
        }
      } catch (error) {
        console.warn("⚠️ 分離レガシーシステム同期エラー:", error);
      }
    }

    /**
     * 新しい分離行の主キーを確実に設定
     * @param {RowDataModel} newRow - 新しい行
     * @param {Array} targetFields - 分離対象フィールド
     * @returns {RowDataModel} 主キーが設定された新しい行
     */
    static _ensurePrimaryKeyForNewRow(newRow, targetFields) {
      // 分離されるアプリタイプごとに主キーが設定されているかチェック
      const separatedAppTypes = [
        ...new Set(targetFields.map((f) => f.appType)),
      ];

      for (const appType of separatedAppTypes) {
        const appData = newRow.getAppData(appType);
        const primaryKeyField = appData.getPrimaryKeyField();

        // 主キーが設定されていない場合は、フィールドから推定して設定
        if (!primaryKeyField.value || primaryKeyField.value.trim() === "") {
          // 主キーフィールドを特定
          const primaryKeyCode = this._getPrimaryKeyCode(appType);
          const primaryKeyValue = newRow.getField(appType, primaryKeyCode);

          if (primaryKeyValue && primaryKeyValue.value) {
            // 既に設定されているので追加処理は不要
          } else {
            console.warn(`⚠️ ${appType}の主キー値が見つかりません`);
          }
        }
      }

      return newRow;
    }

    /**
     * アプリタイプの主キーフィールドコードを取得
     * @param {string} appType - アプリタイプ
     * @returns {string} 主キーフィールドコード
     */
    static _getPrimaryKeyCode(appType) {
      const primaryKeyMap = {
        SEAT: "座席番号",
        PC: "PC番号",
        EXT: "内線番号",
        USER: "ユーザーID",
      };

      return primaryKeyMap[appType] || "";
    }
  }

  /**
   * 📊 統一コア機能統計クラス
   * @description 統一データモデル機能の使用状況統計
   */
  class UnifiedCoreStats {
    static stats = {
      cellExchanges: 0,
      separations: 0,
      recordIdOperations: 0,
      errors: 0,
      startTime: new Date(),
    };

    /**
     * セル交換統計を記録
     */
    static recordCellExchange() {
      this.stats.cellExchanges++;
    }

    /**
     * 分離処理統計を記録
     */
    static recordSeparation() {
      this.stats.separations++;
    }

    /**
     * レコードID操作統計を記録
     */
    static recordRecordIdOperation() {
      this.stats.recordIdOperations++;
    }

    /**
     * エラー統計を記録
     */
    static recordError() {
      this.stats.errors++;
    }

    /**
     * 統計情報を取得
     * @returns {Object} 統計情報
     */
    static getStats() {
      const runtime = new Date() - this.stats.startTime;
      return {
        ...this.stats,
        runtimeMs: runtime,
        runtimeMinutes: Math.round((runtime / 60000) * 100) / 100,
      };
    }
  }

  // グローバルスコープにエクスポート
  window.UnifiedCellExchangeManager = UnifiedCellExchangeManager;
  window.UnifiedRecordManager = UnifiedRecordManager;
  window.UnifiedSeparationManager = UnifiedSeparationManager;
  window.UnifiedCoreStats = UnifiedCoreStats;
})();
