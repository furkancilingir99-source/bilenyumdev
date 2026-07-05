(function () {
  'use strict';

  var Planner = window.TrialLessonPlannerMock;
  var ResMock = window.TrialLessonManagerMock;
  if (!Planner || !ResMock) return;

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

  var loading = document.getElementById('tmPlannedLoading');
  var empty = document.getElementById('tmPlannedEmpty');
  var tableWrap = document.getElementById('tmPlannedTableWrap');
  var tbody = document.getElementById('tmPlannedTableBody');
  var searchInput = document.getElementById('tmPlannedSearch');
  var gradeFilter = document.getElementById('tmPlannedGradeFilter');
  var subjectFilter = document.getElementById('tmPlannedSubjectFilter');
  var teacherFilter = document.getElementById('tmPlannedTeacherFilter');
  var sortSelect = document.getElementById('tmPlannedSort');
  var pageSizeSelect = document.getElementById('tmPlannedPageSize');
  var countEl = document.getElementById('tmPlannedCount');
  var paginationEl = document.getElementById('tmPlannedPagination');
  var drawer = document.getElementById('tmPlannedDrawer');
  var drawerOverlay = document.getElementById('tmPlannedDrawerOverlay');
  var drawerBody = document.getElementById('tmPlannedDrawerBody');
  var drawerTitle = document.getElementById('tmPlannedDrawerTitle');
  var dateClearBtn = document.getElementById('tmPlannedDateClear');

  var allRows = [];
  var currentPage = 1;
  var dateRange = { start: null, end: null };
  var openDatePop = null;
  var currentDrawerId = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatUpdatedAt(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + h + ':' + m;
  }

  function toDateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function parseDateKey(key) {
    if (!key) return null;
    var parts = key.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatDateKey(key) {
    var d = parseDateKey(key);
    if (!d || isNaN(d.getTime())) return '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function dayStartMs(key) {
    var d = parseDateKey(key);
    return d ? d.getTime() : null;
  }

  function updateDateClearBtn() {
    if (!dateClearBtn) return;
    dateClearBtn.hidden = !(dateRange.start || dateRange.end);
  }

  function updateDateBtn(key) {
    var btn = document.getElementById(key === 'start' ? 'tmPlannedDateStartBtn' : 'tmPlannedDateEndBtn');
    if (!btn) return;
    var textEl = btn.querySelector('.tm-date-btn-text');
    if (!textEl) return;
    var val = dateRange[key];
    if (val) {
      textEl.textContent = formatDateKey(val);
      textEl.classList.remove('is-placeholder');
    } else {
      textEl.textContent = 'Tarih seç';
      textEl.classList.add('is-placeholder');
    }
  }

  function closeDatePopovers() {
    ['tmPlannedDateStartPop', 'tmPlannedDateEndPop'].forEach(function (id) {
      var pop = document.getElementById(id);
      if (pop) pop.hidden = true;
    });
    ['tmPlannedDateStartBtn', 'tmPlannedDateEndBtn'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    openDatePop = null;
  }

  function renderCalendar(pop, key, viewDate) {
    if (!pop) return;
    var selected = dateRange[key];
    var todayKey = toDateKey(new Date());
    var y = viewDate.getFullYear();
    var m = viewDate.getMonth();
    var firstDay = new Date(y, m, 1).getDay();
    var offset = (firstDay + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();

    pop.dataset.calYear = y;
    pop.dataset.calMonth = m + 1;

    var cells = '';
    for (var i = 0; i < offset; i++) cells += '<span class="tm-cal-empty"></span>';
    for (var day = 1; day <= daysInMonth; day++) {
      var keyStr = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var cls = 'tm-cal-day';
      if (keyStr === todayKey) cls += ' is-today';
      if (keyStr === selected) cls += ' is-selected';
      cells += '<button type="button" class="' + cls + '" data-cal-day="' + keyStr + '">' + day + '</button>';
    }

    pop.innerHTML =
      '<div class="tm-cal-head">' +
        '<button type="button" class="tm-cal-nav" data-cal-prev aria-label="Önceki ay">‹</button>' +
        '<span class="tm-cal-title">' + MONTHS_FULL[m] + ' ' + y + '</span>' +
        '<button type="button" class="tm-cal-nav" data-cal-next aria-label="Sonraki ay">›</button>' +
      '</div>' +
      '<div class="tm-cal-weekdays">' + WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
      '<div class="tm-cal-grid">' + cells + '</div>' +
      '<button type="button" class="tm-cal-today" data-cal-today>Bugünü seç</button>';
  }

  function setDateValue(key, val) {
    dateRange[key] = val;
    if (dateRange.start && dateRange.end && dayStartMs(dateRange.start) > dayStartMs(dateRange.end)) {
      if (key === 'start') dateRange.end = null;
      else dateRange.start = null;
    }
    updateDateBtn('start');
    updateDateBtn('end');
    updateDateClearBtn();
    closeDatePopovers();
    applyFilters(true);
  }

  function bindDatePicker(btnId, popId, key) {
    var btn = document.getElementById(btnId);
    var pop = document.getElementById(popId);
    if (!btn || !pop) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = openDatePop !== popId;
      closeDatePopovers();
      if (willOpen) {
        renderCalendar(pop, key, dateRange[key] ? parseDateKey(dateRange[key]) : new Date());
        pop.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        openDatePop = popId;
      }
    });

    pop.addEventListener('click', function (e) {
      var todayBtn = e.target.closest('[data-cal-today]');
      if (todayBtn) {
        setDateValue(key, toDateKey(new Date()));
        return;
      }
      var dayBtn = e.target.closest('[data-cal-day]');
      if (dayBtn) {
        setDateValue(key, dayBtn.getAttribute('data-cal-day'));
        return;
      }
      if (e.target.closest('[data-cal-prev]')) {
        renderCalendar(pop, key, new Date(parseInt(pop.dataset.calYear, 10), parseInt(pop.dataset.calMonth, 10) - 2, 1));
        return;
      }
      if (e.target.closest('[data-cal-next]')) {
        renderCalendar(pop, key, new Date(parseInt(pop.dataset.calYear, 10), parseInt(pop.dataset.calMonth, 10), 1));
      }
    });
  }

  function clearDateRange() {
    dateRange.start = null;
    dateRange.end = null;
    updateDateBtn('start');
    updateDateBtn('end');
    updateDateClearBtn();
    closeDatePopovers();
    applyFilters(true);
  }

  function refreshAllRows() {
    allRows = Planner.getPlannedLessons().map(function (l) {
      var enriched = Planner.getEnrichedPlannedLesson(l.id);
      return enriched || l;
    });
  }

  function populateFilterSelects() {
    var opts = Planner.getFilterOptions();
    if (gradeFilter) {
      gradeFilter.innerHTML =
        '<option value="all">Tüm sınıflar</option>' +
        opts.grades.map(function (g) {
          return '<option value="' + escapeHtml(g) + '">' + escapeHtml(g) + '</option>';
        }).join('');
    }
    if (subjectFilter) {
      subjectFilter.innerHTML =
        '<option value="all">Tüm branşlar</option>' +
        opts.subjects.map(function (s) {
          return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + '</option>';
        }).join('');
    }
    if (teacherFilter) {
      teacherFilter.innerHTML =
        '<option value="all">Tüm öğretmenler</option>' +
        opts.teachers.map(function (t) {
          return '<option value="' + escapeHtml(t.id) + '">' + escapeHtml(t.name) + '</option>';
        }).join('');
    }
  }

  function studentNames(l) {
    return (l.students || []).map(function (s) { return s.name; }).join(' ');
  }

  function filterRows() {
    var q = (searchInput && searchInput.value || '').trim().toLowerCase();
    var grade = gradeFilter ? gradeFilter.value : 'all';
    var subject = subjectFilter ? subjectFilter.value : 'all';
    var teacher = teacherFilter ? teacherFilter.value : 'all';
    var startMs = dateRange.start ? dayStartMs(dateRange.start) : null;
    var endMs = dateRange.end ? dayStartMs(dateRange.end) : null;

    return allRows.filter(function (l) {
      if (grade !== 'all' && l.grade !== grade) return false;
      if (subject !== 'all' && l.subject !== subject) return false;
      if (teacher !== 'all' && l.teacherId !== teacher) return false;
      var rowDay = dayStartMs(l.slotDateKey);
      if (startMs != null && rowDay != null && rowDay < startMs) return false;
      if (endMs != null && rowDay != null && rowDay > endMs) return false;
      if (!q) return true;
      var hay = [
        l.id,
        l.subject, l.grade, l.teacherName, l.slotLabel,
        studentNames(l), formatUpdatedAt(l.updatedAt)
      ].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function sortRows(rows) {
    var sortKey = sortSelect ? sortSelect.value : 'slot-desc';
    var sorted = rows.slice();

    sorted.sort(function (a, b) {
      if (sortKey === 'slot-desc') {
        return (b.slotDateKey + b.slotTime).localeCompare(a.slotDateKey + a.slotTime);
      }
      if (sortKey === 'slot-asc') {
        return (a.slotDateKey + a.slotTime).localeCompare(b.slotDateKey + b.slotTime);
      }
      if (sortKey === 'updated-desc') {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      if (sortKey === 'subject-asc') {
        return a.subject.localeCompare(b.subject, 'tr');
      }
      if (sortKey === 'teacher-asc') {
        return (a.teacherName || '').localeCompare(b.teacherName || '', 'tr');
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

  function statusBadge(l) {
    if (l.conflicts && l.conflicts.length) {
      return '<span class="tm-status is-pending">Çakışma var</span>';
    }
    return '<span class="tm-status is-confirmed">Planlandı</span>';
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
    tbody.innerHTML = rows.map(function (l, i) {
      var studentLabel = l.studentIds.length
        ? l.studentIds.length + ' öğrenci'
        : '—';
      return (
        '<tr>' +
          '<td><span class="tm-record-id">' + escapeHtml(l.id) + '</span></td>' +
          '<td>' +
            '<button type="button" class="tm-student-link" data-lesson-id="' + escapeHtml(l.id) + '">' +
              escapeHtml(l.subject) +
            '</button>' +
          '</td>' +
          '<td>' + escapeHtml(l.grade) + '</td>' +
          '<td><div class="tm-cell-name"><strong>' + escapeHtml(l.teacherName || '—') + '</strong></div></td>' +
          '<td>' + escapeHtml(l.slotLabel) + '</td>' +
          '<td>' + escapeHtml(studentLabel) + '</td>' +
          '<td class="tm-cell-date">' + escapeHtml(formatUpdatedAt(l.updatedAt)) + '</td>' +
          '<td>' + statusBadge(l) + '</td>' +
        '</tr>'
      );
    }).join('');

    renderPagination(meta);
  }

  function renderStudentCards(students) {
    if (!students.length) {
      return '<p class="tm-planned-no-students">Bu derse henüz öğrenci eklenmemiş.</p>';
    }
    return students.map(function (s) {
      var statusLabel = ResMock.STATUS_LABELS[s.status] || s.status || '—';
      return (
        '<div class="tm-detail-card is-student tm-planned-student-card">' +
          '<div class="tm-detail-card-head">' +
            '<span class="tm-detail-card-icon" aria-hidden="true">🎓</span>' +
            '<h4 class="tm-detail-card-title">' + escapeHtml(s.name) + '</h4>' +
          '</div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Rezervasyon ID</dt><dd><span class="tm-record-id">' + escapeHtml(s.reservationId) + '</span></dd></div>' +
            '<div><dt>Sınıf</dt><dd>' + escapeHtml(s.grade) + '</dd></div>' +
            '<div><dt>Veli</dt><dd>' + escapeHtml(s.parent) + '</dd></div>' +
            '<div><dt>Telefon</dt><dd><a href="tel:' + escapeHtml(String(s.phone).replace(/\s/g, '')) + '">' + escapeHtml(s.phone) + '</a></dd></div>' +
            '<div><dt>E-posta</dt><dd><a href="mailto:' + escapeHtml(s.email) + '">' + escapeHtml(s.email) + '</a></dd></div>' +
            '<div><dt>Tercih ettiği slot</dt><dd>' + escapeHtml(s.preferredSlot) + '</dd></div>' +
            '<div><dt>Rezervasyon durumu</dt><dd><span class="tm-status is-' + escapeHtml(s.status) + '">' + escapeHtml(statusLabel) + '</span></dd></div>' +
          '</dl>' +
        '</div>'
      );
    }).join('');
  }

  function renderDrawerDetail(l) {
    if (!drawerBody || !drawerTitle) return;
    drawerTitle.textContent = l.subject + ' · ' + l.grade;

    var conflictBlock = '';
    if (l.conflicts && l.conflicts.length) {
      conflictBlock =
        '<div class="tm-planned-conflict-alert">' +
          '<strong>Çakışma uyarısı</strong>' +
          '<ul>' + l.conflicts.map(function (c) { return '<li>' + escapeHtml(c.message) + '</li>'; }).join('') + '</ul>' +
        '</div>';
    }

    drawerBody.innerHTML =
      conflictBlock +
      '<div class="tm-detail-card is-lesson">' +
        '<div class="tm-detail-card-head">' +
          '<span class="tm-detail-card-icon" aria-hidden="true">📚</span>' +
          '<h4 class="tm-detail-card-title">Ders</h4>' +
        '</div>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Ders ID</dt><dd><span class="tm-record-id">' + escapeHtml(l.id) + '</span></dd></div>' +
          '<div><dt>Branş</dt><dd>' + escapeHtml(l.subject) + '</dd></div>' +
          '<div><dt>Sınıf</dt><dd>' + escapeHtml(l.grade) + '</dd></div>' +
          '<div><dt>Ders tarihi / saat</dt><dd><strong>' + escapeHtml(l.slotLabel) + '</strong></dd></div>' +
          '<div><dt>Öğrenci sayısı</dt><dd>' + l.studentIds.length + '</dd></div>' +
          '<div><dt>Son güncelleme</dt><dd>' + escapeHtml(formatUpdatedAt(l.updatedAt)) + '</dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="tm-detail-card is-teacher">' +
        '<div class="tm-detail-card-head">' +
          '<span class="tm-detail-card-icon" aria-hidden="true">👨‍🏫</span>' +
          '<h4 class="tm-detail-card-title">Öğretmen</h4>' +
        '</div>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(l.teacherName) + '</dd></div>' +
          '<div><dt>Branşlar</dt><dd>' + escapeHtml((l.teacherSubjects || []).join(', ')) + '</dd></div>' +
        '</dl>' +
      '</div>' +
      '<section class="tm-planned-students-section">' +
        '<h3 class="tm-planned-students-heading">Derse katılacak öğrenciler (' + l.students.length + ')</h3>' +
        renderStudentCards(l.students) +
      '</section>' +
      '<div class="tm-planned-drawer-actions">' +
        '<a class="tm-planner-btn is-primary" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(l.id) + '">Dersi düzenle</a>' +
      '</div>';
  }

  function openDrawer(id) {
    currentDrawerId = id;
    var l = Planner.getEnrichedPlannedLesson(id);
    if (!l) return;
    renderDrawerDetail(l);
    if (drawer) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('tm-drawer-open');
  }

  function closeDrawer() {
    currentDrawerId = null;
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('tm-drawer-open');
  }

  function applyFilters(resetPage) {
    if (resetPage) currentPage = 1;
    var filtered = sortRows(filterRows());
    var meta = paginateRows(filtered);
    renderTable(meta.items, meta);
  }

  function bindEvents() {
    [searchInput, gradeFilter, subjectFilter, teacherFilter, sortSelect, pageSizeSelect].forEach(function (el) {
      if (!el) return;
      el.addEventListener('change', function () { applyFilters(true); });
      if (el === searchInput) {
        el.addEventListener('input', function () { applyFilters(true); });
      }
    });

    if (dateClearBtn) dateClearBtn.addEventListener('click', clearDateRange);

    bindDatePicker('tmPlannedDateStartBtn', 'tmPlannedDateStartPop', 'start');
    bindDatePicker('tmPlannedDateEndBtn', 'tmPlannedDateEndPop', 'end');

    document.addEventListener('click', function (e) {
      if (openDatePop && !e.target.closest('.tm-date-field-wrap')) closeDatePopovers();
    });

    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var link = e.target.closest('[data-lesson-id]');
        if (!link) return;
        openDrawer(link.getAttribute('data-lesson-id'));
      });
    }

    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
    if (drawer) {
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('[data-tm-drawer-close]')) closeDrawer();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    if (paginationEl) {
      paginationEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-page]');
        if (!btn || btn.disabled) return;
        var val = btn.getAttribute('data-page');
        if (val === 'prev') currentPage--;
        else if (val === 'next') currentPage++;
        else currentPage = parseInt(val, 10);
        applyFilters(false);
      });
    }
  }

  function init() {
    populateFilterSelects();
    refreshAllRows();
    bindEvents();
    if (loading) loading.hidden = true;
    applyFilters(true);

    var params = new URLSearchParams(window.location.search);
    var openId = params.get('id');
    if (openId && Planner.getPlannedLessonById(openId)) {
      openDrawer(openId);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
