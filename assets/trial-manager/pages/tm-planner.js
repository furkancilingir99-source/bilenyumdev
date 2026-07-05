/**
 * Ders planlama formu — TMStore entegrasyonu
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var Rules = window.TMSchedulingRules;
  var U = window.TMUtils;
  if (!Store || !Rules) return;

  var editId = U.qs('edit');
  var form = document.getElementById('tmPlanForm');
  var typeSelect = document.getElementById('tmPlanType');
  var dateInput = document.getElementById('tmPlanDate');
  var timeSelect = document.getElementById('tmPlanTime');
  var teacherSelect = document.getElementById('tmPlanTeacher');
  var notesInput = document.getElementById('tmPlanNotes');
  var conflictEl = document.getElementById('tmPlanConflict');
  var saveBtn = document.getElementById('tmPlanSave');

  function initSelects() {
    if (typeSelect) {
      typeSelect.innerHTML = Store.getLessonTypes().map(function (lt) {
        return '<option value="' + lt.id + '">' + lt.name + '</option>';
      }).join('');
    }
    if (timeSelect) {
      timeSelect.innerHTML = Rules.HOURLY_SLOTS.map(function (t) {
        return '<option value="' + t + '">' + t + ' – ' + Rules.addMinutes(t, 50) + '</option>';
      }).join('');
    }
    if (dateInput && !dateInput.value) {
      dateInput.value = Store.todayKey();
    }
    refreshTeachers();
  }

  function refreshTeachers() {
    if (!teacherSelect) return;
    var ltId = typeSelect ? typeSelect.value : '';
    var date = dateInput ? dateInput.value : '';
    var time = timeSelect ? timeSelect.value : '';
    var end = Rules.addMinutes(time, 50);
    var teachers = Store.getTeachers().filter(function (t) {
      return Rules.isTeacherEligibleForLessonType(t.id, ltId) &&
        Rules.isTeacherAvailable(t.id, date, time, end) &&
        !Rules.hasTeacherConflict(t.id, date, time, end, editId || undefined);
    });
    teacherSelect.innerHTML = '<option value="">Öğretmen seçin</option>' + teachers.map(function (t) {
      return '<option value="' + t.id + '">' + U.fullName(t.firstName, t.lastName) + '</option>';
    }).join('');
    checkConflict();
  }

  function checkConflict() {
    if (!conflictEl) return;
    var draft = getDraft();
    var issues = Rules.validateSessionDraft(draft);
    if (issues.length) {
      conflictEl.hidden = false;
      conflictEl.textContent = issues.join(' · ');
      conflictEl.className = 'tm-alert-row is-danger';
    } else {
      conflictEl.hidden = false;
      conflictEl.textContent = 'Çakışma yok — kaydedilebilir.';
      conflictEl.className = 'tm-alert-row';
      conflictEl.style.background = '#dcfce7';
      conflictEl.style.color = '#15803d';
    }
  }

  function getDraft() {
    var time = timeSelect ? timeSelect.value : '11:00';
    return {
      id: editId || undefined,
      lessonTypeId: typeSelect ? typeSelect.value : '',
      teacherId: teacherSelect ? teacherSelect.value : '',
      date: dateInput ? dateInput.value : '',
      startTime: time,
      endTime: Rules.addMinutes(time, 50),
      notes: notesInput ? notesInput.value : ''
    };
  }

  function loadEdit() {
    if (!editId) return;
    var s = Store.getSessionById(editId);
    if (!s) return;
    if (typeSelect) typeSelect.value = s.lessonTypeId;
    if (dateInput) dateInput.value = s.date;
    if (timeSelect) timeSelect.value = s.startTime;
    refreshTeachers();
    if (teacherSelect) teacherSelect.value = s.teacherId;
    if (notesInput) notesInput.value = s.notes || '';
  }

  if (typeSelect) typeSelect.addEventListener('change', refreshTeachers);
  if (dateInput) dateInput.addEventListener('change', refreshTeachers);
  if (timeSelect) timeSelect.addEventListener('change', refreshTeachers);
  if (teacherSelect) teacherSelect.addEventListener('change', checkConflict);

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var draft = getDraft();
      if (editId) {
        var s = Store.getSessionById(editId);
        if (s && (s.date !== draft.date || s.startTime !== draft.startTime)) {
          var res = Store.rescheduleSession(editId, draft.date, draft.startTime, 'Planlama formundan güncellendi');
          if (!res.ok) { alert(res.error); return; }
        }
        if (s && s.teacherId !== draft.teacherId) {
          var res2 = Store.changeSessionTeacher(editId, draft.teacherId, 'Planlama formundan güncellendi');
          if (!res2.ok) { alert(res2.error); return; }
        }
        alert('Ders güncellendi.');
        window.location.href = 'deneme-dersi-yoneticisi-planlanmis-dersler.html';
      } else {
        var result = Store.createSession(Object.assign({}, draft, { status: 'scheduled' }));
        if (!result.ok) { alert(result.error); return; }
        alert('Ders planlandı. Meeting ID: ' + result.meeting.meetingId);
        window.location.href = 'deneme-dersi-yoneticisi-planlanmis-dersler.html';
      }
    });
  }

  initSelects();
  loadEdit();
  checkConflict();
})();
