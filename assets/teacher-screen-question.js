(function (global) {
  'use strict';

  var SQ = global.BilenyumScreenQuestion;
  var AR = global.BilenyumAnswerRequest;
  if (!SQ) return;

  var screenPrompt = null;
  var screenResponses = [];
  var sqTimerId = null;
  var sqCountdown = 0;
  var sqShowUnansweredOnly = false;
  var deps = {};

  function $(id) { return document.getElementById(id); }

  function getStudents() {
    return deps.getParticipants().filter(function (p) {
      return p.role === 'student' && !p.isInWaitingRoom;
    });
  }

  function openModal() {
    $('tlcScreenQModal').hidden = false;
    renderSqFormMode();
    validateSqForm();
  }

  function renderCorrectPick(count) {
    var wrap = $('tlcSqCorrectPick');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var lbl = SQ.optionLabel(i);
      wrap.innerHTML += '<label class="tlc-sq-check"><input type="radio" name="tlcSqCorrectLabel" value="' + lbl + '"> ' + lbl + '</label>';
    }
    wrap.querySelectorAll('input').forEach(function (inp) {
      inp.onchange = validateSqForm;
    });
  }

  function updatePreview() {
    var count = parseInt($('tlcSqOptionCount').value, 10) || 4;
    var labels = [];
    for (var i = 0; i < count; i++) labels.push(SQ.optionLabel(i));
    $('tlcSqPreview').textContent = 'Öğrenci görünümü: ' + labels.join(' · ');
    if ($('tlcSqSetCorrect') && $('tlcSqSetCorrect').checked) renderCorrectPick(count);
  }

  function renderSqFormMode() {
    var mode = $('tlcSqMode').value;
    var isMc = mode === 'multiple_choice';
    var isOpen = mode === 'open_ended';
    $('tlcSqMcWrap').hidden = !isMc;
    $('tlcSqOpenWrap').hidden = !isOpen;
    if (isMc) {
      $('tlcSqSubmit').textContent = 'Şıkları Gönder';
      updatePreview();
    } else if (isOpen) {
      $('tlcSqSubmit').textContent = 'Cevap İste';
    } else {
      $('tlcSqSubmit').textContent = 'Doğru/Yanlış Gönder';
    }
    validateSqForm();
  }

  function validateSqForm() {
    var mode = $('tlcSqMode').value;
    var btn = $('tlcSqSubmit');
    if (mode === 'multiple_choice') {
      var count = parseInt($('tlcSqOptionCount').value, 10) || 2;
      var needCorrect = $('tlcSqSetCorrect') && $('tlcSqSetCorrect').checked;
      var hasPick = !needCorrect || (document.querySelector('input[name="tlcSqCorrectLabel"]:checked') != null);
      btn.disabled = count < 2 || !hasPick;
    } else if (mode === 'open_ended') {
      var needAns = $('tlcSqSetCorrectOpen') && $('tlcSqSetCorrectOpen').checked;
      btn.disabled = needAns && !$('tlcSqCorrect').value.trim();
    } else {
      btn.disabled = false;
    }
  }

  function buildPromptFromForm() {
    var mode = $('tlcSqMode').value;
    var durVal = $('tlcSqDuration').value;
    var duration = durVal === 'unlimited' ? null : parseInt(durVal, 10);
    var source = $('tlcSqSource').value;
    var showResults = $('tlcSqShowResults') && $('tlcSqShowResults').checked;

    if (mode === 'true_false' && AR) {
      var tfReq = AR.createAnswerRequest({
        source: source,
        type: 'screen_based_true_false',
        answerMode: 'single_choice',
        options: AR.buildTrueFalseOptions('tf'),
        timeLimitSeconds: duration,
        showResultsToStudents: showResults,
        supportiveFeedbackEnabled: true,
        feedbackMode: 'after_submit'
      });
      return AR.toScreenPrompt(tfReq);
    }

    if (mode === 'open_ended' && AR) {
      var openReq = AR.createAnswerRequest({
        source: source,
        type: 'screen_based_open_ended',
        answerMode: 'open_ended',
        options: [],
        expectedAnswer: ($('tlcSqSetCorrectOpen') && $('tlcSqSetCorrectOpen').checked) ? $('tlcSqCorrect').value.trim() : '',
        isCaseSensitive: $('tlcSqCaseSensitive') && $('tlcSqCaseSensitive').checked,
        timeLimitSeconds: duration,
        showResultsToStudents: showResults,
        supportiveFeedbackEnabled: true,
        feedbackMode: 'after_submit'
      });
      var op = AR.toScreenPrompt(openReq);
      op.isCaseSensitive = openReq.isCaseSensitive;
      op.answerFieldType = openReq.answerFieldType;
      return op;
    }

    var count = parseInt($('tlcSqOptionCount').value, 10) || 4;
    var options = AR ? AR.buildBlankOptions(count, 'sq') : [];
    if ($('tlcSqSetCorrect') && $('tlcSqSetCorrect').checked) {
      var picked = document.querySelector('input[name="tlcSqCorrectLabel"]:checked');
      if (picked) {
        options.forEach(function (o) { o.isCorrect = o.label === picked.value; });
      }
    }
    if (AR) {
      var mcReq = AR.createAnswerRequest({
        source: source,
        type: 'screen_based_single_choice_blank_options',
        answerMode: 'single_choice',
        options: options,
        optionCount: count,
        timeLimitSeconds: duration,
        showResultsToStudents: showResults,
        supportiveFeedbackEnabled: true,
        feedbackMode: 'after_submit'
      });
      return AR.toScreenPrompt(mcReq);
    }
    return SQ.createPrompt({ mode: 'multiple_choice', durationSeconds: duration, options: options, status: 'active' });
  }

  function publishPrompt(prompt) {
    screenPrompt = prompt;
    screenResponses = [];
    sqShowUnansweredOnly = false;
    getStudents().forEach(function (p) { p.sqAnswered = false; });
    SQ.publish('prompt_start', prompt);
    $('tlcSqResults').hidden = false;
    if ($('tlcQuizResults')) $('tlcQuizResults').hidden = true;
    deps.setPanelTab('quiz');
    deps.toast('Cevap toplama başlatıldı.');
    startSqTimer();
    renderSqResults();
    deps.updateChips();
    deps.renderAll();
  }

  function sendBlankChoice(count, source, opts) {
    opts = opts || {};
    if (AR) {
      var options = AR.buildBlankOptions(count, 'sq');
      if (opts.correctLabel) {
        options.forEach(function (o) { o.isCorrect = o.label === opts.correctLabel; });
      }
      var req = AR.createAnswerRequest({
        source: source || 'whiteboard',
        type: 'screen_based_single_choice_blank_options',
        options: options,
        optionCount: count,
        timeLimitSeconds: opts.duration != null ? opts.duration : 60,
        supportiveFeedbackEnabled: true,
        feedbackMode: 'after_submit',
        showCorrectAnswerToStudents: !!opts.setCorrect
      });
      publishPrompt(AR.toScreenPrompt(req));
      return;
    }
    publishPrompt(SQ.createPrompt({ mode: 'multiple_choice', durationSeconds: opts.duration || 60, options: [] }));
  }

  function sendOpenEnded(opts) {
    opts = opts || {};
    if (AR) {
      var req = AR.createAnswerRequest({
        source: opts.source || 'whiteboard',
        type: 'screen_based_open_ended',
        answerMode: 'open_ended',
        options: [],
        expectedAnswer: opts.expectedAnswer || '',
        isCaseSensitive: !!opts.caseSensitive,
        timeLimitSeconds: opts.duration || 90,
        supportiveFeedbackEnabled: true,
        feedbackMode: 'after_submit'
      });
      var p = AR.toScreenPrompt(req);
      p.isCaseSensitive = req.isCaseSensitive;
      publishPrompt(p);
    }
  }

  function sendTrueFalse(source, opts) {
    opts = opts || {};
    if (AR) {
      var req = AR.createAnswerRequest({
        source: source || 'current_screen',
        type: 'screen_based_true_false',
        options: AR.buildTrueFalseOptions('tf'),
        timeLimitSeconds: opts.duration != null ? opts.duration : 30,
        supportiveFeedbackEnabled: true
      });
      publishPrompt(AR.toScreenPrompt(req));
    }
  }

  function simulateResponses(opts) {
    opts = opts || {};
    var ratio = opts.ratio != null ? opts.ratio : 0.5;
    var students = getStudents();
    var n = Math.max(1, Math.round(students.length * ratio));
    students.slice(0, n).forEach(function (p) {
      if (!p.sqAnswered) simulateResponse({ forceStudent: p });
    });
  }

  function toggleResults(show) {
    if (screenPrompt) {
      screenPrompt.showResultsToStudents = show;
      deps.toast(show ? 'Sonuçlar öğrencilere açıldı.' : 'Sonuçlar gizlendi.');
    }
  }

  function startSqTimer() {
    clearSqTimer();
    if (!screenPrompt || screenPrompt.durationSeconds == null) return;
    sqCountdown = screenPrompt.durationSeconds;
    sqTimerId = setInterval(function () {
      sqCountdown--;
      if (sqCountdown <= 0) {
        expireScreenQuestion();
      }
      renderSqResults();
    }, 1000);
  }

  function clearSqTimer() {
    if (sqTimerId) { clearInterval(sqTimerId); sqTimerId = null; }
  }

  function expireScreenQuestion() {
    clearSqTimer();
    if (screenPrompt) screenPrompt.status = 'closed';
    SQ.publish('prompt_close', { promptId: screenPrompt ? screenPrompt.id : null, reason: 'timeout' });
    deps.toast('Süre doldu. Cevap alanı kapatıldı.');
    renderSqResults();
    deps.updateChips();
  }

  function sendScreenQuestion(e) {
    if (e) e.preventDefault();
    validateSqForm();
    if ($('tlcSqSubmit').disabled) return;
    publishPrompt(buildPromptFromForm());
    closeModal();
  }

  function closeModal() {
    $('tlcScreenQModal').hidden = true;
  }

  function stopScreenQuestion() {
    clearSqTimer();
    if (screenPrompt) {
      screenPrompt.status = 'closed';
      SQ.publish('prompt_close', { promptId: screenPrompt.id });
    }
    deps.toast('Cevap toplama durduruldu.');
    renderSqResults();
    deps.updateChips();
  }

  function extendSqTime() {
    if (!screenPrompt || screenPrompt.durationSeconds == null) {
      deps.toast('Süresiz modda uzatma gerekmez.');
      return;
    }
    sqCountdown += 30;
    screenPrompt.durationSeconds = (screenPrompt.durationSeconds || 0) + 30;
    deps.toast('Süre 30 saniye uzatıldı.');
    renderSqResults();
  }

  function ingestResponse(resp) {
    if (!screenPrompt || resp.promptId !== screenPrompt.id) return;
    var exists = screenResponses.some(function (r) { return r.studentId === resp.studentId; });
    if (exists) return;
    screenResponses.push(resp);
    var p = deps.getParticipant(resp.studentId);
    if (p) p.sqAnswered = true;
    renderSqResults();
    deps.renderAll();
  }

  function simulateResponse(opts) {
    opts = opts || {};
    if (!screenPrompt) {
      deps.toast('Önce ekrandaki soru cevap isteği başlatın.', true);
      return;
    }
    var students = getStudents().filter(function (p) { return !p.sqAnswered; });
    if (!students.length && !opts.forceStudent) {
      deps.toast('Tüm öğrenciler cevapladı.');
      return;
    }
    var p = opts.forceStudent || students[Math.floor(Math.random() * students.length)];
    var resp = {
      id: 'sqr-' + Date.now() + '-' + p.id,
      promptId: screenPrompt.id,
      studentId: p.id,
      studentName: p.name,
      submittedAt: new Date().toISOString(),
      isCorrect: false
    };
    if (screenPrompt.mode === 'multiple_choice' || screenPrompt.mode === 'true_false') {
      var pick;
      if (opts.correct === true) pick = SQ.findCorrectOption(screenPrompt.options);
      else if (opts.correct === false) {
        var wrong = screenPrompt.options.filter(function (o) { return !o.isCorrect; });
        pick = wrong[Math.floor(Math.random() * wrong.length)] || screenPrompt.options[0];
      } else {
        pick = screenPrompt.options[Math.floor(Math.random() * screenPrompt.options.length)];
      }
      resp.selectedOptionId = pick.id;
      resp.isCorrect = SQ.checkMultipleChoice(pick.id, screenPrompt.options);
    } else {
      if (opts.correct === true) resp.openEndedAnswer = screenPrompt.correctTextAnswer;
      else if (opts.correct === false) resp.openEndedAnswer = opts.wrongText || 'yanlış';
      else resp.openEndedAnswer = Math.random() > 0.5 ? screenPrompt.correctTextAnswer : 'x=99';
      resp.isCorrect = SQ.compareOpenEndedAnswer(
        resp.openEndedAnswer,
        screenPrompt.correctTextAnswer,
        screenPrompt.isCaseSensitive
      );
    }
    ingestResponse(resp);
    SQ.publish('student_response', resp);
  }

  function simulateAllResponses() {
    getStudents().forEach(function (p) {
      if (!p.sqAnswered) simulateResponse({ forceStudent: p, correct: Math.random() > 0.35 });
    });
  }

  function renderSqResults() {
    if (!screenPrompt) {
      $('tlcSqResults').hidden = true;
      return;
    }
    var students = getStudents();
    var answered = students.filter(function (p) { return p.sqAnswered; }).length;
    var correct = screenResponses.filter(function (r) { return r.isCorrect; }).length;
    var wrong = screenResponses.filter(function (r) { return !r.isCorrect; }).length;
    var timerTxt = screenPrompt.durationSeconds != null
      ? ' · Kalan: ' + deps.fmtDuration(Math.max(0, sqCountdown))
      : ' · Süresiz';

    var distParts = [];
    if (screenPrompt.mode === 'multiple_choice' || screenPrompt.mode === 'true_false') {
      screenPrompt.options.forEach(function (opt, i) {
        var c = screenResponses.filter(function (r) { return r.selectedOptionId === opt.id; }).length;
        var label = opt.label || SQ.optionLabel(i);
        distParts.push(label + ': ' + c);
      });
    }
    var unanswered = students.filter(function (p) { return !p.sqAnswered; });
    var unansweredNames = unanswered.map(function (p) { return p.name; }).join(', ');
    var hasGrading = (screenPrompt.options || []).some(function (o) { return o.isCorrect; });

    var compactHtml =
      '<div class="tlc-sq-compact">' +
        '<div class="tlc-sq-compact-title">Cevaplar: ' + answered + '/' + students.length + '</div>' +
        (distParts.length ? '<div class="tlc-sq-compact-dist">' + distParts.join(' · ') + '</div>' : '') +
        (unanswered.length ? '<div class="tlc-sq-compact-missing">Cevaplamayan: ' + unansweredNames + '</div>' : '') +
        (hasGrading && wrong > 0 ? '<span class="tlc-sq-feedback-badge">Destekleyici geri bildirim gönderildi</span>' : '') +
        '<div class="tlc-sq-compact-actions">' +
          '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcSqRemind">Hatırlatma gönder</button>' +
          '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcSqExtendInline">Süre uzat</button>' +
        '</div>' +
      '</div>';

    $('tlcSqStats').innerHTML = compactHtml +
      '<div class="tlc-sq-stat-row">' +
        '<span>Toplam: <strong>' + students.length + '</strong></span>' +
        '<span>Cevaplayan: <strong>' + answered + '</strong></span>' +
        '<span>Cevaplamayan: <strong>' + (students.length - answered) + '</strong></span>' +
      '</div>' +
      '<div class="tlc-sq-stat-row">' +
        '<span class="tlc-sq-correct">Doğru: <strong>' + correct + '</strong></span>' +
        '<span class="tlc-sq-wrong">Yanlış: <strong>' + wrong + '</strong></span>' +
        '<span class="tlc-preclass-meta">' + timerTxt + '</span>' +
      '</div>';

    var remindBtn = document.getElementById('tlcSqRemind');
    if (remindBtn) remindBtn.onclick = function () {
      deps.toast(unanswered.length ? unanswered.length + ' öğrenciye hatırlatma gönderildi.' : 'Herkes cevapladı.');
    };
    var extendInline = document.getElementById('tlcSqExtendInline');
    if (extendInline) extendInline.onclick = extendSqTime;

    var html = '';
    var maxVotes = 1;
    if (screenPrompt.mode === 'multiple_choice' || screenPrompt.mode === 'true_false') {
      screenPrompt.options.forEach(function (opt) {
        var c = screenResponses.filter(function (r) { return r.selectedOptionId === opt.id; }).length;
        if (c > maxVotes) maxVotes = c;
      });
      html += '<div class="tlc-sq-bars">';
      screenPrompt.options.forEach(function (opt, i) {
        var count = screenResponses.filter(function (r) { return r.selectedOptionId === opt.id; }).length;
        var pct = Math.round((count / Math.max(students.length, 1)) * 100);
        var barW = maxVotes ? Math.round((count / maxVotes) * 100) : 0;
        var label = opt.label || SQ.optionLabel(i);
        var display = (opt.text && opt.text.trim()) ? SQ.formatOptionDisplay(i, opt.text, label) : label;
        html += '<div class="tlc-sq-bar-row">' +
          '<span class="tlc-sq-bar-label">' + display + '</span>' +
          '<div class="tlc-sq-bar-track"><div class="tlc-sq-bar-fill" style="width:' + barW + '%"></div></div>' +
          '<span class="tlc-sq-bar-count">' + count + ' (' + pct + '%)</span>' +
          (opt.isCorrect ? ' <span class="tlc-sq-correct">✓</span>' : '') +
        '</div>';
      });
      html += '</div><hr class="tlc-sq-divider">';
    }
    var list = sqShowUnansweredOnly
      ? students.filter(function (p) { return !p.sqAnswered; })
      : students;
    if (sqShowUnansweredOnly) {
      list.forEach(function (p) {
        html += '<div class="tlc-response-item tlc-sq-unanswered">' + p.name + ' — cevaplamadı</div>';
      });
      if (!list.length) html += '<p class="tlc-preclass-meta">Herkes cevapladı.</p>';
    } else {
      screenResponses.forEach(function (r) {
        if (screenPrompt.mode === 'open_ended') {
          var review = r.reviewStatus || (r.isCorrect === true ? 'correct' : r.isCorrect === false ? 'incorrect' : 'unreviewed');
          html += '<div class="tlc-sq-open-card" data-rid="' + r.id + '">' +
            '<div class="tlc-sq-open-head"><strong>' + r.studentName + '</strong>' +
            '<span class="tlc-sq-review-badge is-' + review + '">' + reviewLabel(review) + '</span></div>' +
            '<p class="tlc-sq-open-text">' + (r.openEndedAnswer || '—') + '</p>' +
            '<div class="tlc-sq-review-actions">' +
              '<button type="button" class="tlc-btn tlc-btn--sm" data-review="correct" data-rid="' + r.id + '">Doğru</button>' +
              '<button type="button" class="tlc-btn tlc-btn--sm" data-review="incorrect" data-rid="' + r.id + '">Yanlış</button>' +
              '<button type="button" class="tlc-btn tlc-btn--sm" data-review="needs_review" data-rid="' + r.id + '">İncelemede</button>' +
            '</div></div>';
          return;
        }
        var detail = '';
        if (screenPrompt.mode === 'multiple_choice' || screenPrompt.mode === 'true_false') {
          var optIdx = -1;
          screenPrompt.options.forEach(function (o, i) {
            if (o.id === r.selectedOptionId) optIdx = i;
          });
          var opt = screenPrompt.options[optIdx];
          detail = opt ? SQ.formatOptionDisplay(optIdx, opt.text, opt.label) : '—';
        }
        html += '<div class="tlc-response-item">' +
          '<strong>' + r.studentName + '</strong> — ' + detail +
          ' — <span class="' + (r.isCorrect ? 'tlc-sq-correct' : 'tlc-sq-wrong') + '">' +
          (r.isCorrect ? 'Doğru' : 'Yanlış') + '</span></div>';
      });
      students.filter(function (p) { return !p.sqAnswered; }).forEach(function (p) {
        html += '<div class="tlc-response-item tlc-sq-unanswered">' + p.name + ' — bekliyor…</div>';
      });
    }
    $('tlcSqResultsBody').innerHTML = html || '<p class="tlc-preclass-meta">Henüz cevap yok.</p>';
    $('tlcSqResultsBody').querySelectorAll('[data-review]').forEach(function (btn) {
      btn.onclick = function () {
        var rid = btn.dataset.rid;
        var status = btn.dataset.review;
        var resp = screenResponses.find(function (x) { return x.id === rid; });
        if (!resp) return;
        resp.reviewStatus = status;
        resp.isCorrect = status === 'correct' ? true : status === 'incorrect' ? false : null;
        renderSqResults();
        deps.toast(resp.studentName + ' cevabı: ' + reviewLabel(status));
      };
    });
  }

  function reviewLabel(status) {
    var map = { unreviewed: 'İncelenmedi', correct: 'Doğru', incorrect: 'Yanlış', needs_review: 'İncelemede', partial: 'Kısmi' };
    return map[status] || status;
  }

  function quickStartMcBlankDemo() { sendBlankChoice(4); }

  function handleMock(action) {
    var val = action.split(':')[1];
    if (val === 'mc-blank') quickStartMcBlankDemo();
    else if (val === 'open') sendOpenEnded({});
    else if (val === 'mc-correct') simulateResponse({ correct: true });
    else if (val === 'mc-wrong') simulateResponse({ correct: false });
    else if (val === 'open-correct') simulateResponse({ correct: true });
    else if (val === 'open-wrong') simulateResponse({ correct: false, wrongText: 'x=99' });
    else if (val === 'case-on') sendOpenEnded({ caseSensitive: true, expectedAnswer: 'Ankara' });
    else if (val === 'case-off') sendOpenEnded({ expectedAnswer: 'Ankara' });
    else if (val === 'timeout') expireScreenQuestion();
    else if (val === 'all') simulateAllResponses();
    else if (val === 'unanswered') {
      sqShowUnansweredOnly = !sqShowUnansweredOnly;
      renderSqResults();
      deps.toast(sqShowUnansweredOnly ? 'Cevaplamayanlar listeleniyor.' : 'Tüm cevaplar gösteriliyor.');
    }
    return true;
  }

  function isActive() {
    return screenPrompt && screenPrompt.status === 'active';
  }

  function bind() {
    $('tlcOpenScreenQ').onclick = openModal;
    var sqBtn = $('tlcScreenQBtn');
    if (sqBtn) sqBtn.onclick = openModal;
    $('tlcSqCancel').onclick = closeModal;
    $('tlcSqMode').onchange = renderSqFormMode;
    $('tlcSqOptionCount').onchange = function () { updatePreview(); validateSqForm(); };
    $('tlcSqSetCorrect').onchange = function () {
      $('tlcSqCorrectPick').hidden = !this.checked;
      updatePreview();
      validateSqForm();
    };
    $('tlcSqSetCorrectOpen').onchange = function () {
      $('tlcSqOpenCorrectWrap').hidden = !this.checked;
      validateSqForm();
    };
    $('tlcSqCorrect').oninput = validateSqForm;
    $('tlcSqCaseSensitive').onchange = validateSqForm;
    $('tlcScreenQForm').onsubmit = sendScreenQuestion;
    $('tlcSqStop').onclick = stopScreenQuestion;
    $('tlcSqExtend').onclick = extendSqTime;
    $('tlcSqSimulate').onclick = function () { simulateResponse(); };
    $('tlcSqShowUnanswered').onclick = function () {
      sqShowUnansweredOnly = !sqShowUnansweredOnly;
      renderSqResults();
    };
    SQ.subscribe(function (msg) {
      if (msg.event === 'student_response') ingestResponse(msg.payload);
    });
    renderSqFormMode();
  }

  global.TeacherScreenQuestion = {
    init: function (d) {
      deps = d;
      bind();
    },
    handleMock: handleMock,
    isActive: isActive,
    getPrompt: function () { return screenPrompt; },
    renderResults: renderSqResults,
    sendBlankChoice: sendBlankChoice,
    sendOpenEnded: sendOpenEnded,
    sendTrueFalse: sendTrueFalse,
    simulateResponses: simulateResponses,
    toggleResults: toggleResults,
    stop: stopScreenQuestion,
    extendSqTime: extendSqTime
  };

})(typeof window !== 'undefined' ? window : this);
