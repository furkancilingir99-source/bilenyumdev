/* ---------------------------------------------------------------------------
 * Bilenyum placement-video-solutions.js — Seviye belirleme video çözümleri
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var DEFAULT_SRC = global.BilenyumHomeworkVideoPlayer
    ? global.BilenyumHomeworkVideoPlayer.DEFAULT_SRC
    : 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

  var SUBJECT_ORDER = ['mat', 'fen', 'trk', 'sos', 'din', 'ing'];

  var SUBJECT_LABELS = {
    mat: 'Matematik',
    fen: 'Fen Bilimleri',
    trk: 'Türkçe',
    sos: 'Sosyal Bilgiler',
    din: 'Din Kültürü',
    ing: 'İngilizce'
  };

  var ICON_VIDEO =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="5" width="14" height="14" rx="2"/>' +
      '<polygon points="17 9 22 6.5 22 17.5 17 15 17 9" fill="currentColor" stroke="none"/>' +
    '</svg>';

  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polyline points="20 6 9 17 4 12"/>' +
    '</svg>';

  var ICON_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
    '</svg>';

  var VIDEO_PLAYER_HTML =
    '<div class="asm-hw-vp" id="hwVideoPlayerRoot">' +
      '<div class="asm-hw-vp-stage" id="hwVideoStage" tabindex="0" aria-label="Video oynatıcı">' +
        '<video class="asm-hw-vp-video" id="hwVideoEl" playsinline preload="metadata"></video>' +
        '<button type="button" class="asm-hw-vp-center-play" id="hwVpCenterPlay" aria-label="Oynat">' +
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="8 5 19 12 8 19"/></svg>' +
        '</button>' +
        '<div class="asm-hw-vp-overlay" id="hwVpOverlay" aria-label="Video oynatıcı kontrolleri">' +
          '<div class="asm-hw-vp-progress">' +
            '<input type="range" class="asm-hw-vp-seek" id="hwVpSeek" min="0" max="100" value="0" step="0.1" aria-label="Video konumu" />' +
          '</div>' +
          '<div class="asm-hw-vp-bar">' +
            '<button type="button" class="asm-hw-vp-btn asm-hw-vp-btn--play" id="hwVpPlay" aria-label="Oynat">' +
              '<svg class="asm-hw-vp-icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="8 5 19 12 8 19"/></svg>' +
              '<svg class="asm-hw-vp-icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>' +
            '</button>' +
            '<button type="button" class="asm-hw-vp-btn" id="hwVpRewind" aria-label="10 saniye geri sar" title="10 sn geri">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.5-6.2"/><polyline points="3 3 3 9 9 9"/></svg>' +
            '</button>' +
            '<button type="button" class="asm-hw-vp-btn" id="hwVpForward" aria-label="10 saniye ileri sar" title="10 sn ileri">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.5-6.2"/><polyline points="21 3 21 9 15 9"/></svg>' +
            '</button>' +
            '<div class="asm-hw-vp-volume-group">' +
              '<button type="button" class="asm-hw-vp-btn" id="hwVpMute" aria-label="Sesi kapat">' +
                '<svg class="asm-hw-vp-icon-vol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>' +
                '<svg class="asm-hw-vp-icon-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>' +
              '</button>' +
              '<input type="range" class="asm-hw-vp-volume" id="hwVpVolume" min="0" max="1" step="0.05" value="1" aria-label="Ses seviyesi" />' +
            '</div>' +
            '<span class="asm-hw-vp-time"><span id="hwVpCurrent">0:00</span><span class="asm-hw-vp-time-sep"> / </span><span id="hwVpDuration">0:00</span></span>' +
            '<span class="asm-hw-vp-bar-spacer" aria-hidden="true"></span>' +
            '<label class="asm-hw-vp-speed-wrap">' +
              '<span class="asm-hw-vp-speed-label">Hız</span>' +
              '<select class="asm-hw-vp-speed" id="hwVpSpeed" aria-label="Oynatma hızı">' +
                '<option value="0.75">0.75x</option>' +
                '<option value="1" selected>1x</option>' +
                '<option value="1.25">1.25x</option>' +
                '<option value="1.5">1.5x</option>' +
              '</select>' +
            '</label>' +
            '<button type="button" class="asm-hw-vp-btn asm-hw-vp-btn--fs" id="hwVpFullscreen" aria-label="Tam ekran">' +
              '<svg class="asm-hw-vp-icon-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' +
              '<svg class="asm-hw-vp-icon-compress" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function questionStatusClass(item) {
    if (item.isCorrect) return ' is-correct';
    if (item.isWrong) return ' is-wrong';
    return ' is-blank';
  }

  function questionStatusIcon(item) {
    if (item.isCorrect) {
      return '<span class="asm-pl-videos-q-badge is-correct">' + ICON_CHECK + '</span>';
    }
    if (item.isWrong) {
      return '<span class="asm-pl-videos-q-badge is-wrong">' + ICON_X + '</span>';
    }
    return '<span class="asm-pl-videos-q-badge is-blank" aria-hidden="true"></span>';
  }

  function questionAriaLabel(item, subjectLabel) {
    var base = subjectLabel + ' · ' + (item.localIndex + 1) + '. soru video çözümü';
    if (item.isCorrect) return base + ' · doğru';
    if (item.isWrong) return base + ' · yanlış';
    return base + ' · boş';
  }

  function optLabel(opt) {
    return typeof opt === 'string' ? opt : (opt && opt.label) || '';
  }

  function answerText(q, index) {
    if (index == null || index < 0 || !q.opts || !q.opts[index]) return null;
    var letter = String.fromCharCode(65 + index);
    return letter + ') ' + optLabel(q.opts[index]);
  }

  function renderAnswerInfo(item) {
    var q = item.q;
    var yourText = item.answer != null ? answerText(q, item.answer) : null;
    var correctText = answerText(q, q.correct) || '—';
    var yourClass = item.isCorrect ? 'is-correct' : (item.isWrong ? 'is-wrong' : 'is-blank');
    var yourDisplay = yourText || 'Boş bıraktın';

    return (
      '<div class="asm-pl-videos-answers">' +
        '<div class="asm-pl-videos-answer-row ' + yourClass + '">' +
          '<span class="asm-pl-videos-answer-label">Senin cevabın</span>' +
          '<span class="asm-pl-videos-answer-val">' + escapeHtml(yourDisplay) + '</span>' +
        '</div>' +
        '<div class="asm-pl-videos-answer-row is-correct-key">' +
          '<span class="asm-pl-videos-answer-label">Doğru cevap</span>' +
          '<span class="asm-pl-videos-answer-val">' + escapeHtml(correctText) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function buildBySubject(questions, answers) {
    var map = {};
    (questions || []).forEach(function (q, gi) {
      var code = q.subjectCode || 'mat';
      if (!map[code]) {
        map[code] = {
          code: code,
          label: SUBJECT_LABELS[code] || code,
          items: []
        };
      }
      var ans = answers ? answers[gi] : null;
      map[code].items.push({
        globalIndex: gi,
        localIndex: map[code].items.length,
        q: q,
        answer: ans,
        isCorrect: ans != null && ans === q.correct,
        isWrong: ans != null && ans !== q.correct,
        isBlank: ans == null
      });
    });
    return map;
  }

  function subjectOrder(map) {
    return SUBJECT_ORDER.filter(function (code) {
      return map[code] && map[code].items.length;
    });
  }

  function renderSectionShell(mode) {
    var isModal = mode === 'modal';
    var outerClass = isModal
      ? 'asm-pl-videos asm-pl-videos--modal'
      : 'asm-res-card asm-pl-videos asm-pl-videos--inline';
    var toggle = isModal
      ? ''
      : '<button type="button" class="asm-pl-videos-toggle" data-pl-videos-toggle aria-expanded="false">' +
          '<span class="asm-pl-videos-toggle-icon" aria-hidden="true">▶</span>' +
          '<span class="asm-pl-videos-toggle-text">Deneme Sınavının Video Çözümlerini İzle</span>' +
        '</button>';
    var closeBtn = isModal
      ? '<button type="button" class="asm-pl-videos-close" data-pl-videos-close aria-label="Kapat">×</button>'
      : '';

    return (
      '<section class="' + outerClass + '" data-pl-videos-root>' +
        closeBtn +
        toggle +
        '<div class="asm-pl-videos-panel" data-pl-videos-panel' + (isModal ? '' : ' hidden') + '>' +
          (isModal
            ? '<h2 class="asm-pl-videos-modal-title" id="asmPlacementVideosOverlayTitle">Deneme Sınavının Video Çözümlerini İzle</h2>'
            : '') +
          '<p class="asm-pl-videos-intro">Ders sekmesinden bir ders seç, ardından sorunun üzerine tıklayarak video çözümünü izle.</p>' +
          '<nav class="asm-pl-videos-tabs" data-pl-videos-tabs role="tablist" aria-label="Ders sekmeleri"></nav>' +
          '<div class="asm-pl-videos-qlist" data-pl-videos-qlist aria-label="Soru listesi"></div>' +
          '<div class="asm-pl-videos-player" data-pl-videos-player hidden>' +
            '<h3 class="asm-pl-videos-player-title" data-pl-videos-title></h3>' +
            '<div class="asm-pl-videos-vp-host" data-pl-videos-vp-host></div>' +
            '<div class="asm-pl-videos-answers-wrap" data-pl-videos-answers hidden></div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderModalOverlay() {
    return (
      '<div class="asm-pl-videos-overlay" id="asmPlacementVideosOverlay" hidden role="dialog" aria-modal="true" aria-labelledby="asmPlacementVideosOverlayTitle">' +
        '<div class="asm-pl-videos-overlay-backdrop" data-pl-videos-close></div>' +
        '<div class="asm-pl-videos-overlay-card">' +
          renderSectionShell('modal') +
        '</div>' +
      '</div>'
    );
  }

  function mountPanel(root, questions, answers, opts) {
    if (!root) return null;
    opts = opts || {};

    var bySubject = buildBySubject(questions, answers);
    var order = subjectOrder(bySubject);
    if (!order.length) return null;

    var activeSubject = order[0];
    var activeItem = null;
    var playerApi = null;
    var panelOpen = !!opts.openPanel;

    var toggleBtn = root.querySelector('[data-pl-videos-toggle]');
    var panel = root.querySelector('[data-pl-videos-panel]');
    var tabsEl = root.querySelector('[data-pl-videos-tabs]');
    var qlistEl = root.querySelector('[data-pl-videos-qlist]');
    var playerWrap = root.querySelector('[data-pl-videos-player]');
    var titleEl = root.querySelector('[data-pl-videos-title]');
    var vpHost = root.querySelector('[data-pl-videos-vp-host]');
    var answersEl = root.querySelector('[data-pl-videos-answers]');

    function setPanelOpen(open) {
      panelOpen = open;
      if (panel) panel.hidden = !open;
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggleBtn.classList.toggle('is-open', open);
      }
    }

    function ensurePlayer() {
      if (playerApi || !vpHost || !global.BilenyumHomeworkVideoPlayer) return playerApi;
      vpHost.innerHTML = VIDEO_PLAYER_HTML;
      playerApi = global.BilenyumHomeworkVideoPlayer.mount(vpHost);
      return playerApi;
    }

    function renderTabs() {
      if (!tabsEl) return;
      tabsEl.innerHTML = order.map(function (code) {
        var group = bySubject[code];
        var isActive = code === activeSubject;
        return '<button type="button" class="asm-pl-videos-tab' + (isActive ? ' is-active' : '') + '"' +
          ' role="tab" aria-selected="' + isActive + '" data-pl-subject="' + code + '">' +
          escapeHtml(group.label) +
        '</button>';
      }).join('');
    }

    function renderQuestions() {
      if (!qlistEl) return;
      var group = bySubject[activeSubject];
      if (!group) {
        qlistEl.innerHTML = '';
        return;
      }
      qlistEl.innerHTML = group.items.map(function (item) {
        var cls = 'asm-pl-videos-q' + questionStatusClass(item);
        if (activeItem && activeItem.globalIndex === item.globalIndex) cls += ' is-active';
        return '<button type="button" class="' + cls + '" data-pl-q="' + item.globalIndex + '"' +
          ' aria-label="' + escapeHtml(questionAriaLabel(item, group.label)) + '">' +
          '<span class="asm-pl-videos-q-play">' + ICON_VIDEO + '</span>' +
          '<span class="asm-pl-videos-q-num">' + (item.localIndex + 1) + '. Soru</span>' +
          questionStatusIcon(item) +
        '</button>';
      }).join('');
    }

    function openQuestion(gi) {
      var item = null;
      order.some(function (code) {
        return bySubject[code].items.some(function (entry) {
          if (entry.globalIndex === gi) {
            item = entry;
            activeSubject = code;
            return true;
          }
          return false;
        });
      });
      if (!item) return;

      activeItem = item;
      renderTabs();
      renderQuestions();

      if (playerWrap) playerWrap.hidden = false;
      if (titleEl) {
        titleEl.textContent = SUBJECT_LABELS[item.q.subjectCode || activeSubject] + ' · ' +
          (item.localIndex + 1) + '. Soru — Video Çözüm';
      }
      if (answersEl) {
        answersEl.innerHTML = renderAnswerInfo(item);
        answersEl.hidden = false;
      }

      var api = ensurePlayer();
      if (api) {
        api.load(item.q.videoUrl || DEFAULT_SRC);
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        setPanelOpen(!panelOpen);
      });
    }

    root.querySelectorAll('[data-pl-videos-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var overlay = btn.closest('.asm-pl-videos-overlay');
        if (overlay) {
          overlay.hidden = true;
          if (playerApi) playerApi.pause();
          return;
        }
        setPanelOpen(false);
        if (playerApi) playerApi.pause();
      });
    });

    if (tabsEl) {
      tabsEl.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-pl-subject]');
        if (!tab) return;
        activeSubject = tab.getAttribute('data-pl-subject');
        activeItem = null;
        if (playerWrap) playerWrap.hidden = true;
        if (answersEl) answersEl.hidden = true;
        if (playerApi) playerApi.pause();
        renderTabs();
        renderQuestions();
      });
    }

    if (qlistEl) {
      qlistEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pl-q]');
        if (!btn) return;
        openQuestion(parseInt(btn.getAttribute('data-pl-q'), 10));
      });
    }

    renderTabs();
    renderQuestions();
    if (opts.openPanel) setPanelOpen(true);

    return {
      openPanel: function () { setPanelOpen(true); },
      openModal: function () {
        var overlay = document.getElementById('asmPlacementVideosOverlay');
        if (overlay) {
          overlay.hidden = false;
          setPanelOpen(true);
        }
      },
      openQuestion: openQuestion
    };
  }

  function mountInline(host, questions, answers) {
    if (!host) return null;
    host.innerHTML = renderSectionShell('inline');
    return mountPanel(host.querySelector('[data-pl-videos-root]'), questions, answers);
  }

  function ensureModalOverlay() {
    var overlay = document.getElementById('asmPlacementVideosOverlay');
    if (overlay) return overlay;
    document.body.insertAdjacentHTML('beforeend', renderModalOverlay());
    return document.getElementById('asmPlacementVideosOverlay');
  }

  function mountModal(questions, answers) {
    var overlay = ensureModalOverlay();
    var root = overlay.querySelector('[data-pl-videos-root]');
    if (!root) return null;

    if (!overlay._plVideosBound) {
      overlay._plVideosBound = true;
      var backdrop = overlay.querySelector('.asm-pl-videos-overlay-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', function () {
          overlay.hidden = true;
        });
      }
    }

    if (!overlay._plVideosApi) {
      overlay._plVideosApi = mountPanel(root, questions, answers, { openPanel: true });
    }

    overlay.hidden = false;
    return overlay._plVideosApi;
  }

  global.BilenyumPlacementVideos = {
    renderSectionShell: renderSectionShell,
    renderModalOverlay: renderModalOverlay,
    mountInline: mountInline,
    mountModal: mountModal,
    mountPanel: mountPanel,
    buildBySubject: buildBySubject,
    DEFAULT_SRC: DEFAULT_SRC
  };
})(typeof window !== 'undefined' ? window : this);

