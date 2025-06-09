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
                console.log('🔄 同じセルは既に編集中です');
                return;
            }

            // 別のセルを編集中の場合は先に終了
            if (this.isEditing && this.currentEditCell !== cell) {
                console.log('🔄 編集中のセルがあります。先に終了します。');
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

                console.log(`✏️ セル値更新: "${originalValue}" → "${newValue}"`);
            } else {
                this.currentEditCell.textContent = originalValue;
                
                // 元の値に戻した場合はハイライトを削除
                StyleManager.removeHighlight(this.currentEditCell);
                
                // 行内の他のセルに変更がない場合は行のハイライトも削除
                const modifiedCellsInRow = row.querySelectorAll('.cell-modified');
                if (modifiedCellsInRow.length === 0) {
                    StyleManager.removeHighlight(row);
                }

                console.log(`🔄 セル値を元に戻しました: "${newValue}" → "${originalValue}"`);
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
            console.log('🧹 編集状態クリーンアップ');
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
                }
            });

            tbody.addEventListener('dblclick', (e) => {
                const cell = e.target.closest('td[data-field-code]');
                if (cell) {
                    this.handleCellDoubleClick(cell, e);
                }
            });

            // 🆕 グローバルキーボードイベント
            document.addEventListener('keydown', (e) => {
                this.handleGlobalKeydown(e);
            });

            console.log('🎯 テーブルイベント初期化完了（Excel風編集対応）');
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

            console.log(`⌨️ キー入力: "${event.key}" - セル: ${this.selectedCell.getAttribute('data-field-code')}`);

            // 入力可能な文字キーの場合
            if (this._isTextKey(event.key, event)) {
                console.log(`📝 文字キー検出: "${event.key}"`);
                event.preventDefault();
                this._handleDirectTextInput(this.selectedCell, event.key);
            }
            // F2キーの場合
            else if (event.key === 'F2') {
                console.log(`🔧 F2キー検出`);
                event.preventDefault();
                this._startInPlaceEdit(this.selectedCell);
            }
            // Enterキーの場合
            else if (event.key === 'Enter') {
                console.log(`↩️ Enterキー検出`);
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
            
            console.log(`📝 直接文字入力: フィールド="${fieldCode}", 入力文字="${inputChar}"`);
            
            if (!this._isEditableField(fieldCode)) {
                console.log(`❌ 編集不可フィールドのため処理をスキップ`);
                return;
            }

            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            
            console.log(`✅ 編集可能フィールド確認済み, cellType: ${field.cellType}`);
            
            if (field.cellType === 'input') {
                // INPUT: 上書き編集開始
                console.log(`📝 INPUT処理開始`);
                this._startOverwriteEdit(cell, inputChar);
            } else if (field.cellType === 'dropdown' || field.cellType === 'select') {
                // SELECT: 絞り込み選択
                console.log(`📋 SELECT処理開始`);
                this._startFilterSelect(cell, inputChar);
            }
        }

        /**
         * 🆕 上書き編集開始（INPUT用）
         */
        _startOverwriteEdit(cell, initialChar) {
            console.log(`✏️ 上書き編集開始: ${cell.getAttribute('data-field-code')} = "${initialChar}"`);
            
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
                
                console.log(`🔍 絞り込み選択: ${cell.getAttribute('data-field-code')} = "${selectedValue}"`);
                
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
                console.log(`✏️ カーソル位置編集開始: ${fieldCode}`);
                this.inlineEditManager.startCellEdit(cell);
            } else if (field.cellType === 'dropdown' || field.cellType === 'select') {
                console.log(`📋 ドロップダウン展開: ${fieldCode}`);
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
                console.log(`🔄 前のセル選択解除: ${this.selectedCell.getAttribute('data-field-code')}`);
            }
            
            // 新しいセルを選択
            this.selectedCell = cell;
            if (cell) {
                cell.classList.add('cell-selected');
                console.log(`🎯 セル選択: ${cell.getAttribute('data-field-code')} - class追加: ${cell.classList.contains('cell-selected')}`);
                
                // デバッグ: セルのクラス一覧を表示
                console.log(`📋 セルクラス一覧: ${cell.className}`);
            }
        }

        /**
         * セルクリック処理（拡張版）
         */
        handleCellClick(cell, event) {
            // 編集中の場合はスキップ
            if (this.inlineEditManager.isEditing) {
                console.log(`⏭️ 編集中のため、クリックをスキップ`);
                return;
            }

            // cell-editableクラスがないセルはスキップ
            if (!cell.classList.contains('cell-editable')) {
                console.log(`⏭️ 編集不可セルのため、選択をスキップ: ${cell.getAttribute('data-field-code')}`);
                return;
            }

            const now = Date.now();
            const timeDiff = now - this.lastClickTime;
            
            console.log(`🖱️ セルクリック: ${cell.getAttribute('data-field-code')} (時間差: ${timeDiff}ms)`);
            
            // 同じセルの2回目クリック判定
            if (this.selectedCell === cell && timeDiff < this.clickDelay) {
                console.log(`🖱️ 2回目クリック検出: ${cell.getAttribute('data-field-code')} (${timeDiff}ms < ${this.clickDelay}ms)`);
                this._startInPlaceEdit(cell);
            } else {
                console.log(`🖱️ 通常クリック: ${cell.getAttribute('data-field-code')}`);
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

            console.log(`✏️ ダブルクリック編集開始: ${fieldCode}`);
            this.inlineEditManager.startCellEdit(cell);
        }

        /**
         * 編集可能フィールドかチェック
         */
        _isEditableField(fieldCode) {
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            
            console.log(`🔍 編集可能性チェック: ${fieldCode}`);
            console.log(`  - フィールド見つかった: ${!!field}`);
            
            if (!field) {
                console.log(`  - 結果: false (フィールド未定義)`);
                return false;
            }
            
            console.log(`  - editableFrom: ${field.editableFrom} (期待値: ${window.EDIT_MODES.ALL})`);
            console.log(`  - cellType: ${field.cellType}`);
            
            // editableFromがALLのフィールドのみ編集可能
            if (field.editableFrom !== window.EDIT_MODES.ALL) {
                console.log(`  - 結果: false (editableFrom不一致)`);
                return false;
            }
            
            // cellTypeが input または dropdown/select のフィールドのみ編集可能
            const isValidCellType = field.cellType === 'input' || 
                                   field.cellType === 'dropdown' || 
                                   field.cellType === 'select';
            
            console.log(`  - 結果: ${isValidCellType} (cellType判定)`);
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

    console.log('📱 table-interact.js 読み込み完了 [8KB]');

})();