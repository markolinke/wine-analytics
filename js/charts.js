const CHART_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#4f46e5',
];

/**
 * @param {HTMLCanvasElement} canvas
 * @param {import('./aggregate.js').AggregatedPoint[]} points
 * @param {string} metricLabel
 * @param {string} timeLabel
 * @param {import('chart.js').Chart | null} previous
 * @returns {import('chart.js').Chart}
 */
export function renderLineChart(canvas, points, metricLabel, timeLabel, previous) {
  if (previous) previous.destroy();

  const seriesMap = groupSingleOrLabeled(points);
  const times = [...new Set(points.map((p) => p.time))].sort((a, b) => a - b);

  const datasets = [...seriesMap.entries()].map(([label, pts], i) => {
    const byTime = new Map(pts.map((p) => [p.time, p]));
    return {
      label,
      data: times.map((t) => byTime.get(t)?.mean ?? null),
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '33',
      tension: 0.15,
      spanGaps: true,
    };
  });

  // eslint-disable-next-line no-undef
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: times.map(String),
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: datasets.length > 1 },
        tooltip: {
          callbacks: {
            afterLabel(ctx) {
              const t = Number(ctx.label);
              const dsLabel = ctx.dataset.label ?? '';
              const pt = seriesMap.get(dsLabel)?.find((p) => p.time === t);
              if (pt) return `Broj uzoraka: ${pt.count}`;
              return '';
            },
          },
        },
      },
      scales: {
        x: { title: { display: true, text: timeLabel } },
        y: { title: { display: true, text: metricLabel }, beginAtZero: false },
      },
    },
  });
}

/**
 * @param {import('./aggregate.js').AggregatedPoint[]} points
 */
function groupSingleOrLabeled(points) {
  /** @type {Map<string, import('./aggregate.js').AggregatedPoint[]>} */
  const map = new Map();
  for (const p of points) {
    const name = p.label ?? 'Prosjek';
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(p);
  }
  return map;
}

/**
 * @param {HTMLElement} container
 * @param {Map<string, import('./aggregate.js').AggregatedPoint[]>} facetSeries
 * @param {string} metricLabel
 * @param {string} timeLabel
 * @param {boolean} sharedScale
 * @param {import('chart.js').Chart[]} previousCharts
 * @returns {import('chart.js').Chart[]}
 */
export function renderFacetGrid(
  container,
  facetSeries,
  metricLabel,
  timeLabel,
  sharedScale,
  previousCharts
) {
  for (const c of previousCharts) c.destroy();
  container.replaceChildren();

  let yMin = Infinity;
  let yMax = -Infinity;
  if (sharedScale) {
    for (const pts of facetSeries.values()) {
      for (const p of pts) {
        yMin = Math.min(yMin, p.mean);
        yMax = Math.max(yMax, p.mean);
      }
    }
    if (!Number.isFinite(yMin)) {
      yMin = 0;
      yMax = 1;
    }
    const pad = (yMax - yMin) * 0.1 || 1;
    yMin -= pad;
    yMax += pad;
  }

  /** @type {import('chart.js').Chart[]} */
  const charts = [];

  for (const [facetLabel, points] of facetSeries) {
    const wrap = document.createElement('div');
    wrap.className = 'facet-panel';

    const title = document.createElement('h3');
    title.className = 'facet-title';
    title.textContent = facetLabel;
    wrap.appendChild(title);

    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'facet-canvas-wrap';
    const canvas = document.createElement('canvas');
    canvasWrap.appendChild(canvas);
    wrap.appendChild(canvasWrap);

    container.appendChild(wrap);

    const times = [...new Set(points.map((p) => p.time))].sort((a, b) => a - b);
    const byTime = new Map(points.map((p) => [p.time, p]));

    const scaleOpts = sharedScale ? { min: yMin, max: yMax } : { beginAtZero: false };

    // eslint-disable-next-line no-undef
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: times.map(String),
        datasets: [
          {
            label: metricLabel,
            data: times.map((t) => byTime.get(t)?.mean ?? null),
            borderColor: CHART_COLORS[0],
            backgroundColor: CHART_COLORS[0] + '33',
            tension: 0.15,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            title: { display: times.length > 0, text: timeLabel },
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          },
          y: {
            title: { display: true, text: metricLabel },
            ...scaleOpts,
          },
        },
      },
    });
    charts.push(chart);
  }

  return charts;
}
