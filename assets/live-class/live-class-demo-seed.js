(function (global) {
  'use strict';

  var Domain = global.LiveClassDomain;
  var TEACHER_ID = 'teacher';

  var UNIFIED_SCENARIOS = [
    { id: 'normal-live', title: 'Normal canlı ders', description: 'Standart ders akışı', roleView: 'both', actions: ['status:live', 'stage:gallery'] },
    { id: 'screen-share', title: 'Ekran paylaşımı', description: 'Öğretmen ekran paylaşıyor', roleView: 'both', actions: ['status:live', 'stage:screen_share'] },
    { id: 'wb-lecture', title: 'Whiteboard anlatımı', description: 'Öğretmen tahtada anlatım', roleView: 'both', actions: ['status:live', 'wb:open', 'wb:mock-teacher-draw'] },
    { id: 'furkan-hand', title: 'Furkan el kaldırdı', description: 'El kaldırma akışı', roleView: 'both', actions: ['status:live', 'hand:furkan'] },
    { id: 'furkan-wb', title: 'Furkan tahtaya seçildi', description: 'Whiteboard seçimi', roleView: 'both', actions: ['status:live', 'wb:open', 'hand:furkan', 'wb:select-furkan'] },
    { id: 'furkan-wb-writing', title: 'Furkan tahtada yazıyor', description: 'Öğrenci çizim akışı', roleView: 'both', actions: ['status:live', 'wb:open', 'hand:furkan', 'wb:select-furkan', 'wb:mock-student-draw'] },
    { id: 'wb-revoke', title: 'WB izni kaldırıldı', description: 'Yazma izni geri alındı', roleView: 'both', actions: ['status:live', 'wb:open', 'hand:furkan', 'wb:select-furkan', 'wb:revoke'] },
    { id: 'sq-abcd', title: 'Ekrandaki soru A/B/C/D', description: 'Boş şıklı cevap toplama', roleView: 'both', actions: ['status:live', 'sq:abcd'] },
    { id: 'sq-open', title: 'Ekrandaki soru açık uçlu', description: 'Açık uçlu cevap toplama', roleView: 'both', actions: ['status:live', 'sq:open'] },
    { id: 'sq-results', title: 'Quiz sonuçları açık', description: 'Sonuçlar paylaşıldı', roleView: 'both', actions: ['status:live', 'sq:abcd', 'sq:simulate-all', 'sq:show-results'] },
    { id: 'chat-questions', title: 'Chat soru modu', description: 'Sadece soru gönderimi', roleView: 'both', actions: ['status:live', 'crisis:chat-questions'] },
    { id: 'open-mics', title: 'Açık mikrofon', description: 'Gereksiz açık mikrofonlar', roleView: 'teacher', actions: ['status:live', 'crisis:open-mics'] },
    { id: 'wb-clutter', title: 'Whiteboard karışıklığı', description: 'Yoğun çizim uyarısı', roleView: 'teacher', actions: ['status:live', 'wb:open', 'crisis:wb-clutter'] },
    { id: 'conn-issue', title: 'Bağlantı sorunu', description: 'Zayıf bağlantılı öğrenci', roleView: 'both', actions: ['status:live', 'conn:weak-random', 'crisis:conn-critical'] },
    { id: 'confused-wave', title: 'Çok fazla anlamadım', description: 'Tempo geri bildirimi', roleView: 'teacher', actions: ['status:live', 'react:confused3', 'crisis:confused-more'] },
    { id: 'focus-mode', title: 'Odak modu', description: 'Dikkat modu aktif', roleView: 'both', actions: ['status:live', 'focus:on'] },
    { id: 'xp-earned', title: 'XP kazanıldı', description: 'Gamification olayı', roleView: 'student', actions: ['status:live', 'xp:s0:25'] },
    { id: 'badge-earned', title: 'Rozet kazanıldı', description: 'Rozet popup', roleView: 'student', actions: ['status:live', 'badge:s0'] },
    { id: 'break-time', title: 'Ders arası', description: 'Ara modu', roleView: 'both', actions: ['status:break'] },
    { id: 'ended', title: 'Ders bitti', description: 'Oturum sona erdi', roleView: 'both', actions: ['status:ended'] },
    { id: 'student-wrong-answer-supportive-feedback', title: 'Öğrenci yanlış cevap — destekleyici feedback', description: 'Yanlış cevapta pedagojik geri bildirim', roleView: 'student', actions: ['status:live', 'sq:abcd', 'sq:mc-wrong'] },
    { id: 'student-correct-answer-xp-feedback', title: 'Öğrenci doğru cevap + XP', description: 'Doğru cevapta başarı mesajı', roleView: 'student', actions: ['status:live', 'sq:abcd', 'sq:mc-correct'] },
    { id: 'student-no-scroll-answer-dock', title: 'Scroll\'suz cevaplama dock', description: 'Aktif cevap isteği ana sahne altında', roleView: 'student', actions: ['status:live', 'sq:abcd'] },
    { id: 'teacher-quick-abcd-answer', title: 'Öğretmen hızlı A/B/C/D', description: 'Quick answer bar ile boş şıklı istek', roleView: 'teacher', actions: ['status:live', 'sq:abcd'] },
    { id: 'teacher-open-ended-screen-answer', title: 'Öğretmen açık uçlu cevap', description: 'Scroll\'suz açık uçlu cevap alanı', roleView: 'both', actions: ['status:live', 'sq:open'] }
  ];

  function buildUnifiedSeed() {
    var teacherSeed = global.TeacherDemoSeed ? global.TeacherDemoSeed.teacherDemoSeed : null;
    var crisisSeed = global.CrisisDemoSeed || null;
    var permSeed = global.BilenyumPermissionsSeed || null;
    var insightSeed = global.StudentInsightsSeed || null;
    var gamSeed = global.BilenyumGamification || null;

    var participants = [];
    if (teacherSeed && teacherSeed.participants) {
      participants = teacherSeed.participants.map(function (p) {
        return Domain ? Domain.createParticipant(Object.assign({}, p, { classSessionId: 'session-demo-1' })) : Object.assign({}, p);
      });
    }

    var permissions = {};
    if (permSeed && permSeed.buildAllPermissionStates) {
      var raw = permSeed.buildAllPermissionStates();
      Object.keys(raw).forEach(function (id) {
        permissions[id] = Domain ? Domain.createPermissionState(id, raw[id]) : raw[id];
      });
    }

    var session = Domain ? Domain.createClassSession({
      id: 'session-demo-1',
      title: 'Matematik — Canlı Ders',
      topic: 'Doğrusal Denklemler',
      teacherId: TEACHER_ID,
      status: 'live',
      currentStageMode: 'gallery',
      chatMode: 'open'
    }) : { id: 'session-demo-1', title: 'Matematik', status: 'live' };

    var classPolicy = Domain ? Domain.createClassPolicy('session-demo-1', { chatMode: 'open' }) : { chatMode: 'open' };

    var signals = [];
    if (crisisSeed && crisisSeed.smartSuggestions) {
      signals = crisisSeed.smartSuggestions.slice(0, 30).map(function (s) {
        return {
          id: s.id,
          title: s.title,
          description: s.description,
          actionLabel: s.actionLabel,
          action: s.action,
          priority: s.priority || 'medium'
        };
      });
    }

    return {
      session: session,
      participants: participants,
      permissions: permissions,
      classPolicy: classPolicy,
      chatMessages: teacherSeed ? teacherSeed.chatMessages : [],
      questions: teacherSeed ? teacherSeed.questions : [],
      answerRequests: teacherSeed ? (teacherSeed.answerRequests || []) : [],
      answerResponses: teacherSeed ? (teacherSeed.answerResponses || []) : [],
      situations: crisisSeed ? (crisisSeed.situations || []) : [],
      signals: signals,
      gamificationEvents: gamSeed ? (gamSeed.seedEvents || []) : [],
      studentInsights: insightSeed ? (insightSeed.studentInsights || {}) : {},
      scenarios: UNIFIED_SCENARIOS
    };
  }

  global.LiveClassDemoSeed = {
    build: buildUnifiedSeed,
    scenarios: UNIFIED_SCENARIOS,
    answerUxDemoScenarios: UNIFIED_SCENARIOS.filter(function (s) {
      return s.id.indexOf('student-') === 0 || s.id.indexOf('teacher-quick') === 0 || s.id.indexOf('teacher-open') === 0;
    })
  };

})(typeof window !== 'undefined' ? window : this);
