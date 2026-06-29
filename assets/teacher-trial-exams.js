/**
 * Öğretmen — öğrenci deneme sınavları görünümü (sinavlar.html dilinde, sayfa içi)
 * window.TeacherTrialExams
 */
(function (global) {
  'use strict';

  var mock = global.TeacherTrialExamsMock;
  if (!mock) return;

  var MONTH_NAMES = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var MONTH_SHORT = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];

  var TYPE_META = {
    genel: { name: 'GENEL DENEME', c: '#ff6dc6' },
    brans: { name: 'BRANŞ DENEMESİ', c: '#4ad6ff' },
    kurum: { name: 'KURUM DENEMESİ', c: '#a8a4f0' }
  };

  var LGS_KEY_SECTIONS = [
    { title: 'Türkçe', count: 20 },
    { title: 'Sosyal Bilgiler', count: 10 },
    { title: 'Din Kültürü', count: 10 },
    { title: 'Matematik', count: 20 },
    { title: 'Fen Bilimleri', count: 20 }
  ];

  var mountRoot = null;
  var studentMeta = null;
  var exams = [];
  var allExams = [];
  var currentFilter = 'all';
  var selectedEduWeek = null;
  var detailExam = null;
  var detailReport = null;

  function getDapi() {
    return global.TeacherDashboardMock || null;
  }

  function defaultEduWeek() {
    var dapi = getDapi();
    if (!dapi) return 1;
    if (dapi.DEMO_EDU_WEEK) return dapi.DEMO_EDU_WEEK;
    if (allExams.length && dapi.findEduWeekForDate) {
      return dapi.findEduWeekForDate(allExams[0].date);
    }
    return dapi.MIN_EDU_WEEK || 1;
  }

  function examInSelectedWeek(exam) {
    var dapi = getDapi();
    if (!dapi || !dapi.findEduWeekForDate || selectedEduWeek == null) return true;
    return dapi.findEduWeekForDate(exam.date) === selectedEduWeek;
  }

  function getFilteredExams() {
    return exams.filter(function (e) {
      return (currentFilter === 'all' || e.type === currentFilter) && examInSelectedWeek(e);
    });
  }

  function countExamsForWeek(weekNum) {
    if (mock.countExamsForEduWeek && studentMeta) {
      return mock.countExamsForEduWeek(studentKey(studentMeta), weekNum);
    }
    var dapi = getDapi();
    if (!dapi || !dapi.findEduWeekForDate) return 0;
    return allExams.filter(function (e) {
      return dapi.findEduWeekForDate(e.date) === weekNum;
    }).length;
  }

  function calcNet(e) { return Math.max(0, e.dogru - e.yanlis / 3); }
  function fmtNet(n) {
    var v = Math.round(n * 100) / 100;
    return (v % 1 === 0 ? String(v) : v.toFixed(2)).replace('.', ',');
  }
  function formatDate(s) {
    var d = new Date(s + 'T12:00:00');
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }
  function formatDayName(s) {
    return DAY_NAMES[new Date(s + 'T12:00:00').getDay()];
  }
  function netColor(net, total) {
    var pct = (net / total) * 100;
    if (pct >= 70) return '#6dd49e';
    if (pct >= 45) return '#ffd84a';
    return '#ff9a4a';
  }
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function $(id) { return document.getElementById(id); }

  function isLgsExam(exam) { return exam && (exam.type === 'genel' || exam.type === 'kurum'); }
  function getKeyTotal(exam) { return isLgsExam(exam) ? 80 : exam.total; }

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
    if (exam.rank && exam.percentile != null) {
      return { rank: exam.rank, percentile: exam.percentile };
    }
    var net = calcNet(exam);
    var ratio = net / Math.max(1, exam.total * 0.88);
    var percentile = Math.max(1.2, Math.min(99.2, Math.round((100 - ratio * 88) * 10) / 10));
    return { rank: Math.max(1, Math.round((percentile / 100) * 8420)), percentile: percentile };
  }

  function calcExamXp(exam) {
    var net = calcNet(exam);
    var typeBonus = exam.type === 'genel' ? 150 : (exam.type === 'kurum' ? 100 : 75);
    return Math.round(net * 8 + typeBonus);
  }

  function genKey(exam) {
    var options = ['A', 'B', 'C', 'D', 'E'];
    var key = [];
    var seed = exam.id * 7.3;
    var total = getKeyTotal(exam);
    for (var i = 0; i < total; i++) {
      var x = Math.sin(seed * (i + 1)) * 10000;
      key.push(options[Math.floor((x - Math.floor(x)) * 5)]);
    }
    return key;
  }

  function buildExamReport(exam) {
    var correct = genKey(exam);
    var sections = buildKeySections(exam);
    var rows = sections.map(function (sec) {
      var d = 0;
      var y = 0;
      var b = 0;
      var shareD = Math.round(exam.dogru * ((sec.to - sec.from) / exam.total));
      var shareY = Math.round(exam.yanlis * ((sec.to - sec.from) / exam.total));
      var shareB = (sec.to - sec.from) - shareD - shareY;
      if (shareB < 0) { shareY += shareB; shareB = 0; }
      d = shareD; y = shareY; b = shareB;
      return { title: sec.title, dogru: d, yanlis: y, bos: b, net: Math.max(0, d - y / 3) };
    });
    return { rows: rows, correct: correct };
  }

  function studentKey(meta) {
    return meta.id || meta.name || 'student';
  }

  function summaryStats() {
    var items = getFilteredExams();
    if (!items.length) return { count: 0, avg: '—', best: '—', last: '—' };
    var nets = items.map(calcNet);
    var sum = nets.reduce(function (a, b) { return a + b; }, 0);
    var best = Math.max.apply(null, nets);
    return {
      count: items.length,
      avg: fmtNet(sum / items.length),
      best: fmtNet(best),
      last: fmtNet(nets[0])
    };
  }

  function renderStatsBlock() {
    var stats = summaryStats();
    return (
      renderStatCard('📝', stats.count, 'Deneme') +
      renderStatCard('📊', stats.avg, 'Ort. Net') +
      renderStatCard('🏆', stats.best, 'En Yüksek') +
      renderStatCard('⚡', stats.last, 'Son Net')
    );
  }

  function updateHeroStats() {
    var el = $('tdsStudentStats');
    if (el) el.innerHTML = renderStatsBlock();
  }

  function fmtXp(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toLocaleString('tr-TR');
  }

  function renderStudentAvatar(name) {
    var TA = global.TeacherAvatars;
    var svg = TA && TA.studentAvatarSvg ? TA.studentAvatarSvg(name) : '';
    return '<span class="tkg-avatar tkg-avatar--img is-student tds-student-avatar" aria-hidden="true">' + svg + '</span>';
  }

  function renderStudentInfoChips(meta) {
    var chips = [];
    if (meta.branch) chips.push({ ico: '📐', text: meta.branch });
    if (meta.programType) chips.push({ ico: '🕐', text: meta.programType });
    if (!meta.isBirebir && meta.clanName) {
      var clanIco = meta.clanEmoji;
      if (!clanIco && global.TeacherAvatars && global.TeacherAvatars.clanEmoji) {
        clanIco = global.TeacherAvatars.clanEmoji(meta.clanId || meta.clanName);
      }
      chips.push({ ico: clanIco || '🏰', text: meta.clanName });
    }
    if (meta.isBirebir && meta.lessonCount != null) {
      chips.push({ ico: '🎓', text: meta.lessonCount + ' birebir ders' });
    }
    if (meta.isBirebir && meta.globalRank) {
      chips.push({ ico: '🏅', text: 'Genel sıralama ' + meta.globalRank });
    }
    if (meta.xp != null) chips.push({ ico: '⭐', text: fmtXp(meta.xp) + ' XP' });
    if (!chips.length) return '';
    return (
      '<div class="tds-student-info-chips">' +
        chips.map(function (chip) {
          return (
            '<span class="tds-student-chip">' +
              '<span class="tds-student-chip-ico" aria-hidden="true">' + chip.ico + '</span>' +
              '<span class="tds-student-chip-text">' + escapeHtml(chip.text) + '</span>' +
            '</span>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderStatCard(ico, val, lbl) {
    return (
      '<div class="tds-student-stat">' +
        '<span class="tds-student-stat-ico" aria-hidden="true">' + ico + '</span>' +
        '<span class="tds-student-stat-val">' + escapeHtml(String(val)) + '</span>' +
        '<span class="tds-student-stat-lbl">' + escapeHtml(lbl) + '</span>' +
      '</div>'
    );
  }

  function renderHero(meta) {
    var badge = meta.isBirebir
      ? '<span class="tkg-card-badge is-birebir">Birebir Ders</span>'
      : '<span class="tkg-card-badge is-klan">Klan Dersi</span>';
    var sub = meta.isBirebir
      ? escapeHtml(meta.gradeLevel) + (meta.programType ? ' · ' + escapeHtml(meta.programType) : '')
      : escapeHtml(meta.gradeLevel) + (meta.clanName ? ' · ' + escapeHtml(meta.clanName) : '');
    return (
      '<div class="tds-student-hero">' +
        '<div class="tds-student-hero-main">' +
          '<div class="tds-student-hero-profile">' +
            renderStudentAvatar(meta.name) +
            '<div class="tds-student-hero-text">' +
              '<h2 class="tds-student-name">' + escapeHtml(meta.name) + '</h2>' +
              '<div class="tds-student-badges">' + badge + '</div>' +
              '<p class="tds-student-meta">' + sub + '</p>' +
              renderStudentInfoChips(meta) +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tds-student-stats" id="tdsStudentStats">' +
          renderStatsBlock() +
        '</div>' +
      '</div>'
    );
  }

  function renderEduWeekNav() {
    var dapi = getDapi();
    if (!dapi) return '';
    return (
      '<div class="td-week-edu-nav tds-edu-nav" id="tdsEduNav">' +
        '<button type="button" class="td-week-edu-btn is-prev" id="tdsEduPrev" aria-label="Önceki eğitim haftası">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
        '</button>' +
        '<div class="td-week-edu-center">' +
          '<div class="td-week-edu-label">' +
            '<span class="td-week-edu-eyebrow" id="tdsEduEyebrow">—</span>' +
            '<strong class="td-week-edu-range" id="tdsEduRange">—</strong>' +
          '</div>' +
          '<button type="button" class="td-week-edu-cal-btn" id="tdsEduCalBtn" aria-label="Eğitim haftası seç" aria-expanded="false" aria-controls="tdsEduPicker">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
          '</button>' +
        '</div>' +
        '<button type="button" class="td-week-edu-btn is-next" id="tdsEduNext" aria-label="Sonraki eğitim haftası">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>' +
        '<div class="td-week-edu-picker" id="tdsEduPicker" hidden role="dialog" aria-label="Eğitim haftası seç">' +
          '<div class="td-week-edu-picker-head">Eğitim Haftası Seç</div>' +
          '<div class="td-week-edu-picker-list" id="tdsEduPickerList"></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSectionHead() {
    return (
      '<header class="sn-section-head tds-section-head">' +
        '<div class="tds-section-head-main">' +
          '<h3 class="sn-section-title" id="tdsListTitle">Deneme Sınavları</h3>' +
          '<span class="sn-section-line"></span>' +
        '</div>' +
        renderEduWeekNav() +
      '</header>'
    );
  }

  function updateEduNavLabels() {
    var dapi = getDapi();
    if (!dapi || selectedEduWeek == null) return;
    var eyebrow = $('tdsEduEyebrow');
    var range = $('tdsEduRange');
    var prev = $('tdsEduPrev');
    var next = $('tdsEduNext');
    if (eyebrow) eyebrow.textContent = dapi.formatEduWeekLabel(selectedEduWeek);
    if (range) range.textContent = dapi.formatEduWeekRange(selectedEduWeek);
    if (prev) prev.disabled = selectedEduWeek <= dapi.MIN_EDU_WEEK;
    if (next) next.disabled = selectedEduWeek >= dapi.MAX_EDU_WEEK;
  }

  function renderEduWeekPicker() {
    var dapi = getDapi();
    var list = $('tdsEduPickerList');
    if (!dapi || !list) return;
    var html = '';
    for (var w = dapi.MIN_EDU_WEEK; w <= dapi.MAX_EDU_WEEK; w++) {
      var activeCls = w === selectedEduWeek ? ' is-active' : '';
      var count = countExamsForWeek(w);
      var countLabel = count ? count + ' deneme' : 'Deneme yok';
      html += '<button type="button" class="td-week-edu-picker-item' + activeCls + '" data-tds-week="' + w + '">' +
        '<strong>' + escapeHtml(dapi.formatEduWeekLabel(w)) + '</strong>' +
        '<span>' + escapeHtml(dapi.formatEduWeekRange(w) + ' · ' + countLabel) + '</span>' +
        '</button>';
    }
    list.innerHTML = html;
  }

  function closeEduWeekPicker() {
    var picker = $('tdsEduPicker');
    var btn = $('tdsEduCalBtn');
    if (picker) picker.hidden = true;
    if (btn) {
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function openEduWeekPicker() {
    renderEduWeekPicker();
    var picker = $('tdsEduPicker');
    var btn = $('tdsEduCalBtn');
    if (picker) picker.hidden = false;
    if (btn) {
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  }

  function applyEduWeek(weekNum) {
    var dapi = getDapi();
    if (!dapi) return;
    var w = parseInt(weekNum, 10);
    if (!w || w < dapi.MIN_EDU_WEEK || w > dapi.MAX_EDU_WEEK) return;
    if (w === selectedEduWeek) {
      closeEduWeekPicker();
      return;
    }
    selectedEduWeek = w;
    closeEduWeekPicker();
    updateEduNavLabels();
    updateHeroStats();
    renderList();
  }

  function shiftEduWeek(delta) {
    var dapi = getDapi();
    if (!dapi || selectedEduWeek == null) return;
    applyEduWeek(selectedEduWeek + delta);
  }

  function bindEduWeekNav() {
    var nav = $('tdsEduNav');
    if (!nav || nav.getAttribute('data-tds-edu-ready')) return;
    nav.setAttribute('data-tds-edu-ready', '1');

    var prev = $('tdsEduPrev');
    var next = $('tdsEduNext');
    var calBtn = $('tdsEduCalBtn');
    var pickerList = $('tdsEduPickerList');

    if (prev) {
      prev.addEventListener('click', function (e) {
        e.stopPropagation();
        shiftEduWeek(-1);
      });
    }
    if (next) {
      next.addEventListener('click', function (e) {
        e.stopPropagation();
        shiftEduWeek(1);
      });
    }
    if (calBtn) {
      calBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var picker = $('tdsEduPicker');
        if (!picker) return;
        if (picker.hidden) openEduWeekPicker();
        else closeEduWeekPicker();
      });
    }
    if (pickerList) {
      pickerList.addEventListener('click', function (e) {
        var item = e.target.closest('[data-tds-week]');
        if (!item) return;
        applyEduWeek(item.getAttribute('data-tds-week'));
      });
    }

    document.addEventListener('click', onEduWeekDocClick);
  }

  function unbindEduWeekNav() {
    document.removeEventListener('click', onEduWeekDocClick);
    closeEduWeekPicker();
    var nav = $('tdsEduNav');
    if (nav) nav.removeAttribute('data-tds-edu-ready');
  }

  function onEduWeekDocClick(e) {
    var picker = $('tdsEduPicker');
    var nav = $('tdsEduNav');
    if (!picker || picker.hidden) return;
    if (nav && nav.contains(e.target)) return;
    closeEduWeekPicker();
  }

  function renderFilters() {
    var chips = [
      { key: 'all', label: 'Tümü' },
      { key: 'genel', label: 'Genel' },
      { key: 'brans', label: 'Branş' },
      { key: 'kurum', label: 'Kurum' }
    ];
    return (
      '<div class="tds-filter-row">' +
        chips.map(function (c) {
          return '<button type="button" class="sn-filter-chip' + (currentFilter === c.key ? ' is-active' : '') + '" data-tds-filter="' + c.key + '">' + c.label + '</button>';
        }).join('') +
      '</div>'
    );
  }

  function renderList() {
    var listEl = $('tdsSnList');
    var emptyEl = $('tdsSnListEmpty');
    if (!listEl) return;

    var items = getFilteredExams();

    if (!items.length) {
      listEl.innerHTML = '';
      if (emptyEl) {
        emptyEl.hidden = false;
        var emptyTitle = emptyEl.querySelector('.sn-empty-title');
        var emptyText = emptyEl.querySelector('.sn-empty-text');
        if (emptyTitle) emptyTitle.textContent = 'Bu haftada sınav yok';
        if (emptyText) {
          emptyText.textContent = currentFilter === 'all'
            ? 'Seçili eğitim haftasında deneme sınavı bulunmuyor. Ok tuşları veya takvimden başka bir hafta seçin.'
            : 'Seçili eğitim haftası ve tür filtresine uygun deneme bulunmuyor.';
        }
      }
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    listEl.innerHTML = items.map(function (e) {
      var net = calcNet(e);
      var nc = netColor(net, e.total);
      var meta = TYPE_META[e.type];
      var dPct = (e.dogru / e.total) * 100;
      var yPct = (e.yanlis / e.total) * 100;
      var bPct = (e.bos / e.total) * 100;
      var d = new Date(e.date + 'T12:00:00');
      var pad2 = function (n) { return n < 10 ? '0' + n : '' + n; };
      return (
        '<article class="sn-row" data-type="' + e.type + '" data-id="' + e.id + '">' +
          '<div class="sn-row-date" aria-label="' + formatDate(e.date) + '">' +
            '<span class="sn-row-date-month">' + MONTH_SHORT[d.getMonth()] + '</span>' +
            '<span class="sn-row-date-day">' + pad2(d.getDate()) + '</span>' +
            '<span class="sn-row-date-year">' + d.getFullYear() + '</span>' +
          '</div>' +
          '<div class="sn-row-info">' +
            '<span class="sn-row-eyebrow">' + meta.name + '</span>' +
            '<h4 class="sn-row-title">' + escapeHtml(e.name) + '</h4>' +
            '<div class="sn-row-meta">' +
              '<span>' + formatDayName(e.date) + '</span>' +
              '<span class="sn-row-meta-sep">·</span>' +
              '<span>' + e.total + ' soru</span>' +
              '<span class="sn-row-meta-sep">·</span>' +
              '<span>' + e.dur + ' dk</span>' +
            '</div>' +
          '</div>' +
          '<div class="sn-row-net">' +
            '<div class="sn-row-net-main">' +
              '<span class="sn-row-net-eyebrow">Net</span>' +
              '<span class="sn-row-net-value" style="--net-c:' + nc + ';">' + net.toFixed(2).replace('.', ',') + '<small>/' + e.total + '</small></span>' +
            '</div>' +
            '<div class="sn-row-net-breakdown">' +
              '<div class="sn-row-net-bar">' +
                '<div class="sn-row-net-bar-d" style="width:' + dPct + '%"></div>' +
                '<div class="sn-row-net-bar-y" style="width:' + yPct + '%"></div>' +
                '<div class="sn-row-net-bar-b" style="width:' + bPct + '%"></div>' +
              '</div>' +
              '<div class="sn-row-net-breakdown-text">' +
                '<span class="sn-row-net-d">' + e.dogru + ' D</span>' +
                '<span class="sn-row-net-y">' + e.yanlis + ' Y</span>' +
                '<span class="sn-row-net-b">' + e.bos + ' B</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="sn-row-actions">' +
            '<button type="button" class="sn-row-btn sn-row-btn-primary" data-act="detail" title="Sınav sonucu raporu">' +
              '<span>Detay</span>' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
            '</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderDetailTable(report, exam) {
    var body = $('tdsDetailTableBody');
    var foot = $('tdsDetailTableFoot');
    if (!body || !foot) return;
    body.innerHTML = report.rows.map(function (row) {
      return '<tr>' +
        '<td class="sn-detail-td-subj">' + escapeHtml(row.title) + '</td>' +
        '<td class="sn-detail-td-d">' + row.dogru + '</td>' +
        '<td class="sn-detail-td-y">' + row.yanlis + '</td>' +
        '<td class="sn-detail-td-b">' + row.bos + '</td>' +
        '<td class="sn-detail-td-net">' + fmtNet(row.net) + '</td>' +
      '</tr>';
    }).join('');
    foot.innerHTML = '<tr>' +
      '<td class="sn-detail-td-subj">Toplam</td>' +
      '<td class="sn-detail-td-d">' + exam.dogru + '</td>' +
      '<td class="sn-detail-td-y">' + exam.yanlis + '</td>' +
      '<td class="sn-detail-td-b">' + exam.bos + '</td>' +
      '<td class="sn-detail-td-net">' + fmtNet(calcNet(exam)) + '</td>' +
    '</tr>';
  }

  function openDetailDrawer(exam) {
    var drawer = $('tdsDetailDrawer');
    if (!drawer) return;
    detailExam = exam;
    detailReport = buildExamReport(exam);
    var placement = getExamPlacement(exam);

    $('tdsDetailTitle').textContent = exam.name;
    $('tdsDetailStudent').textContent = studentMeta ? studentMeta.name : '—';
    $('tdsDetailDate').textContent = formatDate(exam.date);
    $('tdsDetailTotal').textContent = getKeyTotal(exam) + ' soru';
    $('tdsDetailDur').textContent = exam.dur + ' dk';
    $('tdsDetailNet').textContent = fmtNet(calcNet(exam));
    $('tdsDetailDogru').textContent = String(exam.dogru);
    $('tdsDetailYanlis').textContent = String(exam.yanlis);
    $('tdsDetailBos').textContent = String(exam.bos);
    $('tdsDetailXpVal').textContent = calcExamXp(exam).toLocaleString('tr-TR') + ' XP';
    $('tdsDetailRank').textContent = '#' + placement.rank.toLocaleString('tr-TR');
    $('tdsDetailPercentile').textContent = '%' + String(placement.percentile).replace('.', ',');

    renderDetailTable(detailReport, exam);
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDetailDrawer() {
    var drawer = $('tdsDetailDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    detailExam = null;
    detailReport = null;
  }

  function bindEvents() {
    if (!mountRoot) return;

    mountRoot.querySelectorAll('[data-tds-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentFilter = btn.getAttribute('data-tds-filter');
        mountRoot.querySelectorAll('[data-tds-filter]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        updateHeroStats();
        renderList();
      });
    });

    bindEduWeekNav();

    var listEl = $('tdsSnList');
    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-act="detail"]');
        if (!btn) return;
        var row = btn.closest('.sn-row');
        var id = row && row.getAttribute('data-id');
        var exam = exams.find(function (x) { return String(x.id) === String(id); });
        if (exam) openDetailDrawer(exam);
      });
    }

    var drawer = $('tdsDetailDrawer');
    if (drawer) {
      drawer.querySelectorAll('[data-tds-detail-close]').forEach(function (el) {
        el.addEventListener('click', closeDetailDrawer);
      });
    }

    document.addEventListener('keydown', onKeydown);
  }

  function unbindEvents() {
    document.removeEventListener('keydown', onKeydown);
    unbindEduWeekNav();
  }

  function onKeydown(e) {
    if (e.key !== 'Escape') return;
    var drawer = $('tdsDetailDrawer');
    if (drawer && drawer.classList.contains('is-open')) {
      closeDetailDrawer();
      return;
    }
    closeEduWeekPicker();
  }

  function mount(root, meta) {
    unmount();
    mountRoot = root;
    studentMeta = meta;
    allExams = mock.getExamsForStudent(studentKey(meta));
    exams = allExams.slice();
    currentFilter = 'all';
    selectedEduWeek = defaultEduWeek();

    root.innerHTML =
      '<div class="tds-student-exams sn-page">' +
        renderHero(meta) +
        renderFilters() +
        '<section class="sn-section" aria-labelledby="tdsListTitle">' +
          renderSectionHead() +
          '<div class="sn-list" id="tdsSnList"></div>' +
          '<div class="sn-empty" id="tdsSnListEmpty" hidden>' +
            '<h3 class="sn-empty-title">Bu haftada sınav yok</h3>' +
            '<p class="sn-empty-text">Seçili eğitim haftasında deneme sınavı bulunmuyor.</p>' +
          '</div>' +
        '</section>' +
      '</div>';

    updateEduNavLabels();
    renderList();
    bindEvents();
  }

  function unmount() {
    unbindEvents();
    closeDetailDrawer();
    if (mountRoot) mountRoot.innerHTML = '';
    mountRoot = null;
    studentMeta = null;
    exams = [];
    allExams = [];
    selectedEduWeek = null;
  }

  global.TeacherTrialExams = {
    mount: mount,
    unmount: unmount
  };
})(typeof window !== 'undefined' ? window : global);
