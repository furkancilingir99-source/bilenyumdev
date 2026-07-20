/**
 * Soru Yazarı Dashboard — mevcut deneme dersi paneli temasını (hud/sidebar/switcher/kart/
 * tablo/filtre/modal/buton/form) yeniden kullanır. Yeni tasarım dili YOK; tema genişletildi.
 * Tek sayfa + istemci-taraflı bölüm geçişi. Mock veri sessionStorage'da tutulur.
 */
(function (global) {
  'use strict';

  var U = global.TMUtils;
  var Confirm = global.TMConfirmDialog;
  var Toast = global.TMToast;
  function esc(s) { return U && U.escapeHtml ? U.escapeHtml(String(s == null ? '' : s)) : String(s == null ? '' : s); }
  function toast(msg, tone) { if (Toast && Toast.show) Toast.show(msg, tone || 'success'); }

  /* ----------------------------- İkonlar ----------------------------- */
  var SW_ICON = {
    website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    veli: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    student: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg>',
    teacher: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    trial: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    author: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>'
  };
  var NAV_ICON = {
    pool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/></svg>',
    placement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    monthly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    attention_initial: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',
    attention_quarterly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    weekly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  };
  var DRAG_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var DEL_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var IMG_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';

  /* ----------------------------- Referans veri ----------------------------- */
  var SUBJECTS = [
    { id: 'mathematics', name: 'Matematik', section: 'numeric' },
    { id: 'science', name: 'Fen Bilimleri', section: 'numeric' },
    { id: 'turkish', name: 'Türkçe', section: 'verbal' },
    { id: 'social', name: 'Sosyal Bilgiler', section: 'verbal' },
    { id: 'religion', name: 'Din Kültürü ve Ahlak Bilgisi', section: 'verbal' },
    { id: 'english', name: 'İngilizce', section: 'verbal' }
  ];
  var SUBJ = {}; SUBJECTS.forEach(function (s) { SUBJ[s.id] = s; });
  var SECTION_LABEL = { numeric: 'Sayısal', verbal: 'Sözel' };
  // Ders başına ayırt edici renk + dersi çağrıştıran ikon.
  var SUBJECT_STYLE = {
    mathematics: { color: '#2563eb', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="9" y2="11"/><line x1="12" y1="11" x2="13" y2="11"/><line x1="15.5" y1="11" x2="16.5" y2="11"/><line x1="8" y1="15" x2="9" y2="15"/><line x1="12" y1="15" x2="13" y2="15"/><line x1="15.5" y1="14" x2="16.5" y2="17"/><line x1="16.5" y1="14" x2="15.5" y2="17"/></svg>' },
    science: { color: '#059669', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)"/></svg>' },
    turkish: { color: '#db2777', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2H2z"/><path d="M22 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2H22z"/></svg>' },
    social: { color: '#d97706', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>' },
    religion: { color: '#0d9488', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21a9 9 0 1 1 0-18 7 7 0 1 0 0 18z"/><path d="M18.5 8.5l.7 1.9 2 .1-1.6 1.3.6 2-1.7-1.2-1.7 1.2.6-2-1.6-1.3 2-.1z"/></svg>' },
    english: { color: '#7c3aed', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>' }
  };
  function subjectStyle(id) { return SUBJECT_STYLE[id] || { color: '#7a769e', icon: '' }; }
  var GRADES = ['5', '6', '7', '8'];
  function gradeLabel(g) { return g + '. Sınıf'; }
  var MONTHS = [
    { id: 'january', name: 'Ocak' }, { id: 'february', name: 'Şubat' }, { id: 'march', name: 'Mart' },
    { id: 'april', name: 'Nisan' }, { id: 'may', name: 'Mayıs' }, { id: 'june', name: 'Haziran' },
    { id: 'july', name: 'Temmuz' }, { id: 'august', name: 'Ağustos' }, { id: 'september', name: 'Eylül' },
    { id: 'october', name: 'Ekim' }, { id: 'november', name: 'Kasım' }, { id: 'december', name: 'Aralık' }
  ];
  var MONTH = {}; MONTHS.forEach(function (m) { MONTH[m.id] = m.name; });
  var WEEKS = []; for (var w = 1; w <= 32; w++) WEEKS.push(w);
  var LESSON_MODES = [{ id: 'KID', name: 'KİD — Kavram İnşa Dersi' }, { id: 'RUD', name: 'RUD — Rehberli Uygulama Dersi' }];
  var LMODE = { KID: 'KİD', RUD: 'RUD' };
  var QUARTERS = [
    { id: 'q1', name: '1. Dönem · Ocak–Mart' }, { id: 'q2', name: '2. Dönem · Nisan–Haziran' },
    { id: 'q3', name: '3. Dönem · Temmuz–Eylül' }, { id: 'q4', name: '4. Dönem · Ekim–Aralık' }
  ];
  var QUARTER = {}; QUARTERS.forEach(function (q) { QUARTER[q.id] = q.name; });
  var QTYPE_LABEL = { multiple_choice: '4 Seçenekli', text_answer: 'Sözel Cevap', number_answer: 'Sayısal Cevap', multi_select_attention: 'Çoklu Seçim' };
  var ATTENTION_TASKS = [
    { id: 'find_target_letters', name: 'Harf bulma' }, { id: 'find_target_shapes', name: 'Şekil bulma' },
    { id: 'find_target_numbers', name: 'Sayı bulma' }, { id: 'find_target_colors', name: 'Renk bulma' }
  ];
  var ATASK = {}; ATTENTION_TASKS.forEach(function (a) { ATASK[a.id] = a.name; });
  // Burdon sabitleri seed sırasında da gerekli → dosyanın başında tanımlı.
  var BURDON_LETTERS = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'K', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z'];
  var BURDON_INSTRUCTION = 'Sayfadaki harfler arasında yalnızca A ve B harflerini mümkün olduğunca hızlı ve doğru şekilde işaretlemenizi istiyorum. Süre başladığında çalışmaya başlayabilirsiniz.';
  // Örnek konu/alt konu (soru yazarına açılır menü doldurmak için).
  var TOPICS = {
    mathematics: { 'Üslü İfadeler': ['Üslü İfadelerde Toplama ve Çıkarma', 'Üslü İfadelerde Çarpma ve Bölme'], 'Kareköklü İfadeler': ['Kareköklü İfadelerde Çarpma ve Bölme', 'Kareköklü İfadelerde Toplama ve Çıkarma'], 'Çarpanlar ve Katlar': ['EBOB - EKOK', 'Asal Çarpanlar'] },
    science: { 'Basınç': ['Katı Basıncı', 'Sıvı Basıncı'], 'DNA ve Genetik Kod': ['Kalıtım', 'Mutasyon'], 'Madde ve Endüstri': ['Periyodik Sistem', 'Fiziksel ve Kimyasal Değişim'] },
    turkish: { 'Fiilimsiler': ['İsim-Fiil', 'Sıfat-Fiil', 'Zarf-Fiil'], 'Cümlenin Ögeleri': ['Özne ve Yüklem', 'Nesne ve Tümleç'], 'Sözcükte Anlam': ['Gerçek ve Mecaz Anlam', 'Eş ve Zıt Anlam'] },
    social: { 'Bir Kahraman Doğuyor': ['Mustafa Kemal’in Hayatı', 'Fikir Akımları'], 'Milli Uyanış': ['Cepheler', 'Kongreler'] },
    religion: { 'Kader İnancı': ['İnsan İradesi', 'Tevekkül'], 'Zekat ve Sadaka': ['Paylaşma', 'İbadetler'] },
    english: { 'Friendship': ['Making Friends', 'Feelings'], 'Tourism': ['Places', 'Directions'] }
  };
  // Resmî MEB müfredatı — Konu (ünite) → Alt Konu (kazanım) eşlemesi.
  // Sınıf + ders bazında; bulunmayan sınıf/ders için örnek TOPICS'e düşer.
  var CURRICULUM = {
    '8': {
      mathematics: {
        'Çarpanlar ve Katlar': [
          'Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur, çarpanları üslü ifadelerin çarpımı şeklinde yazar.',
          'İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar, ilgili problemleri çözer.',
          'Verilen iki doğal sayının aralarında asal olup olmadığını belirler.'
        ],
        'Üslü İfadeler': [
          'Tam sayıların, tam sayı kuvvetlerini hesaplar.',
          'Üslü ifadelerle ilgili temel kuralları anlar, birbirine denk ifadeler oluşturur.',
          'Sayıların ondalık gösterimlerini 10’un tam sayı kuvvetlerini kullanarak çözümler.',
          'Verilen bir sayıyı 10’un farklı tam sayı kuvvetlerini kullanarak ifade eder.',
          'Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır.'
        ],
        'Kareköklü İfadeler': [
          'Tam kare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler.',
          'Tam kare olmayan kareköklü bir sayının hangi iki doğal sayı arasında olduğunu belirler.',
          'Kareköklü bir ifadeyi a√b şeklinde yazar ve katsayıyı kök içine alır.',
          'Kareköklü ifadelerde çarpma ve bölme işlemlerini yapar.',
          'Kareköklü ifadelerde toplama ve çıkarma işlemlerini yapar.',
          'Kareköklü bir ifade ile çarpıldığında, sonucu bir doğal sayı yapan çarpanlara örnek verir.',
          'Ondalık ifadelerin kareköklerini belirler.',
          'Gerçek sayıları tanır, rasyonel ve irrasyonel sayılarla ilişkilendirir.'
        ],
        'Cebirsel İfadeler ve Özdeşlikler': [
          'Basit cebirsel ifadeleri anlar ve farklı biçimlerde yazar.',
          'Cebirsel ifadelerin çarpımını yapar.',
          'Özdeşlikleri modellerle açıklar.',
          'Cebirsel ifadeleri çarpanlara ayırır.'
        ],
        'Doğrusal Denklemler': [
          'Birinci dereceden bir bilinmeyenli denklemleri çözer.',
          'Koordinat sistemini özellikleriyle tanır ve sıralı ikilileri gösterir.',
          'Doğrusal ilişkili iki değişkenden birinin diğerine bağlı değişimini tablo ve denklem ile ifade eder.',
          'Doğrusal denklemlerin grafiğini çizer.',
          'Doğrusal ilişki içeren gerçek hayat durumlarına ait denklem, tablo ve grafiği oluşturur ve yorumlar.',
          'Doğrunun eğimini modellerle açıklar, doğrusal denklemleri ve grafiklerini eğimle ilişkilendirir.'
        ],
        'Eşitsizlikler': [
          'Birinci dereceden bir bilinmeyenli eşitsizlik içeren günlük hayat durumlarına uygun matematik cümleleri yazar.',
          'Birinci dereceden bir bilinmeyenli eşitsizlikleri sayı doğrusunda gösterir.',
          'Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer.'
        ],
        'Üçgenler': [
          'Üçgende kenarortay, açıortay ve yüksekliği inşa eder.',
          'Üçgenin iki kenar uzunluğunun toplamı veya farkı ile üçüncü kenarının uzunluğunu ilişkilendirir.',
          'Üçgenin kenar uzunlukları ile bu kenarların karşısındaki açıların ölçülerini ilişkilendirir.',
          'Yeterli sayıda elemanının ölçüleri verilen bir üçgeni çizer.',
          'Pisagor bağıntısını oluşturur, ilgili problemleri çözer.'
        ],
        'Dönüşüm Geometrisi': [
          'Nokta, doğru parçası ve diğer şekillerin öteleme sonucundaki görüntülerini çizer.',
          'Nokta, doğru parçası ve diğer şekillerin yansıma sonucu oluşan görüntüsünü oluşturur.',
          'Çokgenlerin öteleme ve yansımalar sonucunda ortaya çıkan görüntüsünü oluşturur.'
        ],
        'Eşlik ve Benzerlik': [
          'Eşlik ve benzerliği ilişkilendirir, eş ve benzer şekillerin kenar ve açı ilişkilerini belirler.',
          'Benzer çokgenlerin benzerlik oranını belirler, bir çokgene eş ve benzer çokgenler oluşturur.'
        ],
        'Geometrik Cisimler': [
          'Dik prizmaları tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer.',
          'Dik dairesel silindirin temel elemanlarını belirler, inşa eder ve açınımını çizer.',
          'Dik dairesel silindirin yüzey alanı bağıntısını oluşturur, ilgili problemleri çözer.',
          'Dik dairesel silindirin hacim bağıntısını oluşturur, ilgili problemleri çözer.',
          'Dik piramidi tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer.',
          'Dik koniyi tanır, temel elemanlarını belirler, inşa eder ve açınımını çizer.'
        ],
        'Veri Analizi': [
          'En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar.',
          'Verileri sütun, daire veya çizgi grafiği ile gösterir ve gösterimler arası uygun dönüşümleri yapar.'
        ],
        'Basit Olayların Olma Olasılığı': [
          'Bir olaya ait olası durumları belirler.',
          '“Daha fazla”, “eşit”, “daha az” olasılıklı olayları ayırt eder, örnek verir.',
          'Eşit şanslı olaylarda her bir çıktının olasılık değerinin eşit ve 1/n olduğunu açıklar.',
          'Olasılık değerinin 0 ile 1 arasında (0 ve 1 dâhil) olduğunu anlar.',
          'Basit bir olayın olma olasılığını hesaplar.'
        ]
      }
    }
  };
  function curriculumMap(grade, subjectId) {
    return (CURRICULUM[String(grade)] && CURRICULUM[String(grade)][subjectId]) || TOPICS[subjectId] || {};
  }
  function topicsOf(grade, subjectId) { return Object.keys(curriculumMap(grade, subjectId)); }
  function subtopicsOf(grade, subjectId, topic) { return curriculumMap(grade, subjectId)[topic] || []; }

  /* ----------------------------- Bölüm tanımları ----------------------------- */
  var SECTIONS = {
    // Soru Havuzu — içerik bölümü değil, ortak soru deposu (sol menüde en üstte).
    pool: {
      label: 'Soru Havuzu',
      desc: 'Tüm materyallerde kullanılabilen ortak soru deposu. Buradan seçtiğiniz sorular sınavlara eklenebilir.',
      poolFlow: true, page: 'soru-yazari-soru-havuzu.html',
      groups: [{ id: 'academic', label: 'Akademik Sorular' }, { id: 'attention', label: 'Dikkat Soruları' }]
    },
    placement: {
      label: 'Seviye Belirleme Sınavı', contentType: 'placement_exam',
      desc: 'Öğrencinin platforma ilk adımında girdiği, akademik seviyesini ölçen sınav. Ders, sınıf, konu ve soru tipi bazında soruları yönetin.',
      hasSubject: true, hasMonth: false, hasWeek: false, hasQuarter: false, hasXp: false, attention: false,
      // Sınıf → sınav kartları → ders kartları → sorular akışı
      examFlow: true, examLabel: 'Seviye Belirleme Sınavı',
      page: 'soru-yazari-dashboard.html'
    },
    monthly: {
      label: 'Aylık Deneme Sınavı', contentType: 'monthly_trial_exam',
      desc: 'Eğitim süreci boyunca her ay uygulanan deneme sınavı. Sınıf, sınav, ders ve ay bazında soruları yönetin.',
      hasSubject: true, hasMonth: true, hasWeek: false, hasQuarter: false, hasXp: false, attention: false,
      examFlow: true, examLabel: 'Aylık Deneme Sınavı',
      page: 'soru-yazari-aylik-deneme.html'
    },
    attention_initial: {
      label: 'Dikkat Testi — İlk Giriş', contentType: 'attention_initial',
      desc: 'Platforma ilk girişte uygulanan dikkat ölçüm testi. Çoklu seçim ve süre limiti destekler.',
      hasSubject: false, hasMonth: false, hasWeek: false, hasQuarter: false, hasXp: false, attention: true,
      attentionFlow: true, page: 'soru-yazari-dikkat-ilk-giris.html'
    },
    attention_quarterly: {
      label: 'Dikkat Testi — 3 Aylık', contentType: 'attention_quarterly',
      desc: 'Dikkat gelişimini izlemek için 3 ayda bir yayınlanan dikkat testi. Dönem bazında yönetilir.',
      hasSubject: false, hasMonth: false, hasWeek: false, hasQuarter: true, hasXp: false, attention: true,
      attentionFlow: true, page: 'soru-yazari-dikkat-3-aylik.html'
    },
    weekly: {
      label: 'Haftalık Ödevler', contentType: 'weekly_homework',
      desc: 'Ders sürecinde haftalık tamamlanacak ödev soruları. Ders, sınıf, hafta ve KİD/RUD ders tipi bazında yönetin.',
      hasSubject: true, hasMonth: false, hasWeek: true, hasQuarter: false, hasXp: true, attention: false,
      weeklyFlow: true, page: 'soru-yazari-haftalik-odevler.html'
    }
  };
  var NAV_ORDER = ['pool', 'placement', 'monthly', 'weekly', 'attention_initial', 'attention_quarterly'];

  /* ----------------------------- Mock store ----------------------------- */
  var SKEY = 'bilenyum_soru_yazari_v18';
  var AUTHOR_NAME = 'Soru Yazarı'; // oturumdaki içerik yazarı (yeni sorular ona atanır)
  var SEED_AUTHORS = ['Onur Demirli', 'Elif Kaya', 'Mert Yılmaz', 'Zeynep Ak', 'Burak Şen'];
  function nowSeq(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 8); }
  function loadDb() { try { var raw = sessionStorage.getItem(SKEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function saveDb() { try { sessionStorage.setItem(SKEY, JSON.stringify(db)); } catch (e) {} }

  function seedDb() {
    /* =====================================================================
       Tek doğruluk kaynağı: önce SORU HAVUZU kurulur, materyal (sınav/ödev)
       soruları havuzdan KLONLANARAK üretilir. Böylece soru metni, cevabı,
       puanı, ekleyen kişisi ve konusu her ekranda birebir aynı olur.
       Havuz her (sınıf × ders) kombinasyonu için soru içerir; böylece
       "Soru seç" ekranı hiçbir sınav/ders için boş kalmaz.
       ===================================================================== */
    var pool = [];
    var P = {};
    var pid = 0;
    function mc(texts, correctIdx) {
      return ['A', 'B', 'C', 'D'].map(function (id, i) { return { id: id, text: texts[i], isCorrect: i === correctIdx }; });
    }
    /* ---- Akademik havuz: her (sınıf × ders) için POOL_PER_COMBO soru ----
       Konu/alt konu daima o sınıf+dersin geçerli müfredatından seçilir. */
    var POOL_PER_COMBO = 18;
    function topicPair(grade, subject, i) {
      var map = (CURRICULUM[grade] && CURRICULUM[grade][subject]) || TOPICS[subject] || {};
      var keys = Object.keys(map);
      if (!keys.length) return ['', ''];
      var t = keys[i % keys.length];
      var subs = map[t] || [];
      return [t, subs.length ? subs[i % subs.length] : ''];
    }
    function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
    function lcm(a, b) { return a * b / gcd(a, b); }
    // Sayısal cevaptan 4 şıklı soru üretir: doğru cevap + inandırıcı çeldiriciler.
    function numChoices(correct, alts, pos) {
      var opts = [correct];
      alts.forEach(function (v) { if (opts.length < 4 && v > 0 && opts.indexOf(v) < 0) opts.push(v); });
      var extra = correct + 1;
      while (opts.length < 4) { if (opts.indexOf(extra) < 0) opts.push(extra); extra++; }
      var rest = opts.slice(1), arr = [], ri = 0, idx = pos % 4;
      for (var i = 0; i < 4; i++) arr.push(String(i === idx ? correct : rest[ri++]));
      return { opts: arr, ans: idx };
    }
    // Matematik: yarısı 4 seçenekli, yarısı sayısal cevaplı; cevaplar hesaplanır.
    function mathItems(grade) {
      var g = Number(grade), out = [];
      for (var i = 0; i < POOL_PER_COMBO; i++) {
        var a = 6 + ((i * 3 + g) % 18), b = 4 + ((i * 5 + g * 2) % 16), k = i % 6;
        var text, ans, alts;
        if (k === 0) { text = a + ' ve ' + b + ' sayılarının EBOB’u kaçtır?'; ans = gcd(a, b); alts = [ans * 2, a, b]; }
        else if (k === 1) { text = a + ' ve ' + b + ' sayılarının EKOK’u kaçtır?'; ans = lcm(a, b); alts = [a * b, ans / 2, a + b]; }
        else if (k === 2) { text = '(' + a + ' + ' + b + ') · 2 işleminin sonucu kaçtır?'; ans = (a + b) * 2; alts = [a + b, a * b, ans + 2]; }
        else if (k === 3) { text = 'Bir kenarı ' + a + ' cm olan karenin alanı kaç cm²dir?'; ans = a * a; alts = [a * 4, a * 2, ans + a]; }
        else if (k === 4) { text = a + 'x - ' + (a * 3) + ' = 0 denkleminin çözümü kaçtır?'; ans = 3; alts = [a, a * 3, 1]; }
        else { text = 'Kenar uzunlukları ' + a + ' cm ve ' + b + ' cm olan dikdörtgenin çevresi kaç cm’dir?'; ans = 2 * (a + b); alts = [a * b, a + b, ans + 4]; }
        if (i % 2 === 0) {
          var ch = numChoices(ans, alts, i + g);
          out.push({ text: text, type: 'mc', opts: ch.opts, ans: ch.ans });
        } else {
          out.push({ text: text, type: 'num', ans: ans });
        }
      }
      return out;
    }
    // Diğer dersler: çoktan seçmeli/sözel soru bankaları
    var BANK = {
      science: [
        ['Kâğıdın yırtılması hangi tür değişimdir?', ['Fiziksel değişim', 'Kimyasal değişim', 'Isısal değişim', 'Biyolojik değişim'], 0],
        ['Demirin paslanması hangi tür değişimdir?', ['Kimyasal değişim', 'Fiziksel değişim', 'Hâl değişimi', 'Isısal değişim'], 0],
        ['Periyodik tabloda dönem sayısı kaçtır?', ['7', '8', '18', '5'], 0],
        ['Kalıtsal özellikleri taşıyan yapı hangisidir?', ['DNA', 'Ribozom', 'Koful', 'Lizozom'], 0],
        ['Sıvı basıncı aşağıdakilerden hangisine bağlı değildir?', ['Kabın şekli', 'Sıvının yüksekliği', 'Sıvının yoğunluğu', 'Yer çekimi'], 0],
        ['Basıncın SI birimi hangisidir?', ['Pascal', 'Newton', 'Joule', 'Watt'], 0],
        ['Yüzey alanı artarsa katı basıncı nasıl değişir?', ['Azalır', 'Artar', 'Değişmez', 'İkiye katlanır'], 0],
        ['Soy gazlar periyodik tabloda hangi gruptadır?', ['8A', '1A', '2A', '7A'], 0],
        ['DNA’nın yapı birimi nedir?', ['Nükleotit', 'Aminoasit', 'Glikoz', 'Yağ asidi'], 0],
        ['Mutasyona neden olabilen etken hangisidir?', ['Radyasyon', 'Su içmek', 'Uyumak', 'Yürümek'], 0],
        ['Saf maddeyi karışımdan ayıran özellik nedir?', ['Belirli erime noktası', 'Renksiz olması', 'Katı olması', 'Ağır olması'], 0],
        ['Asit ve bazın tepkimesine ne ad verilir?', ['Nötrleşme', 'Erime', 'Süblimleşme', 'Yoğuşma'], 0],
        ['Derine inildikçe sıvı basıncı nasıl değişir?', ['Artar', 'Azalır', 'Değişmez', 'Sıfırlanır'], 0],
        ['Kar ayakkabısı basıncı nasıl etkiler?', ['Azaltır', 'Artırır', 'Değiştirmez', 'İkiye katlar'], 0],
        ['Hücrenin enerji üretim merkezi hangisidir?', ['Mitokondri', 'Çekirdek', 'Koful', 'Zar'], 0],
        ['Işığın saydam ortamda yön değiştirmesine ne denir?', ['Kırılma', 'Yansıma', 'Soğurulma', 'Dağılma'], 0],
        ['Maddenin ısı alarak sıvıdan gaza geçmesi nedir?', ['Buharlaşma', 'Yoğuşma', 'Donma', 'Erime'], 0],
        ['Besin zincirinin ilk halkası hangisidir?', ['Üreticiler', 'Tüketiciler', 'Ayrıştırıcılar', 'Etçiller'], 0]
      ],
      turkish: [
        ['“Cömert” sözcüğünün zıt anlamlısı hangisidir?', ['Cimri', 'Eli açık', 'Yardımsever', 'İyi'], 0],
        ['“Sevinç” sözcüğünün eş anlamlısı hangisidir?', ['Mutluluk', 'Üzüntü', 'Öfke', 'Korku'], 0],
        ['“Tatlı dil yılanı deliğinden çıkarır.” cümlesindeki “tatlı” hangi anlamdadır?', ['Mecaz anlam', 'Gerçek anlam', 'Terim anlam', 'Eş sesli'], 0],
        ['“Soğuk hava” tamlamasındaki “soğuk” hangi anlamdadır?', ['Gerçek anlam', 'Mecaz anlam', 'Terim anlam', 'Eş sesli'], 0],
        ['“Ali kitabı okudu.” cümlesinin öznesi hangisidir?', ['Ali', 'Kitabı', 'Okudu', 'Yok'], 0],
        ['“Kardeşim eve gitti.” cümlesinde “eve” hangi ögedir?', ['Dolaylı tümleç', 'Özne', 'Nesne', 'Yüklem'], 0],
        ['“Annem bize börek yaptı.” cümlesinde “börek” hangi ögedir?', ['Belirtisiz nesne', 'Özne', 'Zarf tümleci', 'Yüklem'], 0],
        ['“Yüzmek en iyi spordur.” cümlesindeki isim-fiil hangisidir?', ['Yüzmek', 'İyi', 'Spor', 'En'], 0],
        ['“Akan sular durulur.” cümlesindeki sıfat-fiil hangisidir?', ['Akan', 'Sular', 'Durulur', 'Yok'], 0],
        ['“Gülerek içeri girdi.” cümlesindeki zarf-fiil hangisidir?', ['Gülerek', 'İçeri', 'Girdi', 'Yok'], 0],
        ['“Eve gelince ödevini yaptı.” cümlesindeki zarf-fiil hangisidir?', ['Gelince', 'Eve', 'Ödevini', 'Yaptı'], 0],
        ['“Tutumlu” sözcüğünün zıt anlamlısı hangisidir?', ['Savurgan', 'Cimri', 'Cömert', 'Dikkatli'], 0],
        ['“Ağır bir söz söyledi.” cümlesindeki “ağır” hangi anlamdadır?', ['Mecaz anlam', 'Gerçek anlam', 'Terim anlam', 'Eş sesli'], 0],
        ['“Öğrenciler bahçede oynuyor.” cümlesinin yüklemi hangisidir?', ['Oynuyor', 'Öğrenciler', 'Bahçede', 'Yok'], 0],
        ['“Yağmur sabaha kadar yağdı.” cümlesinin öznesi hangisidir?', ['Yağmur', 'Sabaha', 'Kadar', 'Yağdı'], 0],
        ['Cümlede yargı bildiren öge hangisidir?', ['Yüklem', 'Özne', 'Nesne', 'Tümleç'], 0],
        ['“Kitap okumayı severim.” cümlesindeki isim-fiil hangisidir?', ['Okumayı', 'Kitap', 'Severim', 'Yok'], 0],
        ['Eş sesli sözcük hangisinde vardır?', ['Yüz', 'Masa', 'Kalem', 'Defter'], 0]
      ],
      social: [
        ['Mustafa Kemal hangi şehirde doğmuştur?', ['Selanik', 'Manastır', 'İstanbul', 'Sofya'], 0],
        ['Mustafa Kemal’e “Kemal” adını kim vermiştir?', ['Matematik öğretmeni', 'Babası', 'Annesi', 'Komutanı'], 0],
        ['Erzurum Kongresi hangi yılda toplanmıştır?', ['1919', '1920', '1921', '1918'], 0],
        ['Sivas Kongresi hangi yılda toplanmıştır?', ['1919', '1920', '1922', '1923'], 0],
        ['Cumhuriyet hangi yıl ilan edilmiştir?', ['1923', '1920', '1919', '1924'], 0],
        ['Kurtuluş Savaşı’nda Batı Cephesi komutanı kimdir?', ['İsmet İnönü', 'Kâzım Karabekir', 'Fevzi Çakmak', 'Ali Fuat Cebesoy'], 0],
        ['Doğu Cephesi komutanı kimdir?', ['Kâzım Karabekir', 'İsmet İnönü', 'Refet Bele', 'Fevzi Çakmak'], 0],
        ['Misakımillî hangi mecliste kabul edilmiştir?', ['Son Osmanlı Mebusan Meclisi', 'TBMM', 'Danıştay', 'Divanıhümayun'], 0],
        ['Osmanlı’yı kurtarmaya yönelik fikir akımlarından biri hangisidir?', ['Osmanlıcılık', 'Kapitalizm', 'Feodalizm', 'Merkantilizm'], 0],
        ['Türkçülük akımının savunduğu temel düşünce nedir?', ['Türk milliyetçiliği', 'Din birliği', 'Batılılaşma', 'Ekonomik özgürlük'], 0],
        ['Mustafa Kemal Samsun’a hangi yıl çıkmıştır?', ['1919', '1918', '1920', '1921'], 0],
        ['Kongreler hangi amaçla toplanmıştır?', ['Vatanın kurtuluşunu planlamak', 'Ticaret yapmak', 'Vergi toplamak', 'Okul açmak'], 0],
        ['Bir toplumu bir arada tutan ortak değerlere ne denir?', ['Kültür', 'Ticaret', 'Sanayi', 'Coğrafya'], 0],
        ['TBMM hangi yıl açılmıştır?', ['1920', '1919', '1921', '1923'], 0],
        ['Mustafa Kemal askerlik eğitimini hangi şehirde almıştır?', ['Manastır', 'İzmir', 'Ankara', 'Bursa'], 0],
        ['Batı Cephesi’nde yapılan savaşlardan biri hangisidir?', ['I. İnönü Savaşı', 'Çanakkale Savaşı', 'Preveze Savaşı', 'Malazgirt Savaşı'], 0],
        ['Ülkemizde nüfus sayımı hangi kurum tarafından yapılır?', ['TÜİK', 'MEB', 'TSE', 'TRT'], 0],
        ['Haritada yükseltiyi gösteren renk hangisidir?', ['Kahverengi', 'Mavi', 'Yeşil', 'Sarı'], 0]
      ],
      religion: [
        ['İhtiyaç sahiplerine karşılıksız yapılan yardıma ne denir?', ['Sadaka', 'Zekât', 'Fitre', 'Kurban'], 0],
        ['Zekât kimlere verilir?', ['İhtiyaç sahiplerine', 'Zenginlere', 'Herkese', 'Kimseye'], 0],
        ['İnsanın seçim yapabilme yeteneğine ne ad verilir?', ['İrade', 'Kader', 'Tevekkül', 'Kaza'], 0],
        ['Çalışıp sonucu Allah’a bırakmaya ne denir?', ['Tevekkül', 'Sabır', 'Şükür', 'Dua'], 0],
        ['Zekât oranı genel olarak kaçta kaçtır?', ['1/40', '1/10', '1/4', '1/2'], 0],
        ['Sadakanın en küçük şekli hangisidir?', ['Güler yüz göstermek', 'Altın vermek', 'Ev bağışlamak', 'Araba almak'], 0],
        ['Paylaşmanın toplumdaki en önemli sonucu nedir?', ['Dayanışmanın artması', 'Rekabetin artması', 'Ticaretin azalması', 'Nüfusun artması'], 0],
        ['Tevekkül eden kişi öncelikle ne yapar?', ['Üzerine düşeni yapar', 'Bekler', 'Vazgeçer', 'Başkasına bırakır'], 0],
        ['Kader inancı insanın sorumluluğunu ortadan kaldırır mı?', ['Hayır, irade sahibidir', 'Evet, tamamen', 'Kısmen kaldırır', 'Bilinemez'], 0],
        ['Zekât vermenin amacı hangisidir?', ['Malı temizlemek ve paylaşmak', 'Zengin görünmek', 'Ticaret yapmak', 'Vergi ödemek'], 0],
        ['Zekât hangi durumda farz olur?', ['Belirli bir zenginliğe ulaşınca', 'Her ay', 'Doğunca', 'Okula başlayınca'], 0],
        ['Paylaşma ve yardımlaşmanın ahlaki değeri nedir?', ['Toplumsal dayanışma', 'Bireysel kazanç', 'Rekabet', 'Üstünlük'], 0],
        ['İnsanın yaptığı seçimlerden sorumlu olmasının sebebi nedir?', ['İrade sahibi olması', 'Güçlü olması', 'Zengin olması', 'Yaşlı olması'], 0],
        ['Namaz günde kaç vakittir?', ['5', '3', '4', '6'], 0],
        ['Ramazan ayında tutulan ibadet hangisidir?', ['Oruç', 'Hac', 'Zekât', 'Kurban'], 0],
        ['Yardımlaşmayı ifade eden kavram hangisidir?', ['İnfak', 'İsraf', 'Cimrilik', 'Gösteriş'], 0],
        ['Doğru sözlü olmaya ne denir?', ['Sıdk', 'Yalan', 'Gıybet', 'İftira'], 0],
        ['İyilik yapmayı teşvik eden davranış hangisidir?', ['Hayırseverlik', 'Bencillik', 'Kıskançlık', 'Öfke'], 0]
      ],
      english: [
        ['Choose the correct word: Nice to ___ you.', ['meet', 'met', 'meeting', 'meets'], 0],
        ['Choose the correct word: I am very ___ today.', ['happy', 'happily', 'happiness', 'happier'], 0],
        ['Choose the correct word: We buy bread at the ___.', ['bakery', 'museum', 'library', 'station'], 0],
        ['Choose the correct word: Go ___ and turn left.', ['straight', 'strong', 'street', 'string'], 0],
        ['Choose the correct word: My best ___ is Ali.', ['friend', 'friendly', 'friendship', 'friends'], 0],
        ['Choose the correct word: She feels ___ because she lost her cat.', ['sad', 'sadly', 'sadness', 'sadder'], 0],
        ['Choose the correct word: You can borrow books from the ___.', ['library', 'bakery', 'hospital', 'garage'], 0],
        ['Choose the correct word: I feel ___ when I see my friends.', ['happy', 'table', 'run', 'blue'], 0],
        ['Choose the correct word: Let’s ___ friends!', ['be', 'been', 'being', 'was'], 0],
        ['Choose the correct word: We stayed at a ___ during our holiday.', ['hotel', 'pencil', 'bridge', 'forest'], 0],
        ['Choose the correct word: Turn ___ at the traffic lights.', ['right', 'write', 'rite', 'ride'], 0],
        ['Choose the correct word: I want to visit a ___ to see historical objects.', ['museum', 'bakery', 'pharmacy', 'garage'], 0],
        ['Choose the correct word: The station is ___ the post office.', ['opposite', 'oppose', 'opposition', 'opposing'], 0],
        ['Choose the correct word: He was ___ about the good news.', ['excited', 'exciting', 'excite', 'excitement'], 0],
        ['Choose the correct word: We have been friends ___ 2019.', ['since', 'for', 'from', 'during'], 0],
        ['Choose the correct word: There ___ many people in the park.', ['are', 'is', 'was', 'am'], 0],
        ['Choose the correct word: She ___ to school every day.', ['goes', 'go', 'going', 'gone'], 0],
        ['Choose the correct word: My father is a ___. He cooks food.', ['chef', 'pilot', 'nurse', 'driver'], 0]
      ]
    };
    function pushPool(grade, subject, i, item) {
      pid++;
      var tp = topicPair(grade, subject, i);
      var o = {
        id: 'pool-' + String(pid).padStart(4, '0'),
        poolType: 'academic', inputMode: 'manual', imageUrl: null,
        gradeLevel: grade, subject: subject,
        section: SUBJ[subject] ? SUBJ[subject].section : 'numeric',
        topic: tp[0], subTopic: tp[1], questionText: item.text,
        questionType: item.type === 'num' ? 'number_answer' : 'multiple_choice',
        options: [], correctTextAnswer: null, correctNumberAnswer: null,
        score: item.score || 10, addedBy: SEED_AUTHORS[pid % SEED_AUTHORS.length]
      };
      if (item.type === 'num') o.correctNumberAnswer = item.ans;
      else o.options = mc(item.opts, item.ans);
      var dd = new Date(2026, 0, 8); dd.setDate(dd.getDate() + (pid % 240));
      dd.setHours(9 + (pid % 8), (pid * 13) % 60, 0, 0);
      o.createdAt = dd.toISOString();
      pool.push(o); P[grade + '_' + subject + '_' + (i + 1)] = o;
    }
    GRADES.forEach(function (grade) {
      SUBJECTS.forEach(function (sub) {
        if (sub.id === 'mathematics') {
          mathItems(grade).forEach(function (it, i) { pushPool(grade, 'mathematics', i, it); });
        } else {
          var bank = BANK[sub.id] || [];
          for (var i = 0; i < POOL_PER_COMBO; i++) {
            var b = bank[(i + Number(grade)) % bank.length];
            pushPool(grade, sub.id, i, { text: b[0], type: 'mc', opts: b[1], ans: b[2] });
          }
        }
      });
    });

    /* ---------------- Görselli ve vektörel sorular ----------------
       Görseller inline SVG data-URI'dir: dış istek yok, her ortamda görünür. */
    function svgUri(svg) { return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); }
    var FIG = {
      triangle: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="280" height="190" viewBox="0 0 280 190"><rect width="280" height="190" fill="#ffffff"/><polygon points="50,155 215,155 50,45" fill="#eef2ff" stroke="#3730a3" stroke-width="3"/><rect x="50" y="137" width="18" height="18" fill="none" stroke="#3730a3" stroke-width="2"/><text x="125" y="177" font-family="sans-serif" font-size="15" fill="#1e1b4b">8 cm</text><text x="12" y="105" font-family="sans-serif" font-size="15" fill="#1e1b4b">6 cm</text><text x="140" y="92" font-family="sans-serif" font-size="17" fill="#be123c" font-weight="bold">?</text></svg>'),
      square: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200" viewBox="0 0 240 200"><rect width="240" height="200" fill="#ffffff"/><rect x="60" y="35" width="120" height="120" fill="#ecfdf5" stroke="#047857" stroke-width="3"/><text x="103" y="175" font-family="sans-serif" font-size="15" fill="#064e3b">6 cm</text><text x="20" y="100" font-family="sans-serif" font-size="15" fill="#064e3b">6 cm</text></svg>'),
      bars: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#ffffff"/><line x1="45" y1="20" x2="45" y2="160" stroke="#94a3b8" stroke-width="2"/><line x1="45" y1="160" x2="280" y2="160" stroke="#94a3b8" stroke-width="2"/><rect x="70" y="100" width="38" height="60" fill="#2563eb"/><rect x="130" y="60" width="38" height="100" fill="#2563eb"/><rect x="190" y="120" width="38" height="40" fill="#2563eb"/><text x="78" y="178" font-family="sans-serif" font-size="13" fill="#334155">Pzt</text><text x="138" y="178" font-family="sans-serif" font-size="13" fill="#334155">Sal</text><text x="198" y="178" font-family="sans-serif" font-size="13" fill="#334155">Çar</text><text x="20" y="65" font-family="sans-serif" font-size="13" fill="#334155">20</text><text x="20" y="105" font-family="sans-serif" font-size="13" fill="#334155">10</text></svg>'),
      beakers: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="190" viewBox="0 0 300 190"><rect width="300" height="190" fill="#ffffff"/><path d="M40 40 h70 v100 a10 10 0 0 1 -10 10 h-50 a10 10 0 0 1 -10 -10 z" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><path d="M45 90 h60 v50 a8 8 0 0 1 -8 8 h-44 a8 8 0 0 1 -8 -8 z" fill="#60a5fa"/><path d="M180 40 h80 v100 a10 10 0 0 1 -10 10 h-60 a10 10 0 0 1 -10 -10 z" fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"/><path d="M185 70 h70 v70 a8 8 0 0 1 -8 8 h-54 a8 8 0 0 1 -8 -8 z" fill="#60a5fa"/><text x="62" y="172" font-family="sans-serif" font-size="14" fill="#1e3a8a">K</text><text x="212" y="172" font-family="sans-serif" font-size="14" fill="#1e3a8a">L</text></svg>'),
      numberline: svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="110" viewBox="0 0 320 110"><rect width="320" height="110" fill="#ffffff"/><line x1="20" y1="60" x2="300" y2="60" stroke="#334155" stroke-width="2"/><g font-family="sans-serif" font-size="13" fill="#334155"><line x1="60" y1="52" x2="60" y2="68" stroke="#334155" stroke-width="2"/><text x="52" y="88">-2</text><line x1="120" y1="52" x2="120" y2="68" stroke="#334155" stroke-width="2"/><text x="114" y="88">-1</text><line x1="180" y1="52" x2="180" y2="68" stroke="#334155" stroke-width="2"/><text x="176" y="88">0</text><line x1="240" y1="52" x2="240" y2="68" stroke="#334155" stroke-width="2"/><text x="236" y="88">1</text></g><circle cx="240" cy="60" r="7" fill="#e6087b"/></svg>')
    };
    function pqRich(key, o) {
      pid++;
      o.id = 'pool-' + String(pid).padStart(3, '0');
      o.poolType = 'academic';
      o.inputMode = o.inputMode || 'manual';
      o.section = SUBJ[o.subject] ? SUBJ[o.subject].section : 'numeric';
      if (!o.addedBy) o.addedBy = SEED_AUTHORS[pid % SEED_AUTHORS.length];
      var dd = new Date(2026, 0, 8); dd.setDate(dd.getDate() + pid);
      dd.setHours(9 + (pid % 8), (pid * 13) % 60, 0, 0);
      o.createdAt = dd.toISOString();
      if (o.questionType === 'multiple_choice') { o.correctTextAnswer = null; o.correctNumberAnswer = null; }
      else if (o.questionType === 'text_answer') { o.options = []; o.correctNumberAnswer = null; o.caseSensitive = false; }
      else { o.options = []; o.correctTextAnswer = null; }
      pool.push(o); P[key] = o;
    }
    // Görselli sorular (zengin metin + görsel + sonuç metni)
    pqRich('img_8_math', {
      gradeLevel: '8', subject: 'mathematics', topic: 'Üçgenler', subTopic: 'Pisagor bağıntısını oluşturur, ilgili problemleri çözer.',
      questionText: 'Şekildeki dik üçgende hipotenüs kaç cm’dir?',
      aboveImageHtml: 'Aşağıda dik kenar uzunlukları verilen bir <b>dik üçgen</b> gösterilmiştir.',
      imageUrl: FIG.triangle, belowImageHtml: 'Şekildeki ölçüler santimetre cinsindendir.',
      resultHtml: 'Buna göre üçgenin <b>hipotenüs</b> uzunluğu kaç cm’dir?',
      questionType: 'number_answer', correctNumberAnswer: 10, score: 15, addedBy: 'Onur Demirli'
    });
    pqRich('img_5_math', {
      gradeLevel: '5', subject: 'mathematics', topic: 'Üslü İfadeler', subTopic: 'Üslü İfadelerde Çarpma ve Bölme',
      questionText: 'Şekildeki karenin alanı kaç cm²dir?',
      aboveImageHtml: 'Bir kenar uzunluğu <b>6 cm</b> olan kare aşağıda verilmiştir.',
      imageUrl: FIG.square, belowImageHtml: '',
      resultHtml: 'Buna göre karenin <b>alanı</b> kaç cm²dir?',
      questionType: 'number_answer', correctNumberAnswer: 36, score: 10, addedBy: 'Elif Kaya'
    });
    pqRich('img_8_data', {
      gradeLevel: '8', subject: 'mathematics', topic: 'Veri Analizi', subTopic: 'En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar.',
      questionText: 'Grafikte en yüksek değer hangi güne aittir?',
      aboveImageHtml: 'Bir kitapçının üç gündeki satışları aşağıdaki <b>sütun grafiğinde</b> verilmiştir.',
      imageUrl: FIG.bars, belowImageHtml: 'Grafikteki değerler adet cinsindendir.',
      resultHtml: 'Buna göre <b>en çok satış</b> hangi gün yapılmıştır?',
      questionType: 'multiple_choice', options: mc(['Salı', 'Pazartesi', 'Çarşamba', 'Hepsi eşit'], 0), score: 10, addedBy: 'Mert Yılmaz'
    });
    pqRich('img_7_science', {
      gradeLevel: '7', subject: 'science', topic: 'Basınç', subTopic: 'Sıvı Basıncı',
      questionText: 'Şekildeki kaplarda sıvı basıncı karşılaştırması hangisidir?',
      aboveImageHtml: 'Aynı sıvı ile doldurulmuş <b>K</b> ve <b>L</b> kapları aşağıda verilmiştir.',
      imageUrl: FIG.beakers, belowImageHtml: 'Kapların taban alanları farklıdır.',
      resultHtml: 'Buna göre kap tabanlarındaki <b>sıvı basıncı</b> için ne söylenebilir?',
      questionType: 'multiple_choice', options: mc(['L’nin tabanındaki basınç daha büyüktür', 'K’nin tabanındaki basınç daha büyüktür', 'Basınçlar eşittir', 'Karşılaştırılamaz'], 0), score: 15, addedBy: 'Zeynep Ak'
    });
    pqRich('img_6_math', {
      gradeLevel: '6', subject: 'mathematics', topic: 'Çarpanlar ve Katlar', subTopic: 'EBOB - EKOK',
      questionText: 'Sayı doğrusunda işaretli nokta hangi sayıyı gösterir?',
      aboveImageHtml: 'Aşağıdaki <b>sayı doğrusunda</b> bir nokta işaretlenmiştir.',
      imageUrl: FIG.numberline, belowImageHtml: '',
      resultHtml: 'Buna göre işaretli nokta hangi <b>tam sayıyı</b> gösterir?',
      questionType: 'number_answer', correctNumberAnswer: 1, score: 10, addedBy: 'Burak Şen'
    });
    // Vektörel olarak eklenmiş sorular (içerik yüklenen SVG/AI dosyasıdır)
    pqRich('vec_8_math', {
      inputMode: 'vector', vectorFileName: 'sekil-8-pisagor.svg',
      gradeLevel: '8', subject: 'mathematics', topic: 'Üçgenler', subTopic: 'Yeterli sayıda elemanının ölçüleri verilen bir üçgeni çizer.',
      questionText: 'Dik üçgen çizimi — vektörel soru',
      imageUrl: FIG.triangle,
      questionType: 'multiple_choice', options: mc(['10 cm', '12 cm', '14 cm', '16 cm'], 0), score: 15, addedBy: 'Onur Demirli'
    });
    pqRich('vec_7_science', {
      inputMode: 'vector', vectorFileName: 'basinc-kaplar.ai',
      gradeLevel: '7', subject: 'science', topic: 'Basınç', subTopic: 'Katı Basıncı',
      questionText: 'Kaplarda sıvı basıncı — vektörel soru',
      imageUrl: FIG.beakers,
      questionType: 'multiple_choice', options: mc(['K = L', 'K > L', 'K < L', 'Belirlenemez'], 0), score: 10, addedBy: 'Elif Kaya'
    });
    pqRich('vec_6_math', {
      inputMode: 'vector', vectorFileName: 'grafik-veri-analizi.svg',
      gradeLevel: '6', subject: 'mathematics', topic: 'Üslü İfadeler', subTopic: 'Üslü İfadelerde Toplama ve Çıkarma',
      questionText: 'Sütun grafiği okuma — vektörel soru',
      imageUrl: FIG.bars,
      questionType: 'multiple_choice', options: mc(['Salı', 'Pazartesi', 'Çarşamba', 'Perşembe'], 0), score: 10, addedBy: 'Mert Yılmaz'
    });

    /* ---------------- Soru Havuzu: Dikkat Testleri (Burdon) ----------------
       Çoklu seçim tipi kaldırıldı; dikkat bölümü artık Burdon testlerinden oluşur.
       Sınıf seviyesi yoktur. Tablo ve toplam hedef sayısı hesaplanarak üretilir. */
    var BURDON_PRESETS = [
      { name: 'Burdon Dikkat Testi - A Formu', targets: ['A', 'B'], rows: 20, perRow: 30, ratio: 30, min: 5, seed: 20260101 },
      { name: 'Burdon Dikkat Testi - B Formu', targets: ['A', 'B'], rows: 18, perRow: 28, ratio: 28, min: 5, seed: 20260202 },
      { name: 'Burdon Dikkat Testi - C Formu', targets: ['A', 'B', 'C'], rows: 20, perRow: 30, ratio: 26, min: 5, seed: 20260303 },
      { name: 'Burdon Dikkat Testi - Kısa Form', targets: ['A', 'B'], rows: 12, perRow: 24, ratio: 32, min: 3, seed: 20260404 },
      { name: 'Burdon Dikkat Testi - Uzun Form', targets: ['A', 'B'], rows: 25, perRow: 32, ratio: 30, min: 8, seed: 20260505 },
      { name: 'Burdon Dikkat Testi - D Formu', targets: ['M', 'N'], rows: 20, perRow: 30, ratio: 29, min: 5, seed: 20260606 }
    ];
    BURDON_PRESETS.forEach(function (pr, i) {
      pid++;
      var b = burdonRebuild(Object.assign(burdonDefaults(), {
        targetLetters: pr.targets, rows: pr.rows, perRow: pr.perRow,
        targetRatio: pr.ratio, durationSeconds: pr.min * 60, seed: pr.seed
      }));
      b.id = 'pool-' + String(pid).padStart(4, '0');
      b.poolType = 'attention';
      b.questionText = pr.name;
      b.questionType = 'burdon_attention';
      b.gradeLevel = null;
      b.instruction = 'Sayfadaki harfler arasında yalnızca ' + pr.targets.join(' ve ') +
        ' harflerini mümkün olduğunca hızlı ve doğru şekilde işaretlemenizi istiyorum. Süre başladığında çalışmaya başlayabilirsiniz.';
      b.addedBy = SEED_AUTHORS[pid % SEED_AUTHORS.length];
      var dd = new Date(2026, 0, 8); dd.setDate(dd.getDate() + i * 6);
      dd.setHours(10 + (i % 6), (i * 17) % 60, 0, 0);
      b.createdAt = dd.toISOString();
      pool.push(b); P['burdon_' + (i + 1)] = b;
    });

    /* ---------------- Materyaller (havuzdan klonlanır) ---------------- */
    var list = [];
    var id = 0;
    var orderSeq = {};
    function q(o) {
      id++;
      o.id = 'question-' + String(id).padStart(3, '0');
      if (!o.addedBy) o.addedBy = SEED_AUTHORS[(id - 1) % SEED_AUTHORS.length];
      if (!o.inputMode) o.inputMode = 'manual';
      list.push(o);
      return o;
    }
    function useQ(key, extra) {
      // Dikkat soruları havuzda değil → doğrudan materyale yazılır (poolId yok).
      if (attentionSeeds[key]) {
        var a = JSON.parse(JSON.stringify(attentionSeeds[key]));
        Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
        var agk = [a.contentType, a.gradeLevel].join('|');
        orderSeq[agk] = (orderSeq[agk] || 0) + 1;
        a.order = orderSeq[agk];
        if (a.isActive === undefined) a.isActive = true;
        if (a.xp === undefined) a.xp = null;
        return q(a);
      }
      var p = P[key];
      if (!p) return null;
      var o = JSON.parse(JSON.stringify(p));
      delete o.poolType; delete o.createdAt; delete o.id;
      o.poolId = p.id;
      Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      var gk = [o.contentType, o.gradeLevel, o.examNo || '', o.subject || ''].join('|');
      orderSeq[gk] = (orderSeq[gk] || 0) + 1;
      o.order = orderSeq[gk];
      if (o.isActive === undefined) o.isActive = true;
      if (o.xp === undefined) o.xp = null;
      return q(o);
    }
    /* ---- Sınav soruları: her sınıf × sınav × TÜM DERSLER, havuzdan ----
       Her (sınıf, ders) için havuzda >=18 soru var. Dilimler çakışmasın diye
       Seviye Belirleme 0-8, Aylık Deneme 9-17 aralığını kullanır: aynı soru iki
       sınava birden düşmez ve her soru havuzdaki kaydıyla birebir eşleşir. */
    var EXAM_PER_SUBJECT = 3;
    function examCandidates(grade, subject) {
      var all = pool.filter(function (p) {
        return (p.poolType || 'academic') === 'academic' && p.gradeLevel === grade && p.subject === subject;
      });
      // Görselli/vektörel sorular öne alınsın ki sınavlarda da görünsünler.
      var rich = all.filter(function (p) { return p.imageUrl || p.inputMode === 'vector'; });
      var plain = all.filter(function (p) { return !(p.imageUrl || p.inputMode === 'vector'); });
      return rich.concat(plain);
    }
    function usePoolObj(p, extra) {
      var o = JSON.parse(JSON.stringify(p));
      delete o.poolType; delete o.createdAt; delete o.id;
      o.poolId = p.id;
      Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      var gk = [o.contentType, o.gradeLevel, o.examNo || '', o.subject || ''].join('|');
      orderSeq[gk] = (orderSeq[gk] || 0) + 1;
      o.order = orderSeq[gk];
      if (o.isActive === undefined) o.isActive = true;
      if (o.xp === undefined) o.xp = null;
      return q(o);
    }
    var MONTH_OF_EXAM = { 1: 'january', 2: 'february', 3: 'march' };
    GRADES.forEach(function (grade) {
      SUBJECTS.forEach(function (sub) {
        var cands = examCandidates(grade, sub.id);
        if (!cands.length) return;
        [1, 2, 3].forEach(function (no) {
          var pStart = (no - 1) * EXAM_PER_SUBJECT;
          for (var i = 0; i < EXAM_PER_SUBJECT; i++) {
            usePoolObj(cands[(pStart + i) % cands.length], { contentType: 'placement_exam', examNo: no });
          }
          var mStart = 3 * EXAM_PER_SUBJECT + (no - 1) * EXAM_PER_SUBJECT;
          for (var j = 0; j < EXAM_PER_SUBJECT; j++) {
            usePoolObj(cands[(mStart + j) % cands.length], { contentType: 'monthly_trial_exam', examNo: no, month: MONTH_OF_EXAM[no], year: 2026 });
          }
        });
      });
    });
    // Gerçekçilik: birkaç soru pasif olsun (Durum sütunu boş kalmasın)
    list.forEach(function (x, i) {
      if ((x.contentType === 'placement_exam' || x.contentType === 'monthly_trial_exam') && i % 37 === 5) x.isActive = false;
    });

    // Dikkat Testleri — havuzdaki Burdon testlerinden seçilir (sınıf seviyesi yok)
    [['attention_initial', ['burdon_1', 'burdon_2', 'burdon_4'], null],
     ['attention_quarterly', ['burdon_1', 'burdon_3', 'burdon_5', 'burdon_6'], ['q1', 'q1', 'q2', 'q3']]
    ].forEach(function (spec) {
      spec[1].forEach(function (key, i) {
        var src = P[key];
        if (!src) return;
        var b = JSON.parse(JSON.stringify(src));
        delete b.poolType; delete b.createdAt; delete b.id;
        b.poolId = src.id;
        b.contentType = spec[0];
        b.gradeLevel = null;
        b.isActive = true;
        b.order = i + 1;
        if (spec[2]) b.quarter = spec[2][i];
        q(b);
      });
    });

    /* ---------------- Havuz değişiklik geçmişi ----------------
       Her kaydın "yeni durum"u sorunun GÜNCEL değeriyle birebir aynıdır. */
    var poolHistory = [];
    /* ---- Toplu değişiklik geçmişi üretimi ----
       Kural: her kaydın "yeni durum"u sorunun GÜNCEL değeriyle birebir aynıdır,
       "eski durum" ise ondan farklı, inandırıcı bir önceki değerdir. */
    var histSeq = 0;
    function pushHist(arr, targetId, field, label, prev, next, by, dayOffset) {
      if (String(prev) === String(next)) return;   // aynıysa kayıt üretme
      histSeq++;
      var dd = new Date(2026, 1, 10); dd.setDate(dd.getDate() + dayOffset);
      dd.setHours(8 + (histSeq % 10), (histSeq * 23) % 60, 0, 0);
      arr.push({
        id: (arr === poolHistory ? 'plog-' : 'qlog-') + String(histSeq).padStart(4, '0'),
        questionId: targetId, field: field, label: label,
        previousValue: String(prev), newValue: String(next),
        changedBy: by, changedAt: dd.toISOString()
      });
    }
    function altTopic(p) {
      var map = (CURRICULUM[p.gradeLevel] && CURRICULUM[p.gradeLevel][p.subject]) || TOPICS[p.subject] || {};
      var keys = Object.keys(map).filter(function (k) { return k !== p.topic; });
      return keys.length ? keys[0] : null;
    }
    function altSubTopic(p) {
      var map = (CURRICULUM[p.gradeLevel] && CURRICULUM[p.gradeLevel][p.subject]) || TOPICS[p.subject] || {};
      var subs = (map[p.topic] || []).filter(function (x) { return x !== p.subTopic; });
      return subs.length ? subs[0] : null;
    }
    var TYPE_ALT = { multiple_choice: 'Sözel Cevap', text_answer: '4 Seçenekli', number_answer: '4 Seçenekli' };
    // Havuz sorularının yaklaşık üçte biri için 1-3 değişiklik kaydı
    pool.forEach(function (p, i) {
      if ((p.poolType || 'academic') !== 'academic') return;
      if (i % 3 !== 0) return;
      var by = SEED_AUTHORS[i % SEED_AUTHORS.length];
      var day = 3 + (i % 40);
      var variant = i % 5;
      if (variant === 0) {
        pushHist(poolHistory, p.id, 'score', 'Puan', Math.max(5, (p.score || 10) - 5), p.score, by, day);
      } else if (variant === 1) {
        var t = altTopic(p);
        if (t) pushHist(poolHistory, p.id, 'topic', 'Konu', t, p.topic, by, day);
        pushHist(poolHistory, p.id, 'score', 'Puan', (p.score || 10) + 5, p.score, SEED_AUTHORS[(i + 2) % SEED_AUTHORS.length], day + 4);
      } else if (variant === 2) {
        var st2 = altSubTopic(p);
        if (st2) pushHist(poolHistory, p.id, 'subTopic', 'Alt Konu', st2, p.subTopic, by, day);
      } else if (variant === 3) {
        pushHist(poolHistory, p.id, 'questionType', 'Tip', TYPE_ALT[p.questionType] || '4 Seçenekli', QTYPE_LABEL[p.questionType], by, day);
        var ans = correctText(p);
        pushHist(poolHistory, p.id, 'correct', 'Cevap', ans + ' (taslak)', ans, SEED_AUTHORS[(i + 1) % SEED_AUTHORS.length], day + 6);
      } else {
        var g = String(Math.max(5, Number(p.gradeLevel) - 1));
        pushHist(poolHistory, p.id, 'gradeLevel', 'Sınıf Seviyesi', gradeLabel(g), gradeLabel(p.gradeLevel), by, day);
        pushHist(poolHistory, p.id, 'subTopic', 'Alt Konu', (p.subTopic || '') + ' (eski)', p.subTopic, SEED_AUTHORS[(i + 3) % SEED_AUTHORS.length], day + 9);
      }
    });
    // Materyal içi (sınav/ödev) yerel değişiklikler: sıra ve durum
    var questionHistory = [];
    list.forEach(function (x, i) {
      if (x.contentType !== 'placement_exam' && x.contentType !== 'monthly_trial_exam') return;
      if (i % 7 !== 0) return;
      var by = SEED_AUTHORS[(i + 1) % SEED_AUTHORS.length];
      var day = 12 + (i % 30);
      if (i % 14 === 0) {
        pushHist(questionHistory, x.id, 'order', 'Sıra', (x.order || 1) + 1, x.order, by, day);
      } else {
        pushHist(questionHistory, x.id, 'isActive', 'Durum', x.isActive ? 'Pasif' : 'Aktif', x.isActive ? 'Aktif' : 'Pasif', by, day);
      }
    });


    // Sınav yayın durumu — 'published' (Yayında) | 'editing' (Düzenleniyor).
    // Anahtar: bölüm:sınıf-sınavNo (Seviye Belirleme ve Aylık Deneme ayrı ayrı tutulur).
    var examStatus = {
      'placement:5-1': 'published', 'placement:8-1': 'published', 'placement:7-1': 'editing',
      'monthly:8-1': 'published', 'monthly:7-1': 'editing'
    };
    // Varsayılan sınavların künyesi (kimin oluşturduğu + tarihi) — gerçekçi örnek veri.
    var examMeta = {};
    var seedDay = 0;
    ['placement', 'monthly'].forEach(function (sec) {
      GRADES.forEach(function (g) {
        [1, 2, 3].forEach(function (n) {
          seedDay += 5;
          var dt = new Date(2026, 0, 6);
          dt.setDate(dt.getDate() + seedDay);
          dt.setHours(9 + (seedDay % 8), (seedDay * 7) % 60, 0, 0);
          var ed = new Date(2026, 8, 14); ed.setDate(ed.getDate() + seedDay * 2);
          var hh = 9 + (n % 3) * 2;
          examMeta[sec + ':' + g + '-' + n] = {
            createdBy: SEED_AUTHORS[seedDay % SEED_AUTHORS.length],
            createdAt: dt.toISOString(),
            examDate: ed.getFullYear() + '-' + String(ed.getMonth() + 1).padStart(2, '0') + '-' + String(ed.getDate()).padStart(2, '0'),
            examTime: String(hh).padStart(2, '0') + ':' + (n % 2 ? '30' : '00')
          };
        });
      });
    });
    // Sınavın kapsadığı dersler / adı / silinmişleri / künyesi — aynı anahtar biçimi.
    return { questions: list, examStatus: examStatus, examSubjects: {}, examNames: {}, examDeleted: {}, examMeta: examMeta, pool: pool, poolHistory: poolHistory, questionHistory: questionHistory };
  }

  var db = loadDb() || seedDb();
  if (!db.examStatus) db.examStatus = {};
  if (!db.examSubjects) db.examSubjects = {};
  if (!db.examNames) db.examNames = {};
  if (!db.examDeleted) db.examDeleted = {};
  if (!db.examMeta) db.examMeta = {};
  if (!db.pool) db.pool = [];
  if (!db.poolHistory) db.poolHistory = [];
  if (!db.weeklyDeleted) db.weeklyDeleted = {};
  if (!db.questionHistory) db.questionHistory = [];
  if (!loadDb()) saveDb();
  // Tüm sınav kayıtları bölüm bazlı: "placement:5-1", "monthly:8-2" …
  function examKey(key, grade, no) { return key + ':' + grade + '-' + no; }
  function ctOf(key) { return SECTIONS[key].contentType; }
  function isExamQ(key, q, grade, no, subject) {
    return q.contentType === ctOf(key) && q.gradeLevel === grade && (q.examNo || 1) === no &&
      (!subject || q.subject === subject);
  }
  function examStatusOf(key, grade, no) { return db.examStatus[examKey(key, grade, no)] || 'editing'; }
  function setExamStatus(key, grade, no, status) { db.examStatus[examKey(key, grade, no)] = status; saveDb(); }
  var ALL_SUBJECT_IDS = SUBJECTS.map(function (s) { return s.id; });
  // Sınavın dersleri: kayıtlıysa o liste, değilse (eski/varsayılan sınavlar) tüm dersler.
  function examSubjectsOf(key, grade, no) {
    var v = db.examSubjects[examKey(key, grade, no)];
    return (v && v.length) ? v : ALL_SUBJECT_IDS;
  }
  function setExamSubjects(key, grade, no, ids) { db.examSubjects[examKey(key, grade, no)] = ids.slice(); saveDb(); }
  // Sınav künyesi: kim oluşturdu, ne zaman.
  function examMetaOf(key, grade, no) { return db.examMeta[examKey(key, grade, no)] || null; }
  function setExamMeta(key, grade, no, meta) { db.examMeta[examKey(key, grade, no)] = meta; saveDb(); }
  // Sınav tarihi/saati — kart üzerinde gösterim (yyyy-mm-dd → gg.aa.yyyy)
  function fmtExamDate(iso) {
    if (!iso) return '—';
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? (m[3] + '.' + m[2] + '.' + m[1]) : String(iso);
  }
  function examScheduleHtml(key, grade, no) {
    var meta = examMetaOf(key, grade, no) || {};
    return '<div class="sy-exam-sched">' +
      '<span><span class="sy-sched-lbl">Sınav Tarihi:</span> ' + esc(fmtExamDate(meta.examDate)) + '</span>' +
      '<span><span class="sy-sched-lbl">Sınav Saati:</span> ' + esc(meta.examTime || '—') + '</span>' +
    '</div>';
  }
  function defaultExamName(key, no) { return SECTIONS[key].examLabel + ' - ' + no; }
  function examNameOf(key, grade, no) { return db.examNames[examKey(key, grade, no)] || defaultExamName(key, no); }
  function setExamName(key, grade, no, name) { db.examNames[examKey(key, grade, no)] = name; saveDb(); }
  // Sınavdaki soru sayısı (ders verilirse o derse ait olanlar).
  function examQuestionCount(key, grade, no, subject) {
    return db.questions.filter(function (q) { return isExamQ(key, q, grade, no, subject); }).length;
  }
  function deleteExam(key, grade, no) {
    var k = examKey(key, grade, no);
    db.questions = db.questions.filter(function (q) { return !isExamQ(key, q, grade, no); });
    delete db.examStatus[k]; delete db.examSubjects[k]; delete db.examNames[k]; delete db.examMeta[k];
    db.examDeleted[k] = true; // varsayılan 1-2-3 kartları olarak geri gelmesin
    saveDb();
  }
  function removeExamSubject(key, grade, no, subjectId) {
    var ids = examSubjectsOf(key, grade, no).filter(function (x) { return x !== subjectId; });
    db.questions = db.questions.filter(function (q) { return !isExamQ(key, q, grade, no, subjectId); });
    setExamSubjects(key, grade, no, ids);
  }

  /* ----------------------------- HUD + Sidebar ----------------------------- */
  var SWITCH = [
    { key: 'website', href: 'index.html', short: 'Website', icon: SW_ICON.website },
    { key: 'veli', href: 'veli-dashboard.html', short: 'Veli', icon: SW_ICON.veli },
    { key: 'student', href: 'ogrenci-dashboard.html', short: 'Öğrenci', icon: SW_ICON.student },
    { key: 'teacher', href: 'ogretmen-dashboard.html', short: 'Öğretmen', icon: SW_ICON.teacher },
    { key: 'trial-manager', href: 'deneme-dersi-yoneticisi-dashboard.html', short: 'Deneme', icon: SW_ICON.trial },
    { key: 'question-author', href: 'soru-yazari-dashboard.html', short: 'Soru Yazarı', icon: SW_ICON.author }
  ];
  function renderHud() {
    var sw = '<nav class="tm-switcher" aria-label="Bölüm geçişi">' + SWITCH.map(function (it) {
      var active = it.key === 'question-author';
      return '<a class="tm-switcher-btn' + (active ? ' is-active' : '') + '" href="' + it.href + '"' + (active ? ' aria-current="page"' : '') + '>' + it.icon + '<span>' + esc(it.short) + '</span></a>';
    }).join('') + '</nav>';
    return '<header class="hud tm-admin-hud">' +
      '<button type="button" class="tm-mobile-menu-btn" id="syMobileMenuBtn" aria-label="Menüyü aç/kapat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>' +
      '<a class="hud-brand" href="index.html" aria-label="Bilenyum anasayfa"><img src="assets/bilenyum-logo.svg" alt="Bilenyum" /></a>' +
      sw +
      '<div class="hud-stats"><div class="hud-profile"><button type="button" class="hud-player" id="syProfileBtn" aria-haspopup="false">' +
        '<span class="player-avatar-wrap"><span class="player-avatar"><span aria-hidden="true">SY</span></span></span>' +
        '<span class="player-text"><span class="player-name">Soru Yazarı</span><span class="player-clan">İçerik Ekibi</span></span>' +
      '</button></div></div>' +
      '</header>';
  }
  var CHEVRON = '<svg class="sy-nav-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>';
  function renderSidebar() {
    var links = NAV_ORDER.map(function (key) {
      var s = SECTIONS[key];
      var active = key === activeSection;
      // Soru Havuzu — Akademik / Dikkat alt menüsü.
      if (s.poolFlow) {
        var pOpen = active && poolMenuOpen;
        var pSub = '<div class="sy-subnav' + (pOpen ? ' is-open' : '') + '" data-sy-subnav>' + s.groups.map(function (g) {
          return active
            ? '<a class="sy-subnav-link' + (poolGroup === g.id ? ' is-active' : '') + '" href="#pool" data-sy-pool-group="' + g.id + '">' + esc(g.label) + '</a>'
            : '<a class="sy-subnav-link" href="' + s.page + '?group=' + g.id + '">' + esc(g.label) + '</a>';
        }).join('') + '</div>';
        var pParent = active
          ? '<button type="button" class="tm-sidebar-link sy-nav-parent is-active' + (pOpen ? ' is-open' : '') + '" data-sy-pool-toggle aria-current="page">' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span>' + CHEVRON + '</button>'
          : '<a class="tm-sidebar-link sy-nav-parent" href="' + s.page + '">' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span>' + CHEVRON + '</a>';
        return '<div class="sy-nav-group">' + pParent + pSub + '</div>';
      }
      // Sınav akışlı bölümler (Seviye Belirleme, Aylık Deneme): sınıf bazlı açılır alt menü.
      // Aktif bölüm sayfa içinde çalışır; diğer bölümler kendi HTML sayfasına bağlantıdır.
      if (SECTIONS[key].examFlow || SECTIONS[key].weeklyFlow) {
        var st = examState[key];
        var open = active && st.menuOpen;
        var sub = '<div class="sy-subnav' + (open ? ' is-open' : '') + '" data-sy-subnav>' + GRADES.map(function (g) {
          return active
            ? '<a class="sy-subnav-link' + (st.grade === g ? ' is-active' : '') + '" href="#' + key + '" data-sy-section="' + key + '" data-sy-grade="' + g + '">' + esc(gradeLabel(g)) + '</a>'
            : '<a class="sy-subnav-link" href="' + s.page + '?grade=' + g + '">' + esc(gradeLabel(g)) + '</a>';
        }).join('') + '</div>';
        var parent = active
          ? '<button type="button" class="tm-sidebar-link sy-nav-parent is-active' + (open ? ' is-open' : '') + '" data-sy-toggle="' + key + '" aria-current="page">' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span>' + CHEVRON + '</button>'
          : '<a class="tm-sidebar-link sy-nav-parent" href="' + s.page + '">' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span>' + CHEVRON + '</a>';
        return '<div class="sy-nav-group">' + parent + sub + '</div>';
      }
      return '<a class="tm-sidebar-link' + (active ? ' is-active' : '') + '" href="' + s.page + '"' + (active ? ' aria-current="page"' : '') + '>' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span></a>';
    }).join('');
    return '<nav class="tm-sidebar-nav">' + links + '</nav>';
  }

  /* ----------------------------- Durum ----------------------------- */
  var activeSection = 'placement';
  var filters = {}; // section-key -> {field:value}
  NAV_ORDER.forEach(function (k) { filters[k] = {}; });
  // Seviye Belirleme: sınıf → sınav kartları → sorular akışı.
  // Her bölümün kendi HTML sayfası var; sayfa hangi bölümü gösterecekse body'de bildirir.
  (function () {
    var want = document.body && document.body.getAttribute('data-sy-section');
    if (want && SECTIONS[want]) activeSection = want;
  })();
  // Sınav akışlı her bölüm (Seviye Belirleme, Aylık Deneme) kendi gezinme durumunu tutar.
  var examState = {};
  NAV_ORDER.forEach(function (k) {
    if (SECTIONS[k].examFlow || SECTIONS[k].weeklyFlow) {
      examState[k] = { grade: '5', exam: null, subject: null, mode: null, week: null, menuOpen: k === activeSection };
    }
  });
  // Soru Havuzu durumu
  var poolGroup = 'academic';
  var poolMenuOpen = activeSection === 'pool';
  var poolFilters = { q: '', gradeLevel: 'all', subject: 'all', questionType: 'all' };
  var poolPage = 1;
  var POOL_PAGE_SIZE = 12;
  // Sayfaya ?grade=6 / ?group=attention ile gelindiyse ona göre aç.
  (function () {
    var g = (location.search || '').match(/[?&]group=(\w+)/);
    if (g && (g[1] === 'academic' || g[1] === 'attention')) poolGroup = g[1];
    if (!hasGradeMenu()) return;
    var m = (location.search || '').match(/[?&]grade=(\d+)/);
    if (m && GRADES.indexOf(m[1]) >= 0) examState[activeSection].grade = m[1];
  })();
  function ES(key) { return examState[key || activeSection]; }
  function isExamFlow(key) { return !!SECTIONS[key || activeSection].examFlow; }
  function isWeeklyFlow(key) { return !!SECTIONS[key || activeSection].weeklyFlow; }
  // Sınıf alt menüsü hem sınav hem haftalık ödev akışında var.
  function hasGradeMenu(key) { return isExamFlow(key) || isWeeklyFlow(key); }

  // Tarayıcı geri tuşu panel içinde katman-katman gezinsin (sayfayı terk edip anasayfaya atmasın).
  var syRestoring = false;
  function navState() {
    var st = ES();
    return { syNav: { section: activeSection, grade: st ? st.grade : null, exam: st ? st.exam : null, subject: st ? st.subject : null, mode: st ? st.mode : null, week: st ? st.week : null } };
  }
  function pushNav() { if (syRestoring) return; try { history.pushState(navState(), ''); } catch (e) {} }
  function replaceNav() { if (syRestoring) return; try { history.replaceState(navState(), ''); } catch (e) {} }
  function onPopNav(e) {
    var st = e.state && e.state.syNav;
    if (!st) return; // panel durumu yok → tarayıcı normal geri gitsin
    syRestoring = true;
    activeSection = st.section;
    var cur = ES();
    if (cur) { cur.grade = st.grade; cur.exam = st.exam; cur.subject = st.subject; cur.mode = st.mode; cur.week = st.week; }
    var sb = document.getElementById('sySidebarMount'); if (sb) { sb.innerHTML = renderSidebar(); bindShell(); }
    renderSection();
    syRestoring = false;
  }

  /* ----------------------------- Filtre çubuğu ----------------------------- */
  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function selectEl(field, allLabel, options, cur) {
    return '<select class="tm-dg-control tm-dg-select" data-filter="' + field + '"><option value="all">' + esc(allLabel) + '</option>' +
      options.map(function (o) { return opt(o.v, o.l, cur === o.v); }).join('') + '</select>';
  }
  function filterBar(key) {
    var s = SECTIONS[key]; var f = filters[key]; var els = [];
    els.push('<input type="search" class="tm-dg-control tm-dg-search" data-filter="q" placeholder="Soru metninde ara…" value="' + esc(f.q || '') + '">');
    if (s.hasMonth) els.push(selectEl('month', 'Tüm aylar', MONTHS.map(function (m) { return { v: m.id, l: m.name }; }), f.month));
    if (s.hasWeek && !isWeeklyFlow(key)) els.push(selectEl('week', 'Tüm haftalar', WEEKS.map(function (n) { return { v: String(n), l: n + '. Hafta' }; }), f.week));
    if (s.hasQuarter) els.push(selectEl('quarter', 'Tüm dönemler', QUARTERS.map(function (q) { return { v: q.id, l: q.name }; }), f.quarter));
    // Sınav akışında sınıf sol menüden/sınavdan gelir; filtre çubuğunda tekrar gösterme.
    if (!hasGradeMenu(key)) els.push(selectEl('gradeLevel', 'Tüm sınıflar', GRADES.map(function (g) { return { v: g, l: gradeLabel(g) }; }), f.gradeLevel));
    if (s.hasSubject) {
      // Sınav akışında ders, ders kartından geldiği için filtre çubuğunda gösterilmez.
      if (!hasGradeMenu(key)) {
        els.push(selectEl('subject', 'Tüm dersler', SUBJECTS.map(function (x) { return { v: x.id, l: x.name }; }), f.subject));
        els.push(selectEl('section', 'Tüm bölümler', [{ v: 'numeric', l: 'Sayısal' }, { v: 'verbal', l: 'Sözel' }], f.section));
      }
      els.push(selectEl('topic', 'Tüm konular', allTopicsFor(key).map(function (t) { return { v: t, l: t }; }), f.topic));
    }
    if (s.hasWeek && !isWeeklyFlow(key)) els.push(selectEl('lessonMode', 'KİD / RUD', LESSON_MODES.map(function (m) { return { v: m.id, l: m.id }; }), f.lessonMode));
    if (s.attention) els.push(selectEl('attentionTaskType', 'Tüm görev tipleri', ATTENTION_TASKS.map(function (a) { return { v: a.id, l: a.name }; }), f.attentionTaskType));
    if (!s.attention) els.push(selectEl('questionType', 'Tüm soru tipleri', qTypesFor(key).map(function (t) { return { v: t, l: QTYPE_LABEL[t] }; }), f.questionType));
    els.push(selectEl('isActive', 'Tümü (aktif/pasif)', [{ v: 'active', l: 'Aktif' }, { v: 'passive', l: 'Pasif' }], f.isActive));
    // Sınav ve haftalık ödev bölümlerinde soru YALNIZCA havuzdan seçilerek eklenir;
    // serbest "Soru ekle" yalnızca dikkat testlerinde kalır.
    var poolOnly = isExamFlow(key) || isWeeklyFlow(key);
    return '<div class="tm-dg-toolbar-row sy-filter-row">' + els.join('') +
      '<span class="tm-dg-spacer"></span>' +
      (poolOnly ? '' : '<button type="button" class="tm-btn tm-btn--primary tm-btn--sm" data-sy-add>+ Soru ekle</button>') +
      '<button type="button" class="tm-btn tm-btn--sm sy-btn-pick' + (poolOnly ? ' sy-btn-pick--main' : '') + '" data-sy-pick>&#9776; Havuzdan Soru Seç</button>' +
      (s.attention ? '<button type="button" class="tm-btn tm-btn--sm sy-btn-burdon" data-sy-burdon-add>+ Burdon Testi</button>' : '') +
      '<span class="tm-dg-count" data-sy-count>—</span></div>';
  }
  function allTopicsFor(key) {
    var set = {}; db.questions.forEach(function (q) { if (q.contentType === SECTIONS[key].contentType && q.topic) set[q.topic] = 1; });
    Object.keys(TOPICS).forEach(function (sub) { Object.keys(TOPICS[sub]).forEach(function (t) { set[t] = 1; }); });
    return Object.keys(set).sort();
  }
  function qTypesFor(key) { return SECTIONS[key].attention ? ['multi_select_attention'] : ['multiple_choice', 'text_answer', 'number_answer']; }

  /* ----------------------------- Liste ----------------------------- */
  function questionsFor(key) {
    var s = SECTIONS[key]; var f = filters[key];
    var list = db.questions.filter(function (q) { return q.contentType === s.contentType; });
    // Seviye Belirleme: seçili sınıf + seçili sınav no ile sınırlandır.
    if (isExamFlow(key)) {
      var st = ES(key);
      if (st.grade) list = list.filter(function (q) { return q.gradeLevel === st.grade; });
      if (st.exam != null) list = list.filter(function (q) { return (q.examNo || 1) === st.exam; });
      if (st.subject) list = list.filter(function (q) { return q.subject === st.subject; });
    } else if (isWeeklyFlow(key)) {
      var wst = ES(key);
      if (wst.mode && wst.subject && wst.week != null) {
        list = weeklyResolved(wst.grade, wst.mode, wst.subject, wst.week);
      } else {
        if (wst.grade) list = list.filter(function (q) { return q.gradeLevel === wst.grade; });
        if (wst.mode) list = list.filter(function (q) { return q.lessonMode === wst.mode; });
        if (wst.subject) list = list.filter(function (q) { return q.subject === wst.subject; });
      }
    }
    if (f.q) { var qq = f.q.toLowerCase(); list = list.filter(function (q) { return (q.questionText || '').toLowerCase().indexOf(qq) >= 0; }); }
    if (f.month && f.month !== 'all') list = list.filter(function (q) { return q.month === f.month; });
    if (f.week && f.week !== 'all') list = list.filter(function (q) { return String(q.educationWeek) === f.week; });
    if (f.quarter && f.quarter !== 'all') list = list.filter(function (q) { return q.quarter === f.quarter; });
    if (f.gradeLevel && f.gradeLevel !== 'all') list = list.filter(function (q) { return q.gradeLevel === f.gradeLevel; });
    if (f.subject && f.subject !== 'all') list = list.filter(function (q) { return q.subject === f.subject; });
    if (f.section && f.section !== 'all') list = list.filter(function (q) { return q.section === f.section; });
    if (f.topic && f.topic !== 'all') list = list.filter(function (q) { return q.topic === f.topic; });
    if (f.lessonMode && f.lessonMode !== 'all') list = list.filter(function (q) { return q.lessonMode === f.lessonMode; });
    if (f.attentionTaskType && f.attentionTaskType !== 'all') list = list.filter(function (q) { return q.attentionTaskType === f.attentionTaskType; });
    if (f.questionType && f.questionType !== 'all') list = list.filter(function (q) { return q.questionType === f.questionType; });
    if (f.isActive === 'active') list = list.filter(function (q) { return q.isActive; });
    else if (f.isActive === 'passive') list = list.filter(function (q) { return !q.isActive; });
    list.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    return list;
  }
  function correctSummary(q) {
    if (q.questionType === 'multiple_choice') { var c = (q.options || []).find(function (o) { return o.isCorrect; }); return c ? c.id : '—'; }
    if (q.questionType === 'text_answer') return esc(q.correctTextAnswer || '—');
    if (q.questionType === 'number_answer') return q.correctNumberAnswer != null ? String(q.correctNumberAnswer) : '—';
    if (q.questionType === 'multi_select_attention') return (q.targetItems || []).join(', ') || '—';
    return '—';
  }
  function activeBadge(q) { return q.isActive ? '<span class="tm-badge tm-badge--green">Aktif</span>' : '<span class="tm-badge tm-badge--muted">Pasif</span>'; }
  function preview(t) { t = String(t || ''); return esc(t.length > 60 ? t.slice(0, 60) + '…' : t); }

  // Yalnızca tohumlanmış "question-001" biçimi numaraya çevrilir; çalışma anında
  // üretilen rastgele ID'ler kendi son ekiyle gösterilir (kod çakışması olmasın).
  var PREVIEW_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  // Ortak sayfalama: « ‹ 1 2 3 4 5 › »  (attr örn. 'data-pool-page')
  function pagerHtml(page, pages, total, attr) {
    if (pages <= 1) return '';
    var start = Math.max(1, page - 2);
    var end = Math.min(pages, start + 4);
    start = Math.max(1, Math.min(start, end - 4));
    var nums = [];
    for (var i = start; i <= end; i++) {
      nums.push('<button type="button" class="sy-pg-num' + (i === page ? ' is-active' : '') + '" ' + attr + '="' + i + '">' + i + '</button>');
    }
    function btn(target, label, disabled, title) {
      return '<button type="button" class="sy-pg-btn" ' + attr + '="' + target + '"' + (disabled ? ' disabled' : '') + ' title="' + title + '">' + label + '</button>';
    }
    return '<div class="sy-pager">' +
      btn(1, '&laquo;', page <= 1, 'İlk sayfa') +
      btn(page - 1, '&lsaquo;', page <= 1, 'Önceki sayfa') +
      nums.join('') +
      btn(page + 1, '&rsaquo;', page >= pages, 'Sonraki sayfa') +
      btn(pages, '&raquo;', page >= pages, 'Son sayfa') +
      '<span class="sy-pg-info">' + total + ' kayıt · ' + pages + ' sayfa</span>' +
    '</div>';
  }

  /* ---- Soru önizleme (tek soru veya bir sınavın/dersin tüm soruları) ---- */
  function previewOptionsHtml(q) {
    if (q.questionType === 'multiple_choice') {
      return '<div class="sy-pv-opts">' + (q.options || []).map(function (o) {
        return '<div class="sy-pv-opt' + (o.isCorrect ? ' is-correct' : '') + '">' +
          '<span class="sy-pv-key">' + esc(o.id) + '</span><span>' + esc(o.text || '—') + (o.isCorrect ? ' ✓' : '') + '</span></div>';
      }).join('') + '</div>';
    }
    if (q.questionType === 'text_answer') return '<div class="sy-pv-answer">Doğru cevap: <strong>' + esc(q.correctTextAnswer || '—') + '</strong></div>';
    if (q.questionType === 'number_answer') return '<div class="sy-pv-answer">Doğru cevap: <strong>' + esc(q.correctNumberAnswer == null ? '—' : q.correctNumberAnswer) + '</strong></div>';
    if (q.questionType === 'multi_select_attention') {
      return '<div class="sy-pv-answer">Hedef öğeler: <strong>' + esc((q.targetItems || []).join(', ') || '—') + '</strong>' +
        ' · Çeldiriciler: ' + esc((q.distractorItems || []).join(', ') || '—') +
        ' · Süre: ' + esc(q.timeLimitSeconds != null ? q.timeLimitSeconds + ' sn' : '—') + '</div>';
    }
    return '';
  }
  function previewQuestionHtml(q, i) {
    var subj = q.subject && SUBJ[q.subject] ? SUBJ[q.subject].name : '';
    var meta = [subj, q.topic, q.subTopic].filter(Boolean).map(esc).join(' · ') || '—';
    var above = q.aboveImageHtml || textToHtml(q.questionText);
    return '<article class="sy-pv-q">' +
      '<div class="sy-pv-head"><span class="sy-pv-no">' + (i + 1) + '</span>' +
        '<span class="sy-pv-meta">' + meta +
          '<span class="sy-pv-tags">' + esc(QTYPE_LABEL[q.questionType] || q.questionType) + ' · ' + (q.score != null ? q.score : 0) + ' puan' +
          (q.isActive ? '' : ' · Pasif') + '</span></span>' +
        '<code class="tm-res-code-cell">' + esc(qCode(q)) + '</code></div>' +
      '<div class="sy-pv-body">' +
        (q.inputMode === 'vector'
          ? '<div class="sy-pv-vec">Vektörel soru' + (q.vectorFileName ? ' · <strong>' + esc(q.vectorFileName) + '</strong>' : '') + '</div>'
          : '') +
        '<div class="sy-pv-rich">' + (above || '<em>(soru metni yok)</em>') + '</div>' +
        (q.imageUrl ? '<div class="sy-pv-img"><img src="' + esc(q.imageUrl) + '" alt="Soru görseli"></div>' : '') +
        (q.belowImageHtml ? '<div class="sy-pv-rich">' + q.belowImageHtml + '</div>' : '') +
        (q.resultHtml ? '<div class="sy-pv-result">' + q.resultHtml + '</div>' : '') +
        previewOptionsHtml(q) +
      '</div></article>';
  }
  // Önizleme: çok soruluysa ‹ / › gezgin + "3 / 15" sayacı + nokta navigasyonu,
  // tek soruluysa navigasyon hiç gösterilmez. groups verilirse üstte sekmeler çıkar.
  function openPreview(list, title, sub, groups) {
    var G = (groups && groups.length) ? groups : [{ id: 'all', label: '', list: list || [] }];
    var gi = 0, si = 0, idx = 0;
    function subsOfCur() { var g = G[gi]; return (g && g.subs && g.subs.length) ? g.subs : null; }
    function cur() {
      var subs = subsOfCur();
      if (subs) return (subs[si] && subs[si].list) || [];
      return G[gi].list || [];
    }
    function groupCount(g) {
      if (g.subs && g.subs.length) return g.subs.reduce(function (n, x) { return n + (x.list || []).length; }, 0);
      return (g.list || []).length;
    }
    var existing = document.getElementById('syPreviewModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syPreviewModal'; ov.style.zIndex = '9700';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-preview-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + esc(title) + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(sub || '') + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        (G.length > 1 ? '<div class="sy-tabs sy-pv-tabs" data-pv-tabs></div>' : '') +
        '<div class="sy-pv-subtabs" data-pv-subtabs hidden></div>' +
        '<div class="tm-detail-modal-body" data-pv-body></div>' +
        '<div class="sy-pv-dots" data-pv-dots hidden></div>' +
        '<footer class="tm-crit-foot sy-pv-foot">' +
          '<span class="sy-pv-side"></span>' +
          '<span class="sy-pv-navgroup" data-pv-navgroup hidden>' +
            '<button type="button" class="tm-btn tm-btn--ghost sy-pv-nav" data-pv-prev>&lsaquo; Önceki</button>' +
            '<span class="sy-pv-counter" data-pv-counter></span>' +
            '<button type="button" class="tm-btn tm-btn--ghost sy-pv-nav" data-pv-next>Sonraki &rsaquo;</button>' +
          '</span>' +
          '<span class="sy-pv-side sy-pv-side--end">' +
            '<button type="button" class="tm-btn tm-btn--primary" data-close>Kapat</button>' +
          '</span>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('[data-pv-body]');
    var dots = ov.querySelector('[data-pv-dots]');
    var navg = ov.querySelector('[data-pv-navgroup]');
    var tabs = ov.querySelector('[data-pv-tabs]');
    var subtabs = ov.querySelector('[data-pv-subtabs]');

    function draw() {
      var lst = cur();
      if (tabs) {
        tabs.innerHTML = G.map(function (g, i) {
          return '<button type="button" class="sy-tab-btn' + (i === gi ? ' is-active' : '') + '" data-pv-tab="' + i + '">' +
            esc(g.label) + ' <span class="sy-pv-tabcount">(' + groupCount(g) + ')</span></button>';
        }).join('');
      }
      // Üst sekmenin ders alt sekmeleri (Sayısal → Matematik/Fen, Sözel → Türkçe/Sosyal/DKAB/İngilizce)
      var subs = subsOfCur();
      if (subtabs) {
        subtabs.hidden = !subs;
        if (subs) {
          subtabs.innerHTML = subs.map(function (sg, i) {
            return '<button type="button" class="sy-pv-subtab' + (i === si ? ' is-active' : '') + '" data-pv-subtab="' + i + '">' +
              esc(sg.label) + ' <span class="sy-pv-tabcount">(' + (sg.list || []).length + ')</span></button>';
          }).join('');
        }
      }
      if (!lst.length) {
        body.innerHTML = '<p class="sy-pv-empty">Bu bölümde önizlenecek soru bulunmuyor.</p>';
        navg.hidden = true; dots.hidden = true;
        return;
      }
      body.innerHTML = '<div class="sy-pv-single">' + previewQuestionHtml(lst[idx], idx) + '</div>';
      // Tek soruluk önizlemede gezinmeye gerek yok.
      var multi = lst.length > 1;
      navg.hidden = !multi;
      dots.hidden = !multi;
      if (multi) {
        ov.querySelector('[data-pv-counter]').textContent = (idx + 1) + ' / ' + lst.length;
        ov.querySelector('[data-pv-prev]').disabled = idx <= 0;
        ov.querySelector('[data-pv-next]').disabled = idx >= lst.length - 1;
        dots.innerHTML = lst.map(function (q, i) {
          return '<button type="button" class="sy-pv-dot' + (i === idx ? ' is-active' : '') + '" data-pv-go="' + i + '" title="' + (i + 1) + '. soru">' + (i + 1) + '</button>';
        }).join('');
      } else {
        // Tek soruluk gruba geçildiğinde önceki grubun noktaları/sayacı kalmasın.
        dots.innerHTML = '';
        ov.querySelector('[data-pv-counter]').textContent = '';
      }
    }
    function go(n) { if (n < 0 || n >= cur().length) return; idx = n; draw(); }
    draw();

    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (cur().length < 2) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var tb = e.target.closest('[data-pv-tab]');
      if (tb) { gi = parseInt(tb.getAttribute('data-pv-tab'), 10) || 0; si = 0; idx = 0; draw(); return; }
      var sb = e.target.closest('[data-pv-subtab]');
      if (sb) { si = parseInt(sb.getAttribute('data-pv-subtab'), 10) || 0; idx = 0; draw(); return; }
      if (e.target.closest('[data-pv-prev]')) { go(idx - 1); return; }
      if (e.target.closest('[data-pv-next]')) { go(idx + 1); return; }
      var d = e.target.closest('[data-pv-go]');
      if (d) go(parseInt(d.getAttribute('data-pv-go'), 10));
    });
  }
  // Sınav önizlemesi: Sayısal / Sözel üst sekmeleri, altlarında ders sekmeleri.
  var SUBJECT_SHORT = { religion: 'DKAB' };
  function subjectShort(id) { return SUBJECT_SHORT[id] || (SUBJ[id] ? SUBJ[id].name : id); }
  function sectionGroups(all) {
    function subsOf(sec) {
      return SUBJECTS.filter(function (s) { return s.section === sec; }).map(function (s) {
        return { id: s.id, label: subjectShort(s.id), list: all.filter(function (q) { return q.subject === s.id; }) };
      });
    }
    function total(subs) { return subs.reduce(function (n, x) { return n + x.list.length; }, 0); }
    var num = subsOf('numeric'), ver = subsOf('verbal');
    return [
      { id: 'numeric', label: 'Sayısal', subs: num, count: total(num) },
      { id: 'verbal', label: 'Sözel', subs: ver, count: total(ver) }
    ];
  }
  // Bir sınavın tüm soruları: önce ders sırası, sonra soru sırası.
  function examQuestionsOrdered(key, grade, no, subject) {
    var subjOrder = {}; SUBJECTS.forEach(function (s, i) { subjOrder[s.id] = i; });
    return db.questions.filter(function (q) { return isExamQ(key, q, grade, no, subject); })
      .sort(function (a, b) {
        var sa = subjOrder[a.subject] == null ? 99 : subjOrder[a.subject];
        var sb = subjOrder[b.subject] == null ? 99 : subjOrder[b.subject];
        if (sa !== sb) return sa - sb;
        return (a.order || 0) - (b.order || 0);
      });
  }

  function qCode(q) {
    var id = String(q.id || '');
    // Haftalık ödevlerde sorular havuzdan türetilir; kendi kimlikleri yok →
    // doğrudan havuz kodunu göster (havuzdaki karşılığı bir bakışta bulunsun).
    if (id.indexOf('wq-') === 0 && q.poolId) return 'SH-' + String(q.poolId).replace(/^pool-/, '').padStart(4, '0');
    var m = id.match(/^question-(\d+)$/);
    if (m) return 'SR-' + m[1].padStart(4, '0');
    return 'SR-' + (id.replace(/^question-/, '').toUpperCase() || '0000');
  }
  function rowActions(q) {
    return '<td class="sy-td-act"><span class="tm-row-actions">' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-preview="' + q.id + '" title="Soruyu önizle">' + PREVIEW_ICON + '</button>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-info="' + q.id + '" title="Soru künyesi ve değişiklik geçmişi">' + INFO_ICON + '</button>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-edit="' + q.id + '" title="Düzenle">' + EDIT_ICON + '</button>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-sy-del="' + q.id + '" title="Sil">' + DEL_ICON + '</button>' +
    '</span></td>';
  }
  // Sınav akışı tablosu — sütun düzeni: Soru ID, [Ay], Sınıf, Ders, Konu, Alt Konu, Tip, Puan, Cevap, Ekleyen Kişi, Durum.
  function examListHtml(key, list) {
    var s = SECTIONS[key];
    if (!list.length) {
      var any = db.questions.some(function (q) { return q.contentType === s.contentType; });
      return '<p class="tm-empty sy-empty">' + (any ? 'Bu filtrelere uygun soru bulunmuyor.' : 'Henüz soru eklenmemiş.') + '</p>';
    }
    var head = '<th class="sy-th-drag"></th><th class="sy-col-id">Soru ID</th>' + (s.hasMonth ? '<th>Ay</th>' : '') +
      '<th>Sınıf</th><th>Ders</th><th>Konu</th><th>Alt Konu</th><th>Tip</th><th>Puan</th><th>Cevap</th><th>Ekleyen Kişi</th><th>Durum</th><th>İşlem</th>';
    var rows = list.map(function (q) {
      var img = q.imageUrl ? ' <span class="sy-img-flag" title="Görsel var">' + IMG_ICON + '</span>' : '';
      return '<tr data-row="' + q.id + '">' +
        '<td class="sy-td-drag" draggable="true" data-drag="' + q.id + '" title="Sürükleyerek sırala">' + DRAG_ICON + '</td>' +
        '<td class="sy-col-id"><code class="tm-res-code-cell">' + esc(qCode(q)) + '</code>' + img + '</td>' +
        (s.hasMonth ? '<td>' + esc(MONTH[q.month] || '—') + '</td>' : '') +
        '<td>' + esc(gradeLabel(q.gradeLevel)) + '</td>' +
        '<td>' + esc(SUBJ[q.subject] ? SUBJ[q.subject].name : '—') + '</td>' +
        '<td>' + esc(q.topic || '—') + '</td>' +
        '<td class="sy-td-sub">' + esc(q.subTopic || '—') + '</td>' +
        '<td>' + esc(QTYPE_LABEL[q.questionType] || q.questionType) + '</td>' +
        '<td>' + (q.score != null ? q.score : '—') + '</td>' +
        '<td>' + correctSummary(q) + '</td>' +
        '<td>' + esc(q.addedBy || AUTHOR_NAME) + '</td>' +
        '<td>' + activeBadge(q) + '</td>' +
        rowActions(q) +
      '</tr>';
    }).join('');
    return '<div class="tm-res-table-wrap sy-table-wrap"><table class="tm-res-table sy-table"><thead><tr>' + head + '</tr></thead><tbody data-sy-rows>' + rows + '</tbody></table></div>';
  }

  function listHtml(key, list) {
    var s = SECTIONS[key];
    if (isExamFlow(key) || isWeeklyFlow(key)) return examListHtml(key, list);
    if (!list.length) {
      var anyForType = db.questions.some(function (q) { return q.contentType === s.contentType; });
      return '<p class="tm-empty sy-empty">' + (anyForType ? 'Bu filtrelere uygun soru bulunmuyor.' : 'Henüz soru eklenmemiş.') + '</p>';
    }
    var head = '<th class="sy-th-drag"></th><th>#</th><th>Soru</th>';
    if (s.hasMonth) head += '<th>Ay</th>';
    if (s.hasWeek) head += '<th>Hafta</th><th>Ders Tipi</th>';
    if (s.hasQuarter) head += '<th>Dönem</th>';
    head += '<th>Sınıf</th>';
    if (s.hasSubject) head += '<th>Ders</th><th>Konu</th>';
    if (s.attention) head += '<th>Görev</th><th>Süre</th>';
    head += '<th>Tip</th><th>Puan</th>';
    if (s.hasXp) head += '<th>XP</th>';
    head += '<th>Doğru</th><th>Durum</th><th>İşlem</th>';

    var rows = list.map(function (q, i) {
      var img = q.imageUrl ? '<span class="sy-img-flag" title="Görsel var">' + IMG_ICON + '</span>' : '';
      var cells = '<td class="sy-td-drag" draggable="true" data-drag="' + q.id + '" title="Sürükleyerek sırala">' + DRAG_ICON + '</td>' +
        '<td>' + (i + 1) + '</td>' +
        '<td class="sy-td-q">' + preview(q.questionText) + ' ' + img + '</td>';
      if (s.hasMonth) cells += '<td>' + esc(MONTH[q.month] || '—') + '</td>';
      if (s.hasWeek) cells += '<td>' + esc(q.educationWeek != null ? q.educationWeek + '. Hafta' : '—') + '</td><td>' + esc(LMODE[q.lessonMode] || '—') + '</td>';
      if (s.hasQuarter) cells += '<td>' + esc(QUARTER[q.quarter] || '—') + '</td>';
      cells += '<td>' + (q.attentionTestType === 'burdon' ? '—' : esc(gradeLabel(q.gradeLevel))) + '</td>';
      if (s.hasSubject) cells += '<td>' + esc(SUBJ[q.subject] ? SUBJ[q.subject].name : '—') + '</td><td>' + esc(q.topic || '—') + (q.subTopic ? ' · ' + esc(q.subTopic) : '') + '</td>';
      if (s.attention) {
        var isB = q.attentionTestType === 'burdon';
        cells += '<td>' + (isB ? 'Burdon Dikkat Testi' : esc(ATASK[q.attentionTaskType] || '—')) + '</td>' +
          '<td>' + (isB ? esc(burdonDurationLabel(q.durationSeconds)) : esc(q.timeLimitSeconds != null ? q.timeLimitSeconds + ' sn' : '—')) + '</td>';
      }
      cells += '<td>' + (q.attentionTestType === 'burdon' ? 'Burdon Testi' : esc(QTYPE_LABEL[q.questionType] || q.questionType)) + '</td>' +
        '<td>' + (q.attentionTestType === 'burdon' ? (q.totalTargets || 0) + ' hedef' : (q.score != null ? q.score : '—')) + '</td>';
      if (s.hasXp) cells += '<td>' + (q.xp != null ? q.xp : '—') + '</td>';
      cells += '<td>' + (q.attentionTestType === 'burdon' ? esc((q.targetLetters || []).join(', ')) : correctSummary(q)) + '</td>' +
        '<td>' + activeBadge(q) + '</td>' + rowActions(q);
      return '<tr data-row="' + q.id + '">' + cells + '</tr>';
    }).join('');
    return '<div class="tm-res-table-wrap sy-table-wrap"><table class="tm-res-table sy-table"><thead><tr>' + head + '</tr></thead><tbody data-sy-rows>' + rows + '</tbody></table></div>';
  }

  /* ----------------------------- Sınav akışı: sınav kartları ----------------------------- */
  // "placement:5-2" → {section:'placement', grade:'5', no:2}
  function parseExamKey(k) {
    var i = k.indexOf(':'); if (i < 0) return null;
    var sec = k.slice(0, i); var rest = k.slice(i + 1);
    var j = rest.lastIndexOf('-'); if (j < 0) return null;
    return { section: sec, grade: rest.slice(0, j), no: parseInt(rest.slice(j + 1), 10) };
  }
  function examsFor(key, grade) {
    var qs = db.questions.filter(function (q) { return q.contentType === ctOf(key) && q.gradeLevel === grade; });
    var nums = {};
    qs.forEach(function (q) { nums[q.examNo || 1] = true; });
    [1, 2, 3].forEach(function (n) { if (!(n in nums)) nums[n] = true; }); // en az 3 sınav kartı
    // Sonradan oluşturulan (henüz sorusu olmayan) sınavlar da kartlarda kalsın.
    Object.keys(db.examSubjects).forEach(function (k) {
      var p = parseExamKey(k);
      if (p && p.section === key && p.grade === grade) nums[p.no] = true;
    });
    // Silinen sınavlar (varsayılan 1-2-3 dâhil) geri gelmesin.
    Object.keys(db.examDeleted).forEach(function (k) {
      var p = parseExamKey(k);
      if (p && p.section === key && p.grade === grade) delete nums[p.no];
    });
    return Object.keys(nums).map(Number).sort(function (a, b) { return a - b; }).map(function (n) {
      var inExam = qs.filter(function (q) { return (q.examNo || 1) === n; });
      return { no: n, count: inExam.length, active: inExam.filter(function (q) { return q.isActive; }).length };
    });
  }
  var INFO_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  var CHECK_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var PENCIL_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  function examStatusBadge(status) {
    return status === 'published'
      ? '<span class="tm-badge tm-badge--green sy-status-badge">' + CHECK_ICON + ' Yayında</span>'
      : '<span class="tm-badge tm-badge--orange sy-status-badge">' + PENCIL_ICON + ' Düzenleniyor</span>';
  }
  function renderExamCards(key, grade) {
    var exams = examsFor(key, grade);
    var cards = exams.map(function (e) {
      var status = examStatusOf(key, grade, e.no);
      var toggleLabel = status === 'published' ? 'Taslağa al' : 'Yayına al';
      return '<article class="tm-dash-card sy-exam-card" data-sy-exam-open="' + e.no + '" role="button" tabindex="0">' +
        '<div class="tm-dash-card-head"><h2 class="tm-dash-card-title">' + esc(examNameOf(key, grade, e.no)) + '</h2>' +
          examStatusBadge(status) + '</div>' +
        '<div class="sy-exam-meta"><span><strong>' + e.count + '</strong> soru</span></div>' +
        examScheduleHtml(key, grade, e.no) +
        '<div class="sy-exam-foot">' +
          '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-exam-toggle" data-sy-exam-toggle="' + e.no + '">' + toggleLabel + '</button>' +
          '<span class="sy-exam-tools">' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-exam-preview="' + e.no + '" title="Sınavı önizle" aria-label="Sınavı önizle">' + PREVIEW_ICON + '</button>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-exam-info="' + e.no + '" title="Sınav künyesi" aria-label="Sınav künyesi">' + INFO_ICON + '</button>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-exam-edit="' + e.no + '" title="Sınavı düzenle" aria-label="Sınavı düzenle">' + EDIT_ICON + '</button>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-sy-exam-del="' + e.no + '" title="Sınavı sil" aria-label="Sınavı sil">' + DEL_ICON + '</button>' +
          '</span>' +
          '<span class="tm-btn tm-btn--primary tm-btn--sm sy-exam-open-btn" data-sy-exam-open="' + e.no + '">Sınavı Aç &rarr;</span>' +
        '</div>' +
      '</article>';
    }).join('');
    var nextNo = (exams.length ? Math.max.apply(null, exams.map(function (e) { return e.no; })) : 0) + 1;
    cards += '<button type="button" class="sy-exam-card sy-exam-add" data-sy-exam-new="' + nextNo + '"><span class="sy-exam-add-plus">+</span><span>Yeni Sınav ekle (' + nextNo + ')</span></button>';
    return '<div class="sy-exam-grid">' + cards + '</div>';
  }

  // Sınav içindeki ders kartları — her ders farklı renk + ikon, soru sayısı, "Sınavı Düzenle".
  function renderSubjectCards(key, grade, exam) {
    var qs = db.questions.filter(function (q) { return isExamQ(key, q, grade, exam); });
    var allowed = examSubjectsOf(key, grade, exam);
    var cards = SUBJECTS.filter(function (sub) { return allowed.indexOf(sub.id) >= 0; }).map(function (sub) {
      var st = subjectStyle(sub.id);
      var count = qs.filter(function (q) { return q.subject === sub.id; }).length;
      return '<article class="tm-dash-card sy-subject-card" data-sy-subject="' + sub.id + '" role="button" tabindex="0" style="--sy-c:' + st.color + '">' +
        '<div class="sy-subject-top"><span class="sy-subject-icon">' + st.icon + '</span>' +
          '<span class="sy-subject-titles"><h2 class="sy-subject-name">' + esc(sub.name) + '</h2>' +
            '<span class="sy-subject-tag">' + esc(SECTION_LABEL[sub.section]) + '</span></span>' +
          '<span class="sy-subject-tools">' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-subject-preview="' + sub.id + '" title="Bu dersin sorularını önizle" aria-label="Önizle">' + PREVIEW_ICON + '</button>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger sy-subject-del" data-sy-subject-del="' + sub.id + '" title="Dersi sınavdan kaldır" aria-label="Dersi sınavdan kaldır">' + DEL_ICON + '</button>' +
          '</span></div>' +
        '<div class="sy-exam-meta"><span><strong>' + count + '</strong> soru</span></div>' +
        '<span class="tm-btn tm-btn--primary tm-btn--sm sy-subject-edit" data-sy-subject="' + sub.id + '">Sınavı Düzenle &rarr;</span>' +
      '</article>';
    }).join('');
    return '<div class="sy-exam-grid sy-subject-grid">' + cards + '</div>';
  }
  function bindSubjectCards(main) {
    var key = activeSection, st = ES(key);
    main.querySelectorAll('[data-sy-subject]').forEach(function (el) {
      function open() { st.subject = el.getAttribute('data-sy-subject'); renderSection(); pushNav(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    main.querySelectorAll('[data-sy-subject-preview]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var sid = el.getAttribute('data-sy-subject-preview');
        openPreview(examQuestionsOrdered(key, st.grade, st.exam, sid),
          (SUBJ[sid] ? SUBJ[sid].name : sid) + ' — Soru Önizleme',
          examNameOf(key, st.grade, st.exam) + ' · ' + gradeLabel(st.grade));
      });
    });
    main.querySelectorAll('[data-sy-subject-del]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmDeleteExamSubject(key, st.grade, st.exam, el.getAttribute('data-sy-subject-del'));
      });
    });
    var back = main.querySelector('[data-sy-subject-back]');
    if (back) back.addEventListener('click', function () { history.back(); });
  }

  /* ============================ SORU HAVUZU ============================ */
  function poolList() {
    var f = poolFilters;
    var list = db.pool.filter(function (p) { return (p.poolType || 'academic') === poolGroup; });
    if (f.q) {
      var qq = f.q.toLowerCase();
      list = list.filter(function (p) {
        return ((p.questionText || '') + ' ' + (p.topic || '') + ' ' + (p.subTopic || '') + ' ' + (p.addedBy || '') + ' ' + p.id).toLowerCase().indexOf(qq) >= 0;
      });
    }
    if (f.gradeLevel !== 'all') list = list.filter(function (p) { return p.gradeLevel === f.gradeLevel; });
    if (poolGroup === 'academic' && f.subject !== 'all') list = list.filter(function (p) { return p.subject === f.subject; });
    if (f.questionType !== 'all') list = list.filter(function (p) { return p.questionType === f.questionType; });
    return list;
  }
  function poolById(id) { return db.pool.find(function (p) { return p.id === id; }); }
  function poolCode(p) {
    var id = String(p.id || '');
    var m = id.match(/^pool-(\d+)$/);
    if (m) return 'SH-' + m[1].padStart(4, '0');
    return 'SH-' + (id.replace(/^pool-/, '').toUpperCase() || '0000');
  }
  // Havuz sorusunun kullanıldığı materyaller — sınav/ödev sorularından türetilir.
  function poolUsage(poolId) {
    return db.questions.filter(function (q) { return q.poolId === poolId; }).map(function (q) {
      var sec = NAV_ORDER.filter(function (k) { return SECTIONS[k].contentType === q.contentType; })[0];
      var s = sec ? SECTIONS[sec] : null;
      var name = s ? s.label : q.contentType;
      var detail = [];
      if (s && s.examFlow) detail.push(examNameOf(sec, q.gradeLevel, q.examNo || 1));
      if (s && s.hasMonth && q.month) detail.push(MONTH[q.month] || q.month);
      if (s && s.hasWeek && q.educationWeek != null) detail.push(q.educationWeek + '. Hafta');
      if (s && s.hasQuarter && q.quarter) detail.push(QUARTER[q.quarter] || q.quarter);
      return {
        material: name, detail: detail.join(' · ') || '—',
        grade: gradeLabel(q.gradeLevel),
        subject: q.subject ? (SUBJ[q.subject] ? SUBJ[q.subject].name : q.subject) : '—',
        status: q.isActive
      };
    });
  }
  function poolHistoryOf(poolId) {
    return db.poolHistory.filter(function (h) { return h.questionId === poolId; })
      .sort(function (a, b) { return String(b.changedAt).localeCompare(String(a.changedAt)); });
  }
  function correctText(p) {
    if (p.questionType === 'multiple_choice') { var c = (p.options || []).find(function (o) { return o.isCorrect; }); return c ? (c.id + (c.text ? ' · ' + c.text : '')) : '—'; }
    if (p.questionType === 'text_answer') return p.correctTextAnswer || '—';
    if (p.questionType === 'number_answer') return p.correctNumberAnswer != null ? String(p.correctNumberAnswer) : '—';
    if (p.questionType === 'multi_select_attention') return (p.targetItems || []).join(', ') || '—';
    return '—';
  }

  function renderPool() {
    var main = document.getElementById('syMain');
    var s = SECTIONS.pool;
    var grp = s.groups.filter(function (g) { return g.id === poolGroup; })[0];
    var isAcademic = poolGroup === 'academic';
    var f = poolFilters;
    var els = [];
    els.push('<input type="search" class="tm-dg-control tm-dg-search" data-pool-filter="q" placeholder="Soru, konu veya kişi ara…" value="' + esc(f.q) + '">');
    if (isAcademic) els.push(selectPool('gradeLevel', 'Tüm sınıflar', GRADES.map(function (g) { return { v: g, l: gradeLabel(g) }; }), f.gradeLevel));
    if (isAcademic) els.push(selectPool('subject', 'Tüm dersler', SUBJECTS.map(function (x) { return { v: x.id, l: x.name }; }), f.subject));
    if (isAcademic) els.push(selectPool('questionType', 'Tüm tipler',
      ['multiple_choice', 'text_answer', 'number_answer'].map(function (t) { return { v: t, l: QTYPE_LABEL[t] }; }), f.questionType));

    main.innerHTML =
      '<div class="sy-page-head"><h1 class="sy-page-title">Soru Havuzu · ' + esc(grp.label) + '</h1>' +
        '<p class="sy-page-sub">' + esc(s.desc) + '</p></div>' +
      '<section class="tm-panel tm-panel--datagrid sy-panel">' +
        '<div class="tm-dg-toolbar"><div class="tm-dg-toolbar-row sy-filter-row">' + els.join('') +
          '<span class="tm-dg-spacer"></span>' +
          '<button type="button" class="tm-btn tm-btn--primary tm-btn--sm" data-pool-add>' + (isAcademic ? '+ Soru ekle' : '+ Yeni Burdon Testi') + '</button>' +
          '<span class="tm-dg-count" data-pool-count>—</span></div></div>' +
        '<div class="sy-list" data-pool-list></div>' +
      '</section>';

    var list = poolList();
    var pages = Math.max(1, Math.ceil(list.length / POOL_PAGE_SIZE));
    if (poolPage > pages) poolPage = pages;
    var slice = list.slice((poolPage - 1) * POOL_PAGE_SIZE, poolPage * POOL_PAGE_SIZE);
    main.querySelector('[data-pool-count]').textContent = list.length + ' soru';
    main.querySelector('[data-pool-list]').innerHTML = poolTableHtml(slice, isAcademic) +
      pagerHtml(poolPage, pages, list.length, 'data-pool-page');
    bindPool(main);
  }
  function selectPool(field, allLabel, options, cur) {
    return '<select class="tm-dg-control tm-dg-select" data-pool-filter="' + field + '"><option value="all">' + esc(allLabel) + '</option>' +
      options.map(function (o) { return opt(o.v, o.l, cur === o.v); }).join('') + '</select>';
  }
  function poolTableHtml(list, isAcademic) {
    if (!list.length) return '<p class="tm-empty sy-empty">Bu filtrelere uygun soru bulunmuyor.</p>';
    var head = isAcademic
      ? '<th class="sy-col-id">Soru ID</th><th>Sınıf Seviyesi</th><th>Ders</th><th>Konu</th><th>Alt Konu</th><th>Tip</th><th>Puan</th><th>Cevap</th><th>Ekleyen Kişi</th><th>İşlem</th>'
      : '<th class="sy-col-id">Test ID</th><th>Test Adı</th><th>Süre</th><th>Hedef Harfler</th><th>Toplam Hedef</th><th>Satır × Harf</th><th>Ekleyen Kişi</th><th>İşlem</th>';
    var rows = list.map(function (p) {
      var cells = isAcademic
        ? '<td class="sy-col-id"><code class="tm-res-code-cell">' + esc(poolCode(p)) + '</code></td>' +
          '<td>' + esc(gradeLabel(p.gradeLevel)) + '</td>' +
          '<td>' + esc(SUBJ[p.subject] ? SUBJ[p.subject].name : '—') + '</td>' +
          '<td>' + esc(p.topic || '—') + '</td>' +
          '<td class="sy-td-sub">' + esc(p.subTopic || '—') + '</td>' +
          '<td>' + esc(QTYPE_LABEL[p.questionType] || p.questionType) + '</td>' +
          '<td>' + (p.score != null ? p.score : '—') + '</td>' +
          '<td class="sy-td-sub">' + esc(correctText(p)) + '</td>' +
          '<td>' + esc(p.addedBy || AUTHOR_NAME) + '</td>'
        // Dikkat grubu: Burdon testi künyesi (sınıf seviyesi yoktur)
        : '<td class="sy-col-id"><code class="tm-res-code-cell">' + esc(poolCode(p)) + '</code></td>' +
          '<td>' + esc(p.questionText || 'Burdon Dikkat Testi') + '</td>' +
          '<td>' + esc(burdonDurationLabel(p.durationSeconds)) + '</td>' +
          '<td>' + esc((p.targetLetters || []).join(', ')) + '</td>' +
          '<td><strong>' + (p.totalTargets || 0) + '</strong></td>' +
          '<td>' + (p.rows || 0) + ' × ' + (p.perRow || 0) + '</td>' +
          '<td>' + esc(p.addedBy || AUTHOR_NAME) + '</td>';
      return '<tr data-pool-row="' + p.id + '">' + cells +
        '<td class="sy-td-act"><span class="tm-row-actions">' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-pool-preview="' + p.id + '" title="Soruyu önizle" aria-label="Soruyu önizle">' + PREVIEW_ICON + '</button>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-pool-info="' + p.id + '" title="Soru künyesi ve geçmişi" aria-label="Soru künyesi">' + INFO_ICON + '</button>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-pool-edit="' + p.id + '" title="Düzenle" aria-label="Düzenle">' + EDIT_ICON + '</button>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-pool-del="' + p.id + '" title="Sil" aria-label="Sil">' + DEL_ICON + '</button>' +
        '</span></td></tr>';
    }).join('');
    return '<div class="tm-res-table-wrap sy-table-wrap"><table class="tm-res-table sy-table"><thead><tr>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function bindPool(main) {
    main.querySelectorAll('[data-pool-page]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        poolPage = parseInt(b.getAttribute('data-pool-page'), 10) || 1;
        renderPool();
      });
    });
    main.querySelectorAll('[data-pool-filter]').forEach(function (el) {
      var fld = el.getAttribute('data-pool-filter');
      function apply() { poolFilters[fld] = el.value; poolPage = 1; renderPool(); }
      if (el.tagName === 'INPUT') el.addEventListener('input', (U && U.debounce) ? U.debounce(apply, 200) : apply);
      else el.addEventListener('change', apply);
    });
    main.querySelectorAll('[data-pool-preview]').forEach(function (b) {
      b.addEventListener('click', function () {
        var pq2 = poolById(b.getAttribute('data-pool-preview'));
        if (!pq2) return;
        if (pq2.poolType === 'attention') { openBurdonPreview(pq2); return; }
        openPreview([pq2], 'Soru Önizleme', 'Soru Havuzu · ' + poolCode(pq2));
      });
    });
    main.querySelectorAll('[data-pool-info]').forEach(function (b) { b.addEventListener('click', function () { openPoolDrawer(b.getAttribute('data-pool-info')); }); });
    main.querySelectorAll('[data-pool-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var pq2 = poolById(b.getAttribute('data-pool-edit'));
        if (pq2 && pq2.poolType === 'attention') { openBurdonEditor(pq2, true); return; }
        openPoolEditor(pq2);
      });
    });
    main.querySelectorAll('[data-pool-del]').forEach(function (b) { b.addEventListener('click', function () { confirmDeletePool(b.getAttribute('data-pool-del')); }); });
    var add = main.querySelector('[data-pool-add]');
    if (add) add.addEventListener('click', function () {
      if (poolGroup === 'attention') { openBurdonEditor(null, true); return; }
      openPoolEditor(null);
    });
  }
  function confirmDeletePool(id) {
    var p = poolById(id); if (!p) return;
    var used = poolUsage(id).length;
    function doDel() {
      db.pool = db.pool.filter(function (x) { return x.id !== id; });
      db.poolHistory = db.poolHistory.filter(function (h) { return h.questionId !== id; });
      saveDb(); renderPool(); toast('Soru havuzdan silindi.');
    }
    var warn = '“' + (p.questionText || '').slice(0, 60) + '” sorusunu havuzdan silmek istediğinize emin misiniz?' +
      (used ? ' Bu soru ' + used + ' materyalde kullanılıyor; materyallerdeki kopyalar silinmez.' : '');
    if (Confirm) Confirm.open({ title: 'Havuz sorusunu sil', warning: warn, requireReason: false, confirmLabel: 'Sil', cancelLabel: 'Vazgeç', danger: true, onConfirm: doDel });
    else if (window.confirm(warn)) doDel();
  }

  /* ---- Havuz sorusu künyesi + geçmişi (sağ drawer) ---- */
  function openPoolDrawer(id) {
    var p = poolById(id); if (!p) return;
    var existing = document.getElementById('syPoolDrawer');
    if (existing) existing.remove();
    var hist = poolHistoryOf(id);
    var usage = poolUsage(id);
    var isAcademic = (p.poolType || 'academic') === 'academic';

    var infoHtml = '<div class="tm-detail-grid tm-detail-grid--modal">' +
      cellHtml('Soru ID', '<code class="tm-res-code-cell">' + esc(poolCode(p)) + '</code>') +
      cellHtml('Sınıf Seviyesi', esc(gradeLabel(p.gradeLevel))) +
      (isAcademic ? cellHtml('Ders', esc(SUBJ[p.subject] ? SUBJ[p.subject].name : '—')) : cellHtml('Görev', esc(ATASK[p.attentionTaskType] || '—'))) +
      (isAcademic ? cellHtml('Konu', esc(p.topic || '—')) + cellHtml('Alt Konu', esc(p.subTopic || '—')) : '') +
      cellHtml('Tip', esc(QTYPE_LABEL[p.questionType] || p.questionType)) +
      cellHtml('Puan', String(p.score != null ? p.score : '—')) +
      cellHtml('Cevap', esc(correctText(p))) +
      cellHtml('Ekleyen Kişi', esc(p.addedBy || AUTHOR_NAME)) +
      cellHtml('Eklenme Tarihi', esc(fmtDateTime(p.createdAt))) +
      '</div>';

    var histHtml = hist.length
      ? '<table class="tm-inner-table"><thead><tr><th>Tarih & Saat</th><th>Değiştiren</th><th>Alan</th><th>Eski Durum</th><th>Yeni Durum</th></tr></thead><tbody>' +
        hist.map(function (h) {
          return '<tr><td>' + esc(fmtDateTime(h.changedAt)) + '</td><td>' + esc(h.changedBy) + '</td><td>' + esc(h.label) + '</td>' +
            '<td><span class="tm-audit-old">' + esc(h.previousValue == null || h.previousValue === '' ? '—' : h.previousValue) + '</span></td>' +
            '<td><span class="tm-audit-new">' + esc(h.newValue == null || h.newValue === '' ? '—' : h.newValue) + '</span></td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="tm-empty">Bu soruda henüz değişiklik yapılmamış.</p>';

    var useHtml = usage.length
      ? '<table class="tm-inner-table"><thead><tr><th>Materyal</th><th>Ayrıntı</th><th>Sınıf</th><th>Ders</th><th>Durum</th></tr></thead><tbody>' +
        usage.map(function (u) {
          return '<tr><td>' + esc(u.material) + '</td><td>' + esc(u.detail) + '</td><td>' + esc(u.grade) + '</td><td>' + esc(u.subject) + '</td>' +
            '<td>' + (u.status ? '<span class="tm-badge tm-badge--green">Aktif</span>' : '<span class="tm-badge tm-badge--muted">Pasif</span>') + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="tm-empty">Bu soru henüz hiçbir materyalde kullanılmamış.</p>';

    var ov = document.createElement('div');
    ov.className = 'tm-drawer-overlay'; ov.id = 'syPoolDrawer';
    ov.innerHTML =
      '<aside class="tm-drawer" role="dialog" aria-modal="true">' +
        '<header class="tm-drawer-head"><div>' +
          '<h2 class="tm-drawer-title">' + esc(poolCode(p)) + '</h2>' +
          '<p class="tm-drawer-sub">' + esc((p.questionText || '').slice(0, 90)) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-drawer-tabs">' +
          '<button type="button" class="tm-drawer-tab is-active" data-ptab="info">Soru Bilgileri</button>' +
          '<button type="button" class="tm-drawer-tab" data-ptab="history">Değişiklik Geçmişi' + (hist.length ? ' (' + hist.length + ')' : '') + '</button>' +
          '<button type="button" class="tm-drawer-tab" data-ptab="usage">Kullanıldığı Materyaller' + (usage.length ? ' (' + usage.length + ')' : '') + '</button>' +
        '</div>' +
        '<div class="tm-drawer-body">' +
          '<div data-ppane="info">' + infoHtml + '</div>' +
          '<div data-ppane="history" hidden>' + histHtml + '</div>' +
          '<div data-ppane="usage" hidden>' + useHtml + '</div>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(ov);
    void ov.offsetWidth; // reflow — geçiş çalışsın (rAF arka planda kısılabiliyor)
    ov.classList.add('is-open');
    function close() { ov.classList.remove('is-open'); document.removeEventListener('keydown', onKey); setTimeout(function () { if (ov.parentNode) ov.remove(); }, 250); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var tab = e.target.closest('[data-ptab]');
      if (tab) {
        var id2 = tab.getAttribute('data-ptab');
        ov.querySelectorAll('[data-ptab]').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        ov.querySelectorAll('[data-ppane]').forEach(function (pane) { pane.hidden = pane.getAttribute('data-ppane') !== id2; });
      }
    });
  }
  function cellHtml(label, val) { return '<div><div class="tm-detail-cell-label">' + esc(label) + '</div><div class="tm-detail-cell-value">' + val + '</div></div>'; }

  /* ---- Havuz sorusu ekle / düzenle ----
     Sınav/ödev editörüyle AYNI kabuk: giriş yöntemi seçimi + 3 sekme
     (Soru Bilgileri / Soru İçeriği / Cevap). Havuzda sınıf ve ders serbestçe seçilir. */
  function poolSection() {
    return poolGroup === 'attention'
      ? { label: 'Soru Havuzu · Dikkat Soruları', hasSubject: false, hasMonth: false, hasWeek: false, hasQuarter: false, hasXp: false, attention: true, poolEditor: true }
      : { label: 'Soru Havuzu · Akademik Sorular', hasSubject: true, hasMonth: false, hasWeek: false, hasQuarter: false, hasXp: false, attention: false, poolEditor: true };
  }
  function newPoolQuestion() {
    var isAcademic = poolGroup !== 'attention';
    return {
      id: nowSeq('pool'), poolType: poolGroup, inputMode: 'manual',
      gradeLevel: '5',
      subject: isAcademic ? 'mathematics' : undefined,
      section: 'numeric', topic: '', subTopic: '',
      questionText: '', aboveImageHtml: '', belowImageHtml: '', resultHtml: '', imageUrl: null, vectorFileName: null,
      questionType: isAcademic ? 'multiple_choice' : 'multi_select_attention',
      options: [{ id: 'A', text: '', isCorrect: true }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }],
      correctTextAnswer: '', correctNumberAnswer: null, caseSensitive: false, score: 10,
      attentionTaskType: 'find_target_letters', instruction: '', timeLimitSeconds: 60,
      allowMultipleSelection: true, targetItems: [], distractorItems: [], correctTargetsCount: 1,
      addedBy: AUTHOR_NAME, createdAt: new Date().toISOString()
    };
  }
  function openPoolEditor(p) {
    var s = poolSection();
    var isNew = !p;
    var d = p ? JSON.parse(JSON.stringify(p)) : newPoolQuestion();
    d._isNew = isNew;
    d._modeChosen = !isNew;
    if (!d.inputMode) d.inputMode = 'manual';
    var existing = document.getElementById('syPoolEditModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syPoolEditModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-edit-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + (isNew ? 'Havuza Yeni Soru' : 'Havuz Sorusunu Düzenle') + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(s.label) + (isNew ? '' : ' · ' + esc(poolCode(d))) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body" data-editor-body></div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--ghost" data-close>İptal</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-pool-save>Kaydet</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('[data-editor-body]');
    renderEditorBody(body, s, d);

    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      if (e.target.closest('[data-pool-save]')) { if (savePoolEditor(body, s, d, isNew)) close(); }
    });
  }

  function savePoolEditor(body, s, d, isNew) {
    var before = isNew ? null : poolById(d.id);
    var isAcademic = !s.attention;
    var qt = s.attention ? 'multi_select_attention' : (readVal(body, 'questionType') || d.questionType);
    var mode = readVal(body, 'inputMode') || d.inputMode || 'manual';

    // İçerik: manuel modda zengin metin, vektörel modda dosya + kısa açıklama
    var aboveHtml = '', belowHtml = '', resHtml = '', qText = '', vecName = null;
    if (mode === 'vector') {
      qText = (readVal(body, 'questionText') || '').trim();
      vecName = (readVal(body, 'vectorFileName') || '').trim() || null;
    } else {
      aboveHtml = readRteHtml(body, 'aboveImageHtml');
      belowHtml = readRteHtml(body, 'belowImageHtml');
      resHtml = readRteHtml(body, 'resultHtml');
      qText = readRteText(body, 'aboveImageHtml') || readRteText(body, 'belowImageHtml');
    }

    var out = JSON.parse(JSON.stringify(isNew ? d : before));
    delete out._isNew; delete out._modeChosen;
    out.poolType = poolGroup;
    out.inputMode = mode;
    out.vectorFileName = vecName;
    out.gradeLevel = readVal(body, 'gradeLevel');
    out.questionText = qText;
    out.aboveImageHtml = aboveHtml;
    out.belowImageHtml = belowHtml;
    out.resultHtml = resHtml;
    out.imageUrl = (readVal(body, 'imageUrl') || '').trim() || null;
    out.score = parseInt(readVal(body, 'score'), 10) || 0;
    out.questionType = qt;

    if (!out.questionText && !(mode === 'vector' && out.imageUrl)) {
      toast(mode === 'vector' ? 'Vektörel soru için dosya veya kısa açıklama gereklidir.' : 'Görsel üstü metin (soru metni) zorunludur.', 'error');
      return false;
    }
    if (!out.questionText && out.imageUrl) out.questionText = 'Vektörel soru';

    if (isAcademic) {
      out.subject = readVal(body, 'subject');
      out.section = SUBJ[out.subject] ? SUBJ[out.subject].section : 'numeric';
      out.topic = (readVal(body, 'topic') || '').trim();
      out.subTopic = (readVal(body, 'subTopic') || '').trim();
    } else {
      out.attentionTaskType = readVal(body, 'attentionTaskType') || d.attentionTaskType;
      out.instruction = (readVal(body, 'instruction') || '').trim();
    }

    out.options = []; out.correctTextAnswer = null; out.correctNumberAnswer = null;
    if (qt === 'multiple_choice') {
      var correct = body.querySelector('input[name="syCorrect"]:checked');
      var cid = correct ? correct.value : 'A';
      out.options = ['A', 'B', 'C', 'D'].map(function (id) {
        var inp = body.querySelector('[data-opt="' + id + '"]');
        return { id: id, text: inp ? inp.value.trim() : '', isCorrect: id === cid };
      });
      if (out.options.every(function (o) { return !o.text; })) { toast('En az bir şık metni giriniz.', 'error'); return false; }
    } else if (qt === 'text_answer') {
      out.correctTextAnswer = (readVal(body, 'correctTextAnswer') || '').trim();
      out.caseSensitive = !!readVal(body, 'caseSensitive');
    } else if (qt === 'number_answer') {
      var n = readVal(body, 'correctNumberAnswer');
      out.correctNumberAnswer = n === '' || n == null ? null : Number(n);
    } else if (qt === 'multi_select_attention') {
      out.timeLimitSeconds = parseInt(readVal(body, 'timeLimitSeconds'), 10) || 60;
      out.allowMultipleSelection = !!readVal(body, 'allowMultipleSelection');
      out.targetItems = (readVal(body, 'targetItems') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      out.distractorItems = (readVal(body, 'distractorItems') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      out.correctTargetsCount = parseInt(readVal(body, 'correctTargetsCount'), 10) || 0;
    }

    if (isNew) {
      out.addedBy = AUTHOR_NAME;
      out.createdAt = new Date().toISOString();
      db.pool.push(out);
    } else {
      // Değişen alanları geçmişe yaz: eski durum → yeni durum + değiştiren kişi
      var fields = [
        { f: 'gradeLevel', l: 'Sınıf Seviyesi', fmt: gradeLabel },
        { f: 'subject', l: 'Ders', fmt: function (v) { return SUBJ[v] ? SUBJ[v].name : v; } },
        { f: 'topic', l: 'Konu' },
        { f: 'subTopic', l: 'Alt Konu' },
        { f: 'questionType', l: 'Tip', fmt: function (v) { return QTYPE_LABEL[v] || v; } },
        { f: 'score', l: 'Puan' },
        { f: 'attentionTaskType', l: 'Görev', fmt: function (v) { return ATASK[v] || v; } },
        { f: 'questionText', l: 'Soru Metni' },
        { f: 'inputMode', l: 'Giriş Yöntemi', fmt: function (v) { return v === 'vector' ? 'Vektörel' : 'Elle yazılmış'; } }
      ];
      fields.forEach(function (fd) {
        var a = before[fd.f], b = out[fd.f];
        if (a === undefined && b === undefined) return;
        if (String(a == null ? '' : a) === String(b == null ? '' : b)) return;
        logPoolChange(out.id, fd.f, fd.l, fd.fmt ? fd.fmt(a) : a, fd.fmt ? fd.fmt(b) : b);
      });
      var beforeAns = correctText(before), afterAns = correctText(out);
      if (beforeAns !== afterAns) logPoolChange(out.id, 'correct', 'Cevap', beforeAns, afterAns);
      var idx = db.pool.findIndex(function (x) { return x.id === out.id; });
      if (idx >= 0) db.pool[idx] = out;
    }
    saveDb(); renderPool();
    toast(isNew ? 'Soru havuza eklendi.' : 'Havuz sorusu güncellendi.');
    return true;
  }
  function logPoolChange(questionId, field, label, prev, next) {
    db.poolHistory.push({
      id: nowSeq('plog'), questionId: questionId, field: field, label: label,
      previousValue: prev == null ? '' : String(prev), newValue: next == null ? '' : String(next),
      changedBy: AUTHOR_NAME, changedAt: new Date().toISOString()
    });
  }

  /* ---- "Soru seç": havuzdan mevcut materyale soru ekleme ---- */
  function openPoolPicker() {
    var s = SECTIONS[activeSection];
    var isAttention = !!s.attention;
    var wantType = isAttention ? 'attention' : 'academic';
    var st = isExamFlow() ? ES() : null;

    // Bu materyalde ZATEN bulunan havuz soruları listede hiç görünmesin.
    var usedIds = {};
    db.questions.forEach(function (q) {
      if (q.contentType !== s.contentType || !q.poolId) return;
      if (st) {
        if (q.gradeLevel !== st.grade) return;
        if ((q.examNo || 1) !== st.exam) return;
        if (s.hasSubject && st.subject && q.subject !== st.subject) return;
      }
      usedIds[q.poolId] = true;
    });
    // Sadece bu sınav/dersin sınıf seviyesine ve dersine uyan sorular.
    var candidates = db.pool.filter(function (p) {
      if ((p.poolType || 'academic') !== wantType) return false;
      if (usedIds[p.id]) return false;
      if (st) {
        if (st.grade && p.gradeLevel !== st.grade) return false;
        if (s.hasSubject && st.subject && p.subject !== st.subject) return false;
      }
      return true;
    });

    var selected = {};
    var page = 1;
    var PAGE_SIZE = 5;
    var search = '';

    var existing = document.getElementById('syPickModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syPickModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-pick-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">Havuzdan Soru Seç</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(editorContextLabel(s)) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body">' +
          '<input type="search" class="tm-dg-control tm-dg-search sy-pick-search" data-pick-search placeholder="Soru ID, konu veya alt konu ara…">' +
          '<div data-pick-list></div>' +
          '<div class="sy-pick-pager" data-pick-pager></div>' +
        '</div>' +
        '<footer class="tm-crit-foot"><span class="tm-dg-count" data-pick-count>0 soru seçildi</span>' +
          '<span class="tm-dg-spacer"></span>' +
          '<button type="button" class="tm-btn tm-btn--ghost" data-close>Vazgeç</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-pick-add>Seçilenleri Ekle</button></footer>' +
      '</div>';
    document.body.appendChild(ov);

    var listEl = ov.querySelector('[data-pick-list]');
    var pagerEl = ov.querySelector('[data-pick-pager]');

    function filtered() {
      if (!search) return candidates;
      var ft = search.toLowerCase();
      return candidates.filter(function (p) {
        return (poolCode(p) + ' ' + (p.topic || '') + ' ' + (p.subTopic || '') + ' ' + (ATASK[p.attentionTaskType] || '')).toLowerCase().indexOf(ft) >= 0;
      });
    }
    function selectedCount() { return Object.keys(selected).filter(function (k) { return selected[k]; }).length; }
    function draw() {
      var rows = filtered();
      var pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      if (page > pages) page = pages;
      var slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      if (!rows.length) {
        listEl.innerHTML = '<p class="tm-empty sy-empty">Bu sınav ve derse uygun, henüz eklenmemiş havuz sorusu bulunmuyor.</p>';
        pagerEl.innerHTML = '';
      } else {
        var head = '<th class="sy-pick-cb"></th><th class="sy-col-id">Soru ID</th>' +
          (isAttention ? '<th>Görev</th>' : '<th>Konu</th><th>Alt Konu</th>') +
          '<th>Tip</th><th>Puan</th><th>Önizle</th>';
        listEl.innerHTML = '<div class="tm-res-table-wrap"><table class="tm-res-table sy-table sy-pick-table"><thead><tr>' + head + '</tr></thead><tbody>' +
          slice.map(function (p) {
            return '<tr data-pick-row="' + p.id + '">' +
              '<td class="sy-pick-cb"><input type="checkbox" data-pick value="' + p.id + '"' + (selected[p.id] ? ' checked' : '') + '></td>' +
              '<td class="sy-col-id"><code class="tm-res-code-cell">' + esc(poolCode(p)) + '</code></td>' +
              (isAttention
                ? '<td>' + esc(ATASK[p.attentionTaskType] || '—') + '</td>'
                : '<td>' + esc(p.topic || '—') + '</td><td class="sy-td-sub">' + esc(p.subTopic || '—') + '</td>') +
              '<td>' + esc(QTYPE_LABEL[p.questionType] || p.questionType) + '</td>' +
              '<td>' + (p.score != null ? p.score : '—') + '</td>' +
              '<td class="sy-td-act"><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-pick-preview="' + p.id + '" title="Soruyu önizle">' + PREVIEW_ICON + '</button></td></tr>';
          }).join('') + '</tbody></table></div>';
        pagerEl.innerHTML = pagerHtml(page, pages, rows.length, 'data-pick-page');
      }
      ov.querySelector('[data-pick-count]').textContent = selectedCount() + ' soru seçildi';
    }
    draw();

    var searchEl = ov.querySelector('[data-pick-search]');
    searchEl.addEventListener('input', function () { search = searchEl.value; page = 1; draw(); });
    // Seçim sayfa değişse de korunur.
    listEl.addEventListener('change', function (e) {
      var cb = e.target.closest('[data-pick]');
      if (!cb) return;
      selected[cb.value] = cb.checked;
      ov.querySelector('[data-pick-count]').textContent = selectedCount() + ' soru seçildi';
    });
    // Satırın herhangi bir yerine tıklamak seçimi değiştirir; göz ikonu önizler.
    listEl.addEventListener('click', function (e) {
      var pvBtn = e.target.closest('[data-pick-preview]');
      if (pvBtn) {
        e.stopPropagation();
        var pq2 = poolById(pvBtn.getAttribute('data-pick-preview'));
        if (pq2) openPreview([pq2], 'Soru Önizleme', 'Soru Havuzu · ' + poolCode(pq2));
        return;
      }
      if (e.target.closest('[data-pick]')) return;
      var row = e.target.closest('[data-pick-row]');
      if (!row) return;
      var box = row.querySelector('[data-pick]');
      if (!box) return;
      box.checked = !box.checked;
      selected[box.value] = box.checked;
      ov.querySelector('[data-pick-count]').textContent = selectedCount() + ' soru seçildi';
    });

    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);

    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var pg = e.target.closest('[data-pick-page]');
      if (pg) { if (!pg.disabled) { page = parseInt(pg.getAttribute('data-pick-page'), 10) || 1; draw(); } return; }
      if (e.target.closest('[data-pick-add]')) {
        var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
        if (!ids.length) { toast('En az bir soru seçiniz.', 'error'); return; }
        var ctx = editorContextLabel(s);
        function doAdd() {
          var orders = questionsFor(activeSection).map(function (x) { return x.order || 0; });
          var next = (orders.length ? Math.max.apply(null, orders) : 0) + 1;
          ids.forEach(function (pid2) {
            var p = poolById(pid2); if (!p) return;
            var q = JSON.parse(JSON.stringify(p));
            q.id = nowSeq('question');
            q.poolId = p.id;
            q.contentType = s.contentType;
            q.order = next++;
            q.isActive = true;
            delete q.poolType; delete q.createdAt;
            if (st) { q.gradeLevel = st.grade; q.examNo = st.exam || 1; if (s.hasSubject && st.subject) q.subject = st.subject; }
            if (s.hasMonth) { q.month = q.month || 'january'; q.year = q.year || 2026; }
            if (s.hasWeek) { q.educationWeek = q.educationWeek || 1; q.lessonMode = q.lessonMode || 'RUD'; q.homeworkTitle = q.homeworkTitle || ''; }
            if (s.hasQuarter) q.quarter = q.quarter || 'q1';
            if (s.hasXp) q.xp = q.xp || 20;
            db.questions.push(q);
          });
          saveDb(); refreshList(); close();
          toast(ids.length + ' soru havuzdan eklendi.');
        }
        var warn = ids.length + ' soruyu “' + ctx + '” sınavına eklemek istediğinize emin misiniz?';
        if (Confirm) Confirm.open({ title: 'Soruları sınava ekle', warning: warn, requireReason: false, confirmLabel: 'Ekle', cancelLabel: 'Vazgeç', onConfirm: doAdd });
        else if (window.confirm(warn)) doAdd();
      }
    });
  }

  /* ============================ HAFTALIK ÖDEVLER ============================
     Sınıf → KİD/RUD → Ders → 1..32. Hafta → Sorular  */
  var MODE_STYLE = {
    KID: { color: '#0d9488', desc: 'Kavram İnşa Dersi haftalık ödevleri' },
    RUD: { color: '#7c3aed', desc: 'Rehberli Uygulama Dersi haftalık ödevleri' }
  };
  /* Haftalık ödevler havuzdan DETERMİNİSTİK üretilir (23.040 kayıt depolanamaz).
     Kural sabit olduğu için her açılışta aynı sorular gelir ve havuzla birebir tutarlıdır.
     Kullanıcının düzenlediği/sildiği sorular ayrıca saklanır ve üretilenleri geçersiz kılar. */
  var WEEKLY_PER_SUBJECT = 15;
  var TERM_START = new Date(2026, 8, 14); // 14 Eylül 2026, Pazartesi
  function weekRange(week) {
    var s = new Date(TERM_START.getTime()); s.setDate(s.getDate() + (week - 1) * 7);
    var e = new Date(s.getTime()); e.setDate(e.getDate() + 4); // Pzt–Cum
    function d2(n) { return String(n).padStart(2, '0'); }
    return { start: s, end: e, label: d2(s.getDate()) + '.' + d2(s.getMonth() + 1) + ' – ' + d2(e.getDate()) + '.' + d2(e.getMonth() + 1) + '.' + e.getFullYear() };
  }
  function weeklyPoolFor(grade, subject) {
    return db.pool.filter(function (p) {
      return (p.poolType || 'academic') === 'academic' && p.gradeLevel === grade && p.subject === subject;
    });
  }
  function weeklyGenId(grade, mode, subject, week, i) { return 'wq-' + grade + '-' + mode + '-' + subject + '-' + week + '-' + (i + 1); }
  function weeklyGenerated(grade, mode, subject, week) {
    var cands = weeklyPoolFor(grade, subject);
    if (!cands.length) return [];
    var out = [];
    var offset = ((week - 1) * 3 + (mode === 'KID' ? 0 : 5)) % cands.length;
    for (var i = 0; i < WEEKLY_PER_SUBJECT; i++) {
      var p = cands[(offset + i) % cands.length];
      var q = JSON.parse(JSON.stringify(p));
      delete q.poolType; delete q.createdAt;
      q.poolId = p.id;
      q.id = weeklyGenId(grade, mode, subject, week, i);
      q.contentType = 'weekly_homework';
      q.gradeLevel = grade; q.lessonMode = mode; q.subject = subject; q.educationWeek = week;
      q.homeworkTitle = week + '. Hafta ' + (LMODE[mode] || mode) + ' ' + (SUBJ[subject] ? SUBJ[subject].name : '') + ' Ödevi';
      q.order = i + 1;
      q.isActive = true;
      q.xp = 20;
      q.generated = true;
      out.push(q);
    }
    return out;
  }
  // Üretilenler + kullanıcı kayıtları (kullanıcı kaydı aynı id ile üretileni ezer)
  function weeklyResolved(grade, mode, subject, week) {
    var real = db.questions.filter(function (q) {
      return q.contentType === 'weekly_homework' && q.gradeLevel === grade &&
        q.lessonMode === mode && q.subject === subject && Number(q.educationWeek) === week;
    });
    var byId = {}; real.forEach(function (r) { byId[r.id] = true; });
    var gen = weeklyGenerated(grade, mode, subject, week).filter(function (g) {
      return !byId[g.id] && !db.weeklyDeleted[g.id];
    });
    return real.concat(gen).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  // Sayımlar analitik hesaplanır (23k nesne üretmeden).
  function weeklyCount(grade, mode, subject, week) {
    if (mode && subject && week != null) return weeklyResolved(grade, mode, subject, week).length;
    var perWeek = weeklyPoolFor(grade, subject || 'mathematics').length ? WEEKLY_PER_SUBJECT : 0;
    if (mode && subject) return perWeek * WEEKS.length;
    if (mode) {
      return SUBJECTS.reduce(function (n, s) { return n + (weeklyPoolFor(grade, s.id).length ? WEEKLY_PER_SUBJECT * WEEKS.length : 0); }, 0);
    }
    return 0;
  }
  function renderModeCards(grade) {
    return '<div class="sy-exam-grid">' + LESSON_MODES.map(function (m) {
      var st = MODE_STYLE[m.id] || { color: '#7a769e', desc: '' };
      var cnt = weeklyCount(grade, m.id);
      return '<article class="tm-dash-card sy-subject-card" data-sy-mode="' + m.id + '" role="button" tabindex="0" style="--sy-c:' + st.color + '">' +
        '<div class="sy-subject-top"><span class="sy-subject-icon">' + NAV_ICON.weekly + '</span>' +
          '<span class="sy-subject-titles"><h2 class="sy-subject-name">' + esc(m.name) + '</h2>' +
            '<span class="sy-subject-tag">' + esc(m.id) + '</span></span></div>' +
        '<p class="sy-mode-desc">' + esc(st.desc) + '</p>' +
        '<div class="sy-exam-meta"><span><strong>' + cnt + '</strong> soru</span></div>' +
        '<span class="tm-btn tm-btn--primary tm-btn--sm sy-subject-edit" data-sy-mode="' + m.id + '">Dersleri Aç &rarr;</span>' +
      '</article>';
    }).join('') + '</div>';
  }
  function renderWeeklySubjectCards(grade, mode) {
    return '<div class="sy-exam-grid sy-subject-grid">' + SUBJECTS.map(function (sub) {
      var stl = subjectStyle(sub.id);
      var cnt = weeklyCount(grade, mode, sub.id);
      return '<article class="tm-dash-card sy-subject-card" data-sy-wsubject="' + sub.id + '" role="button" tabindex="0" style="--sy-c:' + stl.color + '">' +
        '<div class="sy-subject-top"><span class="sy-subject-icon">' + stl.icon + '</span>' +
          '<span class="sy-subject-titles"><h2 class="sy-subject-name">' + esc(sub.name) + '</h2>' +
            '<span class="sy-subject-tag">' + esc(SECTION_LABEL[sub.section]) + '</span></span></div>' +
        '<div class="sy-exam-meta"><span><strong>' + cnt + '</strong> soru</span></div>' +
        '<span class="tm-btn tm-btn--primary tm-btn--sm sy-subject-edit" data-sy-wsubject="' + sub.id + '">Haftaları Aç &rarr;</span>' +
      '</article>';
    }).join('') + '</div>';
  }
  function renderWeekCards(grade, mode, subject) {
    // Kartlar ait oldukları dersin rengini taşısın.
    var stl = subjectStyle(subject);
    return '<div class="sy-week-grid" style="--sy-c:' + stl.color + '">' + WEEKS.map(function (n) {
      var cnt = weeklyCount(grade, mode, subject, n);
      var wr = weekRange(n);
      return '<div class="sy-week-card' + (cnt ? ' has-q' : '') + '" data-sy-week="' + n + '" role="button" tabindex="0">' +
        '<span class="sy-week-no">' + n + '</span>' +
        '<span class="sy-week-lbl">' + n + '. Hafta</span>' +
        '<span class="sy-week-date">' + esc(wr.label) + '</span>' +
        '<span class="sy-week-cnt">' + cnt + ' soru</span>' +
        '<button type="button" class="sy-week-pv" data-sy-week-preview="' + n + '" title="Bu haftayı önizle">' +
          PREVIEW_ICON + '<span>Önizle</span></button>' +
      '</div>';
    }).join('') + '</div>';
  }
  function weeklyCrumb(st) {
    var parts = [gradeLabel(st.grade)];
    if (st.mode) parts.push(LMODE[st.mode] || st.mode);
    if (st.subject && SUBJ[st.subject]) parts.push(SUBJ[st.subject].name);
    if (st.week != null) parts.push(st.week + '. Hafta');
    return parts.join(' · ');
  }
  function renderWeekly() {
    var main = document.getElementById('syMain');
    var s = SECTIONS.weekly;
    var st = ES('weekly');
    function head(back, title, sub) {
      return '<div class="sy-page-head">' +
        (back ? '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-back" data-sy-wback>&larr; ' + esc(back) + '</button>' : '') +
        '<h1 class="sy-page-title">' + esc(title) + '</h1><p class="sy-page-sub">' + esc(sub) + '</p></div>';
    }
    if (!st.mode) {
      main.innerHTML = head(null, s.label + ' · ' + gradeLabel(st.grade), 'Ders tipini seçin: KİD veya RUD.') + renderModeCards(st.grade);
      bindWeekly(main); return;
    }
    if (!st.subject) {
      main.innerHTML = head('Ders tiplerine dön', s.label + ' · ' + weeklyCrumb(st), 'Ödev eklemek istediğiniz dersi seçin.') + renderWeeklySubjectCards(st.grade, st.mode);
      bindWeekly(main); return;
    }
    if (st.week == null) {
      main.innerHTML = head('Derslere dön', s.label + ' · ' + weeklyCrumb(st), '1–32. haftalardan birini seçin.') + renderWeekCards(st.grade, st.mode, st.subject);
      bindWeekly(main); return;
    }
    main.innerHTML =
      '<div class="sy-page-head">' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-back" data-sy-wback>&larr; Haftalara dön</button>' +
        '<h1 class="sy-page-title">' + esc(s.label + ' · ' + weeklyCrumb(st)) + '</h1>' +
        '<p class="sy-page-sub">' + esc(s.desc) + '</p></div>' +
      '<section class="tm-panel tm-panel--datagrid sy-panel">' +
        '<div class="tm-dg-toolbar">' + filterBar('weekly') + '</div>' +
        '<div class="sy-list" data-sy-list><p class="tm-empty">Sorular yükleniyor…</p></div>' +
      '</section>';
    var listWrap = main.querySelector('[data-sy-list]');
    try {
      var list = questionsFor('weekly');
      listWrap.innerHTML = listHtml('weekly', list);
      var countEl = main.querySelector('[data-sy-count]');
      if (countEl) countEl.textContent = list.length + ' soru';
      bindSection(main);
      bindWeekly(main);
    } catch (err) {
      listWrap.innerHTML = '<p class="tm-empty sy-empty">Sorular yüklenemedi.</p>';
    }
  }
  function bindWeekly(main) {
    var st = ES('weekly');
    main.querySelectorAll('[data-sy-mode]').forEach(function (el) {
      function open() { st.mode = el.getAttribute('data-sy-mode'); st.subject = null; st.week = null; renderSection(); pushNav(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    main.querySelectorAll('[data-sy-wsubject]').forEach(function (el) {
      function open() { st.subject = el.getAttribute('data-sy-wsubject'); st.week = null; renderSection(); pushNav(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    main.querySelectorAll('[data-sy-week-preview]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var w = parseInt(el.getAttribute('data-sy-week-preview'), 10);
        openPreview(weeklyResolved(st.grade, st.mode, st.subject, w),
          w + '. Hafta · ' + (SUBJ[st.subject] ? SUBJ[st.subject].name : ''),
          SECTIONS.weekly.label + ' · ' + gradeLabel(st.grade) + ' · ' + (LMODE[st.mode] || st.mode) + ' · ' + weekRange(w).label);
      });
    });
    main.querySelectorAll('[data-sy-week]').forEach(function (el) {
      function open() { st.week = parseInt(el.getAttribute('data-sy-week'), 10); renderSection(); pushNav(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    var back = main.querySelector('[data-sy-wback]');
    if (back) back.addEventListener('click', function () { history.back(); });
  }

  /* ========================= BURDON DİKKAT TESTİ =========================
     Klasik dikkat sorusundan farklı: süreli bir harf tablosu üzerinde hedef
     harfleri (varsayılan A ve B) işaretleme testi. Sınıf seviyesi yoktur.
     Toplam hedef sayısı tablodan HESAPLANIR (elle girilmez) ki puanlama tutarlı olsun. */
  function burdonDefaults() {
    return {
      attentionTestType: 'burdon',
      questionText: 'Burdon Dikkat Testi',
      instruction: BURDON_INSTRUCTION,
      durationSeconds: 300,
      targetLetters: ['A', 'B'],
      rows: 20, perRow: 30, targetRatio: 30,
      allowBack: false,
      gradeLevel: null,
      seed: 20260914
    };
  }
  // Deterministik üretim: aynı tohum → aynı tablo (her açılışta veri değişmesin).
  function burdonRng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }
  function buildBurdonGrid(o) {
    var targets = (o.targetLetters || ['A', 'B']).map(function (x) { return String(x).toUpperCase(); }).filter(Boolean);
    if (!targets.length) targets = ['A', 'B'];
    var fillers = BURDON_LETTERS.filter(function (L) { return targets.indexOf(L) < 0; });
    var rnd = burdonRng(o.seed);
    var rows = Math.max(1, parseInt(o.rows, 10) || 20);
    var perRow = Math.max(1, parseInt(o.perRow, 10) || 30);
    var ratio = Math.min(80, Math.max(5, parseInt(o.targetRatio, 10) || 30));
    var grid = [], rowTargets = [], total = 0;
    for (var r = 0; r < rows; r++) {
      var row = [], rt = 0;
      for (var c = 0; c < perRow; c++) {
        if (rnd() * 100 < ratio) { row.push(targets[Math.floor(rnd() * targets.length)]); rt++; }
        else row.push(fillers[Math.floor(rnd() * fillers.length)]);
      }
      grid.push(row); rowTargets.push(rt); total += rt;
    }
    return { grid: grid, rowTargets: rowTargets, totalTargets: total };
  }
  function burdonRebuild(d) {
    var g = buildBurdonGrid(d);
    d.grid = g.grid; d.rowTargets = g.rowTargets; d.totalTargets = g.totalTargets;
    return d;
  }
  function burdonDurationLabel(sec) {
    var s = parseInt(sec, 10) || 0;
    var m = Math.floor(s / 60), r = s % 60;
    return m ? (m + ' dk' + (r ? ' ' + r + ' sn' : '')) : (s + ' sn');
  }
  function burdonGridHtml(d, marked) {
    if (!d.grid || !d.grid.length) return '<p class="tm-empty">Harf tablosu henüz oluşturulmadı.</p>';
    var targets = (d.targetLetters || []).map(function (x) { return String(x).toUpperCase(); });
    return '<div class="sy-burdon-grid">' + d.grid.map(function (row, i) {
      return '<div class="sy-burdon-row">' +
        '<span class="sy-burdon-rowno">' + (i + 1) + '</span>' +
        '<span class="sy-burdon-letters">' + row.map(function (L) {
          var isT = targets.indexOf(L) >= 0;
          return '<span class="sy-burdon-l' + (marked && isT ? ' is-target' : '') + '">' + esc(L) + '</span>';
        }).join('') + '</span>' +
        '<span class="sy-burdon-rowcnt">' + (d.rowTargets ? d.rowTargets[i] : '') + '</span>' +
      '</div>';
    }).join('') + '</div>';
  }
  // Puanlama kuralları — yalnızca panelde (soru yazarı/uygulayıcı) görünür.
  function burdonScoringHtml(d) {
    var total = d.totalTargets || 0;
    return '<div class="sy-burdon-score">' +
      '<p class="sy-burdon-note">Bu bölüm yalnızca panelde görünür; öğrenciye gösterilmez.</p>' +
      '<div class="tm-detail-grid tm-detail-grid--modal">' +
        cellHtml('Toplam Hedef Harf', '<strong>' + total + '</strong> (tablodan hesaplandı)') +
        cellHtml('Hedef Harfler', esc((d.targetLetters || []).join(', '))) +
        cellHtml('Süre', esc(burdonDurationLabel(d.durationSeconds))) +
        cellHtml('Geri Dönüş', d.allowBack ? 'İzin veriliyor' : 'İzin verilmiyor') +
      '</div>' +
      '<table class="tm-inner-table sy-burdon-formulas"><thead><tr><th>Ölçüm</th><th>Formül</th><th>Örnek (' + total + ' hedef)</th></tr></thead><tbody>' +
        '<tr><td>Doğru işaretleme</td><td>İşaretlenen hedef harf sayısı</td><td>150</td></tr>' +
        '<tr><td>Atlama</td><td>Toplam hedef − doğru</td><td>' + total + ' − 150 = ' + Math.max(0, total - 150) + '</td></tr>' +
        '<tr><td>Yanlış işaretleme</td><td>Hedef olmayan harflerin işaretlenmesi</td><td>12</td></tr>' +
        '<tr><td>Net puan</td><td>Doğru − Yanlış</td><td>150 − 12 = 138</td></tr>' +
        '<tr><td>Hata oranı</td><td>(Atlama + Yanlış) / Toplam hedef</td><td>' + (total ? '(' + Math.max(0, total - 150) + ' + 12) / ' + total + ' = %' + Math.round((Math.max(0, total - 150) + 12) / total * 100) : '—') + '</td></tr>' +
      '</tbody></table>' +
      '<div class="sy-burdon-interp">' +
        '<h4>Satır Analizi</h4><ul>' +
          '<li>İlk satırlar iyi, son satırlar kötü → dikkat sürdürülebilirliği sorunu</li>' +
          '<li>İlk satırlar kötü, sonra açılma → uyum süresi problemi</li>' +
          '<li>Dağınık hata dağılımı → dikkat dalgalanması</li>' +
          '<li>Düzenli artan hata → mental yorgunluk</li>' +
        '</ul>' +
        '<h4>Yorumlama Profili</h4><ul>' +
          '<li>Yavaş ama az hatalı → temkinli, kaygılı, mükemmeliyetçi</li>' +
          '<li>Hızlı ama çok yanlış işaretleme → dürtüsel profil (DEHB hiperaktif tip)</li>' +
          '<li>Çok atlama, az yanlış → dikkat eksikliği baskın profil</li>' +
          '<li>Hem atlama hem yanlış yüksek → dağınık dikkat + kontrol zayıflığı</li>' +
        '</ul>' +
      '</div></div>';
  }

  function openBurdonEditor(q, isPool) {
    var s = isPool ? { label: 'Soru Havuzu · Dikkat Soruları' } : SECTIONS[activeSection];
    var isNew = !q;
    var d = q ? JSON.parse(JSON.stringify(q)) : burdonRebuild(burdonDefaults());
    if (!d.grid) burdonRebuild(d);
    var existing = document.getElementById('syBurdonModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syBurdonModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-preview-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + (isNew ? 'Yeni Burdon Dikkat Testi' : 'Burdon Testini Düzenle') + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(s.label) + ' · Sınıf seviyesi yoktur</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="sy-tabs sy-pv-tabs">' +
          '<button type="button" class="sy-tab-btn is-active" data-bd-tab="info">Test Bilgileri</button>' +
          '<button type="button" class="sy-tab-btn" data-bd-tab="grid">Harf Tablosu</button>' +
          '<button type="button" class="sy-tab-btn" data-bd-tab="score">Puanlama ve Yorum</button>' +
        '</div>' +
        '<div class="tm-detail-modal-body" data-bd-body></div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--ghost" data-close>İptal</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-bd-save>Kaydet</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('[data-bd-body]');
    var tab = 'info';

    function readForm() {
      function v(sel) { var el = body.querySelector(sel); return el ? el.value : null; }
      if (tab !== 'info') return;
      d.questionText = (v('[data-bd="title"]') || '').trim() || 'Burdon Dikkat Testi';
      d.instruction = (v('[data-bd="instruction"]') || '').trim();
      d.durationSeconds = (parseInt(v('[data-bd="minutes"]'), 10) || 5) * 60;
      d.targetLetters = (v('[data-bd="targets"]') || 'A,B').split(',').map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean);
      d.rows = parseInt(v('[data-bd="rows"]'), 10) || 20;
      d.perRow = parseInt(v('[data-bd="perRow"]'), 10) || 30;
      d.targetRatio = parseInt(v('[data-bd="ratio"]'), 10) || 30;
      var ab = body.querySelector('[data-bd="allowBack"]');
      d.allowBack = ab ? ab.checked : false;
    }
    function draw() {
      if (tab === 'info') {
        body.innerHTML =
          '<div class="tm-detail-grid tm-detail-grid--modal">' +
            field('Test Adı', '<input class="tm-dg-control" data-bd="title" value="' + esc(d.questionText) + '">', true) +
            field('Süre (dakika)', '<input class="tm-dg-control" type="number" min="1" max="30" data-bd="minutes" value="' + (Math.round((d.durationSeconds || 300) / 60)) + '">', true) +
            field('Hedef Harfler (virgülle)', '<input class="tm-dg-control" data-bd="targets" value="' + esc((d.targetLetters || []).join(', ')) + '">', true) +
            field('Hedef Yoğunluğu (%)', '<input class="tm-dg-control" type="number" min="5" max="80" data-bd="ratio" value="' + (d.targetRatio || 30) + '">') +
            field('Satır Sayısı', '<input class="tm-dg-control" type="number" min="1" max="40" data-bd="rows" value="' + (d.rows || 20) + '">') +
            field('Satır Başına Harf', '<input class="tm-dg-control" type="number" min="5" max="60" data-bd="perRow" value="' + (d.perRow || 30) + '">') +
            field('Toplam Hedef Harf', autoValueHtml('burdonTotal', String(d.totalTargets || 0), 'Harf tablosundan hesaplanır')) +
            '<label class="tm-form-field tm-form-check"><input type="checkbox" data-bd="allowBack"' + (d.allowBack ? ' checked' : '') + '> Geri dönüp düzeltmeye izin ver</label>' +
          '</div>' +
          '<label class="tm-form-field">' + fieldLabel('Yönerge (teste başlamadan okunur)', true) +
            '<textarea class="tm-dg-control" data-bd="instruction" rows="3">' + esc(d.instruction || '') + '</textarea></label>' +
          '<p class="sy-hint">Burdon testinin sınıf seviyesi yoktur; tüm kademelerde aynı biçimde uygulanır.</p>';
      } else if (tab === 'grid') {
        body.innerHTML =
          '<div class="sy-burdon-bar">' +
            '<span><strong>' + (d.totalTargets || 0) + '</strong> hedef harf · ' + (d.rows || 0) + ' satır × ' + (d.perRow || 0) + ' harf · Süre: ' + esc(burdonDurationLabel(d.durationSeconds)) + '</span>' +
            '<button type="button" class="tm-btn tm-btn--sm sy-btn-pick" data-bd-regen>Tabloyu Yeniden Üret</button>' +
          '</div>' +
          '<p class="sy-hint">Hedef harfler vurgulanmıştır; öğrenciye vurgusuz gösterilir. Sağdaki sayılar satırdaki hedef sayısıdır (satır analizi için).</p>' +
          burdonGridHtml(d, true);
      } else {
        body.innerHTML = burdonScoringHtml(d);
      }
    }
    draw();

    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var tb = e.target.closest('[data-bd-tab]');
      if (tb) {
        readForm();
        tab = tb.getAttribute('data-bd-tab');
        ov.querySelectorAll('[data-bd-tab]').forEach(function (b) { b.classList.toggle('is-active', b === tb); });
        draw();
        return;
      }
      if (e.target.closest('[data-bd-regen]')) {
        d.seed = (d.seed || 1) + 7919;
        burdonRebuild(d);
        draw();
        toast('Harf tablosu yeniden üretildi (' + d.totalTargets + ' hedef).');
        return;
      }
      if (e.target.closest('[data-bd-save]')) {
        readForm();
        if (!d.targetLetters.length) { toast('En az bir hedef harf giriniz.', 'error'); return; }
        burdonRebuild(d);
        var out = JSON.parse(JSON.stringify(d));
        out.attentionTestType = 'burdon';
        out.gradeLevel = null;              // Burdon'un sınıf seviyesi yok
        out.questionType = 'burdon_attention';
        out.isActive = out.isActive !== false;
        out.addedBy = out.addedBy || AUTHOR_NAME;
        out.inputMode = 'manual';
        if (isPool) {
          out.poolType = 'attention';
          delete out.contentType; delete out.poolId; delete out.order;
          if (isNew) { out.id = nowSeq('pool'); out.createdAt = new Date().toISOString(); db.pool.push(out); }
          else { var pidx = db.pool.findIndex(function (x) { return x.id === out.id; }); if (pidx >= 0) db.pool[pidx] = out; else db.pool.push(out); }
          saveDb(); renderPool(); close();
          toast(isNew ? 'Dikkat testi havuza eklendi (' + out.totalTargets + ' hedef harf).' : 'Havuzdaki test güncellendi.');
          return;
        }
        out.contentType = SECTIONS[activeSection].contentType;
        if (isNew) {
          out.id = nowSeq('question');
          var orders = attentionTests(activeSection).map(function (x) { return x.order || 0; });
          out.order = (orders.length ? Math.max.apply(null, orders) : 0) + 1;
          db.questions.push(out);
        } else {
          var idx = db.questions.findIndex(function (x) { return x.id === out.id; });
          if (idx >= 0) db.questions[idx] = out; else db.questions.push(out);
        }
        saveDb(); renderSection(); close();
        toast(isNew ? 'Burdon testi eklendi (' + out.totalTargets + ' hedef harf).' : 'Burdon testi güncellendi.');
      }
    });
  }

  // Burdon testinin önizlemesi (yönerge + tablo + puanlama)
  function openBurdonPreview(d) {
    var existing = document.getElementById('syPreviewModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syPreviewModal'; ov.style.zIndex = '9700';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-preview-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + esc(d.questionText || 'Burdon Dikkat Testi') + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(burdonDurationLabel(d.durationSeconds)) + ' · ' + (d.totalTargets || 0) + ' hedef harf · Hedef: ' + esc((d.targetLetters || []).join(', ')) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="sy-tabs sy-pv-tabs">' +
          '<button type="button" class="sy-tab-btn is-active" data-bp-tab="test">Öğrenci Görünümü</button>' +
          '<button type="button" class="sy-tab-btn" data-bp-tab="score">Puanlama ve Yorum</button>' +
        '</div>' +
        '<div class="tm-detail-modal-body" data-bp-body></div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--primary" data-close>Kapat</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('[data-bp-body]');
    function draw(which) {
      if (which === 'score') { body.innerHTML = burdonScoringHtml(d); return; }
      body.innerHTML =
        '<div class="sy-burdon-instr"><strong>Yönerge:</strong> ' + esc(d.instruction || '') + '</div>' +
        '<div class="sy-burdon-bar"><span>Süre: ' + esc(burdonDurationLabel(d.durationSeconds)) +
          ' · Geri dönüş: ' + (d.allowBack ? 'serbest' : 'yok') + '</span></div>' +
        burdonGridHtml(d, false);
    }
    draw('test');
    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var tb = e.target.closest('[data-bp-tab]');
      if (tb) {
        ov.querySelectorAll('[data-bp-tab]').forEach(function (b) { b.classList.toggle('is-active', b === tb); });
        draw(tb.getAttribute('data-bp-tab'));
      }
    });
  }

  /* ---- Dikkat Testi bölümleri: Burdon test kartları ---- */
  function attentionTests(key) {
    return db.questions.filter(function (q) {
      return q.contentType === SECTIONS[key].contentType;
    }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function renderAttentionCards() {
    var main = document.getElementById('syMain');
    var key = activeSection;
    var s = SECTIONS[key];
    var tests = attentionTests(key);
    var cards = tests.map(function (t, i) {
      var st = t.isActive ? 'published' : 'editing';
      return '<article class="tm-dash-card sy-exam-card sy-burdon-card" data-bd-open="' + t.id + '" role="button" tabindex="0">' +
        '<div class="tm-dash-card-head"><h2 class="tm-dash-card-title">' + esc(t.questionText || ('Burdon Dikkat Testi ' + (i + 1))) + '</h2>' +
          (t.isActive
            ? '<span class="tm-badge tm-badge--green sy-status-badge">' + CHECK_ICON + ' Yayında</span>'
            : '<span class="tm-badge tm-badge--orange sy-status-badge">' + PENCIL_ICON + ' Düzenleniyor</span>') +
        '</div>' +
        '<div class="sy-exam-meta"><span><strong>' + (t.totalTargets || 0) + '</strong> hedef harf</span></div>' +
        '<div class="sy-exam-sched">' +
          '<span><span class="sy-sched-lbl">Süre:</span> ' + esc(burdonDurationLabel(t.durationSeconds)) + '</span>' +
          '<span><span class="sy-sched-lbl">Hedef:</span> ' + esc((t.targetLetters || []).join(', ')) + '</span>' +
          (s.hasQuarter && t.quarter ? '<span><span class="sy-sched-lbl">Dönem:</span> ' + esc(QUARTER[t.quarter] || t.quarter) + '</span>' : '') +
        '</div>' +
        '<div class="sy-exam-foot">' +
          '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-exam-toggle" data-bd-toggle="' + t.id + '">' +
            (t.isActive ? 'Taslağa al' : 'Yayına al') + '</button>' +
          '<span class="sy-exam-tools">' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-bd-preview="' + t.id + '" title="Testi önizle">' + PREVIEW_ICON + '</button>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-bd-edit="' + t.id + '" title="Testi düzenle">' + EDIT_ICON + '</button>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-bd-del="' + t.id + '" title="Testi sil">' + DEL_ICON + '</button>' +
          '</span>' +
          '<span class="tm-btn tm-btn--primary tm-btn--sm sy-exam-open-btn" data-bd-open="' + t.id + '">Testi Aç &rarr;</span>' +
        '</div>' +
      '</article>';
    }).join('');
    cards += '<button type="button" class="sy-exam-card sy-exam-add" data-bd-new>' +
      '<span class="sy-exam-add-plus">+</span><span>Yeni Burdon Testi</span></button>';

    main.innerHTML =
      '<div class="sy-page-head"><h1 class="sy-page-title">' + esc(s.label) + '</h1>' +
        '<p class="sy-page-sub">' + esc(s.desc) + ' Burdon testinin sınıf seviyesi yoktur.</p></div>' +
      '<section class="tm-panel tm-panel--datagrid sy-panel">' +
        '<div class="tm-dg-toolbar"><div class="tm-dg-toolbar-row sy-filter-row">' +
          '<span class="tm-dg-spacer"></span>' +
          '<button type="button" class="tm-btn tm-btn--sm sy-btn-pick sy-btn-pick--main" data-bd-pick>&#9776; Havuzdan Test Seç</button>' +
          '<span class="tm-dg-count">' + tests.length + ' test</span>' +
        '</div></div>' +
        '<div class="sy-list">' + '<div class="sy-exam-grid">' + cards + '</div>' + '</div>' +
      '</section>';
    bindAttentionCards(main);
  }
  function bindAttentionCards(main) {
    function byId(id) { return db.questions.find(function (x) { return x.id === id; }); }
    main.querySelectorAll('[data-bd-open]').forEach(function (el) {
      function open() { var t = byId(el.getAttribute('data-bd-open')); if (t) openBurdonPreview(t); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    main.querySelectorAll('[data-bd-preview]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); var t = byId(el.getAttribute('data-bd-preview')); if (t) openBurdonPreview(t); });
    });
    main.querySelectorAll('[data-bd-edit]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); var t = byId(el.getAttribute('data-bd-edit')); if (t) openBurdonEditor(t); });
    });
    main.querySelectorAll('[data-bd-del]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = byId(el.getAttribute('data-bd-del')); if (!t) return;
        function doDel() {
          db.questions = db.questions.filter(function (x) { return x.id !== t.id; });
          saveDb(); renderSection(); toast('Test silindi.');
        }
        var warn = '“' + (t.questionText || 'Burdon testi') + '” testini silmek istediğinize emin misiniz?';
        if (Confirm) Confirm.open({ title: 'Testi sil', warning: warn, requireReason: false, confirmLabel: 'Sil', cancelLabel: 'Vazgeç', danger: true, onConfirm: doDel });
        else if (window.confirm(warn)) doDel();
      });
    });
    main.querySelectorAll('[data-bd-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var t = byId(el.getAttribute('data-bd-toggle')); if (!t) return;
        var toPublish = !t.isActive;
        function apply() { t.isActive = toPublish; saveDb(); renderSection(); toast(toPublish ? 'Test yayına alındı.' : 'Test taslağa alındı.'); }
        if (Confirm) Confirm.open({
          title: toPublish ? 'Testi yayına al' : 'Testi taslağa al',
          warning: '“' + (t.questionText || '') + '” testini ' + (toPublish ? 'yayına almak' : 'taslağa almak') + ' istediğinize emin misiniz?',
          requireReason: false, confirmLabel: toPublish ? 'Yayına al' : 'Taslağa al', cancelLabel: 'Vazgeç', danger: !toPublish, onConfirm: apply
        });
        else apply();
      });
    });
    var nw = main.querySelector('[data-bd-new]');
    if (nw) nw.addEventListener('click', function () { openBurdonEditor(null); });
    var pk = main.querySelector('[data-bd-pick]');
    if (pk) pk.addEventListener('click', function () { openBurdonPicker(); });
  }

  /* ---- Havuzdan Burdon testi seçme ---- */
  function openBurdonPicker() {
    var s = SECTIONS[activeSection];
    var used = {};
    db.questions.forEach(function (q) { if (q.contentType === s.contentType && q.poolId) used[q.poolId] = true; });
    var cands = db.pool.filter(function (p) { return p.poolType === 'attention' && !used[p.id]; });
    var selected = {};
    var existing = document.getElementById('syPickModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syPickModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-pick-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">Havuzdan Dikkat Testi Seç</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(s.label) + ' · Soru Havuzu › Dikkat Soruları</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body">' +
          (cands.length
            ? '<div class="tm-res-table-wrap"><table class="tm-res-table sy-table sy-pick-table"><thead><tr>' +
                '<th class="sy-pick-cb"></th><th class="sy-col-id">Test ID</th><th>Test Adı</th><th>Süre</th><th>Hedef Harfler</th><th>Toplam Hedef</th><th>Önizle</th>' +
              '</tr></thead><tbody>' + cands.map(function (p) {
                return '<tr data-pick-row="' + p.id + '">' +
                  '<td class="sy-pick-cb"><input type="checkbox" data-pick value="' + p.id + '"></td>' +
                  '<td class="sy-col-id"><code class="tm-res-code-cell">' + esc(poolCode(p)) + '</code></td>' +
                  '<td>' + esc(p.questionText || '') + '</td>' +
                  '<td>' + esc(burdonDurationLabel(p.durationSeconds)) + '</td>' +
                  '<td>' + esc((p.targetLetters || []).join(', ')) + '</td>' +
                  '<td>' + (p.totalTargets || 0) + '</td>' +
                  '<td class="sy-td-act"><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-pick-preview="' + p.id + '" title="Önizle">' + PREVIEW_ICON + '</button></td>' +
                '</tr>';
              }).join('') + '</tbody></table></div>'
            : '<p class="tm-empty sy-empty">Havuzda bu bölüme eklenmemiş dikkat testi bulunmuyor.</p>') +
        '</div>' +
        '<footer class="tm-crit-foot"><span class="tm-dg-count" data-pick-count>0 test seçildi</span>' +
          '<span class="tm-dg-spacer"></span>' +
          '<button type="button" class="tm-btn tm-btn--ghost" data-close>Vazgeç</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-pick-add>Seçilenleri Ekle</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    function count() { return Object.keys(selected).filter(function (k) { return selected[k]; }).length; }
    function refresh() { ov.querySelector('[data-pick-count]').textContent = count() + ' test seçildi'; }
    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('change', function (e) {
      var cb = e.target.closest('[data-pick]'); if (!cb) return;
      selected[cb.value] = cb.checked; refresh();
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var pvb = e.target.closest('[data-pick-preview]');
      if (pvb) { e.stopPropagation(); var pp = poolById(pvb.getAttribute('data-pick-preview')); if (pp) openBurdonPreview(pp); return; }
      var row = e.target.closest('[data-pick-row]');
      if (row && !e.target.closest('[data-pick]')) {
        var box = row.querySelector('[data-pick]');
        if (box) { box.checked = !box.checked; selected[box.value] = box.checked; refresh(); }
        return;
      }
      if (e.target.closest('[data-pick-add]')) {
        var ids = Object.keys(selected).filter(function (k) { return selected[k]; });
        if (!ids.length) { toast('En az bir test seçiniz.', 'error'); return; }
        function doAdd() {
          var orders = attentionTests(activeSection).map(function (x) { return x.order || 0; });
          var next = (orders.length ? Math.max.apply(null, orders) : 0) + 1;
          ids.forEach(function (pid2) {
            var p = poolById(pid2); if (!p) return;
            var b = JSON.parse(JSON.stringify(p));
            delete b.poolType; delete b.createdAt;
            b.id = nowSeq('question');
            b.poolId = p.id;
            b.contentType = s.contentType;
            b.gradeLevel = null;
            b.isActive = true;
            b.order = next++;
            if (s.hasQuarter) b.quarter = b.quarter || 'q1';
            db.questions.push(b);
          });
          saveDb(); renderSection(); close();
          toast(ids.length + ' dikkat testi havuzdan eklendi.');
        }
        var warn = ids.length + ' testi “' + s.label + '” bölümüne eklemek istediğinize emin misiniz?';
        if (Confirm) Confirm.open({ title: 'Testleri ekle', warning: warn, requireReason: false, confirmLabel: 'Ekle', cancelLabel: 'Vazgeç', onConfirm: doAdd });
        else doAdd();
      }
    });
  }

  /* ---- Materyal sorusu künyesi + değişiklik geçmişi (sağ drawer) ----
     İçerik havuzdan geldiği için geçmiş iki kaynaktan birleştirilir:
     "Havuz" (sorunun kendisinde yapılan değişiklikler) ve
     "Bu materyal" (sınav/ödev içindeki sıra, durum gibi yerel değişiklikler). */
  function questionHistoryOf(q) {
    var rows = [];
    (db.poolHistory || []).forEach(function (h) {
      if (q.poolId && h.questionId === q.poolId) rows.push({ src: 'Havuz', h: h });
    });
    (db.questionHistory || []).forEach(function (h) {
      if (h.questionId === q.id) rows.push({ src: 'Bu materyal', h: h });
    });
    return rows.sort(function (a, b) { return String(b.h.changedAt).localeCompare(String(a.h.changedAt)); });
  }
  function logQuestionChange(questionId, field, label, prev, next) {
    db.questionHistory.push({
      id: nowSeq('qlog'), questionId: questionId, field: field, label: label,
      previousValue: prev == null ? '' : String(prev), newValue: next == null ? '' : String(next),
      changedBy: AUTHOR_NAME, changedAt: new Date().toISOString()
    });
  }
  function openQuestionDrawer(id) {
    var q = findQ(id); if (!q) return;
    var src = q.poolId ? poolById(q.poolId) : null;
    var hist = questionHistoryOf(q);
    var usage = q.poolId ? poolUsage(q.poolId) : [];
    var existing = document.getElementById('syQuestionDrawer');
    if (existing) existing.remove();

    var infoHtml = '<div class="tm-detail-grid tm-detail-grid--modal">' +
      cellHtml('Soru ID', '<code class="tm-res-code-cell">' + esc(qCode(q)) + '</code>') +
      cellHtml('Havuz Kaydı', src ? '<code class="tm-res-code-cell">' + esc(poolCode(src)) + '</code>' : '—') +
      cellHtml('Sınıf Seviyesi', esc(q.gradeLevel ? gradeLabel(q.gradeLevel) : '—')) +
      cellHtml('Ders', esc(SUBJ[q.subject] ? SUBJ[q.subject].name : '—')) +
      cellHtml('Konu', esc(q.topic || '—')) +
      cellHtml('Alt Konu', esc(q.subTopic || '—')) +
      cellHtml('Tip', esc(QTYPE_LABEL[q.questionType] || q.questionType)) +
      cellHtml('Puan', String(q.score != null ? q.score : '—')) +
      cellHtml('Cevap', esc(correctText(q))) +
      cellHtml('Sıra', String(q.order || '—')) +
      cellHtml('Durum', activeBadge(q)) +
      cellHtml('Ekleyen Kişi', esc(q.addedBy || AUTHOR_NAME)) +
      '</div>';

    var histHtml = hist.length
      ? '<table class="tm-inner-table"><thead><tr><th>Tarih & Saat</th><th>Değiştiren</th><th>Kaynak</th><th>Alan</th><th>Eski Durum</th><th>Yeni Durum</th></tr></thead><tbody>' +
        hist.map(function (r) {
          return '<tr><td>' + esc(fmtDateTime(r.h.changedAt)) + '</td><td>' + esc(r.h.changedBy) + '</td>' +
            '<td><span class="tm-badge ' + (r.src === 'Havuz' ? 'tm-badge--blue' : 'tm-badge--muted') + '">' + esc(r.src) + '</span></td>' +
            '<td>' + esc(r.h.label) + '</td>' +
            '<td><span class="tm-audit-old">' + esc(r.h.previousValue === '' ? '—' : r.h.previousValue) + '</span></td>' +
            '<td><span class="tm-audit-new">' + esc(r.h.newValue === '' ? '—' : r.h.newValue) + '</span></td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="tm-empty">Bu soruda henüz değişiklik yapılmamış.</p>';

    var useHtml = usage.length
      ? '<table class="tm-inner-table"><thead><tr><th>Materyal</th><th>Ayrıntı</th><th>Sınıf</th><th>Ders</th><th>Durum</th></tr></thead><tbody>' +
        usage.map(function (u) {
          return '<tr><td>' + esc(u.material) + '</td><td>' + esc(u.detail) + '</td><td>' + esc(u.grade) + '</td><td>' + esc(u.subject) + '</td>' +
            '<td>' + (u.status ? '<span class="tm-badge tm-badge--green">Aktif</span>' : '<span class="tm-badge tm-badge--muted">Pasif</span>') + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<p class="tm-empty">Bu soru başka bir materyalde kullanılmıyor.</p>';

    var ov = document.createElement('div');
    ov.className = 'tm-drawer-overlay'; ov.id = 'syQuestionDrawer';
    ov.innerHTML =
      '<aside class="tm-drawer" role="dialog" aria-modal="true">' +
        '<header class="tm-drawer-head"><div>' +
          '<h2 class="tm-drawer-title">' + esc(qCode(q)) + '</h2>' +
          '<p class="tm-drawer-sub">' + esc((q.questionText || '').slice(0, 90)) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-drawer-tabs">' +
          '<button type="button" class="tm-drawer-tab is-active" data-qtab="info">Soru Bilgileri</button>' +
          '<button type="button" class="tm-drawer-tab" data-qtab="history">Değişiklik Geçmişi' + (hist.length ? ' (' + hist.length + ')' : '') + '</button>' +
          '<button type="button" class="tm-drawer-tab" data-qtab="usage">Kullanıldığı Materyaller' + (usage.length ? ' (' + usage.length + ')' : '') + '</button>' +
        '</div>' +
        '<div class="tm-drawer-body">' +
          '<div data-qpane="info">' + infoHtml + '</div>' +
          '<div data-qpane="history" hidden>' + histHtml + '</div>' +
          '<div data-qpane="usage" hidden>' + useHtml + '</div>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(ov);
    void ov.offsetWidth;
    ov.classList.add('is-open');
    function close() { ov.classList.remove('is-open'); document.removeEventListener('keydown', onKey); setTimeout(function () { if (ov.parentNode) ov.remove(); }, 250); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      var tab = e.target.closest('[data-qtab]');
      if (tab) {
        var id2 = tab.getAttribute('data-qtab');
        ov.querySelectorAll('[data-qtab]').forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        ov.querySelectorAll('[data-qpane]').forEach(function (p) { p.hidden = p.getAttribute('data-qpane') !== id2; });
      }
    });
  }

  /* ----------------------------- Bölüm render ----------------------------- */
  function renderSection() {
    var main = document.getElementById('syMain');
    var s = SECTIONS[activeSection];
    if (s.poolFlow) { renderPool(); return; }
    if (s.weeklyFlow) { renderWeekly(); return; }
    if (s.attentionFlow) { renderAttentionCards(); return; }

    // Sınav akışı: sınav seçilmemiş → sınav kartları; ders seçilmemiş → ders kartları; seçilmiş → sorular.
    var st = ES();
    if (isExamFlow() && st.exam == null) {
      main.innerHTML = '<div class="sy-page-head"><h1 class="sy-page-title">' + esc(s.label) + ' · ' + esc(gradeLabel(st.grade)) + '</h1><p class="sy-page-sub">Bir sınav seçin; ardından ders kartlarından soruları yönetin.</p></div>' + renderExamCards(activeSection, st.grade);
      bindExamCards(main);
      return;
    }
    if (isExamFlow() && st.subject == null) {
      main.innerHTML = '<div class="sy-page-head">' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-back" data-sy-subject-back>&larr; Sınavlara dön</button>' +
        '<h1 class="sy-page-title">' + esc(examNameOf(activeSection, st.grade, st.exam)) + ' · ' + esc(gradeLabel(st.grade)) + '</h1>' +
        '<p class="sy-page-sub">Düzenlemek istediğiniz dersi seçin.</p></div>' + renderSubjectCards(activeSection, st.grade, st.exam);
      bindSubjectCards(main);
      return;
    }

    var titleHtml, backHtml = '';
    if (isExamFlow()) {
      titleHtml = esc(examNameOf(activeSection, st.grade, st.exam)) + ' · ' + esc(gradeLabel(st.grade)) + ' · ' + esc(SUBJ[st.subject] ? SUBJ[st.subject].name : '');
      backHtml = '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-back" data-sy-subject-listback>&larr; Derslere dön</button>';
    } else {
      titleHtml = esc(s.label);
    }
    main.innerHTML =
      '<div class="sy-page-head">' + backHtml + '<h1 class="sy-page-title">' + titleHtml + '</h1><p class="sy-page-sub">' + esc(s.desc) + '</p></div>' +
      '<section class="tm-panel tm-panel--datagrid sy-panel">' +
        '<div class="tm-dg-toolbar">' + filterBar(activeSection) + '</div>' +
        '<div class="sy-list" data-sy-list><p class="tm-empty">Sorular yükleniyor…</p></div>' +
      '</section>';
    var listWrap = main.querySelector('[data-sy-list]');
    try {
      var list = questionsFor(activeSection);
      listWrap.innerHTML = listHtml(activeSection, list);
      var countEl = main.querySelector('[data-sy-count]');
      if (countEl) countEl.textContent = list.length + ' soru';
      bindSection(main);
    } catch (err) {
      listWrap.innerHTML = '<p class="tm-empty sy-empty">Sorular yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
    }
  }

  // Sınav oluşturma / düzenleme — adı ve içerdiği dersler.
  function openExamDialog(key, grade, no, isEdit) {
    var existing = document.getElementById('syNewExamModal');
    if (existing) existing.remove();
    var curName = isEdit ? examNameOf(key, grade, no) : defaultExamName(key, no);
    var curIds = isEdit ? examSubjectsOf(key, grade, no) : ALL_SUBJECT_IDS;
    var curMeta = examMetaOf(key, grade, no) || {};
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syNewExamModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-newexam-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + (isEdit ? 'Sınavı Düzenle' : 'Yeni Sınav') + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(SECTIONS[key].label) + ' · ' + esc(gradeLabel(grade)) + ' · Sınav adı ve içerdiği dersler</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body">' +
          '<label class="tm-form-field">' + fieldLabel('Sınav Adı', true) +
            '<input class="tm-dg-control" data-sy-exam-name value="' + esc(curName) + '" placeholder="' + esc(defaultExamName(key, no)) + '"></label>' +
          '<div class="tm-detail-grid tm-detail-grid--modal sy-sched-grid">' +
            field('Sınav Tarihi', '<input class="tm-dg-control" type="date" data-sy-exam-date value="' + esc(curMeta.examDate || '') + '">') +
            field('Sınav Saati', '<input class="tm-dg-control" type="time" data-sy-exam-time value="' + esc(curMeta.examTime || '') + '">') +
          '</div>' +
          '<div class="sy-pick-head"><span class="tm-form-field-label">İçerdiği Dersler</span>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-sy-pick-all>Tümünü seç</button></div>' +
          '<div class="sy-pick-grid">' + SUBJECTS.map(function (sub) {
            var st = subjectStyle(sub.id);
            var on = curIds.indexOf(sub.id) >= 0;
            var cnt = isEdit ? examQuestionCount(key, grade, no, sub.id) : 0;
            return '<label class="sy-pick-item" style="--sy-c:' + st.color + '">' +
              '<input type="checkbox" value="' + sub.id + '" data-sy-pick' + (on ? ' checked' : '') + '>' +
              '<span class="sy-pick-icon">' + st.icon + '</span>' +
              '<span class="sy-pick-name">' + esc(sub.name) + (cnt ? ' <span class="sy-pick-count">' + cnt + ' soru</span>' : '') + '</span></label>';
          }).join('') + '</div>' +
          '<p class="sy-hint">En az bir ders seçmelisiniz. Kaldırılan derslerin soruları da silinir.</p>' +
        '</div>' +
        '<footer class="tm-crit-foot">' +
          (isEdit ? '<button type="button" class="tm-btn tm-btn--danger" data-sy-exam-delete>Sınavı Sil</button>' : '') +
          '<span class="tm-dg-spacer"></span>' +
          '<button type="button" class="tm-btn tm-btn--ghost" data-close>Vazgeç</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-sy-exam-save>' + (isEdit ? 'Kaydet' : 'Sınavı Oluştur') + '</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    function picked() { return Array.prototype.slice.call(ov.querySelectorAll('[data-sy-pick]:checked')).map(function (c) { return c.value; }); }

    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      if (e.target.closest('[data-sy-pick-all]')) {
        var all = ov.querySelectorAll('[data-sy-pick]');
        var allOn = picked().length === all.length;
        all.forEach(function (c) { c.checked = !allOn; });
        return;
      }
      if (e.target.closest('[data-sy-exam-delete]')) { close(); confirmDeleteExam(key, grade, no); return; }
      if (e.target.closest('[data-sy-exam-save]')) {
        var ids = picked();
        if (!ids.length) { toast('En az bir ders seçmelisiniz.', 'error'); return; }
        var nameEl = ov.querySelector('[data-sy-exam-name]');
        var name = (nameEl ? nameEl.value : '').trim() || defaultExamName(key, no);
        var removed = isEdit ? examSubjectsOf(key, grade, no).filter(function (x) { return ids.indexOf(x) < 0; }) : [];
        var lost = removed.reduce(function (n, sid) { return n + examQuestionCount(key, grade, no, sid); }, 0);
        function apply() {
          var stt = ES(key);
          removed.forEach(function (sid) { removeExamSubject(key, grade, no, sid); });
          setExamSubjects(key, grade, no, ids);
          setExamName(key, grade, no, name);
          // Yeni sınavın künyesi: oturumdaki yazar + oluşturma anı.
          var dEl = ov.querySelector('[data-sy-exam-date]'), tEl = ov.querySelector('[data-sy-exam-time]');
          var prevMeta = examMetaOf(key, grade, no) || {};
          setExamMeta(key, grade, no, {
            createdBy: isEdit ? (prevMeta.createdBy || AUTHOR_NAME) : AUTHOR_NAME,
            createdAt: isEdit ? (prevMeta.createdAt || new Date().toISOString()) : new Date().toISOString(),
            examDate: dEl ? dEl.value : prevMeta.examDate,
            examTime: tEl ? tEl.value : prevMeta.examTime
          });
          close();
          if (!isEdit) { stt.exam = no; stt.subject = null; renderSection(); pushNav(); }
          else { if (stt.subject && ids.indexOf(stt.subject) < 0) stt.subject = null; renderSection(); replaceNav(); }
          toast(isEdit ? 'Sınav güncellendi.' : (name + ' oluşturuldu (' + ids.length + ' ders).'));
        }
        if (lost > 0 && Confirm) {
          Confirm.open({
            title: 'Dersleri sınavdan kaldır',
            warning: removed.length + ' ders sınavdan kaldırılacak ve bu derslere ait ' + lost + ' soru kalıcı olarak silinecek. Emin misiniz?',
            requireReason: false, confirmLabel: 'Kaldır ve kaydet', cancelLabel: 'Vazgeç', danger: true, onConfirm: apply
          });
        } else { apply(); }
      }
    });
  }

  // Sınav künyesi — kim oluşturdu, ne zaman (salt-okunur).
  function fmtDateTime(iso) {
    if (!iso) return '—';
    if (U && U.formatDateTime) { try { return U.formatDateTime(iso); } catch (e) {} }
    var d = new Date(iso);
    if (isNaN(d)) return '—';
    var MN = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getDate() + ' ' + MN[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function openExamInfo(key, grade, no) {
    var meta = examMetaOf(key, grade, no);
    var subs = examSubjectsOf(key, grade, no);
    var status = examStatusOf(key, grade, no);
    var existing = document.getElementById('syExamInfoModal');
    if (existing) existing.remove();
    function cell(label, val) { return '<div><div class="tm-detail-cell-label">' + esc(label) + '</div><div class="tm-detail-cell-value">' + val + '</div></div>'; }
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syExamInfoModal'; ov.style.zIndex = '9600';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-info-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">' + esc(examNameOf(key, grade, no)) + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(SECTIONS[key].label) + ' · ' + esc(gradeLabel(grade)) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body"><div class="tm-detail-grid tm-detail-grid--modal">' +
          cell('Ekleyen Kişi', esc(meta && meta.createdBy ? meta.createdBy : AUTHOR_NAME)) +
          cell('Oluşturulduğu Tarih', esc(fmtDateTime(meta && meta.createdAt))) +
          cell('Durum', examStatusBadge(status)) +
          cell('Soru Sayısı', String(examQuestionCount(key, grade, no))) +
          cell('İçerdiği Dersler', subs.map(function (id) { return esc(SUBJ[id] ? SUBJ[id].name : id); }).join(', ')) +
        '</div></div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--primary" data-close>Kapat</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-close]')) close(); });
  }

  function confirmDeleteExam(key, grade, no) {
    var name = examNameOf(key, grade, no);
    var cnt = examQuestionCount(key, grade, no);
    function doDel() {
      var stt = ES(key);
      deleteExam(key, grade, no);
      if (stt.exam === no) { stt.exam = null; stt.subject = null; }
      renderSection(); replaceNav();
      toast(name + ' silindi.');
    }
    var warn = '“' + name + '” (' + gradeLabel(grade) + ') sınavını silmek istediğinize emin misiniz?' +
      (cnt ? ' Bu sınava ait ' + cnt + ' soru da kalıcı olarak silinecek.' : '');
    if (Confirm) Confirm.open({ title: 'Sınavı sil', warning: warn, requireReason: false, confirmLabel: 'Sil', cancelLabel: 'Vazgeç', danger: true, onConfirm: doDel });
    else if (window.confirm(warn)) doDel();
  }

  function confirmDeleteExamSubject(key, grade, no, subjectId) {
    var sub = SUBJ[subjectId];
    var name = sub ? sub.name : subjectId;
    if (examSubjectsOf(key, grade, no).length <= 1) { toast('Sınavda en az bir ders kalmalıdır.', 'error'); return; }
    var cnt = examQuestionCount(key, grade, no, subjectId);
    function doDel() {
      var stt = ES(key);
      removeExamSubject(key, grade, no, subjectId);
      if (stt.subject === subjectId) stt.subject = null;
      renderSection(); replaceNav();
      toast(name + ' dersi sınavdan kaldırıldı.');
    }
    var warn = '“' + name + '” dersini “' + examNameOf(key, grade, no) + '” sınavından kaldırmak istediğinize emin misiniz?' +
      (cnt ? ' Bu derse ait ' + cnt + ' soru da kalıcı olarak silinecek.' : '');
    if (Confirm) Confirm.open({ title: 'Dersi sınavdan kaldır', warning: warn, requireReason: false, confirmLabel: 'Kaldır', cancelLabel: 'Vazgeç', danger: true, onConfirm: doDel });
    else if (window.confirm(warn)) doDel();
  }

  function bindExamCards(main) {
    var key = activeSection, st = ES(key);
    main.querySelectorAll('[data-sy-exam-new]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        openExamDialog(key, st.grade, parseInt(el.getAttribute('data-sy-exam-new'), 10), false);
      });
    });
    main.querySelectorAll('[data-sy-exam-preview]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        var no = parseInt(el.getAttribute('data-sy-exam-preview'), 10);
        var all = examQuestionsOrdered(key, st.grade, no);
        openPreview(null, examNameOf(key, st.grade, no),
          SECTIONS[key].label + ' · ' + gradeLabel(st.grade) + ' · ' + all.length + ' soru',
          sectionGroups(all));
      });
    });
    main.querySelectorAll('[data-sy-exam-info]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        openExamInfo(key, st.grade, parseInt(el.getAttribute('data-sy-exam-info'), 10));
      });
    });
    main.querySelectorAll('[data-sy-exam-edit]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        openExamDialog(key, st.grade, parseInt(el.getAttribute('data-sy-exam-edit'), 10), true);
      });
    });
    main.querySelectorAll('[data-sy-exam-del]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmDeleteExam(key, st.grade, parseInt(el.getAttribute('data-sy-exam-del'), 10));
      });
    });
    main.querySelectorAll('[data-sy-exam-open]').forEach(function (el) {
      function open() { st.exam = parseInt(el.getAttribute('data-sy-exam-open'), 10); st.subject = null; renderSection(); pushNav(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    main.querySelectorAll('[data-sy-exam-toggle]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var no = parseInt(b.getAttribute('data-sy-exam-toggle'), 10);
        var cur = examStatusOf(key, st.grade, no);
        var toPublish = cur !== 'published';
        function apply() {
          setExamStatus(key, st.grade, no, toPublish ? 'published' : 'editing');
          toast(toPublish ? 'Sınav yayına alındı.' : 'Sınav taslağa alındı.');
          renderSection(); replaceNav();
        }
        var title = examNameOf(key, st.grade, no);
        if (Confirm) {
          Confirm.open({
            title: toPublish ? 'Sınavı yayına al' : 'Sınavı taslağa al',
            warning: toPublish
              ? title + ' (' + gradeLabel(st.grade) + ') sınavını yayına almak istediğinize emin misiniz? Öğrenciler bu sınavı görebilecek.'
              : title + ' (' + gradeLabel(st.grade) + ') sınavını taslağa almak istediğinize emin misiniz? Öğrenciler bu sınavı artık göremez.',
            requireReason: false,
            confirmLabel: toPublish ? 'Yayına al' : 'Taslağa al',
            cancelLabel: 'Vazgeç',
            danger: !toPublish,
            onConfirm: apply
          });
        } else if (window.confirm((toPublish ? 'Yayına almak' : 'Taslağa almak') + ' istediğinize emin misiniz?')) { apply(); }
      });
    });
  }

  function refreshList() {
    var main = document.getElementById('syMain');
    var list = questionsFor(activeSection);
    var listWrap = main.querySelector('[data-sy-list]');
    listWrap.innerHTML = listHtml(activeSection, list);
    var countEl = main.querySelector('[data-sy-count]');
    if (countEl) countEl.textContent = list.length + ' soru';
    bindSection(main);
  }

  function bindSection(main) {
    main.querySelectorAll('[data-filter]').forEach(function (el) {
      function apply() { filters[activeSection][el.getAttribute('data-filter')] = el.value; refreshList(); }
      if (el.tagName === 'INPUT') {
        el.addEventListener('input', (U && U.debounce) ? U.debounce(apply, 200) : apply);
      } else {
        el.addEventListener('change', apply);
      }
    });
    var backBtn = main.querySelector('[data-sy-subject-listback]');
    if (backBtn) backBtn.addEventListener('click', function () { history.back(); });
    var addBtn = main.querySelector('[data-sy-add]');
    if (addBtn) addBtn.addEventListener('click', function () { openEditor(null); });
    var pickBtn = main.querySelector('[data-sy-pick]');
    if (pickBtn) pickBtn.addEventListener('click', function () { openPoolPicker(); });
    var bdBtn = main.querySelector('[data-sy-burdon-add]');
    if (bdBtn) bdBtn.addEventListener('click', function () { openBurdonEditor(null); });
    main.querySelectorAll('[data-sy-preview]').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = findQ(b.getAttribute('data-sy-preview'));
        if (!q) return;
        if (q.attentionTestType === 'burdon') { openBurdonPreview(q); return; }
        openPreview([q], 'Soru Önizleme', editorContextLabel(SECTIONS[activeSection]));
      });
    });
    main.querySelectorAll('[data-sy-info]').forEach(function (b) {
      b.addEventListener('click', function () { openQuestionDrawer(b.getAttribute('data-sy-info')); });
    });
    main.querySelectorAll('[data-sy-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = findQ(b.getAttribute('data-sy-edit'));
        if (q && q.attentionTestType === 'burdon') { openBurdonEditor(q); return; }
        openEditor(q);
      });
    });
    main.querySelectorAll('[data-sy-del]').forEach(function (b) { b.addEventListener('click', function () { confirmDelete(b.getAttribute('data-sy-del')); }); });
    bindDrag(main);
  }
  function findQ(id) {
    var real = db.questions.find(function (q) { return q.id === id; });
    if (real) return real;
    if (String(id).indexOf('wq-') === 0 && isWeeklyFlow()) {
      var st = ES();
      return weeklyResolved(st.grade, st.mode, st.subject, st.week).find(function (q) { return q.id === id; });
    }
    return undefined;
  }

  /* ----------------------------- Drag & drop sıralama ----------------------------- */
  function bindDrag(main) {
    var tbody = main.querySelector('[data-sy-rows]');
    if (!tbody) return;
    var dragId = null;
    tbody.querySelectorAll('[data-drag]').forEach(function (handle) {
      handle.addEventListener('dragstart', function (e) { dragId = handle.getAttribute('data-drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (er) {} var row = handle.closest('tr'); if (row) row.classList.add('sy-dragging'); });
      handle.addEventListener('dragend', function () { var row = handle.closest('tr'); if (row) row.classList.remove('sy-dragging'); dragId = null; });
    });
    tbody.querySelectorAll('tr[data-row]').forEach(function (row) {
      row.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; row.classList.add('sy-drop-target'); });
      row.addEventListener('dragleave', function () { row.classList.remove('sy-drop-target'); });
      row.addEventListener('drop', function (e) {
        e.preventDefault(); row.classList.remove('sy-drop-target');
        var srcId = dragId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
        var tgtId = row.getAttribute('data-row');
        if (srcId && tgtId && srcId !== tgtId) reorder(srcId, tgtId);
      });
    });
  }
  function reorder(srcId, tgtId) {
    var list = questionsFor(activeSection);
    var ids = list.map(function (q) { return q.id; });
    var from = ids.indexOf(srcId), to = ids.indexOf(tgtId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    ids.forEach(function (id, i) { var q = findQ(id); if (q) q.order = i + 1; });
    saveDb(); refreshList();
    toast('Sıralama güncellendi.');
  }

  /* ----------------------------- Sil ----------------------------- */
  function confirmDelete(id) {
    var q = findQ(id); if (!q) return;
    function doDel() {
      if (q.generated) db.weeklyDeleted[id] = true;
      db.questions = db.questions.filter(function (x) { return x.id !== id; });
      saveDb(); refreshList(); toast('Soru silindi.');
    }
    if (Confirm) Confirm.open({ title: 'Soruyu sil', warning: '“' + (q.questionText || '').slice(0, 60) + '” sorusunu silmek istediğinize emin misiniz?', requireReason: false, confirmLabel: 'Sil', cancelLabel: 'Vazgeç', danger: true, onConfirm: doDel });
    else if (window.confirm('Soruyu silmek istediğinize emin misiniz?')) doDel();
  }

  /* ----------------------------- Editör modalı ----------------------------- */
  // .tm-form-field bir kolon flex; etiket ile "*" ayrı flex öğesi olursa zorunlu alanlar
  // fazladan bir satır kayar. Bu yüzden etiket + yıldız tek bir öğede tutulur.
  function fieldLabel(label, req) { return '<span class="sy-field-label">' + esc(label) + (req ? ' <span class="tm-req">*</span>' : '') + '</span>'; }
  function field(label, ctrl, req) { return '<label class="tm-form-field">' + fieldLabel(label, req) + ctrl + '</label>'; }
  function wideField(label, ctrl, req) { return '<label class="tm-form-field tm-form-field--wide">' + fieldLabel(label, req) + ctrl + '</label>'; }
  var AUTO_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  // Kullanıcının giremeyeceği, başka bir seçime göre otomatik dolan alan gösterimi.
  function autoValueHtml(key, value, hint) {
    return '<span class="sy-auto-value" data-auto="' + key + '" title="' + esc(hint || '') + '">' +
      '<span class="sy-auto-text">' + esc(value) + '</span>' +
      '<span class="sy-auto-badge">' + AUTO_ICON + ' Otomatik</span></span>';
  }
  // Bağlamdan gelen, değiştirilemeyen alan: görünürde "Otomatik" rozeti,
  // arkada gizli input ile gerçek değeri taşır (kaydetme mantığı aynı kalır).
  function lockedField(label, fld, rawValue, displayText, hint) {
    return field(label, '<input type="hidden" data-fld="' + fld + '" value="' + esc(rawValue) + '">' +
      autoValueHtml(fld, displayText, hint));
  }
  // Editör modalı üst yazısı — sınav akışında: Sınav Adı · Ders · Sınıf
  function editorContextLabel(s) {
    if (isWeeklyFlow()) { var w = ES(); return w.week != null ? (s.label + ' · ' + weeklyCrumb(w)) : s.label; }
    if (!isExamFlow()) return s.label;
    var st = ES();
    if (st.exam == null) return s.label;
    var parts = [examNameOf(activeSection, st.grade, st.exam)];
    if (st.subject && SUBJ[st.subject]) parts.push(SUBJ[st.subject].name);
    parts.push(gradeLabel(st.grade));
    return parts.join(' · ');
  }
  function inputEl(fld, val, type) { return '<input class="tm-dg-control" type="' + (type || 'text') + '" data-fld="' + fld + '" value="' + esc(val == null ? '' : val) + '">'; }
  function selEl(fld, val, options) { return '<select class="tm-dg-control" data-fld="' + fld + '">' + options.map(function (o) { return opt(o.v, o.l, String(val) === String(o.v)); }).join('') + '</select>'; }
  // Konu/Alt Konu açılır menüsü — boş seçenek + mevcut değeri (listede olmasa bile) korur.
  function topicOptionsHtml(options, cur, placeholder) {
    var html = '<option value="">' + esc(placeholder) + '</option>';
    if (cur && options.indexOf(cur) < 0) html += '<option value="' + esc(cur) + '" selected>' + esc(cur) + '</option>';
    html += options.map(function (o) { return '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
    return html;
  }
  function topicSelectHtml(fld, options, cur, placeholder) {
    return '<select class="tm-dg-control" data-fld="' + fld + '">' + topicOptionsHtml(options, cur, placeholder) + '</select>';
  }
  function fillTopicSelect(sel, options, cur, placeholder) { if (sel) sel.innerHTML = topicOptionsHtml(options, cur, placeholder); }

  function openEditor(q) {
    var s = SECTIONS[activeSection];
    var isNew = !q;
    var d = q ? JSON.parse(JSON.stringify(q)) : defaultQuestion();
    d._isNew = isNew;
    d._modeChosen = !isNew; // düzenlemede giriş yöntemi zaten belli → doğrudan sekmeler
    if (!d.inputMode) d.inputMode = 'manual';
    var existing = document.getElementById('syEditModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syEditModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-edit-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles"><h2 class="tm-crit-title">' + (isNew ? 'Yeni Soru' : 'Soruyu Düzenle') + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(editorContextLabel(s)) + '</p></div>' +
          '<button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body" data-editor-body></div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--ghost" data-close>İptal</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-save>Kaydet</button></footer>' +
      '</div>';
    document.body.appendChild(ov);
    var body = ov.querySelector('[data-editor-body]');
    renderEditorBody(body, s, d);

    function close() { if (ov.parentNode) ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-close]')) { close(); return; }
      if (e.target.closest('[data-save]')) { if (saveEditor(body, s, d, isNew)) close(); }
    });
  }

  function defaultQuestion() {
    var s = SECTIONS[activeSection];
    var orders = db.questions.filter(function (x) { return x.contentType === s.contentType; }).map(function (x) { return x.order || 0; });
    var nextOrder = (orders.length ? Math.max.apply(null, orders) : 0) + 1;
    var flow = (isExamFlow() || isWeeklyFlow()) ? ES() : null;
    var q = { id: nowSeq('question'), contentType: s.contentType, gradeLevel: (flow ? flow.grade : '5'), questionText: '', imageUrl: null, questionType: s.attention ? 'multi_select_attention' : 'multiple_choice', options: [{ id: 'A', text: '', isCorrect: true }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }], correctTextAnswer: '', correctNumberAnswer: null, caseSensitive: false, score: 10, xp: s.hasXp ? 20 : null, order: nextOrder, isActive: true };
    if (flow && isExamFlow()) q.examNo = flow.exam || 1;
    if (s.hasSubject) {
      q.subject = (flow && flow.subject) ? flow.subject : 'mathematics';
      q.section = SUBJ[q.subject] ? SUBJ[q.subject].section : 'numeric'; q.topic = ''; q.subTopic = '';
    }
    if (s.hasMonth) { q.month = 'january'; q.year = 2026; }
    if (s.hasWeek) { q.educationWeek = (flow && flow.week) || 1; q.lessonMode = (flow && flow.mode) || 'RUD'; q.homeworkTitle = ''; }
    if (s.hasQuarter) q.quarter = 'q1';
    if (s.attention) { q.attentionTaskType = 'find_target_letters'; q.instruction = ''; q.timeLimitSeconds = 60; q.allowMultipleSelection = true; q.targetItems = []; q.distractorItems = []; q.correctTargetsCount = 1; }
    q.inputMode = 'manual'; q.aboveImageHtml = ''; q.belowImageHtml = ''; q.resultHtml = ''; q.addedBy = AUTHOR_NAME;
    return q;
  }

  function textToHtml(t) { return esc(String(t == null ? '' : t)).replace(/\n/g, '<br>'); }
  function setFooterSave(body, show) {
    var foot = body.parentNode ? body.parentNode.querySelector('.tm-crit-foot') : null;
    if (!foot) return;
    // Materyal editöründe [data-save], havuz editöründe [data-pool-save]
    foot.querySelectorAll('[data-save], [data-pool-save]').forEach(function (b) { b.style.display = show ? '' : 'none'; });
  }

  // Yeni soru: önce giriş yöntemi seçilir (kendin yaz / vektörel ekle).
  function renderEditorBody(body, s, d) {
    if (d._isNew && !d._modeChosen) { renderChoiceScreen(body, s, d); return; }
    renderTabbedEditor(body, s, d);
  }
  var ICON_WRITE = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var ICON_VECTOR = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>';
  function renderChoiceScreen(body, s, d) {
    setFooterSave(body, false);
    body.innerHTML = '<div class="sy-choice"><p class="sy-choice-lead">Soruyu nasıl eklemek istersiniz?</p>' +
      '<div class="sy-choice-grid">' +
        '<button type="button" class="sy-choice-card" data-sy-mode="manual"><span class="sy-choice-icon">' + ICON_WRITE + '</span>' +
          '<span class="sy-choice-title">Soruyu kendin yaz</span><span class="sy-choice-desc">Zengin metin editörü ile görsel üstü/altı metin ve cevap bölümlerini elle oluşturun.</span></button>' +
        '<button type="button" class="sy-choice-card" data-sy-mode="vector"><span class="sy-choice-icon">' + ICON_VECTOR + '</span>' +
          '<span class="sy-choice-title">Soruyu vektörel olarak ekle</span><span class="sy-choice-desc">Hazır vektörel (SVG / PDF / görsel) soru dosyasını yükleyerek ekleyin.</span></button>' +
      '</div></div>';
    body.querySelectorAll('[data-sy-mode]').forEach(function (b) {
      b.addEventListener('click', function () { d.inputMode = b.getAttribute('data-sy-mode'); d._modeChosen = true; renderTabbedEditor(body, s, d); });
    });
  }

  /* ------- Sekmeli editör: Soru Bilgileri | Soru İçeriği | Cevap ------- */
  function orderTotal(d) { var list = questionsFor(activeSection); return d._isNew ? list.length + 1 : (list.length || 1); }
  function currentOrderPos(d) {
    var list = questionsFor(activeSection);
    if (d._isNew) return list.length + 1;
    var idx = list.findIndex(function (q) { return q.id === d.id; });
    return idx >= 0 ? idx + 1 : list.length;
  }
  function infoPaneHtml(s, d) {
    var meta = [];
    // Soru sırası yalnızca bir materyalin (sınav/ödev) içindeyken anlamlı; havuzda yok.
    if (!s.poolEditor) {
      var total = orderTotal(d); var posOpts = [];
      for (var i = 1; i <= total; i++) posOpts.push({ v: String(i), l: i + '. sıra' });
      meta.push(field('Soru Sırası', selEl('orderPos', String(currentOrderPos(d)), posOpts), true));
    }
    // Sınav akışında sınıf ve ders, açık olan sınav/ders kartından gelir → değiştirilemez.
    var locked = (isExamFlow() && ES().exam != null) || (isWeeklyFlow() && ES().week != null);
    if (locked) {
      meta.push(lockedField('Sınıf Seviyesi', 'gradeLevel', d.gradeLevel, gradeLabel(d.gradeLevel), 'Sınav bu sınıf seviyesine ait; değiştirilemez.'));
    } else {
      meta.push(field('Sınıf Seviyesi', selEl('gradeLevel', d.gradeLevel, GRADES.map(function (g) { return { v: g, l: gradeLabel(g) }; })), true));
    }
    if (s.hasMonth) meta.push(field('Ay', selEl('month', d.month, MONTHS.map(function (m) { return { v: m.id, l: m.name }; })), true));
    if (s.hasQuarter) meta.push(field('3 Aylık Dönem', selEl('quarter', d.quarter, QUARTERS.map(function (q) { return { v: q.id, l: q.name }; })), true));
    if (s.hasWeek) {
      if (locked) {
        meta.push(lockedField('Eğitim Haftası', 'educationWeek', d.educationWeek, d.educationWeek + '. Hafta', 'Seçili haftanın ödevi; değiştirilemez.'));
        meta.push(lockedField('Ders Tipi', 'lessonMode', d.lessonMode, (LMODE[d.lessonMode] || d.lessonMode), 'Seçili ders tipi (KİD/RUD); değiştirilemez.'));
      } else {
        meta.push(field('Eğitim Haftası', selEl('educationWeek', d.educationWeek, WEEKS.map(function (n) { return { v: n, l: n + '. Hafta' }; })), true));
        meta.push(field('Ders Tipi', selEl('lessonMode', d.lessonMode, LESSON_MODES.map(function (m) { return { v: m.id, l: m.name }; })), true));
      }
    }
    if (s.hasSubject) {
      if (locked) {
        meta.push(lockedField('Ders', 'subject', d.subject, (SUBJ[d.subject] ? SUBJ[d.subject].name : '—'), 'Bu ders kartındaki sorular yalnızca bu derse aittir; değiştirilemez.'));
      } else {
        meta.push(field('Ders', selEl('subject', d.subject, SUBJECTS.map(function (x) { return { v: x.id, l: x.name }; })), true));
      }
      // Bölüm, seçilen derse göre otomatik belirlenir → düzenlenebilir input değil, "otomatik" rozetli salt-okunur gösterim.
      meta.push(field('Bölüm', autoValueHtml('section', SECTION_LABEL[d.section] || '—', 'Ders seçimine göre otomatik belirlenir')));
      meta.push(wideField('Konu', topicSelectHtml('topic', topicsOf(d.gradeLevel, d.subject), d.topic, '— Konu seçin —')));
      meta.push(wideField('Alt Konu', topicSelectHtml('subTopic', subtopicsOf(d.gradeLevel, d.subject, d.topic), d.subTopic, '— Alt konu seçin —')));
    }
    if (!s.attention) meta.push(wideField('Soru Tipi', selEl('questionType', d.questionType, [{ v: 'multiple_choice', l: '4 Seçenekli' }, { v: 'text_answer', l: 'Sözel Cevap' }, { v: 'number_answer', l: 'Sayısal Cevap' }]), true));
    if (s.attention) meta.push(field('Dikkat Görevi Tipi', selEl('attentionTaskType', d.attentionTaskType, ATTENTION_TASKS.map(function (a) { return { v: a.id, l: a.name }; })), true));
    meta.push(field('Puan', inputEl('score', d.score, 'number')));
    if (s.hasXp) meta.push(field('Kazandıracağı XP', inputEl('xp', d.xp, 'number'), true));
    meta.push('<label class="tm-form-field tm-form-check"><input type="checkbox" data-fld="isActive"' + (d.isActive ? ' checked' : '') + '> Aktif</label>');
    if (s.hasWeek) meta.push(field('Ödev Başlığı', inputEl('homeworkTitle', d.homeworkTitle)));
    return '<div class="tm-detail-grid tm-detail-grid--modal">' + meta.join('') + '</div>';
  }
  function contentPaneHtml(s, d) {
    if (d.inputMode === 'vector') {
      return '<input type="hidden" data-fld="imageUrl" value="' + esc(d.imageUrl || '') + '">' +
        '<input type="hidden" data-fld="vectorFileName" value="' + esc(d.vectorFileName || '') + '">' +
        '<div class="sy-vector-block"><span class="tm-form-field-label">Vektörel Soru Dosyası (SVG / AI / PDF)</span>' +
          '<div class="sy-image-preview" data-img-preview>' + (d.imageUrl ? '<img src="' + esc(d.imageUrl) + '" alt="Vektörel soru">' : '<span class="sy-image-empty">Dosya yok</span>') + '</div>' +
          '<p class="sy-vec-file" data-vec-file>' + (d.vectorFileName ? 'Yüklü dosya: <strong>' + esc(d.vectorFileName) + '</strong>' : 'Henüz dosya yüklenmedi.') + '</p>' +
          '<div class="sy-image-actions"><input class="tm-dg-control" type="file" accept=".svg,.ai,.pdf,image/*" data-img-file>' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-img-clear>Kaldır</button></div>' +
          '<p class="sy-hint">Vektörel soruda yalnızca yüklenen dosya değişir; metin bölümleri kullanılmaz. (Örnek yükleme — dosya sunucuya gönderilmez.)</p></div>' +
        '<label class="tm-form-field">' + fieldLabel('Kısa Açıklama', true) + '<input class="tm-dg-control" data-fld="questionText" value="' + esc(d.questionText || '') + '" placeholder="Soruyu tanımlayan kısa metin"></label>';
    }
    return rteFieldHtml('aboveImageHtml', 'Görsel Üstü Metin', d.aboveImageHtml || textToHtml(d.questionText), true) +
      imageBlock(d) +
      rteFieldHtml('belowImageHtml', 'Görsel Altı Metin', d.belowImageHtml || '', false) +
      rteFieldHtml('resultHtml', 'Sonuç Metni', d.resultHtml || '', false, 'Buna göre …') +
      (s.attention ? '<label class="tm-form-field">Hedef Seçim Açıklaması<textarea class="tm-dg-control" data-fld="instruction" rows="2">' + esc(d.instruction || '') + '</textarea></label>' : '');
  }
  function renderTabbedEditor(body, s, d) {
    setFooterSave(body, true);
    var answerLabel = s.attention ? 'Sonuç Bölümü' : 'Cevap';
    var tabs = [{ id: 'info', l: 'Soru Bilgileri' }, { id: 'content', l: 'Soru İçeriği' }, { id: 'answer', l: answerLabel }];
    var nav = '<div class="sy-tabs" role="tablist">' + tabs.map(function (t, i) {
      return '<button type="button" class="sy-tab-btn' + (i === 0 ? ' is-active' : '') + '" data-sy-tab="' + t.id + '">' + esc(t.l) + '</button>';
    }).join('') + '</div>';
    var panes =
      '<input type="hidden" data-fld="inputMode" value="' + esc(d.inputMode || 'manual') + '">' +
      '<div class="sy-tabpane is-active" data-sy-pane="info">' + infoPaneHtml(s, d) + '</div>' +
      '<div class="sy-tabpane" data-sy-pane="content">' + contentPaneHtml(s, d) + '</div>' +
      '<div class="sy-tabpane" data-sy-pane="answer" data-answer-block><h3 class="sy-edit-title">' + esc(answerLabel) + '</h3>' + answerBlock(s, d) + '</div>';
    body.innerHTML = nav + panes;

    // Sekme geçişi
    body.querySelectorAll('[data-sy-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-sy-tab');
        body.querySelectorAll('[data-sy-tab]').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        body.querySelectorAll('[data-sy-pane]').forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-sy-pane') === id); });
      });
    });

    // Konu/Alt Konu açılır menüleri — sınıf/ders değişince Konu, Konu değişince Alt Konu güncellenir.
    var gradeSel = body.querySelector('[data-fld="gradeLevel"]');
    var subjectSel = body.querySelector('[data-fld="subject"]');
    var topicSel = body.querySelector('[data-fld="topic"]');
    var subTopicSel = body.querySelector('[data-fld="subTopic"]');
    function curGrade() { return gradeSel ? gradeSel.value : d.gradeLevel; }
    function curSubject() { return subjectSel ? subjectSel.value : d.subject; }
    function rebuildTopics() {
      if (topicSel) fillTopicSelect(topicSel, topicsOf(curGrade(), curSubject()), '', '— Konu seçin —');
      rebuildSubtopics();
    }
    function rebuildSubtopics() {
      if (subTopicSel) fillTopicSelect(subTopicSel, subtopicsOf(curGrade(), curSubject(), topicSel ? topicSel.value : ''), '', '— Alt konu seçin —');
    }
    if (gradeSel) gradeSel.addEventListener('change', rebuildTopics);
    if (subjectSel) subjectSel.addEventListener('change', function () {
      var sub = SUBJ[subjectSel.value]; var secEl = body.querySelector('[data-auto="section"] .sy-auto-text');
      if (secEl && sub) secEl.textContent = SECTION_LABEL[sub.section];
      rebuildTopics();
    });
    if (topicSel) topicSel.addEventListener('change', rebuildSubtopics);

    // Soru tipi değişince cevap bloğunu değiştir
    var typeSel = body.querySelector('[data-fld="questionType"]');
    if (typeSel) typeSel.addEventListener('change', function () {
      d.questionType = typeSel.value;
      body.querySelector('[data-answer-block]').innerHTML = '<h3 class="sy-edit-title">' + esc(answerLabel) + '</h3>' + answerBlock(s, d);
      bindAnswerBlock(body, s, d);
    });
    bindRte(body);
    bindImage(body, d);
    bindAnswerBlock(body, s, d);
  }

  /* Zengin metin editörü (contentEditable + basit araç çubuğu) */
  function rteBtn(cmd, title, label) { return '<button type="button" class="sy-rte-btn" data-rte-cmd="' + cmd + '" title="' + esc(title) + '" tabindex="-1">' + label + '</button>'; }
  function rteFieldHtml(fld, label, html, req, placeholder) {
    return '<div class="sy-rte-field"><span class="tm-form-field-label">' + esc(label) + (req ? ' <span class="tm-req">*</span>' : '') + '</span>' +
      '<div class="sy-rte">' +
        '<div class="sy-rte-toolbar">' +
          rteBtn('bold', 'Kalın', '<b>B</b>') + rteBtn('italic', 'İtalik', '<i>I</i>') + rteBtn('underline', 'Altı çizili', '<u>U</u>') +
          rteBtn('insertUnorderedList', 'Madde listesi', '&bull;') + rteBtn('insertOrderedList', 'Numaralı liste', '1.') +
          rteBtn('removeFormat', 'Biçimi temizle', '&times;') +
        '</div>' +
        '<div class="sy-rte-area" contenteditable="true" data-rte="' + fld + '"' + (placeholder ? ' data-placeholder="' + esc(placeholder) + '"' : '') + '>' + (html || '') + '</div>' +
      '</div></div>';
  }
  function bindRte(body) {
    body.querySelectorAll('.sy-rte').forEach(function (w) {
      var area = w.querySelector('[data-rte]');
      w.querySelectorAll('[data-rte-cmd]').forEach(function (b) {
        b.addEventListener('mousedown', function (e) { e.preventDefault(); });
        b.addEventListener('click', function () { if (area) { area.focus(); try { document.execCommand(b.getAttribute('data-rte-cmd'), false, null); } catch (e) {} } });
      });
    });
  }
  function readRteHtml(body, fld) { var el = body.querySelector('[data-rte="' + fld + '"]'); return el ? el.innerHTML.trim() : ''; }
  function readRteText(body, fld) { var el = body.querySelector('[data-rte="' + fld + '"]'); return el ? (el.textContent || '').trim() : ''; }

  function imageBlock(d) {
    return '<div class="sy-image-block"><span class="tm-form-field-label">Görsel</span>' +
      '<div class="sy-image-preview" data-img-preview>' + (d.imageUrl ? '<img src="' + esc(d.imageUrl) + '" alt="Soru görseli">' : '<span class="sy-image-empty">Görsel yok</span>') + '</div>' +
      '<div class="sy-image-actions"><input class="tm-dg-control" type="url" data-fld="imageUrl" placeholder="Görsel URL (opsiyonel)" value="' + esc(d.imageUrl || '') + '">' +
        '<input class="tm-dg-control sy-image-file" type="file" accept="image/*" data-img-file>' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-img-clear>Kaldır</button></div></div>';
  }
  function bindImage(body, d) {
    var preview = body.querySelector('[data-img-preview]');
    if (!preview) return;
    var urlInput = body.querySelector('[data-fld="imageUrl"]');
    var fileInput = body.querySelector('[data-img-file]');
    function render(v) { preview.innerHTML = v ? '<img src="' + esc(v) + '" alt="Görsel" onerror="this.parentNode.innerHTML=&quot;<span class=\\&quot;sy-image-empty\\&quot;>Görsel yüklenemedi</span>&quot;">' : '<span class="sy-image-empty">Görsel yok</span>'; }
    if (urlInput && urlInput.type !== 'hidden') urlInput.addEventListener('input', function () { render(urlInput.value.trim()); });
    var nameInput = body.querySelector('[data-fld="vectorFileName"]');
    var nameLabel = body.querySelector('[data-vec-file]');
    if (fileInput) fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0]; if (!f) return;
      if (nameInput) nameInput.value = f.name;
      if (nameLabel) nameLabel.innerHTML = 'Yüklü dosya: <strong>' + esc(f.name) + '</strong>';
      var rd = new FileReader();
      rd.onload = function () { if (urlInput) urlInput.value = rd.result; render(String(rd.result)); };
      rd.readAsDataURL(f);
    });
    var clear = body.querySelector('[data-img-clear]');
    if (clear) clear.addEventListener('click', function () {
      if (urlInput) urlInput.value = ''; if (fileInput) fileInput.value = '';
      if (nameInput) nameInput.value = '';
      if (nameLabel) nameLabel.textContent = 'Henüz dosya yüklenmedi.';
      render('');
    });
    render(urlInput ? (urlInput.value || '').trim() : (d.imageUrl || ''));
  }

  function answerBlock(s, d) {
    if (d.questionType === 'multiple_choice') {
      var opts = d.options && d.options.length ? d.options : [{ id: 'A', text: '', isCorrect: true }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }];
      return '<div class="sy-options">' + opts.map(function (o) {
        return '<div class="sy-option-row"><label class="sy-option-radio"><input type="radio" name="syCorrect" value="' + o.id + '"' + (o.isCorrect ? ' checked' : '') + '><span>' + o.id + '</span></label>' +
          '<input class="tm-dg-control" data-opt="' + o.id + '" placeholder="' + o.id + ' şıkkı" value="' + esc(o.text) + '"></div>';
      }).join('') + '<p class="sy-hint">Doğru şıkkı sol taraftan işaretleyin.</p></div>';
    }
    if (d.questionType === 'text_answer') {
      return '<label class="tm-form-field">Doğru Cevap (metin)<input class="tm-dg-control" data-fld="correctTextAnswer" value="' + esc(d.correctTextAnswer || '') + '"></label>' +
        '<label class="tm-form-field tm-form-check"><input type="checkbox" data-fld="caseSensitive"' + (d.caseSensitive ? ' checked' : '') + '> Büyük/küçük harf duyarlı</label>';
    }
    if (d.questionType === 'number_answer') {
      return '<label class="tm-form-field">Doğru Cevap (sayı)<input class="tm-dg-control" type="number" data-fld="correctNumberAnswer" value="' + (d.correctNumberAnswer == null ? '' : d.correctNumberAnswer) + '"></label>';
    }
    if (d.questionType === 'multi_select_attention') {
      return '<div class="tm-detail-grid tm-detail-grid--modal">' +
        field('Doğru seçilecek öğeler (virgülle)', '<input class="tm-dg-control" data-fld="targetItems" value="' + esc((d.targetItems || []).join(', ')) + '">') +
        field('Çeldirici öğeler (virgülle)', '<input class="tm-dg-control" data-fld="distractorItems" value="' + esc((d.distractorItems || []).join(', ')) + '">') +
        field('Doğru hedef sayısı', inputEl('correctTargetsCount', d.correctTargetsCount, 'number')) +
        field('Süre limiti (sn)', inputEl('timeLimitSeconds', d.timeLimitSeconds, 'number')) +
        '</div><label class="tm-form-field tm-form-check"><input type="checkbox" data-fld="allowMultipleSelection"' + (d.allowMultipleSelection ? ' checked' : '') + '> Birden fazla seçim yapılabilir</label>';
    }
    return '';
  }
  function bindAnswerBlock() { /* radyo/checkbox doğal çalışır; kaydetmede okunur */ }

  function readVal(body, fld) { var el = body.querySelector('[data-fld="' + fld + '"]'); if (!el) return undefined; return el.type === 'checkbox' ? el.checked : el.value; }
  function saveEditor(body, s, d, isNew) {
    var qt = s.attention ? 'multi_select_attention' : (readVal(body, 'questionType') || d.questionType);
    var mode = readVal(body, 'inputMode') || d.inputMode || 'manual';
    // Soru İçeriği: manuel modda zengin metin (görsel üstü/altı), vektörel modda kısa açıklama.
    var aboveHtml = '', belowHtml = '', resultHtml = '', qText = '';
    var vecName = null;
    if (mode === 'vector') {
      qText = (readVal(body, 'questionText') || '').trim();
      vecName = (readVal(body, 'vectorFileName') || '').trim() || null;
    } else {
      aboveHtml = readRteHtml(body, 'aboveImageHtml');
      belowHtml = readRteHtml(body, 'belowImageHtml');
      resultHtml = readRteHtml(body, 'resultHtml');
      var aboveTxt = readRteText(body, 'aboveImageHtml');
      var belowTxt = readRteText(body, 'belowImageHtml');
      qText = aboveTxt || belowTxt;
    }
    var out = {
      id: d.id, contentType: s.contentType,
      gradeLevel: readVal(body, 'gradeLevel'),
      inputMode: mode,
      vectorFileName: vecName,
      addedBy: d.addedBy || AUTHOR_NAME,
      questionText: qText,
      aboveImageHtml: aboveHtml,
      belowImageHtml: belowHtml,
      resultHtml: resultHtml,
      imageUrl: (readVal(body, 'imageUrl') || '').trim() || null,
      questionType: qt,
      score: parseInt(readVal(body, 'score'), 10) || 0,
      xp: s.hasXp ? (parseInt(readVal(body, 'xp'), 10) || 0) : null,
      isActive: !!readVal(body, 'isActive'),
      order: d.order,
      options: [], correctTextAnswer: null, correctNumberAnswer: null
    };
    if (!out.questionText && !(mode === 'vector' && out.imageUrl)) {
      toast(mode === 'vector' ? 'Vektörel soru için dosya veya kısa açıklama gereklidir.' : 'Görsel üstü metin (soru metni) zorunludur.', 'error');
      return false;
    }
    if (!out.questionText && out.imageUrl) out.questionText = 'Vektörel soru';
    if (isExamFlow()) out.examNo = d.examNo || ES().exam || 1;
    if (s.hasSubject) { out.subject = readVal(body, 'subject'); out.section = SUBJ[out.subject] ? SUBJ[out.subject].section : 'numeric'; out.topic = (readVal(body, 'topic') || '').trim(); out.subTopic = (readVal(body, 'subTopic') || '').trim(); }
    if (s.hasMonth) { out.month = readVal(body, 'month'); out.year = d.year || 2026; }
    if (s.hasQuarter) out.quarter = readVal(body, 'quarter');
    if (s.hasWeek) { out.educationWeek = parseInt(readVal(body, 'educationWeek'), 10) || 1; out.lessonMode = readVal(body, 'lessonMode'); out.homeworkTitle = (readVal(body, 'homeworkTitle') || '').trim(); }
    if (s.hasXp && !(out.xp > 0)) { toast('Haftalık ödevlerde XP zorunludur.', 'error'); return false; }

    if (qt === 'multiple_choice') {
      var correct = body.querySelector('input[name="syCorrect"]:checked');
      var cid = correct ? correct.value : 'A';
      out.options = ['A', 'B', 'C', 'D'].map(function (id) { var inp = body.querySelector('[data-opt="' + id + '"]'); return { id: id, text: inp ? inp.value.trim() : '', isCorrect: id === cid }; });
      if (out.options.every(function (o) { return !o.text; })) { toast('En az bir şık metni giriniz.', 'error'); return false; }
    } else if (qt === 'text_answer') {
      out.correctTextAnswer = (readVal(body, 'correctTextAnswer') || '').trim();
      out.caseSensitive = !!readVal(body, 'caseSensitive');
    } else if (qt === 'number_answer') {
      var n = readVal(body, 'correctNumberAnswer'); out.correctNumberAnswer = n === '' || n == null ? null : Number(n);
    } else if (qt === 'multi_select_attention') {
      out.attentionTaskType = readVal(body, 'attentionTaskType') || 'find_target_letters';
      out.instruction = (readVal(body, 'instruction') || '').trim();
      out.timeLimitSeconds = parseInt(readVal(body, 'timeLimitSeconds'), 10) || 60;
      out.allowMultipleSelection = !!readVal(body, 'allowMultipleSelection');
      out.targetItems = (readVal(body, 'targetItems') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      out.distractorItems = (readVal(body, 'distractorItems') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      out.correctTargetsCount = parseInt(readVal(body, 'correctTargetsCount'), 10) || 0;
    }

    if (isNew) db.questions.push(out);
    else {
      var idx = db.questions.findIndex(function (x) { return x.id === out.id; });
      // Materyal içindeki değişiklikleri geçmişe yaz (eski → yeni + değiştiren)
      var before = idx >= 0 ? db.questions[idx] : null;
      if (before) {
        [{ f: 'score', l: 'Puan' },
         { f: 'topic', l: 'Konu' },
         { f: 'subTopic', l: 'Alt Konu' },
         { f: 'questionType', l: 'Tip', fmt: function (v) { return QTYPE_LABEL[v] || v; } },
         { f: 'questionText', l: 'Soru Metni' },
         { f: 'isActive', l: 'Durum', fmt: function (v) { return v ? 'Aktif' : 'Pasif'; } }
        ].forEach(function (fd) {
          var a = before[fd.f], b = out[fd.f];
          if (String(a == null ? '' : a) === String(b == null ? '' : b)) return;
          logQuestionChange(out.id, fd.f, fd.l, fd.fmt ? fd.fmt(a) : a, fd.fmt ? fd.fmt(b) : b);
        });
        var aAns = correctText(before), bAns = correctText(out);
        if (aAns !== bAns) logQuestionChange(out.id, 'correct', 'Cevap', aAns, bAns);
      }
      if (idx >= 0) db.questions[idx] = out;
      else db.questions.push(out); // üretilen haftalık soru → kalıcı kayda dönüşür
    }

    // Seçilen "Soru Sırası"na göre görünümdeki soruları yeniden sırala.
    var desiredPos = parseInt(readVal(body, 'orderPos'), 10);
    if (desiredPos) {
      var view = questionsFor(activeSection);
      var ids = view.map(function (q) { return q.id; });
      var cur = ids.indexOf(out.id);
      if (cur >= 0) {
        ids.splice(cur, 1);
        var target = Math.max(0, Math.min(ids.length, desiredPos - 1));
        ids.splice(target, 0, out.id);
        ids.forEach(function (id, i) { var qq = findQ(id); if (qq) qq.order = i + 1; });
      }
    }

    saveDb(); refreshList();
    toast(isNew ? 'Soru eklendi.' : 'Soru güncellendi.');
    return true;
  }

  /* ----------------------------- Init ----------------------------- */
  function mount() {
    document.body.classList.add('tm-admin-body');
    document.documentElement.classList.add('tm-admin-root');
    var hud = document.getElementById('syHudMount'); if (hud) hud.innerHTML = renderHud();
    var sb = document.getElementById('sySidebarMount'); if (sb) sb.innerHTML = renderSidebar();
    bindShell();
    renderSection();
    if (!mount._navBound) { mount._navBound = true; window.addEventListener('popstate', onPopNav); }
    replaceNav();
  }
  function bindShell() {
    function reSidebar() { document.getElementById('sySidebarMount').innerHTML = renderSidebar(); bindShell(); }
    document.querySelectorAll('[data-sy-nav]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); activeSection = a.getAttribute('data-sy-nav'); reSidebar(); renderSection(); replaceNav(); closeMobile(); });
    });
    // Soru Havuzu başlığı + Akademik/Dikkat grup seçimi.
    var poolToggle = document.querySelector('[data-sy-pool-toggle]');
    if (poolToggle) poolToggle.addEventListener('click', function (e) {
      e.preventDefault(); poolMenuOpen = !poolMenuOpen; reSidebar();
    });
    document.querySelectorAll('[data-sy-pool-group]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        poolGroup = a.getAttribute('data-sy-pool-group');
        poolFilters.subject = 'all'; poolFilters.questionType = 'all';
        poolMenuOpen = true;
        reSidebar(); renderSection(); closeMobile();
      });
    });
    // Sınav akışlı bölüm başlıkları — alt menüyü aç/kapat (ve bölüme geç).
    document.querySelectorAll('[data-sy-toggle]').forEach(function (toggle) {
      var key = toggle.getAttribute('data-sy-toggle');
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        if (activeSection !== key) { activeSection = key; examState[key].menuOpen = true; }
        else { examState[key].menuOpen = !examState[key].menuOpen; }
        reSidebar(); renderSection(); replaceNav();
      });
    });
    // Sınıf seçimi → o sınıfın sınav kartları (sağ ekranda) açılır.
    document.querySelectorAll('[data-sy-grade]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var key = a.getAttribute('data-sy-section') || 'placement';
        var st = examState[key];
        activeSection = key;
        st.grade = a.getAttribute('data-sy-grade');
        // Sınıf değişince o bölümün en üst katmanına dön: sınav akışında sınav
        // kartlarına, haftalık ödevlerde KİD/RUD seçimine.
        st.exam = null;
        st.subject = null;
        st.mode = null;
        st.week = null;
        st.menuOpen = true;
        reSidebar(); renderSection(); replaceNav(); closeMobile();
      });
    });
    var mob = document.getElementById('syMobileMenuBtn');
    var sidebar = document.querySelector('.tm-sidebar');
    if (mob && sidebar && !mob.dataset.inited) {
      mob.dataset.inited = '1';
      var bd = document.querySelector('.tm-sidebar-backdrop');
      if (!bd) { bd = document.createElement('div'); bd.className = 'tm-sidebar-backdrop'; document.body.appendChild(bd); }
      mob.addEventListener('click', function () { var open = sidebar.classList.toggle('is-mobile-open'); bd.classList.toggle('is-visible', open); });
      bd.addEventListener('click', closeMobile);
    }
  }
  function closeMobile() { var sb = document.querySelector('.tm-sidebar'); var bd = document.querySelector('.tm-sidebar-backdrop'); if (sb) sb.classList.remove('is-mobile-open'); if (bd) bd.classList.remove('is-visible'); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  global.SoruYazari = { render: renderSection };
})(typeof window !== 'undefined' ? window : this);
