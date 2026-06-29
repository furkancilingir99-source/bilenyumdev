(function (global) {
  'use strict';

  var deps = {};
  var SCENARIOS = [
    { id: 'normal-live', title: 'Normal canlı ders', actions: ['status:live', 'stage:gallery'] },
    { id: 'waiting-busy', title: 'Bekleme odası kalabalık', actions: ['status:waiting_room', 'wait:fill3'] },
    { id: 'raised-hands', title: 'Öğrenciler el kaldırıyor', actions: ['status:live', 'hand:raise5', 'panel:raised_hands'] },
    { id: 'furkan-wb', title: 'Furkan whiteboard\'a çıktı', actions: ['status:live', 'wb:open', 'hand:furkan', 'wb:select-furkan'] },
    { id: 'zeynep-wb', title: 'Zeynep whiteboard\'a çıktı', actions: ['status:live', 'wb:open', 'hand:s4', 'wb:select-s4'] },
    { id: 'invalid-wb', title: 'El kaldırmayan seçilemedi', actions: ['status:live', 'wb:open', 'wb:select-not-raised'] },
    { id: 'wb-teach', title: 'Öğretmen whiteboard anlatımı', actions: ['status:live', 'wb:open', 'wb:mock-teacher-draw'] },
    { id: 'wb-student-draw', title: 'Seçili öğrenci çözüm yazıyor', actions: ['status:live', 'wb:open', 'hand:furkan', 'wb:select-furkan', 'wb:mock-student-draw'] },
    { id: 'wb-revoke', title: 'Yazma izni kaldırıldı', actions: ['status:live', 'wb:open', 'hand:furkan', 'wb:select-furkan', 'wb:revoke'] },
    { id: 'sq-abcd', title: 'Ekrandaki soru A/B/C/D boş', actions: ['status:live', 'wb:open', 'sq:abcd'] },
    { id: 'sq-open', title: 'Ekrandaki soru açık uçlu', actions: ['status:live', 'sq:open'] },
    { id: 'sq-open-filled', title: 'Açık uçlu cevaplar doldu', actions: ['status:live', 'sq:open', 'sq:simulate-all'] },
    { id: 'sq-results', title: 'Quiz sonuçları açıklandı', actions: ['status:live', 'sq:abcd', 'sq:simulate-all', 'sq:show-results'] },
    { id: 'conn-issues', title: 'Bağlantı sorunları', actions: ['status:live', 'conn:weak-random', 'conn:offline-s11'] },
    { id: 'confused-wave', title: 'Anlamadım dalgası', actions: ['status:live', 'react:confused3'] },
    { id: 'focus-mode', title: 'Odak modu', actions: ['status:live', 'focus:on'] },
    { id: 'screen-share', title: 'Ekran paylaşımı', actions: ['status:live', 'stage:screen_share'] },
    { id: 'break-time', title: 'Ders arası', actions: ['status:break'] },
    { id: 'ended', title: 'Ders sona erdi', actions: ['status:ended'] },
    { id: 'heavy-demo', title: 'Yoğun demo', actions: ['status:live', 'wb:open', 'chat:burst', 'hand:raise5', 'sq:abcd', 'react:mixed', 'conn:weak-random'] },
    { id: 'insight-furkan', title: 'Furkan detay paneli', actions: ['status:live', 'insight:s0'] },
    { id: 'insight-zeynep', title: 'Zeynep detay paneli', actions: ['status:live', 'insight:s4'] },
    { id: 'insight-weak', title: 'Zayıf bağlantı öğrenci', actions: ['status:live', 'insight:s9'] },
    { id: 'insight-xp-top', title: 'En yüksek XP', actions: ['status:live', 'insight:s4'] },
    { id: 'xp-bonus', title: 'Furkan\'a +25 XP', actions: ['status:live', 'xp:s0:25'] },
    { id: 'badge-give', title: 'Furkan\'a rozet ver', actions: ['status:live', 'badge:s0'] },
    { id: 'smart-sug', title: 'Durum sinyalleri', actions: ['status:live', 'hand:raise5', 'react:confused3'] },
    { id: 'exam-mode', title: 'Sınav modu', actions: ['status:live', 'preset:exam'] },
    { id: 'gamification-summary', title: 'Ders sonu gamification', actions: ['status:ended'] }
  ];

  var PANEL_SECTIONS = [
    { title: 'Senaryolar', buttons: SCENARIOS.map(function (s) { return { action: 'scenario:' + s.id, label: s.title }; }) },
    { title: 'Oturum', buttons: [
      { action: 'status:preclass', label: 'Preclass' }, { action: 'status:waiting_room', label: 'Waiting room' },
      { action: 'status:live', label: 'Live başlat' }, { action: 'status:break', label: 'Ara ver' },
      { action: 'status:ended', label: 'Dersi bitir' }, { action: 'conn:reconnecting', label: 'Reconnecting' },
      { action: 'conn:disconnected', label: 'Disconnected' }, { action: 'conn:reset', label: 'Bağlantı normale dön' }
    ]},
    { title: 'Bekleme odası', buttons: [
      { action: 'wait:fill3', label: '3 öğrenci beklesin' }, { action: 'wait:accept-all', label: 'Tümünü kabul et' },
      { action: 'wait:accept-random', label: 'Rastgele kabul et' }
    ]},
    { title: 'Katılımcılar', buttons: [
      { action: 'random:speak', label: 'Rastgele konuşsun' }, { action: 'teacher:speak', label: 'Öğretmen konuşsun' },
      { action: 'mute:all', label: 'Tümünü sessize al' }, { action: 'random:mute', label: 'Rastgele sessize' },
      { action: 'random:req-mic', label: 'Mic açmasını iste' }, { action: 'random:req-cam', label: 'Cam açmasını iste' },
      { action: 'random:cam-off', label: 'Rastgele cam kapat' }, { action: 'conn:weak-random', label: 'Zayıf bağlantı' },
      { action: 'conn:offline-s11', label: 'Alp offline' }, { action: 'conn:reset', label: 'Bağlantıları düzelt' }
    ]},
    { title: 'El kaldırma', buttons: [
      { action: 'hand:furkan', label: 'Furkan el kaldırsın' }, { action: 'hand:raise5', label: '5 el kaldırsın' },
      { action: 'hand:lower-all', label: 'Tüm elleri indir' }, { action: 'wb:select-next', label: 'Sıradakini seç' },
      { action: 'wb:select-furkan', label: 'Furkan\'ı tahtaya seç' }, { action: 'wb:select-not-raised', label: 'El kaldırmayanı dene' },
      { action: 'wb:revoke', label: 'WB iznini kaldır' }
    ]},
    { title: 'Whiteboard', buttons: [
      { action: 'wb:open', label: 'Aç' }, { action: 'wb:close', label: 'Kapat' }, { action: 'wb:lock', label: 'Kilitle' },
      { action: 'wb:mock-teacher-draw', label: 'Öğretmen çizimi' }, { action: 'wb:mock-student-draw', label: 'Öğrenci çizimi' },
      { action: 'wb:clear-students', label: 'Öğrenci çizimlerini sil' }, { action: 'wb:clear-all', label: 'Tüm tahtayı sil' },
      { action: 'wb:pen-2', label: 'Kalem 2' }, { action: 'wb:pen-8', label: 'Kalem 8' }, { action: 'wb:eraser-24', label: 'Silgi 24' }
    ]},
    { title: 'Cevap toplama', buttons: [
      { action: 'quiz:mc', label: 'Manuel çoktan seçmeli' }, { action: 'quiz:open', label: 'Manuel açık uçlu' },
      { action: 'sq:abcd', label: 'Ekran A/B/C/D boş' }, { action: 'sq:abcde', label: 'Ekran A/B/C/D/E boş' },
      { action: 'sq:open', label: 'Ekran açık uçlu' }, { action: 'sq:truefalse', label: 'Ekran doğru/yanlış' },
      { action: 'sq:half', label: 'Yarısı cevaplasın' }, { action: 'sq:simulate-all', label: 'Tümü cevaplasın' },
      { action: 'sq:three-no', label: '3 cevaplamasın' }, { action: 'sq:show-results', label: 'Sonuçları göster' },
      { action: 'sq:hide-results', label: 'Sonuçları gizle' }, { action: 'sq:stop', label: 'Cevap toplamayı durdur' }
    ]},
    { title: 'Chat / Soru', buttons: [
      { action: 'chat:burst', label: '10 mesaj üret' }, { action: 'chat:question', label: 'Rastgele soru' },
      { action: 'chat:5questions', label: '5 soru üret' }, { action: 'chat:toggle', label: 'Chat aç/kapat' },
      { action: 'seed:load', label: 'Büyük demo verisini yükle' }
    ]},
    { title: 'Insight / XP', buttons: [
      { action: 'insight:s0', label: 'Furkan detay paneli' },
      { action: 'insight:s4', label: 'Zeynep detay paneli' },
      { action: 'insight:s9', label: 'Zayıf bağlantı öğrenci' },
      { action: 'xp:s0:25', label: 'Furkan +25 XP' },
      { action: 'badge:s0', label: 'Furkan rozet ver' },
      { action: 'preset:exam', label: 'Sınav modu preset' }
    ]},
    { title: 'Reaksiyon', buttons: [
      { action: 'react:confused3', label: '3 anlamadım' }, { action: 'react:slow5', label: '5 yavaşla' },
      { action: 'react:mixed', label: 'Karışık reaksiyon' }, { action: 'react:clear', label: 'Temizle' }
    ]},
    { title: 'Kriz Yönetimi', buttons: (global.CrisisDemoSeed ? global.CrisisDemoSeed.CRISIS_SCENARIOS : []).map(function (s) {
      return { action: 'crisis:' + s.id, label: s.title };
    }) },
    { title: 'Birleşik Demo (LiveClass)', buttons: (global.LiveClassDemoSeed ? global.LiveClassDemoSeed.scenarios : []).map(function (s) {
      return { action: 'scenario:' + s.id, label: s.title };
    }) }
  ];

  function renderPanel(container) {
    if (!container) return;
    var html = '<h4>Teacher Demo Controls</h4><p class="tlc-demo-sub">Mock canlı ders senaryolarını test et</p>';
    PANEL_SECTIONS.forEach(function (sec) {
      html += '<section class="tlc-demo-section"><strong>' + sec.title + '</strong>';
      sec.buttons.forEach(function (b) {
        html += '<button type="button" data-demo="' + b.action + '">' + b.label + '</button>';
      });
      html += '</section>';
    });
    container.innerHTML = html;
    container.querySelectorAll('[data-demo]').forEach(function (btn) {
      btn.addEventListener('click', function () { runAction(btn.getAttribute('data-demo')); });
    });
  }

  function runScenario(id) {
    var sc = SCENARIOS.find(function (s) { return s.id === id; });
    if (!sc) return;
    deps.toast('Senaryo: ' + sc.title);
    sc.actions.forEach(function (a, i) {
      setTimeout(function () { runAction(a); }, i * 350);
    });
  }

  function runAction(action) {
    if (!action) return;
    if (action.indexOf('scenario:') === 0) { runScenario(action.slice(9)); return; }

    var parts = action.split(':');
    var cat = parts[0];
    var val = parts[1];

    if (cat === 'status') {
      if (val === 'live') { deps.setSessionStatus('live'); deps.startTimer && deps.startTimer(); }
      else if (val === 'waiting_room') { deps.setSessionStatus('waiting_room'); }
      else if (val === 'break') { deps.setSessionStatus('break'); deps.startBreakTimer && deps.startBreakTimer(); }
      else deps.setSessionStatus(val);
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'stage') {
      if (val === 'gallery') deps.setMainStage('gallery');
      if (val === 'screen_share') { deps.state.isScreenSharing = true; deps.setMainStage('screen_share'); }
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'panel' && val === 'raised_hands') { deps.setPanelTab('raised_hands'); return; }
    if (cat === 'focus') { deps.toggleFocus && deps.toggleFocus(val === 'on'); return; }
    if (cat === 'wait') {
      if (val === 'fill3') {
        waitingRoomStudents.forEach(function (w) {
          var exists = participants.some(function (p) { return p.id === w.id || p.name === w.name; });
          if (!exists) {
            participants.push({
              id: w.id, name: w.name, role: 'student', emoji: w.emoji || '👤',
              cameraOn: w.cameraOn, micOn: false, connectionQuality: w.connectionQuality || 'good',
              isHandRaised: false, isMutedByTeacher: false, isSelectedForWhiteboard: false,
              isInWaitingRoom: true, isSelf: false
            });
          } else {
            var p = participants.find(function (x) { return x.name === w.name; });
            if (p) p.isInWaitingRoom = true;
          }
        });
        deps.toast('3 öğrenci bekleme odasında.');
      }
      if (val === 'accept-all') deps.participants.forEach(function (p) { p.isInWaitingRoom = false; });
      if (val === 'accept-random') {
        var waiting = deps.participants.filter(function (p) { return p.isInWaitingRoom; });
        if (waiting.length) waiting[0].isInWaitingRoom = false;
      }
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'hand') {
      if (val === 'furkan') { var f = deps.getP('s0'); if (f) { f.isHandRaised = true; f.handRaisedAt = Date.now(); } }
      if (val === 'raise5') deps.participants.filter(function (p) { return p.role === 'student'; }).slice(0, 5).forEach(function (p) { p.isHandRaised = true; p.handRaisedAt = Date.now(); });
      if (val === 's4') { var z = deps.getP('s4'); if (z) { z.isHandRaised = true; z.handRaisedAt = Date.now(); } }
      if (val === 'lower-all') deps.participants.forEach(function (p) { p.isHandRaised = false; p.handRaisedAt = null; });
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'teacher' && val === 'speak') {
      deps.participants.forEach(function (p) { p.isSpeaking = p.id === 'teacher'; });
      deps.state.activeSpeakerId = 'teacher';
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'conn') {
      if (val === 'weak-random') {
        var sts = deps.participants.filter(function (p) { return p.role === 'student'; });
        var p = sts[Math.floor(Math.random() * sts.length)];
        if (p) { p.connectionQuality = 'poor'; deps.toast(p.name + ' bağlantısı zayıf.'); }
      }
      if (val === 'offline-s11') { var a = deps.getP('s11'); if (a) { a.connectionQuality = 'offline'; deps.toast(a.name + ' offline.'); } }
      if (val === 'reconnecting') { deps.setSessionStatus('live'); deps.toast('Yeniden bağlanılıyor…'); }
      if (val === 'disconnected') deps.toast('Bağlantı kesildi (mock).');
      if (val === 'reset') deps.participants.filter(function (p) { return p.role === 'student'; }).forEach(function (p) { p.connectionQuality = 'good'; });
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'react') {
      if (val === 'confused3') { deps.state.reactions.confused += 3; deps.toast('3 öğrenci anlamadım gönderdi.'); }
      if (val === 'slow5') { deps.state.reactions.slow += 5; deps.toast('5 öğrenci yavaşla istedi.'); }
      if (val === 'mixed') { deps.state.reactions.clap += 2; deps.state.reactions.confused += 2; deps.state.reactions.slow += 3; }
      if (val === 'clear') deps.state.reactions = { clap: 0, like: 0, heart: 0, smile: 0, confused: 0, slow: 0, fast: 0 };
      deps.renderReactions && deps.renderReactions();
      deps.renderAll && deps.renderAll();
      return;
    }
    if (cat === 'chat') {
      if (val === 'burst') {
        for (var i = 0; i < 10; i++) {
          deps.chatMessages.push({ id: 'burst-' + Date.now() + i, senderId: 's' + (i % 12), senderName: 'Öğrenci', type: 'student', content: 'Demo mesaj #' + (i + 1), createdAt: deps.fmtDuration(deps.state.elapsed) });
        }
        deps.renderChat && deps.renderChat();
      }
      if (val === '5questions') {
        for (var j = 0; j < 5; j++) deps.questions.push({ id: 'dq-' + Date.now() + j, studentId: 's' + j, studentName: 'Öğrenci ' + j, content: 'Demo soru ' + j, status: 'waiting', createdAt: deps.fmtDuration(deps.state.elapsed) });
        deps.renderQuestions && deps.renderQuestions();
      }
      if (val === 'question') deps.handleMock && deps.handleMock('chat:question');
      if (val === 'toggle') deps.handleMock && deps.handleMock('chat:toggle');
      return;
    }
    if (cat === 'seed' && val === 'load') { deps.loadDemoSeed && deps.loadDemoSeed(); return; }
    if (cat === 'insight') { deps.openInsight && deps.openInsight(val); return; }
    if (cat === 'xp') {
      var parts2 = action.split(':');
      deps.awardXp && deps.awardXp(parts2[1], parseInt(parts2[2], 10) || 10);
      return;
    }
    if (cat === 'badge') { deps.toast('Problem Çözücü rozeti verildi (mock).'); return; }
    if (cat === 'preset' && val === 'exam') { if (global.TeacherPermissionUI) global.TeacherPermissionUI.runDockAction('exam-mode'); return; }
    if (cat === 'sq') {
      var TSQ = global.TeacherScreenQuestion;
      if (!TSQ) return;
      if (val === 'abcd') TSQ.sendBlankChoice(4);
      else if (val === 'abcde') TSQ.sendBlankChoice(5);
      else if (val === 'open') TSQ.sendOpenEnded({});
      else if (val === 'truefalse') TSQ.sendTrueFalse();
      else if (val === 'half') TSQ.simulateResponses({ ratio: 0.5 });
      else if (val === 'simulate-all') TSQ.simulateResponses({ ratio: 1 });
      else if (val === 'three-no') TSQ.simulateResponses({ ratio: 0.75 });
      else if (val === 'show-results') TSQ.toggleResults(true);
      else if (val === 'hide-results') TSQ.toggleResults(false);
      else if (val === 'stop') TSQ.stop && TSQ.stop();
      return;
    }
    if (cat === 'wb' && val === 'revoke') { deps.revokeWhiteboard && deps.revokeWhiteboard(); return; }
    if (cat === 'wb' && val === 'select-next') {
      var raised = deps.sortRaisedHands(deps.participants);
      if (raised.length) deps.selectForWhiteboard(raised[0].id);
      return;
    }
    if (cat === 'wb' && val === 'select-s4') { deps.selectForWhiteboard('s4'); return; }
    if (cat === 'wb' && val === 'pen-2') { deps.wbState.selectedWidth = 2; deps.toast('Kalem boyutu: 2'); return; }
    if (cat === 'wb' && val === 'pen-8') { deps.wbState.selectedWidth = 8; deps.toast('Kalem boyutu: 8'); return; }
    if (cat === 'wb' && val === 'eraser-24') { deps.wbState.eraserRadius = 24; deps.toast('Silgi: 24'); return; }

    if (deps.handleMock) deps.handleMock(action);
  }

  global.TeacherDemoControls = {
    init: function (d) {
      deps = d;
      var panel = document.getElementById('tlcMockPanel');
      renderPanel(panel);
      var toggle = document.getElementById('tlcMockToggle');
      if (toggle) { toggle.textContent = '!'; toggle.title = 'Demo / senaryo paneli'; }
    },
    runAction: runAction,
    runScenario: runScenario,
    SCENARIOS: SCENARIOS
  };

})(typeof window !== 'undefined' ? window : this);
