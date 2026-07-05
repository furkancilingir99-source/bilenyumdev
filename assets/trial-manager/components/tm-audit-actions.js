/**
 * Denetim kaydı varlık navigasyonu — raporlar ve denetim sayfası ortak
 */
(function (global) {
  'use strict';

  function openEntity(rawType, entityId) {
    if (!entityId) return;
    if (rawType === 'trial_lesson_request' && global.TMRequestDrawer) {
      global.TMRequestDrawer.open(entityId);
      return;
    }
    if (rawType === 'trial_lesson_session' && global.TMSessionDetail) {
      global.TMSessionDetail.open(entityId);
      return;
    }
    if (rawType === 'student') {
      window.location.href = 'deneme-dersi-yoneticisi-ogrenciler.html';
      return;
    }
    if (rawType === 'parent') {
      window.location.href = 'deneme-dersi-yoneticisi-veliler.html';
      return;
    }
    if (rawType === 'teacher') {
      window.location.href = 'deneme-dersi-yoneticisi-ogretmenler.html';
      return;
    }
    if (rawType === 'reservation') {
      var Store = (global.TMBridge && global.TMBridge.store()) || global.TMStore;
      if (!Store) return;
      var res = Store.getReservationById(entityId);
      if (res && res.requestId) {
        window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(res.requestId);
      }
    }
  }

  global.TMAuditActions = { openEntity: openEntity };
})(typeof window !== 'undefined' ? window : this);
