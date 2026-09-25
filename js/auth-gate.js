const SESSION_KEY = 'wine-analytics-auth';

const VALID_USERNAME = 'senzorika';
const VALID_PASSWORD = 'Gb@!_y@Nmrdid-oMKJ9x';

/** @type {Promise<void> | null} */
let appLoadPromise = null;

export function isAuthenticated() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function setAuthenticated() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function clearAuthentication() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * @param {string} username
 * @param {string} password
 */
function validateCredentials(username, password) {
  const user = username.trim().toLowerCase();
  const pass = password;
  return user === VALID_USERNAME && pass === VALID_PASSWORD;
}

function loadAppOnce() {
  if (!appLoadPromise) {
    appLoadPromise = import('./app.js');
  }
  return appLoadPromise;
}

export function setupLogout() {
  const btn = document.getElementById('logout-btn');
  btn?.addEventListener('click', () => {
    clearAuthentication();
    window.location.reload();
  });
}

/**
 * @param {HTMLElement | null} errorEl
 */
async function enterApp(errorEl) {
  try {
    await loadAppOnce();
  } catch (err) {
    clearAuthentication();
    if (errorEl) {
      errorEl.textContent =
        'Prijava je prošla, ali aplikacija se nije učitala. Otvorite stranicu preko http:// (npr. python3 -m http.server), ne kao datoteku file://.';
    }
    console.error(err);
    throw err;
  }

  const gate = document.getElementById('login-gate');
  const app = document.getElementById('app');
  gate?.setAttribute('hidden', '');
  app?.removeAttribute('hidden');
  setupLogout();
}

/**
 * @param {string} message
 */
function showLoginError(message) {
  const errorEl = document.querySelector('#login-error');
  if (errorEl) errorEl.textContent = message;
}

function mountLoginForm() {
  const gate = document.getElementById('login-gate');
  if (!gate) return;

  gate.removeAttribute('hidden');

  const form = gate.querySelector('#login-form');
  const errorEl = gate.querySelector('#login-error');
  const userInput = gate.querySelector('#login-username');
  const passInput = gate.querySelector('#login-password');
  const submitBtn = gate.querySelector('.login-submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!(userInput instanceof HTMLInputElement) || !(passInput instanceof HTMLInputElement)) {
      return;
    }

    if (errorEl) errorEl.textContent = '';
    if (submitBtn instanceof HTMLButtonElement) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Prijava…';
    }

    const username = userInput.value;
    const password = passInput.value;

    try {
      if (!validateCredentials(username, password)) {
        if (errorEl) {
          errorEl.textContent = 'Neispravno korisničko ime ili lozinka.';
        }
        passInput.value = '';
        passInput.focus();
        return;
      }

      try {
        setAuthenticated();
      } catch {
        if (errorEl) {
          errorEl.textContent =
            'Preglednik blokira spremanje sesije. Isključite privatno surfanje ili dopustite localStorage/sessionStorage.';
        }
        return;
      }

      await enterApp(errorEl instanceof HTMLElement ? errorEl : null);
    } finally {
      if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Prijava';
      }
    }
  });
}

async function boot() {
  const app = document.getElementById('app');
  app?.setAttribute('hidden', '');

  if (isAuthenticated()) {
    try {
      await enterApp(null);
      return;
    } catch {
      showLoginError('Sesija je istekla ili aplikacija nije učitana. Prijavite se ponovno.');
    }
  }

  mountLoginForm();
  const userInput = document.getElementById('login-username');
  if (userInput instanceof HTMLInputElement) userInput.focus();
}

boot();
