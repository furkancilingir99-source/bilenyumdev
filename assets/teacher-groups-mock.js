/**
 * Öğretmen klan & birebir öğrenci mock verisi
 * window.TeacherGroupsMock
 */
(function (global) {
  'use strict';

  var TEACHER_BRANCH = 'Matematik';

  var CLANS = [
    {
      id: 'clan-001',
      name: 'Ejderhalar Klanı',
      emoji: '🐉',
      gradeLevel: '5. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      branch: TEACHER_BRANCH,
      logoUrl: null,
      studentCount: 8,
      lessonCount: 12,
      completedLessonCount: 8,
      rank: 1,
      totalXp: 18450,
      programType: 'Hafta içi Erken',
      students: [
        { name: 'Ali Yılmaz', xp: 1240 },
        { name: 'Zeynep Demir', xp: 1180 },
        { name: 'Can Öztürk', xp: 1095 },
        { name: 'Elif Kaya', xp: 980 },
        { name: 'Burak Şahin', xp: 910 },
        { name: 'Deniz Aydın', xp: 870 },
        { name: 'Mert Arslan', xp: 820 },
        { name: 'İrem Güneş', xp: 760 }
      ],
      upcomingLesson: { date: '2026-06-30', time: '09:00', topic: 'Kesirlerle İşlemler' },
      recentLessons: [
        { date: '2026-06-27', time: '09:00', topic: 'Kesirlerle İşlemler', status: 'completed' },
        { date: '2026-06-25', time: '10:30', topic: 'Ondalık Sayılar', status: 'completed' },
        { date: '2026-06-30', time: '09:00', topic: 'Geometri Temelleri', status: 'upcoming' }
      ]
    },
    {
      id: 'clan-002',
      name: 'Kartallar Klanı',
      emoji: '🦅',
      gradeLevel: '6. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      branch: TEACHER_BRANCH,
      logoUrl: null,
      studentCount: 6,
      lessonCount: 10,
      completedLessonCount: 6,
      rank: 2,
      totalXp: 14220,
      programType: 'Hafta içi Geç',
      students: [
        { name: 'Yusuf Çelik', xp: 1110 },
        { name: 'Ayşe Korkmaz', xp: 1020 },
        { name: 'Emir Doğan', xp: 940 },
        { name: 'Selin Aksoy', xp: 880 },
        { name: 'Kerem Yıldız', xp: 815 },
        { name: 'Nazlı Erdem', xp: 740 }
      ],
      upcomingLesson: { date: '2026-07-01', time: '10:30', topic: 'Ondalık Sayılar' },
      recentLessons: [
        { date: '2026-06-26', time: '10:30', topic: 'Ondalık Sayılar', status: 'completed' },
        { date: '2026-07-01', time: '10:30', topic: 'Cebirsel İfadeler', status: 'upcoming' }
      ]
    },
    {
      id: 'clan-003',
      name: 'Aslanlar Klanı',
      emoji: '🦁',
      gradeLevel: '5. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      branch: TEACHER_BRANCH,
      logoUrl: null,
      studentCount: 5,
      lessonCount: 8,
      completedLessonCount: 5,
      rank: 3,
      totalXp: 11980,
      programType: 'Hafta sonu Sabah',
      students: [
        { name: 'Ece Polat', xp: 990 },
        { name: 'Arda Kaya', xp: 905 },
        { name: 'Defne Şen', xp: 860 },
        { name: 'Tuna Acar', xp: 790 },
        { name: 'Berk Aydın', xp: 720 }
      ],
      upcomingLesson: { date: '2026-07-02', time: '13:00', topic: 'Geometri Temelleri' },
      recentLessons: [
        { date: '2026-06-24', time: '13:00', topic: 'Doğal Sayılar', status: 'completed' },
        { date: '2026-07-02', time: '13:00', topic: 'Geometri Temelleri', status: 'upcoming' }
      ]
    }
  ];

  var ONE_TO_ONE_STUDENTS = [
    {
      id: 'student-001',
      name: 'Ali Yılmaz',
      gradeLevel: '6. Sınıf',
      branch: TEACHER_BRANCH,
      programType: 'Hafta içi Akşam',
      lessonCount: 6,
      completedLessonCount: 4,
      globalRank: '#214',
      nextLesson: { date: '2026-06-29', time: '15:00', topic: 'Kesir Problemleri' },
      recentLessons: [
        { date: '2026-06-22', time: '15:00', topic: 'Kesir Problemleri', status: 'completed' },
        { date: '2026-06-29', time: '15:00', topic: 'Kesir Problemleri', status: 'upcoming' }
      ]
    },
    {
      id: 'student-002',
      name: 'Zeynep Demir',
      gradeLevel: '7. Sınıf',
      branch: TEACHER_BRANCH,
      programType: 'Hafta içi Erken',
      lessonCount: 4,
      completedLessonCount: 3,
      globalRank: '#67',
      nextLesson: { date: '2026-07-03', time: '09:00', topic: 'Olasılık Giriş' },
      recentLessons: [
        { date: '2026-06-26', time: '09:00', topic: 'Oran Orantı', status: 'completed' },
        { date: '2026-07-03', time: '09:00', topic: 'Olasılık Giriş', status: 'upcoming' }
      ]
    },
    {
      id: 'student-003',
      name: 'Can Öztürk',
      gradeLevel: '6. Sınıf',
      branch: TEACHER_BRANCH,
      programType: 'Hafta içi Geç',
      lessonCount: 5,
      completedLessonCount: 3,
      globalRank: '#412',
      nextLesson: { date: '2026-06-30', time: '09:00', topic: 'Veri Analizi' },
      recentLessons: [
        { date: '2026-06-23', time: '09:00', topic: 'Veri Analizi', status: 'completed' },
        { date: '2026-06-30', time: '09:00', topic: 'Veri Analizi', status: 'upcoming' }
      ]
    },
    {
      id: 'student-004',
      name: 'Elif Kaya',
      gradeLevel: '5. Sınıf',
      branch: TEACHER_BRANCH,
      programType: 'Hafta sonu Sabah',
      lessonCount: 3,
      completedLessonCount: 2,
      globalRank: '#95',
      nextLesson: { date: '2026-07-02', time: '08:30', topic: 'Doğal Sayılar' },
      recentLessons: [
        { date: '2026-06-25', time: '08:30', topic: 'Doğal Sayılar', status: 'completed' },
        { date: '2026-07-02', time: '08:30', topic: 'Doğal Sayılar', status: 'upcoming' }
      ]
    },
    {
      id: 'student-005',
      name: 'Burak Şahin',
      gradeLevel: '6. Sınıf',
      branch: TEACHER_BRANCH,
      programType: 'Hafta içi Erken',
      lessonCount: 4,
      completedLessonCount: 2,
      globalRank: '#178',
      nextLesson: { date: '2026-06-30', time: '10:30', topic: 'Veri Analizi' },
      recentLessons: [
        { date: '2026-06-28', time: '10:30', topic: 'Yüzdeler', status: 'completed' },
        { date: '2026-06-30', time: '10:30', topic: 'Veri Analizi', status: 'upcoming' }
      ]
    }
  ];

  function delay(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function normalizeClan(clan) {
    if (!clan) return null;
    var copy = Object.assign({}, clan);
    if (copy.students && copy.students.length) {
      copy.studentCount = copy.students.length;
    }
    return copy;
  }

  function getClans() {
    return delay(280).then(function () {
      return CLANS.map(normalizeClan);
    });
  }

  function getOneToOneStudents() {
    return delay(280).then(function () {
      return ONE_TO_ONE_STUDENTS.slice();
    });
  }

  function getClanById(id) {
    return normalizeClan(CLANS.find(function (c) { return c.id === id; }) || null);
  }

  function getStudentById(id) {
    return ONE_TO_ONE_STUDENTS.find(function (s) { return s.id === id; }) || null;
  }

  function findClanStudentMeta(studentName, clanName) {
    var clan = CLANS.find(function (c) { return c.name === clanName; });
    if (!clan || !clan.students || !clan.students.length) return null;
    var sorted = clan.students.slice().sort(function (a, b) { return b.xp - a.xp; });
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].name === studentName) {
        return { xp: sorted[i].xp, clanRank: '#' + (i + 1) };
      }
    }
    return null;
  }

  function findClanIdByName(clanName) {
    var clan = CLANS.find(function (c) { return c.name === clanName; });
    return clan ? clan.id : null;
  }

  global.TeacherGroupsMock = {
    TEACHER_BRANCH: TEACHER_BRANCH,
    getClans: getClans,
    getOneToOneStudents: getOneToOneStudents,
    getClanById: getClanById,
    getStudentById: getStudentById,
    findClanStudentMeta: findClanStudentMeta,
    findClanIdByName: findClanIdByName
  };
})(typeof window !== 'undefined' ? window : global);
