(function () {
  'use strict';

  // ---- Klanlar — dönem bazlı XP (week/month/all) ----
  var CLANS = [
    { name: 'Beta Klanı',    slug: 'beta',    emoji: '🔷', week: 14200, month: 61200, all: 192400 },
    { name: 'Alfa Klanı',    slug: 'alfa',    emoji: '⚡', week: 12400, month: 58600, all: 184250, mine: true },
    { name: 'Gama Klanı',    slug: 'gama',    emoji: '🌿', week: 9800,  month: 49800, all: 145600 },
    { name: 'Delta Klanı',   slug: 'delta',   emoji: '🔸', week: 8600,  month: 38400, all: 112300 },
    { name: 'Epsilon Klanı', slug: 'epsilon', emoji: '🔮', week: 7300,  month: 31200, all: 98450 }
  ];

  // ---- Alfa Klanı kaşifleri (klan içi) — dönem bazlı XP ----
  var MEMBERS = [
    { name: 'Ege Arslan',   avatar: '🦁', week: 6420, month: 21400, all: 28400 },
    { name: 'Selin Koç',    avatar: '🦊', week: 5850, month: 19800, all: 27150 },
    { name: 'Kerem Demir',  avatar: '🐯', week: 4980, month: 18200, all: 25800 },
    { name: 'Aylin Mert',   avatar: '🦄', week: 4250, month: 16500, all: 24500 },
    { name: 'Burak Tunç',   avatar: '🐺', week: 3920, month: 15100, all: 23200 },
    { name: 'Deniz Yıldız', avatar: '🐬', week: 3510, month: 13800, all: 21800 },
    { name: 'Cemre Ak',     avatar: '🦋', week: 3120, month: 12400, all: 20450 }
  ];

  // Öğrencinin kendisi (klan içi #4) — global sıralama bu ekrandan çıkarıldı
  var ME = { name: 'Furkan Çilingir', avatar: '👦🏻', week: 320, month: 1450, all: 2450, clanRank: 4 };

  var period = 'week'; // varsayılan: Bu Hafta

  function fmtXp(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function periodWord() {
    return period === 'week' ? 'hafta' : (period === 'month' ? 'ay' : 'dönem');
  }

  // ---- Klan Genel Sıralaması ----
  function renderClanList() {
    var el = document.getElementById('klanRankList');
    if (!el) return;
    var rows = CLANS.slice().sort(function (a, b) { return b[period] - a[period]; });
    var topXp = rows.length ? rows[0][period] : 0;
    el.innerHTML = rows.map(function (c, i) {
      var rank = i + 1;
      var isMine = !!c.mine;
      var topCls = rank <= 3 ? ' is-top-' + rank : '';
      var gap = (isMine && rank > 1) ? (topXp - c[period]) : 0;
      return '<div class="klan-rank-row' + topCls + (isMine ? ' is-me' : '') + '" data-clan="' + c.slug + '" role="listitem">'
        + '<div class="klan-rank-row-body">'
        + '<span class="klan-rank-num">' + rank + '</span>'
        + '<span class="klan-rank-emblem" aria-hidden="true">' + c.emoji + '</span>'
        + '<div class="klan-rank-meta">'
        + '<span class="klan-rank-name">' + escapeHtml(c.name) + '</span>'
        + (isMine ? '<span class="klan-rank-sub">Senin Klanın</span>' : '')
        + '</div>'
        + '<span class="klan-rank-xp">' + fmtXp(c[period]) + ' XP</span>'
        + '</div>'
        + (gap > 0 ? '<div class="klan-rank-gapnote">1. sıraya <strong>' + fmtXp(gap) + ' XP</strong> kaldı</div>' : '')
        + '</div>';
    }).join('');
  }

  // ---- Alfa Klanı Kaşifleri (klan içi) ----
  function renderMemberList() {
    var el = document.getElementById('studentRankList');
    if (!el) return;
    var top = MEMBERS.slice().sort(function (a, b) { return b[period] - a[period]; }).slice(0, 5);
    var html = top.map(function (s, i) {
      var rank = i + 1;
      var topCls = rank <= 3 ? ' is-top-' + rank : '';
      return '<div class="klan-rank-row' + topCls + '" role="listitem">'
        + '<div class="klan-rank-row-body">'
        + '<span class="klan-rank-num">' + rank + '</span>'
        + '<span class="klan-rank-avatar" aria-hidden="true">' + s.avatar + '</span>'
        + '<div class="klan-rank-meta"><span class="klan-rank-name">' + escapeHtml(s.name) + '</span></div>'
        + '<span class="klan-rank-xp">' + fmtXp(s[period]) + ' XP</span>'
        + '</div></div>';
    }).join('');

    // Öğrencinin kendi satırı — pinli
    html += '<div class="klan-rank-gap" aria-hidden="true">···</div>';
    html += '<div class="klan-rank-row is-me" role="listitem">'
      + '<div class="klan-rank-row-body">'
      + '<span class="klan-rank-num">' + ME.clanRank + '</span>'
      + '<span class="klan-rank-avatar" aria-hidden="true">' + ME.avatar + '</span>'
      + '<div class="klan-rank-meta"><span class="klan-rank-name">' + escapeHtml(ME.name) + '</span><span class="klan-rank-sub">Klan içi sıran</span></div>'
      + '<span class="klan-rank-xp">' + fmtXp(ME.all) + ' XP</span>'
      + '<span class="klan-rank-you">Sen</span>'
      + '</div>'
      + '<div class="klan-rank-menote">Bu ' + periodWord() + ' <strong>+' + fmtXp(ME[period]) + ' XP</strong> kazandırdın</div>'
      + '</div>';
    el.innerHTML = html;
  }

  function syncTabs() {
    var btns = document.querySelectorAll('.klan-period-btn');
    Array.prototype.forEach.call(btns, function (b) {
      var on = b.getAttribute('data-period') === period;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function setPeriod(p) {
    if (!p || p === period) return;
    period = p;
    syncTabs();
    renderClanList();
    renderMemberList();
  }

  // ---- Bootstrap ----
  var card = document.getElementById('klanDetailCard');
  if (!card) return;

  var btns = document.querySelectorAll('.klan-period-btn');
  Array.prototype.forEach.call(btns, function (b) {
    b.addEventListener('click', function () { setPeriod(b.getAttribute('data-period')); });
  });

  syncTabs();
  renderClanList();
  renderMemberList();
})();
