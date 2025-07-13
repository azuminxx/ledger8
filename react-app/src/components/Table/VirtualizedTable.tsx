// =============================================================================
// 🚀 統合台帳システム v3.0 - Virtual Scrollingテーブル
// =============================================================================

import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import type { LedgerRecord, FieldConfig } from '../../types';
import { fieldsConfig } from '../../config';

interface VirtualizedTableProps {
  data: LedgerRecord[];
  onCellEdit?: (recordId: string, fieldCode: string, value: string) => void;
  onRowSelect?: (recordId: string, selected: boolean) => void;
  selectedRows?: Set<string>;
  loading?: boolean;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  onCellEdit,
  onRowSelect,
  selectedRows = new Set(),
  loading = false
}) => {
  // 表示するフィールドをフィルタリング
  const visibleFields = useMemo(() => {
    return fieldsConfig.filter(field => !field.isHiddenFromUser);
  }, []);

  // ヘッダーコンポーネント
  const HeaderComponent = () => (
    <tr className="bg-gray-100 border-b-2 border-gray-300">
      {visibleFields.map((field) => (
        <th
          key={field.fieldCode}
          className="px-2 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300"
          style={{ width: field.width, minWidth: field.width }}
        >
          {field.label}
        </th>
      ))}
    </tr>
  );

  // 行コンポーネント
  const RowComponent = ({ index, ...props }: any) => {
    const record = data[index];
    if (!record) return null;

    return (
      <tr
        {...props}
        className={`border-b border-gray-200 hover:bg-gray-50 ${
          selectedRows.has(record.integrationKey) ? 'bg-blue-50' : ''
        }`}
      >
        {visibleFields.map((field) => (
          <TableCell
            key={field.fieldCode}
            record={record}
            field={field}
            onEdit={onCellEdit}
            onRowSelect={onRowSelect}
            isSelected={selectedRows.has(record.integrationKey)}
          />
        ))}
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">データを読み込み中...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">データがありません</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden">
      <TableVirtuoso
        data={data}
        totalCount={data.length}
        fixedHeaderContent={HeaderComponent}
        itemContent={RowComponent}
        style={{ height: '600px' }}
        components={{
          Table: ({ style, ...props }) => (
            <table
              {...props}
              style={{
                ...style,
                borderCollapse: 'collapse',
                width: '100%'
              }}
            />
          ),
          TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
            <thead {...props} ref={ref} />
          )),
          TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
            <tbody {...props} ref={ref} />
          ))
        }}
      />
    </div>
  );
};

// テーブルセルコンポーネント
interface TableCellProps {
  record: LedgerRecord;
  field: FieldConfig;
  onEdit?: (recordId: string, fieldCode: string, value: string) => void;
  onRowSelect?: (recordId: string, selected: boolean) => void;
  isSelected: boolean;
}

const TableCell: React.FC<TableCellProps> = ({
  record,
  field,
  onEdit,
  onRowSelect,
  isSelected
}) => {
  // フィールド値を取得
  const getValue = (): string => {
    // 統合レコードから値を取得
    for (const [ledgerType, ledgerData] of Object.entries(record.ledgerData)) {
      if (ledgerData && ledgerData[field.fieldCode]) {
        return ledgerData[field.fieldCode].value || '';
      }
    }
    return '';
  };

  const value = getValue();

  // セルタイプ別の表示
  const renderCell = () => {
    switch (field.cellType) {
      case 'row_number':
        return <span className="text-gray-600">#{record.integrationKey}</span>;
      
      case 'modification_checkbox':
        return (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onRowSelect?.(record.integrationKey, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        );
      
      case 'ledger_inconsistency':
        return (
          <span className="text-red-600 text-xs">
            {/* 不整合検出ロジックは後で実装 */}
            ⚠️
          </span>
        );
      
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onEdit?.(record.integrationKey, field.fieldCode, e.target.value)}
            className="w-full px-1 py-1 text-xs border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'input':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onEdit?.(record.integrationKey, field.fieldCode, e.target.value)}
            className="w-full px-1 py-1 text-xs border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        );
      
      case 'link':
        return (
          <a
            href={`/k/${record.recordIds[field.sourceApp || '']}/show#record=${record.recordIds[field.sourceApp || '']}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline text-xs"
          >
            {value}
          </a>
        );
      
      default:
        return <span className="text-xs">{value}</span>;
    }
  };

  return (
    <td
      className="px-2 py-1 border-r border-gray-200 text-xs"
      style={{ width: field.width, minWidth: field.width }}
    >
      {renderCell()}
    </td>
  );
}; 