/* ---------------------------------------------------------------------------
 * Bilenyum assessment-results.js — Sınav sonuç ekranı render
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var Scoring = global.BilenyumScoring;
  if (!Scoring) return;

  var P = 'bilenyum.';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }

  function examStatus() {
    var placement = lsGet('placementComplete') === '1';
    var attention = lsGet('attentionComplete') === '1';
    return {
      placement: placement,
      attention: attention,
      allDone: placement && attention
    };
  }

  function welcomeDashboardBtn(className) {
    return '<a href="dashboard.html?assessment=done" class="asm-btn asm-btn-primary' + (className ? ' ' + className : '') + '">Dashboard\'a Hoşgeldin ' + ICON_ARROW + '</a>';
  }

  function subjectRows(placement) {
    return Scoring.SUBJECTS.map(function (s) {
      var d = placement.bySubject[s.code] || { correct: 0, wrong: 0, net: 0 };
      return (
        '<tr>' +
          '<td class="asm-res-td-subj">' + s.label + '</td>' +
          '<td class="asm-res-td-num is-good">' + d.correct + '</td>' +
          '<td class="asm-res-td-num is-bad">' + d.wrong + '</td>' +
          '<td class="asm-res-td-num is-net"><strong>' + Scoring.fmtNet(d.net) + '</strong></td>' +
        '</tr>'
      );
    }).join('');
  }

  function renderClanPlacementMessage(score, clan, classPrefix) {
    classPrefix = classPrefix || 'asm-res';
    return (
      '<p class="' + classPrefix + '-clan-result">' +
        '<span class="' + classPrefix + '-clan-result-score">' + score + ' Toplam Bilenyum Puanı</span> ile ' +
        clan.emoji + ' <strong>' + escapeHtml(clan.name) + '</strong>\'na yerleştirildin!' +
      '</p>'
    );
  }

  function renderCombinedHero(data) {
    var c = data.combined;
    var clan = data.clan;
    return (
      '<section class="asm-res-hero">' +
        '<div class="asm-res-hero-glow"></div>' +
        '<span class="asm-res-hero-emoji">🎉</span>' +
        '<h1 class="asm-res-hero-title">Tebrikler, ' + escapeHtml(data.student.name) + '!</h1>' +
        '<p class="asm-res-hero-sub">Seviye belirleme ve dikkat testi sonuçların birlikte değerlendirildi.</p>' +
        '<div class="asm-res-score-ring">' +
          '<div class="asm-res-score-val">' + c.combined500 + '</div>' +
          '<div class="asm-res-score-lbl">Toplam Bilenyum Puanı <span>/ 500</span></div>' +
        '</div>' +
        renderClanPlacementMessage(c.combined500, clan) +
        '<div class="asm-res-weight-bar">' +
          '<div class="asm-res-weight-seg is-p" style="width:70%"><span>Deneme %70</span></div>' +
          '<div class="asm-res-weight-seg is-a" style="width:30%"><span>Dikkat %30</span></div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderPlacementHero(data, student) {
    return (
      '<section class="asm-res-hero asm-res-hero--partial">' +
        '<span class="asm-res-hero-emoji">📊</span>' +
        '<h1 class="asm-res-hero-title">Seviye Belirleme Sonucun</h1>' +
        '<p class="asm-res-hero-sub">' + escapeHtml(student.name) + ' · ' + escapeHtml(student.gradeLabel) + '</p>' +
        '<div class="asm-res-score-ring">' +
          '<div class="asm-res-score-val">' + data.placementScore + '</div>' +
          '<div class="asm-res-score-lbl">Deneme Puanı <span>/ 500</span></div>' +
        '</div>' +
        '<p class="asm-res-note">Dikkat testini tamamladığında birleşik puanın ve klan yerleşmen hesaplanacak.</p>' +
      '</section>'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderFinishHints(items, title) {
    if (!items || !items.length) return '';
    return (
      '<p class="asm-finish-hints-title">' + escapeHtml(title || 'Bu adımlar ne işe yarar?') + '</p>' +
      '<ul class="asm-finish-hints">' +
        items.map(function (item) {
          return '<li><strong>' + escapeHtml(item.label) + '</strong> — ' + escapeHtml(item.desc) + '</li>';
        }).join('') +
      '</ul>'
    );
  }

  function placementFinishHints(status) {
    status = status || examStatus();
    var items = [
      {
        label: 'Deneme Sınavının Video Çözümlerini İzle',
        desc: 'Ders ders tüm soruların video çözümlerine ulaşabilirsin.'
      },
      {
        label: 'Sonucumu Göster',
        desc: status.allDone
          ? 'Birleşik puanını, klan yerleşimini ve ders bazlı sonuçlarını görüntülersin.'
          : 'Deneme puanını ve her ders için doğru, yanlış ve net sonuçlarını görüntülersin.'
      }
    ];
    if (status.allDone) {
      items.push({
        label: 'Dashboard\'a Hoşgeldin',
        desc: 'Dashboard\'a geçersin; tüm özellikler açılır ve klana yerleşmen tamamlanır.'
      });
    } else if (!status.attention) {
      items.push({
        label: 'Dikkat Testine Geç',
        desc: 'Odaklanma testine geçersin; 3 dakikadan erken geçişte kısa mola verilir veya mola hakkını kullanmadan devam edebilirsin.'
      });
      items.push({
        label: 'Dikkat Testini Daha Sonra Çöz',
        desc: 'Dashboard\'a dönersin; dikkat testini istediğin zaman tamamlayabilirsin.'
      });
    }
    return renderFinishHints(items);
  }

  function attentionFinishHints(status) {
    status = status || examStatus();
    var items = [
      {
        label: 'Dikkat Testi Sonucumu Göster',
        desc: 'Bulduğun C harfleri, süren, yanlış işaretlerin ve dikkat puanını detaylı görüntülersin.'
      }
    ];
    if (status.allDone) {
      items.push({
        label: 'Birleşik Sonucumu Göster',
        desc: 'Seviye belirleme ve dikkat testi birleşik puanını ve klan yerleşimini görürsün.'
      });
      items.push({
        label: 'Dashboard\'a Hoşgeldin',
        desc: 'Dashboard\'a geçersin; tüm özellikler açılır ve klana yerleşmen tamamlanır.'
      });
    } else if (!status.placement) {
      items.push({
        label: 'Seviye Sınavına Geç',
        desc: 'Seviye belirleme sınavına geçersin; 3 dakikadan erken geçişte kısa mola verilir veya mola hakkını kullanmadan devam edebilirsin.'
      });
      items.push({
        label: 'Dashboard · Daha Sonra',
        desc: 'Ana sayfaya dönersin; kaldığın yerden devam edebilirsin.'
      });
    } else {
      items.push({
        label: 'Dashboard · Daha Sonra',
        desc: 'Ana sayfaya dönersin; seviye sınavını tamamladıktan sonra birleşik sonucunu görebilirsin.'
      });
    }
    return renderFinishHints(items);
  }

  function renderPlacementFinishActions(status) {
    status = status || examStatus();
    var html = '';
    html += '<button type="button" class="asm-btn asm-btn-ghost" id="asmPlacementVideosBtn">Deneme Sınavının Video Çözümlerini İzle</button>';
    if (status.allDone) {
      html += '<a href="sinav-sonuclari.html?view=combined" class="asm-btn asm-btn-primary">Sonucumu Göster ' + ICON_ARROW + '</a>';
      html += welcomeDashboardBtn();
      return html;
    }
    html += '<a href="sinav-sonuclari.html?view=placement" class="asm-btn asm-btn-primary">Sonucumu Göster ' + ICON_ARROW + '</a>';
    if (!status.attention) {
      html += '<a href="dikkat-testi.html" class="asm-btn asm-btn-primary asm-btn-attention">Dikkat Testine Geç ' + ICON_ARROW + '</a>';
      html += '<a href="dashboard.html" class="asm-btn asm-btn-ghost">Dikkat Testini Daha Sonra Çöz</a>';
    }
    return html;
  }

  function renderAttentionFinishActions(status) {
    status = status || examStatus();
    var html = '<a href="sinav-sonuclari.html?view=attention" class="asm-btn asm-btn-primary">Dikkat Testi Sonucumu Göster ' + ICON_ARROW + '</a>';
    if (status.allDone) {
      html += '<a href="sinav-sonuclari.html?view=combined" class="asm-btn asm-btn-primary asm-btn-attention">Birleşik Sonucumu Göster ' + ICON_ARROW + '</a>';
      html += welcomeDashboardBtn('asm-btn-welcome');
    } else if (!status.placement) {
      html += '<a href="seviye-belirleme.html" class="asm-btn asm-btn-primary asm-btn-attention">Seviye Sınavına Geç ' + ICON_ARROW + '</a>';
      html += '<a href="dashboard.html" class="asm-btn asm-btn-ghost">Dashboard · Daha Sonra</a>';
    } else {
      html += '<a href="dashboard.html" class="asm-btn asm-btn-ghost">Dashboard · Daha Sonra</a>';
    }
    return html;
  }

  function renderAttentionHero(attention, student) {
    return (
      '<section class="asm-res-hero asm-res-hero--partial">' +
        '<span class="asm-res-hero-emoji">🎯</span>' +
        '<h1 class="asm-res-hero-title">Dikkat Testi Sonucun</h1>' +
        '<p class="asm-res-hero-sub">' + escapeHtml(student.name) + ' · ' + escapeHtml(student.gradeLabel) + '</p>' +
        '<div class="asm-res-score-ring">' +
          '<div class="asm-res-score-val">' + attention.attentionScore + '</div>' +
          '<div class="asm-res-score-lbl">Dikkat Puanı <span>/ 100</span></div>' +
        '</div>' +
        '<p class="asm-res-note">' + attention.found + ' / ' + attention.targets + ' C harfi · Süre: ' + attention.timeLabel + '</p>' +
      '</section>'
    );
  }

  function resolveAttention(attentionRaw) {
    if (!attentionRaw) return null;
    if (attentionRaw.attentionScore != null) return attentionRaw;
    return Scoring.scoreAttention(attentionRaw);
  }

  function renderStudentCard(student) {
    return (
      '<div class="asm-res-student">' +
        '<div class="asm-res-student-ava" aria-hidden="true">' + (student.name.charAt(0) || 'Ö') + '</div>' +
        '<div class="asm-res-student-info">' +
          '<strong>' + escapeHtml(student.name) + '</strong>' +
          '<span>' + escapeHtml(student.gradeLabel) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSubjectTable(placement, title) {
    return (
      '<section class="asm-res-card">' +
        '<h2 class="asm-res-card-title">' + title + '</h2>' +
        renderStudentCard(Scoring.getStudentProfile()) +
        '<div class="asm-res-table-wrap">' +
          '<table class="asm-res-table">' +
            '<thead><tr>' +
              '<th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Net</th>' +
            '</tr></thead>' +
            '<tbody>' + subjectRows(placement) + '</tbody>' +
            '<tfoot><tr>' +
              '<td><strong>Toplam</strong></td>' +
              '<td class="asm-res-td-num is-good"><strong>' + placement.totalCorrect + '</strong></td>' +
              '<td class="asm-res-td-num is-bad"><strong>' + placement.totalWrong + '</strong></td>' +
              '<td class="asm-res-td-num is-net"><strong>' + Scoring.fmtNet(placement.totalNet) + '</strong></td>' +
            '</tr></tfoot>' +
          '</table>' +
        '</div>' +
        '<p class="asm-res-formula">Net = Doğru − (Yanlış ÷ 3) · 3 yanlış 1 doğruyu götürür. Deneme puanı toplam net üzerinden 500\'e ölçeklenir.</p>' +
      '</section>'
    );
  }

  function renderAttentionCard(attention) {
    return (
      '<section class="asm-res-card">' +
        '<h2 class="asm-res-card-title">Dikkat Testi Sonucu</h2>' +
        '<div class="asm-res-att-grid">' +
          '<div class="asm-res-att-stat"><span class="asm-res-att-val">' + attention.found + ' / ' + attention.targets + '</span><span class="asm-res-att-lbl">Bulunan C</span></div>' +
          '<div class="asm-res-att-stat"><span class="asm-res-att-val">' + attention.timeLabel + '</span><span class="asm-res-att-lbl">Süre</span></div>' +
          '<div class="asm-res-att-stat"><span class="asm-res-att-val">' + attention.falseMarks + '</span><span class="asm-res-att-lbl">Yanlış İşaret</span></div>' +
          '<div class="asm-res-att-stat is-highlight"><span class="asm-res-att-val">' + attention.attentionScore + '</span><span class="asm-res-att-lbl">Dikkat Puanı / 100</span></div>' +
        '</div>' +
        '<p class="asm-res-formula">Dikkat puanı; bulunan hedef, süre ve yanlış işaretlere göre hesaplanır (%30 ağırlık).</p>' +
      '</section>'
    );
  }

  function renderCombinedBreakdown(data) {
    return (
      '<section class="asm-res-card">' +
        '<h2 class="asm-res-card-title">Puan Dağılımı</h2>' +
        '<div class="asm-res-split">' +
          '<div class="asm-res-split-item">' +
            '<span class="asm-res-split-label">Seviye Belirleme (%70)</span>' +
            '<span class="asm-res-split-val">' + data.placement.placementScore + ' <small>/ 500</small></span>' +
            '<span class="asm-res-split-contrib">Katkı: ~' + Math.round(data.placement.placementScore * 0.7) + ' puan</span>' +
          '</div>' +
          '<div class="asm-res-split-item">' +
            '<span class="asm-res-split-label">Dikkat Testi (%30)</span>' +
            '<span class="asm-res-split-val">' + data.attention.attentionScore + ' <small>/ 100</small></span>' +
            '<span class="asm-res-split-contrib">Katkı: ~' + Math.round(data.attention.attentionScore * 1.5) + ' puan</span>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function renderActions(view) {
    var status = examStatus();
    var html = '<div class="asm-res-actions">';
    if (view === 'combined') {
      html += welcomeDashboardBtn();
      html += '<button type="button" class="asm-btn asm-btn-ghost" data-asm-toggle-detail>Sınav Detaylarını Göster</button>';
    } else if (view === 'placement') {
      if (status.allDone) {
        html += '<a href="sinav-sonuclari.html?view=combined" class="asm-btn asm-btn-primary">Birleşik Sonucumu Göster ' + ICON_ARROW + '</a>';
        html += welcomeDashboardBtn('asm-btn-welcome');
      } else {
        if (!status.attention) {
          html += '<a href="dikkat-testi.html" class="asm-btn asm-btn-primary">Dikkat Testine Geç ' + ICON_ARROW + '</a>';
        }
        html += '<a href="dashboard.html" class="asm-btn asm-btn-ghost">Dashboard</a>';
      }
    } else if (view === 'attention') {
      if (status.allDone) {
        html += '<a href="sinav-sonuclari.html?view=combined" class="asm-btn asm-btn-primary">Birleşik Sonucumu Göster ' + ICON_ARROW + '</a>';
        html += welcomeDashboardBtn('asm-btn-welcome');
      } else {
        if (!status.placement) {
          html += '<a href="seviye-belirleme.html" class="asm-btn asm-btn-primary">Seviye Sınavına Geç ' + ICON_ARROW + '</a>';
        }
        html += '<a href="dashboard.html" class="asm-btn asm-btn-ghost">Dashboard</a>';
      }
    }
    html += '</div>';
    return html;
  }

  function resolvePlacement(placementRaw) {
    if (!placementRaw || !placementRaw.placement) return null;
    var questions = global.BilenyumPlacementQuestions;
    if (questions && placementRaw.answers && placementRaw.answers.length) {
      return Scoring.scorePlacement(questions, placementRaw.answers);
    }
    return placementRaw.placement;
  }

  function mountResults(root, view) {
    if (!root) return;

    var combined = Scoring.loadCombinedResults();
    var placementRaw = Scoring.loadPlacementResults();
    var attentionRaw = Scoring.loadAttentionResults();
    var student = Scoring.getStudentProfile();

    view = view || 'combined';

    if (view === 'combined' && combined) {
      var combinedPlacement = (placementRaw && resolvePlacement(placementRaw)) || combined.placement;
      root.innerHTML =
        renderCombinedHero(combined) +
        renderCombinedBreakdown(combined) +
        '<div class="asm-res-detail" id="asmResDetail">' +
          renderSubjectTable(combinedPlacement, 'Seviye Belirleme — Ders Bazlı Sonuçlar') +
          renderAttentionCard(combined.attention) +
        '</div>' +
        renderActions('combined');
      bindDetailToggle(root);
      return;
    }

    if (view === 'placement' && placementRaw && placementRaw.placement) {
      var placement = resolvePlacement(placementRaw) || placementRaw.placement;
      var autoVideos = new URLSearchParams(location.search).get('videos') === '1';
      root.innerHTML =
        renderPlacementHero(placement, student) +
        renderSubjectTable(placement, 'Ders Bazlı Sonuçlar') +
        renderPlacementVideoHost() +
        renderActions('placement');
      bindPlacementVideos(root, placementRaw, autoVideos);
      return;
    }

    if (view === 'attention') {
      var attention = resolveAttention(attentionRaw);
      if (attention) {
        root.innerHTML =
          renderAttentionHero(attention, student) +
          renderAttentionCard(attention) +
          renderActions('attention');
        return;
      }
    }

    root.innerHTML =
      '<section class="asm-res-empty">' +
        '<span class="asm-res-hero-emoji">📋</span>' +
        '<h1 class="asm-res-hero-title">Henüz sonuç yok</h1>' +
        '<p class="asm-res-hero-sub">Seviye belirleme sınavını tamamladığında sonuçların burada görünecek.</p>' +
        '<a href="seviye-belirleme.html" class="asm-btn asm-btn-primary">Sınava Başla ' + ICON_ARROW + '</a>' +
      '</section>';
  }

  function bindPlacementVideos(root, placementRaw, autoOpen) {
    var PV = global.BilenyumPlacementVideos;
    var questions = global.BilenyumPlacementQuestions;
    if (!PV || !questions || !questions.length) return null;

    var answers = placementRaw && placementRaw.answers ? placementRaw.answers : [];
    var host = root.querySelector('#asmPlacementVideosHost');
    if (!host) return null;

    var api = PV.mountInline(host, questions, answers);
    if (api && autoOpen) api.openPanel();
    return api;
  }

  function bindPlacementVideosButton(placementRaw) {
    var btn = document.getElementById('asmPlacementVideosBtn');
    var PV = global.BilenyumPlacementVideos;
    var questions = global.BilenyumPlacementQuestions;
    if (!btn || !PV || !questions || !questions.length) return;

    btn.addEventListener('click', function () {
      var answers = placementRaw && placementRaw.answers ? placementRaw.answers : [];
      PV.mountModal(questions, answers);
    });
  }

  function renderPlacementVideoHost() {
    return '<div id="asmPlacementVideosHost"></div>';
  }

  function bindDetailToggle(root) {
    var btn = root.querySelector('[data-asm-toggle-detail]');
    var detail = root.querySelector('#asmResDetail');
    if (!btn || !detail) return;
    detail.hidden = true;
    btn.addEventListener('click', function () {
      var open = detail.hidden;
      detail.hidden = !open;
      btn.textContent = open ? 'Detayları Gizle' : 'Sınav Detaylarını Göster';
    });
  }

  function renderCompactSubjectTable(placement) {
    return (
      '<div class="asm-finish-table-wrap">' +
        '<table class="asm-finish-table">' +
          '<thead><tr>' +
            '<th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Net</th>' +
          '</tr></thead>' +
          '<tbody>' +
            Scoring.SUBJECTS.map(function (s) {
              var d = placement.bySubject[s.code] || { correct: 0, wrong: 0, net: 0 };
              return (
                '<tr>' +
                  '<td>' + s.label + '</td>' +
                  '<td class="is-good">' + d.correct + '</td>' +
                  '<td class="is-bad">' + d.wrong + '</td>' +
                  '<td class="is-net"><strong>' + Scoring.fmtNet(d.net) + '</strong></td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
          '<tfoot><tr>' +
            '<td><strong>Toplam</strong></td>' +
            '<td class="is-good"><strong>' + placement.totalCorrect + '</strong></td>' +
            '<td class="is-bad"><strong>' + placement.totalWrong + '</strong></td>' +
            '<td class="is-net"><strong>' + Scoring.fmtNet(placement.totalNet) + '</strong></td>' +
          '</tr></tfoot>' +
        '</table>' +
        '<p class="asm-finish-formula">Net = Doğru − (Yanlış ÷ 3)</p>' +
      '</div>'
    );
  }

  function showPlacementFinishModal(root, placement) {
    if (!root || !placement) return;

    var overlay = root.querySelector('#asmFinishOverlay');
    var inner = root.querySelector('#asmFinishModalInner');
    if (!overlay || !inner) return;

    var status = examStatus();
    root.classList.add('is-exam-finished');

    var combinedData = status.allDone ? Scoring.loadCombinedResults() : null;
    var scoreVal = placement.placementScore;
    var scoreLbl = 'Deneme Puanı / 500';
    var scoreBlock = '';
    var tableBlock = renderCompactSubjectTable(placement);

    if (status.allDone && combinedData && combinedData.combined && combinedData.clan) {
      scoreVal = combinedData.combined.combined500;
      scoreLbl = 'Toplam Bilenyum Puanı / 500';
      scoreBlock = renderClanPlacementMessage(combinedData.combined.combined500, combinedData.clan, 'asm-finish');
      tableBlock = '';
    }

    inner.innerHTML =
      '<span class="asm-finish-modal-icon" aria-hidden="true">' + (status.allDone ? '🎉' : '📊') + '</span>' +
      '<h2 class="asm-finish-modal-title" id="asmFinishTitle">' +
        (status.allDone ? 'Tebrikler, ' + escapeHtml(Scoring.getStudentProfile().name) + '!' : 'Deneme Sınavın Tamamlandı!') +
      '</h2>' +
      '<p class="asm-finish-modal-sub">' +
        (status.allDone
          ? 'Seviye belirleme ve dikkat testi sonuçların birleştirildi.'
          : 'Seviye belirleme sonucun hesaplandı. Detaylı sonucunu görüntüleyebilir veya dikkat testine geçebilirsin.') +
      '</p>' +
      '<div class="asm-finish-score">' +
        '<span class="asm-finish-score-val">' + scoreVal + '</span>' +
        '<span class="asm-finish-score-lbl">' + scoreLbl + '</span>' +
      '</div>' +
      scoreBlock +
      tableBlock +
      '<div class="asm-finish-actions">' +
        renderPlacementFinishActions(status) +
      '</div>' +
      placementFinishHints(status);

    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');

    bindPlacementVideosButton(Scoring.loadPlacementResults());
  }

  function renderInlineFinish(container, type, data, Assessment) {
    if (!container) return;

    if (type === 'placement' && data.placement) {
      var status = examStatus();
      container.innerHTML =
        '<div class="asm-exam-done">' +
          '<div class="asm-exam-done-icon">✅</div>' +
          '<h2 class="asm-exam-done-title">Seviye Belirleme Tamamlandı!</h2>' +
          '<p class="asm-exam-done-text">Deneme puanın: <strong>' + data.placement.placementScore + ' / 500</strong></p>' +
          (!status.allDone && !status.attention && Assessment && Assessment.renderPendingNotice ? Assessment.renderPendingNotice(type) : '') +
          '<div class="asm-exam-done-actions">' +
            renderPlacementFinishActions(status) +
          '</div>' +
          placementFinishHints(status) +
        '</div>';
      return;
    }
    if (type === 'attention' && data) {
      var status = examStatus();
      var scored = Scoring ? Scoring.scoreAttention(data) : data;
      var combinedData = status.allDone ? Scoring.loadCombinedResults() : null;
      var doneExtra = '';
      if (status.allDone && combinedData && combinedData.combined && combinedData.clan) {
        doneExtra =
          '<div class="asm-exam-done-score">' +
            '<span class="asm-exam-done-score-val">' + combinedData.combined.combined500 + '</span>' +
            '<span class="asm-exam-done-score-lbl">Toplam Bilenyum Puanı / 500</span>' +
          '</div>' +
          renderClanPlacementMessage(combinedData.combined.combined500, combinedData.clan, 'asm-exam-done');
      }
      container.innerHTML =
        '<div class="asm-exam-done">' +
          '<div class="asm-exam-done-icon">🎯</div>' +
          '<h2 class="asm-exam-done-title">Tebrikler, ' + escapeHtml(Scoring.getStudentProfile().name) + '!</h2>' +
          '<p class="asm-exam-done-text">' +
            scored.found + ' / ' + scored.targets + ' C harfi · Süre: ' + scored.timeLabel +
            ' · Dikkat puanı: <strong>' + scored.attentionScore + ' / 100</strong>' +
          '</p>' +
          doneExtra +
          (!status.allDone && !status.placement && Assessment && Assessment.renderPendingNotice ? Assessment.renderPendingNotice(type) : '') +
          '<div class="asm-exam-done-actions">' +
            renderAttentionFinishActions(status) +
          '</div>' +
          attentionFinishHints(status) +
        '</div>';
    }
  }

  global.BilenyumResults = {
    mount: mountResults,
    renderInlineFinish: renderInlineFinish,
    showPlacementFinishModal: showPlacementFinishModal
  };

  if (document.getElementById('asmResultsRoot')) {
    var params = new URLSearchParams(location.search);
    mountResults(document.getElementById('asmResultsRoot'), params.get('view') || 'combined');
  }
})(typeof window !== 'undefined' ? window : this);
