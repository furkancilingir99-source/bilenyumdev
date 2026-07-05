/**
 * Deneme dersi öğrenci takip ekranı
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Export = window.TMExportUtils;
  var Drawer = window.TMDetailDrawer;
  var Form = window.TMFormDialog;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmStudentsBody');
  var cardsEl = document.getElementById('tmStudentsCards');
  var searchInput = document.getElementById('tmStudentsSearch');
  var countEl = document.getElementById('tmStudentsCount');
  var paginationEl = document.getElementById('tmStudentsPagination');
  var pageSizeSelect = document.getElementById('tmStudentsPageSize');
  var exportBtn = document.getElementById('tmStudentsExport');
  var page = 1;

  function currentReservation(studentId) {
    var res = Store.getReservationsForStudent(studentId).filter(function (r) {
      return r.status === 'confirmed' || r.status === 'pending';
    });
    return res[0] || null;
  }

  function openCorrectStudent(st) {
    if (!Form || !Perms.guard('editApplicationStudent')) return;
    Form.open({
      title: 'Başvuru öğrenci bilgisini düzelt',
      description: 'Başvuru formundan gelen bilgilerde operasyonel düzeltme. Ders türü değişirse uyumluluk kontrolleri yapılır.',
      fields: [
        { type: 'text', name: 'firstName', label: 'Ad', value: st.firstName, required: true },
        { type: 'text', name: 'lastName', label: 'Soyad', value: st.lastName, required: true },
        { type: 'text', name: 'age', label: 'Yaş', value: String(st.age) },
        {
          type: 'select',
          name: 'grade',
          label: 'Sınıf',
          value: st.grade,
          options: Store.getGrades().map(function (g) { return { value: g, label: g }; })
        },
        {
          type: 'select',
          name: 'level',
          label: 'Seviye',
          value: st.level,
          options: Store.getLevels().map(function (l) { return { value: l, label: l }; })
        },
        {
          type: 'select',
          name: 'requestedLessonTypeId',
          label: 'İstenen ders türü',
          value: st.requestedLessonTypeId,
          options: Store.getLessonTypes().map(function (lt) { return { value: lt.id, label: lt.name }; })
        },
        { type: 'textarea', name: 'notes', label: 'Operasyon notu', value: st.notes || '', rows: 3 }
      ],
      onSubmit: function (data) {
        var result = Store.updateApplicationStudentInfo(st.id, data);
        if (!result.ok) {
          U.notifyError(result.error);
          return;
        }
        if (result.warnings && result.warnings.length) {
          result.warnings.forEach(function (w) { if (U.notifyError) U.notifyError(w); });
        }
        U.notifySuccess('Başvuru öğrenci bilgisi güncellendi.');
        if (window.TMOnSessionChange) window.TMOnSessionChange();
        openDetail(result.student);
        render();
      }
    });
  }

  function openDetail(st) {
    if (!Drawer) return;
    var student = Store.getStudentById(st.id) || st;
    var lt = Store.getLessonTypeById(student.requestedLessonTypeId);
    var parents = student.parentIds.map(function (pid) { return Store.getParentById(pid); }).filter(Boolean);
    var resHistory = Store.getReservationsForStudent(student.id);
    var reqId = student.applicationRequestId;
    Drawer.open({
      title: U.fullName(student.firstName, student.lastName),
      subtitle: student.grade + ' · ' + (lt ? lt.name : ''),
      tabs: [{ label: 'Başvuru' }, { label: 'Rezervasyonlar' }, { label: 'İletişim' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          body.innerHTML =
            '<p class="tm-source-notice">' + SL.dataSourceBadge(student.source || 'trial_lesson_application') + '</p>' +
            '<div class="tm-detail-actions tm-detail-actions--wrap" style="margin-bottom:12px">' +
              (reqId ? '<a class="tm-btn tm-btn--sm tm-btn--ghost" href="deneme-dersi-yoneticisi-rezervasyonlar.html?id=' + encodeURIComponent(reqId) + '">Başvuru detayı</a> ' : '') +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-correct-student data-tm-require="edit-application-student">Başvuru bilgisini düzelt</button> ' +
              (student.status === 'attended' || student.status === 'confirmed' ?
                '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-enroll="' + student.id + '" data-tm-require="edit">Kayıt oldu</button>' : '') +
            '</div>' +
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Ad soyad</div><div class="tm-detail-cell-value">' + U.escapeHtml(U.fullName(student.firstName, student.lastName)) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Yaş</div><div class="tm-detail-cell-value">' + student.age + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Sınıf / Seviye</div><div class="tm-detail-cell-value">' + U.escapeHtml(student.grade) + ' · ' + U.escapeHtml(student.level) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">İstenen ders</div><div class="tm-detail-cell-value">' + (lt ? lt.name : '—') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Durum</div><div class="tm-detail-cell-value">' + SL.studentBadge(student.status) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Veli</div><div class="tm-detail-cell-value">' + parents.map(function (p) {
              return '<a class="tm-panel-link" href="deneme-dersi-yoneticisi-veliler.html?id=' + encodeURIComponent(p.id) + '">' + U.escapeHtml(U.fullName(p.firstName, p.lastName)) + '</a>';
            }).join(', ') + '</div></div>' +
            (student.notes ? '<div><div class="tm-detail-cell-label">Operasyon notu</div><div class="tm-detail-cell-value">' + U.escapeHtml(student.notes) + '</div></div>' : '') +
            '</div>';
          body.querySelector('[data-correct-student]') && body.querySelector('[data-correct-student]').addEventListener('click', function () {
            openCorrectStudent(Store.getStudentById(student.id) || student);
          });
          body.querySelector('[data-enroll]') && body.querySelector('[data-enroll]').addEventListener('click', function () {
            if (!Perms.guard('edit')) return;
            var result = Store.convertStudentToEnrollment(student.id);
            if (!result.ok) U.notifyError(result.error);
            else {
              U.notifySuccess('Öğrenci kayda dönüştürüldü.');
              if (window.TMOnSessionChange) window.TMOnSessionChange();
              render();
            }
          });
          if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
        } else if (idx === 1) {
          body.innerHTML = resHistory.length ? '<table class="tm-inner-table"><thead><tr><th>Rezervasyon</th><th>Durum</th><th>Link</th><th></th></tr></thead><tbody>' +
            resHistory.map(function (r) {
              var s = Store.getSessionById(r.sessionId);
              return '<tr><td>' + (s ? U.formatDateKey(s.date) + ' ' + s.startTime : r.sessionId) + '</td><td>' + SL.reservationBadge(r.status) + '</td><td>' + (r.linkSent ? 'Evet' : 'Hayır') + '</td><td>' +
                (s ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-open-session="' + s.id + '">Ders</button>' : '') + '</td></tr>';
            }).join('') + '</tbody></table>' : '<p class="tm-empty">Rezervasyon yok.</p>';
          body.querySelectorAll('[data-open-session]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              if (window.TMSessionDetail) window.TMSessionDetail.open(btn.getAttribute('data-open-session'));
            });
          });
        } else {
          var logs = Store.getCommunicationLogs().filter(function (l) { return l.studentId === student.id; });
          body.innerHTML = logs.length ? logs.map(function (l) {
            return '<p style="font-size:13px;margin:6px 0">' + U.formatDateTime(l.createdAt) + ' — ' + U.escapeHtml(l.summary) + '</p>';
          }).join('') : '<p class="tm-empty">İletişim kaydı yok.</p>';
        }
      }
    });
  }

  function filtered() {
    return U.filterSearch(Store.getStudents(), searchInput ? searchInput.value : '', function (st) {
      return st.firstName + ' ' + st.lastName + ' ' + st.grade;
    });
  }

  function rowHtml(st) {
    var lt = Store.getLessonTypeById(st.requestedLessonTypeId);
    var pa = st.parentIds[0] ? Store.getParentById(st.parentIds[0]) : null;
    var cur = currentReservation(st.id);
    var sess = cur ? Store.getSessionById(cur.sessionId) : null;
    return '<tr data-id="' + st.id + '" style="cursor:pointer">' +
      '<td>' + U.escapeHtml(U.fullName(st.firstName, st.lastName)) + '</td>' +
      '<td>' + st.age + '</td><td>' + U.escapeHtml(st.grade) + '</td><td>' + U.escapeHtml(st.level) + '</td>' +
      '<td>' + (lt ? lt.name : '—') + '</td>' +
      '<td>' + (pa ? U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) : '—') + '</td>' +
      '<td>' + (pa ? U.escapeHtml(pa.phone) : '—') + '</td>' +
      '<td>' + (sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime : '—') + '</td>' +
      '<td>' + SL.studentBadge(st.status) + '</td>' +
      '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-detail="' + st.id + '">Detay</button></td></tr>';
  }

  function cardHtml(st) {
    var lt = Store.getLessonTypeById(st.requestedLessonTypeId);
    var pa = st.parentIds[0] ? Store.getParentById(st.parentIds[0]) : null;
    var cur = currentReservation(st.id);
    var sess = cur ? Store.getSessionById(cur.sessionId) : null;
    return '<article class="tm-list-card" data-id="' + st.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(U.fullName(st.firstName, st.lastName)) + '</strong></div>' +
      SL.studentBadge(st.status) + '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Sınıf</span> ' + U.escapeHtml(st.grade) + ' · ' + U.escapeHtml(st.level) + '</div>' +
        '<div><span class="tm-list-card-label">Ders</span> ' + U.escapeHtml(lt ? lt.name : '—') + '</div>' +
        '<div><span class="tm-list-card-label">Veli</span> ' + (pa ? U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) : '—') + '</div>' +
        '<div><span class="tm-list-card-label">Rezervasyon</span> ' + (sess ? U.formatDateKey(sess.date) + ' ' + sess.startTime : '—') + '</div>' +
      '</div>' +
      '<div class="tm-list-card-foot"><button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-detail="' + st.id + '">Detay</button></div>' +
    '</article>';
  }

  function bindRowActions() {
    function openStudent(id) { openDetail(Store.getStudentById(id)); }
    [tbody, cardsEl].forEach(function (root) {
      if (!root) return;
      root.querySelectorAll('[data-detail]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openStudent(btn.getAttribute('data-detail'));
        });
      });
      root.querySelectorAll('tr[data-id], .tm-list-card[data-id]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          openStudent(el.getAttribute('data-id'));
        });
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmStudentsLoading');
    var wrap = document.getElementById('tmStudentsTableWrap');
    try {
      var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
      var p = U.paginate(filtered(), page, pageSize);
      if (countEl) countEl.textContent = p.total + ' öğrenci';
      tbody.innerHTML = p.items.map(rowHtml).join('');
      if (cardsEl) cardsEl.innerHTML = p.items.map(cardHtml).join('');
      U.renderPagination(paginationEl, p.page, p.pages, function (np) { page = np; render(); });
      bindRowActions();
      if (loading) loading.hidden = true;
      if (wrap) wrap.hidden = false;
      if (cardsEl) cardsEl.hidden = false;
      if (paginationEl) paginationEl.hidden = p.pages <= 1;
    } catch (err) {
      if (loading) { loading.hidden = false; loading.textContent = 'Liste yüklenemedi: ' + err.message; }
      console.error(err);
    }
  }

  if (searchInput) searchInput.addEventListener('input', U.debounce(function () { page = 1; render(); }, 200));
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) exportBtn.addEventListener('click', function () {
    if (Perms && !Perms.guard('export')) return;
    Export.exportTable('ogrenciler.csv', filtered(), [
      { key: 'firstName', label: 'Ad' }, { key: 'lastName', label: 'Soyad' }, { key: 'grade', label: 'Sınıf' }, { key: 'status', label: 'Durum' }
    ]);
  });
  window.TMOnSessionChange = render;
  render();
  var openId = U.qs('id');
  if (openId) {
    var openSt = Store.getStudentById(openId);
    if (openSt) openDetail(openSt);
  }
})();
