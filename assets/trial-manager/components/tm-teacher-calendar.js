/**
 * Öğretmen program takvimi — haftalık modal görünüm.
 * TMTeacherCalendar.open(teacherId)
 */
(function (global) {
  'use strict';

  function store() {
    return (global.TMBridge && global.TMBridge.store && global.TMBridge.store()) || global.TMStore;
  }
  function U() { return global.TMUtils; }

  var DAYS = [
    { dow: 1, label: 'Pzt' }, { dow: 2, label: 'Sal' }, { dow: 3, label: 'Çar' },
    { dow: 4, label: 'Per' }, { dow: 5, label: 'Cum' }, { dow: 6, label: 'Cmt' }
  ];

  function slots() {
    var R = global.TMSchedulingRules;
    return (R && R.HOURLY_SLOTS) || ['11:00', '12:00', '13:00', '14:00'];
  }
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

  function isAvailable(teacher, dow, slot) {
    var end = addMin(slot, 50);
    return (teacher.availability || []).some(function (a) {
      return a.dayOfWeek === dow && a.isAvailable && a.startTime <= slot && a.endTime >= end;
    });
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
        '<div class="tm-cal-body" data-cal-body></div>' +
        '<div class="tm-cal-legend">' +
          '<span><i class="tm-cal-key is-free"></i> Müsait</span>' +
          '<span><i class="tm-cal-key is-busy"></i> Dolu (ders atanmış)</span>' +
          '<span><i class="tm-cal-key is-off"></i> Kapalı</span>' +
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

  function open(teacherId) {
    var S = store();
    var u = U();
    if (!S) return;
    var t = S.getTeacherById(teacherId);
    if (!t) return;
    var today = S.todayKey();
    var sessions = S.getSessionsForTeacher(teacherId).filter(function (s) {
      return s.status !== 'cancelled' && s.date >= today;
    });
    // hücre başına: en yakın oturum
    var byCell = {};
    sessions.forEach(function (s) {
      var key = dowOf(s.date) + '|' + s.startTime;
      if (!byCell[key] || s.date < byCell[key].nearest.date) {
        byCell[key] = byCell[key] || { list: [] };
        byCell[key].nearest = s;
      }
      byCell[key].list = byCell[key].list || [];
      byCell[key].list.push(s);
    });

    var ov = ensureOverlay();
    var isPdr = t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr';
    ov.querySelector('[data-cal-title]').textContent = u.fullName(t.firstName, t.lastName);
    var branch = isPdr ? 'PDR / Rehberlik' : (t.branchLessonTypeIds || []).map(function (id) {
      var lt = S.getLessonTypeById(id); return lt ? lt.name : id;
    }).join(', ');
    ov.querySelector('[data-cal-sub]').textContent = branch + ' · ' + sessions.length + ' yaklaşan ders';

    var sl = slots();
    var head = '<div class="tm-cal-grid" style="grid-template-columns:64px repeat(' + DAYS.length + ',1fr)">' +
      '<div class="tm-cal-corner"></div>' +
      DAYS.map(function (d) { return '<div class="tm-cal-dayhead">' + d.label + '</div>'; }).join('');
    var bodyCells = sl.map(function (slot) {
      var rowHead = '<div class="tm-cal-timehead">' + slot + '</div>';
      var cells = DAYS.map(function (d) {
        var key = d.dow + '|' + slot;
        var booked = byCell[key];
        if (booked) {
          var s = booked.nearest;
          var lt = S.getLessonTypeById(s.lessonTypeId);
          var more = booked.list.length > 1 ? ' +' + (booked.list.length - 1) : '';
          return '<button type="button" class="tm-cal-cell is-busy" data-cal-session="' + s.id + '">' +
            '<span class="tm-cal-cell-lt">' + u.escapeHtml(lt ? lt.name : 'Ders') + more + '</span>' +
            '<span class="tm-cal-cell-meta">' + (s.enrolledStudentIds ? s.enrolledStudentIds.length : 0) + '/20 · ' + u.formatDateKey(s.date) + '</span>' +
          '</button>';
        }
        if (isAvailable(t, d.dow, slot)) {
          return '<div class="tm-cal-cell is-free"><span class="tm-cal-cell-lt">Müsait</span></div>';
        }
        return '<div class="tm-cal-cell is-off">—</div>';
      }).join('');
      return rowHead + cells;
    }).join('');
    ov.querySelector('[data-cal-body]').innerHTML = head + bodyCells + '</div>';

    ov.querySelectorAll('[data-cal-session]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sid = btn.getAttribute('data-cal-session');
        close();
        if (global.TMSessionDetail && global.TMSessionDetail.open) global.TMSessionDetail.open(sid);
        else window.location.href = 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(sid);
      });
    });

    ov.classList.add('is-open');
    document.body.classList.add('tm-drawer-open');
  }

  global.TMTeacherCalendar = { open: open, close: close };
})(typeof window !== 'undefined' ? window : this);
