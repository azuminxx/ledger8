/**
 * 統合台帳システム v2 - ページネーション機能
 * @description ページネーション管理・UI機能
 * @version 2.0.0
 * 
 * 🎯 **ファイルの責任範囲**
 * ✅ 大量データのページ分割管理
 * ✅ ページネーションUI作成・更新
 * ✅ ページ移動機能（前/次/最初/最後）
 * ✅ フィルタ適用時のページネーション
 * ✅ ページ情報の計算・提供
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ テーブル描画・表示（table-render.jsの責任）
 * ❌ ユーザーイベント処理（table-interact.jsの責任）
 * ❌ API通信・データ検索（core.jsの責任）
 * ❌ システム初期化（table-header.jsの責任）
 * 
 * 📦 **含まれるクラス**
 * - PaginationManager: ページネーション数値管理
 * - PaginationUIManager: ページネーションUI管理
 * 
 * 🔗 **依存関係**
 * - window.fieldsConfig (フィールド設定)
 * - TableDisplayManager (ページデータ表示)
 * 
 * 💡 **使用例**
 * ```javascript
 * const paginationManager = new PaginationManager();
 * paginationManager.setAllData(records);
 * const pageData = paginationManager.getCurrentPageData();
 * ```
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.Pagination = {};

    // =============================================================================
    // ページネーション管理
    // =============================================================================

    class PaginationManager {
        constructor() {
            this.allData = [];           // 全レコードデータ
            this.filteredData = [];      // フィルタ後のデータ
            this.currentPage = 1;        // 現在のページ番号
            this.pageSize = 100;         // 1ページあたりの表示件数
            this.totalPages = 0;         // 総ページ数
            this.currentFilter = null;   // 現在のフィルタ条件
            this.isFiltered = false;     // フィルタ適用中フラグ
        }

        /**
         * 🗂️ 全データを設定（初期読み込み・検索結果）
         */
        setAllData(records) {
            this.allData = records || [];
            this.filteredData = [...this.allData];
            this.isFiltered = false;
            this.currentFilter = null;
            this._recalculatePagination();
            this._resetToFirstPage();
        }

        /**
         * 🔍 フィルタ適用（全データに対して）
         */
        applyFilter(filterConditions) {
            if (!filterConditions || Object.keys(filterConditions).length === 0) {
                // フィルタクリア
                this.filteredData = [...this.allData];
                this.isFiltered = false;
                this.currentFilter = null;
            } else {
                // フィルタ適用（全データに対して）
                this.filteredData = this._filterRecords(this.allData, filterConditions);
                this.isFiltered = true;
                this.currentFilter = filterConditions;
            }

            this._recalculatePagination();
            this._resetToFirstPage();
        }

        /**
         * 📋 現在ページのデータを取得
         */
        getCurrentPageData() {
            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;
            const pageData = this.filteredData.slice(startIndex, endIndex);
            return pageData;
        }

        /**
         * 📄 ページ移動
         */
        goToPage(pageNumber) {
            if (pageNumber < 1 || pageNumber > this.totalPages) {
                return false;
            }

            this.currentPage = pageNumber;
            return true;
        }

        /**
         * ⬅️ 前のページ
         */
        goToPreviousPage() {
            return this.goToPage(this.currentPage - 1);
        }

        /**
         * ➡️ 次のページ
         */
        goToNextPage() {
            return this.goToPage(this.currentPage + 1);
        }

        /**
         * ⏮️ 最初のページ
         */
        goToFirstPage() {
            return this.goToPage(1);
        }

        /**
         * ⏭️ 最後のページ
         */
        goToLastPage() {
            return this.goToPage(this.totalPages);
        }

        /**
         * 📊 ページネーション情報を取得
         */
        getPaginationInfo() {
            const startRecord = this.totalPages > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
            const endRecord = Math.min(this.currentPage * this.pageSize, this.filteredData.length);

            return {
                currentPage: this.currentPage,
                totalPages: this.totalPages,
                pageSize: this.pageSize,
                totalRecords: this.filteredData.length,
                allRecords: this.allData.length,
                startRecord,
                endRecord,
                isFirstPage: this.currentPage === 1,
                isLastPage: this.currentPage === this.totalPages,
                isFiltered: this.isFiltered,
                filterConditions: this.currentFilter
            };
        }

        /**
         * 🔄 ページネーション再計算
         */
        _recalculatePagination() {
            this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
            if (this.totalPages === 0) this.totalPages = 1;
        }

        /**
         * 🏠 最初のページにリセット
         */
        _resetToFirstPage() {
            this.currentPage = 1;
        }

        /**
         * 🔍 レコードフィルタリング実行
         */
        _filterRecords(records, filterConditions) {
            return records.filter(record => {
                return Object.entries(filterConditions).every(([fieldCode, filterValue]) => {
                    const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
                    const recordValue = record[fieldCode] || '';
                    
                    if (!field || !filterValue) return true;

                    // フィールドタイプに応じたフィルタリング
                    switch (field.searchOperator) {
                        case 'like':
                            return recordValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                        case '=':
                        case 'in':
                            return recordValue.toString() === filterValue.toString();
                        default:
                            return recordValue.toString().toLowerCase().includes(filterValue.toLowerCase());
                    }
                });
            });
        }
    }

    // =============================================================================
    // ページネーションUI管理
    // =============================================================================
    
    class PaginationUIManager {
        constructor(paginationManager) {
            this.paginationManager = paginationManager;
            this.container = null;
        }

        /**
         * 🎨 ページネーションUIを作成
         */
        createPaginationUI() {
            // 既存のUIを削除
            this._removePaginationUI();

            // データが少ない場合はUIを表示しない
            const info = this.paginationManager.getPaginationInfo();
            if (info.totalRecords <= this.paginationManager.pageSize) {
                return;
            }

            const table = document.querySelector('#my-table');
            if (!table || !table.parentNode) {
                console.error('❌ テーブルが見つかりません');
                return;
            }

            // 上部ページネーション作成
            this.topContainer = this._createPaginationContainer('top-pagination-container', 'ページネーション（上部）');
            table.parentNode.insertBefore(this.topContainer, table);

            // 下部ページネーション作成
            this.bottomContainer = this._createPaginationContainer('bottom-pagination-container', 'ページネーション（下部）');
            table.parentNode.insertBefore(this.bottomContainer, table.nextSibling);
        }

        /**
         * 🎨 個別ページネーションコンテナを作成
         */
        _createPaginationContainer(containerId, label) {
            const container = document.createElement('div');
            container.id = containerId;
            container.className = 'pagination-container';

            // ページネーション情報とコントロールを作成
            this._createPaginationInfo(container);
            this._createPaginationControls(container);

            return container;
        }

        /**
         * 🔄 ページネーションUIを更新
         */
        updatePaginationUI() {
            // データが少ない場合はUIを削除
            const info = this.paginationManager.getPaginationInfo();
            if (info.totalRecords <= this.paginationManager.pageSize) {
                this._removePaginationUI();
                return;
            }

            if (!this.topContainer || !this.bottomContainer) {
                this.createPaginationUI();
                return;
            }

            // 上部・下部両方の情報とコントロールを更新
            this._updatePaginationInfo();
            this._updatePaginationControls();
        }

        /**
         * 📊 ページネーション情報表示
         */
        _createPaginationInfo(container) {
            const info = this.paginationManager.getPaginationInfo();
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'pagination-info';

            // filterConditionsが存在し、オブジェクトであることを確認
            let filterStatusHtml = '';
            if (info.isFiltered && info.filterConditions && typeof info.filterConditions === 'object') {
                const filterEntries = Object.entries(info.filterConditions);
                if (filterEntries.length > 0) {
                    filterStatusHtml = `
                        <div class="filter-status">
                            🔍 フィルタ適用中: ${filterEntries.map(([k,v]) => `${k}="${v}"`).join(', ')}
                        </div>
                    `;
                }
            }

            infoDiv.innerHTML = `
                <div class="pagination-summary">
                    <span class="record-range">${info.startRecord}〜${info.endRecord}件</span>
                    <span class="record-total">（全${info.totalRecords}件${info.isFiltered ? `・元データ${info.allRecords}件` : ''}）</span>
                    <span class="page-info">ページ ${info.currentPage}/${info.totalPages}</span>
                </div>
                ${filterStatusHtml}
            `;

            container.appendChild(infoDiv);
        }

        /**
         * 🎛️ ページネーションコントロール作成
         */
        _createPaginationControls(container) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'pagination-controls';

            const info = this.paginationManager.getPaginationInfo();

            controlsDiv.innerHTML = `
                <div class="pagination-buttons">
                    <button class="pagination-btn first-page-btn" ${info.isFirstPage ? 'disabled' : ''}>
                        ⏮️ 最初
                    </button>
                    <button class="pagination-btn prev-page-btn" ${info.isFirstPage ? 'disabled' : ''}>
                        ⬅️ 前
                    </button>
                    
                    <div class="page-numbers">
                        ${this._generatePageButtons()}
                    </div>
                    
                    <button class="pagination-btn next-page-btn" ${info.isLastPage ? 'disabled' : ''}>
                        次 ➡️
                    </button>
                    <button class="pagination-btn last-page-btn" ${info.isLastPage ? 'disabled' : ''}>
                        最後 ⏭️
                    </button>
                </div>
                
                <div class="page-jump">
                    <input type="number" class="page-jump-input" min="1" max="${info.totalPages}" 
                           value="${info.currentPage}" placeholder="ページ番号">
                    <button class="pagination-btn page-jump-btn">移動</button>
                </div>
            `;

            // イベントリスナー追加
            this._attachPaginationEvents(controlsDiv);
            
            container.appendChild(controlsDiv);
        }

        /**
         * 🔢 ページ番号ボタン生成
         */
        _generatePageButtons() {
            const info = this.paginationManager.getPaginationInfo();
            const maxButtons = 10;
            const currentPage = info.currentPage;
            const totalPages = info.totalPages;

            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);

            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }

            let buttons = '';
            
            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === currentPage;
                buttons += `
                    <button class="page-number-btn ${isActive ? 'active' : ''}" 
                            data-page="${i}" ${isActive ? 'disabled' : ''}>
                        ${i}
                    </button>
                `;
            }

            return buttons;
        }

        /**
         * 🎯 イベントリスナー設定
         */
        _attachPaginationEvents(controlsDiv) {
            // ナビゲーションボタン
            controlsDiv.querySelector('.first-page-btn').onclick = () => this._navigateToPage(() => this.paginationManager.goToFirstPage());
            controlsDiv.querySelector('.prev-page-btn').onclick = () => this._navigateToPage(() => this.paginationManager.goToPreviousPage());
            controlsDiv.querySelector('.next-page-btn').onclick = () => this._navigateToPage(() => this.paginationManager.goToNextPage());
            controlsDiv.querySelector('.last-page-btn').onclick = () => this._navigateToPage(() => this.paginationManager.goToLastPage());

            // ページ番号ボタン
            controlsDiv.querySelectorAll('.page-number-btn').forEach(btn => {
                btn.onclick = () => {
                    const pageNum = parseInt(btn.dataset.page);
                    this._navigateToPage(() => this.paginationManager.goToPage(pageNum));
                };
            });

            // ページジャンプ
            const jumpBtn = controlsDiv.querySelector('.page-jump-btn');
            const jumpInput = controlsDiv.querySelector('.page-jump-input');
            
            jumpBtn.onclick = () => {
                const pageNum = parseInt(jumpInput.value);
                this._navigateToPage(() => this.paginationManager.goToPage(pageNum));
            };

            jumpInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    jumpBtn.click();
                }
            };
        }

        /**
         * 🚀 ページ移動実行
         */
        _navigateToPage(navigationFunction) {
            if (navigationFunction()) {
                // ページ移動成功 -> データ表示更新
                this._displayCurrentPage();
                
                // UIを再作成して確実に表示を維持
                setTimeout(() => {
                    this.createPaginationUI();
                }, 50);
            }
        }

        /**
         * 📋 現在ページのデータを表示
         */
        _displayCurrentPage() {
            const pageData = this.paginationManager.getCurrentPageData();
            
            // TableDisplayManagerを使用してデータ表示（ページデータとして表示）
            const tableManager = new TableDisplayManager();
            tableManager.displayIntegratedData(pageData, null, true);
        }

        /**
         * 🔄 情報部分のみ更新
         */
        _updatePaginationInfo() {
            // 上部コンテナの情報更新
            if (this.topContainer) {
                const infoElement = this.topContainer.querySelector('.pagination-info');
                if (infoElement) {
                    infoElement.remove();
                    this._createPaginationInfo(this.topContainer);
                }
            }

            // 下部コンテナの情報更新
            if (this.bottomContainer) {
                const infoElement = this.bottomContainer.querySelector('.pagination-info');
                if (infoElement) {
                    infoElement.remove();
                    this._createPaginationInfo(this.bottomContainer);
                }
            }
        }

        /**
         * 🔄 コントロール部分のみ更新
         */
        _updatePaginationControls() {
            // 上部コンテナのコントロール更新
            if (this.topContainer) {
                const controlsElement = this.topContainer.querySelector('.pagination-controls');
                if (controlsElement) {
                    controlsElement.remove();
                    this._createPaginationControls(this.topContainer);
                }
            }

            // 下部コンテナのコントロール更新
            if (this.bottomContainer) {
                const controlsElement = this.bottomContainer.querySelector('.pagination-controls');
                if (controlsElement) {
                    controlsElement.remove();
                    this._createPaginationControls(this.bottomContainer);
                }
            }
        }

        /**
         * 🧹 ページネーションUIを削除
         */
        _removePaginationUI() {
            // 上部ページネーション削除
            const topExisting = document.querySelector('#top-pagination-container');
            if (topExisting) {
                topExisting.remove();
            }

            // 下部ページネーション削除
            const bottomExisting = document.querySelector('#bottom-pagination-container');
            if (bottomExisting) {
                bottomExisting.remove();
            }

            this.topContainer = null;
            this.bottomContainer = null;
        }
    }

    // =============================================================================
    // グローバル公開
    // =============================================================================

    window.LedgerV2.Pagination = { 
        PaginationManager,
        PaginationUIManager 
    };
    
    window.PaginationManager = PaginationManager;
    window.PaginationUIManager = PaginationUIManager;

})(); 