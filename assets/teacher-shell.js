/**
 * Öğretmen paneli — ortak üst bar (profil) ve sol navigasyon.
 * Sayfada data-teacher-hud ve data-teacher-nav mount noktaları beklenir.
 * body[data-teacher-active] ile aktif menü: dashboard | klanlar | odev | performans
 */
(function (global) {
  'use strict';

  var TEACHER_NAME = 'Furkan Çilingir';
  var TEACHER_ROLE = 'Öğretmen';

  var ICON_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var ICON_GROUPS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_HW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
  var ICON_PERF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>';
  var ICON_EXAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1z"/><path d="M9 12l2 2 4-4"/></svg>';
  var ICON_CHEVRON = '<svg class="hud-player-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  var NAV_ITEMS = [
    { key: 'dashboard', href: 'ogretmen-dashboard.html', title: 'Merkez', label: 'Merkez', icon: ICON_HOME },
    { key: 'klanlar', href: 'ogretmen-klanlar.html', title: 'Öğrenci & Klan Detay', label: 'Öğrenci & Klan Detay', icon: ICON_GROUPS, labelWrap: true },
    { key: 'odev', href: 'ogretmen-odev-kontrol.html', title: 'Ödev Kontrol', label: 'Ödev Kontrol', icon: ICON_HW },
    { key: 'deneme', href: 'ogretmen-deneme-sinavlari.html', title: 'Deneme Sınavları', label: 'Deneme Sınavları', icon: ICON_EXAM },
    { key: 'performans', href: 'ogretmen-performans.html', title: 'Performansım', label: 'Performansım', icon: ICON_PERF }
  ];

  function getActiveKey() {
    var body = document.body;
    if (body && body.getAttribute('data-teacher-active')) {
      return body.getAttribute('data-teacher-active');
    }
    var nav = document.querySelector('[data-teacher-nav]');
    if (nav && nav.getAttribute('data-teacher-active')) {
      return nav.getAttribute('data-teacher-active');
    }
    return 'dashboard';
  }

  function renderHud(extraClass) {
    extraClass = extraClass ? ' ' + extraClass : '';
    return (
      '<header class="hud' + extraClass + '">' +
        '<a class="hud-brand" href="index.html" aria-label="Bilenyum anasayfa">' +
          '<img src="assets/bilenyum-logo.svg" alt="Bilenyum" />' +
        '</a>' +
        '<div class="hud-stats">' +
          '<div class="hud-profile">' +
            '<button type="button" class="hud-player" id="profileBtn" aria-haspopup="true" aria-expanded="false" aria-label="Profil">' +
              '<span class="player-avatar-wrap">' +
                '<span class="player-avatar"><span aria-hidden="true">👩‍🏫</span></span>' +
              '</span>' +
              '<span class="player-text">' +
                '<span class="player-name">' + TEACHER_NAME + '</span>' +
                '<span class="player-clan">' + TEACHER_ROLE + '</span>' +
              '</span>' +
              ICON_CHEVRON +
            '</button>' +
            '<div class="hud-menu" id="profileMenu" role="menu">' +
              '<button type="button" class="hud-menu-item" role="menuitem">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                'Profilim' +
              '</button>' +
              '<div class="hud-menu-divider"></div>' +
              '<button type="button" class="hud-menu-item is-danger" role="menuitem">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                'Çıkış Yap' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function renderNav(activeKey) {
    var links = NAV_ITEMS.map(function (item) {
      var isActive = item.key === activeKey;
      return (
        '<a class="nav-item' + (isActive ? ' is-active' : '') + (item.labelWrap ? ' is-label-wrap' : '') + '" href="' + item.href + '" title="' + item.title + '"' +
          (isActive ? ' aria-current="page"' : '') + '>' +
          item.icon +
          '<span class="nav-item-label">' + item.label + '</span>' +
        '</a>'
      );
    }).join('');
    return '<aside class="nav-rail" aria-label="Öğretmen menüsü">' + links + '</aside>';
  }

  function mount() {
    var activeKey = getActiveKey();
    var hudMount = document.querySelector('[data-teacher-hud]');
    if (hudMount) {
      var extra = hudMount.getAttribute('data-teacher-hud-class') || '';
      hudMount.outerHTML = renderHud(extra);
    }
    var navMount = document.querySelector('[data-teacher-nav]');
    if (navMount) {
      navMount.innerHTML = renderNav(activeKey);
    }
  }

  function init() {
    mount();
    initTeacherProfileMenu();
    if (global.DashboardSwitcher) {
      global.DashboardSwitcher.mount();
      if (global.DashboardSwitcher.syncHudHeight) global.DashboardSwitcher.syncHudHeight();
    }
  }

  function initTeacherProfileMenu() {
    var btn = document.getElementById('profileBtn');
    var menu = document.getElementById('profileMenu');
    if (!btn || !menu || btn.dataset.inited) return;
    btn.dataset.inited = '1';
    function close() {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('is-open');
      close();
      if (willOpen) {
        menu.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    menu.addEventListener('click', function (e) {
      var logoutBtn = e.target.closest('.hud-menu-item.is-danger');
      if (!logoutBtn) return;
      e.preventDefault();
      logoutBtn.disabled = true;
      if (window.BilenyumBrowserSession && window.BilenyumBrowserSession.clear) {
        window.BilenyumBrowserSession.clear();
      } else {
        try {
          localStorage.removeItem('bilenyum.browserSession');
          sessionStorage.removeItem('bilenyum.tabSession');
        } catch (e) {}
      }
      fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
        .finally(function () { window.location.href = '/giris'; });
    });
  }

  global.TeacherShell = {
    mount: mount,
    TEACHER_NAME: TEACHER_NAME,
    TEACHER_ROLE: TEACHER_ROLE,
    NAV_ITEMS: NAV_ITEMS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
