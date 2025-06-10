/**
 * 🔍 オートフィルタ機能モジュール v2
 * @description Excelライクなテーブルフィルタ機能を提供
 * 
 * ■主な機能:
 * ・各列のヘッダーにフィルタドロップダウンボタンを追加
 * ・列ごとの値一覧をチェックボックスで表示/非表示選択
 * ・複数列のフィルタ組み合わせによる絞り込み
 * ・フィルタ状態の視覚的表示（アクティブボタンの色変更）
 * ・フィルタのクリア機能
 * 
 * ■動作:
 * 1. テーブル表示後に initialize() で各ヘッダーにボタン追加
 * 2. ボタンクリックでドロップダウン表示
 * 3. チェックボックス操作で行の表示/非表示制御
 * 4. 複数フィルタは AND 条件で適用
 */

(() => {
    'use strict';

    /**
     * 🔍 オートフィルタ管理クラス v2
     * @description テーブルの各列にフィルタ機能を提供
     */
    class AutoFilterManagerV2 {
        constructor() {
            this.filters = new Map(); // 列ごとのフィルタ状態
            this.originalRows = []; // 元の行データ
            this.filteredRows = []; // フィルタ後の行データ
            this.isInitialized = false;
        }

        /**
         * オートフィルタを初期化
         */
        initialize() {
            if (this.isInitialized) return;
            
            console.log('🔍 オートフィルタ初期化開始...');
            console.log('🔍 fieldsConfig利用可能:', !!window.fieldsConfig);
            console.log('🔍 fieldsConfig項目数:', window.fieldsConfig?.length || 0);
            
            // テーブルの行データを保存
            this._saveOriginalRows();
            
            // ヘッダーにフィルタボタンを追加
            this._addFilterButtonsToHeaders();
            
            this.isInitialized = true;
            console.log('🔍 オートフィルタ機能v2を初期化しました');
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
                console.warn('⚠️ テーブルヘッダー行が見つかりません');
                return;
            }

            console.log('🔍 テーブルヘッダー行を発見:', headerRow);
            console.log('🔍 ヘッダー列数:', headerRow.children.length);

            let buttonCount = 0;
            Array.from(headerRow.children).forEach((th, columnIndex) => {
                // filter-input要素からfieldCodeを取得
                const filterInput = th.querySelector('.filter-input[data-field-code]');
                if (!filterInput) {
                    console.log(`🔍 列${columnIndex}: フィルタ入力要素が見つかりません`);
                    return;
                }
                
                const fieldCode = filterInput.getAttribute('data-field-code');
                const headerLabel = th.querySelector('.header-label')?.textContent?.trim() || '';
                console.log(`🔍 列${columnIndex}: fieldCode="${fieldCode}", label="${headerLabel}"`);
                
                // 行番号列やボタン列はスキップ
                if (!fieldCode || fieldCode === '_row_number' || fieldCode === '_modification_checkbox' || fieldCode === '_hide_button') {
                    console.log(`  ⏭️ スキップ: ${fieldCode || 'フィールドコードなし'}`);
                    return;
                }

                // フィールド設定を取得
                const field = window.fieldsConfig?.find(f => f.fieldCode === fieldCode);
                if (!field) {
                    console.log(`  ❌ フィールド設定が見つかりません: ${fieldCode}`);
                    return;
                }

                console.log(`  ✅ フィルタボタン追加: ${field.label} (${fieldCode})`);
                this._addFilterButtonToHeader(th, columnIndex, field.label, fieldCode);
                buttonCount++;
            });

            console.log(`🔍 追加されたフィルタボタン数: ${buttonCount}`);
        }

        /**
         * 個別のヘッダーにフィルタボタンを追加
         */
        _addFilterButtonToHeader(headerCell, columnIndex, fieldLabel, fieldCode) {
            // 既にフィルタボタンがある場合はスキップ
            if (headerCell.querySelector('.auto-filter-button')) {
                console.log(`    ⚠️ フィルタボタンが既に存在: ${fieldLabel}`);
                return;
            }

            console.log(`    🔧 フィルタボタン作成中: ${fieldLabel}`);
            
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
            console.log(`    ✅ フィルタボタン追加完了: ${fieldLabel}`, filterButton);
        }

        /**
         * フィルタドロップダウンを表示
         */
        _showFilterDropdown(button, columnIndex, fieldLabel, fieldCode) {
            // 既存のドロップダウンを閉じる
            this._closeAllDropdowns();

            // この列のフィルタが存在しない場合、現在表示されている値すべてを含むフィルタを作成
            if (!this.filters.has(columnIndex)) {
                const visibleValues = this._getUniqueColumnValues(columnIndex, fieldCode);
                this.filters.set(columnIndex, new Set(visibleValues));
            }

            // ドロップダウンコンテナを作成
            const dropdown = this._createFilterDropdown(columnIndex, fieldLabel, fieldCode);
            
            // ページ上に追加
            document.body.appendChild(dropdown);
            
            // 位置を計算
            this._positionDropdown(dropdown, button);
            
            // アクティブフィルタボタンとして記録
            button.classList.add('active-filter');
        }

        /**
         * フィルタドロップダウンを作成
         */
        _createFilterDropdown(columnIndex, fieldLabel, fieldCode) {
            const dropdown = document.createElement('div');
            dropdown.className = 'auto-filter-dropdown';

            // ヘッダー部分
            const header = document.createElement('div');
            header.textContent = `${fieldLabel} でフィルタ`;

            // 操作ボタン部分
            const controls = document.createElement('div');

            // 左側のボタングループ
            const leftButtons = document.createElement('div');

            const selectAllBtn = document.createElement('button');
            selectAllBtn.textContent = 'すべて選択';

            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.textContent = 'すべて解除';

            // 閉じるボタン（右側）
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '閉じる';
            closeBtn.style.cssText = `
                padding: 8px 16px;
                font-size: 12px;
                border: 1px solid #4CAF50;
                background-color: #4CAF50;
                color: white;
                cursor: pointer;
                border-radius: 6px;
                font-weight: 600;
            `;

            // イベントリスナー
            selectAllBtn.addEventListener('click', () => {
                const uniqueValues = this._getUniqueColumnValues(columnIndex, fieldCode);
                this.filters.set(columnIndex, new Set(uniqueValues));
                this._updateDropdownCheckboxes(dropdown, this.filters.get(columnIndex));
                this._applyFilters();
            });

            deselectAllBtn.addEventListener('click', () => {
                this.filters.set(columnIndex, new Set());
                this._updateDropdownCheckboxes(dropdown, this.filters.get(columnIndex));
                this._applyFilters();
            });

            closeBtn.addEventListener('click', () => {
                this._closeAllDropdowns();
            });

            leftButtons.appendChild(selectAllBtn);
            leftButtons.appendChild(deselectAllBtn);
            
            controls.appendChild(leftButtons);
            controls.appendChild(closeBtn);

            // 値一覧部分
            const valueList = document.createElement('div');
            valueList.className = 'filter-value-list';

            // 列の値を取得してチェックボックス一覧を作成
            const uniqueValues = this._getUniqueColumnValues(columnIndex, fieldCode);
            const currentFilter = this.filters.get(columnIndex);

            uniqueValues.forEach(value => {
                const item = document.createElement('div');
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f0f0f0';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = 'transparent';
                });

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = currentFilter.has(value);
                checkbox.setAttribute('data-filter-value', value);

                const label = document.createElement('span');
                label.textContent = value === '' ? '(空白)' : value;

                item.appendChild(checkbox);
                item.appendChild(label);

                // チェックボックスの変更イベント
                checkbox.addEventListener('change', () => {
                    this._updateFilterSelection(columnIndex, value, checkbox.checked);
                });

                // アイテム全体のクリックでチェックボックスを切り替え
                item.addEventListener('click', (e) => {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        this._updateFilterSelection(columnIndex, value, checkbox.checked);
                    }
                });

                valueList.appendChild(item);
            });

            dropdown.appendChild(header);
            dropdown.appendChild(controls);
            dropdown.appendChild(valueList);

            return dropdown;
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
         * 列の一意な値を取得
         */
        _getUniqueColumnValues(columnIndex, fieldCode) {
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
                console.warn('⚠️ セル値抽出エラー:', error, cell);
                return '';
            }
        }

        /**
         * フィルタ選択状態を更新
         */
        _updateFilterSelection(columnIndex, value, isSelected) {
            const filter = this.filters.get(columnIndex) || new Set();
            
            if (isSelected) {
                filter.add(value);
            } else {
                filter.delete(value);
            }
            
            this.filters.set(columnIndex, filter);
            this._applyFilters();
        }

        /**
         * フィルタを適用
         */
        _applyFilters() {
            const tbody = this._getTableBody();
            if (!tbody) return;

            const rows = tbody.querySelectorAll('tr');
            
            rows.forEach((row, rowIndex) => {
                let isVisible = true;

                // 各列のフィルタをAND条件でチェック
                for (const [columnIndex, filter] of this.filters) {
                    if (filter.size === 0) {
                        // フィルタが空の場合は非表示
                        isVisible = false;
                        break;
                    }

                    const cell = row.children[columnIndex];
                    if (!cell) continue;

                    const fieldCode = this._getFieldCodeByColumnIndex(columnIndex);
                    const cellValue = this._extractCellValue(cell, fieldCode);
                    
                    if (!filter.has(cellValue)) {
                        isVisible = false;
                        break;
                    }
                }

                // 行の表示/非表示を切り替え
                row.style.display = isVisible ? '' : 'none';
            });

            // フィルタボタンの状態を更新
            this._updateFilterButtonStates();
        }

        /**
         * 列インデックスからフィールドコードを取得
         */
        _getFieldCodeByColumnIndex(columnIndex) {
            const headerRow = this._getTableHeaderRow();
            if (!headerRow) return '';

            const headerCell = headerRow.children[columnIndex];
            return headerCell ? headerCell.getAttribute('data-field-code') || '' : '';
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
            document.querySelectorAll('.auto-filter-dropdown').forEach(dropdown => {
                dropdown.remove();
            });

            document.querySelectorAll('.active-filter').forEach(button => {
                button.classList.remove('active-filter');
            });
        }

        /**
         * すべてのフィルタをクリア
         */
        clearAllFilters() {
            this._closeAllDropdowns();
            this.filters.clear();
            this._showAllRows();
            this._updateFilterButtonStates();
            console.log('🔍 すべてのフィルタをクリアしました');
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
         * テーブル更新時に再初期化
         */
        refreshOnTableUpdate() {
            this.isInitialized = false;
            this.filters.clear();
            this._closeAllDropdowns();
            this.initialize();
        }

        /**
         * デバッグ用：フィルタ状態を出力
         */
        debugFilterState() {
            console.group('🔍 オートフィルタ状態');
            console.log('初期化済み:', this.isInitialized);
            console.log('フィルタ数:', this.filters.size);
            
            for (const [columnIndex, filter] of this.filters) {
                const fieldCode = this._getFieldCodeByColumnIndex(columnIndex);
                console.log(`列${columnIndex} (${fieldCode}):`, Array.from(filter));
            }
            
            console.groupEnd();
        }

        /**
         * テーブルヘッダー行を取得（統一メソッド）
         */
        _getTableHeaderRow() {
            console.log('🔍 テーブルヘッダー行を検索中...');
            
            // フィルター行を直接取得（これが実際のヘッダー行）
            const filterRow = document.querySelector('#my-filter-row');
            if (filterRow) {
                console.log('  ✅ フィルター行を発見:', filterRow);
                console.log(`  📊 フィルター行内のth要素数: ${filterRow.querySelectorAll('th').length}`);
                return filterRow;
            }
            
            console.log('  ❌ フィルター行が見つかりませんでした');
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
        if (!e.target.closest('.auto-filter-dropdown') &&
            !e.target.closest('.auto-filter-button')) {
            if (window.autoFilterManager) {
                window.autoFilterManager._closeAllDropdowns();
            }
        }
    });

    console.log('✅ オートフィルタモジュールv2を読み込みました');

})(); 