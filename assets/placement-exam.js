/* ---------------------------------------------------------------------------
 * Bilenyum placement-exam.js — Sayısal / Sözel seviye belirleme sınavı
 *
 * Sayısal: Matematik + Fen, süreli, aralarında serbest geçiş
 * Sözel:   Türkçe + Sosyal + Din + İngilizce, süresiz, sayısala dönüş yok
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';
  var SAYISAL_SEC = 25 * 60;
  var BREAK_SEC = 7 * 60;
  var PHASES = {
    sayisal: { label: 'Sayısal Bölüm', subjects: ['mat', 'fen'], meta: 'Matematik · Fen Bilimleri' },
    break:   { label: 'Mola', subjects: [], meta: 'Sözel bölüm için hazırlan' },
    sozel:   { label: 'Sözel Bölüm',   subjects: ['trk', 'sos', 'din', 'ing'], meta: 'Türkçe · Sosyal · Din · İngilizce' }
  };
  var SUBJECT_LABELS = {
    mat: 'Matematik', fen: 'Fen Bilimleri', trk: 'Türkçe',
    sos: 'Sosyal Bilgiler', din: 'Din Kültürü', ing: 'İngilizce'
  };

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeXml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function wrapSvgText(text, maxChars) {
    var words = String(text).split(/\s+/);
    var lines = [];
    var line = '';
    words.forEach(function (word) {
      var next = line ? line + ' ' + word : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.slice(0, 6).map(function (l, i) {
      return '<tspan x="40" y="' + (72 + i * 34) + '">' + escapeXml(l) + '</tspan>';
    }).join('');
  }

  function makeTextQuestionSvg(q) {
    var lines = wrapSvgText(q.q, 42);
    var height = Math.max(220, 90 + Math.min(6, q.q.split(/\s+/).length) * 28);
    return '<svg viewBox="0 0 820 ' + height + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="plQGrad" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="rgba(168,164,240,0.14)"/>' +
        '<stop offset="100%" stop-color="rgba(74,214,255,0.10)"/>' +
      '</linearGradient></defs>' +
      '<rect width="820" height="' + height + '" rx="18" fill="url(#plQGrad)" stroke="rgba(26,21,56,0.12)" stroke-width="2"/>' +
      '<text fill="#1a1538" font-size="24" font-weight="800" font-family="Plus Jakarta Sans, Arial, sans-serif">' + lines + '</text>' +
    '</svg>';
  }

  function renderSheetHead(root, q, li, listLen) {
    var head = root.querySelector('#hwSheetHeadInner');
    if (!head) return;

    var unit = (q && q.unit) || '—';
    var unitSubtitle = (q && q.unitSubtitle) || '—';

    head.innerHTML =
      '<div class="asm-hw-sheet-head-row">' +
        '<div class="asm-hw-sheet-qbox" aria-label="Soru ' + (li + 1) + ' / ' + listLen + '">' +
          '<span class="asm-hw-sheet-qbox-num">' + (li + 1) + '</span>' +
        '</div>' +
        '<div class="asm-hw-sheet-meta asm-hw-sheet-unit">' +
          '<p class="asm-hw-sheet-unit-line">' +
            '<span class="asm-hw-sheet-unit-label">Ünite Adı:</span> ' +
            escapeHtml(unit) +
          '</p>' +
          '<p class="asm-hw-sheet-unit-line">' +
            '<span class="asm-hw-sheet-unit-label">Ünite Alt Başlığı:</span> ' +
            escapeHtml(unitSubtitle) +
          '</p>' +
        '</div>' +
      '</div>';
  }

  function renderSheetBlocks(root, q, li) {
    var body = root.querySelector('#hwSheetBody');
    var questionSheet = root.querySelector('#hwQuestionSheet');
    if (!body) return;

    var isVisual = q.type === 'visual' && (q.blocks || q.visual);
    if (questionSheet) {
      questionSheet.classList.toggle('is-visual', !!isVisual);
      questionSheet.classList.toggle('is-text-only', !isVisual);
    }

    if (q.blocks && q.blocks.length) {
      body.innerHTML = q.blocks.map(function (block) {
        if (block.kind === 'lead') {
          return '<p class="asm-hw-block asm-hw-block-lead">' +
            '<span class="asm-hw-block-num">' + (li + 1) + '.</span> ' +
            escapeHtml(block.text) + '</p>';
        }
        if (block.kind === 'text') {
          return '<p class="asm-hw-block asm-hw-block-text">' + escapeHtml(block.text) + '</p>';
        }
        if (block.kind === 'prompt') {
          return '<p class="asm-hw-block asm-hw-block-prompt"><strong>' + escapeHtml(block.text) + '</strong></p>';
        }
        if (block.kind === 'figure') {
          var media = block.src
            ? '<img src="' + block.src + '" alt="' + escapeHtml(block.alt || '') + '" loading="lazy" />'
            : block.svg || '';
          return '<div class="asm-hw-block asm-hw-block-figure" role="img" aria-label="' + escapeHtml(block.alt || '') + '">' +
            media + '</div>';
        }
        return '';
      }).join('');
      return;
    }

    var hasSvg = isVisual && q.visual && q.visual.svg;
    var hasSrc = isVisual && q.visual && (q.visual.src || q.visual.embed);
    var parts = [];

    if (isVisual && q.q) {
      parts.push('<p class="asm-hw-block asm-hw-block-lead"><span class="asm-hw-block-num">' + (li + 1) + '.</span> ' + escapeHtml(q.q) + '</p>');
    }

    if (hasSvg || hasSrc) {
      var fig;
      if (q.visual.embed) {
        fig = '<object type="image/svg+xml" data="' + q.visual.embed + '"><img src="' + q.visual.embed + '" alt="' + escapeHtml(q.visual.alt || '') + '" /></object>';
      } else if (hasSrc) {
        fig = '<img src="' + q.visual.src + '" alt="' + escapeHtml(q.visual.alt || '') + '" loading="lazy" />';
      } else {
        fig = q.visual.svg;
      }
      parts.push('<div class="asm-hw-block asm-hw-block-figure" role="img">' + fig + '</div>');
    } else if (!isVisual) {
      parts.push('<div class="asm-hw-block asm-hw-block-figure is-svg">' + makeTextQuestionSvg(q) + '</div>');
    }

    if (isVisual && q.visual && q.visual.caption) {
      parts.push('<p class="asm-hw-block asm-hw-block-caption">' + escapeHtml(q.visual.caption) + '</p>');
    }

    body.innerHTML = parts.join('');
  }

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }
  function lsRemove(k) { try { localStorage.removeItem(P + k); } catch (e) {} }

  function loadState() {
    var answers = [];
    var subjectIdx = {};
    try { answers = JSON.parse(lsGet('placementAnswers') || '[]'); } catch (e) {}
    try { subjectIdx = JSON.parse(lsGet('placementSubjectIdx') || '{}'); } catch (e) {}
    var sayisalDone = lsGet('placementSayisalDone') === '1';
    var sozelStarted = lsGet('placementSozelStarted') === '1';
    var phase = 'sayisal';
    if (sayisalDone && sozelStarted) phase = 'sozel';
    else if (sayisalDone) phase = 'break';
    return {
      phase: phase,
      answers: answers,
      subjectIdx: subjectIdx,
      activeSubject: lsGet('placementActiveSubject') || null,
      sayisalEndAt: lsGet('placementSayisalEndAt'),
      breakEndAt: lsGet('placementBreakEndAt')
    };
  }

  function saveState(state) {
    lsSet('placementAnswers', JSON.stringify(state.answers));
    lsSet('placementSubjectIdx', JSON.stringify(state.subjectIdx));
    if (state.activeSubject) lsSet('placementActiveSubject', state.activeSubject);
    if (state.sayisalEndAt) lsSet('placementSayisalEndAt', state.sayisalEndAt);
  }

  function buildQuestionMaps(questions) {
    var bySubject = {};
    questions.forEach(function (q, gi) {
      var code = q.subjectCode || 'mat';
      if (!bySubject[code]) bySubject[code] = [];
      bySubject[code].push({ q: q, globalIndex: gi });
    });
    return bySubject;
  }

  function formatTimer(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function init(root) {
    if (!root) return;

    var questions = global.BilenyumPlacementQuestions || [];
    var bySubject = buildQuestionMaps(questions);
    var state = loadState();
    var phase = state.phase;
    var answers = state.answers;
    if (answers.length < questions.length) {
      answers.length = questions.length;
    }
    var subjectIdx = state.subjectIdx;
    var timerId = null;
    var breakTimerId = null;
    var locked = false;
    var lastGlobalIndex = null;

    var layoutEl = root.querySelector('.asm-placement-layout');
    var progressFill = root.querySelector('.asm-hw-meta-progress .asm-exam-progress-fill');
    var optionsEl = root.querySelector('#hwSheetOptions');
    var prevBtn = root.querySelector('[data-asm-prev]');
    var nextBtn = root.querySelector('[data-asm-next]');
    var finishSayisalBtn = root.querySelector('#asmFinishSayisal');
    var finishSozelBtn = root.querySelector('#asmFinishSozel');
    var examFooter = root.querySelector('#asmExamFooter');
    var confirmEl = root.querySelector('#asmConfirm');
    var confirmTitle = root.querySelector('#asmConfirmTitle');
    var confirmHint = root.querySelector('#asmConfirmHint');
    var confirmText = root.querySelector('#asmConfirmText');
    var confirmOkBtn = root.querySelector('#asmConfirmOk');
    var confirmCancelBtn = root.querySelector('#asmConfirmCancel');
    var confirmCallback = null;
    var confirmCancelCallback = null;
    var tabsEl = root.querySelector('#asmSubjectTabs');
    var tabsWrapEl = root.querySelector('#asmSubjectTabsWrap');
    var paletteEl = root.querySelector('#asmQPalette');
    var examTitleEl = root.querySelector('#asmPlacementExamTitle');
    var stepSayisal = root.querySelector('#asmStepSayisal');
    var stepSozel = root.querySelector('#asmStepSozel');
    var transitionEl = root.querySelector('#asmPhaseTransition');
    var transitionBtn = root.querySelector('#asmTransitionBtn');
    var skipBreakCheckbox = root.querySelector('#asmBreakSkip');
    var breakTimerEl = root.querySelector('#asmBreakTimer');
    var transitionHint = root.querySelector('#asmTransitionHint');
    var studentBar = global.BilenyumExamStudentBar
      ? global.BilenyumExamStudentBar.mount(root, { hideSection: true, hideDeadline: true })
      : null;
    var board = global.BilenyumHomeworkBoard
      ? global.BilenyumHomeworkBoard.mount(root, { penColor: '#000000', penSize: 2 })
      : null;

    function syncBoardQuestion(gi, reframe) {
      if (!board) return;
      if (lastGlobalIndex !== gi) {
        board.setQuestionIndex(gi, lastGlobalIndex);
        lastGlobalIndex = gi;
        reframe = true;
      }
      if (reframe) {
        requestAnimationFrame(function () {
          board.syncLayout();
          board.focusSheet();
        });
      }
    }

    function syncRemainingTime(seconds, visible) {
      if (studentBar && global.BilenyumExamStudentBar && global.BilenyumExamStudentBar.setRemaining) {
        global.BilenyumExamStudentBar.setRemaining(studentBar, seconds, visible);
      }
    }

    function phaseSubjects() {
      if (phase === 'break') return [];
      return PHASES[phase].subjects;
    }

    function activeSubject() {
      if (!state.activeSubject || phaseSubjects().indexOf(state.activeSubject) === -1) {
        state.activeSubject = phaseSubjects()[0];
      }
      return state.activeSubject;
    }

    function currentList() { return bySubject[activeSubject()] || []; }

    function currentLocalIdx() {
      var sub = activeSubject();
      if (subjectIdx[sub] == null) subjectIdx[sub] = 0;
      return subjectIdx[sub];
    }

    function setLocalIdx(val) {
      subjectIdx[activeSubject()] = val;
      saveState(state);
    }

    function currentEntry() {
      var list = currentList();
      var li = currentLocalIdx();
      return list[li] || null;
    }

    function optLabel(opt) { return typeof opt === 'string' ? opt : (opt.label || ''); }
    function optHasVisual(opt) { return opt && typeof opt === 'object' && (opt.svg || opt.src); }

    function updatePhaseUI() {
      if (phase === 'break') {
        if (examTitleEl) examTitleEl.textContent = 'Seviye Belirleme Sınavı';
        if (finishSayisalBtn) finishSayisalBtn.hidden = true;
        if (finishSozelBtn) finishSozelBtn.hidden = true;
        if (examFooter) examFooter.hidden = true;
        if (tabsEl) { tabsEl.innerHTML = ''; tabsEl.hidden = true; }
        if (tabsWrapEl) tabsWrapEl.hidden = true;
        if (layoutEl) layoutEl.hidden = true;
        root.classList.remove('is-sayisal', 'is-sozel');
        root.classList.add('is-break');
        if (stepSayisal) { stepSayisal.classList.add('is-done'); stepSayisal.classList.remove('is-active'); }
        if (stepSozel) { stepSozel.classList.remove('is-active', 'is-locked'); stepSozel.classList.add('is-pending'); }
        return;
      }

      if (examTitleEl) {
        examTitleEl.textContent = phase === 'sayisal'
          ? 'Sayısal Bölüm Seviye Belirleme Sınavı'
          : 'Sözel Bölüm Seviye Belirleme Sınavı';
      }

      if (stepSayisal && stepSozel) {
        stepSayisal.classList.toggle('is-active', phase === 'sayisal');
        stepSayisal.classList.toggle('is-done', phase === 'sozel');
        stepSozel.classList.toggle('is-active', phase === 'sozel');
        stepSozel.classList.toggle('is-locked', phase === 'sayisal');
        stepSozel.classList.remove('is-pending');
      }

      if (finishSayisalBtn) finishSayisalBtn.hidden = phase !== 'sayisal';
      if (finishSozelBtn) finishSozelBtn.hidden = phase !== 'sozel';
      if (examFooter) {
        examFooter.hidden = phase !== 'sayisal' && phase !== 'sozel';
        examFooter.classList.toggle('is-sayisal', phase === 'sayisal');
        examFooter.classList.toggle('is-sozel', phase === 'sozel');
      }
      if (tabsEl) tabsEl.hidden = false;
      if (tabsWrapEl) tabsWrapEl.hidden = false;
      if (layoutEl) layoutEl.hidden = false;
      root.classList.toggle('is-sozel', phase === 'sozel');
      root.classList.toggle('is-sayisal', phase === 'sayisal');
      root.classList.remove('is-break');
      if (phase === 'sozel') syncRemainingTime(null, false);
    }

    function renderTabs() {
      if (!tabsEl) return;
      var subs = phaseSubjects();
      tabsEl.innerHTML = subs.map(function (code) {
        var list = bySubject[code] || [];
        var answered = list.filter(function (e) { return answers[e.globalIndex] != null; }).length;
        var isActive = code === activeSubject();
        return '<button type="button" class="asm-subject-tab' + (isActive ? ' is-active' : '') + '" role="tab"' +
          ' aria-selected="' + isActive + '" data-subject="' + code + '">' +
          SUBJECT_LABELS[code] +
          '<span class="asm-subject-tab-count">' + answered + '/' + list.length + '</span></button>';
      }).join('');
    }

    function renderPalette() {
      if (!paletteEl) return;
      var list = currentList();
      var li = currentLocalIdx();
      paletteEl.innerHTML = list.map(function (entry, i) {
        var ans = answers[entry.globalIndex];
        var cls = 'asm-q-pill';
        if (i === li) cls += ' is-current';
        if (ans != null) cls += ' is-answered';
        return '<button type="button" class="' + cls + '" data-qidx="' + i + '">' + (i + 1) + '</button>';
      }).join('');
    }

    function renderOptions(q, gi) {
      if (!optionsEl) return;
      var hasVisualOpts = q.opts.some(optHasVisual);
      optionsEl.classList.toggle('asm-options--visual', hasVisualOpts);
      optionsEl.innerHTML = q.opts.map(function (opt, i) {
        var sel = answers[gi] === i ? ' is-selected' : '';
        var letter = String.fromCharCode(65 + i);
        var label = optLabel(opt);
        if (optHasVisual(opt)) {
          var media = opt.src
            ? '<img class="asm-option-visual-img" src="' + opt.src + '" alt="' + (opt.alt || label) + '" />'
            : '<div class="asm-option-visual-svg">' + opt.svg + '</div>';
          return '<button type="button" class="asm-option asm-option--visual' + sel + '" data-opt="' + i + '">' +
            '<span class="asm-option-letter">' + letter + '</span>' +
            '<span class="asm-option-visual-body">' + media + '<span class="asm-option-visual-label">' + label + '</span></span></button>';
        }
        return '<button type="button" class="asm-option' + sel + '" data-opt="' + i + '">' +
          '<span class="asm-option-letter">' + letter + '</span>' + label + '</button>';
      }).join('');
    }

    function canGoPrev() {
      var li = currentLocalIdx();
      var si = phaseSubjects().indexOf(activeSubject());
      return li > 0 || si > 0;
    }

    function canGoNext() {
      var list = currentList();
      var li = currentLocalIdx();
      var subs = phaseSubjects();
      var si = subs.indexOf(activeSubject());
      return li < list.length - 1 || si < subs.length - 1;
    }

    function goPrev() {
      if (locked || !canGoPrev()) return;
      var list = currentList();
      var li = currentLocalIdx();
      var subs = phaseSubjects();
      var si = subs.indexOf(activeSubject());
      if (li > 0) {
        setLocalIdx(li - 1);
      } else if (si > 0) {
        state.activeSubject = subs[si - 1];
        var prevList = bySubject[state.activeSubject] || [];
        subjectIdx[state.activeSubject] = Math.max(0, prevList.length - 1);
        saveState(state);
      }
      render();
    }

    function goNext() {
      if (locked || !canGoNext()) return;
      var list = currentList();
      var li = currentLocalIdx();
      var subs = phaseSubjects();
      var si = subs.indexOf(activeSubject());
      if (li < list.length - 1) {
        setLocalIdx(li + 1);
      } else if (si < subs.length - 1) {
        state.activeSubject = subs[si + 1];
        subjectIdx[state.activeSubject] = subjectIdx[state.activeSubject] || 0;
        saveState(state);
      }
      render();
    }

    function sayisalSecondsLeft() {
      if (!state.sayisalEndAt) return SAYISAL_SEC;
      return Math.max(0, Math.floor((new Date(state.sayisalEndAt).getTime() - Date.now()) / 1000));
    }

    function countSayisalUnanswered() {
      return PHASES.sayisal.subjects.reduce(function (acc, code) {
        return acc + (bySubject[code] || []).filter(function (e) { return answers[e.globalIndex] == null; }).length;
      }, 0);
    }

    function sayisalTimeWarning(includeReview) {
      var left = sayisalSecondsLeft();
      var unanswered = countSayisalUnanswered();
      var parts = ['Hâlâ ' + formatTimer(left) + ' süren var.'];
      if (includeReview !== false) parts.push('Sorularını tekrar kontrol edebilirsin.');
      if (unanswered > 0) parts.push(unanswered + ' soruyu henüz yanıtlamadın.');
      return parts.join(' ');
    }

    function showConfirm(title, text, onOk, extra) {
      var opts = typeof title === 'object'
        ? title
        : { title: title, text: text, onOk: onOk, onCancel: extra && extra.onCancel, okLabel: extra && extra.okLabel, cancelLabel: extra && extra.cancelLabel, singleButton: extra && extra.singleButton, info: extra && extra.info, hint: extra && extra.hint };

      if (!confirmEl) { if (opts.onOk) opts.onOk(); return; }

      confirmCallback = opts.onOk || null;
      confirmCancelCallback = opts.onCancel || null;

      if (confirmTitle) confirmTitle.textContent = opts.title || 'Emin misin?';
      if (confirmHint) {
        if (opts.hint) {
          confirmHint.textContent = opts.hint;
          confirmHint.hidden = false;
        } else {
          confirmHint.textContent = '';
          confirmHint.hidden = true;
        }
      }
      if (confirmText) confirmText.textContent = opts.text || '';

      if (confirmOkBtn) confirmOkBtn.textContent = opts.okLabel || 'Evet, tamamla';
      if (confirmCancelBtn) confirmCancelBtn.hidden = !!opts.singleButton;
      if (confirmCancelBtn) confirmCancelBtn.textContent = opts.cancelLabel || 'Vazgeç';

      confirmEl.classList.toggle('is-info', !!opts.info);
      confirmEl.hidden = false;
      confirmEl.setAttribute('aria-hidden', 'false');
      if (confirmOkBtn) confirmOkBtn.focus();
    }

    function closeConfirm() {
      if (!confirmEl) return;
      confirmEl.hidden = true;
      confirmEl.setAttribute('aria-hidden', 'true');
      confirmEl.classList.remove('is-info');
      confirmCallback = null;
      confirmCancelCallback = null;
      if (confirmCancelBtn) confirmCancelBtn.hidden = false;
      if (confirmHint) {
        confirmHint.textContent = '';
        confirmHint.hidden = true;
      }
    }

    function handleConfirmCancel() {
      var cb = confirmCancelCallback;
      closeConfirm();
      if (cb) cb();
    }

    function showSayisalStayReminder() {
      showConfirm({
        title: 'Sayısal bölüme devam et',
        hint: sayisalTimeWarning(),
        text: 'Sorularını iyice kontrol etmeden bitirmemeni öneririz.',
        okLabel: 'Sorulara dön',
        singleButton: true,
        info: true
      });
    }

    function countSozelUnanswered() {
      return PHASES.sozel.subjects.reduce(function (acc, code) {
        return acc + (bySubject[code] || []).filter(function (e) { return answers[e.globalIndex] == null; }).length;
      }, 0);
    }

    function sozelSecondsElapsed() {
      var raw = lsGet('placementSozelStartedAt');
      if (!raw) return 0;
      return Math.max(0, Math.floor((Date.now() - new Date(raw).getTime()) / 1000));
    }

    function formatDurationLong(sec) {
      sec = Math.max(0, sec || 0);
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      if (m > 0) return m + ' dk ' + s + ' sn';
      return s + ' sn';
    }

    function sozelFinishWarning() {
      var elapsed = sozelSecondsElapsed();
      var unanswered = countSozelUnanswered();
      var parts = [];
      if (elapsed > 0) {
        parts.push('Sözel bölümde ' + formatDurationLong(elapsed) + ' süredir devam ediyorsun.');
      } else {
        parts.push('Sözel bölümde süresiz vakit ayırabilirsin.');
      }
      parts.push('Sorularını tekrar kontrol edebilirsin.');
      if (unanswered > 0) parts.push(unanswered + ' soruyu henüz yanıtlamadın.');
      return parts.join(' ');
    }

    function showSozelStayReminder() {
      showConfirm({
        title: 'Sözel bölüme devam et',
        hint: sozelFinishWarning(),
        text: 'Sorularını iyice kontrol etmeden bitirmemeni öneririz.',
        okLabel: 'Sorulara dön',
        singleButton: true,
        info: true
      });
    }

    function showPlacementFinishModal(placementData) {
      locked = true;
      clearInterval(timerId);
      clearInterval(breakTimerId);
      if (examFooter) examFooter.hidden = true;
      if (transitionEl) transitionEl.hidden = true;
      var Results = global.BilenyumResults;
      if (Results && Results.showPlacementFinishModal) {
        Results.showPlacementFinishModal(root, placementData);
      }
    }

    function tryShowCompletedPlacementModal() {
      if (lsGet('placementComplete') !== '1') return false;
      var Scoring = global.BilenyumScoring;
      var placementRaw = Scoring ? Scoring.loadPlacementResults() : null;
      if (!placementRaw || !placementRaw.placement) {
        location.href = 'sinav-sonuclari.html?view=placement';
        return true;
      }
      showPlacementFinishModal(placementRaw.placement);
      return true;
    }

    function render(opts) {
      opts = opts || {};
      if (locked) return;
      var entry = currentEntry();
      if (!entry) {
        var sheetBody = root.querySelector('#hwSheetBody');
        if (sheetBody) sheetBody.innerHTML = '<p class="asm-hw-block asm-hw-block-text">Bu derste soru bulunmuyor.</p>';
        return;
      }
      var q = entry.q;
      var gi = entry.globalIndex;
      var list = currentList();
      var li = currentLocalIdx();

      var phaseList = phaseSubjects().reduce(function (acc, code) {
        return acc + (bySubject[code] || []).length;
      }, 0);
      var phaseAnswered = phaseSubjects().reduce(function (acc, code) {
        return acc + (bySubject[code] || []).filter(function (e) { return answers[e.globalIndex] != null; }).length;
      }, 0);

      if (progressFill) progressFill.style.width = (phaseList ? (phaseAnswered / phaseList * 100) : 0) + '%';

      var isVisualQ = q.type === 'visual' && (q.blocks || q.visual);
      root.classList.toggle('is-visual-question', !!isVisualQ);

      renderSheetHead(root, q, li, list.length);
      renderSheetBlocks(root, q, li);
      renderOptions(q, gi);
      renderTabs();
      renderPalette();
      syncBoardQuestion(gi, !!opts.reframe);

      if (prevBtn) {
        prevBtn.disabled = !canGoPrev();
        prevBtn.classList.toggle('is-disabled', !canGoPrev());
      }
      if (nextBtn) {
        nextBtn.disabled = !canGoNext();
        nextBtn.classList.toggle('is-disabled', !canGoNext());
      }
    }

    function startSayisalTimer() {
      if (phase !== 'sayisal') return;
      if (!state.sayisalEndAt) {
        state.sayisalEndAt = new Date(Date.now() + SAYISAL_SEC * 1000).toISOString();
        saveState(state);
      }
      function tick() {
        var left = Math.floor((new Date(state.sayisalEndAt).getTime() - Date.now()) / 1000);
        syncRemainingTime(left, true);
        if (left <= 0) {
          clearInterval(timerId);
          showTransition('timeup');
        }
      }
      tick();
      timerId = setInterval(tick, 1000);
    }

    function breakSecondsLeft() {
      if (!state.breakEndAt) return 0;
      return Math.max(0, Math.floor((new Date(state.breakEndAt).getTime() - Date.now()) / 1000));
    }

    function isBreakSkipRequested() {
      return !!(skipBreakCheckbox && skipBreakCheckbox.checked);
    }

    function canStartSozel() {
      return breakSecondsLeft() <= 0 || isBreakSkipRequested();
    }

    function resetBreakSkipOption() {
      if (skipBreakCheckbox) skipBreakCheckbox.checked = false;
    }

    function updateBreakUI() {
      var left = breakSecondsLeft();
      var breakDone = left <= 0;
      var skipBreak = isBreakSkipRequested();
      var canStart = canStartSozel();

      if (breakTimerEl) {
        breakTimerEl.textContent = formatTimer(left);
        breakTimerEl.classList.toggle('is-done', breakDone);
        breakTimerEl.classList.toggle('is-skipped', skipBreak && !breakDone);
      }

      if (transitionHint) {
        if (breakDone) {
          transitionHint.textContent = 'Mol bitti! Sözel sınava başlamak için aşağıdaki butona basman gerekiyor.';
        } else if (skipBreak) {
          transitionHint.textContent = 'Mola süresini atlamayı seçtin. Hazırsan "Sözel Sınava Başla" butonuna basarak sözel bölüme geçebilirsin.';
        } else {
          transitionHint.textContent = '7 dakikalık molan var. Dinlenmek istersen süreyi bekle; molayı atlamak istersen "Mola süresini kullanmak istemiyorum" kutucuğunu işaretle.';
        }
      }

      if (transitionBtn) {
        transitionBtn.disabled = !canStart;
        transitionBtn.classList.toggle('is-waiting', !canStart);
        transitionBtn.setAttribute('aria-disabled', canStart ? 'false' : 'true');
      }
      syncRemainingTime(left, !skipBreak);
    }

    function startBreakTimer() {
      clearInterval(breakTimerId);
      updateBreakUI();
      breakTimerId = setInterval(function () {
        updateBreakUI();
        if (breakSecondsLeft() <= 0) clearInterval(breakTimerId);
      }, 1000);
    }

    function showTransition(reason) {
      locked = true;
      clearInterval(timerId);
      lsSet('placementSayisalDone', '1');
      if (!state.breakEndAt) {
        state.breakEndAt = new Date(Date.now() + BREAK_SEC * 1000).toISOString();
        lsSet('placementBreakEndAt', state.breakEndAt);
      }
      phase = 'break';
      updatePhaseUI();

      if (!transitionEl) return;
      resetBreakSkipOption();
      var title = root.querySelector('#asmTransitionTitle');
      var text = root.querySelector('#asmTransitionText');
      if (reason === 'timeup') {
        if (title) title.textContent = 'Sayısal süren doldu';
        if (text) text.textContent = 'Sayısal bölüm sona erdi. 7 dakikalık molandan sonra sözel bölüme geçeceksin — sayısal bölüme geri dönemezsin.';
      } else {
        if (title) title.textContent = 'Sayısal bölüm tamamlandı';
        if (text) text.textContent = 'Tebrikler! Şimdi 7 dakikalık molan var. Dinlen, su iç — ardından sözel bölüme geçeceksin.';
      }
      transitionEl.hidden = false;
      startBreakTimer();
    }

    function resumeBreakIfNeeded() {
      if (phase !== 'break') return;
      locked = true;
      updatePhaseUI();
      if (transitionEl) transitionEl.hidden = false;
      var title = root.querySelector('#asmTransitionTitle');
      var text = root.querySelector('#asmTransitionText');
      if (title) title.textContent = 'Mola devam ediyor';
      if (text) text.textContent = 'Sayısal bölüm bitti. Sözel sınava geçmeden önce molanı tamamla.';
      startBreakTimer();
    }

    function goToSozel() {
      if (breakSecondsLeft() > 0 && !isBreakSkipRequested()) return;
      clearInterval(breakTimerId);
      lsSet('placementSayisalDone', '1');
      lsSet('placementSozelStarted', '1');
      lsSet('placementSozelStartedAt', new Date().toISOString());
      lsRemove('placementBreakEndAt');
      lsRemove('placementSayisalEndAt');
      state.breakEndAt = null;
      state.sayisalEndAt = null;
      phase = 'sozel';
      state.activeSubject = 'trk';
      if (!subjectIdx.trk) subjectIdx.trk = 0;
      locked = false;
      resetBreakSkipOption();
      if (transitionEl) transitionEl.hidden = true;
      syncRemainingTime(null, false);
      saveState(state);
      updatePhaseUI();
      render({ reframe: true });
    }

    function finishSozel() {
      locked = true;
      clearInterval(timerId);
      var Scoring = global.BilenyumScoring;
      var placementData = Scoring ? Scoring.scorePlacement(questions, answers) : null;

      if (Scoring && placementData) {
        lsSet('placementResults', JSON.stringify({
          placement: placementData, answers: answers, completedAt: new Date().toISOString()
        }));
      }
      lsSet('placementComplete', '1');
      lsRemove('placementSayisalEndAt');
      lsRemove('placementBreakEndAt');
      lsRemove('placementSozelStarted');
      lsRemove('placementSozelStartedAt');
      if (global.BilenyumAssessment) global.BilenyumAssessment.markPlacementComplete();

      if (placementData) {
        showPlacementFinishModal(placementData);
      }
    }

    if (tabsEl) tabsEl.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-subject]');
      if (!tab || locked) return;
      state.activeSubject = tab.getAttribute('data-subject');
      saveState(state);
      render();
    });

    if (paletteEl) paletteEl.addEventListener('click', function (e) {
      var pill = e.target.closest('[data-qidx]');
      if (!pill || locked) return;
      setLocalIdx(parseInt(pill.getAttribute('data-qidx'), 10));
      render();
    });

    if (optionsEl) optionsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-opt]');
      if (!btn || locked) return;
      var entry = currentEntry();
      if (!entry) return;
      answers[entry.globalIndex] = parseInt(btn.getAttribute('data-opt'), 10);
      saveState(state);
      render();
    });

    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    root.addEventListener('keydown', function (e) {
      if (locked || phase === 'break') return;
      if (confirmEl && !confirmEl.hidden) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    });

    if (confirmEl) {
      confirmEl.querySelectorAll('[data-asm-confirm-cancel]').forEach(function (el) {
        el.addEventListener('click', handleConfirmCancel);
      });
      if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', function () {
          var cb = confirmCallback;
          closeConfirm();
          if (cb) cb();
        });
      }
    }

    if (finishSayisalBtn) {
      finishSayisalBtn.addEventListener('click', function () {
        if (phase !== 'sayisal' || locked) return;
        showConfirm({
          title: 'Sayısal sınavı bitir?',
          hint: sayisalTimeWarning(),
          text: 'Sayısal bölümü tamamlayıp sözel bölüme geçmek istediğine emin misin? Onayladığında sayısal bölüme geri dönemezsin.',
          okLabel: 'Evet, bitir',
          cancelLabel: 'Vazgeç',
          onOk: function () { showTransition('manual'); },
          onCancel: showSayisalStayReminder
        });
      });
    }

    if (finishSozelBtn) {
      finishSozelBtn.addEventListener('click', function () {
        if (phase !== 'sozel' || locked) return;
        showConfirm({
          title: 'Sınavı bitir?',
          hint: sozelFinishWarning(),
          text: 'Seviye belirleme sınavını tamamlamak istediğine emin misin? Onayladığında cevapların kaydedilecek ve deneme sonucun gösterilecek.',
          okLabel: 'Evet, bitir',
          cancelLabel: 'Vazgeç',
          onOk: function () { finishSozel(); },
          onCancel: showSozelStayReminder
        });
      });
    }

    if (skipBreakCheckbox) {
      skipBreakCheckbox.addEventListener('change', updateBreakUI);
    }

    if (transitionBtn) {
      transitionBtn.addEventListener('click', function () {
        if (!canStartSozel()) return;
        goToSozel();
      });
    }

    if (tryShowCompletedPlacementModal()) return;

    if (phase === 'sayisal' && state.sayisalEndAt) {
      var sayisalLeft = Math.floor((new Date(state.sayisalEndAt).getTime() - Date.now()) / 1000);
      if (sayisalLeft <= 0 && lsGet('placementSayisalDone') !== '1') {
        showTransition('timeup');
      }
    }

    if (phase === 'break') {
      resumeBreakIfNeeded();
    } else {
      state.activeSubject = activeSubject();
      updatePhaseUI();
      render({ reframe: true });
      if (phase === 'sayisal') startSayisalTimer();
    }
  }

  global.BilenyumPlacementExam = {
    SAYISAL_SEC: SAYISAL_SEC,
    BREAK_SEC: BREAK_SEC,
    PHASES: PHASES,
    SUBJECT_LABELS: SUBJECT_LABELS,
    init: init
  };
})(typeof window !== 'undefined' ? window : this);
