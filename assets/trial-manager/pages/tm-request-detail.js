/**
 * Rezervasyon talebi tam sayfa detay
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var QuickMsg = window.TMQuickMessage;
  var id = U.qs('id');
  if (!Store || !id) return;

  var req = Store.getRequestById(id);
  var root = document.getElementById('tmRequestDetail');
  if (!req || !root) {
    if (root) root.innerHTML = '<p class="tm-empty">Talep bulunamadı.</p>';
    return;
  }

  function paint() {
    var lt = Store.getLessonTypeById(req.requestedLessonTypeId);
    var res = Store.getReservationByRequestId ? Store.getReservationByRequestId(id) :
      Store.getReservations().find(function (r) { return r.requestId === id; });
    var sess = req.selectedSessionId ? Store.getSessionById(req.selectedSessionId) : (res ? Store.getSessionById(res.sessionId) : null);
    var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;

    root.innerHTML =
      '<div class="tm-admin-header">' +
        '<div class="tm-admin-header-main">' +
          '<h1 class="tm-admin-header-title">' + U.escapeHtml(req.studentFirstName + ' ' + req.studentLastName) + '</h1>' +
          '<p class="tm-admin-header-meta">' + req.id + ' · ' + SL.requestLabel(req.status) + '</p>' +
        '</div>' +
        '<div class="tm-admin-header-actions">' +
          (meeting ? '<button type="button" class="tm-btn tm-btn--primary" id="tmWaParent">Veliye WhatsApp</button>' : '') +
          '<a class="tm-btn tm-btn--ghost" href="deneme-dersi-yoneticisi-rezervasyonlar.html">← Listeye dön</a>' +
        '</div>' +
      '</div>' +
      '<nav class="tm-drawer-tabs" id="tmReqTabs">' +
        '<button type="button" class="tm-drawer-tab is-active" data-tab="info">Talep bilgisi</button>' +
        '<button type="button" class="tm-drawer-tab" data-tab="comm">İletişim</button>' +
      '</nav>' +
      '<div class="tm-panel" id="tmReqBody" style="padding:20px;margin-top:12px"></div>';

    var body = document.getElementById('tmReqBody');
    body.innerHTML = renderInfo(req, lt, res, sess, meeting);

    document.getElementById('tmReqTabs').querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('tmReqTabs').querySelectorAll('.tm-drawer-tab').forEach(function (b) {
          b.classList.remove('is-active');
        });
        btn.classList.add('is-active');
        var tab = btn.getAttribute('data-tab');
        if (tab === 'comm') body.innerHTML = renderComm(req, res, sess);
        else body.innerHTML = renderInfo(req, lt, res, sess, meeting);
        bindActions(req, res, sess, meeting, body);
      });
    });

    bindActions(req, res, sess, meeting, body);

    var waBtn = document.getElementById('tmWaParent');
    if (waBtn && meeting && QuickMsg) {
      waBtn.addEventListener('click', function () {
        QuickMsg.openForParent({
          parentName: req.parentFirstName + ' ' + req.parentLastName,
          studentName: req.studentFirstName + ' ' + req.studentLastName,
          lessonType: lt ? lt.name : '—',
          date: sess ? U.formatDateKey(sess.date) : '—',
          time: sess ? sess.startTime : '—',
          meetingUrl: meeting.meetingUrl,
          meetingId: meeting.meetingId,
          passcode: meeting.passcode,
          phone: req.parentPhone,
          email: req.parentEmail
        });
      });
    }
  }

  function renderInfo(req, lt, res, sess, meeting) {
    return (
      '<div class="tm-detail-grid">' +
        detail('Öğrenci', req.studentFirstName + ' ' + req.studentLastName) +
        detail('Yaş / Sınıf', req.studentAge + ' · ' + req.studentGrade) +
        detail('Seviye', req.studentLevel) +
        detail('Ders türü', lt ? lt.name : '—') +
        detail('Veli', req.parentFirstName + ' ' + req.parentLastName) +
        detail('Telefon', req.parentPhone) +
        detail('E-posta', req.parentEmail) +
        detail('Seçilen ders', sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime : '—') +
        detail('Veli onay', res ? SL.parentApprovalLabel(res.parentApprovalStatus) : '—') +
        detail('Link gönderildi', res && res.linkSent ? 'Evet' : 'Hayır') +
      '</div>' +
      (meeting ? '<div class="tm-link-box" style="margin-top:16px"><strong>Online link</strong><br>' + U.escapeHtml(meeting.meetingUrl) + '<br>ID: ' + meeting.meetingId + ' · Şifre: ' + meeting.passcode + '</div>' : '') +
      '<div class="tm-detail-actions" style="margin-top:16px">' +
        (!res && req.selectedSessionId ? '<button type="button" class="tm-btn tm-btn--primary" id="tmCreateRes">Rezervasyon oluştur</button>' : '') +
        '<button type="button" class="tm-btn tm-btn--primary" id="tmApproveParent"' + (!res ? ' disabled title="Önce rezervasyon oluşturun"' : '') + '>Veli onayladı</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost" id="tmUnreachable">Ulaşılamadı</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost" id="tmCallAgain">Tekrar aranacak</button>' +
        (res ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmMarkLink">Link gönderildi</button>' : '') +
      '</div>'
    );
  }

  function renderComm(req, res, sess) {
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return l.reservationId === (res && res.id) || (sess && l.sessionId === sess.id);
    });
    if (!logs.length) return '<p class="tm-empty">Bu talep için iletişim kaydı yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>Sonuç</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function detail(l, v) {
    return '<div><div class="tm-detail-cell-label">' + l + '</div><div class="tm-detail-cell-value">' + U.escapeHtml(String(v)) + '</div></div>';
  }

  function bindActions(req, res, sess, meeting, body) {
    var createBtn = body.querySelector('#tmCreateRes');
    if (createBtn) {
      createBtn.onclick = function () {
        var r = Store.createReservationFromRequest(id);
        if (!r.ok) alert(r.error);
        else paint();
      };
    }
    var approveBtn = body.querySelector('#tmApproveParent') || document.getElementById('tmApproveParent');
    if (approveBtn) {
      approveBtn.onclick = function () {
        if (!res) { alert('Henüz rezervasyon oluşturulmamış.'); return; }
        var r = Store.approveParentForRequest(id);
        if (!r.ok) alert(r.error);
        else paint();
      };
    }
    var unreach = body.querySelector('#tmUnreachable');
    if (unreach && res) {
      unreach.onclick = function () {
        Store.updateParentApproval(res.id, 'unreachable');
        paint();
      };
    }
    var callAgain = body.querySelector('#tmCallAgain');
    if (callAgain && res) {
      callAgain.onclick = function () {
        Store.updateParentApproval(res.id, 'call_again');
        paint();
      };
    }
    var linkBtn = body.querySelector('#tmMarkLink');
    if (linkBtn && res) {
      linkBtn.onclick = function () {
        var r = Store.markLinkSent(res.id);
        if (!r.ok) alert(r.error);
        else paint();
      };
    }
  }

  paint();
})();
