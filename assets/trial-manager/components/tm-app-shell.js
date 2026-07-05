/**
 * Deneme Dersi Yöneticisi — HUD + sol sidebar (mount tabanlı, DOM taşıma yok)
 */
(function (global) {
  'use strict';

  var MANAGER_NAME = 'Elif Yıldırım';
  var MANAGER_ROLE = 'Deneme Dersi Yöneticisi';

  var ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    teacher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.48.36.93.7 1.31a2 2 0 0 1 .45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.38.34.83.57 1.31.7A2 2 0 0 1 22 16.92z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    notif: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    chevron: '<svg class="hud-player-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="6 9 12 15 18 9"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
  };

  var NAV_ITEMS = [
    { key: 'operasyon', href: 'deneme-dersi-yoneticisi-dashboard.html', label: 'Operasyon Merkezi', icon: ICON.home, badgeMetric: 'actionableCount' },
    { key: 'deneme-dersleri', href: 'deneme-dersi-yoneticisi-planlanmis-dersler.html', label: 'Deneme Dersleri', icon: ICON.calendar, badgeMetric: 'needsAttendanceCount' },
    { key: 'rezervasyon-talepleri', href: 'deneme-dersi-yoneticisi-rezervasyonlar.html', label: 'Rezervasyon Talepleri', icon: ICON.inbox, badgeMetric: 'orphanRequestCount' },
    { key: 'ogrenciler', href: 'deneme-dersi-yoneticisi-ogrenciler.html', label: 'Öğrenciler', icon: ICON.user },
    { key: 'veliler', href: 'deneme-dersi-yoneticisi-veliler.html', label: 'Veliler', icon: ICON.users },
    { key: 'ogretmenler', href: 'deneme-dersi-yoneticisi-ogretmenler.html', label: 'Öğretmenler', icon: ICON.teacher },
    { key: 'online-linkler', href: 'deneme-dersi-yoneticisi-online-linkler.html', label: 'Online Ders Linkleri', icon: ICON.link, badgeMetric: 'linkNotSentCount' },
    { key: 'iletisim', href: 'deneme-dersi-yoneticisi-iletisim.html', label: 'İletişim Takibi', icon: ICON.phone, badgeMetric: 'pendingApprovalCount' },
    { key: 'raporlar', href: 'deneme-dersi-yoneticisi-raporlar.html', label: 'Raporlar', icon: ICON.chart },
    { key: 'kullanicilar', href: 'deneme-dersi-yoneticisi-kullanicilar.html', label: 'Kullanıcılar ve Yetkiler', icon: ICON.shield },
    { key: 'ayarlar', href: 'deneme-dersi-yoneticisi-ayarlar.html', label: 'Ayarlar', icon: ICON.settings }
  ];

  function getActiveKey() {
    var body = document.body;
    var key = body && body.getAttribute('data-tm-page');
    if (key) return key;
    return 'operasyon';
  }

  function renderHud() {
    return (
      '<header class="hud tm-admin-hud">' +
        '<button type="button" class="tm-mobile-menu-btn" id="tmMobileMenuBtn" aria-label="Menüyü aç/kapat">' + ICON.menu + '</button>' +
        '<a class="hud-brand" href="index.html" aria-label="Bilenyum anasayfa">' +
          '<img src="assets/bilenyum-logo.svg" alt="Bilenyum" />' +
        '</a>' +
        '<div class="hud-stats">' +
          '<div class="hud-profile">' +
            '<button type="button" class="hud-player" id="profileBtn" aria-haspopup="true" aria-expanded="false">' +
              '<span class="player-avatar-wrap"><span class="player-avatar"><span aria-hidden="true">DD</span></span></span>' +
              '<span class="player-text">' +
                '<span class="player-name">' + MANAGER_NAME + '</span>' +
                '<span class="player-clan">' + MANAGER_ROLE + '</span>' +
              '</span>' + ICON.chevron +
            '</button>' +
            '<div class="hud-menu" id="profileMenu" role="menu">' +
              '<a class="hud-menu-item" href="deneme-dersi-yoneticisi-ayarlar.html" role="menuitem">Ayarlar</a>' +
              '<button type="button" class="hud-menu-item is-danger" role="menuitem">Çıkış Yap</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function renderSidebar(activeKey) {
    var links = NAV_ITEMS.map(function (item) {
      var active = item.key === activeKey;
      var badge = item.badgeMetric
        ? '<span class="tm-sidebar-badge" data-nav-badge="' + item.badgeMetric + '" hidden></span>'
        : '';
      return (
        '<a class="tm-sidebar-link' + (active ? ' is-active' : '') + '" href="' + item.href + '"' +
          ' data-nav-key="' + item.key + '"' +
          (active ? ' aria-current="page"' : '') + '>' +
          item.icon + '<span>' + item.label + '</span>' + badge +
        '</a>'
      );
    }).join('');
    return (
      '<div class="tm-sidebar-brand">Deneme Dersi Yönetimi</div>' +
      '<nav class="tm-sidebar-nav">' + links + '</nav>'
    );
  }

  function refreshHudProfile() {
    var getUser = global.TMApi && global.TMApi.getCurrentUser ? global.TMApi.getCurrentUser.bind(global.TMApi) :
      (global.TMStore && global.TMStore.getCurrentUser ? global.TMStore.getCurrentUser.bind(global.TMStore) : null);
    if (!getUser) return;
    var u = getUser();
    if (!u) return;
    var nameEl = document.querySelector('.player-name');
    var clanEl = document.querySelector('.player-clan');
    var avatarEl = document.querySelector('.player-avatar span');
    var full = u.firstName + ' ' + u.lastName;
    if (nameEl) nameEl.textContent = full;
    if (clanEl) {
      clanEl.textContent = u.role === 'viewer' ? 'Gözlemci · salt okunur' :
        (u.role === 'super_admin' ? 'Süper yönetici' : MANAGER_ROLE);
    }
    if (avatarEl) {
      avatarEl.textContent = (String(u.firstName || 'D')[0] + String(u.lastName || 'D')[0]).toUpperCase();
    }
  }

  function refreshSidebarBadges() {
    var getMetrics = global.TMApi && global.TMApi.getOperationMetrics ? global.TMApi.getOperationMetrics.bind(global.TMApi) :
      (global.TMStore && global.TMStore.getOperationMetrics ? global.TMStore.getOperationMetrics.bind(global.TMStore) : null);
    if (!getMetrics) return;
    refreshHudProfile();
    var m = getMetrics();
    NAV_ITEMS.forEach(function (item) {
      if (!item.badgeMetric) return;
      var el = document.querySelector('[data-nav-badge="' + item.badgeMetric + '"]');
      if (!el) return;
      var n = m[item.badgeMetric] || 0;
      if (n > 0) {
        el.textContent = n > 99 ? '99+' : String(n);
        el.hidden = false;
      } else {
        el.hidden = true;
        el.textContent = '';
      }
    });
  }

  function installSessionChangeHook() {
    var wrapped = null;
    Object.defineProperty(global, 'TMOnSessionChange', {
      configurable: true,
      enumerable: true,
      get: function () { return wrapped; },
      set: function (fn) {
        wrapped = function () {
          refreshSidebarBadges();
          if (typeof fn === 'function') fn();
        };
      }
    });
  }

  function ensureLayout() {
    var layout = document.querySelector('.tm-admin-layout');
    var main = document.querySelector('.tm-admin-main');
    if (!layout) {
      layout = document.createElement('div');
      layout.className = 'tm-admin-layout';
      var sidebar = document.createElement('aside');
      sidebar.id = 'tmSidebarMount';
      sidebar.className = 'tm-sidebar';
      sidebar.setAttribute('aria-label', 'Deneme dersi yönetim menüsü');
      if (main) {
        main.classList.add('tm-admin-main');
        var parent = main.parentNode;
        parent.insertBefore(layout, main);
        layout.appendChild(sidebar);
        layout.appendChild(main);
      } else {
        var legacyMain = document.querySelector('.tm-main-col');
        if (legacyMain) {
          legacyMain.classList.remove('tm-main-col');
          legacyMain.classList.add('tm-admin-main');
          var stage = legacyMain.closest('.stage, main');
          if (stage) {
            stage.classList.remove('tm-stage', 'stage');
            stage.parentNode.insertBefore(layout, stage);
            layout.appendChild(sidebar);
            while (stage.firstChild) layout.appendChild(stage.firstChild);
            stage.remove();
          }
        }
      }
    }
    return layout;
  }

  function mountHud() {
    var mount = document.getElementById('tmHudMount') || document.querySelector('[data-trial-manager-hud]');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'tmHudMount';
      document.body.insertBefore(mount, document.body.firstChild);
    }
    mount.innerHTML = renderHud();
    refreshHudProfile();
  }

  function mountSidebar() {
    ensureLayout();
    var sidebar = document.getElementById('tmSidebarMount') || document.querySelector('.tm-sidebar');
    if (!sidebar) {
      sidebar = document.createElement('aside');
      sidebar.id = 'tmSidebarMount';
      sidebar.className = 'tm-sidebar';
      var layout = document.querySelector('.tm-admin-layout');
      if (layout) layout.insertBefore(sidebar, layout.firstChild);
    }
    sidebar.innerHTML = renderSidebar(getActiveKey());
  }

  function initProfileMenu() {
    var btn = document.getElementById('profileBtn');
    var menu = document.getElementById('profileMenu');
    if (!btn || !menu || btn.dataset.inited) return;
    btn.dataset.inited = '1';
    function closeMenu() {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('is-open');
      closeMenu();
      if (willOpen) {
        menu.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    menu.addEventListener('click', function (e) {
      var logoutBtn = e.target.closest('.hud-menu-item.is-danger');
      if (!logoutBtn) return;
      e.preventDefault();
      logoutBtn.disabled = true;
      if (global.BilenyumBrowserSession && global.BilenyumBrowserSession.clear) {
        global.BilenyumBrowserSession.clear();
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

  function initMobileMenu() {
    var btn = document.getElementById('tmMobileMenuBtn');
    var sidebar = document.querySelector('.tm-sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function () {
      sidebar.classList.toggle('is-mobile-open');
    });
  }

  function loadScript(src, key, onload) {
    if (document.querySelector('script[data-tm-load="' + key + '"]')) {
      if (onload) onload();
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.dataset.tmLoad = key;
    s.onload = function () { if (onload) onload(); };
    document.head.appendChild(s);
  }

  function mountSwitcher() {
    function run() {
      if (global.DashboardSwitcher) global.DashboardSwitcher.mount();
    }
    if (global.DashboardSwitcher) run();
    else loadScript('assets/dashboard-switcher.js', 'switcher', run);
  }

  function mountToast() {
    if (global.TMToast) return;
    loadScript('assets/trial-manager/components/tm-toast.js', 'toast');
  }

  function init() {
    document.body.classList.add('tm-admin-body');
    document.documentElement.classList.add('tm-admin-root');
    installSessionChangeHook();
    mountHud();
    mountSidebar();
    refreshSidebarBadges();
    mountToast();
    mountSwitcher();
    initProfileMenu();
    initMobileMenu();
    var oldNav = document.querySelector('.stage-nav, [data-trial-manager-nav], .nav-rail');
    if (oldNav) oldNav.remove();
  }

  global.TMAppShell = {
    NAV_ITEMS: NAV_ITEMS,
    getActiveKey: getActiveKey,
    refreshSidebarBadges: refreshSidebarBadges,
    refreshHudProfile: refreshHudProfile,
    init: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
