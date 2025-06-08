(function() {
    'use strict';

    // =============================================================================
    // 🏢 システム全体の設定
    // =============================================================================

    // 🌐 グローバル名前空間の初期化
    window.MyApp = window.MyApp || {};

    // 📚 アプリケーションID設定
    const APP_IDS = {
        PC: 6,        // 💻 PC台帳アプリ
        EXT: 7,       // ☎️ 内線台帳アプリ  
        SEAT: 8,      // 🪑 座席台帳アプリ
        USER: 13       // 👥 ユーザー台帳アプリ
    };

    // 🔧 アプリIDのURLマッピング設定
    const APP_URL_MAPPINGS = {
        'seat_record_id': `/k/${APP_IDS.SEAT}/`,
        'pc_record_id': `/k/${APP_IDS.PC}/`,
        'ext_record_id': `/k/${APP_IDS.EXT}/`,
        'user_record_id': `/k/${APP_IDS.USER}/`
    };

    // =============================================================================
    // 🎯 定数定義
    // =============================================================================

    // 📝 フィールドタイプ（cellType設定値）
    const FIELD_TYPES = {
        TEXT: 'text',         // 📄 テキスト表示（読み取り専用、リンク生成可能）
        INPUT: 'input',       // ✏️ 入力フィールド（編集可能なテキストボックス）
        DROPDOWN: 'dropdown'  // 📋 ドロップダウン（選択肢から選択）
    };

    // 🔄 更新モード（updateMode設定値）
    const UPDATE_MODES = {
        STATIC: 'static',    // 🔒 更新されない読み取り専用（初期値のみ表示）
        DYNAMIC: 'dynamic'   // 🔓 動的に更新される（ユーザー操作で値変更可能）
    };

    
    // 📂 カテゴリー定義（category設定値）
    const CATEGORIES = {
        COMMON: '共通',           // 🔰 共通項目（全台帳で共有）
        SEAT: '座席台帳',         // 🪑 座席関連（座席台帳固有）
        PC: 'PC台帳',            // 💻 PC関連（PC台帳固有）
        EXTENSION: '内線台帳',    // ☎️ 内線関連（内線台帳固有）
        USER: 'ユーザー台帳'      // 👥 ユーザー関連（ユーザー台帳固有）
    };

    // 🔍 フィルタータイプ（filterType設定値）
    const FILTER_TYPES = {
        TEXT: 'text',           // ✍️ テキスト入力ボックス
        DROPDOWN: 'dropdown'    // 📝 ドロップダウン選択
    };

    // 🔎 検索演算子タイプ（searchOperator設定値）
    const SEARCH_OPERATORS = {
        EQUALS: '=',            // 🎯 完全一致（レコードID等、厳密検索）
        LIKE: 'like',           // 🔍 部分一致（テキスト検索、前方一致）
        IN: 'in'                // 📋 リスト検索（ドロップダウン値、複数候補）
    };

    // 🔧 検索値フォーマッタータイプ（searchValueFormatter設定値）
    const SEARCH_VALUE_FORMATTERS = {
        EXACT: 'exact',         // そのまま使用（"123" → "123"）
        PREFIX: 'prefix',       // 前方一致用（"ABC" → "ABC%"）
        LIST: 'list',           // IN句用（"池袋" → ("池袋")）
        QUOTED: 'quoted'        // クォート付き（"ABC" → "ABC"）
    };

    // 🔑 編集権限範囲（editableFrom設定値）
    const EDIT_MODES = {
        ALL: 'all',           // 🌐 全ての台帳から編集可能
        OWN_LEDGER: 'own',    // 🎯 自身の台帳でのみ編集可能
        STATIC: 'static'      // 🔒 編集不可（表示のみ）
    };

    // 🔄 セル移動機能制御（allowCellMove設定値）
    const CELL_MOVE_MODES = {
        NONE: 'none',           // 🚫 セル移動不可
        PRIMARY_KEY_ONLY: 'primary_key_only',  // 🔑 主キーのみセル移動可能
        ALL: 'all'             // 🌐 全フィールドでセル移動可能
    };

    // =============================================================================
    // 📋 フィールド設定
    // =============================================================================

    /**
     * 🏗️ fieldsConfig設定項目説明
     * 
     * 📌 必須項目:
     * @param {string} fieldCode - kintoneフィールドコード（APIで使用される内部名）
     * @param {string} label - テーブルヘッダーに表示されるラベル文字列
     * @param {string} width - カラム幅（CSS形式: '100px', '10%' など）
     * @param {string} cellType - セル表示タイプ（FIELD_TYPES の値）
     * @param {string} updateMode - 更新動作（UPDATE_MODES の値）
     * @param {string} category - フィールドカテゴリ（CATEGORIES の値）
     * @param {string} filterType - フィルター入力UI（FILTER_TYPES の値）
     * @param {string} editableFrom - 編集権限範囲（EDIT_MODES の値）
     * 
     * 🔍 検索関連設定:
     * @param {string} searchOperator - 検索時の比較演算子（SEARCH_OPERATORS の値）
     *   - EQUALS ('='): 完全一致検索（レコードIDなど）
     *   - LIKE ('like'): 部分一致検索（テキストフィールド）
     *   - IN ('in'): リスト検索（ドロップダウン選択値）
     * @param {string} searchValueFormatter - 検索値の整形方法（SEARCH_VALUE_FORMATTERS の値）
     *   - EXACT ('exact'): 値をそのまま使用
     *   - PREFIX ('prefix'): 前方一致用に"%"を付与 ("値%" 形式)
     *   - LIST ('list'): IN句用に括弧で囲む ("値") 形式)
     *   - QUOTED ('quoted'): クォートで囲む ("値" 形式)
     * 
     * 🏢 アプリ関連設定:
     * @param {string} sourceApp - データソースアプリ（'SEAT', 'PC', 'EXT', 'USER'）
     * 
     * 🏷️ 特別フィールドフラグ（該当する場合のみ指定）:
     * @param {boolean} isPrimaryKey - 主キーフィールド（ドラッグ&ドロップ対象）
     * @param {boolean} isRecordId - レコードID（詳細リンク生成）
     * @param {boolean} isRowNumber - 行番号（シーケンシャル表示）
     * @param {boolean} isModificationCheckbox - 変更検知チェックボックス
     * @param {boolean} isHideButton - 行非表示ボタン
     * @param {boolean} isIntegrationKey - 統合キー（複数台帳統合用）
     * 
     * 🎛️ 操作制御設定:
     * @param {string} allowCellMove - セル移動許可（CELL_MOVE_MODES の値）
     *   - NONE: セル移動不可
     *   - PRIMARY_KEY_ONLY: 主キーのみセル移動可能
     *   - ALL: 全フィールドでセル移動可能
     * @param {boolean} allowCellDragDrop - セルドラッグ&ドロップ許可
     * @param {boolean} allowFillHandle - フィルハンドル機能許可
     * 
     * 📋 ドロップダウン設定（cellType が DROPDOWN の場合）:
     * @param {Array} options - 選択肢配列
     *   - {value: '値', label: '表示名'} 形式のオブジェクト配列
     * 
     * 📝 その他:
     * @param {string} description - フィールドの説明文（開発用ドキュメント）
     * 
     * 💡 使用例:
     * {
     *   fieldCode: '座席番号',                           // kintoneフィールド名
     *   label: '🪑 座席番号',                           // 表示ラベル
     *   width: '130px',                                // カラム幅
     *   cellType: FIELD_TYPES.TEXT,                    // テキスト表示
     *   updateMode: UPDATE_MODES.STATIC,               // 読み取り専用
     *   category: CATEGORIES.COMMON,                   // 共通フィールド
     *   filterType: FILTER_TYPES.TEXT,                 // テキスト入力フィルター
     *   searchOperator: SEARCH_OPERATORS.LIKE,         // 部分一致検索
     *   searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX, // 前方一致形式
     *   editableFrom: EDIT_MODES.STATIC,               // 編集不可
     *   sourceApp: 'SEAT',                            // 座席台帳アプリ
     *   isPrimaryKey: true,                           // 主キーフィールド
     *   allowCellMove: CELL_MOVE_MODES.PRIMARY_KEY_ONLY, // 主キーのみ移動可
     *   description: '座席を識別する主キー'              // 説明
     * }
     * 
     * 🎯 よく使われる設定パターン:
     * 
     * 【レコードIDフィールド】
     * cellType: FIELD_TYPES.TEXT, updateMode: UPDATE_MODES.STATIC,
     * searchOperator: SEARCH_OPERATORS.EQUALS, searchValueFormatter: SEARCH_VALUE_FORMATTERS.EXACT
     * 
     * 【主キーフィールド】  
     * cellType: FIELD_TYPES.TEXT, updateMode: UPDATE_MODES.STATIC,
     * searchOperator: SEARCH_OPERATORS.LIKE, searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX,
     * isPrimaryKey: true, allowCellMove: CELL_MOVE_MODES.PRIMARY_KEY_ONLY
     * 
     * 【編集可能テキストフィールド】
     * cellType: FIELD_TYPES.INPUT, updateMode: UPDATE_MODES.DYNAMIC,
     * searchOperator: SEARCH_OPERATORS.LIKE, searchValueFormatter: SEARCH_VALUE_FORMATTERS.PREFIX
     * 
     * 【ドロップダウンフィールド】
     * cellType: FIELD_TYPES.DROPDOWN, updateMode: UPDATE_MODES.DYNAMIC,
     * searchOperator: SEARCH_OPERATORS.IN, searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
     * options: [{value: '値1', label: '表示名1'}, ...]
     * 
     * 【特別機能フィールド】
     * cellType: 'row_number' | 'modification_checkbox' | 'hide_button',
     * updateMode: UPDATE_MODES.STATIC, allowCellMove: CELL_MOVE_MODES.NONE
     * 
     * ⚠️ 設定変更時の注意点:
     * 
     * 1. 🔧 searchOperator と searchValueFormatter は必ずペアで設定
     *    - EQUALS → EXACT (完全一致)
     *    - LIKE → PREFIX (前方一致)  
     *    - IN → LIST (リスト形式)
     * 
     * 2. 📋 cellType が DROPDOWN の場合、options配列が必須
     * 
     * 3. 🏷️ 特別フラグ（isPrimaryKey等）は排他的に設定
     *    (一つのフィールドに複数のフラグを立てない)
     * 
     * 4. 🎯 sourceApp は実際のkintoneアプリと一致させる
     *    ('SEAT' = APP_IDS.SEAT, 'PC' = APP_IDS.PC など)
     * 
     * 5. 🔄 allowCellMove は isPrimaryKey と組み合わせて使用
     *    主キー以外で PRIMARY_KEY_ONLY は無効
     */

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
            isRowNumber: true,
            allowCellMove: CELL_MOVE_MODES.NONE,  // 🚫 セル移動不可
            description: '行を識別するためのシーケンシャル番号'
        },

        // ✅ 変更チェックボックス
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
            isModificationCheckbox: true,
            allowCellMove: CELL_MOVE_MODES.NONE,  // 🚫 セル移動不可
            description: '行またはセルに変更があることを示すチェックボックス'
        },

        // 👁️‍🗨️ 非表示ボタン
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
            isHideButton: true,
            allowCellMove: CELL_MOVE_MODES.NONE,  // 🚫 セル移動不可
            description: '行を表示から非表示にするためのボタン'
        },

        // 🆔 各台帳のレコードID
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
            sourceApp: 'SEAT',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
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
            sourceApp: 'PC',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
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
            sourceApp: 'EXT',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
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
            sourceApp: 'USER',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
        },

        // 🔑 主キーフィールド（共通項目）
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
            allowCellDragDrop: true,
            allowCellMove: CELL_MOVE_MODES.PRIMARY_KEY_ONLY  // 🔄 主キーとしてセル移動可能
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
            allowCellDragDrop: true,
            allowCellMove: CELL_MOVE_MODES.PRIMARY_KEY_ONLY  // 🔄 主キーとしてセル移動可能
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
            allowCellDragDrop: true,
            allowCellMove: CELL_MOVE_MODES.PRIMARY_KEY_ONLY  // 🔄 主キーとしてセル移動可能
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
            allowCellDragDrop: true,
            allowCellMove: CELL_MOVE_MODES.PRIMARY_KEY_ONLY  // 🔄 主キーとしてセル移動可能
        },

        // 🪑 座席台帳フィールド（座席台帳固有フィールドのみ）
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
                { value: '浦和', label: '浦和' },
            ],
            filterType: FILTER_TYPES.DROPDOWN,
            searchOperator: SEARCH_OPERATORS.IN,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'SEAT',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
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
            allowFillHandle: true,  // 📋 フィルハンドル機能を有効化
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
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
            sourceApp: 'SEAT',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
        },

        // 💻 PC台帳フィールド（PC台帳固有フィールドのみ）
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
                { value: '在庫', label: '在庫' },
            ],
            filterType: FILTER_TYPES.DROPDOWN,
            searchOperator: SEARCH_OPERATORS.IN,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'PC',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
        },

        // ☎️ 内線台帳フィールド（内線台帳固有フィールドのみ）
        {
            fieldCode: '電話機種別',
            label: '📱 電話機種別',
            width: '80px',
            cellType: FIELD_TYPES.DROPDOWN,
            updateMode: UPDATE_MODES.DYNAMIC,
            category: CATEGORIES.EXTENSION,
            options: [
                { value: 'ビジネス', label: 'ビジネス' },
                { value: 'ACD', label: 'ACD' },
            ],
            filterType: FILTER_TYPES.DROPDOWN,
            searchOperator: SEARCH_OPERATORS.IN,
            searchValueFormatter: SEARCH_VALUE_FORMATTERS.LIST,
            editableFrom: EDIT_MODES.ALL,
            sourceApp: 'EXT',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
        },

        // 👥 ユーザー台帳フィールド（ユーザー台帳固有フィールドのみ）
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
            sourceApp: 'USER',
            allowCellMove: CELL_MOVE_MODES.NONE  // 🚫 セル移動不可
        }
    ];

    // =============================================================================
    // 🚩 フィーチャーフラグ設定
    // =============================================================================

    /**
     * 🔄 セル交換システム移行設定
     * @description 新システムへの段階的移行を制御
     */
    const FEATURE_FLAGS = {
        // セル交換システム
        ENABLE_NEW_EXCHANGE_SYSTEM: true,     // 🔄 新しいセル交換システムを使用
        DEBUG_EXCHANGE_SYSTEM: true,           // 🐛 セル交換のデバッグ情報を表示
        
        // データモデル統合
        ENABLE_UNIFIED_DATA_MODEL: false,      // 📊 統一データモデルを使用
        DEBUG_DATA_MODEL: false,               // 🐛 データモデルのデバッグ情報を表示
        
        // レガシー統合
        ENABLE_LEGACY_INTEGRATION: true,       // 🔗 レガシーシステム統合を有効
        DEBUG_LEGACY_INTEGRATION: false,       // 🐛 レガシー統合のデバッグ情報を表示
        
        // パフォーマンス最適化
        ENABLE_PERFORMANCE_MONITORING: false,  // 📈 パフォーマンス監視を有効
        BATCH_UPDATE_THRESHOLD: 50,            // 🔢 バッチ更新の閾値
        
        // UI改善
        ENABLE_ENHANCED_UI: false,             // 🎨 拡張UI機能を有効
        ANIMATION_DURATION: 300,               // ⏱️ アニメーション時間（ms）
        
        // 開発・テスト用
        DEVELOPMENT_MODE: false,               // 🛠️ 開発モード
        TESTING_MODE: false,                   // 🧪 テストモード
        VERBOSE_LOGGING: false                 // 📝 詳細ログ出力
    };

    /**
     * 🎛️ 環境別設定の自動判定
     * @description URLやコンテキストに基づいて設定を調整
     */
    const detectEnvironment = () => {
        const hostname = window.location?.hostname || '';
        const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
        const isDevelopment = hostname.includes('dev') || hostname.includes('test');
        
        // 開発環境の場合、デバッグを有効化
        if (isLocalhost || isDevelopment) {
            FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM = true;
            FEATURE_FLAGS.DEBUG_DATA_MODEL = true;
            FEATURE_FLAGS.DEVELOPMENT_MODE = true;
            FEATURE_FLAGS.VERBOSE_LOGGING = true;
            console.log('🛠️ 開発環境を検出しました - デバッグ機能を有効化');
        }
        
    };

    /**
     * 📊 フィーチャーフラグの現在状態をログ出力
     */
    const logFeatureFlags = () => {
        if (FEATURE_FLAGS.VERBOSE_LOGGING) {
            console.group('🚩 現在のフィーチャーフラグ設定');
            Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
                const icon = value === true ? '✅' : value === false ? '❌' : '🔢';
                console.log(`${icon} ${key}: ${value}`);
            });
            console.groupEnd();
        }
    };

    // 環境自動判定の実行
    detectEnvironment();
    
    // 設定状況のログ出力
    logFeatureFlags();

    // =============================================================================
    // 🎨 UI・スタイル設定
    // =============================================================================

    // 📏 フォントサイズ設定
    const FONT_SIZES = {
        SMALL: '10px',      // 分離ボタンなど
        NORMAL: '11px',     // 通常のセル表示
        MEDIUM: '12px',     // ヘッダーなど
        LARGE: '14px'       // 警告メッセージなど
    };

    // 🎨 カラーパレット
    const COLORS = {
        // ステータス色
        SUCCESS: '#28a745',
        WARNING: '#ffc107', 
        INFO: '#17a2b8',
        MUTED: '#6c757d',
        DANGER: '#dc3545',
        
        // 背景色
        WHITE: '#ffffff',
        LIGHT_GRAY: '#f5f5f5',
        MEDIUM_GRAY: '#f0f0f0',
        HIGHLIGHT_YELLOW: '#fff8e1',
        
        // ハイライト色
        MODIFIED_BG: '#fff3e0',
        MODIFIED_BORDER: '#ff9800',
        MODIFIED_TEXT: '#e65100',
        SUCCESS_BG: '#e8f5e8',
        SUCCESS_BORDER: '#4caf50',
        
        // リンク・アクティブ色
        LINK_BLUE: '#1976d2',
        ACTIVE_BLUE: '#e3f2fd',
        BORDER_BLUE: '#1976d2',
        
        // ドロップ関連色
        DROP_BG: '#f3e5f5',
        DROP_BORDER: '#9c27b0',
        
        // 無効・灰色系
        DISABLED_BG: '#fafafa',
        DISABLED_BORDER: '#e0e0e0',
        DISABLED_TEXT: '#757575',
        DARK_GRAY: '#424242',
        BORDER_GRAY: '#bdbdbd'
    };

    // 📐 レイアウト設定
    const LAYOUT = {
        // セル幅設定
        CELL_WIDTH: {
            HIDE_BUTTON: '35px',
            RECORD_ID: '100px', 
            SEAT_NUMBER: '130px',
            PC_NUMBER: '150px',
            EXT_NUMBER: '90px',
            USER_ID: '100px',
            LOCATION: '80px',
            FLOOR: '70px',
            DEPARTMENT: '70px',
            INTEGRATION_KEY: '250px'
        },
        
        // 余白・間隔
        PADDING: {
            CELL: '4px',
            BUTTON: '1px',
            MESSAGE: '15px 25px'
        },
        
        // ボーダー
        BORDER: {
            CELL: '1px solid #ccc',
            HIGHLIGHT: '2px solid #ff9800',
            SUCCESS: '2px solid #4caf50',
            DASHED: '2px dashed #9c27b0'
        }
    };

    // =============================================================================
    // ⏱️ タイミング・パフォーマンス設定
    // =============================================================================

    // ⏱️ 遅延・タイムアウト設定
    const TIMING = {
        DEBOUNCE_DELAY: 500,        // 検索デバウンス遅延(ms)
        MESSAGE_DURATION: 2000,     // メッセージ表示時間(ms)
        SHORT_DELAY: 1000,          // 短い遅延(ms)
        ANIMATION_DURATION: 300     // アニメーション時間(ms)
    };

    // 📊 API・データ制限設定
    const API_LIMITS = {
        SEARCH_LIMIT: 500,           // 検索結果制限
        RECORD_LIMIT: 500,           // レコード取得制限
        STRUCTURE_LIMIT: 1,         // 構造確認用制限
        MAX_RETRY_COUNT: 3,         // API再試行回数
        TIMEOUT: 30000              // APIタイムアウト(ms)
    };

    // =============================================================================
    // 🔧 動作設定
    // =============================================================================

    // 🔧 機能制御設定
    const BEHAVIOR = {
        AUTO_SAVE: true,            // 自動保存有効
        CONFIRM_DELETE: true,       // 削除確認表示
        ENABLE_ANIMATIONS: true,    // アニメーション有効
        STRICT_VALIDATION: false,   // 厳密バリデーション
        DEBUG_VERBOSE: false        // 詳細デバッグ出力
    };

    // 🎯 ドラッグ&ドロップ設定
    const DRAG_DROP = {
        ENABLE_CELL_DRAG: true,     // セルドラッグ有効
        ENABLE_ROW_DRAG: true,      // 行ドラッグ有効
        CONFIRM_EXCHANGE: false,    // 交換確認表示
        HIGHLIGHT_TARGET: true      // ドロップ先ハイライト
    };

    // =============================================================================
    // 💬 メッセージ・テキスト設定
    // =============================================================================

    // 📢 システムメッセージ
    const MESSAGES = {
        // 検索関連
        NO_RESULTS: '検索結果が見つかりませんでした',
        SEARCHING: 'データを検索中...',
        LOADING: 'データを抽出中...',
        
        // エラーメッセージ
        SAME_ROW_WARNING: '同じ行内でのドラッグ&ドロップはできません',
        EXCHANGE_ERROR: 'ドラッグ&ドロップ処理でエラーが発生しました',
        CONFIG_ERROR: '設定読み込みエラー',
        
        // 成功メッセージ
        EXCHANGE_SUCCESS: 'セル交換が完了しました',
        SEPARATION_SUCCESS: 'フィールド分離が完了しました',
        SAVE_SUCCESS: 'データが保存されました',
        
        // 確認メッセージ
        DELETE_CONFIRM: '本当に削除しますか？',
        EXCHANGE_CONFIRM: 'この操作を実行しますか？',
        
        // 状態表示
        SYSTEM_STATUS: {
            NEW_SYSTEM: '新システム',
            OLD_SYSTEM: '既存システム',
            ENABLED: '有効',
            DISABLED: '無効',
            CHECKING: '確認中...'
        }
    };

    // 🔗 URLパターン設定
    const URL_PATTERNS = {
        KINTONE_API: '/k/v1/records',
        RECORD_DETAIL: '/k/{appId}/show#record={recordId}',
        APP_BASE: '/k/{appId}/',
        
        // レコード詳細リンクのテンプレート
        RECORD_LINK_TEMPLATES: {
            SEAT: `/k/${APP_IDS.SEAT}/show#record=`,
            PC: `/k/${APP_IDS.PC}/show#record=`,
            EXT: `/k/${APP_IDS.EXT}/show#record=`,
            USER: `/k/${APP_IDS.USER}/show#record=`
        }
    };

    // 📊 ログレベル設定
    const LOG_LEVELS = {
        ERROR: 'error',
        WARN: 'warn', 
        INFO: 'info',
        DEBUG: 'debug',
        TRACE: 'trace'
    };

    // 🎯 パフォーマンス設定
    const PERFORMANCE = {
        // レンダリング最適化
        VIRTUAL_SCROLL_THRESHOLD: 100,      // 仮想スクロール開始行数
        BATCH_SIZE: 50,                     // バッチ処理サイズ
        RENDER_DELAY: 16,                   // レンダリング遅延(ms)
        
        // キャッシュ設定
        CACHE_SIZE: 1000,                   // キャッシュサイズ
        CACHE_TTL: 300000,                  // キャッシュ有効期限(ms)
        
        // パフォーマンス監視
        SLOW_OPERATION_THRESHOLD: 1000,     // 低速操作判定(ms)
        MEMORY_WARNING_THRESHOLD: 100      // メモリ警告閾値(MB)
    };

    // =============================================================================
    // 🌐 グローバルエクスポート
    // =============================================================================

    // グローバルスコープにエクスポート
    window.APP_IDS = APP_IDS;
    window.APP_URL_MAPPINGS = APP_URL_MAPPINGS;
    window.fieldsConfig = fieldsConfig;
    window.FIELD_TYPES = FIELD_TYPES;
    window.UPDATE_MODES = UPDATE_MODES;
    window.CATEGORIES = CATEGORIES;
    window.FILTER_TYPES = FILTER_TYPES;
    window.SEARCH_OPERATORS = SEARCH_OPERATORS;  // 🔎 検索演算子を追加
    window.SEARCH_VALUE_FORMATTERS = SEARCH_VALUE_FORMATTERS;  // 🔧 検索値フォーマッターを追加
    window.EDIT_MODES = EDIT_MODES;
    window.CELL_MOVE_MODES = CELL_MOVE_MODES;  // 🔄 セル移動モードを追加

    // 🚩 フィーチャーフラグもグローバルに公開
    window.FEATURE_FLAGS = FEATURE_FLAGS;
    
    // 🔄 個別フラグも後方互換性のために公開
    window.ENABLE_NEW_EXCHANGE_SYSTEM = FEATURE_FLAGS.ENABLE_NEW_EXCHANGE_SYSTEM;
    window.DEBUG_EXCHANGE_SYSTEM = FEATURE_FLAGS.DEBUG_EXCHANGE_SYSTEM;
    window.ENABLE_UNIFIED_DATA_MODEL = FEATURE_FLAGS.ENABLE_UNIFIED_DATA_MODEL;
    window.ENABLE_LEGACY_INTEGRATION = FEATURE_FLAGS.ENABLE_LEGACY_INTEGRATION;
    
    // 🎨 UI・スタイル設定をグローバルに公開
    window.FONT_SIZES = FONT_SIZES;
    window.COLORS = COLORS;
    window.LAYOUT = LAYOUT;
    
    // ⏱️ タイミング設定をグローバルに公開  
    window.TIMING = TIMING;
    window.API_LIMITS = API_LIMITS;
    
    // 🔧 動作設定をグローバルに公開
    window.BEHAVIOR = BEHAVIOR;
    window.DRAG_DROP = DRAG_DROP;
    
    // 💬 メッセージ・テキスト設定をグローバルに公開
    window.MESSAGES = MESSAGES;
    window.URL_PATTERNS = URL_PATTERNS;
    window.LOG_LEVELS = LOG_LEVELS;
    window.PERFORMANCE = PERFORMANCE;

})();