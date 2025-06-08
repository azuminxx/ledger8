/**
 * 🏢 統合台帳システム v2 - 設定ファイル
 * @description シンプル化された設定・定数管理
 * @version 2.0.0
 */
(function() {
    'use strict';

    // グローバル名前空間の初期化
    window.LedgerV2 = window.LedgerV2 || {};

    // =============================================================================
    // 📚 アプリケーション設定
    // =============================================================================

    // アプリケーションID設定
    const APP_IDS = {
        SEAT: 8,       // 座席台帳アプリ
        PC: 6,         // PC台帳アプリ
        EXT: 7,        // 内線台帳アプリ
        USER: 13       // ユーザー台帳アプリ
    };

    // アプリURLマッピング
    const APP_URL_MAPPINGS = {
        'seat_record_id': `/k/${APP_IDS.SEAT}/`,
        'pc_record_id': `/k/${APP_IDS.PC}/`,
        'ext_record_id': `/k/${APP_IDS.EXT}/`,
        'user_record_id': `/k/${APP_IDS.USER}/`
    };

    // =============================================================================
    // 🎯 定数定義
    // =============================================================================

    // フィールドタイプ
    const FIELD_TYPES = {
        TEXT: 'text',
        INPUT: 'input',
        DROPDOWN: 'dropdown'
    };

    // 更新モード
    const UPDATE_MODES = {
        STATIC: 'static',
        DYNAMIC: 'dynamic'
    };

    // カテゴリー定義
    const CATEGORIES = {
        COMMON: '共通',
        SEAT: '座席台帳',
        PC: 'PC台帳',
        EXTENSION: '内線台帳',
        USER: 'ユーザー台帳'
    };

    // フィルタータイプ
    const FILTER_TYPES = {
        TEXT: 'text',
        DROPDOWN: 'dropdown'
    };

    // 検索演算子
    const SEARCH_OPERATORS = {
        EQUALS: '=',
        LIKE: 'like',
        IN: 'in'
    };

    // 検索値フォーマッター
    const SEARCH_VALUE_FORMATTERS = {
        EXACT: 'exact',
        PREFIX: 'prefix',
        LIST: 'list'
    };

    // 編集権限
    const EDIT_MODES = {
        ALL: 'all',
        STATIC: 'static'
    };

    // =============================================================================
    // 📋 フィールド設定（シンプル化版）
    // =============================================================================

    const fieldsConfig = [
        // 行番号
        {
            fieldCode: '_row_number',
            label: '🔢',
            width: '20px',
            cellType: 'row_number',
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            isRowNumber: true
        },

        // 変更チェックボックス
        {
            fieldCode: '_modification_checkbox',
            label: '✅',
            width: '30px',
            cellType: 'modification_checkbox',
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            isModificationCheckbox: true
        },

        // 非表示ボタン
        {
            fieldCode: '_hide_button',
            label: '👁️‍🗨️',
            width: '30px',
            cellType: 'hide_button',
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            isHideButton: true
        },

        // レコードID群
        {
            fieldCode: 'seat_record_id',
            label: '🪑 座席ID',
            width: '40px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.EQUALS,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.EXACT,
            editableFrom: EDIT_MODES.STATIC,
            isRecordId: true,
            sourceApp: 'SEAT'
        },
        {
            fieldCode: 'pc_record_id',
            label: '💻 PC-ID',
            width: '40px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.EQUALS,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.EXACT,
            editableFrom: EDIT_MODES.STATIC,
            isRecordId: true,
            sourceApp: 'PC'
        },
        {
            fieldCode: 'ext_record_id',
            label: '☎️ 内線ID',
            width: '40px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.EQUALS,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.EXACT,
            editableFrom: EDIT_MODES.STATIC,
            isRecordId: true,
            sourceApp: 'EXT'
        },
        {
            fieldCode: 'user_record_id',
            label: '👥 USER-ID',
            width: '40px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.EQUALS,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.EXACT,
            editableFrom: EDIT_MODES.STATIC,
            isRecordId: true,
            sourceApp: 'USER'
        },

        // 主キーフィールド群
        {
            fieldCode: '座席番号',
            label: '🪑 座席番号',
            width: '130px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            sourceApp: 'SEAT',
            isPrimaryKey: true,
            allowCellDragDrop: true
        },
        {
            fieldCode: 'PC番号',
            label: '💻 PC番号',
            width: '150px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            sourceApp: 'PC',
            isPrimaryKey: true,
            allowCellDragDrop: true
        },
        {
            fieldCode: '内線番号',
            label: '☎️ 内線番号',
            width: '90px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            sourceApp: 'EXT',
            isPrimaryKey: true,
            allowCellDragDrop: true
        },
        {
            fieldCode: 'ユーザーID',
            label: '🆔 ユーザーID',
            width: '100px',
            cellType: FIELD_TYPES.TEXT,
            updateMode: UPDATE_MODES.STATIC,
            category: CATEGORIES.COMMON,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.STATIC,
            sourceApp: 'USER',
            isPrimaryKey: true,
            allowCellDragDrop: true
        },

        // 座席台帳フィールド
        {
            fieldCode: '座席拠点',
            label: '📍 座席拠点',
            width: '80px',
            cellType: FIELD_TYPES.DROPDOWN,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.SEAT,
            options: [
                { value: '池袋', label: '池袋' },
                { value: '埼玉', label: '埼玉' },
                { value: '文京', label: '文京' },
                { value: '浦和', label: '浦和' }
            ],
            filterType: FILTER_TYPES.DROPDOWN,
            searchOperator: SEARCH_OPERATORS.IN,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'SEAT'
        },
        {
            fieldCode: '階数',
            label: '🔢 階数',
            width: '70px',
            cellType: FIELD_TYPES.INPUT,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.SEAT,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'SEAT',
            allowFillHandle: true
        },
        {
            fieldCode: '座席部署',
            label: '🏢 座席部署',
            width: '70px',
            cellType: FIELD_TYPES.INPUT,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.SEAT,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'SEAT'
        },

        // PC台帳フィールド
        {
            fieldCode: 'PC用途',
            label: '🎯 PC用途',
            width: '100px',
            cellType: FIELD_TYPES.DROPDOWN,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.PC,
            options: [
                { value: '個人専用', label: '個人専用' },
                { value: 'CO/TOブース', label: 'CO/TOブース' },
                { value: 'RPA用', label: 'RPA用' },
                { value: '拠点設備用', label: '拠点設備用' },
                { value: '会議用', label: '会議用' },
                { value: '在庫', label: '在庫' }
            ],
            filterType: FILTER_TYPES.DROPDOWN,
            searchOperator: SEARCH_OPERATORS.IN,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'PC'
        },

        // 内線台帳フィールド
        {
            fieldCode: '電話機種別',
            label: '📱 電話機種別',
            width: '80px',
            cellType: FIELD_TYPES.DROPDOWN,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.EXTENSION,
            options: [
                { value: 'ビジネス', label: 'ビジネス' },
                { value: 'ACD', label: 'ACD' }
            ],
            filterType: FILTER_TYPES.DROPDOWN,
            searchOperator: SEARCH_OPERATORS.IN,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'EXT'
        },

        // ユーザー台帳フィールド
        {
            fieldCode: 'ユーザー名',
            label: '👤 ユーザー名',
            width: '100px',
            cellType: FIELD_TYPES.INPUT,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.USER,
            filterType: FILTER_TYPES.TEXT,
            searchOperator: SEARCH_OPERATORS.LIKE,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'USER'
        }
    ];

    // =============================================================================
    // 📏 UI設定（シンプル版）
    // =============================================================================

    const UI_SETTINGS = {
        FONT_SIZE: '11px',
        CELL_PADDING: '1px',
        BORDER_COLOR: '#ccc',
        HIGHLIGHT_COLOR: '#fff3e0',
        MODIFIED_COLOR: '#ffeb3b'
    };

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    // 設定をグローバルスコープに公開
    window.LedgerV2.Config = {
        APP_IDS,
        APP_URL_MAPPINGS,
        FIELD_TYPES,
        UPDATE_MODES,
        CATEGORIES,
        FILTER_TYPES,
        SEARCH_OPERATORS,
        SEARCH_VALUE_FORMATTERS,
        EDIT_MODES,
        fieldsConfig,
        UI_SETTINGS
    };

    // レガシー互換性のため一部をwindowに直接公開
    window.APP_IDS = APP_IDS;
    window.fieldsConfig = fieldsConfig;
    window.FIELD_TYPES = FIELD_TYPES;
    window.UPDATE_MODES = UPDATE_MODES;
    window.CATEGORIES = CATEGORIES;
    window.FILTER_TYPES = FILTER_TYPES;
    window.SEARCH_OPERATORS = SEARCH_OPERATORS;
    window.SEARCH_VALUE_FORMATTERS = SEARCH_VALUE_FORMATTERS;
    window.EDIT_MODES = EDIT_MODES;

    console.log('✅ LedgerV2 設定システム初期化完了');

})();
