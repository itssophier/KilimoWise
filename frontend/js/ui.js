/* =====================================================================
   KiliMoWise — UI primitives
   - Toast (stacked, auto-dismiss)
   - Theme (light/dark/system, persisted)
   - Install prompt + update notification
   ===================================================================== */

(function () {
  // -------- TOAST --------
  var TOAST_ICON = {
    success: '✓',
    error: '!',
    warn: '!',
    info: 'i'
  };

  function ensureToastStack() {
    var stack = document.querySelector('.toast-stack');
    if (stack) return stack;
    stack = document.createElement('div');
    stack.className = 'toast-stack top-right';
    document.body.appendChild(stack);
    return stack;
  }

  function toast(opts) {
    if (typeof opts === 'string') opts = { message: opts };
    opts = opts || {};
    var type = opts.type || 'info';
    var duration = opts.duration || 3200;

    var stack = ensureToastStack();
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.setAttribute('role', type === 'error' || type === 'warn' ? 'alert' : 'status');

    t.innerHTML =
      '<span class="toast-icon">' + (TOAST_ICON[type] || 'i') + '</span>' +
      '<div class="toast-body">' +
        (opts.title ? '<div class="toast-title"></div>' : '') +
        '<div class="toast-msg"></div>' +
      '</div>' +
      '<button class="toast-close" aria-label="Dismiss">' + window.svg('close', 14).outerHTML + '</button>';

    var titleEl = t.querySelector('.toast-title');
    if (titleEl) titleEl.textContent = opts.title;
    t.querySelector('.toast-msg').textContent = opts.message;

    stack.appendChild(t);

    var timer = setTimeout(dismiss, duration);
    function dismiss() {
      clearTimeout(timer);
      t.classList.add('toast-out');
      t.addEventListener('animationend', function () { t.remove(); }, { once: true });
    }
    t.querySelector('.toast-close').addEventListener('click', dismiss);
    t.addEventListener('click', function (e) {
      if (e.target.closest('.toast-close')) return;
      dismiss();
    });
    return dismiss;
  }

  window.toast = toast;
  window.showToast = function (msg, type) { return toast({ message: msg, type: type || 'info' }); };

  // -------- THEME --------
  var THEME_KEY = 'kilimowise_theme';

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function setStoredTheme(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* ignore */ }
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    var t = theme === 'dark' || theme === 'light' ? theme : systemTheme();
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
    var meta = document.querySelector('meta[name="theme-color"]:not([data-no-auto])');
    if (meta) {
      meta.setAttribute('content', t === 'dark' ? '#0a0d0a' : '#faf6ee');
    }
  }

  function setTheme(theme) {
    setStoredTheme(theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent('kmw:theme', { detail: { theme: theme } }));
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || systemTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Auto theme icon swap
  document.addEventListener('kmw:theme', function (e) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.innerHTML = '';
      btn.appendChild(window.svg(e.detail.theme === 'dark' ? 'sun' : 'moon', 18));
    });
  });

  // Initialize on first paint
  applyTheme(getStoredTheme() || 'system');
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', function () {
      if (!getStoredTheme() || getStoredTheme() === 'system') applyTheme(systemTheme());
    });
  }

  window.setTheme = setTheme;
  window.toggleTheme = toggleTheme;
  window.getTheme = function () { return document.documentElement.getAttribute('data-theme') || systemTheme(); };

  // -------- PWA: install + update --------
  var deferredPrompt = null;
  var INSTALL_DISMISS_KEY = 'kilimowise_install_dismissed';

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('kmw:installavailable'));
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    window.dispatchEvent(new Event('kmw:installed'));
  });

  function canInstall() { return !!deferredPrompt; }

  async function promptInstall() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    var choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return choice && choice.outcome === 'accepted';
  }

  function isInstallDismissed() {
    try { return localStorage.getItem(INSTALL_DISMISS_KEY) === '1'; } catch (e) { return false; }
  }
  function dismissInstall() {
    try { localStorage.setItem(INSTALL_DISMISS_KEY, '1'); } catch (e) { /* ignore */ }
  }

  // Service worker update
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      window.dispatchEvent(new Event('kmw:swupdated'));
    });
  }

  window.pwa = {
    canInstall: canInstall,
    promptInstall: promptInstall,
    isInstallDismissed: isInstallDismissed,
    dismissInstall: dismissInstall,
    isOnline: function () { return navigator.onLine; }
  };
})();
