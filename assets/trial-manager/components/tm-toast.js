/**
 * Kısa süreli bildirimler — alert yerine
 */
(function (global) {
  'use strict';

  var container = null;

  function ensure() {
    if (container) return container;
    container = document.createElement('div');
    container.id = 'tmToastHost';
    container.className = 'tm-toast-host';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
  }

  function show(message, type) {
    var host = ensure();
    var el = document.createElement('div');
    el.className = 'tm-toast' + (type ? ' is-' + type : '');
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-visible'); });
    setTimeout(function () {
      el.classList.remove('is-visible');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
    }, 3200);
  }

  global.TMToast = {
    show: show,
    success: function (m) { show(m, 'success'); },
    error: function (m) { show(m, 'error'); },
    info: function (m) { show(m, 'info'); }
  };
})(typeof window !== 'undefined' ? window : this);
