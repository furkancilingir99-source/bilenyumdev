/* ---------------------------------------------------------------------------
 * Bilenyum deneme-exam.js — Deneme sınavları sayfasından açılan sınav oturumu
 * Seviye belirlemeden bağımsız storage; placementComplete ile karışmaz.
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';

  var SESSION_KEYS = [
    'denemeExamAnswers',
    'denemeExamSubjectIdx',
    'denemeExamPassedBlank',
    'denemeExamSayisalDone',
    'denemeExamSozelStarted',
    'denemeExamSozelStartedAt',
    'denemeExamActiveSubject',
    'denemeExamSayisalEndAt',
    'denemeExamBreakEndAt',
    'denemeExamComplete',
    'denemeExamResults'
  ];

  function lsRemove(k) { try { localStorage.removeItem(P + k); } catch (e) {} }

  function clearDenemeSession() {
    SESSION_KEYS.forEach(lsRemove);
    if (global.BilenyumDenemeQuestions && global.BilenyumDenemeQuestions.clearBank) {
      global.BilenyumDenemeQuestions.clearBank();
    }
  }

  var DENEME_EXAM_CFG = {
    keys: {
      answers: 'denemeExamAnswers',
      subjectIdx: 'denemeExamSubjectIdx',
      passedBlank: 'denemeExamPassedBlank',
      sayisalDone: 'denemeExamSayisalDone',
      sozelStarted: 'denemeExamSozelStarted',
      sozelStartedAt: 'denemeExamSozelStartedAt',
      activeSubject: 'denemeExamActiveSubject',
      sayisalEndAt: 'denemeExamSayisalEndAt',
      breakEndAt: 'denemeExamBreakEndAt',
      complete: 'denemeExamComplete',
      results: 'denemeExamResults'
    },
    getQuestions: function () {
      return global.BilenyumDenemeQuestions
        ? global.BilenyumDenemeQuestions.getActiveBank()
        : [];
    },
    titles: {
      break: 'Deneme Sınavı',
      sayisal: 'Deneme Sınavı · Sayısal Bölüm',
      sozel: 'Deneme Sınavı · Sözel Bölüm'
    },
    finishConfirmText: 'Deneme sınavını tamamlamak istediğine emin misin? Onayladığında cevapların kaydedilecek.',
    markAssessmentComplete: false,
    showCompletedOnInit: false,
    finishModalType: 'deneme'
  };

  function init(root) {
    if (!root || !global.BilenyumPlacementExam) return;

    var params = new URLSearchParams(location.search);
    if (params.get('new') === '1') {
      clearDenemeSession();
      if (global.BilenyumDenemeQuestions && global.BilenyumDenemeQuestions.regenerateBank) {
        global.BilenyumDenemeQuestions.regenerateBank();
      }
      history.replaceState(null, '', location.pathname);
    } else if (global.BilenyumDenemeQuestions && global.BilenyumDenemeQuestions.ensureBank) {
      global.BilenyumDenemeQuestions.ensureBank();
    }

    global.BilenyumPlacementExam.init(root, DENEME_EXAM_CFG);
  }

  global.BilenyumDenemeExam = {
    init: init,
    clearSession: clearDenemeSession,
    DENEME_EXAM_CFG: DENEME_EXAM_CFG
  };
})(typeof window !== 'undefined' ? window : this);
