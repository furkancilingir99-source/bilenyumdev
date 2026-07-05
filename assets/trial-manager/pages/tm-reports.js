/**
 * Raporlar
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var startInput = document.getElementById('tmReportStart');
  var endInput = document.getElementById('tmReportEnd');
  var gridEl = document.getElementById('tmReportGrid');
  var exportBtn = document.getElementById('tmReportExport');

  function defaultDates() {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - 30);
    if (startInput) startInput.value = start.toISOString().slice(0, 10);
    if (endInput) endInput.value = end.toISOString().slice(0, 10);
  }

  function inRange(dateKey) {
    var s = startInput ? startInput.value : '';
    var e = endInput ? endInput.value : '';
    if (!s || !e) return true;
    return dateKey >= s && dateKey <= e;
  }

  function compute() {
    var sessions = Store.getSessions().filter(function (s) { return inRange(s.date); });
    var reservations = Store.getReservations().filter(function (r) {
      var s = Store.getSessionById(r.sessionId);
      return s && inRange(s.date);
    });
    var requests = Store.getRequests().filter(function (r) { return inRange(r.createdAt.slice(0, 10)); });
    var attended = reservations.filter(function (r) { return r.status === 'attended'; }).length;
    var noShow = reservations.filter(function (r) { return r.status === 'no_show'; }).length;
    var enrolled = reservations.filter(function (r) { return r.enrolled; }).length;
    var cancelled = reservations.filter(function (r) { return r.status === 'cancelled'; }).length;
    var confirmed = reservations.filter(function (r) { return r.status === 'confirmed' || r.status === 'attended'; }).length;
    var linkSent = reservations.filter(function (r) { return r.linkSent; }).length;
    var approved = reservations.filter(function (r) { return r.parentApprovalStatus === 'approved'; }).length;
    var matReq = requests.filter(function (r) { return r.requestedLessonTypeId === 'lt-mat'; }).length;
    var fenReq = requests.filter(function (r) { return r.requestedLessonTypeId === 'lt-fen'; }).length;
    var totalRes = reservations.length || 1;
    return {
      sessionCount: sessions.length,
      requestCount: requests.length,
      confirmed: confirmed,
      cancelled: cancelled,
      attendanceRate: Math.round((attended / totalRes) * 100),
      noShowRate: Math.round((noShow / totalRes) * 100),
      conversionRate: Math.round((enrolled / totalRes) * 100),
      matReq: matReq,
      fenReq: fenReq,
      linkSentRate: Math.round((linkSent / totalRes) * 100),
      approvalRate: Math.round((approved / totalRes) * 100),
      unreachable: reservations.filter(function (r) { return r.parentApprovalStatus === 'unreachable'; }).length,
      callAgain: reservations.filter(function (r) { return r.parentApprovalStatus === 'call_again'; }).length
    };
  }

  function card(value, label) {
    return '<div class="tm-report-card"><div class="tm-report-card-value">' + value + '</div><div class="tm-report-card-label">' + U.escapeHtml(label) + '</div></div>';
  }

  function render() {
    if (!gridEl) return;
    var m = compute();
    gridEl.innerHTML =
      card(m.sessionCount, 'Toplam deneme dersi') +
      card(m.requestCount, 'Rezervasyon talebi') +
      card(m.confirmed, 'Onaylanan rezervasyon') +
      card(m.cancelled, 'İptal edilen') +
      card(m.attendanceRate + '%', 'Katılım oranı') +
      card(m.noShowRate + '%', 'Gelmeme oranı') +
      card(m.conversionRate + '%', 'Kayıta dönüşüm') +
      card(m.matReq + ' / ' + m.fenReq, 'Mat / Fen talep') +
      card(m.linkSentRate + '%', 'Link gönderim oranı') +
      card(m.approvalRate + '%', 'Veli onay oranı') +
      card(m.unreachable, 'Ulaşılamayan veli') +
      card(m.callAgain, 'Tekrar aranacak');
  }

  defaultDates();
  render();
  if (startInput) startInput.addEventListener('change', render);
  if (endInput) endInput.addEventListener('change', render);
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      var m = compute();
      Export.exportTable('rapor-ozet.csv', [m], [
        { key: 'sessionCount', label: 'Ders sayısı' },
        { key: 'requestCount', label: 'Talep sayısı' },
        { key: 'conversionRate', label: 'Dönüşüm %' }
      ]);
    });
  }
})();
