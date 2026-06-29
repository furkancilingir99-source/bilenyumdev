(function (global) {
  'use strict';

  var deps = {};

  function $(id) { return document.getElementById(id); }

  function showBanner(message, type) {
    var el = $('lcStudentBanner');
    if (!el) return;
    el.hidden = false;
    el.className = 'lc-student-banner lc-student-banner--' + (type || 'info');
    el.textContent = message;
  }

  function hideBanner() {
    if ($('lcStudentBanner')) $('lcStudentBanner').hidden = true;
  }

  function showMicRequestModal() {
    var modal = $('lcMicRequestModal');
    if (!modal) return;
    modal.hidden = false;
  }

  function hideMicRequestModal() {
    if ($('lcMicRequestModal')) $('lcMicRequestModal').hidden = true;
  }

  function renderStatusBadges(state, perm, wb) {
    var el = $('lcStudentStatusBadges');
    if (!el) return;
    if (global.LiveClassUI) {
      var badges = global.LiveClassUI.buildStatusBadges({
        state: state,
        perm: perm,
        policy: { chatMode: state && state.chatMode },
        wbSelectedSelf: wb && wb.selectedStudentId === 'me'
      });
      el.innerHTML = global.LiveClassUI.renderStatusBadgesHtml(badges);
      return;
    }
    var badges = [];
    if (perm && perm.isMutedByTeacher) badges.push({ cls: 'is-warn', text: 'Mikrofon kapalı' });
    if (perm && perm.isMicRequestedByTeacher) badges.push({ cls: 'is-info', text: 'Mic açman istendi' });
    if (state && state.chatMode === 'muted') badges.push({ cls: 'is-warn', text: 'Chat kapalı' });
    if (state && state.chatMode === 'exam_mode') badges.push({ cls: 'is-focus', text: 'Quiz modu' });
    if (state && state.isFocusMode) badges.push({ cls: 'is-focus', text: 'Odak modu' });
    if (wb && wb.selectedStudentId === 'me') badges.push({ cls: 'is-wb', text: 'Tahtadasın' });
    else if (state && state.handRaised) badges.push({ cls: 'is-hand', text: 'El kaldırdın' });
    if (state && state.connectionQuality === 'poor') badges.push({ cls: 'is-warn', text: 'Bağlantı zayıf' });
    el.innerHTML = badges.map(function (b) { return '<span class="lc-st-badge ' + b.cls + '">' + b.text + '</span>'; }).join('');
  }

  function renderWbBanner(wb, participants) {
    var el = $('lcWbStateBanner');
    if (!el) return;
    var other = participants && participants.find(function (p) { return p.isSelectedForWhiteboard || (wb && wb.selectedStudentId === p.id && p.id !== 'me'); });
    if (wb && wb.selectedStudentId === 'me') {
      el.hidden = false;
      el.textContent = 'Tahtadasın — yazdıkların herkes tarafından görülür.';
    } else if (wb && wb.permission === 'locked') {
      el.hidden = false;
      el.textContent = 'Whiteboard kilitlendi. Şu anda sadece izleyebilirsin.';
    } else if (other) {
      el.hidden = false;
      el.textContent = other.name + ' tahtada yazıyor.';
    } else if (deps.handRaised) {
      el.hidden = false;
      el.textContent = 'Parmak kaldırdın. Öğretmenin seni seçerse yazabileceksin.';
    } else {
      el.hidden = false;
      el.textContent = 'Sadece izliyorsun — yazmak için parmak kaldır.';
    }
  }

  function renderChatNotice(chatMode, chatEnabled) {
    var el = $('lcChatDisabledNotice');
    var input = $('lcChatInput');
    if (!el) return;
    if (!chatEnabled || chatMode === 'muted' || chatMode === 'exam_mode') {
      el.hidden = false;
      el.textContent = chatMode === 'exam_mode'
        ? 'Quiz sırasında chat kapalı. Cevabını quiz panelinden gönderebilirsin.'
        : 'Öğretmen şu anda chat\'i kapattı.';
      if (input) { input.disabled = true; input.placeholder = 'Chat şu anda kapalı'; }
    } else if (chatMode === 'questions_only') {
      el.hidden = false;
      el.textContent = 'Şu anda yalnızca öğretmene soru gönderebilirsin.';
      if (input) input.placeholder = 'Öğretmene soru yaz...';
    } else {
      el.hidden = true;
      if (input) { input.disabled = false; input.placeholder = 'Mesaj yaz...'; }
    }
  }

  function renderConnectionWarning(quality) {
    var el = $('lcConnectionWarning');
    if (!el) return;
    if (quality === 'poor' || quality === 'critical') {
      el.hidden = false;
      el.textContent = 'Bağlantın zayıf. Ders senkronizasyonu gecikebilir.';
    } else if (quality === 'offline') {
      el.hidden = false;
      el.textContent = 'Derse yeniden bağlanıyorsun…';
    } else {
      el.hidden = true;
    }
  }

  function renderQuizHint(active) {
    var el = $('lcQuizContextHint');
    if (!el) return;
    if (active) {
      el.hidden = false;
      el.textContent = 'Cevap ekrandaki soruya göre verilir — quiz panelindeki alanı kullan.';
    } else {
      el.hidden = true;
    }
  }

  function handleCrisisEvent(detail) {
    if (!detail) return;
    var N = global.LiveClassUI ? global.LiveClassUI.StudentNotices : {};
    if (detail.event === 'mic_muted') {
      showBanner(N.micMutedByTeacher || detail.message, 'warn');
      deps.toast && deps.toast(N.micMutedByTeacher || detail.message);
    }
    if (detail.event === 'wb_revoked') showBanner(N.wbRevoked || detail.message, 'info');
    if (detail.event === 'wb_locked') showBanner(N.wbLocked || detail.message, 'info');
    if (detail.event === 'chat_closed') {
      showBanner(N.chatMuted || detail.message, 'warn');
      if (deps.onChatMode) deps.onChatMode('muted');
      renderChatNotice('muted', false);
    }
    if (detail.event === 'focus_on') showBanner(N.focusMode || 'Odak modundasın.', 'focus');
    if (detail.event === 'mic_request') showMicRequestModal();
    if (detail.event === 'chat_mode') {
      if (deps.onChatMode) deps.onChatMode(detail.mode);
      var msg = detail.mode === 'exam_mode' ? N.chatExam : detail.mode === 'questions_only' ? N.chatQuestions : null;
      if (msg) showBanner(msg, 'info');
      renderChatNotice(detail.mode, detail.mode !== 'muted' && detail.mode !== 'exam_mode');
    }
  }

  function bind() {
    try {
      global.addEventListener('storage', function (e) {
        if (e.key === 'bilenyum_crisis_bus' && e.newValue) {
          handleCrisisEvent(JSON.parse(e.newValue));
        }
      });
      global.addEventListener('bilenyum-crisis', function (e) { handleCrisisEvent(e.detail); });
    } catch (err) { /* ignore */ }

    if ($('lcMicAccept')) $('lcMicAccept').onclick = function () {
      hideMicRequestModal();
      deps.toast && deps.toast('Mikrofon açıldı (mock).');
      if ($('lcMicBtn')) $('lcMicBtn').click();
    };
    if ($('lcMicDecline')) $('lcMicDecline').onclick = function () {
      hideMicRequestModal();
      deps.toast && deps.toast('Mikrofon kapalı kaldı.');
    };
  }

  function renderAll(ctx) {
    ctx = ctx || {};
    renderStatusBadges(ctx.state, ctx.perm, ctx.wb);
    renderWbBanner(ctx.wb, ctx.participants);
    renderChatNotice(ctx.chatMode || 'open', ctx.chatEnabled !== false);
    renderConnectionWarning(ctx.connectionQuality || 'good');
    renderQuizHint(ctx.quizActive);
  }

  global.StudentCrisisUI = {
    init: function (d) {
      deps = d;
      bind();
    },
    renderAll: renderAll,
    showBanner: showBanner,
    showMicRequestModal: showMicRequestModal
  };

})(typeof window !== 'undefined' ? window : this);
