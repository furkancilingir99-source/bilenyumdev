/* ============================================================
   Öğrenci canlı ders — Prejoin (derse öncesi) etkileşimleri
   Kamera/mikrofon toggle, cihaz menüleri, sistem kontrolü,
   hazırlık checklist'i, sorun giderme akordeonu, geri sayım.
   live-class.js'in beklediği ID'ler korunur (pjJoin, pjStartCamOff...).
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

  /* —— Küçük toast —— */
  var toastTimer = null;
  function toast(msg) {
    var t = $('pj2Toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'pj2Toast';
      t.className = 'pj2-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 2200);
  }

  /* —— Kısa test sesi (WebAudio) —— */
  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 660;
      g.gain.value = 0.06;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      setTimeout(function () { o.stop(); ctx.close(); }, 320);
    } catch (e) { /* sessizce geç */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('lcPreJoin')) return;

    /* ---------- Kamera toggle (önizleme) ---------- */
    var camOn = false;
    function syncCam() {
      var stage = $('pjCamPreview'), btn = $('pjCamToggleBtn'),
          off = document.querySelector('#pjCamToggleBtn .pj2-camoff-ic'),
          onic = document.querySelector('#pjCamToggleBtn .pj2-camon-ic'),
          hidden = $('pjStartCamOff');
      if (stage) stage.setAttribute('data-cam', camOn ? 'on' : 'off');
      if (off) { if (camOn) off.setAttribute('hidden', ''); else off.removeAttribute('hidden'); }
      if (onic) { if (camOn) onic.removeAttribute('hidden'); else onic.setAttribute('hidden', ''); }
      if (btn) btn.setAttribute('aria-pressed', camOn ? 'true' : 'false');
      if (hidden) hidden.checked = !camOn; // checked = kamera kapalı (live-class.js okur)
    }
    on($('pjCamToggleBtn'), 'click', function () { camOn = !camOn; syncCam(); toast(camOn ? 'Kamera açıldı.' : 'Kamera kapatıldı.'); });
    syncCam();

    /* ---------- Mikrofon toggle (önizleme) ---------- */
    var micOn = false; // derse muted (kapalı) başlar
    function syncMic() {
      var btn = $('pjMicToggleBtn'),
          off = document.querySelector('#pjMicToggleBtn .pj2-micoff-ic'),
          onic = document.querySelector('#pjMicToggleBtn .pj2-micon-ic'),
          hidden = $('pjStartMicOff');
      if (off) { if (micOn) off.setAttribute('hidden', ''); else off.removeAttribute('hidden'); }
      if (onic) { if (micOn) onic.removeAttribute('hidden'); else onic.setAttribute('hidden', ''); }
      if (btn) btn.setAttribute('aria-pressed', micOn ? 'true' : 'false');
      if (hidden) hidden.checked = !micOn; // checked = mikrofon kapalı
    }
    on($('pjMicToggleBtn'), 'click', function () { micOn = !micOn; syncMic(); toast(micOn ? 'Mikrofon açıldı.' : 'Mikrofon kapatıldı.'); });
    syncMic();

    /* ---------- Hoparlör / ses testi ---------- */
    on($('pjSpkToggleBtn'), 'click', function () { beep(); toast('Test sesi çalınıyor…'); });
    on($('pjMicSpkTest'), 'click', function () { beep(); toast('Mikrofon ve hoparlör test ediliyor…'); });

    /* ---------- Cihaz seçim menüleri ---------- */
    var MENUS = [
      ['pjCamCaret', 'pjCamMenu'],
      ['pjMicDD', 'pjMicMenu'],
      ['pjSpkDD', 'pjSpkMenu'],
      ['pjBgFilterBtn', 'pjBgFilterMenu']
    ];
    function closeMenus(except) {
      MENUS.forEach(function (pair) {
        var m = $(pair[1]), b = $(pair[0]);
        if (m && pair[1] !== except) { m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
      });
    }
    MENUS.forEach(function (pair) {
      var btn = $(pair[0]), menu = $(pair[1]);
      if (!btn || !menu) return;
      on(btn, 'click', function (e) {
        e.stopPropagation();
        var open = !menu.hidden;
        closeMenus(open ? null : pair[1]);
        menu.hidden = open;
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
      on(menu, 'click', function (e) { e.stopPropagation(); });
      // Seçim yapılınca cihaz adını güncelle (arka plan filtresi hariç)
      if (pair[0] !== 'pjBgFilterBtn') {
        menu.querySelectorAll('input[type="radio"]').forEach(function (r) {
          on(r, 'change', function () {
            var label = r.closest('.tlc-join-menu-opt');
            var span = label ? label.querySelector('span:last-child') : null;
            var nameEl = btn.querySelector('.pj2-dev-name');
            if (span && nameEl) nameEl.textContent = span.textContent;
            closeMenus(null);
          });
        });
      }
    });
    document.addEventListener('click', function () { closeMenus(null); });

    /* ---------- Sistem Kontrolü Yap ---------- */
    var checkDone = false;
    function setRow(key, state) {
      var row = document.querySelector('.pj2-sysrow[data-key="' + key + '"]');
      if (row) row.setAttribute('data-state', state);
    }
    on($('pj2RunCheck'), 'click', function () {
      var card = $('pj2SysCheck'), btn = $('pj2RunCheck'), btnText = $('pj2RunCheckText');
      if (card && card.classList.contains('is-running')) return;
      if (card) { card.classList.add('is-running'); card.classList.remove('is-done'); }
      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = 'Kontrol ediliyor…';
      ['cam', 'mic', 'spk', 'net'].forEach(function (k) { setRow(k, 'idle'); });
      var netDetail = $('pj2NetDetail');
      if (netDetail) netDetail.textContent = 'Kontrol ediliyor…';

      var seq = ['cam', 'mic', 'spk', 'net'];
      var i = 0;
      function step() {
        if (i > 0) setRow(seq[i - 1], 'ok');
        if (i >= seq.length) { finish(); return; }
        var k = seq[i];
        setRow(k, 'checking');
        i++;
        setTimeout(step, 620);
      }
      function finish() {
        if (netDetail) netDetail.textContent = 'Bağlantı iyi (34 Mbps)';
        checkDone = true;
        if (card) { card.classList.remove('is-running'); card.classList.add('is-done'); }
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Tekrar Kontrol Et';
        // Üst rozet → hazır
        var status = $('pj2Status'), statusText = $('pj2StatusText');
        if (status) status.setAttribute('data-ready', 'true');
        if (statusText) statusText.textContent = 'Her şey hazır, derse katılabilirsin.';
        // Derse Katıl aktifleşir
        var join = $('pjJoin');
        if (join) { join.disabled = false; join.classList.add('is-ready'); }
        toast('Sistem kontrolü tamamlandı. Derse katılabilirsin.');
      }
      setTimeout(step, 220);
    });

    /* ---------- Derse Hazırlan checklist ---------- */
    var checklist = $('pj2Checklist');
    function syncPrep() {
      if (!checklist) return;
      var boxes = checklist.querySelectorAll('input[type="checkbox"]');
      var all = boxes.length > 0 && Array.prototype.every.call(boxes, function (b) { return b.checked; });
      var done = $('pj2PrepDone');
      if (done) done.hidden = !all;
    }
    if (checklist) {
      checklist.addEventListener('change', syncPrep);
      syncPrep();
    }

    /* ---------- Sorun giderme akordeonu ---------- */
    document.querySelectorAll('#pj2Troubles .pj2-trouble').forEach(function (item) {
      var btn = item.querySelector('.pj2-trouble-btn');
      var tip = item.querySelector('.pj2-trouble-tip');
      if (tip && !tip.textContent) tip.textContent = item.getAttribute('data-tip') || '';
      on(btn, 'click', function () { item.classList.toggle('is-open'); });
    });

    /* ---------- Yardım pill'i → sorun bölümüne git ---------- */
    on($('pj2HelpPill'), 'click', function () {
      var troubles = $('pj2Troubles');
      if (!troubles) return;
      troubles.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var first = troubles.querySelector('.pj2-trouble');
      if (first) first.classList.add('is-open');
      troubles.classList.add('pj2-flash');
      setTimeout(function () { troubles.classList.remove('pj2-flash'); }, 1200);
    });

    /* ---------- Geri sayım ---------- */
    var mEl = $('pj2CdMin'), sEl = $('pj2CdSec');
    if (mEl && sEl) {
      var total = (parseInt(mEl.textContent, 10) || 8) * 60 + (parseInt(sEl.textContent, 10) || 24);
      var cdTimer = setInterval(function () {
        if (total <= 0) { clearInterval(cdTimer); return; }
        total--;
        var m = Math.floor(total / 60), s = total % 60;
        mEl.textContent = (m < 10 ? '0' : '') + m;
        sEl.textContent = (s < 10 ? '0' : '') + s;
      }, 1000);
    }
  });
})();
