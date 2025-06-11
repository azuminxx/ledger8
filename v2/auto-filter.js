/**
 * 🔍 オートフィルタ機能モジュール v2
 * @description Excelライクなテーブルフィルタ機能を提供（全レコード対応）
 * 
 * ■主な機能:
 * ・各列のヘッダーにフィルタドロップダウンボタンを追加
 * ・列ごとの値一覧をチェックボックスで表示/非表示選択
 * ・複数列のフィルタ組み合わせによる絞り込み
 * ・フィルタ状態の視覚的表示（アクティブボタンの色変更）
 * ・フィルタのクリア機能
 * ・全レコードデータ対応（ページング関係なし）
 * 
 * ■動作:
 * 1. kintone APIで全レコードを取得してキャッシュ
 * 2. テーブル表示後に initialize() で各ヘッダーにボタン追加
 * 3. ボタンクリックでドロップダウン表示（全データの値一覧）
 * 4. チェックボックス操作でレコードの表示/非表示制御
 * 5. 複数フィルタは AND 条件で適用
 */

(() => {
    'use strict';

    /**
     * 🔍 オートフィルタ管理クラス v2（全レコード対応）
     * @description テーブルの各列にフィルタ機能を提供
     */
    class AutoFilterManagerV2 {
        constructor() {
            this.filters = new Map(); // 実際に適用されているフィルタ
            this.tempFilters = new Map(); // ドロップダウン内での一時的なフィルタ選択
            this.cachedRecords = null;
            this.allRecordsCache = new Map();
            this.originalRowsMap = new Map();
            
            // 全レコードデータ関連
            this.allRecords = []; // kintone APIから取得した全レコード
            this.isLoadingRecords = false;
            
            // 無限ループ防止フラグ
            this.isUpdatingTable = false;
        }

        /**
         * オートフィルタを初期化
         */
        initialize() {
            if (this.isInitialized) return;
            

            
            // キャッシュされた全レコードを取得
            this._loadCachedRecords();
            
            // テーブルの行データを保存
            this._saveOriginalRows();
            
            // ヘッダーにフィルタボタンを追加
            this._addFilterButtonsToHeaders();
            
            this.isInitialized = true;
        }

        /**
         * キャッシュされた全レコードを取得
         */
        _loadCachedRecords() {
            try {
                // paginationManagerのallDataから全レコードを取得
                if (window.paginationManager && window.paginationManager.allData) {
                    this.allRecords = window.paginationManager.allData;
                } else {
                    this.allRecords = [];
                }

                // 列ごとの値キャッシュを作成
                this._buildAllRecordsCache();

                    } catch (error) {
            this.allRecords = [];
        }
        }

        /**
         * 全レコードから列ごとの値キャッシュを作成
         */
        _buildAllRecordsCache() {
                    if (!window.fieldsConfig || this.allRecords.length === 0) {
            return;
        }

            this.allRecordsCache.clear();

            // 各フィールドの値を収集
            window.fieldsConfig.forEach((field, fieldIndex) => {
                const fieldCode = field.fieldCode;
                if (!fieldCode || fieldCode.startsWith('_')) return; // システムフィールドはスキップ

                const values = new Set();

                this.allRecords.forEach((record, recordIndex) => {
                    // 統合レコード対応の値抽出
                    let displayValue = this._extractRecordValue(record, fieldCode);
                    values.add(displayValue);
                });

                this.allRecordsCache.set(fieldCode, Array.from(values).sort((a, b) => {
                    // 空白を最後に
                    if (a === '' && b !== '') return 1;
                    if (a !== '' && b === '') return -1;
                    if (a === '' && b === '') return 0;
                    
                    // 数値として比較できる場合は数値として比較
                    const numA = parseFloat(a);
                    const numB = parseFloat(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    
                    // 文字列として比較
                    return a.localeCompare(b, 'ja');
                }));

            });
        }

        /**
         * 元の行データを保存
         */
        _saveOriginalRows() {
            const tbody = this._getTableBody();
            if (!tbody) return;

            this.originalRows = Array.from(tbody.querySelectorAll('tr')).map((row, index) => ({
                element: row,
                index: index,
                isVisible: true
            }));

            this.filteredRows = [...this.originalRows];
        }

        /**
         * ヘッダーにフィルタボタンを追加
         */
        _addFilterButtonsToHeaders() {
                    const headerRow = this._getTableHeaderRow();
        if (!headerRow) {
            return;
        }

            let buttonCount = 0;
            Array.from(headerRow.children).forEach((th, columnIndex) => {
                // filter-input要素からfieldCodeを取得
                const filterInput = th.querySelector('.filter-input[data-field-code]');
                if (!filterInput) {
                    return;
                }
                
                const fieldCode = filterInput.getAttribute('data-field-code');
                const headerLabel = th.querySelector('.header-label')?.textContent?.trim() || '';
                
                // 行番号列やボタン列はスキップ
                if (!fieldCode || fieldCode === '_row_number' || fieldCode === '_modification_checkbox' || fieldCode === '_hide_button') {
                    return;
                }

                // フィールド設定を取得
                const field = window.fieldsConfig?.find(f => f.fieldCode === fieldCode);
                if (!field) {
                    return;
                }

                this._addFilterButtonToHeader(th, columnIndex, field.label, fieldCode);
                buttonCount++;
            });
        }

        /**
         * 個別のヘッダーにフィルタボタンを追加
         */
        _addFilterButtonToHeader(headerCell, columnIndex, fieldLabel, fieldCode) {
            // 既にフィルタボタンがある場合はスキップ
            if (headerCell.querySelector('.auto-filter-button')) {
                return;
            }

            // ヘッダーセルを相対位置にする
            headerCell.style.position = 'relative';
            
            // フィルタボタンを作成
            const filterButton = document.createElement('button');
            filterButton.innerHTML = '<span style="font-size: 8px;">▼</span>'; // サイズ調整可能なアイコン
            filterButton.className = 'auto-filter-button';
            filterButton.title = `${fieldLabel}でフィルタ`;
            filterButton.setAttribute('data-field-code', fieldCode);
            filterButton.setAttribute('data-column-index', columnIndex);

            // クリックイベント
            filterButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._showFilterDropdown(filterButton, columnIndex, fieldLabel, fieldCode);
            });

            headerCell.appendChild(filterButton);
        }

        /**
         * フィルタドロップダウンを表示
         */
        _showFilterDropdown(button, columnIndex, fieldLabel, fieldCode) {
            // 既存のドロップダウンを閉じる
            this._closeAllDropdowns();

            // 先に一時フィルタを設定（ドロップダウン作成前）
            const currentFilter = this.filters.get(columnIndex);
            const uniqueValues = this._getUniqueColumnValues(columnIndex, fieldCode);
            
            if (currentFilter) {
                // フィルタが既に設定されている場合は、その選択状態をコピー
                this.tempFilters.set(columnIndex, new Set(currentFilter));
            } else {
                // フィルタが未設定の場合は、すべての値を選択状態にする（現在の表示状態を反映）
                this.tempFilters.set(columnIndex, new Set(uniqueValues));
            }

            // 一時フィルタ設定後にドロップダウンを作成
            const dropdown = this._createFilterDropdown(columnIndex, fieldLabel, fieldCode);
            document.body.appendChild(dropdown);
            this._positionDropdown(dropdown, button);
            
            // アクティブ状態をボタンに設定
            button.classList.add('active');
            dropdown.setAttribute('data-column', columnIndex);
        }

        /**
         * フィルタドロップダウンを作成
         */
        _createFilterDropdown(columnIndex, fieldLabel, fieldCode) {
            const dropdown = document.createElement('div');
            dropdown.className = 'filter-dropdown';

            // ヘッダー部分
            const header = document.createElement('div');
            header.className = 'filter-header';
            header.innerHTML = `<span class="filter-icon">🏠</span> ${fieldLabel} でフィルタ`;

            // 🔍 検索入力ボックス部分を追加
            const searchContainer = document.createElement('div');
            searchContainer.className = 'filter-search-container';
            searchContainer.style.cssText = `
                padding: 12px;
                border-bottom: 1px solid #e9ecef;
                background: #f8f9fa;
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = '検索... (入力完了後0.5秒で検索、カンマ区切り可能)';
            searchInput.className = 'filter-search-input';
            searchInput.style.cssText = `
                flex: 1;
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
                outline: none;
            `;

            const clearButton = document.createElement('button');
            clearButton.innerHTML = '×';
            clearButton.className = 'filter-clear-button';
            clearButton.title = '検索をクリア';
            clearButton.style.cssText = `
                width: 24px;
                height: 24px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                color: #666;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;

            // ×ボタンのホバー効果
            clearButton.addEventListener('mouseenter', () => {
                clearButton.style.background = '#f5f5f5';
                clearButton.style.color = '#333';
            });
            clearButton.addEventListener('mouseleave', () => {
                clearButton.style.background = 'white';
                clearButton.style.color = '#666';
            });

            searchContainer.appendChild(searchInput);
            searchContainer.appendChild(clearButton);

            // コントロール部分
            const controls = document.createElement('div');
            controls.className = 'filter-controls';

            // 左側のボタングループ
            const leftButtons = document.createElement('div');
            leftButtons.className = 'filter-left-buttons';

            // すべて選択ボタン
            const selectAllBtn = document.createElement('button');
            selectAllBtn.className = 'filter-btn filter-btn-outline';
            selectAllBtn.textContent = 'すべて選択';
            selectAllBtn.addEventListener('click', () => {
                const uniqueValues = this._getUniqueColumnValues(columnIndex, fieldCode);
                this.tempFilters.set(columnIndex, new Set(uniqueValues));
                this._updateDropdownCheckboxes(dropdown, this.tempFilters.get(columnIndex));
            });

            // すべて解除ボタン
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.className = 'filter-btn filter-btn-outline';
            deselectAllBtn.textContent = 'すべて解除';
            deselectAllBtn.addEventListener('click', () => {
                this.tempFilters.set(columnIndex, new Set());
                this._updateDropdownCheckboxes(dropdown, this.tempFilters.get(columnIndex));
            });

            // 右側のボタングループ
            const rightButtons = document.createElement('div');
            rightButtons.className = 'filter-right-buttons';

            // OKボタン（新規追加）
            const okBtn = document.createElement('button');
            okBtn.className = 'filter-btn filter-btn-primary';
            okBtn.textContent = 'OK';
            okBtn.addEventListener('click', () => {
                // 一時フィルタを実際のフィルタに適用
                const tempFilter = this.tempFilters.get(columnIndex);
                const uniqueValues = this._getUniqueColumnValues(columnIndex, fieldCode);
                
                if (tempFilter && tempFilter.size > 0) {
                    // すべての値が選択されている場合は、フィルタを削除（全件表示）
                    if (tempFilter.size === uniqueValues.length) {
                        this.filters.delete(columnIndex);
                    } else {
                        // 一部のみ選択されている場合は、フィルタを設定
                        this.filters.set(columnIndex, new Set(tempFilter));
                    }
                } else {
                    // 何も選択されていない場合は、フィルタを削除
                    this.filters.delete(columnIndex);
                }
                
                this._applyFilters();
                this._closeAllDropdowns();
            });

            // キャンセルボタン（閉じるボタンから変更）
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'filter-btn filter-btn-secondary';
            cancelBtn.textContent = 'キャンセル';
            cancelBtn.addEventListener('click', () => {
                // 一時フィルタをクリア（変更を破棄）
                this.tempFilters.delete(columnIndex);
                this._closeAllDropdowns();
            });

            leftButtons.appendChild(selectAllBtn);
            leftButtons.appendChild(deselectAllBtn);
            rightButtons.appendChild(okBtn);
            rightButtons.appendChild(cancelBtn);
            
            controls.appendChild(leftButtons);
            controls.appendChild(rightButtons);

            // 値一覧部分
            const valueList = document.createElement('div');
            valueList.className = 'filter-value-list';

            // 列の値を取得してチェックボックス一覧を作成
            const uniqueValues = this._getUniqueColumnValues(columnIndex, fieldCode);
            const currentTempFilter = this.tempFilters.get(columnIndex);

            // 🔍 検索機能の実装
            const originalValues = [...uniqueValues]; // 元の値リストを保存
            let searchTimeout = null; // デバウンス用のタイマー
            
            // 検索入力のイベントリスナー（デバウンス機能付き）
            searchInput.addEventListener('input', () => {
                // 既存のタイマーをクリア
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                
                // 検索中の視覚的フィードバック
                if (searchInput.value.trim() !== '') {
                    searchInput.style.borderColor = '#ffc107';
                    searchInput.style.backgroundColor = '#fff8e1';
                }
                
                // 入力完了を待ってから検索実行（500ms後）
                searchTimeout = setTimeout(() => {
                    // 検索実行
                    this._handleSearchInput(searchInput.value, dropdown, columnIndex, fieldCode, originalValues);
                    
                    // 検索完了後の視覚的フィードバック
                    if (searchInput.value.trim() !== '') {
                        searchInput.style.borderColor = '#4CAF50';
                        searchInput.style.backgroundColor = '#f1f8e9';
                    } else {
                        searchInput.style.borderColor = '#ddd';
                        searchInput.style.backgroundColor = 'white';
                    }
                }, 500);
            });

            // ×ボタンのイベントリスナー
            clearButton.addEventListener('click', () => {
                // タイマーをクリア
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                searchInput.value = '';
                
                // 検索ボックスの見た目をリセット
                searchInput.style.borderColor = '#ddd';
                searchInput.style.backgroundColor = 'white';
                
                this._handleSearchInput('', dropdown, columnIndex, fieldCode, originalValues);
                searchInput.focus();
            });

            // 初期表示
            this._renderValueList(valueList, uniqueValues, currentTempFilter, columnIndex);

            dropdown.appendChild(header);
            dropdown.appendChild(searchContainer);
            dropdown.appendChild(controls);
            dropdown.appendChild(valueList);

            return dropdown;
        }

        /**
         * 🔍 検索入力の処理
         */
        _handleSearchInput(searchText, dropdown, columnIndex, fieldCode, originalValues) {
            const valueList = dropdown.querySelector('.filter-value-list');
            const currentTempFilter = this.tempFilters.get(columnIndex);
            
            if (searchText.trim() === '') {
                // 検索文字列が空の場合：すべての値を表示
                this._renderValueList(valueList, originalValues, currentTempFilter, columnIndex);
            } else {
                // 🔍 カンマ区切り複数検索対応
                const searchKeywords = searchText.split(',')
                    .map(keyword => keyword.trim().toLowerCase())
                    .filter(keyword => keyword !== ''); // 空文字列を除外
                
                const matchedValues = originalValues.filter(value => {
                    const valueLower = value.toLowerCase();
                    // いずれかのキーワードにマッチすればOK（OR検索）
                    return searchKeywords.some(keyword => valueLower.includes(keyword));
                });
                
                // 一時フィルタを更新：マッチした値のみをONにする
                this.tempFilters.set(columnIndex, new Set(matchedValues));
                
                // 表示は全ての値を表示するが、チェック状態は検索結果に基づく
                this._renderValueList(valueList, originalValues, this.tempFilters.get(columnIndex), columnIndex);
            }
        }

        /**
         * 🔍 値リストをレンダリング
         */
        _renderValueList(valueList, values, currentTempFilter, columnIndex) {
            // 既存の内容をクリア
            valueList.innerHTML = '';
            
            values.forEach(value => {
                const item = document.createElement('div');
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f0f0f0';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                const isChecked = currentTempFilter ? currentTempFilter.has(value) : false;
                checkbox.checked = isChecked;
                checkbox.setAttribute('data-filter-value', value);

                const label = document.createElement('span');
                label.textContent = value === '' ? '(空白)' : value;

                item.appendChild(checkbox);
                item.appendChild(label);

                // チェックボックスの変更イベント（フィルタリングはしない）
                checkbox.addEventListener('change', () => {
                    this._updateTempFilterSelection(columnIndex, value, checkbox.checked);
                });

                // アイテム全体のクリックでチェックボックスを切り替え
                item.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        this._updateTempFilterSelection(columnIndex, value, checkbox.checked);
                    }
                });

                valueList.appendChild(item);
            });
        }

        /**
         * ドロップダウンの位置を調整
         */
        _positionDropdown(dropdown, button) {
            const rect = button.getBoundingClientRect();
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            dropdown.style.left = `${rect.left + scrollLeft}px`;
            dropdown.style.top = `${rect.bottom + scrollTop + 2}px`;

            // 画面外に出る場合の調整
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const dropdownRect = dropdown.getBoundingClientRect();

            // 右端を超える場合
            if (dropdownRect.right > windowWidth) {
                dropdown.style.left = `${windowWidth - dropdownRect.width - 10 + scrollLeft}px`;
            }

            // 下端を超える場合
            if (dropdownRect.bottom > windowHeight) {
                dropdown.style.top = `${rect.top + scrollTop - dropdownRect.height - 2}px`;
            }
        }

        /**
         * 列の一意な値を取得（全レコード対応）
         */
        _getUniqueColumnValues(columnIndex, fieldCode) {
            // 全レコードキャッシュから値を取得
            if (this.allRecordsCache.has(fieldCode)) {
                return this.allRecordsCache.get(fieldCode);
            }

            // フォールバック：現在表示されている行から取得
            const tbody = this._getTableBody();
            if (!tbody) return [];

            const values = new Set();
            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                const cell = row.children[columnIndex];
                if (cell) {
                    const value = this._extractCellValue(cell, fieldCode);
                    values.add(value);
                }
            });

            return Array.from(values).sort((a, b) => {
                // 空白を最後に
                if (a === '' && b !== '') return 1;
                if (a !== '' && b === '') return -1;
                if (a === '' && b === '') return 0;
                
                // 数値として比較できる場合は数値として比較
                const numA = parseFloat(a);
                const numB = parseFloat(b);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                
                // 文字列として比較
                return a.localeCompare(b, 'ja');
            });
        }

        /**
         * セルから値を抽出
         */
        _extractCellValue(cell, fieldCode) {
            if (!cell) return '';

            try {
                // data-original-valueから取得を試行
                const originalValue = cell.getAttribute('data-original-value');
                if (originalValue !== null) {
                    return originalValue;
                }

                // 分離ボタン付きセル（primary-key-container）
                const primaryKeyValue = cell.querySelector('.primary-key-value');
                if (primaryKeyValue) {
                    return primaryKeyValue.textContent.trim();
                }

                // フレックスコンテナの値（.flex-value）
                const flexValue = cell.querySelector('.flex-value');
                if (flexValue) {
                    return flexValue.textContent.trim();
                }

                // 入力要素がある場合
                const input = cell.querySelector('input, select, textarea');
                if (input) {
                    return input.value || input.textContent || '';
                }

                // 通常のテキストセル
                let text = cell.textContent || '';
                
                // オートフィルタボタンの▼を除去
                text = text.replace(/▼$/, '').replace(/▲$/, '');
                
                return text.trim();
            } catch (error) {
                return '';
            }
        }

        /**
         * 一時フィルタ選択状態を更新（フィルタリングは実行しない）
         */
        _updateTempFilterSelection(columnIndex, value, isSelected) {
            const tempFilter = this.tempFilters.get(columnIndex) || new Set();
            
            if (isSelected) {
                tempFilter.add(value);
            } else {
                tempFilter.delete(value);
            }
            
            this.tempFilters.set(columnIndex, tempFilter);
        }

        /**
         * フィルタ選択状態を更新（実際のフィルタ適用用）
         */
        _updateFilterSelection(columnIndex, value, isSelected) {
            const filter = this.filters.get(columnIndex) || new Set();
            
            if (isSelected) {
                filter.add(value);
            } else {
                filter.delete(value);
            }
            
            // フィルタが空の場合は削除、そうでなければ設定
            if (filter.size === 0) {
                this.filters.delete(columnIndex);
            } else {
                this.filters.set(columnIndex, filter);
            }
            this._applyFilters();
        }

        /**
         * フィルタ状況の要約を取得（デバッグ用）
         */
        _getFilterSummary() {
            const summary = {};
            this.filters.forEach((filter, columnIndex) => {
                summary[`列${columnIndex}`] = Array.from(filter);
            });
            return summary;
        }

        /**
         * フィルタを適用
         */
        _applyFilters() {
            if (this.filters.size === 0) {
                this._clearPaginationFilter();
                this._updateFilterButtonStates();
                return;
            }

            // 📋 全レコードデータを確認・構築
            if (!this.allRecords || this.allRecords.length === 0) {
                this._loadCachedRecords();
            }

            if (!this.allRecords || this.allRecords.length === 0) {
                // ページングマネージャーから全データを取得
                if (window.paginationManager && window.paginationManager.allData) {
                    this.allRecords = window.paginationManager.allData;
                } else {
                    return;
                }
            }

            // 🔍 フィルタリング実行
            const filteredRecords = this._filterCachedRecords();
            
            // 🔄 ページングマネージャーと連携してフィルタ結果を表示
            this._applyFilterWithPagination(filteredRecords);

            this._updateFilterButtonStates();
        }

        /**
         * キャッシュレコードをフィルタリング
         */
        _filterCachedRecords() {
            if (!this.allRecords || this.allRecords.length === 0) {
                return [];
            }

            // フィルタ条件とフィールドコードを事前に準備（無限ループ防止）
            const filterConditions = [];
            for (const [columnIndex, filter] of this.filters) {
                if (!filter || filter.size === 0) {
                    continue;
                }
                
                const fieldCode = this._getFieldCodeByColumnIndex(columnIndex);
                if (!fieldCode) continue;
                
                filterConditions.push({
                    fieldCode: fieldCode,
                    values: filter
                });
            }

            if (filterConditions.length === 0) {
                return this.allRecords;
            }

            const filteredRecords = this.allRecords.filter(record => {
                // 各フィルタ条件をAND条件でチェック
                return filterConditions.every(condition => {
                    const recordValue = this._extractRecordValue(record, condition.fieldCode);
                    return condition.values.has(recordValue);
                });
            });
            
            return filteredRecords;
        }

        /**
         * レコードからフィールド値を抽出
         */
        _extractRecordValue(record, fieldCode) {
            if (!record || !fieldCode) return '';

            // 1. 統合レコードの場合（ledgerDataを持つ）
            if (record.ledgerData) {
                for (const [ledgerType, ledgerRecord] of Object.entries(record.ledgerData)) {
                    if (ledgerRecord && ledgerRecord[fieldCode]) {
                        const fieldValue = ledgerRecord[fieldCode];
                        return this._extractFieldValue(fieldValue);
                    }
                }
            }

            // 2. 通常のkintoneレコードの場合（直接フィールドを持つ）
            if (record[fieldCode]) {
                const fieldValue = record[fieldCode];
                return this._extractFieldValue(fieldValue);
            }

            // 3. 統合レコードで主要な台帳から検索
            if (record.ledgerData) {
                // SEAT, PC, EXT, USER の順で検索
                const ledgerTypes = ['SEAT', 'PC', 'EXT', 'USER'];
                for (const ledgerType of ledgerTypes) {
                    const ledgerRecord = record.ledgerData[ledgerType];
                    if (ledgerRecord) {
                        // レコード内の全フィールドをチェック
                        for (const [key, value] of Object.entries(ledgerRecord)) {
                            if (key === fieldCode) {
                                return this._extractFieldValue(value);
                            }
                        }
                    }
                }
            }

            // 4. レコードのすべてのプロパティを検索（フォールバック）
            for (const [key, value] of Object.entries(record)) {
                if (key === fieldCode) {
                    return this._extractFieldValue(value);
                }
            }

            return '';
        }

        /**
         * フィールド値から表示値を抽出
         */
        _extractFieldValue(fieldValue) {
            if (fieldValue === null || fieldValue === undefined) return '';

            // 1. 文字列・数値の場合
            if (typeof fieldValue === 'string' || typeof fieldValue === 'number') {
                return fieldValue.toString();
            }

            // 2. kintoneフィールド形式（{value: ...}）の場合
            if (fieldValue.value !== undefined) {
                if (Array.isArray(fieldValue.value)) {
                    // 配列の場合（複数選択、ユーザー選択など）
                    return fieldValue.value.map(item => {
                        if (typeof item === 'string') return item;
                        if (item.name) return item.name;
                        if (item.code) return item.code;
                        return item.toString();
                    }).join(', ');
                } else {
                    return fieldValue.value.toString();
                }
            }

            // 3. オブジェクトで直接値を持つ場合
            if (typeof fieldValue === 'object') {
                // nameプロパティがある場合（ユーザー情報など）
                if (fieldValue.name) return fieldValue.name;
                // codeプロパティがある場合
                if (fieldValue.code) return fieldValue.code;
                // labelプロパティがある場合
                if (fieldValue.label) return fieldValue.label;
                // textプロパティがある場合
                if (fieldValue.text) return fieldValue.text;
            }

            // 4. 配列の場合
            if (Array.isArray(fieldValue)) {
                return fieldValue.map(item => {
                    if (typeof item === 'string') return item;
                    if (item.name) return item.name;
                    if (item.code) return item.code;
                    return item.toString();
                }).join(', ');
            }

            // 5. その他（フォールバック）
            return fieldValue.toString();
        }

        /**
         * ページングマネージャーと連携してフィルタ適用
         */
        _applyFilterWithPagination(filteredRecords) {
            if (!window.paginationManager) {
                return;
            }

            // フィルタ結果をページングマネージャーに設定（直接filteredDataを更新）
            window.paginationManager.filteredData = filteredRecords;
            window.paginationManager.isFiltered = true;
            window.paginationManager._recalculatePagination();
            window.paginationManager._resetToFirstPage();
            
            // ページングUIとテーブル表示を更新
            if (window.paginationUI) {
                window.paginationUI.updatePaginationUI();
            }
            
            // フィルタ結果の最初のページを表示
            this._displayFilteredPage();
        }

        /**
         * フィルタ結果のページを表示
         */
        _displayFilteredPage() {
            if (this.isUpdatingTable) {
                return;
            }
            
            if (!window.paginationManager) {
                return;
            }
            
            this.isUpdatingTable = true;
            
            try {
                const pageData = window.paginationManager.getCurrentPageData();
                
                // 直接テーブルボディを更新（TableDisplayManagerを使わない）
                this._updateTableDirectly(pageData);
                
            } finally {
                this.isUpdatingTable = false;
            }
        }

        /**
         * テーブルを直接更新（無限ループ回避）
         */
        _updateTableDirectly(pageData) {
            const tbody = this._getTableBody();
            if (!tbody) {
                return;
            }

            // テーブルボディをクリア
            tbody.innerHTML = '';

            if (!pageData || pageData.length === 0) {
                return;
            }

            // フィールド順序を取得
            const fieldOrder = window.fieldsConfig ? 
                window.fieldsConfig.map(field => field.fieldCode) : 
                [];

            // 各レコードを行として追加
            pageData.forEach((record, index) => {
                const row = this._createTableRowDirectly(record, fieldOrder, index);
                tbody.appendChild(row);
            });
        }

        /**
         * テーブル行を直接作成（簡易版）
         */
        _createTableRowDirectly(record, fieldOrder, rowIndex) {
            const row = document.createElement('tr');
            const integrationKey = record.integrationKey || '';
            
            row.setAttribute('data-row-id', rowIndex + 1);
            row.setAttribute('data-integration-key', integrationKey);

            // フィールドごとにセルを作成
            fieldOrder.forEach(fieldCode => {
                const cell = this._createCellDirectly(record, fieldCode, rowIndex, row);
                row.appendChild(cell);
            });

            return row;
        }

        /**
         * セルを直接作成（TableDisplayManagerを使用して一貫性を保つ）
         */
        _createCellDirectly(record, fieldCode, rowIndex, row = null) {
            // 必ずTableDisplayManagerの処理を使用（一貫性を保つため）
            if (!window.tableDisplayManager || !window.tableDisplayManager._createDataCell) {
                console.error('❌ TableDisplayManagerが利用できません（オートフィルタ）');
                throw new Error('TableDisplayManagerが初期化されていません');
            }

            return window.tableDisplayManager._createDataCell(record, fieldCode, row, rowIndex);
        }

        /**
         * ページングフィルタをクリア
         */
        _clearPaginationFilter() {
            if (window.paginationManager) {
                // フィルタ状態をリセット
                window.paginationManager.filteredData = [...window.paginationManager.allData];
                window.paginationManager.isFiltered = false;
                window.paginationManager.currentFilter = null;
                window.paginationManager._recalculatePagination();
                window.paginationManager._resetToFirstPage();
                
                // ページングUIを更新
                if (window.paginationUI) {
                    window.paginationUI.updatePaginationUI();
                }
                
                // 最初のページを表示
                this._displayFilteredPage();
            }
        }

        /**
         * フィルタボタンの状態を更新
         */
        _updateFilterButtonStates() {
            const headerRow = this._getTableHeaderRow();
            if (!headerRow) return;

            Array.from(headerRow.children).forEach((th, columnIndex) => {
                const filterButton = th.querySelector('.auto-filter-button');
                if (!filterButton) return;

                const filter = this.filters.get(columnIndex);
                const hasActiveFilter = filter && filter.size > 0;
                const allValues = this._getUniqueColumnValues(columnIndex, this._getFieldCodeByColumnIndex(columnIndex));
                const isFiltered = hasActiveFilter && filter.size < allValues.length;

                if (isFiltered) {
                    // フィルタが適用されている場合
                    filterButton.style.backgroundColor = '#007acc';
                    filterButton.style.color = 'white';
                    filterButton.style.borderColor = '#005999';
                    filterButton.style.fontWeight = 'bold';
                    filterButton.textContent = '▲';
                } else {
                    // フィルタが適用されていない場合
                    filterButton.style.backgroundColor = '#f5f5f5';
                    filterButton.style.color = 'black';
                    filterButton.style.borderColor = '#ccc';
                    filterButton.style.fontWeight = 'normal';
                    filterButton.textContent = '▼';
                }
            });
        }

        /**
         * ドロップダウン内のチェックボックス状態を更新
         */
        _updateDropdownCheckboxes(dropdown, filter) {
            const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const value = checkbox.getAttribute('data-filter-value');
                checkbox.checked = filter.has(value);
            });
        }

        /**
         * すべてのドロップダウンを閉じる
         */
        _closeAllDropdowns() {
            document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
                dropdown.remove();
            });

            document.querySelectorAll('.active').forEach(button => {
                button.classList.remove('active');
            });
        }

        /**
         * すべてのフィルタをクリア
         */
        clearAllFilters() {
            this._closeAllDropdowns();
            this.filters.clear();
            this._clearPaginationFilter();
            this._updateFilterButtonStates();
        }

        /**
         * 指定列のフィルタをクリア
         */
        clearColumnFilter(columnIndex) {
            this.filters.delete(columnIndex);
            this._applyFilters();
        }

        /**
         * すべての行を表示
         */
        _showAllRows() {
            const tbody = this._getTableBody();
            if (!tbody) return;

            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                row.style.display = '';
            });
        }

        /**
         * フィルタ状態を取得
         */
        getFilterStatus() {
            const status = {};
            for (const [columnIndex, filter] of this.filters) {
                const fieldCode = this._getFieldCodeByColumnIndex(columnIndex);
                status[fieldCode] = Array.from(filter);
            }
            return status;
        }

        /**
         * テーブル更新時に再初期化（キャッシュデータ対応）
         */
        refreshOnTableUpdate() {
            this.isInitialized = false;
            this.filters.clear();
            this.allRecordsCache.clear();
            this._closeAllDropdowns();
            this.initialize();
        }

        /**
         * テーブルヘッダー行を取得（統一メソッド）
         */
        _getTableHeaderRow() {
            // フィルター行を直接取得（これが実際のヘッダー行）
            const filterRow = document.querySelector('#my-filter-row');
            if (filterRow) {
                return filterRow;
            }
            return null;
        }

        /**
         * テーブルボディを取得（統一メソッド）
         */
        _getTableBody() {
            // 1. V2のDOMHelperを試行
            if (window.LedgerV2?.Utils?.DOMHelper?.getTableBody) {
                const tbody = window.LedgerV2.Utils.DOMHelper.getTableBody();
                if (tbody) return tbody;
            }
            
            // 2. 直接セレクタで取得
            const selectors = ['#my-tbody', 'tbody', '.table-body'];
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
            }
            
            return null;
        }

        /**
         * 列インデックスからフィールドコードを取得
         */
        _getFieldCodeByColumnIndex(columnIndex) {
            if (!window.fieldsConfig) {
                return null;
            }
            
            // 列インデックスは0ベースだが、実際のフィールド配列も0ベース
            if (columnIndex >= 0 && columnIndex < window.fieldsConfig.length) {
                const field = window.fieldsConfig[columnIndex];
                return field.fieldCode;
            }
            
            return null;
        }
    }

    // グローバルに公開
    if (!window.LedgerV2) {
        window.LedgerV2 = {};
    }
    if (!window.LedgerV2.AutoFilter) {
        window.LedgerV2.AutoFilter = {};
    }
    
    window.LedgerV2.AutoFilter.AutoFilterManagerV2 = AutoFilterManagerV2;

    // ドキュメント外クリックでドロップダウンを閉じる
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown') &&
            !e.target.closest('.auto-filter-button')) {
            if (window.autoFilterManager) {
                window.autoFilterManager._closeAllDropdowns();
            }
        }
    });

})(); 