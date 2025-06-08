/**
 * 🛠️ 統合台帳システム v2 - ユーティリティ
 * @description シンプル化された共通ユーティリティ機能
 * @version 2.0.0
 */
(function() {
    'use strict';

    // グローバル名前空間確保
    window.LedgerV2 = window.LedgerV2 || {};
    window.LedgerV2.Utils = {};

    // =============================================================================
    // 🎯 編集モード管理（パフォーマンス改善用）
    // =============================================================================

    class EditModeManager {
        constructor() {
            this.isEditMode = false;
            this.enabledRows = new Set();
            this.isInitialLoad = true;
        }

        enableEditMode() {
            this.isEditMode = true;
            this.isInitialLoad = false;
            console.log('🎯 編集モード有効化');
        }

        disableEditMode() {
            this.isEditMode = false;
            this.enabledRows.clear();
            console.log('🎯 編集モード無効化');
        }

        enableRowEditing(rowId) {
            this.enabledRows.add(rowId);
        }

        disableRowEditing(rowId) {
            this.enabledRows.delete(rowId);
        }

        isRowEditable(rowId) {
            return this.isEditMode && this.enabledRows.has(rowId);
        }

        isLightweightMode() {
            return !this.isEditMode && this.isInitialLoad;
        }
    }

    // =============================================================================
    // 🎨 スタイル管理
    // =============================================================================

    class StyleManager {
        static applyCellStyles(cell, width) {
            // 基本のtable-cellクラスを追加
            cell.classList.add('table-cell');
            
            // 📏 セル幅もconfig.jsのwidth値を直接参照（ヘッダーと統一）
            if (width) {
                cell.style.width = width;
            }
        }

        static applyInputStyles(input, width) {
            if (input.tagName.toLowerCase() === 'select') {
                input.classList.add('table-select');
            } else {
                input.classList.add('table-input');
            }
        }

        static highlightModifiedCell(cell) {
            cell.style.backgroundColor = window.LedgerV2.Config.UI_SETTINGS.HIGHLIGHT_COLOR;
            cell.classList.add('cell-modified');
        }

        static highlightModifiedRow(row) {
            row.style.backgroundColor = window.LedgerV2.Config.UI_SETTINGS.HIGHLIGHT_COLOR;
            row.classList.add('row-modified');
        }

        static removeHighlight(element) {
            element.style.backgroundColor = '';
            element.classList.remove('cell-modified', 'row-modified');
        }
    }

    // =============================================================================
    // 🏗️ DOM操作ヘルパー
    // =============================================================================

    class DOMHelper {
        static getTableBody() {
            return document.querySelector('#my-tbody');
        }

        static getHeaderRow() {
            return document.querySelector('#my-filter-row');
        }

        static findCellInRow(row, fieldCode) {
            return row.querySelector(`[data-field-code="${fieldCode}"]`);
        }

        static getFieldOrderFromHeader() {
            const headerRow = this.getHeaderRow();
            if (!headerRow) return [];
            
            // inputとselectの両方を取得
            const filterElements = headerRow.querySelectorAll('input[data-field-code], select[data-field-code]');
            const fieldOrder = Array.from(filterElements).map(element => element.getAttribute('data-field-code')).filter(Boolean);
            
            console.log(`🔍 ヘッダーから取得したフィールド順序 (${fieldOrder.length}件):`, fieldOrder);
            return fieldOrder;
        }

        static getAllRowsInTable() {
            const tbody = this.getTableBody();
            return tbody ? Array.from(tbody.querySelectorAll('tr[data-row-id]')) : [];
        }
    }

    // =============================================================================
    // 📝 セル値操作ヘルパー
    // =============================================================================

    class CellValueHelper {
        static getValue(cell, field = null) {
            if (!cell) return '';

            const input = cell.querySelector('input, select');
            if (input) {
                return input.value || '';
            }

            const link = cell.querySelector('a');
            if (link) {
                return link.textContent || '';
            }

            return cell.textContent || '';
        }

        static setValue(cell, value, field = null) {
            if (!cell) return false;

            const input = cell.querySelector('input, select');
            if (input) {
                input.value = value;
                return true;
            }

            cell.textContent = value;
            return true;
        }

        static isEditable(cell) {
            return cell.querySelector('input, select') !== null;
        }
    }

    // =============================================================================
    // 🔑 統合キー管理
    // =============================================================================

    class IntegrationKeyHelper {
        static generateFromRow(row) {
            const primaryKeys = [];
            
            // 各アプリの主キーを収集
            const apps = ['SEAT', 'PC', 'EXT', 'USER'];
            apps.forEach(app => {
                const fieldCode = this.getPrimaryFieldForApp(app);
                const cell = DOMHelper.findCellInRow(row, fieldCode);
                if (cell) {
                    const value = CellValueHelper.getValue(cell);
                    if (value && value.trim()) {
                        primaryKeys.push(`${app}:${value}`);
                    }
                }
            });

            return primaryKeys.length > 0 ? primaryKeys.join('|') : null;
        }

        static getPrimaryFieldForApp(appType) {
            const mappings = {
                'SEAT': '座席番号',
                'PC': 'PC番号',
                'EXT': '内線番号',
                'USER': 'ユーザーID'
            };
            return mappings[appType];
        }

        static extractAppAndValueFromKey(integrationKey) {
            const parts = integrationKey.split('|');
            const result = {};
            
            parts.forEach(part => {
                const [app, value] = part.split(':');
                if (app && value) {
                    result[app] = value;
                }
            });
            
            return result;
        }
    }

    // =============================================================================
    // 💼 ローディング管理
    // =============================================================================

    class LoadingManager {
        static show(message = 'データを読み込み中...') {
            let loader = document.getElementById('loading-overlay');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'loading-overlay';
                loader.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    color: white;
                    font-size: 16px;
                `;
                document.body.appendChild(loader);
            }
            loader.textContent = message;
            loader.style.display = 'flex';
        }

        static hide() {
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.style.display = 'none';
            }
        }

        static updateMessage(message) {
            const loader = document.getElementById('loading-overlay');
            if (loader) {
                loader.textContent = message;
            }
        }
    }

    // =============================================================================
    // 🎯 フィールド値処理
    // =============================================================================

    class FieldValueProcessor {
        static process(record, fieldCode, defaultValue = '') {
            if (!record || !fieldCode) return defaultValue;

            // レコードIDフィールドの処理
            if (fieldCode.endsWith('_record_id')) {
                const appTypeMap = {
                    'seat_record_id': 'SEAT',
                    'pc_record_id': 'PC',
                    'ext_record_id': 'EXT',
                    'user_record_id': 'USER'
                };
                
                const appType = appTypeMap[fieldCode];
                if (appType && record.recordIds && record.recordIds[appType]) {
                    return record.recordIds[appType];
                }
                return defaultValue;
            }

            // 統合レコードの場合
            if (record.ledgerData) {
                for (const appType of Object.keys(record.ledgerData)) {
                    const appData = record.ledgerData[appType];
                    if (appData && appData[fieldCode] && appData[fieldCode].value !== undefined) {
                        return appData[fieldCode].value;
                    }
                }
            }

            // 直接値の場合
            if (record[fieldCode] !== undefined) {
                return record[fieldCode];
            }

            return defaultValue;
        }

        static getSourceApp(fieldCode) {
            const field = window.fieldsConfig.find(f => f.fieldCode === fieldCode);
            return field ? field.sourceApp : null;
        }
    }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    // クラスをグローバルスコープに公開
    window.LedgerV2.Utils = {
        EditModeManager,
        StyleManager,
        DOMHelper,
        CellValueHelper,
        IntegrationKeyHelper,
        LoadingManager,
        FieldValueProcessor
    };

    // レガシー互換性のため主要クラスを直接公開
    window.EditModeManager = EditModeManager;
    window.StyleManager = StyleManager;
    window.DOMHelper = DOMHelper;
    window.CellValueHelper = CellValueHelper;
    window.IntegrationKeyHelper = IntegrationKeyHelper;
    window.LoadingManager = LoadingManager;
    window.FieldValueProcessor = FieldValueProcessor;

    // グローバルインスタンス作成
    window.TableEditMode = new EditModeManager();

    console.log('✅ LedgerV2 ユーティリティシステム初期化完了');

})();
