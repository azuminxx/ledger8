// =============================================================================
// 🚀 統合台帳システム v3.0 - 検索パネル
// =============================================================================

import React, { useState, useCallback } from 'react';
import { fieldsConfig } from '../../config';
import type { FieldConfig, SearchConditions } from '../../types';

interface SearchPanelProps {
  onSearch: (conditions: SearchConditions) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  onClear,
  isLoading = false
}) => {
  const [conditions, setConditions] = useState<SearchConditions>({});
  const [selectedLedger, setSelectedLedger] = useState<string>('all');

  // 検索対象のフィールドを取得（隠しフィールドを除外）
  const searchableFields = fieldsConfig.filter(field => 
    !field.isHiddenFromUser && 
    !field.isRowNumber && 
    !field.isModificationCheckbox &&
    !field.isLedgerInconsistency
  );

  // 条件変更ハンドラー
  const handleConditionChange = useCallback((fieldCode: string, value: string) => {
    setConditions(prev => ({
      ...prev,
      [fieldCode]: value
    }));
  }, []);

  // 検索実行ハンドラー
  const handleSearch = useCallback(() => {
    // 空の条件を除去
    const filteredConditions = Object.entries(conditions).reduce((acc, [key, value]) => {
      if (value && value.trim()) {
        acc[key] = value.trim();
      }
      return acc;
    }, {} as SearchConditions);

    onSearch(filteredConditions);
  }, [conditions, onSearch]);

  // クリアハンドラー
  const handleClear = useCallback(() => {
    setConditions({});
    setSelectedLedger('all');
    onClear();
  }, [onClear]);

  // 検索フィールドを台帳別にグループ化
  const groupedFields = searchableFields.reduce((acc, field) => {
    const category = field.category || '共通';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {} as Record<string, FieldConfig[]>);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          🔍 検索・フィルタ
        </h2>
        <div className="flex items-center space-x-2">
          <select
            value={selectedLedger}
            onChange={(e) => setSelectedLedger(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全台帳</option>
            <option value="PC">PC台帳</option>
            <option value="USER">ユーザー台帳</option>
            <option value="SEAT">座席台帳</option>
            <option value="EXT">内線台帳</option>
          </select>
        </div>
      </div>

      {/* 検索フィールド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {Object.entries(groupedFields).map(([category, fields]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
              {category}
            </h3>
            {fields.map((field) => (
              <SearchField
                key={field.fieldCode}
                field={field}
                value={conditions[field.fieldCode] || ''}
                onChange={(value) => handleConditionChange(field.fieldCode, value)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {Object.keys(conditions).filter(key => conditions[key]).length}件の検索条件
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            クリア
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? '検索中...' : '検索実行'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 個別検索フィールドコンポーネント
interface SearchFieldProps {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}

const SearchField: React.FC<SearchFieldProps> = ({ field, value, onChange }) => {
  const renderInput = () => {
    switch (field.filterType) {
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${field.label}で検索...`}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {field.label}
      </label>
      {renderInput()}
    </div>
  );
}; 