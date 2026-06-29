(function (global) {
  'use strict';

  var SUBJECT_LABELS = {
    mat: 'LGS Matematik', fen: 'LGS Fen Bilimleri', trk: 'LGS Türkçe',
    ing: 'LGS İngilizce', sos: 'LGS Sosyal Bilgiler', din: 'LGS Din Kültürü'
  };

  var PEER_NAMES = [
    'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir',
    'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir', 'Furkan Çilingir',
    'Furkan Çilingir', 'Furkan Çilingir'
  ];

  var STUDENT_EMOJIS = ['🦁', '🦊', '🐯', '🦄', '🐺', '🐬', '🦋', '🦅', '🐱', '🐻', '🐼', '🦉'];

  var REACT_MAP = {
    clap: { emoji: '👏', label: 'Alkış' },
    like: { emoji: '👍', label: 'Beğendim' },
    heart: { emoji: '❤️', label: 'Kalp' },
    smile: { emoji: '😊', label: 'Gülümseme' },
    wow: { emoji: '😮', label: 'Şaşırdım' },
    confused: { emoji: '❓', label: 'Anlamadım' },
    slow: { emoji: '🐢', label: 'Yavaşla' },
    fast: { emoji: '⚡', label: 'Hızlan' }
  };

  var CONN_STATS = {
    excellent: { pingMs: 18, packetLoss: 0, bitrate: 1200, label: 'Mükemmel' },
    good: { pingMs: 42, packetLoss: 0.3, bitrate: 980, label: 'İyi' },
    medium: { pingMs: 88, packetLoss: 1.2, bitrate: 640, label: 'Orta' },
    poor: { pingMs: 156, packetLoss: 4.5, bitrate: 320, label: 'Zayıf' },
    critical: { pingMs: 280, packetLoss: 12, bitrate: 120, label: 'Kritik' },
    offline: { pingMs: 0, packetLoss: 100, bitrate: 0, label: 'Offline' }
  };

  var TEACHER_TOASTS = {
    teacher_started_screen_share: 'Öğretmen ekran paylaşımı başlattı.',
    teacher_stopped_screen_share: 'Öğretmen ekran paylaşımını durdurdu.',
    teacher_opened_whiteboard: 'Öğretmen beyaz tahtayı açtı.',
    teacher_closed_whiteboard: 'Öğretmen beyaz tahtayı kapattı.',
    teacher_selected_raised_hand_student_for_whiteboard: 'Öğrenci whiteboard\'a seçildi.',
    teacher_revoked_whiteboard_permission: 'Öğretmen whiteboard yazma iznini kapattı.',
    teacher_cleared_student_drawings: 'Öğrenci çizimleri temizlendi.',
    teacher_started_quiz: 'Quiz başladı.',
    teacher_started_poll: 'Anket başladı.',
    teacher_muted_all: 'Öğretmen herkesi sessize aldı.',
    teacher_muted_you: 'Öğretmen mikrofonunu kapattı.',
    teacher_allowed_you_to_speak: 'Öğretmen konuşmana izin verdi.',
    teacher_selected_you: 'Öğretmen seni cevaplamak için seçti.',
    teacher_started_break: 'Ders arası başladı.',
    teacher_ended_class: 'Ders sona erdi.',
    teacher_enabled_captions: 'Öğretmen altyazıyı açtı.',
    teacher_disabled_captions: 'Öğretmen altyazıyı kapattı.'
  };

  var MOCK_CAPTIONS = [
    'Öğretmen: Şimdi denklemi adım adım çözelim.',
    'Öğretmen: Önce 5\'i karşı tarafa atıyoruz.',
    'Öğretmen: Sonuç olarak x eşittir 5 oluyor.',
    'Deniz: Öğretmenim, neden 5\'i çıkardık?'
  ];

  var MOCK_QUIZ = {
    id: 'quiz-1',
    title: 'Mini Quiz — Denklem Çözme',
    question: '2x + 5 = 15 denkleminde x kaçtır?',
    type: 'single_choice',
    timeLimitSeconds: 45,
    explanation: '2x = 10 olduğu için x = 5\'tir.',
    options: [
      { id: 'a', text: 'A) 3', correct: false, voteCount: 12, pct: 12 },
      { id: 'b', text: 'B) 5', correct: true, voteCount: 58, pct: 58 },
      { id: 'c', text: 'C) 7', correct: false, voteCount: 22, pct: 22 },
      { id: 'd', text: 'D) 10', correct: false, voteCount: 8, pct: 8 }
    ]
  };

  var MOCK_POLL = {
    id: 'poll-1',
    question: 'Derste anlatım hızı uygun mu?',
    options: [
      { id: 'p1', text: 'Çok hızlı' },
      { id: 'p2', text: 'Uygun' },
      { id: 'p3', text: 'Biraz yavaş' }
    ]
  };

  var DEMO_CHAT = [
    { id: 'c1', senderId: 'teacher', senderName: 'Furkan Çilingir', type: 'teacher', content: 'Merhaba sınıf! Bugün doğrusal denklemleri birlikte çözeceğiz.', createdAt: '09:00' },
    { id: 'c2', senderId: 's0', senderName: 'Deniz Kaya', type: 'student', content: 'Hazırız hocam!', createdAt: '09:01' },
    { id: 'c3', senderId: 'teacher', senderName: 'Furkan Çilingir', type: 'teacher', content: 'Harika. Birazdan slayt paylaşacağım.', createdAt: '09:01' }
  ];

  function createInitialState(teacherName) {
    return {
      sessionStatus: 'prejoin',
      mainStageMode: 'speaker',
      rightPanelTab: 'chat',
      isFocusMode: false,
      isFullScreen: false,
      isRecording: false,
      isCaptionsEnabled: false,
      isCompactMode: false,
      connectionQuality: 'good',
      activeSpeakerId: 'teacher',
      pinnedParticipantId: null,
      raisedHandQueue: [],
      selectedWhiteboardStudentId: null,
      currentQuizId: null,
      currentPollId: null,
      micOn: false,
      camOn: false,
      handRaised: false,
      reactCooldown: false,
      shareZoom: 1,
      boardDraw: false,
      boardTool: 'pen',
      elapsed: 0,
      unreadChat: 0,
      chatOpen: true,
      device: {
        camPermission: true,
        micPermission: true,
        camFound: true,
        micFound: true,
        spkFound: true
      },
      notifications: [],
      messages: DEMO_CHAT.slice(),
      transcript: [],
      captionIndex: 0,
      quizAnswered: false,
      quizSelected: null,
      pollSelected: null,
      demoTimelineStarted: false,
      pushToTalk: false,
      micBeforePtt: false
    };
  }

  function buildParticipants(teacherName) {
    var list = [{
      id: 'teacher',
      name: teacherName || 'Furkan Çilingir',
      role: 'teacher',
      emoji: '👩‍🏫',
      cameraOn: true,
      micOn: true,
      isSpeaking: true,
      isHandRaised: false,
      reaction: null,
      connectionQuality: 'good',
      isPinned: false,
      isMutedByTeacher: false,
      isSelf: false
    }, {
      id: 'me',
      name: 'Furkan Çilingir',
      role: 'student',
      emoji: '🧑‍🎓',
      cameraOn: false,
      micOn: false,
      isSpeaking: false,
      isHandRaised: false,
      reaction: null,
      connectionQuality: 'good',
      isPinned: false,
      isMutedByTeacher: false,
      isSelf: true
    }];

    PEER_NAMES.forEach(function (name, i) {
      list.push({
        id: 's' + i,
        name: name,
        role: 'student',
        emoji: STUDENT_EMOJIS[i % STUDENT_EMOJIS.length],
        cameraOn: i % 3 !== 0,
        micOn: i === 2 || i === 5,
        isSpeaking: false,
        isHandRaised: i === 1,
        reaction: null,
        connectionQuality: i === 7 ? 'medium' : 'good',
        isPinned: false,
        isMutedByTeacher: false,
        isSelf: false
      });
    });
    return list;
  }

  function sortParticipants(list, selectedWbId) {
    var teacher = [], wbSel = [], raised = [], speaking = [], me = [], rest = [];
    list.forEach(function (p) {
      if (p.role === 'teacher') teacher.push(p);
      else if (selectedWbId && p.id === selectedWbId) wbSel.push(p);
      else if (p.isHandRaised) raised.push(p);
      else if (p.isSpeaking) speaking.push(p);
      else if (p.isSelf) me.push(p);
      else rest.push(p);
    });
    return teacher.concat(wbSel, raised, speaking, me, rest);
  }

  function sortGallery(list, selectedWbId) {
    var teacher = list.filter(function (p) { return p.role === 'teacher'; })[0];
    var others = list.filter(function (p) { return p.role !== 'teacher'; });
    others.sort(function (a, b) {
      if (selectedWbId && a.id === selectedWbId) return -1;
      if (selectedWbId && b.id === selectedWbId) return 1;
      if (a.isSelf && !b.isSelf) return -1;
      if (!a.isSelf && b.isSelf) return 1;
      if (a.isHandRaised && !b.isHandRaised) return -1;
      if (!a.isHandRaised && b.isHandRaised) return 1;
      if (a.isSpeaking && !b.isSpeaking) return -1;
      if (!a.isSpeaking && b.isSpeaking) return 1;
      return 0;
    });
    return teacher ? [teacher].concat(others) : others;
  }

  function syncRaisedHandQueue(participants) {
    return participants.filter(function (p) { return p.isHandRaised && p.role !== 'teacher'; }).map(function (p) { return p.id; });
  }

  function raisedPeer(list) {
    var raised = list.filter(function (p) { return p.isHandRaised && !p.isSelf && p.role !== 'teacher'; });
    return raised.length ? raised[Math.floor(Math.random() * raised.length)] : null;
  }

  function randomPeer(list) {
    var peers = list.filter(function (p) { return !p.isSelf && p.role !== 'teacher'; });
    return peers[Math.floor(Math.random() * peers.length)];
  }

  function connClass(q) {
    if (q === 'excellent' || q === 'good') return 'is-good';
    if (q === 'medium') return 'is-medium';
    if (q === 'poor' || q === 'critical') return 'is-poor';
    return 'is-offline';
  }

  function fmtDuration(sec) {
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    return [h, m, s].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
  }

  function buildLiveClassUrl(opts) {
    opts = opts || {};
    var p = new URLSearchParams();
    if (opts.subject) p.set('subject', opts.subject);
    if (opts.topic) p.set('topic', opts.topic);
    if (opts.teacher) p.set('teacher', opts.teacher);
    if (opts.teacherAvatar) p.set('teacherAvatar', opts.teacherAvatar);
    var s = p.toString();
    return 'ogrenci-canli-ders.html' + (s ? '?' + s : '');
  }

  global.LiveClassMock = {
    SUBJECT_LABELS: SUBJECT_LABELS,
    PEER_NAMES: PEER_NAMES,
    REACT_MAP: REACT_MAP,
    CONN_STATS: CONN_STATS,
    TEACHER_TOASTS: TEACHER_TOASTS,
    MOCK_CAPTIONS: MOCK_CAPTIONS,
    MOCK_QUIZ: MOCK_QUIZ,
    MOCK_POLL: MOCK_POLL,
    DEMO_CHAT: DEMO_CHAT,
    createInitialState: createInitialState,
    buildParticipants: buildParticipants,
    sortParticipants: sortParticipants,
    sortGallery: sortGallery,
    syncRaisedHandQueue: syncRaisedHandQueue,
    raisedPeer: raisedPeer,
    randomPeer: randomPeer,
    connClass: connClass,
    fmtDuration: fmtDuration,
    buildLiveClassUrl: buildLiveClassUrl
  };

  global.BilenyumLiveClass = {
    buildUrl: buildLiveClassUrl,
    go: function (opts) { global.location.href = buildLiveClassUrl(opts); }
  };

})(typeof window !== 'undefined' ? window : this);
