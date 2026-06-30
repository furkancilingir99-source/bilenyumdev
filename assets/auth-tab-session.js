/**
 * Sekme / tarayıcı kapanınca oturumu sonlandır.
 * - Son açık sekme kapanırken /api/logout çağrılır (sendBeacon).
 * - F5 / Ctrl+R yenilemesinde çıkış yapılmaz.
 * - Aynı sitede link/form geçişlerinde çıkış yapılmaz.
 */
(function () {
  'use strict';

  if (window.__bilenyumTabSessionInit) return;
  window.__bilenyumTabSessionInit = true;

  var REG_KEY = 'bilenyum.openTabs';
  var TAB_ID_KEY = 'bilenyum.tabId';
  var RELOAD_KEY = 'bilenyum.reload';
  var NAV_KEY = 'bilenyum.internalNav';
  var STALE_MS = 20000;
  var HEARTBEAT_MS = 4000;

  var tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = 't' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
    sessionStorage.setItem(TAB_ID_KEY, tabId);
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

  function logoutBeacon() {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/logout');
      return;
    }
    fetch('/api/logout', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(function () {});
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
    if (unregisterTab() === 0) logoutBeacon();
  });

  window.addEventListener('pageshow', function () {
    syncTab();
  });
})();
