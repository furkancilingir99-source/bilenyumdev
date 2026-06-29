/* ---------------------------------------------------------------------------
 * Bilenyum exam-student-bar.js — Sınav boyunca öğrenci + kalan süre şeridi
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';
  var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }

  function getProfile() {
    if (global.BilenyumScoring) return global.BilenyumScoring.getStudentProfile();
    return {
      name: lsGet('studentName') || 'Mira Yılmaz',
      grade: lsGet('studentGrade') || '8',
      gradeLabel: (lsGet('studentGrade') || '8') + '. Sınıf'
    };
  }

  function getClanInfo() {
    return {
      name: lsGet('assignedClan') || 'Alfa Klanı',
      emoji: lsGet('assignedClanEmoji') || '⚡'
    };
  }

  function formatDueDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split(' ');
    var d = parts[0].split('-');
    var t = (parts[1] || '23:59').split(':');
    var day = parseInt(d[2], 10);
    var month = parseInt(d[1], 10) - 1;
    var year = d[0];
    return day + ' ' + (MONTH_NAMES[month] || '') + ' ' + year + ' · ' + t[0] + ':' + t[1];
  }

  function formatClock(sec) {
    sec = Math.max(0, sec || 0);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function ensureBar(root) {
    var bar = root.querySelector('#asmStudentBar');
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'asm-student-bar';
    bar.id = 'asmStudentBar';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<div class="asm-student-bar-inner">' +
        '<div class="asm-student-bar-item">' +
          '<span class="asm-student-bar-label">Ad Soyad</span>' +
          '<strong class="asm-student-bar-val" data-asm-student-name>—</strong>' +
        '</div>' +
        '<div class="asm-student-bar-divider" aria-hidden="true"></div>' +
        '<div class="asm-student-bar-item">' +
          '<span class="asm-student-bar-label">Sınıf</span>' +
          '<strong class="asm-student-bar-val" data-asm-student-grade>—</strong>' +
        '</div>' +
        '<div class="asm-student-bar-divider" aria-hidden="true"></div>' +
        '<div class="asm-student-bar-item asm-student-bar-item--clan">' +
          '<span class="asm-student-bar-label">Klan</span>' +
          '<strong class="asm-student-bar-val" data-asm-student-clan>—</strong>' +
        '</div>' +
        '<div class="asm-student-bar-divider asm-student-bar-divider--section" aria-hidden="true" hidden></div>' +
        '<div class="asm-student-bar-item asm-student-bar-item--section" data-asm-section-wrap hidden>' +
          '<span class="asm-student-bar-label" data-asm-section-label>Bölüm süresi</span>' +
          '<strong class="asm-student-bar-val" data-asm-section-remaining>—</strong>' +
        '</div>' +
        '<div class="asm-student-bar-item asm-student-bar-item--deadline" data-asm-hw-deadline-wrap hidden>' +
          '<span class="asm-student-bar-label">Son Teslim Tarihi</span>' +
          '<strong class="asm-student-bar-val" data-asm-hw-deadline>—</strong>' +
        '</div>' +
      '</div>';
    var topbar = root.querySelector('.asm-exam-topbar');
    if (topbar) topbar.insertAdjacentElement('afterend', bar);
    else root.insertBefore(bar, root.firstChild);
    return bar;
  }

  function insertBackLink(bar, href, label) {
    if (!bar || bar.querySelector('[data-asm-student-back]')) return;
    var inner = bar.querySelector('.asm-student-bar-inner');
    if (!inner) return;
    var back = document.createElement('a');
    back.className = 'asm-student-bar-back';
    back.href = href || 'dashboard.html';
    back.setAttribute('data-asm-student-back', '');
    back.textContent = label || "Dashboard'a Dön";
    var divider = document.createElement('div');
    divider.className = 'asm-student-bar-divider asm-student-bar-divider--back';
    divider.setAttribute('aria-hidden', 'true');
    inner.insertBefore(divider, inner.firstChild);
    inner.insertBefore(back, inner.firstChild);
  }

  function removeYayinField(bar) {
    if (!bar) return;
    var yayinEl = bar.querySelector('[data-asm-student-yayin]');
    if (!yayinEl) return;
    var item = yayinEl.closest('.asm-student-bar-item');
    var prev = item && item.previousElementSibling;
    if (prev && prev.classList.contains('asm-student-bar-divider')) prev.remove();
    if (item) item.remove();
  }

  function ensureClanField(bar) {
    if (!bar || bar.querySelector('[data-asm-student-clan]')) return;
    var gradeItem = bar.querySelector('[data-asm-student-grade]');
    var gradeWrap = gradeItem && gradeItem.closest('.asm-student-bar-item');
    if (!gradeWrap) return;
    var inner = bar.querySelector('.asm-student-bar-inner');
    var div = document.createElement('div');
    div.className = 'asm-student-bar-divider';
    div.setAttribute('aria-hidden', 'true');
    var clanItem = document.createElement('div');
    clanItem.className = 'asm-student-bar-item asm-student-bar-item--clan';
    clanItem.innerHTML =
      '<span class="asm-student-bar-label">Klan</span>' +
      '<strong class="asm-student-bar-val" data-asm-student-clan>—</strong>';
    var sectionDiv = inner.querySelector('.asm-student-bar-divider--section');
    if (sectionDiv) {
      inner.insertBefore(clanItem, sectionDiv);
      inner.insertBefore(div, clanItem);
    } else {
      gradeWrap.parentNode.insertBefore(clanItem, gradeWrap.nextSibling);
      gradeWrap.parentNode.insertBefore(div, clanItem);
    }
  }

  function ensureDeadlineField(bar) {
    if (!bar || bar.querySelector('[data-asm-hw-deadline-wrap]')) return;
    var inner = bar.querySelector('.asm-student-bar-inner');
    if (!inner) return;
    var wrap = document.createElement('div');
    wrap.className = 'asm-student-bar-item asm-student-bar-item--deadline';
    wrap.setAttribute('data-asm-hw-deadline-wrap', '');
    wrap.hidden = true;
    wrap.innerHTML =
      '<span class="asm-student-bar-label">Son Teslim Tarihi</span>' +
      '<strong class="asm-student-bar-val" data-asm-hw-deadline>—</strong>';
    inner.appendChild(wrap);
  }

  function removeDeadlineField(bar) {
    if (!bar) return;
    var wrap = bar.querySelector('[data-asm-hw-deadline-wrap]');
    if (wrap) wrap.remove();
  }

  function setDeadline(bar, dueAt) {
    if (!bar) return;
    ensureDeadlineField(bar);
    var wrap = bar.querySelector('[data-asm-hw-deadline-wrap]');
    var valEl = bar.querySelector('[data-asm-hw-deadline]');
    var label = formatDueDate(dueAt);
    if (!wrap || !valEl || !label) return;
    valEl.textContent = label;
    wrap.hidden = false;
  }

  function ensureRemainingField(bar) {
    if (!bar || bar.querySelector('[data-asm-remaining-wrap]')) return;
    var inner = bar.querySelector('.asm-student-bar-inner');
    if (!inner) return;
    var wrap = document.createElement('div');
    wrap.className = 'asm-student-bar-item asm-student-bar-item--deadline asm-student-bar-item--remaining';
    wrap.setAttribute('data-asm-remaining-wrap', '');
    wrap.hidden = true;
    wrap.innerHTML =
      '<span class="asm-student-bar-label">Kalan Süre</span>' +
      '<strong class="asm-student-bar-val" data-asm-remaining aria-live="polite">—</strong>';
    inner.appendChild(wrap);
  }

  function setRemaining(bar, seconds, visible) {
    if (!bar) return;
    ensureRemainingField(bar);
    var wrap = bar.querySelector('[data-asm-remaining-wrap]');
    var valEl = bar.querySelector('[data-asm-remaining]');
    if (!wrap || !valEl) return;

    if (visible === false || seconds == null) {
      wrap.hidden = true;
      valEl.classList.remove('is-urgent', 'is-expired');
      return;
    }

    wrap.hidden = false;
    valEl.textContent = formatClock(seconds);
    valEl.classList.toggle('is-urgent', seconds <= 60 && seconds > 0);
    valEl.classList.toggle('is-expired', seconds <= 0);
  }

  function removeSectionTimer(bar) {
    if (!bar) return;
    var wrap = bar.querySelector('[data-asm-section-wrap]');
    var div = bar.querySelector('.asm-student-bar-divider--section');
    if (wrap) wrap.remove();
    if (div) div.remove();
  }

  function mount(root, opts) {
    opts = opts || {};
    if (!root) return null;
    var bar = ensureBar(root);
    removeYayinField(bar);
    ensureClanField(bar);
    if (!opts.hideDeadline) ensureDeadlineField(bar);
    var profile = getProfile();
    var clan = getClanInfo();
    var nameEl = bar.querySelector('[data-asm-student-name]');
    var gradeEl = bar.querySelector('[data-asm-student-grade]');
    var clanEl = bar.querySelector('[data-asm-student-clan]');
    if (nameEl) nameEl.textContent = profile.name;
    if (gradeEl) gradeEl.textContent = profile.gradeLabel;
    if (clanEl) clanEl.textContent = clan.emoji + ' ' + clan.name;
    bar.classList.toggle('asm-student-bar--left', opts.alignLeft !== false);
    if (opts.hideSection) removeSectionTimer(bar);
    if (opts.hideDeadline) removeDeadlineField(bar);
    if (opts.showBack) insertBackLink(bar, opts.backHref, opts.backLabel);
    if (opts.dueAt) setDeadline(bar, opts.dueAt);
    return bar;
  }

  function setSection(bar, label, seconds, visible) {
    if (!bar) return;
    var wrap = bar.querySelector('[data-asm-section-wrap]');
    var div = bar.querySelector('.asm-student-bar-divider--section');
    var labelEl = bar.querySelector('[data-asm-section-label]');
    var valEl = bar.querySelector('[data-asm-section-remaining]');
    if (!wrap) return;

    if (visible === false || (visible == null && label == null)) {
      wrap.hidden = true;
      if (div) div.hidden = true;
      return;
    }

    wrap.hidden = false;
    if (div) div.hidden = false;
    if (labelEl && label) labelEl.textContent = label;
    if (valEl && seconds != null) {
      valEl.textContent = formatClock(seconds);
      valEl.classList.toggle('is-urgent', seconds <= 60 && seconds > 0);
    }
  }

  function unmount() {}

  global.BilenyumExamStudentBar = {
    mount: mount,
    setSection: setSection,
    setDeadline: setDeadline,
    setRemaining: setRemaining,
    unmount: unmount,
    formatClock: formatClock,
    formatDueDate: formatDueDate,
    getProfile: getProfile
  };
})(typeof window !== 'undefined' ? window : this);
