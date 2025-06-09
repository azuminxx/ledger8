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
            // 既に同じセルを編集中の場合はスキップ
            if (this.isEditing && this.currentEditCell === cell) {
                return;
            }

            // 別のセルを編集中の場合は先に終了
            if (this.isEditing && this.currentEditCell !== cell) {
                this.finishEdit();
            }

            this.currentEditCell = cell;
            this.isEditing = true;

            // 🎯 編集中クラスを追加（Excel風スタイル用）
            cell.classList.add('editing');

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

            if ((field.cellType === 'select' || field.cellType === 'dropdown') && field.options) {
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
                    // オプションが文字列の場合とオブジェクトの場合に対応
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    
                    optionElement.value = optionValue;
                    optionElement.textContent = optionLabel;
                    if (optionValue === currentValue) {
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
            if (!this.isEditing || !this.currentEditCell) {
                console.warn('⚠️ finishEdit: 編集状態ではありません', {
                    isEditing: this.isEditing,
                    currentEditCell: !!this.currentEditCell
                });
                return;
            }

            const input = this.currentEditCell.querySelector('input, select');
            if (!input) {
                this._cleanup();
                return;
            }

            const newValue = input.value;
            const row = this.currentEditCell.closest('tr');
            
            // ✨ 真の初期値と比較（data-original-value属性を使用）
            const originalValue = this.currentEditCell.getAttribute('data-original-value') || '';

            // 値の変更を検出
            if (newValue !== originalValue) {
                this.currentEditCell.textContent = newValue;
                
                // セルと行をハイライト
                StyleManager.highlightModifiedCell(this.currentEditCell);
                StyleManager.highlightModifiedRow(row);

            } else {
                this.currentEditCell.textContent = originalValue;
                
                // 元の値に戻した場合はハイライトを削除
                StyleManager.removeHighlight(this.currentEditCell);
                
                // 行内の他のセルに変更がない場合は行のハイライトも削除
                const modifiedCellsInRow = row.querySelectorAll('.cell-modified');
                if (modifiedCellsInRow.length === 0) {
                    StyleManager.removeHighlight(row);
                }
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
            // 🎯 編集中クラスを削除
            if (this.currentEditCell) {
                this.currentEditCell.classList.remove('editing');
            }
            
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
            
            // 🆕 セル選択管理
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

            // イベント委譲でセルイベントを管理
            tbody.addEventListener('click', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell) {
                    this.handleCellClick(cell, e);
                } else {
                    // セル以外をクリックした場合（ヘッダーなど）はセル選択を解除
                    this._clearCellSelection();
                }
            });

            tbody.addEventListener('dblclick', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell) {
                    this.handleCellDoubleClick(cell, e);
                }
            });

            // 🆕 グローバルクリックイベント（テーブル外クリック対応）
            document.addEventListener('click', (e) => {
                this.handleGlobalClick(e);
            });

            // 🆕 グローバルキーボードイベント
            document.addEventListener('keydown', (e) => {
                this.handleGlobalKeydown(e);
            });

        }

        /**
         * 🆕 グローバルキーボードイベント処理
         */
        handleGlobalKeydown(event) {
            // 編集中の場合はスキップ
            if (this.inlineEditManager.isEditing) {
                return;
            }

            // セルが選択されていない場合はスキップ
            if (!this.selectedCell) {
                return;
            }

            // 入力可能な文字キーの場合
            if (this._isTextKey(event.key, event)) {
                event.preventDefault();
                this._handleDirectTextInput(this.selectedCell, event.key);
            }
            // F2キーの場合
            else if (event.key === 'F2') {
                event.preventDefault();
                this._startInPlaceEdit(this.selectedCell);
            }
            // Enterキーの場合
            else if (event.key === 'Enter') {
                event.preventDefault();
                this._startInPlaceEdit(this.selectedCell);
            }
        }

        /**
         * 🆕 文字キー判定
         */
        _isTextKey(key, event) {
            // 日本語入力、英数字、記号など
            return (
                key.length === 1 && 
                !event.ctrlKey && 
                !event.altKey && 
                !event.metaKey &&
                key !== ' ' // スペースは除外（特別処理のため）
            );
        }

        /**
         * 🆕 直接文字入力処理
         */
        _handleDirectTextInput(cell, inputChar) {
            const fieldCode = cell.getAttribute('data-field-code');
            
            if (!this._isEditableField(fieldCode)) {
                return;
            }

            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            
            if (field.cellType === 'input') {
                // INPUT: 上書き編集開始
                this._startOverwriteEdit(cell, inputChar);
            } else if (field.cellType === 'dropdown' || field.cellType === 'select') {
                // SELECT: 絞り込み選択
                this._startFilterSelect(cell, inputChar);
            }
        }

        /**
         * 🆕 上書き編集開始（INPUT用）
         */
        _startOverwriteEdit(cell, initialChar) {
            // 編集モード開始
            this.inlineEditManager.startCellEdit(cell);
            
            // 入力欄に初期文字を設定（上書き）
            setTimeout(() => {
                const input = cell.querySelector('input');
                if (input) {
                    input.value = initialChar;
                    input.setSelectionRange(1, 1); // カーソルを末尾に
                }
            }, 10);
        }

        /**
         * 🆕 絞り込み選択（SELECT用）
         */
        _startFilterSelect(cell, inputChar) {
            const field = window.fieldsConfig.find(f => f.fieldCode === cell.getAttribute('data-field-code'));
            
            if (!field || !field.options) return;

            // 入力文字で始まる選択肢を検索
            const matchingOption = field.options.find(option => {
                const optionValue = typeof option === 'string' ? option : option.label;
                return optionValue.toLowerCase().startsWith(inputChar.toLowerCase());
            });

            if (matchingOption) {
                const selectedValue = typeof matchingOption === 'string' ? matchingOption : matchingOption.value;
                
                // セル値を直接更新
                cell.textContent = selectedValue;
                
                // 初期値と比較してハイライト制御
                const originalValue = cell.getAttribute('data-original-value') || '';
                if (selectedValue !== originalValue) {
                    StyleManager.highlightModifiedCell(cell);
                    StyleManager.highlightModifiedRow(cell.closest('tr'));
                } else {
                    StyleManager.removeHighlight(cell);
                    const row = cell.closest('tr');
                    const modifiedCellsInRow = row.querySelectorAll('.cell-modified');
                    if (modifiedCellsInRow.length === 0) {
                        StyleManager.removeHighlight(row);
                    }
                }
            }
        }

        /**
         * 🆕 カーソル位置編集（2回クリック用）
         */
        _startInPlaceEdit(cell) {
            const fieldCode = cell.getAttribute('data-field-code');
            
            if (!this._isEditableField(fieldCode)) {
                return;
            }

            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            
            if (field.cellType === 'input') {
                this.inlineEditManager.startCellEdit(cell);
            } else if (field.cellType === 'dropdown' || field.cellType === 'select') {
                this.inlineEditManager.startCellEdit(cell);
                
                // ドロップダウンを即座に開く
                setTimeout(() => {
                    const select = cell.querySelector('select');
                    if (select) {
                        select.focus();
                        select.click(); // ドロップダウン展開
                    }
                }, 10);
            }
        }

        /**
         * 🆕 セル選択処理
         */
        _selectCell(cell) {
            // 前のセル選択を解除
            if (this.selectedCell) {
                this.selectedCell.classList.remove('cell-selected');
            }
            
            // 新しいセルを選択
            this.selectedCell = cell;
            if (cell) {
                cell.classList.add('cell-selected');
            }
        }

        /**
         * 🆕 セル選択をクリア
         */
        _clearCellSelection() {
            if (this.selectedCell) {
                this.selectedCell.classList.remove('cell-selected');
                this.selectedCell = null;
            }
        }

        /**
         * 🆕 グローバルクリックイベント処理
         */
        handleGlobalClick(event) {
            // 編集中の場合はスキップ
            if (this.inlineEditManager.isEditing) {
                return;
            }

            // テーブル内をクリックした場合はスキップ（テーブル内の処理に委ねる）
            const tableContainer = event.target.closest('#table-container, #my-table, table');
            if (tableContainer) {
                return;
            }

            // テーブル外をクリックした場合はセル選択を解除
            this._clearCellSelection();
        }

        /**
         * セルクリック処理（拡張版）
         */
        handleCellClick(cell, event) {
            // 編集中の場合はスキップ
            if (this.inlineEditManager.isEditing) {
                return;
            }

            // cell-editableクラスがないセルの場合はセル選択を解除
            if (!cell.classList.contains('cell-editable')) {
                this._clearCellSelection();
                return;
            }

            const now = Date.now();
            const timeDiff = now - this.lastClickTime;
            
            // 同じセルの2回目クリック判定
            if (this.selectedCell === cell && timeDiff < this.clickDelay) {
                this._startInPlaceEdit(cell);
            } else {
                this._selectCell(cell);
            }
            
            this.lastClickTime = now;
        }

        /**
         * セルダブルクリック処理（既存）
         */
        handleCellDoubleClick(cell, event) {
            const fieldCode = cell.getAttribute('data-field-code');
            
            // 編集不可フィールドをスキップ
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



})();