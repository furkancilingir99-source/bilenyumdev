/**
 * Öğretmen dashboard mock verisi — gerçek API bağlantısına hazır.
 * window.TeacherDashboardMock
 */
(function (global) {
  'use strict';

  var DEMO_TODAY = '2026-06-29';
  var DEMO_TODAY_NOW = DEMO_TODAY + 'T09:30:00';
  var DEMO_WEEK_NOW = DEMO_TODAY + 'T14:30:00';
  var DEMO_EDU_WEEK = 17;
  var TEACHER_BRANCH = 'Matematik';
  var EDU_TERM_START = new Date(2026, 2, 10);
  var MIN_EDU_WEEK = 1;
  var MAX_EDU_WEEK = 30;
  var SHORT_MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  var CLANS = {
    'clan-001': { id: 'clan-001', name: 'Ejderhalar Klanı', logoUrl: null, emoji: '🐉', gradeLevel: '5. Sınıf', branch: TEACHER_BRANCH, programType: 'Hafta içi Erken', educationWeek: '17. Eğitim Haftası' },
    'clan-002': { id: 'clan-002', name: 'Kartallar Klanı', logoUrl: null, emoji: '🦅', gradeLevel: '6. Sınıf', branch: TEACHER_BRANCH, programType: 'Hafta içi Geç', educationWeek: '17. Eğitim Haftası' },
    'clan-003': { id: 'clan-003', name: 'Aslanlar Klanı', logoUrl: null, emoji: '🦁', gradeLevel: '5. Sınıf', branch: TEACHER_BRANCH, programType: 'Hafta sonu Sabah', educationWeek: '17. Eğitim Haftası' }
  };

  var STUDENTS = [
    { id: 'student-001', name: 'Ali Yılmaz', gradeLevel: '6. Sınıf' },
    { id: 'student-002', name: 'Zeynep Demir', gradeLevel: '7. Sınıf' },
    { id: 'student-003', name: 'Can Öztürk', gradeLevel: '6. Sınıf' },
    { id: 'student-004', name: 'Elif Kaya', gradeLevel: '5. Sınıf' },
    { id: 'student-005', name: 'Burak Şahin', gradeLevel: '6. Sınıf' }
  ];

  var TRIAL_TOPICS = [
    { title: 'Ücretsiz Tanıtım Dersi', topic: 'Platform ve ders akışı tanıtımı', content: 'Öğrenci ve veliye platform, ders formatı ve matematik programı tanıtılır.' },
    { title: 'Seviye Belirleme', topic: 'Ön değerlendirme çalışması', content: 'Öğrencinin mevcut matematik seviyesi kısa etkinliklerle ölçülür.' },
    { title: 'Deneme Dersi', topic: 'Kesirler giriş', content: 'Kesir kavramı ve günlük hayat örnekleri üzerinden tanıtım dersi.' },
    { title: 'Deneme Dersi', topic: 'Problem çözme stratejileri', content: 'Örnek problemlerle öğretmen-öğrenci uyumu ve çalışma temposu gözlemlenir.' }
  ];

  var MATH_TOPICS = [
    { title: 'Kesirlerle İşlemler', topic: 'Paydaları eşitleme', content: 'Kesirlerde toplama ve çıkarma işlemleri.' },
    { title: 'Ondalık Sayılar', topic: 'Dört işlem', content: 'Ondalık sayılarda toplama, çıkarma ve karşılaştırma.' },
    { title: 'Geometri Temelleri', topic: 'Açılar ve üçgenler', content: 'Açı ölçme ve üçgen sınıflandırması.' },
    { title: 'Doğal Sayılar', topic: 'Sayı sistemleri', content: 'Doğal sayılarla çarpma ve bölme işlemleri.' },
    { title: 'Kesir Problemleri', topic: 'Günlük hayat', content: 'Kesir içeren sözel problemler.' },
    { title: 'Yüzdeler', topic: 'Yüzde hesaplama', content: 'Yüzde ile ilgili temel problemler.' },
    { title: 'Cebirsel İfadeler', topic: 'Basit denklemler', content: 'Bir bilinmeyenli denklem kurma ve çözme.' },
    { title: 'Veri Analizi', topic: 'Grafik okuma', content: 'Sütun ve daire grafiklerinden veri çıkarma.' },
    { title: 'Alan Hesabı', topic: 'Dikdörtgen ve kare', content: 'Düzlemsel şekillerde alan hesaplama.' },
    { title: 'Çarpanlar ve Katlar', topic: 'EBOB-EKOK', content: 'Çarpanlara ayırma ve ortak bölenler.' },
    { title: 'Oran Orantı', topic: 'Orantı kurma', content: 'Doğru orantı problemleri.' },
    { title: 'Olasılık Giriş', topic: 'Temel olasılık', content: 'Basit olaylarda olasılık hesabı.' }
  ];

  var GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf'];
  var CLAN_IDS = ['clan-001', 'clan-002', 'clan-003'];
  var TIME_SLOTS = ['08:30', '09:00', '09:45', '10:30', '11:15', '13:00', '13:45', '14:30', '15:00', '15:45', '16:30'];

  function pad2(n) { n = Math.floor(n); return (n < 10 ? '0' : '') + n; }

  function endTimeFromStart(start, durMin) {
    var p = start.split(':');
    var total = (+p[0]) * 60 + (+p[1]) + (durMin || 45);
    return pad2(Math.floor(total / 60) % 24) + ':' + pad2(total % 60);
  }

  var KID_TOPICS = [
    { title: 'Kesirlerde Kavram İnşa', topic: 'Kesir modeli ve günlük hayat bağlantısı', content: 'Öğrenciler kesir kavramını somut materyaller ve tartışma ile inşa eder.' },
    { title: 'Ondalık Sayılar KİD', topic: 'Ondalık gösterim üzerine sınıf tartışması', content: 'Ondalık sayıların anlamı grup etkinlikleriyle yapılandırılır.' },
    { title: 'Geometri Kavram İnşa', topic: 'Açı ve kenar ilişkileri', content: 'Geometrik kavramlar öğrenci örnekleri üzerinden sınıfta inşa edilir.' }
  ];

  var RUD_TOPICS = [
    { title: 'Problem Çözme Uygulaması', topic: 'Rehberli problem çözme stratejileri', content: 'Öğretmen rehberliğinde adım adım problem çözme uygulaması yapılır.' },
    { title: 'Kesir Problemleri RUD', topic: 'Kesir içeren sözel problemler', content: 'Küçük gruplar halinde rehberli uygulama ve paylaşım.' },
    { title: 'Veri Analizi Uygulaması', topic: 'Grafik okuma ve yorumlama', content: 'Grafikler üzerinden rehberli sınıf uygulaması gerçekleştirilir.' }
  ];

  /** Bugünün Akışı hero için sabit dersler */
  var PINNED_TODAY_LESSONS = [
    {
      id: 'lesson-today-001', type: 'clan', date: DEMO_TODAY, startTime: '09:00', endTime: '09:45',
      durationMinutes: 45, lessonName: 'Matematik', lessonTitle: 'Kesirlerle İşlemler',
      lessonTopic: 'Paydaları eşitleme ve toplama işlemleri',
      lessonContent: 'Bu derste öğrenciler kesirlerde toplama ve çıkarma işlemlerini örnek problemler üzerinden öğrenecek.',
      educationWeek: '17. Eğitim Haftası', gradeLevel: '5. Sınıf',
      clan: CLANS['clan-001'], student: null, meetingUrl: 'ogretmen-canli-ders.html'
    },
    {
      id: 'lesson-today-002', type: 'kid', date: DEMO_TODAY, startTime: '10:30', endTime: '11:15',
      durationMinutes: 45, lessonName: 'Matematik', lessonTitle: 'Ondalık Sayılar KİD',
      lessonTopic: 'Ondalık gösterim üzerine sınıf tartışması',
      lessonContent: 'Ondalık sayıların anlamı kavram inşa etkinlikleriyle yapılandırılır.',
      educationWeek: '17. Eğitim Haftası', gradeLevel: '6. Sınıf',
      clan: CLANS['clan-002'], student: null, meetingUrl: 'ogretmen-canli-ders.html'
    },
    {
      id: 'lesson-today-003', type: 'rud', date: DEMO_TODAY, startTime: '13:00', endTime: '13:45',
      durationMinutes: 45, lessonName: 'Matematik', lessonTitle: 'Problem Çözme Uygulaması',
      lessonTopic: 'Rehberli problem çözme stratejileri',
      lessonContent: 'Öğretmen rehberliğinde adım adım problem çözme uygulaması yapılır.',
      educationWeek: '17. Eğitim Haftası', gradeLevel: '5. Sınıf',
      clan: CLANS['clan-001'], student: null, meetingUrl: 'ogretmen-canli-ders.html'
    },
    {
      id: 'lesson-today-004', type: 'one_to_one', date: DEMO_TODAY, startTime: '15:00', endTime: '15:45',
      durationMinutes: 45, lessonName: 'Matematik', lessonTitle: 'Kesir Problemleri',
      lessonTopic: 'Günlük hayat problemleri',
      lessonContent: 'Birebir ders kapsamında kesir problemleri çözüm stratejileri uygulanacak.',
      educationWeek: '17. Eğitim Haftası', gradeLevel: '6. Sınıf',
      clan: null, student: STUDENTS[0], meetingUrl: 'ogretmen-canli-ders.html'
    }
  ];

  function generateLessonsForEduWeek(weekNum, demoWeek) {
    var count = 15 + (weekNum % 6);
    var monday = eduWeekStart(weekNum);
    var lessons = [];
    var daySlotCount = {};
    var topicIdx = 0;

    for (var i = 0; i < count; i++) {
      var weekday = i % 6;
      var dateISO = formatDateISO(addDays(monday, weekday));
      var slotIdx = daySlotCount[dateISO] || 0;
      daySlotCount[dateISO] = slotIdx + 1;
      var startTime = TIME_SLOTS[slotIdx % TIME_SLOTS.length];
      var dur = 45;
      var typeRoll = i % 8;
      var lessonType;
      if (typeRoll === 2 || typeRoll === 6) lessonType = 'free_trial';
      else if (typeRoll === 4) lessonType = 'one_to_one';
      else if (typeRoll === 1 || typeRoll === 5) lessonType = 'kid';
      else if (typeRoll === 3 || typeRoll === 7) lessonType = 'rud';
      else lessonType = 'clan';
      var isBirebir = lessonType === 'one_to_one';
      var isTrial = lessonType === 'free_trial';
      var isKid = lessonType === 'kid';
      var isRud = lessonType === 'rud';
      var topic = isTrial
        ? TRIAL_TOPICS[topicIdx % TRIAL_TOPICS.length]
        : isKid
          ? KID_TOPICS[topicIdx % KID_TOPICS.length]
          : isRud
            ? RUD_TOPICS[topicIdx % RUD_TOPICS.length]
            : MATH_TOPICS[topicIdx % MATH_TOPICS.length];
      topicIdx += 1;
      var clanId = CLAN_IDS[i % CLAN_IDS.length];
      if (isTrial) dur = 45;

      var birebirStudent = isBirebir ? STUDENTS[i % STUDENTS.length] : null;
      var clanRef = (lessonType === 'clan' || lessonType === 'kid' || lessonType === 'rud') ? CLANS[clanId] : null;
      // Ücretsiz deneme: öğrencisi/klanı yok; yalnızca "Birebir Ders" ya da "Klan Dersi" modunu taşır
      var trialMode = isTrial ? (typeRoll === 2 ? 'one_to_one' : 'clan') : null;
      var gradeLevel = isBirebir
        ? (birebirStudent && birebirStudent.gradeLevel) || GRADES[i % GRADES.length]
        : (clanRef && clanRef.gradeLevel) || GRADES[i % GRADES.length];

      var lesson = {
        id: 'lesson-w' + weekNum + '-' + (i + 1),
        type: lessonType,
        date: dateISO,
        startTime: startTime,
        endTime: endTimeFromStart(startTime, dur),
        durationMinutes: dur,
        lessonName: 'Matematik',
        lessonTitle: topic.title,
        lessonTopic: topic.topic,
        lessonContent: topic.content,
        educationWeek: weekNum + '. Eğitim Haftası',
        gradeLevel: gradeLevel,
        clan: clanRef,
        student: birebirStudent,
        trialMode: trialMode,
        meetingUrl: null
      };

      if (weekNum < demoWeek) {
        lesson.status = 'completed';
      } else if (weekNum > demoWeek) {
        lesson.status = 'upcoming';
      }

      lessons.push(lesson);
    }
    return lessons;
  }

  function buildAllLessons() {
    var demoWeek = findEduWeekForDate(DEMO_TODAY);
    var all = [];
    var w;

    for (w = demoWeek - 2; w <= demoWeek + 2; w++) {
      if (w >= MIN_EDU_WEEK && w <= MAX_EDU_WEEK) {
        all = all.concat(generateLessonsForEduWeek(w, demoWeek));
      }
    }

    all = all.filter(function (l) { return l.date !== DEMO_TODAY; });
    return all.concat(PINNED_TODAY_LESSONS);
  }

  var ALL_LESSONS = buildAllLessons();

  function parseDateTime(dateStr, timeStr) {
    var p = dateStr.split('-');
    var t = timeStr.split(':');
    return new Date(+p[0], +p[1] - 1, +p[2], +t[0], +t[1], 0);
  }

  function lessonEnd(lesson) {
    if (lesson.endTime) {
      var ep = lesson.endTime.split(':');
      var sp = lesson.date.split('-');
      return new Date(+sp[0], +sp[1] - 1, +sp[2], +ep[0], +ep[1], 0);
    }
    var start = parseDateTime(lesson.date, lesson.startTime);
    return new Date(start.getTime() + (lesson.durationMinutes || 45) * 60000);
  }

  function withStatus(lesson, now) {
    if (lesson.status) return Object.assign({}, lesson, { status: lesson.status });
    if (lesson.date < DEMO_TODAY) {
      return Object.assign({}, lesson, { status: 'completed' });
    }
    if (lesson.date > DEMO_TODAY) {
      return Object.assign({}, lesson, { status: 'upcoming' });
    }
    var end = lessonEnd(lesson);
    var status = end.getTime() <= now.getTime() ? 'completed' : 'upcoming';
    return Object.assign({}, lesson, { status: status });
  }

  function sortByTime(a, b) {
    var da = parseDateTime(a.date, a.startTime).getTime();
    var db = parseDateTime(b.date, b.startTime).getTime();
    return da - db;
  }

  function getMonday(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function formatDateISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function startOfWeekMonday(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var dow = x.getDay();
    var diff = dow === 0 ? -6 : 1 - dow;
    x.setDate(x.getDate() + diff);
    return x;
  }

  function eduWeekStart(weekNum) {
    return startOfWeekMonday(addDays(EDU_TERM_START, (weekNum - 1) * 7));
  }

  function eduWeekEndExclusive(weekNum) {
    return addDays(eduWeekStart(weekNum), 7);
  }

  function findEduWeekForDate(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    for (var w = MIN_EDU_WEEK; w <= MAX_EDU_WEEK; w++) {
      if (d >= eduWeekStart(w) && d < eduWeekEndExclusive(w)) return w;
    }
    return MAX_EDU_WEEK;
  }

  function formatEduWeekLabel(weekNum) {
    return weekNum + '. Eğitim Haftası';
  }

  function formatEduWeekRange(weekNum) {
    var start = eduWeekStart(weekNum);
    var end = addDays(start, 6);
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return start.getDate() + ' — ' + end.getDate() + ' ' + SHORT_MONTH_NAMES[end.getMonth()] + ' ' + end.getFullYear();
    }
    return start.getDate() + ' ' + SHORT_MONTH_NAMES[start.getMonth()] + ' — ' + end.getDate() + ' ' + SHORT_MONTH_NAMES[end.getMonth()] + ' ' + end.getFullYear();
  }

  function eduWeekStartISO(weekNum) {
    return formatDateISO(eduWeekStart(weekNum));
  }

  function countLessonsForEduWeek(weekNum) {
    var monday = eduWeekStart(weekNum);
    var range = getWeekRange(monday);
    return ALL_LESSONS.filter(function (l) {
      return l.date >= range.start && l.date <= range.end && l.lessonName === TEACHER_BRANCH;
    }).length;
  }

  function getWeekRange(weekStart) {
    var end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return { start: formatDateISO(weekStart), end: formatDateISO(end) };
  }

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  var api = {
    DEMO_TODAY: DEMO_TODAY,
    DEMO_EDU_WEEK: DEMO_EDU_WEEK,
    TEACHER_BRANCH: TEACHER_BRANCH,

    filterByBranch: function (lessons) {
      return lessons.filter(function (l) { return l.lessonName === TEACHER_BRANCH; });
    },

    getToday: function (options) {
      options = options || {};
      var simulate = options.simulate !== false;
      var now = options.now ? new Date(options.now) : new Date(DEMO_TODAY_NOW);
      var today = DEMO_TODAY;

      return delay(simulate ? 400 : 0).then(function () {
        if (options.forceError) throw new Error('mock');
        var dayLessons = ALL_LESSONS
          .filter(function (l) { return l.date === today; })
          .map(function (l) { return withStatus(l, now); })
          .sort(sortByTime);
        var lessons = api.filterByBranch(dayLessons);
        return { date: today, lessons: lessons, now: now.toISOString() };
      });
    },

    getWeek: function (weekStartISO, options) {
      options = options || {};
      var simulate = options.simulate !== false;
      var now = options.now ? new Date(options.now) : new Date(DEMO_WEEK_NOW);
      var monday = weekStartISO ? new Date(weekStartISO + 'T12:00:00') : getMonday(DEMO_TODAY);
      var range = getWeekRange(monday);

      return delay(simulate ? 500 : 0).then(function () {
        if (options.forceError) throw new Error('mock');
        var lessons = ALL_LESSONS
          .filter(function (l) {
            return l.date >= range.start && l.date <= range.end;
          })
          .map(function (l) { return withStatus(l, now); })
          .sort(sortByTime);
        return {
          weekStart: range.start,
          weekEnd: range.end,
          educationWeek: findEduWeekForDate(range.start),
          lessons: lessons,
          now: now.toISOString()
        };
      });
    },

    getWeekByEduWeek: function (eduWeekNum, options) {
      return api.getWeek(eduWeekStartISO(eduWeekNum), options).then(function (data) {
        data.educationWeek = eduWeekNum;
        return data;
      });
    },

    getLessonById: function (id) {
      for (var i = 0; i < ALL_LESSONS.length; i++) {
        if (ALL_LESSONS[i].id === id) return ALL_LESSONS[i];
      }
      return null;
    },

    getMonday: getMonday,
    formatDateISO: formatDateISO,
    parseDateTime: parseDateTime,
    sortByTime: sortByTime,
    withStatus: withStatus,
    MIN_EDU_WEEK: MIN_EDU_WEEK,
    MAX_EDU_WEEK: MAX_EDU_WEEK,
    findEduWeekForDate: findEduWeekForDate,
    formatEduWeekLabel: formatEduWeekLabel,
    formatEduWeekRange: formatEduWeekRange,
    eduWeekStartISO: eduWeekStartISO,
    countLessonsForEduWeek: countLessonsForEduWeek
  };

  global.TeacherDashboardMock = api;
})(typeof window !== 'undefined' ? window : global);
