/* ---------------------------------------------------------------------------
 * Bilenyum trial-modal.js — Ücretsiz Deneme Dersi modal davranışı
 *
 * 3 adımlı akış:
 *   Step 1 (öğrenci) → Step 2 (veli) → Step 3 (slot seçimi) → Success (özet)
 *
 * Step 3 ve Success özet kartı, sayfaların HTML'i güncellenmek zorunda
 * kalmasın diye runtime'da inject edilir (tek kaynak: bu dosya).
 *
 * Bağımlılıklar:
 *   - dom.js  ($, $$, on, delegate global)
 *   - input-rules.js (telefon "phone-tr" formatlaması)
 *
 * HTML beklentileri (mevcut yapı):
 *   - Açma butonları:           [data-trial-open]
 *   - Kapama butonları/zemini:  [data-trial-close]
 *   - Modal:                    #trialModal
 *   - Step formları:            #trialStep1, #trialStep2
 *   - Başarı state'i:           #trialSuccess
 *   - Card:                     .trial-modal-card  (.success-state)
 *   - Geri:                     #trialBack  (step2 → step1)
 *
 * Inject edilenler:
 *   - #trialStep3 form           (step2'den sonra)
 *   - #trialBack2                (step3 → step2 geri)
 *   - .trial-summary             (success içinde özet kartı)
 *   - .trial-success-note        (success altında SMS hatırlatma notu)
 * ------------------------------------------------------------------------- */
