/* ============================================================
 * Bilenyum — Paylaşılan Inbox + Chat sistemi
 *
 * Bağlama:
 *   <script src="assets/inbox.js"></script>
 *
 * Topbar butonları:
 *   <button data-inbox-open="msg">…</button>
 *   <button data-inbox-open="notif">…</button>
 *
 * Sayfa yüklendiğinde drawer HTML'leri body'ye otomatik enjekte edilir,
 * butonlar bağlanır ve toast/animasyonlar hazır olur.
 * ============================================================ */
(function () {
  'use strict';

  // ---- DATA ------------------------------------------------------------
  var NOTIFS = [
    { id:'n1', type:'exam', unread:true, time:'2s', timeAt:Date.now() - 2*3600e3,
      title:'Yaklaşan deneme · Cumartesi 10:00',
      text:'Bilenyum Genel Deneme · 12 — TYT formatında 120 soru. Tüm dersleri kapsar.',
      actions:[{ kind:'join', label:'Sınava Katıl' }, { kind:'remind', label:'Hatırlatıcı Ekle' }] },
    { id:'n2', type:'rank', unread:true, time:'5s', timeAt:Date.now() - 5*3600e3,
      title:'Genel sıralaman yükseldi',
      text:'Tebrikler! 6 sıra ilerledin, şimdi #24. sıradasın.' },
    { id:'n3', type:'clan', unread:true, time:'9s', timeAt:Date.now() - 9*3600e3,
      title:'Alfa Klanı zirveye tırmandı',
      text:'Klanın bu hafta 1.250 XP topladı — sıralama 5.\'ten 3.\'e yükseldi.' },
    { id:'n4', type:'live', unread:true, time:'15dk', timeAt:Date.now() - 15*60e3,
      title:'Canlı ders 15 dk sonra başlıyor',
      text:'Fen Bilimleri · Zeynep Yıldız — Modern Fizik konusu işlenecek.',
      actions:[{ kind:'join-live', label:'Derse Katıl' }, { kind:'remind-live', label:'Hatırlatıcı Ekle' }] },
    { id:'n5', type:'sys', unread:false, time:'Dün', timeAt:Date.now() - 26*3600e3,
      title:'Haftalık özet hazır',
      text:'Bu hafta 12 ödev, 1 deneme ve 4 canlı ders tamamladın.' },
    { id:'n6', type:'rank', unread:false, time:'2g', timeAt:Date.now() - 50*3600e3,
      title:'Okul sıralamasında 3. oldun',
      text:'Bilenyum 9D sınıfında bu hafta net ortalamanla 3. sırada bitirdin.' },
    { id:'n7', type:'exam', unread:false, time:'3g', timeAt:Date.now() - 74*3600e3,
      title:'Deneme sonucun yayında',
      text:'Bilenyum Genel Deneme · 11 sonucun yayınlandı. Net: 76 / 120.' },
    { id:'n8', type:'live', unread:false, time:'5g', timeAt:Date.now() - 122*3600e3,
      title:'Canlı ders kaydı yüklendi',
      text:'Matematik · Ali Demir — Trigonometri dersinin kaydını izleyebilirsin.' },
    { id:'n9', type:'clan', unread:false, time:'1h', timeAt:Date.now() - 7*24*3600e3,
      title:'Yeni klan üyesi',
      text:'Alfa Klanı\'na yeni katılan Burak G. ekibe hoş geldi.' }
  ];

  var MSGS = [
    { id:'m1', sender:'teacher', teacherId:'t-ali', unread:true, time:'12dk', timeAt:Date.now() - 12*60e3,
      name:'Ali Demir · Matematik', initials:'AD', avatarKind:'purple',
      photo:'https://i.pravatar.cc/200?img=68',
      text:'Yarın ki deneme öncesi geometri tekrarı yapalım, hazır ol.' },
    { id:'m2', sender:'teacher', teacherId:'t-zeynep', unread:true, time:'1s', timeAt:Date.now() - 60*60e3,
      name:'Zeynep Yıldız · Fen', initials:'ZY', avatarKind:'gold',
      photo:'https://i.pravatar.cc/200?img=45',
      text:'Son denemende fizik netin çok güzel yükselmiş, aferin sana!' },
    { id:'m3', sender:'system', unread:true, time:'3s', timeAt:Date.now() - 3*3600e3,
      name:'Bilenyum Sistemi', avatarKind:'green', icon:'info',
      text:'Haftalık raporun hazır — bu hafta 4 başarım kazandın, 320 XP topladın.' },
    { id:'m4', sender:'teacher', teacherId:'t-mehmet', unread:false, time:'Dün', timeAt:Date.now() - 26*3600e3,
      name:'Mehmet Kaya · Türkçe', initials:'MK', avatarKind:'brand',
      photo:'https://i.pravatar.cc/200?img=53',
      text:'Paragraf sorularındaki gelişimini takdir ediyorum, devam et.' },
    { id:'m5', sender:'system', unread:false, time:'2g', timeAt:Date.now() - 50*3600e3,
      name:'Bilenyum Sistemi', avatarKind:'green', icon:'check',
      text:'Mayıs ayı performans rozetini kazandın! Profilinde görmek için tıkla.' },
    { id:'m6', sender:'teacher', teacherId:'t-selin', unread:false, time:'4g', timeAt:Date.now() - 98*3600e3,
      name:'Selin Aydın · Sosyal', initials:'SA', avatarKind:'aqua',
      photo:'https://i.pravatar.cc/200?img=32',
      text:'Tarih konusunda biraz daha tekrara ihtiyacın var.' },
    { id:'m7', sender:'system', unread:false, time:'1h', timeAt:Date.now() - 7*24*3600e3,
      name:'Bilenyum Sistemi', avatarKind:'green', icon:'info',
      text:'Yeni eğitim seti eklendi: TYT Matematik Kampı.' }
  ];

  var TEACHERS = [
    { id:'t-ali',    name:'Ali Demir',     title:'Matematik',     initials:'AD', avatarKind:'purple', online:true,  photo:'https://i.pravatar.cc/200?img=68' },
    { id:'t-zeynep', name:'Zeynep Yıldız', title:'Fen Bilimleri', initials:'ZY', avatarKind:'gold',   online:true,  photo:'https://i.pravatar.cc/200?img=45' },
    { id:'t-mehmet', name:'Mehmet Kaya',   title:'Türkçe',        initials:'MK', avatarKind:'brand',  online:false, photo:'https://i.pravatar.cc/200?img=53' },
    { id:'t-selin',  name:'Selin Aydın',   title:'Sosyal',        initials:'SA', avatarKind:'aqua',   online:true,  photo:'https://i.pravatar.cc/200?img=32' },
    { id:'t-emre',   name:'Emre Çelik',    title:'İngilizce',     initials:'EÇ', avatarKind:'green',  online:true,  photo:'https://i.pravatar.cc/200?img=12' },
    { id:'t-burcu',  name:'Burcu Aksoy',   title:'Geometri',      initials:'BA', avatarKind:'purple', online:false, photo:'https://i.pravatar.cc/200?img=49' }
  ];

  var CHATS = {
    't-ali': [
      { from:'teacher', text:'Selam Mira, hafta sonu denemesi için hazırlıklı misin?', time:'Dün 14:32' },
      { from:'me',      text:'Merhaba hocam, geometri biraz zayıf hala', time:'Dün 14:36' },
      { from:'teacher', text:'O zaman bugün üçgen ve dörtgen sorularını birlikte çözelim mi?', time:'Dün 14:40' },
      { from:'me',      text:'Olur hocam, hangi saatte?', time:'Dün 14:42' },
      { from:'teacher', text:'19:30 uygun mu sana?', time:'Dün 14:45' },
      { from:'me',      text:'Tamam hocam, hazır olurum 🙌', time:'Dün 14:48' },
      { from:'teacher', text:'Yarın ki deneme öncesi geometri tekrarı yapalım, hazır ol. Özellikle üçgen ve dörtgen sorularına bak.', time:'12:18' }
    ],
    't-zeynep': [
      { from:'teacher', text:'Mira, son fizik testindeki çıkışını gördüm — mükemmel!', time:'10:45' },
      { from:'me',      text:'Çok teşekkür ederim hocam 🌟', time:'11:02' },
      { from:'teacher', text:'Son denemende fizik netin çok güzel yükselmiş, aferin sana! Bu hızla devam edersen hedefini geçeceksin.', time:'11:30' }
    ],
    't-mehmet': [
      { from:'teacher', text:'Paragraf sorularındaki gelişimini takdir ediyorum, devam et. Önümüzdeki hafta cümle bilgisi çalışacağız.', time:'Dün 16:45' },
      { from:'me',      text:'Teşekkürler hocam! Konuya hazırlıklı geleceğim.', time:'Dün 17:02' }
    ],
    't-selin': [
      { from:'teacher', text:'Tarih konusunda biraz daha tekrara ihtiyacın var, bu hafta sonu için ek alıştırma listesi paylaştım.', time:'4 gün önce' }
    ],
    't-emre': [
      { from:'teacher', text:'Mira, vocabulary listesini paylaştım — Pazartesi quiz var, hazırlıklı gel.', time:'Dün 18:20' },
      { from:'me',      text:'Hocam tamam, çalışıyorum. Phrasal verbs konusunda zorlanıyorum biraz.', time:'Dün 19:05' },
      { from:'teacher', text:'O zaman yarın derste o konuyu özetlerim. Önceden chapter 4\'ü okuyabilir misin?', time:'Dün 19:12' },
      { from:'me',      text:'Tabii hocam 👍', time:'Dün 19:15' }
    ],
    't-burcu': [
      { from:'teacher', text:'Geometri quiz sonucunu inceledim. Üçgenlerde benzerlik konusunu birlikte tekrar edelim.', time:'2 gün önce' },
      { from:'me',      text:'Ne zaman müsaitsiniz hocam?', time:'2 gün önce' }
    ]
  };

  // ---- HTML INJECT -----------------------------------------------------
  var DRAWERS_HTML =
    '<div class="sn-inbox-drawer" id="snNotifDrawer" data-mode="notif" aria-hidden="true">' +
      '<div class="sn-inbox-overlay" data-inbox-close></div>' +
      '<aside class="sn-inbox-panel" role="dialog" aria-labelledby="snNotifDrawerTitle" aria-modal="true">' +
        '<button type="button" class="sn-inbox-close" data-inbox-close aria-label="Kapat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<header class="sn-inbox-head">' +
          '<h3 class="sn-inbox-title" id="snNotifDrawerTitle">Tüm Bildirimler</h3>' +
        '</header>' +
        '<div class="sn-inbox-body" data-inbox-list="notif"></div>' +
      '</aside>' +
    '</div>' +
    '<div class="sn-inbox-drawer" id="snMsgDrawer" data-mode="msg" aria-hidden="true">' +
      '<div class="sn-inbox-overlay" data-inbox-close></div>' +
      '<aside class="sn-inbox-panel" role="dialog" aria-labelledby="snMsgDrawerTitle" aria-modal="true">' +
        '<button type="button" class="sn-inbox-close" data-inbox-close aria-label="Kapat">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<header class="sn-inbox-head">' +
          '<h3 class="sn-inbox-title" id="snMsgDrawerTitle">Tüm Mesajlar</h3>' +
        '</header>' +
        '<div class="sn-msg-teachers">' +
          '<div class="sn-msg-teachers-label">Öğretmenlerim</div>' +
          '<div class="sn-msg-teachers-list" id="snMsgTeachersList"></div>' +
        '</div>' +
        '<div class="sn-inbox-body" data-inbox-list="msg"></div>' +
      '</aside>' +
    '</div>' +
    '<div class="sn-chat-drawer" id="snChatDrawer" aria-hidden="true">' +
      '<div class="sn-chat-overlay" data-chat-close></div>' +
      '<aside class="sn-chat-panel" role="dialog" aria-modal="true">' +
        '<header class="sn-chat-head">' +
          '<button type="button" class="sn-chat-back" data-chat-close aria-label="Geri">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>' +
          '</button>' +
          '<div class="sn-chat-head-avatar" id="snChatHeadAvatar"></div>' +
          '<div class="sn-chat-head-id">' +
            '<strong class="sn-chat-head-name" id="snChatHeadName">—</strong>' +
            '<span class="sn-chat-head-status" id="snChatHeadStatus">' +
              '<span class="sn-chat-head-status-dot"></span>' +
              '<span id="snChatHeadStatusText">—</span>' +
            '</span>' +
          '</div>' +
        '</header>' +
        '<div class="sn-chat-body" id="snChatBody"></div>' +
        '<form class="sn-chat-input" id="snChatForm" autocomplete="off">' +
          '<input type="text" class="sn-chat-field" id="snChatField" placeholder="Mesaj yaz…" />' +
          '<button type="submit" class="sn-chat-send" id="snChatSend" aria-label="Gönder">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</button>' +
        '</form>' +
      '</aside>' +
    '</div>';

  // ---- HELPERS ---------------------------------------------------------
  function notifIconHTML(type) {
    if (type === 'exam') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 14 11 16 15 12"/></svg>';
    if (type === 'rank') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
    if (type === 'clan') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    if (type === 'live') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }
  function sysIconHTML(kind) {
    if (kind === 'check') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  }
  function actionIconHTML(kind, isSet) {
    if (kind === 'join')        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    if (kind === 'join-live')   return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    if (kind === 'remind' || kind === 'remind-live') {
      if (isSet) {
        // Bell + check (hatırlatıcı kurulu)
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h11"/><polyline points="16 16 18 18 22 14"/></svg>';
      }
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
    }
    return '';
  }
  function bucketLabel(ts) {
    var d = Date.now() - ts;
    if (d < 24*3600e3) return 'Bugün';
    if (d < 48*3600e3) return 'Dün';
    if (d < 7*24*3600e3) return 'Bu hafta';
    return 'Daha eski';
  }
  function escapeText(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function showToast(text) {
    var toast = document.getElementById('snToast') || document.getElementById('toast');
    var textEl = document.getElementById('snToastText') || document.getElementById('toastText');
    if (toast && textEl) {
      textEl.textContent = text;
      toast.classList.add('is-show');
      setTimeout(function () { toast.classList.remove('is-show'); }, 1800);
    }
  }
  function fireNotifAction(act) {
    if (act === 'join-live') {
      if (global.BilenyumLiveClass) {
        global.BilenyumLiveClass.go({
          subject: 'mat',
          topic: 'Köklü Sayılar & Cebirsel İfadeler',
          teacher: 'Mehmet Yılmaz',
          teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=faces&q=80'
        });
      } else {
        global.location.href = 'ogrenci-canli-ders.html';
      }
      return;
    }
    var msg = '';
    if (act === 'join')           msg = 'Sınava katıldın — başarılar!';
    else if (act === 'remind')    msg = 'Hatırlatıcı eklendi.';
    else if (act === 'remind-live') msg = 'Canlı ders için hatırlatıcı eklendi.';
    if (msg) showToast(msg);
  }

  // ---- BOOT ------------------------------------------------------------
  function boot() {
    // Drawer HTML enjekte (zaten varsa atla)
    if (!document.getElementById('snNotifDrawer')) {
      var wrap = document.createElement('div');
      wrap.innerHTML = DRAWERS_HTML;
      while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    }

    var notifDrawer = document.getElementById('snNotifDrawer');
    var msgDrawer = document.getElementById('snMsgDrawer');
    var chatDrawer = document.getElementById('snChatDrawer');
    if (!notifDrawer || !msgDrawer || !chatDrawer) return;

    var notifBody = notifDrawer.querySelector('[data-inbox-list="notif"]');
    var msgBody = msgDrawer.querySelector('[data-inbox-list="msg"]');
    var teachersListEl = document.getElementById('snMsgTeachersList');

    var chatBody = document.getElementById('snChatBody');
    var chatHeadAvatar = document.getElementById('snChatHeadAvatar');
    var chatHeadName = document.getElementById('snChatHeadName');
    var chatHeadStatus = document.getElementById('snChatHeadStatus');
    var chatHeadStatusText = document.getElementById('snChatHeadStatusText');
    var chatForm = document.getElementById('snChatForm');
    var chatField = document.getElementById('snChatField');
    var currentChatTeacher = null;

    // ---- RENDER LIST ---------------------------------------------------
    function renderList(mode) {
      var body = mode === 'notif' ? notifBody : msgBody;
      var items = mode === 'notif' ? NOTIFS.slice() : MSGS.slice();
      if (!body) return;
      body.innerHTML = '';
      if (!items.length) {
        var em = document.createElement('div');
        em.className = 'sn-inbox-empty';
        em.textContent = 'Henüz bir şey yok.';
        body.appendChild(em);
        return;
      }
      var groups = {}, order = ['Bugün','Dün','Bu hafta','Daha eski'];
      items.forEach(function (it) {
        var k = bucketLabel(it.timeAt);
        if (!groups[k]) groups[k] = [];
        groups[k].push(it);
      });
      var isFirstGroup = true;
      order.forEach(function (gk) {
        if (!groups[gk]) return;
        var lbl = document.createElement('div');
        lbl.className = 'sn-inbox-group-label';
        var labelText = document.createElement('span');
        labelText.textContent = gk;
        lbl.appendChild(labelText);
        // İlk grup başlığının sağında "Tümünü okundu işaretle" butonu
        if (isFirstGroup) {
          var markBtn = document.createElement('button');
          markBtn.type = 'button';
          markBtn.className = 'sn-inbox-mark';
          markBtn.setAttribute('data-mark-all', mode);
          markBtn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
            '<span>Tümünü okundu işaretle</span>';
          markBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (mode === 'notif') NOTIFS.forEach(function (n) { n.unread = false; });
            else MSGS.forEach(function (m) { m.unread = false; });
            updateCounts();
            renderList(mode);
            showToast('Tümü okundu olarak işaretlendi.');
          });
          lbl.appendChild(markBtn);
          isFirstGroup = false;
        }
        body.appendChild(lbl);
        var list = document.createElement('div');
        list.className = 'sn-inbox-list';
        groups[gk].forEach(function (it) {
          list.appendChild(mode === 'notif' ? renderNotif(it) : renderMsg(it));
        });
        body.appendChild(list);
      });
    }

    function renderNotif(n) {
      var el = document.createElement('div');
      el.className = 'sn-inbox-item' + (n.unread ? ' is-unread' : '');
      var actionsHTML = '';
      if (n.actions && n.actions.length) {
        actionsHTML = '<span class="pop-actions">' + n.actions.map(function (a) {
          var cls = 'is-ghost';
          if (a.kind === 'join') cls = 'is-primary';
          if (a.kind === 'join-live') cls = 'is-live';
          var isRemind = (a.kind === 'remind' || a.kind === 'remind-live');
          var isSet = isRemind && n.reminderSet;
          if (isSet) cls += ' is-set';
          var label = isRemind && isSet ? 'Hatırlatıcı Kaldır' : a.label;
          return '<button type="button" class="pop-btn ' + cls + '" data-notif-action="' + a.kind + '">' + actionIconHTML(a.kind, isSet) + escapeText(label) + '</button>';
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
      el.querySelectorAll('[data-notif-action]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var act = b.getAttribute('data-notif-action');
          // Hatırlatıcı kur/kaldır toggle
          if (act === 'remind' || act === 'remind-live') {
            n.reminderSet = !n.reminderSet;
            // Buton text + class güncelle
            var newLabel = n.reminderSet ? 'Hatırlatıcı Kaldır' : (n.actions.find(function(a){return a.kind===act;}) || {}).label || 'Hatırlatıcı Ekle';
            b.innerHTML = actionIconHTML(act, n.reminderSet) + escapeText(newLabel);
            b.classList.toggle('is-set', n.reminderSet);
            showToast(n.reminderSet ? 'Hatırlatıcı eklendi.' : 'Hatırlatıcı kaldırıldı.');
          } else {
            fireNotifAction(act);
          }
          // Aksiyona basınca okundu say
          if (n.unread) {
            n.unread = false;
            el.classList.remove('is-unread');
            // YENİ rozetini de DOM'dan kaldır
            var badgeEl = el.querySelector('.sn-inbox-new-dot');
            if (badgeEl) badgeEl.remove();
          }
          updateCounts();
        });
      });
      el.addEventListener('click', function () {
        if (n.unread) {
          n.unread = false;
          el.classList.remove('is-unread');
          var badgeEl = el.querySelector('.sn-inbox-new-dot');
          if (badgeEl) badgeEl.remove();
          updateCounts();
        }
      });
      return el;
    }

    function renderMsg(m) {
      var isTeacher = m.sender === 'teacher' && m.teacherId;
      var isSystem = m.sender === 'system';
      var el = document.createElement('div');
      el.className = 'sn-inbox-item' + (m.unread ? ' is-unread' : '') + (isTeacher ? '' : ' is-system');
      var avatarInner;
      if (m.photo) {
        avatarInner = '<img src="' + escapeText(m.photo) + '" alt="' + escapeText(m.initials || m.name) + '" />';
      } else if (isSystem) {
        // Bilenyum Sistemi → marka app icon (landing'deki "Her Yerde Yanında" logosu)
        avatarInner = '<img src="assets/bilenyum-app-icon.svg" alt="Bilenyum" class="sn-inbox-bilenyum-logo" />';
      } else {
        avatarInner = m.initials ? escapeText(m.initials) : sysIconHTML(m.icon || 'info');
      }
      var badgeHTML = m.unread ? '<span class="sn-inbox-new-dot" aria-label="okunmamış"></span>' : '';
      el.innerHTML =
        '<span class="pop-avatar pop-avatar--' + (m.avatarKind || 'purple') + '" aria-hidden="true">' + avatarInner + '</span>' +
        '<span class="pop-body">' +
          '<span class="pop-row">' +
            '<strong class="pop-name">' + escapeText(m.name) + '</strong>' +
            '<span class="pop-time">' + badgeHTML + escapeText(m.time) + '</span>' +
          '</span>' +
          '<span class="pop-preview">' + escapeText(m.text) + '</span>' +
        '</span>';
      el.addEventListener('click', function () {
        if (!isTeacher) return; // sistem mesajları tıklanmaz
        if (m.unread) {
          m.unread = false;
          el.classList.remove('is-unread');
          var badgeEl = el.querySelector('.sn-inbox-new-dot');
          if (badgeEl) badgeEl.remove();
          updateCounts();
        }
        openChat(m.teacherId);
      });
      return el;
    }

    function renderTeachers() {
      if (!teachersListEl) return;
      // Mesaj göndereceği belli olsun diye avatara mesaj ikonu badge'i
      var msgBadgeSvg = '<span class="sn-msg-teacher-msg-icon" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '</span>';
      teachersListEl.innerHTML = TEACHERS.map(function (t) {
        var avatarInner = t.photo
          ? '<img src="' + escapeText(t.photo) + '" alt="' + escapeText(t.initials) + '" />'
          : escapeText(t.initials);
        // Ad-soyad ayrımı (son kelime soyad, geri kalan ad)
        var nameParts = t.name.split(' ');
        var firstname = nameParts.slice(0, -1).join(' ') || t.name;
        var lastname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        var nameHTML = '<span class="sn-msg-teacher-firstname">' + escapeText(firstname) + '</span>' +
          (lastname ? '<span class="sn-msg-teacher-lastname">' + escapeText(lastname) + '</span>' : '');
        return '<button type="button" class="sn-msg-teacher" data-teacher-id="' + t.id + '" title="' + escapeText(t.name + ' · ' + t.title) + '">' +
          '<div class="sn-msg-teacher-avatar is-' + t.avatarKind + '">' + avatarInner + msgBadgeSvg + '</div>' +
          '<div class="sn-msg-teacher-name">' + nameHTML + '</div>' +
          '<div class="sn-msg-teacher-title">' + escapeText(t.title) + '</div>' +
        '</button>';
      }).join('');
      teachersListEl.querySelectorAll('[data-teacher-id]').forEach(function (b) {
        b.addEventListener('click', function () { openChat(b.getAttribute('data-teacher-id')); });
      });
    }

    function updateCounts() {
      var nUnread = NOTIFS.filter(function (n) { return n.unread; }).length;
      var mUnread = MSGS.filter(function (m) { return m.unread; }).length;
      var notifBtn = document.getElementById('notifBtn');
      var msgBtn = document.getElementById('msgBtn');
      if (notifBtn) {
        var nDot = notifBtn.querySelector('.notif-dot');
        if (nDot) nDot.style.display = nUnread ? '' : 'none';
      }
      if (msgBtn) {
        var mDot = msgBtn.querySelector('.notif-dot');
        if (mDot) mDot.style.display = mUnread ? '' : 'none';
      }
    }

    // ---- INBOX DRAWER OPEN/CLOSE ---------------------------------------
    function openInbox(mode) {
      var drawer = mode === 'msg' ? msgDrawer : notifDrawer;
      renderList(mode === 'msg' ? 'msg' : 'notif');
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeInbox(drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (!notifDrawer.classList.contains('is-open') &&
          !msgDrawer.classList.contains('is-open') &&
          !chatDrawer.classList.contains('is-open')) {
        document.body.style.overflow = '';
      }
    }
    function closeAllInbox() { closeInbox(notifDrawer); closeInbox(msgDrawer); }

    // ---- CHAT ----------------------------------------------------------
    function renderChatHistory(teacherId) {
      var history = CHATS[teacherId] || [];
      if (!chatBody) return;
      if (!history.length) {
        chatBody.innerHTML = '<div class="sn-chat-empty">Henüz mesaj yok. İlk mesajı sen yaz!</div>';
        return;
      }
      chatBody.innerHTML = history.map(function (msg, i) {
        var delay = Math.min(i, 8) * 0.04;
        return '<div class="sn-chat-bubble from-' + msg.from + '" style="animation-delay:' + delay + 's">' +
          escapeText(msg.text) +
          '<span class="sn-chat-bubble-time">' + escapeText(msg.time) + '</span>' +
        '</div>';
      }).join('');
    }
    function openChat(teacherId) {
      var t = TEACHERS.find(function (x) { return x.id === teacherId; });
      if (!t || !chatDrawer) return;
      currentChatTeacher = t;
      chatHeadAvatar.className = 'sn-chat-head-avatar is-' + t.avatarKind;
      if (t.photo) {
        chatHeadAvatar.innerHTML = '<img src="' + t.photo + '" alt="' + (t.initials || '') + '" />';
      } else {
        chatHeadAvatar.textContent = t.initials || '';
      }
      chatHeadName.textContent = t.name;
      // Sadece online'sa "Çevrimiçi" göster; offline ise sadece title
      chatHeadStatusText.textContent = t.title + (t.online ? ' · Çevrimiçi' : '');
      chatHeadStatus.classList.toggle('is-online', !!t.online);
      renderChatHistory(teacherId);
      chatDrawer.classList.add('is-open');
      chatDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { chatBody.scrollTop = chatBody.scrollHeight; }, 80);
      setTimeout(function () { if (chatField) chatField.focus(); }, 360);
    }
    function closeChat() {
      chatDrawer.classList.remove('is-open');
      chatDrawer.setAttribute('aria-hidden', 'true');
      currentChatTeacher = null;
      if (!notifDrawer.classList.contains('is-open') && !msgDrawer.classList.contains('is-open')) {
        document.body.style.overflow = '';
      }
    }
    if (chatForm) {
      chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = (chatField && chatField.value || '').trim();
        if (!text || !currentChatTeacher) return;
        var now = new Date();
        var hh = String(now.getHours()).padStart(2, '0');
        var mm = String(now.getMinutes()).padStart(2, '0');
        if (!CHATS[currentChatTeacher.id]) CHATS[currentChatTeacher.id] = [];
        CHATS[currentChatTeacher.id].push({ from:'me', text:text, time:hh + ':' + mm });
        renderChatHistory(currentChatTeacher.id);
        chatField.value = '';
        setTimeout(function () { chatBody.scrollTop = chatBody.scrollHeight; }, 40);
      });
    }

    // ---- EVENTS --------------------------------------------------------
    // [data-inbox-open] → drawer aç
    document.querySelectorAll('[data-inbox-open]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openInbox(b.getAttribute('data-inbox-open'));
      });
    });
    // Kapatma
    [notifDrawer, msgDrawer].forEach(function (drw) {
      drw.querySelectorAll('[data-inbox-close]').forEach(function (x) {
        x.addEventListener('click', function () { closeInbox(drw); });
      });
    });
    chatDrawer.querySelectorAll('[data-chat-close]').forEach(function (x) {
      x.addEventListener('click', closeChat);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (chatDrawer.classList.contains('is-open')) closeChat();
      else closeAllInbox();
    });
    // NOT: Mark-all butonu artık renderList içinde dinamik olarak ilk grup başlığına eklenir
    // (renderList içinde inline event listener bağlanır)

    // İlk yükleme
    updateCounts();
    renderTeachers();
  }

  // DOM hazırsa çalıştır, değilse bekle
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
