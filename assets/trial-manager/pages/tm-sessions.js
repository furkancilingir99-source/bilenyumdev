/**
 * Deneme Dersleri listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmSessionsBody');
  var searchInput = document.getElementById('tmSessionsSearch');
  var statusFilter = document.getElementById('tmSessionsStatus');
  var typeFilter = document.getElementById('tmSessionsType');
  var countEl = document.getElementById('tmSessionsCount');
  var paginationEl = document.getElementById('tmSessionsPagination');
  var pageSizeSelect = document.getElementById('tmSessionsPageSize');
  var exportBtn = document.getElementById('tmSessionsExport');

  var page = 1;
  var needsAttendanceFilter = false;

  function initFromUrl() {
    var st = U.qs('status');
    if (st && statusFilter && statusFilter.querySelector('option[value="' + st + '"]')) {
      statusFilter.value = st;
    }
    if (U.qs('needsAttendance') === '1') needsAttendanceFilter = true;
  }

  function rowData(s) {
    var d = Store.getSessionWithDetails(s.id);
    var meeting = d.meeting;
    var pendingParent = d.reservations.filter(function (r) {
      return r.parentApprovalStatus !== 'approved';
    }).length;
    var linkNotSent = d.reservations.filter(function (r) {
      return r.parentApprovalStatus === 'approved' && !r.linkSent;
    }).length;
    return {
      session: s,
      detail: d,
      lessonName: d.lessonType ? d.lessonType.name : '—',
      teacherName: d.teacher ? U.fullName(d.teacher.firstName, d.teacher.lastName) : '—',
      enrolled: s.enrolledStudentIds.length,
      remaining: window.TMSchedulingRules.getSessionRemainingCapacity(s.id),
      meetingStatus: meeting ? meeting.status : '—',
      meetingId: meeting ? meeting.meetingId : '—',
      pendingParent: pendingParent,
      linkNotSent: linkNotSent
    };
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var type = typeFilter ? typeFilter.value : 'all';
    var items = Store.getSessions().map(rowData);
    items = U.filterSearch(items, q, function (r) {
      return r.session.id + ' ' + r.lessonName + ' ' + r.teacherName + ' ' + r.session.date;
    });
    if (status !== 'all') items = items.filter(function (r) { return r.session.status === status; });
    if (type !== 'all') items = items.filter(function (r) { return r.session.lessonTypeId === type; });
    if (needsAttendanceFilter) {
      var today = Store.todayKey();
      items = items.filter(function (r) {
        var s = r.session;
        if (s.status === 'cancelled') return false;
        var needs = s.status === 'completed' || (s.date < today && s.status === 'confirmed');
        if (!needs) return false;
        return Store.getReservationsForSession(s.id).some(function (res) { return res.status === 'confirmed'; });
      });
    }
    return U.sortBy(items, function (r) { return r.session.date + r.session.startTime; }, 'asc');
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmSessionsLoading');
    var wrap = document.getElementById('tmSessionsTableWrap');
    try {
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
    var all = filtered();
    var p = U.paginate(all, page, pageSize);
    if (countEl) countEl.textContent = p.total + ' ders';
    tbody.innerHTML = p.items.map(function (r) {
      var s = r.session;
      return '<tr data-id="' + s.id + '">' +
        '<td>' + U.formatDateKey(s.date) + '</td>' +
        '<td>' + s.startTime + '–' + s.endTime + '</td>' +
        '<td>' + U.escapeHtml(r.lessonName) + '</td>' +
        '<td>' + U.escapeHtml(r.teacherName) + '</td>' +
        '<td>' + r.enrolled + '</td><td>20</td><td>' + r.remaining + '</td>' +
        '<td>' + SL.meetingBadge(r.meetingStatus) + '</td>' +
        '<td><code style="font-size:11px">' + U.escapeHtml(String(r.meetingId).slice(0, 8)) + '…</code></td>' +
        '<td>' + r.pendingParent + '</td><td>' + r.linkNotSent + '</td>' +
        '<td>' + (s.teacherInformed ? '✓' : '—') + '</td>' +
        '<td>' + SL.sessionBadge(s.status) + '</td>' +
        '<td>' + U.formatDateTime(s.updatedAt) + '</td>' +
          '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-detail="' + s.id + '">Detay</button> ' +
        '<a class="tm-btn tm-btn--sm tm-btn--ghost" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(s.id) + '" data-tm-require="edit">Düzenle</a></td></tr>';
    }).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-detail'));
      });
    });
    tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        if (window.TMSessionDetail) window.TMSessionDetail.open(tr.getAttribute('data-id'));
      });
    });
    if (loading) loading.hidden = true;
    if (wrap) wrap.hidden = false;
    if (window.TMPermissions && window.TMPermissions.applyPageChrome) {
      window.TMPermissions.applyPageChrome(tbody);
    }
    } catch (err) {
      if (loading) loading.textContent = 'Liste yüklenemedi: ' + err.message;
      console.error(err);
    }
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (statusFilter) statusFilter.addEventListener('change', function () { page = 1; render(); });
  if (typeFilter) typeFilter.addEventListener('change', function () { page = 1; render(); });
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (window.TMPermissions && !window.TMPermissions.guard('export')) return;
      Export.exportTable('deneme-dersleri.csv', filtered().map(function (r) { return r.session; }), [
        { key: 'id', label: 'ID' },
        { key: 'date', label: 'Tarih' },
        { key: 'startTime', label: 'Başlangıç' },
        { key: 'status', label: 'Durum', value: function (s) { return SL.sessionLabel(s.status); } }
      ]);
    });
  }

  window.TMOnSessionChange = render;
  initFromUrl();
  render();
})();
