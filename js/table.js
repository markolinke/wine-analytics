import { LABELS } from './fields.js';

/**
 * @param {HTMLTableElement} table
 * @param {import('./aggregate.js').AggregatedPoint[]} points
 * @param {string} timeLabel
 * @param {string} metricLabel
 */
export function renderAggregateTable(table, points, timeLabel, metricLabel) {
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  if (!thead || !tbody) return;

  const hasSeries = points.some((p) => p.label);
  thead.innerHTML = `
    <tr>
      <th>${escapeHtml(timeLabel)}</th>
      ${hasSeries ? '<th>Serija</th>' : ''}
      <th>Prosjek — ${escapeHtml(metricLabel)}</th>
      <th>Broj uzoraka</th>
    </tr>
  `;

  tbody.replaceChildren();
  for (const p of points) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.time}</td>
      ${hasSeries ? `<td>${escapeHtml(p.label ?? '')}</td>` : ''}
      <td>${formatNum(p.mean)}</td>
      <td>${p.count}</td>
    `;
    tbody.appendChild(tr);
  }
}

/**
 * @param {number} n
 */
function formatNum(n) {
  return n.toLocaleString('hr-HR', { maximumFractionDigits: 2 });
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
