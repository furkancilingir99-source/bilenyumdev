(function (global) {
  'use strict';

  function bindModal(modalEl) {
    if (!modalEl || modalEl.dataset.tmModalBound) return;
    modalEl.dataset.tmModalBound = '1';

    function close() {
      modalEl.classList.remove('is-open');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tm-modal-open');
    }

    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-tm-modal-close]') || e.target.classList.contains('tm-modal-overlay')) {
        close();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) close();
    });

    modalEl._tmClose = close;
    modalEl._tmOpen = function (opts) {
      opts = opts || {};
      var titleEl = modalEl.querySelector('[data-tm-modal-title]');
      var subEl = modalEl.querySelector('[data-tm-modal-sub]');
      var bodyEl = modalEl.querySelector('[data-tm-modal-body]');
      var footEl = modalEl.querySelector('[data-tm-modal-foot]');
      if (titleEl) titleEl.textContent = opts.title || '—';
      if (subEl) {
        subEl.textContent = opts.subtitle || '';
        subEl.hidden = !opts.subtitle;
      }
      if (bodyEl) bodyEl.innerHTML = opts.body || '';
      if (footEl) footEl.innerHTML = opts.foot || '';
      modalEl.classList.add('is-open');
      modalEl.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tm-modal-open');
    };
  }

  function get(modalId) {
    var el = document.getElementById(modalId || 'tmModal');
    if (el) bindModal(el);
    return el;
  }

  global.TrialManagerModal = {
    get: get,
    open: function (opts, modalId) {
      var el = get(modalId);
      if (el && el._tmOpen) el._tmOpen(opts);
    },
    close: function (modalId) {
      var el = get(modalId);
      if (el && el._tmClose) el._tmClose();
    },
    confirmDelete: function (opts) {
      opts = opts || {};
      var subject = opts.subject || 'Bu kayıt';
      var detail = opts.detail ? '\n\n' + opts.detail : '';
      return window.confirm(
        subject + ' kalıcı olarak silinecek. Bu işlem geri alınamaz.' + detail + '\n\nKesinlikle emin misiniz?'
      );
    },
    confirmRemove: function (opts) {
      opts = opts || {};
      var subject = opts.subject || 'Bu öğrenci';
      var detail = opts.detail ? '\n\n' + opts.detail : '';
      return window.confirm(
        subject + ' dersten çıkarılacak.' + detail + '\n\nKesinlikle emin misiniz?'
      );
    }
  };
})(typeof window !== 'undefined' ? window : this);
