(function (global) {
  'use strict';

  var SQ = global.BilenyumScreenQuestion;
  if (!SQ) return;

  var activePrompt = null;
  var answered = false;
  var selectedOptionId = null;
  var timerId = null;
  var countdown = 0;
  var deps = {};

  function $(id) { return document.getElementById(id); }

  function useDock() {
    return global.StudentActiveAnswerDock && $('lcAnswerDock');
  }

  function hideAllQuizPanels() {
    if ($('lcQuizIdle')) $('lcQuizIdle').hidden = true;
    if ($('lcQuizBox')) $('lcQuizBox').hidden = true;
    if ($('lcPollBox')) $('lcPollBox').hidden = true;
    if ($('lcScreenQBox')) $('lcScreenQBox').hidden = true;
  }

  function showIdle() {
    if ($('lcScreenQBox')) $('lcScreenQBox').hidden = true;
    if ($('lcQuizBox')) $('lcQuizBox').hidden = true;
    if ($('lcPollBox')) $('lcPollBox').hidden = true;
    if ($('lcQuizIdle')) $('lcQuizIdle').hidden = false;
  }

  function resetState() {
    answered = false;
    selectedOptionId = null;
    clearTimer();
    if ($('lcSqResult')) $('lcSqResult').hidden = true;
    if ($('lcSqSubmit')) $('lcSqSubmit').disabled = true;
  }

  function clearTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function inferGrading(prompt) {
    if (prompt.gradingEnabled != null) return prompt.gradingEnabled;
    if (prompt.mode === 'open_ended') return !!(prompt.correctTextAnswer || '').trim();
    return (prompt.options || []).some(function (o) { return o.isCorrect; });
  }

  function startTimer() {
    clearTimer();
    if (!activePrompt || activePrompt.durationSeconds == null) {
      if ($('lcSqTimer')) $('lcSqTimer').hidden = true;
      return;
    }
    countdown = activePrompt.durationSeconds;
    if ($('lcSqTimer')) {
      $('lcSqTimer').hidden = false;
      $('lcSqTimer').textContent = '⏱ ' + deps.fmtDuration(countdown);
    }
    timerId = setInterval(function () {
      countdown--;
      if ($('lcSqTimer')) $('lcSqTimer').textContent = '⏱ ' + deps.fmtDuration(Math.max(0, countdown));
      if (countdown <= 0) expirePrompt();
    }, 1000);
  }

  function expirePrompt() {
    clearTimer();
    if (!answered) deps.toast('Süre doldu — cevap gönderilemez.');
    disableInputs();
  }

  function disableInputs() {
    if ($('lcSqOpts')) {
      $('lcSqOpts').querySelectorAll('.lc-quiz-opt').forEach(function (b) { b.disabled = true; });
    }
    if ($('lcSqAnswer')) $('lcSqAnswer').disabled = true;
    if ($('lcSqSubmit')) $('lcSqSubmit').disabled = true;
  }

  function renderPanelPrompt(prompt) {
    hideAllQuizPanels();
    if ($('lcScreenQBox')) $('lcScreenQBox').hidden = false;
    if ($('lcSqTitle')) $('lcSqTitle').textContent = prompt.studentHint || 'Ekrandaki soruyu cevapla';
    if ($('lcSqQuestion')) {
      var q = (prompt.questionText || prompt.title || '').trim();
      if (q) {
        $('lcSqQuestion').hidden = false;
        $('lcSqQuestion').textContent = q;
      } else {
        $('lcSqQuestion').hidden = true;
      }
    }

    if (prompt.mode === 'multiple_choice' || prompt.mode === 'true_false') {
      if ($('lcSqMcWrap')) $('lcSqMcWrap').hidden = false;
      if ($('lcSqOpenWrap')) $('lcSqOpenWrap').hidden = true;
      if ($('lcSqOpts')) {
        $('lcSqOpts').innerHTML = '';
        (prompt.options || []).forEach(function (opt, i) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'lc-quiz-opt lc-sq-opt-letter';
          var display = (opt.text && opt.text.trim()) ? SQ.formatOptionDisplay(i, opt.text) : (opt.label || SQ.optionLabel(i));
          btn.textContent = display;
          btn.dataset.id = opt.id;
          btn.setAttribute('aria-label', 'Şık ' + (opt.label || SQ.optionLabel(i)));
          btn.addEventListener('click', function () {
            if (answered) return;
            selectedOptionId = opt.id;
            $('lcSqOpts').querySelectorAll('.lc-quiz-opt').forEach(function (b) {
              b.classList.toggle('is-selected', b.dataset.id === opt.id);
            });
            if ($('lcSqSubmit')) $('lcSqSubmit').disabled = false;
          });
          $('lcSqOpts').appendChild(btn);
        });
      }
      if ($('lcSqSubmit')) $('lcSqSubmit').disabled = true;
    } else {
      if ($('lcSqMcWrap')) $('lcSqMcWrap').hidden = true;
      if ($('lcSqOpenWrap')) $('lcSqOpenWrap').hidden = false;
      if ($('lcSqAnswer')) {
        $('lcSqAnswer').value = '';
        $('lcSqAnswer').disabled = false;
        $('lcSqAnswer').placeholder = 'Cevabını buraya yaz...';
        $('lcSqAnswer').rows = prompt.answerFieldType === 'long' ? 5 : 2;
      }
      if ($('lcSqSubmit')) $('lcSqSubmit').disabled = false;
    }
    startTimer();
    if (deps.openQuizTab) deps.openQuizTab();
  }

  function renderPrompt(prompt) {
    activePrompt = prompt;
    resetState();

    if (useDock()) {
      hideAllQuizPanels();
      if ($('lcQuizIdle')) $('lcQuizIdle').hidden = true;
      global.StudentActiveAnswerDock.show(prompt);
    } else {
      renderPanelPrompt(prompt);
    }

    if (deps.updateChips) deps.updateChips();
  }

  function closePrompt() {
    activePrompt = null;
    resetState();
    if (useDock()) global.StudentActiveAnswerDock.hide();
    showIdle();
    if (deps.updateChips) deps.updateChips();
  }

  function showVerdict(isCorrect) {
    var FB = global.BilenyumAnswerFeedback;
    var grading = inferGrading(activePrompt);
    if (FB) {
      var card = FB.buildFeedbackCard({
        gradingEnabled: grading,
        isCorrect: isCorrect,
        isPendingReview: activePrompt.mode === 'open_ended' && !grading,
        teacherCustomMessage: isCorrect ? activePrompt.customCorrectFeedback : activePrompt.customIncorrectFeedback,
        showCorrectAnswer: !isCorrect && activePrompt.showCorrectAnswerToStudents,
        correctOptionLabel: (function () {
          var co = SQ.findCorrectOption(activePrompt.options);
          return co ? co.label : '';
        })()
      });
      if ($('lcSqResult')) {
        $('lcSqResult').hidden = false;
        $('lcSqResult').innerHTML = FB.renderFeedbackHtml(card, deps.esc);
      }
      return;
    }
    if (!$('lcSqResult')) return;
    $('lcSqResult').hidden = false;
    if (isCorrect) {
      $('lcSqResult').innerHTML = '<div class="lc-sq-verdict lc-sq-verdict--ok" role="status">✓ Doğru cevap!</div>';
    } else if (grading) {
      $('lcSqResult').innerHTML = '<div class="lc-sq-verdict lc-sq-verdict--supportive" role="status">Henüz değil<br>' +
        (FB ? FB.getSupportiveFeedbackMessage({ result: 'incorrect' }) : 'Bir dahaki sefere yapabilirsin.') + '</div>';
    } else {
      $('lcSqResult').innerHTML = '<div class="lc-sq-verdict lc-sq-verdict--neutral" role="status">Cevabın alındı.</div>';
    }
  }

  function submitAnswer() {
    if (!activePrompt || answered) return;
    if ((activePrompt.mode === 'multiple_choice' || activePrompt.mode === 'true_false') && !selectedOptionId) return;
    if (activePrompt.mode === 'open_ended') {
      var text = ($('lcSqAnswer') && $('lcSqAnswer').value || '').trim();
      if (!text) return;
    }
    if (activePrompt.durationSeconds != null && countdown <= 0) {
      deps.toast('Süre doldu.');
      return;
    }

    answered = true;
    clearTimer();
    disableInputs();

    var grading = inferGrading(activePrompt);
    var isCorrect = false;
    var resp = {
      id: 'sqr-me-' + Date.now(),
      promptId: activePrompt.id,
      studentId: 'me',
      studentName: deps.getStudentName ? deps.getStudentName() : 'Furkan Çilingir',
      submittedAt: new Date().toISOString(),
      isCorrect: false
    };

    if (activePrompt.mode === 'multiple_choice' || activePrompt.mode === 'true_false') {
      resp.selectedOptionId = selectedOptionId;
      isCorrect = SQ.checkMultipleChoice(selectedOptionId, activePrompt.options);
    } else {
      resp.openEndedAnswer = $('lcSqAnswer').value.trim();
      isCorrect = SQ.compareOpenEndedAnswer(resp.openEndedAnswer, activePrompt.correctTextAnswer, activePrompt.isCaseSensitive);
      if (!grading) resp.reviewStatus = 'pending_review';
    }
    resp.isCorrect = grading ? isCorrect : null;

    if (activePrompt.supportiveFeedbackEnabled !== false) showVerdict(isCorrect);
    SQ.publish('student_response', resp);
    deps.toast('Cevabın kaydedildi.');
    if (grading && isCorrect && deps.showReward) deps.showReward('+15 XP');
  }

  function bind() {
    if ($('lcSqSubmit')) $('lcSqSubmit').addEventListener('click', submitAnswer);
    if ($('lcSqAnswer')) {
      $('lcSqAnswer').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); }
      });
    }

    SQ.subscribe(function (msg) {
      if (msg.event === 'prompt_start') renderPrompt(msg.payload);
      if (msg.event === 'prompt_close') closePrompt();
    });

    var existing = SQ.getActivePrompt();
    if (existing && existing.status === 'active') renderPrompt(existing);
  }

  global.StudentScreenQuestion = {
    init: function (d) {
      deps = d;
      bind();
    },
    isActive: function () {
      if (useDock() && global.StudentActiveAnswerDock.isActive()) return true;
      return !!activePrompt && activePrompt.status === 'active';
    },
    close: closePrompt
  };

})(typeof window !== 'undefined' ? window : this);
