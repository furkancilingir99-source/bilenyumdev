(function (global) {
  'use strict';

  var deps = {};
  var insights = {};
  var gamEngine = null;
  var permMgr = null;
  var openStudentId = null;
  var activeTab = 'overview';

  var TABS = [
    { id: 'overview', label: 'Özet' },
    { id: 'permissions', label: 'İzinler' },
    { id: 'activity', label: 'Aktivite' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'whiteboard', label: 'Tahta' },
    { id: 'gamification', label: 'XP' },
    { id: 'connection', label: 'Bağlantı' },
    { id: 'notes', label: 'Notlar' }
  ];

  var PERM_LABELS = {
    canUseMicrophone: 'Ses',
    canUseCamera: 'Kamera',
    canSendChat: 'Chat',
    canAskQuestion: 'Soru sorma',
    canRaiseHand: 'El kaldırma',
    canUseReactions: 'Reaksiyon',
    canAnswerQuiz: 'Quiz cevaplama',
    canDrawOnWhiteboard: 'Whiteboard yazma',
    canUseWhiteboardEraser: 'Silgi',
    canUseWhiteboardUndo: 'Undo/Redo',
    isFocusLocked: 'Odak kilidi'
  };

  var WB_STATUS_LABELS = {
    not_allowed: 'Yazamaz',
    raised_hand_waiting: 'El kaldırdı, seçim bekliyor',
    selected_can_draw: 'Tahtada yazıyor',
    permission_revoked: 'İzin kaldırıldı',
    expired: 'Süre doldu',
    locked_by_teacher: 'Whiteboard kilitli'
  };

  function $(id) { return document.getElementById(id); }

  function getInsight(studentId) {
    return insights[studentId] || null;
  }

  function syncLiveFromParticipant(ins, p) {
    if (!ins || !p) return ins;
    ins.liveStatus.isOnline = p.connectionQuality !== 'offline';
    ins.liveStatus.isSpeaking = !!p.isSpeaking;
    ins.liveStatus.isHandRaised = !!p.isHandRaised;
    ins.liveStatus.isSelectedForWhiteboard = !!p.isSelectedForWhiteboard;
    ins.profile.name = p.name;
    if (p.isSelectedForWhiteboard) {
      ins.permissions.whiteboardStatus = 'selected_can_draw';
      ins.permissions.canDrawOnWhiteboard = true;
    } else if (p.isHandRaised) {
      ins.permissions.whiteboardStatus = 'raised_hand_waiting';
    }
    return ins;
  }

  function fmtDuration(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ' dk' + (s ? ' ' + s + ' sn' : '');
  }

  function open(studentId) {
    var p = deps.getP(studentId);
    if (!p || p.role !== 'student') return;
    openStudentId = studentId;
    var ins = getInsight(studentId);
    if (ins) syncLiveFromParticipant(ins, p);
    $('tlcInsightDrawer').hidden = false;
    $('tlcInsightDrawer').classList.add('is-open');
    $('tlcInsightBackdrop').hidden = false;
    render();
    deps.toast(p.name + ' — canlı veri paneli');
  }

  function close() {
    openStudentId = null;
    $('tlcInsightDrawer').classList.remove('is-open');
    $('tlcInsightDrawer').hidden = true;
    $('tlcInsightBackdrop').hidden = true;
  }

  function renderHeader(ins, p) {
    var prof = ins.profile;
    var conn = ins.connection;
    var statusParts = [];
    if (p.connectionQuality === 'offline') statusParts.push('Offline');
    else statusParts.push('Canlı derste');
    statusParts.push('Bağlantı: ' + conn.quality);
    if (p.isHandRaised) statusParts.push('El kaldırdı');
    if (p.isSelectedForWhiteboard) statusParts.push('Tahtada');
    $('tlcInsightHeader').innerHTML =
      '<div class="tlc-insight-avatar">' + (prof.avatarEmoji || p.emoji || '👤') + '</div>' +
      '<div class="tlc-insight-head-meta">' +
        '<h3>' + prof.name + '</h3>' +
        '<p>' + statusParts.join(' · ') + '</p>' +
        '<p class="tlc-insight-xp-line">Bugünkü XP: <strong>+' + prof.lessonXp + '</strong> · Seviye ' + prof.level +
        (ins.gamification.badges.length ? ' · ' + ins.gamification.badges[0].icon + ' ' + ins.gamification.badges[0].name : '') + '</p>' +
      '</div>' +
      '<button type="button" class="tlc-insight-close" id="tlcInsightClose" aria-label="Kapat">✕</button>';
    $('tlcInsightClose').onclick = close;
  }

  function renderQuickActions(p) {
    var canWb = p.isHandRaised && !p.isInWaitingRoom;
    $('tlcInsightActions').innerHTML =
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="mute">Sessiz</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="req-mic">Mic iste</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="req-cam">Cam iste</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="wb-select"' + (canWb ? '' : ' disabled title="El kaldırmadığı için seçilemez"') + '>Tahtaya seç</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="wb-revoke">İzin kaldır</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="lower-hand">El indir</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="xp-10">+10 XP</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="xp-25">+25 XP</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-ia="badge">Rozet ver</button>';
    $('tlcInsightActions').querySelectorAll('[data-ia]').forEach(function (btn) {
      btn.onclick = function () { handleAction(btn.dataset.ia); };
    });
  }

  function handleAction(act) {
    if (!openStudentId) return;
    if (act === 'mute') deps.handleParticipantAction(openStudentId, 'mute');
    else if (act === 'req-mic') deps.handleParticipantAction(openStudentId, 'req-mic');
    else if (act === 'req-cam') deps.handleParticipantAction(openStudentId, 'req-cam');
    else if (act === 'wb-select') deps.selectForWhiteboard(openStudentId);
    else if (act === 'wb-revoke') deps.revokeWhiteboard();
    else if (act === 'lower-hand') deps.lowerHand(openStudentId);
    else if (act === 'xp-10' || act === 'xp-25') {
      var amt = act === 'xp-25' ? 25 : 10;
      if (gamEngine) gamEngine.awardXp(openStudentId, 'teacher_bonus_xp', { xpDelta: amt });
      var ins = getInsight(openStudentId);
      if (ins) ins.gamification.lessonXp += amt;
      deps.toast('+' + amt + ' XP verildi.');
      render();
    } else if (act === 'badge') {
      deps.toast('Problem Çözücü rozeti verildi (mock).');
    }
    deps.renderAll();
  }

  function renderOverview(ins) {
    var att = ins.attendance;
    var qs = ins.quizStats;
    var wb = ins.whiteboardStats;
    var p = deps.getP && deps.getP(openStudentId);
    var risksHtml = '';
    if (p && global.TeacherCrisisUI) {
      var risks = global.TeacherCrisisUI.getStudentRisks(p);
      if (risks.length) {
        risksHtml = '<div class="tlc-insight-risks"><h4>Anlık Riskler</h4><ul>' +
          risks.map(function (r) {
            return '<li><span>' + r.label + '</span><button type="button" class="tlc-btn tlc-btn--sm" data-risk-act="' + r.action + '">Çöz</button></li>';
          }).join('') + '</ul></div>';
      }
    }
    return risksHtml +
      '<div class="tlc-insight-metrics">' +
      metricCard('Katılım', fmtDuration(att.activeSeconds)) +
      metricCard('Aktiflik', '%' + Math.round((att.activeSeconds / 2700) * 100)) +
      metricCard('Quiz', qs.answeredCount + '/' + qs.totalQuizSent) +
      metricCard('Doğru', String(qs.correctCount)) +
      metricCard('El kaldırma', String(ins.activities.filter(function (a) { return a.type === 'raised_hand'; }).length)) +
      metricCard('Whiteboard', wb.selectedCount + ' katkı') +
      metricCard('XP', '+' + ins.gamification.lessonXp) +
    '</div>' +
    '<div class="tlc-insight-badges-row">' + renderLiveBadges(ins) + '</div>';
  }

  function metricCard(label, val) {
    return '<div class="tlc-insight-metric"><span>' + label + '</span><strong>' + val + '</strong></div>';
  }

  function renderLiveBadges(ins) {
    var badges = [];
    if (ins.liveStatus.isOnline) badges.push('<span class="tlc-live-badge is-live">Derste</span>');
    if (ins.liveStatus.isHandRaised) badges.push('<span class="tlc-live-badge is-hand">El kaldırdı</span>');
    if (ins.liveStatus.isSelectedForWhiteboard) badges.push('<span class="tlc-live-badge is-wb">Whiteboard\'da</span>');
    if (ins.connection.quality === 'poor' || ins.connection.quality === 'critical') badges.push('<span class="tlc-live-badge is-warn">Bağlantı zayıf</span>');
    if (!ins.permissions.canUseMicrophone) badges.push('<span class="tlc-live-badge is-muted">Mikrofon kapalı</span>');
    return badges.join('');
  }

  function renderPermissions(ins) {
    var perm = ins.permissions;
    var html = '<div class="tlc-insight-wb-status">' +
      '<strong>Whiteboard:</strong> ' + (WB_STATUS_LABELS[perm.whiteboardStatus] || WB_STATUS_LABELS.not_allowed) +
    '</div><div class="tlc-insight-perm-grid">';
    Object.keys(PERM_LABELS).forEach(function (key) {
      var on = !!perm[key];
      html += '<div class="tlc-insight-perm-card">' +
        '<span>' + PERM_LABELS[key] + '</span>' +
        '<button type="button" class="tlc-perm-toggle' + (on ? ' is-on' : '') + '" data-perm="' + key + '" aria-pressed="' + on + '">' + (on ? 'Açık' : 'Kapalı') + '</button>' +
      '</div>';
    });
    html += '</div><div class="tlc-insight-presets"><strong>Hızlı preset</strong><div class="tlc-insight-preset-btns">' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-preset="silent_viewer">Sessiz izleyici</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-preset="active_participant">Aktif katılımcı</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-preset="whiteboard_student">WB öğrencisi</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" data-preset="exam_mode">Sınav modu</button>' +
    '</div></div>';
    return html;
  }

  function renderActivity(ins, filter) {
    var acts = ins.activities.slice().reverse();
    if (filter && filter !== 'all') acts = acts.filter(function (a) { return a.type.indexOf(filter) >= 0 || (filter === 'quiz' && a.type.indexOf('quiz') >= 0); });
    return '<div class="tlc-insight-filters">' +
      ['all', 'quiz', 'whiteboard', 'chat', 'reaction', 'xp'].map(function (f) {
        return '<button type="button" class="tlc-btn tlc-btn--sm tlc-act-filter' + (filter === f ? ' is-active' : '') + '" data-filter="' + f + '">' + f + '</button>';
      }).join('') +
    '</div><ul class="tlc-insight-timeline">' +
    acts.slice(0, 20).map(function (a) {
      var time = new Date(a.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      return '<li><time>' + time + '</time> · ' + a.label + (a.value ? ' — ' + a.value : '') + '</li>';
    }).join('') + '</ul>';
  }

  function renderQuizTab(ins) {
    var qs = ins.quizStats;
    return '<div class="tlc-insight-metrics">' +
      metricCard('Cevaplanan', qs.answeredCount + '/' + qs.totalQuizSent) +
      metricCard('Doğru', String(qs.correctCount)) +
      metricCard('Yanlış', String(qs.incorrectCount)) +
      metricCard('Ort. süre', qs.averageResponseTimeSeconds + ' sn') +
      metricCard('Doğruluk', qs.accuracyRate + '%') +
    '</div>' +
    '<div class="tlc-insight-quiz-sample">' +
      '<h4>Ekrandaki soru · Şıklı cevap</h4>' +
      '<p><strong>' + ins.profile.name + '</strong> cevabı: <strong>C</strong></p>' +
      '<p class="tlc-preclass-meta">Cevap süresi: 14 sn · Durum: Değerlendirilmedi</p>' +
    '</div>' +
    '<div class="tlc-insight-quiz-sample">' +
      '<h4>Açık uçlu cevap</h4>' +
      '<p>“Önce sabit terimi karşıya atarız, sonra katsayıya böleriz.”</p>' +
      '<p class="tlc-preclass-meta">Durum: İncelemede</p>' +
    '</div>';
  }

  function renderWhiteboardTab(ins) {
    var wb = ins.whiteboardStats;
    return '<div class="tlc-insight-metrics">' +
      metricCard('Seçilme', String(wb.selectedCount)) +
      metricCard('Stroke', String(wb.strokeCount)) +
      metricCard('Kalem', String(wb.penStrokeCount)) +
      metricCard('Silgi', String(wb.eraserUsageCount)) +
      metricCard('Süre', fmtDuration(wb.totalDrawingTimeSeconds)) +
    '</div>' +
    '<div class="tlc-insight-wb-preview"><span>📝</span><p>Son çizim preview (mock)</p></div>';
  }

  function renderGamificationTab(ins) {
    var g = ins.gamification;
    return '<div class="tlc-insight-metrics">' +
      metricCard('Bugün XP', '+' + g.lessonXp) +
      metricCard('Toplam XP', String(g.totalXp)) +
      metricCard('Seviye', String(g.level)) +
      metricCard('Katılım', String(g.participationScore)) +
      metricCard('Quiz skoru', String(g.quizScore)) +
      metricCard('WB skoru', String(g.whiteboardScore)) +
    '</div>' +
    '<h4>Rozetler</h4><div class="tlc-insight-badge-grid">' +
    g.badges.map(function (b) {
      return '<div class="tlc-insight-badge" title="' + b.description + '"><span>' + b.icon + '</span><small>' + b.name + '</small></div>';
    }).join('') + '</div>' +
    '<h4>Başarılar</h4>' + g.achievements.map(function (a) {
      var pct = Math.round((a.progressCurrent / a.progressTarget) * 100);
      return '<div class="tlc-insight-ach"><span>' + a.title + '</span><div class="tlc-insight-ach-bar"><div style="width:' + pct + '%"></div></div><small>' + a.progressCurrent + '/' + a.progressTarget + '</small></div>';
    }).join('');
  }

  function renderConnectionTab(ins) {
    var c = ins.connection;
    var warn = (c.quality === 'poor' || c.quality === 'critical') ?
      '<div class="tlc-insight-alert">Bu öğrencinin bağlantısı zayıf. Quiz cevabı veya whiteboard çizimi gecikebilir.</div>' : '';
    return warn + '<div class="tlc-insight-metrics">' +
      metricCard('Kalite', c.quality) +
      metricCard('Ping', c.pingMs + ' ms') +
      metricCard('Paket kaybı', c.packetLossPercent + '%') +
      metricCard('Bitrate', c.bitrateKbps + ' kbps') +
      metricCard('Yeniden bağlanma', String(c.reconnectCount)) +
    '</div>';
  }

  function renderNotesTab(ins) {
    return '<p class="tlc-preclass-meta">Öğrenci not aldı mı: ' + (ins.notesSummary.tookNotes ? 'Evet' : 'Hayır') +
      ' · Not sayısı: ' + ins.notesSummary.noteCount + ' · Ekran görüntüsü: ' + ins.notesSummary.screenshotCount + '</p>' +
      '<p class="tlc-preclass-meta" style="margin-bottom:8px"><em>Öğrenci not içeriği öğretmene gösterilmez (gizlilik kuralı).</em></p>' +
      '<label>Öğretmen notu</label>' +
      '<textarea class="tlc-notes-area" id="tlcInsightTeacherNote" rows="4">' + (ins.teacherNotes || '') + '</textarea>';
  }

  function render() {
    if (!openStudentId) return;
    var ins = getInsight(openStudentId);
    var p = deps.getP(openStudentId);
    if (!ins || !p) return;
    syncLiveFromParticipant(ins, p);
    renderHeader(ins, p);
    renderQuickActions(p);
    $('tlcInsightTabs').innerHTML = TABS.map(function (t) {
      return '<button type="button" class="tlc-insight-tab' + (activeTab === t.id ? ' is-active' : '') + '" data-itab="' + t.id + '">' + t.label + '</button>';
    }).join('');
    $('tlcInsightTabs').querySelectorAll('[data-itab]').forEach(function (btn) {
      btn.onclick = function () { activeTab = btn.dataset.itab; render(); };
    });
    var body = '';
    if (activeTab === 'overview') body = renderOverview(ins);
    else if (activeTab === 'permissions') body = renderPermissions(ins);
    else if (activeTab === 'activity') body = renderActivity(ins, 'all');
    else if (activeTab === 'quiz') body = renderQuizTab(ins);
    else if (activeTab === 'whiteboard') body = renderWhiteboardTab(ins);
    else if (activeTab === 'gamification') body = renderGamificationTab(ins);
    else if (activeTab === 'connection') body = renderConnectionTab(ins);
    else if (activeTab === 'notes') body = renderNotesTab(ins);
    $('tlcInsightBody').innerHTML = body;
    bindTabEvents(ins);
  }

  function bindTabEvents(ins) {
    $('tlcInsightBody').querySelectorAll('[data-perm]').forEach(function (btn) {
      btn.onclick = function () {
        if (!permMgr || !openStudentId) return;
        var key = btn.dataset.perm;
        var st = permMgr.getState(openStudentId);
        permMgr.setPermission(openStudentId, key, !st[key]);
        ins.permissions = permMgr.getState(openStudentId);
        deps.toast(PERM_LABELS[key] + ' güncellendi.');
        render();
      };
    });
    $('tlcInsightBody').querySelectorAll('[data-preset]').forEach(function (btn) {
      btn.onclick = function () {
        if (!permMgr || !openStudentId) return;
        permMgr.applyPreset(openStudentId, btn.dataset.preset);
        ins.permissions = permMgr.getState(openStudentId);
        deps.toast('Preset uygulandı.');
        render();
      };
    });
    $('tlcInsightBody').querySelectorAll('.tlc-act-filter').forEach(function (btn) {
      btn.onclick = function () {
        $('tlcInsightBody').innerHTML = renderActivity(ins, btn.dataset.filter);
        bindTabEvents(ins);
      };
    });
    $('tlcInsightBody').querySelectorAll('[data-risk-act]').forEach(function (btn) {
      btn.onclick = function () {
        var act = btn.dataset.riskAct;
        var sp = deps.getP(openStudentId);
        if (act === 'mute_students') deps.handleParticipantAction(openStudentId, 'mute');
        else if (act === 'extend_quiz_time') deps.toast('Quiz süresi +30 sn (mock).');
        else if (act === 'select_next_student' && sp && sp.isHandRaised) deps.selectForWhiteboard(openStudentId);
        else if (act === 'req-mic') deps.handleParticipantAction(openStudentId, 'req-mic');
        deps.renderAll && deps.renderAll();
        render();
      };
    });
    var noteEl = $('tlcInsightTeacherNote');
    if (noteEl) noteEl.onchange = function () { ins.teacherNotes = noteEl.value; };
  }

  function loadInsights(seedMap) {
    insights = seedMap || {};
  }

  function bindClicks() {
    document.addEventListener('click', function (e) {
      var insightEl = e.target.closest('[data-insight-id]');
      if (insightEl && !e.target.closest('[data-act]') && !e.target.closest('[data-ia]')) {
        open(insightEl.dataset.insightId);
        return;
      }
    });
  }

  global.TeacherStudentInsight = {
    init: function (d) {
      deps = d;
      gamEngine = d.gamEngine;
      permMgr = d.permMgr;
      loadInsights(d.insights);
      bindClicks();
      if ($('tlcInsightBackdrop')) $('tlcInsightBackdrop').onclick = close;
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && openStudentId) close();
      });
    },
    open: open,
    close: close,
    render: render,
    getOpenId: function () { return openStudentId; },
    loadInsights: loadInsights
  };

})(typeof window !== 'undefined' ? window : this);
