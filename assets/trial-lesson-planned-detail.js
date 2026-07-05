(function () {
  'use strict';

  var Planner = window.TrialLessonPlannerMock;
  var ResMock = window.TrialLessonManagerMock;
  var Modal = window.TrialManagerModal;
  var Picker = window.TrialLessonApplicantPicker;
  var Tabs = window.TrialManagerTabs;
  if (!Planner || !ResMock || !Modal || !Picker || !Tabs) return;

  var root = document.getElementById('tmPlannedDetailRoot');
  var toastEl = document.getElementById('tmDetailToast');
  var lessonId = null;
  var modalStudentIds = [];
  var modalApplicantSearch = '';
  var modalApplicantFilters = null;

  function getModalApplicantFilters() {
    if (!modalApplicantFilters) modalApplicantFilters = Picker.defaultApplicantFilters();
    return modalApplicantFilters;
  }

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

  function removeStudent(reservationId) {
    var l = Planner.getEnrichedPlannedLesson(lessonId);
    if (!l) return;
    var name = '';
    l.students.forEach(function (s) {
      if (s.reservationId === reservationId) name = s.name;
    });
    if (!Modal.confirmRemove({ subject: name || 'Bu öğrenci', detail: reservationId })) return;
    var nextIds = l.studentIds.filter(function (id) { return id !== reservationId; });
    var result = Planner.updatePlannedLessonStudents(lessonId, nextIds);
    if (!result.ok) {
      showToast(result.error || 'Öğrenci çıkarılamadı.');
      return;
    }
    showToast((name || 'Öğrenci') + ' dersten çıkarıldı.');
    renderPage(Planner.getEnrichedPlannedLesson(lessonId));
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
            '<th>Rezervasyon ID</th><th>Öğrenci</th><th>Veli</th><th>İletişim</th><th>Tercih slotu</th><th>Slot durumu</th><th>Başvuru</th><th>Veli / koordinasyon</th><th>İşlem</th>' +
          '</tr></thead>' +
          '<tbody>' +
            students.map(function (s) {
              var statusLabel = ResMock.STATUS_LABELS[s.status] || s.status || '—';
              var applicant = Object.assign({ statusLabel: statusLabel }, s);
              return (
                '<tr>' +
                  '<td><span class="tm-record-id">' + escapeHtml(s.reservationId) + '</span></td>' +
                  '<td><button type="button" class="tm-applicant-name-btn" data-view-applicant-inline="' + escapeHtml(s.reservationId) + '"><strong>' + escapeHtml(s.name) + '</strong></button><small>' + escapeHtml(s.grade) + '</small></td>' +
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
                  '<td>' + Picker.renderContactActions(applicant, ctx) + '</td>' +
                  '<td><button type="button" class="tm-action-link is-danger" data-remove-student="' + escapeHtml(s.reservationId) + '">Dersten çıkar</button></td>' +
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

  function pickerOpts(l, searchQuery) {
    return {
      subject: l.subject,
      grade: l.grade,
      lessonSlotLabel: l.slotLabel,
      lessonId: l.id,
      teacher: Planner.getTeacherById(l.teacherId),
      searchQuery: searchQuery,
      searchId: 'tmModalApplicantSearch',
      filterPrefix: 'tmModalApplicant',
      filters: getModalApplicantFilters(),
      showSearch: true
    };
  }

  function getApplicantsForLesson(l) {
    return Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime, l.slotLabel);
  }

  function openApplicantDetailModal(reservationId, l) {
    var applicant = Picker.findApplicantById(getApplicantsForLesson(l), reservationId);
    if (!applicant) return;
    var ctx = { subject: l.subject, grade: l.grade, lessonSlotLabel: l.slotLabel, lessonId: l.id };
    var isSelected = modalStudentIds.indexOf(reservationId) !== -1;
    var canToggle = isSelected || !applicant.hasConflict;

    Modal.open({
      title: applicant.name,
      subtitle: applicant.reservationId + ' · ' + applicant.grade,
      body: Picker.renderApplicantDetailBody(applicant, ctx, isSelected),
      foot:
        '<button type="button" class="tm-planner-btn is-ghost" id="tmApplicantDetailBack">← Listeye dön</button>' +
        '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Kapat</button>' +
        (canToggle
          ? '<button type="button" class="tm-planner-btn is-primary" id="tmApplicantDetailToggle">' + (isSelected ? 'Dersten çıkar' : 'Derse ekle') + '</button>'
          : '') +
        '<a class="tm-planner-btn is-ghost" href="' + reservationDetailUrl(applicant.reservationId) + '">Rezervasyon detayı</a>'
    });

    var backBtn = document.getElementById('tmApplicantDetailBack');
    if (backBtn) backBtn.addEventListener('click', function () { openStudentsModal(); });

    var toggleBtn = document.getElementById('tmApplicantDetailToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        if (isSelected) {
          if (!Modal.confirmRemove({ subject: applicant.name, detail: applicant.reservationId })) return;
          modalStudentIds = modalStudentIds.filter(function (id) { return id !== reservationId; });
        } else {
          modalStudentIds = modalStudentIds.concat([reservationId]);
        }
        openStudentsModal();
      });
    }
  }

  function countParentIssues(l) {
    var applicants = Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime, l.slotLabel);
    return applicants.filter(function (a) {
      return l.studentIds.indexOf(a.reservationId) !== -1 && a.needsParentContact;
    }).length;
  }

  function renderPage(l) {
    if (!root) return;
    var desc = Planner.describeLessonId(l.id);
    var teacher = Planner.getTeacherById(l.teacherId);
    var issues = Planner.checkConflicts(l);
    var parentIssueCount = countParentIssues(l);
    var hasConflicts = issues.length > 0;

    var alerts = '';
    if (hasConflicts) {
      alerts += '<div class="tm-admin-alert is-error"><strong>Çakışma:</strong> ' +
        issues.map(function (i) { return escapeHtml(i.message); }).join(' · ') + '</div>';
    }

    var tabDefs = [
      { id: 'ozet', label: 'Özet' },
      { id: 'ogrenciler', label: 'Öğrenciler', badge: String(l.students.length), badgeTone: l.students.length ? '' : 'warn' },
      { id: 'koordinasyon', label: 'Koordinasyon', badge: parentIssueCount ? String(parentIssueCount) : '', badgeTone: parentIssueCount ? 'warn' : '' },
      { id: 'kayit', label: 'Kayıt' }
    ];

    var overviewPanel =
      Tabs.kvGrid([
        { label: 'Branş', value: escapeHtml(l.subject) },
        { label: 'Sınıf', value: escapeHtml(l.grade) },
        { label: 'Ders tarihi', value: '<strong>' + escapeHtml(l.slotLabel) + '</strong>' },
        { label: 'Öğretmen', value: escapeHtml(l.teacherName) },
        { label: 'Öğrenci sayısı', value: String(l.students.length) },
        { label: 'Durum', value: hasConflicts
          ? '<span class="tm-status is-pending">Çakışma var</span>'
          : '<span class="tm-status is-confirmed">Planlandı</span>' }
      ]) +
      '<div class="tm-admin-inline-actions">' +
        '<a class="tm-planner-btn is-primary" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(l.id) + '">Dersi düzenle</a>' +
        '<button type="button" class="tm-planner-btn is-ghost" id="tmOpenStudentsModal">Öğrenci listesini düzenle</button>' +
      '</div>' +
      '<p class="tm-admin-section-label">Öğretmen iletişim</p>' +
      Tabs.kvGrid([
        teacher && teacher.phone ? { label: 'Telefon', value: '<a href="tel:' + escapeHtml(String(teacher.phone).replace(/\s/g, '')) + '">' + escapeHtml(teacher.phone) + '</a>' } : null,
        teacher && teacher.email ? { label: 'E-posta', value: '<a href="mailto:' + escapeHtml(teacher.email) + '">' + escapeHtml(teacher.email) + '</a>' } : null,
        { label: 'Branşlar', value: escapeHtml((l.teacherSubjects || []).join(', ')) }
      ].filter(Boolean));

    var studentsPanel =
      '<div class="tm-admin-panel-head">' +
        '<h3 class="tm-admin-panel-title">Derse kayıtlı öğrenciler</h3>' +
        '<button type="button" class="tm-action-link is-primary" id="tmOpenStudentsModal2">Başvurulardan düzenle</button>' +
      '</div>' +
      renderStudentsTable(l.students, l);

    var coordinationPanel =
      '<p class="tm-admin-panel-desc">Veli onayı ve öğretmen bilgilendirmesi bu sekmeden yönetilir.</p>' +
      Picker.renderParentCoordinationAlert(
        Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime, l.slotLabel),
        l.studentIds,
        l.slotLabel
      ) +
      Picker.renderTeacherCoordination(
        teacher || { name: l.teacherName, phone: l.teacherPhone, email: l.teacherEmail },
        { subject: l.subject, grade: l.grade, lessonSlotLabel: l.slotLabel, lessonId: l.id, studentNames: l.students.map(function (s) { return s.name; }) }
      );

    var recordPanel =
      Tabs.kvGrid([
        { label: 'Ders ID', value: '<span class="tm-record-id">' + escapeHtml(l.id) + '</span>', full: true },
        { label: 'Branş kodu', value: escapeHtml(desc.subject) + ' · ' + escapeHtml(desc.grade) },
        { label: 'Yıl / sıra', value: escapeHtml(desc.year) + '-#' + escapeHtml(desc.seq) },
        { label: 'Tarih anahtarı', value: escapeHtml(l.slotDateKey) + ' · ' + escapeHtml(l.slotTime) },
        { label: 'Son güncelleme', value: escapeHtml(formatUpdatedAt(l.updatedAt)) },
        { label: 'Atanan kayıt', value: l.studentIds.length + ' rezervasyon' }
      ]) +
      '<div class="tm-admin-inline-actions">' +
        '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(l.id) + '">Tam düzenleme formu</a>' +
      '</div>';

    root.innerHTML =
      '<div class="tm-admin" data-admin-root>' +
        '<nav class="tm-breadcrumb">' +
          '<a href="deneme-dersi-yoneticisi-dashboard.html">Merkez</a>' +
          '<span aria-hidden="true">/</span>' +
          '<a href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Planlanmış Dersler</a>' +
          '<span aria-hidden="true">/</span>' +
          '<span>' + escapeHtml(l.id) + '</span>' +
        '</nav>' +
        '<header class="tm-admin-header">' +
          '<div class="tm-admin-header-main">' +
            '<h1 class="tm-admin-header-title">' + escapeHtml(l.subject) + ' · ' + escapeHtml(l.grade) + '</h1>' +
            '<p class="tm-admin-header-meta">' + escapeHtml(l.teacherName) + ' · ' + escapeHtml(l.slotLabel) + '</p>' +
            '<span class="tm-record-id tm-admin-header-id">' + escapeHtml(l.id) + '</span>' +
          '</div>' +
          '<div class="tm-admin-header-actions">' +
            (hasConflicts ? '<span class="tm-status is-pending">Çakışma</span>' : '<span class="tm-status is-confirmed">Planlandı</span>') +
            '<button type="button" class="tm-planner-btn is-primary" id="tmOpenStudentsModalHead">Öğrencileri düzenle</button>' +
            '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-ders-planla.html?edit=' + encodeURIComponent(l.id) + '">Dersi düzenle</a>' +
            '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Listeye dön</a>' +
          '</div>' +
        '</header>' +
        Tabs.summaryCells([
          { label: 'Durum', value: hasConflicts ? 'Çakışma var' : 'Planlandı', tone: hasConflicts ? 'danger' : 'ok' },
          { label: 'Öğretmen', value: l.teacherName, tone: 'muted' },
          { label: 'Ders saati', value: l.slotLabel, tone: '' },
          { label: 'Öğrenci', value: l.students.length + ' kişi', tone: l.students.length ? 'ok' : 'warn' }
        ]) +
        alerts +
        '<div class="tm-admin-body">' +
          Tabs.renderTabNav(tabDefs) +
          '<div class="tm-admin-panels">' +
            Tabs.panelWrap('ozet', overviewPanel) +
            Tabs.panelWrap('ogrenciler', studentsPanel) +
            Tabs.panelWrap('koordinasyon', coordinationPanel) +
            Tabs.panelWrap('kayit', recordPanel) +
          '</div>' +
        '</div>' +
      '</div>';

    Tabs.bind(root.querySelector('[data-admin-root]'));

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

    root.querySelectorAll('[data-view-applicant-inline]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var applicant = Picker.findApplicantById(l.students.map(function (s) {
          return Object.assign({ statusLabel: ResMock.STATUS_LABELS[s.status] || s.status }, s);
        }), btn.getAttribute('data-view-applicant-inline'));
        if (!applicant) applicant = Picker.findApplicantById(getApplicantsForLesson(l), btn.getAttribute('data-view-applicant-inline'));
        if (!applicant) return;
        var ctx = { subject: l.subject, grade: l.grade, lessonSlotLabel: l.slotLabel, lessonId: l.id };
        var isSelected = true;
        Modal.open({
          title: applicant.name,
          subtitle: applicant.reservationId,
          body: Picker.renderApplicantDetailBody(applicant, ctx, isSelected),
          foot:
            '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Kapat</button>' +
            '<a class="tm-planner-btn is-ghost" href="' + reservationDetailUrl(applicant.reservationId) + '">Rezervasyon detayı</a>'
        });
      });
    });

    root.querySelectorAll('[data-remove-student]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeStudent(btn.getAttribute('data-remove-student'));
      });
    });

    ['tmOpenStudentsModal', 'tmOpenStudentsModal2', 'tmOpenStudentsModalHead'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', openStudentsModal);
    });
  }

  function renderStudentsModalBody(l) {
    var applicants = Planner.getEligibleStudents(l.subject, l.grade, l.id, l.slotDateKey, l.slotTime, l.slotLabel);
    return Picker.renderPickerSection(applicants, modalStudentIds, pickerOpts(l, modalApplicantSearch)) +
      renderConflictsBlock(l, modalStudentIds);
  }

  function refreshStudentsModalBody(l) {
    var body = document.querySelector('[data-tm-modal-body]');
    if (body) body.innerHTML = renderStudentsModalBody(l);
  }

  function bindStudentsModalEvents() {
    var modal = document.getElementById('tmModal');
    var body = modal ? modal.querySelector('[data-tm-modal-body]') : null;
    if (!modal || !body || modal.dataset.studentsBound) return;
    modal.dataset.studentsBound = '1';

    body.addEventListener('change', function (e) {
      if (e.target.matches('input.tm-applicant-cb')) {
        modalStudentIds = Picker.collectSelectedIds(body);
        Picker.updatePickerSelectionUI(body, modalStudentIds.length);
        var lesson = Planner.getEnrichedPlannedLesson(lessonId);
        var conflictsEl = body.querySelector('.tm-planner-conflicts');
        var conflictsHtml = renderConflictsBlock(lesson, modalStudentIds);
        if (conflictsEl) {
          if (conflictsHtml) conflictsEl.outerHTML = conflictsHtml;
          else conflictsEl.remove();
        } else if (conflictsHtml) {
          body.insertAdjacentHTML('beforeend', conflictsHtml);
        }
        return;
      }
      if (e.target.matches('.tm-applicant-filter')) {
        modalApplicantFilters = Picker.readFiltersFromContainer(body, 'tmModalApplicant');
        refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
      }
    });

    body.addEventListener('input', function (e) {
      if (e.target.id !== 'tmModalApplicantSearch') return;
      modalApplicantSearch = e.target.value;
      refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
    });

    body.addEventListener('click', function (e) {
      if (e.target.closest('#tmModalApplicantFilterClear')) {
        modalApplicantFilters = Picker.defaultApplicantFilters();
        refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
        return;
      }
      var viewBtn = e.target.closest('[data-view-applicant]');
      if (viewBtn) {
        openApplicantDetailModal(viewBtn.getAttribute('data-view-applicant'), Planner.getEnrichedPlannedLesson(lessonId));
        return;
      }
      var confirmBtn = e.target.closest('[data-confirm-slot]');
      if (!confirmBtn) return;
      e.preventDefault();
      var updated = Picker.confirmParentSlot(confirmBtn.getAttribute('data-confirm-slot'), confirmBtn.getAttribute('data-slot-label'));
      if (!updated) {
        showToast('Slot onayı kaydedilemedi.');
        return;
      }
      showToast('Veli slot onayı kaydedildi.');
      refreshStudentsModalBody(Planner.getEnrichedPlannedLesson(lessonId));
    });

    modal.addEventListener('click', function (e) {
      if (!e.target.closest('#tmModalStudentsSave')) return;
      modalStudentIds = Picker.collectSelectedIds(body);
      var lesson = Planner.getEnrichedPlannedLesson(lessonId);
      var removedCount = lesson ? lesson.studentIds.filter(function (id) {
        return modalStudentIds.indexOf(id) === -1;
      }).length : 0;
      if (removedCount && !Modal.confirmRemove({
        subject: removedCount === 1 ? '1 öğrenci' : removedCount + ' öğrenci',
        detail: 'Seçim kaydedildiğinde dersten çıkarılacak.'
      })) {
        return;
      }
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
    modalApplicantFilters = Picker.defaultApplicantFilters();
    bindStudentsModalEvents();
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
