import { LABELS, DEFAULT_METRIC } from './fields.js';
import { downloadTextFile, rowsToCsv, readCsvFromFile } from './csv.js';
import { filterRows } from './filter.js';
import { aggregateByTime, aggregateFacets, filterByMinSampleCount, filterFacetSeriesByMinSampleCount } from './aggregate.js';
import { renderLineChart, renderFacetGrid } from './charts.js';
import { renderAggregateTable } from './table.js';
import {
  buildFilterControls,
  wireMetricAndTimeControls,
  buildFacetControls,
  readDimensionSelections,
  readRowRules,
  readMinSampleCount,
  readMultiSelectValues,
  captureAnalysisState,
  applyAnalysisState,
  updateDimensionFilterCounts,
} from './ui-controls.js';
import { getSavedAnalysis } from './analysis-storage.js';
import { mountSavedAnalysesPanel } from './saved-analyses-ui.js';
import { mountDataPanel, updateDataSourceLabel } from './data-ui.js';
import { FACET_PANEL_LIMIT, handleFacetLimitNotice } from './facet-limit-notice.js';

/** @type {Record<string, string | number>[]} */
let allRows = [];

/** @type {string | null} */
let rawCsvText = null;

/** @type {string} */
let dataDownloadName = 'podaci-vina.csv';

/** @type {string} */
let dataSourceLabel = '—';

/** @type {import('chart.js').Chart | null} */
let mainChart = null;

/** @type {import('chart.js').Chart[]} */
let facetCharts = [];

const els = {
  status: document.getElementById('status'),
  filters: document.getElementById('dimension-filters'),
  analysis: document.getElementById('analysis-controls'),
  facets: document.getElementById('facet-controls'),
  mainCanvas: /** @type {HTMLCanvasElement} */ (document.getElementById('main-chart')),
  facetGrid: document.getElementById('facet-grid'),
  table: /** @type {HTMLTableElement} */ (document.getElementById('data-table')),
  rowCount: document.getElementById('row-count'),
  savedAnalyses: document.getElementById('saved-analyses'),
  dataControls: document.getElementById('data-controls'),
};

function setStatus(message, isError = false) {
  if (!els.status) return;
  els.status.textContent = message;
  els.status.classList.toggle('error', isError);
}

function readSelect(id) {
  const el = document.getElementById(id);
  return el instanceof HTMLSelectElement ? el.value : '';
}

function refresh() {
  if (!allRows.length) return;

  updateDimensionFilterCounts(els.filters);

  const metric = readSelect('metric') || DEFAULT_METRIC;
  const timeField = readSelect('time') || 'GODINA';
  const metricLabel = LABELS[metric] ?? metric;
  const timeLabel = LABELS[timeField] ?? timeField;

  const selections = readDimensionSelections(els.filters);
  const rowRules = readRowRules();
  const filtered = filterRows(allRows, selections, rowRules);

  if (els.rowCount) {
    els.rowCount.textContent = `${filtered.length} redova (od ${allRows.length})`;
  }

  const seriesDim = readSelect('series-dimension');
  const seriesKeys = seriesDim ? [seriesDim] : [];
  const minSamples = readMinSampleCount();
  const rawPoints = aggregateByTime(filtered, timeField, metric, seriesKeys);
  const points = filterByMinSampleCount(rawPoints, minSamples);

  mainChart = renderLineChart(
    els.mainCanvas,
    points,
    metricLabel,
    timeLabel,
    mainChart
  );

  renderAggregateTable(els.table, points, timeLabel, metricLabel);

  const facetDim = readSelect('facet-dimension');
  const facetValueSelect = /** @type {HTMLSelectElement | null} */ (
    document.getElementById('facet-values')
  );
  const sharedEl = document.getElementById('facet-shared-scale');
  const sharedScale = sharedEl instanceof HTMLInputElement ? sharedEl.checked : true;

  if (!facetDim || !els.facetGrid) {
    handleFacetLimitNotice({ facetDimension: '', totalCount: 0 });
    facetCharts.forEach((c) => c.destroy());
    facetCharts = [];
    els.facetGrid.replaceChildren();
    setStatus(dataSourceLabel, false);
    return;
  }

  let facetValues = readMultiSelectValues(facetValueSelect);
  if (facetValues.length === 0) {
    const fromFilter = selections[facetDim];
    if (fromFilter && fromFilter.size) {
      facetValues = [...fromFilter];
    } else {
      facetValues = [...new Set(filtered.map((r) => String(r[facetDim] ?? '')))].sort((a, b) =>
        a.localeCompare(b, 'hr')
      );
    }
  }

  const maxFacets = FACET_PANEL_LIMIT;
  const totalFacetValues = facetValues.length;
  handleFacetLimitNotice({
    facetDimension: facetDim,
    totalCount: totalFacetValues,
    maxShown: maxFacets,
  });
  if (totalFacetValues > maxFacets) {
    facetValues = facetValues.slice(0, maxFacets);
  }
  setStatus(dataSourceLabel, false);

  const facetSeries = filterFacetSeriesByMinSampleCount(
    aggregateFacets(filtered, facetDim, timeField, metric, facetValues),
    minSamples
  );
  facetCharts = renderFacetGrid(
    els.facetGrid,
    facetSeries,
    metricLabel,
    timeLabel,
    sharedScale,
    facetCharts
  );
}

