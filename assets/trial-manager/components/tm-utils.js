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

  function setQueryParam(name, value) {
    var params = new URLSearchParams(window.location.search);
    if (value == null || value === '') params.delete(name);
    else params.set(name, value);
    var q = params.toString();
    var url = window.location.pathname + (q ? '?' + q : '') + window.location.hash;
    window.history.replaceState(null, '', url);
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
    function navBtn(label, target, disabled, aria) {
      return '<button type="button" class="tm-pagination-btn tm-pagination-nav"' + (disabled ? ' disabled' : '') +
        ' data-page="' + target + '" aria-label="' + aria + '" title="' + aria + '">' + label + '</button>';
    }
    var html = '';
    html += navBtn('«', 1, page <= 1, 'İlk sayfa');
    html += navBtn('‹', Math.max(1, page - 1), page <= 1, 'Önceki sayfa');
    // Aktif sayfa etrafında pencereli sayı listesi
    var start = Math.max(1, page - 2);
    var end = Math.min(pages, page + 2);
    if (page <= 3) end = Math.min(pages, 5);
    if (page >= pages - 2) start = Math.max(1, pages - 4);
    if (start > 1) html += '<span class="tm-pagination-gap">…</span>';
    for (var i = start; i <= end; i++) {
      html += '<button type="button" class="tm-pagination-btn' + (i === page ? ' is-active' : '') + '" data-page="' + i + '">' + i + '</button>';
    }
    if (end < pages) html += '<span class="tm-pagination-gap">…</span>';
    html += navBtn('›', Math.min(pages, page + 1), page >= pages, 'Sonraki sayfa');
    html += navBtn('»', pages, page >= pages, 'Son sayfa');
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
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

  function notifyError(msg) {
    if (global.TMToast) global.TMToast.error(msg);
    else alert(msg);
  }

  function notifySuccess(msg) {
    if (global.TMToast) global.TMToast.success(msg);
    else if (msg) alert(msg);
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
    setQueryParam: setQueryParam,
    debounce: debounce,
    paginate: paginate,
    renderPagination: renderPagination,
    sortBy: sortBy,
    filterSearch: filterSearch,
    notifyError: notifyError,
    notifySuccess: notifySuccess
  };
})(typeof window !== 'undefined' ? window : this);
