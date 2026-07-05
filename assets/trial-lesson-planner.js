(function () {
  'use strict';

  var Planner = window.TrialLessonPlannerMock;
  var ResMock = window.TrialLessonManagerMock;
  if (!Planner || !ResMock) return;

  var listEl = document.getElementById('tmPlannerList');
  var editorEl = document.getElementById('tmPlannerEditor');
  var newBtn = document.getElementById('tmPlannerNewBtn');
  var toastEl = document.getElementById('tmPlannerToast');

  var selectedId = null;
  var draft = null;
  var slotEditor = { dayOffset: 0, slot: null };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function emptyDraft() {
    return {
      id: null,
      subject: '',
      grade: '',
      teacherId: '',
      slotLabel: '',
      slotDateKey: '',
      slotTime: '',
      studentIds: []
    };
  }

  function draftFromLesson(lesson) {
    return {
      id: lesson.id,
      subject: lesson.subject,
      grade: lesson.grade,
      teacherId: lesson.teacherId,
      slotLabel: lesson.slotLabel,
      slotDateKey: lesson.slotDateKey,
      slotTime: lesson.slotTime,
      studentIds: lesson.studentIds.slice()
    };
  }

  function syncSlotFromPicker() {
    if (slotEditor.slot == null) return;
    var days = ResMock.getOpenLessonSlots().days;
    var day = days[slotEditor.dayOffset] || days[0];
    draft.slotLabel = ResMock.buildSlotLabel(slotEditor.dayOffset, slotEditor.slot);
    var today = new Date();
    var d = new Date(today);
    d.setDate(today.getDate() + (day.offset || 0));
    draft.slotDateKey = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    draft.slotTime = slotEditor.slot;
  }

  function initSlotFromDraft() {
    slotEditor = { dayOffset: 0, slot: draft.slotTime || null };
    if (draft.slotDateKey) {
      var days = ResMock.getOpenLessonSlots().days;
      var today = new Date();
      for (var i = 0; i < days.length; i++) {
        var d = new Date(today);
        d.setDate(today.getDate() + days[i].offset);
        var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (key === draft.slotDateKey) {
          slotEditor.dayOffset = days[i].offset;
          break;
        }
      }
    }
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  function renderList() {
    if (!listEl) return;
    var lessons = Planner.getPlannedLessons();
    if (!lessons.length) {
      listEl.innerHTML = '<p class="tm-planner-empty">Henüz planlanmış deneme dersi yok. Yeni ders planlayarak başlayın.</p>';
      return;
    }
    listEl.innerHTML = lessons.map(function (l) {
      var teacher = Planner.getTeacherById(l.teacherId);
      var active = selectedId === l.id ? ' is-active' : '';
      var conflicts = Planner.checkConflicts(l);
      return (
        '<button type="button" class="tm-planner-card' + active + '" data-lesson-id="' + escapeHtml(l.id) + '">' +
          (conflicts.length ? '<span class="tm-planner-card-warn" title="Çakışma">!</span>' : '') +
          '<span class="tm-planner-card-subject">' + escapeHtml(l.subject) + '</span>' +
          '<span class="tm-planner-card-meta">' + escapeHtml(l.grade) + ' · ' + escapeHtml(teacher ? teacher.name : '—') + '</span>' +
          '<span class="tm-planner-card-slot">' + escapeHtml(l.slotLabel) + '</span>' +
          '<span class="tm-planner-card-count">' + l.studentIds.length + ' öğrenci</span>' +
        '</button>'
      );
    }).join('');
  }

  function renderSlotPicker() {
    var slots = ResMock.getOpenLessonSlots();
    var full = slots.fullByDay[slotEditor.dayOffset] || {};
    var dayNav = slots.days.map(function (d) {
      return (
        '<button type="button" class="tm-slot-day' + (d.offset === slotEditor.dayOffset ? ' is-active' : '') + '" data-plan-day="' + d.offset + '">' +
          '<strong>' + escapeHtml(d.label) + '</strong><small>' + escapeHtml(d.date) + '</small>' +
        '</button>'
      );
    }).join('');
    var grid = slots.times.map(function (t) {
      var isFull = !!full[t];
      var isSel = !isFull && slotEditor.slot === t;
      return (
        '<button type="button" class="tm-slot' + (isFull ? ' is-full' : '') + (isSel ? ' is-selected' : '') + '" data-plan-slot="' + escapeHtml(t) + '"' + (isFull ? ' disabled' : '') + '>' +
          escapeHtml(t) +
          '<span class="tm-slot-badge ' + (isFull ? 'is-full' : 'is-free') + '">' + (isFull ? 'Dolu' : 'Müsait') + '</span>' +
        '</button>'
      );
    }).join('');
    return (
      '<div class="tm-planner-slot-block">' +
        '<span class="tm-filter-field-label">Ders tarihi / saat</span>' +
        '<div class="tm-slot-day-nav">' + dayNav + '</div>' +
        '<div class="tm-slot-grid">' + grid + '</div>' +
        (draft.slotLabel ? '<p class="tm-planner-slot-selected">Seçili: <strong>' + escapeHtml(draft.slotLabel) + '</strong></p>' : '') +
      '</div>'
    );
  }

  function renderStudents() {
    if (!draft.subject || !draft.grade) {
      return '<p class="tm-planner-students-hint">Öğrenci listesi için branş ve sınıf seçin.</p>';
    }
    var students = Planner.getEligibleStudents(draft.subject, draft.grade, draft.id, draft.slotDateKey, draft.slotTime);
    if (!students.length) {
      return '<p class="tm-planner-students-hint">Bu branş ve sınıf için uygun rezervasyon bulunamadı.</p>';
    }
    return (
      '<div class="tm-planner-students">' +
        students.map(function (s) {
          var checked = draft.studentIds.indexOf(s.reservationId) !== -1;
          var disabled = s.hasConflict && !checked ? ' disabled' : '';
          return (
            '<label class="tm-planner-student' + (checked ? ' is-checked' : '') + (s.hasConflict && !checked ? ' is-blocked' : '') + '">' +
              '<input type="checkbox" data-student-id="' + escapeHtml(s.reservationId) + '"' + (checked ? ' checked' : '') + disabled + '>' +
              '<span class="tm-planner-student-body">' +
                '<strong>' + escapeHtml(s.name) + '</strong>' +
                '<small>Tercih: ' + escapeHtml(s.preferredSlot) + ' · Veli: ' + escapeHtml(s.parent) + '</small>' +
                (s.hasConflict && !checked ? '<small class="tm-planner-student-warn">' + escapeHtml(s.conflictMsg) + '</small>' : '') +
              '</span>' +
            '</label>'
          );
        }).join('') +
      '</div>'
    );
  }

  function renderConflicts() {
    syncSlotFromPicker();
    var issues = Planner.checkConflicts(draft);
    if (!issues.length) {
      return '<div class="tm-planner-conflicts is-ok">Çakışma yok — ders kaydedilebilir.</div>';
    }
    return (
      '<div class="tm-planner-conflicts is-error">' +
        '<strong>Çakışma uyarısı</strong>' +
        '<ul>' + issues.map(function (i) { return '<li>' + escapeHtml(i.message) + '</li>'; }).join('') + '</ul>' +
      '</div>'
    );
  }

  function renderEditor() {
    if (!editorEl || !draft) return;
    syncSlotFromPicker();
    var teachers = Planner.getTeachersForSubject(draft.subject);
    var isEdit = !!draft.id;

    editorEl.innerHTML =
      '<div class="tm-planner-editor-inner">' +
        '<header class="tm-planner-editor-head">' +
          '<h2 class="tm-planner-editor-title">' + (isEdit ? 'Dersi Düzenle' : 'Yeni Deneme Dersi Planla') + '</h2>' +
          '<p class="tm-planner-editor-sub">Branş, sınıf ve öğretmen seçin; uygun öğrencileri ekleyerek sınıf oluşturun.</p>' +
        '</header>' +
        '<div class="tm-planner-form-grid">' +
          '<label class="tm-filter-field">' +
            '<span class="tm-filter-field-label">Branş</span>' +
            '<select class="tm-filter-select" id="tmPlanSubject">' +
              '<option value="">Seçin</option>' +
              Planner.SUBJECTS.map(function (s) {
                return '<option value="' + escapeHtml(s) + '"' + (draft.subject === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>';
              }).join('') +
            '</select>' +
          '</label>' +
          '<label class="tm-filter-field">' +
            '<span class="tm-filter-field-label">Sınıf seviyesi</span>' +
            '<select class="tm-filter-select" id="tmPlanGrade">' +
              '<option value="">Seçin</option>' +
              Planner.GRADES.map(function (g) {
                return '<option value="' + escapeHtml(g) + '"' + (draft.grade === g ? ' selected' : '') + '>' + escapeHtml(g) + '</option>';
              }).join('') +
            '</select>' +
          '</label>' +
          '<label class="tm-filter-field">' +
            '<span class="tm-filter-field-label">Öğretmen</span>' +
            '<select class="tm-filter-select" id="tmPlanTeacher"' + (!draft.subject ? ' disabled' : '') + '>' +
              '<option value="">Seçin</option>' +
              teachers.map(function (t) {
                return '<option value="' + escapeHtml(t.id) + '"' + (draft.teacherId === t.id ? ' selected' : '') + '>' + escapeHtml(t.name) + '</option>';
              }).join('') +
            '</select>' +
          '</label>' +
        '</div>' +
        renderSlotPicker() +
        '<section class="tm-planner-students-section">' +
          '<div class="tm-planner-section-head">' +
            '<h3 class="tm-planner-section-title">Derse katılacak öğrenciler</h3>' +
            '<span class="tm-planner-section-count">' + draft.studentIds.length + ' seçili</span>' +
          '</div>' +
          renderStudents() +
        '</section>' +
        renderConflicts() +
        '<div class="tm-planner-actions">' +
          (isEdit ? '<button type="button" class="tm-planner-btn is-danger" id="tmPlanDelete">Dersi Sil</button>' : '') +
          '<span class="tm-planner-actions-spacer"></span>' +
          '<button type="button" class="tm-planner-btn is-ghost" id="tmPlanCancel">Vazgeç</button>' +
          '<button type="button" class="tm-planner-btn is-primary" id="tmPlanSave">Kaydet</button>' +
        '</div>' +
      '</div>';
  }

  function refresh() {
    renderList();
    renderEditor();
  }

  function selectLesson(id) {
    selectedId = id;
    if (!id) {
      draft = emptyDraft();
      slotEditor = { dayOffset: 0, slot: null };
    } else {
      var lesson = Planner.getPlannedLessonById(id);
      if (!lesson) return;
      draft = draftFromLesson(lesson);
      initSlotFromDraft();
    }
    refresh();
  }

  function startNew() {
    selectedId = null;
    draft = emptyDraft();
    slotEditor = { dayOffset: 0, slot: null };
    refresh();
  }

  function collectStudentIds() {
    if (!editorEl) return [];
    var ids = [];
    editorEl.querySelectorAll('[data-student-id]:checked').forEach(function (cb) {
      ids.push(cb.getAttribute('data-student-id'));
    });
    return ids;
  }

  function saveLesson() {
    if (!draft) return;
    var subj = document.getElementById('tmPlanSubject');
    var grade = document.getElementById('tmPlanGrade');
    var teacher = document.getElementById('tmPlanTeacher');
    draft.subject = subj ? subj.value : draft.subject;
    draft.grade = grade ? grade.value : draft.grade;
    draft.teacherId = teacher ? teacher.value : draft.teacherId;
    draft.studentIds = collectStudentIds();
    syncSlotFromPicker();

    var result = Planner.savePlannedLesson(draft);
    if (!result.ok) {
      showToast(result.error || 'Kaydedilemedi.');
      renderEditor();
      return;
    }
    showToast('Deneme dersi kaydedildi.');
    selectedId = result.lesson.id;
    draft = draftFromLesson(result.lesson);
    initSlotFromDraft();
    refresh();
  }

  function wireEvents() {
    if (newBtn) newBtn.addEventListener('click', startNew);

    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var card = e.target.closest('[data-lesson-id]');
        if (!card) return;
        selectLesson(card.getAttribute('data-lesson-id'));
      });
    }

    if (editorEl) {
      editorEl.addEventListener('change', function (e) {
        if (!draft) return;
        if (e.target.id === 'tmPlanSubject') {
          draft.subject = e.target.value;
          draft.teacherId = '';
          draft.studentIds = [];
          renderEditor();
          return;
        }
        if (e.target.id === 'tmPlanGrade') {
          draft.grade = e.target.value;
          draft.studentIds = [];
          renderEditor();
          return;
        }
        if (e.target.id === 'tmPlanTeacher') {
          draft.teacherId = e.target.value;
          renderEditor();
          return;
        }
        if (e.target.matches('[data-student-id]')) {
          draft.studentIds = collectStudentIds();
          renderEditor();
        }
      });

      editorEl.addEventListener('click', function (e) {
        if (!draft) return;
        if (e.target.closest('#tmPlanSave')) {
          saveLesson();
          return;
        }
        if (e.target.closest('#tmPlanCancel')) {
          if (selectedId) selectLesson(selectedId);
          else startNew();
          return;
        }
        if (e.target.closest('#tmPlanDelete')) {
          if (draft.id && confirm('Bu deneme dersini silmek istediğine emin misin?')) {
            Planner.deletePlannedLesson(draft.id);
            showToast('Ders silindi.');
            startNew();
          }
          return;
        }
        var dayBtn = e.target.closest('[data-plan-day]');
        if (dayBtn) {
          slotEditor.dayOffset = parseInt(dayBtn.getAttribute('data-plan-day'), 10);
          slotEditor.slot = null;
          syncSlotFromPicker();
          renderEditor();
          return;
        }
        var slotBtn = e.target.closest('[data-plan-slot]');
        if (slotBtn && !slotBtn.disabled) {
          slotEditor.slot = slotBtn.getAttribute('data-plan-slot');
          syncSlotFromPicker();
          renderEditor();
        }
      });
    }
  }

  function init() {
    startNew();
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
