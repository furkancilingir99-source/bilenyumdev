/**
 * Öğretmen program takvimi — GÜNLÜK saat-saat görünüm (tarih seçilebilir/gezinilebilir).
 * TMTeacherCalendar.open(teacherId)
 * Her saat: Dolu (deneme dersi veya sınıf dersi) / Boş (müsait) / Kapalı (müsait değil).
 */
(function (global) {
  'use strict';

  function store() {
    return (global.TMBridge && global.TMBridge.store && global.TMBridge.store()) || global.TMStore;
  }
  function U() { return global.TMUtils; }

  var DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  // Günün saat-saat blokları (çalışma günü).
  var DAY_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  var GRADES = ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];

  function addMin(t, n) {
    var R = global.TMSchedulingRules;
    if (R && R.addMinutes) return R.addMinutes(t, n);
    var p = t.split(':'); var m = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + n;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  function dowOf(dateStr) {
    var p = String(dateStr).split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getDay();
  }
  function addDays(dateStr, n) {
    var p = String(dateStr).split('-');
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    d.setDate(d.getDate() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function isPdrTeacher(t) { return t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr'; }

  // Belirli saatte öğretmen müsait mi (haftalık müsaitlik penceresi 50 dk dersi kapsıyor mu).
  function isAvailable(teacher, dow, slot) {
    var end = addMin(slot, 50);
    return (teacher.availability || []).some(function (a) {
      return a.dayOfWeek === dow && a.isAvailable && a.startTime <= slot && a.endTime >= end;
    });
  }

  // Öğretmenin sınıf (normal) dersleri — haftalık tekrar eden, deterministik demo programı.
  // Deneme dersleriyle çakışmaması için render sırasında deneme dersi olan saatler önceliklidir.
  function classLessonsFor(teacher, S, dateStr) {
    var dow = dowOf(dateStr);
    var res = {};
    if (dow === 0 || dow === 6) return res; // hafta sonu sınıf dersi yok
    var m = String(teacher.id).match(/(\d+)$/);
    var idNum = m ? parseInt(m[1], 10) : 0;
    var pdr = isPdrTeacher(teacher);
    var subject = pdr ? 'Rehberlik' : ((teacher.branchLessonTypeIds || []).map(function (id) {
      var lt = S.getLessonTypeById(id); return lt ? lt.name : id;
    })[0] || 'Ders');
    var candidateHours = ['08:00', '09:00', '10:00', '16:00', '17:00', '18:00'];
    candidateHours.forEach(function (h, i) {
      if (((idNum * 7 + dow * 3 + i * 5) % 3) === 0) {
        var g = GRADES[(idNum + dow + i) % GRADES.length];
        res[h] = { label: pdr ? (g + ' Rehberlik dersi') : (g + ' ' + subject) };
      }
    });
    return res;
  }

  function ensureOverlay() {
    var ov = document.getElementById('tmCalOverlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'tmCalOverlay';
    ov.className = 'tm-cal-overlay';
    ov.innerHTML =
      '<div class="tm-cal-modal" role="dialog" aria-modal="true" aria-label="Öğretmen programı">' +
        '<div class="tm-cal-head">' +
          '<div><h2 class="tm-cal-title" data-cal-title></h2><p class="tm-cal-sub" data-cal-sub></p></div>' +
          '<button type="button" class="tm-drawer-close" data-cal-close aria-label="Kapat">×</button>' +
        '</div>' +
        '<div class="tm-cal-daynav">' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-cal-prev aria-label="Önceki gün">‹</button>' +
          '<input type="date" class="tm-dg-control" data-cal-date>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-cal-next aria-label="Sonraki gün">›</button>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-cal-today>Bugün</button>' +
        '</div>' +
        '<div class="tm-cal-body" data-cal-body></div>' +
        '<div class="tm-cal-legend">' +
          '<span><i class="tm-cal-key is-busy"></i> Dolu (ders var)</span>' +
          '<span><i class="tm-cal-key is-free"></i> Boş (ders yok)</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-cal-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('is-open')) close();
    });
    return ov;
  }

  function close() {
    var ov = document.getElementById('tmCalOverlay');
    if (ov) ov.classList.remove('is-open');
    document.body.classList.remove('tm-drawer-open');
  }

  function statusBadge(kind) {
    if (kind === 'busy') return '<span class="tm-badge tm-badge--orange">Dolu</span>';
    if (kind === 'free') return '<span class="tm-badge tm-badge--green">Boş</span>';
    return '<span class="tm-badge tm-badge--muted">Kapalı</span>';
  }

  function open(teacherId) {
    var S = store();
    var u = U();
    if (!S) return;
    var t = S.getTeacherById(teacherId);
    if (!t) return;
    var ov = ensureOverlay();
    var pdr = isPdrTeacher(t);
    var branch = pdr ? 'PDR / Rehberlik' : (t.branchLessonTypeIds || []).map(function (id) {
      var lt = S.getLessonTypeById(id); return lt ? lt.name : id;
    }).join(', ');
    ov.querySelector('[data-cal-title]').textContent = u.fullName(t.firstName, t.lastName);

    var dateInput = ov.querySelector('[data-cal-date]');
    var current = S.todayKey();

    function renderDay(dateStr) {
      current = dateStr;
      if (dateInput.value !== dateStr) dateInput.value = dateStr;
      var dow = dowOf(dateStr);
      // O güne ait deneme dersleri (iptal hariç), başlangıç saatine göre.
      var trialByHour = {};
      S.getSessionsForTeacher(teacherId).forEach(function (s) {
        if (s.status !== 'cancelled' && s.date === dateStr) trialByHour[s.startTime] = s;
      });
      var classByHour = classLessonsFor(t, S, dateStr);

      var busyCount = 0, freeCount = 0;
      var rows = DAY_HOURS.map(function (h) {
        var label = h + '–' + addMin(h, 60);
        var trial = trialByHour[h];
        var klass = classByHour[h];
        var kind, detay;
        if (trial) {
          busyCount++;
          var lt = S.getLessonTypeById(trial.lessonTypeId);
          var cap = trial.capacity || 20;
          detay = 'Deneme dersi · ' + u.escapeHtml((lt ? lt.name : 'Ders') + ' · ' + (trial.gradeLevel || '')) +
            ' <span class="tm-cal-row-meta">' + (trial.enrolledStudentIds ? trial.enrolledStudentIds.length : 0) + '/' + cap + ' öğrenci</span>';
          kind = 'busy';
        } else if (klass) {
          busyCount++;
          detay = 'Sınıf dersi · ' + u.escapeHtml(klass.label);
          kind = 'busy';
        } else {
          freeCount++;
          detay = '<span class="tm-cal-row-muted">Ders yok</span>';
          kind = 'free';
        }
        return '<tr class="tm-cal-row is-' + kind + '"><td class="tm-cal-row-time">' + label + '</td>' +
          '<td>' + statusBadge(kind) + '</td>' +
          '<td>' + detay + '</td></tr>';
      }).join('');

      ov.querySelector('[data-cal-sub]').textContent =
        branch + ' · ' + DAY_NAMES[dow] + ' ' + u.formatDateKey(dateStr);
      ov.querySelector('[data-cal-body]').innerHTML =
        '<table class="tm-inner-table tm-cal-daytable"><thead><tr><th>Saat</th><th>Durum</th><th>Ders</th></tr></thead><tbody>' +
        rows + '</tbody></table>';
    }

    // Gezinme
    dateInput.onchange = function () { if (dateInput.value) renderDay(dateInput.value); };
    ov.querySelector('[data-cal-prev]').onclick = function () { renderDay(addDays(current, -1)); };
    ov.querySelector('[data-cal-next]').onclick = function () { renderDay(addDays(current, 1)); };
    ov.querySelector('[data-cal-today]').onclick = function () { renderDay(S.todayKey()); };

    renderDay(current);
    ov.classList.add('is-open');
    document.body.classList.add('tm-drawer-open');
  }

  global.TMTeacherCalendar = { open: open, close: close };
})(typeof window !== 'undefined' ? window : this);
