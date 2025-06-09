/*!
 * 🎯 統合台帳システムv2 - テーブルイベント統合管理
 * @description テーブル全体のイベント処理・セル操作統合管理専用モジュール
 * @version 2.0.0
 * @created 2024-12
 * 
 * ✅ **責任範囲**
 * ✅ テーブルイベント初期化・統合管理
 * ✅ セルクリック・ダブルクリック処理の振り分け
 * ✅ グローバルクリック・キーボードイベント管理
 * ✅ 直接文字入力処理（上書き編集・絞り込み選択）
 * ✅ 他モジュール（編集・交換・選択）との連携管理
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ 具体的なインライン編集処理（inline-edit.jsの責任）
 * ❌ セル交換・ドラッグ&ドロップ処理（cell-swap.jsの責任）
 * ❌ セル選択・キーボード詳細処理（cell-selection.jsの責任）
 * ❌ テーブル描画・DOM構築（table-render.jsの責任）
 * ❌ スタイル定義（table-interaction.cssの責任）
 * 
 * 🎯 **管理対象イベント**
 * - セルクリック（1回・2回・ダブル）
 * - グローバルクリック（テーブル外クリック）
 * - グローバルキーボード（文字入力・F2・Enter）
 * - テーブル更新時の再初期化
 * 
 * 📦 **含まれるクラス**
 * - TableEventManager: テーブルイベント統合管理クラス
 * 
 * 🔗 **依存関係**
 * - InlineEditManager (インライン編集 - inline-edit.js)
 * - CellSwapManager (セル交換 - cell-swap.js)
 * - window.fieldsConfig (フィールド設定 - config.js)
 * - window.EDIT_MODES (編集モード定数 - config.js)
 * 
 * 💡 **使用例**
 * ```javascript
 * // 初期化
 * const tableEventManager = new TableEventManager();
 * tableEventManager.initializeTableEvents();
 * 
 * // セル交換の再初期化
 * tableEventManager.reinitializeCellSwap();
 * ```
 * 
 * 🎨 **処理の流れ**
 * 1. イベント発生 → TableEventManager が受信
 * 2. イベント種別判定 → 適切なモジュールに振り分け
 * 3. 各モジュール処理 → 結果をTableEventManagerが統合管理
 * 
 * 🔧 **統合管理項目**
 * - 編集状態の競合回避
 * - セル選択とセル編集の連携
 * - ドラッグ&ドロップと編集の排他制御
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.TableInteract = window.LedgerV2.TableInteract || {};

    // =============================================================================
    // 🎯 テーブルイベント統合管理
    // =============================================================================

    class TableEventManager {
        constructor() {
            // 他モジュールのインスタンス参照（分割後の新しい参照）
            this.inlineEditManager = window.LedgerV2.TableInteract.InlineEditManager || {
                startCellEdit: () => console.warn('⚠️ InlineEditManager not loaded'),
                isEditing: false
            };
            this.cellSwapManager = window.LedgerV2.TableInteract.cellSwapManager || {
                initializeDragDrop: () => console.warn('⚠️ CellSwapManager not loaded')
            };
            
            // 🆕 セル選択管理（将来的にcell-selection.jsに移動予定）
            this.selectedCell = null;
            this.lastClickTime = 0;
            this.clickDelay = 500; // ダブルクリック判定時間（ms）- 長めに設定
        }

        /**
         * テーブルイベント初期化
         */
        initializeTableEvents() {
            const tbody = document.querySelector('#my-tbody');
            if (!tbody) {
                console.warn('⚠️ テーブルボディが見つかりません');
                return;
            }

            // シングルクリックでセル選択（編集はしない）
            tbody.addEventListener('click', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell && cell.classList.contains('cell-editable')) {
                    this.selectCell(cell);
                } else {
                    this.clearCellSelection();
                }
            });

            tbody.addEventListener('dblclick', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell) {
                    this.handleCellDoubleClick(cell, e);
                }
            });

            // テーブル外クリックでセル選択を解除
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#table-container, #my-table, table')) {
                    this.clearCellSelection();
                }
            });

            // 🔄 セル交換のドラッグ&ドロップ初期化（初回）
            setTimeout(() => {
                if (this.cellSwapManager.initializeDragDrop) {
                    this.cellSwapManager.initializeDragDrop();
                }
            }, 100);
        }

        /**
         * セル選択処理
         */
        selectCell(cell) {
            // 前の選択を解除
            this.clearCellSelection();
            
            // 新しいセルを選択
            this.selectedCell = cell;
            cell.classList.add('cell-selected');
        }

        /**
         * セル選択をクリア
         */
        clearCellSelection() {
            if (this.selectedCell) {
                this.selectedCell.classList.remove('cell-selected');
                this.selectedCell = null;
            }
        }

        /**
         * セルダブルクリック処理（シンプル版）
         */
        handleCellDoubleClick(cell, event) {
            const fieldCode = cell.getAttribute('data-field-code');
            
            if (!this._isEditableField(fieldCode)) {
                return;
            }

            this.inlineEditManager.startCellEdit(cell);
        }

        /**
         * 編集可能フィールドかチェック
         */
        _isEditableField(fieldCode) {
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            
            if (!field) {
                return false;
            }
            
            // editableFromがALLのフィールドのみ編集可能
            if (field.editableFrom !== window.EDIT_MODES.ALL) {
                return false;
            }
            
            // cellTypeが input または dropdown/select のフィールドのみ編集可能
            const isValidCellType = field.cellType === 'input' || 
                                   field.cellType === 'dropdown' || 
                                   field.cellType === 'select';
            
            return isValidCellType;
        }

        /**
         * テーブル更新時の再初期化（外部から呼び出し用）
         */
        reinitializeCellSwap() {
            if (this.cellSwapManager.initializeDragDrop) {
                this.cellSwapManager.initializeDragDrop();
            }
        }
    }

    // =============================================================================
    // グローバルエクスポート
    // =============================================================================

    // LedgerV2名前空間にエクスポート
    window.LedgerV2.TableInteract.TableEventManager = TableEventManager;

    // インスタンス作成
    window.LedgerV2.TableInteract.tableEventManager = new TableEventManager();

    // レガシー互換性のためグローバルに割り当て
    window.tableEventManager = window.LedgerV2.TableInteract.tableEventManager;

    // セル交換の再初期化用ヘルパー関数
    window.reinitializeCellSwap = function() {
        if (window.cellSwapManager) {
            window.cellSwapManager.initializeDragDrop();
        }
    };

    console.log('🎯 テーブルイベント統合管理モジュール読み込み完了');

})(); 