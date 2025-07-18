/**
 * 🎨 統合台帳システム v2 - モーダルUI管理
 * @description 確認・進捗・結果表示用のモーダルダイアログ管理
 * @version 2.0.0
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.Modal = {};

    // =============================================================================
    // 🎯 モーダルマネージャー - 基底クラス
    // =============================================================================

    class ModalManager {
        constructor() {
            this.overlay = null;
            this.isOpen = false;
        }

        /**
         * モーダルを作成
         */
        _createModal(config) {
            // オーバーレイ作成
            this.overlay = document.createElement('div');
            this.overlay.className = 'ledger-modal-overlay';

            // モーダル本体作成
            const modal = document.createElement('div');
            modal.className = 'ledger-modal';
            // 幅が明示的に指定された場合のみ適用（それ以外はCSSに任せる）
            if (config.width) {
                modal.style.width = config.width;
            }

            // ヘッダー作成
            const header = this._createHeader(config.title, config.type);
            modal.appendChild(header);

            // ボディ作成
            const body = document.createElement('div');
            body.className = 'ledger-modal-body';
            body.innerHTML = config.content || '';
            modal.appendChild(body);

            // フッター作成（ボタンがある場合）
            if (config.buttons && config.buttons.length > 0) {
                const footer = this._createFooter(config.buttons);
                modal.appendChild(footer);
            }

            this.overlay.appendChild(modal);
            document.body.appendChild(this.overlay);

            return { modal, body };
        }

        /**
         * ヘッダー作成
         */
        _createHeader(title, type = 'info') {
            const header = document.createElement('div');
            header.className = `ledger-modal-header ${type}`;

            const titleElement = document.createElement('h3');
            titleElement.className = 'ledger-modal-title';
            titleElement.innerHTML = title;

            const closeButton = document.createElement('button');
            closeButton.className = 'ledger-modal-close';
            closeButton.innerHTML = '×';
            closeButton.addEventListener('click', () => this.close());

            header.appendChild(titleElement);
            header.appendChild(closeButton);

            return header;
        }

        /**
         * フッター作成
         */
        _createFooter(buttons) {
            const footer = document.createElement('div');
            footer.className = 'ledger-modal-footer';

            buttons.forEach(buttonConfig => {
                const button = document.createElement('button');
                button.className = `ledger-modal-btn ${buttonConfig.type || 'secondary'}`;
                button.textContent = buttonConfig.text;
                
                if (buttonConfig.disabled) {
                    button.disabled = true;
                }

                if (buttonConfig.onclick) {
                    button.addEventListener('click', buttonConfig.onclick);
                }

                footer.appendChild(button);
            });

            return footer;
        }

        /**
         * モーダル表示
         */
        show() {
            if (this.overlay) {
                this.isOpen = true;
                document.body.style.overflow = 'hidden';
                setTimeout(() => {
                    this.overlay.classList.add('show');
                }, 10);
            }
        }

        /**
         * モーダル非表示
         */
        close() {
            if (this.overlay) {
                this.overlay.classList.remove('show');
                setTimeout(() => {
                    if (this.overlay && this.overlay.parentNode) {
                        this.overlay.parentNode.removeChild(this.overlay);
                    }
                    this.overlay = null;
                    this.isOpen = false;
                    document.body.style.overflow = '';
                }, 300);
            }
        }

        /**
         * ボディ要素を取得
         */
        getBody() {
            return this.overlay ? this.overlay.querySelector('.ledger-modal-body') : null;
        }

        /**
         * ボタンの状態を更新
         */
        updateButton(text, config) {
            if (!this.overlay) return;
            
            const buttons = this.overlay.querySelectorAll('.ledger-modal-btn');
            buttons.forEach(button => {
                if (button.textContent === text) {
                    if (config.disabled !== undefined) {
                        button.disabled = config.disabled;
                    }
                    if (config.text) {
                        button.textContent = config.text;
                    }
                    if (config.type) {
                        button.className = `ledger-modal-btn ${config.type}`;
                    }
                }
            });
        }
    }

    // =============================================================================
    // 📋 更新確認モーダル
    // =============================================================================

    class UpdateConfirmModal extends ModalManager {
        constructor() {
            super();
            this.resolvePromise = null;
        }

        /**
         * 確認モーダルを表示
         */
        show(checkedRows, ledgerDataSets, updateBodies) {
            return new Promise((resolve) => {
                this.resolvePromise = resolve;

                const content = this._generateConfirmContent(checkedRows, ledgerDataSets, updateBodies);
                
                const { modal, body } = this._createModal({
                    title: '💾 データ更新の確認',
                    type: 'warning',
                    content: content,
                    buttons: [
                        {
                            text: 'キャンセル',
                            type: 'secondary',
                            onclick: () => {
                                this.resolvePromise(false);
                                this.close();
                            }
                        },
                        {
                            text: '更新実行',
                            type: 'danger',
                            onclick: () => {
                                this.resolvePromise(true);
                                this.close();
                            }
                        }
                    ]
                });

                super.show();
            });
        }

        /**
         * 確認画面のコンテンツを生成
         */
        _generateConfirmContent(checkedRows, ledgerDataSets, updateBodies) {
            // 統計情報
            const totalRows = checkedRows.length;
            const ledgerCounts = Object.entries(updateBodies).map(([ledgerType, body]) => ({
                type: ledgerType,
                count: body.records.length,
                name: this._getLedgerName(ledgerType)
            }));

            // 統計情報を横並びテキスト形式で生成
            const statsText = [
                `対象行数：${totalRows}行`,
                ...ledgerCounts.map(ledger => `${ledger.name}：${ledger.count}件`)
            ].join('　|　');

            // データプレビューテーブル（全行表示）
            const previewTable = this._generatePreviewTable(checkedRows);

            return `
                <div class="ledger-modal-section compact">
                    <div class="ledger-modal-section-title compact">📊 更新対象データの概要</div>
                    <p style="margin: 2px 0; font-size: 12px; line-height: 1.2;">以下のデータをkintoneの各台帳に更新します。</p>
                    
                    <div class="ledger-stats-text" style="margin: 3px 0; font-size: 12px; color: #555; font-weight: 500;">
                        ${statsText}
                    </div>
                </div>

                <div class="ledger-modal-section preview-section">
                    <div class="ledger-modal-section-title">👀 データプレビュー（全${totalRows}行）</div>
                    <div class="ledger-preview-container">
                        ${previewTable}
                    </div>
                </div>

                <div class="ledger-modal-section compact">
                    <div class="ledger-modal-section-title compact">⚠️ 注意事項</div>
                    <ul style="color: #666; line-height: 1.3; margin: 2px 0; padding-left: 16px; font-size: 12px;">
                        <li>この操作は元に戻すことができません</li>
                        <li>各台帳のデータが上記の内容で上書きされます</li>
                        <li>空文字の項目も含めて更新されます</li>
                        <li>処理中はブラウザを閉じないでください</li>
                    </ul>
                </div>
            `;
        }

        /**
         * プレビューテーブルを生成
         */
        _generatePreviewTable(rows) {
            if (rows.length === 0) return '<p>対象データがありません。</p>';

            // config.jsからモーダルプレビュー表示対象フィールドを取得
            const previewFields = this._getModalPreviewFields();
            
            // ヘッダー生成（行番号 + 設定されたフィールド）
            const headerHtml = `<th class="row-number-header">#</th>` + 
                previewFields.map(field => `<th>${field.label}</th>`).join('');

            // 変更統計の初期化
            let totalModifiedCells = 0;
            let modifiedRows = 0;

            // 行データ生成
            const rowsHtml = rows.map((row, index) => {
                const cells = row.querySelectorAll('td[data-field-code]');
                const rowData = {};
                const modifiedFields = new Set();
                
                cells.forEach(cell => {
                    const fieldCode = cell.getAttribute('data-field-code');
                    const value = this._extractCellValue(cell);
                    rowData[fieldCode] = value || '';
                    
                    // 変更されたセルかどうかをチェック
                    if (cell.classList.contains('cell-modified')) {
                        modifiedFields.add(fieldCode);
                    }
                });

                // 変更統計を更新
                if (modifiedFields.size > 0) {
                    modifiedRows++;
                    totalModifiedCells += modifiedFields.size;
                }

                // 行番号セル
                const rowNumberHtml = `<td class="row-number-cell">${index + 1}</td>`;
                
                // データセル（変更されたセルには特別なクラスを追加）
                const cellsHtml = previewFields.map(field => {
                    const value = rowData[field.fieldCode] || '';
                    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
                    const isModified = modifiedFields.has(field.fieldCode);
                    const modifiedClass = isModified ? ' class="modified-cell"' : '';
                    const modifiedIcon = isModified ? ' ✏️' : '';
                    
                    return `<td${modifiedClass} title="${value}${isModified ? ' (変更済み)' : ''}">${displayValue}${modifiedIcon}</td>`;
                }).join('');

                return `<tr>${rowNumberHtml}${cellsHtml}</tr>`;
            }).join('');

            // データが多い場合の案内文
            const infoText = rows.length > 50 ? 
                `<p class="preview-info">💡 ${rows.length}行のデータが表示されています。テーブルをスクロールして全ての行を確認できます。</p>` : '';
            
            // スクロール案内文（フィールド数が多い場合）
            const scrollInfo = previewFields.length > 8 ? 
                `<p class="scroll-info">↔️ フィールド数が多いため、横スクロールで全ての列を確認できます</p>` : '';

            // 変更統計情報を生成
            const modificationStats = totalModifiedCells > 0 ? 
                `<div class="modification-stats">
                    <span class="stats-item">📝 変更行数: <strong>${modifiedRows}行</strong></span>
                    <span class="stats-item">✏️ 変更セル数: <strong>${totalModifiedCells}個</strong></span>
                </div>` : '';

            // 変更セルの説明を追加
            const modificationInfo = totalModifiedCells > 0 ? 
                `<p class="modification-info">✏️ 変更されたセルはオレンジ色でハイライトされ、編集アイコンが表示されます</p>` :
                `<p class="modification-info">ℹ️ 変更されたセルはありません</p>`;

            // テーブルの動的幅計算（列数 × 120px + 行番号列50px）
            const calculatedWidth = (previewFields.length * 120) + 50;
            const finalWidth = Math.max(calculatedWidth, 1200);
            const tableStyle = `style="min-width: ${finalWidth}px;"`;
            
            console.log(`📊 テーブル幅計算: 列数=${previewFields.length}, 計算幅=${calculatedWidth}px, 最終幅=${finalWidth}px`);

            return `
                ${infoText}
                ${scrollInfo}
                ${modificationStats}
                ${modificationInfo}
                <table class="ledger-preview-table" ${tableStyle}>
                    <thead>
                        <tr>${headerHtml}</tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            `;
        }

        /**
         * モーダルプレビュー表示対象フィールドを取得
         */
        _getModalPreviewFields() {
            if (!window.LedgerV2 || !window.LedgerV2.Config || !window.LedgerV2.Config.fieldsConfig) {
                            // 動的フォールバック：主キーフィールドのみ
                const primaryKeys = window.LedgerV2?.Utils?.FieldValueProcessor?.getAllPrimaryKeyFields() || [];
                if (primaryKeys.length === 0) {
                    console.error('❌ 主キーフィールドが取得できませんでした');
                    return [];
                }
                return primaryKeys.map(fieldCode => {
                    // fieldsConfigから該当フィールドのラベルを取得
                    const field = window.fieldsConfig?.find(f => f.fieldCode === fieldCode);
                    return {
                        fieldCode: fieldCode,
                        label: field?.label || fieldCode
                    };
                });
            }

            // config.jsからshowInModalPreview=trueのフィールドを抽出
            const fields = window.LedgerV2.Config.fieldsConfig
                .filter(field => field.showInModalPreview === true)
                .map(field => ({
                    fieldCode: field.fieldCode,
                    label: field.label
                }));

            // フィールドが見つからない場合のフォールバック
            if (fields.length === 0) {
                console.warn('⚠️ No preview fields configured, using primary keys');
                const primaryKeys = window.LedgerV2?.Utils?.FieldValueProcessor?.getAllPrimaryKeyFields() || [];
                if (primaryKeys.length === 0) {
                    console.error('❌ 主キーフィールドが取得できませんでした');
                    return [];
                }
                return primaryKeys.map(fieldCode => {
                    // fieldsConfigから該当フィールドのラベルを取得
                    const field = window.fieldsConfig?.find(f => f.fieldCode === fieldCode);
                    return {
                        fieldCode: fieldCode,
                        label: field?.label || fieldCode
                    };
                });
            }

            return fields;
        }

        /**
         * セルから値を抽出
         */
        _extractCellValue(cell) {
            const input = cell.querySelector('input, select, textarea');
            if (input) return input.value || '';
            
            const primaryKeyValue = cell.querySelector('.primary-key-value');
            if (primaryKeyValue) return primaryKeyValue.textContent.trim() || '';
            
            const textContent = cell.textContent || '';
            return textContent.replace(/✂️/g, '').trim();
        }

        /**
         * 台帳名を取得
         */
        _getLedgerName(ledgerType) {
            return window.LedgerV2.Utils.FieldValueProcessor.getLedgerNameByApp(ledgerType);
        }
    }

    // =============================================================================
    // 📈 進捗表示モーダル
    // =============================================================================

    class ProgressModal extends ModalManager {
        constructor() {
            super();
            this.progressBar = null;
            this.progressText = null;
            this.currentTask = null;
        }

        /**
         * 進捗モーダルを表示
         */
        show(totalSteps) {
            const content = this._generateProgressContent(totalSteps);
            
            const { modal, body } = this._createModal({
                title: '⚙️ データ更新中...',
                type: 'info',
                content: content,
                width: '500px'
            });

            this.progressBar = body.querySelector('.ledger-progress-fill');
            this.progressText = body.querySelector('.ledger-progress-text');
            this.currentTask = body.querySelector('.ledger-current-task');

            super.show();
        }

        /**
         * 進捗を更新
         */
        updateProgress(currentStep, totalSteps, taskName) {
            const percentage = Math.round((currentStep / totalSteps) * 100);
            
            if (this.progressBar) {
                this.progressBar.style.width = `${percentage}%`;
            }
            
            if (this.progressText) {
                this.progressText.textContent = `${currentStep} / ${totalSteps} 完了 (${percentage}%)`;
            }
            
            if (this.currentTask) {
                this.currentTask.textContent = taskName;
            }
        }

        /**
         * 進捗画面のコンテンツを生成
         */
        _generateProgressContent(totalSteps) {
            return `
                <div class="ledger-modal-section">
                    <div class="ledger-current-task">準備中...</div>
                    
                    <div class="ledger-progress-container">
                        <div class="ledger-progress-bar">
                            <div class="ledger-progress-fill"></div>
                        </div>
                        <div class="ledger-progress-text">0 / ${totalSteps} 完了 (0%)</div>
                    </div>

                    <p style="text-align: center; color: #666; font-size: 14px;">
                        処理中です。しばらくお待ちください...<br>
                        ブラウザを閉じないでください。
                    </p>
                </div>
            `;
        }
    }

    // =============================================================================
    // 📊 結果表示モーダル
    // =============================================================================

    class ResultModal extends ModalManager {
        constructor() {
            super();
        }

        /**
         * 結果モーダルを表示
         */
        show(updateResults, checkedRowsCount) {
            const isSuccess = Object.values(updateResults).every(result => result.success);
            const content = this._generateResultContent(updateResults, checkedRowsCount, isSuccess);
            
            const { modal, body } = this._createModal({
                title: isSuccess ? '✅ 更新完了' : '⚠️ 更新結果',
                type: isSuccess ? 'info' : 'warning',
                content: content,
                width: '450px',
                buttons: [
                    {
                        text: '閉じる',
                        type: 'primary',
                        onclick: () => this.close()
                    }
                ]
            });

            super.show();
        }

        /**
         * 結果画面のコンテンツを生成
         */
        _generateResultContent(updateResults, checkedRowsCount, isSuccess) {
            const successCount = Object.values(updateResults).filter(result => result.success).length;
            const errorCount = Object.values(updateResults).filter(result => !result.success).length;
            const totalLedgers = Object.keys(updateResults).length;

            // 結果サマリー
            const summaryCards = `
                <div class="ledger-result-summary">
                    <div class="ledger-result-card success">
                        <div class="ledger-result-title">対象行数</div>
                        <div class="ledger-result-value">${checkedRowsCount}</div>
                    </div>
                    <div class="ledger-result-card ${successCount === totalLedgers ? 'success' : 'error'}">
                        <div class="ledger-result-title">成功台帳数</div>
                        <div class="ledger-result-value">${successCount} / ${totalLedgers}</div>
                    </div>
                    ${errorCount > 0 ? `
                    <div class="ledger-result-card error">
                        <div class="ledger-result-title">失敗台帳数</div>
                        <div class="ledger-result-value">${errorCount}</div>
                    </div>
                    ` : ''}
                </div>
            `;

            // 台帳別詳細
            const ledgerDetails = Object.entries(updateResults).map(([ledgerType, result]) => {
                const ledgerName = this._getLedgerName(ledgerType);
                const statusIcon = result.success ? '✅' : '❌';
                const statusClass = result.success ? 'success' : 'error';
                
                return `
                    <div class="ledger-stats-card ${ledgerType.toLowerCase()} ${statusClass}">
                        <div class="ledger-stats-title">${statusIcon} ${ledgerName}</div>
                        <div class="ledger-stats-value">${result.recordCount}<span class="ledger-stats-unit">件</span></div>
                        ${!result.success ? `<div style="color: #c53030; font-size: 12px; margin-top: 5px;">${result.error}</div>` : ''}
                    </div>
                `;
            }).join('');

            // エラー詳細
            const errorDetails = errorCount > 0 ? `
                <div class="ledger-error-details">
                    <div class="ledger-error-title">❌ エラー詳細</div>
                    <ul class="ledger-error-list">
                        ${Object.entries(updateResults)
                            .filter(([_, result]) => !result.success)
                            .map(([ledgerType, result]) => `
                                <li class="ledger-error-item">
                                    <strong>${this._getLedgerName(ledgerType)}:</strong> ${result.error}
                                </li>
                            `).join('')}
                    </ul>
                </div>
            ` : '';

            const message = isSuccess 
                ? '🎉 すべてのデータが正常に更新されました！'
                : '⚠️ 一部の台帳でエラーが発生しました。エラー詳細を確認してください。';

            return `
                <div class="ledger-modal-section">
                    <p style="font-size: 14px; text-align: center; margin-bottom: 6px;">${message}</p>
                    ${summaryCards}
                </div>

                <div class="ledger-modal-section">
                    <div class="ledger-modal-section-title">📋 台帳別結果</div>
                    <div class="ledger-stats-grid">
                        ${ledgerDetails}
                    </div>
                </div>

                ${errorDetails}
            `;
        }

        /**
         * 台帳名を取得
         */
        _getLedgerName(ledgerType) {
            const names = {
                SEAT: '座席台帳',
                PC: 'PC台帳',
                EXT: '内線台帳',
                USER: 'ユーザー台帳'
            };
            return names[ledgerType] || ledgerType;
        }
    }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    window.LedgerV2.Modal = {
        UpdateConfirmModal,
        ProgressModal,
        ResultModal
    };

})();
