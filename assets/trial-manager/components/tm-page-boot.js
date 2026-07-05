/**
 * Sayfa yükleme kontrolü — hata durumunda kullanıcıya mesaj göster
 */
(function () {
  'use strict';

  function showBootError(msg) {
    var el = document.getElementById('tmBootError');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tmBootError';
      el.className = 'tm-boot-error';
      el.setAttribute('role', 'alert');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
  }

  window.addEventListener('error', function (e) {
    if (e.filename && e.filename.indexOf('trial-manager') >= 0) {
      showBootError('Panel modülü yüklenemedi: ' + (e.message || 'bilinmeyen hata'));
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!window.TMStore) {
        showBootError('Veri deposu (TMStore) yüklenemedi. Sayfayı yenileyin veya önbelleği temizleyin.');
        return;
      }
      var loading = document.querySelector('.td-state:not([hidden])');
      var root = document.getElementById('tmDashRoot') ||
        document.getElementById('tmSessionsTableWrap') ||
        document.getElementById('tmRequestsTableWrap');
      if (loading && root && root.hidden && loading.textContent.indexOf('Yükleniyor') >= 0) {
        loading.hidden = true;
        root.hidden = false;
        if (root.id === 'tmDashRoot') root.hidden = false;
      }
    }, 800);
  });
})();
