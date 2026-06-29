/**
 * Veli / Öğrenci / Öğretmen dashboard geçişi — HUD logosunun yanında
 * window.DashboardSwitcher.mount()
 */
(function (global) {
  'use strict';

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

  var ITEMS = [
    { key: 'veli', href: 'veli-dashboard.html', label: 'Veli Dashboard', short: 'Veli', icon: ICON_VELI, cls: 'is-veli' },
    { key: 'student', href: 'dashboard.html', label: 'Öğrenci Dashboard', short: 'Öğrenci', icon: ICON_STUDENT, cls: 'is-student' },
    { key: 'teacher', href: 'ogretmen-dashboard.html', label: 'Öğretmen Dashboard', short: 'Öğretmen', icon: ICON_TEACHER, cls: 'is-teacher' }
  ];

  function pageName() {
    var path = (global.location && global.location.pathname) || '';
    var parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  function detectPersona() {
    var file = pageName().toLowerCase();
    if (document.body && document.body.getAttribute('data-teacher-active') !== null) return 'teacher';
    if (document.body && document.body.classList.contains('is-veli-parent')) return 'veli';
    if (/^ogretmen-/.test(file)) return 'teacher';
    if (/^veli-/.test(file)) return 'veli';
    return 'student';
  }

  function renderSwitcher(activeKey) {
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
      '<nav class="db-switch" role="navigation" aria-label="Dashboard geçişi">' +
        '<div class="db-switch-inner">' + buttons + '</div>' +
      '</nav>'
    );
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

  function mount() {
    if (document.querySelector('.db-switch')) {
      syncHudHeight();
      return true;
    }

    var hud = document.querySelector('.hud');
    if (!hud) return false;

    var brand = hud.querySelector('.hud-brand');
    if (!brand) return false;

    var left = ensureHudLeft(hud, brand);

    var wrap = document.createElement('div');
    wrap.innerHTML = renderSwitcher(detectPersona());
    var nav = wrap.firstElementChild;
    if (!nav) return false;

    left.appendChild(nav);
    watchHudHeight();
    return true;
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
