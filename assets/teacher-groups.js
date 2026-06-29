/**
 * Öğretmen Klanlarım & Birebir Öğrenciler sayfası
 * data-tkg-context="deneme" → ogretmen-deneme-sinavlari.html
 */
(function () {
  'use strict';

  var api = window.TeacherGroupsMock;
  if (!api) return;

  var PAGE = (function () {
    var ctx = (document.body && document.body.getAttribute('data-tkg-context')) || 'klanlar';
    var configs = {
      klanlar: {
        basePath: 'ogretmen-klanlar.html',
        isDeneme: false,
        fixedHeadTitle: false,
        clansHeadTitle: 'Klanlarım',
        clansHeadSubtitle: 'Matematik dersi verdiğiniz klanları ve sıradaki derslerini görüntüleyin.',
        birebirHeadTitle: 'Birebir Öğrenciler',
        birebirHeadSubtitle: 'Birebir ders verdiğiniz öğrencileri ve sıradaki derslerini görüntüleyin.',
        backToClansLabel: '← Klanlara Dön',
        backToListLabel: '← Listeye dön',
        emptyClans: 'Henüz ders verdiğiniz klan bulunmuyor.',
        emptyBirebir: 'Henüz birebir ders verdiğiniz öğrenci bulunmuyor.'
      },
      deneme: {
        basePath: 'ogretmen-deneme-sinavlari.html',
        isDeneme: true,
        fixedHeadTitle: true,
        headTitle: 'Deneme Sınavları',
        clansHeadSubtitle: 'Deneme sınavı sonuçlarını klanlarınız üzerinden görüntüleyin.',
        birebirHeadSubtitle: 'Birebir öğrencilerinizin deneme sınavı sonuçlarını inceleyin.',
        backToListLabel: '← Listeye dön',
        backToClansLabel: '← Klanlara dön',
        backToRosterLabel: '← Klan öğrencilerine dön',
        emptyClans: 'Deneme sınavı atanabilecek klan bulunmuyor.',
        emptyBirebir: 'Deneme sınavı atanabilecek birebir öğrenci bulunmuyor.'
      }
    };
    return configs[ctx] || configs.klanlar;
  })();

  var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  var state = {
    tab: 'clans',
    view: 'list',
    status: 'loading',
    clans: [],
    students: [],
    selectedClanId: null,
    selectedStudent: null,
    studentBackView: 'list'
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initial(name) { return (name || '?').charAt(0).toUpperCase(); }

  function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr + 'T12:00:00');
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()];
  }

  function statusLabel(status) {
    return status === 'completed' ? 'Tamamlandı' : 'Gelecek';
  }

  function clanDetailHref(id) {
    return PAGE.basePath + '?tab=clans&clan=' + encodeURIComponent(id);
  }

  function slugName(name) {
    return String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }

  function studentToMeta(student, clan) {
    if (clan) {
      return {
        id: 'clan-' + clan.id + '-' + slugName(student.name),
        name: student.name,
        gradeLevel: clan.gradeLevel,
        clanName: clan.name,
        clanId: clan.id,
        clanEmoji: clan.emoji,
        branch: clan.branch,
        isBirebir: false,
        programType: clan.programType,
        xp: student.xp
      };
    }
    return {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      branch: student.branch,
      isBirebir: true,
      programType: student.programType,
      lessonCount: student.lessonCount,
      globalRank: student.globalRank
    };
  }

  function resolveStudentMetaById(id) {
    var s = api.getStudentById(id);
    if (s) return studentToMeta(s, null);
    if (state.selectedStudent && state.selectedStudent.id === id) return state.selectedStudent;

    if (id && id.indexOf('clan-') === 0 && api.getClanById) {
      var suffix = id.slice(5);
      var clanIdMatch = suffix.match(/^(clan-\d+)/);
      if (clanIdMatch) {
        var clanId = clanIdMatch[1];
        var slug = suffix.slice(clanId.length + 1);
        var clan = api.getClanById(clanId);
        if (clan && clan.students) {
          for (var i = 0; i < clan.students.length; i++) {
            if (slugName(clan.students[i].name) === slug) {
              return studentToMeta(clan.students[i], clan);
            }
          }
        }
      }
    }
    return null;
  }

  function studentPageUrl(student, clanContext) {
    var TA = window.TeacherAvatars;
    if (TA && TA.studentDetailPageUrl) {
      if (clanContext) {
        return TA.studentDetailPageUrl(student, {
          clan: clanContext.name,
          program: clanContext.programType,
          grade: clanContext.gradeLevel,
          clanId: clanContext.id
        });
      }
      return TA.studentDetailPageUrl(student, {
        birebir: true,
        grade: student.gradeLevel
      });
    }
    var name = typeof student === 'string' ? student : student.name;
    var qs = '?student=' + encodeURIComponent(name);
    if (clanContext) {
      qs += '&clan=' + encodeURIComponent(clanContext.name || '');
      qs += '&program=' + encodeURIComponent(clanContext.programType || '');
      qs += '&grade=' + encodeURIComponent(clanContext.gradeLevel || '');
      if (clanContext.id) qs += '&clanId=' + encodeURIComponent(clanContext.id);
    } else {
      qs += '&type=birebir&grade=' + encodeURIComponent(student.gradeLevel || '');
    }
    return 'ogretmen-ogrenci-detay.html' + qs;
  }

  function parseUrl() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get('tab');
    if (tab === 'birebir' || tab === 'students') state.tab = 'birebir';
    else state.tab = 'clans';

    var studentId = params.get('student');
    if (studentId) {
      if (PAGE.isDeneme) {
        var meta = resolveStudentMetaById(studentId);
        if (meta) {
          state.view = 'student-exams';
          state.selectedStudent = meta;
          state.studentBackView = params.get('clan') ? 'clan-roster' : 'list';
          if (params.get('clan')) state.selectedClanId = params.get('clan');
          return;
        }
      } else {
        var student = api.getStudentById(studentId);
        if (student) {
          window.location.replace(studentPageUrl(student));
          return;
        }
      }
    }

    var clanId = params.get('clan');
    if (clanId) {
      state.tab = 'clans';
      state.view = PAGE.isDeneme ? 'clan-roster' : 'clan';
      state.selectedClanId = clanId;
    } else {
      state.view = 'list';
      state.selectedClanId = null;
      state.selectedStudent = null;
    }
  }

  function syncUrl() {
    var url = new URL(window.location.href);
    url.searchParams.set('tab', state.tab === 'birebir' ? 'birebir' : 'clans');
    url.searchParams.delete('clan');
    url.searchParams.delete('student');
    if (state.view === 'student-exams' && state.selectedStudent && state.selectedStudent.id) {
      url.searchParams.set('student', state.selectedStudent.id);
      if (state.studentBackView === 'clan-roster' && state.selectedClanId) {
        url.searchParams.set('clan', state.selectedClanId);
      }
    }
    if ((state.view === 'clan' || state.view === 'clan-roster') && state.selectedClanId) {
      url.searchParams.set('clan', state.selectedClanId);
    }
    window.history.replaceState({}, '', url.pathname + url.search);
  }

  function bindEls() {
    els.title = $('tkgPageTitle');
    els.subtitle = $('tkgPageSubtitle');
    els.tabs = $('tkgTabs');
    els.breadcrumb = $('tkgBreadcrumb');
    els.contextPanel = $('tkgContextPanel');
    els.loading = $('tkgLoading');
    els.error = $('tkgError');
    els.empty = $('tkgEmpty');
    els.content = $('tkgContent');
  }

  /* ---- Temaya uygun bitmoji tarzı öğrenci yüz avatarı (inline SVG) ---- */
  var _avaUid = 0;
  var AVATAR_PALETTES = [
    { bg1: '#e9e7fb', bg2: '#c7c2f1', shirt: '#3e3a8e', hair: '#2f2c5c', variant: 'boy' },
    { bg1: '#fde7f1', bg2: '#f7c2dc', shirt: '#e6087b', hair: '#3a2742', variant: 'girl' },
    { bg1: '#e2f5f7', bg2: '#bfe8ec', shirt: '#0ea5b7', hair: '#2f2c5c', variant: 'boy' },
    { bg1: '#fff1dc', bg2: '#ffd9a8', shirt: '#d4920a', hair: '#5a3b1a', variant: 'girl' },
    { bg1: '#e6f0ff', bg2: '#bcd4ff', shirt: '#2b6fd4', hair: '#2f2c5c', variant: 'boy' },
    { bg1: '#eafbe7', bg2: '#c4eebf', shirt: '#2ea86a', hair: '#3a2742', variant: 'girl' }
  ];
  function hashStr(str) {
    var h = 0, t = String(str || '');
    for (var i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) >>> 0; }
    return h;
  }
  function studentAvatarSvg(name) {
    var L = AVATAR_PALETTES[hashStr(name) % AVATAR_PALETTES.length];
    var uid = 'tkgav' + (++_avaUid);
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

  function renderAvatar(name, isStudent, emoji) {
    var TA = window.TeacherAvatars;
    if (isStudent && TA) {
      return '<span class="tkg-avatar tkg-avatar--img is-student" aria-hidden="true">' + TA.studentAvatarSvg(name) + '</span>';
    }
    if (isStudent) {
      return '<span class="tkg-avatar tkg-avatar--img is-student" aria-hidden="true">' + studentAvatarSvg(name) + '</span>';
    }
    if (emoji) {
      return '<span class="tkg-avatar tkg-avatar--emoji is-clan" aria-hidden="true">' + emoji + '</span>';
    }
    return '<span class="tkg-avatar is-fallback is-clan" aria-hidden="true">' + escapeHtml(initial(name)) + '</span>';
  }

  function renderDetailBtn(label, href) {
    if (href) {
      return (
        '<a class="tkg-card-action tkg-card-action-link" href="' + escapeHtml(href) + '">' +
          '<span class="tkg-card-action-text">' + escapeHtml(label) + '</span>' +
          ARROW_SVG +
        '</a>'
      );
    }
    return (
      '<span class="tkg-card-action">' +
        '<span class="tkg-card-action-text">' + escapeHtml(label) + '</span>' +
        ARROW_SVG +
      '</span>'
    );
  }

  function clanStudentCount(clan) {
    if (clan.students && clan.students.length) return clan.students.length;
    return clan.studentCount || 0;
  }

  function renderClanCard(clan) {
    var rankText = clan.rank ? clan.rank + '.' : '—';
    var actionLabel = PAGE.isDeneme ? 'Öğrencileri görüntüle' : 'Detaylı görüntüle';
    return (
      '<article class="tkg-card tkg-card-clan is-clickable" id="tkg-clan-' + escapeHtml(clan.id) + '" data-clan-id="' + escapeHtml(clan.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(clan.name) + ' detayını görüntüle">' +
        '<div class="tkg-card-top">' +
          renderAvatar(clan.name, false, clan.emoji) +
          '<div class="tkg-card-intro">' +
            '<span class="tkg-card-badge is-klan">Klan Dersi</span>' +
            '<h2 class="tkg-card-title">' + escapeHtml(clan.name) + '</h2>' +
            '<span class="tkg-card-meta">' + escapeHtml(clan.gradeLevel) + ' · ' + escapeHtml(clan.branch) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="tkg-card-body">' +
          '<span class="tkg-card-stat">Öğrenci: <strong>' + clanStudentCount(clan) + '</strong></span>' +
          '<span class="tkg-card-stat">Klan sıralaması: <strong>' + escapeHtml(rankText) + '</strong></span>' +
          '<span class="tkg-card-stat">Program: <strong>' + escapeHtml(clan.programType || '—') + '</strong></span>' +
        '</div>' +
        renderDetailBtn(actionLabel) +
      '</article>'
    );
  }

  function renderStudentCard(student) {
    var rankText = student.globalRank || '—';
    if (PAGE.isDeneme) {
      return (
        '<article class="tkg-card tkg-card-student is-clickable" id="tkg-student-' + escapeHtml(student.id) + '" data-student-id="' + escapeHtml(student.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(student.name) + ' — detaylı incele">' +
          '<div class="tkg-card-top">' +
            renderAvatar(student.name, true) +
            '<div class="tkg-card-intro">' +
              '<span class="tkg-card-badge is-birebir">Birebir Ders</span>' +
              '<h2 class="tkg-card-title">' + escapeHtml(student.name) + '</h2>' +
              '<span class="tkg-card-meta">' + escapeHtml(student.gradeLevel) + ' · ' + escapeHtml(student.branch) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="tkg-card-body">' +
            '<span class="tkg-card-stat">Toplam birebir ders: <strong>' + student.lessonCount + '</strong></span>' +
            '<span class="tkg-card-stat">Genel sıralama: <strong>' + escapeHtml(rankText) + '</strong></span>' +
          '</div>' +
          renderDetailBtn('Detaylı İncele') +
        '</article>'
      );
    }
    var detailHref = studentPageUrl(student);
    return (
      '<article class="tkg-card tkg-card-student is-clickable" id="tkg-student-' + escapeHtml(student.id) + '" data-detail-href="' + escapeHtml(detailHref) + '" role="link" tabindex="0" aria-label="' + escapeHtml(student.name) + ' detayını görüntüle">' +
        '<div class="tkg-card-top">' +
          renderAvatar(student.name, true) +
          '<div class="tkg-card-intro">' +
            '<span class="tkg-card-badge is-birebir">Birebir Ders</span>' +
            '<h2 class="tkg-card-title">' + escapeHtml(student.name) + '</h2>' +
            '<span class="tkg-card-meta">' + escapeHtml(student.gradeLevel) + ' · ' + escapeHtml(student.branch) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="tkg-card-body">' +
          '<span class="tkg-card-stat">Toplam birebir ders: <strong>' + student.lessonCount + '</strong></span>' +
          '<span class="tkg-card-stat">Genel sıralama: <strong>' + escapeHtml(rankText) + '</strong></span>' +
        '</div>' +
        renderDetailBtn('Detaylı görüntüle', detailHref) +
      '</article>'
    );
  }

  function renderLessonRows(lessons) {
    if (!lessons || !lessons.length) {
      return '<p class="tkg-detail-empty">Henüz ders kaydı bulunmuyor.</p>';
    }
    return (
      '<ul class="tkg-lesson-list">' +
        lessons.map(function (l) {
          var cls = l.status === 'completed' ? ' is-completed' : ' is-upcoming';
          return (
            '<li class="tkg-lesson-row' + cls + '">' +
              '<span class="tkg-lesson-row-date">' + escapeHtml(formatShortDate(l.date) + ' · ' + l.time) + '</span>' +
              '<span class="tkg-lesson-row-topic">' + escapeHtml(l.topic) + '</span>' +
              '<span class="tkg-lesson-row-chip">' + escapeHtml(statusLabel(l.status)) + '</span>' +
            '</li>'
          );
        }).join('') +
      '</ul>'
    );
  }

  function statWithIcon(iconSvg, val, label) {
    return '<div class="tkg-detail-stat">' +
      '<span class="tkg-detail-stat-ico">' + iconSvg + '</span>' +
      '<span class="tkg-detail-stat-val">' + val + '</span>' +
      '<span class="tkg-detail-stat-label">' + label + '</span>' +
    '</div>';
  }

  var ICON_STUDENTS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_RANK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 12.5 17 22l-5-3-5 3 1.5-9.5"/></svg>';
  var ICON_XP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

  function fmtXp(n) {
    return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function renderClanStudentCard(s, clan, mode) {
    var btn = '<span class="tkg-student-card-btn">Detaylı İncele</span>';
    var inner =
      renderAvatar(s.name, true) +
      '<span class="tkg-student-card-name">' + escapeHtml(s.name) + '</span>' +
      btn;

    if (mode === 'deneme') {
      var meta = studentToMeta(s, clan);
      return (
        '<div class="tkg-student-card is-clickable is-roster" data-student-id="' + escapeHtml(meta.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(s.name) + ' — detaylı incele">' +
          inner +
        '</div>'
      );
    }

    var href = studentPageUrl(s, clan);
    return (
      '<a class="tkg-student-card is-clickable is-roster" href="' + escapeHtml(href) + '" aria-label="' + escapeHtml(s.name) + ' — detaylı incele">' +
        inner +
      '</a>'
    );
  }

  function renderClanStudents(clan, forDeneme) {
    var students = clan.students;
    if (!students || !students.length) {
      return '<p class="tkg-detail-empty">Bu klanda kayıtlı öğrenci bulunmuyor.</p>';
    }
    return (
      '<div class="tkg-student-grid">' +
        students.map(function (s) {
          return renderClanStudentCard(s, clan, forDeneme ? 'deneme' : 'link');
        }).join('') +
      '</div>'
    );
  }

  function renderClanRoster(clan) {
    return (
      '<div class="tkg-detail">' +
        '<div class="tkg-detail-block tkg-detail-block-roster">' +
          '<h3 class="tkg-detail-block-title">' + escapeHtml(clan.name) + ' — Öğrenciler</h3>' +
          '<p class="tkg-detail-block-text">Deneme sınavı sonuçlarını görmek için bir öğrenci seçin.</p>' +
          renderClanStudents(clan, true) +
        '</div>' +
      '</div>'
    );
  }

  function renderClanHeroCompact(clan) {
    var rankText = clan.rank ? clan.rank + '.' : '—';
    var programBadge = clan.programType
      ? '<span class="tkg-card-badge is-program">' + escapeHtml(clan.programType) + '</span>'
      : '';
    return (
      '<div class="tkg-clan-roster-hero">' +
        '<div class="tkg-clan-roster-hero-main">' +
          renderAvatar(clan.name, false, clan.emoji) +
          '<div class="tkg-clan-roster-hero-text">' +
            '<div class="tkg-detail-badges">' +
              '<span class="tkg-card-badge is-klan">Klan Dersi</span>' +
              programBadge +
            '</div>' +
            '<h2 class="tkg-clan-roster-name">' + escapeHtml(clan.name) + '</h2>' +
            '<p class="tkg-clan-roster-meta">' + escapeHtml(clan.gradeLevel) + ' · ' + escapeHtml(clan.branch) + ' · ' + escapeHtml(clan.educationWeek) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="tkg-clan-roster-stats">' +
          '<div class="tkg-clan-roster-stat"><span class="tkg-clan-roster-stat-val">' + clanStudentCount(clan) + '</span><span class="tkg-clan-roster-stat-lbl">Öğrenci</span></div>' +
          '<div class="tkg-clan-roster-stat"><span class="tkg-clan-roster-stat-val">' + escapeHtml(rankText) + '</span><span class="tkg-clan-roster-stat-lbl">Sıralama</span></div>' +
          '<div class="tkg-clan-roster-stat"><span class="tkg-clan-roster-stat-val">' + fmtXp(clan.totalXp) + '</span><span class="tkg-clan-roster-stat-lbl">Toplam XP</span></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderClanDetail(clan) {
    return (
      '<div class="tkg-detail">' +
        renderClanHeroCompact(clan) +
        '<div class="tkg-detail-block tkg-detail-block-roster">' +
          '<h3 class="tkg-detail-block-title">' + escapeHtml(clan.name) + ' — Öğrenciler</h3>' +
          '<p class="tkg-detail-block-text">Öğrenci profili ve ders detayları için bir öğrenci seçin.</p>' +
          renderClanStudents(clan, false) +
        '</div>' +
      '</div>'
    );
  }

  function updateContextPanel() {
    if (!els.contextPanel) return;
    var inSubView = state.view !== 'list';
    els.contextPanel.classList.toggle('is-detail', inSubView);
    els.contextPanel.classList.toggle('is-groups-detail', inSubView);

    var head = els.title ? els.title.closest('.thw-page-head') : null;
    var headHidden = !head || head.hidden;
    var tabsHidden = !els.tabs || els.tabs.hidden;
    els.contextPanel.hidden = inSubView && headHidden && tabsHidden;
  }

  function updateHead() {
    var head = els.title ? els.title.closest('.thw-page-head') : null;
    var inSubView = state.view !== 'list';

    if (PAGE.isDeneme && state.view === 'student-exams' && state.selectedStudent) {
      if (head) head.hidden = true;
      return;
    }

    if (head) head.hidden = inSubView && !PAGE.isDeneme;
    if (inSubView && !PAGE.isDeneme) return;
    if (inSubView && PAGE.isDeneme && state.view === 'clan-roster') {
      if (head) head.hidden = false;
      if (els.title) els.title.textContent = PAGE.headTitle;
      if (els.subtitle) els.subtitle.textContent = PAGE.clansHeadSubtitle;
      return;
    }

    if (PAGE.fixedHeadTitle) {
      if (els.title) els.title.textContent = PAGE.headTitle;
      if (els.subtitle) {
        els.subtitle.textContent = state.tab === 'birebir'
          ? PAGE.birebirHeadSubtitle
          : PAGE.clansHeadSubtitle;
      }
      return;
    }

    if (state.tab === 'birebir') {
      if (els.title) els.title.textContent = PAGE.birebirHeadTitle;
      if (els.subtitle) els.subtitle.textContent = PAGE.birebirHeadSubtitle;
    } else {
      if (els.title) els.title.textContent = PAGE.clansHeadTitle;
      if (els.subtitle) els.subtitle.textContent = PAGE.clansHeadSubtitle;
    }
  }

  function updateTabs() {
    if (!els.tabs) return;
    var hideTabs = state.view !== 'list';
    els.tabs.hidden = hideTabs;
    if (hideTabs) return;
    els.tabs.querySelectorAll('[data-tkg-tab]').forEach(function (btn) {
      var active = btn.getAttribute('data-tkg-tab') === state.tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function updateBreadcrumb() {
    if (!els.breadcrumb) return;
    if (state.view === 'list') {
      els.breadcrumb.hidden = true;
      els.breadcrumb.innerHTML = '';
      return;
    }

    var label = PAGE.backToClansLabel || '← Klanlara Dön';
    if (PAGE.isDeneme) {
      if (state.view === 'student-exams') {
        label = state.studentBackView === 'clan-roster'
          ? (PAGE.backToRosterLabel || '← Klan öğrencilerine dön')
          : (PAGE.backToListLabel || '← Listeye dön');
      } else if (state.view === 'clan-roster') {
        label = PAGE.backToListLabel || '← Listeye dön';
      }
    }

    els.breadcrumb.innerHTML = '<button type="button" class="tkg-back" id="tkgBackBtn">' + escapeHtml(label) + '</button>';
    els.breadcrumb.hidden = false;
    var backBtn = $('tkgBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', handleBack);
    }
  }

  function openClanRoster(id) {
    if (!api.getClanById(id)) return;
    state.view = 'clan-roster';
    state.selectedClanId = id;
    state.selectedStudent = null;
    state.tab = 'clans';
    syncUrl();
    render();
  }

  function openStudentExams(meta, backView) {
    state.view = 'student-exams';
    state.selectedStudent = meta;
    state.studentBackView = backView || 'list';
    syncUrl();
    render();
  }

  function handleBack() {
    if (state.view === 'student-exams') {
      if (state.studentBackView === 'clan-roster' && state.selectedClanId) {
        state.view = 'clan-roster';
        state.selectedStudent = null;
      } else {
        backToList();
      }
      syncUrl();
      render();
      return;
    }
    if (state.view === 'clan-roster' || state.view === 'clan') {
      backToList();
    }
  }

  function openClanDetail(id) {
    if (PAGE.isDeneme) {
      openClanRoster(id);
      return;
    }
    if (!api.getClanById(id)) return;
    state.view = 'clan';
    state.selectedClanId = id;
    state.tab = 'clans';
    syncUrl();
    render();
  }

  function backToList() {
    if (PAGE.isDeneme && window.TeacherTrialExams) {
      window.TeacherTrialExams.unmount();
    }
    state.view = 'list';
    state.selectedClanId = null;
    state.selectedStudent = null;
    syncUrl();
    render();
  }

  function bindListCards() {
    if (!els.content || state.view === 'student-exams') return;

    els.content.querySelectorAll('[data-clan-id]').forEach(function (card) {
      function go() { openClanDetail(card.getAttribute('data-clan-id')); }
      card.addEventListener('click', go);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      });
    });

    els.content.querySelectorAll('a.tkg-card-action-link').forEach(function (link) {
      link.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    els.content.querySelectorAll('[data-student-id]').forEach(function (card) {
      function go() {
        var id = card.getAttribute('data-student-id');
        if (!id) return;
        if (PAGE.isDeneme) {
          var meta = resolveStudentMetaById(id);
          if (!meta && state.view === 'clan-roster' && state.selectedClanId) {
            var clan = api.getClanById(state.selectedClanId);
            if (clan && clan.students) {
              for (var i = 0; i < clan.students.length; i++) {
                var s = clan.students[i];
                var m = studentToMeta(s, clan);
                if (m.id === id) { meta = m; break; }
              }
            }
          }
          if (meta) {
            openStudentExams(meta, state.view === 'clan-roster' ? 'clan-roster' : 'list');
          }
          return;
        }
        var href = card.getAttribute('data-detail-href');
        if (href) window.location.href = href;
      }
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        go();
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      });
    });

    if (!PAGE.isDeneme) {
      els.content.querySelectorAll('[data-detail-href]').forEach(function (card) {
        function go() {
          var href = card.getAttribute('data-detail-href');
          if (href) window.location.href = href;
        }
        card.addEventListener('click', function (e) {
          if (e.target.closest('a')) return;
          go();
        });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            go();
          }
        });
      });
    }
  }

  function render() {
    updateHead();
    updateTabs();
    updateContextPanel();
    updateBreadcrumb();

    if (els.loading) els.loading.hidden = state.status !== 'loading' || state.view !== 'list';
    if (els.error) els.error.hidden = state.status !== 'error';
    if (els.content) els.content.hidden = state.status !== 'ready';
    if (els.empty) els.empty.hidden = true;

    if (state.status !== 'ready' || !els.content) return;

    if (state.view === 'student-exams' && PAGE.isDeneme && state.selectedStudent) {
      els.content.hidden = false;
      if (window.TeacherTrialExams) {
        window.TeacherTrialExams.mount(els.content, state.selectedStudent);
      }
      return;
    }

    if (PAGE.isDeneme && window.TeacherTrialExams) {
      window.TeacherTrialExams.unmount();
    }

    if (state.view === 'clan-roster' && PAGE.isDeneme) {
      var rosterClan = api.getClanById(state.selectedClanId);
      if (!rosterClan) {
        backToList();
        return;
      }
      els.content.innerHTML = renderClanRoster(rosterClan);
      bindListCards();
      return;
    }

    if (state.view === 'clan') {
      var clan = api.getClanById(state.selectedClanId);
      if (!clan) {
        backToList();
        return;
      }
      els.content.innerHTML = renderClanDetail(clan);
      return;
    }

    var items = state.tab === 'birebir' ? state.students : state.clans;
    if (!items.length) {
      els.content.hidden = true;
      if (els.empty) {
        els.empty.hidden = false;
        els.empty.textContent = state.tab === 'birebir'
          ? PAGE.emptyBirebir
          : PAGE.emptyClans;
      }
      return;
    }

    var html = items.map(function (item) {
      return state.tab === 'birebir' ? renderStudentCard(item) : renderClanCard(item);
    }).join('');

    els.content.innerHTML = '<div class="tkg-grid">' + html + '</div>';
    bindListCards();
  }

  function switchTab(tab) {
    state.tab = tab;
    state.view = 'list';
    state.selectedClanId = null;
    state.selectedStudent = null;
    if (PAGE.isDeneme && window.TeacherTrialExams) {
      window.TeacherTrialExams.unmount();
    }
    syncUrl();
    render();
  }

  function load() {
    state.status = 'loading';
    render();
    Promise.all([api.getClans(), api.getOneToOneStudents()]).then(function (res) {
      state.clans = res[0];
      state.students = res[1];
      state.status = 'ready';
      render();
    }).catch(function () {
      state.status = 'error';
      render();
    });
  }

  function initTabs() {
    if (!els.tabs) return;
    els.tabs.querySelectorAll('[data-tkg-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-tkg-tab'));
      });
    });
  }

  function init() {
    bindEls();
    parseUrl();
    initTabs();
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
