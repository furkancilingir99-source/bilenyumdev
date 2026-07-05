/**
 * Deneme dersi rezervasyonları — demo veri
 */
(function (global) {
  'use strict';

  var ID_PREFIX = 'REZ';

  function formatReservationId(year, seq) {
    return ID_PREFIX + '-' + year + '-' + String(seq).padStart(4, '0');
  }

  function nextReservationId() {
    var year = new Date().getFullYear();
    var max = 0;
    RESERVATIONS.forEach(function (r) {
      var m = new RegExp('^' + ID_PREFIX + '-(\\d{4})-(\\d+)$').exec(r.id);
      if (m && parseInt(m[1], 10) === year) {
        max = Math.max(max, parseInt(m[2], 10));
      }
    });
    return formatReservationId(year, max + 1);
  }

  var RESERVATIONS = [
    {
      id: 'REZ-2026-0001',
      studentFirstName: 'Mira',
      studentLastName: 'Yılmaz',
      grade: '7. Sınıf',
      subject: 'Matematik',
      parentFirstName: 'Ayşe',
      parentLastName: 'Yılmaz',
      phone: '0532 441 28 90',
      email: 'ayse.yilmaz@mail.com',
      slotLabel: 'Pazartesi, 7 Tem · 14:30',
      status: 'pending',
      createdAt: '2026-07-05T08:12:00+03:00'
    },
    {
      id: 'REZ-2026-0002',
      studentFirstName: 'Can',
      studentLastName: 'Kaya',
      grade: '8. Sınıf',
      subject: 'Fen Bilimleri',
      parentFirstName: 'Mehmet',
      parentLastName: 'Kaya',
      phone: '0544 902 17 33',
      email: 'mehmet.kaya@gmail.com',
      slotLabel: 'Bugün · 16:00',
      status: 'confirmed',
      createdAt: '2026-07-05T07:45:00+03:00'
    },
    {
      id: 'REZ-2026-0003',
      studentFirstName: 'Elif',
      studentLastName: 'Demir',
      grade: '6. Sınıf',
      subject: 'Türkçe',
      parentFirstName: 'Zeynep',
      parentLastName: 'Demir',
      phone: '0505 778 44 12',
      email: 'zeynep.demir@outlook.com',
      slotLabel: 'Salı, 8 Tem · 11:30',
      requestedSlotLabel: 'Salı, 8 Tem · 11:30',
      slotConfirmedByParent: false,
      status: 'pending',
      createdAt: '2026-07-04T19:30:00+03:00'
    },
    {
      id: 'REZ-2026-0004',
      studentFirstName: 'Arda',
      studentLastName: 'Öztürk',
      grade: '5. Sınıf',
      subject: 'Matematik',
      parentFirstName: 'Fatma',
      parentLastName: 'Öztürk',
      phone: '0533 612 09 55',
      email: 'fatma.ozturk@mail.com',
      slotLabel: 'Çarşamba, 9 Tem · 19:00',
      status: 'confirmed',
      createdAt: '2026-07-04T16:20:00+03:00'
    },
    {
      id: 'REZ-2026-0005',
      studentFirstName: 'Selin',
      studentLastName: 'Aksoy',
      grade: '7. Sınıf',
      subject: 'İngilizce',
      parentFirstName: 'Burak',
      parentLastName: 'Aksoy',
      phone: '0542 330 88 71',
      email: 'burak.aksoy@icloud.com',
      slotLabel: 'Perşembe, 10 Tem · 17:30',
      status: 'pending',
      createdAt: '2026-07-04T11:05:00+03:00'
    },
    {
      id: 'REZ-2026-0006',
      studentFirstName: 'Emir',
      studentLastName: 'Çelik',
      grade: '8. Sınıf',
      subject: 'Matematik',
      parentFirstName: 'Deniz',
      parentLastName: 'Çelik',
      phone: '0555 901 44 28',
      email: 'deniz.celik@yahoo.com',
      slotLabel: 'Cuma, 4 Tem · 14:30',
      status: 'completed',
      createdAt: '2026-07-03T14:40:00+03:00'
    },
    {
      id: 'REZ-2026-0007',
      studentFirstName: 'Lina',
      studentLastName: 'Şahin',
      grade: '6. Sınıf',
      subject: 'Fen Bilimleri',
      parentFirstName: 'Gül',
      parentLastName: 'Şahin',
      phone: '0537 220 15 66',
      email: 'gul.sahin@mail.com',
      slotLabel: 'Cumartesi, 12 Tem · 10:00',
      status: 'confirmed',
      createdAt: '2026-07-03T09:18:00+03:00'
    },
    {
      id: 'REZ-2026-0008',
      studentFirstName: 'Kerem',
      studentLastName: 'Aydın',
      grade: '5. Sınıf',
      subject: 'Sosyal Bilgiler',
      parentFirstName: 'Hakan',
      parentLastName: 'Aydın',
      phone: '0546 881 02 39',
      email: 'hakan.aydin@gmail.com',
      slotLabel: 'Pazar, 6 Tem · 20:30',
      status: 'cancelled',
      createdAt: '2026-07-02T21:50:00+03:00'
    },
    {
      id: 'REZ-2026-0009',
      studentFirstName: 'Defne',
      studentLastName: 'Koç',
      grade: '7. Sınıf',
      subject: 'Matematik',
      parentFirstName: 'Seda',
      parentLastName: 'Koç',
      phone: '0530 114 77 58',
      email: 'seda.koc@mail.com',
      slotLabel: 'Bugün · 11:30',
      status: 'confirmed',
      createdAt: '2026-07-05T06:55:00+03:00'
    },
    {
      id: 'REZ-2026-0010',
      studentFirstName: 'Yiğit',
      studentLastName: 'Polat',
      grade: '8. Sınıf',
      subject: 'Türkçe',
      parentFirstName: 'Emre',
      parentLastName: 'Polat',
      phone: '0543 667 31 04',
      email: 'emre.polat@mail.com',
      slotLabel: 'Pazartesi, 7 Tem · 13:00',
      status: 'pending',
      createdAt: '2026-07-05T09:30:00+03:00'
    },
    {
      id: 'REZ-2026-0011',
      studentFirstName: 'Zeynep',
      studentLastName: 'Arslan',
      grade: '6. Sınıf',
      subject: 'Matematik',
      parentFirstName: 'Murat',
      parentLastName: 'Arslan',
      phone: '0532 901 22 18',
      email: 'murat.arslan@gmail.com',
      slotLabel: 'Salı, 8 Tem · 16:00',
      status: 'pending',
      createdAt: '2026-07-04T22:10:00+03:00'
    },
    {
      id: 'REZ-2026-0012',
      studentFirstName: 'Berk',
      studentLastName: 'Yıldız',
      grade: '7. Sınıf',
      subject: 'Fen Bilimleri',
      parentFirstName: 'Pınar',
      parentLastName: 'Yıldız',
      phone: '0554 112 33 77',
      email: 'pinar.yildiz@mail.com',
      slotLabel: 'Çarşamba, 9 Tem · 11:30',
      status: 'confirmed',
      createdAt: '2026-07-04T08:40:00+03:00'
    },
    {
      id: 'REZ-2026-0013',
      studentFirstName: 'Ece',
      studentLastName: 'Güneş',
      grade: '5. Sınıf',
      subject: 'İngilizce',
      parentFirstName: 'Serkan',
      parentLastName: 'Güneş',
      phone: '0507 445 66 90',
      email: 'serkan.gunes@outlook.com',
      slotLabel: 'Perşembe, 10 Tem · 14:30',
      status: 'completed',
      createdAt: '2026-07-03T17:25:00+03:00'
    },
    {
      id: 'REZ-2026-0014',
      studentFirstName: 'Alp',
      studentLastName: 'Kurt',
      grade: '8. Sınıf',
      subject: 'Matematik',
      parentFirstName: 'Nihan',
      parentLastName: 'Kurt',
      phone: '0536 778 01 44',
      email: 'nihan.kurt@mail.com',
      slotLabel: 'Cuma, 11 Tem · 19:00',
      status: 'pending',
      createdAt: '2026-07-02T13:15:00+03:00'
    },
    {
      id: 'REZ-2026-0015',
      studentFirstName: 'Damla',
      studentLastName: 'Erdoğan',
      grade: '6. Sınıf',
      subject: 'Türkçe',
      parentFirstName: 'Oğuz',
      parentLastName: 'Erdoğan',
      phone: '0541 330 55 22',
      email: 'oguz.erdogan@gmail.com',
      slotLabel: 'Cumartesi, 12 Tem · 17:30',
      status: 'confirmed',
      createdAt: '2026-07-01T10:50:00+03:00'
    },
    {
      id: 'REZ-2026-0016',
      studentFirstName: 'Kaan',
      studentLastName: 'Tekin',
      grade: '7. Sınıf',
      subject: 'Sosyal Bilgiler',
      parentFirstName: 'Esra',
      parentLastName: 'Tekin',
      phone: '0538 990 14 63',
      email: 'esra.tekin@icloud.com',
      slotLabel: 'Pazar, 13 Tem · 10:00',
      status: 'cancelled',
      createdAt: '2026-06-30T20:05:00+03:00'
    }
  ];

  var STATUS_LABELS = {
    pending: 'Onay Bekliyor',
    confirmed: 'Onaylandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal'
  };

  var SLOT_TIMES = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];
  var DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var FULL_SLOTS = {
    0: { '13:00': 1, '17:30': 1 },
    1: { '10:00': 1, '19:00': 1 },
    2: { '14:30': 1, '20:30': 1 },
    3: { '11:30': 1, '13:00': 1, '20:30': 1 }
  };

  function normalizeReservation(r) {
    if (!r.requestedSlotLabel) r.requestedSlotLabel = r.slotLabel;
    if (r.slotConfirmedByParent === undefined) r.slotConfirmedByParent = r.status === 'confirmed';
    return r;
  }

  function nextOpenDays(count) {
    var arr = [];
    var today = new Date();
    for (var i = 0; i < count; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        label: i === 0 ? 'Bugün' : DAY_NAMES[d.getDay()],
        date: d.getDate() + ' ' + MONTH_SHORT[d.getMonth()],
        full: DAY_NAMES[d.getDay()] + ', ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()],
        offset: i
      });
    }
    return arr;
  }

  function buildSlotLabel(dayOffset, time) {
    var days = nextOpenDays(4);
    var day = days[dayOffset] || days[0];
    var prefix = day.offset === 0 ? 'Bugün' : day.full.split(',')[0] + ', ' + day.date;
    return prefix + ' · ' + time;
  }

  function getOpenLessonSlots() {
    return {
      days: nextOpenDays(4),
      times: SLOT_TIMES.slice(),
      fullByDay: FULL_SLOTS
    };
  }

  function updateReservationSlot(id, payload) {
    for (var i = 0; i < RESERVATIONS.length; i++) {
      if (RESERVATIONS[i].id !== id) continue;
      var r = RESERVATIONS[i];
      normalizeReservation(r);
      if (payload.slotLabel && payload.slotLabel !== r.slotLabel) {
        if (!r.slotUpdatedAt) r.requestedSlotLabel = r.requestedSlotLabel || r.slotLabel;
        r.slotLabel = payload.slotLabel;
        r.slotUpdatedAt = new Date().toISOString();
      }
      if (payload.slotConfirmedByParent !== undefined) {
        r.slotConfirmedByParent = !!payload.slotConfirmedByParent;
      }
      if (payload.status) {
        r.status = payload.status;
      } else if (r.slotConfirmedByParent && r.status === 'pending') {
        r.status = 'confirmed';
      }
      return normalizeReservation(r);
    }
    return null;
  }

  function getReservations() {
    return RESERVATIONS.map(normalizeReservation);
  }

  function getReservationById(id) {
    for (var i = 0; i < RESERVATIONS.length; i++) {
      if (RESERVATIONS[i].id === id) return normalizeReservation(RESERVATIONS[i]);
    }
    return null;
  }

  function getFilterOptions() {
    var grades = {};
    var subjects = {};
    RESERVATIONS.forEach(function (r) {
      grades[r.grade] = true;
      subjects[r.subject] = true;
    });
    return {
      grades: Object.keys(grades).sort(),
      subjects: Object.keys(subjects).sort()
    };
  }

  function getStats() {
    var all = getReservations();
    var today = all.filter(function (r) { return /Bugün/.test(r.slotLabel); }).length;
    var pending = all.filter(function (r) { return r.status === 'pending'; }).length;
    var confirmed = all.filter(function (r) { return r.status === 'confirmed'; }).length;
    var thisWeek = all.filter(function (r) { return r.status !== 'cancelled'; }).length;
    return {
      today: today,
      pending: pending,
      confirmed: confirmed,
      thisWeek: thisWeek,
      total: all.length
    };
  }

  global.TrialLessonManagerMock = {
    ID_PREFIX: ID_PREFIX,
    formatReservationId: formatReservationId,
    nextReservationId: nextReservationId,
    getReservations: getReservations,
    getReservationById: getReservationById,
    getFilterOptions: getFilterOptions,
    getOpenLessonSlots: getOpenLessonSlots,
    buildSlotLabel: buildSlotLabel,
    updateReservationSlot: updateReservationSlot,
    getStats: getStats,
    STATUS_LABELS: STATUS_LABELS
  };
})(typeof window !== 'undefined' ? window : this);
