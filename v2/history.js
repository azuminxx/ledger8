/* =============================================================================
   更新履歴管理システム - メインJavaScript
   ============================================================================= */

(function() {
    'use strict';

    // =============================================================================
    // 🎨 CSS埋め込み処理
    // =============================================================================
    
    /**
     * 履歴管理システム専用CSSを動的に追加
     */
    function injectHistoryCSS() {
        // 既にCSSが追加されている場合はスキップ
        if (document.getElementById('history-system-css')) {
            return;
        }
        
        const css = `
/* 履歴管理システム専用スタイル */
body[data-page="history"] {
    margin: 0 !important;
    padding: 0 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    background-color: #f8f9fa !important;
    color: #333 !important;
    line-height: 1.6 !important;
}

body[data-page="history"] .main-header {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    padding: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
}

body[data-page="history"] .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    max-width: 1400px;
    margin: 0 auto;
}

body[data-page="history"] .system-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

body[data-page="history"] .main-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
}

body[data-page="history"] .stats-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

body[data-page="history"] .stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    display: flex;
    align-items: center;
    gap: 16px;
}

body[data-page="history"] .stat-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

body[data-page="history"] .stat-content {
    flex: 1;
}

body[data-page="history"] .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #1976d2;
    line-height: 1.2;
}

body[data-page="history"] .stat-label {
    font-size: 14px;
    color: #6c757d;
    font-weight: 500;
    margin-top: 4px;
}

body[data-page="history"] .filter-panel {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 24px;
}

body[data-page="history"] .filter-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

body[data-page="history"] .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

body[data-page="history"] .filter-label {
    font-size: 14px;
    font-weight: 600;
    color: #495057;
}

body[data-page="history"] .radio-group {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
}

body[data-page="history"] .radio-option {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
}

body[data-page="history"] .table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

body[data-page="history"] .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;
}

body[data-page="history"] .history-table {
    width: 100%;
    border-collapse: collapse;
}

body[data-page="history"] .history-table th,
body[data-page="history"] .history-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
}

body[data-page="history"] .history-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
}

body[data-page="history"] .history-table tbody tr:hover {
    background: #f8f9fa;
}

body[data-page="history"] .header-btn,
body[data-page="history"] .action-btn,
body[data-page="history"] .operation-btn,
body[data-page="history"] .btn {
    padding: 8px 16px;
    border: 1px solid #ced4da;
    background: white;
    color: #495057;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

body[data-page="history"] .header-btn:hover,
body[data-page="history"] .action-btn:hover,
body[data-page="history"] .operation-btn:hover,
body[data-page="history"] .btn:hover {
    background: #f8f9fa;
    border-color: #adb5bd;
}

body[data-page="history"] .header-btn.primary,
body[data-page="history"] .btn.primary {
    background: #1976d2;
    color: white;
    border-color: #1976d2;
}

body[data-page="history"] .header-btn.primary:hover,
body[data-page="history"] .btn.primary:hover {
    background: #1565c0;
    border-color: #1565c0;
}

body[data-page="history"] .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

body[data-page="history"] .status-badge.not-required {
    background: #e9ecef;
    color: #6c757d;
}

body[data-page="history"] .status-badge.pending {
    background: #fff3cd;
    color: #856404;
}

body[data-page="history"] .status-badge.in-progress {
    background: #cce5ff;
    color: #0056b3;
}

body[data-page="history"] .status-badge.completed {
    background: #d4edda;
    color: #155724;
}

body[data-page="history"] .status-badge.overdue {
    background: #f8d7da;
    color: #721c24;
}

body[data-page="history"] .modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
}

body[data-page="history"] .modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
}

body[data-page="history"] .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e9ecef;
    background: #f8f9fa;
}

body[data-page="history"] .modal-body {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
}

body[data-page="history"] .form-input,
body[data-page="history"] .form-textarea,
body[data-page="history"] .filter-select,
body[data-page="history"] .date-input,
body[data-page="history"] .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 14px;
}

body[data-page="history"] .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 24px;
    border-top: 1px solid #e9ecef;
    background: #f8f9fa;
    min-height: 108px;
    box-sizing: border-box;
}

body[data-page="history"] .pagination-info {
    font-size: 16px;
    color: #495057;
    font-weight: 500;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

body[data-page="history"] .pagination-info .info-label {
    font-size: 14px;
    color: #6c757d;
    font-weight: 400;
}

body[data-page="history"] .pagination-info .info-value {
    font-size: 18px;
    color: #1976d2;
    font-weight: 600;
}

body[data-page="history"] .pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

body[data-page="history"] .search-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-top: 20px;
    border-top: 1px solid #e9ecef;
}

body[data-page="history"] .search-group {
    display: flex;
    gap: 8px;
    flex: 1;
    max-width: 400px;
}

body[data-page="history"] .date-range {
    display: flex;
    align-items: center;
    gap: 8px;
}

body[data-page="history"] .date-separator {
    color: #6c757d;
    font-weight: 500;
}

body[data-page="history"] .table-wrapper {
    overflow-x: auto;
}

body[data-page="history"] .table-actions {
    display: flex;
    gap: 12px;
}

body[data-page="history"] .header-right {
    display: flex;
    gap: 12px;
    align-items: center;
}

body[data-page="history"] .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    opacity: 0.9;
}

body[data-page="history"] .breadcrumb-link {
    color: white;
    text-decoration: none;
}

body[data-page="history"] .breadcrumb-separator {
    opacity: 0.7;
}

body[data-page="history"] .breadcrumb-current {
    font-weight: 500;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    body[data-page="history"] .header-content {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
    }
    
    body[data-page="history"] .stats-panel {
        grid-template-columns: 1fr;
    }
    
    body[data-page="history"] .filter-section {
        grid-template-columns: 1fr;
    }
    
    body[data-page="history"] .search-section {
        flex-direction: column;
        align-items: stretch;
    }
}
        `;
        
        const style = document.createElement('style');
        style.id = 'history-system-css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // =============================================================================
    // 🌐 グローバル変数
    // =============================================================================
    
    let historyData = [];
    let filteredData = [];
    let currentPage = 1;
    let itemsPerPage = 50;
    let sortColumn = 'update_date';
    let sortDirection = 'desc';
    let selectedRows = new Set();
    let currentUser = null;
    let userTeam = null;

    // DOM要素
    const elements = {};

    // =============================================================================
    // 🚀 初期化
    // =============================================================================

    /**
     * システム初期化
     */
    function initHistorySystem() {
        console.log('📋 更新履歴管理システム初期化開始');
        
        // 履歴管理システムのページかどうかを判定
        if (!isHistoryPage()) {
            console.log('ℹ️ 履歴管理システムページではないため、初期化をスキップします');
            return;
        }
        
        try {
            // CSSを動的に追加
            injectHistoryCSS();
            
            // bodyタグに履歴システム識別属性を追加
            document.body.setAttribute('data-page', 'history');
            document.body.classList.add('history-system-page');
            
            initDOMElements();
            setupEventListeners();
            initializeFilters();
            loadHistoryData();
        } catch (error) {
            console.error('❌ 更新履歴管理システム初期化エラー:', error);
            return;
        }
        
        console.log('✅ 更新履歴管理システム初期化完了');
    }

    /**
     * 履歴管理システムのページかどうかを判定
     */
    function isHistoryPage() {
        // 履歴管理システム専用の要素が存在するかチェック
        return document.getElementById('history-table') !== null ||
               document.querySelector('.stats-panel') !== null ||
               document.title.includes('更新履歴管理システム');
    }

    /**
     * DOM要素を取得
     */
    function initDOMElements() {
        // 必須要素の存在チェック
        const requiredElements = ['history-table', 'history-table-body', 'stats-panel'];
        for (const elementId of requiredElements) {
            if (!document.getElementById(elementId) && !document.querySelector(`.${elementId}`)) {
                throw new Error(`必須要素が見つかりません: ${elementId}`);
            }
        }
        
        elements.refreshBtn = document.getElementById('refresh-btn');
        elements.exportBtn = document.getElementById('export-btn');
        elements.backToMainBtn = document.getElementById('back-to-main-btn');
        
        // 統計要素
        elements.totalUpdates = document.getElementById('total-updates');
        elements.pendingApplications = document.getElementById('pending-applications');
        elements.completedApplications = document.getElementById('completed-applications');
        elements.overdueApplications = document.getElementById('overdue-applications');
        
        // フィルタ要素
        elements.viewScopeRadios = document.querySelectorAll('input[name="view-scope"]');
        elements.dateFrom = document.getElementById('date-from');
        elements.dateTo = document.getElementById('date-to');
        elements.ledgerFilter = document.getElementById('ledger-filter');
        elements.applicationStatusFilter = document.getElementById('application-status-filter');
        elements.searchInput = document.getElementById('search-input');
        elements.searchBtn = document.getElementById('search-btn');
        elements.clearFiltersBtn = document.getElementById('clear-filters-btn');
        
        // テーブル要素
        elements.historyTable = document.getElementById('history-table');
        elements.historyTableBody = document.getElementById('history-table-body');
        elements.selectAllCheckbox = document.getElementById('select-all-checkbox');
        elements.bulkApplicationBtn = document.getElementById('bulk-application-btn');
        elements.markCompletedBtn = document.getElementById('mark-completed-btn');
        
        // ページネーション要素
        elements.paginationInfoText = document.getElementById('pagination-info-text');
        elements.prevPageBtn = document.getElementById('prev-page-btn');
        elements.nextPageBtn = document.getElementById('next-page-btn');
        elements.pageNumbers = document.getElementById('page-numbers');
        
        // モーダル要素
        elements.applicationModal = document.getElementById('application-modal');
        elements.applicationModalClose = document.getElementById('application-modal-close');
        elements.applicationNumber = document.getElementById('application-number');
        elements.applicationDeadline = document.getElementById('application-deadline');
        elements.applicationNotes = document.getElementById('application-notes');
        elements.applicationCancelBtn = document.getElementById('application-cancel-btn');
        elements.applicationSaveBtn = document.getElementById('application-save-btn');
        
        elements.detailModal = document.getElementById('detail-modal');
        elements.detailModalClose = document.getElementById('detail-modal-close');
        elements.detailModalBody = document.getElementById('detail-modal-body');
        elements.detailCloseBtn = document.getElementById('detail-close-btn');
        
        elements.loadingOverlay = document.getElementById('loading-overlay');
    }

    /**
     * イベントリスナーを設定
     */
    function setupEventListeners() {
        // ヘッダーボタン
        elements.refreshBtn.addEventListener('click', handleRefresh);
        elements.exportBtn.addEventListener('click', handleExport);
        elements.backToMainBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        // フィルタ
        elements.viewScopeRadios.forEach(radio => {
            radio.addEventListener('change', handleViewScopeChange);
        });
        elements.dateFrom.addEventListener('change', applyFilters);
        elements.dateTo.addEventListener('change', applyFilters);
        elements.ledgerFilter.addEventListener('change', applyFilters);
        elements.applicationStatusFilter.addEventListener('change', applyFilters);
        elements.searchInput.addEventListener('input', debounce(applyFilters, 300));
        elements.searchBtn.addEventListener('click', applyFilters);
        elements.clearFiltersBtn.addEventListener('click', clearFilters);
        
        // テーブル
        elements.selectAllCheckbox.addEventListener('change', handleSelectAll);
        elements.bulkApplicationBtn.addEventListener('click', handleBulkApplication);
        elements.markCompletedBtn.addEventListener('click', handleMarkCompleted);
        
        // ソート
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', handleSort);
        });
        
        // ページネーション
        elements.prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
        elements.nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
        
        // モーダル
        elements.applicationModalClose.addEventListener('click', closeApplicationModal);
        elements.applicationCancelBtn.addEventListener('click', closeApplicationModal);
        elements.applicationSaveBtn.addEventListener('click', saveApplicationInfo);
        
        elements.detailModalClose.addEventListener('click', closeDetailModal);
        elements.detailCloseBtn.addEventListener('click', closeDetailModal);
        
        // モーダル外クリックで閉じる
        elements.applicationModal.addEventListener('click', (e) => {
            if (e.target === elements.applicationModal) closeApplicationModal();
        });
        elements.detailModal.addEventListener('click', (e) => {
            if (e.target === elements.detailModal) closeDetailModal();
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * フィルタを初期化
     */
    function initializeFilters() {
        // 今日の日付を設定
        const today = new Date();
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        elements.dateFrom.value = oneMonthAgo.toISOString().split('T')[0];
        elements.dateTo.value = today.toISOString().split('T')[0];
        
        // 現在のユーザー情報を取得（実際の実装では認証システムから取得）
        currentUser = kintone.getLoginUser().name || 'Unknown User';
        userTeam = 'デフォルトチーム'; // 実際の実装ではユーザー情報から取得
    }

    // =============================================================================
    // 📊 データ管理
    // =============================================================================

    /**
     * 履歴データを読み込み
     */
    async function loadHistoryData() {
        showLoading(true);
        
        try {
            // 実際の実装では履歴台帳アプリからデータを取得
            // 現在はサンプルデータを生成
            historyData = await fetchHistoryData();
            
            applyFilters();
            updateStatistics();
            
        } catch (error) {
            console.error('❌ 履歴データの読み込みに失敗:', error);
            showError('履歴データの読み込みに失敗しました。');
        } finally {
            showLoading(false);
        }
    }

    /**
     * 履歴データを取得（サンプル実装）
     */
    async function fetchHistoryData() {
        // 実際の実装では kintone API を使用
        return new Promise((resolve) => {
            setTimeout(() => {
                const sampleData = generateSampleHistoryData();
                resolve(sampleData);
            }, 1000);
        });
    }

    /**
     * サンプル履歴データを生成
     */
    function generateSampleHistoryData() {
        const data = [];
        const ledgerTypes = ['SEAT', 'PC', 'EXT', 'USER'];
        const users = ['田中太郎', '佐藤花子', '鈴木一郎', '高橋美咲', currentUser];
        const statuses = ['not_required', 'pending', 'in_progress', 'completed', 'overdue'];
        
        for (let i = 0; i < 200; i++) {
            const updateDate = new Date();
            updateDate.setDate(updateDate.getDate() - Math.floor(Math.random() * 90));
            
            const ledgerType = ledgerTypes[Math.floor(Math.random() * ledgerTypes.length)];
            const updater = users[Math.floor(Math.random() * users.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const record = {
                id: `hist_${i + 1}`,
                update_date: updateDate.toISOString(),
                updater: updater,
                ledger_type: ledgerType,
                record_key: generateRecordKey(ledgerType),
                changes: generateSampleChanges(ledgerType),
                application_status: status,
                application_number: status !== 'not_required' && Math.random() > 0.5 ? `APP-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}` : '',
                application_deadline: status === 'pending' || status === 'in_progress' ? generateDeadline() : '',
                notes: Math.random() > 0.7 ? 'システム更新に伴う変更' : ''
            };
            
            data.push(record);
        }
        
        return data.sort((a, b) => new Date(b.update_date) - new Date(a.update_date));
    }

    /**
     * レコードキーを生成
     */
    function generateRecordKey(ledgerType) {
        const keys = {
            'SEAT': () => `A-${Math.floor(Math.random() * 100) + 1}`,
            'PC': () => `PCAIT23N${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
            'EXT': () => String(Math.floor(Math.random() * 9000) + 1000),
            'USER': () => `user${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
        };
        
        return keys[ledgerType] ? keys[ledgerType]() : 'UNKNOWN';
    }

    /**
     * サンプル変更内容を生成
     */
    function generateSampleChanges(ledgerType) {
        const changes = {
            'SEAT': [
                { field: 'ユーザーID', old: 'user001', new: 'user002' },
                { field: 'PC番号', old: 'PCAIT23N0001', new: 'PCAIT23N0002' }
            ],
            'PC': [
                { field: 'PC用途', old: '個人専用', new: 'CO/TOブース' }
            ],
            'EXT': [
                { field: '電話機種別', old: 'ビジネス', new: 'ACD' }
            ],
            'USER': [
                { field: 'ユーザー名', old: '旧名前', new: '新名前' }
            ]
        };
        
        return changes[ledgerType] || [];
    }

    /**
     * 申請期限を生成
     */
    function generateDeadline() {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 30) + 1);
        return deadline.toISOString().split('T')[0];
    }

    // =============================================================================
    // 🔍 フィルタリング・検索
    // =============================================================================

    /**
     * フィルタを適用
     */
    function applyFilters() {
        let filtered = [...historyData];
        
        // 表示範囲フィルタ
        const viewScope = document.querySelector('input[name="view-scope"]:checked').value;
        if (viewScope === 'my') {
            filtered = filtered.filter(record => record.updater === currentUser);
        } else if (viewScope === 'team') {
            // 実際の実装ではチームメンバーのリストを使用
            filtered = filtered.filter(record => record.updater !== currentUser);
        }
        
        // 日付範囲フィルタ
        const dateFrom = elements.dateFrom.value;
        const dateTo = elements.dateTo.value;
        
        if (dateFrom) {
            filtered = filtered.filter(record => 
                new Date(record.update_date) >= new Date(dateFrom)
            );
        }
        
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(record => 
                new Date(record.update_date) <= endDate
            );
        }
        
        // 台帳種別フィルタ
        const ledgerType = elements.ledgerFilter.value;
        if (ledgerType) {
            filtered = filtered.filter(record => record.ledger_type === ledgerType);
        }
        
        // 申請状況フィルタ
        const applicationStatus = elements.applicationStatusFilter.value;
        if (applicationStatus) {
            filtered = filtered.filter(record => record.application_status === applicationStatus);
        }
        
        // 検索フィルタ
        const searchTerm = elements.searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(record => {
                return (
                    record.record_key.toLowerCase().includes(searchTerm) ||
                    record.application_number.toLowerCase().includes(searchTerm) ||
                    record.changes.some(change => 
                        change.field.toLowerCase().includes(searchTerm) ||
                        change.old.toLowerCase().includes(searchTerm) ||
                        change.new.toLowerCase().includes(searchTerm)
                    ) ||
                    record.notes.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        filteredData = filtered;
        currentPage = 1;
        selectedRows.clear();
        
        sortData();
        renderTable();
        updatePagination();
        updateActionButtons();
    }

    /**
     * フィルタをクリア
     */
    function clearFilters() {
        elements.dateFrom.value = '';
        elements.dateTo.value = '';
        elements.ledgerFilter.value = '';
        elements.applicationStatusFilter.value = '';
        elements.searchInput.value = '';
        
        document.querySelector('input[name="view-scope"][value="my"]').checked = true;
        
        applyFilters();
    }

    /**
     * 表示範囲変更ハンドラ
     */
    function handleViewScopeChange() {
        applyFilters();
    }

    // =============================================================================
    // 📋 テーブル表示
    // =============================================================================

    /**
     * データをソート
     */
    function sortData() {
        filteredData.sort((a, b) => {
            let aValue = a[sortColumn];
            let bValue = b[sortColumn];
            
            // 日付の場合
            if (sortColumn === 'update_date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }
            
            // 文字列の場合
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            let result = 0;
            if (aValue < bValue) result = -1;
            if (aValue > bValue) result = 1;
            
            return sortDirection === 'desc' ? -result : result;
        });
    }

    /**
     * テーブルを描画
     */
    function renderTable() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        elements.historyTableBody.innerHTML = '';
        
        pageData.forEach(record => {
            const row = createTableRow(record);
            elements.historyTableBody.appendChild(row);
        });
        
        // 全選択チェックボックスの状態を更新
        updateSelectAllCheckbox();
    }

    /**
     * テーブル行を作成
     */
    function createTableRow(record) {
        const row = document.createElement('tr');
        row.dataset.recordId = record.id;
        
        if (selectedRows.has(record.id)) {
            row.classList.add('selected');
        }
        
        row.innerHTML = `
            <td class="checkbox-col">
                <input type="checkbox" class="row-checkbox" ${selectedRows.has(record.id) ? 'checked' : ''}>
            </td>
            <td>${formatDateTime(record.update_date)}</td>
            <td>${record.updater}</td>
            <td>${getLedgerDisplayName(record.ledger_type)}</td>
            <td>${record.record_key}</td>
            <td>${formatChanges(record.changes)}</td>
            <td>${createStatusBadge(record.application_status)}</td>
            <td>${record.application_number || '-'}</td>
            <td>${record.application_deadline ? formatDate(record.application_deadline) : '-'}</td>
            <td>
                <button class="operation-btn detail-btn" data-record-id="${record.id}">詳細</button>
                ${record.application_status !== 'not_required' && record.application_status !== 'completed' ? 
                    `<button class="operation-btn primary application-btn" data-record-id="${record.id}">申請登録</button>` : 
                    ''
                }
            </td>
        `;
        
        // イベントリスナーを追加
        const checkbox = row.querySelector('.row-checkbox');
        checkbox.addEventListener('change', (e) => handleRowSelect(e, record.id));
        
        const detailBtn = row.querySelector('.detail-btn');
        detailBtn.addEventListener('click', () => showDetailModal(record));
        
        const applicationBtn = row.querySelector('.application-btn');
        if (applicationBtn) {
            applicationBtn.addEventListener('click', () => showApplicationModal(record));
        }
        
        return row;
    }

    /**
     * 日時をフォーマット
     */
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * 日付をフォーマット
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
    }

    /**
     * 台帳表示名を取得
     */
    function getLedgerDisplayName(ledgerType) {
        const names = {
            'SEAT': '座席台帳',
            'PC': 'PC台帳',
            'EXT': '内線台帳',
            'USER': 'ユーザー台帳'
        };
        return names[ledgerType] || ledgerType;
    }

    /**
     * 変更内容をフォーマット
     */
    function formatChanges(changes) {
        if (!changes || changes.length === 0) return '-';
        
        return changes.map(change => 
            `${change.field}: ${change.old} → ${change.new}`
        ).join('<br>');
    }

    /**
     * 申請状況バッジを作成
     */
    function createStatusBadge(status) {
        const statusInfo = {
            'not_required': { text: '申請不要', icon: '➖' },
            'pending': { text: '未申請', icon: '⏳' },
            'in_progress': { text: '申請中', icon: '🔄' },
            'completed': { text: '申請完了', icon: '✅' },
            'overdue': { text: '期限超過', icon: '⚠️' }
        };
        
        const info = statusInfo[status] || { text: '不明', icon: '❓' };
        return `<span class="status-badge ${status}">${info.icon} ${info.text}</span>`;
    }

    // =============================================================================
    // 📊 統計情報
    // =============================================================================

    /**
     * 統計情報を更新
     */
    function updateStatistics() {
        const stats = calculateStatistics();
        
        elements.totalUpdates.textContent = stats.total.toLocaleString();
        elements.pendingApplications.textContent = stats.pending.toLocaleString();
        elements.completedApplications.textContent = stats.completed.toLocaleString();
        elements.overdueApplications.textContent = stats.overdue.toLocaleString();
    }

    /**
     * 統計情報を計算
     */
    function calculateStatistics() {
        const total = filteredData.length;
        const pending = filteredData.filter(r => r.application_status === 'pending').length;
        const completed = filteredData.filter(r => r.application_status === 'completed').length;
        const overdue = filteredData.filter(r => {
            if (r.application_status !== 'pending' && r.application_status !== 'in_progress') return false;
            if (!r.application_deadline) return false;
            return new Date(r.application_deadline) < new Date();
        }).length;
        
        return { total, pending, completed, overdue };
    }

    // =============================================================================
    // 🎯 イベントハンドラ
    // =============================================================================

    /**
     * データ更新ハンドラ
     */
    function handleRefresh() {
        loadHistoryData();
    }

    /**
     * データエクスポートハンドラ
     */
    function handleExport() {
        try {
            const csvData = generateCSV(filteredData);
            downloadCSV(csvData, `更新履歴_${new Date().toISOString().split('T')[0]}.csv`);
            showSuccess('データをエクスポートしました。');
        } catch (error) {
            console.error('❌ エクスポートエラー:', error);
            showError('エクスポートに失敗しました。');
        }
    }

    /**
     * ソートハンドラ
     */
    function handleSort(e) {
        const column = e.currentTarget.dataset.sort;
        
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'desc';
        }
        
        // ソートアイコンを更新
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted');
            const icon = header.querySelector('.sort-icon');
            icon.textContent = '↕️';
        });
        
        e.currentTarget.classList.add('sorted');
        const icon = e.currentTarget.querySelector('.sort-icon');
        icon.textContent = sortDirection === 'asc' ? '↑' : '↓';
        
        sortData();
        renderTable();
    }

    /**
     * 行選択ハンドラ
     */
    function handleRowSelect(e, recordId) {
        const row = e.target.closest('tr');
        
        if (e.target.checked) {
            selectedRows.add(recordId);
            row.classList.add('selected');
        } else {
            selectedRows.delete(recordId);
            row.classList.remove('selected');
        }
        
        updateSelectAllCheckbox();
        updateActionButtons();
    }

    /**
     * 全選択ハンドラ
     */
    function handleSelectAll(e) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        const rows = document.querySelectorAll('#history-table-body tr');
        
        if (e.target.checked) {
            checkboxes.forEach((checkbox, index) => {
                checkbox.checked = true;
                const recordId = rows[index].dataset.recordId;
                selectedRows.add(recordId);
                rows[index].classList.add('selected');
            });
        } else {
            checkboxes.forEach((checkbox, index) => {
                checkbox.checked = false;
                const recordId = rows[index].dataset.recordId;
                selectedRows.delete(recordId);
                rows[index].classList.remove('selected');
            });
        }
        
        updateActionButtons();
    }

    /**
     * 一括申請登録ハンドラ
     */
    function handleBulkApplication() {
        if (selectedRows.size === 0) {
            showError('申請登録する項目を選択してください。');
            return;
        }
        
        const selectedRecords = filteredData.filter(record => selectedRows.has(record.id));
        const applicableRecords = selectedRecords.filter(record => 
            record.application_status !== 'not_required' && record.application_status !== 'completed'
        );
        
        if (applicableRecords.length === 0) {
            showError('申請可能な項目がありません。');
            return;
        }
        
        showBulkApplicationModal(applicableRecords);
    }

    /**
     * 完了マークハンドラ
     */
    function handleMarkCompleted() {
        if (selectedRows.size === 0) {
            showError('完了マークする項目を選択してください。');
            return;
        }
        
        if (confirm(`選択した${selectedRows.size}件を申請完了としてマークしますか？`)) {
            markAsCompleted(Array.from(selectedRows));
        }
    }

    /**
     * キーボードショートカットハンドラ
     */
    function handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'r':
                    e.preventDefault();
                    handleRefresh();
                    break;
                case 'e':
                    e.preventDefault();
                    handleExport();
                    break;
                case 'f':
                    e.preventDefault();
                    elements.searchInput.focus();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            closeApplicationModal();
            closeDetailModal();
        }
    }

    // =============================================================================
    // 📄 ページネーション
    // =============================================================================

    /**
     * ページネーションを更新
     */
    function updatePagination() {
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
        
        // 情報テキストを更新
        if (totalItems === 0) {
            elements.paginationInfoText.textContent = '0件';
        } else {
            elements.paginationInfoText.textContent = 
                `${startIndex.toLocaleString()}-${endIndex.toLocaleString()} / ${totalItems.toLocaleString()}件`;
        }
        
        // ボタンの状態を更新
        elements.prevPageBtn.disabled = currentPage <= 1;
        elements.nextPageBtn.disabled = currentPage >= totalPages;
        
        // ページ番号を生成
        generatePageNumbers(totalPages);
    }

    /**
     * ページ番号を生成
     */
    function generatePageNumbers(totalPages) {
        elements.pageNumbers.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => changePage(i));
            elements.pageNumbers.appendChild(pageBtn);
        }
    }

    /**
     * ページを変更
     */
    function changePage(page) {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        currentPage = page;
        renderTable();
        updatePagination();
        
        // テーブルの先頭にスクロール
        elements.historyTable.scrollIntoView({ behavior: 'smooth' });
    }

    // =============================================================================
    // 🔧 ユーティリティ関数
    // =============================================================================

    /**
     * 全選択チェックボックスを更新
     */
    function updateSelectAllCheckbox() {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
        
        if (checkedCount === 0) {
            elements.selectAllCheckbox.indeterminate = false;
            elements.selectAllCheckbox.checked = false;
        } else if (checkedCount === checkboxes.length) {
            elements.selectAllCheckbox.indeterminate = false;
            elements.selectAllCheckbox.checked = true;
        } else {
            elements.selectAllCheckbox.indeterminate = true;
            elements.selectAllCheckbox.checked = false;
        }
    }

    /**
     * アクションボタンを更新
     */
    function updateActionButtons() {
        const hasSelection = selectedRows.size > 0;
        elements.bulkApplicationBtn.disabled = !hasSelection;
        elements.markCompletedBtn.disabled = !hasSelection;
    }

    /**
     * CSVデータを生成
     */
    function generateCSV(data) {
        const headers = [
            '更新日時', '更新者', '台帳種別', 'レコードキー', '更新内容',
            '申請状況', '申請番号', '申請期限', '備考'
        ];
        
        const rows = data.map(record => [
            formatDateTime(record.update_date),
            record.updater,
            getLedgerDisplayName(record.ledger_type),
            record.record_key,
            record.changes.map(c => `${c.field}: ${c.old} → ${c.new}`).join('; '),
            getStatusText(record.application_status),
            record.application_number || '',
            record.application_deadline ? formatDate(record.application_deadline) : '',
            record.notes || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        
        return '\uFEFF' + csvContent; // BOM付きUTF-8
    }

    /**
     * CSVファイルをダウンロード
     */
    function downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * 申請状況テキストを取得
     */
    function getStatusText(status) {
        const statusTexts = {
            'not_required': '申請不要',
            'pending': '未申請',
            'in_progress': '申請中',
            'completed': '申請完了',
            'overdue': '期限超過'
        };
        return statusTexts[status] || '不明';
    }

    /**
     * デバウンス関数
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * ローディング表示制御
     */
    function showLoading(show) {
        elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    /**
     * エラー表示
     */
    function showError(message) {
        alert(`エラー: ${message}`);
    }

    /**
     * 成功メッセージ表示
     */
    function showSuccess(message) {
        alert(`成功: ${message}`);
    }

    // =============================================================================
    // 🔍 モーダル機能
    // =============================================================================

    /**
     * 申請登録モーダルを表示
     */
    function showApplicationModal(record) {
        elements.applicationNumber.value = record.application_number || '';
        elements.applicationDeadline.value = record.application_deadline || '';
        elements.applicationNotes.value = record.notes || '';
        
        elements.applicationModal.dataset.recordId = record.id;
        elements.applicationModal.style.display = 'block';
        elements.applicationNumber.focus();
    }

    /**
     * 申請登録モーダルを閉じる
     */
    function closeApplicationModal() {
        elements.applicationModal.style.display = 'none';
        elements.applicationModal.removeAttribute('data-record-id');
        
        // フォームをクリア
        elements.applicationNumber.value = '';
        elements.applicationDeadline.value = '';
        elements.applicationNotes.value = '';
    }

    /**
     * 申請情報を保存
     */
    async function saveApplicationInfo() {
        const recordId = elements.applicationModal.dataset.recordId;
        const applicationNumber = elements.applicationNumber.value.trim();
        const applicationDeadline = elements.applicationDeadline.value;
        const notes = elements.applicationNotes.value.trim();
        
        if (!applicationNumber) {
            showError('申請番号を入力してください。');
            return;
        }
        
        try {
            showLoading(true);
            
            // 実際の実装では kintone API を使用してデータを更新
            await updateApplicationInfo(recordId, {
                application_number: applicationNumber,
                application_deadline: applicationDeadline,
                application_status: 'in_progress',
                notes: notes
            });
            
            // ローカルデータを更新
            const record = historyData.find(r => r.id === recordId);
            if (record) {
                record.application_number = applicationNumber;
                record.application_deadline = applicationDeadline;
                record.application_status = 'in_progress';
                record.notes = notes;
            }
            
            closeApplicationModal();
            applyFilters();
            updateStatistics();
            showSuccess('申請情報を登録しました。');
            
        } catch (error) {
            console.error('❌ 申請情報保存エラー:', error);
            showError('申請情報の保存に失敗しました。');
        } finally {
            showLoading(false);
        }
    }

    /**
     * 詳細モーダルを表示
     */
    function showDetailModal(record) {
        elements.detailModalBody.innerHTML = createDetailContent(record);
        elements.detailModal.style.display = 'block';
    }

    /**
     * 詳細モーダルを閉じる
     */
    function closeDetailModal() {
        elements.detailModal.style.display = 'none';
    }

    /**
     * 詳細コンテンツを作成
     */
    function createDetailContent(record) {
        return `
            <div class="detail-section">
                <h4 class="detail-section-title">基本情報</h4>
                <div class="detail-grid">
                    <div class="detail-label">更新日時:</div>
                    <div class="detail-value">${formatDateTime(record.update_date)}</div>
                    <div class="detail-label">更新者:</div>
                    <div class="detail-value">${record.updater}</div>
                    <div class="detail-label">台帳種別:</div>
                    <div class="detail-value">${getLedgerDisplayName(record.ledger_type)}</div>
                    <div class="detail-label">レコードキー:</div>
                    <div class="detail-value">${record.record_key}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4 class="detail-section-title">更新内容</h4>
                <ul class="change-list">
                    ${record.changes.map(change => `
                        <li class="change-item">
                            <div class="change-field">${change.field}</div>
                            <div class="change-values">
                                <span class="old-value">${change.old}</span> → 
                                <span class="new-value">${change.new}</span>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="detail-section">
                <h4 class="detail-section-title">申請情報</h4>
                <div class="detail-grid">
                    <div class="detail-label">申請状況:</div>
                    <div class="detail-value">${createStatusBadge(record.application_status)}</div>
                    <div class="detail-label">申請番号:</div>
                    <div class="detail-value">${record.application_number || '-'}</div>
                    <div class="detail-label">申請期限:</div>
                    <div class="detail-value">${record.application_deadline ? formatDate(record.application_deadline) : '-'}</div>
                    <div class="detail-label">備考:</div>
                    <div class="detail-value">${record.notes || '-'}</div>
                </div>
            </div>
        `;
    }

    // =============================================================================
    // 🔄 データ更新機能
    // =============================================================================

    /**
     * 申請情報を更新（サンプル実装）
     */
    async function updateApplicationInfo(recordId, updateData) {
        // 実際の実装では kintone API を使用
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('申請情報更新:', recordId, updateData);
                resolve();
            }, 500);
        });
    }

    /**
     * 完了マークを設定
     */
    async function markAsCompleted(recordIds) {
        try {
            showLoading(true);
            
            // 実際の実装では kintone API を使用
            await Promise.all(recordIds.map(id => 
                updateApplicationInfo(id, { application_status: 'completed' })
            ));
            
            // ローカルデータを更新
            recordIds.forEach(id => {
                const record = historyData.find(r => r.id === id);
                if (record) {
                    record.application_status = 'completed';
                }
            });
            
            selectedRows.clear();
            applyFilters();
            updateStatistics();
            showSuccess(`${recordIds.length}件を申請完了としてマークしました。`);
            
        } catch (error) {
            console.error('❌ 完了マーク設定エラー:', error);
            showError('完了マークの設定に失敗しました。');
        } finally {
            showLoading(false);
        }
    }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    // 履歴管理システムをグローバルに公開
    window.HistorySystem = {
        init: initHistorySystem,
        loadData: loadHistoryData,
        applyFilters: applyFilters,
        exportData: handleExport
    };

    // DOM読み込み完了後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHistorySystem);
    } else {
        initHistorySystem();
    }

    console.log('✅ 更新履歴管理システム JavaScript 読み込み完了');

})(); 