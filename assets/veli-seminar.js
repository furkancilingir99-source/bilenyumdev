(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var SEMINARS = {
    hero: {
      accent: '#e6087b', live: true,
      eyebrow: 'Canlı · Veli Semineri',
      title: 'Sınav Kaygısıyla Başa Çıkma: Velilere Düşen Roller',
      konu: 'Çocuğunuzun sınav öncesi kaygısını fark etme, sağlıklı sınırlar koyma ve destekleyici bir ev ortamı kurma.',
      date: '23 Haziran 2026, Pazartesi', time: '20:00 – 21:00', month: 'Haziran',
      duration: '60 dk',
      content: 'Seminerde sınav kaygısının belirtileri, velinin tutumunun çocuğun performansına etkisi ve evde uygulanabilecek somut sakinleştirme teknikleri ele alınır. Soru-cevap bölümüyle tamamlanır.',
      name: 'Dr. Elif Yıldız', role: 'Uzman Psikolog',
      avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=120&h=120&fit=crop&crop=faces&q=80',
      target: '2026-06-23T20:00:00'
    },
    '0': {
      accent: '#3e3a8e',
      eyebrow: 'Veli Semineri',
      title: 'Yaz Tatilinde Verimli Çalışma Düzeni',
      konu: 'Tatilde öğrenme sürekliliğini koruyan, baskı kurmadan bir çalışma ritmi oluşturma.',
      date: '11 Temmuz 2026, Cumartesi', time: '20:00 – 20:45', month: 'Temmuz',
      duration: '45 dk',
      content: 'Yaz aylarında ekran ile ders dengesi, esnek ama tutarlı bir program kurma ve motivasyonu canlı tutma yolları paylaşılır.',
      name: 'Murat Aslan', role: 'Eğitim Koçu',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces&q=80',
      target: '2026-07-11T20:00:00'
    },
    '1': {
      accent: '#2ea86a',
      eyebrow: 'Veli Semineri',
      title: 'Ekran Süresi ve Dijital Denge',
      konu: 'Çocuklarda sağlıklı ekran alışkanlığı ve dijital içerikle güvenli ilişki kurma.',
      date: '8 Ağustos 2026, Cumartesi', time: '20:00 – 20:50', month: 'Ağustos',
      duration: '50 dk',
      content: 'Yaşa uygun ekran süreleri, dijital sınır koymanın etkili yolları ve alternatif etkinlikler üzerine pratik öneriler ele alınır.',
      name: 'Dr. Selin Kaya', role: 'Pedagog',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces&q=80',
      target: '2026-08-08T20:00:00'
    },
    '2': {
      accent: '#28265a',
      eyebrow: 'Veli Semineri',
      title: 'Yeni Döneme Motivasyonla Başlamak',
      konu: 'Okul açılışında çocuğun hedef belirlemesi ve motivasyonunu yükseltme.',
      date: '12 Eylül 2026, Cumartesi', time: '20:00 – 20:45', month: 'Eylül',
      duration: '45 dk',
      content: 'Yeni döneme geçişte rutin kurma, gerçekçi hedefler belirleme ve velinin destekleyici rolü anlatılır.',
      name: 'Ayça Demir', role: 'Rehber Öğretmen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=faces&q=80',
      target: '2026-09-12T20:00:00'
    },
    '3': {
      accent: '#e6087b',
      eyebrow: 'Veli Semineri',
      title: 'Etkili Aile İçi İletişim',
      konu: 'Çocukla açık, yargısız ve güven veren bir iletişim dili geliştirme.',
      date: '10 Ekim 2026, Cumartesi', time: '20:00 – 21:00', month: 'Ekim',
      duration: '60 dk',
      content: 'Aktif dinleme, duyguları adlandırma ve çatışmaları büyütmeden çözme teknikleri ele alınır.',
      name: 'Prof. Dr. Kemal Şahin', role: 'Aile Danışmanı',
      avatar: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=120&h=120&fit=crop&crop=faces&q=80',
      target: '2026-10-10T20:00:00'
    }
  };

  var SEMINAR_ORDER = ['hero', '0', '1', '2', '3'];

  function initSemDrawer() {
    var drawer = $('semDrawer');
    var allDrawer = $('semAllDrawer');
    if (!drawer) return;
    var panel = drawer.querySelector('.pv-sem-drawer-panel');
    var allList = $('semAllList');
    var backBtn = $('semDrBack');

    var els = {
      eyebrow: $('semDrEyebrow'), title: $('semDrTitle'),
      date: $('semDrDate'), time: $('semDrTime'), month: $('semDrMonth'),
      konu: $('semDrKonu'), content: $('semDrContent'),
      avatar: $('semDrAvatar'), name: $('semDrName'), role: $('semDrRole'),
      cta: $('semDrCta'), ctaLabel: $('semDrCtaLabel'), ctaTime: $('semDrCtaTime')
    };
    var tick = null, currentTarget = null, currentLive = false;
    var detailOpenedFromList = false;

    function pad2(n) { n = Math.floor(n); return (n < 10 ? '0' : '') + n; }
    function fmtCountdown(ms) {
      if (ms < 0) ms = 0;
      var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60;
      if (d > 0) return d + ' GÜN ' + pad2(h) + ':' + pad2(mi) + ':' + pad2(se);
      return pad2(h) + ':' + pad2(mi) + ':' + pad2(se);
    }
    function updateCta() {
      var cta = els.cta;
      cta.classList.remove('is-waiting', 'is-active');
      if (currentLive) {
        cta.classList.add('is-active');
        cta.removeAttribute('disabled');
        els.ctaLabel.textContent = 'Şu anda canlı yayında';
        els.ctaTime.textContent = '● CANLI';
        return;
      }
      var diff = new Date(currentTarget).getTime() - Date.now();
      cta.classList.add('is-waiting');
      cta.setAttribute('disabled', '');
      if (diff <= 0) {
        els.ctaLabel.textContent = 'Seminer tamamlandı';
        els.ctaTime.textContent = '—';
        return;
      }
      els.ctaLabel.textContent = 'Seminere kalan süre';
      els.ctaTime.textContent = fmtCountdown(diff);
    }

    function updateBackButton() {
      if (!backBtn) return;
      backBtn.hidden = !detailOpenedFromList;
      drawer.classList.toggle('is-stacked', detailOpenedFromList);
    }

    function updateScrollLock() {
      var anyOpen = drawer.classList.contains('is-open')
        || (allDrawer && allDrawer.classList.contains('is-open'));
      document.body.style.overflow = anyOpen ? 'hidden' : '';
    }

    function renderAllList() {
      if (!allList) return;
      allList.innerHTML = SEMINAR_ORDER.map(function (id) {
        var d = SEMINARS[id];
        if (!d) return '';
        return '<button type="button" class="pv-sem-all-card" data-sem-id="' + id + '" style="--sem-accent:' + d.accent + '">'
          + '<div class="pv-sem-all-card-top">'
          +   '<span class="pv-sem-all-card-date">'
          +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
          +     d.date
          +   '</span>'
          +   '<span class="pv-sem-all-card-duration">' + d.duration + '</span>'
          + '</div>'
          + '<h3 class="pv-sem-all-card-topic">' + d.title + '</h3>'
          + '<div class="pv-sem-all-card-speaker">'
          +   '<img class="pv-sem-all-card-avatar" src="' + d.avatar + '" alt="' + d.name + '" loading="lazy" />'
          +   '<div class="pv-sem-all-card-speaker-meta">'
          +     '<span class="pv-sem-all-card-speaker-label">Semineri veren</span>'
          +     '<span class="pv-sem-all-card-speaker-name">' + d.name + '</span>'
          +     '<span class="pv-sem-all-card-speaker-role">' + d.role + '</span>'
          +   '</div>'
          + '</div>'
          + '</button>';
      }).join('');
    }

    function openAllDrawer() {
      if (!allDrawer) return;
      renderAllList();
      allDrawer.classList.add('is-open');
      allDrawer.setAttribute('aria-hidden', 'false');
      updateScrollLock();
    }

    function closeAllDrawer() {
      if (!allDrawer) return;
      allDrawer.classList.remove('is-open');
      allDrawer.setAttribute('aria-hidden', 'true');
      updateScrollLock();
    }

    function open(id, fromList) {
      var d = SEMINARS[id]; if (!d) return;
      detailOpenedFromList = !!fromList;
      panel.style.setProperty('--sem-accent', d.accent);
      els.eyebrow.textContent = d.eyebrow;
      els.title.textContent = d.title;
      els.date.textContent = d.date;
      els.time.textContent = d.time;
      els.month.textContent = d.month + ' ayı semineri';
      els.konu.textContent = d.konu;
      els.content.textContent = d.content;
      els.avatar.src = d.avatar; els.avatar.alt = d.name;
      els.name.textContent = d.name;
      els.role.textContent = d.role;
      currentTarget = d.target; currentLive = !!d.live;
      updateCta();
      if (tick) clearInterval(tick);
      tick = setInterval(updateCta, 1000);
      updateBackButton();
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      updateScrollLock();
    }

    function closeDetail() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      detailOpenedFromList = false;
      updateBackButton();
      if (tick) { clearInterval(tick); tick = null; }
      if (!allDrawer || !allDrawer.classList.contains('is-open')) {
        document.body.style.overflow = '';
      } else {
        updateScrollLock();
      }
    }

    function backToAllFromDetail() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      detailOpenedFromList = false;
      updateBackButton();
      if (tick) { clearInterval(tick); tick = null; }
      updateScrollLock();
    }

    document.querySelectorAll('.pv-sem-tl-item[data-sem-id]').forEach(function (item) {
      var card = item.querySelector('.pv-sem-tl-card');
      if (card) card.addEventListener('click', function () { open(item.getAttribute('data-sem-id'), false); });
    });
    var join = $('semJoinBtn');
    if (join) join.addEventListener('click', function () { open('hero', false); });
    var all = $('semAllBtn');
    if (all) all.addEventListener('click', openAllDrawer);

    if (allList) {
      allList.addEventListener('click', function (e) {
        var card = e.target.closest('.pv-sem-all-card');
        if (!card) return;
        open(card.getAttribute('data-sem-id'), true);
      });
    }
    if (backBtn) backBtn.addEventListener('click', backToAllFromDetail);

    drawer.querySelectorAll('[data-sem-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (detailOpenedFromList) backToAllFromDetail();
        else closeDetail();
      });
    });
    if (allDrawer) {
      allDrawer.querySelectorAll('[data-sem-all-close]').forEach(function (b) {
        b.addEventListener('click', function () {
          closeAllDrawer();
          closeDetail();
        });
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (drawer.classList.contains('is-open') && detailOpenedFromList) {
        backToAllFromDetail();
        return;
      }
      if (drawer.classList.contains('is-open')) {
        closeDetail();
        return;
      }
      if (allDrawer && allDrawer.classList.contains('is-open')) closeAllDrawer();
    });
  }

  function init() {
    if (window.VeliParent) VeliParent.init();
    initSemDrawer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
