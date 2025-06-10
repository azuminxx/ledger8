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
                
                // ユーザーから隠すフィールドの場合、専用クラスを追加
                if (field.isHiddenFromUser) {
                    th.classList.add('header-hidden-from-user');
                }
                
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
                // 初期メッセージ表示を削除（不要のためコメントアウト）
                /* 
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
                */
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
                margin-right: 8px;
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
                margin-right: 8px;
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
                margin-right: 8px;
            `;
            clearBtn.addEventListener('click', () => this.clearAllFilters());
            clearBtn.addEventListener('mouseenter', () => {
                clearBtn.style.background = '#da190b';
            });
            clearBtn.addEventListener('mouseleave', () => {
                clearBtn.style.background = '#f44336';
            });

            // 🎯 編集モード切り替えボタン
            const editModeBtn = document.createElement('button');
            editModeBtn.innerHTML = '🔒 編集モード';
            editModeBtn.id = 'edit-mode-toggle-btn';
            editModeBtn.className = 'ledger-edit-mode-btn';
            editModeBtn.style.cssText = `
                background: #9C27B0;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;
            
            // 編集モード切り替え機能
            editModeBtn.addEventListener('click', () => this.toggleEditMode(editModeBtn));
            editModeBtn.addEventListener('mouseenter', () => {
                if (window.TableEditMode && window.TableEditMode.isEditMode) {
                    editModeBtn.style.background = '#E65100'; // オレンジ系のホバー
                } else {
                    editModeBtn.style.background = '#7B1FA2'; // 紫系のホバー
                }
            });
            editModeBtn.addEventListener('mouseleave', () => {
                if (window.TableEditMode && window.TableEditMode.isEditMode) {
                    editModeBtn.style.background = '#FF9800'; // オレンジ
                } else {
                    editModeBtn.style.background = '#9C27B0'; // 紫
                }
            });
            
            // 初期状態は閲覧モード
            this.updateEditModeButton(editModeBtn, false);

            // 💾 データ更新ボタン
            const updateBtn = document.createElement('button');
            updateBtn.innerHTML = '💾 データ更新';
            updateBtn.className = 'ledger-update-btn';
            updateBtn.style.cssText = `
                background: #FF5722;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
                margin-right: 8px;
            `;
            updateBtn.addEventListener('click', () => this.executeDataUpdate());
            updateBtn.addEventListener('mouseenter', () => {
                updateBtn.style.background = '#E64A19';
            });
            updateBtn.addEventListener('mouseleave', () => {
                updateBtn.style.background = '#FF5722';
            });

            // 🆕 新規レコード追加ボタン
            const addRecordBtn = document.createElement('button');
            addRecordBtn.innerHTML = '+ 新規行追加';
            addRecordBtn.className = 'ledger-add-record-btn';
            addRecordBtn.style.cssText = `
                background: #8B4513;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
                margin-right: 8px;
            `;
            addRecordBtn.addEventListener('click', () => this.openAddRecordDialog());
            addRecordBtn.addEventListener('mouseenter', () => {
                addRecordBtn.style.background = '#6D3410';
            });
            addRecordBtn.addEventListener('mouseleave', () => {
                addRecordBtn.style.background = '#8B4513';
            });

            container.appendChild(searchBtn);
            container.appendChild(appendBtn);
            container.appendChild(clearBtn);
            container.appendChild(addRecordBtn);
            container.appendChild(updateBtn);
            container.appendChild(editModeBtn);
        }

        // 🆕 編集モード切り替え処理
        static toggleEditMode(button) {
            if (!window.TableEditMode) {
                console.error('❌ TableEditModeが初期化されていません');
                return;
            }

            const isCurrentlyEditMode = window.TableEditMode.isEditMode;
            
            if (isCurrentlyEditMode) {
                // 編集モード → 閲覧モード
                window.TableEditMode.disableEditMode();
                document.body.classList.remove('edit-mode-active');
                document.body.classList.add('view-mode-active');
                this.updateEditModeButton(button, false);
                console.log('🔒 閲覧モードに切り替え完了');
            } else {
                // 閲覧モード → 編集モード
                window.TableEditMode.enableEditMode();
                document.body.classList.remove('view-mode-active');
                document.body.classList.add('edit-mode-active');
                this.updateEditModeButton(button, true);
                console.log('📝 編集モードに切り替え完了');
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
                button.innerHTML = '📝 閲覧モード';
                button.style.background = '#FF9800'; // オレンジ
            } else {
                button.innerHTML = '🔒 編集モード';
                button.style.background = '#9C27B0'; // 紫
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
                
                console.log('🆕 新規レコード追加ダイアログを表示');
            } catch (error) {
                console.error('❌ 新規レコード追加ダイアログ表示エラー:', error);
                alert('新規レコード追加ダイアログの表示中にエラーが発生しました。');
            }
        }

        static async executeSearch() {
            try {
                console.log('🔍 手動検索実行');
                
                // 🚫 無条件検索チェック
                if (!this._validateSearchConditions()) {
                    console.log('🚫 無条件検索のため検索を中止');
                    this._showNoConditionError();
                    return;
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
                console.log('✅ 検索完了');
            } catch (error) {
                LoadingManager.hide();
                console.error('❌ 検索エラー:', error);
            }
        }

        static async executeAppendSearch() {
            try {
                console.log('📝 追加検索実行');
                
                // 🚫 無条件検索チェック
                if (!this._validateSearchConditions()) {
                    console.log('🚫 無条件検索のため検索を中止');
                    this._showNoConditionError();
                    return;
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

        // 💾 データ更新実行（モーダル対応版）
        static async executeDataUpdate() {
            try {
                console.log('💾 データ更新実行開始');
                
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
                
                console.log(`📋 更新対象行数: ${checkedRows.length}件`);
                
                // 各行のデータを4つの台帳に分解
                const ledgerDataSets = this._decomposeTo4Ledgers(checkedRows);
                
                // kintone用のupsertボディを作成
                const updateBodies = this._createUpdateBodies(ledgerDataSets);
                
                // 確認モーダルを表示
                const confirmModal = new window.LedgerV2.Modal.UpdateConfirmModal();
                const confirmed = await confirmModal.show(checkedRows, ledgerDataSets, updateBodies);
                
                if (!confirmed) {
                    console.log('🚫 ユーザーが更新をキャンセルしました');
                    return;
                }
                
                // 進捗モーダルを表示
                const progressModal = new window.LedgerV2.Modal.ProgressModal();
                const totalSteps = Object.keys(updateBodies).length;
                progressModal.show(totalSteps);
                
                // kintone更新用データをコンソールに出力
                console.log('🚀 kintone更新用データ:', updateBodies);
                
                // 実際のAPI呼び出し
                const updateResults = {};
                let currentStep = 0;
                
                for (const [ledgerType, body] of Object.entries(updateBodies)) {
                    if (body.records.length > 0) {
                        try {
                            currentStep++;
                            const ledgerName = this._getLedgerName(ledgerType);
                            progressModal.updateProgress(currentStep, totalSteps, `${ledgerName}を更新中... (${body.records.length}件)`);
                            
                            console.log(`📤 ${ledgerType}台帳更新中... (${body.records.length}件)`);
                            
                            const response = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', body);
                            
                            updateResults[ledgerType] = {
                                success: true,
                                recordCount: body.records.length,
                                response: response
                            };
                            
                            console.log(`✅ ${ledgerType}台帳更新完了: ${body.records.length}件`, response);
                            
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
                
                console.log('📊 更新結果サマリー:', updateResults);
                
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
            
            console.log(`🔍 チェック状態確認: 全${rows.length}行中、${checkedRows.length}行がチェック済み`);
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
                console.log(`📋 行${index + 1}のデータ分解開始`);
                
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
        
        // 特定の台帳用のデータを抽出
        static _extractLedgerData(rowData, ledgerType) {
            const recordIdField = `${ledgerType.toLowerCase()}_record_id`;
            const recordIdValue = rowData.fields[recordIdField];
            
            // レコードIDがない場合はスキップ
            if (!recordIdValue) {
                return null;
            }
            
            const ledgerRecord = {
                id: parseInt(recordIdValue),
                fields: {}
            };
            
            // 全主キーは全台帳に含める（空文字でも更新）
            const primaryKeys = window.LedgerV2.Utils.FieldValueProcessor.getAllPrimaryKeyFields();
            primaryKeys.forEach(primaryKey => {
                const fieldValue = rowData.fields[primaryKey];
                if (fieldValue !== undefined) {
                    ledgerRecord.fields[primaryKey] = fieldValue || ''; // 空文字も含める
                }
            });
            
            // その台帳固有のフィールドを追加（主キーとxxx_record_idは除外）
            const ledgerSpecificFields = window.fieldsConfig.filter(field => 
                field.sourceApp === ledgerType && 
                !field.isPrimaryKey && 
                !field.isRecordId &&
                !field.fieldCode.endsWith('_record_id')
            );
            
            ledgerSpecificFields.forEach(field => {
                const fieldValue = rowData.fields[field.fieldCode];
                if (fieldValue !== undefined) {
                    ledgerRecord.fields[field.fieldCode] = fieldValue || ''; // 空文字も含める
                }
            });
            
            // 主キーまたは台帳固有フィールドが存在する場合のみ返す
            if (Object.keys(ledgerRecord.fields).length > 0) {
                return ledgerRecord;
            }
            
            return null;
        }
        
        // kintone用のupsertボディを作成
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
                    records: records.map(record => ({
                        id: record.id,
                        record: this._convertToKintoneFormat(record.fields)
                    }))
                };
                
                console.log(`📋 ${ledgerType}台帳: ${records.length}件のレコード準備完了`);
            });
            
            return updateBodies;
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
            
            console.log(`✅ チェックボックス状態をリセット: ${uncheckedCount}件のチェックを解除`);
        }

        // モーダル用リソースをロード
        static async _loadModalResources() {
            // マニフェストで読み込み済みの場合は何もしない
            if (window.LedgerV2 && window.LedgerV2.Modal) {
                console.log('✅ モーダルリソースは既に読み込み済みです');
                return;
            }

            // フォールバック：動的読み込み（開発環境用）
            console.log('⚠️ マニフェストでの読み込みが確認できません。動的読み込みを実行します...');
            
            // インラインスタイルを注入
            // if (window.LedgerV2 && window.LedgerV2.injectModalStyles) {
            //     window.LedgerV2.injectModalStyles();
            // }

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
                console.log('📄 modal-manager.js を動的読み込みしました');
            }
        }

        // 台帳名を取得（モーダル用）
        static _getLedgerName(ledgerType) {
            return window.LedgerV2.Utils.FieldValueProcessor.getLedgerNameByApp(ledgerType);
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