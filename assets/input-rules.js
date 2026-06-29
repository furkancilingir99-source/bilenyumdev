/* ---------------------------------------------------------------------------
 * Bilenyum — paylaşılan form input kuralları
 *
 * Kullanım: bir input'a `data-rule="<rule-name>"` ekle. Sayfa yüklendiğinde
 * (DOMContentLoaded) tüm `[data-rule]` elementleri taranır ve ilgili filtreleme
 * + formatlama bağlanır. İkinci kez bağlanmayı engellemek için `data-rule-bound`
 * kullanılır, böylece dinamik HTML eklemelerinde `BilenyumInputRules.bind(scope)`
 * tekrar güvenle çağrılabilir.
 *
 * Mevcut kurallar:
 *   name        → Ad / Soyad: TR harfler + boşluk + tire/kesme. Rakam yok.
 *   letters     → Sadece harfler (TR dahil) + boşluk. Rakam yok, sembol yok.
 *   digits      → Sadece rakam. (maxlength varsa otomatik kırpar.)
 *   phone-tr    → TR mobil: "+90 5XX XXX XX XX" formatına otomatik döner.
 *   card-number → 16 hane, 4'lü gruplama ("1234 5678 9012 3456").
 *   card-exp    → "AA / YY" formatı. Geçersiz ay (>12) düzeltilir.
 *   card-cvv    → 3-4 hane sayı.
 *   decimal-tr  → Türkçe ondalık: rakam + tek virgül (örn "1234,56").
 *   email       → Geçerli e-posta karakterleri, lowercase'e çevirir.
 *   coupon      → Uppercase alfa-numerik (6 hane).
 *
 * Bütün kurallar `beforeinput` + `input` + `paste` + `blur` event'lerini ele alır
 * ve cursor pozisyonunu olabildiğince korur. Kural birbirleriyle birleşemez.
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  /* ----- Yardımcılar ----- */

  // Türkçe + İngilizce harf seti
  const TR_LETTERS = "A-Za-zÇĞİıÖŞÜçğıöşü";
  const NAME_REGEX_REPLACE = new RegExp(`[^${TR_LETTERS}\\s'\\-]`, 'gu');
  const LETTER_REGEX_REPLACE = new RegExp(`[^${TR_LETTERS}\\s]`, 'gu');

  // Cursor-aware setter: input'un değerini set ederken caret'i koru
  function setValue(input, newValue, opts) {
    const oldValue = input.value;
    if (oldValue === newValue) return;
    const isFocused = document.activeElement === input;
    const oldStart = isFocused ? input.selectionStart : null;
    const oldLen = oldValue.length;
    const newLen = newValue.length;
    input.value = newValue;
    if (isFocused && oldStart != null) {
      // Caret pozisyonunu uzunluk farkına göre kaydır
      const diff = newLen - oldLen;
      const target = Math.max(0, Math.min(newLen, oldStart + diff));
      try { input.setSelectionRange(target, target); } catch (e) { /* readonly types throw */ }
    }
  }

  /* ----- Rule transform fonksiyonları ----- */

  function transformName(v) {
    return v.replace(NAME_REGEX_REPLACE, '').replace(/\s{2,}/g, ' ');
  }

  function transformLetters(v) {
    return v.replace(LETTER_REGEX_REPLACE, '').replace(/\s{2,}/g, ' ');
  }

  function transformDigits(v, max) {
    let s = v.replace(/\D/g, '');
    if (max && s.length > max) s = s.slice(0, max);
    return s;
  }

  // TR mobil telefon: +90 5XX XXX XX XX
  function transformPhoneTR(v) {
    let digits = v.replace(/\D/g, '');
    // Yapışık girilen '90' veya '0' önekini at
    if (digits.startsWith('90')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (digits.length === 0) return '';
    let out = '+90 ';
    out += digits.slice(0, 3);
    if (digits.length > 3) out += ' ' + digits.slice(3, 6);
    if (digits.length > 6) out += ' ' + digits.slice(6, 8);
    if (digits.length > 8) out += ' ' + digits.slice(8, 10);
    return out;
  }

  // Kart numarası: 16 hane, 4'lü gruplar
  function transformCardNumber(v) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  // Son kullanma: AA / YY
  function transformCardExp(v) {
    let digits = v.replace(/\D/g, '').slice(0, 4);
    // Geçersiz ay düzeltmesi: ilk hane 2-9 ise 0X yap (örn 4 → 04)
    if (digits.length === 1 && digits[0] > '1') digits = '0' + digits;
    if (digits.length >= 2) {
      const mm = parseInt(digits.slice(0, 2), 10);
      if (mm > 12) digits = '12' + digits.slice(2);
      if (mm === 0) digits = '01' + digits.slice(2);
    }
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + ' / ' + digits.slice(2);
  }

  function transformCardCvv(v) {
    return v.replace(/\D/g, '').slice(0, 4);
  }

  // Türkçe ondalık (parasal): virgül = ondalık, nokta = binlik.
  // Smart heuristic:
  //   - Virgül varsa: virgül kesin ondalık ayraç; intPart'taki noktalar binlik (yutulur),
  //     decPart'taki ayraçlar yutulur.
  //   - Virgül yok + tek nokta: ondalık olarak kabul (kullanıcı en-US klavye'den `.` bastı).
  //   - Virgül yok + çoklu nokta: hepsi binlik ayracı (yutulur).
  //   - Hiç ayraç yok: rakamlar olduğu gibi.
  function transformDecimalTR(v) {
    let s = String(v).replace(/[^0-9.,]/g, '');
    if (!s) return '';
    const hasComma = s.indexOf(',') !== -1;
    const dotCount = (s.match(/\./g) || []).length;
    if (hasComma) {
      const firstComma = s.indexOf(',');
      const intPart = s.slice(0, firstComma).replace(/\./g, '');
      const decPart = s.slice(firstComma + 1).replace(/[.,]/g, '');
      // Henüz ondalık basamak yazılmadıysa virgülü görünür tut
      if (decPart === '' && firstComma === s.length - 1) return intPart + ',';
      return intPart + ',' + decPart;
    }
    if (dotCount === 0) return s;            // sadece rakamlar
    if (dotCount === 1) return s.replace('.', ','); // tek nokta = ondalık
    return s.replace(/\./g, '');              // çoklu nokta = binlik, hepsini sil
  }

  function transformEmail(v) {
    // Geçerli e-posta karakterleri (RFC 5322 yumuşak alt küme): a-z 0-9 . _ - + @
    return v.toLowerCase().replace(/[^a-z0-9@._\-+]/g, '');
  }

  function transformCoupon(v) {
    return v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  /* ----- Rule kayıt ----- */

  const RULES = {
    'name':        { transform: transformName },
    'letters':     { transform: transformLetters },
    'digits':      { transform: (v, el) => transformDigits(v, el.maxLength > 0 ? el.maxLength : null) },
    'phone-tr':    { transform: transformPhoneTR, inputmode: 'numeric' },
    'card-number': { transform: transformCardNumber, inputmode: 'numeric' },
    'card-exp':    { transform: transformCardExp,    inputmode: 'numeric' },
    'card-cvv':    { transform: transformCardCvv,    inputmode: 'numeric' },
    'decimal-tr':  { transform: transformDecimalTR,  inputmode: 'decimal' },
    'email':       { transform: transformEmail },
    'coupon':      { transform: transformCoupon }
  };

  /* ----- Bir input'a rule bağla ----- */
  function bindOne(input) {
    if (input.dataset.ruleBound === '1') return;
    const ruleName = input.dataset.rule;
    if (!ruleName) return;
    const rule = RULES[ruleName];
    if (!rule) {
      // Bilinmeyen kural — sessizce atla (ileride tip ekleyebiliriz)
      return;
    }
    input.dataset.ruleBound = '1';

    // Sensible defaults: inputmode hint ekle (eğer rule belirtmişse ve input'ta yoksa)
    if (rule.inputmode && !input.getAttribute('inputmode')) {
      input.setAttribute('inputmode', rule.inputmode);
    }

    function apply() {
      const before = input.value;
      const after = rule.transform(before, input);
      if (after !== before) setValue(input, after);
    }

    input.addEventListener('input', apply);
    // Yapıştırma sonrası bir tick sonra yeniden formatla (browser önce paste'i uygular)
    input.addEventListener('paste', () => setTimeout(apply, 0));
    // Drop & autofill için de güvence
    input.addEventListener('change', apply);
    input.addEventListener('blur', apply);
  }

  /* ----- Public API ----- */
  function bind(scope) {
    const root = scope || document;
    root.querySelectorAll('[data-rule]').forEach(bindOne);
  }

  // DOM hazır olunca otomatik bağla
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bind());
  } else {
    bind();
  }

  global.BilenyumInputRules = {
    bind: bind,
    rules: RULES
  };
})(typeof window !== 'undefined' ? window : this);
