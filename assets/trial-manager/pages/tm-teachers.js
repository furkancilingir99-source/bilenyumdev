/**
 * Öğretmen uygunluğu — salt okunur profil, operasyonel notlar
 */
(function () {
  'use strict';

  var Store = (window.TMBridge && window.TMBridge.store()) || window.TMStore;
  var U = window.TMUtils;
  var SL = window.TMStatusLabels;
  var Drawer = window.TMDetailDrawer;
  var Export = window.TMExportUtils;
  var QuickMsg = window.TMQuickMessage;
  var Form = window.TMFormDialog;
  var Perms = window.TMPermissions;
  if (!Store) return;

  var tbody = document.getElementById('tmTeachersBody');
  var cardsEl = document.getElementById('tmTeachersCards');
  var searchInput = document.getElementById('tmTeachersSearch');
  var countEl = document.getElementById('tmTeachersCount');
  var paginationEl = document.getElementById('tmTeachersPagination');
  var pageSizeSelect = document.getElementById('tmTeachersPageSize');
  var exportBtn = document.getElementById('tmTeachersExport');
  var typeFilter = document.getElementById('tmTeachersType');
  var branchFilter = document.getElementById('tmTeachersBranch');
  var page = 1;
  var today = Store.todayKey();

  function isPdrTeacher(t) {
    return t.teacherType === 'pdr_teacher' || t.teacherType === 'pdr';
  }

  var CAL_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';
  var EYE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  // Öğretmen görünen ID'si — tipe göre benzersiz (pdr/branş) kod.
  function teacherCode(t) {
    var m = String(t.id || '').match(/(\d+)\s*$/);
    var num = m ? m[1].padStart(4, '0') : '0000';
    return 'tt-' + (isPdrTeacher(t) ? 'pdr' : 'brans') + '-' + num;
  }

  function sessionInformedForTeacher(s, teacherId) {
    if (s.pdrTeacherId === teacherId) return !!s.pdrTeacherInformed;
    if (s.branchTeacherId === teacherId) return !!s.branchTeacherInformed;
    return false;
  }

  function branchLabel(t) {
    if (isPdrTeacher(t)) return 'Veli sunumu (PDR)';
    return t.branchLessonTypeIds.map(function (id) {
      var lt = Store.getLessonTypeById(id);
      return lt ? lt.name : id;
    }).join(', ');
  }

  function dayOfWeek(dateStr) {
    var p = dateStr.split('-');
    return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getDay();
  }

  function openOperationalNotes(t) {
    if (!Form || !Perms.guard('editTeacherOperational')) return;
    Form.open({
      title: 'Operasyon notları',
      description: 'Öğretmen profil bilgileri Ana Admin Panel\'den gelir. Yalnızca deneme dersi operasyon notları düzenlenebilir.',
      fields: [
        { type: 'textarea', name: 'informedNote', label: 'Bilgilendirme notu', value: t.informedNote || '', rows: 2 },
        { type: 'textarea', name: 'trialLessonNotes', label: 'Deneme dersi özel notu', value: t.trialLessonNotes || '', rows: 3 }
      ],
      onSubmit: function (data) {
        var result = Store.updateTeacherOperationalNotes(t.id, data);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Operasyon notları kaydedildi.');
          openDetail(result.teacher);
          render();
        }
      }
    });
  }

  // Öğretmen değişiklik geçmişi — atandığı dersler + öğretmen değişimi denetim kayıtları.
  function userNameById(id) { var u = (Store.getUsers ? Store.getUsers() : []).find(function (x) { return x.id === id; }); return u ? U.fullName(u.firstName, u.lastName) : 'Sistem'; }
  function auditVal(v) { return (v === undefined || v === null || v === '') ? '—' : String(v); }
  function historyTable(logs) {
    if (!logs.length) return '<p class="tm-empty">Değişiklik geçmişi yok.</p>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.escapeHtml(U.formatDateTime(l.createdAt)) + '</td>' +
        '<td>' + U.escapeHtml(userNameById(l.createdByUserId)) + '</td>' +
        '<td>' + U.escapeHtml(l.description || (SL.AUDIT_ACTION[l.action] || l.action)) + (l.reason ? '<span class="tm-audit-reason">Neden: ' + U.escapeHtml(l.reason) + '</span>' : '') + '</td>' +
        '<td><span class="tm-audit-old">' + U.escapeHtml(auditVal(l.previousValue)) + '</span></td>' +
        '<td><span class="tm-audit-new">' + U.escapeHtml(auditVal(l.newValue)) + '</span></td></tr>';
    }).join('');
    return '<table class="tm-inner-table tm-upcoming-table tm-fixed-table"><colgroup>' +
      '<col style="width:16%"><col style="width:20%"><col style="width:32%"><col style="width:16%"><col style="width:16%"></colgroup>' +
      '<thead><tr><th>Tarih &amp; Saat</th><th>Değişikliği Yapan</th><th>Değişiklik</th><th>Eski Durum</th><th>Yeni Durum</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  function teacherHistory(teacher) {
    var ev = [];
    Store.getSessionsForTeacher(teacher.id).filter(function (s) { return s.status !== 'cancelled'; }).forEach(function (s) {
      var role = s.pdrTeacherId === teacher.id ? 'PDR' : 'Branş';
      var code = Store.getLessonCode ? Store.getLessonCode(s) : s.id;
      ev.push({ createdAt: s.createdAt, createdByUserId: s.createdByUserId, description: role + ' öğretmeni olarak derse atandı (' + code + ' · ' + U.formatDateKey(s.date) + ' ' + s.startTime + ').', previousValue: '—', newValue: 'Atandı' });
    });
    Store.getAuditLogs().filter(function (l) { return l.relatedTeacherIds && l.relatedTeacherIds.indexOf(teacher.id) >= 0; }).forEach(function (l) { ev.push(l); });
    ev.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    return ev;
  }

  function openDetail(t, startTab) {
    if (!Drawer) return;
    var teacher = Store.getTeacherById(t.id) || t;
    var sessions = Store.getSessionsForTeacher(teacher.id);
    var upcoming = sessions.filter(function (s) { return s.date >= today && s.status !== 'cancelled'; });
    var todaySessions = sessions.filter(function (s) { return s.date === today && s.status !== 'cancelled'; });
    var trialSessions = sessions.filter(function (s) { return s.status !== 'cancelled'; });
    Drawer.open({
      title: U.fullName(teacher.firstName, teacher.lastName),
      subtitle: branchLabel(teacher) + ' · ' + SL.teacherTypeLabel(teacher.teacherType),
      activeTab: startTab || 0,
      tabs: [
        { label: 'Bilgi' },
        { label: 'Yaklaşan dersler' },
        { label: 'Verdiği Dersler' },
        { label: 'Geçmiş' }
      ],
      onTab: function (idx, body) {
        if (idx === 0) {
          var isPdr = isPdrTeacher(teacher);
          var unit = isPdr ? 'veli sunumu' : 'deneme dersi';
          function cell(label, value) {
            return '<div><div class="tm-detail-cell-label">' + label + '</div><div class="tm-detail-cell-value">' + value + '</div></div>';
          }
          var notes = '';
          if (teacher.informedNote) notes += cell('Bilgilendirme notu', U.escapeHtml(teacher.informedNote));
          if (teacher.trialLessonNotes) notes += cell('Deneme dersi notu', U.escapeHtml(teacher.trialLessonNotes));
          body.innerHTML =
            '<div class="tm-detail-section"><h3 class="tm-detail-section-title">Öğretmen Bilgileri</h3>' +
              '<div class="tm-detail-grid">' +
                cell('Öğretmen Adı ve Soyadı', U.escapeHtml(U.fullName(teacher.firstName, teacher.lastName))) +
                cell('Telefon No', U.escapeHtml(teacher.phone || '—')) +
                cell('E-posta', U.escapeHtml(teacher.email || '—')) +
                cell('Öğretmen Tipi', SL.teacherTypeBadge(teacher.teacherType || 'branch')) +
                cell('Branş', U.escapeHtml(branchLabel(teacher))) +
              '</div></div>' +
            '<div class="tm-detail-section"><h3 class="tm-detail-section-title">Performans</h3>' +
              '<div class="tm-detail-grid">' +
                cell('Bugünkü ' + (isPdr ? 'veli sunumu' : 'ders'), todaySessions.length + ' ' + unit) +
                cell('Bu hafta verilen ' + (isPdr ? 'veli sunumu' : 'ders'), weekCount(teacher.id) + ' ' + unit) +
                cell('Toplam ' + (isPdr ? 'veli sunumu' : 'deneme dersi'), trialSessions.length + ' ' + unit) +
              '</div></div>' +
            (notes ? '<div class="tm-detail-section"><h3 class="tm-detail-section-title">Notlar</h3><div class="tm-detail-grid">' + notes + '</div></div>' : '');
        } else if (idx === 1) {
          body.innerHTML = upcoming.length
            ? '<table class="tm-inner-table tm-upcoming-table"><thead><tr>' +
                '<th>Ders Tarihi</th><th>Ders Türü</th><th>Kontenjan</th><th>Link Durumu</th>' +
              '</tr></thead><tbody>' + upcoming.map(function (s) {
                var lt = Store.getLessonTypeById(s.lessonTypeId);
                // Bilgilendirme durumu — bu öğretmen için (PDR ya da branş). Tamamlanan derste
                // seed kuralı gereği daima bilgilendirilmiş olur; veri her yerde tutarlı.
                var informed = s.status === 'completed' || sessionInformedForTeacher(s, teacher.id);
                var linkBadge = informed
                  ? '<span class="tm-badge tm-badge--green">Bilgilendirildi</span>'
                  : '<span class="tm-badge tm-badge--orange">Bilgilendirilmedi</span>';
                return '<tr data-session-row="' + s.id + '" style="cursor:pointer">' +
                  '<td>' + U.formatDateKey(s.date) + ' ' + s.startTime + '</td>' +
                  '<td>' + (lt ? lt.name : '') + '</td>' +
                  '<td>' + s.enrolledStudentIds.length + '/' + (s.capacity || 20) + '</td>' +
                  '<td>' + linkBadge + '</td></tr>';
              }).join('') + '</tbody></table>'
            : '<p class="tm-empty">Yaklaşan ders yok.</p>';
          body.querySelectorAll('[data-session-row]').forEach(function (row) {
            row.addEventListener('click', function () {
              if (!window.TMSessionDetail) return;
              // Ders detayından "Geri Dön" ile öğretmen drawer'ının "Yaklaşan dersler" sekmesine dön.
              window.TMSessionDetail.open(row.getAttribute('data-session-row'), 0, {
                onBack: function () { openDetail(teacher, 1); },
                backLabel: '&larr; Öğretmene dön'
              });
            });
          });
        } else if (idx === 2) {
          // Verdiği Dersler — öğretmene atanmış tüm dersler (iptaller hariç), tarihe göre.
          var given = trialSessions.slice().sort(function (a, b) {
            return a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date);
          });
          body.innerHTML = given.length
            ? '<table class="tm-inner-table tm-upcoming-table"><thead><tr>' +
                '<th>Ders ID</th><th>Meeting ID</th><th>Tarih</th><th>Saat</th><th>Ders Türü</th><th>Sınıf</th>' +
              '</tr></thead><tbody>' + given.map(function (s) {
                var lt = Store.getLessonTypeById(s.lessonTypeId);
                var meeting = Store.getMeetingBySessionId ? Store.getMeetingBySessionId(s.id) : null;
                return '<tr data-session-row="' + s.id + '" style="cursor:pointer">' +
                  '<td><code class="tm-res-code-cell">' + U.escapeHtml(Store.getLessonCode ? Store.getLessonCode(s) : s.id) + '</code></td>' +
                  '<td><code class="tm-res-code-cell">' + U.escapeHtml(meeting && meeting.meetingId ? meeting.meetingId : '—') + '</code></td>' +
                  '<td>' + U.formatDateKey(s.date) + '</td>' +
                  '<td>' + s.startTime + '–' + s.endTime + '</td>' +
                  '<td>' + (lt ? lt.name : '—') + '</td>' +
                  '<td>' + U.escapeHtml(s.gradeLevel || '—') + '</td></tr>';
              }).join('') + '</tbody></table>'
            : '<p class="tm-empty">Atanmış ders yok.</p>';
          body.querySelectorAll('[data-session-row]').forEach(function (row) {
            row.addEventListener('click', function () {
              if (!window.TMSessionDetail) return;
              // Ders detayından "Geri Dön" ile öğretmenin "Verdiği Dersler" sekmesine dön.
              window.TMSessionDetail.open(row.getAttribute('data-session-row'), 0, {
                onBack: function () { openDetail(teacher, 2); },
                backLabel: '&larr; Öğretmene dön'
              });
            });
          });
        } else if (idx === 3) {
          body.innerHTML = historyTable(teacherHistory(teacher));
        }
        if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
      }
    });
  }

  function renderAvailabilityTab(body, teacher) {
    var shortDays = ['Paz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    var slots = (teacher.availability || []).slice().sort(function (a, b) { return a.dayOfWeek - b.dayOfWeek; });
    body.innerHTML =
      '<p class="tm-form-desc">Müsaitlik bilgileri Ana Admin Panel\'den gelir; bu ekranda düzenlenemez.</p>' +
      '<div class="tm-detail-actions" style="margin-bottom:12px"><button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-open-calendar="' + teacher.id + '">Haftalık takvimi aç</button></div>' +
      '<table class="tm-inner-table"><thead><tr><th>Gün</th><th>Saat</th><th>Durum</th></tr></thead><tbody>' +
      slots.map(function (a) {
        return '<tr><td>' + shortDays[a.dayOfWeek] + '</td><td>' + a.startTime + '–' + a.endTime + '</td><td>' + (a.isAvailable ? 'Müsait' : 'Değil') + '</td></tr>';
      }).join('') +
      '</tbody></table>';
    var calBtn = body.querySelector('[data-open-calendar]');
    if (calBtn) calBtn.addEventListener('click', function () {
      if (window.TMTeacherCalendar) window.TMTeacherCalendar.open(teacher.id);
    });
  }

  function filtered() {
    var type = typeFilter ? typeFilter.value : 'all';
    var branch = branchFilter ? branchFilter.value : 'all';
    return U.filterSearch(Store.getTeachers(), searchInput ? searchInput.value : '', function (t) {
      return t.firstName + ' ' + t.lastName + ' ' + branchLabel(t);
    }).filter(function (t) {
      if (type === 'pdr' && !isPdrTeacher(t)) return false;
      if (type === 'branch' && isPdrTeacher(t)) return false;
      // Branş filtresi: seçilen ders türünü veren öğretmenler (PDR'nin branşı olmadığı için hariç).
      if (branch !== 'all' && (t.branchLessonTypeIds || []).indexOf(branch) < 0) return false;
      return true;
    });
  }

  function weekCount(teacherId) {
    var d = new Date();
    var weekEnd = new Date(d);
    weekEnd.setDate(d.getDate() + 7);
    var endKey = weekEnd.toISOString().slice(0, 10);
    return Store.getSessionsForTeacher(teacherId).filter(function (s) {
      return s.date >= today && s.date <= endKey && s.status !== 'cancelled';
    }).length;
  }

  function actionIcons(t) {
    return '<span class="tm-row-actions">' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-cal="' + t.id + '" title="Program" aria-label="Program">' + CAL_ICON + '</button>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + t.id + '" title="Detay" aria-label="Detay">' + EYE_ICON + '</button>' +
    '</span>';
  }

  // Öğretmenin verdiği toplam deneme dersi sayısı (iptal edilenler hariç, atanmış tüm dersler).
  function trialLessonCount(teacherId) {
    return Store.getSessionsForTeacher(teacherId).filter(function (s) { return s.status !== 'cancelled'; }).length;
  }

  function rowHtml(t) {
    return '<tr data-id="' + t.id + '" style="cursor:pointer">' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(teacherCode(t)) + '</code></td>' +
      '<td>' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</td>' +
      '<td>' + SL.teacherTypeBadge(t.teacherType || 'branch') + '</td>' +
      '<td>' + U.escapeHtml(branchLabel(t)) + '</td>' +
      '<td>' + U.escapeHtml(t.phone) + '</td>' +
      '<td>' + U.escapeHtml(t.email || '—') + '</td>' +
      '<td>' + trialLessonCount(t.id) + '</td>' +
      '<td style="white-space:nowrap">' + actionIcons(t) + '</td></tr>';
  }

  function cardHtml(t) {
    return '<article class="tm-list-card" data-id="' + t.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(teacherCode(t)) + '</code></div>' +
      SL.teacherTypeBadge(t.teacherType || 'branch') + '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Branş</span> ' + U.escapeHtml(branchLabel(t)) + '</div>' +
        '<div><span class="tm-list-card-label">E-posta</span> ' + U.escapeHtml(t.email || '—') + '</div>' +
        '<div><span class="tm-list-card-label">Deneme dersi sayısı</span> ' + trialLessonCount(t.id) + '</div>' +
      '</div>' +
      '<div class="tm-list-card-foot">' + actionIcons(t) + '</div>' +
    '</article>';
  }

  function bindRowActions() {
    [tbody, cardsEl].forEach(function (root) {
      if (!root) return;
      root.querySelectorAll('[data-detail]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openDetail(Store.getTeacherById(btn.getAttribute('data-detail')));
        });
      });
      root.querySelectorAll('[data-cal]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (window.TMTeacherCalendar) window.TMTeacherCalendar.open(btn.getAttribute('data-cal'));
        });
      });
      root.querySelectorAll('tr[data-id], .tm-list-card[data-id]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          openDetail(Store.getTeacherById(el.getAttribute('data-id')));
        });
      });
    });
  }

  function render() {
    if (!tbody) return;
    var loading = document.getElementById('tmTeachersLoading');
    var wrap = document.getElementById('tmTeachersTableWrap');
    try {
      var pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : '10', 10);
      var p = U.paginate(filtered(), page, pageSize);
      if (countEl) countEl.textContent = p.total + ' öğretmen';
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
  // PDR öğretmeninin branşı olmadığı için Tip=PDR seçilince Branş filtresi kapatılır.
  function syncBranchFilterState() {
    if (!branchFilter) return;
    if (typeFilter && typeFilter.value === 'pdr') {
      branchFilter.value = 'all';
      branchFilter.disabled = true;
    } else {
      branchFilter.disabled = false;
    }
  }
  if (typeFilter) typeFilter.addEventListener('change', function () { syncBranchFilterState(); page = 1; render(); });
  if (branchFilter) branchFilter.addEventListener('change', function () { page = 1; render(); });
  syncBranchFilterState();
  if (pageSizeSelect) pageSizeSelect.addEventListener('change', function () { page = 1; render(); });
  if (exportBtn && Export) exportBtn.addEventListener('click', function () {
    if (Perms && !Perms.guard('export')) return;
    Export.exportTable('ogretmen-uygunluk.csv', filtered(), [{ key: 'firstName', label: 'Ad' }, { key: 'email', label: 'E-posta' }]);
  });
  window.TMOnSessionChange = render;
  render();
  var openId = U.qs('id');
  if (openId) {
    var openT = Store.getTeacherById(openId);
    if (openT) openDetail(openT);
  }
})();
