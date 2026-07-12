/**
 * Denetim kaydı varlık navigasyonu — raporlar ve denetim sayfası ortak
 */
(function (global) {
  'use strict';

  function store() { return (global.TMBridge && global.TMBridge.store()) || global.TMStore; }
  function U() { return global.TMUtils; }
  function SL() { return global.TMStatusLabels; }
  function esc(s) { return (U() && U().escapeHtml) ? U().escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s); }
  function full(a, b) { return (U() && U().fullName) ? U().fullName(a, b) : ((a || '') + ' ' + (b || '')).trim(); }
  function numCode(prefix, id) { var m = String(id || '').match(/(\d+)\s*$/); return prefix + '-' + (m ? m[1].padStart(4, '0') : '0000'); }

  // Denetim/rapor sayfasında SAYFA DEĞİŞTİRMEDEN salt-okunur bilgi modalı gösterir.
  function infoModal(title, sub, gridHtml) {
    var existing = document.getElementById('tmAuditEntityModal');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open';
    ov.id = 'tmAuditEntityModal';
    ov.style.zIndex = '9600';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + esc(title) + '</h2>' + (sub ? '<p class="tm-detail-modal-sub">' + esc(sub) + '</p>' : '') +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body"><div class="tm-detail-grid tm-detail-grid--modal">' + gridHtml + '</div></div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--primary" data-close>Kapat</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
  }
  function cell(label, val) { return '<div><div class="tm-detail-cell-label">' + esc(label) + '</div><div class="tm-detail-cell-value">' + val + '</div></div>'; }

  function openParentModal(id) {
    var S = store(); var p = S && S.getParentById ? S.getParentById(id) : null; if (!p) return false;
    var sts = (p.studentIds || []).map(function (x) { return S.getStudentById(x); }).filter(Boolean);
    var stHtml = sts.length ? sts.map(function (s) { return '<code class="tm-res-code-cell">' + esc(numCode('ts', s.id)) + '</code> ' + esc(full(s.firstName, s.lastName)) + ' · ' + esc(s.grade || '—'); }).join('<br>') : '—';
    infoModal('Veli · ' + full(p.firstName, p.lastName), numCode('tp', p.id),
      cell('Veli ID', '<code class="tm-res-code-cell">' + esc(numCode('tp', p.id)) + '</code>') +
      cell('Ad Soyad', esc(full(p.firstName, p.lastName))) +
      cell('Telefon', esc(p.phone || '—')) +
      cell('E-posta', esc(p.email || '—')) +
      cell('Öğrenci(ler)', stHtml));
    return true;
  }
  function openStudentModal(id) {
    var S = store(); var s = S && S.getStudentById ? S.getStudentById(id) : null; if (!s) return false;
    var lt = S.getLessonTypeById ? S.getLessonTypeById(s.requestedLessonTypeId) : null;
    var pa = (s.parentIds || []).map(function (x) { return S.getParentById(x); }).filter(Boolean)[0];
    infoModal('Öğrenci · ' + full(s.firstName, s.lastName), numCode('ts', s.id),
      cell('Öğrenci ID', '<code class="tm-res-code-cell">' + esc(numCode('ts', s.id)) + '</code>') +
      cell('Ad Soyad', esc(full(s.firstName, s.lastName))) +
      cell('Sınıf', esc(s.grade || '—')) +
      cell('Ders türü', esc(lt ? lt.name : '—')) +
      cell('Veli', pa ? esc(full(pa.firstName, pa.lastName)) + ' · ' + esc(pa.phone || '') : '—'));
    return true;
  }
  function openTeacherModal(id) {
    var S = store(); var t = S && S.getTeacherById ? S.getTeacherById(id) : null; if (!t) return false;
    var isPdr = t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr';
    var branch = isPdr ? 'Veli sunumu (PDR)' : (t.branchLessonTypeIds || []).map(function (x) { var lt = S.getLessonTypeById(x); return lt ? lt.name : x; }).join(', ');
    var count = S.getSessionsForTeacher ? S.getSessionsForTeacher(t.id).filter(function (x) { return x.status !== 'cancelled'; }).length : 0;
    infoModal('Öğretmen · ' + full(t.firstName, t.lastName), (isPdr ? 'PDR / Rehberlik' : 'Branş öğretmeni'),
      cell('Ad Soyad', esc(full(t.firstName, t.lastName))) +
      cell('Öğretmen Tipi', SL() ? SL().teacherTypeBadge(t.teacherType || 'branch') : (isPdr ? 'PDR' : 'Branş')) +
      cell('Branş', esc(branch)) +
      cell('Telefon', esc(t.phone || '—')) +
      cell('E-posta', esc(t.email || '—')) +
      cell('Deneme Dersi Sayısı', String(count)));
    return true;
  }

  function openEntity(rawType, entityId) {
    if (!entityId) return;
    // Talep / ders: kendi zengin drawer'ında (SAYFA DEĞİŞMEDEN) açılır.
    if (rawType === 'trial_lesson_request' && global.TMRequestDrawer) { global.TMRequestDrawer.open(entityId); return; }
    if ((rawType === 'trial_lesson_session' || rawType === 'online_meeting') && global.TMSessionDetail) {
      var S0 = store();
      var sid = entityId;
      if (rawType === 'online_meeting' && S0) { var sess = S0.getSessions().find(function (x) { return x.onlineMeetingId === entityId; }); if (sess) sid = sess.id; }
      global.TMSessionDetail.open(sid); return;
    }
    // Rezervasyon → bağlı talebin drawer'ı (yine sayfada kalır).
    if ((rawType === 'reservation' || rawType === 'trial_lesson_reservation')) {
      var S1 = store(); var res = S1 && S1.getReservationById ? S1.getReservationById(entityId) : null;
      if (res && res.requestId && global.TMRequestDrawer) { global.TMRequestDrawer.open(res.requestId); return; }
    }
    // Veli / öğrenci / öğretmen: salt-okunur bilgi modalı (SAYFA DEĞİŞMEZ).
    if (rawType === 'parent' && openParentModal(entityId)) return;
    if (rawType === 'student' && openStudentModal(entityId)) return;
    if (rawType === 'teacher' && openTeacherModal(entityId)) return;
    // Son çare: ilgili sayfaya git (drawer/modal yüklü değilse).
    var pageMap = { trial_lesson_request: 'deneme-dersi-yoneticisi-rezervasyonlar.html', trial_lesson_session: 'deneme-dersi-yoneticisi-planlanmis-dersler.html', student: 'deneme-dersi-yoneticisi-ogrenciler.html', parent: 'deneme-dersi-yoneticisi-veliler.html', teacher: 'deneme-dersi-yoneticisi-ogretmenler.html' };
    if (pageMap[rawType]) window.location.href = pageMap[rawType] + '?id=' + encodeURIComponent(entityId);
  }

  function auditFilterHref(entityType, entityId) {
    var params = [];
    if (entityType) params.push('entity=' + encodeURIComponent(entityType));
    if (entityId) params.push('entityId=' + encodeURIComponent(entityId));
    return 'deneme-dersi-yoneticisi-denetim.html' + (params.length ? '?' + params.join('&') : '');
  }

  global.TMAuditActions = { openEntity: openEntity, auditFilterHref: auditFilterHref };
})(typeof window !== 'undefined' ? window : this);
