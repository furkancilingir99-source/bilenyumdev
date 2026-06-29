/**
 * Veli Kontrol Merkezi — ortak header, context, modal, bildirim ve profil davranışı
 */
(function (global) {
  'use strict';

  var MAX_STUDENTS = 4;
  var ADD_STUDENT_URL = 'egitim-setleri.html';
  var NOW_REF = new Date('2026-06-23T12:00:00').getTime();

  var mockParent = {
    id: 'parent-1',
    name: 'Ayşe Çilingir',
    avatarUrl: '',
    email: 'ayse.cilingir@example.com'
  };

  var programTypeLabels = {
    weekday_early: 'Hafta içi Erken',
    weekday_late: 'Hafta içi Geç',
    weekend_morning: 'Haftasonu Sabah',
    weekend_evening: 'Haftasonu Akşam'
  };

  var mockParentStudents = [
    { id: 'student-1', name: 'Furkan Çilingir', avatarUrl: '', gradeLevel: '8. Sınıf', clanName: 'Alfa Klanı', programType: 'weekday_early' },
    { id: 'student-2', name: 'Zeynep Çilingir', avatarUrl: '', gradeLevel: '5. Sınıf', clanName: 'Beta Klanı', programType: 'weekend_morning' },
    { id: 'student-3', name: 'Ege Çilingir', avatarUrl: '', gradeLevel: '3. Sınıf', clanName: 'Mini Klan', programType: 'weekday_late' }
  ];

  var mockParentNotifications = [
    { id: 'notification-1', type: 'lesson', title: 'Canlı ders katılımı', description: 'Furkan bugünkü matematik dersine katıldı.', studentId: 'student-1', isRead: false, createdAt: '2026-06-23T09:10:00' },
    { id: 'notification-2', type: 'quiz', title: 'Quiz sonucu', description: 'Zeynep son quiz’de yeni bir rozet kazandı.', studentId: 'student-2', isRead: false, createdAt: '2026-06-23T08:30:00' },
    { id: 'notification-3', type: 'system', title: 'Ders hatırlatması', description: 'Bugün 19:00’da canlı ders var.', studentId: 'student-1', isRead: false, createdAt: '2026-06-23T07:00:00' },
    { id: 'notification-4', type: 'progress', title: 'Haftalık rapor', description: 'Furkan’ın haftalık gelişim raporu hazır.', studentId: 'student-1', isRead: true, createdAt: '2026-06-22T08:00:00' },
    { id: 'notification-5', type: 'quiz', title: 'Deneme tamamlandı', description: 'Ege matematik denemesini tamamladı, sonucu hazır.', studentId: 'student-3', isRead: true, createdAt: '2026-06-22T10:30:00' },
    { id: 'notification-6', type: 'payment', title: 'Ödeme alındı', description: 'Haziran ayı eğitim paketi ödemen başarıyla alındı.', studentId: 'student-1', isRead: true, createdAt: '2026-06-20T14:00:00' },
    { id: 'notification-7', type: 'system', title: 'Yeni eğitim seti', description: 'Zeynep için yeni bir eğitim seti eklendi.', studentId: 'student-2', isRead: true, createdAt: '2026-06-19T09:00:00' }
  ];

  var notifIconMap = {
    lesson:   { cls: 't-lesson',   svg: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>' },
    quiz:     { cls: 't-quiz',     svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 14 11 16 15 12"/>' },
    progress: { cls: 't-progress', svg: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
    system:   { cls: 't-system',   svg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
    payment:  { cls: 't-payment',  svg: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>' }
  };

  var state = {
    selectedStudentId: mockParentStudents.length ? mockParentStudents[0].id : null,
    openPanel: null
  };

  var wired = false;
  var onStudentChangeCb = null;

  function $(id) { return document.getElementById(id); }
  function initials(name) {
    return name.trim().split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toLocaleUpperCase('tr');
  }
  function studentById(id) {
    for (var i = 0; i < mockParentStudents.length; i++) {
      if (mockParentStudents[i].id === id) return mockParentStudents[i];
    }
    return null;
  }
  function programLabel(t) { return programTypeLabels[t] || t; }
  function escapeText(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function shortTime(iso) {
    var diff = Math.max(0, NOW_REF - new Date(iso).getTime());
    var min = Math.round(diff / 60000);
    if (min < 1) return 'Az önce';
    if (min < 60) return min + 'dk';
    var hr = Math.round(min / 60);
    if (hr < 24) return hr + 's';
    var d = Math.round(hr / 24);
    if (d === 1) return 'Dün';
    if (d < 7) return d + 'g';
    return Math.round(d / 7) + 'h';
  }
  function bucketLabel(iso) {
    var d = NOW_REF - new Date(iso).getTime();
    if (d < 24 * 3600e3) return 'Bugün';
    if (d < 48 * 3600e3) return 'Dün';
    if (d < 7 * 24 * 3600e3) return 'Bu hafta';
    return 'Daha eski';
  }
  function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; }

  /* ---- Tatlı, temaya uygun öğrenci avatarı (inline SVG) ---- */
  var _avaUid = 0;
  var AVATAR_LOOKS = {
    'student-1': { variant: 'boy',  bg1: '#e9e7fb', bg2: '#c7c2f1', shirt: '#3e3a8e', hair: '#2f2c5c' },
    'student-2': { variant: 'girl', bg1: '#fde7f1', bg2: '#f7c2dc', shirt: '#e6087b', hair: '#3a2742' },
    'student-3': { variant: 'boy',  bg1: '#e2f5f7', bg2: '#bfe8ec', shirt: '#0ea5b7', hair: '#2f2c5c' }
  };
  var AVATAR_PALETTES = [
    { bg1: '#e9e7fb', bg2: '#c7c2f1', shirt: '#3e3a8e', hair: '#2f2c5c' },
    { bg1: '#fde7f1', bg2: '#f7c2dc', shirt: '#e6087b', hair: '#3a2742' },
    { bg1: '#e2f5f7', bg2: '#bfe8ec', shirt: '#0ea5b7', hair: '#2f2c5c' },
    { bg1: '#fff1dc', bg2: '#ffd9a8', shirt: '#d4920a', hair: '#2f2c5c' }
  ];
  function hashStr(str) {
    var h = 0, t = String(str || '');
    for (var i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) >>> 0; }
    return h;
  }
  function studentLook(s) {
    if (s && AVATAR_LOOKS[s.id]) return AVATAR_LOOKS[s.id];
    var p = AVATAR_PALETTES[hashStr(s && (s.name || s.id)) % AVATAR_PALETTES.length];
    return { variant: 'boy', bg1: p.bg1, bg2: p.bg2, shirt: p.shirt, hair: p.hair };
  }
  function studentAvatarSvg(s) {
    var L = studentLook(s);
    var uid = 'sav' + (++_avaUid);
    var skin = '#f7c9a3', skinSh = '#eab98e', eye = '#2c2a5e', cheek = '#f49ac0', mouth = '#c25c8a';
    var sideHair = L.variant === 'girl'
      ? '<ellipse cx="18" cy="35" rx="5.2" ry="12" fill="' + L.hair + '"/><ellipse cx="46" cy="35" rx="5.2" ry="12" fill="' + L.hair + '"/>'
      : '';
    var bow = L.variant === 'girl'
      ? '<g transform="translate(32 11)"><path d="M0 0 L-7 -4 L-7 4 Z" fill="' + L.shirt + '"/><path d="M0 0 L7 -4 L7 4 Z" fill="' + L.shirt + '"/><circle cx="0" cy="0" r="2" fill="#fff"/></g>'
      : '';
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      + '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + L.bg1 + '"/><stop offset="1" stop-color="' + L.bg2 + '"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="64" height="64" fill="url(#' + uid + ')"/>'
      + '<circle cx="13" cy="16" r="1.5" fill="#fff" opacity=".6"/><circle cx="51" cy="13" r="1.1" fill="#fff" opacity=".5"/><circle cx="54" cy="41" r="1.3" fill="#fff" opacity=".45"/>'
      + '<ellipse cx="32" cy="61" rx="20" ry="13" fill="' + L.shirt + '"/>'
      + '<rect x="28.5" y="36" width="7" height="10" rx="3.5" fill="' + skinSh + '"/>'
      + sideHair
      + '<circle cx="32" cy="26" r="15" fill="' + L.hair + '"/>'
      + '<circle cx="19" cy="31" r="2.6" fill="' + skin + '"/><circle cx="45" cy="31" r="2.6" fill="' + skin + '"/>'
      + '<circle cx="32" cy="30" r="13" fill="' + skin + '"/>'
      + '<ellipse cx="32" cy="19" rx="13.5" ry="7" fill="' + L.hair + '"/>'
      + bow
      + '<circle cx="26.5" cy="30.5" r="1.9" fill="' + eye + '"/><circle cx="37.5" cy="30.5" r="1.9" fill="' + eye + '"/>'
      + '<circle cx="27.1" cy="29.9" r="0.6" fill="#fff"/><circle cx="38.1" cy="29.9" r="0.6" fill="#fff"/>'
      + '<circle cx="24" cy="35" r="2.3" fill="' + cheek + '" opacity=".6"/><circle cx="40" cy="35" r="2.3" fill="' + cheek + '" opacity=".6"/>'
      + '<path d="M28 35.5 q4 3.6 8 0" fill="none" stroke="' + mouth + '" stroke-width="1.7" stroke-linecap="round"/>'
      + '</svg>';
  }
  function avatarInner(s) {
    if (s && s.avatarUrl) return '<img src="' + escapeText(s.avatarUrl) + '" alt="">';
    return studentAvatarSvg(s);
  }

  function setAva(el, s) {
    if (!el || !s) return;
    el.innerHTML = avatarInner(s);
  }

  function renderActive() {
    var s = studentById(state.selectedStudentId);
    if (!s) return;
    var ctxAva = $('ctxAva');
    if (ctxAva) setAva(ctxAva, s);
    var ctxName = $('ctxName');
    if (ctxName) ctxName.textContent = s.name;
    var ctxClan = $('ctxClan');
    if (ctxClan) ctxClan.textContent = s.clanName;
    var ctxProgram = $('ctxProgram');
    if (ctxProgram) ctxProgram.textContent = programLabel(s.programType);
    var ctxMeta = $('ctxMeta');
    if (ctxMeta) ctxMeta.textContent = s.gradeLevel + ' · ' + s.clanName + ' · ' + programLabel(s.programType);
  }

  function renderProfileGrid() {
    var grid = $('profileGrid');
    if (!grid) return;
    grid.innerHTML = '';
    mockParentStudents.slice(0, MAX_STUDENTS).forEach(function (s) {
      var active = s.id === state.selectedStudentId;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pv-profile' + (active ? ' is-active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.dataset.id = s.id;
      var avaInner = avatarInner(s);
      btn.innerHTML =
        '<span class="pv-profile-ava" aria-hidden="true">' + avaInner +
          '<span class="pv-profile-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
        '</span>' +
        '<span class="pv-profile-name">' + escapeText(s.name) + '</span>' +
        '<span class="pv-profile-meta">' + escapeText(s.gradeLevel + ' · ' + s.clanName) + '</span>';
      btn.addEventListener('click', function () { selectStudent(s.id); });
      grid.appendChild(btn);
    });
    var remaining = MAX_STUDENTS - Math.min(mockParentStudents.length, MAX_STUDENTS);
    for (var i = 0; i < remaining; i++) {
      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'pv-profile is-add';
      add.setAttribute('aria-label', 'Öğrenci ekle');
      add.innerHTML =
        '<span class="pv-profile-ava" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>' +
        '<span class="pv-profile-name">Öğrenci Ekle</span>' +
        '<span class="pv-profile-meta">Boş öğrenci alanı</span>';
      add.addEventListener('click', goAddStudent);
      grid.appendChild(add);
    }
  }

  function goAddStudent() { global.location.href = ADD_STUDENT_URL; }

  function selectStudent(id) {
    state.selectedStudentId = id;
    renderActive();
    renderProfileGrid();
    closePanel();
    if (onStudentChangeCb) onStudentChangeCb(id, studentById(id));
    document.dispatchEvent(new CustomEvent('veli:student-change', { detail: { studentId: id, student: studentById(id) } }));
  }

  function unreadCount() {
    return mockParentNotifications.filter(function (n) { return !n.isRead; }).length;
  }

  function syncBadge() {
    var badge = $('notifBadge');
    if (!badge) return;
    var n = unreadCount();
    if (n > 0) { badge.textContent = n; badge.classList.remove('is-hidden'); }
    else { badge.classList.add('is-hidden'); }
  }

  function renderNotifItem(n) {
    var map = notifIconMap[n.type] || notifIconMap.system;
    var el = document.createElement('div');
    el.className = 'pv-drawer-item' + (n.isRead ? '' : ' is-unread');
    var dot = n.isRead ? '' : '<span class="pv-ditem-dot" aria-label="okunmamış"></span>';
    el.innerHTML =
      '<span class="pv-dico ' + map.cls + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + map.svg + '</svg></span>' +
      '<span class="pv-ditem-body">' +
        '<span class="pv-ditem-row">' +
          '<strong class="pv-ditem-title">' + escapeText(n.title) + '</strong>' +
          '<span class="pv-ditem-time">' + dot + escapeText(shortTime(n.createdAt)) + '</span>' +
        '</span>' +
        '<span class="pv-ditem-text">' + escapeText(n.description) + '</span>' +
      '</span>';
    el.addEventListener('click', function () {
      if (!n.isRead) {
        n.isRead = true;
        el.classList.remove('is-unread');
        var d = el.querySelector('.pv-ditem-dot');
        if (d) d.remove();
        syncBadge();
      }
    });
    return el;
  }

  function renderNotifications() {
    var body = $('pvNotifBody');
    if (!body) return;
    body.innerHTML = '';
    if (!mockParentNotifications.length) {
      body.innerHTML = '<div class="pv-drawer-empty">Henüz bildirim yok.</div>';
      return;
    }
    var items = mockParentNotifications.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    var groups = {};
    var order = ['Bugün', 'Dün', 'Bu hafta', 'Daha eski'];
    items.forEach(function (it) {
      var k = bucketLabel(it.createdAt);
      (groups[k] = groups[k] || []).push(it);
    });
    var first = true;
    order.forEach(function (gk) {
      if (!groups[gk]) return;
      var lbl = document.createElement('div');
      lbl.className = 'pv-drawer-group';
      var span = document.createElement('span');
      span.textContent = gk;
      lbl.appendChild(span);
      if (first) {
        var mark = document.createElement('button');
        mark.type = 'button';
        mark.className = 'pv-drawer-mark';
        mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Tümünü okundu işaretle</span>';
        mark.addEventListener('click', function (e) {
          e.stopPropagation();
          mockParentNotifications.forEach(function (n) { n.isRead = true; });
          syncBadge();
          renderNotifications();
        });
        lbl.appendChild(mark);
        first = false;
      }
      body.appendChild(lbl);
      var list = document.createElement('div');
      list.className = 'pv-drawer-list';
      groups[gk].forEach(function (n) { list.appendChild(renderNotifItem(n)); });
      body.appendChild(list);
    });
  }

  function openSwitcher() {
    if (state.openPanel && state.openPanel !== 'switcher') closePanel();
    state.openPanel = 'switcher';
    renderProfileGrid();
    var modal = $('studentModal');
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
    var ctxBtn = $('ctxSwitchBtn');
    if (ctxBtn) ctxBtn.setAttribute('aria-expanded', 'true');
    lockScroll(true);
  }

  function openNotif() {
    if (state.openPanel && state.openPanel !== 'notif') closePanel();
    state.openPanel = 'notif';
    renderNotifications();
    var drawer = $('pvNotifDrawer');
    if (drawer) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    var notifBtn = $('notifBtn');
    if (notifBtn) notifBtn.setAttribute('aria-expanded', 'true');
    lockScroll(true);
  }

  function openProfile() {
    if (state.openPanel && state.openPanel !== 'profile') closePanel();
    state.openPanel = 'profile';
    var menu = $('parentProfileMenu');
    if (menu) menu.classList.add('is-open');
    var btn = $('parentProfileBtn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    if (!state.openPanel) return;
    if (state.openPanel === 'switcher') {
      var modal = $('studentModal');
      if (modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
      var ctxBtn = $('ctxSwitchBtn');
      if (ctxBtn) ctxBtn.setAttribute('aria-expanded', 'false');
    } else if (state.openPanel === 'notif') {
      var drawer = $('pvNotifDrawer');
      if (drawer) {
        drawer.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
      }
      var notifBtn = $('notifBtn');
      if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
    } else if (state.openPanel === 'profile') {
      var menu = $('parentProfileMenu');
      if (menu) menu.classList.remove('is-open');
      var btn = $('parentProfileBtn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
    lockScroll(false);
    state.openPanel = null;
  }

  function toggle(name, opener) {
    if (state.openPanel === name) closePanel();
    else opener();
  }

  function wire() {
    if (wired) return;
    wired = true;
    var ctxSwitchBtn = $('ctxSwitchBtn');
    if (ctxSwitchBtn) {
      ctxSwitchBtn.addEventListener('click', function (e) { e.stopPropagation(); toggle('switcher', openSwitcher); });
    }
    var notifBtn = $('notifBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', function (e) { e.stopPropagation(); toggle('notif', openNotif); });
    }
    var parentProfileBtn = $('parentProfileBtn');
    if (parentProfileBtn) {
      parentProfileBtn.addEventListener('click', function (e) { e.stopPropagation(); toggle('profile', openProfile); });
    }
    var addStudentBtn = $('addStudentBtn');
    if (addStudentBtn) addStudentBtn.addEventListener('click', goAddStudent);

    Array.prototype.forEach.call(document.querySelectorAll('[data-pv-modal-close]'), function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); closePanel(); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-pv-drawer-close]'), function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); closePanel(); });
    });

    document.addEventListener('click', function (e) {
      if (state.openPanel !== 'profile') return;
      var btn = $('parentProfileBtn');
      var menu = $('parentProfileMenu');
      if (!btn || !menu) return;
      if (!btn.contains(e.target) && !menu.contains(e.target)) closePanel();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePanel();
    });
  }

  function initParentHeader() {
    var parentAva = $('parentAva');
    if (parentAva) {
      if (mockParent.avatarUrl) parentAva.innerHTML = '<img src="' + escapeText(mockParent.avatarUrl) + '" alt="">';
      else parentAva.textContent = initials(mockParent.name);
    }
    var parentName = $('parentName');
    if (parentName) parentName.textContent = mockParent.name;
  }

  function init(options) {
    options = options || {};
    onStudentChangeCb = options.onStudentChange || null;
    initParentHeader();
    renderActive();
    renderProfileGrid();
    renderNotifications();
    syncBadge();
    wire();
  }

  global.VeliParent = {
    init: init,
    closePanel: closePanel,
    getSelectedStudentId: function () { return state.selectedStudentId; },
    getStudentById: studentById,
    getStudents: function () { return mockParentStudents.slice(); },
    programLabel: programLabel,
    initials: initials,
    studentAvatar: studentAvatarSvg,
    avatarInner: avatarInner,
    selectStudent: selectStudent
  };
})(window);
