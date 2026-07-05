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
    var s = Store.getMockStats();
    statsEl.innerHTML =
      '<div class="tm-detail-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">' +
      statRow('Öğrenci', s.students) +
      statRow('Veli', s.parents) +
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
  renderUserSelect();

  if (simulateBtn) {
    simulateBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('create')) return;
      var res = Store.createSimulatedRequest();
      if (!res.ok) {
        if (U.notifyError) U.notifyError(res.error || 'Talep oluşturulamadı.');
        return;
      }
      var name = res.request.studentFirstName + ' ' + res.request.studentLastName;
      if (window.TMToast) window.TMToast.show('Yeni talep: ' + name, 'success');
      renderStats();
      if (window.TMOnSessionChange) window.TMOnSessionChange();
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
  window.TMOnSessionChange = function () { renderStats(); renderUserSelect(); };
})();
