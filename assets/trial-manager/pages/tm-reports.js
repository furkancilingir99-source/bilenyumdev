/**
 * Raporlar — özet, dersler, öğretmenler, iletişim + export
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var startInput = document.getElementById('tmReportStart');
  var endInput = document.getElementById('tmReportEnd');
  var gridEl = document.getElementById('tmReportGrid');
  var tableEl = document.getElementById('tmReportTable');
  var tabsEl = document.getElementById('tmReportTabs');
  var activeTab = 'summary';

  function defaultDates() {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - 30);
    if (startInput) startInput.value = start.toISOString().slice(0, 10);
    if (endInput) endInput.value = end.toISOString().slice(0, 10);
  }

  function range() {
    return {
      start: startInput ? startInput.value : '',
      end: endInput ? endInput.value : ''
    };
  }

  function inRange(dateKey) {
    var r = range();
    if (!r.start || !r.end) return true;
    return dateKey >= r.start && dateKey <= r.end;
  }

  function sessionsInRange() {
    return Store.getSessions().filter(function (s) { return inRange(s.date); });
  }

  function reservationsInRange() {
    return Store.getReservations().filter(function (res) {
      var s = Store.getSessionById(res.sessionId);
      return s && inRange(s.date);
    });
  }

  function requestsInRange() {
    return Store.getRequests().filter(function (r) { return inRange(r.createdAt.slice(0, 10)); });
  }

  function commInRange() {
    return Store.getCommunicationLogs().filter(function (l) { return inRange(l.createdAt.slice(0, 10)); });
  }

  function computeSummary() {
    var sessions = sessionsInRange();
    var reservations = reservationsInRange();
    var requests = requestsInRange();
    var attended = reservations.filter(function (r) { return r.status === 'attended'; }).length;
    var noShow = reservations.filter(function (r) { return r.status === 'no_show'; }).length;
    var enrolled = reservations.filter(function (r) { return r.enrolled; }).length;
    var cancelled = reservations.filter(function (r) { return r.status === 'cancelled'; }).length;
    var confirmed = reservations.filter(function (r) { return r.status === 'confirmed' || r.status === 'attended'; }).length;
    var linkSent = reservations.filter(function (r) { return r.linkSent; }).length;
    var approved = reservations.filter(function (r) { return r.parentApprovalStatus === 'approved'; }).length;
    var matReq = requests.filter(function (r) { return r.requestedLessonTypeId === 'lt-mat'; }).length;
    var fenReq = requests.filter(function (r) { return r.requestedLessonTypeId === 'lt-fen'; }).length;
    var totalRes = reservations.length || 1;
    var completedSessions = sessions.filter(function (s) { return s.status === 'completed'; }).length;
    var orphanRequests = requests.filter(function (r) {
      return Store.isOrphanRequest ? Store.isOrphanRequest(r.id) : false;
    }).length;
    var newRequests = requests.filter(function (r) { return r.status === 'new'; }).length;
    return {
      sessionCount: sessions.length,
      completedSessions: completedSessions,
      requestCount: requests.length,
      newRequests: newRequests,
      orphanRequests: orphanRequests,
      confirmed: confirmed,
      cancelled: cancelled,
      attendanceRate: Math.round((attended / totalRes) * 100),
      noShowRate: Math.round((noShow / totalRes) * 100),
      conversionRate: Math.round((enrolled / totalRes) * 100),
      matReq: matReq,
      fenReq: fenReq,
      linkSentRate: Math.round((linkSent / totalRes) * 100),
      approvalRate: Math.round((approved / totalRes) * 100),
      unreachable: reservations.filter(function (r) { return r.parentApprovalStatus === 'unreachable'; }).length,
      callAgain: reservations.filter(function (r) { return r.parentApprovalStatus === 'call_again'; }).length,
      avgFill: sessions.length ? Math.round(sessions.reduce(function (a, s) {
        return a + (s.enrolledStudentIds || []).length;
      }, 0) / sessions.length) : 0
    };
  }

  function dailyRows() {
    var map = {};
    sessionsInRange().forEach(function (s) {
      if (!map[s.date]) map[s.date] = { date: s.date, sessions: 0, students: 0, cancelled: 0 };
      map[s.date].sessions += 1;
      map[s.date].students += (s.enrolledStudentIds || []).length;
      if (s.status === 'cancelled') map[s.date].cancelled += 1;
    });
    return Object.keys(map).sort().map(function (k) { return map[k]; });
  }

  function teacherRows() {
    var map = {};
    sessionsInRange().forEach(function (s) {
      if (!map[s.teacherId]) {
        var t = Store.getTeacherById(s.teacherId);
        map[s.teacherId] = {
          teacherId: s.teacherId,
          name: t ? U.fullName(t.firstName, t.lastName) : s.teacherId,
          sessions: 0,
          students: 0,
          cancelled: 0,
          informed: 0
        };
      }
      map[s.teacherId].sessions += 1;
      map[s.teacherId].students += (s.enrolledStudentIds || []).length;
      if (s.status === 'cancelled') map[s.teacherId].cancelled += 1;
      if (s.teacherInformed) map[s.teacherId].informed += 1;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.sessions - a.sessions; });
  }

  function sessionRows() {
    return sessionsInRange().map(function (s) {
      var d = Store.getSessionWithDetails(s.id);
      return {
        id: s.id,
        date: s.date,
        time: s.startTime,
        lesson: d.lessonType ? d.lessonType.name : '—',
        teacher: d.teacher ? U.fullName(d.teacher.firstName, d.teacher.lastName) : '—',
        enrolled: (s.enrolledStudentIds || []).length,
        status: SL.sessionLabel(s.status),
        informed: s.teacherInformed ? 'Evet' : 'Hayır'
      };
    });
  }

  function commRows() {
    return commInRange().map(function (l) {
      return {
        date: l.createdAt.slice(0, 10),
        channel: SL.COMM_CHANNEL[l.channel] || l.channel,
        result: SL.COMM_RESULT[l.result] || l.result,
        summary: l.summary
      };
    });
  }

  function card(value, label, tone) {
    var cls = 'tm-report-card' + (tone ? ' is-' + tone : '');
    return '<div class="' + cls + '"><div class="tm-report-card-value">' + value + '</div><div class="tm-report-card-label">' + U.escapeHtml(label) + '</div></div>';
  }

  function renderSummary() {
    if (!gridEl) return;
    var m = computeSummary();
    gridEl.hidden = false;
    gridEl.innerHTML =
      card(m.sessionCount, 'Toplam deneme dersi') +
      card(m.completedSessions, 'Tamamlanan ders') +
      card(m.requestCount, 'Rezervasyon talebi') +
      card(m.newRequests, 'Yeni talep', m.newRequests ? 'warn' : '') +
      card(m.orphanRequests, 'Rezervasyonsuz talep', m.orphanRequests ? 'warn' : '') +
      card(m.confirmed, 'Onaylanan rezervasyon', 'ok') +
      card(m.cancelled, 'İptal edilen', 'danger') +
      card(m.attendanceRate + '%', 'Katılım oranı') +
      card(m.noShowRate + '%', 'Gelmeme oranı', 'warn') +
      card(m.conversionRate + '%', 'Kayıta dönüşüm', 'ok') +
      card(m.avgFill, 'Ort. doluluk / ders') +
      card(m.matReq + ' / ' + m.fenReq, 'Mat / Fen talep') +
      card(m.linkSentRate + '%', 'Link gönderim oranı') +
      card(m.approvalRate + '%', 'Veli onay oranı') +
      card(m.unreachable, 'Ulaşılamayan veli', 'warn') +
      card(m.callAgain, 'Tekrar aranacak', 'warn');
  }

  function tableHtml(headers, rows) {
    if (!rows.length) return '<p class="tm-empty">Seçilen aralıkta veri yok.</p>';
    var head = headers.map(function (h) { return '<th>' + U.escapeHtml(h) + '</th>'; }).join('');
    var body = rows.map(function (row) {
      return '<tr>' + row.map(function (cell) { return '<td>' + U.escapeHtml(String(cell)) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<div class="tm-res-table-wrap"><table class="tm-res-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function renderTable() {
    if (!tableEl) return;
    tableEl.hidden = false;
    if (activeTab === 'daily') {
      var daily = dailyRows();
      tableEl.innerHTML = tableHtml(
        ['Tarih', 'Ders sayısı', 'Öğrenci', 'İptal'],
        daily.map(function (d) { return [U.formatDateKey(d.date), d.sessions, d.students, d.cancelled]; })
      );
    } else if (activeTab === 'teachers') {
      var teachers = teacherRows();
      tableEl.innerHTML = tableHtml(
        ['Öğretmen', 'Ders', 'Öğrenci', 'İptal', 'Bilgilendirildi'],
        teachers.map(function (t) { return [t.name, t.sessions, t.students, t.cancelled, t.informed]; })
      );
    } else if (activeTab === 'sessions') {
      var sessions = sessionRows();
      tableEl.innerHTML = tableHtml(
        ['Tarih', 'Saat', 'Ders', 'Öğretmen', 'Öğrenci', 'Durum', 'Öğrt.bilgi'],
        sessions.map(function (s) {
          return [U.formatDateKey(s.date), s.time, s.lesson, s.teacher, s.enrolled, s.status, s.informed];
        })
      );
    } else if (activeTab === 'comm') {
      var logs = commRows();
      tableEl.innerHTML = tableHtml(
        ['Tarih', 'Kanal', 'Sonuç', 'Özet'],
        logs.map(function (l) { return [U.formatDateKey(l.date), l.channel, l.result, l.summary]; })
      );
    } else {
      tableEl.hidden = true;
      tableEl.innerHTML = '';
    }
  }

  function renderTabs() {
    if (!tabsEl) return;
    var tabs = [
      { id: 'summary', label: 'Özet' },
      { id: 'daily', label: 'Günlük' },
      { id: 'sessions', label: 'Dersler' },
      { id: 'teachers', label: 'Öğretmenler' },
      { id: 'comm', label: 'İletişim' }
    ];
    tabsEl.innerHTML = tabs.map(function (t) {
      return '<button type="button" class="tm-comm-tab' + (activeTab === t.id ? ' is-active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');
    tabsEl.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.getAttribute('data-tab');
        renderTabs();
        render();
      });
    });
  }

  function render() {
    try {
      if (activeTab === 'summary') {
        renderSummary();
        if (tableEl) { tableEl.hidden = true; tableEl.innerHTML = ''; }
      } else {
        if (gridEl) gridEl.hidden = true;
        renderTable();
      }
    } catch (err) {
      if (gridEl) gridEl.innerHTML = '<p class="tm-empty">Rapor yüklenemedi: ' + U.escapeHtml(err.message) + '</p>';
      console.error(err);
    }
  }

  var SUMMARY_COLUMNS = [
    { key: 'sessionCount', label: 'Ders sayısı' },
    { key: 'completedSessions', label: 'Tamamlanan ders' },
    { key: 'requestCount', label: 'Talep sayısı' },
    { key: 'newRequests', label: 'Yeni talep' },
    { key: 'orphanRequests', label: 'Rezervasyonsuz talep' },
    { key: 'confirmed', label: 'Onaylanan' },
    { key: 'cancelled', label: 'İptal edilen' },
    { key: 'attendanceRate', label: 'Katılım %' },
    { key: 'noShowRate', label: 'Gelmeme %' },
    { key: 'conversionRate', label: 'Dönüşüm %' },
    { key: 'avgFill', label: 'Ort. doluluk' },
    { key: 'matReq', label: 'Mat talep' },
    { key: 'fenReq', label: 'Fen talep' },
    { key: 'linkSentRate', label: 'Link %' },
    { key: 'approvalRate', label: 'Onay %' },
    { key: 'unreachable', label: 'Ulaşılamayan' },
    { key: 'callAgain', label: 'Tekrar aranacak' }
  ];

  function exportSummaryCsv() {
    if (!Export) return;
    if (Perms && !Perms.guard('export')) return;
    Export.exportTable('rapor-ozet.csv', [computeSummary()], SUMMARY_COLUMNS);
  }

  function exportExcelPack() {
    if (!Export || !Export.exportExcelWorkbook) return;
    if (Perms && !Perms.guard('export')) return;
    var summary = computeSummary();
    Export.exportExcelWorkbook('deneme-dersi-raporu.xls', [
      {
        name: 'Özet',
        rows: [summary],
        columns: SUMMARY_COLUMNS
      },
      {
        name: 'Günlük',
        rows: dailyRows(),
        columns: [
          { key: 'date', label: 'Tarih' },
          { key: 'sessions', label: 'Ders' },
          { key: 'students', label: 'Öğrenci' },
          { key: 'cancelled', label: 'İptal' }
        ]
      },
      {
        name: 'Dersler',
        rows: sessionRows(),
        columns: [
          { key: 'date', label: 'Tarih' },
          { key: 'time', label: 'Saat' },
          { key: 'lesson', label: 'Ders türü' },
          { key: 'teacher', label: 'Öğretmen' },
          { key: 'enrolled', label: 'Öğrenci' },
          { key: 'status', label: 'Durum' },
          { key: 'informed', label: 'Öğrt.bilgi' }
        ]
      },
      {
        name: 'Öğretmenler',
        rows: teacherRows(),
        columns: [
          { key: 'name', label: 'Öğretmen' },
          { key: 'sessions', label: 'Ders' },
          { key: 'students', label: 'Öğrenci' },
          { key: 'cancelled', label: 'İptal' },
          { key: 'informed', label: 'Bilgilendirildi' }
        ]
      },
      {
        name: 'İletişim',
        rows: commRows(),
        columns: [
          { key: 'date', label: 'Tarih' },
          { key: 'channel', label: 'Kanal' },
          { key: 'result', label: 'Sonuç' },
          { key: 'summary', label: 'Özet' }
        ]
      }
    ]);
  }

  window.TMOnSessionChange = render;

  defaultDates();
  renderTabs();
  render();

  if (startInput) startInput.addEventListener('change', render);
  if (endInput) endInput.addEventListener('change', render);

  var csvBtn = document.getElementById('tmReportExportCsv');
  var xlsBtn = document.getElementById('tmReportExportXls');
  if (csvBtn) csvBtn.addEventListener('click', exportSummaryCsv);
  if (xlsBtn) xlsBtn.addEventListener('click', exportExcelPack);
})();
