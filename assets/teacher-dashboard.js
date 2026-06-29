/**
 * Öğretmen dashboard — Bugünün Akışı + Haftalık Ders Programı
 */
(function () {
  'use strict';

  var api = window.TeacherDashboardMock;
  if (!api) return;

  var DAY_NAMES_FULL = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var WEEK_DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  var DRAWER_START_WINDOW_MS = 10 * 60 * 1000;
  var STUDENT_DETAIL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  var SUBJECT_KEYS = {
    'Matematik': 'mat', 'Fen Bilimleri': 'fen', 'Türkçe': 'trk',
    'İngilizce': 'ing', 'Sosyal Bilgiler': 'sos', 'Din Kültürü': 'din'
  };
  var SUBJECT_ICONS = { mat: '📐', fen: '🔬', trk: '📖', ing: '🌍', sos: '🏛️', din: '☪️' };
  var TEACHER_BRANCH = (api && api.TEACHER_BRANCH) || 'Matematik';
  var CAL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';

  function branchLessons(lessons) {
    if (api.filterByBranch) return api.filterByBranch(lessons);
    return lessons.filter(function (l) { return l.lessonName === TEACHER_BRANCH; });
  }

  function subjectKey(name) { return SUBJECT_KEYS[name] || 'mat'; }

  var todayState = { status: 'loading', data: null, error: null };
  var weekState = {
    status: 'loading',
    data: null,
    error: null,
    statusFilter: 'all',
    typeFilter: 'all',
    selectedEduWeek: null
  };
  var selectedLesson = null;
  var drawerSource = null;

  var els = {};

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatFriendlyDate(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear() + ', ' + DAY_NAMES_FULL[d.getDay()];
  }

  function formatWeekRange(startISO, endISO) {
    var s = new Date(startISO + 'T12:00:00');
    var e = new Date(endISO + 'T12:00:00');
    if (s.getMonth() === e.getMonth()) {
      return s.getDate() + ' — ' + e.getDate() + ' ' + MONTH_NAMES[s.getMonth()] + ' ' + s.getFullYear();
    }
    return s.getDate() + ' ' + MONTH_NAMES[s.getMonth()] + ' — ' + e.getDate() + ' ' + MONTH_NAMES[e.getMonth()] + ' ' + e.getFullYear();
  }

  function clanDetailUrl(clanId) {
    return clanId ? 'ogretmen-klanlar.html?tab=clans&clan=' + encodeURIComponent(clanId) : '#';
  }

  function clanListUrl() {
    return 'ogretmen-klanlar.html';
  }

  function studentDetailUrl(student, lesson) {
    if (!student || !student.name) return '#';
    if (window.TeacherAvatars && window.TeacherAvatars.studentDetailPageUrl) {
      return window.TeacherAvatars.studentDetailPageUrl(student, {
        birebir: true,
        grade: (lesson && lesson.gradeLevel) || student.gradeLevel,
        from: 'dashboard'
      });
    }
    return 'ogretmen-ogrenci-detay.html?student=' + encodeURIComponent(student.name)
      + '&type=birebir&grade=' + encodeURIComponent((lesson && lesson.gradeLevel) || '')
      + '&from=dashboard';
  }

  function clanInitial(name) {
    return (name || '?').charAt(0).toUpperCase();
  }

  function renderClanAvatar(clan, cls) {
    cls = cls || 'td-clan-avatar';
    if (!clan) return '';
    if (clan.logoUrl) {
      return '<img class="' + cls + '" src="' + escapeHtml(clan.logoUrl) + '" alt="' + escapeHtml(clan.name) + '" loading="lazy" />';
    }
    if (window.TeacherAvatars && window.TeacherAvatars.clanAvatarSvg) {
      return '<span class="' + cls + ' td-clan-avatar-svg" aria-hidden="true">' + window.TeacherAvatars.clanAvatarSvg(clan) + '</span>';
    }
    var emoji = (window.TeacherAvatars && window.TeacherAvatars.clanEmoji)
      ? window.TeacherAvatars.clanEmoji(clan)
      : (clan.emoji || '🏰');
    return '<span class="' + cls + ' is-emoji" aria-hidden="true">' + emoji + '</span>';
  }

  function renderHeroPartyAvatar(lesson) {
    var baseCls = 'd3-hero-video-meta-avatar';
    if (lesson.type === 'one_to_one' && lesson.student) {
      if (window.TeacherAvatars && window.TeacherAvatars.studentAvatarSvg) {
        return '<span class="' + baseCls + ' td-hero-party-avatar td-drawer-bm td-drawer-bm--student td-drawer-bm--img" aria-hidden="true">'
          + window.TeacherAvatars.studentAvatarSvg(lesson.student.name) + '</span>';
      }
      return '<span class="' + baseCls + ' td-clan-avatar is-fallback" aria-hidden="true">'
        + escapeHtml((lesson.student.name || '?').charAt(0).toUpperCase()) + '</span>';
    }
    if (lesson.type === 'free_trial') {
      if (window.TeacherAvatars && window.TeacherAvatars.classTrialAvatarSvg) {
        return '<span class="' + baseCls + ' td-hero-party-avatar td-drawer-bm td-drawer-bm--trial td-drawer-bm--img" aria-hidden="true">'
          + window.TeacherAvatars.classTrialAvatarSvg(lesson.gradeLevel) + '</span>';
      }
      return '<span class="' + baseCls + ' td-clan-avatar is-emoji" aria-hidden="true">🎓</span>';
    }
    if (lesson.clan) {
      return renderClanAvatar(lesson.clan, baseCls + ' td-clan-avatar');
    }
    return '<span class="' + baseCls + ' td-clan-avatar is-emoji" aria-hidden="true">🏫</span>';
  }

  var heroCtaTick = null;
  var drawerCtaTick = null;
  var featuredLesson = null;

  function lessonEnd(lesson) {
    if (lesson.endTime) {
      var ep = lesson.endTime.split(':');
      var sp = lesson.date.split('-');
      return new Date(+sp[0], +sp[1] - 1, +sp[2], +ep[0], +ep[1], 0);
    }
    var start = api.parseDateTime(lesson.date, lesson.startTime);
    return new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  }

  function getStartUrl(lesson) {
    return lesson.meetingUrl || 'ogretmen-canli-ders.html';
  }

  function pad2(n) { n = Math.floor(n); return (n < 10 ? '0' : '') + n; }

  function fmtCountdown(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var mi = Math.floor((s % 3600) / 60);
    var se = s % 60;
    return pad2(h) + ':' + pad2(mi) + ':' + pad2(se);
  }

  function isLessonLive(lesson, now) {
    var start = api.parseDateTime(lesson.date, lesson.startTime);
    return now >= start && now < lessonEnd(lesson);
  }

  function updateHeroCta(lesson, now) {
    var footer = document.getElementById('tdHeroFooter');
    if (!footer || !lesson) return;

    var start = api.parseDateTime(lesson.date, lesson.startTime);
    var end = lessonEnd(lesson);
    var url = getStartUrl(lesson);
    var playIcon = PLAY_SVG;

    if (now >= end) {
      footer.innerHTML = '<button type="button" class="d3-hero-cta is-waiting" disabled>Sona erdi</button>';
      if (heroCtaTick) { clearInterval(heroCtaTick); heroCtaTick = null; }
      return;
    }

    if (now >= start) {
      footer.innerHTML = '<a href="' + escapeHtml(url) + '" class="d3-hero-cta" id="tdHeroCta">' + playIcon + 'Başlat</a>';
      return;
    }

    var diff = start - now;
    var label = diff <= 60 * 60 * 1000 ? 'Başlamak üzere' : 'Derse kalan süre';
    footer.innerHTML =
      '<button type="button" class="d3-hero-cta is-waiting" id="tdHeroCta" disabled>' +
        playIcon + label +
        '<span class="cta-time" id="tdHeroCtaTime">' + fmtCountdown(diff) + '</span>' +
      '</button>';
  }

  function startHeroCtaTick(lesson) {
    featuredLesson = lesson;
    if (heroCtaTick) clearInterval(heroCtaTick);
    function tick() {
      if (!featuredLesson || !todayState.data) return;
      var now = new Date(todayState.data.now);
      now = new Date(now.getTime() + (Date.now() - (window._tdDemoBase || Date.now())));
      updateHeroCta(featuredLesson, now);
      var liveBadge = document.getElementById('tdHeroLiveBadge');
      if (liveBadge) liveBadge.hidden = !isLessonLive(featuredLesson, now);
    }
    window._tdDemoBase = Date.now();
    tick();
    heroCtaTick = setInterval(tick, 1000);
  }

  function getDemoNow() {
    if (!todayState.data) return new Date();
    var now = new Date(todayState.data.now);
    return new Date(now.getTime() + (Date.now() - (window._tdDemoBase || Date.now())));
  }

  function endTimeStr(start, durMin) {
    var p = start.split(':');
    var total = (+p[0]) * 60 + (+p[1]) + (durMin || 45);
    return pad2(Math.floor(total / 60) % 24) + ':' + pad2(total % 60);
  }

  function formatDrawerDate(lesson) {
    var d = new Date(lesson.date + 'T12:00:00');
    var todayISO = todayState.data ? todayState.data.date : api.DEMO_TODAY;
    var datePart = d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + DAY_NAMES_FULL[d.getDay()];
    if (lesson.date === todayISO) return 'Bugün · ' + datePart;
    return datePart;
  }

  function isJoinable(lesson, now) {
    var start = api.parseDateTime(lesson.date, lesson.startTime);
    var end = lessonEnd(lesson);
    var diff = start - now;
    return now < end && (diff <= 0 || diff <= 15 * 60 * 1000);
  }

  function getNextLesson(lessons, now) {
    var upcoming = lessons.filter(function (l) {
      return api.parseDateTime(l.date, l.startTime) >= now || isJoinable(l, now);
    });
    if (!upcoming.length) return lessons[lessons.length - 1] || null;
    return upcoming.sort(api.sortByTime)[0];
  }

  function isClanGroupLesson(lesson) {
    return lesson.type === 'clan' || lesson.type === 'kid' || lesson.type === 'rud';
  }

  function lessonTypeLabel(lesson) {
    if (lesson.type === 'one_to_one') return 'Birebir Ders';
    if (lesson.type === 'free_trial') return 'Ücretsiz Deneme';
    if (lesson.type === 'kid') return 'Kavram İnşa Dersi';
    if (lesson.type === 'rud') return 'Rehberli Uygulama Dersi';
    return 'Klan Dersi';
  }

  function lessonTypeShortLabel(lesson) {
    if (lesson.type === 'kid') return 'KİD';
    if (lesson.type === 'rud') return 'RUD';
    return lessonCardStyle(lesson).label;
  }

  function lessonTypeBadgeClass(lesson) {
    if (lesson.type === 'free_trial') return 'is-trial';
    if (lesson.type === 'one_to_one') return 'is-birebir';
    if (lesson.type === 'kid') return 'is-kid';
    if (lesson.type === 'rud') return 'is-rud';
    return 'is-klan';
  }

  function lessonTypeDesc(lesson) {
    if (lesson.type === 'one_to_one') {
      return 'Birebir ders — tek öğrenci ile bire bir canlı ders oturumu.';
    }
    if (lesson.type === 'free_trial') {
      return 'Ücretsiz deneme dersi (' + trialModeLabel(lesson) + ') — öğrenci ve veliye tanıtım amaçlı deneme oturumu.';
    }
    if (lesson.type === 'kid') {
      return 'Kavram İnşa Dersi (KİD) — öğrenciler kavramı sınıf içi tartışma ve etkinliklerle birlikte inşa eder.';
    }
    if (lesson.type === 'rud') {
      return 'Rehberli Uygulama Dersi (RUD) — öğretmen rehberliğinde adım adım soru çözümü ve uygulama yapılır.';
    }
    return 'Klan dersi — klan üyeleriyle grup halinde işlenen canlı ders oturumu.';
  }

  function buildTodayTypeTag(lesson) {
    var cls = lesson.type === 'free_trial' ? 'trial'
      : lesson.type === 'one_to_one' ? 'birebir'
      : lesson.type === 'kid' ? 'kid'
      : lesson.type === 'rud' ? 'rud'
      : lesson.type === 'clan' ? 'klan' : 'birebir';
    return '<span class="td-tl-type is-' + cls + '">' + escapeHtml(lessonTypeShortLabel(lesson)) + '</span>';
  }

  function lessonPartyLabel(lesson) {
    if (lesson.type === 'free_trial') return lesson.gradeLevel || '—';
    if (lesson.clan) return lesson.clan.name;
    if (lesson.student) return lesson.student.name;
    return '—';
  }

  function lessonTrialTopic(lesson) {
    return lesson.lessonTopic || lesson.lessonTitle || '—';
  }

  // Ücretsiz deneme dersi "Birebir Ders" ya da "Klan Dersi" modunu taşır (KİD/RUD içermez)
  function trialModeLabel(lesson) {
    return lesson.trialMode === 'clan' ? 'Klan Dersi' : 'Birebir Ders';
  }

  function gradeChipHtml(gradeLevel, extraCls) {
    if (!gradeLevel) return '';
    var cls = 'td-grade-chip' + (extraCls ? ' ' + extraCls : '');
    return '<span class="' + cls + '">' + escapeHtml(gradeLevel) + '</span>';
  }

  function buildWeekCalMeta(lesson, studentLink) {
    if (lesson.type === 'free_trial') {
      return '<span class="td-wcal-item-clan">' + escapeHtml(lessonTrialTopic(lesson)) + '</span>';
    }
    return '<span class="td-wcal-item-clan">' + escapeHtml(lessonPartyLabel(lesson)) + '</span>' + (studentLink || '');
  }

  function lessonCardStyle(lesson) {
    if (lesson.type === 'one_to_one') {
      return { typeCls: ' is-one-to-one', badgeCls: 'is-birebir', label: 'Birebir Ders' };
    }
    if (lesson.type === 'free_trial') {
      return { typeCls: ' is-free-trial', badgeCls: 'is-trial', label: 'Ücretsiz Deneme' };
    }
    if (lesson.type === 'kid') {
      return { typeCls: ' is-kid', badgeCls: 'is-kid', label: 'KİD' };
    }
    if (lesson.type === 'rud') {
      return { typeCls: ' is-rud', badgeCls: 'is-rud', label: 'RUD' };
    }
    return { typeCls: ' is-clan', badgeCls: 'is-klan', label: 'Klan Dersi' };
  }

  function statusLabel(status) {
    return status === 'completed' ? 'Tamamlandı' : 'Gelecek';
  }

  function bindEls() {
    els.todaySection = $('tdTodaySection');
    els.todayHero = $('tdTodayHero');
    els.todayDate = $('tdTodayDate');
    els.todayTimeline = $('tdTodayTimeline');
    els.todayEmpty = $('tdTodayEmpty');
    els.todayLoading = $('tdTodayLoading');
    els.todayError = $('tdTodayError');
    els.weekSection = $('tdWeekSection');
    els.weekSummary = $('tdWeekSummary');
    els.weekCalendar = $('tdWeekCalendar');
    els.weekEmpty = $('tdWeekEmpty');
    els.weekFilterEmpty = $('tdWeekFilterEmpty');
    els.weekLoading = $('tdWeekLoading');
    els.weekError = $('tdWeekError');
    els.weekEyebrow = $('tdWeekEyebrow');
    els.weekRange = $('tdWeekRange');
    els.weekPrev = $('tdWeekPrev');
    els.weekNext = $('tdWeekNext');
    els.weekEduNav = $('tdWeekEduNav');
    els.weekCalBtn = $('tdWeekCalBtn');
    els.weekPicker = $('tdWeekPicker');
    els.weekPickerList = $('tdWeekPickerList');
    els.weekFilterBar = $('tdWeekFilterBar');
    els.weekStatusSelect = $('tdWeekStatusSelect');
    els.weekTypeSelect = $('tdWeekTypeSelect');
    els.drawer = $('tdLessonDrawer');
    els.drawerOverlay = $('tdLessonDrawerOverlay');
    els.drawerClose = $('tdLessonDrawerClose');
    els.dIcon = $('tdLessonIcon');
    els.dSubject = $('tdLessonSubject');
    els.dTypeBadge = $('tdLessonTypeBadge');
    els.dFormatHint = $('tdLessonFormatHint');
    els.dTopic = $('tdLessonTopic');
    els.dDate = $('tdLessonDateText');
    els.dTime = $('tdLessonTimeText');
    els.dEduWeek = $('tdLessonEduWeek');
    els.dEduWeekText = $('tdLessonEduWeekText');
    els.dDesc = $('tdLessonDesc');
    els.dKazanimRow = $('tdLessonKazanimRow');
    els.dKazanim = $('tdLessonKazanim');
    els.dTrialSection = $('tdLessonTrialSection');
    els.dTrialAvatar = $('tdLessonTrialAvatar');
    els.dTrialGrade = $('tdLessonTrialGrade');
    els.dTrialTopic = $('tdLessonTrialTopic');
    els.dClanSection = $('tdLessonClanSection');
    els.dClanAvatarImg = $('tdLessonClanAvatarImg');
    els.dClanAvatar = $('tdLessonClanAvatar');
    els.dClanName = $('tdLessonClanName');
    els.dClanMeta = $('tdLessonClanMeta');
    els.dClanLink = $('tdLessonClanLink');
    els.dStudentSection = $('tdLessonStudentSection');
    els.dStudentLink = $('tdLessonStudentLink');
    els.dStudentAvatar = $('tdLessonStudentAvatar');
    els.dStudentName = $('tdLessonStudentName');
    els.dStudentMeta = $('tdLessonStudentMeta');
    els.dCta = $('tdLessonCta');
    els.dCtaLabel = $('tdLessonCtaLabel');
    els.dCtaTime = $('tdLessonCtaTime');
  }

  function setDrawerOpen(open) {
    if (!els.drawer) return;
    els.drawer.classList.toggle('is-open', open);
    els.drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) {
      selectedLesson = null;
      drawerSource = null;
      if (drawerCtaTick) { clearInterval(drawerCtaTick); drawerCtaTick = null; }
    }
  }

  function updateDrawerCta(lesson, now) {
    if (!els.dCta || !lesson) return;
    var start = api.parseDateTime(lesson.date, lesson.startTime);
    var end = lessonEnd(lesson);
    var url = getStartUrl(lesson);
    var diff = start - now;

    els.dCta.className = 'd3-drawer-cta';
    els.dCta.disabled = false;
    els.dCta.onclick = null;

    if (now >= end || lesson.status === 'completed') {
      els.dCta.classList.add('is-past');
      els.dCta.disabled = true;
      if (els.dCtaLabel) els.dCtaLabel.textContent = 'Ders sona erdi';
      if (els.dCtaTime) els.dCtaTime.hidden = true;
      return;
    }

    if (now >= start || diff <= DRAWER_START_WINDOW_MS) {
      els.dCta.classList.add('is-active');
      if (els.dCtaLabel) els.dCtaLabel.textContent = 'Dersi Başlat';
      if (els.dCtaTime) els.dCtaTime.hidden = true;
      els.dCta.onclick = function () { window.location.href = url; };
      return;
    }

    els.dCta.classList.add('is-waiting');
    els.dCta.disabled = true;
    if (els.dCtaLabel) els.dCtaLabel.textContent = 'Canlı Dersin Başlamasına kalan süre';
    if (els.dCtaTime) {
      els.dCtaTime.hidden = false;
      els.dCtaTime.textContent = fmtCountdown(diff);
    }
  }

  function startDrawerCtaTick(lesson) {
    if (drawerCtaTick) clearInterval(drawerCtaTick);
    function tick() {
      if (!selectedLesson || !els.drawer || !els.drawer.classList.contains('is-open')) return;
      updateDrawerCta(selectedLesson, getDemoNow());
    }
    tick();
    drawerCtaTick = setInterval(tick, 1000);
  }

  function formatEducationWeek(week) {
    if (!week) return '';
    if (typeof week === 'number') return week + '. Eğitim Haftası';
    return String(week);
  }

  function fillDrawer(lesson) {
    if (!lesson || !els.drawer) return;
    var sk = subjectKey(lesson.lessonName);
    els.drawer.setAttribute('data-subject', sk);

    if (els.dIcon) els.dIcon.textContent = SUBJECT_ICONS[sk] || '📅';
    if (els.dSubject) els.dSubject.textContent = (lesson.lessonName || TEACHER_BRANCH).toUpperCase();
    if (els.dTypeBadge) {
      var typeCls = lessonTypeBadgeClass(lesson);
      els.dTypeBadge.className = 'td-lesson-type-badge ' + typeCls;
      els.dTypeBadge.textContent = lessonTypeLabel(lesson);
    }
    if (els.dFormatHint) {
      var hintCls = lessonTypeBadgeClass(lesson);
      els.dFormatHint.className = 'td-lesson-format-hint ' + hintCls;
      els.dFormatHint.textContent = lessonTypeDesc(lesson);
    }
    if (els.dTopic) els.dTopic.textContent = lesson.lessonTitle || lesson.lessonTopic || '—';
    if (els.dDate) els.dDate.textContent = formatDrawerDate(lesson);
    if (els.dTime) {
      els.dTime.textContent = lesson.startTime + ' – ' + endTimeStr(lesson.startTime, lesson.durationMinutes);
    }
    if (els.dEduWeek && els.dEduWeekText) {
      var weekPart = lesson.educationWeek ? formatEducationWeek(lesson.educationWeek) : '';
      var gradePart = lesson.gradeLevel || '';
      if (weekPart || gradePart) {
        els.dEduWeekText.textContent = [weekPart, gradePart].filter(Boolean).join(' · ');
        els.dEduWeek.hidden = false;
      } else {
        els.dEduWeek.hidden = true;
      }
    }
    if (els.dDesc) {
      els.dDesc.textContent = lesson.lessonContent || 'Bu ders için detay açıklaması yakında eklenecek.';
    }
    if (els.dKazanim && els.dKazanimRow) {
      if (lesson.lessonTopic) {
        els.dKazanim.textContent = lesson.lessonTopic;
        els.dKazanimRow.hidden = false;
      } else {
        els.dKazanimRow.hidden = true;
      }
    }

    var isOneToOne = lesson.type === 'one_to_one';
    var isFreeTrial = lesson.type === 'free_trial';
    var isClanLesson = isClanGroupLesson(lesson);

    if (els.dClanSection) els.dClanSection.hidden = !isClanLesson;
    if (els.dStudentSection) els.dStudentSection.hidden = !isOneToOne;
    if (els.dTrialSection) els.dTrialSection.hidden = !isFreeTrial;
    if (els.dClanLink) els.dClanLink.hidden = true;
    if (els.dStudentLink) els.dStudentLink.hidden = true;

    if (isFreeTrial) {
      if (els.dTrialGrade) els.dTrialGrade.textContent = [trialModeLabel(lesson), lesson.gradeLevel].filter(Boolean).join(' · ');
      if (els.dTrialTopic) els.dTrialTopic.textContent = lessonTrialTopic(lesson);
      if (els.dTrialAvatar && window.TeacherAvatars) {
        window.TeacherAvatars.mountDrawerAvatar(els.dTrialAvatar, 'trial', { gradeLevel: lesson.gradeLevel });
      }
      if (els.dKazanimRow) els.dKazanimRow.hidden = true;
    } else if (isOneToOne) {
      var student = lesson.student;
      var studentName = student ? student.name : 'Öğrenci';
      if (els.dStudentName) els.dStudentName.textContent = studentName;
      if (els.dStudentMeta) {
        els.dStudentMeta.textContent = [lesson.gradeLevel, statusLabel(lesson.status)].filter(Boolean).join(' · ');
      }
      if (els.dStudentAvatar && window.TeacherAvatars) {
        window.TeacherAvatars.mountDrawerAvatar(els.dStudentAvatar, 'student', { name: studentName });
      }
      if (els.dStudentLink && student && student.id) {
        els.dStudentLink.href = studentDetailUrl(student, lesson);
        els.dStudentLink.hidden = false;
      }
    } else if (isClanLesson && lesson.clan) {
      var clan = lesson.clan;
      if (els.dClanName) els.dClanName.textContent = clan.name;
      if (els.dClanMeta) {
        els.dClanMeta.textContent = [lesson.gradeLevel, lessonTypeLabel(lesson), statusLabel(lesson.status)].filter(Boolean).join(' · ');
      }
      if (els.dClanAvatarImg && els.dClanAvatar) {
        if (clan.logoUrl) {
          els.dClanAvatarImg.src = clan.logoUrl;
          els.dClanAvatarImg.alt = clan.name;
          els.dClanAvatarImg.hidden = false;
          els.dClanAvatar.hidden = true;
        } else {
          els.dClanAvatarImg.hidden = true;
          if (window.TeacherAvatars) {
            window.TeacherAvatars.mountDrawerAvatar(els.dClanAvatar, 'clan', clan);
          } else {
            els.dClanAvatar.hidden = false;
            els.dClanAvatar.textContent = clanInitial(clan.name);
          }
        }
      }
      if (els.dClanLink) {
        els.dClanLink.href = clanDetailUrl(clan.id);
        els.dClanLink.hidden = false;
      }
    }

    updateDrawerCta(lesson, getDemoNow());
    startDrawerCtaTick(lesson);
  }

  function openDrawer(lesson, source) {
    selectedLesson = lesson;
    drawerSource = source;
    fillDrawer(lesson);
    setDrawerOpen(true);
  }

  function renderTodayHero(featured, now) {
    if (!els.todayHero || !featured) return;
    var clanName = lessonPartyLabel(featured);
    var avatarHtml = renderHeroPartyAvatar(featured);
    var typeTag = buildTodayTypeTag(featured);

    var liveHtml = isLessonLive(featured, now)
      ? '<span class="d3-hero-video-live" id="tdHeroLiveBadge">CANLI</span>'
      : '<span class="d3-hero-video-live" id="tdHeroLiveBadge" hidden>CANLI</span>';

    els.todayHero.innerHTML =
      '<div class="d3-hero-content">' +
        '<div class="d3-hero-video">' +
          liveHtml +
          '<div class="d3-hero-video-info">' +
            '<span class="d3-hero-video-subject">' + escapeHtml(featured.lessonName) + '</span>' +
            '<span class="d3-hero-video-week">' + CAL_SVG + escapeHtml(featured.educationWeek) + '</span>' +
            '<h2 class="d3-hero-video-title">' + escapeHtml(featured.lessonTitle || featured.lessonTopic) + '</h2>' +
            '<div class="d3-hero-video-meta">' +
              avatarHtml +
              '<strong>' + escapeHtml(clanName) + '</strong>' +
              (typeTag ? typeTag.replace('td-tl-type', 'td-hero-type td-tl-type') : '') +
              (featured.gradeLevel ? gradeChipHtml(featured.gradeLevel, 'is-hero') : '') +
              '<span class="d3-hero-video-meta-sep">·</span>' +
              '<span>' + featured.durationMinutes + ' dk</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="d3-hero-footer" id="tdHeroFooter"></div>' +
      '</div>';

    updateHeroCta(featured, now);
    startHeroCtaTick(featured);
  }

  function renderTodayTimeline(lessons) {
    if (!els.todayTimeline) return;
    els.todayTimeline.innerHTML = lessons.map(function (lesson) {
      var subj = subjectKey(lesson.lessonName);
      var rowLabel = lesson.type === 'free_trial' ? lessonTrialTopic(lesson) : lessonPartyLabel(lesson);
      var typeTag = buildTodayTypeTag(lesson);
      return (
        '<div class="d3-tl-item" role="button" tabindex="0" data-subject="' + subj + '" data-lesson-id="' + escapeHtml(lesson.id) + '">' +
          '<div class="d3-tl-rail"><span class="d3-tl-dot"></span></div>' +
          '<span class="d3-tl-time">' + escapeHtml(lesson.startTime) + '</span>' +
          '<div class="d3-tl-card">' +
            '<div class="d3-tl-body">' +
              '<div class="td-tl-clan-row">' +
                typeTag +
                '<span class="td-tl-clan">' + escapeHtml(rowLabel) + '</span>' +
              '</div>' +
              '<div class="d3-tl-head">' +
                '<span class="d3-tl-subject">' + escapeHtml(lesson.lessonName) + '</span>' +
                gradeChipHtml(lesson.gradeLevel) +
                '<span class="d3-tl-week">' + CAL_SVG + escapeHtml(lesson.educationWeek) + '</span>' +
              '</div>' +
              '<h3 class="d3-tl-topic">' + escapeHtml(lesson.lessonTitle || lesson.lessonTopic) + '</h3>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    els.todayTimeline.querySelectorAll('.d3-tl-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var id = item.getAttribute('data-lesson-id');
        var lesson = lessons.find(function (l) { return l.id === id; });
        if (lesson) openDrawer(lesson, 'today');
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
    });
  }

  function renderToday() {
    var st = todayState.status;
    if (els.todayLoading) els.todayLoading.hidden = st !== 'loading';
    if (els.todayError) els.todayError.hidden = st !== 'error';
    if (els.todayEmpty) els.todayEmpty.hidden = st !== 'empty';
    if (els.todayHero) els.todayHero.hidden = st !== 'ready';
    if (els.todayTimeline) els.todayTimeline.hidden = st !== 'ready';
    if (st !== 'ready' && heroCtaTick) {
      clearInterval(heroCtaTick);
      heroCtaTick = null;
      featuredLesson = null;
    }
    var megaRight = els.todaySection && els.todaySection.querySelector('.d3-mega-right');
    if (megaRight) megaRight.hidden = st === 'empty' || st === 'error';

    if (st !== 'ready' || !todayState.data) return;

    var now = new Date(todayState.data.now);
    var lessons = branchLessons(todayState.data.lessons);
    if (els.todayDate) els.todayDate.textContent = formatFriendlyDate(todayState.data.date);

    var featured = getNextLesson(lessons, now) || lessons[0];
    renderTodayHero(featured, now);
    renderTodayTimeline(lessons);
  }

  function loadToday() {
    todayState.status = 'loading';
    renderToday();
    return api.getToday().then(function (data) {
      todayState.data = data;
      var lessons = branchLessons(data.lessons);
      if (!lessons.length) {
        todayState.status = 'empty';
      } else {
        todayState.status = 'ready';
      }
      renderToday();
    }).catch(function () {
      todayState.status = 'error';
      renderToday();
    });
  }

  function getFilteredWeekLessons() {
    if (!weekState.data) return [];
    var lessons = branchLessons(weekState.data.lessons);
    return lessons.filter(function (l) {
      if (weekState.statusFilter === 'completed' && l.status !== 'completed') return false;
      if (weekState.statusFilter === 'upcoming' && l.status !== 'upcoming') return false;
      if (weekState.typeFilter === 'one_to_one' && l.type !== 'one_to_one') return false;
      if (weekState.typeFilter === 'kid' && l.type !== 'kid') return false;
      if (weekState.typeFilter === 'rud' && l.type !== 'rud') return false;
      if (weekState.typeFilter === 'free_trial' && l.type !== 'free_trial') return false;
      return true;
    });
  }

  function weekFiltersActive() {
    return weekState.statusFilter !== 'all' || weekState.typeFilter !== 'all';
  }

  function weekDateISO(weekStart, dayIdx) {
    var d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + dayIdx);
    return api.formatDateISO(d);
  }

  function buildWeekCalLessonCard(lesson) {
    var statusCls = lesson.status === 'completed' ? 'is-completed' : 'is-upcoming';
    var style = lessonCardStyle(lesson);
    var partyLabel = lessonPartyLabel(lesson);
    var studentLink = '';
    if (lesson.type === 'one_to_one' && lesson.student && lesson.student.id) {
      studentLink =
        '<a href="' + escapeHtml(studentDetailUrl(lesson.student, lesson)) + '" class="td-wcal-item-detail-link" title="Öğrenci detayına git" aria-label="' + escapeHtml(partyLabel) + ' — öğrenci detayına git">' +
          STUDENT_DETAIL_SVG +
        '</a>';
    }
    var gradeChip = gradeChipHtml(lesson.gradeLevel, 'is-wcal');
    var modeTag = lesson.type === 'free_trial'
      ? '<span class="td-wcal-item-type ' + (lesson.trialMode === 'clan' ? 'is-klan' : 'is-birebir') + '">' + escapeHtml(trialModeLabel(lesson)) + '</span>'
      : '';
    return (
      '<div class="td-wcal-item ' + statusCls + style.typeCls + '" data-lesson-id="' + escapeHtml(lesson.id) + '" role="button" tabindex="0">' +
        '<div class="td-wcal-item-tags">' +
          '<span class="td-wcal-item-type ' + style.badgeCls + '">' + escapeHtml(style.label) + '</span>' +
          modeTag +
          gradeChip +
          '<span class="td-wcal-item-chip">' + escapeHtml(statusLabel(lesson.status)) + '</span>' +
        '</div>' +
        '<span class="td-wcal-item-subject">' + escapeHtml(lesson.lessonName) + '</span>' +
        '<span class="td-wcal-item-topic">' + escapeHtml(lesson.lessonTitle || lesson.lessonTopic) + '</span>' +
        '<span class="td-wcal-item-time">' + escapeHtml(lesson.startTime) + '</span>' +
        '<div class="td-wcal-item-meta">' +
          buildWeekCalMeta(lesson, studentLink) +
        '</div>' +
      '</div>'
    );
  }

  function buildWeekCalDayCarousel(dayLessons) {
    var cards = dayLessons.map(buildWeekCalLessonCard).join('');
    if (dayLessons.length <= 1) {
      return '<div class="td-wcal-day-cards">' + cards + '</div>';
    }
    return (
      '<div class="td-wcal-day-carousel has-multiple">' +
        '<button type="button" class="td-wcal-nav-btn td-wcal-nav-prev" aria-label="Önceki ders">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</button>' +
        '<div class="td-wcal-day-viewport">' +
          '<div class="td-wcal-day-list">' + cards + '</div>' +
        '</div>' +
        '<button type="button" class="td-wcal-nav-btn td-wcal-nav-next" aria-label="Sonraki ders">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>' +
      '</div>'
    );
  }

  function buildWeekCalDayColumn(dayIdx, weekStart, lessons) {
    var dateISO = weekDateISO(weekStart, dayIdx);
    var dayLessons = lessons.filter(function (l) { return l.date === dateISO; }).sort(api.sortByTime);
    var d = new Date(dateISO + 'T12:00:00');
    var body = dayLessons.length
      ? buildWeekCalDayCarousel(dayLessons)
      : '<div class="td-wcal-day-cards"><span class="td-wcal-day-empty">—</span></div>';
    return (
      '<div class="td-wcal-day-group" data-date="' + dateISO + '">' +
        '<span class="td-wcal-day-hd">' + escapeHtml(WEEK_DAY_NAMES[dayIdx]) + '<span class="td-wcal-day-num">' + d.getDate() + '</span></span>' +
        body +
      '</div>'
    );
  }

  function initWeekCalCarousels() {
    var LIST_GAP = 6;
    var CARD_PEEK = 0.86;
    document.querySelectorAll('.td-wcal-day-carousel').forEach(function (carousel) {
      var list = carousel.querySelector('.td-wcal-day-list');
      var prev = carousel.querySelector('.td-wcal-nav-prev');
      var next = carousel.querySelector('.td-wcal-nav-next');
      if (!list || !prev || !next) return;

      function syncWidths() {
        var viewport = carousel.querySelector('.td-wcal-day-viewport');
        if (!viewport) return;
        var cards = list.querySelectorAll('.td-wcal-item');
        var hasMore = cards.length > 1;
        carousel.classList.toggle('has-multiple', hasMore);
        var peekRatio = hasMore ? CARD_PEEK : 1;
        var w = Math.max(Math.floor(viewport.clientWidth * peekRatio), 1);
        cards.forEach(function (card) {
          card.style.flex = '0 0 ' + w + 'px';
          card.style.width = w + 'px';
        });
        if (!hasMore) list.scrollLeft = 0;
        update();
      }

      function step() {
        var card = list.querySelector('.td-wcal-item');
        return card ? Math.round(card.getBoundingClientRect().width) + LIST_GAP : 100;
      }

      function update() {
        var max = list.scrollWidth - list.clientWidth - 1;
        prev.disabled = list.scrollLeft <= 0;
        next.disabled = list.scrollLeft >= max;
        carousel.classList.toggle('can-scroll-left', list.scrollLeft > 0);
        carousel.classList.toggle('can-scroll-right', list.scrollLeft < max);
      }

      prev.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        list.scrollBy({ left: -step(), behavior: 'smooth' });
      });
      next.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        list.scrollBy({ left: step(), behavior: 'smooth' });
      });
      list.addEventListener('scroll', update);
      window.addEventListener('resize', syncWidths);
      syncWidths();
    });
  }

  function bindWeekCalLessonClicks(root) {
    if (!root) return;
    root.querySelectorAll('.td-wcal-item[data-lesson-id]').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.td-wcal-item-detail-link')) return;
        var id = card.getAttribute('data-lesson-id');
        var lesson = weekState.data.lessons.find(function (l) { return l.id === id; });
        if (lesson) openDrawer(lesson, 'week');
      });
      card.addEventListener('keydown', function (e) {
        if (e.target.closest('.td-wcal-item-detail-link')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var id = card.getAttribute('data-lesson-id');
          var lesson = weekState.data.lessons.find(function (l) { return l.id === id; });
          if (lesson) openDrawer(lesson, 'week');
        }
      });
    });
  }

  function updateWeekSummary() {
    if (!els.weekSummary || !weekState.data) return;
    var all = branchLessons(weekState.data.lessons);
    var lessons = weekFiltersActive() ? getFilteredWeekLessons() : all;
    var completed = lessons.filter(function (l) { return l.status === 'completed'; }).length;
    var upcoming = lessons.filter(function (l) { return l.status === 'upcoming'; }).length;
    var birebir = lessons.filter(function (l) { return l.type === 'one_to_one'; }).length;
    var trial = lessons.filter(function (l) { return l.type === 'free_trial'; }).length;
    var total = lessons.length;
    els.weekSummary.innerHTML =
      '<div class="td-week-chip"><span class="td-week-chip-val">' + completed + ' / ' + total + '</span><span class="td-week-chip-label">Tamamlanan Dersler</span></div>' +
      '<div class="td-week-chip is-upcoming"><span class="td-week-chip-val">' + upcoming + '</span><span class="td-week-chip-label">Gelecek Dersler</span></div>' +
      '<div class="td-week-chip is-birebir"><span class="td-week-chip-val">' + birebir + '</span><span class="td-week-chip-label">Birebir Ders</span></div>' +
      '<div class="td-week-chip is-trial"><span class="td-week-chip-val">' + trial + '</span><span class="td-week-chip-label">Ücretsiz Deneme</span></div>' +
      '<div class="td-week-chip is-total"><span class="td-week-chip-val">' + total + '</span><span class="td-week-chip-label">Toplam Ders</span></div>';
  }

  function renderWeekCalendar() {
    if (!els.weekCalendar) return;
    var lessons = getFilteredWeekLessons();
    var hasFilter = weekFiltersActive();
    var weekEmpty = !weekState.data || !branchLessons(weekState.data.lessons).length;

    if (els.weekEmpty) els.weekEmpty.hidden = !weekEmpty || weekState.status !== 'ready';
    if (els.weekFilterEmpty) {
      els.weekFilterEmpty.hidden = weekEmpty || lessons.length > 0 || weekState.status !== 'ready';
    }
    if (weekEmpty || (!lessons.length && hasFilter)) {
      var grid = $('tdWeekCalGrid');
      if (grid) grid.innerHTML = '';
      updateWeekSummary();
      return;
    }

    var weekStart = weekState.data.weekStart;
    var topRow = [0, 1, 2, 3].map(function (idx) { return buildWeekCalDayColumn(idx, weekStart, lessons); }).join('');
    var bottomRow = [4, 5, 6].map(function (idx) { return buildWeekCalDayColumn(idx, weekStart, lessons); }).join('');
    var gridEl = $('tdWeekCalGrid');
    if (gridEl) {
      gridEl.innerHTML =
        '<div class="td-wcal-row is-top">' + topRow + '</div>' +
        '<div class="td-wcal-row is-bottom">' + bottomRow + '</div>';
      bindWeekCalLessonClicks(gridEl);
      initWeekCalCarousels();
    }
    updateWeekSummary();
  }

  function updateWeekNavLabels() {
    var w = weekState.selectedEduWeek;
    if (!w) return;
    if (els.weekEyebrow) els.weekEyebrow.textContent = api.formatEduWeekLabel(w);
    if (els.weekRange) els.weekRange.textContent = api.formatEduWeekRange(w);
    if (els.weekPrev) els.weekPrev.disabled = w <= api.MIN_EDU_WEEK;
    if (els.weekNext) els.weekNext.disabled = w >= api.MAX_EDU_WEEK;
  }

  function renderWeekPicker() {
    if (!els.weekPickerList) return;
    var html = '';
    for (var w = api.MIN_EDU_WEEK; w <= api.MAX_EDU_WEEK; w++) {
      var activeCls = w === weekState.selectedEduWeek ? ' is-active' : '';
      var count = api.countLessonsForEduWeek(w);
      var countLabel = count ? count + ' ders' : 'Ders yok';
      html += '<button type="button" class="td-week-edu-picker-item' + activeCls + '" data-week="' + w + '">' +
        '<strong>' + escapeHtml(api.formatEduWeekLabel(w)) + '</strong>' +
        '<span>' + escapeHtml(api.formatEduWeekRange(w) + ' · ' + countLabel) + '</span>' +
        '</button>';
    }
    els.weekPickerList.innerHTML = html;
  }

  function closeWeekPicker() {
    if (els.weekPicker) els.weekPicker.hidden = true;
    if (els.weekCalBtn) {
      els.weekCalBtn.classList.remove('is-open');
      els.weekCalBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function openWeekPicker() {
    renderWeekPicker();
    if (els.weekPicker) els.weekPicker.hidden = false;
    if (els.weekCalBtn) {
      els.weekCalBtn.classList.add('is-open');
      els.weekCalBtn.setAttribute('aria-expanded', 'true');
    }
  }

  function selectEduWeek(weekNum) {
    var w = parseInt(weekNum, 10);
    if (!w || w < api.MIN_EDU_WEEK || w > api.MAX_EDU_WEEK || w === weekState.selectedEduWeek) return;
    closeWeekPicker();
    loadWeekByEduWeek(w);
  }

  function shiftEduWeek(delta) {
    if (!weekState.selectedEduWeek) return;
    var next = weekState.selectedEduWeek + delta;
    if (next < api.MIN_EDU_WEEK || next > api.MAX_EDU_WEEK) return;
    selectEduWeek(next);
  }

  function syncWeekFilterUi() {
    if (els.weekStatusSelect) els.weekStatusSelect.value = weekState.statusFilter;
    if (els.weekTypeSelect) els.weekTypeSelect.value = weekState.typeFilter;
    updateWeekSelectStates();
  }

  function updateWeekSelectStates() {
    if (els.weekStatusSelect) {
      els.weekStatusSelect.classList.toggle('is-filtered', weekState.statusFilter !== 'all');
    }
    if (els.weekTypeSelect) {
      els.weekTypeSelect.classList.toggle('is-filtered', weekState.typeFilter !== 'all');
    }
  }

  function loadWeekByEduWeek(eduWeekNum) {
    weekState.status = 'loading';
    weekState.selectedEduWeek = eduWeekNum;
    weekState.statusFilter = 'all';
    weekState.typeFilter = 'all';
    syncWeekFilterUi();
    updateWeekNavLabels();
    renderWeek();
    return api.getWeekByEduWeek(eduWeekNum).then(function (data) {
      weekState.data = data;
      weekState.status = 'ready';
      renderWeek();
    }).catch(function () {
      weekState.status = 'error';
      renderWeek();
    });
  }

  function initWeekEduNav() {
    if (!els.weekEduNav || els.weekEduNav.getAttribute('data-week-nav-ready')) return;
    els.weekEduNav.setAttribute('data-week-nav-ready', '1');

    if (els.weekPrev) {
      els.weekPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        shiftEduWeek(-1);
      });
    }
    if (els.weekNext) {
      els.weekNext.addEventListener('click', function (e) {
        e.stopPropagation();
        shiftEduWeek(1);
      });
    }
    if (els.weekCalBtn) {
      els.weekCalBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!els.weekPicker) return;
        if (els.weekPicker.hidden) openWeekPicker();
        else closeWeekPicker();
      });
    }
    if (els.weekPickerList) {
      els.weekPickerList.addEventListener('click', function (e) {
        var item = e.target.closest('[data-week]');
        if (!item) return;
        selectEduWeek(item.getAttribute('data-week'));
      });
    }
    document.addEventListener('click', function (e) {
      if (!els.weekPicker || els.weekPicker.hidden) return;
      if (els.weekEduNav && els.weekEduNav.contains(e.target)) return;
      closeWeekPicker();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeWeekPicker();
    });
  }

  function renderWeek() {
    var st = weekState.status;
    if (els.weekLoading) els.weekLoading.hidden = st !== 'loading';
    if (els.weekError) els.weekError.hidden = st !== 'error';
    if (els.weekCalendar) els.weekCalendar.hidden = st !== 'ready';
    if (els.weekSummary) els.weekSummary.hidden = st !== 'ready';
    if (els.weekFilterBar) els.weekFilterBar.hidden = st !== 'ready';

    if (st === 'ready' && weekState.data) {
      updateWeekNavLabels();
      renderWeekCalendar();
    }
  }

  function loadWeek(weekStartISO) {
    var eduWeek = api.findEduWeekForDate(weekStartISO);
    loadWeekByEduWeek(eduWeek);
  }

  function shiftWeek(delta) {
    shiftEduWeek(delta);
  }

  function initWeekFilters() {
    if (els.weekStatusSelect) {
      els.weekStatusSelect.addEventListener('change', function () {
        weekState.statusFilter = els.weekStatusSelect.value;
        updateWeekSelectStates();
        renderWeekCalendar();
      });
    }
    if (els.weekTypeSelect) {
      els.weekTypeSelect.addEventListener('change', function () {
        weekState.typeFilter = els.weekTypeSelect.value;
        updateWeekSelectStates();
        renderWeekCalendar();
      });
    }
    updateWeekSelectStates();
  }

  function initDrawer() {
    if (els.drawer) {
      els.drawer.querySelectorAll('[data-lesson-close]').forEach(function (el) {
        el.addEventListener('click', function () { setDrawerOpen(false); });
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.drawer && els.drawer.classList.contains('is-open')) setDrawerOpen(false);
    });
  }

  function init() {
    bindEls();
    initDrawer();
    initWeekFilters();
    initWeekEduNav();

    loadToday();
    loadWeekByEduWeek(api.findEduWeekForDate(api.DEMO_TODAY));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
