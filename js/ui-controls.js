import {
  DIMENSION_KEYS,
  METRIC_KEYS,
  TIME_KEYS,
  LABELS,
  DEFAULT_METRIC,
  DEFAULT_TIME,
} from './fields.js';
import { distinctValues } from './csv.js';

/** @typedef {'all'|'none'|'invert'} BulkCheckboxAction */

/** @typedef {{
 *   version: number,
 *   metric: string,
 *   time: string,
 *   seriesDimension: string,
 *   excludeSugarAbove: string,
 *   minSampleCount: string,
 *   dimensions: Record<string, string[]>,
 *   facetDimension: string,
 *   facetValues: string[],
 *   facetSharedScale: boolean,
 * }} AnalysisState */

export const ANALYSIS_STATE_VERSION = 1;

/**
 * @returns {HTMLElement}
 */
function createCheckboxBulkActions() {
  const bar = document.createElement('div');
  bar.className = 'filter-bulk-actions';

  const actions = [
    { action: 'all', label: 'Odaberi sve' },
    { action: 'none', label: 'Poništi odabir' },
    { action: 'invert', label: 'Obrni odabir' },
  ];

  for (const { action, label } of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-bulk-btn';
    btn.textContent = label;
    btn.dataset.bulkAction = action;
    btn.addEventListener('click', () => {
      const field = btn.closest('fieldset');
      const list = field?.querySelector('.checkbox-list');
      if (list) applyBulkCheckboxAction(list, /** @type {BulkCheckboxAction} */ (action));
    });
    bar.appendChild(btn);
  }

  return bar;
}

/**
 * @param {HTMLElement} list
 * @param {BulkCheckboxAction} action
 */
function applyBulkCheckboxAction(list, action) {
  const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
  for (const box of boxes) {
    if (action === 'all') box.checked = true;
    else if (action === 'none') box.checked = false;
    else box.checked = !box.checked;
  }
  if (boxes.length) {
    boxes[0].dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * @param {HTMLElement} root
 * @param {Record<string, string | number>[]} rows
 */
export function buildFilterControls(root, rows) {
  root.replaceChildren();

  for (const key of DIMENSION_KEYS) {
    const values = distinctValues(rows, key);
    const field = document.createElement('fieldset');
    field.className = 'filter-fieldset';

    const legend = document.createElement('legend');
    const legendLabel = document.createElement('span');
    legendLabel.textContent = LABELS[key] ?? key;
    const countBadge = document.createElement('span');
    countBadge.className = 'filter-count';
    countBadge.dataset.dimension = key;
    countBadge.textContent = `0/${values.length}`;
    legend.append(legendLabel, document.createTextNode(' '), countBadge);
    field.appendChild(legend);

    field.dataset.dimension = key;

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Ništa odabrano = svi podaci';
    field.appendChild(hint);

    field.appendChild(createCheckboxBulkActions());

    const list = document.createElement('div');
    list.className = 'checkbox-list';

    for (const v of values) {
      const row = document.createElement('label');
      row.className = 'checkbox-row checkbox-list-item';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = v;

      row.append(input, document.createTextNode(` ${v}`));
      list.appendChild(row);
    }

    field.appendChild(list);
    root.appendChild(field);
  }
}

/**
 * @param {HTMLElement} root
 */
export function wireMetricAndTimeControls(root) {
  root.replaceChildren();

  root.appendChild(labeledSelect('metric', 'Metrika', METRIC_KEYS, DEFAULT_METRIC));
  root.appendChild(labeledSelect('time', 'Vrijeme (os X)', TIME_KEYS, DEFAULT_TIME));

  const seriesField = document.createElement('fieldset');
  seriesField.className = 'filter-fieldset';
  const legend = document.createElement('legend');
  legend.textContent = 'Serije na glavnom grafu';
  seriesField.appendChild(legend);

  const select = document.createElement('select');
  select.id = 'series-dimension';
  const none = document.createElement('option');
  none.value = '';
  none.textContent = '— jedna linija (ukupni prosjek) —';
  select.appendChild(none);

  for (const key of DIMENSION_KEYS) {
    if (TIME_KEYS.includes(key)) continue;
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = LABELS[key] ?? key;
    select.appendChild(opt);
  }
  seriesField.appendChild(select);
  root.appendChild(seriesField);
}

/**
 * @param {string} id
 * @param {string} label
 * @param {string[]} keys
 * @param {string} defaultKey
 */
function labeledSelect(id, label, keys, defaultKey) {
  const wrap = document.createElement('div');
  wrap.className = 'control-row';

  const lbl = document.createElement('label');
  lbl.htmlFor = id;
  lbl.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  for (const key of keys) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = LABELS[key] ?? key;
    if (key === defaultKey) opt.selected = true;
    select.appendChild(opt);
  }

  wrap.append(lbl, select);
  return wrap;
}

/**
 * @param {HTMLElement} container
 * @param {Record<string, string | number>[]} rows
 */
export function buildFacetControls(container, rows) {
  container.replaceChildren();

  const dimWrap = document.createElement('div');
  dimWrap.className = 'control-row';

  const dimLabel = document.createElement('label');
  dimLabel.htmlFor = 'facet-dimension';
  dimLabel.textContent = 'Usporedi po dimenziji';

  const dimSelect = document.createElement('select');
  dimSelect.id = 'facet-dimension';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '— isključeno —';
  dimSelect.appendChild(empty);

  for (const key of DIMENSION_KEYS) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = LABELS[key] ?? key;
    dimSelect.appendChild(opt);
  }

  dimWrap.append(dimLabel, dimSelect);
  container.appendChild(dimWrap);

  const valuesField = document.createElement('fieldset');
  valuesField.className = 'filter-fieldset';
  valuesField.id = 'facet-values-field';
  valuesField.hidden = true;

  const legend = document.createElement('legend');
  legend.textContent = 'Vrijednosti za usporedbu (prazno = sve)';
  valuesField.appendChild(legend);

  const facetSelect = document.createElement('select');
  facetSelect.id = 'facet-values';
  facetSelect.multiple = true;
  facetSelect.size = 6;
  facetSelect.className = 'dimension-select';
  valuesField.appendChild(facetSelect);

  container.appendChild(valuesField);

  dimSelect.addEventListener('change', () => {
    syncFacetValueOptions(rows, dimSelect.value);
  });

  const scaleRow = document.createElement('label');
  scaleRow.className = 'checkbox-row';
  const shared = document.createElement('input');
  shared.type = 'checkbox';
  shared.id = 'facet-shared-scale';
  shared.checked = true;
  scaleRow.append(shared, document.createTextNode(' Ista Y skala na svim grafovima'));
  container.appendChild(scaleRow);
}

