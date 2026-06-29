(function (global) {
  'use strict';

  var Mock = global.LiveClassMock;
  var WB = global.LiveClassWhiteboard;
  if (!Mock || !WB) return;

  var preJoin = document.getElementById('lcPreJoin');
  if (!preJoin) return;

  function qs(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  var subjectKey = qs('subject') || 'mat';
  var subjectLabel = Mock.SUBJECT_LABELS[subjectKey] || Mock.SUBJECT_LABELS.mat;
  var topicLabel = qs('topic') || 'Denklem Çözme';
  var teacherLabel = qs('teacher') || 'Furkan Çilingir';
  var lessonFull = subjectLabel + ' — ' + topicLabel;

  var state = Mock.createInitialState(teacherLabel);
  var wb = WB.createWhiteboardState();
  var participants = Mock.buildParticipants(teacherLabel);
  var wbEngine = null;
  var timers = [];
  var quizInterval = null;
  var quizCountdown = 45;
  var captionInterval = null;
  var breakInterval = null;
  var breakSeconds = 300;
  var demoTimelineIds = [];

  var el = {
    preJoin: preJoin,
    waiting: document.getElementById('lcWaiting'),
    live: document.getElementById('lcLive'),
    breakScreen: document.getElementById('lcBreak'),
    ended: document.getElementById('lcEnded'),
    pjSubject: document.getElementById('pjSubject'),
    pjTopic: document.getElementById('pjTopic'),
    pjTeacher: document.getElementById('pjTeacher'),
    pjCamPreview: document.getElementById('pjCamPreview'),
    pjMicMeter: document.getElementById('pjMicMeter'),
    pjJoin: document.getElementById('pjJoin'),
    pjCancel: document.getElementById('pjCancel'),
    pjStartCamOff: document.getElementById('pjStartCamOff'),
    pjStartMicOff: document.getElementById('pjStartMicOff'),
    pjDeviceError: document.getElementById('pjDeviceError'),
    waitTitle: document.getElementById('waitTitle'),
    waitLessonLabel: document.getElementById('waitLessonLabel'),
    waitTeacher: document.getElementById('waitTeacher'),
    waitAdmit: document.getElementById('waitAdmit'),
    waitLeave: document.getElementById('waitLeave'),
    lessonTitle: document.getElementById('lcLessonTitle'),
    teacherName: document.getElementById('lcTeacherName'),
    liveTimer: document.getElementById('lcLiveTimer'),
    statusChips: document.getElementById('lcStatusChips'),
    connBtn: document.getElementById('lcConnBtn'),
    connTip: document.getElementById('lcConnTip'),
    notifBtn: document.getElementById('lcNotifBtn'),
    notifBadge: document.getElementById('lcNotifBadge'),
    notifPanel: document.getElementById('lcNotifPanel'),
    notifList: document.getElementById('lcNotifList'),
    notifClear: document.getElementById('lcNotifClear'),
    galleryGrid: document.getElementById('lcGalleryGrid'),
    participantCount: document.getElementById('lcParticipantCount'),
    peopleCount: document.getElementById('lcPeopleCount'),
    peopleList: document.getElementById('lcPeopleList'),
    speakerStage: document.getElementById('lcSpeakerStage'),
    floatTeacher: document.getElementById('lcFloatTeacher'),
    viewSpeaker: document.getElementById('lcViewSpeaker'),
    viewShare: document.getElementById('lcViewShare'),
    viewBoard: document.getElementById('lcViewBoard'),
    viewEmpty: document.getElementById('lcViewEmpty'),
    shareMock: document.getElementById('lcShareMock'),
    boardEmpty: document.getElementById('lcBoardEmpty'),
    boardActive: document.getElementById('lcBoardActive'),
    boardPermission: document.getElementById('lcBoardPermission'),
    boardPermText: document.getElementById('lcBoardPermText'),
    boardPermIcon: document.getElementById('lcBoardPermIcon'),
    boardTools: document.getElementById('lcBoardTools'),
    boardColor: document.getElementById('lcBoardColor'),
    boardWidth: document.getElementById('lcBoardWidth'),
    drawCanvas: document.getElementById('lcDrawCanvas'),
    cursorsEl: document.getElementById('lcCursors'),
    captions: document.getElementById('lcCaptions'),
    captionsText: document.getElementById('lcCaptionsText'),
    sidebar: document.getElementById('lcSidebar'),
    chatFeed: document.getElementById('lcChatFeed'),
    chatEmpty: document.getElementById('lcChatEmpty'),
    chatPinned: document.getElementById('lcChatPinned'),
    chatForm: document.getElementById('lcChatForm'),
    chatInput: document.getElementById('lcChatInput'),
    chatAsQuestion: document.getElementById('lcChatAsQuestion'),
    chatBadge: document.getElementById('lcChatBadge'),
    quizBadge: document.getElementById('lcQuizBadge'),
    quizIdle: document.getElementById('lcQuizIdle'),
    quizBox: document.getElementById('lcQuizBox'),
    pollBox: document.getElementById('lcPollBox'),
    pollOpts: document.getElementById('lcPollOpts'),
    pollSubmit: document.getElementById('lcPollSubmit'),
    quizTimer: document.getElementById('lcQuizTimer'),
    quizQuestion: document.getElementById('lcQuizQuestion'),
    quizOpts: document.getElementById('lcQuizOpts'),
    quizSubmit: document.getElementById('lcQuizSubmit'),
    quizResult: document.getElementById('lcQuizResult'),
    quizVerdict: document.getElementById('lcQuizVerdict'),
    quizChart: document.getElementById('lcQuizChart'),
    notesEditor: document.getElementById('lcNotesEditor'),
    notesStamp: document.getElementById('lcNotesStamp'),
    notesShot: document.getElementById('lcNotesShot'),
    notesClear: document.getElementById('lcNotesClear'),
    notesPdf: document.getElementById('lcNotesPdf'),
    notesSave: document.getElementById('lcNotesSave'),
    transcriptList: document.getElementById('lcTranscriptList'),
    micBtn: document.getElementById('lcMicBtn'),
    camBtn: document.getElementById('lcCamBtn'),
    handBtn: document.getElementById('lcHandBtn'),
    reactBtn: document.getElementById('lcReactBtn'),
    reactMenu: document.getElementById('lcReactMenu'),
    captionsBtn: document.getElementById('lcCaptionsBtn'),
    focusBtn: document.getElementById('lcFocusBtn'),
    leaveModal: document.getElementById('lcLeaveModal'),
    leaveConfirm: document.getElementById('lcLeaveConfirm'),
    settingsModal: document.getElementById('lcSettingsModal'),
    reconnect: document.getElementById('lcReconnect'),
    reward: document.getElementById('lcReward'),
    toast: document.getElementById('lcToast'),
    breakTimer: document.getElementById('lcBreakTimer'),
    endedDuration: document.getElementById('lcEndedDuration'),
    endedNotes: document.getElementById('lcEndedNotes'),
    endedHome: document.getElementById('lcEndedHome'),
    mockPanel: document.getElementById('lcMockPanel'),
    mockToggle: document.getElementById('lcMockToggle'),
    mockBody: document.getElementById('lcMockBody')
  };

  function schedule(fn, ms) {
    var id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function getP(id) {
    for (var i = 0; i < participants.length; i++) {
      if (participants[i].id === id) return participants[i];
    }
    return null;
  }

  function syncRaisedHandQueue() {
    state.raisedHandQueue = Mock.syncRaisedHandQueue(participants);
  }

  function canCurrentStudentDraw() {
    return state.sessionStatus === 'live' &&
      state.mainStageMode === 'whiteboard' &&
      wb.isWhiteboardActive &&
      wb.permission === 'selected_raised_hand_student_can_draw' &&
      wb.selectedStudentId === 'me' &&
      state.connectionQuality !== 'offline';
  }

  function isOnWhiteboard(id) {
    return wb.selectedStudentId === id;
  }

  function updateBoardPermissionUI() {
    if (!el.boardPermText) return;
    var me = getP('me');
    var sel = wb.selectedStudentId ? getP(wb.selectedStudentId) : null;

    if (state.sessionStatus === 'ended') {
      el.boardPermText.textContent = 'Ders sona erdi.';
      if (el.boardPermIcon) el.boardPermIcon.textContent = '⏹';
    } else if (state.connectionQuality === 'offline') {
      el.boardPermText.textContent = 'Bağlantı kopukken whiteboard\'a yazamazsın.';
      if (el.boardPermIcon) el.boardPermIcon.textContent = '⚠️';
    } else if (wb.selectedStudentId === 'me') {
      el.boardPermText.textContent = 'Tahtadasın — yazdıkların herkes tarafından görülür.';
      if (el.boardPermIcon) el.boardPermIcon.textContent = '✏️';
      if (el.boardPermission) el.boardPermission.className = 'lc-board-permission is-active';
    } else if (sel) {
      el.boardPermText.textContent = sel.name + ' tahtada yazıyor.';
      if (el.boardPermIcon) el.boardPermIcon.textContent = '👀';
      if (el.boardPermission) el.boardPermission.className = 'lc-board-permission is-other';
    } else if (me && me.isHandRaised) {
      el.boardPermText.textContent = 'Parmak kaldırdın — öğretmenin seçerse yazabileceksin.';
      if (el.boardPermIcon) el.boardPermIcon.textContent = '✋';
      if (el.boardPermission) el.boardPermission.className = 'lc-board-permission is-waiting';
    } else {
      el.boardPermText.textContent = 'Sadece izleme — yazmak için parmak kaldır.';
      if (el.boardPermIcon) el.boardPermIcon.textContent = '🔒';
      if (el.boardPermission) el.boardPermission.className = 'lc-board-permission';
    }
  }

  function updateBoardToolsUI() {
    if (!el.boardTools) return;
    var canDraw = canCurrentStudentDraw();
    el.boardTools.classList.toggle('is-disabled', !canDraw);
    el.boardTools.querySelectorAll('.lc-btool, .lc-board-color, .lc-board-width').forEach(function (node) {
      if (node.id === 'lcBoardUndo' || node.id === 'lcBoardRedo' || node.id === 'lcBoardClearOwn') {
        node.disabled = !canDraw;
      } else if (node.dataset && node.dataset.tool === 'pointer') {
        node.disabled = false;
      } else {
        node.disabled = !canDraw;
      }
    });
    if (el.drawCanvas) {
      el.drawCanvas.classList.toggle('is-draw-enabled', canDraw);
      el.drawCanvas.classList.toggle('is-eraser-mode', canDraw && wb.selectedTool === 'eraser');
      el.drawCanvas.style.touchAction = canDraw ? 'none' : 'auto';
    }
  }

  function updateHandButtonUI() {
    if (!el.handBtn) return;
    var disabled = state.sessionStatus === 'ended' || state.connectionQuality === 'offline';
    el.handBtn.disabled = disabled;
    el.handBtn.classList.remove('is-on-board', 'is-raised');
    if (wb.selectedStudentId === 'me') {
      el.handBtn.classList.add('is-on-board', 'is-active');
      el.handBtn.title = 'Şu anda tahtadasın, yazdıkların herkes tarafından görülür';
      el.handBtn.querySelector('.lc-ctrl-label').textContent = 'Tahtada';
    } else if (state.handRaised) {
      el.handBtn.classList.add('is-raised', 'is-active');
      el.handBtn.title = 'Parmak kaldırdın, öğretmenin seni seçebilir';
      el.handBtn.querySelector('.lc-ctrl-label').textContent = 'Elin kalkık';
    } else {
      el.handBtn.title = 'Whiteboard\'a yazmak için parmak kaldır · H';
      el.handBtn.querySelector('.lc-ctrl-label').textContent = 'El';
    }
  }

  function selectForWhiteboard(studentId) {
    var p = getP(studentId);
    if (!p || p.role === 'teacher') {
      toast('Bu öğrenci parmak kaldırmadığı için whiteboard\'a seçilemez.');
      return false;
    }
    if (!p.isHandRaised) {
      toast('Bu öğrenci parmak kaldırmadığı için whiteboard\'a seçilemez.');
      return false;
    }
    if (wb.selectedStudentId && wb.selectedStudentId !== studentId) {
      var prev = getP(wb.selectedStudentId);
      if (prev) prev.isOnWhiteboard = false;
    }
    wb.selectedStudentId = studentId;
    state.selectedWhiteboardStudentId = studentId;
    p.isOnWhiteboard = true;
    if (studentId === 'me') {
      toast('Öğretmen seni whiteboard\'a kaldırdı. Artık yazı yazabilirsin.');
      addNotification('success', 'Whiteboard izni', 'Tahtada yazabilirsin.');
    } else {
      toast(p.name + ' whiteboard\'a yazıyor.');
    }
    if (state.mainStageMode !== 'whiteboard') openWhiteboard();
    updateBoardPermissionUI();
    updateBoardToolsUI();
    updateHandButtonUI();
    renderGallery();
    renderPeople();
    return true;
  }

  function revokeWhiteboardPermission() {
    if (!wb.selectedStudentId) return;
    var wasMe = wb.selectedStudentId === 'me';
    var p = getP(wb.selectedStudentId);
    if (p) p.isOnWhiteboard = false;
    wb.selectedStudentId = null;
    state.selectedWhiteboardStudentId = null;
    toast(wasMe ? 'Öğretmen whiteboard yazma iznini kapattı.' : 'Whiteboard yazma izni kaldırıldı.');
    updateBoardPermissionUI();
    updateBoardToolsUI();
    updateHandButtonUI();
    renderGallery();
    renderPeople();
  }

  function initWhiteboardEngine() {
    if (!el.drawCanvas || wbEngine) return;
    wbEngine = new WB.WhiteboardEngine({
      canvas: el.drawCanvas,
      wbState: wb,
      getCanDraw: canCurrentStudentDraw,
      getCurrentStudentId: function () { return 'me'; },
      getAuthorName: function (id) {
        var p = getP(id);
        return p ? p.name : 'Öğrenci';
      },
      onStrokeComplete: function () {
        toast('Yazın whiteboard\'a eklendi.');
        updateBoardToolsUI();
      }
    });
    wbEngine.bind();
    wbEngine.resize();
  }

  function toast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.toast.hidden = true; }, 2800);
  }

  function addNotification(type, title, desc) {
    var n = { id: 'n' + Date.now(), type: type, title: title, description: desc || '', createdAt: Mock.fmtDuration(state.elapsed) };
    state.notifications.unshift(n);
    if (state.notifications.length > 20) state.notifications.pop();
    renderNotifications();
    if (el.notifBadge) {
      el.notifBadge.hidden = false;
      el.notifBadge.textContent = String(state.notifications.length);
    }
  }

  function renderNotifications() {
    if (!el.notifList) return;
    if (!state.notifications.length) {
      el.notifList.innerHTML = '<p class="lc-panel-empty">Bildirim yok.</p>';
      return;
    }
    el.notifList.innerHTML = state.notifications.map(function (n) {
      return '<article class="lc-notif-item lc-notif-item--' + n.type + '">' +
        '<strong>' + esc(n.title) + '</strong>' +
        (n.description ? '<p>' + esc(n.description) + '</p>' : '') +
        '<time>' + esc(n.createdAt) + '</time></article>';
    }).join('');
  }

  /* —— Session screens —— */
  function showSession(status) {
    state.sessionStatus = status;
    var screens = {
      prejoin: el.preJoin,
      waiting_room: el.waiting,
      live: el.live,
      break: el.breakScreen,
      ended: el.ended
    };
    Object.keys(screens).forEach(function (k) {
      var node = screens[k];
      if (!node) return;
      var on = k === status;
      if (node === el.live) node.hidden = !on;
      else {
        node.hidden = !on;
        node.classList.toggle('is-active', on);
      }
    });
    if (status === 'reconnecting' || status === 'disconnected') {
      el.live.hidden = false;
      if (el.reconnect) el.reconnect.hidden = status !== 'reconnecting' && status !== 'disconnected';
    } else if (el.reconnect) {
      el.reconnect.hidden = true;
    }
    syncMockSelects();
  }

  function enterWaiting() {
    if (!state.device.camPermission || !state.device.micPermission) {
      showDeviceError();
      return;
    }
    state.micOn = !el.pjStartMicOff.checked;
    state.camOn = !el.pjStartCamOff.checked;
    syncMeParticipant();
    showSession('waiting_room');
  }

  function enterLive() {
    showSession('live');
    state.mainStageMode = 'speaker';
    syncRaisedHandQueue();
    setMainStageMode('speaker');
    syncMediaUI();
    renderGallery();
    renderPeople();
    renderSpeakerStage();
    renderFloatTeacher();
    renderChat();
    updateConnectionUI();
    updateChips();
    startLiveTimer();
    if (!state.demoTimelineStarted) {
      state.demoTimelineStarted = true;
      startDemoTimeline();
    }
  }

  function enterBreak() {
    showSession('break');
    breakSeconds = 300;
    clearInterval(breakInterval);
    breakInterval = setInterval(function () {
      breakSeconds--;
      if (el.breakTimer) {
        var m = Math.floor(breakSeconds / 60);
        var s = breakSeconds % 60;
        el.breakTimer.textContent = m + ':' + String(s).padStart(2, '0');
      }
      if (breakSeconds <= 0) {
        clearInterval(breakInterval);
        dispatchTeacherEvent('teacher_allowed_you_to_speak');
        showSession('live');
        toast('Ders devam ediyor.');
      }
    }, 1000);
  }

  function enterEnded() {
    revokeWhiteboardPermission();
    showSession('ended');
    if (el.endedDuration) el.endedDuration.textContent = Mock.fmtDuration(state.elapsed);
    if (window.StudentProgress) window.StudentProgress.renderLessonSummary();
    clearDemoTimeline();
  }

  function showDeviceError() {
    if (!el.pjDeviceError) return;
    var msgs = [];
    if (!state.device.camPermission) msgs.push('Kamera izni alınamadı.');
    if (!state.device.micPermission) msgs.push('Mikrofon izni alınamadı.');
    if (!state.device.camFound) msgs.push('Kamera bulunamadı.');
    if (!state.device.micFound) msgs.push('Mikrofon bulunamadı.');
    el.pjDeviceError.textContent = msgs.join(' ') + ' Tarayıcı ayarlarından izin ver.';
    el.pjDeviceError.hidden = false;
  }

  function hideDeviceError() {
    if (el.pjDeviceError) el.pjDeviceError.hidden = true;
  }

  /* —— Stage —— */
  function setMainStageMode(mode) {
    state.mainStageMode = mode;
    var map = { speaker: 'speaker', gallery: 'speaker', screen_share: 'share', whiteboard: 'board', quiz: 'speaker', empty: 'empty' };
    var view = map[mode] || 'speaker';
    var views = { speaker: el.viewSpeaker, share: el.viewShare, board: el.viewBoard, empty: el.viewEmpty };
    Object.keys(views).forEach(function (k) {
      if (!views[k]) return;
      var active = k === view;
      views[k].hidden = !active;
      views[k].classList.toggle('is-active', active);
    });
    if (el.live) {
      el.live.classList.toggle('is-compact', state.isCompactMode);
      el.live.classList.toggle('is-focus', state.isFocusMode);
    }
    updateChips();
    syncMockSelects();
  }

  function updateChips() {
    if (!el.statusChips) return;
    var html = '<span class="lc-chip is-live">Canlı</span>';
    if (state.mainStageMode === 'screen_share') html += '<span class="lc-chip is-share">Ekran paylaşılıyor</span>';
    if (state.mainStageMode === 'whiteboard') html += '<span class="lc-chip is-board">Beyaz tahta</span>';
    if (state.currentQuizId) html += '<span class="lc-chip is-quiz">Quiz aktif</span>';
    if (window.StudentScreenQuestion && window.StudentScreenQuestion.isActive()) {
      html += '<span class="lc-chip is-quiz">⚡ Ekrandaki soru</span>';
    }
    if (state.currentPollId) html += '<span class="lc-chip is-poll">Anket aktif</span>';
    if (state.isRecording) html += '<span class="lc-chip is-rec">Kayıt</span>';
    if (state.isFocusMode) html += '<span class="lc-chip">Odak modu</span>';
    el.statusChips.innerHTML = html;
  }

  function updateConnectionUI() {
    var stats = Mock.CONN_STATS[state.connectionQuality] || Mock.CONN_STATS.good;
    if (el.connTip) {
      el.connTip.textContent = 'Bağlantı ' + stats.label.toLowerCase() + ' · ' + stats.pingMs + 'ms · %' + stats.packetLoss + ' paket kaybı · ' + stats.bitrate + ' kbps';
    }
    if (el.connBtn) {
      el.connBtn.className = 'lc-icon-btn lc-conn ' + Mock.connClass(state.connectionQuality);
      if (state.connectionQuality === 'poor' || state.connectionQuality === 'critical') {
        el.connBtn.classList.add('is-shake');
      } else {
        el.connBtn.classList.remove('is-shake');
      }
    }
  }

  /* —— Video cards —— */
  function buildVideoCard(p, opts) {
    opts = opts || {};
    var card = document.createElement('div');
    card.className = 'lc-vid-card';
    card.dataset.id = p.id;
    card.setAttribute('role', 'listitem');
    if (p.role === 'teacher') card.classList.add('lc-vid-card--teacher');
    if (p.isSpeaking) card.classList.add('is-speaking');
    if (p.isHandRaised) card.classList.add('is-hand');
    if (isOnWhiteboard(p.id)) card.classList.add('is-on-board');
    if (!p.cameraOn) card.classList.add('is-cam-off');
    if (p.isPinned || state.pinnedParticipantId === p.id) card.classList.add('is-pinned');
    if (p.connectionQuality === 'poor' || p.connectionQuality === 'critical' || p.connectionQuality === 'medium') {
      card.classList.add('is-conn-weak');
    }

    var av = document.createElement('div');
    av.className = 'lc-vid-avatar';
    av.textContent = p.emoji;
    card.appendChild(av);

    if (p.role === 'teacher') {
      var lbl = document.createElement('span');
      lbl.className = 'lc-vid-label';
      lbl.textContent = 'EĞİTMEN';
      card.appendChild(lbl);
    }
    if (p.isSelf) {
      var you = document.createElement('span');
      you.className = 'lc-vid-you';
      you.textContent = 'Sen';
      card.appendChild(you);
    }
    if (p.isHandRaised) {
      var hand = document.createElement('span');
      hand.className = 'lc-vid-hand';
      hand.textContent = '✋';
      card.appendChild(hand);
    }
    if (isOnWhiteboard(p.id)) {
      var wbTag = document.createElement('span');
      wbTag.className = 'lc-vid-board';
      wbTag.textContent = 'Tahtada';
      card.appendChild(wbTag);
    }
    if (state.pinnedParticipantId === p.id) {
      var pin = document.createElement('span');
      pin.className = 'lc-vid-pin';
      pin.textContent = '📌';
      card.appendChild(pin);
    }

    var conn = document.createElement('span');
    conn.className = 'lc-vid-conn ' + Mock.connClass(p.connectionQuality);
    conn.title = 'Bağlantı: ' + (Mock.CONN_STATS[p.connectionQuality] || Mock.CONN_STATS.good).label;
    card.appendChild(conn);

    var mic = document.createElement('span');
    mic.className = 'lc-vid-mic ' + (p.micOn && !p.isMutedByTeacher ? 'is-on' : 'is-muted');
    card.appendChild(mic);

    var name = document.createElement('span');
    name.className = 'lc-vid-name';
    name.textContent = p.name.split(' ')[0];
    card.appendChild(name);

    if (opts.large) {
      card.style.cssText = 'width:100%;height:100%;aspect-ratio:auto;border-radius:16px';
    }

    card.addEventListener('dblclick', function () {
      state.pinnedParticipantId = state.pinnedParticipantId === p.id ? null : p.id;
      participants.forEach(function (x) { x.isPinned = x.id === state.pinnedParticipantId; });
      renderSpeakerStage();
      renderGallery();
      toast(state.pinnedParticipantId ? p.name + ' sabitlendi' : 'Sabitleme kaldırıldı');
    });

    return card;
  }

  function renderGallery() {
    if (!el.galleryGrid) return;
    el.galleryGrid.innerHTML = '';
    Mock.sortGallery(participants, wb.selectedStudentId).forEach(function (p) {
      el.galleryGrid.appendChild(buildVideoCard(p));
    });
    var studentCount = participants.filter(function (p) { return p.role !== 'teacher'; }).length;
    if (el.participantCount) el.participantCount.textContent = String(studentCount);
    if (el.peopleCount) el.peopleCount.textContent = String(participants.length);
  }

  function renderSpeakerStage() {
    if (!el.speakerStage) return;
    el.speakerStage.innerHTML = '';
    var id = state.pinnedParticipantId || state.activeSpeakerId || 'teacher';
    var p = getP(id) || getP('teacher');
    if (!p) return;
    var wrap = document.createElement('div');
    wrap.className = 'lc-speaker-card' + (p.isSpeaking ? ' is-speaking' : '');
    wrap.appendChild(buildVideoCard(p, { large: true }));
    el.speakerStage.appendChild(wrap);
  }

  function renderFloatTeacher() {
    if (!el.floatTeacher) return;
    el.floatTeacher.innerHTML = '';
    var t = getP('teacher');
    if (t) el.floatTeacher.appendChild(buildVideoCard(t));
  }

  function personStat(type, on) {
    var icons = {
      mic: '<path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/>',
      cam: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
      hand: '<path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
      board: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
    };
    var cls, title;
    if (type === 'hand') { cls = 'is-hand'; title = 'El kaldırdı'; }
    else if (type === 'board') { cls = 'is-board'; title = 'Tahtada'; }
    else { cls = on ? 'is-on' : 'is-off'; title = (type === 'mic' ? 'Mikrofon' : 'Kamera') + ' ' + (on ? 'açık' : 'kapalı'); }
    var slash = (type === 'mic' || type === 'cam') && !on ? '<line x1="2" y1="2" x2="22" y2="22"/>' : '';
    return '<span class="lc-person-stat ' + cls + '" title="' + title + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icons[type] + slash + '</svg></span>';
  }

  function renderPeople() {
    if (!el.peopleList) return;
    el.peopleList.innerHTML = '';
    Mock.sortParticipants(participants, wb.selectedStudentId).forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'lc-person' + (p.isHandRaised ? ' is-hand' : '') + (p.isSpeaking ? ' is-speaking' : '') + (isOnWhiteboard(p.id) ? ' is-on-board' : '');
      row.innerHTML =
        '<div class="lc-person-av">' + p.emoji + '</div>' +
        '<div class="lc-person-meta">' +
          '<div class="lc-person-name">' + esc(p.name) + '</div>' +
          '<div class="lc-person-role">' + (p.role === 'teacher' ? 'Eğitmen' : p.isSelf ? 'Sen' : 'Öğrenci') +
          (isOnWhiteboard(p.id) ? ' · Tahtada' : '') +
          (p.isSpeaking ? ' · Konuşuyor' : '') + '</div>' +
        '</div>' +
        '<div class="lc-person-icons">' +
          (isOnWhiteboard(p.id) ? personStat('board', true) : '') +
          (p.isHandRaised ? personStat('hand', true) : '') +
          personStat('mic', p.micOn && !p.isMutedByTeacher) +
          personStat('cam', p.cameraOn) +
          '<span class="lc-person-conn ' + Mock.connClass(p.connectionQuality) + '"></span>' +
        '</div>';
      el.peopleList.appendChild(row);
    });
  }

  function showReaction(pid, key) {
    var info = Mock.REACT_MAP[key];
    if (!info) return;
    var card = el.galleryGrid && el.galleryGrid.querySelector('[data-id="' + pid + '"]');
    if (!card) return;
    var overlay = document.createElement('span');
    overlay.className = 'lc-vid-react';
    overlay.textContent = info.emoji;
    card.appendChild(overlay);
    setTimeout(function () { overlay.remove(); }, 3000);
  }

  function syncMeParticipant() {
    var me = getP('me');
    if (!me) return;
    me.micOn = state.micOn;
    me.cameraOn = state.camOn;
    me.isHandRaised = state.handRaised;
  }

  function syncMediaUI() {
    syncMeParticipant();
    if (el.micBtn) {
      var micDisabled = !state.device.micPermission || !state.device.micFound || getP('me').isMutedByTeacher;
      el.micBtn.disabled = micDisabled;
      el.micBtn.classList.toggle('is-muted', !state.micOn);
      el.micBtn.classList.toggle('is-active', state.micOn);
      el.micBtn.setAttribute('aria-pressed', state.micOn ? 'true' : 'false');
    }
    if (el.camBtn) {
      el.camBtn.disabled = !state.device.camPermission || !state.device.camFound;
      el.camBtn.classList.toggle('is-off', !state.camOn);
      el.camBtn.classList.toggle('is-active', state.camOn);
      el.camBtn.setAttribute('aria-pressed', state.camOn ? 'true' : 'false');
    }
    if (el.handBtn) {
      el.handBtn.classList.toggle('is-active', state.handRaised || wb.selectedStudentId === 'me');
      el.handBtn.setAttribute('aria-pressed', state.handRaised ? 'true' : 'false');
    }
    updateHandButtonUI();
    renderGallery();
    renderPeople();
  }

  function toggleMic(silent) {
    if (getP('me').isMutedByTeacher) {
      toast('Öğretmen mikrofonunu kapattı.');
      return;
    }
    state.micOn = !state.micOn;
    syncMediaUI();
    if (!silent) toast(state.micOn ? 'Mikrofonun açıldı.' : 'Mikrofonun kapatıldı.');
  }

  function toggleCam(silent) {
    state.camOn = !state.camOn;
    syncMediaUI();
    if (!silent) toast(state.camOn ? 'Kameran açıldı.' : 'Kameran kapatıldı.');
  }

  function toggleHand() {
    if (state.sessionStatus === 'ended' || state.connectionQuality === 'offline') return;

    if (wb.selectedStudentId === 'me' && state.handRaised) {
      toast('Tahtadasın. Eli indirirsen yazma iznin kaldırılabilir.');
    }

    state.handRaised = !state.handRaised;
    var me = getP('me');
    if (me) me.isHandRaised = state.handRaised;

    if (!state.handRaised && wb.selectedStudentId === 'me') {
      revokeWhiteboardPermission();
    }

    syncRaisedHandQueue();
    syncMediaUI();

    if (state.handRaised) {
      toast('Parmak kaldırdın. Öğretmenin seni seçerse whiteboard\'a yazabileceksin.');
      addNotification('info', 'Parmak kaldırdın', 'Whiteboard için sıraya eklendin.');
      if (window.StudentProgress) window.StudentProgress.awardXp('hand_raised');
    } else {
      toast('Elini indirdin.');
    }
  }

  function sendReaction(key) {
    if (state.reactCooldown) { toast('Biraz bekle…'); return; }
    var info = Mock.REACT_MAP[key];
    if (!info) return;
    showReaction('me', key);
    closeReactMenu();
    state.reactCooldown = true;
    var msg = info.label === 'Yavaşla' || info.label === 'Anlamadım'
      ? 'Öğretmene geri bildirimin iletildi: ' + info.label
      : 'Reaksiyonun gönderildi: ' + info.label;
    toast(msg);
    schedule(function () { state.reactCooldown = false; }, 5000);
  }

  function closeReactMenu() {
    if (!el.reactMenu) return;
    el.reactMenu.hidden = true;
    if (el.reactBtn) {
      el.reactBtn.setAttribute('aria-expanded', 'false');
      el.reactBtn.classList.remove('is-react-open');
    }
  }

  function toggleReactMenu(e) {
    if (e) e.stopPropagation();
    if (!el.reactMenu || !el.reactBtn) return;
    var willOpen = el.reactMenu.hidden;
    el.reactMenu.hidden = !willOpen;
    el.reactBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    el.reactBtn.classList.toggle('is-react-open', willOpen);
  }

  /* —— Panels —— */
  function openTab(tab) {
    state.rightPanelTab = tab;
    state.chatOpen = tab === 'chat';
    if (tab === 'chat') state.unreadChat = 0;
    if (el.chatBadge) el.chatBadge.hidden = true;
    el.sidebar.style.display = '';
    document.querySelectorAll('.lc-tab').forEach(function (btn) {
      var on = btn.dataset.tab === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    var panels = { chat: 'Chat', people: 'People', quiz: 'Quiz', progress: 'Progress', status: 'Status', notes: 'Notes', transcript: 'Transcript' };
    Object.keys(panels).forEach(function (t) {
      var panel = document.getElementById('lcPanel' + panels[t]);
      if (panel) {
        var show = t === tab;
        panel.hidden = !show;
        panel.classList.toggle('is-active', show);
      }
    });
    document.querySelectorAll('.lc-ctrl[data-panel]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.dataset.panel === tab);
    });
  }

  function togglePanel(tab) {
    if (state.rightPanelTab === tab && el.sidebar.style.display !== 'none') {
      el.sidebar.style.display = 'none';
      state.rightPanelTab = null;
    } else {
      openTab(tab);
    }
  }

  /* —— Chat —— */
  function renderChat() {
    if (!el.chatFeed) return;
    el.chatFeed.innerHTML = '';
    if (!state.messages.length) {
      var empty = document.createElement('p');
      empty.className = 'lc-panel-empty';
      empty.textContent = 'Henüz mesaj yok. İlk mesajı sen gönderebilirsin.';
      el.chatFeed.appendChild(empty);
      return;
    }
    state.messages.forEach(function (m) { appendChatDOM(m); });
  }

  function appendChatDOM(m) {
    if (!el.chatFeed) return;
    var div = document.createElement('div');
    var cls = 'lc-msg lc-msg--' + (m.type === 'teacher' ? 'teacher' : m.type === 'student' && m.senderId === 'me' ? 'me' : m.type === 'system' ? 'sys' : m.type === 'question' ? 'question' : 'peer');
    div.className = cls;
    if (m.type !== 'system') {
      div.innerHTML = '<span class="lc-msg-author">' + esc(m.senderName) + '</span>' + esc(m.content);
    } else {
      div.textContent = m.content;
    }
    el.chatFeed.appendChild(div);
    el.chatFeed.scrollTop = el.chatFeed.scrollHeight;
  }

  function pushChat(msg) {
    state.messages.push(msg);
    appendChatDOM(msg);
    if (!state.chatOpen && msg.type !== 'system') {
      state.unreadChat++;
      if (el.chatBadge) { el.chatBadge.hidden = false; el.chatBadge.textContent = String(state.unreadChat); }
    }
  }

  function sendChat(text, asQuestion) {
    if (!text.trim()) return;
    var msg = {
      id: 'c' + Date.now(),
      senderId: 'me',
      senderName: 'Furkan Çilingir',
      type: asQuestion ? 'question' : 'student',
      content: text,
      createdAt: Mock.fmtDuration(state.elapsed),
      questionStatus: asQuestion ? 'waiting' : undefined
    };
    pushChat(msg);
    if (asQuestion && el.chatPinned) {
      var qa = document.createElement('div');
      qa.className = 'lc-qa-card';
      qa.dataset.qid = msg.id;
      qa.innerHTML = '<span class="lc-qa-tag is-wait">Cevap bekliyor</span><p>' + esc(text) + '</p>';
      el.chatPinned.appendChild(qa);
      schedule(function () {
        var tag = qa.querySelector('.lc-qa-tag');
        if (tag) { tag.className = 'lc-qa-tag is-seen'; tag.textContent = 'Öğretmen görüyor'; }
      }, 5000);
      addNotification('info', 'Soru iletildi', text.slice(0, 60));
      toast('Sorun öğretmene iletildi.');
    } else {
      toast('Mesajın gönderildi.');
    }
  }

  /* —— Quiz & Poll —— */
  function startQuiz() {
    state.currentQuizId = Mock.MOCK_QUIZ.id;
    state.quizAnswered = false;
    state.quizSelected = null;
    quizCountdown = Mock.MOCK_QUIZ.timeLimitSeconds;
    if (el.quizBadge) el.quizBadge.hidden = false;
    if (el.quizIdle) el.quizIdle.hidden = true;
    if (el.pollBox) el.pollBox.hidden = true;
    if (document.getElementById('lcScreenQBox')) document.getElementById('lcScreenQBox').hidden = true;
    if (el.quizBox) el.quizBox.hidden = false;
    if (el.quizResult) el.quizResult.hidden = true;
    if (el.quizQuestion) el.quizQuestion.textContent = Mock.MOCK_QUIZ.question;
    if (el.quizSubmit) el.quizSubmit.disabled = true;
    if (el.quizOpts) {
      el.quizOpts.innerHTML = '';
      Mock.MOCK_QUIZ.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lc-quiz-opt';
        btn.textContent = opt.text;
        btn.dataset.id = opt.id;
        btn.addEventListener('click', function () {
          if (state.quizAnswered) return;
          state.quizSelected = opt.id;
          el.quizOpts.querySelectorAll('.lc-quiz-opt').forEach(function (b) {
            b.classList.toggle('is-selected', b.dataset.id === opt.id);
          });
          if (el.quizSubmit) el.quizSubmit.disabled = false;
        });
        el.quizOpts.appendChild(btn);
      });
    }
    openTab('quiz');
    setMainStageMode('quiz');
    updateChips();
    pushChat({ id: 'sys-q', senderId: null, senderName: 'Sistem', type: 'system', content: '📊 ' + Mock.MOCK_QUIZ.title + ' başladı!', createdAt: Mock.fmtDuration(state.elapsed) });
    addNotification('info', 'Quiz başladı', Mock.MOCK_QUIZ.title);
    clearInterval(quizInterval);
    quizInterval = setInterval(function () {
      quizCountdown--;
      if (el.quizTimer) el.quizTimer.textContent = '⏱ 0:' + String(Math.max(0, quizCountdown)).padStart(2, '0');
      if (quizCountdown <= 0) {
        clearInterval(quizInterval);
        if (!state.quizAnswered) toast('Quiz süresi doldu.');
      }
    }, 1000);
  }

  function submitQuiz() {
    if (!state.quizSelected || state.quizAnswered) return;
    state.quizAnswered = true;
    clearInterval(quizInterval);
    var isCorrect = Mock.MOCK_QUIZ.options.some(function (o) { return o.id === state.quizSelected && o.correct; });
    el.quizOpts.querySelectorAll('.lc-quiz-opt').forEach(function (btn) {
      var opt = Mock.MOCK_QUIZ.options.find(function (o) { return o.id === btn.dataset.id; });
      btn.disabled = true;
      if (opt && opt.correct) btn.classList.add('is-correct');
      else if (btn.dataset.id === state.quizSelected && !isCorrect) btn.classList.add('is-wrong');
    });
    if (el.quizSubmit) el.quizSubmit.disabled = true;
    if (el.quizResult) el.quizResult.hidden = false;
    if (el.quizVerdict) el.quizVerdict.textContent = isCorrect ? '🎉' : '💪';
    if (el.quizChart) {
      el.quizChart.innerHTML = '<p class="lc-quiz-expl">' + esc(Mock.MOCK_QUIZ.explanation) + '</p>';
      Mock.MOCK_QUIZ.options.forEach(function (opt) {
        var row = document.createElement('div');
        row.className = 'lc-quiz-bar-row';
        row.innerHTML = '<span>' + esc(opt.text) + '</span><div class="lc-quiz-bar-track"><div class="lc-quiz-bar-fill"></div></div><span>' + opt.pct + '%</span>';
        el.quizChart.appendChild(row);
        schedule(function () { row.querySelector('.lc-quiz-bar-fill').style.width = opt.pct + '%'; }, 80);
      });
    }
    toast('Cevabın kaydedildi.');
    if (isCorrect) showReward('+25 XP');
  }

  function startPoll() {
    state.currentPollId = Mock.MOCK_POLL.id;
    if (el.quizIdle) el.quizIdle.hidden = true;
    if (el.quizBox) el.quizBox.hidden = true;
    if (document.getElementById('lcScreenQBox')) document.getElementById('lcScreenQBox').hidden = true;
    if (el.pollBox) el.pollBox.hidden = false;
    if (el.pollOpts) {
      el.pollOpts.innerHTML = '';
      Mock.MOCK_POLL.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lc-quiz-opt';
        btn.textContent = opt.text;
        btn.dataset.id = opt.id;
        btn.addEventListener('click', function () {
          state.pollSelected = opt.id;
          el.pollOpts.querySelectorAll('.lc-quiz-opt').forEach(function (b) {
            b.classList.toggle('is-selected', b === btn);
          });
        });
        el.pollOpts.appendChild(btn);
      });
    }
    openTab('quiz');
    updateChips();
    pushChat({ id: 'sys-p', senderId: null, senderName: 'Sistem', type: 'system', content: '📋 Anket başladı!', createdAt: Mock.fmtDuration(state.elapsed) });
    addNotification('info', 'Anket başladı', Mock.MOCK_POLL.question);
  }

  /* —— Whiteboard —— */
  function openWhiteboard() {
    state.mainStageMode = 'whiteboard';
    wb.isWhiteboardActive = true;
    setMainStageMode('whiteboard');
    if (el.boardEmpty) el.boardEmpty.hidden = true;
    if (el.boardActive) el.boardActive.hidden = false;
    if (el.boardTools) el.boardTools.hidden = false;
    initWhiteboardEngine();
    if (wbEngine && wb.strokes.length === 0) wbEngine.initTeacherDemo();
    else if (wbEngine) wbEngine.resize();
    updateBoardPermissionUI();
    updateBoardToolsUI();
  }

  function closeWhiteboard() {
    wb.isWhiteboardActive = false;
    revokeWhiteboardPermission();
    if (el.boardEmpty) el.boardEmpty.hidden = false;
    if (el.boardActive) el.boardActive.hidden = true;
    setMainStageMode('speaker');
  }

  function mockDrawForStudent(studentId) {
    if (!wbEngine || !wb.isWhiteboardActive) {
      openWhiteboard();
    }
    var p = getP(studentId);
    if (!p) return;
    if (wb.selectedStudentId !== studentId) selectForWhiteboard(studentId);
    var stroke = WB.generateMockStroke(studentId, p.name, el.drawCanvas.clientWidth, el.drawCanvas.clientHeight, p.isSelf ? '#FF2DAA' : '#22C55E');
    wbEngine.addStroke(stroke);
  }

  /* —— Captions —— */
  function toggleCaptions() {
    state.isCaptionsEnabled = !state.isCaptionsEnabled;
    if (el.captions) el.captions.hidden = !state.isCaptionsEnabled;
    if (el.captionsBtn) {
      el.captionsBtn.classList.toggle('is-active', state.isCaptionsEnabled);
      el.captionsBtn.setAttribute('aria-pressed', state.isCaptionsEnabled ? 'true' : 'false');
    }
    if (state.isCaptionsEnabled) startCaptions(); else stopCaptions();
    toast(state.isCaptionsEnabled ? 'Altyazı açıldı.' : 'Altyazı kapatıldı.');
  }

  function startCaptions() {
    stopCaptions();
    state.captionIndex = 0;
    if (el.captionsText) el.captionsText.textContent = Mock.MOCK_CAPTIONS[0];
    addTranscriptLine(Mock.MOCK_CAPTIONS[0]);
    captionInterval = setInterval(function () {
      state.captionIndex = (state.captionIndex + 1) % Mock.MOCK_CAPTIONS.length;
      var line = Mock.MOCK_CAPTIONS[state.captionIndex];
      if (el.captionsText) el.captionsText.textContent = line;
      addTranscriptLine(line);
    }, 4000);
  }

  function stopCaptions() {
    clearInterval(captionInterval);
    captionInterval = null;
  }

  function addTranscriptLine(line) {
    state.transcript.push({ text: line, at: Mock.fmtDuration(state.elapsed) });
    if (!el.transcriptList) return;
    if (state.transcript.length === 1) el.transcriptList.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'lc-transcript-row';
    row.innerHTML = '<time>' + esc(state.transcript[state.transcript.length - 1].at) + '</time><p>' + esc(line) + '</p>';
    el.transcriptList.appendChild(row);
    el.transcriptList.scrollTop = el.transcriptList.scrollHeight;
  }

  /* —— Teacher events —— */
  function dispatchTeacherEvent(event) {
    var msg = Mock.TEACHER_TOASTS[event];
    if (msg) toast(msg);
    addNotification('info', msg || event, '');

    switch (event) {
      case 'teacher_started_screen_share':
        setMainStageMode('screen_share');
        state.activeSpeakerId = 'teacher';
        setSpeaking('teacher');
        break;
      case 'teacher_stopped_screen_share':
        setMainStageMode('speaker');
        break;
      case 'teacher_opened_whiteboard':
        openWhiteboard();
        break;
      case 'teacher_closed_whiteboard':
        closeWhiteboard();
        toast('Öğretmen beyaz tahtayı kapattı.');
        break;
      case 'teacher_selected_raised_hand_student_for_whiteboard':
        break;
      case 'teacher_revoked_whiteboard_permission':
        revokeWhiteboardPermission();
        break;
      case 'teacher_cleared_student_drawings':
        if (wbEngine) wbEngine.clearStudentStrokes();
        toast('Öğretmen öğrenci çizimlerini temizledi.');
        break;
      case 'teacher_started_quiz':
        startQuiz();
        break;
      case 'teacher_started_poll':
        startPoll();
        break;
      case 'teacher_muted_all':
        participants.forEach(function (p) {
          if (p.role !== 'teacher') { p.micOn = false; p.isMutedByTeacher = true; }
        });
        state.micOn = false;
        syncMediaUI();
        break;
      case 'teacher_muted_you':
        state.micOn = false;
        getP('me').isMutedByTeacher = true;
        syncMediaUI();
        break;
      case 'teacher_allowed_you_to_speak':
        getP('me').isMutedByTeacher = false;
        break;
      case 'teacher_selected_you':
        state.activeSpeakerId = 'me';
        setSpeaking('me');
        setMainStageMode('speaker');
        break;
      case 'teacher_started_break':
        enterBreak();
        break;
      case 'teacher_ended_class':
        enterEnded();
        break;
      case 'teacher_enabled_captions':
        if (!state.isCaptionsEnabled) toggleCaptions();
        break;
      case 'teacher_disabled_captions':
        if (state.isCaptionsEnabled) toggleCaptions();
        break;
    }
    renderGallery();
    renderSpeakerStage();
    updateChips();
    updateBoardPermissionUI();
    updateBoardToolsUI();
  }

  function setSpeaking(id) {
    participants.forEach(function (p) { p.isSpeaking = p.id === id; });
    state.activeSpeakerId = id;
    renderGallery();
    renderPeople();
    renderSpeakerStage();
  }

  /* —— Demo scenarios —— */
  function clearDemoTimeline() {
    demoTimelineIds.forEach(clearTimeout);
    demoTimelineIds = [];
  }

  function startDemoTimeline() {
    clearDemoTimeline();
    demoTimelineIds.push(schedule(function () {
      pushChat({ id: 'c-auto1', senderId: 'teacher', senderName: teacherLabel, type: 'teacher', content: 'Slaytı paylaşıyorum.', createdAt: Mock.fmtDuration(state.elapsed) });
    }, 8000));
    demoTimelineIds.push(schedule(function () { dispatchTeacherEvent('teacher_started_screen_share'); }, 14000));
    demoTimelineIds.push(schedule(function () { dispatchTeacherEvent('teacher_opened_whiteboard'); }, 26000));
    demoTimelineIds.push(schedule(function () { dispatchTeacherEvent('teacher_started_quiz'); }, 38000));
  }

  function runScenario(name) {
    clearDemoTimeline();
    participants = Mock.buildParticipants(teacherLabel);
    state.quizAnswered = false;
    state.currentQuizId = null;
    state.currentPollId = null;

    switch (name) {
      case 'normal':
        showSession('live');
        setMainStageMode('speaker');
        setSpeaking('teacher');
        state.connectionQuality = 'good';
        updateConnectionUI();
        renderAll();
        break;
      case 'share':
        showSession('live');
        dispatchTeacherEvent('teacher_started_screen_share');
        break;
      case 'quiz':
        showSession('live');
        dispatchTeacherEvent('teacher_started_quiz');
        break;
      case 'weak':
        showSession('live');
        state.connectionQuality = 'poor';
        getP('me').connectionQuality = 'poor';
        updateConnectionUI();
        renderGallery();
        toast('Bağlantın zayıf.');
        addNotification('warning', 'Bağlantın zayıf', 'Video kalitesi düşürüldü.');
        break;
      case 'hand':
        showSession('live');
        state.handRaised = true;
        getP('me').isHandRaised = true;
        syncRaisedHandQueue();
        syncMediaUI();
        break;
      case 'whiteboard':
        showSession('live');
        state.handRaised = true;
        getP('me').isHandRaised = true;
        syncRaisedHandQueue();
        openWhiteboard();
        selectForWhiteboard('me');
        break;
      case 'ended':
        enterEnded();
        break;
    }
    syncMockSelects();
  }

  function renderAll() {
    syncMediaUI();
    renderGallery();
    renderPeople();
    renderSpeakerStage();
    renderFloatTeacher();
    renderChat();
    updateChips();
    if (window.StudentCrisisUI) {
      var sqActive = window.BilenyumScreenQuestion && window.BilenyumScreenQuestion.getActivePrompt && window.BilenyumScreenQuestion.getActivePrompt();
      window.StudentCrisisUI.renderAll({
        state: { handRaised: state.handRaised, isFocusMode: state.isFocusMode, connectionQuality: state.connectionQuality },
        chatMode: studentChatMode,
        chatEnabled: state.chatOpen !== false,
        connectionQuality: state.connectionQuality,
        wb: wb,
        participants: participants,
        quizActive: !!sqActive
      });
    }
  }

  var studentChatMode = 'open';

  function showReward(xp) {
    if (!el.reward) return;
    var xpEl = document.getElementById('lcRewardXp');
    if (xpEl) xpEl.textContent = xp;
    el.reward.hidden = false;
    schedule(function () { el.reward.hidden = true; }, 2400);
  }

  function startLiveTimer() {
    schedule(function tick() {
      if (state.sessionStatus === 'live') {
        state.elapsed++;
        if (el.liveTimer) el.liveTimer.textContent = Mock.fmtDuration(state.elapsed);
        if (window.LiveClassIdentityHeader) {
          window.LiveClassIdentityHeader.tickElapsed('#lcIdentityMount', state.elapsed);
        }
      }
      schedule(tick, 1000);
    }, 1000);
  }

  function syncMockSelects() {
    var ss = document.getElementById('mockSessionStatus');
    var sm = document.getElementById('mockStageMode');
    var mc = document.getElementById('mockConnection');
    if (ss) ss.value = state.sessionStatus;
    if (sm) sm.value = state.mainStageMode;
    if (mc) mc.value = state.connectionQuality;
    var rec = document.getElementById('mockRecording');
    var foc = document.getElementById('mockFocus');
    var cmp = document.getElementById('mockCompact');
    if (rec) rec.checked = state.isRecording;
    if (foc) foc.checked = state.isFocusMode;
    if (cmp) cmp.checked = state.isCompactMode;
  }

  function bindMockPanel() {
    if (!el.mockToggle) return;
    el.mockToggle.addEventListener('click', function () {
      var open = el.mockBody.hidden;
      el.mockBody.hidden = !open;
      el.mockToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.querySelectorAll('[data-scenario]').forEach(function (btn) {
      btn.addEventListener('click', function () { runScenario(btn.dataset.scenario); });
    });

    document.querySelectorAll('[data-tevent]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.sessionStatus !== 'live' && btn.dataset.tevent !== 'teacher_started_break') {
          showSession('live');
        }
        dispatchTeacherEvent(btn.dataset.tevent);
      });
    });

    document.querySelectorAll('[data-sq]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var SQ = window.BilenyumScreenQuestion;
        if (!SQ) return;
        var action = btn.dataset.sq;
        if (action === 'close') {
          SQ.publish('prompt_close', {});
          return;
        }
        if (state.sessionStatus !== 'live') enterLive();
        if (action === 'mc') {
          SQ.publish('prompt_start', SQ.createPrompt({
            mode: 'multiple_choice',
            durationSeconds: 45,
            options: [
              { id: 'sqo0', label: 'A', text: '3', isCorrect: false },
              { id: 'sqo1', label: 'B', text: '4', isCorrect: false },
              { id: 'sqo2', label: 'C', text: '5', isCorrect: true },
              { id: 'sqo3', label: 'D', text: '10', isCorrect: false }
            ]
          }));
        } else if (action === 'open') {
          SQ.publish('prompt_start', SQ.createPrompt({
            mode: 'open_ended',
            durationSeconds: 60,
            correctTextAnswer: '5',
            isCaseSensitive: false
          }));
        } else if (action === 'mc-blank') {
          SQ.publish('prompt_start', SQ.createPrompt({
            mode: 'multiple_choice',
            durationSeconds: 45,
            options: [
              { id: 'sqo0', label: 'A', text: '', isCorrect: false },
              { id: 'sqo1', label: 'B', text: '', isCorrect: false },
              { id: 'sqo2', label: 'C', text: '', isCorrect: true },
              { id: 'sqo3', label: 'D', text: '', isCorrect: false }
            ]
          }));
        }
      });
    });

    document.querySelectorAll('[data-sim]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.dataset.sim;
        if (action === 'random_speak') {
          var p = Mock.randomPeer(participants);
          if (p) setSpeaking(p.id);
        } else if (action === 'random_hand') {
          var p2 = Mock.randomPeer(participants);
          if (p2) { p2.isHandRaised = true; syncRaisedHandQueue(); renderGallery(); renderPeople(); }
        } else if (action === 'random_react') {
          var p3 = Mock.randomPeer(participants);
          var keys = Object.keys(Mock.REACT_MAP);
          if (p3) showReaction(p3.id, keys[Math.floor(Math.random() * keys.length)]);
        } else if (action === 'mute_all') {
          participants.forEach(function (p) { if (p.role !== 'teacher') p.micOn = false; });
          renderGallery(); renderPeople();
        } else if (action === 'cam_off_some') {
          participants.forEach(function (p, i) { if (!p.isSelf && p.role !== 'teacher' && i % 2 === 0) p.cameraOn = false; });
          renderGallery();
        } else if (action === 'weak_conn') {
          var p4 = Mock.randomPeer(participants);
          if (p4) { p4.connectionQuality = 'poor'; renderGallery(); renderPeople(); }
        }
      });
    });

    var ss = document.getElementById('mockSessionStatus');
    if (ss) ss.addEventListener('change', function () {
      var v = ss.value;
      if (v === 'prejoin') showSession('prejoin');
      else if (v === 'waiting_room') showSession('waiting_room');
      else if (v === 'live') enterLive();
      else if (v === 'break') enterBreak();
      else if (v === 'ended') enterEnded();
      else if (v === 'reconnecting') { showSession('live'); if (el.reconnect) { el.reconnect.hidden = false; el.reconnect.querySelector('p').textContent = 'Bağlantın koptu. Yeniden bağlanılıyor…'; } schedule(function () { if (el.reconnect) el.reconnect.hidden = true; toast('Yeniden bağlandın.'); }, 3000); }
      else if (v === 'disconnected') { showSession('live'); if (el.reconnect) { el.reconnect.hidden = false; el.reconnect.querySelector('p').textContent = 'Bağlantı koptu.'; } }
    });

    var sm = document.getElementById('mockStageMode');
    if (sm) sm.addEventListener('change', function () {
      var v = sm.value;
      if (v === 'screen_share') dispatchTeacherEvent('teacher_started_screen_share');
      else if (v === 'whiteboard') openWhiteboard();
      else if (v === 'quiz') startQuiz();
      else setMainStageMode(v);
    });

    var mc = document.getElementById('mockConnection');
    if (mc) mc.addEventListener('change', function () {
      state.connectionQuality = mc.value;
      if (state.connectionQuality === 'offline') {
        showSession('live');
        if (el.reconnect) el.reconnect.hidden = false;
      } else {
        if (el.reconnect) el.reconnect.hidden = true;
      }
      if (state.connectionQuality === 'critical' || state.connectionQuality === 'poor') {
        toast('Bağlantın zayıf.');
      }
      updateConnectionUI();
      renderGallery();
      updateBoardToolsUI();
      updateBoardPermissionUI();
    });

    ['mockCamPerm', 'mockMicPerm', 'mockCamDevice', 'mockMicDevice'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('change', function () {
        state.device.camPermission = document.getElementById('mockCamPerm').checked;
        state.device.micPermission = document.getElementById('mockMicPerm').checked;
        state.device.camFound = !document.getElementById('mockCamDevice').checked;
        state.device.micFound = !document.getElementById('mockMicDevice').checked;
        if (state.sessionStatus === 'prejoin') {
          if (state.device.camPermission && state.device.micFound) hideDeviceError();
          else showDeviceError();
        }
        syncMediaUI();
      });
    });

    var rec = document.getElementById('mockRecording');
    if (rec) rec.addEventListener('change', function () { state.isRecording = rec.checked; updateChips(); });

    var foc = document.getElementById('mockFocus');
    if (foc) foc.addEventListener('change', function () {
      state.isFocusMode = foc.checked;
      if (el.live) el.live.classList.toggle('is-focus', state.isFocusMode);
      if (el.focusBtn) el.focusBtn.classList.toggle('is-active', state.isFocusMode);
      updateChips();
    });

    var cmp = document.getElementById('mockCompact');
    if (cmp) cmp.addEventListener('change', function () {
      state.isCompactMode = cmp.checked;
      if (el.live) el.live.classList.toggle('is-compact', state.isCompactMode);
    });

    document.querySelectorAll('[data-wb]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.dataset.wb;
        if (state.sessionStatus !== 'live') enterLive();
        if (action === 'random_hand') {
          var p = Mock.randomPeer(participants);
          if (p) { p.isHandRaised = true; syncRaisedHandQueue(); renderGallery(); renderPeople(); }
        } else if (action === 'clear_hands') {
          participants.forEach(function (x) { if (x.role !== 'teacher') x.isHandRaised = false; });
          state.handRaised = false;
          revokeWhiteboardPermission();
          syncRaisedHandQueue();
          syncMediaUI();
        } else if (action === 'select_me') {
          if (!getP('me').isHandRaised) getP('me').isHandRaised = true;
          syncRaisedHandQueue();
          selectForWhiteboard('me');
        } else if (action === 'select_random') {
          var raised = Mock.raisedPeer(participants);
          if (raised) selectForWhiteboard(raised.id);
          else toast('El kaldıran öğrenci yok.');
        } else if (action === 'select_not_raised') {
          var notRaised = null;
          for (var i = 0; i < participants.length; i++) {
            var x = participants[i];
            if (!x.isHandRaised && x.role === 'student' && !x.isSelf) { notRaised = x; break; }
          }
          if (notRaised) selectForWhiteboard(notRaised.id);
        } else if (action === 'revoke') {
          revokeWhiteboardPermission();
        } else if (action === 'mock_draw_selected') {
          if (!wb.selectedStudentId) toast('Önce bir öğrenci seç.');
          else mockDrawForStudent(wb.selectedStudentId);
        } else if (action === 'mock_draw_random') {
          var r = Mock.raisedPeer(participants);
          if (r) mockDrawForStudent(r.id);
          else toast('El kaldıran öğrenci yok.');
        } else if (action === 'clear_strokes') {
          if (wbEngine) wbEngine.clearStudentStrokes();
          dispatchTeacherEvent('teacher_cleared_student_drawings');
        }
      });
    });
  }

  /* —— Board toolbar —— */
  function bindBoardTools() {
    document.querySelectorAll('.lc-btool[data-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        wb.selectedTool = btn.dataset.tool;
        document.querySelectorAll('.lc-btool[data-tool]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.classList.toggle('is-eraser', b.dataset.tool === 'eraser' && b === btn);
        });
        updateBoardToolsUI();
      });
    });
    if (el.boardColor) el.boardColor.addEventListener('input', function (e) {
      wb.selectedColor = e.target.value;
    });
    if (el.boardWidth) el.boardWidth.addEventListener('change', function (e) {
      wb.selectedWidth = parseInt(e.target.value, 10) || 3;
    });
    document.getElementById('lcBoardUndo').addEventListener('click', function () {
      if (wbEngine && wbEngine.undo('me')) toast('Son çizim geri alındı.');
    });
    document.getElementById('lcBoardRedo').addEventListener('click', function () {
      if (wbEngine && wbEngine.redo('me')) toast('Çizim yinelendi.');
    });
    document.getElementById('lcBoardClearOwn').addEventListener('click', function () {
      if (wbEngine && wbEngine.clearOwn('me')) toast('Kendi çizimlerin temizlendi.');
    });
    window.addEventListener('resize', function () {
      if (wbEngine) wbEngine.resize();
    });
  }

  /* —— Init labels —— */
  el.pjSubject.textContent = subjectLabel;
  el.pjTopic.textContent = topicLabel;
  el.pjTeacher.textContent = teacherLabel;
  el.waitLessonLabel.textContent = lessonFull;
  el.waitTeacher.textContent = teacherLabel;
  if (el.lessonTitle) el.lessonTitle.textContent = lessonFull;
  if (el.teacherName) el.teacherName.textContent = teacherLabel;

  if (window.LiveClassIdentityHeader) {
    window.LiveClassIdentityHeader.mount('#lcIdentityMount', {
      role: 'student',
      identity: Object.assign(window.LiveClassIdentityHeader.defaultStudentIdentity(), {
        studentName: 'Furkan Çilingir',
        lessonTitle: subjectLabel,
        lessonTopic: topicLabel,
        elapsedSeconds: 0
      })
    });
  }

  /* —— Events —— */
  el.pjJoin.addEventListener('click', enterWaiting);
  el.pjCancel.addEventListener('click', function () { history.back(); });
  el.waitLeave.addEventListener('click', function () { history.back(); });
  el.waitAdmit.addEventListener('click', enterLive);

  el.micBtn.addEventListener('click', function () { toggleMic(false); });
  el.camBtn.addEventListener('click', function () { toggleCam(false); });
  el.handBtn.addEventListener('click', toggleHand);

  el.chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    sendChat(el.chatInput.value, el.chatAsQuestion && el.chatAsQuestion.checked);
    el.chatInput.value = '';
    if (el.chatAsQuestion) el.chatAsQuestion.checked = false;
  });

  document.getElementById('lcChatEmoji').addEventListener('click', function () {
    el.chatInput.value += '😊';
    el.chatInput.focus();
  });

  if (el.quizSubmit) el.quizSubmit.addEventListener('click', submitQuiz);
  if (el.pollSubmit) el.pollSubmit.addEventListener('click', function () {
    if (!state.pollSelected) return;
    toast('Anket cevabın kaydedildi.');
    state.currentPollId = null;
    if (el.pollBox) el.pollBox.hidden = true;
    if (el.quizIdle) el.quizIdle.hidden = false;
    updateChips();
  });

  document.querySelectorAll('.lc-tab').forEach(function (btn) {
    btn.addEventListener('click', function () { openTab(btn.dataset.tab); });
  });

  document.querySelectorAll('.lc-ctrl[data-panel]').forEach(function (btn) {
    btn.addEventListener('click', function () { togglePanel(btn.dataset.panel); });
  });

  document.querySelectorAll('.lc-view-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.lc-view-btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });
      var v = btn.dataset.view;
      if (v === 'share') dispatchTeacherEvent('teacher_started_screen_share');
      else if (v === 'speaker') setMainStageMode('speaker');
      else setMainStageMode(state.mainStageMode === 'whiteboard' ? 'whiteboard' : 'speaker');
    });
  });

  document.querySelectorAll('.lc-share-tool').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var a = btn.dataset.zoom;
      if (a === 'in') state.shareZoom = Math.min(2, state.shareZoom + 0.15);
      else if (a === 'out') state.shareZoom = Math.max(0.6, state.shareZoom - 0.15);
      else state.shareZoom = 1;
      if (el.shareMock) el.shareMock.style.transform = 'scale(' + state.shareZoom + ')';
    });
  });

  el.reactBtn.addEventListener('click', toggleReactMenu);
  el.reactMenu.querySelectorAll('[data-react]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      sendReaction(btn.dataset.react);
    });
  });

  if (el.captionsBtn) el.captionsBtn.addEventListener('click', toggleCaptions);
  if (el.focusBtn) el.focusBtn.addEventListener('click', function () {
    state.isFocusMode = !state.isFocusMode;
    if (el.live) el.live.classList.toggle('is-focus', state.isFocusMode);
    el.focusBtn.classList.toggle('is-active', state.isFocusMode);
    updateChips();
    toast(state.isFocusMode ? 'Odak modu açıldı.' : 'Odak modu kapatıldı.');
  });

  ['lcLeaveBtn', 'lcLeaveTopBtn'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', function () { el.leaveModal.hidden = false; });
  });
  el.leaveConfirm.addEventListener('click', function () {
    el.leaveModal.hidden = true;
    toast('Dersten ayrıldın.');
    schedule(function () { location.href = 'dashboard.html'; }, 800);
  });

  ['lcSettingsBtn', 'lcSettingsBtn2', 'lcAudioBtn', 'lcVideoBtn'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.addEventListener('click', function () { el.settingsModal.hidden = false; });
  });
  document.querySelectorAll('[data-close-modal]').forEach(function (b) {
    b.addEventListener('click', function () { el.leaveModal.hidden = true; el.settingsModal.hidden = true; });
  });

  document.querySelectorAll('.lc-stab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.lc-stab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      document.querySelectorAll('.lc-spanel').forEach(function (p) { p.hidden = p.dataset.spanel !== btn.dataset.stab; });
    });
  });

  var fs = function () {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {});
    else document.exitFullscreen();
  };
  var lcFsBtn = document.getElementById('lcFullscreenBtn'); if (lcFsBtn) lcFsBtn.addEventListener('click', fs);
  var lcFsBtn2El = document.getElementById('lcFsBtn2'); if (lcFsBtn2El) lcFsBtn2El.addEventListener('click', fs);

  document.getElementById('lcHelpBtn').addEventListener('click', function () {
    toast('Yardım isteğin öğretmene iletildi.');
    addNotification('info', 'Yardım istendi', 'Öğretmen bilgilendirildi.');
  });

  if (el.notifBtn) el.notifBtn.addEventListener('click', function () {
    if (el.notifPanel) el.notifPanel.hidden = !el.notifPanel.hidden;
  });
  if (el.notifClear) el.notifClear.addEventListener('click', function () {
    state.notifications = [];
    renderNotifications();
    if (el.notifBadge) el.notifBadge.hidden = true;
  });

  if (el.notesEditor) {
    el.notesEditor.addEventListener('input', function () {
      el.notesSave.classList.add('is-visible');
      clearTimeout(el.notesEditor._saveT);
      el.notesEditor._saveT = setTimeout(function () { el.notesSave.classList.remove('is-visible'); }, 700);
    });
  }
  if (el.notesStamp) el.notesStamp.addEventListener('click', function () {
    var stamp = document.createElement('p');
    stamp.className = 'lc-notes-stamp';
    stamp.textContent = '🕐 ' + Mock.fmtDuration(state.elapsed);
    el.notesEditor.appendChild(stamp);
    openTab('notes');
  });
  if (el.notesShot) el.notesShot.addEventListener('click', function () {
    var shot = document.createElement('div');
    shot.className = 'lc-notes-shot-img';
    shot.innerHTML = '📸 ' + Mock.fmtDuration(state.elapsed) + ' · ' + state.mainStageMode;
    el.notesEditor.appendChild(shot);
    openTab('notes');
    toast('Notlarına ekran görüntüsü eklendi.');
  });
  if (el.notesClear) el.notesClear.addEventListener('click', function () {
    el.notesEditor.innerHTML = '';
    toast('Notlar temizlendi.');
  });
  if (el.notesPdf) el.notesPdf.addEventListener('click', function () {
    toast('PDF çıktısı mock olarak hazırlandı.');
  });

  if (el.endedNotes) el.endedNotes.addEventListener('click', function () { toast('PDF çıktısı mock olarak hazırlandı.'); });
  if (el.endedHome) el.endedHome.addEventListener('click', function () { location.href = 'dashboard.html'; });

  document.getElementById('lcSettingsCaptions').addEventListener('change', function (e) {
    if (e.target.checked !== state.isCaptionsEnabled) toggleCaptions();
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    var k = e.key.toLowerCase();
    if (k === 'm') { e.preventDefault(); toggleMic(false); }
    else if (k === 'v') { e.preventDefault(); toggleCam(false); }
    else if (k === 'h') { e.preventDefault(); toggleHand(); }
    else if (k === 'c') { e.preventDefault(); togglePanel('chat'); }
    else if (k === 'p') { e.preventDefault(); togglePanel('people'); }
    else if (k === 'n') { e.preventDefault(); togglePanel('notes'); }
    else if (k === 'q') { e.preventDefault(); togglePanel('quiz'); }
    else if (k === 'f') { e.preventDefault(); if (el.focusBtn) el.focusBtn.click(); }
    else if (k === 'escape') { el.leaveModal.hidden = true; el.settingsModal.hidden = true; if (el.notifPanel) el.notifPanel.hidden = true; }
    else if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      state.pushToTalk = true;
      state.micBeforePtt = state.micOn;
      if (!state.micOn && !getP('me').isMutedByTeacher) {
        state.micOn = true;
        syncMediaUI();
      }
    }
  });

  document.addEventListener('keyup', function (e) {
    if (e.code === 'Space' && state.pushToTalk) {
      state.pushToTalk = false;
      if (!state.micBeforePtt) {
        state.micOn = false;
        syncMediaUI();
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (el.reactMenu && !el.reactMenu.hidden && !e.target.closest('.lc-react-wrap')) {
      closeReactMenu();
    }
    if (el.notifPanel && !el.notifPanel.contains(e.target) && e.target !== el.notifBtn) {
      el.notifPanel.hidden = true;
    }
  });

  closeReactMenu();

  function animateMicMeter() {
    if (!el.pjMicMeter || state.sessionStatus !== 'prejoin') return;
    el.pjMicMeter.style.width = (20 + Math.random() * 60) + '%';
    schedule(animateMicMeter, 120);
  }

  bindMockPanel();
  bindBoardTools();
  animateMicMeter();
  setMainStageMode('speaker');
  renderNotifications();

  if (window.StudentActiveAnswerDock) {
    window.StudentActiveAnswerDock.init({
      openQuizTab: function () { openTab('quiz'); },
      updateChips: updateChips,
      toast: toast,
      esc: esc,
      fmtDuration: function (sec) {
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      },
      getStudentName: function () {
        var me = participants.filter(function (p) { return p.isSelf; })[0];
        return me ? me.name : 'Öğrenci';
      },
      showReward: function (xp) {
        showReward(xp);
        if (window.StudentProgress) window.StudentProgress.awardXp('quiz_answered', { xpDelta: parseInt(String(xp).replace(/\D/g, ''), 10) || 10 });
      }
    });
  }

  if (window.StudentScreenQuestion && window.BilenyumScreenQuestion) {
    window.StudentScreenQuestion.init({
      openQuizTab: function () { openTab('quiz'); },
      updateChips: updateChips,
      toast: toast,
      esc: esc,
      fmtDuration: function (sec) {
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      },
      getStudentName: function () {
        var me = participants.filter(function (p) { return p.isSelf; })[0];
        return me ? me.name : 'Öğrenci';
      },
      showReward: function (xp) {
        showReward(xp);
        if (window.StudentProgress) window.StudentProgress.awardXp('quiz_answered', { xpDelta: parseInt(String(xp).replace(/\D/g, ''), 10) || 10 });
      }
    });
  }

  var studentGamEngine = window.BilenyumGamification ? window.BilenyumGamification.createEngine() : null;
  if (window.StudentProgress) {
    var insightS0 = window.StudentInsightsSeed ? window.StudentInsightsSeed.studentInsights.s0 : null;
    var permS0 = window.BilenyumPermissionsSeed ? window.BilenyumPermissionsSeed.buildAllPermissionStates().s0 : null;
    window.StudentProgress.init({
      openTab: openTab,
      gamEngine: studentGamEngine,
      insightS0: insightS0,
      permState: permS0
    });
  }
  if (window.StudentCrisisUI) {
    window.StudentCrisisUI.init({
      toast: toast,
      chatMode: studentChatMode,
      onChatMode: function (mode) {
        studentChatMode = mode;
        state.chatOpen = mode !== 'muted' && mode !== 'exam_mode';
        renderAll();
      }
    });
  }

  if (window.LiveClassBridge) {
    window.LiveClassBridge.initStudent({});
  }

  /* Hide mock panel in production via ?demo=0 */
  if (qs('demo') === '0' && el.mockPanel) el.mockPanel.hidden = true;

})(typeof window !== 'undefined' ? window : this);
