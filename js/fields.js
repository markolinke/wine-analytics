/** @typedef {'SORTA'|'TRADICIONALNI_IZRAZ'|'GODINA'|'GODINA_BERBE'|'RESULT'|'ZOI'|'BOJA'} DimensionKey */
/** @typedef {'Reducirajući_šećeri_gL'|'Stvarni_alkohol_vol'|'Ukupna_kiselost_kao_vinska_gL'} MetricKey */

export const DIMENSION_KEYS = [
  'SORTA',
  'TRADICIONALNI_IZRAZ',
  'GODINA',
  'GODINA_BERBE',
  'RESULT',
  'ZOI',
  'BOJA',
];

export const METRIC_KEYS = [
  'Reducirajući_šećeri_gL',
  'Stvarni_alkohol_vol',
  'Ukupna_kiselost_kao_vinska_gL',
];

export const TIME_KEYS = ['GODINA', 'GODINA_BERBE'];

/** Croatian labels for CSV columns and UI */
export const LABELS = {
  RBR: 'Redni broj',
  SORTA: 'Sorta',
  TRADICIONALNI_IZRAZ: 'Kategorija kvalitete',
  GODINA: 'Godina analize',
  GODINA_BERBE: 'Godina berbe',
  RESULT: 'Ukupni rezultat',
  ZOI: 'Vinogorje (ZOI)',
  BOJA: 'Boja',
  'Reducirajući_šećeri_gL': 'Reducirajući šećeri (g/L)',
  Stvarni_alkohol_vol: 'Stvarni alkohol (vol %)',
  Ukupna_kiselost_kao_vinska_gL: 'Ukupna kiselost (g/L)',
};

export const DEFAULT_METRIC = 'Reducirajući_šećeri_gL';
export const DEFAULT_TIME = 'GODINA';

export const CSV_PATH = 'dataset/data.csv';

/** Redoslijed stupaca u izvornom CSV-u */
export const CSV_COLUMNS = [
  'RBR',
  'SORTA',
  'TRADICIONALNI_IZRAZ',
  'GODINA',
  'GODINA_BERBE',
  'RESULT',
  'ZOI',
  'BOJA',
  ...METRIC_KEYS,
];
