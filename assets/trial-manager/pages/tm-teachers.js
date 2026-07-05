/**
 * Öğretmenler listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var Drawer = window.TMDetailDrawer;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmTeachersBody');
  var searchInput = document.getElementById('tmTeachersSearch');
  var countEl = document.getElementById('tmTeachersCount');
  var paginationEl = document.getElementById('tmTeachersPagination');
  var pageSizeSelect = document.getElementById('tmTeachersPageSize');
  var exportBtn = document.getElementById('tmTeachersExport');
  var page = 1;
  var today = Store.todayKey();

  function branchLabel(t) {
    return t.branchLessonTypeIds.map(function (id) {
      var lt = Store.getLessonTypeById(id);
      return lt ? lt.name : id;
    }).join(', ');
  }

  function openDetail(t) {
    if (!Drawer) return;
    var sessions = Store.getSessionsForTeacher(t.id);
    var upcoming = sessions.filter(function (s) { return s.date >= today && s.status !== 'cancelled'; });
    Drawer.open({
      title: U.fullName(t.firstName, t.lastName),
      subtitle: branchLabel(t),
      tabs: [{ label: 'Bilgi' }, { label: 'Yaklaşan dersler' }, { label: 'Müsaitlik' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          body.innerHTML = '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Telefon</div><div class="tm-detail-cell-value">' + U.escapeHtml(t.phone) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">E-posta</div><div class="tm-detail-cell-value">' + U.escapeHtml(t.email) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Dashboard</div><div class="tm-detail-cell-value">' + (t.dashboardEnabled ? 'Aktif' : 'Kapalı') + '</div></div></div>';
        } else if (idx === 1) {
          body.innerHTML = upcoming.length ? '<table class="tm-inner-table"><tbody>' + upcoming.map(function (s) {
            var lt = Store.getLessonTypeById(s.lessonTypeId);
            return '<tr><td>' + U.formatDateKey(s.date) + ' ' + s.startTime + '</td><td>' + (lt ? lt.name : '') + '</td><td>' + s.enrolledStudentIds.length + '/20</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="tm-empty">Yaklaşan ders yok.</p>';
        } else {
          var days = ['Paz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
          body.innerHTML = '<table class="tm-inner-table"><tbody>' + (t.availability || []).map(function (a) {
            return '<tr><td>' + days[a.dayOfWeek] + '</td><td>' + a.startTime + '–' + a.endTime + '</td><td>' + (a.isAvailable ? 'Müsait' : 'Değil') + '</td></tr>';
          }).join('') + '</tbody></table>';
        }
      }
    });
  }

  function filtered() {
    return U.filterSearch(Store.getTeachers(), searchInput ? searchInput.value : '', function (t) {
      return t.firstName + ' ' + t.lastName + ' ' + branchLabel(t);
    });
  }

  function weekCount(teacherId) {
    var d = new Date();
    var weekEnd = new Date(d);
    weekEnd.setDate(d.getDate() + 7);
    var endKey = weekEnd.toISOString().slice(0, 10);
    return Store.getSessionsForTeacher(teacherId).filter(function (s) {
      return s.date >= today && s.date <= endKey && s.status !== 'cancelled';
    }).length;
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmTeachersLoading');
    var wrap = document.getElementById('tmTeachersTableWrap');
    try {
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
    var p = U.paginate(filtered(), page, pageSize);
    if (countEl) countEl.textContent = p.total + ' öğretmen';
    tbody.innerHTML = p.items.map(function (t) {
      var todayCount = Store.getSessionsForTeacher(t.id).filter(function (s) { return s.date === today && s.status !== 'cancelled'; }).length;
      return '<tr><td>' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</td>' +
        '<td>' + U.escapeHtml(branchLabel(t)) + '</td>' +
        '<td>' + U.escapeHtml(t.phone) + '</td><td>' + U.escapeHtml(t.email) + '</td>' +
        '<td>' + todayCount + '</td><td>' + weekCount(t.id) + '</td>' +
        '<td>' + (t.isActive ? 'Müsait' : 'Pasif') + '</td>' +
        '<td>' + (t.dashboardEnabled ? 'Evet' : 'Hayır') + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-detail="' + t.id + '">Detay</button></td></tr>';
    }).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDetail(Store.getTeacherById(btn.getAttribute('data-detail'))); });
    });
    if (loading) loading.hidden = true;
    if (wrap) wrap.hidden = false;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) exportBtn.addEventListener('click', function () {
    Export.exportTable('ogretmenler.csv', filtered(), [{ key: 'firstName', label: 'Ad' }, { key: 'email', label: 'E-posta' }]);
  });
  render();
})();
