/**
 * Ödev Kontrol mock verisi
 */
(function (global) {
  'use strict';

  var CLANS = [
    {
      id: 'clan-001', name: 'Ejderhalar Klanı', emoji: '🐉', gradeLevel: '5. Sınıf',
      educationWeek: '17. Eğitim Haftası', logoUrl: null,
      homeworkStats: { totalAssignments: 5, missingSubmissionCount: 0 },
      nearestDueDate: '2026-06-30'
    },
    {
      id: 'clan-002', name: 'Kartallar Klanı', emoji: '🦅', gradeLevel: '6. Sınıf',
      educationWeek: '17. Eğitim Haftası', logoUrl: null,
      homeworkStats: { totalAssignments: 2, missingSubmissionCount: 1 },
      nearestDueDate: '2026-07-02'
    },
    {
      id: 'clan-003', name: 'Aslanlar Klanı', emoji: '🦁', gradeLevel: '5. Sınıf',
      educationWeek: '17. Eğitim Haftası', logoUrl: null,
      homeworkStats: { totalAssignments: 1, missingSubmissionCount: 0 },
      nearestDueDate: null
    }
  ];

  var BIREBIR_STUDENTS = [
    {
      id: 'student-001', name: 'Ali Yılmaz', gradeLevel: '6. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      homeworkStats: { totalAssignments: 6, missingSubmissionCount: 3 },
      nearestDueDate: '2026-06-30'
    },
    {
      id: 'student-002', name: 'Zeynep Demir', gradeLevel: '7. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      homeworkStats: { totalAssignments: 3, missingSubmissionCount: 1 },
      nearestDueDate: '2026-07-03'
    },
    {
      id: 'student-003', name: 'Can Öztürk', gradeLevel: '6. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      homeworkStats: { totalAssignments: 2, missingSubmissionCount: 1 },
      nearestDueDate: '2026-07-01'
    },
    {
      id: 'student-004', name: 'Elif Kaya', gradeLevel: '5. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      homeworkStats: { totalAssignments: 1, missingSubmissionCount: 1 },
      nearestDueDate: '2026-07-02'
    },
    {
      id: 'student-005', name: 'Burak Şahin', gradeLevel: '6. Sınıf',
      educationWeek: '17. Eğitim Haftası',
      homeworkStats: { totalAssignments: 1, missingSubmissionCount: 0 },
      nearestDueDate: null
    }
  ];

  var BIREBIR_HOMEWORKS = [
    {
      id: 'homework-b001', studentId: 'student-001', homeworkType: 'kid',
      title: 'Kesir Kavram İnşa Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Günlük hayat problemleri', dueDate: '2026-06-30',
      totalStudents: 1, completedStudents: 0, missingStudents: 1
    },
    {
      id: 'homework-b002', studentId: 'student-001', homeworkType: 'rud',
      title: 'Yüzde Hesaplama RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Yüzde ile ilgili temel problemler', dueDate: '2026-07-04',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b003', studentId: 'student-002', homeworkType: 'rud',
      title: 'Olasılık Giriş RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Basit olaylarda olasılık', dueDate: '2026-07-03',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b004', studentId: 'student-003', homeworkType: 'rud',
      title: 'Veri Analizi RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Sütun grafik okuma', dueDate: '2026-07-01',
      totalStudents: 1, completedStudents: 0, missingStudents: 1
    },
    {
      id: 'homework-b005', studentId: 'student-003', homeworkType: 'rud',
      title: 'Cebirsel İfadeler RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Basit denklemler', dueDate: '2026-07-05',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b006', studentId: 'student-004', homeworkType: 'rud',
      title: 'Doğal Sayılar Tekrarı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çarpma ve bölme işlemleri', dueDate: '2026-07-02',
      totalStudents: 1, completedStudents: 0, missingStudents: 1
    },
    {
      id: 'homework-b007', studentId: 'student-005', homeworkType: 'rud',
      title: 'Veri Analizi RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Daire grafikleri', dueDate: '2026-07-06',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b008', studentId: 'student-001', homeworkType: 'rud',
      title: 'Oran Orantı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Günlük hayat oran problemleri', dueDate: '2026-07-02',
      totalStudents: 1, completedStudents: 0, missingStudents: 1
    },
    {
      id: 'homework-b009', studentId: 'student-001', homeworkType: 'rud',
      title: 'Üçgenler Tekrarı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Açı ve kenar ilişkileri', dueDate: '2026-07-01',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b010', studentId: 'student-001', homeworkType: 'kid',
      title: 'Ondalık Kavram İnşa Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Ondalık gösterim', dueDate: '2026-06-29',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b011', studentId: 'student-001', homeworkType: 'rud',
      title: 'Problem Stratejileri RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Geriye doğru çalışma', dueDate: '2026-07-03',
      totalStudents: 1, completedStudents: 0, missingStudents: 1
    },
    {
      id: 'homework-b012', studentId: 'student-001', homeworkType: 'kid',
      title: 'Cebirsel İfadeler KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Basit cebirsel toplama', dueDate: '2026-07-05',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    },
    {
      id: 'homework-b013', studentId: 'student-002', homeworkType: 'kid',
      title: 'Olasılık KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Olasılık kavramı inşası', dueDate: '2026-07-02',
      totalStudents: 1, completedStudents: 0, missingStudents: 1
    },
    {
      id: 'homework-b014', studentId: 'student-002', homeworkType: 'kid',
      title: 'Denklem Kurma KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Bir bilinmeyenli denklemler', dueDate: '2026-07-04',
      totalStudents: 1, completedStudents: 1, missingStudents: 0
    }
  ];

  var BIREBIR_MISSING = [
    {
      id: 'b-miss-001', homeworkId: 'homework-b001', studentId: 'student-001',
      fullName: 'Ali Yılmaz', gradeLevel: '6. Sınıf',
      homeworkTitle: 'Kesir Kavram İnşa Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Günlük hayat problemleri', dueDate: '2026-06-30',
      status: 'not_completed',
      progress: { completedQuestions: 3, totalQuestions: 10, remainingQuestions: 7 },
      lastActivityAt: '2026-06-28T15:20:00', note: null
    },
    {
      id: 'b-miss-002', homeworkId: 'homework-b004', studentId: 'student-003',
      fullName: 'Can Öztürk', gradeLevel: '6. Sınıf',
      homeworkTitle: 'Veri Analizi RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Sütun grafik okuma', dueDate: '2026-07-01',
      status: 'not_completed',
      progress: { completedQuestions: 0, totalQuestions: 8, remainingQuestions: 8 },
      lastActivityAt: null, note: 'Henüz başlamadı'
    },
    {
      id: 'b-miss-003', homeworkId: 'homework-b006', studentId: 'student-004',
      fullName: 'Elif Kaya', gradeLevel: '5. Sınıf',
      homeworkTitle: 'Doğal Sayılar Tekrarı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çarpma ve bölme işlemleri', dueDate: '2026-07-02',
      status: 'not_completed',
      progress: { completedQuestions: 2, totalQuestions: 12, remainingQuestions: 10 },
      lastActivityAt: '2026-06-27T11:00:00', note: null
    },
    {
      id: 'b-miss-004', homeworkId: 'homework-b008', studentId: 'student-001',
      fullName: 'Ali Yılmaz', gradeLevel: '6. Sınıf',
      homeworkTitle: 'Oran Orantı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Günlük hayat oran problemleri', dueDate: '2026-07-02',
      status: 'not_completed',
      progress: { completedQuestions: 1, totalQuestions: 8, remainingQuestions: 7 },
      lastActivityAt: '2026-06-29T10:15:00', note: null
    },
    {
      id: 'b-miss-005', homeworkId: 'homework-b011', studentId: 'student-001',
      fullName: 'Ali Yılmaz', gradeLevel: '6. Sınıf',
      homeworkTitle: 'Problem Stratejileri RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Geriye doğru çalışma', dueDate: '2026-07-03',
      status: 'not_completed',
      progress: { completedQuestions: 0, totalQuestions: 10, remainingQuestions: 10 },
      lastActivityAt: null, note: 'Henüz başlamadı'
    },
    {
      id: 'b-miss-006', homeworkId: 'homework-b013', studentId: 'student-002',
      fullName: 'Zeynep Demir', gradeLevel: '7. Sınıf',
      homeworkTitle: 'Olasılık KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Olasılık kavramı inşası', dueDate: '2026-07-02',
      status: 'not_completed',
      progress: { completedQuestions: 0, totalQuestions: 6, remainingQuestions: 6 },
      lastActivityAt: null, note: 'Henüz başlamadı'
    }
  ];

  var HOMEWORKS = [
    {
      id: 'homework-001', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Kesirler Kavram İnşa Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Kesirlerde toplama ve çıkarma', dueDate: '2026-06-30',
      totalStudents: 8, completedStudents: 6, missingStudents: 2
    },
    {
      id: 'homework-002', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Problem Çözme RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çok adımlı problem çözme', dueDate: '2026-07-03',
      totalStudents: 8, completedStudents: 7, missingStudents: 1
    },
    {
      id: 'homework-003', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Geometri Uygulama RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Üçgenlerde açı ve kenar ilişkileri', dueDate: '2026-07-05',
      totalStudents: 8, completedStudents: 5, missingStudents: 3
    },
    {
      id: 'homework-007', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Ondalık Kavram İnşa Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Ondalık gösterim ve okuma', dueDate: '2026-06-23',
      totalStudents: 15, completedStudents: 10, missingStudents: 5
    },
    {
      id: 'homework-008', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Kesirler Problem RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Günlük hayatta kesir problemleri', dueDate: '2026-06-25',
      totalStudents: 15, completedStudents: 9, missingStudents: 6
    },
    {
      id: 'homework-009', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Oran Orantı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Oran-orantı ile problem çözme', dueDate: '2026-06-26',
      totalStudents: 15, completedStudents: 11, missingStudents: 4
    },
    {
      id: 'homework-010', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Çember ve Daire RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çemberin elemanları ve alan', dueDate: '2026-06-27',
      totalStudents: 15, completedStudents: 8, missingStudents: 7
    },
    {
      id: 'homework-011', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Veri Toplama KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Tablo ve grafik oluşturma', dueDate: '2026-06-28',
      totalStudents: 15, completedStudents: 12, missingStudents: 3
    },
    {
      id: 'homework-012', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Doğal Sayılar Tekrarı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çarpma ve bölme işlemleri', dueDate: '2026-06-17',
      totalStudents: 15, completedStudents: 14, missingStudents: 1
    },
    {
      id: 'homework-013', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Kesir Kavramı KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Kesir parçası ve bütün ilişkisi', dueDate: '2026-06-19',
      totalStudents: 15, completedStudents: 13, missingStudents: 2
    },
    {
      id: 'homework-014', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Grafik Okuma RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Sütun ve çizgi grafik yorumlama', dueDate: '2026-06-21',
      totalStudents: 15, completedStudents: 12, missingStudents: 3
    },
    {
      id: 'homework-015', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Yüzde Hesaplama RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Yüzde artış ve azalış problemleri', dueDate: '2026-07-01',
      totalStudents: 15, completedStudents: 7, missingStudents: 8
    },
    {
      id: 'homework-016', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Denklem Kurma KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Bir bilinmeyenli denklem inşası', dueDate: '2026-07-04',
      totalStudents: 15, completedStudents: 6, missingStudents: 9
    },
    {
      id: 'homework-017', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Olasılık Giriş KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Basit olaylarda olasılık hesabı', dueDate: '2026-07-08',
      totalStudents: 15, completedStudents: 0, missingStudents: 15
    },
    {
      id: 'homework-018', clanId: 'clan-001', homeworkType: 'kid',
      title: 'Cebirsel İfadeler KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Cebirsel ifade oluşturma', dueDate: '2026-07-10',
      totalStudents: 15, completedStudents: 0, missingStudents: 15
    },
    {
      id: 'homework-019', clanId: 'clan-001', homeworkType: 'rud',
      title: 'Problem Stratejileri RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Geriye doğru çalışma yöntemi', dueDate: '2026-07-11',
      totalStudents: 15, completedStudents: 0, missingStudents: 15
    },
    {
      id: 'homework-004', clanId: 'clan-002', homeworkType: 'rud',
      title: 'Ondalık Sayılar RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Ondalık sayılarla işlemler', dueDate: '2026-07-02',
      totalStudents: 6, completedStudents: 5, missingStudents: 1
    },
    {
      id: 'homework-005', clanId: 'clan-002', homeworkType: 'kid',
      title: 'Ondalık Kavram İnşa Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Ondalık işlemler', dueDate: '2026-07-04',
      totalStudents: 6, completedStudents: 6, missingStudents: 0
    },
    {
      id: 'homework-006', clanId: 'clan-003', homeworkType: 'kid',
      title: 'Kesir Karşılaştırma KİD Ödevi', lessonName: 'KİD Ödevi',
      lessonTopic: 'Kesirleri sıralama ve karşılaştırma', dueDate: '2026-07-06',
      totalStudents: 5, completedStudents: 5, missingStudents: 0
    }
  ];

  var STUDENTS = [
    {
      id: 'hw-miss-008-001', homeworkId: 'homework-008', clanId: 'clan-001',
      fullName: 'Elif Kaya', gradeLevel: '5. Sınıf',
      homeworkTitle: 'Kesirler Problem RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Günlük hayatta kesir problemleri', dueDate: '2026-06-25',
      status: 'not_completed',
      progress: { completedQuestions: 0, totalQuestions: 12, remainingQuestions: 12 },
      lastActivityAt: null, note: 'Henüz başlamadı'
    },
    {
      id: 'hw-miss-009-001', homeworkId: 'homework-009', clanId: 'clan-001',
      fullName: 'Ali Yılmaz', gradeLevel: '5. Sınıf',
      homeworkTitle: 'Oran Orantı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Oran-orantı ile problem çözme', dueDate: '2026-06-26',
      status: 'not_completed',
      progress: { completedQuestions: 2, totalQuestions: 8, remainingQuestions: 6 },
      lastActivityAt: '2026-06-25T14:30:00', note: null
    },
    {
      id: 'hw-miss-010-001', homeworkId: 'homework-010', clanId: 'clan-001',
      fullName: 'Can Öztürk', gradeLevel: '5. Sınıf',
      homeworkTitle: 'Çember ve Daire RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çemberin elemanları ve alan', dueDate: '2026-06-27',
      status: 'not_completed',
      progress: { completedQuestions: 0, totalQuestions: 10, remainingQuestions: 10 },
      lastActivityAt: null, note: 'Henüz başlamadı'
    },
    {
      id: 'hw-miss-012-001', homeworkId: 'homework-012', clanId: 'clan-001',
      fullName: 'Burak Şahin', gradeLevel: '5. Sınıf',
      homeworkTitle: 'Doğal Sayılar Tekrarı RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Çarpma ve bölme işlemleri', dueDate: '2026-06-17',
      status: 'not_completed',
      progress: { completedQuestions: 4, totalQuestions: 15, remainingQuestions: 11 },
      lastActivityAt: '2026-06-16T10:00:00', note: null
    },
    {
      id: 'student-005', homeworkId: 'homework-004', clanId: 'clan-002',
      fullName: 'Yusuf Çelik', gradeLevel: '6. Sınıf',
      homeworkTitle: 'Ondalık Sayılar RUD Ödevi', lessonName: 'RUD Ödevi',
      lessonTopic: 'Ondalık sayılarla işlemler', dueDate: '2026-07-02',
      status: 'not_completed',
      progress: { completedQuestions: 3, totalQuestions: 8, remainingQuestions: 5 },
      lastActivityAt: '2026-06-28T11:20:00', note: null
    }
  ];

  var CLAN_ROSTERS = {
    'clan-001': [
      'Ali Yılmaz', 'Zeynep Demir', 'Can Öztürk', 'Elif Kaya', 'Burak Şahin',
      'Deniz Aydın', 'Mert Arslan', 'İrem Güneş', 'Ege Yılmaz', 'Sude Karaca',
      'Onur Tekin', 'Melisa Koç', 'Kerem Polat', 'Lara Demir', 'Arda Güven'
    ],
    'clan-002': [
      'Yusuf Çelik', 'Ayşe Korkmaz', 'Emir Doğan', 'Selin Aksoy', 'Kerem Yıldız',
      'Nazlı Erdem', 'Berk Aktaş', 'Ceren Yalçın', 'Tolga Özkan', 'Derya Uçar'
    ],
    'clan-003': [
      'Ece Polat', 'Arda Kaya', 'Defne Şen', 'Tuna Acar', 'Berk Aydın',
      'Nil Güler', 'Kaan Ersoy', 'Asya Kurt'
    ]
  };

  function clanRoster(clanId) {
    var fallback = CLAN_ROSTERS[clanId] || [];
    var groupsApi = global.TeacherGroupsMock;
    if (groupsApi && groupsApi.getClanById) {
      var clan = groupsApi.getClanById(clanId);
      if (clan && clan.students && clan.students.length) {
        var fromGroups = clan.students.map(function (s) { return s.name; });
        return fromGroups.length > fallback.length ? fromGroups : fallback;
      }
    }
    return fallback;
  }

  function submissionBucket(student) {
    if (student.status === 'completed') return 'completed';
    if (!student.progress || student.progress.completedQuestions === 0) return 'not_completed';
    return 'in_progress';
  }

  function buildInProgressStudent(hw, clan, name, idx) {
    var total = 10 + (idx % 5);
    var done = Math.min(total - 1, Math.max(1, 2 + (idx % 7)));
    return {
      id: 'hw-prog-' + hw.id + '-' + idx,
      homeworkId: hw.id,
      clanId: hw.clanId,
      fullName: name,
      gradeLevel: clan.gradeLevel,
      homeworkTitle: hw.title,
      lessonName: hw.lessonName,
      lessonTopic: hw.lessonTopic,
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate || defaultAssignedDate(hw),
      status: 'not_completed',
      progress: {
        completedQuestions: done,
        totalQuestions: total,
        remainingQuestions: total - done
      },
      lastActivityAt: '2026-06-2' + (idx % 8) + 'T' + String(9 + (idx % 9)).padStart(2, '0') + ':15:00',
      note: null
    };
  }

  function buildNotStartedStudent(hw, clan, name, idx) {
    var total = 8 + (idx % 6);
    return {
      id: 'hw-miss-' + hw.id + '-' + idx,
      homeworkId: hw.id,
      clanId: hw.clanId,
      fullName: name,
      gradeLevel: clan.gradeLevel,
      homeworkTitle: hw.title,
      lessonName: hw.lessonName,
      lessonTopic: hw.lessonTopic,
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate || defaultAssignedDate(hw),
      status: 'not_completed',
      progress: { completedQuestions: 0, totalQuestions: total, remainingQuestions: total },
      lastActivityAt: null,
      note: 'Henüz başlamadı'
    };
  }

  function buildDemoClanStudent(hw, clan, name, idx) {
    var bucket = idx % 3;
    if (bucket === 0) return buildCompletedStudent(hw, clan, name, idx);
    if (bucket === 1) return buildInProgressStudent(hw, clan, name, idx);
    return buildNotStartedStudent(hw, clan, name, idx);
  }

  function buildCompletedStudent(hw, clan, name, idx) {
    var total = 10 + (idx % 3);
    return {
      id: 'hw-done-' + hw.id + '-' + idx,
      homeworkId: hw.id,
      clanId: hw.clanId,
      fullName: name,
      gradeLevel: clan.gradeLevel,
      homeworkTitle: hw.title,
      lessonName: hw.lessonName,
      lessonTopic: hw.lessonTopic,
      dueDate: hw.dueDate,
      assignedDate: hw.assignedDate || defaultAssignedDate(hw),
      status: 'completed',
      progress: { completedQuestions: total, totalQuestions: total, remainingQuestions: 0 },
      lastActivityAt: '2026-06-28T' + String(10 + (idx % 8)).padStart(2, '0') + ':30:00',
      note: null
    };
  }

  function buildHomeworkStudents(homeworkId) {
    var hw = HOMEWORKS.find(function (h) { return h.id === homeworkId; });
    if (hw) {
      var clan = CLANS.find(function (c) { return c.id === hw.clanId; });
      var roster = clanRoster(hw.clanId);
      var missingByName = {};
      STUDENTS.filter(function (s) { return s.homeworkId === homeworkId; }).forEach(function (s) {
        missingByName[s.fullName] = s;
      });
      return roster.map(function (name, idx) {
        if (missingByName[name]) return Object.assign({}, missingByName[name]);
        return buildDemoClanStudent(hw, clan, name, idx);
      });
    }

    var bhw = BIREBIR_HOMEWORKS.find(function (h) { return h.id === homeworkId; });
    if (!bhw) return [];
    var missing = BIREBIR_MISSING.find(function (s) { return s.homeworkId === homeworkId; });
    if (missing) return [Object.assign({}, missing)];
    var student = BIREBIR_STUDENTS.find(function (s) { return s.id === bhw.studentId; });
    if (!student) return [];
    return [{
      id: 'b-done-' + homeworkId,
      homeworkId: homeworkId,
      studentId: student.id,
      fullName: student.name,
      gradeLevel: student.gradeLevel,
      homeworkTitle: bhw.title,
      lessonName: bhw.lessonName,
      lessonTopic: bhw.lessonTopic,
      dueDate: bhw.dueDate,
      assignedDate: withAssignedDate(bhw).assignedDate,
      status: 'completed',
      progress: { completedQuestions: 10, totalQuestions: 10, remainingQuestions: 0 },
      lastActivityAt: '2026-06-28T16:00:00',
      note: null
    }];
  }

  function delay(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function dashApi() {
    return global.TeacherDashboardMock;
  }

  function eduWeekEndISO(weekNum) {
    var dapi = dashApi();
    if (!dapi || !weekNum) return null;
    var start = new Date(dapi.eduWeekStartISO(weekNum) + 'T12:00:00');
    start.setDate(start.getDate() + 6);
    return dapi.formatDateISO(start);
  }

  function isInEduWeek(dateStr, weekNum) {
    if (!weekNum || !dateStr) return true;
    var dapi = dashApi();
    if (!dapi) return true;
    var start = dapi.eduWeekStartISO(weekNum);
    var end = eduWeekEndISO(weekNum);
    return dateStr >= start && dateStr <= end;
  }

  function eduWeekLabel(weekNum) {
    var dapi = dashApi();
    return dapi ? dapi.formatEduWeekLabel(weekNum) : (weekNum + '. Eğitim Haftası');
  }

  function countMissingForHomeworks(homeworks) {
    var seen = {};
    var count = 0;
    homeworks.forEach(function (hw) {
      buildHomeworkStudents(hw.id).forEach(function (s) {
        if (submissionBucket(s) === 'completed') return;
        var key = hw.id + '|' + (s.fullName || s.id);
        if (!seen[key]) {
          seen[key] = true;
          count += 1;
        }
      });
    });
    return count;
  }

  function syncHomeworkCardStats(hw) {
    var students = buildHomeworkStudents(hw.id);
    var completed = students.filter(function (s) { return submissionBucket(s) === 'completed'; }).length;
    hw.totalStudents = students.length;
    hw.completedStudents = completed;
    hw.missingStudents = students.length - completed;
  }

  function formatDateISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function defaultAssignedDate(hw) {
    if (!hw || !hw.dueDate) return null;
    var d = new Date(hw.dueDate + 'T12:00:00');
    var offset = hw.homeworkType === 'kid' ? 5 : (hw.homeworkType === 'rud' ? 4 : 3);
    d.setDate(d.getDate() - offset);
    return formatDateISO(d);
  }

  function withAssignedDate(hw) {
    if (!hw) return hw;
    return Object.assign({}, hw, {
      assignedDate: hw.assignedDate || defaultAssignedDate(hw)
    });
  }

  HOMEWORKS.forEach(syncHomeworkCardStats);
  BIREBIR_HOMEWORKS.forEach(syncHomeworkCardStats);

  function nearestDueDate(homeworks) {
    var nearest = null;
    homeworks.forEach(function (hw) {
      if (!nearest || hw.dueDate < nearest) nearest = hw.dueDate;
    });
    return nearest;
  }

  function buildClanForWeek(clan, weekNum) {
    var hws = HOMEWORKS.filter(function (h) {
      return h.clanId === clan.id && isInEduWeek(h.dueDate, weekNum);
    });
    return Object.assign({}, clan, {
      educationWeek: eduWeekLabel(weekNum),
      homeworkStats: {
        totalAssignments: hws.length,
        missingSubmissionCount: countMissingForHomeworks(hws)
      },
      nearestDueDate: nearestDueDate(hws)
    });
  }

  function buildBirebirForWeek(student, weekNum) {
    var hws = BIREBIR_HOMEWORKS.filter(function (h) {
      return h.studentId === student.id && isInEduWeek(h.dueDate, weekNum);
    });
    return Object.assign({}, student, {
      educationWeek: eduWeekLabel(weekNum),
      homeworkStats: {
        totalAssignments: hws.length,
        missingSubmissionCount: countMissingForHomeworks(hws)
      },
      nearestDueDate: nearestDueDate(hws)
    });
  }

  function countHomeworksForEduWeek(weekNum) {
    var clanCount = HOMEWORKS.filter(function (h) { return isInEduWeek(h.dueDate, weekNum); }).length;
    var birebirCount = BIREBIR_HOMEWORKS.filter(function (h) { return isInEduWeek(h.dueDate, weekNum); }).length;
    return clanCount + birebirCount;
  }

  global.TeacherHomeworkMock = {
    getClans: function (opts) {
      return delay((opts && opts.simulate === false) ? 0 : 350).then(function () {
        if (opts && opts.forceError) throw new Error('mock');
        var week = opts && opts.eduWeek;
        if (!week) return CLANS.slice();
        return CLANS.map(function (clan) { return buildClanForWeek(clan, week); });
      });
    },
    getHomeworks: function (clanId, opts) {
      return delay((opts && opts.simulate === false) ? 0 : 300).then(function () {
        if (opts && opts.forceError) throw new Error('mock');
        var week = opts && opts.eduWeek;
        return HOMEWORKS.filter(function (h) {
          return h.clanId === clanId && (!week || isInEduWeek(h.dueDate, week));
        }).map(withAssignedDate);
      });
    },
    getMissingStudents: function (homeworkId, opts) {
      return delay((opts && opts.simulate === false) ? 0 : 300).then(function () {
        if (opts && opts.forceError) throw new Error('mock');
        return buildHomeworkStudents(homeworkId).filter(function (s) {
          return submissionBucket(s) !== 'completed';
        });
      });
    },
    getHomeworkStudents: function (homeworkId, opts) {
      return delay((opts && opts.simulate === false) ? 0 : 300).then(function () {
        if (opts && opts.forceError) throw new Error('mock');
        var hw = HOMEWORKS.find(function (h) { return h.id === homeworkId; })
          || BIREBIR_HOMEWORKS.find(function (h) { return h.id === homeworkId; });
        var enriched = hw ? withAssignedDate(hw) : null;
        return buildHomeworkStudents(homeworkId).map(function (s) {
          if (!enriched) return s;
          return Object.assign({}, s, {
            assignedDate: s.assignedDate || enriched.assignedDate,
            dueDate: s.dueDate || enriched.dueDate
          });
        });
      });
    },
    getClan: function (id) {
      return CLANS.find(function (c) { return c.id === id; }) || null;
    },
    getHomework: function (id) {
      var hw = HOMEWORKS.find(function (h) { return h.id === id; })
        || BIREBIR_HOMEWORKS.find(function (h) { return h.id === id; })
        || null;
      return hw ? withAssignedDate(hw) : null;
    },
    getBirebirStudents: function (opts) {
      return delay((opts && opts.simulate === false) ? 0 : 350).then(function () {
        if (opts && opts.forceError) throw new Error('mock');
        var week = opts && opts.eduWeek;
        if (!week) return BIREBIR_STUDENTS.slice();
        return BIREBIR_STUDENTS.map(function (student) { return buildBirebirForWeek(student, week); });
      });
    },
    getBirebirHomeworks: function (studentId, opts) {
      return delay((opts && opts.simulate === false) ? 0 : 300).then(function () {
        if (opts && opts.forceError) throw new Error('mock');
        var week = opts && opts.eduWeek;
        return BIREBIR_HOMEWORKS.filter(function (h) {
          return h.studentId === studentId && (!week || isInEduWeek(h.dueDate, week));
        }).map(withAssignedDate);
      });
    },
    getBirebirStudent: function (id) {
      return BIREBIR_STUDENTS.find(function (s) { return s.id === id; }) || null;
    },
    countHomeworksForEduWeek: countHomeworksForEduWeek,
    withAssignedDate: withAssignedDate
  };
})(typeof window !== 'undefined' ? window : global);
