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
  var countEl = document.getElementById('tmAuditCount');
  var exportBtn = document.getElementById('tmAuditExport');
  var page = 1;
  var pageSize = 25;
  var EYE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  function hval(v) { return (v === undefined || v === null || v === '') ? '—' : String(v); }
  function category(l) { return SL.auditCategory ? SL.auditCategory(l.entityType) : (SL.AUDIT_ENTITY[l.entityType] || l.entityType); }

  function userLabel(userId) {
    if (!userId) return '—';
    var u = Store.getUsers().find(function (x) { return x.id === userId; });
    return u ? U.fullName(u.firstName, u.lastName) : userId;
  }

  function initFromUrl() {
    var entityId = U.qs('entityId') || U.qs('id');
    if (entityId && searchInput) searchInput.value = entityId;
  }

  // "Tüm varlıklar" filtresi — DEĞİŞİKLİK TÜRÜ (Rezervasyon Talepleri / Deneme Dersleri /
  // Öğrenci / Veli / Öğretmen) benzersiz kategorilerle doldurulur.
  function initFilters() {
    if (entityFilter && SL && SL.AUDIT_CATEGORY) {
      var cats = [];
      Object.keys(SL.AUDIT_CATEGORY).forEach(function (k) { var c = SL.AUDIT_CATEGORY[k]; if (c !== 'Diğer' && cats.indexOf(c) < 0) cats.push(c); });
      entityFilter.innerHTML = '<option value="all">Tüm varlıklar</option>' +
        cats.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    }
    initFromUrl();
  }

  function filtered() {
    var cat = entityFilter ? entityFilter.value : 'all';
    var q = searchInput ? searchInput.value : '';
    return Store.getAuditLogs().filter(function (l) {
      if (cat !== 'all' && category(l) !== cat) return false;
      if (q) {
        var hay = l.id + ' ' + l.entityId + ' ' + (l.description || '') + ' ' + (l.reason || '') + ' ' +
          userLabel(l.createdByUserId) + ' ' + category(l) + ' ' + hval(l.previousValue) + ' ' + hval(l.newValue) +
          ' ' + (SL.AUDIT_ACTION[l.action] || l.action);
        if (hay.toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
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
    return '<article class="tm-list-card" data-audit-id="' + l.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(category(l)) + '</strong>' +
        '<code class="tm-res-code-cell">' + U.escapeHtml(l.entityId) + '</code></div>' +
      '<span class="tm-badge tm-badge--muted">' + U.escapeHtml(SL.AUDIT_ACTION[l.action] || l.action) + '</span></div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Tarih & Saat</span> ' + U.formatDateTime(l.createdAt) + '</div>' +
        '<div><span class="tm-list-card-label">Değişikliği Yapan</span> ' + U.escapeHtml(userLabel(l.createdByUserId)) + '</div>' +
        '<div><span class="tm-list-card-label">Eski → Yeni</span> <span class="tm-audit-old">' + U.escapeHtml(hval(l.previousValue)) + '</span> → <span class="tm-audit-new">' + U.escapeHtml(hval(l.newValue)) + '</span></div>' +
        (l.description ? '<div><span class="tm-list-card-label">Değişiklik</span> ' + U.escapeHtml(l.description) + '</div>' : '') +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-open-entity data-type="' +
          U.escapeHtml(l.entityType) + '" data-id="' + U.escapeHtml(l.entityId) + '">İlgili kaydı aç</button>' +
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
        return '<tr data-audit-id="' + l.id + '">' +
          '<td>' + U.formatDateTime(l.createdAt) + '</td>' +
          '<td>' + U.escapeHtml(userLabel(l.createdByUserId)) + '</td>' +
          '<td><code class="tm-res-code-cell">' + U.escapeHtml(l.entityId) + '</code></td>' +
          '<td>' + U.escapeHtml(category(l)) + '</td>' +
          '<td><span class="tm-audit-old">' + U.escapeHtml(hval(l.previousValue)) + '</span></td>' +
          '<td><span class="tm-audit-new">' + U.escapeHtml(hval(l.newValue)) + '</span></td>' +
          '<td><span class="tm-row-actions"><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-open-entity data-type="' +
            U.escapeHtml(l.entityType) + '" data-id="' + U.escapeHtml(l.entityId) + '" title="İlgili kaydı aç" aria-label="İlgili kaydı aç">' + EYE_ICON + '</button></span></td></tr>';
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
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('export')) return;
      Export.exportTable('denetim-gunlugu.csv', filtered(), [
        { key: 'date', label: 'Değişiklik Tarihi & Saati', value: function (l) { return U.formatDateTime(l.createdAt); } },
        { key: 'user', label: 'Değişikliği Yapan', value: function (l) { return userLabel(l.createdByUserId); } },
        { key: 'entityId', label: 'Kayıt ID', value: function (l) { return l.entityId; } },
        { key: 'category', label: 'Değişiklik Türü', value: function (l) { return category(l); } },
        { key: 'old', label: 'Eski Durum', value: function (l) { return hval(l.previousValue); } },
        { key: 'new', label: 'Yeni Durum', value: function (l) { return hval(l.newValue); } }
      ]);
    });
  }

  initFilters();
  render();
  window.TMOnSessionChange = render;
})();
