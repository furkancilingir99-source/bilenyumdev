(function (global) {
  'use strict';

  function createCrisisManager(opts) {
    opts = opts || {};
    var state = {
      densityMode: 'calm',
      chatMode: 'open',
      activeSituations: [],
      resolvedSituations: [],
      smartSuggestions: [],
      emergencyDockExpanded: false,
      mockFlags: {
        openMicIds: [],
        noisyMicIds: [],
        wbClutter: false,
        wbOvertime: false,
        wbPermOpen: false,
        chatSpam: false,
        quizUnansweredIds: [],
        forceIncident: false
      },
      wbStudentSelectedAt: null,
      crisisTimeline: []
    };

    function logTimeline(label, meta) {
      state.crisisTimeline.unshift({ id: 'ct-' + Date.now(), label: label, meta: meta || {}, createdAt: new Date().toISOString() });
      if (state.crisisTimeline.length > 50) state.crisisTimeline.length = 50;
    }

    function detectSituations(ctx) {
      var situations = [];
      var students = (ctx.participants || []).filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
      var raised = students.filter(function (p) { return p.isHandRaised; });
      var openMics = students.filter(function (p) { return p.micOn && p.role === 'student'; });
      var noisy = students.filter(function (p) { return p.micNoise || state.mockFlags.noisyMicIds.indexOf(p.id) >= 0; });
      var weak = students.filter(function (p) { return p.connectionQuality === 'poor' || p.connectionQuality === 'critical' || p.connectionQuality === 'offline'; });
      var confused = (ctx.reactions && ctx.reactions.confused) || 0;
      var slow = (ctx.reactions && ctx.reactions.slow) || 0;

      if (openMics.length >= 2 || state.mockFlags.openMicIds.length >= 2) {
        situations.push({
          id: 'live-open-mics', type: 'open_microphones', severity: openMics.length >= 3 ? 'critical' : 'warning',
          title: openMics.length + ' açık mikrofon', description: 'Gereksiz açık mikrofonlar ders akışını bozabilir.',
          affectedStudentIds: openMics.map(function (p) { return p.id; }),
          suggestedActions: [{ id: 'sa-mute-open', label: 'Açık mic kapat', actionType: 'mute_students', style: 'primary' }, { id: 'sa-mute-all', label: 'Herkesi sessize al', actionType: 'mute_all', style: 'secondary' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (noisy.length) {
        situations.push({
          id: 'live-noise', type: 'background_noise', severity: 'warning',
          title: noisy.length + ' gürültülü mikrofon', description: 'Arka plan sesi algılandı.',
          affectedStudentIds: noisy.map(function (p) { return p.id; }),
          suggestedActions: [{ id: 'sa-mute-noise', label: 'Gürültülüleri sustur', actionType: 'mute_students', style: 'primary' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (raised.length >= 3) {
        situations.push({
          id: 'live-hands', type: 'many_raised_hands', severity: raised.length >= 5 ? 'warning' : 'attention',
          title: raised.length + ' el kaldıran', description: 'Whiteboard kuyruğu birikti.',
          affectedStudentIds: raised.map(function (p) { return p.id; }),
          suggestedActions: [{ id: 'sa-next', label: 'Sıradakini tahtaya al', actionType: 'select_next_student', style: 'primary' }, { id: 'sa-hands', label: 'Kuyruğu aç', actionType: 'open_raised_hands', style: 'ghost' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (state.mockFlags.wbClutter || (ctx.wbStrokeCount && ctx.wbStrokeCount > 80)) {
        situations.push({
          id: 'live-wb-clutter', type: 'whiteboard_clutter', severity: 'warning',
          title: 'Whiteboard yoğun', description: 'Çizim karışıklığı — temizlik önerilir.',
          affectedStudentIds: ctx.selectedWbStudentId ? [ctx.selectedWbStudentId] : [],
          suggestedActions: [{ id: 'sa-wb-clear', label: 'Öğrenci çizimlerini temizle', actionType: 'clear_student_drawings', style: 'primary' }, { id: 'sa-wb-lock', label: 'Kilitle', actionType: 'lock_whiteboard', style: 'secondary' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (state.mockFlags.wbPermOpen || (ctx.selectedWbStudentId && state.mockFlags.wbOvertime)) {
        situations.push({
          id: 'live-wb-perm', type: 'whiteboard_permission_open', severity: 'attention',
          title: 'Whiteboard izni aktif', description: 'Seçili öğrenci uzun süredir yazıyor olabilir.',
          affectedStudentIds: ctx.selectedWbStudentId ? [ctx.selectedWbStudentId] : [],
          suggestedActions: [{ id: 'sa-revoke', label: 'İzni kaldır', actionType: 'revoke_whiteboard_permission', style: 'primary' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (confused >= 4) {
        situations.push({
          id: 'live-confused', type: 'many_confused_reactions', severity: confused >= 6 ? 'warning' : 'attention',
          title: confused + ' anlamadım', description: 'Konuyu tekrar açıklamak isteyebilirsin.',
          affectedStudentIds: [],
          suggestedActions: [{ id: 'sa-focus', label: 'Odak modu', actionType: 'start_focus_mode', style: 'ghost' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (slow >= 3) {
        situations.push({
          id: 'live-slow', type: 'focus_drift', severity: 'attention',
          title: slow + ' yavaşla', description: 'Tempo geri bildirimi arttı.',
          affectedStudentIds: [], suggestedActions: [], isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (weak.length) {
        situations.push({
          id: 'live-conn', type: 'connection_issues', severity: weak.some(function (p) { return p.connectionQuality === 'critical' || p.connectionQuality === 'offline'; }) ? 'critical' : 'warning',
          title: weak.length + ' bağlantı sorunu', description: 'Quiz ve whiteboard etkilenebilir.',
          affectedStudentIds: weak.map(function (p) { return p.id; }),
          suggestedActions: [{ id: 'sa-insight', label: 'Öğrenci detayı', actionType: 'open_student_insight', style: 'secondary' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      var unanswered = state.mockFlags.quizUnansweredIds.length ? state.mockFlags.quizUnansweredIds : students.filter(function (p) { return ctx.quizActive && !p.quizAnswered && !p.sqAnswered; }).map(function (p) { return p.id; });
      if (unanswered.length >= 3) {
        situations.push({
          id: 'live-quiz', type: 'quiz_low_response', severity: 'warning',
          title: unanswered.length + ' cevap vermedi', description: 'Quiz yanıt oranı düşük.',
          affectedStudentIds: unanswered,
          suggestedActions: [{ id: 'sa-extend', label: 'Süre uzat', actionType: 'extend_quiz_time', style: 'primary' }, { id: 'sa-results', label: 'Sonuçları göster', actionType: 'show_quiz_results', style: 'ghost' }],
          isResolved: false, createdAt: new Date().toISOString()
        });
      }
      if (state.mockFlags.chatSpam || state.chatMode === 'muted') {
        if (state.mockFlags.chatSpam) {
          situations.push({
            id: 'live-chat', type: 'chat_spam', severity: 'attention',
            title: 'Chat yoğun', description: 'Mesaj trafiği arttı.',
            affectedStudentIds: [],
            suggestedActions: [{ id: 'sa-chat', label: 'Chat kapat', actionType: 'close_chat', style: 'danger' }],
            isResolved: false, createdAt: new Date().toISOString()
          });
        }
      }

      state.activeSituations = situations;
      computeDensity(situations, ctx);
      return situations;
    }

    function computeDensity(situations, ctx) {
      if (state.mockFlags.forceIncident) { state.densityMode = 'incident'; return; }
      var critical = situations.filter(function (s) { return s.severity === 'critical'; }).length;
      var warning = situations.filter(function (s) { return s.severity === 'warning'; }).length;
      if (critical >= 1 || warning >= 3 || situations.length >= 5) state.densityMode = 'incident';
      else if (situations.length >= 1 || (ctx.quizActive) || (ctx.wbActive)) state.densityMode = 'active';
      else state.densityMode = 'calm';
    }

    function buildSmartSuggestions(ctx, situations) {
      var out = [];
      situations.forEach(function (sit) {
        if (sit.suggestedActions && sit.suggestedActions[0]) {
          out.push({
            id: 'sug-' + sit.id,
            type: sit.type,
            priority: sit.severity === 'critical' ? 'urgent' : sit.severity === 'warning' ? 'high' : 'medium',
            title: sit.title,
            description: sit.description,
            actionLabel: sit.suggestedActions[0].label,
            action: sit.suggestedActions[0].actionType,
            situationId: sit.id,
            dismissed: false
          });
        }
      });
      state.smartSuggestions = out.slice(0, 5);
      return state.smartSuggestions;
    }

    function executeAction(actionType, ctx, situation) {
      var deps = ctx.deps;
      if (!deps) return;
      var undo = null;

      switch (actionType) {
        case 'mute_students':
          var ids = situation ? situation.affectedStudentIds : [];
          (ids.length ? deps.participants.filter(function (p) { return ids.indexOf(p.id) >= 0; }) : deps.participants.filter(function (p) { return p.micOn && p.role === 'student'; })).forEach(function (p) {
            p._prevMic = p.micOn;
            p.micOn = false;
            p.isMutedByTeacher = true;
            broadcastStudent('mic_muted', p.id, 'Ders akışını korumak için mikrofonun kapatıldı.');
          });
          logTimeline('Mikrofonlar kapatıldı', { ids: ids });
          undo = function () {
            deps.participants.forEach(function (p) { if (p._prevMic) { p.micOn = true; p.isMutedByTeacher = false; } });
            deps.renderAll();
          };
          deps.toastWithUndo(ids.length + ' mikrofon kapatıldı.', undo);
          break;
        case 'mute_all':
          deps.muteAll();
          break;
        case 'lock_whiteboard':
          deps.toggleWbLock();
          broadcastAll('wb_locked', 'Whiteboard kilitlendi. Şu anda sadece izleyebilirsin.');
          break;
        case 'clear_student_drawings':
          if (deps.wbEngine) deps.wbEngine.clearStudentStrokes();
          state.mockFlags.wbClutter = false;
          deps.toastWithUndo('Öğrenci çizimleri temizlendi.', function () { deps.toast('Geri alınamaz mock.'); });
          break;
        case 'revoke_whiteboard_permission':
          deps.revokeWhiteboard();
          broadcastAll('wb_revoked', 'Öğretmen whiteboard yazma iznini kapattı.');
          state.mockFlags.wbPermOpen = false;
          break;
        case 'select_next_student':
          var raised = deps.sortRaisedHands(deps.participants);
          if (raised.length) deps.selectForWhiteboard(raised[0].id);
          else deps.toast('El kaldıran yok.', true);
          break;
        case 'open_raised_hands':
          deps.setPanelTab('raised_hands');
          document.getElementById('tlcRight').classList.add('is-open');
          break;
        case 'close_chat':
          state.chatMode = 'muted';
          deps.state.isChatEnabled = false;
          deps.toastWithUndo('Chat kapatıldı.', function () { state.chatMode = 'open'; deps.state.isChatEnabled = true; deps.renderAll(); });
          broadcastAll('chat_closed', 'Quiz sırasında chat kapalı.');
          try {
            localStorage.setItem('bilenyum_crisis_bus', JSON.stringify({ event: 'chat_mode', mode: 'muted', at: Date.now() }));
          } catch (e) { /* ignore */ }
          break;
        case 'start_focus_mode':
          deps.toggleFocus(true);
          broadcastAll('focus_on', 'Odak modundasın.');
          break;
        case 'extend_quiz_time':
          if (global.TeacherScreenQuestion && global.TeacherScreenQuestion.extendSqTime) global.TeacherScreenQuestion.extendSqTime();
          else deps.toast('Quiz süresi +30 sn (mock).');
          break;
        case 'show_quiz_results':
          if (global.TeacherScreenQuestion) global.TeacherScreenQuestion.toggleResults(true);
          deps.toast('Sonuçlar öğrencilere gösterildi.');
          break;
        case 'open_student_insight':
          if (situation && situation.affectedStudentIds[0] && global.TeacherStudentInsight) {
            global.TeacherStudentInsight.open(situation.affectedStudentIds[0]);
          }
          break;
      }
      if (situation) situation.isResolved = true;
      deps.renderAll();
    }

    function broadcastAll(type, message) {
      try {
        localStorage.setItem('bilenyum_crisis_bus', JSON.stringify({ event: type, message: message, at: Date.now() }));
        global.dispatchEvent(new CustomEvent('bilenyum-crisis', { detail: { event: type, message: message } }));
      } catch (e) { /* ignore */ }
    }

    function broadcastStudent(type, studentId, message) {
      broadcastAll(type, message);
    }

    function applyMockScenario(id, ctx) {
      var deps = ctx.deps;
      switch (id) {
        case 'open-mics':
          deps.getP('s1').micOn = true; deps.getP('s7').micOn = true;
          state.mockFlags.openMicIds = ['s1', 's7'];
          break;
        case 'bg-noise':
          deps.getP('s9').micOn = true; deps.getP('s9').micNoise = true;
          state.mockFlags.noisyMicIds = ['s9'];
          break;
        case 'multi-speak':
          ['s1', 's7', 's8'].forEach(function (id) { var p = deps.getP(id); if (p) { p.micOn = true; p.isSpeaking = true; } });
          break;
        case 'mic-off-speak':
          var p = deps.getP('s2'); if (p) { p.micOn = false; p.isSpeaking = true; p.speakingWithoutMic = true; }
          break;
        case 'wb-clutter':
          state.mockFlags.wbClutter = true;
          break;
        case 'wb-overtime':
          state.mockFlags.wbOvertime = true; state.mockFlags.wbPermOpen = true;
          break;
        case 'wb-perm-open':
          state.mockFlags.wbPermOpen = true;
          break;
        case 'chat-spam':
          state.mockFlags.chatSpam = true;
          break;
        case 'confused-more':
          deps.state.reactions.confused = 5;
          break;
        case 'quiz-unanswered':
          state.mockFlags.quizUnansweredIds = ['s5', 's8', 's11'];
          break;
        case 'conn-critical':
          var b = deps.getP('s9'); if (b) b.connectionQuality = 'critical';
          break;
        case 'focus-needed':
          deps.toggleFocus(true);
          break;
        case 'calm':
          state.mockFlags = { openMicIds: [], noisyMicIds: [], wbClutter: false, wbOvertime: false, wbPermOpen: false, chatSpam: false, quizUnansweredIds: [], forceIncident: false };
          break;
        case 'heavy':
          state.mockFlags.forceIncident = true;
          state.mockFlags.openMicIds = ['s1', 's7'];
          state.mockFlags.wbClutter = true;
          state.mockFlags.chatSpam = true;
          state.mockFlags.quizUnansweredIds = ['s5', 's8', 's11'];
          deps.state.reactions.confused = 5;
          break;
        case 'calm-down':
          if (global.TeacherPermissionUI) global.TeacherPermissionUI.runDockAction('exam-mode');
          state.mockFlags.forceIncident = false;
          break;
        case 'quiz-stale':
          state.mockFlags.quizUnansweredIds = ['s1', 's2', 's3', 's4', 's5'];
          break;
        case 'chat-questions':
          state.chatMode = 'questions_only';
          deps.state.isChatEnabled = true;
          break;
      }
      detectSituations(ctx);
      deps.renderAll();
      deps.toast('Kriz senaryosu: ' + id);
    }

    function setChatMode(mode) {
      state.chatMode = mode;
      logTimeline('Chat modu: ' + mode);
      try {
        localStorage.setItem('bilenyum_crisis_bus', JSON.stringify({ event: 'chat_mode', mode: mode, at: Date.now() }));
        global.dispatchEvent(new CustomEvent('bilenyum-crisis', { detail: { event: 'chat_mode', mode: mode } }));
      } catch (e) { /* ignore */ }
    }

    function getCalmSummary(ctx) {
      var students = (ctx.participants || []).filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
      var raised = students.filter(function (p) { return p.isHandRaised; }).length;
      var weak = students.filter(function (p) { return p.connectionQuality === 'poor' || p.connectionQuality === 'critical'; }).length;
      var wb = ctx.wbActive ? 'Whiteboard açık' : 'Whiteboard kapalı';
      var quiz = ctx.quizActive ? 'Quiz aktif' : 'Quiz yok';
      return students.length + ' öğrenci derste · ' + raised + ' el kaldırdı · ' + weak + ' bağlantı zayıf · ' + quiz + ' · ' + wb;
    }

    return {
      state: state,
      detectSituations: detectSituations,
      buildSmartSuggestions: buildSmartSuggestions,
      executeAction: executeAction,
      applyMockScenario: applyMockScenario,
      setChatMode: setChatMode,
      getCalmSummary: getCalmSummary,
      logTimeline: logTimeline
    };
  }

  global.BilenyumCrisisManager = { create: createCrisisManager };

})(typeof window !== 'undefined' ? window : this);
