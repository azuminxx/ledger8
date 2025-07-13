// =============================================================================
// 🏢 統合台帳システム v3.0 - TypeScript型定義
// =============================================================================

// kintone関連の型定義
export interface KintoneFieldValue {
  type: string;
  value: any;
}

export interface KintoneRecord {
  $id: KintoneFieldValue;
  $revision: KintoneFieldValue;
  [fieldCode: string]: KintoneFieldValue;
}

// アプリケーション設定
export interface AppConfig {
  APP_IDS: {
    SEAT: number;
    PC: number;
    EXT: number;
    USER: number;
    HISTORY: number;
  };
  APP_URL_MAPPINGS: Record<string, string>;
}

// フィールド設定
export interface FieldConfig {
  fieldCode: string;
  label: string;
  width: string;
  cellType: 'text' | 'input' | 'dropdown' | 'row_number' | 'modification_checkbox' | 'ledger_inconsistency' | 'link';
  updateMode: 'static' | 'dynamic';
  category: string;
  filterType: 'text' | 'dropdown';
  searchOperator: '=' | 'like' | 'in';
  searchValueFormatter: 'exact' | 'prefix' | 'list';
  editableFrom: 'all' | 'static';
  sourceApp?: string;
  isPrimaryKey?: boolean;
  isRecordId?: boolean;
  isHiddenFromUser?: boolean;
  isRowNumber?: boolean;
  isModificationCheckbox?: boolean;
  isLedgerInconsistency?: boolean;
  allowCellDragDrop?: boolean;
  showInModalPreview?: boolean;
  options?: Array<{ value: string; label: string }>;
}

// 統合レコード
export interface LedgerRecord {
  integrationKey: string;
  ledgerData: Record<string, KintoneRecord>;
  recordIds: Record<string, string>;
}

// 検索条件
export interface SearchConditions {
  [fieldCode: string]: string;
}

// API関連
export interface APIResponse<T> {
  records: T[];
  totalCount?: number;
}

// 台帳タイプ
export type LedgerType = 'SEAT' | 'PC' | 'EXT' | 'USER' | 'HISTORY';

// 統合データ結果
export interface IntegrationResult {
  integratedRecords: LedgerRecord[];
  targetAppId: number | null;
}

// 不整合情報
export interface InconsistencyInfo {
  hasInconsistency: boolean;
  inconsistentFields: Record<string, string[]>;
  details: string[];
}

// ページング情報
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  recordsPerPage: number;
} 