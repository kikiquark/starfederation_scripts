// ==UserScript==
// @name         Автоисследование StarFederation (v3.0)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Оптимизированный скрипт: мгновенно находит и запускает исследование, затем делает паузу после клика. Особая логика для Фундаментальных.
// @match        https://www.starfederation.ru/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- Настройки и Константы ---
    const DELAY_AFTER_CLICK = 2500; // (в мс) Пауза ПОСЛЕ нажатия кнопки "старт", чтобы избежать двойного запуска.
    const TABS_SELECTOR = '#WndScience_tabs .dhx_tab_element_active';
    const TIMER_SELECTOR = '#main_PlayerScienceTime';
    const LIST_SELECTOR = '#WndScience_cur_science_list';
    const HINT_CONTAINER_ID = 'divHint';

    // Флаг, предотвращающий повторный запуск, пока выполняется предыдущий.
    let isRunning = false;

    // --- Вспомогательные функции ---

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getActiveTabId() {
        const tabEl = document.querySelector(TABS_SELECTOR);
        return tabEl ? tabEl.getAttribute('tab_id') : null;
    }

    function parseNumber(text) {
        if (!text) return 0;
        const cleanedText = text.trim().replace(/\s/g, '');
        return parseInt(cleanedText, 10) || 0;
    }

    async function getMaxLevelForTech(index) {
        const btnSelector = `${LIST_SELECTOR} > div:nth-child(${index + 1}) div.controlbox.controls-center-row > button`;
        const btn = document.querySelector(btnSelector);
        if (!btn) return 0;

        btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        await delay(300);

        const hintContainer = document.getElementById(HINT_CONTAINER_ID);
        let maxLevel = 0;
        if (hintContainer) {
            const rows = hintContainer.querySelectorAll('table.data_table tr');
            for (const row of rows) {
                const labelCell = row.querySelector('td.label');
                if (labelCell && labelCell.textContent.includes('Макс. доступный уровень')) {
                    const valueCell = row.querySelector('td.value');
                    if (valueCell) {
                        maxLevel = parseNumber(valueCell.textContent);
                        break;
                    }
                }
            }
        }
        btn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        return maxLevel;
    }

    function isButtonActive(index) {
        const imgSelector = `${LIST_SELECTOR} > div:nth-child(${index + 1}) div.controlbox.controls-center-row > button img`;
        const img = document.querySelector(imgSelector);
        return img && !img.classList.contains('shaddow5');
    }

    function getTitle(index) {
        const titleSelector = `${LIST_SELECTOR} > div:nth-child(${index + 1}) > div:nth-child(1)`;
        const titleEl = document.querySelector(titleSelector);
        return titleEl ? titleEl.textContent.trim() : `Элемент #${index}`;
    }

    function getCurrentLevel(index) {
        const tdSelector = `${LIST_SELECTOR} > div:nth-child(${index + 1}) > div:nth-child(3) table tbody tr td > span`;
        const element = document.querySelector(tdSelector);
        return element ? parseNumber(element.textContent) : 0;
    }

    function setInputLevel(index, level) {
        const inputSelector = `${LIST_SELECTOR} > div:nth-child(${index + 1}) div.controlbox.controls-center-row input[type="text"]`;
        const inputEl = document.querySelector(inputSelector);
        if (inputEl) {
            inputEl.value = Math.floor(level);
        }
    }

    function clickButton(index) {
        const buttonSelector = `${LIST_SELECTOR} > div:nth-child(${index + 1}) div.controlbox.controls-center-row > button`;
        const btnEl = document.querySelector(buttonSelector);
        if (btnEl) {
            btnEl.click();
        }
    }

    // --- Основная логика ---

    async function tryStartResearch() {
        if (isRunning) {
            console.log('[AutoScience] Процесс уже запущен, новый запуск отменен.');
            return;
        }
        isRunning = true;
        console.log('[AutoScience v3.0] Попытка запуска нового исследования...');

        try {
            const activeTabId = getActiveTabId();
            console.log(`[AutoScience] Обнаружена активная вкладка: ID = "${activeTabId}".`);

            // --- ЭТАП 1: Быстрый поиск кандидата с минимальным уровнем ---
            const items = document.querySelectorAll(`${LIST_SELECTOR} > div`);
            const candidates = [];
            for (let i = 0; i < items.length; i++) {
                if (isButtonActive(i)) {
                    candidates.push({
                        index: i,
                        title: getTitle(i),
                        currentLevel: getCurrentLevel(i),
                    });
                }
            }

            if (candidates.length === 0) {
                console.log('[AutoScience] Не найдено активных кнопок для улучшения.');
                isRunning = false;
                return;
            }

            candidates.sort((a, b) => a.currentLevel - b.currentLevel);
            console.log('[AutoScience] Кандидаты на улучшение:', candidates.map(c => c.title));

            // --- ЭТАП 2: Проверка и запуск ---
            let chosenItem = null;
            for (const candidate of candidates) {
                const maxLevel = await getMaxLevelForTech(candidate.index);
                console.log(`  - Проверка кандидата "${candidate.title}": Текущий=${candidate.currentLevel}, Макс.=${maxLevel}`);
                if (candidate.currentLevel < maxLevel) {
                    chosenItem = candidate;
                    chosenItem.maxLevel = maxLevel;
                    break;
                }
            }

            if (!chosenItem) {
                console.log('[AutoScience] Не найдено элементов для улучшения (все кандидаты уже на макс. уровне).');
                isRunning = false;
                return;
            }

            let targetLevel;
            if (activeTabId === 'main-foundamental' && (chosenItem.index === 0 || chosenItem.index === 1)) {
                console.log(`[AutoScience] -> Применяется ОСОБАЯ логика для "${chosenItem.title}".`);
                targetLevel = Math.floor((chosenItem.currentLevel + 1) * 1.05);
            } else {
                console.log('[AutoScience] -> Применяется СТАНДАРТНАЯ логика.');
                targetLevel = chosenItem.maxLevel;
            }

            console.log(`[AutoScience] ВЫБОР: "${chosenItem.title}". Текущий=${chosenItem.currentLevel}, Цель=${targetLevel}`);
            setInputLevel(chosenItem.index, targetLevel);
            clickButton(chosenItem.index);
            console.log(`[AutoScience] Улучшение запущено! Пауза на ${DELAY_AFTER_CLICK} мс...`);

            // --- ЭТАП 3: Пауза после клика ---
            await delay(DELAY_AFTER_CLICK);
            console.log('[AutoScience] Пауза завершена.');

        } catch (error) {
            console.error('[AutoScience] Произошла ошибка:', error);
        } finally {
            isRunning = false; // Освобождаем флаг в любом случае
        }
    }

    function observeTimer() {
        const timerEl = document.querySelector(TIMER_SELECTOR);
        if (!timerEl) {
            console.warn("[AutoScience] Не найден элемент таймера. Скрипт не будет работать.");
            return;
        }

        const observer = new MutationObserver(() => {
            if (timerEl.textContent.trim() === '-') {
                tryStartResearch();
            }
        });
        observer.observe(timerEl, { childList: true, characterData: true, subtree: true });

        // Первичная проверка при загрузке
        if (timerEl.textContent.trim() === '-') {
            // Небольшая начальная задержка, чтобы игра успела прогрузиться
            setTimeout(tryStartResearch, 1000);
        }
    }

    window.addEventListener('load', observeTimer);

})();
