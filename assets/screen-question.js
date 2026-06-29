(function (global) {
  'use strict';

  var BUS_KEY = 'bilenyum_screen_question_bus';
  var ACTIVE_KEY = 'bilenyum_screen_question_active';
  var LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  function optionLabel(index) {
    return LABELS[index] || String(index + 1);
  }

  function compareOpenEndedAnswer(studentAnswer, correctAnswer, caseSensitive) {
    var s = (studentAnswer || '').trim();
    var c = (correctAnswer || '').trim();
    if (!s || !c) return false;
    if (caseSensitive) return s === c;
    return s.toLocaleLowerCase('tr-TR') === c.toLocaleLowerCase('tr-TR');
  }

  function checkMultipleChoice(selectedOptionId, options) {
    if (!selectedOptionId || !options) return false;
    for (var i = 0; i < options.length; i++) {
      if (options[i].id === selectedOptionId) return options[i].isCorrect === true;
    }
    return false;
  }

  function findCorrectOption(options) {
    if (!options) return null;
    for (var i = 0; i < options.length; i++) {
      if (options[i].isCorrect) return options[i];
    }
    return null;
  }

  function formatOptionDisplay(index, text, label) {
    var letter = label || optionLabel(index);
    var t = (text || '').trim();
    return t ? letter + ') ' + t : letter;
  }

  function formatCorrectOptionLabel(options) {
    var correct = findCorrectOption(options);
    if (!correct) return '—';
    for (var i = 0; i < options.length; i++) {
      if (options[i].id === correct.id) {
        return formatOptionDisplay(i, correct.text);
      }
    }
    return (correct.text || '').trim() || '—';
  }

  function createPrompt(partial) {
    partial = partial || {};
    var mode = partial.mode || 'multiple_choice';
    var requestType = partial.requestType || (mode === 'open_ended' ? 'screen_based_open_ended' : mode === 'true_false' ? 'screen_based_true_false' : 'screen_based_single_choice_blank_options');
    var hints = {
      screen_based_single_choice_blank_options: 'Ekrandaki soruya göre cevabını seç.',
      screen_based_open_ended: 'Ekrandaki sorunun cevabını yaz.',
      screen_based_true_false: 'Ekrandaki ifadeye göre Doğru veya Yanlış seç.'
    };
    return {
      id: partial.id || 'sq-' + Date.now(),
      mode: mode,
      requestType: requestType,
      kind: partial.kind || (requestType === 'poll' ? 'poll' : mode === 'open_ended' ? 'open_ended' : 'screen_based_answer'),
      source: partial.source || 'current_screen',
      durationSeconds: partial.durationSeconds !== undefined ? partial.durationSeconds : 45,
      options: partial.options || [],
      correctTextAnswer: partial.correctTextAnswer || partial.expectedAnswer || '',
      isCaseSensitive: !!partial.isCaseSensitive,
      answerFieldType: partial.answerFieldType || 'short',
      status: partial.status || 'active',
      studentHint: partial.studentHint || hints[requestType] || '',
      questionText: partial.questionText || '',
      title: partial.title || '',
      showResultsToStudents: !!partial.showResultsToStudents,
      showCorrectAnswerToStudents: !!partial.showCorrectAnswerToStudents,
      allowBlankOptionText: partial.allowBlankOptionText !== false,
      gradingEnabled: partial.gradingEnabled != null ? !!partial.gradingEnabled
        : ((partial.options || []).some(function (o) { return o.isCorrect; })
          || !!(partial.correctTextAnswer || partial.expectedAnswer || '').trim()),
      feedbackMode: partial.feedbackMode || 'after_submit',
      supportiveFeedbackEnabled: partial.supportiveFeedbackEnabled !== false,
      customIncorrectFeedback: partial.customIncorrectFeedback,
      customCorrectFeedback: partial.customCorrectFeedback,
      createdAt: partial.createdAt || new Date().toISOString()
    };
  }

  function publish(event, payload) {
    var msg = { event: event, payload: payload || {}, ts: Date.now() };
    try {
      localStorage.setItem(BUS_KEY, JSON.stringify(msg));
      if (event === 'prompt_start') {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(payload));
      }
      if (event === 'prompt_close') {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch (e) { /* ignore quota */ }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bilenyum-sq', { detail: msg }));
    }
    return msg;
  }

  function subscribe(fn) {
    if (typeof window === 'undefined') return function () {};
    function handle(raw) {
      if (!raw) return;
      try {
        var msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        fn(msg);
      } catch (e) { /* ignore */ }
    }
    window.addEventListener('storage', function (e) {
      if (e.key === BUS_KEY && e.newValue) handle(e.newValue);
    });
    window.addEventListener('bilenyum-sq', function (e) {
      if (e.detail) handle(e.detail);
    });
    return function () { /* noop unsubscribe */ };
  }

  function getActivePrompt() {
    try {
      var raw = localStorage.getItem(ACTIVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  global.BilenyumScreenQuestion = {
    BUS_KEY: BUS_KEY,
    ACTIVE_KEY: ACTIVE_KEY,
    optionLabel: optionLabel,
    compareOpenEndedAnswer: compareOpenEndedAnswer,
    checkMultipleChoice: checkMultipleChoice,
    findCorrectOption: findCorrectOption,
    formatOptionDisplay: formatOptionDisplay,
    formatCorrectOptionLabel: formatCorrectOptionLabel,
    createPrompt: createPrompt,
    publish: publish,
    subscribe: subscribe,
    getActivePrompt: getActivePrompt
  };

})(typeof window !== 'undefined' ? window : this);
