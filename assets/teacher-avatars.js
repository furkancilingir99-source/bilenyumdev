/**
 * Öğretmen paneli — temaya uyumlu bitmoji tarzı drawer avatarları.
 * window.TeacherAvatars
 */
(function (global) {
  'use strict';

  var _avaUid = 0;

  var AVATAR_PALETTES = [
    { bg1: '#e9e7fb', bg2: '#c7c2f1', shirt: '#3e3a8e', hair: '#2f2c5c', variant: 'boy' },
    { bg1: '#fde7f1', bg2: '#f7c2dc', shirt: '#e6087b', hair: '#3a2742', variant: 'girl' },
    { bg1: '#e2f5f7', bg2: '#bfe8ec', shirt: '#0ea5b7', hair: '#2f2c5c', variant: 'boy' },
    { bg1: '#fff1dc', bg2: '#ffd9a8', shirt: '#d4920a', hair: '#5a3b1a', variant: 'girl' },
    { bg1: '#e6f0ff', bg2: '#bcd4ff', shirt: '#2b6fd4', hair: '#2f2c5c', variant: 'boy' },
    { bg1: '#eafbe7', bg2: '#c4eebf', shirt: '#2ea86a', hair: '#3a2742', variant: 'girl' }
  ];

  var CLAN_EMOJIS = {
    'clan-001': '🐉',
    'clan-002': '🦅',
    'clan-003': '🦁'
  };

  function hashStr(str) {
    var h = 0;
    var t = String(str || '');
    for (var i = 0; i < t.length; i++) {
      h = (h * 31 + t.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function studentAvatarSvg(name) {
    var L = AVATAR_PALETTES[hashStr(name) % AVATAR_PALETTES.length];
    var uid = 'tdav' + (++_avaUid);
    var skin = '#f7c9a3';
    var skinSh = '#eab98e';
    var eye = '#2c2a5e';
    var cheek = '#f49ac0';
    var mouth = '#c25c8a';
    var sideHair = L.variant === 'girl'
      ? '<ellipse cx="18" cy="35" rx="5.2" ry="12" fill="' + L.hair + '"/><ellipse cx="46" cy="35" rx="5.2" ry="12" fill="' + L.hair + '"/>'
      : '';
    var bow = L.variant === 'girl'
      ? '<g transform="translate(32 11)"><path d="M0 0 L-7 -4 L-7 4 Z" fill="' + L.shirt + '"/><path d="M0 0 L7 -4 L7 4 Z" fill="' + L.shirt + '"/><circle cx="0" cy="0" r="2" fill="#fff"/></g>'
      : '';
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      + '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + L.bg1 + '"/><stop offset="1" stop-color="' + L.bg2 + '"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="64" height="64" fill="url(#' + uid + ')"/>'
      + '<circle cx="13" cy="16" r="1.5" fill="#fff" opacity=".6"/><circle cx="51" cy="13" r="1.1" fill="#fff" opacity=".5"/>'
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

  function classTrialAvatarSvg(gradeLevel) {
    var uid = 'tdtav' + (++_avaUid);
    var gradeNum = parseInt(String(gradeLevel || '').replace(/\D/g, ''), 10) || 7;
    var shirtColors = ['#d4920a', '#e6087b', '#2b6fd4', '#2ea86a', '#6b5fd4'];
    var shirt = shirtColors[(gradeNum - 5) % shirtColors.length] || '#d4920a';
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      + '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4dc"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="64" height="64" fill="url(#' + uid + ')"/>'
      + '<circle cx="12" cy="14" r="1.4" fill="#fff" opacity=".55"/><circle cx="52" cy="11" r="1.2" fill="#fff" opacity=".45"/>'
      + '<rect x="12" y="14" width="40" height="26" rx="4" fill="#2d5a3d"/>'
      + '<rect x="15" y="17" width="34" height="20" rx="2" fill="#3a7350"/>'
      + '<line x1="19" y1="23" x2="35" y2="23" stroke="rgba(255,255,255,0.55)" stroke-width="1.5" stroke-linecap="round"/>'
      + '<line x1="19" y1="28" x2="42" y2="28" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round"/>'
      + '<line x1="19" y1="33" x2="30" y2="33" stroke="rgba(255,255,255,0.40)" stroke-width="1.5" stroke-linecap="round"/>'
      + '<rect x="30" y="40" width="4" height="8" rx="1" fill="#8b6914"/>'
      + '<ellipse cx="18" cy="52" rx="7" ry="9" fill="' + shirt + '"/>'
      + '<circle cx="18" cy="46" r="5" fill="#f7c9a3"/>'
      + '<circle cx="16.5" cy="45.5" r="1" fill="#2c2a5e"/><circle cx="19.5" cy="45.5" r="1" fill="#2c2a5e"/>'
      + '<ellipse cx="32" cy="52" rx="7" ry="9" fill="#3e3a8e"/>'
      + '<circle cx="32" cy="46" r="5" fill="#f7c9a3"/>'
      + '<circle cx="30.5" cy="45.5" r="1" fill="#2c2a5e"/><circle cx="33.5" cy="45.5" r="1" fill="#2c2a5e"/>'
      + '<ellipse cx="46" cy="52" rx="7" ry="9" fill="#e6087b"/>'
      + '<circle cx="46" cy="46" r="5" fill="#f7c9a3"/>'
      + '<circle cx="44.5" cy="45.5" r="1" fill="#2c2a5e"/><circle cx="47.5" cy="45.5" r="1" fill="#2c2a5e"/>'
      + '</svg>';
  }

  function clanEmoji(clan) {
    if (!clan) return '🏰';
    if (typeof clan === 'string') return CLAN_EMOJIS[clan] || '🏰';
    return clan.emoji || CLAN_EMOJIS[clan.id] || '🏰';
  }

  function clanAvatarSvg(clan) {
    var name = (clan && clan.name) || '';
    var emoji = clanEmoji(clan);
    var L = AVATAR_PALETTES[hashStr((clan && clan.id) || name) % AVATAR_PALETTES.length];
    var uid = 'tdcav' + (++_avaUid);
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      + '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + L.bg1 + '"/><stop offset="1" stop-color="' + L.bg2 + '"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="64" height="64" fill="url(#' + uid + ')"/>'
      + '<circle cx="13" cy="15" r="1.4" fill="#fff" opacity=".55"/><circle cx="51" cy="12" r="1.1" fill="#fff" opacity=".45"/><circle cx="48" cy="49" r="1.3" fill="#fff" opacity=".4"/>'
      + '<circle cx="32" cy="32" r="23" fill="rgba(255,255,255,0.22)"/>'
      + '<circle cx="32" cy="32" r="19" fill="' + L.shirt + '" opacity="0.14"/>'
      + '<circle cx="32" cy="32" r="17.5" fill="none" stroke="' + L.shirt + '" stroke-width="1.5" opacity="0.35"/>'
      + '<text x="32" y="39" text-anchor="middle" font-size="26" dominant-baseline="middle">' + emoji + '</text>'
      + '</svg>';
  }

  function mountDrawerAvatar(el, kind, data) {
    if (!el) return;
    el.hidden = false;
    el.className = 'td-drawer-bm td-drawer-bm--' + kind;
    if (kind === 'student') {
      el.classList.add('td-drawer-bm--img');
      el.innerHTML = studentAvatarSvg(data && data.name);
      return;
    }
    if (kind === 'clan') {
      if (data && data.logoUrl) {
        el.classList.add('td-drawer-bm--img');
        el.innerHTML = '<img src="' + data.logoUrl + '" alt="" loading="lazy" />';
        return;
      }
      el.classList.add('td-drawer-bm--img');
      el.innerHTML = clanAvatarSvg(data);
      return;
    }
    if (kind === 'trial') {
      el.classList.add('td-drawer-bm--img');
      el.innerHTML = classTrialAvatarSvg(data && data.gradeLevel);
    }
  }

  function studentDetailPageUrl(student, options) {
    options = options || {};
    var name = typeof student === 'string' ? student : (student && student.name);
    if (!name) return '#';
    var parts = ['student=' + encodeURIComponent(name)];
    var grade = options.grade || (student && student.gradeLevel);
    if (grade) parts.push('grade=' + encodeURIComponent(grade));
    if (options.clan) {
      parts.push('clan=' + encodeURIComponent(options.clan));
    } else if (options.birebir) {
      parts.push('type=birebir');
    }
    if (options.program && !options.birebir) parts.push('program=' + encodeURIComponent(options.program));
    if (options.clanId) parts.push('clanId=' + encodeURIComponent(options.clanId));
    if (options.from) parts.push('from=' + encodeURIComponent(options.from));
    return 'ogretmen-ogrenci-detay.html?' + parts.join('&');
  }

  global.TeacherAvatars = {
    studentAvatarSvg: studentAvatarSvg,
    classTrialAvatarSvg: classTrialAvatarSvg,
    clanEmoji: clanEmoji,
    clanAvatarSvg: clanAvatarSvg,
    mountDrawerAvatar: mountDrawerAvatar,
    studentDetailPageUrl: studentDetailPageUrl
  };
})(typeof window !== 'undefined' ? window : this);
