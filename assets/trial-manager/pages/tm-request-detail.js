/**
 * Rezervasyon talebi tam sayfa detay
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var id = U.qs('id');
  if (!Store || !id) return;

  var req = Store.getRequestById(id);
  var root = document.getElementById('tmRequestDetail');
  if (!req || !root) {
    if (root) root.innerHTML = '<p class="tm-empty">Talep bulunamadı.</p>';
    return;
  }

  var lt = Store.getLessonTypeById(req.requestedLessonTypeId);
  var res = Store.getReservations().find(function (r) { return r.requestId === id; });
  var sess = req.selectedSessionId ? Store.getSessionById(req.selectedSessionId) : null;
  var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;

  root.innerHTML =
    '<div class="tm-admin-header">' +
      '<div class="tm-admin-header-main">' +
        '<h1 class="tm-admin-header-title">' + U.escapeHtml(req.studentFirstName + ' ' + req.studentLastName) + '</h1>' +
        '<p class="tm-admin-header-meta">' + req.id + ' · ' + SL.requestLabel(req.status) + '</p>' +
      '</div>' +
      '<a class="tm-btn tm-btn--ghost" href="deneme-dersi-yoneticisi-rezervasyonlar.html">← Listeye dön</a>' +
    '</div>' +
    '<div class="tm-panel" style="padding:20px;margin-top:12px">' +
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
        '<button type="button" class="tm-btn tm-btn--primary" id="tmApproveParent">Veli onayladı</button>' +
        (res ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmMarkLink">Link gönderildi</button>' : '') +
      '</div>' +
    '</div>';

  function detail(l, v) {
    return '<div><div class="tm-detail-cell-label">' + l + '</div><div class="tm-detail-cell-value">' + U.escapeHtml(String(v)) + '</div></div>';
  }

  document.getElementById('tmApproveParent').addEventListener('click', function () {
    if (!res) { alert('Henüz rezervasyon oluşturulmamış.'); return; }
    res.parentApprovalStatus = 'approved';
    res.status = 'confirmed';
    location.reload();
  });
  var linkBtn = document.getElementById('tmMarkLink');
  if (linkBtn) {
    linkBtn.addEventListener('click', function () {
      var r = Store.markLinkSent(res.id);
      if (!r.ok) alert(r.error);
      else location.reload();
    });
  }
})();
