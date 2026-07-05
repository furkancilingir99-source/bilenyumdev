/* ---------------------------------------------------------------------------
 * Bilenyum deneme-questions.js — Deneme sınavı soru bankası (seviye belirlemeden ayrı)
 * Her yeni oturumda ders havuzundan rastgele soru seçilir.
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';
  var BANK_KEY = 'denemeExamBank';

  var SUBJECT_COUNTS = {
    mat: 20,
    fen: 20,
    trk: 20,
    sos: 10,
    din: 10,
    ing: 10
  };

  var BANK_ORDER = ['mat', 'fen', 'trk', 'sos', 'din', 'ing'];

  var SVG_PIE =
    '<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="220" height="160" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<circle cx="110" cy="80" r="52" fill="rgba(74,214,255,0.12)" stroke="#4ad6ff" stroke-width="2"/>' +
      '<path d="M110 28 A52 52 0 0 1 162 80 L110 80 Z" fill="#e5047b" opacity="0.75"/>' +
      '<text x="110" y="148" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="11">Pasta grafik</text>' +
    '</svg>';

  var SVG_MAP =
    '<svg viewBox="0 0 260 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect width="260" height="170" rx="12" fill="rgba(255,255,255,0.04)"/>' +
      '<path d="M40 120 Q90 40 140 90 T220 70" fill="none" stroke="#6dd49e" stroke-width="3"/>' +
      '<circle cx="90" cy="55" r="6" fill="#ffd84a"/>' +
      '<circle cx="180" cy="78" r="6" fill="#e5047b"/>' +
      '<text x="90" y="42" fill="#ffd84a" font-size="12" font-weight="700">A</text>' +
      '<text x="180" y="65" fill="#e5047b" font-size="12" font-weight="700">B</text>' +
    '</svg>';

  /* Seviye belirleme bankasından farklı metinler */
  var DENEME_SEED_QUESTIONS = [
    { subjectCode: 'mat', type: 'standard', unit: 'Kesirler', unitSubtitle: 'Kesir Karşılaştırma',
      q: '3/4 ile 5/8 kesirlerinden hangisi daha büyüktür?', opts: ['3/4', '5/8', 'Eşit', 'Karşılaştırılamaz'], correct: 0 },
    { subjectCode: 'mat', type: 'standard', unit: 'Cebir', unitSubtitle: 'Denklem Kurma',
      q: 'Bir sayının 5 fazlasının 3 katı 27 ise sayı kaçtır?', opts: ['2', '4', '6', '8'], correct: 1 },
    { subjectCode: 'mat', type: 'standard', unit: 'Oran', unitSubtitle: 'Orantı',
      q: '2:5 oranında 14 birimlik paya karşılık gelen payda kaçtır?', opts: ['25', '30', '35', '40'], correct: 2 },
    { subjectCode: 'mat', type: 'visual', skill: 'beceri', unit: 'Veri', unitSubtitle: 'Pasta Grafiği',
      q: 'Grafikte pembe dilim yaklaşık olarak grafiğin kaçta birini temsil eder?',
      visual: { svg: SVG_PIE, alt: 'Pasta grafik' }, opts: ['1/2', '1/3', '1/4', '1/5'], correct: 2 },
    { subjectCode: 'mat', type: 'standard', unit: 'Geometri', unitSubtitle: 'Çevre',
      q: 'Kenar uzunlukları 6 cm ve 9 cm olan dikdörtgenin çevresi kaç cm\'dir?', opts: ['24', '30', '36', '54'], correct: 1 },

    { subjectCode: 'fen', type: 'standard', unit: 'Kuvvet ve Hareket', unitSubtitle: 'Sürtünme',
      q: 'Yüzey pürüzlülüğü arttıkça sürtünme kuvveti nasıl değişir?', opts: ['Azalır', 'Artar', 'Değişmez', 'Sıfır olur'], correct: 1 },
    { subjectCode: 'fen', type: 'standard', unit: 'Madde ve Isı', unitSubtitle: 'Hal Değişimi',
      q: 'Buzun erimesi hangi hal değişimidir?', opts: ['Donma', 'Erime', 'Buharlaşma', 'Yoğuşma'], correct: 1 },
    { subjectCode: 'fen', type: 'standard', unit: 'Elektrik', unitSubtitle: 'Devre Elemanları',
      q: 'Basit bir elektrik devresinde akımı açıp kapatan eleman hangisidir?', opts: ['Pil', 'Ampul', 'Anahtar', 'Kablo'], correct: 2 },
    { subjectCode: 'fen', type: 'standard', unit: 'Canlılar', unitSubtitle: 'Hücre',
      q: 'Bitki hücrelerinde hücre duvarını oluşturan yapı hangisidir?', opts: ['Sitoplazma', 'Selüloz', 'Çekirdek', 'Mitokondri'], correct: 1 },

    { subjectCode: 'trk', type: 'standard', unit: 'Yazım Kuralları', unitSubtitle: 'Birleşik Kelimeler',
      q: 'Aşağıdakilerden hangisi doğru yazılmıştır?', opts: ['Herkez', 'Herkes', 'Herkezde', 'Herkezle'], correct: 1 },
    { subjectCode: 'trk', type: 'standard', unit: 'Anlam Bilgisi', unitSubtitle: 'Deyimler',
      q: '"Kulak asmamak" deyiminin anlamı nedir?', opts: ['Dikkatle dinlemek', 'Umursamamak', 'Korkmak', 'Sevinmek'], correct: 1 },
    { subjectCode: 'trk', type: 'standard', unit: 'Dil Bilgisi', unitSubtitle: 'Zamirler',
      q: '"Ben, sen, o" sözcükleri hangi kelime türüne girer?', opts: ['İsim', 'Fiil', 'Zamir', 'Sıfat'], correct: 2 },
    { subjectCode: 'trk', type: 'standard', unit: 'Paragraf', unitSubtitle: 'Ana Fikir',
      q: 'Bir paragrafın ana fikri genellikle nerede bulunur?', opts: ['Sadece girişte', 'Sadece sonuçta', 'Paragrafın bütününde', 'Başlıkta'], correct: 2 },

    { subjectCode: 'sos', type: 'standard', unit: 'Vatandaşlık', unitSubtitle: 'Demokrasi',
      q: 'Demokrasinin temel ilkelerinden biri hangisidir?', opts: ['Tek parti', 'Seçme ve seçilme hakkı', 'Monarşi', 'Gizli yönetim'], correct: 1 },
    { subjectCode: 'sos', type: 'visual', skill: 'beceri', unit: 'Coğrafya', unitSubtitle: 'Harita Okuma',
      q: 'Haritada A ve B noktaları arasındaki yol hangi yönlerde ilerler?',
      visual: { svg: SVG_MAP, alt: 'Basit harita' }, opts: ['Doğu-batı', 'Kuzey-güney', 'Düz çizgi', 'Belirsiz'], correct: 0 },
    { subjectCode: 'sos', type: 'standard', unit: 'Ekonomi', unitSubtitle: 'Üretim',
      q: 'Ham maddeyi işleyerek yeni ürün elde etmeye ne denir?', opts: ['Tüketim', 'Üretim', 'Dağıtım', 'İthalat'], correct: 1 },

    { subjectCode: 'din', type: 'standard', unit: 'Kur\'an', unitSubtitle: 'Sure Bilgisi',
      q: 'Kur\'an-ı Kerim\'in ilk suresi hangisidir?', opts: ['Bakara', 'Fatiha', 'Yasin', 'İhlas'], correct: 1 },
    { subjectCode: 'din', type: 'standard', unit: 'Hz. Muhammed', unitSubtitle: 'Hicret',
      q: 'Hicret olayı hangi şehirden hangi şehre gerçekleşmiştir?', opts: ['Mekke → Medine', 'Medine → Mekke', 'Taif → Mekke', 'Kudüs → Medine'], correct: 0 },
    { subjectCode: 'din', type: 'standard', unit: 'Değerler', unitSubtitle: 'Adalet',
      q: 'Herkesi eşit ve hakkaniyetli davranma ilkesine ne denir?', opts: ['Cömertlik', 'Adalet', 'Sabır', 'Merhamet'], correct: 1 },

    { subjectCode: 'ing', type: 'standard', unit: 'Grammar', unitSubtitle: 'Past Simple',
      q: '"They ___ football yesterday." — Boşluğa hangisi gelir?', opts: ['play', 'played', 'playing', 'plays'], correct: 1 },
    { subjectCode: 'ing', type: 'standard', unit: 'Vocabulary', unitSubtitle: 'Daily Routines',
      q: '"Wake up" ifadesinin Türkçe karşılığı nedir?', opts: ['Uyumak', 'Uyanmak', 'Yemek yemek', 'Koşmak'], correct: 1 },
    { subjectCode: 'ing', type: 'standard', unit: 'Reading', unitSubtitle: 'Comprehension',
      q: '"Library" kelimesinin anlamı nedir?', opts: ['Hospital', 'Library', 'Market', 'Station'], correct: 1 }
  ];

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }
  function lsRemove(k) { try { localStorage.removeItem(P + k); } catch (e) {} }

  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function cloneQuestion(seed, subjectIndex) {
    var copy = JSON.parse(JSON.stringify(seed));
    copy.unitSubtitle = (copy.unitSubtitle || '—') + ' · Soru ' + (subjectIndex + 1);
    return copy;
  }

  function buildRandomBank() {
    var bySubject = {};
    DENEME_SEED_QUESTIONS.forEach(function (q) {
      var code = q.subjectCode || 'mat';
      if (!bySubject[code]) bySubject[code] = [];
      bySubject[code].push(q);
    });

    var bank = [];
    BANK_ORDER.forEach(function (code) {
      var target = SUBJECT_COUNTS[code] || 0;
      var pool = shuffle(bySubject[code] || []);
      if (!pool.length) {
        pool = [{
          subjectCode: code,
          type: 'standard',
          unit: 'Genel',
          unitSubtitle: 'Deneme Sınavı',
          q: 'Deneme sınavı örnek sorusu — doğru seçeneği işaretle.',
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

  function regenerateBank() {
    var bank = buildRandomBank();
    lsSet(BANK_KEY, JSON.stringify(bank));
    return bank;
  }

  function ensureBank() {
    var raw = lsGet(BANK_KEY);
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch (e) {}
    }
    return regenerateBank();
  }

  function getActiveBank() {
    return ensureBank();
  }

  function clearBank() {
    lsRemove(BANK_KEY);
  }

  global.BilenyumDenemeSubjectCounts = SUBJECT_COUNTS;
  global.BilenyumDenemeQuestions = {
    ensureBank: ensureBank,
    regenerateBank: regenerateBank,
    getActiveBank: getActiveBank,
    clearBank: clearBank
  };
})(typeof window !== 'undefined' ? window : this);
