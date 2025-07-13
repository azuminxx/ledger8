// =============================================================================
// 🚀 統合台帳システム v3.0 - 検索管理サービス
// =============================================================================

import type { SearchConditions, FieldConfig } from '../types';
import { fieldsConfig } from '../config';

export class SearchManager {
  /**
   * 検索条件をkintoneクエリ文字列に変換
   */
  static buildQuery(conditions: SearchConditions): string {
    const queries: string[] = [];

    Object.entries(conditions).forEach(([fieldCode, value]) => {
      if (!value || !value.trim()) return;

      const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
      if (!field) return;

      const query = this.buildCondition(fieldCode, value.trim(), field);
      if (query) {
        queries.push(query);
      }
    });

    return queries.join(' and ');
  }

  /**
   * 個別条件を構築
   */
  private static buildCondition(fieldCode: string, value: string, field: FieldConfig): string {
    switch (field.filterType) {
      case 'dropdown':
        return this.buildDropdownCondition(fieldCode, value, field);
      case 'text':
      default:
        return this.buildTextCondition(fieldCode, value, field);
    }
  }

  /**
   * テキスト条件を構築
   */
  private static buildTextCondition(fieldCode: string, value: string, field: FieldConfig): string {
    const operator = field.searchOperator || 'like';
    const formatter = field.searchValueFormatter || 'prefix';

    switch (operator) {
      case '=':
        return `${fieldCode} = "${this.formatSearchValue(value, 'exact')}"`;
      case 'like':
        return `${fieldCode} like "${this.formatSearchValue(value, formatter)}"`;
      case 'in':
        // 複数値の場合はカンマ区切りで分割
        const values = this.parseInputValues(value);
        return this.buildMultiValueCondition(fieldCode, values, operator, formatter);
      default:
        return `${fieldCode} like "${this.formatSearchValue(value, formatter)}"`;
    }
  }

  /**
   * ドロップダウン条件を構築
   */
  private static buildDropdownCondition(fieldCode: string, value: string, field: FieldConfig): string {
    const operator = field.searchOperator || 'in';
    const formatter = field.searchValueFormatter || 'list';

    if (operator === 'in') {
      const values = this.parseInputValues(value);
      return this.buildMultiValueCondition(fieldCode, values, operator, formatter);
    } else {
      return `${fieldCode} = "${value}"`;
    }
  }

  /**
   * 入力値を解析（カンマ区切り対応）
   */
  private static parseInputValues(input: string): string[] {
    return input.split(',').map(v => v.trim()).filter(v => v);
  }

  /**
   * 複数値条件を構築
   */
  private static buildMultiValueCondition(
    fieldCode: string,
    values: string[],
    operator: string,
    formatter: string
  ): string {
    if (values.length === 0) return '';
    if (values.length === 1) {
      return `${fieldCode} = "${this.formatSearchValue(values[0], formatter)}"`;
    }

    return this.buildMultiValueQuery(fieldCode, values, operator, formatter);
  }

  /**
   * 複数値クエリを構築
   */
  private static buildMultiValueQuery(
    fieldCode: string,
    values: string[],
    operator: string,
    formatter: string
  ): string {
    const formattedValues = values.map(value => 
      `"${this.formatSearchValue(value, formatter)}"`
    ).join(',');

    return `${fieldCode} in (${formattedValues})`;
  }

  /**
   * 検索値をフォーマット
   */
  private static formatSearchValue(value: string, formatter: string): string {
    switch (formatter) {
      case 'exact':
        return value;
      case 'prefix':
        return value; // kintoneのlikeは部分一致なので、そのまま返す
      case 'list':
        return value;
      default:
        return value;
    }
  }

  /**
   * 検索条件の妥当性チェック
   */
  static validateConditions(conditions: SearchConditions): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 空の条件チェック
    const hasConditions = Object.values(conditions).some(value => value && value.trim());
    if (!hasConditions) {
      errors.push('検索条件を入力してください');
    }

    // フィールド存在チェック
    Object.keys(conditions).forEach(fieldCode => {
      const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
      if (!field) {
        errors.push(`不正なフィールド: ${fieldCode}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 検索条件をクリア
   */
  static clearConditions(): SearchConditions {
    return {};
  }

  /**
   * 検索条件をURLパラメータに変換
   */
  static conditionsToUrlParams(conditions: SearchConditions): URLSearchParams {
    const params = new URLSearchParams();
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value.trim());
      }
    });

    return params;
  }

  /**
   * URLパラメータから検索条件を復元
   */
  static urlParamsToConditions(params: URLSearchParams): SearchConditions {
    const conditions: SearchConditions = {};
    
    params.forEach((value, key) => {
      if (value && value.trim()) {
        conditions[key] = value.trim();
      }
    });

    return conditions;
  }

  /**
   * 検索条件の統計情報を取得
   */
  static getConditionStats(conditions: SearchConditions): {
    totalFields: number;
    filledFields: number;
    categories: Record<string, number>;
  } {
    const filledFields = Object.entries(conditions).filter(([_, value]) => value && value.trim()).length;
    const categories: Record<string, number> = {};

    Object.entries(conditions).forEach(([fieldCode, value]) => {
      if (!value || !value.trim()) return;

      const field = fieldsConfig.find(f => f.fieldCode === fieldCode);
      if (field) {
        const category = field.category || '共通';
        categories[category] = (categories[category] || 0) + 1;
      }
    });

    return {
      totalFields: Object.keys(conditions).length,
      filledFields,
      categories
    };
  }
}

// React Query用のクエリ関数
export const searchQueries = {
  buildQuery: (conditions: SearchConditions) => SearchManager.buildQuery(conditions),
  validateConditions: (conditions: SearchConditions) => SearchManager.validateConditions(conditions),
  getConditionStats: (conditions: SearchConditions) => SearchManager.getConditionStats(conditions)
};

// 検索関連のユーティリティ
export const searchUtils = {
  isEmptyConditions: (conditions: SearchConditions): boolean => {
    return !Object.values(conditions).some(value => value && value.trim());
  },

  getActiveFields: (conditions: SearchConditions): string[] => {
    return Object.entries(conditions)
      .filter(([_, value]) => value && value.trim())
      .map(([fieldCode, _]) => fieldCode);
  },

  mergeConditions: (base: SearchConditions, additional: SearchConditions): SearchConditions => {
    return { ...base, ...additional };
  },

  removeEmptyConditions: (conditions: SearchConditions): SearchConditions => {
    return Object.entries(conditions).reduce((acc, [key, value]) => {
      if (value && value.trim()) {
        acc[key] = value.trim();
      }
      return acc;
    }, {} as SearchConditions);
  }
}; 