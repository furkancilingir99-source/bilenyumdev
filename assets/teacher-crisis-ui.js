(function (global) {
  'use strict';

  var deps = {};
  var crisis = null;

  function $(id) { return document.getElementById(id); }

  function getCtx() {
    return {
      participants: deps.participants,
      reactions: deps.state.reactions,
      wbActive: deps.state.mainStageMode === 'whiteboard',
      wbStrokeCount: deps.wbState && deps.wbState.strokes ? deps.wbState.strokes.filter(function (s) { return !s.isDeleted; }).length : 0,
      selectedWbStudentId: deps.state.selectedWhiteboardStudentId,
      quizActive: !!(global.TeacherScreenQuestion && global.TeacherScreenQuestion.isActive && global.TeacherScreenQuestion.isActive()),
      deps: deps
    };
  }

  function renderSituationCenter() {
    var el = $('tlcSituationCenter');
    if (!el || !crisis) return;
    var ctx = getCtx();
    var situations = crisis.detectSituations(ctx);
    crisis.buildSmartSuggestions(ctx, situations);
    var mode = crisis.state.densityMode;

    el.className = 'tlc-situation-center tlc-density--' + mode;
    if (mode === 'calm' && !situations.length) {
      el.innerHTML = '<span class="tlc-sit-calm">' + crisis.getCalmSummary(ctx) + '</span>' +
        '<span class="tlc-density-badge tlc-density-badge--' + mode + '">' + mode + '</span>';
      return;
    }

    var cards = situations.map(function (sit) {
      var sev = sit.severity;
      var acts = (sit.suggestedActions || []).slice(0, 2).map(function (a) {
        return '<button type="button" class="tlc-sit-action tlc-sit-action--' + a.style + '" data-sit="' + sit.id + '" data-act="' + a.actionType + '">' + a.label + '</button>';
      }).join('');
      return '<div class="tlc-sit-card tlc-sit-card--' + sev + '" data-sit-id="' + sit.id + '">' +
        '<span class="tlc-sit-icon">' + iconFor(sit.type) + '</span>' +
        '<div class="tlc-sit-body"><strong>' + sit.title + '</strong><small>' + sit.description + '</small></div>' +
        '<div class="tlc-sit-actions">' + acts + '</div></div>';
    }).join('');

    el.innerHTML = '<div class="tlc-sit-row">' + cards + '</div>' +
      '<span class="tlc-density-badge tlc-density-badge--' + mode + '">' + mode + '</span>';

    el.querySelectorAll('[data-sit][data-act]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        var sit = situations.find(function (s) { return s.id === btn.dataset.sit; });
        crisis.executeAction(btn.dataset.act, getCtx(), sit);
      };
    });
    el.querySelectorAll('.tlc-sit-card').forEach(function (card) {
      card.onclick = function () {
        var sit = situations.find(function (s) { return s.id === card.dataset.sitId; });
        if (sit && sit.affectedStudentIds[0] && global.TeacherStudentInsight) {
          global.TeacherStudentInsight.open(sit.affectedStudentIds[0]);
        }
      };
    });
  }

  function iconFor(type) {
    var map = { open_microphones: '🎤', background_noise: '🔊', many_raised_hands: '✋', whiteboard_clutter: '🖊', whiteboard_permission_open: '📝', many_confused_reactions: '❓', connection_issues: '📶', quiz_low_response: '⚡', chat_spam: '💬', focus_drift: '🐢' };
    return map[type] || '⚠';
  }

  function renderEmergencyDock() {
    var el = $('tlcEmergencyDock');
    if (!el) return;
    var expanded = crisis && crisis.state.emergencyDockExpanded;
    el.classList.toggle('is-expanded', expanded);
    el.querySelectorAll('[data-edock]').forEach(function (btn) {
      btn.onclick = function () { runEmergency(btn.dataset.edock); };
    });
    var toggle = $('tlcEmergencyToggle');
    if (toggle) toggle.onclick = function () {
      if (crisis) crisis.state.emergencyDockExpanded = !crisis.state.emergencyDockExpanded;
      renderEmergencyDock();
    };
  }

  function runEmergency(action) {
    if (!crisis) return;
    var ctx = getCtx();
    var map = {
      'mute-open': 'mute_students',
      'mute-all': 'mute_all',
      'wb-lock': 'lock_whiteboard',
      'wb-revoke': 'revoke_whiteboard_permission',
      'wb-clear': 'clear_student_drawings',
      'chat-close': 'close_chat',
      'lower-all': 'lower_all',
      'rq-next': 'select_next_student',
      'focus': 'start_focus_mode',
      'extend-quiz': 'extend_quiz_time'
    };
    if (action === 'lower-all') {
      deps.showConfirm('Tüm elleri indir', 'Emin misin?', function () {
        deps.participants.forEach(function (p) { p.isHandRaised = false; p.handRaisedAt = null; });
        deps.renderAll();
      });
      return;
    }
    if (action === 'mute-all') { deps.muteAll(); return; }
    if (map[action]) crisis.executeAction(map[action], ctx);
    else if (global.TeacherPermissionUI) global.TeacherPermissionUI.runDockAction(action);
  }

  function renderWhiteboardStrip() {
    var el = $('tlcWbControlStrip');
    if (!el) return;
    if (deps.state.mainStageMode !== 'whiteboard') { el.hidden = true; return; }
    el.hidden = false;
    var sel = deps.state.selectedWhiteboardStudentId;
    var sp = sel ? deps.getP(sel) : null;
    var strokeCount = deps.wbState.strokes ? deps.wbState.strokes.filter(function (s) { return !s.isDeleted; }).length : 0;
    var clutter = crisis && crisis.state.mockFlags.wbClutter;
    el.innerHTML =
      '<div class="tlc-wb-strip-info">' +
        '<span>Whiteboard açık</span>' +
        (sp ? '<span class="tlc-wb-strip-student">· ' + sp.name + ' tahtada</span>' : '<span>· Sadece öğretmen</span>') +
        '<span>· ' + strokeCount + ' stroke</span>' +
        (clutter ? '<span class="tlc-wb-strip-warn">· Karışıklık uyarısı</span>' : '') +
      '</div>' +
      '<div class="tlc-wb-strip-actions">' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-wbs="revoke">İzni kaldır</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-wbs="lock">Kilitle</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-wbs="clear">Öğrenci çizimlerini temizle</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-wbs="hide">Öğrenci katmanını gizle</button>' +
      '</div>';
    el.querySelectorAll('[data-wbs]').forEach(function (btn) {
      btn.onclick = function () {
        if (btn.dataset.wbs === 'revoke') crisis.executeAction('revoke_whiteboard_permission', getCtx());
        else if (btn.dataset.wbs === 'lock') crisis.executeAction('lock_whiteboard', getCtx());
        else if (btn.dataset.wbs === 'clear') crisis.executeAction('clear_student_drawings', getCtx());
        else if (btn.dataset.wbs === 'hide') deps.toast('Öğrenci katmanı gizlendi (mock).');
      };
    });
  }

  function renderChatModeControl() {
    var el = $('tlcChatModeControl');
    if (!el || !crisis) return;
    var modes = [
      { id: 'open', label: 'Açık' },
      { id: 'questions_only', label: 'Sadece soru' },
      { id: 'teacher_only', label: 'Sadece öğretmen' },
      { id: 'muted', label: 'Kapalı' },
      { id: 'exam_mode', label: 'Sınav' }
    ];
    el.innerHTML = '<label>Chat modu</label><div class="tlc-chat-modes">' +
      modes.map(function (m) {
        return '<button type="button" class="tlc-btn tlc-btn--sm tlc-chat-mode' + (crisis.state.chatMode === m.id ? ' is-active' : '') + '" data-cmode="' + m.id + '">' + m.label + '</button>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-cmode]').forEach(function (btn) {
      btn.onclick = function () {
        var mode = btn.dataset.cmode;
        crisis.setChatMode(mode);
        deps.state.isChatEnabled = mode !== 'muted' && mode !== 'exam_mode';
        deps.toast('Chat modu: ' + btn.textContent);
        broadcastChatMode(mode);
        renderChatModeControl();
      };
    });
  }

  function broadcastChatMode(mode) {
    try {
      localStorage.setItem('bilenyum_crisis_bus', JSON.stringify({ event: 'chat_mode', mode: mode, at: Date.now() }));
    } catch (e) { /* ignore */ }
  }

  function renderSmartSuggestions() {
    var el = $('tlcSmartSuggestions');
    if (!el || !crisis) return;
    var sugs = crisis.state.smartSuggestions;
    if (!sugs.length) { el.hidden = true; return; }
    el.hidden = false;
    var renderCard = global.LiveClassUI && global.LiveClassUI.renderSignalCard;
    el.innerHTML = sugs.map(function (s) {
      if (renderCard) return renderCard(s);
      return '<div class="tlc-suggestion tlc-suggestion--' + s.priority + '"><div><strong>' + s.title + '</strong><span>' + s.description + '</span></div>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-sug-act="' + s.action + '">' + s.actionLabel + '</button></div>';
    }).join('');
    el.querySelectorAll('[data-sug-act], [data-signal-act]').forEach(function (btn) {
      btn.onclick = function () {
        var act = btn.dataset.sugAct || btn.dataset.signalAct;
        if (act === 'rq-next') runEmergency('rq-next');
        else if (act.indexOf('insight:') === 0 && global.TeacherStudentInsight) global.TeacherStudentInsight.open(act.slice(8));
        else if (act.indexOf('xp:') === 0 && deps.awardXp) {
          var p = act.split(':');
          deps.awardXp(p[1], parseInt(p[2], 10));
        } else crisis.executeAction(act, getCtx());
      };
    });
  }

  function renderCrisisTimeline() {
    var el = $('tlcCrisisTimeline');
    if (!el || !crisis) return;
    el.innerHTML = '<h4>Kriz zaman çizelgesi</h4><ul>' +
      crisis.state.crisisTimeline.slice(0, 8).map(function (t) {
        return '<li><time>' + new Date(t.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + '</time> ' + t.label + '</li>';
      }).join('') + '</ul>';
  }

  function getStudentRisks(p) {
    var risks = [];
    if (p.micOn && p.micNoise) risks.push({ label: 'Gürültü algılandı', action: 'mute_students' });
    if (p.micOn && !p.isSpeaking && p.id !== 's7') risks.push({ label: 'Mikrofon açık', action: 'mute_students' });
    if (p.speakingWithoutMic) risks.push({ label: 'Mic kapalı konuşuyor', action: 'req-mic' });
    if (p.connectionQuality === 'critical' || p.connectionQuality === 'poor') risks.push({ label: 'Bağlantı ' + p.connectionQuality, action: 'open_student_insight' });
    if (crisis && crisis.state.mockFlags.quizUnansweredIds.indexOf(p.id) >= 0) risks.push({ label: 'Quiz cevaplamadı', action: 'extend_quiz_time' });
    if (p.isHandRaised && !p.isSelectedForWhiteboard) risks.push({ label: 'WB sırası bekliyor', action: 'select_next_student' });
    return risks;
  }

  function renderAll() {
    renderSituationCenter();
    renderEmergencyDock();
    renderWhiteboardStrip();
    renderChatModeControl();
    renderSmartSuggestions();
    renderCrisisTimeline();
    if (global.TeacherPermissionUI) {
      global.TeacherPermissionUI.renderRaisedQueueOnly && global.TeacherPermissionUI.renderRaisedQueueOnly();
    }
  }

  global.TeacherCrisisUI = {
    init: function (d) {
      deps = d;
      crisis = d.crisisManager;
      renderEmergencyDock();
      renderAll();
    },
    renderAll: renderAll,
    getStudentRisks: getStudentRisks,
    runEmergency: runEmergency,
    applyScenario: function (id) { if (crisis) crisis.applyMockScenario(id, getCtx()); },
    getCrisis: function () { return crisis; }
  };

})(typeof window !== 'undefined' ? window : this);
