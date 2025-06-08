/**
 * 🏗️ 統一データモデル - Phase 6
 * @description 台帳システムの統一データモデル定義
 * @version 1.0.0
 */

/**
 * 🎯 アプリケーションタイプ定義
 */
const APP_TYPES = {
  SEAT: 'SEAT',
  PC: 'PC', 
  EXT: 'EXT',
  USER: 'USER'
};

/**
 * 🎯 フィールド値クラス
 * @description 各フィールドの値と状態を管理
 */
class FieldValue {
  constructor(value = '', options = {}) {
    this.value = value;
    this.originalValue = options.originalValue || value;
    this.isModified = options.isModified || false;
    this.isSeparated = options.isSeparated || false;
    this.isRequired = options.isRequired || false;
    this.validationRules = options.validationRules || [];
  }

  /**
   * 値を更新
   * @param {string} newValue - 新しい値
   * @returns {FieldValue} 新しいインスタンス（Immutable）
   */
  setValue(newValue) {
    return new FieldValue(newValue, {
      originalValue: this.originalValue,
      isModified: newValue !== this.originalValue,
      isSeparated: this.isSeparated,
      isRequired: this.isRequired,
      validationRules: this.validationRules
    });
  }

  /**
   * 分離状態を設定
   */
  markAsSeparated() {
    return new FieldValue(this.value, {
      originalValue: this.originalValue,
      isModified: this.isModified,
      isSeparated: true,
      isRequired: this.isRequired,
      validationRules: this.validationRules
    });
  }

