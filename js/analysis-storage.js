/** @typedef {import('./ui-controls.js').AnalysisState} AnalysisState */

/** @typedef {{ id: string, name: string, createdAt: string, updatedAt: string, state: AnalysisState }} SavedAnalysis */

/** @typedef {{ version: number, items: SavedAnalysis[] }} SavedAnalysisStore */

export const STORAGE_KEY = 'wine-analytics.saved-analyses';
const STORE_VERSION = 1;

/**
 * @returns {SavedAnalysisStore}
 */
export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORE_VERSION || !Array.isArray(parsed.items)) {
      return emptyStore();
    }
    return /** @type {SavedAnalysisStore} */ (parsed);
  } catch {
    return emptyStore();
  }
}

/**
 * @param {SavedAnalysisStore} store
 */
export function persistStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * @returns {SavedAnalysisStore}
 */
function emptyStore() {
  return { version: STORE_VERSION, items: [] };
}

/**
 * @returns {string}
 */
function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} name
 * @param {AnalysisState} state
 * @returns {SavedAnalysis}
 */
export function addSavedAnalysis(name, state) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Unesite naziv analize.');
  }

  const store = loadStore();
  const now = new Date().toISOString();
  const entry = {
    id: newId(),
    name: trimmed,
    createdAt: now,
    updatedAt: now,
    state,
  };
  store.items.push(entry);
  persistStore(store);
  return entry;
}

/**
 * @param {string} id
 */
export function removeSavedAnalysis(id) {
  const store = loadStore();
  store.items = store.items.filter((item) => item.id !== id);
  persistStore(store);
}

/**
 * @returns {SavedAnalysis[]}
 */
export function listSavedAnalyses() {
  return loadStore().items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * @param {string} id
 * @returns {SavedAnalysis | undefined}
 */
export function getSavedAnalysis(id) {
  return loadStore().items.find((item) => item.id === id);
}
