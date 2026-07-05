(function (global) {
  'use strict';

  /**
   * Admin detay sayfaları — sekme geçişi (#hash ile kalıcı).
   */
  function bind(root) {
    if (!root) return;
    var nav = root.querySelector('[data-admin-tabs]');
    if (!nav || nav.dataset.adminTabsBound) return;
    nav.dataset.adminTabsBound = '1';

    function activate(tabId) {
      if (!tabId) return;
      var hasPanel = root.querySelector('[data-admin-panel="' + tabId + '"]');
      if (!hasPanel) return;

      nav.querySelectorAll('[data-admin-tab]').forEach(function (btn) {
        var on = btn.getAttribute('data-admin-tab') === tabId;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      });

      root.querySelectorAll('[data-admin-panel]').forEach(function (panel) {
        var on = panel.getAttribute('data-admin-panel') === tabId;
        panel.hidden = !on;
      });

      if (history.replaceState) {
        history.replaceState(null, '', '#' + encodeURIComponent(tabId));
      } else {
        location.hash = tabId;
      }
    }

    function initialTabId() {
      var hash = (location.hash || '').replace(/^#/, '');
      if (hash && root.querySelector('[data-admin-panel="' + hash + '"]')) return hash;
      var first = nav.querySelector('[data-admin-tab]');
      return first ? first.getAttribute('data-admin-tab') : '';
    }

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-admin-tab]');
      if (!btn) return;
      e.preventDefault();
      activate(btn.getAttribute('data-admin-tab'));
    });

    nav.addEventListener('keydown', function (e) {
      var tabs = Array.prototype.slice.call(nav.querySelectorAll('[data-admin-tab]'));
      var idx = tabs.findIndex(function (t) { return t.classList.contains('is-active'); });
      if (idx < 0) return;
      var next = idx;
      if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      else return;
      e.preventDefault();
      tabs[next].focus();
      activate(tabs[next].getAttribute('data-admin-tab'));
    });

    activate(initialTabId());
  }

  function renderTabNav(tabs, prefix) {
    prefix = prefix || 'tmAdminTab';
    return (
      '<div class="tm-admin-tabs" data-admin-tabs role="tablist" aria-label="Detay sekmeleri">' +
        tabs.map(function (t, i) {
          var badge = t.badge != null && t.badge !== ''
            ? '<span class="tm-admin-tab-badge' + (t.badgeTone ? ' is-' + t.badgeTone : '') + '">' + t.badge + '</span>'
            : '';
          return (
            '<button type="button" class="tm-admin-tab" id="' + prefix + '-' + t.id + '" data-admin-tab="' + t.id + '" role="tab"' +
              ' aria-controls="' + prefix + 'Panel-' + t.id + '" aria-selected="false" tabindex="' + (i === 0 ? '0' : '-1') + '">' +
              t.label + badge +
            '</button>'
          );
        }).join('') +
      '</div>'
    );
  }

  function panelWrap(id, html, prefix) {
    prefix = prefix || 'tmAdminTab';
    return (
      '<section class="tm-admin-panel" id="' + prefix + 'Panel-' + id + '" data-admin-panel="' + id + '" role="tabpanel" hidden>' +
        html +
      '</section>'
    );
  }

  function kvGrid(rows) {
    return (
      '<dl class="tm-admin-kv">' +
        rows.map(function (row) {
          if (row === null) return '';
          return (
            '<div class="tm-admin-kv-row' + (row.full ? ' is-full' : '') + '">' +
              '<dt>' + row.label + '</dt>' +
              '<dd>' + row.value + '</dd>' +
            '</div>'
          );
        }).join('') +
      '</dl>'
    );
  }

  function summaryCells(cells) {
    return (
      '<div class="tm-admin-summary">' +
        cells.map(function (c) {
          return (
            '<div class="tm-admin-summary-cell' + (c.tone ? ' is-' + c.tone : '') + '">' +
              '<span class="tm-admin-summary-label">' + c.label + '</span>' +
              '<span class="tm-admin-summary-value">' + c.value + '</span>' +
            '</div>'
          );
        }).join('') +
      '</div>'
    );
  }

  global.TrialManagerTabs = {
    bind: bind,
    renderTabNav: renderTabNav,
    panelWrap: panelWrap,
    kvGrid: kvGrid,
    summaryCells: summaryCells
  };
})(typeof window !== 'undefined' ? window : this);
