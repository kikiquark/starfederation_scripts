// ==UserScript==
// @name        StarFederation Max Research Autofill
// @namespace   https://github.com/example/starfederation
// @version     1.1
// @description Autofill maximum level for each research and trigger build automatically
// @match       *://*/*
// @grant       none
// ==/UserScript==

  (function () {
    'use strict';

    const HINT_CONTAINER_ID = 'divHint';

    async function getMaxLevel(button) {
      button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      let attempts = 0;
      return new Promise(resolve => {
        const timer = setInterval(() => {
          const hintContainer = document.getElementById(HINT_CONTAINER_ID);
          if (hintContainer) {
            const rows = hintContainer.querySelectorAll('table.data_table tr');
            for (const row of rows) {
              const labelCell = row.querySelector('td.label');
              if (labelCell && labelCell.textContent.includes('Макс. доступный уровень')) {
                const valueCell = row.querySelector('td.value');
                if (valueCell) {
                  const num = parseInt(valueCell.textContent.trim().replace(/\s/g, ''), 10);
                  clearInterval(timer);
                  button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
                  resolve(num || 0);
                  return;
                }
              }
            }
          }
          attempts += 1;
          if (attempts >= 25) { // ~5 seconds timeout
            clearInterval(timer);
            button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
            resolve(0);
          }
        }, 200);
      });
    }

  function waitForButtons() {
    const buttons = document.querySelectorAll('button[data-hintid^="WndScience_sh_"]');
    if (buttons.length === 0) {
      setTimeout(waitForButtons, 500);
      return;
    }
    processButtons(buttons);
    observeChanges();
  }

  function processButtons(nodeList) {
    nodeList.forEach(button => {
      if (button.dataset.sfAutofillAttached) return;
      const match = button.dataset.hintid && button.dataset.hintid.match(/^WndScience_sh_(\d+)$/);
      if (!match) return;
      const number = match[1];
      button.dataset.sfAutofillAttached = '1';

      const mini = document.createElement('button');
      mini.textContent = 'A';
      mini.style.marginLeft = '2px';
      mini.style.fontSize = '10px';
      mini.style.padding = '0 2px';

      mini.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const input = document.querySelector(`#WndScience_scl_${number}`);
        const max = await getMaxLevel(button);
        if (input && max) {
          input.value = max;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        button.click();
      });

      button.insertAdjacentElement('afterend', mini);
    });
  }

  function observeChanges() {
    const observer = new MutationObserver(() => {
      const newButtons = document.querySelectorAll('button[data-hintid^="WndScience_sh_"]');
      processButtons(newButtons);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  waitForButtons();
})();
