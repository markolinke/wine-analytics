/**
 * @param {HTMLElement} container
 * @param {{
 *   getSourceLabel: () => string,
 *   onDownload: () => void,
 *   onFileSelected: (file: File) => void,
 * }} callbacks
 */
export function mountDataPanel(container, callbacks) {
  container.replaceChildren();

  const source = document.createElement('p');
  source.className = 'data-source-label';
  source.id = 'data-source-label';
  source.textContent = callbacks.getSourceLabel();

  const actions = document.createElement('div');
  actions.className = 'data-actions';

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.className = 'saved-action-btn saved-action-primary';
  downloadBtn.textContent = 'Preuzmi sirove podatke (CSV)';
  downloadBtn.addEventListener('click', () => callbacks.onDownload());

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.id = 'csv-file-input';
  fileInput.accept = '.csv,text/csv';
  fileInput.hidden = true;
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) callbacks.onFileSelected(file);
  });

  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'saved-action-btn';
  uploadBtn.textContent = 'Učitaj CSV s diska';
  uploadBtn.addEventListener('click', () => fileInput.click());

  actions.append(downloadBtn, uploadBtn, fileInput);
  container.append(source, actions);

  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent =
    'Podaci nisu na poslužitelju — učitajte lokalnu CSV datoteku. Preuzimanje i učitavanje odnose se na cijeli skup redova.';
  container.appendChild(hint);

  return {
    openFilePicker: () => fileInput.click(),
  };
}

/**
 * @param {string} label
 */
export function updateDataSourceLabel(label) {
  const el = document.getElementById('data-source-label');
  if (el) el.textContent = label;
}
