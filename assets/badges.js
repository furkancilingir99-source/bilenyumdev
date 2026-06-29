/* ---------------------------------------------------------------------------
 * Bilenyum badges.js — Rozet kataloğu ve render
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var BADGES = [
    { id: 'trophy', emoji: '🏆', name: 'Şampiyon', shortName: 'Şampiyon', category: 'Başarı', unlocked: true, desc: 'Haftalık klan sıralamasında ilk 3\'e girdin.' },
    { id: 'fire', emoji: '🔥', name: '7 Gün Seri', shortName: '7 Gün', category: 'Seri', unlocked: true, desc: '7 gün üst üste platforma giriş yaptın.' },
    { id: 'rocket', emoji: '🚀', name: 'Hızlı Başlangıç', shortName: 'Hızlı', category: 'Başlangıç', unlocked: true, desc: 'İlk haftandaki tüm ödevlerini zamanında teslim ettin.' },
    { id: 'crown', emoji: '👑', name: 'Bilge Öğrenci', shortName: 'Bilge', category: 'Başarı', unlocked: false, desc: 'Tüm derslerde %85 ve üzeri performansa ulaş.' },
    { id: 'diamond', emoji: '💎', name: 'Elmas Toplayıcı', shortName: 'Elmas', category: 'XP', unlocked: false, desc: '200 XP biriktirerek elmas rozetini aç.', hiddenFromPreview: true },
    { id: 'star', emoji: '⭐', name: 'Yıldız Öğrenci', shortName: 'Yıldız', category: 'Başarı', unlocked: false, desc: 'Bir derste üst üste 5 mükemmel ödev teslim et.' },
    { id: 'book', emoji: '📚', name: 'Kitap Kurdu', shortName: 'Kitap', category: 'Çalışma', unlocked: false, desc: '30 ders tekrarı videosunu izle.' },
    { id: 'target', emoji: '🎯', name: 'Hedef Avcısı', shortName: 'Hedef', category: 'Sınav', unlocked: false, desc: '3 deneme sınavında hedef netini yakala.' },
    { id: 'lightning', emoji: '⚡', name: 'Hız Canavarı', shortName: 'Hız', category: 'Ödev', unlocked: false, desc: 'Bir ödevi son teslim gününden 2 gün önce bitir.' },
    { id: 'medal', emoji: '🏅', name: 'Mükemmeliyetçi', shortName: 'Mükemmel', category: 'Başarı', unlocked: false, desc: 'Bir ödevde tüm soruları doğru cevapla.' },
    { id: 'shield', emoji: '🛡️', name: 'Savunmacı', shortName: 'Savunma', category: 'Klan', unlocked: false, desc: 'Klan savunma etkinliğine katıl ve görev tamamla.' },
    { id: 'compass', emoji: '🧭', name: 'Keşifçi', shortName: 'Keşif', category: 'Keşif', unlocked: false, desc: 'Platformdaki tüm ana bölümleri ziyaret et.' }
  ];

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getPreviewBadges() {
    return BADGES.filter(function (b) { return !b.hiddenFromPreview; }).slice(0, 4);
  }

  function getAllBadges() {
    return BADGES.slice();
  }

  function renderBadgeItem(badge, opts) {
    opts = opts || {};
    var locked = !badge.unlocked;
    var label = opts.useShortName !== false && badge.shortName ? badge.shortName : badge.name;
    var cls = 'd3-badge-item' + (locked ? ' is-locked' : '') + (opts.large ? ' is-large' : '');
    var html =
      '<div class="' + cls + '" data-badge="' + escapeHtml(badge.id) + '" title="' + escapeHtml(badge.name + (locked ? ' (kilitli)' : '')) + '">' +
        '<span class="d3-badge-emoji" aria-hidden="true">' + badge.emoji + '</span>' +
        '<span class="d3-badge-name">' + escapeHtml(label) + '</span>';
    if (opts.showDesc && badge.desc) {
      html += '<p class="rbz-badge-desc">' + escapeHtml(badge.desc) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderBadgeGrid(badges, opts) {
    opts = opts || {};
    var cls = 'd3-badges-row' + (opts.compact ? ' is-compact' : '') + (opts.large ? ' is-large' : '');
    return '<div class="' + cls + '">' + badges.map(function (b) {
      return renderBadgeItem(b, opts);
    }).join('') + '</div>';
  }

  function renderAllBadgesPage(root) {
    if (!root) return;
    var unlocked = BADGES.filter(function (b) { return b.unlocked; });
    var locked = BADGES.filter(function (b) { return !b.unlocked; });
    var categories = {};
    BADGES.forEach(function (b) {
      var cat = b.category || 'Diğer';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(b);
    });

    function categorySlug(cat) {
      return String(cat || 'diger')
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    var summaryHtml =
      '<header class="rbz-pagehead">' +
        '<div class="rbz-pagehead-main">' +
          '<a href="dashboard.html" class="rbz-back">← Kontrol Merkezi</a>' +
          '<h1 class="rbz-title">Rozetlerim</h1>' +
          '<p class="rbz-sub">' + unlocked.length + ' / ' + BADGES.length + ' rozet açıldı</p>' +
        '</div>' +
        '<div class="rbz-summary">' +
          '<div class="rbz-summary-stat is-unlocked">' +
            '<span class="rbz-summary-val">' + unlocked.length + '</span>' +
            '<span class="rbz-summary-lbl">Açık</span>' +
          '</div>' +
          '<div class="rbz-summary-stat is-locked">' +
            '<span class="rbz-summary-val">' + locked.length + '</span>' +
            '<span class="rbz-summary-lbl">Kilitli</span>' +
          '</div>' +
        '</div>' +
      '</header>';

    var sectionsHtml = Object.keys(categories).map(function (cat) {
      return (
        '<section class="rbz-section rbz-section--' + categorySlug(cat) + '">' +
          '<header class="rbz-section-head">' +
            '<span class="rbz-section-dot"></span>' +
            '<h2 class="rbz-section-title">' + escapeHtml(cat) + '</h2>' +
            '<span class="rbz-section-line"></span>' +
          '</header>' +
          renderBadgeGrid(categories[cat], { large: true, showDesc: true, useShortName: false }) +
        '</section>'
      );
    }).join('');

    root.innerHTML = summaryHtml + sectionsHtml;
    document.title = 'Rozetlerim · Bilenyum';
  }

  function mountPreview(root) {
    if (!root) return;
    root.innerHTML = renderBadgeGrid(getPreviewBadges(), { compact: true });
  }

  global.BilenyumBadges = {
    BADGES: BADGES,
    getPreviewBadges: getPreviewBadges,
    getAllBadges: getAllBadges,
    renderBadgeItem: renderBadgeItem,
    renderBadgeGrid: renderBadgeGrid,
    renderAllBadgesPage: renderAllBadgesPage,
    mountPreview: mountPreview
  };

  if (document.getElementById('rbzPage')) {
    renderAllBadgesPage(document.getElementById('rbzPage'));
  }
  if (document.getElementById('d3BadgesPreview')) {
    mountPreview(document.getElementById('d3BadgesPreview'));
  }
})(typeof window !== 'undefined' ? window : this);
