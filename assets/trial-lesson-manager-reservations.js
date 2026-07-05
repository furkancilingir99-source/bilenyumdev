(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  if (!Mock) return;

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

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
  var dateClearBtn = document.getElementById('tmResDateClear');

  var allRows = Mock.getReservations();
  var currentPage = 1;
  var dateRange = { start: null, end: null };
  var openDatePop = null;
  var currentDrawerId = null;
  var slotEditor = { open: false, dayOffset: 0, slot: null, parentConfirmed: false };

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

  function toDateKey(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
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

  function createdAtDayMs(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function updateDateClearBtn() {
    if (!dateClearBtn) return;
    dateClearBtn.hidden = !(dateRange.start || dateRange.end);
  }

  function updateDateBtn(key) {
    var btn = document.getElementById(key === 'start' ? 'tmResDateStartBtn' : 'tmResDateEndBtn');
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
    ['tmResDateStartPop', 'tmResDateEndPop'].forEach(function (id) {
      var pop = document.getElementById(id);
      if (pop) pop.hidden = true;
    });
    ['tmResDateStartBtn', 'tmResDateEndBtn'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    openDatePop = null;
  }

  function renderCalendar(pop, key, viewDate) {
    if (!pop) return;
    var selected = dateRange[key];
    var todayKey = toDateKey(new Date());
    var year = viewDate.getFullYear();
    var month = viewDate.getMonth();
    var first = new Date(year, month, 1);
    var startOffset = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    var cells = '';
    var i;
    for (i = 0; i < startOffset; i++) {
      cells += '<span class="tm-cal-day-empty" aria-hidden="true"></span>';
    }
    for (i = 1; i <= daysInMonth; i++) {
      var cellKey = toDateKey(new Date(year, month, i));
      var cls = 'tm-cal-day';
      if (cellKey === selected) cls += ' is-selected';
      if (cellKey === todayKey) cls += ' is-today';
      cells += '<button type="button" class="' + cls + '" data-cal-day="' + cellKey + '">' + i + '</button>';
    }

    pop.innerHTML =
      '<div class="tm-cal">' +
        '<div class="tm-cal-quick">' +
          '<button type="button" class="tm-cal-today" data-cal-today="' + key + '">Bugünü seç</button>' +
        '</div>' +
        '<div class="tm-cal-nav">' +
          '<button type="button" class="tm-cal-nav-btn" data-cal-prev aria-label="Önceki ay">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          '</button>' +
          '<span class="tm-cal-nav-label">' + MONTHS_FULL[month] + ' ' + year + '</span>' +
          '<button type="button" class="tm-cal-nav-btn" data-cal-next aria-label="Sonraki ay">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="tm-cal-weekdays">' + WEEKDAYS.map(function (w) { return '<span>' + w + '</span>'; }).join('') + '</div>' +
        '<div class="tm-cal-grid">' + cells + '</div>' +
      '</div>';

    pop.dataset.calKey = key;
    pop.dataset.calYear = String(year);
    pop.dataset.calMonth = String(month);
  }

  function setDateValue(key, value) {
    dateRange[key] = value || null;
    if (dateRange.start && dateRange.end && dayStartMs(dateRange.start) > dayStartMs(dateRange.end)) {
      if (key === 'start') dateRange.end = dateRange.start;
      else dateRange.start = dateRange.end;
      updateDateBtn('start');
      updateDateBtn('end');
    }
    updateDateBtn(key);
    updateDateClearBtn();
    closeDatePopovers();
    applyFilters(true);
  }

  function initDatePicker(btnId, popId, key) {
    var btn = document.getElementById(btnId);
    var pop = document.getElementById(popId);
    if (!btn || !pop) return;

    var viewDate = new Date();
    viewDate.setDate(1);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = openDatePop === popId;
      closeDatePopovers();
      if (isOpen) return;
      if (dateRange[key]) {
        var sel = parseDateKey(dateRange[key]);
        if (sel) viewDate = new Date(sel.getFullYear(), sel.getMonth(), 1);
      } else {
        viewDate = new Date();
        viewDate.setDate(1);
      }
      renderCalendar(pop, key, viewDate);
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      openDatePop = popId;
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
        viewDate = new Date(parseInt(pop.dataset.calYear, 10), parseInt(pop.dataset.calMonth, 10) - 1, 1);
        renderCalendar(pop, key, viewDate);
        return;
      }
      if (e.target.closest('[data-cal-next]')) {
        viewDate = new Date(parseInt(pop.dataset.calYear, 10), parseInt(pop.dataset.calMonth, 10) + 1, 1);
        renderCalendar(pop, key, viewDate);
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
    var startMs = dateRange.start ? dayStartMs(dateRange.start) : null;
    var endMs = dateRange.end ? dayStartMs(dateRange.end) : null;

    return allRows.filter(function (r) {
      if (status !== 'all' && r.status !== status) return false;
      if (grade !== 'all' && r.grade !== grade) return false;
      if (subject !== 'all' && r.subject !== subject) return false;
      var rowDay = createdAtDayMs(r.createdAt);
      if (startMs != null && rowDay != null && rowDay < startMs) return false;
      if (endMs != null && rowDay != null && rowDay > endMs) return false;
      if (!q) return true;
      var hay = [
        r.id,
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
          '<td><span class="tm-record-id">' + escapeHtml(r.id) + '</span></td>' +
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
          '<td>' +
            (slotWasUpdated(r) ? '<span class="tm-table-slot-badge" title="Veli onayı ile güncellendi">↻</span> ' : '') +
            escapeHtml(r.slotLabel) +
          '</td>' +
          '<td><span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></td>' +
        '</tr>'
      );
    }).join('');

    renderPagination(meta);
  }

  function canEditSlot(r) {
    return r && r.status !== 'completed' && r.status !== 'cancelled';
  }

  function slotWasUpdated(r) {
    return !!(r.slotUpdatedAt && r.requestedSlotLabel && r.slotLabel !== r.requestedSlotLabel);
  }

  function renderSlotEditor(r) {
    var open = slotEditor.open;
    var slots = Mock.getOpenLessonSlots();
    var full = slots.fullByDay[slotEditor.dayOffset] || {};

    var dayNav = slots.days.map(function (d) {
      var active = d.offset === slotEditor.dayOffset ? ' is-active' : '';
      return (
        '<button type="button" class="tm-slot-day' + active + '" data-slot-day="' + d.offset + '">' +
          '<strong>' + escapeHtml(d.label) + '</strong>' +
          '<small>' + escapeHtml(d.date) + '</small>' +
        '</button>'
      );
    }).join('');

    var slotGrid = slots.times.map(function (t) {
      var isFull = !!full[t];
      var isSel = !isFull && slotEditor.slot === t;
      var cls = 'tm-slot' + (isFull ? ' is-full' : '') + (isSel ? ' is-selected' : '');
      return (
        '<button type="button" class="' + cls + '" data-slot-time="' + escapeHtml(t) + '"' + (isFull ? ' disabled' : '') + '>' +
          escapeHtml(t) +
          '<span class="tm-slot-badge' + (isFull ? ' is-full' : ' is-free') + '">' + (isFull ? 'Dolu' : 'Müsait') + '</span>' +
        '</button>'
      );
    }).join('');

    return (
      '<div class="tm-slot-editor' + (open ? ' is-open' : '') + '" id="tmSlotEditor">' +
        '<p class="tm-slot-editor-hint">' +
          'Veli ile iletişim kurduktan sonra açık ders saatlerinden mutabık kalınan slotu seçin. ' +
          'Kaydetmeden önce veli onayını işaretleyin.' +
        '</p>' +
        (open
          ? '<div class="tm-slot-editor-panel">' +
              '<div class="tm-slot-day-nav" role="tablist">' + dayNav + '</div>' +
              '<div class="tm-slot-grid">' + slotGrid + '</div>' +
              '<label class="tm-slot-parent-check">' +
                '<input type="checkbox" id="tmSlotParentConfirm"' + (slotEditor.parentConfirmed ? ' checked' : '') + '>' +
                '<span>Veli ile görüşülüp yeni ders tarihi onaylandı</span>' +
              '</label>' +
              '<div class="tm-slot-editor-actions">' +
                '<button type="button" class="tm-slot-btn tm-slot-btn--ghost" id="tmSlotCancel">Vazgeç</button>' +
                '<button type="button" class="tm-slot-btn tm-slot-btn--primary" id="tmSlotSave" disabled>Kaydet</button>' +
              '</div>' +
            '</div>'
          : '<button type="button" class="tm-slot-edit-toggle" id="tmSlotEditToggle">Ders tarihini güncelle</button>') +
      '</div>'
    );
  }

  function renderDrawerDetail(r) {
    if (!drawerBody || !drawerTitle) return;
    drawerTitle.textContent = studentName(r);
    var editable = canEditSlot(r);
    var updated = slotWasUpdated(r);
    var requestedNote = updated
      ? '<div class="tm-slot-requested"><span class="tm-slot-requested-label">İlk talep</span> ' + escapeHtml(r.requestedSlotLabel) + '</div>'
      : '';

    drawerBody.innerHTML =
      '<div class="tm-detail-card is-student">' +
        '<div class="tm-detail-card-head">' +
          '<span class="tm-detail-card-icon" aria-hidden="true">🎓</span>' +
          '<h4 class="tm-detail-card-title">Öğrenci</h4>' +
        '</div>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(studentName(r)) + '</dd></div>' +
          '<div><dt>Sınıf</dt><dd>' + escapeHtml(r.grade) + '</dd></div>' +
          '<div><dt>Deneme dersi</dt><dd>' + escapeHtml(r.subject) + '</dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="tm-detail-card is-parent">' +
        '<div class="tm-detail-card-head">' +
          '<span class="tm-detail-card-icon" aria-hidden="true">👤</span>' +
          '<h4 class="tm-detail-card-title">Veli</h4>' +
        '</div>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(parentName(r)) + '</dd></div>' +
          '<div><dt>Telefon</dt><dd><a href="tel:' + escapeHtml(r.phone.replace(/\s/g, '')) + '">' + escapeHtml(r.phone) + '</a></dd></div>' +
          '<div><dt>E-posta</dt><dd><a href="mailto:' + escapeHtml(r.email) + '">' + escapeHtml(r.email) + '</a></dd></div>' +
        '</dl>' +
      '</div>' +
      '<div class="tm-detail-card is-reservation">' +
        '<div class="tm-detail-card-head">' +
          '<span class="tm-detail-card-icon" aria-hidden="true">📅</span>' +
          '<h4 class="tm-detail-card-title">Rezervasyon</h4>' +
        '</div>' +
        '<dl class="tm-detail-dl">' +
          '<div><dt>Rezervasyon ID</dt><dd><span class="tm-record-id">' + escapeHtml(r.id) + '</span></dd></div>' +
          '<div><dt>Kayıt tarihi</dt><dd class="tm-detail-readonly">' + escapeHtml(formatCreatedAt(r.createdAt)) + '</dd></div>' +
          '<div class="tm-detail-slot-row"><dt>Ders tarihi / saat</dt><dd>' +
            requestedNote +
            '<div class="tm-slot-current">' +
              (updated ? '<span class="tm-slot-updated-badge">Veli onayı ile güncellendi</span>' : '') +
              '<strong id="tmDrawerSlotLabel">' + escapeHtml(r.slotLabel) + '</strong>' +
              (r.slotUpdatedAt ? '<small class="tm-slot-updated-at">Son güncelleme: ' + escapeHtml(formatCreatedAt(r.slotUpdatedAt)) + '</small>' : '') +
            '</div>' +
            (editable ? renderSlotEditor(r) : '<p class="tm-slot-locked">Tamamlanan veya iptal edilen rezervasyonlarda ders tarihi değiştirilemez.</p>') +
          '</dd></div>' +
          '<div><dt>Durum</dt><dd><span class="tm-status ' + statusClass(r.status) + '" id="tmDrawerStatus">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></dd></div>' +
        '</dl>' +
      '</div>';

    if (editable && slotEditor.open) {
      syncSlotSaveButton();
    }
  }

  function syncSlotSaveButton() {
    var saveBtn = document.getElementById('tmSlotSave');
    var confirmCb = document.getElementById('tmSlotParentConfirm');
    if (!saveBtn) return;
    var confirmed = confirmCb && confirmCb.checked;
    var hasSlot = !!slotEditor.slot;
    saveBtn.disabled = !(confirmed && hasSlot);
  }

  function refreshAllRows() {
    allRows = Mock.getReservations();
  }

  function saveSlotUpdate() {
    if (!currentDrawerId) return;
    var confirmCb = document.getElementById('tmSlotParentConfirm');
    if (!confirmCb || !confirmCb.checked || !slotEditor.slot) return;

    var label = Mock.buildSlotLabel(slotEditor.dayOffset, slotEditor.slot);
    Mock.updateReservationSlot(currentDrawerId, {
      slotLabel: label,
      slotConfirmedByParent: true
    });
    refreshAllRows();
    slotEditor.open = false;
    slotEditor.slot = null;
    slotEditor.parentConfirmed = false;
    var r = Mock.getReservationById(currentDrawerId);
    renderDrawerDetail(r);
    applyFilters(false);
  }

  function bindDrawerSlotEvents() {
    if (!drawerBody) return;

    drawerBody.addEventListener('click', function (e) {
      var toggle = e.target.closest('#tmSlotEditToggle');
      if (toggle) {
        slotEditor.open = true;
        slotEditor.dayOffset = 0;
        slotEditor.slot = null;
        slotEditor.parentConfirmed = false;
        renderDrawerDetail(Mock.getReservationById(currentDrawerId));
        return;
      }

      var cancelBtn = e.target.closest('#tmSlotCancel');
      if (cancelBtn) {
        slotEditor.open = false;
        slotEditor.slot = null;
        renderDrawerDetail(Mock.getReservationById(currentDrawerId));
        return;
      }

      var saveBtn = e.target.closest('#tmSlotSave');
      if (saveBtn) {
        saveSlotUpdate();
        return;
      }

      var dayBtn = e.target.closest('[data-slot-day]');
      if (dayBtn) {
        slotEditor.dayOffset = parseInt(dayBtn.getAttribute('data-slot-day'), 10);
        slotEditor.slot = null;
        renderDrawerDetail(Mock.getReservationById(currentDrawerId));
        return;
      }

      var slotBtn = e.target.closest('[data-slot-time]');
      if (slotBtn && !slotBtn.disabled) {
        slotEditor.slot = slotBtn.getAttribute('data-slot-time');
        renderDrawerDetail(Mock.getReservationById(currentDrawerId));
        return;
      }
    });

    drawerBody.addEventListener('change', function (e) {
      if (e.target.id === 'tmSlotParentConfirm') {
        slotEditor.parentConfirmed = e.target.checked;
        syncSlotSaveButton();
      }
    });
  }

  function openDrawer(id) {
    var r = Mock.getReservationById(id);
    if (!r || !drawer) return;
    currentDrawerId = id;
    slotEditor = { open: false, dayOffset: 0, slot: null, parentConfirmed: false };
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
    currentDrawerId = null;
    slotEditor = { open: false, dayOffset: 0, slot: null, parentConfirmed: false };
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
      if (e.key === 'Escape') {
        if (drawer && drawer.classList.contains('is-open')) closeDrawer();
        else closeDatePopovers();
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.tm-date-field-wrap')) closeDatePopovers();
    });

    if (dateClearBtn) {
      dateClearBtn.addEventListener('click', clearDateRange);
    }

    initDatePicker('tmResDateStartBtn', 'tmResDateStartPop', 'start');
    initDatePicker('tmResDateEndBtn', 'tmResDateEndPop', 'end');
    bindDrawerSlotEvents();
  }

  function init() {
    populateFilterSelects();
    updateDateClearBtn();
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
