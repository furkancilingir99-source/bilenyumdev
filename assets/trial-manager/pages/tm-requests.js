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
  var Confirm = window.TMConfirmDialog;
  if (!Store) return;

  var tbody = document.getElementById('tmRequestsBody');
  var cardsEl = document.getElementById('tmRequestsCards');
  var searchInput = document.getElementById('tmRequestsSearch');
  var statusFilter = document.getElementById('tmRequestsStatus');
  var contactFilter = document.getElementById('tmRequestsContact');
  var assignmentFilter = document.getElementById('tmRequestsAssignment');
  var reservationStatusFilter = document.getElementById('tmRequestsReservationStatus');
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
    var contact = contactFilter ? contactFilter.value : 'all';
    var assignment = assignmentFilter ? assignmentFilter.value : 'all';
    var resStatus = reservationStatusFilter ? reservationStatusFilter.value : 'all';
    var items = Store.getRequests();
    items = U.filterSearch(items, q, function (r) {
      // Ada, telefona, talep id'sine ek olarak Rezervasyon ID (rT-…) ve Ders ID
      // (tL-…) ile de aranabilsin; diğer ekranlardan kopyalanan kodlar bulunsun.
      var lessonCode = (r.selectedSessionId && Store.getLessonCode) ? Store.getLessonCode(r.selectedSessionId) : '';
      return r.studentFirstName + ' ' + r.studentLastName +
        ' ' + (r.parentFirstName || '') + ' ' + (r.parentLastName || '') +
        ' ' + (r.parentPhone || '') + ' ' + (r.parentEmail || '') + ' ' + r.id +
        ' ' + resCode(r) + ' ' + lessonCode;
    });
    if (status === 'orphan') items = items.filter(isOrphan);
    else if (status !== 'all') items = items.filter(function (r) { return r.status === status; });
    // İletişim Bilgisi filtresi
    if (contact === 'none') items = items.filter(function (r) { return !r.contactStatus; });
    else if (contact !== 'all') items = items.filter(function (r) { return r.contactStatus === contact; });
    // Ders Ataması durumu filtresi
    if (assignment === 'assigned') items = items.filter(isAssigned);
    else if (assignment === 'unassigned') items = items.filter(function (r) { return !isAssigned(r); });
    // Rezervasyon Durumu filtresi (Bekliyor / Onaylandı / İptal Edildi)
    if (resStatus !== 'all') items = items.filter(function (r) { return requestDurum(r) === resStatus; });
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

  function contactBadge(r) {
    var s = r.contactStatus;
    if (s === 'positive') return '<span class="tm-badge tm-badge--green">Olumlu</span>';
    if (s === 'negative') return '<span class="tm-badge tm-badge--red">Olumsuz</span>';
    if (s === 'unreachable') return '<span class="tm-badge tm-badge--orange">Ulaşılamadı</span>';
    return '<span class="tm-badge tm-badge--muted">Görüşülmedi</span>';
  }

  function isAssigned(r) {
    if (r.status === 'new' || r.status === 'rejected' || r.status === 'cancelled') return false;
    var res = Store.getReservationByRequestId(r.id);
    // Ders ataması ancak veli ile olumlu iletişim (ya da mevcut rezervasyon) varsa geçerli sayılır.
    if (r.contactStatus !== 'positive' && !res) return false;
    var sess = r.selectedSessionId ? Store.getSessionById(r.selectedSessionId) : (res ? Store.getSessionById(res.sessionId) : null);
    return !!sess;
  }
  function assignmentBadge(r) {
    return isAssigned(r)
      ? '<span class="tm-badge tm-badge--green">Yapıldı</span>'
      : '<span class="tm-badge tm-badge--orange">Yapılmadı</span>';
  }
  function resCode(r) {
    return Store.getReservationCode ? Store.getReservationCode(r.id) : r.id;
  }
  function selectedLessonCell(sessionId) {
    if (!sessionId) return '—';
    var code = Store.getLessonCode ? Store.getLessonCode(sessionId) : sessionId;
    return '<code class="tm-res-code-cell">' + U.escapeHtml(code || sessionId) + '</code>';
  }

  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
  var DELETE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  function editBtn(id) {
    return '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-open-drawer="' + id + '" title="Düzenle" aria-label="Düzenle">' + EDIT_ICON + '</button>';
  }
  function actionCell(r) {
    var del = r.deleted ? '' :
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-delete-req="' + r.id + '" title="Talebi iptal et" aria-label="Talebi iptal et">' + DELETE_ICON + '</button>';
    return '<span class="tm-row-actions">' + editBtn(r.id) + del + '</span>';
  }
  // Rezervasyon Durumu: İptal Edildi (silinen) / Onaylandı / Bekliyor.
  // Onaylandı olması için TÜM adımlar tamamlanmalı: İletişim → Ders Ataması → Rezerve → Onay (veli onayı) → Link.
  function requestDurum(r) {
    if (r.deleted || r.status === 'rejected' || r.status === 'cancelled') return 'cancelled';
    var res = Store.getReservationByRequestId(r.id);
    if (res && res.status !== 'cancelled' && res.parentApprovalStatus === 'approved' && res.linkSent) return 'approved';
    return 'pending';
  }
  function durumBadge(r) {
    var d = requestDurum(r);
    if (d === 'cancelled') return '<span class="tm-badge tm-badge--red">İptal Edildi</span>';
    if (d === 'approved') return '<span class="tm-badge tm-badge--green">Onaylandı</span>';
    return '<span class="tm-badge tm-badge--muted">Bekliyor</span>';
  }

  // Velinin ücretsiz deneme formunda seçtiği ders saati — başvuruda zorunlu olduğundan boş olamaz.
  // Öncelik: formda seçilen tercih (preferredSessionId); yoksa atanan/seçili ders.
  function requestedLessonDate(r) {
    var sid = r.preferredSessionId || r.selectedSessionId;
    var s = sid ? Store.getSessionById(sid) : null;
    return s ? U.formatDateKey(s.date) + ' ' + s.startTime : '—';
  }

  function rowHtml(r) {
    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    return '<tr data-req="' + r.id + '" style="cursor:pointer">' +
      '<td>' + U.formatDateTime(r.createdAt) + '</td>' +
      '<td>' + U.escapeHtml(requestedLessonDate(r)) + '</td>' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(resCode(r)) + '</code></td>' +
      '<td>' + U.escapeHtml(r.parentFirstName + ' ' + r.parentLastName) + '</td>' +
      '<td>' + U.escapeHtml(r.parentPhone) + '</td>' +
      '<td>' + U.escapeHtml(r.parentEmail) + '</td>' +
      '<td>' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + '</td>' +
      '<td>' + U.escapeHtml(r.studentGrade) + '</td>' +
      '<td>' + (lt ? lt.name : '—') + '</td>' +
      '<td>' + selectedLessonCell(r.selectedSessionId) + '</td>' +
      '<td>' + contactBadge(r) + '</td>' +
      '<td>' + assignmentBadge(r) + '</td>' +
      '<td>' + durumBadge(r) + '</td>' +
      '<td style="white-space:nowrap">' + actionCell(r) + '</td></tr>';
  }

  function cardHtml(r) {
    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    return '<article class="tm-list-card" data-req="' + r.id + '">' +
      '<div class="tm-list-card-head">' +
        '<div><strong>' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(resCode(r)) + '</code></div>' +
        assignmentBadge(r) +
      '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Talep</span> ' + U.formatDateTime(r.createdAt) + '</div>' +
        '<div><span class="tm-list-card-label">İstediği ders tarihi</span> ' + U.escapeHtml(requestedLessonDate(r)) + '</div>' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(lt ? lt.name : '—') + ' · ' + U.escapeHtml(r.studentGrade) + '</div>' +
        '<div><span class="tm-list-card-label">Veli</span> ' + U.escapeHtml(r.parentFirstName + ' ' + r.parentLastName) + '</div>' +
        '<div><span class="tm-list-card-label">Telefon</span> ' + U.escapeHtml(r.parentPhone) + '</div>' +
        '<div><span class="tm-list-card-label">İletişim</span> ' + contactBadge(r) + '</div>' +
        '<div><span class="tm-list-card-label">Ders ataması</span> ' + assignmentBadge(r) + '</div>' +
        '<div><span class="tm-list-card-label">Durum</span> ' + durumBadge(r) + '</div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-open-drawer="' + r.id + '" title="Düzenle" aria-label="Düzenle">' + EDIT_ICON + ' Düzenle</button>' +
        (r.deleted ? '' : '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-delete-req="' + r.id + '" title="Talebi iptal et" aria-label="Talebi iptal et">' + DELETE_ICON + ' İptal et</button>') +
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
      root.querySelectorAll('[data-delete-req]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          confirmDeleteRequest(btn.getAttribute('data-delete-req'));
        });
      });
    });
  }

  function confirmDeleteRequest(reqId) {
    if (Perms && !Perms.guard('cancel')) return;
    var r = Store.getRequestById ? Store.getRequestById(reqId) : null;
    var name = r ? (r.studentFirstName + ' ' + r.studentLastName) : 'Talep';
    var hasRes = r && Store.getReservationByRequestId(reqId) && Store.getReservationByRequestId(reqId).status !== 'cancelled';
    function doDelete() {
      var res = Store.deleteRequest(reqId);
      if (!res || !res.ok) { U.notifyError((res && res.error) || 'Talep iptal edilemedi.'); return; }
      U.notifySuccess('Talep iptal edildi.');
      if (window.TMOnSessionChange) window.TMOnSessionChange(); else render();
    }
    if (Confirm) {
      Confirm.open({
        title: 'Talebi iptal et',
        warning: name + ' adlı öğrencinin rezervasyon talebini iptal etmek istediğinize emin misiniz? Durum "İptal Edildi" olarak işaretlenir' + (hasRes ? ' ve oluşturulan rezervasyon iptal edilir' : '') + '.',
        requireReason: false,
        confirmLabel: 'Sil',
        cancelLabel: 'Vazgeç',
        danger: true,
        onConfirm: doDelete
      });
    } else if (window.confirm('Talebi silmek istediğinize emin misiniz?')) {
      doDelete();
    }
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
  if (contactFilter) contactFilter.addEventListener('change', function () { page = 1; render(); });
  if (assignmentFilter) assignmentFilter.addEventListener('change', function () { page = 1; render(); });
  if (reservationStatusFilter) reservationStatusFilter.addEventListener('change', function () { page = 1; render(); });
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