(function () {
  'use strict';
  var modal = $('#trialModal');
  if (!modal) return;

  /* ---------- Gün & slot config ---------- */
  var dayNames   = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  var monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  var slotTimes  = ['10:00','11:30','13:00','14:30','16:00','17:30','19:00','20:30'];
  /* Bugün-relative her gün için "dolu" slot mock'u — her erişimde tutarlı.
     Production'da bu, API'dan gelecek. */
  var fullSlots = {
    0: { '13:00': 1, '17:30': 1 },
    1: { '10:00': 1, '19:00': 1 },
    2: { '14:30': 1, '20:30': 1 },
    3: { '11:30': 1, '13:00': 1, '20:30': 1 }
  };

  function nextDays(count) {
    var arr = [];
    var today = new Date();
    for (var i = 0; i < count; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push({
        label:  i === 0 ? 'Bugün' : dayNames[d.getDay()],
        date:   d.getDate() + ' ' + monthNames[d.getMonth()],
        full:   dayNames[d.getDay()] + ', ' + d.getDate() + ' ' + monthNames[d.getMonth()],
        offset: i
      });
    }
    return arr;
  }

  /* ---------- Template'ler ---------- */
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var ICON_BACK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  var STEP3_HTML =
    '<form class="trial-step-form" id="trialStep3" autocomplete="off">' +
      '<div class="trial-slot-nav" id="trialSlotNav"></div>' +
      '<div class="trial-slot-grid" id="trialSlotGrid"></div>' +
      '<div class="trial-actions">' +
        '<button type="button" class="btn-modal btn-modal-ghost" id="trialBack2">' + ICON_BACK + ' Geri</button>' +
        '<button type="submit" class="btn-modal btn-modal-primary" id="trialStep3Submit" disabled>Talebi Gönder ' + ICON_CHECK + '</button>' +
      '</div>' +
    '</form>';

  var ICON_CAL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
      '<line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>' +
      '<line x1="3" y1="10" x2="21" y2="10"/>' +
    '</svg>';
  /* Öğrenci avatar placeholder: graduation cap */
  var ICON_STUDENT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/>' +
      '<path d="M6 12v5c3 3 9 3 12 0v-5"/>' +
    '</svg>';
  /* Veli avatar placeholder: person */
  var ICON_PARENT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
      '<circle cx="12" cy="7" r="4"/>' +
    '</svg>';

  var SUMMARY_HTML =
    '<div class="trial-summary">' +
      /* Öğrenci profil kartı */
      '<div class="trial-summary-profile is-student">' +
        '<span class="trial-summary-avatar">' + ICON_STUDENT + '</span>' +
        '<div class="trial-summary-info">' +
          '<span class="trial-summary-role">Öğrenci</span>' +
          '<span class="trial-summary-name" id="sumStudent">—</span>' +
          '<span class="trial-summary-sub" id="sumGradeSubject">—</span>' +
        '</div>' +
      '</div>' +
      /* Veli profil kartı */
      '<div class="trial-summary-profile is-parent">' +
        '<span class="trial-summary-avatar">' + ICON_PARENT + '</span>' +
        '<div class="trial-summary-info">' +
          '<span class="trial-summary-role">Veli</span>' +
          '<span class="trial-summary-name" id="sumParent">—</span>' +
          '<span class="trial-summary-sub" id="sumPhone">—</span>' +
        '</div>' +
      '</div>' +
      /* Ders zamanı kartı (vurgulu) */
      '<div class="trial-summary-slot">' +
        '<span class="trial-summary-slot-icon">' + ICON_CAL + '</span>' +
        '<div class="trial-summary-slot-info">' +
          '<span class="trial-summary-slot-label">Ders zamanı</span>' +
          '<span class="trial-summary-slot-value" id="sumSlot">—</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<p class="trial-success-note">Ders saatinden 15 dakika önce SMS ile hatırlatma göndereceğiz.</p>';

  /* ---------- Mevcut elementler ---------- */
  var step1   = $('#trialStep1', modal);
  var step2   = $('#trialStep2', modal);
  var success = $('#trialSuccess', modal);
  var card    = $('.trial-modal-card', modal);

  /* ---------- Banner: gerçek foto + eyebrow'u banner üzerine taşı ---------- */
  var banner      = $('.trial-modal-image', modal);
  var headEyebrow = $('.trial-modal-head .trial-modal-eyebrow', modal);
  if (banner) {
    banner.innerHTML = '<img src="https://loremflickr.com/1200/500/exam,test,paper,desk?lock=21" alt="" loading="lazy" />';
    banner.classList.add('has-photo');
    if (headEyebrow) banner.appendChild(headEyebrow);
  }

  /* ---------- Sınıf seviyesi: dropdown → yan yana pill butonlar ---------- */
  var gradeSelect = $('#trial-s-grade', modal);
  if (gradeSelect && gradeSelect.tagName === 'SELECT') {
    var pills = [
      { v: '5', t: '5. Sınıf' },
      { v: '6', t: '6. Sınıf' },
      { v: '7', t: '7. Sınıf' },
      { v: '8', t: '8. Sınıf (LGS)' }
    ];
    var pillsHTML = '<div class="trial-grade-group" role="radiogroup" aria-label="Sınıf seviyesi">' +
      pills.map(function (p) {
        return '<button type="button" class="trial-grade-pill" data-grade="' + p.v + '" role="radio" aria-checked="false">' + p.t + '</button>';
      }).join('') +
    '</div>' +
    '<input type="hidden" id="trial-s-grade" data-required="1" value="" />';
    gradeSelect.outerHTML = pillsHTML;
  }

  /* Subject label + placeholder güncelle (tüm sayfalarda merkezi normalize) */
  var subjectLabel = modal.querySelector('label[for="trial-s-subject"]');
  if (subjectLabel) subjectLabel.textContent = 'Hangi dersten deneme dersine girmek istiyorsun?';
  var subjectSelect = modal.querySelector('#trial-s-subject');
  if (subjectSelect) {
    var ph = subjectSelect.querySelector('option[value=""]');
    if (ph) ph.textContent = 'Ders seç';
  }

  /* Pill seçim handler */
  delegate(modal, '.trial-grade-pill', 'click', function () {
    var grade = this.getAttribute('data-grade');
    var hidden = $('#trial-s-grade', modal);
    if (hidden) hidden.value = grade;
    var group = this.closest('.trial-grade-group');
    if (group) group.classList.remove('is-invalid');
    var self = this;
    $$('.trial-grade-pill', modal).forEach(function (p) {
      var isActive = (p === self);
      p.classList.toggle('is-active', isActive);
      p.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  });

  function gradeTextSelected() {
    var p = $('.trial-grade-pill.is-active', modal);
    return p ? p.textContent.trim() : '—';
  }
  function gradeValueSelected() {
    var h = $('#trial-s-grade', modal);
    return h ? h.value : '';
  }

  /* ---------- Inject Step 3 + Summary ---------- */
  step2.insertAdjacentHTML('afterend', STEP3_HTML);
  var step3 = $('#trialStep3', modal);

  // Step 2 submit butonu artık ileri götürüyor → "Talebi Gönder" → "İleri"
  var step2Submit = step2.querySelector('button[type="submit"]');
  if (step2Submit) {
    step2Submit.innerHTML = 'İleri ' + ICON_ARROW;
  }

  // Success başlığını ve lead'i güncelle
  var successH3 = success.querySelector('h3');
  if (successH3) successH3.textContent = 'Deneme Dersi Talebin Alındı';

  // Success içine özet kartı ekle (mevcut p'den sonra)
  var successPara = success.querySelector('p');
  if (successPara) {
    successPara.textContent = 'Aşağıdaki bilgilerle deneme dersin planlandı:';
    successPara.insertAdjacentHTML('afterend', SUMMARY_HTML);
  }

  /* ---------- State ---------- */
  var selectedOffset = 0;
  var selectedSlot   = null;
  var days           = nextDays(4);

  function renderDayNav() {
    var nav = $('#trialSlotNav', modal);
    if (!nav) return;
    nav.innerHTML = days.map(function (d) {
      var active = (d.offset === selectedOffset) ? ' is-active' : '';
      return '<button type="button" class="trial-slot-day' + active + '" data-day-offset="' + d.offset + '">' +
        '<strong>' + d.label + '</strong><small>' + d.date + '</small></button>';
    }).join('');
  }

  function renderSlots() {
    var grid = $('#trialSlotGrid', modal);
    if (!grid) return;
    var full = fullSlots[selectedOffset] || {};
    grid.innerHTML = slotTimes.map(function (t) {
      var isFull = !!full[t];
      var isSel  = (!isFull && selectedSlot === t);
      var cls    = 'trial-slot' + (isFull ? ' trial-slot-full' : '') + (isSel ? ' is-selected' : '');
      var dis    = isFull ? ' disabled' : '';
      var badge  = isFull
        ? '<span class="trial-slot-badge is-full">Dolu</span>'
        : '<span class="trial-slot-badge is-free">Müsait</span>';
      return '<button type="button" class="' + cls + '" data-slot="' + t + '"' + dis + '>' + t + badge + '</button>';
    }).join('');
    updateSubmit();
  }

  function updateSubmit() {
    var btn = $('#trialStep3Submit', modal);
    if (btn) btn.disabled = (selectedSlot === null);
  }

  /* ---------- Delegation: gün + slot tıklamaları ---------- */
  delegate(modal, '.trial-slot-day', 'click', function () {
    var off = parseInt(this.getAttribute('data-day-offset'), 10);
    if (off === selectedOffset) return;
    selectedOffset = off;
    selectedSlot   = null;
    renderDayNav();
    renderSlots();
  });
  delegate(modal, '.trial-slot:not(.trial-slot-full)', 'click', function () {
    selectedSlot = this.getAttribute('data-slot');
    renderSlots();
  });

  /* ---------- Flow ---------- */
  function reset() {
    step1.classList.add('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    success.classList.remove('show');
    card.classList.remove('success-state');
    selectedOffset = 0;
    selectedSlot   = null;
    days = nextDays(4); // takvim her açılışta yenilensin
    /* Sınıf pill state temizle */
    var hidden = $('#trial-s-grade', modal);
    if (hidden) hidden.value = '';
    $$('.trial-grade-pill', modal).forEach(function (p) {
      p.classList.remove('is-active');
      p.setAttribute('aria-checked', 'false');
    });
    var group = $('.trial-grade-group', modal);
    if (group) group.classList.remove('is-invalid');
  }
  function open()  { modal.classList.add('open');    modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; reset(); renderDayNav(); renderSlots(); }
  function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');  document.body.style.overflow = '';      setTimeout(reset, 200); }
  function go2()   { step1.classList.remove('active'); step2.classList.add('active'); }
  function back1() { step2.classList.remove('active'); step1.classList.add('active'); }
  function go3()   { step2.classList.remove('active'); step3.classList.add('active'); renderDayNav(); renderSlots(); }
  function back2() { step3.classList.remove('active'); step2.classList.add('active'); }
  function done()  {
    populateSummary();
    step1.classList.remove('active');
    step2.classList.remove('active');
    step3.classList.remove('active');
    success.classList.add('show');
    card.classList.add('success-state');
  }

  function setText(sel, val) {
    var el = $(sel, modal);
    if (el) el.textContent = val;
  }

  function populateSummary() {
    var sName    = ($('#trial-s-name',    modal).value || '').trim();
    var sSurname = ($('#trial-s-surname', modal).value || '').trim();
    var subject  = $('#trial-s-subject',  modal);
    var pName    = ($('#trial-p-name',    modal).value || '').trim();
    var pSurname = ($('#trial-p-surname', modal).value || '').trim();
    var pPhone   = ($('#trial-p-phone',   modal).value || '').trim();

    var gradeTxt   = gradeTextSelected();
    var subjectTxt = subject && subject.options[subject.selectedIndex] ? subject.options[subject.selectedIndex].textContent : '—';
    var dayObj     = days[selectedOffset];
    var slotTxt    = (dayObj ? dayObj.full + ' · ' : '') + (selectedSlot || '—');

    /* Öğrenci kartı */
    setText('#sumStudent',      (sName + ' ' + sSurname).trim() || '—');
    setText('#sumGradeSubject', gradeTxt + ' · ' + subjectTxt);

    /* Veli kartı */
    setText('#sumParent', (pName + ' ' + pSurname).trim() || '—');
    setText('#sumPhone',  pPhone || '—');

    /* Ders zamanı */
    setText('#sumSlot', slotTxt);
  }

  /* ---------- Event bindings ---------- */
  on($$('[data-trial-open]'),         'click', function (e) { e.preventDefault(); open(); });
  on($$('[data-trial-close]', modal), 'click', close);
  on(document, 'keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
  on(step1, 'submit', function (e) {
    e.preventDefault();
    if (!gradeValueSelected()) {
      var g = $('.trial-grade-group', modal);
      if (g) { g.classList.add('is-invalid'); setTimeout(function () { g.classList.remove('is-invalid'); }, 600); }
      return;
    }
    go2();
  });
  on(step2, 'submit', function (e) { e.preventDefault(); go3(); });
  on(step3, 'submit', function (e) { e.preventDefault(); if (selectedSlot) done(); });
  on($('#trialBack',  modal), 'click', back1);
  on($('#trialBack2', modal), 'click', back2);
})();
