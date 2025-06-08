//=============================================================================
// 🔍 検索・フィルター専用モジュール（Phase 4-2分離）
// 統合台帳システムの検索・フィルター・データ統合機能を提供
//=============================================================================

(() => {
  "use strict";

  /**
   * 🔄 500件以上のレコードを取得する関数
   * @description kintoneのAPI制限（500件/回）を回避して全レコードを取得
   * @param {number} appId - アプリID
   * @param {string} query - 検索クエリ（limitとoffsetを含まない）
   * @param {string} contextInfo - 呼び出し元の情報（ログ用）
   * @returns {Array} 全レコード配列
   */
  async function fetchAllRecords(appId, query = "", contextInfo = "") {
    const startTime = performance.now();
    const allRecords = [];
    const limit = 500;
    let offset = 0;
    let finished = false;
    let apiCallCount = 0;

    // アプリ名を取得（ログ用）
    const appName = _getAppNameById(appId);
    const logPrefix = `🔍 ${appName}${contextInfo ? ` (${contextInfo})` : ''}`;

    //console.log(`${logPrefix}: API取得開始`);

    while (!finished) {
      // クエリにlimitとoffsetを追加
      const queryWithPagination = query 
        ? `${query} limit ${limit} offset ${offset}`
        : `limit ${limit} offset ${offset}`;

      try {
        apiCallCount++;
        const apiStartTime = performance.now();
        
        const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
          app: appId,
          query: queryWithPagination
        });

        const apiEndTime = performance.now();
        const apiDuration = apiEndTime - apiStartTime;

        allRecords.push(...res.records);

        // 各API呼び出しの詳細ログ
        console.log(`   ${logPrefix}: API呼び出し${apiCallCount}回目 - 取得件数: ${res.records.length}件, 実行時間: ${apiDuration.toFixed(0)}ms`);

        // 取得件数がlimit未満の場合、最後のページに到達
        if (res.records.length < limit) {
          finished = true;
        } else {
          offset += limit;
        }

      } catch (error) {
        console.error(`❌ ${logPrefix}: API呼び出し${apiCallCount}回目でエラー:`, error);
        throw error;
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // 最終サマリーログ
    console.log(`✅ ${logPrefix}: 取得完了 - 総件数: ${allRecords.length}件, API呼び出し回数: ${apiCallCount}回, 総実行時間: ${totalDuration.toFixed(0)}ms`);
    
    return allRecords;
  }

  /**
   * 📋 アプリIDからアプリ名を取得（ログ用）
   * @param {number} appId - アプリID
   * @returns {string} アプリ名
   */
  function _getAppNameById(appId) {
    // APP_IDSの逆引きマップを作成
    const appIdToName = {};
    if (typeof APP_IDS !== 'undefined') {
      Object.entries(APP_IDS).forEach(([name, id]) => {
        appIdToName[id] = name;
      });
    }
    
    return appIdToName[appId] || `App${appId}`;
  }

  /**
   * 🔧 動的バッチサイズ計算（URL長制限対応）
   * @param {Array} keys - 主キー配列
   * @param {string} fieldName - フィールド名
   * @returns {number} 適切なバッチサイズ
   */
  function _calculateOptimalBatchSize(keys, fieldName) {
    if (keys.length === 0) return 100;

    // サンプルキーの平均長を計算（最初の10個をサンプル）
    const sampleKeys = keys.slice(0, Math.min(10, keys.length));
    const avgKeyLength = sampleKeys.reduce((sum, key) => sum + String(key).length, 0) / sampleKeys.length;
    
    // クエリのベース部分の長さを推定: "フィールド名 in ()"
    const baseQueryLength = fieldName.length + 10;
    
    // 1つのキー分のクエリ長: "key",
    const perKeyLength = avgKeyLength + 3; // クォート2個 + カンマ1個
    
    // 安全マージンを含めたURL制限（8192文字の80%を使用）
    const maxQueryLength = 6500;
    
    // 利用可能な長さからバッチサイズを計算
    const availableLength = maxQueryLength - baseQueryLength;
    const maxBatchSize = Math.floor(availableLength / perKeyLength);
    
    // 最小10、最大200で制限
    const batchSize = Math.max(10, Math.min(200, maxBatchSize));
    
    console.log(`📊 バッチサイズ計算: フィールド=${fieldName}, キー平均長=${avgKeyLength.toFixed(1)}, 最適バッチサイズ=${batchSize}`);
    return batchSize;
  }

  /**
   * 🎯 フィルター管理
   * @description 検索フィルターの状態管理と条件収集
   */
  class FilterManager {
    /**
     * フィルターをクリア
     */
    clear(preserveLedgerType = false) {
      const filterInputs = document.querySelectorAll(
        "#my-filter-row input, #my-filter-row select"
      );
      filterInputs.forEach((input) => {
        if (
          preserveLedgerType &&
          input.getAttribute("data-field") === "$ledger_type"
        ) {
          return;
        }
        if (input.tagName.toLowerCase() === "select") {
          input.selectedIndex = 0;
        } else {
          input.value = "";
        }
      });
    }

    /**
     * 検索条件を収集
     */
    collectConditions() {
      const conditions = [];
      const appliedFields = []; // 🆕 検索条件に使用されたフィールドを記録
      const filterInputs = document.querySelectorAll(
        "#my-filter-row input, #my-filter-row select"
      );

      filterInputs.forEach((input) => {
        const fieldCode = input.getAttribute("data-field");
        const value = input.value.trim();

        if (fieldCode && value && fieldCode !== "$ledger_type") {
          const condition = this._buildCondition(fieldCode, value);
          if (condition) {
            conditions.push(condition);
            appliedFields.push(fieldCode); // 🆕 使用されたフィールドを記録
          }
        }
      });

      // 🚦 複数台帳チェック
      const crossLedgerValidation = this._validateCrossLedgerSearch(appliedFields);
      if (!crossLedgerValidation.isValid) {
        // エラーメッセージを表示
        this._showCrossLedgerError(crossLedgerValidation);
        return null; // 🚫 検索を実行させない
      }

      return conditions.length > 0 ? conditions.join(" and ") : "";
    }

    /**
     * 条件を構築（複数値対応・設定ベース）
     */
    _buildCondition(fieldCode, value) {
      // 🆔 特別なフィールド（$id）の処理
      if (fieldCode === "$id") {
        const values = this._parseInputValues(value);
        if (values.length === 1) {
          return `${fieldCode} = ${values[0]}`;
        } else {
          // 複数のレコードIDを OR で結合
          const conditions = values.map(v => `${fieldCode} = ${v}`);
          return `(${conditions.join(' or ')})`;
        }
      }
      
      const fieldConfig = fieldsConfig.find((f) => f.fieldCode === fieldCode);
      
      // フィールド設定が見つからない場合のフォールバック
      if (!fieldConfig) {
        console.warn(`⚠️ フィールド設定が見つかりません: ${fieldCode}`);
        return this._buildMultiValueCondition(fieldCode, value, SEARCH_OPERATORS.LIKE, SEARCH_VALUE_FORMATTERS.PREFIX);
      }

      // 🔎 設定から検索演算子とフォーマッターを取得
      const operator = fieldConfig.searchOperator || SEARCH_OPERATORS.LIKE;
      const formatter = fieldConfig.searchValueFormatter || SEARCH_VALUE_FORMATTERS.PREFIX;
      
      // 📝 複数値対応の条件構築
      return this._buildMultiValueCondition(fieldCode, value, operator, formatter);
    }

    /**
     * 🔀 入力値を解析して複数の値に分割
     * @param {string} input - 入力文字列
     * @returns {Array<string>} - 分割された値の配列
     */
    _parseInputValues(input) {
      if (!input || typeof input !== 'string') {
        return [];
      }

      // 🔍 区切り文字: スペース（半角・全角）、カンマ、改行
      const separators = /[\s\u3000,\n\r]+/;
      
      // 分割して空文字列を除去
      let values = input.split(separators)
        .map(v => v.trim())
        .filter(v => v.length > 0);

      // 📝 特別処理: ""（空文字検索）を検出
      const emptyStringPattern = /^""\s*$/;
      if (emptyStringPattern.test(input.trim())) {
        return [''];  // 空文字として検索
      }

      // ""で囲まれた空文字がある場合の処理
      values = values.map(v => {
        if (v === '""') {
          return '';  // 空文字として扱う
        }
        return v;
      });

      return values;
    }

    /**
     * 🏗️ 複数値対応の検索条件構築
     * @param {string} fieldCode - フィールドコード
     * @param {string} inputValue - 入力値
     * @param {string} operator - 検索演算子
     * @param {string} formatter - 値フォーマッター
     * @returns {string} - 構築された検索条件
     */
    _buildMultiValueCondition(fieldCode, inputValue, operator, formatter) {
      const values = this._parseInputValues(inputValue);
      
      if (values.length === 0) {
        return null;  // 有効な値がない場合
      }

      if (values.length === 1) {
        // 🔁 単一値の場合: 空文字は特別処理
        const value = values[0];
        if (value === '') {
          // 空文字の場合は常に完全一致検索
          return `${fieldCode} = ""`;
        } else {
          // 通常値の場合は従来通り
          const formattedValue = this._formatSearchValue(value, formatter, operator);
          return `${fieldCode} ${operator} ${formattedValue}`;
        }
      }

      // 🔄 複数値の場合
      return this._buildMultiValueQuery(fieldCode, values, operator, formatter);
    }

        /**
     * 🔗 複数値クエリの構築
     * @param {string} fieldCode - フィールドコード
     * @param {Array<string>} values - 値の配列
     * @param {string} operator - 検索演算子
     * @param {string} formatter - 値フォーマッター
     * @returns {string} - 構築されたクエリ
     */
    _buildMultiValueQuery(fieldCode, values, operator, formatter) {
      // 📝 空文字が含まれているかチェック
      const hasEmptyString = values.includes('');
      
      switch (operator) {
        case SEARCH_OPERATORS.IN:
          // IN検索: ("値1","値2","値3")
          const inValues = values.map(v => `"${v}"`).join(',');
          return `${fieldCode} in (${inValues})`;

        case SEARCH_OPERATORS.LIKE:
          // LIKE検索: 空文字は=演算子、それ以外はlike演算子
          const likeConditions = values.map(v => {
            if (v === '') {
              // 空文字の場合は完全一致検索
              return `${fieldCode} = ""`;
            } else {
              const formattedValue = this._formatSearchValue(v, formatter, operator);
              return `${fieldCode} like ${formattedValue}`;
            }
          });
          return `(${likeConditions.join(' or ')})`;

        case SEARCH_OPERATORS.EQUALS:
          // EQUALS検索: (フィールド = "値1" or フィールド = "値2")
          const equalsConditions = values.map(v => {
            const formattedValue = this._formatSearchValue(v, formatter, operator);
            return `${fieldCode} = ${formattedValue}`;
          });
          return `(${equalsConditions.join(' or ')})`;

        default:
          console.warn(`⚠️ 未対応の演算子: ${operator}`);
          // フォールバック: 空文字は=、それ以外はlike
          const fallbackConditions = values.map(v => {
            if (v === '') {
              return `${fieldCode} = ""`;
            } else {
              return `${fieldCode} like "${v}%"`;
            }
          });
          return `(${fallbackConditions.join(' or ')})`;
      }
    }

        /**
     * 🔧 検索値フォーマッター（複数値対応）
     * @param {string} value - 元の値
     * @param {string} formatter - フォーマッター種別
     * @param {string} operator - 検索演算子（参考情報）
     * @returns {string} - フォーマット済みの値
     */
    _formatSearchValue(value, formatter, operator = null) {
      // 📝 空文字の特別処理（既に呼び出し元で処理される場合もあるが、安全のため）
      if (value === '') {
        return '""';  // 空文字検索用
      }

      switch (formatter) {
        case SEARCH_VALUE_FORMATTERS.EXACT:
          return value;  // そのまま（主にレコードID用）
          
        case SEARCH_VALUE_FORMATTERS.PREFIX:
          return `"${value}%"`;  // 前方一致
          
        case SEARCH_VALUE_FORMATTERS.LIST:
          return `("${value}")`;  // IN句用（単一値の場合）
          
        case SEARCH_VALUE_FORMATTERS.QUOTED:
          return `"${value}"`;  // クォート付き
          
        default:
          console.warn(`⚠️ 未知のフォーマッター: ${formatter}, operator: ${operator}`);
          return `"${value}%"`;  // デフォルトは前方一致
      }
    }

      /**
       * 🚦 複数台帳検索の検証
       * @param {Array<string>} appliedFields - 検索条件に使用されたフィールドコード一覧
       * @returns {Object} 検証結果
       */
      _validateCrossLedgerSearch(appliedFields) {
        if (appliedFields.length <= 1) {
          // 検索フィールドが1つ以下の場合は問題なし
          return { isValid: true };
        }

        // 各フィールドの台帳を取得
        const fieldAppMap = new Map();
        const usedApps = new Set();

        appliedFields.forEach(fieldCode => {
          // $idフィールドは特別扱い（全台帳共通）
          if (fieldCode === '$id') {
            return;
          }

          const fieldConfig = fieldsConfig.find(f => f.fieldCode === fieldCode);
          if (fieldConfig && fieldConfig.sourceApp) {
            fieldAppMap.set(fieldCode, fieldConfig.sourceApp);
            usedApps.add(fieldConfig.sourceApp);
          }
        });

        // 複数台帳が検出された場合
        if (usedApps.size > 1) {
          const appFieldGroups = {};
          fieldAppMap.forEach((app, fieldCode) => {
            if (!appFieldGroups[app]) {
              appFieldGroups[app] = [];
            }
            appFieldGroups[app].push(fieldCode);
          });

          return {
            isValid: false,
            errorType: 'CROSS_LEDGER_SEARCH',
            usedApps: Array.from(usedApps),
            fieldAppMap: Object.fromEntries(fieldAppMap),
            appFieldGroups
          };
        }

        return { isValid: true };
      }

             /**
        * 🚨 複数台帳エラーメッセージを表示
        * @param {Object} validation - 検証結果
        */
       _showCrossLedgerError(validation) {
         // 既存のエラーメッセージを削除
         this._clearErrorMessages();

         const errorDiv = document.createElement('div');
         errorDiv.id = 'cross-ledger-error';
         errorDiv.style.cssText = `
           background-color: #ffebee;
           border: 2px solid #f44336;
           border-radius: 4px;
           padding: 12px;
           margin: 8px 0;
           font-size: 12px;
           color: #c62828;
           font-weight: bold;
           position: relative;
         `;

         // 閉じるボタンを作成
         const closeButton = document.createElement('button');
         closeButton.textContent = '×';
         closeButton.style.cssText = `
           position: absolute;
           top: 8px;
           right: 8px;
           background-color: transparent;
           border: none;
           font-size: 16px;
           font-weight: bold;
           color: #c62828;
           cursor: pointer;
           padding: 2px 6px;
           border-radius: 2px;
         `;
         closeButton.title = 'エラーメッセージを閉じる';

         // 閉じるボタンのホバー効果
         closeButton.addEventListener('mouseenter', () => {
           closeButton.style.backgroundColor = '#ffcdd2';
         });
         closeButton.addEventListener('mouseleave', () => {
           closeButton.style.backgroundColor = 'transparent';
         });

         // 閉じるボタンのクリックイベント
         closeButton.addEventListener('click', (e) => {
           e.preventDefault();
           e.stopPropagation();
           this._clearErrorMessages();
         });

         // エラーメッセージの構築
         let errorMessage = '🚫 複数台帳を跨いだ検索はできません\n\n';
         
         // 台帳別のフィールド一覧
         errorMessage += '【検索条件で使用された台帳とフィールド】\n';
         Object.entries(validation.appFieldGroups).forEach(([app, fields]) => {
           const appName = this._getAppDisplayName(app);
           const fieldLabels = fields.map(fieldCode => {
             const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
             return field ? field.label : fieldCode;
           });
           errorMessage += `• ${appName}: ${fieldLabels.join('、')}\n`;
         });

         errorMessage += '\n【解決方法】\n';
         errorMessage += '• 同じ台帳のフィールドのみを使用して検索してください\n';
         errorMessage += '• または、1つのフィールドのみを使用してください';

         errorDiv.textContent = errorMessage;
         errorDiv.style.whiteSpace = 'pre-line';

         // 閉じるボタンを追加
         errorDiv.appendChild(closeButton);

         // エラーメッセージを表示（テーブルの上部）
         const table = document.getElementById('my-table');
         if (table && table.parentNode) {
           table.parentNode.insertBefore(errorDiv, table);
         }

         // 🗑️ 自動削除は削除（手動削除のみ）
       }

      /**
       * 🧹 エラーメッセージをクリア
       */
      _clearErrorMessages() {
        const existingError = document.getElementById('cross-ledger-error');
        if (existingError) {
          existingError.remove();
        }
      }

      /**
       * 🏷️ アプリタイプの表示名を取得
       * @param {string} appType - アプリタイプ
       * @returns {string} 表示名
       */
      _getAppDisplayName(appType) {
        const displayNames = {
          'SEAT': '座席台帳',
          'PC': 'PC台帳',
          'EXT': '内線台帳',
          'USER': 'ユーザー台帳'
        };
        return displayNames[appType] || appType;
      }

      /**
       * 🧪 複数値検索のテスト・デバッグ用メソッド
       * @param {string} fieldCode - フィールドコード
       * @param {string} inputValue - 入力値
       * @returns {Object} - デバッグ情報
       */
      _debugMultiValueSearch(fieldCode, inputValue) {
        const fieldConfig = fieldsConfig.find((f) => f.fieldCode === fieldCode);
        const operator = fieldConfig?.searchOperator || SEARCH_OPERATORS.LIKE;
        const formatter = fieldConfig?.searchValueFormatter || SEARCH_VALUE_FORMATTERS.PREFIX;
        
        const parsedValues = this._parseInputValues(inputValue);
        const condition = this._buildCondition(fieldCode, inputValue);
        
        return {
          fieldCode,
          inputValue,
          parsedValues,
          operator,
          formatter,
          condition,
          timestamp: new Date().toISOString()
        };
      }
    }

  /**
   * 🔎 検索エンジン
   * @description 各台帳への検索実行と結果統合
   */
  class SearchEngine {
    constructor() {
      this.isSearching = false;
      this.appIds = {
        座席台帳: APP_IDS.SEAT,
        PC台帳: APP_IDS.PC,
        内線台帳: APP_IDS.EXT,
        ユーザー台帳: APP_IDS.USER,
      };
    }

    /**
     * 検索を実行
     */
    async execute(conditions, selectedLedger) {
      if (this.isSearching) return [];
      this.isSearching = true;

      try {
        if (!selectedLedger) {
          return await this._searchAllLedgers(conditions);
        } else {
          return await this._searchSpecificLedger(conditions, selectedLedger);
        }
      } finally {
        this.isSearching = false;
      }
    }

    /**
     * 全台帳検索
     */
    async _searchAllLedgers(conditions) {
      const startTime = performance.now();
      const allResults = [];
      let totalApiCalls = 0;

      console.log(`🔍📊 全台帳検索開始: 対象台帳数=${Object.keys(this.appIds).length}`);

      for (const [ledgerType, appId] of Object.entries(this.appIds)) {
        try {
          // 🔄 fetchAllRecords関数を使用して500件以上のレコードを取得
          const records = await fetchAllRecords(appId, conditions, `全台帳検索-${ledgerType}`);

          records.forEach((record) => {
            allResults.push({
              ...record,
              $ledger_type: { value: ledgerType },
            });
          });
        } catch (error) {
          console.error(`❌ ${ledgerType}台帳の検索中にエラー:`, error);
        }
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      console.log(`✅📊 全台帳検索完了: 総取得件数=${allResults.length}件, 総実行時間=${totalDuration.toFixed(0)}ms`);
      return allResults;
    }

    /**
     * 特定台帳検索
     */
    async _searchSpecificLedger(conditions, selectedLedger) {
      const targetAppId = this.appIds[selectedLedger];
      if (!targetAppId) return [];

      console.log(`🔍📊 特定台帳検索開始: ${selectedLedger}台帳`);

      // 🔄 fetchAllRecords関数を使用して500件以上のレコードを取得
      const records = await fetchAllRecords(targetAppId, conditions, `特定台帳検索-${selectedLedger}`);

      console.log(`✅📊 特定台帳検索完了: ${selectedLedger}台帳, 取得件数=${records.length}件`);
      return records;
    }
  }

  /**
   * 🔗 データ統合管理
   * @description 4つの台帳データを統合キーで統合
   */
  class DataIntegrationManager {
    constructor() {
      this.appIds = {
        SEAT: APP_IDS.SEAT,
        PC: APP_IDS.PC,
        EXT: APP_IDS.EXT,
        USER: APP_IDS.USER,
      };
    }

    /**
     * 4つの台帳データを統合キーで統合
     * @param {Object} allLedgerData - 全台帳のデータ
     * @returns {Array} 統合レコード配列
     */
    integrateData(allLedgerData) {
      const integrationMap = new Map();

      // 各台帳のデータを統合キーでグループ化
      Object.keys(allLedgerData).forEach((appType) => {
        const records = allLedgerData[appType] || [];

        records.forEach((record) => {
          const integrationKey = this._extractIntegrationKey(record);
          if (!integrationKey) {
            return;
          }

          if (!integrationMap.has(integrationKey)) {
            integrationMap.set(integrationKey, {
              integrationKey: integrationKey,
              ledgerData: {},
              recordIds: {},
              isIntegratedRecord: true,
            });
          }

          const integratedRecord = integrationMap.get(integrationKey);
          integratedRecord.ledgerData[appType] = record;
          integratedRecord.recordIds[appType] = record.$id.value;
        });
      });

      const integratedRecords = Array.from(integrationMap.values());

      integrationMap.forEach((record, key) => {
        const appTypes = Object.keys(record.ledgerData);
        const recordIdInfo = Object.keys(record.recordIds)
          .map((app) => `${app}:${record.recordIds[app]}`)
          .join(", ");

        // 🔧 各台帳のフィールド詳細
        Object.entries(record.ledgerData).forEach(([appType, appData]) => {
          const fieldCount = Object.keys(appData).length;
          const fieldList = Object.keys(appData).join(", ");
        });
      });

      return integratedRecords;
    }

    /**
     * 統合キーを抽出（新しい台帳構造に対応）
     * 各台帳が持つ他台帳の主キーフィールドの値の組み合わせで統合キーを生成
     */
    _extractIntegrationKey(record) {
      // 各台帳が持つ他台帳の主キーフィールドの値を取得
      const seatNumber = record["座席番号"] ? record["座席番号"].value : "";
      const pcNumber = record["PC番号"] ? record["PC番号"].value : "";
      const extNumber = record["内線番号"] ? record["内線番号"].value : "";
      const userId = record["ユーザーID"] ? record["ユーザーID"].value : "";

      // 空でない値のみを組み合わせて統合キーを生成
      const keyParts = [];
      if (seatNumber) keyParts.push(`SEAT:${seatNumber}`);
      if (pcNumber) keyParts.push(`PC:${pcNumber}`);
      if (extNumber) keyParts.push(`EXT:${extNumber}`);
      if (userId) keyParts.push(`USER:${userId}`);

      // 統合キーを生成（値が存在する組み合わせ）
      const integrationKey =
        keyParts.length > 0 ? keyParts.join("|") : `RECORD_${record.$id.value}`;

      return integrationKey;
    }

    /**
     * 全台帳からデータを取得（2段階検索ロジック）
     * @param {string} conditions - 検索条件
     * @returns {Object} 全台帳のデータ
     */
    async fetchAllLedgerData(conditions) {
      const allData = {};
      const primaryKeys = {
        SEAT: "座席番号",
        PC: "PC番号",
        EXT: "内線番号",
        USER: "ユーザーID",
      };

      // 第1段階：直接検索（検索条件に該当するフィールドを持つ台帳から検索）
      const firstStageResults = await this._executeFirstStageSearch(conditions);

      // 第2段階：関連検索（第1段階で取得した主キーを使って他の台帳を検索）
      const secondStageResults = await this._executeSecondStageSearch(
        firstStageResults,
        primaryKeys
      );

      // 🔧 第3段階：統合キーベース検索（補完検索）
      const thirdStageResults = await this._executeThirdStageSearch(
        firstStageResults,
        secondStageResults
      );

      // 結果をマージ
      Object.keys(this.appIds).forEach((appType) => {
        allData[appType] = [
          ...(firstStageResults[appType] || []),
          ...(secondStageResults[appType] || []),
          ...(thirdStageResults[appType] || []),
        ];

        // 重複除去
        allData[appType] = this._removeDuplicateRecords(allData[appType]);
      });

      return allData;
    }

    /**
     * 第1段階：検索条件で直接検索
     */
    async _executeFirstStageSearch(conditions) {
      const startTime = performance.now();
      const results = {};

      // 検索条件からフィールドを抽出して、どの台帳で検索すべきかを判定
      const targetApps = this._determineTargetApps(conditions);

      console.log(`🔍📊 第1段階検索開始: 対象台帳=${targetApps.length > 0 ? targetApps.join(',') : '全台帳'}`);

      for (const [appType, appId] of Object.entries(this.appIds)) {
        try {
          // 検索条件が存在し、かつ対象台帳でない場合はスキップ
          if (conditions && !targetApps.includes(appType)) {
            results[appType] = [];
            console.log(`   📊 ${appType}台帳: スキップ（検索対象外）`);
            continue;
          }

          // 🔄 fetchAllRecords関数を使用して500件以上のレコードを取得
          const records = await fetchAllRecords(appId, conditions, `第1段階-${appType}`);

          results[appType] = records;
        } catch (error) {
          console.error(`❌ ${appType}台帳の直接検索エラー:`, error);
          results[appType] = [];
        }
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const totalRecords = Object.values(results).reduce((sum, records) => sum + records.length, 0);

      console.log(`✅📊 第1段階検索完了: 総取得件数=${totalRecords}件, 実行時間=${totalDuration.toFixed(0)}ms`);
      return results;
    }

    /**
     * 検索条件から対象台帳を判定
     */
    _determineTargetApps(conditions) {
      if (!conditions) {
        // 検索条件がない場合は全台帳を対象
        return Object.keys(this.appIds);
      }

      const targetApps = new Set();

      // fieldsConfigの各フィールドをチェックして、検索条件に含まれているかを確認
      fieldsConfig.forEach((fieldConfig) => {
        // integration_keyフィールドは検索対象外とする
        if (fieldConfig.fieldCode === "integration_key") {
          return;
        }

        if (
          fieldConfig.sourceApp &&
          conditions.includes(fieldConfig.fieldCode)
        ) {
          targetApps.add(fieldConfig.sourceApp);
        }
      });

      // 対象台帳が見つからない場合
      if (targetApps.size === 0) {
        // デバッグ: 利用可能なフィールドをログ出力
        fieldsConfig.forEach((field) => {
          if (field.sourceApp && field.fieldCode !== "integration_key") {
            console.log(`  - ${field.fieldCode} (${field.sourceApp}台帳)`);
          }
        });

        return Object.keys(this.appIds);
      }

      const result = Array.from(targetApps);
      return result;
    }

    /**
     * 第2段階：第1段階の結果から主キーを抽出して関連検索
     */
    async _executeSecondStageSearch(firstStageResults, primaryKeys) {
      const startTime = performance.now();
      const results = {};
      let totalBatches = 0;

      console.log(`🔍📊 第2段階検索開始: 関連検索実行`);

      // 各台帳から主キーを抽出
      const extractedKeys = this._extractPrimaryKeysFromResults(
        firstStageResults,
        primaryKeys
      );

      // 抽出した主キーで他の台帳を検索
      for (const [appType, appId] of Object.entries(this.appIds)) {
        results[appType] = [];

        for (const [sourceAppType, keys] of Object.entries(extractedKeys)) {
          if (sourceAppType === appType || keys.length === 0) continue;

          const targetFieldName = primaryKeys[sourceAppType]; // 他の台帳にある主キーフィールド名

          // �� 対象台帳に該当フィールドが存在するかチェック
          if (!this._fieldExistsInApp(appType, targetFieldName)) {
            continue;
          }

          try {
            // 🔧 検索対象の主キー数を制限（URLが長すぎることを防ぐ）
            const maxKeys = _calculateOptimalBatchSize(keys, targetFieldName);
            const keyBatches = [];
            for (let i = 0; i < keys.length; i += maxKeys) {
              keyBatches.push(keys.slice(i, i + maxKeys));
            }

            console.log(`   📊 ${sourceAppType}→${appType}: ${keys.length}キー, ${keyBatches.length}バッチ`);

            for (const keyBatch of keyBatches) {
              totalBatches++;
              // 主キーの値でIN検索
              const keyConditions = keyBatch.map((key) => `"${key}"`).join(",");
              const query = `${targetFieldName} in (${keyConditions})`;

              // 🔄 fetchAllRecords関数を使用して500件以上のレコードを取得
              const records = await fetchAllRecords(appId, query, `第2段階-${sourceAppType}→${appType}-バッチ${totalBatches}`);

              results[appType].push(...records);
            }
          } catch (error) {
            console.error(
              `${appType}台帳の関連検索エラー(${sourceAppType}基準):`,
              error
            );
          }
        }

        // 台帳内の重複除去
        results[appType] = this._removeDuplicateRecords(results[appType]);
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const totalRecords = Object.values(results).reduce((sum, records) => sum + records.length, 0);

      console.log(`✅📊 第2段階検索完了: 総取得件数=${totalRecords}件, 総バッチ数=${totalBatches}, 実行時間=${totalDuration.toFixed(0)}ms`);
      return results;
    }

    /**
     * 🔧 指定された台帳に特定のフィールドが存在するかチェック
     * @param {string} appType - アプリタイプ
     * @param {string} fieldName - フィールド名
     * @returns {boolean} フィールドが存在するかどうか
     */
    _fieldExistsInApp(appType, fieldName) {
      if (!window.fieldsConfig) {
        console.warn("fieldsConfigが見つかりません");
        return false;
      }

      // fieldsConfigから該当アプリに該当フィールドが定義されているかチェック
      // 🔧 テーブル非表示フィールド（isVisibleInTable: false）も検索対象として認識
      const fieldExists = window.fieldsConfig.some(
        (field) => field.sourceApp === appType && field.fieldCode === fieldName
        // isVisibleInTable: falseフィールドも検索・統合処理では利用可能
      );
      return fieldExists;
    }

    /**
     * 第1段階の結果から各台帳の主キーを抽出
     */
    _extractPrimaryKeysFromResults(firstStageResults, primaryKeys) {
      const extractedKeys = {};

      Object.keys(this.appIds).forEach((appType) => {
        extractedKeys[appType] = [];

        const records = firstStageResults[appType] || [];
        const primaryKeyField = primaryKeys[appType];

        records.forEach((record) => {
          if (record[primaryKeyField]) {
            const keyValue = record[primaryKeyField].value;
            if (keyValue && !extractedKeys[appType].includes(keyValue)) {
              extractedKeys[appType].push(keyValue);
            }
          }
        });
      });

      return extractedKeys;
    }

    /**
     * レコードの重複除去（レコードIDベース）
     */
    _removeDuplicateRecords(records) {
      const seen = new Set();
      return records.filter((record) => {
        const recordId = record.$id.value;
        if (seen.has(recordId)) {
          return false;
        }
        seen.add(recordId);
        return true;
      });
    }

    /**
     * 🔧 第3段階：統合キーベース検索（補完検索）
     * @param {Object} firstStageResults - 第1段階の結果
     * @param {Object} secondStageResults - 第2段階の結果
     * @returns {Object} 第3段階の検索結果
     */
    async _executeThirdStageSearch(firstStageResults, secondStageResults) {
      const results = {};

      // 各台帳を初期化
      Object.keys(this.appIds).forEach((appType) => {
        results[appType] = [];
      });

      // 第1段階と第2段階の結果から統合キーを抽出
      const allIntegrationKeys = new Set();

      [firstStageResults, secondStageResults].forEach((stageResults) => {
        Object.values(stageResults).forEach((records) => {
          records.forEach((record) => {
            const integrationKey = this._extractIntegrationKey(record);
            if (integrationKey) {
              allIntegrationKeys.add(integrationKey);
            }
          });
        });
      });

      // 統合キーからユーザーIDを抽出してUSER台帳を検索
      const userIds = new Set();
      allIntegrationKeys.forEach((integrationKey) => {
        const userIdMatch = integrationKey.match(/USER:([^|]+)/);
        if (userIdMatch) {
          userIds.add(userIdMatch[1]);
        }
      });

      if (userIds.size > 0) {
        try {
          // まずUSER台帳の構造を調査
          const structureResponse = await kintone.api(
            kintone.api.url("/k/v1/records", true),
            "GET",
            {
              app: this.appIds.USER,
              query: `limit ${API_LIMITS.STRUCTURE_LIMIT}`,
            }
          );

          if (structureResponse.records.length > 0) {
            const fieldNames = Object.keys(structureResponse.records[0]);
          }

          // ユーザーIDフィールドで検索
          const userIdArray = Array.from(userIds);
          const userIdBatches = [];
          const maxKeys = _calculateOptimalBatchSize(userIdArray, 'ユーザーID');

          for (let i = 0; i < userIdArray.length; i += maxKeys) {
            userIdBatches.push(userIdArray.slice(i, i + maxKeys));
          }

          for (const batch of userIdBatches) {
            const userConditions = batch.map((id) => `"${id}"`).join(",");
            const query = `ユーザーID in (${userConditions})`;

            // 🔄 fetchAllRecords関数を使用して500件以上のレコードを取得
            const records = await fetchAllRecords(this.appIds.USER, query, `第3段階-USER`);

            results.USER.push(...records);
          }
        } catch (error) {
          console.error("USER台帳検索エラー:", error);
          results.USER = [];
        }
      }

      // PC番号とEXT番号も同様に検索
      await this._executeSupplementarySearch(
        allIntegrationKeys,
        results,
        "PC",
        "PC番号"
      );
      await this._executeSupplementarySearch(
        allIntegrationKeys,
        results,
        "EXT",
        "内線番号"
      );

      // 🔧 SEAT台帳の補完検索も追加
      await this._executeSupplementarySearch(
        allIntegrationKeys,
        results,
        "SEAT",
        "座席番号"
      );

      return results;
    }

    /**
     * 🔧 補完検索ヘルパー
     */
    async _executeSupplementarySearch(
      integrationKeys,
      results,
      appType,
      fieldName
    ) {
      const targetIds = new Set();
      const pattern = new RegExp(`${appType}:([^|]+)`);

      integrationKeys.forEach((integrationKey) => {
        const match = integrationKey.match(pattern);
        if (match) {
          targetIds.add(match[1]);
        }
      });

      if (targetIds.size > 0) {
        try {
          const idArray = Array.from(targetIds);
          const idBatches = [];
          const maxKeys = _calculateOptimalBatchSize(idArray, fieldName);

          for (let i = 0; i < idArray.length; i += maxKeys) {
            idBatches.push(idArray.slice(i, i + maxKeys));
          }

          for (const batch of idBatches) {
            const conditions = batch.map((id) => `"${id}"`).join(",");
            const query = `${fieldName} in (${conditions})`;

            // 🔄 fetchAllRecords関数を使用して500件以上のレコードを取得
            const records = await fetchAllRecords(this.appIds[appType], query, `補完検索-${appType}`);

            results[appType].push(...records);
          }
        } catch (error) {
          console.error(`${appType}台帳補完検索エラー:`, error);
        }
      }
    }
  }

  // グローバルに公開
  window.FilterManager = FilterManager;
  window.SearchEngine = SearchEngine;
  window.DataIntegrationManager = DataIntegrationManager;

  // 🧪 デバッグ用グローバル関数
  window.testMultiValueSearch = function(fieldCode, inputValue) {
    const filterManager = new FilterManager();
    return filterManager._debugMultiValueSearch(fieldCode, inputValue);
  };

  window.parseInputValues = function(input) {
    const filterManager = new FilterManager();
    return filterManager._parseInputValues(input);
  };
})();
