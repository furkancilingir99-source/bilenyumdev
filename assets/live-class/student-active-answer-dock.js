(function (global) {
  'use strict';

  var SQ = global.BilenyumScreenQuestion;
  var FB = global.BilenyumAnswerFeedback;
  var AR = global.BilenyumAnswerRequest;

  var activePrompt = null;
  var answered = false;
  var selectedOptionId = null;
  var selectedLabel = '';
  var timerId = null;
  var countdown = 0;
  var feedbackTimerId = null;
  var isMinimized = false;
  var deps = {};

  function $(id) { return document.getElementById(id); }

  function isScreenBasedBlank(prompt) {
    if (!prompt) return false;
    return prompt.requestType === 'screen_based_single_choice_blank_options'
      || (prompt.mode === 'multiple_choice' && prompt.allowBlankOptionText !== false && !(prompt.questionText || '').trim());
  }

  function isManualQuiz(prompt) {
    if (!prompt) return false;
    return prompt.requestType === 'manual_single_choice' || !!(prompt.questionText || '').trim();
  }

  function displayModeFor(prompt) {
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return 'mobile_bottom_sheet';
    if (isScreenBasedBlank(prompt)) return 'compact_dock';
    if (isManualQuiz(prompt)) return 'right_panel_sticky';
    if (prompt.mode === 'open_ended') return window.matchMedia('(max-width: 768px)').matches ? 'mobile_bottom_sheet' : 'compact_dock';
    return 'compact_dock';
  }

  function inferGrading(prompt) {
    if (prompt.gradingEnabled != null) return prompt.gradingEnabled;
    if (AR && AR.inferGradingEnabled) {
      return AR.inferGradingEnabled({
        kind: prompt.kind,
        type: prompt.requestType,
        answerMode: prompt.mode === 'open_ended' ? 'open_ended' : 'single_choice',
        expectedAnswer: prompt.correctTextAnswer,
        options: prompt.options
      });
    }
    if (prompt.mode === 'open_ended') return !!(prompt.correctTextAnswer || '').trim();
    return (prompt.options || []).some(function (o) { return o.isCorrect; });
  }

  function clearTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function clearFeedbackTimer() {
    if (feedbackTimerId) { clearTimeout(feedbackTimerId); feedbackTimerId = null; }
  }

  function fmtDuration(sec) {
    if (deps.fmtDuration) return deps.fmtDuration(sec);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function updateTimerDisplay() {
    var el = $('lcAnswerDockTimer');
    if (!el) return;
    if (!activePrompt || activePrompt.durationSeconds == null) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = fmtDuration(Math.max(0, countdown));
  }

  function startTimer() {
    clearTimer();
    if (!activePrompt || activePrompt.durationSeconds == null) {
      updateTimerDisplay();
      return;
    }
    countdown = activePrompt.durationSeconds;
    updateTimerDisplay();
    timerId = setInterval(function () {
      countdown--;
      updateTimerDisplay();
      if (countdown <= 0) expirePrompt();
    }, 1000);
  }

  function expirePrompt() {
    clearTimer();
    if (!answered && deps.toast) deps.toast('Süre doldu — cevap gönderilemez.');
    disableInputs();
  }

  function disableInputs() {
    var dock = $('lcAnswerDock');
    if (!dock) return;
    dock.querySelectorAll('.lc-answer-opt').forEach(function (b) { b.disabled = true; });
    var ta = $('lcAnswerDockText');
    if (ta) ta.disabled = true;
    var submit = $('lcAnswerDockSubmit');
    if (submit) submit.disabled = true;
  }

  function updateSelectionLabel() {
    var sel = $('lcAnswerDockSelection');
    if (!sel) return;
    if (selectedLabel) {
      sel.textContent = 'Seçimin: ' + selectedLabel;
      sel.hidden = false;
    } else if (activePrompt && activePrompt.mode === 'open_ended') {
      sel.textContent = '';
      sel.hidden = true;
    } else {
      sel.textContent = 'Bir seçenek seç';
      sel.hidden = false;
    }
  }

  function renderOptions(prompt) {
    var wrap = $('lcAnswerDockOpts');
    var openWrap = $('lcAnswerDockOpen');
    if (!wrap) return;

    selectedOptionId = null;
    selectedLabel = '';
    wrap.innerHTML = '';

    if (prompt.mode === 'multiple_choice' || prompt.mode === 'true_false') {
      if (openWrap) openWrap.hidden = true;
      wrap.hidden = false;
      (prompt.options || []).forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lc-answer-opt';
        var hasText = !!(opt.text && opt.text.trim());
        var letter = opt.label || (SQ ? SQ.optionLabel(i) : String.fromCharCode(65 + i));
        btn.textContent = hasText ? letter + ') ' + opt.text.trim() : letter;
        btn.dataset.id = opt.id;
        btn.dataset.label = letter;
        btn.setAttribute('aria-label', 'Şık ' + letter);
        btn.addEventListener('click', function () {
          if (answered) return;
          selectedOptionId = opt.id;
          selectedLabel = letter;
          wrap.querySelectorAll('.lc-answer-opt').forEach(function (b) {
            b.classList.toggle('is-selected', b.dataset.id === opt.id);
          });
          updateSelectionLabel();
          var submit = $('lcAnswerDockSubmit');
          if (submit) submit.disabled = false;
        });
        wrap.appendChild(btn);
      });
    } else {
      wrap.hidden = true;
      if (openWrap) openWrap.hidden = false;
      var ta = $('lcAnswerDockText');
      if (ta) {
        ta.value = '';
        ta.disabled = false;
        ta.rows = prompt.answerFieldType === 'long' ? 4 : 2;
      }
    }
    updateSelectionLabel();
    var submit = $('lcAnswerDockSubmit');
    if (submit) submit.disabled = prompt.mode === 'open_ended' ? false : true;
  }

  function renderQuestionExpand(prompt) {
    var qEl = $('lcAnswerDockQuestion');
    var expandBtn = $('lcAnswerDockExpand');
    if (!qEl) return;
    var text = (prompt.questionText || prompt.title || '').trim();
    if (!text) {
      qEl.hidden = true;
      if (expandBtn) expandBtn.hidden = true;
      return;
    }
    qEl.hidden = false;
    qEl.textContent = text;
    qEl.classList.remove('is-expanded');
    if (expandBtn) {
      expandBtn.hidden = text.length < 80;
      expandBtn.onclick = function () {
        qEl.classList.toggle('is-expanded');
        expandBtn.textContent = qEl.classList.contains('is-expanded') ? 'Daha az göster' : 'Sorunun tamamını gör';
      };
    }
  }

  function applyDisplayMode(mode) {
    var dock = $('lcAnswerDock');
    if (!dock) return;
    dock.dataset.mode = mode;
    dock.classList.toggle('is-minimized', isMinimized);
    dock.classList.toggle('is-mobile-sheet', mode === 'mobile_bottom_sheet');

    var sticky = $('lcAnswerStickyPanel');
    if (sticky) {
      sticky.hidden = mode !== 'right_panel_sticky';
    }
    if (mode === 'right_panel_sticky' && deps.openQuizTab) {
      deps.openQuizTab();
    }
  }

  function showFeedback(card) {
    var fb = $('lcAnswerDockFeedback');
    if (!fb || !FB) return;
    fb.hidden = false;
    fb.innerHTML = FB.renderFeedbackHtml(card, deps.esc);
    var closeBtn = fb.querySelector('[data-answer-fb-close]');
    if (closeBtn) closeBtn.addEventListener('click', hideFeedback);
    clearFeedbackTimer();
    feedbackTimerId = setTimeout(hideFeedback, 5500);
  }

  function hideFeedback() {
    clearFeedbackTimer();
    var fb = $('lcAnswerDockFeedback');
    if (fb) fb.hidden = true;
  }

  function showSubmittedState() {
    var submit = $('lcAnswerDockSubmit');
    var sel = $('lcAnswerDockSelection');
    if (submit) {
      submit.textContent = 'Cevabın kaydedildi ✓';
      submit.disabled = true;
      submit.classList.add('is-done');
    }
    if (sel) {
      sel.textContent = 'Cevabın kaydedildi ✓';
      sel.hidden = false;
    }
  }

  function show(prompt) {
    if (!prompt) return;
    activePrompt = prompt;
    answered = false;
    isMinimized = false;
    hideFeedback();

    var dock = $('lcAnswerDock');
    if (!dock) return;

    var mode = displayModeFor(prompt);
    applyDisplayMode(mode);

    var hint = $('lcAnswerDockHint');
    if (hint) hint.textContent = prompt.studentHint || 'Cevabını seç ve gönder.';

    var title = $('lcAnswerDockTitle');
    if (title) {
      title.textContent = isScreenBasedBlank(prompt)
        ? 'Ekrandaki soruya cevap'
        : (prompt.title || 'Aktif Soru');
    }

    renderQuestionExpand(prompt);
    renderOptions(prompt);

    var submit = $('lcAnswerDockSubmit');
    if (submit) {
      submit.textContent = 'Cevabı Gönder';
      submit.disabled = prompt.mode === 'open_ended' ? false : true;
      submit.classList.remove('is-done');
    }

    dock.hidden = false;
    startTimer();

    if (deps.updateChips) deps.updateChips();
    if (deps.onShow) deps.onShow(prompt, mode);
  }

  function hide() {
    activePrompt = null;
    answered = false;
    clearTimer();
    clearFeedbackTimer();
    hideFeedback();
    var dock = $('lcAnswerDock');
    if (dock) dock.hidden = true;
    var sticky = $('lcAnswerStickyPanel');
    if (sticky) sticky.hidden = true;
    if (deps.updateChips) deps.updateChips();
  }

  function buildFeedbackCard(isCorrect, grading) {
    var result;
    if (!grading) result = 'submitted';
    else if (activePrompt.mode === 'open_ended' && !(activePrompt.correctTextAnswer || '').trim()) result = 'pending_review';
    else if (isCorrect) result = 'correct';
    else result = 'incorrect';

    var correctOpt = SQ ? SQ.findCorrectOption(activePrompt.options) : null;
    var correctLabel = '';
    if (correctOpt && activePrompt.showCorrectAnswerToStudents) {
      correctLabel = correctOpt.label || '';
    }

    return FB.buildFeedbackCard({
      result: result,
      gradingEnabled: grading,
      isCorrect: isCorrect,
      isPendingReview: result === 'pending_review',
      teacherCustomMessage: result === 'incorrect'
        ? activePrompt.customIncorrectFeedback
        : result === 'correct' ? activePrompt.customCorrectFeedback : undefined,
      showCorrectAnswer: result === 'incorrect' && activePrompt.showCorrectAnswerToStudents && !!correctLabel,
      correctOptionLabel: correctLabel,
      xpDelta: result === 'correct' ? 15 : undefined
    });
  }

  function submitAnswer() {
    if (!activePrompt || answered) return;

    if ((activePrompt.mode === 'multiple_choice' || activePrompt.mode === 'true_false') && !selectedOptionId) return;

    var openText = '';
    if (activePrompt.mode === 'open_ended') {
      openText = ($('lcAnswerDockText') && $('lcAnswerDockText').value || '').trim();
      if (!openText) return;
    }

    if (activePrompt.durationSeconds != null && countdown <= 0) {
      if (deps.toast) deps.toast('Süre doldu.');
      return;
    }

    answered = true;
    clearTimer();
    disableInputs();
    showSubmittedState();

    var grading = inferGrading(activePrompt);
    var isCorrect = false;
    var resp = {
      id: 'sqr-me-' + Date.now(),
      promptId: activePrompt.id,
      studentId: 'me',
      studentName: deps.getStudentName ? deps.getStudentName() : 'Öğrenci',
      submittedAt: new Date().toISOString(),
      isCorrect: false
    };

    if (activePrompt.mode === 'multiple_choice' || activePrompt.mode === 'true_false') {
      resp.selectedOptionId = selectedOptionId;
      isCorrect = SQ.checkMultipleChoice(selectedOptionId, activePrompt.options);
    } else {
      resp.openEndedAnswer = openText;
      isCorrect = SQ.compareOpenEndedAnswer(openText, activePrompt.correctTextAnswer, activePrompt.isCaseSensitive);
      if (!grading) resp.reviewStatus = 'pending_review';
    }
    resp.isCorrect = grading ? isCorrect : null;

    if (activePrompt.supportiveFeedbackEnabled !== false && FB) {
      showFeedback(buildFeedbackCard(isCorrect, grading));
    }

    SQ.publish('student_response', resp);
    if (deps.toast) deps.toast('Cevabın kaydedildi.');

    if (grading && isCorrect && deps.showReward) deps.showReward('+15 XP');
    if (deps.onSubmit) deps.onSubmit(resp, { isCorrect: isCorrect, grading: grading });
  }

  function bind() {
    var submit = $('lcAnswerDockSubmit');
    if (submit) submit.addEventListener('click', submitAnswer);

    var minBtn = $('lcAnswerDockMin');
    if (minBtn) {
      minBtn.addEventListener('click', function () {
        isMinimized = !isMinimized;
        var dock = $('lcAnswerDock');
        if (dock) dock.classList.toggle('is-minimized', isMinimized);
      });
    }

    var ta = $('lcAnswerDockText');
    if (ta) {
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
      });
    }
  }

  global.StudentActiveAnswerDock = {
    init: function (d) {
      deps = d || {};
      bind();
    },
    show: show,
    hide: hide,
    submitAnswer: submitAnswer,
    isActive: function () { return !!activePrompt && activePrompt.status === 'active'; },
    getPrompt: function () { return activePrompt; },
    displayModeFor: displayModeFor
  };

})(typeof window !== 'undefined' ? window : this);
