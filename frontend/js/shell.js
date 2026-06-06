/* =====================================================================
   KiliMoWise — Shell (sidebar + bottom nav + topbar)
   Injects the appropriate navigation into [data-shell] containers.
   Renders icons via inline SVG (no external requests).
   ===================================================================== */

(function () {
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k === 'text') e.textContent = attrs[k];
        else if (k.indexOf('on') === 0) e.addEventListener(k.substring(2).toLowerCase(), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      });
    }
    if (children) children.forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function icon(name, size) {
    return window.svg(name, size || 20);
  }

  function isActive(page) {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'home' && (path === '' || path === 'index.html')) return true;
    return path === page + '.html';
  }

  function getInitials() {
    var n = window.localStorage.getItem('kilimowise_name') || '';
    var parts = n.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '—';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function getFarmerLocation() {
    try {
      var prof = JSON.parse(window.localStorage.getItem('kilimowise_profile') || 'null');
      if (prof && prof.location) return prof.location;
    } catch (e) { /* ignore */ }
    return null;
  }

  function buildSidebar() {
    var brand = el('div', { class: 'sidebar-brand' }, [
      el('span', { class: 'brand-mark', style: 'color: var(--forest-700);' }, [icon('logo-mark', 36)]),
      el('div', null, [
        el('div', { class: 'sidebar-brand-name', text: 'KiliMoWise' }),
        el('div', { class: 'sidebar-brand-tag', 'data-i18n': 'app.tagline', text: 'Smart AI Farm Assistant' })
      ])
    ]);

    var links = [
      { key: 'home',     icon: 'home',     label: 'nav.home',     href: 'index.html' },
      { key: 'advisor',  icon: 'sparkles', label: 'nav.advisor',  href: 'advisor.html' },
      { key: 'budget',   icon: 'wallet',   label: 'nav.budget',   href: 'budget.html' },
      { key: 'insights', icon: 'chart',    label: 'nav.insights', href: 'insights.html' }
    ];

    var navItems = links.map(function (l) {
      var a = el('a', {
        class: 'sidebar-link' + (isActive(l.key) ? ' active' : ''),
        href: l.href
      }, [
        el('span', { class: 'icon' }, [icon(l.icon, 20)]),
        el('span', { 'data-i18n': l.label, text: l.label })
      ]);
      return a;
    });

    var mainNav = el('nav', { class: 'sidebar-nav' }, navItems);

    var accountLabel = el('div', { class: 'sidebar-section-label', 'data-i18n': 'nav.account', text: 'Account' });
    var profileLink = el('a', {
      class: 'sidebar-link' + (isActive('profile') ? ' active' : ''),
      href: 'profile.html'
    }, [
      el('span', { class: 'icon' }, [icon('user', 20)]),
      el('span', { 'data-i18n': 'nav.profile', text: 'Profile' })
    ]);
    var logoutLink = el('a', { class: 'sidebar-link', href: '#', onclick: function (e) { e.preventDefault(); window.logout(); } }, [
      el('span', { class: 'icon' }, [icon('log-out', 20)]),
      el('span', { 'data-i18n': 'auth.logout', text: 'Logout' })
    ]);

    var accountNav = el('nav', { class: 'sidebar-nav' }, [profileLink, logoutLink]);

    var userName = window.localStorage.getItem('kilimowise_name') || 'Farmer';
    var userLoc = getFarmerLocation();
    var userBlock = el('div', { class: 'sidebar-user' }, [
      el('span', { class: 'avatar', text: getInitials() }),
      el('div', { class: 'sidebar-user-info' }, [
        el('div', { class: 'sidebar-user-name', text: userName }),
        el('div', { class: 'sidebar-user-meta', text: userLoc || '—' })
      ])
    ]);

    var footer = el('div', { class: 'sidebar-footer' }, [userBlock]);

    return el('aside', { class: 'sidebar' }, [brand, mainNav, accountLabel, accountNav, footer]);
  }

  function buildBottomNav() {
    var links = [
      { key: 'home',     icon: 'home',     label: 'nav.home' },
      { key: 'advisor',  icon: 'sparkles', label: 'nav.advisor' },
      { key: 'budget',   icon: 'wallet',   label: 'nav.budget' },
      { key: 'insights', icon: 'chart',    label: 'nav.insights' }
    ];

    var items = links.map(function (l) {
      return el('a', {
        class: 'bottomnav-item' + (isActive(l.key) ? ' active' : ''),
        href: l.key === 'home' ? 'index.html' : l.key + '.html',
        'aria-label': l.label
      }, [
        icon(l.icon, 22),
        el('span', { 'data-i18n': l.label, text: l.label })
      ]);
    });

    return el('nav', { class: 'bottomnav', 'aria-label': 'Primary' }, items);
  }

  function buildTopbar() {
    var theme = document.documentElement.getAttribute('data-theme') || 'light';
    var themeIcon = theme === 'dark' ? 'sun' : 'moon';

    var langBtn = el('button', {
      class: 'pill-toggle',
      'aria-label': 'Toggle language',
      onclick: function () { window.toggleLanguage && window.toggleLanguage(); }
    }, [
      el('span', { class: 'dot' }),
      el('span', { id: 'langLabel', text: 'EN / SW' })
    ]);

    var themeBtn = el('button', {
      class: 'pill-toggle btn-icon btn-sm',
      'aria-label': 'Toggle theme',
      'data-theme-toggle': '1',
      onclick: function () { window.toggleTheme && window.toggleTheme(); }
    }, [icon(themeIcon, 16)]);

    var backBtn = el('a', {
      class: 'topbar-back',
      href: 'index.html',
      'aria-label': 'Back'
    }, [icon('arrow-left', 20)]);

    return el('header', { class: 'topbar' }, [backBtn, langBtn, themeBtn]);
  }

  function buildInstallBanner() {
    if (window.pwa.isInstallDismissed() || !window.pwa.canInstall()) return null;
    var banner = el('div', { class: 'install-banner' });
    banner.innerHTML =
      '<span class="icon-wrap" style="color:var(--primary);">' + icon('sprout', 24).outerHTML + '</span>' +
      '<div class="install-text">' +
        '<div class="install-title" data-i18n="pwa.installTitle">Install KiliMoWise</div>' +
        '<div class="install-sub" data-i18n="pwa.installSub">Get the full app experience on your device</div>' +
      '</div>' +
      '<div class="install-actions">' +
        '<button class="btn btn-primary btn-sm" data-i18n="pwa.installCta">Install</button>' +
        '<button class="install-dismiss" aria-label="Dismiss">' + icon('close', 16).outerHTML + '</button>' +
      '</div>';

    banner.querySelector('.btn-primary').addEventListener('click', async function () {
      var ok = await window.pwa.promptInstall();
      if (ok) banner.remove();
    });
    banner.querySelector('.install-dismiss').addEventListener('click', function () {
      window.pwa.dismissInstall();
      banner.remove();
    });
    return banner;
  }

  function buildUpdateToast() {
    var t = el('div');
    t.className = 'toast info';
    t.style.cssText = 'position:fixed;bottom:calc(var(--shell-bottomnav) + 12px);left:12px;right:12px;z-index:200;';
    t.innerHTML =
      '<span class="toast-icon">' + icon('refresh', 14).outerHTML + '</span>' +
      '<div class="toast-body">' +
        '<div class="toast-title" data-i18n="pwa.updateTitle">New version available</div>' +
        '<div class="toast-msg" data-i18n="pwa.updateMsg">Tap to refresh and get the latest.</div>' +
      '</div>' +
      '<button class="btn-link" data-i18n="pwa.refresh">Refresh</button>';
    t.querySelector('button').addEventListener('click', function () { window.location.reload(); });
    return t;
  }

  function mount() {
    window.svgSprite && window.svgSprite();

    // Sidebar — desktop only, lives in <body> as fixed
    var sidebar = buildSidebar();
    document.body.appendChild(sidebar);

    // Bottom nav — mobile only
    var bottomnav = buildBottomNav();
    document.body.appendChild(bottomnav);

    // Topbar — sticky in [data-topbar]
    var topbarSlot = document.querySelector('[data-topbar]');
    if (topbarSlot) {
      topbarSlot.appendChild(buildTopbar());
    }

    // Install banner — at top of main if available
    var main = document.querySelector('main');
    if (main) {
      var banner = buildInstallBanner();
      if (banner) main.insertBefore(banner, main.firstChild);
    }

    // Update toast
    window.addEventListener('kmw:swupdated', function () {
      var t = buildUpdateToast();
      document.body.appendChild(t);
    });

    // Translate data-i18n nodes that were added after page render
    if (window.applyTranslations) window.applyTranslations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
