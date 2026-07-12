/**
 * Deneme Dersleri listesi
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Rules = window.TMSchedulingRules;
  var Form = window.TMFormDialog;
  var Confirm = window.TMConfirmDialog;
  var Perms = window.TMPermissions;
  if (!Store) return;

  // Yeni ders oluşturma modalı — gerekli bilgileri gir, öğretmen çakışması varsa uyarı ver, ekle.
  function openCreateSessionModal(prefill) {
    if (!Form) { window.location.href = 'deneme-dersi-yoneticisi-ders-planla.html'; return; }
    if (Perms && !Perms.guard('create')) return;
    prefill = prefill || {};
    var lessonTypes = Store.getLessonTypes();
    var grades = Store.getGrades ? Store.getGrades() : ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
    var slots = (Rules && Rules.HOURLY_SLOTS) || ['11:00', '12:00', '13:00', '14:00'];
    var pdrTeachers = Store.getTeachers().filter(function (t) { return t.isActive && (!Rules || Rules.isTeacherPdr(t.id)); });
    var branchTeachers = Store.getTeachers().filter(function (t) { return t.isActive && (!Rules || Rules.isTeacherBranchTeacher(t.id)); });
    function teacherOpts(list) { return list.map(function (t) { return { value: t.id, label: U.fullName(t.firstName, t.lastName) }; }); }
    Form.open({
      title: 'Yeni ders oluştur',
      description: 'Deneme dersi 50 dakikadır. Seçilen öğretmenin programı çakışırsa uyarı verilir. Yeni ders öğrencisiz oluşturulur.',
      fields: [
        { type: 'select', name: 'lessonTypeId', label: 'Ders türü', value: prefill.lessonTypeId, options: lessonTypes.map(function (lt) { return { value: lt.id, label: lt.name }; }) },
        { type: 'select', name: 'gradeLevel', label: 'Sınıf', value: prefill.gradeLevel, options: grades.map(function (g) { return { value: g, label: g }; }) },
        { type: 'date', name: 'date', label: 'Tarih', value: prefill.date || Store.todayKey() },
        { type: 'select', name: 'startTime', label: 'Başlangıç saati', value: prefill.startTime, options: slots.map(function (s) { return { value: s, label: s + '–' + (Rules ? Rules.addMinutes(s, 50) : s) }; }) },
        { type: 'select', name: 'pdrTeacherId', label: 'PDR/Rehberlik öğretmeni', value: prefill.pdrTeacherId, options: teacherOpts(pdrTeachers) },
        { type: 'select', name: 'branchTeacherId', label: 'Branş öğretmeni', value: prefill.branchTeacherId, options: teacherOpts(branchTeachers) }
      ],
      submitLabel: 'Ekle',
      onSubmit: function (data) {
        var draft = {
          lessonTypeId: data.lessonTypeId,
          gradeLevel: data.gradeLevel,
          date: data.date,
          startTime: data.startTime,
          endTime: Rules ? Rules.addMinutes(data.startTime, 50) : data.startTime,
          pdrTeacherId: data.pdrTeacherId,
          branchTeacherId: data.branchTeacherId
        };
        var res = Store.createSession(draft);
        if (!res.ok) {
          U.notifyError(res.error || 'Öğretmen uygun değil, ders eklenemedi.');
          openCreateSessionModal(data); // değerleri koruyarak yeniden aç
          return;
        }
        U.notifySuccess('Yeni ders oluşturuldu (öğrencisiz).');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        render();
      }
    });
  }

  var tbody = document.getElementById('tmSessionsBody');
  var cardsEl = document.getElementById('tmSessionsCards');
  var searchInput = document.getElementById('tmSessionsSearch');
  var statusFilter = document.getElementById('tmSessionsStatus');
  var typeFilter = document.getElementById('tmSessionsType');
  var pdrTeacherFilter = document.getElementById('tmSessionsPdrTeacher');
  var branchTeacherFilter = document.getElementById('tmSessionsBranchTeacher');
  var dateFromInput = document.getElementById('tmSessionsDateFrom');
  var dateToInput = document.getElementById('tmSessionsDateTo');
  var linkFilter = document.getElementById('tmSessionsLinkFilter');
  var pdrInformedFilter = document.getElementById('tmSessionsPdrInformedFilter');
  var branchInformedFilter = document.getElementById('tmSessionsBranchInformedFilter');
  var missingTeacherFilter = document.getElementById('tmSessionsMissingTeacherFilter');
  var sortSelect = document.getElementById('tmSessionsSort');
  var countEl = document.getElementById('tmSessionsCount');
  var paginationEl = document.getElementById('tmSessionsPagination');
  var pageSizeSelect = document.getElementById('tmSessionsPageSize');
  var exportBtn = document.getElementById('tmSessionsExport');

  var page = 1;
  var needsAttendanceFilter = false;
  var todayFilter = false;

  function populateTeacherFilters() {
    var pdrTeachers = Store.getTeachers().filter(function (t) {
      return t.isActive && (!Rules || Rules.isTeacherPdr(t.id));
    });
    var branchTeachers = Store.getTeachers().filter(function (t) {
      return t.isActive && (!Rules || Rules.isTeacherBranchTeacher(t.id));
    });
    if (pdrTeacherFilter) {
      var curPdr = pdrTeacherFilter.value || 'all';
      pdrTeacherFilter.innerHTML = '<option value="all">Tüm PDR öğretmenleri</option>' + pdrTeachers.map(function (t) {
        return '<option value="' + t.id + '">' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</option>';
      }).join('');
      if (pdrTeacherFilter.querySelector('option[value="' + curPdr + '"]')) pdrTeacherFilter.value = curPdr;
    }
    if (branchTeacherFilter) {
      var curBranch = branchTeacherFilter.value || 'all';
      branchTeacherFilter.innerHTML = '<option value="all">Tüm branş öğretmenleri</option>' + branchTeachers.map(function (t) {
        return '<option value="' + t.id + '">' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</option>';
      }).join('');
      if (branchTeacherFilter.querySelector('option[value="' + curBranch + '"]')) branchTeacherFilter.value = curBranch;
    }
  }

  function initFromUrl() {
    var st = U.qs('status');
    if (st && statusFilter && statusFilter.querySelector('option[value="' + st + '"]')) {
      statusFilter.value = st;
    }
    if (U.qs('needsAttendance') === '1') needsAttendanceFilter = true;
    if (U.qs('today') === '1') todayFilter = true;
    var pdrId = U.qs('pdrTeacher');
    if (pdrId && pdrTeacherFilter && pdrTeacherFilter.querySelector('option[value="' + pdrId + '"]')) {
      pdrTeacherFilter.value = pdrId;
    }
    var branchId = U.qs('branchTeacher');
    if (branchId && branchTeacherFilter && branchTeacherFilter.querySelector('option[value="' + branchId + '"]')) {
      branchTeacherFilter.value = branchId;
    }
    if (U.qs('missingTeachers') === '1' && missingTeacherFilter) missingTeacherFilter.value = 'yes';
    var df = U.qs('dateFrom');
    if (df && dateFromInput) dateFromInput.value = df;
    var dt = U.qs('dateTo');
    if (dt && dateToInput) dateToInput.value = dt;
    var sort = U.qs('sort');
    if (sort && sortSelect && sortSelect.querySelector('option[value="' + sort + '"]')) {
      sortSelect.value = sort;
    }
    var lf = U.qs('link');
    if (lf && linkFilter && linkFilter.querySelector('option[value="' + lf + '"]')) {
      linkFilter.value = lf;
    }
    var pdrInf = U.qs('pdrInformed');
    if (pdrInf && pdrInformedFilter && pdrInformedFilter.querySelector('option[value="' + pdrInf + '"]')) {
      pdrInformedFilter.value = pdrInf;
    }
    var branchInf = U.qs('branchInformed');
    if (branchInf && branchInformedFilter && branchInformedFilter.querySelector('option[value="' + branchInf + '"]')) {
      branchInformedFilter.value = branchInf;
    }
  }

  // Derse gerçekten atanmış (aktif) rezervasyonlar — iptal/taşınanlar hariç.
  function activeReservations(d) {
    return d.reservations.filter(function (r) {
      return r.status !== 'cancelled' && r.status !== 'rescheduled';
    });
  }

  function rowData(s) {
    var d = Store.getSessionWithDetails(s.id);
    var meeting = d.meeting;
    var active = activeReservations(d);
    var pendingParent = active.filter(function (r) {
      return r.parentApprovalStatus !== 'approved';
    }).length;
    var linkNotSent = active.filter(function (r) {
      return r.parentApprovalStatus === 'approved' && !r.linkSent;
    }).length;
    var capacity = s.capacity || (d.lessonType && d.lessonType.defaultCapacity) || 20;
    var enrolled = active.length;
    return {
      session: s,
      detail: d,
      lessonName: d.lessonType ? d.lessonType.name : '—',
      gradeLevel: s.gradeLevel || '—',
      lessonCode: Store.getLessonCode ? Store.getLessonCode(s) : s.id,
      pdrTeacherName: d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—',
      branchTeacherName: d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—',
      missingTeachers: Rules && Rules.sessionMissingTeachers ? Rules.sessionMissingTeachers(s) : (!s.pdrTeacherId || !s.branchTeacherId),
      enrolled: enrolled,
      capacity: capacity,
      remaining: Math.max(0, capacity - enrolled),
      meetingStatus: meeting ? meeting.status : '—',
      meetingId: meeting ? meeting.meetingId : '—',
      pendingParent: pendingParent,
      linkNotSent: linkNotSent
    };
  }

  function applySort(items) {
    var sortKey = sortSelect ? sortSelect.value : 'date_asc';
    if (sortKey === 'date_desc') {
      return U.sortBy(items, function (r) { return r.session.date + r.session.startTime; }, 'desc');
    }
    if (sortKey === 'updated_desc') {
      return U.sortBy(items, function (r) { return r.session.updatedAt || ''; }, 'desc');
    }
    if (sortKey === 'pdr_teacher_asc') {
      return U.sortBy(items, function (r) { return r.pdrTeacherName; }, 'asc');
    }
    if (sortKey === 'branch_teacher_asc') {
      return U.sortBy(items, function (r) { return r.branchTeacherName; }, 'asc');
    }
    return U.sortBy(items, function (r) { return r.session.date + r.session.startTime; }, 'asc');
  }

  function filtered() {
    var q = searchInput ? searchInput.value : '';
    var status = statusFilter ? statusFilter.value : 'all';
    var type = typeFilter ? typeFilter.value : 'all';
    var pdrTeacher = pdrTeacherFilter ? pdrTeacherFilter.value : 'all';
    var branchTeacher = branchTeacherFilter ? branchTeacherFilter.value : 'all';
    var dateFrom = dateFromInput ? dateFromInput.value : '';
    var dateTo = dateToInput ? dateToInput.value : '';
    var link = linkFilter ? linkFilter.value : 'all';
    var pdrInformed = pdrInformedFilter ? pdrInformedFilter.value : 'all';
    var branchInformed = branchInformedFilter ? branchInformedFilter.value : 'all';
    var missingTeachers = missingTeacherFilter ? missingTeacherFilter.value : 'all';
    var items = Store.getSessions().map(rowData);
    items = U.filterSearch(items, q, function (r) {
      return r.session.id + ' ' + r.lessonName + ' ' + r.pdrTeacherName + ' ' + r.branchTeacherName + ' ' + r.session.date;
    });
    if (status !== 'all') items = items.filter(function (r) { return r.session.status === status; });
    if (type !== 'all') items = items.filter(function (r) { return r.session.lessonTypeId === type; });
    if (pdrTeacher !== 'all') items = items.filter(function (r) { return r.session.pdrTeacherId === pdrTeacher; });
    if (branchTeacher !== 'all') items = items.filter(function (r) { return r.session.branchTeacherId === branchTeacher; });
    if (dateFrom) items = items.filter(function (r) { return r.session.date >= dateFrom; });
    if (dateTo) items = items.filter(function (r) { return r.session.date <= dateTo; });
    if (link === 'link_pending') {
      items = items.filter(function (r) { return r.linkNotSent > 0; });
    } else if (link === 'parent_pending') {
      items = items.filter(function (r) { return r.pendingParent > 0; });
    }
    if (pdrInformed === 'yes') items = items.filter(function (r) { return r.session.pdrTeacherInformed; });
    else if (pdrInformed === 'no') items = items.filter(function (r) { return !r.session.pdrTeacherInformed; });
    if (branchInformed === 'yes') items = items.filter(function (r) { return r.session.branchTeacherInformed; });
    else if (branchInformed === 'no') items = items.filter(function (r) { return !r.session.branchTeacherInformed; });
    if (missingTeachers === 'yes') items = items.filter(function (r) { return r.missingTeachers; });
    if (needsAttendanceFilter) {
      var today = Store.todayKey();
      items = items.filter(function (r) {
        var s = r.session;
        if (s.status === 'cancelled') return false;
        var needs = s.status === 'completed' || (s.date < today && s.status === 'confirmed');
        if (!needs) return false;
        return Store.getReservationsForSession(s.id).some(function (res) { return res.status === 'confirmed'; });
      });
    }
    if (todayFilter) {
      var todayKey = Store.todayKey();
      items = items.filter(function (r) { return r.session.date === todayKey && r.session.status !== 'cancelled'; });
    }
    return applySort(items);
  }

  function renderFilterHint() {
    var hintEl = document.getElementById('tmSessionsFilterHint');
    if (!hintEl) return;
    if (needsAttendanceFilter) {
      hintEl.hidden = false;
      hintEl.innerHTML = 'Katılım girilmemiş dersler gösteriliyor. <a class="tm-panel-link" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Filtreyi kaldır</a>';
      return;
    }
    if (todayFilter) {
      hintEl.hidden = false;
      hintEl.innerHTML = 'Bugünkü dersler gösteriliyor. <a class="tm-panel-link" href="deneme-dersi-yoneticisi-planlanmis-dersler.html">Filtreyi kaldır</a>';
      return;
    }
    hintEl.hidden = true;
    hintEl.textContent = '';
  }

  var EYE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
  var X_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  // İşlem hücresi: Görüntüle her zaman; Düzenle ve İptal (çarpı) yalnızca TAMAMLANMAMIŞ derslerde.
  function actionCell(s) {
    var view = '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + s.id + '" title="Görüntüle" aria-label="Görüntüle">' + EYE_ICON + '</button>';
    // Tamamlanan ve iptal edilen dersler düzenlenemez/iptal edilemez → yalnızca görüntüle.
    if (s.status === 'completed' || s.status === 'cancelled') return '<span class="tm-row-actions">' + view + '</span>';
    var edit = '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-edit-session="' + s.id + '" title="Düzenle" aria-label="Dersi düzenle">' + EDIT_ICON + '</button>';
    var cancel = '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-cancel-session="' + s.id + '" title="Dersi iptal et" aria-label="Dersi iptal et">' + X_ICON + '</button>';
    return '<span class="tm-row-actions">' + view + edit + cancel + '</span>';
  }

  // Dersi iptal et (çarpı) — onay ister, neden zorunlu.
  function confirmCancelSession(sessionId) {
    var s = Store.getSessionById(sessionId);
    if (!s || s.status === 'completed' || s.status === 'cancelled') return;
    if (Perms && !Perms.guard('cancel')) return;
    var enrolled = (s.enrolledStudentIds || []).length;
    function doCancel(reason) {
      var res = Store.cancelSession(sessionId, reason);
      if (!res || !res.ok) { U.notifyError((res && res.error) || 'Ders iptal edilemedi.'); return; }
      U.notifySuccess('Ders iptal edildi.');
      if (window.TMOnSessionChange) window.TMOnSessionChange(); else render();
    }
    if (Confirm) {
      Confirm.open({
        title: 'Dersi iptal et',
        warning: (Store.getLessonCode ? Store.getLessonCode(s) : s.id) + ' dersini iptal etmek istediğinize emin misiniz?' +
          (enrolled ? ' Bu derse atanmış ' + enrolled + ' öğrencinin rezervasyonu da iptal edilir.' : ''),
        requireReason: true,
        confirmLabel: 'Dersi İptal Et',
        cancelLabel: 'Vazgeç',
        danger: true,
        onConfirm: doCancel
      });
    } else if (window.confirm('Dersi iptal etmek istediğinize emin misiniz?')) {
      doCancel('Liste üzerinden iptal edildi.');
    }
  }

  // Ders düzenleme modalı — Tarih, Saat, Ders Türü, Sınıf, PDR/Branş öğretmeni + Katılımcılar.
  function openEditSessionModal(sessionId) {
    var session = Store.getSessionById(sessionId);
    if (!session || session.status === 'completed' || session.status === 'cancelled') return;
    if (Perms && !Perms.guard('edit')) return;

    var lessonTypes = Store.getLessonTypes();
    var grades = Store.getGrades ? Store.getGrades() : ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
    var slots = (Rules && Rules.HOURLY_SLOTS) || ['11:00', '12:00', '13:00', '14:00'];
    var pdrTeachers = Store.getTeachers().filter(function (t) { return t.isActive && (!Rules || Rules.isTeacherPdr(t.id)); });
    var branchTeachers = Store.getTeachers().filter(function (t) { return t.isActive && (!Rules || Rules.isTeacherBranchTeacher(t.id)); });

    function opt(v, l, sel) { return '<option value="' + U.escapeHtml(String(v)) + '"' + (sel ? ' selected' : '') + '>' + U.escapeHtml(l) + '</option>'; }
    function field(label, ctrl) { return '<label class="tm-form-field">' + label + ctrl + '</label>'; }
    function teacherOpts(list, cur) { return list.map(function (t) { return opt(t.id, U.fullName(t.firstName, t.lastName), t.id === cur); }).join(''); }

    function fieldsHtml(s) {
      return '<div class="tm-detail-grid tm-detail-grid--modal">' +
        field('Ders Tarihi', '<input class="tm-dg-control" type="date" data-fld="date" value="' + U.escapeHtml(s.date) + '">') +
        field('Ders Saati', '<select class="tm-dg-control" data-fld="start">' + slots.map(function (t) { return opt(t, t + '–' + (Rules ? Rules.addMinutes(t, 50) : t), t === s.startTime); }).join('') + '</select>') +
        field('Ders Türü', '<select class="tm-dg-control" data-fld="lt">' + lessonTypes.map(function (lt) { return opt(lt.id, lt.name, lt.id === s.lessonTypeId); }).join('') + '</select>') +
        field('Sınıf', '<select class="tm-dg-control" data-fld="grade">' + grades.map(function (g) { return opt(g, g, g === s.gradeLevel); }).join('') + '</select>') +
        field('PDR Öğretmeni', '<select class="tm-dg-control" data-fld="pdr">' + teacherOpts(pdrTeachers, s.pdrTeacherId) + '</select>') +
        field('Branş Öğretmeni', '<select class="tm-dg-control" data-fld="branch">' + teacherOpts(branchTeachers, s.branchTeacherId) + '</select>') +
        field('Değişiklik nedeni <span class="tm-req">*</span>', '<input class="tm-dg-control" type="text" data-fld="reason" placeholder="Zorunlu">') +
        '</div>';
    }

    function participantsHtml() {
      var resv = Store.getReservationsForSession(sessionId).filter(function (r) { return r.status !== 'cancelled'; });
      var list = resv.map(function (r) {
        var st = Store.getStudentById(r.studentId);
        return '<li class="tm-edit-part"><span>' + U.escapeHtml(st ? U.fullName(st.firstName, st.lastName) : '—') +
          (st && st.grade ? ' · ' + U.escapeHtml(st.grade) : '') + '</span>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon tm-btn--danger" data-remove-part="' + r.id + '" title="Katılımcıyı çıkar" aria-label="Katılımcıyı çıkar">' + X_ICON + '</button></li>';
      }).join('');
      var eligible = Store.getEligibleStudentsForSession ? Store.getEligibleStudentsForSession(sessionId) : [];
      var add = eligible.length
        ? '<div class="tm-edit-addpart"><select class="tm-dg-control" data-add-part>' + eligible.map(function (st) { return opt(st.id, U.fullName(st.firstName, st.lastName) + (st.grade ? ' · ' + st.grade : '')); }).join('') + '</select>' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-part-btn>Ekle</button></div>'
        : '<p class="tm-empty" style="margin:6px 0 0">Eklenebilecek uygun öğrenci yok.</p>';
      return '<ul class="tm-edit-partlist">' + (list || '<li class="tm-empty">Katılımcı yok.</li>') + '</ul>' + add;
    }

    var existing = document.getElementById('tmSessionEditModal');
    if (existing) existing.parentNode.removeChild(existing);
    var overlay = document.createElement('div');
    overlay.className = 'tm-crit-overlay is-open';
    overlay.id = 'tmSessionEditModal';
    overlay.innerHTML =
      '<div class="tm-crit-dialog tm-detail-modal" role="dialog" aria-modal="true" aria-label="Ders düzenle">' +
        '<header class="tm-crit-head"><div class="tm-detail-modal-titles">' +
          '<h2 class="tm-crit-title">Ders Düzenle</h2>' +
          '<p class="tm-detail-modal-sub">' + U.escapeHtml(Store.getLessonCode ? Store.getLessonCode(session) : session.id) + '</p>' +
        '</div><button type="button" class="tm-drawer-close" data-close aria-label="Kapat">&times;</button></header>' +
        '<div class="tm-detail-modal-body">' +
          '<div class="tm-detail-section"><h3 class="tm-detail-section-title">Ders Bilgileri</h3><div data-fields></div></div>' +
          '<div class="tm-detail-section"><h3 class="tm-detail-section-title">Katılımcılar</h3><div data-participants></div></div>' +
        '</div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--ghost" data-close>İptal</button>' +
          '<button type="button" class="tm-btn tm-btn--primary" data-save>Kaydet</button></footer>' +
      '</div>';
    document.body.appendChild(overlay);

    var fieldsWrap = overlay.querySelector('[data-fields]');
    var partWrap = overlay.querySelector('[data-participants]');
    function refreshFields() { fieldsWrap.innerHTML = fieldsHtml(Store.getSessionById(sessionId)); }
    function refreshParticipants() { partWrap.innerHTML = participantsHtml(); bindParticipants(); }
    function getReason() { var el = fieldsWrap.querySelector('[data-fld="reason"]'); return el ? el.value.trim() : ''; }

    function bindParticipants() {
      partWrap.querySelectorAll('[data-remove-part]').forEach(function (b) {
        b.addEventListener('click', function () {
          var reason = getReason() || 'Katılımcı listesi düzenlendi.';
          var res = Store.removeStudentFromSession(sessionId, b.getAttribute('data-remove-part'), reason);
          if (!res || !res.ok) { U.notifyError((res && res.error) || 'Katılımcı çıkarılamadı.'); return; }
          refreshParticipants();
          if (window.TMOnSessionChange) window.TMOnSessionChange();
        });
      });
      var addBtn = partWrap.querySelector('[data-add-part-btn]');
      if (addBtn) addBtn.addEventListener('click', function () {
        var sel = partWrap.querySelector('[data-add-part]');
        if (!sel || !sel.value) return;
        var res = Store.addStudentToSession(sessionId, sel.value);
        if (!res || !res.ok) { U.notifyError((res && res.error) || 'Katılımcı eklenemedi.'); return; }
        refreshParticipants();
        if (window.TMOnSessionChange) window.TMOnSessionChange();
      });
    }

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);

    function save() {
      var reason = getReason();
      if (!reason) { U.notifyError('Değişiklik nedeni zorunludur.'); return; }
      var s = Store.getSessionById(sessionId);
      var g = function (f) { var el = fieldsWrap.querySelector('[data-fld="' + f + '"]'); return el ? el.value : ''; };
      var steps = [];
      if (g('pdr') && g('pdr') !== s.pdrTeacherId) steps.push(function () { return Store.changeSessionPdrTeacher(sessionId, g('pdr'), reason); });
      if (g('branch') && g('branch') !== s.branchTeacherId) steps.push(function () { return Store.changeSessionBranchTeacher(sessionId, g('branch'), reason); });
      if (g('grade') && g('grade') !== s.gradeLevel) steps.push(function () { return Store.changeSessionGradeLevel(sessionId, g('grade'), reason); });
      if (g('lt') && g('lt') !== s.lessonTypeId) steps.push(function () { return Store.changeSessionLessonType(sessionId, g('lt'), reason); });
      if ((g('date') && g('date') !== s.date) || (g('start') && g('start') !== s.startTime)) {
        steps.push(function () { return Store.rescheduleSession(sessionId, g('date') || s.date, g('start') || s.startTime, reason); });
      }
      if (!steps.length) { close(); return; }
      var errors = [];
      steps.forEach(function (fn) { var r = fn(); if (!r || !r.ok) errors.push(r && r.error ? r.error : 'Bilinmeyen hata'); });
      if (window.TMOnSessionChange) window.TMOnSessionChange(); else render();
      if (errors.length) {
        U.notifyError('Bazı değişiklikler uygulanamadı: ' + errors.join(' | '));
        refreshFields();
      } else {
        U.notifySuccess('Ders bilgileri güncellendi.');
        close();
      }
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-close]')) close();
      else if (e.target.closest('[data-save]')) save();
    });

    refreshFields();
    refreshParticipants();
  }


  function rowHtml(r) {
    var s = r.session;
    return '<tr data-id="' + s.id + '" style="cursor:pointer">' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(r.lessonCode) + '</code></td>' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(String(r.meetingId)) + '</code></td>' +
      '<td>' + U.formatDateKey(s.date) + '</td>' +
      '<td>' + s.startTime + '–' + s.endTime + '</td>' +
      '<td>' + U.escapeHtml(r.lessonName) + '</td>' +
      '<td>' + U.escapeHtml(r.gradeLevel) + '</td>' +
      '<td>' + U.escapeHtml(r.pdrTeacherName) + (r.missingTeachers && !s.pdrTeacherId ? ' <span class="tm-badge tm-badge--warn">Eksik</span>' : '') + '</td>' +
      '<td>' + U.escapeHtml(r.branchTeacherName) + (r.missingTeachers && !s.branchTeacherId ? ' <span class="tm-badge tm-badge--warn">Eksik</span>' : '') + '</td>' +
      '<td>' + r.capacity + '</td><td>' + r.enrolled + '</td><td>' + r.remaining + '</td>' +
      '<td>' + SL.sessionBadge(s.status) + '</td>' +
      '<td style="white-space:nowrap">' + actionCell(s) + '</td></tr>';
  }

  function cardHtml(r) {
    var s = r.session;
    return '<article class="tm-list-card" data-id="' + s.id + '">' +
      '<div class="tm-list-card-head">' +
        '<div><strong>' + U.formatDateKey(s.date) + ' · ' + s.startTime + '–' + s.endTime + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(r.lessonCode) + '</code></div>' +
        SL.sessionBadge(s.status) +
      '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(r.lessonName) + ' · ' + U.escapeHtml(r.gradeLevel) + '</div>' +
        '<div><span class="tm-list-card-label">PDR</span> ' + U.escapeHtml(r.pdrTeacherName) + '</div>' +
        '<div><span class="tm-list-card-label">Branş</span> ' + U.escapeHtml(r.branchTeacherName) + '</div>' +
        '<div><span class="tm-list-card-label">Kapasite</span> ' + r.enrolled + '/' + r.capacity + ' · boş ' + r.remaining + '</div>' +
        '<div><span class="tm-list-card-label">Meeting ID</span> <code class="tm-res-code-cell">' + U.escapeHtml(String(r.meetingId)) + '</code></div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' + actionCell(s) + '</div>' +
    '</article>';
  }

  function bindRowActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-detail'));
      });
    });
    root.querySelectorAll('[data-edit-session]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openEditSessionModal(btn.getAttribute('data-edit-session'));
      });
    });
    root.querySelectorAll('[data-cancel-session]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        confirmCancelSession(btn.getAttribute('data-cancel-session'));
      });
    });
    root.querySelectorAll('tr[data-id], .tm-list-card[data-id]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) return;
        if (window.TMSessionDetail) window.TMSessionDetail.open(el.getAttribute('data-id'));
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmSessionsLoading');
    var wrap = document.getElementById('tmSessionsTableWrap');
    try {
      var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
      var all = filtered();
      var p = U.paginate(all, page, pageSize);
      if (countEl) countEl.textContent = p.total + ' ders';
      tbody.innerHTML = p.items.map(rowHtml).join('');
      if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
      U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
      bindRowActions(tbody);
      bindRowActions(cardsEl);
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
      if (cardsEl) cardsEl.hidden = false;
      if (paginationEl) paginationEl.hidden = p.pages <= 1;
      if (window.TMPermissions && window.TMPermissions.applyPageChrome) {
        window.TMPermissions.applyPageChrome(tbody);
      }
      renderFilterHint();
    } catch (err) {
      if (loading) loading.textContent = 'Liste yüklenemedi: ' + err.message;
      console.error(err);
    }
  }

  function onFilterChange() { page = 1; render(); }

  if (searchInput) searchInput.addEventListener('input', U.debounce(onFilterChange, 200));
  [statusFilter, typeFilter, pdrTeacherFilter, branchTeacherFilter, dateFromInput, dateToInput, linkFilter,
    pdrInformedFilter, branchInformedFilter, missingTeacherFilter, sortSelect, pageSizeSelect].forEach(function (el) {
    if (el) el.addEventListener('change', onFilterChange);
  });
  if (exportBtn && Export) {
    exportBtn.addEventListener('click', function () {
      if (window.TMPermissions && !window.TMPermissions.guard('export')) return;
      Export.exportTable('deneme-dersleri.csv', filtered().map(function (r) { return r.session; }), [
        { key: 'id', label: 'ID' },
        { key: 'date', label: 'Tarih' },
        { key: 'startTime', label: 'Başlangıç' },
        { key: 'status', label: 'Durum', value: function (s) { return SL.sessionLabel(s.status); } }
      ]);
    });
  }

  var createBtn = document.getElementById('tmSessionsCreate');
  if (createBtn) {
    createBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openCreateSessionModal();
    });
  }

  window.TMOnSessionChange = function () {
    populateTeacherFilters();
    render();
  };
  populateTeacherFilters();
  initFromUrl();
  render();
  var openSessionId = U.qs('id');
  if (openSessionId && window.TMSessionDetail) window.TMSessionDetail.open(openSessionId);
})();
