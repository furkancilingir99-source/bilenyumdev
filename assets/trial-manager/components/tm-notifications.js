/**
 * Deneme Dersi Yöneticisi — bildirim merkezi (HUD zil butonu + panel)
 * Store metrikleri + denetim günlüğünden gerçekçi, kategorili bildirim akışı üretir.
 */
(function (global) {
  'use strict';

  var READ_KEY = 'tm_notif_read_v1';
  var U = global.TMUtils;

  function store() {
    return (global.TMBridge && global.TMBridge.store && global.TMBridge.store()) || global.TMStore;
  }
  function metrics() {
    var S = store();
    if (global.TMApi && global.TMApi.getOperationMetrics) return global.TMApi.getOperationMetrics();
    return S && S.getOperationMetrics ? S.getOperationMetrics() : {};
  }

  function fullName(a, b) {
    return U && U.fullName ? U.fullName(a, b) : ((a || '') + ' ' + (b || '')).trim();
  }

  function relTime(iso) {
    if (!iso) return '';
    var then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    var diff = Date.now() - then;
    if (diff < 0) {
      var fm = Math.round(-diff / 60000);
      if (fm < 60) return fm + ' dk sonra';
      var fh = Math.round(fm / 60);
      if (fh < 24) return fh + ' sa sonra';
      return Math.round(fh / 24) + ' gün sonra';
    }
    var m = Math.floor(diff / 60000);
    if (m < 1) return 'az önce';
    if (m < 60) return m + ' dk önce';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' sa önce';
    var d = Math.floor(h / 24);
    if (d < 7) return d + ' gün önce';
    return (U && U.formatDateKey) ? U.formatDateKey(String(iso).slice(0, 10)) : String(iso).slice(0, 10);
  }

  function readSet() {
    try { return new Set(JSON.parse(sessionStorage.getItem(READ_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveReadSet(set) {
    try { sessionStorage.setItem(READ_KEY, JSON.stringify(Array.from(set))); } catch (e) {}
  }

  var CAT = {
    request:  { label: 'Talep',        tone: 'info' },
    approval: { label: 'Veli onayı',   tone: 'warn' },
    link:     { label: 'Online link',  tone: 'warn' },
    teacher:  { label: 'Öğretmen',     tone: 'warn' },
    attend:   { label: 'Katılım',      tone: 'info' },
    risk:     { label: 'Risk',         tone: 'danger' },
    today:    { label: 'Bugün',        tone: 'info' },
    activity: { label: 'Etkinlik',     tone: 'muted' }
  };
  var PRIORITY = { danger: 0, warn: 1, info: 2, muted: 3 };

  function reqHref(id) { return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id); }
  function sessHref(id, tab) { return 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(id) + (tab != null ? '&tab=' + tab : ''); }

  function buildFeed() {
    var S = store();
    if (!S) return [];
    var m = metrics();
    var items = [];

    function add(cat, id, title, sub, time, action) {
      var c = CAT[cat] || CAT.activity;
      items.push({ id: id, cat: cat, label: c.label, tone: c.tone, title: title, sub: sub || '', time: time || null, action: action || null });
    }

    (m.orphanRequests || []).forEach(function (r) {
      add('request', 'orphan:' + r.id, 'Rezervasyonsuz talep',
        fullName(r.studentFirstName, r.studentLastName) + ' · derse atanmalı',
        r.createdAt, { kind: 'request', id: r.id });
    });
    (m.newRequests || []).forEach(function (r) {
      if ((m.orphanRequests || []).some(function (o) { return o.id === r.id; })) return;
      add('request', 'new:' + r.id, 'Yeni deneme talebi',
        fullName(r.studentFirstName, r.studentLastName) + ' · ' + (r.studentGrade || ''),
        r.createdAt, { kind: 'request', id: r.id });
    });
    (m.pendingApproval || []).forEach(function (r) {
      var st = S.getStudentById(r.studentId);
      add('approval', 'appr:' + r.id, 'Veli onayı bekleniyor',
        (st ? fullName(st.firstName, st.lastName) : '') + ' · aranmalı',
        r.updatedAt || r.createdAt, { kind: 'request', id: r.requestId });
    });
    (m.linkNotSent || []).forEach(function (r) {
      var st = S.getStudentById(r.studentId);
      add('link', 'link:' + r.id, 'Online link gönderilmedi',
        (st ? fullName(st.firstName, st.lastName) : '') + ' · veli onaylı',
        r.updatedAt || r.createdAt, { kind: 'request', id: r.requestId });
    });
    var pdrList = m.pdrNotInformed || [];
    var brList = m.branchNotInformed || [];
    if (!pdrList.length && !brList.length) pdrList = m.teacherNotInformed || [];
    pdrList.forEach(function (s) {
      add('teacher', 'pdrinf:' + s.id, 'PDR öğretmeni bilgilendirilmedi', s.title, s.updatedAt, { kind: 'session', id: s.id });
    });
    brList.forEach(function (s) {
      add('teacher', 'brinf:' + s.id, 'Branş öğretmeni bilgilendirilmedi', s.title, s.updatedAt, { kind: 'session', id: s.id });
    });
    (m.needsAttendance || []).forEach(function (s) {
      add('attend', 'att:' + s.id, 'Katılım girilmedi', s.title, s.date, { kind: 'session', id: s.id, tab: 4 });
    });

    // Riskler: eksik öğretmen / iptal / kapasite
    S.getSessions().forEach(function (s) {
      if (s.status === 'cancelled') return;
      if (!s.pdrTeacherId || !s.branchTeacherId) {
        add('risk', 'missT:' + s.id, 'Eksik öğretmen ataması', s.title, s.updatedAt, { kind: 'session', id: s.id });
      } else if ((s.enrolledStudentIds || []).length >= 20) {
        add('risk', 'full:' + s.id, 'Kapasite dolu (20/20)', s.title, s.updatedAt, { kind: 'session', id: s.id });
      }
    });

    // Bugünkü dersler
    (m.todaySessions || []).forEach(function (s) {
      add('today', 'today:' + s.id, 'Bugünkü ders · ' + s.startTime, s.title, null, { kind: 'session', id: s.id });
    });

    // Son etkinlik (denetim günlüğü)
    var users = S.getUsers ? S.getUsers() : [];
    var audits = (S.getAuditLogs ? S.getAuditLogs() : []).slice();
    audits.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    audits.slice(0, 6).forEach(function (a) {
      var u = users.find(function (x) { return x.id === a.createdByUserId; });
      var who = u ? fullName(u.firstName, u.lastName) : 'Sistem';
      add('activity', 'audit:' + a.id, a.description || 'Kayıt güncellendi',
        who + (a.reason ? ' · ' + a.reason : ''), a.createdAt,
        a.entityType === 'trial_lesson_session' ? { kind: 'session', id: a.entityId } : null);
    });

    // Öncelik + zaman sıralaması
    items.sort(function (a, b) {
      var pa = PRIORITY[a.tone], pb = PRIORITY[b.tone];
      if (pa !== pb) return pa - pb;
      return String(b.time || '').localeCompare(String(a.time || ''));
    });
    return items;
  }

  function navigate(action) {
    if (!action) return;
    if (action.kind === 'request') {
      if (global.TMRequestDrawer && global.TMRequestDrawer.open) { global.TMRequestDrawer.open(action.id); return; }
      window.location.href = reqHref(action.id);
    } else if (action.kind === 'session') {
      if (global.TMSessionDetail && global.TMSessionDetail.open) { global.TMSessionDetail.open(action.id); return; }
      window.location.href = sessHref(action.id, action.tab);
    }
  }

  var feed = [];
  var read = readSet();

  function unreadCount() {
    return feed.filter(function (n) { return n.tone !== 'muted' && !read.has(n.id); }).length;
  }

  function updateBadge() {
    var badge = document.getElementById('tmNotifBadge');
    if (!badge) return;
    var n = unreadCount();
    if (n > 0) { badge.textContent = n > 99 ? '99+' : String(n); badge.hidden = false; }
    else { badge.hidden = true; }
  }

  function renderPanel() {
    var body = document.getElementById('tmNotifBody');
    if (!body) return;
    if (!feed.length) {
      body.innerHTML = '<div class="tm-notif-empty">Şu an bekleyen bildirim yok. 🎉</div>';
      return;
    }
    body.innerHTML = feed.slice(0, 24).map(function (n) {
      var isRead = read.has(n.id);
      return '<button type="button" class="tm-notif-item' + (isRead ? ' is-read' : '') + '" data-notif-id="' + n.id + '">' +
        '<span class="tm-notif-dot is-' + n.tone + '"></span>' +
        '<span class="tm-notif-main">' +
          '<span class="tm-notif-top"><span class="tm-notif-chip is-' + n.tone + '">' + (U ? U.escapeHtml(n.label) : n.label) + '</span>' +
          '<span class="tm-notif-time">' + relTime(n.time) + '</span></span>' +
          '<span class="tm-notif-title">' + (U ? U.escapeHtml(n.title) : n.title) + '</span>' +
          (n.sub ? '<span class="tm-notif-sub">' + (U ? U.escapeHtml(n.sub) : n.sub) + '</span>' : '') +
        '</span>' +
      '</button>';
    }).join('');
    body.querySelectorAll('[data-notif-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-notif-id');
        read.add(id); saveReadSet(read);
        var n = feed.find(function (x) { return x.id === id; });
        closePanel();
        if (n) navigate(n.action);
        updateBadge();
      });
    });
  }

  function refresh() {
    feed = buildFeed();
    // temizle: artık var olmayan okundu id'lerini koru (küçük set), sorun değil
    updateBadge();
    renderPanel();
  }

  function openPanel() {
    var panel = document.getElementById('tmNotifPanel');
    var btn = document.getElementById('tmNotifBtn');
    if (!panel) return;
    refresh();
    panel.classList.add('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }
  function closePanel() {
    var panel = document.getElementById('tmNotifPanel');
    var btn = document.getElementById('tmNotifBtn');
    if (panel) panel.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  function togglePanel() {
    var panel = document.getElementById('tmNotifPanel');
    if (panel && panel.classList.contains('is-open')) closePanel();
    else openPanel();
  }

  function markAllRead() {
    feed.forEach(function (n) { read.add(n.id); });
    saveReadSet(read);
    updateBadge();
    renderPanel();
  }

  function init() {
    var btn = document.getElementById('tmNotifBtn');
    if (!btn || btn.dataset.inited) return;
    btn.dataset.inited = '1';
    read = readSet();
    refresh();
    btn.addEventListener('click', function (e) { e.stopPropagation(); togglePanel(); });
    document.addEventListener('click', function (e) {
      var panel = document.getElementById('tmNotifPanel');
      if (!panel || !panel.classList.contains('is-open')) return;
      if (!panel.contains(e.target) && !btn.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
    var markBtn = document.getElementById('tmNotifMarkAll');
    if (markBtn) markBtn.addEventListener('click', function (e) { e.stopPropagation(); markAllRead(); });
    // oturum değişimlerinde tazele
    var prevHook = global.TMOnSessionChange;
    // app-shell zaten TMOnSessionChange'i sarıyor; periyodik hafif tazeleme yeterli
  }

  global.TMNotifications = { init: init, refresh: refresh, open: openPanel, close: closePanel };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : this);
