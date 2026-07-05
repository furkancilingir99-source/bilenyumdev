/**
 * Ayarlar — mock veri yönetimi ve operasyon özeti
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var Confirm = window.TMConfirmDialog;
  if (!Store) return;

  var statsEl = document.getElementById('tmMockStats');
  var persistEl = document.getElementById('tmMockPersist');
  var simulateBtn = document.getElementById('tmSimulateRequest');
  var resetBtn = document.getElementById('tmResetMock');

  function statRow(label, val, tone) {
    return '<div class="tm-detail-grid-cell' + (tone ? ' is-' + tone : '') + '">' +
      '<div class="tm-detail-cell-label">' + U.escapeHtml(label) + '</div>' +
      '<div class="tm-detail-cell-value">' + val + '</div></div>';
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
      statRow('Rezervasyonsuz talep', s.orphanRequests, s.orphanRequests ? 'warn' : '') +
      '</div>';
    if (persistEl) {
      persistEl.textContent = s.persisted
        ? 'Oturum depolaması aktif — sayfa yenilense de değişiklikler korunur.'
        : 'Henüz kayıt yok; ilk işlemde oturum depolamasına yazılır.';
    }
  }

  if (simulateBtn) {
    simulateBtn.addEventListener('click', function () {
      var res = Store.createSimulatedRequest();
      if (!res.ok) {
        if (U.notifyError) U.notifyError(res.error || 'Talep oluşturulamadı.');
        return;
      }
      var name = res.request.studentFirstName + ' ' + res.request.studentLastName;
      if (window.TMToast) window.TMToast.show('Yeni talep: ' + name, 'success');
      renderStats();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
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
})();
