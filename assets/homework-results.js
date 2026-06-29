/* ---------------------------------------------------------------------------
 * Bilenyum homework-results.js — Ödev sonuç ekranı
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }

  function formatEduWeek(week) {
    var n = parseInt(week, 10);
    if (!n || n < 1) return '';
    return n + '. Eğitim Haftası';
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var SVG_BOLT = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17Z"/></svg>';
  var SVG_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function getStudentInfo() {
    if (global.BilenyumScoring && global.BilenyumScoring.getStudentProfile) {
      return global.BilenyumScoring.getStudentProfile();
    }
    if (global.BilenyumExamStudentBar && global.BilenyumExamStudentBar.getProfile) {
      return global.BilenyumExamStudentBar.getProfile();
    }
    var grade = lsGet('studentGrade') || '8';
    return {
      name: lsGet('studentName') || 'Mira Yılmaz',
      grade: grade,
      gradeLabel: grade + '. Sınıf'
    };
  }

  function getClanInfo() {
    return {
      name: lsGet('assignedClan') || 'Alfa Klanı',
      emoji: lsGet('assignedClanEmoji') || '⚡'
    };
  }

  function gradeFromProfile(fallback) {
    return String(lsGet('studentGrade') || fallback || '8');
  }

  function scoreAnswers(questions, answers) {
    var correct = 0;
    var wrong = 0;
    var unanswered = 0;
    questions.forEach(function (q, i) {
      if (answers[i] == null) unanswered++;
      else if (answers[i] === q.correct) correct++;
      else wrong++;
    });
    return {
      correct: correct,
      wrong: wrong,
      unanswered: unanswered,
      total: questions.length
    };
  }

  function hasContinuableBlanks(answers, videoWatched, total) {
    total = total || (answers ? answers.length : 0);
    for (var i = 0; i < total; i++) {
      if (answers[i] == null && !videoWatched[i]) return true;
    }
    return false;
  }

  function buildFromSession(set, hwId, questions, answers, mode, sessionExtra) {
    sessionExtra = sessionExtra || {};
    var videoWatched = sessionExtra.videoWatched || [];
    var isRetry = !!sessionExtra.isRetry || mode === 'retry';
    var score = scoreAnswers(questions, answers);
    var grade = gradeFromProfile(set.gradeLevel);
    var maxXp = set.maxXp || 50;
    var earnedXp = isRetry ? 0 : (score.total ? Math.round(maxXp * score.correct / score.total) : 0);

    return {
      hwId: hwId,
      mode: mode || 'finish',
      isRetry: isRetry,
      title: set.title,
      icon: set.icon || '📚',
      subject: set.subject,
      subjectLabel: set.subjectLabel,
      gradeLevel: grade,
      gradeLabel: grade + '. Sınıf',
      unit: set.unit || set.title,
      unitSubtitle: set.unitSubtitle || set.topic,
      eduWeek: set.eduWeek || null,
      eduWeekLabel: formatEduWeek(set.eduWeek),
      teacher: set.teacher || '—',
      teacherRole: set.teacherRole || '',
      description: set.description || '',
      correct: score.correct,
      wrong: score.wrong,
      unanswered: score.unanswered,
      total: score.total,
      maxXp: maxXp,
      earnedXp: earnedXp,
      answers: answers.slice(),
      videoWatched: videoWatched.slice(),
      canContinueHomework: hasContinuableBlanks(answers, videoWatched, questions.length),
      isComplete: score.unanswered === 0,
      completedAt: new Date().toISOString()
    };
  }

  function loadHomeworkSession(hwId) {
    var raw = hwId ? lsGet('homeworkSession.' + hwId) : null;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function saveHomeworkSession(hwId, session) {
    if (!hwId || !session) return;
    lsSet('homeworkSession.' + hwId, JSON.stringify(session));
  }

  function clearHomeworkSession(hwId) {
    if (!hwId) return;
    try { localStorage.removeItem(P + 'homeworkSession.' + hwId); } catch (e) {}
  }

  function saveResult(payload) {
    if (!payload || !payload.hwId) return;
    var json = JSON.stringify(payload);
    lsSet('homeworkResultLatest', json);
    lsSet('homeworkResult.' + payload.hwId, json);
  }

  function saveRetryResult(payload) {
    if (!payload || !payload.hwId) return;
    payload.isRetry = true;
    payload.earnedXp = 0;
    var json = JSON.stringify(payload);
    lsSet('homeworkResultRetry.' + payload.hwId, json);
    lsSet('homeworkResultRetryLatest', json);
  }

  function deriveCanContinue(data) {
    if (!data) return false;
    if (data.canContinueHomework != null) return data.canContinueHomework;
    if (data.answers && data.answers.length) {
      return hasContinuableBlanks(data.answers, data.videoWatched || [], data.total);
    }
    return !data.isComplete;
  }

  function loadResult(hwId, opts) {
    opts = opts || {};
    if (opts.retry && hwId) {
      var retryRaw = lsGet('homeworkResultRetry.' + hwId);
      if (!retryRaw) retryRaw = lsGet('homeworkResultRetryLatest');
      if (retryRaw) {
        try { return JSON.parse(retryRaw); } catch (e) {}
      }
    }
    var raw = hwId ? lsGet('homeworkResult.' + hwId) : null;
    if (!raw) raw = lsGet('homeworkResultLatest');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function metaRow(label, value, cls) {
    if (!value) return '';
    return (
      '<div class="asm-hw-res-meta-row' + (cls ? ' ' + cls : '') + '">' +
        '<span class="asm-hw-res-meta-label">' + escapeHtml(label) + '</span>' +
        '<span class="asm-hw-res-meta-value">' + value + '</span>' +
      '</div>'
    );
  }

  function renderPage(root, hwId, opts) {
    opts = opts || {};
    if (!root) return;
    var data = loadResult(hwId, opts);
    if (!data) {
      root.innerHTML =
        '<div class="asm-res-empty">' +
          '<p>Ödev sonucu bulunamadı.</p>' +
          '<div class="asm-res-actions">' +
            '<a href="odevler.html" class="asm-btn asm-btn-primary">Ödevlerime Dön</a>' +
          '</div>' +
        '</div>';
      return;
    }

    var isComplete = data.isComplete;
    var showContinue = deriveCanContinue(data);
    var isLeave = data.mode === 'leave';
    var isRetry = !!(data.isRetry || opts.retry);
    var heroTitle = isRetry
      ? (isComplete ? 'Tekrar Çözüm Sonucu' : 'Tekrar Çözüm Durumu')
      : (isComplete
        ? (isLeave ? 'Ödev Kaydedildi' : 'Ödev Tamamlandı!')
        : 'Ödev Durumu');
    var heroIcon = isComplete && data.correct / Math.max(1, data.total) >= 0.7 ? '🎉' : '📝';
    var student = getStudentInfo();
    var clan = getClanInfo();
    var retryNotice = isRetry
      ? '<p class="asm-hw-res-retry-note">Tekrar çözülen ödevlerin başarı puanına etki etmez.</p>'
      : '';
    var xpVal = isRetry ? '—' : ('+' + data.earnedXp);
    var xpLbl = isRetry ? 'Başarı Puanına Etkisi' : 'Kazanılan Toplam XP';
    var continueHref = 'odev-coz.html?hw=' + encodeURIComponent(data.hwId) + (isRetry ? '&retry=1' : '');

    root.innerHTML =
      '<section class="asm-hw-res-hero">' +
        '<span class="asm-hw-res-hero-icon" aria-hidden="true">' + heroIcon + '</span>' +
        '<h2 class="asm-hw-res-hero-title">' + escapeHtml(heroTitle) + '</h2>' +
        '<p class="asm-hw-res-hero-sub">' + escapeHtml(data.icon + ' ' + data.title + ' · ' + data.subjectLabel) + '</p>' +
        retryNotice +
      '</section>' +

      '<section class="asm-hw-res-info-grid">' +
        '<div class="asm-hw-res-columns">' +
          '<div class="asm-hw-res-card" aria-labelledby="asmHwResMetaTitle">' +
            '<h3 class="asm-hw-res-card-title" id="asmHwResMetaTitle">Ödev Bilgileri</h3>' +
            '<div class="asm-hw-res-meta">' +
              metaRow('Ünite Adı', escapeHtml(data.unit)) +
              metaRow('Ünite Alt Başlığı', escapeHtml(data.unitSubtitle)) +
              metaRow('Haftası', escapeHtml(data.eduWeekLabel)) +
              metaRow('Ödevi Veren Öğretmen', escapeHtml(data.teacher) + (data.teacherRole ? ' <span class="asm-hw-res-meta-muted">' + escapeHtml(data.teacherRole) + '</span>' : '')) +
            '</div>' +
          '</div>' +
          '<div class="asm-hw-res-card" aria-labelledby="asmHwResStudentTitle">' +
            '<h3 class="asm-hw-res-card-title" id="asmHwResStudentTitle">Öğrenci Bilgileri</h3>' +
            '<div class="asm-hw-res-meta">' +
              metaRow('Ad Soyad', escapeHtml(student.name)) +
              metaRow('Sınıf Seviyesi', escapeHtml(student.gradeLabel || data.gradeLabel)) +
              metaRow('Klan', '<span class="asm-hw-res-clan">' + escapeHtml(clan.emoji) + ' ' + escapeHtml(clan.name) + '</span>') +
            '</div>' +
          '</div>' +
        '</div>' +
        (data.description
          ? '<div class="asm-hw-res-card asm-hw-res-desc-card">' +
              '<span class="asm-hw-res-meta-label">Ödev Açıklaması</span>' +
              '<p class="asm-hw-res-desc-text">' + escapeHtml(data.description) + '</p>' +
            '</div>'
          : '') +
      '</section>' +

      '<section class="asm-hw-res-stats" aria-label="Sonuç özeti">' +
        '<div class="asm-hw-res-stat is-good">' +
          '<span class="asm-hw-res-stat-val">' + data.correct + '</span>' +
          '<span class="asm-hw-res-stat-lbl">Doğru Sayısı</span>' +
        '</div>' +
        '<div class="asm-hw-res-stat is-bad">' +
          '<span class="asm-hw-res-stat-val">' + data.wrong + '</span>' +
          '<span class="asm-hw-res-stat-lbl">Yanlış Sayısı</span>' +
        '</div>' +
        '<div class="asm-hw-res-stat is-blank">' +
          '<span class="asm-hw-res-stat-val">' + data.unanswered + '</span>' +
          '<span class="asm-hw-res-stat-lbl">Boş Sayısı</span>' +
        '</div>' +
        '<div class="asm-hw-res-stat is-xp' + (isRetry ? ' is-retry' : '') + '">' +
          '<span class="asm-hw-res-stat-val">' + (isRetry ? xpVal : (SVG_BOLT + xpVal)) + '</span>' +
          '<span class="asm-hw-res-stat-lbl">' + xpLbl + '</span>' +
        '</div>' +
      '</section>' +

      '<div class="asm-hw-res-actions">' +
        '<a href="dashboard.html" class="asm-btn asm-btn-primary">Kontrol Merkezine Dön ' + SVG_ARROW + '</a>' +
        '<a href="odevler.html" class="asm-btn asm-btn-ghost">Tüm Ödevlerim</a>' +
        (showContinue
          ? '<a href="' + continueHref + '" class="asm-btn asm-btn-ghost">Ödeve Devam Et</a>'
          : '') +
      '</div>';

    document.title = (isRetry ? 'Tekrar Çözüm Sonucu' : 'Ödev Sonucu') + ' · ' + data.title + ' · Bilenyum';
  }

  function init(root, hwId, opts) {
    if (!root) return;
    if (global.BilenyumExamHeader) global.BilenyumExamHeader.mount(root);
    renderPage(root, hwId, opts);
  }

  global.BilenyumHomeworkResults = {
    buildFromSession: buildFromSession,
    saveResult: saveResult,
    saveRetryResult: saveRetryResult,
    loadResult: loadResult,
    saveHomeworkSession: saveHomeworkSession,
    loadHomeworkSession: loadHomeworkSession,
    clearHomeworkSession: clearHomeworkSession,
    hasContinuableBlanks: hasContinuableBlanks,
    deriveCanContinue: deriveCanContinue,
    renderPage: renderPage,
    formatEduWeek: formatEduWeek
  };

  if (document.getElementById('asmHomeworkResults')) {
    var params = new URLSearchParams(location.search);
    var hwId = params.get('hw');
    var isRetry = params.get('retry') === '1';
    init(document.getElementById('asmHomeworkResults'), hwId, { retry: isRetry });
  }
})(typeof window !== 'undefined' ? window : this);
