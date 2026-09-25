import {
  addSavedAnalysis,
  listSavedAnalyses,
  removeSavedAnalysis,
} from './analysis-storage.js';

/**
 * @param {HTMLElement} container
 * @param {{
 *   captureState: () => import('./ui-controls.js').AnalysisState,
 *   onLoad: (id: string) => void,
 *   onMessage: (text: string, isError?: boolean) => void,
 * }} callbacks
 */
export function mountSavedAnalysesPanel(container, callbacks) {
  container.replaceChildren();

  const saveRow = document.createElement('div');
  saveRow.className = 'saved-save-row';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'saved-analysis-name';
  nameInput.className = 'saved-name-input';
  nameInput.placeholder = 'Naziv analize';
  nameInput.maxLength = 120;

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'saved-action-btn saved-action-primary';
  saveBtn.textContent = 'Spremi postavku';

  saveBtn.addEventListener('click', () => {
    try {
      const state = callbacks.captureState();
      addSavedAnalysis(nameInput.value, state);
      nameInput.value = '';
      callbacks.onMessage('Analiza spremljena.');
      renderList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      callbacks.onMessage(msg, true);
    }
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });

  saveRow.append(nameInput, saveBtn);
  container.appendChild(saveRow);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Postavke se pamte u pregledniku (localStorage).';
  container.appendChild(hint);

  const list = document.createElement('ul');
  list.className = 'saved-analysis-list';
  list.id = 'saved-analysis-list';
  container.appendChild(list);

  function renderList() {
    list.replaceChildren();
    const items = listSavedAnalyses();

    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'saved-analysis-empty';
      empty.textContent = 'Nema spremljenih analiza.';
      list.appendChild(empty);
      return;
    }

    for (const item of items) {
      const li = document.createElement('li');
      li.className = 'saved-analysis-item';

      const meta = document.createElement('div');
      meta.className = 'saved-analysis-meta';

      const title = document.createElement('span');
      title.className = 'saved-analysis-title';
      title.textContent = item.name;

      const date = document.createElement('time');
      date.className = 'saved-analysis-date';
      date.dateTime = item.updatedAt;
      date.textContent = formatSavedDate(item.updatedAt);

      meta.append(title, date);

      const actions = document.createElement('div');
      actions.className = 'saved-analysis-actions';

      const loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'saved-action-btn';
      loadBtn.textContent = 'Učitaj';
      loadBtn.addEventListener('click', () => {
        callbacks.onLoad(item.id);
        callbacks.onMessage(`Učitano: ${item.name}`);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'saved-action-btn saved-action-danger';
      deleteBtn.textContent = 'Obriši';
      deleteBtn.addEventListener('click', () => {
        if (!window.confirm(`Obrisati analizu „${item.name}”?`)) return;
        removeSavedAnalysis(item.id);
        callbacks.onMessage('Analiza obrisana.');
        renderList();
      });

      actions.append(loadBtn, deleteBtn);
      li.append(meta, actions);
      list.appendChild(li);
    }
  }

  renderList();

  return { refreshList: renderList };
}

/**
 * @param {string} iso
 */
function formatSavedDate(iso) {
  try {
    return new Date(iso).toLocaleString('hr-HR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
