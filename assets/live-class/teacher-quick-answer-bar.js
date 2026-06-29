(function (global) {
  'use strict';

  var pendingAction = null;
  var deps = {};

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function previewHtml(type, count) {
    if (type === 'open') {
      return (
        '<div class="lc-answer-preview">' +
          '<div class="lc-answer-preview-label">Öğrenci görünümü:</div>' +
          '<div class="lc-answer-preview-body">Ekrandaki sorunun cevabını yaz.</div>' +
        '</div>'
      );
    }
    if (type === 'tf') {
      return (
        '<div class="lc-answer-preview">' +
          '<div class="lc-answer-preview-label">Öğrenci görünümü:</div>' +
          '<div class="lc-answer-preview-opts"><span class="lc-answer-opt lc-answer-opt--preview">Doğru</span><span class="lc-answer-opt lc-answer-opt--preview">Yanlış</span></div>' +
        '</div>'
      );
    }
    var labels = [];
    for (var i = 0; i < (count || 4); i++) {
      labels.push('<span class="lc-answer-opt lc-answer-opt--preview">' + String.fromCharCode(65 + i) + '</span>');
    }
    return (
      '<div class="lc-answer-preview">' +
        '<div class="lc-answer-preview-label">Öğrenci görünümü:</div>' +
        '<div class="lc-answer-preview-hint">Ekrandaki soruya göre cevabını seç</div>' +
        '<div class="lc-answer-preview-opts">' + labels.join('') + '</div>' +
      '</div>'
    );
  }

  function openQuickModal(action) {
    pendingAction = action;
    var modal = $('tlcQuickSendModal');
    if (!modal) {
      sendQuick(action);
      return;
    }
    var title = $('tlcQuickSendTitle');
    var preview = $('tlcQuickSendPreview');
    var dur = $('tlcQuickSendDuration');
    var src = $('tlcQuickSendSource');
    var setCorrect = $('tlcQuickSendSetCorrect');

    var labels = {
      abcd: 'Ekrandaki soruya A/B/C/D cevabı iste',
      abcde: 'Ekrandaki soruya A/B/C/D/E cevabı iste',
      open: 'Ekrandaki soruya açık uçlu cevap iste',
      tf: 'Ekrandaki soruya Doğru/Yanlış cevabı iste'
    };
    if (title) title.textContent = labels[action.type] || 'Cevap isteği gönder';
    if (preview) preview.innerHTML = previewHtml(action.type, action.count);
    if (dur && action.duration != null) dur.value = String(action.duration);
    if (src) src.value = action.source || 'whiteboard';
    if (setCorrect) setCorrect.checked = false;

    modal.hidden = false;
  }

  function closeQuickModal() {
    pendingAction = null;
    var modal = $('tlcQuickSendModal');
    if (modal) modal.hidden = true;
  }

  function sendQuick(action) {
    action = action || pendingAction;
    if (!action || !deps.teacherSq) return;

    var duration = parseInt($('tlcQuickSendDuration') && $('tlcQuickSendDuration').value, 10) || action.duration || 45;
    var source = ($('tlcQuickSendSource') && $('tlcQuickSendSource').value) || action.source || 'whiteboard';
    var setCorrect = $('tlcQuickSendSetCorrect') && $('tlcQuickSendSetCorrect').checked;

    if (action.type === 'abcd') {
      deps.teacherSq.sendBlankChoice(4, source, { duration: duration, setCorrect: setCorrect });
    } else if (action.type === 'abcde') {
      deps.teacherSq.sendBlankChoice(5, source, { duration: duration, setCorrect: setCorrect });
    } else if (action.type === 'open') {
      deps.teacherSq.sendOpenEnded({ source: source, duration: duration });
    } else if (action.type === 'tf') {
      deps.teacherSq.sendTrueFalse(source, { duration: duration });
    } else if (action.type === 'manual') {
      if (deps.openAdvanced) deps.openAdvanced();
    }

    closeQuickModal();
  }

  function bind() {
    var bar = $('tlcQuickAnswerBar');
    if (!bar) return;

    bar.querySelectorAll('[data-quick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.dataset.quick;
        var action = {
          type: type,
          count: type === 'abcde' ? 5 : 4,
          duration: 45,
          source: 'whiteboard'
        };
        openQuickModal(action);
      });
    });

    var sendBtn = $('tlcQuickSendConfirm');
    if (sendBtn) sendBtn.addEventListener('click', function () { sendQuick(); });

    var cancelBtn = $('tlcQuickSendCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeQuickModal);

    var modal = $('tlcQuickSendModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.dataset.closeQuick) closeQuickModal();
      });
    }
  }

  global.TeacherQuickAnswerBar = {
    init: function (d) {
      deps = d || {};
      bind();
    },
    openQuickModal: openQuickModal,
    sendQuick: sendQuick,
    previewHtml: previewHtml
  };

})(typeof window !== 'undefined' ? window : this);
