/* ---------------------------------------------------------------------------
 * Bilenyum placement-questions.js — Seviye Belirleme soru bankası
 *
 * Ders başına soru adedi:
 *   Matematik 20 · Fen 20 · Türkçe 20 · Sosyal 10 · Din 10 · İngilizce 10
 *
 * Soru şeması:
 *   subjectCode: mat | trk | fen | ing | sos | din
 *   type:        standard | visual
 *   skill:       beceri (opsiyonel)
 *   unit, unitSubtitle, q, opts, correct
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var DEFAULT_VIDEO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

  var SUBJECT_COUNTS = {
    mat: 20,
    fen: 20,
    trk: 20,
    sos: 10,
    din: 10,
    ing: 10
  };

  var BANK_ORDER = ['mat', 'fen', 'trk', 'sos', 'din', 'ing'];

  var SVG_GRID_AREA =
    '<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="220" height="160" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<g transform="translate(30,24)" stroke="rgba(168,164,240,0.35)" stroke-width="1.5">' +
        '<line x1="0" y1="0" x2="160" y2="0"/><line x1="0" y1="32" x2="160" y2="32"/>' +
        '<line x1="0" y1="64" x2="160" y2="64"/><line x1="0" y1="96" x2="160" y2="96"/>' +
        '<line x1="0" y1="128" x2="160" y2="128"/>' +
        '<line x1="0" y1="0" x2="0" y2="128"/><line x1="32" y1="0" x2="32" y2="128"/>' +
        '<line x1="64" y1="0" x2="64" y2="128"/><line x1="96" y1="0" x2="96" y2="128"/>' +
        '<line x1="128" y1="0" x2="128" y2="128"/><line x1="160" y1="0" x2="160" y2="128"/>' +
        '<rect x="1" y="1" width="94" height="62" fill="rgba(229,4,123,0.45)" stroke="none"/>' +
        '<rect x="97" y="1" width="62" height="30" fill="rgba(74,214,255,0.40)" stroke="none"/>' +
      '</g>' +
      '<text x="110" y="152" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-size="11" font-family="JetBrains Mono,monospace">Her kare = 1 birim²</text>' +
    '</svg>';

  var SVG_TRIANGLE_ANGLE =
    '<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="240" height="180" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<polygon points="40,150 200,150 120,30" fill="rgba(74,214,255,0.12)" stroke="#4ad6ff" stroke-width="2.5"/>' +
      '<text x="52" y="142" fill="#ffd84a" font-size="14" font-weight="700">65°</text>' +
      '<text x="168" y="142" fill="#ffd84a" font-size="14" font-weight="700">45°</text>' +
      '<text x="108" y="58" fill="#ffb6dc" font-size="16" font-weight="800">?</text>' +
    '</svg>';

  var SVG_BAR_CHART =
    '<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="260" height="170" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<line x1="40" y1="130" x2="230" y2="130" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>' +
      '<rect x="55" y="70" width="36" height="60" rx="4" fill="#e5047b"/>' +
      '<rect x="105" y="40" width="36" height="90" rx="4" fill="#4ad6ff"/>' +
      '<rect x="155" y="90" width="36" height="40" rx="4" fill="#6dd49e"/>' +
      '<rect x="205" y="55" width="36" height="75" rx="4" fill="#ffd84a"/>' +
      '<text x="73" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">A</text>' +
      '<text x="123" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">B</text>' +
      '<text x="173" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">C</text>' +
      '<text x="223" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">D</text>' +
    '</svg>';

  function svgShape(kind) {
    if (kind === 'sym') {
      return '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="rgba(255,255,255,0.06)"/><polygon points="32,10 54,54 10,54" fill="rgba(74,214,255,0.35)" stroke="#4ad6ff" stroke-width="2"/></svg>';
    }
    return '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="rgba(255,255,255,0.06)"/><polygon points="12,48 52,48 44,16 20,28" fill="rgba(229,4,123,0.35)" stroke="#e5047b" stroke-width="2"/></svg>';
  }

  var SEED_QUESTIONS = [
    {
      subjectCode: 'mat', type: 'standard',
      unit: 'Doğal Sayılar', unitSubtitle: 'Çarpma İşlemi',
      q: '12 × 8 işleminin sonucu kaçtır?', opts: ['84', '96', '102', '88'], correct: 1, videoUrl: DEFAULT_VIDEO
    },
    {
      subjectCode: 'mat', type: 'visual', skill: 'beceri', subject: 'Matematik',
      unit: 'Geometri', unitSubtitle: 'Alan Hesaplama',
      q: 'Şekilde boyalı birim karelerin toplam alanı kaç birim karedir?',
      visual: { svg: SVG_GRID_AREA, alt: 'Birim kare ızgara', caption: 'Her kare 1 birim²' },
      opts: ['6 birim²', '8 birim²', '10 birim²', '12 birim²'], correct: 1
    },
    {
      subjectCode: 'mat', type: 'visual', skill: 'beceri', subject: 'Matematik',
      unit: 'Geometri', unitSubtitle: 'Açılar ve Üçgenler',
      q: 'Üçgende ? ile gösterilen açının ölçüsü kaç derecedir?',
      visual: { svg: SVG_TRIANGLE_ANGLE, alt: 'Üçgen açı sorusu' },
      opts: ['60°', '70°', '80°', '90°'], correct: 1
    },
    {
      subjectCode: 'mat', type: 'visual', skill: 'beceri', subject: 'Matematik',
      unit: 'Geometri', unitSubtitle: 'Simetri',
      q: 'Hangisi en az bir simetri eksenine sahiptir?',
      visual: { svg: svgShape('sym'), alt: 'Simetri örneği' },
      opts: [
        { label: 'Şekil I', svg: svgShape('asym') },
        { label: 'Şekil II', svg: svgShape('sym') },
        { label: 'Şekil III', svg: svgShape('asym') },
        { label: 'Şekil IV', svg: svgShape('sym') }
      ],
      correct: 1
    },
    {
      subjectCode: 'fen', type: 'standard',
      unit: 'Canlılar ve Yaşam', unitSubtitle: 'Canlı–Cansız Ayrımı',
      q: 'Aşağıdakilerden hangisi bir canlıdır?', opts: ['Taş', 'Su', 'Bitki', 'Hava'], correct: 2
    },
    {
      subjectCode: 'fen', type: 'standard',
      unit: 'Uzay ve Güneş Sistemi', unitSubtitle: 'Gezegenler',
      q: 'Güneş sisteminde Dünya\'dan sonra gelen gezegen hangisidir?', opts: ['Venüs', 'Mars', 'Jüpiter', 'Merkür'], correct: 1
    },
    {
      subjectCode: 'trk', type: 'standard',
      unit: 'Dil Bilgisi', unitSubtitle: 'Fiil ve Özne',
      q: '"Koşmak" fiilinin öznesi hangisidir?', opts: ['Hızlı', 'Ali', 'Dün', 'Güzel'], correct: 1
    },
    {
      subjectCode: 'trk', type: 'standard',
      unit: 'Dil Bilgisi', unitSubtitle: 'İsim Türleri',
      q: 'Aşağıdakilerden hangisi somut isimdir?', opts: ['Sevgi', 'Mutluluk', 'Masa', 'Cesaret'], correct: 2
    },
    {
      subjectCode: 'sos', type: 'standard',
      unit: 'Tarih', unitSubtitle: 'Kurtuluş Savaşı Dönemi',
      q: 'Türkiye Büyük Millet Meclisi hangi yılda açılmıştır?', opts: ['1919', '1920', '1921', '1923'], correct: 1
    },
    {
      subjectCode: 'sos', type: 'standard',
      unit: 'Coğrafya', unitSubtitle: 'Çevre ve Erozyon',
      q: 'Erozyonun önlenmesi için alınabilecek önlemlerden biri hangisidir?', opts: ['Ağaç kesimi', 'Aşırı otlatma', 'Ağaçlandırma', 'Yanlış sulama'], correct: 2
    },
    {
      subjectCode: 'din', type: 'visual', skill: 'beceri', subject: 'Din Kültürü',
      unit: 'Değerler', unitSubtitle: 'Grafik Okuma',
      q: 'Grafikte en yüksek sütun hangi seçeneği temsil eder?',
      visual: { svg: SVG_BAR_CHART, alt: 'Sütun grafiği' },
      opts: ['A', 'B', 'C', 'D'], correct: 1
    },
    {
      subjectCode: 'din', type: 'standard',
      unit: 'İbadetler', unitSubtitle: 'Namaz',
      q: 'İslam dininde günde beş vakit kılınan ibadet hangisidir?', opts: ['Oruç', 'Namaz', 'Zekât', 'Hac'], correct: 1
    },
    {
      subjectCode: 'ing', type: 'standard',
      unit: 'Grammar', unitSubtitle: 'Present Simple',
      q: '"She ___ to school every day." — Boşluğa hangisi gelir?', opts: ['go', 'goes', 'going', 'went'], correct: 1
    },
    {
      subjectCode: 'ing', type: 'standard',
      unit: 'Vocabulary', unitSubtitle: 'Adjectives',
      q: '"Beautiful" kelimesinin Türkçe karşılığı hangisidir?', opts: ['Hızlı', 'Güzel', 'Zor', 'Ucuz'], correct: 1
    }
  ];

  function cloneQuestion(seed, subjectIndex) {
    var copy = JSON.parse(JSON.stringify(seed));
    copy.unitSubtitle = (copy.unitSubtitle || '—') + ' · Soru ' + (subjectIndex + 1);
    return copy;
  }

  function buildQuestionBank(seeds, counts, order) {
    var bySubject = {};
    seeds.forEach(function (q) {
      var code = q.subjectCode || 'mat';
      if (!bySubject[code]) bySubject[code] = [];
      bySubject[code].push(q);
    });

    var bank = [];
    order.forEach(function (code) {
      var target = counts[code] || 0;
      var pool = bySubject[code] || [];
      if (!pool.length) {
        pool = [{
          subjectCode: code,
          type: 'standard',
          unit: 'Genel',
          unitSubtitle: 'Seviye Belirleme',
          q: 'Bu derste örnek soru metni yer alır. Doğru seçeneği işaretle.',
          opts: ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
          correct: 0
        }];
      }
      for (var i = 0; i < target; i++) {
        bank.push(cloneQuestion(pool[i % pool.length], i));
      }
    });
    return bank;
  }

  global.BilenyumPlacementSubjectCounts = SUBJECT_COUNTS;
  global.BilenyumPlacementQuestions = buildQuestionBank(SEED_QUESTIONS, SUBJECT_COUNTS, BANK_ORDER);
})(typeof window !== 'undefined' ? window : this);
