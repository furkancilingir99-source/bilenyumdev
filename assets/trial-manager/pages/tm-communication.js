/**
 * İletişim takibi — CRM görev listesi
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Form = window.TMFormDialog;
  if (!Store) return;

  var tbody = document.getElementById('tmCommBody');
  var tabsEl = document.getElementById('tmCommTabs');
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
        phone: pa.phone
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
      return {
        log: l,
        person: pa ? U.fullName(pa.firstName, pa.lastName) : (t ? U.fullName(t.firstName, t.lastName) : '—'),
        role: pa ? 'Veli' : 'Öğretmen',
        phone: pa ? pa.phone : (t ? t.phone : '—'),
        reservation: null
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
        render();
      }
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
    if (activeTab === 'all') {
      tbody.innerHTML = p.items.map(function (x) {
        var l = x.log;
        return '<tr><td>' + U.escapeHtml(x.person) + '</td><td>' + x.role + '</td><td>—</td><td>—</td><td>' + U.escapeHtml(x.phone) + '</td>' +
          '<td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) + '</td>' +
          '<td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td>' +
          '<td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(l.nextAction || '—') + '</td><td>—</td><td>—</td></tr>';
      }).join('');
    } else {
      tbody.innerHTML = p.items.map(function (x, i) {
        var stName = x.student ? U.fullName(x.student.firstName, x.student.lastName) : '—';
        var sessLabel = x.session ? U.formatDateKey(x.session.date) + ' ' + x.session.startTime : '—';
        var result = x.reservation ? SL.parentApprovalLabel(x.reservation.parentApprovalStatus) : 'Bilgilendirilmedi';
        return '<tr><td>' + U.escapeHtml(x.person) + '</td><td>' + x.role + '</td><td>' + U.escapeHtml(stName) + '</td><td>' + U.escapeHtml(sessLabel) + '</td>' +
          '<td>' + U.escapeHtml(x.phone) + '</td><td>—</td><td>' + U.escapeHtml(result) + '</td><td>—</td><td>—</td><td>Elif Y.</td>' +
          '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-log-idx="' + i + '">Kayıt ekle</button> ' +
          (x.phone && x.role === 'Veli' ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-wa-idx="' + i + '">WhatsApp</button>' : '') +
        '</td></tr>';
      }).join('');
    }
    U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
    tbody.querySelectorAll('[data-log-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-log-idx'), 10);
        if (lastItems[idx]) openLogForm(lastItems[idx]);
      });
    });
    tbody.querySelectorAll('[data-wa-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-wa-idx'), 10);
        var row = lastItems[idx];
        if (!row || !row.parent || !window.TMQuickMessage) return;
        var sess = row.session;
        var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;
        if (!meeting) { U.notifyError('Bu kayıt için meeting bilgisi yok.'); return; }
        var lt = sess ? Store.getLessonTypeById(sess.lessonTypeId) : null;
        window.TMQuickMessage.openForParent({
          parentName: U.fullName(row.parent.firstName, row.parent.lastName),
          studentName: row.student ? U.fullName(row.student.firstName, row.student.lastName) : '—',
          lessonType: lt ? lt.name : '—',
          date: sess ? U.formatDateKey(sess.date) : '—',
          time: sess ? sess.startTime : '—',
          meetingUrl: meeting.meetingUrl,
          meetingId: meeting.meetingId,
          passcode: meeting.passcode,
          phone: row.parent.phone,
          email: row.parent.email
        });
      });
    });
    if (loading) loading.hidden = true;
    if (wrap) wrap.hidden = false;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  renderTabs();
  render();
})();
