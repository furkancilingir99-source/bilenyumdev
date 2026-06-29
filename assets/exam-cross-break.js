/* ---------------------------------------------------------------------------
 * Bilenyum exam-cross-break.js — Sınavlar arası zorunlu mola (3 dk)
 * Seviye belirleme ↔ Dikkat testi geçişlerinde, tamamlamadan 3 dk içinde
 * geçiş yapılırsa mola ekranı gösterilir; checkbox ile atlanabilir.
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';
  var CROSS_GAP_MS = 3 * 60 * 1000;

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }
  function lsRemove(k) { try { localStorage.removeItem(P + k); } catch (e) {} }

  function formatTimer(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function getPlacementCompletedAt() {
    try {
      var raw = lsGet('placementResults');
      if (!raw) return null;
      return JSON.parse(raw).completedAt || null;
    } catch (e) { return null; }
  }

  function getAttentionCompletedAt() {
    try {
      var raw = lsGet('attentionResults');
      if (!raw) return null;
      return JSON.parse(raw).completedAt || null;
    } catch (e) { return null; }
  }

  function copyForTarget(target) {
    if (target === 'attention') {
      return {
        title: 'Dikkat testine geçmeden önce mola',
        text: 'Seviye belirleme sınavını yeni tamamladın. Bir sonraki sınava geçmeden önce kısa bir mola ver.',
        hintWait: '3 dakikalık molan var. Dinlenmek istersen süreyi bekle; molayı atlamak istersen "Mola hakkımı kullanmak istemiyorum" kutucuğunu işaretle.',
        hintSkip: 'Mola hakkını kullanmak istemiyorsun. Hazırsan aşağıdaki butona basarak dikkat testine geçebilirsin.',
        hintDone: 'Mola bitti! Dikkat testine başlamak için aşağıdaki butona bas.',
        btnLabel: 'Dikkat Testine Başla',
        barLabel: 'Sınav arası mola'
      };
    }
    return {
      title: 'Seviye belirleme sınavına geçmeden önce mola',
      text: 'Dikkat testini yeni tamamladın. Bir sonraki sınava geçmeden önce kısa bir mola ver.',
      hintWait: '3 dakikalık molan var. Dinlenmek istersen süreyi bekle; molayı atlamak istersen "Mola hakkımı kullanmak istemiyorum" kutucuğunu işaretle.',
      hintSkip: 'Mola hakkını kullanmak istemiyorsun. Hazırsan aşağıdaki butona basarak seviye belirleme sınavına geçebilirsin.',
      hintDone: 'Mola bitti! Seviye belirleme sınavına başlamak için aşağıdaki butona bas.',
      btnLabel: 'Seviye Belirleme Sınavına Başla',
      barLabel: 'Sınav arası mola'
    };
  }

  function resolveBreakConfig(target) {
    var Assessment = global.BilenyumAssessment;
    if (!Assessment) return null;

    var completedAt = null;
    if (target === 'attention') {
      if (!Assessment.isPlacementDone() || Assessment.isAttentionDone()) return null;
      completedAt = getPlacementCompletedAt();
    } else if (target === 'placement') {
      if (!Assessment.isAttentionDone() || Assessment.isPlacementDone()) return null;
      completedAt = getAttentionCompletedAt();
    } else {
      return null;
    }

    if (!completedAt) return null;

    var minEndMs = new Date(completedAt).getTime() + CROSS_GAP_MS;
    if (Date.now() >= minEndMs) {
      clearCrossBreak();
      return null;
    }

    var storedTarget = lsGet('crossBreakTarget');
    var storedEnd = lsGet('crossBreakEndAt');
    var endMs = minEndMs;
    if (storedTarget === target && storedEnd) {
      endMs = Math.max(minEndMs, new Date(storedEnd).getTime());
    }
    lsSet('crossBreakTarget', target);
    lsSet('crossBreakEndAt', new Date(endMs).toISOString());

    return {
      target: target,
      endMs: endMs,
      copy: copyForTarget(target)
    };
  }

  function clearCrossBreak() {
    lsRemove('crossBreakTarget');
    lsRemove('crossBreakEndAt');
  }

  function secondsLeft(endMs) {
    return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  }

  function runGate(target, root, onReady) {
    if (!root || typeof onReady !== 'function') return;

    var config = resolveBreakConfig(target);
    if (!config) {
      onReady();
      return;
    }

    var overlay = document.getElementById('asmCrossExamBreak');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'asm-phase-transition';
      overlay.id = 'asmCrossExamBreak';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML =
        '<div class="asm-phase-transition-card">' +
          '<span class="asm-phase-transition-icon">☕</span>' +
          '<h2 id="asmCrossBreakTitle"></h2>' +
          '<p id="asmCrossBreakText"></p>' +
          '<div class="asm-break-timer-wrap">' +
            '<span class="asm-break-timer-label">Mola süresi</span>' +
            '<div class="asm-break-timer" id="asmCrossBreakTimer" aria-live="polite">03:00</div>' +
          '</div>' +
          '<p class="asm-transition-hint" id="asmCrossBreakHint"></p>' +
          '<label class="asm-break-skip" for="asmCrossBreakSkip">' +
            '<input type="checkbox" id="asmCrossBreakSkip" class="asm-break-skip-input" />' +
            '<span class="asm-break-skip-box" aria-hidden="true"></span>' +
            '<span class="asm-break-skip-text">Mola hakkımı kullanmak istemiyorum</span>' +
          '</label>' +
          '<button type="button" class="asm-btn asm-btn-primary is-waiting" id="asmCrossBreakBtn" disabled></button>' +
        '</div>';
      root.appendChild(overlay);
    }

    var titleEl = overlay.querySelector('#asmCrossBreakTitle');
    var textEl = overlay.querySelector('#asmCrossBreakText');
    var timerEl = overlay.querySelector('#asmCrossBreakTimer');
    var hintEl = overlay.querySelector('#asmCrossBreakHint');
    var skipEl = overlay.querySelector('#asmCrossBreakSkip');
    var btnEl = overlay.querySelector('#asmCrossBreakBtn');
    var timerId = null;
    var studentBar = null;

    if (titleEl) titleEl.textContent = config.copy.title;
    if (textEl) textEl.textContent = config.copy.text;
    if (btnEl) btnEl.textContent = config.copy.btnLabel;

    root.classList.add('is-cross-break');
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');

    if (global.BilenyumExamStudentBar) {
      studentBar = global.BilenyumExamStudentBar.mount(root);
    }

    function isSkipRequested() {
      return !!(skipEl && skipEl.checked);
    }

    function canProceed() {
      return secondsLeft(config.endMs) <= 0 || isSkipRequested();
    }

    function finishBreak() {
      clearInterval(timerId);
      clearCrossBreak();
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      root.classList.remove('is-cross-break');
      if (skipEl) skipEl.checked = false;
      onReady();
    }

    function updateUI() {
      var left = secondsLeft(config.endMs);
      var done = left <= 0;
      var skip = isSkipRequested();
      var ready = canProceed();

      if (timerEl) {
        timerEl.textContent = formatTimer(left);
        timerEl.classList.toggle('is-done', done);
        timerEl.classList.toggle('is-skipped', skip && !done);
      }

      if (hintEl) {
        if (done) hintEl.textContent = config.copy.hintDone;
        else if (skip) hintEl.textContent = config.copy.hintSkip;
        else hintEl.textContent = config.copy.hintWait;
      }

      if (btnEl) {
        btnEl.disabled = !ready;
        btnEl.classList.toggle('is-waiting', !ready);
        btnEl.setAttribute('aria-disabled', ready ? 'false' : 'true');
      }

      if (studentBar && global.BilenyumExamStudentBar) {
        global.BilenyumExamStudentBar.setSection(studentBar, config.copy.barLabel, left, !skip);
      }
    }

    if (skipEl) {
      skipEl.checked = false;
      skipEl.onchange = updateUI;
    }

    if (btnEl) {
      btnEl.onclick = function () {
        if (!canProceed()) return;
        finishBreak();
      };
    }

    updateUI();
    timerId = setInterval(function () {
      updateUI();
      if (secondsLeft(config.endMs) <= 0) clearInterval(timerId);
    }, 1000);
  }

  global.BilenyumCrossBreak = {
    runGate: runGate,
    clearCrossBreak: clearCrossBreak
  };
})(typeof window !== 'undefined' ? window : this);
