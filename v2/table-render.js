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
            const newRecords = integratedRecords.filter(record => {
                if (!dataManager.appendMode) return true;
                return !existingKeys.has(record.integrationKey || '');
            });

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
            const startRowIndex = dataManager.appendMode ? this.currentData.length - newRecords.length : 0;

            recordsToDisplay.forEach((record, index) => {
                const actualRowIndex = dataManager.appendMode ? startRowIndex + index : index;
                const row = this._createTableRow(record, fieldOrder, targetAppId, actualRowIndex);
                tbody.appendChild(row);
            });

            console.log(`✅ テーブル表示完了: ${recordsToDisplay.length}行${isPagedData ? ' (ページ表示)' : ''}${dataManager.appendMode ? ' (追加モード)' : ''}`);

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
        }

        /**
         * テーブル行を作成
         */
        _createTableRow(record, fieldOrder, targetAppId, rowIndex = 0) {
            const row = document.createElement('tr');
            const rowId = dataManager.generateRowId();
            
            row.setAttribute('data-row-id', rowId);
            row.setAttribute('data-integration-key', record.integrationKey || '');
            
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
            
            cell.setAttribute('data-field-code', fieldCode);
            
            if (!field) {
                cell.textContent = '';
                StyleManager.applyCellStyles(cell, '100px');
                return cell;
            }

            // 台帳別色分け・フィールド特性のためのdata属性追加
            if (field.sourceApp) {
                cell.setAttribute('data-source-app', field.sourceApp);
            }
            if (field.isPrimaryKey) {
                cell.setAttribute('data-is-primary-key', 'true');
            }
            if (field.isRecordId) {
                cell.setAttribute('data-is-record-id', 'true');
            }

            const value = FieldValueProcessor.process(record, fieldCode, '');
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
                    this._createSelectCell(cell, value, field, row);
                    break;
                default:
                    this._createTextCell(cell, value);
                    break;
            }

            StyleManager.applyCellStyles(cell, width);
            return cell;
        }

        /**
         * 行番号セルを作成
         */
        _createRowNumberCell(cell, rowIndex) {
            // ページネーション情報を考慮した行番号計算
            let displayRowNumber = rowIndex + 1;
            if (window.paginationManager && window.paginationManager.allData.length > 100) {
                const paginationInfo = window.paginationManager.getPaginationInfo();
                displayRowNumber = paginationInfo.startRecord + rowIndex;
            }
            
            cell.textContent = displayRowNumber;
            cell.classList.add('row-number-cell', 'table-cell');
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
                    optionElement.value = option;
                    optionElement.textContent = option;
                    if (option === value) {
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
        _createTextCell(cell, value) {
            cell.textContent = value || '';
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