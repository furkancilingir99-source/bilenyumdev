(function (global) {
  'use strict';

  function mkSituation(i, type, severity, title, desc, ids, actions) {
    return {
      id: 'sit-' + i,
      type: type,
      severity: severity,
      title: title,
      description: desc,
      affectedStudentIds: ids || [],
      suggestedActions: actions || [],
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
      isResolved: false
    };
  }

  var SITUATION_TEMPLATES = [
    mkSituation(1, 'open_microphones', 'warning', '2 açık mikrofon', 'Gürültü veya gereksiz açık mikrofon algılandı.', ['s1', 's7'], [{ id: 'a1', label: 'Açık mic kapat', actionType: 'mute_students', style: 'primary' }]),
    mkSituation(2, 'many_raised_hands', 'attention', '5 el kaldıran', 'Whiteboard kuyruğu birikti.', ['s0', 's2', 's3', 's4', 's10'], [{ id: 'a2', label: 'Sıradakini seç', actionType: 'select_next_student', style: 'primary' }]),
    mkSituation(3, 'whiteboard_clutter', 'warning', 'Whiteboard yoğun', 'Stroke sayısı eşiği aşıldı.', [], [{ id: 'a3', label: 'Öğrenci çizimlerini temizle', actionType: 'clear_student_drawings', style: 'secondary' }]),
    mkSituation(4, 'many_confused_reactions', 'attention', '4 anlamadım', 'Tempo uyarısı — konuyu tekrar açıklamak isteyebilirsin.', [], [{ id: 'a4', label: 'Odak modu', actionType: 'start_focus_mode', style: 'ghost' }]),
    mkSituation(5, 'connection_issues', 'critical', '2 bağlantı zayıf', 'Quiz ve whiteboard gecikebilir.', ['s3', 's9'], [{ id: 'a5', label: 'Bağlantı paneli', actionType: 'open_student_insight', style: 'secondary' }]),
    mkSituation(6, 'quiz_low_response', 'warning', '3 cevap vermedi', 'Aktif quiz\'e yanıt oranı düşük.', ['s5', 's8', 's11'], [{ id: 'a6', label: 'Süre uzat', actionType: 'extend_quiz_time', style: 'primary' }]),
    mkSituation(7, 'chat_spam', 'attention', 'Chat yoğun', 'Son 30 sn\'de çok mesaj.', [], [{ id: 'a7', label: 'Chat kapat', actionType: 'close_chat', style: 'danger' }]),
    mkSituation(8, 'background_noise', 'warning', 'Arka plan gürültüsü', 'Bora Çetin — gürültü algılandı.', ['s9'], [{ id: 'a8', label: 'Sustur', actionType: 'mute_students', style: 'primary' }])
  ];

  function generateSituations(count) {
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = SITUATION_TEMPLATES[i % SITUATION_TEMPLATES.length];
      out.push(Object.assign({}, t, { id: 'sit-gen-' + i, createdAt: new Date(Date.now() - i * 45000).toISOString() }));
    }
    return out;
  }

  function generateSmartSuggestions(count) {
    var pool = [
      { type: 'mute_noise', priority: 'high', title: 'Açık mikrofonlar', description: '2 öğrencinin mikrofonu açık görünüyor.', actionLabel: 'Kapat', action: 'mute-open-mics' },
      { type: 'select_raised_hand', priority: 'medium', title: 'El kaldırma kuyruğu', description: '5 öğrenci bekliyor. En uzun bekleyen: Furkan.', actionLabel: 'Tahtaya al', action: 'rq-next' },
      { type: 'lock_whiteboard', priority: 'high', title: 'Whiteboard yoğun', description: 'Çizim karışıklığı — temizlik veya kilitleme önerilir.', actionLabel: 'Kilitle', action: 'wb-lock' },
      { type: 'nudge_unanswered', priority: 'medium', title: 'Cevap vermeyenler', description: '3 öğrenci quiz\'e cevap vermedi.', actionLabel: 'Hatırlat', action: 'nudge-quiz' },
      { type: 'check_connection', priority: 'urgent', title: 'Bağlantı riski', description: 'Bora\'nın bağlantısı kritik.', actionLabel: 'Detay', action: 'insight:s9' },
      { type: 'slow_down', priority: 'medium', title: 'Tempo yavaşlat', description: '4 öğrenci yavaşla istedi.', actionLabel: 'Not al', action: 'none' },
      { type: 'extend_quiz', priority: 'high', title: 'Quiz süresini uzat', description: 'Cevap oranı %58.', actionLabel: '+30 sn', action: 'extend-quiz' },
      { type: 'give_xp', priority: 'low', title: 'Zeynep iyi açıklama yaptı', description: 'Bonus XP verilebilir.', actionLabel: '+25 XP', action: 'xp:s4:25' }
    ];
    var out = [];
    for (var i = 0; i < count; i++) {
      var p = pool[i % pool.length];
      out.push({
        id: 'sug-' + i,
        type: p.type,
        priority: p.priority,
        title: p.title,
        description: p.description,
        actionLabel: p.actionLabel,
        affectedStudentIds: [],
        createdAt: new Date(Date.now() - i * 30000).toISOString(),
        dismissed: false,
        action: p.action
      });
    }
    return out;
  }

  var CRISIS_SCENARIOS = [
    { id: 'open-mics', title: 'Gereksiz açık mikrofon', actions: ['crisis:open-mics'] },
    { id: 'bg-noise', title: 'Arka plan gürültüsü', actions: ['crisis:bg-noise'] },
    { id: 'multi-speak', title: '3 öğrenci konuşuyor', actions: ['crisis:multi-speak'] },
    { id: 'mic-off-speaking', title: 'Mic kapalı konuşuyor', actions: ['crisis:mic-off-speak'] },
    { id: 'wb-clutter', title: 'Whiteboard karıştı', actions: ['status:live', 'wb:open', 'crisis:wb-clutter'] },
    { id: 'wb-overtime', title: 'Öğrenci uzun yazıyor', actions: ['wb:open', 'hand:furkan', 'wb:select-furkan', 'crisis:wb-overtime'] },
    { id: 'wb-perm-left', title: 'WB izni açık kaldı', actions: ['crisis:wb-perm-open'] },
    { id: 'hands-queue', title: 'El kuyruğu birikti', actions: ['hand:raise5'] },
    { id: 'chat-spam', title: 'Chat spam', actions: ['crisis:chat-spam'] },
    { id: 'confused-wave', title: '5 anlamadım', actions: ['react:confused3', 'crisis:confused-more'] },
    { id: 'quiz-unanswered', title: '3 cevap vermedi', actions: ['sq:abcd', 'crisis:quiz-unanswered'] },
    { id: 'conn-critical', title: 'Bağlantı kritik', actions: ['conn:weak-random', 'crisis:conn-critical'] },
    { id: 'offline-quiz', title: 'Offline quiz sırasında', actions: ['sq:abcd', 'conn:offline-s11'] },
    { id: 'focus-needed', title: 'Odak modu gerekli', actions: ['crisis:focus-needed'] },
    { id: 'calm-mode', title: 'Sakin mod (calm)', actions: ['crisis:calm'] },
    { id: 'incident-mode', title: 'Yoğun kriz (incident)', actions: ['crisis:heavy'] },
    { id: 'crisis-calm', title: 'Kriz sakinleştirme', actions: ['crisis:calm-down'] },
    { id: 'chat-exam', title: 'Chat sınav modu', actions: ['preset:exam'] },
    { id: 'quiz-end-warning', title: 'Quiz açık kaldı', actions: ['sq:abcd', 'crisis:quiz-stale'] },
    { id: 'heavy-all', title: 'Yoğun kriz hepsi', actions: ['crisis:heavy'] }
  ];

  var PERMISSION_PRESETS = {
    lecture_mode: { label: 'Anlatım Modu', desc: 'Mic kapalı, chat açık, WB öğretmen', keys: { canUseMicrophone: false, canSendChat: true, canRaiseHand: true, canDrawOnWhiteboard: false } },
    problem_solving: { label: 'Soru Çözüm Modu', desc: 'El kaldırma + sıralı WB', keys: { canRaiseHand: true, canAnswerQuiz: true } },
    quiz_mode: { label: 'Quiz Modu', desc: 'Mic/chat kapalı, quiz açık', keys: { canUseMicrophone: false, canSendChat: false, canDrawOnWhiteboard: false, isFocusLocked: true } },
    free_discussion: { label: 'Serbest Tartışma', desc: 'Chat ve reaksiyon açık', keys: { canSendChat: true, canUseReactions: true } },
    crisis_calm: { label: 'Kriz Sakinleştirme', desc: 'Tüm dikkat dağıtıcılar kapalı', keys: { canUseMicrophone: false, canSendChat: false, canDrawOnWhiteboard: false, isFocusLocked: true } }
  };

  global.CrisisDemoSeed = {
    situations: generateSituations(40),
    smartSuggestions: generateSmartSuggestions(30),
    CRISIS_SCENARIOS: CRISIS_SCENARIOS,
    PERMISSION_PRESETS: PERMISSION_PRESETS,
    openMicrophoneEvents: [
      { id: 'om-1', studentId: 's1', studentName: 'Deniz Kaya', micLevel: 0.7, noiseType: 'background_noise', durationSeconds: 45, severity: 'medium' },
      { id: 'om-2', studentId: 's7', studentName: 'Can Aydın', micLevel: 0.9, noiseType: 'speech', durationSeconds: 12, severity: 'low' },
      { id: 'om-3', studentId: 's9', studentName: 'Bora Çetin', micLevel: 0.85, noiseType: 'background_noise', durationSeconds: 90, severity: 'high' }
    ],
    whiteboardClutterEvents: [
      { id: 'wbc-1', strokeCount: 92, activeAuthorsCount: 2, selectedStudentId: 's0', selectedStudentDurationSeconds: 140, clutterScore: 0.78, severity: 'high', suggestedAction: 'clear_student_drawings' }
    ],
    quizRiskEvents: [
      { id: 'qr-1', quizId: 'quiz-screen-blank-1', unansweredStudentIds: ['s5', 's8', 's11'], emptyAnswerStudentIds: [], lowResponseRate: true, averageResponseTimeSeconds: 22, severity: 'medium' }
    ],
    connectionRiskEvents: [
      { id: 'cr-1', studentId: 's9', studentName: 'Bora Çetin', quality: 'critical', severity: 'high' },
      { id: 'cr-2', studentId: 's11', studentName: 'Alp Korkmaz', quality: 'offline', severity: 'critical' }
    ]
  };

})(typeof window !== 'undefined' ? window : this);
