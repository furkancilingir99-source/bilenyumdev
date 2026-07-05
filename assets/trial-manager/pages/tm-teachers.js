/**
 * Öğretmenler listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var Drawer = window.TMDetailDrawer;
  var Export = window.TMExportUtils;
  var QuickMsg = window.TMQuickMessage;
  var Form = window.TMFormDialog;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmTeachersBody');
  var searchInput = document.getElementById('tmTeachersSearch');
  var countEl = document.getElementById('tmTeachersCount');
  var paginationEl = document.getElementById('tmTeachersPagination');
  var pageSizeSelect = document.getElementById('tmTeachersPageSize');
  var exportBtn = document.getElementById('tmTeachersExport');
  var createBtn = document.getElementById('tmTeachersCreate');
  var page = 1;
  var today = Store.todayKey();

  function openCreateTeacher() {
    if (!Form || !Perms || !Perms.guard('create')) return;
    Form.open({
      title: 'Yeni öğretmen',
      fields: [
        { type: 'text', name: 'firstName', label: 'Ad', value: '', required: true },
        { type: 'text', name: 'lastName', label: 'Soyad', value: '', required: true },
        { type: 'text', name: 'phone', label: 'Telefon', value: '', required: true },
        { type: 'text', name: 'email', label: 'E-posta', value: '', required: false },
        {
          type: 'select',
          name: 'lessonTypeId',
          label: 'Branş',
          value: 'lt-mat',
          options: Store.getLessonTypes().map(function (lt) { return { value: lt.id, label: lt.name }; })
        },
        { type: 'textarea', name: 'notes', label: 'Not', value: '', rows: 3, required: false }
      ],
      submitLabel: 'Oluştur',
      onSubmit: function (data) {
        var result = Store.createTeacher(data);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Öğretmen oluşturuldu.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          render();
          openDetail(result.teacher);
        }
      }
    });
  }

  function branchLabel(t) {
    return t.branchLessonTypeIds.map(function (id) {
      var lt = Store.getLessonTypeById(id);
      return lt ? lt.name : id;
    }).join(', ');
  }

  function openEditTeacher(t) {
    if (!Form || !Perms || !Perms.guard('edit')) return;
    Form.open({
      title: 'Öğretmen düzenle',
      fields: [
        { type: 'text', name: 'phone', label: 'Telefon', value: t.phone, required: true },
        { type: 'text', name: 'email', label: 'E-posta', value: t.email },
        { type: 'textarea', name: 'notes', label: 'Not', value: t.notes || '', rows: 3 }
      ],
      onSubmit: function (data) {
        var result = Store.updateTeacher(t.id, data);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Öğretmen güncellendi.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          render();
        }
      }
    });
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
          body.innerHTML =
            '<div class="tm-detail-actions" style="margin-bottom:12px">' +
              (QuickMsg ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-teacher>WhatsApp</button> ' : '') +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-edit-teacher data-tm-require="edit">Düzenle</button>' +
            '</div>' +
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Telefon</div><div class="tm-detail-cell-value">' + U.escapeHtml(t.phone) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">E-posta</div><div class="tm-detail-cell-value">' + U.escapeHtml(t.email) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Dashboard</div><div class="tm-detail-cell-value">' + (t.dashboardEnabled ? 'Aktif' : 'Kapalı') + '</div></div></div>';
          var waBtn = body.querySelector('[data-wa-teacher]');
          if (waBtn && QuickMsg) {
            waBtn.addEventListener('click', function () {
              var next = upcoming[0] || sessions[0];
              var lt = next ? Store.getLessonTypeById(next.lessonTypeId) : null;
              QuickMsg.openForTeacher({
                teacherName: U.fullName(t.firstName, t.lastName),
                date: next ? U.formatDateKey(next.date) : '—',
                time: next ? next.startTime : '—',
                lessonType: lt ? lt.name : branchLabel(t),
                studentCount: next ? next.enrolledStudentIds.length : 0,
                phone: t.phone,
                email: t.email
              });
            });
          }
          body.querySelector('[data-edit-teacher]') && body.querySelector('[data-edit-teacher]').addEventListener('click', function () {
            openEditTeacher(Store.getTeacherById(t.id) || t);
          });
        } else if (idx === 1) {
          body.innerHTML = upcoming.length ? '<table class="tm-inner-table"><tbody>' + upcoming.map(function (s) {
            var lt = Store.getLessonTypeById(s.lessonTypeId);
            return '<tr data-session-row="' + s.id + '" style="cursor:pointer"><td>' + U.formatDateKey(s.date) + ' ' + s.startTime + '</td><td>' + (lt ? lt.name : '') + '</td><td>' + s.enrolledStudentIds.length + '/20</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="tm-empty">Yaklaşan ders yok.</p>';
          body.querySelectorAll('[data-session-row]').forEach(function (row) {
            row.addEventListener('click', function () {
              if (window.TMSessionDetail) window.TMSessionDetail.open(row.getAttribute('data-session-row'));
            });
          });
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
    if (window.TMPermissions && !window.TMPermissions.guard('export')) return;
    Export.exportTable('ogretmenler.csv', filtered(), [{ key: 'firstName', label: 'Ad' }, { key: 'email', label: 'E-posta' }]);
  });
  if (createBtn) createBtn.addEventListener('click', openCreateTeacher);
  window.TMOnSessionChange = render;
  render();
})();
