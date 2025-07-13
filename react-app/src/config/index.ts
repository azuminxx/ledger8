// =============================================================================
// 🏢 統合台帳システム v3.0 - 設定ファイル（TypeScript版）
// =============================================================================

import type { AppConfig, FieldConfig } from '../types';

// アプリケーション設定
export const appConfig: AppConfig = {
  APP_IDS: {
    SEAT: 8,       // 座席台帳アプリ
    PC: 6,         // PC台帳アプリ
    EXT: 7,        // 内線台帳アプリ
    USER: 13,      // ユーザー台帳アプリ
    HISTORY: 14    // 更新履歴台帳アプリ
  },
  APP_URL_MAPPINGS: {
    'seat_record_id': `/k/8/`,
    'pc_record_id': `/k/6/`,
    'ext_record_id': `/k/7/`,
    'user_record_id': `/k/13/`,
    'history_record_id': `/k/14/`
  }
};

// フィールド設定
export const fieldsConfig: FieldConfig[] = [
  // 行番号
  {
    fieldCode: '_row_number',
    label: '🔢',
    width: '20px',
    cellType: 'row_number',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    isRowNumber: true,
    showInModalPreview: false
  },

  // 変更チェックボックス
  {
    fieldCode: '_modification_checkbox',
    label: '✅',
    width: '20px',
    cellType: 'modification_checkbox',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    isModificationCheckbox: true,
    showInModalPreview: false
  },

  // 台帳不整合表示
  {
    fieldCode: '_ledger_inconsistency',
    label: '⚠️',
    width: '20px',
    cellType: 'ledger_inconsistency',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    isLedgerInconsistency: true,
    showInModalPreview: false
  },

  // PC台帳フィールド
  {
    fieldCode: 'pc_record_id',
    label: '💻 PC-ID',
    width: '0px',
    cellType: 'text',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: '=',
    searchValueFormatter: 'exact',
    editableFrom: 'static',
    isRecordId: true,
    sourceApp: 'PC',
    showInModalPreview: false,
    isHiddenFromUser: true
  },
  {
    fieldCode: 'PC番号',
    label: '💻 PC番号',
    width: '150px',
    cellType: 'text',
    updateMode: 'static',
    category: 'PC台帳',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    sourceApp: 'PC',
    isPrimaryKey: true,
    allowCellDragDrop: true,
    showInModalPreview: true
  },
  {
    fieldCode: 'PC用途',
    label: '🎯 PC用途',
    width: '100px',
    cellType: 'dropdown',
    updateMode: 'dynamic',
    category: 'PC台帳',
    options: [
      { value: '個人専用', label: '個人専用' },
      { value: 'CO/TOブース', label: 'CO/TOブース' },
      { value: 'RPA用', label: 'RPA用' },
      { value: '拠点設備用', label: '拠点設備用' },
      { value: '会議用', label: '会議用' },
      { value: '在庫', label: '在庫' }
    ],
    filterType: 'dropdown',
    searchOperator: 'in',
    searchValueFormatter: 'list',
    editableFrom: 'all',
    sourceApp: 'PC',
    showInModalPreview: true
  },

  // ユーザー台帳フィールド
  {
    fieldCode: 'user_record_id',
    label: '👤 ユーザー-ID',
    width: '0px',
    cellType: 'text',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: '=',
    searchValueFormatter: 'exact',
    editableFrom: 'static',
    isRecordId: true,
    sourceApp: 'USER',
    showInModalPreview: false,
    isHiddenFromUser: true
  },
  {
    fieldCode: 'ユーザーID',
    label: '👤 ユーザーID',
    width: '120px',
    cellType: 'text',
    updateMode: 'static',
    category: 'ユーザー台帳',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    sourceApp: 'USER',
    isPrimaryKey: true,
    allowCellDragDrop: true,
    showInModalPreview: true
  },

  // 座席台帳フィールド
  {
    fieldCode: 'seat_record_id',
    label: '🪑 座席-ID',
    width: '0px',
    cellType: 'text',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: '=',
    searchValueFormatter: 'exact',
    editableFrom: 'static',
    isRecordId: true,
    sourceApp: 'SEAT',
    showInModalPreview: false,
    isHiddenFromUser: true
  },
  {
    fieldCode: '座席番号',
    label: '🪑 座席番号',
    width: '120px',
    cellType: 'text',
    updateMode: 'static',
    category: '座席台帳',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    sourceApp: 'SEAT',
    isPrimaryKey: true,
    allowCellDragDrop: true,
    showInModalPreview: true
  },

  // 内線台帳フィールド
  {
    fieldCode: 'ext_record_id',
    label: '📞 内線-ID',
    width: '0px',
    cellType: 'text',
    updateMode: 'static',
    category: '共通',
    filterType: 'text',
    searchOperator: '=',
    searchValueFormatter: 'exact',
    editableFrom: 'static',
    isRecordId: true,
    sourceApp: 'EXT',
    showInModalPreview: false,
    isHiddenFromUser: true
  },
  {
    fieldCode: '内線番号',
    label: '📞 内線番号',
    width: '100px',
    cellType: 'text',
    updateMode: 'static',
    category: '内線台帳',
    filterType: 'text',
    searchOperator: 'like',
    searchValueFormatter: 'prefix',
    editableFrom: 'static',
    sourceApp: 'EXT',
    isPrimaryKey: true,
    allowCellDragDrop: true,
    showInModalPreview: true
  }
];

// 主キーフィールドマッピング
export const primaryKeyMapping: Record<string, string> = {
  'PC': 'PC番号',
  'USER': 'ユーザーID',
  'SEAT': '座席番号',
  'EXT': '内線番号'
};

// アプリ名マッピング
export const appNameMapping: Record<number, string> = {
  8: '座席台帳',
  6: 'PC台帳',
  7: '内線台帳',
  13: 'ユーザー台帳',
  14: '更新履歴台帳'
}; 