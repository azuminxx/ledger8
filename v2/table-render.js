/**
 * 統合台帳システム v2 - テーブル描画・表示
 * @description テーブル表示・セル作成・レンダリング機能
 * @version 2.0.0
 * 
 * 🎯 **ファイルの責任範囲**
 * ✅ データをテーブルに描画・表示
 * ✅ 各種セル要素の作成（テキスト・入力・選択・リンク・行番号）
 * ✅ ページネーションとの連携
 * ✅ テーブル行・セルのDOM構造作成
 * ✅ スタイル適用・CSS クラス設定
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ ユーザーイベント処理（クリック・ドラッグ等）
 * ❌ インライン編集機能
 * ❌ システム初期化・設定管理
 * ❌ API通信・データ検索
 * ❌ ヘッダー・フィルター作成
 * 
 * 📦 **含まれるクラス**
 * - TableDisplayManager: メインの表示管理クラス
 * 
 * 🔗 **依存関係**
 * - DOMHelper (DOM操作)
 * - StyleManager (スタイル管理)
 * - FieldValueProcessor (値処理)
 * - dataManager (データ管理)
 * - window.paginationManager (ページネーション)
 * 
 * 💡 **使用例**
 * ```javascript
 * const tableManager = new TableDisplayManager();
 * tableManager.displayIntegratedData(records, null, false);
 * ```
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.TableRender = {};

    // =============================================================================
    // テーブル表示管理
    // =============================================================================

    class TableDisplayManager {
        constructor() {
            this.currentData = [];
            this.isEditMode = false;
        }

        /**
         * 統合データをテーブルに表示
         */
        displayIntegratedData(integratedRecords, targetAppId = null, isPagedData = false) {
            console.log(`📋 テーブル表示開始: ${integratedRecords.length}件${isPagedData ? ' (ページ表示)' : ''}`);
            
            const tbody = DOMHelper.getTableBody();
            if (!tbody) {
                console.error('❌ テーブルボディが見つかりません');
                return;
            }

            // 追加モード確認と重複チェック
            const existingKeys = dataManager.getExistingRecordKeys();
            console.log(`🔍 既存統合キー数: ${existingKeys.size}件`);
            console.log(`🔍 検索結果: ${integratedRecords.length}件`);
            
            const newRecords = integratedRecords.filter(record => {
                if (!dataManager.appendMode) return true;
                
                const recordKey = record.integrationKey || '';
                const isDuplicate = existingKeys.has(recordKey);
                
                if (isDuplicate) {
                    console.log(`🔒 重複レコードをスキップ: ${recordKey}`);
                } else if (recordKey) {
                    console.log(`✅ 新規レコード追加: ${recordKey}`);
                }
                
                return !isDuplicate;
            });
            
            console.log(`📝 追加対象レコード: ${newRecords.length}件`);

            dataManager.clearTable();
            
            // 追加モードでない場合、またはデータが新規の場合に this.currentData を更新
            if (!dataManager.appendMode) {
                this.currentData = integratedRecords;
            } else {
                // 追加モードの場合は新規レコードのみを追加
                this.currentData = this.currentData.concat(newRecords);
                console.log(`📝 追加モード: ${newRecords.length}件の新規レコードを追加`);
            }

            if (newRecords.length === 0 && !dataManager.appendMode) {
                dataManager.displayNoResults(tbody);
                
                // ページネーションUIを削除
                if (window.paginationUI) {
                    window.paginationUI._removePaginationUI();
                }
                return;
            } else if (newRecords.length === 0 && dataManager.appendMode) {
                console.log('📝 追加モード: 新規レコードなし - 重複レコードをスキップしました');
                return;
            }

            // ページネーション処理を追加（追加モードの場合は現在のデータ全体を使用）
            const dataForPagination = dataManager.appendMode ? this.currentData : newRecords;
            
            if (!isPagedData && window.paginationManager) {
                // 全データをページネーションマネージャーに設定
                window.paginationManager.setAllData(dataForPagination);
                
                // 100件以上の場合はページング表示
                if (dataForPagination.length > 100) {
                    const pageData = window.paginationManager.getCurrentPageData();
                    this.displayIntegratedData(pageData, targetAppId, true); // ページデータとして再帰呼び出し
                    
                    // ページネーションUIを作成
                    if (window.paginationUI) {
                        setTimeout(() => {
                            window.paginationUI.createPaginationUI();
                        }, 100);
                    }
                    return;
                }
            }

            const fieldOrder = dataManager.getFieldOrder();
            console.log('フィールド順序:', fieldOrder);

            // 表示するデータを決定（追加モードでは新規レコードのみ、通常モードでは全データ）
            const recordsToDisplay = dataManager.appendMode ? newRecords : dataForPagination;
            
            // 追加モード時の既存行数を事前に取得
            const existingRowCount = dataManager.appendMode ? tbody.querySelectorAll('tr').length : 0;
            console.log(`📝 追加モード開始時の既存行数: ${existingRowCount}行`);

            recordsToDisplay.forEach((record, index) => {
                // 追加モード時は既存行数を基準とした連続番号
                const actualRowIndex = dataManager.appendMode ? existingRowCount + index : index;
                const row = this._createTableRow(record, fieldOrder, targetAppId, actualRowIndex);
                tbody.appendChild(row);
            });

            console.log(`✅ テーブル表示完了: ${recordsToDisplay.length}行${isPagedData ? ' (ページ表示)' : ''}${dataManager.appendMode ? ' (追加モード)' : ''}`);

            // 最大行番号を設定
            this._setMaxRowNumberFromDisplayedData();

            // 追加モードの場合はページネーション情報を更新
            if (dataManager.appendMode && window.paginationManager) {
                window.paginationManager.setAllData(this.currentData);
            }

            // ページネーションUIを更新（100件以下の場合は削除される）
            if (window.paginationUI && !isPagedData) {
                setTimeout(() => {
                    window.paginationUI.updatePaginationUI();
                }, 100);
            }

            // 🔄 セル交換機能の再初期化（テーブル描画完了後）
            setTimeout(() => {
                if (window.reinitializeCellSwap) {
                    window.reinitializeCellSwap();
                }
            }, 200);
        }

        /**
         * テーブル行を作成
         */
        _createTableRow(record, fieldOrder, targetAppId, rowIndex = 0) {
            const row = document.createElement('tr');
            const integrationKey = record.integrationKey || '';
            
            // 実際の行番号を計算（ページング環境対応）
            let actualRowNumber;
            if (window.paginationManager && window.paginationManager.allData.length > 100 && !window.dataManager.appendMode) {
                const paginationInfo = window.paginationManager.getPaginationInfo();
                actualRowNumber = paginationInfo.startRecord + rowIndex;
            } else {
                actualRowNumber = rowIndex + 1;
            }
            
            // data-row-idには実際の行番号を設定（表示行番号ではない）
            row.setAttribute('data-row-id', actualRowNumber);
            row.setAttribute('data-integration-key', integrationKey);

            // 行番号はfieldsConfigの_row_numberで処理されるため、自動追加は無効化

            // データセル作成
            fieldOrder.forEach(fieldCode => {
                const cell = this._createDataCell(record, fieldCode, row, rowIndex);
                row.appendChild(cell);
            });

            return row;
        }

        /**
         * データセルを作成
         */
        _createDataCell(record, fieldCode, row, rowIndex = 0) {
            const cell = document.createElement('td');
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            
            if (!field) {
                cell.textContent = '';
                return cell;
            }

            // セル属性設定
            cell.setAttribute('data-field-code', fieldCode);
            cell.setAttribute('data-source-app', field.sourceApp || '');
            cell.classList.add('table-cell');

            if (field.isPrimaryKey) {
                cell.setAttribute('data-is-primary-key', 'true');
            }
            if (field.isRecordId) {
                cell.setAttribute('data-is-record-id', 'true');
            }

            const value = FieldValueProcessor.process(record, fieldCode, '');
            
            // ✨ 初期値をdata属性に保存（ハイライト制御用）
            cell.setAttribute('data-original-value', value || '');
            
            const width = field.width || '100px';

            // セルタイプ別処理
            switch (field.cellType) {
                case 'row_number':
                    this._createRowNumberCell(cell, rowIndex);
                    break;
                case 'link':
                    this._createLinkCell(cell, value, record, field);
                    break;
                case 'input':
                    this._createInputCell(cell, value, field, row);
                    break;
                case 'select':
                case 'dropdown':
                    this._createSelectCell(cell, value, field, row);
                    break;
                default:
                    this._createTextCell(cell, value, field);
                    break;
            }

            StyleManager.applyCellStyles(cell, width);
            return cell;
        }

        /**
         * 行番号セルを作成
         */
        _createRowNumberCell(cell, rowIndex) {
            let displayRowNumber;
            let actualRowNumber;
            
            // 通常モード時：ページネーション情報を考慮
            if (window.paginationManager && window.paginationManager.allData.length > 100 && !window.dataManager.appendMode) {
                const paginationInfo = window.paginationManager.getPaginationInfo();
                displayRowNumber = paginationInfo.startRecord + rowIndex;
                actualRowNumber = displayRowNumber; // ページング環境では表示行番号 = 実際の行番号
            }
            // デフォルト（追加モード含む）：渡されたrowIndexをそのまま使用（1ベース）
            else {
                displayRowNumber = rowIndex + 1;
                actualRowNumber = displayRowNumber;
            }
            
            cell.textContent = displayRowNumber;
            cell.classList.add('row-number-cell', 'table-cell');
            
            // 行要素のdata-row-idが未設定の場合のみ設定（重複防止）
            const row = cell.closest('tr');
            if (row && !row.getAttribute('data-row-id')) {
                row.setAttribute('data-row-id', actualRowNumber);
            }
        }

        /**
         * リンクセルを作成
         */
        _createLinkCell(cell, value, record, field) {
            if (!value) {
                cell.textContent = '';
                return;
            }

            const link = document.createElement('a');
            link.href = this._buildRecordUrl(record, field);
            link.target = '_blank';
            link.textContent = value;
            link.classList.add('record-link');

            cell.appendChild(link);
        }

        /**
         * 入力セルを作成
         */
        _createInputCell(cell, value, field, row) {
            if (TableEditMode.isLightweightMode()) {
                // 軽量モード：テキスト表示のみ
                cell.textContent = value || '';
                cell.setAttribute('data-editable', 'true');
                cell.classList.add('cell-editable');
                return;
            }

            // 編集モード：input要素作成
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value || '';
            input.style.width = '100%';
            input.style.border = 'none';
            input.style.background = 'transparent';
            input.style.outline = 'none';
            
            // フィールド幅に応じたinput幅設定
            const fieldWidth = field.width || '100px';
            const inputWidthClass = this._getInputWidthClass(fieldWidth);
            if (inputWidthClass) {
                input.classList.add(inputWidthClass);
            }

            cell.appendChild(input);
        }

        /**
         * セレクトセルを作成
         */
        _createSelectCell(cell, value, field, row) {
            if (TableEditMode.isLightweightMode()) {
                cell.textContent = value || '';
                cell.setAttribute('data-editable', 'true');
                cell.classList.add('cell-editable');
                return;
            }

            const select = document.createElement('select');
            select.style.width = '100%';
            select.style.border = 'none';
            select.style.background = 'transparent';

            // 空のオプション
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '';
            select.appendChild(emptyOption);

            // オプション追加
            if (field.options) {
                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    // オプションが文字列の場合とオブジェクトの場合に対応
                    const optionValue = typeof option === 'string' ? option : option.value;
                    const optionLabel = typeof option === 'string' ? option : option.label;
                    
                    optionElement.value = optionValue;
                    optionElement.textContent = optionLabel;
                    if (optionValue === value) {
                        optionElement.selected = true;
                    }
                    select.appendChild(optionElement);
                });
            }

            select.value = value || '';
            cell.appendChild(select);
        }

        /**
         * テキストセルを作成
         */
        _createTextCell(cell, value, field) {
            // 主キーフィールドの場合は値と分離ボタンを含むコンテナを作成
            if (field && field.isPrimaryKey) {
                this._createPrimaryKeyCell(cell, value, field);
            } else {
                cell.textContent = value || '';
            }
        }

        /**
         * 主キーセルを作成（値 + 分離ボタン）
         */
        _createPrimaryKeyCell(cell, value, field) {
            // コンテナ作成
            const container = document.createElement('div');
            container.classList.add('primary-key-container');

            // 値表示部分
            const valueSpan = document.createElement('span');
            valueSpan.textContent = value || '';
            valueSpan.classList.add('primary-key-value');

            // 分離ボタン
            const separateBtn = document.createElement('button');
            separateBtn.innerHTML = '✂️';
            separateBtn.title = `${field.label}を分離`;
            separateBtn.classList.add('separate-btn');

            // クリックイベント
            separateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._handleSeparateClick(cell, field, value);
            });

            container.appendChild(valueSpan);
            container.appendChild(separateBtn);
            cell.appendChild(container);
        }

        /**
         * 分離ボタンクリック処理
         */
        _handleSeparateClick(cell, field, value) {
            console.log(`✂️ 分離処理開始: ${field.label} = ${value}`);
            
            // 行を取得
            const row = cell.closest('tr');
            if (!row) {
                console.error('❌ 行が見つかりません');
                return;
            }

            // 分離処理実行
            this._executeSeparation(row, field, value);
        }

        /**
         * 分離処理実行
         */
        _executeSeparation(row, field, value) {
            try {
                console.log(`🔄 分離処理実行中: ${field.label} = ${value}`);
                
                // 現在の統合キーを取得
                const integrationKey = row.getAttribute('data-integration-key');
                if (!integrationKey) {
                    throw new Error('統合キーが見つかりません');
                }

                // 統合キーを解析して分離対象を特定
                const keyParts = integrationKey.split('|');
                console.log('統合キー解析:', keyParts);

                // 分離対象のフィールドを除いた新しい統合キーを作成
                const newKeyParts = keyParts.filter(part => {
                    if (!part.includes(':')) return false;
                    const [app, val] = part.split(':');
                    return !(field.sourceApp === app && val === value);
                });

                if (newKeyParts.length === keyParts.length) {
                    throw new Error('分離対象が見つかりません');
                }

                // 元の行を更新（分離対象を除去）
                const newIntegrationKey = newKeyParts.join('|');
                row.setAttribute('data-integration-key', newIntegrationKey);
                
                // 分離された項目用の新しい行を作成（元の行をクリアする前に）
                const separatedRow = this._createSeparatedRow(row, field, value, integrationKey);

                // 同じsourceAppのフィールドをすべて元の行からクリア
                this._clearFieldsFromOriginalRow(row, field.sourceApp);

                // 🎨 分離処理後のハイライト処理
                this._updateHighlightsAfterSeparation(row, separatedRow);

                console.log('✅ 分離処理完了');

            } catch (error) {
                console.error('❌ 分離処理エラー:', error);
                alert(`分離処理中にエラーが発生しました: ${error.message}`);
            }
        }

        /**
         * 分離された行を作成
         */
        _createSeparatedRow(originalRow, separatedField, separatedValue, originalIntegrationKey) {
            // 新しい行を作成
            const newRow = originalRow.cloneNode(true);
            
            // 新しい統合キーを設定（分離されたフィールドのみ）
            const separatedIntegrationKey = `${separatedField.sourceApp}:${separatedValue}`;
            newRow.setAttribute('data-integration-key', separatedIntegrationKey);
            
            // 新しい行番号を取得（最大値管理から）
            const newRowNumber = dataManager.getNextRowNumber();
            
            // 実際の行番号をdata-row-idに設定（表示行番号ではない）
            newRow.setAttribute('data-row-id', newRowNumber);

            // 分離されたsourceApp以外のフィールドをクリアし、すべてのdata-original-valueを空にする
            this._setupSeparatedRow(newRow, separatedField, newRowNumber);

            // 元の行の後に新しい行を挿入
            originalRow.parentNode.insertBefore(newRow, originalRow.nextSibling);
            
            // 🔄 分離行にドラッグ&ドロップ機能を設定
            this._setupDragAndDropForSeparatedRow(newRow);
            
            // 新しい行をハイライト
            newRow.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                newRow.style.backgroundColor = '';
            }, 3000);

            // 戻り値として分離行を返す
            return newRow;
        }

        /**
         * レコードURLを構築
         */
        _buildRecordUrl(record, field) {
            if (!field.sourceApp || !record.recordIds) {
                return '#';
            }

            const sourceApp = field.sourceApp;
            if (!window.LedgerV2.Config.APP_URL_MAPPINGS[sourceApp]) {
                return '#';
            }

            const appId = window.LedgerV2.Config.APP_IDS[sourceApp];
            const recordId = record.recordIds[sourceApp];

            if (!appId || !recordId) {
                return '#';
            }

            return window.LedgerV2.Config.APP_URL_MAPPINGS[sourceApp].replace('{appId}', appId).replace('{recordId}', recordId);
        }

        /**
         * 入力幅クラスを取得
         */
        _getInputWidthClass(fieldWidth) {
            const widthMap = {
                '68px': 'input-width-68',
                '78px': 'input-width-78',
                '98px': 'input-width-98'
            };
            return widthMap[fieldWidth] || null;
        }

        /**
         * 表示されたデータから最大行番号を設定
         */
        _setMaxRowNumberFromDisplayedData() {
            let maxRowNumber = 0;
            
            // ページングが有効で全データ数が取得できる場合
            if (window.paginationManager && window.paginationManager.allData && window.paginationManager.allData.length > 0) {
                maxRowNumber = window.paginationManager.allData.length;
                console.log(`📊 ページング環境: 全データ数 ${maxRowNumber} を最大行番号に設定`);
            } 
            // currentDataから算出
            else if (this.currentData && this.currentData.length > 0) {
                maxRowNumber = this.currentData.length;
                console.log(`📊 通常環境: currentData ${maxRowNumber} を最大行番号に設定`);
            }
            // 最後の手段：実際のテーブルから取得
            else {
                const tbody = DOMHelper.getTableBody();
                if (tbody) {
                    const rows = tbody.querySelectorAll('tr');
                    maxRowNumber = rows.length;
                    console.log(`📊 フォールバック: テーブル行数 ${maxRowNumber} を最大行番号に設定`);
                }
            }

            dataManager.setMaxRowNumber(maxRowNumber);
        }

        /**
         * 元の行から指定されたsourceAppのフィールドをクリア
         */
        _clearFieldsFromOriginalRow(row, targetSourceApp) {
            const cells = row.querySelectorAll('td[data-field-code]');
            console.log(`🧹 元の行から sourceApp="${targetSourceApp}" のフィールドをクリア開始`);
            
            cells.forEach(cell => {
                const fieldCode = cell.getAttribute('data-field-code');
                const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
                
                if (!field || field.sourceApp !== targetSourceApp) return;
                
                console.log(`  🗑️ フィールドクリア: ${field.label} (${fieldCode})`);
                
                // 主キーフィールドの場合
                if (field.isPrimaryKey) {
                    const container = cell.querySelector('div');
                    if (container) {
                        const valueSpan = container.querySelector('span');
                        if (valueSpan) {
                            valueSpan.textContent = '';
                        }
                    } else {
                        cell.textContent = '';
                    }
                }
                // レコードIDフィールドの場合
                else if (field.isRecordId) {
                    cell.textContent = '';
                }
                // 通常フィールドの場合
                else {
                    const input = cell.querySelector('input, select');
                    if (input) {
                        input.value = '';
                    } else {
                        cell.textContent = '';
                    }
                }
            });
        }

        /**
         * 分離行を設定（指定されたsourceApp以外をクリア）
         */
        _setupSeparatedRow(newRow, separatedField, newRowNumber) {
            const cells = newRow.querySelectorAll('td[data-field-code]');
            console.log(`⚙️ 分離行設定開始: sourceApp="${separatedField.sourceApp}" を保持`);
            
            cells.forEach(cell => {
                const fieldCode = cell.getAttribute('data-field-code');
                const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
                
                // すべてのセルのdata-original-valueを空にする
                cell.setAttribute('data-original-value', '');
                
                if (!field) return;

                // 行番号セルの場合は新しい番号を設定
                if (field.isRowNumber) {
                    cell.textContent = newRowNumber;
                    return;
                }

                // 分離されたsourceAppと異なるフィールドをクリア
                if (field.sourceApp && field.sourceApp !== separatedField.sourceApp) {
                    console.log(`  🗑️ 異なるsourceApp削除: ${field.label} (${field.sourceApp})`);
                    
                    // 主キーフィールドの場合
                    if (field.isPrimaryKey) {
                        const container = cell.querySelector('div');
                        if (container) {
                            const valueSpan = container.querySelector('span');
                            if (valueSpan) {
                                valueSpan.textContent = '';
                            }
                        } else {
                            cell.textContent = '';
                        }
                    }
                    // レコードIDフィールドの場合
                    else if (field.isRecordId) {
                        cell.textContent = '';
                    }
                    // 通常フィールドの場合
                    else {
                        const input = cell.querySelector('input, select');
                        if (input) {
                            input.value = '';
                        } else {
                            cell.textContent = '';
                        }
                    }
                } else if (field.sourceApp === separatedField.sourceApp) {
                    // 保持されるフィールドの値を確認
                    let currentValue = '';
                    if (field.isPrimaryKey) {
                        const container = cell.querySelector('div');
                        if (container) {
                            const valueSpan = container.querySelector('span');
                            if (valueSpan) {
                                currentValue = valueSpan.textContent;
                            }
                        } else {
                            currentValue = cell.textContent;
                        }
                    } else if (field.isRecordId) {
                        currentValue = cell.textContent;
                    } else {
                        const input = cell.querySelector('input, select');
                        if (input) {
                            currentValue = input.value;
                        } else {
                            currentValue = cell.textContent;
                        }
                    }
                    console.log(`  ✅ 同じsourceApp保持: ${field.label} (${field.sourceApp}) = "${currentValue}"`);
                }
            });
        }

        /**
         * 分離行にドラッグ&ドロップ機能を設定（既存システム再利用）
         */
        _setupDragAndDropForSeparatedRow(newRow) {
            try {
                console.log('🔄 分離行ドラッグ&ドロップ設定開始（既存システム再利用）');
                
                // 既存のCellSwapManagerを使用して行単位で設定
                if (window.LedgerV2 && window.LedgerV2.TableInteract && window.LedgerV2.TableInteract.cellSwapManager) {
                    window.LedgerV2.TableInteract.cellSwapManager.setupDragDropForRow(newRow);
                    console.log('  ✅ CellSwapManager.setupDragDropForRow実行');
                } else {
                    console.warn('⚠️ CellSwapManagerが見つかりません - フォールバック処理');
                    // フォールバック: 基本的なdraggable設定のみ
                    const primaryKeyCells = newRow.querySelectorAll('td[data-is-primary-key="true"]');
                    primaryKeyCells.forEach(cell => {
                        cell.draggable = true;
                    });
                }
                
                console.log('✅ 分離行ドラッグ&ドロップ設定完了');
                
            } catch (error) {
                console.error('❌ 分離行ドラッグ&ドロップ設定エラー:', error);
            }
        }

        /**
         * 分離処理後のハイライト処理（既存システム活用）
         */
        _updateHighlightsAfterSeparation(originalRow, separatedRow) {
            try {
                console.log('🎨 分離後ハイライト処理開始（既存システム活用）');
                
                // CellStateManagerが利用可能な場合
                if (window.cellStateManager) {
                    // 両方の行の全フィールドを再評価
                    [originalRow, separatedRow].forEach((row, index) => {
                        const rowType = index === 0 ? '元の行' : '分離行';
                        console.log(`  🔍 ${rowType}ハイライト処理（CellStateManager使用）`);
                        
                        this._updateRowHighlightWithCellStateManager(row);
                    });
                } else {
                    // フォールバック: data-original-value ベースの簡単なハイライト
                    console.log('  ⚠️ CellStateManager未利用 - フォールバック処理');
                    [originalRow, separatedRow].forEach((row, index) => {
                        const rowType = index === 0 ? '元の行' : '分離行';
                        console.log(`  🔍 ${rowType}ハイライト処理（フォールバック）`);
                        
                        this._updateRowHighlightFallback(row);
                    });
                }
                
                console.log('✅ 分離後ハイライト処理完了');
                
            } catch (error) {
                console.error('❌ 分離後ハイライト処理エラー:', error);
            }
        }

        /**
         * CellStateManagerを使用した行ハイライト更新
         */
        _updateRowHighlightWithCellStateManager(row) {
            if (!row || !window.cellStateManager) return;
            
            const cells = row.querySelectorAll('td[data-field-code]');
            console.log(`    🔍 CellStateManager行内セル処理: ${cells.length}個`);
            
            cells.forEach(cell => {
                const fieldCode = cell.getAttribute('data-field-code');
                if (fieldCode) {
                    try {
                        // 既存の高機能ハイライト更新システムを活用
                        window.cellStateManager.updateHighlightState(row, fieldCode);
                    } catch (error) {
                        console.warn(`⚠️ CellStateManager更新失敗: ${fieldCode}`, error);
                    }
                }
            });
        }

        /**
         * フォールバック: data-original-value ベースのシンプルハイライト（共通ヘルパー使用）
         */
        _updateRowHighlightFallback(row) {
            if (!row) return;
            
            const cells = Array.from(row.querySelectorAll('td[data-field-code]'));
            console.log(`    🔍 フォールバック行内セル検査: ${cells.length}個`);
            
            // 共通ヘルパーで一括処理
            window.CommonHighlightHelper.updateMultipleCellsHighlight(cells);
            
            console.log(`    ✅ フォールバックハイライト処理完了`);
        }

 
    }

    // =============================================================================
    // グローバル公開
    // =============================================================================

    window.LedgerV2.TableRender = { 
        TableDisplayManager
    };
    
    window.TableDisplayManager = TableDisplayManager;

    console.log('✅ TableRender モジュール初期化完了');

})(); 