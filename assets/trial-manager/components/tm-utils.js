/**
 * Paylaşılan yardımcılar
 */
(function (global) {
  'use strict';

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDateKey(key) {
    if (!key) return '—';
    var p = key.split('-');
    if (p.length !== 3) return key;
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function formatTimeRange(start, end) {
    return (start || '—') + ' – ' + (end || '—');
  }

  function fullName(first, last) {
    return ((first || '') + ' ' + (last || '')).trim() || '—';
  }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function paginate(items, page, pageSize) {
    var total = items.length;
    var pages = Math.max(1, Math.ceil(total / pageSize));
    var p = Math.min(Math.max(1, page), pages);
    var start = (p - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), page: p, pages: pages, total: total };
  }

  function renderPagination(el, page, pages, onPage) {
    if (!el) return;
    if (pages <= 1) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    var html = '';
    for (var i = 1; i <= pages; i++) {
      html += '<button type="button" class="tm-pagination-btn' + (i === page ? ' is-active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onPage(parseInt(btn.getAttribute('data-page'), 10));
      });
    });
  }

  function sortBy(items, keyFn, dir) {
    var copy = items.slice();
    copy.sort(function (a, b) {
      var av = keyFn(a);
      var bv = keyFn(b);
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }

  function filterSearch(items, query, fieldsFn) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return items;
    return items.filter(function (item) {
      return fieldsFn(item).toLowerCase().indexOf(q) >= 0;
    });
  }

  global.TMUtils = {
    MONTHS: MONTHS,
    MONTHS_FULL: MONTHS_FULL,
    WEEKDAYS: WEEKDAYS,
    escapeHtml: escapeHtml,
    formatDateKey: formatDateKey,
    formatDateTime: formatDateTime,
    formatTimeRange: formatTimeRange,
    fullName: fullName,
    qs: qs,
    debounce: debounce,
    paginate: paginate,
    renderPagination: renderPagination,
    sortBy: sortBy,
    filterSearch: filterSearch
  };
})(typeof window !== 'undefined' ? window : this);
