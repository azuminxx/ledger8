(() => {
    'use strict';

    // =============================================================================
    // 🆕 新規レコード追加モーダル
    // =============================================================================

    class AddRecordModal {
        constructor() {
            this.currentStep = 1;
            this.selectedLedger = null;
            this.formData = {};
            this.modal = null;
        }

        /**
         * モーダルを表示
         */
        show() {
            this.currentStep = 1;
            this.selectedLedger = null;
            this.formData = {};
            this._createModal();
            this._renderStep1();
        }

        /**
         * モーダルを閉じる
         */
        close() {
            if (this.modal) {
                this.modal.remove();
                this.modal = null;
            }
        }

        /**
         * モーダル要素を作成
         */
        _createModal() {
            // 既存のモーダルを削除
            const existing = document.querySelector('.add-record-modal');
            if (existing) existing.remove();

            this.modal = document.createElement('div');
            this.modal.className = 'add-record-modal';
            this.modal.innerHTML = `
                <div class="add-record-overlay">
                    <div class="add-record-container">
                        <div class="add-record-header">
                            <h2 class="add-record-title">🆕 新規レコード追加</h2>
                            <button type="button" class="add-record-close">&times;</button>
                        </div>
                        <div class="add-record-body">
                            <div class="add-record-progress">
                                <div class="progress-step" data-step="1">1. 台帳選択</div>
                                <div class="progress-step" data-step="2">2. 必須項目</div>
                                <div class="progress-step" data-step="3">3. 関連情報</div>
                                <div class="progress-step" data-step="4">4. 確認</div>
                            </div>
                            <div class="add-record-content"></div>
                        </div>
                        <div class="add-record-footer">
                            <button type="button" class="btn-secondary" id="prev-step">戻る</button>
                            <button type="button" class="btn-primary" id="next-step">次へ</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(this.modal);
            this._attachEvents();
        }

        /**
         * イベントリスナーを設定
         */
        _attachEvents() {
            // 閉じるボタン
            this.modal.querySelector('.add-record-close').addEventListener('click', () => this.close());
            
            // オーバーレイクリック無効化（×ボタンでのみ閉じる）
            // this.modal.querySelector('.add-record-overlay').addEventListener('click', (e) => {
            //     if (e.target === e.currentTarget) this.close();
            // });

            // ナビゲーションボタン
            this.modal.querySelector('#prev-step').addEventListener('click', () => this._previousStep());
            this.modal.querySelector('#next-step').addEventListener('click', () => this._nextStep());

            // ESCキー無効化（×ボタンでのみ閉じる）
            // document.addEventListener('keydown', (e) => {
            //     if (e.key === 'Escape' && this.modal) this.close();
            // });
        }

        /**
         * ステップ1: 台帳選択
         */
        _renderStep1() {
            this.currentStep = 1;
            this._updateProgress();
            
            const content = this.modal.querySelector('.add-record-content');
            content.innerHTML = `
                <div class="step-content">
                    <h3>追加する台帳を選択してください</h3>
                    <div class="ledger-options">
                        <label class="ledger-option" data-ledger="SEAT">
                            <input type="radio" name="ledger" value="SEAT">
                            <div class="option-content">
                                <div class="option-icon">💺</div>
                                <div class="option-info">
                                    <div class="option-title">座席台帳</div>
                                    <div class="option-desc">座席番号が必要です</div>
                                </div>
                            </div>
                        </label>
                        <label class="ledger-option" data-ledger="PC">
                            <input type="radio" name="ledger" value="PC">
                            <div class="option-content">
                                <div class="option-icon">💻</div>
                                <div class="option-info">
                                    <div class="option-title">PC台帳</div>
                                    <div class="option-desc">PC番号が必要です</div>
                                </div>
                            </div>
                        </label>
                        <label class="ledger-option" data-ledger="EXT">
                            <input type="radio" name="ledger" value="EXT">
                            <div class="option-content">
                                <div class="option-icon">📞</div>
                                <div class="option-info">
                                    <div class="option-title">内線台帳</div>
                                    <div class="option-desc">内線番号が必要です</div>
                                </div>
                            </div>
                        </label>
                        <label class="ledger-option" data-ledger="USER">
                            <input type="radio" name="ledger" value="USER">
                            <div class="option-content">
                                <div class="option-icon">👤</div>
                                <div class="option-info">
                                    <div class="option-title">ユーザー台帳</div>
                                    <div class="option-desc">ユーザーIDが必要です</div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            `;

            // ラジオボタンの変更イベント
            content.querySelectorAll('input[name="ledger"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.selectedLedger = e.target.value;
                    this._updateNavigationButtons();
                });
            });

            this._updateNavigationButtons();
        }

        /**
         * ステップ2: 必須項目入力
         */
        _renderStep2() {
            this.currentStep = 2;
            this._updateProgress();

            const primaryKeyField = window.LedgerV2.Utils.FieldValueProcessor.getPrimaryKeyFieldByApp(this.selectedLedger);
            const ledgerFields = window.fieldsConfig.filter(f => 
                f.sourceApp === this.selectedLedger && !f.isPrimaryKey && !f.isRecordId
            );

            const content = this.modal.querySelector('.add-record-content');
            content.innerHTML = `
                <div class="step-content">
                    <h3>${this._getLedgerDisplayName(this.selectedLedger)}の必須項目を入力</h3>
                    <div class="form-group required">
                        <label for="primary-key">${primaryKeyField} <span class="required-mark">*</span></label>
                        <input type="text" id="primary-key" class="form-input" placeholder="${primaryKeyField}を入力">
                        <div class="field-hint">このフィールドは必須です</div>
                    </div>
                    ${ledgerFields.map(field => `
                        <div class="form-group">
                            <label for="${field.fieldCode}">${field.label}</label>
                            ${this._createFormInput(field)}
                            <div class="field-hint">オプション項目</div>
                        </div>
                    `).join('')}
                </div>
            `;

            // 入力イベント
            content.querySelector('#primary-key').addEventListener('input', (e) => {
                this.formData[primaryKeyField] = e.target.value;
                this._updateNavigationButtons();
            });

            ledgerFields.forEach(field => {
                const input = content.querySelector(`#${field.fieldCode}`);
                if (input) {
                    input.addEventListener('input', (e) => {
                        this.formData[field.fieldCode] = e.target.value;
                    });
                }
            });

            this._updateNavigationButtons();
        }

        /**
         * ステップ3: 関連情報入力
         */
        _renderStep3() {
            this.currentStep = 3;
            this._updateProgress();

            const primaryKeyField = window.LedgerV2.Utils.FieldValueProcessor.getPrimaryKeyFieldByApp(this.selectedLedger);
            const otherPrimaryKeys = window.LedgerV2.Utils.FieldValueProcessor.getAllPrimaryKeyFields()
                .filter(field => field !== primaryKeyField);

            const content = this.modal.querySelector('.add-record-content');
            content.innerHTML = `
                <div class="step-content">
                    <h3>関連情報を入力（オプション）</h3>
                    <p class="step-description">他の台帳との関連付けを行う場合は、対応する番号を入力してください。</p>
                    ${otherPrimaryKeys.map(field => `
                        <div class="form-group">
                            <label for="${field}">${field}</label>
                            <input type="text" id="${field}" class="form-input" placeholder="${field}を入力（任意）">
                            <div class="field-hint">他の台帳と関連付ける場合に入力</div>
                        </div>
                    `).join('')}
                </div>
            `;

            // 入力イベント
            otherPrimaryKeys.forEach(field => {
                const input = content.querySelector(`#${field}`);
                if (input) {
                    input.addEventListener('input', (e) => {
                        this.formData[field] = e.target.value;
                    });
                }
            });

            this._updateNavigationButtons();
        }

        /**
         * ステップ4: 確認画面
         */
        _renderStep4() {
            this.currentStep = 4;
            this._updateProgress();

            const content = this.modal.querySelector('.add-record-content');
            content.innerHTML = `
                <div class="step-content">
                    <h3>入力内容を確認してください</h3>
                    <div class="confirmation-summary">
                        <div class="summary-section">
                            <h4>📋 ${this._getLedgerDisplayName(this.selectedLedger)}</h4>
                            <div class="summary-content">
                                ${Object.entries(this.formData)
                                    .filter(([key, value]) => value && value.trim())
                                    .map(([key, value]) => `
                                        <div class="summary-item">
                                            <span class="summary-key">${key}:</span>
                                            <span class="summary-value">${value}</span>
                                        </div>
                                    `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="confirmation-note">
                        <p>⚠️ この内容で新規レコードを追加します。よろしいですか？</p>
                    </div>
                </div>
            `;

            this._updateNavigationButtons();
        }

        /**
         * フォーム入力要素を作成
         */
        _createFormInput(field) {
            if (field.cellType === 'dropdown' && field.options) {
                const options = field.options.map(opt => 
                    `<option value="${opt.value}">${opt.label}</option>`
                ).join('');
                return `<select id="${field.fieldCode}" class="form-input">
                    <option value="">選択してください</option>
                    ${options}
                </select>`;
            } else {
                return `<input type="text" id="${field.fieldCode}" class="form-input" placeholder="${field.label}を入力">`;
            }
        }

        /**
         * 台帳表示名を取得
         */
        _getLedgerDisplayName(ledgerType) {
            const names = {
                'SEAT': '座席台帳',
                'PC': 'PC台帳',
                'EXT': '内線台帳',
                'USER': 'ユーザー台帳'
            };
            return names[ledgerType] || ledgerType;
        }

        /**
         * プログレス表示を更新
         */
        _updateProgress() {
            const steps = this.modal.querySelectorAll('.progress-step');
            steps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                if (index + 1 === this.currentStep) {
                    step.classList.add('active');
                } else if (index + 1 < this.currentStep) {
                    step.classList.add('completed');
                }
            });
        }

        /**
         * ナビゲーションボタンを更新
         */
        _updateNavigationButtons() {
            const prevBtn = this.modal.querySelector('#prev-step');
            const nextBtn = this.modal.querySelector('#next-step');

            // 戻るボタン
            prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-block';

            // 次へボタン
            if (this.currentStep === 1) {
                nextBtn.disabled = !this.selectedLedger;
                nextBtn.textContent = '次へ';
            } else if (this.currentStep === 2) {
                const primaryKeyField = window.LedgerV2.Utils.FieldValueProcessor.getPrimaryKeyFieldByApp(this.selectedLedger);
                const primaryKeyValue = this.formData[primaryKeyField];
                nextBtn.disabled = !primaryKeyValue || !primaryKeyValue.trim();
                nextBtn.textContent = '次へ';
            } else if (this.currentStep === 3) {
                nextBtn.disabled = false;
                nextBtn.textContent = '確認';
            } else if (this.currentStep === 4) {
                nextBtn.disabled = false;
                nextBtn.textContent = '追加実行';
            }
        }

        /**
         * 前のステップに戻る
         */
        _previousStep() {
            if (this.currentStep > 1) {
                this.currentStep--;
                this._renderCurrentStep();
            }
        }

        /**
         * 次のステップに進む
         */
        _nextStep() {
            if (this.currentStep < 4) {
                this.currentStep++;
                this._renderCurrentStep();
            } else {
                this._executeAdd();
            }
        }

        /**
         * 現在のステップを描画
         */
        _renderCurrentStep() {
            switch (this.currentStep) {
                case 1: this._renderStep1(); break;
                case 2: this._renderStep2(); break;
                case 3: this._renderStep3(); break;
                case 4: this._renderStep4(); break;
            }
        }

        /**
         * レコード追加を実行
         */
        async _executeAdd() {
            try {
                const nextBtn = this.modal.querySelector('#next-step');
                nextBtn.disabled = true;
                nextBtn.textContent = '追加中...';

                // データ準備
                const primaryKeyField = window.LedgerV2.Utils.FieldValueProcessor.getPrimaryKeyFieldByApp(this.selectedLedger);
                const appId = window.LedgerV2.Config.APP_IDS[this.selectedLedger];

                // kintone API呼び出し用データ作成（updateKeyフィールドは除外）
                const recordData = {};
                Object.entries(this.formData).forEach(([field, value]) => {
                    // updateKeyで指定するフィールドは除外
                    if (value && value.trim() && field !== primaryKeyField) {
                        recordData[field] = { value: value.trim() };
                    }
                });

                const requestBody = {
                    app: appId,
                    upsert: true,
                    records: [{
                        updateKey: {
                            field: primaryKeyField,
                            value: this.formData[primaryKeyField]
                        },
                        record: recordData
                    }]
                };

                console.log('🆕 新規レコード追加リクエスト:', requestBody);

                // API呼び出し
                const response = await kintone.api(kintone.api.url('/k/v1/records.json', true), 'PUT', requestBody);
                console.log('✅ 新規レコード追加成功:', response);

                // 成功メッセージ
                this._showSuccessMessage();
                
                // テーブル更新（必要に応じて）
                if (window.HeaderButtonManager && typeof window.HeaderButtonManager.executeSearch === 'function') {
                    setTimeout(() => {
                        window.HeaderButtonManager.executeSearch();
                    }, 1500);
                }

            } catch (error) {
                console.error('❌ 新規レコード追加エラー:', error);
                this._showErrorMessage(error);
            }
        }

        /**
         * 成功メッセージを表示
         */
        _showSuccessMessage() {
            const content = this.modal.querySelector('.add-record-content');
            content.innerHTML = `
                <div class="step-content success">
                    <div class="success-icon">✅</div>
                    <h3>新規レコードが追加されました</h3>
                    <p>${this._getLedgerDisplayName(this.selectedLedger)}に新しいレコードが正常に追加されました。</p>
                    <div class="success-actions">
                        <button type="button" class="btn-primary" onclick="location.reload()">画面を更新</button>
                        <button type="button" class="btn-secondary" id="close-modal">閉じる</button>
                    </div>
                </div>
            `;

            // 閉じるボタン
            content.querySelector('#close-modal').addEventListener('click', () => this.close());

            // フッターボタンを非表示
            this.modal.querySelector('.add-record-footer').style.display = 'none';
        }

        /**
         * エラーメッセージを表示
         */
        _showErrorMessage(error) {
            const content = this.modal.querySelector('.add-record-content');
            content.innerHTML = `
                <div class="step-content error">
                    <div class="error-icon">❌</div>
                    <h3>エラーが発生しました</h3>
                    <p>新規レコードの追加中にエラーが発生しました。</p>
                    <div class="error-details">
                        <code>${error.message || error}</code>
                    </div>
                    <div class="error-actions">
                        <button type="button" class="btn-secondary" id="retry-add">もう一度試す</button>
                        <button type="button" class="btn-secondary" id="close-modal">閉じる</button>
                    </div>
                </div>
            `;

            // アクションボタン
            content.querySelector('#retry-add').addEventListener('click', () => this._renderStep4());
            content.querySelector('#close-modal').addEventListener('click', () => this.close());
        }
    }

    // =============================================================================
    // グローバルエクスポート
    // =============================================================================

    // LedgerV2名前空間にエクスポート
    if (!window.LedgerV2) window.LedgerV2 = {};
    if (!window.LedgerV2.Modal) window.LedgerV2.Modal = {};
    window.LedgerV2.Modal.AddRecordModal = AddRecordModal;

    // レガシー互換性のためグローバルに割り当て
    window.AddRecordModal = AddRecordModal;

    console.log('🆕 modal-add-record.js 読み込み完了');

})(); 