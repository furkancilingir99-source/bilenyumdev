/**
 * Öğretmen öğrenci detay — öğrenci başına çeşitlendirilmiş mock performans profilleri.
 * window.TeacherStudentDetailMock
 */
(function (global) {
  'use strict';

  var TEACHER_NAME = 'Furkan Çilingir';

  function matAbs(date, time, week, topic) {
    return { date: date, time: time, eduWeek: week, topic: topic, teacher: TEACHER_NAME };
  }

  function matPart(date, time, topic, finger, board, correct, total) {
    return { date: date, time: time, topic: topic, finger: finger, board: board, correct: correct, total: total };
  }

  function matHw(topic, due, week, status) {
    return { topic: topic, type: 'Ödev', dueDate: due, eduWeek: week, status: status || 'Gecikmiş' };
  }

  function perfAbsence(weekMiss, weekTot, monthMiss, monthTot, termMiss, termTot) {
    return {
      week: { summary: weekMiss + ' / ' + weekTot, rows: { mat: [weekMiss, weekTot], fen: [0, 0], trk: [0, 0], sos: [0, 0], din: [0, 0], ing: [0, 0] } },
      month: { summary: monthMiss + ' / ' + monthTot, rows: { mat: [monthMiss, monthTot], fen: [0, 0], trk: [0, 0], sos: [0, 0], din: [0, 0], ing: [0, 0] } },
      term: { summary: termMiss + ' / ' + termTot, rows: { mat: [termMiss, termTot], fen: [0, 0], trk: [0, 0], sos: [0, 0], din: [0, 0], ing: [0, 0] } }
    };
  }

  function perfHomework(weekMiss, weekTot, monthMiss, monthTot, termMiss, termTot) {
    return {
      week: { summary: weekMiss + ' / ' + weekTot, rows: { mat: [weekMiss, weekTot], fen: [0, 0], trk: [0, 0], sos: [0, 0], din: [0, 0], ing: [0, 0] } },
      month: { summary: monthMiss + ' / ' + monthTot, rows: { mat: [monthMiss, monthTot], fen: [0, 0], trk: [0, 0], sos: [0, 0], din: [0, 0], ing: [0, 0] } },
      term: { summary: termMiss + ' / ' + termTot, rows: { mat: [termMiss, termTot], fen: [0, 0], trk: [0, 0], sos: [0, 0], din: [0, 0], ing: [0, 0] } }
    };
  }

  function perfPart(fingerW, correctW, boardW, fingerM, correctM, boardM, fingerT, correctT, boardT, matWeek, matMonth, matTerm) {
    return {
      week: {
        summaries: { finger: fingerW, correct: correctW, board: boardW },
        rows: { mat: matWeek, fen: { finger: '0,0', board: '0,0', correct: [0, 0] }, trk: { finger: '0,0', board: '0,0', correct: [0, 0] }, sos: { finger: '0,0', board: '0,0', correct: [0, 0] }, din: { finger: '0,0', board: '0,0', correct: [0, 0] }, ing: { finger: '0,0', board: '0,0', correct: [0, 0] } }
      },
      month: {
        summaries: { finger: fingerM, correct: correctM, board: boardM },
        rows: { mat: matMonth, fen: { finger: '0,0', board: '0,0', correct: [0, 0] }, trk: { finger: '0,0', board: '0,0', correct: [0, 0] }, sos: { finger: '0,0', board: '0,0', correct: [0, 0] }, din: { finger: '0,0', board: '0,0', correct: [0, 0] }, ing: { finger: '0,0', board: '0,0', correct: [0, 0] } }
      },
      term: {
        summaries: { finger: fingerT, correct: correctT, board: boardT },
        rows: { mat: matTerm, fen: { finger: '0,0', board: '0,0', correct: [0, 0] }, trk: { finger: '0,0', board: '0,0', correct: [0, 0] }, sos: { finger: '0,0', board: '0,0', correct: [0, 0] }, din: { finger: '0,0', board: '0,0', correct: [0, 0] }, ing: { finger: '0,0', board: '0,0', correct: [0, 0] } }
      }
    };
  }

  var PROFILES = {
    'Ali Yılmaz|Ejderhalar Klanı': {
      general: { totalXp: '1.240', globalRank: '#89', clanRank: '#1' },
      perf: {
        absence: perfAbsence(0, 3, 1, 9, 2, 22),
        homework: perfHomework(0, 2, 0, 7, 1, 18),
        part: perfPart('5,4', '8,2', '1,6', '4,9', '14,3', '1,4', '4,5', '18,4', '1,7',
          { finger: '5,8', board: '2,2', correct: [5, 5] },
          { finger: '5,1', board: '2,0', correct: [4, 5] },
          { finger: '4,8', board: '1,8', correct: [16, 19] })
      },
      absenceLessons: {
        mat: {
          week: [],
          month: [matAbs('10 Haziran 2026, Salı', '09:00 – 10:00', '17. Eğitim Haftası', 'Ondalık Sayılar')],
          term: [
            matAbs('10 Haziran 2026, Salı', '09:00 – 10:00', '17. Eğitim Haftası', 'Ondalık Sayılar'),
            matAbs('22 Mayıs 2026, Perşembe', '09:00 – 10:00', '15. Eğitim Haftası', 'Kesirlerle İşlemler')
          ]
        }
      },
      homeworkIncomplete: { mat: { week: [], month: [], term: [
        matHw('Kesir Problemleri — 10 Soru', '18 Haziran 2026, Çarşamba · 23:59', '17. Eğitim Haftası', 'Gecikmiş')
      ] } },
      partLessons: {
        mat: {
          week: [
            matPart('27 Haziran 2026, Cuma', '09:00 – 10:00', 'Kesirlerle İşlemler', 6, 2, 5, 6),
            matPart('24 Haziran 2026, Salı', '09:00 – 10:00', 'Geometri Temelleri', 5, 2, 4, 5)
          ],
          month: [
            matPart('27 Haziran 2026, Cuma', '09:00 – 10:00', 'Kesirlerle İşlemler', 6, 2, 5, 6),
            matPart('24 Haziran 2026, Salı', '09:00 – 10:00', 'Geometri Temelleri', 5, 2, 4, 5),
            matPart('20 Haziran 2026, Cuma', '09:00 – 10:00', 'Ondalık Sayılar', 5, 1, 4, 5)
          ],
          term: [
            matPart('27 Haziran 2026, Cuma', '09:00 – 10:00', 'Kesirlerle İşlemler', 6, 2, 5, 6),
            matPart('24 Haziran 2026, Salı', '09:00 – 10:00', 'Geometri Temelleri', 5, 2, 4, 5),
            matPart('20 Haziran 2026, Cuma', '09:00 – 10:00', 'Ondalık Sayılar', 5, 1, 4, 5),
            matPart('13 Haziran 2026, Cuma', '09:00 – 10:00', 'Doğal Sayılar', 4, 1, 3, 4)
          ]
        }
      }
    },
    'Ali Yılmaz|birebir': {
      general: { totalXp: '980', globalRank: '#214', clanRank: '—' },
      perf: {
        absence: perfAbsence(1, 2, 2, 6, 4, 14),
        homework: perfHomework(1, 2, 2, 5, 3, 12),
        part: perfPart('3,8', '4,1', '0,6', '3,5', '10,2', '0,8', '3,2', '12,5', '1,0',
          { finger: '4,2', board: '1,0', correct: [3, 4] },
          { finger: '3,8', board: '0,8', correct: [2, 4] },
          { finger: '3,5', board: '0,9', correct: [9, 12] })
      },
      absenceLessons: {
        mat: {
          week: [matAbs('26 Haziran 2026, Pazartesi', '15:00 – 15:45', '17. Eğitim Haftası', 'Kesir Problemleri')],
          month: [
            matAbs('26 Haziran 2026, Pazartesi', '15:00 – 15:45', '17. Eğitim Haftası', 'Kesir Problemleri'),
            matAbs('12 Haziran 2026, Perşembe', '15:00 – 15:45', '15. Eğitim Haftası', 'Kesir Problemleri')
          ],
          term: [
            matAbs('26 Haziran 2026, Pazartesi', '15:00 – 15:45', '17. Eğitim Haftası', 'Kesir Problemleri'),
            matAbs('12 Haziran 2026, Perşembe', '15:00 – 15:45', '15. Eğitim Haftası', 'Kesir Problemleri'),
            matAbs('29 Mayıs 2026, Perşembe', '15:00 – 15:45', '14. Eğitim Haftası', 'Yüzdeler'),
            matAbs('15 Mayıs 2026, Perşembe', '15:00 – 15:45', '12. Eğitim Haftası', 'Oran Orantı')
          ]
        }
      },
      homeworkIncomplete: {
        mat: {
          week: [matHw('Kesir Problemleri — 8 Soru', '28 Haziran 2026, Pazar · 23:59', '17. Eğitim Haftası', 'Devam Ediyor')],
          month: [
            matHw('Kesir Problemleri — 8 Soru', '28 Haziran 2026, Pazar · 23:59', '17. Eğitim Haftası', 'Devam Ediyor'),
            matHw('Yüzde Problemleri — Test', '5 Haziran 2026, Perşembe · 23:59', '14. Eğitim Haftası', 'Gecikmiş')
          ],
          term: [
            matHw('Kesir Problemleri — 8 Soru', '28 Haziran 2026, Pazar · 23:59', '17. Eğitim Haftası', 'Devam Ediyor'),
            matHw('Yüzde Problemleri — Test', '5 Haziran 2026, Perşembe · 23:59', '14. Eğitim Haftası', 'Gecikmiş'),
            matHw('Oran Orantı — 12 Soru', '20 Mayıs 2026, Salı · 23:59', '12. Eğitim Haftası', 'Gecikmiş')
          ]
        }
      },
      partLessons: {
        mat: {
          week: [matPart('22 Haziran 2026, Pazartesi', '15:00 – 15:45', 'Kesir Problemleri', 4, 0, 3, 4)],
          month: [
            matPart('22 Haziran 2026, Pazartesi', '15:00 – 15:45', 'Kesir Problemleri', 4, 0, 3, 4),
            matPart('8 Haziran 2026, Pazartesi', '15:00 – 15:45', 'Yüzdeler', 3, 1, 2, 4)
          ],
          term: [
            matPart('22 Haziran 2026, Pazartesi', '15:00 – 15:45', 'Kesir Problemleri', 4, 0, 3, 4),
            matPart('8 Haziran 2026, Pazartesi', '15:00 – 15:45', 'Yüzdeler', 3, 1, 2, 4),
            matPart('24 Mayıs 2026, Pazartesi', '15:00 – 15:45', 'Oran Orantı', 3, 0, 2, 3)
          ]
        }
      }
    },
    'Zeynep Demir|Ejderhalar Klanı': {
      general: { totalXp: '1.180', globalRank: '#112', clanRank: '#2' },
      perf: {
        absence: perfAbsence(0, 3, 0, 9, 1, 22),
        homework: perfHomework(0, 2, 1, 7, 2, 18),
        part: perfPart('4,9', '7,5', '1,4', '4,6', '13,8', '1,2', '4,3', '17,2', '1,5',
          { finger: '5,2', board: '1,8', correct: [4, 5] },
          { finger: '4,8', board: '1,5', correct: [4, 5] },
          { finger: '4,5', board: '1,4', correct: [15, 18] })
      },
      absenceLessons: {
        mat: {
          week: [],
          month: [],
          term: [matAbs('3 Haziran 2026, Salı', '09:00 – 10:00', '16. Eğitim Haftası', 'Geometri Temelleri')]
        }
      },
      homeworkIncomplete: {
        mat: { week: [], month: [matHw('Geometri — 6 Soru', '14 Haziran 2026, Cumartesi · 23:59', '16. Eğitim Haftası')], term: [
          matHw('Geometri — 6 Soru', '14 Haziran 2026, Cumartesi · 23:59', '16. Eğitim Haftası'),
          matHw('Kesirler — Test', '27 Mayıs 2026, Salı · 23:59', '14. Eğitim Haftası')
        ] }
      },
      partLessons: {
        mat: {
          week: [matPart('25 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Kesirlerle İşlemler', 5, 2, 4, 5)],
          month: [
            matPart('25 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Kesirlerle İşlemler', 5, 2, 4, 5),
            matPart('18 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Geometri Temelleri', 5, 1, 4, 5)
          ],
          term: [
            matPart('25 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Kesirlerle İşlemler', 5, 2, 4, 5),
            matPart('18 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Geometri Temelleri', 5, 1, 4, 5),
            matPart('4 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Ondalık Sayılar', 4, 1, 3, 4)
          ]
        }
      }
    },
    'Zeynep Demir|birebir': {
      general: { totalXp: '1.520', globalRank: '#67', clanRank: '—' },
      perf: {
        absence: perfAbsence(0, 2, 0, 5, 0, 12),
        homework: perfHomework(0, 2, 0, 4, 0, 10),
        part: perfPart('5,6', '9,1', '2,2', '5,3', '16,4', '2,0', '5,0', '20,6', '2,1',
          { finger: '6,1', board: '2,5', correct: [5, 5] },
          { finger: '5,8', board: '2,2', correct: [5, 5] },
          { finger: '5,4', board: '2,0', correct: [18, 20] })
      },
      absenceLessons: { mat: { week: [], month: [], term: [] } },
      homeworkIncomplete: { mat: { week: [], month: [], term: [] } },
      partLessons: {
        mat: {
          week: [matPart('25 Haziran 2026, Çarşamba', '09:00 – 09:45', 'Olasılık Giriş', 6, 3, 5, 5)],
          month: [
            matPart('25 Haziran 2026, Çarşamba', '09:00 – 09:45', 'Olasılık Giriş', 6, 3, 5, 5),
            matPart('18 Haziran 2026, Çarşamba', '09:00 – 09:45', 'Oran Orantı', 5, 2, 4, 5)
          ],
          term: [
            matPart('25 Haziran 2026, Çarşamba', '09:00 – 09:45', 'Olasılık Giriş', 6, 3, 5, 5),
            matPart('18 Haziran 2026, Çarşamba', '09:00 – 09:45', 'Oran Orantı', 5, 2, 4, 5),
            matPart('4 Haziran 2026, Çarşamba', '09:00 – 09:45', 'Cebirsel İfadeler', 5, 2, 4, 4)
          ]
        }
      }
    },
    'Can Öztürk|birebir': {
      general: { totalXp: '620', globalRank: '#412', clanRank: '—' },
      perf: {
        absence: perfAbsence(2, 2, 3, 6, 7, 14),
        homework: perfHomework(2, 2, 3, 5, 5, 12),
        part: perfPart('2,1', '2,8', '0,2', '2,4', '6,5', '0,4', '2,3', '8,2', '0,5',
          { finger: '2,5', board: '0,2', correct: [1, 4] },
          { finger: '2,3', board: '0,3', correct: [2, 4] },
          { finger: '2,4', board: '0,4', correct: [5, 10] })
      },
      absenceLessons: {
        mat: {
          week: [
            matAbs('24 Haziran 2026, Salı', '09:00 – 09:45', '17. Eğitim Haftası', 'Veri Analizi'),
            matAbs('26 Haziran 2026, Perşembe', '09:00 – 09:45', '17. Eğitim Haftası', 'Veri Analizi')
          ],
          month: [
            matAbs('24 Haziran 2026, Salı', '09:00 – 09:45', '17. Eğitim Haftası', 'Veri Analizi'),
            matAbs('26 Haziran 2026, Perşembe', '09:00 – 09:45', '17. Eğitim Haftası', 'Veri Analizi'),
            matAbs('10 Haziran 2026, Salı', '09:00 – 09:45', '15. Eğitim Haftası', 'Yüzdeler')
          ],
          term: [
            matAbs('24 Haziran 2026, Salı', '09:00 – 09:45', '17. Eğitim Haftası', 'Veri Analizi'),
            matAbs('26 Haziran 2026, Perşembe', '09:00 – 09:45', '17. Eğitim Haftası', 'Veri Analizi'),
            matAbs('10 Haziran 2026, Salı', '09:00 – 09:45', '15. Eğitim Haftası', 'Yüzdeler'),
            matAbs('22 Mayıs 2026, Perşembe', '09:00 – 09:45', '13. Eğitim Haftası', 'Kesir Problemleri'),
            matAbs('8 Mayıs 2026, Perşembe', '09:00 – 09:45', '11. Eğitim Haftası', 'Doğal Sayılar'),
            matAbs('24 Nisan 2026, Perşembe', '09:00 – 09:45', '9. Eğitim Haftası', 'Çarpanlar ve Katlar'),
            matAbs('10 Nisan 2026, Perşembe', '09:00 – 09:45', '7. Eğitim Haftası', 'Ondalık Sayılar')
          ]
        }
      },
      homeworkIncomplete: {
        mat: {
          week: [
            matHw('Veri Analizi — Grafik Okuma', '27 Haziran 2026, Cuma · 23:59', '17. Eğitim Haftası', 'Gecikmiş'),
            matHw('Yüzdeler — 15 Soru', '12 Haziran 2026, Perşembe · 23:59', '15. Eğitim Haftası', 'Gecikmiş')
          ],
          month: [
            matHw('Veri Analizi — Grafik Okuma', '27 Haziran 2026, Cuma · 23:59', '17. Eğitim Haftası', 'Gecikmiş'),
            matHw('Yüzdeler — 15 Soru', '12 Haziran 2026, Perşembe · 23:59', '15. Eğitim Haftası', 'Gecikmiş'),
            matHw('Kesir Problemleri — Test', '25 Mayıs 2026, Pazar · 23:59', '13. Eğitim Haftası', 'Gecikmiş')
          ],
          term: [
            matHw('Veri Analizi — Grafik Okuma', '27 Haziran 2026, Cuma · 23:59', '17. Eğitim Haftası', 'Gecikmiş'),
            matHw('Yüzdeler — 15 Soru', '12 Haziran 2026, Perşembe · 23:59', '15. Eğitim Haftası', 'Gecikmiş'),
            matHw('Kesir Problemleri — Test', '25 Mayıs 2026, Pazar · 23:59', '13. Eğitim Haftası', 'Gecikmiş'),
            matHw('Doğal Sayılar — Etkinlik', '10 Mayıs 2026, Cumartesi · 23:59', '11. Eğitim Haftası', 'Gecikmiş'),
            matHw('Çarpanlar — 8 Soru', '26 Nisan 2026, Cumartesi · 23:59', '9. Eğitim Haftası', 'Gecikmiş')
          ]
        }
      },
      partLessons: {
        mat: {
          week: [matPart('20 Haziran 2026, Cuma', '09:00 – 09:45', 'Veri Analizi', 2, 0, 1, 4)],
          month: [matPart('20 Haziran 2026, Cuma', '09:00 – 09:45', 'Veri Analizi', 2, 0, 1, 4)],
          term: [
            matPart('20 Haziran 2026, Cuma', '09:00 – 09:45', 'Veri Analizi', 2, 0, 1, 4),
            matPart('3 Haziran 2026, Salı', '09:00 – 09:45', 'Yüzdeler', 2, 0, 2, 4)
          ]
        }
      }
    },
    'Elif Kaya|birebir': {
      general: { totalXp: '1.100', globalRank: '#95', clanRank: '—' },
      perf: {
        absence: perfAbsence(0, 2, 0, 5, 0, 11),
        homework: perfHomework(0, 2, 0, 4, 0, 9),
        part: perfPart('5,2', '8,4', '1,8', '4,9', '15,2', '1,6', '4,6', '19,1', '1,7',
          { finger: '5,5', board: '2,0', correct: [5, 5] },
          { finger: '5,2', board: '1,8', correct: [4, 5] },
          { finger: '4,9', board: '1,6', correct: [17, 19] })
      },
      absenceLessons: { mat: { week: [], month: [], term: [] } },
      homeworkIncomplete: { mat: { week: [], month: [], term: [] } },
      partLessons: {
        mat: {
          week: [matPart('23 Haziran 2026, Salı', '08:30 – 09:15', 'Doğal Sayılar', 5, 2, 5, 5)],
          month: [
            matPart('23 Haziran 2026, Salı', '08:30 – 09:15', 'Doğal Sayılar', 5, 2, 5, 5),
            matPart('16 Haziran 2026, Salı', '08:30 – 09:15', 'Sayı Sistemleri', 5, 1, 4, 5)
          ],
          term: [
            matPart('23 Haziran 2026, Salı', '08:30 – 09:15', 'Doğal Sayılar', 5, 2, 5, 5),
            matPart('16 Haziran 2026, Salı', '08:30 – 09:15', 'Sayı Sistemleri', 5, 1, 4, 5),
            matPart('2 Haziran 2026, Salı', '08:30 – 09:15', 'Çarpma İşlemi', 4, 1, 4, 4)
          ]
        }
      }
    },
    'Burak Şahin|birebir': {
      general: { totalXp: '840', globalRank: '#178', clanRank: '—' },
      perf: {
        absence: perfAbsence(1, 2, 1, 5, 3, 12),
        homework: perfHomework(1, 2, 1, 4, 2, 10),
        part: perfPart('3,6', '5,2', '0,9', '3,4', '11,8', '1,0', '3,3', '14,1', '1,2',
          { finger: '4,0', board: '1,0', correct: [3, 4] },
          { finger: '3,6', board: '0,9', correct: [3, 4] },
          { finger: '3,4', board: '1,0', correct: [10, 14] })
      },
      absenceLessons: {
        mat: {
          week: [matAbs('28 Haziran 2026, Pazartesi', '10:30 – 11:15', '17. Eğitim Haftası', 'Veri Analizi')],
          month: [matAbs('28 Haziran 2026, Pazartesi', '10:30 – 11:15', '17. Eğitim Haftası', 'Veri Analizi')],
          term: [
            matAbs('28 Haziran 2026, Pazartesi', '10:30 – 11:15', '17. Eğitim Haftası', 'Veri Analizi'),
            matAbs('14 Mayıs 2026, Çarşamba', '10:30 – 11:15', '12. Eğitim Haftası', 'Yüzdeler'),
            matAbs('30 Nisan 2026, Çarşamba', '10:30 – 11:15', '10. Eğitim Haftası', 'Kesirler')
          ]
        }
      },
      homeworkIncomplete: {
        mat: {
          week: [matHw('Veri Analizi — 6 Soru', '29 Haziran 2026, Pazartesi · 23:59', '17. Eğitim Haftası', 'Devam Ediyor')],
          month: [matHw('Veri Analizi — 6 Soru', '29 Haziran 2026, Pazartesi · 23:59', '17. Eğitim Haftası', 'Devam Ediyor')],
          term: [
            matHw('Veri Analizi — 6 Soru', '29 Haziran 2026, Pazartesi · 23:59', '17. Eğitim Haftası', 'Devam Ediyor'),
            matHw('Yüzdeler — Mini Test', '16 Mayıs 2026, Perşembe · 23:59', '12. Eğitim Haftası', 'Gecikmiş')
          ]
        }
      },
      partLessons: {
        mat: {
          week: [matPart('25 Haziran 2026, Perşembe', '10:30 – 11:15', 'Yüzdeler', 4, 1, 3, 4)],
          month: [
            matPart('25 Haziran 2026, Perşembe', '10:30 – 11:15', 'Yüzdeler', 4, 1, 3, 4),
            matPart('11 Haziran 2026, Perşembe', '10:30 – 11:15', 'Veri Analizi', 3, 0, 2, 4)
          ],
          term: [
            matPart('25 Haziran 2026, Perşembe', '10:30 – 11:15', 'Yüzdeler', 4, 1, 3, 4),
            matPart('11 Haziran 2026, Perşembe', '10:30 – 11:15', 'Veri Analizi', 3, 0, 2, 4),
            matPart('28 Mayıs 2026, Perşembe', '10:30 – 11:15', 'Kesirler', 3, 1, 2, 3)
          ]
        }
      }
    },
    'Deniz Aydın|Ejderhalar Klanı': {
      general: { totalXp: '870', globalRank: '#356', clanRank: '#6' },
      perf: {
        absence: perfAbsence(1, 3, 2, 9, 5, 22),
        homework: perfHomework(1, 2, 2, 7, 4, 18),
        part: perfPart('2,8', '4,5', '0,4', '2,9', '9,8', '0,6', '2,7', '12,4', '0,8',
          { finger: '3,2', board: '0,5', correct: [2, 4] },
          { finger: '2,9', board: '0,4', correct: [3, 5] },
          { finger: '2,7', board: '0,6', correct: [8, 14] })
      },
      absenceLessons: {
        mat: {
          week: [matAbs('23 Haziran 2026, Pazartesi', '09:00 – 10:00', '17. Eğitim Haftası', 'Kesirlerle İşlemler')],
          month: [
            matAbs('23 Haziran 2026, Pazartesi', '09:00 – 10:00', '17. Eğitim Haftası', 'Kesirlerle İşlemler'),
            matAbs('2 Haziran 2026, Pazartesi', '09:00 – 10:00', '14. Eğitim Haftası', 'Ondalık Sayılar')
          ],
          term: [
            matAbs('23 Haziran 2026, Pazartesi', '09:00 – 10:00', '17. Eğitim Haftası', 'Kesirlerle İşlemler'),
            matAbs('2 Haziran 2026, Pazartesi', '09:00 – 10:00', '14. Eğitim Haftası', 'Ondalık Sayılar'),
            matAbs('18 Mayıs 2026, Pazartesi', '09:00 – 10:00', '12. Eğitim Haftası', 'Geometri Temelleri'),
            matAbs('4 Mayıs 2026, Pazartesi', '09:00 – 10:00', '10. Eğitim Haftası', 'Doğal Sayılar'),
            matAbs('20 Nisan 2026, Pazartesi', '09:00 – 10:00', '8. Eğitim Haftası', 'Kesir Problemleri')
          ]
        }
      },
      homeworkIncomplete: {
        mat: {
          week: [matHw('Kesirler — 10 Soru', '25 Haziran 2026, Çarşamba · 23:59', '17. Eğitim Haftası')],
          month: [
            matHw('Kesirler — 10 Soru', '25 Haziran 2026, Çarşamba · 23:59', '17. Eğitim Haftası'),
            matHw('Ondalık Sayılar — Test', '4 Haziran 2026, Perşembe · 23:59', '14. Eğitim Haftası')
          ],
          term: [
            matHw('Kesirler — 10 Soru', '25 Haziran 2026, Çarşamba · 23:59', '17. Eğitim Haftası'),
            matHw('Ondalık Sayılar — Test', '4 Haziran 2026, Perşembe · 23:59', '14. Eğitim Haftası'),
            matHw('Geometri — Etkinlik', '20 Mayıs 2026, Salı · 23:59', '12. Eğitim Haftası'),
            matHw('Doğal Sayılar — 8 Soru', '6 Mayıs 2026, Salı · 23:59', '10. Eğitim Haftası')
          ]
        }
      },
      partLessons: {
        mat: {
          week: [matPart('20 Haziran 2026, Cuma', '09:00 – 10:00', 'Kesirlerle İşlemler', 3, 0, 2, 4)],
          month: [
            matPart('20 Haziran 2026, Cuma', '09:00 – 10:00', 'Kesirlerle İşlemler', 3, 0, 2, 4),
            matPart('6 Haziran 2026, Cuma', '09:00 – 10:00', 'Ondalık Sayılar', 3, 1, 2, 4)
          ],
          term: [
            matPart('20 Haziran 2026, Cuma', '09:00 – 10:00', 'Kesirlerle İşlemler', 3, 0, 2, 4),
            matPart('6 Haziran 2026, Cuma', '09:00 – 10:00', 'Ondalık Sayılar', 3, 1, 2, 4),
            matPart('22 Mayıs 2026, Cuma', '09:00 – 10:00', 'Geometri Temelleri', 2, 0, 2, 3)
          ]
        }
      }
    },
    'Yusuf Çelik|Kartallar Klanı': {
      general: { totalXp: '1.110', globalRank: '#134', clanRank: '#1' },
      perf: {
        absence: perfAbsence(0, 3, 1, 8, 2, 20),
        homework: perfHomework(0, 2, 0, 6, 1, 16),
        part: perfPart('4,7', '7,2', '1,3', '4,4', '12,6', '1,1', '4,2', '16,8', '1,4',
          { finger: '5,0', board: '1,5', correct: [4, 5] },
          { finger: '4,7', board: '1,3', correct: [4, 5] },
          { finger: '4,4', board: '1,2', correct: [14, 17] })
      },
      absenceLessons: {
        mat: {
          week: [],
          month: [matAbs('11 Haziran 2026, Perşembe', '10:30 – 11:30', '16. Eğitim Haftası', 'Cebirsel İfadeler')],
          term: [
            matAbs('11 Haziran 2026, Perşembe', '10:30 – 11:30', '16. Eğitim Haftası', 'Cebirsel İfadeler'),
            matAbs('23 Mayıs 2026, Cuma', '10:30 – 11:30', '14. Eğitim Haftası', 'Ondalık Sayılar')
          ]
        }
      },
      homeworkIncomplete: {
        mat: { week: [], month: [], term: [matHw('Cebirsel İfadeler — 12 Soru', '13 Haziran 2026, Cumartesi · 23:59', '16. Eğitim Haftası')] }
      },
      partLessons: {
        mat: {
          week: [matPart('26 Haziran 2026, Perşembe', '10:30 – 11:30', 'Cebirsel İfadeler', 5, 1, 4, 5)],
          month: [
            matPart('26 Haziran 2026, Perşembe', '10:30 – 11:30', 'Cebirsel İfadeler', 5, 1, 4, 5),
            matPart('19 Haziran 2026, Perşembe', '10:30 – 11:30', 'Ondalık Sayılar', 4, 1, 3, 5)
          ],
          term: [
            matPart('26 Haziran 2026, Perşembe', '10:30 – 11:30', 'Cebirsel İfadeler', 5, 1, 4, 5),
            matPart('19 Haziran 2026, Perşembe', '10:30 – 11:30', 'Ondalık Sayılar', 4, 1, 3, 5),
            matPart('5 Haziran 2026, Perşembe', '10:30 – 11:30', 'Oran Orantı', 4, 1, 3, 4)
          ]
        }
      }
    },
    'Ece Polat|Aslanlar Klanı': {
      general: { totalXp: '990', globalRank: '#198', clanRank: '#1' },
      perf: {
        absence: perfAbsence(0, 3, 0, 8, 1, 19),
        homework: perfHomework(0, 2, 0, 6, 1, 15),
        part: perfPart('4,5', '6,8', '1,1', '4,2', '12,1', '1,0', '4,0', '15,5', '1,3',
          { finger: '4,8', board: '1,2', correct: [4, 5] },
          { finger: '4,5', board: '1,1', correct: [4, 5] },
          { finger: '4,2', board: '1,0', correct: [13, 16] })
      },
      absenceLessons: {
        mat: {
          week: [],
          month: [],
          term: [matAbs('15 Mayıs 2026, Cuma', '13:00 – 14:00', '12. Eğitim Haftası', 'Geometri Temelleri')]
        }
      },
      homeworkIncomplete: {
        mat: { week: [], month: [], term: [matHw('Geometri — 8 Soru', '17 Mayıs 2026, Pazar · 23:59', '12. Eğitim Haftası')] }
      },
      partLessons: {
        mat: {
          week: [matPart('27 Haziran 2026, Cuma', '13:00 – 14:00', 'Geometri Temelleri', 5, 1, 4, 5)],
          month: [
            matPart('27 Haziran 2026, Cuma', '13:00 – 14:00', 'Geometri Temelleri', 5, 1, 4, 5),
            matPart('20 Haziran 2026, Cuma', '13:00 – 14:00', 'Doğal Sayılar', 4, 1, 3, 4)
          ],
          term: [
            matPart('27 Haziran 2026, Cuma', '13:00 – 14:00', 'Geometri Temelleri', 5, 1, 4, 5),
            matPart('20 Haziran 2026, Cuma', '13:00 – 14:00', 'Doğal Sayılar', 4, 1, 3, 4),
            matPart('6 Haziran 2026, Cuma', '13:00 – 14:00', 'Kesirler', 4, 0, 3, 4)
          ]
        }
      }
    }
  };

  function hashStr(str) {
    var h = 0;
    var t = String(str || '');
    for (var i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) >>> 0; }
    return h;
  }

  function generatedProfile(name, clan, isBirebir) {
    var h = hashStr(name + '|' + (clan || '') + '|' + (isBirebir ? 'b' : 'k'));
    var groupsMock = global.TeacherGroupsMock;
    var clanMeta = (!isBirebir && clan && groupsMock && groupsMock.findClanStudentMeta)
      ? groupsMock.findClanStudentMeta(name, clan)
      : null;
    var xp = clanMeta ? clanMeta.xp : (500 + (h % 1400));
    var globalRank = 80 + (h % 420);
    var clanRank = isBirebir ? '—' : (clanMeta ? clanMeta.clanRank : ('#' + (1 + (h % 12))));
    var weekAbs = h % 3;
    var weekTot = 2 + (h % 2);
    var hwMiss = h % 2;
    var finger = (2.5 + (h % 30) / 10).toFixed(1).replace('.', ',');
    return {
      general: {
        totalXp: String(xp).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
        globalRank: '#' + globalRank,
        clanRank: clanRank
      },
      perf: {
        absence: perfAbsence(weekAbs, weekTot, weekAbs + 1, weekTot + 4, weekAbs + 3, weekTot + 12),
        homework: perfHomework(hwMiss, 2, hwMiss, 5, hwMiss + 1, 11),
        part: perfPart(finger, (3 + (h % 5)) + ',' + (h % 3), '0,' + (h % 3),
          finger, (8 + (h % 6)) + ',' + (h % 4), '0,' + (h % 4),
          finger, (12 + (h % 8)) + ',' + (h % 5), '1,' + (h % 3),
          { finger: finger, board: '0,' + (h % 2), correct: [2 + (h % 3), 4 + (h % 2)] },
          { finger: finger, board: '1,' + (h % 2), correct: [3 + (h % 3), 5] },
          { finger: finger, board: '1,' + (h % 3), correct: [8 + (h % 6), 12 + (h % 5)] })
      },
      absenceLessons: {
        mat: {
          week: weekAbs ? [matAbs('24 Haziran 2026, Salı', '09:00 – 10:00', '17. Eğitim Haftası', 'Matematik Dersi')] : [],
          month: weekAbs ? [matAbs('24 Haziran 2026, Salı', '09:00 – 10:00', '17. Eğitim Haftası', 'Matematik Dersi')] : [],
          term: weekAbs ? [
            matAbs('24 Haziran 2026, Salı', '09:00 – 10:00', '17. Eğitim Haftası', 'Matematik Dersi'),
            matAbs('10 Haziran 2026, Salı', '09:00 – 10:00', '15. Eğitim Haftası', 'Matematik Dersi')
          ] : []
        }
      },
      homeworkIncomplete: {
        mat: {
          week: hwMiss ? [matHw('Matematik — Ödev', '28 Haziran 2026, Pazar · 23:59', '17. Eğitim Haftası')] : [],
          month: hwMiss ? [matHw('Matematik — Ödev', '28 Haziran 2026, Pazar · 23:59', '17. Eğitim Haftası')] : [],
          term: hwMiss ? [matHw('Matematik — Ödev', '28 Haziran 2026, Pazar · 23:59', '17. Eğitim Haftası')] : []
        }
      },
      partLessons: {
        mat: {
          week: [matPart('25 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Matematik', 3 + (h % 3), h % 2, 2 + (h % 3), 4 + (h % 2))],
          month: [matPart('25 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Matematik', 3 + (h % 3), h % 2, 2 + (h % 3), 4 + (h % 2))],
          term: [matPart('25 Haziran 2026, Çarşamba', '09:00 – 10:00', 'Matematik', 3 + (h % 3), h % 2, 2 + (h % 3), 4 + (h % 2))]
        }
      }
    };
  }

  function profileKey(name, opts) {
    opts = opts || {};
    var isBirebir = opts.isBirebir || opts.clan === 'Birebir Ders Öğrencisi' || opts.type === 'birebir';
    if (isBirebir) return name + '|birebir';
    if (opts.clan) return name + '|' + opts.clan;
    return name + '|default';
  }

  function resolveProfile(name, opts) {
    if (!name) return null;
    var key = profileKey(name, opts);
    if (PROFILES[key]) return PROFILES[key];
    if (opts && opts.clan && !opts.isBirebir) {
      var alt = PROFILES[name + '|default'];
      if (alt) return alt;
    }
    return generatedProfile(name, opts && opts.clan, opts && (opts.isBirebir || opts.type === 'birebir' || opts.clan === 'Birebir Ders Öğrencisi'));
  }

  global.TeacherStudentDetailMock = {
    resolveProfile: resolveProfile,
    profileKey: profileKey
  };
})(typeof window !== 'undefined' ? window : this);
