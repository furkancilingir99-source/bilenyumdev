(function (global) {
  'use strict';
  var pageEl = document.getElementById('progPage');
  if (!pageEl) return;

  var sectionTitle = document.getElementById('progSectionTitle');
  function setProgSectionTitle(clanName) {
    if (!sectionTitle) return;
    var name = (clanName || '').replace(/\s+/g, ' ').trim();
    sectionTitle.textContent = (name ? name + ' ' : '') + 'Ders Programı';
  }
  var clanEl = document.getElementById('ctxClan');
  if (clanEl) setProgSectionTitle(clanEl.textContent);
  global.updateProgSectionTitle = setProgSectionTitle;

  var DAY_NAMES = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  var MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  var HOUR_START = 9;
  var HOUR_END = 22;
  var TODAY = new Date(2026, 4, 26); // "Bugün" = 26 Mayıs 2026 (demo)

  var SUBJECT_NAMES = {
    mat: 'Matematik', fen: 'Fen Bilimleri', trk: 'Türkçe',
    ing: 'İngilizce', sos: 'Sosyal Bilgiler', din: 'Din Kültürü'
  };
  // 3D emoji ikonset — dashboard-3 ile aynı dil
  var SUBJECT_ICONS = {
    mat: '📐', fen: '🧬', trk: '📖',
    ing: '🔤', sos: '🌍', din: '🕌'
  };
  // Konu bazlı hero görseller (Unsplash, küçük crop, lesson kapağı)
  var TOPIC_IMAGES = {
    mat: 'https://images.unsplash.com/photo-1635372722656-389f87a941b7?w=720&h=420&fit=crop&q=80',
    fen: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=720&h=420&fit=crop&q=80',
    trk: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=720&h=420&fit=crop&q=80',
    ing: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=720&h=420&fit=crop&q=80',
    sos: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=720&h=420&fit=crop&q=80',
    din: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=720&h=420&fit=crop&q=80'
  };

  // Subject bazlı rozet ödülleri — konu temalı
  var BADGES = {
    mat: { name: 'Sayı Avcısı',      icon: '🔢' },
    fen: { name: 'Doğa Gözlemcisi',  icon: '🌿' },
    trk: { name: 'Cümle Ustası',     icon: '✍️' },
    ing: { name: 'Dil Kâşifi',       icon: '🗺️' },
    sos: { name: 'Tarih Dedektifi',  icon: '🔍' },
    din: { name: 'Bilge Öğrenci',    icon: '📿' }
  };
  // Demo öğrenci seviye durumu (ödev drawer demo)
  var currentBaseXp = 825;

  // Öğretmen kataloğu — short isim → full + role + avatar
  var TEACHERS = {
    'Mehmet Y.': { full: 'Mehmet Yılmaz', role: 'Matematik Öğretmeni', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces&q=80' },
    'Ayşe D.':   { full: 'Ayşe Demir',    role: 'Fen Bilimleri Öğretmeni', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces&q=80' },
    'Zeynep K.': { full: 'Zeynep Kaya',   role: 'Türkçe Öğretmeni', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces&q=80' },
    'Sarah J.':  { full: 'Sarah Johnson', role: 'İngilizce Öğretmeni', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces&q=80' },
    'Ali T.':    { full: 'Ali Tunç',      role: 'Sosyal Bilgiler Öğretmeni', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces&q=80' },
    'Ömer A.':   { full: 'Ömer Aksoy',    role: 'Din Kültürü Öğretmeni', avatar: 'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=120&h=120&fit=crop&crop=faces&q=80' }
  };

  // --- Events (ISO date string YYYY-MM-DD) ---
  var EVENTS = [
    // Pazartesi 26 Mayıs — 12. Eğitim Haftası
    { date: '2026-05-26', start: '09:00', dur: 60, subject: 'mat', topic: 'Olasılığa Giriş ve Örnek Uzay', type: 'live', lessonFormat: 'rud', teacher: 'Mehmet Y.', joined: true, joinStatus: 'attended', perfLessonId: 'a1',
      kazanim: 'Olası durumları belirler ve basit olaylarda olasılık değerini hesaplar.',
      desc: 'Olasılık konusuna giriş: deney, çıktı, örnek uzay kavramları. Bir madeni para ve zar üzerinden basit olasılık hesabı yapacağız. Derste 3 mini quiz ile pekiştirme var, defterini ve hesap makineni hazır bulundur.' },
    { date: '2026-05-26', start: '11:00', dur: 60, subject: 'fen', topic: 'Madde Döngüleri ve Ekosistem', type: 'live', teacher: 'Ayşe D.', missed: true, joinStatus: 'absent', perfLessonId: 'a2',
      kazanim: 'Madde döngülerini (su, karbon, azot) ve canlılar için önemini örneklerle açıklar.',
      desc: 'Su, karbon ve azot döngülerinin canlılar için önemini ele alacağız. Her döngü için kavram haritası birlikte çıkaracak, doğadan örneklerle ilişkilendireceğiz. Ders sonunda küçük bir grup etkinliği var.' },
    { date: '2026-05-26', start: '14:00', dur: 60, subject: 'trk', topic: 'Paragrafta Ana Fikir ve Yardımcı Fikir', type: 'live', teacher: 'Zeynep K.', joined: true, joinStatus: 'attended', perfLessonId: 'a3',
      kazanim: 'Bir paragrafın ana fikrini ve yardımcı fikirlerini ayırt eder.',
      desc: 'Paragrafta ana fikir, yardımcı fikir ve konu farklarını işliyoruz. LGS tarzı 8 örnek paragraf üzerinden hızlı analiz teknikleri öğreneceksiniz. Soru çözüm aşamasında aktif katılım bekliyorum 🌟' },
    // Salı 27 Mayıs
    { date: '2026-05-27', start: '10:00', dur: 90, subject: 'mat', topic: 'Köklü Sayılarda Dört İşlem', type: 'live', lessonFormat: 'kid', teacher: 'Mehmet Y.', joined: true, joinStatus: 'attended', perfLessonId: 'a4',
      kazanim: 'Köklü ifadelerle toplama, çıkarma, çarpma ve bölme işlemlerini yapar.',
      desc: 'Köklü ifadelerde dört işlem (toplama, çıkarma, çarpma, bölme) tekrarı. Karekök içinde çarpan ayırma, kök dışına çıkarma teknikleri. 90 dakikalık ders, 25 dk konu + 50 dk soru çözüm + 15 dk değerlendirme.' },
    { date: '2026-05-27', start: '13:00', dur: 60, subject: 'ing', topic: 'Friendship Reading & Vocab', type: 'live', teacher: 'Sarah J.', missed: true, joinStatus: 'absent', perfLessonId: 'a7',
      kazanim: 'Arkadaşlık temalı okuma metinlerini anlar ve yeni kelimeleri bağlam içinde kullanır.',
      desc: 'Friendship unit reading passages. We will read 3 short dialogues and answer comprehension questions together. New vocabulary will be reviewed at the end — bring your notebook and a pencil!' },
    { date: '2026-05-27', start: '15:00', dur: 60, subject: 'sos', topic: 'Atatürk İlkeleri ve İnkılapları', type: 'live', teacher: 'Ali T.', joined: true, joinStatus: 'attended', perfLessonId: 'a14',
      kazanim: 'Atatürk ilkelerinin tarihsel arkaplanını açıklar ve günümüze yansımalarını yorumlar.',
      desc: 'Atatürk ilkelerinin (Cumhuriyetçilik, Milliyetçilik, Halkçılık vd.) tarihsel arkaplanı ve günümüze yansımaları. Her ilke için somut örnekler üzerinden tartışma yapacağız.' },
    // Çarşamba 28 Mayıs
    { date: '2026-05-28', start: '09:00', dur: 60, subject: 'fen', topic: 'Basit Makineler ve Kaldıraç', type: 'live', teacher: 'Ayşe D.', missed: true, joinStatus: 'absent', perfLessonId: 'a5',
      kazanim: 'Basit makinelerin (kaldıraç, makara, eğik düzlem) iş ve kuvvet üzerindeki etkisini açıklar.',
      desc: 'Kaldıraç, makara, eğik düzlem, çıkrık. Kuvvet ve iş hesapları, mekanik avantaj kavramı. Sınıfta basit makara deneyimleri ile öğreneceğiz — kalem ve ip getirmeyi unutma.' },
    { date: '2026-05-28', start: '11:00', dur: 60, subject: 'mat', topic: 'Cebirsel İfadeler ve Özdeşlikler', type: 'live', lessonFormat: 'rud', teacher: 'Mehmet Y.', joined: true, joinStatus: 'attended', perfLessonId: 'a8',
      kazanim: 'Cebirsel ifadeleri özdeşlikleri kullanarak çarpanlarına ayırır.',
      desc: 'Cebirsel ifadelerde toplama-çıkarma ve çarpanlara ayırma. Bilinen kimlikler (a²-b², (a+b)²) üzerinde örnek soru çözümleri. 15 sorudan oluşan mini test ile kapatıyoruz.' },
    { date: '2026-05-28', start: '14:00', dur: 60, subject: 'din', topic: 'Hac ve Kurban İbadetleri', type: 'live', teacher: 'Ömer A.', joinStatus: 'upcoming', perfLessonId: 'a13',
      kazanim: 'Hac ve kurban ibadetlerinin temel kavramlarını ve manevi boyutunu açıklar.',
      desc: 'Hac ibadetinin temel şartları ve aşamaları. Kurban ibadetinin sosyal ve manevi boyutu. Konuyu güncel örneklerle zenginleştirip soru-cevap formatında ilerleyeceğiz.' },
    // Perşembe 29 Mayıs
    { date: '2026-05-29', start: '10:00', dur: 60, subject: 'trk', topic: 'Cümle Türleri ve Yapı Çözümlemesi', type: 'live', teacher: 'Zeynep K.', joined: true, joinStatus: 'attended', perfLessonId: 'a10',
      kazanim: 'Cümleleri yapı bakımından sınıflandırır ve özelliklerini ayırt eder.',
      desc: 'Cümle türleri (basit, birleşik, sıralı, bağlı) ve yapı bakımından sınıflandırma. Anlam ve yapı farklarını tablolarla göstereceğim, ardından örnekler üzerinde çalışacağız.' },
    { date: '2026-05-29', start: '12:00', dur: 90, subject: 'mat', topic: 'Birinci Dereceden Eşitsizlikler', type: 'live', lessonFormat: 'kid', teacher: 'Mehmet Y.', missed: true, joinStatus: 'absent', perfLessonId: 'a15',
      kazanim: 'Bir bilinmeyenli eşitsizliklerin çözüm kümesini bulur ve sayı doğrusunda gösterir.',
      desc: 'Bir bilinmeyenli eşitsizlikler. Çözüm kümesi gösterimi, sayı doğrusu üzerinde temsil. 90 dk: 30 dk konu anlatımı + 45 dk soru çözüm + 15 dk genel değerlendirme.' },
    { date: '2026-05-29', start: '16:00', dur: 60, subject: 'ing', topic: 'Daily Routines & Frequency', type: 'live', teacher: 'Sarah J.', joinStatus: 'upcoming', perfLessonId: 'a12',
      kazanim: 'Present Simple zamanı ve sıklık zarflarıyla günlük rutinleri anlatır.',
      desc: 'Present Simple tense + daily activities. Practice talking about your daily routines with classmates. Vocabulary focus: time expressions, frequency adverbs.' },
    // Cuma 30 Mayıs
    { date: '2026-05-30', start: '09:00', dur: 60, subject: 'fen', topic: 'DNA, Gen ve Kalıtım', type: 'live', teacher: 'Ayşe D.', joined: true, joinStatus: 'attended', perfLessonId: 'a18',
      kazanim: 'DNA, gen ve kromozom kavramlarını açıklar; basit kalıtım problemlerini çözer.',
      desc: 'DNA yapısı, gen kavramı, kalıtım temelleri. Mendel deneyleri üzerinden basit kalıtım hesapları. Mikroskobik dünyayı keşfedeceğimiz keyifli bir ders!' },
    { date: '2026-05-30', start: '11:00', dur: 60, subject: 'mat', topic: 'Üçgen ve Çember Geometri Tekrarı', type: 'live', lessonFormat: 'rud', teacher: 'Mehmet Y.', missed: true, joinStatus: 'absent', perfLessonId: 'a8',
      kazanim: 'Üçgen ve çember konularındaki temel formülleri (alan, çevre, açı) uygular.',
      desc: 'Üçgen, dörtgen ve çember konularının genel tekrarı. Açı hesapları, alan ve çevre formülleri. LGS tarzı karma sorularla pekiştirme yapıyoruz.' },
    { date: '2026-05-30', start: '14:00', dur: 60, subject: 'sos', topic: 'Türkiye\'nin İklim ve Bitki Örtüsü', type: 'live', teacher: 'Ali T.', joinStatus: 'upcoming', perfLessonId: 'a14',
      kazanim: 'Türkiye\'nin iklim tiplerini ve bitki örtüsü özelliklerini bölgesel olarak açıklar.',
      desc: 'Türkiye\'nin iklim, bitki örtüsü ve nüfus özellikleri. Bölgesel farklılıklar ve ekonomik etkileri. Harita üzerinden interaktif anlatım.' },
    // Cumartesi 31 Mayıs — Deneme
    { date: '2026-05-31', start: '20:00', dur: 120, subject: 'mat', topic: 'Mayıs Genel Değerlendirme Denemesi', type: 'exam', teacher: 'Mehmet Y.',
      kazanim: 'Mayıs ayı boyunca işlenen tüm konularda öğrenme düzeyini değerlendirir.',
      desc: 'Mayıs ayı genel değerlendirme denemesi. 90 soru / 120 dakika. Tüm dersleri kapsayan karma bir test. Sonuçların hemen ardından genel değerlendirme ve eksik analiz raporun teslim edilecek.' },
    // Önceki/sonraki hafta events (ay görünümü için)
    { date: '2026-05-19', start: '10:00', dur: 60, subject: 'mat', topic: 'Olasılığa Hazırlık', type: 'live', lessonFormat: 'kid', teacher: 'Mehmet Y.',
      kazanim: 'Olasılık kavramına giriş için temel örnek uzay ve olay ilişkilerini açıklar.',
      perfLessonId: 'a1' },
    { date: '2026-05-20', start: '13:00', dur: 60, subject: 'fen', topic: 'Maddenin Tanecikli Yapısı', type: 'live', teacher: 'Ayşe D.',
      kazanim: 'Maddenin tanecikli yapısını ve temel özelliklerini örneklerle açıklar.',
      perfLessonId: 'a2' },
    { date: '2026-05-21', start: '11:00', dur: 60, subject: 'trk', topic: 'Sözcükte Anlam Bilgisi', type: 'live', teacher: 'Zeynep K.',
      kazanim: 'Sözcüklerin gerçek, yan ve mecaz anlamlarını ayırt eder.',
      perfLessonId: 'a10' },
    { date: '2026-05-22', start: '14:00', dur: 60, subject: 'ing', topic: 'Reading Skills Practice', type: 'live', teacher: 'Sarah J.', missed: true,
      kazanim: 'Okuma metinlerinde ana fikri ve detay bilgileri İngilizce olarak anlar.',
      perfLessonId: 'a12' },
    { date: '2026-06-02', start: '09:00', dur: 60, subject: 'mat', topic: 'Veri Analizi ve Grafikler', type: 'live', lessonFormat: 'rud', teacher: 'Mehmet Y.',
      kazanim: 'Verileri tablo ve grafiklerle yorumlar, sonuç çıkarır.',
      perfLessonId: 'a8' },
    { date: '2026-06-03', start: '11:00', dur: 60, subject: 'fen', topic: 'Periyodik Sistem Girişi', type: 'live', teacher: 'Ayşe D.',
      kazanim: 'Periyodik tablodaki temel düzeni ve element özelliklerini açıklar.',
      perfLessonId: 'a18' },
    { date: '2026-06-04', start: '14:00', dur: 60, subject: 'trk', topic: 'Türkçe Yazılı Sınavı', type: 'exam', teacher: 'Zeynep K.',
      kazanim: 'Türkçe dersinde işlenen konulardaki öğrenme düzeyini ölçer.' }
  ];

  EVENTS.forEach(function (e, i) {
    if (e.type !== 'live') return;
    if (e.lessonFormat !== 'kid' && e.lessonFormat !== 'rud') {
      e.lessonFormat = i % 2 === 0 ? 'kid' : 'rud';
    }
  });

  // Mevcut görüntülenen tarih (haftanın Pazartesi'si veya ayın 1'i)
  var currentDate = new Date(TODAY);
  var currentView = 'week';

  var EDU_TERM_START = new Date(2026, 2, 10); // 10 Mart 2026 — 1. eğitim haftası (Pzt)
  var MAX_EDU_WEEK = 16;

  function eduWeekStart(weekNum) {
    return addDays(EDU_TERM_START, (weekNum - 1) * 7);
  }
  function eduWeekEndExclusive(weekNum) {
    return addDays(eduWeekStart(weekNum), 7);
  }
  function findEduWeekForDate(d) {
    for (var w = 1; w <= MAX_EDU_WEEK; w++) {
      if (d >= eduWeekStart(w) && d < eduWeekEndExclusive(w)) return w;
    }
    return MAX_EDU_WEEK;
  }
  function formatEduWeek(week) {
    var n = parseInt(week, 10);
    if (!n || n < 1) return '';
    return n + '. Eğitim Haftası';
  }
  function formatWeekRange(weekNum) {
    var start = eduWeekStart(weekNum);
    var end = addDays(start, 6);
    var fmt = function(d) { return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()]; };
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return start.getDate() + ' — ' + end.getDate() + ' ' + MONTH_NAMES[end.getMonth()] + ' ' + end.getFullYear();
    }
    return fmt(start) + ' — ' + fmt(end) + ' ' + end.getFullYear();
  }
  var selectedEduWeek = 12; // Demo: 12. eğitim haftası — katıldı / katılmadı / gelecek ders karışımı

  function syncCurrentDateFromEduWeek() {
    currentDate = eduWeekStart(selectedEduWeek);
  }
  syncCurrentDateFromEduWeek();

  function updateWeekLabel() {
    var eyebrow = document.getElementById('progWeekEyebrow');
    var label = document.getElementById('progDateLabel');
    if (eyebrow) eyebrow.textContent = formatEduWeek(selectedEduWeek);
    if (label) label.textContent = formatWeekRange(selectedEduWeek);
  }

  // --- Helpers ---
  function isoDate(d) {
    var m = (d.getMonth() + 1).toString().padStart(2, '0');
    var day = d.getDate().toString().padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }
  function startOfWeek(d) {
    // Pazartesi başlangıç
    var x = new Date(d);
    var day = x.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    var diff = (day === 0 ? -6 : 1 - day); // shift to Monday
    x.setDate(x.getDate() + diff);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function addDays(d, n) {
    var x = new Date(d); x.setDate(x.getDate() + n); return x;
  }
  function formatDay(d) {
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()];
  }
  function timeToRow(time) {
    var h = parseInt(time.split(':')[0], 10);
    var m = parseInt(time.split(':')[1], 10);
    // 09:00 → row 2 (header is row 1), each 30min = 1 row would be too many
    // Using 1 hour rows: row = h - HOUR_START + 2
    return (h - HOUR_START) + 2;
  }
  function durToSpan(durMin) {
    return Math.max(1, Math.ceil(durMin / 60));
  }

  // --- Render: WEEK view ---
  var weekGrid = document.getElementById('progWeekGrid');

  function resolveLessonFormat(e) {
    if (!e || e.type !== 'live') return null;
    if (e.lessonFormat === 'kid' || e.lessonFormat === 'rud') return e.lessonFormat;
    return 'rud';
  }

  function lessonFormatShortLabel(fmt) {
    if (fmt === 'kid') return 'KİD';
    if (fmt === 'rud') return 'RUD';
    return '';
  }

  function lessonFormatDesc(fmt) {
    if (fmt === 'kid') {
      return 'Kavram İnşa Dersi (KİD) — öğrenciler kavramı sınıf içi tartışma ve etkinliklerle birlikte inşa eder.';
    }
    if (fmt === 'rud') {
      return 'Rehberli Uygulama Dersi (RUD) — öğretmen rehberliğinde adım adım soru çözümü ve uygulama yapılır.';
    }
    return '';
  }

  function lessonFormatBadgeHtml(fmt) {
    if (!fmt) return '';
    return '<span class="prog-lesson-type is-' + fmt + '">' + lessonFormatShortLabel(fmt) + '</span>';
  }

  function monthEventLabel(e) {
    if (e.type === 'holiday') return 'Tatil';
    if (e.type === 'exam') return '🏆 ' + e.topic;
    var base = SUBJECT_NAMES[e.subject] || e.topic;
    var fmt = resolveLessonFormat(e);
    if (fmt) return lessonFormatShortLabel(fmt) + ' · ' + base;
    return base;
  }

  function updateLessonFormatUI(e) {
    var fmt = resolveLessonFormat(e);
    var show = !!fmt;
    var drawerLessonType = document.getElementById('progDrawerLessonType');
    var drawerLessonTypeDesc = document.getElementById('progDrawerLessonTypeDesc');
    var drawerEl = document.getElementById('progDrawer');

    if (drawerLessonType) {
      drawerLessonType.hidden = !show;
      if (show) {
        drawerLessonType.textContent = lessonFormatShortLabel(fmt);
        drawerLessonType.className = 'd3-drawer-lesson-type is-' + fmt;
      }
    }
    if (drawerLessonTypeDesc) {
      drawerLessonTypeDesc.hidden = !show;
      if (show) {
        drawerLessonTypeDesc.textContent = lessonFormatDesc(fmt);
        drawerLessonTypeDesc.className = 'd3-drawer-format-hint is-' + fmt;
      }
    }
    if (drawerEl && show) drawerEl.setAttribute('data-lesson-format', fmt);
    else if (drawerEl) drawerEl.removeAttribute('data-lesson-format');
  }

  function renderWeek() {
    var start = eduWeekStart(selectedEduWeek);
    var end = addDays(start, 6);
    updateWeekLabel();

    var html = '';
    // Header row — explicit grid-row: 1
    html += '<div class="prog-week-corner" style="grid-column: 1; grid-row: 1;"></div>';
    for (var d = 0; d < 7; d++) {
      var dayDate = addDays(start, d);
      var isToday = sameDay(dayDate, TODAY);
      html += '<div class="prog-week-day' + (isToday ? ' is-today' : '') + '" '
            + 'style="grid-column: ' + (d + 2) + '; grid-row: 1;">'
            + '<span class="day-name">' + DAY_NAMES[d] + '</span>'
            + '<span class="day-num">' + dayDate.getDate() + '</span>'
            + '</div>';
    }
    // Time rows — explicit grid-column/row ile yerleşim (auto-placement bug fix:
    // event'ler explicit-placed olduğunda auto-placed slot'lar yer kaydırıyordu)
    for (var h = HOUR_START; h <= HOUR_END; h++) {
      var hStr = (h < 10 ? '0' : '') + h + ':00';
      var rowNum = (h - HOUR_START) + 2; // +1 header, +1 1-indexed
      html += '<div class="prog-week-time" style="grid-column: 1; grid-row: ' + rowNum + ';">' + hStr + '</div>';
      for (var d2 = 0; d2 < 7; d2++) {
        html += '<div class="prog-week-slot" style="grid-column: ' + (d2 + 2) + '; grid-row: ' + rowNum + ';"></div>';
      }
    }
    // Events (grid-positioned over slots)
    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      var eDate = new Date(e.date + 'T00:00:00');
      // Check if event is in current week
      for (var dd = 0; dd < 7; dd++) {
        var curD = addDays(start, dd);
        if (sameDay(eDate, curD)) {
          var col = dd + 2; // +1 for time column, +1 for 1-indexed
          var row = timeToRow(e.start);
          var span = durToSpan(e.dur);
          var endTime = computeEndTime(e.start, e.dur);
          var subjectName = SUBJECT_NAMES[e.subject] || (e.type === 'exam' ? 'Sınav' : '');
          var icon = SUBJECT_ICONS[e.subject] || (e.type === 'exam' ? '🏆' : '📅');
          var joinSt = resolveJoinStatus(e);
          var attAttr = joinSt ? ' data-attendance="' + joinSt + '"' : '';
          var lessonFmt = resolveLessonFormat(e);
          var fmtAttr = lessonFmt ? ' data-lesson-format="' + lessonFmt + '"' : '';
          var fmtBadge = lessonFormatBadgeHtml(lessonFmt);
          var attBadge = joinStatusBadgeHtml(joinSt);
          var a11yLabel = subjectName + ' — ' + e.topic + (lessonFmt ? ' — ' + lessonFormatShortLabel(lessonFmt) : '') + (joinSt ? ' — ' + joinStatusLabel(joinSt) : '');
          html += '<div class="prog-event" '
                + 'style="grid-column: ' + col + '; grid-row: ' + row + ' / span ' + span + ';" '
                + 'data-subject="' + (e.subject || '') + '" '
                + 'data-type="' + (e.type || '') + '" '
                + fmtAttr
                + 'data-event-id="' + i + '" '
                + attAttr
                + ' aria-label="' + a11yLabel.replace(/"/g, '&quot;') + '"'
                + ' data-topic="' + e.topic.replace(/"/g, '&quot;') + '">'
                + '<span class="prog-event-icon" aria-hidden="true">' + icon + '</span>'
                + '<span class="prog-event-body">'
                + '<span class="prog-event-head">'
                + '<span class="prog-event-subject">' + subjectName + '</span>'
                + attBadge
                + fmtBadge
                + '</span>'
                + '<span class="prog-event-topic">' + e.topic + '</span>'
                + '</span>'
                + '</div>';
          break;
        }
      }
    }
    weekGrid.innerHTML = html;
    updateNowLine();
    updateTruncationTitles();
  }

  // Konu adı kartı aşıyorsa data-truncated="true" → body-level tooltip anında çıkar
  function updateTruncationTitles() {
    var cards = weekGrid.querySelectorAll('.prog-event');
    for (var i = 0; i < cards.length; i++) {
      var topicEl = cards[i].querySelector('.prog-event-topic');
      if (!topicEl) continue;
      // 1px tolerans — sub-pixel rounding'i tolere et
      if (topicEl.scrollWidth > topicEl.clientWidth + 1) {
        cards[i].setAttribute('data-truncated', 'true');
        // a11y için aria-label (browser tooltip değil, ama screen reader okur)
        cards[i].setAttribute('aria-label', cards[i].getAttribute('data-topic') || topicEl.textContent);
      } else {
        cards[i].removeAttribute('data-truncated');
        cards[i].removeAttribute('aria-label');
      }
    }
  }

  // ---- Body-level tooltip (anında, clipping yok) ----
  var tooltipEl = null;
  function getTooltipEl() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'prog-tooltip';
      tooltipEl.style.display = 'none';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }
  function showTooltip(card) {
    var topic = card.getAttribute('data-topic');
    if (!topic) return;
    var el = getTooltipEl();
    el.textContent = topic;
    el.style.display = 'block';
    // Önce görünür yap ki ölçüm doğru olsun
    var rect = card.getBoundingClientRect();
    var tipRect = el.getBoundingClientRect();
    // Kartın üstüne, 10px boşlukla yerleştir
    var top = rect.top - tipRect.height - 10;
    var left = rect.left + rect.width / 2 - tipRect.width / 2;
    // Viewport içinde tut
    var margin = 6;
    if (left < margin) left = margin;
    if (left + tipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tipRect.width - margin;
    }
    // Üstte yer yoksa (sticky day-header altında kalıyorsa) altına çevir
    if (top < 110) {
      top = rect.bottom + 10;
    }
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }
  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }
  // Event delegation — mouseover/out (bubble yapar)
  weekGrid.addEventListener('mouseover', function (ev) {
    var card = ev.target.closest('.prog-event[data-truncated="true"]');
    if (card) showTooltip(card);
  });
  weekGrid.addEventListener('mouseout', function (ev) {
    var card = ev.target.closest('.prog-event');
    if (!card) return;
    // mouseout başka bir child'a girince de tetiklenir — sadece kart dışına çıkışta gizle
    if (!ev.relatedTarget || !card.contains(ev.relatedTarget)) hideTooltip();
  });
  // Scroll'da kart hareket eder, tooltip bayatlamasın
  document.getElementById('progWeek').addEventListener('scroll', hideTooltip);
  window.addEventListener('scroll', hideTooltip, true);

  // --- Now line — günün hangi saatindeysek yatay marker ---
  function updateNowLine() {
    if (currentView !== 'week') return;
    var existing = weekGrid.querySelector('.prog-week-now');
    if (existing) existing.remove();

    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    // Sadece görünür saat aralığında göster
    if (h < HOUR_START || h > HOUR_END) return;

    // Bugün (TODAY) cari haftada mı? Hangi sütunda?
    var start = eduWeekStart(selectedEduWeek);
    var todayDayIdx = -1;
    for (var d = 0; d < 7; d++) {
      if (sameDay(addDays(start, d), TODAY)) { todayDayIdx = d; break; }
    }
    if (todayDayIdx < 0) return;

    // Dikey konum: header(58px) + gap(2px) = 60px, sonra her saat 60px (58+2),
    // dakika offset row içinde (58px row yüksekliğine göre).
    var topPx = 60 + (h - HOUR_START) * 60 + (m / 60) * 58;

    var hh = (h < 10 ? '0' : '') + h;
    var mm = (m < 10 ? '0' : '') + m;
    var line = document.createElement('div');
    line.className = 'prog-week-now';
    line.style.top = topPx + 'px';
    line.innerHTML = '<span class="prog-week-now-time">' + hh + ':' + mm + '</span>'
                   + '<span class="prog-week-now-dot"></span>';
    weekGrid.appendChild(line);

    // Dot'u bugünün kolonunun merkezine yerleştir
    var todayHeader = weekGrid.querySelector('.prog-week-day.is-today');
    if (todayHeader) {
      var hRect = todayHeader.getBoundingClientRect();
      var lineRect = line.getBoundingClientRect();
      var dot = line.querySelector('.prog-week-now-dot');
      if (dot) {
        dot.style.left = (hRect.left + hRect.width / 2 - lineRect.left) + 'px';
      }
    }
  }

  function computeEndTime(start, durMin) {
    var h = parseInt(start.split(':')[0], 10);
    var m = parseInt(start.split(':')[1], 10);
    var total = h * 60 + m + durMin;
    var eh = Math.floor(total / 60);
    var em = total % 60;
    return (eh < 10 ? '0' : '') + eh + ':' + (em < 10 ? '0' : '') + em;
  }

  // --- Render: MONTH view ---
  var monthGrid = document.getElementById('progMonthGrid');
  function renderMonth() {
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth();
    var eyebrow = document.getElementById('progWeekEyebrow');
    if (eyebrow) eyebrow.textContent = MONTH_NAMES[month] + ' ' + year;
    document.getElementById('progDateLabel').textContent = 'Aylık görünüm';

    var firstDay = new Date(year, month, 1);
    var firstWeekStart = startOfWeek(firstDay); // her zaman Pazartesi
    // 42 gün (6 hafta × 7 gün)
    var html = '';
    for (var i = 0; i < 42; i++) {
      var d = addDays(firstWeekStart, i);
      var dIso = isoDate(d);
      var inMonth = (d.getMonth() === month);
      var isToday = sameDay(d, TODAY);
      var dayEvents = EVENTS.filter(function (e) { return e.date === dIso; });
      var evHtml = '';
      var maxShow = 3;
      for (var j = 0; j < Math.min(dayEvents.length, maxShow); j++) {
        var e = dayEvents[j];
        var label = monthEventLabel(e);
        evHtml += '<span class="month-event" data-subject="' + (e.subject || '') + '" data-type="' + (e.type || '') + '"' + (resolveLessonFormat(e) ? ' data-lesson-format="' + resolveLessonFormat(e) + '"' : '') + ' title="' + e.topic + ' — ' + e.start + '">' + label + '</span>';
      }
      if (dayEvents.length > maxShow) {
        evHtml += '<span class="month-event-more">+' + (dayEvents.length - maxShow) + ' daha</span>';
      }
      html += '<div class="prog-month-day' + (inMonth ? '' : ' is-other-month') + (isToday ? ' is-today' : '') + '">'
            + '<span class="month-day-num">' + d.getDate() + '</span>'
            + '<div class="month-day-events">' + evHtml + '</div>'
            + '</div>';
    }
    monthGrid.innerHTML = html;
  }

  // --- Eğitim haftası seçici ---
  var weekPickerEl = document.getElementById('progWeekPicker');
  var weekPickerListEl = document.getElementById('progWeekPickerList');
  var weekCalBtn = document.getElementById('progWeekCalBtn');

  function renderWeekPicker() {
    if (!weekPickerListEl) return;
    var html = '';
    for (var w = 1; w <= MAX_EDU_WEEK; w++) {
      var activeCls = w === selectedEduWeek ? ' is-active' : '';
      html += '<button type="button" class="prog-edu-picker-item' + activeCls + '" data-week="' + w + '">'
        + '<strong>' + formatEduWeek(w) + '</strong>'
        + '<span>' + formatWeekRange(w) + '</span>'
        + '</button>';
    }
    weekPickerListEl.innerHTML = html;
  }

  function closeWeekPicker() {
    if (!weekPickerEl) return;
    weekPickerEl.hidden = true;
    if (weekCalBtn) {
      weekCalBtn.classList.remove('is-open');
      weekCalBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function openWeekPicker() {
    if (!weekPickerEl) return;
    renderWeekPicker();
    weekPickerEl.hidden = false;
    if (weekCalBtn) {
      weekCalBtn.classList.add('is-open');
      weekCalBtn.setAttribute('aria-expanded', 'true');
    }
  }

  function toggleWeekPicker() {
    if (!weekPickerEl) return;
    if (weekPickerEl.hidden) openWeekPicker();
    else closeWeekPicker();
  }

  function selectEduWeek(weekNum) {
    var w = parseInt(weekNum, 10);
    if (!w || w < 1 || w > MAX_EDU_WEEK) return;
    selectedEduWeek = w;
    syncCurrentDateFromEduWeek();
    closeWeekPicker();
    renderWeek();
  }

  function shiftEduWeek(delta) {
    var next = selectedEduWeek + delta;
    if (next < 1 || next > MAX_EDU_WEEK) return;
    selectedEduWeek = next;
    syncCurrentDateFromEduWeek();
    renderWeek();
  }

  if (weekCalBtn) {
    weekCalBtn.addEventListener('click', function(e){
      e.stopPropagation();
      toggleWeekPicker();
    });
  }
  if (weekPickerListEl) {
    weekPickerListEl.addEventListener('click', function(e){
      var btn = e.target.closest('[data-week]');
      if (!btn) return;
      selectEduWeek(btn.getAttribute('data-week'));
    });
  }
  document.addEventListener('click', function(e){
    if (!weekPickerEl || weekPickerEl.hidden) return;
    if (e.target.closest('.prog-edu-nav')) return;
    closeWeekPicker();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeWeekPicker();
  });

  document.getElementById('progPrev').addEventListener('click', function () {
    shiftEduWeek(-1);
  });
  document.getElementById('progNext').addEventListener('click', function () {
    shiftEduWeek(1);
  });

  updateWeekLabel();
  renderWeekPicker();
  renderWeek();

  setInterval(updateNowLine, 60 * 1000);
  window.addEventListener('resize', function () {
    updateNowLine();
    updateTruncationTitles();
  });

  // ============ DERS DRAWER (veli) ============
  var drawerEl = document.getElementById('progDrawer');
  var drawerIcon = document.getElementById('progDrawerIcon');
  var drawerSubject = document.getElementById('progDrawerSubject');
  var drawerTopic = document.getElementById('progDrawerTopic');
  var drawerDate = document.getElementById('progDrawerDateText');
  var drawerTime = document.getElementById('progDrawerTimeText');
  var drawerDesc = document.getElementById('progDrawerDesc');
  var drawerKazanim = document.getElementById('progDrawerKazanim');
  var drawerStatus = document.getElementById('progDrawerStatus');
  var drawerReplayAlert = document.getElementById('progDrawerReplayAlert');
  var drawerReplayText = document.getElementById('progDrawerReplayText');
  var drawerFooterNote = document.getElementById('progDrawerFooterNote');
  var drawerPerfBtn = document.getElementById('progDrawerPerfBtn');
  var drawerPerfPending = document.getElementById('progDrawerPerfPending');

  var PERF_LESSON_DEFAULTS = {
    mat: 'a1', fen: 'a2', trk: 'a3', ing: 'a7', sos: 'a14', din: 'a13'
  };
  var DEFAULT_KAZANIM = 'Bu derste öğrencinizin kazanması beklenen müfredat hedeflerine ilişkin bilgi program sonunda güncellenecektir.';

  function resolvePerfLessonId(e) {
    if (e.type !== 'live') return null;
    if (e.perfLessonId) return e.perfLessonId;
    return PERF_LESSON_DEFAULTS[e.subject] || 'a1';
  }

  function updatePerfButton(e) {
    var joinSt = resolveJoinStatus(e);
    if (drawerPerfPending) {
      drawerPerfPending.hidden = true;
      drawerPerfPending.classList.remove('is-absent', 'is-upcoming');
    }
    if (!drawerPerfBtn) return;

    if (joinSt === 'upcoming') {
      drawerPerfBtn.hidden = true;
      if (drawerPerfPending) {
        drawerPerfPending.hidden = false;
        drawerPerfPending.classList.add('is-upcoming');
        drawerPerfPending.textContent =
          'Bu ders henüz işlenmediği için performans detayları şu an görüntülenememektedir. Canlı ders tamamlandıktan ve öğrencinizin katılım verileri sisteme işlendikten sonra performans detaylarını buradan inceleyebilirsiniz.';
      }
      return;
    }

    if (joinSt === 'absent') {
      drawerPerfBtn.hidden = true;
      if (drawerPerfPending) {
        drawerPerfPending.hidden = false;
        drawerPerfPending.classList.add('is-absent');
        drawerPerfPending.textContent =
          'Öğrenciniz bu canlı derse katılmadığı için performans detayı oluşmamıştır. Katılmadığı derslerde tüm performans kalemleri 0 üzerinden değerlendirilir; detaylı performans raporu yalnızca katıldığı dersler için görüntülenebilir.';
      }
      return;
    }

    var lessonId = resolvePerfLessonId(e);
    if (!lessonId) {
      drawerPerfBtn.hidden = true;
      return;
    }
    drawerPerfBtn.hidden = false;
    drawerPerfBtn.setAttribute('data-perf-lesson', lessonId);
  }

  var currentEvent = null;

  // Demo'da TODAY hardcoded — gerçek saatten dakika/saat alıp TODAY tarihine uyguluyoruz
  function demoNow() {
    var n = new Date();
    return new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate(),
                    n.getHours(), n.getMinutes(), n.getSeconds());
  }
  function eventDateTime(e) {
    var p = e.date.split('-');
    var h = parseInt(e.start.split(':')[0], 10);
    var m = parseInt(e.start.split(':')[1], 10);
    return new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10), h, m, 0);
  }
  function joinStatusLabel(s) {
    if (s === 'attended') return 'Katıldı';
    if (s === 'absent') return 'Katılmadı';
    return 'Gelecek Ders';
  }

  function joinStatusBadgeHtml(st) {
    if (!st) return '';
    return '<span class="prog-event-att is-' + st + '">' + joinStatusLabel(st) + '</span>';
  }
  function resolveJoinStatus(e) {
    if (e.type !== 'live') return null;
    if (e.joinStatus) return e.joinStatus;
    var start = eventDateTime(e);
    var end = new Date(start.getTime() + e.dur * 60000);
    var now = demoNow();
    if (now < start) return 'upcoming';
    if (now >= end) return e.missed ? 'absent' : 'attended';
    if (e.missed) return 'absent';
    return 'upcoming';
  }
  function dayNameLong(dt) {
    var names = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return names[dt.getDay()];
  }
  function updateStatusBadge(e) {
    if (!drawerStatus) return;
    var joinSt = resolveJoinStatus(e);
    if (!joinSt) {
      drawerStatus.hidden = true;
      return;
    }
    drawerStatus.hidden = false;
    drawerStatus.textContent = joinStatusLabel(joinSt);
    drawerStatus.className = 'pv-prog-drawer-status is-' + joinSt;
  }
  function updateReplayAlert(e) {
    if (!drawerReplayAlert) return;
    var joinSt = resolveJoinStatus(e);
    var show = joinSt === 'absent';
    drawerReplayAlert.hidden = !show;
    if (show && drawerReplayText) {
      var dt = eventDateTime(e);
      var subjectName = SUBJECT_NAMES[e.subject] || e.topic;
      var dayLabel = dayNameLong(dt);
      drawerReplayText.innerHTML =
        'Öğrenciniz <strong>' + dayLabel + '</strong> günü gerçekleşen <strong>' + subjectName + ' — ' + e.topic + '</strong> canlı dersine katılamamıştır. Konu eksiği oluşmaması için öğrencinizin <strong>Canlı Ders Tekrarları</strong> bölümünden bu dersin kaydını izlemesini önemle tavsiye ederiz.';
    }
  }
  function updateFooterNote(e) {
    if (!drawerFooterNote) return;
    var joinSt = resolveJoinStatus(e);
    if (e.type !== 'live') {
      drawerFooterNote.textContent = 'Bu etkinliğe ait katılım bilgisi yalnızca canlı dersler için gösterilir.';
      return;
    }
    if (joinSt === 'attended') {
      drawerFooterNote.textContent = 'Öğrenciniz bu canlı derse katılmıştır. Performans detaylarını Haftalık Performans Takibi bölümünden inceleyebilirsiniz.';
    } else if (joinSt === 'absent') {
      drawerFooterNote.textContent = 'Tekrar videosu izlendikten sonra öğrencinizin konuya hakimiyetini birlikte değerlendirmenizi öneririz.';
    } else {
      drawerFooterNote.textContent =
        'Bu ders henüz gerçekleşmedi. Öğrencinizin katılım durumu ve performans detayları, canlı ders tamamlandıktan sonra burada görünecektir.';
    }
  }

  function openDrawer(eventId) {
    var e = EVENTS[eventId];
    if (!e) return;
    currentEvent = e;

    var subjectName = SUBJECT_NAMES[e.subject] || (e.type === 'exam' ? 'Sınav' : 'Etkinlik');
    var icon = SUBJECT_ICONS[e.subject] || (e.type === 'exam' ? '🏆' : '📅');

    drawerIcon.textContent = icon;
    drawerSubject.textContent = subjectName.toUpperCase();
    drawerTopic.textContent = e.topic;

    drawerEl.setAttribute('data-subject', e.type === 'exam' ? 'exam' : (e.subject || 'mat'));
    updateStatusBadge(e);
    updateReplayAlert(e);
    updateFooterNote(e);
    updatePerfButton(e);
    updateLessonFormatUI(e);

    var dt = eventDateTime(e);
    var dateStr = DAY_NAMES[(dt.getDay() + 6) % 7] + ', ' + dt.getDate() + ' ' + MONTH_NAMES[dt.getMonth()];
    drawerDate.textContent = dateStr;
    var endTime = computeEndTime(e.start, e.dur);
    drawerTime.textContent = e.start + ' – ' + endTime;

    drawerKazanim.textContent = e.kazanim || DEFAULT_KAZANIM;
    drawerDesc.textContent = e.desc || 'Bu dersin içeriği ve kazanımları hakkında özet bilgi. Öğrencinizin derse hazırlık sürecini buradan takip edebilirsiniz.';

    drawerEl.classList.add('is-open');
    drawerEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawerEl.classList.remove('is-open');
    drawerEl.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentEvent = null;
  }

  // Event delegation — ders kartlarına tıklama
  weekGrid.addEventListener('click', function (ev) {
    var card = ev.target.closest('.prog-event');
    if (!card) return;
    var id = parseInt(card.getAttribute('data-event-id'), 10);
    if (!isNaN(id)) openDrawer(id);
  });

  // Close handlers
  document.querySelectorAll('[data-prog-drawer-close]').forEach(function (el) {
    el.addEventListener('click', closeDrawer);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && drawerEl.classList.contains('is-open')) closeDrawer();
  });

  /* =====================================================================
     CANLI DERS PERFORMANS DRAWER — aynı sayfa içinde açılır
     (veli-dashboard.html pvAbsLessonDrawer mantığının taşınmış hâli)
     ===================================================================== */
  var PV_ABS_LESSONS = [
    { id: 'a1',  subject: 'mat', name: 'Matematik',       topic: 'Köklü Sayılar',          status: 'attended', correct: 11, total: 14, handRaises: 2, boardRaises: 1, xp: 38, durationMin: 58 },
    { id: 'a2',  subject: 'fen', name: 'Fen Bilimleri',   topic: 'Madde ve Özellikleri',   status: 'attended', correct: 10, total: 12, handRaises: 2, boardRaises: 0, xp: 28, durationMin: 55 },
    { id: 'a3',  subject: 'trk', name: 'Türkçe',          topic: 'Paragraf Anlamı',        status: 'attended', correct: 9,  total: 10, handRaises: 3, boardRaises: 0, xp: 22, durationMin: 57 },
    { id: 'a4',  subject: 'mat', name: 'Matematik',       topic: 'KİD · Köklü Sayılar',    status: 'attended', correct: 12, total: 14, handRaises: 3, boardRaises: 0, xp: 35, durationMin: 43 },
    { id: 'a5',  subject: 'fen', name: 'Fen Bilimleri',   topic: 'Kuvvet ve Hareket',      status: 'absent',   correct: 0,  total: 11, handRaises: 0, boardRaises: 0, xp: 0,  durationMin: 0 },
    { id: 'a7',  subject: 'ing', name: 'İngilizce',       topic: 'Tenses',                 status: 'absent',   correct: 0,  total: 12, handRaises: 0, boardRaises: 0, xp: 0,  durationMin: 0 },
    { id: 'a8',  subject: 'mat', name: 'Matematik',       topic: 'Cebirsel İfadeler',      status: 'attended', correct: 9,  total: 12, handRaises: 2, boardRaises: 1, xp: 22, durationMin: 57 },
    { id: 'a10', subject: 'trk', name: 'Türkçe',          topic: 'Yazım Kuralları',        status: 'attended', correct: 9,  total: 10, handRaises: 3, boardRaises: 0, xp: 22, durationMin: 56 },
    { id: 'a12', subject: 'ing', name: 'İngilizce',       topic: 'Phrasal Verbs',          status: 'attended', correct: 10, total: 12, handRaises: 4, boardRaises: 0, xp: 27, durationMin: 58 },
    { id: 'a13', subject: 'din', name: 'Din Kültürü',     topic: 'İbadetler',              status: 'attended', correct: 13, total: 15, handRaises: 3, boardRaises: 0, xp: 40, durationMin: 44 },
    { id: 'a14', subject: 'sos', name: 'Sosyal Bilgiler', topic: 'Atatürk İlkeleri',       status: 'attended', correct: 12, total: 14, handRaises: 2, boardRaises: 0, xp: 38, durationMin: 55 },
    { id: 'a15', subject: 'mat', name: 'Matematik',       topic: 'Trigonometri',           status: 'absent',   correct: 0,  total: 12, handRaises: 0, boardRaises: 0, xp: 0,  durationMin: 0 },
    { id: 'a18', subject: 'fen', name: 'Fen Bilimleri',   topic: 'Elektrik',               status: 'attended', correct: 9,  total: 11, handRaises: 1, boardRaises: 0, xp: 28, durationMin: 54 }
  ];

  var perfDrawer = document.getElementById('progPerfDrawer');
  if (perfDrawer) {
    var perfIco = document.getElementById('progPerfIco');
    var perfEyebrow = document.getElementById('progPerfEyebrow');
    var perfTitle = document.getElementById('progPerfTitle');
    var perfDate = document.getElementById('progPerfDate');
    var perfTime = document.getElementById('progPerfTime');
    var perfStatus = document.getElementById('progPerfStatus');
    var perfReplayAlert = document.getElementById('progPerfReplayAlert');
    var perfReplayText = document.getElementById('progPerfReplayText');
    var perfNote = document.getElementById('progPerfNote');
    var perfRowCorrect = document.getElementById('progPerfRowCorrect');
    var perfRowXp = document.getElementById('progPerfRowXp');
    var perfRowHands = document.getElementById('progPerfRowHands');
    var perfRowBoard = document.getElementById('progPerfRowBoard');
    var perfRowParticipation = document.getElementById('progPerfRowParticipation');
    var perfRowDuration = document.getElementById('progPerfRowDuration');
    var perfCorrect = document.getElementById('progPerfCorrect');
    var perfXp = document.getElementById('progPerfXp');
    var perfHands = document.getElementById('progPerfHands');
    var perfBoard = document.getElementById('progPerfBoard');
    var perfParticipation = document.getElementById('progPerfParticipation');
    var perfDuration = document.getElementById('progPerfDuration');
    var perfCorrectDesc = document.getElementById('progPerfCorrectDesc');
    var perfXpDesc = document.getElementById('progPerfXpDesc');
    var perfHandsDesc = document.getElementById('progPerfHandsDesc');
    var perfBoardDesc = document.getElementById('progPerfBoardDesc');
    var perfParticipationDesc = document.getElementById('progPerfParticipationDesc');
    var perfDurationDesc = document.getElementById('progPerfDurationDesc');
    var perfBackBtn = document.getElementById('progPerfBackBtn');
    var perfLessonType = document.getElementById('progPerfLessonType');
    var perfLessonTypeDesc = document.getElementById('progPerfLessonTypeDesc');

    function updatePerfLessonFormatUI(ctxEvent) {
      var fmt = ctxEvent ? resolveLessonFormat(ctxEvent) : null;
      var show = !!fmt;
      if (perfLessonType) {
        perfLessonType.hidden = !show;
        if (show) {
          perfLessonType.textContent = lessonFormatShortLabel(fmt);
          perfLessonType.className = 'd3-drawer-lesson-type is-' + fmt;
        }
      }
      if (perfLessonTypeDesc) {
        perfLessonTypeDesc.hidden = !show;
        if (show) {
          perfLessonTypeDesc.textContent = lessonFormatDesc(fmt);
          perfLessonTypeDesc.className = 'd3-drawer-format-hint is-' + fmt;
        }
      }
    }

    function getPerfLesson(id) {
      for (var i = 0; i < PV_ABS_LESSONS.length; i++) {
        if (PV_ABS_LESSONS[i].id === id) return PV_ABS_LESSONS[i];
      }
      return null;
    }
    function participationCount(l) { return (l.handRaises || 0) + (l.boardRaises || 0); }

    function correctDesc(l, attended) {
      if (!attended) return 'Öğrenciniz bu derse katılmadığı için soru çözüm verisi kaydedilmemiştir.';
      var pct = l.total ? Math.round((l.correct / l.total) * 100) : 0;
      if (pct >= 80) return 'Öğrenciniz ders içi sorularda yüksek başarı göstererek konuyu büyük ölçüde kavramıştır.';
      if (pct >= 60) return 'Öğrenciniz ders içi soruların çoğunu doğru yanıtlamıştır; birkaç noktada tekrar faydalı olur.';
      return 'Öğrenciniz ders içi sorularda zorlanmış görünüyor; konunun tekrar edilmesini öneririz.';
    }
    function xpDesc(l, attended) {
      if (!attended) return 'Öğrenciniz bu derse katılmadığı için XP kazanmamıştır.';
      if (l.xp >= 35) return 'Öğrenciniz bu derste yüksek katılım ve başarı ile dikkat çekici miktarda XP kazanmıştır.';
      if (l.xp > 0) return 'Öğrenciniz bu derste ' + l.xp + ' XP kazanmıştır.';
      return 'Bu derste XP kaydı bulunmuyor.';
    }
    function handsDesc(l, attended) {
      if (!attended) return 'Öğrenciniz bu derse katılmadığı için parmak kaldırma verisi kaydedilmemiştir.';
      var h = l.handRaises || 0;
      if (h >= 3) return 'Öğrenciniz derse aktif katılarak ' + h + ' kez söz almak için parmak kaldırmıştır.';
      if (h > 0) return 'Öğrenciniz bu derste ' + h + ' kez parmak kaldırmıştır.';
      return 'Öğrenciniz bu derste parmak kaldırmamıştır; katılımı artırması için teşvik edebilirsiniz.';
    }
    function boardDesc(l, attended) {
      if (!attended) return 'Öğrenciniz bu derse katılmadığı için tahtaya kalkma verisi kaydedilmemiştir.';
      var b = l.boardRaises || 0;
      if (b > 0) return 'Öğrenciniz bu derste ' + b + ' kez tahtaya kalkarak soru çözmüştür.';
      return 'Öğrenciniz bu derste tahtaya kalkmamıştır.';
    }
    function participationDesc(l, attended) {
      var total = participationCount(l);
      if (!attended) return 'Öğrenciniz bu derse katılmadığı için derse katılma verisi kaydedilmemiştir.';
      if (total === 0) return 'Öğrenciniz bu derste parmak kaldırma veya tahtaya kalkma yoluyla aktif katılım göstermemiştir.';
      var h = l.handRaises || 0, b = l.boardRaises || 0;
      if (h > 0 && b > 0) return 'Öğrenciniz bu derste toplam ' + total + ' kez derse katılmıştır (' + h + ' parmak kaldırma + ' + b + ' tahtaya kalkma).';
      if (h > 0) return 'Öğrenciniz bu derste toplam ' + total + ' kez derse katılmıştır (' + h + ' parmak kaldırma).';
      return 'Öğrenciniz bu derste toplam ' + total + ' kez derse katılmıştır (' + b + ' tahtaya kalkma).';
    }
    function durationDesc(l, attended) {
      var m = l.durationMin || 0;
      if (!attended) return 'Öğrenciniz bu derse katılmadığı için derste geçirilen süre kaydedilmemiştir.';
      if (m === 0) return 'Öğrenciniz bu derse kısa süreli katılmış; süre verisi henüz işlenmemiş olabilir.';
      return 'Öğrenciniz bu derste toplam ' + m + ' dakika aktif olarak kalmıştır.';
    }

    function setMuted(row, muted) {
      if (!row) return;
      row.classList.toggle('is-muted', !!muted);
    }

    function openPerfDrawer(lessonId, ctxEvent) {
      var l = getPerfLesson(lessonId);
      if (!l) return;
      var attended = l.status === 'attended';

      if (perfIco) perfIco.textContent = SUBJECT_ICONS[l.subject] || '📐';
      if (perfEyebrow) perfEyebrow.textContent = (SUBJECT_NAMES[l.subject] || l.name).toUpperCase() + ' · CANLI DERS';
      if (perfTitle) perfTitle.textContent = l.topic;
      updatePerfLessonFormatUI(ctxEvent);

      if (ctxEvent) {
        var dt = eventDateTime(ctxEvent);
        if (perfDate) perfDate.textContent = DAY_NAMES[(dt.getDay() + 6) % 7] + ', ' + dt.getDate() + ' ' + MONTH_NAMES[dt.getMonth()];
        if (perfTime) perfTime.textContent = ctxEvent.start + ' – ' + computeEndTime(ctxEvent.start, ctxEvent.dur);
      } else {
        if (perfDate) perfDate.textContent = '—';
        if (perfTime) perfTime.textContent = '';
      }

      if (perfStatus) {
        perfStatus.textContent = attended ? 'Katıldı' : 'Katılmadı';
        perfStatus.className = 'pv-prog-drawer-status is-' + (attended ? 'attended' : 'absent');
      }

      if (perfReplayAlert) {
        perfReplayAlert.hidden = attended;
        if (!attended && perfReplayText) {
          perfReplayText.innerHTML = 'Öğrenciniz <strong>' + (SUBJECT_NAMES[l.subject] || l.name) + ' — ' + l.topic + '</strong> canlı dersine katılamamıştır. Konu eksiği oluşmaması için <strong>Canlı Ders Tekrarları</strong> bölümünden bu dersin kaydını izlemesini öneririz.';
        }
      }

      if (perfCorrect) perfCorrect.innerHTML = attended ? (l.correct + ' <sub>/ ' + l.total + '</sub>') : '— <sub>/ ' + l.total + '</sub>';
      if (perfXp) perfXp.innerHTML = attended ? (l.xp + ' <sub>XP</sub>') : '0 <sub>XP</sub>';
      if (perfHands) perfHands.textContent = attended ? (l.handRaises || 0) : '—';
      if (perfBoard) perfBoard.textContent = attended ? (l.boardRaises || 0) : '—';
      if (perfParticipation) perfParticipation.textContent = attended ? participationCount(l) : '—';
      if (perfDuration) perfDuration.textContent = attended ? (l.durationMin + ' dk') : '—';

      if (perfCorrectDesc) perfCorrectDesc.textContent = correctDesc(l, attended);
      if (perfXpDesc) perfXpDesc.textContent = xpDesc(l, attended);
      if (perfHandsDesc) perfHandsDesc.textContent = handsDesc(l, attended);
      if (perfBoardDesc) perfBoardDesc.textContent = boardDesc(l, attended);
      if (perfParticipationDesc) perfParticipationDesc.textContent = participationDesc(l, attended);
      if (perfDurationDesc) perfDurationDesc.textContent = durationDesc(l, attended);

      setMuted(perfRowCorrect, !attended);
      setMuted(perfRowXp, !attended);
      setMuted(perfRowHands, !attended);
      setMuted(perfRowBoard, !attended);
      setMuted(perfRowParticipation, !attended);
      setMuted(perfRowDuration, !attended);

      if (perfNote) perfNote.textContent = attended
        ? 'Öğrencinizin bu canlı dersteki performans detaylarını yukarıda inceleyebilirsiniz.'
        : 'Öğrenciniz bu derse katılmadığı için performans verisi oluşmamıştır. Tekrar videosunu izlemesini öneririz.';

      perfDrawer.setAttribute('data-subject', l.subject || 'mat');
      perfDrawer.classList.add('is-open');
      perfDrawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closePerfDrawer() {
      perfDrawer.classList.remove('is-open');
      perfDrawer.setAttribute('aria-hidden', 'true');
      // Ders detay drawer'ı hâlâ açıksa body scroll kilidi sürsün
      if (!drawerEl.classList.contains('is-open')) document.body.style.overflow = '';
    }

    if (drawerPerfBtn) {
      drawerPerfBtn.addEventListener('click', function () {
        var lessonId = drawerPerfBtn.getAttribute('data-perf-lesson');
        if (!lessonId) return;
        openPerfDrawer(lessonId, currentEvent);
      });
    }
    if (perfBackBtn) perfBackBtn.addEventListener('click', closePerfDrawer);
    document.querySelectorAll('[data-perf-drawer-close]').forEach(function (el) {
      el.addEventListener('click', closePerfDrawer);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && perfDrawer.classList.contains('is-open')) closePerfDrawer();
    });
  }
})(typeof window !== 'undefined' ? window : this);
