(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  if (!Mock) return;

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  var loading = document.getElementById('tmResLoading');
  var empty = document.getElementById('tmResEmpty');
  var tableWrap = document.getElementById('tmResTableWrap');
  var tbody = document.getElementById('tmResTableBody');
  var searchInput = document.getElementById('tmResSearch');
  var statusFilter = document.getElementById('tmResStatusFilter');
  var gradeFilter = document.getElementById('tmResGradeFilter');
  var subjectFilter = document.getElementById('tmResSubjectFilter');
  var sortSelect = document.getElementById('tmResSort');
  var pageSizeSelect = document.getElementById('tmResPageSize');
  var countEl = document.getElementById('tmResCount');
  var paginationEl = document.getElementById('tmResPagination');
  var drawer = document.getElementById('tmResDrawer');
  var drawerOverlay = document.getElementById('tmResDrawerOverlay');
  var drawerBody = document.getElementById('tmResDrawerBody');
  var drawerTitle = document.getElementById('tmResDrawerTitle');

  var allRows = Mock.getReservations();
  var currentPage = 1;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function statusClass(status) {
    return 'is-' + status;
  }

  function formatCreatedAt(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + h + ':' + m;
  }

  function studentName(r) {
    return r.studentFirstName + ' ' + r.studentLastName;
  }

  function parentName(r) {
    return r.parentFirstName + ' ' + r.parentLastName;
  }

  function populateFilterSelects() {
    var opts = Mock.getFilterOptions();
    if (gradeFilter) {
      gradeFilter.innerHTML =
        '<option value="all">Tüm sınıflar</option>' +
        opts.grades.map(function (g) {
          return '<option value="' + escapeHtml(g) + '">' + escapeHtml(g) + '</option>';
        }).join('');
    }
    if (subjectFilter) {
      subjectFilter.innerHTML =
        '<option value="all">Tüm dersler</option>' +
        opts.subjects.map(function (s) {
          return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
        }).join('');
    }
  }

  function filterRows() {
    var q = (searchInput && searchInput.value || '').trim().toLowerCase();
    var status = statusFilter ? statusFilter.value : 'all';
    var grade = gradeFilter ? gradeFilter.value : 'all';
    var subject = subjectFilter ? subjectFilter.value : 'all';

    return allRows.filter(function (r) {
      if (status !== 'all' && r.status !== status) return false;
      if (grade !== 'all' && r.grade !== grade) return false;
      if (subject !== 'all' && r.subject !== subject) return false;
      if (!q) return true;
      var hay = [
        r.studentFirstName, r.studentLastName, r.grade, r.subject,
        r.parentFirstName, r.parentLastName, r.phone, r.email, r.slotLabel,
        formatCreatedAt(r.createdAt)
      ].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function sortRows(rows) {
    var sortKey = sortSelect ? sortSelect.value : 'createdAt-desc';
    var sorted = rows.slice();

    sorted.sort(function (a, b) {
      if (sortKey === 'createdAt-desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortKey === 'createdAt-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortKey === 'student-asc') {
        return studentName(a).localeCompare(studentName(b), 'tr');
      }
      if (sortKey === 'student-desc') {
        return studentName(b).localeCompare(studentName(a), 'tr');
      }
      if (sortKey === 'subject-asc') {
        return a.subject.localeCompare(b.subject, 'tr');
      }
      return 0;
    });

    return sorted;
  }

  function getPageSize() {
    var n = pageSizeSelect ? parseInt(pageSizeSelect.value, 10) : 8;
    return isNaN(n) || n < 1 ? 8 : n;
  }

  function paginateRows(rows) {
    var pageSize = getPageSize();
    var totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    var start = (currentPage - 1) * pageSize;
    return {
      page: currentPage,
      totalPages: totalPages,
      pageSize: pageSize,
      total: rows.length,
      items: rows.slice(start, start + pageSize)
    };
  }

  function renderPagination(meta) {
    if (!paginationEl) return;
    if (!meta.total) {
      paginationEl.hidden = true;
      return;
    }
    paginationEl.hidden = false;

    var from = (meta.page - 1) * meta.pageSize + 1;
    var to = Math.min(meta.page * meta.pageSize, meta.total);

    var pages = '';
    for (var p = 1; p <= meta.totalPages; p++) {
      pages +=
        '<button type="button" class="tm-page-btn' + (p === meta.page ? ' is-active' : '') + '" data-page="' + p + '"' +
          (p === meta.page ? ' aria-current="page"' : '') + '>' + p + '</button>';
    }

    paginationEl.innerHTML =
      '<div class="tm-page-info">' +
        '<span>' + from + '–' + to + ' / ' + meta.total + ' kayıt</span>' +
        '<span>Sayfa ' + meta.page + ' / ' + meta.totalPages + '</span>' +
      '</div>' +
      '<div class="tm-page-controls">' +
        '<button type="button" class="tm-page-nav" data-page="prev"' + (meta.page <= 1 ? ' disabled' : '') + '>Önceki</button>' +
        '<div class="tm-page-list" role="navigation" aria-label="Sayfa numaraları">' + pages + '</div>' +
        '<button type="button" class="tm-page-nav" data-page="next"' + (meta.page >= meta.totalPages ? ' disabled' : '') + '>Sonraki</button>' +
      '</div>';
  }

  function renderTable(rows, meta) {
    if (!tbody || !tableWrap || !empty) return;

    if (!rows.length) {
      tableWrap.hidden = true;
      empty.hidden = false;
      if (countEl) countEl.textContent = '0 kayıt';
      if (paginationEl) paginationEl.hidden = true;
      return;
    }

    empty.hidden = true;
    tableWrap.hidden = false;
    if (countEl) countEl.textContent = meta.total + ' kayıt';

    var offset = (meta.page - 1) * meta.pageSize;
    tbody.innerHTML = rows.map(function (r, i) {
      var student = studentName(r);
      var parent = parentName(r);
      return (
        '<tr>' +
          '<td>' + (offset + i + 1) + '</td>' +
          '<td>' +
            '<button type="button" class="tm-student-link" data-res-id="' + escapeHtml(r.id) + '">' +
              escapeHtml(student) +
            '</button>' +
          '</td>' +
          '<td>' + escapeHtml(r.grade) + '</td>' +
          '<td>' + escapeHtml(r.subject) + '</td>' +
          '<td><div class="tm-cell-name"><strong>' + escapeHtml(parent) + '</strong></div></td>' +
          '<td class="tm-cell-contact">' + escapeHtml(r.phone) + '</td>' +
          '<td class="tm-cell-contact"><a href="mailto:' + escapeHtml(r.email) + '">' + escapeHtml(r.email) + '</a></td>' +
          '<td class="tm-cell-date">' + escapeHtml(formatCreatedAt(r.createdAt)) + '</td>' +
          '<td>' + escapeHtml(r.slotLabel) + '</td>' +
          '<td><span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></td>' +
        '</tr>'
      );
    }).join('');

    renderPagination(meta);
  }

  function renderDrawerDetail(r) {
    if (!drawerBody || !drawerTitle) return;
    drawerTitle.textContent = studentName(r);
    drawerBody.innerHTML =
      '<div class="tm-detail-section">' +
        '<h4 class="tm-detail-section-title">Öğrenci</h4>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(studentName(r)) + '</dd></div>' +
          '<div><dt>Sınıf</dt><dd>' + escapeHtml(r.grade) + '</dd></div>' +
          '<div><dt>Deneme dersi</dt><dd>' + escapeHtml(r.subject) + '</dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="tm-detail-section">' +
        '<h4 class="tm-detail-section-title">Veli</h4>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(parentName(r)) + '</dd></div>' +
          '<div><dt>Telefon</dt><dd><a href="tel:' + escapeHtml(r.phone.replace(/\s/g, '')) + '">' + escapeHtml(r.phone) + '</a></dd></div>' +
          '<div><dt>E-posta</dt><dd><a href="mailto:' + escapeHtml(r.email) + '">' + escapeHtml(r.email) + '</a></dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="tm-detail-section">' +
        '<h4 class="tm-detail-section-title">Rezervasyon</h4>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Kayıt tarihi</dt><dd>' + escapeHtml(formatCreatedAt(r.createdAt)) + '</dd></div>' +
          '<div><dt>Ders tarihi / saat</dt><dd>' + escapeHtml(r.slotLabel) + '</dd></div>' +
          '<div><dt>Durum</dt><dd><span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></dd></div>' +
        '</dl>' +
      '</div>';
  }

  function openDrawer(id) {
    var r = Mock.getReservationById(id);
    if (!r || !drawer) return;
    renderDrawerDetail(r);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function applyFilters(resetPage) {
    if (resetPage) currentPage = 1;
    var filtered = filterRows();
    var sorted = sortRows(filtered);
    var meta = paginateRows(sorted);
    renderTable(meta.items, meta);
  }

  function wireEvents() {
    if (searchInput) {
      searchInput.addEventListener('input', function () { applyFilters(true); });
    }
    [statusFilter, gradeFilter, subjectFilter, sortSelect, pageSizeSelect].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', function () { applyFilters(true); });
    });

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest('.tm-student-link');
        if (!btn) return;
        openDrawer(btn.getAttribute('data-res-id'));
      });
    }

    if (paginationEl) {
      paginationEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var val = btn.getAttribute('data-page');
        var filtered = sortRows(filterRows());
        var totalPages = Math.max(1, Math.ceil(filtered.length / getPageSize()));
        if (val === 'prev') currentPage -= 1;
        else if (val === 'next') currentPage += 1;
        else currentPage = parseInt(val, 10);
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        applyFilters(false);
      });
    }

    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', closeDrawer);
    }
    document.querySelectorAll('[data-tm-drawer-close]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) closeDrawer();
    });
  }

  function init() {
    populateFilterSelects();
    if (loading) loading.hidden = true;
    applyFilters(true);
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
