(function (global) {
  'use strict';

  var LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  var PROGRAM_TYPE_LABELS = {
    weekday_early: 'Hafta içi Erken',
    weekday_late: 'Hafta içi Geç',
    weekend_morning: 'Haftasonu Sabah',
    weekend_evening: 'Haftasonu Akşam'
  };

  var VALIDATION = {
    manual_single_choice: {
      canSendWithoutQuestionText: false,
      canSendWithoutOptionText: false,
      canSendWithoutOptions: false,
      requiresOptionLabels: true,
      requiresCorrectAnswer: false
    },
    manual_open_ended: {
      canSendWithoutQuestionText: false,
      canSendWithoutOptionText: true,
      canSendWithoutOptions: true,
      requiresOptionLabels: false,
      requiresCorrectAnswer: false
    },
    screen_based_single_choice_blank_options: {
      canSendWithoutQuestionText: true,
      canSendWithoutOptionText: true,
      canSendWithoutOptions: false,
      requiresOptionLabels: true,
      requiresCorrectAnswer: false
    },
    screen_based_open_ended: {
      canSendWithoutQuestionText: true,
      canSendWithoutOptionText: true,
      canSendWithoutOptions: true,
      requiresOptionLabels: false,
      requiresCorrectAnswer: false
    },
    screen_based_true_false: {
      canSendWithoutQuestionText: true,
      canSendWithoutOptionText: true,
      canSendWithoutOptions: false,
      requiresOptionLabels: true,
      requiresCorrectAnswer: false
    },
    poll: {
      canSendWithoutQuestionText: false,
      canSendWithoutOptionText: false,
      canSendWithoutOptions: false,
      requiresOptionLabels: true,
      requiresCorrectAnswer: false
    }
  };

  var STUDENT_HINTS = {
    screen_based_single_choice_blank_options: 'Ekrandaki soruya göre cevabını seç.',
    screen_based_open_ended: 'Ekrandaki sorunun cevabını yaz.',
    screen_based_true_false: 'Ekrandaki ifadeye göre Doğru veya Yanlış seç.',
    manual_single_choice: 'Soruyu cevapla.',
    poll: 'Görüşünü seç.'
  };

  function labelAt(i) { return LABELS[i] || String(i + 1); }

  function typeToKind(type) {
    if (type === 'poll') return 'poll';
    if (type === 'manual_open_ended' || type === 'screen_based_open_ended') return 'open_ended';
    if (type === 'screen_based_true_false') return 'quick_check';
    if (type.indexOf('screen') >= 0) return 'screen_based_answer';
    return 'quiz';
  }

  function inferGradingEnabled(req) {
    if (req.gradingEnabled != null) return !!req.gradingEnabled;
    if (req.kind === 'poll' || req.type === 'poll') return false;
    if (req.answerMode === 'open_ended') return !!(req.expectedAnswer || '').trim();
    return (req.options || []).some(function (o) { return o.isCorrect === true; });
  }

  function buildBlankOptions(count, prefix) {
    prefix = prefix || 'opt';
    var opts = [];
    for (var i = 0; i < count; i++) {
      opts.push({
        id: prefix + '-' + labelAt(i).toLowerCase(),
        label: labelAt(i),
        text: '',
        isCorrect: false,
        voteCount: 0
      });
    }
    return opts;
  }

  function buildTrueFalseOptions(prefix) {
    prefix = prefix || 'tf';
    return [
      { id: prefix + '-true', label: 'Doğru', text: 'Doğru', isCorrect: false, voteCount: 0 },
      { id: prefix + '-false', label: 'Yanlış', text: 'Yanlış', isCorrect: false, voteCount: 0 }
    ];
  }

  function createAnswerRequest(partial) {
    partial = partial || {};
    var type = partial.type || 'screen_based_single_choice_blank_options';
    var rules = VALIDATION[type] || VALIDATION.screen_based_single_choice_blank_options;
    var kind = partial.kind || typeToKind(type);
    var req = {
      id: partial.id || 'ar-' + Date.now(),
      classSessionId: partial.classSessionId || 'session-demo-1',
      title: partial.title || '',
      questionText: partial.questionText || '',
      helperText: partial.helperText || '',
      source: partial.source || 'current_screen',
      type: type,
      kind: kind,
      answerMode: partial.answerMode || (type.indexOf('open') >= 0 ? 'open_ended' : 'single_choice'),
      mode: partial.mode || (type.indexOf('open') >= 0 ? 'open_ended' : 'single_choice'),
      options: partial.options || [],
      allowEmptyQuestionText: partial.allowEmptyQuestionText != null ? partial.allowEmptyQuestionText : rules.canSendWithoutQuestionText,
      allowBlankOptionText: partial.allowBlankOptionText != null ? partial.allowBlankOptionText : rules.canSendWithoutOptionText,
      allowNoOptions: partial.allowNoOptions != null ? partial.allowNoOptions : rules.canSendWithoutOptions,
      optionCount: partial.optionCount,
      expectedAnswer: partial.expectedAnswer,
      timeLimitSeconds: partial.timeLimitSeconds !== undefined ? partial.timeLimitSeconds : 60,
      remainingSeconds: partial.remainingSeconds != null ? partial.remainingSeconds : partial.timeLimitSeconds,
      status: partial.status || 'active',
      showResultsToStudents: !!partial.showResultsToStudents,
      showCorrectAnswerToStudents: !!partial.showCorrectAnswerToStudents,
      allowChangeAnswer: partial.allowChangeAnswer !== false,
      gradingEnabled: partial.gradingEnabled,
      feedbackMode: partial.feedbackMode || 'after_submit',
      supportiveFeedbackEnabled: partial.supportiveFeedbackEnabled !== false,
      customIncorrectFeedback: partial.customIncorrectFeedback,
      customCorrectFeedback: partial.customCorrectFeedback,
      createdAt: partial.createdAt || new Date().toISOString(),
      studentHint: partial.studentHint || STUDENT_HINTS[type] || ''
    };
    req.gradingEnabled = inferGradingEnabled(req);
    return req;
  }

  function validateRequest(req) {
    var rules = VALIDATION[req.type];
    if (!rules) return { ok: false, reason: 'Geçersiz tip' };
    if (!rules.canSendWithoutQuestionText && !(req.questionText || '').trim() && !(req.title || '').trim()) {
      return { ok: false, reason: 'Soru metni gerekli' };
    }
    if (!rules.canSendWithoutOptions && (!req.options || req.options.length < 2)) {
      return { ok: false, reason: 'En az 2 seçenek gerekli' };
    }
    if (req.options && req.options.length && rules.requiresOptionLabels) {
      for (var i = 0; i < req.options.length; i++) {
        if (!req.options[i].label) return { ok: false, reason: 'Şık etiketi zorunlu' };
      }
    }
    if (!rules.canSendWithoutOptionText && req.options) {
      for (var j = 0; j < req.options.length; j++) {
        if (!(req.options[j].text || '').trim()) return { ok: false, reason: 'Şık metni gerekli' };
      }
    }
    return { ok: true };
  }

  function toScreenPrompt(req) {
    var SQ = global.BilenyumScreenQuestion;
    var create = SQ && SQ.createPrompt ? SQ.createPrompt : function (p) { return p; };
    var mode = req.answerMode === 'open_ended' ? 'open_ended'
      : req.type === 'screen_based_true_false' ? 'true_false' : 'multiple_choice';
    return create({
      id: req.id,
      mode: mode,
      requestType: req.type,
      kind: req.kind,
      source: req.source,
      durationSeconds: req.timeLimitSeconds,
      options: (req.options || []).map(function (o) {
        return { id: o.id, label: o.label, text: o.text || '', isCorrect: !!o.isCorrect };
      }),
      correctTextAnswer: req.expectedAnswer || '',
      isCaseSensitive: !!req.isCaseSensitive,
      answerFieldType: req.answerFieldType,
      status: req.status,
      studentHint: req.studentHint,
      questionText: req.questionText,
      title: req.title,
      showResultsToStudents: req.showResultsToStudents,
      showCorrectAnswerToStudents: req.showCorrectAnswerToStudents,
      allowBlankOptionText: req.allowBlankOptionText,
      gradingEnabled: req.gradingEnabled,
      feedbackMode: req.feedbackMode,
      supportiveFeedbackEnabled: req.supportiveFeedbackEnabled,
      customIncorrectFeedback: req.customIncorrectFeedback,
      customCorrectFeedback: req.customCorrectFeedback,
      createdAt: req.createdAt
    });
  }

  global.BilenyumAnswerRequest = {
    VALIDATION: VALIDATION,
    STUDENT_HINTS: STUDENT_HINTS,
    PROGRAM_TYPE_LABELS: PROGRAM_TYPE_LABELS,
    labelAt: labelAt,
    typeToKind: typeToKind,
    inferGradingEnabled: inferGradingEnabled,
    buildBlankOptions: buildBlankOptions,
    buildTrueFalseOptions: buildTrueFalseOptions,
    createAnswerRequest: createAnswerRequest,
    validateRequest: validateRequest,
    toScreenPrompt: toScreenPrompt
  };

})(typeof window !== 'undefined' ? window : this);
