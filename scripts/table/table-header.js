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
            // 統合台帳システムページのチェック
            if (!document.getElementById('my-table') || !document.getElementById('my-thead') || !document.getElementById('my-tbody')) {
                return;
            }

            try {
                // 必要なモジュールの読み込み待機
                await this._waitForModules();
                
                // グローバルインスタンス作成（レガシー互換性）
                this._initializeGlobalInstances();
                
                // システム準備完了まで待機
                await this._waitForSystemReady();

                // テーブル構造作成
                await this._createTableStructure();

            } catch (error) {
                console.error('❌ テーブル作成エラー:', error);
                throw error;
            }
        }

        /**
         * 必要なモジュールの読み込み待機
         */
        static async _waitForModules() {
            return new Promise((resolve) => {
                let attempts = 0;
                const maxAttempts = 50; // 5秒後にタイムアウト

                const checkModules = () => {
                    attempts++;
                    
                    // 各モジュールの読み込み状況をチェック
                    const hasTableRender = !!window.LedgerV2?.TableRender?.TableDisplayManager;
                    const hasTableInteract = !!window.LedgerV2?.TableInteract?.TableEventManager;
                    const hasTableHeader = !!window.LedgerV2?.TableHeader?.TableCreator;
                    const hasPagination = !!window.PaginationManager;

                    if (hasTableRender && hasTableInteract && hasTableHeader && hasPagination) {
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        console.warn('⚠️ 依存関係読み込みタイムアウト - 利用可能なモジュールで続行');
                        resolve();
                    } else {
                        setTimeout(checkModules, 100);
                    }
                };
                checkModules();
            });
        }

        /**
         * グローバルインスタンス作成（レガシー互換性）
         */
        static _initializeGlobalInstances() {
            // PaginationManagerとPaginationUIManagerのグローバルインスタンス作成
            if (window.PaginationManager && !window.paginationManager) {
                window.paginationManager = new window.PaginationManager();
            }
            if (window.PaginationUIManager && !window.paginationUI && window.paginationManager) {
                window.paginationUI = new window.PaginationUIManager(window.paginationManager);
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

        }

        /**
         * テーブルDOM構造作成（プライベートメソッド）
         */
        static async _createTableStructure() {
            // 統合台帳システムページのチェック

            // HTMLで既にテーブル構造が定義されているので、ヘッダー行を追加するだけ
            const thead = document.querySelector('#my-thead');
            
            // カテゴリー行とヘッダー行が存在しない場合は追加
            if (!document.querySelector('#my-category-row')) {
                const categoryRow = document.createElement('tr');
                categoryRow.id = 'my-category-row';
                categoryRow.classList.add('category-row');
                thead.insertBefore(categoryRow, thead.firstChild);
            }
            
            // if (!document.querySelector('#my-header-row')) {
            //     const headerRow = document.createElement('tr');
            //     headerRow.id = 'my-header-row';
            //     headerRow.classList.add('header-row');
            //     const filterRow = document.querySelector('#my-filter-row');
            //     thead.insertBefore(headerRow, filterRow);
            // }

            // ヘッダー行を作成
            this._createCategoryRow();
            // this._createHeaderRow();
            this._createFilterRow();

            // ヘッダーボタン初期化
            HeaderButtonManager.initializeHeaderButtons();

            // テーブルイベント初期化
            if (window.LedgerV2?.TableInteract?.tableEventManager) {
                window.LedgerV2.TableInteract.tableEventManager.initializeTableEvents();
            }

            // フィルタ入力にEnterキーイベントを追加
            this._initializeFilterKeyEvents();
        }

        /**
         * カテゴリー行を作成（1行目）
         */
        static _createCategoryRow() {
            const categoryRow = document.querySelector('#my-category-row');
            categoryRow.innerHTML = '';

            const categorySpans = this._calculateCategorySpans();
            categorySpans.forEach(categoryInfo => {
                const th = document.createElement('th');
                th.classList.add('table-header', 'category-header');
                th.setAttribute('colspan', categoryInfo.span);
                th.textContent = categoryInfo.category;
                th.style.textAlign = 'center'; // 中央揃え
                
                // カテゴリー内にisHiddenFromUser: trueのフィールドがすべて含まれる場合のみクラスを追加
                const allFieldsHidden = categoryInfo.fields.every(field => field.isHiddenFromUser);
                if (allFieldsHidden) {
                    th.classList.add('header-hidden-from-user');
                }
                
                const totalWidth = categoryInfo.fields.reduce((sum, field) => {
                    const width = parseInt(field.width) || 120;
                    return sum + width;
                }, 0);
                th.style.width = `${totalWidth}px`;
                
                categoryRow.appendChild(th);
            });
        }

        /**
         * ヘッダーラベル行を作成（2行目）
         */
        // static _createHeaderRow() {
        //     const headerRow = document.querySelector('#my-header-row');
        //     headerRow.innerHTML = '';

        //     window.fieldsConfig.forEach(field => {
        //         const th = document.createElement('th');
        //         th.classList.add('table-header', 'label-header');
                
        //         if (field.isHiddenFromUser) {
        //             th.classList.add('header-hidden-from-user');
        //         }
                
        //         th.style.width = field.width || '120px';
        //         th.innerHTML = `<div class="header-label">${field.label}</div>`;
        //         headerRow.appendChild(th);
        //     });
        // }

        /**
         * フィルター行を作成（3行目）
         */
        static _createFilterRow() {
            const filterRow = document.querySelector('#my-filter-row');
            filterRow.innerHTML = '';

            window.fieldsConfig.forEach(field => {
                const th = document.createElement('th');
                const headerColorClass = field.sourceApp ? {
                    'SEAT': 'header-seat',
                    'PC': 'header-pc',
                    'EXT': 'header-ext',
                    'USER': 'header-user'
                }[field.sourceApp] || 'header-common' : 'header-common';

                th.classList.add('table-header', headerColorClass);
                
                if (field.isHiddenFromUser) {
                    th.classList.add('header-hidden-from-user');
                }
                
                th.style.width = field.width || '120px';
                th.innerHTML = this._createFilterElement(field);
                filterRow.appendChild(th);
            });
        }

        /**
         * カテゴリーごとのセル結合情報を計算
         */
        static _calculateCategorySpans() {
            const categorySpans = [];
            let currentCategory = null;
            let currentSpan = 0;
            let currentFields = [];

            window.fieldsConfig.forEach((field, index) => {
                if (field.category !== currentCategory) {
                    // 前のカテゴリーがある場合は結果に追加
                    if (currentCategory !== null) {
                        categorySpans.push({
                            category: currentCategory,
                            span: currentSpan,
                            fields: [...currentFields]
                        });
                    }
                    
                    // 新しいカテゴリーを開始
                    currentCategory = field.category;
                    currentSpan = 1;
                    currentFields = [field];
                } else {
                    // 同じカテゴリーの場合はスパンを増加
                    currentSpan++;
                    currentFields.push(field);
                }
            });

            // 最後のカテゴリーを追加
            if (currentCategory !== null) {
                categorySpans.push({
                    category: currentCategory,
                    span: currentSpan,
                    fields: [...currentFields]
                });
            }

            return categorySpans;
        }

        /**
         * フィルタ入力フィールドにキーイベントを設定
         */
        static _initializeFilterKeyEvents() {
            // DOMが完全に構築された後に実行
            setTimeout(() => {
                const filterInputs = document.querySelectorAll('#my-filter-row input[type="text"]');
                
                filterInputs.forEach(input => {
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault(); // デフォルトの動作を防ぐ
                            HeaderButtonManager.executeFilterRowSearch(); // フィルタ行専用検索に変更
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
            const filterType = field.filterType || 'text';

            switch (filterType) {
                case 'dropdown':
                    return this._createSelectElement(field, headerLabel);
                
                case 'text':
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
                flex-wrap: wrap;
                transition: all 0.3s ease;
            `;

            // 🎨 レスポンシブ対応のCSS追加
            this._addResponsiveStyles();

            this.createSearchButtons(buttonContainer);
            headerSpace.appendChild(buttonContainer);
        }

        // 🎨 レスポンシブスタイルを追加
        static _addResponsiveStyles() {
            const styleId = 'ledger-responsive-buttons';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* デスクトップ表示 */
                @media (min-width: 1024px) {
                    .ledger-search-buttons .button-group {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                /* タブレット表示 */
                @media (max-width: 1023px) and (min-width: 768px) {
                    .ledger-search-buttons {
                        gap: 6px !important;
                    }
                    .ledger-search-buttons .button-group {
                        padding: 3px !important;
                        margin-right: 8px !important;
                    }
                    .ledger-search-buttons button {
                        padding: 5px 10px !important;
                        font-size: 12px !important;
                    }
                    .ledger-search-buttons button span:last-child {
                        display: none;
                    }
                }

                /* モバイル表示 */
                @media (max-width: 767px) {
                    .ledger-search-buttons {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 4px !important;
                        width: 100% !important;
                        margin-left: 0 !important;
                    }
                    .ledger-search-buttons .button-group {
                        justify-content: center !important;
                        margin-right: 0 !important;
                        margin-bottom: 4px !important;
                    }
                    .ledger-search-buttons button {
                        padding: 8px 12px !important;
                        font-size: 12px !important;
                        min-width: 80px !important;
                    }
                }

                /* フォーカス時のアクセシビリティ */
                .ledger-search-buttons button:focus {
                    outline: 2px solid #007bff;
                    outline-offset: 2px;
                }
            `;
            document.head.appendChild(style);
        }



        static createSearchButtons(container) {
            // 🎨 パステル系の柔らかく優しい色合い
            const BUTTON_STYLES = {
                base: `
                    border: 1px solid #ddd;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-right: 6px;
                `,
                // 検索系：柔らかいパステルブルー
                search: `background: #74b9ff; color: white; border-color: #74b9ff;`,
                searchHover: '#5a9cff',
                
                // 管理系：柔らかいパステルパープル
                manage: `background: #a29bfe; color: white; border-color: #a29bfe;`,
                manageHover: '#8b7efe',
                
                // モード系：柔らかいパステルピンク
                mode: `background: #fd79a8; color: white; border-color: #fd79a8;`,
                modeHover: '#fc5c8a'
            };

            // 🔍 検索グループ
            const searchGroup = document.createElement('div');
            searchGroup.className = 'button-group search-group';
            searchGroup.style.cssText = `
                display: inline-flex;
                gap: 4px;
                margin-right: 12px;
                padding: 4px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
            `;

            // 🔍 検索ボタン
            const searchBtn = document.createElement('button');
            searchBtn.innerHTML = '<span>🔍</span><span>検索</span>';
            searchBtn.className = 'ledger-search-btn';
            searchBtn.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.search;
            searchBtn.addEventListener('click', () => this.executeSearch());
            this._addSimpleHoverEffect(searchBtn, BUTTON_STYLES.searchHover);

            // 📝 追加検索ボタン
            const appendBtn = document.createElement('button');
            appendBtn.innerHTML = '<span>➕</span><span>追加</span>';
            appendBtn.className = 'ledger-append-btn';
            appendBtn.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.search;
            appendBtn.addEventListener('click', () => this.executeAppendSearch());
            this._addSimpleHoverEffect(appendBtn, BUTTON_STYLES.searchHover);

            // 🧹 クリアボタン
            const clearBtn = document.createElement('button');
            clearBtn.innerHTML = '<span>🗑️</span><span>クリア</span>';
            clearBtn.className = 'ledger-clear-btn';
            clearBtn.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.search;
            clearBtn.addEventListener('click', () => this.clearAllFilters());
            this._addSimpleHoverEffect(clearBtn, BUTTON_STYLES.searchHover);

            searchGroup.appendChild(searchBtn);
            searchGroup.appendChild(appendBtn);
            searchGroup.appendChild(clearBtn);

            // 📊 管理グループ
            const manageGroup = document.createElement('div');
            manageGroup.className = 'button-group manage-group';
            manageGroup.style.cssText = `
                display: inline-flex;
                gap: 4px;
                margin-right: 12px;
                padding: 4px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
            `;

            // 🆕 新規行追加ボタン
            const addRecordBtn = document.createElement('button');
            addRecordBtn.innerHTML = '<span>➕</span><span>新規</span>';
            addRecordBtn.className = 'ledger-add-record-btn';
            addRecordBtn.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.manage;
            addRecordBtn.addEventListener('click', () => this.openAddRecordDialog());
            this._addSimpleHoverEffect(addRecordBtn, BUTTON_STYLES.manageHover);

            // 💾 データ更新ボタン
            const updateBtn = document.createElement('button');
            updateBtn.innerHTML = '<span>💾</span><span>更新</span>';
            updateBtn.className = 'ledger-update-btn';
            updateBtn.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.manage;
            updateBtn.addEventListener('click', () => this.executeDataUpdate());
            this._addSimpleHoverEffect(updateBtn, BUTTON_STYLES.manageHover);

            manageGroup.appendChild(addRecordBtn);
            manageGroup.appendChild(updateBtn);

            // 🎯 モードグループ
            const modeGroup = document.createElement('div');
            modeGroup.className = 'button-group mode-group';
            modeGroup.style.cssText = `
                display: inline-flex;
                gap: 4px;
                padding: 4px;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
            `;

            // 🎯 編集モード切り替えボタン
            const editModeBtn = document.createElement('button');
            editModeBtn.innerHTML = '<span>🔒</span><span>編集モード</span>';
            editModeBtn.id = 'edit-mode-toggle-btn';
            editModeBtn.className = 'ledger-edit-mode-btn';
            editModeBtn.style.cssText = BUTTON_STYLES.base + BUTTON_STYLES.mode;
            
            // 編集モード切り替え機能
            editModeBtn.addEventListener('click', () => this.toggleEditMode(editModeBtn));
            
            // 初期状態は閲覧モード
            this.updateEditModeButton(editModeBtn, false);

            modeGroup.appendChild(editModeBtn);

            // グループをコンテナに追加
            container.appendChild(searchGroup);
            container.appendChild(manageGroup);
            container.appendChild(modeGroup);
        }

        // 🎨 シンプルなホバーエフェクト
        static _addSimpleHoverEffect(button, hoverColor) {
            const originalBg = button.style.background;
            button.addEventListener('mouseenter', () => {
                button.style.background = hoverColor;
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = originalBg;
            });
        }

        // 🆕 編集モード切り替え処理
        static toggleEditMode(button) {
            if (!window.editModeManager) {
                console.error('❌ editModeManagerが初期化されていません');
                return;
            }

            const isCurrentlyEditMode = window.editModeManager.isEditMode;
            
            if (isCurrentlyEditMode) {
                // 編集モード → 閲覧モード
                window.editModeManager.disableEditMode();
                document.body.classList.remove('edit-mode-active');
                document.body.classList.add('view-mode-active');
                this.updateEditModeButton(button, false);
            } else {
                // 閲覧モード → 編集モード
                window.editModeManager.enableEditMode();
                document.body.classList.remove('view-mode-active');
                document.body.classList.add('edit-mode-active');
                this.updateEditModeButton(button, true);
            }
            
            // 切り替え成功のアニメーション
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }

        // 🆕 編集モードボタンの表示更新
        static updateEditModeButton(button, isEditMode) {
            if (isEditMode) {
                button.innerHTML = '<span>👁️</span><span>閲覧モード</span>';
                button.style.background = '#ff7675'; // パステル系の明るいピンク
                button.style.color = 'white';
                button.style.borderColor = '#ff7675';
            } else {
                button.innerHTML = '<span>🔒</span><span>編集モード</span>';
                button.style.background = '#fd79a8'; // パステル系の基本ピンク
                button.style.color = 'white';
                button.style.borderColor = '#fd79a8';
            }
        }

        // 🆕 新規レコード追加ダイアログを開く
        static openAddRecordDialog() {
            try {
                // 必要なリソースがロードされているかチェック
                if (!window.LedgerV2 || !window.LedgerV2.Modal || !window.LedgerV2.Modal.AddRecordModal) {
                    console.error('❌ AddRecordModalが見つかりません。modal-add-record.jsが読み込まれているか確認してください。');
                    alert('新規レコード追加機能が利用できません。ページを再読み込みしてください。');
                    return;
                }

                // 新規レコード追加モーダルを表示
                const addRecordModal = new window.LedgerV2.Modal.AddRecordModal();
                addRecordModal.show();

            } catch (error) {
                console.error('❌ 新規レコード追加ダイアログ表示エラー:', error);
                alert('新規レコード追加ダイアログの表示中にエラーが発生しました。');
            }
        }

        static async executeSearch() {
            try {
                
                // 🚫 無条件検索チェック
                if (!this._validateSearchConditions()) {
                    this._showNoConditionError();
                    return;
                }

                // 📊 統計情報をクリア
                this._clearInconsistencyStatistics();

                // フィルタ行での検索実行フラグを設定
                window.isFilterRowSearchActive = true;

                // オートフィルタをクリア（競合を防ぐため）
                if (window.autoFilterManager && window.autoFilterManager.clearFiltersOnRowSearch) {
                    window.autoFilterManager.clearFiltersOnRowSearch();
                }

                LoadingManager.show('検索中...');

                // 通常検索（追加モードを無効化）
                window.dataManager.setAppendMode(false);

                const result = await window.searchManager.executeSearch('manual', null);

                if (result && result.integratedRecords) {
                    // table-render.jsのTableDisplayManagerを使用
                    const tableManager = new window.LedgerV2.TableRender.TableDisplayManager();
                    tableManager.displayIntegratedData(result.integratedRecords);
                }

                LoadingManager.hide();
                
                // フィルタ行での検索実行フラグをクリア
                window.isFilterRowSearchActive = false;
                
                // オートフィルタを再初期化
                setTimeout(() => {
                    if (window.autoFilterManager) {
                        window.autoFilterManager.initialize();
                    }
                }, 200);
            } catch (error) {
                LoadingManager.hide();
                // フィルタ行での検索実行フラグをクリア
                window.isFilterRowSearchActive = false;
                console.error('❌ 検索エラー:', error);
            }
        }

        static async executeAppendSearch() {
            try {
                
                // 🚫 無条件検索チェック
                if (!this._validateSearchConditions()) {
                    this._showNoConditionError();
                    return;
                }

                // フィルタ行での検索実行フラグを設定
                window.isFilterRowSearchActive = true;

                // オートフィルタをクリア（競合を防ぐため）
                if (window.autoFilterManager && window.autoFilterManager.clearFiltersOnRowSearch) {
                    window.autoFilterManager.clearFiltersOnRowSearch();
                }

                LoadingManager.show('追加検索中...');

                // 追加モードを有効化
                window.dataManager.setAppendMode(true);

                const result = await window.searchManager.executeSearch('manual', null);

                if (result && result.integratedRecords) {
                    // table-render.jsのTableDisplayManagerを使用
                    const tableManager = new window.LedgerV2.TableRender.TableDisplayManager();
                    tableManager.displayIntegratedData(result.integratedRecords);
                }

                LoadingManager.hide();
                
                // フィルタ行での検索実行フラグをクリア
                window.isFilterRowSearchActive = false;
                
                // オートフィルタを再初期化
                setTimeout(() => {
                    if (window.autoFilterManager) {
                        window.autoFilterManager.initialize();
                    }
                }, 200);
            } catch (error) {
                LoadingManager.hide();
                // フィルタ行での検索実行フラグをクリア
                window.isFilterRowSearchActive = false;
                console.error('❌ 追加検索エラー:', error);
            }
        }

        /**
         * フィルタ行でのEnter検索（既存データを保持したまま追加検索）
         */
        static async executeFilterRowSearch() {
            try {
                
                // 🚫 無条件検索チェック
                if (!this._validateSearchConditions()) {
                    this._showNoConditionError();
                    return;
                }

                // 既存のテーブルデータがあるかチェック
                const tbody = document.querySelector('#my-tbody');
                const hasExistingData = tbody && tbody.querySelectorAll('tr[data-integration-key]').length > 0;

                LoadingManager.show(hasExistingData ? '追加検索中...' : '検索中...');

                if (hasExistingData) {
                    // 既存データがある場合は追加モードを有効化
                    window.dataManager.setAppendMode(true);
                } else {
                    // 既存データがない場合は新規検索
                    window.dataManager.setAppendMode(false);
                }

                const result = await window.searchManager.executeSearch('manual', null);

                if (result && result.integratedRecords) {
                    // table-render.jsのTableDisplayManagerを使用
                    const tableManager = new window.LedgerV2.TableRender.TableDisplayManager();
                    tableManager.displayIntegratedData(result.integratedRecords);
                }

                LoadingManager.hide();
                
            } catch (error) {
                LoadingManager.hide();
                console.error('❌ フィルタ行検索エラー:', error);
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

            // 📊 統計情報をクリア
            this._clearInconsistencyStatistics();

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
        }

        // 💾 データ更新実行（モーダル対応版）
        static async executeDataUpdate() {
            try {
                
                // CSSとJSファイルをロード（まだロードされていない場合）
                await this._loadModalResources();
                
                // チェックされた行を取得
                const checkedRows = this._getCheckedRows();
                
                if (checkedRows.length === 0) {
                    const noDataModal = new window.LedgerV2.Modal.ResultModal();
                    await noDataModal.show({
                        SYSTEM: { success: false, recordCount: 0, error: '更新対象の行が選択されていません。チェックボックスにチェックを入れてください。' }
                    }, 0);
                    return;
                }
                
                // 各行のデータを4つの台帳に分解
                const ledgerDataSets = this._decomposeTo4Ledgers(checkedRows);
                
                // デバッグ用：更新対象台帳をログ出力

                Object.entries(ledgerDataSets).forEach(([ledgerType, records]) => {
                    if (records.length > 0) {

                                          } else {
                          console.log(`⏭️ ${ledgerType}台帳: 更新対象なし（スキップ）`);
                     }
                  });
                
                // kintone用のupsertボディを作成
                const updateBodies = this._createUpdateBodies(ledgerDataSets);
                
                // 確認モーダルを表示
                const confirmModal = new window.LedgerV2.Modal.UpdateConfirmModal();
                const confirmed = await confirmModal.show(checkedRows, ledgerDataSets, updateBodies);
                
                if (!confirmed) {
                    return;
                }
                
                // 進捗モーダルを表示
                const progressModal = new window.LedgerV2.Modal.ProgressModal();
                const totalSteps = Object.keys(updateBodies).length;
                progressModal.show(totalSteps);
                
                // 実際のAPI呼び出し
                const updateResults = {};
                let currentStep = 0;
                
                console.log(`🚀 API呼び出し開始: ${Object.keys(updateBodies).length}台帳中、実際に更新するのは${Object.values(updateBodies).filter(body => body.records.length > 0).length}台帳`);
                
                // 全台帳の履歴データを格納する配列
                const allHistoryRecords = [];
                
                for (const [ledgerType, body] of Object.entries(updateBodies)) {
                    if (body.records.length > 0) {
                        try {
                            currentStep++;
                            const ledgerName = this._getLedgerName(ledgerType);
                            progressModal.updateProgress(currentStep, totalSteps, `${ledgerName}を更新中... (${body.records.length}件)`);
                            
                            const response = await kintone.api('/k/v1/records', 'PUT', body);
                            
                            updateResults[ledgerType] = {
                                success: true,
                                recordCount: body.records.length,
                                response: response
                            };

                            // 🆕 更新履歴データを作成（まだ保存しない）
                            const historyRecords = await this._createHistoryRecordsData(ledgerType, response.records, ledgerDataSets[ledgerType]);
                            allHistoryRecords.push(...historyRecords);
                            
                        } catch (error) {
                            updateResults[ledgerType] = {
                                success: false,
                                recordCount: body.records.length,
                                error: error.message || error
                            };
                            
                            console.error(`❌ ${ledgerType}台帳更新エラー:`, error);
                        }
                    }
                }
                
                // 🆕 全台帳分の履歴データを一括保存
                await this._saveAllHistoryRecords(allHistoryRecords);
                
                // 進捗モーダルを閉じる
                progressModal.close();
                
                // 結果モーダルを表示
                const resultModal = new window.LedgerV2.Modal.ResultModal();
                await resultModal.show(updateResults, checkedRows.length);
                
                // 更新が全て成功した場合、チェックボックスをすべてOFFにする
                const allSuccess = Object.values(updateResults).every(result => result.success);
                if (allSuccess) {
                    this._uncheckAllModificationCheckboxes();
                }
                
            } catch (error) {
                console.error('❌ データ更新エラー:', error);
                
                // エラーモーダルを表示
                const errorModal = new window.LedgerV2.Modal.ResultModal();
                await errorModal.show({
                    SYSTEM: { success: false, recordCount: 0, error: error.message || 'システムエラーが発生しました' }
                }, 0);
            }
        }
        
        // チェックされた行を取得
        static _getCheckedRows() {
            const tbody = document.querySelector('#my-tbody');
            if (!tbody) return [];
            
            const rows = Array.from(tbody.querySelectorAll('tr[data-integration-key]'));
            const checkedRows = rows.filter(row => {
                const checkbox = row.querySelector('td[data-field-code="_modification_checkbox"] input[type="checkbox"]');
                return checkbox && checkbox.checked;
            });

            return checkedRows;
        }
        
        // 各行のデータを4つの台帳に分解
        static _decomposeTo4Ledgers(rows) {
            const ledgerDataSets = {
                SEAT: [],
                PC: [],
                EXT: [],
                USER: []
            };
            
            rows.forEach((row, index) => {
                
                const integrationKey = row.getAttribute('data-integration-key');
                const cells = row.querySelectorAll('td[data-field-code]');
                
                // 行のデータを収集
                const rowData = {
                    integrationKey,
                    fields: {}
                };
                
                cells.forEach(cell => {
                    const fieldCode = cell.getAttribute('data-field-code');
                    if (!fieldCode || fieldCode.startsWith('_')) return; // システムフィールドはスキップ
                    
                    const value = this._extractCellValue(cell);
                    rowData.fields[fieldCode] = value;
                });
                
                // 4つの台帳にデータを振り分け
                Object.keys(ledgerDataSets).forEach(ledgerType => {
                    const ledgerData = this._extractLedgerData(rowData, ledgerType);
                    if (ledgerData) {
                        ledgerDataSets[ledgerType].push(ledgerData);
                    }
                });
            });
            
            return ledgerDataSets;
        }
        
        // セルから値を抽出
        static _extractCellValue(cell) {
            // 入力要素がある場合
            const input = cell.querySelector('input, select, textarea');
            if (input) {
                return input.value || '';
            }
            
            // 主キー値スパンがある場合
            const primaryKeyValue = cell.querySelector('.primary-key-value');
            if (primaryKeyValue) {
                return primaryKeyValue.textContent.trim() || '';
            }
            
            // 通常のテキストセル（分離ボタン絵文字を除外）
            const textContent = cell.textContent || '';
            return textContent.replace(/✂️/g, '').trim();
        }
        
        // 特定の台帳用のデータを抽出（updateKeyベース）
        static _extractLedgerData(rowData, ledgerType) {
            const recordIdField = `${ledgerType.toLowerCase()}_record_id`;
            const recordIdValue = rowData.fields[recordIdField];
            
            // レコードIDがない場合はスキップ
            if (!recordIdValue) {
                return null;
            }
            
            const ledgerRecord = {
                id: parseInt(recordIdValue),
                integrationKey: rowData.integrationKey,
                fields: {}
            };
            
            let hasChanges = false;
            
            // 全ての主キーフィールドを必ず含める（他台帳との連携のため）
            const primaryKeys = window.LedgerV2.Utils.FieldValueProcessor.getAllPrimaryKeyFields();
            primaryKeys.forEach(primaryKey => {
                const fieldValue = rowData.fields[primaryKey];
                if (fieldValue !== undefined) {
                    ledgerRecord.fields[primaryKey] = fieldValue || '';
                    
                    // 主キーが変更されている場合は変更フラグを立てる
                    if (this._isFieldModified(rowData.integrationKey, primaryKey)) {
                        hasChanges = true;
                    }
                }
            });
            
            // その台帳固有のフィールドの変更をチェック
            const ledgerSpecificFields = window.fieldsConfig.filter(field => 
                field.sourceApp === ledgerType && 
                !field.isPrimaryKey && 
                !field.isRecordId &&
                !field.fieldCode.endsWith('_record_id')
            );
            
            ledgerSpecificFields.forEach(field => {
                const fieldValue = rowData.fields[field.fieldCode];
                if (fieldValue !== undefined) {
                    // 台帳固有フィールドが変更されている場合のみ追加
                    if (this._isFieldModified(rowData.integrationKey, field.fieldCode)) {
                        ledgerRecord.fields[field.fieldCode] = fieldValue || '';
                        hasChanges = true;
                    }
                }
            });
            
            // 変更があった場合のみ返す
            if (hasChanges && Object.keys(ledgerRecord.fields).length > 0) {
                return ledgerRecord;
            }
            
            return null;
        }
        
        // フィールドが変更されているかどうかを判定
        static _isFieldModified(integrationKey, fieldCode) {
            // 対象行を取得
            const row = document.querySelector(`tr[data-integration-key="${integrationKey}"]`);
            if (!row) return false;
            
            // 対象セルを取得
            const cell = row.querySelector(`td[data-field-code="${fieldCode}"]`);
            if (!cell) return false;
            
            // セルが変更されているかチェック（cell-modifiedクラスの有無で判定）
            return cell.classList.contains('cell-modified');
        }
        
        // kintone用のupsertボディを作成（updateKeyベース）
        static _createUpdateBodies(ledgerDataSets) {
            const updateBodies = {};
            
            Object.entries(ledgerDataSets).forEach(([ledgerType, records]) => {
                if (records.length === 0) return;
                
                const appId = window.LedgerV2.Config.APP_IDS[ledgerType];
                if (!appId) {
                    console.warn(`⚠️ ${ledgerType}台帳のappIdが見つかりません`);
                    return;
                }
                
                updateBodies[ledgerType] = {
                    app: appId,
                    upsert: true,
                    records: records.map(record => this._createUpdateKeyRecord(ledgerType, record))
                };

            });
            
            return updateBodies;
        }
        
        // updateKeyベースのレコードを作成
        static _createUpdateKeyRecord(ledgerType, record) {
            // 各台帳の主キーフィールドを取得
            const primaryKeyMapping = {
                'PC': 'PC番号',
                'USER': 'ユーザーID',
                'SEAT': '座席番号',
                'EXT': '内線番号'
            };
            
            const primaryKeyField = primaryKeyMapping[ledgerType];
            const newPrimaryKeyValue = record.fields[primaryKeyField];
            
            // updateKeyで指定するフィールド以外をrecordに含める
            const recordFields = {};
            
            Object.entries(record.fields).forEach(([fieldCode, value]) => {
                // updateKeyで指定するフィールドは除外
                if (fieldCode !== primaryKeyField) {
                    recordFields[fieldCode] = { value: value };
                }
            });
            
            const updateKeyRecord = {
                updateKey: {
                    field: primaryKeyField,
                    value: newPrimaryKeyValue
                },
                record: recordFields
            };
            
            // 🔍 デバッグ: updateKeyベースの更新データをログ出力
            console.log(`🔍 updateKey更新データ (${ledgerType}台帳):`, {
                integrationKey: record.integrationKey,
                updateKeyField: primaryKeyField,
                updateKeyValue: newPrimaryKeyValue,
                recordFields: Object.keys(recordFields),
                fullUpdateRecord: updateKeyRecord
            });
            
            return updateKeyRecord;
        }

        // フィールドデータをkintone形式に変換
        static _convertToKintoneFormat(fields) {
            const kintoneRecord = {};
            
            Object.entries(fields).forEach(([fieldCode, value]) => {
                kintoneRecord[fieldCode] = {
                    value: value
                };
            });
            
            return kintoneRecord;
        }
        
        // 更新成功後にすべてのチェックボックスをOFFにする
        static _uncheckAllModificationCheckboxes() {
            const tbody = document.querySelector('#my-tbody');
            if (!tbody) return;
            
            const checkboxes = tbody.querySelectorAll('td[data-field-code="_modification_checkbox"] input[type="checkbox"]');
            let uncheckedCount = 0;
            
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    uncheckedCount++;
                    
                    // 対応する行からrow-modifiedクラスも削除
                    const row = checkbox.closest('tr');
                    if (row) {
                        row.classList.remove('row-modified');
                    }
                }
            });

        }

        // モーダル用リソースをロード
        static async _loadModalResources() {
            // マニフェストで読み込み済みの場合は何もしない
            if (window.LedgerV2 && window.LedgerV2.Modal) {
                return;
            }

            // JSファイルを動的読み込み（開発時のフォールバック）
            if (!window.LedgerV2 || !window.LedgerV2.Modal) {
                const script = document.createElement('script');
                script.src = './v2/modal-manager.js';
                document.head.appendChild(script);
                
                await new Promise((resolve) => {
                    script.onload = resolve;
                    script.onerror = () => {
                        console.error('❌ modal-manager.js の動的読み込みに失敗しました');
                        resolve();
                    };
                });
            }
        }

        // 台帳名を取得（モーダル用）
        static _getLedgerName(ledgerType) {
            return window.LedgerV2.Utils.FieldValueProcessor.getLedgerNameByApp(ledgerType);
        }

        // 📊 統計情報をクリア
        static _clearInconsistencyStatistics() {
            const existingStats = document.getElementById('inconsistency-statistics');
            if (existingStats) {
                existingStats.remove();
            }
        }

        // 🚫 検索条件バリデーション
        static _validateSearchConditions() {
            const filterInputs = document.querySelectorAll('#my-filter-row input, #my-filter-row select');
            let hasConditions = false;

            filterInputs.forEach(input => {
                const fieldCode = input.getAttribute('data-field');
                const value = input.value.trim();

                // $ledger_type以外で値が入力されているかチェック
                if (fieldCode && value && fieldCode !== '$ledger_type') {
                    hasConditions = true;
                }
            });

            return hasConditions;
        }

        // 🚫 無条件検索エラー表示
        static _showNoConditionError() {
            // 既存のエラーメッセージを削除
            const existingError = document.querySelector('.no-condition-error');
            if (existingError) {
                existingError.remove();
            }

            // エラーメッセージを作成
            const errorDiv = document.createElement('div');
            errorDiv.className = 'no-condition-error';
            errorDiv.style.cssText = `
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                color: #856404;
                padding: 12px 16px;
                margin: 10px 0;
                font-size: 14px;
                font-weight: 500;
                display: flex;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                position: relative;
            `;
            errorDiv.innerHTML = `
                <span style="margin-right: 8px;">⚠️</span>
                <span>検索条件を1つ以上入力してください。無条件での検索は実行できません。</span>
            `;

            // テーブルの上に挿入
            const tableContainer = document.querySelector('#table-container') || document.querySelector('#my-table');
            if (tableContainer && tableContainer.parentNode) {
                tableContainer.parentNode.insertBefore(errorDiv, tableContainer);
            } else {
                // フォールバック：bodyに追加
                document.body.appendChild(errorDiv);
            }

            // 5秒後に自動で削除
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        }

                 // 🆕 更新履歴データを作成（保存はしない）
         static async _createHistoryRecordsData(ledgerType, records, ledgerData) {
             try {
                 const historyRecords = [];

                 // 各更新レコードに対して履歴データを作成
                 for (let i = 0; i < ledgerData.length; i++) {
                     const originalData = ledgerData[i];
                     
                     // updateKeyベースの場合、レスポンスのrecord.idは使用できないため、
                     // 元のレコードIDを使用
                     const recordId = originalData.id;

                     // 変更内容を作成（台帳の視点から）
                     const changes = this._createChangeDetails(originalData.fields, originalData.integrationKey, ledgerType);
                     const recordKey = this._getRecordKey(ledgerType, originalData.fields);

                     // 🔍 デバッグ: 各データの詳細をログ出力
                     console.log(`🔍 履歴データ作成詳細 (${ledgerType}台帳):`, {
                         recordId: recordId,
                         ledgerType: ledgerType,
                         recordKey: recordKey,
                         changes: changes,
                         originalFields: originalData.fields,
                         integrationKey: originalData.integrationKey
                     });

                     // 履歴レコードを作成（設定ファイルからフィールド名を取得）
                     const historyConfig = window.LedgerV2.Config.HISTORY_FIELDS_CONFIG;
                     const ledgerTypeName = this._getLedgerTypeDisplayName(ledgerType);
                     const historyRecord = {
                         [historyConfig.ledger_type.fieldCode]: { value: ledgerTypeName },
                         [historyConfig.record_id.fieldCode]: { value: recordId.toString() },
                         [historyConfig.record_key.fieldCode]: { value: recordKey },
                         [historyConfig.changes.fieldCode]: { value: changes },
                         [historyConfig.requires_approval.fieldCode]: { value: '申請不要' },
                         [historyConfig.application_status.fieldCode]: { value: '申請不要' }
                     };

                     historyRecords.push(historyRecord);
                 }

                 return historyRecords;

             } catch (error) {
                 console.error(`❌ 更新履歴データ作成エラー (${ledgerType}台帳):`, error);
                 return [];
             }
         }

         // 🆕 全台帳分の履歴データを一括保存
         static async _saveAllHistoryRecords(allHistoryRecords) {
             try {
                 if (allHistoryRecords.length === 0) {
                     console.log('📝 更新履歴データがありません');
                     return;
                 }

                 const historyAppId = window.LedgerV2.Config.APP_IDS.HISTORY;
                 if (!historyAppId) {
                     console.warn('⚠️ 更新履歴台帳のアプリIDが設定されていません');
                     return;
                 }

                 const historyBody = {
                     app: historyAppId,
                     records: allHistoryRecords
                 };

                 // 🔍 デバッグ: 投入データの詳細をログ出力
                 console.log(`🔍 更新履歴一括投入データ詳細 (全台帳):`, JSON.stringify(historyBody, null, 2));

                 await kintone.api('/k/v1/records', 'POST', historyBody);
                 console.log(`✅ 更新履歴一括登録完了: 全台帳 ${allHistoryRecords.length}件`);

             } catch (error) {
                 console.error(`❌ 更新履歴一括登録エラー:`, error);
                 // 履歴登録エラーは台帳更新の成功に影響させない
             }
         }

         // 🆕 変更内容の詳細を作成（各台帳の視点から）
         static _createChangeDetails(fields, integrationKey, ledgerType) {
             const changes = [];
             
             // 🔍 デバッグ: 入力データをログ出力
             console.log(`🔍 変更内容作成開始 (${ledgerType}台帳の視点):`, { fields, integrationKey });
             
             // 各台帳の視点から見た関連フィールドを取得
             const relevantFields = this._getRelevantFieldsForLedger(ledgerType, integrationKey);
             
             // 関連フィールドの変更をチェック
             relevantFields.forEach(fieldCode => {
                 // フィールドの表示名を取得
                 const fieldConfig = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
                 const fieldLabel = fieldConfig ? fieldConfig.label.replace(/[🎯💻👤🆔☎️📱🪑📍🔢🏢]/g, '').trim() : fieldCode;
                 
                 // 新しい値を取得（更新対象フィールドから、または現在の値から）
                 const newValue = fields[fieldCode] || this._getCurrentFieldValue(fieldCode, integrationKey);
                 
                 // 変更前の値を取得（台帳の視点から）
                 const originalValue = this._getOriginalValue(fieldCode, integrationKey, ledgerType);
                 let oldValue = originalValue || '（未設定）';
                 
                 // 分離処理の特別な表示処理
                 const isSeparation = this._isSeparationProcess(fieldCode, originalValue, newValue);
                 if (isSeparation) {
                     oldValue = originalValue || '（関連付けあり）';
                 }
                 
                 // 変更があったかどうかをチェック
                 const hasChanged = this._hasFieldChanged(originalValue, newValue);
                 
                 // 🔍 デバッグ: 各フィールドの詳細をログ出力
                 console.log(`🔍 フィールド変更詳細 (${ledgerType}台帳):`, {
                     fieldCode,
                     fieldLabel,
                     oldValue,
                     newValue,
                     hasChanged,
                     isSeparation,
                     fieldConfig: fieldConfig ? 'found' : 'not found'
                 });
                 
                 // 変更があった場合のみ履歴に追加
                 if (hasChanged) {
                     changes.push(`${fieldLabel}: ${oldValue} → ${newValue || '（空）'}`);
                 }
             });

             const result = changes.join('\n');
             console.log(`🔍 変更内容作成結果 (${ledgerType}台帳):`, result);
             return result;
         }

         // 🆕 各台帳の視点から見た関連フィールドを取得
         static _getRelevantFieldsForLedger(ledgerType, integrationKey) {
             // 基本的な主キーフィールド
             const baseFields = ['PC番号', 'ユーザーID', '内線番号', '座席番号'];
             
             // 各台帳固有の追加フィールド
             const specificFields = {
                 'PC': ['PC用途', 'PC種別'],
                 'USER': ['ユーザー名', '部署', '役職'],
                 'SEAT': ['座席種別'],
                 'EXT': ['内線種別']
             };
             
             // 基本フィールドと台帳固有フィールドを結合
             const relevantFields = [...baseFields];
             if (specificFields[ledgerType]) {
                 relevantFields.push(...specificFields[ledgerType]);
             }
             
             console.log(`🔍 ${ledgerType}台帳の関連フィールド:`, relevantFields);
             return relevantFields;
         }

         // 🆕 現在のフィールド値を取得
         static _getCurrentFieldValue(fieldCode, integrationKey) {
             try {
                 const row = document.querySelector(`tr[data-integration-key="${integrationKey}"]`);
                 if (!row) return '';
                 
                 const cell = row.querySelector(`td[data-field-code="${fieldCode}"]`);
                 if (!cell) return '';
                 
                 return this._extractCellValue(cell) || '';
             } catch (error) {
                 console.warn(`現在のフィールド値取得エラー (${fieldCode}):`, error);
                 return '';
             }
         }

         // 🆕 フィールドに変更があったかどうかを判定
         static _hasFieldChanged(originalValue, newValue) {
             // 両方とも空または未設定の場合は変更なし
             if ((!originalValue || originalValue === '') && (!newValue || newValue === '')) {
                 return false;
             }
             
             // 値が同じ場合は変更なし
             if (originalValue === newValue) {
                 return false;
             }
             
             // それ以外は変更あり
             return true;
         }

         // 🆕 分離処理かどうかを判定
         static _isSeparationProcess(fieldCode, originalValue, newValue) {
             // ユーザーIDの分離：元の値があって新しい値が空の場合
             if (fieldCode === 'ユーザーID' && originalValue && (!newValue || newValue === '')) {
                 return true;
             }
             
             // PC番号、内線番号、座席番号の分離：元の値があって新しい値が空の場合
             if ((fieldCode === 'PC番号' || fieldCode === '内線番号' || fieldCode === '座席番号') && 
                 originalValue && (!newValue || newValue === '')) {
                 return true;
             }
             
             return false;
         }

         // 🆕 レコードキーを取得
         static _getRecordKey(ledgerType, fields) {
             // 各台帳の主キーフィールドを取得
             const primaryKeyMapping = {
                 'PC': 'PC番号',
                 'USER': 'ユーザーID',
                 'SEAT': '座席番号',
                 'EXT': '内線番号'
             };

             const primaryKeyField = primaryKeyMapping[ledgerType];
             return fields[primaryKeyField] || '不明';
         }

         // 🆕 変更前の値を取得（台帳の視点から）
         static _getOriginalValue(fieldCode, integrationKey, ledgerType) {
             try {
                 // 対象行を取得
                 const row = document.querySelector(`tr[data-integration-key="${integrationKey}"]`);
                 if (!row) {
                     console.warn(`🔍 行が見つかりません: ${integrationKey}`);
                     return null;
                 }

                 // 対象セルを取得
                 const cell = row.querySelector(`td[data-field-code="${fieldCode}"]`);
                 if (!cell) {
                     console.warn(`🔍 セルが見つかりません: ${fieldCode}`);
                     return null;
                 }

                 // セルのdata-original-value属性から変更前の値を取得
                 const originalValue = cell.getAttribute('data-original-value');
                 console.log(`🔍 data-original-value取得: ${fieldCode} = "${originalValue}"`);
                 
                 if (originalValue !== null && originalValue !== '') {
                     return originalValue;
                 }

                 // data-original-valueがない場合は、現在の表示値から推測
                 // （変更されていないフィールドの場合）
                 const currentValue = this._extractCellValue(cell);
                 const isModified = cell.classList.contains('cell-modified');
                 console.log(`🔍 現在のセル値: ${fieldCode} = "${currentValue}", modified: ${isModified}`);
                 
                 if (!isModified && currentValue) {
                     return currentValue;
                 }

                 // 統合キーから元の値を推測（主キーフィールドの場合）
                 const originalFromKey = this._extractOriginalValueFromIntegrationKey(fieldCode, integrationKey);
                 if (originalFromKey) {
                     console.log(`🔍 統合キーから推測成功: ${fieldCode} = "${originalFromKey}"`);
                     return originalFromKey;
                 }

                 // 台帳の視点から関連フィールドの元の値を取得
                 const relatedValue = this._getRelatedFieldOriginalValue(fieldCode, integrationKey, ledgerType, row);
                 if (relatedValue) {
                     console.log(`🔍 関連フィールドから取得: ${fieldCode} = "${relatedValue}"`);
                     return relatedValue;
                 }

                 console.log(`🔍 変更前の値が特定できません: ${fieldCode}`);
                 return null;
             } catch (error) {
                 console.warn(`変更前の値取得エラー (${fieldCode}):`, error);
                 return null;
             }
         }

         // 🆕 台帳の視点から関連フィールドの元の値を取得
         static _getRelatedFieldOriginalValue(fieldCode, integrationKey, ledgerType, row) {
             try {
                 // 主キーフィールドのマッピング
                 const primaryKeyMapping = {
                     'PC': 'PC番号',
                     'USER': 'ユーザーID', 
                     'SEAT': '座席番号',
                     'EXT': '内線番号'
                 };

                 // 現在の台帳の主キーを取得
                 const currentPrimaryKey = primaryKeyMapping[ledgerType];
                 
                 // 他の台帳の主キーフィールドの場合
                 if (fieldCode !== currentPrimaryKey && Object.values(primaryKeyMapping).includes(fieldCode)) {
                     // 同じ行の他の統合キーから値を探す
                     const relatedIntegrationKeys = this._findRelatedIntegrationKeys(integrationKey, row);
                     
                                           for (const relatedKey of relatedIntegrationKeys) {
                          const value = this._extractOriginalValueFromIntegrationKey(fieldCode, relatedKey);
                          if (value && value !== 'undefined') {
                              console.log(`🔍 関連統合キーから取得: ${fieldCode} = "${value}" (from ${relatedKey})`);
                              return value;
                          }
                      }
                 }

                 return null;
             } catch (error) {
                 console.warn(`関連フィールド元の値取得エラー (${fieldCode}):`, error);
                 return null;
             }
         }

         // 🆕 関連する統合キーを検索
         static _findRelatedIntegrationKeys(currentIntegrationKey, row) {
             try {
                 const relatedKeys = [];
                 
                 // 同じ行の他の行から統合キーを直接取得
                 const allRows = document.querySelectorAll('tr[data-integration-key]');
                 
                 // 現在の統合キーから主キー情報を抽出
                 const currentKeys = this._extractAllKeysFromIntegrationKey(currentIntegrationKey);
                 
                 // ユーザー台帳の場合、同じユーザーIDを持つ他の台帳の統合キーを探す
                 if (currentIntegrationKey.startsWith('USER:')) {
                     const userId = currentKeys.USER;
                     
                     for (const otherRow of allRows) {
                         const otherKey = otherRow.getAttribute('data-integration-key');
                         if (otherKey && otherKey !== currentIntegrationKey && otherKey.includes(`USER:${userId}`)) {
                             relatedKeys.push(otherKey);
                             console.log(`🔍 関連統合キー発見: ${otherKey}`);
                         }
                     }
                 } else {
                     // 他の台帳の場合、現在の統合キーから他の台帳の統合キーを構築
                     if (currentKeys.PC && currentKeys.SEAT && currentKeys.EXT) {
                         // 完全な統合キーの場合、ユーザー台帳の統合キーも探す
                         if (currentKeys.USER) {
                             relatedKeys.push(`USER:${currentKeys.USER}`);
                         }
                     }
                 }
                 
                 console.log(`🔍 関連統合キー候補:`, relatedKeys);
                 return relatedKeys;
             } catch (error) {
                 console.warn(`関連統合キー検索エラー:`, error);
                 return [];
             }
         }

         // 🆕 統合キーからすべての主キー情報を抽出
         static _extractAllKeysFromIntegrationKey(integrationKey) {
             try {
                 const keys = {};
                 const parts = integrationKey.split('|');
                 
                 parts.forEach(part => {
                     if (part.startsWith('PC:')) keys.PC = part.substring(3);
                     else if (part.startsWith('USER:')) keys.USER = part.substring(5);
                     else if (part.startsWith('SEAT:')) keys.SEAT = part.substring(5);
                     else if (part.startsWith('EXT:')) keys.EXT = part.substring(4);
                 });
                 
                 console.log(`🔍 統合キーから抽出した主キー:`, keys);
                 return keys;
             } catch (error) {
                 console.warn(`統合キー主キー抽出エラー:`, error);
                 return {};
             }
         }

         // 🆕 分離処理での元の値を取得
         static _getSeparationOriginalValue(fieldCode, integrationKey, row) {
             try {
                 // ユーザーID分離の場合の特別処理
                 if (fieldCode === 'ユーザーID') {
                     // 統合キーからユーザーIDを取得
                     const userIdFromKey = this._extractOriginalValueFromIntegrationKey('ユーザーID', integrationKey);
                     if (userIdFromKey) {
                         return userIdFromKey;
                     }
                 }

                 // 他の台帳のセルから関連する値を取得
                 if (fieldCode === 'PC番号' || fieldCode === '内線番号' || fieldCode === '座席番号') {
                     const relatedValue = this._extractOriginalValueFromIntegrationKey(fieldCode, integrationKey);
                     if (relatedValue) {
                         return relatedValue;
                     }
                 }

                 // ユーザー名などの詳細情報は、現在の行の他のセルから推測
                 if (fieldCode === 'ユーザー名') {
                     // ユーザーIDが分かっている場合、そのユーザーの名前を取得
                     const userId = this._extractOriginalValueFromIntegrationKey('ユーザーID', integrationKey);
                     if (userId) {
                         // 既存のデータから該当ユーザーの名前を検索
                         const userNameCell = row.querySelector(`td[data-field-code="ユーザー名"]`);
                         if (userNameCell) {
                             const currentUserName = this._extractCellValue(userNameCell);
                             if (currentUserName && !userNameCell.classList.contains('cell-modified')) {
                                 return currentUserName;
                             }
                         }
                     }
                 }

                 return null;
             } catch (error) {
                 console.warn(`分離処理での元の値取得エラー (${fieldCode}):`, error);
                 return null;
             }
         }

         // 🆕 統合キーから元の値を推測
         static _extractOriginalValueFromIntegrationKey(fieldCode, integrationKey) {
             try {
                 // 統合キーの形式: PC:PCAIT23N1542|USER:BSS1541|EXT:701542|SEAT:池袋19F-A1542
                 const keyParts = integrationKey.split('|');
                 
                 // フィールドコードに対応する統合キーの部分を探す
                 const fieldMapping = {
                     'PC番号': 'PC:',
                     'ユーザーID': 'USER:',
                     '内線番号': 'EXT:',
                     '座席番号': 'SEAT:',
                     'ユーザー名': 'USER_NAME:',  // ユーザー名は統合キーに含まれていない
                     'PC用途': 'PC_PURPOSE:',     // PC用途も統合キーに含まれていない
                     '部署': 'DEPT:',             // 部署も統合キーに含まれていない
                     '役職': 'POSITION:'          // 役職も統合キーに含まれていない
                 };
                 
                 const prefix = fieldMapping[fieldCode];
                 if (!prefix) {
                     console.log(`🔍 統合キーに含まれないフィールド: ${fieldCode}`);
                     return null;
                 }
                 
                 const keyPart = keyParts.find(part => part.startsWith(prefix));
                 if (keyPart) {
                     const value = keyPart.substring(prefix.length);
                     if (value && value !== 'undefined') {
                         console.log(`🔍 統合キーから取得成功: ${fieldCode} = "${value}"`);
                         return value;
                     }
                 }
                 
                 console.log(`🔍 統合キーに該当部分なし: ${fieldCode}, prefix: ${prefix}`);
                 return null;
             } catch (error) {
                 console.warn(`統合キーからの値推測エラー (${fieldCode}):`, error);
                 return null;
             }
         }

         // 🆕 台帳種別を日本語表示名に変換
         static _getLedgerTypeDisplayName(ledgerType) {
             const mapping = {
                 'SEAT': '座席台帳',
                 'PC': 'PC台帳',
                 'EXT': '内線台帳',
                 'USER': 'ユーザー台帳'
             };
             return mapping[ledgerType] || ledgerType;
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

    // =============================================================================
    // 自動初期化処理（table-integration.jsの機能を統合）
    // =============================================================================

    // 初期化実行 - DOMContentLoadedまたはloadイベント後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TableCreator.createTable().catch(error => {
                console.error('❌ テーブル初期化エラー:', error);
            });
        });
    } else {
        // DOMが既に読み込まれている場合は即座に実行
        TableCreator.createTable().catch(error => {
            console.error('❌ テーブル初期化エラー:', error);
        });
    }

})(); 