/**
 * Rezervasyon talebi — sağ drawer (liste ve operasyon merkezinden)
 */
(function (global) {
  'use strict';

  var Store = (global.TMBridge && global.TMBridge.store()) || global.TMStore;
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

  var STEPS = ['Yeni', 'Atandı', 'Rezervasyon', 'Onay', 'Link'];

  function requestStep(r, res) {
    if (res && res.linkSent) return 5;
    if (res && res.parentApprovalStatus === 'approved') return 4;
    if (res) return 3;
    if (r.status !== 'new') return 2;
    return 1;
  }

  function renderStepper(r, res, rejected) {
    if (rejected) return '<div class="tm-req-status-banner is-rejected">Bu talep reddedildi / iptal edildi.</div>';
    var step = requestStep(r, res);
    return '<div class="tm-req-steps">' + STEPS.map(function (s, i) {
      var n = i + 1;
      var cls = n < step ? ' is-done' : (n === step ? ' is-current' : '');
      return '<span class="tm-req-step' + cls + '"><span class="tm-req-step-dot">' + n + '</span><span class="tm-req-step-label">' + s + '</span></span>';
    }).join('') + '</div>';
  }

  function renderInfo(ctx) {
    var r = ctx.r;
    var lt = ctx.lt;
    var res = ctx.res;
    var sess = ctx.sess;
    var meeting = ctx.meeting;
    var rejected = ctx.rejected;
    // Yönetici "Derse ata"ya bastıysa (status 'new' değil) ve oturum varsa atanmış say.
    var assigned = r.status !== 'new' && !!sess;

    var assignedBox = assigned
      ? '<div class="tm-assigned-box"><span class="tm-assigned-title">Atanan ders</span>' +
          '<span class="tm-assigned-val">' + U.escapeHtml(U.formatDateKey(sess.date) + ' ' + sess.startTime + ' · ' + (lt ? lt.name : '')) + '</span></div>'
      : '<div class="tm-assigned-box is-empty"><span class="tm-assigned-title">Atanan ders</span>' +
          '<span class="tm-assigned-val">Henüz ders atanmadı — “Derse ata” ile öğrenciyi uygun bir derse yerleştirin.' +
          (r.selectedSessionId && sess ? '<br><span class="tm-assigned-pref">Velinin form tercihi: ' + U.escapeHtml(U.formatDateKey(sess.date) + ' ' + sess.startTime) + '</span>' : '') +
          '</span></div>';

    var communicationGroup =
      '<div class="tm-action-group">' +
        '<span class="tm-action-group-label">Veli iletişimi</span>' +
        '<div class="tm-action-group-btns">' +
          (QuickMsg ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmDrawerWa">WhatsApp</button>' : '') +
          (!rejected
            ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmMarkUnreachable" data-tm-require="edit">Ulaşılamadı</button>' +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmMarkCallAgain" data-tm-require="edit">Tekrar aranacak</button>'
            : '') +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmAddComm" data-tm-require="edit">İletişim kaydı ekle</button>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmCopyContact" title="Kişi bilgilerini kopyala">Kişi kartı kopyala</button>' +
        '</div>' +
      '</div>';

    var planningGroup = rejected ? '' :
      '<div class="tm-action-group">' +
        '<span class="tm-action-group-label">Planlama</span>' +
        '<div class="tm-action-group-btns">' +
          (!assigned
            ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmAssignSession" data-tm-require="edit">Derse ata</button>'
            : (!res
                ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmAssignSession" data-tm-require="edit">Dersi değiştir</button>' +
                  '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmCreateRes" data-tm-require="create">Rezervasyon oluştur</button>'
                : (res.parentApprovalStatus !== 'approved' ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmApproveParent" data-tm-require="edit">Veli onayladı</button>' : '') +
                  (!res.linkSent ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmMarkLink" data-tm-require="edit">Link gönderildi</button>' : '') +
                  (res.parentApprovalStatus === 'approved' && res.linkSent ? '<span class="tm-form-desc" style="margin:0">Bu talep tamamlandı ✓</span>' : '')
              )
          ) +
        '</div>' +
        (!assigned ? '<p class="tm-form-desc" style="margin:8px 0 0">Rezervasyon oluşturmak için önce öğrenciyi bir derse atayın.</p>' : '') +
      '</div>';

    var negativeGroup = rejected ? '' :
      '<div class="tm-action-group">' +
        '<span class="tm-action-group-label">Olumsuz</span>' +
        '<div class="tm-action-group-btns">' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--danger" id="tmRejectReq" data-tm-require="cancel">Reddet</button>' +
        '</div>' +
      '</div>';

    return (
      renderStepper(r, res, rejected) +
      '<div class="tm-detail-grid">' +
        detail('Öğrenci', r.studentFirstName + ' ' + r.studentLastName) +
        detail('Yaş / Sınıf', r.studentAge + ' · ' + r.studentGrade) +
        detail('Ders türü', lt ? lt.name : '—') +
        detail('Veli', r.parentFirstName + ' ' + r.parentLastName) +
        detail('Telefon', r.parentPhone) +
        detail('E-posta', r.parentEmail) +
        detail('Veli onay', res ? SL.parentApprovalBadge(res.parentApprovalStatus) : '—') +
        detail('Rezervasyon', res ? SL.reservationBadge(res.status) : '—') +
      '</div>' +
      assignedBox +
      (meeting && res ? '<div class="tm-link-box" style="margin-top:12px"><strong>Online link</strong><br>' + U.escapeHtml(meeting.meetingUrl) + '</div>' : '') +
      '<div class="tm-action-groups">' + communicationGroup + planningGroup + negativeGroup + '</div>'
    );
  }

  function renderComm(ctx) {
    var res = ctx.res;
    var sess = ctx.sess;
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return l.requestId === ctx.r.id || (res && l.reservationId === res.id) || (sess && l.sessionId === sess.id);
    });
    var addBtn = '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmAddCommTab" data-tm-require="edit" style="margin-bottom:12px">Kayıt ekle</button>';
    if (!logs.length) return addBtn + '<p class="tm-empty">İletişim kaydı yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return addBtn + '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function auditUserName(userId) {
    var u = (Store.getUsers ? Store.getUsers() : []).find(function (x) { return x.id === userId; });
    return u ? U.fullName(u.firstName, u.lastName) : 'Sistem';
  }

  function renderAudit(id) {
    var logs = Store.getAuditLogs().filter(function (l) {
      return l.entityType === 'trial_lesson_request' && l.entityId === id;
    }).slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    if (!logs.length) return '<p class="tm-empty">Değişiklik geçmişi yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td>' +
        '<td><span class="tm-audit-who">' + U.escapeHtml(auditUserName(l.createdByUserId)) + '</span></td>' +
        '<td>' + U.escapeHtml(SL.AUDIT_ACTION[l.action] || l.action) + '</td>' +
        '<td>' + U.escapeHtml(l.description) + (l.reason ? '<span class="tm-audit-reason">Neden: ' + U.escapeHtml(l.reason) + '</span>' : '') + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kişi</th><th>İşlem</th><th>Açıklama</th></tr></thead><tbody>' + rows + '</tbody></table>';
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

  // İletişim sonucu (ulaşılamadı / tekrar aranacak) — rezervasyon olmasa da her zaman kaydedilir.
  function recordContact(ctx, result, label) {
    if (!Form || !guard('edit')) return;
    var res = ctx.res;
    Form.open({
      title: label,
      description: 'Görüşme sonucu iletişim geçmişine kaydedilir.',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: Object.keys(SL.COMM_CHANNEL).map(function (k) { return { value: k, label: SL.COMM_CHANNEL[k] }; }), value: 'phone' },
        { type: 'textarea', name: 'summary', label: 'Görüşme notu', rows: 3, required: true },
        { type: 'text', name: 'nextAction', label: 'Sonraki aksiyon', required: false }
      ],
      submitLabel: 'Kaydet',
      onSubmit: function (data) {
        Store.addCommunicationLog({
          channel: data.channel,
          result: result,
          summary: data.summary,
          nextAction: data.nextAction || '',
          requestId: currentId,
          reservationId: res ? res.id : undefined,
          parentId: res ? res.parentId : undefined,
          studentId: res ? res.studentId : undefined
        });
        if (res && Store.updateParentApproval) Store.updateParentApproval(res.id, result);
        U.notifySuccess(label + ' kaydedildi.');
        notifyChange();
        open(currentId, activeTab);
      }
    });
  }

  function recordApproval(ctx) {
    if (!Form || !guard('edit') || !ctx.res) return;
    var res = ctx.res;
    Form.open({
      title: 'Veli onayı',
      description: 'Velinin deneme dersini onayladığını kaydedin.',
      fields: [
        { type: 'textarea', name: 'summary', label: 'Onay notu (opsiyonel)', rows: 2, required: false }
      ],
      submitLabel: 'Onayı kaydet',
      onSubmit: function (data) {
        var result = Store.approveParentForRequest(currentId);
        if (!result.ok) { U.notifyError(result.error); return; }
        Store.addCommunicationLog({
          channel: 'phone',
          result: 'approved',
          summary: data.summary || 'Veli deneme dersini onayladı.',
          requestId: currentId,
          reservationId: res.id,
          parentId: res.parentId,
          studentId: res.studentId
        });
        U.notifySuccess('Veli onayı kaydedildi.');
        notifyChange();
        open(currentId, 0);
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
    if (approveBtn) approveBtn.onclick = function () { recordApproval(ctx); };

    var unreach = body.querySelector('#tmMarkUnreachable');
    if (unreach) unreach.onclick = function () { recordContact(ctx, 'unreachable', 'Ulaşılamadı'); };

    var callAgain = body.querySelector('#tmMarkCallAgain');
    if (callAgain) callAgain.onclick = function () { recordContact(ctx, 'call_again', 'Tekrar aranacak'); };

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

    var copyBtn = body.querySelector('#tmCopyContact');
    if (copyBtn) {
      copyBtn.onclick = function () {
        var approvalLabel = res
          ? (SL.parentApprovalLabel ? SL.parentApprovalLabel(res.parentApprovalStatus) : res.parentApprovalStatus)
          : 'Rezervasyon yok';
        var text = [
          'DENEME DERSİ · İLETİŞİM KARTI',
          'Öğrenci: ' + r.studentFirstName + ' ' + r.studentLastName + ' (' + r.studentGrade + ')',
          'Veli: ' + r.parentFirstName + ' ' + r.parentLastName,
          'Telefon: ' + r.parentPhone,
          'E-posta: ' + r.parentEmail,
          'Ders türü: ' + (ctx.lt ? ctx.lt.name : '—'),
          'Seçilen ders: ' + (sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime : 'Atanmadı'),
          'Durum: ' + approvalLabel,
          'Talep no: ' + r.id
        ].join('\n');
        copyText(text);
      };
    }
  }

  function copyText(text) {
    function ok() { U.notifySuccess('Kişi kartı kopyalandı — WhatsApp/mail ile paylaşabilirsiniz.'); }
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(text).then(ok, function () { legacyCopy(text, ok); });
    } else {
      legacyCopy(text, ok);
    }
  }
  function legacyCopy(text, ok) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      ok();
    } catch (e) {
      U.notifyError('Kopyalanamadı.');
    }
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
