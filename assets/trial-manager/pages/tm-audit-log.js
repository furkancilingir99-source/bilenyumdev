/**
 * Denetim günlüğü — arama, filtre, export, varlık navigasyonu
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Perms = window.TMPermissions;
  var AuditNav = window.TMAuditActions;
  if (!Store) return;

  var tbody = document.getElementById('tmAuditBody');
  var cardsEl = document.getElementById('tmAuditCards');
  var searchInput = document.getElementById('tmAuditSearch');
  var entityFilter = document.getElementById('tmAuditEntity');
  var actionFilter = document.getElementById('tmAuditAction');
  var startInput = document.getElementById('tmAuditStart');
  var endInput = document.getElementById('tmAuditEnd');
  var countEl = document.getElementById('tmAuditCount');
  var exportBtn = document.getElementById('tmAuditExport');
  var page = 1;
  var pageSize = 25;

  function defaultDates() {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - 30);
    if (startInput) startInput.value = start.toISOString().slice(0, 10);
    if (endInput) endInput.value = end.toISOString().slice(0, 10);
  }

  function userLabel(userId) {
    if (!userId) return '—';
    var u = Store.getUsers().find(function (x) { return x.id === userId; });
    return u ? U.fullName(u.firstName, u.lastName) : userId;
  }

  function initFromUrl() {
    var entity = U.qs('entity');
    var entityId = U.qs('entityId') || U.qs('id');
    if (entity && entityFilter && entityFilter.querySelector('option[value="' + entity + '"]')) {
      entityFilter.value = entity;
    }
    if (entityId && searchInput) searchInput.value = entityId;
  }

  function initFilters() {
    if (entityFilter && SL && SL.AUDIT_ENTITY) {
      entityFilter.innerHTML = '<option value="all">Tüm varlıklar</option>' +
        Object.keys(SL.AUDIT_ENTITY).map(function (k) {
          return '<option value="' + k + '">' + SL.AUDIT_ENTITY[k] + '</option>';
        }).join('');
    }
    if (actionFilter && SL && SL.AUDIT_ACTION) {
      actionFilter.innerHTML = '<option value="all">Tüm işlemler</option>' +
        Object.keys(SL.AUDIT_ACTION).map(function (k) {
          return '<option value="' + k + '">' + SL.AUDIT_ACTION[k] + '</option>';
        }).join('');
    }
    initFromUrl();
  }

  function filtered() {
    var start = startInput ? startInput.value : '';
    var end = endInput ? endInput.value : '';
    var entity = entityFilter ? entityFilter.value : 'all';
    var action = actionFilter ? actionFilter.value : 'all';
    var q = searchInput ? searchInput.value : '';
    return Store.getAuditLogs().filter(function (l) {
      var d = l.createdAt.slice(0, 10);
      if (start && d < start) return false;
      if (end && d > end) return false;
      if (entity !== 'all' && l.entityType !== entity) return false;
      if (action !== 'all' && l.action !== action) return false;
      if (q) {
        var hay = l.id + ' ' + l.entityId + ' ' + l.description + ' ' + (l.reason || '') + ' ' + userLabel(l.createdByUserId);
        if (hay.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
      }
      return true;
    });
  }

  function rowData(l) {
    return {
      id: l.id,
      date: l.createdAt,
      rawEntityType: l.entityType,
      entityType: SL.auditEntityLabel(l.entityType),
      entityId: l.entityId,
      action: SL.auditActionLabel(l.action),
      description: l.description || '',
      reason: l.reason || '',
      user: userLabel(l.createdByUserId)
    };
  }

  function cardHtml(l) {
    var r = rowData(l);
    return '<article class="tm-list-card" data-audit-id="' + l.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(r.action) + '</strong></div>' +
      '<span class="tm-badge tm-badge--muted">' + U.escapeHtml(r.entityType) + '</span></div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Tarih</span> ' + U.formatDateTime(r.date) + '</div>' +
        '<div><span class="tm-list-card-label">Kayıt</span> ' + U.escapeHtml(r.entityId) + '</div>' +
        '<div><span class="tm-list-card-label">Açıklama</span> ' + U.escapeHtml(r.description) + '</div>' +
        '<div><span class="tm-list-card-label">Kullanıcı</span> ' + U.escapeHtml(r.user) + '</div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-open-entity data-type="' +
          U.escapeHtml(l.entityType) + '" data-id="' + U.escapeHtml(l.entityId) + '">Kayda git</button>' +
      '</div></article>';
  }

  function bindRowActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-open-entity]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (AuditNav) AuditNav.openEntity(btn.getAttribute('data-type'), btn.getAttribute('data-id'));
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmAuditLoading');
    var wrap = document.getElementById('tmAuditTableWrap');
    var paginationEl = document.getElementById('tmAuditPagination');
    try {
      var all = filtered();
      var p = U.paginate(all, page, pageSize);
      if (countEl) countEl.textContent = p.total + ' kayıt';
      tbody.innerHTML = p.items.map(function (l) {
        var r = rowData(l);
        return '<tr data-audit-id="' + l.id + '">' +
          '<td>' + U.formatDateTime(r.date) + '</td>' +
          '<td>' + U.escapeHtml(r.entityType) + '</td>' +
          '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-open-entity data-type="' +
            U.escapeHtml(l.entityType) + '" data-id="' + U.escapeHtml(l.entityId) + '">' + U.escapeHtml(r.entityId) + '</button></td>' +
          '<td>' + U.escapeHtml(r.action) + '</td>' +
          '<td>' + U.escapeHtml(r.description) + '</td>' +
          '<td>' + U.escapeHtml(r.reason || '—') + '</td>' +
          '<td>' + U.escapeHtml(r.user) + '</td></tr>';
      }).join('');
      if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
      U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
      bindRowActions(tbody);
      bindRowActions(cardsEl);
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
      if (cardsEl) cardsEl.hidden = false;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (entityFilter) entityFilter.addEventListener('change', function () { page = 1; render(); });
  if (actionFilter) actionFilter.addEventListener('change', function () { page = 1; render(); });
  if (startInput) startInput.addEventListener('change', function () { page = 1; render(); });
  if (endInput) endInput.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('export')) return;
      Export.exportTable('denetim-gunlugu.csv', filtered().map(rowData), [
        { key: 'date', label: 'Tarih', value: function (r) { return U.formatDateTime(r.date); } },
        { key: 'entityType', label: 'Varlık' },
        { key: 'entityId', label: 'Kayıt ID' },
        { key: 'action', label: 'İşlem' },
        { key: 'description', label: 'Açıklama' },
        { key: 'reason', label: 'Neden' },
        { key: 'user', label: 'Kullanıcı' }
      ]);
    });
  }

  defaultDates();
  initFilters();
  render();
  window.TMOnSessionChange = render;
})();
