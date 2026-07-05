(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  if (!Mock) return;

  var kpiGrid = document.getElementById('tmKpiGrid');
  var recentWrap = document.getElementById('tmRecentWrap');
  var loading = document.getElementById('tmDashLoading');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function statusClass(status) {
    return 'is-' + status;
  }

  function renderKpis(stats) {
    if (!kpiGrid) return;
    kpiGrid.innerHTML =
      '<div class="tm-kpi-card is-today">' +
        '<span class="tm-kpi-label">Bugünkü Dersler</span>' +
        '<span class="tm-kpi-value">' + stats.today + '</span>' +
      '</div>' +
      '<div class="tm-kpi-card is-pending">' +
        '<span class="tm-kpi-label">Onay Bekleyen</span>' +
        '<span class="tm-kpi-value">' + stats.pending + '</span>' +
      '</div>' +
      '<div class="tm-kpi-card is-confirmed">' +
        '<span class="tm-kpi-label">Onaylanmış</span>' +
        '<span class="tm-kpi-value">' + stats.confirmed + '</span>' +
      '</div>' +
      '<div class="tm-kpi-card">' +
        '<span class="tm-kpi-label">Toplam Rezervasyon</span>' +
        '<span class="tm-kpi-value">' + stats.total + '</span>' +
      '</div>';
  }

  function renderRecent(rows) {
    if (!recentWrap) return;
    var recent = rows.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }).slice(0, 5);

    var body = recent.map(function (r) {
      var student = r.studentFirstName + ' ' + r.studentLastName;
      var parent = r.parentFirstName + ' ' + r.parentLastName;
      return (
        '<tr>' +
          '<td><div class="tm-cell-name"><strong>' + escapeHtml(student) + '</strong><small>' + escapeHtml(r.grade) + ' · ' + escapeHtml(r.subject) + '</small></div></td>' +
          '<td><div class="tm-cell-name"><strong>' + escapeHtml(parent) + '</strong><small>' + escapeHtml(r.phone) + '</small></div></td>' +
          '<td>' + escapeHtml(r.slotLabel) + '</td>' +
          '<td><span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></td>' +
        '</tr>'
      );
    }).join('');

    recentWrap.innerHTML =
      '<div class="tm-res-table-wrap">' +
        '<table class="tm-res-table">' +
          '<thead><tr>' +
            '<th>Öğrenci</th><th>Veli</th><th>Tarih / Saat</th><th>Durum</th>' +
          '</tr></thead>' +
          '<tbody>' + body + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function init() {
    var stats = Mock.getStats();
    var rows = Mock.getReservations();
    renderKpis(stats);
    renderRecent(rows);
    if (loading) loading.hidden = true;
    if (kpiGrid) kpiGrid.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
