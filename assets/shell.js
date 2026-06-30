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
    mountYumiDock();
    initYumi();
    if (window.DashboardSwitcher) window.DashboardSwitcher.mount();
  }

  // ---- Yumi dock HTML (nav altına otomatik eklenir) -------------------
  function yumiDockHTML() {
    return (
      '<div class="yumi-dock">' +
        '<div class="yumi-panel yumi-notif" id="yumiNotif" role="dialog" aria-label="Yumi bildirimleri">' +
          '<div class="yumi-notif-head">' +
            '<span class="yumi-notif-name">Yumi</span>' +
            '<button type="button" class="yumi-x" data-yumi-close aria-label="Kapat">\u2715</button>' +
          '</div>' +
          '<p class="yumi-notif-text" id="yumiNotifText"></p>' +
          '<div class="yumi-notif-foot">' +
            '<span class="yumi-dots" id="yumiDots"></span>' +
            '<button type="button" class="yumi-next" id="yumiNext">' +
              '<span id="yumiNextLabel">\u0130leri</span>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="yumi-panel yumi-chat" id="yumiChat" role="dialog" aria-label="Yumi sohbet">' +
          '<div class="yumi-chat-head">' +
            '<span class="yumi-chat-ava" aria-hidden="true">\uD83E\uDD16</span>' +
            '<span class="yumi-chat-id">' +
              '<span class="yumi-chat-name">Yumi</span>' +
              '<span class="yumi-chat-status">\u00c7evrimi\u00e7i \u00b7 Asistan</span>' +
            '</span>' +
            '<button type="button" class="yumi-x" data-yumi-close aria-label="Kapat">\u2715</button>' +
          '</div>' +
          '<div class="yumi-chat-body" id="yumiChatBody"></div>' +
          '<form class="yumi-chat-input" id="yumiChatForm">' +
            '<input type="text" class="yumi-chat-field" id="yumiChatField" placeholder="Yumi\'ye bir \u015fey sor..." autocomplete="off" />' +
            '<button type="submit" class="yumi-chat-send" aria-label="G\u00f6nder">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '</button>' +
          '</form>' +
        '</div>' +
        '<button type="button" class="yumi-head" id="yumiHead" aria-label="Yumi">' +
          '<span aria-hidden="true">\uD83E\uDD16</span>' +
          '<span class="yumi-head-notif" id="yumiNotifBadge">3</span>' +
        '</button>' +
      '</div>'
    );
  }

  function yumiNavMount() {
    return document.querySelector('.stage-nav')
      || document.querySelector('.pv-nav')
      || document.querySelector('.pvd-nav');
  }

  function mountYumiDock() {
    if (document.getElementById('yumiHead')) return;
    var nav = yumiNavMount();
    if (!nav || nav.querySelector('.yumi-dock')) return;
    nav.insertAdjacentHTML('beforeend', yumiDockHTML());
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
    menu.addEventListener('click', function (e) {
      var logoutBtn = e.target.closest('.hud-menu-item.is-danger');
      if (!logoutBtn) return;
      e.preventDefault();
      logoutBtn.disabled = true;
      fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
        .finally(function () { window.location.href = '/giris'; });
    });
  }

  function getYumiContext() {
    if (document.body && document.body.getAttribute('data-teacher-active')) return 'teacher';
    if (document.body && (document.body.classList.contains('is-veli-parent') || /veli-/i.test(location.pathname))) return 'veli';
    return 'student';
  }

  function getYumiMessages() {
    var ctx = getYumiContext();
    if (ctx === 'teacher') {
      return [
        'Bugün 4 canlı dersin var — ilk dersin 09:30\'da başlıyor! 📚',
        'Kontrol bekleyen 6 ödev var — Ödev Kontrol sayfasından inceleyebilirsin.',
        'Alfa Klanı bu hafta XP sıralamasında 2. sırada — harika gidiyorlar! 🛡️'
      ];
    }
    if (ctx === 'veli') {
      return [
        'Mira\'nın bu hafta 2 ödevi teslim tarihine yaklaşıyor — Program sayfasından bakabilirsin.',
        'Son deneme sınavında genel net ortalaması yükseldi — Sonuçlar bölümünde detay var.',
        'Cumartesi saat 14:00\'te veli semineri var — Seminerler sayfasından kayıt olabilirsin.'
      ];
    }
    return [
      'Bugün 3 görevin var — Matematik dersin 16:50\'de başlıyor! 🚀',
      'Dün 80 XP kazandın, harika gidiyorsun — böyle devam! ⭐',
      'Fen ödevini tamamlamayı unutma, son 2 gün kaldı 📝'
    ];
  }

  function getYumiChatGreeting() {
    var ctx = getYumiContext();
    if (ctx === 'teacher') {
      return 'Merhaba! 👋 Ben Yumi. Bugünkü derslerin, ödev kontrolü ve klan performansı hakkında sorabilirsin.';
    }
    if (ctx === 'veli') {
      return 'Merhaba! 👋 Ben Yumi. Öğrencinizin ders programı, ödevleri ve sınav sonuçları hakkında sorabilirsiniz.';
    }
    return 'Merhaba Mira! 👋 Ben Yumi, kişisel çalışma asistanın. Bugün sana nasıl yardımcı olabilirim?';
  }

  function getYumiChatChips() {
    var ctx = getYumiContext();
    if (ctx === 'teacher') return ['Bugünkü derslerim', 'Bekleyen ödevler', 'Klan performansı'];
    if (ctx === 'veli') return ['Ders programı', 'Ödev durumu', 'Sınav sonuçları'];
    return ['Bugünkü derslerim', 'Ödevlerim', 'XP durumum'];
  }

  function botReply(text) {
    var t = text.toLocaleLowerCase('tr');
    var ctx = getYumiContext();
    if (ctx === 'teacher') {
      if (/ders|program|canl\u0131|canli|ak\u0131\u015f/.test(t)) return 'Bugün 4 dersin var. İlk ders 09:30\'da Matematik — Köklü Sayılar konusu. Hazırsın! 📐';
      if (/ödev|odev|kontrol/.test(t)) return '6 ödev kontrol bekliyor. Ödev Kontrol sayfasından inceleyip geri bildirim verebilirsin.';
      if (/klan|öğrenci|ogrenci|s\u0131ra|sira/.test(t)) return 'Alfa Klanı bu hafta 2. sırada. En aktif öğrencin bu hafta +320 XP kazandı!';
      if (/merhaba|selam|hey/.test(t)) return 'Selam! 😊 Öğretmen panelinde dersler, ödevler ve klanlar hakkında soru sorabilirsin.';
      if (/teşekkür|tesekkur|sağ ?ol|sagol/.test(t)) return 'Rica ederim! Her zaman buradayım 💜';
      return 'Bunu tam çözemedim 🤔 ama derslerin, ödev kontrolü veya klan performansı hakkında soru sorabilirsin!';
    }
    if (ctx === 'veli') {
      if (/program|ders|canl\u0131|canli/.test(t)) return 'Mira\'nın bugün 16:50\'de Matematik dersi var. Ders Programı sayfasından haftalık planı görebilirsiniz.';
      if (/ödev|odev/.test(t)) return '2 ödev teslim tarihine yaklaşıyor. Öğrenci Detay sayfasından ödev durumunu takip edebilirsiniz.';
      if (/s\u0131nav|sinav|sonu\u00e7|sonuc|net/.test(t)) return 'Son genel denemede net ortalaması 59 — geçen aya göre +4 net artış var. Sonuçlar sayfasında detay var.';
      if (/seminer|veli/.test(t)) return 'Cumartesi 14:00 veli semineri planlandı. Seminerler sayfasından katılım durumunu görebilirsiniz.';
      if (/merhaba|selam|hey/.test(t)) return 'Merhaba! 😊 Öğrencinizin programı, ödevleri ve sınav sonuçları hakkında soru sorabilirsiniz.';
      if (/teşekkür|tesekkur|sağ ?ol|sagol/.test(t)) return 'Rica ederim! Her zaman buradayım 💜';
      return 'Bunu tam çözemedim 🤔 ama ders programı, ödev durumu veya sınav sonuçları hakkında soru sorabilirsiniz!';
    }
    if (/ödev|odev/.test(t)) return 'Fen ödevin için son 2 gün kaldı. İstersen birlikte bir çalışma planı yapalım! 📝';
    if (/ders|matematik|canlı|canli|program/.test(t)) return 'Bugün 16:50\'de Matematik canlı dersin var — Köklü Sayılar konusu işlenecek. Hazır mısın? 📐';
    if (/xp|puan|seviye/.test(t)) return 'Şu an 2.450 XP\'n var ve sonraki seviyeye sadece 700 XP kaldı. Az kaldı! ⭐';
    if (/klan|sıra|sira|rütbe|rutbe/.test(t)) return 'Klanında 7. sıradasın ve dün 1 basamak yükseldin. Harika gidiyorsun! 🛡️';
    if (/merhaba|selam|naber|hey/.test(t)) return 'Selam Mira! 😊 Ben Yumi, çalışma yoldaşın. Sana nasıl yardımcı olabilirim?';
    if (/teşekkür|tesekkur|sağ ?ol|sagol|eyvallah/.test(t)) return 'Rica ederim! Her zaman buradayım 💜';
    return 'Bunu tam çözemedim 🤔 ama derslerin, ödevlerin, XP\'n ya da klan sıralaman hakkında soru sorabilirsin!';
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

    var messages = getYumiMessages();
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
      addBubble(getYumiChatGreeting(), 'bot');
      addChips(getYumiChatChips());
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
