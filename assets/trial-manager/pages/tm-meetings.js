/**
 * Online ders linkleri
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmMeetingsBody');
  var searchInput = document.getElementById('tmMeetingsSearch');
  var statusFilter = document.getElementById('tmMeetingsStatus');
  var countEl = document.getElementById('tmMeetingsCount');
  var paginationEl = document.getElementById('tmMeetingsPagination');
  var pageSizeSelect = document.getElementById('tmMeetingsPageSize');
  var exportBtn = document.getElementById('tmMeetingsExport');
  var page = 1;

  function rows() {
    return Store.getMeetings().map(function (m) {
      var s = Store.getSessionById(m.sessionId);
      if (!s) return null;
      var d = Store.getSessionWithDetails(s.id);
      var sent = d.reservations.filter(function (r) { return r.linkSent; }).length;
      var notSent = d.reservations.filter(function (r) { return !r.linkSent && r.parentApprovalStatus === 'approved'; }).length;
      return { meeting: m, session: s, detail: d, sent: sent, notSent: notSent };
    }).filter(Boolean);
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var items = rows();
    items = U.filterSearch(items, q, function (r) {
      return r.meeting.meetingId + ' ' + r.meeting.meetingUrl + ' ' + (r.detail.lessonType ? r.detail.lessonType.name : '');
    });
    if (status === 'active') items = items.filter(function (r) { return r.meeting.status === 'active'; });
    if (status === 'cancelled') items = items.filter(function (r) { return r.meeting.status === 'cancelled'; });
    if (status === 'not_sent') items = items.filter(function (r) { return r.notSent > 0; });
    return items;
  }

  function render() {
    if (!tbody) return;
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
    var p = U.paginate(filtered(), page, pageSize);
    if (countEl) countEl.textContent = p.total + ' link';
    tbody.innerHTML = p.items.map(function (r) {
      var s = r.session;
      var lt = r.detail.lessonType;
      var teacher = r.detail.teacher;
      return '<tr><td>' + U.formatDateKey(s.date) + '</td><td>' + s.startTime + '</td>' +
        '<td>' + (lt ? lt.name : '—') + '</td>' +
        '<td>' + (teacher ? U.escapeHtml(U.fullName(teacher.firstName, teacher.lastName)) : '—') + '</td>' +
        '<td><code style="font-size:11px">' + U.escapeHtml(r.meeting.meetingId) + '</code></td>' +
        '<td><code style="font-size:11px">' + U.escapeHtml(r.meeting.passcode) + '</code></td>' +
        '<td>' + SL.meetingBadge(r.meeting.status) + '</td>' +
        '<td>' + r.sent + '</td><td>' + r.notSent + '</td>' +
        '<td>' + SL.sessionBadge(s.status) + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-session="' + s.id + '">Detay</button></td></tr>';
    }).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('[data-session]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-session'), 2);
      });
    });
    document.getElementById('tmMeetingsLoading').hidden = true;
    document.getElementById('tmMeetingsTableWrap').hidden = false;
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (statusFilter) statusFilter.addEventListener('change', function () { page = 1; render(); });
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) exportBtn.addEventListener('click', function () {
    Export.exportTable('online-linkler.csv', filtered().map(function (r) { return r.meeting; }), [
      { key: 'meetingId', label: 'Meeting ID' }, { key: 'meetingUrl', label: 'URL' }, { key: 'status', label: 'Durum' }
    ]);
  });
  render();
})();
