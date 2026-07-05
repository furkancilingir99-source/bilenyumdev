(function () {
  'use strict';

  var Planner = window.TrialLessonPlannerMock;
  var ResMock = window.TrialLessonManagerMock;
  var Modal = window.TrialManagerModal;
  if (!Planner || !ResMock || !Modal) return;

  var root = document.getElementById('tmPlannedDetailRoot');
  var toastEl = document.getElementById('tmDetailToast');
  var lessonId = null;
  var modalStudentIds = [];

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

  function renderStudentsTable(students) {
    if (!students.length) {
      return '<p class="tm-planned-no-students">Bu derse henüz öğrenci eklenmemiş. Öğrenci eklemek için düzenle butonunu kullanın.</p>';
    }
    return (
      '<div class="tm-res-table-wrap">' +
        '<table class="tm-detail-table tm-res-table--rich">' +
          '<thead><tr>' +
            '<th>Rezervasyon ID</th><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Telefon</th><th>E-posta</th><th>Tercih slotu</th><th>Rezervasyon durumu</th><th></th>' +
          '</tr></thead>' +
          '<tbody>' +
            students.map(function (s) {
              var statusLabel = ResMock.STATUS_LABELS[s.status] || s.status || '—';
              return (
                '<tr>' +
                  '<td><span class="tm-record-id">' + escapeHtml(s.reservationId) + '</span></td>' +
                  '<td><strong>' + escapeHtml(s.name) + '</strong></td>' +
                  '<td>' + escapeHtml(s.grade) + '</td>' +
                  '<td>' + escapeHtml(s.parent) + '</td>' +
                  '<td class="tm-cell-contact"><a href="tel:' + escapeHtml(String(s.phone).replace(/\s/g, '')) + '">' + escapeHtml(s.phone) + '</a></td>' +
                  '<td class="tm-cell-contact"><a href="mailto:' + escapeHtml(s.email) + '">' + escapeHtml(s.email) + '</a></td>' +
                  '<td>' + escapeHtml(s.preferredSlot) + '</td>' +
                  '<td><span class="tm-status is-' + escapeHtml(s.status) + '">' + escapeHtml(statusLabel) + '</span></td>' +
                  '<td><a class="tm-action-link" href="' + reservationDetailUrl(s.reservationId) + '">Rezervasyon</a></td>' +
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
          '<button type="button" class="tm-planner-btn is-primary" id="tmOpenStudentsModal">Öğrencileri düzenle</button>' +
          '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(l.id) + '">Dersi düzenle</a>' +
          '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Listeye dön</a>' +
        '</div>' +
      '</header>' +
      conflicts +
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
          '<button type="button" class="tm-action-link is-primary" id="tmOpenStudentsModal2">+ Ekle / Çıkar</button>' +
        '</div>' +
        renderStudentsTable(l.students) +
      '</section>';

    ['tmOpenStudentsModal', 'tmOpenStudentsModal2'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', openStudentsModal);
    });
  }

  function renderStudentsModalBody(l) {
    var students = Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime);
    var list = students.length
      ? students.map(function (s) {
          var checked = modalStudentIds.indexOf(s.reservationId) !== -1;
          var disabled = s.hasConflict && !checked ? ' disabled' : '';
          return (
            '<label class="tm-planner-student' + (checked ? ' is-checked' : '') + (s.hasConflict && !checked ? ' is-blocked' : '') + '">' +
              '<input type="checkbox" data-modal-student-id="' + escapeHtml(s.reservationId) + '"' + (checked ? ' checked' : '') + disabled + '>' +
              '<span class="tm-planner-student-body">' +
                '<strong>' + escapeHtml(s.name) + '</strong>' +
                '<small class="tm-record-id tm-record-id--inline">' + escapeHtml(s.reservationId) + '</small>' +
                '<small>Veli: ' + escapeHtml(s.parent) + ' · ' + escapeHtml(s.phone) + '</small>' +
                (s.hasConflict && !checked ? '<small class="tm-planner-student-warn">' + escapeHtml(s.conflictMsg) + '</small>' : '') +
              '</span>' +
            '</label>'
          );
        }).join('')
      : '<p class="tm-planned-no-students">Uygun rezervasyon bulunamadı.</p>';

    return (
      '<p class="tm-planned-students-edit-hint">Branş ve sınıfa uygun rezervasyonlardan derse katılacak öğrencileri seçin.</p>' +
      '<div class="tm-planner-students tm-planner-students--drawer">' + list + '</div>' +
      renderConflictsBlock(l, modalStudentIds)
    );
  }

  function collectModalStudentIds() {
    var ids = [];
    document.querySelectorAll('[data-modal-student-id]:checked').forEach(function (cb) {
      ids.push(cb.getAttribute('data-modal-student-id'));
    });
    return ids;
  }

  function bindStudentsModalEvents(l) {
    var body = document.querySelector('[data-tm-modal-body]');
    if (!body) return;
    body.addEventListener('change', function (e) {
      if (!e.target.matches('[data-modal-student-id]')) return;
      modalStudentIds = collectModalStudentIds();
      body.innerHTML = renderStudentsModalBody(l);
      bindStudentsModalEvents(l);
    });
  }

  function openStudentsModal() {
    var l = Planner.getEnrichedPlannedLesson(lessonId);
    if (!l) return;
    modalStudentIds = l.studentIds.slice();
    Modal.open({
      title: 'Öğrenci listesini düzenle',
      subtitle: l.id + ' · ' + l.subject + ' · ' + l.grade,
      body: renderStudentsModalBody(l),
      foot:
        '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Vazgeç</button>' +
        '<button type="button" class="tm-planner-btn is-primary" id="tmModalStudentsSave">Kaydet</button>'
    });
    bindStudentsModalEvents(l);
    var saveBtn = document.getElementById('tmModalStudentsSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        modalStudentIds = collectModalStudentIds();
        var result = Planner.updatePlannedLessonStudents(lessonId, modalStudentIds);
        if (!result.ok) {
          showToast(result.error || 'Kaydedilemedi.');
          var fresh = Planner.getEnrichedPlannedLesson(lessonId);
          Modal.open({
            title: 'Öğrenci listesini düzenle',
            subtitle: fresh.id,
            body: renderStudentsModalBody(fresh),
            foot:
              '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Vazgeç</button>' +
              '<button type="button" class="tm-planner-btn is-primary" id="tmModalStudentsSave">Kaydet</button>'
          });
          bindStudentsModalEvents(fresh);
          return;
        }
        Modal.close();
        showToast('Öğrenci listesi güncellendi.');
        renderPage(Planner.getEnrichedPlannedLesson(lessonId));
      });
    }
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
