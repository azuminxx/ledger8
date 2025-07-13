// =============================================================================
// 🚀 統合台帳システム v3.0 - データ統合管理サービス
// =============================================================================

import type { KintoneRecord, LedgerRecord, LedgerType, IntegrationResult } from '../types';
import { APIManager } from './api';
import { appConfig, primaryKeyMapping } from '../config';

export class DataIntegrationManager {
  private appIds: Record<string, number>;
  private rawLedgerData: Map<string, Map<string, KintoneRecord>>;
  private firstStageExecutedApps?: Set<string>;

  constructor() {
    // HISTORY台帳を除外したアプリIDリストを作成
    this.appIds = {};
    Object.entries(appConfig.APP_IDS).forEach(([appType, appId]) => {
      if (appType !== 'HISTORY') {
        this.appIds[appType] = appId;
      }
    });
    
    // 各台帳の生データを保管するMap
    this.rawLedgerData = new Map();
    this.initializeRawDataMaps();
  }

  /**
   * 各台帳の生データMapを初期化
   */
  private initializeRawDataMaps(): void {
    const ledgerTypes: LedgerType[] = ['PC', 'USER', 'SEAT', 'EXT'];
    ledgerTypes.forEach(ledgerType => {
      this.rawLedgerData.set(ledgerType, new Map());
    });
  }

  /**
   * 生データを保存
   */
  saveRawData(ledgerType: LedgerType, primaryKeyValue: string, rawRecord: KintoneRecord): void {
    try {
      if (!ledgerType || !primaryKeyValue || !rawRecord) {
        return;
      }

      const ledgerMap = this.rawLedgerData.get(ledgerType);
      if (!ledgerMap) {
        return;
      }

      // 生データを保存（保存時刻も記録）
      const dataWithTimestamp = {
        ...rawRecord,
        _savedAt: { type: 'DATETIME', value: new Date().toISOString() }
      };

      ledgerMap.set(primaryKeyValue, dataWithTimestamp);
    } catch (error) {
      console.error('❌ 生データ保存エラー:', error);
    }
  }

  /**
   * 生データを取得
   */
  getRawData(ledgerType: LedgerType, primaryKeyValue: string): KintoneRecord | null {
    try {
      const ledgerMap = this.rawLedgerData.get(ledgerType);
      if (!ledgerMap) {
        return null;
      }

      return ledgerMap.get(primaryKeyValue) || null;
    } catch (error) {
      console.error('❌ 生データ取得エラー:', error);
      return null;
    }
  }

  /**
   * 台帳の全生データを取得
   */
  getAllRawDataByLedger(ledgerType: LedgerType): Map<string, KintoneRecord> | null {
    try {
      return this.rawLedgerData.get(ledgerType) || null;
    } catch (error) {
      console.error('❌ 台帳全生データ取得エラー:', error);
      return null;
    }
  }

  /**
   * 生データを削除
   */
  removeRawData(ledgerType: LedgerType, primaryKeyValue?: string): void {
    try {
      const ledgerMap = this.rawLedgerData.get(ledgerType);
      if (!ledgerMap) {
        return;
      }

      if (primaryKeyValue) {
        // 特定のレコードのみ削除
        ledgerMap.delete(primaryKeyValue);
      } else {
        // 台帳の全データを削除
        ledgerMap.clear();
      }
    } catch (error) {
      console.error('❌ 生データ削除エラー:', error);
    }
  }

  /**
   * 生データ統計情報を取得
   */
  getRawDataStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.rawLedgerData.forEach((ledgerMap, ledgerType) => {
      stats[ledgerType] = ledgerMap.size;
    });
    
