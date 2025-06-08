// =============================================================================
// 📊 API・データ管理モジュール (api-data-manager.js)
// =============================================================================
// main.jsから分離されたテーブルデータ管理とAPI通信処理
// 作成日: 2025年1月31日
// Phase 5: API・データ統合モジュール分離
// =============================================================================

(function () {
  "use strict";

  // グローバル行番号カウンター（固有行番号管理）
  let globalRowCounter = 1;

  /**
   * 📋 テーブルデータ管理クラス
   * レコード表示、API通信、テーブル操作を担当
   */
  class TableDataManager {
    constructor() {
      this.table = document.getElementById("my-table"); // 必要に応じて使用
      this.draggedElement = null; // ドラッグ中の要素を保持
      this.showRowNumbers = true; // 行番号表示フラグ
      
      // fieldOrderのキャッシュ（セル移動処理による破損を防ぐ）
      this._cachedFieldOrder = null;
      this._isProcessingCellExchange = false;
      
      // セル移動処理の監視を設定
      this._setupCellExchangeMonitoring();
      
      // HTMLに直接記載されているか確認
      const tbody = document.getElementById("my-tbody");
      if (!tbody) {
        console.warn("⚠️ my-tbody要素が見つかりません。HTMLに直接記載されているか確認してください。");
      }
    }

    /**
     * セル移動処理の監視を設定
     */
    _setupCellExchangeMonitoring() {
      const setupHooks = () => {
        // CellExchangeManagerのexecuteメソッドをフック
        if (window.CellExchangeManager && typeof window.CellExchangeManager.execute === 'function') {
          const originalExecute = window.CellExchangeManager.execute;
          window.CellExchangeManager.execute = (sourceData, targetData) => {
            //console.log('🔒 セル移動処理開始 - fieldOrderキャッシュモードON');
            this._isProcessingCellExchange = true;
            
            try {
              const result = originalExecute.call(window.CellExchangeManager, sourceData, targetData);
              
              // Promiseの場合
              if (result && typeof result.then === 'function') {
                return result.finally(() => {
                  this._isProcessingCellExchange = false;
                  //console.log('🔓 セル移動処理完了 - fieldOrderキャッシュモードOFF');
                });
              } else {
                // 同期処理の場合
                this._isProcessingCellExchange = false;
                //console.log('🔓 セル移動処理完了 - fieldOrderキャッシュモードOFF');
                return result;
              }
            } catch (error) {
              this._isProcessingCellExchange = false;
              //console.log('🔓 セル移動処理エラー終了 - fieldOrderキャッシュモードOFF');
              throw error;
            }
          };
        }

        // _separateFieldToNewRowメソッドもフック
        if (window.CellExchangeManager && typeof window.CellExchangeManager._separateFieldToNewRow === 'function') {
          const originalSeparate = window.CellExchangeManager._separateFieldToNewRow;
          window.CellExchangeManager._separateFieldToNewRow = async (field, record, currentRow) => {
            //console.log('🔒 分離処理開始 - fieldOrderキャッシュモードON');
            this._isProcessingCellExchange = true;
            
            try {
              const result = await originalSeparate.call(window.CellExchangeManager, field, record, currentRow);
              return result;
            } finally {
              this._isProcessingCellExchange = false;
              //console.log('🔓 分離処理完了 - fieldOrderキャッシュモードOFF');
            }
          };
        }
      };

      // 即座に設定を試行
      setupHooks();

      // CellExchangeManagerが後から読み込まれる場合に備えて遅延初期化
      if (!window.CellExchangeManager) {
        let retryCount = 0;
        const retrySetup = () => {
          if (window.CellExchangeManager && retryCount < 10) {
            setupHooks();
            //console.log('🔧 CellExchangeManager遅延フック設定完了');
          } else if (retryCount < 10) {
            retryCount++;
            setTimeout(retrySetup, 500);
          }
        };
        setTimeout(retrySetup, 100);
      }
    }

    // 固有行番号生成メソッド
    generateRowId() {
      const currentId = globalRowCounter;
      globalRowCounter++;
      return currentId;
    }

    // 行番号列をヘッダーに追加
    addRowNumberHeader() {
      const headerRow = document.getElementById("my-thead-row");
      const categoryRow = document.getElementById("my-category-row");
      const filterRow = document.getElementById("my-filter-row");
      
      if (!headerRow || !categoryRow) return;

      // カテゴリー行に追加
      const categoryTh = document.createElement("th");
      categoryTh.textContent = "管理";
      categoryTh.style.backgroundColor = "#f0f0f0";
      categoryTh.style.border = "1px solid #ccc";
      categoryTh.style.textAlign = "center";
      categoryTh.style.fontWeight = "bold";
      categoryTh.style.fontSize = "12px";
      categoryTh.style.padding = "4px";
      categoryTh.style.width = "60px";
      categoryTh.style.minWidth = "60px";
      categoryRow.insertBefore(categoryTh, categoryRow.firstChild);

      // フィールド行に追加
      const headerTh = document.createElement("th");
      headerTh.textContent = "行番号";
      headerTh.style.backgroundColor = "#f0f0f0";
      headerTh.style.border = "1px solid #ccc";
      headerTh.style.textAlign = "center";
      headerTh.style.fontWeight = "bold";
      headerTh.style.fontSize = "12px";
      headerTh.style.padding = "4px";
      headerTh.style.width = "60px";
      headerTh.style.minWidth = "60px";
      headerRow.insertBefore(headerTh, headerRow.firstChild);

      // フィルター行に追加
      if (filterRow) {
        const filterTd = document.createElement("td");
        filterTd.style.backgroundColor = "#f8f9fa";
        filterTd.style.border = "1px solid #ccc";
        filterTd.style.width = "60px";
        filterTd.style.minWidth = "60px";
        filterTd.innerHTML = "&nbsp;"; // 空白
        filterRow.insertBefore(filterTd, filterRow.firstChild);
      }
    }

    /**
     * テーブルをクリア
     */
    clear() {
      const tbody = document.getElementById("my-tbody");
      if (tbody) {
        //console.log('🧹 テーブルクリア開始');
        
        // クリア前の状態を記録
        const beforeState = this._getTableStateBeforeClear(tbody);
        
        // テーブル内容をクリア
        tbody.innerHTML = "";
        
        // 🎯 行番号ベース状態管理をクリア
        this._clearRowBasedStates(beforeState);
        
        // 行番号カウンターをリセット
        globalRowCounter = 1;
        
        //console.log('🧹 テーブルクリア完了:', {
          //クリア前行数: beforeState.totalRows,
          //クリア前行番号ベース状態: beforeState.rowBasedStates,
          // 🗑️ 削除: 統合キーベース状態（行番号ベースに移行済み）
       // });
      }
    }

    /**
     * 🔍 テーブルクリア前の状態取得
     * @param {HTMLElement} tbody - テーブルボディ要素
     */
    _getTableStateBeforeClear(tbody) {
      const rows = Array.from(tbody.querySelectorAll("tr"));
      const rowsWithId = rows.filter(row => row.getAttribute("data-row-id"));
      
      let rowBasedStates = 0;
      
      if (window.cellStateManager) {
        rowBasedStates = window.cellStateManager.rowInitialStates.size;
      }
      
      return {
        totalRows: rows.length,
        rowsWithId: rowsWithId.length,
        rowBasedStates: rowBasedStates,
        timestamp: new Date().toISOString()
      };
    }

    /**
     * 🎯 行番号ベース状態管理をクリア
     * @param {Object} beforeState - クリア前の状態情報
     */
    _clearRowBasedStates(beforeState) {
      if (!window.cellStateManager) return;

      //console.log('🎯 行番号ベース状態クリア開始:', beforeState);

      // 🎯 行番号ベース状態をクリア
      window.cellStateManager.rowInitialStates.clear();
      window.cellStateManager.rowStates.clear();
      window.cellStateManager.rowChanges.clear();
      window.cellStateManager.rowHistory.clear();
      window.cellStateManager.rowSeparatedFields.clear();

      // 🔄 統合キーベース状態もクリア（後方互換性）
      // 🗑️ 削除済み: initialStates.clear() - 統合キーベース初期状態管理
      // 🗑️ 削除済み: separatedFields.clear() - 統合キーベース分離フィールド管理
      // 🗑️ 削除済み: recordIds.clear() - 統合キーベースレコードID管理（コメントアウト済み）
      
      // セルレベル状態もクリア
      window.cellStateManager.modifiedCells.clear();

      //console.log('🎯 行番号ベース状態クリア完了:', {
      //  行番号ベース初期状態: window.cellStateManager.rowInitialStates.size,
      //  行番号ベース分離フィールド: window.cellStateManager.rowSeparatedFields.size,
      //  // 🗑️ 削除: 統合キーベース初期状態（行番号ベースに移行済み）
      //  変更セル数: window.cellStateManager.modifiedCells.size
      //});
    }

    /**
     * 検索結果を表示
     */
    displayResults(records, selectedLedger, targetAppId, isAppend = true) {
      const tbody = document.getElementById("my-tbody");
      if (!tbody) {
        console.error("❌ my-tbody要素が見つかりません。HTMLに直接記載されているか確認してください。");
        return;
      }

      // 🔍 デバッグ: tbody変更監視
      this._setupTbodyDebugMonitor(tbody);

      // 新規表示の場合は行番号カウンターを1にリセット
      if (!isAppend) {
        globalRowCounter = 1;
      }

      const existingKeys = this._getExistingRecordIds(tbody, isAppend);

      if (records.length === 0 && !isAppend) {
        this._displayNoResults(tbody);
        return;
      }

      const fieldOrder = this._getFieldOrder();
      this._renderRecords(
        tbody,
        records,
        existingKeys,
        fieldOrder,
        selectedLedger,
        targetAppId
      );

      // 🎯 レンダリング後に行番号ベース初期状態を保存
      this._saveRowBasedInitialStatesForNewRows(tbody);

      // ✅ レンダリング後にチェックボックス状態を一括更新
      if (records.length > 0 && window.TableElementFactory && typeof window.TableElementFactory.updateAllModificationCheckboxes === 'function') {
        setTimeout(() => {
          window.TableElementFactory.updateAllModificationCheckboxes(tbody);
        }, 50);
      }

      // 🎨 レンダリング後にテーブルをCSS化
      if (records.length > 0 && window.StyleManager) {
        setTimeout(() => {
          window.StyleManager.convertTableToCSS();
        }, 100);
      }

      // 🔍 オートフィルタ機能を初期化
      if (records.length > 0 && window.autoFilterManager) {
        setTimeout(() => {
          window.autoFilterManager.initialize();
        }, 150);
      }
    }

    /**
     * 既存レコードIDを取得
     */
    _getExistingRecordIds(tbody, isAppend) {
      const existingKeys = new Map();
      if (isAppend) {
        Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
          // 統合キーの属性を確認
          const integrationKey = row.getAttribute("data-integration-key");
          if (integrationKey) {
            existingKeys.set(integrationKey, true);
          }
        });
      } else {
        tbody.innerHTML = "";
      }
      return existingKeys;
    }

    /**
     * 結果なしメッセージを表示
     */
    _displayNoResults(tbody) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = fieldsConfig.length;
      td.textContent = "検索結果が見つかりませんでした";
      td.style.textAlign = "center";
      td.style.padding = "20px";
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    /**
     * フィールド順序を取得
     */
    _getFieldOrder() {
      // セル移動処理中はキャッシュされたfieldOrderを使用
      if (this._isProcessingCellExchange && this._cachedFieldOrder) {
        //console.log(`🔒 セル移動処理中のため、キャッシュされたfieldOrderを使用: ${this._cachedFieldOrder.length}個`);
        return [...this._cachedFieldOrder];
      }
      
      const fieldOrder = [];
      const headerRow = document.getElementById("my-thead-row");
      
      //console.log(`🔍 _getFieldOrder 開始 - ヘッダー行:`, headerRow);
      
      if (headerRow) {
        const headerChildren = Array.from(headerRow.children);
        //console.log(`🔍 ヘッダー行の子要素数: ${headerChildren.length}`);
        
        headerChildren.forEach((th, index) => {
          const rawFieldLabel = th.textContent;
          // オートフィルタによる "▼" を除去して正規化
          const fieldLabel = rawFieldLabel.replace(/▼$/, '');
          
          //console.log(`🔍 ヘッダー[${index}]: "${rawFieldLabel}" → 正規化: "${fieldLabel}"`);
          
          const field = fieldsConfig.find((f) => f.label === fieldLabel);
          if (field) {
            fieldOrder.push(field.fieldCode);
            //onsole.log(`✅ フィールド追加: ${field.fieldCode}`);
          } else {
            console.log(`⚠️ フィールド設定未発見: "${fieldLabel}" (元: "${rawFieldLabel}")`);
          }
        });
      } else {
        console.error(`❌ ヘッダー行が見つかりません: my-thead-row`);
      }
      
      // 正常に17個のフィールドが取得できた場合はキャッシュに保存
      if (fieldOrder.length === 17) {
        this._cachedFieldOrder = [...fieldOrder];
        //console.log(`💾 fieldOrderをキャッシュに保存: ${fieldOrder.length}個`);
      }
      
      //console.log(`🔍 _getFieldOrder 完了 - 取得したフィールド数: ${fieldOrder.length}`);
      //console.log(`🔍 取得したフィールド:`, fieldOrder);
      
      return fieldOrder;
    }

    /**
     * レコードをレンダリング
     */
    _renderRecords(
      tbody,
      records,
      existingKeys,
      fieldOrder,
      selectedLedger,
      targetAppId
    ) {
      let addedCount = 0;
      const newRows = []; // 新しく追加される行を追跡

      records.forEach((record, index) => {
        let recordKey = "";

        // 統合レコードの場合
        if (record.isIntegratedRecord) {
          recordKey = record.integrationKey;
        } else {
          // 従来のレコードの場合
          const recordId = record.$id.value;
          const ledgerType = record.$ledger_type?.value || selectedLedger || "";
          recordKey = `${recordId}_${ledgerType}`;
        }

        // 重複チェック
        if (existingKeys.has(recordKey)) {
          return; // 重複レコードはスキップ
        }

        const tr = document.createElement("tr");
        
        // 固有行番号を生成・設定
        const rowId = this.generateRowId();
        tr.setAttribute('data-row-id', rowId);

        // 🎯 縞模様はSimpleHighlightManagerで後で設定

        // 🎯 パフォーマンス改善: 軽量モードではドラッグ&ドロップを無効化
        if (!window.TableEditMode || !window.TableEditMode.isLightweightMode()) {
          // 主キーフィールドでセルドラッグが有効かチェック
          const hasCellDragFields = fieldsConfig.some(
            (field) => field.allowCellDragDrop
          );

          // セルドラッグが有効でない場合のみ行ドラッグを有効化
          if (!hasCellDragFields) {
            tr.draggable = true;
            tr.style.cursor = "move";
            // ドラッグ&ドロップイベントを設定
            this._setupRowDragAndDrop(tr);
          }
        } else {
          // 軽量モードではドラッグを無効化
          tr.draggable = false;
          tr.style.cursor = "default";
        }

        // 統合レコードの場合は統合キーを属性として保存
        if (record.isIntegratedRecord) {
          tr.setAttribute("data-integration-key", recordKey);
        } else {
          tr.setAttribute("data-record-key", recordKey);
        }

        let createdCellCount = 0;
        
        // fieldOrderの状態をデバッグ
        //console.log(`🔍 fieldOrder の現在の状態:`, fieldOrder);
        //console.log(`🔍 fieldOrder の長さ: ${fieldOrder.length}`);
        //console.log(`🔍 fieldOrder の最初の3要素:`, fieldOrder.slice(0, 3));
        
        // fieldOrder配列のディープコピーを作成（参照の変更を防ぐ）
        const safeFieldOrder = [...fieldOrder];
        //console.log(`🔧 フィールド順序を安全にコピー: ${safeFieldOrder.length}個のフィールド`);
        
        safeFieldOrder.forEach((fieldCode, index) => {
          //console.log(`🔧 セル作成開始: ${index + 1}/${safeFieldOrder.length} - ${fieldCode}`);
          
          const field = fieldsConfig.find((f) => f.fieldCode === fieldCode);
          if (!field) {
            console.warn(`⚠️ フィールド設定が見つかりません: ${fieldCode}`);
            return;
          }

          try {
            const value = FieldValueProcessor.process(
              record,
              field.fieldCode,
              selectedLedger
            );

            // ファクトリーを安全に取得（複数のソースから試行）
            const factory = window.TableElementFactory || window.TableComponentsFactory;
            
            let td = null;
            
            if (factory) {
              try {
                // 🎯 パフォーマンス改善: モード別セル作成切り替え
                if (window.TableEditMode && window.TableEditMode.isLightweightMode()) {
                  // 軽量モード: プレーンテキストセルのみ作成
                  if (typeof factory.createLightweightCell === 'function') {
                    td = factory.createLightweightCell(field, value, record, targetAppId);
                    //console.log(`🚀 軽量セル作成成功: ${fieldCode}`);
                  } else {
                    // フォールバック: 通常セル作成
                    td = factory.createCell(field, value, record, targetAppId);
                  }
                } else {
                  // 通常モード: 従来の重いセル作成
                  if (typeof factory.createCell === 'function') {
                    td = factory.createCell(field, value, record, targetAppId);
                    //console.log(`✅ セル作成成功: ${fieldCode} - TD:${!!td}`);
                  }
                }
              } catch (error) {
                console.error("❌ セル作成でエラーが発生:", {
                  error: error,
                  fieldCode: fieldCode,
                  field: field,
                  value: value,
                  record: record,
                  targetAppId: targetAppId,
                  lightweightMode: window.TableEditMode?.isLightweightMode()
                });
                td = null;
              }
            } else {
              console.warn("⚠️ TableElementFactory が利用できません:", {
                fieldCode: fieldCode,
                windowTableElementFactory: !!window.TableElementFactory,
                windowTableComponentsFactory: !!window.TableComponentsFactory,
                factoryType: typeof factory
              });
            }

            // セル作成に成功した場合
            if (td && td instanceof Node) {
              tr.appendChild(td);
              createdCellCount++;
              //console.log(`✅ セル追加完了: ${fieldCode} - 累計:${createdCellCount}`);
            } else {
              // フォールバック: 基本的なセルを作成
              console.warn(`⚠️ フォールバックセル作成: ${fieldCode}`);
              const fallbackTd = document.createElement("td");
              fallbackTd.textContent = value || "";
              fallbackTd.setAttribute("data-field-code", field.fieldCode);
              
              // 基本的なスタイル設定
              fallbackTd.style.border = "1px solid #ccc";
              fallbackTd.style.padding = "4px";
              fallbackTd.style.fontSize = "11px";
              if (field.width) {
                fallbackTd.style.width = field.width;
                fallbackTd.style.minWidth = field.width;
                fallbackTd.style.maxWidth = field.width;
              }
              
              tr.appendChild(fallbackTd);
              createdCellCount++;
              //console.log(`⚠️ フォールバックセル追加: ${fieldCode} - 累計:${createdCellCount}`);
            }
          } catch (error) {
            console.error(`❌ セル作成で致命的エラー: ${fieldCode}`, error);
            // エラーが発生した場合もforEachを継続
          }
        });

        //console.log(`📊 行作成完了: 行ID=${rowId}, セル数=${createdCellCount}/${safeFieldOrder.length}`);

        tbody.appendChild(tr);
        
        //console.log(`✅ 新しい行を追加: 行ID=${rowId}, セル数=${tr.children.length}, 統合キー=${recordKey}`);
        
        // 行番号セルの値を更新（行がDOMに追加された後）
        //console.log(`🔍 行番号セル検索開始: 行ID=${rowId}`);
        
        const rowNumberCell = tr.querySelector('.row-number-cell');
       // console.log(`🔍 行番号セル検索結果:`, rowNumberCell);
        
        if (rowNumberCell) {
          rowNumberCell.textContent = rowId;
          //console.log(`✅ 行番号セル更新完了: 行ID=${rowId}`);
        } else {
          console.warn(`⚠️ 行番号セルが見つかりません: 行ID=${rowId}`);
          
          // 代替検索を試行
          const alternativeCell = tr.querySelector('[data-field-code="_row_number"]');
          //console.log(`🔍 代替検索結果:`, alternativeCell);
          
          if (alternativeCell) {
            alternativeCell.textContent = rowId;
            //console.log(`✅ 代替セルで行番号更新: 行ID=${rowId}`);
          } else {
            // 作成されたセルの詳細をログ出力
            // console.log(`🔍 作成されたセルの詳細調査:`);
            // Array.from(tr.children).forEach((cell, index) => {
            //   console.log(`  セル${index + 1}:`, {
            //     fieldCode: cell.getAttribute('data-field-code'),
            //     className: cell.className,
            //     textContent: cell.textContent?.substring(0, 20)
            //   });
            // });
          }
        }

        // ✅ チェックボックス状態を更新（行がDOMに追加された後）
        // 🎯 ユーザー要求により、チェックボックスは手動操作のみで制御
        // 自動更新は完全に無効化
        // if (!window.TableEditMode || !window.TableEditMode.isLightweightMode()) {
        //   if (window.TableElementFactory && typeof window.TableElementFactory.updateModificationCheckboxState === 'function') {
        //     window.TableElementFactory.updateModificationCheckboxState(tr);
        //   }
        // }
        
        newRows.push(tr); // 新しい行として追跡
        existingKeys.set(recordKey, true);
        addedCount++;
      });
    }

    /**
     * 🎯 新しく追加された行の行番号ベース初期状態を保存
     * @param {HTMLElement} tbody - テーブルボディ要素
     */
    _saveRowBasedInitialStatesForNewRows(tbody) {
      if (!window.cellStateManager) return;

      const rows = Array.from(tbody.querySelectorAll("tr[data-row-id]"));
      let newRowCount = 0;

      //console.log('🎯 テーブル更新後の初期状態保存開始:', {
      //  総行数: rows.length,
      //  既存初期状態数: window.cellStateManager.rowInitialStates.size
      //});

      rows.forEach((row, index) => {
        const rowId = row.getAttribute("data-row-id");
        const integrationKey = row.getAttribute("data-integration-key") || row.getAttribute("data-record-key");

        if (!rowId) {
          console.warn(`⚠️ 行番号がない行を検出 (${index + 1}行目)`);
          return;
        }

        // 🎯 行番号ベース初期状態チェック
        const hasRowInitialState = window.cellStateManager.rowInitialStates.has(rowId);
        
        if (!hasRowInitialState) {
          //console.log(`🆕 新規行の初期状態保存: 行番号=${rowId}`);
          
          // 行番号ベース初期状態を保存
          window.cellStateManager.saveRowInitialState(row, 'initial');
          newRowCount++;
          
          // 🗑️ 削除済み: 統合キーベース初期状態保存（行番号ベースに移行済み）
        //} else {
        //  console.log(`✅ 既存行の初期状態確認: 行番号=${rowId}`);
        }
      });

      //console.log('🎯 テーブル更新後の初期状態保存完了:', {
      //  新規保存行数: newRowCount,
      //  総初期状態数: window.cellStateManager.rowInitialStates.size
      //});

      // 🔍 整合性チェック（デバッグ用）
      this._checkTableUpdateIntegrity(tbody);
    }

    /**
     * 🔍 テーブル更新後の整合性チェック
     * @param {HTMLElement} tbody - テーブルボディ要素
     */
    _checkTableUpdateIntegrity(tbody) {
      if (!window.cellStateManager || !tbody) return;

      const rows = Array.from(tbody.querySelectorAll("tr[data-row-id]"));
      const issues = [];

      rows.forEach((row, index) => {
        const rowId = row.getAttribute("data-row-id");
        const integrationKey = row.getAttribute("data-integration-key") || row.getAttribute("data-record-key");

        // 行番号チェック
        if (!rowId) {
          issues.push(`行${index + 1}: 行番号未設定`);
          return;
        }

        // 行番号ベース初期状態チェック
        const hasRowInitialState = window.cellStateManager.rowInitialStates.has(rowId);
        if (!hasRowInitialState) {
          issues.push(`行番号${rowId}: 行番号ベース初期状態未保存`);
        }

        // 🗑️ 削除済み: 統合キーベース初期状態チェック（行番号ベースに移行済み）
      });

      if (issues.length > 0) {
        console.warn('⚠️ テーブル更新後の整合性問題:', issues);
      } else {
        console.log('✅ テーブル更新後の整合性確認完了');
      }

      return {
        totalRows: rows.length,
        issues: issues,
        isHealthy: issues.length === 0
      };
    }

    /**
     * 🎯 テーブル更新時の状態管理診断情報
     * @returns {Object} 診断情報
     */
    getTableUpdateDiagnostics() {
      const tbody = document.getElementById("my-tbody");
      if (!tbody) return { error: 'テーブルが見つかりません' };

      const rows = Array.from(tbody.querySelectorAll("tr"));
      const rowsWithId = rows.filter(row => row.getAttribute("data-row-id"));
      
      let rowBasedStates = 0;
      if (window.cellStateManager) {
        rowBasedStates = window.cellStateManager.rowInitialStates.size;
      }

      return {
        table: {
          totalRows: rows.length,
          rowsWithId: rowsWithId.length,
          coverage: Math.round((rowsWithId.length / rows.length) * 100)
        },
        states: {
          rowBasedStates: rowBasedStates,
          stateConsistency: rowBasedStates === rowsWithId.length ? '一致' : '不一致'
        },
        integrity: this._checkTableUpdateIntegrity(tbody),
        timestamp: new Date().toISOString()
      };
    }

    /**
     * 行のドラッグ&ドロップ機能を設定
     */
    _setupRowDragAndDrop(row) {
      // ドラッグ開始
      row.addEventListener("dragstart", (e) => {
        this.draggedElement = row;

        // ドラッグ中のクラスを追加
        row.classList.add("row-dragging");
        row.style.zIndex = "1000";
        row.style.position = "relative";

        e.dataTransfer.effectAllowed = "move";

        // ユニークな識別子を設定
        const identifier =
          row.getAttribute("data-integration-key") ||
          row.getAttribute("data-record-key") ||
          Date.now().toString();
        e.dataTransfer.setData("text/plain", identifier);
      });

      // ドラッグ終了
      row.addEventListener("dragend", (e) => {
        if (this.draggedElement) {
          // ドラッグクラスを削除して元のスタイルに戻す
          this.draggedElement.classList.remove("row-dragging");
          this.draggedElement.style.zIndex = "";
          this.draggedElement.style.position = "";
        }

        // すべてのドロップゾーン表示をクリア
        const allRows = document.querySelectorAll("#my-tbody tr");
        allRows.forEach((r) => {
          r.style.borderTop = "";
          r.style.borderBottom = "";
          r.removeAttribute("data-drop-position");
        });

        // ドラッグ完了後にdraggedElementをクリア
        setTimeout(() => {
          this.draggedElement = null;
        }, 100);
      });

      // ドラッグオーバー
      row.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";

        if (this.draggedElement && this.draggedElement !== row) {
          // ドロップ位置を視覚的に表示
          const rect = row.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;

          // すべての境界線をクリア
          const allRows = document.querySelectorAll("#my-tbody tr");
          allRows.forEach((r) => {
            r.style.borderTop = "";
            r.style.borderBottom = "";
            r.removeAttribute("data-drop-position");
          });

          if (e.clientY < midY) {
            row.style.borderTop = "3px solid #2196f3";
            row.setAttribute("data-drop-position", "before");
          } else {
            row.style.borderBottom = "3px solid #2196f3";
            row.setAttribute("data-drop-position", "after");
          }
        }
      });

      // ドロップ
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (this.draggedElement && this.draggedElement !== row) {
          const tbody = row.parentNode;
          const dropPosition = row.getAttribute("data-drop-position");

          // 行を移動
          if (dropPosition === "before") {
            tbody.insertBefore(this.draggedElement, row);
          } else if (dropPosition === "after") {
            const nextSibling = row.nextSibling;
            if (nextSibling) {
              tbody.insertBefore(this.draggedElement, nextSibling);
            } else {
              tbody.appendChild(this.draggedElement);
            }
          }

          // 行の背景色を再設定（縞模様を維持）
          this._updateRowStripePattern(tbody);
        }

        // ドロップ表示をクリア
        row.style.borderTop = "";
        row.style.borderBottom = "";
        row.removeAttribute("data-drop-position");
      });
    }

    /**
     * 行の縞模様を更新
     */
    _updateRowStripePattern(tbody) {
      // 🎯 新しいSimpleHighlightManagerを使用
      if (window.SimpleHighlightManager) {
        window.SimpleHighlightManager.updateStripePattern(tbody);
      } else {
        // フォールバック: 従来の方法
        const rows = Array.from(tbody.children).filter(
          (row) => row.style.display !== "none" && row.cells.length > 0
        );

        rows.forEach((row, index) => {
          // 分離された行は黄色背景を維持
          if (!row.getAttribute("data-separated")) {
            row.style.backgroundColor = index % 2 === 0 ? "#ffffff" : "#f5f5f5";
          }
        });
      }
    }

    /**
     * 🔍 デバッグ: tbody変更監視
     * @param {HTMLElement} tbody - 監視対象のtbody要素
     */
    _setupTbodyDebugMonitor(tbody) {
      if (tbody._debugMonitorSetup) return; // 重複設定を防止

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'TR') {
                const rowId = node.getAttribute('data-row-id');
                const integrationKey = node.getAttribute('data-integration-key');
                const cellCount = node.children.length;
                
                //console.log(`🔍 行追加検出: 行ID=${rowId || 'なし'}, セル数=${cellCount}, 統合キー=${integrationKey || 'なし'}`);
                
                // セル数が少ない場合は警告
                if (cellCount < 10) {
                  console.warn(`⚠️ セル数不足の行を検出: セル数=${cellCount}, 期待値=17`);
                  console.log('行のHTML:', node.outerHTML.substring(0, 200) + '...');
                }
              }
            });
          }
        });
      });

      observer.observe(tbody, { childList: true });
      tbody._debugMonitorSetup = true;
      //console.log('🔍 tbody変更監視を開始');
    }
  }

  // =============================================================================
  // 🌐 グローバル公開
  // =============================================================================

  // windowオブジェクトに公開してmain.jsから参照可能にする
  window.TableDataManager = TableDataManager;
  
  // 分離行作成で使用できるようにgenerateRowId関数をグローバルに公開
  window.generateRowId = function() {
    const currentId = globalRowCounter;
    globalRowCounter++;
    return currentId;
  };

  // 🎯 テーブル更新時状態管理のグローバル診断機能
  window.debugTableUpdateStates = function() {
    //console.log('🎯=== テーブル更新時状態管理診断 ===');
    
    const tbody = document.getElementById("my-tbody");
    if (!tbody) {
      console.log('❌ テーブルが見つかりません');
      return;
    }

    // TableDataManagerインスタンスの取得を試行
    let tableManager = null;
    if (window.TableDataManager) {
      tableManager = new window.TableDataManager();
    }

    if (tableManager && typeof tableManager.getTableUpdateDiagnostics === 'function') {
      const diagnostics = tableManager.getTableUpdateDiagnostics();
      
      //console.log('📊 テーブル状況:', {
      //  総行数: diagnostics.table.totalRows,
      //  行番号付き行数: diagnostics.table.rowsWithId,
      //  行番号カバー率: diagnostics.table.coverage + '%'
      //});

      //console.log('🎯 状態管理:', {
      //  行番号ベース状態数: diagnostics.states.rowBasedStates,
      //  整合性: diagnostics.states.stateConsistency
      //});

      //if (diagnostics.integrity && !diagnostics.integrity.isHealthy) {
      //  console.warn('⚠️ 整合性問題:', diagnostics.integrity.issues);
      //} else {
      //  console.log('✅ 整合性確認完了');
      //}

      //console.log('🎯=== 診断完了 ===');
      return diagnostics;
    } else {
      console.log('❌ TableDataManager診断機能が利用できません');
      return null;
    }
  };

  // 🎯 テーブル状態強制修復機能
  window.repairTableStates = function() {
    //console.log('🔧 テーブル状態強制修復開始');
    
    const tbody = document.getElementById("my-tbody");
    if (!tbody) {
      console.log('❌ テーブルが見つかりません');
      return;
    }

    if (!window.cellStateManager) {
      console.log('❌ CellStateManagerが利用できません');
      return;
    }

    const rows = Array.from(tbody.querySelectorAll("tr"));
    let repairedCount = 0;
    let addedRowIds = 0;

    rows.forEach((row, index) => {
      let rowId = row.getAttribute("data-row-id");
      
      // 行番号がない場合は設定
      if (!rowId) {
        rowId = String(index + 1);
        row.setAttribute("data-row-id", rowId);
        addedRowIds++;
        //console.log(`🔧 行番号設定: 行${index + 1} → ${rowId}`);
      }

      // 行番号ベース初期状態がない場合は保存
      if (!window.cellStateManager.rowInitialStates.has(rowId)) {
        window.cellStateManager.saveRowInitialState(row, 'initial');
        repairedCount++;
        //console.log(`🔧 初期状態修復: 行番号=${rowId}`);
      }
    });

    // console.log('🔧 テーブル状態強制修復完了:', {
    //   総行数: rows.length,
    //   行番号追加: addedRowIds,
    //   初期状態修復: repairedCount
    // });

    // 修復後の診断実行
    if (window.debugTableUpdateStates) {
      window.debugTableUpdateStates();
    }

    return {
      totalRows: rows.length,
      addedRowIds: addedRowIds,
      repairedStates: repairedCount
    };
  };

  // 🎯 テーブル状態リセット機能
  window.resetTableStates = function() {
    //console.log('🔄 テーブル状態リセット開始');
    
    if (!window.cellStateManager) {
      console.log('❌ CellStateManagerが利用できません');
      return;
    }

    // 状態をクリア
    const beforeRowStates = window.cellStateManager.rowInitialStates.size;
    // 🗑️ 削除: 統合キーベース状態参照（行番号ベースに移行済み）
    const beforeIntegrationStates = 0;

    window.cellStateManager.rowInitialStates.clear();
    window.cellStateManager.rowStates.clear();
    window.cellStateManager.rowChanges.clear();
    window.cellStateManager.rowHistory.clear();
    window.cellStateManager.rowSeparatedFields.clear();
    // 🗑️ 削除済み: initialStates.clear() - 統合キーベース初期状態管理
    // 🗑️ 削除済み: separatedFields.clear() - 統合キーベース分離フィールド管理
    window.cellStateManager.modifiedCells.clear();

    // console.log('🔄 テーブル状態リセット完了:', {
    //   削除前行番号ベース状態: beforeRowStates,
    //   削除前統合キーベース状態: beforeIntegrationStates,
    //   現在の状態数: window.cellStateManager.rowInitialStates.size
    // });

    // テーブルのハイライトもリセット
    const tbody = document.getElementById("my-tbody");
    if (tbody) {
      const modifiedElements = tbody.querySelectorAll('.cell-modified, .row-modified');
      modifiedElements.forEach(element => {
        element.classList.remove('cell-modified', 'row-modified');
      });
      // console.log(`🎨 ハイライトリセット: ${modifiedElements.length}個の要素`);
    }

    return {
      clearedRowStates: beforeRowStates,
      clearedIntegrationStates: beforeIntegrationStates
    };
  };
})();
