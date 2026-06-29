(function (global) {
  'use strict';

  var AR = global.BilenyumAnswerRequest;
  var TEACHER_ID = 'teacher';

  var STUDENT_SEED = [
    { id: 's0', name: 'Furkan Çilingir', cameraOn: true, micOn: false, isHandRaised: true, reaction: null, connectionQuality: 'excellent', isMutedByTeacher: true },
    { id: 's1', name: 'Deniz Kaya', cameraOn: true, micOn: true, isHandRaised: false, reaction: 'like', connectionQuality: 'good', isMutedByTeacher: false },
    { id: 's2', name: 'Ece Demir', cameraOn: false, micOn: false, isHandRaised: true, reaction: 'confused', connectionQuality: 'medium', isMutedByTeacher: true },
    { id: 's3', name: 'Mert Arslan', cameraOn: true, micOn: false, isHandRaised: true, reaction: null, connectionQuality: 'poor', isMutedByTeacher: true },
    { id: 's4', name: 'Zeynep Şahin', cameraOn: true, micOn: false, isHandRaised: true, reaction: 'slow', connectionQuality: 'good', isMutedByTeacher: true },
    { id: 's5', name: 'Kerem Yıldız', cameraOn: false, micOn: false, isHandRaised: false, reaction: null, connectionQuality: 'excellent', isMutedByTeacher: true },
    { id: 's6', name: 'Elif Koç', cameraOn: true, micOn: false, isHandRaised: false, reaction: 'clap', connectionQuality: 'good', isMutedByTeacher: true },
    { id: 's7', name: 'Can Aydın', cameraOn: true, micOn: true, isHandRaised: false, reaction: null, connectionQuality: 'excellent', isMutedByTeacher: false, isSpeaking: true },
    { id: 's8', name: 'Nazlı Aksoy', cameraOn: false, micOn: false, isHandRaised: false, reaction: 'heart', connectionQuality: 'medium', isMutedByTeacher: true },
    { id: 's9', name: 'Bora Çetin', cameraOn: true, micOn: false, isHandRaised: false, reaction: null, connectionQuality: 'critical', isMutedByTeacher: true },
    { id: 's10', name: 'İrem Güneş', cameraOn: true, micOn: false, isHandRaised: true, reaction: 'fast', connectionQuality: 'good', isMutedByTeacher: true },
    { id: 's11', name: 'Alp Korkmaz', cameraOn: false, micOn: false, isHandRaised: false, reaction: null, connectionQuality: 'offline', isMutedByTeacher: true }
  ];

  var EMOJIS = ['🧑‍🎓', '🦁', '🦊', '🐯', '🦄', '🐺', '🐬', '🦋', '🦅', '🐱', '🐻', '🐼'];

  function generateChatMessages(count) {
    var studentMsgs = ['Anladım hocam', 'Bir daha anlatır mısınız?', 'Hazırız', 'Not aldım', 'Teşekkürler', 'Bu adımı anlamadım'];
    var teacherMsgs = ['Şimdi ekrandaki soruya bakıyoruz.', 'Cevaplarınızı gönderin.', 'Harika gidiyorsunuz.'];
    var systemMsgs = ['Ekrandaki soruya cevap isteği gönderildi.', 'Whiteboard açıldı.', 'Quiz sonuçları açıldı.'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var mod = i % 5;
      var st = STUDENT_SEED[i % 12];
      if (mod === 0) out.push({ id: 'chat-' + i, senderId: st.id, senderName: st.name, type: 'student', content: studentMsgs[i % studentMsgs.length], createdAt: '09:' + String(i % 60).padStart(2, '0') });
      else if (mod === 1) out.push({ id: 'chat-' + i, senderId: TEACHER_ID, senderName: 'Furkan Çilingir', type: 'teacher', content: teacherMsgs[i % teacherMsgs.length], createdAt: '09:' + String(i % 60).padStart(2, '0') });
      else if (mod === 2) out.push({ id: 'chat-' + i, senderId: null, senderName: 'Sistem', type: 'system', content: systemMsgs[i % systemMsgs.length], createdAt: '09:' + String(i % 60).padStart(2, '0') });
      else out.push({ id: 'chat-' + i, senderId: st.id, senderName: st.name, type: 'question', content: 'Öğretmenim bu adımı açıklar mısınız?', createdAt: '09:' + String(i % 60).padStart(2, '0'), questionStatus: i % 3 === 0 ? 'waiting' : 'seen' });
    }
    return out;
  }

  function generateQuestions(count) {
    var templates = ['Bu soruda ilk adım ne olmalı?', 'Eksi sayıyı karşıya atınca işaret neden değişiyor?', 'Bu yöntem her denklemde geçerli mi?'];
    var statuses = ['waiting', 'seen', 'answered', 'featured'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var st = STUDENT_SEED[i % 12];
      out.push({ id: 'q-' + i, studentId: st.id, studentName: st.name, content: templates[i % templates.length], status: statuses[i % statuses.length], createdAt: '09:' + String(5 + (i % 50)).padStart(2, '0') });
    }
    return out;
  }

  function generateReactions(count) {
    var pool = [{ type: 'confused', label: 'Anlamadım' }, { type: 'slow', label: 'Yavaşla' }, { type: 'fast', label: 'Hızlan' }, { type: 'clap', label: 'Alkış' }, { type: 'like', label: 'Beğendim' }, { type: 'heart', label: 'Kalp' }];
    var out = [];
    for (var i = 0; i < count; i++) {
      var p = pool[i % pool.length];
      var st = STUDENT_SEED[i % 12];
      out.push({ id: 'react-' + i, studentId: st.id, studentName: st.name, type: p.type, label: p.label, createdAt: new Date(Date.now() - i * 60000).toISOString() });
    }
    return out;
  }

  function generateConnectionEvents(count) {
    var qualities = ['good', 'medium', 'poor', 'critical', 'offline', 'excellent'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var st = STUDENT_SEED[i % 12];
      out.push({ id: 'conn-' + i, studentId: st.id, studentName: st.name, previousQuality: qualities[i % qualities.length], newQuality: qualities[(i + 2) % qualities.length], pingMs: 40 + i * 15, packetLossPercent: (i % 10) * 0.8, createdAt: new Date(Date.now() - i * 120000).toISOString() });
    }
    return out;
  }

  function generateAnswerRequests(count) {
    if (!AR) return [];
    var samples = [
      AR.createAnswerRequest({ id: 'quiz-manual-1', title: 'Denklem Çözme', questionText: '2x + 5 = 15 ise x kaçtır?', source: 'manual', type: 'manual_single_choice', answerMode: 'single_choice', options: [{ id: 'q1-a', label: 'A', text: '3', voteCount: 1 }, { id: 'q1-b', label: 'B', text: '4', voteCount: 2 }, { id: 'q1-c', label: 'C', text: '5', isCorrect: true, voteCount: 7 }, { id: 'q1-d', label: 'D', text: '10', voteCount: 2 }], timeLimitSeconds: 60, status: 'showing_results', showResultsToStudents: true }),
      AR.createAnswerRequest({ id: 'quiz-screen-blank-1', title: 'Ekrandaki soru', source: 'whiteboard', type: 'screen_based_single_choice_blank_options', options: AR.buildBlankOptions(4, 'screen-a'), optionCount: 4, timeLimitSeconds: 45 }),
      AR.createAnswerRequest({ id: 'quiz-screen-blank-2', title: 'Ekrandaki test', source: 'screen_share', type: 'screen_based_single_choice_blank_options', options: AR.buildBlankOptions(5, 'screen2'), optionCount: 5, timeLimitSeconds: 60 }),
      AR.createAnswerRequest({ id: 'quiz-screen-open-1', title: 'Ekrandaki cevap', source: 'whiteboard', type: 'screen_based_open_ended', answerMode: 'open_ended', options: [], timeLimitSeconds: 90 }),
      AR.createAnswerRequest({ id: 'quiz-screen-tf-1', title: 'Doğru/Yanlış', source: 'current_screen', type: 'screen_based_true_false', options: AR.buildTrueFalseOptions('tf'), timeLimitSeconds: 30 })
    ];
    var out = samples.slice();
    while (out.length < count) {
      out.push(AR.createAnswerRequest({ id: 'quiz-gen-' + out.length, type: out.length % 2 ? 'screen_based_open_ended' : 'screen_based_single_choice_blank_options', source: ['whiteboard', 'screen_share', 'pdf_material'][out.length % 3], options: out.length % 2 ? [] : AR.buildBlankOptions(3 + (out.length % 3), 'gen' + out.length), optionCount: 3 + (out.length % 3), timeLimitSeconds: 45 }));
    }
    return out.slice(0, count);
  }

  function generateAnswerResponses(quizzes, perQuiz) {
    var openAnswers = ['Önce 5\'i karşıya atarız', '2x = 10 olur, x = 5', 'x = 5', 'Sabiti karşı tarafa alırız'];
    var out = [];
    quizzes.forEach(function (quiz) {
      STUDENT_SEED.forEach(function (st, si) {
        if (si >= perQuiz) return;
        var resp = { id: 'resp-' + quiz.id + '-' + st.id, answerRequestId: quiz.id, studentId: st.id, studentName: st.name, submittedAt: new Date(Date.now() - si * 8000).toISOString(), responseTimeSeconds: 8 + si * 3, isCorrect: null, reviewStatus: 'unreviewed' };
        if (quiz.answerMode === 'open_ended') {
          resp.openEndedAnswer = openAnswers[si % openAnswers.length];
          resp.reviewStatus = si % 4 === 0 ? 'correct' : si % 4 === 1 ? 'incorrect' : 'needs_review';
          resp.isCorrect = resp.reviewStatus === 'correct' ? true : resp.reviewStatus === 'incorrect' ? false : null;
        } else if (quiz.options && quiz.options.length) {
          var opt = quiz.options[si % quiz.options.length];
          resp.selectedOptionIds = [opt.id];
          resp.selectedOptionLabels = [opt.label];
        }
        out.push(resp);
      });
    });
    return out;
  }

  function buildParticipantsFromSeed() {
    var list = [{ id: TEACHER_ID, name: 'Furkan Çilingir', role: 'teacher', emoji: '👩‍🏫', cameraOn: true, micOn: true, isSpeaking: true, isHandRaised: false, reaction: null, connectionQuality: 'excellent', isPinned: false, isMutedByTeacher: false, isInWaitingRoom: false, isSelectedForWhiteboard: false, isSelf: true }];
    STUDENT_SEED.forEach(function (s, i) {
      list.push({ id: s.id, name: s.name, role: 'student', emoji: EMOJIS[i % EMOJIS.length], cameraOn: s.cameraOn, micOn: s.micOn, isSpeaking: !!s.isSpeaking, isHandRaised: s.isHandRaised, reaction: s.reaction, connectionQuality: s.connectionQuality, isPinned: false, isMutedByTeacher: s.isMutedByTeacher, isInWaitingRoom: false, isSelectedForWhiteboard: false, isSelf: false, handRaisedAt: s.isHandRaised ? Date.now() - (i + 1) * 45000 : null, quizAnswered: false, sqAnswered: false });
    });
    return list;
  }

  function createTeacherDemoSeed(config) {
    config = config || {};
    var quizzes = generateAnswerRequests(config.quizCount || 12);
    return {
      participants: buildParticipantsFromSeed(),
      waitingRoomStudents: [{ id: 'w1', name: 'Yağız Türkmen', emoji: '🎒', cameraOn: true, connectionQuality: 'good' }, { id: 'w2', name: 'Ada Yalçın', emoji: '📚', cameraOn: false, connectionQuality: 'medium' }, { id: 'w3', name: 'Selin Öz', emoji: '✨', cameraOn: true, connectionQuality: 'excellent' }],
      raisedHandQueue: ['s0', 's2', 's3', 's4', 's10'],
      chatMessages: generateChatMessages(config.chatMessageCount || 80),
      questions: generateQuestions(config.questionCount || 30),
      reactionEvents: generateReactions(config.reactionCount || 60),
      connectionEvents: generateConnectionEvents(config.connectionEventCount || 25),
      quizzes: quizzes,
      answerResponses: generateAnswerResponses(quizzes, config.answerResponseCountPerQuiz || 12)
    };
  }

  global.TeacherDemoSeed = {
    createTeacherDemoSeed: createTeacherDemoSeed,
    teacherDemoSeed: createTeacherDemoSeed({ studentCount: 12, chatMessageCount: 80, questionCount: 30, reactionCount: 60, connectionEventCount: 25, quizCount: 12, answerResponseCountPerQuiz: 12 }),
    buildParticipantsFromSeed: buildParticipantsFromSeed,
    STUDENT_SEED: STUDENT_SEED
  };

})(typeof window !== 'undefined' ? window : this);
