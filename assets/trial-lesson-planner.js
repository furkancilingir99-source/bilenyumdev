(function () {
  'use strict';

  var Planner = window.TrialLessonPlannerMock;
  var ResMock = window.TrialLessonManagerMock;
  var Picker = window.TrialLessonApplicantPicker;
  var Modal = window.TrialManagerModal;
  if (!Planner || !ResMock || !Picker) return;

  var editorEl = document.getElementById('tmPlannerEditor');
  var toastEl = document.getElementById('tmPlannerToast');

  var draft = null;
  var slotEditor = { dayOffset: 0, slot: null };
  var applicantSearch = '';
  var modalApplicantSearch = '';

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

  function getApplicants() {
    syncSlotFromPicker();
    return Planner.getEligibleStudents(
      draft.subject,
      draft.grade,
      draft.id,
      draft.slotDateKey,
      draft.slotTime,
      draft.slotLabel
    );
  }

  function getTeacher() {
    return draft.teacherId ? Planner.getTeacherById(draft.teacherId) : null;
  }

  function pickerOpts(searchQuery, inputAttr) {
    return {
      subject: draft.subject,
      grade: draft.grade,
      lessonSlotLabel: draft.slotLabel,
      lessonId: draft.id,
      teacher: getTeacher(),
      searchQuery: searchQuery,
      searchId: inputAttr === 'data-modal-student-id' ? 'tmModalApplicantSearch' : 'tmApplicantSearch',
      inputAttr: inputAttr || 'data-student-id',
      showSearch: true
    };
  }

  function renderStudents() {
    if (!draft.subject || !draft.grade) {
      return '<p class="tm-planner-students-hint">Öğrenci listesi için branş ve sınıf seçin.</p>';
    }
    if (!draft.slotLabel) {
      return '<p class="tm-planner-students-hint">Başvuru eşleştirmesi için ders tarihi / saat seçin.</p>';
    }
    return Picker.renderPickerSection(getApplicants(), draft.studentIds, pickerOpts(applicantSearch));
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

  function renderLessonIdBlock() {
    var id = draft.id || Planner.previewLessonId(draft.subject, draft.grade);
    if (!id) {
      return (
        '<div class="tm-lesson-id-card is-placeholder">' +
          '<span class="tm-filter-field-label">Ders ID</span>' +
          '<p class="tm-lesson-id-hint">Branş ve sınıf seçildiğinde ders ID oluşturulur.</p>' +
        '</div>'
      );
    }
    var desc = Planner.describeLessonId(id);
    return (
      '<div class="tm-lesson-id-card">' +
        '<span class="tm-filter-field-label">Ders ID</span>' +
        '<span class="tm-record-id tm-record-id--lg">' + escapeHtml(id) + '</span>' +
        '<p class="tm-lesson-id-desc">' + escapeHtml(desc.subject) + ' · ' + escapeHtml(desc.grade) + ' · ' + escapeHtml(desc.year) + '</p>' +
        (!draft.id ? '<small class="tm-lesson-id-hint">Kayıt sonrası bu ID ile planlanmış derslerde görünür.</small>' : '') +
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
          '<div class="tm-planner-editor-head-row">' +
            '<div>' +
              '<h2 class="tm-planner-editor-title">' + (isEdit ? 'Dersi Düzenle' : 'Yeni Deneme Dersi Planla') + '</h2>' +
              '<p class="tm-planner-editor-sub">Branş, sınıf ve öğretmen seçin; uygun öğrencileri ekleyerek sınıf oluşturun.</p>' +
            '</div>' +
            '<a class="tm-panel-link" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Planlanmış derslere git →</a>' +
          '</div>' +
        '</header>' +
        renderLessonIdBlock() +
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
            '<h3 class="tm-planner-section-title">Başvurulardan öğrenci seçimi</h3>' +
            '<div class="tm-planner-section-actions">' +
              '<span class="tm-planner-section-count">' + draft.studentIds.length + ' seçili</span>' +
              '<button type="button" class="tm-action-link is-primary" id="tmOpenApplicantModal">Geniş ekranda düzenle</button>' +
            '</div>' +
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

  function loadLesson(id) {
    var lesson = Planner.getPlannedLessonById(id);
    if (!lesson) {
      draft = emptyDraft();
      slotEditor = { dayOffset: 0, slot: null };
    } else {
      draft = draftFromLesson(lesson);
      initSlotFromDraft();
    }
    renderEditor();
  }

  function startNew() {
    draft = emptyDraft();
    slotEditor = { dayOffset: 0, slot: null };
    renderEditor();
  }

  function collectStudentIds(fromModal) {
    var attr = fromModal ? 'data-modal-student-id' : 'data-student-id';
    var root = fromModal ? document.querySelector('[data-tm-modal-body]') : editorEl;
    return Picker.collectSelectedIds(root, attr);
  }

  function handleConfirmSlot(btn) {
    var resId = btn.getAttribute('data-confirm-slot');
    var slotLabel = btn.getAttribute('data-slot-label');
    var updated = Picker.confirmParentSlot(resId, slotLabel);
    if (!updated) {
      showToast('Slot onayı kaydedilemedi.');
      return;
    }
    showToast('Veli slot onayı kaydedildi — ' + resId);
    renderEditor();
    if (document.getElementById('tmModal') && document.getElementById('tmModal').classList.contains('is-open')) {
      openApplicantModal();
    }
  }

  function refreshModalApplicantBody() {
    var body = document.querySelector('[data-tm-modal-body]');
    if (!body) return;
    body.innerHTML = Picker.renderPickerSection(getApplicants(), draft.studentIds, pickerOpts(modalApplicantSearch, 'data-modal-student-id'));
  }

  function bindModalApplicantEvents() {
    var modal = document.getElementById('tmModal');
    var body = modal ? modal.querySelector('[data-tm-modal-body]') : null;
    if (!modal || !body || modal.dataset.applicantBound) return;
    modal.dataset.applicantBound = '1';

    body.addEventListener('change', function (e) {
      if (!e.target.matches('[data-modal-student-id]')) return;
      draft.studentIds = collectStudentIds(true);
      refreshModalApplicantBody();
    });
    body.addEventListener('input', function (e) {
      if (e.target.id !== 'tmModalApplicantSearch') return;
      modalApplicantSearch = e.target.value;
      refreshModalApplicantBody();
    });
    body.addEventListener('click', function (e) {
      var confirmBtn = e.target.closest('[data-confirm-slot]');
      if (!confirmBtn) return;
      e.preventDefault();
      handleConfirmSlot(confirmBtn);
    });

    modal.addEventListener('click', function (e) {
      if (e.target.closest('#tmModalApplicantSave')) {
        draft.studentIds = collectStudentIds(true);
        Modal.close();
        applicantSearch = modalApplicantSearch;
        renderEditor();
        showToast(draft.studentIds.length + ' öğrenci seçildi.');
      }
    });
  }

  function openApplicantModal() {
    if (!Modal || !draft.subject || !draft.grade) return;
    syncSlotFromPicker();
    modalApplicantSearch = modalApplicantSearch || applicantSearch;
    bindModalApplicantEvents();
    Modal.open({
      title: 'Başvurulardan öğrenci seç',
      subtitle: (draft.id || 'Yeni ders') + ' · ' + draft.subject + ' · ' + draft.grade + ' · ' + (draft.slotLabel || '—'),
      body: Picker.renderPickerSection(getApplicants(), draft.studentIds, pickerOpts(modalApplicantSearch, 'data-modal-student-id')),
      foot:
        '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Vazgeç</button>' +
        '<button type="button" class="tm-planner-btn is-primary" id="tmModalApplicantSave">Seçimi uygula</button>'
    });
  }

  function saveLesson() {
    if (!draft) return;
    var subj = document.getElementById('tmPlanSubject');
    var grade = document.getElementById('tmPlanGrade');
    var teacher = document.getElementById('tmPlanTeacher');
    draft.subject = subj ? subj.value : draft.subject;
    draft.grade = grade ? grade.value : draft.grade;
    draft.teacherId = teacher ? teacher.value : draft.teacherId;
    draft.studentIds = collectStudentIds(false);
    syncSlotFromPicker();

    var result = Planner.savePlannedLesson(draft);
    if (!result.ok) {
      showToast(result.error || 'Kaydedilemedi.');
      renderEditor();
      return;
    }
    showToast('Deneme dersi kaydedildi — ' + result.lesson.id);
    draft = draftFromLesson(result.lesson);
    initSlotFromDraft();
    if (history.replaceState) {
      history.replaceState(null, '', 'deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(result.lesson.id));
    }
    renderEditor();
  }

  function wireEvents() {
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
          draft.studentIds = collectStudentIds(false);
          renderEditor();
          return;
        }
      });

      editorEl.addEventListener('input', function (e) {
        if (!draft) return;
        if (e.target.id === 'tmApplicantSearch') {
          applicantSearch = e.target.value;
          renderEditor();
        }
      });

      editorEl.addEventListener('click', function (e) {
        if (!draft) return;
        var confirmBtn = e.target.closest('[data-confirm-slot]');
        if (confirmBtn) {
          e.preventDefault();
          handleConfirmSlot(confirmBtn);
          return;
        }
        if (e.target.closest('#tmOpenApplicantModal')) {
          openApplicantModal();
          return;
        }
        if (e.target.closest('#tmPlanSave')) {
          saveLesson();
          return;
        }
        if (e.target.closest('#tmPlanCancel')) {
          if (draft.id) loadLesson(draft.id);
          else startNew();
          return;
        }
        if (e.target.closest('#tmPlanDelete')) {
          if (draft.id && confirm('Bu deneme dersini silmek istediğine emin misin?')) {
            Planner.deletePlannedLesson(draft.id);
            showToast('Ders silindi.');
            window.location.href = 'deneme-dersi-yoneticisi-planlanmis-dersler.html';
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
    if (Modal) Modal.get('tmModal');
    var params = new URLSearchParams(window.location.search);
    var editId = params.get('edit');
    if (editId && Planner.getPlannedLessonById(editId)) {
      loadLesson(editId);
    } else {
      startNew();
    }
    wireEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
