/**
 * TMStore → Öğretmen dashboard köprüsü
 * ?tmTeacher=teacher-branch-1 ile deneme dersi oturumları dashboard'da görünür.
 */
(function (global) {
  'use strict';

  if (!global.TeacherDashboardMock) return;

  var api = global.TeacherDashboardMock;
  var STORAGE_KEY = 'bilenyum_tm_demo_teacher_id';

  function store() {
    return global.TMStore || null;
  }

  function activeTeacherId() {
    try {
      var qs = new URLSearchParams(global.location.search);
      var fromQs = qs.get('tmTeacher');
      if (fromQs) return fromQs;
      return global.sessionStorage.getItem(STORAGE_KEY) || global.localStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function isEnabled() {
    return !!(store() && activeTeacherId());
  }

  function teacherRole(session, teacherId) {
    if (session.pdrTeacherId === teacherId) return 'pdr';
    if (session.branchTeacherId === teacherId) return 'branch';
    return null;
  }

  function mapSession(session, teacherId) {
    var s = store();
    var teacher = s.getTeacherById(teacherId);
    var lt = s.getLessonTypeById(session.lessonTypeId);
    var meeting = s.getMeetingBySessionId(session.id);
    var role = teacherRole(session, teacherId);
    var enrolled = (session.enrolledStudentIds || []).length;
    var gradeLevel = enrolled > 0 ? 'Online grup (' + enrolled + ' öğrenci)' : 'Online ücretsiz deneme';
    var topic = role === 'pdr'
      ? 'Veli sunumu — platform ve süreç bilgilendirmesi (ilk 20 dk)'
      : 'Öğrenci ücretsiz deneme dersi (son 30 dk)';
    var title = role === 'pdr' ? 'PDR / Rehberlik — Veli Sunumu' : 'Ücretsiz Deneme Dersi';

    return {
      id: 'tm-session-' + session.id,
      type: 'free_trial',
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      durationMinutes: 50,
      lessonName: lt ? lt.name : 'Deneme Dersi',
      lessonTitle: title,
      lessonTopic: topic,
      lessonContent: role === 'pdr'
        ? 'PDR/Rehberlik öğretmeni olarak velilere platform, süreç ve deneme dersi akışını anlatırsınız.'
        : 'Branş öğretmeni olarak öğrencilere ücretsiz deneme dersi yaparsınız. İlk 20 dakika PDR veli sunumu yapar.',
      educationWeek: api.formatEduWeekLabel(api.findEduWeekForDate(session.date)),
      gradeLevel: gradeLevel,
      clan: null,
      student: null,
      trialMode: 'clan',
      trialRole: role,
      tmSessionId: session.id,
      tmTeacherRole: role,
      studentCount: enrolled,
      meetingUrl: meeting ? meeting.meetingUrl : null,
      meetingId: meeting ? meeting.meetingId : null,
      passcode: meeting ? meeting.passcode : null,
      status: session.status === 'cancelled' ? 'completed' : undefined,
      _tmTeacher: teacher ? teacher.id : teacherId
    };
  }

  function trialLessonsBetween(startDate, endDate) {
    var s = store();
    var tid = activeTeacherId();
    if (!s || !tid) return [];
    var teacher = s.getTeacherById(tid);
    if (!teacher || !teacher.dashboardEnabled) return [];
    return s.getSessionsForTeacher(tid)
      .filter(function (session) {
        return session.status !== 'cancelled' && session.date >= startDate && session.date <= endDate;
      })
      .map(function (session) { return mapSession(session, tid); });
  }

  function mergeLessons(baseLessons, tmLessons) {
    var tmIds = {};
    tmLessons.forEach(function (l) { tmIds[l.id] = true; });
    var merged = tmLessons.slice();
    baseLessons.forEach(function (l) {
      if (l.id && String(l.id).indexOf('tm-session-') === 0) return;
      if (l.type === 'free_trial' && tmLessons.length) return;
      merged.push(l);
    });
    return merged.sort(api.sortByTime);
  }

  var origGetToday = api.getToday;
  var origGetWeek = api.getWeek;
  var origGetLessonById = api.getLessonById;

  api.getToday = function (options) {
    options = options || {};
    if (!isEnabled()) return origGetToday(options);
    var s = store();
    var today = s.todayKey();
    var now = options.now ? new Date(options.now) : new Date();
    var tmLessons = trialLessonsBetween(today, today).map(function (l) {
      return api.withStatus(l, now);
    });
    if (tmLessons.length) {
      return Promise.resolve({ date: today, lessons: tmLessons, now: now.toISOString(), tmIntegrated: true });
    }
    return origGetToday(options);
  };

  api.getWeek = function (weekStartISO, options) {
    options = options || {};
    if (!isEnabled()) return origGetWeek(weekStartISO, options);
    return origGetWeek(weekStartISO, options).then(function (data) {
      var tmLessons = trialLessonsBetween(data.weekStart, data.weekEnd).map(function (l) {
        return api.withStatus(l, options.now ? new Date(options.now) : new Date(data.now || Date.now()));
      });
      if (!tmLessons.length) return data;
      data.lessons = mergeLessons(data.lessons, tmLessons);
      data.tmIntegrated = true;
      return data;
    });
  };

  api.getLessonById = function (id) {
    if (String(id).indexOf('tm-session-') === 0 && store()) {
      var sessionId = id.replace('tm-session-', '');
      var session = store().getSessionById(sessionId);
      if (session) return mapSession(session, activeTeacherId());
    }
    return origGetLessonById(id);
  };

  global.TMTeacherDashboardBridge = {
    isEnabled: isEnabled,
    activeTeacherId: activeTeacherId,
    trialLessonsBetween: trialLessonsBetween
  };
})(typeof window !== 'undefined' ? window : this);
