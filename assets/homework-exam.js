/* ---------------------------------------------------------------------------
 * Bilenyum homework-exam.js — Ödev çözüm ekranı (tahta + sorular)
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

  function optLabel(opt) {
    return typeof opt === 'object' && opt && opt.label ? opt.label : String(opt);
  }
  function optHasVisual(opt) {
    return typeof opt === 'object' && opt && (opt.svg || opt.src);
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
      '<defs><linearGradient id="hwQGrad" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="rgba(168,164,240,0.14)"/>' +
        '<stop offset="100%" stop-color="rgba(74,214,255,0.10)"/>' +
      '</linearGradient></defs>' +
      '<rect width="820" height="' + height + '" rx="18" fill="url(#hwQGrad)" stroke="rgba(26,21,56,0.12)" stroke-width="2"/>' +
      '<text fill="#1a1538" font-size="24" font-weight="800" font-family="Plus Jakarta Sans, Arial, sans-serif">' + lines + '</text>' +
    '</svg>';
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyUnderline(text, words) {
    var out = escapeHtml(text);
    if (!words || !words.length) return out;
    words.forEach(function (word) {
      out = out.replace(escapeHtml(word), '<u>' + escapeHtml(word) + '</u>');
    });
    return out;
  }

  function renderSheetHead(root, set, q, qi, total) {
    var head = root.querySelector('#hwSheetHeadInner');
    if (!head) return;

    var qIndex = (qi != null ? qi : 0) + 1;
    var unit = (q && q.unit) || set.unit || set.title;
    var unitSubtitle = (q && q.unitSubtitle) || set.unitSubtitle || set.topic;

    head.innerHTML =
      '<div class="asm-hw-sheet-head-row">' +
        '<div class="asm-hw-sheet-qbox" aria-label="Soru ' + qIndex + ' / ' + total + '">' +
          '<span class="asm-hw-sheet-qbox-num">' + qIndex + '</span>' +
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

  function renderSheetBlocks(root, q, qi) {
    var body = root.querySelector('#hwSheetBody');
    var questionSheet = root.querySelector('#hwQuestionSheet');
    if (!body) return;

    var optionsRow = root.querySelector('.asm-hw-options-row');
    var confirm = root.querySelector('#hwConfirmAnswer');
    var drawRegion = root.querySelector('#hwDrawRegion');
    if (drawRegion) {
      if (optionsRow && optionsRow.parentNode === body) {
        drawRegion.insertBefore(optionsRow, body.nextSibling);
      }
      if (confirm && confirm.parentNode === body) {
        var after = optionsRow && optionsRow.parentNode === drawRegion ? optionsRow : body;
        drawRegion.insertBefore(confirm, after.nextSibling);
      }
    }

    var isVisual = q.type === 'visual' && (q.blocks || q.visual);
    if (questionSheet) {
      questionSheet.classList.toggle('is-visual', isVisual);
      questionSheet.classList.toggle('is-text-only', !isVisual);
    }

    if (q.blocks && q.blocks.length) {
      body.innerHTML = q.blocks.map(function (block) {
        if (block.kind === 'lead') {
          return '<p class="asm-hw-block asm-hw-block-lead">' +
            '<span class="asm-hw-block-num">' + (qi + 1) + '.</span> ' +
            escapeHtml(block.text) + '</p>';
        }
        if (block.kind === 'text') {
          return '<p class="asm-hw-block asm-hw-block-text">' + escapeHtml(block.text) + '</p>';
        }
        if (block.kind === 'prompt') {
          return '<p class="asm-hw-block asm-hw-block-prompt"><strong>' +
            applyUnderline(block.text, block.underline) + '</strong></p>';
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
    var hasSrc = isVisual && q.visual && q.visual.src;
    var parts = [];

    if (isVisual && q.q) {
      parts.push('<p class="asm-hw-block asm-hw-block-lead"><span class="asm-hw-block-num">' + (qi + 1) + '.</span> ' + escapeHtml(q.q) + '</p>');
    }

    if (hasSvg || hasSrc) {
      var fig = hasSrc
        ? '<img src="' + q.visual.src + '" alt="' + escapeHtml(q.visual.alt || '') + '" loading="lazy" />'
        : q.visual.svg;
      parts.push('<div class="asm-hw-block asm-hw-block-figure" role="img">' + fig + '</div>');
    } else if (!isVisual) {
      parts.push('<div class="asm-hw-block asm-hw-block-figure is-svg">' + makeTextQuestionSvg(q) + '</div>');
    }

    if (isVisual && q.visual && q.visual.caption) {
      parts.push('<p class="asm-hw-block asm-hw-block-caption">' + escapeHtml(q.visual.caption) + '</p>');
    }

    body.innerHTML = parts.join('');
  }

  function formatHomeworkSubtitle(set) {
    if (!set) return '';
    var sub = set.unitSubtitle || set.unit || '';
    var total = (set.questions || []).length;
    if (sub && total) return sub + ' · ' + total + ' Soru';
    if (sub) return sub;
    if (total) return total + ' Soru';
    return set.topic || '';
  }

  function mountQuestionChrome(root) {
    var body = root.querySelector('#hwSheetBody');
    var optionsRow = root.querySelector('.asm-hw-options-row');
    var confirm = root.querySelector('#hwConfirmAnswer');
    if (!body || !optionsRow) return;

    var anchor = body.querySelector('.asm-hw-block-prompt:last-of-type');
    if (!anchor) {
      anchor = body.querySelector('.asm-hw-block-text:last-of-type, .asm-hw-block-lead:last-of-type, .asm-hw-block-figure:last-of-type');
    }
    if (!anchor) anchor = body.lastElementChild;

    if (anchor) {
      anchor.insertAdjacentElement('afterend', optionsRow);
    } else {
      body.appendChild(optionsRow);
    }
    if (confirm) {
      optionsRow.insertAdjacentElement('afterend', confirm);
    }
  }

  function init(root) {
    if (!root) return;

    var params = new URLSearchParams(location.search);
    var hwId = params.get('exam') || params.get('hw') || 'mat-koklu';
    var isRetry = params.get('retry') === '1';
    var sets = global.BilenyumHomeworkSets || {};
    var set = sets[hwId];
    var isDeneme = !!(set && set.examType === 'deneme');

    var titleEl = root.querySelector('#hwTitle');
    var topicEl = root.querySelector('#hwTopic');
    var subjectEl = root.querySelector('#hwSubjectBadge');
    var typeBadgeEl = root.querySelector('#hwTypeBadge');
    var eduWeekEl = root.querySelector('#hwEduWeek');
    var eduWeekText = root.querySelector('#hwEduWeekText');
    var qNum = null;
    function optionsEl() { return root.querySelector('#hwSheetOptions'); }
    var paletteEl = root.querySelector('#asmQPalette');
    var progressFill = root.querySelector('.asm-exam-progress-fill');
    var progressBar = root.querySelector('#hwProgressBar');
    var progressCount = root.querySelector('#hwProgressCount');
    var currentNumEl = root.querySelector('#hwCurrentNum');
    var currentTotalEl = root.querySelector('#hwCurrentTotal');
    var questionNavEl = root.querySelector('#hwQuestionNav');
    var questionSheet = root.querySelector('#hwQuestionSheet');
    var prevBtn = root.querySelector('[data-asm-prev]');
    var nextBtn = root.querySelector('[data-asm-next]');
    var confirmAnswerEl = root.querySelector('#hwConfirmAnswer');
    var confirmAnswerBtn = root.querySelector('#hwConfirmAnswerBtn');
    var finishBtn = root.querySelector('#hwFinishBtn');
    var finishOverlay = root.querySelector('#hwFinishOverlay');
    var finishInner = root.querySelector('#hwFinishInner');
    var confirmEl = root.querySelector('#hwConfirm');
    var confirmHint = root.querySelector('#hwConfirmHint');
    var confirmText = root.querySelector('#hwConfirmText');
    var confirmOkBtn = root.querySelector('#hwConfirmOk');
    var confirmCancelBtn = root.querySelector('#hwConfirmCancel');
    var confirmCallback = null;
    var attemptWarnEl = root.querySelector('#hwAttemptWarn');
    var attemptWarnOk = root.querySelector('#hwAttemptWarnOk');
    var skipChoiceEl = root.querySelector('#hwSkipChoice');
    var skipLaterBtn = root.querySelector('#hwSkipLater');
    var skipVideoBtn = root.querySelector('#hwSkipVideo');
    var questionStatusEl = root.querySelector('#hwQuestionStatus');
    var questionStatusTitle = root.querySelector('#hwQuestionStatusTitle');
    var questionStatusText = root.querySelector('#hwQuestionStatusText');
    var questionStatusOk = root.querySelector('#hwQuestionStatusOk');
    var videoModalEl = root.querySelector('#hwVideoModal');
    var videoDoneBtn = root.querySelector('#hwVideoDone');
    var videoNoticeEl = root.querySelector('#hwVideoModalNotice');
    var videoMetaEl = root.querySelector('#hwVideoMeta');
    var videoPlayerRoot = root.querySelector('#hwVideoPlayerRoot');
    var videoPlayer = global.BilenyumHomeworkVideoPlayer
      ? global.BilenyumHomeworkVideoPlayer.mount(videoPlayerRoot)
      : null;
    var pendingVideoQi = null;
    var pendingNavIdx = null;
    var VIDEO_NOTICE_WRONG = 'Bu soruya iki kez yanlış cevap verdin. Bu sorunun video çözümünü izleyerek çözümünü öğrenmeni istiyoruz.';
    var VIDEO_NOTICE_SKIP = 'Soruyu çözemediysen bu videoyu izleyerek çözümünü öğrenebilirsin.';

    if (!set) {
      root.innerHTML =
        '<main class="asm-hw-empty">' +
          '<p>' + (params.get('exam') ? 'Deneme sınavı bulunamadı.' : 'Ödev bulunamadı.') + '</p>' +
          '<a href="' + (params.get('exam') ? 'sinavlar.html' : 'ogrenci-dashboard.html') + '" class="asm-btn asm-btn-primary">' +
            (params.get('exam') ? 'Deneme Sınavlarına Dön' : 'Dashboard\'a Dön') + '</a>' +
        '</main>';
      return;
    }

    if (isDeneme) {
      root.classList.add('is-trial-exam');
      document.title = (set.title || 'Deneme Sınavı') + ' · Bilenyum';
    }

    if (titleEl) titleEl.textContent = set.title || 'Ödev';
    if (topicEl) topicEl.textContent = formatHomeworkSubtitle(set);
    if (subjectEl) {
      subjectEl.textContent = set.subjectLabel;
      subjectEl.setAttribute('data-subject', set.subject);
    }
    if (typeBadgeEl) {
      if (isDeneme) {
        typeBadgeEl.textContent = 'LGS';
        typeBadgeEl.className = 'asm-hw-type-badge is-deneme';
        typeBadgeEl.setAttribute('data-type', 'deneme');
      } else {
        var hwType = set.homeworkType === 'rud' ? 'rud' : 'kid';
        typeBadgeEl.textContent = hwType === 'rud' ? 'RUD' : 'KİD';
        typeBadgeEl.className = 'asm-hw-type-badge is-' + hwType;
        typeBadgeEl.setAttribute('data-type', hwType);
      }
    }
    var weekLabel = formatEduWeek(set.eduWeek);
    if (eduWeekEl && eduWeekText) {
      if (weekLabel) {
        eduWeekText.textContent = weekLabel;
        eduWeekEl.hidden = false;
      } else {
        eduWeekEl.hidden = true;
      }
    }
    root.setAttribute('data-subject', set.subject);
    if (finishBtn && isDeneme) finishBtn.textContent = 'Sınavı Bitir';

    var board = global.BilenyumHomeworkBoard
      ? global.BilenyumHomeworkBoard.mount(root, { penColor: '#000000', penSize: 2 })
      : null;

    var questions = set.questions || [];
    var answers = [];
    var pendingSelection = [];
    var lastSelection = [];
    var wrongAttempts = [];
    var questionResolved = [];
    var videoWatched = [];
    var deferredLater = [];
    var revealedByVideo = [];
    var SHEET_GUIDE_DEFAULT = isDeneme
      ? 'Bir şık seç, ardından <strong>Cevabımı Onayla</strong> ile cevabını gönder. Deneme sınavında her soru için tek cevap hakkın vardır. Sorular paleti veya alttaki gezinme ile istediğin soruya geçebilirsin.'
      : 'Bir şık seç, ardından <strong>Cevabımı Onayla</strong> ile cevabını gönder. <strong>Önceki Soru</strong> ve sorular paleti ile istediğin soruya geçebilirsin; cevap vermeden ilerlemek için <strong>Sonraki Soru</strong> butonunu kullan.';
    var SHEET_GUIDE_REVEALED = 'Video çözümünü izledin; doğru cevap aşağıda yeşil ile gösteriliyor. Bu soruya artık şık işaretleyemezsin.';
    var idx = 0;
    var locked = false;
    var suppressStatusToastQi = null;

    questions.forEach(function () {
      answers.push(null);
      pendingSelection.push(null);
      lastSelection.push(null);
      wrongAttempts.push(0);
      questionResolved.push(false);
      videoWatched.push(false);
      deferredLater.push(false);
      revealedByVideo.push(false);
    });

    function restoreBoolArray(target, source) {
      if (!Array.isArray(source)) return;
      for (var i = 0; i < questions.length && i < source.length; i++) {
        target[i] = !!source[i];
      }
    }

    function restoreNullableArray(target, source) {
      if (!Array.isArray(source)) return;
      for (var i = 0; i < questions.length && i < source.length; i++) {
        target[i] = source[i] != null ? source[i] : null;
      }
    }

    function restoreHomeworkSession(session) {
      if (!session) return;
      restoreNullableArray(answers, session.answers);
      restoreNullableArray(pendingSelection, session.pendingSelection);
      restoreNullableArray(lastSelection, session.lastSelection);
      restoreNullableArray(wrongAttempts, session.wrongAttempts);
      restoreBoolArray(questionResolved, session.questionResolved);
      restoreBoolArray(videoWatched, session.videoWatched);
      restoreBoolArray(deferredLater, session.deferredLater);
      restoreBoolArray(revealedByVideo, session.revealedByVideo);
      if (typeof session.idx === 'number' && session.idx >= 0 && session.idx < questions.length) {
        idx = session.idx;
      }
    }

    function buildHomeworkSessionSnapshot() {
      return {
        answers: answers.slice(),
        pendingSelection: pendingSelection.slice(),
        lastSelection: lastSelection.slice(),
        wrongAttempts: wrongAttempts.slice(),
        questionResolved: questionResolved.slice(),
        videoWatched: videoWatched.slice(),
        deferredLater: deferredLater.slice(),
        revealedByVideo: revealedByVideo.slice(),
        idx: idx
      };
    }

    if (global.BilenyumHomeworkResults && global.BilenyumHomeworkResults.loadHomeworkSession) {
      restoreHomeworkSession(global.BilenyumHomeworkResults.loadHomeworkSession(hwId));
    }

    if (isRetry) {
      var retryBanner = document.createElement('p');
      retryBanner.className = 'asm-hw-retry-banner';
      retryBanner.textContent = 'Tekrar çözüm modundasın. Bu denemenin sonucu başarı puanına etki etmez.';
      var titleHost = titleEl && titleEl.parentElement;
      if (titleHost) titleHost.insertAdjacentElement('afterend', retryBanner);
    }

    function isQuestionLocked(qi) {
      return questionResolved[qi] || revealedByVideo[qi];
    }

    function lockQuestionViaVideo(qi) {
      revealedByVideo[qi] = true;
      questionResolved[qi] = true;
      pendingSelection[qi] = null;
      deferredLater[qi] = false;
    }

    function isModalOpen() {
      if (confirmEl && !confirmEl.hidden) return true;
      if (attemptWarnEl && !attemptWarnEl.hidden) return true;
      if (skipChoiceEl && !skipChoiceEl.hidden) return true;
      if (videoModalEl && !videoModalEl.hidden) return true;
      if (questionStatusEl && !questionStatusEl.hidden) return true;
      return false;
    }

    function optionLetter(optIndex) {
      if (optIndex == null || optIndex < 0) return '';
      return String.fromCharCode(65 + optIndex);
    }

    function getQuestionStatusInfo(qi) {
      if (!questionResolved[qi] && !revealedByVideo[qi]) return null;
      var q = questions[qi];
      if (revealedByVideo[qi]) {
        return {
          type: 'video-blank',
          title: 'Tebrikler!',
          text: 'Bu soruyu boş bırakmıştın; video çözümünü izleyerek doğru cevabı öğrendin. Artık nasıl yapıldığını biliyorsun — harika bir adım!'
        };
      }
      if (answers[qi] != null) {
        var letter = optionLetter(answers[qi]);
        var isCorrect = answers[qi] === q.correct;
        if (isCorrect) {
          return {
            type: 'correct',
            title: 'Tebrikler!',
            text: 'Bu sorunun cevabını ' + letter + ' şıkkı olarak işaretledin ve doğru yaptın. Aynı tempoyla devam et!'
          };
        }
        if (videoWatched[qi]) {
          return {
            type: 'wrong-video',
            title: 'Öğrenmeye devam!',
            text: 'Bu sorunun cevabını ' + letter + ' şıkkı olarak işaretlemiştin. Video çözümünü izleyerek doğru cevabı öğrendin — bir sonraki soruda daha güçlü olacaksın!'
          };
        }
        return {
          type: 'wrong',
          title: 'Tekrar dene!',
          text: 'Bu sorunun cevabını ' + letter + ' şıkkı olarak işaretlemiştin. Doğru cevabı bulmak için bir kez daha deneyebilirsin.'
        };
      }
      if (videoWatched[qi]) {
        return {
          type: 'video',
          title: 'Tebrikler!',
          text: 'Bu sorunun video çözümünü izleyerek doğru cevabı öğrendin. Öğrenmeye devam et!'
        };
      }
      return null;
    }

    function closeQuestionStatusToast() {
      if (!questionStatusEl) return;
      questionStatusEl.hidden = true;
      questionStatusEl.setAttribute('aria-hidden', 'true');
    }

    function showQuestionStatusToast(info) {
      if (!questionStatusEl || !info) return;
      if (questionStatusTitle) questionStatusTitle.textContent = info.title || 'Soru durumu';
      if (questionStatusText) questionStatusText.textContent = info.text || '';
      questionStatusEl.className = 'asm-hw-q-status asm-hw-q-status--' + (info.type || 'default');
      questionStatusEl.hidden = false;
      questionStatusEl.setAttribute('aria-hidden', 'false');
      if (questionStatusOk) questionStatusOk.focus();
    }

    function maybeShowQuestionStatusToast(qi) {
      if (suppressStatusToastQi === qi) return;
      if (isModalOpen()) return;
      var info = getQuestionStatusInfo(qi);
      if (info) showQuestionStatusToast(info);
      else closeQuestionStatusToast();
    }

    function updateCurrentNav() {
      var total = questions.length;
      if (currentNumEl) currentNumEl.textContent = String(idx + 1);
      if (currentTotalEl) currentTotalEl.textContent = '/ ' + total;
      if (questionNavEl) {
        questionNavEl.setAttribute('aria-label', 'Soru navigasyonu, soru ' + (idx + 1) + ' / ' + total);
      }
    }

    function updateProgress() {
      var done = questionResolved.filter(function (ok) { return ok; }).length;
      var total = questions.length;
      var pct = total ? Math.round(done / total * 100) : 0;
      if (progressFill) {
        progressFill.style.width = pct + '%';
      }
      if (progressCount) {
        progressCount.textContent = done + ' / ' + total;
      }
      if (progressBar) {
        progressBar.setAttribute('aria-valuenow', String(pct));
        progressBar.setAttribute('aria-valuetext', done + ' soru tamamlandı, ' + total + ' sorudan');
      }
      updateCurrentNav();
    }

    function optionClass(q, qi, i) {
      if (revealedByVideo[qi]) {
        return i === q.correct ? ' is-selected is-revealed' : ' is-locked';
      }
      if (questionResolved[qi]) {
        if (answers[qi] !== i) return '';
        return i === q.correct ? ' is-selected' : ' is-selected is-wrong';
      }
      if (pendingSelection[qi] === i) return ' is-pending';
      if (lastSelection[qi] === i && wrongAttempts[qi] > 0) return ' is-wrong';
      return '';
    }

    function renderSheetGuide(qi) {
      var guide = root.querySelector('.asm-hw-sheet-guide');
      if (!guide) return;
      guide.innerHTML = revealedByVideo[qi] ? SHEET_GUIDE_REVEALED : SHEET_GUIDE_DEFAULT;
      guide.classList.toggle('is-revealed', !!revealedByVideo[qi]);
    }

    function blockCurrentQuestion(targetIdx) {
      if (isDeneme) return false;
      if (questionResolved[idx]) return false;
      var navTarget = targetIdx != null ? targetIdx : idx + 1;
      if (wrongAttempts[idx] >= 2 && !videoWatched[idx]) {
        pendingNavIdx = navTarget;
        showVideoModal(idx, 'wrong');
        return true;
      }
      if (wrongAttempts[idx] >= 1) {
        showAttemptWarn();
        return true;
      }
      showSkipChoiceModal(navTarget);
      return true;
    }

    function showSkipChoiceModal(targetIdx) {
      if (!skipChoiceEl) return;
      pendingNavIdx = targetIdx;
      skipChoiceEl.hidden = false;
      skipChoiceEl.setAttribute('aria-hidden', 'false');
      if (skipLaterBtn) skipLaterBtn.focus();
    }

    function closeSkipChoiceModal() {
      if (!skipChoiceEl) return;
      skipChoiceEl.hidden = true;
      skipChoiceEl.setAttribute('aria-hidden', 'true');
      pendingNavIdx = null;
    }

    function deferQuestionLater() {
      deferredLater[idx] = true;
      pendingSelection[idx] = null;
      renderConfirmBar(idx);
      var target = pendingNavIdx != null ? pendingNavIdx : idx + 1;
      pendingNavIdx = null;
      if (skipChoiceEl) {
        skipChoiceEl.hidden = true;
        skipChoiceEl.setAttribute('aria-hidden', 'true');
      }
      if (target !== idx && target >= 0 && target < questions.length) {
        goToQuestion(target, { force: true });
      }
      renderPalette();
    }

    function watchVideoFromSkip() {
      var qi = idx;
      var target = pendingNavIdx;
      pendingNavIdx = target;
      lockQuestionViaVideo(qi);
      if (skipChoiceEl) {
        skipChoiceEl.hidden = true;
        skipChoiceEl.setAttribute('aria-hidden', 'true');
      }
      renderPalette();
      updateProgress();
      suppressStatusToastQi = qi;
      if (qi === idx) {
        renderOptions(questions[idx], idx);
        renderConfirmBar(idx);
        renderSheetGuide(idx);
      }
      showVideoModal(qi, 'skip');
    }

    function showAttemptWarn() {
      if (!attemptWarnEl) return;
      attemptWarnEl.hidden = false;
      attemptWarnEl.setAttribute('aria-hidden', 'false');
      if (attemptWarnOk) attemptWarnOk.focus();
    }

    function closeAttemptWarn() {
      if (!attemptWarnEl) return;
      attemptWarnEl.hidden = true;
      attemptWarnEl.setAttribute('aria-hidden', 'true');
    }

    function resetVideoPlayer() {
      if (videoPlayer) videoPlayer.pause();
    }

    function homeworkGradeLabel() {
      var grade = set.gradeLevel;
      if (!grade && global.BilenyumExamStudentBar && global.BilenyumExamStudentBar.getProfile) {
        grade = global.BilenyumExamStudentBar.getProfile().grade;
      }
      if (!grade) grade = '8';
      return grade + '. Sınıf';
    }

    function renderVideoMeta(qi) {
      if (!videoMetaEl) return;
      var q = questions[qi];
      var unit = (q && q.unit) || set.unit || set.title;
      var unitSubtitle = (q && q.unitSubtitle) || set.unitSubtitle || set.topic;
      var week = formatEduWeek(set.eduWeek);
      var rows = [
        ['Ders Adı', set.subjectLabel || set.title],
        ['Ünite Adı', unit],
        ['Ünite Alt Başlığı', unitSubtitle],
        ['Sınıf Seviyesi', homeworkGradeLabel()],
        ['Ödev Haftası', week || '—']
      ];
      videoMetaEl.innerHTML = rows.map(function (row) {
        return (
          '<div class="asm-hw-video-meta-row">' +
            '<span class="asm-hw-video-meta-label">' + escapeHtml(row[0]) + '</span>' +
            '<span class="asm-hw-video-meta-val">' + escapeHtml(row[1]) + '</span>' +
          '</div>'
        );
      }).join('');
    }

    function showVideoModal(qi, reason) {
      pendingVideoQi = qi;
      var q = questions[qi];
      resetVideoPlayer();
      renderVideoMeta(qi);
      if (videoNoticeEl) {
        videoNoticeEl.textContent = reason === 'skip' ? VIDEO_NOTICE_SKIP : VIDEO_NOTICE_WRONG;
      }
      if (videoPlayer) {
        var src = q.videoUrl || set.videoUrl || global.BilenyumHomeworkVideoPlayer.DEFAULT_SRC;
        videoPlayer.load(src, q.videoPoster || null);
      }
      if (videoModalEl) {
        videoModalEl.hidden = false;
        videoModalEl.setAttribute('aria-hidden', 'false');
        var videoStage = root.querySelector('#hwVideoStage');
        if (videoStage) videoStage.focus();
        else if (videoDoneBtn) videoDoneBtn.focus();
      }
    }

    function closeVideoModal() {
      resetVideoPlayer();
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(function () {});
      }
      if (videoModalEl) {
        videoModalEl.hidden = true;
        videoModalEl.setAttribute('aria-hidden', 'true');
      }
      pendingVideoQi = null;
    }

    function completeVideoWatch() {
      var qi = pendingVideoQi;
      if (qi == null) return;
      if (wrongAttempts[qi] === 0 && lastSelection[qi] == null && answers[qi] == null) {
        lockQuestionViaVideo(qi);
      }
      videoWatched[qi] = true;
      questionResolved[qi] = true;
      pendingSelection[qi] = null;
      if (answers[qi] == null && lastSelection[qi] != null) answers[qi] = lastSelection[qi];
      var wasIdx = qi;
      var target = pendingNavIdx;
      pendingNavIdx = null;
      suppressStatusToastQi = wasIdx;
      closeVideoModal();
      renderPalette();
      updateProgress();
      if (wasIdx === idx) {
        renderOptions(questions[idx], idx);
        renderConfirmBar(idx);
        renderSheetGuide(idx);
      }
      if (target != null && target !== wasIdx && target >= 0 && target < questions.length) {
        goToQuestion(target, { force: true });
      } else if (wasIdx < questions.length - 1) {
        goToQuestion(wasIdx + 1, { force: true });
      }
    }

    function handleOptionSelect(optIndex) {
      if (locked || isQuestionLocked(idx)) return;
      deferredLater[idx] = false;
      pendingSelection[idx] = optIndex;
      renderOptions(questions[idx], idx);
      renderConfirmBar(idx);
    }

    function renderConfirmBar(qi) {
      if (!confirmAnswerEl) return;
      var show = !isQuestionLocked(qi) && pendingSelection[qi] != null;
      confirmAnswerEl.hidden = !show;
      confirmAnswerEl.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (board && board.syncLayout) {
        requestAnimationFrame(function () { board.syncLayout(); });
      }
    }

    function confirmAnswer() {
      if (locked || isQuestionLocked(idx)) return;
      var optIndex = pendingSelection[idx];
      if (optIndex == null) return;
      var q = questions[idx];
      pendingSelection[idx] = null;
      renderConfirmBar(idx);

      if (isDeneme) {
        answers[idx] = optIndex;
        lastSelection[idx] = optIndex;
        questionResolved[idx] = true;
        renderOptions(q, idx);
        renderPalette();
        updateProgress();
        if (idx < questions.length - 1) goToQuestion(idx + 1, { force: true });
        return;
      }

      if (optIndex === q.correct) {
        answers[idx] = optIndex;
        lastSelection[idx] = optIndex;
        questionResolved[idx] = true;
        suppressStatusToastQi = idx;
        renderOptions(q, idx);
        renderPalette();
        updateProgress();
        if (idx < questions.length - 1) goToQuestion(idx + 1, { force: true });
        return;
      }

      if (wrongAttempts[idx] < 2) wrongAttempts[idx]++;
      lastSelection[idx] = optIndex;
      renderOptions(q, idx);

      if (wrongAttempts[idx] === 1) {
        showAttemptWarn();
        return;
      }
      if (wrongAttempts[idx] >= 2 && !videoWatched[idx]) {
        suppressStatusToastQi = idx;
        pendingNavIdx = idx < questions.length - 1 ? idx + 1 : null;
        showVideoModal(idx, 'wrong');
      }
    }

    function renderVisual(q, qi, reframeView) {
      renderSheetHead(root, set, q, qi != null ? qi : idx, questions.length);
      renderSheetBlocks(root, q, qi != null ? qi : idx);
      mountQuestionChrome(root);

      if (board) {
        requestAnimationFrame(function () {
          if (board.syncLayout) board.syncLayout();
          if (reframeView && board.focusSheet) board.focusSheet();
        });
      }
    }

    function renderOptions(q, qi) {
      var optsRoot = optionsEl();
      if (!optsRoot) return;
      var hasVisualOpts = q.opts.some(optHasVisual);
      optsRoot.classList.toggle('asm-options--visual', hasVisualOpts);
      optsRoot.classList.toggle('asm-hw-sheet-options--visual', hasVisualOpts);
      optsRoot.classList.toggle('asm-hw-sheet-options--locked', isQuestionLocked(qi));
      optsRoot.innerHTML = q.opts.map(function (opt, i) {
        var selCls = optionClass(q, qi, i);
        var disabled = isQuestionLocked(qi) ? ' disabled' : '';
        var letter = String.fromCharCode(65 + i);
        var label = optLabel(opt);
        if (optHasVisual(opt)) {
          var media = opt.src
            ? '<img class="asm-option-visual-img" src="' + opt.src + '" alt="' + (opt.alt || label) + '" />'
            : '<div class="asm-option-visual-svg">' + opt.svg + '</div>';
          return '<button type="button" class="asm-option asm-option--visual' + selCls + '"' + disabled + ' data-opt="' + i + '">' +
            '<span class="asm-option-letter">' + letter + '</span>' +
            '<span class="asm-option-visual-body">' + media + '<span class="asm-option-visual-label">' + label + '</span></span></button>';
        }
        return '<button type="button" class="asm-option' + selCls + '"' + disabled + ' data-opt="' + i + '">' +
          '<span class="asm-option-letter">' + letter + '</span>' + label + '</button>';
      }).join('');
    }

    function renderPalette() {
      if (!paletteEl) return;
      paletteEl.innerHTML = questions.map(function (_, i) {
        var cls = 'asm-q-pill';
        if (i === idx) cls += ' is-current';
        if (questionResolved[i]) cls += ' is-answered';
        else if (deferredLater[i]) cls += ' is-deferred';
        else if (pendingSelection[i] != null || wrongAttempts[i] > 0) cls += ' is-draft';
        return '<button type="button" class="' + cls + '" id="hw-q-pill-' + i + '" data-qidx="' + i + '"' +
          (i === idx ? ' aria-current="true"' : '') +
          ' aria-label="Soru ' + (i + 1) + (i === idx ? ', şu an bu sorudasın' : '') + '">' + (i + 1) + '</button>';
      }).join('');
      var currentPill = paletteEl.querySelector('.asm-q-pill.is-current');
      if (currentPill && typeof currentPill.scrollIntoView === 'function') {
        currentPill.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }

    function goToQuestion(nextIdx, opts) {
      if (locked || nextIdx < 0 || nextIdx >= questions.length || nextIdx === idx) return;
      var skipBlock = opts && opts.force;
      if (!skipBlock && opts && opts.viaPalette && deferredLater[nextIdx]) skipBlock = true;
      if (!skipBlock && blockCurrentQuestion(nextIdx)) return;
      var prev = idx;
      idx = nextIdx;
      if (board) board.setQuestionIndex(idx, prev);
      render(true);
    }

    function render(reframeView) {
      if (locked || !questions.length) return;
      var q = questions[idx];
      updateProgress();
      var isVisualQ = q.type === 'visual' && (q.blocks || q.visual);
      root.classList.toggle('is-visual-question', !!isVisualQ);
      renderVisual(q, idx, !!reframeView);
      renderOptions(q, idx);
      renderConfirmBar(idx);
      renderSheetGuide(idx);
      renderPalette();
      if (prevBtn) {
        prevBtn.disabled = idx <= 0;
        prevBtn.classList.toggle('is-disabled', idx <= 0);
      }
      if (nextBtn) {
        nextBtn.disabled = idx >= questions.length - 1;
        nextBtn.classList.toggle('is-disabled', idx >= questions.length - 1);
      }
      maybeShowQuestionStatusToast(idx);
      suppressStatusToastQi = null;
    }

    function goPrev() {
      if (locked || idx <= 0) return;
      goToQuestion(idx - 1, { viaPalette: true });
    }

    function goNext() {
      if (locked || idx >= questions.length - 1) return;
      goToQuestion(idx + 1);
    }

    function scoreResult() {
      var correct = 0;
      var wrong = 0;
      questions.forEach(function (q, i) {
        if (answers[i] == null) return;
        if (answers[i] === q.correct) correct++;
        else wrong++;
      });
      return {
        correct: correct,
        wrong: wrong,
        total: questions.length
      };
    }

    function goToResults(mode) {
      if (locked) return;
      locked = true;

      if (isDeneme) {
        var denemeScore = scoreResult();
        var blank = denemeScore.total - denemeScore.correct - denemeScore.wrong;
        var net = Math.max(0, denemeScore.correct - denemeScore.wrong / 3);
        lsSet('trialExam.' + hwId, JSON.stringify({
          examId: hwId,
          name: set.title,
          type: 'genel',
          correct: denemeScore.correct,
          wrong: denemeScore.wrong,
          blank: blank,
          total: denemeScore.total,
          net: Math.round(net * 100) / 100,
          completedAt: new Date().toISOString(),
          mode: mode
        }));
        location.href = 'sinavlar.html?deneme=done&exam=' + encodeURIComponent(hwId);
        return;
      }

      var Results = global.BilenyumHomeworkResults;
      if (!Results) {
        location.href = 'ogrenci-dashboard.html';
        return;
      }
      var sessionSnapshot = buildHomeworkSessionSnapshot();
      var payload = Results.buildFromSession(set, hwId, questions, answers, isRetry ? 'retry' : mode, {
        videoWatched: videoWatched,
        isRetry: isRetry
      });
      if (isRetry) {
        payload.isRetry = true;
        payload.earnedXp = 0;
        Results.saveRetryResult(payload);
        if (payload.isComplete || !payload.canContinueHomework) {
          Results.clearHomeworkSession(hwId);
        } else {
          Results.saveHomeworkSession(hwId, sessionSnapshot);
        }
        location.href = 'odev-sonuc.html?hw=' + encodeURIComponent(hwId) + '&retry=1';
        return;
      }
      Results.saveHomeworkSession(hwId, sessionSnapshot);
      Results.saveResult(payload);
      if (payload.isComplete || !payload.canContinueHomework) {
        Results.clearHomeworkSession(hwId);
      }
      if (payload.isComplete) {
        var pct = payload.total ? Math.round((payload.correct / payload.total) * 100) : 0;
        lsSet('homeworkDone.' + hwId, JSON.stringify({
          hwId: hwId,
          correct: payload.correct,
          wrong: payload.wrong,
          total: payload.total,
          pct: pct,
          earnedXp: payload.earnedXp,
          eduWeek: set.eduWeek || null,
          completedAt: payload.completedAt
        }));
      }
      location.href = 'odev-sonuc.html?hw=' + encodeURIComponent(hwId);
    }

    function finishHomework() {
      goToResults('finish');
    }

    function leaveHomework() {
      goToResults('leave');
    }

    function countUnanswered() {
      return questionResolved.reduce(function (acc, ok) {
        return acc + (ok ? 0 : 1);
      }, 0);
    }

    function firstUnansweredIndex() {
      for (var i = 0; i < questionResolved.length; i++) {
        if (!questionResolved[i]) return i;
      }
      return -1;
    }

    function closeConfirm() {
      if (!confirmEl) return;
      confirmEl.hidden = true;
      confirmEl.setAttribute('aria-hidden', 'true');
      confirmCallback = null;
      if (confirmHint) {
        confirmHint.textContent = '';
        confirmHint.hidden = true;
      }
    }

    function showConfirm(unanswered, mode) {
      if (!confirmEl) {
        if (mode === 'leave') leaveHomework();
        else finishHomework();
        return;
      }
      confirmCallback = mode === 'leave' ? leaveHomework : finishHomework;
      if (confirmHint) {
        confirmHint.textContent = unanswered + ' cevaplanmamış sorun var.';
        confirmHint.hidden = false;
      }
      if (confirmText) {
        confirmText.textContent = mode === 'leave'
          ? (isDeneme
            ? 'Henüz tüm soruları yanıtlamadın. Yine de deneme sınavları sayfasına dönmek istiyor musun?'
            : 'Henüz tüm soruları yanıtlamadın. Yine de dashboard\'a dönmek istiyor musun?')
          : (isDeneme
            ? 'Henüz tüm soruları yanıtlamadın. Yine de sınavı teslim etmek istiyor musun?'
            : 'Henüz tüm soruları yanıtlamadın. Yine de ödevi teslim etmek istiyor musun?');
      }
      if (confirmOkBtn) {
        confirmOkBtn.textContent = mode === 'leave' ? 'Yine de Çık' : 'Yine de Bitir';
      }
      confirmEl.hidden = false;
      confirmEl.setAttribute('aria-hidden', 'false');
      if (confirmOkBtn) confirmOkBtn.focus();
    }

    function requestFinishHomework() {
      if (locked) return;
      var unanswered = countUnanswered();
      if (unanswered > 0) {
        showConfirm(unanswered, 'finish');
        return;
      }
      finishHomework();
    }

    function requestLeaveHomework() {
      if (locked) return;
      var unanswered = countUnanswered();
      if (unanswered > 0) {
        showConfirm(unanswered, 'leave');
        return;
      }
      leaveHomework();
    }

    root.addEventListener('click', function (e) {
      if (locked) return;
      var btn = e.target.closest('#hwSheetOptions [data-opt]');
      if (!btn || btn.disabled) return;
      handleOptionSelect(parseInt(btn.getAttribute('data-opt'), 10));
    });

    if (paletteEl) {
      paletteEl.addEventListener('click', function (e) {
        if (locked) return;
        var pill = e.target.closest('[data-qidx]');
        if (!pill) return;
        goToQuestion(parseInt(pill.getAttribute('data-qidx'), 10), { viaPalette: true });
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (confirmAnswerBtn) confirmAnswerBtn.addEventListener('click', confirmAnswer);
    if (finishBtn) finishBtn.addEventListener('click', requestFinishHomework);

    if (skipLaterBtn) skipLaterBtn.addEventListener('click', deferQuestionLater);
    if (skipVideoBtn) skipVideoBtn.addEventListener('click', watchVideoFromSkip);
    if (skipChoiceEl) {
      skipChoiceEl.querySelectorAll('[data-hw-skip-cancel]').forEach(function (el) {
        el.addEventListener('click', closeSkipChoiceModal);
      });
    }
    if (questionStatusOk) questionStatusOk.addEventListener('click', closeQuestionStatusToast);
    if (questionStatusEl) {
      questionStatusEl.querySelectorAll('[data-hw-q-status-close]').forEach(function (el) {
        el.addEventListener('click', closeQuestionStatusToast);
      });
    }

    if (attemptWarnOk) {
      attemptWarnOk.addEventListener('click', closeAttemptWarn);
    }
    if (videoDoneBtn) {
      videoDoneBtn.addEventListener('click', completeVideoWatch);
    }

    if (confirmEl) {
      confirmEl.querySelectorAll('[data-hw-confirm-cancel]').forEach(function (el) {
        el.addEventListener('click', function () {
          closeConfirm();
          var jump = firstUnansweredIndex();
          if (jump >= 0) goToQuestion(jump, { force: true });
        });
      });
      if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', function () {
          var cb = confirmCallback;
          closeConfirm();
          if (cb) cb();
        });
      }
    }

    root.addEventListener('keydown', function (e) {
      if (locked) return;
      if (isModalOpen()) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    });

    function isQuestionContentTarget(node) {
      return node && node.closest && node.closest('.asm-hw-sheet, .asm-hw-board-viewport');
    }

    root.addEventListener('copy', function (e) {
      if (isQuestionContentTarget(e.target)) e.preventDefault();
    });
    root.addEventListener('cut', function (e) {
      if (isQuestionContentTarget(e.target)) e.preventDefault();
    });
    root.addEventListener('selectstart', function (e) {
      if (isQuestionContentTarget(e.target)) e.preventDefault();
    });
    root.addEventListener('contextmenu', function (e) {
      if (isQuestionContentTarget(e.target)) e.preventDefault();
    });

    if (global.BilenyumExamHeader) global.BilenyumExamHeader.mount(root);
    if (global.BilenyumExamStudentBar) {
      global.BilenyumExamStudentBar.mount(root, {
        showBack: true,
        backHref: isDeneme ? 'sinavlar.html' : 'ogrenci-dashboard.html',
        backLabel: isDeneme ? 'Deneme Sınavları' : "Dashboard'a Dön",
        hideSection: true,
        dueAt: isDeneme ? null : (set.dueAt || null)
      });
      var backLink = root.querySelector('[data-asm-student-back]');
      if (backLink) {
        backLink.addEventListener('click', function (e) {
          e.preventDefault();
          requestLeaveHomework();
        });
      }
    }

    if (board) board.setQuestionIndex(idx, null);
    render(true);
  }

  global.BilenyumHomeworkExam = { init: init, formatEduWeek: formatEduWeek };

  if (document.getElementById('asmHomeworkExam')) {
    init(document.getElementById('asmHomeworkExam'));
  }
})(typeof window !== 'undefined' ? window : this);
