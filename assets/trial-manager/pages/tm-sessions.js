/**
 * Deneme Dersleri listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Rules = window.TMSchedulingRules;
  if (!Store) return;

  var tbody = document.getElementById('tmSessionsBody');
  var cardsEl = document.getElementById('tmSessionsCards');
  var searchInput = document.getElementById('tmSessionsSearch');
  var statusFilter = document.getElementById('tmSessionsStatus');
  var typeFilter = document.getElementById('tmSessionsType');
  var pdrTeacherFilter = document.getElementById('tmSessionsPdrTeacher');
  var branchTeacherFilter = document.getElementById('tmSessionsBranchTeacher');
  var dateFromInput = document.getElementById('tmSessionsDateFrom');
  var dateToInput = document.getElementById('tmSessionsDateTo');
  var linkFilter = document.getElementById('tmSessionsLinkFilter');
  var pdrInformedFilter = document.getElementById('tmSessionsPdrInformedFilter');
  var branchInformedFilter = document.getElementById('tmSessionsBranchInformedFilter');
  var missingTeacherFilter = document.getElementById('tmSessionsMissingTeacherFilter');
  var sortSelect = document.getElementById('tmSessionsSort');
  var countEl = document.getElementById('tmSessionsCount');
  var paginationEl = document.getElementById('tmSessionsPagination');
  var pageSizeSelect = document.getElementById('tmSessionsPageSize');
  var exportBtn = document.getElementById('tmSessionsExport');

  var page = 1;
  var needsAttendanceFilter = false;
  var todayFilter = false;

  function populateTeacherFilters() {
    var pdrTeachers = Store.getTeachers().filter(function (t) {
      return t.isActive && (!Rules || Rules.isTeacherPdr(t.id));
    });
    var branchTeachers = Store.getTeachers().filter(function (t) {
      return t.isActive && (!Rules || Rules.isTeacherBranchTeacher(t.id));
    });
    if (pdrTeacherFilter) {
      var curPdr = pdrTeacherFilter.value || 'all';
      pdrTeacherFilter.innerHTML = '<option value="all">Tüm PDR öğretmenleri</option>' + pdrTeachers.map(function (t) {
        return '<option value="' + t.id + '">' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</option>';
      }).join('');
      if (pdrTeacherFilter.querySelector('option[value="' + curPdr + '"]')) pdrTeacherFilter.value = curPdr;
    }
    if (branchTeacherFilter) {
      var curBranch = branchTeacherFilter.value || 'all';
      branchTeacherFilter.innerHTML = '<option value="all">Tüm branş öğretmenleri</option>' + branchTeachers.map(function (t) {
        return '<option value="' + t.id + '">' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</option>';
      }).join('');
      if (branchTeacherFilter.querySelector('option[value="' + curBranch + '"]')) branchTeacherFilter.value = curBranch;
    }
  }

  function initFromUrl() {
    var st = U.qs('status');
    if (st && statusFilter && statusFilter.querySelector('option[value="' + st + '"]')) {
      statusFilter.value = st;
    }
    if (U.qs('needsAttendance') === '1') needsAttendanceFilter = true;
    if (U.qs('today') === '1') todayFilter = true;
    var pdrId = U.qs('pdrTeacher');
    if (pdrId && pdrTeacherFilter && pdrTeacherFilter.querySelector('option[value="' + pdrId + '"]')) {
      pdrTeacherFilter.value = pdrId;
    }
    var branchId = U.qs('branchTeacher');
    if (branchId && branchTeacherFilter && branchTeacherFilter.querySelector('option[value="' + branchId + '"]')) {
      branchTeacherFilter.value = branchId;
    }
    if (U.qs('missingTeachers') === '1' && missingTeacherFilter) missingTeacherFilter.value = 'yes';
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
    var pdrInf = U.qs('pdrInformed');
    if (pdrInf && pdrInformedFilter && pdrInformedFilter.querySelector('option[value="' + pdrInf + '"]')) {
      pdrInformedFilter.value = pdrInf;
    }
    var branchInf = U.qs('branchInformed');
    if (branchInf && branchInformedFilter && branchInformedFilter.querySelector('option[value="' + branchInf + '"]')) {
      branchInformedFilter.value = branchInf;
    }
  }

  // Derse gerçekten atanmış (aktif) rezervasyonlar — iptal/taşınanlar hariç.
  function activeReservations(d) {
    return d.reservations.filter(function (r) {
      return r.status !== 'cancelled' && r.status !== 'rescheduled';
    });
  }

  function rowData(s) {
    var d = Store.getSessionWithDetails(s.id);
    var meeting = d.meeting;
    var active = activeReservations(d);
    var pendingParent = active.filter(function (r) {
      return r.parentApprovalStatus !== 'approved';
    }).length;
    var linkNotSent = active.filter(function (r) {
      return r.parentApprovalStatus === 'approved' && !r.linkSent;
    }).length;
    var capacity = s.capacity || (d.lessonType && d.lessonType.defaultCapacity) || 20;
    var enrolled = active.length;
    return {
      session: s,
      detail: d,
      lessonName: d.lessonType ? d.lessonType.name : '—',
      gradeLevel: s.gradeLevel || '—',
      lessonCode: Store.getLessonCode ? Store.getLessonCode(s) : s.id,
      pdrTeacherName: d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—',
      branchTeacherName: d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—',
      missingTeachers: Rules && Rules.sessionMissingTeachers ? Rules.sessionMissingTeachers(s) : (!s.pdrTeacherId || !s.branchTeacherId),
      enrolled: enrolled,
      capacity: capacity,
      remaining: Math.max(0, capacity - enrolled),
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
    if (sortKey === 'pdr_teacher_asc') {
      return U.sortBy(items, function (r) { return r.pdrTeacherName; }, 'asc');
    }
    if (sortKey === 'branch_teacher_asc') {
      return U.sortBy(items, function (r) { return r.branchTeacherName; }, 'asc');
    }
    return U.sortBy(items, function (r) { return r.session.date + r.session.startTime; }, 'asc');
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var type = typeFilter ? typeFilter.value : 'all';
    var pdrTeacher = pdrTeacherFilter ? pdrTeacherFilter.value : 'all';
    var branchTeacher = branchTeacherFilter ? branchTeacherFilter.value : 'all';
    var dateFrom = dateFromInput ? dateFromInput.value : '';
    var dateTo = dateToInput ? dateToInput.value : '';
    var link = linkFilter ? linkFilter.value : 'all';
    var pdrInformed = pdrInformedFilter ? pdrInformedFilter.value : 'all';
    var branchInformed = branchInformedFilter ? branchInformedFilter.value : 'all';
    var missingTeachers = missingTeacherFilter ? missingTeacherFilter.value : 'all';
    var items = Store.getSessions().map(rowData);
    items = U.filterSearch(items, q, function (r) {
      return r.session.id + ' ' + r.lessonName + ' ' + r.pdrTeacherName + ' ' + r.branchTeacherName + ' ' + r.session.date;
    });
    if (status !== 'all') items = items.filter(function (r) { return r.session.status === status; });
    if (type !== 'all') items = items.filter(function (r) { return r.session.lessonTypeId === type; });
    if (pdrTeacher !== 'all') items = items.filter(function (r) { return r.session.pdrTeacherId === pdrTeacher; });
    if (branchTeacher !== 'all') items = items.filter(function (r) { return r.session.branchTeacherId === branchTeacher; });
    if (dateFrom) items = items.filter(function (r) { return r.session.date >= dateFrom; });
    if (dateTo) items = items.filter(function (r) { return r.session.date <= dateTo; });
    if (link === 'link_pending') {
      items = items.filter(function (r) { return r.linkNotSent > 0; });
    } else if (link === 'parent_pending') {
      items = items.filter(function (r) { return r.pendingParent > 0; });
    }
    if (pdrInformed === 'yes') items = items.filter(function (r) { return r.session.pdrTeacherInformed; });
    else if (pdrInformed === 'no') items = items.filter(function (r) { return !r.session.pdrTeacherInformed; });
    if (branchInformed === 'yes') items = items.filter(function (r) { return r.session.branchTeacherInformed; });
    else if (branchInformed === 'no') items = items.filter(function (r) { return !r.session.branchTeacherInformed; });
    if (missingTeachers === 'yes') items = items.filter(function (r) { return r.missingTeachers; });
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

  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
  function editBtn(id) {
    return '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + id + '" title="Düzenle" aria-label="Düzenle">' + EDIT_ICON + '</button>';
  }

  function rowHtml(r) {
    var s = r.session;
    return '<tr data-id="' + s.id + '" style="cursor:pointer">' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(r.lessonCode) + '</code></td>' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(String(r.meetingId)) + '</code></td>' +
      '<td>' + U.formatDateKey(s.date) + '</td>' +
      '<td>' + s.startTime + '–' + s.endTime + '</td>' +
      '<td>' + U.escapeHtml(r.lessonName) + '</td>' +
      '<td>' + U.escapeHtml(r.gradeLevel) + '</td>' +
      '<td>' + U.escapeHtml(r.pdrTeacherName) + (r.missingTeachers && !s.pdrTeacherId ? ' <span class="tm-badge tm-badge--warn">Eksik</span>' : '') + '</td>' +
      '<td>' + U.escapeHtml(r.branchTeacherName) + (r.missingTeachers && !s.branchTeacherId ? ' <span class="tm-badge tm-badge--warn">Eksik</span>' : '') + '</td>' +
      '<td>' + r.capacity + '</td><td>' + r.enrolled + '</td><td>' + r.remaining + '</td>' +
      '<td>' + SL.sessionBadge(s.status) + '</td>' +
      '<td style="white-space:nowrap">' + editBtn(s.id) + '</td></tr>';
  }

  function cardHtml(r) {
    var s = r.session;
    return '<article class="tm-list-card" data-id="' + s.id + '">' +
      '<div class="tm-list-card-head">' +
        '<div><strong>' + U.formatDateKey(s.date) + ' · ' + s.startTime + '–' + s.endTime + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(r.lessonCode) + '</code></div>' +
        SL.sessionBadge(s.status) +
      '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(r.lessonName) + ' · ' + U.escapeHtml(r.gradeLevel) + '</div>' +
        '<div><span class="tm-list-card-label">PDR</span> ' + U.escapeHtml(r.pdrTeacherName) + '</div>' +
        '<div><span class="tm-list-card-label">Branş</span> ' + U.escapeHtml(r.branchTeacherName) + '</div>' +
        '<div><span class="tm-list-card-label">Kapasite</span> ' + r.enrolled + '/' + r.capacity + ' · boş ' + r.remaining + '</div>' +
        '<div><span class="tm-list-card-label">Meeting ID</span> <code class="tm-res-code-cell">' + U.escapeHtml(String(r.meetingId)) + '</code></div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + s.id + '" title="Düzenle" aria-label="Düzenle">' + EDIT_ICON + ' Düzenle</button>' +
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
  [statusFilter, typeFilter, pdrTeacherFilter, branchTeacherFilter, dateFromInput, dateToInput, linkFilter,
    pdrInformedFilter, branchInformedFilter, missingTeacherFilter, sortSelect, pageSizeSelect].forEach(function (el) {
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
    populateTeacherFilters();
    render();
  };
  populateTeacherFilters();
  initFromUrl();
  render();
  var openSessionId = U.qs('id');
  if (openSessionId && window.TMSessionDetail) window.TMSessionDetail.open(openSessionId);
})();
