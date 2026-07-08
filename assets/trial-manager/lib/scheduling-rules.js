/**
 * Zamanlama ve atama kuralları — PDR + branş öğretmeni
 */
(function (global) {
  'use strict';

  var CAPACITY = 20;
  var DURATION_MIN = 50;
  var PARENT_MIN = 20;
  var STUDENT_MIN = 30;
  var HOURLY_SLOTS = ['11:00', '12:00', '13:00', '14:00'];

  function parseTime(t) {
    var p = (t || '').split(':');
    return { h: parseInt(p[0], 10) || 0, m: parseInt(p[1], 10) || 0 };
  }

  function timeToMinutes(t) {
    var p = parseTime(t);
    return p.h * 60 + p.m;
  }

  function addMinutes(t, mins) {
    var total = timeToMinutes(t) + mins;
    var h = Math.floor(total / 60) % 24;
    var m = total % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function isHourlySlot(startTime, endTime) {
    var s = parseTime(startTime);
    var e = parseTime(endTime);
    return s.m === 0 && e.m === 50 && e.h === s.h;
  }

  function isValidTrialLessonDuration(startTime, endTime) {
    if (!isHourlySlot(startTime, endTime)) return false;
    return timeToMinutes(endTime) - timeToMinutes(startTime) === DURATION_MIN;
  }

  function getStore() {
    return global.TMStore;
  }

  function getTeacher(teacherId) {
    var store = getStore();
    if (!store) return null;
    return store.getTeacherById(teacherId);
  }

  function normalizeTeacherType(type) {
    if (type === 'pdr' || type === 'pdr_teacher') return 'pdr_teacher';
    if (type === 'branch' || type === 'branch_teacher') return 'branch_teacher';
    return type;
  }

  function getDayOfWeek(dateStr) {
    var parts = dateStr.split('-');
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.getDay();
  }

  function sessionRoleTeacherId(session, role) {
    if (!session) return null;
    if (role === 'pdr') return session.pdrTeacherId || null;
    if (role === 'branch') return session.branchTeacherId || session.teacherId || null;
    return session.pdrTeacherId || session.branchTeacherId || session.teacherId || null;
  }

  function sessionHasTeacher(session, teacherId) {
    if (!session || !teacherId) return false;
    return session.pdrTeacherId === teacherId ||
      session.branchTeacherId === teacherId ||
      session.teacherId === teacherId;
  }

  function isTeacherAvailable(teacherId, date, startTime, endTime) {
    var teacher = getTeacher(teacherId);
    if (!teacher || !teacher.isActive) return false;
    var dow = getDayOfWeek(date);
    var startMin = timeToMinutes(startTime);
    var endMin = timeToMinutes(endTime);
    return (teacher.availability || []).some(function (a) {
      if (!a.isAvailable || a.dayOfWeek !== dow) return false;
      return startMin >= timeToMinutes(a.startTime) && endMin <= timeToMinutes(a.endTime);
    });
  }

  function hasRoleConflict(teacherId, date, startTime, endTime, sessionIdToIgnore) {
    var store = getStore();
    if (!store || !teacherId) return false;
    var startMin = timeToMinutes(startTime);
    var endMin = timeToMinutes(endTime);
    return store.getSessions().some(function (s) {
      if (s.id === sessionIdToIgnore) return false;
      if (!sessionHasTeacher(s, teacherId) || s.date !== date) return false;
      if (s.status === 'cancelled') return false;
      var sStart = timeToMinutes(s.startTime);
      var sEnd = timeToMinutes(s.endTime);
      return startMin < sEnd && endMin > sStart;
    });
  }

  function isTeacherPdr(teacherId) {
    var t = getTeacher(teacherId);
    return !!t && normalizeTeacherType(t.teacherType) === 'pdr_teacher';
  }

  function isTeacherBranchTeacher(teacherId) {
    var t = getTeacher(teacherId);
    return !!t && normalizeTeacherType(t.teacherType) === 'branch_teacher';
  }

  function isPdrTeacherAvailable(pdrTeacherId, date, startTime, endTime) {
    return isTeacherPdr(pdrTeacherId) && isTeacherAvailable(pdrTeacherId, date, startTime, endTime);
  }

  function isBranchTeacherAvailable(branchTeacherId, date, startTime, endTime) {
    return isTeacherBranchTeacher(branchTeacherId) && isTeacherAvailable(branchTeacherId, date, startTime, endTime);
  }

  function hasPdrTeacherConflict(pdrTeacherId, date, startTime, endTime, sessionIdToIgnore) {
    return hasRoleConflict(pdrTeacherId, date, startTime, endTime, sessionIdToIgnore);
  }

  function hasBranchTeacherConflict(branchTeacherId, date, startTime, endTime, sessionIdToIgnore) {
    return hasRoleConflict(branchTeacherId, date, startTime, endTime, sessionIdToIgnore);
  }

  function hasTeacherConflict(teacherId, date, startTime, endTime, sessionIdToIgnore) {
    return hasRoleConflict(teacherId, date, startTime, endTime, sessionIdToIgnore);
  }

  function isBranchTeacherEligibleForLessonType(branchTeacherId, lessonTypeId) {
    var teacher = getTeacher(branchTeacherId);
    if (!teacher) return false;
    if (!isTeacherBranchTeacher(branchTeacherId)) return false;
    return (teacher.branchLessonTypeIds || []).indexOf(lessonTypeId) >= 0;
  }

  function isTeacherEligibleForLessonType(teacherId, lessonTypeId) {
    return isBranchTeacherEligibleForLessonType(teacherId, lessonTypeId);
  }

  function canAssignTeachersToSession(params) {
    var reasons = [];
    if (!params.pdrTeacherId) reasons.push('PDR/Rehberlik öğretmeni seçilmelidir.');
    if (!params.branchTeacherId) reasons.push('Branş öğretmeni seçilmelidir.');
    if (params.pdrTeacherId && params.branchTeacherId && params.pdrTeacherId === params.branchTeacherId) {
      reasons.push('PDR ve branş öğretmeni aynı kişi olamaz.');
    }
    if (params.pdrTeacherId && !isTeacherPdr(params.pdrTeacherId)) {
      reasons.push('Seçilen PDR öğretmeni geçerli bir PDR/Rehberlik öğretmeni değil.');
    }
    if (params.branchTeacherId && !isTeacherBranchTeacher(params.branchTeacherId)) {
      reasons.push('Seçilen branş öğretmeni geçerli bir branş öğretmeni değil.');
    }
    if (params.branchTeacherId && params.lessonTypeId && !isBranchTeacherEligibleForLessonType(params.branchTeacherId, params.lessonTypeId)) {
      reasons.push('Branş öğretmeni ders türüyle uyumlu değil.');
    }
    if (params.pdrTeacherId && params.date && params.startTime && params.endTime) {
      if (!isPdrTeacherAvailable(params.pdrTeacherId, params.date, params.startTime, params.endTime)) {
        reasons.push('PDR öğretmeni bu saatte müsait değil.');
      }
      if (hasPdrTeacherConflict(params.pdrTeacherId, params.date, params.startTime, params.endTime, params.sessionIdToIgnore)) {
        reasons.push('PDR öğretmeninin aynı saatte başka dersi var.');
      }
    }
    if (params.branchTeacherId && params.date && params.startTime && params.endTime) {
      if (!isBranchTeacherAvailable(params.branchTeacherId, params.date, params.startTime, params.endTime)) {
        reasons.push('Branş öğretmeni bu saatte müsait değil.');
      }
      if (hasBranchTeacherConflict(params.branchTeacherId, params.date, params.startTime, params.endTime, params.sessionIdToIgnore)) {
        reasons.push('Branş öğretmeninin aynı saatte başka dersi var.');
      }
    }
    return { allowed: reasons.length === 0, reasons: reasons };
  }

  function getSessionRemainingCapacity(sessionId) {
    var store = getStore();
    if (!store) return 0;
    var session = store.getSessionById(sessionId);
    if (!session || session.status === 'cancelled') return 0;
    var enrolled = (session.enrolledStudentIds || []).length;
    return Math.max(0, CAPACITY - enrolled);
  }

  function hasStudentAlreadyUsedFreeTrialForLessonType(studentId, lessonTypeId) {
    var store = getStore();
    if (!store) return false;
    var student = store.getStudentById(studentId);
    if (!student) return false;
    return (student.hasUsedFreeTrialForLessonTypeIds || []).indexOf(lessonTypeId) >= 0;
  }

  function canAssignStudentToSession(studentId, sessionId) {
    var store = getStore();
    if (!store) return { allowed: false, reason: 'Veri yüklenemedi.' };
    var session = store.getSessionById(sessionId);
    var student = store.getStudentById(studentId);
    if (!session) return { allowed: false, reason: 'Ders bulunamadı.' };
    if (!student) return { allowed: false, reason: 'Öğrenci bulunamadı.' };
    if (session.status === 'cancelled') return { allowed: false, reason: 'Ders iptal edilmiş.' };
    if (!session.pdrTeacherId || !session.branchTeacherId) {
      return { allowed: false, reason: 'Ders için PDR ve branş öğretmeni atanmış olmalıdır.' };
    }
    if (getSessionRemainingCapacity(sessionId) <= 0) return { allowed: false, reason: 'Kapasite dolu (max 20).' };
    if (hasStudentAlreadyUsedFreeTrialForLessonType(studentId, session.lessonTypeId)) {
      return { allowed: false, reason: 'Öğrenci bu ders türünde daha önce ücretsiz deneme almış.' };
    }
    if (student.requestedLessonTypeId && student.requestedLessonTypeId !== session.lessonTypeId) {
      return { allowed: false, reason: 'Öğrencinin istediği ders türü ile uyuşmuyor.' };
    }
    if (session.gradeLevel && student.grade && session.gradeLevel !== student.grade) {
      return { allowed: false, reason: 'Öğrencinin sınıf seviyesi (' + student.grade + ') ders seviyesi (' + session.gradeLevel + ') ile uyuşmuyor.' };
    }
    if ((session.enrolledStudentIds || []).indexOf(studentId) >= 0) {
      return { allowed: false, reason: 'Öğrenci zaten bu derste.' };
    }
    return { allowed: true };
  }

  function getAffectedPeopleForSessionChange(sessionId) {
    var store = getStore();
    var result = { teacherIds: [], pdrTeacherIds: [], branchTeacherIds: [], studentIds: [], parentIds: [] };
    if (!store) return result;
    var session = store.getSessionById(sessionId);
    if (!session) return result;
    if (session.pdrTeacherId) {
      result.pdrTeacherIds.push(session.pdrTeacherId);
      if (result.teacherIds.indexOf(session.pdrTeacherId) < 0) result.teacherIds.push(session.pdrTeacherId);
    }
    if (session.branchTeacherId) {
      result.branchTeacherIds.push(session.branchTeacherId);
      if (result.teacherIds.indexOf(session.branchTeacherId) < 0) result.teacherIds.push(session.branchTeacherId);
    }
    if (session.teacherId && result.teacherIds.indexOf(session.teacherId) < 0) result.teacherIds.push(session.teacherId);
    (session.enrolledStudentIds || []).forEach(function (sid) {
      result.studentIds.push(sid);
      var student = store.getStudentById(sid);
      if (student && student.parentIds) {
        student.parentIds.forEach(function (pid) {
          if (result.parentIds.indexOf(pid) < 0) result.parentIds.push(pid);
        });
      }
    });
    return result;
  }

  function sessionMissingTeachers(session) {
    return !session || !session.pdrTeacherId || !session.branchTeacherId;
  }

  function validateSessionDraft(draft) {
    var issues = [];
    if (!draft.lessonTypeId) issues.push('Ders türü zorunlu.');
    if (!draft.date || !draft.startTime || !draft.endTime) issues.push('Tarih ve saat zorunlu.');
    if (draft.startTime && draft.endTime && !isValidTrialLessonDuration(draft.startTime, draft.endTime)) {
      issues.push('Ders saat başına 50 dakika olmalı (ör. 11:00–11:50).');
    }
    if (draft.lessonTypeId && draft.date && draft.startTime && hasSessionSlotConflict(draft.date, draft.lessonTypeId, draft.startTime, draft.id)) {
      issues.push('Bu tarih ve saatte aynı ders türü için zaten bir oturum var.');
    }
    var assign = canAssignTeachersToSession({
      pdrTeacherId: draft.pdrTeacherId,
      branchTeacherId: draft.branchTeacherId,
      lessonTypeId: draft.lessonTypeId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      sessionIdToIgnore: draft.id
    });
    if (!assign.allowed) issues = issues.concat(assign.reasons);
    var store = getStore();
    if (!draft.id && draft.date && store && draft.date < store.todayKey()) {
      issues.push('Geçmiş tarihe yeni ders planlanamaz.');
    }
    return issues;
  }

  function hasSessionSlotConflict(date, lessonTypeId, startTime, sessionIdToIgnore) {
    var store = getStore();
    if (!store) return false;
    return store.getSessions().some(function (s) {
      if (s.id === sessionIdToIgnore) return false;
      if (s.status === 'cancelled') return false;
      return s.date === date && s.lessonTypeId === lessonTypeId && s.startTime === startTime;
    });
  }

  function getSlotsOverview(date, lessonTypeId, sessionIdToIgnore) {
    var store = getStore();
    if (!store) return [];
    return HOURLY_SLOTS.map(function (slot) {
      var end = addMinutes(slot, 50);
      var session = store.getSessions().find(function (s) {
        if (s.id === sessionIdToIgnore) return false;
        if (s.status === 'cancelled') return false;
        return s.date === date && s.lessonTypeId === lessonTypeId && s.startTime === slot;
      }) || null;
      var enrolled = session ? (session.enrolledStudentIds || []).length : 0;
      var pdrTeachers = store.getTeachers().filter(function (t) {
        return t.isActive && isTeacherPdr(t.id) &&
          isTeacherAvailable(t.id, date, slot, end) &&
          !hasPdrTeacherConflict(t.id, date, slot, end, sessionIdToIgnore);
      });
      var branchTeachers = store.getTeachers().filter(function (t) {
        return t.isActive && isBranchTeacherEligibleForLessonType(t.id, lessonTypeId) &&
          isTeacherAvailable(t.id, date, slot, end) &&
          !hasBranchTeacherConflict(t.id, date, slot, end, sessionIdToIgnore);
      });
      return {
        slot: slot,
        endTime: end,
        session: session,
        enrolled: enrolled,
        remaining: session ? Math.max(0, CAPACITY - enrolled) : CAPACITY,
        availablePdrTeachers: pdrTeachers.length,
        availableBranchTeachers: branchTeachers.length,
        availableTeachers: Math.min(pdrTeachers.length, branchTeachers.length),
        isFree: !session,
        hasConflict: hasSessionSlotConflict(date, lessonTypeId, slot, sessionIdToIgnore)
      };
    });
  }

  global.TMSchedulingRules = {
    CAPACITY: CAPACITY,
    DURATION_MIN: DURATION_MIN,
    PARENT_MIN: PARENT_MIN,
    STUDENT_MIN: STUDENT_MIN,
    HOURLY_SLOTS: HOURLY_SLOTS,
    addMinutes: addMinutes,
    isHourlySlot: isHourlySlot,
    isValidTrialLessonDuration: isValidTrialLessonDuration,
    isTeacherAvailable: isTeacherAvailable,
    hasTeacherConflict: hasTeacherConflict,
    hasPdrTeacherConflict: hasPdrTeacherConflict,
    hasBranchTeacherConflict: hasBranchTeacherConflict,
    isPdrTeacherAvailable: isPdrTeacherAvailable,
    isBranchTeacherAvailable: isBranchTeacherAvailable,
    isTeacherPdr: isTeacherPdr,
    isTeacherBranchTeacher: isTeacherBranchTeacher,
    isTeacherEligibleForLessonType: isTeacherEligibleForLessonType,
    isBranchTeacherEligibleForLessonType: isBranchTeacherEligibleForLessonType,
    canAssignTeachersToSession: canAssignTeachersToSession,
    sessionMissingTeachers: sessionMissingTeachers,
    sessionHasTeacher: sessionHasTeacher,
    getSessionRemainingCapacity: getSessionRemainingCapacity,
    hasStudentAlreadyUsedFreeTrialForLessonType: hasStudentAlreadyUsedFreeTrialForLessonType,
    canAssignStudentToSession: canAssignStudentToSession,
    getAffectedPeopleForSessionChange: getAffectedPeopleForSessionChange,
    validateSessionDraft: validateSessionDraft,
    hasSessionSlotConflict: hasSessionSlotConflict,
    getSlotsOverview: getSlotsOverview
  };
})(typeof window !== 'undefined' ? window : this);
