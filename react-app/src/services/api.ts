// =============================================================================
// 🚀 統合台帳システム v3.0 - API管理サービス
// =============================================================================

import type { KintoneRecord, APIResponse, LedgerType } from '../types';
import { appConfig, appNameMapping } from '../config';

// kintone API関数の型定義
declare global {
  interface Window {
    kintone: {
      api: (
        pathOrUrl: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        params: Record<string, any>
      ) => Promise<any>;
    };
  }
}

export class APIManager {
  /**
   * 500件以上のレコードを取得
   */
  static async fetchAllRecords(
    appId: number,
    query: string = '',
    contextInfo: string = ''
  ): Promise<KintoneRecord[]> {
    const allRecords: KintoneRecord[] = [];
    const limit = 500;
    let offset = 0;
    let finished = false;
    let apiCallCount = 0;

    const appName = this.getAppNameById(appId);
    const logPrefix = `🔍 ${appName}${contextInfo ? ` (${contextInfo})` : ''}`;

    while (!finished) {
      const queryWithPagination = query 
        ? `${query} limit ${limit} offset ${offset}`
        : `limit ${limit} offset ${offset}`;

      try {
        apiCallCount++;
        console.log(`${logPrefix}: API呼び出し${apiCallCount}回目 - offset: ${offset}`);

        const response = await window.kintone.api('/k/v1/records', 'GET', {
          app: appId,
          query: queryWithPagination,
          totalCount: true
        });

        allRecords.push(...response.records);
        const afterCount = allRecords.length;

        console.log(`${logPrefix}: ${response.records.length}件取得 (累計: ${afterCount}件)`);

        // 総件数が分かる場合は、それを基準に終了判定
        if (response.totalCount && afterCount >= response.totalCount) {
          finished = true;
        } else if (response.records.length < limit) {
          finished = true;
        } else {
          offset += limit;
        }

      } catch (error) {
        console.error(`❌ ${logPrefix}: API呼び出し${apiCallCount}回目でエラー:`, error);
        console.error(`❌ 失敗クエリ: "${queryWithPagination}"`);
        throw error;
      }
    }

    console.log(`✅ ${logPrefix}: 取得完了 - 総件数: ${allRecords.length}件 (API呼び出し: ${apiCallCount}回)`);
    return allRecords;
  }

  /**
   * レコードを更新
   */
  static async updateRecord(
    appId: number,
    recordId: string,
    record: Partial<KintoneRecord>
  ): Promise<void> {
    try {
      await window.kintone.api('/k/v1/record', 'PUT', {
        app: appId,
        id: recordId,
        record
      });
    } catch (error) {
      console.error('❌ レコード更新エラー:', error);
      throw error;
    }
  }

  /**
   * バッチ更新
   */
  static async bulkUpdate(
    appId: number,
    records: Array<{ id: string; record: Partial<KintoneRecord> }>
  ): Promise<void> {
    try {
      await window.kintone.api('/k/v1/records', 'PUT', {
        app: appId,
        records
      });
    } catch (error) {
      console.error('❌ バッチ更新エラー:', error);
      throw error;
    }
  }

  /**
   * レコード追加
   */
  static async createRecord(
    appId: number,
    record: Partial<KintoneRecord>
  ): Promise<{ id: string; revision: string }> {
    try {
      const response = await window.kintone.api('/k/v1/record', 'POST', {
        app: appId,
        record
      });
      return response;
    } catch (error) {
      console.error('❌ レコード作成エラー:', error);
      throw error;
    }
  }

  /**
   * アプリIDからアプリ名を取得
   */
  private static getAppNameById(appId: number): string {
    return appNameMapping[appId] || `アプリ${appId}`;
  }

  /**
   * バッチサイズを動的計算
   */
  static calculateOptimalBatchSize(keys: string[], fieldName: string): number {
    if (keys.length === 0) return 100;

    const avgKeyLength = keys.slice(0, 10).reduce((sum, key) => sum + String(key).length, 0) / Math.min(10, keys.length);
    const baseQueryLength = fieldName.length + 20; // " in ()" の余裕を追加
    const perKeyLength = avgKeyLength + 4; // クォート2文字 + カンマ + スペース
    const maxQueryLength = 7000; // 余裕を持たせて7KB
    const availableLength = maxQueryLength - baseQueryLength;
    const maxBatchSize = Math.floor(availableLength / perKeyLength);
    
    const calculatedSize = Math.max(10, Math.min(500, maxBatchSize));
    return calculatedSize;
  }
}

// React Query用のクエリ関数
export const queryFunctions = {
  fetchAllRecords: (appId: number, query?: string) => 
    APIManager.fetchAllRecords(appId, query),
  
  fetchRecordsByIds: (appId: number, recordIds: string[]) => {
    const query = `$id in (${recordIds.map(id => `"${id}"`).join(',')})`;
    return APIManager.fetchAllRecords(appId, query);
  },
  
  fetchRecordsByField: (appId: number, fieldName: string, values: string[]) => {
    const query = `${fieldName} in (${values.map(v => `"${v}"`).join(',')})`;
    return APIManager.fetchAllRecords(appId, query);
  }
};

// React Query用のキー生成関数
export const queryKeys = {
  allRecords: (appId: number, query?: string) => ['records', appId, query],
  recordsByIds: (appId: number, recordIds: string[]) => ['records', appId, 'ids', recordIds],
  recordsByField: (appId: number, fieldName: string, values: string[]) => 
    ['records', appId, 'field', fieldName, values]
}; 