/**
 * Operasyon Merkezi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var Api = window.TMApi;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  if (!Store && !Api) return;

  function metrics() {
    if (Api && Api.getOperationMetrics) return Api.getOperationMetrics();
    return Store.getOperationMetrics();
  }

  var loading = document.getElementById('tmDashLoading');
  var root = document.getElementById('tmDashRoot');

  function revealActionsFromHash() {
    if (location.hash !== '#tmDashActions') return;
    var panel = document.getElementById('tmDashActions');
    if (panel) {
      panel.hidden = false;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function render() {
    try {
    var m = metrics();
    var statsEl = document.getElementById('tmDashStats');
    if (statsEl) {
      statsEl.innerHTML =
        metric(m.actionableCount, 'Toplam aksiyon bekleyen', '#tmDashActions', 'warn') +
        metric(m.todaySessionCount, 'Bugünkü ders', 'deneme-dersi-yoneticisi-planlanmis-dersler.html?today=1') +
        metric(m.todayStudentCount, 'Bugünkü öğrenci', 'deneme-dersi-yoneticisi-planlanmis-dersler.html') +
        metric(m.pendingApprovalCount, 'Onay bekleyen', 'deneme-dersi-yoneticisi-iletisim.html?tab=pending', 'warn') +
        metric(m.linkNotSentCount, 'Link gönderilmemiş', 'deneme-dersi-yoneticisi-iletisim.html?tab=link', 'warn') +
        metric(m.orphanRequestCount, 'Rezervasyonsuz talep', 'deneme-dersi-yoneticisi-rezervasyonlar.html?filter=orphan', 'warn') +
        metric(m.newRequestCount, 'Yeni web talebi', 'deneme-dersi-yoneticisi-rezervasyonlar.html?status=new', 'warn') +
        metric(m.teacherNotInformedCount, 'Öğretmen bilgilendirilmemiş', 'deneme-dersi-yoneticisi-iletisim.html', 'warn') +
        metric(m.cancelledCount, 'İptal edilen ders', 'deneme-dersi-yoneticisi-planlanmis-dersler.html?status=cancelled', 'danger') +
        metric(m.needsAttendanceCount, 'Katılım girilmemiş', 'deneme-dersi-yoneticisi-planlanmis-dersler.html?needsAttendance=1', 'warn') +
        metric(m.conversionCount, 'Kayıta dönüşüm', 'deneme-dersi-yoneticisi-ogrenciler.html');
    }

    renderTodayLessons(m.todaySessions);
    renderActions(m);
    renderAlerts(m);
    revealActionsFromHash();
    if (loading) loading.hidden = true;
    if (root) root.hidden = false;
    } catch (err) {
      if (loading) {
        loading.hidden = false;
        loading.textContent = 'Özet yüklenemedi: ' + (err.message || err);
      }
      console.error(err);
    }
  }

  function metric(val, label, href, tone) {
    var cls = 'tm-metric' + (tone ? ' is-' + tone : '');
    var inner = '<span class="tm-metric-value">' + val + '</span><span class="tm-metric-label">' + U.escapeHtml(label) + '</span>';
    return href ? '<a class="' + cls + '" href="' + href + '">' + inner + '</a>' : '<div class="' + cls + '">' + inner + '</div>';
  }

  function reservationDetailHref(r) {
    if (r && r.requestId) {
      return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(r.requestId);
    }
    return 'deneme-dersi-yoneticisi-rezervasyonlar.html';
  }

  function renderTodayLessons(sessions) {
    var wrap = document.getElementById('tmTodayLessons');
    if (!wrap) return;
    if (!sessions.length) {
      wrap.innerHTML = '<p class="tm-empty">Bugün planlanmış ders yok.</p>';
      return;
    }
    var rows = sessions.map(function (s) {
      var d = Store.getSessionWithDetails(s.id);
      var lt = d.lessonType ? d.lessonType.name : '—';
      var teacher = d.teacher ? U.fullName(d.teacher.firstName, d.teacher.lastName) : '—';
      var cap = s.enrolledStudentIds.length + '/20';
      var linkOk = d.meeting && d.meeting.status === 'active';
      return '<tr data-session="' + s.id + '" style="cursor:pointer">' +
        '<td>' + s.startTime + '</td><td>' + lt + '</td><td>' + U.escapeHtml(teacher) + '</td>' +
        '<td>' + cap + '</td><td>' + s.enrolledStudentIds.length + '</td>' +
        '<td>' + (linkOk ? '<span class="tm-badge tm-badge--green">Aktif</span>' : '<span class="tm-badge tm-badge--red">Pasif</span>') + '</td>' +
        '<td>' + (s.teacherInformed ? 'Evet' : 'Hayır') + '</td>' +
        '<td>' + SL.sessionBadge(s.status) + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-open-session="' + s.id + '">Detay</button></td></tr>';
    }).join('');
    wrap.innerHTML = '<table class="tm-inner-table"><thead><tr><th>Saat</th><th>Ders</th><th>Öğretmen</th><th>Kapasite</th><th>Öğrenci</th><th>Link</th><th>Öğrt.bilgi</th><th>Durum</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    wrap.querySelectorAll('[data-open-session]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-open-session'));
      });
    });
    wrap.querySelectorAll('tr[data-session]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        if (window.TMSessionDetail) window.TMSessionDetail.open(tr.getAttribute('data-session'));
      });
    });
  }

  function renderActions(m) {
    var list = document.getElementById('tmDashActionsList');
    var panel = document.getElementById('tmDashActions');
    if (!list) return;
    var items = [];
    m.pendingApproval.slice(0, 5).forEach(function (r) {
      var st = Store.getStudentById(r.studentId);
      items.push({
        text: 'Veli onayı: ' + (st ? U.fullName(st.firstName, st.lastName) : r.id),
        requestId: r.requestId
      });
    });
    m.linkNotSent.slice(0, 3).forEach(function (r) {
      var st = Store.getStudentById(r.studentId);
      items.push({
        text: 'Link gönderilmedi: ' + (st ? U.fullName(st.firstName, st.lastName) : r.id),
        requestId: r.requestId
      });
    });
    m.teacherNotInformed.slice(0, 3).forEach(function (s) {
      items.push({ text: 'Öğretmen bilgilendir: ' + s.title, href: '#', sessionId: s.id });
    });
    m.orphanRequests.slice(0, 3).forEach(function (r) {
      items.push({
        text: 'Rezervasyonsuz: ' + r.studentFirstName + ' ' + r.studentLastName,
        requestId: r.id
      });
    });
    m.newRequests.slice(0, 3).forEach(function (r) {
      if (m.orphanRequests.some(function (o) { return o.id === r.id; })) return;
      items.push({
        text: 'Yeni talep: ' + r.studentFirstName + ' ' + r.studentLastName,
        requestId: r.id
      });
    });
    m.needsAttendance.slice(0, 3).forEach(function (s) {
      items.push({
        text: 'Katılım gir: ' + s.title,
        href: 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(s.id) + '&tab=4'
      });
    });
    if (!items.length) {
      if (panel) panel.hidden = true;
      return;
    }
    if (panel) panel.hidden = false;
    list.innerHTML = items.map(function (it) {
      if (it.sessionId) {
        return '<li class="tm-action-item"><span>' + U.escapeHtml(it.text) + '</span><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-session="' + it.sessionId + '">Aç</button></li>';
      }
      if (it.requestId) {
        return '<li class="tm-action-item"><span>' + U.escapeHtml(it.text) + '</span>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-open-request="' + it.requestId + '">Aç</button>' +
          '<a href="deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(it.requestId) + '" class="tm-panel-link" style="margin-left:8px">Tam sayfa</a></li>';
      }
      return '<li class="tm-action-item"><span>' + U.escapeHtml(it.text) + '</span><a href="' + it.href + '" class="tm-panel-link">Git →</a></li>';
    }).join('');
    list.querySelectorAll('[data-open-request]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var rid = btn.getAttribute('data-open-request');
        if (global.TMRequestDrawer) global.TMRequestDrawer.open(rid);
        else window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(rid);
      });
    });
    list.querySelectorAll('[data-session]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-session'));
      });
    });
  }

  function renderAlerts(m) {
    var wrap = document.getElementById('tmDashAlerts');
    if (!wrap) return;
    var alerts = [];
    Store.getSessions().forEach(function (s) {
      if (s.status === 'cancelled') return;
      if (s.enrolledStudentIds.length >= 20) {
        alerts.push({ msg: 'Kapasite dolu: ' + s.title, type: 'warn', sessionId: s.id });
      }
      var teacher = Store.getTeacherById(s.teacherId);
      if (teacher && !RulesEligible(s)) {
        alerts.push({ msg: 'Branş uyumsuzluğu: ' + s.title, type: 'danger', sessionId: s.id });
      }
    });
    if (!alerts.length) { wrap.innerHTML = '<p class="tm-empty">Çakışma veya uyarı yok.</p>'; return; }
    wrap.innerHTML = alerts.slice(0, 8).map(function (a) {
      var btn = a.sessionId ? ' <button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-alert-session="' + a.sessionId + '">Detay</button>' : '';
      return '<div class="tm-alert-row' + (a.type === 'danger' ? ' is-danger' : '') + '">' + U.escapeHtml(a.msg) + btn + '</div>';
    }).join('');
    wrap.querySelectorAll('[data-alert-session]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-alert-session'));
      });
    });
  }

  function RulesEligible(s) {
    var R = window.TMSchedulingRules;
    return R ? R.isTeacherEligibleForLessonType(s.teacherId, s.lessonTypeId) : true;
  }

  window.TMOnSessionChange = render;
  render();
  window.addEventListener('hashchange', revealActionsFromHash);
})();
