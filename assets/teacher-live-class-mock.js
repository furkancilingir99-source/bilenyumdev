(function (global) {
  'use strict';

  var Shared = global.LiveClassMock || {};
  var PEER_NAMES = Shared.PEER_NAMES || [
    'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir',
    'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir',
    'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir'
  ];
  var EMOJIS = ['🧑‍🎓', '🦁', '🦊', '🐯', '🦄', '🐺', '🐬', '🦋', '🦅', '🐱', '🐻', '🐼', '🦉'];
  var TEACHER_ID = 'teacher';

  function buildTeacherParticipants() {
    var list = [{
      id: TEACHER_ID,
      name: 'Furkan Çilingir',
      role: 'teacher',
      emoji: '👩‍🏫',
      cameraOn: true,
      micOn: true,
      isSpeaking: false,
      isHandRaised: false,
      reaction: null,
      connectionQuality: 'good',
      isPinned: false,
      isMutedByTeacher: false,
      isInWaitingRoom: false,
      isSelectedForWhiteboard: false,
      isSelf: true
    }];
    PEER_NAMES.slice(0, 12).forEach(function (name, i) {
      list.push({
        id: 's' + i,
        name: name,
        role: 'student',
        emoji: EMOJIS[i % EMOJIS.length],
        cameraOn: i % 3 !== 0,
        micOn: i === 2,
        isSpeaking: false,
        isHandRaised: i === 1 || i === 4,
        reaction: null,
        connectionQuality: i === 7 ? 'medium' : 'good',
        isPinned: false,
        isMutedByTeacher: false,
        isInWaitingRoom: i === 10 || i === 11,
        isSelectedForWhiteboard: false,
        isSelf: false,
        handRaisedAt: i === 1 || i === 4 ? Date.now() - (i * 60000) : null,
        quizAnswered: false
      });
    });
    return list;
  }

  function createTeacherState() {
    return {
      sessionStatus: 'preclass',
      mainStageMode: 'gallery',
      rightPanelTab: 'participants',
      isRecording: false,
      isFocusModeActive: false,
      isScreenSharing: false,
      isCaptionsEnabled: false,
      isChatEnabled: true,
      wbPermission: 'teacher_only',
      isWhiteboardLocked: false,
      activeSpeakerId: null,
      pinnedParticipantId: null,
      raisedHandQueue: [],
      selectedWhiteboardStudentId: null,
      currentQuizId: null,
      elapsed: 0,
      breakSeconds: 300,
      notifications: [],
      reactions: { clap: 0, like: 0, heart: 0, smile: 0, confused: 0, slow: 0, fast: 0 },
      recentReactions: []
    };
  }

  function syncRaisedQueue(parts) {
    return parts.filter(function (p) {
      return p.isHandRaised && p.role === 'student' && !p.isInWaitingRoom;
    }).sort(function (a, b) {
      return (a.handRaisedAt || 0) - (b.handRaisedAt || 0);
    }).map(function (p) { return p.id; });
  }

  function sortParticipants(parts, wbId) {
    var teacher = [], wb = [], raised = [], speaking = [], waiting = [], rest = [];
    parts.forEach(function (p) {
      if (p.role === 'teacher') teacher.push(p);
      else if (wbId && p.id === wbId) wb.push(p);
      else if (p.isHandRaised) raised.push(p);
      else if (p.isSpeaking) speaking.push(p);
      else if (p.isInWaitingRoom) waiting.push(p);
      else rest.push(p);
    });
    return teacher.concat(wb, raised, speaking, rest, waiting);
  }

  function sortRaisedHands(parts) {
    return parts.filter(function (p) {
      return p.isHandRaised && p.role === 'student' && !p.isInWaitingRoom;
    }).sort(function (a, b) { return (a.handRaisedAt || 0) - (b.handRaisedAt || 0); });
  }

  function demoChat() {
    return [
      { id: 'm1', senderId: 's0', senderName: 'Furkan Çilingir', type: 'student', content: 'Hocam denklemde x\'i nasıl buluyoruz?', createdAt: '09:05', questionStatus: 'waiting' },
      { id: 'm2', senderId: 's1', senderName: 'Deniz Kaya', type: 'student', content: 'Hazırız hocam!', createdAt: '09:02' },
      { id: 'm3', senderId: TEACHER_ID, senderName: 'Furkan Çilingir', type: 'teacher', content: 'Bugün doğrusal denklemleri işleyeceğiz.', createdAt: '09:00' }
    ];
  }

  function demoQuestions() {
    return [
      { id: 'q1', studentId: 's0', studentName: 'Furkan Çilingir', content: 'Denklemde x\'i nasıl buluyoruz?', status: 'waiting', createdAt: '09:05' },
      { id: 'q2', studentId: 's3', studentName: 'Zeynep Şahin', content: '5\'i karşı tarafa atınca işaret değişir mi?', status: 'seen', createdAt: '09:08' }
    ];
  }

  function buildLiveClassUrl(opts) {
    opts = opts || {};
    var p = new URLSearchParams();
    if (opts.subject) p.set('subject', opts.subject);
    if (opts.topic) p.set('topic', opts.topic);
    var s = p.toString();
    return 'ogretmen-canli-ders.html' + (s ? '?' + s : '');
  }

  global.TeacherLiveClassMock = {
    TEACHER_ID: TEACHER_ID,
    buildTeacherParticipants: buildTeacherParticipants,
    createTeacherState: createTeacherState,
    syncRaisedQueue: syncRaisedQueue,
    sortParticipants: sortParticipants,
    sortRaisedHands: sortRaisedHands,
    demoChat: demoChat,
    demoQuestions: demoQuestions,
    buildUrl: buildLiveClassUrl,
    fmtDuration: Shared.fmtDuration || function (sec) {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    },
    connClass: Shared.connClass || function () { return 'is-good'; }
  };

  global.BilenyumTeacherLiveClass = {
    buildUrl: buildLiveClassUrl,
    go: function (opts) { global.location.href = buildLiveClassUrl(opts); }
  };

})(typeof window !== 'undefined' ? window : this);
