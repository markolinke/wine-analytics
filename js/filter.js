/**
 * @typedef {{ field: string, op: 'gt'|'gte'|'lt'|'lte'|'eq', value: number }} RowRule
 * @typedef {Record<string, Set<string>>} DimensionSelections
 */

/**
 * @param {Record<string, string | number>} row
 * @param {RowRule} rule
 */
function rowMatchesRule(row, rule) {
  const raw = row[rule.field];
  const num = typeof raw === 'number' ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(num)) return false;

  switch (rule.op) {
    case 'gt':
      return num > rule.value;
    case 'gte':
      return num >= rule.value;
    case 'lt':
      return num < rule.value;
    case 'lte':
      return num <= rule.value;
    case 'eq':
      return num === rule.value;
    default:
      return true;
  }
}

/**
 * @param {Record<string, string | number>[]} rows
 * @param {DimensionSelections} selections
 * @param {RowRule[]} rowRules — rows matching a rule are excluded
 */
export function filterRows(rows, selections, rowRules = []) {
  return rows.filter((row) => {
    for (const [field, allowed] of Object.entries(selections)) {
      if (!allowed || allowed.size === 0) continue;
      const value = String(row[field] ?? '');
      if (!allowed.has(value)) return false;
    }

    for (const rule of rowRules) {
      if (rowMatchesRule(row, rule)) return false;
    }

    return true;
  });
}
