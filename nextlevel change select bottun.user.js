// ==UserScript==
// @name         NEXTLEVEL絞り込み改善 - インラインアコーディオン
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  e-nextlevel.jpの絞り込みUIを一括表示可能なアコーディオン形式に変更
// @author       You
// @match        https://www.e-nextlevel.jp/work/list
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[NEXTLEVEL Filter] スクリプト開始');

    // ページ読み込み完了を待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        console.log('[NEXTLEVEL Filter] 初期化開始');

        // 既存の絞り込みボタンエリアを検索
        // txtファイルから推測されるセレクタ
        const existingFilterBar = document.querySelector('.job-list__narrow-down-small') ||
                                  document.querySelector('.container > div[class*="narrow-down"]');

        if (!existingFilterBar) {
            console.warn('[NEXTLEVEL Filter] 絞り込みバーが見つかりません');
            // フォールバック: ページ上部に挿入
            insertFilterBar();
            return;
        }

        console.log('[NEXTLEVEL Filter] 既存の絞り込みバーを発見:', existingFilterBar);

        // 既存のフィルターバーを置き換え
        replaceFilterBar(existingFilterBar);
    }

    // 既存の絞り込みバーを置き換え
    function replaceFilterBar(oldBar) {
        // 新しいフィルターバーを作成
        const newFilterBar = createFilterBar();

        // 既存の要素を置き換え
        oldBar.parentNode.replaceChild(newFilterBar, oldBar);

        console.log('[NEXTLEVEL Filter] フィルターバーを置き換えました');

        // イベントリスナーを設定
        initializeEventListeners();
    }

    // フォールバック: ページ上部に挿入
    function insertFilterBar() {
        const newFilterBar = createFilterBar();
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(newFilterBar, container.firstChild);

        console.log('[NEXTLEVEL Filter] フィルターバーを挿入しました');

        initializeEventListeners();
    }

    // CSSスタイルを注入
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 絞り込みバー */
            .nl-filter-bar {
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 20px;
                overflow: hidden;
            }

            /* トリガーバー */
            .nl-filter-trigger {
                display: flex;
                align-items: center;
                padding: 16px 20px;
                background: #fff;
                cursor: pointer;
                transition: background 0.2s;
                gap: 12px;
                flex-wrap: wrap;
                border-bottom: 2px solid transparent;
            }

            .nl-filter-trigger:hover {
                background: #f9f9f9;
            }

            .nl-filter-trigger.active {
                background: #fff5f5;
                border-bottom-color: #e85050;
            }

            /* フィルターアイコン */
            .nl-filter-icon {
                width: 24px;
                height: 24px;
                background: #e85050;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 14px;
                flex-shrink: 0;
                transition: transform 0.3s;
            }

            .nl-filter-trigger.active .nl-filter-icon {
                transform: rotate(180deg);
            }

            /* サマリー */
            .nl-filter-summary {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                flex: 1;
                align-items: center;
            }

            .nl-summary-item {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: #f5f5f5;
                border-radius: 16px;
                font-size: 13px;
                color: #666;
            }

            .nl-summary-item.selected {
                background: #ffe5e5;
                color: #e85050;
                font-weight: 500;
            }

            .nl-summary-badge {
                background: #e85050;
                color: #fff;
                border-radius: 10px;
                padding: 2px 8px;
                font-size: 12px;
                min-width: 18px;
                text-align: center;
                font-weight: 600;
            }

            /* 展開コンテンツ */
            .nl-filter-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.4s ease-out;
                background: #fafafa;
            }

            .nl-filter-content.active {
                max-height: 1000px;
                transition: max-height 0.5s ease-in;
            }

            .nl-filter-content-inner {
                padding: 24px 20px;
            }

            /* グリッドレイアウト */
            .nl-filter-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 24px;
            }

            @media (min-width: 768px) {
                .nl-filter-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
            }

            /* フィルターグループ */
            .nl-filter-group {
                background: #fff;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
            }

            .nl-group-title {
                font-size: 14px;
                font-weight: 600;
                color: #333;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e85050;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .nl-group-badge {
                background: #e85050;
                color: #fff;
                border-radius: 10px;
                padding: 2px 8px;
                font-size: 11px;
                min-width: 18px;
                text-align: center;
            }

            /* チェックボックス */
            .nl-checkbox-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .nl-checkbox-item {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 6px;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .nl-checkbox-item:hover {
                background: #f5f5f5;
            }

            .nl-checkbox-item input[type="checkbox"],
            .nl-checkbox-item input[type="radio"] {
                display: none;
            }

            .nl-checkbox-custom {
                width: 18px;
                height: 18px;
                border: 2px solid #d0d0d0;
                border-radius: 3px;
                margin-right: 8px;
                position: relative;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .nl-checkbox-item input:checked + .nl-checkbox-custom {
                background: #e85050;
                border-color: #e85050;
            }

            .nl-checkbox-item input:checked + .nl-checkbox-custom::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-size: 12px;
                font-weight: bold;
            }

            .nl-checkbox-label {
                font-size: 13px;
                color: #333;
                line-height: 1.4;
            }

            /* アクションボタン */
            .nl-filter-actions {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .nl-btn {
                padding: 10px 24px;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .nl-btn-reset {
                background: #f5f5f5;
                color: #666;
            }

            .nl-btn-reset:hover {
                background: #e0e0e0;
            }

            .nl-btn-apply {
                background: #e85050;
                color: #fff;
            }

            .nl-btn-apply:hover {
                background: #d43f3f;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(232, 80, 80, 0.3);
            }

            @media (max-width: 767px) {
                .nl-filter-grid {
                    grid-template-columns: 1fr;
                }

                .nl-filter-summary {
                    font-size: 12px;
                }

                .nl-summary-item {
                    padding: 4px 10px;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('[NEXTLEVEL Filter] CSSを注入しました');
    }

    // フィルターバーHTMLを作成
    function createFilterBar() {
        const div = document.createElement('div');
        div.className = 'nl-filter-bar';
        div.innerHTML = `
            <div class="nl-filter-trigger" id="nlFilterTrigger">
                <div class="nl-filter-icon">▼</div>
                <div class="nl-filter-summary" id="nlFilterSummary">
                    <div class="nl-summary-item">
                        <span>エリア</span>
                    </div>
                    <div class="nl-summary-item">
                        <span>仕事の形態</span>
                    </div>
                    <div class="nl-summary-item">
                        <span>職種</span>
                    </div>
                    <div class="nl-summary-item">
                        <span>時間帯</span>
                    </div>
                    <div class="nl-summary-item">
                        <span>並び順: 新着順</span>
                    </div>
                </div>
            </div>
            <div class="nl-filter-content" id="nlFilterContent">
                <div class="nl-filter-content-inner">
                    <div class="nl-filter-grid">
                        <!-- エリア -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                エリア
                                <span class="nl-group-badge" style="display: none;">0</span>
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="site_pref[]" value="13">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">東京都</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="site_pref[]" value="14">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">神奈川県</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="site_pref[]" value="11">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">埼玉県</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="site_pref[]" value="12">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">千葉県</span>
                                </label>
                            </div>
                        </div>

                        <!-- 仕事の形態 -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                仕事の形態
                                <span class="nl-group-badge" style="display: none;">0</span>
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="work_style[]" value="1">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">日雇い</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="work_style[]" value="2">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">短期</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="work_style[]" value="3">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">長期</span>
                                </label>
                            </div>
                        </div>

                        <!-- 職種 -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                職種
                                <span class="nl-group-badge" style="display: none;">0</span>
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="big_category[]" value="1">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">軽作業</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="big_category[]" value="2">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">搬入・搬出</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="big_category[]" value="3">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">イベント</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="big_category[]" value="4">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">配送・ドライバー</span>
                                </label>
                            </div>
                        </div>

                        <!-- 開始時間帯 -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                開始時間帯
                                <span class="nl-group-badge" style="display: none;">0</span>
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="timeslots[]" value="1">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">深夜 00:00～05:00</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="timeslots[]" value="2">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">朝 05:00～12:00</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="timeslots[]" value="3">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">昼 12:00～17:00</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="timeslots[]" value="4">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">晩 17:00～24:00</span>
                                </label>
                            </div>
                        </div>

                        <!-- 勤務日数 -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                勤務日数
                                <span class="nl-group-badge" style="display: none;">0</span>
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="work_days[]" value="1">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">1日のみ</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="work_days[]" value="2">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">週1日～</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="work_days[]" value="3">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">週2～3日</span>
                                </label>
                            </div>
                        </div>

                        <!-- その他条件 -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                その他条件
                                <span class="nl-group-badge" style="display: none;">0</span>
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="conditions[]" value="entry">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">エントリー可</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="conditions[]" value="beginner">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">未経験OK</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="checkbox" name="conditions[]" value="high_pay">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">高時給</span>
                                </label>
                            </div>
                        </div>

                        <!-- 並び順 -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                並び順
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="radio" name="select_sortby" value="disp_date" checked>
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">新着順</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="radio" name="select_sortby" value="work_date">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">作業日早い順</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="radio" name="select_sortby" value="salary">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">時給高い順</span>
                                </label>
                            </div>
                        </div>

                        <!-- キーワード -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                キーワード
                            </div>
                            <div style="padding-top: 4px;">
                                <input type="text" id="nlFreeWord" placeholder="例: 搬入"
                                    style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
                            </div>
                        </div>
                    </div>

                    <div class="nl-filter-actions">
                        <button class="nl-btn nl-btn-reset" id="nlResetBtn">リセット</button>
                        <button class="nl-btn nl-btn-apply" id="nlApplyBtn">絞り込みを適用</button>
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    // イベントリスナーを初期化
    function initializeEventListeners() {
        const trigger = document.getElementById('nlFilterTrigger');
        const content = document.getElementById('nlFilterContent');
        const applyBtn = document.getElementById('nlApplyBtn');
        const resetBtn = document.getElementById('nlResetBtn');

        if (!trigger || !content) {
            console.error('[NEXTLEVEL Filter] 必要な要素が見つかりません');
            return;
        }

        // トリガークリック
        trigger.addEventListener('click', function() {
            const isActive = this.classList.contains('active');
            if (isActive) {
                this.classList.remove('active');
                content.classList.remove('active');
            } else {
                this.classList.add('active');
                content.classList.add('active');
            }
        });

        // チェックボックス変更監視
        const allInputs = document.querySelectorAll('.nl-checkbox-item input');
        allInputs.forEach(input => {
            input.addEventListener('change', updateDisplay);
        });

        // 適用ボタン
        if (applyBtn) {
            applyBtn.addEventListener('click', applyFilters);
        }

        // リセットボタン
        if (resetBtn) {
            resetBtn.addEventListener('click', resetFilters);
        }

        // URLから現在の選択状態を復元
        restoreFromURL();

        // 初期表示を更新
        updateDisplay();

        console.log('[NEXTLEVEL Filter] イベントリスナーを設定しました');
    }

    // URLパラメータから選択状態を復元
    function restoreFromURL() {
        const params = new URLSearchParams(window.location.search);

        // チェックボックスの復元
        params.forEach((value, key) => {
            const input = document.querySelector(`.nl-checkbox-item input[name="${key}"][value="${value}"]`);
            if (input) {
                input.checked = true;
            }
        });

        // キーワードの復元
        const freeWord = params.get('free_word');
        if (freeWord) {
            const input = document.getElementById('nlFreeWord');
            if (input) {
                input.value = freeWord;
            }
        }

        console.log('[NEXTLEVEL Filter] URLから選択状態を復元しました');
    }

    // 表示を更新
    function updateDisplay() {
        updateBadges();
        updateSummary();
    }

    // バッジを更新
    function updateBadges() {
        const groups = document.querySelectorAll('.nl-filter-group');
        groups.forEach(group => {
            const checkboxes = group.querySelectorAll('input[type="checkbox"]');
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
            const badge = group.querySelector('.nl-group-badge');

            if (badge) {
                if (checkedCount > 0) {
                    badge.textContent = checkedCount;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }

    // サマリーを更新
    function updateSummary() {
        const summaryItems = [
            { name: 'エリア', selector: 'input[name="site_pref[]"]:checked' },
            { name: '仕事の形態', selector: 'input[name="work_style[]"]:checked' },
            { name: '職種', selector: 'input[name="big_category[]"]:checked' },
            { name: '時間帯', selector: 'input[name="timeslots[]"]:checked' },
        ];

        let summaryHTML = '';

        summaryItems.forEach(item => {
            const checked = document.querySelectorAll(`.nl-checkbox-item ${item.selector}`);
            const count = checked.length;

            if (count > 0) {
                summaryHTML += `
                    <div class="nl-summary-item selected">
                        <span>${item.name}</span>
                        <span class="nl-summary-badge">${count}</span>
                    </div>
                `;
            } else {
                summaryHTML += `
                    <div class="nl-summary-item">
                        <span>${item.name}</span>
                    </div>
                `;
            }
        });

        // 並び順
        const sortBy = document.querySelector('.nl-checkbox-item input[name="select_sortby"]:checked');
        const sortLabel = sortBy ? sortBy.nextElementSibling.nextElementSibling.textContent : '新着順';
        summaryHTML += `
            <div class="nl-summary-item">
                <span>並び順: ${sortLabel}</span>
            </div>
        `;

        const summary = document.getElementById('nlFilterSummary');
        if (summary) {
            summary.innerHTML = summaryHTML;
        }
    }

    // フィルターを適用
    function applyFilters() {
        const params = new URLSearchParams();

        // チェックボックスの値を取得
        const allInputs = document.querySelectorAll('.nl-checkbox-item input');
        allInputs.forEach(input => {
            if (input.checked) {
                params.append(input.name, input.value);
            }
        });

        // キーワードを取得
        const freeWord = document.getElementById('nlFreeWord');
        if (freeWord && freeWord.value) {
            params.append('free_word', freeWord.value);
        }

        // その他の固定パラメータ
        params.append('narrowing_down[]', '1');

        // ページ遷移
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?${params.toString()}`;

        console.log('[NEXTLEVEL Filter] 適用URL:', newUrl);
        window.location.href = newUrl;
    }

    // フィルターをリセット
    function resetFilters() {
        const allInputs = document.querySelectorAll('.nl-checkbox-item input');
        allInputs.forEach(input => {
            input.checked = false;
        });

        // デフォルト値
        const defaultSort = document.querySelector('.nl-checkbox-item input[name="select_sortby"][value="disp_date"]');
        if (defaultSort) {
            defaultSort.checked = true;
        }

        const freeWord = document.getElementById('nlFreeWord');
        if (freeWord) {
            freeWord.value = '';
        }

        updateDisplay();
        console.log('[NEXTLEVEL Filter] フィルターをリセットしました');
    }

    // スタイル注入
    injectStyles();

})();
