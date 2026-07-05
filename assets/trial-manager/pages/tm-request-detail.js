/**
 * Rezervasyon talebi tam sayfa detay — tüm aksiyonlar
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var QuickMsg = window.TMQuickMessage;
  var Form = window.TMFormDialog;
  var Confirm = window.TMConfirmDialog;
  var Perms = window.TMPermissions;
  var id = U.qs('id');
  if (!Store || !id) return;

  function guard(action) {
    return !Perms || Perms.guard(action);
  }

  function notifyChange() {
    if (window.TMOnSessionChange) window.TMOnSessionChange();
  }

  function req() { return Store.getRequestById(id); }

  function paint() {
    var r = req();
    var root = document.getElementById('tmRequestDetail');
    if (!r || !root) {
      if (root) root.innerHTML = '<p class="tm-empty">Talep bulunamadı.</p>';
      return;
    }

    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    var res = Store.getReservationByRequestId(id);
    var sess = r.selectedSessionId ? Store.getSessionById(r.selectedSessionId) : (res ? Store.getSessionById(res.sessionId) : null);
    var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;
    var rejected = r.status === 'rejected' || r.status === 'cancelled';
    var orphan = Store.isOrphanRequest ? Store.isOrphanRequest(id) : !res;

    root.innerHTML =
      '<div class="tm-admin-header">' +
        '<div class="tm-admin-header-main">' +
          '<h1 class="tm-admin-header-title">' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + '</h1>' +
          '<p class="tm-admin-header-meta">' + r.id + ' · ' + SL.requestLabel(r.status) + ' · Talep: ' + U.formatDateTime(r.createdAt) + '</p>' +
        '</div>' +
        '<div class="tm-admin-header-actions">' +
          (QuickMsg ? '<button type="button" class="tm-btn tm-btn--primary" id="tmWaParent">Veliye ulaş (WhatsApp)</button>' : '') +
          '<a class="tm-btn tm-btn--ghost" href="deneme-dersi-yoneticisi-rezervasyonlar.html">← Listeye dön</a>' +
        '</div>' +
      '</div>' +
      (orphan && !rejected ? '<p class="tm-alert-row" style="margin-top:12px">Bu talep için henüz rezervasyon oluşturulmadı. Derse atayıp rezervasyon oluşturun.</p>' : '') +
      '<nav class="tm-drawer-tabs" id="tmReqTabs">' +
        '<button type="button" class="tm-drawer-tab is-active" data-tab="info">Talep bilgisi</button>' +
        '<button type="button" class="tm-drawer-tab" data-tab="comm">İletişim</button>' +
        '<button type="button" class="tm-drawer-tab" data-tab="audit">Geçmiş</button>' +
      '</nav>' +
      '<div class="tm-panel" id="tmReqBody" style="padding:20px;margin-top:12px"></div>';

    var body = document.getElementById('tmReqBody');
    var activeTab = 'info';

    function showTab(tab) {
      activeTab = tab;
      document.getElementById('tmReqTabs').querySelectorAll('.tm-drawer-tab').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-tab') === tab);
      });
      if (tab === 'comm') body.innerHTML = renderComm(res, sess);
      else if (tab === 'audit') body.innerHTML = renderAudit();
      else body.innerHTML = renderInfo(r, lt, res, sess, meeting, rejected);
      bindActions(r, lt, res, sess, meeting, rejected, body);
      if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
    }

    document.getElementById('tmReqTabs').querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { showTab(btn.getAttribute('data-tab')); });
    });

    showTab('info');

    var waBtn = document.getElementById('tmWaParent');
    if (waBtn && QuickMsg) {
      waBtn.addEventListener('click', function () {
        QuickMsg.openForParent({
          parentName: r.parentFirstName + ' ' + r.parentLastName,
          studentName: r.studentFirstName + ' ' + r.studentLastName,
          lessonType: lt ? lt.name : 'Deneme dersi',
          date: sess ? U.formatDateKey(sess.date) : '—',
          time: sess ? sess.startTime : '—',
          meetingUrl: meeting ? meeting.meetingUrl : '',
          meetingId: meeting ? meeting.meetingId : '',
          passcode: meeting ? meeting.passcode : '',
          phone: r.parentPhone,
          email: r.parentEmail
        });
      });
    }
  }

  function renderInfo(r, lt, res, sess, meeting, rejected) {
    return (
      '<div class="tm-detail-grid">' +
        detail('Öğrenci', r.studentFirstName + ' ' + r.studentLastName) +
        detail('Yaş / Sınıf', r.studentAge + ' · ' + r.studentGrade) +
        detail('Seviye', r.studentLevel) +
        detail('Ders türü', lt ? lt.name : '—') +
        detail('Veli', r.parentFirstName + ' ' + r.parentLastName) +
        detail('Telefon', r.parentPhone) +
        detail('E-posta', r.parentEmail) +
        detail('Kaynak', r.source === 'website_form' ? 'Web formu' : r.source) +
        detail('Seçilen ders', sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime + ' (' + sess.id + ')' : '—') +
        detail('Veli onay', res ? SL.parentApprovalBadge(res.parentApprovalStatus) : '—') +
        detail('Rezervasyon', res ? SL.reservationBadge(res.status) : '—') +
        detail('Link gönderildi', res && res.linkSent ? 'Evet · ' + U.formatDateTime(res.linkSentAt) : 'Hayır') +
      '</div>' +
      (meeting ? '<div class="tm-link-box" style="margin-top:16px"><strong>Online link</strong><br>' + U.escapeHtml(meeting.meetingUrl) +
        '<br>ID: ' + meeting.meetingId + ' · Şifre: ' + meeting.passcode + '</div>' : '') +
      (rejected ? '<p class="tm-alert-row is-danger" style="margin-top:16px">Bu talep reddedilmiş veya iptal edilmiştir.</p>' : '') +
      '<div class="tm-detail-actions" style="margin-top:16px;flex-wrap:wrap">' +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmAssignSession" data-tm-require="edit">Derse ata / değiştir</button>' : '') +
        (!res && r.selectedSessionId && !rejected ? '<button type="button" class="tm-btn tm-btn--primary" id="tmCreateRes" data-tm-require="create">Rezervasyon oluştur</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--primary" id="tmApproveParent" data-tm-require="edit"' + (!res ? ' disabled title="Önce rezervasyon oluşturun"' : '') + '>Veli onayladı</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmUnreachable" data-tm-require="edit"' + (!res ? ' disabled' : '') + '>Ulaşılamadı</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmCallAgain" data-tm-require="edit"' + (!res ? ' disabled' : '') + '>Tekrar aranacak</button>' : '') +
        (res && !rejected ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmMarkLink" data-tm-require="edit">Link gönderildi</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--danger" id="tmRejectReq" data-tm-require="cancel">Talebi reddet</button>' : '') +
        '<button type="button" class="tm-btn tm-btn--ghost" id="tmAddComm" data-tm-require="edit">İletişim kaydı ekle</button>' +
      '</div>'
    );
  }

  function renderComm(res, sess) {
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return (res && l.reservationId === res.id) || (sess && l.sessionId === sess.id);
    });
    var addBtn = '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmAddCommTab" data-tm-require="edit" style="margin-bottom:12px">Kayıt ekle</button>';
    if (!logs.length) return addBtn + '<p class="tm-empty">Bu talep için iletişim kaydı yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td><td>' + U.escapeHtml(l.summary) + '</td><td>' + U.escapeHtml(l.nextAction || '—') + '</td></tr>';
    }).join('');
    return addBtn + '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>Sonuç</th><th>Özet</th><th>Sonraki aksiyon</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderAudit() {
    var logs = Store.getAuditLogs().filter(function (l) {
      return l.entityType === 'trial_lesson_request' && l.entityId === id;
    });
    if (!logs.length) return '<p class="tm-empty">Değişiklik geçmişi yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.AUDIT_ACTION[l.action] || l.action) +
        '</td><td>' + U.escapeHtml(l.description) + '</td><td>' + U.escapeHtml(l.reason || '—') + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>İşlem</th><th>Açıklama</th><th>Neden</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function detail(l, v) {
    return '<div><div class="tm-detail-cell-label">' + l + '</div><div class="tm-detail-cell-value">' + (String(v).indexOf('<') >= 0 ? v : U.escapeHtml(String(v))) + '</div></div>';
  }

  function openCommForm(r, res, sess) {
    if (!Form || !guard('edit')) return;
    var channelOpts = Object.keys(SL.COMM_CHANNEL).map(function (k) {
      return { value: k, label: SL.COMM_CHANNEL[k] };
    });
    var resultOpts = Object.keys(SL.COMM_RESULT).map(function (k) {
      return { value: k, label: SL.COMM_RESULT[k] };
    });
    Form.open({
      title: 'İletişim kaydı ekle',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: channelOpts, value: 'phone' },
        { type: 'select', name: 'result', label: 'Sonuç', options: resultOpts, value: 'message_sent' },
        { type: 'textarea', name: 'summary', label: 'Özet', rows: 4, required: true },
        { type: 'text', name: 'nextAction', label: 'Sonraki aksiyon', required: false }
      ],
      onSubmit: function (data) {
        Store.addCommunicationLog({
          summary: data.summary,
          channel: data.channel,
          result: data.result,
          nextAction: data.nextAction || '',
          reservationId: res ? res.id : undefined,
          sessionId: sess ? sess.id : undefined,
          parentId: res ? res.parentId : undefined,
          studentId: res ? res.studentId : undefined
        });
        U.notifySuccess('İletişim kaydı eklendi.');
        notifyChange();
        paint();
      }
    });
  }

  function openAssignSession(r) {
    if (!Form || !guard('edit')) return;
    var sessions = Store.getAvailableSessionsForLessonType(r.requestedLessonTypeId);
    if (!sessions.length) {
      U.notifyError('Uygun ders bulunamadı. Önce ders planlayın.');
      return;
    }
    Form.open({
      title: 'Derse ata',
      description: 'Talebin ders türüne uygun ve kapasitesi olan oturumlar listelenir.',
      fields: [{
        type: 'select',
        name: 'sessionId',
        label: 'Ders oturumu',
        value: r.selectedSessionId || '',
        options: sessions.map(function (s) {
          var lt = Store.getLessonTypeById(s.lessonTypeId);
          var rem = window.TMSchedulingRules ? window.TMSchedulingRules.getSessionRemainingCapacity(s.id) : 0;
          return {
            value: s.id,
            label: U.formatDateKey(s.date) + ' ' + s.startTime + ' · ' + (lt ? lt.name : '') + ' (boş: ' + rem + ')'
          };
        })
      }],
      onSubmit: function (data) {
        var result = Store.assignRequestToSession(id, data.sessionId);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Talep derse atandı.');
          notifyChange();
          paint();
        }
      }
    });
  }

  function bindActions(r, lt, res, sess, meeting, rejected, body) {
    var assignBtn = body.querySelector('#tmAssignSession');
    if (assignBtn && !rejected) assignBtn.onclick = function () { openAssignSession(r); };

    var createBtn = body.querySelector('#tmCreateRes');
    if (createBtn) {
      createBtn.onclick = function () {
        if (!guard('create')) return;
        var result = Store.createReservationFromRequest(id);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Rezervasyon oluşturuldu.');
          notifyChange();
          paint();
        }
      };
    }

    var approveBtn = body.querySelector('#tmApproveParent');
    if (approveBtn) {
      approveBtn.onclick = function () {
        if (!guard('edit')) return;
        if (!res) { U.notifyError('Henüz rezervasyon oluşturulmamış.'); return; }
        var result = Store.approveParentForRequest(id);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Veli onayı kaydedildi.'); notifyChange(); paint(); }
      };
    }

    var unreach = body.querySelector('#tmUnreachable');
    if (unreach && res) {
      unreach.onclick = function () {
        if (!guard('edit')) return;
        Store.updateParentApproval(res.id, 'unreachable');
        U.notifySuccess('Ulaşılamadı olarak işaretlendi.');
        notifyChange();
        paint();
      };
    }

    var callAgain = body.querySelector('#tmCallAgain');
    if (callAgain && res) {
      callAgain.onclick = function () {
        if (!guard('edit')) return;
        Store.updateParentApproval(res.id, 'call_again');
        U.notifySuccess('Tekrar aranacak olarak işaretlendi.');
        notifyChange();
        paint();
      };
    }

    var linkBtn = body.querySelector('#tmMarkLink');
    if (linkBtn && res) {
      linkBtn.onclick = function () {
        if (!guard('edit')) return;
        var result = Store.markLinkSent(res.id);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Link gönderildi işaretlendi.'); notifyChange(); paint(); }
      };
    }

    var rejectBtn = body.querySelector('#tmRejectReq');
    if (rejectBtn && Confirm) {
      rejectBtn.onclick = function () {
        if (!guard('cancel')) return;
        Confirm.open({
          title: 'Talebi reddet',
          warning: 'Bağlı rezervasyon varsa iptal edilecektir.',
          onConfirm: function (reason) {
            var result = Store.rejectRequest(id, reason);
            if (!result.ok) U.notifyError(result.error);
            else { U.notifySuccess('Talep reddedildi.'); notifyChange(); paint(); }
          }
        });
      };
    }

    var commBtn = body.querySelector('#tmAddComm') || body.querySelector('#tmAddCommTab');
    if (commBtn) commBtn.onclick = function () { openCommForm(r, res, sess); };
  }

  paint();
  window.TMOnSessionChange = paint;
})();
