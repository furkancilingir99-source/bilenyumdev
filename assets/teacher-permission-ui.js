(function (global) {
  'use strict';

  var deps = {};
  var permMgr = null;
  var suggestions = [];

  function $(id) { return document.getElementById(id); }

  function renderAnalyticsBar() {
    if (global.TeacherCrisisUI) return;
    var el = $('tlcClassAnalytics');
    if (!el || !deps.participants) return;
    var students = deps.participants.filter(function (p) { return p.role === 'student' && !p.isInWaitingRoom; });
    var raised = students.filter(function (p) { return p.isHandRaised; }).length;
    var weak = students.filter(function (p) { return p.connectionQuality === 'poor' || p.connectionQuality === 'critical'; }).length;
    var answered = students.filter(function (p) { return p.quizAnswered || p.sqAnswered; }).length;
    var confused = deps.state.reactions.confused || 0;
    var totalXp = 0;
    if (deps.insights) {
      Object.keys(deps.insights).forEach(function (k) { totalXp += (deps.insights[k].gamification.lessonXp || 0); });
    }
    el.innerHTML =
      '<span class="tlc-analytics-item"><strong>' + students.length + '</strong> öğrenci</span>' +
      '<span class="tlc-analytics-item"><strong>' + raised + '</strong> el ✋</span>' +
      '<span class="tlc-analytics-item"><strong>' + answered + '</strong> quiz cevap</span>' +
      '<span class="tlc-analytics-item"><strong>' + confused + '</strong> anlamadım</span>' +
      '<span class="tlc-analytics-item"><strong>' + weak + '</strong> zayıf bağlantı</span>' +
      '<span class="tlc-analytics-item tlc-analytics-xp"><strong>+' + totalXp + '</strong> XP</span>';
  }

  function renderRaisedQueue() {
    var el = $('tlcRaisedQueue');
    if (!el) return;
    var raised = deps.sortRaisedHands(deps.participants);
    if (!raised.length) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    var chips = raised.map(function (p) {
      var wait = p.handRaisedAt ? Math.round((Date.now() - p.handRaisedAt) / 60000) + ' dk' : '';
      return '<span class="tlc-rq-chip" data-insight-id="' + p.id + '" title="Bağlantı: ' + p.connectionQuality + '">' +
        p.name + (wait ? ' · ' + wait : '') +
        '<button type="button" class="tlc-rq-wb" data-rq="wb" data-id="' + p.id + '" aria-label="Tahtaya al">Tahta</button>' +
        '<button type="button" class="tlc-rq-lower" data-rq="lower" data-id="' + p.id + '" aria-label="El indir">↓</button>' +
      '</span>';
    }).join('');
    el.innerHTML = '<div class="tlc-rq-label">El kaldıranlar:</div><div class="tlc-rq-chips">' + chips + '</div>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcRqNext">Sıradakini tahtaya al</button>' +
      '<button type="button" class="tlc-btn tlc-btn--sm" id="tlcRqClear">Tüm elleri indir</button>';
    el.querySelectorAll('[data-rq="wb"]').forEach(function (btn) {
      btn.onclick = function (e) { e.stopPropagation(); deps.selectForWhiteboard(btn.dataset.id); };
    });
    el.querySelectorAll('[data-rq="lower"]').forEach(function (btn) {
      btn.onclick = function (e) { e.stopPropagation(); deps.lowerHand(btn.dataset.id); };
    });
    var next = $('tlcRqNext');
    if (next) next.onclick = function () { if (raised.length) deps.selectForWhiteboard(raised[0].id); };
    var clr = $('tlcRqClear');
    if (clr) clr.onclick = function () {
      deps.showConfirm('Tüm elleri indir', 'Tüm öğrencilerin elini indirmek istediğine emin misin?', function () {
        deps.participants.forEach(function (p) { p.isHandRaised = false; p.handRaisedAt = null; });
        deps.renderAll();
        deps.toast('Tüm eller indirildi.');
      });
    };
  }

  function renderPermissionDock() {
    var el = $('tlcPermDock');
    if (!el) return;
    el.querySelectorAll('[data-pdock]').forEach(function (btn) {
      btn.onclick = function () { runDockAction(btn.dataset.pdock); };
    });
  }

  function setClassHandRaise(enabled) {
    deps.state.isHandRaiseEnabled = !!enabled;
    if (deps.permMgr) {
      Object.keys(deps.permMgr.getAllStates()).forEach(function (sid) {
        deps.permMgr.setPermission(sid, 'canRaiseHand', enabled, enabled ? 'El kaldırma izni açıldı' : 'El kaldırma izni kapatıldı');
      });
    }
    if (!enabled) {
      deps.participants.forEach(function (p) {
        if (p.role === 'student') {
          p.isHandRaised = false;
          p.handRaisedAt = null;
        }
      });
    }
    deps.toast(enabled
      ? 'El kaldırma izni açıldı — öğrenciler el kaldırabilir.'
      : 'El kaldırma izni kapatıldı — tüm eller indirildi.');
  }

  function updateShortcutButtons() {
    var enabled = deps.state.isHandRaiseEnabled !== false;
    var onBtn = document.querySelector('[data-shortcut="hand-raise-on"]');
    var offBtn = document.querySelector('[data-shortcut="hand-raise-off"]');
    if (onBtn) onBtn.classList.toggle('is-active', enabled);
    if (offBtn) offBtn.classList.toggle('is-active', !enabled);
  }

  function runDockAction(action) {
    switch (action) {
      case 'mute-all': deps.muteAll(); break;
      case 'chat-toggle':
        deps.state.isChatEnabled = !deps.state.isChatEnabled;
        deps.toast(deps.state.isChatEnabled ? 'Chat açıldı.' : 'Chat kapatıldı.');
        break;
      case 'wb-lock': deps.toggleWbLock(); break;
      case 'wb-revoke': deps.revokeWhiteboard(); break;
      case 'rq-next':
        var raised = deps.sortRaisedHands(deps.participants);
        if (raised.length) deps.selectForWhiteboard(raised[0].id);
        else deps.toast('El kaldıran yok.', true);
        break;
      case 'lower-all':
        deps.showConfirm('Tüm elleri indir', 'Emin misin?', function () {
          deps.participants.forEach(function (p) { p.isHandRaised = false; p.handRaisedAt = null; });
          deps.renderAll();
        });
        break;
      case 'hand-raise-on':
        setClassHandRaise(true);
        break;
      case 'hand-raise-off':
        setClassHandRaise(false);
        break;
      case 'focus':
        deps.toggleFocus(!deps.state.isFocusModeActive);
        break;
      case 'react-clear':
        deps.state.reactions = { clap: 0, like: 0, heart: 0, smile: 0, confused: 0, slow: 0, fast: 0 };
        deps.toast('Reaksiyonlar temizlendi.');
        break;
      case 'exam-mode':
        if (permMgr) permMgr.applyClassPreset('exam_mode');
        deps.state.isChatEnabled = false;
        deps.toast('Sınav modu aktif.');
        break;
      case 'req-mic-all':
        deps.toast('Tüm sınıfa mikrofon açma isteği gönderildi.');
        break;
    }
    deps.renderAll();
  }

  function renderSuggestions() {
    if (global.TeacherCrisisUI) return;
    var el = $('tlcSmartSuggestions');
    if (!el) return;
    suggestions = [];
    var raised = deps.sortRaisedHands(deps.participants);
    if (raised.length >= 3) {
      suggestions.push({ id: 'sug-hands', title: raised.length + ' el kaldıran', description: 'Whiteboard kuyruğu birikti. Sıradakini tahtaya alabilirsin.', actionLabel: 'Tahtaya al', action: 'rq-next' });
    }
    if ((deps.state.reactions.confused || 0) >= 4) {
      suggestions.push({ id: 'sug-confused', title: (deps.state.reactions.confused) + ' anlamadım', description: 'Tempo geri bildirimi arttı. Konuyu tekrar açıklamak isteyebilirsin.', actionLabel: 'Not al', action: 'none' });
    }
    var weak = deps.participants.find(function (p) { return p.connectionQuality === 'critical'; });
    if (weak) {
      suggestions.push({ id: 'sug-conn', title: weak.name + ' — bağlantı zayıf', description: 'Whiteboard veya quiz öncesi bağlantıyı kontrol edebilirsin.', actionLabel: 'Detay', action: 'insight:' + weak.id });
    }
    var furkan = deps.getP('s0');
    if (furkan && furkan.isHandRaised) {
      var handCount = (deps.insights && deps.insights.s0) ? deps.insights.s0.activities.filter(function (a) { return a.type === 'raised_hand'; }).length : 0;
      if (handCount >= 2) suggestions.push({ id: 'sug-furkan', title: 'Furkan ' + handCount + ' kez el kaldırdı', description: 'Tahtaya almak ister misin?', actionLabel: 'Tahtaya al', action: 'wb:s0' });
    }
    if (!suggestions.length) { el.hidden = true; return; }
    el.hidden = false;
    var renderCard = global.LiveClassUI && global.LiveClassUI.renderSignalCard;
    el.innerHTML = suggestions.map(function (s) {
      if (renderCard) return renderCard({ title: s.title, description: s.description, actionLabel: s.action !== 'none' ? s.actionLabel : '', action: s.action, priority: 'medium' });
      return '<div class="tlc-suggestion"><span>' + s.description + '</span>' +
        (s.action !== 'none' ? '<button type="button" class="tlc-btn tlc-btn--sm" data-sug="' + s.action + '">' + s.actionLabel + '</button>' : '') +
      '</div>';
    }).join('');
    el.querySelectorAll('[data-sug], [data-signal-act]').forEach(function (btn) {
      btn.onclick = function () {
        var a = btn.dataset.sug || btn.dataset.signalAct;
        if (a === 'rq-next') runDockAction('rq-next');
        else if (a.indexOf('insight:') === 0 && global.TeacherStudentInsight) global.TeacherStudentInsight.open(a.slice(8));
        else if (a.indexOf('wb:') === 0) deps.selectForWhiteboard(a.slice(3));
      };
    });
  }

  var COMMANDS = [
    { id: 'wb-furkan', label: 'Furkan\'ı tahtaya al', run: function () { deps.selectForWhiteboard('s0'); } },
    { id: 'mute-all', label: 'Tüm sınıfı sessize al', run: function () { deps.muteAll(); } },
    { id: 'chat-off', label: 'Chat\'i kapat', run: function () { deps.state.isChatEnabled = false; deps.toast('Chat kapatıldı.'); } },
    { id: 'wb-lock', label: 'Whiteboard\'u kilitle', run: function () { deps.toggleWbLock(); } },
    { id: 'rq-next', label: 'Sıradaki el kaldıranı seç', run: function () { runDockAction('rq-next'); } },
    { id: 'sq-abcd', label: 'Ekrandaki soruya A/B/C/D cevap iste', run: function () { if (global.TeacherScreenQuestion) global.TeacherScreenQuestion.sendBlankChoice(4); } },
    { id: 'insight-furkan', label: 'Furkan detay paneli', run: function () { if (global.TeacherStudentInsight) global.TeacherStudentInsight.open('s0'); } },
    { id: 'focus', label: 'Odak modunu başlat', run: function () { deps.toggleFocus(true); } },
    { id: 'exam', label: 'Sınav modu', run: function () { runDockAction('exam-mode'); } }
  ];

  function openCommandPalette() {
    var modal = $('tlcCommandPalette');
    if (!modal) return;
    modal.hidden = false;
    var input = $('tlcCmdInput');
    var list = $('tlcCmdList');
    function filter(q) {
      q = (q || '').toLowerCase();
      var items = COMMANDS.filter(function (c) { return c.label.toLowerCase().indexOf(q) >= 0; });
      list.innerHTML = items.map(function (c, i) {
        return '<button type="button" class="tlc-cmd-item' + (i === 0 ? ' is-active' : '') + '" data-cmd="' + c.id + '">' + c.label + '</button>';
      }).join('');
      list.querySelectorAll('.tlc-cmd-item').forEach(function (btn) {
        btn.onclick = function () {
          var cmd = COMMANDS.find(function (x) { return x.id === btn.dataset.cmd; });
          if (cmd) cmd.run();
          closeCommandPalette();
          deps.renderAll();
        };
      });
    }
    input.value = '';
    filter('');
    input.oninput = function () { filter(input.value); };
    input.focus();
  }

  function closeCommandPalette() {
    var modal = $('tlcCommandPalette');
    if (modal) modal.hidden = true;
  }

  function renderPermissionCommandCenter() {
    var el = $('tlcPermCommandCenter');
    if (!el) return;
    el.innerHTML =
      '<div class="tlc-pcc-presets">' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-pcc="exam_mode">Sınav modu</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-pcc="free_discussion">Serbest tartışma</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-pcc="teacher_only_wb">Sadece öğretmen tahta</button>' +
        '<button type="button" class="tlc-btn tlc-btn--sm" data-pcc="quiz_focus">Quiz odak</button>' +
      '</div>' +
      '<p class="tlc-preclass-meta" style="margin-top:10px">Ctrl+K ile komut paleti · Öğrenci kartına tıklayarak detay paneli</p>';
    el.querySelectorAll('[data-pcc]').forEach(function (btn) {
      btn.onclick = function () {
        if (permMgr) permMgr.applyClassPreset(btn.dataset.pcc);
        if (btn.dataset.pcc === 'exam_mode') runDockAction('exam-mode');
        deps.toast('Preset: ' + btn.textContent);
        deps.renderAll();
      };
    });
  }

  function renderAll() {
    renderAnalyticsBar();
    if (!global.TeacherCrisisUI) renderRaisedQueue();
    renderSuggestions();
    renderPermissionCommandCenter();
    updateShortcutButtons();
  }

  function renderRaisedQueueOnly() {
    renderRaisedQueue();
  }

  global.TeacherPermissionUI = {
    init: function (d) {
      deps = d;
      permMgr = d.permMgr;
      renderPermissionDock();
      document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          openCommandPalette();
        }
        if (e.key === 'Escape') closeCommandPalette();
      });
      if ($('tlcCmdClose')) $('tlcCmdClose').onclick = closeCommandPalette;
      if ($('tlcCmdBackdrop')) $('tlcCmdBackdrop').onclick = closeCommandPalette;
      renderAll();
    },
    renderAll: renderAll,
    renderRaisedQueueOnly: renderRaisedQueueOnly,
    openCommandPalette: openCommandPalette,
    runDockAction: runDockAction
  };

})(typeof window !== 'undefined' ? window : this);
