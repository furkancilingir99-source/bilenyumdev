(function () {
  'use strict';

  var Planner = window.TrialLessonPlannerMock;
  var ResMock = window.TrialLessonManagerMock;
  var Modal = window.TrialManagerModal;
  var Picker = window.TrialLessonApplicantPicker;
  if (!Planner || !ResMock || !Modal || !Picker) return;

  var root = document.getElementById('tmPlannedDetailRoot');
  var toastEl = document.getElementById('tmDetailToast');
  var lessonId = null;
  var modalStudentIds = [];
  var modalApplicantSearch = '';

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  function formatUpdatedAt(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + h + ':' + m;
  }

  function reservationDetailUrl(id) {
    return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
  }

  function renderStudentsTable(students, lesson) {
    if (!students.length) {
      return '<p class="tm-planned-no-students">Bu derse henüz öğrenci eklenmemiş. Başvurulardan öğrenci eklemek için düzenle butonunu kullanın.</p>';
    }
    var ctx = {
      subject: lesson.subject,
      grade: lesson.grade,
      lessonSlotLabel: lesson.slotLabel,
      lessonId: lesson.id
    };
    return (
      '<div class="tm-res-table-wrap">' +
        '<table class="tm-detail-table tm-res-table--rich">' +
          '<thead><tr>' +
            '<th>Rezervasyon ID</th><th>Öğrenci</th><th>Veli</th><th>İletişim</th><th>Tercih slotu</th><th>Slot durumu</th><th>Başvuru</th><th>Veli / koordinasyon</th>' +
          '</tr></thead>' +
          '<tbody>' +
            students.map(function (s) {
              var statusLabel = ResMock.STATUS_LABELS[s.status] || s.status || '—';
              var applicant = Object.assign({ statusLabel: statusLabel }, s);
              return (
                '<tr>' +
                  '<td><span class="tm-record-id">' + escapeHtml(s.reservationId) + '</span></td>' +
                  '<td><strong>' + escapeHtml(s.name) + '</strong><small>' + escapeHtml(s.grade) + '</small></td>' +
                  '<td>' + escapeHtml(s.parent) + '</td>' +
                  '<td class="tm-cell-contact">' +
                    '<a href="tel:' + escapeHtml(String(s.phone).replace(/\s/g, '')) + '">' + escapeHtml(s.phone) + '</a>' +
                    '<a href="mailto:' + escapeHtml(s.email) + '">' + escapeHtml(s.email) + '</a>' +
                  '</td>' +
                  '<td>' + escapeHtml(s.preferredSlot) + '</td>' +
                  '<td>' +
                    (s.slotMatchesLesson && s.slotConfirmedByParent
                      ? '<span class="tm-applicant-slot is-ok">Veli onaylı</span>'
                      : '<span class="tm-applicant-slot is-warn">Veli onayı / slot kontrolü</span>') +
                  '</td>' +
                  '<td><span class="tm-status is-' + escapeHtml(s.status) + '">' + escapeHtml(statusLabel) + '</span></td>' +
                  '<td>' + Picker.renderContactActions(applicant, ctx, 'data-detail-student') + '</td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function renderConflictsBlock(l, studentIds) {
    var draft = {
      id: l.id,
      subject: l.subject,
      grade: l.grade,
      teacherId: l.teacherId,
      slotDateKey: l.slotDateKey,
      slotTime: l.slotTime,
      studentIds: studentIds || l.studentIds
    };
    var issues = Planner.checkConflicts(draft);
    if (!issues.length) return '';
    return (
      '<div class="tm-planner-conflicts is-error">' +
        '<strong>Çakışma uyarısı</strong>' +
        '<ul>' + issues.map(function (i) { return '<li>' + escapeHtml(i.message) + '</li>'; }).join('') + '</ul>' +
      '</div>'
    );
  }

  function renderPage(l) {
    if (!root) return;
    var desc = Planner.describeLessonId(l.id);
    var conflicts = renderConflictsBlock(l);

    root.innerHTML =
      '<nav class="tm-breadcrumb">' +
        '<a href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Planlanmış Dersler</a>' +
        '<span aria-hidden="true">/</span>' +
        '<span>' + escapeHtml(l.id) + '</span>' +
      '</nav>' +
      '<header class="tm-detail-hero">' +
        '<div class="tm-detail-hero-main">' +
          '<h1 class="tm-detail-hero-title">' + escapeHtml(l.subject) + ' · ' + escapeHtml(l.grade) + '</h1>' +
          '<p class="tm-detail-hero-sub">' + escapeHtml(l.teacherName) + ' · ' + escapeHtml(l.slotLabel) + '</p>' +
          '<span class="tm-record-id tm-record-id--lg">' + escapeHtml(l.id) + '</span>' +
          '<p class="tm-lesson-id-desc">' + escapeHtml(desc.subject) + ' · ' + escapeHtml(desc.grade) + ' · ' + escapeHtml(desc.year) + '-#' + escapeHtml(desc.seq) + '</p>' +
        '</div>' +
        '<div class="tm-detail-hero-actions">' +
          (l.conflicts && l.conflicts.length ? '<span class="tm-status is-pending">Çakışma var</span>' : '<span class="tm-status is-confirmed">Planlandı</span>') +
          '<button type="button" class="tm-planner-btn is-primary" id="tmOpenStudentsModal">Başvurulardan düzenle</button>' +
          '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(l.id) + '">Dersi düzenle</a>' +
          '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Listeye dön</a>' +
        '</div>' +
      '</header>' +
      conflicts +
      Picker.renderParentCoordinationAlert(
        Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime, l.slotLabel),
        l.studentIds,
        l.slotLabel
      ) +
      Picker.renderTeacherCoordination(
        { name: l.teacherName, phone: l.teacherPhone, email: l.teacherEmail },
        { subject: l.subject, grade: l.grade, lessonSlotLabel: l.slotLabel, lessonId: l.id, studentNames: l.students.map(function (s) { return s.name; }) }
      ) +
      '<div class="tm-detail-grid">' +
        '<div class="tm-detail-card is-lesson">' +
          '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">📚</span><h4 class="tm-detail-card-title">Ders</h4></div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Branş</dt><dd>' + escapeHtml(l.subject) + '</dd></div>' +
            '<div><dt>Sınıf</dt><dd>' + escapeHtml(l.grade) + '</dd></div>' +
            '<div><dt>Ders tarihi / saat</dt><dd><strong>' + escapeHtml(l.slotLabel) + '</strong></dd></div>' +
            '<div><dt>Öğrenci sayısı</dt><dd>' + l.students.length + '</dd></div>' +
            '<div><dt>Son güncelleme</dt><dd>' + escapeHtml(formatUpdatedAt(l.updatedAt)) + '</dd></div>' +
          '</dl>' +
        '</div>' +
        '<div class="tm-detail-card is-teacher">' +
          '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">👨‍🏫</span><h4 class="tm-detail-card-title">Öğretmen</h4></div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(l.teacherName) + '</dd></div>' +
            '<div><dt>Branşlar</dt><dd>' + escapeHtml((l.teacherSubjects || []).join(', ')) + '</dd></div>' +
            (l.teacherPhone ? '<div><dt>Telefon</dt><dd><a href="tel:' + escapeHtml(String(l.teacherPhone).replace(/\s/g, '')) + '">' + escapeHtml(l.teacherPhone) + '</a></dd></div>' : '') +
            (l.teacherEmail ? '<div><dt>E-posta</dt><dd><a href="mailto:' + escapeHtml(l.teacherEmail) + '">' + escapeHtml(l.teacherEmail) + '</a></dd></div>' : '') +
          '</dl>' +
        '</div>' +
        '<div class="tm-detail-card is-reservation">' +
          '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">🗓</span><h4 class="tm-detail-card-title">Planlama</h4></div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Ders ID</dt><dd><span class="tm-record-id">' + escapeHtml(l.id) + '</span></dd></div>' +
            '<div><dt>Tarih anahtarı</dt><dd>' + escapeHtml(l.slotDateKey) + ' · ' + escapeHtml(l.slotTime) + '</dd></div>' +
            '<div><dt>Atanan öğrenci</dt><dd>' + l.studentIds.length + ' kayıt</dd></div>' +
          '</dl>' +
        '</div>' +
      '</div>' +
      '<section class="tm-detail-section">' +
        '<div class="tm-detail-section-head">' +
          '<h2 class="tm-detail-section-title">Derse katılacak öğrenciler (' + l.students.length + ')</h2>' +
          '<button type="button" class="tm-action-link is-primary" id="tmOpenStudentsModal2">Başvurulardan düzenle</button>' +
        '</div>' +
        renderStudentsTable(l.students, l) +
      '</section>';

    root.querySelectorAll('[data-confirm-slot]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var updated = Picker.confirmParentSlot(btn.getAttribute('data-confirm-slot'), btn.getAttribute('data-slot-label'));
        if (!updated) {
          showToast('Slot onayı kaydedilemedi.');
          return;
        }
        showToast('Veli slot onayı kaydedildi.');
        renderPage(Planner.getEnrichedPlannedLesson(lessonId));
      });
    });

    ['tmOpenStudentsModal', 'tmOpenStudentsModal2'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', openStudentsModal);
    });
  }

  function renderStudentsModalBody(l) {
    var applicants = Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime, l.slotLabel);
    var teacher = Planner.getTeacherById(l.teacherId);
    return Picker.renderPickerSection(applicants, modalStudentIds, {
      subject: l.subject,
      grade: l.grade,
      lessonSlotLabel: l.slotLabel,
      lessonId: l.id,
      teacher: teacher,
      searchQuery: modalApplicantSearch,
      searchId: 'tmModalApplicantSearch',
      inputAttr: 'data-modal-student-id'
    }) + renderConflictsBlock(l, modalStudentIds);
  }

  function refreshStudentsModalBody(l) {
    var body = document.querySelector('[data-tm-modal-body]');
    if (body) body.innerHTML = renderStudentsModalBody(l);
  }

  function handleModalConfirmSlot(btn) {
    var updated = Picker.confirmParentSlot(btn.getAttribute('data-confirm-slot'), btn.getAttribute('data-slot-label'));
    if (!updated) {
      showToast('Slot onayı kaydedilemedi.');
      return;
    }
    showToast('Veli slot onayı kaydedildi.');
    var l = Planner.getEnrichedPlannedLesson(lessonId);
    refreshStudentsModalBody(l);
  }

  function bindStudentsModalEvents(l) {
    var modal = document.getElementById('tmModal');
    var body = modal ? modal.querySelector('[data-tm-modal-body]') : null;
    if (!modal || !body || modal.dataset.studentsBound) return;
    modal.dataset.studentsBound = '1';

    body.addEventListener('change', function (e) {
      if (!e.target.matches('[data-modal-student-id]')) return;
      modalStudentIds = Picker.collectSelectedIds(body, 'data-modal-student-id');
      refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
    });
    body.addEventListener('input', function (e) {
      if (e.target.id !== 'tmModalApplicantSearch') return;
      modalApplicantSearch = e.target.value;
      refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
    });
    body.addEventListener('click', function (e) {
      var confirmBtn = e.target.closest('[data-confirm-slot]');
      if (!confirmBtn) return;
      e.preventDefault();
      handleModalConfirmSlot(confirmBtn);
    });

    modal.addEventListener('click', function (e) {
      if (!e.target.closest('#tmModalStudentsSave')) return;
      modalStudentIds = Picker.collectSelectedIds(body, 'data-modal-student-id');
      var result = Planner.updatePlannedLessonStudents(lessonId, modalStudentIds);
      if (!result.ok) {
        showToast(result.error || 'Kaydedilemedi.');
        refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
        return;
      }
      Modal.close();
      showToast('Öğrenci listesi güncellendi.');
      renderPage(Planner.getEnrichedPlannedLesson(lessonId));
    });
  }

  function openStudentsModal() {
    var l = Planner.getEnrichedPlannedLesson(lessonId);
    if (!l) return;
    modalStudentIds = l.studentIds.slice();
    modalApplicantSearch = '';
    bindStudentsModalEvents(l);
    Modal.open({
      title: 'Başvurulardan öğrenci seç',
      subtitle: l.id + ' · ' + l.subject + ' · ' + l.grade + ' · ' + l.slotLabel,
      body: renderStudentsModalBody(l),
      foot:
        '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Vazgeç</button>' +
        '<button type="button" class="tm-planner-btn is-primary" id="tmModalStudentsSave">Kaydet</button>'
    });
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    lessonId = params.get('id');
    if (!lessonId) {
      root.innerHTML = '<p class="td-state">Ders ID bulunamadı. <a href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Listeye dön</a></p>';
      return;
    }
    var l = Planner.getEnrichedPlannedLesson(lessonId);
    if (!l) {
      root.innerHTML = '<p class="td-state">Planlanmış ders bulunamadı. <a href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Listeye dön</a></p>';
      return;
    }
    document.title = l.subject + ' · Planlanmış Ders · Bilenyum';
    Modal.get('tmModal');
    renderPage(l);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
