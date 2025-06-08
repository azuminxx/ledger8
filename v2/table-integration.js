/**
 * 統合台帳システム v2 - テーブル機能統合管理 (table-integration.js)
 * @description 分割されたテーブル機能ファイルの統合管理・初期化制御
 * @version 2.0.0
 * 
 * 🎯 **ファイルの責任範囲**
 * ✅ 分割ファイルの読み込み順序制御
 * ✅ モジュール依存関係チェック
 * ✅ グローバルインスタンス作成（レガシー互換性）
 * ✅ 初期化タイミング制御
 * 
 * ❌ **やってはいけないこと（責任範囲外）**
 * ❌ 具体的な機能実装（各専用ファイルの責任）
 * ❌ ビジネスロジック
 * ❌ DOM操作・UI処理
 * 
 * 📋 **管理対象ファイル**
 * - table-render.js: テーブル描画 ✅
 * - table-interact.js: ユーザー操作 ✅
 * - table-header.js: 初期化・ヘッダー ✅
 * - table-pagination.js: ページネーション ✅
 * 
 * 🔗 **依存関係チェック**
 * - LedgerV2.TableRender.TableDisplayManager ✅
 * - LedgerV2.TableInteract.TableEventManager ✅
 * - LedgerV2.TableHeader.TableCreator ✅
 * - LedgerV2.Pagination.PaginationManager ✅
 * 
 * 💡 **責任**
 * - 統合管理のみ、機能実装は各専用ファイルに委譲
 */
(function() {
    'use strict';

    console.log('🔗 Table機能統合管理開始 (table-integration.js)');

    // 分割されたファイルが読み込まれていることを確認
    function waitForModules() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒後にタイムアウト

            const checkModules = () => {
                attempts++;
                
                // 各モジュールの読み込み状況をチェック
                const hasTableRender = !!window.LedgerV2?.TableRender?.TableDisplayManager;
                const hasTableInteract = !!window.LedgerV2?.TableInteract?.TableEventManager;
                const hasTableHeader = !!window.LedgerV2?.TableHeader?.TableCreator;
                const hasPagination = !!window.LedgerV2?.Pagination?.PaginationManager;

                console.log(`🔍 依存関係チェック #${attempts}: 
                    TableRender: ${hasTableRender ? '✅' : '❌'}
                    TableInteract: ${hasTableInteract ? '✅' : '❌'}
                    TableHeader: ${hasTableHeader ? '✅' : '❌'}
                    Pagination: ${hasPagination ? '✅' : '❌'}`);

                if (hasTableRender && hasTableInteract && hasTableHeader && hasPagination) {
                    console.log('✅ 分割モジュール読み込み完了');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ 依存関係読み込みタイムアウト - 利用可能なモジュールで続行');
                    resolve();
                } else {
                    setTimeout(checkModules, 100);
                }
            };
            checkModules();
        });
    }

    // レガシー互換性確保とグローバルインスタンス作成
    async function initializeTableIntegration() {
        await waitForModules();

        // グローバルインスタンス作成（レガシー互換性）
        window.paginationManager = new window.PaginationManager();
        window.paginationUI = new window.PaginationUIManager(window.paginationManager);

        console.log('✅ Table機能統合初期化完了');

        // 🚀 テーブル作成を実行（ヘッダー・検索行のみ）
        if (window.LedgerV2?.TableHeader?.TableCreator) {
            try {
                await window.LedgerV2.TableHeader.TableCreator.createTable();
                console.log('✅ テーブル作成完了（ヘッダー・検索行のみ）');
            } catch (error) {
                console.error('❌ テーブル作成エラー:', error);
            }
        } else {
            console.warn('⚠️ table-header.js未読み込み - TableCreatorが見つかりません');
        }
    }

    // 初期化実行 - DOMContentLoadedまたはloadイベント後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTableIntegration);
    } else {
        // DOMが既に読み込まれている場合は即座に実行
        initializeTableIntegration();
    }

})(); 