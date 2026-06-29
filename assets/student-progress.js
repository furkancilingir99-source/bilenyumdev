(function (global) {
  'use strict';

  var deps = {};
  var gamEngine = null;
  var myInsight = null;
  var permState = null;

  function $(id) { return document.getElementById(id); }

  function getDefaultProgress() {
    return {
      level: 4,
      totalXp: 420,
      lessonXp: 85,
      weeklyXp: 320,
      streakDays: 3,
      participationScore: 78,
      quizAnswered: 4,
      quizCorrect: 3,
      quizTotal: 5,
      handRaises: 2,
      whiteboardContributions: 1,
      badges: [{ icon: '🧩', name: 'Problem Çözücü' }],
      nextBadgeProgress: 72,
      nextBadgeName: 'Seviye 5'
    };
  }

  function showXpToast(amount, reason) {
    var el = $('lcXpToast');
    if (!el) return;
    el.textContent = '+' + amount + ' XP · ' + (reason || 'Katılım');
    el.hidden = false;
    el.classList.add('is-visible');
    setTimeout(function () { el.classList.remove('is-visible'); setTimeout(function () { el.hidden = true; }, 300); }, 2800);
  }

  function showBadgePopup(badge) {
    var el = $('lcBadgePopup');
    if (!el) return;
    el.innerHTML = '<div class="lc-badge-pop-inner"><span class="lc-badge-pop-icon">' + (badge.icon || '🏆') + '</span><strong>' + badge.name + '</strong><p>' + (badge.description || 'Yeni rozet kazandın!') + '</p></div>';
    el.hidden = false;
    el.classList.add('is-visible');
    setTimeout(function () { el.classList.remove('is-visible'); setTimeout(function () { el.hidden = true; }, 400); }, 3500);
  }

  function renderProgressPanel() {
    var el = $('lcProgressBody');
    if (!el) return;
    var p = myInsight || getDefaultProgress();
    el.innerHTML =
      '<div class="lc-progress-xp-hero">' +
        '<span class="lc-progress-xp-val">+' + p.lessonXp + '</span>' +
        '<span class="lc-progress-xp-label">Bugünkü XP</span>' +
      '</div>' +
      (function () {
        var total = p.quizTotal || 0;
        var answered = p.quizAnswered || 0;
        var correct = p.quizCorrect || 0;
        var wrong = Math.max(0, answered - correct);
        var blank = Math.max(0, total - answered);
        return '<div class="lc-progress-grid">' +
          statBox('Doğru / Toplam', correct + ' / ' + total) +
          statBox('Yanlış', String(wrong)) +
          statBox('Boş', String(blank)) +
          statBox('Tahtaya kalkma', String(p.whiteboardContributions || 0)) +
          statBox('Parmak kaldırma', String(p.handRaises || 0)) +
          statBox('Başarı Puanı', String(p.totalXp || 0)) +
        '</div>';
      })();
  }

  function statBox(label, val) {
    return '<div class="lc-progress-stat"><strong>' + val + '</strong><span>' + label + '</span></div>';
  }

  function renderPermissionStatus() {
    var el = $('lcPermStatusBody');
    if (!el) return;
    var perm = permState || {
      canUseMicrophone: false,
      canUseCamera: true,
      canSendChat: true,
      canAskQuestion: true,
      canRaiseHand: true,
      canDrawOnWhiteboard: false,
      canAnswerQuiz: true,
      isFocusLocked: false,
      isMutedByTeacher: true,
      isMicRequestedByTeacher: false,
      isCameraRequestedByTeacher: false,
      whiteboardStatus: 'raised_hand_waiting'
    };
    var wbLabels = {
      not_allowed: 'Sadece izliyorsun',
      raised_hand_waiting: 'Parmak kaldırdın, öğretmen seçerse yazabilirsin',
      selected_can_draw: 'Tahtadasın — yazdıkların herkes tarafından görülür',
      permission_revoked: 'Öğretmen yazma iznini kapattı',
      locked_by_teacher: 'Whiteboard kilitli'
    };
    var rows = [
      { key: 'canUseMicrophone', label: 'Mikrofon', icon: '🎤' },
      { key: 'canUseCamera', label: 'Kamera', icon: '📷' },
      { key: 'canSendChat', label: 'Chat', icon: '💬' },
      { key: 'canAskQuestion', label: 'Soru sorma', icon: '❓' },
      { key: 'canRaiseHand', label: 'El kaldırma', icon: '✋' },
      { key: 'canDrawOnWhiteboard', label: 'Whiteboard', icon: '📝' },
      { key: 'canAnswerQuiz', label: 'Quiz', icon: '⚡' },
      { key: 'isFocusLocked', label: 'Odak modu', icon: '🎯' }
    ];
    el.innerHTML = rows.map(function (r) {
      var on = !!perm[r.key];
      return '<div class="lc-perm-row"><span>' + r.icon + ' ' + r.label + '</span><span class="lc-perm-val' + (on ? ' is-on' : ' is-off') + '">' + (on ? 'Açık' : 'Kapalı') + '</span></div>';
    }).join('') +
    '<div class="lc-perm-wb-msg">' + (wbLabels[perm.whiteboardStatus] || wbLabels.not_allowed) + '</div>' +
    (perm.isMutedByTeacher ? '<div class="lc-perm-alert">Öğretmen mikrofonunu kapattı</div>' : '') +
    (perm.isMicRequestedByTeacher ? '<div class="lc-perm-alert is-info">Mikrofon açman istendi</div>' : '') +
    (perm.isCameraRequestedByTeacher ? '<div class="lc-perm-alert is-info">Kamera açman istendi</div>' : '');
  }

  function renderStatusChipsExtra(state, perm) {
    var chips = [];
    if (perm && perm.isMutedByTeacher) chips.push('<span class="lc-chip is-warn">Mic kapalı</span>');
    if (perm && perm.isMicRequestedByTeacher) chips.push('<span class="lc-chip is-info">Mic isteği</span>');
    if (perm && perm.canDrawOnWhiteboard) chips.push('<span class="lc-chip is-wb">Tahtadasın</span>');
    if (state && state.isHandRaised) chips.push('<span class="lc-chip is-hand">El kaldırdın</span>');
    if (state && state.isFocusMode) chips.push('<span class="lc-chip is-focus">Odak modu</span>');
    return chips.join('');
  }

  function renderLessonSummary() {
    var el = $('lcLessonSummary');
    if (!el) return;
    var p = myInsight || getDefaultProgress();
    el.innerHTML =
      '<h3>Ders Özeti</h3>' +
      '<div class="lc-summary-xp">+' + p.lessonXp + ' XP kazandın!</div>' +
      '<ul class="lc-summary-list">' +
        '<li>Quiz: ' + p.quizAnswered + '/' + p.quizTotal + ' cevap · ' + p.quizCorrect + ' doğru</li>' +
        '<li>El kaldırma: ' + p.handRaises + '</li>' +
        '<li>Whiteboard katkısı: ' + p.whiteboardContributions + '</li>' +
        '<li>Katılım skoru: ' + p.participationScore + '</li>' +
      '</ul>' +
      '<div class="lc-summary-badges">' + (p.badges || []).map(function (b) { return '<span>' + b.icon + ' ' + b.name + '</span>'; }).join('') + '</div>';
  }

  function onGamificationEvent(ev) {
    if (ev.studentId !== 'me' && ev.studentId !== 's0') return;
    if (myInsight) myInsight.lessonXp += ev.xpDelta;
    showXpToast(ev.xpDelta, ev.type.replace(/_/g, ' '));
    renderProgressPanel();
    updateXpBadge();
  }

  function updateXpBadge() {
    var badge = $('lcXpBadge');
    if (badge && myInsight) badge.textContent = '+' + myInsight.lessonXp + ' XP';
  }

  function loadFromSeed(insightS0, perm) {
    if (insightS0) {
      myInsight = {
        level: insightS0.profile.level,
        totalXp: insightS0.profile.totalXp,
        lessonXp: insightS0.gamification.lessonXp,
        weeklyXp: insightS0.gamification.weeklyXp,
        streakDays: insightS0.gamification.streakDays,
        participationScore: insightS0.gamification.participationScore,
        quizAnswered: insightS0.quizStats.answeredCount,
        quizCorrect: insightS0.quizStats.correctCount,
        quizTotal: insightS0.quizStats.totalQuizSent,
        handRaises: insightS0.activities.filter(function (a) { return a.type === 'raised_hand'; }).length,
        whiteboardContributions: insightS0.whiteboardStats.selectedCount,
        badges: insightS0.gamification.badges.slice(0, 3).map(function (b) { return { icon: b.icon, name: b.name, description: b.description }; }),
        nextBadgeProgress: 72,
        nextBadgeName: 'Seviye ' + (insightS0.profile.level + 1)
      };
    }
    permState = perm;
  }

  global.StudentProgress = {
    init: function (d) {
      deps = d;
      gamEngine = d.gamEngine;
      loadFromSeed(d.insightS0, d.permState);
      renderProgressPanel();
      renderPermissionStatus();
      updateXpBadge();
      if (gamEngine) {
        document.addEventListener('bilenyum-gamification', function (e) { onGamificationEvent(e.detail); });
      }
      if ($('lcXpBadge')) $('lcXpBadge').onclick = function () { deps.openTab('progress'); };
    },
    showXpToast: showXpToast,
    showBadgePopup: showBadgePopup,
    renderProgressPanel: renderProgressPanel,
    renderPermissionStatus: renderPermissionStatus,
    renderStatusChipsExtra: renderStatusChipsExtra,
    renderLessonSummary: renderLessonSummary,
    awardXp: function (type, opts) {
      if (gamEngine) {
        var ev = gamEngine.awardXp('me', type, opts);
        if (ev) onGamificationEvent(ev);
      }
    },
    setPermState: function (p) { permState = p; renderPermissionStatus(); },
    getProgress: function () { return myInsight || getDefaultProgress(); }
  };

})(typeof window !== 'undefined' ? window : this);
