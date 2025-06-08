/**
 * 🚀 統合台帳システム v2 - コアシステム
 * @description データ管理・API通信・検索機能の統合
 * @version 2.0.0
 * 
 * 🎯 **ファイルの責任範囲**
 * ✅ kintone API通信・大量データ取得
 * ✅ 検索条件構築・クエリ生成
 * ✅ 複数台帳間のデータ統合処理
 * ✅ テーブル基本データ管理
 * ✅ セル・行の変更状態管理
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ UI描画・DOM操作（table-render.jsの責任）
 * ❌ ユーザーイベント処理（table-interact.jsの責任）
 * ❌ ページネーション処理（table-pagination.jsの責任）
 * ❌ システム初期化（table-header.jsの責任）
 * 
 * 📦 **含まれるクラス**
 * - APIManager: API通信・データ取得
 * - SearchManager: 検索条件管理・クエリ構築
 * - DataIntegrationManager: 複数台帳データ統合
 * - DataManager: テーブル基本データ管理
 * - StateManager: 変更状態管理
 * 
 * 🔗 **依存関係**
 * - kintone API
 * - window.LedgerV2.Config (設定)
 * - window.fieldsConfig (フィールド設定)
 * 
 * 💡 **使用例**
 * ```javascript
 * const result = await searchManager.executeSearch(conditions, null);
 * const integratedData = await dataIntegrationManager.fetchAllLedgerData(conditions);
 * ```
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.Core = {};

    // グローバル行番号カウンター
    let globalRowCounter = 1;

    // =============================================================================
    // 📊 API通信管理
    // =============================================================================

    class APIManager {
        /**
         * 500件以上のレコードを取得
         * @param {number} appId - アプリID
         * @param {string} query - 検索クエリ
         * @param {string} contextInfo - 呼び出し元情報
         * @returns {Array} 全レコード配列
         */
        static async fetchAllRecords(appId, query = '', contextInfo = '') {
            const allRecords = [];
            const limit = 500;
            let offset = 0;
            let finished = false;
            let apiCallCount = 0;

            const appName = this._getAppNameById(appId);
            const logPrefix = `🔍 ${appName}${contextInfo ? ` (${contextInfo})` : ''}`;

            console.log(`📡 ${logPrefix}: API呼び出し開始`);
            console.log(`🔍 ベースクエリ文字列: "${query}"`);

            while (!finished) {
                const queryWithPagination = query 
                    ? `${query} limit ${limit} offset ${offset}`
                    : `limit ${limit} offset ${offset}`;

                try {
                    apiCallCount++;
                    console.log(`📤 kintone API送信クエリ #${apiCallCount}: "${queryWithPagination}"`);

                    const res = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                        app: appId,
                        query: queryWithPagination
                    });

                    allRecords.push(...res.records);

                    if (res.records.length < limit) {
                        finished = true;
                    } else {
                        offset += limit;
                    }

                    console.log(`📊 ${logPrefix}: API#${apiCallCount} 取得: ${res.records.length}件 | 累計: ${allRecords.length}件`);

                } catch (error) {
                    console.error(`❌ ${logPrefix}: API呼び出し${apiCallCount}回目でエラー:`, error);
                    console.error(`❌ 失敗クエリ: "${queryWithPagination}"`);
                    throw error;
                }
            }

            console.log(`✅ ${logPrefix}: 取得完了 - 総件数: ${allRecords.length}件, API呼び出し回数: ${apiCallCount}回`);
            return allRecords;
        }

        static _getAppNameById(appId) {
            const appIdToName = {};
            Object.entries(window.LedgerV2.Config.APP_IDS).forEach(([name, id]) => {
                appIdToName[id] = name;
            });
            return appIdToName[appId] || `App${appId}`;
        }

        /**
         * バッチサイズを動的計算
         */
        static _calculateOptimalBatchSize(keys, fieldName) {
            if (keys.length === 0) return 100;

            const avgKeyLength = keys.slice(0, 10).reduce((sum, key) => sum + String(key).length, 0) / Math.min(10, keys.length);
            const baseQueryLength = fieldName.length + 10;
            const perKeyLength = avgKeyLength + 3;
            const maxQueryLength = 6500;
            const availableLength = maxQueryLength - baseQueryLength;
            const maxBatchSize = Math.floor(availableLength / perKeyLength);
            
            return Math.max(10, Math.min(200, maxBatchSize));
        }
    }

    // =============================================================================
    // 🔍 検索・フィルタ管理
    // =============================================================================

    class SearchManager {
        constructor() {
            this.currentConditions = '';
            this.currentLedger = '';
        }

        /**
         * フィルター条件を収集
         */
        collectConditions() {
            const conditions = [];
            const filterInputs = document.querySelectorAll('#my-filter-row input, #my-filter-row select');

            console.log('🔍 フィルター条件収集開始');

            filterInputs.forEach(input => {
                const fieldCode = input.getAttribute('data-field');
                const value = input.value.trim();

                console.log(`  📝 フィールド "${fieldCode}": "${value}"`);

                if (fieldCode && value && fieldCode !== '$ledger_type') {
                    const condition = this._buildCondition(fieldCode, value);
                    if (condition) {
                        console.log(`  ✅ 生成条件: ${condition}`);
                        conditions.push(condition);
                    } else {
                        console.log(`  ❌ 条件生成失敗`);
                    }
                } else {
                    console.log(`  ⏭️ スキップ (空白またはledger_type)`);
                }
            });

            const finalQuery = conditions.length > 0 ? conditions.join(' and ') : '';
            console.log(`🎯 最終クエリ文字列: "${finalQuery}"`);

            return finalQuery;
        }

        /**
         * 検索条件を構築
         */
        _buildCondition(fieldCode, value) {
            // 特別フィールド処理
            if (fieldCode === '$id') {
                const values = this._parseInputValues(value);
                if (values.length === 1) {
                    return `${fieldCode} = ${values[0]}`;
                } else {
                    const conditions = values.map(v => `${fieldCode} = ${v}`);
                    return `(${conditions.join(' or ')})`;
                }
            }

            // 通常フィールド処理
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            if (!field) return null;

            const inputValue = value.trim();
            if (!inputValue) return null;

            // filterType に基づいてクエリ構築方法を決定
            return this._buildConditionByFilterType(fieldCode, inputValue, field);
        }

        /**
         * filterType に基づく条件構築
         */
        _buildConditionByFilterType(fieldCode, inputValue, field) {
            const filterType = field.filterType || window.FILTER_TYPES.TEXT;

            switch (filterType) {
                case window.FILTER_TYPES.DROPDOWN:
                    // selectbox の場合は「in」を使用
                    return this._buildDropdownCondition(fieldCode, inputValue, field);

                case window.FILTER_TYPES.TEXT:
                default:
                    // input の場合は「=」を使用（元の処理）
                    return this._buildMultiValueCondition(fieldCode, inputValue, field.searchOperator, field.searchValueFormatter);
            }
        }

        /**
         * ドロップダウン用条件構築（selectbox → in）
         */
        _buildDropdownCondition(fieldCode, inputValue, field) {
            const values = this._parseInputValues(inputValue);
            if (values.length === 0) return null;

            // ドロップダウンは常に「in」演算子を使用
            if (values.length === 1) {
                const formattedValue = this._formatSearchValue(values[0], field.searchValueFormatter);
                return `${fieldCode} in (${formattedValue})`;
            } else {
                const formattedValues = values.map(v => this._formatSearchValue(v, field.searchValueFormatter));
                return `${fieldCode} in (${formattedValues.join(', ')})`;
            }
        }

        _parseInputValues(input) {
            return input.split(/[,，\s]+/)
                .map(v => v.trim())
                .filter(v => v.length > 0);
        }

        _buildMultiValueCondition(fieldCode, inputValue, operator, formatter) {
            const values = this._parseInputValues(inputValue);
            if (values.length === 0) return null;

            if (values.length === 1) {
                const formattedValue = this._formatSearchValue(values[0], formatter, operator);
                return `${fieldCode} ${operator} ${formattedValue}`;
            }

            return this._buildMultiValueQuery(fieldCode, values, operator, formatter);
        }

        _buildMultiValueQuery(fieldCode, values, operator, formatter) {
            if (operator === window.LedgerV2.Config.SEARCH_OPERATORS.IN) {
                const formattedValues = values.map(v => this._formatSearchValue(v, formatter, operator));
                return `${fieldCode} in (${formattedValues.join(', ')})`;
            } else {
                const conditions = values.map(v => {
                    const formattedValue = this._formatSearchValue(v, formatter, operator);
                    return `${fieldCode} ${operator} ${formattedValue}`;
                });
                return `(${conditions.join(' or ')})`;
            }
        }

        _formatSearchValue(value, formatter, operator = null) {
            switch (formatter) {
                case window.LedgerV2.Config.SEARCH_VALUE_FORMATTERS.EXACT:
                    return `"${value}"`;
                case window.LedgerV2.Config.SEARCH_VALUE_FORMATTERS.PREFIX:
                    return `"${value}%"`;
                case window.LedgerV2.Config.SEARCH_VALUE_FORMATTERS.LIST:
                    return `"${value}"`;
                default:
                    return `"${value}"`;
            }
        }

        /**
         * フィルターをクリア
         */
        clearFilters(preserveLedgerType = false) {
            const filterInputs = document.querySelectorAll('#my-filter-row input, #my-filter-row select');
            filterInputs.forEach(input => {
                if (preserveLedgerType && input.getAttribute('data-field') === '$ledger_type') {
                    return;
                }
                if (input.tagName.toLowerCase() === 'select') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }

        /**
         * 検索実行
         */
        async executeSearch(conditions, selectedLedger) {
            try {
                // フィルター条件を収集
                const queryConditions = this.collectConditions();
                
                console.log('🚀 検索実行開始');
                console.log(`  📋 入力条件: "${conditions}"`);
                console.log(`  🎯 収集クエリ: "${queryConditions}"`);
                console.log(`  📊 対象台帳: ${selectedLedger || 'all'}`);

                LoadingManager.show('データを検索中...');

                if (selectedLedger && selectedLedger !== 'all') {
                    return await this._searchSpecificLedger(queryConditions, selectedLedger);
                } else {
                    return await this._searchAllLedgers(queryConditions);
                }
            } catch (error) {
                console.error('❌ 検索実行エラー:', error);
                throw error;
            } finally {
                LoadingManager.hide();
            }
        }

        async _searchAllLedgers(conditions) {
            const dataIntegration = new DataIntegrationManager();
            return await dataIntegration.fetchAllLedgerData(conditions);
        }

        async _searchSpecificLedger(conditions, selectedLedger) {
            const appId = window.LedgerV2.Config.APP_IDS[selectedLedger.toUpperCase()];
            if (!appId) {
                throw new Error(`無効な台帳タイプ: ${selectedLedger}`);
            }

            const records = await APIManager.fetchAllRecords(appId, conditions, `${selectedLedger}台帳検索`);
            return {
                integratedRecords: records.map(record => ({
                    ledgerData: { [selectedLedger.toUpperCase()]: record },
                    recordIds: { [selectedLedger.toUpperCase()]: record.$id.value },
                    integrationKey: record.$id.value
                })),
                targetAppId: appId
            };
        }
    }

    // =============================================================================
    // 📊 データ統合管理
    // =============================================================================

    class DataIntegrationManager {
        /**
         * 全台帳データを統合
         */
        async fetchAllLedgerData(conditions) {
            const firstStageResults = await this._executeFirstStageSearch(conditions);
            const primaryKeys = this._extractPrimaryKeysFromResults(firstStageResults);
            const secondStageResults = await this._executeSecondStageSearch(firstStageResults, primaryKeys);
            const integratedRecords = await this._executeThirdStageSearch(firstStageResults, secondStageResults);

            return {
                integratedRecords,
                targetAppId: null
            };
        }

        async _executeFirstStageSearch(conditions) {
            const allApps = Object.keys(window.LedgerV2.Config.APP_IDS);
            const results = {};

            for (const appType of allApps) {
                const appId = window.LedgerV2.Config.APP_IDS[appType];
                try {
                    // SEAT台帳の場合、フィルター条件を適用
                    // 他の台帳は統合用に全データ取得（条件なし）
                    const searchConditions = (appType === 'SEAT') ? conditions : '';
                    const contextInfo = (appType === 'SEAT') ? 
                        `🔍 ${appType} (第1段階検索)` : 
                        `📊 ${appType} (統合用全データ取得)`;
                    
                    const records = await APIManager.fetchAllRecords(appId, searchConditions, contextInfo);
                    results[appType] = records;
                } catch (error) {
                    console.warn(`⚠️ ${appType}台帳の検索に失敗:`, error);
                    results[appType] = [];
                }
            }

            return results;
        }

        _determineTargetApps(conditions) {
            // 統合表示のため、常にすべての台帳を検索対象とする
            return Object.keys(window.LedgerV2.Config.APP_IDS);
        }

        _extractPrimaryKeysFromResults(firstStageResults) {
            const primaryKeys = {
                SEAT: new Set(),
                PC: new Set(),
                EXT: new Set(),
                USER: new Set()
            };

            Object.entries(firstStageResults).forEach(([appType, records]) => {
                records.forEach(record => {
                    const primaryFieldCode = IntegrationKeyHelper.getPrimaryFieldForApp(appType);
                    if (primaryFieldCode && record[primaryFieldCode]) {
                        primaryKeys[appType].add(record[primaryFieldCode].value);
                    }
                });
            });

            return primaryKeys;
        }

        async _executeSecondStageSearch(firstStageResults, primaryKeys) {
            const results = {};
            const allApps = Object.keys(window.LedgerV2.Config.APP_IDS);

            for (const appType of allApps) {
                if (firstStageResults[appType]) {
                    results[appType] = firstStageResults[appType];
                    continue;
                }

                const keysForThisApp = Array.from(primaryKeys[appType]);
                if (keysForThisApp.length === 0) continue;

                try {
                    const appId = window.LedgerV2.Config.APP_IDS[appType];
                    const primaryFieldCode = IntegrationKeyHelper.getPrimaryFieldForApp(appType);
                    const batchSize = APIManager._calculateOptimalBatchSize(keysForThisApp, primaryFieldCode);
                    
                    const batchResults = [];
                    for (let i = 0; i < keysForThisApp.length; i += batchSize) {
                        const batch = keysForThisApp.slice(i, i + batchSize);
                        const inQuery = batch.map(key => `"${key}"`).join(', ');
                        const query = `${primaryFieldCode} in (${inQuery})`;
                        
                        const records = await APIManager.fetchAllRecords(appId, query, `第2段階検索 (${i + 1}-${i + batch.length}/${keysForThisApp.length})`);
                        batchResults.push(...records);
                    }
                    
                    results[appType] = batchResults;
                } catch (error) {
                    console.warn(`⚠️ ${appType}台帳の第2段階検索に失敗:`, error);
                    results[appType] = [];
                }
            }

            return results;
        }

        async _executeThirdStageSearch(firstStageResults, secondStageResults) {
            const integratedData = new Map();

            // SEAT台帳をベースに統合キーを生成
            const seatRecords = secondStageResults.SEAT || [];
            
            seatRecords.forEach(seatRecord => {
                // SEAT台帳から他台帳の主キー値を取得
                const seat_number = seatRecord['座席番号']?.value;
                const pc_number = seatRecord['PC番号']?.value;
                const ext_number = seatRecord['内線番号']?.value;
                const user_id = seatRecord['ユーザーID']?.value;
                
                if (!seat_number) return;
                
                // 統合キーをSEAT台帳の座席番号をベースに作成
                const integrationKey = seat_number;
                
                const integratedRecord = {
                    ledgerData: {},
                    recordIds: {},
                    integrationKey
                };
                
                // SEAT台帳データを追加
                integratedRecord.ledgerData.SEAT = seatRecord;
                integratedRecord.recordIds.SEAT = seatRecord.$id.value;
                
                // 他台帳からマッチするデータを検索して追加
                if (pc_number && secondStageResults.PC) {
                    const pcRecord = secondStageResults.PC.find(r => r['PC番号']?.value === pc_number);
                    if (pcRecord) {
                        integratedRecord.ledgerData.PC = pcRecord;
                        integratedRecord.recordIds.PC = pcRecord.$id.value;
                    }
                }
                
                if (ext_number && secondStageResults.EXT) {
                    const extRecord = secondStageResults.EXT.find(r => r['内線番号']?.value === ext_number);
                    if (extRecord) {
                        integratedRecord.ledgerData.EXT = extRecord;
                        integratedRecord.recordIds.EXT = extRecord.$id.value;
                    }
                }
                
                if (user_id && secondStageResults.USER) {
                    const userRecord = secondStageResults.USER.find(r => r['ユーザーID']?.value === user_id);
                    if (userRecord) {
                        integratedRecord.ledgerData.USER = userRecord;
                        integratedRecord.recordIds.USER = userRecord.$id.value;
                    }
                }
                
                integratedData.set(integrationKey, integratedRecord);
            });

            return Array.from(integratedData.values());
        }
    }

    // =============================================================================
    // 🗃️ データ管理
    // =============================================================================

    class DataManager {
        constructor() {
            this.draggedElement = null;
            this.showRowNumbers = true;
            this.cachedFieldOrder = null;
        }

        generateRowId() {
            const currentId = globalRowCounter;
            globalRowCounter++;
            return currentId;
        }

        clearTable() {
            const tbody = DOMHelper.getTableBody();
            if (tbody) {
                tbody.innerHTML = '';
                globalRowCounter = 1;
                console.log('🧹 テーブルクリア完了');
            }
        }

        getFieldOrder() {
            if (this.cachedFieldOrder) {
                return this.cachedFieldOrder;
            }

            this.cachedFieldOrder = DOMHelper.getFieldOrderFromHeader();
            return this.cachedFieldOrder;
        }

        displayNoResults(tbody) {
            tbody.innerHTML = '';
            const noDataRow = document.createElement('tr');
            const noDataCell = document.createElement('td');
            noDataCell.colSpan = window.fieldsConfig.length;
            noDataCell.textContent = '検索条件に該当するデータが見つかりませんでした。';
            noDataCell.style.textAlign = 'center';
            noDataCell.style.padding = '20px';
            noDataCell.style.color = '#666';
            noDataRow.appendChild(noDataCell);
            tbody.appendChild(noDataRow);
        }
    }

    // =============================================================================
    // 🎯 状態管理（シンプル版）
    // =============================================================================

    class StateManager {
        constructor() {
            this.modifiedCells = new Set();
            this.modifiedRows = new Set();
            this.rowStates = new Map();
        }

        markCellAsModified(cell, row) {
            StyleManager.highlightModifiedCell(cell);
            this.modifiedCells.add(cell);
            this.markRowAsModified(row);
        }

        markRowAsModified(row) {
            StyleManager.highlightModifiedRow(row);
            this.modifiedRows.add(row);
        }

        clearModifications() {
            this.modifiedCells.forEach(cell => StyleManager.removeHighlight(cell));
            this.modifiedRows.forEach(row => StyleManager.removeHighlight(row));
            this.modifiedCells.clear();
            this.modifiedRows.clear();
        }

        isCellModified(cell) {
            return this.modifiedCells.has(cell);
        }

        isRowModified(row) {
            return this.modifiedRows.has(row);
        }
    }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    // クラスをグローバルスコープに公開
    window.LedgerV2.Core = {
        APIManager,
        SearchManager,
        DataIntegrationManager,
        DataManager,
        StateManager
    };

    // レガシー互換性のため主要クラスを直接公開
    window.APIManager = APIManager;
    window.SearchManager = SearchManager;
    window.DataIntegrationManager = DataIntegrationManager;
    window.DataManager = DataManager;
    window.StateManager = StateManager;

    // グローバルインスタンス作成
    window.searchManager = new SearchManager();
    window.dataManager = new DataManager();
    window.stateManager = new StateManager();

    console.log('✅ LedgerV2 コアシステム初期化完了');

})();
