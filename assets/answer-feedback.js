(function (global) {
  'use strict';

  var SUPPORTIVE = {
    incorrect: [
      'Bu sefer olmadı, sorun değil. Bir dahaki sefere daha dikkatli bak; yapabileceğine eminim.',
      'Yaklaştın. Bir sonraki soruda daha dikkatli bakarsan yapacağına eminim.',
      'Henüz değil, ama denemen çok değerli. Bir dahaki sefere daha dikkatli ol; yapabilirsin.',
      'Bu cevap doğru değil. Soruyu bir kez daha sakin düşünürsen başaracağına eminim.',
      'Olmadı ama sorun değil. Her deneme öğrenmenin bir parçası.'
    ],
    correct: [
      'Harika! Doğru cevap verdin.',
      'Süper, doğru cevap! Böyle devam.',
      'Çok iyi! Cevabın doğru.'
    ],
    submitted: [
      'Cevabın alındı.',
      'Cevabın kaydedildi.',
      'Cevabın öğretmenine iletildi.'
    ],
    pendingReview: [
      'Cevabın öğretmenine iletildi. Öğretmenin değerlendirecek.',
      'Açık uçlu cevabın kaydedildi.'
    ],
    teacherMarkedCorrect: 'Öğretmenin cevabını doğru olarak işaretledi.',
    teacherMarkedNeedsWork: 'Öğretmenin cevabını inceledi. Biraz daha dikkat edersen çok daha iyi olacak.'
  };

  var TITLES = {
    correct: 'Harika!',
    incorrect: 'Henüz değil',
    submitted: 'Cevabın gönderildi',
    pending_review: 'Cevabın gönderildi'
  };

  function pickRandom(list) {
    if (!list || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  function inferResult(input) {
    if (input.result) return input.result;
    if (input.gradingEnabled === false) return 'submitted';
    if (input.isPendingReview) return 'pending_review';
    if (input.isCorrect === true) return 'correct';
    if (input.isCorrect === false) return 'incorrect';
    return 'submitted';
  }

  function getSupportiveFeedbackMessage(input) {
    input = input || {};
    if (input.teacherCustomMessage) {
      return input.teacherCustomMessage;
    }

    var result = inferResult(input);

    if (result === 'incorrect') {
      return pickRandom(SUPPORTIVE.incorrect);
    }
    if (result === 'correct') {
      return pickRandom(SUPPORTIVE.correct);
    }
    if (result === 'pending_review') {
      return pickRandom(SUPPORTIVE.pendingReview);
    }
    return pickRandom(SUPPORTIVE.submitted);
  }

  function buildFeedbackCard(input) {
    input = input || {};
    var result = inferResult(input);
    var message = getSupportiveFeedbackMessage(input);
    var title = input.title || TITLES[result] || 'Cevabın kaydedildi';
    var xpDelta = input.xpDelta;
    var showCorrect = input.showCorrectAnswer && input.correctOptionLabel;

    return {
      result: result,
      title: title,
      message: message,
      xpDelta: result === 'correct' ? (xpDelta != null ? xpDelta : 15) : undefined,
      showCorrectAnswer: showCorrect,
      correctOptionLabel: input.correctOptionLabel || '',
      tone: result === 'correct' ? 'success' : result === 'incorrect' ? 'supportive' : 'neutral'
    };
  }

  function renderFeedbackHtml(card, esc) {
    esc = esc || function (s) { return String(s || ''); };
    var xpHtml = card.xpDelta ? '<span class="lc-answer-fb-xp">+' + card.xpDelta + ' XP</span>' : '';
    var correctHtml = card.showCorrectAnswer
      ? '<p class="lc-answer-fb-correct">Doğru cevap: <strong>' + esc(card.correctOptionLabel) + '</strong></p>'
      : '';
    return (
      '<div class="lc-answer-feedback-card lc-answer-feedback-card--' + esc(card.tone) + '" role="status">' +
        '<div class="lc-answer-fb-icon" aria-hidden="true">' + (card.result === 'correct' ? '✓' : card.result === 'incorrect' ? '○' : '✓') + '</div>' +
        '<div class="lc-answer-fb-body">' +
          '<div class="lc-answer-fb-title">' + esc(card.title) + '</div>' +
          '<p class="lc-answer-fb-msg">' + esc(card.message) + '</p>' +
          xpHtml +
          correctHtml +
        '</div>' +
        '<button type="button" class="lc-btn lc-btn--ghost lc-btn--sm lc-answer-fb-close" data-answer-fb-close>Tamam</button>' +
      '</div>'
    );
  }

  global.BilenyumAnswerFeedback = {
    SUPPORTIVE: SUPPORTIVE,
    TITLES: TITLES,
    getSupportiveFeedbackMessage: getSupportiveFeedbackMessage,
    buildFeedbackCard: buildFeedbackCard,
    renderFeedbackHtml: renderFeedbackHtml,
    pickRandom: pickRandom
  };

})(typeof window !== 'undefined' ? window : this);
