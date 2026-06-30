/**
 * Tarayıcı / sekme kapanınca oturumu sonlandır.
 * - localStorage + sessionStorage ile tarayıcı oturumu işaretlenir.
 * - Tarayıcı tamamen kapanıp açılınca işaret yoksa eski çerez temizlenir.
 * - Son sekme kapanırken /api/logout (sendBeacon).
 */
(function () {
  'use strict';

  if (window.__bilenyumTabSessionInit) return;
  window.__bilenyumTabSessionInit = true;

  var REG_KEY = 'bilenyum.openTabs';
  var TAB_ID_KEY = 'bilenyum.tabId';
  var RELOAD_KEY = 'bilenyum.reload';
  var NAV_KEY = 'bilenyum.internalNav';
  var BROWSER_SESSION_KEY = 'bilenyum.browserSession';
  var TAB_SESSION_KEY = 'bilenyum.tabSession';
  var STALE_MS = 20000;
  var HEARTBEAT_MS = 4000;

  var tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = 't' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  function isLoginPage() {
    var p = location.pathname || '';
    return p === '/giris' || p === '/giris.html' || p === '/login' || p === '/login.html';
  }

  function readTabs() {
    try {
      var raw = localStorage.getItem(REG_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === 'object' ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function writeTabs(tabs) {
    try {
      localStorage.setItem(REG_KEY, JSON.stringify(tabs));
    } catch (e) {}
  }

  function pruneTabs(tabs, now) {
    Object.keys(tabs).forEach(function (id) {
      if (now - tabs[id] > STALE_MS) delete tabs[id];
    });
    return tabs;
  }

  function syncTab() {
    var now = Date.now();
    var tabs = pruneTabs(readTabs(), now);
    tabs[tabId] = now;
    writeTabs(tabs);
    return tabs;
  }

  function unregisterTab() {
    var tabs = readTabs();
    delete tabs[tabId];
    writeTabs(tabs);
    return Object.keys(tabs).length;
  }

  function getBrowserSessionId() {
    try {
      return localStorage.getItem(BROWSER_SESSION_KEY);
    } catch (e) {
      return null;
    }
  }

  function getTabSessionId() {
    try {
      return sessionStorage.getItem(TAB_SESSION_KEY);
    } catch (e) {
      return null;
    }
  }

  function clearBrowserSession() {
    try {
      localStorage.removeItem(BROWSER_SESSION_KEY);
      sessionStorage.removeItem(TAB_SESSION_KEY);
    } catch (e) {}
  }

  function markBrowserSession() {
    var id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
    try {
      localStorage.setItem(BROWSER_SESSION_KEY, id);
      sessionStorage.setItem(TAB_SESSION_KEY, id);
    } catch (e) {}
    return id;
  }

  function countOtherLiveTabs(now) {
    var tabs = readTabs();
    var count = 0;
    Object.keys(tabs).forEach(function (id) {
      if (id !== tabId && now - tabs[id] <= STALE_MS) count++;
    });
    return count;
  }

  function logoutBeacon() {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/logout');
      return;
    }
    fetch('/api/logout', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(function () {});
  }

  function forceLogoutIfAuthenticated() {
    fetch('/api/session-check', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.authenticated) {
          clearBrowserSession();
          return null;
        }
        return fetch('/api/logout', { method: 'POST', credentials: 'same-origin', keepalive: true });
      })
      .finally(function () {
        clearBrowserSession();
        if (!isLoginPage()) {
          location.replace('/giris?expired=1');
        }
      });
  }

  function enforceBrowserSessionOnLoad() {
    syncTab();
    var now = Date.now();
    var globalId = getBrowserSessionId();
    var tabSessionId = getTabSessionId();

    if (!globalId) {
      forceLogoutIfAuthenticated();
      return;
    }

    if (tabSessionId) {
      if (tabSessionId !== globalId) forceLogoutIfAuthenticated();
      return;
    }

    if (countOtherLiveTabs(now) > 0) {
      try {
        sessionStorage.setItem(TAB_SESSION_KEY, globalId);
      } catch (e) {}
      return;
    }

    forceLogoutIfAuthenticated();
  }

  function shouldSkipLogout() {
    if (sessionStorage.getItem(RELOAD_KEY)) {
      sessionStorage.removeItem(RELOAD_KEY);
      return true;
    }
    if (sessionStorage.getItem(NAV_KEY)) {
      sessionStorage.removeItem(NAV_KEY);
      return true;
    }
    return false;
  }

  function markInternalNav(url) {
    try {
      if (url && url.origin === location.origin) {
        sessionStorage.setItem(NAV_KEY, '1');
      }
    } catch (e) {}
  }

  window.BilenyumBrowserSession = {
    markLoggedIn: markBrowserSession,
    clear: clearBrowserSession
  };

  if (!isLoginPage()) {
    enforceBrowserSessionOnLoad();
  }

  syncTab();
  var heartbeat = window.setInterval(syncTab, HEARTBEAT_MS);

  window.addEventListener('keydown', function (e) {
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
      sessionStorage.setItem(RELOAD_KEY, '1');
    }
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (href.indexOf('javascript:') === 0) return;
    try {
      markInternalNav(new URL(a.href, location.href));
    } catch (err) {}
  }, true);

  document.addEventListener('submit', function () {
    sessionStorage.setItem(NAV_KEY, '1');
  }, true);

  window.addEventListener('pagehide', function (e) {
    window.clearInterval(heartbeat);
    if (e.persisted) return;
    if (shouldSkipLogout()) {
      syncTab();
      return;
    }
    if (unregisterTab() === 0) {
      clearBrowserSession();
      logoutBeacon();
    }
  });

  window.addEventListener('pageshow', function () {
    syncTab();
  });
})();
