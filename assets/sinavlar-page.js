(function () {
  'use strict';
  var pageEl = document.getElementById('snPage');
  if (!pageEl) return;

  var TODAY = new Date(2026, 5, 7); // 7 Haziran 2026 (demo)
  var MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  var DAY_NAMES = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

  var SUBJECT_LABELS = {
    mat: 'Matematik',
    fen: 'Fen Bilimleri',
    trk: 'Türkçe',
    sos: 'Sosyal Bilgiler',
    din: 'Din Kültürü',
    ing: 'İngilizce'
  };

  // ====== TYPE META ======
  var TYPE_META = {
    genel: { name: 'GENEL DENEME', c: '#ff6dc6' },
    brans: { name: 'BRANŞ DENEMESİ', c: '#4ad6ff' },
    kurum: { name: 'KURUM DENEMESİ', c: '#a8a4f0' }
  };

  // ====== GEÇMİŞ SINAVLAR (en yeniden eskiye) ======
  // Genel/kurum: 80 soru (LGS), branş: 40 soru · net = d - y/3
  var LGS_KEY_SECTIONS = [
    { title: 'Türkçe',          count: 20 },
    { title: 'Sosyal Bilgiler', count: 10 },
    { title: 'Din Kültürü',     count: 10 },
    { title: 'Matematik',       count: 20 },
    { title: 'Fen Bilimleri',   count: 20 }
  ];
  var LGS_KEY_TOTAL = 80;

  function isLgsExam(exam) {
    return exam && (exam.type === 'genel' || exam.type === 'kurum');
  }
  function getKeyTotal(exam) {
    return isLgsExam(exam) ? LGS_KEY_TOTAL : exam.total;
  }
  function buildKeySections(exam) {
    if (!isLgsExam(exam)) {
      return [{ title: 'Tüm Sorular', from: 0, to: exam.total }];
    }
    var from = 0;
    return LGS_KEY_SECTIONS.map(function (sec) {
      var section = { title: sec.title, count: sec.count, from: from, to: from + sec.count };
      from += sec.count;
      return section;
    });
  }

  function getExamPlacement(exam) {
    if (!exam) return { rank: 0, percentile: 0 };
    if (exam.rank && exam.percentile != null) {
      return { rank: exam.rank, percentile: exam.percentile };
    }
    var net = calcNet(exam);
    var ratio = net / Math.max(1, exam.total * 0.88);
    var percentile = Math.max(1.2, Math.min(99.2, Math.round((100 - ratio * 88) * 10) / 10));
    var rank = Math.max(1, Math.round((percentile / 100) * 8420));
    return { rank: rank, percentile: percentile };
  }

  var EXAMS = [
    { id:1, type:'genel', name:'Bilenyum Genel Deneme · 11', date:'2026-06-07', total:80, dogru:59, yanlis:8, bos:13, dur:135, rank:127, percentile:12.4 },
    { id:14, type:'brans', name:'Fen Branş Denemesi · 6', date:'2026-06-04', total:40, dogru:34, yanlis:4, bos:2, dur:60, rank:84, percentile:8.6 },
    { id:2, type:'brans', name:'Matematik Branş Denemesi · 6', date:'2026-05-31', total:40, dogru:32, yanlis:5, bos:3, dur:60, rank:156, percentile:15.8 },
    { id:3, type:'kurum', name:'İl Genel Denemesi · Mayıs', date:'2026-05-24', total:80, dogru:52, yanlis:12, bos:16, dur:135, rank:312, percentile:28.5 },
    { id:4, type:'genel', name:'Bilenyum Genel Deneme · 10', date:'2026-05-17', total:80, dogru:64, yanlis:5, bos:11, dur:135, rank:98, percentile:9.7 },
    { id:5, type:'brans', name:'Fen Branş Denemesi · 5', date:'2026-05-10', total:40, dogru:30, yanlis:6, bos:4, dur:60 },
    { id:6, type:'genel', name:'Bilenyum Genel Deneme · 9', date:'2026-05-03', total:80, dogru:53, yanlis:9, bos:18, dur:135 },
    { id:7, type:'brans', name:'Türkçe Branş Denemesi · 4', date:'2026-04-26', total:40, dogru:28, yanlis:8, bos:4, dur:60 },
    { id:8, type:'kurum', name:'İl Genel Denemesi · Nisan', date:'2026-04-19', total:80, dogru:49, yanlis:12, bos:19, dur:135 },
    { id:9, type:'genel', name:'Bilenyum Genel Deneme · 8', date:'2026-04-12', total:80, dogru:48, yanlis:13, bos:19, dur:135 },
    { id:10, type:'brans', name:'Matematik Branş Denemesi · 3', date:'2026-04-05', total:40, dogru:26, yanlis:8, bos:6, dur:60 },
    { id:11, type:'genel', name:'Bilenyum Genel Deneme · 7', date:'2026-03-29', total:80, dogru:44, yanlis:15, bos:21, dur:135 },
    { id:12, type:'genel', name:'Bilenyum Genel Deneme · 6', date:'2025-12-20', total:80, dogru:41, yanlis:16, bos:23, dur:135 },
    { id:13, type:'brans', name:'Matematik Branş Denemesi · 2', date:'2025-11-22', total:40, dogru:22, yanlis:10, bos:8, dur:60 }
  ];

  // ====== DENEME NET ORTALAMASI CHART için son 8 (eskiden yeniye) ======
  function calcNet(e) { return Math.max(0, e.dogru - e.yanlis / 3); }
  var snOpenDetailDrawer = null;

  function fmtNet(n) {
    var v = Math.round(n * 100) / 100;
    return (v % 1 === 0 ? String(v) : v.toFixed(2)).replace('.', ',');
  }

  // ====== UTIL: tarih formatla ======
  function formatDate(s) {
    var d = new Date(s);
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }
  function formatDayName(s) {
    var d = new Date(s);
    return DAY_NAMES[d.getDay()];
  }

  // ====== NET'E GÖRE RENK ======
  function netColor(net, total) {
    var pct = (net / total) * 100;
    if (pct >= 70) return '#6dd49e';
    if (pct >= 45) return '#ffd84a';
    return '#ff9a4a';
  }

  // ====== COUNTDOWN — 14 Haziran 2026, 10:00 ======
  (function countdown() {
    var TARGET = new Date(2026, 5, 14, 10, 0, 0).getTime();
    var dayEl = document.getElementById('snCdDay');
    var hourEl = document.getElementById('snCdHour');
    var minEl = document.getElementById('snCdMin');
    var secEl = document.getElementById('snCdSec');
    if (!dayEl) return;
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function tick() {
      var now = Date.now();
      var diff = Math.max(0, TARGET - now);
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      dayEl.textContent = pad(d);
      hourEl.textContent = pad(h);
      minEl.textContent = pad(m);
      secEl.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  })();

  // ====== DENEME SINAVLARI NET ORTALAMASI (SVG) — responsive ======
  (function netChart() {
    var svg = document.getElementById('snChart');
    var wrap = document.getElementById('snChartWrap');
    if (!svg || !wrap) return;

    var CHART_COUNT = 10;
    // Son 10 sınav, eskiden yeniye (kronolojik)
    var series = EXAMS.slice(0, CHART_COUNT).reverse();
    var nets = series.map(calcNet);
    // Dinamik Y aralığı — veriye göre adapt
    var dataMin = Math.min.apply(null, nets);
    var dataMax = Math.max.apply(null, nets);
    var minNet = Math.max(0, Math.floor(dataMin / 10) * 10 - 10);
    var maxNet = Math.min(100, Math.ceil(dataMax / 10) * 10 + 5);
    if (maxNet - minNet < 30) { maxNet = Math.min(100, minNet + 30); }

    function shortName(e) {
      if (e.type === 'genel') return 'GD' + e.name.split('·')[1].trim();
      if (e.type === 'brans') {
        var t = e.name.split(' ')[0];
        return t.substr(0, 3).toUpperCase() + e.name.split('·')[1].trim();
      }
      return 'KR' + (e.id);
    }

    // Tooltip (bir kere oluştur)
    var tip = document.createElement('div');
    tip.className = 'sn-chart-tip';
    tip.innerHTML = '<span class="sn-chart-tip-name"></span><span class="sn-chart-tip-net"></span>';
    wrap.appendChild(tip);
    var tipName = tip.querySelector('.sn-chart-tip-name');
    var tipNet = tip.querySelector('.sn-chart-tip-net');
    var hasAnimated = false;

    function chartVar(name) {
      return getComputedStyle(wrap).getPropertyValue(name).trim();
    }

    function render() {
      var rect = wrap.getBoundingClientRect();
      var W = Math.max(320, Math.round(rect.width));
      var H = Math.max(180, Math.round(rect.height || 220));
      var PAD_L = 44, PAD_R = 20, PAD_T = 22, PAD_B = 28;
      var innerW = W - PAD_L - PAD_R;
      var innerH = H - PAD_T - PAD_B;
      var BASE_Y = H - PAD_B; // chart taban çizgisi (X-axis)

      // viewBox = container, preserveAspectRatio default (xMidYMid meet)
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);

      function xAt(i) {
        if (series.length <= 1) return PAD_L + innerW / 2;
        return PAD_L + (i / (series.length - 1)) * innerW;
      }
      function yAt(v) { return PAD_T + (1 - (v - minNet) / (maxNet - minNet)) * innerH; }

      var pts = nets.map(function(v, i){ return [xAt(i), yAt(v)]; });
      var areaTop = chartVar('--sn-chart-area-top') || 'rgba(62, 58, 142, 0.22)';
      var areaBottom = chartVar('--sn-chart-area-bottom') || 'rgba(62, 58, 142, 0)';

      // Y-axis gridlines — minNet'ten maxNet'e 10'arlık
      var gridInner = '';
      for (var v = minNet; v <= maxNet; v += 10) {
        var y = yAt(v);
        gridInner += '<line class="sn-chart-grid-line" x1="'+PAD_L+'" y1="'+y+'" x2="'+(W-PAD_R)+'" y2="'+y+'" stroke-width="1"/>';
        gridInner += '<text class="sn-chart-grid-label" x="'+(PAD_L-8)+'" y="'+(y+4)+'" text-anchor="end">'+v+'</text>';
      }
      var gridSvg = '<g class="sn-chart-grid">' + gridInner + '</g>';

      var linePath = pts.map(function(p, i){ return (i===0?'M':'L')+p[0].toFixed(1)+','+p[1].toFixed(1); }).join(' ');
      var areaPath = linePath + ' L' + pts[pts.length-1][0].toFixed(1) + ',' + BASE_Y + ' L' + pts[0][0].toFixed(1) + ',' + BASE_Y + ' Z';

      var xLabelsSvg = pts.map(function(p, i){
        var delay = (0.40 + i * 0.06).toFixed(2);
        return '<text class="sn-chart-xlabel" x="'+p[0]+'" y="'+(BASE_Y+16)+'" text-anchor="middle" style="animation-delay:'+delay+'s;">'+shortName(series[i])+'</text>';
      }).join('');

      var pointsSvg = pts.map(function(p, i){
        var delay = (1.10 + i * 0.07).toFixed(2);
        return '<circle class="sn-chart-point-hit" cx="'+p[0]+'" cy="'+p[1]+'" r="12" fill="transparent" data-idx="'+i+'" data-exam-id="'+series[i].id+'"/>'
          + '<circle class="sn-chart-point" cx="'+p[0]+'" cy="'+p[1]+'" r="4.5" stroke-width="2" data-idx="'+i+'" data-exam-id="'+series[i].id+'" style="animation-delay:'+delay+'s; pointer-events: none;"/>';
      }).join('');

      // X-axis baseline (zemin çizgisi)
      var baselineSvg = '<line class="sn-chart-baseline" x1="'+PAD_L+'" y1="'+BASE_Y+'" x2="'+(W-PAD_R)+'" y2="'+BASE_Y+'" stroke-width="1"/>';

      svg.innerHTML =
        '<defs>'
        + '<linearGradient id="snChartAreaGrad" x1="0" x2="0" y1="0" y2="1">'
        +   '<stop offset="0%" stop-color="'+areaTop+'"/>'
        +   '<stop offset="100%" stop-color="'+areaBottom+'"/>'
        + '</linearGradient>'
        + '</defs>'
        + gridSvg
        + '<path class="sn-chart-area" d="'+areaPath+'" fill="url(#snChartAreaGrad)"/>'
        + '<path class="sn-chart-line" d="'+linePath+'" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        + baselineSvg
        + xLabelsSvg
        + pointsSvg;

      // Line draw animation (sadece ilk render'da)
      if (!hasAnimated) {
        var lp = svg.querySelector('.sn-chart-line');
        if (lp && typeof lp.getTotalLength === 'function') {
          try {
            var len = lp.getTotalLength();
            lp.style.strokeDasharray = len;
            lp.style.strokeDashoffset = len;
            // force reflow then animate
            void lp.getBoundingClientRect();
            lp.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) 0.35s';
            requestAnimationFrame(function(){
              lp.style.strokeDashoffset = 0;
            });
          } catch (e) { /* ignore */ }
        }
        hasAnimated = true;
      } else {
        // resize sonrası — animasyonsuz dur
        svg.querySelectorAll('.sn-chart-grid, .sn-chart-area, .sn-chart-baseline, .sn-chart-xlabel, .sn-chart-point, .sn-chart-point-hit').forEach(function(el){
          el.style.animation = 'none';
          el.style.opacity = '1';
        });
      }
    }

    function showTip(target) {
      var i = parseInt(target.getAttribute('data-idx'), 10);
      if (isNaN(i) || !series[i]) return;
      var e = series[i];
      var examNet = nets[i];
      tipName.textContent = e.name;
      tipNet.innerHTML = '<strong>' + fmtNet(examNet) + '</strong> net';
      tip.style.left = parseFloat(target.getAttribute('cx')) + 'px';
      tip.style.top = parseFloat(target.getAttribute('cy')) + 'px';
      tip.classList.add('is-active');
    }

    function hideTip() {
      tip.classList.remove('is-active');
    }

    function openChartExamDetail(examId) {
      var exam = EXAMS.find(function (x) { return String(x.id) === String(examId); });
      if (exam && snOpenDetailDrawer) snOpenDetailDrawer(exam);
    }

    svg.addEventListener('mouseover', function (e) {
      var hit = e.target.closest('.sn-chart-point-hit');
      if (hit) showTip(hit);
    });
    svg.addEventListener('mouseout', function (e) {
      var hit = e.target.closest('.sn-chart-point-hit');
      if (!hit) return;
      var related = e.relatedTarget && e.relatedTarget.closest('.sn-chart-point-hit');
      if (related === hit) return;
      hideTip();
    });
    svg.addEventListener('click', function (e) {
      var hit = e.target.closest('.sn-chart-point-hit');
      if (!hit) return;
      openChartExamDetail(hit.getAttribute('data-exam-id'));
    });

    // İlk render
    render();

    // Resize observer — container'ın boyutu değişince yeniden çiz
    if (typeof ResizeObserver !== 'undefined') {
      var roInitialSkipped = false;
      var ro = new ResizeObserver(function(){
        // İlk tetikleme observe() sonrası anında gelir — ignore et,
        // yoksa animasyon başlamadan re-render olur
        if (!roInitialSkipped) { roInitialSkipped = true; return; }
        if (ro._raf) cancelAnimationFrame(ro._raf);
        ro._raf = requestAnimationFrame(render);
      });
      ro.observe(wrap);
    } else {
      // Fallback: window resize
      var t;
      window.addEventListener('resize', function(){
        clearTimeout(t);
        t = setTimeout(render, 120);
      });
    }
  })();

  // ====== GEÇMİŞ SINAVLAR LİSTESİ ======
  var listEl = document.getElementById('snList');
  var emptyEl = document.getElementById('snListEmpty');
  var pagerEl = document.getElementById('snPager');
  var pagerPagesEl = document.getElementById('snPagerPages');
  var pagerPrev = document.getElementById('snPagerPrev');
  var pagerNext = document.getElementById('snPagerNext');
  var pagerInfo = document.getElementById('snPagerInfo');
  var currentFilter = 'all';
  function monthRangeKey(year, monthIndex) {
    var m = monthIndex + 1;
    return 'month-' + year + '-' + (m < 10 ? '0' : '') + m;
  }

  function buildDateMonthOptions() {
    if (!EXAMS.length) return [];
    var minDate = EXAMS.reduce(function (min, e) {
      var d = new Date(e.date);
      return d < min ? d : min;
    }, new Date(EXAMS[0].date));
    var end = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    var start = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
    var opts = [];
    var cur = start;
    while (cur >= end) {
      opts.push({
        range: monthRangeKey(cur.getFullYear(), cur.getMonth()),
        label: MONTH_NAMES[cur.getMonth()] + ' ' + cur.getFullYear()
      });
      cur.setMonth(cur.getMonth() - 1);
    }
    return opts;
  }

  var currentDateRange = monthRangeKey(TODAY.getFullYear(), TODAY.getMonth());
  var currentPage = 1;
  var PAGE_SIZE = 5;

  function parseExamDate(dateStr) {
    var p = dateStr.split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  }

  // Tarih aralığı filtresi — TODAY (7 Haziran 2026) baz
  function inDateRange(dateStr, range) {
    if (range === 'all') return true;
    var d = parseExamDate(dateStr);
    if (range.indexOf('month-') === 0) {
      var parts = range.slice(6).split('-');
      var y = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1;
      return d.getFullYear() === y && d.getMonth() === m;
    }
    if (range === 'thisMonth') {
      return d.getFullYear() === TODAY.getFullYear() && d.getMonth() === TODAY.getMonth();
    }
    if (range === '3months') {
      var c3 = new Date(TODAY.getFullYear(), TODAY.getMonth() - 3, TODAY.getDate());
      return d >= c3;
    }
    if (range === '6months') {
      var c6 = new Date(TODAY.getFullYear(), TODAY.getMonth() - 6, TODAY.getDate());
      return d >= c6;
    }
    if (range === 'thisYear') {
      return d.getFullYear() === TODAY.getFullYear();
    }
    return true;
  }

  function renderPager(totalItems, totalPages, fromIdx, toIdx) {
    if (!pagerEl) return;
    if (totalItems <= PAGE_SIZE) {
      pagerEl.hidden = true;
      return;
    }
    pagerEl.hidden = false;
    // Prev/Next state
    pagerPrev.disabled = currentPage === 1;
    pagerNext.disabled = currentPage === totalPages;
    // Info
    pagerInfo.textContent = (fromIdx + 1) + '-' + toIdx + ' / ' + totalItems;
    // Build page buttons with ellipsis logic
    // Strategy: show 1, ..., current-1, current, current+1, ..., last
    var pages = [];
    function add(n) { if (pages[pages.length-1] !== n) pages.push(n); }
    add(1);
    var start = Math.max(2, currentPage - 1);
    var end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('…');
    for (var i = start; i <= end; i++) add(i);
    if (end < totalPages - 1) pages.push('…');
    if (totalPages > 1) add(totalPages);
    pagerPagesEl.innerHTML = pages.map(function(p){
      if (p === '…') return '<span class="sn-pager-ellipsis" aria-hidden="true">…</span>';
      return '<button type="button" class="sn-pager-btn'+(p===currentPage?' is-active':'')+'" data-page="'+p+'" aria-label="Sayfa '+p+'"'+(p===currentPage?' aria-current="page"':'')+'>'+p+'</button>';
    }).join('');
  }

  function renderList() {
    if (!listEl) return;
    var items = EXAMS.filter(function(e){
      var typeOk = (currentFilter === 'all' || e.type === currentFilter);
      var dateOk = inDateRange(e.date, currentDateRange);
      return typeOk && dateOk;
    });
    if (items.length === 0) {
      listEl.innerHTML = '';
      emptyEl.hidden = false;
      if (pagerEl) pagerEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    // Clamp current page to valid range
    var totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    var fromIdx = (currentPage - 1) * PAGE_SIZE;
    var toIdx = Math.min(items.length, fromIdx + PAGE_SIZE);
    var pageItems = items.slice(fromIdx, toIdx);
    var MONTH_SHORT = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];
    listEl.innerHTML = pageItems.map(function(e){
      var net = calcNet(e);
      var nc = netColor(net, e.total);
      var meta = TYPE_META[e.type];
      var dPct = (e.dogru / e.total) * 100;
      var yPct = (e.yanlis / e.total) * 100;
      var bPct = (e.bos / e.total) * 100;
      var d = new Date(e.date);
      var pad2 = function(n){ return n < 10 ? '0'+n : ''+n; };
      return '<article class="sn-row" data-type="'+e.type+'" data-id="'+e.id+'">'
        + '<div class="sn-row-date" aria-label="' + formatDate(e.date) + '">'
        +   '<span class="sn-row-date-month">' + MONTH_SHORT[d.getMonth()] + '</span>'
        +   '<span class="sn-row-date-day">' + pad2(d.getDate()) + '</span>'
        +   '<span class="sn-row-date-year">' + d.getFullYear() + '</span>'
        + '</div>'
        + '<div class="sn-row-info">'
        +   '<span class="sn-row-eyebrow">' + meta.name + '</span>'
        +   '<h4 class="sn-row-title">' + e.name + '</h4>'
        +   '<div class="sn-row-meta">'
        +     '<span>' + formatDayName(e.date) + '</span>'
        +     '<span class="sn-row-meta-sep">·</span>'
        +     '<span>' + e.total + ' soru</span>'
        +     '<span class="sn-row-meta-sep">·</span>'
        +     '<span>' + e.dur + ' dk</span>'
        +   '</div>'
        + '</div>'
        + '<div class="sn-row-net">'
        +   '<div class="sn-row-net-main">'
        +     '<span class="sn-row-net-eyebrow">Net</span>'
        +     '<span class="sn-row-net-value" style="--net-c:'+nc+';">' + net.toFixed(2).replace('.', ',') + '<small>/' + e.total + '</small></span>'
        +   '</div>'
        +   '<div class="sn-row-net-breakdown">'
        +     '<div class="sn-row-net-bar">'
        +       '<div class="sn-row-net-bar-d" style="width:'+dPct+'%"></div>'
        +       '<div class="sn-row-net-bar-y" style="width:'+yPct+'%"></div>'
        +       '<div class="sn-row-net-bar-b" style="width:'+bPct+'%"></div>'
        +     '</div>'
        +     '<div class="sn-row-net-breakdown-text">'
        +       '<span class="sn-row-net-d">' + e.dogru + ' D</span>'
        +       '<span class="sn-row-net-y">' + e.yanlis + ' Y</span>'
        +       '<span class="sn-row-net-b">' + e.bos + ' B</span>'
        +     '</div>'
        +   '</div>'
        + '</div>'
        + '<div class="sn-row-actions">'
        +   '<button type="button" class="sn-row-btn" data-act="key" title="Cevap anahtarını gör">'
        +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>'
        +     '<span>Cevap Anahtarı</span>'
        +   '</button>'
        +   '<button type="button" class="sn-row-btn sn-row-btn-primary" data-act="detail" title="Sınav sonucu raporu">'
        +     '<span>Detay</span>'
        +     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
        +   '</button>'
        + '</div>'
        + '</article>';
    }).join('');
    renderPager(items.length, totalPages, fromIdx, toIdx);
  }

  // ====== FİLTRE CHIPS ======
  var chips = pageEl.querySelectorAll('.sn-filter-chip');
  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chips.forEach(function(c){ c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      currentFilter = chip.dataset.filter;
      currentPage = 1; // filtre değişince başa dön
      renderList();
    });
  });

  // ====== DATE RANGE DROPDOWN ======
  (function dateDropdown(){
    var wrap = document.getElementById('snDateDropdown');
    var btn = document.getElementById('snDateBtn');
    var menu = document.getElementById('snDateMenu');
    var label = document.getElementById('snDateLabel');
    if (!wrap || !btn || !menu) return;

    var monthOpts = buildDateMonthOptions();
    var RANGE_LABELS = { all: 'Tümü' };
    monthOpts.forEach(function (o) { RANGE_LABELS[o.range] = o.label; });

    var allItem = menu.querySelector('[data-range="all"]');
    menu.innerHTML = '';
    if (allItem) menu.appendChild(allItem);
    monthOpts.forEach(function (o) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'sn-dropdown-item' + (currentDateRange === o.range ? ' is-active' : '');
      item.dataset.range = o.range;
      item.setAttribute('role', 'menuitem');
      item.textContent = o.label;
      menu.appendChild(item);
    });

    label.textContent = RANGE_LABELS[currentDateRange] || 'Tümü';
    function open() { wrap.classList.add('is-open'); btn.setAttribute('aria-expanded','true'); }
    function close() { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) close(); else open();
    });
    menu.addEventListener('click', function(e){
      var item = e.target.closest('.sn-dropdown-item');
      if (!item) return;
      var r = item.dataset.range;
      currentDateRange = r;
      label.textContent = RANGE_LABELS[r] || 'Tümü';
      menu.querySelectorAll('.sn-dropdown-item').forEach(function(it){
        it.classList.toggle('is-active', it.dataset.range === r);
      });
      currentPage = 1;
      renderList();
      close();
    });
    document.addEventListener('click', function(e){
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') close();
    });
  })();

  // ====== PAGINATION EVENTS ======
  if (pagerPrev) {
    pagerPrev.addEventListener('click', function(){
      if (currentPage > 1) { currentPage--; renderList(); scrollListIntoView(); }
    });
  }
  if (pagerNext) {
    pagerNext.addEventListener('click', function(){
      currentPage++; renderList(); scrollListIntoView();
    });
  }
  if (pagerPagesEl) {
    pagerPagesEl.addEventListener('click', function(e){
      var btn = e.target.closest('.sn-pager-btn');
      if (!btn) return;
      var p = parseInt(btn.dataset.page, 10);
      if (!isNaN(p) && p !== currentPage) {
        currentPage = p;
        renderList();
        scrollListIntoView();
      }
    });
  }
  function scrollListIntoView() {
    // Liste başlığını görünüme getir
    var listTitle = document.getElementById('snListTitle');
    if (listTitle && listTitle.scrollIntoView) {
      listTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ====== ACTIONS (Cevap Anahtarı, İndir, Detay) ======
  var toast = document.getElementById('snToast');
  var toastText = document.getElementById('snToastText');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toastText.textContent = msg;
    toast.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('is-show'); }, 2400);
  }
  if (listEl) {
    listEl.addEventListener('click', function(e){
      var btn = e.target.closest('.sn-row-btn');
      if (!btn) return;
      var row = btn.closest('.sn-row');
      var id = row && row.dataset.id;
      var act = btn.dataset.act;
      var exam = EXAMS.find(function(x){ return String(x.id) === String(id); });
      if (!exam) return;
      if (act === 'key') {
        openKeyDrawer(exam);
      } else if (act === 'detail') {
        openDetailDrawer(exam);
      }
    });
  }

  // ====== CEVAP ANAHTARI DRAWER ======
  var keyDrawer    = document.getElementById('snKeyDrawer');
  var keyTitle     = document.getElementById('snKeyTitle');
  var keyDate      = document.getElementById('snKeyDate');
  var keyTotal     = document.getElementById('snKeyTotal');
  var keyNet       = document.getElementById('snKeyNet');
  var keyGrid      = document.getElementById('snKeyGrid');
  var keyDownload  = document.getElementById('snKeyDownload');
  var keyBackBtn   = document.getElementById('snKeyBack');
  var currentExam  = null;
  var currentKeyCorrect = null;
  var currentKeyStudent = null;
  var keyOpenedFromDetail = false;

  var KEY_SECTION_SUBJECT = {
    'Türkçe': 'trk',
    'Sosyal Bilgiler': 'sos',
    'Din Kültürü': 'din',
    'Matematik': 'mat',
    'Fen Bilimleri': 'fen'
  };

  function letterToIndex(letter) {
    if (!letter) return null;
    var idx = 'ABCDE'.indexOf(String(letter).toUpperCase());
    return idx >= 0 ? idx : null;
  }

  function inferBransSubjectCode(exam) {
    var name = (exam.name || '').toLowerCase();
    if (name.indexOf('matematik') >= 0) return 'mat';
    if (name.indexOf('fen') >= 0) return 'fen';
    if (name.indexOf('türk') >= 0 || name.indexOf('turk') >= 0) return 'trk';
    if (name.indexOf('sosyal') >= 0) return 'sos';
    if (name.indexOf('din') >= 0) return 'din';
    if (name.indexOf('ingiliz') >= 0) return 'ing';
    return 'mat';
  }

  // Sınav id'sine göre deterministik cevap anahtarı + öğrenci cevapları üretir
  // (gerçek sistemde backend'den gelir, burada demo için seed bazlı)
  function genKey(exam) {
    var options = ['A','B','C','D','E'];
    var key = [];
    var seed = exam.id * 7.3;
    var total = getKeyTotal(exam);
    for (var i = 0; i < total; i++) {
      var x = Math.sin(seed * (i + 1)) * 10000;
      var f = x - Math.floor(x);
      key.push(options[Math.floor(f * 5)]);
    }
    return key;
  }
  // Öğrencinin verdiği cevaplar: doğru/yanlış/boş dağılımı sınavdaki count'a göre
  function genStudentAnswers(exam, correctKey) {
    var ans = correctKey.slice();
    var seed = exam.id * 11.7;
    var indices = [];
    for (var i = 0; i < correctKey.length; i++) indices.push(i);
    // Fisher-Yates with seeded random
    function rnd(s, n) { var v = Math.sin(s * n) * 10000; return v - Math.floor(v); }
    for (var j = indices.length - 1; j > 0; j--) {
      var k = Math.floor(rnd(seed, j+1) * (j + 1));
      var tmp = indices[j]; indices[j] = indices[k]; indices[k] = tmp;
    }
    var options = ['A','B','C','D','E'];
    var nWrong = exam.yanlis;
    var nBlank = exam.bos;
    // İlk nWrong indeks → yanlış (sonsuz döngü riski olmadan)
    for (var w = 0; w < nWrong; w++) {
      var idx = indices[w];
      var cur = correctKey[idx];
      var others = [];
      for (var oi = 0; oi < options.length; oi++) {
        if (options[oi] !== cur) others.push(options[oi]);
      }
      var pickIdx = Math.floor(rnd(seed, idx + 1) * others.length);
      if (pickIdx >= others.length) pickIdx = others.length - 1;
      ans[idx] = others[pickIdx];
    }
    // Sonraki nBlank indeks → boş
    for (var b = 0; b < nBlank; b++) {
      var bidx = indices[nWrong + b];
      ans[bidx] = '';
    }
    return ans;
  }

  function inferBransSubjectLabel(exam) {
    return SUBJECT_LABELS[inferBransSubjectCode(exam)] || 'Branş';
  }

  function buildExamReport(exam) {
    var correct = genKey(exam);
    var student = genStudentAnswers(exam, correct);
    var sections = buildKeySections(exam);
    var rows = sections.map(function (sec) {
      var d = 0, y = 0, b = 0;
      for (var i = sec.from; i < sec.to; i++) {
        var s = student[i];
        var c = correct[i];
        if (!s) b++;
        else if (s === c) d++;
        else y++;
      }
      var title = sec.title;
      if (!isLgsExam(exam) && sec.title === 'Tüm Sorular') {
        title = inferBransSubjectLabel(exam);
      }
      return {
        title: title,
        dogru: d,
        yanlis: y,
        bos: b,
        net: Math.max(0, d - y / 3)
      };
    });
    return { rows: rows, correct: correct, student: student };
  }

  function calcExamXp(exam) {
    var net = calcNet(exam);
    var typeBonus = exam.type === 'genel' ? 150 : (exam.type === 'kurum' ? 100 : 75);
    return Math.round(net * 8 + typeBonus);
  }

  function countSectionStats(sec, student, correct) {
    var d = 0, y = 0, b = 0;
    for (var i = sec.from; i < sec.to; i++) {
      var s = student[i];
      var c = correct[i];
      if (!s) b++;
      else if (s === c) d++;
      else y++;
    }
    return { dogru: d, yanlis: y, bos: b };
  }

  function renderSectionStatBox(type, value, label) {
    return '<span class="sn-key-section-stat is-' + type + '" title="' + label + '">'
      + '<strong>' + value + '</strong>'
      + '<span class="sn-key-section-stat-lbl">' + label + '</span>'
      + '</span>';
  }

  function renderSectionHeader(label, stats) {
    return '<div class="sn-key-section">'
      + '<div class="sn-key-section-row">'
      +   '<span class="sn-key-section-title">' + label + '</span>'
      +   '<div class="sn-key-section-stats">'
      +     renderSectionStatBox('correct', stats.dogru, 'Doğru')
      +     renderSectionStatBox('wrong', stats.yanlis, 'Yanlış')
      +     renderSectionStatBox('blank', stats.bos, 'Boş')
      +   '</div>'
      + '</div>'
      + '<span class="sn-key-section-line"></span>'
      + '</div>';
  }

  function renderKeyGrid(exam, correct, student) {
    var html = '';
    var sections = buildKeySections(exam);
    sections.forEach(function (sec) {
      var title = sec.title;
      if (!isLgsExam(exam) && sec.title === 'Tüm Sorular') {
        title = inferBransSubjectLabel(exam);
      }
      var label = title + (sec.count ? ' · ' + sec.count + ' soru' : '');
      var stats = countSectionStats(sec, student, correct);
      html += renderSectionHeader(label, stats);
      for (var i = sec.from; i < sec.to; i++) {
        var s = student[i];
        var c = correct[i];
        var cls = !s ? 'is-blank' : (s === c ? 'is-correct' : 'is-wrong');
        var displayAns = !s ? '—' : s;
        var qNum = i - sec.from + 1;
        var ariaLabel = qNum + '. soru';
        html += '<div class="sn-key-cell ' + cls + '" data-correct="' + c + '" aria-label="' + ariaLabel + '">'
              +   '<span class="sn-key-num">' + qNum + '.</span>'
              +   '<span class="sn-key-ans">' + displayAns + '</span>'
              + '</div>';
      }
    });
    return html;
  }

  function updateDrawerScrollLock() {
    var detailDrawerEl = document.getElementById('snDetailDrawer');
    var anyOpen = keyDrawer.classList.contains('is-open')
      || (detailDrawerEl && detailDrawerEl.classList.contains('is-open'));
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  }

  function updateKeyBackButton() {
    if (!keyBackBtn) return;
    keyBackBtn.hidden = !keyOpenedFromDetail;
    if (keyDrawer) {
      keyDrawer.classList.toggle('is-stacked', keyOpenedFromDetail);
    }
  }

  function openKeyDrawer(exam, fromDetail) {
    keyOpenedFromDetail = !!fromDetail;
    if (!fromDetail) closeDetailDrawer();
    currentExam = exam;
    keyTitle.textContent = exam.name;
    keyDate.textContent = formatDate(exam.date);
    keyTotal.textContent = getKeyTotal(exam) + ' soru';
    keyNet.textContent = calcNet(exam).toFixed(2).replace('.', ',');

    var correct = genKey(exam);
    var student = genStudentAnswers(exam, correct);
    currentKeyCorrect = correct;
    currentKeyStudent = student;
    keyGrid.innerHTML = renderKeyGrid(exam, correct, student);

    keyDrawer.classList.add('is-open');
    keyDrawer.setAttribute('aria-hidden', 'false');
    updateKeyBackButton();
    updateDrawerScrollLock();
  }
  function backToDetailFromKey() {
    if (!keyOpenedFromDetail) {
      closeKeyDrawer();
      return;
    }
    keyDrawer.classList.remove('is-open');
    keyDrawer.setAttribute('aria-hidden', 'true');
    keyOpenedFromDetail = false;
    currentExam = null;
    currentKeyCorrect = null;
    currentKeyStudent = null;
    updateKeyBackButton();
    updateDrawerScrollLock();
  }
  function closeKeyDrawer() {
    keyDrawer.classList.remove('is-open');
    keyDrawer.setAttribute('aria-hidden', 'true');
    keyOpenedFromDetail = false;
    currentExam = null;
    currentKeyCorrect = null;
    currentKeyStudent = null;
    updateKeyBackButton();
    if (detailDrawer && detailDrawer.classList.contains('is-open')) {
      updateDrawerScrollLock();
      return;
    }
    updateDrawerScrollLock();
  }
  // Close handlers
  Array.prototype.forEach.call(keyDrawer.querySelectorAll('[data-key-close]'), function(el){
    el.addEventListener('click', function () {
      if (keyOpenedFromDetail) backToDetailFromKey();
      else closeKeyDrawer();
    });
  });
  if (keyBackBtn) {
    keyBackBtn.addEventListener('click', backToDetailFromKey);
  }

  // ====== SINAV DETAY DRAWER ======
  var detailDrawer   = document.getElementById('snDetailDrawer');
  var detailTitle    = document.getElementById('snDetailTitle');
  var detailDate     = document.getElementById('snDetailDate');
  var detailTotal    = document.getElementById('snDetailTotal');
  var detailDur      = document.getElementById('snDetailDur');
  var detailNet      = document.getElementById('snDetailNet');
  var detailDogru    = document.getElementById('snDetailDogru');
  var detailYanlis   = document.getElementById('snDetailYanlis');
  var detailBos      = document.getElementById('snDetailBos');
  var detailTableBody = document.getElementById('snDetailTableBody');
  var detailTableFoot = document.getElementById('snDetailTableFoot');
  var detailXpVal    = document.getElementById('snDetailXpVal');
  var detailRank     = document.getElementById('snDetailRank');
  var detailPercentile = document.getElementById('snDetailPercentile');
  var detailKey      = document.getElementById('snDetailKey');
  var detailPdf      = document.getElementById('snDetailPdf');
  var detailExam     = null;
  var detailReport   = null;

  function renderDetailTable(report, exam) {
    if (!detailTableBody || !detailTableFoot) return;
    detailTableBody.innerHTML = report.rows.map(function (row) {
      return '<tr>'
        + '<td class="sn-detail-td-subj">' + row.title + '</td>'
        + '<td class="sn-detail-td-d">' + row.dogru + '</td>'
        + '<td class="sn-detail-td-y">' + row.yanlis + '</td>'
        + '<td class="sn-detail-td-b">' + row.bos + '</td>'
        + '<td class="sn-detail-td-net">' + fmtNet(row.net) + '</td>'
        + '</tr>';
    }).join('');
    detailTableFoot.innerHTML = '<tr>'
      + '<td class="sn-detail-td-subj">Toplam</td>'
      + '<td class="sn-detail-td-d">' + exam.dogru + '</td>'
      + '<td class="sn-detail-td-y">' + exam.yanlis + '</td>'
      + '<td class="sn-detail-td-b">' + exam.bos + '</td>'
      + '<td class="sn-detail-td-net">' + fmtNet(calcNet(exam)) + '</td>'
      + '</tr>';
  }

  function openDetailDrawer(exam) {
    if (!detailDrawer) return;
    closeKeyDrawer();
    detailExam = exam;
    detailReport = buildExamReport(exam);

    if (detailTitle) detailTitle.textContent = exam.name;
    if (detailDate) detailDate.textContent = formatDate(exam.date);
    if (detailTotal) detailTotal.textContent = getKeyTotal(exam) + ' soru';
    if (detailDur) detailDur.textContent = exam.dur + ' dk';
    if (detailNet) detailNet.textContent = fmtNet(calcNet(exam));
    if (detailDogru) detailDogru.textContent = String(exam.dogru);
    if (detailYanlis) detailYanlis.textContent = String(exam.yanlis);
    if (detailBos) detailBos.textContent = String(exam.bos);
    if (detailXpVal) detailXpVal.textContent = calcExamXp(exam).toLocaleString('tr-TR') + ' XP';
    var placement = getExamPlacement(exam);
    if (detailRank) detailRank.textContent = '#' + placement.rank.toLocaleString('tr-TR');
    if (detailPercentile) detailPercentile.textContent = '%' + String(placement.percentile).replace('.', ',');

    renderDetailTable(detailReport, exam);

    detailDrawer.classList.add('is-open');
    detailDrawer.setAttribute('aria-hidden', 'false');
    updateDrawerScrollLock();
  }
  snOpenDetailDrawer = openDetailDrawer;

  function closeDetailDrawer() {
    if (!detailDrawer) return;
    detailDrawer.classList.remove('is-open');
    detailDrawer.setAttribute('aria-hidden', 'true');
    detailExam = null;
    detailReport = null;
    updateDrawerScrollLock();
  }

  if (detailDrawer) {
    Array.prototype.forEach.call(detailDrawer.querySelectorAll('[data-detail-close]'), function (el) {
      el.addEventListener('click', closeDetailDrawer);
    });
  }
  if (detailKey) {
    detailKey.addEventListener('click', function () {
      if (!detailExam) return;
      openKeyDrawer(detailExam, true);
    });
  }

  function getStudentProfile() {
    var defaults = {
      fullName: 'Mira Yılmaz',
      clan: 'Alfa Klanı',
      gradeLevel: '8. Sınıf · LGS',
      program: 'Hafta içi Erken'
    };
    var nameEl = document.getElementById('ctxName') || document.querySelector('.player-name');
    var clanEl = document.getElementById('ctxClan') || document.querySelector('.player-clan');
    var progEl = document.getElementById('ctxProgram');
    return {
      fullName: nameEl && nameEl.textContent.trim() ? nameEl.textContent.trim() : defaults.fullName,
      clan: clanEl && clanEl.textContent.trim() ? clanEl.textContent.trim() : defaults.clan,
      gradeLevel: defaults.gradeLevel,
      program: progEl && progEl.textContent.trim() ? progEl.textContent.trim() : defaults.program
    };
  }

  function downloadExamKarnePdf(exam, report) {
    if (!exam || !report) return;
    var placement = getExamPlacement(exam);
    var student = getStudentProfile();
    var safeName = String(exam.name || 'Sinav').replace(/[<>]/g, '');
    var safeStudent = String(student.fullName).replace(/[<>]/g, '');
    var rowsHtml = report.rows.map(function (row) {
      return '<tr>'
        + '<td>' + row.title + '</td>'
        + '<td>' + row.dogru + '</td>'
        + '<td>' + row.yanlis + '</td>'
        + '<td>' + row.bos + '</td>'
        + '<td>' + fmtNet(row.net) + '</td>'
        + '</tr>';
    }).join('');
    var logoUrl;
    try {
      logoUrl = new URL('assets/bilenyum-logo.svg', window.location.href).href;
    } catch (e) {
      logoUrl = 'assets/bilenyum-logo.svg';
    }
    var doc = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>' + safeName + ' — Karnesi</title>'
      + '<style>'
      + 'body{font-family:Arial,sans-serif;color:#1a1a2e;padding:28px;max-width:760px;margin:0 auto;}'
      + 'header.doc-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;border-bottom:2px solid #28265a;padding-bottom:14px;margin-bottom:18px;}'
      + '.doc-head-text{flex:1;min-width:0;}'
      + '.doc-logo{height:34px;width:auto;flex-shrink:0;display:block;}'
      + 'h1{margin:0 0 6px;font-size:22px;color:#28265a;}'
      + '.sub{margin:0 0 12px;font-size:13px;color:#555;}'
      + '.student{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 16px;padding:14px;border:1px solid #d8d4f0;border-radius:10px;background:#faf9ff;}'
      + '.student div{display:flex;flex-direction:column;gap:3px;}'
      + '.student span{font-size:10px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.06em;}'
      + '.student strong{font-size:14px;color:#28265a;}'
      + '.rank{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 16px;}'
      + '.rank div{padding:12px;border:1px solid #d8d4f0;border-radius:10px;background:#f7f6fc;}'
      + '.rank span{display:block;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;}'
      + '.rank strong{font-size:22px;color:#28265a;}'
      + 'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;}'
      + 'th,td{border:1px solid #ddd;padding:8px;text-align:center;}'
      + 'th{background:#eee;color:#333;}'
      + 'td:first-child,th:first-child{text-align:left;}'
      + '.summary{margin-top:14px;font-size:13px;line-height:1.6;}'
      + '@media print{body{padding:12px;}.doc-logo{height:30px;}}'
      + '</style></head><body>'
      + '<header class="doc-head">'
      +   '<div class="doc-head-text">'
      +     '<h1>Sınav Değerlendirme Karnesi</h1>'
      +     '<p class="sub"><strong>' + safeName + '</strong> · ' + formatDate(exam.date) + ' · ' + getKeyTotal(exam) + ' soru · ' + exam.dur + ' dk</p>'
      +   '</div>'
      +   '<img class="doc-logo" src="' + logoUrl + '" alt="Bilenyum">'
      + '</header>'
      + '<div class="student">'
      +   '<div><span>Öğrenci Adı Soyadı</span><strong>' + safeStudent + '</strong></div>'
      +   '<div><span>Klan</span><strong>' + student.clan + '</strong></div>'
      +   '<div><span>Sınıf Seviyesi</span><strong>' + student.gradeLevel + '</strong></div>'
      +   '<div><span>Bulunduğu Program</span><strong>' + student.program + '</strong></div>'
      + '</div>'
      + '<div class="rank">'
      +   '<div><span>Öğrencinin Sıralaması</span><strong>#' + placement.rank.toLocaleString('tr-TR') + '</strong></div>'
      +   '<div><span>Yüzdelik Dilimi</span><strong>%' + String(placement.percentile).replace('.', ',') + '</strong></div>'
      + '</div>'
      + '<div class="summary">'
      + '<strong>Toplam Net:</strong> ' + fmtNet(calcNet(exam))
      + ' · <strong>Doğru:</strong> ' + exam.dogru
      + ' · <strong>Yanlış:</strong> ' + exam.yanlis
      + ' · <strong>Boş:</strong> ' + exam.bos
      + ' · <strong>XP:</strong> ' + calcExamXp(exam).toLocaleString('tr-TR')
      + '</div>'
      + '<h3 style="margin:18px 0 8px;font-size:13px;color:#28265a;text-transform:uppercase;letter-spacing:.08em;">Derslere Göre Sonuçlar</h3>'
      + '<table><thead><tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Boş</th><th>Net</th></tr></thead><tbody>'
      + rowsHtml
      + '<tr style="font-weight:700;background:#f0eef8;"><td>Toplam</td><td>' + exam.dogru + '</td><td>' + exam.yanlis + '</td><td>' + exam.bos + '</td><td>' + fmtNet(calcNet(exam)) + '</td></tr>'
      + '</tbody></table>'
      + '<p style="margin-top:20px;font-size:11px;color:#777;">Bilenyum Öğrenci Kontrol Merkezi · Bu belge bilgilendirme amaçlıdır.</p>'
      + '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},300);});</scr' + 'ipt>'
      + '</body></html>';
    var w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(doc);
      w.document.close();
      showToast('Karnen hazır · Yazdır penceresinden PDF olarak kaydet');
    } else {
      showToast('Pop-up engellendi — PDF indirmek için pencereye izin ver');
    }
  }

  if (detailPdf) {
    detailPdf.addEventListener('click', function () {
      if (!detailExam || !detailReport) return;
      downloadExamKarnePdf(detailExam, detailReport);
    });
  }

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (remindModal && !remindModal.hidden) {
      closeRemindModal();
      return;
    }
    if (detailDrawer && detailDrawer.classList.contains('is-open')) {
      closeDetailDrawer();
      return;
    }
    if (keyDrawer.classList.contains('is-open')) closeKeyDrawer();
  });

  // PDF Download — mock: print-ready HTML penceresi açar (kullanıcı PDF olarak kaydedebilir)
  if (keyDownload) {
    keyDownload.addEventListener('click', function(){
      if (!currentExam) return;
      var correct = genKey(currentExam);
      var student = genStudentAnswers(currentExam, correct);

      var sections = buildKeySections(currentExam);

      var rowsHtml = sections.map(function(sec){
        var cells = '';
        var secTitle = sec.title + (sec.count ? ' · ' + sec.count + ' soru' : '');
        for (var i = sec.from; i < sec.to; i++) {
          var s = student[i];
          var c = correct[i];
          var cls = !s ? 'blank' : (s === c ? 'correct' : 'wrong');
          var qNum = i - sec.from + 1;
          cells += '<div class="cell ' + cls + '"><span class="num">' + qNum + '.</span><span class="ans">' + (s || '—') + '</span><span class="correct-mark">(' + c + ')</span></div>';
        }
        return '<div class="section"><h3>' + secTitle + '</h3><div class="grid">' + cells + '</div></div>';
      }).join('');

      var safeName = currentExam.name.replace(/['"]/g, '');
      var doc = '<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>' + safeName + ' — Cevap Anahtarı</title>'
        + '<style>'
        + '* { box-sizing: border-box; }'
        + 'body { font-family: \'Plus Jakarta Sans\', -apple-system, sans-serif; padding: 24px 28px; color: #1a1a2e; background: white; }'
        + 'header { border-bottom: 2px solid #28265a; padding-bottom: 14px; margin-bottom: 18px; }'
        + 'h1 { margin: 0 0 4px; font-size: 20px; color: #28265a; }'
        + '.meta { font-size: 12px; color: #555; display: flex; gap: 16px; }'
        + '.section { margin-bottom: 16px; }'
        + '.section h3 { font-size: 13px; margin: 12px 0 8px; color: #28265a; border-bottom: 1px dashed #ccc; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; }'
        + '.grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }'
        + '.cell { padding: 5px 6px; border: 1px solid #d0d0e0; border-radius: 4px; font-size: 10px; display: flex; align-items: center; justify-content: space-between; }'
        + '.cell.correct { background: #d6f4e1; border-color: #6dd49e; }'
        + '.cell.wrong   { background: #fde0e0; border-color: #ff6b6b; }'
        + '.cell.blank   { background: #f2f1fa; border-color: #a8a4f0; }'
        + '.num { font-weight: 700; color: #777; }'
        + '.ans { font-weight: 800; font-family: monospace; }'
        + '.correct-mark { font-size: 9px; color: #6dd49e; }'
        + '.cell.wrong .correct-mark { color: #b03a3a; }'
        + '.cell.correct .correct-mark { display: none; }'
        + '.legend { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; font-size: 11px; color: #555; display: flex; gap: 16px; }'
        + '@media print { body { padding: 10px; } .section { page-break-inside: avoid; } }'
        + '</style></head><bo' + 'dy>'
        + '<header>'
        +   '<h1>' + safeName + ' — Cevap Anahtarı</h1>'
        +   '<div class="meta">'
        +     '<span><strong>Tarih:</strong> ' + formatDate(currentExam.date) + '</span>'
        +     '<span><strong>Soru:</strong> ' + currentExam.total + '</span>'
        +     '<span><strong>Net:</strong> ' + calcNet(currentExam).toFixed(2).replace('.', ',') + '</span>'
        +     '<span><strong>Doğru:</strong> ' + currentExam.dogru + ' · <strong>Yanlış:</strong> ' + currentExam.yanlis + ' · <strong>Boş:</strong> ' + currentExam.bos + '</span>'
        +   '</div>'
        + '</header>'
        + rowsHtml
        + '<div class="legend">'
        +   '<span>● Yeşil: Doğru cevapladın</span>'
        +   '<span>● Kırmızı: Yanlış cevapladın (parantez içi: doğru cevap)</span>'
        +   '<span>● Mor: Boş bıraktın</span>'
        + '</div>'
        + '<scr' + 'ipt>window.addEventListener("load",function(){setTimeout(function(){window.print();},250);});</scr' + 'ipt>'
        + '</bo' + 'dy></ht' + 'ml>';

      var w = window.open('', '_blank');
      if (w) {
        w.document.open();
        w.document.write(doc);
        w.document.close();
        showToast('PDF için yazdırma penceresi açıldı · Hedef: PDF olarak kaydet');
      } else {
        showToast('Pop-up engellenmiş — PDF için pencere açılamadı');
      }
    });
  }

  // ====== YAKLAŞAN SINAV BUTONLARI ======
  var UPCOMING_EXAM = {
    name: 'Bilenyum Genel Deneme · 12',
    at: new Date(2026, 5, 14, 10, 0, 0)
  };
  var REMIND_STORAGE_KEY = 'bilenyum.snRemind.upcoming';

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function formatDateTimeTR(d) {
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear()
      + ', ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }

  function getBefore1hTime() {
    return new Date(UPCOMING_EXAM.at.getTime() - 3600000);
  }

  function loadReminder() {
    try {
      var raw = localStorage.getItem(REMIND_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveReminder(data) {
    if (data) localStorage.setItem(REMIND_STORAGE_KEY, JSON.stringify(data));
    else localStorage.removeItem(REMIND_STORAGE_KEY);
  }

  var joinBtn = document.getElementById('snJoinBtn');
  var remindBtn = document.getElementById('snRemindBtn');
  var remindModal = document.getElementById('snRemindModal');
  var remindCalGrid = document.getElementById('snRemindCalGrid');
  var remindCalLabel = document.getElementById('snRemindCalLabel');
  var remindCalPrev = document.getElementById('snRemindCalPrev');
  var remindCalNext = document.getElementById('snRemindCalNext');
  var remindPreview = document.getElementById('snRemindPreview');
  var remindBeforeCheck = document.getElementById('snRemindBeforeCheck');
  var remindHourSelect = document.getElementById('snRemindHour');
  var remindMinSelect = document.getElementById('snRemindMin');
  var remindRemoveBtn = document.getElementById('snRemindRemove');
  var remindConfirmBtn = document.getElementById('snRemindConfirm');
  var remindCalMonth = { y: UPCOMING_EXAM.at.getFullYear(), m: UPCOMING_EXAM.at.getMonth() };
  var remindSelectedDay = null;

  function initRemindTimeSelects() {
    if (remindHourSelect && !remindHourSelect.options.length) {
      var hHtml = '';
      for (var h = 0; h < 24; h++) {
        hHtml += '<option value="' + pad2(h) + '">' + pad2(h) + '</option>';
      }
      remindHourSelect.innerHTML = hHtml;
    }
    if (remindMinSelect && !remindMinSelect.options.length) {
      var mHtml = '';
      for (var m = 0; m < 60; m++) {
        mHtml += '<option value="' + pad2(m) + '">' + pad2(m) + '</option>';
      }
      remindMinSelect.innerHTML = mHtml;
    }
  }

  function setRemindTimeValues(h, m) {
    initRemindTimeSelects();
    if (remindHourSelect) remindHourSelect.value = pad2(h);
    if (remindMinSelect) remindMinSelect.value = pad2(m);
  }

  function getRemindTimeValues() {
    initRemindTimeSelects();
    var h = remindHourSelect ? parseInt(remindHourSelect.value, 10) : 0;
    var m = remindMinSelect ? parseInt(remindMinSelect.value, 10) : 0;
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    return { h: h, m: m };
  }

  function dateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function isDayInRange(y, m, d) {
    var day = new Date(y, m, d);
    return day >= dateOnly(TODAY) && day <= dateOnly(UPCOMING_EXAM.at);
  }

  function getSelectedReminderDateTime() {
    if (!remindSelectedDay) return null;
    var t = getRemindTimeValues();
    return new Date(remindSelectedDay.y, remindSelectedDay.m, remindSelectedDay.d, t.h, t.m);
  }

  function isBefore1hSelection(dt) {
    if (!dt) return false;
    var before = getBefore1hTime();
    return Math.abs(dt.getTime() - before.getTime()) < 60000;
  }

  function setRemindSelectionFromDate(dt) {
    if (!dt) return;
    remindCalMonth = { y: dt.getFullYear(), m: dt.getMonth() };
    remindSelectedDay = { y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() };
    setRemindTimeValues(dt.getHours(), dt.getMinutes());
    renderRemindCalendar();
  }

  function monthHasSelectableDays(y, m) {
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    for (var d = 1; d <= daysInMonth; d++) {
      if (isDayInRange(y, m, d)) return true;
    }
    return false;
  }

  function shiftRemindMonth(delta) {
    var m = remindCalMonth.m + delta;
    var y = remindCalMonth.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    if (!monthHasSelectableDays(y, m)) return;
    remindCalMonth = { y: y, m: m };
    renderRemindCalendar();
  }

  function updateRemindNavButtons() {
    if (remindCalPrev) {
      var pm = remindCalMonth.m - 1;
      var py = remindCalMonth.y;
      if (pm < 0) { pm = 11; py--; }
      remindCalPrev.disabled = !monthHasSelectableDays(py, pm);
    }
    if (remindCalNext) {
      var nm = remindCalMonth.m + 1;
      var ny = remindCalMonth.y;
      if (nm > 11) { nm = 0; ny++; }
      remindCalNext.disabled = !monthHasSelectableDays(ny, nm);
    }
  }

  function updateRemindPreview() {
    var dt = getSelectedReminderDateTime();
    if (remindPreview) {
      remindPreview.textContent = dt
        ? 'Seçilen hatırlatma: ' + formatDateTimeTR(dt)
        : 'Takvimden bir gün seç';
    }
    if (remindBeforeCheck) {
      remindBeforeCheck.checked = isBefore1hSelection(dt);
    }
  }

  function renderRemindCalendar() {
    if (!remindCalGrid) return;
    var y = remindCalMonth.y;
    var m = remindCalMonth.m;
    if (remindCalLabel) remindCalLabel.textContent = MONTH_NAMES[m] + ' ' + y;

    var first = new Date(y, m, 1);
    var startOffset = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var html = '';

    for (var i = 0; i < startOffset; i++) {
      html += '<span class="sn-remind-cal-cell is-empty" aria-hidden="true"></span>';
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var inRange = isDayInRange(y, m, d);
      var isSelected = remindSelectedDay
        && remindSelectedDay.y === y
        && remindSelectedDay.m === m
        && remindSelectedDay.d === d;
      var isExamDay = y === UPCOMING_EXAM.at.getFullYear()
        && m === UPCOMING_EXAM.at.getMonth()
        && d === UPCOMING_EXAM.at.getDate();
      var isToday = isSameDay(new Date(y, m, d), TODAY);
      var cls = 'sn-remind-cal-cell';
      if (!inRange) cls += ' is-disabled';
      if (isSelected) cls += ' is-selected';
      if (isExamDay) cls += ' is-exam';
      if (isToday) cls += ' is-today';

      if (inRange) {
        html += '<button type="button" class="' + cls + '" data-day="' + d + '">' + d + '</button>';
      } else {
        html += '<span class="' + cls + '">' + d + '</span>';
      }
    }

    remindCalGrid.innerHTML = html;
    updateRemindNavButtons();
    updateRemindPreview();
  }

  function applyBefore1hPreset() {
    setRemindSelectionFromDate(getBefore1hTime());
  }

  function applyReminderUI(reminder) {
    if (!remindBtn) return;
    if (reminder) {
      remindBtn.classList.add('is-set');
      remindBtn.setAttribute('aria-label', 'Hatırlatma kuruldu · ' + reminder.label);
    } else {
      remindBtn.classList.remove('is-set');
      remindBtn.setAttribute('aria-label', 'Hatırlatma kur');
    }
  }

  function openRemindModal() {
    if (!remindModal) return;
    var existing = loadReminder();
    var initial = existing && existing.at
      ? new Date(existing.at)
      : getBefore1hTime();
    setRemindSelectionFromDate(initial);
    if (remindRemoveBtn) remindRemoveBtn.hidden = !existing;

    remindModal.hidden = false;
    requestAnimationFrame(function () { remindModal.classList.add('is-open'); });
  }

  function closeRemindModal() {
    if (!remindModal) return;
    remindModal.classList.remove('is-open');
    setTimeout(function () { remindModal.hidden = true; }, 220);
  }

  if (joinBtn) {
    joinBtn.addEventListener('click', function(){
      if (joinBtn.classList.contains('is-joined')) return;
      joinBtn.classList.add('is-joined');
      joinBtn.setAttribute('aria-label', 'Sınava katıldın');
      joinBtn.setAttribute('aria-disabled', 'true');
      showToast('Sınava katıldın · Başarılar! 🎯');
    });
  }

  if (remindBtn) {
    remindBtn.addEventListener('click', openRemindModal);
  }

  if (remindCalGrid) {
    remindCalGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-day]');
      if (!btn) return;
      var day = parseInt(btn.getAttribute('data-day'), 10);
      if (!isDayInRange(remindCalMonth.y, remindCalMonth.m, day)) return;
      remindSelectedDay = { y: remindCalMonth.y, m: remindCalMonth.m, d: day };
      renderRemindCalendar();
    });
  }

  if (remindCalPrev) {
    remindCalPrev.addEventListener('click', function () { shiftRemindMonth(-1); });
  }
  if (remindCalNext) {
    remindCalNext.addEventListener('click', function () { shiftRemindMonth(1); });
  }
  if (remindHourSelect) {
    remindHourSelect.addEventListener('change', updateRemindPreview);
  }
  if (remindMinSelect) {
    remindMinSelect.addEventListener('change', updateRemindPreview);
  }
  initRemindTimeSelects();
  if (remindBeforeCheck) {
    remindBeforeCheck.addEventListener('change', function () {
      if (remindBeforeCheck.checked) applyBefore1hPreset();
    });
  }

  if (remindModal) {
    remindModal.querySelectorAll('[data-remind-close]').forEach(function (el) {
      el.addEventListener('click', closeRemindModal);
    });
  }

  if (remindConfirmBtn) {
    remindConfirmBtn.addEventListener('click', function () {
      var reminderAt = getSelectedReminderDateTime();
      if (!reminderAt) {
        showToast('Lütfen takvimden bir gün seç');
        return;
      }
      if (reminderAt.getTime() <= TODAY.getTime()) {
        showToast('Hatırlatma şu andan sonra olmalı');
        return;
      }
      if (reminderAt.getTime() > UPCOMING_EXAM.at.getTime()) {
        showToast('Hatırlatma sınav saatinden önce olmalı');
        return;
      }

      var isBefore1h = isBefore1hSelection(reminderAt);
      var label = isBefore1h
        ? 'Sınavdan 1 saat önce · ' + formatDateTimeTR(reminderAt)
        : formatDateTimeTR(reminderAt);

      var payload = {
        type: isBefore1h ? 'before1h' : 'custom',
        at: reminderAt.toISOString(),
        label: label
      };
      saveReminder(payload);
      applyReminderUI(payload);
      closeRemindModal();
      showToast('Hatırlatma kuruldu · ' + label);
    });
  }

  if (remindRemoveBtn) {
    remindRemoveBtn.addEventListener('click', function () {
      saveReminder(null);
      applyReminderUI(null);
      closeRemindModal();
      showToast('Hatırlatma kaldırıldı');
    });
  }

  applyReminderUI(loadReminder());

  // ====== DERS BAZLI NET — sınavlardan hesaplanır (buildExamReport sonrası init) ======
  var SUBJECTS = [
    { key:'mat', name:'Matematik',       total:20, c:'#ff6dc6' },
    { key:'fen', name:'Fen Bilimleri',   total:20, c:'#6dd49e' },
    { key:'trk', name:'Türkçe',          total:20, c:'#4ad6ff' },
    { key:'sos', name:'Sosyal Bilgiler', total:10, c:'#a8a4f0' },
    { key:'ing', name:'İngilizce',       total:10, c:'#ff9a4a' },
    { key:'din', name:'Din Kültürü',     total:10, c:'#5e9be8' }
  ];
  var SECTION_TITLE_TO_KEY = {
    'Türkçe': 'trk',
    'Sosyal Bilgiler': 'sos',
    'Din Kültürü': 'din',
    'Matematik': 'mat',
    'Fen Bilimleri': 'fen',
    'İngilizce': 'ing'
  };
  var currentSubjRange = monthRangeKey(TODAY.getFullYear(), TODAY.getMonth());

  function examSubjectNets(exam) {
    var report = buildExamReport(exam);
    var nets = {};
    report.rows.forEach(function (row) {
      var key = SECTION_TITLE_TO_KEY[row.title];
      if (!key && !isLgsExam(exam)) {
        key = inferBransSubjectCode(exam);
      }
      if (key) nets[key] = row.net;
    });
    if (isLgsExam(exam) && nets.ing == null) {
      nets.ing = Math.min(10, Math.max(0, calcNet(exam) * 0.11));
    }
    return nets;
  }

  function computeSubjectAverages(range) {
    var exams = EXAMS.filter(function (e) { return inDateRange(e.date, range); });
    var sums = {};
    var counts = {};
    SUBJECTS.forEach(function (s) {
      sums[s.key] = 0;
      counts[s.key] = 0;
    });
    exams.forEach(function (exam) {
      var nets = examSubjectNets(exam);
      Object.keys(nets).forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(sums, key)) return;
        sums[key] += nets[key];
        counts[key]++;
      });
    });
    var out = {};
    SUBJECTS.forEach(function (s) {
      out[s.key] = counts[s.key] > 0 ? sums[s.key] / counts[s.key] : 0;
    });
    return out;
  }

  function renderSubj() {
    var list = document.getElementById('snSubjList');
    if (!list) return;
    var data = computeSubjectAverages(currentSubjRange);
    list.innerHTML = SUBJECTS.map(function (s) {
      var net = data[s.key] || 0;
      var pct = Math.min(100, Math.round((net / s.total) * 100));
      return '<div class="sn-subj-row" style="--c:' + s.c + ';">'
        + '<span class="sn-subj-name"><span class="sn-subj-name-dot"></span>' + s.name + '</span>'
        + '<div class="sn-subj-track"><div class="sn-subj-fill" style="width:' + pct + '%"></div></div>'
        + '<span class="sn-subj-net">' + net.toFixed(1).replace('.', ',') + '<small>/' + s.total + '</small></span>'
        + '</div>';
    }).join('');
  }

  (function subjDropdown() {
    var wrap = document.getElementById('snSubjDropdown');
    var btn = document.getElementById('snSubjBtn');
    var menu = document.getElementById('snSubjMenu');
    var label = document.getElementById('snSubjLabel');
    if (!wrap || !btn || !menu) return;

    var monthOpts = buildDateMonthOptions();
    var RANGE_LABELS = { all: 'Tüm Zamanlar' };
    monthOpts.forEach(function (o) { RANGE_LABELS[o.range] = o.label; });

    var allItem = menu.querySelector('[data-range="all"]');
    menu.innerHTML = '';
    if (allItem) menu.appendChild(allItem);
    monthOpts.forEach(function (o) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'sn-dropdown-item' + (currentSubjRange === o.range ? ' is-active' : '');
      item.dataset.range = o.range;
      item.setAttribute('role', 'menuitem');
      item.textContent = o.label;
      menu.appendChild(item);
    });

    label.textContent = RANGE_LABELS[currentSubjRange] || 'Tüm Zamanlar';
    renderSubj();

    function open() { wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    function close() { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) close(); else open();
    });
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.sn-dropdown-item');
      if (!item) return;
      var r = item.dataset.range;
      currentSubjRange = r;
      label.textContent = RANGE_LABELS[r] || 'Tüm Zamanlar';
      menu.querySelectorAll('.sn-dropdown-item').forEach(function (it) {
        it.classList.toggle('is-active', it.dataset.range === r);
      });
      renderSubj();
      close();
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  })();

  // ====== INIT ======
  renderList();

  function bindSnStatTips() {
    var tip = document.getElementById('snFloatTip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'snFloatTip';
      tip.className = 'sn-floattip';
      tip.hidden = true;
      document.body.appendChild(tip);
    }
    document.querySelectorAll('.sn-stat-card[data-tip]').forEach(function (el) {
      if (el.getAttribute('data-tip-bound')) return;
      el.setAttribute('data-tip-bound', '1');
      el.addEventListener('mouseenter', function () {
        var text = el.getAttribute('data-tip');
        if (!text) return;
        tip.textContent = text;
        tip.hidden = false;
        var r = el.getBoundingClientRect();
        tip.style.left = (r.left + r.width / 2) + 'px';
        tip.style.top = r.top + 'px';
        requestAnimationFrame(function () { tip.classList.add('is-visible'); });
      });
      el.addEventListener('mouseleave', function () {
        tip.classList.remove('is-visible');
        tip.hidden = true;
      });
    });
  }
  bindSnStatTips();

  // ====== ANIMATIONS — sayı sayacı (sayfa yüklenince oynar) ======
  (function animateInit(){
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function countUp(el, target, opts) {
      if (!el) return;
      opts = opts || {};
      var duration = opts.duration || 1200;
      var delay = opts.delay || 0;
      var decimals = opts.decimals || 0;
      var prefix = opts.prefix || '';
      var separator = opts.separator || ',';
      function fmt(v) {
        var s = v.toFixed(decimals);
        if (decimals > 0) s = s.replace('.', separator);
        return prefix + s;
      }
      if (reduceMotion) { el.textContent = fmt(target); return; }
      el.textContent = fmt(0);
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var elapsed = ts - start - delay;
        if (elapsed < 0) { requestAnimationFrame(step); return; }
        var p = Math.min(elapsed / duration, 1);
        var v = target * easeOutCubic(p);
        el.textContent = fmt(v);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
      }
      requestAnimationFrame(step);
    }

    // Stat kartları — sayı sayacı
    countUp(document.querySelector('.sn-stat-total .sn-stat-value'), 11,   { duration: 900,  delay: 400 });
    countUp(document.querySelector('.sn-stat-avg .sn-stat-value'),   76.4, { duration: 1100, delay: 500, decimals: 1 });
    countUp(document.querySelector('.sn-stat-best .sn-stat-value'),  92,   { duration: 1100, delay: 600 });
    countUp(document.querySelector('.sn-stat-rank .sn-stat-value'),  24,   { duration: 1100, delay: 700, prefix: '#' });
  })();
})();
