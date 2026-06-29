/**
 * Öğretmen Performansım sayfası
 */
(function () {
  'use strict';

  var api = window.TeacherPerformanceMock;
  var DatePicker = window.TeacherDatePicker;
  if (!api || !DatePicker) return;

  var ICONS = {
    lessons: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    questions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>',
    whiteboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="12" rx="2"/><path d="M7 21h10"/><path d="M12 15v6"/><path d="M9 9h6"/><path d="M9 12h4"/></svg>'
  };

  var state = {
    dateFrom: api.TERM_START,
    dateTo: api.TERM_END,
    loading: false
  };

  var els = {};
  var pickers = { start: null, end: null };
  var reloadTimer = null;

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatCount(n) {
    return String(n == null ? 0 : n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function cardIconHtml(iconKey) {
    var svg = ICONS[iconKey] || ICONS.lessons;
    return '<span class="tp-card-ico" aria-hidden="true">' + svg + '</span>';
  }

  function renderCard(card) {
    var featuredCls = card.featured ? ' is-featured' : '';
    return (
      '<article class="tp-card' + featuredCls + ' ' + escapeHtml(card.cls || '') + '">' +
        '<div class="tp-card-top">' +
          cardIconHtml(card.icon) +
          '<h2 class="tp-card-title">' + escapeHtml(card.title) + '</h2>' +
        '</div>' +
        '<p class="tp-card-value">' + escapeHtml(formatCount(card.value)) + '</p>' +
        '<p class="tp-card-hint">' + escapeHtml(card.hint) + '</p>' +
      '</article>'
    );
  }

  function render(cards) {
    if (!els.grid) return;
    els.grid.innerHTML = cards.map(renderCard).join('');
  }

  function updateRangeSummary() {
    if (!els.rangeSummary) return;
    els.rangeSummary.textContent = DatePicker.formatRange(state.dateFrom, state.dateTo) + ' aralığındaki performans özeti';
  }

  function normalizeRange() {
    if (DatePicker.compare(state.dateFrom, state.dateTo) > 0) {
      var tmp = state.dateFrom;
      state.dateFrom = state.dateTo;
      state.dateTo = tmp;
      if (pickers.start) pickers.start.setValue(state.dateFrom, true);
      if (pickers.end) pickers.end.setValue(state.dateTo, true);
    }
  }

  function scheduleReload() {
    normalizeRange();
    updateRangeSummary();
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(loadCards, 180);
  }

  function onDateChange() {
    if (pickers.start) state.dateFrom = pickers.start.getValue();
    if (pickers.end) state.dateTo = pickers.end.getValue();
    scheduleReload();
  }

  function showLoading() {
    if (!els.grid) return;
    els.grid.innerHTML =
      '<div class="tp-grid-loading">' +
        '<div class="td-skeleton"><div class="td-skeleton-bar"></div><div class="td-skeleton-bar"></div></div>' +
        '<p>Performans verileri güncelleniyor…</p>' +
      '</div>';
  }

  function loadCards() {
    state.loading = true;
    showLoading();
    api.getCards({
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
      simulate: false
    }).then(function (cards) {
      state.loading = false;
      render(cards);
    }).catch(function () {
      state.loading = false;
      if (els.grid) {
        els.grid.innerHTML = '<p class="td-state is-error">Performans verileri yüklenemedi.</p>';
      }
    });
  }

  function initDatePickers() {
    var bounds = { min: api.TERM_START, max: api.TERM_END };

    pickers.start = new DatePicker(els.dateStartHost, {
      id: 'tpDateStart',
      label: 'Başlangıç tarihi',
      value: state.dateFrom,
      min: bounds.min,
      max: bounds.max,
      onChange: onDateChange
    });

    pickers.end = new DatePicker(els.dateEndHost, {
      id: 'tpDateEnd',
      label: 'Bitiş tarihi',
      value: state.dateTo,
      min: bounds.min,
      max: bounds.max,
      onChange: onDateChange
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') DatePicker.closeActive();
    });
  }

  function init() {
    els.grid = $('tpPerfGrid');
    els.dateStartHost = $('tpDateStartHost');
    els.dateEndHost = $('tpDateEndHost');
    els.rangeSummary = $('tpDateRangeSummary');

    state.dateFrom = api.TERM_START;
    state.dateTo = api.TERM_END;

    initDatePickers();
    updateRangeSummary();
    loadCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
