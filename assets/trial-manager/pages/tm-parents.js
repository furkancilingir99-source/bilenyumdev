/**
 * Veli iletişim ve başvuru takibi
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
  var page = 1;

  function activeReservation(pa) {
    return Store.getReservationsForParent(pa.id).find(function (r) {
      return r.status === 'confirmed' || r.status === 'pending';
    }) || Store.getReservationsForParent(pa.id)[0] || null;
  }

  function openParentWhatsApp(pa) {
    if (!QuickMsg || !pa) return;
    var res = activeReservation(pa);
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

  function setParentApproval(pa, status) {
    if (!Perms.guard('edit')) return;
    var res = activeReservation(pa);
    if (!res) {
      U.notifyError('Aktif rezervasyon bulunamadı.');
      return;
    }
    var result = Store.updateParentApproval(res.id, status);
    if (!result.ok) U.notifyError(result.error);
    else {
      U.notifySuccess('Veli onay durumu güncellendi.');
      if (window.TMOnSessionChange) window.TMOnSessionChange();
      openDetail(Store.getParentById(pa.id) || pa);
      render();
    }
  }

  function markLinkSent(pa) {
    if (!Perms.guard('edit')) return;
    var res = activeReservation(pa);
    if (!res) {
      U.notifyError('Aktif rezervasyon bulunamadı.');
      return;
    }
    if (res.parentApprovalStatus !== 'approved') {
      U.notifyError('Link işaretlemek için veli onayı gerekir.');
      return;
    }
    var result = Store.markLinkSent(res.id);
    if (!result.ok) U.notifyError(result.error);
    else {
      U.notifySuccess('Link gönderildi işaretlendi.');
      if (window.TMOnSessionChange) window.TMOnSessionChange();
      openDetail(Store.getParentById(pa.id) || pa);
      render();
    }
  }

  function openCorrectContact(pa) {
    if (!Form || !Perms.guard('editApplicationContact')) return;
    var pref = (pa.preferredChannels && pa.preferredChannels[0]) || 'phone';
    Form.open({
      title: 'Başvuru iletişim bilgisini düzelt',
      description: 'Veli ad/soyad değiştirilemez. Yalnızca başvuru kaynaklı iletişim bilgileri düzeltilebilir ve denetim günlüğüne yazılır.',
      fields: [
        { type: 'text', name: 'phone', label: 'Telefon', value: pa.phone, required: true },
        { type: 'text', name: 'email', label: 'E-posta', value: pa.email },
        {
          type: 'select',
          name: 'preferredChannel',
          label: 'Tercih edilen iletişim kanalı',
          value: pref,
          options: [
            { value: 'phone', label: 'Telefon' },
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'sms', label: 'SMS' },
            { value: 'email', label: 'E-posta' }
          ]
        },
        { type: 'textarea', name: 'notes', label: 'İletişim notu', value: pa.notes || '', rows: 3 }
      ],
      onSubmit: function (data) {
        var result = Store.updateApplicationContactInfo(pa.id, data);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Başvuru iletişim bilgisi güncellendi.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          openDetail(result.parent);
          render();
        }
      }
    });
  }

  function openDetail(pa) {
    if (!Drawer) return;
    var parent = Store.getParentById(pa.id) || pa;
    var students = parent.studentIds.map(function (id) { return Store.getStudentById(id); }).filter(Boolean);
    var res = Store.getReservationsForParent(parent.id);
    Drawer.open({
      title: U.fullName(parent.firstName, parent.lastName),
      subtitle: parent.phone,
      tabs: [{ label: 'İletişim' }, { label: 'Rezervasyonlar' }, { label: 'İletişim geçmişi' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          body.innerHTML =
            '<p class="tm-source-notice">' + SL.dataSourceBadge(parent.source || 'trial_lesson_application') + '</p>' +
            '<div class="tm-detail-actions tm-detail-actions--wrap" style="margin-bottom:12px">' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-parent>WhatsApp</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-correct-contact data-tm-require="edit-application-contact">Başvuru bilgisini düzelt</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-approve data-tm-require="edit">Onayladı</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-reject data-tm-require="edit">Reddetti</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-call-again data-tm-require="edit">Tekrar aranacak</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-unreachable data-tm-require="edit">Ulaşılamadı</button> ' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-link-sent data-tm-require="edit">Link gönderildi</button>' +
            '</div>' +
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Ad soyad</div><div class="tm-detail-cell-value">' + U.escapeHtml(U.fullName(parent.firstName, parent.lastName)) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Telefon</div><div class="tm-detail-cell-value">' + U.escapeHtml(parent.phone) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">E-posta</div><div class="tm-detail-cell-value">' + U.escapeHtml(parent.email) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Tercih edilen kanal</div><div class="tm-detail-cell-value">' + ((parent.preferredChannels || []).map(function (c) { return SL.COMM_CHANNEL[c] || c; }).join(', ') || '—') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Öğrenciler</div><div class="tm-detail-cell-value">' + students.map(function (s) { return U.escapeHtml(U.fullName(s.firstName, s.lastName)); }).join(', ') + '</div></div>' +
            (parent.notes ? '<div><div class="tm-detail-cell-label">İletişim notu</div><div class="tm-detail-cell-value">' + U.escapeHtml(parent.notes) + '</div></div>' : '') +
            '</div>';
          body.querySelector('[data-wa-parent]').addEventListener('click', function () { openParentWhatsApp(parent); });
          body.querySelector('[data-correct-contact]') && body.querySelector('[data-correct-contact]').addEventListener('click', function () {
            openCorrectContact(Store.getParentById(parent.id) || parent);
          });
          body.querySelector('[data-approve]') && body.querySelector('[data-approve]').addEventListener('click', function () { setParentApproval(parent, 'approved'); });
          body.querySelector('[data-reject]') && body.querySelector('[data-reject]').addEventListener('click', function () { setParentApproval(parent, 'rejected'); });
          body.querySelector('[data-call-again]') && body.querySelector('[data-call-again]').addEventListener('click', function () { setParentApproval(parent, 'call_again'); });
          body.querySelector('[data-unreachable]') && body.querySelector('[data-unreachable]').addEventListener('click', function () { setParentApproval(parent, 'unreachable'); });
          body.querySelector('[data-link-sent]') && body.querySelector('[data-link-sent]').addEventListener('click', function () { markLinkSent(parent); });
        } else if (idx === 1) {
          body.innerHTML = res.length ? '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Durum</th><th>Onay</th><th>Link</th></tr></thead><tbody>' + res.slice(0, 10).map(function (r) {
            var s = Store.getSessionById(r.sessionId);
            return '<tr><td>' + (s ? U.formatDateKey(s.date) + ' ' + s.startTime : r.id) + '</td><td>' + SL.reservationBadge(r.status) + '</td><td>' + SL.parentApprovalBadge(r.parentApprovalStatus) + '</td><td>' + (r.linkSent ? 'Evet' : 'Hayır') + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="tm-empty">Rezervasyon yok.</p>';
        } else {
          var logs = Store.getCommunicationLogs().filter(function (l) { return l.parentId === parent.id; });
          body.innerHTML = logs.length ? logs.map(function (l) {
            return '<p style="font-size:13px;margin:6px 0">' + U.formatDateTime(l.createdAt) + ' — ' + U.escapeHtml(l.summary) + '</p>';
          }).join('') : '<p class="tm-empty">İletişim kaydı yok.</p>';
        }
        if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
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
    if (Perms && !Perms.guard('export')) return;
    Export.exportTable('veliler.csv', filtered(), [{ key: 'firstName', label: 'Ad' }, { key: 'phone', label: 'Telefon' }]);
  });
  window.TMOnSessionChange = render;
  render();
  var openId = U.qs('id');
  if (openId) {
    var openPa = Store.getParentById(openId);
    if (openPa) openDetail(openPa);
  }
})();
