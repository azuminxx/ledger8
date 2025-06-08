// =============================================================================
// 🎯 手動入力監視システム
// =============================================================================
// テーブル内の手動入力を監視してハイライト適用
// 作成日: 2025年6月7日
// =============================================================================

(function () {
    "use strict";

    /**
     * 🎯 手動入力監視管理クラス
     * @description テーブル内の全input要素を監視し、変更時にハイライトを適用
     */
    class ManualInputMonitor {
        constructor() {
            this.monitoredElements = new WeakSet();
            this.isInitialized = false;
        }

        /**
         * 初期化
         */
        initialize() {
            if (this.isInitialized) return;
            
            //console.log('📝 手動入力監視システムを初期化中...');
            
            // テーブルが存在するまで待機
            this.waitForTableAndSetupMonitoring();
            
            this.isInitialized = true;
            //console.log('📝 手動入力監視システムの初期化完了');
        }

        /**
         * テーブルの存在を待機してから監視設定
         */
        waitForTableAndSetupMonitoring() {
            const checkTable = () => {
                const tbody = document.querySelector('#my-tbody, tbody');
                if (tbody) {
                    this.setupTableInputMonitoring(tbody);
                    this.setupMutationObserver(tbody);
                } else {
                    // テーブルがまだない場合は500ms後に再試行
                    setTimeout(checkTable, 500);
                }
            };
            
            checkTable();
        }

        /**
         * テーブル内の全入力要素に監視を設定
         * @param {HTMLElement} tbody - テーブルボディ要素
         */
        setupTableInputMonitoring(tbody) {
            //console.log('📝 テーブル内入力要素の監視設定開始');
            
            // 全入力要素を取得
            const inputElements = tbody.querySelectorAll('input, select, textarea, [contenteditable]');
            let monitoredCount = 0;
            
            inputElements.forEach(element => {
                if (this.setupInputMonitoring(element)) {
                    monitoredCount++;
                }
            });
            
            //console.log(`📝 ${monitoredCount}個の入力要素に監視を設定完了`);
        }

        /**
         * 個別の入力要素に監視を設定
         * @param {HTMLElement} element - 入力要素
         * @returns {boolean} 設定成功かどうか
         */
        setupInputMonitoring(element) {
            try {
                // 既に監視済みの場合はスキップ
                if (this.monitoredElements.has(element)) {
                    return false;
                }

                // セルと関連情報を取得
                const cell = element.closest('td');
                if (!cell) return false;

                const fieldCode = cell.getAttribute('data-field-code');
                if (!fieldCode) return false;

                // 監視対象外のフィールドはスキップ
                if (this.shouldSkipField(fieldCode)) {
                    return false;
                }

                // イベントハンドラーを設定
                const handler = (event) => {
                    this.handleInputChange(element, cell, fieldCode, event);
                };

                // 複数のイベントを監視
                element.addEventListener('input', handler);
                element.addEventListener('change', handler);
                element.addEventListener('blur', handler);

                // contenteditable要素の場合
                if (element.contentEditable === 'true' || element.hasAttribute('contenteditable')) {
                    element.addEventListener('input', handler);
                }

                // 監視済みマークを付与
                this.monitoredElements.add(element);
                element.setAttribute('data-input-monitored', 'true');

                return true;

            } catch (error) {
                console.warn('⚠️ 入力監視設定エラー:', error);
                return false;
            }
        }

        /**
         * 入力変更ハンドラー
         * @param {HTMLElement} element - 入力要素
         * @param {HTMLElement} cell - セル要素
         * @param {string} fieldCode - フィールドコード
         * @param {Event} event - イベント
         */
        handleInputChange(element, cell, fieldCode, event) {
            try {
                // 値を取得
                let value = '';
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    value = element.value?.trim();
                } else if (element.tagName === 'SELECT') {
                    value = element.value;
                } else if (element.contentEditable === 'true') {
                    value = element.textContent?.trim();
                }

                // 値がある場合のみハイライト適用
                if (value && value !== '') {
                    // 手動入力検出ログは冗長なため削除
                    this.applyInputHighlight(cell, value);
                }

            } catch (error) {
                console.warn(`⚠️ 入力変更処理エラー [${fieldCode}]:`, error);
            }
        }

        /**
         * 手動入力ハイライトを適用
         * @param {HTMLElement} cell - セル要素
         * @param {string} value - 入力値
         */
        applyInputHighlight(cell, value) {
            try {
                // ハイライト適用ログは冗長なため削除
                
                const fieldCode = cell.getAttribute('data-field-code');
                const row = cell.closest('tr');
                
                if (row && fieldCode && window.cellStateManager) {
                    // 行番号の確認と自動設定
                    let rowId = row.getAttribute('data-row-id');
                    if (!rowId) {
                        console.warn('⚠️ 行番号が見つかりません - 自動設定を試行');
                        if (typeof window.cellStateManager.ensureRowId === 'function') {
                            rowId = window.cellStateManager.ensureRowId(row);
                            //console.log(`✅ 行番号自動設定: ${rowId}`);
                        } else {
                            console.warn('⚠️ 行番号自動設定機能が利用できません - フォールバック処理');
                            // フォールバック: 直接ハイライト適用
                            if (window.SimpleHighlightManager) {
                                window.SimpleHighlightManager.markCellAsModified(cell);
                            } else {
                                cell.classList.add('cell-modified');
                            }
                            return;
                        }
                    }
                    
                    // 🎯 手動入力時の行番号ベース初期状態管理
                    const originalAutoSave = window.cellStateManager.autoSaveInitialState;
                    
                    try {
                        // 🎯 行番号ベースの初期状態チェック
                        const hasInitialState = window.cellStateManager.rowInitialStates.has(rowId);
                        
                        // 手動入力初期状態チェックログは冗長なため削除
                        
                        if (!hasInitialState) {
                            //console.log(`📝 初期状態未保存 - 手動入力時の特別処理実行: 行番号=${rowId}`);
                            
                            // 手動入力時は初期状態がない場合でも変更として扱う
                            window.cellStateManager.autoSaveInitialState = false;
                            
                            // 直接ハイライト適用
                            if (window.SimpleHighlightManager) {
                                window.SimpleHighlightManager.markCellAsModified(cell);
                                window.cellStateManager.modifiedCells.add(cell);
                            } else {
                                cell.classList.add('cell-modified');
                            }
                            
                            // 行レベルハイライトも適用
                            if (window.SimpleHighlightManager) {
                                window.SimpleHighlightManager.markRowAsModified(row);
                            } else {
                                row.classList.add('row-modified');
                            }
                            
                            //console.log(`📝 手動入力直接ハイライト適用: ${fieldCode}`);
                        } else {
                            // 初期状態がある場合は通常のハイライト更新
                            window.cellStateManager.updateHighlightState(row, fieldCode);
                            // 手動入力通常ハイライト更新ログは冗長なため削除
                        }
                        
                    } finally {
                        window.cellStateManager.autoSaveInitialState = originalAutoSave;
                    }
                } else {
                    //console.log('📝 CellStateManager利用不可 - フォールバック処理');
                    // フォールバック: 直接ハイライト適用
                    if (window.SimpleHighlightManager) {
                        window.SimpleHighlightManager.markCellAsModified(cell);
                    } else {
                        cell.classList.add('cell-modified');
                    }
                    
                    if (row) {
                        if (window.SimpleHighlightManager) {
                            window.SimpleHighlightManager.markRowAsModified(row);
                        } else {
                            row.classList.add('row-modified');
                        }
                    }
                }
                
                // 手動入力マーカーを追加
                cell.setAttribute('data-manual-input', 'true');
                cell.setAttribute('data-input-timestamp', new Date().toISOString());
                
                // ハイライト適用完了ログは冗長なため削除
                
            } catch (error) {
                console.error('📝 手動入力ハイライト適用エラー:', error);
            }
        }

        /**
         * 監視対象外のフィールドかチェック
         * @param {string} fieldCode - フィールドコード
         * @returns {boolean} スキップするかどうか
         */
        shouldSkipField(fieldCode) {
            const skipFields = [
                '_hide_button',
                '_modification_checkbox', // ✅ チェックボックスフィールドを監視対象外に追加
                // 'integration_key', // 統合キー廃止により削除
                'seat_record_id',
                'pc_record_id',
                'ext_record_id',
                'user_record_id'
            ];
            
            return skipFields.includes(fieldCode);
        }

        /**
         * MutationObserverを設定（動的に追加される要素を監視）
         * @param {HTMLElement} tbody - テーブルボディ要素
         */
        setupMutationObserver(tbody) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 新しく追加された入力要素に監視を設定
                                const newInputs = node.querySelectorAll('input, select, textarea, [contenteditable]');
                                newInputs.forEach(input => {
                                    this.setupInputMonitoring(input);
                                });
                            }
                        });
                    }
                });
            });

            observer.observe(tbody, {
                childList: true,
                subtree: true
            });

            //console.log('📝 MutationObserver設定完了（動的要素監視）');
        }

        /**
         * 特定セルの監視を削除
         * @param {HTMLElement} cell - セル要素
         */
        removeMonitoring(cell) {
            const inputs = cell.querySelectorAll('input, select, textarea, [contenteditable]');
            inputs.forEach(input => {
                this.monitoredElements.delete(input);
                input.removeAttribute('data-input-monitored');
            });
        }

        /**
         * 診断情報を取得
         * @returns {Object} 診断情報
         */
        getDiagnostics() {
            const tbody = document.querySelector('#my-tbody, tbody');
            if (!tbody) return { error: 'テーブルが見つかりません' };

            const allInputs = tbody.querySelectorAll('input, select, textarea, [contenteditable]');
            const monitoredInputs = tbody.querySelectorAll('[data-input-monitored="true"]');
            const modifiedCells = tbody.querySelectorAll('.cell-modified');
            const manualInputCells = tbody.querySelectorAll('[data-manual-input="true"]');

            // 行番号ベース初期状態の診断情報
            const rowBasedDiagnostics = this.getRowBasedInputDiagnostics();

            return {
                totalInputs: allInputs.length,
                monitoredInputs: monitoredInputs.length,
                modifiedCells: modifiedCells.length,
                manualInputCells: manualInputCells.length,
                isInitialized: this.isInitialized,
                rowBasedDiagnostics: rowBasedDiagnostics
            };
        }

        /**
         * 🎯 行番号ベース手動入力診断情報を取得
         * @returns {Object} 行番号ベース診断情報
         */
        getRowBasedInputDiagnostics() {
            try {
                const tbody = document.querySelector('#my-tbody, tbody');
                if (!tbody) return { error: 'テーブルが見つかりません' };

                const rows = tbody.querySelectorAll('tr[data-row-id]');
                const rowDiagnostics = [];
                let totalWithInitialStates = 0;
                let totalWithoutInitialStates = 0;
                let totalManualInputs = 0;

                rows.forEach(row => {
                    const rowId = row.getAttribute('data-row-id');
                    const hasInitialState = window.cellStateManager && 
                                          window.cellStateManager.rowInitialStates && 
                                          window.cellStateManager.rowInitialStates.has(rowId);
                    
                    const manualInputCells = row.querySelectorAll('[data-manual-input="true"]');
                    const modifiedCells = row.querySelectorAll('.cell-modified');
                    
                    if (hasInitialState) totalWithInitialStates++;
                    else totalWithoutInitialStates++;
                    
                    totalManualInputs += manualInputCells.length;

                    rowDiagnostics.push({
                        rowId: rowId,
                        hasInitialState: hasInitialState,
                        manualInputCount: manualInputCells.length,
                        modifiedCellCount: modifiedCells.length,
                        // integrationKey: row.querySelector('input[data-field-code="integration_key"]')?.value || '未設定' // 統合キー廃止により削除
                    });
                });

                return {
                    totalRows: rows.length,
                    totalWithInitialStates: totalWithInitialStates,
                    totalWithoutInitialStates: totalWithoutInitialStates,
                    totalManualInputs: totalManualInputs,
                    rowDetails: rowDiagnostics.slice(0, 5), // 最初の5行のみ表示
                    timestamp: new Date().toISOString()
                };

            } catch (error) {
                return { error: `診断エラー: ${error.message}` };
            }
        }
    }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    // ManualInputMonitorをグローバルに公開
    window.ManualInputMonitor = ManualInputMonitor;

    // 🎯 グローバル診断機能
    window.debugManualInputMonitor = function() {
        //console.log('🎯=== 手動入力監視システム診断 ===');
        
        if (!window.manualInputMonitor) {
            console.log('❌ ManualInputMonitorが初期化されていません');
            return;
        }

        const diagnostics = window.manualInputMonitor.getDiagnostics();
        // console.log('📊 基本統計:', {
        //     総入力要素数: diagnostics.totalInputs,
        //     監視中要素数: diagnostics.monitoredInputs,
        //     変更済みセル数: diagnostics.modifiedCells,
        //     手動入力セル数: diagnostics.manualInputCells,
        //     初期化状態: diagnostics.isInitialized
        // });

        if (diagnostics.rowBasedDiagnostics) {
            const rowStats = diagnostics.rowBasedDiagnostics;
            // console.log('🎯 行番号ベース診断:', {
            //     総行数: rowStats.totalRows,
            //     初期状態あり: rowStats.totalWithInitialStates,
            //     初期状態なし: rowStats.totalWithoutInitialStates,
            //     手動入力総数: rowStats.totalManualInputs,
            //     診断時刻: rowStats.timestamp
            // });

            if (rowStats.rowDetails && rowStats.rowDetails.length > 0) {
                //console.log('📋 行別詳細（最初の5行）:');
                rowStats.rowDetails.forEach((detail, index) => {
                    // console.log(`  ${index + 1}. 行番号:${detail.rowId}`, {
                    //     初期状態: detail.hasInitialState ? '✅' : '❌',
                    //     手動入力: detail.manualInputCount,
                    //     変更セル: detail.modifiedCellCount,
                    //     // 統合キー: detail.integrationKey.substring(0, 30) + '...' // 統合キー廃止により削除
                    // });
                });
            }
        }

        //console.log('🎯=== 診断完了 ===');
        return diagnostics;
    };

    // 🎯 手動入力状態リセット機能
    window.resetManualInputStates = function() {
        //console.log('🔄 手動入力状態をリセット中...');
        
        const tbody = document.querySelector('#my-tbody, tbody');
        if (!tbody) {
            console.log('❌ テーブルが見つかりません');
            return;
        }

        // 手動入力マーカーを削除
        const manualInputCells = tbody.querySelectorAll('[data-manual-input="true"]');
        manualInputCells.forEach(cell => {
            cell.removeAttribute('data-manual-input');
            cell.removeAttribute('data-input-timestamp');
        });

        //console.log(`✅ ${manualInputCells.length}個のセルから手動入力マーカーを削除しました`);
    };

    // 🎯 行番号ベース手動入力診断（軽量版）
    window.debugRowBasedInputs = function() {
        if (!window.manualInputMonitor) {
            console.log('❌ ManualInputMonitorが初期化されていません');
            return;
        }

        const rowDiagnostics = window.manualInputMonitor.getRowBasedInputDiagnostics();
        if (rowDiagnostics.error) {
            console.log('❌', rowDiagnostics.error);
            return;
        }

        // console.log('🎯 行番号ベース手動入力診断サマリー:', {
        //     初期状態率: `${rowDiagnostics.totalWithInitialStates}/${rowDiagnostics.totalRows} (${Math.round(rowDiagnostics.totalWithInitialStates / rowDiagnostics.totalRows * 100)}%)`,
        //     平均手動入力: (rowDiagnostics.totalManualInputs / rowDiagnostics.totalRows).toFixed(2),
        //     問題行数: rowDiagnostics.totalWithoutInitialStates
        // });

        return rowDiagnostics;
    };

    // 自動初期化
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.manualInputMonitor) {
            window.manualInputMonitor = new ManualInputMonitor();
            window.manualInputMonitor.initialize();
        }
    });

    // ページ読み込み完了後にも実行（DOMContentLoadedが既に発火済みの場合）
    if (document.readyState === 'loading') {
        // DOMContentLoadedで処理される
    } else {
        // 既に読み込み完了している場合は即座に実行
        setTimeout(() => {
            if (!window.manualInputMonitor) {
                window.manualInputMonitor = new ManualInputMonitor();
                window.manualInputMonitor.initialize();
            }
        }, 100);
    }

    //console.log('📝 手動入力監視システムモジュールを読み込み完了');

})(); 