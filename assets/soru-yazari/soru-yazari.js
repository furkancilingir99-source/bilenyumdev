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
  var WEEKS = []; for (var w = 1; w <= 36; w++) WEEKS.push(w);
  var LESSON_MODES = [{ id: 'KID', name: 'KİD — Kavram İnşa Dersi' }, { id: 'RUD', name: 'RUD — Rehberli Uygulama Dersi' }];
  var LMODE = { KID: 'KİD', RUD: 'RUD' };
  var QUARTERS = [
    { id: 'q1', name: '1. Dönem · Ocak–Mart' }, { id: 'q2', name: '2. Dönem · Nisan–Haziran' },
    { id: 'q3', name: '3. Dönem · Temmuz–Eylül' }, { id: 'q4', name: '4. Dönem · Ekim–Aralık' }
  ];
  var QUARTER = {}; QUARTERS.forEach(function (q) { QUARTER[q.id] = q.name; });
  var QTYPE_LABEL = { multiple_choice: '4 Seçenekli', text_answer: 'Text Cevaplı', number_answer: 'Number Cevaplı', multi_select_attention: 'Çoklu Seçim' };
  var ATTENTION_TASKS = [
    { id: 'find_target_letters', name: 'Harf bulma' }, { id: 'find_target_shapes', name: 'Şekil bulma' },
    { id: 'find_target_numbers', name: 'Sayı bulma' }, { id: 'find_target_colors', name: 'Renk bulma' }
  ];
  var ATASK = {}; ATTENTION_TASKS.forEach(function (a) { ATASK[a.id] = a.name; });
  // Örnek konu/alt konu (soru yazarına açılır menü doldurmak için).
  var TOPICS = {
    mathematics: { 'Üslü İfadeler': ['Üslü İfadelerde Toplama ve Çıkarma', 'Üslü İfadelerde Çarpma ve Bölme'], 'Kareköklü İfadeler': ['Kareköklü İfadelerde Çarpma ve Bölme', 'Kareköklü İfadelerde Toplama ve Çıkarma'], 'Çarpanlar ve Katlar': ['EBOB - EKOK', 'Asal Çarpanlar'] },
    science: { 'Basınç': ['Katı Basıncı', 'Sıvı Basıncı'], 'DNA ve Genetik Kod': ['Kalıtım', 'Mutasyon'], 'Madde ve Endüstri': ['Periyodik Sistem', 'Fiziksel ve Kimyasal Değişim'] },
    turkish: { 'Fiilimsiler': ['İsim-Fiil', 'Sıfat-Fiil', 'Zarf-Fiil'], 'Cümlenin Ögeleri': ['Özne ve Yüklem', 'Nesne ve Tümleç'], 'Sözcükte Anlam': ['Gerçek ve Mecaz Anlam', 'Eş ve Zıt Anlam'] },
    social: { 'Bir Kahraman Doğuyor': ['Mustafa Kemal’in Hayatı', 'Fikir Akımları'], 'Milli Uyanış': ['Cepheler', 'Kongreler'] },
    religion: { 'Kader İnancı': ['İnsan İradesi', 'Tevekkül'], 'Zekat ve Sadaka': ['Paylaşma', 'İbadetler'] },
    english: { 'Friendship': ['Making Friends', 'Feelings'], 'Tourism': ['Places', 'Directions'] }
  };
  function topicsOf(subjectId) { return Object.keys(TOPICS[subjectId] || {}); }
  function subtopicsOf(subjectId, topic) { return (TOPICS[subjectId] || {})[topic] || []; }

  /* ----------------------------- Bölüm tanımları ----------------------------- */
  var SECTIONS = {
    placement: {
      label: 'Seviye Belirleme Sınavı', contentType: 'placement_exam',
      desc: 'Öğrencinin platforma ilk adımında girdiği, akademik seviyesini ölçen sınav. Ders, sınıf, konu ve soru tipi bazında soruları yönetin.',
      hasSubject: true, hasMonth: false, hasWeek: false, hasQuarter: false, hasXp: false, attention: false
    },
    monthly: {
      label: 'Aylık Deneme Sınavı', contentType: 'monthly_trial_exam',
      desc: 'Eğitim süreci boyunca her ay uygulanan deneme sınavı. Ay seçerek ilgili ayın sorularını yönetin.',
      hasSubject: true, hasMonth: true, hasWeek: false, hasQuarter: false, hasXp: false, attention: false
    },
    attention_initial: {
      label: 'Dikkat Testi — İlk Giriş', contentType: 'attention_initial',
      desc: 'Platforma ilk girişte uygulanan dikkat ölçüm testi. Çoklu seçim ve süre limiti destekler.',
      hasSubject: false, hasMonth: false, hasWeek: false, hasQuarter: false, hasXp: false, attention: true
    },
    attention_quarterly: {
      label: 'Dikkat Testi — 3 Aylık', contentType: 'attention_quarterly',
      desc: 'Dikkat gelişimini izlemek için 3 ayda bir yayınlanan dikkat testi. Dönem bazında yönetilir.',
      hasSubject: false, hasMonth: false, hasWeek: false, hasQuarter: true, hasXp: false, attention: true
    },
    weekly: {
      label: 'Haftalık Ödevler', contentType: 'weekly_homework',
      desc: 'Ders sürecinde haftalık tamamlanacak ödev soruları. Ders, sınıf, hafta ve KİD/RUD ders tipi bazında yönetin.',
      hasSubject: true, hasMonth: false, hasWeek: true, hasQuarter: false, hasXp: true, attention: false
    }
  };
  var NAV_ORDER = ['placement', 'monthly', 'attention_initial', 'attention_quarterly', 'weekly'];

  /* ----------------------------- Mock store ----------------------------- */
  var SKEY = 'bilenyum_soru_yazari_v3';
  function nowSeq(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 8); }
  function loadDb() { try { var raw = sessionStorage.getItem(SKEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function saveDb() { try { sessionStorage.setItem(SKEY, JSON.stringify(db)); } catch (e) {} }

  function seedDb() {
    var list = [];
    var id = 0;
    function q(o) { id++; o.id = 'question-' + String(id).padStart(3, '0'); list.push(o); }
    // Seviye Belirleme — birkaç örnek
    q({ contentType: 'placement_exam', gradeLevel: '8', subject: 'mathematics', section: 'numeric', topic: 'Kareköklü İfadeler', subTopic: 'Kareköklü İfadelerde Çarpma ve Bölme', questionText: '√12 · √3 işleminin sonucu kaçtır?', imageUrl: null, questionType: 'multiple_choice', options: [{ id: 'A', text: '6', isCorrect: true }, { id: 'B', text: '4', isCorrect: false }, { id: 'C', text: '9', isCorrect: false }, { id: 'D', text: '12', isCorrect: false }], correctTextAnswer: null, correctNumberAnswer: null, score: 10, xp: null, order: 1, isActive: true });
    q({ contentType: 'placement_exam', gradeLevel: '8', subject: 'science', section: 'numeric', topic: 'Basınç', subTopic: 'Sıvı Basıncı', questionText: 'Sıvı basıncı hangi faktöre bağlı değildir?', imageUrl: null, questionType: 'multiple_choice', options: [{ id: 'A', text: 'Yükseklik', isCorrect: false }, { id: 'B', text: 'Yoğunluk', isCorrect: false }, { id: 'C', text: 'Kabın şekli', isCorrect: true }, { id: 'D', text: 'Yer çekimi', isCorrect: false }], correctTextAnswer: null, correctNumberAnswer: null, score: 10, xp: null, order: 2, isActive: true });
    q({ contentType: 'placement_exam', gradeLevel: '7', subject: 'turkish', section: 'verbal', topic: 'Fiilimsiler', subTopic: 'İsim-Fiil', questionText: '“Koşmak sağlıklıdır.” cümlesindeki isim-fiil hangisidir?', imageUrl: null, questionType: 'text_answer', options: [], correctTextAnswer: 'koşmak', correctNumberAnswer: null, caseSensitive: false, score: 10, xp: null, order: 3, isActive: true });
    q({ contentType: 'placement_exam', gradeLevel: '5', subject: 'mathematics', section: 'numeric', topic: 'Çarpanlar ve Katlar', subTopic: 'EBOB - EKOK', questionText: '12 ve 18 sayılarının EBOB’u kaçtır?', imageUrl: null, questionType: 'number_answer', options: [], correctTextAnswer: null, correctNumberAnswer: 6, score: 10, xp: null, order: 4, isActive: false });
    // Aylık Deneme
    q({ contentType: 'monthly_trial_exam', month: 'january', year: 2026, gradeLevel: '8', subject: 'mathematics', section: 'numeric', topic: 'Üslü İfadeler', subTopic: 'Üslü İfadelerde Çarpma ve Bölme', questionText: '2³ · 2² işleminin sonucu kaçtır?', imageUrl: null, questionType: 'multiple_choice', options: [{ id: 'A', text: '32', isCorrect: true }, { id: 'B', text: '16', isCorrect: false }, { id: 'C', text: '64', isCorrect: false }, { id: 'D', text: '8', isCorrect: false }], correctTextAnswer: null, correctNumberAnswer: null, score: 10, xp: null, order: 1, isActive: true });
    q({ contentType: 'monthly_trial_exam', month: 'february', year: 2026, gradeLevel: '7', subject: 'english', section: 'verbal', topic: 'Friendship', subTopic: 'Feelings', questionText: 'Choose the correct word: I feel ___ when I see my friends.', imageUrl: null, questionType: 'multiple_choice', options: [{ id: 'A', text: 'happy', isCorrect: true }, { id: 'B', text: 'table', isCorrect: false }, { id: 'C', text: 'run', isCorrect: false }, { id: 'D', text: 'blue', isCorrect: false }], correctTextAnswer: null, correctNumberAnswer: null, score: 10, xp: null, order: 2, isActive: true });
    // Dikkat — İlk Giriş
    q({ contentType: 'attention_initial', gradeLevel: '5', questionText: 'Ekrandaki B harflerini seçiniz.', imageUrl: null, questionType: 'multi_select_attention', attentionTaskType: 'find_target_letters', instruction: 'Ekrandaki tüm B harflerine tıklayın.', timeLimitSeconds: 60, allowMultipleSelection: true, targetItems: ['B'], distractorItems: ['C', 'D', 'E', 'P', 'R'], correctTargetsCount: 3, score: 15, xp: null, order: 1, isActive: true });
    q({ contentType: 'attention_initial', gradeLevel: '6', questionText: 'Kırmızı daireleri işaretleyiniz.', imageUrl: null, questionType: 'multi_select_attention', attentionTaskType: 'find_target_colors', instruction: 'Tüm kırmızı daireleri seçin.', timeLimitSeconds: 45, allowMultipleSelection: true, targetItems: ['Kırmızı daire'], distractorItems: ['Mavi daire', 'Sarı kare'], correctTargetsCount: 4, score: 15, xp: null, order: 2, isActive: true });
    // Dikkat — 3 Aylık
    q({ contentType: 'attention_quarterly', quarter: 'q1', gradeLevel: '5', questionText: 'Ekrandaki 7 rakamlarını seçiniz.', imageUrl: null, questionType: 'multi_select_attention', attentionTaskType: 'find_target_numbers', instruction: 'Tüm 7 rakamlarına tıklayın.', timeLimitSeconds: 60, allowMultipleSelection: true, targetItems: ['7'], distractorItems: ['1', '4', '9'], correctTargetsCount: 5, score: 15, xp: null, order: 1, isActive: true });
    // Haftalık Ödev
    q({ contentType: 'weekly_homework', educationWeek: 1, lessonMode: 'RUD', gradeLevel: '5', subject: 'mathematics', section: 'numeric', topic: 'Üslü İfadeler', subTopic: 'Üslü İfadelerde Toplama ve Çıkarma', homeworkTitle: '1. Hafta RUD Matematik Ödevi', questionText: '3² + 3² işleminin sonucu kaçtır?', imageUrl: null, questionType: 'number_answer', options: [], correctTextAnswer: null, correctNumberAnswer: 18, score: 10, xp: 20, order: 1, isActive: true });
    q({ contentType: 'weekly_homework', educationWeek: 1, lessonMode: 'KID', gradeLevel: '6', subject: 'science', section: 'numeric', topic: 'Madde ve Endüstri', subTopic: 'Periyodik Sistem', homeworkTitle: '1. Hafta KİD Fen Ödevi', questionText: 'Periyodik tabloda dönem sayısı kaçtır?', imageUrl: null, questionType: 'multiple_choice', options: [{ id: 'A', text: '7', isCorrect: true }, { id: 'B', text: '8', isCorrect: false }, { id: 'C', text: '18', isCorrect: false }, { id: 'D', text: '5', isCorrect: false }], correctTextAnswer: null, correctNumberAnswer: null, score: 10, xp: 25, order: 2, isActive: true });
    // Sınav yayın durumu — 'published' (Yayında) | 'editing' (Düzenleniyor). Anahtar: sınıf-sınavNo.
    var examStatus = { '5-1': 'published', '8-1': 'published', '7-1': 'editing' };
    return { questions: list, examStatus: examStatus };
  }

  var db = loadDb() || seedDb();
  if (!db.examStatus) db.examStatus = {};
  if (!loadDb()) saveDb();
  function examStatusOf(grade, no) { return db.examStatus[grade + '-' + no] || 'editing'; }
  function setExamStatus(grade, no, status) { db.examStatus[grade + '-' + no] = status; saveDb(); }

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
      // Seviye Belirleme Sınavı: sınıf bazlı açılır alt menü.
      if (key === 'placement') {
        var open = placementMenuOpen;
        var sub = '<div class="sy-subnav' + (open ? ' is-open' : '') + '" data-sy-subnav>' + GRADES.map(function (g) {
          return '<a class="sy-subnav-link' + (active && placementGrade === g ? ' is-active' : '') + '" href="#placement" data-sy-grade="' + g + '">' + esc(gradeLabel(g)) + '</a>';
        }).join('') + '</div>';
        return '<div class="sy-nav-group">' +
          '<button type="button" class="tm-sidebar-link sy-nav-parent' + (active ? ' is-active' : '') + (open ? ' is-open' : '') + '" data-sy-toggle="placement"' + (active ? ' aria-current="page"' : '') + '>' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span>' + CHEVRON + '</button>' +
          sub + '</div>';
      }
      return '<a class="tm-sidebar-link' + (active ? ' is-active' : '') + '" href="#' + key + '" data-sy-nav="' + key + '"' + (active ? ' aria-current="page"' : '') + '>' + NAV_ICON[key] + '<span>' + esc(s.label) + '</span></a>';
    }).join('');
    return '<nav class="tm-sidebar-nav">' + links + '</nav>';
  }

  /* ----------------------------- Durum ----------------------------- */
  var activeSection = 'placement';
  var filters = {}; // section-key -> {field:value}
  NAV_ORDER.forEach(function (k) { filters[k] = {}; });
  // Seviye Belirleme: sınıf → sınav kartları → sorular akışı.
  var placementGrade = '5';    // seçili sınıf
  var placementExam = null;    // seçili sınav no (null = sınav kartları)
  var placementSubject = null; // seçili ders (null = ders kartları)
  var placementMenuOpen = true; // alt menü açık/kapalı

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
    if (s.hasWeek) els.push(selectEl('week', 'Tüm haftalar', WEEKS.map(function (n) { return { v: String(n), l: n + '. Hafta' }; }), f.week));
    if (s.hasQuarter) els.push(selectEl('quarter', 'Tüm dönemler', QUARTERS.map(function (q) { return { v: q.id, l: q.name }; }), f.quarter));
    // Seviye Belirleme'de sınıf sol menüden/sınavdan gelir; filtre çubuğunda tekrar gösterme.
    if (key !== 'placement') els.push(selectEl('gradeLevel', 'Tüm sınıflar', GRADES.map(function (g) { return { v: g, l: gradeLabel(g) }; }), f.gradeLevel));
    if (s.hasSubject) {
      // Seviye Belirleme'de ders, ders kartından geldiği için filtre çubuğunda gösterilmez.
      if (key !== 'placement') {
        els.push(selectEl('subject', 'Tüm dersler', SUBJECTS.map(function (x) { return { v: x.id, l: x.name }; }), f.subject));
        els.push(selectEl('section', 'Tüm bölümler', [{ v: 'numeric', l: 'Sayısal' }, { v: 'verbal', l: 'Sözel' }], f.section));
      }
      els.push(selectEl('topic', 'Tüm konular', allTopicsFor(key).map(function (t) { return { v: t, l: t }; }), f.topic));
    }
    if (s.hasWeek) els.push(selectEl('lessonMode', 'KİD / RUD', LESSON_MODES.map(function (m) { return { v: m.id, l: m.id }; }), f.lessonMode));
    if (s.attention) els.push(selectEl('attentionTaskType', 'Tüm görev tipleri', ATTENTION_TASKS.map(function (a) { return { v: a.id, l: a.name }; }), f.attentionTaskType));
    if (!s.attention) els.push(selectEl('questionType', 'Tüm soru tipleri', qTypesFor(key).map(function (t) { return { v: t, l: QTYPE_LABEL[t] }; }), f.questionType));
    els.push(selectEl('isActive', 'Tümü (aktif/pasif)', [{ v: 'active', l: 'Aktif' }, { v: 'passive', l: 'Pasif' }], f.isActive));
    return '<div class="tm-dg-toolbar-row sy-filter-row">' + els.join('') +
      '<span class="tm-dg-spacer"></span>' +
      '<button type="button" class="tm-btn tm-btn--primary tm-btn--sm" data-sy-add>+ Soru ekle</button>' +
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
    if (key === 'placement') {
      if (placementGrade) list = list.filter(function (q) { return q.gradeLevel === placementGrade; });
      if (placementExam != null) list = list.filter(function (q) { return (q.examNo || 1) === placementExam; });
      if (placementSubject) list = list.filter(function (q) { return q.subject === placementSubject; });
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

  function listHtml(key, list) {
    var s = SECTIONS[key];
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
      cells += '<td>' + esc(gradeLabel(q.gradeLevel)) + '</td>';
      if (s.hasSubject) cells += '<td>' + esc(SUBJ[q.subject] ? SUBJ[q.subject].name : '—') + '</td><td>' + esc(q.topic || '—') + (q.subTopic ? ' · ' + esc(q.subTopic) : '') + '</td>';
      if (s.attention) cells += '<td>' + esc(ATASK[q.attentionTaskType] || '—') + '</td><td>' + esc(q.timeLimitSeconds != null ? q.timeLimitSeconds + ' sn' : '—') + '</td>';
      cells += '<td>' + esc(QTYPE_LABEL[q.questionType] || q.questionType) + '</td><td>' + (q.score != null ? q.score : '—') + '</td>';
      if (s.hasXp) cells += '<td>' + (q.xp != null ? q.xp : '—') + '</td>';
      cells += '<td>' + correctSummary(q) + '</td><td>' + activeBadge(q) + '</td>' +
        '<td class="sy-td-act"><span class="tm-row-actions">' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-sy-edit="' + q.id + '" title="Düzenle">' + EDIT_ICON + '</button>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-sy-del="' + q.id + '" title="Sil">' + DEL_ICON + '</button>' +
        '</span></td>';
      return '<tr data-row="' + q.id + '">' + cells + '</tr>';
    }).join('');
    return '<div class="tm-res-table-wrap sy-table-wrap"><table class="tm-res-table sy-table"><thead><tr>' + head + '</tr></thead><tbody data-sy-rows>' + rows + '</tbody></table></div>';
  }

  /* ----------------------------- Seviye Belirleme: sınav kartları ----------------------------- */
  function placementExams(grade) {
    var qs = db.questions.filter(function (q) { return q.contentType === 'placement_exam' && q.gradeLevel === grade; });
    var nums = {};
    qs.forEach(function (q) { nums[q.examNo || 1] = true; });
    [1, 2, 3].forEach(function (n) { if (!(n in nums)) nums[n] = true; }); // en az 3 sınav kartı
    return Object.keys(nums).map(Number).sort(function (a, b) { return a - b; }).map(function (n) {
      var inExam = qs.filter(function (q) { return (q.examNo || 1) === n; });
      return { no: n, count: inExam.length, active: inExam.filter(function (q) { return q.isActive; }).length };
    });
  }
  var CHECK_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var PENCIL_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  function examStatusBadge(status) {
    return status === 'published'
      ? '<span class="tm-badge tm-badge--green sy-status-badge">' + CHECK_ICON + ' Yayında</span>'
      : '<span class="tm-badge tm-badge--orange sy-status-badge">' + PENCIL_ICON + ' Düzenleniyor</span>';
  }
  function renderExamCards(grade) {
    var exams = placementExams(grade);
    var cards = exams.map(function (e) {
      var status = examStatusOf(grade, e.no);
      var toggleLabel = status === 'published' ? 'Taslağa al' : 'Yayına al';
      return '<article class="tm-dash-card sy-exam-card" data-sy-exam-open="' + e.no + '" role="button" tabindex="0">' +
        '<div class="tm-dash-card-head"><h2 class="tm-dash-card-title">Seviye Belirleme Sınavı - ' + e.no + '</h2>' +
          examStatusBadge(status) + '</div>' +
        '<div class="sy-exam-meta"><span><strong>' + e.count + '</strong> soru</span></div>' +
        '<div class="sy-exam-foot">' +
          '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-exam-toggle" data-sy-exam-toggle="' + e.no + '">' + toggleLabel + '</button>' +
          '<span class="tm-btn tm-btn--primary tm-btn--sm sy-exam-open-btn" data-sy-exam-open="' + e.no + '">Sınavı Aç &rarr;</span>' +
        '</div>' +
      '</article>';
    }).join('');
    var nextNo = (exams.length ? Math.max.apply(null, exams.map(function (e) { return e.no; })) : 0) + 1;
    cards += '<button type="button" class="sy-exam-card sy-exam-add" data-sy-exam-open="' + nextNo + '"><span class="sy-exam-add-plus">+</span><span>Yeni Sınav ekle (' + nextNo + ')</span></button>';
    return '<div class="sy-exam-grid">' + cards + '</div>';
  }

  // Sınav içindeki ders kartları — her ders farklı renk + ikon, soru sayısı, "Sınavı Düzenle".
  function renderSubjectCards(grade, exam) {
    var qs = db.questions.filter(function (q) { return q.contentType === 'placement_exam' && q.gradeLevel === grade && (q.examNo || 1) === exam; });
    var cards = SUBJECTS.map(function (sub) {
      var st = subjectStyle(sub.id);
      var count = qs.filter(function (q) { return q.subject === sub.id; }).length;
      return '<article class="tm-dash-card sy-subject-card" data-sy-subject="' + sub.id + '" role="button" tabindex="0" style="--sy-c:' + st.color + '">' +
        '<div class="sy-subject-top"><span class="sy-subject-icon">' + st.icon + '</span>' +
          '<h2 class="sy-subject-name">' + esc(sub.name) + '</h2><span class="sy-subject-tag">' + esc(SECTION_LABEL[sub.section]) + '</span></div>' +
        '<div class="sy-exam-meta"><span><strong>' + count + '</strong> soru</span></div>' +
        '<span class="tm-btn tm-btn--primary tm-btn--sm sy-subject-edit" data-sy-subject="' + sub.id + '">Sınavı Düzenle &rarr;</span>' +
      '</article>';
    }).join('');
    return '<div class="sy-exam-grid sy-subject-grid">' + cards + '</div>';
  }
  function bindSubjectCards(main) {
    main.querySelectorAll('[data-sy-subject]').forEach(function (el) {
      function open() { placementSubject = el.getAttribute('data-sy-subject'); renderSection(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    var back = main.querySelector('[data-sy-subject-back]');
    if (back) back.addEventListener('click', function () { placementExam = null; placementSubject = null; renderSection(); });
  }

  /* ----------------------------- Bölüm render ----------------------------- */
  function renderSection() {
    var main = document.getElementById('syMain');
    var s = SECTIONS[activeSection];

    // Seviye Belirleme: sınav seçilmemiş → sınav kartları; ders seçilmemiş → ders kartları; seçilmiş → sorular.
    if (activeSection === 'placement' && placementExam == null) {
      main.innerHTML = '<div class="sy-page-head"><h1 class="sy-page-title">Seviye Belirleme Sınavı · ' + esc(gradeLabel(placementGrade)) + '</h1><p class="sy-page-sub">Bir sınav seçin; ardından ders kartlarından soruları yönetin.</p></div>' + renderExamCards(placementGrade);
      bindExamCards(main);
      return;
    }
    if (activeSection === 'placement' && placementSubject == null) {
      main.innerHTML = '<div class="sy-page-head">' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm sy-back" data-sy-subject-back>&larr; Sınavlara dön</button>' +
        '<h1 class="sy-page-title">Seviye Belirleme Sınavı - ' + placementExam + ' · ' + esc(gradeLabel(placementGrade)) + '</h1>' +
        '<p class="sy-page-sub">Düzenlemek istediğiniz dersi seçin.</p></div>' + renderSubjectCards(placementGrade, placementExam);
      bindSubjectCards(main);
      return;
    }

    var titleHtml, backHtml = '';
    if (activeSection === 'placement') {
      titleHtml = 'Seviye Belirleme Sınavı - ' + placementExam + ' · ' + esc(gradeLabel(placementGrade)) + ' · ' + esc(SUBJ[placementSubject] ? SUBJ[placementSubject].name : '');
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

  function bindExamCards(main) {
    main.querySelectorAll('[data-sy-exam-open]').forEach(function (el) {
      function open() { placementExam = parseInt(el.getAttribute('data-sy-exam-open'), 10); placementSubject = null; renderSection(); }
      el.addEventListener('click', open);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    main.querySelectorAll('[data-sy-exam-toggle]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var no = parseInt(b.getAttribute('data-sy-exam-toggle'), 10);
        var cur = examStatusOf(placementGrade, no);
        var toPublish = cur !== 'published';
        function apply() {
          setExamStatus(placementGrade, no, toPublish ? 'published' : 'editing');
          toast(toPublish ? 'Sınav yayına alındı.' : 'Sınav taslağa alındı.');
          renderSection();
        }
        var title = 'Seviye Belirleme Sınavı - ' + no;
        if (Confirm) {
          Confirm.open({
            title: toPublish ? 'Sınavı yayına al' : 'Sınavı taslağa al',
            warning: toPublish
              ? title + ' (' + gradeLabel(placementGrade) + ') sınavını yayına almak istediğinize emin misiniz? Öğrenciler bu sınavı görebilecek.'
              : title + ' (' + gradeLabel(placementGrade) + ') sınavını taslağa almak istediğinize emin misiniz? Öğrenciler bu sınavı artık göremez.',
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
    if (backBtn) backBtn.addEventListener('click', function () { placementSubject = null; renderSection(); });
    var addBtn = main.querySelector('[data-sy-add]');
    if (addBtn) addBtn.addEventListener('click', function () { openEditor(null); });
    main.querySelectorAll('[data-sy-edit]').forEach(function (b) { b.addEventListener('click', function () { openEditor(findQ(b.getAttribute('data-sy-edit'))); }); });
    main.querySelectorAll('[data-sy-del]').forEach(function (b) { b.addEventListener('click', function () { confirmDelete(b.getAttribute('data-sy-del')); }); });
    bindDrag(main);
  }
  function findQ(id) { return db.questions.find(function (q) { return q.id === id; }); }

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
    function doDel() { db.questions = db.questions.filter(function (x) { return x.id !== id; }); saveDb(); refreshList(); toast('Soru silindi.'); }
    if (Confirm) Confirm.open({ title: 'Soruyu sil', warning: '“' + (q.questionText || '').slice(0, 60) + '” sorusunu silmek istediğinize emin misiniz?', requireReason: false, confirmLabel: 'Sil', cancelLabel: 'Vazgeç', danger: true, onConfirm: doDel });
    else if (window.confirm('Soruyu silmek istediğinize emin misiniz?')) doDel();
  }

  /* ----------------------------- Editör modalı ----------------------------- */
  function field(label, ctrl, req) { return '<label class="tm-form-field">' + esc(label) + (req ? ' <span class="tm-req">*</span>' : '') + ctrl + '</label>'; }
  function inputEl(fld, val, type) { return '<input class="tm-dg-control" type="' + (type || 'text') + '" data-fld="' + fld + '" value="' + esc(val == null ? '' : val) + '">'; }
  function selEl(fld, val, options) { return '<select class="tm-dg-control" data-fld="' + fld + '">' + options.map(function (o) { return opt(o.v, o.l, String(val) === String(o.v)); }).join('') + '</select>'; }

  function openEditor(q) {
    var s = SECTIONS[activeSection];
    var isNew = !q;
    var d = q ? JSON.parse(JSON.stringify(q)) : defaultQuestion();
    var existing = document.getElementById('syEditModal');
    if (existing) existing.remove();
    var ov = document.createElement('div');
    ov.className = 'tm-crit-overlay is-open'; ov.id = 'syEditModal';
    ov.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal sy-edit-modal" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles"><h2 class="tm-crit-title">' + (isNew ? 'Yeni Soru' : 'Soruyu Düzenle') + '</h2>' +
          '<p class="tm-detail-modal-sub">' + esc(s.label) + '</p></div>' +
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
    var q = { id: nowSeq('question'), contentType: s.contentType, gradeLevel: (activeSection === 'placement' ? placementGrade : '5'), questionText: '', imageUrl: null, questionType: s.attention ? 'multi_select_attention' : 'multiple_choice', options: [{ id: 'A', text: '', isCorrect: true }, { id: 'B', text: '', isCorrect: false }, { id: 'C', text: '', isCorrect: false }, { id: 'D', text: '', isCorrect: false }], correctTextAnswer: '', correctNumberAnswer: null, caseSensitive: false, score: 10, xp: s.hasXp ? 20 : null, order: nextOrder, isActive: true };
    if (activeSection === 'placement') q.examNo = placementExam || 1;
    if (s.hasSubject) {
      q.subject = (activeSection === 'placement' && placementSubject) ? placementSubject : 'mathematics';
      q.section = SUBJ[q.subject] ? SUBJ[q.subject].section : 'numeric'; q.topic = ''; q.subTopic = '';
    }
    if (s.hasMonth) { q.month = 'january'; q.year = 2026; }
    if (s.hasWeek) { q.educationWeek = 1; q.lessonMode = 'RUD'; q.homeworkTitle = ''; }
    if (s.hasQuarter) q.quarter = 'q1';
    if (s.attention) { q.attentionTaskType = 'find_target_letters'; q.instruction = ''; q.timeLimitSeconds = 60; q.allowMultipleSelection = true; q.targetItems = []; q.distractorItems = []; q.correctTargetsCount = 1; }
    return q;
  }

  function renderEditorBody(body, s, d) {
    var meta = [];
    meta.push(field('Sınıf Seviyesi', selEl('gradeLevel', d.gradeLevel, GRADES.map(function (g) { return { v: g, l: gradeLabel(g) }; })), true));
    if (s.hasMonth) meta.push(field('Ay', selEl('month', d.month, MONTHS.map(function (m) { return { v: m.id, l: m.name }; })), true));
    if (s.hasQuarter) meta.push(field('3 Aylık Dönem', selEl('quarter', d.quarter, QUARTERS.map(function (q) { return { v: q.id, l: q.name }; })), true));
    if (s.hasWeek) {
      meta.push(field('Eğitim Haftası', selEl('educationWeek', d.educationWeek, WEEKS.map(function (n) { return { v: n, l: n + '. Hafta' }; })), true));
      meta.push(field('Ders Tipi', selEl('lessonMode', d.lessonMode, LESSON_MODES.map(function (m) { return { v: m.id, l: m.name }; })), true));
    }
    if (s.hasSubject) {
      meta.push(field('Ders', selEl('subject', d.subject, SUBJECTS.map(function (x) { return { v: x.id, l: x.name }; })), true));
      meta.push(field('Bölüm', '<input class="tm-dg-control" data-fld="section" value="' + esc(SECTION_LABEL[d.section] || '') + '" readonly>'));
      meta.push(field('Konu', '<input class="tm-dg-control" data-fld="topic" list="syTopicList" value="' + esc(d.topic || '') + '">'));
      meta.push(field('Alt Konu', '<input class="tm-dg-control" data-fld="subTopic" list="sySubTopicList" value="' + esc(d.subTopic || '') + '">'));
    }
    if (!s.attention) meta.push(field('Soru Tipi', selEl('questionType', d.questionType, [{ v: 'multiple_choice', l: '4 Seçenekli' }, { v: 'text_answer', l: 'Text Cevaplı' }, { v: 'number_answer', l: 'Number Cevaplı' }]), true));
    if (s.attention) meta.push(field('Dikkat Görevi Tipi', selEl('attentionTaskType', d.attentionTaskType, ATTENTION_TASKS.map(function (a) { return { v: a.id, l: a.name }; })), true));
    meta.push(field('Puan', inputEl('score', d.score, 'number')));
    if (s.hasXp) meta.push(field('Kazandıracağı XP', inputEl('xp', d.xp, 'number'), true));
    meta.push('<label class="tm-form-field tm-form-check"><input type="checkbox" data-fld="isActive"' + (d.isActive ? ' checked' : '') + '> Aktif</label>');
    if (s.hasWeek) meta.push(field('Ödev Başlığı', inputEl('homeworkTitle', d.homeworkTitle)));

    var html =
      '<datalist id="syTopicList"></datalist><datalist id="sySubTopicList"></datalist>' +
      '<div class="sy-edit-section"><h3 class="sy-edit-title">Soru Bilgileri</h3><div class="tm-detail-grid tm-detail-grid--modal">' + meta.join('') + '</div></div>' +
      '<div class="sy-edit-section"><h3 class="sy-edit-title">Soru İçeriği</h3>' +
        '<label class="tm-form-field">Soru Metni <span class="tm-req">*</span><textarea class="tm-dg-control" data-fld="questionText" rows="3">' + esc(d.questionText) + '</textarea></label>' +
        (s.attention ? '<label class="tm-form-field">Hedef Seçim Açıklaması<textarea class="tm-dg-control" data-fld="instruction" rows="2">' + esc(d.instruction || '') + '</textarea></label>' : '') +
        imageBlock(d) +
      '</div>' +
      '<div class="sy-edit-section" data-answer-block><h3 class="sy-edit-title">Cevap</h3>' + answerBlock(s, d) + '</div>';
    body.innerHTML = html;

    // Konu/alt konu datalist doldur + ders değişince güncelle
    function refreshTopicLists() {
      var subEl = body.querySelector('[data-fld="subject"]');
      var subject = subEl ? subEl.value : null;
      var topicEl = body.querySelector('[data-fld="topic"]');
      var tl = document.getElementById('syTopicList'); var stl = document.getElementById('sySubTopicList');
      if (tl) tl.innerHTML = topicsOf(subject).map(function (t) { return '<option value="' + esc(t) + '">'; }).join('');
      if (stl) stl.innerHTML = subtopicsOf(subject, topicEl ? topicEl.value : '').map(function (t) { return '<option value="' + esc(t) + '">'; }).join('');
    }
    refreshTopicLists();
    var subjectSel = body.querySelector('[data-fld="subject"]');
    if (subjectSel) subjectSel.addEventListener('change', function () {
      var sub = SUBJ[subjectSel.value]; var secInput = body.querySelector('[data-fld="section"]');
      if (secInput && sub) secInput.value = SECTION_LABEL[sub.section];
      refreshTopicLists();
    });
    var topicInput = body.querySelector('[data-fld="topic"]');
    if (topicInput) topicInput.addEventListener('input', refreshTopicLists);

    // Soru tipi değişince cevap bloğunu değiştir
    var typeSel = body.querySelector('[data-fld="questionType"]');
    if (typeSel) typeSel.addEventListener('change', function () {
      d.questionType = typeSel.value;
      body.querySelector('[data-answer-block]').innerHTML = '<h3 class="sy-edit-title">Cevap</h3>' + answerBlock(s, d);
      bindAnswerBlock(body, s, d);
    });
    bindImage(body, d);
    bindAnswerBlock(body, s, d);
  }

  function imageBlock(d) {
    return '<div class="sy-image-block"><span class="tm-form-field-label">Soru Görseli</span>' +
      '<div class="sy-image-preview" data-img-preview>' + (d.imageUrl ? '<img src="' + esc(d.imageUrl) + '" alt="Soru görseli">' : '<span class="sy-image-empty">Görsel yok</span>') + '</div>' +
      '<div class="sy-image-actions"><input class="tm-dg-control" type="url" data-fld="imageUrl" placeholder="Görsel URL (opsiyonel)" value="' + esc(d.imageUrl || '') + '">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-img-clear>Kaldır</button></div></div>';
  }
  function bindImage(body, d) {
    var input = body.querySelector('[data-fld="imageUrl"]');
    var preview = body.querySelector('[data-img-preview]');
    function refresh() { var v = input.value.trim(); preview.innerHTML = v ? '<img src="' + esc(v) + '" alt="Soru görseli" onerror="this.parentNode.innerHTML=&quot;<span class=\\&quot;sy-image-empty\\&quot;>Görsel yüklenemedi</span>&quot;">' : '<span class="sy-image-empty">Görsel yok</span>'; }
    if (input) input.addEventListener('input', refresh);
    var clear = body.querySelector('[data-img-clear]');
    if (clear) clear.addEventListener('click', function () { input.value = ''; refresh(); });
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
    var out = {
      id: d.id, contentType: s.contentType,
      gradeLevel: readVal(body, 'gradeLevel'),
      questionText: (readVal(body, 'questionText') || '').trim(),
      imageUrl: (readVal(body, 'imageUrl') || '').trim() || null,
      questionType: qt,
      score: parseInt(readVal(body, 'score'), 10) || 0,
      xp: s.hasXp ? (parseInt(readVal(body, 'xp'), 10) || 0) : null,
      isActive: !!readVal(body, 'isActive'),
      order: d.order,
      options: [], correctTextAnswer: null, correctNumberAnswer: null
    };
    if (!out.questionText) { toast('Soru metni zorunludur.', 'error'); return false; }
    if (s.contentType === 'placement_exam') out.examNo = d.examNo || placementExam || 1;
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
    else { var idx = db.questions.findIndex(function (x) { return x.id === out.id; }); if (idx >= 0) db.questions[idx] = out; else db.questions.push(out); }
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
  }
  function bindShell() {
    function reSidebar() { document.getElementById('sySidebarMount').innerHTML = renderSidebar(); bindShell(); }
    document.querySelectorAll('[data-sy-nav]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); activeSection = a.getAttribute('data-sy-nav'); reSidebar(); renderSection(); closeMobile(); });
    });
    // Seviye Belirleme başlığı — alt menüyü aç/kapat (ve bölüme geç).
    var toggle = document.querySelector('[data-sy-toggle="placement"]');
    if (toggle) toggle.addEventListener('click', function (e) {
      e.preventDefault();
      if (activeSection !== 'placement') { activeSection = 'placement'; placementMenuOpen = true; }
      else { placementMenuOpen = !placementMenuOpen; }
      reSidebar(); renderSection();
    });
    // Sınıf seçimi → o sınıfın sınav kartları (sağ ekranda) açılır.
    document.querySelectorAll('[data-sy-grade]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        activeSection = 'placement';
        placementGrade = a.getAttribute('data-sy-grade');
        placementExam = null;
        placementSubject = null;
        placementMenuOpen = true;
        reSidebar(); renderSection(); closeMobile();
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
