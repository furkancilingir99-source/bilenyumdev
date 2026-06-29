/* ---------------------------------------------------------------------------
 * Bilenyum assessment-scoring.js — Net, puan ve klan hesaplama
 * Net = Doğru − (Yanlış / 3) — 3 yanlış 1 doğruyu götürür
 * Birleşik puan: %70 seviye belirleme + %30 dikkat testi (500 üzerinden)
 * ------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  var P = 'bilenyum.';

  var SUBJECTS = [
    { code: 'mat', label: 'Matematik' },
    { code: 'trk', label: 'Türkçe' },
    { code: 'fen', label: 'Fen Bilimleri' },
    { code: 'ing', label: 'İngilizce' },
    { code: 'sos', label: 'Sosyal Bilgiler' },
    { code: 'din', label: 'Din Kültürü' }
  ];

  var CLANS = [
    { min: 400, name: 'Alfa Klanı', emoji: '⚡' },
    { min: 320, name: 'Beta Klanı', emoji: '🔷' },
    { min: 240, name: 'Gama Klanı', emoji: '🌿' },
    { min: 0,   name: 'Delta Klanı', emoji: '🔸' }
  ];

  function lsGet(k) { try { return localStorage.getItem(P + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }

  function calcNet(correct, wrong) {
    return Math.max(0, correct - (wrong / 3));
  }

  function fmtNet(n) {
    var v = Math.round(n * 100) / 100;
    return v % 1 === 0 ? String(v) : v.toFixed(2);
  }

  function getStudentProfile() {
    var name = lsGet('studentName') || 'Mira Yılmaz';
    var grade = lsGet('studentGrade') || '8';
    return {
      name: name,
      grade: grade,
      gradeLabel: grade + '. Sınıf'
    };
  }

  function scorePlacement(questions, answers) {
    var bySubject = {};
    SUBJECTS.forEach(function (s) {
      bySubject[s.code] = { correct: 0, wrong: 0, blank: 0, net: 0, total: 0 };
    });

    var totalCorrect = 0;
    var totalWrong = 0;
    var totalBlank = 0;

    questions.forEach(function (q, i) {
      var code = q.subjectCode || 'mat';
      if (!bySubject[code]) {
        bySubject[code] = { correct: 0, wrong: 0, blank: 0, net: 0, total: 0 };
      }
      bySubject[code].total++;
      var ans = answers[i];
      if (ans == null || ans === '') {
        bySubject[code].blank++;
        totalBlank++;
      } else if (ans === q.correct) {
        bySubject[code].correct++;
        totalCorrect++;
      } else {
        bySubject[code].wrong++;
        totalWrong++;
      }
    });

    SUBJECTS.forEach(function (s) {
      var b = bySubject[s.code];
      b.net = calcNet(b.correct, b.wrong);
    });

    /* Toplam net = ders netlerinin toplamı (her ders ayrı hesaplanır) */
    var totalNet = SUBJECTS.reduce(function (sum, s) {
      return sum + bySubject[s.code].net;
    }, 0);
    var maxNet = questions.length;
    var placementScore = maxNet > 0 ? Math.round((totalNet / maxNet) * 500) : 0;
    placementScore = Math.min(500, Math.max(0, placementScore));

    return {
      bySubject: bySubject,
      totalCorrect: totalCorrect,
      totalWrong: totalWrong,
      totalBlank: totalBlank,
      totalNet: totalNet,
      maxNet: maxNet,
      placementScore: placementScore
    };
  }

  function scoreAttention(data) {
    var found = data.found || 0;
    var targets = data.targets || 3;
    var falseMarks = data.falseMarks || 0;
    var timeSec = data.timeSec || 0;

    var accuracy = targets > 0 ? found / targets : 0;
    var base = accuracy * 70;
    var timeBonus = 0;
    if (found === targets) {
      if (timeSec <= 45) timeBonus = 30;
      else if (timeSec <= 90) timeBonus = 20;
      else if (timeSec <= 150) timeBonus = 10;
    }
    var penalty = falseMarks * 8;
    var attentionScore = Math.round(Math.min(100, Math.max(0, base + timeBonus - penalty)));

    return {
      found: found,
      targets: targets,
      falseMarks: falseMarks,
      timeSec: timeSec,
      timeLabel: formatTime(timeSec),
      accuracy: Math.round(accuracy * 100),
      attentionScore: attentionScore
    };
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function combinedScore(placementScore, attentionScore) {
    var p = (placementScore / 500) * 100;
    var a = attentionScore;
    var weighted = p * 0.7 + a * 0.3;
    var combined500 = Math.round((weighted / 100) * 500);
    return {
      combined500: combined500,
      combinedPercent: Math.round(weighted),
      placementWeight: 70,
      attentionWeight: 30,
      placementContribution: Math.round(p * 0.7 * 5) / 10,
      attentionContribution: Math.round(a * 0.3 * 5) / 10
    };
  }

  function assignClan(combined500) {
    for (var i = 0; i < CLANS.length; i++) {
      if (combined500 >= CLANS[i].min) return CLANS[i];
    }
    return CLANS[CLANS.length - 1];
  }

  function buildFullResults(questions, answers, attentionData) {
    var placement = scorePlacement(questions, answers);
    var attention = scoreAttention(attentionData || { found: 0, targets: 3, falseMarks: 0, timeSec: 0 });
    var combined = combinedScore(placement.placementScore, attention.attentionScore);
    var clan = assignClan(combined.combined500);
    var student = getStudentProfile();

    var result = {
      student: student,
      placement: placement,
      attention: attention,
      combined: combined,
      clan: clan,
      completedAt: new Date().toISOString()
    };

    lsSet('placementResults', JSON.stringify({ placement: placement, answers: answers, completedAt: result.completedAt }));
    lsSet('attentionResults', JSON.stringify(attention));
    lsSet('combinedResults', JSON.stringify(result));
    lsSet('assignedClan', clan.name);
    lsSet('assignedClanEmoji', clan.emoji);

    return result;
  }

  function loadCombinedResults() {
    var raw = lsGet('combinedResults');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  }

  function loadPlacementResults() {
    var raw = lsGet('placementResults');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  }

  function loadAttentionResults() {
    var raw = lsGet('attentionResults');
    if (raw) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return null;
  }

  global.BilenyumScoring = {
    SUBJECTS: SUBJECTS,
    calcNet: calcNet,
    fmtNet: fmtNet,
    getStudentProfile: getStudentProfile,
    scorePlacement: scorePlacement,
    scoreAttention: scoreAttention,
    combinedScore: combinedScore,
    assignClan: assignClan,
    buildFullResults: buildFullResults,
    loadCombinedResults: loadCombinedResults,
    loadPlacementResults: loadPlacementResults,
    loadAttentionResults: loadAttentionResults,
    formatTime: formatTime
  };
})(typeof window !== 'undefined' ? window : this);
