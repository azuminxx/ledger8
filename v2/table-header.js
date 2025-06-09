/*!
 * 📊 統合台帳システムv2 - テーブル初期化・ヘッダー管理機能
 * 🎯 システム初期化・テーブル作成・ヘッダーボタン専用モジュール
 * 
 * ✅ **責任範囲**
 * ✅ システム初期化・起動制御（AutoInitializer）
 * ✅ テーブル作成・DOM構築（createProfessionalTable）
 * ✅ ヘッダーボタン管理（検索・クリア）
 * ✅ フィルター条件管理・初期メッセージ表示
 * ✅ 依存関係チェック・システム準備待機
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ テーブル描画・データ表示（table-render.jsの責任）
 * ❌ ページネーション処理（table-pagination.jsの責任）
 * ❌ ユーザーインタラクション（table-interact.jsの責任）
 * ❌ API通信・データ統合（core.jsの責任）
 * 
 * 📦 **含まれるクラス**
 * - AutoInitializer: システム自動初期化管理
 * - HeaderButtonManager: ヘッダーボタン・検索機能管理
 * 
 * 🔗 **依存関係**
 * - LoadingManager (ローディング表示)
 * - window.LedgerV2.TableRender.TableDisplayManager (描画)
 * - window.LedgerV2.TableInteract.tableEventManager (イベント)
 * - window.searchManager (検索機能)
 * - window.dataManager (データ管理)
 * - window.fieldsConfig (フィールド設定)
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.TableHeader = {};



    // =============================================================================
    // テーブル作成（ヘッダー・検索行のみ）
    // =============================================================================

    class TableCreator {
        /**
         * テーブル作成（ヘッダー・検索行のみ、データ読み込みなし）
         */
        static async createTable() {
            console.log('🏗️ テーブル作成開始（ヘッダー・検索行のみ）');

            try {
                // システム準備完了まで待機
                await this._waitForSystemReady();

                // テーブル構造作成
                await this._createTableStructure();

                console.log('✅ テーブル作成完了（ヘッダー・検索行のみ）');
            } catch (error) {
                console.error('❌ テーブル作成エラー:', error);
                throw error;
            }
        }

        /**
         * システム準備完了まで待機（プライベートメソッド）
         */
        static async _waitForSystemReady() {
            // 必要なシステムコンポーネントの存在をチェック
            if (!window.LedgerV2?.Config?.APP_IDS) {
                throw new Error('LedgerV2 Config が見つかりません');
            }
            if (!window.fieldsConfig) {
                throw new Error('fieldsConfig が見つかりません');
            }
            if (!window.searchManager) {
                throw new Error('searchManager が見つかりません');
            }
            if (!window.dataManager) {
                throw new Error('dataManager が見つかりません');
            }
            
            console.log('✅ システム準備完了');
        }

        /**
         * テーブルDOM構造作成（プライベートメソッド）
         */
        static async _createTableStructure() {
            // 既存のフィルター行をクリア（テーブル全体は削除しない）
            const existingFilterRow = document.querySelector('#my-filter-row');
            if (existingFilterRow) {
                existingFilterRow.innerHTML = '';
            }

            // 既存テーブルを確認
            let table = document.querySelector('#my-table');
            if (!table) {
                // テーブルが存在しない場合のみ新規作成
                const container = document.querySelector('#header-space') ||
                                document.querySelector('.contents-body') ||
                                document.querySelector('.form-body') ||
                                document.querySelector('body');

                if (!container) {
                    throw new Error('テーブルコンテナが見つかりません');
                }

                // テーブル構造を完全作成
                table = document.createElement('table');
                table.id = 'my-table';
                table.classList.add('main-table');

                // ヘッダー作成（3行構造）
                const thead = document.createElement('thead');
                thead.id = 'my-thead';
                
                // カテゴリ行
                //const categoryRow = document.createElement('tr');
                //categoryRow.id = 'my-category-row';
                
                // ヘッダー行 
                //const headerRow = document.createElement('tr');
                //headerRow.id = 'my-thead-row';
                
                // フィルター行
                const filterRow = document.createElement('tr');
                filterRow.id = 'my-filter-row';
                filterRow.classList.add('filter-row');

                thead.appendChild(categoryRow);
                thead.appendChild(headerRow);
                thead.appendChild(filterRow);
                table.appendChild(thead);

                // ボディ作成
                const tbody = document.createElement('tbody');
                tbody.id = 'my-tbody';
                table.appendChild(tbody);

                container.appendChild(table);
            }

            // フィルター行を取得（確実に存在する）
            const filterRow = document.querySelector('#my-filter-row');

            // フィルター行にフィールドを追加
            window.fieldsConfig.forEach(field => {
                const th = document.createElement('th');
                const headerColorClass = field.sourceApp ? {
                    'SEAT': 'header-seat',
                    'PC': 'header-pc',
                    'EXT': 'header-ext',
                    'USER': 'header-user'
                }[field.sourceApp] || 'header-common' : 'header-common';

                th.classList.add('table-header', headerColorClass);
                const fieldWidth = field.width || '120px';
                th.style.width = fieldWidth;

                // filterType に基づいてUI要素を決定
                const filterElement = this._createFilterElement(field);
                th.innerHTML = filterElement;
                filterRow.appendChild(th);
            });

            // ボディに初期メッセージを表示
            const tbody = document.querySelector('#my-tbody');
            if (tbody) {
                tbody.innerHTML = '';
                const initialRow = document.createElement('tr');
                const initialCell = document.createElement('td');
                initialCell.colSpan = window.fieldsConfig.length;
                initialCell.classList.add('initial-message-cell');
                initialCell.innerHTML = `
                    <div class="message-title">📋 統合台帳システム v2</div>
                    <div class="message-subtitle">フィルター条件を入力して検索してください</div>
                    <div class="message-hint">💡 ヒント: 🔍検索ボタンをクリックして検索を実行</div>
                `;
                initialRow.appendChild(initialCell);
                tbody.appendChild(initialRow);
            }

            // ヘッダーボタン初期化
            HeaderButtonManager.initializeHeaderButtons();

            // テーブルイベント初期化（分割後のtable-events.jsから）
            if (window.LedgerV2?.TableInteract?.tableEventManager) {
                window.LedgerV2.TableInteract.tableEventManager.initializeTableEvents();
            } else {
                console.warn('⚠️ table-events.js未読み込み - イベント初期化スキップ');
            }

            // フィルタ入力にEnterキーイベントを追加
            this._initializeFilterKeyEvents();



            console.log('✅ テーブル構造作成完了');
        }

        /**
         * フィルタ入力フィールドにキーイベントを設定
         */
        static _initializeFilterKeyEvents() {
            // DOMが完全に構築された後に実行
            setTimeout(() => {
                const filterInputs = document.querySelectorAll('#my-filter-row input[type="text"]');
                console.log(`🎹 フィルタ入力にEnterキーイベントを設定: ${filterInputs.length}個`);
                
                filterInputs.forEach(input => {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); // デフォルトの動作を防ぐ
                            console.log('⌨️ Enterキー検索実行');
                            HeaderButtonManager.executeSearch();
                        }
                    });
                });
            }, 100); // テーブル構築完了を待つ
        }





        /**
         * フィールド設定に基づいてフィルター要素を作成
         */
        static _createFilterElement(field) {
            const headerLabel = `<div class="header-label">${field.label}</div>`;
            
            // filterType に基づいて適切なUI要素を選択
            const filterType = field.filterType || window.FILTER_TYPES.TEXT;

            switch (filterType) {
                case window.FILTER_TYPES.DROPDOWN:
                    return this._createSelectElement(field, headerLabel);
                
                case window.FILTER_TYPES.TEXT:
                default:
                    return this._createInputElement(field, headerLabel);
            }
        }

        /**
         * セレクトボックス要素を作成（DROPDOWN filterType用）
         */
        static _createSelectElement(field, headerLabel) {
            if (!field.options || !Array.isArray(field.options)) {
                console.warn(`⚠️ フィールド "${field.fieldCode}" にoptionsが設定されていません`);
                return this._createInputElement(field, headerLabel); // フォールバック
            }

            // optionsの形式を統一（文字列 or オブジェクト対応）
            const optionsHtml = field.options.map(option => {
                const value = typeof option === 'object' ? option.value : option;
                const label = typeof option === 'object' ? option.label : option;
                return `<option value="${value}">${label}</option>`;
            }).join('');

            return `
                ${headerLabel}
                <select class="filter-input" data-field="${field.fieldCode}" data-field-code="${field.fieldCode}">
                    <option value="">すべて</option>
                    ${optionsHtml}
                </select>
            `;
        }

        /**
         * インプット要素を作成（TEXT filterType用）
         */
        static _createInputElement(field, headerLabel) {
            return `
                ${headerLabel}
                <input type="text" class="filter-input" 
                       placeholder="${field.placeholder || ''}" 
                       data-field="${field.fieldCode}" 
                       data-field-code="${field.fieldCode}">
            `;
        }
    }

    // =============================================================================
    // ヘッダーボタン管理
    // =============================================================================

    class HeaderButtonManager {
        static initializeHeaderButtons() {
            // kintoneの適切なヘッダーメニュースペースを取得
            const headerSpace = kintone.app.getHeaderMenuSpaceElement();
            
            // 既存のボタンコンテナをクリア
            const existingContainer = headerSpace.querySelector('.ledger-search-buttons');
            if (existingContainer) {
                existingContainer.remove();
            }

            // ボタンコンテナを作成
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'ledger-search-buttons';
            buttonContainer.style.cssText = `
                display: inline-flex;
                gap: 8px;
                align-items: center;
                margin-left: 10px;
            `;

            this.createSearchButtons(buttonContainer);
            headerSpace.appendChild(buttonContainer);
        }

        /**
         * フォールバック：kintone APIが使えない場合の対処
         */
        static _fallbackHeaderButtonSetup() {
            console.log('🔄 フォールバックモード：テーブル外にボタン設置');
            
            // テーブルの上に独立したボタンエリアを作成
            const table = document.querySelector('#my-table');
            if (!table) return;

            const existingButtonArea = document.querySelector('#ledger-button-area');
            if (existingButtonArea) {
                existingButtonArea.remove();
            }

            const buttonArea = document.createElement('div');
            buttonArea.id = 'ledger-button-area';
            buttonArea.style.cssText = `
                margin-bottom: 10px;
                text-align: right;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 4px;
            `;

            this.createSearchButtons(buttonArea);
            table.parentNode.insertBefore(buttonArea, table);
        }

        static createSearchButtons(container) {
            // 🔍 検索ボタン
            const searchBtn = document.createElement('button');
            searchBtn.innerHTML = '🔍 検索';
            searchBtn.className = 'ledger-search-btn';
            searchBtn.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;
            searchBtn.addEventListener('click', () => this.executeSearch());
            searchBtn.addEventListener('mouseenter', () => {
                searchBtn.style.background = '#45a049';
            });
            searchBtn.addEventListener('mouseleave', () => {
                searchBtn.style.background = '#4CAF50';
            });

            // 📝 追加モードボタン
            const appendBtn = document.createElement('button');
            appendBtn.innerHTML = '📝 追加検索';
            appendBtn.className = 'ledger-append-btn';
            appendBtn.style.cssText = `
                background: #2196F3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;
            appendBtn.addEventListener('click', () => this.executeAppendSearch());
            appendBtn.addEventListener('mouseenter', () => {
                appendBtn.style.background = '#1976D2';
            });
            appendBtn.addEventListener('mouseleave', () => {
                appendBtn.style.background = '#2196F3';
            });

            // 🧹 クリアボタン
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = '🧹 クリア';
            clearBtn.className = 'ledger-clear-btn';
            clearBtn.style.cssText = `
                background: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;
            clearBtn.addEventListener('click', () => this.clearAllFilters());
            clearBtn.addEventListener('mouseenter', () => {
                clearBtn.style.background = '#da190b';
            });
            clearBtn.addEventListener('mouseleave', () => {
                clearBtn.style.background = '#f44336';
            });

            container.appendChild(searchBtn);
            container.appendChild(appendBtn);
            container.appendChild(clearBtn);
        }

        static async executeSearch() {
            try {
                console.log('🔍 手動検索実行');
                LoadingManager.show('検索中...');

                // 通常検索（追加モードを無効化）
                window.dataManager.setAppendMode(false);

                const result = await window.searchManager.executeSearch('manual', null);

                if (result && result.integratedRecords) {
                    // table-render.jsのTableDisplayManagerを使用
                    if (window.LedgerV2?.TableRender?.TableDisplayManager) {
                        const tableManager = new window.LedgerV2.TableRender.TableDisplayManager();
                        tableManager.displayIntegratedData(result.integratedRecords);
                    } else {
                        console.warn('⚠️ TableDisplayManager未読み込み - データ表示スキップ');
                    }
                }

                LoadingManager.hide();
                console.log('✅ 検索完了');
            } catch (error) {
                LoadingManager.hide();
                console.error('❌ 検索エラー:', error);
            }
        }

        static async executeAppendSearch() {
            try {
                console.log('📝 追加検索実行');
                LoadingManager.show('追加検索中...');

                // 追加モードを有効化
                window.dataManager.setAppendMode(true);

                const result = await window.searchManager.executeSearch('manual', null);

                if (result && result.integratedRecords) {
                    // table-render.jsのTableDisplayManagerを使用
                    if (window.LedgerV2?.TableRender?.TableDisplayManager) {
                        const tableManager = new window.LedgerV2.TableRender.TableDisplayManager();
                        tableManager.displayIntegratedData(result.integratedRecords);
                    } else {
                        console.warn('⚠️ TableDisplayManager未読み込み - データ表示スキップ');
                    }
                }

                LoadingManager.hide();
                console.log('✅ 追加検索完了');
            } catch (error) {
                LoadingManager.hide();
                console.error('❌ 追加検索エラー:', error);
            }
        }

        static clearAllFilters() {
            const filterInputs = document.querySelectorAll('#my-filter-row input, #my-filter-row select');
            filterInputs.forEach(input => {
                input.value = '';
            });

            // SearchManagerのclearFilters()も呼び出してエラーメッセージをクリア
            if (window.searchManager && window.searchManager.clearFilters) {
                window.searchManager.clearFilters();
            }

            // 追加モードを無効化し、行番号をリセット
            window.dataManager.setAppendMode(false);
            window.dataManager.resetRowCounter();

            // ページネーションをクリア
            if (window.paginationManager) {
                window.paginationManager.setAllData([]);
            }
            if (window.paginationUI) {
                window.paginationUI._removePaginationUI();
            }

            // テーブルをクリア
            dataManager.clearTable();
            console.log('🧹 フィルター条件とテーブルをクリア');
        }
    }

    // =============================================================================
    // グローバルエクスポート
    // =============================================================================

    // LedgerV2名前空間にエクスポート
    window.LedgerV2.TableHeader.TableCreator = TableCreator;
    window.LedgerV2.TableHeader.HeaderButtonManager = HeaderButtonManager;

    // レガシー互換性のためグローバルに割り当て
    window.TableCreator = TableCreator;
    window.HeaderButtonManager = HeaderButtonManager;

    console.log('🏗️ table-header.js 読み込み完了 [8KB]');

})(); 