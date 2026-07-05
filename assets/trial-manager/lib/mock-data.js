/**
 * İlişkisel mock veri deposu — TMStore
 */
(function (global) {
  'use strict';

  var Audit = global.TMAuditUtils;
  var Rules = global.TMSchedulingRules;

  var CURRENT_USER_ID = 'user-manager-1';
  var STORAGE_KEY = 'bilenyum_tmstore_v1';

  function touch() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* depolama dolu veya kapalı */ }
  }

  function loadPersistedState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      Object.keys(state).forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(parsed, k)) state[k] = parsed[k];
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function resetMockData() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    initState();
    touch();
    return { ok: true };
  }

  function getMockStats() {
    var orphan = state.requests.filter(function (r) {
      if (r.status === 'rejected' || r.status === 'cancelled') return false;
      return !state.reservations.some(function (res) { return res.requestId === r.id; });
    });
    return {
      students: state.students.length,
      parents: state.parents.length,
      sessions: state.sessions.length,
      meetings: state.meetings.length,
      requests: state.requests.length,
      reservations: state.reservations.length,
      communicationLogs: state.communicationLogs.length,
      orphanRequests: orphan.length,
      persisted: (function () {
        try { return !!sessionStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
      })()
    };
  }

  function isoAt(daysOffset, hour, minute) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute || 0, 0, 0);
    return d.toISOString();
  }

  function dateKeyOffset(offset) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function todayKey() {
    return dateKeyOffset(0);
  }

  function randPass() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function randMeetingId() {
    return String(Math.floor(100000000 + Math.random() * 900000000));
  }

  var LESSON_TYPES = [
    { id: 'lt-mat', name: 'Matematik', defaultCapacity: 20, defaultDurationMinutes: 50, parentPresentationMinutes: 20, studentTrialMinutes: 30, isActive: true },
    { id: 'lt-fen', name: 'Fen', defaultCapacity: 20, defaultDurationMinutes: 50, parentPresentationMinutes: 20, studentTrialMinutes: 30, isActive: true }
  ];

  var GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
  var LEVELS = ['Başlangıç', 'Orta', 'İleri'];

  var TEACHER_NAMES = [
    ['Furkan', 'Çilingir', 'lt-mat'], ['Zeynep', 'Arslan', 'lt-mat'], ['Ayşe', 'Özkan', 'lt-mat'],
    ['Burak', 'Yılmaz', 'lt-mat'], ['Koray', 'Şen', 'lt-mat'], ['Selin', 'Korkmaz', 'lt-mat'],
    ['Can', 'Demir', 'lt-fen'], ['Emre', 'Yalçın', 'lt-fen'], ['Deniz', 'Kara', 'lt-fen'],
    ['Melis', 'Aktaş', 'lt-fen'], ['Hakan', 'Gürbüz', 'lt-fen'], ['Ebru', 'Çetin', 'lt-fen']
  ];

  function buildTeachers() {
    return TEACHER_NAMES.map(function (t, i) {
      var id = 'teacher-' + (i + 1);
      var avail = [];
      for (var dow = 1; dow <= 5; dow++) {
        avail.push({
          id: id + '-av-' + dow,
          teacherId: id,
          dayOfWeek: dow,
          startTime: '11:00',
          endTime: '15:00',
          isAvailable: true
        });
      }
      return {
        id: id,
        firstName: t[0],
        lastName: t[1],
        phone: '053' + String(i + 2) + ' ' + String(100 + i * 11) + ' ' + String(20 + i),
        email: t[0].toLowerCase() + '.' + t[1].toLowerCase().replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u') + '@bilenyum.com',
        branchLessonTypeIds: [t[2]],
        availability: avail,
        dashboardEnabled: true,
        isActive: true
      };
    });
  }

  var STUDENT_FIRST = ['Mira', 'Can', 'Elif', 'Arda', 'Selin', 'Emir', 'Lina', 'Kerem', 'Defne', 'Yiğit', 'Zeynep', 'Berk', 'Ece', 'Alp', 'Damla', 'Kaan', 'Asya', 'Deniz', 'Eren', 'Gizem', 'Baran', 'Ceren', 'Doruk', 'Fulya', 'Gökhan', 'Hazal', 'Ilgın', 'Jale', 'Kuzey', 'Lara', 'Mete', 'Nil', 'Ozan', 'Pelin', 'Rüya', 'Sarp', 'Tuana', 'Umut', 'Vildan', 'Yasin', 'Zara', 'Atlas', 'Belinay', 'Cemre', 'Dilan', 'Efe', 'Fırat', 'Gülce', 'Alper', 'Buse', 'Cem', 'Derya', 'Eda', 'Fahri', 'Gamze'];
  var STUDENT_LAST = ['Yılmaz', 'Kaya', 'Demir', 'Öztürk', 'Aksoy', 'Çelik', 'Şahin', 'Aydın', 'Koç', 'Polat', 'Arslan', 'Yıldız', 'Güneş', 'Kurt', 'Erdoğan', 'Tekin', 'Bulut', 'Acar', 'Taş', 'Uçar'];

  function buildParentsAndStudents() {
    var parents = [];
    var students = [];
    var total = 55;
    for (var i = 0; i < total; i++) {
      var pid = 'parent-' + (i + 1);
      var pFirst = ['Ayşe', 'Mehmet', 'Zeynep', 'Fatma', 'Burak', 'Deniz', 'Gül', 'Hakan', 'Seda', 'Emre'][i % 10];
      var pLast = STUDENT_LAST[i % STUDENT_LAST.length];
      var sid = 'student-' + (i + 1);
      var lessonTypeId = i % 2 === 0 ? 'lt-mat' : 'lt-fen';
      var age = 10 + (i % 5);
      var statuses = ['new_request', 'awaiting_assignment', 'scheduled', 'confirmed', 'attended', 'no_show', 'enrolled', 'cancelled', 'lost'];
      var status = statuses[i % statuses.length];

      parents.push({
        id: pid,
        firstName: pFirst,
        lastName: pLast,
        phone: '05' + String(30 + (i % 50)).padStart(2, '0') + ' ' + String(100 + i * 3) + ' ' + String(10 + (i % 89)).padStart(2, '0'),
        email: pFirst.toLowerCase() + '.' + pLast.toLowerCase() + i + '@mail.com',
        studentIds: [sid],
        preferredChannels: i % 3 === 0 ? ['whatsapp', 'phone'] : ['phone', 'email'],
        createdAt: isoAt(-30 + (i % 20), 10, 0),
        updatedAt: isoAt(-1, 14, 0)
      });

      var usedTrial = i % 17 === 0 ? [lessonTypeId] : [];
      students.push({
        id: sid,
        firstName: STUDENT_FIRST[i % STUDENT_FIRST.length],
        lastName: STUDENT_LAST[i % STUDENT_LAST.length],
        age: age,
        grade: GRADES[i % GRADES.length],
        level: LEVELS[i % LEVELS.length],
        requestedLessonTypeId: lessonTypeId,
        parentIds: [pid],
        status: status,
        hasUsedFreeTrialForLessonTypeIds: usedTrial,
        createdAt: isoAt(-25 + (i % 15), 9, 0),
        updatedAt: isoAt(-2, 11, 0)
      });
    }
    /* Bir velinin iki öğrencisi */
    parents[0].studentIds.push('student-56');
    students.push({
      id: 'student-56',
      firstName: 'Deniz',
      lastName: 'Yılmaz',
      age: 12,
      grade: '6. Sınıf',
      level: 'Orta',
      requestedLessonTypeId: 'lt-mat',
      parentIds: ['parent-1'],
      status: 'awaiting_assignment',
      hasUsedFreeTrialForLessonTypeIds: [],
      createdAt: isoAt(-5, 10, 0),
      updatedAt: isoAt(-1, 9, 0)
    });
    return { parents: parents, students: students };
  }

  function buildSessionsAndMeetings(teachers) {
    var sessions = [];
    var meetings = [];
    var slots = Rules ? Rules.HOURLY_SLOTS : ['11:00', '12:00', '13:00', '14:00'];
    var seq = 0;
    var matTeachers = teachers.filter(function (t) { return t.branchLessonTypeIds.indexOf('lt-mat') >= 0; });
    var fenTeachers = teachers.filter(function (t) { return t.branchLessonTypeIds.indexOf('lt-fen') >= 0; });

    for (var day = 0; day < 4; day++) {
      var date = dateKeyOffset(day);
      slots.forEach(function (startTime, slotIdx) {
        ['lt-mat', 'lt-fen'].forEach(function (ltId, ltIdx) {
          seq++;
          var teacherPool = ltId === 'lt-mat' ? matTeachers : fenTeachers;
          var teacher = teacherPool[(seq + slotIdx) % teacherPool.length];
          var endTime = Rules ? Rules.addMinutes(startTime, 50) : startTime.replace(':00', ':50');
          var sid = 'session-' + String(seq).padStart(4, '0');
          var mid = 'meeting-' + String(seq).padStart(4, '0');
          var ltName = ltId === 'lt-mat' ? 'Matematik' : 'Fen';
          var status = 'scheduled';
          if (day === 0 && slotIdx === 0 && ltId === 'lt-mat') status = 'confirmed';
          if (day === 1 && slotIdx === 2 && ltId === 'lt-fen') status = 'cancelled';
          if (day === 3 && slotIdx === 3 && ltId === 'lt-mat') status = 'completed';
          var meetingStatus = status === 'cancelled' ? 'cancelled' : (status === 'completed' ? 'expired' : 'active');

          meetings.push({
            id: mid,
            sessionId: sid,
            platform: 'internal_app',
            meetingUrl: 'https://app.bilenyum.com/ders/' + sid,
            meetingId: randMeetingId(),
            passcode: randPass(),
            status: meetingStatus,
            generatedAt: isoAt(-10, 8, 0),
            updatedAt: isoAt(-day, 9, 0)
          });

          sessions.push({
            id: sid,
            title: ltName + ' · ' + date + ' · ' + startTime,
            lessonTypeId: ltId,
            teacherId: teacher.id,
            date: date,
            startTime: startTime,
            endTime: endTime,
            capacity: 20,
            enrolledStudentIds: [],
            reservationIds: [],
            onlineMeetingId: mid,
            status: status,
            parentPresentationMinutes: 20,
            studentTrialMinutes: 30,
            teacherInformed: seq % 3 !== 0,
            teacherInformedAt: seq % 3 !== 0 ? isoAt(-2, 10, 0) : undefined,
            teacherInformedByUserId: seq % 3 !== 0 ? CURRENT_USER_ID : undefined,
            createdByUserId: CURRENT_USER_ID,
            createdAt: isoAt(-14, 8, 0),
            updatedAt: isoAt(-day, 8, 30)
          });
        });
      });
    }
    return { sessions: sessions, meetings: meetings };
  }

  function buildRequests(students, sessions) {
    var requests = [];
    var activeSessions = sessions.filter(function (s) { return s.status !== 'cancelled' && s.status !== 'completed'; });
    for (var i = 0; i < 35; i++) {
      var st = students[i % students.length];
      var parentId = st.parentIds[0];
      var parent = state.parents.find(function (p) { return p.id === parentId; });
      var session = activeSessions[i % activeSessions.length];
      var statuses = ['new', 'reviewing', 'assigned', 'rejected', 'cancelled'];
      var status = i < 10 ? 'new' : statuses[i % statuses.length];
      requests.push({
        id: 'request-' + String(i + 1).padStart(4, '0'),
        studentFirstName: st.firstName,
        studentLastName: st.lastName,
        studentAge: st.age,
        studentGrade: st.grade,
        studentLevel: st.level,
        requestedLessonTypeId: st.requestedLessonTypeId,
        parentFirstName: parent ? parent.firstName : 'Veli',
        parentLastName: parent ? parent.lastName : '—',
        parentPhone: parent ? parent.phone : '',
        parentEmail: parent ? parent.email : '',
        selectedSessionId: session ? session.id : undefined,
        status: status,
        source: 'website_form',
        createdAt: isoAt(-7 + (i % 5), 8 + (i % 10), 0),
        updatedAt: isoAt(-1, 12, 0)
      });
    }
    return requests;
  }

  function buildOrphanRequests(sessions) {
    var activeSessions = sessions.filter(function (s) { return s.status !== 'cancelled' && s.status !== 'completed'; });
    var demos = [
      { studentFirstName: 'Ece', studentLastName: 'Vural', studentAge: 11, studentGrade: '5. Sınıf', studentLevel: 'Orta', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Serkan', parentLastName: 'Vural', parentPhone: '0532 441 2218', parentEmail: 'serkan.vural@mail.com' },
      { studentFirstName: 'Baran', studentLastName: 'Güneş', studentAge: 12, studentGrade: '6. Sınıf', studentLevel: 'Başlangıç', requestedLessonTypeId: 'lt-fen', parentFirstName: 'Merve', parentLastName: 'Güneş', parentPhone: '0533 552 9031', parentEmail: 'merve.gunes@mail.com' },
      { studentFirstName: 'Lina', studentLastName: 'Koç', studentAge: 10, studentGrade: '4. Sınıf', studentLevel: 'Başlangıç', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Hakan', parentLastName: 'Koç', parentPhone: '0542 118 7744', parentEmail: 'hakan.koc@mail.com' },
      { studentFirstName: 'Arda', studentLastName: 'Tekin', studentAge: 13, studentGrade: '7. Sınıf', studentLevel: 'İleri', requestedLessonTypeId: 'lt-fen', parentFirstName: 'Seda', parentLastName: 'Tekin', parentPhone: '0555 902 3311', parentEmail: 'seda.tekin@mail.com' },
      { studentFirstName: 'Nil', studentLastName: 'Akar', studentAge: 11, studentGrade: '5. Sınıf', studentLevel: 'Orta', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Volkan', parentLastName: 'Akar', parentPhone: '0506 771 2409', parentEmail: 'volkan.akar@mail.com' }
    ];
    return demos.map(function (d, i) {
      var session = activeSessions[i % activeSessions.length];
      return {
        id: 'request-orphan-' + String(i + 1).padStart(2, '0'),
        studentFirstName: d.studentFirstName,
        studentLastName: d.studentLastName,
        studentAge: d.studentAge,
        studentGrade: d.studentGrade,
        studentLevel: d.studentLevel,
        requestedLessonTypeId: d.requestedLessonTypeId,
        parentFirstName: d.parentFirstName,
        parentLastName: d.parentLastName,
        parentPhone: d.parentPhone,
        parentEmail: d.parentEmail,
        selectedSessionId: session ? session.id : undefined,
        status: 'new',
        source: 'website_form',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }

  function buildReservations(students, sessions, requests) {
    var reservations = [];
    var rSeq = 0;
    var approvalStatuses = ['not_called', 'unreachable', 'approved', 'rejected', 'call_again'];
    var resStatuses = ['pending', 'confirmed', 'cancelled', 'rescheduled', 'attended', 'no_show'];

    sessions.forEach(function (session, si) {
      if (session.status === 'cancelled') return;
      var count = si % 5 === 0 ? 18 : (si % 3 === 0 ? 12 : (si % 2 === 0 ? 6 : 3));
      if (session.status === 'completed') count = 15;
      var matchingStudents = students.filter(function (st) {
        return st.requestedLessonTypeId === session.lessonTypeId &&
          st.hasUsedFreeTrialForLessonTypeIds.indexOf(session.lessonTypeId) < 0;
      });
      for (var j = 0; j < count && j < matchingStudents.length; j++) {
        rSeq++;
        var st = matchingStudents[(si * 7 + j) % matchingStudents.length];
        var parentId = st.parentIds[0];
        var req = requests.find(function (rq) {
          return rq.studentFirstName === st.firstName && rq.studentLastName === st.lastName && rq.status !== 'new';
        });
        var status = resStatuses[(si + j) % resStatuses.length];
        if (session.status === 'completed') status = j % 4 === 0 ? 'no_show' : 'attended';
        if (session.status === 'cancelled') status = 'cancelled';
        var parentApproval = approvalStatuses[(si + j) % approvalStatuses.length];
        if (status === 'confirmed' || status === 'attended') parentApproval = 'approved';
        var linkSent = parentApproval === 'approved' && j % 3 !== 0;

        var rid = 'res-' + String(rSeq).padStart(4, '0');
        reservations.push({
          id: rid,
          requestId: req ? req.id : undefined,
          studentId: st.id,
          parentId: parentId,
          sessionId: session.id,
          lessonTypeId: session.lessonTypeId,
          status: status,
          parentApprovalStatus: parentApproval,
          linkSent: linkSent,
          linkSentAt: linkSent ? isoAt(-1, 15, 0) : undefined,
          linkSentByUserId: linkSent ? CURRENT_USER_ID : undefined,
          teacherInformed: session.teacherInformed,
          communicationLogIds: [],
          enrolled: status === 'attended' && j % 5 === 0,
          createdAt: isoAt(-5, 10, 0),
          updatedAt: isoAt(-1, 16, 0)
        });
        session.enrolledStudentIds.push(st.id);
        session.reservationIds.push(rid);
      }
    });
    return reservations;
  }

  function buildCommunicationLogs(reservations) {
    var logs = [];
    reservations.slice(0, 40).forEach(function (r, i) {
      var channels = ['phone', 'whatsapp', 'sms', 'email'];
      var results = ['approved', 'unreachable', 'call_again', 'message_sent', 'link_sent'];
      logs.push({
        id: 'comm-' + String(i + 1).padStart(4, '0'),
        studentId: r.studentId,
        parentId: r.parentId,
        reservationId: r.id,
        sessionId: r.sessionId,
        channel: channels[i % channels.length],
        result: results[i % results.length],
        summary: 'Veli ile görüşüldü. ' + (i % 2 === 0 ? 'Onay alındı.' : 'Tekrar aranacak.'),
        nextAction: i % 3 === 0 ? 'Link gönder' : undefined,
        nextActionDate: i % 3 === 0 ? dateKeyOffset(1) : undefined,
        createdByUserId: CURRENT_USER_ID,
        createdAt: isoAt(-3 + (i % 3), 10 + (i % 8), 0)
      });
      r.communicationLogIds.push('comm-' + String(i + 1).padStart(4, '0'));
    });
    return logs;
  }

  function buildAuditLogs(sessions, reservations) {
    var logs = [];
    sessions.slice(0, 15).forEach(function (s, i) {
      logs.push({
        id: 'AUD-' + String(i + 1).padStart(5, '0'),
        entityType: 'trial_lesson_session',
        entityId: s.id,
        action: i % 2 === 0 ? 'created' : 'updated',
        description: 'Ders oturumu oluşturuldu / güncellendi.',
        createdByUserId: CURRENT_USER_ID,
        createdAt: s.createdAt
      });
    });
    reservations.slice(0, 10).forEach(function (r, i) {
      logs.push({
        id: 'AUD-' + String(20 + i).padStart(5, '0'),
        entityType: 'reservation',
        entityId: r.id,
        action: 'student_assigned',
        description: 'Öğrenci derse atandı.',
        createdByUserId: CURRENT_USER_ID,
        createdAt: r.createdAt
      });
    });
    return logs;
  }

  var ADMIN_USERS = [
    { id: 'user-manager-1', firstName: 'Elif', lastName: 'Yıldırım', email: 'elif.yildirim@bilenyum.com', role: 'trial_lesson_manager', canView: true, canCreate: true, canEdit: true, canCancel: true, canExport: true, isActive: true },
    { id: 'user-admin-1', firstName: 'Admin', lastName: 'Kullanıcı', email: 'admin@bilenyum.com', role: 'super_admin', canView: true, canCreate: true, canEdit: true, canCancel: true, canExport: true, isActive: true },
    { id: 'user-viewer-1', firstName: 'Gözlem', lastName: 'Kullanıcı', email: 'gozlem@bilenyum.com', role: 'viewer', canView: true, canCreate: false, canEdit: false, canCancel: false, canExport: true, isActive: true }
  ];

  var state = {
    lessonTypes: LESSON_TYPES,
    teachers: [],
    students: [],
    parents: [],
    sessions: [],
    meetings: [],
    requests: [],
    reservations: [],
    communicationLogs: [],
    auditLogs: [],
    users: ADMIN_USERS,
    currentUserId: CURRENT_USER_ID
  };

  function initState() {
    state.teachers = buildTeachers();
    var ps = buildParentsAndStudents();
    state.parents = ps.parents;
    state.students = ps.students;
    var sm = buildSessionsAndMeetings(state.teachers);
    state.sessions = sm.sessions;
    state.meetings = sm.meetings;
    state.requests = buildRequests(state.students, state.sessions).concat(buildOrphanRequests(state.sessions));
    state.reservations = buildReservations(state.students, state.sessions, state.requests);
    state.communicationLogs = buildCommunicationLogs(state.reservations);
    state.auditLogs = buildAuditLogs(state.sessions, state.reservations);
  }

  if (!loadPersistedState()) initState();
  else touch();

  function find(arr, id) {
    return arr.find(function (x) { return x.id === id; }) || null;
  }

  function createOnlineMeeting(sessionId) {
    var mid = 'meeting-' + String(state.meetings.length + 1).padStart(4, '0');
    var meeting = {
      id: mid,
      sessionId: sessionId,
      platform: 'internal_app',
      meetingUrl: 'https://app.bilenyum.com/ders/' + sessionId,
      meetingId: randMeetingId(),
      passcode: randPass(),
      status: 'active',
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.meetings.push(meeting);
    return meeting;
  }

  function createSession(draft) {
    var issues = Rules ? Rules.validateSessionDraft(draft) : [];
    if (issues.length) return { ok: false, error: issues.join(' ') };
    var seq = state.sessions.length + 1;
    var sid = 'session-' + String(seq).padStart(4, '0');
    var meeting = createOnlineMeeting(sid);
    var lt = find(state.lessonTypes, draft.lessonTypeId);
    var session = {
      id: sid,
      title: (lt ? lt.name : 'Ders') + ' · ' + draft.date + ' · ' + draft.startTime,
      lessonTypeId: draft.lessonTypeId,
      teacherId: draft.teacherId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      capacity: 20,
      enrolledStudentIds: [],
      reservationIds: [],
      onlineMeetingId: meeting.id,
      status: draft.status || 'scheduled',
      parentPresentationMinutes: 20,
      studentTrialMinutes: 30,
      teacherInformed: false,
      notes: draft.notes,
      createdByUserId: state.currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.sessions.push(session);
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sid,
        action: 'created',
        description: 'Online deneme dersi planlandı.'
      });
    }
    touch();
    return { ok: true, session: session, meeting: meeting };
  }

  function cancelSession(sessionId, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'İptal nedeni zorunludur.' };
    var prev = session.status;
    session.status = 'cancelled';
    session.updatedAt = new Date().toISOString();
    var meeting = find(state.meetings, session.onlineMeetingId);
    if (meeting) {
      meeting.status = 'cancelled';
      meeting.updatedAt = new Date().toISOString();
    }
    state.reservations.filter(function (r) { return r.sessionId === sessionId && r.status !== 'cancelled'; }).forEach(function (r) {
      r.status = 'cancelled';
      r.cancellationReason = reason;
      r.updatedAt = new Date().toISOString();
    });
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'cancelled',
        description: 'Ders iptal edildi.',
        reason: reason,
        previousValue: prev,
        newValue: 'cancelled'
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function changeSessionTeacher(sessionId, newTeacherId, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'Değişiklik nedeni zorunludur.' };
    if (!Rules) return { ok: false, error: 'Planlama kuralları yüklenemedi.' };
    if (!Rules.isTeacherEligibleForLessonType(newTeacherId, session.lessonTypeId)) {
      return { ok: false, error: 'Öğretmen branş uyumsuz.' };
    }
    if (!Rules.isTeacherAvailable(newTeacherId, session.date, session.startTime, session.endTime)) {
      return { ok: false, error: 'Öğretmen bu saatte müsait değil.' };
    }
    if (Rules.hasTeacherConflict(newTeacherId, session.date, session.startTime, session.endTime, sessionId)) {
      return { ok: false, error: 'Öğretmen aynı saatte başka derste.' };
    }
    var prev = session.teacherId;
    session.teacherId = newTeacherId;
    session.teacherInformed = false;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'teacher_changed',
        description: 'Öğretmen değiştirildi.',
        reason: reason,
        previousValue: prev,
        newValue: newTeacherId
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function rescheduleSession(sessionId, newDate, newStartTime, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'Değişiklik nedeni zorunludur.' };
    if (!Rules) return { ok: false, error: 'Planlama kuralları yüklenemedi.' };
    var newEnd = Rules.addMinutes(newStartTime, 50);
    if (!Rules.isValidTrialLessonDuration(newStartTime, newEnd)) {
      return { ok: false, error: 'Geçersiz saat aralığı.' };
    }
    if (Rules.hasSessionSlotConflict(newDate, session.lessonTypeId, newStartTime, sessionId)) {
      return { ok: false, error: 'Aynı tarih ve saatte bu ders türünde başka oturum var.' };
    }
    if (!Rules.isTeacherAvailable(session.teacherId, newDate, newStartTime, newEnd)) {
      return { ok: false, error: 'Öğretmen yeni saatte müsait değil.' };
    }
    if (Rules.hasTeacherConflict(session.teacherId, newDate, newStartTime, newEnd, sessionId)) {
      return { ok: false, error: 'Öğretmen çakışması.' };
    }
    var prev = { date: session.date, startTime: session.startTime };
    session.date = newDate;
    session.startTime = newStartTime;
    session.endTime = newEnd;
    session.status = session.status === 'cancelled' ? session.status : 'rescheduled';
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'time_changed',
        description: 'Ders saati değiştirildi.',
        reason: reason,
        previousValue: prev,
        newValue: { date: newDate, startTime: newStartTime }
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function changeSessionLessonType(sessionId, newLessonTypeId, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'Değişiklik nedeni zorunludur.' };
    if (session.lessonTypeId === newLessonTypeId) return { ok: true, session: session };
    if (!Rules) return { ok: false, error: 'Planlama kuralları yüklenemedi.' };
    if (!Rules.isTeacherEligibleForLessonType(session.teacherId, newLessonTypeId)) {
      return { ok: false, error: 'Mevcut öğretmen seçilen ders türüne uygun değil. Önce öğretmeni değiştirin.' };
    }
    if (Rules.hasSessionSlotConflict(session.date, newLessonTypeId, session.startTime, sessionId)) {
      return { ok: false, error: 'Bu tarih ve saatte seçilen ders türü için zaten oturum var.' };
    }
    var prev = session.lessonTypeId;
    var lt = find(state.lessonTypes, newLessonTypeId);
    session.lessonTypeId = newLessonTypeId;
    session.title = (lt ? lt.name : 'Ders') + ' · ' + session.date + ' · ' + session.startTime;
    session.teacherInformed = false;
    session.updatedAt = new Date().toISOString();
    state.reservations.filter(function (r) { return r.sessionId === sessionId; }).forEach(function (r) {
      r.lessonTypeId = newLessonTypeId;
      r.updatedAt = new Date().toISOString();
    });
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'lesson_type_changed',
        description: 'Ders türü değiştirildi.',
        reason: reason,
        previousValue: prev,
        newValue: newLessonTypeId
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function switchCurrentUser(userId) {
    var user = find(state.users, userId);
    if (!user) return { ok: false, error: 'Kullanıcı bulunamadı.' };
    if (!user.isActive) return { ok: false, error: 'Kullanıcı pasif.' };
    state.currentUserId = userId;
    touch();
    return { ok: true, user: user };
  }

  function refreshMeetingPasscode(meetingId, reason) {
    var meeting = find(state.meetings, meetingId);
    if (!meeting) return { ok: false, error: 'Toplantı bulunamadı.' };
    var prev = meeting.passcode;
    meeting.passcode = randPass();
    meeting.lastPasscodeChangedAt = new Date().toISOString();
    meeting.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'online_meeting',
        entityId: meetingId,
        action: 'passcode_changed',
        description: 'Toplantı şifresi yenilendi.',
        reason: reason,
        previousValue: prev,
        newValue: meeting.passcode
      });
    }
    touch();
    return { ok: true, meeting: meeting };
  }

  function markLinkSent(reservationId) {
    var r = find(state.reservations, reservationId);
    if (!r) return { ok: false, error: 'Rezervasyon bulunamadı.' };
    if (r.parentApprovalStatus !== 'approved') {
      return { ok: false, error: 'Veli onayı olmadan link gönderildi işaretlenemez.' };
    }
    r.linkSent = true;
    r.linkSentAt = new Date().toISOString();
    r.linkSentByUserId = state.currentUserId;
    r.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'reservation',
        entityId: reservationId,
        action: 'link_sent',
        description: 'Link gönderildi olarak işaretlendi.'
      });
    }
    touch();
    return { ok: true, reservation: r };
  }

  function markTeacherInformed(sessionId) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false };
    session.teacherInformed = true;
    session.teacherInformedAt = new Date().toISOString();
    session.teacherInformedByUserId = state.currentUserId;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'teacher_informed',
        description: 'Öğretmen bilgilendirildi olarak işaretlendi.'
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function addCommunicationLog(entry) {
    var id = 'comm-' + String(state.communicationLogs.length + 1).padStart(4, '0');
    var log = {
      id: id,
      studentId: entry.studentId,
      parentId: entry.parentId,
      teacherId: entry.teacherId,
      reservationId: entry.reservationId,
      sessionId: entry.sessionId,
      channel: entry.channel,
      result: entry.result,
      summary: entry.summary || '',
      nextAction: entry.nextAction,
      nextActionDate: entry.nextActionDate,
      createdByUserId: state.currentUserId,
      createdAt: new Date().toISOString()
    };
    state.communicationLogs.unshift(log);
    if (entry.reservationId) {
      var r = find(state.reservations, entry.reservationId);
      if (r) r.communicationLogIds.push(id);
    }
    touch();
    return log;
  }

  function markAttendance(sessionId, results) {
    results.forEach(function (item) {
      var r = find(state.reservations, item.reservationId);
      if (!r || r.sessionId !== sessionId) return;
      r.status = item.attended ? 'attended' : 'no_show';
      r.enrolled = !!item.enrolled;
      r.notes = item.notes || r.notes;
      r.updatedAt = new Date().toISOString();
      var st = find(state.students, r.studentId);
      if (st) {
        st.status = item.enrolled ? 'enrolled' : (item.attended ? 'attended' : 'no_show');
        if (item.attended || item.enrolled) {
          if (st.hasUsedFreeTrialForLessonTypeIds.indexOf(r.lessonTypeId) < 0) {
            st.hasUsedFreeTrialForLessonTypeIds.push(r.lessonTypeId);
          }
        }
      }
    });
    var session = find(state.sessions, sessionId);
    if (session && session.status !== 'cancelled') {
      session.status = 'completed';
      session.updatedAt = new Date().toISOString();
      var meeting = find(state.meetings, session.onlineMeetingId);
      if (meeting) meeting.status = 'expired';
    }
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'attendance_marked',
        description: 'Katılım sonuçları girildi.'
      });
    }
    touch();
    return { ok: true };
  }

  function getReservationByRequestId(requestId) {
    return state.reservations.find(function (r) { return r.requestId === requestId; }) || null;
  }

  function isOrphanRequest(requestId) {
    var req = find(state.requests, requestId);
    if (!req || req.status === 'rejected' || req.status === 'cancelled') return false;
    return !getReservationByRequestId(requestId);
  }

  function approveParentForRequest(requestId) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    var res = getReservationByRequestId(requestId);
    if (res) {
      res.parentApprovalStatus = 'approved';
      res.status = 'confirmed';
      res.updatedAt = new Date().toISOString();
    }
    req.status = 'assigned';
    req.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_request',
        entityId: requestId,
        action: 'parent_approved',
        description: 'Veli onayı işaretlendi.'
      });
    }
    touch();
    return { ok: true, request: req, reservation: res };
  }

  function updateParentApproval(reservationId, status) {
    var r = find(state.reservations, reservationId);
    if (!r) return { ok: false, error: 'Rezervasyon bulunamadı.' };
    r.parentApprovalStatus = status;
    r.updatedAt = new Date().toISOString();
    touch();
    return { ok: true, reservation: r };
  }

  function findStudentForRequest(req) {
    return state.students.find(function (st) {
      return st.firstName === req.studentFirstName && st.lastName === req.studentLastName;
    }) || null;
  }

  function findParentForRequest(req) {
    var digits = String(req.parentPhone || '').replace(/\D/g, '');
    return state.parents.find(function (p) {
      return String(p.phone || '').replace(/\D/g, '') === digits;
    }) || null;
  }

  function createReservationFromRequest(requestId) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    var existing = getReservationByRequestId(requestId);
    if (existing) return { ok: true, reservation: existing, created: false };
    if (!req.selectedSessionId) return { ok: false, error: 'Talepte seçili ders yok.' };
    var session = find(state.sessions, req.selectedSessionId);
    if (!session) return { ok: false, error: 'Seçili ders bulunamadı.' };
    if (session.status === 'cancelled') return { ok: false, error: 'Seçili ders iptal edilmiş.' };

    var student = findStudentForRequest(req);
    var parent = findParentForRequest(req);

    if (!parent) {
      var pSeq = state.parents.length + 1;
      var pid = 'parent-' + String(pSeq).padStart(4, '0');
      parent = {
        id: pid,
        firstName: req.parentFirstName,
        lastName: req.parentLastName,
        phone: req.parentPhone,
        email: req.parentEmail,
        studentIds: [],
        preferredChannels: ['phone', 'whatsapp'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.parents.push(parent);
    }

    if (!student) {
      var sSeq = state.students.length + 1;
      var sid = 'student-' + String(sSeq).padStart(4, '0');
      student = {
        id: sid,
        firstName: req.studentFirstName,
        lastName: req.studentLastName,
        age: req.studentAge,
        grade: req.studentGrade,
        level: req.studentLevel,
        requestedLessonTypeId: req.requestedLessonTypeId,
        parentIds: [parent.id],
        status: 'awaiting_assignment',
        hasUsedFreeTrialForLessonTypeIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.students.push(student);
      if (parent.studentIds.indexOf(student.id) < 0) parent.studentIds.push(student.id);
    } else if (parent.studentIds.indexOf(student.id) < 0) {
      parent.studentIds.push(student.id);
      if (student.parentIds.indexOf(parent.id) < 0) student.parentIds.push(parent.id);
    }

    if (Rules) {
      var check = Rules.canAssignStudentToSession(student.id, session.id);
      if (!check.allowed) return { ok: false, error: check.reason };
    }

    var rSeq = state.reservations.length + 1;
    var rid = 'res-' + String(rSeq).padStart(4, '0');
    var reservation = {
      id: rid,
      requestId: requestId,
      studentId: student.id,
      parentId: parent.id,
      sessionId: session.id,
      lessonTypeId: session.lessonTypeId,
      status: 'pending',
      parentApprovalStatus: 'not_called',
      linkSent: false,
      teacherInformed: session.teacherInformed,
      communicationLogIds: [],
      enrolled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.reservations.push(reservation);
    session.enrolledStudentIds.push(student.id);
    session.reservationIds.push(rid);
    session.updatedAt = new Date().toISOString();
    if (req.status === 'new' || req.status === 'reviewing') {
      req.status = 'assigned';
    }
    req.updatedAt = new Date().toISOString();

    if (Audit) {
      Audit.append(state, {
        entityType: 'reservation',
        entityId: rid,
        action: 'student_assigned',
        description: 'Talepten rezervasyon oluşturuldu.'
      });
    }
    touch();
    return { ok: true, reservation: reservation, created: true };
  }

  function updateSessionNotes(sessionId, notes) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    session.notes = notes || '';
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'updated',
        description: 'Ders notu güncellendi.'
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function rejectRequest(requestId, reason) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'Red nedeni zorunludur.' };
    req.status = 'rejected';
    req.updatedAt = new Date().toISOString();
    var res = getReservationByRequestId(requestId);
    if (res && res.status !== 'cancelled') {
      res.status = 'cancelled';
      res.cancellationReason = reason;
      res.updatedAt = new Date().toISOString();
      var session = find(state.sessions, res.sessionId);
      if (session) {
        var idx = session.enrolledStudentIds.indexOf(res.studentId);
        if (idx >= 0) session.enrolledStudentIds.splice(idx, 1);
        var ridx = session.reservationIds.indexOf(res.id);
        if (ridx >= 0) session.reservationIds.splice(ridx, 1);
      }
    }
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_request',
        entityId: requestId,
        action: 'request_rejected',
        description: 'Talep reddedildi.',
        reason: reason
      });
    }
    touch();
    return { ok: true, request: req };
  }

  function assignRequestToSession(requestId, sessionId) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (session.status === 'cancelled') return { ok: false, error: 'Ders iptal edilmiş.' };
    if (session.lessonTypeId !== req.requestedLessonTypeId) {
      return { ok: false, error: 'Ders türü taleple uyuşmuyor.' };
    }
    if (Rules && Rules.getSessionRemainingCapacity(sessionId) <= 0) {
      return { ok: false, error: 'Seçilen dersin kapasitesi dolu.' };
    }
    req.selectedSessionId = sessionId;
    if (req.status === 'new') req.status = 'reviewing';
    req.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_request',
        entityId: requestId,
        action: 'updated',
        description: 'Talep derse atandı: ' + sessionId
      });
    }
    touch();
    return { ok: true, request: req, session: session };
  }

  function getAvailableSessionsForLessonType(lessonTypeId) {
    var today = todayKey();
    return state.sessions.filter(function (s) {
      if (s.lessonTypeId !== lessonTypeId) return false;
      if (s.status === 'cancelled' || s.status === 'completed') return false;
      if (s.date < today) return false;
      if (Rules && Rules.getSessionRemainingCapacity(s.id) <= 0) return false;
      return true;
    }).sort(function (a, b) {
      return a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date);
    });
  }

  function convertStudentToEnrollment(studentId) {
    var st = find(state.students, studentId);
    if (!st) return { ok: false, error: 'Öğrenci bulunamadı.' };
    st.status = 'enrolled';
    st.updatedAt = new Date().toISOString();
    state.reservations.filter(function (r) {
      return r.studentId === studentId && r.status === 'attended';
    }).forEach(function (r) {
      r.enrolled = true;
      r.updatedAt = new Date().toISOString();
    });
    if (Audit) {
      Audit.append(state, {
        entityType: 'student',
        entityId: studentId,
        action: 'converted_to_enrollment',
        description: 'Öğrenci kayda dönüştürüldü.'
      });
    }
    touch();
    return { ok: true, student: st };
  }

  function markBulkLinksSentForSession(sessionId) {
    var count = 0;
    state.reservations.filter(function (r) {
      return r.sessionId === sessionId && r.parentApprovalStatus === 'approved' && !r.linkSent;
    }).forEach(function (r) {
      var res = markLinkSent(r.id);
      if (res.ok) count += 1;
    });
    touch();
    return { ok: true, count: count };
  }

  function createSimulatedRequest(draft) {
    draft = draft || {};
    var seq = state.requests.length + 1;
    var id = 'request-' + String(seq).padStart(4, '0');
    var pools = [
      { studentFirstName: 'Melis', studentLastName: 'Ergin', studentAge: 10, studentGrade: '4. Sınıf', studentLevel: 'Başlangıç', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Umut', parentLastName: 'Ergin', parentPhone: '0531 220 8891', parentEmail: 'umut.ergin@mail.com' },
      { studentFirstName: 'Kaan', studentLastName: 'Polat', studentAge: 12, studentGrade: '6. Sınıf', studentLevel: 'Orta', requestedLessonTypeId: 'lt-fen', parentFirstName: 'İrem', parentLastName: 'Polat', parentPhone: '0538 441 0021', parentEmail: 'irem.polat@mail.com' }
    ];
    var sample = pools[seq % pools.length];
    var sessions = getAvailableSessionsForLessonType(sample.requestedLessonTypeId);
    var session = sessions[0] || state.sessions.find(function (s) { return s.status !== 'cancelled'; });
    var req = {
      id: id,
      studentFirstName: draft.studentFirstName || sample.studentFirstName,
      studentLastName: draft.studentLastName || sample.studentLastName,
      studentAge: draft.studentAge || sample.studentAge,
      studentGrade: draft.studentGrade || sample.studentGrade,
      studentLevel: draft.studentLevel || sample.studentLevel,
      requestedLessonTypeId: draft.requestedLessonTypeId || sample.requestedLessonTypeId,
      parentFirstName: draft.parentFirstName || sample.parentFirstName,
      parentLastName: draft.parentLastName || sample.parentLastName,
      parentPhone: draft.parentPhone || sample.parentPhone,
      parentEmail: draft.parentEmail || sample.parentEmail,
      selectedSessionId: draft.selectedSessionId || (session ? session.id : undefined),
      status: 'new',
      source: 'website_form',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.requests.unshift(req);
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_request',
        entityId: id,
        action: 'created',
        description: 'Web formundan yeni talep simüle edildi.'
      });
    }
    touch();
    return { ok: true, request: req };
  }

  function updateUserPermissions(userId, perms) {
    var user = find(state.users, userId);
    if (!user) return { ok: false };
    var prev = { canView: user.canView, canCreate: user.canCreate, canEdit: user.canEdit, canCancel: user.canCancel, canExport: user.canExport };
    Object.keys(perms).forEach(function (k) { if (k in user) user[k] = perms[k]; });
    if (Audit) {
      Audit.append(state, {
        entityType: 'user',
        entityId: userId,
        action: 'permission_changed',
        description: 'Kullanıcı yetkileri güncellendi.',
        previousValue: prev,
        newValue: perms
      });
    }
    touch();
    return { ok: true, user: user };
  }

  function getSessionWithDetails(sessionId) {
    var session = find(state.sessions, sessionId);
    if (!session) return null;
    var meeting = find(state.meetings, session.onlineMeetingId);
    var teacher = find(state.teachers, session.teacherId);
    var lessonType = find(state.lessonTypes, session.lessonTypeId);
    var reservations = state.reservations.filter(function (r) { return r.sessionId === sessionId; });
    var participants = reservations.map(function (r) {
      var st = find(state.students, r.studentId);
      var pa = find(state.parents, r.parentId);
      return { reservation: r, student: st, parent: pa };
    });
    return { session: session, meeting: meeting, teacher: teacher, lessonType: lessonType, reservations: reservations, participants: participants };
  }

  function getOperationMetrics() {
    var today = todayKey();
    var todaySessions = state.sessions.filter(function (s) { return s.date === today && s.status !== 'cancelled'; });
    var pendingApproval = state.reservations.filter(function (r) {
      return r.status === 'pending' || r.parentApprovalStatus === 'not_called' || r.parentApprovalStatus === 'call_again';
    });
    var linkNotSent = state.reservations.filter(function (r) {
      return r.status === 'confirmed' && r.parentApprovalStatus === 'approved' && !r.linkSent;
    });
    var teacherNotInformed = state.sessions.filter(function (s) {
      return s.status !== 'cancelled' && s.status !== 'completed' && !s.teacherInformed;
    });
    var cancelled = state.sessions.filter(function (s) { return s.status === 'cancelled'; });
    var needsAttendance = state.sessions.filter(function (s) {
      return s.status === 'completed' || (s.date < today && s.status === 'confirmed');
    }).filter(function (s) {
      return state.reservations.some(function (r) {
        return r.sessionId === s.id && r.status === 'confirmed';
      });
    });
    var enrolled = state.students.filter(function (s) { return s.status === 'enrolled'; });
    var orphanRequests = state.requests.filter(function (r) {
      return isOrphanRequest(r.id);
    });
    var studentCountToday = 0;
    todaySessions.forEach(function (s) { studentCountToday += s.enrolledStudentIds.length; });
    var actionableCount = pendingApproval.length + linkNotSent.length + orphanRequests.length +
      teacherNotInformed.length + needsAttendance.length;

    return {
      todaySessionCount: todaySessions.length,
      todayStudentCount: studentCountToday,
      pendingApprovalCount: pendingApproval.length,
      linkNotSentCount: linkNotSent.length,
      teacherNotInformedCount: teacherNotInformed.length,
      cancelledCount: cancelled.length,
      needsAttendanceCount: needsAttendance.length,
      conversionCount: enrolled.length,
      orphanRequestCount: orphanRequests.length,
      actionableCount: actionableCount,
      todaySessions: todaySessions,
      pendingApproval: pendingApproval,
      linkNotSent: linkNotSent,
      teacherNotInformed: teacherNotInformed,
      needsAttendance: needsAttendance,
      orphanRequests: orphanRequests
    };
  }

  global.TMStore = {
    getLessonTypes: function () { return state.lessonTypes.slice(); },
    getTeachers: function () { return state.teachers.slice(); },
    getStudents: function () { return state.students.slice(); },
    getParents: function () { return state.parents.slice(); },
    getSessions: function () { return state.sessions.slice(); },
    getMeetings: function () { return state.meetings.slice(); },
    getRequests: function () { return state.requests.slice(); },
    getReservations: function () { return state.reservations.slice(); },
    getCommunicationLogs: function () { return state.communicationLogs.slice(); },
    getAuditLogs: function () { return state.auditLogs.slice(); },
    getUsers: function () { return state.users.slice(); },
    getCurrentUser: function () { return find(state.users, state.currentUserId); },
    getLessonTypeById: function (id) { return find(state.lessonTypes, id); },
    getTeacherById: function (id) { return find(state.teachers, id); },
    getStudentById: function (id) { return find(state.students, id); },
    getParentById: function (id) { return find(state.parents, id); },
    getSessionById: function (id) { return find(state.sessions, id); },
    getMeetingById: function (id) { return find(state.meetings, id); },
    getRequestById: function (id) { return find(state.requests, id); },
    getReservationById: function (id) { return find(state.reservations, id); },
    getReservationByRequestId: getReservationByRequestId,
    isOrphanRequest: isOrphanRequest,
    approveParentForRequest: approveParentForRequest,
    updateParentApproval: updateParentApproval,
    createReservationFromRequest: createReservationFromRequest,
    updateSessionNotes: updateSessionNotes,
    rejectRequest: rejectRequest,
    assignRequestToSession: assignRequestToSession,
    getAvailableSessionsForLessonType: getAvailableSessionsForLessonType,
    convertStudentToEnrollment: convertStudentToEnrollment,
    markBulkLinksSentForSession: markBulkLinksSentForSession,
    getMeetingBySessionId: function (sessionId) {
      var s = find(state.sessions, sessionId);
      return s ? find(state.meetings, s.onlineMeetingId) : null;
    },
    getSessionWithDetails: getSessionWithDetails,
    getOperationMetrics: getOperationMetrics,
    getReservationsForSession: function (sessionId) {
      return state.reservations.filter(function (r) { return r.sessionId === sessionId; });
    },
    getReservationsForStudent: function (studentId) {
      return state.reservations.filter(function (r) { return r.studentId === studentId; });
    },
    getReservationsForParent: function (parentId) {
      return state.reservations.filter(function (r) { return r.parentId === parentId; });
    },
    getSessionsForTeacher: function (teacherId) {
      return state.sessions.filter(function (s) { return s.teacherId === teacherId; });
    },
    todayKey: todayKey,
    createSession: createSession,
    cancelSession: cancelSession,
    changeSessionTeacher: changeSessionTeacher,
    changeSessionLessonType: changeSessionLessonType,
    rescheduleSession: rescheduleSession,
    refreshMeetingPasscode: refreshMeetingPasscode,
    markLinkSent: markLinkSent,
    markTeacherInformed: markTeacherInformed,
    addCommunicationLog: addCommunicationLog,
    markAttendance: markAttendance,
    updateUserPermissions: updateUserPermissions,
    resetMockData: resetMockData,
    getMockStats: getMockStats,
    createSimulatedRequest: createSimulatedRequest,
    switchCurrentUser: switchCurrentUser,
    _state: state
  };
})(typeof window !== 'undefined' ? window : this);
