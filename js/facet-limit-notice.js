export const FACET_PANEL_LIMIT = 25;

/** @type {Set<string>} */
const dismissedNoticeKeys = new Set();

/** @type {HTMLElement | null} */
let modalRoot = null;

/**
 * @param {{ facetDimension: string, totalCount: number, maxShown?: number }} options
 */
export function handleFacetLimitNotice({ facetDimension, totalCount, maxShown = FACET_PANEL_LIMIT }) {
  if (totalCount <= maxShown) {
    clearFacetLimitBanner();
    return;
  }

  const contextKey = `${facetDimension}|${totalCount}|${maxShown}`;
  updateFacetLimitBanner(maxShown, totalCount);

  if (dismissedNoticeKeys.has(contextKey)) return;

  showFacetLimitModal(maxShown, totalCount, () => {
    dismissedNoticeKeys.add(contextKey);
  });
}

/**
 * @param {number} maxShown
 * @param {number} totalCount
 * @param {() => void} onDismiss
 */
function showFacetLimitModal(maxShown, totalCount, onDismiss) {
  closeFacetLimitModal();

  modalRoot = document.createElement('div');
  modalRoot.className = 'facet-limit-modal';
  modalRoot.setAttribute('role', 'dialog');
  modalRoot.setAttribute('aria-modal', 'true');
  modalRoot.setAttribute('aria-labelledby', 'facet-limit-modal-title');

  const backdrop = document.createElement('div');
  backdrop.className = 'facet-limit-modal-backdrop';

  const panel = document.createElement('div');
  panel.className = 'facet-limit-modal-panel';

  const title = document.createElement('h2');
  title.id = 'facet-limit-modal-title';
  title.className = 'facet-limit-modal-title';
  title.textContent = `TOP ${maxShown} prikazano`;

  const body = document.createElement('p');
  body.className = 'facet-limit-modal-body';
  body.textContent = `Odabrano je ${totalCount} vrijednosti za usporedbu. Zbog ograničenja prikazujemo samo prvih ${maxShown}.`;

  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'saved-action-btn saved-action-primary facet-limit-modal-btn';
  confirm.textContent = `Razumijem, samo prvih ${maxShown} je prikazano`;
  confirm.addEventListener('click', () => {
    onDismiss();
    closeFacetLimitModal();
  });

  panel.append(title, body, confirm);
  modalRoot.append(backdrop, panel);
  document.body.appendChild(modalRoot);

  confirm.focus();
}

function closeFacetLimitModal() {
  modalRoot?.remove();
  modalRoot = null;
}

/**
 * @param {number} maxShown
 * @param {number} totalCount
 */
function updateFacetLimitBanner(maxShown, totalCount) {
  let banner = document.getElementById('facet-limit-banner');
  if (!banner) {
    const grid = document.getElementById('facet-grid');
    if (!grid?.parentElement) return;
    banner = document.createElement('p');
    banner.id = 'facet-limit-banner';
    banner.className = 'facet-limit-banner';
    banner.setAttribute('role', 'status');
    grid.parentElement.insertBefore(banner, grid);
  }
  banner.textContent = `TOP ${maxShown} prikazano (od ukupno ${totalCount} vrijednosti).`;
  banner.hidden = false;
}

function clearFacetLimitBanner() {
  const banner = document.getElementById('facet-limit-banner');
  if (banner) banner.hidden = true;
}
