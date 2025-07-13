// =============================================================================
// 🚀 統合台帳システム v3.0 - メインアプリケーション
// =============================================================================

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { VirtualizedTable } from './components/Table/VirtualizedTable';
import { SearchPanel } from './components/Search/SearchPanel';
import { dataIntegrationQueries, dataIntegrationKeys } from './services/dataIntegration';
import { SearchManager } from './services/search';
import type { LedgerRecord, SearchConditions } from './types';

// React Queryクライアント
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      gcTime: 10 * 60 * 1000, // 10分
    },
  },
});

// メインアプリケーション
const LedgerApp: React.FC = () => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [searchConditions, setSearchConditions] = useState<SearchConditions>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 全台帳統合データを取得
  const { data: integrationResult, isLoading, error } = useQuery({
    queryKey: dataIntegrationKeys.allLedgerData(searchQuery),
    queryFn: () => dataIntegrationQueries.fetchAllLedgerData(searchQuery),
    enabled: typeof window !== 'undefined' && !!window.kintone,
  });

  const ledgerRecords: LedgerRecord[] = integrationResult?.integratedRecords || [];

  // 行選択ハンドラー
  const handleRowSelect = (recordId: string, selected: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (selected) {
      newSelectedRows.add(recordId);
    } else {
      newSelectedRows.delete(recordId);
    }
    setSelectedRows(newSelectedRows);
  };

  // セル編集ハンドラー
  const handleCellEdit = (recordId: string, fieldCode: string, value: string) => {
    console.log('セル編集:', { recordId, fieldCode, value });
    // TODO: 実際の更新処理を実装
  };

  // 検索実行ハンドラー
  const handleSearch = (conditions: SearchConditions) => {
    setSearchConditions(conditions);
    const query = SearchManager.buildQuery(conditions);
    setSearchQuery(query);
    console.log('検索実行:', { conditions, query });
  };

  // 検索クリアハンドラー
  const handleSearchClear = () => {
    setSearchConditions({});
    setSearchQuery('');
    setSelectedRows(new Set());
  };

  if (typeof window !== 'undefined' && !window.kintone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            🚀 統合台帳システム v3.0
          </h1>
          <p className="text-gray-600 mb-4">
            このアプリケーションはkintone環境で動作します。
          </p>
          <div className="text-sm text-gray-500">
            <p>テスト用に開発サーバーで起動しています。</p>
            <p>実際の使用時はkintone環境にデプロイしてください。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">
              🚀 統合台帳システム v3.0
            </h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                                  <div className="text-sm text-gray-600">
                    {searchQuery ? `クエリ: ${searchQuery}` : '検索条件なし'}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  高度な検索は下記のパネルをご利用ください
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索パネル */}
        <SearchPanel
          onSearch={handleSearch}
          onClear={handleSearchClear}
          isLoading={isLoading}
        />

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  統合台帳データ
                </h2>
                <p className="text-sm text-gray-600">
                  4つの台帳（座席・PC・内線・ユーザー）を統合表示
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {ledgerRecords.length}件のレコード
                </p>
                {selectedRows.size > 0 && (
                  <p className="text-sm text-blue-600">
                    {selectedRows.size}件選択中
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {error ? (
              <div className="text-red-600 text-center py-8">
                <div className="mb-2">エラーが発生しました</div>
                <div className="text-sm">{error.message}</div>
              </div>
            ) : (
              <VirtualizedTable
                data={ledgerRecords}
                onCellEdit={handleCellEdit}
                onRowSelect={handleRowSelect}
                selectedRows={selectedRows}
                loading={isLoading}
              />
            )}
          </div>
        </div>

        {/* 統計情報 */}
        {ledgerRecords.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              統合統計
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {ledgerRecords.filter(r => r.ledgerData.PC).length}
                </div>
                <div className="text-sm text-gray-600">PC台帳</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {ledgerRecords.filter(r => r.ledgerData.USER).length}
                </div>
                <div className="text-sm text-gray-600">ユーザー台帳</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {ledgerRecords.filter(r => r.ledgerData.SEAT).length}
                </div>
                <div className="text-sm text-gray-600">座席台帳</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {ledgerRecords.filter(r => r.ledgerData.EXT).length}
                </div>
                <div className="text-sm text-gray-600">内線台帳</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// アプリケーションのルートコンポーネント
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LedgerApp />
    </QueryClientProvider>
  );
};

export default App;
