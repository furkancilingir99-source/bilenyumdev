/**
 * Sayfa yükleme kontrolü — hata durumunda kullanıcıya mesaj göster
 */
(function () {
  'use strict';

  var LOAD_IDS = [
    'tmDashRoot', 'tmSessionsTableWrap', 'tmRequestsTableWrap', 'tmStudentsTableWrap',
    'tmParentsTableWrap', 'tmTeachersTableWrap', 'tmMeetingsTableWrap', 'tmCommTableWrap',
    'tmUsersTableWrap', 'tmReportGrid', 'tmRequestDetail', 'tmFullDetail'
  ];

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

  function findContentRoot() {
    for (var i = 0; i < LOAD_IDS.length; i++) {
      var el = document.getElementById(LOAD_IDS[i]);
      if (el) return el;
    }
    return null;
  }

  function findLoadingEl() {
    return document.querySelector('.td-state:not([hidden])');
  }

  window.addEventListener('error', function (e) {
    if (e.filename && e.filename.indexOf('trial-manager') >= 0) {
      showBootError('Panel modülü yüklenemedi: ' + (e.message || 'bilinmeyen hata'));
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!window.TMStore && document.querySelector('[data-tm-page]')) {
        showBootError('Veri deposu (TMStore) yüklenemedi. Sayfayı yenileyin veya önbelleği temizleyin.');
        return;
      }
      var loading = findLoadingEl();
      var root = findContentRoot();
      if (loading && root && root.hidden && loading.textContent.indexOf('Yükleniyor') >= 0) {
        loading.hidden = true;
        root.hidden = false;
      }
    }, 900);
  });
})();
