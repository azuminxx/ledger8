/**
 * 🚀 統合台帳システム v2 - 全データ抽出・CSVエクスポート機能
 * @description 全台帳のデータを統合してCSVファイルとしてエクスポート
 * @version 1.0.0
 * 
 * 🎯 **ファイルの責任範囲**
 * ✅ 全台帳データの抽出・統合
 * ✅ CSVファイル生成・ダウンロード
 * ✅ エクスポートボタンの作成・配置
 * ✅ プログレス表示・エラーハンドリング
 * 
 * 🔗 **依存関係**
 * - window.LedgerV2.Core.DataIntegrationManager
 * - window.LedgerV2.Core.APIManager
 * - window.BackgroundProcessMonitor
 * - window.fieldsConfig
 */

(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.FullDataExport = {};

    // =============================================================================
    // 📊 全データエクスポート管理
    // =============================================================================

    class FullDataExportManager {
        constructor() {
            this.isExporting = false;
        }

        /**
         * 全データエクスポートボタンを作成
         */
        createExportButton() {
            const button = document.createElement('button');
            button.id = 'full-data-export-btn';
            button.textContent = '📥 全データ抽出';
            button.title = '全台帳のデータを統合してCSVファイルでエクスポートします';
            
            // ボタンスタイル（既存のボタンパターンを参考）
            button.style.cssText = `
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                margin: 0 4px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
                white-space: nowrap;
            `;

            // ホバー効果
            button.addEventListener('mouseenter', () => {
                if (!this.isExporting) {
                    button.style.transform = 'translateY(-1px)';
                    button.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.4)';
                }
            });

            button.addEventListener('mouseleave', () => {
                if (!this.isExporting) {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.3)';
                }
            });

            // クリックイベント
            button.addEventListener('click', () => {
                this.executeFullDataExport();
            });

            return button;
        }

        /**
         * 全データエクスポートを実行
         */
        async executeFullDataExport() {
            if (this.isExporting) {
                return;
            }

            this.isExporting = true;
            const button = document.getElementById('full-data-export-btn');
            
            try {
                // ボタン状態を更新
                this._updateButtonState(button, true);

                // バックグラウンド処理監視を開始
                const processId = window.BackgroundProcessMonitor?.startProcess(
                    '全データ抽出', 
                    '全台帳からデータを取得中...'
                );

                // 全台帳データを取得
                const allData = await this._fetchAllLedgerData(processId);

                if (!allData || allData.length === 0) {
                    alert('エクスポートするデータがありません。');
                    return;
                }

                // CSV生成とダウンロード
                await this._generateAndDownloadCSV(allData, processId);

                // 完了通知
                if (processId && window.BackgroundProcessMonitor) {
                    window.BackgroundProcessMonitor.updateProcess(processId, '完了', 
                        `${allData.length}件のデータをエクスポート完了`);
                    setTimeout(() => window.BackgroundProcessMonitor.endProcess(processId), 1000);
                }

                // 完了統計を表示
                console.log('🎉 ===== 全データ抽出完了 =====');
                console.log(`📄 統合レコード数: ${allData.length}件`);
                console.log(`💾 CSVファイルをダウンロードしました`);
                console.log('================================\n');

                alert(`✅ 全データ抽出が完了しました！\n統合レコード数: ${allData.length}件\nCSVファイルをダウンロードしました。\n\n詳細な統計情報はコンソールをご確認ください。`);

            } catch (error) {
                console.error('❌ 全データエクスポートエラー:', error);
                alert(`エクスポート処理でエラーが発生しました: ${error.message}`);
                
                // エラー状態を更新
                if (window.BackgroundProcessMonitor) {
                    const processId = window.BackgroundProcessMonitor.getActiveProcesses()
                        .find(p => p.name === '全データ抽出')?.id;
                    if (processId) {
                        window.BackgroundProcessMonitor.updateProcess(processId, 'エラー', 'エクスポートエラー');
                        setTimeout(() => window.BackgroundProcessMonitor.endProcess(processId), 2000);
                    }
                }
            } finally {
                this.isExporting = false;
                this._updateButtonState(button, false);
            }
        }

        /**
         * 全台帳データを取得・統合
         */
        async _fetchAllLedgerData(processId) {
            try {
                // 進行状況を更新
                if (processId && window.BackgroundProcessMonitor) {
                    window.BackgroundProcessMonitor.updateProcess(processId, '実行中', 
                        '全台帳からデータを取得中...');
                }

                // 全台帳から生データを取得
                const allLedgerData = await this._fetchAllDataDirectly(processId);
                
                // 統合前のレコード数を記録
                const preIntegrationCounts = {};
                Object.entries(allLedgerData).forEach(([appType, records]) => {
                    preIntegrationCounts[appType] = records.length;
                });
                
                console.log('📊 統合前のレコード数:', preIntegrationCounts);
                
                // 全データ抽出専用の統合処理を使用（不整合データも保持）
                const integratedRecords = this._integrateDataForFullExport(allLedgerData);
                
                console.log(`✅ 統合完了: ${integratedRecords.length}件の統合レコード`);
                
                // 統合処理の詳細分析
                this._analyzeIntegrationResults(allLedgerData, integratedRecords, preIntegrationCounts);
                
                return integratedRecords;

            } catch (error) {
                console.error('❌ 全台帳データ取得・統合エラー:', error);
                throw error;
            }
        }

        /**
         * 直接的な方法で全台帳データを取得（統合処理用）
         */
        async _fetchAllDataDirectly(processId) {
            const allLedgerData = {};
            const appIds = window.LedgerV2.Config.APP_IDS;
            const apiCallStats = {}; // API実行回数の統計
            
            // HISTORY台帳以外の全台帳からデータを取得
            const targetApps = Object.entries(appIds).filter(([appType]) => appType !== 'HISTORY');
            
            console.log('📊 全データ抽出開始 - API実行統計:');
            
            for (const [appType, appId] of targetApps) {
                try {
                    // 進行状況を更新
                    if (processId && window.BackgroundProcessMonitor) {
                        window.BackgroundProcessMonitor.updateProcess(processId, '実行中', 
                            `${appType}台帳からデータを取得中...`);
                    }

                    // API実行前の時刻を記録
                    const startTime = Date.now();
                    
                    const records = await window.LedgerV2.Core.APIManager.fetchAllRecords(
                        appId, 
                        '', 
                        `全データ抽出-${appType}`
                    );

                    // API実行時間を計算
                    const endTime = Date.now();
                    const executionTime = endTime - startTime;
                    
                    // API実行回数を計算（500件ずつ取得するため）
                    const apiCallCount = Math.ceil(records.length / 500);
                    
                    // 統計情報を記録
                    apiCallStats[appType] = {
                        recordCount: records.length,
                        apiCallCount: apiCallCount,
                        executionTime: executionTime,
                        appId: appId
                    };

                    // 統合処理用の形式でデータを格納
                    allLedgerData[appType] = records;
                    
                    console.log(`✅ ${appType}台帳: ${records.length}件取得 (API実行回数: ${apiCallCount}回, 実行時間: ${executionTime}ms)`);

                } catch (error) {
                    console.error(`❌ ${appType}台帳データ取得エラー:`, error);
                    // エラーが発生した台帳は空配列で初期化
                    allLedgerData[appType] = [];
                    apiCallStats[appType] = {
                        recordCount: 0,
                        apiCallCount: 0,
                        executionTime: 0,
                        appId: appId,
                        error: true
                    };
                }
            }

            // 全体の統計を表示
            this._displayAPICallSummary(apiCallStats);

            return allLedgerData;
        }

        /**
         * CSVを生成してダウンロード
         */
        async _generateAndDownloadCSV(data, processId) {
            try {
                // 進行状況を更新
                if (processId && window.BackgroundProcessMonitor) {
                    window.BackgroundProcessMonitor.updateProcess(processId, '実行中', 
                        'CSVファイルを生成中...');
                }

                const csvContent = await this._generateCSV(data);
                const filename = `統合台帳_全データ_${new Date().toISOString().split('T')[0]}.csv`;
                
                this._downloadCSV(csvContent, filename);

            } catch (error) {
                console.error('❌ CSV生成エラー:', error);
                throw new Error('CSVファイルの生成に失敗しました');
            }
        }

        /**
         * CSVデータを生成
         */
        async _generateCSV(data) {
            if (!data || data.length === 0) {
                return '\uFEFF'; // BOM付きの空ファイル
            }

            // ヘッダーを生成（全フィールドを含む）
            const headers = await this._generateCSVHeaders(data);
            
            // データ行を生成（全レコードを各行の整合性チェックに渡す）
            const rows = data.map(record => this._generateCSVRow(record, headers, data));
            
            // CSVコンテンツを構築（2行ヘッダー対応）
            const headerRow1 = headers.map(h => h.appTypeLabel || ''); // 1行目：台帳名
            const headerRow2 = headers.map(h => h.fieldLabel || h.label); // 2行目：フィールド名
            
            const csvContent = [headerRow1, headerRow2, ...rows]
                .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
                .join('\n');
            
            return '\uFEFF' + csvContent; // BOM付きUTF-8
        }

        /**
         * CSVヘッダーを生成（台帳名付きフィールドを含む）
         */
        async _generateCSVHeaders(integratedRecords) {
            const headers = [];
            const fieldsByApp = {};
            
            // 整合性チェック結果を1列目に追加
            headers.push({ 
                fieldCode: 'consistencyCheck', 
                label: '整合性チェック',
                appTypeLabel: '',
                fieldLabel: '整合性チェック'
            });
            
            // 基本情報ヘッダー
            headers.push({ 
                fieldCode: 'integrationKey', 
                label: '統合キー',
                appTypeLabel: '',
                fieldLabel: '統合キー'
            });
            
            // 統合レコードから台帳別にフィールドコードを収集
            integratedRecords.forEach(record => {
                if (record.ledgerData) {
                    Object.entries(record.ledgerData).forEach(([appType, ledgerData]) => {
                        if (ledgerData) {
                            if (!fieldsByApp[appType]) {
                                fieldsByApp[appType] = new Set();
                            }
                            Object.keys(ledgerData).forEach(fieldCode => {
                                fieldsByApp[appType].add(fieldCode);
                            });
                        }
                    });
                }
            });

            // 各台帳のフィールド情報を取得
            const allFieldInfo = await this._getAllFieldInfo();
            
            // 主キーフィールドを取得
            const primaryKeyFields = this._getAllPrimaryKeyFields();
            
            // 台帳の表示順序
            const appOrder = ['USER', 'EXT', 'PC', 'SEAT'];
            
            // 1. 主キーフィールドを台帳別に先に追加
            primaryKeyFields.forEach(fieldCode => {
                appOrder.forEach(appType => {
                    if (fieldsByApp[appType] && fieldsByApp[appType].has(fieldCode)) {
                        const fieldInfo = allFieldInfo[fieldCode];
                        const originalLabel = fieldInfo ? fieldInfo.label : fieldCode;
                        const cleanFieldName = this._removeEmojisFromLabel(originalLabel);
                        const prefixedLabel = `${appType}_${originalLabel}`;
                        
                        headers.push({
                            fieldCode: fieldCode,
                            appType: appType,
                            label: prefixedLabel,
                            appTypeLabel: appType,
                            fieldLabel: cleanFieldName,
                            sourceApps: fieldInfo ? fieldInfo.sourceApps : [],
                            isPrimaryKey: true
                        });
                    }
                });
            });
            
            // 2. 主キー以外のフィールドを台帳別に追加
            appOrder.forEach(appType => {
                if (fieldsByApp[appType]) {
                    const sortedFieldCodes = Array.from(fieldsByApp[appType]).sort();
                    
                    sortedFieldCodes.forEach(fieldCode => {
                        // システムフィールドと主キーフィールドを除外
                        if (!fieldCode.startsWith('$') && 
                            fieldCode !== '__REVISION__' && 
                            fieldCode !== '__ID__' &&
                            !primaryKeyFields.includes(fieldCode)) {
                            
                            const fieldInfo = allFieldInfo[fieldCode];
                            const originalLabel = fieldInfo ? fieldInfo.label : fieldCode;
                            const cleanFieldName = this._removeEmojisFromLabel(originalLabel);
                            
                            // 台帳名をフィールド名の先頭に付ける
                            const prefixedLabel = `${appType}_${originalLabel}`;
                            
                            headers.push({
                                fieldCode: fieldCode,
                                appType: appType,
                                label: prefixedLabel,
                                appTypeLabel: appType,
                                fieldLabel: cleanFieldName,
                                sourceApps: fieldInfo ? fieldInfo.sourceApps : [],
                                isPrimaryKey: false
                            });
                        }
                    });
                }
            });
            
            return headers;
        }

        /**
         * 全台帳のフィールド情報を取得
         */
        async _getAllFieldInfo() {
            const allFieldInfo = {};
            const appIds = window.LedgerV2.Config.APP_IDS;
            
            // HISTORY台帳以外の全台帳からフィールド情報を取得
            const targetApps = Object.entries(appIds).filter(([appType]) => appType !== 'HISTORY');
            
            console.log('🔍 フィールド情報取得開始...');
            let fieldApiCallCount = 0;
            
            for (const [appType, appId] of targetApps) {
                try {
                    console.log(`📋 ${appType}台帳 (ID: ${appId}) のフィールド情報を取得中...`);
                    const fieldInfo = await this._getAppFieldInfo(appId);
                    fieldApiCallCount++;
                    
                    const fieldCount = Object.keys(fieldInfo).length;
                    console.log(`✅ ${appType}台帳: ${fieldCount}個のフィールド情報を取得`);
                    
                    Object.entries(fieldInfo).forEach(([fieldCode, field]) => {
                        if (!allFieldInfo[fieldCode]) {
                            allFieldInfo[fieldCode] = {
                                label: field.label,
                                type: field.type,
                                sourceApps: []
                            };
                        }
                        allFieldInfo[fieldCode].sourceApps.push(appType);
                    });

                } catch (error) {
                    console.warn(`⚠️ ${appType}台帳のフィールド情報取得に失敗:`, error);
                }
            }
            
            const totalFields = Object.keys(allFieldInfo).length;
            console.log(`📊 フィールド情報取得完了: ${fieldApiCallCount}回のAPI実行で${totalFields}個のユニークフィールドを取得\n`);
            
            return allFieldInfo;
        }

        /**
         * 指定アプリのフィールド情報を取得
         */
        async _getAppFieldInfo(appId) {
            try {
                const response = await kintone.api('/k/v1/app/form/fields.json', 'GET', {
                    app: appId
                });
                
                return response.properties || {};
            } catch (error) {
                console.error(`アプリ${appId}のフィールド情報取得エラー:`, error);
                return {};
            }
        }

        /**
         * API実行統計のサマリーを表示
         */
        _displayAPICallSummary(apiCallStats) {
            console.log('\n📈 ===== API実行統計サマリー =====');
            
            let totalRecords = 0;
            let totalApiCalls = 0;
            let totalExecutionTime = 0;
            let successCount = 0;
            let errorCount = 0;

            // 各台帳の詳細統計を表示
            Object.entries(apiCallStats).forEach(([appType, stats]) => {
                if (stats.error) {
                    console.log(`❌ ${appType}台帳 (ID: ${stats.appId}): エラーが発生しました`);
                    errorCount++;
                } else {
                    console.log(`📊 ${appType}台帳 (ID: ${stats.appId}):`);
                    console.log(`   ├─ 取得レコード数: ${stats.recordCount.toLocaleString()}件`);
                    console.log(`   ├─ API実行回数: ${stats.apiCallCount}回`);
                    console.log(`   ├─ 実行時間: ${stats.executionTime.toLocaleString()}ms (${(stats.executionTime / 1000).toFixed(2)}秒)`);
                    console.log(`   └─ 1回あたり平均時間: ${stats.apiCallCount > 0 ? (stats.executionTime / stats.apiCallCount).toFixed(0) : 0}ms`);
                    
                    totalRecords += stats.recordCount;
                    totalApiCalls += stats.apiCallCount;
                    totalExecutionTime += stats.executionTime;
                    successCount++;
                }
            });

            // 全体のサマリーを表示
            console.log('\n🎯 ===== 全体サマリー =====');
            console.log(`✅ 成功した台帳: ${successCount}個`);
            console.log(`❌ エラーが発生した台帳: ${errorCount}個`);
            console.log(`📝 総取得レコード数: ${totalRecords.toLocaleString()}件`);
            console.log(`🔄 総API実行回数: ${totalApiCalls}回`);
            console.log(`⏱️ 総実行時間: ${totalExecutionTime.toLocaleString()}ms (${(totalExecutionTime / 1000).toFixed(2)}秒)`);
            
            if (totalApiCalls > 0) {
                console.log(`📊 API実行効率:`);
                console.log(`   ├─ 1回あたり平均レコード数: ${(totalRecords / totalApiCalls).toFixed(1)}件/回`);
                console.log(`   ├─ 1回あたり平均実行時間: ${(totalExecutionTime / totalApiCalls).toFixed(0)}ms/回`);
                console.log(`   └─ 1件あたり平均処理時間: ${totalRecords > 0 ? (totalExecutionTime / totalRecords).toFixed(2) : 0}ms/件`);
            }
            
            console.log('================================\n');
        }

        /**
         * CSVの1行を生成（統合レコード用）
         */
        _generateCSVRow(record, headers, allRecords = null) {
            return headers.map(header => {
                const fieldCode = header.fieldCode;
                
                // 整合性チェック結果の処理
                if (fieldCode === 'consistencyCheck') {
                    return this._performConsistencyCheck(record, allRecords);
                }
                
                // 統合キーの処理
                if (fieldCode === 'integrationKey') {
                    return record.integrationKey || '';
                }
                
                // 台帳別フィールド値を抽出
                if (header.appType) {
                    return this._extractFieldValueFromApp(record, fieldCode, header.appType);
                }
                
                // 統合レコードから値を抽出（後方互換性のため）
                return this._extractFieldValue(record, fieldCode);
            });
        }

        /**
         * 指定した台帳からフィールド値を抽出
         */
        _extractFieldValueFromApp(record, fieldCode, appType) {
            let fieldValue = null;
            
            // 統合データの場合（ledgerDataを持つ）
            if (record.ledgerData && record.ledgerData[appType]) {
                const ledgerData = record.ledgerData[appType];
                if (ledgerData && ledgerData[fieldCode]) {
                    fieldValue = ledgerData[fieldCode];
                }
            }
            
            if (fieldValue) {
                const formattedValue = this._formatFieldValue(fieldValue);
                this._logFieldProcessing(fieldCode, fieldValue, formattedValue, appType);
                return formattedValue;
            }
            
            return '';
        }

        /**
         * レコードからフィールド値を抽出
         */
        _extractFieldValue(record, fieldCode) {
            let fieldValue = null;
            let sourceApp = null;
            
            // 統合データの場合（ledgerDataを持つ）
            if (record.ledgerData) {
                for (const [appType, ledgerData] of Object.entries(record.ledgerData)) {
                    if (ledgerData && ledgerData[fieldCode]) {
                        fieldValue = ledgerData[fieldCode];
                        sourceApp = appType;
                        break;
                    }
                }
            }
            
            // 通常のkintoneレコードの場合
            if (!fieldValue && record[fieldCode]) {
                fieldValue = record[fieldCode];
                sourceApp = 'direct';
            }
            
            if (fieldValue) {
                const formattedValue = this._formatFieldValue(fieldValue);
                
                // ユーザー関連フィールドのデバッグ情報を出力（必要に応じて）
                if (fieldValue.type && ['CREATOR', 'MODIFIER', 'USER_SELECT', 'GROUP_SELECT', 'ORGANIZATION_SELECT'].includes(fieldValue.type)) {
                    this._logFieldProcessing(fieldCode, fieldValue, formattedValue, sourceApp);
                }
                
                return formattedValue;
            }
            
            return '';
        }

        /**
         * フィールド値をフォーマット
         */
        _formatFieldValue(fieldValue) {
            if (!fieldValue) return '';
            
            // kintoneフィールドの場合
            if (typeof fieldValue === 'object' && fieldValue.value !== undefined) {
                const value = fieldValue.value;
                const type = fieldValue.type;
                
                // 作成者・更新者フィールドの場合、nameを取得
                if (type === 'CREATOR' || type === 'MODIFIER') {
                    if (value && typeof value === 'object' && value.name) {
                        return value.name;
                    }
                    // nameがない場合はcodeを使用
                    if (value && typeof value === 'object' && value.code) {
                        return value.code;
                    }
                    return String(value || '');
                }
                
                // 日付・時刻フィールドの場合、日本時間のyyyy/mm/dd形式に変換
                if (type === 'CREATED_TIME' || type === 'UPDATED_TIME' || type === 'DATETIME') {
                    return this._formatDateTimeToJapanese(value);
                }
                
                // 日付フィールドの場合、yyyy/mm/dd形式に変換
                if (type === 'DATE') {
                    return this._formatDateToJapanese(value);
                }
                
                // 時刻フィールドの場合、そのまま返す
                if (type === 'TIME') {
                    return String(value || '');
                }
                
                // ユーザー選択フィールドの場合
                if (type === 'USER_SELECT' || type === 'GROUP_SELECT' || type === 'ORGANIZATION_SELECT') {
                    if (Array.isArray(value)) {
                        const formattedNames = value.map(item => {
                            if (item && typeof item === 'object') {
                                // nameを優先、なければcode、それでもなければ文字列化
                                return item.name || item.code || String(item);
                            }
                            return String(item);
                        });
                        return formattedNames.join(', ');
                    }
                    // 単一オブジェクトの場合
                    if (value && typeof value === 'object') {
                        return value.name || value.code || String(value);
                    }
                    // その他の場合
                    return String(value || '');
                }
                
                // 配列の場合（チェックボックス、複数選択など）
                if (Array.isArray(value)) {
                    return value.map(item => {
                        if (item && typeof item === 'object') {
                            return item.name || item.code || item.label || String(item);
                        }
                        return String(item);
                    }).join(', ');
                }
                
                // オブジェクトの場合（ユーザー情報など）
                if (value && typeof value === 'object') {
                    return value.name || value.code || value.label || String(value);
                }
                
                return String(value);
            }
            
            return String(fieldValue);
        }

        /**
         * フィールド処理のデバッグログ出力
         */
        _logFieldProcessing(fieldCode, fieldValue, formattedValue, sourceApp) {
            // デバッグモードの場合のみ出力（コンソールが煩雑になるのを防ぐ）
            if (window.LedgerV2?.Debug?.enableFieldProcessingLog) {
                const type = fieldValue.type;
                const value = fieldValue.value;
                
                if (type === 'USER_SELECT' && Array.isArray(value)) {
                    console.log(`🔍 ${type}フィールド (${fieldCode}) - 配列データ:`, 
                        value.map(item => ({code: item.code, name: item.name})), 
                        `→ 抽出値: "${formattedValue}" (from ${sourceApp})`);
                } else if (['CREATOR', 'MODIFIER'].includes(type)) {
                    console.log(`🔍 ${type}フィールド (${fieldCode}) - オブジェクトデータ:`, 
                        {code: value.code, name: value.name}, 
                        `→ 抽出値: "${formattedValue}" (from ${sourceApp})`);
                } else {
                    console.log(`🔍 ${type}フィールド (${fieldCode}) - データ:`, value, 
                        `→ 抽出値: "${formattedValue}" (from ${sourceApp})`);
                }
            }
        }

        /**
         * レコードから台帳種別を推定
         */
        _getLedgerTypeFromRecord(record) {
            if (record._app_id) {
                const appIds = window.LedgerV2.Config.APP_IDS;
                for (const [appType, appId] of Object.entries(appIds)) {
                    if (appId === record._app_id) {
                        return appType;
                    }
                }
            }
            return '不明';
        }

        /**
         * 日時をフォーマット
         */
        _formatDateTime(dateString) {
            if (!dateString) return '';
            
            try {
                const date = new Date(dateString);
                return date.toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            } catch (error) {
                return String(dateString);
            }
        }
        
        /**
         * 日時フィールドを日本時間のyyyy/mm/dd形式に変換
         */
        _formatDateTimeToJapanese(value) {
            if (!value) return '';
            
            try {
                // ISO 8601形式をDateオブジェクトに変換
                const date = new Date(value);
                if (isNaN(date.getTime())) return String(value);
                
                // 日本時間に変換
                const japanDate = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
                
                // yyyy/mm/dd形式でフォーマット
                const year = japanDate.getFullYear();
                const month = String(japanDate.getMonth() + 1).padStart(2, '0');
                const day = String(japanDate.getDate()).padStart(2, '0');
                
                return `${year}/${month}/${day}`;
            } catch (error) {
                console.error('[FullDataExport] 日時変換エラー:', error, value);
                return String(value);
            }
        }
        
        /**
         * 日付フィールドをyyyy/mm/dd形式に変換
         */
        _formatDateToJapanese(value) {
            if (!value) return '';
            
            try {
                // 日付文字列の形式チェック（YYYY-MM-DD）
                const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (dateMatch) {
                    const [, year, month, day] = dateMatch;
                    return `${year}/${month}/${day}`;
                }
                
                // その他の形式の場合はDateオブジェクトで処理
                const date = new Date(value);
                if (isNaN(date.getTime())) return String(value);
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                return `${year}/${month}/${day}`;
            } catch (error) {
                console.error('[FullDataExport] 日付変換エラー:', error, value);
                return String(value);
            }
        }
        
        /**
         * 統合レコードの整合性チェックを実行（台帳間比較 + 主キー重複チェック）
         */
        _performConsistencyCheck(record, allRecords = null) {
            if (!record || !record.ledgerData) {
                return 'チェック不可';
            }
            
            try {
                // 主キーフィールドを取得
                const primaryKeyFields = this._getAllPrimaryKeyFields();
                if (!primaryKeyFields || primaryKeyFields.length === 0) {
                    return 'チェック不可';
                }
                
                const inconsistentReasons = [];
                
                // 1. 台帳間の値比較チェック（既存ロジック）
                const ledgerCombinations = {};
                const inconsistentFields = {};
                let hasFieldInconsistency = false;
                
                Object.keys(record.ledgerData).forEach(appType => {
                    const ledgerRecord = record.ledgerData[appType];
                    if (ledgerRecord) {
                        const combination = {};
                        primaryKeyFields.forEach(fieldCode => {
                            // 空欄も含めて値を取得（nullや空文字列も比較対象とする）
                            let value = null;
                            if (ledgerRecord[fieldCode]) {
                                value = ledgerRecord[fieldCode].value || null;
                            }
                            combination[fieldCode] = value;
                        });
                        ledgerCombinations[appType] = combination;
                    }
                });
                
                // 台帳間での値の不整合をチェック
                primaryKeyFields.forEach(fieldCode => {
                    const values = new Set();
                    const appsWithValue = [];
                    
                    Object.keys(ledgerCombinations).forEach(appType => {
                        const value = ledgerCombinations[appType][fieldCode];
                        // 空欄（null）も含めて比較対象とする
                        values.add(value);
                        appsWithValue.push(appType);
                    });
                    
                    // 同じフィールドで異なる値がある場合は不整合
                    // 値が2種類以上ある場合（空欄と値、または異なる値同士）
                    if (values.size > 1) {
                        hasFieldInconsistency = true;
                        inconsistentFields[fieldCode] = appsWithValue;
                    }
                });
                
                if (hasFieldInconsistency) {
                    const inconsistentFieldNames = Object.keys(inconsistentFields);
                    inconsistentReasons.push(`台帳間不整合(${inconsistentFieldNames.length}項目)`);
                }
                
                // 2. 主キー重複チェック（新規追加）
                if (allRecords && allRecords.length > 1) {
                    const duplicateFields = this._checkPrimaryKeyDuplicates(record, allRecords, primaryKeyFields);
                    if (duplicateFields.length > 0) {
                        inconsistentReasons.push(`主キー重複(${duplicateFields.length}項目)`);
                    }
                }
                
                // 結果を返す
                if (inconsistentReasons.length > 0) {
                    return `不整合 (${inconsistentReasons.join(', ')})`;
                } else {
                    return '整合';
                }
                
            } catch (error) {
                console.error('[FullDataExport] 整合性チェックエラー:', error);
                return 'チェックエラー';
            }
        }
        
        /**
         * 主キーフィールドの重複をチェック
         */
        _checkPrimaryKeyDuplicates(currentRecord, allRecords, primaryKeyFields) {
            const duplicateFields = [];
            
            try {
                // 現在のレコードの主キー値を取得
                const currentValues = {};
                Object.entries(currentRecord.ledgerData).forEach(([appType, ledgerData]) => {
                    if (ledgerData) {
                        primaryKeyFields.forEach(fieldCode => {
                            if (ledgerData[fieldCode] && ledgerData[fieldCode].value) {
                                const value = ledgerData[fieldCode].value;
                                if (value && value.trim() !== '') { // 空欄は重複チェック対象外
                                    if (!currentValues[fieldCode]) {
                                        currentValues[fieldCode] = [];
                                    }
                                    currentValues[fieldCode].push({
                                        value: value,
                                        appType: appType
                                    });
                                }
                            }
                        });
                    }
                });
                
                // 他のレコードと比較
                primaryKeyFields.forEach(fieldCode => {
                    if (currentValues[fieldCode]) {
                        currentValues[fieldCode].forEach(currentField => {
                            const currentValue = currentField.value;
                            
                            // 他のレコードで同じ値を持つものを検索
                            const duplicateCount = allRecords.filter(otherRecord => {
                                if (otherRecord === currentRecord) return false; // 自分自身は除外
                                
                                return Object.values(otherRecord.ledgerData || {}).some(otherLedgerData => {
                                    if (!otherLedgerData || !otherLedgerData[fieldCode]) return false;
                                    const otherValue = otherLedgerData[fieldCode].value;
                                    return otherValue && otherValue === currentValue;
                                });
                            }).length;
                            
                            if (duplicateCount > 0) {
                                if (!duplicateFields.includes(fieldCode)) {
                                    duplicateFields.push(fieldCode);
                                }
                            }
                        });
                    }
                });
                
            } catch (error) {
                console.error('[FullDataExport] 主キー重複チェックエラー:', error);
            }
            
            return duplicateFields;
        }
        
        /**
         * ラベルから絵文字を除去
         */
        _removeEmojisFromLabel(label) {
            if (!label) return '';
            
            // 絵文字を除去する正規表現
            const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
            
            return label.replace(emojiRegex, '').replace(/^\s+|\s+$/g, ''); // 絵文字除去 + 前後の空白除去
        }

        /**
         * 主キーフィールドの一覧を取得（既存のutils.jsロジックを参考）
         */
        _getAllPrimaryKeyFields() {
            try {
                // window.LedgerV2.Utils.FieldValueProcessor.getAllPrimaryKeyFields() が存在する場合はそれを使用
                if (window.LedgerV2?.Utils?.FieldValueProcessor?.getAllPrimaryKeyFields) {
                    return window.LedgerV2.Utils.FieldValueProcessor.getAllPrimaryKeyFields();
                }
                
                // フォールバック: fieldsConfigから主キーフィールドを取得
                if (window.fieldsConfig) {
                    return window.fieldsConfig
                        .filter(field => field.isPrimaryKey)
                        .map(field => field.fieldCode);
                }
                
                // デフォルトの主キーフィールド（設定が見つからない場合）
                return ['座席番号', 'PC番号', '内線番号', 'ユーザーID'];
                
            } catch (error) {
                console.error('[FullDataExport] 主キーフィールド取得エラー:', error);
                return ['座席番号', 'PC番号', '内線番号', 'ユーザーID'];
            }
        }

        /**
         * 全データ抽出専用の統合処理（不整合データも保持）
         */
        _integrateDataForFullExport(allLedgerData) {
            const integratedData = new Map();
            let recordCounter = 0;
            
            console.log('🔧 全データ抽出専用統合処理開始...');
            
            // 各台帳のデータを処理
            Object.entries(allLedgerData).forEach(([appType, records]) => {
                console.log(`📋 ${appType}台帳: ${records.length}件を処理中...`);
                
                                 records.forEach(record => {
                     const recordId = record.$id.value;
                     
                     // 統合キーを生成
                     const integrationKey = this._generateIntegrationKeyForFullExport(record);
                     
                     // デバッグ: 特定のレコードの統合キー生成を詳細表示
                     if (recordId === '6180' || recordId === '7730' || 
                         (record.PC番号 && (record.PC番号.value === 'PCAIT23N1541' || record.PC番号.value === 'PCAIT23N1542'))) {
                         console.log(`🔍 [${appType}] レコードID: ${recordId}`);
                         console.log(`   統合キー: ${integrationKey}`);
                         console.log(`   PC番号: ${record.PC番号?.value || '未設定'}`);
                         console.log(`   座席番号: ${record.座席番号?.value || '未設定'}`);
                         console.log(`   レコード詳細:`, {
                             PC番号: record.PC番号?.value,
                             座席番号: record.座席番号?.value,
                             ユーザーID: record.ユーザーID?.value,
                             内線番号: record.内線番号?.value
                         });
                     }
                     
                     // 既存の統合レコードを検索（完全一致のみ）
                     let existingRecord = integratedData.get(integrationKey);
                     
                     if (existingRecord) {
                         // 既存の統合レコードに台帳データを追加
                         console.log(`🔄 統合: ${appType}レコード(ID:${recordId})を既存統合レコードに追加`);
                         console.log(`   統合キー: ${integrationKey}`);
                         existingRecord.ledgerData[appType] = record;
                         existingRecord.recordIds[appType] = recordId;
                     } else {
                         // 新しい統合レコードを作成
                         recordCounter++;
                         console.log(`✨ 新規: ${appType}レコード(ID:${recordId})で新しい統合レコードを作成`);
                         console.log(`   統合キー: ${integrationKey}`);
                         const newIntegratedRecord = {
                             integrationKey: integrationKey,
                             ledgerData: { [appType]: record },
                             recordIds: { [appType]: recordId },
                             _fullExportId: recordCounter // デバッグ用のID
                         };
                         
                         integratedData.set(integrationKey, newIntegratedRecord);
                     }
                 });
            });
            
            const result = Array.from(integratedData.values());
            console.log(`✅ 全データ抽出専用統合完了: ${result.length}件の統合レコード`);
            
            return result;
        }
        
        /**
         * 全データ抽出専用の統合キー生成（より厳密な統合）
         */
                 _generateIntegrationKeyForFullExport(record) {
             try {
                 // 主キーマッピングを取得
                 const appMapping = window.LedgerV2?.Utils?.FieldValueProcessor?.getAppToPrimaryKeyMapping();
                 if (!appMapping) {
                     console.log(`⚠️ 主キーマッピングが取得できません。レコードID: ${record.$id.value}`);
                     return `RECORD_${record.$id.value}`;
                 }
                 
                 const keyParts = [];
                 const recordId = record.$id.value;
                 
                 // デバッグ: 主キーマッピング情報を表示
                 if (recordId === '6180' || recordId === '7730' || 
                     (record.PC番号 && (record.PC番号.value === 'PCAIT23N1541' || record.PC番号.value === 'PCAIT23N1542'))) {
                     console.log(`🔧 [統合キー生成] レコードID: ${recordId}`);
                     console.log(`   主キーマッピング:`, appMapping);
                 }
                 
                 // 全ての主キーフィールドをチェック（空欄も含む）
                 Object.entries(appMapping).forEach(([appType, fieldCode]) => {
                     let fieldValue = '';
                     if (record[fieldCode] && record[fieldCode].value !== undefined) {
                         fieldValue = record[fieldCode].value || '';
                     }
                     
                     // デバッグ: フィールド値の詳細表示
                     if (recordId === '6180' || recordId === '7730' || 
                         (record.PC番号 && (record.PC番号.value === 'PCAIT23N1541' || record.PC番号.value === 'PCAIT23N1542'))) {
                         console.log(`   ${appType} (${fieldCode}): "${fieldValue}" (元データ: ${JSON.stringify(record[fieldCode])})`);
                     }
                     
                     // 空欄も含めて統合キーに含める（より厳密な統合のため）
                     keyParts.push(`${appType}:${fieldValue}`);
                 });
                 
                 // 統合キーを生成
                 const integrationKey = keyParts.length > 0 ? keyParts.join('|') : `RECORD_${record.$id.value}`;
                 
                 // デバッグ: 最終的な統合キーを表示
                 if (recordId === '6180' || recordId === '7730' || 
                     (record.PC番号 && (record.PC番号.value === 'PCAIT23N1541' || record.PC番号.value === 'PCAIT23N1542'))) {
                     console.log(`   最終統合キー: "${integrationKey}"`);
                 }
                 
                 return integrationKey;
                 
             } catch (error) {
                 console.error('[FullDataExport] 統合キー生成エラー:', error);
                 return `RECORD_${record.$id.value}`;
             }
         }

        /**
         * 統合処理結果の詳細分析
         */
        _analyzeIntegrationResults(allLedgerData, integratedRecords, preIntegrationCounts) {
            console.log('\n🔍 ===== 統合処理詳細分析 =====');
            
            // 各台帳のレコードが統合後にどうなったかを追跡
            const integrationAnalysis = {};
            
            Object.entries(allLedgerData).forEach(([appType, records]) => {
                integrationAnalysis[appType] = {
                    originalCount: records.length,
                    foundInIntegrated: 0,
                    missingRecords: [],
                    duplicateIntegrations: []
                };
                
                records.forEach(record => {
                    const recordId = record.$id.value;
                    
                    // 統合レコードでこのレコードを探す
                    let foundCount = 0;
                    let foundInRecords = [];
                    
                    integratedRecords.forEach((integratedRecord, index) => {
                        if (integratedRecord.ledgerData[appType] && 
                            integratedRecord.ledgerData[appType].$id.value === recordId) {
                            foundCount++;
                            foundInRecords.push(index);
                        }
                    });
                    
                    if (foundCount === 0) {
                        // 統合後に見つからないレコード
                        integrationAnalysis[appType].missingRecords.push({
                            recordId: recordId,
                            integrationKey: this._extractIntegrationKeyForAnalysis(record),
                            primaryKeys: this._extractPrimaryKeysForAnalysis(record)
                        });
                    } else if (foundCount === 1) {
                        integrationAnalysis[appType].foundInIntegrated++;
                    } else {
                        // 複数の統合レコードに含まれている（通常は起こらない）
                        integrationAnalysis[appType].duplicateIntegrations.push({
                            recordId: recordId,
                            foundInRecords: foundInRecords
                        });
                    }
                });
            });
            
            // 分析結果を表示
            Object.entries(integrationAnalysis).forEach(([appType, analysis]) => {
                console.log(`\n📋 ${appType}台帳の分析結果:`);
                console.log(`   ├─ 元のレコード数: ${analysis.originalCount}件`);
                console.log(`   ├─ 統合後に存在: ${analysis.foundInIntegrated}件`);
                console.log(`   └─ 消失したレコード: ${analysis.missingRecords.length}件`);
                
                if (analysis.missingRecords.length > 0) {
                    console.log(`\n❌ ${appType}台帳で消失したレコード:`);
                    analysis.missingRecords.forEach(missing => {
                        console.log(`   • ID: ${missing.recordId}`);
                        console.log(`     統合キー: ${missing.integrationKey}`);
                        console.log(`     主キー情報: ${JSON.stringify(missing.primaryKeys)}`);
                    });
                }
                
                if (analysis.duplicateIntegrations.length > 0) {
                    console.log(`\n⚠️ ${appType}台帳で重複統合されたレコード:`);
                    analysis.duplicateIntegrations.forEach(duplicate => {
                        console.log(`   • ID: ${duplicate.recordId}, 統合レコード: ${duplicate.foundInRecords.join(', ')}`);
                    });
                }
            });
            
            console.log('\n================================\n');
        }
        
        /**
         * レコードから統合キーを抽出（分析用）
         */
        _extractIntegrationKeyForAnalysis(record) {
            try {
                if (window.LedgerV2?.Core?.DataIntegrationManager) {
                    const manager = new window.LedgerV2.Core.DataIntegrationManager();
                    return manager._extractIntegrationKey(record);
                }
                return 'キー取得不可';
            } catch (error) {
                return 'キー取得エラー';
            }
        }
        
        /**
         * レコードから主キー情報を抽出（分析用）
         */
        _extractPrimaryKeysForAnalysis(record) {
            try {
                const primaryKeys = {};
                if (window.LedgerV2?.Utils?.FieldValueProcessor?.getAppToPrimaryKeyMapping) {
                    const mapping = window.LedgerV2.Utils.FieldValueProcessor.getAppToPrimaryKeyMapping();
                    Object.entries(mapping).forEach(([appType, fieldCode]) => {
                        if (record[fieldCode] && record[fieldCode].value) {
                            primaryKeys[appType] = record[fieldCode].value;
                        }
                    });
                }
                return primaryKeys;
            } catch (error) {
                return { error: '主キー取得エラー' };
            }
        }

        /**
         * CSVファイルをダウンロード（history.jsの実装を参考）
         */
        _downloadCSV(csvContent, filename) {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }

        /**
         * ボタン状態を更新
         */
        _updateButtonState(button, isExporting) {
            if (!button) return;
            
            if (isExporting) {
                button.textContent = '📥 エクスポート中...';
                button.disabled = true;
                button.style.opacity = '0.6';
                button.style.cursor = 'not-allowed';
            } else {
                button.textContent = '📥 全データ抽出';
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        }
    }

    // =============================================================================
    // 🔧 初期化・グローバル公開
    // =============================================================================

    // グローバルインスタンスを作成
    window.LedgerV2.FullDataExport.manager = new FullDataExportManager();

    // レガシー互換性のためのグローバル関数
    window.createFullDataExportButton = () => {
        return window.LedgerV2.FullDataExport.manager.createExportButton();
    };

    window.executeFullDataExport = () => {
        return window.LedgerV2.FullDataExport.manager.executeFullDataExport();
    };

    // 初期化完了ログ
    console.log('✅ 全データ抽出・CSVエクスポート機能が初期化されました');
    console.log('💡 フィールド処理のデバッグログを有効にするには: window.LedgerV2.Debug = {enableFieldProcessingLog: true}');

})(); 