  /**
   * バリデーション実行
   */
  validate() {
    const errors = [];
    
    if (this.isRequired && (!this.value || this.value.trim() === '')) {
      errors.push('必須フィールドです');
    }
    
    for (const rule of this.validationRules) {
      const result = rule(this.value);
      if (result !== true) {
        errors.push(result);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * JSON シリアライゼーション
   */
  toJSON() {
    return {
      value: this.value,
      originalValue: this.originalValue,
      isModified: this.isModified,
      isSeparated: this.isSeparated,
      isRequired: this.isRequired
    };
  }

  /**
   * JSON からの復元
   */
  static fromJSON(json) {
    return new FieldValue(json.value, {
      originalValue: json.originalValue,
      isModified: json.isModified,
      isSeparated: json.isSeparated,
      isRequired: json.isRequired
    });
  }
}

/**
 * 🎯 アプリデータクラス
 * @description 各アプリ（SEAT/PC/EXT/USER）のデータを管理
 */
class AppData {
  constructor(appType, options = {}) {
    this.appType = appType;
    this.fields = new Map(); // fieldCode -> FieldValue
    this.recordId = options.recordId || null;
    this.isActive = options.isActive !== false; // デフォルトはtrue
    this.metadata = options.metadata || {};
  }

  /**
   * フィールド値を設定
   * @param {string} fieldCode - フィールドコード
   * @param {string|FieldValue} value - 値またはFieldValueインスタンス
   * @returns {AppData} 新しいインスタンス（Immutable）
   */
  setField(fieldCode, value) {
    const newAppData = this._clone();
    
    if (value instanceof FieldValue) {
      newAppData.fields.set(fieldCode, value);
    } else {
      const currentField = this.fields.get(fieldCode) || new FieldValue();
      newAppData.fields.set(fieldCode, currentField.setValue(value));
    }
    
    return newAppData;
  }

  /**
   * フィールド値を取得
   */
  getField(fieldCode) {
    return this.fields.get(fieldCode) || new FieldValue();
  }

  /**
   * フィールドを分離済みにマーク
   */
  markFieldAsSeparated(fieldCode) {
    const newAppData = this._clone();
    const currentField = this.fields.get(fieldCode) || new FieldValue();
    newAppData.fields.set(fieldCode, currentField.markAsSeparated());
    return newAppData;
  }

  /**
   * レコードIDを設定
   */
  setRecordId(recordId) {
    const newAppData = this._clone();
    newAppData.recordId = recordId;
    return newAppData;
  }

  /**
   * アクティブ状態を設定
   */
  setActive(isActive) {
    const newAppData = this._clone();
    newAppData.isActive = isActive;
    return newAppData;
  }

  /**
   * 主キーフィールドを取得
   */
  getPrimaryKeyField() {
    const primaryKeyMappings = {
      [APP_TYPES.SEAT]: '座席番号',
      [APP_TYPES.PC]: 'PC番号',
      [APP_TYPES.EXT]: '内線番号', 
      [APP_TYPES.USER]: 'ユーザーID'
    };
    
    const fieldCode = primaryKeyMappings[this.appType];
    return fieldCode ? this.getField(fieldCode) : new FieldValue();
  }

  /**
   * このアプリが有効なデータを持っているかチェック
   */
  hasValidData() {
    if (!this.isActive) return false;
    
    const primaryKey = this.getPrimaryKeyField();
    return primaryKey.value && primaryKey.value.trim() !== '';
  }

  /**
   * バリデーション実行
   */
  validate() {
    const errors = [];
    
    // 主キーの必須チェック
    if (this.isActive && !this.hasValidData()) {
      errors.push(`${this.appType}の主キーが設定されていません`);
    }
    
    // 各フィールドのバリデーション
    for (const [fieldCode, fieldValue] of this.fields) {
      const validation = fieldValue.validate();
      if (!validation.isValid) {
        errors.push(`${fieldCode}: ${validation.errors.join(', ')}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * クローン作成（内部用）
   */
  _clone() {
    const cloned = new AppData(this.appType, {
      recordId: this.recordId,
      isActive: this.isActive,
      metadata: { ...this.metadata }
    });
    
    // フィールドをコピー
    for (const [key, value] of this.fields) {
      cloned.fields.set(key, value);
    }
    
    return cloned;
  }

  /**
   * JSON シリアライゼーション
   */
  toJSON() {
    const fieldsObj = {};
    for (const [key, value] of this.fields) {
      fieldsObj[key] = value.toJSON();
    }
    
    return {
      appType: this.appType,
      fields: fieldsObj,
      recordId: this.recordId,
      isActive: this.isActive,
      metadata: this.metadata
    };
  }

  /**
   * JSON からの復元
   */
  static fromJSON(json) {
    const appData = new AppData(json.appType, {
      recordId: json.recordId,
      isActive: json.isActive,
      metadata: json.metadata || {}
    });
    
    for (const [fieldCode, fieldJson] of Object.entries(json.fields || {})) {
      appData.fields.set(fieldCode, FieldValue.fromJSON(fieldJson));
    }
    
    return appData;
  }
}

/**
 * 🎯 統合行データモデル（メインクラス）
 * @description 1行分の統合データを管理する中核クラス
 */
class RowDataModel {
  constructor(options = {}) {
    this.id = options.id || this._generateId();
    this.apps = new Map(); // APP_TYPE -> AppData
    this.integrationKey = options.integrationKey || '';
    this.isIntegrated = options.isIntegrated || false;
    this.version = options.version || 1;
    this.createdAt = options.createdAt || new Date();
    this.updatedAt = options.updatedAt || new Date();
    this.metadata = options.metadata || {};
    
    // デフォルトで全アプリタイプのAppDataを作成
    for (const appType of Object.values(APP_TYPES)) {
      this.apps.set(appType, new AppData(appType, { isActive: false }));
    }
  }

  /**
   * アプリデータを設定
   * @param {string} appType - アプリタイプ
   * @param {AppData} appData - アプリデータ
   * @returns {RowDataModel} 新しいインスタンス（Immutable）
   */
  setAppData(appType, appData) {
    const newRow = this._clone();
    newRow.apps.set(appType, appData);
    newRow.updatedAt = new Date();
    newRow.version++;
    
    // 統合キーを再生成
    newRow.integrationKey = newRow._generateIntegrationKey();
    newRow.isIntegrated = newRow._checkIfIntegrated();
    
    return newRow;
  }

  /**
   * アプリデータを取得
   */
  getAppData(appType) {
    return this.apps.get(appType) || new AppData(appType, { isActive: false });
  }

  /**
   * フィールドを設定
   * @param {string} appType - アプリタイプ
   * @param {string} fieldCode - フィールドコード
   * @param {*} value - 値
   * @returns {RowDataModel} 新しいインスタンス（Immutableパターン）
   */
  setField(appType, fieldCode, value) {
    const currentAppData = this.getAppData(appType);
    const newAppData = currentAppData.setField(fieldCode, value).setActive(true);
    return this.setAppData(appType, newAppData);
  }

  /**
   * フィールド値を取得（便利メソッド）
   */
  getField(appType, fieldCode) {
    return this.getAppData(appType).getField(fieldCode);
  }

  /**
   * フィールドを削除
   * @param {string} appType - アプリタイプ  
   * @param {string} fieldCode - フィールドコード
   * @returns {RowDataModel} 新しいインスタンス（Immutableパターン）
   */
  removeField(appType, fieldCode) {
    const currentAppData = this.getAppData(appType);
    const newAppData = currentAppData._clone();
    newAppData.fields.delete(fieldCode);
    
    // アプリデータに有効なフィールドがない場合は非アクティブにする
    if (newAppData.fields.size === 0 && !newAppData.recordId) {
      newAppData.isActive = false;
    }
    
    return this.setAppData(appType, newAppData);
  }

  /**
   * レコードIDを設定
   */
  setRecordId(appType, recordId) {
    const currentAppData = this.getAppData(appType);
    const newAppData = currentAppData.setRecordId(recordId);
    return this.setAppData(appType, newAppData);
  }

  /**
   * レコードIDを取得
   */
  getRecordId(appType) {
    return this.getAppData(appType).recordId;
  }

  /**
   * 統合キーを取得
   * @returns {string} 統合キー
   */
  getIntegrationKey() {
    // 統合キーが空の場合は自動生成
    if (!this.integrationKey || this.integrationKey.trim() === '') {
      this.integrationKey = this._generateIntegrationKey();
    }
    return this.integrationKey;
  }

  /**
   * アクティブなアプリタイプを取得
   */
  getActiveAppTypes() {
    const activeTypes = [];
    for (const [appType, appData] of this.apps) {
      if (appData.isActive && appData.hasValidData()) {
        activeTypes.push(appType);
      }
    }
    return activeTypes;
  }

  /**
   * アプリを分離（新しいRowDataModelを作成）
   */
  separateApp(appType) {
    const sourceApp = this.getAppData(appType);
    if (!sourceApp.isActive || !sourceApp.hasValidData()) {
      throw new Error(`アプリ ${appType} は分離できません（無効または空のデータ）`);
    }

    // 分離元から該当アプリを除去
    const sourceRow = this._clone();
    sourceRow.apps.set(appType, new AppData(appType, { isActive: false }));
    sourceRow.integrationKey = sourceRow._generateIntegrationKey();
    sourceRow.isIntegrated = sourceRow._checkIfIntegrated();
    sourceRow.updatedAt = new Date();
    sourceRow.version++;

    // 分離先の新しい行を作成
    const separatedRow = new RowDataModel({
      isIntegrated: false
    });
    
    // 分離されたフィールドをマーク
    const markedAppData = sourceApp;
    for (const [fieldCode] of sourceApp.fields) {
      markedAppData.fields.set(fieldCode, markedAppData.getField(fieldCode).markAsSeparated());
    }
    
    separatedRow.apps.set(appType, markedAppData);
    separatedRow.integrationKey = separatedRow._generateIntegrationKey();
    separatedRow.isIntegrated = false;

    return {
      sourceRow,
      separatedRow
    };
  }

  /**
   * 他の行とフィールドを交換
   */
  exchangeFields(targetRow, sourceAppType, targetAppType) {
    const sourceAppData = this.getAppData(sourceAppType);
    const targetAppData = targetRow.getAppData(targetAppType);

    // 交換後の行を作成
    const newSourceRow = this.setAppData(targetAppType, targetAppData)
                              .setAppData(sourceAppType, new AppData(sourceAppType, { isActive: false }));
    
    const newTargetRow = targetRow.setAppData(sourceAppType, sourceAppData)
                                  .setAppData(targetAppType, new AppData(targetAppType, { isActive: false }));

    return {
      sourceRow: newSourceRow,
      targetRow: newTargetRow
    };
  }

  /**
   * バリデーション実行
   */
  validate() {
    const errors = [];
    
    // 統合キーの妥当性チェック
    if (!this.integrationKey || this.integrationKey.trim() === '') {
      errors.push('統合キーが設定されていません');
    }
    
    // アクティブなアプリが最低1つは必要
    const activeApps = this.getActiveAppTypes();
    if (activeApps.length === 0) {
      errors.push('有効なアプリデータが1つもありません');
    }
    
    // 各アプリのバリデーション
    for (const [appType, appData] of this.apps) {
      if (appData.isActive) {
        const validation = appData.validate();
        if (!validation.isValid) {
          errors.push(`${appType}: ${validation.errors.join(', ')}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 統合キーを生成（内部用）
   */
  _generateIntegrationKey() {
    const keyParts = [];
    
    const sortedAppTypes = this.getActiveAppTypes().sort();
    for (const appType of sortedAppTypes) {
      const appData = this.getAppData(appType);
      const primaryKey = appData.getPrimaryKeyField();
      if (primaryKey.value && primaryKey.value.trim()) {
        keyParts.push(`${appType}:${primaryKey.value.trim()}`);
      }
    }
    
    return keyParts.length > 0 ? keyParts.join('|') : `EMPTY_${this.id}`;
  }

  /**
   * 統合行かどうかをチェック（内部用）
   */
  _checkIfIntegrated() {
    return this.getActiveAppTypes().length > 1;
  }

  /**
   * ユニークIDを生成（内部用）
   */
  _generateId() {
    return `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * クローン作成（内部用）
   */
  _clone() {
    const cloned = new RowDataModel({
      id: this.id,
      integrationKey: this.integrationKey,
      isIntegrated: this.isIntegrated,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: { ...this.metadata }
    });
    
    // アプリデータをコピー
    for (const [appType, appData] of this.apps) {
      cloned.apps.set(appType, appData);
    }
    
    return cloned;
  }

  /**
   * JSON シリアライゼーション
   */
  toJSON() {
    const appsObj = {};
    for (const [appType, appData] of this.apps) {
      if (appData.isActive) {
        appsObj[appType] = appData.toJSON();
      }
    }
    
    return {
      id: this.id,
      apps: appsObj,
      integrationKey: this.integrationKey,
      isIntegrated: this.isIntegrated,
      version: this.version,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata
    };
  }

  /**
   * JSON からの復元
   */
  static fromJSON(json) {
    const row = new RowDataModel({
      id: json.id,
      integrationKey: json.integrationKey,
      isIntegrated: json.isIntegrated,
      version: json.version,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt),
      metadata: json.metadata || {}
    });
    
    for (const [appType, appJson] of Object.entries(json.apps || {})) {
      row.apps.set(appType, AppData.fromJSON(appJson));
    }
    
    return row;
  }

  /**
   * レガシーフォーマットからの変換
   */
  static fromLegacyRecord(legacyRecord) {
    const row = new RowDataModel();
    
    // 統合キーを設定
    if (legacyRecord.integrationKey) {
      row.integrationKey = legacyRecord.integrationKey;
    }
    
    // レガシーデータを変換
    if (legacyRecord.ledgerData) {
      for (const [appType, appData] of Object.entries(legacyRecord.ledgerData)) {
        if (appData && typeof appData === 'object') {
          for (const [fieldCode, fieldData] of Object.entries(appData)) {
            if (fieldData && fieldData.value !== undefined) {
              row.setField(appType, fieldCode, fieldData.value);
            }
          }
        }
      }
    }
    
    // レコードIDを設定
    if (legacyRecord.recordIds) {
      for (const [appType, recordId] of Object.entries(legacyRecord.recordIds)) {
        if (recordId) {
          row.setRecordId(appType, recordId);
        }
      }
    }
    
    return row;
  }
}

// グローバルスコープに公開
window.FieldValue = FieldValue;
window.AppData = AppData;
window.RowDataModel = RowDataModel;
window.APP_TYPES = APP_TYPES;
