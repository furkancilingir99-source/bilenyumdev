/**
 * Operasyon Merkezi — özet kart panosu (Deneme Dersleri · Rezervasyon Talepleri /
 * Öğrenciler · Veliler · Öğretmenler). Her kart ilgili sayfaya götürür.
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  if (!Store) return;

  var loading = document.getElementById('tmDashLoading');
  var root = document.getElementById('tmDashRoot');

  function today() { return Store.todayKey ? Store.todayKey() : new Date().toISOString().slice(0, 10); }

  // Talep durumu — Rezervasyon Talepleri sayfasıyla birebir aynı mantık.
  function requestDurum(r) {
    if (r.deleted || r.status === 'rejected' || r.status === 'cancelled') return 'cancelled';
    var res = Store.getReservationByRequestId(r.id);
    if (res && res.status !== 'cancelled' && res.parentApprovalStatus === 'approved' && res.linkSent) return 'approved';
    return 'pending';
  }

  function card(el, title, badgeCount, extraHtml) {
    if (!el) return;
    var n = badgeCount || 0;
    var badge = '<span class="tm-dash-card-badge' + (n > 0 ? '' : ' is-zero') + '" title="' +
      n + ' yeni bildirim">' + (n > 99 ? '99+' : n) + ' yeni bildirim</span>';
    el.innerHTML =
      '<div class="tm-dash-card-head">' +
        '<h2 class="tm-dash-card-title">' + U.escapeHtml(title) + '</h2>' + badge +
      '</div>' +
      (extraHtml || '');
  }

  // Ortak yardımcılar
  function code(prefix, id) { var m = String(id || '').match(/(\d+)\s*$/); return prefix + '-' + (m ? m[1].padStart(4, '0') : '0000'); }
  // widths: sütun genişliği ağırlıkları (içerik uzunluğuna göre orantılı). Toplamları 100 olmalı.
  function miniTable(headers, rowsHtml, emptyText, widths) {
    if (!rowsHtml) return '<div class="tm-dash-preview"><p class="tm-empty" style="margin:8px 0 0">' + emptyText + '</p></div>';
    var cols = (widths && widths.length === headers.length)
      ? '<colgroup>' + widths.map(function (w) { return '<col style="width:' + w + '%">'; }).join('') + '</colgroup>'
      : '';
    return '<div class="tm-dash-preview"><div class="tm-res-table-wrap"><table class="tm-inner-table tm-dash-mini">' + cols + '<thead><tr>' +
      headers.map(function (h) { return '<th>' + U.escapeHtml(h) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div></div>';
  }
  function detailButton(href) {
    return '<a class="tm-btn tm-btn--primary tm-dash-detail-btn" href="' + href + '">Detaylı Görüntüle &rarr;</a>';
  }
  function reqDurumBadge(r) {
    var d = requestDurum(r);
    if (d === 'cancelled') return '<span class="tm-badge tm-badge--red">İptal Edildi</span>';
    if (d === 'approved') return '<span class="tm-badge tm-badge--green">Onaylandı</span>';
    return '<span class="tm-badge tm-badge--muted">Bekliyor</span>';
  }

  var EYE_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';

  // Deneme Dersleri yansıması — yaklaşan dersler (planlanmış-dersler ile aynı veri).
  function sessionsPreview() {
    var td = today();
    var list = Store.getSessions().filter(function (s) { return s.status !== 'cancelled' && s.date >= td; })
      .sort(function (a, b) { return a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date); })
      .slice(0, 100);
    var rows = list.map(function (s) {
      var lt = Store.getLessonTypeById(s.lessonTypeId);
      var meeting = Store.getMeetingBySessionId(s.id);
      return '<tr class="tm-dash-row" data-open-session="' + U.escapeHtml(s.id) + '">' +
        '<td><code class="tm-res-code-cell">' + U.escapeHtml(Store.getLessonCode(s)) + '</code></td>' +
        '<td><code class="tm-res-code-cell">' + U.escapeHtml(meeting && meeting.meetingId ? meeting.meetingId : '—') + '</code></td>' +
        '<td>' + U.formatDateKey(s.date) + '</td>' +
        '<td>' + U.escapeHtml(s.startTime || '—') + '</td>' +
        '<td>' + U.escapeHtml(lt ? lt.name : '—') + '</td>' +
        '<td>' + U.escapeHtml(s.gradeLevel || '—') + '</td>' +
        '<td class="tm-dash-row-act"><button type="button" class="tm-icon-btn" title="Ders detayını görüntüle" aria-label="Ders detayını görüntüle">' + EYE_ICON + '</button></td></tr>';
    }).join('');
    return miniTable(['Ders ID', 'Meeting ID', 'Tarih', 'Saat', 'Ders', 'Sınıf', ''],
      rows, 'Yaklaşan ders yok.', [16, 18, 16, 11, 15, 15, 9]) +
      detailButton('deneme-dersi-yoneticisi-planlanmis-dersler.html');
  }

  // Kompakt tarih (gg.aa.yyyy) — dar önizleme sütunları için.
  function shortDate(dateKey) {
    var m = String(dateKey || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '.' + m[2] + '.' + m[1] : (dateKey || '—');
  }
  // Kompakt tarih + saat (gg.aa.yyyy ss:dd) — talebin geldiği an.
  function shortDateTime(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return shortDate(String(iso).slice(0, 10));
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  // Velinin formda seçtiği ders saati (zorunlu, boş olamaz).
  function requestedLessonDate(r) {
    var sid = r.preferredSessionId || r.selectedSessionId;
    var s = sid ? Store.getSessionById(sid) : null;
    return s ? shortDate(s.date) + ' ' + s.startTime : '—';
  }

  // Rezervasyon Talepleri yansıması — gerçek talep verisi (rezervasyonlar.html ile aynı).
  function requestsPreview() {
    var list = Store.getRequests().slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); }).slice(0, 100);
    var rows = list.map(function (r) {
      var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
      return '<tr class="tm-dash-row" data-open-request="' + U.escapeHtml(r.id) + '">' +
        '<td>' + U.escapeHtml(shortDateTime(r.createdAt)) + '</td>' +
        '<td>' + U.escapeHtml(requestedLessonDate(r)) + '</td>' +
        '<td><code class="tm-res-code-cell">' + U.escapeHtml(Store.getReservationCode(r.id)) + '</code></td>' +
        '<td class="tm-dash-wrap">' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + '</td>' +
        '<td class="tm-dash-wrap">' + U.escapeHtml(r.parentFirstName + ' ' + r.parentLastName) + '</td>' +
        '<td>' + U.escapeHtml(r.parentPhone || '—') + '</td>' +
        '<td>' + U.escapeHtml(r.studentGrade || '—') + '</td>' +
        '<td>' + U.escapeHtml(lt ? lt.name : '—') + '</td>' +
        '<td class="tm-dash-row-act"><button type="button" class="tm-icon-btn" title="Talebi görüntüle" aria-label="Talebi görüntüle">' + EYE_ICON + '</button></td></tr>';
    }).join('');
    return miniTable(['Talep tarihi', 'İstediği Ders Tarihi', 'Rez. ID', 'Öğrenci', 'Veli', 'Telefon', 'Sınıf', 'Ders', ''],
      rows, 'Talep yok.', [12, 15, 13, 15, 15, 8, 7, 8, 7]) +
      detailButton('deneme-dersi-yoneticisi-rezervasyonlar.html');
  }

  // Öğrenciler yansıması — birkaç öğrenci.
  function studentsPreview() {
    var list = Store.getStudents().slice(0, 2);
    var rows = list.map(function (st) {
      return '<tr><td><code class="tm-res-code-cell">' + U.escapeHtml(code('ts', st.id)) + '</code></td>' +
        '<td>' + U.escapeHtml(U.fullName(st.firstName, st.lastName)) + '</td>' +
        '<td>' + U.escapeHtml(st.grade || '—') + '</td></tr>';
    }).join('');
    return miniTable(['ID', 'Öğrenci', 'Sınıf'], rows, 'Öğrenci yok.') +
      detailButton('deneme-dersi-yoneticisi-ogrenciler.html');
  }

  // Veliler yansıması — birkaç veli.
  function parentsPreview() {
    var list = Store.getParents().slice(0, 2);
    var rows = list.map(function (pa) {
      return '<tr><td>' + U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) + '</td>' +
        '<td>' + U.escapeHtml(pa.phone || '—') + '</td>' +
        '<td>' + ((pa.studentIds || []).length) + '</td></tr>';
    }).join('');
    return miniTable(['Veli', 'Telefon', 'Öğr.'], rows, 'Veli yok.') +
      detailButton('deneme-dersi-yoneticisi-veliler.html');
  }

  // Öğretmenler yansıması — birkaç öğretmen.
  function teachersPreview() {
    var list = Store.getTeachers().slice(0, 2);
    var rows = list.map(function (t) {
      var isPdr = t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr';
      var count = Store.getSessionsForTeacher(t.id).filter(function (s) { return s.status !== 'cancelled'; }).length;
      return '<tr><td>' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</td>' +
        '<td>' + (isPdr ? 'PDR' : 'Branş') + '</td>' +
        '<td>' + count + '</td></tr>';
    }).join('');
    return miniTable(['Öğretmen', 'Tip', 'Ders'], rows, 'Öğretmen yok.') +
      detailButton('deneme-dersi-yoneticisi-ogretmenler.html');
  }

  // Kart başlıklarındaki "yeni bildirim" sayıları — bildirim merkezi ile aynı kaynak (gerçek veri).
  function notifCounts() {
    var m = Store.getOperationMetrics ? Store.getOperationMetrics() : {};
    var orphanIds = {};
    (m.orphanRequests || []).forEach(function (r) { orphanIds[r.id] = 1; });
    var newNotOrphan = (m.newRequests || []).filter(function (r) { return !orphanIds[r.id]; }).length;
    var requests = (m.orphanRequestCount || 0) + newNotOrphan +
      (m.pendingApprovalCount || 0) + (m.linkNotSentCount || 0);
    var sessions = (m.teacherNotInformedCount || 0) + (m.needsAttendanceCount || 0) +
      (m.missingTeacherAssignmentCount || 0) + (m.todaySessionCount || 0);
    return { requests: requests, sessions: sessions };
  }

  function bindSessionRows() {
    var cardEl = document.getElementById('tmCardSessions');
    if (!cardEl) return;
    cardEl.querySelectorAll('[data-open-session]').forEach(function (row) {
      row.addEventListener('click', function () {
        if (window.getSelection && String(window.getSelection()).length) return;
        var id = row.getAttribute('data-open-session');
        if (window.TMSessionDetail && window.TMSessionDetail.open) window.TMSessionDetail.open(id);
        else window.location.href = 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(id);
      });
    });
  }

  function bindRequestRows() {
    var cardEl = document.getElementById('tmCardRequests');
    if (!cardEl) return;
    cardEl.querySelectorAll('[data-open-request]').forEach(function (row) {
      row.addEventListener('click', function () {
        if (window.getSelection && String(window.getSelection()).length) return;
        var id = row.getAttribute('data-open-request');
        if (window.TMRequestDrawer && window.TMRequestDrawer.open) window.TMRequestDrawer.open(id);
        else window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
      });
    });
  }

  function render() {
    try {
      var n = notifCounts();

      // Rezervasyon Talepleri (solda)
      card(document.getElementById('tmCardRequests'), 'Rezervasyon Talepleri', n.requests, requestsPreview());

      // Deneme Dersleri (sağda)
      card(document.getElementById('tmCardSessions'), 'Deneme Dersleri', n.sessions, sessionsPreview());

      bindSessionRows();
      bindRequestRows();

      if (loading) loading.hidden = true;
      if (root) root.hidden = false;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Özet yüklenemedi: ' + (err.message || err); }
      console.error(err);
    }
  }

  window.TMOnSessionChange = render;
  render();
})();
