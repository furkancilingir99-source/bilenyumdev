(function () {
  'use strict';

  var Mock = window.TeacherLiveClassMock;
  var WB = window.LiveClassWhiteboard;
  var TEACHER_ID = Mock.TEACHER_ID;
  var qs = function (k) { return new URLSearchParams(location.search).get(k); };

  var subject = qs('subject') || 'Matematik';
  var topic = qs('topic') || 'Doğrusal Denklemler';
  var grade = qs('grade') || '8. Sınıf · LGS';
  var showMock = qs('demo') !== '0';

  var state = Mock.createTeacherState();
  var participants = Mock.buildTeacherParticipants();
  var chatMessages = Mock.demoChat();
  var questions = Mock.demoQuestions();
  var quizResponses = [];
  var currentQuiz = null;
  var wbState = WB.createWhiteboardState();
  wbState.permission = 'teacher_only';
  wbState.selectedColor = '#1A1A1A';
  var wbEngine = null;
  function penCursor(color) {
    var c = String(color || '#FF2DAA').replace('#', '%23');
    return "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M4 24l1.4-4.6L18.2 6.6l3.2 3.2L8.6 22.6 4 24z' fill='" + c + "' stroke='white' stroke-width='1.4' stroke-linejoin='round'/%3E%3Cpath d='M16.6 8.2l3.2 3.2 2-2a2.26 2.26 0 0 0-3.2-3.2l-2 2z' fill='%23bdbdbd' stroke='white' stroke-width='1.4' stroke-linejoin='round'/%3E%3C/svg%3E\") 3 25, crosshair";
  }
  var ERASER_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M5 18.5l9-9a3 3 0 0 1 4.2 0l2.8 2.8a3 3 0 0 1 0 4.2l-6.5 6.5H9.5L5 18.5z' fill='%23ffe08a' stroke='%23333' stroke-width='1.4' stroke-linejoin='round'/%3E%3Cpath d='M11.5 12l5 5' stroke='%23333' stroke-width='1.4'/%3E%3C/svg%3E\") 7 20, cell";
  var timerId = null;
  var breakTimerId = null;
  var breakLeftSecs = 0;
  var confirmCallback = null;
  var stats = { chatCount: 0, questionCount: 2, quizCount: 0, handCount: 0, wbStudents: [] };
  var waitingRoomStudents = window.TeacherDemoSeed
    ? (window.TeacherDemoSeed.teacherDemoSeed.waitingRoomStudents || []).map(function (w) { return Object.assign({}, w); })
    : [];

  function loadDemoSeed() {
    if (!window.TeacherDemoSeed) {
      toast('Demo seed yüklenemedi.', true);
      return;
    }
    var seed = window.TeacherDemoSeed.teacherDemoSeed;
    participants.length = 0;
    seed.participants.forEach(function (p) { participants.push(Object.assign({}, p)); });
    chatMessages.length = 0;
    seed.chatMessages.forEach(function (m) { chatMessages.push(Object.assign({}, m)); });
    questions.length = 0;
    seed.questions.forEach(function (q) { questions.push(Object.assign({}, q)); });
    waitingRoomStudents = (seed.waitingRoomStudents || []).map(function (w) { return Object.assign({}, w); });
    state.reactions = { clap: 0, like: 0, heart: 0, smile: 0, confused: 0, slow: 0, fast: 0 };
    (seed.reactionEvents || []).forEach(function (ev) {
      if (state.reactions[ev.type] != null) state.reactions[ev.type]++;
    });
    state.raisedHandQueue = (seed.raisedHandQueue || []).slice();
    syncRaisedQueue();
    setSessionStatus('live');
    startTimer();
    toast('Büyük demo verisi yüklendi: ' + participants.length + ' katılımcı, ' + chatMessages.length + ' mesaj, ' + questions.length + ' soru.');
    renderAll();
  }

  function getWaitingRoomSeed() {
    return waitingRoomStudents.slice();
  }

  function toggleFocus(on) {
    state.isFocusModeActive = !!on;
    toast(state.isFocusModeActive ? 'Odak modu başlatıldı.' : 'Odak modu kapatıldı.');
    updateChips();
    updateBottomActive();
  }

  state.raisedHandQueue = Mock.syncRaisedQueue(participants);

  var el = {
    preclass: document.getElementById('tlcPreclass'),
    waiting: document.getElementById('tlcWaiting'),
    live: document.getElementById('tlcLive'),
    ended: document.getElementById('tlcEnded'),
    gallery: document.getElementById('tlcGallery'),
    speaker: document.getElementById('tlcSpeaker'),
    share: document.getElementById('tlcShare'),
    wbWrap: document.getElementById('tlcWbWrap'),
    quizStage: document.getElementById('tlcQuizStage'),
    chips: document.getElementById('tlcChips'),
    timer: document.getElementById('tlcTimer'),
    breakScreen: document.getElementById('tlcBreakScreen'),
    breakLeft: document.getElementById('tlcBreakLeft'),
    toasts: document.getElementById('tlcToasts'),
    mockPanel: document.getElementById('tlcMockPanel'),
    mockToggle: document.getElementById('tlcMockToggle'),
    wbCanvas: document.getElementById('tlcWbCanvas'),
    wbBadges: document.getElementById('tlcWbBadges'),
    quizOptions: document.getElementById('tlcQuizOptions'),
    quizResults: document.getElementById('tlcQuizResults'),
    quizResultsBody: document.getElementById('tlcQuizResultsBody'),
    quizType: document.getElementById('tlcQuizType'),
    quizQuestion: document.getElementById('tlcQuizQuestion'),
    quizSend: document.getElementById('tlcQuizSend'),
    chatMsgs: document.getElementById('tlcChatMsgs'),
    chatInput: document.getElementById('tlcChatInput'),
    transcriptLines: document.getElementById('tlcTranscriptLines'),
    waitList: document.getElementById('tlcWaitList'),
    waitCount: document.getElementById('tlcWaitCount'),
    endedStats: document.getElementById('tlcEndedStats')
  };

  function getP(id) {
    for (var i = 0; i < participants.length; i++) {
      if (participants[i].id === id) return participants[i];
    }
    return null;
  }

  function toast(msg, isError) {
    var t = document.createElement('div');
    t.className = 'tlc-toast' + (isError ? ' is-error' : '');
    t.textContent = msg;
    el.toasts.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }

  function toastWithUndo(msg, undoFn) {
    var t = document.createElement('div');
    t.className = 'tlc-toast tlc-toast--undo';
    var span = document.createElement('span');
    span.textContent = msg;
    t.appendChild(span);
    if (undoFn) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tlc-toast-undo';
      btn.textContent = 'Geri al';
      btn.onclick = function () { undoFn(); t.remove(); };
      t.appendChild(btn);
    }
    el.toasts.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 8000);
  }

  var crisisManager = null;

  function showConfirm(title, text, cb) {
    document.getElementById('tlcConfirmTitle').textContent = title;
    document.getElementById('tlcConfirmText').textContent = text;
    confirmCallback = cb;
    document.getElementById('tlcConfirmModal').hidden = false;
  }

  function syncWbFlags() {
    participants.forEach(function (p) {
      p.isSelectedForWhiteboard = state.selectedWhiteboardStudentId === p.id;
    });
  }

  function syncRaisedQueue() {
    state.raisedHandQueue = Mock.syncRaisedQueue(participants);
  }

  function setSessionStatus(status) {
    state.sessionStatus = status;
    el.preclass.hidden = status !== 'preclass';
    el.waiting.hidden = status !== 'waiting_room';
    el.live.hidden = status !== 'live' && status !== 'break';
    el.ended.hidden = status !== 'ended';
    if (el.breakScreen) el.breakScreen.hidden = status !== 'break';
    if (status === 'live') toast('Ders başladı.');
    if (status === 'ended') {
      toast('Ders sona erdi.');
      renderEnded();
      stopTimer();
    }
    renderAll();
  }

  function setMainStage(mode) {
    state.mainStageMode = mode;
    el.gallery.hidden = mode !== 'gallery';
    el.speaker.hidden = mode !== 'speaker';
    el.share.hidden = mode !== 'screen_share';
    el.wbWrap.hidden = mode !== 'whiteboard';
    el.quizStage.hidden = mode !== 'quiz';
    if (mode === 'whiteboard' && wbEngine) {
      setTimeout(function () { wbEngine.resize(); }, 50);
    }
    updateChips();
    updateBottomActive();
  }

  var CTRL_MENU_BTN = {
    tlcAudioMenu: 'tlcAudioMenuBtn',
    tlcCamMenu: 'tlcCamMenuBtn',
    tlcWbMenu: 'tlcWbMenuBtn',
    tlcBreakMenu: 'tlcBreakBtn'
  };
  function closeCtrlMenus(keepMenuId) {
    Object.keys(CTRL_MENU_BTN).forEach(function (mid) {
      if (mid === keepMenuId) return;
      var menu = document.getElementById(mid);
      if (menu && !menu.hidden) {
        menu.hidden = true;
        var btn = document.getElementById(CTRL_MENU_BTN[mid]);
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setPanelTab(tab) {
    state.rightPanelTab = tab;
    document.querySelectorAll('.tlc-tab').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tlc-panel-section').forEach(function (sec) {
      sec.hidden = sec.dataset.panel !== tab;
    });
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(function () {
      if (state.sessionStatus === 'live') {
        state.elapsed++;
        el.timer.textContent = Mock.fmtDuration(state.elapsed);
        if (window.LiveClassIdentityHeader) {
          window.LiveClassIdentityHeader.tickElapsed('#tlcIdentityMount', state.elapsed);
        }
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function startBreakTimer() {
    if (breakTimerId) clearInterval(breakTimerId);
    breakLeftSecs = state.breakSeconds;
    el.breakLeft.textContent = Mock.fmtDuration(breakLeftSecs);
    breakTimerId = setInterval(function () {
      breakLeftSecs--;
      el.breakLeft.textContent = Mock.fmtDuration(Math.max(0, breakLeftSecs));
      if (breakLeftSecs <= 0) endBreak();
    }, 1000);
  }

  function extendBreak(secs) {
    if (state.sessionStatus !== 'break') return;
    breakLeftSecs += secs;
    state.breakSeconds = breakLeftSecs;
    el.breakLeft.textContent = Mock.fmtDuration(Math.max(0, breakLeftSecs));
    toast('Mola ' + Math.round(secs / 60) + ' dakika uzatıldı.');
  }

  function endBreak() {
    if (breakTimerId) { clearInterval(breakTimerId); breakTimerId = null; }
    setSessionStatus('live');
    toast('Ara bitti, ders devam ediyor.');
  }

  function updateChips() {
    var chips = [];
    var statusLabels = {
      preclass: 'Hazırlık', waiting_room: 'Bekleme', live: 'Canlı', break: 'Ara',
      ended: 'Bitti', reconnecting: 'Yeniden bağlanıyor', disconnected: 'Bağlantı kesildi'
    };
    if (state.isRecording) chips.push('<span class="tlc-chip">● Kayıt</span>');
    if (currentQuiz && currentQuiz.status === 'active') chips.push('<span class="tlc-chip is-quiz">Quiz aktif</span>');
    if (window.TeacherScreenQuestion && window.TeacherScreenQuestion.isActive()) {
      chips.push('<span class="tlc-chip is-quiz">⚡ Ekrandaki soru</span>');
    }
    if (state.isScreenSharing) chips.push('<span class="tlc-chip">Ekran paylaşımı</span>');
    if (state.isFocusModeActive) chips.push('<span class="tlc-chip is-focus">Odak modu</span>');
    if (state.isHandRaiseEnabled === false) chips.push('<span class="tlc-chip is-hand-off">El kaldırma kapalı</span>');
    if (state.isCaptionsEnabled) chips.push('<span class="tlc-chip">Altyazı</span>');
    el.chips.innerHTML = chips.join('');
  }

  function updateBottomActive() {
    var speakerBtn = document.getElementById('tlcSpeakerBtn');
    if (speakerBtn) speakerBtn.classList.toggle('is-active', state.mainStageMode === 'speaker');
    var shareBtn = document.getElementById('tlcShareBtn');
    if (shareBtn) shareBtn.classList.toggle('is-active', state.isScreenSharing);
    document.getElementById('tlcWbBtn').classList.toggle('is-active', state.mainStageMode === 'whiteboard');
    var focusBtn = document.getElementById('tlcFocusBtn');
    if (focusBtn) focusBtn.classList.toggle('is-active', state.isFocusModeActive);
    var teacher = getP(TEACHER_ID);
    document.getElementById('tlcMicBtn').classList.toggle('is-active', teacher && teacher.micOn);
    document.getElementById('tlcCamBtn').classList.toggle('is-active', teacher && teacher.cameraOn);
    syncSelfVideo();
  }

  function syncSelfVideo() {
    var t = getP(TEACHER_ID);
    if (!t) return;
    var cam = document.getElementById('tlcSelfCam');
    var micBtn = document.getElementById('tlcSelfMic');
    var camBtn = document.getElementById('tlcSelfCamBtn');
    if (cam) {
      cam.classList.toggle('is-off', !t.cameraOn);
      cam.innerHTML = t.cameraOn ? avatarInner(t)
        : '<span class="tlc-self-cam-off"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>Kamera kapalı</span>';
    }
    if (micBtn) micBtn.classList.toggle('is-off', !t.micOn);
    if (camBtn) camBtn.classList.toggle('is-off', !t.cameraOn);
  }

  function renderGallery() {
    var sorted = Mock.sortParticipants(participants, state.selectedWhiteboardStudentId);
    var students = sorted.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
    var teacher = getP(TEACHER_ID);
    var html = '';

    if (teacher) {
      html += renderVidCard(teacher, true);
    }
    students.slice(0, 12).forEach(function (p) {
      html += renderVidCard(p, false);
    });
    el.gallery.innerHTML = html;
    bindVidCardActions();
  }

  function renderVidCard(p, isTeacherCard) {
    var cls = 'tlc-vid-card';
    if (isTeacherCard) cls += ' tlc-vid-card--teacher';
    if (p.isSpeaking) cls += ' is-speaking';
    if (p.isHandRaised) cls += ' is-raised';
    if (p.isSelectedForWhiteboard) cls += ' is-wb';
    if (p.micNoise) cls += ' is-noisy';
    if (p.connectionQuality === 'poor' || p.connectionQuality === 'critical') cls += ' is-weak-conn';
    var badges = '';
    if (p.isHandRaised) badges += '<span class="tlc-vid-badge is-hand">✋</span>';
    if (p.isSelectedForWhiteboard) badges += '<span class="tlc-vid-badge is-wb">Tahtada</span>';
    if (p.micNoise || (p.micOn && !p.isSpeaking && p.role === 'student')) badges += '<span class="tlc-vid-badge is-noise" title="Mikrofon uyarısı">🎤</span>';
    if (p.speakingWithoutMic) badges += '<span class="tlc-vid-badge is-warn" title="Mic kapalı konuşuyor">⚠</span>';
    if (p.connectionQuality === 'poor' || p.connectionQuality === 'critical') badges += '<span class="tlc-vid-badge is-conn" title="Bağlantı zayıf">📶</span>';
    if (currentQuiz && currentQuiz.status === 'active') {
      badges += '<span class="tlc-vid-badge">' + (p.quizAnswered ? '✓' : '…') + '</span>';
    }
    var canSelectWb = p.isHandRaised && !p.isInWaitingRoom;
    var insightAttr = p.role === 'student' ? ' data-insight-id="' + p.id + '"' : '';
    var xpHint = '';
    if (p.role === 'student' && window.StudentInsightsSeed && StudentInsightsSeed.studentInsights[p.id]) {
      xpHint = '<div class="tlc-vid-xp">+' + StudentInsightsSeed.studentInsights[p.id].gamification.lessonXp + ' XP</div>';
    }
    var statusHtml = '<div class="tlc-vid-status">' +
      '<span class="tlc-vid-dev ' + (p.micOn ? 'is-on' : 'is-off') + '" title="' + (p.micOn ? 'Mikrofon açık' : 'Mikrofon kapalı') + '">' + (p.micOn ? MIC_ON_SVG : MIC_OFF_SVG) + '</span>' +
      '<span class="tlc-vid-dev ' + (p.cameraOn ? 'is-on' : 'is-off') + '" title="' + (p.cameraOn ? 'Kamera açık' : 'Kamera kapalı') + '">' + (p.cameraOn ? CAM_ON_SVG : CAM_OFF_SVG) + '</span>' +
      '</div>';
    var hover = '';
    if (p.role === 'student') {
      hover += p.micOn
        ? '<button type="button" class="tlc-vid-act is-danger" data-act="mute">Mikrofonunu kapat</button>'
        : '<button type="button" class="tlc-vid-act" data-act="req-mic">Mikrofon isteği gönder</button>';
      hover += p.cameraOn
        ? '<button type="button" class="tlc-vid-act is-danger" data-act="cam-off">Kamerasını kapat</button>'
        : '<button type="button" class="tlc-vid-act" data-act="req-cam">Kamera isteği gönder</button>';
      hover += '<button type="button" class="tlc-vid-act" data-act="wb-select"' + (canSelectWb ? '' : ' disabled title="Parmak kaldırmadı"') + '>Tahtaya seç</button>';
      if (p.isSelectedForWhiteboard) hover += '<button type="button" class="tlc-vid-act" data-act="wb-revoke">İzin kaldır</button>';
      if (p.isHandRaised) hover += '<button type="button" class="tlc-vid-act" data-act="lower-hand">El indir</button>';
      hover += '<button type="button" class="tlc-vid-act" data-act="insight">Detay</button>';
    }
    return '<div class="' + cls + '" data-id="' + p.id + '"' + insightAttr + '>' +
      '<div class="tlc-vid-badges">' + badges + '</div>' +
      '<div class="tlc-vid-avatar">' + avatarInner(p) + '</div>' +
      '<div class="tlc-vid-name">' + p.name + '</div>' +
      statusHtml +
      xpHint +
      '<div class="tlc-vid-hover">' + hover + '</div></div>';
  }

  function bindVidCardActions() {
    el.gallery.querySelectorAll('.tlc-vid-card').forEach(function (card) {
      card.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = card.dataset.id;
          handleParticipantAction(id, btn.dataset.act);
        });
      });
    });
  }

  function handleParticipantAction(id, act) {
    var p = getP(id);
    if (!p) return;
    switch (act) {
      case 'mute':
        p.micOn = false;
        p.isMutedByTeacher = true;
        toast(p.name + ' sessize alındı.');
        if (window.LiveClassEvents) {
          window.LiveClassEvents.publish('mic_muted_by_teacher', {
            actorId: TEACHER_ID,
            targetParticipantId: id,
            payload: {}
          });
        }
        break;
      case 'req-mic':
        toast(p.name + ' için mikrofon açma isteği gönderildi.');
        if (id === 's0') {
          try {
            localStorage.setItem('bilenyum_crisis_bus', JSON.stringify({ event: 'mic_request', at: Date.now() }));
          } catch (e) { /* ignore */ }
        }
        break;
      case 'req-cam':
        toast(p.name + ' için kamera açma isteği gönderildi.');
        break;
      case 'cam-off':
        p.cameraOn = false;
        toast(p.name + ' kamerası kapatıldı.');
        break;
      case 'pin':
        state.pinnedParticipantId = id;
        setMainStage('speaker');
        renderSpeaker();
        break;
      case 'wb-select':
        selectForWhiteboard(id);
        break;
      case 'wb-revoke':
        revokeWhiteboardPermission();
        break;
      case 'lower-hand':
        lowerHand(id);
        break;
      case 'insight':
        if (window.TeacherStudentInsight) window.TeacherStudentInsight.open(id);
        break;
    }
    renderAll();
  }

  function renderSpeaker() {
    var id = state.pinnedParticipantId || state.activeSpeakerId || TEACHER_ID;
    var p = getP(id) || getP(TEACHER_ID);
    document.getElementById('tlcSpeakerAv').innerHTML = avatarInner(p);
    document.getElementById('tlcSpeakerName').textContent = p.name;
    document.getElementById('tlcSpeakerRole').textContent =
      (p.role === 'teacher' ? 'Eğitmen' : 'Öğrenci') + (p.isSpeaking ? ' · Konuşuyor' : '');
  }

  function renderParticipantsPanel() {
    var container = document.getElementById('tlcPanelParticipants');
    var sorted = Mock.sortParticipants(participants, state.selectedWhiteboardStudentId);
    container.innerHTML = sorted.filter(function (p) { return p.role === 'student'; }).map(function (p) {
      return renderListItem(p);
    }).join('');
    bindListActions(container);
  }

  function renderRaisedPanel() {
    var container = document.getElementById('tlcPanelRaised');
    var raised = Mock.sortRaisedHands(participants);
    if (!raised.length) {
      container.innerHTML = '<p class="tlc-preclass-meta">El kaldıran öğrenci yok.</p>';
      return;
    }
    var header = '<div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap">' +
      '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcSelectNext" aria-label="Sıradaki öğrenciyi seç">Sıradaki</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcLowerAll" aria-label="Tüm elleri indir">Tüm elleri indir</button></div>';
    container.innerHTML = header + raised.map(function (p) {
      var t = p.handRaisedAt ? new Date(p.handRaisedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—';
      return renderListItem(p, t);
    }).join('');
    bindListActions(container);
    var nextBtn = document.getElementById('tlcSelectNext');
    if (nextBtn) nextBtn.onclick = function () {
      if (raised.length) selectForWhiteboard(raised[0].id);
    };
    var lowerAll = document.getElementById('tlcLowerAll');
    if (lowerAll) lowerAll.onclick = function () {
      showConfirm('Tüm elleri indir', 'Tüm öğrencilerin elini indirmek istediğine emin misin?', function () {
        participants.forEach(function (p) { p.isHandRaised = false; p.handRaisedAt = null; });
        syncRaisedQueue();
        renderAll();
        toast('Tüm eller indirildi.');
      });
    };
  }

  /* ---- Bitmoji tarzı şirin öğrenci avatarları ---- */
  var _avCounter = 0;
  var AV_SKIN = ['#fcd9b8', '#f5c197', '#e8aa7a', '#cf9264', '#a9683f'];
  var AV_HAIR = ['#2b2118', '#4a3526', '#171717', '#7a4a23', '#caa14e', '#8a3b2f'];
  var AV_SHIRT = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6', '#ec4899'];
  var AV_BG = [['#a78bfa', '#7c3aed'], ['#fbcfe8', '#ec4899'], ['#bae6fd', '#3b82f6'], ['#bbf7d0', '#22c55e'], ['#fde68a', '#f59e0b'], ['#c7d2fe', '#6366f1'], ['#fecdd3', '#f43f5e'], ['#99f6e4', '#14b8a6']];
  var AV_FEMALE = { 'Ece': 1, 'Zeynep': 1, 'Elif': 1, 'Nazlı': 1, 'İrem': 1, 'Mina': 1, 'Ayşe': 1 };
  function avHash(s) { var h = 0, t = String(s || ''); for (var i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) >>> 0; } return h; }
  function studentAvatarSvg(p) {
    var h = avHash(p.id || p.name);
    var skin = AV_SKIN[h % AV_SKIN.length];
    var hair = AV_HAIR[(h >>> 3) % AV_HAIR.length];
    var shirt = AV_SHIRT[(h >>> 6) % AV_SHIRT.length];
    var bg = AV_BG[(h >>> 9) % AV_BG.length];
    var female = !!AV_FEMALE[String(p.name || '').split(' ')[0]];
    var glasses = (h % 5) === 0;
    var bow = female && ((h >>> 2) % 2) === 0;
    var uid = 'sav' + (++_avCounter);
    var s = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">';
    s += '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '"/></linearGradient></defs>';
    s += '<rect width="64" height="64" fill="url(#' + uid + ')"/>';
    s += '<circle cx="13" cy="14" r="1.3" fill="#fff" opacity=".55"/><circle cx="51" cy="12" r="1" fill="#fff" opacity=".45"/>';
    if (female) s += '<path d="M15 32 C15 14 49 14 49 32 L49 47 Q32 53 15 47 Z" fill="' + hair + '"/>';
    s += '<ellipse cx="32" cy="63" rx="19" ry="12" fill="' + shirt + '"/>';
    s += '<rect x="28.5" y="38" width="7" height="9" rx="3.2" fill="' + skin + '"/>';
    if (!female) s += '<circle cx="32" cy="25" r="15.5" fill="' + hair + '"/>';
    s += '<circle cx="18.5" cy="31" r="2.6" fill="' + skin + '"/><circle cx="45.5" cy="31" r="2.6" fill="' + skin + '"/>';
    s += '<circle cx="32" cy="30" r="14" fill="' + skin + '"/>';
    s += '<ellipse cx="32" cy="19" rx="' + (female ? 14 : 13) + '" ry="' + (female ? 7.5 : 6) + '" fill="' + hair + '"/>';
    s += '<path d="M23.5 25 q2.8 -1.6 5 0" stroke="' + hair + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<path d="M35.5 25 q2.8 -1.6 5 0" stroke="' + hair + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    s += '<ellipse cx="26" cy="30.2" rx="3" ry="3.6" fill="#fff"/><ellipse cx="38" cy="30.2" rx="3" ry="3.6" fill="#fff"/>';
    s += '<circle cx="26.4" cy="30.8" r="1.9" fill="#29293d"/><circle cx="38.4" cy="30.8" r="1.9" fill="#29293d"/>';
    s += '<circle cx="27.2" cy="29.9" r="0.7" fill="#fff"/><circle cx="39.2" cy="29.9" r="0.7" fill="#fff"/>';
    s += '<circle cx="21.5" cy="35.5" r="2.4" fill="#ff8fab" opacity=".55"/><circle cx="42.5" cy="35.5" r="2.4" fill="#ff8fab" opacity=".55"/>';
    s += '<path d="M26 35.6 q6 5 12 0" stroke="#b5476a" stroke-width="2" fill="none" stroke-linecap="round"/>';
    if (glasses) s += '<g stroke="#2a2a3a" stroke-width="1.5" fill="none"><rect x="21.5" y="27.2" width="8" height="6.2" rx="3"/><rect x="34.5" y="27.2" width="8" height="6.2" rx="3"/><line x1="29.5" y1="30" x2="34.5" y2="30"/></g>';
    if (bow) s += '<g transform="translate(32 11)"><path d="M0 0 L-6 -3.5 L-6 3.5 Z" fill="' + shirt + '"/><path d="M0 0 L6 -3.5 L6 3.5 Z" fill="' + shirt + '"/><circle r="1.8" fill="#fff"/></g>';
    s += '</svg>';
    return s;
  }
  function avatarInner(p) {
    if (!p) return '👤';
    if (p.role === 'teacher' || !p.role) {
      // Öğretmene de şirin avatar
      return studentAvatarSvg(p);
    }
    return studentAvatarSvg(p);
  }

  var MIC_ON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>';
  var MIC_OFF_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';
  var CAM_ON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';
  var CAM_OFF_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';

  function renderListItem(p, handTime) {
    var cls = 'tlc-list-item';
    if (p.isHandRaised) cls += ' is-raised';
    if (p.isSelectedForWhiteboard) cls += ' is-wb';
    var canWb = p.isHandRaised && !p.isInWaitingRoom;
    var micBtn = '<button type="button" class="tlc-li-dev ' + (p.micOn ? 'is-on' : 'is-off') + '" data-act="' + (p.micOn ? 'mute' : 'req-mic') + '" title="' + (p.micOn ? 'Mikrofonu kapat' : 'Mikrofon açma isteği gönder') + '" aria-label="' + (p.micOn ? p.name + ' mikrofonunu kapat' : p.name + ' için mikrofon açma isteği gönder') + '">' + (p.micOn ? MIC_ON_SVG : MIC_OFF_SVG) + '</button>';
    var camBtn = '<button type="button" class="tlc-li-dev ' + (p.cameraOn ? 'is-on' : 'is-off') + '" data-act="' + (p.cameraOn ? 'cam-off' : 'req-cam') + '" title="' + (p.cameraOn ? 'Kamerayı kapat' : 'Kamera açma isteği gönder') + '" aria-label="' + (p.cameraOn ? p.name + ' kamerasını kapat' : p.name + ' için kamera açma isteği gönder') + '">' + (p.cameraOn ? CAM_ON_SVG : CAM_OFF_SVG) + '</button>';
    return '<div class="' + cls + '" data-id="' + p.id + '" data-insight-id="' + p.id + '">' +
      '<span class="tlc-li-ava">' + avatarInner(p) + '</span>' +
      '<div class="tlc-list-meta">' +
        '<div class="tlc-list-name">' + p.name + '</div>' +
        '<div class="tlc-list-sub">' +
          '<span class="tlc-conn is-' + p.connectionQuality + '">' + p.connectionQuality + '</span>' +
          (handTime ? ' · El: ' + handTime : '') +
          (p.isSelectedForWhiteboard ? ' · <strong>Tahtada</strong>' : '') +
        '</div>' +
        '<div class="tlc-list-actions">' +
          '<button type="button" class="tlc-btn tlc-btn--sm" data-act="wb-select"' + (canWb ? '' : ' disabled') + ' aria-label="Whiteboard\'a seç">Tahtaya seç</button>' +
          (p.isSelectedForWhiteboard ? '<button type="button" class="tlc-btn tlc-btn--sm" data-act="wb-revoke" aria-label="İzin kaldır">İzin kaldır</button>' : '') +
          (p.isHandRaised ? '<button type="button" class="tlc-btn tlc-btn--sm" data-act="lower-hand" aria-label="El indir">El indir</button>' : '') +
          '<button type="button" class="tlc-btn tlc-btn--sm" data-act="insight" aria-label="Detay paneli">Detay</button>' +
        '</div>' +
      '</div>' +
      '<div class="tlc-li-devices">' + micBtn + camBtn + '</div>' +
    '</div>';
  }

  function bindListActions(container) {
    container.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.closest('[data-id]').dataset.id;
        handleParticipantAction(id, btn.dataset.act);
      });
    });
  }

  function selectForWhiteboard(studentId) {
    var p = getP(studentId);
    if (!p || p.role !== 'student') return;
    if (!p.isHandRaised) {
      toast('Bu öğrenci parmak kaldırmadığı için whiteboard\'a seçilemez.', true);
      return;
    }
    if (state.selectedWhiteboardStudentId && state.selectedWhiteboardStudentId !== studentId) {
      var prev = getP(state.selectedWhiteboardStudentId);
      if (prev) prev.isSelectedForWhiteboard = false;
    }
    state.selectedWhiteboardStudentId = studentId;
    wbState.selectedStudentId = studentId;
    wbState.permission = 'selected_raised_hand_student_can_draw';
    state.wbPermission = wbState.permission;
    syncWbFlags();
    if (!stats.wbStudents.includes(studentId)) stats.wbStudents.push(studentId);
    toast(p.name + ' whiteboard\'a seçildi.');
    if (window.LiveClassEvents) {
      window.LiveClassEvents.publish('student_selected_for_whiteboard', {
        actorId: TEACHER_ID,
        targetParticipantId: studentId,
        payload: { source: 'raised_hand_queue' }
      });
    }
    renderWbBadges();
    renderAll();
  }

  function revokeWhiteboardPermission() {
    if (!state.selectedWhiteboardStudentId) return;
    var p = getP(state.selectedWhiteboardStudentId);
    state.selectedWhiteboardStudentId = null;
    wbState.selectedStudentId = null;
    wbState.permission = 'teacher_only';
    state.wbPermission = 'teacher_only';
    syncWbFlags();
    toast('Whiteboard yazma izni kaldırıldı.');
    if (window.LiveClassEvents) {
      window.LiveClassEvents.publish('whiteboard_permission_revoked', {
        actorId: TEACHER_ID,
        targetParticipantId: p ? p.id : null,
        payload: {}
      });
    }
    renderWbBadges();
    renderAll();
  }

  function lowerHand(id) {
    var p = getP(id);
    if (!p) return;
    p.isHandRaised = false;
    p.handRaisedAt = null;
    if (state.selectedWhiteboardStudentId === id) revokeWhiteboardPermission();
    syncRaisedQueue();
    renderAll();
  }

  function renderChat() {
    el.chatMsgs.innerHTML = chatMessages.map(function (m) {
      var cls = 'tlc-msg tlc-msg--' + (m.type === 'teacher' ? 'teacher' : m.type === 'system' ? 'sys' : 'student');
      return '<div class="' + cls + '"><strong>' + m.senderName + '</strong> · ' + m.createdAt + '<br>' + m.content + '</div>';
    }).join('');
    el.chatMsgs.scrollTop = el.chatMsgs.scrollHeight;
  }

  function renderQuestions() {
    var container = document.getElementById('tlcPanelQuestions');
    if (!container) return;
    container.innerHTML = questions.map(function (q) {
      var statusMap = { waiting: 'Cevap bekliyor', seen: 'Görüldü', answered: 'Cevaplandı', featured: 'Öne çıkarıldı' };
      return '<div class="tlc-list-item"><div class="tlc-list-meta">' +
        '<div class="tlc-list-name">' + q.studentName + '</div>' +
        '<div class="tlc-list-sub">' + statusMap[q.status] + ' · ' + q.createdAt + '</div>' +
        '<p style="margin:6px 0;font-size:0.85rem">' + q.content + '</p>' +
        '<div class="tlc-list-actions">' +
          '<button type="button" class="tlc-btn tlc-btn--sm" data-qact="seen" data-qid="' + q.id + '" aria-label="Görüldü">Görüldü</button>' +
          '<button type="button" class="tlc-btn tlc-btn--sm" data-qact="answered" data-qid="' + q.id + '" aria-label="Cevaplandı">Cevaplandı</button>' +
          '<button type="button" class="tlc-btn tlc-btn--sm" data-qact="feature" data-qid="' + q.id + '" aria-label="Öne çıkar">Öne çıkar</button>' +
        '</div></div></div>';
    }).join('');
    container.querySelectorAll('[data-qact]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = questions.find(function (x) { return x.id === btn.dataset.qid; });
        if (!q) return;
        if (btn.dataset.qact === 'seen') q.status = 'seen';
        if (btn.dataset.qact === 'answered') q.status = 'answered';
        if (btn.dataset.qact === 'feature') q.status = 'featured';
        renderQuestions();
      });
    });
  }

  function renderReactions() {
    var container = document.getElementById('tlcPanelReactions');
    if (!container) return;
    var r = state.reactions;
    var alert = '';
    if (r.confused >= 4) alert = '<div class="tlc-alert">4 öğrenci anlamadım geri bildirimi verdi.</div>';
    else if (r.slow >= 3) alert = '<div class="tlc-alert">Tempo uyarısı: ' + r.slow + ' öğrenci yavaşla istedi.</div>';
    container.innerHTML = alert +
      '<div class="tlc-react-grid">' +
      '<div class="tlc-react-stat"><strong>' + r.confused + '</strong>Anlamadım</div>' +
      '<div class="tlc-react-stat"><strong>' + r.slow + '</strong>Yavaşla</div>' +
      '<div class="tlc-react-stat"><strong>' + r.fast + '</strong>Hızlan</div>' +
      '<div class="tlc-react-stat"><strong>' + r.clap + '</strong>Alkış</div>' +
      '<div class="tlc-react-stat"><strong>' + r.like + '</strong>Beğeni</div>' +
      '<div class="tlc-react-stat"><strong>' + r.heart + '</strong>Kalp</div>' +
      '</div>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcClearReactions" style="margin-top:12px" aria-label="Reaksiyonları temizle">Temizle</button>';
    var clr = document.getElementById('tlcClearReactions');
    if (clr) clr.onclick = function () {
      state.reactions = { clap: 0, like: 0, heart: 0, smile: 0, confused: 0, slow: 0, fast: 0 };
      renderReactions();
    };
  }

  function renderWbPanel() {
    var container = document.getElementById('tlcPanelWb');
    if (!container) return;
    var raised = Mock.sortRaisedHands(participants);
    container.innerHTML =
      '<p class="tlc-preclass-meta">Whiteboard: ' + (state.mainStageMode === 'whiteboard' ? 'Açık' : 'Kapalı') + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:8px 0">' +
        '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcWbPanelOpen" aria-label="Whiteboard aç">Aç</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcWbPanelClose" aria-label="Whiteboard kapat">Kapat</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcWbPanelLock" aria-label="Kilitle">' + (state.isWhiteboardLocked ? 'Kilidi aç' : 'Kilitle') + '</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcWbPanelTeacherOnly" aria-label="Sadece öğretmen">Sadece öğretmen</button>' +
      '</div>' +
      '<h4 style="font-size:0.85rem;margin:12px 0 6px">El kaldıranlar</h4>' +
      (raised.length ? raised.map(function (p) {
        return '<button type="button" class="tlc-btn tlc-btn--sm" style="margin:0 4px 4px 0" data-wb-pick="' + p.id + '" aria-label="' + p.name + ' seç">' + p.name + '</button>';
      }).join('') : '<p class="tlc-preclass-meta">Yok</p>') +
      (state.selectedWhiteboardStudentId ? '<button type="button" class="tlc-btn tlc-btn--sm tlc-btn--danger" id="tlcWbPanelRevoke" style="margin-top:8px" aria-label="İzin kaldır">Seçili öğrenci iznini kaldır</button>' : '');

    document.getElementById('tlcWbPanelOpen').onclick = openWhiteboard;
    document.getElementById('tlcWbPanelClose').onclick = closeWhiteboard;
    document.getElementById('tlcWbPanelLock').onclick = toggleWbLock;
    document.getElementById('tlcWbPanelTeacherOnly').onclick = function () {
      revokeWhiteboardPermission();
      wbState.permission = 'teacher_only';
    };
    container.querySelectorAll('[data-wb-pick]').forEach(function (btn) {
      btn.onclick = function () { selectForWhiteboard(btn.dataset.wbPick); };
    });
    var rev = document.getElementById('tlcWbPanelRevoke');
    if (rev) rev.onclick = revokeWhiteboardPermission;
  }

  function renderWbBadges() {
    var badges = [];
    if (state.mainStageMode === 'whiteboard') badges.push('Whiteboard açık');
    if (state.isWhiteboardLocked) badges.push('Whiteboard kilitli');
    if (state.selectedWhiteboardStudentId) {
      var sp = getP(state.selectedWhiteboardStudentId);
      if (sp) badges.push(sp.name + ' tahtada');
    } else if (state.mainStageMode === 'whiteboard') {
      badges.push('Sadece öğretmen yazıyor');
    }
    el.wbBadges.innerHTML = badges.map(function (b) { return '<span>' + b + '</span>'; }).join('');
  }

  function renderWaitingRoom() {
    var waiting = participants.filter(function (p) { return p.isInWaitingRoom; });
    el.waitCount.textContent = String(waiting.length);
    el.waitList.innerHTML = waiting.map(function (p) {
      return '<div class="tlc-waiting-item">' +
        '<span class="tlc-waiting-ava">' + avatarInner(p) + '</span>' +
        '<span>' + p.name + '</span>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-admit="' + p.id + '" aria-label="' + p.name + ' derse al">Al</button>' +
      '</div>';
    }).join('');
    el.waitList.querySelectorAll('[data-admit]').forEach(function (btn) {
      btn.onclick = function () {
        var p = getP(btn.dataset.admit);
        if (p) { p.isInWaitingRoom = false; toast(p.name + ' derse alındı.'); renderWaitingRoom(); }
      };
    });
  }

  function renderEnded() {
    var info = document.getElementById('tlcEndedInfo');
    if (info) {
      var rows = [
        ['Ders', subject + ' Canlı Dersi'],
        ['İşlenen Konu', topic],
        ['Sınıf Seviyesi', grade],
        ['Ders Süresi', Mock.fmtDuration(state.elapsed)]
      ];
      info.innerHTML = rows.map(function (r) {
        return '<div class="tlc-ended-row"><span class="tlc-ended-row-label">' + r[0]
          + '</span><span class="tlc-ended-row-val">' + r[1] + '</span></div>';
      }).join('');
    }
    el.endedStats.innerHTML =
      '<div class="tlc-stat-box"><strong>' + Mock.fmtDuration(state.elapsed) + '</strong>Süre</div>' +
      '<div class="tlc-stat-box"><strong>' + chatMessages.length + '</strong>Chat</div>' +
      '<div class="tlc-stat-box"><strong>' + questions.length + '</strong>Soru</div>' +
      '<div class="tlc-stat-box"><strong>' + stats.quizCount + '</strong>Quiz</div>' +
      '<div class="tlc-stat-box"><strong>' + stats.handCount + '</strong>El kaldırma</div>' +
      '<div class="tlc-stat-box"><strong>' + stats.wbStudents.length + '</strong>Tahtaya çıkan</div>';
  }

  function initJoinScreen() {
    var menus = [
      { dd: 'tlcJoinMicDD', menu: 'tlcJoinMicMenu' },
      { dd: 'tlcJoinSpkDD', menu: 'tlcJoinSpkMenu' },
      { dd: 'tlcJoinCamCaret', menu: 'tlcJoinCamMenu' }
    ];
    function closeJoinMenus(keep) {
      menus.forEach(function (m) {
        if (m.menu === keep) return;
        var el2 = document.getElementById(m.menu);
        var dd = document.getElementById(m.dd);
        if (el2 && !el2.hidden) { el2.hidden = true; if (dd) dd.setAttribute('aria-expanded', 'false'); }
      });
    }
    menus.forEach(function (m) {
      var dd = document.getElementById(m.dd);
      var menu = document.getElementById(m.menu);
      if (!dd || !menu) return;
      dd.onclick = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var willOpen = menu.hidden;
        closeJoinMenus(m.menu);
        menu.hidden = !willOpen;
        dd.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      };
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    document.addEventListener('click', function () { closeJoinMenus(null); });

    // Mikrofon seviye barları
    var bars = document.getElementById('tlcJoinMicBars');
    if (bars) {
      var html = '';
      for (var i = 0; i < 16; i++) html += '<i' + (i < 6 ? ' class="is-on"' : '') + '></i>';
      bars.innerHTML = html;
    }

    // Ses seçeneği kartı vurgusu
    document.querySelectorAll('input[name="tlcJoinAudio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var card = document.getElementById('tlcJoinComputerCard');
        if (card) card.classList.toggle('is-selected', r.value === 'computer' && r.checked);
      });
    });

    // İptal — kontrol merkezine dön
    var cancel = document.getElementById('tlcJoinCancel');
    if (cancel) cancel.onclick = function () { location.href = 'ogrenci-dashboard.html'; };
    var test = document.getElementById('tlcJoinTest');
    if (test) test.onclick = function (e) { e.preventDefault(); toast('Mikrofon ve hoparlör testi başlatıldı.'); };
  }

  function renderQuizOptions() {
    var type = el.quizType.value;
    var wrap = document.getElementById('tlcQuizOptionsWrap');
    var openWrap = document.getElementById('tlcQuizOpenWrap');
    var countSel = document.getElementById('tlcQuizCount');
    el.quizOptions.innerHTML = '';
    if (type === 'open_ended') {
      if (wrap) wrap.style.display = 'none';
      if (openWrap) openWrap.hidden = false;
      validateQuizForm();
      return;
    }
    if (wrap) wrap.style.display = 'block';
    if (openWrap) openWrap.hidden = true;
    if (countSel) countSel.style.display = (type === 'true_false') ? 'none' : 'block';
    var letters = ['A', 'B', 'C', 'D', 'E'];
    var isTF = type === 'true_false';
    var rows = isTF ? ['Doğru', 'Yanlış'] : letters.slice(0, countSel ? parseInt(countSel.value, 10) : 4);
    rows.forEach(function (label) {
      var row = document.createElement('div');
      row.className = 'tlc-quiz-option-row';
      if (isTF) {
        row.innerHTML = '<input type="radio" name="tlcQuizCorrect" aria-label="Doğru cevap">' +
          '<span class="tlc-quiz-opt-fixed">' + label + '</span>';
      } else {
        row.innerHTML = '<input type="radio" name="tlcQuizCorrect" aria-label="Doğru cevap">' +
          '<span class="tlc-quiz-opt-letter">' + label + '</span>' +
          '<input type="text" placeholder="' + label + ' şıkkı (opsiyonel)" aria-label="' + label + ' şıkkı">';
      }
      row.querySelector('input[type=radio]').onchange = validateQuizForm;
      var ti = row.querySelector('input[type=text]'); if (ti) ti.oninput = validateQuizForm;
      el.quizOptions.appendChild(row);
    });
    validateQuizForm();
  }

  function validateQuizForm() {
    var type = el.quizType.value;
    var ok = !!el.quizQuestion.value.trim();
    if (type === 'open_ended') {
      var ans = document.getElementById('tlcQuizOpenAnswer');
      ok = ok && !!(ans && ans.value.trim());
    } else {
      ok = ok && !!el.quizOptions.querySelector('input[type=radio]:checked');
    }
    el.quizSend.disabled = !ok;
  }

  function sendQuiz(e) {
    if (e) e.preventDefault();
    var type = el.quizType.value;
    var options = [];
    if (type !== 'open_ended') {
      el.quizOptions.querySelectorAll('.tlc-quiz-option-row').forEach(function (row, i) {
        var letter = row.querySelector('.tlc-quiz-opt-letter');
        var ti = row.querySelector('input[type=text]');
        var fixed = row.querySelector('.tlc-quiz-opt-fixed');
        var text = ti ? (ti.value.trim() || (letter ? letter.textContent : '')) : (fixed ? fixed.textContent : '');
        options.push({
          id: 'o' + i,
          text: text,
          isCorrect: row.querySelector('input[type=radio]').checked,
          voteCount: 0
        });
      });
    }
    var openAns = document.getElementById('tlcQuizOpenAnswer');
    var caseSens = document.getElementById('tlcQuizCaseSensitive');
    currentQuiz = {
      id: 'quiz-' + Date.now(),
      title: document.getElementById('tlcQuizTitle').value || 'Quiz',
      question: el.quizQuestion.value,
      type: type,
      options: options,
      correctAnswer: type === 'open_ended' && openAns ? openAns.value.trim() : null,
      caseSensitive: type === 'open_ended' && caseSens ? caseSens.checked : false,
      status: 'active',
      showResultsToStudents: document.getElementById('tlcQuizShowResults').checked,
      createdAt: new Date().toISOString()
    };
    quizResponses = [];
    participants.forEach(function (p) { if (p.role === 'student') p.quizAnswered = false; });
    stats.quizCount++;
    state.currentQuizId = currentQuiz.id;
    var cqm = document.getElementById('tlcCustomQuizModal'); if (cqm) cqm.hidden = true;
    el.quizResults.hidden = false;
    document.getElementById('tlcSqResults').hidden = true;
    setMainStage('quiz');
    document.getElementById('tlcQuizStageTitle').textContent = currentQuiz.title;
    document.getElementById('tlcQuizStageQ').textContent = currentQuiz.question || '—';
    renderQuizResults();
    toast('Soru gönderildi.');
    updateChips();
  }

  function quizResultHtml(quiz, responses, students, live) {
    var chip = function (name) { return '<span class="tlc-qr-chip">' + name + '</span>'; };
    var html = '';
    if (quiz.type === 'open_ended') {
      if (quiz.correctAnswer) html += '<div class="tlc-qr-note">Beklenen cevap: <strong>' + quiz.correctAnswer + '</strong></div>';
      if (!responses.length) return html + '<p class="tlc-preclass-meta">Henüz cevap yok.</p>';
      responses.forEach(function (r) {
        var st = r.isCorrect === true ? 'is-correct' : r.isCorrect === false ? 'is-wrong' : '';
        var mk = r.isCorrect === true ? '✓' : r.isCorrect === false ? '✗' : '?';
        html += '<div class="tlc-response-item">' +
          '<span class="tlc-qr-mark ' + st + '">' + mk + '</span> <strong>' + r.studentName + '</strong>: ' + (r.openEndedAnswer || '') +
          (live ? '<div style="margin-top:5px">' +
            '<button type="button" class="tlc-btn tlc-btn--sm" data-review="' + r.id + ':correct">✓ Doğru</button> ' +
            '<button type="button" class="tlc-btn tlc-btn--sm" data-review="' + r.id + ':wrong">✗ Yanlış</button> ' +
            '<button type="button" class="tlc-btn tlc-btn--sm" data-review="' + r.id + ':pending">?</button></div>' : '') +
          '</div>';
      });
      return html;
    }
    var total = quiz.options.reduce(function (s, o) { return s + (o.voteCount || 0); }, 0);
    quiz.options.forEach(function (o) {
      var pct = total ? Math.round((o.voteCount || 0) / total * 100) : 0;
      html += '<div class="tlc-qr-opt ' + (o.isCorrect ? 'is-correct' : '') + '">' +
        '<div class="tlc-qr-opt-top"><span>' + o.text + (o.isCorrect ? ' ✓' : '') + '</span><span>' + (o.voteCount || 0) + ' oy</span></div>' +
        '<div class="tlc-qr-bar"><span style="width:' + pct + '%"></span></div></div>';
    });
    var correct = responses.filter(function (r) { return r.isCorrect === true; });
    var wrong = responses.filter(function (r) { return r.isCorrect === false; });
    html += '<div class="tlc-qr-group is-correct"><strong>Doğru cevap verenler (' + correct.length + ')</strong>' +
      (correct.length ? correct.map(function (r) { return chip(r.studentName); }).join('') : '<span class="tlc-qr-empty">—</span>') + '</div>';
    html += '<div class="tlc-qr-group is-wrong"><strong>Yanlış cevap verenler (' + wrong.length + ')</strong>' +
      (wrong.length ? wrong.map(function (r) { return chip(r.studentName); }).join('') : '<span class="tlc-qr-empty">—</span>') + '</div>';
    if (live) {
      var waiting = (students || []).filter(function (p) { return !p.quizAnswered; });
      if (waiting.length) html += '<div class="tlc-qr-group"><strong>Bekleyen (' + waiting.length + ')</strong>' + waiting.map(function (p) { return chip(p.name); }).join('') + '</div>';
    }
    return html;
  }

  function renderQuizResults() {
    if (!currentQuiz) return;
    var students = participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
    var answered = students.filter(function (p) { return p.quizAnswered; }).length;
    document.getElementById('tlcQuizStageStats').textContent = answered + ' / ' + students.length + ' cevap verdi';
    el.quizResultsBody.innerHTML = quizResultHtml(currentQuiz, quizResponses, students, true);
    el.quizResultsBody.querySelectorAll('[data-review]').forEach(function (btn) {
      btn.onclick = function () {
        var parts = btn.dataset.review.split(':');
        var resp = quizResponses.find(function (r) { return r.id === parts[0]; });
        if (resp) {
          resp.isCorrect = parts[1] === 'correct' ? true : parts[1] === 'wrong' ? false : null;
          renderQuizResults();
        }
      };
    });
  }

  var completedQuizzes = [];
  function endCurrentQuiz() {
    if (!currentQuiz) return;
    currentQuiz.status = 'ended';
    var students = participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
    completedQuizzes.push({
      index: completedQuizzes.length + 1,
      title: currentQuiz.title,
      type: currentQuiz.type,
      question: currentQuiz.question,
      correctAnswer: currentQuiz.correctAnswer,
      options: (currentQuiz.options || []).map(function (o) { return { text: o.text, isCorrect: o.isCorrect, voteCount: o.voteCount || 0 }; }),
      responses: quizResponses.slice(),
      total: students.length
    });
    currentQuiz = null;
    renderQuizHistory();
    setMainStage('gallery');
    el.quizResults.hidden = true;
    toast(completedQuizzes.length + '. Soru tamamlandı.');
    updateChips();
  }

  function renderQuizHistory() {
    var wrap = document.getElementById('tlcQuizHistory');
    if (!wrap) return;
    if (!completedQuizzes.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = '<div class="tlc-qh-title">Geçmiş Sorular</div>' +
      completedQuizzes.slice().reverse().map(function (q) {
        var correct = q.responses.filter(function (r) { return r.isCorrect === true; }).length;
        var ans = q.responses.length;
        return '<button type="button" class="tlc-qh-box" data-quizidx="' + q.index + '">' +
          '<span class="tlc-qh-num">' + q.index + '. Soru</span>' +
          '<span class="tlc-qh-meta">' + (q.title || q.question || 'Soru') + '</span>' +
          '<span class="tlc-qh-stat">' + correct + ' doğru · ' + ans + ' cevap</span>' +
          '</button>';
      }).join('');
    wrap.querySelectorAll('[data-quizidx]').forEach(function (b) {
      b.onclick = function () { openQuizReview(+b.dataset.quizidx); };
    });
  }

  function openQuizReview(idx) {
    var q = completedQuizzes.filter(function (x) { return x.index === idx; })[0];
    if (!q) return;
    var modal = document.getElementById('tlcQuizReviewModal');
    if (!modal) return;
    document.getElementById('tlcQuizReviewTitle').textContent = q.index + '. Soru — Sonuçlar';
    document.getElementById('tlcQuizReviewQ').textContent = q.question || q.title || '';
    document.getElementById('tlcQuizReviewBody').innerHTML = quizResultHtml(q, q.responses, null, false);
    modal.hidden = false;
  }

  function simulateQuizAnswers(all) {
    if (!currentQuiz) return;
    var students = participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
    var targets = all ? students : students.filter(function (p) { return !p.quizAnswered; }).slice(0, 3);
    targets.forEach(function (p) {
      if (p.quizAnswered) return;
      p.quizAnswered = true;
      if (currentQuiz.type === 'open_ended') {
        quizResponses.push({
          id: 'r-' + p.id + '-' + Date.now(),
          quizId: currentQuiz.id,
          studentId: p.id,
          studentName: p.name,
          openEndedAnswer: ['x = 5', 'Karşıya atarız', '2x = 10', 'Denklem çözümü'][Math.floor(Math.random() * 4)],
          submittedAt: new Date().toISOString(),
          isCorrect: null
        });
      } else if (currentQuiz.options.length) {
        var opt = currentQuiz.options[Math.floor(Math.random() * currentQuiz.options.length)];
        opt.voteCount++;
        quizResponses.push({
          id: 'r-' + p.id, studentId: p.id, studentName: p.name,
          chosenText: opt.text, isCorrect: !!opt.isCorrect
        });
      }
    });
    var ans = students.filter(function (p) { return p.quizAnswered; }).length;
    toast(ans + ' öğrenciden ' + ans + ' cevap verdi.');
    renderQuizResults();
    renderGallery();
  }

  function openWhiteboard() {
    wbState.isWhiteboardActive = true;
    if (state.wbProjectedPdf) {
      wbState.background = { type: 'document', title: String(state.wbProjectedPdf).replace(/\.pdf$/i, ''), w: 1000, h: 1414 };
    } else {
      wbState.background = { type: 'blank', w: 1280, h: 760 };
    }
    setMainStage('whiteboard');
    // Varsayılan araç kalem → imleç de kalem (seçili renkte)
    wbState.selectedTool = 'pen';
    if (el.wbCanvas) el.wbCanvas.style.cursor = penCursor(wbState.selectedColor);
    syncWbLockUI();
    if (wbEngine) {
      wbEngine.resize();
      wbEngine.fitPage();
      setTimeout(function () { if (wbEngine) { wbEngine.resize(); wbEngine.fitPage(); updateWbZoomLabel(); } }, 70);
    }
    renderWbBadges();
  }

  function closeWhiteboard() {
    wbState.isWhiteboardActive = false;
    setMainStage('gallery');
    renderWbBadges();
  }

  function openWbPdfPicker() {
    var m = document.getElementById('tlcWbPdfModal');
    if (m) m.hidden = false;
    else openWhiteboard();
  }

  function chooseWbPdf(name) {
    var m = document.getElementById('tlcWbPdfModal');
    if (m) m.hidden = true;
    state.wbProjectedPdf = (name && name !== '__blank__') ? name : null;
    openWhiteboard();
    var tag = document.getElementById('tlcWbPdfTag');
    if (tag) {
      if (state.wbProjectedPdf) { tag.hidden = false; tag.textContent = '📄 ' + state.wbProjectedPdf + ' yansıtılıyor'; }
      else { tag.hidden = true; }
    }
    toast(state.wbProjectedPdf ? (state.wbProjectedPdf + ' tahtaya yansıtıldı.') : 'Boş tahta açıldı.');
  }

  function toggleFocusMode() {
    state.isFocusModeActive = !state.isFocusModeActive;
    toast(state.isFocusModeActive ? 'Odak modu başlatıldı.' : 'Odak modu kapatıldı.');
    updateChips();
    updateBottomActive();
  }

  function toggleWbLock() {
    state.isWhiteboardLocked = !state.isWhiteboardLocked;
    wbState.permission = state.isWhiteboardLocked ? 'locked' : (state.selectedWhiteboardStudentId ? 'selected_raised_hand_student_can_draw' : 'teacher_only');
    syncWbLockUI();
    toast(state.isWhiteboardLocked ? 'Tahta öğrencilere kilitlendi.' : 'Tahta kilidi açıldı.');
    renderWbBadges();
    updateChips();
  }

  function closeAllOverlays() {
    var hideIds = [
      'tlcWbPenPop', 'tlcWbEraserPop',
      'tlcAudioMenu', 'tlcCamMenu', 'tlcWbMenu', 'tlcBreakMenu',
      'tlcJoinMicMenu', 'tlcJoinSpkMenu', 'tlcJoinCamMenu',
      'tlcEndModal', 'tlcConfirmModal', 'tlcWbPdfModal', 'tlcScreenQModal', 'tlcQuickSendModal', 'tlcCustomQuizModal'
    ];
    hideIds.forEach(function (id) { var el2 = document.getElementById(id); if (el2 && !el2.hidden) el2.hidden = true; });
    document.querySelectorAll('[aria-expanded="true"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    var right = document.getElementById('tlcRight');
    if (right) right.classList.remove('is-open');
  }

  function syncWbLockUI() {
    var btn = document.getElementById('tlcWbLock');
    var badge = document.getElementById('tlcWbLockBadge');
    var locked = !!state.isWhiteboardLocked;
    if (btn) {
      btn.classList.toggle('is-locked', locked);
      btn.title = locked ? 'Tahta kilitli — açmak için tıkla' : 'Tahtayı öğrencilere kilitle';
      if (locked) {
        btn.style.setProperty('background', 'rgba(239,68,68,0.22)', 'important');
        btn.style.setProperty('color', '#fca5a5', 'important');
        btn.style.setProperty('border-color', '#ef4444', 'important');
      } else {
        btn.style.removeProperty('background');
        btn.style.removeProperty('color');
        btn.style.removeProperty('border-color');
      }
    }
    if (badge) badge.hidden = !locked;
  }

  function teacherCanDraw() {
    if (state.mainStageMode !== 'whiteboard') return false;
    if (state.isWhiteboardLocked || wbState.permission === 'locked') return false;
    return true;
  }

  function initWhiteboard() {
    wbEngine = new WB.WhiteboardEngine({
      canvas: el.wbCanvas,
      wbState: wbState,
      getCanDraw: teacherCanDraw,
      getCurrentStudentId: function () { return TEACHER_ID; },
      getAuthorName: function (id) {
        var p = getP(id);
        return p ? p.name : 'Furkan Çilingir';
      },
      onView: updateWbZoomLabel
    });
    wbEngine.bind();
    window.addEventListener('resize', function () { if (wbEngine) { wbEngine.resize(); if (wbState.background) wbEngine.fitPage(); } });
  }

  function updateWbZoomLabel() {
    var l = document.getElementById('tlcWbZoomLabel');
    if (l && wbEngine) l.textContent = wbEngine.zoomPercent() + '%';
  }

  function renderAll() {
    syncRaisedQueue();
    syncWbFlags();
    var inClass = participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; }).length;
    if (window.LiveClassIdentityHeader) {
      window.LiveClassIdentityHeader.update('#tlcIdentityMount', {
        activeStudentCount: inClass,
        elapsedSeconds: state.elapsed
      });
    }
    renderGallery();
    renderSpeaker();
    renderParticipantsPanel();
    renderRaisedPanel();
    renderChat();
    renderQuestions();
    renderReactions();
    renderWbPanel();
    renderWbBadges();
    renderWaitingRoom();
    updateChips();
    updateBottomActive();
    if (window.TeacherPermissionUI) window.TeacherPermissionUI.renderAll();
    if (window.TeacherCrisisUI) window.TeacherCrisisUI.renderAll();
    if (crisisManager) {
      var appEl = document.getElementById('tlcApp');
      if (appEl) {
        appEl.classList.remove('tlc-density--calm', 'tlc-density--active', 'tlc-density--incident');
        appEl.classList.add('tlc-density--' + crisisManager.state.densityMode);
      }
    }
    if (window.TeacherStudentInsight && window.TeacherStudentInsight.getOpenId()) window.TeacherStudentInsight.render();
  }

  function muteAll() {
    showConfirm('Tüm sınıfı sessize al', 'Tüm öğrencilerin mikrofonunu kapatmak istediğine emin misin?', function () {
      participants.forEach(function (p) {
        if (p.role === 'student') { p.micOn = false; p.isMutedByTeacher = true; }
      });
      toast('Tüm sınıf sessize alındı.');
      renderAll();
    });
  }

  function handleMock(action) {
    var parts = action.split(':');
    var cat = parts[0];
    var val = parts[1];
    if (cat === 'status') {
      if (val === 'preclass') setSessionStatus('preclass');
      else if (val === 'waiting_room') { setSessionStatus('waiting_room'); renderWaitingRoom(); }
      else if (val === 'live') { setSessionStatus('live'); startTimer(); }
      else if (val === 'break') { setSessionStatus('break'); startBreakTimer(); }
      else if (val === 'ended') setSessionStatus('ended');
      return;
    }
    if (cat === 'random') {
      var sts = participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
      var pick = sts.length ? sts[Math.floor(Math.random() * sts.length)] : null;
      if (!pick) return;
      if (val === 'join') { pick.isInWaitingRoom = false; toast(pick.name + ' derse katıldı.'); }
      if (val === 'leave') { pick.isInWaitingRoom = true; toast(pick.name + ' ayrıldı.'); }
      if (val === 'speak') {
        participants.forEach(function (p) { p.isSpeaking = false; });
        pick.isSpeaking = true;
        state.activeSpeakerId = pick.id;
      }
      if (val === 'hand') {
        if (state.isHandRaiseEnabled === false) {
          toast('El kaldırma izni kapalı.', true);
          return;
        }
        pick.isHandRaised = true;
        pick.handRaisedAt = Date.now();
        stats.handCount++;
        toast(pick.name + ' el kaldırdı.');
      }
      if (val === 'react') {
        var keys = ['clap', 'like', 'heart', 'confused', 'slow', 'fast'];
        var k = keys[Math.floor(Math.random() * keys.length)];
        state.reactions[k]++;
      }
      if (val === 'mute') {
        pick.micOn = false;
        pick.isMutedByTeacher = true;
        toast(pick.name + ' sessize alındı.');
      }
      if (val === 'req-mic') toast(pick.name + ' için mikrofon açma isteği gönderildi.');
      if (val === 'req-cam') toast(pick.name + ' için kamera açma isteği gönderildi.');
      if (val === 'cam-off') { pick.cameraOn = false; toast(pick.name + ' kamerası kapatıldı (mock).'); }
      syncRaisedQueue();
      renderAll();
      return;
    }
    if (cat === 'mute' && val === 'all') { muteAll(); return; }
    if (cat === 'wb') {
      if (val === 'open') openWhiteboard();
      if (val === 'close') closeWhiteboard();
      if (val === 'lock') toggleWbLock();
      if (val === 'select-raised') {
        var raised = Mock.sortRaisedHands(participants);
        if (raised.length) selectForWhiteboard(raised[0].id);
        else toast('El kaldıran yok.', true);
      }
      if (val === 'select-furkan') selectForWhiteboard('s0');
      if (val === 'select-not-raised') {
        var notRaised = participants.find(function (p) { return p.role === 'student' && !p.isHandRaised; });
        if (notRaised) selectForWhiteboard(notRaised.id);
      }
      if (val === 'mock-student-draw' && state.selectedWhiteboardStudentId && wbEngine) {
        var sp = getP(state.selectedWhiteboardStudentId);
        wbEngine.addStroke(WB.generateMockStroke(sp.id, sp.name, el.wbCanvas.clientWidth, el.wbCanvas.clientHeight, '#22C55E'));
      }
      if (val === 'mock-teacher-draw' && wbEngine) {
        wbEngine.addStroke(WB.generateMockStroke(TEACHER_ID, 'Furkan Çilingir', el.wbCanvas.clientWidth, el.wbCanvas.clientHeight, '#3B82FF'));
      }
      if (val === 'clear-students' && wbEngine) {
        wbEngine.clearStudentStrokes();
        toast('Öğrenci çizimleri temizlendi.');
      }
      if (val === 'clear-all' && wbEngine) {
        showConfirm('Tüm tahtayı temizle', 'Tüm whiteboard silinecek. Emin misin?', function () {
          wbState.strokes.forEach(function (s) { s.isDeleted = true; });
          wbEngine.render();
          toast('Tahta temizlendi.');
        });
      }
      return;
    }
    if (cat === 'sq') {
      if (window.TeacherScreenQuestion) window.TeacherScreenQuestion.handleMock(action);
      return;
    }
    if (cat === 'quiz') {
      if (val === 'mc') {
        el.quizType.value = 'single_choice';
        el.quizQuestion.value = '2x + 5 = 15 denkleminde x kaçtır?';
        renderQuizOptions();
        var texts = ['3', '5', '7', '10'];
        el.quizOptions.querySelectorAll('.tlc-quiz-option-row').forEach(function (row, i) {
          var ti = row.querySelector('input[type=text]'); if (ti && texts[i] != null) ti.value = texts[i];
          if (i === 1) row.querySelector('input[type=radio]').checked = true;
        });
        sendQuiz();
      }
      if (val === 'open') {
        el.quizType.value = 'open_ended';
        el.quizQuestion.value = 'Sence bu denklemde ilk adım ne olmalı?';
        sendQuiz();
      }
      if (val === 'simulate') simulateQuizAnswers(false);
      if (val === 'all-answered') simulateQuizAnswers(true);
      return;
    }
    if (cat === 'chat') {
      if (val === 'student') {
        chatMessages.push({ id: 'c-' + Date.now(), senderId: 's2', senderName: 'Ece Demir', type: 'student', content: 'Anladım hocam!', createdAt: Mock.fmtDuration(state.elapsed) });
        renderChat();
      }
      if (val === 'question') {
        questions.push({ id: 'q-' + Date.now(), studentId: 's5', studentName: 'Kerem Yıldız', content: 'Bu adımı tekrar eder misiniz?', status: 'waiting', createdAt: Mock.fmtDuration(state.elapsed) });
        renderQuestions();
        toast('Yeni soru geldi.');
      }
      if (val === 'toggle') {
        state.isChatEnabled = !state.isChatEnabled;
        toast(state.isChatEnabled ? 'Chat açıldı.' : 'Chat kapatıldı.');
        document.getElementById('tlcChatToggle').textContent = 'Chat: ' + (state.isChatEnabled ? 'Açık' : 'Kapalı');
      }
    }
    if (cat === 'crisis' && window.TeacherCrisisUI) {
      window.TeacherCrisisUI.applyScenario(val);
      return;
    }
  }

  function bindEvents() {
    document.getElementById('tlcStartClass').onclick = function () {
      setSessionStatus('waiting_room');
      renderWaitingRoom();
    };
    document.getElementById('tlcAcceptAll').onclick = function () {
      participants.forEach(function (p) { p.isInWaitingRoom = false; });
      toast('Tüm öğrenciler kabul edildi.');
      renderWaitingRoom();
    };
    document.getElementById('tlcGoLive').onclick = function () {
      participants.forEach(function (p) { p.isInWaitingRoom = false; });
      setSessionStatus('live');
      startTimer();
    };
    var endLessonBtn = document.getElementById('tlcEndLessonBtn');
    if (endLessonBtn) endLessonBtn.onclick = function () {
      document.getElementById('tlcEndModal').hidden = false;
    };
    document.getElementById('tlcEndCancel').onclick = function () {
      document.getElementById('tlcEndModal').hidden = true;
    };
    document.getElementById('tlcEndConfirm').onclick = function () {
      document.getElementById('tlcEndModal').hidden = true;
      setSessionStatus('ended');
    };
    document.getElementById('tlcConfirmCancel').onclick = function () {
      document.getElementById('tlcConfirmModal').hidden = true;
      confirmCallback = null;
    };
    document.getElementById('tlcConfirmOk').onclick = function () {
      document.getElementById('tlcConfirmModal').hidden = true;
      if (confirmCallback) confirmCallback();
      confirmCallback = null;
    };
    document.getElementById('tlcBackHome').onclick = function () { location.href = 'ogrenci-dashboard.html'; };

    var breakCaret = document.getElementById('tlcBreakCaret');
    if (breakCaret) breakCaret.onclick = function (e) { e.stopPropagation(); toggleBreakMenu(); };

    document.querySelectorAll('.tlc-tab').forEach(function (btn) {
      btn.onclick = function () { setPanelTab(btn.dataset.tab); };
    });

    document.querySelectorAll('#tlcPanelShortcuts [data-shortcut]').forEach(function (btn) {
      btn.onclick = function () {
        var a = btn.getAttribute('data-shortcut');
        if (a === 'wb-clear') {
          if (wbEngine) { wbEngine.clearStudentStrokes(); toast('Öğrenci çizimleri temizlendi.'); }
          return;
        }
        if (window.TeacherPermissionUI && window.TeacherPermissionUI.runDockAction) {
          window.TeacherPermissionUI.runDockAction(a);
        } else {
          toast('İşlem uygulandı.');
        }
      };
    });

    document.getElementById('tlcMicBtn').onclick = function () {
      var t = getP(TEACHER_ID);
      if (t) { t.micOn = !t.micOn; updateBottomActive(); }
    };
    document.getElementById('tlcCamBtn').onclick = function () {
      var t = getP(TEACHER_ID);
      if (t) { t.cameraOn = !t.cameraOn; updateBottomActive(); }
    };

    // Tüm modallar: dışarı tıkla + × ile kapat
    document.querySelectorAll('.tlc-modal-backdrop').forEach(function (bd) {
      bd.addEventListener('click', function (e) { if (e.target === bd) bd.hidden = true; });
    });
    document.querySelectorAll('.tlc-modal-close').forEach(function (btn) {
      btn.onclick = function () { var bd = btn.closest('.tlc-modal-backdrop'); if (bd) bd.hidden = true; };
    });

    // Öğretmen kendi video kutusu
    var selfMic = document.getElementById('tlcSelfMic');
    var selfCamBtn = document.getElementById('tlcSelfCamBtn');
    var selfAudio = document.getElementById('tlcSelfAudioSettings');
    var selfCamSet = document.getElementById('tlcSelfCamSettings');
    if (selfMic) selfMic.onclick = function (e) { e.stopPropagation(); document.getElementById('tlcMicBtn').click(); };
    if (selfCamBtn) selfCamBtn.onclick = function (e) { e.stopPropagation(); document.getElementById('tlcCamBtn').click(); };
    if (selfAudio) selfAudio.onclick = function (e) { e.stopPropagation(); var b = document.getElementById('tlcAudioMenuBtn'); if (b) b.click(); };
    if (selfCamSet) selfCamSet.onclick = function (e) { e.stopPropagation(); var b = document.getElementById('tlcCamMenuBtn'); if (b) b.click(); };
    syncSelfVideo();

    // Tam ekran
    var fsBtn = document.getElementById('tlcFullscreenBtn');
    if (fsBtn) fsBtn.onclick = function () {
      var appEl = document.getElementById('tlcApp');
      if (!document.fullscreenElement) {
        if (appEl.requestFullscreen) appEl.requestFullscreen().catch(function () {});
        else if (appEl.webkitRequestFullscreen) appEl.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', function () {
      if (fsBtn) fsBtn.classList.toggle('is-active', !!document.fullscreenElement);
    });

    // Self-video sürüklenebilir
    var sv = document.getElementById('tlcSelfVideo');
    if (sv) {
      var drag = null;
      sv.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.tlc-self-btn')) return;
        var r = sv.getBoundingClientRect();
        sv.style.left = r.left + 'px'; sv.style.top = r.top + 'px';
        sv.style.right = 'auto'; sv.style.bottom = 'auto';
        drag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
        sv.classList.add('is-dragging');
        try { sv.setPointerCapture(e.pointerId); } catch (err) {}
      });
      sv.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var nx = drag.ox + (e.clientX - drag.sx), ny = drag.oy + (e.clientY - drag.sy);
        nx = Math.max(4, Math.min(window.innerWidth - sv.offsetWidth - 4, nx));
        ny = Math.max(4, Math.min(window.innerHeight - sv.offsetHeight - 4, ny));
        sv.style.left = nx + 'px'; sv.style.top = ny + 'px';
      });
      var endDrag = function (e) { if (drag) { drag = null; sv.classList.remove('is-dragging'); try { sv.releasePointerCapture(e.pointerId); } catch (err) {} } };
      sv.addEventListener('pointerup', endDrag);
      sv.addEventListener('pointercancel', endDrag);
    }
    var stopShareBtn = document.getElementById('tlcStopShare');
    if (stopShareBtn) stopShareBtn.onclick = function () {
      state.isScreenSharing = false;
      setMainStage('gallery');
      updateChips();
    };
    var wbMenuBtn = document.getElementById('tlcWbMenuBtn');
    var wbMenu = document.getElementById('tlcWbMenu');
    function toggleWbMenu(force) {
      if (!wbMenu) return;
      var willOpen = (force === undefined) ? wbMenu.hidden : force;
      if (willOpen) closeCtrlMenus('tlcWbMenu');
      wbMenu.hidden = !willOpen;
      if (wbMenuBtn) wbMenuBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }
    document.getElementById('tlcWbBtn').onclick = function (e) {
      e.stopPropagation();
      if (state.mainStageMode === 'whiteboard') { closeWhiteboard(); toggleWbMenu(false); }
      else toggleWbMenu();
    };
    if (wbMenuBtn && wbMenu) {
      wbMenuBtn.onclick = function (e) { e.stopPropagation(); toggleWbMenu(); };
      document.addEventListener('click', function (e) {
        if (wbMenu.hidden) return;
        if (wbMenu.contains(e.target) || e.target === wbMenuBtn || wbMenuBtn.contains(e.target)) return;
        toggleWbMenu(false);
      });
      wbMenu.querySelectorAll('[data-wbopen]').forEach(function (item) {
        item.onclick = function () {
          toggleWbMenu(false);
          if (item.getAttribute('data-wbopen') === 'blank') chooseWbPdf('__blank__');
          else openWbPdfPicker();
        };
      });
    }
    // Ara Ver — süre seçim menüsü
    var breakBtn = document.getElementById('tlcBreakBtn');
    var breakMenu = document.getElementById('tlcBreakMenu');
    function toggleBreakMenu(force) {
      if (!breakMenu) return;
      var willOpen = (force === undefined) ? breakMenu.hidden : force;
      if (willOpen) closeCtrlMenus('tlcBreakMenu');
      breakMenu.hidden = !willOpen;
      if (breakBtn) breakBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }
    if (breakBtn && breakMenu) {
      breakBtn.onclick = function (e) {
        e.stopPropagation();
        if (state.sessionStatus === 'break') { endBreak(); toggleBreakMenu(false); }
        else toggleBreakMenu();
      };
      document.addEventListener('click', function (e) {
        if (breakMenu.hidden) return;
        if (breakMenu.contains(e.target) || e.target === breakBtn || breakBtn.contains(e.target)) return;
        toggleBreakMenu(false);
      });
      breakMenu.querySelectorAll('[data-break]').forEach(function (item) {
        item.onclick = function () {
          toggleBreakMenu(false);
          var secs = parseInt(item.getAttribute('data-break'), 10) || 300;
          state.breakSeconds = secs;
          setSessionStatus('break');
          startBreakTimer();
          toast('Ara verildi — ' + Math.round(secs / 60) + ' dakika.');
        };
      });
    }
    document.getElementById('tlcEndBreak').onclick = endBreak;
    var breakExtendBtn = document.getElementById('tlcBreakExtend');
    if (breakExtendBtn) breakExtendBtn.onclick = function () { extendBreak(300); };

    // Whiteboard PDF seçim modalı
    var wbPdfModal = document.getElementById('tlcWbPdfModal');
    if (wbPdfModal) {
      wbPdfModal.querySelectorAll('[data-wbpdf]').forEach(function (item) {
        item.onclick = function () { chooseWbPdf(item.getAttribute('data-wbpdf')); };
      });
      var wbPdfCancel = document.getElementById('tlcWbPdfCancel');
      if (wbPdfCancel) wbPdfCancel.onclick = function () { wbPdfModal.hidden = true; };
      wbPdfModal.addEventListener('click', function (e) { if (e.target === wbPdfModal) wbPdfModal.hidden = true; });
    }

    // Ses ayarları menüsü (mikrofon yanı dropdown)
    var audioBtn = document.getElementById('tlcAudioMenuBtn');
    var audioMenu = document.getElementById('tlcAudioMenu');
    if (audioBtn && audioMenu) {
      audioBtn.onclick = function (e) {
        e.stopPropagation();
        var willOpen = audioMenu.hidden;
        if (willOpen) closeCtrlMenus('tlcAudioMenu');
        audioMenu.hidden = !willOpen;
        audioBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      };
      document.addEventListener('click', function (e) {
        if (!audioMenu.hidden && !audioMenu.contains(e.target) && e.target !== audioBtn && !audioBtn.contains(e.target)) {
          audioMenu.hidden = true;
          audioBtn.setAttribute('aria-expanded', 'false');
        }
      });
      // Mikrofon seviye göstergesi (mock canlı bar animasyonu)
      var barsWrap = document.getElementById('tlcMicLevelBars');
      if (barsWrap) {
        var bars = '';
        for (var bi = 0; bi < 16; bi++) bars += '<i' + (bi < 7 ? ' class="is-on"' : '') + '></i>';
        barsWrap.innerHTML = bars;
      }
    }

    // Kamera ayarları menüsü (cihaz + Bilenyum arka planları)
    var camBtn = document.getElementById('tlcCamMenuBtn');
    var camMenu = document.getElementById('tlcCamMenu');
    if (camBtn && camMenu) {
      camBtn.onclick = function (e) {
        e.stopPropagation();
        var willOpen = camMenu.hidden;
        if (willOpen) closeCtrlMenus('tlcCamMenu');
        camMenu.hidden = !willOpen;
        camBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      };
      document.addEventListener('click', function (e) {
        if (!camMenu.hidden && !camMenu.contains(e.target) && e.target !== camBtn && !camBtn.contains(e.target)) {
          camMenu.hidden = true;
          camBtn.setAttribute('aria-expanded', 'false');
        }
      });
      camMenu.querySelectorAll('.tlc-bg-item').forEach(function (item) {
        item.onclick = function () {
          camMenu.querySelectorAll('.tlc-bg-item').forEach(function (b) { b.classList.remove('is-selected'); });
          item.classList.add('is-selected');
          state.cameraBackground = item.getAttribute('data-bg');
          toast('Arka plan: ' + item.getAttribute('data-bg-name'));
        };
      });
    }


    document.getElementById('tlcChatSend').onclick = sendChat;
    el.chatInput.onkeydown = function (e) { if (e.key === 'Enter') sendChat(); };
    document.getElementById('tlcChatToggle').onclick = function () {
      state.isChatEnabled = !state.isChatEnabled;
      this.textContent = 'Chat: ' + (state.isChatEnabled ? 'Açık' : 'Kapalı');
      toast(state.isChatEnabled ? 'Chat açıldı.' : 'Chat kapatıldı.');
    };

    el.quizType.onchange = renderQuizOptions;
    el.quizQuestion.oninput = validateQuizForm;
    var quizCount = document.getElementById('tlcQuizCount');
    if (quizCount) quizCount.onchange = renderQuizOptions;
    var quizOpenAns = document.getElementById('tlcQuizOpenAnswer');
    if (quizOpenAns) quizOpenAns.oninput = validateQuizForm;
    document.getElementById('tlcQuizForm').onsubmit = sendQuiz;
    // Kendin Soru Yaz → modal aç
    var askCustom = document.getElementById('tlcAskCustomBtn');
    var customQuizModal = document.getElementById('tlcCustomQuizModal');
    if (askCustom && customQuizModal) {
      askCustom.onclick = function () { customQuizModal.hidden = false; renderQuizOptions(); };
      customQuizModal.addEventListener('click', function (e) { if (e.target === customQuizModal) customQuizModal.hidden = true; });
    }
    var customQuizCancel = document.getElementById('tlcCustomQuizCancel');
    if (customQuizCancel) customQuizCancel.onclick = function () { customQuizModal.hidden = true; };
    document.getElementById('tlcSimulateAnswers').onclick = function () { simulateQuizAnswers(false); };
    document.getElementById('tlcToggleResults').onclick = function () {
      if (currentQuiz) {
        currentQuiz.showResultsToStudents = !currentQuiz.showResultsToStudents;
        toast(currentQuiz.showResultsToStudents ? 'Sonuçlar açıldı.' : 'Sonuçlar gizlendi.');
      }
    };
    document.getElementById('tlcEndQuiz').onclick = endCurrentQuiz;
    renderQuizHistory();

    var penPop = document.getElementById('tlcWbPenPop');
    var eraserPop = document.getElementById('tlcWbEraserPop');
    function hideWbPops() { if (penPop) penPop.hidden = true; if (eraserPop) eraserPop.hidden = true; }
    document.querySelectorAll('[data-wbtool]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var tool = btn.dataset.wbtool;
        wbState.selectedTool = tool;
        document.querySelectorAll('[data-wbtool]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        if (el.wbCanvas) {
          el.wbCanvas.style.cursor = tool === 'pointer' ? 'grab'
            : tool === 'pen' ? penCursor(wbState.selectedColor)
            : tool === 'eraser' ? ERASER_CURSOR
            : 'crosshair';
        }
        // Tek seferde tek popover: ilgilenen aracınkini aç, diğerini kapat
        hideWbPops();
        if (tool === 'pen' && penPop) penPop.hidden = false;
        else if (tool === 'eraser' && eraserPop) eraserPop.hidden = false;
      };
    });
    document.addEventListener('click', function (e) {
      if (penPop && !penPop.hidden && !penPop.contains(e.target) && !(e.target.closest && e.target.closest('[data-wbtool="pen"]'))) penPop.hidden = true;
      if (eraserPop && !eraserPop.hidden && !eraserPop.contains(e.target) && !(e.target.closest && e.target.closest('[data-wbtool="eraser"]'))) eraserPop.hidden = true;
    });
    function applyPenColor(color) {
      wbState.selectedColor = color;
      var ci = document.getElementById('tlcWbColor'); if (ci) ci.value = color;
      if (wbState.selectedTool === 'pen' && el.wbCanvas) el.wbCanvas.style.cursor = penCursor(color);
    }
    document.querySelectorAll('#tlcWbSwatches .tlc-wb-swatch').forEach(function (sw) {
      sw.onclick = function (e) {
        e.stopPropagation();
        var color = sw.getAttribute('data-color');
        applyPenColor(color);
        document.querySelectorAll('#tlcWbSwatches .tlc-wb-swatch').forEach(function (s) { s.classList.toggle('is-sel', s === sw); });
      };
    });
    var zin = document.getElementById('tlcWbZoomIn');
    var zout = document.getElementById('tlcWbZoomOut');
    var zfit = document.getElementById('tlcWbFit');
    if (zin) zin.onclick = function () { if (wbEngine) { wbEngine.zoomBy(1.2); updateWbZoomLabel(); } };
    if (zout) zout.onclick = function () { if (wbEngine) { wbEngine.zoomBy(1 / 1.2); updateWbZoomLabel(); } };
    if (zfit) zfit.onclick = function () { if (wbEngine) { wbEngine.fitPage(); updateWbZoomLabel(); } };
    document.getElementById('tlcWbColor').oninput = function () {
      applyPenColor(this.value);
      document.querySelectorAll('#tlcWbSwatches .tlc-wb-swatch').forEach(function (s) { s.classList.remove('is-sel'); });
    };
    document.getElementById('tlcWbWidth').oninput = function () { wbState.selectedWidth = +this.value; };
    function updateEraserDot() {
      var dot = document.getElementById('tlcWbEraserDot');
      if (dot) { var s = Math.round(wbState.eraserRadius || 18); dot.style.width = s + 'px'; dot.style.height = s + 'px'; }
    }
    document.getElementById('tlcWbEraser').oninput = function () { wbState.eraserRadius = +this.value; updateEraserDot(); };
    updateEraserDot();
    document.getElementById('tlcWbUndo').onclick = function () { if (wbEngine) wbEngine.undo(TEACHER_ID); };
    document.getElementById('tlcWbRedo').onclick = function () { if (wbEngine) wbEngine.redo(TEACHER_ID); };
    document.getElementById('tlcWbClearAll').onclick = function () {
      showConfirm('Tüm tahtayı temizle', 'Tüm çizimler silinecek. Emin misin?', function () {
        wbState.strokes.forEach(function (s) { s.isDeleted = true; });
        if (wbEngine) wbEngine.render();
      });
    };
    document.getElementById('tlcWbLock').onclick = toggleWbLock;
    document.getElementById('tlcWbClose').onclick = closeWhiteboard;

    document.getElementById('tlcMobilePanel').onclick = function () {
      document.getElementById('tlcRight').classList.toggle('is-open');
    };

    if (showMock) {
      el.mockToggle.hidden = false;
      el.mockToggle.onclick = function () { el.mockPanel.hidden = !el.mockPanel.hidden; };
    } else {
      el.mockToggle.hidden = true;
      el.mockPanel.hidden = true;
    }

    document.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      if (k === 'escape') { closeAllOverlays(); return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (k === 'm') document.getElementById('tlcMicBtn').click();
      if (k === 'v') document.getElementById('tlcCamBtn').click();
      if (k === 'w') document.getElementById('tlcWbBtn').click();
      if (k === 'q') { setPanelTab('quiz'); }
      if (k === 'h') { setPanelTab('raised_hands'); }
      if (k === 'c') { setPanelTab('chat'); }
      if (k === 'p') { setPanelTab('participants'); }
      if (k === 'f') toggleFocusMode();
      if ((e.ctrlKey || e.metaKey) && k === 'z') {
        e.preventDefault();
        if (wbEngine) wbEngine.undo(TEACHER_ID);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === 'z') {
        e.preventDefault();
        if (wbEngine) wbEngine.redo(TEACHER_ID);
      }
    });
  }

  function sendChat() {
    var text = el.chatInput.value.trim();
    if (!text || !state.isChatEnabled) return;
    chatMessages.push({
      id: 'c-' + Date.now(),
      senderId: TEACHER_ID,
      senderName: 'Furkan Çilingir',
      type: 'teacher',
      content: text,
      createdAt: Mock.fmtDuration(state.elapsed)
    });
    el.chatInput.value = '';
    renderChat();
  }

  (function () {
    var preTopic = document.getElementById('tlcPreTopic');
    if (preTopic) preTopic.textContent = topic;
  })();

  if (window.LiveClassIdentityHeader) {
    window.LiveClassIdentityHeader.mount('#tlcIdentityMount', {
      role: 'teacher',
      identity: Object.assign(window.LiveClassIdentityHeader.defaultTeacherIdentity(), {
        lessonTitle: subject,
        lessonTopic: topic,
        elapsedSeconds: 0,
        activeStudentCount: participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; }).length
      })
    });
  }

  var gamEngine = window.BilenyumGamification ? window.BilenyumGamification.createEngine() : null;
  if (gamEngine && window.BilenyumGamification) gamEngine.loadSeed(window.BilenyumGamification.seedEvents);
  var permMgr = window.BilenyumPermissionManager ? window.BilenyumPermissionManager.create({
    onEvent: function (ev) {
      if (ev.scope === 'class') toast('Sınıf izni: ' + ev.newValue);
    }
  }) : null;
  if (permMgr && window.BilenyumPermissionsSeed) {
    permMgr.initFromSeed(window.BilenyumPermissionsSeed.buildAllPermissionStates(), window.BilenyumPermissionsSeed.permissionEvents);
  }
  var studentInsights = window.StudentInsightsSeed ? window.StudentInsightsSeed.studentInsights : {};

  initWhiteboard();
  bindEvents();
  initJoinScreen();
  renderQuizOptions();
  setPanelTab('participants');
  if (window.TeacherScreenQuestion) {
    window.TeacherScreenQuestion.init({
      getParticipants: function () { return participants; },
      getParticipant: getP,
      toast: toast,
      setPanelTab: setPanelTab,
      updateChips: updateChips,
      renderAll: renderAll,
      fmtDuration: Mock.fmtDuration
    });
  }
  if (window.TeacherQuickAnswerBar && window.TeacherScreenQuestion) {
    window.TeacherQuickAnswerBar.init({
      teacherSq: window.TeacherScreenQuestion,
      openAdvanced: function () {
        var btn = document.getElementById('tlcOpenScreenQ');
        if (btn) btn.click();
      }
    });
  }
  if (window.TeacherStudentInsight) {
    window.TeacherStudentInsight.init({
      getP: getP,
      toast: toast,
      renderAll: renderAll,
      handleParticipantAction: handleParticipantAction,
      selectForWhiteboard: selectForWhiteboard,
      revokeWhiteboard: revokeWhiteboardPermission,
      lowerHand: lowerHand,
      insights: studentInsights,
      gamEngine: gamEngine,
      permMgr: permMgr
    });
  }
  if (window.TeacherPermissionUI) {
    window.TeacherPermissionUI.init({
      participants: participants,
      state: state,
      getP: getP,
      sortRaisedHands: Mock.sortRaisedHands,
      selectForWhiteboard: selectForWhiteboard,
      revokeWhiteboard: revokeWhiteboardPermission,
      lowerHand: lowerHand,
      muteAll: muteAll,
      toggleWbLock: toggleWbLock,
      toggleFocus: toggleFocus,
      showConfirm: showConfirm,
      toast: toast,
      renderAll: renderAll,
      insights: studentInsights,
      permMgr: permMgr
    });
  }
  if (window.BilenyumCrisisManager) {
    crisisManager = window.BilenyumCrisisManager.create();
    if (window.CrisisDemoSeed && crisisManager.state) {
      crisisManager.state.smartSuggestions = (window.CrisisDemoSeed.smartSuggestions || []).slice(0, 5);
    }
  }
  if (window.TeacherCrisisUI && crisisManager) {
    window.TeacherCrisisUI.init({
      participants: participants,
      state: state,
      wbState: wbState,
      wbEngine: wbEngine,
      crisisManager: crisisManager,
      getP: getP,
      sortRaisedHands: Mock.sortRaisedHands,
      selectForWhiteboard: selectForWhiteboard,
      revokeWhiteboard: revokeWhiteboardPermission,
      muteAll: muteAll,
      toggleWbLock: toggleWbLock,
      toggleFocus: toggleFocus,
      setPanelTab: setPanelTab,
      showConfirm: showConfirm,
      toast: toast,
      toastWithUndo: toastWithUndo,
      renderAll: renderAll,
      awardXp: function (id, amt) {
        if (gamEngine) gamEngine.awardXp(id, 'teacher_bonus_xp', { xpDelta: amt });
        if (studentInsights[id]) studentInsights[id].gamification.lessonXp += amt;
        toast('+' + amt + ' XP verildi.');
        renderAll();
      }
    });
  }
  if (showMock && window.TeacherDemoControls) {
    window.TeacherDemoControls.init({
      participants: participants,
      state: state,
      chatMessages: chatMessages,
      questions: questions,
      wbState: wbState,
      getP: getP,
      getWaiting: getWaitingRoomSeed,
      sortRaisedHands: Mock.sortRaisedHands,
      setSessionStatus: setSessionStatus,
      setMainStage: setMainStage,
      setPanelTab: setPanelTab,
      startTimer: startTimer,
      startBreakTimer: startBreakTimer,
      renderAll: renderAll,
      renderChat: renderChat,
      renderQuestions: renderQuestions,
      renderReactions: renderReactions,
      selectForWhiteboard: selectForWhiteboard,
      revokeWhiteboard: revokeWhiteboardPermission,
      toggleFocus: toggleFocus,
      loadDemoSeed: loadDemoSeed,
      handleMock: handleMock,
      toast: toast,
      fmtDuration: Mock.fmtDuration,
      openInsight: function (id) { if (window.TeacherStudentInsight) window.TeacherStudentInsight.open(id); },
      awardXp: function (id, amt) {
        if (gamEngine) gamEngine.awardXp(id, 'teacher_bonus_xp', { xpDelta: amt });
        if (studentInsights[id]) studentInsights[id].gamification.lessonXp += amt;
        toast('+' + amt + ' XP verildi.');
        renderAll();
      },
      applyCrisisScenario: function (id) {
        if (window.TeacherCrisisUI) window.TeacherCrisisUI.applyScenario(id);
      }
    });
  }
  if (window.LiveClassBridge) {
    window.LiveClassBridge.initTeacher({ participants: participants });
  }
  renderAll();

})();
