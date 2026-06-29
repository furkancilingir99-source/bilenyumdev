/* ============================================================
 * Bilenyum — Paylaşılan shell JS (stars + profil menü + Yumi)
 *
 * Tüm dashboard sayfalarında bunu yükle (defer ile):
 *   <script src="assets/shell.js" defer></script>
 *
 * Çalışması için sayfada şu elementler beklenir:
 *   - #stars (seeded star background container)
 *   - #profileBtn + #profileMenu (profil dropdown)
 *   - #yumiHead + #yumiNotif + #yumiChat (+ alt ID'ler) [opsiyonel]
 * ============================================================ */
(function () {
  'use strict';

  function init() {
    initStars();
    initProfileMenu();
    initYumi();
    if (window.DashboardSwitcher) window.DashboardSwitcher.mount();
  }

  // ---- Stars (seeded random) -----------------------------------------
  function initStars() {
    var layer = document.getElementById('stars');
    if (!layer || layer.dataset.inited) return;
    layer.dataset.inited = '1';
    function sRand(i, seed) { var x = Math.sin(i * seed) * 10000; return x - Math.floor(x); }
    var count = 160;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('div');
      s.className = 'star';
      var r = sRand(i + 1, 7.3);
      if (r < 0.10) s.className += ' lg';
      else if (r < 0.18) s.className += ' pink';
      else if (r < 0.24) s.className += ' gold';
      s.style.top = (sRand(i + 1, 11.7) * 100) + '%';
      s.style.left = (sRand(i + 1, 17.1) * 100) + '%';
      s.style.animationDelay = (sRand(i + 1, 23.9) * 5) + 's';
      s.style.animationDuration = (2 + sRand(i + 1, 31.3) * 3) + 's';
      if (sRand(i + 1, 41.7) < 0.4) s.className += ' tw';
      layer.appendChild(s);
    }
  }

  // ---- Profile menu ---------------------------------------------------
  function initProfileMenu() {
    var btn = document.getElementById('profileBtn');
    var menu = document.getElementById('profileMenu');
    if (!btn || !menu || btn.dataset.inited) return;
    btn.dataset.inited = '1';
    function close() { menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = !menu.classList.contains('is-open');
      close();
      if (willOpen) { menu.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !menu.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // ---- Yumi (bildirim popup + chatbot) --------------------------------
  function initYumi() {
    var head = document.getElementById('yumiHead');
    var badge = document.getElementById('yumiNotifBadge');
    var notif = document.getElementById('yumiNotif');
    var chat = document.getElementById('yumiChat');
    if (!head || !badge || !notif || !chat || head.dataset.inited) return;
    head.dataset.inited = '1';

    var notifText = document.getElementById('yumiNotifText');
    var dotsWrap = document.getElementById('yumiDots');
    var nextBtn = document.getElementById('yumiNext');
    var nextLabel = document.getElementById('yumiNextLabel');
    var nextArrow = nextBtn ? nextBtn.querySelector('svg') : null;

    var messages = [
      'Bugün 3 görevin var — Matematik dersin 16:50\'de başlıyor! 🚀',
      'Dün 80 XP kazandın, harika gidiyorsun — böyle devam! ⭐',
      'Fen ödevini tamamlamayı unutma, son 2 gün kaldı 📝'
    ];
    var read = messages.map(function () { return false; });
    var idx = 0;
    function unread() { return read.filter(function (r) { return !r; }).length; }
    function syncBadge() {
      var n = unread();
      if (n > 0) { badge.textContent = n; badge.classList.remove('is-hidden'); }
      else { badge.classList.add('is-hidden'); }
    }
    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      messages.forEach(function (_, i) {
        var d = document.createElement('span');
        d.className = 'yumi-dot' + (i === idx ? ' is-active' : (read[i] ? ' is-read' : ''));
        dotsWrap.appendChild(d);
      });
    }
    function showMessage(i) {
      idx = i; read[i] = true;
      if (notifText) notifText.textContent = messages[i];
      syncBadge(); renderDots();
      var last = idx >= messages.length - 1;
      if (nextLabel) nextLabel.textContent = last ? 'Kapat' : 'İleri';
      if (nextArrow) nextArrow.style.display = last ? 'none' : '';
    }
    function firstUnread() { for (var i = 0; i < read.length; i++) { if (!read[i]) return i; } return 0; }
    function closeAll() { notif.classList.remove('is-open'); chat.classList.remove('is-open'); }
    function openNotif() { closeAll(); showMessage(firstUnread()); notif.classList.add('is-open'); }
    function openChat() {
      closeAll(); initChat(); chat.classList.add('is-open');
      setTimeout(function () { if (chatField) chatField.focus(); }, 240);
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (idx >= messages.length - 1) closeAll();
        else showMessage(idx + 1);
      });
    }
    head.addEventListener('click', function () {
      if (notif.classList.contains('is-open') || chat.classList.contains('is-open')) { closeAll(); return; }
      if (unread() > 0) openNotif(); else openChat();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-yumi-close]'), function (b) {
      b.addEventListener('click', closeAll);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.yumi-dock')) closeAll();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

    // Chatbot
    var chatBody = document.getElementById('yumiChatBody');
    var chatForm = document.getElementById('yumiChatForm');
    var chatField = document.getElementById('yumiChatField');
    var chatReady = false;
    function addBubble(text, who) {
      var b = document.createElement('div');
      b.className = 'yumi-chat-msg from-' + who;
      b.textContent = text;
      chatBody.appendChild(b);
      chatBody.scrollTop = chatBody.scrollHeight;
      return b;
    }
    function addChips(items) {
      var wrap = document.createElement('div');
      wrap.className = 'yumi-chips';
      items.forEach(function (label) {
        var c = document.createElement('button');
        c.type = 'button'; c.className = 'yumi-chip'; c.textContent = label;
        c.addEventListener('click', function (ev) { ev.stopPropagation(); handleUser(label); });
        wrap.appendChild(c);
      });
      chatBody.appendChild(wrap);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
    function botReply(text) {
      var t = text.toLocaleLowerCase('tr');
      if (/ödev|odev/.test(t)) return 'Fen ödevin için son 2 gün kaldı. İstersen birlikte bir çalışma planı yapalım! 📝';
      if (/ders|matematik|canlı|canli|program/.test(t)) return 'Bugün 16:50\'de Matematik canlı dersin var — Köklü Sayılar konusu işlenecek. Hazır mısın? 📐';
      if (/xp|puan|seviye/.test(t)) return 'Şu an 2.450 XP\'n var ve sonraki seviyeye sadece 700 XP kaldı. Az kaldı! ⭐';
      if (/klan|sıra|sira|rütbe|rutbe/.test(t)) return 'Klanında 7. sıradasın ve dün 1 basamak yükseldin. Harika gidiyorsun! 🛡️';
      if (/merhaba|selam|naber|hey/.test(t)) return 'Selam Mira! 😊 Ben Yumi, çalışma yoldaşın. Sana nasıl yardımcı olabilirim?';
      if (/teşekkür|tesekkur|sağ ?ol|sagol|eyvallah/.test(t)) return 'Rica ederim! Her zaman buradayım 💜';
      return 'Bunu tam çözemedim 🤔 ama derslerin, ödevlerin, XP\'n ya da klan sıralaman hakkında soru sorabilirsin!';
    }
    function handleUser(text) {
      var chips = chatBody.querySelector('.yumi-chips'); if (chips) chips.remove();
      addBubble(text, 'user');
      var typing = addBubble('Yumi yazıyor…', 'bot');
      typing.classList.add('is-typing');
      setTimeout(function () { typing.remove(); addBubble(botReply(text), 'bot'); }, 700);
    }
    function initChat() {
      if (chatReady) return;
      chatReady = true;
      addBubble('Merhaba Mira! 👋 Ben Yumi, kişisel çalışma asistanın. Bugün sana nasıl yardımcı olabilirim?', 'bot');
      addChips(['Bugünkü derslerim', 'Ödevlerim', 'XP durumum']);
    }
    if (chatForm) {
      chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = chatField.value.trim(); if (!v) return;
        chatField.value = ''; handleUser(v);
      });
    }

    syncBadge();
  }

  // DOM hazırsa hemen, değilse bekle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
