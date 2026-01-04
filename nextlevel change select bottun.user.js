// ==UserScript==
// @name         NEXTLEVEL絞り込み改善 - インラインアコーディオン v2
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  e-nextlevel.jpの絞り込みUIを一括表示可能なアコーディオン形式に変更（実際のページ構造に完全対応）
// @author       You
// @match        https://www.e-nextlevel.jp/work/list*
// @match        https://www.e-nextlevel.jp/work/search*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('[NEXTLEVEL Filter v2] スクリプト開始');
    console.log('[NEXTLEVEL Filter v2] URL:', window.location.href);

    // ページ読み込み完了を待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

    function init() {
        console.log('[NEXTLEVEL Filter v2] 初期化開始');

        // モーダルが存在するかチェック
        const hasModals = checkForModals();

        if (!hasModals) {
            console.log('[NEXTLEVEL Filter v2] モーダル構造が見つかりません。スクリプトを終了します。');
            return;
        }

        console.log('[NEXTLEVEL Filter v2] モーダル構造を検出しました');

        // 既存の絞り込みボタンエリアを検索
        const existingFilterBar = document.querySelector('.job-list__narrow-down-small');

        if (!existingFilterBar) {
            console.warn('[NEXTLEVEL Filter v2] 絞り込みバーが見つかりません');
            return;
        }

        console.log('[NEXTLEVEL Filter v2] 既存の絞り込みバーを発見:', existingFilterBar);

        // 既存のフィルターバーを置き換え
        replaceFilterBar(existingFilterBar);
    }

    // モーダル構造の存在をチェック
    function checkForModals() {
        const conditions = [
            document.querySelector('.js-modal__btn[data-modal]'),
            document.querySelector('.js-modal__main[data-modal]'),
            document.querySelector('[data-modal="timeslots"]'),
            document.querySelector('.job-list__narrow-down-small')
        ];

        const hasModal = conditions.some(condition => condition !== null);

        if (hasModal) {
            console.log('[NEXTLEVEL Filter v2] モーダル検出:', {
                'トリガーボタン': !!conditions[0],
                'モーダルコンテンツ': !!conditions[1],
                'data-modal属性': !!conditions[2],
                '絞り込みバー': !!conditions[3]
            });
        }

        return hasModal;
    }

    // 既存の絞り込みバーを置き換え
    function replaceFilterBar(oldBar) {
        const newFilterBar = createFilterBar();
        oldBar.parentNode.replaceChild(newFilterBar, oldBar);
        console.log('[NEXTLEVEL Filter v2] フィルターバーを置き換えました');
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
                max-height: 800px;
                transition: max-height 0.5s ease-in;
            }

            .nl-filter-content-inner {
                padding: 24px 20px;
            }

            /* グリッドレイアウト */
            .nl-filter-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 20px;
            }

            @media (min-width: 768px) {
                .nl-filter-grid {
                    grid-template-columns: repeat(3, 1fr);
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
            }
        `;
        document.head.appendChild(style);
        console.log('[NEXTLEVEL Filter v2] CSSを注入しました');
    }

    // フィルターバーHTMLを作成（実際のデータに基づく）
    function createFilterBar() {
        const div = document.createElement('div');
        div.className = 'nl-filter-bar';
        div.innerHTML = `
            <div class="nl-filter-trigger" id="nlFilterTrigger">
                <div class="nl-filter-icon">▼</div>
                <div class="nl-filter-summary" id="nlFilterSummary">
                    <div class="nl-summary-item">
                        <span>時間帯</span>
                    </div>
                    <div class="nl-summary-item">
                        <span>仕事の形態</span>
                    </div>
                    <div class="nl-summary-item">
                        <span>並び順: 新着順</span>
                    </div>
                </div>
            </div>
            <div class="nl-filter-content" id="nlFilterContent">
                <div class="nl-filter-content-inner">
                    <div class="nl-filter-grid">
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

                        <!-- 仕事の形態（ラジオボタン） -->
                        <div class="nl-filter-group">
                            <div class="nl-group-title">
                                仕事の形態
                            </div>
                            <div class="nl-checkbox-list">
                                <label class="nl-checkbox-item">
                                    <input type="radio" name="work_style" value="0" checked>
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">全て</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="radio" name="work_style" value="1">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">スキマバイト</span>
                                </label>
                                <label class="nl-checkbox-item">
                                    <input type="radio" name="work_style" value="2">
                                    <span class="nl-checkbox-custom"></span>
                                    <span class="nl-checkbox-label">シフトマッチ</span>
                                </label>
                            </div>
                        </div>

                        <!-- 並び順（ラジオボタン） -->
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
            console.error('[NEXTLEVEL Filter v2] 必要な要素が見つかりません');
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

        console.log('[NEXTLEVEL Filter v2] イベントリスナーを設定しました');
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

        console.log('[NEXTLEVEL Filter v2] URLから選択状態を復元しました');
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
        const timeslotsChecked = document.querySelectorAll('.nl-checkbox-item input[name="timeslots[]"]:checked');
        const workStyleChecked = document.querySelector('.nl-checkbox-item input[name="work_style"]:checked');
        const sortByChecked = document.querySelector('.nl-checkbox-item input[name="select_sortby"]:checked');

        let summaryHTML = '';

        // 時間帯
        if (timeslotsChecked.length > 0) {
            summaryHTML += `
                <div class="nl-summary-item selected">
                    <span>時間帯</span>
                    <span class="nl-summary-badge">${timeslotsChecked.length}</span>
                </div>
            `;
        } else {
            summaryHTML += `<div class="nl-summary-item"><span>時間帯</span></div>`;
        }

        // 仕事の形態
        const workStyleLabel = workStyleChecked ?
            workStyleChecked.nextElementSibling.nextElementSibling.textContent : '全て';

        if (workStyleLabel !== '全て') {
            summaryHTML += `
                <div class="nl-summary-item selected">
                    <span>仕事の形態: ${workStyleLabel}</span>
                </div>
            `;
        } else {
            summaryHTML += `<div class="nl-summary-item"><span>仕事の形態</span></div>`;
        }

        // 並び順
        const sortLabel = sortByChecked ?
            sortByChecked.nextElementSibling.nextElementSibling.textContent : '新着順';
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

        // チェックボックス・ラジオボタンの値を取得
        const allInputs = document.querySelectorAll('.nl-checkbox-item input');
        allInputs.forEach(input => {
            if (input.checked) {
                params.append(input.name, input.value);
            }
        });

        // ページ遷移
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?${params.toString()}`;

        console.log('[NEXTLEVEL Filter v2] 適用URL:', newUrl);
        window.location.href = newUrl;
    }

    // フィルターをリセット
    function resetFilters() {
        const allInputs = document.querySelectorAll('.nl-checkbox-item input');
        allInputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            }
        });

        // デフォルト値
        const defaultWorkStyle = document.querySelector('.nl-checkbox-item input[name="work_style"][value="0"]');
        if (defaultWorkStyle) defaultWorkStyle.checked = true;

        const defaultSort = document.querySelector('.nl-checkbox-item input[name="select_sortby"][value="disp_date"]');
        if (defaultSort) defaultSort.checked = true;

        updateDisplay();
        console.log('[NEXTLEVEL Filter v2] フィルターをリセットしました');
    }

    // スタイル注入
    injectStyles();

})();
