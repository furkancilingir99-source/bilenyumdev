/**
 * Kritik işlem onay dialogu — etkilenen kişiler + zorunlu neden
 */
(function (global) {
  'use strict';

  var U = global.TMUtils;

  var overlay = null;

  function ensureModal() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'tm-crit-overlay';
    overlay.id = 'tmCritModal';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="tm-crit-dialog" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><h2 class="tm-crit-title" data-crit-title></h2></header>' +
        '<div class="tm-crit-body" data-crit-body></div>' +
        '<footer class="tm-crit-foot">' +
          '<button type="button" class="tm-btn tm-btn--ghost" data-crit-cancel>İptal</button>' +
          '<button type="button" class="tm-btn tm-btn--danger" data-crit-confirm>Onayla</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-crit-cancel]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
    });
    return overlay;
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tm-drawer-open');
  }

  function open(opts) {
    var el = ensureModal();
    opts = opts || {};
    el.querySelector('[data-crit-title]').textContent = opts.title || 'Emin misiniz?';
    var body = '';
    if (opts.current) body += '<div class="tm-crit-block"><strong>Mevcut:</strong> ' + U.escapeHtml(opts.current) + '</div>';
    if (opts.next) body += '<div class="tm-crit-block"><strong>Yeni:</strong> ' + U.escapeHtml(opts.next) + '</div>';
    if (opts.affected && opts.affected.length) {
      body += '<div class="tm-crit-block"><strong>Etkilenen kişiler:</strong><ul class="tm-crit-list">';
      opts.affected.forEach(function (a) { body += '<li>' + U.escapeHtml(a) + '</li>'; });
      body += '</ul></div>';
    }
    if (opts.warning) body += '<p class="tm-crit-warn">' + U.escapeHtml(opts.warning) + '</p>';
    body += '<label class="tm-crit-label">Açıklama / neden <span class="tm-req">*</span>' +
      '<textarea class="tm-crit-input" data-crit-reason rows="3" placeholder="Zorunlu"></textarea></label>';
    el.querySelector('[data-crit-body]').innerHTML = body;
    var confirmBtn = el.querySelector('[data-crit-confirm]');
    confirmBtn.textContent = opts.confirmLabel || 'Onayla';
    confirmBtn.className = 'tm-btn ' + (opts.danger !== false ? 'tm-btn--danger' : 'tm-btn--primary');
    confirmBtn.onclick = function () {
      var reason = el.querySelector('[data-crit-reason]').value.trim();
      if (!reason) {
        el.querySelector('[data-crit-reason]').focus();
        el.querySelector('[data-crit-reason]').classList.add('is-error');
        return;
      }
      close();
      if (opts.onConfirm) opts.onConfirm(reason);
    };
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tm-drawer-open');
    setTimeout(function () {
      var ta = el.querySelector('[data-crit-reason]');
      if (ta) ta.focus();
    }, 50);
  }

  global.TMConfirmDialog = { open: open, close: close };
})(typeof window !== 'undefined' ? window : this);