function bindRefresh() {
  const root = document.getElementById('app');
  if (!root) return;

  root.addEventListener('change', refresh);
  root.addEventListener('input', (e) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    if (e.target.id === 'exclude-sugar-above' || e.target.id === 'min-sample-count') {
      refresh();
    }
  });
}

function setDataset(rows, rawText, sourceLabel, downloadName) {
  allRows = rows;
  rawCsvText = rawText;
  dataSourceLabel = sourceLabel;
  dataDownloadName = downloadName;
  updateDataSourceLabel(`${sourceLabel} — ${rows.length} redova`);

  buildFilterControls(els.filters, allRows);
  buildFacetControls(els.facets, allRows);
  refresh();
}

function downloadRawCsv() {
  if (!allRows.length) {
    setStatus('Nema podataka za preuzimanje.', true);
    return;
  }
  const content = rawCsvText ?? rowsToCsv(allRows);
  downloadTextFile(content, dataDownloadName);
  setStatus(`Preuzeto: ${dataDownloadName}`);
}

async function handleCsvFile(file) {
  try {
    setStatus('Učitavam datoteku…');
    const { rows, text, fileName } = await readCsvFromFile(file);
    setDataset(rows, text, `Datoteka: ${fileName}`, fileName);
    setStatus(`Učitano s diska: ${fileName} (${rows.length} redova)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setStatus(msg, true);
  }
}

async function init() {
  setStatus('Odaberite CSV datoteku…');

  wireMetricAndTimeControls(els.analysis);

  /** @type {{ openFilePicker: () => void } | undefined} */
  let dataPanel;

  if (els.dataControls) {
    dataPanel = mountDataPanel(els.dataControls, {
      getSourceLabel: () =>
        allRows.length
          ? `${dataSourceLabel} — ${allRows.length} redova`
          : 'Podaci nisu učitani',
      onDownload: downloadRawCsv,
      onFileSelected: handleCsvFile,
    });
  }

  if (els.savedAnalyses) {
    mountSavedAnalysesPanel(els.savedAnalyses, {
      captureState: captureAnalysisState,
      onLoad: (id) => {
        const saved = getSavedAnalysis(id);
        if (!saved) {
          setStatus('Spremljena analiza više ne postoji.', true);
          return;
        }
        applyAnalysisState(saved.state, allRows);
        refresh();
      },
      onMessage: (text, isError) => setStatus(text, isError),
    });
  }

  bindRefresh();

  updateDataSourceLabel('Podaci nisu učitani');
  dataPanel?.openFilePicker();
}

init();
