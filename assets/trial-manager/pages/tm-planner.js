/**
 * Ders planlama formu — slot önizleme ve TMStore entegrasyonu
 */
(function () {
  'use strict';

  var Store = window.TMStore;
  var Rules = window.TMSchedulingRules;
  var U = window.TMUtils;
  var Confirm = window.TMConfirmDialog;
  var Perms = window.TMPermissions;
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
  var slotsEl = document.getElementById('tmPlanSlots');
  var titleEl = document.getElementById('tmPlanTitle');
  var subEl = document.getElementById('tmPlanSub');
  var editLocked = false;

  function canSave() {
    if (!Perms) return true;
    return editId ? Perms.can('edit') : Perms.can('create');
  }

  function applyPermissionUi() {
    if (!saveBtn) return;
    if (!canSave()) {
      saveBtn.disabled = true;
      if (conflictEl) {
        conflictEl.hidden = false;
        conflictEl.textContent = 'Bu işlem için yetkiniz yok.';
        conflictEl.className = 'tm-alert-row is-danger';
      }
    }
  }

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
    if (titleEl) {
      titleEl.textContent = editId ? 'Dersi Düzenle' : 'Yeni Online Deneme Dersi Planla';
    }
    if (subEl) {
      subEl.textContent = editId
        ? 'Tarih, saat veya öğretmen değişiklikleri mevcut rezervasyonları etkileyebilir.'
        : 'Matematik veya Fen · Saat başı 50 dakika · Kapasite 20 · Otomatik meeting linki oluşturulur.';
    }
    refreshTeachers();
    renderSlots();
  }

  function refreshTeachers() {
    if (!teacherSelect) return;
    var ltId = typeSelect ? typeSelect.value : '';
    var date = dateInput ? dateInput.value : '';
    var time = timeSelect ? timeSelect.value : '';
    var end = Rules.addMinutes(time, 50);
    var teachers = Store.getTeachers().filter(function (t) {
      return t.isActive &&
        Rules.isTeacherEligibleForLessonType(t.id, ltId) &&
        Rules.isTeacherAvailable(t.id, date, time, end) &&
        !Rules.hasTeacherConflict(t.id, date, time, end, editId || undefined);
    });
    var prev = teacherSelect.value;
    teacherSelect.innerHTML = '<option value="">Öğretmen seçin</option>' + teachers.map(function (t) {
      return '<option value="' + t.id + '">' + U.fullName(t.firstName, t.lastName) + '</option>';
    }).join('');
    if (prev && teachers.some(function (t) { return t.id === prev; })) {
      teacherSelect.value = prev;
    }
    checkConflict();
    renderSlots();
  }

  function renderSlots() {
    if (!slotsEl) return;
    var date = dateInput ? dateInput.value : '';
    var ltId = typeSelect ? typeSelect.value : '';
    if (!date || !ltId) {
      slotsEl.innerHTML = '<p class="tm-empty">Tarih ve ders türü seçin.</p>';
      return;
    }
    var overview = Rules.getSlotsOverview(date, ltId, editId || undefined);
    var lt = Store.getLessonTypeById(ltId);
    slotsEl.innerHTML = '<p class="tm-plan-slots-head">' + U.formatDateKey(date) + ' · ' + (lt ? lt.name : '') + ' slot durumu</p>' +
      '<div class="tm-plan-slots-grid">' + overview.map(function (o) {
        var selected = timeSelect && timeSelect.value === o.slot;
        var cls = 'tm-plan-slot';
        if (selected) cls += ' is-selected';
        if (!o.isFree) cls += ' is-busy';
        if (o.availableTeachers === 0 && o.isFree) cls += ' is-warn';
        var teacher = o.session ? Store.getTeacherById(o.session.teacherId) : null;
        var status = o.isFree
          ? (o.availableTeachers ? o.availableTeachers + ' müsait öğretmen' : 'Öğretmen yok')
          : (teacher ? U.fullName(teacher.firstName, teacher.lastName) : 'Dolu') + ' · ' + o.enrolled + '/20';
        return '<button type="button" class="' + cls + '" data-slot="' + o.slot + '">' +
          '<span class="tm-plan-slot-time">' + o.slot + '</span>' +
          '<span class="tm-plan-slot-meta">' + U.escapeHtml(status) + '</span></button>';
      }).join('') + '</div>';
    slotsEl.querySelectorAll('[data-slot]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('is-busy')) return;
        if (timeSelect) {
          timeSelect.value = btn.getAttribute('data-slot');
          refreshTeachers();
        }
      });
    });
  }

  function checkConflict() {
    if (!conflictEl || !saveBtn) return;
    if (editLocked || !canSave()) {
      saveBtn.disabled = true;
      return;
    }
    var draft = getDraft();
    var issues = Rules.validateSessionDraft(draft);
    if (issues.length) {
      conflictEl.hidden = false;
      conflictEl.textContent = issues.join(' · ');
      conflictEl.className = 'tm-alert-row is-danger';
      saveBtn.disabled = true;
    } else {
      conflictEl.hidden = false;
      conflictEl.textContent = 'Çakışma yok — kaydedilebilir.';
      conflictEl.className = 'tm-alert-row is-ok';
      saveBtn.disabled = false;
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
    if (s.status === 'cancelled' || s.status === 'completed') {
      editLocked = true;
      if (conflictEl) {
        conflictEl.hidden = false;
        conflictEl.textContent = 'İptal edilmiş veya tamamlanmış dersler planlayıcıdan düzenlenemez.';
        conflictEl.className = 'tm-alert-row is-danger';
      }
      if (form) {
        form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
          if (el.id !== 'tmPlanSave') el.disabled = true;
        });
      }
      if (saveBtn) saveBtn.disabled = true;
    }
    if (typeSelect) {
      typeSelect.value = s.lessonTypeId;
      typeSelect.disabled = true;
      typeSelect.title = 'Düzenlemede ders türü değiştirilemez.';
    }
    if (dateInput) dateInput.value = s.date;
    if (timeSelect) timeSelect.value = s.startTime;
    refreshTeachers();
    if (teacherSelect) teacherSelect.value = s.teacherId;
    if (notesInput) notesInput.value = s.notes || '';
  }

  function doSave() {
    if (Perms && !Perms.guard(editId ? 'edit' : 'create')) return;
    if (editLocked) return;
    var draft = getDraft();
    if (editId) {
      var s = Store.getSessionById(editId);
      if (s && (s.date !== draft.date || s.startTime !== draft.startTime)) {
        var res = Store.rescheduleSession(editId, draft.date, draft.startTime, 'Planlama formundan güncellendi');
        if (!res.ok) { U.notifyError(res.error); return; }
      }
      if (s && s.teacherId !== draft.teacherId) {
        var res2 = Store.changeSessionTeacher(editId, draft.teacherId, 'Planlama formundan güncellendi');
        if (!res2.ok) { U.notifyError(res2.error); return; }
      }
      if (s && (s.notes || '') !== (draft.notes || '')) {
        Store.updateSessionNotes(editId, draft.notes);
      }
      window.location.href = 'deneme-dersi-yoneticisi-planlanmis-dersler.html';
    } else {
      var result = Store.createSession(Object.assign({}, draft, { status: 'scheduled' }));
      if (!result.ok) { U.notifyError(result.error); return; }
      window.location.href = 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' +
        encodeURIComponent(result.session.id) + '&tab=2';
    }
  }

  if (typeSelect) typeSelect.addEventListener('change', refreshTeachers);
  if (dateInput) dateInput.addEventListener('change', refreshTeachers);
  if (timeSelect) timeSelect.addEventListener('change', refreshTeachers);
  if (teacherSelect) teacherSelect.addEventListener('change', checkConflict);
  if (notesInput) notesInput.addEventListener('input', U.debounce(checkConflict, 200));

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard(editId ? 'edit' : 'create')) return;
      if (editLocked) return;
      var draft = getDraft();
      var issues = Rules.validateSessionDraft(draft);
      if (issues.length) { U.notifyError(issues.join(' · ')); return; }
      var lt = Store.getLessonTypeById(draft.lessonTypeId);
      var teacher = Store.getTeacherById(draft.teacherId);
      var label = (lt ? lt.name : 'Ders') + ' · ' + U.formatDateKey(draft.date) + ' ' + draft.startTime;
      if (Confirm) {
        Confirm.open({
          title: editId ? 'Dersi güncelle' : 'Dersi planla',
          current: editId ? 'Mevcut kayıt düzenleniyor' : '—',
          next: label + (teacher ? ' · ' + U.fullName(teacher.firstName, teacher.lastName) : ''),
          warning: editId ? 'Değişiklikler rezervasyonlara yansır.' : 'Online meeting linki otomatik oluşturulacak.',
          requireReason: !!editId,
          danger: false,
          confirmLabel: editId ? 'Güncelle' : 'Planla',
          onConfirm: function () { doSave(); }
        });
      } else {
        doSave();
      }
    });
  }

  initSelects();
  loadEdit();
  applyPermissionUi();
  checkConflict();
})();
