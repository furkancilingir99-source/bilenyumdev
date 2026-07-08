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
      tabs: [{ label: 'Başvuru' }, { label: 'Rezervasyonlar' }],
      onTab: function (idx, body) {
        if (idx === 0) {
          var pa0 = parents[0];
          body.innerHTML =
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Öğrenci Adı</div><div class="tm-detail-cell-value">' + U.escapeHtml(U.fullName(student.firstName, student.lastName)) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Öğrenci ID</div><div class="tm-detail-cell-value"><code class="tm-res-code-cell">' + U.escapeHtml(studentCode(student)) + '</code></div></div>' +
            '<div><div class="tm-detail-cell-label">Sınıf</div><div class="tm-detail-cell-value">' + U.escapeHtml(student.grade) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Ders</div><div class="tm-detail-cell-value">' + U.escapeHtml(lt ? lt.name : '—') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Veli</div><div class="tm-detail-cell-value">' + parents.map(function (p) {
              return '<a class="tm-panel-link" href="deneme-dersi-yoneticisi-veliler.html?id=' + encodeURIComponent(p.id) + '">' + U.escapeHtml(U.fullName(p.firstName, p.lastName)) + '</a>';
            }).join(', ') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Veli Telefon</div><div class="tm-detail-cell-value">' + (pa0 ? U.escapeHtml(pa0.phone) : '—') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Veli E-posta</div><div class="tm-detail-cell-value">' + (pa0 ? U.escapeHtml(pa0.email) : '—') + '</div></div>' +
            (student.notes ? '<div><div class="tm-detail-cell-label">Operasyon notu</div><div class="tm-detail-cell-value">' + U.escapeHtml(student.notes) + '</div></div>' : '') +
            '</div>' +
            '<div style="display:flex;justify-content:center;margin-top:14px">' +
              '<a class="tm-btn tm-btn--primary" href="deneme-dersi-yoneticisi-rezervasyonlar.html' + (reqId ? '?id=' + encodeURIComponent(reqId) : '') + '">Detaylı İncele</a>' +
            '</div>';
          if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
        } else if (idx === 1) {
          body.innerHTML = resHistory.length ? '<table class="tm-inner-table"><thead><tr><th>Atandığı Ders</th><th>Ders ID</th><th>Rezervasyon ID</th><th>Ders Tarihi</th><th>Ders Saati</th><th>İşlem</th></tr></thead><tbody>' +
            resHistory.map(function (r) {
              var s = Store.getSessionById(r.sessionId);
              var lt2 = s ? Store.getLessonTypeById(s.lessonTypeId) : null;
              var code = (s && Store.getLessonCode) ? Store.getLessonCode(s) : (s ? s.id : '—');
              return '<tr data-res-detail="' + r.id + '" style="cursor:pointer">' +
                '<td>' + U.escapeHtml(lt2 ? lt2.name : '—') + '</td>' +
                '<td><code class="tm-res-code-cell">' + U.escapeHtml(code) + '</code></td>' +
                '<td><code class="tm-res-code-cell">' + U.escapeHtml(reservationCode(r)) + '</code></td>' +
                '<td>' + (s ? U.escapeHtml(U.formatDateKey(s.date)) : '—') + '</td>' +
                '<td>' + (s ? U.escapeHtml(s.startTime + '–' + s.endTime) : '—') + '</td>' +
                '<td style="white-space:nowrap"><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-res-detail="' + r.id + '">İncele</button></td>' +
              '</tr>';
            }).join('') + '</tbody></table>' : '<p class="tm-empty">Rezervasyon yok.</p>';
          body.querySelectorAll('button[data-res-detail]').forEach(function (btn) {
            btn.addEventListener('click', function (e) { e.stopPropagation(); showReservationDetail(btn.getAttribute('data-res-detail')); });
          });
          body.querySelectorAll('tr[data-res-detail]').forEach(function (tr) {
            tr.addEventListener('click', function (e) {
              if (e.target.closest('button')) return;
              showReservationDetail(tr.getAttribute('data-res-detail'));
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
    var items = U.filterSearch(Store.getStudents(), searchInput ? searchInput.value : '', function (st) {
      return st.firstName + ' ' + st.lastName + ' ' + st.grade;
    });
    // Alfabetik (ad soyad) sıralama
    return U.sortBy(items, function (st) {
      return U.fullName(st.firstName, st.lastName).toLocaleLowerCase('tr');
    }, 'asc');
  }

  var EDIT_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>';
  function studentCode(st) {
    var m = String(st.id || '').match(/(\d+)\s*$/);
    return 'trialstudent-' + (m ? m[1].padStart(4, '0') : '0000');
  }
  function editBtn(id) {
    return '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + id + '" title="Düzenle" aria-label="Düzenle">' + EDIT_ICON + '</button>';
  }

  function contactBadge(status) {
    if (status === 'positive') return '<span class="tm-badge tm-badge--green">Olumlu</span>';
    if (status === 'negative') return '<span class="tm-badge tm-badge--red">Olumsuz</span>';
    if (status === 'unreachable') return '<span class="tm-badge tm-badge--orange">Ulaşılamadı</span>';
    return '<span class="tm-badge tm-badge--muted">Görüşülmedi</span>';
  }
  function assignmentBadge(done) {
    return done
      ? '<span class="tm-badge tm-badge--green">Yapıldı</span>'
      : '<span class="tm-badge tm-badge--orange">Yapılmadı</span>';
  }
  // Rezervasyon görünen kodu — mümkünse talebin REZTRIAL kodu, değilse rezervasyondan türetilir.
  function reservationCode(r) {
    if (r.requestId && Store.getReservationCode) {
      var c = Store.getReservationCode(r.requestId);
      if (c) return c;
    }
    var s = r.sessionId ? Store.getSessionById(r.sessionId) : null;
    var dateKey = (s && s.date) ? s.date : (r.createdAt ? String(r.createdAt).slice(0, 10) : '');
    var compact = dateKey ? dateKey.replace(/-/g, '') : '00000000';
    var m = String(r.id).match(/(\d+)\s*$/);
    return 'REZTRIAL-' + compact + '-' + (m ? m[1].padStart(4, '0') : '0000');
  }

  function infoCell(label, value) {
    return '<div><div class="tm-detail-cell-label">' + label + '</div><div class="tm-detail-cell-value">' + value + '</div></div>';
  }
  function openInfoModal(title, bodyHtml) {
    var existing = document.getElementById('tmInfoModal');
    if (existing) existing.parentNode.removeChild(existing);
    var overlay = document.createElement('div');
    overlay.className = 'tm-crit-overlay is-open';
    overlay.id = 'tmInfoModal';
    overlay.innerHTML =
      '<div class="tm-crit-dialog" role="dialog" aria-modal="true">' +
        '<header class="tm-crit-head"><h2 class="tm-crit-title">' + title + '</h2></header>' +
        '<div class="tm-crit-body">' + bodyHtml + '</div>' +
        '<footer class="tm-crit-foot"><button type="button" class="tm-btn tm-btn--primary" data-modal-close>Kapat</button></footer>' +
      '</div>';
    document.body.appendChild(overlay);
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay || e.target.closest('[data-modal-close]')) close(); });
    document.addEventListener('keydown', onKey);
  }

  function showReservationDetail(reservationId) {
    var r = Store.getReservationById(reservationId);
    if (!r) return;
    var s = r.sessionId ? Store.getSessionById(r.sessionId) : null;
    var lt = s ? Store.getLessonTypeById(s.lessonTypeId) : (r.lessonTypeId ? Store.getLessonTypeById(r.lessonTypeId) : null);
    var req = r.requestId ? Store.getRequestById(r.requestId) : null;
    var lessonCode = (s && Store.getLessonCode) ? Store.getLessonCode(s) : (s ? s.id : '—');
    var talepTarihi = req && req.createdAt ? U.formatDateTime(req.createdAt) : (r.createdAt ? U.formatDateTime(r.createdAt) : '—');
    var contactStatus = req ? req.contactStatus : undefined;
    var assigned = !!s; // rezervasyon bir derse bağlıysa atama yapılmıştır
    var body = '<div class="tm-detail-grid tm-detail-grid--modal">' +
      infoCell('Talep tarihi', U.escapeHtml(talepTarihi)) +
      infoCell('Rezervasyon Adı', '<code class="tm-res-code-cell">' + U.escapeHtml(reservationCode(r)) + '</code>') +
      infoCell('İstenen Ders', U.escapeHtml(lt ? lt.name : '—')) +
      infoCell('Ders Tarihi', U.escapeHtml(s ? U.formatDateKey(s.date) : '—')) +
      infoCell('Ders Saati', U.escapeHtml(s ? (s.startTime + '–' + s.endTime) : '—')) +
      infoCell('Ders ID', '<code class="tm-res-code-cell">' + U.escapeHtml(lessonCode) + '</code>') +
      infoCell('İletişim Durumu', contactBadge(contactStatus)) +
      infoCell('Ders Ataması', assignmentBadge(assigned)) +
      infoCell('Sınıf', U.escapeHtml(s ? (s.gradeLevel || '—') : '—')) +
    '</div>';
    openInfoModal('Rezervasyon Detayı', body);
  }

  function rowHtml(st) {
    var pa = st.parentIds[0] ? Store.getParentById(st.parentIds[0]) : null;
    return '<tr data-id="' + st.id + '" style="cursor:pointer">' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(studentCode(st)) + '</code></td>' +
      '<td>' + U.escapeHtml(U.fullName(st.firstName, st.lastName)) + '</td>' +
      '<td>' + U.escapeHtml(st.grade) + '</td>' +
      '<td>' + (pa ? U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) : '—') + '</td>' +
      '<td>' + (pa ? U.escapeHtml(pa.phone) : '—') + '</td>' +
      '<td>' + (pa ? U.escapeHtml(pa.email) : '—') + '</td>' +
      '<td style="white-space:nowrap">' + editBtn(st.id) + '</td></tr>';
  }

  function cardHtml(st) {
    var pa = st.parentIds[0] ? Store.getParentById(st.parentIds[0]) : null;
    return '<article class="tm-list-card" data-id="' + st.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(U.fullName(st.firstName, st.lastName)) + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(studentCode(st)) + '</code></div>' +
      editBtn(st.id) + '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Sınıf</span> ' + U.escapeHtml(st.grade) + '</div>' +
        '<div><span class="tm-list-card-label">Veli</span> ' + (pa ? U.escapeHtml(U.fullName(pa.firstName, pa.lastName)) : '—') + '</div>' +
        '<div><span class="tm-list-card-label">Telefon</span> ' + (pa ? U.escapeHtml(pa.phone) : '—') + '</div>' +
        '<div><span class="tm-list-card-label">Veli E-posta</span> ' + (pa ? U.escapeHtml(pa.email) : '—') + '</div>' +
      '</div>' +
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
