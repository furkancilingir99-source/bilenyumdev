/* ---------------------------------------------------------------------------
 * Bilenyum homework-questions.js — Ödev soru setleri (görselli çoktan seçmeli)
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var SVG_CARD_RECT =
    '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
        '<filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">' +
          '<feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="rgba(26,21,56,0.22)"/>' +
        '</filter>' +
      '</defs>' +
      '<rect width="320" height="200" rx="12" fill="rgba(26,21,56,0.03)"/>' +
      '<g filter="url(#cardShadow)">' +
        '<rect x="70" y="44" width="180" height="112" rx="4" fill="#c9a66b" stroke="#a8844a" stroke-width="2"/>' +
      '</g>' +
      '<text x="160" y="108" text-anchor="middle" fill="#1a1538" font-size="28" font-weight="800" font-family="Plus Jakarta Sans, Arial, sans-serif">56 cm²</text>' +
    '</svg>';

  var SVG_GRID =
    '<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="220" height="160" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<g transform="translate(30,24)" stroke="rgba(168,164,240,0.35)" stroke-width="1.5">' +
        '<rect x="1" y="1" width="94" height="62" fill="rgba(229,4,123,0.45)" stroke="none"/>' +
        '<rect x="97" y="1" width="62" height="30" fill="rgba(74,214,255,0.40)" stroke="none"/>' +
      '</g>' +
    '</svg>';

  var SVG_TRIANGLE =
    '<svg viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="240" height="180" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<polygon points="40,150 200,150 120,30" fill="rgba(74,214,255,0.12)" stroke="#4ad6ff" stroke-width="2.5"/>' +
      '<text x="52" y="142" fill="#ffd84a" font-size="14" font-weight="700">65°</text>' +
      '<text x="168" y="142" fill="#ffd84a" font-size="14" font-weight="700">45°</text>' +
      '<text x="108" y="58" fill="#ffb6dc" font-size="16" font-weight="800">?</text>' +
    '</svg>';

  var SVG_WATER_CYCLE =
    '<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="260" height="170" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<ellipse cx="130" cy="45" rx="40" ry="22" fill="rgba(255,255,255,0.15)"/>' +
      '<path d="M40 130 Q80 90 130 110 T220 130" fill="none" stroke="#4ad6ff" stroke-width="2.5"/>' +
      '<rect x="0" y="130" width="260" height="40" fill="rgba(74,214,255,0.25)"/>' +
      '<text x="130" y="155" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11">Su · Buharlaşma · Yağış</text>' +
    '</svg>';

  var SVG_FOOD_CHAIN =
    '<svg viewBox="0 0 280 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="280" height="120" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<circle cx="50" cy="60" r="28" fill="rgba(109,212,158,0.35)" stroke="#6dd49e" stroke-width="2"/>' +
      '<text x="50" y="65" text-anchor="middle" fill="#fff" font-size="11">Ot</text>' +
      '<text x="95" y="65" fill="#ffd84a" font-size="18">→</text>' +
      '<circle cx="140" cy="60" r="28" fill="rgba(255,154,74,0.35)" stroke="#ff9a4a" stroke-width="2"/>' +
      '<text x="140" y="65" text-anchor="middle" fill="#fff" font-size="11">Tavşan</text>' +
      '<text x="185" y="65" fill="#ffd84a" font-size="18">→</text>' +
      '<circle cx="230" cy="60" r="28" fill="rgba(229,4,123,0.35)" stroke="#e5047b" stroke-width="2"/>' +
      '<text x="230" y="65" text-anchor="middle" fill="#fff" font-size="11">Kartal</text>' +
    '</svg>';

  var SVG_DIALOGUE =
    '<svg viewBox="0 0 260 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="260" height="140" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<rect x="24" y="24" width="120" height="44" rx="10" fill="rgba(74,214,255,0.25)" stroke="#4ad6ff"/>' +
      '<text x="36" y="52" fill="#fff" font-size="11">How often do you…?</text>' +
      '<rect x="116" y="72" width="120" height="44" rx="10" fill="rgba(229,4,123,0.25)" stroke="#e5047b"/>' +
      '<text x="128" y="100" fill="#fff" font-size="11">I usually…</text>' +
    '</svg>';

  function symSvg(sym) {
    return '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="rgba(255,255,255,0.06)"/>' +
      '<text x="32" y="42" text-anchor="middle" fill="#ffd84a" font-size="28" font-weight="800">' + sym + '</text></svg>';
  }

  global.BilenyumHomeworkSets = {
    'mat-koklu': {
      id: 'mat-koklu',
      subject: 'mat',
      subjectLabel: 'Matematik',
      homeworkType: 'rud',
      eduWeek: 11,
      gradeLevel: 8,
      unit: 'Sayılar ve Nicelikler',
      unitSubtitle: 'Köklü Sayılarda Dört İşlem',
      teacher: 'Mehmet Yılmaz',
      teacherRole: 'Matematik Öğretmeni',
      description: 'Köklü sayılarda toplama, çıkarma, çarpma ve bölme işlemleri. PDF içinde 15 örnek soru var. Önce konu tekrarını yapıp soruları sırayla çözmeni öneririm. Takıldığın yerleri not al, ders saatinde birlikte bakarız.',
      maxXp: 75,
      dueAt: '2026-05-23 23:59',
      videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      icon: '📐',
      title: 'Köklü Sayılar',
      topic: 'Köklü Sayılar · 15 Soru',
      questions: [
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Çarpanlar ve Katlar',
          unitSubtitle: 'Alan ve Çevre Problemleri',
          videoSolution: '56 = 7×8 olduğundan kenarlar 7 cm ve 8 cm olabilir. Çevre = 2×(7+8) = 30 cm. Doğru cevap B şıkkıdır.',
          blocks: [
            {
              kind: 'lead',
              text: 'Aşağıda dikdörtgen şeklinde bir karton ve bu kartonun bir yüzünün alanı gösterilmiştir.'
            },
            {
              kind: 'figure',
              svg: SVG_CARD_RECT,
              alt: 'Alan 56 cm² olan dikdörtgen karton'
            },
            {
              kind: 'text',
              text: 'Bu kartonun kenar uzunlukları santimetre cinsinden birer doğal sayıdır.'
            },
            {
              kind: 'prompt',
              text: 'Buna göre bu kartonun çevre uzunluğu en az kaç santimetredir?',
              underline: ['en az']
            }
          ],
          opts: ['57', '30', '18', '15'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Geometri ve Ölçme',
          unitSubtitle: 'Birim Karelerle Alan',
          q: 'Şekilde boyalı birim karelerin toplam alanı kaç birim karedir?',
          visual: { svg: SVG_GRID, alt: 'Birim kare ızgara', caption: 'Her kare 1 birim²' },
          opts: ['6 birim²', '8 birim²', '10 birim²', '12 birim²'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Geometri ve Ölçme',
          unitSubtitle: 'Üçgende Açılar',
          q: 'Üçgende ? ile gösterilen açının ölçüsü kaç derecedir?',
          visual: { svg: SVG_TRIANGLE, alt: 'Üçgen açı sorusu' },
          opts: ['60°', '70°', '80°', '90°'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü İfadelerin Sadeleştirilmesi',
          q: '√48 ifadesinin sadeleştirilmiş hali hangisidir?',
          visual: { svg: symSvg('√48'), alt: 'Kök 48' },
          opts: ['4√3', '6√2', '2√12', '8√6'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Toplama ve Çıkarma',
          q: '2√5 + 3√5 işleminin sonucu hangisidir?',
          opts: ['5√5', '6√5', '5√10', '10√5'], correct: 0
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Geometri ve Ölçme',
          unitSubtitle: 'Simetri',
          q: 'Hangisi en az bir simetri eksenine sahiptir?',
          visual: { svg: SVG_GRID, alt: 'Simetri örneği' },
          opts: [
            { label: 'Şekil I', svg: symSvg('▲') },
            { label: 'Şekil II', svg: symSvg('◆') },
            { label: 'Şekil III', svg: symSvg('F') },
            { label: 'Şekil IV', svg: symSvg('N') }
          ],
          correct: 1
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Çarpma',
          q: '√6 · √24 işleminin sonucu hangisidir?',
          opts: ['6√2', '12', '4√3', '2√6'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü İfadelerin Sadeleştirilmesi',
          q: '√72 ifadesinin sadeleştirilmiş hali hangisidir?',
          visual: { svg: symSvg('√72'), alt: 'Kök 72' },
          opts: ['6√2', '8√2', '3√8', '12√6'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Toplama',
          q: '√18 + √8 işleminin sonucu hangisidir?',
          opts: ['5√2', '√26', '6√2', '4√2'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Çarpma',
          q: '3√2 · 2√3 işleminin sonucu hangisidir?',
          opts: ['5√5', '6√6', '6√5', '12'], correct: 1
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Çıkarma',
          q: '√50 − √18 işleminin sonucu hangisidir?',
          opts: ['2√2', '4√2', '√32', '8'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Bölme',
          q: '√27 ÷ √3 işleminin sonucu hangisidir?',
          opts: ['3', '√9', '3√3', '9'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Rasyonel ve İrrasyonel Sayılar',
          q: 'Aşağıdakilerden hangisi irrasyonel bir sayıdır?',
          opts: ['√16', '√25', '√7', '√36'], correct: 2
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Toplama',
          q: '√20 + √45 işleminin sonucu hangisidir?',
          opts: ['5√5', '√65', '13√5', '7√5'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Bölme',
          q: '2√12 ÷ √3 işleminin sonucu hangisidir?',
          opts: ['2√4', '4', '2√3', '6'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Dört İşlem',
          q: '√75 − √48 işleminin sonucu hangisidir?',
          visual: { svg: symSvg('√?'), alt: 'Köklü ifade' },
          opts: ['√3', '3√3', '5√3', '√27'], correct: 1
        },
        {
          type: 'standard',
          unit: 'Köklü Sayılar',
          unitSubtitle: 'Köklü Sayılarda Karşılaştırma',
          q: '√50 ile 7√2 sayılarından hangisi daha büyüktür?',
          opts: ['√50', '7√2', 'Eşitler', 'Karşılaştırılamaz'], correct: 1
        }
      ]
    },
    'fen-dongu': {
      id: 'fen-dongu',
      subject: 'fen',
      subjectLabel: 'Fen Bilimleri',
      homeworkType: 'kid',
      eduWeek: 8,
      gradeLevel: 8,
      unit: 'Madde ve Doğa',
      unitSubtitle: 'Madde Döngüleri',
      teacher: 'Ayşe Demir',
      teacherRole: 'Fen Bilimleri Öğretmeni',
      description: 'Karbon, su ve azot döngüleri için kavram haritası hazırlayacaksın. Etkinlik dosyasını indirip her döngüyü çevremizdeki örneklerle ilişkilendirmeni bekliyorum 🌱',
      maxXp: 60,
      dueAt: '2026-05-24 18:00',
      icon: '🧬',
      title: 'Madde Döngüleri',
      topic: 'Madde Döngüleri · Etkinlik',
      questions: [
        {
          type: 'visual', skill: 'beceri', subject: 'Fen Bilimleri',
          unit: 'Madde ve Doğa',
          unitSubtitle: 'Su Döngüsü',
          q: 'Şemada oklarla gösterilen süreç aşağıdakilerden hangisidir?',
          visual: { svg: SVG_WATER_CYCLE, alt: 'Su döngüsü şeması', caption: 'Su döngüsü basitleştirilmiş model' },
          opts: ['Su döngüsü', 'Karbon döngüsü', 'Azot döngüsü', 'Fotosentez'], correct: 0
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Fen Bilimleri',
          unit: 'Canlılar ve Yaşam',
          unitSubtitle: 'Besin Zinciri',
          q: 'Yiyecek zincirinde birincil tüketici hangisidir?',
          visual: { svg: SVG_FOOD_CHAIN, alt: 'Yiyecek zinciri' },
          opts: ['Ot', 'Tavşan', 'Kartal', 'Güneş'], correct: 1
        },
        {
          type: 'standard',
          unit: 'Madde ve Doğa',
          unitSubtitle: 'Fotosentez ve Karbon Döngüsü',
          q: 'Bitkilerin atmosferdeki karbondioksiti azaltmasının temel nedeni hangisidir?',
          opts: ['Fotosentez', 'Solunum', 'Boşaltım', 'Sindirim'], correct: 0
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Fen Bilimleri',
          unit: 'Madde ve Doğa',
          unitSubtitle: 'Atmosfer Bileşenleri',
          q: 'Grafikte en yüksek sütun hangi seçeneği temsil eder?',
          visual: {
            svg: '<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg"><rect width="260" height="170" rx="12" fill="rgba(255,255,255,0.04)"/><rect x="55" y="70" width="36" height="60" rx="4" fill="#e5047b"/><rect x="105" y="40" width="36" height="90" rx="4" fill="#4ad6ff"/><rect x="155" y="90" width="36" height="40" rx="4" fill="#6dd49e"/><text x="73" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">O₂</text><text x="123" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">CO₂</text><text x="173" y="148" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="10">N₂</text></svg>',
            alt: 'Gaz oranları grafiği'
          },
          opts: ['O₂', 'CO₂', 'N₂', 'He'], correct: 1
        },
        {
          type: 'standard',
          unit: 'Madde ve Doğa',
          unitSubtitle: 'Çevre ve Erozyon',
          q: 'Toprak erozyonunu önlemek için en uygun uygulama hangisidir?',
          opts: ['Ağaçlandırma', 'Aşırı otlatma', 'Ağaç kesimi', 'Yanlış sulama'], correct: 0
        }
      ]
    },
    'ing-friendship': {
      id: 'ing-friendship',
      subject: 'ing',
      subjectLabel: 'İngilizce',
      homeworkType: 'rud',
      eduWeek: 9,
      gradeLevel: 8,
      unit: 'Life and Culture',
      unitSubtitle: 'Friendship',
      teacher: 'Sarah Johnson',
      teacherRole: 'İngilizce Öğretmeni',
      description: 'In our Friendship unit reading passages, complete the 12-question comprehension test attached. Try without dictionary first. We will review difficult words together in class 🌟',
      maxXp: 45,
      dueAt: '2026-05-26 17:00',
      icon: '🔤',
      title: 'Friendship',
      topic: 'Friendship · Reading',
      questions: [
        {
          type: 'visual', skill: 'beceri', subject: 'İngilizce',
          unit: 'Life and Culture',
          unitSubtitle: 'Friendship Dialogues',
          q: 'Look at the dialogue. Which question fits in the first speech bubble?',
          visual: { svg: SVG_DIALOGUE, alt: 'Dialogue between friends' },
          opts: ['How often do you meet?', 'What is your name?', 'Where is the library?', 'How old are you?'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Grammar',
          unitSubtitle: 'Simple Present Tense',
          q: '"She ___ to school every day." — Boşluğa hangisi gelir?',
          opts: ['go', 'goes', 'going', 'went'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'İngilizce',
          unit: 'Vocabulary',
          unitSubtitle: 'Frequency Adverbs',
          q: 'Which frequency adverb matches "three times a week"?',
          visual: { svg: symSvg('3×'), alt: 'Frequency' },
          opts: ['always', 'usually', 'sometimes', 'never'], correct: 1
        },
        {
          type: 'standard',
          unit: 'Vocabulary',
          unitSubtitle: 'Word Meanings',
          q: '"Beautiful" kelimesinin Türkçe karşılığı hangisidir?',
          opts: ['Hızlı', 'Güzel', 'Zor', 'Ucuz'], correct: 1
        },
        {
          type: 'standard',
          unit: 'Life and Culture',
          unitSubtitle: 'Character Traits',
          q: 'A good friend should be ___ and trustworthy.',
          opts: ['selfish', 'honest', 'lazy', 'rude'], correct: 1
        }
      ]
    },
    'trk-paragraf': {
      id: 'trk-paragraf',
      subject: 'trk',
      subjectLabel: 'Türkçe',
      homeworkType: 'rud',
      eduWeek: 10,
      gradeLevel: 8,
      unit: 'Okuma Kültürü',
      unitSubtitle: 'Paragrafta Ana Fikir ve Yardımcı Fikir',
      teacher: 'Zeynep Kaya',
      teacherRole: 'Türkçe Öğretmeni',
      description: 'Paragrafta ana fikir, yardımcı fikir ve anlatım biçimleri konulu soruları çöz. Cevaplarında gerekçe belirt; LGS tarzı paragraf analizi tekniklerini uygula.',
      maxXp: 50,
      dueAt: '2026-05-22 18:00',
      icon: '📖',
      title: 'Paragraf Anlamı',
      topic: 'Paragraf Anlamı · 8 Soru',
      completed: true,
      questions: [
        {
          type: 'visual', skill: 'beceri', subject: 'Türkçe',
          unit: 'Okuma Kültürü',
          unitSubtitle: 'Paragrafta Ana Fikir',
          q: 'Parçada altı çizili cümle hangi anlamı taşır?',
          visual: { svg: symSvg('¶'), alt: 'Paragraf', caption: 'Bu ödev tamamlandı — gözden geçirme modu' },
          opts: ['Ana fikir', 'Örnek', 'Karşılaştırma', 'Sonuç'], correct: 0
        },
        {
          type: 'standard',
          unit: 'Dil Bilgisi',
          unitSubtitle: 'İsim Türleri',
          q: 'Aşağıdakilerden hangisi somut isimdir?',
          opts: ['Sevgi', 'Mutluluk', 'Masa', 'Cesaret'], correct: 2
        }
      ]
    },
    'genel-deneme-12': {
      id: 'genel-deneme-12',
      examType: 'deneme',
      subject: 'genel',
      subjectLabel: 'Genel Deneme',
      homeworkType: 'rud',
      eduWeek: 17,
      gradeLevel: 8,
      unit: 'LGS Genel Deneme',
      unitSubtitle: '80 Soru · 5 Ders · 135 Dakika',
      title: 'Bilenyum Genel Deneme · 12',
      topic: 'LGS Formatı · 10 Soru (Demo)',
      questions: [
        {
          type: 'visual', skill: 'beceri', subject: 'Matematik',
          unit: 'Geometri', unitSubtitle: 'Üçgende Açı',
          q: 'Şekilde verilen ABC üçgeninde m(∠A) = 65° ve m(∠B) = 45° olduğuna göre m(∠C) kaç derecedir?',
          visual: { svg: SVG_TRIANGLE, alt: 'Üçgen açı sorusu' },
          opts: ['60°', '70°', '80°', '90°'], correct: 1
        },
        {
          type: 'standard', subject: 'Matematik',
          unit: 'Sayılar', unitSubtitle: 'Köklü Sayılar',
          q: '√48 + √27 ifadesinin sadeleştirilmiş hali aşağıdakilerden hangisidir?',
          opts: ['5√3', '6√3', '7√3', '8√3'], correct: 2
        },
        {
          type: 'visual', skill: 'beceri', subject: 'Fen Bilimleri',
          unit: 'Madde ve Doğa', unitSubtitle: 'Su Döngüsü',
          q: 'Görselde numaralandırılan olaylardan hangisi yoğuşmadır?',
          visual: { svg: SVG_WATER_CYCLE, alt: 'Su döngüsü' },
          opts: ['1', '2', '3', '4'], correct: 1
        },
        {
          type: 'standard', subject: 'Fen Bilimleri',
          unit: 'Canlılar', unitSubtitle: 'Besin Zinciri',
          q: 'Bir besin zincirinde enerji akışı hangi yönde gerçekleşir?',
          opts: ['Üreticiden tüketiciye', 'Tüketiciden üreticiye', 'Her iki yönde eşit', 'Rastgele'], correct: 0
        },
        {
          type: 'standard', subject: 'Türkçe',
          unit: 'Anlam Bilgisi', unitSubtitle: 'Paragraf',
          q: 'Aşağıdaki cümlelerden hangisi kanıt cümlesi niteliğindedir?',
          opts: ['Kitap okumak çok keyiflidir.', 'Araştırmaya göre düzenli okuyan öğrenciler kelime dağarcığı %30 artar.', 'Herkes okumalı.', 'Okumak güzeldir.'], correct: 1
        },
        {
          type: 'standard', subject: 'Türkçe',
          unit: 'Dil Bilgisi', unitSubtitle: 'Fiilimsiler',
          q: '"Koşarak okula gitti." cümlesindeki "koşarak" sözcüğü hangi fiilimsi türündedir?',
          opts: ['İsim-fiil', 'Sıfat-fiil', 'Zarf-fiil', 'Fiil'], correct: 2
        },
        {
          type: 'standard', subject: 'Sosyal Bilgiler',
          unit: 'Tarih', unitSubtitle: 'Osmanlı',
          q: 'Osmanlı Devleti\'nde Lale Devri hangi padişah döneminde yaşanmıştır?',
          opts: ['III. Ahmet', 'II. Mahmut', 'IV. Murat', 'Yavuz Sultan Selim'], correct: 0
        },
        {
          type: 'standard', subject: 'Din Kültürü',
          unit: 'Ahlak', unitSubtitle: 'Temel Değerler',
          q: 'İslam\'da "doğruluk" kavramını en iyi ifade eden kavram hangisidir?',
          opts: ['Sabır', 'Sidk', 'Şükür', 'Tevazu'], correct: 1
        },
        {
          type: 'visual', skill: 'beceri', subject: 'İngilizce',
          unit: 'Grammar', unitSubtitle: 'Simple Present',
          q: 'Look at the dialogue. Which question fits in the first speech bubble?',
          visual: { svg: SVG_DIALOGUE, alt: 'Dialogue' },
          opts: ['How often do you meet?', 'What is your name?', 'Where is the library?', 'How old are you?'], correct: 0
        },
        {
          type: 'standard', subject: 'Matematik',
          unit: 'Veri', unitSubtitle: 'Olasılık',
          q: 'Adil bir zar atıldığında tek sayı gelme olasılığı kaçtır?',
          opts: ['1/6', '1/3', '1/2', '2/3'], correct: 2
        }
      ]
    }
  };
})(typeof window !== 'undefined' ? window : this);
