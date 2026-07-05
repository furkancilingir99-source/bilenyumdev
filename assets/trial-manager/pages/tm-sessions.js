/**
 * Deneme Dersleri listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmSessionsBody');
  var cardsEl = document.getElementById('tmSessionsCards');
  var searchInput = document.getElementById('tmSessionsSearch');
  var statusFilter = document.getElementById('tmSessionsStatus');
  var typeFilter = document.getElementById('tmSessionsType');
  var teacherFilter = document.getElementById('tmSessionsTeacher');
  var dateFromInput = document.getElementById('tmSessionsDateFrom');
  var dateToInput = document.getElementById('tmSessionsDateTo');
  var linkFilter = document.getElementById('tmSessionsLinkFilter');
  var informedFilter = document.getElementById('tmSessionsInformedFilter');
  var sortSelect = document.getElementById('tmSessionsSort');
  var countEl = document.getElementById('tmSessionsCount');
  var paginationEl = document.getElementById('tmSessionsPagination');
  var pageSizeSelect = document.getElementById('tmSessionsPageSize');
  var exportBtn = document.getElementById('tmSessionsExport');

  var page = 1;
  var needsAttendanceFilter = false;
  var todayFilter = false;

  function populateTeacherFilter() {
    if (!teacherFilter) return;
    var current = teacherFilter.value || 'all';
    teacherFilter.innerHTML = '<option value="all">Tüm öğretmenler</option>' +
      Store.getTeachers().filter(function (t) { return t.isActive; }).map(function (t) {
        return '<option value="' + t.id + '">' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</option>';
      }).join('');
    if (teacherFilter.querySelector('option[value="' + current + '"]')) {
      teacherFilter.value = current;
    }
  }

  function initFromUrl() {
    var st = U.qs('status');
    if (st && statusFilter && statusFilter.querySelector('option[value="' + st + '"]')) {
      statusFilter.value = st;
    }
    if (U.qs('needsAttendance') === '1') needsAttendanceFilter = true;
    if (U.qs('today') === '1') todayFilter = true;
    var teacherId = U.qs('teacher');
    if (teacherId && teacherFilter && teacherFilter.querySelector('option[value="' + teacherId + '"]')) {
      teacherFilter.value = teacherId;
    }
    var df = U.qs('dateFrom');
    if (df && dateFromInput) dateFromInput.value = df;
    var dt = U.qs('dateTo');
    if (dt && dateToInput) dateToInput.value = dt;
    var sort = U.qs('sort');
    if (sort && sortSelect && sortSelect.querySelector('option[value="' + sort + '"]')) {
      sortSelect.value = sort;
    }
    var lf = U.qs('link');
    if (lf && linkFilter && linkFilter.querySelector('option[value="' + lf + '"]')) {
      linkFilter.value = lf;
    }
    var inf = U.qs('informed');
    if (inf && informedFilter && informedFilter.querySelector('option[value="' + inf + '"]')) {
      informedFilter.value = inf;
    }
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

  function applySort(items) {
    var sortKey = sortSelect ? sortSelect.value : 'date_asc';
    if (sortKey === 'date_desc') {
      return U.sortBy(items, function (r) { return r.session.date + r.session.startTime; }, 'desc');
    }
    if (sortKey === 'updated_desc') {
      return U.sortBy(items, function (r) { return r.session.updatedAt || ''; }, 'desc');
    }
    if (sortKey === 'teacher_asc') {
      return U.sortBy(items, function (r) { return r.teacherName; }, 'asc');
    }
    return U.sortBy(items, function (r) { return r.session.date + r.session.startTime; }, 'asc');
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var type = typeFilter ? typeFilter.value : 'all';
    var teacher = teacherFilter ? teacherFilter.value : 'all';
    var dateFrom = dateFromInput ? dateFromInput.value : '';
    var dateTo = dateToInput ? dateToInput.value : '';
    var link = linkFilter ? linkFilter.value : 'all';
    var informed = informedFilter ? informedFilter.value : 'all';
    var items = Store.getSessions().map(rowData);
    items = U.filterSearch(items, q, function (r) {
      return r.session.id + ' ' + r.lessonName + ' ' + r.teacherName + ' ' + r.session.date;
    });
    if (status !== 'all') items = items.filter(function (r) { return r.session.status === status; });
    if (type !== 'all') items = items.filter(function (r) { return r.session.lessonTypeId === type; });
    if (teacher !== 'all') items = items.filter(function (r) { return r.session.teacherId === teacher; });
    if (dateFrom) items = items.filter(function (r) { return r.session.date >= dateFrom; });
    if (dateTo) items = items.filter(function (r) { return r.session.date <= dateTo; });
    if (link === 'link_pending') {
      items = items.filter(function (r) { return r.linkNotSent > 0; });
    } else if (link === 'parent_pending') {
      items = items.filter(function (r) { return r.pendingParent > 0; });
    }
    if (informed === 'yes') {
      items = items.filter(function (r) { return r.session.teacherInformed; });
    } else if (informed === 'no') {
      items = items.filter(function (r) { return !r.session.teacherInformed; });
    }
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
    if (todayFilter) {
      var todayKey = Store.todayKey();
      items = items.filter(function (r) { return r.session.date === todayKey && r.session.status !== 'cancelled'; });
    }
    return applySort(items);
  }

  function renderFilterHint() {
    var hintEl = document.getElementById('tmSessionsFilterHint');
    if (!hintEl) return;
    if (needsAttendanceFilter) {
      hintEl.hidden = false;
      hintEl.innerHTML = 'Katılım girilmemiş dersler gösteriliyor. <a class="tm-panel-link" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Filtreyi kaldır</a>';
      return;
    }
    if (todayFilter) {
      hintEl.hidden = false;
      hintEl.innerHTML = 'Bugünkü dersler gösteriliyor. <a class="tm-panel-link" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Filtreyi kaldır</a>';
      return;
    }
    hintEl.hidden = true;
    hintEl.textContent = '';
  }

  function rowHtml(r) {
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
  }

  function cardHtml(r) {
    var s = r.session;
    return '<article class="tm-list-card" data-id="' + s.id + '">' +
      '<div class="tm-list-card-head">' +
        '<div><strong>' + U.formatDateKey(s.date) + ' · ' + s.startTime + '–' + s.endTime + '</strong></div>' +
        SL.sessionBadge(s.status) +
      '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(r.lessonName) + '</div>' +
        '<div><span class="tm-list-card-label">Öğretmen</span> ' + U.escapeHtml(r.teacherName) + '</div>' +
        '<div><span class="tm-list-card-label">Kapasite</span> ' + r.enrolled + '/20 · boş ' + r.remaining + '</div>' +
        '<div><span class="tm-list-card-label">Link</span> ' + SL.meetingBadge(r.meetingStatus) +
          (r.linkNotSent ? ' · <span class="tm-badge tm-badge--warn">' + r.linkNotSent + ' bekliyor</span>' : '') + '</div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-detail="' + s.id + '">Detay</button>' +
      '</div>' +
    '</article>';
  }

  function bindRowActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-detail'));
      });
    });
    root.querySelectorAll('tr[data-id], .tm-list-card[data-id]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        if (window.TMSessionDetail) window.TMSessionDetail.open(el.getAttribute('data-id'));
      });
    });
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
      tbody.innerHTML = p.items.map(rowHtml).join('');
      if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
      U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
      bindRowActions(tbody);
      bindRowActions(cardsEl);
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
      if (cardsEl) cardsEl.hidden = false;
      if (paginationEl) paginationEl.hidden = p.pages <= 1;
      if (window.TMPermissions && window.TMPermissions.applyPageChrome) {
        window.TMPermissions.applyPageChrome(tbody);
      }
      renderFilterHint();
    } catch (err) {
      if (loading) loading.textContent = 'Liste yüklenemedi: ' + err.message;
      console.error(err);
    }
  }

  function onFilterChange() { page = 1; render(); }

  if (searchInput) searchInput.addEventListener('input', U.debounce(onFilterChange, 200));
  [statusFilter, typeFilter, teacherFilter, dateFromInput, dateToInput, linkFilter, informedFilter, sortSelect, pageSizeSelect].forEach(function (el) {
    if (el) el.addEventListener('change', onFilterChange);
  });
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

  window.TMOnSessionChange = function () {
    populateTeacherFilter();
    render();
  };
  populateTeacherFilter();
  initFromUrl();
  render();
  var openSessionId = U.qs('id');
  if (openSessionId && window.TMSessionDetail) window.TMSessionDetail.open(openSessionId);
})();
