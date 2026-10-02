/* ============================================================
   Öğrenci canlı ders — Bekleme Odası kontrolcüsü
   #lcWaiting aktifken 4 adımlı ilerleme + dönen mesajlar +
   ~20 sn sonra otomatik canlı derse geçiş (mevcut #waitAdmit tetiklenir).
   live-class.js'e dokunmadan MutationObserver ile çalışır.
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var TITLES = [
    'Öğretmenin seni derse hazırlıyor…',
    'Birkaç saniye içinde derstesin…',
    'Öğretmenin seni birazdan derse alacak…'
  ];
  // [gecikme(ms), adım-anahtarı, durum-mesajı, mascot-mesajı(ops.)]
  var TIMELINE = [
    [0,     'queue',   'Sıraya alındın, bağlantı hazırlanıyor…', null],
    [1600,  'connect', 'Öğretmen bağlantı kuruyor…',           null],
    [6000,  'prepare', 'Ders hazırlanıyor…',                    null],
    [9500,  'prepare', 'Sınıf oluşturuluyor, içerikler yükleniyor…', 'Her şey hazır! Öğretmenin seni birazdan derse alacak.'],
    [14000, 'enter',   'Derse geçiş yapılıyor…',               'Hazırsın! Seni derse bağlıyoruz…']
  ];
  var AUTO_ADMIT_MS = 19500;   // ~20 sn sonra otomatik geçiş
  var DELAY_MS = 60000;        // gecikme uyarısı (güvenlik ağı)

  var timers = [];
  var running = false;
  var titleIdx = 0;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  var STEP_ORDER = ['queue', 'connect', 'prepare', 'enter'];
  function setStep(activeKey) {
    var ai = STEP_ORDER.indexOf(activeKey);
    document.querySelectorAll('#wrSteps .wr-step').forEach(function (el) {
      var i = STEP_ORDER.indexOf(el.getAttribute('data-step'));
      el.setAttribute('data-state', i < ai ? 'done' : (i === ai ? 'active' : 'idle'));
    });
  }

  function setStatus(text) {
    var s = $('wrStatus');
    if (!s) return;
    s.classList.add('is-fade');
    setTimeout(function () { s.textContent = text; s.classList.remove('is-fade'); }, 220);
  }

  function rotateTitle() {
    var t = $('waitTitle');
    if (!t) return;
    titleIdx = (titleIdx + 1) % TITLES.length;
    t.textContent = TITLES[titleIdx];
  }

  function start() {
    if (running) return;
    running = true;
    clearTimers();
    titleIdx = 0;
    var title = $('waitTitle'); if (title) title.textContent = TITLES[0];
    var delay = $('wrDelay'); if (delay) delay.hidden = true;

    // Adım + durum zaman çizelgesi
    TIMELINE.forEach(function (row) {
      later(function () {
        setStep(row[1]);
        setStatus(row[2]);
        if (row[3]) { var m = $('wrMascotMsg'); if (m) m.textContent = row[3]; }
      }, row[0]);
    });

    // Başlık nazikçe dönsün
    var titleTimer = setInterval(rotateTitle, 4200);
    timers.push({ _interval: titleTimer });

    // ~20 sn sonra otomatik canlı derse geçiş (öğretmen kabul etti simülasyonu)
    later(function () {
      if (!running) return;
      setStep('enter');
      document.querySelectorAll('#wrSteps .wr-step').forEach(function (el) { el.setAttribute('data-state', 'done'); });
      var admit = $('waitAdmit');
      if (admit) admit.click();   // live-class.js -> enterLive()
    }, AUTO_ADMIT_MS);

    // Gecikme güvenlik ağı (otomatik geçiş kapatılırsa)
    later(function () {
      if (!running) return;
      var d = $('wrDelay'); if (d) d.hidden = false;
    }, DELAY_MS);
  }

  function stop() {
    running = false;
    timers.forEach(function (t) {
      if (t && t._interval) clearInterval(t._interval);
      else clearTimeout(t);
    });
    timers = [];
  }

  document.addEventListener('DOMContentLoaded', function () {
    var wait = $('lcWaiting');
    if (!wait) return;

    function isActive() { return wait.classList.contains('is-active') && !wait.hidden; }

    var obs = new MutationObserver(function () {
      if (isActive()) start(); else stop();
    });
    obs.observe(wait, { attributes: true, attributeFilter: ['class', 'hidden'] });

    if (isActive()) start();
  });
})();
