/**
 * Veli / Öğrenci / Öğretmen dashboard geçiş çubuğu
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
    { key: 'veli', href: 'veli-dashboard.html', label: 'Veli Dashboard', icon: ICON_VELI, cls: 'is-veli' },
    { key: 'student', href: 'dashboard.html', label: 'Öğrenci Dashboard', icon: ICON_STUDENT, cls: 'is-student' },
    { key: 'teacher', href: 'ogretmen-dashboard.html', label: 'Öğretmen Dashboard', icon: ICON_TEACHER, cls: 'is-teacher' }
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

  function renderBar(activeKey) {
    var buttons = ITEMS.map(function (item) {
      var isActive = item.key === activeKey;
      return (
        '<a href="' + item.href + '" class="db-switch-btn ' + item.cls + (isActive ? ' is-active' : '') + '"' +
          (isActive ? ' aria-current="page"' : '') +
          ' title="' + item.label + '">' +
          item.icon +
          '<span>' + item.label + '</span>' +
        '</a>'
      );
    }).join('');

    return (
      '<div class="db-switch-bar" role="navigation" aria-label="Dashboard geçişi">' +
        '<div class="db-switch-inner">' + buttons + '</div>' +
      '</div>'
    );
  }

  function mount() {
    if (document.querySelector('.db-switch-bar')) return true;
    var hud = document.querySelector('.hud');
    if (!hud) return false;

    var wrap = document.createElement('div');
    wrap.innerHTML = renderBar(detectPersona());
    var bar = wrap.firstElementChild;
    if (!bar) return false;

    hud.parentNode.insertBefore(bar, hud);
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

  global.DashboardSwitcher = { mount: mount, detectPersona: detectPersona };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryMount);
  } else {
    tryMount();
  }
})(typeof window !== 'undefined' ? window : this);
