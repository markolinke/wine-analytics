/**
 * @typedef {{ time: number, mean: number, count: number, label?: string }} AggregatedPoint
 */

/**
 * @param {Record<string, string | number>[]} rows
 * @param {string} timeField
 * @param {string} metricField
 * @param {string[]} [seriesKeys] — extra group dimensions (e.g. BOJA)
 * @returns {AggregatedPoint[]}
 */
export function aggregateByTime(rows, timeField, metricField, seriesKeys = []) {
  /** @type {Map<string, { sum: number, count: number, time: number, parts: string[] }>} */
  const buckets = new Map();

  for (const row of rows) {
    const timeRaw = row[timeField];
    const time = typeof timeRaw === 'number' ? timeRaw : Number.parseFloat(String(timeRaw));
    const metric = row[metricField];
    if (!Number.isFinite(time) || typeof metric !== 'number' || !Number.isFinite(metric)) {
      continue;
    }

    const parts = seriesKeys.map((k) => String(row[k] ?? ''));
    const key = `${time}|${parts.join('\0')}`;

    let b = buckets.get(key);
    if (!b) {
      b = { sum: 0, count: 0, time, parts };
      buckets.set(key, b);
    }
    b.sum += metric;
    b.count += 1;
  }

  const out = [];
  for (const b of buckets.values()) {
    out.push({
      time: b.time,
      mean: b.sum / b.count,
      count: b.count,
      label: b.parts.length ? b.parts.join(' · ') : undefined,
    });
  }

  out.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return (a.label ?? '').localeCompare(b.label ?? '', 'hr');
  });

  return out;
}

/**
 * @param {AggregatedPoint[]} points
 * @param {number | null} minCount — inclusive; null/0 = no filter
 * @returns {AggregatedPoint[]}
 */
export function filterByMinSampleCount(points, minCount) {
  if (!minCount || minCount < 1) return points;
  return points.filter((p) => p.count >= minCount);
}

/**
 * @param {Map<string, AggregatedPoint[]>} facetSeries
 * @param {number | null} minCount
 * @returns {Map<string, AggregatedPoint[]>}
 */
export function filterFacetSeriesByMinSampleCount(facetSeries, minCount) {
  if (!minCount || minCount < 1) return facetSeries;
  /** @type {Map<string, AggregatedPoint[]>} */
  const out = new Map();
  for (const [key, pts] of facetSeries) {
    out.set(key, filterByMinSampleCount(pts, minCount));
  }
  return out;
}

/**
 * @param {AggregatedPoint[]} points
 * @returns {Map<string, AggregatedPoint[]>}
 */
export function groupIntoSeries(points) {
  /** @type {Map<string, AggregatedPoint[]>} */
  const map = new Map();
  for (const p of points) {
    const name = p.label ?? 'Ukupno';
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(p);
  }
  return map;
}

/**
 * @param {Record<string, string | number>[]} rows
 * @param {string} facetField
 * @param {string} timeField
 * @param {string} metricField
 * @param {string[]} facetValues
 * @returns {Map<string, AggregatedPoint[]>}
 */
export function aggregateFacets(rows, facetField, timeField, metricField, facetValues) {
  /** @type {Map<string, AggregatedPoint[]>} */
  const result = new Map();

  for (const facet of facetValues) {
    const subset = rows.filter((r) => String(r[facetField] ?? '') === facet);
    result.set(facet, aggregateByTime(subset, timeField, metricField));
  }

  return result;
}

/**
 * @param {AggregatedPoint[]} points
 * @returns {number[]}
 */
export function sortedTimes(points) {
  return [...new Set(points.map((p) => p.time))].sort((a, b) => a - b);
}
