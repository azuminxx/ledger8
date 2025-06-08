/**
 * ✅ チェックボックス状態監視システム
 * @description row-modifiedやcell-modifiedクラスの変更を監視し、チェックボックス状態を自動更新
 */

(() => {
    'use strict';

    /**
     * ✅ チェックボックス状態監視マネージャー
     */
    class ModificationCheckboxMonitor {
        constructor() {
            this.observer = null;
            this.isInitialized = false;
            this.updateQueue = new Set(); // 更新待ちの行を管理
            this.updateTimer = null;
        }

        /**
         * 監視システムを初期化
         */
        initialize() {
            if (this.isInitialized) {
                //console.log('✅ チェックボックス監視システムは既に初期化済み');
                return;
            }

            this.waitForTableAndSetupMonitoring();
            this.isInitialized = true;
            //console.log('✅ チェックボックス監視システム初期化完了');
        }

        /**
         * テーブルの準備を待ってから監視を開始
         */
        waitForTableAndSetupMonitoring() {
            const checkTable = () => {
                const tbody = document.querySelector('#my-tbody, tbody');
                if (tbody) {
                    this.setupMutationObserver(tbody);
                    //console.log('✅ チェックボックス監視開始');
                } else {
                    //console.log('⏳ テーブル待機中...');
                    setTimeout(checkTable, 500);
                }
            };
            checkTable();
        }

        /**
         * MutationObserverを設定してクラス変更を監視
         * @param {HTMLElement} tbody - テーブルボディ要素
         */
        setupMutationObserver(tbody) {
            if (this.observer) {
                this.observer.disconnect();
            }

            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes') {
                        this.handleAttributeChange(mutation);
                    } else if (mutation.type === 'childList') {
                        this.handleChildListChange(mutation);
                    }
                });

                // バッチ更新を実行
                this.processBatchUpdate();
            });

            // 監視設定
            this.observer.observe(tbody, {
                attributes: true,
                attributeFilter: ['class'],
                childList: true,
                subtree: true
            });

            // 初期状態でのチェックボックス更新
            this.updateAllCheckboxes(tbody);
        }

        /**
         * クラス属性の変更を処理
         * @param {MutationRecord} mutation - 変更記録
         */
        handleAttributeChange(mutation) {
            const target = mutation.target;
            
            // 行のクラス変更（row-modified）
            if (target.tagName === 'TR' && target.classList.contains('row-modified')) {
                this.queueRowUpdate(target);
                
                // ✅ デバッグログ（フィーチャーフラグで制御）
                //if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
                //    console.log('🔍 行クラス変更検出:', target.getAttribute('data-row-id'));
                //}
            }
            
            // セルのクラス変更（cell-modified）
            if (target.tagName === 'TD' && target.classList.contains('cell-modified')) {
                const row = target.closest('tr');
                if (row) {
                    this.queueRowUpdate(row);
                    
                    // ✅ デバッグログ（フィーチャーフラグで制御）
                    //if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
                    //    console.log('🔍 セルクラス変更検出:', row.getAttribute('data-row-id'));
                    //}
                }
            }
        }

        /**
         * 子要素の追加・削除を処理
         * @param {MutationRecord} mutation - 変更記録
         */
        handleChildListChange(mutation) {
            // 新しく追加された行のチェックボックス状態を更新
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TR') {
                    this.queueRowUpdate(node);
                    
                    // ✅ デバッグログ（フィーチャーフラグで制御）
                    //if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
                    //    console.log('🔍 新規行追加検出:', node.getAttribute('data-row-id'));
                    //}
                }
            });
        }

        /**
         * 行の更新をキューに追加
         * @param {HTMLElement} row - 対象行
         */
        queueRowUpdate(row) {
            if (row && row.tagName === 'TR') {
                this.updateQueue.add(row);
            }
        }

        /**
         * バッチ更新を処理（デバウンス付き）
         */
        processBatchUpdate() {
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }

            this.updateTimer = setTimeout(() => {
                if (this.updateQueue.size > 0) {
                    // ✅ デバッグログ（フィーチャーフラグで制御）
                    //if (window.FEATURE_FLAGS && window.FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM) {
                    //    console.log(`🔍 バッチ更新実行: ${this.updateQueue.size}行`);
                    //}

                    this.updateQueue.forEach(row => {
                        this.updateCheckboxForRow(row);
                    });
                    
                    this.updateQueue.clear();
                }
            }, 100); // 100ms のデバウンス
        }

        /**
         * 特定の行のチェックボックス状態を更新
         * @param {HTMLElement} row - 対象行
         */
        updateCheckboxForRow(row) {
            // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
            // 自動更新は完全に無効化
            return;
            
            // 無効化されたコード:
            // if (window.TableElementFactory && typeof window.TableElementFactory.updateModificationCheckboxState === 'function') {
            //     window.TableElementFactory.updateModificationCheckboxState(row);
            // } else if (window.TableComponentsFactory && typeof window.TableComponentsFactory.updateModificationCheckboxState === 'function') {
            //     window.TableComponentsFactory.updateModificationCheckboxState(row);
            // }
        }

        /**
         * 全チェックボックス状態を更新
         * @param {HTMLElement} tbody - テーブルボディ要素
         */
        updateAllCheckboxes(tbody) {
            // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
            // 自動更新は完全に無効化
            return;
            
            // 無効化されたコード:
            // if (window.TableElementFactory && typeof window.TableElementFactory.updateAllModificationCheckboxes === 'function') {
            //     window.TableElementFactory.updateAllModificationCheckboxes(tbody);
            // } else if (window.TableComponentsFactory && typeof window.TableComponentsFactory.updateAllModificationCheckboxes === 'function') {
            //     window.TableComponentsFactory.updateAllModificationCheckboxes(tbody);
            // }
        }

        /**
         * 監視を停止
         */
        stop() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
                this.updateTimer = null;
            }
            
            this.updateQueue.clear();
            this.isInitialized = false;
            //console.log('✅ チェックボックス監視システム停止');
        }

        /**
         * 診断情報を取得
         * @returns {Object} 診断情報
         */
        getDiagnostics() {
            const tbody = document.querySelector('#my-tbody, tbody');
            if (!tbody) return { error: 'テーブルが見つかりません' };

            const allRows = tbody.querySelectorAll('tr');
            const rowsWithCheckbox = tbody.querySelectorAll('.modification-checkbox-cell');
            const checkedBoxes = tbody.querySelectorAll('.modification-checkbox:checked');
            const uncheckedBoxes = tbody.querySelectorAll('.modification-checkbox:not(:checked)');
            const modifiedRows = tbody.querySelectorAll('.row-modified');
            const modifiedCells = tbody.querySelectorAll('.cell-modified');
            const manuallyUncheckedRows = tbody.querySelectorAll('[data-checkbox-manually-unchecked]');

            return {
                monitoring: {
                    isInitialized: this.isInitialized,
                    observerActive: this.observer !== null,
                    queueSize: this.updateQueue.size
                },
                checkboxes: {
                    totalRows: allRows.length,
                    rowsWithCheckbox: rowsWithCheckbox.length,
                    checkedBoxes: checkedBoxes.length,
                    uncheckedBoxes: uncheckedBoxes.length,
                    manuallyUncheckedRows: manuallyUncheckedRows.length,
                    coverage: Math.round((rowsWithCheckbox.length / allRows.length) * 100)
                },
                modifications: {
                    modifiedRows: modifiedRows.length,
                    modifiedCells: modifiedCells.length
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    // =============================================================================
    // 🌐 グローバル設定とイベント
    // =============================================================================

    // グローバルインスタンスを作成
    window.modificationCheckboxMonitor = new ModificationCheckboxMonitor();

    // DOM読み込み完了後に自動初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.modificationCheckboxMonitor.initialize();
        });
    } else {
        // 既にDOMが読み込まれている場合は即座に初期化
        setTimeout(() => {
            window.modificationCheckboxMonitor.initialize();
        }, 100);
    }

    //console.log('✅ チェックボックス監視システム読み込み完了');

})(); 