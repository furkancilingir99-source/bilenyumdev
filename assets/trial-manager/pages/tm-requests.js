/**
 * Rezervasyon talepleri listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmRequestsBody');
  var searchInput = document.getElementById('tmRequestsSearch');
  var statusFilter = document.getElementById('tmRequestsStatus');
  var countEl = document.getElementById('tmRequestsCount');
  var paginationEl = document.getElementById('tmRequestsPagination');
  var pageSizeSelect = document.getElementById('tmRequestsPageSize');
  var exportBtn = document.getElementById('tmRequestsExport');
  var simulateBtn = document.getElementById('tmRequestsSimulate');
  var page = 1;

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var items = Store.getRequests();
    items = U.filterSearch(items, q, function (r) {
      return r.studentFirstName + ' ' + r.studentLastName + ' ' + r.parentPhone + ' ' + r.id;
    });
    if (status !== 'all') items = items.filter(function (r) { return r.status === status; });
    return U.sortBy(items, function (r) { return r.createdAt; }, 'desc');
  }

  function sessionLabel(sessionId) {
    if (!sessionId) return '—';
    var s = Store.getSessionById(sessionId);
    if (!s) return sessionId;
    var lt = Store.getLessonTypeById(s.lessonTypeId);
    return U.formatDateKey(s.date) + ' ' + s.startTime + ' · ' + (lt ? lt.name : '');
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmRequestsLoading');
    var wrap = document.getElementById('tmRequestsTableWrap');
    try {
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
    var all = filtered();
    var p = U.paginate(all, page, pageSize);
    if (countEl) countEl.textContent = p.total + ' talep';
    tbody.innerHTML = p.items.map(function (r) {
      var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
      var res = Store.getReservationByRequestId ? Store.getReservationByRequestId(r.id) :
        Store.getReservations().find(function (x) { return x.requestId === r.id; });
      return '<tr data-req="' + r.id + '" style="cursor:pointer">' +
        '<td>' + U.formatDateTime(r.createdAt) + '</td>' +
        '<td>' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + '</td>' +
        '<td>' + r.studentAge + '</td><td>' + U.escapeHtml(r.studentGrade) + '</td><td>' + U.escapeHtml(r.studentLevel) + '</td>' +
        '<td>' + (lt ? lt.name : '—') + '</td>' +
        '<td>' + U.escapeHtml(r.parentFirstName + ' ' + r.parentLastName) + '</td>' +
        '<td>' + U.escapeHtml(r.parentPhone) + '</td>' +
        '<td>' + U.escapeHtml(r.parentEmail) + '</td>' +
        '<td>' + U.escapeHtml(sessionLabel(r.selectedSessionId)) + '</td>' +
        '<td>' + (res ? SL.parentApprovalBadge(res.parentApprovalStatus) : '—') + '</td>' +
        '<td>' + SL.requestBadge(r.status) + '</td>' +
        '<td>' + (res && res.linkSent ? 'Evet' : 'Hayır') + '</td>' +
        '<td><a class="tm-btn tm-btn--sm tm-btn--ghost" href="deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(r.id) + '">İncele</a></td></tr>';
    }).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('tr[data-req]').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(tr.getAttribute('data-req'));
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
  if (statusFilter) statusFilter.addEventListener('change', function () { page = 1; render(); });
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      Export.exportTable('rezervasyon-talepleri.csv', filtered(), [
        { key: 'id', label: 'ID' },
        { key: 'studentFirstName', label: 'Öğrenci Ad' },
        { key: 'studentLastName', label: 'Öğrenci Soyad' },
        { key: 'status', label: 'Durum' }
      ]);
    });
  }
  if (simulateBtn && Store.createSimulatedRequest) {
    simulateBtn.addEventListener('click', function () {
      var res = Store.createSimulatedRequest();
      if (!res.ok) {
        if (U.notifyError) U.notifyError(res.error || 'Talep oluşturulamadı.');
        return;
      }
      page = 1;
      if (window.TMToast) window.TMToast.show('Yeni talep eklendi.', 'success');
      render();
    });
  }
  render();
})();
