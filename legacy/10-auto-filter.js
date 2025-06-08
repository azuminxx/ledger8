/**
 * 🔍 オートフィルタ機能モジュール
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
  "use strict";

  /**
   * 🔍 オートフィルタ管理クラス
   * @description テーブルの各列にフィルタ機能を提供
   */
  class AutoFilterManager {
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
      
      // テーブルの行データを保存
      this._saveOriginalRows();
      
      // ヘッダーにフィルタボタンを追加
      this._addFilterButtonsToHeaders();
      
      this.isInitialized = true;
      //console.log('🔍 オートフィルタ機能を初期化しました');
    }

    /**
     * 元の行データを保存
     */
    _saveOriginalRows() {
      const tbody = document.getElementById('my-tbody');
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
      const headerRow = document.getElementById('my-thead-row');
      if (!headerRow) return;

      Array.from(headerRow.children).forEach((th, columnIndex) => {
        // 行番号列やボタン列はスキップ
        const fieldLabel = th.textContent.trim();
        if (fieldLabel === '行番号' || fieldLabel === '✅' || fieldLabel === '👁️‍🗨️') {
          return;
        }

        this._addFilterButtonToHeader(th, columnIndex, fieldLabel);
      });
    }

    /**
     * 個別のヘッダーにフィルタボタンを追加
     */
    _addFilterButtonToHeader(headerCell, columnIndex, fieldLabel) {
      // ヘッダーセルを相対位置にする
      headerCell.style.position = 'relative';
      
      // フィルタボタンを作成
      const filterButton = document.createElement('button');
      filterButton.textContent = '▼';
      filterButton.className = 'auto-filter-button';
      filterButton.title = `${fieldLabel}でフィルタ`;
      
      // ボタンのスタイル
      filterButton.style.cssText = `
        position: absolute;
        top: 2px;
        right: 8px;
        width: 14px;
        height: 16px;
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        font-size: 8px;
        cursor: pointer;
        padding: 0;
        line-height: 14px;
        border-radius: 2px;
        z-index: 15;
      `;

      // ホバー効果
      filterButton.addEventListener('mouseenter', () => {
        filterButton.style.backgroundColor = '#e0e0e0';
        filterButton.style.borderColor = '#999';
      });
      filterButton.addEventListener('mouseleave', () => {
        filterButton.style.backgroundColor = '#f5f5f5';
        filterButton.style.borderColor = '#ccc';
      });

      // クリックイベント
      filterButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._showFilterDropdown(filterButton, columnIndex, fieldLabel);
      });

      headerCell.appendChild(filterButton);
    }

    /**
     * フィルタドロップダウンを表示
     */
    _showFilterDropdown(button, columnIndex, fieldLabel) {
      // 既存のドロップダウンを閉じる
      this._closeAllDropdowns();

      // 🔧 この列のフィルタが存在しない場合、現在表示されている値すべてを含むフィルタを作成
      if (!this.filters.has(columnIndex)) {
        const visibleValues = this._getUniqueColumnValues(columnIndex);
        this.filters.set(columnIndex, new Set(visibleValues));
      }

      // ドロップダウンコンテナを作成
      const dropdown = this._createFilterDropdown(columnIndex, fieldLabel);
      
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
    _createFilterDropdown(columnIndex, fieldLabel) {
      const dropdown = document.createElement('div');
      dropdown.className = 'auto-filter-dropdown';
      dropdown.style.cssText = `
        position: absolute;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        min-width: 200px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        font-size: 12px;
      `;

      // ヘッダー部分
      const header = document.createElement('div');
      header.style.cssText = `
        padding: 8px;
        border-bottom: 1px solid #eee;
        background-color: #f8f9fa;
        font-weight: bold;
      `;
      header.textContent = `${fieldLabel} でフィルタ`;

      // 操作ボタン部分
      const controls = document.createElement('div');
      controls.style.cssText = `
        padding: 8px;
        border-bottom: 1px solid #eee;
        display: flex;
        gap: 8px;
        justify-content: space-between;
        align-items: center;
      `;

      // 左側のボタングループ
      const leftButtons = document.createElement('div');
      leftButtons.style.cssText = `
        display: flex;
        gap: 8px;
      `;

      const selectAllBtn = document.createElement('button');
      selectAllBtn.textContent = 'すべて選択';
      selectAllBtn.style.cssText = `
        padding: 4px 8px;
        font-size: 11px;
        border: 1px solid #ccc;
        background-color: #f5f5f5;
        cursor: pointer;
        border-radius: 2px;
      `;

      const deselectAllBtn = document.createElement('button');
      deselectAllBtn.textContent = 'すべて解除';
      deselectAllBtn.style.cssText = `
        padding: 4px 8px;
        font-size: 11px;
        border: 1px solid #ccc;
        background-color: #f5f5f5;
        cursor: pointer;
        border-radius: 2px;
      `;

      // 閉じるボタン（右側）
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '閉じる';
      closeBtn.style.cssText = `
        padding: 4px 12px;
        font-size: 11px;
        border: 1px solid #007acc;
        background-color: #007acc;
        color: white;
        cursor: pointer;
        border-radius: 2px;
        font-weight: bold;
      `;
      closeBtn.addEventListener('click', () => {
        this._closeAllDropdowns();
      });

      leftButtons.appendChild(selectAllBtn);
      leftButtons.appendChild(deselectAllBtn);
      
      controls.appendChild(leftButtons);
      controls.appendChild(closeBtn);

      // 値一覧部分
      const valueList = document.createElement('div');
      valueList.style.cssText = `
        padding: 4px;
        max-height: 200px;
        overflow-y: auto;
      `;

      // 列の値を取得してチェックボックス一覧を作成
      const uniqueValues = this._getUniqueColumnValues(columnIndex);
      const currentFilter = this.filters.get(columnIndex); // フィルタは既に初期化済み

      uniqueValues.forEach(value => {
        const item = document.createElement('div');
        item.style.cssText = `
          padding: 2px 4px;
          display: flex;
          align-items: center;
          cursor: pointer;
        `;
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#f0f0f0';
        });
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'transparent';
        });

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        // 🔧 フィルタに含まれる値のみチェック（フィルタは既に初期化済み）
        checkbox.checked = currentFilter.has(value);
        checkbox.style.marginRight = '6px';

        const label = document.createElement('span');
        label.textContent = value === '' ? '(空白)' : value;
        label.style.fontSize = '11px';

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
            checkbox.dispatchEvent(new Event('change'));
          }
        });

        valueList.appendChild(item);
      });

      // すべて選択/解除のイベント
      selectAllBtn.addEventListener('click', () => {
        valueList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
          cb.dispatchEvent(new Event('change'));
        });
      });

      deselectAllBtn.addEventListener('click', () => {
        valueList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = false;
          cb.dispatchEvent(new Event('change'));
        });
      });

      // 要素を組み立て
      dropdown.appendChild(header);
      dropdown.appendChild(controls);
      dropdown.appendChild(valueList);

      return dropdown;
    }

    /**
     * ドロップダウンの位置を設定
     */
    _positionDropdown(dropdown, button) {
      const rect = button.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      dropdown.style.left = `${rect.left + scrollLeft}px`;
      dropdown.style.top = `${rect.bottom + scrollTop + 2}px`;

      // 画面外に出る場合の調整
      setTimeout(() => {
        const dropdownRect = dropdown.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // 右端チェック
        if (dropdownRect.right > windowWidth) {
          dropdown.style.left = `${windowWidth - dropdownRect.width - 10 + scrollLeft}px`;
        }

        // 下端チェック
        if (dropdownRect.bottom > windowHeight) {
          dropdown.style.top = `${rect.top + scrollTop - dropdownRect.height - 2}px`;
        }
      }, 0);
    }

    /**
     * 列の一意な値を取得
     */
    _getUniqueColumnValues(columnIndex) {
      const values = new Set();
      const tbody = document.getElementById('my-tbody');
      
      if (!tbody) return [];

      // 🔧 現在表示されている行のみから値を取得
      // これにより、既に適用されているフィルタの結果に基づいて選択肢を絞り込む
      Array.from(tbody.querySelectorAll('tr')).forEach(row => {
        // 非表示の行はスキップ
        if (row.style.display === 'none') return;
        
        const cell = row.children[columnIndex];
        if (cell) {
          const value = this._extractCellValue(cell);
          values.add(value);
        }
      });

      // 空文字列を含む場合は最後に配置
      const sortedValues = Array.from(values).sort((a, b) => {
        if (a === '') return 1;
        if (b === '') return -1;
        return a.localeCompare(b, 'ja');
      });

      return sortedValues;
    }

    /**
     * セルから値を抽出
     */
    _extractCellValue(cell) {
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

      // リンクがある場合
      const link = cell.querySelector('a');
      if (link) {
        return link.textContent.trim();
      }

      // span要素がある場合（分離ボタン付きセル）
      const span = cell.querySelector('div > span');
      if (span) {
        return span.textContent.trim();
      }

      // 通常のテキスト
      return cell.textContent.trim();
    }

    /**
     * フィルタ選択を更新
     */
    _updateFilterSelection(columnIndex, value, isSelected) {
      if (!this.filters.has(columnIndex)) {
        this.filters.set(columnIndex, new Set());
      }

      const filter = this.filters.get(columnIndex);
      
      if (isSelected) {
        filter.add(value);
      } else {
        filter.delete(value);
      }

      // 🔧 フィルタが空になった場合の処理（すべて非表示になる）
      // フィルタは削除せず、空のSetとして保持する
      // これにより、チェックボックスを外すとその値が非表示になる

      // フィルタを適用
      this._applyFilters();
    }

    /**
     * フィルタを適用
     */
    _applyFilters() {
      const tbody = document.getElementById('my-tbody');
      if (!tbody) return;

      const rows = Array.from(tbody.querySelectorAll('tr'));
      
      rows.forEach((row, rowIndex) => {
        let isVisible = true;

        // 各列のフィルタをチェック
        this.filters.forEach((filter, columnIndex) => {
          // 🔧 フィルタが存在する場合のみチェック（空フィルタは削除済み）
          const cell = row.children[columnIndex];
          const cellValue = cell ? this._extractCellValue(cell) : '';
          
          if (!filter.has(cellValue)) {
            isVisible = false;
          }
        });

        // 行の表示/非表示を設定
        row.style.display = isVisible ? '' : 'none';
      });

      // フィルタボタンの表示を更新
      this._updateFilterButtonStates();
    }

    /**
     * フィルタボタンの状態を更新
     */
    _updateFilterButtonStates() {
      const headerRow = document.getElementById('my-thead-row');
      if (!headerRow) return;

      Array.from(headerRow.children).forEach((th, columnIndex) => {
        const filterButton = th.querySelector('.auto-filter-button');
        if (!filterButton) return;

        // 🔧 フィルタが存在するかどうかで判定（空フィルタは既に削除済み）
        const hasActiveFilter = this.filters.has(columnIndex);

        if (hasActiveFilter) {
          filterButton.style.backgroundColor = '#007acc';
          filterButton.style.color = 'white';
          filterButton.style.borderColor = '#005999';
          filterButton.style.fontWeight = 'bold';
          filterButton.textContent = '▲';
        } else {
          filterButton.style.backgroundColor = '#f5f5f5';
          filterButton.style.color = 'black';
          filterButton.style.borderColor = '#ccc';
          filterButton.style.fontWeight = 'normal';
          filterButton.textContent = '▼';
        }
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
     * 全フィルタをクリア
     */
    clearAllFilters() {
      this.filters.clear();
      this._applyFilters();
      this._closeAllDropdowns();
      
      //console.log('🔍 すべてのフィルタをクリアしました');
    }

    /**
     * 特定列のフィルタをクリア
     */
    clearColumnFilter(columnIndex) {
      this.filters.delete(columnIndex);
      this._applyFilters();
      
      //console.log(`🔍 列${columnIndex}のフィルタをクリアしました`);
    }

    /**
     * フィルタ状態を取得
     */
    getFilterStatus() {
      const status = {};
      this.filters.forEach((filter, columnIndex) => {
        const headerRow = document.getElementById('my-thead-row');
        const fieldLabel = headerRow?.children[columnIndex]?.textContent || `列${columnIndex}`;
        status[fieldLabel] = Array.from(filter);
      });
      return status;
    }

    /**
     * テーブル更新時にフィルタを再初期化
     */
    refreshOnTableUpdate() {
      // 行データを再保存
      this._saveOriginalRows();
      
      // 既存のフィルタを再適用
      this._applyFilters();
      
      //console.log('🔍 テーブル更新によりフィルタを再適用しました');
    }

    /**
     * 🧪 デバッグ用: フィルタ状態の詳細情報を表示
     */
    debugFilterState() {
      const tbody = document.getElementById('my-tbody');
      const headerRow = document.getElementById('my-thead-row');
      
      if (!tbody || !headerRow) {
        //console.log('🚫 テーブル要素が見つかりません');
        return;
      }

      const totalRows = tbody.querySelectorAll('tr').length;
      const visibleRows = Array.from(tbody.querySelectorAll('tr')).filter(row => row.style.display !== 'none').length;
      
    //   console.log('🔍 オートフィルタ状態:', {
    //     isInitialized: this.isInitialized,
    //     totalRows: totalRows,
    //     visibleRows: visibleRows,
    //     hiddenRows: totalRows - visibleRows,
    //     activeFilters: this.filters.size,
    //     filterDetails: this.getFilterStatus()
    //   });

      return {
        initialized: this.isInitialized,
        rows: { total: totalRows, visible: visibleRows, hidden: totalRows - visibleRows },
        filters: this.getFilterStatus()
      };
    }

    /**
     * 🧪 詳細デバッグ: 特定行がフィルタ条件を満たすかをチェック
     */
    debugRowVisibility(rowIndex) {
      const tbody = document.getElementById('my-tbody');
      const headerRow = document.getElementById('my-thead-row');
      
      if (!tbody || !headerRow) {
        console.log('🚫 テーブル要素が見つかりません');
        return;
      }

      const rows = Array.from(tbody.querySelectorAll('tr'));
      if (rowIndex >= rows.length) {
        console.log(`🚫 行インデックス ${rowIndex} は範囲外です（最大: ${rows.length - 1}）`);
        return;
      }

      const row = rows[rowIndex];
      console.log(`🔍 行 ${rowIndex} の詳細分析:`);
      
      let shouldBeVisible = true;
      const filterResults = [];

      this.filters.forEach((filter, columnIndex) => {
        const cell = row.children[columnIndex];
        const cellValue = cell ? this._extractCellValue(cell) : '';
        const fieldLabel = headerRow.children[columnIndex]?.textContent || `列${columnIndex}`;
        const passesFilter = filter.has(cellValue);
        
        filterResults.push({
          column: fieldLabel,
          columnIndex: columnIndex,
          cellValue: cellValue,
          allowedValues: Array.from(filter),
          passesFilter: passesFilter
        });

        if (!passesFilter) {
          shouldBeVisible = false;
        }
      });

      const actuallyVisible = row.style.display !== 'none';

    //   console.log('📊 フィルタ結果:', {
    //     rowIndex: rowIndex,
    //     shouldBeVisible: shouldBeVisible,
    //     actuallyVisible: actuallyVisible,
    //     consistent: shouldBeVisible === actuallyVisible,
    //     filterResults: filterResults,
    //     totalActiveFilters: this.filters.size
    //   });

      return {
        rowIndex,
        shouldBeVisible,
        actuallyVisible,
        consistent: shouldBeVisible === actuallyVisible,
        filterResults
      };
    }

    /**
     * 🧪 全行の可視性をチェック
     */
    debugAllRowsVisibility() {
      const tbody = document.getElementById('my-tbody');
      if (!tbody) return;

      const rows = Array.from(tbody.querySelectorAll('tr'));
      const inconsistentRows = [];

      rows.forEach((row, index) => {
        const result = this.debugRowVisibility(index);
        if (result && !result.consistent) {
          inconsistentRows.push(result);
        }
      });

      if (inconsistentRows.length > 0) {
        console.log('🚨 一貫性のない行が見つかりました:', inconsistentRows);
      } else {
        console.log('✅ すべての行で期待通りの表示/非表示が適用されています');
      }

      return {
        totalRows: rows.length,
        inconsistentRows: inconsistentRows.length,
        details: inconsistentRows
      };
    }
  }

  // グローバルに公開
  window.AutoFilterManager = AutoFilterManager;

  // ドキュメント全体のクリックでドロップダウンを閉じる
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.auto-filter-dropdown') && 
        !e.target.closest('.auto-filter-button')) {
      if (window.autoFilterManager) {
        window.autoFilterManager._closeAllDropdowns();
      }
    }
  });

})(); 