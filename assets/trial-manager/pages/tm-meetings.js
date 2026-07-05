/**
 * Online ders linkleri
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmMeetingsBody');
  var cardsEl = document.getElementById('tmMeetingsCards');
  var searchInput = document.getElementById('tmMeetingsSearch');
  var statusFilter = document.getElementById('tmMeetingsStatus');
  var countEl = document.getElementById('tmMeetingsCount');
  var paginationEl = document.getElementById('tmMeetingsPagination');
  var pageSizeSelect = document.getElementById('tmMeetingsPageSize');
  var exportBtn = document.getElementById('tmMeetingsExport');
  var bulkLinksBtn = document.getElementById('tmMeetingsBulkLinks');
  var page = 1;

  function initFromUrl() {
    var st = U.qs('status');
    if (st && statusFilter && statusFilter.querySelector('option[value="' + st + '"]')) {
      statusFilter.value = st;
    }
  }

  function rows() {
    return Store.getMeetings().map(function (m) {
      var s = Store.getSessionById(m.sessionId);
      if (!s) return null;
      var d = Store.getSessionWithDetails(s.id);
      var sent = d.reservations.filter(function (r) { return r.linkSent; }).length;
      var notSent = d.reservations.filter(function (r) { return !r.linkSent && r.parentApprovalStatus === 'approved'; }).length;
      return { meeting: m, session: s, detail: d, sent: sent, notSent: notSent };
    }).filter(Boolean);
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var items = rows();
    items = U.filterSearch(items, q, function (r) {
      return r.meeting.meetingId + ' ' + r.meeting.meetingUrl + ' ' + (r.detail.lessonType ? r.detail.lessonType.name : '');
    });
    if (status === 'active') items = items.filter(function (r) { return r.meeting.status === 'active'; });
    if (status === 'cancelled') items = items.filter(function (r) { return r.meeting.status === 'cancelled'; });
    if (status === 'not_sent') items = items.filter(function (r) { return r.notSent > 0; });
    return items;
  }

  function teacherNames(d) {
    var pdr = d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—';
    var branch = d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—';
    return { pdr: pdr, branch: branch, combined: pdr + ' / ' + branch };
  }

  function rowHtml(r) {
    var s = r.session;
    var lt = r.detail.lessonType;
    var names = teacherNames(r.detail);
    return '<tr data-id="' + s.id + '" style="cursor:pointer"><td>' + U.formatDateKey(s.date) + '</td><td>' + s.startTime + '</td>' +
      '<td>' + (lt ? lt.name : '—') + '</td>' +
      '<td>' + U.escapeHtml(names.pdr) + '</td>' +
      '<td>' + U.escapeHtml(names.branch) + '</td>' +
      '<td><code style="font-size:11px">' + U.escapeHtml(r.meeting.meetingId) + '</code></td>' +
      '<td><code style="font-size:11px">' + U.escapeHtml(r.meeting.passcode) + '</code></td>' +
      '<td>' + SL.meetingBadge(r.meeting.status) + '</td>' +
      '<td>' + r.sent + '</td><td>' + r.notSent + '</td>' +
      '<td>' + SL.sessionBadge(s.status) + '</td>' +
      '<td style="white-space:nowrap">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-copy-url="' + U.escapeHtml(r.meeting.meetingUrl) + '">Kopyala</button> ' +
        (r.notSent > 0 ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-bulk-session="' + s.id + '" data-tm-require="edit">Toplu link</button> ' : '') +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-session="' + s.id + '">Detay</button>' +
      '</td></tr>';
  }

  function cardHtml(r) {
    var s = r.session;
    var lt = r.detail.lessonType;
    var names = teacherNames(r.detail);
    return '<article class="tm-list-card" data-id="' + s.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.formatDateKey(s.date) + ' · ' + s.startTime + '</strong></div>' +
      SL.meetingBadge(r.meeting.status) + '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(lt ? lt.name : '—') + '</div>' +
        '<div><span class="tm-list-card-label">PDR</span> ' + U.escapeHtml(names.pdr) + '</div>' +
        '<div><span class="tm-list-card-label">Branş</span> ' + U.escapeHtml(names.branch) + '</div>' +
        '<div><span class="tm-list-card-label">Gönderim</span> ' + r.sent + ' gönderildi · ' + r.notSent + ' bekliyor</div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-session="' + s.id + '">Detay</button>' +
      '</div></article>';
  }

  function bindRowActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-bulk-session]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (Perms && !Perms.guard('edit')) return;
        var sid = btn.getAttribute('data-bulk-session');
        var result = Store.markBulkLinksSentForSession(sid);
        if (!result.ok) U.notifyError(result.error || 'İşlem başarısız.');
        else {
          U.notifySuccess(result.count + ' veliye link gönderildi işaretlendi.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          render();
        }
      });
    });
    root.querySelectorAll('[data-session]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-session'), 2);
      });
    });
    root.querySelectorAll('tr[data-id], .tm-list-card[data-id]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('button, a')) return;
        if (window.TMSessionDetail) window.TMSessionDetail.open(el.getAttribute('data-id'), 2);
      });
    });
    root.querySelectorAll('[data-copy-url]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var url = btn.getAttribute('data-copy-url');
        if (navigator.clipboard) navigator.clipboard.writeText(url);
        if (window.TMToast) window.TMToast.show('Link kopyalandı.', 'success');
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmMeetingsLoading');
    var wrap = document.getElementById('tmMeetingsTableWrap');
    try {
      var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
      var p = U.paginate(filtered(), page, pageSize);
      if (countEl) countEl.textContent = p.total + ' link';
      tbody.innerHTML = p.items.map(rowHtml).join('');
      if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
      U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
      bindRowActions(tbody);
      bindRowActions(cardsEl);
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
      if (cardsEl) cardsEl.hidden = false;
      if (paginationEl) paginationEl.hidden = p.pages <= 1;
      if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(tbody);
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (statusFilter) statusFilter.addEventListener('change', function () { page = 1; render(); });
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) exportBtn.addEventListener('click', function () {
    if (Perms && !Perms.guard('export')) return;
    Export.exportTable('online-linkler.csv', filtered(), [
      { key: 'meeting', label: 'Meeting ID', value: function (r) { return r.meeting.meetingId; } },
      { key: 'meeting', label: 'URL', value: function (r) { return r.meeting.meetingUrl; } },
      { key: 'session', label: 'Tarih', value: function (r) { return U.formatDateKey(r.session.date); } },
      { key: 'session', label: 'Saat', value: function (r) { return r.session.startTime; } },
      { key: 'detail', label: 'Ders', value: function (r) { return r.detail.lessonType ? r.detail.lessonType.name : ''; } },
      { key: 'detail', label: 'PDR öğretmeni', value: function (r) {
        return r.detail.pdrTeacher ? U.fullName(r.detail.pdrTeacher.firstName, r.detail.pdrTeacher.lastName) : '';
      }},
      { key: 'detail', label: 'Branş öğretmeni', value: function (r) {
        return r.detail.branchTeacher ? U.fullName(r.detail.branchTeacher.firstName, r.detail.branchTeacher.lastName) : '';
      }},
      { key: 'sent', label: 'Gönderilen' },
      { key: 'notSent', label: 'Gönderilmeyen' },
      { key: 'meeting', label: 'Durum', value: function (r) { return r.meeting.status; } }
    ]);
  });

  if (bulkLinksBtn) {
    bulkLinksBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard('edit')) return;
      if (!Store.markAllApprovedLinksSent) return;
      var result = Store.markAllApprovedLinksSent();
      if (!result.ok) U.notifyError(result.error || 'İşlem başarısız.');
      else {
        U.notifySuccess(result.count + ' rezervasyonda link gönderildi işaretlendi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        render();
      }
    });
  }

  window.TMOnSessionChange = render;
  initFromUrl();
  render();
  var openSessionId = U.qs('id');
  if (openSessionId && window.TMSessionDetail) window.TMSessionDetail.open(openSessionId);
  var openMeetingSessionId = U.qs('session');
  if (openMeetingSessionId && window.TMSessionDetail) window.TMSessionDetail.open(openMeetingSessionId, 2);
})();
