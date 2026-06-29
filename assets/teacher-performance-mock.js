/**
 * Öğretmen performans mock verisi
 */
(function (global) {
  'use strict';

  var DEMO_TODAY = '2026-06-29';
  var TERM_START = '2026-03-10';
  var TERM_END = DEMO_TODAY;

  function delay(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  function parseISO(iso) {
    var p = iso.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
  }

  function formatISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  function isWeekday(iso) {
    var dow = parseISO(iso).getDay();
    return dow >= 1 && dow <= 5;
  }

  function dailySeed(iso) {
    var n = 0;
    var i;
    for (i = 0; i < iso.length; i++) {
      n = ((n << 5) - n) + iso.charCodeAt(i);
      n |= 0;
    }
    return Math.abs(n);
  }

  function getDayMetrics(iso) {
    if (iso < TERM_START || iso > TERM_END || !isWeekday(iso)) {
      return { lessons: 0, questions: 0, whiteboard: 0 };
    }
    var seed = dailySeed(iso);
    var lessons = (seed % 3) + 1;
    if (iso === DEMO_TODAY) lessons = 4;
    return {
      lessons: lessons,
      questions: lessons * (5 + (seed % 5)),
      whiteboard: lessons * (1 + (seed % 3))
    };
  }

  function aggregateRange(dateFrom, dateTo) {
    var from = dateFrom || TERM_START;
    var to = dateTo || TERM_END;
    if (from > to) {
      var tmp = from;
      from = to;
      to = tmp;
    }

    var totals = { lessons: 0, questions: 0, whiteboard: 0 };
    var cursor = parseISO(from);
    var end = parseISO(to);

    while (cursor.getTime() <= end.getTime()) {
      var iso = formatISO(cursor);
      var day = getDayMetrics(iso);
      totals.lessons += day.lessons;
      totals.questions += day.questions;
      totals.whiteboard += day.whiteboard;
      cursor = addDays(cursor, 1);
    }
    return totals;
  }

  function buildCards(dateFrom, dateTo) {
    var totals = aggregateRange(dateFrom, dateTo);
    var rangeLabel = (global.TeacherDatePicker && global.TeacherDatePicker.formatRange)
      ? global.TeacherDatePicker.formatRange(dateFrom || TERM_START, dateTo || TERM_END)
      : ((dateFrom || TERM_START) + ' — ' + (dateTo || TERM_END));

    return [
      {
        id: 'total-lessons',
        title: 'Toplam Ders Sayısı',
        value: totals.lessons,
        hint: rangeLabel + ' tarihleri arasında girdiğiniz canlı matematik dersleri',
        cls: 'is-lessons',
        icon: 'lessons',
        featured: true
      },
      {
        id: 'live-questions',
        title: 'Canlı Derste Sorulan Soru',
        value: totals.questions,
        hint: rangeLabel + ' tarihleri arasında öğrencilere yönelttiğiniz sorular',
        cls: 'is-questions',
        icon: 'questions',
        featured: true
      },
      {
        id: 'whiteboard-students',
        title: 'Tahtaya Kaldırılan Öğrenci',
        value: totals.whiteboard,
        hint: rangeLabel + ' tarihleri arasında whiteboard\'a çıkardığınız öğrenciler',
        cls: 'is-whiteboard',
        icon: 'whiteboard',
        featured: true
      }
    ];
  }

  global.TeacherPerformanceMock = {
    DEMO_TODAY: DEMO_TODAY,
    TERM_START: TERM_START,
    TERM_END: TERM_END,

    getSummary: function (opts) {
      opts = opts || {};
      return delay(opts.simulate === false ? 0 : 280).then(function () {
        if (opts.forceError) throw new Error('mock');
        return aggregateRange(opts.dateFrom, opts.dateTo);
      });
    },

    getCards: function (opts) {
      opts = opts || {};
      return delay(opts.simulate === false ? 0 : 220).then(function () {
        if (opts.forceError) throw new Error('mock');
        return buildCards(opts.dateFrom, opts.dateTo);
      });
    }
  };
})(typeof window !== 'undefined' ? window : global);
