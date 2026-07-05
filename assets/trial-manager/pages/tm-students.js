/**
 * Öğrenciler listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Drawer = window.TMDetailDrawer;
  if (!Store) return;

  var tbody = document.getElementById('tmStudentsBody');
  var searchInput = document.getElementById('tmStudentsSearch');
  var countEl = document.getElementById('tmStudentsCount');
  var paginationEl = document.getElementById('tmStudentsPagination');
  var pageSizeSelect = document.getElementById('tmStudentsPageSize');
  var exportBtn = document.getElementById('tmStudentsExport');
  var page = 1;

  function currentReservation(studentId) {
    var res = Store.getReservationsForStudent(studentId).filter(function (r) {
      return r.status === 'confirmed' || r.status === 'pending';
    });
    return res[0] || null;
  }

  function openDetail(st) {
    if (!Drawer) return;
    var lt = Store.getLessonTypeById(st.requestedLessonTypeId);
    var parents = st.parentIds.map(function (pid) { return Store.getParentById(pid); }).filter(Boolean);
    var resHistory = Store.getReservationsForStudent(st.id);
    Drawer.open({
      title: U.fullName(st.firstName, st.lastName),
      subtitle: st.grade + ' · ' + (lt ? lt.name : ''),
      tabs: [{ label: 'Profil' }, { label: 'Rezervasyonlar' }, { label: 'Geçmiş' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          body.innerHTML = '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Yaş</div><div class="tm-detail-cell-value">' + st.age + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Seviye</div><div class="tm-detail-cell-value">' + U.escapeHtml(st.level) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Durum</div><div class="tm-detail-cell-value">' + SL.studentBadge(st.status) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Veli</div><div class="tm-detail-cell-value">' + parents.map(function (p) { return U.escapeHtml(U.fullName(p.firstName, p.lastName)); }).join(', ') + '</div></div></div>' +
            (st.status === 'attended' || st.status === 'confirmed' ?
              '<div class="tm-detail-actions" style="margin-top:12px"><button type="button" class="tm-btn tm-btn--primary" data-enroll="' + st.id + '">Kayda dönüştür</button></div>' : '');
          body.querySelector('[data-enroll]') && body.querySelector('[data-enroll]').addEventListener('click', function () {
            if (window.TMPermissions && !window.TMPermissions.guard('edit')) return;
            var result = Store.convertStudentToEnrollment(st.id);
            if (!result.ok) U.notifyError(result.error);
            else {
              U.notifySuccess('Öğrenci kayda dönüştürüldü.');
              if (window.TMOnSessionChange) window.TMOnSessionChange();
              render();
            }
          });
        } else if (idx === 1) {
          body.innerHTML = resHistory.length ? '<table class="tm-inner-table"><thead><tr><th>Rezervasyon</th><th>Durum</th><th>Link</th></tr></thead><tbody>' +
            resHistory.map(function (r) {
              var s = Store.getSessionById(r.sessionId);
              return '<tr><td>' + (s ? U.formatDateKey(s.date) + ' ' + s.startTime : r.sessionId) + '</td><td>' + SL.reservationBadge(r.status) + '</td><td>' + (r.linkSent ? 'Evet' : 'Hayır') + '</td></tr>';
            }).join('') + '</tbody></table>' : '<p class="tm-empty">Rezervasyon yok.</p>';
        } else {
          var logs = Store.getCommunicationLogs().filter(function (l) { return l.studentId === st.id; });
          body.innerHTML = logs.length ? logs.map(function (l) { return '<p>' + U.formatDateTime(l.createdAt) + ' — ' + U.escapeHtml(l.summary) + '</p>'; }).join('') : '<p class="tm-empty">İletişim kaydı yok.</p>';
        }
      }
    });
  }

  function filtered() {
    return U.filterSearch(Store.getStudents(), searchInput ? searchInput.value : '', function (st) {
      return st.firstName + ' ' + st.lastName + ' ' + st.grade;
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmStudentsLoading');
    var wrap = document.getElementById('tmStudentsTableWrap');
    try {
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
    var p = U.paginate(filtered(), page, pageSize);
    if (countEl) countEl.textContent = p.total + ' öğrenci';
    tbody.innerHTML = p.items.map(function (st) {
      var lt = Store.getLessonTypeById(st.requestedLessonTypeId);
      var pa = st.parentIds[0] ? Store.getParentById(st.parentIds[0]) : null;
      var cur = currentReservation(st.id);
      var sess = cur ? Store.getSessionById(cur.sessionId) : null;
      return '<tr data-id="' + st.id + '" style="cursor:pointer">' +
        '<td>' + U.escapeHtml(U.fullName(st.firstName, st.lastName)) + '</td>' +
        '<td>' + st.age + '</td><td>' + U.escapeHtml(st.grade) + '</td><td>' + U.escapeHtml(st.level) + '</td>' +
        '<td>' + (lt ? lt.name : '—') + '</td>' +
        '<td>' + (pa ? U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) : '—') + '</td>' +
        '<td>' + (pa ? U.escapeHtml(pa.phone) : '—') + '</td>' +
        '<td>' + (sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime : '—') + '</td>' +
        '<td>' + SL.studentBadge(st.status) + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-detail="' + st.id + '">Detay</button></td></tr>';
    }).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openDetail(Store.getStudentById(btn.getAttribute('data-detail')));
      });
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
    Export.exportTable('ogrenciler.csv', filtered(), [
      { key: 'firstName', label: 'Ad' }, { key: 'lastName', label: 'Soyad' }, { key: 'grade', label: 'Sınıf' }, { key: 'status', label: 'Durum' }
    ]);
  });
  render();
})();
