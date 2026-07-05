/**
 * Veliler listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Drawer = window.TMDetailDrawer;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmParentsBody');
  var searchInput = document.getElementById('tmParentsSearch');
  var countEl = document.getElementById('tmParentsCount');
  var paginationEl = document.getElementById('tmParentsPagination');
  var pageSizeSelect = document.getElementById('tmParentsPageSize');
  var exportBtn = document.getElementById('tmParentsExport');
  var page = 1;

  function openDetail(pa) {
    if (!Drawer) return;
    var students = pa.studentIds.map(function (id) { return Store.getStudentById(id); }).filter(Boolean);
    var res = Store.getReservationsForParent(pa.id);
    Drawer.open({
      title: U.fullName(pa.firstName, pa.lastName),
      subtitle: pa.phone,
      body: '<div class="tm-detail-grid">' +
        '<div><div class="tm-detail-cell-label">E-posta</div><div class="tm-detail-cell-value">' + U.escapeHtml(pa.email) + '</div></div>' +
        '<div><div class="tm-detail-cell-label">Öğrenciler</div><div class="tm-detail-cell-value">' + students.map(function (s) { return U.escapeHtml(U.fullName(s.firstName, s.lastName)); }).join(', ') + '</div></div></div>' +
        '<h4 style="margin:16px 0 8px;font-size:13px">Rezervasyonlar</h4>' +
        (res.length ? '<table class="tm-inner-table"><tbody>' + res.slice(0, 10).map(function (r) {
          var s = Store.getSessionById(r.sessionId);
          return '<tr><td>' + (s ? U.formatDateKey(s.date) : r.id) + '</td><td>' + r.status + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p class="tm-empty">Rezervasyon yok.</p>')
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
      return '<tr><td>' + U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) + '</td>' +
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
      btn.addEventListener('click', function () { openDetail(Store.getParentById(btn.getAttribute('data-detail'))); });
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
    Export.exportTable('veliler.csv', filtered(), [{ key: 'firstName', label: 'Ad' }, { key: 'phone', label: 'Telefon' }]);
  });
  render();
})();
