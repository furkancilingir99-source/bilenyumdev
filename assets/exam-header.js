/* ---------------------------------------------------------------------------
 * Bilenyum exam-header.js — Sınav / sonuç sayfalarında üst bar logosu
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  function mount(root) {
    var topbars = root
      ? [root.querySelector('.asm-exam-topbar')].filter(Boolean)
      : Array.prototype.slice.call(document.querySelectorAll('.asm-exam-topbar'));

    topbars.forEach(function (topbar) {
      if (!topbar || topbar.querySelector('.asm-exam-brand')) return;

      var brand = document.createElement('a');
      brand.className = 'asm-exam-brand';
      brand.href = 'ogrenci-dashboard.html';
      brand.setAttribute('aria-label', 'Bilenyum anasayfa');
      brand.innerHTML = '<img src="assets/bilenyum-logo.svg" alt="Bilenyum" width="120" height="24" />';
      topbar.insertBefore(brand, topbar.firstChild);
    });
  }

  global.BilenyumExamHeader = { mount: mount };

  if (document.querySelector('.asm-exam-topbar')) {
    mount();
  }
})(typeof window !== 'undefined' ? window : this);
