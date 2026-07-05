/**
 * Deneme Dersi Yöneticisi — bildirim drawer
 */
(function (global) {
  'use strict';

  var NOTIFS = [
    { id: 'tm1', unread: true, time: '5dk', timeAt: Date.now() - 5 * 60e3,
      title: 'Yeni deneme dersi talebi',
      text: 'Mira Yılmaz · 7. Sınıf Matematik · Pazartesi 14:30. Veli: Ayşe Yılmaz.' },
    { id: 'tm2', unread: true, time: '18dk', timeAt: Date.now() - 18 * 60e3,
      title: 'Bugün 3 deneme dersi var',
      text: 'Can Kaya (16:00), Defne Koç (11:30) ve bir veli onayı bekleyen talep.' },
    { id: 'tm3', unread: true, time: '1s', timeAt: Date.now() - 3600e3,
      title: 'Onay bekleyen 4 rezervasyon',
      text: 'Rezervasyonlar sekmesinden veli bilgilerini inceleyip onaylayabilirsin.' },
    { id: 'tm4', unread: false, time: 'Dün', timeAt: Date.now() - 26 * 3600e3,
      title: 'Emir Çelik dersi tamamlandı',
      text: '8. Sınıf Matematik deneme dersi başarıyla gerçekleştirildi.' }
  ];

  var DRAWER_HTML =
    '<div class="sn-inbox-drawer" id="tmNotifDrawer" data-mode="notif" aria-hidden="true">' +
      '<div class="sn-inbox-overlay" data-tm-notif-close></div>' +
      '<aside class="sn-inbox-panel" role="dialog" aria-labelledby="tmNotifTitle" aria-modal="true">' +
        '<button type="button" class="sn-inbox-close" data-tm-notif-close aria-label="Kapat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<header class="sn-inbox-head">' +
          '<h3 class="sn-inbox-title" id="tmNotifTitle">Bildirimler</h3>' +
        '</header>' +
        '<div class="sn-inbox-body" id="tmNotifBody"></div>' +
      '</aside>' +
    '</div>';

  var drawer = null;
  var bodyEl = null;

  function escapeText(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function updateBadge() {
    var dot = document.querySelector('#tmNotifBtn .notif-dot');
    if (!dot) return;
    var unread = NOTIFS.some(function (n) { return n.unread; });
    dot.hidden = !unread;
  }

  function renderList() {
    if (!bodyEl) return;
    bodyEl.innerHTML = '';
    if (!NOTIFS.length) {
      bodyEl.innerHTML = '<div class="sn-inbox-empty">Henüz bildirim yok.</div>';
      return;
    }
    var list = document.createElement('div');
    list.className = 'sn-inbox-list';
    NOTIFS.forEach(function (n) {
      var el = document.createElement('article');
      el.className = 'sn-inbox-item' + (n.unread ? ' is-unread' : '');
      el.innerHTML =
        '<div class="sn-inbox-item-head">' +
          '<strong class="sn-inbox-item-title">' + escapeText(n.title) + '</strong>' +
          '<span class="sn-inbox-item-time">' + escapeText(n.time) + '</span>' +
        '</div>' +
        '<p class="sn-inbox-item-text">' + escapeText(n.text) + '</p>';
      el.addEventListener('click', function () {
        n.unread = false;
        el.classList.remove('is-unread');
        updateBadge();
      });
      list.appendChild(el);
    });
    bodyEl.appendChild(list);
  }

  function openDrawer() {
    renderList();
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var btn = document.getElementById('tmNotifBtn');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    var btn = document.getElementById('tmNotifBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function injectDrawer() {
    if (document.getElementById('tmNotifDrawer')) {
      drawer = document.getElementById('tmNotifDrawer');
      bodyEl = document.getElementById('tmNotifBody');
      return;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = DRAWER_HTML;
    drawer = wrap.firstElementChild;
    bodyEl = drawer.querySelector('#tmNotifBody');
    document.body.appendChild(drawer);
  }

  function wire() {
    var btn = document.getElementById('tmNotifBtn');
    if (!btn || btn.dataset.tmNotifWired) return;
    btn.dataset.tmNotifWired = '1';
    btn.addEventListener('click', function () {
      if (drawer && drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('[data-tm-notif-close]')) closeDrawer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  function init() {
    injectDrawer();
    wire();
    updateBadge();
  }

  global.TrialManagerNotifications = { init: init };
})(typeof window !== 'undefined' ? window : this);
