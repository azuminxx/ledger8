/**
 * 🌉 データアクセス抽象化層 - Phase 6-2
 * @description 既存コードと統一データモデルの橋渡し
 * @version 1.0.0
 */

/**
 * 🎯 データアクセス抽象化クラス
 * @description 既存のAPI呼び出しを統一データモデル対応に透過的に変換
 */
class DataAccessLayer {
  constructor() {
    this.isEnabled = false;
    this.fallbackMode = false;
    this.operationLog = [];
  }

  /**
   * データアクセス層を有効化
   */
  enable() {
    this.isEnabled = true;
    this._interceptExistingFunctions();
  }

  /**
   * データアクセス層を無効化（フォールバック）
   */
  disable() {
    this.isEnabled = false;
    this.fallbackMode = true;
    this._restoreOriginalFunctions();
  }

  /**
   * 既存関数をインターセプト
   */
  _interceptExistingFunctions() {
    // getRecord関数の置き換え
    if (typeof window.getRecord === "function") {
      this._originalGetRecord = window.getRecord;
      window.getRecord = this.getRecord.bind(this);
    }

    // updateRecord関数の置き換え
    if (typeof window.updateRecord === "function") {
      this._originalUpdateRecord = window.updateRecord;
      window.updateRecord = this.updateRecord.bind(this);
    }

    // deleteRecord関数の置き換え
    if (typeof window.deleteRecord === "function") {
      this._originalDeleteRecord = window.deleteRecord;
      window.deleteRecord = this.deleteRecord.bind(this);
    }

    // addRecord関数の置き換え
    if (typeof window.addRecord === "function") {
      this._originalAddRecord = window.addRecord;
      window.addRecord = this.addRecord.bind(this);
    }

    // searchRecords関数の置き換え
    if (typeof window.searchRecords === "function") {
      this._originalSearchRecords = window.searchRecords;
      window.searchRecords = this.searchRecords.bind(this);
    }
  }

  /**
   * 元の関数を復元
   */
  _restoreOriginalFunctions() {
    if (this._originalGetRecord) {
      window.getRecord = this._originalGetRecord;
    }
    if (this._originalUpdateRecord) {
      window.updateRecord = this._originalUpdateRecord;
    }
    if (this._originalDeleteRecord) {
      window.deleteRecord = this._originalDeleteRecord;
    }
    if (this._originalAddRecord) {
      window.addRecord = this._originalAddRecord;
    }
    if (this._originalSearchRecords) {
      window.searchRecords = this._originalSearchRecords;
    }
  }

