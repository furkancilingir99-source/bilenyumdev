/**
 * Raporlar — özet, dersler, öğretmenler, iletişim + export
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
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

  function auditInRange() {
    return Store.getAuditLogs().filter(function (l) { return inRange(l.createdAt.slice(0, 10)); });
  }

  function userLabel(userId) {
    if (!userId) return '—';
    var u = Store.getUsers().find(function (x) { return x.id === userId; });
    return u ? U.fullName(u.firstName, u.lastName) : userId;
  }

  function auditRows() {
    return auditInRange().map(function (l) {
      return {
        date: l.createdAt,
        rawEntityType: l.entityType,
        entityType: SL.auditEntityLabel(l.entityType),
        entityId: l.entityId,
        action: SL.auditActionLabel(l.action),
        description: l.description || '',
        reason: l.reason || '',
        user: userLabel(l.createdByUserId)
      };
    });
  }

  function openAuditEntity(rawType, entityId) {
    if (window.TMAuditActions) window.TMAuditActions.openEntity(rawType, entityId);
  }

  function bindAuditTableActions() {
    if (!tableEl || activeTab !== 'audit') return;
    tableEl.querySelectorAll('[data-audit-entity]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openAuditEntity(btn.getAttribute('data-entity-type'), btn.getAttribute('data-entity-id'));
      });
    });
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
    var pdrInformedRate = sessions.length ? Math.round((sessions.filter(function (s) { return s.pdrTeacherInformed; }).length / sessions.length) * 100) : 0;
    var branchInformedRate = sessions.length ? Math.round((sessions.filter(function (s) { return s.branchTeacherInformed; }).length / sessions.length) * 100) : 0;
    var missingTeachers = sessions.filter(function (s) { return !s.pdrTeacherId || !s.branchTeacherId; }).length;
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
      }, 0) / sessions.length) : 0,
      pdrInformedRate: pdrInformedRate,
      branchInformedRate: branchInformedRate,
      missingTeacherAssignments: missingTeachers
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

  function addTeacherMetric(map, teacherId, session, role) {
    if (!teacherId) return;
    if (!map[teacherId]) {
      var t = Store.getTeacherById(teacherId);
      map[teacherId] = {
        teacherId: teacherId,
        name: t ? U.fullName(t.firstName, t.lastName) : teacherId,
        teacherType: t ? SL.teacherTypeLabel(t.teacherType) : '—',
        sessions: 0,
        students: 0,
        cancelled: 0,
        informed: 0
      };
    }
    map[teacherId].sessions += 1;
    map[teacherId].students += (session.enrolledStudentIds || []).length;
    if (session.status === 'cancelled') map[teacherId].cancelled += 1;
    if (role === 'pdr' && session.pdrTeacherInformed) map[teacherId].informed += 1;
    if (role === 'branch' && session.branchTeacherInformed) map[teacherId].informed += 1;
  }

  function teacherRows() {
    var map = {};
    sessionsInRange().forEach(function (s) {
      addTeacherMetric(map, s.pdrTeacherId, s, 'pdr');
      addTeacherMetric(map, s.branchTeacherId, s, 'branch');
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.sessions - a.sessions; });
  }

  function sessionRows() {
    return sessionsInRange().map(function (s) {
      var d = Store.getSessionWithDetails(s.id);
      var pdrName = d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—';
      var branchName = d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—';
      return {
        id: s.id,
        date: s.date,
        time: s.startTime,
        lesson: d.lessonType ? d.lessonType.name : '—',
        pdrTeacher: pdrName,
        branchTeacher: branchName,
        enrolled: (s.enrolledStudentIds || []).length,
        status: SL.sessionLabel(s.status),
        pdrInformed: s.pdrTeacherInformed ? 'Evet' : 'Hayır',
        branchInformed: s.branchTeacherInformed ? 'Evet' : 'Hayır'
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
      card(m.callAgain, 'Tekrar aranacak', 'warn') +
      card(m.pdrInformedRate + '%', 'PDR bilgilendirme oranı') +
      card(m.branchInformedRate + '%', 'Branş bilgilendirme oranı') +
      card(m.missingTeacherAssignments, 'Eksik öğretmen ataması', m.missingTeacherAssignments ? 'warn' : '') +
      card(auditInRange().length, 'Denetim kaydı (aralık)');
    if (Store.getDataConsistencySnapshot) {
      var snap = Store.getDataConsistencySnapshot();
      var om = snap.metrics;
      gridEl.innerHTML += '<section class="tm-panel" style="margin-top:16px;grid-column:1/-1">' +
        '<div class="tm-panel-head"><h2 class="tm-panel-title">Veri tutarlılığı (anlık)</h2></div>' +
        '<div style="padding:12px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px">' +
        card(om.actionableCount, 'Aksiyon bekleyen (operasyon)') +
        card(om.orphanRequestCount, 'Rezervasyonsuz (operasyon)') +
        card(snap.enrolledStudents, 'Kayıtlı öğrenci (durum)') +
        card(om.conversionCount, 'Dönüşüm metriği') +
        '</div>' +
        (snap.issues.length
          ? '<p class="tm-alert-row is-danger" style="margin:0 16px 12px">' + snap.issues.join(' ') + '</p>'
          : '<p class="tm-empty" style="padding:0 16px 12px">Operasyon metrikleri ile öğrenci durumları tutarlı.</p>') +
        '</section>';
    }
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
        ['Öğretmen', 'Tip', 'Ders', 'Öğrenci', 'İptal', 'Bilgilendirildi'],
        teachers.map(function (t) { return [t.name, t.teacherType, t.sessions, t.students, t.cancelled, t.informed]; })
      );
    } else if (activeTab === 'sessions') {
      var sessions = sessionRows();
      tableEl.innerHTML = tableHtml(
        ['Tarih', 'Saat', 'Ders', 'PDR öğretmeni', 'Branş öğretmeni', 'Öğrenci', 'Durum', 'PDR bilgi', 'Branş bilgi'],
        sessions.map(function (s) {
          return [U.formatDateKey(s.date), s.time, s.lesson, s.pdrTeacher, s.branchTeacher, s.enrolled, s.status, s.pdrInformed, s.branchInformed];
        })
      );
    } else if (activeTab === 'comm') {
      var logs = commRows();
      tableEl.innerHTML = tableHtml(
        ['Tarih', 'Kanal', 'Sonuç', 'Özet'],
        logs.map(function (l) { return [U.formatDateKey(l.date), l.channel, l.result, l.summary]; })
      );
    } else if (activeTab === 'audit') {
      var audits = auditRows();
      if (!audits.length) {
        tableEl.innerHTML = '<p class="tm-empty">Seçilen aralıkta veri yok.</p>';
      } else {
        var head = ['Tarih', 'Varlık', 'Kayıt ID', 'İşlem', 'Açıklama', 'Neden', 'Kullanıcı'].map(function (h) {
          return '<th>' + U.escapeHtml(h) + '</th>';
        }).join('');
        var body = audits.map(function (l) {
          var idCell = '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-audit-entity data-entity-type="' +
            U.escapeHtml(l.rawEntityType) + '" data-entity-id="' + U.escapeHtml(l.entityId) + '">' + U.escapeHtml(l.entityId) + '</button>';
          return '<tr><td>' + U.formatDateTime(l.date) + '</td><td>' + U.escapeHtml(l.entityType) + '</td><td>' + idCell +
            '</td><td>' + U.escapeHtml(l.action) + '</td><td>' + U.escapeHtml(l.description) + '</td><td>' +
            U.escapeHtml(l.reason || '—') + '</td><td>' + U.escapeHtml(l.user) + '</td></tr>';
        }).join('');
        tableEl.innerHTML = '<div class="tm-res-table-wrap"><table class="tm-res-table"><thead><tr>' + head +
          '</tr></thead><tbody>' + body + '</tbody></table></div>';
        bindAuditTableActions();
      }
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
      { id: 'comm', label: 'İletişim' },
      { id: 'audit', label: 'Denetim' }
    ];
    tabsEl.innerHTML = tabs.map(function (t) {
      return '<button type="button" class="tm-comm-tab' + (activeTab === t.id ? ' is-active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');
    tabsEl.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.getAttribute('data-tab');
        renderTabs();
        render();
        updateTabExportButton();
      });
    });
    updateTabExportButton();
  }

  function updateTabExportButton() {
    var tabBtn = document.getElementById('tmReportExportTabCsv');
    if (!tabBtn) return;
    if (activeTab === 'summary') {
      tabBtn.hidden = true;
    } else {
      tabBtn.hidden = false;
      var labels = { daily: 'Günlük', sessions: 'Dersler', teachers: 'Öğretmenler', comm: 'İletişim', audit: 'Denetim' };
      tabBtn.textContent = (labels[activeTab] || 'Sekme') + ' CSV';
    }
  }

  function exportActiveTabCsv() {
    if (!Export) return;
    if (Perms && !Perms.guard('export')) return;
    if (activeTab === 'daily') {
      Export.exportTable('rapor-gunluk.csv', dailyRows(), [
        { key: 'date', label: 'Tarih' },
        { key: 'sessions', label: 'Ders' },
        { key: 'students', label: 'Öğrenci' },
        { key: 'cancelled', label: 'İptal' }
      ]);
    } else if (activeTab === 'sessions') {
      Export.exportTable('rapor-dersler.csv', sessionRows(), [
        { key: 'date', label: 'Tarih' },
        { key: 'time', label: 'Saat' },
        { key: 'lesson', label: 'Ders türü' },
        { key: 'pdrTeacher', label: 'PDR öğretmeni' },
        { key: 'branchTeacher', label: 'Branş öğretmeni' },
        { key: 'enrolled', label: 'Öğrenci' },
        { key: 'status', label: 'Durum' },
        { key: 'pdrInformed', label: 'PDR bilgi' },
        { key: 'branchInformed', label: 'Branş bilgi' }
      ]);
    } else if (activeTab === 'teachers') {
      Export.exportTable('rapor-ogretmenler.csv', teacherRows(), [
        { key: 'name', label: 'Öğretmen' },
        { key: 'teacherType', label: 'Tip' },
        { key: 'sessions', label: 'Ders' },
        { key: 'students', label: 'Öğrenci' },
        { key: 'cancelled', label: 'İptal' },
        { key: 'informed', label: 'Bilgilendirildi' }
      ]);
    } else if (activeTab === 'comm') {
      Export.exportTable('rapor-iletisim.csv', commRows(), [
        { key: 'date', label: 'Tarih' },
        { key: 'channel', label: 'Kanal' },
        { key: 'result', label: 'Sonuç' },
        { key: 'summary', label: 'Özet' }
      ]);
    } else if (activeTab === 'audit') {
      Export.exportTable('rapor-denetim.csv', auditRows(), [
        { key: 'date', label: 'Tarih', value: function (r) { return U.formatDateTime(r.date); } },
        { key: 'entityType', label: 'Varlık' },
        { key: 'entityId', label: 'Kayıt ID' },
        { key: 'action', label: 'İşlem' },
        { key: 'description', label: 'Açıklama' },
        { key: 'reason', label: 'Neden' },
        { key: 'user', label: 'Kullanıcı' }
      ]);
    }
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
          { key: 'pdrTeacher', label: 'PDR öğretmeni' },
          { key: 'branchTeacher', label: 'Branş öğretmeni' },
          { key: 'enrolled', label: 'Öğrenci' },
          { key: 'status', label: 'Durum' },
          { key: 'pdrInformed', label: 'PDR bilgi' },
          { key: 'branchInformed', label: 'Branş bilgi' }
        ]
      },
      {
        name: 'Öğretmenler',
        rows: teacherRows(),
        columns: [
          { key: 'name', label: 'Öğretmen' },
          { key: 'teacherType', label: 'Tip' },
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
      },
      {
        name: 'Denetim',
        rows: auditRows(),
        columns: [
          { key: 'date', label: 'Tarih', value: function (r) { return U.formatDateTime(r.date); } },
          { key: 'entityType', label: 'Varlık' },
          { key: 'entityId', label: 'Kayıt ID' },
          { key: 'action', label: 'İşlem' },
          { key: 'description', label: 'Açıklama' },
          { key: 'reason', label: 'Neden' },
          { key: 'user', label: 'Kullanıcı' }
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
  var tabCsvBtn = document.getElementById('tmReportExportTabCsv');
  var xlsBtn = document.getElementById('tmReportExportXls');
  if (csvBtn) csvBtn.addEventListener('click', exportSummaryCsv);
  if (tabCsvBtn) tabCsvBtn.addEventListener('click', exportActiveTabCsv);
  if (xlsBtn) xlsBtn.addEventListener('click', exportExcelPack);
})();
