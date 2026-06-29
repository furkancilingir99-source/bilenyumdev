(function (global) {
  'use strict';

  var Badges = global.BilenyumBadges;
  var PermSeed = global.BilenyumPermissionsSeed;

  var STUDENTS = [
    { id: 's0', name: 'Furkan Çilingir', emoji: '🧑‍🎓', level: 4, totalXp: 420, lessonXp: 85 },
    { id: 's1', name: 'Deniz Kaya', emoji: '🦁', level: 5, totalXp: 580, lessonXp: 72 },
    { id: 's2', name: 'Ece Demir', emoji: '🦊', level: 3, totalXp: 310, lessonXp: 45 },
    { id: 's3', name: 'Mert Arslan', emoji: '🐯', level: 4, totalXp: 390, lessonXp: 68 },
    { id: 's4', name: 'Zeynep Şahin', emoji: '🦄', level: 5, totalXp: 510, lessonXp: 91 },
    { id: 's5', name: 'Kerem Yıldız', emoji: '🐺', level: 2, totalXp: 180, lessonXp: 22 },
    { id: 's6', name: 'Elif Koç', emoji: '🐬', level: 3, totalXp: 290, lessonXp: 55 },
    { id: 's7', name: 'Can Aydın', emoji: '🦋', level: 4, totalXp: 440, lessonXp: 78 },
    { id: 's8', name: 'Nazlı Aksoy', emoji: '🦅', level: 3, totalXp: 260, lessonXp: 38 },
    { id: 's9', name: 'Bora Çetin', emoji: '🐱', level: 2, totalXp: 150, lessonXp: 15 },
    { id: 's10', name: 'İrem Güneş', emoji: '🐻', level: 4, totalXp: 370, lessonXp: 62 },
    { id: 's11', name: 'Alp Korkmaz', emoji: '🐼', level: 2, totalXp: 120, lessonXp: 8 }
  ];

  var ACTIVITY_TYPES = [
    { type: 'joined_class', label: 'Derse katıldı' },
    { type: 'raised_hand', label: 'El kaldırdı' },
    { type: 'lowered_hand', label: 'Elini indirdi' },
    { type: 'selected_for_whiteboard', label: 'Whiteboard\'a seçildi' },
    { type: 'whiteboard_stroke_created', label: 'Whiteboard çizimi yaptı', value: '12 stroke' },
    { type: 'quiz_answer_submitted', label: 'Quiz cevabı gönderdi', value: 'C' },
    { type: 'open_answer_submitted', label: 'Açık uçlu cevap yazdı' },
    { type: 'chat_message_sent', label: 'Chat mesajı gönderdi' },
    { type: 'question_asked', label: 'Öğretmene soru sordu' },
    { type: 'reaction_sent', label: 'Reaksiyon gönderdi' },
    { type: 'xp_awarded', label: 'XP kazandı', value: '+20 XP' },
    { type: 'badge_earned', label: 'Rozet kazandı' },
    { type: 'connection_warning', label: 'Bağlantı uyarısı' },
    { type: 'camera_on', label: 'Kamerayı açtı' },
    { type: 'mic_on', label: 'Mikrofonu açtı' },
    { type: 'whiteboard_permission_revoked', label: 'Whiteboard izni kaldırıldı' }
  ];

  function generateActivitiesForStudent(st, count) {
    var out = [];
    var base = Date.now() - 3600000;
    for (var i = 0; i < count; i++) {
      var tpl = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length];
      out.push({
        id: 'act-' + st.id + '-' + i,
        studentId: st.id,
        type: tpl.type,
        label: tpl.label,
        value: tpl.value || (tpl.type === 'xp_awarded' ? '+' + (5 + (i % 20)) + ' XP' : undefined),
        metadata: {},
        createdAt: new Date(base + i * 90000).toISOString()
      });
    }
    return out;
  }

  function buildInsight(st, permStates) {
    var activities = generateActivitiesForStudent(st, 28);
    var badgeList = Badges ? Badges.BADGES.slice(0, 3 + (parseInt(st.id.slice(1), 10) % 4)) : [];
    badgeList = badgeList.map(function (b, i) {
      return { id: b.id, name: b.name, description: b.description, icon: b.icon, rarity: b.rarity, earnedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString() };
    });
    var achievements = (Badges ? Badges.ACHIEVEMENTS : []).slice(0, 5).map(function (a) {
      return { id: a.id, title: a.title, description: a.description, progressCurrent: Math.min(a.progressTarget, 2 + (parseInt(st.id.slice(1), 10) % a.progressTarget)), progressTarget: a.progressTarget, isCompleted: false };
    });
    var quizAnswered = 4 + (parseInt(st.id.slice(1), 10) % 3);
    var quizTotal = 6;
    return {
      studentId: st.id,
      profile: { name: st.name, avatarEmoji: st.emoji, level: st.level, totalXp: st.totalXp, lessonXp: st.lessonXp },
      liveStatus: {
        isOnline: st.id !== 's11',
        isSpeaking: st.id === 's7',
        isHandRaised: ['s0', 's2', 's3', 's4', 's10'].indexOf(st.id) >= 0,
        isSelectedForWhiteboard: false,
        isAnsweringQuiz: false,
        isFocusLocked: false
      },
      permissions: permStates[st.id] || PermSeed.defaultPermissionState(st.id),
      attendance: {
        joinedAt: new Date(Date.now() - 2520000).toISOString(),
        activeSeconds: 1800 + parseInt(st.id.slice(1), 10) * 120,
        cameraOnSeconds: 900 + parseInt(st.id.slice(1), 10) * 60,
        micOnSeconds: 120 + parseInt(st.id.slice(1), 10) * 15,
        focusModeSeconds: parseInt(st.id.slice(1), 10) * 30
      },
      quizStats: {
        studentId: st.id,
        totalQuizSent: quizTotal,
        answeredCount: quizAnswered,
        missedCount: quizTotal - quizAnswered,
        correctCount: Math.max(0, quizAnswered - 1),
        incorrectCount: 1,
        partialCount: 0,
        openEndedCount: st.id === 's0' ? 2 : 1,
        averageResponseTimeSeconds: 14 + parseInt(st.id.slice(1), 10),
        fastestResponseSeconds: 8,
        slowestResponseSeconds: 34,
        lastAnswerAt: new Date(Date.now() - 300000).toISOString(),
        accuracyRate: Math.round((Math.max(0, quizAnswered - 1) / quizTotal) * 100)
      },
      whiteboardStats: {
        studentId: st.id,
        selectedCount: st.id === 's0' ? 2 : (parseInt(st.id.slice(1), 10) % 3),
        totalDrawingTimeSeconds: 60 + parseInt(st.id.slice(1), 10) * 20,
        strokeCount: 8 + parseInt(st.id.slice(1), 10) * 3,
        penStrokeCount: 6 + parseInt(st.id.slice(1), 10) * 2,
        highlighterStrokeCount: parseInt(st.id.slice(1), 10) % 4,
        eraserUsageCount: parseInt(st.id.slice(1), 10) % 3,
        undoCount: parseInt(st.id.slice(1), 10) % 5,
        redoCount: parseInt(st.id.slice(1), 10) % 2,
        clearedOwnStrokeCount: 0,
        clearedByTeacherCount: st.id === 's0' ? 1 : 0,
        lastSelectedAt: st.id === 's0' ? new Date(Date.now() - 600000).toISOString() : undefined,
        lastStrokeAt: new Date(Date.now() - 120000).toISOString()
      },
      gamification: {
        studentId: st.id,
        level: st.level,
        totalXp: st.totalXp,
        lessonXp: st.lessonXp,
        weeklyXp: st.totalXp - 100,
        streakDays: 1 + (parseInt(st.id.slice(1), 10) % 5),
        badges: badgeList,
        achievements: achievements,
        participationScore: 55 + parseInt(st.id.slice(1), 10) * 3,
        focusScore: 40 + parseInt(st.id.slice(1), 10) * 4,
        collaborationScore: 30 + parseInt(st.id.slice(1), 10) * 2,
        quizScore: 50 + parseInt(st.id.slice(1), 10) * 4,
        whiteboardScore: parseInt(st.id.slice(1), 10) * 5,
        helpSeekingScore: parseInt(st.id.slice(1), 10) * 3
      },
      connection: {
        studentId: st.id,
        quality: st.id === 's9' ? 'critical' : st.id === 's11' ? 'offline' : st.id === 's3' ? 'poor' : st.id === 's2' ? 'medium' : 'good',
        pingMs: st.id === 's9' ? 420 : st.id === 's3' ? 180 : 42 + parseInt(st.id.slice(1), 10) * 5,
        packetLossPercent: st.id === 's9' ? 8.5 : st.id === 's3' ? 3.2 : 0.2,
        bitrateKbps: st.id === 's11' ? 0 : 1200 - parseInt(st.id.slice(1), 10) * 30,
        reconnectCount: st.id === 's11' ? 2 : 0,
        totalOfflineSeconds: st.id === 's11' ? 120 : 0,
        cameraIssueCount: st.id === 's8' ? 1 : 0,
        microphoneIssueCount: 0,
        lastIssueAt: st.id === 's9' ? new Date(Date.now() - 60000).toISOString() : undefined
      },
      activities: activities,
      permissionEvents: (PermSeed ? PermSeed.permissionEvents : []).filter(function (e) { return e.studentId === st.id; }).slice(0, 8),
      teacherNotes: st.id === 's0' ? 'Denklem çözümünde iyi ilerliyor. Bir sonraki derste grafik konusuna geç.' : '',
      notesSummary: { tookNotes: st.id !== 's11', noteCount: 2 + (parseInt(st.id.slice(1), 10) % 5), screenshotCount: parseInt(st.id.slice(1), 10) % 3 }
    };
  }

  function buildAllInsights() {
    var permStates = PermSeed ? PermSeed.buildAllPermissionStates() : {};
    var map = {};
    STUDENTS.forEach(function (st) { map[st.id] = buildInsight(st, permStates); });
    return map;
  }

  var allActivities = [];
  STUDENTS.forEach(function (st) { allActivities = allActivities.concat(generateActivitiesForStudent(st, 28)); });

  global.StudentInsightsSeed = {
    STUDENTS: STUDENTS,
    buildAllInsights: buildAllInsights,
    studentInsights: buildAllInsights(),
    allActivities: allActivities
  };

})(typeof window !== 'undefined' ? window : this);
