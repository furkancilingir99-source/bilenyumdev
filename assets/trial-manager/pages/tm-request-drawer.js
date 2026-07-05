/**
 * Rezervasyon talebi — sağ drawer (liste ve operasyon merkezinden)
 */
(function (global) {
  'use strict';

  var Store = global.TMStore;
  var U = global.TMUtils;
  var SL = global.TMStatusLabels;
  var Drawer = global.TMDetailDrawer;
  var QuickMsg = global.TMQuickMessage;
  var Form = global.TMFormDialog;
  var Confirm = global.TMConfirmDialog;
  var Perms = global.TMPermissions;

  var currentId = null;
  var activeTab = 0;

  function guard(action) {
    return !Perms || Perms.guard(action);
  }

  function notifyChange() {
    if (global.TMOnSessionChange) global.TMOnSessionChange();
  }

  function fullHref(id) {
    return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
  }

  function context(id) {
    var r = Store.getRequestById(id);
    if (!r) return null;
    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    var res = Store.getReservationByRequestId(id);
    var sess = r.selectedSessionId ? Store.getSessionById(r.selectedSessionId) : (res ? Store.getSessionById(res.sessionId) : null);
    var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;
    var rejected = r.status === 'rejected' || r.status === 'cancelled';
    var orphan = Store.isOrphanRequest ? Store.isOrphanRequest(id) : !res;
    return { r: r, lt: lt, res: res, sess: sess, meeting: meeting, rejected: rejected, orphan: orphan };
  }

  function detail(l, v) {
    return '<div><div class="tm-detail-cell-label">' + l + '</div><div class="tm-detail-cell-value">' +
      (String(v).indexOf('<') >= 0 ? v : U.escapeHtml(String(v))) + '</div></div>';
  }

  function renderInfo(ctx) {
    var r = ctx.r;
    var lt = ctx.lt;
    var res = ctx.res;
    var sess = ctx.sess;
    var meeting = ctx.meeting;
    var rejected = ctx.rejected;
    return (
      (ctx.orphan && !rejected ? '<p class="tm-alert-row" style="margin-bottom:12px">Rezervasyon oluşturulmadı — derse atayıp rezervasyon açın.</p>' : '') +
      '<div class="tm-detail-grid">' +
        detail('Öğrenci', r.studentFirstName + ' ' + r.studentLastName) +
        detail('Yaş / Sınıf', r.studentAge + ' · ' + r.studentGrade) +
        detail('Seviye', r.studentLevel) +
        detail('Ders türü', lt ? lt.name : '—') +
        detail('Veli', r.parentFirstName + ' ' + r.parentLastName) +
        detail('Telefon', r.parentPhone) +
        detail('E-posta', r.parentEmail) +
        detail('Talep tarihi', U.formatDateTime(r.createdAt)) +
        detail('Seçilen ders', sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime : '—') +
        detail('Veli onay', res ? SL.parentApprovalBadge(res.parentApprovalStatus) : '—') +
        detail('Rezervasyon', res ? SL.reservationBadge(res.status) : '—') +
        detail('Link gönderildi', res && res.linkSent ? 'Evet' : 'Hayır') +
      '</div>' +
      (meeting ? '<div class="tm-link-box" style="margin-top:12px"><strong>Online link</strong><br>' + U.escapeHtml(meeting.meetingUrl) + '</div>' : '') +
      (rejected ? '<p class="tm-alert-row is-danger" style="margin-top:12px">Talep reddedilmiş veya iptal.</p>' : '') +
      '<div class="tm-detail-actions" style="margin-top:12px;flex-wrap:wrap">' +
        (QuickMsg ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmDrawerWa">WhatsApp</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmAssignSession" data-tm-require="edit">Derse ata</button>' : '') +
        (!ctx.res && r.selectedSessionId && !rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmCreateRes" data-tm-require="create">Rezervasyon oluştur</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmApproveParent" data-tm-require="edit"' + (!res ? ' disabled' : '') + '>Veli onayladı</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmUnreachable" data-tm-require="edit"' + (!res ? ' disabled' : '') + '>Ulaşılamadı</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmCallAgain" data-tm-require="edit"' + (!res ? ' disabled' : '') + '>Tekrar ara</button>' : '') +
        (res && !rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmMarkLink" data-tm-require="edit">Link gönderildi</button>' : '') +
        (!rejected ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--danger" id="tmRejectReq" data-tm-require="cancel">Reddet</button>' : '') +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmAddComm" data-tm-require="edit">İletişim ekle</button>' +
      '</div>'
    );
  }

  function renderComm(ctx) {
    var res = ctx.res;
    var sess = ctx.sess;
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return (res && l.reservationId === res.id) || (sess && l.sessionId === sess.id);
    });
    var addBtn = '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmAddCommTab" data-tm-require="edit" style="margin-bottom:12px">Kayıt ekle</button>';
    if (!logs.length) return addBtn + '<p class="tm-empty">İletişim kaydı yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return addBtn + '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderAudit(id) {
    var logs = Store.getAuditLogs().filter(function (l) {
      return l.entityType === 'trial_lesson_request' && l.entityId === id;
    });
    if (!logs.length) return '<p class="tm-empty">Değişiklik geçmişi yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.AUDIT_ACTION[l.action] || l.action) +
        '</td><td>' + U.escapeHtml(l.description) + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>İşlem</th><th>Açıklama</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function openCommForm(ctx) {
    if (!Form || !guard('edit')) return;
    var r = ctx.r;
    var res = ctx.res;
    var sess = ctx.sess;
    Form.open({
      title: 'İletişim kaydı ekle',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: Object.keys(SL.COMM_CHANNEL).map(function (k) { return { value: k, label: SL.COMM_CHANNEL[k] }; }), value: 'phone' },
        { type: 'select', name: 'result', label: 'Sonuç', options: Object.keys(SL.COMM_RESULT).map(function (k) { return { value: k, label: SL.COMM_RESULT[k] }; }), value: 'message_sent' },
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
        open(currentId, activeTab);
      }
    });
  }

  function openAssignSession(ctx) {
    if (!Form || !guard('edit')) return;
    var r = ctx.r;
    var sessions = Store.getAvailableSessionsForLessonType(r.requestedLessonTypeId);
    if (!sessions.length) {
      U.notifyError('Uygun ders bulunamadı. Önce ders planlayın.');
      return;
    }
    Form.open({
      title: 'Derse ata',
      fields: [{
        type: 'select',
        name: 'sessionId',
        label: 'Ders oturumu',
        value: r.selectedSessionId || '',
        options: sessions.map(function (s) {
          var lt = Store.getLessonTypeById(s.lessonTypeId);
          var rem = global.TMSchedulingRules ? global.TMSchedulingRules.getSessionRemainingCapacity(s.id) : 0;
          return { value: s.id, label: U.formatDateKey(s.date) + ' ' + s.startTime + ' · ' + (lt ? lt.name : '') + ' (boş: ' + rem + ')' };
        })
      }],
      onSubmit: function (data) {
        var result = Store.assignRequestToSession(currentId, data.sessionId);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Talep derse atandı.');
          notifyChange();
          open(currentId, 0);
        }
      }
    });
  }

  function bindActions(ctx, body) {
    var r = ctx.r;
    var res = ctx.res;
    var sess = ctx.sess;
    var meeting = ctx.meeting;
    var rejected = ctx.rejected;

    var waBtn = body.querySelector('#tmDrawerWa');
    if (waBtn && QuickMsg) {
      waBtn.onclick = function () {
        QuickMsg.openForParent({
          parentName: r.parentFirstName + ' ' + r.parentLastName,
          studentName: r.studentFirstName + ' ' + r.studentLastName,
          lessonType: ctx.lt ? ctx.lt.name : 'Deneme dersi',
          date: sess ? U.formatDateKey(sess.date) : '—',
          time: sess ? sess.startTime : '—',
          meetingUrl: meeting ? meeting.meetingUrl : '',
          meetingId: meeting ? meeting.meetingId : '',
          passcode: meeting ? meeting.passcode : '',
          phone: r.parentPhone,
          email: r.parentEmail
        });
      };
    }

    var assignBtn = body.querySelector('#tmAssignSession');
    if (assignBtn && !rejected) assignBtn.onclick = function () { openAssignSession(ctx); };

    var createBtn = body.querySelector('#tmCreateRes');
    if (createBtn) {
      createBtn.onclick = function () {
        if (!guard('create')) return;
        var result = Store.createReservationFromRequest(currentId);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Rezervasyon oluşturuldu.'); notifyChange(); open(currentId, 0); }
      };
    }

    var approveBtn = body.querySelector('#tmApproveParent');
    if (approveBtn) {
      approveBtn.onclick = function () {
        if (!guard('edit') || !res) return;
        var result = Store.approveParentForRequest(currentId);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Veli onayı kaydedildi.'); notifyChange(); open(currentId, 0); }
      };
    }

    var unreach = body.querySelector('#tmUnreachable');
    if (unreach && res) {
      unreach.onclick = function () {
        if (!guard('edit')) return;
        Store.updateParentApproval(res.id, 'unreachable');
        U.notifySuccess('Ulaşılamadı işaretlendi.');
        notifyChange();
        open(currentId, 0);
      };
    }

    var callAgain = body.querySelector('#tmCallAgain');
    if (callAgain && res) {
      callAgain.onclick = function () {
        if (!guard('edit')) return;
        Store.updateParentApproval(res.id, 'call_again');
        U.notifySuccess('Tekrar aranacak işaretlendi.');
        notifyChange();
        open(currentId, 0);
      };
    }

    var linkBtn = body.querySelector('#tmMarkLink');
    if (linkBtn && res) {
      linkBtn.onclick = function () {
        if (!guard('edit')) return;
        var result = Store.markLinkSent(res.id);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Link gönderildi.'); notifyChange(); open(currentId, 0); }
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
            var result = Store.rejectRequest(currentId, reason);
            if (!result.ok) U.notifyError(result.error);
            else { U.notifySuccess('Talep reddedildi.'); notifyChange(); open(currentId, 0); }
          }
        });
      };
    }

    var commBtn = body.querySelector('#tmAddComm') || body.querySelector('#tmAddCommTab');
    if (commBtn) commBtn.onclick = function () { openCommForm(ctx); };
  }

  function renderTab(body, id, tabIndex) {
    var ctx = context(id);
    if (!ctx) {
      body.innerHTML = '<p class="tm-empty">Talep bulunamadı.</p>';
      return;
    }
    if (tabIndex === 1) body.innerHTML = renderComm(ctx);
    else if (tabIndex === 2) body.innerHTML = renderAudit(id);
    else body.innerHTML = renderInfo(ctx);
    bindActions(ctx, body);
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
  }

  function open(id, tab) {
    if (!Store || !Drawer || !id) return;
    currentId = id;
    activeTab = tab || 0;
    var ctx = context(id);
    if (!ctx) return;
    var r = ctx.r;
    Drawer.open({
      title: r.studentFirstName + ' ' + r.studentLastName,
      subtitle: r.id + ' · ' + SL.requestLabel(r.status),
      expandHref: fullHref(id),
      tabs: [{ label: 'Talep bilgisi' }, { label: 'İletişim' }, { label: 'Geçmiş' }],
      activeTab: activeTab,
      onTab: function (idx, body) {
        activeTab = idx;
        renderTab(body, id, idx);
      }
    });
  }

  global.TMRequestDrawer = { open: open };
})(typeof window !== 'undefined' ? window : this);
