/**
 * İletişim takibi — CRM görev listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Form = window.TMFormDialog;
  var Perms = window.TMPermissions;
  var QuickMsg = window.TMQuickMessage;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmCommBody');
  var cardsEl = document.getElementById('tmCommCards');
  var tabsEl = document.getElementById('tmCommTabs');
  var exportBtn = document.getElementById('tmCommExport');
  var bulkLinksBtn = document.getElementById('tmCommBulkLinks');
  var activeTab = 'all';
  var page = 1;
  var paginationEl = document.getElementById('tmCommPagination');
  var pageSizeSelect = document.getElementById('tmCommPageSize');
  var lastItems = [];

  var TAB_DEFS = [
    { id: 'today', label: 'Bugün aranacaklar' },
    { id: 'unreachable', label: 'Ulaşılamayanlar' },
    { id: 'pending', label: 'Onay bekleyenler' },
    { id: 'call_again', label: 'Tekrar aranacaklar' },
    { id: 'link', label: 'Link gönderilecekler' },
    { id: 'pdr_teacher', label: 'PDR bilgilendirilecekler' },
    { id: 'branch_teacher', label: 'Branş bilgilendirilecekler' },
    { id: 'all', label: 'Tüm geçmiş' }
  ];

  function responsibleLabel() {
    var u = Store.getCurrentUser();
    return u ? U.fullName(u.firstName, u.lastName) : '—';
  }

  function taskRows() {
    var rows = [];
    Store.getReservations().forEach(function (r) {
      var st = Store.getStudentById(r.studentId);
      var pa = Store.getParentById(r.parentId);
      var sess = Store.getSessionById(r.sessionId);
      if (!pa) return;
      rows.push({
        reservation: r,
        student: st,
        parent: pa,
        session: sess,
        person: U.fullName(pa.firstName, pa.lastName),
        role: 'Veli',
        phone: pa.phone,
        email: pa.email
      });
    });
    function pushTeacherRow(s, role) {
      var tid = role === 'pdr' ? s.pdrTeacherId : s.branchTeacherId;
      var informed = role === 'pdr' ? s.pdrTeacherInformed : s.branchTeacherInformed;
      if (!tid || informed) return;
      var t = Store.getTeacherById(tid);
      if (!t) return;
      rows.push({
        session: s,
        teacher: t,
        teacherRole: role,
        person: U.fullName(t.firstName, t.lastName),
        role: role === 'pdr' ? 'PDR öğretmeni' : 'Branş öğretmeni',
        phone: t.phone,
        email: t.email,
        reservation: null
      });
    }
    Store.getSessions().filter(function (s) { return s.status !== 'cancelled'; }).forEach(function (s) {
      pushTeacherRow(s, 'pdr');
      pushTeacherRow(s, 'branch');
    });
    return rows;
  }

  function filterTab(rows, tabId) {
    tabId = tabId || activeTab;
    var today = Store.todayKey();
    if (tabId === 'unreachable') return rows.filter(function (x) { return x.reservation && x.reservation.parentApprovalStatus === 'unreachable'; });
    if (tabId === 'pending') return rows.filter(function (x) { return x.reservation && (x.reservation.parentApprovalStatus === 'not_called' || x.reservation.status === 'pending'); });
    if (tabId === 'call_again') return rows.filter(function (x) { return x.reservation && x.reservation.parentApprovalStatus === 'call_again'; });
    if (tabId === 'link') return rows.filter(function (x) { return x.reservation && x.reservation.parentApprovalStatus === 'approved' && !x.reservation.linkSent; });
    if (tabId === 'pdr_teacher') return rows.filter(function (x) { return x.teacherRole === 'pdr'; });
    if (tabId === 'branch_teacher') return rows.filter(function (x) { return x.teacherRole === 'branch'; });
    if (tabId === 'today') return rows.filter(function (x) {
      return x.reservation && x.session && x.session.date === today;
    });
    if (tabId !== 'all') return rows;
    return Store.getCommunicationLogs().map(function (l) {
      var pa = l.parentId ? Store.getParentById(l.parentId) : null;
      var t = l.teacherId ? Store.getTeacherById(l.teacherId) : null;
      var st = l.studentId ? Store.getStudentById(l.studentId) : null;
      var sess = l.sessionId ? Store.getSessionById(l.sessionId) : null;
      var creator = l.createdByUserId ? Store.getUsers().find(function (u) { return u.id === l.createdByUserId; }) : null;
      var role = '—';
      if (pa) role = 'Veli';
      else if (t) {
        role = (t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr') ? 'PDR öğretmeni' : 'Branş öğretmeni';
      }
      return {
        log: l,
        student: st,
        session: sess,
        teacher: t,
        parent: pa,
        teacherRole: t ? ((t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr') ? 'pdr' : 'branch') : null,
        person: pa ? U.fullName(pa.firstName, pa.lastName) : (t ? U.fullName(t.firstName, t.lastName) : '—'),
        role: role,
        phone: pa ? pa.phone : (t ? t.phone : '—'),
        reservation: null,
        responsible: creator ? U.fullName(creator.firstName, creator.lastName) : '—'
      };
    });
  }

  function channelOptions() {
    return Object.keys(SL.COMM_CHANNEL).map(function (k) {
      return { value: k, label: SL.COMM_CHANNEL[k] };
    });
  }

  function resultOptions() {
    return Object.keys(SL.COMM_RESULT).map(function (k) {
      return { value: k, label: SL.COMM_RESULT[k] };
    });
  }

  function openLogForm(rowCtx) {
    if (!Form) return;
    if (Perms && !Perms.guard('edit')) return;
    Form.open({
      title: 'İletişim kaydı ekle',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: channelOptions(), value: 'phone' },
        { type: 'select', name: 'result', label: 'Sonuç', options: resultOptions(), value: 'message_sent' },
        { type: 'textarea', name: 'summary', label: 'Özet', rows: 4, required: true },
        { type: 'text', name: 'nextAction', label: 'Sonraki aksiyon', required: false }
      ],
      onSubmit: function (data) {
        var entry = {
          summary: data.summary,
          channel: data.channel,
          result: data.result,
          nextAction: data.nextAction || ''
        };
        if (rowCtx.reservation) {
          entry.reservationId = rowCtx.reservation.id;
          entry.sessionId = rowCtx.session ? rowCtx.session.id : rowCtx.reservation.sessionId;
          entry.parentId = rowCtx.parent ? rowCtx.parent.id : rowCtx.reservation.parentId;
          entry.studentId = rowCtx.student ? rowCtx.student.id : rowCtx.reservation.studentId;
        } else if (rowCtx.session) {
          entry.sessionId = rowCtx.session.id;
          entry.teacherId = rowCtx.teacher ? rowCtx.teacher.id : (rowCtx.teacherRole === 'pdr' ? rowCtx.session.pdrTeacherId : rowCtx.session.branchTeacherId);
        }
        Store.addCommunicationLog(entry);
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        U.notifySuccess('İletişim kaydı eklendi.');
        render();
      }
    });
  }

  function openWhatsApp(row) {
    if (!QuickMsg || !row.phone) return;
    if ((row.role === 'PDR öğretmeni' || row.role === 'Branş öğretmeni') && row.teacher && row.session) {
      var lt = Store.getLessonTypeById(row.session.lessonTypeId);
      var meeting = Store.getMeetingBySessionId(row.session.id);
      var payload = {
        teacherName: U.fullName(row.teacher.firstName, row.teacher.lastName),
        date: U.formatDateKey(row.session.date),
        time: row.session.startTime,
        lessonType: lt ? lt.name : '—',
        meetingUrl: meeting ? meeting.meetingUrl : '',
        meetingId: meeting ? meeting.meetingId : '',
        passcode: meeting ? meeting.passcode : '',
        phone: row.teacher.phone,
        email: row.teacher.email
      };
      if (row.teacherRole === 'pdr') QuickMsg.openForPdrTeacher(payload);
      else {
        payload.studentCount = row.session.enrolledStudentIds ? row.session.enrolledStudentIds.length : 0;
        QuickMsg.openForBranchTeacher(payload);
      }
      return;
    }
    if (!row.parent) return;
    var sess = row.session;
    var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;
    var lt2 = sess ? Store.getLessonTypeById(sess.lessonTypeId) : null;
    QuickMsg.openForParent({
      parentName: U.fullName(row.parent.firstName, row.parent.lastName),
      studentName: row.student ? U.fullName(row.student.firstName, row.student.lastName) : '—',
      lessonType: lt2 ? lt2.name : 'Deneme dersi',
      date: sess ? U.formatDateKey(sess.date) : '—',
      time: sess ? sess.startTime : '—',
      meetingUrl: meeting ? meeting.meetingUrl : '',
      meetingId: meeting ? meeting.meetingId : '',
      passcode: meeting ? meeting.passcode : '',
      phone: row.parent.phone,
      email: row.parent.email
    });
  }

  function exportRows() {
    var items = filterTab(taskRows());
    if (activeTab === 'all') {
      return items.map(function (x) {
        var l = x.log;
        return {
          person: x.person,
          role: x.role,
          phone: x.phone,
          channel: SL.COMM_CHANNEL[l.channel] || l.channel,
          result: SL.COMM_RESULT[l.result] || l.result,
          createdAt: U.formatDateTime(l.createdAt),
          nextAction: l.nextAction || '',
          responsible: x.responsible || ''
        };
      });
    }
    return items.map(function (x) {
      var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
      var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
      var result = x.reservation ? SL.parentApprovalLabel(x.reservation.parentApprovalStatus) : 'Bilgilendirilmedi';
      return {
        person: x.person,
        role: x.role,
        student: stName,
        session: sessLabel,
        phone: x.phone,
        result: result,
        responsible: responsibleLabel()
      };
    });
  }

  function rowActions(x, i) {
    var parts = [];
    if (x.phone) {
      parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-wa-idx="' + i + '">WhatsApp</button>');
    }
    if (x.reservation) {
      var rid = x.reservation.id;
      var reqId = x.reservation.requestId;
      if (activeTab === 'pending' || activeTab === 'today') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-act-approve="' + i + '" data-tm-require="edit">Onayladı</button>');
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-act-unreach="' + i + '" data-tm-require="edit">Ulaşılamadı</button>');
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-act-call="' + i + '" data-tm-require="edit">Tekrar ara</button>');
      }
      if (activeTab === 'link') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-act-link="' + i + '" data-tm-require="edit">Link gönderildi</button>');
      }
      if (activeTab === 'unreachable') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-act-call="' + i + '" data-tm-require="edit">Tekrar ara</button>');
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-act-approve="' + i + '" data-tm-require="edit">Onayladı</button>');
      }
      if (activeTab === 'call_again') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-act-approve="' + i + '" data-tm-require="edit">Onayladı</button>');
      }
      if (reqId && activeTab !== 'all') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-act-request="' + reqId + '">Talep</button>');
      }
      if (activeTab !== 'all') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-log-idx="' + i + '" data-tm-require="edit">Kayıt ekle</button>');
      }
    } else if (x.session && (x.role === 'PDR öğretmeni' || x.role === 'Branş öğretmeni')) {
      if (activeTab === 'pdr_teacher' || activeTab === 'branch_teacher') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-act-inform="' + i + '" data-tm-require="edit">Bilgilendirildi</button>');
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-act-session="' + x.session.id + '">Ders</button>');
      }
    }
    if (activeTab === 'all') {
      parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-log-idx="' + i + '" data-tm-require="edit">Kayıt ekle</button>');
    }
    return parts.join(' ');
  }

  function sessionTeachers(x) {
    var pdrName = '—';
    var branchName = '—';
    if (x.session) {
      var pdrT = Store.getTeacherById(x.session.pdrTeacherId);
      var branchT = Store.getTeacherById(x.session.branchTeacherId);
      pdrName = pdrT ? U.fullName(pdrT.firstName, pdrT.lastName) : '—';
      branchName = branchT ? U.fullName(branchT.firstName, branchT.lastName) : '—';
    }
    return { pdrName: pdrName, branchName: branchName };
  }

  function rowHtml(x, i) {
    var teachers = sessionTeachers(x);
    if (activeTab === 'all') {
      var l = x.log;
      var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
      var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
      return '<tr><td>' + U.escapeHtml(x.person) + '</td><td>' + x.role + '</td>' +
        '<td>' + U.escapeHtml(stName) + '</td><td>' + U.escapeHtml(sessLabel) + '</td>' +
        '<td>' + U.escapeHtml(teachers.pdrName) + '</td><td>' + U.escapeHtml(teachers.branchName) + '</td>' +
        '<td>' + U.escapeHtml(x.phone) + '</td>' +
        '<td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) + '</td>' +
        '<td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td>' +
        '<td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(l.nextAction || '—') + '</td>' +
        '<td>' + U.escapeHtml(x.responsible || '—') + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-log-idx="' + i + '" data-tm-require="edit">Kayıt ekle</button></td></tr>';
    }
    var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
    var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
    var result = x.reservation ? SL.parentApprovalLabel(x.reservation.parentApprovalStatus) : (x.teacherRole === 'pdr' ? 'PDR bilgilendirilmedi' : (x.teacherRole === 'branch' ? 'Branş bilgilendirilmedi' : 'Bilgilendirilmedi'));
    var actions = rowActions(x, i);
    var resp = responsibleLabel();
    return '<tr><td>' + U.escapeHtml(x.person) + '</td><td>' + x.role + '</td><td>' + U.escapeHtml(stName) + '</td><td>' + U.escapeHtml(sessLabel) + '</td>' +
      '<td>' + U.escapeHtml(teachers.pdrName) + '</td><td>' + U.escapeHtml(teachers.branchName) + '</td>' +
      '<td>' + U.escapeHtml(x.phone) + '</td><td>—</td><td>' + U.escapeHtml(result) + '</td><td>—</td><td>—</td><td>' + U.escapeHtml(resp) + '</td>' +
      '<td style="white-space:nowrap">' + actions + '</td></tr>';
  }

  function cardHtml(x, i) {
    var teachers = sessionTeachers(x);
    var actions = rowActions(x, i);
    if (activeTab === 'all') {
      var l = x.log;
      var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
      var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
      return '<article class="tm-list-card">' +
        '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(x.person) + '</strong></div><span class="tm-list-card-label">' + x.role + '</span></div>' +
        '<div class="tm-list-card-body">' +
          '<div><span class="tm-list-card-label">Öğrenci</span> ' + U.escapeHtml(stName) + '</div>' +
          '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(sessLabel) + '</div>' +
          '<div><span class="tm-list-card-label">Kanal</span> ' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) + '</div>' +
          '<div><span class="tm-list-card-label">Sonuç</span> ' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</div>' +
          '<div><span class="tm-list-card-label">Tarih</span> ' + U.formatDateTime(l.createdAt) + '</div>' +
        '</div>' +
        '<div class="tm-list-card-foot">' + actions + '</div></article>';
    }
    var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
    var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
    var result = x.reservation ? SL.parentApprovalLabel(x.reservation.parentApprovalStatus) : (x.teacherRole === 'pdr' ? 'PDR bilgilendirilmedi' : (x.teacherRole === 'branch' ? 'Branş bilgilendirilmedi' : 'Bilgilendirilmedi'));
    return '<article class="tm-list-card">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(x.person) + '</strong></div><span class="tm-list-card-label">' + x.role + '</span></div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Öğrenci</span> ' + U.escapeHtml(stName) + '</div>' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(sessLabel) + '</div>' +
        (teachers.pdrName !== '—' ? '<div><span class="tm-list-card-label">PDR</span> ' + U.escapeHtml(teachers.pdrName) + '</div>' : '') +
        (teachers.branchName !== '—' ? '<div><span class="tm-list-card-label">Branş</span> ' + U.escapeHtml(teachers.branchName) + '</div>' : '') +
        '<div><span class="tm-list-card-label">Telefon</span> ' + U.escapeHtml(x.phone) + '</div>' +
        '<div><span class="tm-list-card-label">Durum</span> ' + U.escapeHtml(result) + '</div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' + actions + '</div></article>';
  }

  function bindRowActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-log-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-log-idx'), 10);
        if (lastItems[idx]) openLogForm(lastItems[idx]);
      });
    });
    root.querySelectorAll('[data-wa-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-wa-idx'), 10);
        if (lastItems[idx]) openWhatsApp(lastItems[idx]);
      });
    });
    root.querySelectorAll('[data-act-approve]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-approve'), 10)];
        if (!row || !row.reservation || !row.reservation.requestId) return;
        var result = Store.approveParentForRequest(row.reservation.requestId);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Veli onayı kaydedildi.'); if (window.TMOnSessionChange) window.TMOnSessionChange(); render(); }
      });
    });
    root.querySelectorAll('[data-act-unreach]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-unreach'), 10)];
        if (!row || !row.reservation) return;
        Store.updateParentApproval(row.reservation.id, 'unreachable');
        U.notifySuccess('Ulaşılamadı işaretlendi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        render();
      });
    });
    root.querySelectorAll('[data-act-call]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-call'), 10)];
        if (!row || !row.reservation) return;
        Store.updateParentApproval(row.reservation.id, 'call_again');
        U.notifySuccess('Tekrar aranacak işaretlendi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        render();
      });
    });
    root.querySelectorAll('[data-act-link]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-link'), 10)];
        if (!row || !row.reservation) return;
        var result = Store.markLinkSent(row.reservation.id);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Link gönderildi işaretlendi.'); if (window.TMOnSessionChange) window.TMOnSessionChange(); render(); }
      });
    });
    root.querySelectorAll('[data-act-inform]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-inform'), 10)];
        if (!row || !row.session) return;
        if (row.teacherRole === 'pdr') Store.markPdrTeacherInformed(row.session.id);
        else if (row.teacherRole === 'branch') Store.markBranchTeacherInformed(row.session.id);
        else Store.markTeacherInformed(row.session.id);
        U.notifySuccess('Öğretmen bilgilendirildi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        render();
      });
    });
    root.querySelectorAll('[data-act-session]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-act-session'));
      });
    });
    root.querySelectorAll('[data-act-request]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMRequestDrawer) window.TMRequestDrawer.open(btn.getAttribute('data-act-request'));
        else window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(btn.getAttribute('data-act-request'));
      });
    });
  }

  function initFromUrl() {
    var tab = U.qs('tab');
    if (tab && TAB_DEFS.some(function (t) { return t.id === tab; })) activeTab = tab;
  }

  function renderTabs() {
    if (!tabsEl) return;
    var allRows = taskRows();
    tabsEl.innerHTML = TAB_DEFS.map(function (t) {
      var count = filterTab(allRows, t.id).length;
      var badge = count > 0 && t.id !== 'all' ? ' <span class="tm-sidebar-badge" style="position:static;display:inline-flex;margin-left:4px">' + count + '</span>' : '';
      return '<button type="button" class="tm-comm-tab' + (activeTab === t.id ? ' is-active' : '') + '" data-tab="' + t.id + '">' + t.label + badge + '</button>';
    }).join('');
    tabsEl.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.getAttribute('data-tab');
        page = 1;
        if (U.setQueryParam) U.setQueryParam('tab', activeTab === 'all' ? '' : activeTab);
        renderTabs();
        render();
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmCommLoading');
    var wrap = document.getElementById('tmCommTableWrap');
    try {
    var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '15', 10);
    var items = filterTab(taskRows());
    var p = U.paginate(items, page, pageSize);
    lastItems = p.items;
    tbody.innerHTML = p.items.map(rowHtml).join('');
    if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    bindRowActions(tbody);
    if (cardsEl) bindRowActions(cardsEl);
    if (loading) loading.hidden = true;
    if (wrap) wrap.hidden = false;
    if (cardsEl) cardsEl.hidden = false;
    if (paginationEl) paginationEl.hidden = p.pages <= 1;
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(tbody);
    if (bulkLinksBtn) {
      bulkLinksBtn.hidden = activeTab !== 'link';
    }
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  window.TMOnSessionChange = render;
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('export')) return;
      var tab = TAB_DEFS.find(function (t) { return t.id === activeTab; });
      var suffix = tab ? tab.id : 'liste';
      if (activeTab === 'all') {
        Export.exportTable('iletisim-gecmisi-' + suffix + '.csv', exportRows(), [
          { key: 'person', label: 'Kişi' },
          { key: 'role', label: 'Rol' },
          { key: 'phone', label: 'Telefon' },
          { key: 'channel', label: 'Kanal' },
          { key: 'result', label: 'Sonuç' },
          { key: 'createdAt', label: 'Tarih' },
          { key: 'nextAction', label: 'Sonraki aksiyon' },
          { key: 'responsible', label: 'Sorumlu' }
        ]);
      } else {
        Export.exportTable('iletisim-gorevleri-' + suffix + '.csv', exportRows(), [
          { key: 'person', label: 'Kişi' },
          { key: 'role', label: 'Rol' },
          { key: 'student', label: 'Öğrenci' },
          { key: 'session', label: 'Ders' },
          { key: 'phone', label: 'Telefon' },
          { key: 'result', label: 'Durum' },
          { key: 'responsible', label: 'Sorumlu' }
        ]);
      }
    });
  }
  if (bulkLinksBtn) {
    bulkLinksBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('edit')) return;
      if (!Store.markAllApprovedLinksSent) return;
      var result = Store.markAllApprovedLinksSent();
      if (!result.ok) U.notifyError(result.error || 'İşlem başarısız.');
      else {
        U.notifySuccess(result.count + ' veliye link gönderildi işaretlendi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        renderTabs();
        render();
      }
    });
  }
  initFromUrl();
  renderTabs();
  render();
})();
