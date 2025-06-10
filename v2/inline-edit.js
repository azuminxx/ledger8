/**
 * =============================================================================
 * 📝 LedgerV2 - インライン編集機能モジュール (v2.0)
 * =============================================================================
 * 
 * 【責任範囲】
 * ✅ セルのインライン編集（input/selectフィールド生成・値保存）
 * ✅ Enter/Escapeキーによる編集完了・キャンセル
 * ✅ ダブルクリックによる編集開始
 * ✅ 編集可能フィールドの判定と入力要素生成
 * 
 * 【対象フィールド】
 * - 編集可能セル全般（data-editable="true"）
 * - テキスト入力フィールド、選択フィールド
 * 
 * 【パフォーマンス】
 * - 軽量化: 最小限のDOM操作とイベント処理
 * - メモリ効率: 不要なリスナー蓄積なし
 */

(() => {
    'use strict';

    class InlineEditManager {
        constructor() {
            this.currentEditCell = null;
            this.isEditing = false;
        }

        /**
         * セル編集開始
         */
        startCellEdit(cell) {
            // 🆕 閲覧モード時は編集開始を無効化
            if (!this._isEditModeActive()) {
                return;
            }
            
            if (this.isEditing) {
                this.finishEdit();
            }

            this.currentEditCell = cell;
            this.isEditing = true;
            
            cell.classList.add('editing');

            const fieldCode = cell.getAttribute('data-field-code');
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);

            if (field) {
                this._createInput(cell, field);
            }
        }

        /**
         * 入力要素作成
         */
        _createInput(cell, field) {
            const currentValue = cell.textContent;
            cell.innerHTML = '';

            let input;

            if ((field.cellType === 'select' || field.cellType === 'dropdown') && field.options) {
                input = document.createElement('select');
                input.style.cssText = 'width:100%;border:1px solid #ccc;padding:2px';

                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '';
                input.appendChild(emptyOption);

                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
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
                input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.style.cssText = 'width:100%;border:1px solid #ccc;padding:2px';
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

            const cell = this.currentEditCell;
            const input = cell.querySelector('input, select');
            
            if (input) {
                const newValue = input.value;
                
                cell.innerHTML = '';
                cell.textContent = newValue;

                // ハイライト制御（共通ヘルパー使用）
                window.CommonHighlightHelper.updateCellAndRowHighlight(cell, newValue);
            }

            this._cleanup();
        }

        /**
         * 編集キャンセル
         */
        cancelEdit() {
            if (!this.isEditing || !this.currentEditCell) return;

            const cell = this.currentEditCell;
            const originalValue = cell.getAttribute('data-original-value') || '';
            
            cell.innerHTML = '';
            cell.textContent = originalValue;

            this._cleanup();
        }

        /**
         * 状態クリア
         */
        _cleanup() {
            if (this.currentEditCell) {
                this.currentEditCell.classList.remove('editing');
                this.currentEditCell.classList.remove('cell-selected');
            }
            
            this.currentEditCell = null;
            this.isEditing = false;
        }
        
        // 🆕 編集モードが有効かチェック
        _isEditModeActive() {
            return window.TableEditMode && window.TableEditMode.isEditMode;
        }
        
        // 🆕 編集モード変更時の処理（外部から呼び出し用）
        onEditModeChanged(isEditMode) {
            // 閲覧モードに切り替わった時、編集中なら強制終了
            if (!isEditMode && this.isEditing) {
                this.finishEdit();
            }
        }
    }

    // グローバル公開
    const inlineEditManager = new InlineEditManager();
    window.LedgerV2.TableInteract.InlineEditManager = inlineEditManager;

})(); 