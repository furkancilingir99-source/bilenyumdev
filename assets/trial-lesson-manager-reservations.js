(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  if (!Mock) return;

  var loading = document.getElementById('tmResLoading');
  var empty = document.getElementById('tmResEmpty');
  var tableWrap = document.getElementById('tmResTableWrap');
  var tbody = document.getElementById('tmResTableBody');
  var searchInput = document.getElementById('tmResSearch');
  var statusFilter = document.getElementById('tmResStatusFilter');
  var countEl = document.getElementById('tmResCount');

  var allRows = Mock.getReservations();

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function statusClass(status) {
    return 'is-' + status;
  }

  function filterRows() {
    var q = (searchInput && searchInput.value || '').trim().toLowerCase();
    var status = statusFilter ? statusFilter.value : 'all';
    return allRows.filter(function (r) {
      if (status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      var hay = [
        r.studentFirstName, r.studentLastName, r.grade, r.subject,
        r.parentFirstName, r.parentLastName, r.phone, r.email, r.slotLabel
      ].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderTable(rows) {
    if (!tbody || !tableWrap || !empty) return;

    if (!rows.length) {
      tableWrap.hidden = true;
      empty.hidden = false;
      if (countEl) countEl.textContent = '0 kayıt';
      return;
    }

    empty.hidden = true;
    tableWrap.hidden = false;
    if (countEl) countEl.textContent = rows.length + ' kayıt';

    tbody.innerHTML = rows.map(function (r, i) {
      var student = r.studentFirstName + ' ' + r.studentLastName;
      var parent = r.parentFirstName + ' ' + r.parentLastName;
      return (
        '<tr>' +
          '<td>' + (i + 1) + '</td>' +
          '<td><div class="tm-cell-name"><strong>' + escapeHtml(student) + '</strong></div></td>' +
          '<td>' + escapeHtml(r.grade) + '</td>' +
          '<td>' + escapeHtml(r.subject) + '</td>' +
          '<td><div class="tm-cell-name"><strong>' + escapeHtml(parent) + '</strong></div></td>' +
          '<td class="tm-cell-contact">' + escapeHtml(r.phone) + '</td>' +
          '<td class="tm-cell-contact"><a href="mailto:' + escapeHtml(r.email) + '">' + escapeHtml(r.email) + '</a></td>' +
          '<td>' + escapeHtml(r.slotLabel) + '</td>' +
          '<td><span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></td>' +
        '</tr>'
      );
    }).join('');
  }

  function applyFilters() {
    renderTable(filterRows());
  }

  function init() {
    if (loading) loading.hidden = true;
    applyFilters();

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', applyFilters);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