    return stats;
  }

  /**
   * 全生データをクリア
   */
  clearAllRawData(): void {
    try {
      this.rawLedgerData.forEach((ledgerMap) => {
        ledgerMap.clear();
      });
      console.log('✅ 全生データをクリアしました');
    } catch (error) {
      console.error('❌ 全生データクリアエラー:', error);
    }
  }

  /**
   * 全台帳からデータを取得（3段階検索ロジック）
   */
  async fetchAllLedgerData(conditions: string = ''): Promise<IntegrationResult> {
    const allData: Record<string, KintoneRecord[]> = {};

    // 第1段階：直接検索（検索条件に該当するフィールドを持つ台帳から検索）
    const firstStageResults = await this.executeFirstStageSearch(conditions);

    // 第2段階：関連検索（現在は無効化）
    const secondStageResults: Record<string, KintoneRecord[]> = { 
      SEAT: [], PC: [], EXT: [], USER: [] 
    };

    // 第3段階：統合キーベース検索（補完検索）
    const thirdStageResults = await this.executeThirdStageSearch(
      firstStageResults,
      secondStageResults
    );

    // 結果をマージ
    Object.keys(this.appIds).forEach((appType) => {
      allData[appType] = [
        ...(firstStageResults[appType] || []),
        ...(secondStageResults[appType] || []),
        ...(thirdStageResults[appType] || []),
      ];

      // 重複除去
      allData[appType] = this.removeDuplicateRecords(allData[appType]);
    });

    // 各台帳の生データを保存
    this.saveRawDataFromAllLedgers(allData);

    // 統合処理を実行
    const integratedRecords = this.integrateData(allData);

    return {
      integratedRecords,
      targetAppId: null
    };
  }

  /**
   * 全台帳データから生データを保存
   */
  private saveRawDataFromAllLedgers(allLedgerData: Record<string, KintoneRecord[]>): void {
    try {
      Object.keys(allLedgerData).forEach((appType) => {
        // HISTORY台帳は生データ保存の対象外
        if (appType === 'HISTORY') {
          return;
        }

        const records = allLedgerData[appType] || [];
        const primaryKeyField = primaryKeyMapping[appType];

        if (!primaryKeyField) {
          return;
        }

        records.forEach((record) => {
          const primaryKeyValue = record[primaryKeyField]?.value;
          if (primaryKeyValue) {
            this.saveRawData(appType as LedgerType, primaryKeyValue, record);
          }
        });
      });
    } catch (error) {
      console.error('❌ 生データ一括保存エラー:', error);
    }
  }

  /**
   * 第1段階：検索条件で直接検索
   */
  private async executeFirstStageSearch(conditions: string): Promise<Record<string, KintoneRecord[]>> {
    const startTime = performance.now();
    const results: Record<string, KintoneRecord[]> = {};

    // 検索条件からフィールドを抽出して、どの台帳で検索すべきかを判定
    const targetApps = this.determineTargetApps(conditions);

    // 第1段階で実行した台帳を記録（第3段階で除外するため）
    this.firstStageExecutedApps = new Set();

    for (const [appType, appId] of Object.entries(this.appIds)) {
      try {
        // 検索条件が存在し、かつ対象台帳でない場合はスキップ
        if (conditions && !targetApps.includes(appType)) {
          results[appType] = [];
          continue;
        }

        const records = await APIManager.fetchAllRecords(appId, conditions, `第1段階-${appType}`);
        results[appType] = records;
        
        // 第1段階で実行した台帳を記録
        this.firstStageExecutedApps.add(appType);
      } catch (error) {
        console.error(`❌ ${appType}台帳の直接検索エラー:`, error);
        results[appType] = [];
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const totalRecords = Object.values(results).reduce((sum, records) => sum + records.length, 0);

    console.log(`✅ 第1段階検索完了: ${totalRecords}件 (${totalDuration.toFixed(2)}ms)`);
    return results;
  }

  /**
   * 検索条件から対象台帳を判定
   */
  private determineTargetApps(conditions: string): string[] {
    if (!conditions) {
      // 検索条件がない場合は全台帳を対象
      return Object.keys(this.appIds);
    }

    const targetApps = new Set<string>();

    // 簡易的な判定（実際のfieldConfigを使用する場合は、configから取得）
    Object.keys(primaryKeyMapping).forEach((appType) => {
      const primaryKey = primaryKeyMapping[appType];
      if (conditions.includes(primaryKey)) {
        targetApps.add(appType);
      }
    });

    // 対象台帳が見つからない場合は全台帳を対象
    if (targetApps.size === 0) {
      return Object.keys(this.appIds);
    }

    return Array.from(targetApps);
  }

  /**
   * 第3段階：統合キーベース検索（補完検索）
   */
  private async executeThirdStageSearch(
    firstStageResults: Record<string, KintoneRecord[]>,
    secondStageResults: Record<string, KintoneRecord[]>
  ): Promise<Record<string, KintoneRecord[]>> {
    const results: Record<string, KintoneRecord[]> = {};

    // 各台帳を初期化
    Object.keys(this.appIds).forEach((appType) => {
      results[appType] = [];
    });

    // 第1段階と第2段階の結果から統合キーを抽出
    const allIntegrationKeys = new Set<string>();

    [firstStageResults, secondStageResults].forEach((stageResults) => {
      Object.values(stageResults).forEach((records) => {
        records.forEach((record) => {
          const integrationKey = this.extractIntegrationKey(record);
          if (integrationKey) {
            allIntegrationKeys.add(integrationKey);
          }
        });
      });
    });

    // 各台帳について補完検索を実行
    for (const [appType, primaryKeyField] of Object.entries(primaryKeyMapping)) {
      if (!this.firstStageExecutedApps || !this.firstStageExecutedApps.has(appType)) {
        if (primaryKeyField) {
          await this.executeSupplementarySearch(allIntegrationKeys, results, appType, primaryKeyField);
        }
      }
    }

    return results;
  }

  /**
   * 統合キーを抽出
   */
  private extractIntegrationKey(record: KintoneRecord): string {
    const keyParts: string[] = [];

    Object.entries(primaryKeyMapping).forEach(([appType, fieldCode]) => {
      const fieldValue = record[fieldCode] ? record[fieldCode].value : '';
      if (fieldValue) {
        keyParts.push(`${appType}:${fieldValue}`);
      }
    });

    // 統合キーを生成（値が存在する組み合わせ）
    const integrationKey = keyParts.length > 0 ? keyParts.join('|') : `RECORD_${record.$id.value}`;

    return integrationKey;
  }

  /**
   * 補完検索ヘルパー
   */
  private async executeSupplementarySearch(
    integrationKeys: Set<string>,
    results: Record<string, KintoneRecord[]>,
    appType: string,
    fieldName: string
  ): Promise<void> {
    const targetIds = new Set<string>();
    const pattern = new RegExp(`${appType}:([^|]+)`);

    integrationKeys.forEach((integrationKey) => {
      const match = integrationKey.match(pattern);
      if (match) {
        targetIds.add(match[1]);
      }
    });

    if (targetIds.size > 0) {
      try {
        const idArray = Array.from(targetIds);
        const idBatches: string[][] = [];
        const maxKeys = APIManager.calculateOptimalBatchSize(idArray, fieldName);

        for (let i = 0; i < idArray.length; i += maxKeys) {
          idBatches.push(idArray.slice(i, i + maxKeys));
        }

        for (const batch of idBatches) {
          const conditions = batch.map((id) => `"${id}"`).join(',');
          const query = `${fieldName} in (${conditions})`;

          const records = await APIManager.fetchAllRecords(this.appIds[appType], query, `補完検索-${appType}`);
          results[appType].push(...records);
        }
      } catch (error) {
        console.error(`${appType}台帳補完検索エラー:`, error);
      }
    }
  }

  /**
   * レコードの重複除去（レコードIDベース）
   */
  private removeDuplicateRecords(records: KintoneRecord[]): KintoneRecord[] {
    const seen = new Set<string>();
    return records.filter((record) => {
      const recordId = record.$id.value;
      if (seen.has(recordId)) {
        return false;
      }
      seen.add(recordId);
      return true;
    });
  }

  /**
   * 4つの台帳データを統合キーで統合
   */
  integrateData(allLedgerData: Record<string, KintoneRecord[]>): LedgerRecord[] {
    const integratedData = new Map<string, LedgerRecord>();

    // 統合キーの正規化とマッチング用のヘルパー
    const normalizeIntegrationKey = (keyParts: string[]): string => {
      // 主キーの順序を統一（SEAT, PC, EXT, USER）
      const appOrder = ['SEAT', 'PC', 'EXT', 'USER'];
      const sortedParts: string[] = [];
      
      appOrder.forEach(app => {
        const part = keyParts.find(p => p.startsWith(`${app}:`));
        if (part) {
          sortedParts.push(part);
        }
      });
      
      return sortedParts.join('|');
    };

    // 各台帳のデータを統合キーでグループ化
    Object.keys(allLedgerData).forEach((appType) => {
      const records = allLedgerData[appType] || [];

      records.forEach((record) => {
        const originalIntegrationKey = this.extractIntegrationKey(record);
        const keyParts = originalIntegrationKey.split('|');
        const normalizedKey = normalizeIntegrationKey(keyParts);

        // 既存の統合レコードとのマッチングを試行
        let targetIntegrationKey = normalizedKey;
        let existingRecord = integratedData.get(targetIntegrationKey);

        // 完全マッチしない場合、部分マッチを試行
        if (!existingRecord) {
          for (const [existingKey, existingData] of integratedData.entries()) {
            const existingParts = existingKey.split('|');
            const newParts = keyParts;

            // 共通する主キーがあるかチェック
            let hasCommonKey = false;
            for (const newPart of newParts) {
              if (existingParts.includes(newPart)) {
                hasCommonKey = true;
                break;
              }
            }

            if (hasCommonKey) {
              // 既存のレコードに統合
              targetIntegrationKey = existingKey;
              existingRecord = existingData;
              
              // 統合キーを更新（新しい主キーを追加）
              const mergedParts = [...new Set([...existingParts, ...newParts])];
              const mergedKey = normalizeIntegrationKey(mergedParts);
              
              // 古いキーを削除し、新しいキーで再登録
              integratedData.delete(existingKey);
              targetIntegrationKey = mergedKey;
              existingRecord.integrationKey = mergedKey;
              break;
            }
          }
        }

        // 統合レコードが存在しない場合は新規作成
        if (!existingRecord) {
          existingRecord = {
            integrationKey: targetIntegrationKey,
            ledgerData: {},
            recordIds: {}
          };
        }

        // データを統合
        existingRecord.ledgerData[appType] = record;
        existingRecord.recordIds[appType] = record.$id.value;
        
        // マップに登録
        integratedData.set(targetIntegrationKey, existingRecord);
      });
    });

    const result = Array.from(integratedData.values());
    console.log(`✅ データ統合完了: ${result.length}件の統合レコード`);
    return result;
  }
}

// React Query用のクエリ関数
export const dataIntegrationQueries = {
  fetchAllLedgerData: (conditions?: string) => {
    const manager = new DataIntegrationManager();
    return manager.fetchAllLedgerData(conditions);
  },
  
  fetchRawDataStats: () => {
    const manager = new DataIntegrationManager();
    return manager.getRawDataStats();
  }
};

// React Query用のキー生成関数
export const dataIntegrationKeys = {
  allLedgerData: (conditions?: string) => ['ledgerData', 'all', conditions],
  rawDataStats: () => ['ledgerData', 'stats']
}; 