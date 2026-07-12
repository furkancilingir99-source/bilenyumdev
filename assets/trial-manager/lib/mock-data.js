/**
 * İlişkisel mock veri deposu — TMStore
 */
(function (global) {
  'use strict';

  var Audit = global.TMAuditUtils;
  var Rules = global.TMSchedulingRules;
  // scheduling-rules.js bu dosyadan SONRA yüklenebilir; o yüzden Rules başta
  // undefined kalır ve tüm kural doğrulamaları (kapasite, ücretsiz deneme,
  // öğretmen uygunluğu) sessizce atlanırdı. Senkron script grubu bittikten
  // sonra closure referansını yeniden bağla, böylece tüm metotlar gerçek
  // kural motorunu görür.
  function resolveRules() {
    if (!Rules) { Rules = global.TMSchedulingRules; }
    if (!Audit) { Audit = global.TMAuditUtils; }
  }
  if (!Rules && global.setTimeout) { global.setTimeout(resolveRules, 0); }
  if (global.document && global.document.addEventListener) {
    global.document.addEventListener('DOMContentLoaded', resolveRules);
  }

  var CURRENT_USER_ID = 'user-manager-1';
  // v10: iletişim durumu değişim kayıtları (eski/yeni durum) İletişim sekmesinde. Eski veriler atılır.
  var STORAGE_KEY = 'bilenyum_tmstore_v26';

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

  var SNAPSHOT_KEYS = ['lessonTypes', 'teachers', 'students', 'parents', 'sessions', 'meetings', 'requests', 'reservations', 'communicationLogs', 'auditLogs', 'users', 'currentUserId'];

  function exportMockSnapshot() {
    return {
      ok: true,
      version: 1,
      exportedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state))
    };
  }

  function importMockSnapshot(payload) {
    if (!payload || !payload.state || typeof payload.state !== 'object') {
      return { ok: false, error: 'Geçersiz yedek dosyası.' };
    }
    var s = payload.state;
    for (var i = 0; i < SNAPSHOT_KEYS.length; i++) {
      var key = SNAPSHOT_KEYS[i];
      if (key === 'currentUserId') {
        if (typeof s.currentUserId !== 'string') return { ok: false, error: 'Yedekte currentUserId eksik.' };
        continue;
      }
      if (!Array.isArray(s[key])) return { ok: false, error: 'Yedekte ' + key + ' alanı geçersiz.' };
    }
    SNAPSHOT_KEYS.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(s, k)) state[k] = s[k];
    });
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
      teachers: state.teachers.length,
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
  // Öğrenci verisinde Matematik isteyenler 5/7, Fen isteyenler 6/8. sınıf.
  // Ders sınıf seviyeleri buna uyumlu atanır ki her ders katılımcı bulabilsin.
  var MAT_GRADES = ['5. Sınıf', '7. Sınıf'];
  var FEN_GRADES = ['6. Sınıf', '8. Sınıf'];
  var LEVELS = ['Başlangıç', 'Orta', 'İleri'];
  // İlk derslerde üç durumu karışık göstermek için (Tamamlandı / Onaylandı / İptal Edildi).
  var STATUS_MIX = ['completed', 'confirmed', 'cancelled', 'confirmed', 'completed', 'confirmed'];

  var PDR_NAMES = [
    ['Ayşe', 'Yılmaz'], ['Zeynep', 'Demir'], ['Selin', 'Korkmaz'], ['Burak', 'Özkan'], ['Elif', 'Şahin'],
    ['Sühendan', 'Tatlı'], ['Merve', 'Aydın'], ['Serkan', 'Bulut'], ['Pınar', 'Yıldız'], ['Cem', 'Aslan'],
    ['Derya', 'Koç'], ['Tolga', 'Erden']
  ];

  var BRANCH_NAMES = [
    ['Furkan', 'Çilingir', 'lt-mat'], ['Koray', 'Şen', 'lt-mat'], ['Ayşe', 'Özkan', 'lt-mat'],
    ['Can', 'Demir', 'lt-mat'], ['Melis', 'Aktaş', 'lt-mat'], ['Hakan', 'Gürbüz', 'lt-mat'],
    ['Gürkan', 'Dayı', 'lt-mat'], ['Sibel', 'Uçar', 'lt-mat'], ['Onur', 'Taş', 'lt-mat'],
    ['Nalan', 'Toprak', 'lt-mat'], ['Kaya', 'Doğan', 'lt-mat'], ['Ece', 'Yavuz', 'lt-mat'],
    ['Emre', 'Yalçın', 'lt-fen'], ['Deniz', 'Kara', 'lt-fen'], ['Ebru', 'Çetin', 'lt-fen'],
    ['Arda', 'Polat', 'lt-fen'], ['Gül', 'Tekin', 'lt-fen'], ['Mert', 'Acar', 'lt-fen'],
    ['Akif', 'Dayı', 'lt-fen'], ['Barış', 'Çakır', 'lt-fen'], ['Yasemin', 'Kılıç', 'lt-fen'],
    ['Umut', 'Şimşek', 'lt-fen'], ['Aylin', 'Erdem', 'lt-fen'], ['Kerem', 'Balcı', 'lt-fen']
  ];

  function buildTeacherRecord(id, firstName, lastName, teacherType, branchLessonTypeIds, idx) {
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
      source: 'admin_panel',
      firstName: firstName,
      lastName: lastName,
      phone: '053' + String(idx + 2) + ' ' + String(100 + idx * 11) + ' ' + String(20 + idx),
      email: firstName.toLowerCase() + '.' + lastName.toLowerCase().replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u') + '@bilenyum.com',
      teacherType: teacherType,
      branchLessonTypeIds: branchLessonTypeIds || [],
      availability: avail,
      dashboardEnabled: true,
      isActive: true,
      trialLessonNotes: '',
      informedNote: ''
    };
  }

  function buildTeachers() {
    var teachers = [];
    PDR_NAMES.forEach(function (t, i) {
      teachers.push(buildTeacherRecord('teacher-pdr-' + (i + 1), t[0], t[1], 'pdr_teacher', [], i));
    });
    BRANCH_NAMES.forEach(function (t, i) {
      teachers.push(buildTeacherRecord('teacher-branch-' + (i + 1), t[0], t[1], 'branch_teacher', [t[2]], i + 10));
    });
    return teachers;
  }

  var STUDENT_FIRST = ['Mira', 'Can', 'Elif', 'Arda', 'Selin', 'Emir', 'Lina', 'Kerem', 'Defne', 'Yiğit', 'Zeynep', 'Berk', 'Ece', 'Alp', 'Damla', 'Kaan', 'Asya', 'Deniz', 'Eren', 'Gizem', 'Baran', 'Ceren', 'Doruk', 'Fulya', 'Gökhan', 'Hazal', 'Ilgın', 'Jale', 'Kuzey', 'Lara', 'Mete', 'Nil', 'Ozan', 'Pelin', 'Rüya', 'Sarp', 'Tuana', 'Umut', 'Vildan', 'Yasin', 'Zara', 'Atlas', 'Belinay', 'Cemre', 'Dilan', 'Efe', 'Fırat', 'Gülce', 'Alper', 'Buse', 'Cem', 'Derya', 'Eda', 'Fahri', 'Gamze', 'Mehmet', 'Gürkan', 'Akif', 'Sühendan', 'Emel', 'Fatma', 'Ada', 'Bora', 'Ceyda', 'Doğa', 'Ela', 'Ferhat', 'Gökçe', 'Hira', 'İpek', 'Leyla', 'Mavi', 'Naz', 'Oğuz', 'Poyraz', 'Rana', 'Toprak', 'Utku', 'Yağmur', 'Zehra', 'Ali', 'Beren', 'Çağla', 'Duru', 'Ege', 'Melis', 'Onat', 'Roya', 'Talha'];
  var STUDENT_LAST = ['Yılmaz', 'Kaya', 'Demir', 'Öztürk', 'Aksoy', 'Çelik', 'Şahin', 'Aydın', 'Koç', 'Polat', 'Arslan', 'Yıldız', 'Güneş', 'Kurt', 'Erdoğan', 'Tekin', 'Bulut', 'Acar', 'Taş', 'Uçar', 'Dayı', 'Tatlı', 'Yaşar', 'Güneş Savul', 'Doğan', 'Aslan', 'Çakır', 'Kılıç', 'Şimşek', 'Erdem', 'Yavuz', 'Özkan', 'Korkmaz', 'Aktaş', 'Gürbüz', 'Çetin', 'Kara', 'Yalçın', 'Bozkurt', 'Ateş', 'Sarı', 'Duman', 'Ekinci', 'Karaca', 'Toprak', 'Balcı', 'Çınar', 'Keskin'];

  var PARENT_FIRST = ['Ayşe', 'Mehmet', 'Zeynep', 'Fatma', 'Burak', 'Deniz', 'Gül', 'Hakan', 'Seda', 'Emre', 'Ahmet', 'Elif', 'Murat', 'Sibel', 'Kemal', 'Nurten', 'Serkan', 'Merve', 'Volkan', 'Aylin', 'Tolga', 'Pınar', 'Cenk', 'Derya', 'Hüseyin', 'Ayla', 'Kadir', 'Nesrin', 'Levent', 'Şule', 'Barış', 'Filiz', 'Okan', 'Meltem', 'Erhan', 'Gülşen', 'Tarık', 'Hande', 'Sinan', 'Yeliz', 'Ufuk'];
  var STUDENT_STATUSES = ['new_request', 'awaiting_assignment', 'scheduled', 'confirmed', 'attended', 'no_show', 'enrolled', 'cancelled', 'lost'];

  function buildParentsAndStudents() {
    var parents = [];
    var students = [];
    var total = 320;
    for (var i = 0; i < total; i++) {
      var pid = 'parent-' + (i + 1);
      var pFirst = PARENT_FIRST[i % PARENT_FIRST.length];
      // Veli soyadı = öğrenci soyadı (aynı aile). Öğrenci soyadı da aynı indeksten gelir.
      var pLast = STUDENT_LAST[i % STUDENT_LAST.length];
      var sid = 'student-' + (i + 1);
      var lessonTypeId = i % 2 === 0 ? 'lt-mat' : 'lt-fen';
      var age = 10 + (i % 5);
      var status = STUDENT_STATUSES[i % STUDENT_STATUSES.length];

      parents.push({
        id: pid,
        source: 'trial_lesson_application',
        firstName: pFirst,
        lastName: pLast,
        phone: '05' + String(30 + (i % 50)).padStart(2, '0') + ' ' + String(100 + i * 3).slice(-3) + ' ' + String(10 + (i % 89)).padStart(2, '0'),
        email: pFirst.toLowerCase() + '.' + pLast.toLowerCase().replace(/\s+/g, '') + (i + 1) + '@mail.com',
        studentIds: [sid],
        preferredChannels: i % 3 === 0 ? ['whatsapp', 'phone'] : (i % 3 === 1 ? ['phone', 'email'] : ['phone']),
        createdAt: isoAt(-30 + (i % 20), 10, 0),
        updatedAt: isoAt(-1, 14, 0)
      });

      // Ücretsiz deneme kullanımı, rezervasyon oluşturulunca işaretlenir (aşağıda). Başta boş.
      students.push({
        id: sid,
        source: 'trial_lesson_application',
        firstName: STUDENT_FIRST[i % STUDENT_FIRST.length],
        lastName: STUDENT_LAST[i % STUDENT_LAST.length],
        age: age,
        // Sınıf ile ders türü bağımsız — her sınıfta hem Matematik hem Fen öğrencisi bulunur.
        grade: GRADES[Math.floor(i / 2) % GRADES.length],
        level: LEVELS[i % LEVELS.length],
        requestedLessonTypeId: lessonTypeId,
        parentIds: [pid],
        status: status,
        hasUsedFreeTrialForLessonTypeIds: [],
        createdAt: isoAt(-25 + (i % 15), 9, 0),
        updatedAt: isoAt(-2, 11, 0)
      });
    }
    // Çok çocuklu aileler — soyad veliyle aynı, kardeşlerin sınıf/türü farklı olabilir.
    var extraSeq = total;
    var multiParents = [0, 3, 7, 12, 20, 33, 48, 60, 77, 90, 110, 130, 150, 175, 200, 230, 260, 290, 305, 315];
    multiParents.forEach(function (pi, k) {
      if (pi >= parents.length) return;
      var pa = parents[pi];
      var childCount = (k % 6 === 0) ? 2 : 1; // birkaç ailede 3 çocuk (mevcut 1 + bu 2)
      for (var c = 0; c < childCount; c++) {
        extraSeq++;
        var esid = 'student-' + extraSeq;
        pa.studentIds.push(esid);
        students.push({
          id: esid,
          source: 'trial_lesson_application',
          firstName: STUDENT_FIRST[(extraSeq * 3 + c) % STUDENT_FIRST.length],
          lastName: pa.lastName,
          age: 10 + ((k + c) % 5),
          grade: GRADES[(pi + k + c) % GRADES.length],
          level: LEVELS[(k + c) % LEVELS.length],
          requestedLessonTypeId: ((k + c) % 2 === 0) ? 'lt-mat' : 'lt-fen',
          parentIds: [pa.id],
          status: STUDENT_STATUSES[(k + c) % STUDENT_STATUSES.length],
          hasUsedFreeTrialForLessonTypeIds: [],
          createdAt: isoAt(-6 - (k % 10), 10, 0),
          updatedAt: isoAt(-1, 9, 0)
        });
      }
    });
    return { parents: parents, students: students };
  }

  function buildSessionsAndMeetings(teachers) {
    var sessions = [];
    var meetings = [];
    var slots = Rules ? Rules.HOURLY_SLOTS : ['11:00', '12:00', '13:00', '14:00'];
    var seq = 0;
    var matTeachers = teachers.filter(function (t) {
      return t.teacherType === 'branch_teacher' && t.branchLessonTypeIds.indexOf('lt-mat') >= 0;
    });
    var fenTeachers = teachers.filter(function (t) {
      return t.teacherType === 'branch_teacher' && t.branchLessonTypeIds.indexOf('lt-fen') >= 0;
    });
    var pdrTeachers = teachers.filter(function (t) { return t.teacherType === 'pdr_teacher'; });

    // Geçmiş günler (day < 0) tamamlanmış ders olarak, gelecek günler onaylı olarak üretilir.
    // Geniş tarih aralığı: her öğretmene çok sayıda tutarlı ders atanır (Verdiği Dersler zenginleşir).
    for (var day = -16; day < 16; day++) {
      var date = dateKeyOffset(day);
      var isPast = day < 0;
      slots.forEach(function (startTime, slotIdx) {
        ['lt-mat', 'lt-fen'].forEach(function (ltId, ltIdx) {
          seq++;
          var teacherPool = ltId === 'lt-mat' ? matTeachers : fenTeachers;
          var branchTeacher = teacherPool[(seq + slotIdx) % teacherPool.length];
          // seq tüm PDR öğretmenlerine eşit dağılsın (eski (seq+ltIdx) formülü hep tek indekse düşüp
          // PDR öğretmenlerinin yarısını boşta bırakıyordu).
          var pdrTeacher = pdrTeachers[seq % pdrTeachers.length];
          var endTime = Rules ? Rules.addMinutes(startTime, 50) : startTime.replace(':00', ':50');
          var sid = 'session-' + String(seq).padStart(4, '0');
          var mid = 'meeting-' + String(seq).padStart(4, '0');
          var ltName = ltId === 'lt-mat' ? 'Matematik' : 'Fen';
          // Sınıf seviyesi (gün, saat) çiftinden gelir; ders türünden BAĞIMSIZ. Böylece hem Matematik
          // hem Fen için 5/6/7/8. sınıfın tamamı üretilir ve her (tür, sınıf) kombinasyonu ders bulur.
          // NOT: negatif günlerde JS modulo negatif dönebildiğinden non-negatif indekse zorlanır
          // (aksi halde GRADES[negatif] = undefined → sınıfsız ders olurdu).
          var gradeRaw = (day + 2) * slots.length + slotIdx;
          var gradeLevel = GRADES[((gradeRaw % GRADES.length) + GRADES.length) % GRADES.length];
          // İlk 20 ders için üç durumu da (Tamamlandı / Onaylandı / İptal Edildi) karışık üret — iyi bir demo için.
          var status;
          if (seq <= 20) {
            status = STATUS_MIX[(seq - 1) % STATUS_MIX.length];
          } else {
            status = isPast ? 'completed' : 'confirmed';
            if (!isPast && day === 1 && slotIdx === 2 && ltId === 'lt-fen') status = 'cancelled';
          }
          var meetingStatus = status === 'cancelled' ? 'cancelled' : (status === 'completed' ? 'expired' : 'active');
          // Kural: tamamlanan derste PDR ve branş öğretmeni mutlaka atanmış ve bilgilendirilmiştir.
          var isCompleted = status === 'completed';
          var pdrId = (seq % 17 === 0 && !isCompleted) ? null : pdrTeacher.id;
          var pdrInformed = isCompleted || (seq % 5 !== 0);
          var branchInformed = isCompleted || (seq % 4 !== 0);

          meetings.push({
            id: mid,
            sessionId: sid,
            platform: 'internal_app',
            meetingUrl: 'https://app.bilenyum.com/ders/' + sid,
            meetingId: 'tM-' + String(seq).padStart(4, '0'),
            passcode: randPass(),
            status: meetingStatus,
            generatedAt: isoAt(-10, 8, 0),
            updatedAt: isoAt(-day, 9, 0)
          });

          sessions.push({
            id: sid,
            title: ltName + ' · ' + date + ' · ' + startTime,
            lessonTypeId: ltId,
            pdrTeacherId: pdrId,
            branchTeacherId: branchTeacher.id,
            date: date,
            startTime: startTime,
            endTime: endTime,
            gradeLevel: gradeLevel,
            capacity: 20,
            enrolledStudentIds: [],
            reservationIds: [],
            onlineMeetingId: mid,
            status: status,
            parentPresentationMinutes: 20,
            studentTrialMinutes: 30,
            pdrTeacherInformed: pdrInformed,
            pdrTeacherInformedAt: pdrInformed ? isoAt(-2, 10, 0) : undefined,
            pdrTeacherInformedByUserId: pdrInformed ? CURRENT_USER_ID : undefined,
            branchTeacherInformed: branchInformed,
            branchTeacherInformedAt: branchInformed ? isoAt(-2, 10, 0) : undefined,
            branchTeacherInformedByUserId: branchInformed ? CURRENT_USER_ID : undefined,
            createdByUserId: CURRENT_USER_ID,
            createdAt: isoAt(-14, 8, 0),
            updatedAt: isoAt(-day, 8, 30)
          });
        });
      });
    }
    return { sessions: sessions, meetings: meetings };
  }

  function contactNoteFor(status) {
    if (status === 'positive') return 'Veli ile olumlu görüşüldü, deneme dersi hakkında bilgi verildi.';
    if (status === 'negative') return 'Veli şu an ilgilenmediğini belirtti.';
    if (status === 'unreachable') return 'Veliye ulaşılamadı, tekrar aranacak.';
    return 'Veli ile görüşüldü.';
  }

  // Talepler ve rezervasyonlar TEK bir tutarlı zincirden üretilir:
  //   gerçek öğrenci + gerçek veli → talep (studentGrade/tür öğrenciden) →
  //   atanmışsa öğrencinin (tür+sınıf) ile EŞLEŞEN bir derse rezervasyon.
  // Böylece Öğrenciler / Veliler / Rezervasyon Talepleri / Deneme Dersleri aynı veriyi gösterir.
  // Her rezervasyonun gerçek bir talebi (requestId) vardır; uydurma isim/orphan yoktur.
  function buildRequestsAndReservations(students, sessions) {
    var requests = [];
    var reservations = [];
    var reqSeq = 0;
    var rSeq = 0;
    var channels = ['phone', 'whatsapp', 'sms', 'email'];
    function matchingSessions(ltId, grade) {
      return sessions.filter(function (s) {
        return s.status !== 'cancelled' && s.lessonTypeId === ltId && s.gradeLevel === grade;
      });
    }
    // Öğrenciyi (tür+sınıf) uyan dersler arasında EN AZ dolu olana yerleştir: rezervasyonlar
    // dengeli dağılsın, çoğu ders katılımcı göstersin, tek derse yığılma olmasın.
    function pickSessionToFill(ltId, grade) {
      var pool = matchingSessions(ltId, grade);
      if (!pool.length) return null;
      return pool.slice().sort(function (a, b) { return a.reservationIds.length - b.reservationIds.length; })[0];
    }

    students.forEach(function (st, i) {
      var parent = state.parents.find(function (p) { return p.id === st.parentIds[0]; });
      if (!parent) return;
      var ltId = st.requestedLessonTypeId;

      // Talep sonucu dağılımı — çeşitlilik + tutarlılık (her satır gerçek bir hayat döngüsü):
      var mod = i % 10;
      var status, contactStatus, reserve = false;
      if (mod === 0) { status = 'new'; contactStatus = undefined; }            // yeni, henüz görüşülmedi
      else if (mod === 1) { status = 'new'; contactStatus = 'negative'; }      // görüşüldü, olumsuz
      else if (mod === 2) { status = 'new'; contactStatus = 'unreachable'; }   // ulaşılamadı
      else if (mod === 3) { status = 'rejected'; contactStatus = 'negative'; } // reddedildi
      else if (mod === 4) { status = 'cancelled'; contactStatus = undefined; } // veli iptal etti
      else if (mod === 5) { status = 'reviewing'; contactStatus = 'positive'; }// olumlu, atama bekliyor (orphan)
      else { status = 'assigned'; contactStatus = 'positive'; reserve = true; } // derse atandı → rezervasyon

      var session = reserve ? pickSessionToFill(ltId, st.grade) : null;
      if (reserve && !session) { reserve = false; status = 'reviewing'; } // uygun ders yoksa atama bekliyor

      // Velinin ücretsiz deneme formunda seçtiği ders saati — başvuruda ZORUNLU olduğundan
      // her talepte doludur. Atanmışsa atanan ders, değilse (tür+sınıf) uyan gerçek bir ders.
      var preferSession = session;
      if (!preferSession) {
        var preferPool = matchingSessions(ltId, st.grade);
        if (!preferPool.length) preferPool = sessions.filter(function (s) { return s.status !== 'cancelled' && s.lessonTypeId === ltId; });
        preferSession = preferPool.length ? preferPool[i % preferPool.length] : null;
      }

      reqSeq++;
      var reqId = 'request-' + String(reqSeq).padStart(4, '0');
      var reqDay = -12 + (i % 8); // talebin geldiği gün (-12..-5); tüm döngü buna göre sıralanır
      requests.push({
        id: reqId,
        studentFirstName: st.firstName,
        studentLastName: st.lastName,
        studentAge: st.age,
        studentGrade: st.grade,
        studentLevel: st.level,
        requestedLessonTypeId: ltId,
        parentFirstName: parent.firstName,
        parentLastName: parent.lastName,
        parentPhone: parent.phone,
        parentEmail: parent.email,
        preferredSessionId: preferSession ? preferSession.id : undefined,
        selectedSessionId: session ? session.id : undefined,
        status: status,
        contactStatus: contactStatus,
        contactChannel: contactStatus ? channels[i % 3] : undefined,
        contactNote: contactStatus ? contactNoteFor(contactStatus) : undefined,
        source: 'website_form',
        // Yaşam döngüsü zaman damgaları KRONOLOJİK olmalı (Geçmiş sekmesi bunu gösterir):
        // talep(reqDay) < iletişim(reqDay+1) < rezervasyon(reqDay+2) < veli onayı/link(reqDay+3).
        createdAt: isoAt(reqDay, 8 + (i % 9), 0),
        updatedAt: isoAt(reqDay + 1, 12, 0)
      });

      if (reserve && session) {
        rSeq++;
        var rid = 'res-' + String(rSeq).padStart(4, '0');
        var resStatus = session.status === 'completed'
          ? (i % 5 === 0 ? 'no_show' : 'attended')
          : 'confirmed';
        var linkSent = resStatus !== 'no_show' && (i % 3 !== 0);
        reservations.push({
          id: rid,
          requestId: reqId,
          studentId: st.id,
          parentId: parent.id,
          sessionId: session.id,
          lessonTypeId: ltId,
          status: resStatus,
          parentApprovalStatus: 'approved',
          linkSent: linkSent,
          linkSentAt: linkSent ? isoAt(reqDay + 3, 17, 0) : undefined,
          linkSentByUserId: linkSent ? CURRENT_USER_ID : undefined,
          communicationLogIds: [],
          enrolled: resStatus === 'attended' && (i % 4 === 0),
          createdAt: isoAt(reqDay + 2, 10, 0),
          updatedAt: isoAt(reqDay + 3, 16, 0)
        });
        session.enrolledStudentIds.push(st.id);
        session.reservationIds.push(rid);
        st.hasUsedFreeTrialForLessonTypeIds = [ltId];
      }
    });
    return { requests: requests, reservations: reservations };
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

  // İletişim durumu olan talepler için "Görüşülmedi → durum" iletişim kaydı üret (İletişim sekmesinde eski/yeni durum gösterilsin).
  function buildContactChangeLogs(requests) {
    var CR = { positive: 'reached', negative: 'declined', unreachable: 'unreachable' };
    var logs = [];
    var n = 0;
    requests.forEach(function (req) {
      if (!req.contactStatus) return;
      n++;
      logs.push({
        id: 'commc-' + String(n).padStart(4, '0'),
        requestId: req.id,
        parentId: undefined,
        channel: req.contactChannel || 'phone',
        result: CR[req.contactStatus] || 'reached',
        contactFrom: 'none',
        contactTo: req.contactStatus,
        summary: req.contactNote || 'Veli ile görüşüldü.',
        createdByUserId: CURRENT_USER_ID,
        createdAt: req.updatedAt || isoAt(-1, 12, 0)
      });
    });
    return logs;
  }

  // Gerçekçi, eski/yeni değerli değişiklik geçmişi — tüm varlık türleri için (talep, ders,
  // öğrenci, veli, öğretmen). Her kayıt gerçek verinin GÜNCEL halini "yeni durum" kabul eder;
  // "eski durum" ise değişiklikten önceki (kurgusal ama tutarlı) değerdir.
  function buildAuditLogs(sessions, reservations, requests, students, parents, teachers) {
    var logs = [];
    var seq = 0;
    var USERS = [CURRENT_USER_ID, 'user-admin-1'];
    var GR = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
    function tName(id) { var t = find(teachers, id); return t ? t.firstName + ' ' + t.lastName : (id || '—'); }
    function altTeacher(sameTypeId, notId) {
      var pool = teachers.filter(function (t) {
        var samePdr = (t.teacherType === 'pdr_teacher') === (find(teachers, notId) && find(teachers, notId).teacherType === 'pdr_teacher');
        return t.id !== notId && samePdr;
      });
      return pool.length ? pool[(seq) % pool.length] : null;
    }
    function push(o) {
      seq++;
      logs.push({
        id: 'AUD-' + String(seq).padStart(5, '0'),
        entityType: o.entityType, entityId: o.entityId,
        action: o.action, description: o.description || '',
        previousValue: o.previousValue, newValue: o.newValue,
        reason: o.reason,
        relatedTeacherIds: o.relatedTeacherIds,
        createdByUserId: o.by || USERS[seq % 2],
        createdAt: o.at
      });
    }
    var lc = function (s) { return getLessonCode(s); };
    var ltName = function (id) { return id === 'lt-mat' ? 'Matematik' : (id === 'lt-fen' ? 'Fen' : id); };

    // 1) DENEME DERSLERİ — öğretmen değişimi, sınıf değişimi, tarih değişimi, iptal, öğrenci ekle/çıkar
    sessions.forEach(function (s, i) {
      if (s.status === 'cancelled') {
        push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'cancelled', description: 'Ders iptal edildi (' + lc(s) + ').', previousValue: 'Onaylandı', newValue: 'İptal Edildi', reason: 'Öğretmen uygunluğu', at: isoAt(-2, 14, 0) });
        return;
      }
      if (s.status === 'completed') return; // tamamlananları sade tutalım
      var m = i % 9;
      if (m === 0 && s.pdrTeacherId) {
        var altP = altTeacher(s.pdrTeacherId, s.pdrTeacherId);
        if (altP) push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'pdr_teacher_changed', description: 'PDR öğretmeni değiştirildi (' + lc(s) + ').', previousValue: tName(altP.id), newValue: tName(s.pdrTeacherId), relatedTeacherIds: [altP.id, s.pdrTeacherId], reason: 'Program çakışması', at: isoAt(-3 - (i % 5), 9 + (i % 6), 0) });
      } else if (m === 1 && s.branchTeacherId) {
        var altB = altTeacher(s.branchTeacherId, s.branchTeacherId);
        if (altB) push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'branch_teacher_changed', description: 'Branş öğretmeni değiştirildi (' + lc(s) + ').', previousValue: tName(altB.id), newValue: tName(s.branchTeacherId), relatedTeacherIds: [altB.id, s.branchTeacherId], reason: 'Öğretmen talebi', at: isoAt(-3 - (i % 5), 10 + (i % 5), 0) });
      } else if (m === 2 && s.gradeLevel) {
        var oldG = GR[(GR.indexOf(s.gradeLevel) + 1) % GR.length];
        push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'grade_changed', description: 'Ders sınıf seviyesi güncellendi (' + lc(s) + ').', previousValue: oldG, newValue: s.gradeLevel, reason: 'Sınıf düzeltmesi', at: isoAt(-4 - (i % 4), 11, 0) });
      } else if (m === 3) {
        push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'time_changed', description: 'Ders tarih/saati değiştirildi (' + lc(s) + ').', previousValue: dateKeyOffset(-1) + ' ' + s.startTime, newValue: s.date + ' ' + s.startTime, reason: 'Veli talebi', at: isoAt(-5 - (i % 3), 13, 0) });
      } else if (m === 4 && s.lessonTypeId) {
        var oldLt = s.lessonTypeId === 'lt-mat' ? 'lt-fen' : 'lt-mat';
        push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'lesson_type_changed', description: 'Ders türü değiştirildi (' + lc(s) + ').', previousValue: ltName(oldLt), newValue: ltName(s.lessonTypeId), reason: 'Planlama düzeltmesi', at: isoAt(-6, 12, 0) });
      } else if (m === 5 && (s.enrolledStudentIds || []).length) {
        var st = find(students, s.enrolledStudentIds[0]);
        if (st) push({ entityType: 'trial_lesson_session', entityId: s.id, action: 'student_assigned', description: 'Derse öğrenci eklendi (' + lc(s) + ').', previousValue: '—', newValue: st.firstName + ' ' + st.lastName, at: isoAt(-4, 15, 0) });
      }
    });

    // 2) REZERVASYON TALEPLERİ — iletişim durumu, derse atama, atanan ders değişimi
    requests.forEach(function (r, i) {
      if (r.deleted) return;
      var res = reservations.find(function (x) { return x.requestId === r.id; });
      var m = i % 7;
      if (m === 0 && r.contactStatus) {
        var trMap = { positive: 'Olumlu', negative: 'Olumsuz', unreachable: 'Ulaşılamadı' };
        push({ entityType: 'trial_lesson_request', entityId: r.id, action: 'contact_updated', description: 'İletişim durumu güncellendi (' + r.studentFirstName + ' ' + r.studentLastName + ').', previousValue: 'Görüşülmedi', newValue: trMap[r.contactStatus] || 'Görüşülmedi', at: isoAt(-6 + (i % 5), 10, 0) });
      } else if (m === 1 && res) {
        var s2 = find(sessions, res.sessionId);
        push({ entityType: 'trial_lesson_request', entityId: r.id, action: 'student_assigned', description: 'Öğrenci derse atandı (' + r.studentFirstName + ' ' + r.studentLastName + ').', previousValue: 'Atanmadı', newValue: s2 ? lc(s2) : 'Atandı', at: isoAt(-5 + (i % 4), 11, 0) });
      } else if (m === 2 && res) {
        var s3 = find(sessions, res.sessionId);
        push({ entityType: 'trial_lesson_request', entityId: r.id, action: 'session_changed', description: 'Atanan ders değiştirildi (' + r.studentFirstName + ' ' + r.studentLastName + ').', previousValue: 'tL-' + String((i % 80) + 1).padStart(4, '0'), newValue: s3 ? lc(s3) : '—', reason: 'Uygun saat', at: isoAt(-4, 14, 0) });
      }
    });

    // 3) ÖĞRENCİ — sınıf düzeltmesi, ad düzeltmesi
    students.forEach(function (st, i) {
      if (i % 11 !== 0) return;
      if (i % 22 === 0) {
        var oldG2 = GR[(GR.indexOf(st.grade) + 1) % GR.length];
        push({ entityType: 'student', entityId: st.id, action: 'grade_changed', description: 'Öğrenci sınıfı güncellendi (' + st.firstName + ' ' + st.lastName + ').', previousValue: oldG2, newValue: st.grade, at: isoAt(-7 + (i % 6), 9, 0) });
      } else {
        push({ entityType: 'student', entityId: st.id, action: 'name_changed', description: 'Öğrenci adı düzeltildi.', previousValue: st.firstName + 'can ' + st.lastName, newValue: st.firstName + ' ' + st.lastName, at: isoAt(-8 + (i % 6), 10, 0) });
      }
    });

    // 4) VELİ — telefon / e-posta / ad güncellemesi
    parents.forEach(function (pa, i) {
      if (i % 9 !== 0) return;
      var pick = i % 3;
      if (pick === 0) push({ entityType: 'parent', entityId: pa.id, action: 'phone_changed', description: 'Veli telefonu güncellendi (' + pa.firstName + ' ' + pa.lastName + ').', previousValue: '05' + String(300000000 + i).slice(0, 9), newValue: pa.phone, at: isoAt(-6 + (i % 5), 12, 0) });
      else if (pick === 1) push({ entityType: 'parent', entityId: pa.id, action: 'email_changed', description: 'Veli e-postası güncellendi (' + pa.firstName + ' ' + pa.lastName + ').', previousValue: 'eski.' + (pa.email || 'mail@mail.com'), newValue: pa.email, at: isoAt(-5 + (i % 4), 13, 0) });
      else push({ entityType: 'parent', entityId: pa.id, action: 'name_changed', description: 'Veli adı düzeltildi.', previousValue: pa.firstName + ' ' + pa.lastName + 'oğlu', newValue: pa.firstName + ' ' + pa.lastName, at: isoAt(-7, 11, 0) });
    });

    logs.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    // id'leri zaman sırasına göre yeniden numaralandır (en yeni en büyük değil; sabit kalsın)
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

  function migrateDualTeacherModel() {
    var defaultPdr = state.teachers.find(function (t) {
      return t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr';
    });
    state.teachers.forEach(function (t) {
      if (t.teacherType === 'pdr') t.teacherType = 'pdr_teacher';
      if (t.teacherType === 'branch') t.teacherType = 'branch_teacher';
    });
    state.sessions.forEach(function (s) {
      if (s.teacherId && (!s.branchTeacherId || !s.pdrTeacherId)) {
        var legacy = find(state.teachers, s.teacherId);
        if (legacy && (legacy.teacherType === 'pdr_teacher' || legacy.teacherType === 'pdr')) {
          s.pdrTeacherId = s.teacherId;
          if (!s.branchTeacherId) {
            var branch = state.teachers.find(function (t) {
              return t.teacherType === 'branch_teacher' &&
                (t.branchLessonTypeIds || []).indexOf(s.lessonTypeId) >= 0;
            });
            s.branchTeacherId = branch ? branch.id : s.teacherId;
          }
        } else {
          s.branchTeacherId = s.branchTeacherId || s.teacherId;
          if (!s.pdrTeacherId && defaultPdr) s.pdrTeacherId = defaultPdr.id;
        }
        delete s.teacherId;
      }
      if (s.teacherInformed !== undefined) {
        if (s.branchTeacherInformed === undefined) s.branchTeacherInformed = !!s.teacherInformed;
        if (s.branchTeacherInformedAt === undefined) s.branchTeacherInformedAt = s.teacherInformedAt;
        if (s.branchTeacherInformedByUserId === undefined) s.branchTeacherInformedByUserId = s.teacherInformedByUserId;
        if (s.pdrTeacherInformed === undefined) s.pdrTeacherInformed = !!s.teacherInformed;
        delete s.teacherInformed;
        delete s.teacherInformedAt;
        delete s.teacherInformedByUserId;
      }
    });
  }

  function ensureDataSourceMetadata() {
    migrateDualTeacherModel();
    state.teachers.forEach(function (t) {
      if (!t.source) t.source = 'admin_panel';
      if (!t.teacherType) t.teacherType = 'branch_teacher';
      if (t.trialLessonNotes === undefined) t.trialLessonNotes = '';
      if (t.informedNote === undefined) t.informedNote = '';
    });
    state.parents.forEach(function (pa) {
      if (!pa.source) pa.source = 'trial_lesson_application';
    });
    state.students.forEach(function (st) {
      if (!st.source) st.source = 'trial_lesson_application';
      if (!st.applicationRequestId) {
        var res = state.reservations.find(function (r) { return r.studentId === st.id && r.requestId; });
        if (res) st.applicationRequestId = res.requestId;
        else {
          var req = state.requests.find(function (rq) {
            return rq.studentFirstName === st.firstName && rq.studentLastName === st.lastName;
          });
          if (req) st.applicationRequestId = req.id;
        }
      }
    });
  }

  function initState() {
    state.teachers = buildTeachers();
    var ps = buildParentsAndStudents();
    state.parents = ps.parents;
    state.students = ps.students;
    var sm = buildSessionsAndMeetings(state.teachers);
    state.sessions = sm.sessions;
    state.meetings = sm.meetings;
    var rr = buildRequestsAndReservations(state.students, state.sessions);
    state.requests = rr.requests;
    state.reservations = rr.reservations;
    state.communicationLogs = buildContactChangeLogs(state.requests).concat(buildCommunicationLogs(state.reservations));
    state.auditLogs = buildAuditLogs(state.sessions, state.reservations, state.requests, state.students, state.parents, state.teachers);
    ensureDataSourceMetadata();
  }

  if (!loadPersistedState()) initState();
  else {
    ensureDataSourceMetadata();
    touch();
  }

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
      meetingId: 'tM-' + String(state.meetings.length + 1).padStart(4, '0'),
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
      pdrTeacherId: draft.pdrTeacherId,
      branchTeacherId: draft.branchTeacherId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      gradeLevel: draft.gradeLevel || GRADES[0],
      capacity: 20,
      enrolledStudentIds: [],
      reservationIds: [],
      onlineMeetingId: meeting.id,
      status: draft.status || 'confirmed',
      parentPresentationMinutes: 20,
      studentTrialMinutes: 30,
      pdrTeacherInformed: false,
      branchTeacherInformed: false,
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
    if (session.status === 'completed') return { ok: false, error: 'Tamamlanmış ders düzenlenemez / iptal edilemez.' };
    if (session.status === 'cancelled') return { ok: false, error: 'Ders zaten iptal edilmiş.' };
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

  function changeSessionPdrTeacher(sessionId, newTeacherId, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'Değişiklik nedeni zorunludur.' };
    if (!Rules) return { ok: false, error: 'Planlama kuralları yüklenemedi.' };
    if (!Rules.isTeacherPdr(newTeacherId)) return { ok: false, error: 'Seçilen öğretmen PDR/Rehberlik öğretmeni değil.' };
    if (newTeacherId === session.branchTeacherId) return { ok: false, error: 'PDR ve branş öğretmeni aynı kişi olamaz.' };
    if (!Rules.isPdrTeacherAvailable(newTeacherId, session.date, session.startTime, session.endTime)) {
      return { ok: false, error: 'PDR öğretmeni bu saatte müsait değil.' };
    }
    if (Rules.hasPdrTeacherConflict(newTeacherId, session.date, session.startTime, session.endTime, sessionId)) {
      return { ok: false, error: 'PDR öğretmeninin aynı saatte başka dersi var.' };
    }
    var prev = session.pdrTeacherId;
    var prevTeacher = find(state.teachers, prev);
    var newTeacher = find(state.teachers, newTeacherId);
    session.pdrTeacherId = newTeacherId;
    session.pdrTeacherInformed = false;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'pdr_teacher_changed',
        description: 'PDR öğretmeni ' + (prevTeacher ? prevTeacher.firstName + ' ' + prevTeacher.lastName : prev) +
          ' → ' + (newTeacher ? newTeacher.firstName + ' ' + newTeacher.lastName : newTeacherId) + ' olarak değiştirildi.',
        reason: reason,
        previousValue: prev,
        newValue: newTeacherId
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function changeSessionBranchTeacher(sessionId, newTeacherId, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!reason || !reason.trim()) return { ok: false, error: 'Değişiklik nedeni zorunludur.' };
    if (!Rules) return { ok: false, error: 'Planlama kuralları yüklenemedi.' };
    if (!Rules.isBranchTeacherEligibleForLessonType(newTeacherId, session.lessonTypeId)) {
      return { ok: false, error: 'Branş öğretmeni ders türüyle uyumlu değil.' };
    }
    if (newTeacherId === session.pdrTeacherId) return { ok: false, error: 'PDR ve branş öğretmeni aynı kişi olamaz.' };
    if (!Rules.isBranchTeacherAvailable(newTeacherId, session.date, session.startTime, session.endTime)) {
      return { ok: false, error: 'Branş öğretmeni bu saatte müsait değil.' };
    }
    if (Rules.hasBranchTeacherConflict(newTeacherId, session.date, session.startTime, session.endTime, sessionId)) {
      return { ok: false, error: 'Branş öğretmeninin aynı saatte başka dersi var.' };
    }
    var prev = session.branchTeacherId;
    var prevTeacher = find(state.teachers, prev);
    var newTeacher = find(state.teachers, newTeacherId);
    session.branchTeacherId = newTeacherId;
    session.branchTeacherInformed = false;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'branch_teacher_changed',
        description: 'Branş öğretmeni ' + (prevTeacher ? prevTeacher.firstName + ' ' + prevTeacher.lastName : prev) +
          ' → ' + (newTeacher ? newTeacher.firstName + ' ' + newTeacher.lastName : newTeacherId) + ' olarak değiştirildi.',
        reason: reason,
        previousValue: prev,
        newValue: newTeacherId
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function changeSessionTeacher(sessionId, newTeacherId, reason) {
    return changeSessionBranchTeacher(sessionId, newTeacherId, reason);
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
    if (!Rules.isPdrTeacherAvailable(session.pdrTeacherId, newDate, newStartTime, newEnd)) {
      return { ok: false, error: 'PDR öğretmeni yeni saatte müsait değil.' };
    }
    if (!Rules.isBranchTeacherAvailable(session.branchTeacherId, newDate, newStartTime, newEnd)) {
      return { ok: false, error: 'Branş öğretmeni yeni saatte müsait değil.' };
    }
    if (Rules.hasPdrTeacherConflict(session.pdrTeacherId, newDate, newStartTime, newEnd, sessionId)) {
      return { ok: false, error: 'PDR öğretmeni çakışması.' };
    }
    if (Rules.hasBranchTeacherConflict(session.branchTeacherId, newDate, newStartTime, newEnd, sessionId)) {
      return { ok: false, error: 'Branş öğretmeni çakışması.' };
    }
    var prev = { date: session.date, startTime: session.startTime };
    session.date = newDate;
    session.startTime = newStartTime;
    session.endTime = newEnd;
    session.status = session.status === 'cancelled' ? session.status : 'rescheduled';
    session.pdrTeacherInformed = false;
    session.branchTeacherInformed = false;
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
    if (!Rules.isBranchTeacherEligibleForLessonType(session.branchTeacherId, newLessonTypeId)) {
      return { ok: false, error: 'Mevcut branş öğretmeni seçilen ders türüne uygun değil. Önce branş öğretmenini değiştirin.' };
    }
    if (Rules.hasSessionSlotConflict(session.date, newLessonTypeId, session.startTime, sessionId)) {
      return { ok: false, error: 'Bu tarih ve saatte seçilen ders türü için zaten oturum var.' };
    }
    var prev = session.lessonTypeId;
    var lt = find(state.lessonTypes, newLessonTypeId);
    session.lessonTypeId = newLessonTypeId;
    session.title = (lt ? lt.name : 'Ders') + ' · ' + session.date + ' · ' + session.startTime;
    session.branchTeacherInformed = false;
    session.pdrTeacherInformed = false;
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

  function markPdrTeacherInformed(sessionId) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false };
    session.pdrTeacherInformed = true;
    session.pdrTeacherInformedAt = new Date().toISOString();
    session.pdrTeacherInformedByUserId = state.currentUserId;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'pdr_teacher_informed',
        description: 'PDR öğretmeni bilgilendirildi olarak işaretlendi.'
      });
    }
    touch();
    return { ok: true, session: session };
  }

  function markBranchTeacherInformed(sessionId) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false };
    session.branchTeacherInformed = true;
    session.branchTeacherInformedAt = new Date().toISOString();
    session.branchTeacherInformedByUserId = state.currentUserId;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'branch_teacher_informed',
        description: 'Branş öğretmeni bilgilendirildi olarak işaretlendi.'
      });
    }
    touch();
    return { ok: true, session: session };
  }

  // Derse atanan tüm aktif velilere ders bilgilerini gönderir (iletişim kaydı oluşturur).
  function notifyAllParentsForSession(sessionId) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (session.status === 'cancelled' || session.status === 'completed') {
      return { ok: false, error: 'İptal edilmiş veya tamamlanmış ders için bilgilendirme yapılamaz.' };
    }
    var lt = find(state.lessonTypes, session.lessonTypeId);
    var meeting = find(state.meetings, session.onlineMeetingId);
    var active = state.reservations.filter(function (r) {
      return r.sessionId === sessionId && r.status !== 'cancelled' && r.status !== 'rescheduled';
    });
    if (!active.length) return { ok: false, error: 'Bilgilendirilecek veli yok.' };
    var summary = 'Deneme dersi bilgileri gönderildi: ' + (lt ? lt.name : 'Ders') + ' · ' + session.gradeLevel +
      ' · ' + session.date + ' ' + session.startTime + '–' + session.endTime +
      (meeting ? ' · Link: ' + meeting.meetingUrl : '');
    var count = 0;
    active.forEach(function (r) {
      addCommunicationLog({
        sessionId: sessionId,
        reservationId: r.id,
        parentId: r.parentId,
        studentId: r.studentId,
        channel: 'whatsapp',
        result: 'message_sent',
        summary: summary
      });
      r.linkSent = true;
      r.linkSentAt = new Date().toISOString();
      r.linkSentByUserId = state.currentUserId;
      count++;
    });
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'updated',
        description: 'Tüm velilere ders bilgileri gönderildi (' + count + ' veli).'
      });
    }
    touch();
    return { ok: true, count: count };
  }

  function markTeacherInformed(sessionId) {
    markPdrTeacherInformed(sessionId);
    return markBranchTeacherInformed(sessionId);
  }

  function addCommunicationLog(entry) {
    var id = 'comm-' + String(state.communicationLogs.length + 1).padStart(4, '0');
    var log = {
      id: id,
      studentId: entry.studentId,
      parentId: entry.parentId,
      teacherId: entry.teacherId,
      requestId: entry.requestId,
      reservationId: entry.reservationId,
      sessionId: entry.sessionId,
      channel: entry.channel,
      result: entry.result,
      summary: entry.summary || '',
      contactFrom: entry.contactFrom,
      contactTo: entry.contactTo,
      nextAction: entry.nextAction,
      nextActionDate: entry.nextActionDate,
      createdByUserId: entry.createdByUserId || state.currentUserId,
      createdAt: entry.createdAt || new Date().toISOString()
    };
    state.communicationLogs.unshift(log);
    if (entry.reservationId) {
      var r = find(state.reservations, entry.reservationId);
      if (r) r.communicationLogIds.push(id);
    }
    touch();
    return log;
  }

  // Veli iletişim durumu (Olumlu / Olumsuz / Ulaşılamadı) — sonradan güncellenebilir.
  var CONTACT_RESULT = { positive: 'reached', negative: 'declined', unreachable: 'unreachable' };
  var CONTACT_LABEL = { positive: 'Olumlu', negative: 'Olumsuz', unreachable: 'Ulaşılamadı' };
  function setRequestContactStatus(requestId, data) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    if (!data || !data.status || !CONTACT_RESULT[data.status]) return { ok: false, error: 'Durum seçilmelidir.' };
    if (!data.channel) return { ok: false, error: 'İletişim kanalı seçilmelidir.' };
    if (!data.note || !String(data.note).trim()) return { ok: false, error: 'Açıklama girilmelidir.' };
    var prevStatus = req.contactStatus || 'none';
    var prevLabel = req.contactStatus ? (CONTACT_LABEL[req.contactStatus] || req.contactStatus) : 'Görüşülmedi';
    req.contactStatus = data.status;
    req.contactChannel = data.channel;
    req.contactNote = String(data.note).trim();
    req.updatedAt = new Date().toISOString();
    addCommunicationLog({
      requestId: requestId,
      channel: data.channel,
      result: CONTACT_RESULT[data.status],
      contactFrom: prevStatus,
      contactTo: data.status,
      summary: req.contactNote
    });
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_request',
        entityId: requestId,
        action: 'updated',
        description: 'Veli iletişim durumu güncellendi',
        previousValue: prevLabel,
        newValue: CONTACT_LABEL[data.status] || data.status,
        reason: req.contactNote
      });
    }
    touch();
    return { ok: true, request: req };
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

  // Otomatik deneme rezervasyon kodu: rT-<tarih>-<sıra>, atanan/seçilen ders tarihine göre.
  function getReservationCode(requestId) {
    var r = find(state.requests, requestId);
    if (!r) return '';
    var sess = r.selectedSessionId ? find(state.sessions, r.selectedSessionId) : null;
    if (!sess) {
      var res = getReservationByRequestId(requestId);
      if (res) sess = find(state.sessions, res.sessionId);
    }
    var dateKey = (sess && sess.date) ? sess.date : (r.createdAt ? String(r.createdAt).slice(0, 10) : '');
    var compact = dateKey ? dateKey.replace(/-/g, '') : '00000000';
    var m = String(r.id).match(/(\d+)\s*$/);
    var seq = m ? m[1].padStart(4, '0') : '0000';
    return 'rT-' + compact + '-' + seq;
  }

  // Deneme dersi görünen kimliği: tL-<sıra>
  function getLessonCode(sessionOrId) {
    var s = typeof sessionOrId === 'string' ? find(state.sessions, sessionOrId) : sessionOrId;
    if (!s) return '';
    var m = String(s.id).match(/(\d+)\s*$/);
    var seq = m ? m[1].padStart(4, '0') : '0000';
    return 'tL-' + seq;
  }

  function isOrphanRequest(requestId) {
    var req = find(state.requests, requestId);
    if (!req || req.deleted || req.status === 'rejected' || req.status === 'cancelled') return false;
    return !getReservationByRequestId(requestId);
  }

  // Rezervasyon talebini sil (soft-delete): talep listede "Silindi" olarak kalır. Bağlı aktif
  // rezervasyon varsa iptal edilir ve öğrenci dersten çıkarılır (reddetme akışıyla aynı temizlik).
  function deleteRequest(requestId) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    if (req.deleted) return { ok: false, error: 'Talep zaten silinmiş.' };
    req.deleted = true;
    req.deletedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();
    var res = getReservationByRequestId(requestId);
    if (res && res.status !== 'cancelled') {
      res.status = 'cancelled';
      res.cancellationReason = 'Talep silindi.';
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
        action: 'request_deleted',
        description: 'Rezervasyon talebi silindi.'
      });
    }
    touch();
    return { ok: true, request: req };
  }

  // Silinmiş / reddedilmiş / iptal edilmiş bir talebi yeniden aktifleştir → durum "Bekliyor",
  // süreç (İletişim → Ders Ataması → Rezerve → Onay → Link) baştan devam eder.
  function reactivateRequest(requestId) {
    var req = find(state.requests, requestId);
    if (!req) return { ok: false, error: 'Talep bulunamadı.' };
    req.deleted = false;
    req.deletedAt = undefined;
    if (req.status === 'rejected' || req.status === 'cancelled') req.status = 'new';
    req.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_request',
        entityId: requestId,
        action: 'request_reactivated',
        description: 'Talep yeniden aktifleştirildi (Bekliyor).'
      });
    }
    touch();
    return { ok: true, request: req };
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

  function changeSessionGradeLevel(sessionId, gradeLevel, reason) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (!gradeLevel) return { ok: false, error: 'Sınıf seviyesi seçilmelidir.' };
    if (session.gradeLevel === gradeLevel) return { ok: true, session: session };
    // Farklı sınıf seviyesindeki aktif öğrenci varsa değişime izin verme.
    var conflict = state.reservations.some(function (r) {
      if (r.sessionId !== sessionId || r.status === 'cancelled' || r.status === 'rescheduled') return false;
      var st = find(state.students, r.studentId);
      return st && st.grade && st.grade !== gradeLevel;
    });
    if (conflict) return { ok: false, error: 'Derste farklı sınıf seviyesinde öğrenci var; önce onları çıkarın.' };
    var prev = session.gradeLevel;
    session.gradeLevel = gradeLevel;
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'updated',
        description: 'Ders sınıf seviyesi güncellendi.',
        previousValue: prev,
        newValue: gradeLevel,
        reason: reason
      });
    }
    touch();
    return { ok: true, session: session };
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
    if (session.gradeLevel && req.studentGrade && session.gradeLevel !== req.studentGrade) {
      return { ok: false, error: 'Dersin sınıf seviyesi (' + session.gradeLevel + ') öğrencinin sınıfı (' + req.studentGrade + ') ile uyuşmuyor.' };
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
        description: 'Talep derse atandı: ' + getLessonCode(session)
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

  function markAllApprovedLinksSent() {
    var count = 0;
    state.reservations.forEach(function (r) {
      if (r.status === 'cancelled') return;
      if (r.parentApprovalStatus === 'approved' && !r.linkSent) {
        var res = markLinkSent(r.id);
        if (res.ok) count += 1;
      }
    });
    touch();
    return { ok: true, count: count };
  }

  function updateStudent(studentId, patch) {
    var st = find(state.students, studentId);
    if (!st) return { ok: false, error: 'Öğrenci bulunamadı.' };
    if (patch.firstName) st.firstName = String(patch.firstName).trim();
    if (patch.lastName) st.lastName = String(patch.lastName).trim();
    if (patch.grade) st.grade = String(patch.grade).trim();
    if (patch.level) st.level = String(patch.level).trim();
    if (patch.age !== undefined && patch.age !== '') st.age = parseInt(patch.age, 10) || st.age;
    if (patch.notes !== undefined) st.notes = patch.notes;
    st.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'student',
        entityId: studentId,
        action: 'updated',
        description: 'Öğrenci bilgileri güncellendi.'
      });
    }
    touch();
    return { ok: true, student: st };
  }

  function updateParent(parentId, patch) {
    var pa = find(state.parents, parentId);
    if (!pa) return { ok: false, error: 'Veli bulunamadı.' };
    if (patch.firstName) pa.firstName = String(patch.firstName).trim();
    if (patch.lastName) pa.lastName = String(patch.lastName).trim();
    if (patch.phone) pa.phone = String(patch.phone).trim();
    if (patch.email) pa.email = String(patch.email).trim();
    if (patch.notes !== undefined) pa.notes = patch.notes;
    pa.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'parent',
        entityId: parentId,
        action: 'updated',
        description: 'Veli bilgileri güncellendi.'
      });
    }
    touch();
    return { ok: true, parent: pa };
  }

  // Veli + öğrencilerini tek seferde günceller ve talep (requests) tablosundaki denormalize
  // kopyaları (ad/telefon/e-posta/öğrenci adı) da eşitler. Böylece Öğrenciler, Rezervasyon
  // Talepleri, Operasyon Merkezi ve tüm detaylar aynı veriyi gösterir. İşlev mantığı bozulmaz:
  // talep↔öğrenci bağı ad ile, talep↔veli bağı telefon ile kurulduğundan eski değerlerle eşleşilir.
  function updateParentFamily(parentId, patch) {
    var pa = find(state.parents, parentId);
    if (!pa) return { ok: false, error: 'Veli bulunamadı.' };
    patch = patch || {};

    // Eski kimlikleri mutasyondan ÖNCE yakala (denormalize eşleştirme için).
    var oldParentDigits = String(pa.phone || '').replace(/\D/g, '');
    var studentOld = {};
    (pa.studentIds || []).forEach(function (sid) {
      var st = find(state.students, sid);
      if (st) studentOld[sid] = { first: st.firstName, last: st.lastName };
    });

    var now = new Date().toISOString();
    function audit(entityType, entityId, action, desc, oldV, newV) {
      if (Audit) Audit.append(state, { entityType: entityType, entityId: entityId, action: action, description: desc, previousValue: oldV, newValue: newV, createdAt: now });
    }

    // Veli alanları — her değişen alan için eski/yeni değerli denetim kaydı.
    var p = patch.parent || {};
    var paName = pa.firstName + ' ' + pa.lastName;
    if (p.firstName != null && String(p.firstName).trim() && String(p.firstName).trim() !== pa.firstName) { var of = pa.firstName; pa.firstName = String(p.firstName).trim(); audit('parent', parentId, 'name_changed', 'Veli adı güncellendi.', of + ' ' + pa.lastName, pa.firstName + ' ' + pa.lastName); }
    if (p.lastName != null && String(p.lastName).trim() && String(p.lastName).trim() !== pa.lastName) { var ol = pa.lastName; pa.lastName = String(p.lastName).trim(); audit('parent', parentId, 'name_changed', 'Veli soyadı güncellendi.', pa.firstName + ' ' + ol, pa.firstName + ' ' + pa.lastName); }
    if (p.phone != null && String(p.phone).trim() && String(p.phone).trim() !== pa.phone) { var op = pa.phone; pa.phone = String(p.phone).trim(); audit('parent', parentId, 'phone_changed', 'Veli telefonu güncellendi (' + pa.firstName + ' ' + pa.lastName + ').', op, pa.phone); }
    if (p.email != null && String(p.email).trim() && String(p.email).trim() !== pa.email) { var oe = pa.email; pa.email = String(p.email).trim(); audit('parent', parentId, 'email_changed', 'Veli e-postası güncellendi (' + pa.firstName + ' ' + pa.lastName + ').', oe || '—', pa.email); }
    pa.updatedAt = now;

    // Öğrenci bilgileri (sadece bu veliye bağlı öğrenciler) — eski/yeni değerli denetim.
    (patch.students || []).forEach(function (sp) {
      if (!sp || !sp.id || (pa.studentIds || []).indexOf(sp.id) < 0) return;
      var st = find(state.students, sp.id);
      if (!st) return;
      var full = function () { return st.firstName + ' ' + st.lastName; };
      if (sp.firstName != null && String(sp.firstName).trim() && String(sp.firstName).trim() !== st.firstName) { var sf = st.firstName; st.firstName = String(sp.firstName).trim(); audit('student', st.id, 'name_changed', 'Öğrenci adı güncellendi.', sf + ' ' + st.lastName, full()); }
      if (sp.lastName != null && String(sp.lastName).trim() && String(sp.lastName).trim() !== st.lastName) { var sl = st.lastName; st.lastName = String(sp.lastName).trim(); audit('student', st.id, 'name_changed', 'Öğrenci soyadı güncellendi.', st.firstName + ' ' + sl, full()); }
      if (sp.grade != null && String(sp.grade).trim() && String(sp.grade).trim() !== st.grade) { var sg = st.grade; st.grade = String(sp.grade).trim(); audit('student', st.id, 'grade_changed', 'Öğrenci sınıfı güncellendi (' + full() + ').', sg, st.grade); }
      if (sp.requestedLessonTypeId != null && String(sp.requestedLessonTypeId).trim()) st.requestedLessonTypeId = String(sp.requestedLessonTypeId).trim();
      st.updatedAt = now;
    });

    // Yeni öğrenci(ler) ekle ve veliye bağla (talep/rezervasyon oluşmaz; sadece kayıt).
    var created = [];
    (patch.newStudents || []).forEach(function (ns) {
      if (!ns || !String(ns.firstName || '').trim() || !String(ns.lastName || '').trim()) return;
      var sid = nextId('student', state.students);
      var st = {
        id: sid,
        source: 'trial_lesson_application',
        firstName: String(ns.firstName).trim(),
        lastName: String(ns.lastName).trim(),
        age: parseInt(ns.age, 10) || 11,
        grade: ns.grade || GRADES[0],
        level: ns.level || LEVELS[0],
        requestedLessonTypeId: ns.requestedLessonTypeId || 'lt-mat',
        parentIds: [parentId],
        status: 'new_request',
        hasUsedFreeTrialForLessonTypeIds: [],
        notes: '',
        createdAt: now,
        updatedAt: now
      };
      state.students.push(st);
      pa.studentIds.push(sid);
      created.push(st);
      audit('student', sid, 'created', 'Veliye yeni öğrenci eklendi (' + st.firstName + ' ' + st.lastName + ').', '—', st.firstName + ' ' + st.lastName);
    });

    // Talep tablosundaki denormalize kopyaları eşitle.
    state.requests.forEach(function (req) {
      var reqDigits = String(req.parentPhone || '').replace(/\D/g, '');
      var belongs = (oldParentDigits && reqDigits === oldParentDigits) ||
        state.reservations.some(function (r) { return r.requestId === req.id && r.parentId === parentId; });
      if (!belongs) return;
      req.parentFirstName = pa.firstName;
      req.parentLastName = pa.lastName;
      req.parentPhone = pa.phone;
      req.parentEmail = pa.email;
      (pa.studentIds || []).forEach(function (sid) {
        var st = find(state.students, sid);
        var old = studentOld[sid];
        if (!st || !old) return;
        var nameMatch = req.studentFirstName === old.first && req.studentLastName === old.last;
        var resMatch = state.reservations.some(function (r) { return r.requestId === req.id && r.studentId === sid; });
        if (nameMatch || resMatch) {
          req.studentFirstName = st.firstName;
          req.studentLastName = st.lastName;
          if (st.grade) req.studentGrade = st.grade;
        }
      });
    });

    touch();
    return { ok: true, parent: pa, createdStudents: created };
  }

  function guardTrialManagerEntityCreate() {
    var user = find(state.users, state.currentUserId);
    if (user && user.role === 'trial_lesson_manager') {
      return { ok: false, error: 'Deneme Dersi Yöneticisi bu kaynağı oluşturamaz. Veriler Ana Admin Panel veya başvuru formundan gelir.' };
    }
    return { ok: true };
  }

  function updateApplicationContactInfo(parentId, patch) {
    var pa = find(state.parents, parentId);
    if (!pa) return { ok: false, error: 'Veli bulunamadı.' };
    if (pa.source && pa.source !== 'trial_lesson_application') {
      return { ok: false, error: 'Bu veli kaydı başvuru formu dışından gelmiş görünüyor.' };
    }
    var changes = [];
    if (patch.phone !== undefined && String(patch.phone).trim() !== pa.phone) {
      pa.phone = String(patch.phone).trim();
      changes.push('telefon');
    }
    if (patch.email !== undefined && String(patch.email).trim() !== pa.email) {
      pa.email = String(patch.email).trim();
      changes.push('e-posta');
    }
    if (patch.notes !== undefined) pa.notes = patch.notes;
    if (patch.preferredChannels && Array.isArray(patch.preferredChannels)) {
      pa.preferredChannels = patch.preferredChannels.slice();
      changes.push('iletişim kanalı');
    } else if (patch.preferredChannel) {
      pa.preferredChannels = [patch.preferredChannel];
      changes.push('iletişim kanalı');
    }
    pa.updatedAt = new Date().toISOString();
    if (!changes.length && patch.notes === undefined) {
      return { ok: false, error: 'Değişiklik yapılmadı.' };
    }
    if (Audit) {
      Audit.append(state, {
        entityType: 'parent',
        entityId: parentId,
        action: 'application_contact_corrected',
        description: changes.length
          ? ('Veli ' + changes.join(' ve ') + ' bilgisi başvuru iletişim düzeltmesi kapsamında güncellendi.')
          : 'Veli iletişim notu başvuru düzeltmesi kapsamında güncellendi.'
      });
    }
    touch();
    return { ok: true, parent: pa };
  }

  function updateApplicationStudentInfo(studentId, patch) {
    var st = find(state.students, studentId);
    if (!st) return { ok: false, error: 'Öğrenci bulunamadı.' };
    if (st.source && st.source !== 'trial_lesson_application') {
      return { ok: false, error: 'Bu öğrenci kaydı başvuru formu dışından gelmiş görünüyor.' };
    }
    var warnings = [];
    var nextLessonType = patch.requestedLessonTypeId || st.requestedLessonTypeId;
    if (patch.requestedLessonTypeId && patch.requestedLessonTypeId !== st.requestedLessonTypeId) {
      if (Rules && Rules.hasStudentAlreadyUsedFreeTrialForLessonType(studentId, patch.requestedLessonTypeId)) {
        return { ok: false, error: 'Öğrenci bu ders türünde daha önce ücretsiz deneme dersi almış.' };
      }
      var activeRes = state.reservations.find(function (r) {
        return r.studentId === studentId && (r.status === 'confirmed' || r.status === 'pending');
      });
      if (activeRes) {
        var sess = find(state.sessions, activeRes.sessionId);
        if (sess && sess.lessonTypeId !== patch.requestedLessonTypeId) {
          warnings.push('Mevcut atanmış ders yeni ders türüyle uyumsuz — ders değişikliği gerekebilir.');
        }
        if (sess && Rules && !Rules.isBranchTeacherEligibleForLessonType(sess.branchTeacherId, patch.requestedLessonTypeId)) {
          warnings.push('Mevcut öğretmen yeni ders türüne uygun değil.');
        }
      }
    }
    if (patch.firstName) st.firstName = String(patch.firstName).trim();
    if (patch.lastName) st.lastName = String(patch.lastName).trim();
    if (patch.grade) st.grade = String(patch.grade).trim();
    if (patch.level) st.level = String(patch.level).trim();
    if (patch.age !== undefined && patch.age !== '') st.age = parseInt(patch.age, 10) || st.age;
    if (patch.requestedLessonTypeId) st.requestedLessonTypeId = patch.requestedLessonTypeId;
    if (patch.notes !== undefined) st.notes = patch.notes;
    st.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'student',
        entityId: studentId,
        action: 'application_student_corrected',
        description: 'Başvuru öğrenci bilgisi operasyonel düzeltme kapsamında güncellendi.'
      });
    }
    touch();
    return { ok: true, student: st, warnings: warnings };
  }

  function updateTeacherOperationalNotes(teacherId, patch) {
    var t = find(state.teachers, teacherId);
    if (!t) return { ok: false, error: 'Öğretmen bulunamadı.' };
    if (patch.trialLessonNotes !== undefined) t.trialLessonNotes = patch.trialLessonNotes;
    if (patch.informedNote !== undefined) t.informedNote = patch.informedNote;
    if (Audit) {
      Audit.append(state, {
        entityType: 'teacher',
        entityId: teacherId,
        action: 'operational_note_updated',
        description: 'Deneme dersi operasyon notları güncellendi.'
      });
    }
    touch();
    return { ok: true, teacher: t };
  }

  function updateTeacher(teacherId, patch) {
    var t = find(state.teachers, teacherId);
    if (!t) return { ok: false, error: 'Öğretmen bulunamadı.' };
    if (patch.phone) t.phone = String(patch.phone).trim();
    if (patch.email) t.email = String(patch.email).trim();
    if (patch.notes !== undefined) t.notes = patch.notes;
    if (Audit) {
      Audit.append(state, {
        entityType: 'teacher',
        entityId: teacherId,
        action: 'updated',
        description: 'Öğretmen bilgileri güncellendi.'
      });
    }
    touch();
    return { ok: true, teacher: t };
  }

  function updateTeacherAvailability(teacherId, slots) {
    var t = find(state.teachers, teacherId);
    if (!t) return { ok: false, error: 'Öğretmen bulunamadı.' };
    if (!Array.isArray(slots) || !slots.length) {
      return { ok: false, error: 'Müsaitlik listesi geçersiz.' };
    }
    t.availability = slots.map(function (s) {
      var dow = parseInt(s.dayOfWeek, 10);
      return {
        id: s.id || (teacherId + '-av-' + dow),
        teacherId: teacherId,
        dayOfWeek: dow,
        startTime: String(s.startTime || '11:00').trim(),
        endTime: String(s.endTime || '15:00').trim(),
        isAvailable: !!s.isAvailable
      };
    });
    if (Audit) {
      Audit.append(state, {
        entityType: 'teacher',
        entityId: teacherId,
        action: 'availability_updated',
        description: 'Öğretmen müsaitlik programı güncellendi.'
      });
    }
    touch();
    return { ok: true, teacher: t };
  }

  function getEligibleStudentsForSession(sessionId) {
    if (!Rules) return state.students.slice();
    return state.students.filter(function (st) {
      return Rules.canAssignStudentToSession(st.id, sessionId).allowed;
    });
  }

  function addStudentToSession(sessionId, studentId) {
    var session = find(state.sessions, sessionId);
    if (!session) return { ok: false, error: 'Ders bulunamadı.' };
    if (session.status === 'cancelled' || session.status === 'completed') {
      return { ok: false, error: 'Tamamlanmış veya iptal dersine öğrenci eklenemez.' };
    }
    var student = find(state.students, studentId);
    if (!student) return { ok: false, error: 'Öğrenci bulunamadı.' };
    if (Rules) {
      var check = Rules.canAssignStudentToSession(studentId, sessionId);
      if (!check.allowed) return { ok: false, error: check.reason };
    }
    var parentId = student.parentIds && student.parentIds[0];
    if (!parentId) return { ok: false, error: 'Öğrencinin bağlı velisi yok.' };
    var rSeq = state.reservations.length + 1;
    var rid = 'res-' + String(rSeq).padStart(4, '0');
    var reservation = {
      id: rid,
      studentId: student.id,
      parentId: parentId,
      sessionId: session.id,
      lessonTypeId: session.lessonTypeId,
      status: 'pending',
      parentApprovalStatus: 'not_called',
      linkSent: false,
      communicationLogIds: [],
      enrolled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.reservations.push(reservation);
    session.enrolledStudentIds.push(student.id);
    session.reservationIds.push(rid);
    session.updatedAt = new Date().toISOString();
    if (student.status === 'new_request') student.status = 'awaiting_assignment';
    student.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'student_assigned',
        description: student.firstName + ' ' + student.lastName + ' derse eklendi.',
        newValue: { studentId: student.id, reservationId: rid }
      });
    }
    touch();
    return { ok: true, reservation: reservation };
  }

  function removeStudentFromSession(sessionId, reservationId, reason) {
    var session = find(state.sessions, sessionId);
    var res = find(state.reservations, reservationId);
    if (!session || !res) return { ok: false, error: 'Kayıt bulunamadı.' };
    if (res.sessionId !== sessionId) return { ok: false, error: 'Rezervasyon bu derse ait değil.' };
    if (session.status === 'completed') return { ok: false, error: 'Tamamlanmış dersten öğrenci çıkarılamaz.' };
    if (!reason || !String(reason).trim()) return { ok: false, error: 'Çıkarma nedeni zorunludur.' };
    res.status = 'cancelled';
    res.cancellationReason = String(reason).trim();
    res.updatedAt = new Date().toISOString();
    var idx = session.enrolledStudentIds.indexOf(res.studentId);
    if (idx >= 0) session.enrolledStudentIds.splice(idx, 1);
    var ridx = session.reservationIds.indexOf(res.id);
    if (ridx >= 0) session.reservationIds.splice(ridx, 1);
    session.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: sessionId,
        action: 'student_removed',
        description: 'Öğrenci dersten çıkarıldı.',
        reason: reason
      });
    }
    touch();
    return { ok: true };
  }

  function moveReservationToSession(reservationId, newSessionId, reason, options) {
    options = options || {};
    if (!reason || !String(reason).trim()) {
      return { ok: false, error: 'Değişiklik nedeni zorunludur.' };
    }
    if (!options.parentApproved) {
      return { ok: false, error: 'Veli onayı işaretlenmeden taşınamaz.' };
    }
    var res = find(state.reservations, reservationId);
    if (!res) return { ok: false, error: 'Rezervasyon bulunamadı.' };
    if (res.status === 'cancelled' || res.status === 'rescheduled') {
      return { ok: false, error: 'Bu rezervasyon taşınamaz.' };
    }
    var oldSession = find(state.sessions, res.sessionId);
    var newSession = find(state.sessions, newSessionId);
    if (!oldSession || !newSession) return { ok: false, error: 'Ders bulunamadı.' };
    if (oldSession.id === newSession.id) return { ok: false, error: 'Öğrenci zaten bu derste.' };
    if (newSession.status === 'cancelled' || newSession.status === 'completed') {
      return { ok: false, error: 'Hedef ders uygun değil.' };
    }
    if (newSession.lessonTypeId !== res.lessonTypeId) {
      return { ok: false, error: 'Ders türü uyuşmuyor.' };
    }
    if (Rules && Rules.getSessionRemainingCapacity(newSessionId) <= 0) {
      return { ok: false, error: 'Hedef dersin kapasitesi dolu.' };
    }
    if (Rules) {
      var check = Rules.canAssignStudentToSession(res.studentId, newSessionId);
      if (!check.allowed) return { ok: false, error: check.reason };
    }
    var student = find(state.students, res.studentId);
    var parent = find(state.parents, res.parentId);
    var reasonText = String(reason).trim();

    res.status = 'rescheduled';
    res.changeReason = reasonText;
    res.updatedAt = new Date().toISOString();
    var sidx = oldSession.enrolledStudentIds.indexOf(res.studentId);
    if (sidx >= 0) oldSession.enrolledStudentIds.splice(sidx, 1);
    var ridx = oldSession.reservationIds.indexOf(res.id);
    if (ridx >= 0) oldSession.reservationIds.splice(ridx, 1);
    oldSession.updatedAt = new Date().toISOString();

    var newResId = nextId('res', state.reservations);
    var newRes = {
      id: newResId,
      requestId: res.requestId,
      studentId: res.studentId,
      parentId: res.parentId,
      sessionId: newSessionId,
      lessonTypeId: res.lessonTypeId,
      status: res.parentApprovalStatus === 'approved' ? 'confirmed' : 'pending',
      parentApprovalStatus: res.parentApprovalStatus,
      linkSent: false,
      communicationLogIds: [],
      enrolled: false,
      changeReason: reasonText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.reservations.push(newRes);
    newSession.enrolledStudentIds.push(res.studentId);
    newSession.reservationIds.push(newResId);
    newSession.updatedAt = new Date().toISOString();

    if (res.requestId) {
      var req = find(state.requests, res.requestId);
      if (req) {
        req.selectedSessionId = newSessionId;
        req.status = req.status === 'new' ? 'assigned' : req.status;
        req.updatedAt = new Date().toISOString();
      }
    }
    if (student && student.status !== 'enrolled') {
      student.status = 'scheduled';
      student.updatedAt = new Date().toISOString();
    }

    if (Audit) {
      var stName = student ? student.firstName + ' ' + student.lastName : res.studentId;
      Audit.append(state, {
        entityType: 'reservation',
        entityId: res.id,
        action: 'rescheduled',
        description: stName + ' başka derse taşındı.',
        reason: reasonText,
        previousValue: { sessionId: oldSession.id },
        newValue: { sessionId: newSessionId, reservationId: newResId }
      });
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: oldSession.id,
        action: 'student_removed',
        description: stName + ' dersten taşındı.',
        reason: reasonText
      });
      Audit.append(state, {
        entityType: 'trial_lesson_session',
        entityId: newSessionId,
        action: 'student_assigned',
        description: stName + ' derse taşındı.',
        reason: reasonText,
        newValue: { studentId: res.studentId, reservationId: newResId }
      });
    }
    touch();
    return {
      ok: true,
      oldReservation: res,
      newReservation: newRes,
      student: student,
      parent: parent,
      oldSession: oldSession,
      newSession: newSession
    };
  }

  function getDataConsistencySnapshot() {
    var metrics = getOperationMetrics();
    var enrolledStudents = state.students.filter(function (s) { return s.status === 'enrolled'; }).length;
    var reservationEnrolled = state.reservations.filter(function (r) { return r.enrolled; }).length;
    var orphanCount = state.requests.filter(function (r) { return isOrphanRequest(r.id); }).length;
    return {
      metrics: metrics,
      enrolledStudents: enrolledStudents,
      reservationEnrolled: reservationEnrolled,
      orphanCount: orphanCount,
      issues: [
        metrics.conversionCount !== enrolledStudents ? 'Kayıt sayısı (öğrenci) ile operasyon metriği uyuşmuyor.' : null,
        metrics.orphanRequestCount !== orphanCount ? 'Rezervasyonsuz talep sayısı uyuşmuyor.' : null
      ].filter(Boolean)
    };
  }

  function nextId(prefix, collection) {
    var max = 0;
    collection.forEach(function (item) {
      var m = String(item.id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return prefix + '-' + String(max + 1).padStart(collection.length >= 100 ? 4 : 2, '0');
  }

  function createParent(draft) {
    var denied = guardTrialManagerEntityCreate();
    if (!denied.ok) return denied;
    if (!draft || !draft.firstName || !draft.lastName || !draft.phone) {
      return { ok: false, error: 'Veli adı, soyadı ve telefon zorunludur.' };
    }
    var id = nextId('parent', state.parents);
    var pa = {
      id: id,
      source: draft.source || 'trial_lesson_application',
      firstName: String(draft.firstName).trim(),
      lastName: String(draft.lastName).trim(),
      phone: String(draft.phone).trim(),
      email: String(draft.email || '').trim(),
      studentIds: [],
      preferredChannels: ['phone', 'whatsapp'],
      notes: draft.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.parents.push(pa);
    if (Audit) {
      Audit.append(state, {
        entityType: 'parent',
        entityId: id,
        action: 'created',
        description: 'Yeni veli kaydı oluşturuldu.'
      });
    }
    touch();
    return { ok: true, parent: pa };
  }

  function createStudent(draft) {
    var denied = guardTrialManagerEntityCreate();
    if (!denied.ok) return denied;
    if (!draft || !draft.firstName || !draft.lastName) {
      return { ok: false, error: 'Öğrenci adı ve soyadı zorunludur.' };
    }
    var parentId = draft.parentId;
    if (!parentId && draft.parentFirstName && draft.parentPhone) {
      var pRes = createParent({
        firstName: draft.parentFirstName,
        lastName: draft.parentLastName || draft.lastName,
        phone: draft.parentPhone,
        email: draft.parentEmail || ''
      });
      if (!pRes.ok) return pRes;
      parentId = pRes.parent.id;
    }
    if (!parentId) return { ok: false, error: 'Veli seçin veya yeni veli bilgilerini doldurun.' };
    var parent = find(state.parents, parentId);
    if (!parent) return { ok: false, error: 'Veli bulunamadı.' };
    var id = nextId('student', state.students);
    var st = {
      id: id,
      source: draft.source || 'trial_lesson_application',
      firstName: String(draft.firstName).trim(),
      lastName: String(draft.lastName).trim(),
      age: parseInt(draft.age, 10) || 11,
      grade: draft.grade || GRADES[0],
      level: draft.level || LEVELS[0],
      requestedLessonTypeId: draft.requestedLessonTypeId || 'lt-mat',
      parentIds: [parentId],
      status: 'new_request',
      hasUsedFreeTrialForLessonTypeIds: [],
      notes: draft.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    state.students.push(st);
    if (parent.studentIds.indexOf(id) < 0) parent.studentIds.push(id);
    parent.updatedAt = new Date().toISOString();
    if (Audit) {
      Audit.append(state, {
        entityType: 'student',
        entityId: id,
        action: 'created',
        description: 'Yeni öğrenci kaydı oluşturuldu.'
      });
    }
    touch();
    return { ok: true, student: st, parent: parent };
  }

  function createTeacher(draft) {
    var denied = guardTrialManagerEntityCreate();
    if (!denied.ok) return denied;
    if (!draft || !draft.firstName || !draft.lastName || !draft.phone) {
      return { ok: false, error: 'Öğretmen adı, soyadı ve telefon zorunludur.' };
    }
    var ltId = draft.lessonTypeId || 'lt-mat';
    var id = nextId('teacher', state.teachers);
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
    var t = {
      id: id,
      source: 'admin_panel',
      firstName: String(draft.firstName).trim(),
      lastName: String(draft.lastName).trim(),
      phone: String(draft.phone).trim(),
      email: String(draft.email || '').trim(),
      teacherType: draft.teacherType || 'branch',
      branchLessonTypeIds: [ltId],
      availability: avail,
      dashboardEnabled: true,
      isActive: true,
      notes: draft.notes || '',
      trialLessonNotes: '',
      informedNote: ''
    };
    state.teachers.push(t);
    if (Audit) {
      Audit.append(state, {
        entityType: 'teacher',
        entityId: id,
        action: 'created',
        description: 'Yeni öğretmen kaydı oluşturuldu.'
      });
    }
    touch();
    return { ok: true, teacher: t };
  }

  function createSimulatedRequest(draft) {
    draft = draft || {};
    var hasCustom = draft.studentFirstName || draft.parentPhone;
    if (hasCustom && (!draft.studentFirstName || !draft.studentLastName || !draft.parentFirstName || !draft.parentPhone)) {
      return { ok: false, error: 'Öğrenci adı/soyadı ve veli adı/telefon zorunludur.' };
    }
    var seq = state.requests.length + 1;
    var id = 'request-' + String(seq).padStart(4, '0');
    var pools = [
      { studentFirstName: 'Melis', studentLastName: 'Ergin', studentAge: 10, studentGrade: '5. Sınıf', studentLevel: 'Başlangıç', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Umut', parentLastName: 'Ergin', parentPhone: '0531 220 8891', parentEmail: 'umut.ergin@mail.com' },
      { studentFirstName: 'Kaan', studentLastName: 'Polat', studentAge: 12, studentGrade: '6. Sınıf', studentLevel: 'Orta', requestedLessonTypeId: 'lt-fen', parentFirstName: 'İrem', parentLastName: 'Polat', parentPhone: '0538 441 0021', parentEmail: 'irem.polat@mail.com' }
    ];
    var sample = pools[seq % pools.length];
    var ltId = draft.requestedLessonTypeId || sample.requestedLessonTypeId;
    var sessions = getAvailableSessionsForLessonType(ltId);
    var session = null;
    if (draft.selectedSessionId) {
      session = find(state.sessions, draft.selectedSessionId);
      if (!session || session.lessonTypeId !== ltId) {
        return { ok: false, error: 'Seçilen ders slotu geçersiz veya ders türüyle uyumsuz.' };
      }
      if (session.status === 'cancelled' || session.status === 'completed') {
        return { ok: false, error: 'Seçilen ders slotu artık uygun değil.' };
      }
    } else if (draft.selectedSessionId === undefined && !hasCustom) {
      session = sessions[0] || state.sessions.find(function (s) { return s.status !== 'cancelled'; });
    }
    var req = {
      id: id,
      studentFirstName: draft.studentFirstName || sample.studentFirstName,
      studentLastName: draft.studentLastName || sample.studentLastName,
      studentAge: parseInt(draft.studentAge, 10) || sample.studentAge,
      studentGrade: draft.studentGrade || sample.studentGrade,
      studentLevel: draft.studentLevel || sample.studentLevel,
      requestedLessonTypeId: ltId,
      parentFirstName: draft.parentFirstName || sample.parentFirstName,
      parentLastName: draft.parentLastName || sample.parentLastName,
      parentPhone: draft.parentPhone || sample.parentPhone,
      parentEmail: draft.parentEmail || sample.parentEmail,
      selectedSessionId: draft.selectedSessionId !== undefined
        ? (draft.selectedSessionId || undefined)
        : (session ? session.id : undefined),
      preferredSessionId: (draft.selectedSessionId && find(state.sessions, draft.selectedSessionId))
        ? draft.selectedSessionId
        : (session ? session.id : undefined),
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
    var pdrTeacher = find(state.teachers, session.pdrTeacherId);
    var branchTeacher = find(state.teachers, session.branchTeacherId);
    var lessonType = find(state.lessonTypes, session.lessonTypeId);
    var reservations = state.reservations.filter(function (r) { return r.sessionId === sessionId; });
    var participants = reservations.map(function (r) {
      var st = find(state.students, r.studentId);
      var pa = find(state.parents, r.parentId);
      return { reservation: r, student: st, parent: pa };
    });
    return {
      session: session,
      meeting: meeting,
      pdrTeacher: pdrTeacher,
      branchTeacher: branchTeacher,
      teacher: branchTeacher,
      lessonType: lessonType,
      reservations: reservations,
      participants: participants
    };
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
    var pdrNotInformed = state.sessions.filter(function (s) {
      return s.status !== 'cancelled' && s.status !== 'completed' && s.pdrTeacherId && !s.pdrTeacherInformed;
    });
    var branchNotInformed = state.sessions.filter(function (s) {
      return s.status !== 'cancelled' && s.status !== 'completed' && s.branchTeacherId && !s.branchTeacherInformed;
    });
    var missingTeachers = state.sessions.filter(function (s) {
      return s.status !== 'cancelled' && (!s.pdrTeacherId || !s.branchTeacherId);
    });
    var teacherNotInformed = pdrNotInformed.concat(branchNotInformed.filter(function (s) {
      return pdrNotInformed.indexOf(s) < 0;
    }));
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
    var newRequests = state.requests.filter(function (r) { return r.status === 'new' && !r.deleted; });
    var studentCountToday = 0;
    todaySessions.forEach(function (s) { studentCountToday += s.enrolledStudentIds.length; });
    var actionableCount = pendingApproval.length + linkNotSent.length + orphanRequests.length +
      teacherNotInformed.length + needsAttendance.length + missingTeachers.length;

    return {
      todaySessionCount: todaySessions.length,
      todayStudentCount: studentCountToday,
      pendingApprovalCount: pendingApproval.length,
      linkNotSentCount: linkNotSent.length,
      teacherNotInformedCount: teacherNotInformed.length,
      pdrNotInformedCount: pdrNotInformed.length,
      branchNotInformedCount: branchNotInformed.length,
      missingTeacherAssignmentCount: missingTeachers.length,
      cancelledCount: cancelled.length,
      needsAttendanceCount: needsAttendance.length,
      conversionCount: enrolled.length,
      orphanRequestCount: orphanRequests.length,
      newRequestCount: newRequests.length,
      actionableCount: actionableCount,
      todaySessions: todaySessions,
      pendingApproval: pendingApproval,
      linkNotSent: linkNotSent,
      teacherNotInformed: teacherNotInformed,
      pdrNotInformed: pdrNotInformed,
      branchNotInformed: branchNotInformed,
      missingTeacherAssignments: missingTeachers,
      needsAttendance: needsAttendance,
      orphanRequests: orphanRequests,
      newRequests: newRequests
    };
  }

  global.TMStore = {
    getLessonTypes: function () { return state.lessonTypes.slice(); },
    getGrades: function () { return GRADES.slice(); },
    getLevels: function () { return LEVELS.slice(); },
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
    getReservationCode: getReservationCode,
    getLessonCode: getLessonCode,
    isOrphanRequest: isOrphanRequest,
    approveParentForRequest: approveParentForRequest,
    updateParentApproval: updateParentApproval,
    createReservationFromRequest: createReservationFromRequest,
    updateSessionNotes: updateSessionNotes,
    changeSessionGradeLevel: changeSessionGradeLevel,
    rejectRequest: rejectRequest,
    deleteRequest: deleteRequest,
    reactivateRequest: reactivateRequest,
    assignRequestToSession: assignRequestToSession,
    getAvailableSessionsForLessonType: getAvailableSessionsForLessonType,
    convertStudentToEnrollment: convertStudentToEnrollment,
    updateStudent: updateStudent,
    updateParent: updateParent,
    updateParentFamily: updateParentFamily,
    updateTeacher: updateTeacher,
    updateTeacherAvailability: updateTeacherAvailability,
    updateTeacherOperationalNotes: updateTeacherOperationalNotes,
    updateApplicationContactInfo: updateApplicationContactInfo,
    updateApplicationStudentInfo: updateApplicationStudentInfo,
    createStudent: createStudent,
    createParent: createParent,
    createTeacher: createTeacher,
    getEligibleStudentsForSession: getEligibleStudentsForSession,
    addStudentToSession: addStudentToSession,
    removeStudentFromSession: removeStudentFromSession,
    moveReservationToSession: moveReservationToSession,
    getDataConsistencySnapshot: getDataConsistencySnapshot,
    markBulkLinksSentForSession: markBulkLinksSentForSession,
    markAllApprovedLinksSent: markAllApprovedLinksSent,
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
      return state.sessions.filter(function (s) {
        return s.pdrTeacherId === teacherId || s.branchTeacherId === teacherId;
      });
    },
    todayKey: todayKey,
    createSession: createSession,
    cancelSession: cancelSession,
    changeSessionTeacher: changeSessionTeacher,
    changeSessionPdrTeacher: changeSessionPdrTeacher,
    changeSessionBranchTeacher: changeSessionBranchTeacher,
    changeSessionLessonType: changeSessionLessonType,
    rescheduleSession: rescheduleSession,
    refreshMeetingPasscode: refreshMeetingPasscode,
    markLinkSent: markLinkSent,
    markTeacherInformed: markTeacherInformed,
    markPdrTeacherInformed: markPdrTeacherInformed,
    markBranchTeacherInformed: markBranchTeacherInformed,
    notifyAllParentsForSession: notifyAllParentsForSession,
    addCommunicationLog: addCommunicationLog,
    setRequestContactStatus: setRequestContactStatus,
    markAttendance: markAttendance,
    updateUserPermissions: updateUserPermissions,
    resetMockData: resetMockData,
    exportMockSnapshot: exportMockSnapshot,
    importMockSnapshot: importMockSnapshot,
    getMockStats: getMockStats,
    createSimulatedRequest: createSimulatedRequest,
    switchCurrentUser: switchCurrentUser,
    _state: state
  };
})(typeof window !== 'undefined' ? window : this);
