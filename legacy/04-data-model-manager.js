/**
 * 🏗️ データモデル管理層 - Phase 6
 * @description 統一データモデルの管理とレガシーシステムとの橋渡し
 * @version 1.0.0
 */

/**
 * 🎯 データモデル管理クラス
 * @description RowDataModelのライフサイクル管理とバックエンド連携
 */
class DataModelManager {
  constructor() {
    this.rows = new Map(); // id -> RowDataModel
    this.integrationKeyIndex = new Map(); // integrationKey -> id
    this.appTypeIndex = new Map(); // appType -> Set<id>
    this.observers = new Set(); // 変更通知用
    this.version = 1;
  }

  /**
   * 行データを設定・更新
   * @param {RowDataModel} rowData - 行データ
   * @returns {boolean} 成功可否
   */
  setRow(rowData) {
    try {
      // バリデーション
      const validation = rowData.validate();
      if (!validation.isValid) {
        console.warn(`⚠️ 無効な行データ:`, validation.errors);
        // バリデーションエラーでも処理を続行（統合処理の途中段階があるため）
      }

      // 既存の行データを取得
      const oldRow = this.rows.get(rowData.id);

      // 統合キーが変更されているかチェック
      if (oldRow && oldRow.integrationKey !== rowData.integrationKey) {
        // 古い統合キーのインデックスエントリを明示的に削除
        this.integrationKeyIndex.delete(oldRow.integrationKey);
      }

      // インデックスを更新
      this._updateIndexes(rowData, oldRow);

      // 行データを保存
      this.rows.set(rowData.id, rowData);

      // 変更通知
      this._notifyChange("row_updated", { row: rowData, oldRow });
      return true;
    } catch (error) {
      console.error("❌ 行データの設定に失敗:", error);
      return false;
    }
  }

  /**
   * 行データを取得
   * @param {string} id - 行ID
   * @returns {RowDataModel|null}
   */
  getRow(id) {
    return this.rows.get(id) || null;
  }

  /**
   * 統合キーで行データを取得
   * @param {string} integrationKey - 統合キー
   * @returns {RowDataModel|null}
   */
  getRowByIntegrationKey(integrationKey) {
    const id = this.integrationKeyIndex.get(integrationKey);
    return id ? this.getRow(id) : null;
  }

  /**
   * アプリタイプで行データを検索
   * @param {string} appType - アプリタイプ
   * @returns {RowDataModel[]}
   */
  getRowsByAppType(appType) {
    const ids = this.appTypeIndex.get(appType) || new Set();
    return Array.from(ids)
      .map((id) => this.getRow(id))
      .filter((row) => row !== null);
  }

  /**
   * 全行データを取得
   * @returns {RowDataModel[]}
   */
  getAllRows() {
    return Array.from(this.rows.values());
  }

  /**
   * 行データを削除
   * @param {string} id - 行ID
   * @returns {boolean} 成功可否
   */
  removeRow(id) {
    const row = this.rows.get(id);
    if (!row) return false;

    // インデックスから削除
    this._removeFromIndexes(row);

    // 行データを削除
    this.rows.delete(id);

    // 変更通知
    this._notifyChange("row_removed", { row });

    return true;
  }

