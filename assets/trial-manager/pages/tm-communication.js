/**
 * İletişim takibi — CRM görev listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Form = window.TMFormDialog;
  var Perms = window.TMPermissions;
  var QuickMsg = window.TMQuickMessage;
  var Export = window.TMExportUtils;
  if (!Store) return;

  var tbody = document.getElementById('tmCommBody');
  var tabsEl = document.getElementById('tmCommTabs');
  var exportBtn = document.getElementById('tmCommExport');
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
    { id: 'teacher', label: 'Öğretmen bilgilendirilecekler' },
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
    Store.getSessions().filter(function (s) { return !s.teacherInformed && s.status !== 'cancelled'; }).forEach(function (s) {
      var t = Store.getTeacherById(s.teacherId);
      if (!t) return;
      rows.push({
        session: s,
        teacher: t,
        person: U.fullName(t.firstName, t.lastName),
        role: 'Öğretmen',
        phone: t.phone,
        email: t.email,
        reservation: null
      });
    });
    return rows;
  }

  function filterTab(rows) {
    var today = Store.todayKey();
    if (activeTab === 'unreachable') return rows.filter(function (x) { return x.reservation && x.reservation.parentApprovalStatus === 'unreachable'; });
    if (activeTab === 'pending') return rows.filter(function (x) { return x.reservation && (x.reservation.parentApprovalStatus === 'not_called' || x.reservation.status === 'pending'); });
    if (activeTab === 'call_again') return rows.filter(function (x) { return x.reservation && x.reservation.parentApprovalStatus === 'call_again'; });
    if (activeTab === 'link') return rows.filter(function (x) { return x.reservation && x.reservation.parentApprovalStatus === 'approved' && !x.reservation.linkSent; });
    if (activeTab === 'teacher') return rows.filter(function (x) { return x.role === 'Öğretmen'; });
    if (activeTab === 'today') return rows.filter(function (x) {
      return x.reservation && x.session && x.session.date === today;
    });
    return Store.getCommunicationLogs().map(function (l) {
      var pa = l.parentId ? Store.getParentById(l.parentId) : null;
      var t = l.teacherId ? Store.getTeacherById(l.teacherId) : null;
      var creator = l.createdByUserId ? Store.getUsers().find(function (u) { return u.id === l.createdByUserId; }) : null;
      return {
        log: l,
        person: pa ? U.fullName(pa.firstName, pa.lastName) : (t ? U.fullName(t.firstName, t.lastName) : '—'),
        role: pa ? 'Veli' : 'Öğretmen',
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
          entry.teacherId = rowCtx.teacher ? rowCtx.teacher.id : rowCtx.session.teacherId;
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
    if (row.role === 'Öğretmen' && row.teacher && row.session) {
      var lt = Store.getLessonTypeById(row.session.lessonTypeId);
      var enrolled = row.session.enrolledStudentIds ? row.session.enrolledStudentIds.length : 0;
      QuickMsg.openForTeacher({
        teacherName: U.fullName(row.teacher.firstName, row.teacher.lastName),
        date: U.formatDateKey(row.session.date),
        time: row.session.startTime,
        lessonType: lt ? lt.name : '—',
        studentCount: enrolled,
        phone: row.teacher.phone,
        email: row.teacher.email
      });
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
    } else if (x.session && x.role === 'Öğretmen') {
      if (activeTab === 'teacher') {
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-act-inform="' + i + '" data-tm-require="edit">Bilgilendirildi</button>');
        parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-act-session="' + x.session.id + '">Ders</button>');
      }
    }
    if (activeTab === 'all') {
      parts.push('<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-log-idx="' + i + '" data-tm-require="edit">Kayıt ekle</button>');
    }
    return parts.join(' ');
  }

  function bindRowActions() {
    tbody.querySelectorAll('[data-log-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-log-idx'), 10);
        if (lastItems[idx]) openLogForm(lastItems[idx]);
      });
    });
    tbody.querySelectorAll('[data-wa-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-wa-idx'), 10);
        if (lastItems[idx]) openWhatsApp(lastItems[idx]);
      });
    });
    tbody.querySelectorAll('[data-act-approve]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-approve'), 10)];
        if (!row || !row.reservation || !row.reservation.requestId) return;
        var result = Store.approveParentForRequest(row.reservation.requestId);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Veli onayı kaydedildi.'); if (window.TMOnSessionChange) window.TMOnSessionChange(); render(); }
      });
    });
    tbody.querySelectorAll('[data-act-unreach]').forEach(function (btn) {
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
    tbody.querySelectorAll('[data-act-call]').forEach(function (btn) {
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
    tbody.querySelectorAll('[data-act-link]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-link'), 10)];
        if (!row || !row.reservation) return;
        var result = Store.markLinkSent(row.reservation.id);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Link gönderildi işaretlendi.'); if (window.TMOnSessionChange) window.TMOnSessionChange(); render(); }
      });
    });
    tbody.querySelectorAll('[data-act-inform]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('edit')) return;
        var row = lastItems[parseInt(btn.getAttribute('data-act-inform'), 10)];
        if (!row || !row.session) return;
        Store.markTeacherInformed(row.session.id);
        U.notifySuccess('Öğretmen bilgilendirildi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        render();
      });
    });
    tbody.querySelectorAll('[data-act-session]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-act-session'));
      });
    });
    tbody.querySelectorAll('[data-act-request]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.TMRequestDrawer) window.TMRequestDrawer.open(btn.getAttribute('data-act-request'));
        else window.location.href = 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(btn.getAttribute('data-act-request'));
      });
    });
  }

  function renderTabs() {
    if (!tabsEl) return;
    tabsEl.innerHTML = TAB_DEFS.map(function (t) {
      return '<button type="button" class="tm-comm-tab' + (activeTab === t.id ? ' is-active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');
    tabsEl.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeTab = btn.getAttribute('data-tab');
        page = 1;
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
    var resp = responsibleLabel();
    if (activeTab === 'all') {
      tbody.innerHTML = p.items.map(function (x, i) {
        var l = x.log;
        return '<tr><td>' + U.escapeHtml(x.person) + '</td><td>' + x.role + '</td><td>—</td><td>—</td><td>' + U.escapeHtml(x.phone) + '</td>' +
          '<td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) + '</td>' +
          '<td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td>' +
          '<td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(l.nextAction || '—') + '</td>' +
          '<td>' + U.escapeHtml(x.responsible || '—') + '</td>' +
          '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-log-idx="' + i + '" data-tm-require="edit">Kayıt ekle</button></td></tr>';
      }).join('');
    } else {
      tbody.innerHTML = p.items.map(function (x, i) {
        var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
        var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
        var result = x.reservation ? SL.parentApprovalLabel(x.reservation.parentApprovalStatus) : 'Bilgilendirilmedi';
        var actions = rowActions(x, i);
        return '<tr><td>' + U.escapeHtml(x.person) + '</td><td>' + x.role + '</td><td>' + U.escapeHtml(stName) + '</td><td>' + U.escapeHtml(sessLabel) + '</td>' +
          '<td>' + U.escapeHtml(x.phone) + '</td><td>—</td><td>' + U.escapeHtml(result) + '</td><td>—</td><td>—</td><td>' + U.escapeHtml(resp) + '</td>' +
          '<td style="white-space:nowrap">' + actions + '</td></tr>';
      }).join('');
    }
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    bindRowActions();
    if (loading) loading.hidden = true;
    if (wrap) wrap.hidden = false;
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(tbody);
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
  renderTabs();
  render();
})();
