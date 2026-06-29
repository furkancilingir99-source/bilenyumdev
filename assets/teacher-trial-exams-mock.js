/**
 * Öğretmen deneme sınavları — öğrenci bazlı mock sonuçlar
 * window.TeacherTrialExamsMock
 */
(function (global) {
  'use strict';

  var BASE_EXAMS = [
    { id: 1, type: 'genel', name: 'Bilenyum Genel Deneme · 11', date: '2026-06-07', total: 80, dogru: 59, yanlis: 8, bos: 13, dur: 135, rank: 127, percentile: 12.4 },
    { id: 14, type: 'brans', name: 'Fen Branş Denemesi · 6', date: '2026-06-04', total: 40, dogru: 34, yanlis: 4, bos: 2, dur: 60, rank: 84, percentile: 8.6 },
    { id: 2, type: 'brans', name: 'Matematik Branş Denemesi · 6', date: '2026-05-31', total: 40, dogru: 32, yanlis: 5, bos: 3, dur: 60, rank: 156, percentile: 15.8 },
    { id: 3, type: 'kurum', name: 'İl Genel Denemesi · Mayıs', date: '2026-05-24', total: 80, dogru: 52, yanlis: 12, bos: 16, dur: 135, rank: 312, percentile: 28.5 },
    { id: 4, type: 'genel', name: 'Bilenyum Genel Deneme · 10', date: '2026-05-17', total: 80, dogru: 64, yanlis: 5, bos: 11, dur: 135, rank: 98, percentile: 9.7 },
    { id: 5, type: 'brans', name: 'Fen Branş Denemesi · 5', date: '2026-05-10', total: 40, dogru: 30, yanlis: 6, bos: 4, dur: 60 },
    { id: 6, type: 'genel', name: 'Bilenyum Genel Deneme · 9', date: '2026-05-03', total: 80, dogru: 53, yanlis: 9, bos: 18, dur: 135 },
    { id: 7, type: 'brans', name: 'Türkçe Branş Denemesi · 4', date: '2026-04-26', total: 40, dogru: 28, yanlis: 8, bos: 4, dur: 60 },
    { id: 8, type: 'genel', name: 'Bilenyum Genel Deneme · 12', date: '2026-06-29', total: 80, dogru: 61, yanlis: 7, bos: 12, dur: 135, rank: 112, percentile: 10.8 },
    { id: 9, type: 'brans', name: 'Matematik Branş Denemesi · 7', date: '2026-07-02', total: 40, dogru: 33, yanlis: 4, bos: 3, dur: 60, rank: 94, percentile: 9.2 }
  ];

  function hashStr(str) {
    var h = 0;
    var t = String(str || '');
    for (var i = 0; i < t.length; i++) { h = (h * 31 + t.charCodeAt(i)) >>> 0; }
    return h;
  }

  function seededShift(base, seed, field, min, max) {
    var x = Math.sin(seed * (field === 'dogru' ? 3.1 : field === 'yanlis' ? 5.7 : 7.9)) * 10000;
    var f = x - Math.floor(x);
    var delta = Math.floor(f * 7) - 3;
    var next = base + delta;
    if (next < min) next = min;
    if (next > max) next = max;
    return next;
  }

  function cloneExamForStudent(exam, studentKey, index) {
    var seed = hashStr(studentKey) + exam.id * 13 + index;
    var copy = Object.assign({}, exam);
    var total = copy.total;
    var dogru = seededShift(copy.dogru, seed, 'dogru', 8, total - 4);
    var yanlis = seededShift(copy.yanlis, seed, 'yanlis', 0, Math.min(20, total - dogru));
    var bos = Math.max(0, total - dogru - yanlis);
    if (dogru + yanlis + bos !== total) {
      bos = total - dogru - yanlis;
      if (bos < 0) {
        yanlis = Math.max(0, yanlis + bos);
        bos = total - dogru - yanlis;
      }
    }
    copy.dogru = dogru;
    copy.yanlis = yanlis;
    copy.bos = bos;
    if (copy.rank) {
      copy.rank = Math.max(1, copy.rank + Math.floor((hashStr(studentKey + index) % 90) - 45));
    }
    if (copy.percentile != null) {
      copy.percentile = Math.max(1, Math.min(99, Math.round((copy.percentile + ((seed % 120) - 60) / 10) * 10) / 10));
    }
    return copy;
  }

  function getExamsForStudent(studentKey) {
    return BASE_EXAMS.map(function (exam, i) {
      return cloneExamForStudent(exam, studentKey, i);
    });
  }

  function countExamsForEduWeek(studentKey, weekNum) {
    var dapi = global.TeacherDashboardMock;
    if (!dapi || !dapi.findEduWeekForDate) return 0;
    return getExamsForStudent(studentKey).filter(function (exam) {
      return dapi.findEduWeekForDate(exam.date) === weekNum;
    }).length;
  }

  global.TeacherTrialExamsMock = {
    getExamsForStudent: getExamsForStudent,
    countExamsForEduWeek: countExamsForEduWeek,
    BASE_EXAMS: BASE_EXAMS
  };
})(typeof window !== 'undefined' ? window : global);
