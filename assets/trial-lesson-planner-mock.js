/**
 * Deneme dersi planlama — öğretmenler, planlanmış dersler, çakışma kontrolü
 */
(function (global) {
  'use strict';

  var SUBJECTS = ['Matematik', 'Fen Bilimleri', 'Türkçe', 'İngilizce', 'Sosyal Bilgiler'];
  var GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
  var ID_PREFIX = 'DERS';

  var SUBJECT_CODES = {
    'Matematik': 'MAT',
    'Fen Bilimleri': 'FEN',
    'Türkçe': 'TUR',
    'İngilizce': 'ING',
    'Sosyal Bilgiler': 'SOS'
  };

  var CODE_SUBJECTS = {
    MAT: 'Matematik',
    FEN: 'Fen Bilimleri',
    TUR: 'Türkçe',
    ING: 'İngilizce',
    SOS: 'Sosyal Bilgiler'
  };

  function gradeCode(grade) {
    var m = /^(\d+)/.exec(grade || '');
    return m ? m[1] : '0';
  }

  function formatLessonId(subject, grade, year, seq) {
    var code = SUBJECT_CODES[subject] || 'GEN';
    return ID_PREFIX + '-' + code + '-' + gradeCode(grade) + '-' + year + '-' + String(seq).padStart(4, '0');
  }

  function lessonIdPrefix(subject, grade, year) {
    var code = SUBJECT_CODES[subject] || 'GEN';
    return ID_PREFIX + '-' + code + '-' + gradeCode(grade) + '-' + year + '-';
  }

  function nextLessonSeq(subject, grade, year) {
    var prefix = lessonIdPrefix(subject, grade, year);
    var max = 0;
    PLANNED_LESSONS.forEach(function (l) {
      if (l.id.indexOf(prefix) !== 0) return;
      var seq = parseInt(l.id.slice(prefix.length), 10);
      if (!isNaN(seq)) max = Math.max(max, seq);
    });
    return max + 1;
  }

  function previewLessonId(subject, grade) {
    if (!subject || !grade) return null;
    var year = new Date().getFullYear();
    return formatLessonId(subject, grade, year, nextLessonSeq(subject, grade, year));
  }

  function describeLessonId(id) {
    var m = /^DERS-([A-Z]+)-(\d)-(\d{4})-(\d+)$/.exec(id || '');
    if (!m) {
      return { id: id, subject: '—', grade: '—', year: '—', seq: '—' };
    }
    return {
      id: id,
      code: m[1],
      subject: CODE_SUBJECTS[m[1]] || m[1],
      grade: m[2] + '. Sınıf',
      year: m[3],
      seq: m[4]
    };
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
      id: 'DERS-MAT-5-2026-0001',
      subject: 'Matematik',
      grade: '5. Sınıf',
      teacherId: 't1',
      slotLabel: 'Pazartesi, 7 Tem · 14:30',
      slotDateKey: '2026-07-07',
      slotTime: '14:30',
      studentIds: ['REZ-2026-0001', 'REZ-2026-0021', 'REZ-2026-0041'],
      updatedAt: '2026-07-05T10:00:00+03:00'
    },
    {
      id: 'DERS-FEN-6-2026-0001',
      subject: 'Fen Bilimleri',
      grade: '6. Sınıf',
      teacherId: 't5',
      slotLabel: 'Bugün · 16:00',
      slotDateKey: '2026-07-05',
      slotTime: '16:00',
      studentIds: ['REZ-2026-0007', 'REZ-2026-0027'],
      updatedAt: '2026-07-05T08:30:00+03:00'
    },
    {
      id: 'DERS-TUR-6-2026-0001',
      subject: 'Türkçe',
      grade: '6. Sınıf',
      teacherId: 't3',
      slotLabel: 'Salı, 8 Tem · 11:30',
      slotDateKey: '2026-07-08',
      slotTime: '11:30',
      studentIds: ['REZ-2026-0028', 'REZ-2026-0048'],
      updatedAt: '2026-07-04T18:20:00+03:00'
    },
    {
      id: 'DERS-MAT-5-2026-0002',
      subject: 'Matematik',
      grade: '5. Sınıf',
      teacherId: 't2',
      slotLabel: 'Pazartesi, 7 Tem · 10:00',
      slotDateKey: '2026-07-07',
      slotTime: '10:00',
      studentIds: ['REZ-2026-0001', 'REZ-2026-0021', 'REZ-2026-0041'],
      updatedAt: '2026-07-04T14:10:00+03:00'
    },
    {
      id: 'DERS-ING-7-2026-0001',
      subject: 'İngilizce',
      grade: '7. Sınıf',
      teacherId: 't4',
      slotLabel: 'Perşembe, 10 Tem · 17:30',
      slotDateKey: '2026-07-10',
      slotTime: '17:30',
      studentIds: ['REZ-2026-0014', 'REZ-2026-0034'],
      updatedAt: '2026-07-03T16:45:00+03:00'
    },
    {
      id: 'DERS-FEN-7-2026-0001',
      subject: 'Fen Bilimleri',
      grade: '7. Sınıf',
      teacherId: 't2',
      slotLabel: 'Çarşamba, 9 Tem · 13:00',
      slotDateKey: '2026-07-09',
      slotTime: '13:00',
      studentIds: ['REZ-2026-0012', 'REZ-2026-0032'],
      updatedAt: '2026-07-03T11:30:00+03:00'
    },
    {
      id: 'DERS-SOS-8-2026-0001',
      subject: 'Sosyal Bilgiler',
      grade: '8. Sınıf',
      teacherId: 't4',
      slotLabel: 'Cuma, 11 Tem · 10:00',
      slotDateKey: '2026-07-11',
      slotTime: '10:00',
      studentIds: ['REZ-2026-0020', 'REZ-2026-0040'],
      updatedAt: '2026-07-02T09:15:00+03:00'
    },
    {
      id: 'DERS-MAT-8-2026-0001',
      subject: 'Matematik',
      grade: '8. Sınıf',
      teacherId: 't1',
      slotLabel: 'Salı, 8 Tem · 16:00',
      slotDateKey: '2026-07-08',
      slotTime: '16:00',
      studentIds: ['REZ-2026-0016', 'REZ-2026-0036'],
      updatedAt: '2026-07-01T20:00:00+03:00'
    },
    {
      id: 'DERS-TUR-8-2026-0001',
      subject: 'Türkçe',
      grade: '8. Sınıf',
      teacherId: 't3',
      slotLabel: 'Pazartesi, 7 Tem · 19:00',
      slotDateKey: '2026-07-07',
      slotTime: '19:00',
      studentIds: ['REZ-2026-0018', 'REZ-2026-0038'],
      updatedAt: '2026-06-30T15:40:00+03:00'
    },
    {
      id: 'DERS-ING-5-2026-0001',
      subject: 'İngilizce',
      grade: '5. Sınıf',
      teacherId: 't4',
      slotLabel: 'Cumartesi, 12 Tem · 10:00',
      slotDateKey: '2026-07-12',
      slotTime: '10:00',
      studentIds: ['REZ-2026-0004', 'REZ-2026-0024', 'REZ-2026-0044'],
      updatedAt: '2026-06-29T12:20:00+03:00'
    },
    {
      id: 'DERS-MAT-6-2026-0001',
      subject: 'Matematik',
      grade: '6. Sınıf',
      teacherId: 't2',
      slotLabel: 'Bugün · 13:00',
      slotDateKey: '2026-07-05',
      slotTime: '13:00',
      studentIds: ['REZ-2026-0026', 'REZ-2026-0046'],
      updatedAt: '2026-07-05T07:10:00+03:00'
    },
    {
      id: 'DERS-FEN-8-2026-0001',
      subject: 'Fen Bilimleri',
      grade: '8. Sınıf',
      teacherId: 't5',
      slotLabel: 'Perşembe, 10 Tem · 14:30',
      slotDateKey: '2026-07-10',
      slotTime: '14:30',
      studentIds: ['REZ-2026-0017', 'REZ-2026-0037'],
      updatedAt: '2026-06-28T17:55:00+03:00'
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

  function nextLessonId(subject, grade) {
    var year = new Date().getFullYear();
    return formatLessonId(subject, grade, year, nextLessonSeq(subject, grade, year));
  }

  function updatePlannedLessonStudents(id, studentIds) {
    var lesson = getPlannedLessonById(id);
    if (!lesson) return { ok: false, error: 'Ders bulunamadı.' };
    return savePlannedLesson({
      id: lesson.id,
      subject: lesson.subject,
      grade: lesson.grade,
      teacherId: lesson.teacherId,
      slotLabel: lesson.slotLabel,
      slotDateKey: lesson.slotDateKey,
      slotTime: lesson.slotTime,
      studentIds: (studentIds || []).slice()
    });
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

    payload.id = nextLessonId(draft.subject, draft.grade);
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
    SUBJECT_CODES: SUBJECT_CODES,
    formatLessonId: formatLessonId,
    previewLessonId: previewLessonId,
    describeLessonId: describeLessonId,
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
    updatePlannedLessonStudents: updatePlannedLessonStudents,
    deletePlannedLesson: deletePlannedLesson,
    getEnrichedPlannedLesson: getEnrichedPlannedLesson,
    getFilterOptions: getFilterOptions
  };
})(typeof window !== 'undefined' ? window : this);
