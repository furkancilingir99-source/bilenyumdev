(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  var Planner = window.TrialLessonPlannerMock;
  if (!Mock) return;

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  var loading = document.getElementById('tmDashLoading');
  var root = document.getElementById('tmDashRoot');
  var statsEl = document.getElementById('tmDashStats');
  var actionsPanel = document.getElementById('tmDashActions');
  var actionsList = document.getElementById('tmDashActionsList');
  var recentWrap = document.getElementById('tmRecentWrap');
  var upcomingWrap = document.getElementById('tmUpcomingWrap');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatCreatedAt(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + h + ':' + m;
  }

  function formatSlotDate(dateKey) {
    if (!dateKey) return '—';
    var parts = dateKey.split('-');
    if (parts.length !== 3) return dateKey;
    return parseInt(parts[2], 10) + ' ' + MONTHS[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
  }

  function studentName(r) {
    return r.studentFirstName + ' ' + r.studentLastName;
  }

  function reservationDetailUrl(id) {
    return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
  }

  function lessonDetailUrl(id) {
    return 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(id);
  }

  function lessonEditUrl(id) {
    return 'deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(id);
  }

  function assignedReservationIds() {
    if (!Planner) return {};
    var map = {};
    Planner.getPlannedLessons().forEach(function (l) {
      l.studentIds.forEach(function (id) { map[id] = true; });
    });
    return map;
  }

  function computeMetrics() {
    var reservations = Mock.getReservations();
    var planned = Planner ? Planner.getPlannedLessons() : [];
    var assigned = assignedReservationIds();
    var today = todayKey();

    var pending = reservations.filter(function (r) { return r.status === 'pending'; });
    var unassigned = reservations.filter(function (r) {
      return r.status !== 'cancelled' && !assigned[r.id];
    });
    var slotIssues = reservations.filter(function (r) {
      return r.status !== 'cancelled' && !r.slotConfirmedByParent;
    });

    var todayLessons = planned.filter(function (l) { return l.slotDateKey === today; });
    var conflictLessons = Planner
      ? planned.filter(function (l) { return Planner.checkConflicts(l).length; })
      : [];

    return {
      totalReservations: reservations.length,
      pendingCount: pending.length,
      confirmedCount: reservations.filter(function (r) { return r.status === 'confirmed'; }).length,
      plannedCount: planned.length,
      todayLessonCount: todayLessons.length,
      unassignedCount: unassigned.length,
      slotIssueCount: slotIssues.length,
      conflictCount: conflictLessons.length,
      pending: pending,
      unassigned: unassigned,
      slotIssues: slotIssues,
      conflictLessons: conflictLessons,
      planned: planned,
      reservations: reservations
    };
  }

  function buildActionItems(metrics) {
    var items = [];

    metrics.conflictLessons.forEach(function (l) {
      var teacher = Planner.getTeacherById(l.teacherId);
      items.push({
        kind: 'conflict',
        label: l.id,
        meta: l.subject + ' · ' + l.grade + ' · ' + (teacher ? teacher.name : '—'),
        href: lessonEditUrl(l.id),
        action: 'Düzenle'
      });
    });

    metrics.pending.slice(0, 6).forEach(function (r) {
      items.push({
        kind: 'pending',
        label: studentName(r),
        meta: r.id + ' · ' + r.grade + ' · ' + r.subject + ' · ' + r.slotLabel,
        href: reservationDetailUrl(r.id),
        action: 'Detay'
      });
    });

    metrics.slotIssues.forEach(function (r) {
      if (r.status === 'pending') return;
      if (items.length >= 10) return;
      items.push({
        kind: 'slot',
        label: studentName(r),
        meta: r.id + ' · veli slot onayı bekleniyor · ' + r.slotLabel,
        href: reservationDetailUrl(r.id),
        action: 'Detay'
      });
    });

    metrics.unassigned.slice(0, 4).forEach(function (r) {
      if (r.status === 'cancelled' || r.status === 'pending') return;
      if (items.length >= 12) return;
      items.push({
        kind: 'unassigned',
        label: studentName(r),
        meta: r.id + ' · planlı derse atanmadı',
        href: 'deneme-dersi-yoneticisi-ders-planla.html',
        action: 'Planla'
      });
    });

    return items.slice(0, 10);
  }

  function renderStats(metrics) {
    if (!statsEl) return;
    var stats = [
      { label: 'Toplam başvuru', value: metrics.totalReservations, href: 'deneme-dersi-yoneticisi-rezervasyonlar.html', tone: '' },
      { label: 'Onay bekleyen', value: metrics.pendingCount, href: 'deneme-dersi-yoneticisi-rezervasyonlar.html', tone: metrics.pendingCount ? 'is-warn' : '' },
      { label: 'Planlanmış ders', value: metrics.plannedCount, href: 'deneme-dersi-yoneticisi-planlanmis-dersler.html', tone: '' },
      { label: 'Bugünkü ders', value: metrics.todayLessonCount, href: 'deneme-dersi-yoneticisi-planlanmis-dersler.html', tone: metrics.todayLessonCount ? 'is-accent' : '' },
      { label: 'Derse atanmamış', value: metrics.unassignedCount, href: 'deneme-dersi-yoneticisi-rezervasyonlar.html', tone: metrics.unassignedCount ? 'is-warn' : '' },
      { label: 'Çakışmalı ders', value: metrics.conflictCount, href: 'deneme-dersi-yoneticisi-planlanmis-dersler.html', tone: metrics.conflictCount ? 'is-danger' : '' }
    ];

    statsEl.innerHTML = stats.map(function (s) {
      return (
        '<a class="tm-dash-stat' + (s.tone ? ' ' + s.tone : '') + '" href="' + escapeHtml(s.href) + '">' +
          '<span class="tm-dash-stat-label">' + escapeHtml(s.label) + '</span>' +
          '<span class="tm-dash-stat-value">' + s.value + '</span>' +
        '</a>'
      );
    }).join('');
  }

  function renderActions(items) {
    if (!actionsPanel || !actionsList) return;
    if (!items.length) {
      actionsPanel.hidden = true;
      return;
    }
    actionsPanel.hidden = false;
    actionsList.innerHTML = items.map(function (item) {
      var badge = item.kind === 'conflict' ? 'Çakışma'
        : item.kind === 'pending' ? 'Onay'
        : item.kind === 'slot' ? 'Slot'
        : 'Atama';
      return (
        '<li class="tm-dash-action-item is-' + escapeHtml(item.kind) + '">' +
          '<span class="tm-dash-action-badge">' + badge + '</span>' +
          '<div class="tm-dash-action-body">' +
            '<strong class="tm-dash-action-label">' + escapeHtml(item.label) + '</strong>' +
            '<span class="tm-dash-action-meta">' + escapeHtml(item.meta) + '</span>' +
          '</div>' +
          '<a class="tm-dash-action-link" href="' + escapeHtml(item.href) + '">' + escapeHtml(item.action) + '</a>' +
        '</li>'
      );
    }).join('');
  }

  function renderRecentTable(rows) {
    if (!recentWrap) return;
    var recent = rows.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }).slice(0, 6);

    if (!recent.length) {
      recentWrap.innerHTML = '<p class="tm-dash-empty">Henüz başvuru yok.</p>';
      return;
    }

    recentWrap.innerHTML =
      '<div class="tm-dash-table-wrap">' +
        '<table class="tm-dash-table">' +
          '<thead><tr>' +
            '<th>ID</th><th>Öğrenci</th><th>Sınıf / Ders</th><th>Kayıt</th><th>Durum</th><th></th>' +
          '</tr></thead>' +
          '<tbody>' +
            recent.map(function (r) {
              return (
                '<tr>' +
                  '<td><span class="tm-record-id">' + escapeHtml(r.id) + '</span></td>' +
                  '<td><strong>' + escapeHtml(studentName(r)) + '</strong></td>' +
                  '<td>' + escapeHtml(r.grade) + ' · ' + escapeHtml(r.subject) + '</td>' +
                  '<td class="tm-cell-date">' + escapeHtml(formatCreatedAt(r.createdAt)) + '</td>' +
                  '<td><span class="tm-status is-' + escapeHtml(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></td>' +
                  '<td><a class="tm-dash-row-link" href="' + reservationDetailUrl(r.id) + '">Detay</a></td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  function renderUpcomingTable(lessons) {
    if (!upcomingWrap) return;
    var today = todayKey();
    var upcoming = lessons.slice().filter(function (l) {
      return l.slotDateKey >= today;
    }).sort(function (a, b) {
      var c = a.slotDateKey.localeCompare(b.slotDateKey);
      if (c !== 0) return c;
      return (a.slotTime || '').localeCompare(b.slotTime || '');
    }).slice(0, 6);

    if (!upcoming.length) {
      upcomingWrap.innerHTML = '<p class="tm-dash-empty">Yaklaşan planlı ders yok.</p>';
      return;
    }

    upcomingWrap.innerHTML =
      '<div class="tm-dash-table-wrap">' +
        '<table class="tm-dash-table">' +
          '<thead><tr>' +
            '<th>Ders ID</th><th>Branş</th><th>Öğretmen</th><th>Tarih / Saat</th><th>Öğrenci</th><th></th>' +
          '</tr></thead>' +
          '<tbody>' +
            upcoming.map(function (l) {
              var teacher = Planner ? Planner.getTeacherById(l.teacherId) : null;
              var conflicts = Planner ? Planner.checkConflicts(l).length : 0;
              return (
                '<tr' + (conflicts ? ' class="is-highlight"' : '') + '>' +
                  '<td><span class="tm-record-id">' + escapeHtml(l.id) + '</span></td>' +
                  '<td>' + escapeHtml(l.subject) + ' · ' + escapeHtml(l.grade) + '</td>' +
                  '<td>' + escapeHtml(teacher ? teacher.name : '—') + '</td>' +
                  '<td>' + escapeHtml(formatSlotDate(l.slotDateKey)) + ' · ' + escapeHtml(l.slotTime || '—') + '</td>' +
                  '<td>' + l.studentIds.length + '</td>' +
                  '<td><a class="tm-dash-row-link" href="' + lessonDetailUrl(l.id) + '">Detay</a></td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>';
  }

  function init() {
    var metrics = computeMetrics();
    renderStats(metrics);
    renderActions(buildActionItems(metrics));
    renderRecentTable(metrics.reservations);
    renderUpcomingTable(metrics.planned);
    if (loading) loading.hidden = true;
    if (root) root.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
