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
        metric(m.teacherNotInformedCount, 'Öğretmen bilgilendirilmemiş', 'deneme-dersi-yoneticisi-iletisim.html?tab=pdr_teacher', 'warn') +
        metric(m.missingTeacherAssignmentCount || 0, 'Eksik öğretmen ataması', 'deneme-dersi-yoneticisi-planlanmis-dersler.html?missingTeachers=1', 'warn') +
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
      var pdrName = d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—';
      var branchName = d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—';
      var cap = s.enrolledStudentIds.length + '/20';
      var linkOk = d.meeting && d.meeting.status === 'active';
      return '<tr data-session="' + s.id + '" style="cursor:pointer">' +
        '<td>' + s.startTime + '</td><td>' + lt + '</td>' +
        '<td>' + U.escapeHtml(pdrName) + ' / ' + U.escapeHtml(branchName) + '</td>' +
        '<td>' + cap + '</td><td>' + s.enrolledStudentIds.length + '</td>' +
        '<td>' + (linkOk ? '<span class="tm-badge tm-badge--green">Aktif</span>' : '<span class="tm-badge tm-badge--red">Pasif</span>') + '</td>' +
        '<td>' + (s.pdrTeacherInformed && s.branchTeacherInformed ? 'Evet' : 'Kısmi/Hayır') + '</td>' +
        '<td>' + SL.sessionBadge(s.status) + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-open-session="' + s.id + '">Detay</button></td></tr>';
    }).join('');
    wrap.innerHTML = '<div class="tm-res-table-wrap"><table class="tm-inner-table"><thead><tr><th>Saat</th><th>Ders</th><th>PDR / Branş</th><th>Kapasite</th><th>Öğrenci</th><th>Link</th><th>Öğrt.bilgi</th><th>Durum</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
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

  function openAction(a) {
    if (!a) return;
    if (a.kind === 'request') {
      if (window.TMRequestDrawer && window.TMRequestDrawer.open) window.TMRequestDrawer.open(a.id);
      else window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(a.id);
    } else if (a.kind === 'session') {
      if (window.TMSessionDetail && window.TMSessionDetail.open) window.TMSessionDetail.open(a.id);
      else window.location.href = 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(a.id) + (a.tab != null ? '&tab=' + a.tab : '');
    }
  }

  function renderActions(m) {
    var list = document.getElementById('tmDashActionsList');
    var panel = document.getElementById('tmDashActions');
    if (!list) return;
    var items = [];
    function push(cat, tone, text, action) { items.push({ cat: cat, tone: tone, text: text, action: action }); }

    m.orphanRequests.slice(0, 4).forEach(function (r) {
      push('Talep', 'danger', 'Rezervasyonsuz talep · ' + r.studentFirstName + ' ' + r.studentLastName, { kind: 'request', id: r.id });
    });
    m.newRequests.slice(0, 3).forEach(function (r) {
      if (m.orphanRequests.some(function (o) { return o.id === r.id; })) return;
      push('Talep', 'info', 'Yeni talep · ' + r.studentFirstName + ' ' + r.studentLastName, { kind: 'request', id: r.id });
    });
    m.pendingApproval.slice(0, 5).forEach(function (r) {
      var st = Store.getStudentById(r.studentId);
      push('Veli onayı', 'warn', 'Onay bekliyor · ' + (st ? U.fullName(st.firstName, st.lastName) : r.id), { kind: 'request', id: r.requestId });
    });
    m.linkNotSent.slice(0, 3).forEach(function (r) {
      var st = Store.getStudentById(r.studentId);
      push('Link', 'warn', 'Link gönderilmedi · ' + (st ? U.fullName(st.firstName, st.lastName) : r.id), { kind: 'request', id: r.requestId });
    });
    var pdrList = (m.pdrNotInformed && m.pdrNotInformed.slice(0, 2)) || [];
    var brList = (m.branchNotInformed && m.branchNotInformed.slice(0, 2)) || [];
    if (!pdrList.length && !brList.length) pdrList = (m.teacherNotInformed || []).slice(0, 3);
    pdrList.forEach(function (s) { push('Öğretmen', 'warn', 'PDR bilgilendir · ' + s.title, { kind: 'session', id: s.id }); });
    brList.forEach(function (s) { push('Öğretmen', 'warn', 'Branş bilgilendir · ' + s.title, { kind: 'session', id: s.id }); });
    m.needsAttendance.slice(0, 3).forEach(function (s) {
      push('Katılım', 'info', 'Katılım gir · ' + s.title, { kind: 'session', id: s.id, tab: 4 });
    });

    if (!items.length) {
      if (panel) panel.hidden = true;
      return;
    }
    if (panel) panel.hidden = false;
    var toneCls = { danger: 'is-danger', warn: 'is-warn', info: 'is-info' };
    list.innerHTML = items.map(function (it, i) {
      return '<li class="tm-action-item" data-act-idx="' + i + '" role="button" tabindex="0">' +
        '<span class="tm-action-chip ' + (toneCls[it.tone] || '') + '">' + U.escapeHtml(it.cat) + '</span>' +
        '<span class="tm-action-text">' + U.escapeHtml(it.text) + '</span>' +
        '<span class="tm-action-open">Aç →</span>' +
      '</li>';
    }).join('');
    list.querySelectorAll('[data-act-idx]').forEach(function (row) {
      var handler = function () {
        var it = items[parseInt(row.getAttribute('data-act-idx'), 10)];
        if (it) openAction(it.action);
      };
      row.addEventListener('click', handler);
      row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); } });
    });
  }

  function renderAlerts(m) {
    var wrap = document.getElementById('tmDashAlerts');
    if (!wrap) return;
    var alerts = [];
    var R = window.TMSchedulingRules;
    var conflictKeys = {};
    Store.getSessions().forEach(function (s) {
      if (s.status === 'cancelled') return;
      if (s.enrolledStudentIds.length >= 20) {
        alerts.push({ msg: 'Kapasite dolu: ' + s.title, type: 'warn', sessionId: s.id });
      }
      if (!s.pdrTeacherId || !s.branchTeacherId) {
        alerts.push({ msg: 'Eksik öğretmen ataması: ' + s.title, type: 'danger', sessionId: s.id });
      }
      var pdr = Store.getTeacherById(s.pdrTeacherId);
      var branch = Store.getTeacherById(s.branchTeacherId);
      if (branch && !RulesEligibleBranch(s)) {
        alerts.push({ msg: 'Branş uyumsuzluğu: ' + s.title, type: 'danger', sessionId: s.id });
      }
      if (pdr && R && !R.isTeacherPdr(s.pdrTeacherId)) {
        alerts.push({ msg: 'PDR rolü uyumsuz: ' + s.title, type: 'danger', sessionId: s.id });
      }
      [pdr, branch].forEach(function (teacher) {
        if (!teacher) return;
        var tid = teacher.id;
        if (R && R.hasTeacherConflict(tid, s.date, s.startTime, s.endTime, s.id)) {
          var ckey = tid + '|' + s.date + '|' + s.startTime;
          if (!conflictKeys[ckey]) {
            conflictKeys[ckey] = true;
            alerts.push({
              msg: 'Öğretmen çakışması: ' + U.fullName(teacher.firstName, teacher.lastName) + ' · ' + U.formatDateKey(s.date) + ' ' + s.startTime,
              type: 'danger',
              sessionId: s.id
            });
          }
        }
        if (R && !R.isTeacherAvailable(tid, s.date, s.startTime, s.endTime)) {
          alerts.push({
            msg: 'Müsaitlik dışı ders: ' + U.fullName(teacher.firstName, teacher.lastName) + ' · ' + U.formatDateKey(s.date) + ' ' + s.startTime,
            type: 'warn',
            sessionId: s.id,
            teacherId: tid
          });
        }
      });
      if (s.pdrTeacherId && s.branchTeacherId && s.pdrTeacherId === s.branchTeacherId) {
        alerts.push({ msg: 'PDR ve branş aynı kişi: ' + s.title, type: 'danger', sessionId: s.id });
      }
    });
    Store.getReservations().forEach(function (r) {
      if (r.status === 'cancelled') return;
      var pa = Store.getParentById(r.parentId);
      if (pa && (!pa.phone || !pa.email)) {
        var st = Store.getStudentById(r.studentId);
        alerts.push({
          msg: 'Eksik veli iletişim: ' + (st ? U.fullName(st.firstName, st.lastName) : r.studentId),
          type: 'warn',
          sessionId: r.sessionId
        });
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

  function RulesEligibleBranch(s) {
    var R = window.TMSchedulingRules;
    return R ? R.isBranchTeacherEligibleForLessonType(s.branchTeacherId, s.lessonTypeId) : true;
  }

  window.TMOnSessionChange = render;
  render();
  window.addEventListener('hashchange', revealActionsFromHash);
})();
