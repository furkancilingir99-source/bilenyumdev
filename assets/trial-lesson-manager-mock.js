/**
 * Deneme dersi rezervasyonları — demo veri
 */
(function (global) {
  'use strict';

  var RESERVATIONS = [
    {
      id: 'r1',
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
      id: 'r2',
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
      id: 'r3',
      studentFirstName: 'Elif',
      studentLastName: 'Demir',
      grade: '6. Sınıf',
      subject: 'Türkçe',
      parentFirstName: 'Zeynep',
      parentLastName: 'Demir',
      phone: '0505 778 44 12',
      email: 'zeynep.demir@outlook.com',
      slotLabel: 'Salı, 8 Tem · 11:30',
      status: 'pending',
      createdAt: '2026-07-04T19:30:00+03:00'
    },
    {
      id: 'r4',
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
      id: 'r5',
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
      id: 'r6',
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
      id: 'r7',
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
      id: 'r8',
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
      id: 'r9',
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
      id: 'r10',
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
    }
  ];

  var STATUS_LABELS = {
    pending: 'Onay Bekliyor',
    confirmed: 'Onaylandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal'
  };

  function getReservations() {
    return RESERVATIONS.slice();
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
    getReservations: getReservations,
    getStats: getStats,
    STATUS_LABELS: STATUS_LABELS
  };
})(typeof window !== 'undefined' ? window : this);