  /**
   * レコード取得（統一データモデル対応）
   */
  async getRecord(integrationKey, options = {}) {
    this._logOperation("getRecord", { integrationKey, options });

    if (!this.isEnabled) {
      return this._fallbackGetRecord(integrationKey, options);
    }

    try {
      // 統一データモデルから取得 - 正しいAPIを使用
      let rowData = null;

      // 方法1: 統合キーで直接検索（正しいメソッド）
      rowData = dataModelManager.getRowByIntegrationKey(integrationKey);

      // 方法2: getAllRowsから統合キーで検索（フォールバック）
      if (!rowData) {
        const allRows = dataModelManager.getAllRows();
        rowData = allRows.find((row) => row.integrationKey === integrationKey);
      }

      if (rowData) {
        // レガシー形式に変換して返す
        const legacyRecord = this._convertRowDataToLegacy(rowData, options);
        return legacyRecord;
      } else {
        console.warn(`⚠️ レコードが見つかりません: ${integrationKey}`);

        // デバッグ情報を出力
        const allRows = dataModelManager.getAllRows();
        allRows.forEach((row, index) => {
          console.warn(`     ${index + 1}. "${row.integrationKey}"`);
        });

        return null;
      }
    } catch (error) {
      console.error(`❌ レコード取得エラー: ${integrationKey}`, error);

      // フォールバックを試行
      if (options.allowFallback !== false) {
        return this._fallbackGetRecord(integrationKey, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * レコード更新（統一データモデル対応）
   */
  async updateRecord(integrationKey, updateData, options = {}) {
    this._logOperation("updateRecord", { integrationKey, updateData, options });

    if (!this.isEnabled) {
      return this._fallbackUpdateRecord(integrationKey, updateData, options);
    }

    try {
      // 既存レコードを取得
      let rowData = dataModelManager.getRow(integrationKey);

      if (!rowData) {
        console.warn(`⚠️ 更新対象レコードが見つかりません: ${integrationKey}`);
        if (options.createIfNotExists) {
          rowData = new RowDataModel();
        } else {
          throw new Error(`レコードが存在しません: ${integrationKey}`);
        }
      }

      // 更新データを統一データモデルに適用
      rowData = this._applyUpdateToRowData(rowData, updateData);

      // 統一データモデルに保存
      const success = dataModelManager.setRow(rowData);

      if (success) {
        // レガシーシステムにも同期
        if (!options.skipLegacySync) {
          await this._syncToLegacySystems(rowData);
        }

        return this._convertRowDataToLegacy(rowData, options);
      } else {
        throw new Error("統一データモデルへの保存に失敗しました");
      }
    } catch (error) {
      console.error(`❌ レコード更新エラー: ${integrationKey}`, error);

      // フォールバックを試行
      if (options.allowFallback !== false) {
        return this._fallbackUpdateRecord(integrationKey, updateData, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * レコード削除（統一データモデル対応）
   */
  async deleteRecord(integrationKey, options = {}) {
    this._logOperation("deleteRecord", { integrationKey, options });

    if (!this.isEnabled) {
      return this._fallbackDeleteRecord(integrationKey, options);
    }

    try {
      // 統一データモデルから削除
      const success = dataModelManager.removeRow(integrationKey);

      if (success) {
        // レガシーシステムからも削除
        if (!options.skipLegacySync) {
          await this._deleteFromLegacySystems(integrationKey);
        }

        return { success: true, integrationKey };
      } else {
        throw new Error("統一データモデルからの削除に失敗しました");
      }
    } catch (error) {
      console.error(`❌ レコード削除エラー: ${integrationKey}`, error);

      // フォールバックを試行
      if (options.allowFallback !== false) {
        return this._fallbackDeleteRecord(integrationKey, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * レコード追加（統一データモデル対応）
   */
  async addRecord(recordData, options = {}) {
    this._logOperation("addRecord", { recordData, options });

    if (!this.isEnabled) {
      return this._fallbackAddRecord(recordData, options);
    }

    try {
      // レガシー形式から統一データモデルに変換
      let rowData = this._convertLegacyToRowData(recordData);

      // 統一データモデルに保存
      const success = dataModelManager.setRow(rowData);

      if (success) {
        // レガシーシステムにも同期
        if (!options.skipLegacySync) {
          await this._syncToLegacySystems(rowData);
        }

        return this._convertRowDataToLegacy(rowData, options);
      } else {
        throw new Error("統一データモデルへの保存に失敗しました");
      }
    } catch (error) {
      console.error(`❌ レコード追加エラー:`, error);

      // フォールバックを試行
      if (options.allowFallback !== false) {
        return this._fallbackAddRecord(recordData, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * レコード検索（統一データモデル対応）
   */
  async searchRecords(searchConditions, options = {}) {
    this._logOperation("searchRecords", { searchConditions, options });

    if (!this.isEnabled) {
      return this._fallbackSearchRecords(searchConditions, options);
    }

    try {
      // 統一データモデルから検索
      const allRows = dataModelManager.getAllRows();
      const filteredRows = this._filterRows(allRows, searchConditions);

      // レガシー形式に変換
      const legacyRecords = filteredRows.map((row) =>
        this._convertRowDataToLegacy(row, options)
      );

      return {
        records: legacyRecords,
        totalCount: legacyRecords.length,
      };
    } catch (error) {
      console.error(`❌ レコード検索エラー:`, error);

      // フォールバックを試行
      if (options.allowFallback !== false) {
        return this._fallbackSearchRecords(searchConditions, options);
      } else {
        throw error;
      }
    }
  }

  /**
   * RowDataをレガシー形式に変換
   */
  _convertRowDataToLegacy(rowData, options = {}) {
    const activeAppTypes = rowData.getActiveAppTypes();

    if (activeAppTypes.length === 1) {
      // 単一アプリの場合
      const appType = activeAppTypes[0];
      const appData = rowData.getAppData(appType);
      const record = {};

      for (const [fieldCode, fieldValue] of appData.fields) {
        record[fieldCode] = {
          value: fieldValue.value,
          type: fieldValue.type || "SINGLE_LINE_TEXT",
        };
      }

      if (appData.recordId) {
        record.$id = { value: appData.recordId };
      }

      return record;
    } else {
      // 統合レコードの場合
      const integratedRecord = {
        isIntegratedRecord: true,
        integrationKey: rowData.integrationKey,
        ledgerData: {},
        recordIds: {},
      };

      for (const appType of activeAppTypes) {
        const appData = rowData.getAppData(appType);
        integratedRecord.ledgerData[appType] = {};

        for (const [fieldCode, fieldValue] of appData.fields) {
          integratedRecord.ledgerData[appType][fieldCode] = {
            value: fieldValue.value,
            type: fieldValue.type || "SINGLE_LINE_TEXT",
          };
        }

        if (appData.recordId) {
          integratedRecord.recordIds[appType] = appData.recordId;
        }
      }

      return integratedRecord;
    }
  }

  /**
   * レガシー形式をRowDataに変換
   */
  _convertLegacyToRowData(legacyRecord) {
    let rowData = new RowDataModel();

    if (legacyRecord.isIntegratedRecord) {
      // 統合レコードの場合
      for (const [appType, fields] of Object.entries(legacyRecord.ledgerData)) {
        if (APP_TYPES[appType]) {
          for (const [fieldCode, fieldData] of Object.entries(fields)) {
            const value = fieldData.value || fieldData;
            rowData = rowData.setField(appType, fieldCode, value);
          }

          if (legacyRecord.recordIds && legacyRecord.recordIds[appType]) {
            rowData = rowData.setRecordId(
              appType,
              legacyRecord.recordIds[appType]
            );
          }
        }
      }
    } else {
      // 単一レコードの場合
      const appType = this._detectAppTypeFromRecord(legacyRecord);
      if (appType) {
        for (const [fieldCode, fieldData] of Object.entries(legacyRecord)) {
          if (fieldCode !== "$id" && fieldCode !== "$revision") {
            const value = fieldData.value || fieldData;
            rowData = rowData.setField(appType, fieldCode, value);
          }
        }

        if (legacyRecord.$id?.value) {
          rowData = rowData.setRecordId(appType, legacyRecord.$id.value);
        }
      }
    }

    return rowData;
  }

  /**
   * 更新データをRowDataに適用
   */
  _applyUpdateToRowData(rowData, updateData) {
    for (const [fieldCode, value] of Object.entries(updateData)) {
      // フィールドが属するアプリタイプを特定
      const appType = this._detectAppTypeForField(fieldCode, rowData);
      if (appType) {
        rowData = rowData.setField(appType, fieldCode, value);
      }
    }

    return rowData;
  }

  /**
   * レコードからアプリタイプを検出
   */
  _detectAppTypeFromRecord(record) {
    if (record["座席番号"]) return "SEAT";
    if (record["PC番号"]) return "PC";
    if (record["内線番号"]) return "EXT";
    if (record["ユーザーID"]) return "USER";
    return null;
  }

  /**
   * フィールドのアプリタイプを検出
   */
  _detectAppTypeForField(fieldCode, rowData) {
    // fieldsConfigから動的にアプリタイプを取得
    if (window.fieldsConfig) {
      const field = window.fieldsConfig.find((f) => f.fieldCode === fieldCode);
      if (field && field.sourceApp) {
        return field.sourceApp;
      }
    }

    // 既存データから推定（フォールバック）
    for (const appType of rowData.getActiveAppTypes()) {
      const appData = rowData.getAppData(appType);
      if (appData.fields.has(fieldCode)) {
        return appType;
      }
    }

    return null;
  }

  /**
   * 行データのフィルタリング
   */
  _filterRows(rows, conditions) {
    return rows.filter((row) => {
      for (const [field, value] of Object.entries(conditions)) {
        let found = false;

        for (const appType of row.getActiveAppTypes()) {
          const appData = row.getAppData(appType);
          const fieldValue = appData.fields.get(field);

          if (fieldValue && fieldValue.value === value) {
            found = true;
            break;
          }
        }

        if (!found) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * レガシーシステムに同期
   */
  async _syncToLegacySystems(rowData) {
    try {
      // グローバルrecords配列を更新
      if (window.legacyIntegration) {
        window.legacyIntegration.syncToLegacy();
      }

      // CellStateManagerを更新
      if (window.cellStateManager) {
        const state = this._convertRowDataToState(rowData);
        window.cellStateManager.setInitialState(rowData.integrationKey, state);
      }
    } catch (error) {
      console.warn(
        `⚠️ レガシーシステム同期でエラー: ${rowData.integrationKey}`,
        error
      );
    }
  }

  /**
   * レガシーシステムから削除
   */
  async _deleteFromLegacySystems(integrationKey) {
    try {
      // グローバルrecords配列から削除
      if (window.records && Array.isArray(window.records)) {
        window.records = window.records.filter(
          (record) => record.integrationKey !== integrationKey
        );
      }

      // CellStateManagerから削除
      if (window.cellStateManager) {
        window.cellStateManager.removeInitialState(integrationKey);
      }
    } catch (error) {
      console.warn(`⚠️ レガシーシステム削除でエラー: ${integrationKey}`, error);
    }
  }

  /**
   * RowDataを状態形式に変換
   */
  _convertRowDataToState(rowData) {
    const state = {};

    for (const appType of rowData.getActiveAppTypes()) {
      const appData = rowData.getAppData(appType);
      for (const [fieldCode, fieldValue] of appData.fields) {
        state[fieldCode] = fieldValue.value;
      }
    }

    return state;
  }

  /**
   * フォールバック関数群
   */
  _fallbackGetRecord(integrationKey, options) {
    if (this._originalGetRecord) {
      return this._originalGetRecord(integrationKey, options);
    }
    throw new Error("元のgetRecord関数が利用できません");
  }

  _fallbackUpdateRecord(integrationKey, updateData, options) {
    if (this._originalUpdateRecord) {
      return this._originalUpdateRecord(integrationKey, updateData, options);
    }
    throw new Error("元のupdateRecord関数が利用できません");
  }

  _fallbackDeleteRecord(integrationKey, options) {
    if (this._originalDeleteRecord) {
      return this._originalDeleteRecord(integrationKey, options);
    }
    throw new Error("元のdeleteRecord関数が利用できません");
  }

  _fallbackAddRecord(recordData, options) {
    if (this._originalAddRecord) {
      return this._originalAddRecord(recordData, options);
    }
    throw new Error("元のaddRecord関数が利用できません");
  }

  _fallbackSearchRecords(searchConditions, options) {
    if (this._originalSearchRecords) {
      return this._originalSearchRecords(searchConditions, options);
    }
    throw new Error("元のsearchRecords関数が利用できません");
  }

  /**
   * 操作ログ記録
   */
  _logOperation(operation, params) {
    this.operationLog.push({
      timestamp: new Date(),
      operation,
      params: JSON.stringify(params),
      enabled: this.isEnabled,
    });

    // ログサイズ制限
    if (this.operationLog.length > 1000) {
      this.operationLog = this.operationLog.slice(-500);
    }
  }

  /**
   * 統計情報取得
   */
  getStatistics() {
    const stats = {
      isEnabled: this.isEnabled,
      fallbackMode: this.fallbackMode,
      totalOperations: this.operationLog.length,
      operationsByType: {},
    };

    for (const log of this.operationLog) {
      if (!stats.operationsByType[log.operation]) {
        stats.operationsByType[log.operation] = 0;
      }
      stats.operationsByType[log.operation]++;
    }

    return stats;
  }
}

// グローバルインスタンスを作成
window.dataAccessLayer = new DataAccessLayer();
