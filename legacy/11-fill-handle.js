/**
 * 📋 フィルハンドル機能 - Fill Handle Feature
 * @description Excelライクなフィルハンドル機能を提供
 * @version 1.0.0
 */

(function() {
    'use strict';

    // =============================================================================
    // 📋 フィルハンドルマネージャー
    // =============================================================================

    class FillHandleManager {
        constructor() {
            this.isActive = false;
            this.startCell = null;
            this.currentSelection = [];
            this.fillDirection = null; // 'up' | 'down'
            this.originalValue = null;
            this.targetFieldCode = null;
            
            // イベントハンドラーをバインド
            this.handleMouseMove = this.handleMouseMove.bind(this);
            this.handleMouseUp = this.handleMouseUp.bind(this);
        }

        /**
         * フィルハンドル機能を初期化
         */
        initialize() {
            //console.log('📋 フィルハンドル機能を初期化中...');
            this.setupGlobalEventListeners();
        }

        /**
         * グローバルイベントリスナーを設定
         */
        setupGlobalEventListeners() {
            // ドキュメント全体でのマウス移動とマウスアップを監視
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        }

        /**
         * セルにフィルハンドルを追加
         * @param {HTMLElement} cell - 対象セル
         * @param {Object} fieldConfig - フィールド設定
         * @param {string} value - セルの値
         * @param {Object} record - レコード情報
         */
        addFillHandleToCell(cell, fieldConfig, value, record) {
            // allowFillHandleがtrueのフィールドのみ対象
            if (!fieldConfig.allowFillHandle) {
                return;
            }

            // 🔧 重複チェック：既にフィルハンドルが追加済みかチェック
            if (cell.querySelector('.fill-handle')) {
                return; // 既に追加済みの場合はスキップ
            }

            // セルにフィルハンドル対応クラスを追加
            cell.classList.add('cell-with-fill-handle');

            // フィルハンドル要素を作成
            const fillHandle = document.createElement('div');
            fillHandle.className = 'fill-handle';
            fillHandle.setAttribute('data-field-code', fieldConfig.fieldCode);
            
            // フィルハンドルのイベントを設定
            this.setupFillHandleEvents(fillHandle, cell, fieldConfig, value, record);
            
            // セルにフィルハンドルを追加
            cell.appendChild(fillHandle);

            // console.log(`📋 フィルハンドルを追加完了: ${fieldConfig.fieldCode} = "${value}"`);
        }

        /**
         * フィルハンドルのイベントを設定
         * @param {HTMLElement} fillHandle - フィルハンドル要素
         * @param {HTMLElement} cell - 親セル
         * @param {Object} fieldConfig - フィールド設定 
         * @param {string} value - セルの値
         * @param {Object} record - レコード情報
         */
        setupFillHandleEvents(fillHandle, cell, fieldConfig, value, record) {
            // フィルハンドル要素のイベント
            fillHandle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.startFillOperation(fillHandle, cell, fieldConfig, value, record);
            });

            fillHandle.addEventListener('mouseenter', (e) => {
                fillHandle.style.opacity = '1';
            });

            fillHandle.addEventListener('mouseleave', (e) => {
                if (!this.isActive) {
                    fillHandle.style.opacity = '0';
                }
            });

            // 🔧 セル全体での右下領域クリック検出（範囲拡大）
            cell.addEventListener('mousedown', (e) => {
                const rect = cell.getBoundingClientRect();
                const cellWidth = rect.width;
                const cellHeight = rect.height;
                
                // クリック位置がセルの右下15x15pxエリア内かチェック
                const isInBottomRightArea = 
                    e.clientX >= rect.left + cellWidth - 15 && 
                    e.clientY >= rect.top + cellHeight - 15;
                
                if (isInBottomRightArea) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // フィルハンドル操作として処理
                    this.startFillOperation(fillHandle, cell, fieldConfig, value, record);
                }
            });
        }

        /**
         * フィル操作を開始
         * @param {HTMLElement} fillHandle - フィルハンドル要素
         * @param {HTMLElement} startCell - 開始セル
         * @param {Object} fieldConfig - フィールド設定
         * @param {string} value - 開始値（初期値、使用しない）
         * @param {Object} record - レコード情報
         */
        startFillOperation(fillHandle, startCell, fieldConfig, value, record) {
            // 🔧 セルの現在値を動的に取得（初期値ではなく）
            const currentValue = this.getCurrentCellValue(startCell);
            //console.log(`📋 フィル操作開始: ${fieldConfig.fieldCode} = "${currentValue}" (初期値: "${value}")`);
            
            this.isActive = true;
            this.startCell = startCell;
            this.originalValue = currentValue; // 🔧 現在値を使用
            this.targetFieldCode = fieldConfig.fieldCode;
            this.currentSelection = [startCell];
            
            // ドラッグ開始セルにも既存のスタイルを適用
            if (window.SimpleHighlightManager) {
                window.SimpleHighlightManager.markCellAsModified(startCell);
            }
            // ドラッグ中のソースセル識別用マーカー
            startCell.setAttribute('data-fill-source', 'true');
            
            // フィルハンドルにドラッグ中クラスを追加
            fillHandle.classList.add('dragging');
            
            // ドキュメントの選択を無効化
            document.body.style.userSelect = 'none';
            
            // カーソルを変更
            document.body.style.cursor = 'crosshair';
        }

        /**
         * マウス移動時の処理
         * @param {MouseEvent} e - マウスイベント
         */
        handleMouseMove(e) {
            if (!this.isActive) return;

            const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
            if (!elementUnderCursor) return;

            // セル要素を取得
            const targetCell = elementUnderCursor.closest('td');
            if (!targetCell) return;

            // 同じフィールドのセルかチェック
            const targetFieldCode = targetCell.getAttribute('data-field-code');
            if (targetFieldCode !== this.targetFieldCode) return;

            // 開始セルの行インデックスを取得
            const startRow = this.startCell.closest('tr');
            const targetRow = targetCell.closest('tr');
            
            const startRowIndex = Array.from(startRow.parentElement.children).indexOf(startRow);
            const targetRowIndex = Array.from(targetRow.parentElement.children).indexOf(targetRow);

            // 方向を決定
            let direction = null;
            if (targetRowIndex < startRowIndex) {
                direction = 'up';
            } else if (targetRowIndex > startRowIndex) {
                direction = 'down';
            } else {
                direction = null; // 同じ行
            }

            this.fillDirection = direction;
            
            // 選択範囲を更新
            this.updateSelection(startRowIndex, targetRowIndex);
        }

        /**
         * 選択範囲を更新
         * @param {number} startRowIndex - 開始行インデックス
         * @param {number} targetRowIndex - 対象行インデックス
         */
        updateSelection(startRowIndex, targetRowIndex) {
            // 既存の選択を解除
            this.clearSelection();

            const tbody = this.startCell.closest('tbody');
            const rows = Array.from(tbody.children);

            // 選択範囲を計算
            const minRow = Math.min(startRowIndex, targetRowIndex);
            const maxRow = Math.max(startRowIndex, targetRowIndex);

            // 選択範囲のセルを収集
            this.currentSelection = [];
            
            for (let i = minRow; i <= maxRow; i++) {
                const row = rows[i];
                if (!row) continue;

                const cell = row.querySelector(`td[data-field-code="${this.targetFieldCode}"]`);
                if (cell) {
                    this.currentSelection.push(cell);
                    // 🎯 既存の.cell-modifiedクラスを使用してスタイル統一
                    if (window.SimpleHighlightManager) {
                        window.SimpleHighlightManager.markCellAsModified(cell);
                    }
                    // ドラッグ中識別用のマーカー属性を追加
                    cell.setAttribute('data-fill-dragging', 'true');
                }
            }

            //console.log(`📋 選択範囲更新: ${this.currentSelection.length}個のセル`);
        }

        /**
         * 選択状態をクリア
         */
        clearSelection() {
            this.currentSelection.forEach(cell => {
                // ドラッグ中マーカーを削除
                cell.removeAttribute('data-fill-dragging');
                // フィルハンドルで一時的に追加された.cell-modifiedは維持
                // （実際の値変更がある場合のみ維持される）
            });
        }

        /**
         * マウスアップ時の処理
         * @param {MouseEvent} e - マウスイベント
         */
        handleMouseUp(e) {
            if (!this.isActive) return;

            //console.log(`📋 フィル操作完了: ${this.currentSelection.length}個のセルに適用`);

            // フィル操作を実行
            this.executeFillOperation();

            // 状態をリセット
            this.resetFillOperation();
        }

        /**
         * フィル操作を実行
         */
        executeFillOperation() {
            if (this.currentSelection.length <= 1) {
                //console.log('📋 フィル対象なし（1セル以下）');
                return;
            }

            try {
                //console.log(`📋 フィル実行開始: ${this.originalValue} を ${this.currentSelection.length}個のセルにコピー`);

                // 開始セル以外の全セルに値をコピー（DOM操作のみ）
                for (let i = 1; i < this.currentSelection.length; i++) {
                    const targetCell = this.currentSelection[i];
                    
                    // セルの値を更新（DOM操作のみ）
                    this.updateCellValue(targetCell, this.originalValue);
                }

                //console.log(`✅ フィル操作完了: DOM上で${this.currentSelection.length - 1}個のセルにコピー`);
                
                // 成功ハイライトを表示
                this.showSuccessHighlight();

            } catch (error) {
                console.error('❌ フィル操作中にエラー:', error);
                this.showErrorMessage('フィル操作中にエラーが発生しました');
            }
        }

        /**
         * セルの現在値を取得
         * @param {HTMLElement} cell - 対象セル
         * @returns {string} セルの現在値
         */
        getCurrentCellValue(cell) {
            // input要素がある場合
            const input = cell.querySelector('input');
            if (input) {
                return input.value || '';
            }

            // select要素がある場合
            const select = cell.querySelector('select');
            if (select) {
                return select.value || '';
            }

            // テキストセルの場合
            const textSpan = cell.querySelector('span');
            if (textSpan) {
                return textSpan.textContent.trim();
            }

            // セル内に直接テキストがある場合
            const nodes = Array.from(cell.childNodes);
            const textNode = nodes.find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) {
                return textNode.textContent.trim();
            }

            // セル全体のテキストを取得
            return cell.textContent.trim();
        }

        /**
         * セルの値を更新
         * @param {HTMLElement} cell - 対象セル
         * @param {string} value - 新しい値
         */
        updateCellValue(cell, value) {
            // input要素がある場合
            const input = cell.querySelector('input');
            if (input) {
                input.value = value;
                // change イベントを発火
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 🎯 フィルハンドル変更をハイライト
                this.applyFillHandleHighlight(cell);
                return;
            }

            // select要素がある場合
            const select = cell.querySelector('select');
            if (select) {
                select.value = value;
                // change イベントを発火
                select.dispatchEvent(new Event('change', { bubbles: true }));
                
                // 🎯 フィルハンドル変更をハイライト
                this.applyFillHandleHighlight(cell);
                return;
            }

            // テキストセルの場合
            const textSpan = cell.querySelector('span');
            if (textSpan) {
                textSpan.textContent = value;
            } else {
                // セル内に直接テキストがある場合
                const nodes = Array.from(cell.childNodes);
                const textNode = nodes.find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.textContent = value;
                } else {
                    // セル全体のテキストを置換
                    cell.textContent = value;
                }
            }
            
            // 🎯 フィルハンドル変更をハイライト
            this.applyFillHandleHighlight(cell);
        }

        /**
         * フィルハンドルによる変更をハイライト
         * @param {HTMLElement} cell - 対象セル
         */
        applyFillHandleHighlight(cell) {
            try {
                // 🎯 既存のハイライトシステムと統合
                if (window.SimpleHighlightManager) {
                    // セルレベルのハイライトを適用
                    window.SimpleHighlightManager.markCellAsModified(cell);
                    
                    // 行レベルのハイライトを適用
                    const row = cell.closest('tr');
                    if (row) {
                        window.SimpleHighlightManager.markRowAsModified(row);
                    }
                }

                // 🎯 CellStateManagerのハイライト更新も実行
                if (window.cellStateManager) {
                    const row = cell.closest('tr');
                    const fieldCode = cell.getAttribute('data-field-code');
                    if (row && fieldCode) {
                        // 少し遅延させてDOM変更が完了してから実行
                        setTimeout(() => {
                            window.cellStateManager.updateHighlightState(row, fieldCode);
                        }, 10);
                    }
                }

                // 🎯 フィルハンドル操作マークを追加（トレーサビリティ用）
                cell.setAttribute('data-fill-handle-modified', 'true');
                cell.setAttribute('data-fill-handle-timestamp', new Date().toISOString());

                //console.log(`🎨 フィルハンドル変更ハイライト適用: ${cell.getAttribute('data-field-code')}`);
            } catch (error) {
                console.warn('⚠️ フィルハンドルハイライト適用エラー:', error);
            }
        }



        /**
         * 成功ハイライトを表示
         */
        showSuccessHighlight() {
            //console.log('🎨 フィル操作成功ハイライト表示');
            
            this.currentSelection.forEach(cell => {
                // 🎯 既存の.cell-modifiedクラスによる永続的なハイライトを適用
                this.applyFillHandleHighlight(cell);
                
                // 🎯 一時的な成功ハイライト（アニメーション用）
                cell.classList.add('fill-completed');
            });
            
            // 1秒後に一時的なハイライトのみ削除（.cell-modifiedは維持）
            setTimeout(() => {
                this.currentSelection.forEach(cell => {
                    cell.classList.remove('fill-completed');
                });
                //console.log('🎨 フィル操作成功アニメーション削除（.cell-modifiedは維持）');
            }, 1000);
        }

        /**
         * エラーメッセージを表示
         * @param {string} message - エラーメッセージ
         */
        showErrorMessage(message) {
            console.error('❌ フィルハンドルエラー:', message);
            
            // 既存のメッセージ表示システムを使用
            if (window.MessageDisplay && typeof window.MessageDisplay.show === 'function') {
                window.MessageDisplay.show(message, 'error');
            } else {
                alert(message);
            }
        }

        /**
         * フィル操作をリセット
         */
        resetFillOperation() {
            // ソースセルのマーカーを削除
            if (this.startCell) {
                this.startCell.removeAttribute('data-fill-source');
            }
            
            this.isActive = false;
            this.startCell = null;
            this.fillDirection = null;
            this.originalValue = null;
            this.targetFieldCode = null;
            
            // 選択をクリア
            this.clearSelection();
            this.currentSelection = [];
            
            // ドラッグ中クラスを除去
            const draggingHandles = document.querySelectorAll('.fill-handle.dragging');
            draggingHandles.forEach(handle => {
                handle.classList.remove('dragging');
                handle.style.opacity = '0';
            });
            
            // ドキュメントの状態をリセット
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            
            //console.log('📋 フィル操作をリセット');
        }
    }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    // FillHandleManagerをグローバルに公開
    window.FillHandleManager = FillHandleManager;

    // 自動初期化
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.fillHandleManager) {
            window.fillHandleManager = new FillHandleManager();
            window.fillHandleManager.initialize();
        }
    });

    //console.log('📋 フィルハンドル機能モジュールを読み込み完了');

})(); 