/**
 * 🎨 統合台帳システム v2 - モーダルインラインスタイル
 * @description kintoneアプリ内でモーダルスタイルを直接埋め込み
 * @version 2.0.0
 */
(function() {
    'use strict';

    // =============================================================================
    // 🎨 インラインスタイル注入
    // =============================================================================

    // function injectModalStyles() {
    //     // 既にスタイルが注入されている場合はスキップ
    //     if (document.querySelector('#ledger-modal-styles')) {
    //         return;
    //     }

    //     const style = document.createElement('style');
    //     style.id = 'ledger-modal-styles';
    //     style.textContent = `
// /* =============================================================================
//    🎨 統合台帳システム v2 - モーダルUI スタイル（インライン版）
//    ============================================================================= */

// .ledger-modal-overlay {
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     background-color: rgba(0, 0, 0, 0.6);
//     z-index: 10000;
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     opacity: 0;
//     visibility: hidden;
//     transition: all 0.3s ease;
// }

// // .ledger-modal-overlay.show {
// //     opacity: 1;
// //     visibility: visible;
// // }

// .ledger-modal {
//     background: white;
//     border-radius: 12px;
//     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//     max-width: 90vw;
//     height: 85vh;
//     overflow: hidden;
//     transform: scale(0.9) translateY(-20px);
//     transition: all 0.3s ease;
//     display: flex;
//     flex-direction: column;
// }

// .ledger-modal-overlay.show .ledger-modal {
//     transform: scale(1) translateY(0);
// }

// .ledger-modal-header {
//     background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
//     color: white;
//     padding: 20px 30px;
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     border-bottom: 3px solid #45a049;
// }

// .ledger-modal-header.warning {
//     background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
//     border-bottom-color: #f57c00;
// }

// .ledger-modal-header.error {
//     background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
//     border-bottom-color: #d32f2f;
// }

// .ledger-modal-header.info {
//     background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
//     border-bottom-color: #1976d2;
// }

// .ledger-modal-title {
//     font-size: 20px;
//     font-weight: 600;
//     margin: 0;
// }

// .ledger-modal-close {
//     background: none;
//     border: none;
//     color: white;
//     font-size: 24px;
//     cursor: pointer;
//     padding: 5px;
//     border-radius: 50%;
//     width: 35px;
//     height: 35px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: background-color 0.2s;
// }

// .ledger-modal-close:hover {
//     background-color: rgba(255, 255, 255, 0.2);
// }

// .ledger-modal-body {
//     padding: 20px 30px;
//     flex: 1;
//     overflow: hidden;
//     display: flex;
//     flex-direction: column;
// }

// .ledger-modal-section {
//     margin-bottom: 25px;
// }

// .ledger-modal-section:last-child {
//     margin-bottom: 0;
// }

// .ledger-modal-section-title {
//     font-size: 16px;
//     font-weight: 600;
//     color: #333;
//     margin-bottom: 12px;
//     padding-bottom: 8px;
//     border-bottom: 2px solid #e0e0e0;
// }

// .ledger-stats-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//     gap: 15px;
//     margin-top: 15px;
// }

// .ledger-stats-card {
//     background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
//     border: 1px solid #dee2e6;
//     border-radius: 8px;
//     padding: 15px;
//     text-align: center;
// }

// .ledger-stats-card.seat {
//     border-left: 4px solid #4caf50;
// }

// .ledger-stats-card.pc {
//     border-left: 4px solid #2196f3;
// }

// .ledger-stats-card.ext {
//     border-left: 4px solid #f44336;
// }

// .ledger-stats-card.user {
//     border-left: 4px solid #ff9800;
// }

// .ledger-stats-card.success {
//     background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 100%);
//     border: 1px solid #4caf50;
// }

// .ledger-stats-card.error {
//     background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
//     border: 1px solid #f44336;
// }

// .ledger-stats-title {
//     font-size: 14px;
//     font-weight: 600;
//     color: #555;
//     margin-bottom: 8px;
// }

// // .ledger-stats-value {
// //     font-size: 24px;
// //     font-weight: 700;
// //     color: #333;
// // }

// .ledger-stats-unit {
//     font-size: 12px;
//     color: #666;
//     margin-left: 2px;
// }

// .ledger-preview-container {
//     flex: 1;
//     overflow-y: auto;
//     border: 1px solid #ddd;
//     border-radius: 6px;
//     margin-top: 8px;
//     min-height: 200px;
// }

// .ledger-preview-table {
//     width: 100%;
//     border-collapse: collapse;
//     font-size: 13px;
//     margin: 0;
// }

// .ledger-preview-table th,
// .ledger-preview-table td {
//     padding: 8px 12px;
//     text-align: left;
//     border-bottom: 1px solid #ddd;
//     border-right: 1px solid #ddd;
// }

// .ledger-preview-table th:last-child,
// .ledger-preview-table td:last-child {
//     border-right: none;
// }

// .ledger-preview-table th {
//     background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
//     font-weight: 600;
//     color: #555;
//     font-size: 12px;
//     white-space: nowrap;
//     position: sticky;
//     top: 0;
//     z-index: 1;
// }

// .ledger-preview-table tr:nth-child(even) {
//     background-color: #f9f9f9;
// }

// .ledger-preview-table tr:hover {
//     background-color: #e3f2fd;
// }

// .ledger-preview-table tbody tr:last-child td {
//     border-bottom: none;
// }

// .ledger-preview-table .row-number-header {
//     width: 50px;
//     text-align: center;
//     background: linear-gradient(135deg, #e8e8e8 0%, #d5d5d5 100%);
//     font-weight: 700;
// }

// .ledger-preview-table .row-number-cell {
//     width: 50px;
//     text-align: center;
//     background-color: #f8f9fa;
//     font-weight: 600;
//     color: #666;
//     font-size: 12px;
// }

// .preview-info {
//     background-color: #e1f5fe;
//     border: 1px solid #b3e5fc;
//     border-radius: 4px;
//     padding: 8px 12px;
//     margin: 10px 0;
//     font-size: 12px;
//     color: #0277bd;
// }

// .ledger-progress-container {
//     margin: 20px 0;
// }

// .ledger-progress-bar {
//     width: 100%;
//     height: 20px;
//     background-color: #e0e0e0;
//     border-radius: 10px;
//     overflow: hidden;
//     position: relative;
//     margin-bottom: 10px;
// }

// .ledger-progress-fill {
//     height: 100%;
//     background: linear-gradient(90deg, #4caf50 0%, #45a049 100%);
//     border-radius: 10px;
//     width: 0%;
//     transition: width 0.3s ease;
// }

// .ledger-progress-text {
//     text-align: center;
//     font-size: 14px;
//     color: #666;
//     margin-top: 5px;
// }

// .ledger-current-task {
//     font-size: 16px;
//     font-weight: 500;
//     color: #333;
//     text-align: center;
//     margin: 15px 0;
//     padding: 10px;
//     background-color: #f0f8ff;
//     border-radius: 6px;
//     border-left: 4px solid #2196f3;
// }

// .ledger-result-summary {
//     display: grid;
//     grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//     gap: 15px;
//     margin: 20px 0;
// }

// .ledger-result-card {
//     padding: 15px;
//     border-radius: 8px;
//     text-align: center;
// }

// .ledger-result-title {
//     font-size: 14px;
//     font-weight: 600;
//     margin-bottom: 8px;
// }

// .ledger-result-value {
//     font-size: 20px;
//     font-weight: 700;
// }

// .ledger-error-details {
//     background-color: #fff5f5;
//     border: 1px solid #fed7d7;
//     border-radius: 6px;
//     padding: 15px;
//     margin-top: 15px;
// }

// .ledger-error-title {
//     font-size: 14px;
//     font-weight: 600;
//     color: #c53030;
//     margin-bottom: 10px;
// }

// .ledger-error-list {
//     list-style: none;
//     padding: 0;
//     margin: 0;
// }

// .ledger-error-item {
//     padding: 5px 0;
//     border-bottom: 1px solid #fed7d7;
//     color: #744210;
// }

// .ledger-error-item:last-child {
//     border-bottom: none;
// }

// .ledger-modal-footer {
//     padding: 20px 30px;
//     background-color: #f8f9fa;
//     border-top: 1px solid #dee2e6;
//     display: flex;
//     justify-content: flex-end;
//     gap: 12px;
// }

// .ledger-modal-btn {
//     padding: 10px 20px;
//     border: none;
//     border-radius: 6px;
//     font-size: 14px;
//     font-weight: 500;
//     cursor: pointer;
//     transition: all 0.2s ease;
//     min-width: 100px;
// }

// .ledger-modal-btn:hover {
//     transform: translateY(-1px);
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
// }

// .ledger-modal-btn.primary {
//     background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
//     color: white;
// }

// .ledger-modal-btn.secondary {
//     background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
//     color: white;
// }

// .ledger-modal-btn.danger {
//     background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
//     color: white;
// }

// .ledger-modal-btn:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//     transform: none;
// }

// .ledger-modal-btn:disabled:hover {
//     transform: none;
//     box-shadow: none;
// }

// @media (max-width: 768px) {
//     .ledger-modal {
//         max-width: 95vw;
//         margin: 20px;
//     }
    
//     .ledger-modal-header {
//         padding: 15px 20px;
//     }
    
//     .ledger-modal-body {
//         padding: 20px;
//     }
    
//     .ledger-modal-footer {
//         padding: 15px 20px;
//         flex-direction: column;
//     }
    
//     .ledger-stats-grid {
//         grid-template-columns: 1fr;
//     }
    
//     .ledger-result-summary {
//         grid-template-columns: 1fr;
//     }
// }
//         `;

//         document.head.appendChild(style);
//         console.log('✅ モーダル用インラインスタイルを注入しました');
//     }

    // =============================================================================
    // 🌐 グローバル公開
    // =============================================================================

    //window.LedgerV2 = window.LedgerV2 || {};
    //window.LedgerV2.injectModalStyles = injectModalStyles;

    // 自動でスタイルを注入
    //if (document.readyState === 'loading') {
    //     document.addEventListener('DOMContentLoaded', injectModalStyles);
    // } else {
    //     injectModalStyles();
    // }

    // console.log('🎨 モーダルインラインスタイル初期化完了');

})(); 