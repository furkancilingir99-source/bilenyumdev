/**
 * Deneme Dersi Yöneticisi paneli — ortak üst bar ve sol navigasyon.
 * body[data-trial-manager-active] ile aktif menü: dashboard | rezervasyonlar
 */
(function (global) {
  'use strict';

  var MANAGER_NAME = 'Elif Yıldırım';
  var MANAGER_ROLE = 'Deneme Dersi Yöneticisi';

  var ICON_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  var ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var ICON_NOTIF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
  var ICON_CHEVRON = '<svg class="hud-player-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  var NAV_ITEMS = [
    { key: 'dashboard', href: 'deneme-dersi-yoneticisi-dashboard.html', title: 'Merkez', label: 'Merkez', icon: ICON_HOME },
    { key: 'rezervasyonlar', href: 'deneme-dersi-yoneticisi-rezervasyonlar.html', title: 'Rezervasyonlar', label: 'Rezervasyonlar', icon: ICON_CAL, labelWrap: true }
  ];

  function getActiveKey() {
    var body = document.body;
    if (body && body.getAttribute('data-trial-manager-active')) {
      return body.getAttribute('data-trial-manager-active');
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
          '<button type="button" class="stat-icon-btn is-notif" id="tmNotifBtn" aria-haspopup="dialog" aria-expanded="false" aria-label="Bildirimler">' +
            ICON_NOTIF +
            '<span class="notif-dot"></span>' +
          '</button>' +
          '<div class="hud-profile">' +
            '<button type="button" class="hud-player" id="profileBtn" aria-haspopup="true" aria-expanded="false" aria-label="Profil">' +
              '<span class="player-avatar-wrap">' +
                '<span class="player-avatar"><span aria-hidden="true">📋</span></span>' +
              '</span>' +
              '<span class="player-text">' +
                '<span class="player-name">' + MANAGER_NAME + '</span>' +
                '<span class="player-clan">' + MANAGER_ROLE + '</span>' +
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
    return '<aside class="nav-rail" aria-label="Deneme dersi yöneticisi menüsü">' + links + '</aside>';
  }

  function mount() {
    var activeKey = getActiveKey();
    var hudMount = document.querySelector('[data-trial-manager-hud]');
    if (hudMount) {
      var extra = hudMount.getAttribute('data-trial-manager-hud-class') || '';
      hudMount.outerHTML = renderHud(extra);
    }
    var navMount = document.querySelector('[data-trial-manager-nav]');
    if (navMount) {
      navMount.innerHTML = renderNav(activeKey);
    }
  }

  function loadNotifications() {
    if (!document.getElementById('tmNotifBtn')) return;
    if (global.TrialManagerNotifications) {
      global.TrialManagerNotifications.init();
      return;
    }
    if (!document.querySelector('link[href*="inbox.css"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'assets/inbox.css';
      document.head.appendChild(link);
    }
    var script = document.createElement('script');
    script.src = 'assets/trial-lesson-manager-notifications.js';
    script.onload = function () {
      if (global.TrialManagerNotifications) global.TrialManagerNotifications.init();
    };
    document.head.appendChild(script);
  }

  function initProfileMenu() {
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
        } catch (err) {}
      }
      fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
        .finally(function () { window.location.href = '/giris'; });
    });
  }

  function init() {
    mount();
    initProfileMenu();
    loadNotifications();
    if (global.DashboardSwitcher) {
      global.DashboardSwitcher.mount();
      if (global.DashboardSwitcher.syncHudHeight) global.DashboardSwitcher.syncHudHeight();
    }
  }

  global.TrialLessonManagerShell = {
    mount: mount,
    MANAGER_NAME: MANAGER_NAME,
    MANAGER_ROLE: MANAGER_ROLE,
    NAV_ITEMS: NAV_ITEMS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
