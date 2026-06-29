(function () {
  'use strict';

  var P = 'bilenyum.';

  var CLAN_CATALOG = {
    'Alfa Klanı':  { slug: 'alfa',  emoji: '⚡', totalXp: 184250 },
    'Beta Klanı':  { slug: 'beta',  emoji: '🔷', totalXp: 192400 },
    'Gama Klanı':  { slug: 'gama',  emoji: '🌿', totalXp: 145600 },
    'Delta Klanı': { slug: 'delta', emoji: '🔸', totalXp: 98200 }
  };

  var STUDENTS = [
    { name: 'Ege Arslan',       avatar: '🦁', xp: 28400, rank: 1 },
    { name: 'Selin Koç',        avatar: '🦊', xp: 27150, rank: 2 },
    { name: 'Kerem Demir',      avatar: '🐯', xp: 25800, rank: 3 },
    { name: 'Aylin Mert',       avatar: '🦄', xp: 24500, rank: 4 },
    { name: 'Burak Tunç',       avatar: '🐺', xp: 23200, rank: 5 },
    { name: 'Deniz Yıldız',     avatar: '🐬', xp: 21800, rank: 6 },
    { name: 'Cemre Ak',         avatar: '🦋', xp: 20450, rank: 7 },
    { name: 'Ozan Polat',       avatar: '🦅', xp: 19100, rank: 8 },
    { name: 'Elif Sarı',        avatar: '🐱', xp: 17850, rank: 9 },
    { name: 'Arda Güneş',       avatar: '🐻', xp: 16600, rank: 10 }
  ];

  var BLURRED_CLANS = [
    { name: 'Epsilon Klanı', emoji: '🔮', slug: 'epsilon', totalXp: 86400, rank: 5 },
    { name: 'Zeta Klanı',    emoji: '💫', slug: 'zeta',    totalXp: 72100, rank: 6 },
    { name: 'Eta Klanı',     emoji: '🌙', slug: 'eta',     totalXp: 59800, rank: 7 }
  ];

  var BLURRED_STUDENTS = [
    { name: 'Gizli Öğrenci A', avatar: '👤', xp: 15200, rank: 11 },
    { name: 'Gizli Öğrenci B', avatar: '👤', xp: 14100, rank: 12 },
    { name: 'Gizli Öğrenci C', avatar: '👤', xp: 13050, rank: 13 }
  ];

  var PROGRAM_NAMES = {
    'weekday-early': 'Hafta İçi Erken',
    'weekday-late': 'Hafta İçi Geç',
    'weekend-early': 'Hafta Sonu Sabah',
    'weekend-late': 'Hafta Sonu Akşam'
  };

  var CLAN_PROGRAM = {
    'Alfa Klanı': 'weekday-early',
    'Beta Klanı': 'weekday-late',
    'Gama Klanı': 'weekend-early',
    'Delta Klanı': 'weekend-late'
  };

  function lsGet(k) {
    try { return localStorage.getItem(P + k); } catch (e) { return null; }
  }

  function resolveProgramLabel(clanName) {
    var stored = lsGet('assignedProgram');
    var key = (stored && PROGRAM_NAMES[stored]) ? stored : (CLAN_PROGRAM[clanName] || 'weekday-early');
    return PROGRAM_NAMES[key];
  }

  function fmtXp(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveClan() {
    var name = lsGet('assignedClan') || 'Alfa Klanı';
    var meta = CLAN_CATALOG[name];
    if (meta) {
      return { name: name, emoji: meta.emoji, slug: meta.slug, totalXp: meta.totalXp };
    }
    var emoji = lsGet('assignedClanEmoji') || '⚡';
    return { name: name, emoji: emoji, slug: 'alfa', totalXp: 184250 };
  }

  function getStudentProfile() {
    return {
      name: lsGet('studentName') || 'Mira Yılmaz',
      avatar: '👧🏼',
      xp: 2450,
      rank: 127
    };
  }

  function buildClanRows(myClanName) {
    var rows = Object.keys(CLAN_CATALOG).map(function (name) {
      var c = CLAN_CATALOG[name];
      return { name: name, emoji: c.emoji, slug: c.slug, totalXp: c.totalXp };
    });
    rows.sort(function (a, b) { return b.totalXp - a.totalXp; });
    rows.forEach(function (r, i) { r.rank = i + 1; });
    return rows;
  }

  function clanRowVisible(rank, isMine) {
    return rank <= 3 || isMine;
  }

  function renderClanRow(row, isMine, blurred) {
    var topClass = row.rank <= 3 ? ' is-top-' + row.rank : '';
    var classes = 'klan-rank-row' + topClass + (isMine ? ' is-me' : '') + (blurred ? ' is-blurred' : '');
    return '<div class="' + classes + '" data-clan="' + row.slug + '" role="listitem">'
      + '<div class="klan-rank-row-body">'
      + '<span class="klan-rank-num">' + row.rank + '</span>'
      + '<span class="klan-rank-emblem" aria-hidden="true">' + row.emoji + '</span>'
      + '<div class="klan-rank-meta">'
      + '<span class="klan-rank-name">' + escapeHtml(row.name) + '</span>'
      + (isMine ? '<span class="klan-rank-sub">Klanın</span>' : '')
      + '</div>'
      + '<span class="klan-rank-xp">' + fmtXp(row.totalXp) + ' XP</span>'
      + (isMine ? '<span class="klan-rank-you">Sen</span>' : '')
      + '</div>'
      + '</div>';
  }

  function renderClanList(container, myClan) {
    if (!container) return;
    var rows = buildClanRows(myClan.name);
    var html = '';
    rows.forEach(function (row) {
      var isMine = row.name === myClan.name;
      var blurred = !clanRowVisible(row.rank, isMine);
      html += renderClanRow(row, isMine, blurred);
    });

    BLURRED_CLANS.forEach(function (row) {
      html += renderClanRow(row, false, true);
    });

    container.innerHTML = html;
  }

  function renderStudentRow(student, opts) {
    opts = opts || {};
    var blurred = !!opts.blurred;
    var isMe = !!opts.isMe;
    var topClass = student.rank <= 3 ? ' is-top-' + student.rank : '';
    var classes = 'klan-rank-row' + topClass + (isMe ? ' is-me' : '') + (blurred ? ' is-blurred' : '');
    return '<div class="' + classes + '" role="listitem">'
      + '<div class="klan-rank-row-body">'
      + '<span class="klan-rank-num">' + student.rank + '</span>'
      + '<span class="klan-rank-avatar" aria-hidden="true">' + student.avatar + '</span>'
      + '<div class="klan-rank-meta">'
      + '<span class="klan-rank-name">' + escapeHtml(student.name) + '</span>'
      + (isMe ? '<span class="klan-rank-sub">Sıralaman</span>' : '')
      + '</div>'
      + '<span class="klan-rank-xp">' + fmtXp(student.xp) + ' XP</span>'
      + (isMe ? '<span class="klan-rank-you">Sen</span>' : '')
      + '</div>'
      + '</div>';
  }

  function renderStudentList(container, me) {
    if (!container) return;
    var html = '';
    var inTop5 = me.rank <= 5;

    STUDENTS.slice(0, 5).forEach(function (s) {
      var isMe = s.name === me.name;
      html += renderStudentRow(isMe ? me : s, { isMe: isMe, blurred: false });
    });

    if (!inTop5) {
      html += '<div class="klan-rank-gap" aria-hidden="true">···</div>';
      html += renderStudentRow(me, { isMe: true, blurred: false });
    }

    BLURRED_STUDENTS.forEach(function (s) {
      html += renderStudentRow(s, { blurred: true });
    });

    container.innerHTML = html;
  }

  var card = document.getElementById('klanDetailCard');
  if (!card) return;

  var clan = resolveClan();
  var me = getStudentProfile();
  var clans = buildClanRows(clan.name);
  var myRank = clans.filter(function (c) { return c.name === clan.name; })[0].rank;

  card.setAttribute('data-clan', clan.slug);

  var emblem = document.getElementById('klanEmblem');
  var nameEl = document.getElementById('klanName');
  var xpEl = document.getElementById('klanTotalXp');
  var rankEl = document.getElementById('klanRank');
  var programEl = document.getElementById('klanProgramType');

  if (emblem) emblem.textContent = clan.emoji;
  if (nameEl) nameEl.textContent = clan.name;
  if (xpEl) xpEl.textContent = fmtXp(clan.totalXp);
  if (rankEl) rankEl.textContent = '#' + myRank;
  if (programEl) programEl.textContent = resolveProgramLabel(clan.name);

  renderClanList(document.getElementById('klanRankList'), clan);
  renderStudentList(document.getElementById('studentRankList'), me);
})();
