/*!
 * 📊 統合台帳システムv2 - テーブルインタラクション機能
 * 🎯 ユーザー操作・編集・イベント処理専用モジュール
 * 
 * ✅ **責任範囲**
 * ✅ インライン編集管理（クリック編集・入力処理・値変更検出）
 * ✅ ドラッグ&ドロップ操作（セル間コピー・移動）
 * ✅ テーブルイベント処理（クリック・ダブルクリック・キーボード）
 * ✅ ユーザーインタラクション統合管理
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ テーブル描画・表示（table-render.jsの責任）
 * ❌ ページネーション処理（table-pagination.jsの責任）
 * ❌ システム初期化・ヘッダー管理（table-header.jsの責任）
 * ❌ API通信・データ統合（core.jsの責任）
 * 
 * 📦 **含まれるクラス**
 * - InlineEditManager: インライン編集管理
 * - DragDropManager: ドラッグ&ドロップ管理
 * - TableEventManager: テーブルイベント管理
 * 
 * 🔗 **依存関係**
 * - StyleManager (スタイル管理)
 * - CellValueHelper (セル値操作)
 * - window.fieldsConfig (フィールド設定)
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.TableInteract = {};



    // =============================================================================
    // インライン編集管理
    // =============================================================================

    class InlineEditManager {
        constructor() {
            this.currentEditCell = null;
            this.isEditing = false;
        }

        /**
         * セル編集開始
         */
        startCellEdit(cell) {
            if (this.isEditing) {
                this.finishEdit();
            }

            this.currentEditCell = cell;
            this.isEditing = true;

            // セルの現在の値を保存
            this.originalValue = cell.textContent;

            const fieldCode = cell.getAttribute('data-field-code');
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);

            if (field) {
                this._convertToEditMode(cell, field);
            }
        }

        /**
         * 編集モードに変換
         */
        _convertToEditMode(cell, field) {
            const currentValue = cell.textContent;
            cell.innerHTML = '';

            let input;

            if (field.cellType === 'select' && field.options) {
                // セレクトボックス作成
                input = document.createElement('select');
                input.style.width = '100%';
                input.style.border = '1px solid #ccc';
                input.style.padding = '2px';

                // 空のオプション
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '';
                input.appendChild(emptyOption);

                // オプション追加
                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    if (option === currentValue) {
                        optionElement.selected = true;
                    }
                    input.appendChild(optionElement);
                });
            } else {
                // 通常の入力フィールド
                input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.style.width = '100%';
                input.style.border = '1px solid #ccc';
                input.style.padding = '2px';
            }

            input.addEventListener('blur', () => this.finishEdit());
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.finishEdit();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });

            cell.appendChild(input);
            input.focus();
        }

        /**
         * 編集完了
         */
        finishEdit() {
            if (!this.isEditing || !this.currentEditCell) return;

            const input = this.currentEditCell.querySelector('input, select');
            if (!input) {
                this._cleanup();
                return;
            }

            const newValue = input.value;
            const row = this.currentEditCell.closest('tr');

            // 値の変更を検出
            if (newValue !== this.originalValue) {
                this.currentEditCell.textContent = newValue;
                
                // セルと行をハイライト
                StyleManager.highlightModifiedCell(this.currentEditCell);
                StyleManager.highlightModifiedRow(row);

                console.log(`✏️ セル値更新: ${this.originalValue} → ${newValue}`);
            } else {
                this.currentEditCell.textContent = this.originalValue;
            }

            this._cleanup();
        }

        /**
         * 編集キャンセル
         */
        cancelEdit() {
            if (!this.isEditing || !this.currentEditCell) return;

            // 元の値に戻す
            this.currentEditCell.textContent = this.originalValue;
            this._cleanup();
        }

        /**
         * 編集状態をクリーンアップ
         */
        _cleanup() {
            this.currentEditCell = null;
            this.isEditing = false;
            this.originalValue = null;
        }
    }

    // =============================================================================
    // ドラッグ&ドロップ管理
    // =============================================================================

    class DragDropManager {
        constructor() {
            this.draggedElement = null;
            this.draggedValue = null;
            this.isDragging = false;
        }

        /**
         * ドラッグ開始
         */
        startDrag(cell, event) {
            this.draggedElement = cell;
            this.draggedValue = CellValueHelper.getValue(cell);
            this.isDragging = true;

            cell.style.opacity = '0.5';
            console.log(`🖱️ ドラッグ開始: ${this.draggedValue}`);
        }

        /**
         * ドロップ処理
         */
        handleDrop(targetCell, event) {
            if (!this.isDragging || !this.draggedElement) return;

            event.preventDefault();

            // 値をコピー/移動
            CellValueHelper.setValue(targetCell, this.draggedValue);

            // ターゲットセルをハイライト
            StyleManager.highlightModifiedCell(targetCell);
            StyleManager.highlightModifiedRow(targetCell.closest('tr'));

            console.log(`📦 ドロップ完了: ${this.draggedValue} → ${targetCell.getAttribute('data-field-code')}`);

            this.endDrag();
        }

        /**
         * ドラッグ終了
         */
        endDrag() {
            if (this.draggedElement) {
                this.draggedElement.style.opacity = '';
            }
            
            this.draggedElement = null;
            this.draggedValue = null;
            this.isDragging = false;
        }
    }

    // =============================================================================
    // テーブルイベント管理
    // =============================================================================

    class TableEventManager {
        constructor() {
            this.inlineEditManager = new InlineEditManager();
            this.dragDropManager = new DragDropManager();
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

            // イベント委譲でセルイベントを管理
            tbody.addEventListener('click', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell) {
                    this.handleCellClick(cell, e);
                }
            });

            tbody.addEventListener('dblclick', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell) {
                    this.handleCellDoubleClick(cell, e);
                }
            });

            console.log('🎯 テーブルイベント初期化完了');
        }

        /**
         * セルクリック処理
         */
        handleCellClick(cell, event) {
            // 編集中でない場合のみ処理
            if (!this.inlineEditManager.isEditing) {
                console.log(`🖱️ セルクリック: ${cell.getAttribute('data-field-code')}`);
            }
        }

        /**
         * セルダブルクリック処理
         */
        handleCellDoubleClick(cell, event) {
            const fieldCode = cell.getAttribute('data-field-code');
            
            // 編集不可フィールドをスキップ
            if (!this._isEditableField(fieldCode)) {
                return;
            }

            console.log(`✏️ セル編集開始: ${fieldCode}`);
            this.inlineEditManager.startCellEdit(cell);
        }

        /**
         * 編集可能フィールドかチェック
         */
        _isEditableField(fieldCode) {
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            return field && !field.readonly && field.cellType !== 'link';
        }
    }

    // =============================================================================
    // グローバルエクスポート
    // =============================================================================

    // LedgerV2名前空間にエクスポート
    window.LedgerV2.TableInteract.InlineEditManager = InlineEditManager;
    window.LedgerV2.TableInteract.DragDropManager = DragDropManager;
    window.LedgerV2.TableInteract.TableEventManager = TableEventManager;

    // インスタンス作成
    window.LedgerV2.TableInteract.inlineEditManager = new InlineEditManager();
    window.LedgerV2.TableInteract.dragDropManager = new DragDropManager();
    window.LedgerV2.TableInteract.tableEventManager = new TableEventManager();

    // レガシー互換性のためグローバルに割り当て
    window.inlineEditManager = window.LedgerV2.TableInteract.inlineEditManager;
    window.dragDropManager = window.LedgerV2.TableInteract.dragDropManager;
    window.tableEventManager = window.LedgerV2.TableInteract.tableEventManager;

    console.log('📱 table-interact.js 読み込み完了 [8KB]');

})();