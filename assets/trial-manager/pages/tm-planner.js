/**
 * Ders planlama formu — slot önizleme ve TMStore entegrasyonu
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var Rules = window.TMSchedulingRules;
  var U = window.TMUtils;
  var Confirm = window.TMConfirmDialog;
  var Perms = window.TMPermissions;
  var Form = window.TMFormDialog;
  var SL = window.TMStatusLabels;
  if (!Store || !Rules) return;

  var editId = U.qs('edit');
  var form = document.getElementById('tmPlanForm');
  var typeSelect = document.getElementById('tmPlanType');
  var dateInput = document.getElementById('tmPlanDate');
  var timeSelect = document.getElementById('tmPlanTime');
  var pdrTeacherSelect = document.getElementById('tmPlanPdrTeacher');
  var branchTeacherSelect = document.getElementById('tmPlanBranchTeacher');
  var notesInput = document.getElementById('tmPlanNotes');
  var conflictEl = document.getElementById('tmPlanConflict');
  var saveBtn = document.getElementById('tmPlanSave');
  var slotsEl = document.getElementById('tmPlanSlots');
  var titleEl = document.getElementById('tmPlanTitle');
  var subEl = document.getElementById('tmPlanSub');
  var rosterPanel = document.getElementById('tmPlanRoster');
  var rosterBody = document.getElementById('tmPlanRosterBody');
  var rosterDetailLink = document.getElementById('tmPlanRosterDetailLink');
  var editLocked = false;

  function canSave() {
    if (!Perms) return true;
    return editId ? Perms.can('edit') : Perms.can('create');
  }

  function applyPermissionUi() {
    if (!saveBtn) return;
    saveBtn.setAttribute('data-tm-require', editId ? 'edit' : 'create');
    if (editLocked || !canSave()) {
      saveBtn.disabled = true;
      saveBtn.setAttribute('data-force-disabled', '1');
      if (conflictEl && !editLocked) {
        conflictEl.hidden = false;
        conflictEl.textContent = 'Bu işlem için yetkiniz yok.';
        conflictEl.className = 'tm-alert-row is-danger';
      }
    } else {
      saveBtn.removeAttribute('data-force-disabled');
      if (Perms && Perms.applyPageChrome && form) Perms.applyPageChrome(form);
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
        : 'Matematik veya Fen · Saat başı 50 dakika · PDR + branş öğretmeni · Kapasite 20 · Otomatik meeting linki oluşturulur.';
    }
    refreshTeachers();
    renderSlots();
  }

  function refreshTeachers() {
    var ltId = typeSelect ? typeSelect.value : '';
    var date = dateInput ? dateInput.value : '';
    var time = timeSelect ? timeSelect.value : '';
    var end = Rules.addMinutes(time, 50);
    var pdrTeachers = Store.getTeachers().filter(function (t) {
      return t.isActive && Rules.isTeacherPdr(t.id) &&
        Rules.isPdrTeacherAvailable(t.id, date, time, end) &&
        !Rules.hasPdrTeacherConflict(t.id, date, time, end, editId || undefined);
    });
    var branchTeachers = Store.getTeachers().filter(function (t) {
      return t.isActive && Rules.isBranchTeacherEligibleForLessonType(t.id, ltId) &&
        Rules.isBranchTeacherAvailable(t.id, date, time, end) &&
        !Rules.hasBranchTeacherConflict(t.id, date, time, end, editId || undefined);
    });
    var prevPdr = pdrTeacherSelect ? pdrTeacherSelect.value : '';
    var prevBranch = branchTeacherSelect ? branchTeacherSelect.value : '';
    if (pdrTeacherSelect) {
      pdrTeacherSelect.innerHTML = '<option value="">PDR öğretmeni seçin</option>' + pdrTeachers.map(function (t) {
        return '<option value="' + t.id + '">' + U.fullName(t.firstName, t.lastName) + '</option>';
      }).join('');
      if (prevPdr && pdrTeachers.some(function (t) { return t.id === prevPdr; })) pdrTeacherSelect.value = prevPdr;
    }
    if (branchTeacherSelect) {
      branchTeacherSelect.innerHTML = '<option value="">Branş öğretmeni seçin</option>' + branchTeachers.map(function (t) {
        return '<option value="' + t.id + '">' + U.fullName(t.firstName, t.lastName) + '</option>';
      }).join('');
      if (prevBranch && branchTeachers.some(function (t) { return t.id === prevBranch; })) branchTeacherSelect.value = prevBranch;
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
        var teacher = o.session ? Store.getTeacherById(o.session.branchTeacherId) : null;
        var pdr = o.session ? Store.getTeacherById(o.session.pdrTeacherId) : null;
        var status = o.isFree
          ? ('PDR: ' + o.availablePdrTeachers + ' · Branş: ' + o.availableBranchTeachers)
          : ((pdr ? U.fullName(pdr.firstName, pdr.lastName) : '—') + ' / ' +
            (teacher ? U.fullName(teacher.firstName, teacher.lastName) : '—')) + ' · ' + o.enrolled + '/20';
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
      pdrTeacherId: pdrTeacherSelect ? pdrTeacherSelect.value : '',
      branchTeacherId: branchTeacherSelect ? branchTeacherSelect.value : '',
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
    renderPlanRoster();
    if (typeSelect) {
      typeSelect.value = s.lessonTypeId;
    }
    if (dateInput) dateInput.value = s.date;
    if (timeSelect) timeSelect.value = s.startTime;
    refreshTeachers();
    if (pdrTeacherSelect) pdrTeacherSelect.value = s.pdrTeacherId || '';
    if (branchTeacherSelect) branchTeacherSelect.value = s.branchTeacherId || '';
    if (notesInput) notesInput.value = s.notes || '';
    renderPlanRoster();
  }

  function showAddStudentToPlan(sessionId) {
    if (!Form) return;
    if (Perms && !Perms.guard('edit')) return;
    var eligible = Store.getEligibleStudentsForSession(sessionId);
    if (!eligible.length) {
      U.notifyError('Eklenebilecek uygun öğrenci yok (kapasite, branş veya daha önce deneme almış olabilir).');
      return;
    }
    Form.open({
      title: 'Derse öğrenci ekle',
      description: 'Kapasite ve ücretsiz deneme kurallarına uygun öğrenciler listelenir.',
      fields: [{
        type: 'select',
        name: 'studentId',
        label: 'Öğrenci',
        options: eligible.map(function (st) {
          return {
            value: st.id,
            label: U.fullName(st.firstName, st.lastName) + ' · ' + st.grade + ' · ' + st.level
          };
        })
      }],
      onSubmit: function (data) {
        var result = Store.addStudentToSession(sessionId, data.studentId);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Öğrenci derse eklendi.');
          if (window.TMOnSessionChange) window.TMOnSessionChange();
          renderPlanRoster();
          renderSlots();
        }
      }
    });
  }

  function bindPlanRosterActions(sessionId) {
    if (!rosterBody) return;
    rosterBody.querySelector('[data-add-participant]') && rosterBody.querySelector('[data-add-participant]').addEventListener('click', function () {
      showAddStudentToPlan(sessionId);
    });
    rosterBody.querySelectorAll('[data-remove-res]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (Perms && !Perms.guard('cancel')) return;
        var resId = btn.getAttribute('data-remove-res');
        if (!Confirm) return;
        Confirm.open({
          title: 'Öğrenciyi dersten çıkar',
          warning: 'Rezervasyon iptal edilecek ve kapasite açılacak.',
          requireReason: true,
          danger: true,
          confirmLabel: 'Çıkar',
          onConfirm: function (reason) {
            var result = Store.removeStudentFromSession(sessionId, resId, reason);
            if (!result.ok) U.notifyError(result.error);
            else {
              U.notifySuccess('Öğrenci dersten çıkarıldı.');
              if (window.TMOnSessionChange) window.TMOnSessionChange();
              renderPlanRoster();
              renderSlots();
            }
          }
        });
      });
    });
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(rosterBody);
  }

  function renderPlanRoster() {
    if (!rosterPanel || !rosterBody || !editId) {
      if (rosterPanel) rosterPanel.hidden = true;
      return;
    }
    var s = Store.getSessionById(editId);
    if (!s || s.status === 'cancelled' || s.status === 'completed' || editLocked) {
      rosterPanel.hidden = true;
      return;
    }
    rosterPanel.hidden = false;
    if (rosterDetailLink) {
      rosterDetailLink.href = 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' +
        encodeURIComponent(editId) + '&tab=2';
    }
    var reservations = Store.getReservations().filter(function (r) {
      return r.sessionId === editId && r.status !== 'cancelled';
    });
    var remaining = Rules.getSessionRemainingCapacity(editId);
    var rows = reservations.map(function (r) {
      var st = Store.getStudentById(r.studentId);
      var pa = st && st.parentIds[0] ? Store.getParentById(st.parentIds[0]) : null;
      return '<tr><td>' + U.escapeHtml(st ? U.fullName(st.firstName, st.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(st ? st.grade : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? U.fullName(pa.firstName, pa.lastName) : '—') + '</td>' +
        '<td>' + (SL ? SL.reservationBadge(r.status) : U.escapeHtml(r.status)) + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--danger" data-remove-res="' + r.id + '" data-tm-require="cancel">Çıkar</button></td></tr>';
    }).join('');
    rosterBody.innerHTML =
      '<p class="tm-detail-cell-label" style="margin-bottom:8px">Boş kapasite: ' + remaining + ' / 20 · Kayıtlı: ' + reservations.length + '</p>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-participant data-tm-require="edit" style="margin-bottom:12px">Öğrenci ekle</button>' +
      (reservations.length
        ? '<table class="tm-inner-table"><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Durum</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
        : '<p class="tm-empty">Henüz katılımcı yok. Öğrenci ekleyerek başlayın.</p>');
    bindPlanRosterActions(editId);
  }

  function doSave() {
    if (Perms && !Perms.guard(editId ? 'edit' : 'create')) return;
    if (editLocked) return;
    var draft = getDraft();
    if (editId) {
      var s = Store.getSessionById(editId);
      if (s && s.lessonTypeId !== draft.lessonTypeId) {
        var resLt = Store.changeSessionLessonType(editId, draft.lessonTypeId, 'Planlama formundan güncellendi');
        if (!resLt.ok) { U.notifyError(resLt.error); return; }
        s = Store.getSessionById(editId);
      }
      if (s && (s.date !== draft.date || s.startTime !== draft.startTime)) {
        var res = Store.rescheduleSession(editId, draft.date, draft.startTime, 'Planlama formundan güncellendi');
        if (!res.ok) { U.notifyError(res.error); return; }
      }
      if (s && s.pdrTeacherId !== draft.pdrTeacherId) {
        var resPdr = Store.changeSessionPdrTeacher(editId, draft.pdrTeacherId, 'Planlama formundan güncellendi');
        if (!resPdr.ok) { U.notifyError(resPdr.error); return; }
      }
      if (s && s.branchTeacherId !== draft.branchTeacherId) {
        var res2 = Store.changeSessionBranchTeacher(editId, draft.branchTeacherId, 'Planlama formundan güncellendi');
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
  if (pdrTeacherSelect) pdrTeacherSelect.addEventListener('change', checkConflict);
  if (branchTeacherSelect) branchTeacherSelect.addEventListener('change', checkConflict);
  if (notesInput) notesInput.addEventListener('input', U.debounce(checkConflict, 200));

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      if (Perms && !Perms.guard(editId ? 'edit' : 'create')) return;
      if (editLocked) return;
      var draft = getDraft();
      var issues = Rules.validateSessionDraft(draft);
      if (issues.length) { U.notifyError(issues.join(' · ')); return; }
      var lt = Store.getLessonTypeById(draft.lessonTypeId);
      var pdr = Store.getTeacherById(draft.pdrTeacherId);
      var branch = Store.getTeacherById(draft.branchTeacherId);
      var label = (lt ? lt.name : 'Ders') + ' · ' + U.formatDateKey(draft.date) + ' ' + draft.startTime;
      var teacherLabel = '';
      if (pdr) teacherLabel += ' · PDR: ' + U.fullName(pdr.firstName, pdr.lastName);
      if (branch) teacherLabel += ' · Branş: ' + U.fullName(branch.firstName, branch.lastName);
      if (Confirm) {
        Confirm.open({
          title: editId ? 'Dersi güncelle' : 'Dersi planla',
          current: editId ? 'Mevcut kayıt düzenleniyor' : '—',
          next: label + teacherLabel,
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
  renderPlanRoster();
  window.TMOnSessionChange = function () {
    renderPlanRoster();
    renderSlots();
  };
})();
