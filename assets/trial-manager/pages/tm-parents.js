/**
 * Veliler listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Drawer = window.TMDetailDrawer;
  var Export = window.TMExportUtils;
  var QuickMsg = window.TMQuickMessage;
  var Form = window.TMFormDialog;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmParentsBody');
  var searchInput = document.getElementById('tmParentsSearch');
  var countEl = document.getElementById('tmParentsCount');
  var paginationEl = document.getElementById('tmParentsPagination');
  var pageSizeSelect = document.getElementById('tmParentsPageSize');
  var exportBtn = document.getElementById('tmParentsExport');
  var createBtn = document.getElementById('tmParentsCreate');
  var page = 1;

  function openCreateParent() {
    if (!Form || !Perms || !Perms.guard('create')) return;
    Form.open({
      title: 'Yeni veli',
      fields: [
        { type: 'text', name: 'firstName', label: 'Ad', value: '', required: true },
        { type: 'text', name: 'lastName', label: 'Soyad', value: '', required: true },
        { type: 'text', name: 'phone', label: 'Telefon', value: '', required: true },
        { type: 'text', name: 'email', label: 'E-posta', value: '' },
        { type: 'textarea', name: 'notes', label: 'Not', value: '', rows: 3, required: false }
      ],
      submitLabel: 'Oluştur',
      onSubmit: function (data) {
        var result = Store.createParent(data);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Veli oluşturuldu.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          render();
          openDetail(result.parent);
        }
      }
    });
  }

  function openParentWhatsApp(pa) {
    if (!QuickMsg || !pa) return;
    var res = Store.getReservationsForParent(pa.id).find(function (r) {
      return r.status === 'confirmed' || r.status === 'pending';
    });
    var student = res ? Store.getStudentById(res.studentId) : (pa.studentIds.length ? Store.getStudentById(pa.studentIds[0]) : null);
    var session = res ? Store.getSessionById(res.sessionId) : null;
    var meeting = session ? Store.getMeetingBySessionId(session.id) : null;
    var lt = session ? Store.getLessonTypeById(session.lessonTypeId) : null;
    QuickMsg.openForParent({
      parentName: U.fullName(pa.firstName, pa.lastName),
      studentName: student ? U.fullName(student.firstName, student.lastName) : 'Öğrenci',
      lessonType: lt ? lt.name : 'Deneme dersi',
      date: session ? U.formatDateKey(session.date) : '—',
      time: session ? session.startTime : '—',
      meetingUrl: meeting ? meeting.meetingUrl : '',
      meetingId: meeting ? meeting.meetingId : '',
      passcode: meeting ? meeting.passcode : '',
      phone: pa.phone,
      email: pa.email
    });
  }

  function openEditParent(pa) {
    if (!Form || !Perms || !Perms.guard('edit')) return;
    Form.open({
      title: 'Veli düzenle',
      fields: [
        { type: 'text', name: 'firstName', label: 'Ad', value: pa.firstName, required: true },
        { type: 'text', name: 'lastName', label: 'Soyad', value: pa.lastName, required: true },
        { type: 'text', name: 'phone', label: 'Telefon', value: pa.phone, required: true },
        { type: 'text', name: 'email', label: 'E-posta', value: pa.email },
        { type: 'textarea', name: 'notes', label: 'Not', value: pa.notes || '', rows: 3 }
      ],
      onSubmit: function (data) {
        var result = Store.updateParent(pa.id, data);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Veli güncellendi.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          render();
        }
      }
    });
  }

  function openDetail(pa) {
    if (!Drawer) return;
    var students = pa.studentIds.map(function (id) { return Store.getStudentById(id); }).filter(Boolean);
    var res = Store.getReservationsForParent(pa.id);
    Drawer.open({
      title: U.fullName(pa.firstName, pa.lastName),
      subtitle: pa.phone,
      tabs: [{ label: 'İletişim' }, { label: 'Rezervasyonlar' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          body.innerHTML =
            '<div class="tm-detail-actions" style="margin-bottom:12px">' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-parent>WhatsApp</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-edit-parent data-tm-require="edit">Düzenle</button>' +
            '</div>' +
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">E-posta</div><div class="tm-detail-cell-value">' + U.escapeHtml(pa.email) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Öğrenciler</div><div class="tm-detail-cell-value">' + students.map(function (s) { return U.escapeHtml(U.fullName(s.firstName, s.lastName)); }).join(', ') + '</div></div></div>';
          body.querySelector('[data-wa-parent]').addEventListener('click', function () { openParentWhatsApp(pa); });
          body.querySelector('[data-edit-parent]') && body.querySelector('[data-edit-parent]').addEventListener('click', function () {
            openEditParent(Store.getParentById(pa.id) || pa);
          });
        } else {
          body.innerHTML = res.length ? '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Durum</th><th>Onay</th></tr></thead><tbody>' + res.slice(0, 10).map(function (r) {
            var s = Store.getSessionById(r.sessionId);
            return '<tr><td>' + (s ? U.formatDateKey(s.date) + ' ' + s.startTime : r.id) + '</td><td>' + SL.reservationBadge(r.status) + '</td><td>' + SL.parentApprovalBadge(r.parentApprovalStatus) + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="tm-empty">Rezervasyon yok.</p>';
        }
        if (window.TMPermissions && window.TMPermissions.applyPageChrome) {
          window.TMPermissions.applyPageChrome(body);
        }
      }
    });
  }

  function filtered() {
    return U.filterSearch(Store.getParents(), searchInput ? searchInput.value : '', function (p) {
      return p.firstName + ' ' + p.lastName + ' ' + p.phone + ' ' + p.email;
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmParentsLoading');
    var wrap = document.getElementById('tmParentsTableWrap');
    try {
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
    var p = U.paginate(filtered(), page, pageSize);
    if (countEl) countEl.textContent = p.total + ' veli';
    tbody.innerHTML = p.items.map(function (pa) {
      var res = Store.getReservationsForParent(pa.id);
      var active = res.filter(function (r) { return r.status === 'confirmed' || r.status === 'pending'; });
      var lastComm = Store.getCommunicationLogs().find(function (l) { return l.parentId === pa.id; });
      var linkSent = res.some(function (r) { return r.linkSent; });
      var callAgain = res.some(function (r) { return r.parentApprovalStatus === 'call_again'; });
      var approval = active.length ? SL.parentApprovalBadge(active[0].parentApprovalStatus) : '—';
      return '<tr data-id="' + pa.id + '" style="cursor:pointer"><td>' + U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) + '</td>' +
        '<td>' + U.escapeHtml(pa.phone) + '</td><td>' + U.escapeHtml(pa.email) + '</td>' +
        '<td>' + pa.studentIds.length + '</td>' +
        '<td>' + (lastComm ? U.formatDateTime(lastComm.createdAt) : '—') + '</td>' +
        '<td>' + approval + '</td>' +
        '<td>' + (callAgain ? 'Evet' : 'Hayır') + '</td>' +
        '<td>' + (linkSent ? 'Evet' : 'Hayır') + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-detail="' + pa.id + '">Detay</button></td></tr>';
    }).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openDetail(Store.getParentById(btn.getAttribute('data-detail')));
      });
    });
    tbody.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        openDetail(Store.getParentById(tr.getAttribute('data-id')));
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
    Export.exportTable('veliler.csv', filtered(), [{ key: 'firstName', label: 'Ad' }, { key: 'phone', label: 'Telefon' }]);
  });
  if (createBtn) createBtn.addEventListener('click', openCreateParent);
  window.TMOnSessionChange = render;
  render();
  var openId = U.qs('id');
  if (openId) {
    var openPa = Store.getParentById(openId);
    if (openPa) openDetail(openPa);
  }
})();
