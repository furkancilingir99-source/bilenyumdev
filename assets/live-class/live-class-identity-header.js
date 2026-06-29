(function (global) {
  'use strict';

  var PROGRAM_TYPE_LABELS = (global.BilenyumAnswerRequest && global.BilenyumAnswerRequest.PROGRAM_TYPE_LABELS) || {
    weekday_early: 'Hafta içi Erken',
    weekday_late: 'Hafta içi Geç',
    weekend_morning: 'Haftasonu Sabah',
    weekend_evening: 'Haftasonu Akşam'
  };

  var PROGRAM_BADGE_TONE = {
    weekday_early: 'blue',
    weekday_late: 'purple',
    weekend_morning: 'green',
    weekend_evening: 'magenta'
  };

  var DEFAULT_LOGO = 'assets/bilenyum-logo-beyaz.svg';
  var mounts = {};

  function formatElapsedTime(seconds) {
    seconds = Math.max(0, seconds || 0);
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    if (h > 0) {
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function chip(label, tone) {
    return '<span class="lc-id-chip lc-id-chip--' + (tone || 'neutral') + '">' + esc(label) + '</span>';
  }

  function renderStudent(identity, compact) {
    var program = PROGRAM_TYPE_LABELS[identity.programType] || identity.programType || '';
    var elapsed = formatElapsedTime(identity.elapsedSeconds);
    var chips = [
      identity.clanName ? chip(identity.clanName, 'clan') : '',
      identity.gradeLevel ? chip(identity.gradeLevel, 'grade') : '',
      program ? chip(program, PROGRAM_BADGE_TONE[identity.programType] || 'blue') : ''
    ].filter(Boolean).join('');

    if (compact) {
      return (
        '<div class="lc-id-line lc-id-line--compact">' +
          '<span class="lc-id-primary">' + esc(identity.studentName) + '</span>' +
          '<span class="lc-id-sep">·</span>' +
          '<span class="lc-id-meta">' + esc(identity.gradeLevel || '') + '</span>' +
          '<span class="lc-id-sep">·</span>' +
          '<span class="lc-id-time">Canlı · ' + elapsed + '</span>' +
        '</div>'
      );
    }

    return (
      '<div class="lc-id-primary">' + esc(identity.studentName) + '</div>' +
      '<div class="lc-id-meta-row">' +
        (chips ? '<span class="lc-id-chips">' + chips + '</span>' : '') +
        '<span class="lc-id-time">Canlı Ders Süresi: ' + elapsed + '</span>' +
      '</div>'
    );
  }

  function renderTeacher(identity, compact) {
    var program = PROGRAM_TYPE_LABELS[identity.programType] || identity.programType || '';
    var elapsed = formatElapsedTime(identity.elapsedSeconds);
    var title = identity.lessonTitle || '';
    if (identity.lessonTopic) title += (title ? ' — ' : '') + identity.lessonTopic;
    var chips = [
      identity.clanName ? chip(identity.clanName, 'clan') : '',
      identity.gradeLevel ? chip(identity.gradeLevel, 'grade') : '',
      program ? chip(program, PROGRAM_BADGE_TONE[identity.programType] || 'blue') : ''
    ].filter(Boolean).join('');
    var studentCount = identity.activeStudentCount != null
      ? identity.activeStudentCount + ' öğrenci derste'
      : '';

    if (compact) {
      return (
        '<div class="lc-id-line lc-id-line--compact">' +
          '<span class="lc-id-primary">' + esc(title) + '</span>' +
          '<span class="lc-id-sep">·</span>' +
          '<span class="lc-id-time">Canlı · ' + elapsed + '</span>' +
        '</div>'
      );
    }

    return (
      '<div class="lc-id-primary">' + esc(title) + '</div>' +
      '<div class="lc-id-meta-row">' +
        (chips ? '<span class="lc-id-chips">' + chips + '</span>' : '') +
        (studentCount ? '<span class="lc-id-meta">' + esc(studentCount) + '</span>' : '') +
        '<span class="lc-id-time">Canlı · ' + elapsed + '</span>' +
      '</div>'
    );
  }

  function renderHtml(role, identity, opts) {
    opts = opts || {};
    var logoSrc = opts.logoSrc || DEFAULT_LOGO;
    var compact = !!opts.compact || (window.matchMedia && window.matchMedia('(max-width: 900px)').matches);
    var body = role === 'teacher' ? renderTeacher(identity, compact) : renderStudent(identity, compact);

    return (
      '<div class="lc-id-header' + (compact ? ' lc-id-header--compact' : '') + '" data-role="' + role + '">' +
        '<span class="lc-id-logo" role="img" aria-label="Bilenyum">' +
          '<img src="' + esc(logoSrc) + '" alt="" class="lc-id-logo-img" onerror="this.style.display=\'none\';this.nextElementSibling.hidden=false">' +
          '<span class="lc-id-logo-wordmark" hidden>Bilenyum</span>' +
        '</span>' +
        '<div class="lc-id-body">' + body + '</div>' +
      '</div>'
    );
  }

  function mount(selector, options) {
    options = options || {};
    var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return null;
    var key = el.id || selector;
    mounts[key] = { el: el, role: options.role || 'student', identity: options.identity || {}, logoSrc: options.logoSrc };
    el.innerHTML = renderHtml(mounts[key].role, mounts[key].identity, { logoSrc: mounts[key].logoSrc });
    return mounts[key];
  }

  function update(selector, partial) {
    var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    var key = el && (el.id || selector);
    var m = mounts[key];
    if (!m && el) {
      m = { el: el, role: partial.role || 'student', identity: {} };
      mounts[key] = m;
    }
    if (!m) return;
    Object.assign(m.identity, partial || {});
    m.el.innerHTML = renderHtml(m.role, m.identity, { logoSrc: m.logoSrc });
  }

  function tickElapsed(selector, elapsedSeconds) {
    update(selector, { elapsedSeconds: elapsedSeconds });
  }

  global.LiveClassIdentityHeader = {
    PROGRAM_TYPE_LABELS: PROGRAM_TYPE_LABELS,
    formatElapsedTime: formatElapsedTime,
    mount: mount,
    update: update,
    tickElapsed: tickElapsed,
    renderHtml: renderHtml,
    defaultStudentIdentity: function () {
      return {
        studentName: 'Furkan Çilingir',
        clanName: 'Alfa Takımı',
        gradeLevel: '8. Sınıf',
        programType: 'weekday_early',
        lessonTitle: 'LGS Matematik',
        lessonTopic: 'Denklem Çözme',
        elapsedSeconds: 0
      };
    },
    defaultTeacherIdentity: function () {
      return {
        teacherName: 'Furkan Çilingir',
        clanName: 'Alfa Takımı',
        gradeLevel: '8. Sınıf',
        programType: 'weekday_early',
        lessonTitle: 'LGS Matematik',
        lessonTopic: 'Denklem Çözme',
        elapsedSeconds: 0,
        activeStudentCount: 12
      };
    }
  };

})(typeof window !== 'undefined' ? window : this);
