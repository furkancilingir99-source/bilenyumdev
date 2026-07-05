/**
 * Rezervasyon talepleri listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Perms = window.TMPermissions;
  var RequestDrawer = window.TMRequestDrawer;
  if (!Store) return;

  var tbody = document.getElementById('tmRequestsBody');
  var cardsEl = document.getElementById('tmRequestsCards');
  var searchInput = document.getElementById('tmRequestsSearch');
  var statusFilter = document.getElementById('tmRequestsStatus');
  var countEl = document.getElementById('tmRequestsCount');
  var paginationEl = document.getElementById('tmRequestsPagination');
  var pageSizeSelect = document.getElementById('tmRequestsPageSize');
  var exportBtn = document.getElementById('tmRequestsExport');
  var simulateBtn = document.getElementById('tmRequestsSimulate');
  var page = 1;

  function isOrphan(r) {
    return Store.isOrphanRequest ? Store.isOrphanRequest(r.id) : !Store.getReservationByRequestId(r.id);
  }

  function initFromUrl() {
    var filter = U.qs('filter');
    if (filter === 'orphan' && statusFilter) statusFilter.value = 'orphan';
    var status = U.qs('status');
    if (status && statusFilter && statusFilter.querySelector('option[value="' + status + '"]')) {
      statusFilter.value = status;
    }
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var items = Store.getRequests();
    items = U.filterSearch(items, q, function (r) {
      return r.studentFirstName + ' ' + r.studentLastName + ' ' + r.parentPhone + ' ' + r.id;
    });
    if (status === 'orphan') items = items.filter(isOrphan);
    else if (status !== 'all') items = items.filter(function (r) { return r.status === status; });
    return U.sortBy(items, function (r) { return r.createdAt; }, 'desc');
  }

  function sessionLabel(sessionId) {
    if (!sessionId) return '—';
    var s = Store.getSessionById(sessionId);
    if (!s) return sessionId;
    var lt = Store.getLessonTypeById(s.lessonTypeId);
    return U.formatDateKey(s.date) + ' ' + s.startTime + ' · ' + (lt ? lt.name : '');
  }

  function notifyChange() {
    if (window.TMOnSessionChange) window.TMOnSessionChange();
  }

  function rowHtml(r) {
    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    var res = Store.getReservationByRequestId(r.id);
    var orphan = isOrphan(r);
    var orphanBadge = orphan ? ' <span class="tm-badge tm-badge--orange">Rezervasyonsuz</span>' : '';
    return '<tr data-req="' + r.id + '" style="cursor:pointer">' +
      '<td>' + U.formatDateTime(r.createdAt) + '</td>' +
      '<td>' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + orphanBadge + '</td>' +
      '<td>' + r.studentAge + '</td><td>' + U.escapeHtml(r.studentGrade) + '</td><td>' + U.escapeHtml(r.studentLevel) + '</td>' +
      '<td>' + (lt ? lt.name : '—') + '</td>' +
      '<td>' + U.escapeHtml(r.parentFirstName + ' ' + r.parentLastName) + '</td>' +
      '<td>' + U.escapeHtml(r.parentPhone) + '</td>' +
      '<td>' + U.escapeHtml(r.parentEmail) + '</td>' +
      '<td>' + U.escapeHtml(sessionLabel(r.selectedSessionId)) + '</td>' +
      '<td>' + (res ? SL.parentApprovalBadge(res.parentApprovalStatus) : '—') + '</td>' +
      '<td>' + SL.requestBadge(r.status) + '</td>' +
      '<td>' + (res && res.linkSent ? 'Evet' : 'Hayır') + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-open-drawer="' + r.id + '">İncele</button> ' +
        '<a class="tm-btn tm-btn--sm tm-btn--ghost" href="deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(r.id) + '" title="Tam sayfa detay">Tam sayfa</a>' +
      '</td></tr>';
  }

  function cardHtml(r) {
    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    var res = Store.getReservationByRequestId(r.id);
    var orphan = isOrphan(r);
    return '<article class="tm-list-card" data-req="' + r.id + '">' +
      '<div class="tm-list-card-head">' +
        '<div><strong>' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + '</strong></div>' +
        SL.requestBadge(r.status) +
      '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Talep</span> ' + U.formatDateTime(r.createdAt) + '</div>' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(lt ? lt.name : '—') + ' · ' + U.escapeHtml(r.studentGrade) + '</div>' +
        '<div><span class="tm-list-card-label">Veli</span> ' + U.escapeHtml(r.parentFirstName + ' ' + r.parentLastName) + '</div>' +
        '<div><span class="tm-list-card-label">Telefon</span> ' + U.escapeHtml(r.parentPhone) + '</div>' +
        (orphan ? '<div><span class="tm-badge tm-badge--orange">Rezervasyonsuz</span></div>' : '') +
        (res ? '<div><span class="tm-list-card-label">Onay</span> ' + SL.parentApprovalLabel(res.parentApprovalStatus) + '</div>' : '') +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-open-drawer="' + r.id + '">İncele</button>' +
      '</div></article>';
  }

  function bindRowActions() {
    var openDrawer = function (rid) {
      if (RequestDrawer) RequestDrawer.open(rid);
      else window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(rid);
    };
    [tbody, cardsEl].forEach(function (root) {
      if (!root) return;
      root.querySelectorAll('tr[data-req], .tm-list-card[data-req]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('a, button')) return;
          openDrawer(el.getAttribute('data-req'));
        });
      });
      root.querySelectorAll('[data-open-drawer]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openDrawer(btn.getAttribute('data-open-drawer'));
        });
      });
    });
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
    tbody.innerHTML = p.items.map(rowHtml).join('');
    if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    bindRowActions();
    if (loading) loading.hidden = true;
    if (wrap) wrap.hidden = false;
    if (cardsEl) cardsEl.hidden = false;
    if (paginationEl) paginationEl.hidden = p.pages <= 1;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  initFromUrl();

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (statusFilter) statusFilter.addEventListener('change', function () { page = 1; render(); });
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('export')) return;
      Export.exportTable('rezervasyon-talepleri.csv', filtered(), [
        { key: 'id', label: 'ID' },
        { key: 'studentFirstName', label: 'Öğrenci Ad' },
        { key: 'studentLastName', label: 'Öğrenci Soyad' },
        { key: 'parentPhone', label: 'Telefon' },
        { key: 'status', label: 'Durum' },
        { key: 'orphan', label: 'Rezervasyonsuz', value: function (r) { return isOrphan(r) ? 'Evet' : 'Hayır'; } }
      ]);
    });
  }
  if (simulateBtn && window.TMSimulateRequest) {
    simulateBtn.addEventListener('click', function () {
      window.TMSimulateRequest.open({
        onSuccess: function (res) {
          page = 1;
          notifyChange();
          render();
          if (RequestDrawer && res && res.request) RequestDrawer.open(res.request.id);
        }
      });
    });
  }
  render();
  var openId = U.qs('id');
  if (openId && RequestDrawer) RequestDrawer.open(openId);
  window.TMOnSessionChange = render;
})();
