/**
 * Sağ detay drawer — mobilde tam ekran
 */
(function (global) {
  'use strict';

  var overlay = null;
  var panel = null;
  var onCloseCb = null;

  function ensure() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'tm-drawer-overlay';
    overlay.id = 'tmDetailDrawer';
    overlay.innerHTML =
      '<aside class="tm-drawer" role="dialog" aria-modal="true">' +
        '<header class="tm-drawer-head">' +
          '<div class="tm-drawer-head-main">' +
            '<h2 class="tm-drawer-title" data-dr-title></h2>' +
            '<p class="tm-drawer-sub" data-dr-sub hidden></p>' +
          '</div>' +
          '<div class="tm-drawer-head-actions">' +
            '<a class="tm-drawer-expand" data-dr-expand href="#" hidden>Tam ekranda aç</a>' +
            '<button type="button" class="tm-drawer-close" data-dr-close aria-label="Kapat">&times;</button>' +
          '</div>' +
        '</header>' +
        '<nav class="tm-drawer-tabs" data-dr-tabs hidden></nav>' +
        '<div class="tm-drawer-body" data-dr-body></div>' +
      '</aside>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-dr-close]').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('tm-drawer-open');
    if (onCloseCb) onCloseCb();
  }

  function open(opts) {
    ensure();
    opts = opts || {};
    onCloseCb = opts.onClose || null;
    overlay.querySelector('[data-dr-title]').textContent = opts.title || 'Detay';
    var sub = overlay.querySelector('[data-dr-sub]');
    if (opts.subtitle) {
      sub.textContent = opts.subtitle;
      sub.hidden = false;
    } else sub.hidden = true;
    var expand = overlay.querySelector('[data-dr-expand]');
    if (opts.expandHref) {
      expand.href = opts.expandHref;
      expand.hidden = false;
    } else expand.hidden = true;
    var tabsEl = overlay.querySelector('[data-dr-tabs]');
    if (opts.tabs && opts.tabs.length) {
      tabsEl.hidden = false;
      tabsEl.innerHTML = opts.tabs.map(function (t, i) {
        return '<button type="button" class="tm-drawer-tab' + (i === (opts.activeTab || 0) ? ' is-active' : '') +
          '" data-tab-idx="' + i + '">' + t.label + '</button>';
      }).join('');
      tabsEl.querySelectorAll('[data-tab-idx]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(btn.getAttribute('data-tab-idx'), 10);
          tabsEl.querySelectorAll('.tm-drawer-tab').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          if (opts.onTab) opts.onTab(idx, overlay.querySelector('[data-dr-body]'));
        });
      });
    } else tabsEl.hidden = true;
    overlay.querySelector('[data-dr-body]').innerHTML = opts.body || '';
    overlay.classList.add('is-open');
    document.body.classList.add('tm-drawer-open');
    if (opts.onTab && opts.tabs && opts.tabs.length) {
      opts.onTab(opts.activeTab || 0, overlay.querySelector('[data-dr-body]'));
    }
  }

  function setBody(html) {
    if (!overlay) return;
    overlay.querySelector('[data-dr-body]').innerHTML = html;
  }

  global.TMDetailDrawer = { open: open, close: close, setBody: setBody };
})(typeof window !== 'undefined' ? window : this);