/**
 * @param {Record<string, string | number>[]} rows
 * @param {string} dimensionKey
 */
export function syncFacetValueOptions(rows, dimensionKey) {
  const valuesField = document.getElementById('facet-values-field');
  const facetSelect = document.getElementById('facet-values');
  if (!(valuesField instanceof HTMLElement) || !(facetSelect instanceof HTMLSelectElement)) {
    return;
  }

  if (!dimensionKey) {
    valuesField.hidden = true;
    facetSelect.replaceChildren();
    return;
  }

  valuesField.hidden = false;
  facetSelect.replaceChildren();
  for (const v of distinctValues(rows, dimensionKey)) {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    facetSelect.appendChild(opt);
  }
}

/**
 * @returns {AnalysisState}
 */
export function captureAnalysisState() {
  const filtersRoot = document.getElementById('dimension-filters');
  const selections = filtersRoot ? readDimensionSelections(filtersRoot) : {};

  /** @type {Record<string, string[]>} */
  const dimensions = {};
  for (const key of DIMENSION_KEYS) {
    const set = selections[key];
    if (set && set.size) dimensions[key] = [...set];
  }

  const sugarEl = document.getElementById('exclude-sugar-above');
  const minSamplesEl = document.getElementById('min-sample-count');
  const sharedEl = document.getElementById('facet-shared-scale');
  const facetSelect = document.getElementById('facet-values');

  return {
    version: ANALYSIS_STATE_VERSION,
    metric: readSelectValue('metric'),
    time: readSelectValue('time'),
    seriesDimension: readSelectValue('series-dimension'),
    excludeSugarAbove: sugarEl instanceof HTMLInputElement ? sugarEl.value : '',
    minSampleCount: minSamplesEl instanceof HTMLInputElement ? minSamplesEl.value : '',
    dimensions,
    facetDimension: readSelectValue('facet-dimension'),
    facetValues: readMultiSelectValues(
      facetSelect instanceof HTMLSelectElement ? facetSelect : null
    ),
    facetSharedScale: sharedEl instanceof HTMLInputElement ? sharedEl.checked : true,
  };
}

/**
 * @param {AnalysisState} state
 * @param {Record<string, string | number>[]} rows
 */
