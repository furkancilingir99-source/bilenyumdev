/**
 * Website / Veli / Öğrenci / Öğretmen geçişi
 * - Dashboard: HUD header içinde yatay switcher
 * - Website: sol sabit dikey menü (header'ı bozmaz)
 */
(function (global) {
  'use strict';

  var ICON_WEBSITE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<line x1="2" y1="12" x2="22" y2="12"/>' +
      '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>' +
    '</svg>';

  var ICON_VELI =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>' +
      '<circle cx="9" cy="7" r="4"/>' +
      '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/>' +
      '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>' +
    '</svg>';

  var ICON_STUDENT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/>' +
      '<path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/>' +
    '</svg>';

  var ICON_TEACHER =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>' +
      '<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' +
    '</svg>';

  var WEBSITE_PAGES = {
    '': true,
    'index.html': true,
    'egitim-setleri.html': true,
    'ornek-videolar.html': true,
    'kadromuz.html': true,
    'kadromuz-detay.html': true,
    'neden-biz.html': true,
    'iletisim.html': true,
    'blog.html': true,
    'blog-detay.html': true,
    'kariyer.html': true,
    'paket-detay.html': true,
    'egitim-modeli.html': true,
    'sss.html': true
  };

  var ITEMS = [
    { key: 'website', href: '/', label: 'Website', short: 'Website', icon: ICON_WEBSITE, cls: 'is-website' },
    { key: 'veli', href: 'veli-dashboard.html', label: 'Veli Dashboard', short: 'Veli', icon: ICON_VELI, cls: 'is-veli' },
    { key: 'student', href: 'ogrenci-dashboard.html', label: 'Öğrenci Dashboard', short: 'Öğrenci', icon: ICON_STUDENT, cls: 'is-student' },
    { key: 'teacher', href: 'ogretmen-dashboard.html', label: 'Öğretmen Dashboard', short: 'Öğretmen', icon: ICON_TEACHER, cls: 'is-teacher' }
  ];

  function pageName() {
    var path = (global.location && global.location.pathname) || '';
    var parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  function isWebsitePage() {
    var file = pageName().toLowerCase();
    var path = (global.location && global.location.pathname) || '';
    if (path === '/' || path === '/index') return true;
    return !!WEBSITE_PAGES[file];
  }

  function detectPersona() {
    if (isWebsitePage()) return 'website';
    if (document.body && document.body.getAttribute('data-teacher-active') !== null) return 'teacher';
    if (document.body && document.body.classList.contains('is-veli-parent')) return 'veli';
    var file = pageName().toLowerCase();
    if (/^ogretmen-/.test(file)) return 'teacher';
    if (/^veli-/.test(file)) return 'veli';
    return 'student';
  }

  function renderHudSwitcher(activeKey) {
    var buttons = ITEMS.map(function (item) {
      var isActive = item.key === activeKey;
      return (
        '<a href="' + item.href + '" class="db-switch-btn ' + item.cls + (isActive ? ' is-active' : '') + '"' +
          (isActive ? ' aria-current="page"' : '') +
          ' title="' + item.label + '">' +
          item.icon +
          '<span class="db-switch-label">' + item.short + '</span>' +
        '</a>'
      );
    }).join('');

    return (
      '<nav class="db-switch" role="navigation" aria-label="Bölüm geçişi">' +
        '<div class="db-switch-inner">' + buttons + '</div>' +
      '</nav>'
    );
  }

  function renderSiteRail(activeKey) {
    var buttons = ITEMS.map(function (item) {
      var isActive = item.key === activeKey;
      return (
        '<a href="' + item.href + '" class="site-rail-btn ' + item.cls + (isActive ? ' is-active' : '') + '"' +
          (isActive ? ' aria-current="page"' : '') +
          ' title="' + item.label + '">' +
          item.icon +
          '<span class="site-rail-label">' + item.short + '</span>' +
        '</a>'
      );
    }).join('');

    return (
      '<aside class="site-persona-rail" aria-label="Bölüm geçişi">' +
        '<p class="site-rail-title">Bölümler</p>' +
        '<nav class="site-rail-nav">' + buttons + '</nav>' +
      '</aside>'
    );
  }

  function cleanupNavHeaderSwitcher() {
    var navInner = document.querySelector('header.nav .nav-inner, nav.nav .nav-inner');
    if (!navInner) return;

    var left = navInner.querySelector('.nav-brand-left');
    if (!left) return;

    var logo = left.querySelector('.logo');
    var switcher = left.querySelector('.db-switch');
    if (switcher) switcher.remove();

    if (logo) {
      navInner.insertBefore(logo, navInner.firstChild);
    }
    left.remove();
  }

  function ensureHudLeft(hud, brand) {
    var left = hud.querySelector('.hud-left');
    if (left) return left;

    left = document.createElement('div');
    left.className = 'hud-left';
    hud.insertBefore(left, brand);
    left.appendChild(brand);
    return left;
  }

  var hudResizeObserver = null;

  function syncHudHeight() {
    var hud = document.querySelector('.hud');
    if (!hud) return;

    var height = Math.ceil(hud.getBoundingClientRect().height);
    if (height < 1) height = 88;

    document.documentElement.style.setProperty('--hud-height', height + 'px');
  }

  function watchHudHeight() {
    var hud = document.querySelector('.hud');
    if (!hud || hudResizeObserver) return;

    syncHudHeight();

    if (typeof global.ResizeObserver === 'function') {
      hudResizeObserver = new global.ResizeObserver(syncHudHeight);
      hudResizeObserver.observe(hud);
    }

    global.addEventListener('resize', syncHudHeight, { passive: true });
    global.addEventListener('orientationchange', syncHudHeight, { passive: true });
  }

  function mountOnHud() {
    var hud = document.querySelector('.hud');
    if (!hud) return false;

    var brand = hud.querySelector('.hud-brand');
    if (!brand) return false;

    var left = ensureHudLeft(hud, brand);
    if (left.querySelector('.db-switch')) {
      syncHudHeight();
      return true;
    }

    var wrap = document.createElement('div');
    wrap.innerHTML = renderHudSwitcher(detectPersona());
    var nav = wrap.firstElementChild;
    if (!nav) return false;

    left.appendChild(nav);
    watchHudHeight();
    return true;
  }

  function mountSiteRail() {
    if (!isWebsitePage()) return false;

    cleanupNavHeaderSwitcher();

    if (document.querySelector('.site-persona-rail')) {
      document.body.classList.add('has-persona-rail');
      return true;
    }

    var wrap = document.createElement('div');
    wrap.innerHTML = renderSiteRail(detectPersona());
    var rail = wrap.firstElementChild;
    if (!rail) return false;

    document.body.appendChild(rail);
    document.body.classList.add('has-persona-rail');
    return true;
  }

  function mount() {
    if (document.querySelector('.hud')) {
      if (document.querySelector('.db-switch')) {
        syncHudHeight();
        return true;
      }
      return mountOnHud();
    }

    if (isWebsitePage()) {
      return mountSiteRail();
    }

    return false;
  }

  function tryMount() {
    if (mount()) return;
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      if (mount() || attempts > 20) clearInterval(timer);
    }, 50);
  }

  global.DashboardSwitcher = { mount: mount, detectPersona: detectPersona, syncHudHeight: syncHudHeight };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      tryMount();
      watchHudHeight();
    });
  } else {
    tryMount();
    watchHudHeight();
  }
})(typeof window !== 'undefined' ? window : this);
