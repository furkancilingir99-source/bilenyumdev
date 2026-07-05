/**
 * Deneme dersi planlama — öğretmenler, planlanmış dersler, çakışma kontrolü
 */
(function (global) {
  'use strict';

  var SUBJECTS = ['Matematik', 'Fen Bilimleri', 'Türkçe', 'İngilizce', 'Sosyal Bilgiler'];
  var GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
  var ID_PREFIX = 'DERS';

  function formatLessonId(year, seq) {
    return ID_PREFIX + '-' + year + '-' + String(seq).padStart(4, '0');
  }

  var TEACHERS = [
    { id: 't1', name: 'Furkan Çilingir', subjects: ['Matematik'] },
    { id: 't2', name: 'Zeynep Arslan', subjects: ['Matematik', 'Fen Bilimleri'] },
    { id: 't3', name: 'Mehmet Koç', subjects: ['Türkçe'] },
    { id: 't4', name: 'Elif Yıldız', subjects: ['İngilizce', 'Sosyal Bilgiler'] },
    { id: 't5', name: 'Can Demir', subjects: ['Fen Bilimleri'] }
  ];

  var PLANNED_LESSONS = [
    {
      id: 'DERS-2026-0001',
      subject: 'Matematik',
      grade: '7. Sınıf',
      teacherId: 't1',
      slotLabel: 'Pazartesi, 7 Tem · 14:30',
      slotDateKey: '2026-07-07',
      slotTime: '14:30',
      studentIds: ['REZ-2026-0001', 'REZ-2026-0009'],
      updatedAt: '2026-07-05T10:00:00+03:00'
    },
    {
      id: 'DERS-2026-0002',
      subject: 'Fen Bilimleri',
      grade: '8. Sınıf',
      teacherId: 't5',
      slotLabel: 'Bugün · 16:00',
      slotDateKey: '2026-07-05',
      slotTime: '16:00',
      studentIds: ['REZ-2026-0002'],
      updatedAt: '2026-07-05T08:30:00+03:00'
    }
  ];

  function getReservationStore() {
    return global.TrialLessonManagerMock ? global.TrialLessonManagerMock.getReservations() : [];
  }

  function getTeachersForSubject(subject) {
    if (!subject) return TEACHERS.slice();
    return TEACHERS.filter(function (t) {
      return t.subjects.indexOf(subject) !== -1;
    });
  }

  function getTeacherById(id) {
    for (var i = 0; i < TEACHERS.length; i++) {
      if (TEACHERS[i].id === id) return TEACHERS[i];
    }
    return null;
  }

  function getPlannedLessons() {
    return PLANNED_LESSONS.slice().sort(function (a, b) {
      return (a.slotDateKey + a.slotTime).localeCompare(b.slotDateKey + b.slotTime);
    });
  }

  function getPlannedLessonById(id) {
    for (var i = 0; i < PLANNED_LESSONS.length; i++) {
      if (PLANNED_LESSONS[i].id === id) return PLANNED_LESSONS[i];
    }
    return null;
  }

  function slotKey(dateKey, time) {
    return dateKey + '|' + time;
  }

  function getEligibleStudents(subject, grade, excludeLessonId, dateKey, time) {
    return getReservationStore().filter(function (r) {
      if (r.status === 'cancelled' || r.status === 'completed') return false;
      if (subject && r.subject !== subject) return false;
      if (grade && r.grade !== grade) return false;
      return true;
    }).map(function (r) {
      var conflict = findStudentConflict(r.id, dateKey, time, excludeLessonId);
      return {
        reservationId: r.id,
        name: r.studentFirstName + ' ' + r.studentLastName,
        grade: r.grade,
        subject: r.subject,
        parent: r.parentFirstName + ' ' + r.parentLastName,
        phone: r.phone,
        preferredSlot: r.slotLabel,
        hasConflict: conflict.length > 0,
        conflictMsg: conflict.length ? conflict[0].message : ''
      };
    });
  }

  function findStudentConflict(studentId, dateKey, time, excludeLessonId) {
    var issues = [];
    if (!dateKey || !time) return issues;
    PLANNED_LESSONS.forEach(function (lesson) {
      if (excludeLessonId && lesson.id === excludeLessonId) return;
      if (lesson.studentIds.indexOf(studentId) === -1) return;
      if (slotKey(lesson.slotDateKey, lesson.slotTime) === slotKey(dateKey, time)) {
        issues.push({
          type: 'student',
          message: 'Öğrenci aynı saatte "' + lesson.subject + ' · ' + lesson.slotLabel + '" dersine atanmış.'
        });
      }
    });
    return issues;
  }

  function findTeacherConflict(teacherId, dateKey, time, excludeLessonId) {
    var issues = [];
    if (!teacherId || !dateKey || !time) return issues;
    PLANNED_LESSONS.forEach(function (lesson) {
      if (excludeLessonId && lesson.id === excludeLessonId) return;
      if (lesson.teacherId !== teacherId) return;
      if (slotKey(lesson.slotDateKey, lesson.slotTime) === slotKey(dateKey, time)) {
        issues.push({
          type: 'teacher',
          message: 'Öğretmen bu saatte "' + lesson.subject + ' · ' + lesson.grade + '" dersinde.'
        });
      }
    });
    return issues;
  }

  function checkConflicts(draft) {
    var issues = [];
    if (!draft) return issues;
    var excludeId = draft.id || null;

    if (draft.teacherId && draft.slotDateKey && draft.slotTime) {
      issues = issues.concat(findTeacherConflict(draft.teacherId, draft.slotDateKey, draft.slotTime, excludeId));
    }

    (draft.studentIds || []).forEach(function (sid) {
      if (draft.slotDateKey && draft.slotTime) {
        issues = issues.concat(findStudentConflict(sid, draft.slotDateKey, draft.slotTime, excludeId));
      }
    });

    return issues;
  }

  function nextLessonId() {
    var year = new Date().getFullYear();
    var max = 0;
    PLANNED_LESSONS.forEach(function (l) {
      var m = new RegExp('^' + ID_PREFIX + '-(\\d{4})-(\\d+)$').exec(l.id);
      if (m && parseInt(m[1], 10) === year) {
        max = Math.max(max, parseInt(m[2], 10));
      }
    });
    return formatLessonId(year, max + 1);
  }

  function savePlannedLesson(draft) {
    if (!draft.subject || !draft.grade || !draft.teacherId || !draft.slotDateKey || !draft.slotTime) {
      return { ok: false, error: 'Branş, sınıf, öğretmen ve ders saati zorunludur.' };
    }

    var conflicts = checkConflicts(draft);
    if (conflicts.length) {
      return { ok: false, error: 'Çakışma var. Lütfen öğretmen, saat veya öğrenci seçimini düzenleyin.', conflicts: conflicts };
    }

    var payload = {
      subject: draft.subject,
      grade: draft.grade,
      teacherId: draft.teacherId,
      slotLabel: draft.slotLabel,
      slotDateKey: draft.slotDateKey,
      slotTime: draft.slotTime,
      studentIds: (draft.studentIds || []).slice(),
      updatedAt: new Date().toISOString()
    };

    if (draft.id) {
      for (var i = 0; i < PLANNED_LESSONS.length; i++) {
        if (PLANNED_LESSONS[i].id === draft.id) {
          PLANNED_LESSONS[i] = Object.assign({}, PLANNED_LESSONS[i], payload);
          return { ok: true, lesson: PLANNED_LESSONS[i] };
        }
      }
    }

    payload.id = nextLessonId();
    PLANNED_LESSONS.push(payload);
    return { ok: true, lesson: payload };
  }

  function deletePlannedLesson(id) {
    var idx = -1;
    for (var i = 0; i < PLANNED_LESSONS.length; i++) {
      if (PLANNED_LESSONS[i].id === id) idx = i;
    }
    if (idx === -1) return false;
    PLANNED_LESSONS.splice(idx, 1);
    return true;
  }

  function getReservationById(id) {
    var rows = getReservationStore();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].id === id) return rows[i];
    }
    return null;
  }

  function getStudentDetailsForLesson(lesson) {
    return (lesson.studentIds || []).map(function (sid) {
      var r = getReservationById(sid);
      if (!r) {
        return {
          reservationId: sid,
          name: '—',
          grade: '—',
          subject: '—',
          parent: '—',
          phone: '—',
          email: '—',
          preferredSlot: '—',
          status: 'unknown'
        };
      }
      return {
        reservationId: r.id,
        name: r.studentFirstName + ' ' + r.studentLastName,
        grade: r.grade,
        subject: r.subject,
        parent: r.parentFirstName + ' ' + r.parentLastName,
        phone: r.phone,
        email: r.email,
        preferredSlot: r.slotLabel,
        status: r.status
      };
    });
  }

  function getEnrichedPlannedLesson(id) {
    var lesson = getPlannedLessonById(id);
    if (!lesson) return null;
    var teacher = getTeacherById(lesson.teacherId);
    return {
      id: lesson.id,
      subject: lesson.subject,
      grade: lesson.grade,
      teacherId: lesson.teacherId,
      teacherName: teacher ? teacher.name : '—',
      teacherSubjects: teacher ? teacher.subjects.slice() : [],
      slotLabel: lesson.slotLabel,
      slotDateKey: lesson.slotDateKey,
      slotTime: lesson.slotTime,
      studentIds: lesson.studentIds.slice(),
      students: getStudentDetailsForLesson(lesson),
      updatedAt: lesson.updatedAt,
      conflicts: checkConflicts(lesson)
    };
  }

  function getFilterOptions() {
    return {
      grades: GRADES.slice(),
      subjects: SUBJECTS.slice(),
      teachers: TEACHERS.map(function (t) { return { id: t.id, name: t.name }; })
    };
  }

  global.TrialLessonPlannerMock = {
    ID_PREFIX: ID_PREFIX,
    formatLessonId: formatLessonId,
    nextLessonId: nextLessonId,
    SUBJECTS: SUBJECTS,
    GRADES: GRADES,
    getTeachersForSubject: getTeachersForSubject,
    getTeacherById: getTeacherById,
    getPlannedLessons: getPlannedLessons,
    getPlannedLessonById: getPlannedLessonById,
    getEligibleStudents: getEligibleStudents,
    checkConflicts: checkConflicts,
    savePlannedLesson: savePlannedLesson,
    deletePlannedLesson: deletePlannedLesson,
    getEnrichedPlannedLesson: getEnrichedPlannedLesson,
    getFilterOptions: getFilterOptions
  };
})(typeof window !== 'undefined' ? window : this);
