/**
 * Kaynak kod / içerik kopyalamayı zorlaştıran istemci koruması.
 * Not: Tarayıcıya inen kod tamamen gizlenemez; bu katman caydırıcıdır.
 * localhost'ta kapalıdır (localStorage bilenyum.enableCodeGuard=1 ile açılabilir).
 */
(function () {
  'use strict';

  if (window.__bilenyumCodeGuard) return;
  window.__bilenyumCodeGuard = true;

  function isLocalDev() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  }

  function isEnabled() {
    if (!isLocalDev()) return true;
    try {
      return localStorage.getItem('bilenyum.enableCodeGuard') === '1';
    } catch (e) {
      return false;
    }
  }

  if (!isEnabled()) return;

  function isAllowedTarget(el) {
    if (!el || !el.closest) return false;
    return !!el.closest(
      'input, textarea, select, option, [contenteditable="true"], ' +
      '.allow-copy, .allow-contextmenu, .allow-select, [data-allow-copy], [data-allow-contextmenu], [data-allow-select], ' +
      '.asm-exam-page, .asm-homework-page, .asm-hw-block, .asm-question-text, .prog-drawer-panel'
    );
  }

  function blockEvent(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  document.addEventListener('contextmenu', function (e) {
    if (isAllowedTarget(e.target)) return;
    blockEvent(e);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (isAllowedTarget(e.target)) {
      if (e.ctrlKey || e.metaKey) {
        var k = e.key.toLowerCase();
        if (k === 'c' || k === 'v' || k === 'x' || k === 'a' || k === 'z' || k === 'y') return;
      }
      return;
    }

    var key = e.key;
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;
    var alt = e.altKey;

    if (key === 'F12') return blockEvent(e);
    if (ctrl && shift && /^(i|j|c|k|u)$/i.test(key)) return blockEvent(e);
    if (ctrl && !shift && /^(u|s|p)$/i.test(key)) return blockEvent(e);
    if (alt && key === 'F4') return blockEvent(e);
    if (ctrl && key === 'F5') return; // yenilemeye izin ver
  }, true);

  document.addEventListener('copy', function (e) {
    if (isAllowedTarget(e.target)) return;
    blockEvent(e);
  }, true);

  document.addEventListener('cut', function (e) {
    if (isAllowedTarget(e.target)) return;
    blockEvent(e);
  }, true);

  document.addEventListener('selectstart', function (e) {
    if (isAllowedTarget(e.target)) return;
    blockEvent(e);
  }, true);

  document.addEventListener('dragstart', function (e) {
    if (isAllowedTarget(e.target)) return;
    var tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'img' || tag === 'svg' || e.target.closest('img, svg, picture, video')) {
      blockEvent(e);
    }
  }, true);

  var style = document.createElement('style');
  style.textContent =
    'html.bilenyum-guard, html.bilenyum-guard body {' +
      '-webkit-user-select: none; user-select: none; -webkit-touch-callout: none;' +
    '}' +
    'html.bilenyum-guard input, html.bilenyum-guard textarea, html.bilenyum-guard select, ' +
    'html.bilenyum-guard [contenteditable="true"], html.bilenyum-guard .allow-copy, ' +
    'html.bilenyum-guard [data-allow-copy], html.bilenyum-guard .allow-select, ' +
    'html.bilenyum-guard [data-allow-select], html.bilenyum-guard .asm-exam-page, ' +
    'html.bilenyum-guard .asm-homework-page, html.bilenyum-guard .asm-hw-block, ' +
    'html.bilenyum-guard .asm-question-text, html.bilenyum-guard .prog-drawer-panel {' +
      '-webkit-user-select: text; user-select: text;' +
    '}';
  document.documentElement.classList.add('bilenyum-guard');
  (document.head || document.documentElement).appendChild(style);
})();