  /**
   * アプリを分離
   * @param {string} rowId - 分離元行ID
   * @param {string} appType - 分離するアプリタイプ
   * @returns {Object} 分離結果
   */
  separateApp(rowId, appType) {
    const sourceRow = this.getRow(rowId);
    if (!sourceRow) {
      throw new Error(`行が見つかりません: ${rowId}`);
    }

    try {
      const { sourceRow: newSourceRow, separatedRow } =
        sourceRow.separateApp(appType);

      // 分離元を更新
      this.setRow(newSourceRow);

      // 分離先を追加
      this.setRow(separatedRow);

      // 変更通知
      this._notifyChange("app_separated", {
        sourceRow: newSourceRow,
        separatedRow,
        appType,
      });

      return {
        sourceRow: newSourceRow,
        separatedRow,
        success: true,
      };
    } catch (error) {
      console.error("❌ アプリ分離に失敗:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * フィールドを交換
   * @param {string} sourceRowId - 交換元行ID
   * @param {string} targetRowId - 交換先行ID
   * @param {string} sourceAppType - 交換元アプリタイプ
   * @param {string} targetAppType - 交換先アプリタイプ
   * @returns {Object} 交換結果
   */
  exchangeFields(sourceRowId, targetRowId, sourceAppType, targetAppType) {
    const sourceRow = this.getRow(sourceRowId);
    const targetRow = this.getRow(targetRowId);

    if (!sourceRow || !targetRow) {
      throw new Error("交換対象の行が見つかりません");
    }

    try {
      const { sourceRow: newSourceRow, targetRow: newTargetRow } =
        sourceRow.exchangeFields(targetRow, sourceAppType, targetAppType);

      // 両方の行を更新
      this.setRow(newSourceRow);
      this.setRow(newTargetRow);

      // 変更通知
      this._notifyChange("fields_exchanged", {
        sourceRow: newSourceRow,
        targetRow: newTargetRow,
        sourceAppType,
        targetAppType,
      });

      return {
        sourceRow: newSourceRow,
        targetRow: newTargetRow,
        success: true,
      };
    } catch (error) {
      console.error("❌ フィールド交換に失敗:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * レガシー形式からインポート
   * @param {Array} legacyRecords - レガシー形式のレコード配列
   * @returns {Object} インポート結果
   */
  importFromLegacy(legacyRecords) {
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const legacyRecord of legacyRecords) {
      try {
        const rowData = RowDataModel.fromLegacyRecord(legacyRecord);
        if (this.setRow(rowData)) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(
            `バリデーション失敗: ${legacyRecord.integrationKey || "unknown"}`
          );
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`変換失敗: ${error.message}`);
      }
    }
    return results;
  }

  /**
   * レガシー形式にエクスポート
   * @returns {Array} レガシー形式のレコード配列
   */
  exportToLegacy() {
    const legacyRecords = [];

    for (const row of this.getAllRows()) {
      try {
        const legacyRecord = this._convertToLegacyFormat(row);
        legacyRecords.push(legacyRecord);
      } catch (error) {
        console.warn(`⚠️ レガシー変換失敗: ${row.integrationKey}`, error);
      }
    }
    return legacyRecords;
  }

  /**
   * 変更監視を追加
   * @param {Function} observer - 変更時のコールバック
   */
  addObserver(observer) {
    this.observers.add(observer);
  }

  /**
   * 変更監視を削除
   * @param {Function} observer - 削除するコールバック
   */
  removeObserver(observer) {
    this.observers.delete(observer);
  }

  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStatistics() {
    const stats = {
      totalRows: this.rows.size,
      integratedRows: 0,
      singleRows: 0,
      appCounts: {},
      validationErrors: 0,
    };

    // アプリタイプ別初期化
    for (const appType of Object.values(APP_TYPES)) {
      stats.appCounts[appType] = 0;
    }

    // 統計計算
    for (const row of this.getAllRows()) {
      if (row.isIntegrated) {
        stats.integratedRows++;
      } else {
        stats.singleRows++;
      }

      // アプリタイプ別カウント
      for (const appType of row.getActiveAppTypes()) {
        stats.appCounts[appType]++;
      }

      // バリデーションエラーチェック
      const validation = row.validate();
      if (!validation.isValid) {
        stats.validationErrors++;
      }
    }

    return stats;
  }

  /**
   * データ整合性チェック
   * @returns {Object} チェック結果
   */
  validateConsistency() {
    const issues = [];

    // 重複統合キーチェック
    const keyMap = new Map();
    for (const row of this.getAllRows()) {
      const existing = keyMap.get(row.integrationKey);
      if (existing) {
        issues.push({
          type: "duplicate_integration_key",
          key: row.integrationKey,
          rows: [existing, row.id],
        });
      } else {
        keyMap.set(row.integrationKey, row.id);
      }
    }

    // インデックス整合性チェック
    for (const [key, id] of this.integrationKeyIndex) {
      const row = this.getRow(id);
      if (!row || row.integrationKey !== key) {
        issues.push({
          type: "index_mismatch",
          key,
          expectedId: id,
          actualRow: row?.id || null,
        });
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * インデックスを更新（内部用）
   */
  _updateIndexes(newRow, oldRow) {
    // 古いインデックスエントリを削除
    if (oldRow) {
      this._removeFromIndexes(oldRow);
    }

    // 新しいインデックスエントリを追加
    this.integrationKeyIndex.set(newRow.integrationKey, newRow.id);

    for (const appType of newRow.getActiveAppTypes()) {
      if (!this.appTypeIndex.has(appType)) {
        this.appTypeIndex.set(appType, new Set());
      }
      this.appTypeIndex.get(appType).add(newRow.id);
    }
  }

  /**
   * インデックスから削除（内部用）
   */
  _removeFromIndexes(row) {
    this.integrationKeyIndex.delete(row.integrationKey);

    for (const appType of row.getActiveAppTypes()) {
      const typeSet = this.appTypeIndex.get(appType);
      if (typeSet) {
        typeSet.delete(row.id);
        if (typeSet.size === 0) {
          this.appTypeIndex.delete(appType);
        }
      }
    }
  }

  /**
   * 変更通知（内部用）
   */
  _notifyChange(eventType, data) {
    this.version++;

    for (const observer of this.observers) {
      try {
        observer(eventType, data, this.version);
      } catch (error) {
        console.error("❌ Observer通知エラー:", error);
      }
    }
  }

  /**
   * レガシー形式に変換（内部用）
   */
  _convertToLegacyFormat(row) {
    const legacyRecord = {
      integrationKey: row.integrationKey,
      isIntegratedRecord: row.isIntegrated,
      ledgerData: {},
      recordIds: {},
    };

    for (const appType of row.getActiveAppTypes()) {
      const appData = row.getAppData(appType);

      // フィールドデータを変換
      legacyRecord.ledgerData[appType] = {};
      for (const [fieldCode, fieldValue] of appData.fields) {
        legacyRecord.ledgerData[appType][fieldCode] = {
          value: fieldValue.value,
        };
      }

      // レコードID
      if (appData.recordId) {
        legacyRecord.recordIds[appType] = appData.recordId;
      }
    }

    return legacyRecord;
  }

  /**
   * 指定した統合キーで行を削除（削除API）
   */
  deleteRow(integrationKey) {
    const row = this.getRowByIntegrationKey(integrationKey);
    if (row) {
      return this.removeRow(row.id);
    }
    return false;
  }

  /**
   * 全行データを削除（テスト・緊急時用）
   */
  clearAllRows() {
    const allRowIds = Array.from(this.rows.keys());
    let deletedCount = 0;

    for (const rowId of allRowIds) {
      if (this.removeRow(rowId)) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
}

/**
 * 🎯 フィールド定義管理クラス
 * @description アプリケーション別のフィールド定義を管理
 */
class FieldDefinitionManager {
  constructor() {
    this.definitions = new Map(); // appType -> Map<fieldCode, definition>
    this._initializeDefaultDefinitions();
  }

  /**
   * フィールド定義を設定
   */
  setFieldDefinition(appType, fieldCode, definition) {
    if (!this.definitions.has(appType)) {
      this.definitions.set(appType, new Map());
    }

    this.definitions.get(appType).set(fieldCode, {
      label: definition.label || fieldCode,
      type: definition.type || "text",
      required: definition.required || false,
      validationRules: definition.validationRules || [],
      defaultValue: definition.defaultValue || "",
      metadata: definition.metadata || {},
    });
  }

  /**
   * フィールド定義を取得
   */
  getFieldDefinition(appType, fieldCode) {
    const appDefs = this.definitions.get(appType);
    return appDefs?.get(fieldCode) || null;
  }

  /**
   * アプリのすべてのフィールド定義を取得
   */
  getAppFieldDefinitions(appType) {
    return this.definitions.get(appType) || new Map();
  }

  /**
   * デフォルト定義を初期化（内部用）
   */
  _initializeDefaultDefinitions() {
    // SEAT アプリの定義
    this.setFieldDefinition(APP_TYPES.SEAT, "座席番号", {
      label: "座席番号",
      type: "text",
      required: true,
      validationRules: [
        (value) => value.length > 0 || "座席番号は必須です",
        (value) =>
          /^[A-Za-z0-9\-\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(
            value
          ) || "無効な座席番号形式です",
      ],
    });

    // PC アプリの定義
    this.setFieldDefinition(APP_TYPES.PC, "PC番号", {
      label: "PC番号",
      type: "text",
      required: true,
      validationRules: [
        (value) => value.length > 0 || "PC番号は必須です",
        (value) => /^[A-Za-z0-9\-]+$/.test(value) || "無効なPC番号形式です",
      ],
    });

    // EXT アプリの定義
    this.setFieldDefinition(APP_TYPES.EXT, "内線番号", {
      label: "内線番号",
      type: "text",
      required: true,
      validationRules: [
        (value) => value.length > 0 || "内線番号は必須です",
        (value) =>
          /^\d{4,6}$/.test(value) || "内線番号は4-6桁の数字で入力してください",
      ],
    });

    // USER アプリの定義
    this.setFieldDefinition(APP_TYPES.USER, "ユーザーID", {
      label: "ユーザーID",
      type: "text",
      required: true,
      validationRules: [(value) => value.length > 0 || "ユーザーIDは必須です"],
    });
  }
}

// グローバルインスタンス
window.dataModelManager = new DataModelManager();
window.fieldDefinitionManager = new FieldDefinitionManager();

// グローバルスコープに公開
window.DataModelManager = DataModelManager;
window.FieldDefinitionManager = FieldDefinitionManager;