export function applyAnalysisState(state, rows) {
  if (!state || state.version !== ANALYSIS_STATE_VERSION) return;

  setSelectValue('metric', state.metric);
  setSelectValue('time', state.time);
  setSelectValue('series-dimension', state.seriesDimension ?? '');

  const sugarEl = document.getElementById('exclude-sugar-above');
  if (sugarEl instanceof HTMLInputElement) {
    sugarEl.value = state.excludeSugarAbove ?? '';
  }

  const minSamplesEl = document.getElementById('min-sample-count');
  if (minSamplesEl instanceof HTMLInputElement) {
    minSamplesEl.value = state.minSampleCount ?? '';
  }

  const filtersRoot = document.getElementById('dimension-filters');
  if (filtersRoot) {
    for (const field of filtersRoot.querySelectorAll('fieldset[data-dimension]')) {
      const key = field.dataset.dimension;
      if (!key) continue;
      const wanted = new Set(state.dimensions?.[key] ?? []);
      for (const box of field.querySelectorAll('input[type="checkbox"]')) {
        if (box instanceof HTMLInputElement) {
          box.checked = wanted.has(box.value);
        }
      }
    }
  }

  const facetDim = state.facetDimension ?? '';
  setSelectValue('facet-dimension', facetDim);
  syncFacetValueOptions(rows, facetDim);

  const facetSelect = document.getElementById('facet-values');
  if (facetSelect instanceof HTMLSelectElement) {
    const wanted = new Set(state.facetValues ?? []);
    for (const opt of facetSelect.options) {
      opt.selected = wanted.has(opt.value);
    }
  }

  const sharedEl = document.getElementById('facet-shared-scale');
  if (sharedEl instanceof HTMLInputElement) {
    sharedEl.checked = state.facetSharedScale !== false;
  }
}

/**
 * @param {string} id
 */
function readSelectValue(id) {
  const el = document.getElementById(id);
  return el instanceof HTMLSelectElement ? el.value : '';
}

/**
 * @param {string} id
 * @param {string} value
 */
function setSelectValue(id, value) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLSelectElement)) return;
  const hasOption = [...el.options].some((o) => o.value === value);
  if (hasOption || value === '') el.value = value;
}

/**
 * @param {HTMLElement} filtersRoot
 */
export function updateDimensionFilterCounts(filtersRoot) {
  for (const field of filtersRoot.querySelectorAll('fieldset[data-dimension]')) {
    const key = field.dataset.dimension;
    if (!key) continue;
    const boxes = field.querySelectorAll('.checkbox-list input[type="checkbox"]');
    const total = boxes.length;
    let selected = 0;
    for (const box of boxes) {
      if (box instanceof HTMLInputElement && box.checked) selected += 1;
    }
    const badge = field.querySelector('.filter-count');
    if (badge) badge.textContent = `${selected}/${total}`;
  }
}

/**
 * @param {HTMLElement} filtersRoot
 * @returns {Record<string, Set<string>>}
 */
export function readDimensionSelections(filtersRoot) {
  /** @type {Record<string, Set<string>>} */
  const out = {};
  for (const field of filtersRoot.querySelectorAll('fieldset[data-dimension]')) {
    const key = field.dataset.dimension;
    if (!key) continue;
    const selected = [...field.querySelectorAll('input[type="checkbox"]:checked')].map(
      (input) => input.value
    );
    if (selected.length) out[key] = new Set(selected);
  }
  return out;
}

/**
 * @returns {import('./filter.js').RowRule[]}
 */
export function readRowRules() {
  const maxSugar = document.getElementById('exclude-sugar-above');
  const rules = [];
  if (maxSugar instanceof HTMLInputElement && maxSugar.value.trim() !== '') {
    const value = Number.parseFloat(maxSugar.value);
    if (Number.isFinite(value)) {
      rules.push({
        field: 'Reducirajući_šećeri_gL',
        op: 'gt',
        value,
      });
    }
  }
  return rules;
}

/**
 * @returns {number | null}
 */
export function readMinSampleCount() {
  const el = document.getElementById('min-sample-count');
  if (!(el instanceof HTMLInputElement) || el.value.trim() === '') return null;
  const n = Number.parseInt(el.value, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/**
 * @param {HTMLSelectElement | null} select
 * @returns {string[]}
 */
export function readMultiSelectValues(select) {
  if (!select) return [];
  return [...select.selectedOptions].map((o) => o.value);
}
