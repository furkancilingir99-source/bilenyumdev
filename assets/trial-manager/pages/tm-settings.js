/**
 * Ayarlar — mock veri yönetimi ve operasyon özeti
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
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
  var apiHealthEl = document.getElementById('tmApiHealthStatus');
  var apiHealthBtn = document.getElementById('tmApiHealthCheck');
  var apiMetricsBtn = document.getElementById('tmApiMetricsCheck');
  var apiAllBtn = document.getElementById('tmApiAllCheck');
  var apiModeMockBtn = document.getElementById('tmApiModeMock');
  var apiModeApiBtn = document.getElementById('tmApiModeApi');
  var exportAuditBtn = document.getElementById('tmExportAudit');
  var exportMockBtn = document.getElementById('tmExportMock');
  var importMockInput = document.getElementById('tmImportMock');

  var Export = window.TMExportUtils;
  var SL = window.TMStatusLabels;
  var Api = window.TMApi;

  function renderApiMode() {
    if (!apiModeEl) return;
    var mode = Api && Api.getMode ? Api.getMode() : 'mock';
    apiModeEl.textContent = mode === 'mock' ? 'Mock (TMStore · oturum depolaması)' : 'REST API (hibrit · veri mock)';
    if (apiHealthEl && mode === 'mock') {
      var ep = Api && Api.endpoints ? Api.endpoints : {};
      apiHealthEl.textContent = 'Uç noktalar: ' + (ep.health || '/api/trial-manager/health') +
        ' · ' + (ep.metrics || '/api/trial-manager/metrics');
    }
  }

  function runApiHealthCheck() {
    if (!Api) return;
    if (apiHealthEl) apiHealthEl.textContent = 'Health test ediliyor…';
    var probe = Api.probeHealth || Api.checkHealth;
    probe().then(function (res) {
      if (!apiHealthEl) return;
      var mode = Api.getMode ? Api.getMode() : 'mock';
      if (res.ok && res.data) {
        apiHealthEl.textContent = 'REST health OK · v' + (res.data.version || '?') +
          ' · ' + (res.data.timestamp ? U.formatDateTime(res.data.timestamp) : '') +
          ' · aktif mod: ' + mode;
        if (window.TMToast) window.TMToast.show('API health başarılı.', 'success');
      } else if (res.mode === 'mock' && res.message) {
        apiHealthEl.textContent = res.message + ' (REST testi için probe kullanılamadı.)';
      } else {
        apiHealthEl.textContent = 'REST health hatası: ' + (res.error || 'bilinmiyor');
        if (U.notifyError) U.notifyError(res.error || 'API health başarısız.');
      }
    });
  }

  function runApiMetricsCheck() {
    if (!Api || !Api.probeMetrics) return;
    if (apiHealthEl) apiHealthEl.textContent = 'Metrik uç noktası test ediliyor…';
    Api.probeMetrics().then(function (res) {
      if (!apiHealthEl) return;
      if (!res.ok) {
        apiHealthEl.textContent = 'Metrik hatası: ' + (res.error || 'bilinmiyor');
        if (U.notifyError) U.notifyError(res.error || 'Metrik uç noktası başarısız.');
        return;
      }
      var m = res.data && res.data.metrics ? res.data.metrics : {};
      var stub = res.data && res.data.stub ? ' (stub)' : '';
      apiHealthEl.textContent = 'Metrik OK' + stub + ' · aksiyon: ' + (m.actionableCount != null ? m.actionableCount : '?') +
        ' · bugün ders: ' + (m.todaySessionCount != null ? m.todaySessionCount : '?');
      if (window.TMToast) window.TMToast.show('Metrik uç noktası yanıt verdi.', 'success');
    });
  }

  function runApiAllCheck() {
    if (!Api || !Api.probeAllEndpoints) return;
    if (apiHealthEl) apiHealthEl.textContent = 'Tüm uç noktalar test ediliyor…';
    Api.probeAllEndpoints().then(function (res) {
      if (!apiHealthEl) return;
      apiHealthEl.textContent = 'Uç nokta testi: ' + res.passed + '/' + res.total + ' başarılı' +
        (res.ok ? ' · tümü yanıt verdi' : ' · bazı uçlar başarısız');
      if (window.TMToast) {
        window.TMToast.show(res.ok ? 'Tüm API uçları yanıt verdi.' : 'Bazı API uçları başarısız.', res.ok ? 'success' : 'error');
      }
    });
  }

  function switchApiMode(mode) {
    if (!Api || !Api.setMode) return;
    var res = Api.setMode(mode);
    if (!res.ok) {
      if (U.notifyError) U.notifyError(res.error);
      return;
    }
    renderApiMode();
    if (window.TMToast) {
      window.TMToast.show(mode === 'api' ? 'API mod (hibrit) aktif.' : 'Mock mod aktif.', 'success');
    }
    if (res.note && apiHealthEl) apiHealthEl.textContent = res.note;
  }

  function exportMockJson() {
    if (!Store.exportMockSnapshot) return;
    if (Perms && !Perms.guard('export')) return;
    var snap = Store.exportMockSnapshot();
    var blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'bilenyum-tmstore-' + new Date().toISOString().slice(0, 10) + '.json';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.TMToast) window.TMToast.show('Mock veri yedeklendi.', 'success');
  }

  function importMockJson(file) {
    if (!file || !Store.importMockSnapshot) return;
    if (Perms && !Perms.guard('edit')) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(String(reader.result || ''));
        var res = Store.importMockSnapshot(payload);
        if (!res.ok) {
          if (U.notifyError) U.notifyError(res.error);
          return;
        }
        if (window.TMToast) window.TMToast.show('Mock veri yüklendi.', 'success');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        renderStats();
        renderUserSelect();
        if (Perms && Perms.applyPageChrome) Perms.applyPageChrome();
        if (window.TMAppShell && window.TMAppShell.refreshSidebarBadges) window.TMAppShell.refreshSidebarBadges();
      } catch (e) {
        if (U.notifyError) U.notifyError('JSON dosyası okunamadı.');
      }
    };
    reader.readAsText(file);
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
  if (apiHealthBtn) apiHealthBtn.addEventListener('click', runApiHealthCheck);
  if (apiMetricsBtn) apiMetricsBtn.addEventListener('click', runApiMetricsCheck);
  if (apiAllBtn) apiAllBtn.addEventListener('click', runApiAllCheck);
  if (apiModeMockBtn) apiModeMockBtn.addEventListener('click', function () { switchApiMode('mock'); });
  if (apiModeApiBtn) apiModeApiBtn.addEventListener('click', function () { switchApiMode('api'); });
  if (exportAuditBtn) exportAuditBtn.addEventListener('click', exportAuditLog);
  if (exportMockBtn) exportMockBtn.addEventListener('click', exportMockJson);
  if (importMockInput) {
    importMockInput.addEventListener('change', function () {
      if (importMockInput.files && importMockInput.files[0]) {
        var run = function () {
          importMockJson(importMockInput.files[0]);
          importMockInput.value = '';
        };
        if (Confirm) {
          Confirm.open({
            title: 'Mock veri yükle',
            message: 'Mevcut oturum verisi yedek dosyasıyla değiştirilir. Devam edilsin mi?',
            confirmLabel: 'Yükle',
            danger: true,
            onConfirm: run
          });
        } else run();
      }
    });
  }
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
