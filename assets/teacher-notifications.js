/**
 * Öğretmen paneli — bildirim drawer (sağdan açılır)
 * teacher-shell.js HUD'daki #teacherNotifBtn ile bağlanır.
 */
(function (global) {
  'use strict';

  var NOTIFS = [
    { id: 'tn1', type: 'hw', unread: true, time: '8dk', timeAt: Date.now() - 8 * 60e3,
      title: '12 ödev kontrol bekliyor',
      text: 'Alfa Klanı · Cebirsel İfadeler ödevini 12 öğrenci teslim etti. Değerlendirme bekliyor.',
      actions: [{ kind: 'review-hw', label: 'Ödevleri Kontrol Et' }] },
    { id: 'tn2', type: 'hw', unread: true, time: '25dk', timeAt: Date.now() - 25 * 60e3,
      title: '3 gecikmiş ödev teslimi',
      text: 'Beta Klanı\'ndan Mira Y., Can K. ve Elif S. süresi geçmiş ödevlerini az önce gönderdi.',
      actions: [{ kind: 'review-hw', label: 'İncele' }] },
    { id: 'tn3', type: 'live', unread: true, time: '45dk', timeAt: Date.now() - 45 * 60e3,
      title: 'Canlı ders 45 dk sonra',
      text: 'Matematik · Alfa Klanı — Doğrusal Denklemler konusu. 18 öğrenci kayıtlı.',
      actions: [{ kind: 'go-live', label: 'Derse Hazırlan' }, { kind: 'remind-live', label: 'Hatırlatıcı Ekle' }] },
    { id: 'tn4', type: 'exam', unread: true, time: '2s', timeAt: Date.now() - 2 * 3600e3,
      title: 'Deneme sonuçları hazır',
      text: 'Bilenyum Genel Deneme · 12 tamamlandı. Sınıf ortalaması 68 net, en yüksek 92 net.',
      actions: [{ kind: 'view-results', label: 'Sonuçları Gör' }] },
    { id: 'tn5', type: 'student', unread: true, time: '3s', timeAt: Date.now() - 3 * 3600e3,
      title: 'Yeni birebir öğrenci',
      text: 'Ayşe Demir birebir programına eklendi. İlk dersiniz Perşembe 17:00.',
      actions: [{ kind: 'view-students', label: 'Öğrenciyi Gör' }] },
    { id: 'tn6', type: 'clan', unread: true, time: '5s', timeAt: Date.now() - 5 * 3600e3,
      title: 'Klan performansı düştü',
      text: 'Beta Klanı bu hafta hedefin %12 gerisinde. 4 öğrenci ödev teslim etmedi.',
      actions: [{ kind: 'view-clans', label: 'Klanı İncele' }] },
    { id: 'tn7', type: 'msg', unread: false, time: 'Dün', timeAt: Date.now() - 26 * 3600e3,
      title: 'Veli mesajı',
      text: 'Mira Yılmaz\'ın velisi ödev teslim süresi hakkında bilgi istedi.' },
    { id: 'tn8', type: 'sys', unread: false, time: 'Dün', timeAt: Date.now() - 28 * 3600e3,
      title: 'Haftalık öğretmen raporu',
      text: 'Bu hafta 6 ders, 34 ödev değerlendirmesi ve 1 deneme analizi tamamlandı.',
      actions: [{ kind: 'view-report', label: 'Raporu Aç' }] },
    { id: 'tn9', type: 'exam', unread: false, time: '2g', timeAt: Date.now() - 50 * 3600e3,
      title: 'Deneme değerlendirmesi tamamlandı',
      text: 'TYT Matematik Denemesi · 11 soru analizi ve video çözüm önerileri hazır.' },
    { id: 'tn10', type: 'live', unread: false, time: '4g', timeAt: Date.now() - 98 * 3600e3,
      title: 'Ders kaydı yüklendi',
      text: 'Geometri · Üçgenler dersinin kaydı öğrencilerle paylaşıldı.' }
  ];

  var DRAWER_HTML =
    '<div class="sn-inbox-drawer" id="teacherNotifDrawer" data-mode="notif" aria-hidden="true">' +
      '<div class="sn-inbox-overlay" data-teacher-notif-close></div>' +
      '<aside class="sn-inbox-panel" role="dialog" aria-labelledby="teacherNotifTitle" aria-modal="true">' +
        '<button type="button" class="sn-inbox-close" data-teacher-notif-close aria-label="Kapat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<header class="sn-inbox-head">' +
          '<h3 class="sn-inbox-title" id="teacherNotifTitle">Bildirimler</h3>' +
        '</header>' +
        '<div class="sn-inbox-body" id="teacherNotifBody"></div>' +
      '</aside>' +
    '</div>';

  var wired = false;
  var drawer = null;
  var bodyEl = null;

  function escapeText(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function bucketLabel(ts) {
    var d = Date.now() - ts;
    if (d < 24 * 3600e3) return 'Bugün';
    if (d < 48 * 3600e3) return 'Dün';
    if (d < 7 * 24 * 3600e3) return 'Bu hafta';
    return 'Daha eski';
  }

  function notifIconHTML(type) {
    if (type === 'hw') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>';
    }
    if (type === 'exam') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 14 11 16 15 12"/></svg>';
    }
    if (type === 'live') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';
    }
    if (type === 'student') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    }
    if (type === 'clan') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    }
    if (type === 'msg') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  function actionIconHTML(kind, isSet) {
    if (kind === 'review-hw' || kind === 'view-results' || kind === 'view-report') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    }
    if (kind === 'go-live') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }
    if (kind === 'remind-live') {
      if (isSet) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h11"/><polyline points="16 16 18 18 22 14"/></svg>';
      }
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  }

  function showToast(text) {
    var toast = document.getElementById('snToast') || document.getElementById('toast');
    var textEl = document.getElementById('snToastText') || document.getElementById('toastText');
    if (toast && textEl) {
      textEl.textContent = text;
      toast.classList.add('is-show');
      setTimeout(function () { toast.classList.remove('is-show'); }, 1800);
      return;
    }
  }

  function fireAction(kind) {
    if (kind === 'review-hw') { global.location.href = 'ogretmen-odev-kontrol.html'; return; }
    if (kind === 'go-live') { global.location.href = 'ogretmen-canli-ders.html'; return; }
    if (kind === 'view-results') { global.location.href = 'ogretmen-deneme-sinavlari.html'; return; }
    if (kind === 'view-students') { global.location.href = 'ogretmen-klanlar.html'; return; }
    if (kind === 'view-clans') { global.location.href = 'ogretmen-klanlar.html'; return; }
    if (kind === 'view-report') { global.location.href = 'ogretmen-performans.html'; return; }
    if (kind === 'remind-live') { showToast('Hatırlatıcı eklendi.'); return; }
  }

  function updateBadge() {
    var btn = document.getElementById('teacherNotifBtn');
    if (!btn) return;
    var dot = btn.querySelector('.notif-dot');
    if (!dot) return;
    var unread = NOTIFS.filter(function (n) { return n.unread; }).length;
    dot.style.display = unread ? '' : 'none';
  }

  function markRead(n, el) {
    if (!n.unread) return;
    n.unread = false;
    if (el) {
      el.classList.remove('is-unread');
      var badgeEl = el.querySelector('.sn-inbox-new-dot');
      if (badgeEl) badgeEl.remove();
    }
    updateBadge();
  }

  function renderNotif(n) {
    var el = document.createElement('div');
    el.className = 'sn-inbox-item' + (n.unread ? ' is-unread' : '');
    var actionsHTML = '';
    if (n.actions && n.actions.length) {
      actionsHTML = '<span class="pop-actions">' + n.actions.map(function (a) {
        var cls = 'is-ghost';
        if (a.kind === 'go-live') cls = 'is-live';
        if (a.kind === 'review-hw' || a.kind === 'view-results') cls = 'is-primary';
        var isRemind = a.kind === 'remind-live';
        var isSet = isRemind && n.reminderSet;
        if (isSet) cls += ' is-set';
        var label = isRemind && isSet ? 'Hatırlatıcı Kaldır' : a.label;
        return '<button type="button" class="pop-btn ' + cls + '" data-teacher-notif-action="' + a.kind + '">' + actionIconHTML(a.kind, isSet) + escapeText(label) + '</button>';
      }).join('') + '</span>';
    }
    var badgeHTML = n.unread ? '<span class="sn-inbox-new-dot" aria-label="okunmamış"></span>' : '';
    el.innerHTML =
      '<span class="pop-icon pop-icon--' + n.type + '" aria-hidden="true">' + notifIconHTML(n.type) + '</span>' +
      '<span class="pop-body">' +
        '<span class="pop-row">' +
          '<strong class="pop-name">' + escapeText(n.title) + '</strong>' +
          '<span class="pop-time">' + badgeHTML + escapeText(n.time) + '</span>' +
        '</span>' +
        '<span class="pop-preview">' + escapeText(n.text) + '</span>' +
        actionsHTML +
      '</span>';
    el.querySelectorAll('[data-teacher-notif-action]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var act = b.getAttribute('data-teacher-notif-action');
        if (act === 'remind-live') {
          n.reminderSet = !n.reminderSet;
          var newLabel = n.reminderSet ? 'Hatırlatıcı Kaldır' : 'Hatırlatıcı Ekle';
          b.innerHTML = actionIconHTML(act, n.reminderSet) + escapeText(newLabel);
          b.classList.toggle('is-set', n.reminderSet);
          showToast(n.reminderSet ? 'Hatırlatıcı eklendi.' : 'Hatırlatıcı kaldırıldı.');
        } else {
          fireAction(act);
        }
        markRead(n, el);
      });
    });
    el.addEventListener('click', function () { markRead(n, el); });
    return el;
  }

  function renderList() {
    if (!bodyEl) return;
    bodyEl.innerHTML = '';
    if (!NOTIFS.length) {
      bodyEl.innerHTML = '<div class="sn-inbox-empty">Henüz bildirim yok.</div>';
      return;
    }
    var groups = {};
    var order = ['Bugün', 'Dün', 'Bu hafta', 'Daha eski'];
    NOTIFS.slice().sort(function (a, b) { return b.timeAt - a.timeAt; }).forEach(function (it) {
      var k = bucketLabel(it.timeAt);
      if (!groups[k]) groups[k] = [];
      groups[k].push(it);
    });
    var isFirst = true;
    order.forEach(function (gk) {
      if (!groups[gk]) return;
      var lbl = document.createElement('div');
      lbl.className = 'sn-inbox-group-label';
      var labelText = document.createElement('span');
      labelText.textContent = gk;
      lbl.appendChild(labelText);
      if (isFirst) {
        var markBtn = document.createElement('button');
        markBtn.type = 'button';
        markBtn.className = 'sn-inbox-mark';
        markBtn.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
          '<span>Tümünü okundu işaretle</span>';
        markBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          NOTIFS.forEach(function (n) { n.unread = false; });
          updateBadge();
          renderList();
          showToast('Tümü okundu olarak işaretlendi.');
        });
        lbl.appendChild(markBtn);
        isFirst = false;
      }
      bodyEl.appendChild(lbl);
      var list = document.createElement('div');
      list.className = 'sn-inbox-list';
      groups[gk].forEach(function (n) { list.appendChild(renderNotif(n)); });
      bodyEl.appendChild(list);
    });
  }

  function openDrawer() {
    renderList();
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var btn = document.getElementById('teacherNotifBtn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    var btn = document.getElementById('teacherNotifBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function injectDrawer() {
    if (document.getElementById('teacherNotifDrawer')) {
      drawer = document.getElementById('teacherNotifDrawer');
      bodyEl = document.getElementById('teacherNotifBody');
      return;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = DRAWER_HTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    drawer = document.getElementById('teacherNotifDrawer');
    bodyEl = document.getElementById('teacherNotifBody');
  }

  function wire() {
    if (wired) return;
    wired = true;
    injectDrawer();
    if (!drawer) return;

    drawer.querySelectorAll('[data-teacher-notif-close]').forEach(function (el) {
      el.addEventListener('click', closeDrawer);
    });

    var btn = document.getElementById('teacherNotifBtn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (drawer.classList.contains('is-open')) closeDrawer();
        else openDrawer();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });

    updateBadge();
  }

  function init() {
    if (!document.getElementById('teacherNotifBtn')) return;
    wire();
  }

  global.TeacherNotifications = {
    init: init,
    open: openDrawer,
    close: closeDrawer,
    NOTIFS: NOTIFS
  };
})(typeof window !== 'undefined' ? window : this);
