import { METRIC_KEYS, DIMENSION_KEYS, CSV_COLUMNS } from './fields.js';

const NUMERIC_DIMENSIONS = new Set(['GODINA', 'GODINA_BERBE', 'RESULT']);

/**
 * @param {string} text
 * @returns {Record<string, string | number>[]}
 */
export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = line.split(',');
    /** @type {Record<string, string | number>} */
    const row = {};

    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      const raw = cells[c] ?? '';
      row[key] = coerceValue(key, raw);
    }
    rows.push(row);
  }

  return rows;
}

/**
 * @param {string} key
 * @param {string} raw
 */
function coerceValue(key, raw) {
  if (METRIC_KEYS.includes(key) || NUMERIC_DIMENSIONS.has(key)) {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

/**
 * @param {string} path
 * @returns {Promise<Record<string, string | number>[]>}
 */
export async function loadCsv(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Ne mogu učitati CSV (${res.status}): ${path}`);
  }
  const text = await res.text();
  return parseCsv(text);
}

/**
 * @param {Record<string, string | number>[]} rows
 * @param {string} field
 * @returns {string[]}
 */
export function distinctValues(rows, field) {
  const set = new Set();
  for (const row of rows) {
    const v = row[field];
    if (v !== undefined && v !== null && v !== '') {
      set.add(String(v));
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'hr'));
}

/**
 * @param {Record<string, string | number>[]} rows
 * @returns {string[]}
 */
export function inferColumns(rows) {
  if (!rows.length) return [...CSV_COLUMNS];
  const keys = new Set(Object.keys(rows[0]));
  const ordered = CSV_COLUMNS.filter((k) => keys.has(k));
  const rest = [...keys].filter((k) => !ordered.includes(k)).sort();
  return [...ordered, ...rest];
}

/**
 * @param {string} value
 */
function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * @param {Record<string, string | number>[]} rows
 * @param {string[]} [columns]
 * @returns {string}
 */
export function rowsToCsv(rows, columns) {
  const cols = columns ?? inferColumns(rows);
  const lines = [cols.join(',')];
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCsvCell(row[c])).join(','));
  }
  return lines.join('\n');
}

/**
 * @param {string} content
 * @param {string} filename
 */
export function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * @param {File} file
 * @returns {Promise<{ rows: Record<string, string | number>[], text: string, fileName: string }>}
 */
export function readCsvFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const rows = parseCsv(text);
      if (!rows.length) {
        reject(new Error('CSV datoteka nema podataka.'));
        return;
      }
      resolve({ rows, text, fileName: file.name });
    };
    reader.onerror = () => reject(new Error('Ne mogu pročitati datoteku.'));
    reader.readAsText(file, 'UTF-8');
  });
}
