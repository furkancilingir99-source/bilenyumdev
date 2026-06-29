/* ---------------------------------------------------------------------------
 * Bilenyum assessment.js — Seviye Belirleme + Dikkat Testi kapısı
 *
 * Yeni öğrenci onboarding sonrası:
 *   - Hoş geldin modal (ilk ziyaret)
 *   - Üst banner (3 gün geri sayım)
 *   - Dashboard bölümlerinde blur kapı
 *   - Klan yerleşmesi bekletme
 *
 * localStorage anahtarları (bilenyum.* prefix):
 *   isNewStudent, assessmentStartedAt, assessmentDeadline,
 *   placementComplete, attentionComplete, assessmentModalDismissed,
 *   placementResults, attentionResults, combinedResults, assignedClan,
 *   studentName, studentGrade
 *
 * Test kısayolu: dashboard.html?reset=new-student
 * veya konsolda: BilenyumAssessment.resetToNewStudent()
 * Mevcut öğrenci: dashboard.html?reset=existing-student
 * veya konsolda: BilenyumAssessment.resetToExistingStudent()
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';
  var KEYS = {
    isNew: 'isNewStudent',
    started: 'assessmentStartedAt',
    deadline: 'assessmentDeadline',
    placement: 'placementComplete',
    attention: 'attentionComplete',
    dismissed: 'assessmentModalDismissed',
    studentName: 'studentName',
    studentGrade: 'studentGrade'
  };

  /* Geliştirme: false = sayfa yenilemede otomatik sıfırlama kapalı (canlı mod) */
  var DEV_RESET_ON_RELOAD = false;
  /* Test kısayolu: ↺ Yeni öğrenci butonu — yalnızca geliştirme */
  var DEV_RESET_SHORTCUT = false;

  function devResetForTesting() {
    if (!DEV_RESET_ON_RELOAD) return;
    var page = currentPage();
    var resetPages = ['dashboard.html', 'program.html', 'odevler.html', 'tekrarlar.html', 'sinavlar.html', 'performans.html'];
    if (resetPages.indexOf(page) === -1) return;

    var placementDone = lsGet(KEYS.placement) === '1';
    var attentionDone = lsGet(KEYS.attention) === '1';

    /* Tamamlanan sınav ilerlemesini koru (kısmi veya tam) */
    if (placementDone || attentionDone) {
      if (!lsGet(KEYS.studentName)) lsSet(KEYS.studentName, 'Mira Yılmaz');
      if (!lsGet(KEYS.studentGrade)) lsSet(KEYS.studentGrade, '8');
      if (!lsGet(KEYS.isNew)) lsSet(KEYS.isNew, '1');
      return;
    }

    if (!lsGet(KEYS.studentName)) lsSet(KEYS.studentName, 'Mira Yılmaz');
    if (!lsGet(KEYS.studentGrade)) lsSet(KEYS.studentGrade, '8');
    if (!lsGet(KEYS.isNew)) initNewStudent();
    lsRemove(KEYS.placement);
    lsRemove(KEYS.attention);
    lsRemove(KEYS.dismissed);
    lsRemove('placementResults');
    lsRemove('attentionResults');
    lsRemove('combinedResults');
    lsRemove('assignedClan');
    lsRemove('assignedClanEmoji');
    lsRemove('placementSayisalDone');
    lsRemove('placementAnswers');
    lsRemove('placementSayisalEndAt');
    lsRemove('placementSubjectIdx');
    lsRemove('placementActiveSubject');
    lsRemove('placementBreakEndAt');
    lsRemove('placementSozelStarted');
    lsRemove('crossBreakTarget');
    lsRemove('crossBreakEndAt');
  }

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }
  function lsRemove(k) { try { localStorage.removeItem(P + k); } catch (e) {} }

  function isPlacementDone() { return lsGet(KEYS.placement) === '1'; }
  function isAttentionDone() { return lsGet(KEYS.attention) === '1'; }
  function isAllDone() { return isPlacementDone() && isAttentionDone(); }
  function isNewStudent() { return lsGet(KEYS.isNew) === '1'; }
  function needsGate() {
    if (isAllDone()) return false;
    return isNewStudent() && !isAllDone();
  }

  function initNewStudent() {
    var now = new Date();
    var deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    lsSet(KEYS.isNew, '1');
    lsSet(KEYS.started, now.toISOString());
    lsSet(KEYS.deadline, deadline.toISOString());
    lsRemove(KEYS.placement);
    lsRemove(KEYS.attention);
    lsRemove(KEYS.dismissed);
  }

  var PROGRESS_KEYS = [
    KEYS.placement, KEYS.attention, KEYS.dismissed,
    'placementResults', 'attentionResults', 'combinedResults',
    'assignedClan', 'assignedClanEmoji',
    'placementSayisalDone', 'placementAnswers', 'placementSayisalEndAt',
    'placementSubjectIdx', 'placementActiveSubject', 'placementBreakEndAt',
    'placementSozelStarted', 'placementSozelStartedAt',
    'crossBreakTarget', 'crossBreakEndAt'
  ];

  var IN_PROGRESS_KEYS = [
    'placementSayisalDone', 'placementAnswers', 'placementSayisalEndAt',
    'placementSubjectIdx', 'placementActiveSubject', 'placementBreakEndAt',
    'placementSozelStarted', 'placementSozelStartedAt',
    'crossBreakTarget', 'crossBreakEndAt'
  ];

  function seedExistingStudentResults() {
    var questions = global.BilenyumPlacementQuestions;
    var Scoring = global.BilenyumScoring;
    if (Scoring && questions && questions.length) {
      var answers = questions.map(function (q) { return q.correct; });
      Scoring.buildFullResults(questions, answers, {
        found: 3,
        targets: 3,
        falseMarks: 0,
        timeSec: 52
      });
      return;
    }

    var name = lsGet(KEYS.studentName) || 'Mira Yılmaz';
    var grade = lsGet(KEYS.studentGrade) || '8';
    var now = new Date().toISOString();
    lsSet('assignedClan', 'Alfa Klanı');
    lsSet('assignedClanEmoji', '⚡');
    lsSet('attentionResults', JSON.stringify({
      found: 3,
      targets: 3,
      falseMarks: 0,
      timeSec: 52,
      timeLabel: '00:52',
      accuracy: 100,
      attentionScore: 90
    }));
    lsSet('placementResults', JSON.stringify({
      placement: {
        placementScore: 400,
        totalNet: 48,
        maxNet: 48,
        totalCorrect: 48,
        totalWrong: 0,
        totalBlank: 0
      },
      answers: [],
      completedAt: now
    }));
    lsSet('combinedResults', JSON.stringify({
      student: { name: name, grade: grade, gradeLabel: grade + '. Sınıf' },
      combined: { combined500: 420, combinedPercent: 84 },
      clan: { name: 'Alfa Klanı', emoji: '⚡', min: 400 },
      completedAt: now
    }));
  }

  function resetToExistingStudent(options) {
    options = options || {};
    IN_PROGRESS_KEYS.forEach(lsRemove);
    if (!lsGet(KEYS.studentName)) lsSet(KEYS.studentName, 'Mira Yılmaz');
    if (!lsGet(KEYS.studentGrade)) lsSet(KEYS.studentGrade, '8');
    if (options.name) lsSet(KEYS.studentName, options.name);
    if (options.grade) lsSet(KEYS.studentGrade, String(options.grade));

    lsSet(KEYS.placement, '1');
    lsSet(KEYS.attention, '1');
    lsSet(KEYS.dismissed, '1');
    lsRemove(KEYS.isNew);
    lsSet('assessmentGraduated', '1');
    seedExistingStudentResults();
  }

  function resetToNewStudent(options) {
    options = options || {};
    PROGRESS_KEYS.forEach(lsRemove);
    if (!lsGet(KEYS.studentName)) lsSet(KEYS.studentName, 'Mira Yılmaz');
    if (!lsGet(KEYS.studentGrade)) lsSet(KEYS.studentGrade, '8');
    if (options.name) lsSet(KEYS.studentName, options.name);
    if (options.grade) lsSet(KEYS.studentGrade, String(options.grade));
    initNewStudent();
  }

  function applyResetShortcut() {
    var params = new URLSearchParams(location.search);
    var reset = params.get('reset');
    if (reset === 'existing-student' || reset === 'current-student') {
      resetToExistingStudent();
      if (!isDashboardPage()) {
        location.replace('dashboard.html');
        return true;
      }
      history.replaceState(null, '', location.pathname);
      refresh();
      return false;
    }
    if (reset !== 'new-student' && reset !== '1') return false;
    resetToNewStudent();
    if (!isDashboardPage()) {
      location.replace('dashboard.html');
      return true;
    }
    history.replaceState(null, '', location.pathname);
    return false;
  }

  var STUDENT_PAGES = ['dashboard.html', 'program.html', 'odevler.html', 'tekrarlar.html', 'sinavlar.html', 'performans.html'];

  function currentPage() {
    var name = (location.pathname.split('/').pop() || '').toLowerCase();
    if (!name) return 'dashboard.html';
    if (name.indexOf('.html') === -1) return name + '.html';
    return name;
  }

  function isDashboardPage(page) {
    page = page || currentPage();
    return page === 'dashboard.html' || page === 'dashboard';
  }

  function finishDevReset() {
    var page = currentPage();
    if (STUDENT_PAGES.indexOf(page) === -1) {
      location.href = 'dashboard.html';
      return;
    }
    refresh();
    if (isDashboardPage(page) && needsGate() && lsGet(KEYS.dismissed) !== '1') {
      openModal();
    }
  }

  function injectDevResetShortcut() {
    if (!DEV_RESET_SHORTCUT || document.getElementById('asmDevShortcuts')) return;
    var wrap = document.createElement('div');
    wrap.id = 'asmDevShortcuts';
    wrap.className = 'asm-dev-shortcuts';

    var existingBtn = document.createElement('button');
    existingBtn.type = 'button';
    existingBtn.id = 'asmDevExisting';
    existingBtn.className = 'asm-dev-reset asm-dev-reset--existing';
    existingBtn.title = 'Sınavları tamamlanmış — tüm platform özellikleri açık';
    existingBtn.textContent = '✓ Mevcut öğrenci';
    existingBtn.addEventListener('click', function () {
      if (!confirm('Mevcut öğrenci moduna geçilsin mi? Sınavlar tamamlanmış sayılır ve platformun tüm bölümleri açılır.')) return;
      resetToExistingStudent();
      finishDevReset();
    });

    var newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.id = 'asmDevReset';
    newBtn.className = 'asm-dev-reset asm-dev-reset--new';
    newBtn.title = 'Sınav ilerlemesini sıfırla — ilk giriş modu';
    newBtn.textContent = '↺ Yeni öğrenci';
    newBtn.addEventListener('click', function () {
      if (!confirm('Sınav ilerlemesi silinsin ve ilk giriş moduna dönülsün mü?')) return;
      resetToNewStudent();
      finishDevReset();
    });

    wrap.appendChild(existingBtn);
    wrap.appendChild(newBtn);
    document.body.appendChild(wrap);
  }

  function markPlacementComplete() {
    lsSet(KEYS.placement, '1');
    buildCombinedIfReady();
    if (isAllDone()) unlockDashboardFeatures();
  }
  function markAttentionComplete() {
    lsSet(KEYS.attention, '1');
    buildCombinedIfReady();
    if (isAllDone()) unlockDashboardFeatures();
  }

  function buildCombinedIfReady() {
    if (!isPlacementDone() || !isAttentionDone()) return;
    var Scoring = global.BilenyumScoring;
    if (!Scoring) return;
    var questions = global.BilenyumPlacementQuestions || [];
    var placementRaw = lsGet('placementResults');
    var attentionRaw = lsGet('attentionResults');
    if (!placementRaw || !attentionRaw) return;
    try {
      var answers = JSON.parse(placementRaw).answers || [];
      var attentionData = JSON.parse(attentionRaw);
      Scoring.buildFullResults(questions, answers, attentionData);
    } catch (e) {}
  }

  function getDeadlineDate() {
    var raw = lsGet(KEYS.deadline);
    return raw ? new Date(raw) : null;
  }

  function getRemainingLabel() {
    var d = getDeadlineDate();
    if (!d) return '3 gün';
    var diff = d.getTime() - Date.now();
    if (diff <= 0) return 'Süre doldu';
    var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    var hours = Math.ceil(diff / (1000 * 60 * 60));
    if (days > 1) return days + ' gün kaldı';
    if (hours > 1) return hours + ' saat kaldı';
    return 'Son saatler';
  }

  function formatDeadlineDate() {
    var d = getDeadlineDate();
    if (!d) return '';
    var months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  /* ---------- Modal ---------- */
  var modalEl = null;

  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'asm-modal';
    modalEl.id = 'asmWelcomeModal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', 'Zorunlu sınavlar');
    modalEl.innerHTML =
      '<div class="asm-modal-backdrop" data-asm-close></div>' +
      '<div class="asm-modal-card">' +
        '<div class="asm-modal-head">' +
          '<span class="asm-modal-eyebrow">Hoş geldin</span>' +
          '<h2 class="asm-modal-title">Klanına yerleşmeden önce</h2>' +
          '<p class="asm-modal-sub">Seviye belirleme ve dikkat testini tamamlaman gerekiyor. Dashboard\'u gezebilirsin; içeriklere erişim sınavlar bitince açılır.</p>' +
        '</div>' +
        '<div class="asm-modal-body">' +
          '<div class="asm-exam-grid">' +
            '<div class="asm-exam-card" id="asmCardPlacement">' +
              '<span class="asm-exam-card-icon">📊</span>' +
              '<h3 class="asm-exam-card-title">Seviye Belirleme Sınavı</h3>' +
              '<p class="asm-exam-card-desc">Seviyene uygun klana yerleşmen için zorunlu.</p>' +
              '<a href="seviye-belirleme.html" class="asm-btn asm-btn-primary" id="asmModalPlacementBtn">Sınava Gir ' + ICON_ARROW + '</a>' +
            '</div>' +
            '<div class="asm-exam-card" id="asmCardAttention">' +
              '<span class="asm-exam-card-icon">🎯</span>' +
              '<h3 class="asm-exam-card-title">Dikkat Testi</h3>' +
              '<p class="asm-exam-card-desc">Odaklanma ve dikkat becerini ölçer.</p>' +
              '<a href="dikkat-testi.html" class="asm-btn asm-btn-primary" id="asmModalAttentionBtn">Sınava Gir ' + ICON_ARROW + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="asm-info-box">' +
            '<p><strong>3 gün süren var.</strong> Bu süre içinde sınavları tamamlamazsan, seviyene uygun olmayan bir klana otomatik yerleştirilirsin. Klan yerleşmesi için her iki sınav da <strong>zorunludur</strong>.</p>' +
          '</div>' +
          '<div class="asm-warn-box">' +
            '<p>⚠️ Sınavlara girmeden hiçbir klana yerleşemezsin. Süre sonunda sistem seni rastgele bir klana atar — bu, öğrenme deneyimini olumsuz etkileyebilir.</p>' +
          '</div>' +
        '</div>' +
        '<div class="asm-modal-foot">' +
          '<button type="button" class="asm-btn asm-btn-ghost" data-asm-later>Sınava Daha Sonra Gir</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalEl);
    return modalEl;
  }

  function updateModalCards() {
    if (!modalEl) return;
    var pCard = document.getElementById('asmCardPlacement');
    var aCard = document.getElementById('asmCardAttention');
    var pBtn = document.getElementById('asmModalPlacementBtn');
    var aBtn = document.getElementById('asmModalAttentionBtn');
    if (pCard && pBtn) {
      if (isPlacementDone()) {
        pCard.classList.add('is-done');
        pBtn.className = 'asm-btn asm-btn-completed';
        pBtn.innerHTML = ICON_CHECK + ' Seviye Belirleme Sınavını Tamamladın';
        pBtn.setAttribute('href', 'sinav-sonuclari.html?view=placement');
      }
    }
    if (aCard && aBtn) {
      if (isAttentionDone()) {
        aCard.classList.add('is-done');
        aBtn.className = 'asm-btn asm-btn-completed';
        aBtn.innerHTML = ICON_CHECK + ' Dikkat Testini Tamamladın';
        aBtn.setAttribute('href', 'sinav-sonuclari.html?view=attention');
      }
    }
  }

  function openModal() {
    buildModal();
    updateModalCards();
    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(dismiss) {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (dismiss) lsSet(KEYS.dismissed, '1');
  }

  function bindModalEvents() {
    buildModal();
    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-asm-close]')) closeModal(false);
      if (e.target.closest('[data-asm-later]')) closeModal(true);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal(true);
    });
  }

  /* ---------- Banner ---------- */
  var bannerEl = null;

  function buildBanner() {
    if (bannerEl) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.className = 'asm-banner';
    bannerEl.id = 'asmBanner';
    bannerEl.setAttribute('role', 'status');
    document.body.appendChild(bannerEl);
    return bannerEl;
  }

  function renderPendingNotice(completedType) {
    var remaining = getRemainingLabel();
    var deadline = formatDeadlineDate();
    var timeLine = 'Eksik kalan sınavı daha sonra da çözebilirsin. <strong>' + remaining + '</strong> süren var' +
      (deadline ? ' · Son tarih: ' + deadline : '') + '.';

    if (completedType === 'placement') {
      return (
        '<div class="asm-pending-notice">' +
          '<p class="asm-pending-title">Sıradaki adım: Dikkat Testi</p>' +
          '<p class="asm-pending-text">' + timeLine + '</p>' +
        '</div>'
      );
    }
    return (
      '<div class="asm-pending-notice">' +
        '<p class="asm-pending-title">Sıradaki adım: Seviye Belirleme Sınavı</p>' +
        '<p class="asm-pending-text">' + timeLine + '</p>' +
      '</div>'
    );
  }

  function renderBanner() {
    if (!needsGate()) {
      if (bannerEl) bannerEl.style.display = 'none';
      return;
    }
    buildBanner();
    var remaining = getRemainingLabel();
    var deadlineStr = formatDeadlineDate();
    var pDone = isPlacementDone();
    var aDone = isAttentionDone();
    var sayisalDone = lsGet('placementSayisalDone') === '1';
    var partialPlacement = sayisalDone && !pDone;
    var onBreak = lsGet('placementBreakEndAt') && lsGet('placementSozelStarted') !== '1';

    var statusText = 'Seviye belirleme ve dikkat testi tamamlanmadan klana yerleşemezsin.';
    if (onBreak) statusText = 'Moladasın — mola bitince sözel sınava başlayabilirsin.';
    else if (partialPlacement) statusText = 'Sayısal bitti — molayı tamamla ve sözel bölüme geç.';
    else if (pDone && !aDone) statusText = 'Seviye belirleme tamam — dikkat testini tamamla.';
    else if (aDone && !pDone) statusText = 'Dikkat testi tamam — seviye belirlemeyi tamamla.';

    bannerEl.style.display = '';
    bannerEl.innerHTML =
      '<div class="asm-banner-icon">🎓</div>' +
      '<div class="asm-banner-body">' +
        '<p class="asm-banner-title">Klan yerleşmen için sınavları tamamla</p>' +
        '<p class="asm-banner-text">' + statusText + '</p>' +
        (deadlineStr ? '<span class="asm-banner-deadline">⏱ ' + remaining + ' · Son tarih: ' + deadlineStr + '</span>' : '') +
      '</div>' +
      '<div class="asm-banner-actions">' +
        (pDone
          ? '<a href="sinav-sonuclari.html?view=placement" class="asm-btn asm-btn-completed">' + ICON_CHECK + ' Seviye</a>'
          : '<a href="seviye-belirleme.html" class="asm-btn asm-btn-primary">' +
            (onBreak ? 'Molaya Devam' : partialPlacement ? 'Sözele Devam' : 'Seviye Sınavı') + ' ' + ICON_ARROW + '</a>') +
        (aDone
          ? '<a href="sinav-sonuclari.html?view=attention" class="asm-btn asm-btn-completed">' + ICON_CHECK + ' Dikkat</a>'
          : '<a href="dikkat-testi.html" class="asm-btn asm-btn-primary">Dikkat Testi ' + ICON_ARROW + '</a>') +
        '<button type="button" class="asm-btn asm-btn-ghost" data-asm-open-modal>Detaylar</button>' +
      '</div>';

    var detailBtn = bannerEl.querySelector('[data-asm-open-modal]');
    if (detailBtn) detailBtn.addEventListener('click', openModal);
  }

  function insertBanner() {
    if (!needsGate()) {
      document.body.classList.remove('asm-has-banner');
      return;
    }
    document.body.classList.add('asm-has-banner');
    buildBanner();
    var hud = document.querySelector('.hud');
    if (hud && bannerEl.parentNode === document.body) {
      hud.insertAdjacentElement('afterend', bannerEl);
    }
    renderBanner();
  }

  /* ---------- Content gates ---------- */
  var PAGE_SELECTORS = {
    'dashboard.html': '.d3-card, .d3-stack',
    'program.html':   '.prog-page',
    'odevler.html':   '.ov-page:not(.tk-page)',
    'tekrarlar.html': '.tk-page',
    'sinavlar.html':  '.sn-page',
    'performans.html': '.perf-page'
  };

  function gatePlacementButton() {
    if (isPlacementDone()) {
      return '<a href="sinav-sonuclari.html?view=placement" class="asm-btn asm-btn-completed">' +
        ICON_CHECK + ' Seviye Belirleme Sınavını Tamamladın ' + ICON_ARROW + '</a>';
    }
    return '<a href="seviye-belirleme.html" class="asm-btn asm-btn-primary">Seviye Belirleme Sınavına Gir ' + ICON_ARROW + '</a>';
  }

  function gateAttentionButton() {
    if (isAttentionDone()) {
      return '<a href="sinav-sonuclari.html?view=attention" class="asm-btn asm-btn-completed">' +
        ICON_CHECK + ' Dikkat Testini Tamamladın ' + ICON_ARROW + '</a>';
    }
    return '<a href="dikkat-testi.html" class="asm-btn asm-btn-primary">Dikkat Testine Gir ' + ICON_ARROW + '</a>';
  }

  function gateMessageHTML() {
    var pDone = isPlacementDone();
    var aDone = isAttentionDone();
    var gateText = 'Bu bölümleri görebilmek için deneme sınavı ve dikkat testini tamamlamalısın.';
    if (pDone && !aDone) {
      gateText = 'Seviye belirleme tamamlandı. Dikkat testini tamamladığında tüm özellikler açılacak.';
    } else if (aDone && !pDone) {
      gateText = 'Dikkat testi tamamlandı. Seviye belirleme sınavını tamamladığında tüm özellikler açılacak.';
    }

    return (
      '<div class="asm-gate-panel">' +
        '<span class="asm-gate-icon">🔒</span>' +
        '<h3 class="asm-gate-title">Bu bölüm kilitli</h3>' +
        '<p class="asm-gate-text">' + gateText + '</p>' +
        '<div class="asm-gate-actions">' +
          gatePlacementButton() +
          gateAttentionButton() +
          '<button type="button" class="asm-btn asm-btn-ghost" data-asm-open-gate>Sınav Detayları</button>' +
        '</div>' +
      '</div>'
    );
  }

  function applyGates() {
    if (!needsGate()) {
      document.querySelectorAll('.asm-gate-wrap.is-locked').forEach(function (el) {
        el.classList.remove('is-locked');
        var ov = el.querySelector('.asm-gate-overlay');
        if (ov) ov.remove();
      });
      return;
    }

    var page = currentPage();
    var sel = PAGE_SELECTORS[page];
    if (!sel) return;

    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest('.stage-nav')) return;
      if (!el.classList.contains('asm-gate-wrap')) el.classList.add('asm-gate-wrap');

      var existing = el.querySelector('.asm-gate-overlay');
      if (existing) {
        existing.innerHTML = gateMessageHTML();
        var detailBtn = existing.querySelector('[data-asm-open-gate]');
        if (detailBtn) detailBtn.addEventListener('click', openModal);
        el.classList.add('is-locked');
        return;
      }

      if (el.classList.contains('is-locked')) return;
      el.classList.add('is-locked');

      var overlay = document.createElement('div');
      overlay.className = 'asm-gate-overlay';
      overlay.innerHTML = gateMessageHTML();
      el.appendChild(overlay);

      var detailBtn = overlay.querySelector('[data-asm-open-gate]');
      if (detailBtn) detailBtn.addEventListener('click', openModal);
    });
  }

  function updateClanUI() {
    if (!needsGate()) return;
    document.querySelectorAll('.player-clan').forEach(function (el) {
      el.textContent = 'Klan atanmadı';
      el.classList.add('is-pending');
    });
    document.querySelectorAll('.d3-profile-clan').forEach(function (el) {
      el.textContent = '⏳ Klan atanmadı';
      el.classList.add('is-pending');
    });
    document.querySelectorAll('.d3-profile-cta').forEach(function (el) {
      el.classList.add('is-disabled');
      el.setAttribute('title', 'Sınavları tamamladıktan sonra klana yerleşebilirsin');
    });
    document.querySelectorAll('.prog-eyebrow').forEach(function (el) {
      if (/klan/i.test(el.textContent)) el.textContent = 'Program · Klan atanmadı';
    });
  }

  function showCompletionToast() {
    var toast = document.createElement('div');
    toast.className = 'asm-toast';
    toast.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);z-index:10001;padding:14px 22px;background:linear-gradient(135deg,rgba(109,212,158,0.95),rgba(62,180,130,0.95));color:#fff;font-family:Plus Jakarta Sans,system-ui,sans-serif;font-size:13px;font-weight:700;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.35);animation:asmBannerIn 0.4s ease;';
    toast.textContent = '🎉 Tebrikler! Sınavları tamamladın — klana yerleşmen için hazırsın.';
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4500);
  }

  function graduateNewStudent() {
    if (!isAllDone()) return;
    lsRemove(KEYS.isNew);
    lsSet('assessmentGraduated', '1');
  }

  function unlockDashboardFeatures() {
    if (!isAllDone()) return;

    graduateNewStudent();
    document.body.classList.remove('asm-has-banner');
    lsSet(KEYS.dismissed, '1');
    closeModal(false);
    if (bannerEl) bannerEl.style.display = 'none';

    document.querySelectorAll('.asm-gate-wrap.is-locked').forEach(function (el) {
      el.classList.remove('is-locked');
      var ov = el.querySelector('.asm-gate-overlay');
      if (ov) ov.remove();
    });

    var clanName = lsGet('assignedClan') || 'Alfa Klanı';
    var clanEmoji = lsGet('assignedClanEmoji') || '⚡';
    document.querySelectorAll('.player-clan').forEach(function (el) {
      el.textContent = clanName;
      el.classList.remove('is-pending');
    });
    document.querySelectorAll('.d3-profile-clan').forEach(function (el) {
      el.textContent = clanEmoji + ' ' + clanName;
      el.classList.remove('is-pending');
    });
    document.querySelectorAll('.d3-profile-cta').forEach(function (el) {
      el.classList.remove('is-disabled');
      el.removeAttribute('title');
    });
    document.querySelectorAll('.prog-eyebrow').forEach(function (el) {
      if (/Klan atanmadı/i.test(el.textContent)) {
        el.textContent = clanName.replace(/ Klanı$/, '') + ' Klanı Programı';
      }
    });
  }

  function refresh() {
    if (isAllDone()) {
      unlockDashboardFeatures();
      return;
    }
    if (!isNewStudent()) return;
    insertBanner();
    renderBanner();
    applyGates();
    updateClanUI();
    updateModalCards();
  }

  function initDashboardGate() {
    if (!needsGate()) return;
    bindModalEvents();
    if (isDashboardPage() && lsGet(KEYS.dismissed) !== '1') {
      openModal();
    }
  }

  /* ---------- Exam page helpers ---------- */
  function initPlacementExam() {
    var root = document.getElementById('asmPlacementExam');
    if (!root) return;
    if (global.BilenyumExamHeader) global.BilenyumExamHeader.mount(root);
    if (global.BilenyumPlacementExam) {
      global.BilenyumPlacementExam.init(root);
    }
  }

  function initAttentionExam() {
    var root = document.getElementById('asmAttentionExam');
    if (!root) return;
    if (global.BilenyumExamHeader) global.BilenyumExamHeader.mount(root);

    var TOTAL = 200;
    var TARGETS = 3;
    var COLS = 20;
    var main = root.querySelector('.asm-exam-main');
    var gridEl = document.getElementById('asmLetterGrid');
    var timerEl = root.querySelector('[data-asm-timer]');
    var markedEl = root.querySelector('[data-asm-marked]');
    var finishBtn = root.querySelector('[data-asm-finish-attention]');
    var clearBtn = root.querySelector('[data-asm-clear-marks]');
    var studentBar = global.BilenyumExamStudentBar ? global.BilenyumExamStudentBar.mount(root) : null;

    var cIndices = [];
    var marked = {};
    var startTime = Date.now();
    var timerId = null;
    var finished = false;

    function seededRandom(seed) {
      var x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    }

    function pickCIndices() {
      var set = {};
      var day = new Date().getDate();
      var i = 0;
      while (Object.keys(set).length < TARGETS) {
        var idx = Math.floor(seededRandom(day * 13.7 + i * 9.1) * TOTAL);
        if (idx !== 0 && idx !== TOTAL - 1) set[idx] = true;
        i++;
      }
      return Object.keys(set).map(Number);
    }

    function elapsedSec() {
      return Math.floor((Date.now() - startTime) / 1000);
    }

    function updateTimer() {
      var sec = elapsedSec();
      if (timerEl) {
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        timerEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }
      if (studentBar && global.BilenyumExamStudentBar) {
        global.BilenyumExamStudentBar.setSection(studentBar, 'Test süresi', sec, true);
      }
    }

    function markedCount() {
      return Object.keys(marked).length;
    }

    function updateMarkedCount() {
      var count = markedCount();
      if (markedEl) markedEl.textContent = count + ' / ' + TARGETS;
      root.classList.toggle('is-mark-limit', !finished && count >= TARGETS);
      gridEl.querySelectorAll('.asm-letter:not(.is-marked)').forEach(function (cell) {
        cell.classList.toggle('is-mark-blocked', !finished && count >= TARGETS);
      });
    }

    cIndices = pickCIndices();

    gridEl.innerHTML = '';
    for (var i = 0; i < TOTAL; i++) {
      var isC = cIndices.indexOf(i) !== -1;
      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'asm-letter';
      cell.setAttribute('data-idx', i);
      cell.setAttribute('data-is-c', isC ? '1' : '0');
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', isC ? 'Harf C' : 'Harf B');
      cell.textContent = isC ? 'C' : 'B';
      gridEl.appendChild(cell);
    }

    gridEl.addEventListener('click', function (e) {
      if (finished) return;
      var cell = e.target.closest('.asm-letter');
      if (!cell) return;
      var idx = cell.getAttribute('data-idx');
      if (marked[idx]) {
        delete marked[idx];
        cell.classList.remove('is-marked');
        cell.setAttribute('aria-pressed', 'false');
      } else {
        if (markedCount() >= TARGETS) return;
        marked[idx] = true;
        cell.classList.add('is-marked');
        cell.setAttribute('aria-pressed', 'true');
      }
      updateMarkedCount();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (finished) return;
        marked = {};
        gridEl.querySelectorAll('.asm-letter.is-marked').forEach(function (c) {
          c.classList.remove('is-marked');
          c.setAttribute('aria-pressed', 'false');
        });
        updateMarkedCount();
      });
    }

    function submitAttention() {
      if (finished) return;
      finished = true;
      clearInterval(timerId);

      var found = 0;
      var falseMarks = 0;
      Object.keys(marked).forEach(function (k) {
        var idx = parseInt(k, 10);
        if (cIndices.indexOf(idx) !== -1) found++;
        else falseMarks++;
      });

      var attentionData = {
        found: found,
        targets: TARGETS,
        falseMarks: falseMarks,
        timeSec: elapsedSec(),
        completedAt: new Date().toISOString()
      };

      var Scoring = global.BilenyumScoring;
      var Results = global.BilenyumResults;
      var questions = global.BilenyumPlacementQuestions || [];
      var placementRaw = lsGet('placementResults');
      var answers = [];

      if (placementRaw) {
        try { answers = JSON.parse(placementRaw).answers || []; } catch (e) {}
      }

      if (Scoring) {
        lsSet('attentionResults', JSON.stringify(attentionData));
        if (isPlacementDone() && placementRaw) {
          Scoring.buildFullResults(questions, answers, attentionData);
        }
      }
      markAttentionComplete();

      root.classList.add('is-exam-finished');

      if (Results) {
        Results.renderInlineFinish(main, 'attention', attentionData, {
          renderPendingNotice: renderPendingNotice,
          isPlacementDone: isPlacementDone,
          isAttentionDone: function () { return true; }
        });
      } else {
        location.href = isPlacementDone() ? 'sinav-sonuclari.html?view=combined' : 'seviye-belirleme.html';
      }
    }

    if (finishBtn) finishBtn.addEventListener('click', submitAttention);

    timerId = setInterval(updateTimer, 1000);
    updateTimer();
    updateMarkedCount();
  }

  /* ---------- Boot ---------- */
  function boot() {
    if (applyResetShortcut()) return;

    devResetForTesting();

    var page = currentPage();

    if (page === 'seviye-belirleme.html') {
      var placementRoot = document.getElementById('asmPlacementExam');
      if (global.BilenyumCrossBreak && placementRoot) {
        global.BilenyumCrossBreak.runGate('placement', placementRoot, initPlacementExam);
      } else {
        initPlacementExam();
      }
    } else if (page === 'dikkat-testi.html') {
      var attentionRoot = document.getElementById('asmAttentionExam');
      if (global.BilenyumCrossBreak && attentionRoot) {
        global.BilenyumCrossBreak.runGate('attention', attentionRoot, initAttentionExam);
      } else {
        initAttentionExam();
      }
    } else if (page === 'sinav-sonuclari.html') {
      if (global.BilenyumExamHeader) global.BilenyumExamHeader.mount();
    } else if (STUDENT_PAGES.indexOf(page) !== -1) {
      bindModalEvents();
      refresh();
      initDashboardGate();

      if (location.search.indexOf('assessment=done') !== -1 && isAllDone()) {
        showCompletionToast();
        history.replaceState(null, '', location.pathname);
      }
    }

    injectDevResetShortcut();
  }

  global.BilenyumAssessment = {
    initNewStudent: initNewStudent,
    resetToNewStudent: resetToNewStudent,
    resetToExistingStudent: resetToExistingStudent,
    markPlacementComplete: markPlacementComplete,
    markAttentionComplete: markAttentionComplete,
    unlockDashboardFeatures: unlockDashboardFeatures,
    graduateNewStudent: graduateNewStudent,
    isAllDone: isAllDone,
    isPlacementDone: isPlacementDone,
    isAttentionDone: isAttentionDone,
    needsGate: needsGate,
    openModal: openModal,
    refresh: refresh,
    renderPendingNotice: renderPendingNotice,
    getRemainingLabel: getRemainingLabel,
    formatDeadlineDate: formatDeadlineDate
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : this);
