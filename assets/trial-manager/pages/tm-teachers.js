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
    return 'trialteacher-' + (isPdrTeacher(t) ? 'pdr' : 'brans') + '-' + num;
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

  function openDetail(t) {
    if (!Drawer) return;
    var teacher = Store.getTeacherById(t.id) || t;
    var sessions = Store.getSessionsForTeacher(teacher.id);
    var upcoming = sessions.filter(function (s) { return s.date >= today && s.status !== 'cancelled'; });
    var todaySessions = sessions.filter(function (s) { return s.date === today && s.status !== 'cancelled'; });
    var trialSessions = sessions.filter(function (s) { return s.status !== 'cancelled'; });
    Drawer.open({
      title: U.fullName(teacher.firstName, teacher.lastName),
      subtitle: branchLabel(teacher) + ' · ' + SL.teacherTypeLabel(teacher.teacherType),
      tabs: [
        { label: 'Bilgi' },
        { label: 'Yaklaşan dersler' },
        { label: 'Müsaitlik' },
        { label: 'Deneme dersleri' },
        { label: 'Bilgilendirme' }
      ],
      onTab: function (idx, body) {
        if (idx === 0) {
          var todayDow = dayOfWeek(today);
          var todaySlots = (teacher.availability || []).filter(function (a) {
            return a.dayOfWeek === todayDow && a.isAvailable;
          });
          var previewText = todaySlots.length
            ? todaySlots.map(function (a) { return a.startTime + '–' + a.endTime; }).join(', ')
            : 'Bugün müsait değil';
          body.innerHTML =
            '<p class="tm-source-notice">' + SL.dataSourceBadge(teacher.source || 'admin_panel') + '</p>' +
            '<div class="tm-detail-actions" style="margin-bottom:12px">' +
              (QuickMsg ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-teacher>WhatsApp</button> ' : '') +
              (teacher.dashboardEnabled ? '<a class="tm-btn tm-btn--sm tm-btn--ghost" href="ogretmen-dashboard.html?tmTeacher=' + encodeURIComponent(teacher.id) + '" target="_blank" rel="noopener">Dashboard önizle</a> ' : '') +
              '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-op-notes data-tm-require="edit-teacher-operational">Operasyon notu</button>' +
            '</div>' +
            '<div class="tm-detail-grid">' +
            '<div><div class="tm-detail-cell-label">Ad soyad</div><div class="tm-detail-cell-value">' + U.escapeHtml(U.fullName(teacher.firstName, teacher.lastName)) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Telefon</div><div class="tm-detail-cell-value">' + U.escapeHtml(teacher.phone) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">E-posta</div><div class="tm-detail-cell-value">' + U.escapeHtml(teacher.email) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Öğretmen tipi</div><div class="tm-detail-cell-value">' + SL.teacherTypeBadge(teacher.teacherType || 'branch') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Branş</div><div class="tm-detail-cell-value">' + U.escapeHtml(branchLabel(teacher)) + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Dashboard</div><div class="tm-detail-cell-value">' + (teacher.dashboardEnabled ? 'Aktif' : 'Kapalı') + '</div></div>' +
            '<div><div class="tm-detail-cell-label">Bugünkü ' + (isPdrTeacher(teacher) ? 'veli sunumu' : 'deneme dersi') + '</div><div class="tm-detail-cell-value">' + todaySessions.length + ' ders</div></div>' +
            '<div><div class="tm-detail-cell-label">Bu hafta ' + (isPdrTeacher(teacher) ? 'veli sunumu' : 'deneme dersi') + '</div><div class="tm-detail-cell-value">' + weekCount(teacher.id) + ' ders</div></div>' +
            '<div><div class="tm-detail-cell-label">Bugün müsaitlik</div><div class="tm-detail-cell-value">' + U.escapeHtml(previewText) + '</div></div>' +
            (teacher.informedNote ? '<div><div class="tm-detail-cell-label">Bilgilendirme notu</div><div class="tm-detail-cell-value">' + U.escapeHtml(teacher.informedNote) + '</div></div>' : '') +
            (teacher.trialLessonNotes ? '<div><div class="tm-detail-cell-label">Deneme dersi notu</div><div class="tm-detail-cell-value">' + U.escapeHtml(teacher.trialLessonNotes) + '</div></div>' : '') +
            '</div>';
          var waBtn = body.querySelector('[data-wa-teacher]');
          if (waBtn && QuickMsg) {
            waBtn.addEventListener('click', function () {
              var next = upcoming[0] || sessions[0];
              var lt = next ? Store.getLessonTypeById(next.lessonTypeId) : null;
              var meeting = next ? Store.getMeetingBySessionId(next.id) : null;
              var base = {
                teacherName: U.fullName(teacher.firstName, teacher.lastName),
                date: next ? U.formatDateKey(next.date) : '—',
                time: next ? next.startTime : '—',
                lessonType: lt ? lt.name : branchLabel(teacher),
                meetingUrl: meeting ? meeting.meetingUrl : '',
                meetingId: meeting ? meeting.meetingId : '',
                passcode: meeting ? meeting.passcode : '',
                phone: teacher.phone,
                email: teacher.email
              };
              if (isPdrTeacher(teacher)) QuickMsg.openForPdrTeacher(base);
              else QuickMsg.openForBranchTeacher(Object.assign(base, {
                studentCount: next ? next.enrolledStudentIds.length : 0
              }));
            });
          }
          body.querySelector('[data-op-notes]') && body.querySelector('[data-op-notes]').addEventListener('click', function () {
            openOperationalNotes(Store.getTeacherById(teacher.id) || teacher);
          });
        } else if (idx === 1) {
          body.innerHTML = upcoming.length ? '<table class="tm-inner-table"><tbody>' + upcoming.map(function (s) {
            var lt = Store.getLessonTypeById(s.lessonTypeId);
            return '<tr data-session-row="' + s.id + '" style="cursor:pointer"><td>' + U.formatDateKey(s.date) + ' ' + s.startTime + '</td><td>' + (lt ? lt.name : '') + '</td><td>' + s.enrolledStudentIds.length + '/20</td><td>' + (sessionInformedForTeacher(s, teacher.id) ? 'Bilgilendirildi' : '—') + '</td></tr>';
          }).join('') + '</tbody></table>' : '<p class="tm-empty">Yaklaşan ders yok.</p>';
          body.querySelectorAll('[data-session-row]').forEach(function (row) {
            row.addEventListener('click', function () {
              if (window.TMSessionDetail) window.TMSessionDetail.open(row.getAttribute('data-session-row'));
            });
          });
        } else if (idx === 2) {
          renderAvailabilityTab(body, teacher);
        } else if (idx === 3) {
          body.innerHTML = trialSessions.length ? '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Ders</th><th>Durum</th><th>Bilgi</th></tr></thead><tbody>' +
            trialSessions.slice(0, 20).map(function (s) {
              var lt = Store.getLessonTypeById(s.lessonTypeId);
              return '<tr data-session-row="' + s.id + '" style="cursor:pointer"><td>' + U.formatDateKey(s.date) + ' ' + s.startTime + '</td><td>' + (lt ? lt.name : '') + '</td><td>' + SL.sessionBadge(s.status) + '</td><td>' + (sessionInformedForTeacher(s, teacher.id) ? '✓' : '—') + '</td></tr>';
            }).join('') + '</tbody></table>' : '<p class="tm-empty">Atanmış deneme dersi yok.</p>';
          body.querySelectorAll('[data-session-row]').forEach(function (row) {
            row.addEventListener('click', function () {
              if (window.TMSessionDetail) window.TMSessionDetail.open(row.getAttribute('data-session-row'));
            });
          });
        } else {
          var informedSessions = sessions.filter(function (s) { return sessionInformedForTeacher(s, teacher.id); });
          var commLogs = Store.getCommunicationLogs().filter(function (l) {
            return l.teacherId === teacher.id || (l.summary && l.summary.indexOf(teacher.lastName) >= 0);
          });
          body.innerHTML =
            '<p class="tm-form-desc">Öğretmen bilgilendirildi işaretleri ders oturumları üzerinden yönetilir.</p>' +
            (informedSessions.length ? '<h4 style="margin:12px 0 6px;font-size:13px">Bilgilendirilen dersler</h4><ul class="tm-plain-list">' +
              informedSessions.slice(0, 8).map(function (s) {
                return '<li>' + U.formatDateKey(s.date) + ' ' + s.startTime + ' — ' + U.escapeHtml(s.title) + '</li>';
              }).join('') + '</ul>' : '<p class="tm-empty">Henüz bilgilendirme kaydı yok.</p>') +
            (commLogs.length ? '<h4 style="margin:12px 0 6px;font-size:13px">İletişim geçmişi</h4>' + commLogs.slice(0, 5).map(function (l) {
              return '<p style="font-size:12px;margin:4px 0">' + U.formatDateTime(l.createdAt) + ' — ' + U.escapeHtml(l.summary) + '</p>';
            }).join('') : '');
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
    return U.filterSearch(Store.getTeachers(), searchInput ? searchInput.value : '', function (t) {
      return t.firstName + ' ' + t.lastName + ' ' + branchLabel(t);
    }).filter(function (t) {
      if (type === 'pdr') return isPdrTeacher(t);
      if (type === 'branch') return !isPdrTeacher(t);
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
    return '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-cal="' + t.id + '" title="Program" aria-label="Program">' + CAL_ICON + '</button> ' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-detail="' + t.id + '" title="Detay" aria-label="Detay">' + EYE_ICON + '</button>';
  }

  function rowHtml(t) {
    var todayCount = Store.getSessionsForTeacher(t.id).filter(function (s) { return s.date === today && s.status !== 'cancelled'; }).length;
    return '<tr data-id="' + t.id + '" style="cursor:pointer">' +
      '<td><code class="tm-res-code-cell">' + U.escapeHtml(teacherCode(t)) + '</code></td>' +
      '<td>' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</td>' +
      '<td>' + SL.teacherTypeBadge(t.teacherType || 'branch') + '</td>' +
      '<td>' + U.escapeHtml(branchLabel(t)) + '</td>' +
      '<td>' + U.escapeHtml(t.phone) + '</td>' +
      '<td>' + todayCount + '</td><td>' + weekCount(t.id) + '</td>' +
      '<td style="white-space:nowrap">' + actionIcons(t) + '</td></tr>';
  }

  function cardHtml(t) {
    var todayCount = Store.getSessionsForTeacher(t.id).filter(function (s) { return s.date === today && s.status !== 'cancelled'; }).length;
    return '<article class="tm-list-card" data-id="' + t.id + '">' +
      '<div class="tm-list-card-head"><div><strong>' + U.escapeHtml(U.fullName(t.firstName, t.lastName)) + '</strong><code class="tm-res-code-cell">' + U.escapeHtml(teacherCode(t)) + '</code></div>' +
      SL.teacherTypeBadge(t.teacherType || 'branch') + '</div>' +
      '<div class="tm-list-card-body">' +
        '<div><span class="tm-list-card-label">Branş</span> ' + U.escapeHtml(branchLabel(t)) + '</div>' +
        '<div><span class="tm-list-card-label">Bugün / hafta</span> ' + todayCount + ' / ' + weekCount(t.id) + ' ders</div>' +
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
  if (typeFilter) typeFilter.addEventListener('change', function () { page = 1; render(); });
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
