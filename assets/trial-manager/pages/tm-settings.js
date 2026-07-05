/**
 * Ayarlar — mock veri yönetimi ve operasyon özeti
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var Confirm = window.TMConfirmDialog;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var statsEl = document.getElementById('tmMockStats');
  var persistEl = document.getElementById('tmMockPersist');
  var simulateBtn = document.getElementById('tmSimulateRequest');
  var resetBtn = document.getElementById('tmResetMock');
  var userSelect = document.getElementById('tmMockUserSelect');
  var switchUserBtn = document.getElementById('tmSwitchUser');
  var apiModeEl = document.getElementById('tmApiModeLabel');
  var exportAuditBtn = document.getElementById('tmExportAudit');

  var Export = window.TMExportUtils;
  var SL = window.TMStatusLabels;
  var Api = window.TMApi;

  function renderApiMode() {
    if (!apiModeEl) return;
    var mode = Api && Api.getMode ? Api.getMode() : 'mock';
    apiModeEl.textContent = mode === 'mock' ? 'Mock (TMStore · oturum depolaması)' : 'REST API';
  }

  function exportAuditLog() {
    if (!Export || !Store.getAuditLogs) return;
    if (Perms && !Perms.guard('export')) return;
    var logs = Store.getAuditLogs();
    Export.exportTable('denetim-gunlugu.csv', logs, [
      { key: 'createdAt', label: 'Tarih', value: function (l) { return U.formatDateTime(l.createdAt); } },
      { key: 'entityType', label: 'Varlık', value: function (l) { return SL ? SL.auditEntityLabel(l.entityType) : l.entityType; } },
      { key: 'entityId', label: 'Kayıt ID' },
      { key: 'action', label: 'İşlem', value: function (l) { return SL ? SL.auditActionLabel(l.action) : l.action; } },
      { key: 'description', label: 'Açıklama' },
      { key: 'reason', label: 'Neden' },
      { key: 'createdByUserId', label: 'Kullanıcı ID' }
    ]);
    if (window.TMToast) window.TMToast.show('Denetim günlüğü indirildi (' + logs.length + ' kayıt).', 'success');
  }

  function statRow(label, val, tone, href) {
    var valHtml = href
      ? '<a href="' + href + '" class="tm-panel-link" style="font-size:18px;font-weight:600">' + val + '</a>'
      : String(val);
    return '<div class="tm-detail-grid-cell' + (tone ? ' is-' + tone : '') + '">' +
      '<div class="tm-detail-cell-label">' + U.escapeHtml(label) + '</div>' +
      '<div class="tm-detail-cell-value">' + valHtml + '</div></div>';
  }

  function renderStats() {
    if (!statsEl) return;
    var s = Api && Api.getMockStats ? Api.getMockStats() : Store.getMockStats();
    statsEl.innerHTML =
      '<div class="tm-detail-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">' +
      statRow('Öğrenci', s.students) +
      statRow('Veli', s.parents) +
      statRow('Öğretmen', s.teachers) +
      statRow('Ders', s.sessions) +
      statRow('Toplantı', s.meetings) +
      statRow('Talep', s.requests) +
      statRow('Rezervasyon', s.reservations) +
      statRow('İletişim kaydı', s.communicationLogs) +
      statRow('Rezervasyonsuz talep', s.orphanRequests, s.orphanRequests ? 'warn' : '', 'deneme-dersi-yoneticisi-rezervasyonlar.html?filter=orphan') +
      '</div>';
    if (persistEl) {
      persistEl.textContent = s.persisted
        ? 'Oturum depolaması aktif — sayfa yenilense de değişiklikler korunur.'
        : 'Henüz kayıt yok; ilk işlemde oturum depolamasına yazılır.';
    }
  }

  function renderUserSelect() {
    if (!userSelect || !Store.getUsers) return;
    var current = Store.getCurrentUser();
    userSelect.innerHTML = Store.getUsers().filter(function (u) { return u.isActive; }).map(function (u) {
      return '<option value="' + u.id + '"' + (current && current.id === u.id ? ' selected' : '') + '>' +
        U.escapeHtml(u.firstName + ' ' + u.lastName) + ' · ' + u.role + '</option>';
    }).join('');
  }

  function switchUser() {
    if (!userSelect || !Store.switchCurrentUser) return;
    var res = Store.switchCurrentUser(userSelect.value);
    if (!res.ok) {
      if (U.notifyError) U.notifyError(res.error);
      return;
    }
    if (window.TMToast) window.TMToast.show('Kullanıcı: ' + res.user.firstName + ' ' + res.user.lastName, 'success');
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome();
    if (window.TMAppShell && window.TMAppShell.refreshSidebarBadges) window.TMAppShell.refreshSidebarBadges();
    if (window.TMOnSessionChange) window.TMOnSessionChange();
    renderUserSelect();
  }

  if (switchUserBtn) switchUserBtn.addEventListener('click', switchUser);
  if (exportAuditBtn) exportAuditBtn.addEventListener('click', exportAuditLog);
  renderUserSelect();
  renderApiMode();

  if (simulateBtn) {
    simulateBtn.addEventListener('click', function () {
      if (window.TMSimulateRequest) {
        window.TMSimulateRequest.open({ onSuccess: function () { renderStats(); } });
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('edit')) return;
      var run = function () {
        Store.resetMockData();
        if (window.TMToast) window.TMToast.show('Mock veri sıfırlandı.', 'success');
        renderStats();
        if (window.TMOnSessionChange) window.TMOnSessionChange();
      };
      if (Confirm) {
        Confirm.open({
          title: 'Mock veriyi sıfırla',
          message: 'Tüm oturum verisi silinir ve başlangıç demo verisine dönülür. Devam edilsin mi?',
          confirmLabel: 'Sıfırla',
          danger: true,
          onConfirm: run
        });
      } else if (window.confirm('Mock veri sıfırlansın mı?')) run();
    });
  }

  renderStats();
  renderUserSelect();
  renderApiMode();
  window.TMOnSessionChange = function () { renderStats(); renderUserSelect(); };
})();
