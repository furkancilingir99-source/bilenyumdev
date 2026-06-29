/**
 * Öğretmen Ödev Kontrol sayfası
 */
(function () {
  'use strict';

  var api = window.TeacherHomeworkMock;
  var weekApi = window.TeacherDashboardMock;
  if (!api) return;

  var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  var state = {
    tab: 'clans',
    view: 'list',
    status: 'loading',
    clans: [],
    birebirStudents: [],
    homeworks: [],
    students: [],
    selectedClan: null,
    selectedBirebirStudent: null,
    selectedHomework: null,
    selectedEduWeek: weekApi ? weekApi.findEduWeekForDate(weekApi.DEMO_TODAY) : 17,
    studentFilter: 'all',
    homeworkFilter: 'all',
    birebirDrawerOpen: false
  };

  var els = {};

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr + 'T12:00:00');
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }

  function homeworkTypeLabel(hw) {
    if (!hw || !hw.homeworkType) return '';
    if (hw.homeworkType === 'kid') return 'KİD Ödevi';
    if (hw.homeworkType === 'rud') return 'RUD Ödevi';
    return '';
  }

  function homeworkTypeBadgeCls(hw) {
    if (!hw || !hw.homeworkType) return '';
    if (hw.homeworkType === 'kid') return 'is-kid';
    if (hw.homeworkType === 'rud') return 'is-rud';
    return '';
  }

  var SUBJECT_KEYS = { 'Matematik': 'mat', 'Fen Bilimleri': 'fen', 'Türkçe': 'trk', 'İngilizce': 'ing' };
  var SUBJECT_ICONS = { mat: '📐', fen: '🔬', trk: '📖', ing: '🌍', kid: '🧩', rud: '🎯', hw: '📝' };

  var SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var SVG_REMAINING = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  var SVG_TOTAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
  var SVG_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var SVG_ALERT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var SVG_USERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

  function drawerSubjectKey(hw) {
    if (hw && hw.homeworkType === 'kid') return 'kid';
    if (hw && hw.homeworkType === 'rud') return 'rud';
    var lesson = (hw && hw.lessonName) || '';
    if (lesson.indexOf('KİD') >= 0 || lesson.indexOf('KID') >= 0) return 'kid';
    if (lesson.indexOf('RUD') >= 0) return 'rud';
    return SUBJECT_KEYS[lesson] || 'mat';
  }

  function drawerHeadIcon(hw) {
    var sk = drawerSubjectKey(hw);
    return SUBJECT_ICONS[sk] || SUBJECT_ICONS.hw;
  }

  function studentAvatarHtml(name) {
    var TA = window.TeacherAvatars;
    if (TA) {
      return '<span class="td-drawer-bm td-drawer-bm--img td-drawer-bm--student" aria-hidden="true">' + TA.studentAvatarSvg(name) + '</span>';
    }
    return '<span class="td-drawer-bm td-drawer-bm--student" aria-hidden="true">' + escapeHtml(clanInitial(name)) + '</span>';
  }

  function homeworkTypeBadgeHtml(hw) {
    var label = homeworkTypeLabel(hw);
    if (!label) return '';
    return '<span class="thw-drawer-type-badge ' + homeworkTypeBadgeCls(hw) + '">' + escapeHtml(label) + '</span>';
  }

  function studentStatusMeta(student, hw) {
    var bucket = studentSubmissionStatus(student);
    if (bucket === 'completed') return { cls: 'is-done', label: 'Tamamlandı' };
    if (bucket === 'in_progress') return { cls: 'is-in-progress', label: 'Devam ediyor' };
    var due = student.dueDate || (hw && hw.dueDate);
    if (due && weekApi && weekApi.DEMO_TODAY && due < weekApi.DEMO_TODAY) {
      return { cls: 'is-overdue', label: 'Gecikmiş' };
    }
    return { cls: 'is-not-started', label: 'Henüz başlamadı' };
  }

  function renderDrawerStat(cls, iconSvg, val, label) {
    return (
      '<div class="thw-drawer-stat ' + cls + '">' +
        '<div class="thw-drawer-stat-ico">' + iconSvg + '</div>' +
        '<span class="thw-drawer-stat-val">' + escapeHtml(String(val)) + '</span>' +
        '<span class="thw-drawer-stat-label">' + escapeHtml(label) + '</span>' +
      '</div>'
    );
  }

  function renderDrawerProgress(progress, isComplete) {
    var done = progress.completedQuestions || 0;
    var total = progress.totalQuestions || 1;
    var pct = isComplete ? 100 : Math.min(100, Math.round((done / total) * 100));
    var hint = isComplete
      ? '<p class="d3-drawer-progress-hint">Tüm sorular tamamlandı.</p>'
      : '<p class="d3-drawer-progress-hint">Öğrenci <strong>' + (progress.remainingQuestions || 0) + ' soru</strong> daha tamamlamalı.</p>';
    return (
      '<div class="d3-drawer-progress thw-drawer-progress' + (isComplete ? ' is-complete' : '') + '">' +
        '<div class="d3-drawer-progress-head">' +
          '<span>Soru ilerlemesi</span>' +
          '<strong>' + done + ' / ' + total + '</strong>' +
        '</div>' +
        '<div class="d3-drawer-progress-track">' +
          '<div class="d3-drawer-progress-current" style="width:' + pct + '%"></div>' +
        '</div>' +
        hint +
      '</div>'
    );
  }

  function applyDrawerTheme(hw) {
    if (!els.drawer) return;
    var sk = drawerSubjectKey(hw);
    els.drawer.setAttribute('data-subject', sk === 'kid' || sk === 'rud' ? 'mat' : sk);
    if (hw && hw.homeworkType) els.drawer.setAttribute('data-hw-type', hw.homeworkType);
    else els.drawer.removeAttribute('data-hw-type');
  }

  function setDrawer(open) {
    if (!els.drawer) return;
    els.drawer.classList.toggle('is-open', open);
    els.drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) {
      if (els.drawerBody) els.drawerBody.innerHTML = '';
      if (isBirebirTab() && state.view === 'homeworks' && state.birebirDrawerOpen) {
        state.birebirDrawerOpen = false;
        state.selectedHomework = null;
        syncUrl('replace');
      }
    }
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear() + ', ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function clanInitial(name) { return (name || '?').charAt(0).toUpperCase(); }

  function isBirebirTab() { return state.tab === 'birebir'; }

  function homeworksBackLabel() {
    return isBirebirTab() ? '← Birebir öğrencilere dön' : '← Klanlara dön';
  }

  function studentsBackLabel() {
    var ctx = isBirebirTab() ? state.selectedBirebirStudent : state.selectedClan;
    var name = ctx ? ctx.name : listContextLabel();
    return '← ' + name + ' ödevlerine dön';
  }

  function renderDetailBtn(label) {
    return (
      '<span class="tkg-card-action" data-card-action="detail" role="button" tabindex="0">' +
        '<span class="tkg-card-action-text">' + escapeHtml(label) + '</span>' +
        ARROW_SVG +
      '</span>'
    );
  }

  function snapshotState() {
    return {
      tab: state.tab,
      view: state.view,
      selectedClanId: state.selectedClan ? state.selectedClan.id : null,
      selectedBirebirStudentId: state.selectedBirebirStudent ? state.selectedBirebirStudent.id : null,
      selectedHomeworkId: state.selectedHomework ? state.selectedHomework.id : null,
      selectedEduWeek: state.selectedEduWeek,
      birebirDrawerOpen: state.birebirDrawerOpen
    };
  }

  function buildUrl() {
    var url = new URL(window.location.href);
    url.searchParams.set('tab', isBirebirTab() ? 'birebir' : 'clans');
    if (state.selectedEduWeek) url.searchParams.set('week', String(state.selectedEduWeek));
    else url.searchParams.delete('week');

    if (state.view === 'homeworks' || state.view === 'students') {
      if (isBirebirTab() && state.selectedBirebirStudent) {
        url.searchParams.set('student', state.selectedBirebirStudent.id);
        url.searchParams.delete('clan');
      } else if (state.selectedClan) {
        url.searchParams.set('clan', state.selectedClan.id);
        url.searchParams.delete('student');
      } else {
        url.searchParams.delete('clan');
        url.searchParams.delete('student');
      }
    } else {
      url.searchParams.delete('clan');
      url.searchParams.delete('student');
    }

    if (state.selectedHomework) {
      var includeHomeworkInUrl = state.view === 'students'
        || (isBirebirTab() && state.view === 'homeworks' && state.birebirDrawerOpen);
      if (includeHomeworkInUrl) {
        url.searchParams.set('homework', state.selectedHomework.id);
      } else {
        url.searchParams.delete('homework');
      }
    } else {
      url.searchParams.delete('homework');
    }

    return url.pathname + url.search;
  }

  function syncUrl(mode) {
    var href = buildUrl();
    var snap = snapshotState();
    if (mode === 'push') window.history.pushState({ thw: snap }, '', href);
    else window.history.replaceState({ thw: snap }, '', href);
  }

  function apiOpts() {
    return { eduWeek: state.selectedEduWeek };
  }

  function parseUrl() {
    var params = new URLSearchParams(window.location.search);
    var tab = params.get('tab');
    if (tab === 'birebir' || tab === 'students') state.tab = 'birebir';
    else state.tab = 'clans';

    state._routeClanId = params.get('clan');
    state._routeStudentId = params.get('student');
    state._routeHomeworkId = params.get('homework');

    var week = parseInt(params.get('week'), 10);
    if (weekApi && week >= weekApi.MIN_EDU_WEEK && week <= weekApi.MAX_EDU_WEEK) {
      state.selectedEduWeek = week;
    }
  }

  function hasDeepRoute() {
    return !!(state._routeClanId || state._routeStudentId);
  }

  function clearRouteParams() {
    delete state._routeClanId;
    delete state._routeStudentId;
    delete state._routeHomeworkId;
  }

  function restoreRouteFromUrl() {
    var clanId = state._routeClanId;
    var studentId = state._routeStudentId;
    var homeworkId = state._routeHomeworkId;
    clearRouteParams();

    if (isBirebirTab() && studentId) {
      var student = state.birebirStudents.find(function (s) { return s.id === studentId; });
      if (!student) return Promise.resolve();
      if (homeworkId) {
        return api.getBirebirHomeworks(student.id, apiOpts()).then(function (list) {
          var hw = list.find(function (h) { return h.id === homeworkId; });
          if (!hw) return navigate('homeworks', student, null, 'replace');
          state.selectedBirebirStudent = student;
          state.selectedClan = null;
          return navigate('homeworks', student, null, 'replace').then(function () {
            return openBirebirHomework(hw, { historyMode: 'replace' });
          });
        });
      }
      return navigate('homeworks', student, null, 'replace');
    }

    if (!isBirebirTab() && clanId) {
      var clan = state.clans.find(function (c) { return c.id === clanId; });
      if (!clan) return Promise.resolve();
      if (homeworkId) {
        return api.getHomeworks(clan.id, apiOpts()).then(function (list) {
          var hw = list.find(function (h) { return h.id === homeworkId; });
          if (!hw) return navigate('homeworks', clan, null, 'replace');
          state.selectedClan = clan;
          state.selectedBirebirStudent = null;
          return navigate('students', clan, hw, 'replace');
        });
      }
      return navigate('homeworks', clan, null, 'replace');
    }

    return Promise.resolve();
  }

  function restoreFromHistorySnapshot(snap) {
    if (!snap) {
      parseUrl();
      return load();
    }
    state.tab = snap.tab === 'birebir' ? 'birebir' : 'clans';
    if (snap.selectedEduWeek) state.selectedEduWeek = snap.selectedEduWeek;

    if (!snap.view || snap.view === 'list') {
      state.view = 'list';
      clearRouteParams();
      return load();
    }

    state.view = snap.view;
    state._routeClanId = snap.selectedClanId;
    state._routeStudentId = snap.selectedBirebirStudentId;
    state._routeHomeworkId = snap.selectedHomeworkId || null;
    state.birebirDrawerOpen = !!snap.birebirDrawerOpen;
    if (!state.birebirDrawerOpen) setDrawer(false);
    return load().then(function () { return restoreRouteFromUrl(); });
  }

  function renderClanAvatar(clan) {
    var TA = window.TeacherAvatars;
    if (clan && clan.logoUrl) {
      return '<span class="tkg-avatar tkg-avatar--img is-clan" aria-hidden="true"><img src="' + escapeHtml(clan.logoUrl) + '" alt="" loading="lazy" /></span>';
    }
    if (TA && TA.clanAvatarSvg) {
      return '<span class="tkg-avatar tkg-avatar--img is-clan" aria-hidden="true">' + TA.clanAvatarSvg(clan) + '</span>';
    }
    var emoji = (TA && TA.clanEmoji) ? TA.clanEmoji(clan) : (clan && clan.emoji) || '🏰';
    return '<span class="tkg-avatar tkg-avatar--emoji is-clan" aria-hidden="true">' + escapeHtml(emoji) + '</span>';
  }

  function clanAvatarHtml(clan) {
    if (clan && clan.logoUrl) {
      return '<span class="td-drawer-bm td-drawer-bm--img td-drawer-bm--clan" aria-hidden="true"><img src="' + escapeHtml(clan.logoUrl) + '" alt="" loading="lazy" /></span>';
    }
    var TA = window.TeacherAvatars;
    if (TA && TA.clanAvatarSvg) {
      return '<span class="td-drawer-bm td-drawer-bm--img td-drawer-bm--clan" aria-hidden="true">' + TA.clanAvatarSvg(clan) + '</span>';
    }
    return '<span class="td-drawer-bm td-drawer-bm--emoji" aria-hidden="true">' + escapeHtml((TA && TA.clanEmoji(clan)) || (clan && clan.emoji) || '🏰') + '</span>';
  }

  function renderClanNameHead(clan) {
    return (
      '<span class="thw-name-head">' +
        renderClanAvatar(clan) +
        '<span class="thw-name-head-text">' + escapeHtml(clan.name) + '</span>' +
      '</span>'
    );
  }

  function renderStudentNameHead(name, sizeCls) {
    return (
      '<span class="thw-name-head' + (sizeCls ? ' ' + sizeCls : '') + '">' +
        renderAvatar(name, true) +
        '<span class="thw-name-head-text">' + escapeHtml(name) + '</span>' +
      '</span>'
    );
  }

  function renderAvatar(name, isStudent, clan) {
    var TA = window.TeacherAvatars;
    if (isStudent && TA) {
      return '<span class="tkg-avatar tkg-avatar--img is-student" aria-hidden="true">' + TA.studentAvatarSvg(name) + '</span>';
    }
    if (!isStudent && clan && typeof clan === 'object') {
      return renderClanAvatar(clan);
    }
    if (!isStudent && clan) {
      return renderClanAvatar({ name: name, emoji: clan });
    }
    return '<span class="tkg-avatar is-' + (isStudent ? 'student' : 'clan') + '" aria-hidden="true">' + escapeHtml(clanInitial(name)) + '</span>';
  }

  function bindCardClick(card, go) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('[data-card-action]')) return;
      go();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('[data-card-action]')) return;
        e.preventDefault();
        go();
      }
    });
  }

  function bindDetailBtn(card, go) {
    var btn = card.querySelector('[data-card-action="detail"]');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      go();
    });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        go();
      }
    });
  }

  function goBackOneLevel() {
    if (els.drawer && els.drawer.classList.contains('is-open')) {
      setDrawer(false);
      return;
    }
    if (state.view !== 'list') window.history.back();
  }

  function bindEls() {
    els.main = $('thwMain');
    els.title = $('thwPageTitle');
    els.subtitle = $('thwPageSubtitle');
    els.tabs = $('thwTabs');
    els.breadcrumb = $('thwBreadcrumb');
    els.content = $('thwContent');
    els.loading = $('thwLoading');
    els.error = $('thwError');
    els.empty = $('thwEmpty');
    els.contextPanel = $('thwContextPanel');
    els.homeworkClanAside = $('thwHomeworkClanAside');
    els.toolbar = $('thwToolbar');
    els.drawer = $('thwDrawer');
    els.drawerOverlay = $('thwDrawerOverlay');
    els.drawerClose = $('thwDrawerClose');
    els.drawerBody = $('thwDrawerBody');
    els.eduBarDesc = $('thwEduBarDesc');
    els.eduBarDescText = $('thwEduBarDescText');
    els.eduNav = $('thwEduNav');
    els.eduEyebrow = $('thwEduEyebrow');
    els.eduRange = $('thwEduRange');
    els.eduPrev = $('thwEduPrev');
    els.eduNext = $('thwEduNext');
    els.eduCalBtn = $('thwEduCalBtn');
    els.eduPicker = $('thwEduPicker');
    els.eduPickerList = $('thwEduPickerList');
  }

  function updateEduBar() {
    if (!weekApi) return;
    if (els.eduEyebrow) els.eduEyebrow.textContent = weekApi.formatEduWeekLabel(state.selectedEduWeek);
    if (els.eduRange) els.eduRange.textContent = weekApi.formatEduWeekRange(state.selectedEduWeek);
    if (els.eduPrev) els.eduPrev.disabled = state.selectedEduWeek <= weekApi.MIN_EDU_WEEK;
    if (els.eduNext) els.eduNext.disabled = state.selectedEduWeek >= weekApi.MAX_EDU_WEEK;
    if (els.eduBarDescText) {
      els.eduBarDescText.innerHTML = 'Bu bölümde gördüğünüz ödev verileri, seçtiğiniz <strong>' +
        escapeHtml(weekApi.formatEduWeekLabel(state.selectedEduWeek)) + '</strong> (' +
        escapeHtml(weekApi.formatEduWeekRange(state.selectedEduWeek)) + ') tarihleri arasındaki ödevlere aittir.';
    }
  }

  function ensureHomeworkDates(hw) {
    if (!hw) return hw;
    if (api.withAssignedDate) return api.withAssignedDate(hw);
    return hw;
  }

  function resolveHomeworkDates(hw, student) {
    hw = hw || {};
    return {
      assigned: (student && student.assignedDate) || hw.assignedDate || null,
      due: (student && student.dueDate) || hw.dueDate || null
    };
  }

  var SVG_CALENDAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  function renderHomeworkDateParts(dates) {
    var assignedPart = dates.assigned
      ? '<span class="thw-hw-card-date"><span class="thw-hw-card-date-label">Veriliş</span><strong>' + escapeHtml(formatDate(dates.assigned)) + '</strong></span>'
      : '';
    var duePart = dates.due
      ? '<span class="thw-hw-card-date is-due"><span class="thw-hw-card-date-label">Teslim</span><strong>' + escapeHtml(formatDate(dates.due)) + '</strong></span>'
      : '';
    return assignedPart + duePart;
  }

  function renderHomeworkDatesHtml(hw, student, variant) {
    variant = variant || 'card';
    var dates = resolveHomeworkDates(hw, student);
    if (!dates.assigned && !dates.due) return '';
    var parts = renderHomeworkDateParts(dates);
    if (variant === 'compact') {
      return '<div class="thw-hw-dates is-compact">' +
        '<span class="thw-hw-card-date-ico" aria-hidden="true">' + SVG_CALENDAR + '</span>' +
        '<div class="thw-hw-card-date-group">' + parts + '</div>' +
      '</div>';
    }
    if (variant === 'drawer') {
      return '<div class="thw-drawer-dates">' + parts + '</div>';
    }
    if (variant === 'drawer-card') {
      return '<div class="thw-hw-card-dates is-drawer-card">' +
        '<span class="thw-hw-card-date-ico" aria-hidden="true">' + SVG_CALENDAR + '</span>' +
        '<div class="thw-hw-card-date-group">' + parts + '</div>' +
      '</div>';
    }
    return '<div class="thw-hw-card-dates">' +
      '<span class="thw-hw-card-date-ico" aria-hidden="true">' + SVG_CALENDAR + '</span>' +
      '<div class="thw-hw-card-date-group">' + parts + '</div>' +
    '</div>';
  }

  function renderHomeworkCardDates(hw) {
    return renderHomeworkDatesHtml(ensureHomeworkDates(hw), null, 'card');
  }

  function updateHomeworkClanAside() {
    if (!els.homeworkClanAside) return;
    var show = state.view === 'students' && !isBirebirTab() && state.selectedClan;
    els.homeworkClanAside.hidden = !show;
    if (!show) {
      els.homeworkClanAside.innerHTML = '';
      return;
    }
    var clan = state.selectedClan;
    els.homeworkClanAside.innerHTML =
      '<div class="thw-homework-clan-card">' +
        renderClanAvatar(clan) +
        '<div class="thw-homework-clan-meta">' +
          '<span class="thw-homework-clan-label">Klan</span>' +
          '<strong class="thw-homework-clan-name">' + escapeHtml(clan.name) + '</strong>' +
          '<span class="thw-homework-clan-detail">' + escapeHtml(clan.gradeLevel) + '</span>' +
        '</div>' +
      '</div>';
  }

  function updateContextPanel() {
    var inDetail = state.view !== 'list';
    var isHomeworkStudents = state.view === 'students';
    if (els.contextPanel) {
      els.contextPanel.classList.toggle('is-detail', inDetail);
      els.contextPanel.classList.toggle('is-homework-students', isHomeworkStudents);
    }
    if (els.eduBarDesc) els.eduBarDesc.hidden = inDetail;
    if (els.toolbar) els.toolbar.hidden = isHomeworkStudents;
    if (isHomeworkStudents) closeEduWeekPicker();
    updateHomeworkClanAside();
  }

  function updateToolbar() {
    if (els.toolbar) els.toolbar.classList.toggle('is-detail', state.view !== 'list');
    updateTabs();
    updateEduBar();
    updateContextPanel();
  }

  function reloadForEduWeek() {
    if (els.drawer && els.drawer.classList.contains('is-open')) setDrawer(false);
    if (state.view === 'students' && state.selectedHomework) {
      var ctx = isBirebirTab() ? state.selectedBirebirStudent : state.selectedClan;
      if (!ctx) return navigate('list', null, null, 'replace');
      return navigate('students', ctx, state.selectedHomework, 'replace');
    }
    if (state.view === 'homeworks') {
      var ctxHw = isBirebirTab() ? state.selectedBirebirStudent : state.selectedClan;
      if (!ctxHw) return navigate('list', null, null, 'replace');
      return navigate('homeworks', ctxHw, null, 'replace');
    }
    return navigate('list', null, null, 'replace');
  }

  function renderEduWeekPicker() {
    if (!els.eduPickerList || !weekApi) return;
    var html = '';
    for (var w = weekApi.MIN_EDU_WEEK; w <= weekApi.MAX_EDU_WEEK; w++) {
      var activeCls = w === state.selectedEduWeek ? ' is-active' : '';
      var count = api.countHomeworksForEduWeek ? api.countHomeworksForEduWeek(w) : 0;
      var countLabel = count ? count + ' ödev' : 'Ödev yok';
      html += '<button type="button" class="td-week-edu-picker-item' + activeCls + '" data-week="' + w + '">' +
        '<strong>' + escapeHtml(weekApi.formatEduWeekLabel(w)) + '</strong>' +
        '<span>' + escapeHtml(weekApi.formatEduWeekRange(w) + ' · ' + countLabel) + '</span>' +
        '</button>';
    }
    els.eduPickerList.innerHTML = html;
  }

  function closeEduWeekPicker() {
    if (els.eduPicker) els.eduPicker.hidden = true;
    if (els.eduCalBtn) {
      els.eduCalBtn.classList.remove('is-open');
      els.eduCalBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function openEduWeekPicker() {
    renderEduWeekPicker();
    if (els.eduPicker) els.eduPicker.hidden = false;
    if (els.eduCalBtn) {
      els.eduCalBtn.classList.add('is-open');
      els.eduCalBtn.setAttribute('aria-expanded', 'true');
    }
  }

  function selectEduWeek(weekNum) {
    var w = parseInt(weekNum, 10);
    if (!weekApi || !w || w < weekApi.MIN_EDU_WEEK || w > weekApi.MAX_EDU_WEEK || w === state.selectedEduWeek) return;
    closeEduWeekPicker();
    state.selectedEduWeek = w;
    updateEduBar();
    reloadForEduWeek();
  }

  function shiftEduWeek(delta) {
    if (!state.selectedEduWeek) return;
    selectEduWeek(state.selectedEduWeek + delta);
  }

  function initEduWeekNav() {
    if (!els.eduNav || els.eduNav.getAttribute('data-week-nav-ready')) return;
    els.eduNav.setAttribute('data-week-nav-ready', '1');
    updateEduBar();

    if (els.eduPrev) {
      els.eduPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        shiftEduWeek(-1);
      });
    }
    if (els.eduNext) {
      els.eduNext.addEventListener('click', function (e) {
        e.stopPropagation();
        shiftEduWeek(1);
      });
    }
    if (els.eduCalBtn) {
      els.eduCalBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!els.eduPicker) return;
        if (els.eduPicker.hidden) openEduWeekPicker();
        else closeEduWeekPicker();
      });
    }
    if (els.eduPickerList) {
      els.eduPickerList.addEventListener('click', function (e) {
        var item = e.target.closest('[data-week]');
        if (!item) return;
        selectEduWeek(item.getAttribute('data-week'));
      });
    }
    document.addEventListener('click', function (e) {
      if (!els.eduPicker || els.eduPicker.hidden) return;
      if (els.eduNav && els.eduNav.contains(e.target)) return;
      closeEduWeekPicker();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeEduWeekPicker();
    });
  }

  function updateHead() {
    var head = els.title ? els.title.closest('.thw-page-head') : null;
    var inDetail = state.view !== 'list';
    if (head) head.hidden = false;

    if (state.view === 'homeworks') {
      var ctxHw = isBirebirTab() ? state.selectedBirebirStudent : state.selectedClan;
      if (els.title) {
        if (isBirebirTab() && ctxHw) {
          els.title.innerHTML = renderStudentNameHead(ctxHw.name);
          els.title.classList.add('is-with-avatar');
        } else if (ctxHw) {
          els.title.innerHTML = renderClanNameHead(ctxHw);
          els.title.classList.add('is-with-avatar');
        } else {
          els.title.textContent = 'Ödevler';
          els.title.classList.remove('is-with-avatar');
        }
      }
      if (els.subtitle) {
        els.subtitle.textContent = isBirebirTab()
          ? 'Öğrenciye atanan ödevleri inceleyin ve eksik teslimleri kontrol edin.'
          : 'Klana atanan ödevleri inceleyin ve eksik teslimleri kontrol edin.';
      }
      return;
    }

    if (state.view === 'students' && state.selectedHomework) {
      var hwStudents = ensureHomeworkDates(state.selectedHomework);
      if (els.title) {
        els.title.textContent = hwStudents.title;
        els.title.classList.remove('is-with-avatar');
      }
      if (els.subtitle) {
        var datesHtml = renderHomeworkDatesHtml(hwStudents, null, 'compact');
        els.subtitle.innerHTML =
          (datesHtml ? datesHtml : '') +
          '<span class="thw-page-subtitle-desc">Ödeve kayıtlı tüm öğrencileri görüntüleyin; tamamlayan, devam eden ve tamamlamayan öğrencileri filtreleyin.</span>';
      }
      return;
    }

    if (inDetail) return;

    if (isBirebirTab()) {
      if (els.title) els.title.textContent = 'Birebir Öğrenciler';
      if (els.subtitle) els.subtitle.textContent = 'Birebir ders verdiğiniz öğrencilerin ödev durumlarını ve eksik teslimleri takip edin.';
    } else {
      if (els.title) els.title.textContent = 'Klanlarım';
      if (els.subtitle) els.subtitle.textContent = 'Matematik dersi verdiğiniz klanların ödev durumlarını ve eksik teslimleri takip edin.';
    }
  }

  function updateTabs() {
    if (!els.tabs) return;
    var inDetail = state.view !== 'list';
    els.tabs.hidden = inDetail;
    if (inDetail) return;
    els.tabs.querySelectorAll('[data-thw-tab]').forEach(function (btn) {
      var active = btn.getAttribute('data-thw-tab') === state.tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderBreadcrumb() {
    if (!els.breadcrumb) return;
    if (state.view === 'list') {
      els.breadcrumb.innerHTML = '';
      els.breadcrumb.hidden = true;
      return;
    }
    var label = state.view === 'students' ? studentsBackLabel() : homeworksBackLabel();
    els.breadcrumb.innerHTML = '<button type="button" class="tkg-back" data-nav="back">' + escapeHtml(label) + '</button>';
    els.breadcrumb.hidden = false;
    var backBtn = els.breadcrumb.querySelector('[data-nav="back"]');
    if (backBtn) backBtn.addEventListener('click', goBackOneLevel);
  }

  function studentSubmissionStatus(student) {
    if (student.status === 'completed') return 'completed';
    if (!student.progress || student.progress.completedQuestions === 0) return 'not_completed';
    return 'in_progress';
  }

  function studentSubmissionLabel(status) {
    if (status === 'completed') return 'Tamamlayan';
    if (status === 'in_progress') return 'Devam Eden';
    return 'Tamamlamayan';
  }

  function studentSubmissionCls(status) {
    if (status === 'completed') return 'is-done';
    if (status === 'in_progress') return 'is-progress';
    return 'is-missing';
  }

  function getFilteredStudents() {
    if (state.studentFilter === 'all') return state.students;
    return state.students.filter(function (s) {
      return studentSubmissionStatus(s) === state.studentFilter;
    });
  }

  function renderStudentFilters() {
    var filters = [
      { id: 'all', label: 'Tümü' },
      { id: 'completed', label: 'Tamamlayan' },
      { id: 'in_progress', label: 'Devam Eden' },
      { id: 'not_completed', label: 'Tamamlamayan' }
    ];
    return (
      '<div class="thw-student-filters" id="thwStudentFilters" role="tablist" aria-label="Öğrenci durumu filtresi">' +
        filters.map(function (f) {
          var active = state.studentFilter === f.id ? ' is-active' : '';
          return '<button type="button" class="thw-student-filter' + active + '" data-student-filter="' + f.id + '" role="tab" aria-selected="' + (active ? 'true' : 'false') + '">' + escapeHtml(f.label) + '</button>';
        }).join('') +
      '</div>'
    );
  }

  function bindStudentFilters() {
    if (!els.content) return;
    var wrap = els.content.querySelector('#thwStudentFilters');
    if (!wrap) return;
    wrap.querySelectorAll('[data-student-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.studentFilter = btn.getAttribute('data-student-filter');
        render();
      });
    });
  }

  function homeworkCompletionStatus(hw) {
    return hw.missingStudents > 0 ? 'not_completed' : 'completed';
  }

  function getFilteredHomeworks() {
    if (!isBirebirTab() || state.homeworkFilter === 'all') return state.homeworks;
    return state.homeworks.filter(function (hw) {
      return homeworkCompletionStatus(hw) === state.homeworkFilter;
    });
  }

  function renderHomeworkFilters() {
    if (!isBirebirTab()) return '';
    var filters = [
      { id: 'all', label: 'Tümü' },
      { id: 'completed', label: 'Tamamlanan' },
      { id: 'not_completed', label: 'Tamamlanmayan' }
    ];
    return (
      '<div class="thw-student-filters thw-homework-filters" id="thwHomeworkFilters" role="tablist" aria-label="Ödev durumu filtresi">' +
        filters.map(function (f) {
          var active = state.homeworkFilter === f.id ? ' is-active' : '';
          return '<button type="button" class="thw-student-filter' + active + '" data-homework-filter="' + f.id + '" role="tab" aria-selected="' + (active ? 'true' : 'false') + '">' + escapeHtml(f.label) + '</button>';
        }).join('') +
      '</div>'
    );
  }

  function bindHomeworkFilters() {
    if (!els.content) return;
    var wrap = els.content.querySelector('#thwHomeworkFilters');
    if (!wrap) return;
    wrap.querySelectorAll('[data-homework-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.homeworkFilter = btn.getAttribute('data-homework-filter');
        render();
      });
    });
  }

  function renderClanCards() {
    return state.clans.map(function (clan) {
      var dueHint = clan.nearestDueDate
        ? '<span class="tkg-card-hint">Yaklaşan teslim: ' + escapeHtml(formatDate(clan.nearestDueDate)) + '</span>'
        : '';
      return (
        '<article class="tkg-card tkg-card-clan is-clickable" data-clan-id="' + escapeHtml(clan.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(clan.name) + ' ödevlerini görüntüle">' +
          '<div class="tkg-card-top">' +
            renderClanAvatar(clan) +
            '<div class="tkg-card-intro">' +
              '<span class="tkg-card-badge is-klan">Klan Dersi</span>' +
              '<h2 class="tkg-card-title">' + escapeHtml(clan.name) + '</h2>' +
              '<span class="tkg-card-meta">' + escapeHtml(clan.gradeLevel) + ' · ' + escapeHtml(clan.educationWeek) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="tkg-card-body">' +
            '<span class="tkg-card-stat">Atanan ödev: <strong>' + clan.homeworkStats.totalAssignments + '</strong></span>' +
            '<span class="tkg-card-stat is-warn">Eksik teslim: <strong>' + clan.homeworkStats.missingSubmissionCount + '</strong> öğrenci</span>' +
            dueHint +
          '</div>' +
          renderDetailBtn('Detaylı incele') +
        '</article>'
      );
    }).join('');
  }

  function renderBirebirStudentCards() {
    return state.birebirStudents.map(function (student) {
      var dueHint = student.nearestDueDate
        ? '<span class="tkg-card-hint">Yaklaşan teslim: ' + escapeHtml(formatDate(student.nearestDueDate)) + '</span>'
        : '';
      return (
        '<article class="tkg-card tkg-card-student is-clickable" data-birebir-id="' + escapeHtml(student.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(student.name) + ' ödevlerini görüntüle">' +
          '<div class="tkg-card-top">' +
            renderAvatar(student.name, true) +
            '<div class="tkg-card-intro">' +
              '<span class="tkg-card-badge is-birebir">Birebir Ders</span>' +
              '<h2 class="tkg-card-title">' + escapeHtml(student.name) + '</h2>' +
              '<span class="tkg-card-meta">' + escapeHtml(student.gradeLevel) + ' · ' + escapeHtml(student.educationWeek) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="tkg-card-body">' +
            '<span class="tkg-card-stat">Atanan ödev: <strong>' + student.homeworkStats.totalAssignments + '</strong></span>' +
            '<span class="tkg-card-stat is-warn">Eksik teslim: <strong>' + student.homeworkStats.missingSubmissionCount + '</strong></span>' +
            dueHint +
          '</div>' +
          renderDetailBtn('Detaylı incele') +
        '</article>'
      );
    }).join('');
  }

  function renderHomeworkCards() {
    var filtered = getFilteredHomeworks();
    var filtersHtml = isBirebirTab() ? renderHomeworkFilters() : '';
    if (!filtered.length) {
      var emptyMsg = state.homeworks.length
        ? 'Seçili filtreye uygun ödev bulunmuyor.'
        : 'Bu öğrenciye atanmış ödev bulunmuyor.';
      return filtersHtml + '<p class="thw-student-filter-empty">' + escapeHtml(emptyMsg) + '</p>';
    }
    var cards = filtered.map(function (hw) {
      var statusLabel = hw.missingStudents > 0 ? 'Eksik var' : 'Tamamlandı';
      var statusCls = hw.missingStudents > 0 ? 'is-warn' : 'is-ok';
      var typeBadge = homeworkTypeLabel(hw)
        ? '<span class="tkg-card-badge ' + homeworkTypeBadgeCls(hw) + '">' + escapeHtml(homeworkTypeLabel(hw)) + '</span>'
        : '';
      var statsLine = isBirebirTab()
        ? '<span class="tkg-card-stat">Durum: <strong>' + escapeHtml(hw.missingStudents > 0 ? 'Tamamlanmadı' : 'Tamamlandı') + '</strong></span>'
        : '<span class="tkg-card-stat">Toplam: <strong>' + hw.totalStudents + '</strong> · Tamamlayan: <strong>' + hw.completedStudents + '</strong> · Yapmayan: <strong>' + hw.missingStudents + '</strong></span>';
      return (
        '<article class="tkg-card tkg-card-hw is-clickable" data-homework-id="' + escapeHtml(hw.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(hw.title) + ' detayını görüntüle">' +
          '<div class="tkg-card-intro">' +
            typeBadge +
            '<h2 class="tkg-card-title">' + escapeHtml(hw.title) + '</h2>' +
            '<span class="tkg-card-meta">' + escapeHtml(hw.lessonName) + '</span>' +
            renderHomeworkCardDates(hw) +
          '</div>' +
          '<div class="tkg-card-body">' +
            statsLine +
            '<span class="tkg-card-badge ' + statusCls + '">' + statusLabel + '</span>' +
          '</div>' +
          renderDetailBtn('Detaylı incele') +
        '</article>'
      );
    }).join('');
    return filtersHtml + '<div class="tkg-grid">' + cards + '</div>';
  }

  function renderStudentCards() {
    var hw = state.selectedHomework;
    var filtered = getFilteredStudents();
    var header = hw ? renderStudentFilters() : '';
    if (!filtered.length) {
      var emptyMsg = state.students.length
        ? 'Seçili filtreye uygun öğrenci bulunmuyor.'
        : 'Bu ödeve kayıtlı öğrenci bulunmuyor.';
      return header + '<p class="thw-student-filter-empty">' + escapeHtml(emptyMsg) + '</p>';
    }
    var cards = filtered.map(function (s) {
      var subStatus = studentSubmissionStatus(s);
      var statusLabel = studentSubmissionLabel(subStatus);
      var statusCls = studentSubmissionCls(subStatus);
      return (
        '<article class="tkg-card tkg-card-student is-clickable" data-student-id="' + escapeHtml(s.id) + '" role="button" tabindex="0" aria-label="' + escapeHtml(s.fullName) + ' ödev detayını görüntüle">' +
          '<div class="tkg-card-top">' +
            renderAvatar(s.fullName, true) +
            '<div class="tkg-card-intro">' +
              '<span class="tkg-card-badge ' + statusCls + '">' + escapeHtml(statusLabel) + '</span>' +
              '<h2 class="tkg-card-title">' + escapeHtml(s.fullName) + '</h2>' +
              '<span class="tkg-card-meta">' + escapeHtml(s.gradeLevel) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="tkg-card-body">' +
            '<span class="tkg-card-stat">Soru ilerlemesi: <strong>' + s.progress.completedQuestions + ' / ' + s.progress.totalQuestions + '</strong></span>' +
            '<span class="tkg-card-stat">Durum: <strong>' + escapeHtml(statusLabel) + '</strong></span>' +
          '</div>' +
          renderDetailBtn('Detaylı incele') +
        '</article>'
      );
    }).join('');
    return header + '<div class="tkg-grid">' + cards + '</div>';
  }

  function openHomework(hw) {
    var context = isBirebirTab() ? state.selectedBirebirStudent : state.selectedClan;
    if (!hw || !context) return;
    if (isBirebirTab()) {
      openBirebirHomework(hw, { historyMode: 'push' });
      return;
    }
    navigate('students', context, hw);
  }

  function openBirebirHomework(hw, opts) {
    opts = opts || {};
    var student = state.selectedBirebirStudent;
    if (!hw || !student) return Promise.resolve();
    state.selectedHomework = ensureHomeworkDates(hw);
    var loadStudents = api.getHomeworkStudents
      ? api.getHomeworkStudents.bind(api)
      : api.getMissingStudents.bind(api);
    return loadStudents(hw.id).then(function (list) {
      var hwStudent = list[0];
      if (!hwStudent) return;
      state.birebirDrawerOpen = true;
      openStudentDrawer(hwStudent, hw);
      if (opts.historyMode === 'push') syncUrl('push');
      else if (opts.historyMode === 'replace') syncUrl('replace');
    });
  }

  function openHomeworkSummaryDrawer(hw, context) {
    if (!els.drawerBody || !hw || !context) return;
    hw = ensureHomeworkDates(hw);
    applyDrawerTheme(hw);
    var hwTitle = hw.title || '—';
    els.drawerBody.innerHTML =
      '<div class="d3-drawer-head">' +
        '<span class="d3-drawer-icon" aria-hidden="true">' + drawerHeadIcon(hw) + '</span>' +
        '<div class="d3-drawer-meta">' +
          '<span class="d3-drawer-eyebrow">ÖDEV KONTROL · ÖZET</span>' +
          '<h2 class="d3-drawer-title">' + escapeHtml(hwTitle) + '</h2>' +
          renderHomeworkDatesHtml(hw, null, 'drawer') +
          '<span class="thw-drawer-status-chip is-done">Tüm öğrenciler tamamladı</span>' +
        '</div>' +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">Klan</span>' +
        '<div class="d3-drawer-quote">' +
          '<div class="d3-drawer-quote-header">' +
            clanAvatarHtml(context) +
            '<div class="d3-drawer-quote-meta">' +
              '<span class="d3-drawer-quote-name">' + escapeHtml(context.name) + '</span>' +
              '<span class="d3-drawer-quote-role">' + escapeHtml(context.gradeLevel) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">Ödev Bilgisi</span>' +
        '<div class="thw-drawer-hw-card is-complete">' +
          '<div class="thw-drawer-hw-card-top">' +
            homeworkTypeBadgeHtml(hw) +
            '<span class="thw-drawer-hw-chip is-done">Tamamlandı</span>' +
          '</div>' +
          '<h3 class="thw-drawer-hw-title">' + escapeHtml(hwTitle) + '</h3>' +
          '<p class="thw-drawer-hw-topic">' + escapeHtml(hw.lessonTopic || '—') + '</p>' +
          '<span class="thw-drawer-hw-lesson">' + escapeHtml(hw.lessonName || '—') + '</span>' +
          renderHomeworkDatesHtml(hw, null, 'drawer-card') +
        '</div>' +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">Teslim Özeti</span>' +
        '<div class="thw-drawer-stat-grid is-3">' +
          renderDrawerStat('is-total', SVG_USERS, hw.totalStudents, 'Toplam öğrenci') +
          renderDrawerStat('is-done', SVG_CHECK, hw.completedStudents, 'Tamamlayan') +
          renderDrawerStat('is-negative', SVG_REMAINING, hw.missingStudents, 'Eksik') +
        '</div>' +
      '</div>';
    setDrawer(true);
  }

  function openStudentDrawer(student, homeworkOverride) {
    var hw = ensureHomeworkDates(homeworkOverride || state.selectedHomework);
    var context = isBirebirTab() ? state.selectedBirebirStudent : state.selectedClan;
    if (!els.drawerBody || !student) return;
    applyDrawerTheme(hw);

    var hwTitle = student.homeworkTitle || (hw && hw.title) || '—';
    var contextLabel = isBirebirTab() ? 'Birebir Ders Öğrencisi' : (context ? context.name : '—');
    var contextRole = student.gradeLevel + (isBirebirTab() ? '' : (context ? ' · ' + context.name : ''));
    var status = studentStatusMeta(student, hw);
    var progress = student.progress || { completedQuestions: 0, totalQuestions: 0, remainingQuestions: 0 };
    var alertBlock = status.cls !== 'is-done'
      ? '<div class="thw-drawer-alert" role="status">' +
          '<span class="thw-drawer-alert-ico" aria-hidden="true">' + SVG_ALERT + '</span>' +
          '<p class="thw-drawer-alert-text">' +
            escapeHtml(student.note || ('Öğrenci ödevi henüz tamamlamadı. ' + progress.remainingQuestions + ' soru kaldı.')) +
          '</p>' +
        '</div>'
      : '';

    var lastActivityBlock = student.lastActivityAt
      ? '<div class="d3-drawer-section">' +
          '<span class="d3-drawer-label">Son Aktivite</span>' +
          '<div class="thw-drawer-info-row">' +
            '<span class="thw-drawer-info-ico is-clock" aria-hidden="true">' + SVG_CLOCK + '</span>' +
            '<span class="thw-drawer-info-text">' + escapeHtml(formatDateTime(student.lastActivityAt)) + '</span>' +
          '</div>' +
        '</div>'
      : '';

    els.drawerBody.innerHTML =
      '<div class="d3-drawer-head">' +
        '<span class="d3-drawer-icon" aria-hidden="true">' + drawerHeadIcon(hw) + '</span>' +
        '<div class="d3-drawer-meta">' +
          '<span class="d3-drawer-eyebrow">ÖDEV KONTROL · ÖĞRENCİ</span>' +
          '<h2 class="d3-drawer-title is-with-avatar">' + renderStudentNameHead(student.fullName, 'thw-name-head--drawer') + '</h2>' +
          renderHomeworkDatesHtml(hw, student, 'drawer') +
          '<span class="thw-drawer-status-chip ' + status.cls + '">' + escapeHtml(status.label) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">Öğrenci</span>' +
        '<div class="d3-drawer-quote">' +
          '<div class="d3-drawer-quote-header">' +
            studentAvatarHtml(student.fullName) +
            '<div class="d3-drawer-quote-meta">' +
              '<span class="d3-drawer-quote-name">' + escapeHtml(student.fullName) + '</span>' +
              '<span class="d3-drawer-quote-role">' + escapeHtml(contextRole) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">' + (isBirebirTab() ? 'Öğrenci Türü' : 'Klan') + '</span>' +
        (isBirebirTab()
          ? '<div class="thw-drawer-info-row">' +
              '<span class="thw-drawer-info-ico is-context" aria-hidden="true">' + SVG_CHECK + '</span>' +
              '<span class="thw-drawer-info-text">' + escapeHtml(contextLabel) + '</span>' +
            '</div>'
          : '<div class="d3-drawer-quote">' +
              '<div class="d3-drawer-quote-header">' +
                clanAvatarHtml(context) +
                '<div class="d3-drawer-quote-meta">' +
                  '<span class="d3-drawer-quote-name">' + escapeHtml(context ? context.name : '—') + '</span>' +
                  '<span class="d3-drawer-quote-role">' + escapeHtml(context ? context.gradeLevel : '') + '</span>' +
                '</div>' +
              '</div>' +
            '</div>') +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">Ödev Bilgisi</span>' +
        '<div class="thw-drawer-hw-card ' + status.cls + '">' +
          '<div class="thw-drawer-hw-card-top">' +
            homeworkTypeBadgeHtml(hw) +
            '<span class="thw-drawer-hw-chip ' + status.cls + '">' + escapeHtml(status.label) + '</span>' +
          '</div>' +
          '<h3 class="thw-drawer-hw-title">' + escapeHtml(hwTitle) + '</h3>' +
          '<p class="thw-drawer-hw-topic">' + escapeHtml(student.lessonTopic || (hw && hw.lessonTopic) || '—') + '</p>' +
          '<span class="thw-drawer-hw-lesson">' + escapeHtml(student.lessonName || (hw && hw.lessonName) || '—') + '</span>' +
          renderHomeworkDatesHtml(hw, student, 'drawer-card') +
        '</div>' +
      '</div>' +
      '<div class="d3-drawer-section">' +
        '<span class="d3-drawer-label">İlerleme</span>' +
        renderDrawerProgress(progress, status.cls === 'is-done') +
        '<div class="thw-drawer-stat-grid is-3">' +
          renderDrawerStat('is-done', SVG_CHECK, progress.completedQuestions, 'Tamamlanan') +
          renderDrawerStat('is-remaining', SVG_REMAINING, progress.remainingQuestions, 'Kalan soru') +
          renderDrawerStat('is-total', SVG_TOTAL, progress.totalQuestions, 'Toplam soru') +
        '</div>' +
      '</div>' +
      alertBlock +
      lastActivityBlock;
    setDrawer(true);
  }

  function bindContentEvents() {
    if (!els.content) return;
    els.content.querySelectorAll('[data-clan-id]').forEach(function (card) {
      var go = function () {
        var id = card.getAttribute('data-clan-id');
        var clan = state.clans.find(function (c) { return c.id === id; });
        if (clan) navigate('homeworks', clan);
      };
      bindCardClick(card, go);
      bindDetailBtn(card, go);
    });
    els.content.querySelectorAll('[data-birebir-id]').forEach(function (card) {
      var go = function () {
        var id = card.getAttribute('data-birebir-id');
        var student = state.birebirStudents.find(function (s) { return s.id === id; });
        if (student) navigate('homeworks', student);
      };
      bindCardClick(card, go);
      bindDetailBtn(card, go);
    });
    els.content.querySelectorAll('[data-homework-id]').forEach(function (card) {
      var go = function () {
        var id = card.getAttribute('data-homework-id');
        var hw = state.homeworks.find(function (h) { return h.id === id; });
        if (hw) openHomework(hw);
      };
      bindCardClick(card, go);
      bindDetailBtn(card, go);
    });
    els.content.querySelectorAll('[data-student-id]').forEach(function (card) {
      var go = function () {
        var id = card.getAttribute('data-student-id');
        var student = state.students.find(function (s) { return s.id === id; });
        if (student) openStudentDrawer(student);
      };
      bindCardClick(card, go);
      bindDetailBtn(card, go);
    });
  }

  function render() {
    updateHead();
    updateToolbar();
    renderBreadcrumb();

    if (els.loading) els.loading.hidden = state.status !== 'loading';
    if (els.error) els.error.hidden = state.status !== 'error';
    if (els.empty) els.empty.hidden = state.status !== 'empty';
    if (els.content) els.content.hidden = state.status !== 'ready';

    if (state.status !== 'ready' || !els.content) return;

    if (state.view === 'list') {
      var html = isBirebirTab()
        ? renderBirebirStudentCards()
        : renderClanCards();
      els.content.innerHTML = '<div class="tkg-grid">' + html + '</div>';
    } else if (state.view === 'homeworks') {
      els.content.innerHTML = renderHomeworkCards();
      bindHomeworkFilters();
    } else if (state.view === 'students') {
      els.content.innerHTML = renderStudentCards();
      bindStudentFilters();
    }
    bindContentEvents();
  }

  function navigate(view, entity, homework, historyMode) {
    var prevView = state.view;
    state.view = view;
    state.status = 'loading';
    render();

    function finishHistory() {
      if (historyMode === 'back') {
        syncUrl('replace');
        return;
      }
      if (historyMode === 'replace') {
        syncUrl('replace');
        return;
      }
      var depth = { list: 0, homeworks: 1, students: 2 };
      if (depth[view] > depth[prevView]) syncUrl('push');
      else syncUrl('replace');
    }

    if (view === 'list') {
      state.selectedClan = null;
      state.selectedBirebirStudent = null;
      state.selectedHomework = null;
      state.birebirDrawerOpen = false;
      if (els.empty) {
        els.empty.textContent = isBirebirTab()
          ? 'Birebir ders verdiğiniz öğrenci bulunmuyor.'
          : 'Ders verdiğiniz klan bulunmuyor.';
      }
      if (isBirebirTab()) {
        return api.getBirebirStudents(apiOpts()).then(function (students) {
          state.birebirStudents = students;
          state.status = students.length ? 'ready' : 'empty';
          finishHistory();
          render();
        }).catch(function () { state.status = 'error'; render(); });
      }
      return api.getClans(apiOpts()).then(function (clans) {
        state.clans = clans;
        state.status = clans.length ? 'ready' : 'empty';
        finishHistory();
        render();
      }).catch(function () { state.status = 'error'; render(); });
    }

    if (view === 'homeworks' && entity) {
      state.selectedHomework = null;
      state.birebirDrawerOpen = false;
      state.homeworkFilter = 'all';
      if (isBirebirTab()) {
        state.selectedBirebirStudent = entity;
        state.selectedClan = null;
        return api.getBirebirHomeworks(entity.id, apiOpts()).then(function (list) {
          state.homeworks = list;
          state.status = list.length ? 'ready' : 'empty';
          if (!list.length && els.empty) els.empty.textContent = 'Bu öğrenciye atanmış ödev bulunmuyor.';
          finishHistory();
          render();
        }).catch(function () { state.status = 'error'; render(); });
      }
      state.selectedClan = entity;
      state.selectedBirebirStudent = null;
      return api.getHomeworks(entity.id, apiOpts()).then(function (list) {
        state.homeworks = list;
        state.status = list.length ? 'ready' : 'empty';
        if (!list.length && els.empty) els.empty.textContent = 'Bu klana atanmış ödev bulunmuyor.';
        finishHistory();
        render();
      }).catch(function () { state.status = 'error'; render(); });
    }

    if (view === 'students' && homework) {
      var prevHomeworkId = state.selectedHomework ? state.selectedHomework.id : null;
      state.selectedHomework = ensureHomeworkDates(homework);
      if (homework.id !== prevHomeworkId) state.studentFilter = 'all';
      if (entity) {
        if (isBirebirTab()) {
          state.selectedBirebirStudent = entity;
          state.selectedClan = null;
        } else {
          state.selectedClan = entity;
          state.selectedBirebirStudent = null;
        }
      }
      var loadStudents = api.getHomeworkStudents
        ? api.getHomeworkStudents.bind(api)
        : api.getMissingStudents.bind(api);
      return loadStudents(homework.id).then(function (list) {
        state.students = list;
        state.status = list.length ? 'ready' : 'empty';
        if (!list.length && els.empty) els.empty.textContent = 'Bu ödeve kayıtlı öğrenci bulunmuyor.';
        finishHistory();
        render();
      }).catch(function () { state.status = 'error'; render(); });
    }

    return Promise.resolve();
  }

  function switchTab(tab) {
    state.tab = tab;
    state.view = 'list';
    state.selectedClan = null;
    state.selectedBirebirStudent = null;
    state.selectedHomework = null;
    state.studentFilter = 'all';
    state.homeworkFilter = 'all';
    state.birebirDrawerOpen = false;
    clearRouteParams();
    syncUrl('replace');
    navigate('list', null, null, 'replace');
  }

  function initTabs() {
    if (!els.tabs) return;
    els.tabs.querySelectorAll('[data-thw-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.getAttribute('data-thw-tab'));
      });
    });
  }

  function load() {
    state.status = 'loading';
    if (!hasDeepRoute()) state.view = 'list';
    render();
    return Promise.all([api.getClans(apiOpts()), api.getBirebirStudents(apiOpts())]).then(function (res) {
      state.clans = res[0];
      state.birebirStudents = res[1];
      if (!hasDeepRoute()) {
        var items = isBirebirTab() ? state.birebirStudents : state.clans;
        state.status = items.length ? 'ready' : 'empty';
        if (!items.length && els.empty) {
          els.empty.textContent = isBirebirTab()
            ? 'Birebir ders verdiğiniz öğrenci bulunmuyor.'
            : 'Ders verdiğiniz klan bulunmuyor.';
        }
        syncUrl('replace');
        render();
        return;
      }
      return restoreRouteFromUrl();
    }).catch(function () {
      state.status = 'error';
      render();
    });
  }

  function init() {
    bindEls();
    parseUrl();
    initEduWeekNav();
    initTabs();
    if (els.drawerOverlay) els.drawerOverlay.addEventListener('click', function () { setDrawer(false); });
    if (els.drawerClose) els.drawerClose.addEventListener('click', function () { setDrawer(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (els.drawer && els.drawer.classList.contains('is-open')) {
        setDrawer(false);
        return;
      }
      if (state.view !== 'list') goBackOneLevel();
    });
    window.addEventListener('popstate', function (e) {
      if (e.state && e.state.thw) restoreFromHistorySnapshot(e.state.thw);
      else {
        parseUrl();
        load();
      }
    });
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
