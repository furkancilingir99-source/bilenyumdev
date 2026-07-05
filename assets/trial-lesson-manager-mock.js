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

  var DEMO_PEOPLE = [
    { s: 'Mira', l: 'Yılmaz', p: 'Ayşe', pl: 'Yılmaz' },
    { s: 'Can', l: 'Kaya', p: 'Mehmet', pl: 'Kaya' },
    { s: 'Elif', l: 'Demir', p: 'Zeynep', pl: 'Demir' },
    { s: 'Arda', l: 'Öztürk', p: 'Fatma', pl: 'Öztürk' },
    { s: 'Selin', l: 'Aksoy', p: 'Burak', pl: 'Aksoy' },
    { s: 'Emir', l: 'Çelik', p: 'Deniz', pl: 'Çelik' },
    { s: 'Lina', l: 'Şahin', p: 'Gül', pl: 'Şahin' },
    { s: 'Kerem', l: 'Aydın', p: 'Hakan', pl: 'Aydın' },
    { s: 'Defne', l: 'Koç', p: 'Seda', pl: 'Koç' },
    { s: 'Yiğit', l: 'Polat', p: 'Emre', pl: 'Polat' },
    { s: 'Zeynep', l: 'Arslan', p: 'Murat', pl: 'Arslan' },
    { s: 'Berk', l: 'Yıldız', p: 'Pınar', pl: 'Yıldız' },
    { s: 'Ece', l: 'Güneş', p: 'Serkan', pl: 'Güneş' },
    { s: 'Alp', l: 'Kurt', p: 'Nihan', pl: 'Kurt' },
    { s: 'Damla', l: 'Erdoğan', p: 'Oğuz', pl: 'Erdoğan' },
    { s: 'Kaan', l: 'Tekin', p: 'Esra', pl: 'Tekin' },
    { s: 'Asya', l: 'Bulut', p: 'Volkan', pl: 'Bulut' },
    { s: 'Deniz', l: 'Acar', p: 'Melis', pl: 'Acar' },
    { s: 'Eren', l: 'Taş', p: 'Cem', pl: 'Taş' },
    { s: 'Gizem', l: 'Uçar', p: 'Hande', pl: 'Uçar' },
    { s: 'Baran', l: 'Işık', p: 'Tolga', pl: 'Işık' },
    { s: 'Ceren', l: 'Vural', p: 'Dilek', pl: 'Vural' },
    { s: 'Doruk', l: 'Sezer', p: 'Koray', pl: 'Sezer' },
    { s: 'Fulya', l: 'Tan', p: 'Selin', pl: 'Tan' },
    { s: 'Gökhan', l: 'Bayrak', p: 'Aslı', pl: 'Bayrak' },
    { s: 'Hazal', l: 'Duman', p: 'Onur', pl: 'Duman' },
    { s: 'Ilgın', l: 'Eren', p: 'Tuğba', pl: 'Eren' },
    { s: 'Jale', l: 'Fırat', p: 'Barış', pl: 'Fırat' },
    { s: 'Kuzey', l: 'Gencer', p: 'Mine', pl: 'Gencer' },
    { s: 'Lara', l: 'Horoz', p: 'Umut', pl: 'Horoz' },
    { s: 'Mete', l: 'Ilıcalı', p: 'Yasemin', pl: 'Ilıcalı' },
    { s: 'Nil', l: 'Jandarma', p: 'Sinan', pl: 'Özkan' },
    { s: 'Ozan', l: 'Kılıç', p: 'Betül', pl: 'Kılıç' },
    { s: 'Pelin', l: 'Lale', p: 'Erhan', pl: 'Lale' },
    { s: 'Rüya', l: 'Mert', p: 'Gamze', pl: 'Mert' },
    { s: 'Sarp', l: 'Nalbant', p: 'Levent', pl: 'Nalbant' },
    { s: 'Tuana', l: 'Oral', p: 'Şule', pl: 'Oral' },
    { s: 'Umut', l: 'Pak', p: 'Ferhat', pl: 'Pak' },
    { s: 'Vildan', l: 'Rüzgar', p: 'Cansu', pl: 'Rüzgar' },
    { s: 'Yasin', l: 'Soylu', p: 'İpek', pl: 'Soylu' },
    { s: 'Zara', l: 'Toprak', p: 'Alper', pl: 'Toprak' },
    { s: 'Atlas', l: 'Uzun', p: 'Berna', pl: 'Uzun' },
    { s: 'Belinay', l: 'Vardar', p: 'Kaan', pl: 'Vardar' },
    { s: 'Cemre', l: 'Yavuz', p: 'Derya', pl: 'Yavuz' },
    { s: 'Dilan', l: 'Zengin', p: 'Halil', pl: 'Zengin' },
    { s: 'Efe', l: 'Akın', p: 'Lale', pl: 'Akın' },
    { s: 'Fırat', l: 'Bozkurt', p: 'Merve', pl: 'Bozkurt' },
    { s: 'Gülce', l: 'Ceylan', p: 'Okan', pl: 'Ceylan' }
  ];

  var EXTRA_STUDENT_FIRST = [
    'Alper', 'Buse', 'Cem', 'Derya', 'Eda', 'Fahri', 'Gamze', 'Haluk', 'Irmak', 'Janset',
    'Kıvanç', 'Lale', 'Mert', 'Naz', 'Okan', 'Poyraz', 'Rana', 'Sude', 'Tuna', 'Umay',
    'Veli', 'Yaren', 'Zehra', 'Ahmet', 'Beste', 'Cihan', 'Dilara', 'Eylül', 'Feride', 'Görkem',
    'Hülya', 'İrem', 'Kadir', 'Leyla', 'Mina', 'Nehir', 'Onur', 'Pınar', 'Rıza', 'Simay',
    'Tarık', 'Ufuk', 'Vera', 'Yusuf', 'Zümra', 'Aras', 'Beren', 'Ceyda', 'Doğa', 'Esin', 'Figen', 'Güneş'
  ];
  var EXTRA_STUDENT_LAST = [
    'Avcı', 'Başaran', 'Candan', 'Dağlı', 'Ergün', 'Fidan', 'Gökalp', 'Hacıoğlu', 'İnce', 'Jaleli',
    'Keskin', 'Liman', 'Mutlu', 'Narin', 'Okur', 'Parlak', 'Rüstem', 'Sarı', 'Tunç', 'Uslu',
    'Vatan', 'Yalın', 'Zengin', 'Aslan', 'Bilgin', 'Ceylan', 'Duran', 'Ekici', 'Fındık', 'Güler',
    'Han', 'Işık', 'Kaplan', 'Kurt', 'Laleli', 'Mavi', 'Nazlı', 'Orhan', 'Pektaş', 'Rençber',
    'Sönmez', 'Türk', 'Uçar', 'Vural', 'Yavuz', 'Aksoy', 'Boz', 'Çetin', 'Demirci', 'Ergin', 'Güven', 'Helvacı'
  ];
  var EXTRA_PARENT_FIRST = [
    'Ali', 'Banu', 'Cengiz', 'Dilek', 'Erkan', 'Filiz', 'Gökhan', 'Hacer', 'İbrahim', 'Jale',
    'Kemal', 'Leman', 'Murat', 'Nur', 'Osman', 'Pelin', 'Recep', 'Sevgi', 'Turgut', 'Ümit',
    'Vedat', 'Yıldız', 'Zeki', 'Arzu', 'Bekir', 'Cemile', 'Davut', 'Emine', 'Fatih', 'Gonca',
    'Hasan', 'Işıl', 'Kenan', 'Leyla', 'Mustafa', 'Nalan', 'Orhan', 'Perihan', 'Rıdvan', 'Serap',
    'Tamer', 'Uğur', 'Volkan', 'Yasemin', 'Zafer', 'Aylin', 'Baran', 'Cansu', 'Doğan', 'Elvan', 'Ferit', 'Gülşen'
  ];
  var EXTRA_PARENT_LAST = EXTRA_STUDENT_LAST;

  function personForIndex(i) {
    if (i < DEMO_PEOPLE.length) return DEMO_PEOPLE[i];
    var j = i - DEMO_PEOPLE.length;
    return {
      s: EXTRA_STUDENT_FIRST[j % EXTRA_STUDENT_FIRST.length],
      l: EXTRA_STUDENT_LAST[Math.floor(j / EXTRA_STUDENT_FIRST.length) % EXTRA_STUDENT_LAST.length],
      p: EXTRA_PARENT_FIRST[j % EXTRA_PARENT_FIRST.length],
      pl: EXTRA_PARENT_LAST[Math.floor(j / EXTRA_PARENT_FIRST.length) % EXTRA_PARENT_LAST.length]
    };
  }

  var DEMO_SUBJECTS = ['Matematik', 'Fen Bilimleri', 'Türkçe', 'İngilizce', 'Sosyal Bilgiler'];
  var DEMO_GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
  var DEMO_STATUSES = [
    'pending', 'pending', 'pending', 'confirmed', 'confirmed', 'confirmed',
    'pending', 'confirmed', 'completed', 'cancelled'
  ];
  var DEMO_SLOTS = [
    'Bugün · 10:00', 'Bugün · 11:30', 'Bugün · 13:00', 'Bugün · 16:00',
    'Pazartesi, 7 Tem · 10:00', 'Pazartesi, 7 Tem · 14:30', 'Pazartesi, 7 Tem · 19:00',
    'Salı, 8 Tem · 11:30', 'Salı, 8 Tem · 16:00', 'Salı, 8 Tem · 17:30',
    'Çarşamba, 9 Tem · 13:00', 'Çarşamba, 9 Tem · 19:00',
    'Perşembe, 10 Tem · 14:30', 'Perşembe, 10 Tem · 17:30',
    'Cuma, 11 Tem · 10:00', 'Cuma, 11 Tem · 19:00',
    'Cumartesi, 12 Tem · 10:00', 'Cumartesi, 12 Tem · 17:30',
    'Pazar, 6 Tem · 20:30', 'Pazar, 13 Tem · 10:00'
  ];
  var DEMO_DOMAINS = ['mail.com', 'gmail.com', 'outlook.com', 'icloud.com', 'yahoo.com'];

  function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '');
  }

  function buildDemoReservations() {
    var list = [];
    var total = 100;
    for (var i = 0; i < total; i++) {
      var person = personForIndex(i);
      var seq = i + 1;
      var gradeIdx = Math.floor(i / DEMO_SUBJECTS.length) % DEMO_GRADES.length;
      var subjectIdx = i % DEMO_SUBJECTS.length;
      var phoneMid = String(100 + (i * 17) % 900);
      var phoneEnd = String(10 + (i * 13) % 90).padStart(2, '0');
      var day = String(Math.max(1, 30 - (i % 28))).padStart(2, '0');
      var hour = String(8 + (i % 14)).padStart(2, '0');
      var minute = (i % 2) ? '30' : '00';
      var createdAt = '2026-06-' + day + 'T' + hour + ':' + minute + ':00+03:00';
      if (i < 12) {
        createdAt = '2026-07-0' + (1 + (i % 5)) + 'T' + hour + ':' + minute + ':00+03:00';
      }

      list.push({
        id: formatReservationId(2026, seq),
        studentFirstName: person.s,
        studentLastName: person.l,
        grade: DEMO_GRADES[gradeIdx],
        subject: DEMO_SUBJECTS[subjectIdx],
        parentFirstName: person.p,
        parentLastName: person.pl,
        phone: '05' + String(30 + (i % 50)).padStart(2, '0') + ' ' + phoneMid + ' ' + phoneEnd + ' ' + String(10 + (i % 89)).padStart(2, '0'),
        email: slugify(person.s) + '.' + slugify(person.l) + '.' + seq + '@' + DEMO_DOMAINS[i % DEMO_DOMAINS.length],
        slotLabel: DEMO_SLOTS[i % DEMO_SLOTS.length],
        status: DEMO_STATUSES[i % DEMO_STATUSES.length],
        createdAt: createdAt
      });
    }

    /* Özel senaryolar — filtre / koordinasyon demo */
    list[2].requestedSlotLabel = 'Salı, 8 Tem · 11:30';
    list[2].slotConfirmedByParent = false;
    list[5].status = 'completed';
    list[7].status = 'cancelled';
    list[77].status = 'cancelled';
    list[88].status = 'cancelled';
    list[8].status = 'confirmed';
    list[8].slotLabel = 'Bugün · 11:30';
    list[0].status = 'pending';
    list[1].status = 'confirmed';
    list[1].slotLabel = 'Bugün · 16:00';
    list[48].slotConfirmedByParent = false;
    list[48].requestedSlotLabel = 'Pazartesi, 7 Tem · 10:00';
    list[63].status = 'pending';
    list[91].status = 'confirmed';

    return list;
  }

  var RESERVATIONS = buildDemoReservations();

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
