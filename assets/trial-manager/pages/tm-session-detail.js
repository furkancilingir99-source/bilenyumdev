/**
 * Deneme dersi oturumu detay drawer — 6 sekme
 */
(function (global) {
  'use strict';

  var Store = (global.TMBridge && global.TMBridge.store()) || global.TMStore;
  var U = global.TMUtils;
  var SL = global.TMStatusLabels;
  var Drawer = global.TMDetailDrawer;
  var Confirm = global.TMConfirmDialog;
  var Form = global.TMFormDialog;
  var QuickMsg = global.TMQuickMessage;
  var Msg = global.TMMessageTemplates;
  var Rules = global.TMSchedulingRules;

  var currentSessionId = null;
  var activeTab = 0;

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  function renderSummary(d) {
    var s = d.session;
    var assignedCount = d.reservations.filter(function (r) {
      return r.status !== 'cancelled' && r.status !== 'rescheduled';
    }).length;
    var capacity = s.capacity || (d.lessonType && d.lessonType.defaultCapacity) || 20;
    var remaining = Math.max(0, capacity - assignedCount);
    var pdrName = d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—';
    var branchName = d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—';
    var lessonCode = Store.getLessonCode ? Store.getLessonCode(s) : s.id;
    return (
      '<div class="tm-detail-grid">' +
        cell('Deneme Dersi ID', '<code class="tm-res-code-cell">' + U.escapeHtml(lessonCode) + '</code>') +
        cell('Ders türü', d.lessonType ? d.lessonType.name : '—') +
        cell('Sınıf', U.escapeHtml(s.gradeLevel || '—')) +
        cell('Tarih', U.formatDateKey(s.date)) +
        cell('Saat', U.formatTimeRange(s.startTime, s.endTime)) +
        cell('Süre', '50 dk (PDR veli sunumu 20 + öğrenci denemesi 30)') +
        cell('PDR/Rehberlik Öğretmeni', U.escapeHtml(pdrName)) +
        cell('Branş Öğretmeni', U.escapeHtml(branchName)) +
        cell('Kapasite', assignedCount + ' / ' + capacity + ' (boş: ' + remaining + ')') +
        cell('Durum', SL.sessionBadge(s.status)) +
        cell('PDR bilgilendirme', s.pdrTeacherInformed ? '<span class="tm-badge tm-badge--green">Bilgilendirildi</span>' : '<span class="tm-badge tm-badge--orange">Bilgilendirilmedi</span>') +
        cell('Branş bilgilendirme', s.branchTeacherInformed ? '<span class="tm-badge tm-badge--green">Bilgilendirildi</span>' : '<span class="tm-badge tm-badge--orange">Bilgilendirilmedi</span>') +
        cell('Son güncelleme', U.formatDateTime(s.updatedAt)) +
      '</div>' +
      (s.notes ? '<p><strong>Not:</strong> ' + U.escapeHtml(s.notes) + '</p>' : '') +
      (s.status === 'completed'
        ? '<p class="tm-locked-note">Bu ders tamamlanmıştır ve artık düzenlenemez.</p>'
        : s.status === 'cancelled'
        ? '<p class="tm-locked-note">Bu ders iptal edilmiştir ve tekrar aktif hale getirilemez.</p>'
        : '<div class="tm-action-cards">' +
            actionCard('change-pdr-teacher', 'edit', 'PDR Değiş', 'Derse atanan PDR/rehberlik öğretmenini değiştirin.') +
            actionCard('change-branch-teacher', 'edit', 'Branş Değiş', 'Derse atanan branş öğretmenini değiştirin.') +
            actionCard('reschedule', 'edit', 'Tarih Değiştir', 'Dersin tarih ve saatini yeniden planlayın.') +
            actionCard('inform-pdr', 'edit', 'PDR Bilgilendir', 'PDR öğretmenini ders hakkında bilgilendirin.') +
            actionCard('inform-branch', 'edit', 'Branş Bilgilendir', 'Branş öğretmenini ders hakkında bilgilendirin.') +
            actionCard('notify-all-parents', 'edit', 'Velilerin tümünü bilgilendir', 'Derse atanan tüm velilere ders bilgilerini gönderin.') +
          '</div>' +
          '<div class="tm-action-cancel-row">' +
            actionCard('cancel', 'cancel', 'Dersi iptal et', 'Dersi iptal edin; bağlı rezervasyonlar iptal olur, link çalışmaz. Bu işlem geri alınamaz.', true) +
          '</div>')
    );
  }

  function actionCard(act, perm, title, desc, danger) {
    return '<button type="button" class="tm-action-card' + (danger ? ' tm-action-card--danger' : '') + '" data-act="' + act + '" data-tm-require="' + perm + '">' +
      '<span class="tm-action-card-title">' + U.escapeHtml(title) + '</span>' +
      '<span class="tm-action-card-desc">' + U.escapeHtml(desc) + '</span>' +
    '</button>';
  }

  function cell(label, value) {
    return '<div><div class="tm-detail-cell-label">' + label + '</div><div class="tm-detail-cell-value">' + value + '</div></div>';
  }

  var EYE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  var X_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>';

  // Görünen kimlik kodu: trialstudent-0001 / trialparent-0001
  function personCode(prefix, id) {
    var m = String(id || '').match(/(\d+)\s*$/);
    var seq = m ? m[1].padStart(4, '0') : '0000';
    return prefix + '-' + seq;
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

  function showStudentDetail(d, reservationId) {
    var p = d.participants.find(function (x) { return x.reservation.id === reservationId; });
    if (!p) return;
    var st = p.student, pa = p.parent;
    var studentCode = personCode('trialstudent', st && st.id);
    var parentCode = personCode('trialparent', pa && pa.id);
    var lessonCode = Store.getLessonCode ? Store.getLessonCode(d.session) : d.session.id;
    var ders = (d.lessonType ? d.lessonType.name : 'Ders') + ' · ' + (d.session.gradeLevel || '—');
    var dersTarihi = U.formatDateKey(d.session.date) + ' ' + d.session.startTime + '–' + d.session.endTime;
    var rezTarihi = (p.reservation && p.reservation.createdAt) ? U.formatDateTime(p.reservation.createdAt) : '—';
    var body = '<div class="tm-detail-grid tm-detail-grid--modal">' +
      cell('Öğrenci', U.escapeHtml(st ? U.fullName(st.firstName, st.lastName) : '—')) +
      cell('Sınıf', U.escapeHtml(st ? st.grade : '—')) +
      cell('Ders', U.escapeHtml(ders)) +
      cell('Ders Tarihi', U.escapeHtml(dersTarihi)) +
      cell('Deneme Dersi Rezervasyon Tarihi', U.escapeHtml(rezTarihi)) +
      cell('Ders ID', '<code class="tm-res-code-cell">' + U.escapeHtml(lessonCode) + '</code>') +
      cell('Öğrenci ID', '<code class="tm-res-code-cell">' + U.escapeHtml(studentCode) + '</code>') +
      cell('Veli', U.escapeHtml(pa ? U.fullName(pa.firstName, pa.lastName) : '—')) +
      cell('Veli E-posta', U.escapeHtml(pa ? pa.email : '—')) +
      cell('Veli Telefon', U.escapeHtml(pa ? pa.phone : '—')) +
      cell('Veli ID', '<code class="tm-res-code-cell">' + U.escapeHtml(parentCode) + '</code>') +
    '</div>';
    openInfoModal('Öğrenci Detayı', body);
  }

  // Öğretmen bilgilendirme onayı — ilk kez / tekrar durumuna göre soru sorar, sonra işaretler + bildirir.
  function confirmInform(d, bodyEl, role) {
    if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
    var isPdr = role === 'pdr';
    var teacher = isPdr ? d.pdrTeacher : d.branchTeacher;
    var roleLabel = isPdr ? 'PDR/rehberlik öğretmeni' : 'branş öğretmeni';
    if (!teacher) { U.notifyError('Önce ' + roleLabel + ' atanmalı.'); return; }
    var teacherName = U.fullName(teacher.firstName, teacher.lastName);
    var already = isPdr ? d.session.pdrTeacherInformed : d.session.branchTeacherInformed;
    var warning = already
      ? teacherName + ' zaten bilgilendirildi. Yine de tekrar bilgilendirmek istiyor musunuz?'
      : 'Bu ders ile ilgili ' + roleLabel + ' (' + teacherName + ') bilgilendirilecek. Bu işlemi yapmak istiyor musunuz?';
    Confirm.open({
      title: isPdr ? 'PDR bilgilendir' : 'Branş bilgilendir',
      current: (d.lessonType ? d.lessonType.name : 'Ders') + ' · ' + (d.session.gradeLevel || '—') +
        ' · ' + U.formatDateKey(d.session.date) + ' ' + d.session.startTime + '–' + d.session.endTime,
      warning: warning,
      requireReason: false,
      danger: false,
      confirmLabel: 'Evet',
      cancelLabel: 'Hayır',
      onConfirm: function () {
        var res = isPdr ? Store.markPdrTeacherInformed(d.session.id) : Store.markBranchTeacherInformed(d.session.id);
        if (res && res.ok === false) { U.notifyError(res.error || 'İşlem başarısız.'); return; }
        U.notifySuccess(teacherName + ' bilgilendirildi.');
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        renderTab(0, bodyEl);
      }
    });
  }

  function renderParticipants(d) {
    var sessionActive = d.session.status !== 'cancelled' && d.session.status !== 'completed';
    // Derse yalnızca onaylanmış, aktif öğrenciler alınır (iptal/taşınan/onaysız gösterilmez).
    var assigned = d.participants.filter(function (p) {
      return p.reservation.status !== 'cancelled' && p.reservation.status !== 'rescheduled' &&
        p.reservation.parentApprovalStatus === 'approved';
    });
    var capacity = d.session.capacity || (d.lessonType && d.lessonType.defaultCapacity) || 20;
    var enrolled = assigned.length;
    var remaining = Math.max(0, capacity - enrolled);
    var stats = '<div class="tm-cap-stats">' +
        '<div class="tm-cap-box is-total"><span class="tm-cap-num">' + capacity + '</span><span class="tm-cap-label">Toplam Kapasite</span></div>' +
        '<div class="tm-cap-box is-enrolled"><span class="tm-cap-num">' + enrolled + '</span><span class="tm-cap-label">Katılan Öğrenci</span></div>' +
        '<div class="tm-cap-box is-free"><span class="tm-cap-num">' + remaining + '</span><span class="tm-cap-label">Boş Kontenjan</span></div>' +
      '</div>';
    var addBtn = sessionActive ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-participant data-tm-require="edit" style="margin-bottom:12px">Öğrenci ekle</button>' : '';
    if (!assigned.length) {
      return stats + addBtn + '<p class="tm-empty">Derse atanmış onaylı öğrenci yok.</p>';
    }
    var rows = assigned.map(function (p, i) {
      var st = p.student;
      var pa = p.parent;
      var r = p.reservation;
      var detailBtn = '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost tm-btn--icon" data-student-detail="' + r.id + '" title="Detaylı görüntüle" aria-label="Detaylı görüntüle">' + EYE_ICON + '</button>';
      var removeBtn = sessionActive
        ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--danger tm-btn--icon" data-remove-res="' + r.id + '" data-tm-require="cancel" title="Öğrenciyi sil" aria-label="Öğrenciyi sil">' + X_ICON + '</button>'
        : '';
      return '<tr data-student-detail="' + r.id + '" style="cursor:pointer">' +
        '<td class="tm-row-index">' + (i + 1) + '</td>' +
        '<td>' + U.escapeHtml(st ? U.fullName(st.firstName, st.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(st ? st.grade : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? U.fullName(pa.firstName, pa.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? pa.phone : '—') + '</td>' +
        '<td style="white-space:nowrap"><span class="tm-row-actions">' + detailBtn + removeBtn + '</span></td>' +
      '</tr>';
    }).join('');
    return stats + addBtn +
      '<table class="tm-inner-table"><thead><tr><th>#</th><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Telefon</th><th>İşlem</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderOnlineLink(d) {
    var m = d.meeting;
    var s = d.session;
    if (!m) return '<p class="tm-empty">Toplantı bilgisi yok.</p>';
    var inactive = m.status === 'cancelled' || s.status === 'cancelled';
    var editable = s.status !== 'cancelled' && s.status !== 'completed';
    var sentCount = d.reservations.filter(function (r) { return r.linkSent; }).length;
    var notSent = d.reservations.filter(function (r) { return !r.linkSent && r.parentApprovalStatus === 'approved'; }).length;
    var lessonCode = Store.getLessonCode ? Store.getLessonCode(s) : s.id;
    var topInfo = '<div class="tm-detail-grid tm-detail-grid--modal" style="margin-bottom:12px">' +
      cell('Ders Adı', U.escapeHtml(d.lessonType ? d.lessonType.name : 'Ders')) +
      cell('Ders ID', '<code class="tm-res-code-cell">' + U.escapeHtml(lessonCode) + '</code>') +
      cell('Ders Tarihi', U.escapeHtml(U.formatDateKey(s.date))) +
      cell('Ders Saati', U.escapeHtml(s.startTime + '–' + s.endTime)) +
    '</div>';
    return (
      topInfo +
      (inactive ? '<p class="tm-alert-row is-danger">Bu ders iptal edildiği için link aktif değildir.</p>' : '') +
      '<div class="tm-link-box' + (inactive ? ' is-inactive' : '') + '">' +
        copyRow('Davet linki', m.meetingUrl) +
        copyRow('Toplantı ID', m.meetingId) +
        copyRow('Şifre', m.passcode) +
        '<div class="tm-teacher-access">' +
          '<div class="tm-teacher-access-col"><span class="tm-teacher-access-label">PDR/Rehberlik Öğretmeni</span>' +
            '<span class="tm-teacher-access-name">' + (d.pdrTeacher ? U.escapeHtml(U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName)) : '—') + '</span></div>' +
          '<div class="tm-teacher-access-col"><span class="tm-teacher-access-label">Branş Öğretmeni</span>' +
            '<span class="tm-teacher-access-name">' + (d.branchTeacher ? U.escapeHtml(U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName)) : '—') + '</span></div>' +
        '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:#7a769e">Oluşturulma: ' + U.formatDateTime(m.generatedAt) +
          (m.lastPasscodeChangedAt ? ' · Şifre değişimi: ' + U.formatDateTime(m.lastPasscodeChangedAt) : '') + '</div>' +
        '<div style="margin-top:8px">Link gönderilen: ' + sentCount + ' · Gönderilmeyen (onaylı): ' + notSent + '</div>' +
        '<div style="margin-top:8px;font-size:12px">PDR ve branş öğretmeni aynı linke katılır.</div>' +
      '</div>' +
      (editable
        ? '<div class="tm-detail-actions tm-detail-actions--wrap">' +
            '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-refresh-passcode data-tm-require="edit">Şifre yenile</button>' +
          '</div>'
        : '')
    );
  }

  function copyRow(label, val) {
    var safe = String(val || '').replace(/"/g, '&quot;');
    return '<div class="tm-copy-row"><span class="tm-detail-cell-label">' + label + '</span><code>' + U.escapeHtml(val) + '</code><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-copy="' + safe + '">Kopyala</button></div>';
  }

  // İşlemi yapan kullanıcı — ad + rol.
  function userCell(userId) {
    var u = (Store.getUsers ? Store.getUsers() : []).find(function (x) { return x.id === userId; });
    if (!u) return '<span class="tm-comm-by-name">Sistem</span>';
    var role = (SL.USER_ROLE && SL.USER_ROLE[u.role]) || '';
    return '<span class="tm-comm-by-name">' + U.escapeHtml(U.fullName(u.firstName, u.lastName)) + '</span>' +
      (role ? '<span class="tm-comm-by-role">' + U.escapeHtml(role) + '</span>' : '');
  }

  function formatAuditValue(v) {
    if (v == null || v === '') return '—';
    if (typeof v === 'object') {
      if (v.sessionId) return (Store.getLessonCode ? Store.getLessonCode(v.sessionId) : v.sessionId);
      if (v.date || v.startTime) return U.formatDateKey(v.date || '') + (v.startTime ? ' ' + v.startTime : '');
      return Object.keys(v).map(function (k) { return k + ': ' + v[k]; }).join(', ');
    }
    // Öğretmen id'sini isme çevir
    var t = Store.getTeacherById ? Store.getTeacherById(v) : null;
    if (t) return U.fullName(t.firstName, t.lastName);
    return SL.sessionLabel ? (SL.SESSION_STATUS && SL.SESSION_STATUS[v] ? SL.sessionLabel(v) : String(v)) : String(v);
  }

  function renderCommunication(d) {
    var logs = Store.getCommunicationLogs().filter(function (l) { return l.sessionId === d.session.id; });
    if (!logs.length) return '<p class="tm-empty">İletişim kaydı yok.</p><button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-comm data-tm-require="edit">İletişim kaydı ekle</button>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + userCell(l.createdByUserId) +
        '</td><td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>İşlemi Yapan</th><th>Sonuç</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-comm data-tm-require="edit" style="margin-top:12px">İletişim kaydı ekle</button>';
  }

  function renderAttendance(d) {
    if (d.session.status === 'cancelled') {
      return '<p class="tm-empty">İptal edilmiş ders için katılım girilemez.</p>';
    }
    var today = Store.todayKey();
    if (d.session.status !== 'completed' && d.session.date > today) {
      return '<p class="tm-empty">Gelecek dersler için henüz katılım girilemez.</p>';
    }
    if (!d.participants.length) {
      return '<p class="tm-empty">Katılımcı yok — önce rezervasyon oluşturun.</p>';
    }
    var readOnly = global.TMPermissions && !global.TMPermissions.can('edit');
    var rows = d.participants.map(function (p) {
      var r = p.reservation;
      if (readOnly) {
        return '<tr><td>' + U.escapeHtml(p.student ? U.fullName(p.student.firstName, p.student.lastName) : '') + '</td>' +
          '<td>' + U.escapeHtml(SL.reservationLabel(r.status)) + '</td>' +
          '<td>' + (r.enrolled ? 'Evet' : 'Hayır') + '</td>' +
          '<td>' + U.escapeHtml(r.notes || '—') + '</td></tr>';
      }
      return '<tr data-res="' + r.id + '">' +
        '<td>' + U.escapeHtml(p.student ? U.fullName(p.student.firstName, p.student.lastName) : '') + '</td>' +
        '<td><select class="tm-dg-control" data-att-status><option value="attended"' + (r.status === 'attended' ? ' selected' : '') + '>Katıldı</option><option value="no_show"' + (r.status === 'no_show' ? ' selected' : '') + '>Gelmedi</option></select></td>' +
        '<td><input type="checkbox" data-att-enrolled' + (r.enrolled ? ' checked' : '') + '></td>' +
        '<td><input type="text" class="tm-dg-control" data-att-note value="' + U.escapeHtml(r.notes || '') + '" placeholder="Not"></td>' +
      '</tr>';
    }).join('');
    if (readOnly) {
      return '<table class="tm-inner-table"><thead><tr><th>Öğrenci</th><th>Katılım</th><th>Kayıt oldu</th><th>Not</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p class="tm-empty" style="margin-top:12px">Gözlemci modu: katılım düzenlenemez.</p>';
    }
    return '<table class="tm-inner-table"><thead><tr><th>Öğrenci</th><th>Katılım</th><th>Kayıt oldu</th><th>Not</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<button type="button" class="tm-btn tm-btn--primary" data-save-attendance data-tm-require="edit" style="margin-top:12px">Katılım sonuçlarını kaydet</button>';
  }

  function renderAudit(d) {
    var logs = Store.getAuditLogs().filter(function (l) {
      return (l.entityType === 'trial_lesson_session' && l.entityId === d.session.id) ||
        (l.entityType === 'online_meeting' && l.entityId === d.session.onlineMeetingId);
    });
    if (!logs.length) return '<p class="tm-empty">Değişiklik geçmişi yok.</p>';
    var rows = logs.map(function (l) {
      var hasOld = l.previousValue !== undefined && l.previousValue !== null && l.previousValue !== '';
      var hasNew = l.newValue !== undefined && l.newValue !== null && l.newValue !== '';
      var oldCell = hasOld ? '<span class="tm-audit-old">' + U.escapeHtml(formatAuditValue(l.previousValue)) + '</span>' : '<span class="tm-audit-none">—</span>';
      var newCell = hasNew ? '<span class="tm-audit-new">' + U.escapeHtml(formatAuditValue(l.newValue)) + '</span>' : '<span class="tm-audit-none">—</span>';
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td>' +
        '<td>' + userCell(l.createdByUserId) + '</td>' +
        '<td><span class="tm-audit-action">' + U.escapeHtml(SL.AUDIT_ACTION[l.action] || l.action) + '</span></td>' +
        '<td>' + oldCell + '</td>' +
        '<td>' + newCell + '</td>' +
        '<td>' + U.escapeHtml(l.description) + (l.reason ? '<span class="tm-audit-reason">Neden: ' + U.escapeHtml(l.reason) + '</span>' : '') + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Yapan Kişi</th><th>İşlem</th><th>Eski Durum</th><th>Yeni Durum</th><th>Açıklama</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderTab(idx, bodyEl) {
    var d = Store.getSessionWithDetails(currentSessionId);
    if (!d) return;
    var html = '';
    if (idx === 0) html = renderSummary(d);
    else if (idx === 1) html = renderParticipants(d);
    else if (idx === 2) html = renderOnlineLink(d);
    else html = renderAudit(d);
    bodyEl.innerHTML = html;
    bindTabActions(bodyEl, d, idx);
    if (global.TMPermissions && global.TMPermissions.applyPageChrome) {
      global.TMPermissions.applyPageChrome(bodyEl);
    }
  }

  function bindTabActions(bodyEl, d, idx) {
    bodyEl.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () { copyText(btn.getAttribute('data-copy')); });
    });
    if (idx === 0) {
      bodyEl.querySelector('[data-act="cancel"]') && bodyEl.querySelector('[data-act="cancel"]').addEventListener('click', function () {
        if (global.TMPermissions && !global.TMPermissions.guard('cancel')) return;
        var affected = Rules.getAffectedPeopleForSessionChange(d.session.id);
        var names = [];
        if (d.pdrTeacher) names.push('PDR öğretmeni: ' + U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName));
        if (d.branchTeacher) names.push('Branş öğretmeni: ' + U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName));
        affected.studentIds.forEach(function (sid) {
          var st = Store.getStudentById(sid);
          if (st) names.push('Öğrenci: ' + U.fullName(st.firstName, st.lastName));
        });
        var lessonCode = Store.getLessonCode ? Store.getLessonCode(d.session) : d.session.id;
        Confirm.open({
          title: 'Dersi iptal et',
          current: (d.lessonType ? d.lessonType.name : 'Ders') + ' · ' + (d.session.gradeLevel || '—') +
            ' · ' + lessonCode +
            ' · ' + U.formatDateKey(d.session.date) + ' ' + d.session.startTime + '–' + d.session.endTime,
          warning: 'Bağlı rezervasyonlar iptal edilecek, link çalışmayacak. Ders iptal edildikten sonra tekrar aktif hale getirilemez.',
          affected: names,
          confirmLabel: 'Dersi iptal et',
          onConfirm: function (reason) {
            var res = Store.cancelSession(d.session.id, reason);
            if (res && res.ok === false) { U.notifyError(res.error); return; }
            U.notifySuccess('Ders iptal edildi.');
            open(currentSessionId);
            if (global.TMOnSessionChange) global.TMOnSessionChange();
          }
        });
      });
      bodyEl.querySelector('[data-act="inform-pdr"]') && bodyEl.querySelector('[data-act="inform-pdr"]').addEventListener('click', function () {
        confirmInform(d, bodyEl, 'pdr');
      });
      bodyEl.querySelector('[data-act="inform-branch"]') && bodyEl.querySelector('[data-act="inform-branch"]').addEventListener('click', function () {
        confirmInform(d, bodyEl, 'branch');
      });
      bodyEl.querySelector('[data-act="notify-all-parents"]') && bodyEl.querySelector('[data-act="notify-all-parents"]').addEventListener('click', function () {
        if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
        Confirm.open({
          title: 'Velilerin tümünü bilgilendir',
          current: (d.lessonType ? d.lessonType.name : 'Ders') + ' · ' + (d.session.gradeLevel || '—') +
            ' · ' + U.formatDateKey(d.session.date) + ' ' + d.session.startTime + '–' + d.session.endTime,
          warning: 'Derse atanan tüm velilere ders bilgileri (tarih, saat, link) gönderilecek. Bu işlemi yapmak istiyor musunuz?',
          requireReason: false,
          danger: false,
          confirmLabel: 'Evet',
          cancelLabel: 'Hayır',
          onConfirm: function () {
            var res = Store.notifyAllParentsForSession(d.session.id);
            if (!res || res.ok === false) { U.notifyError((res && res.error) || 'İşlem başarısız.'); return; }
            U.notifySuccess('İlgili tüm velilere bildirim gönderildi (' + res.count + ' veli).');
            if (global.TMOnSessionChange) global.TMOnSessionChange();
            renderTab(0, bodyEl);
          }
        });
      });
      bodyEl.querySelector('[data-act="change-pdr-teacher"]') && bodyEl.querySelector('[data-act="change-pdr-teacher"]').addEventListener('click', function () {
        showTeacherPicker(d, 'pdr');
      });
      bodyEl.querySelector('[data-act="change-branch-teacher"]') && bodyEl.querySelector('[data-act="change-branch-teacher"]').addEventListener('click', function () {
        showTeacherPicker(d, 'branch');
      });
      bodyEl.querySelector('[data-act="reschedule"]') && bodyEl.querySelector('[data-act="reschedule"]').addEventListener('click', function () {
        showReschedule(d);
      });
      bodyEl.querySelector('[data-act="attendance"]') && bodyEl.querySelector('[data-act="attendance"]').addEventListener('click', function () {
        activeTab = 4;
        Drawer.open(buildDrawerOpts(currentSessionId, 4));
      });
    }
    if (idx === 1) {
      bodyEl.querySelector('[data-add-participant]') && bodyEl.querySelector('[data-add-participant]').addEventListener('click', function () {
        showAddStudentPicker(d);
      });
      // Öğrenci detay modalı — satıra veya göz ikonuna tıklayınca
      bodyEl.querySelectorAll('button[data-student-detail]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          showStudentDetail(d, btn.getAttribute('data-student-detail'));
        });
      });
      bodyEl.querySelectorAll('tr[data-student-detail]').forEach(function (tr) {
        tr.addEventListener('click', function (e) {
          if (e.target.closest('button')) return;
          showStudentDetail(d, tr.getAttribute('data-student-detail'));
        });
      });
      bodyEl.querySelectorAll('[data-remove-res]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          if (e) e.stopPropagation();
          if (global.TMPermissions && !global.TMPermissions.guard('cancel')) return;
          var resId = btn.getAttribute('data-remove-res');
          var p = d.participants.find(function (x) { return x.reservation.id === resId; });
          var stName = p && p.student ? U.fullName(p.student.firstName, p.student.lastName) : 'Öğrenci';
          Confirm.open({
            title: 'Öğrenciyi dersten sil',
            warning: stName + ' adlı öğrenciyi bu dersten silmek istediğinize emin misiniz? Kapasite yeniden açılacak.',
            requireReason: false,
            danger: true,
            confirmLabel: 'Sil',
            onConfirm: function (reason) {
              var result = Store.removeStudentFromSession(d.session.id, resId, reason || 'Yönetici tarafından dersten silindi.');
              if (!result.ok) U.notifyError(result.error);
              else {
                U.notifySuccess('Öğrenci dersten silindi.');
                if (global.TMOnSessionChange) global.TMOnSessionChange();
                renderTab(1, bodyEl);
              }
            }
          });
        });
      });
    }
    if (idx === 3) {
      bodyEl.querySelector('[data-add-comm]') && bodyEl.querySelector('[data-add-comm]').addEventListener('click', function () {
        openCommForm(d, bodyEl, idx);
      });
    }
    if (idx === 2) {
      bodyEl.querySelector('[data-refresh-passcode]') && bodyEl.querySelector('[data-refresh-passcode]').addEventListener('click', function () {
        if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
        Confirm.open({
          title: 'Şifre yenile',
          warning: 'Yeni şifre oluşturulacak. Velilere tekrar göndermeniz gerekebilir.',
          onConfirm: function (reason) {
            Store.refreshMeetingPasscode(d.meeting.id, reason);
            if (global.TMOnSessionChange) global.TMOnSessionChange();
            renderTab(2, bodyEl);
          }
        });
      });
      bodyEl.querySelector('[data-wa-pdr-teacher]') && bodyEl.querySelector('[data-wa-pdr-teacher]').addEventListener('click', function () {
        if (!d.pdrTeacher || !QuickMsg) return;
        QuickMsg.openForPdrTeacher({
          teacherName: U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName),
          date: U.formatDateKey(d.session.date),
          time: d.session.startTime,
          lessonType: d.lessonType.name,
          meetingUrl: d.meeting ? d.meeting.meetingUrl : '',
          meetingId: d.meeting ? d.meeting.meetingId : '',
          passcode: d.meeting ? d.meeting.passcode : '',
          phone: d.pdrTeacher.phone,
          email: d.pdrTeacher.email
        });
      });
      bodyEl.querySelector('[data-wa-branch-teacher]') && bodyEl.querySelector('[data-wa-branch-teacher]').addEventListener('click', function () {
        if (!d.branchTeacher || !QuickMsg) return;
        QuickMsg.openForBranchTeacher({
          teacherName: U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName),
          date: U.formatDateKey(d.session.date),
          time: d.session.startTime,
          lessonType: d.lessonType.name,
          studentCount: d.session.enrolledStudentIds.length,
          meetingUrl: d.meeting ? d.meeting.meetingUrl : '',
          meetingId: d.meeting ? d.meeting.meetingId : '',
          passcode: d.meeting ? d.meeting.passcode : '',
          phone: d.branchTeacher.phone,
          email: d.branchTeacher.email
        });
      });
    }
    if (idx === 4) {
      bodyEl.querySelector('[data-save-attendance]') && bodyEl.querySelector('[data-save-attendance]').addEventListener('click', function () {
        if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
        var results = [];
        bodyEl.querySelectorAll('tr[data-res]').forEach(function (tr) {
          results.push({
            reservationId: tr.getAttribute('data-res'),
            attended: tr.querySelector('[data-att-status]').value === 'attended',
            enrolled: tr.querySelector('[data-att-enrolled]').checked,
            notes: tr.querySelector('[data-att-note]').value
          });
        });
        Store.markAttendance(d.session.id, results);
        U.notifySuccess('Katılım sonuçları kaydedildi.');
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        open(currentSessionId);
      });
    }
  }

  function showAddStudentPicker(d) {
    if (!Form) return;
    if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
    var eligible = Store.getEligibleStudentsForSession(d.session.id);
    if (!eligible.length) {
      U.notifyError('Eklenebilecek uygun öğrenci yok (sınıf seviyesi, kapasite, branş veya daha önce deneme almış olabilir).');
      return;
    }
    Form.open({
      title: 'Derse öğrenci ekle',
      description: 'Yalnızca dersin sınıf seviyesindeki (' + (d.session.gradeLevel || '—') + '), kapasite ve ücretsiz deneme kurallarına uygun öğrenciler listelenir.',
      fields: [{
        type: 'select',
        name: 'studentId',
        label: 'Öğrenci',
        options: eligible.map(function (st) {
          return {
            value: st.id,
            label: U.fullName(st.firstName, st.lastName) + ' · ' + st.grade + ' · ' + st.level
          };
        })
      }],
      onSubmit: function (data) {
        var result = Store.addStudentToSession(d.session.id, data.studentId);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Öğrenci derse eklendi.');
          if (global.TMOnSessionChange) global.TMOnSessionChange();
          open(currentSessionId, 1);
        }
      }
    });
  }

  function showMoveReservation(d, reservationId) {
    if (!Form || !Confirm) return;
    if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
    var res = Store.getReservationById(reservationId);
    if (!res) return;
    var participant = d.participants.find(function (p) { return p.reservation.id === reservationId; });
    var sessions = Store.getAvailableSessionsForLessonType(d.session.lessonTypeId)
      .filter(function (s) { return s.id !== d.session.id; });
    if (!sessions.length) {
      U.notifyError('Uygun alternatif ders bulunamadı.');
      return;
    }
    var st = participant ? participant.student : Store.getStudentById(res.studentId);
    var stName = st ? U.fullName(st.firstName, st.lastName) : 'Öğrenci';
    Form.open({
      title: 'Dersi değiştir',
      description: stName + ' için yeni ders seçin. Veli onayı ve değişiklik nedeni zorunludur.',
      fields: [
        {
          type: 'select',
          name: 'sessionId',
          label: 'Yeni ders',
          options: sessions.map(function (s) {
            var lt = Store.getLessonTypeById(s.lessonTypeId);
            var rem = Rules.getSessionRemainingCapacity(s.id);
            return {
              value: s.id,
              label: U.formatDateKey(s.date) + ' ' + s.startTime + ' · ' + (lt ? lt.name : '') + ' (boş: ' + rem + ')'
            };
          })
        },
        { type: 'checkbox', name: 'parentApproved', label: 'Veli onayı alındı', value: res.parentApprovalStatus === 'approved' },
        { type: 'textarea', name: 'reason', label: 'Değişiklik nedeni', rows: 3, required: true }
      ],
      submitLabel: 'Devam',
      onSubmit: function (data) {
        if (!data.parentApproved) {
          U.notifyError('Veli onayı işaretlenmeden taşınamaz.');
          return;
        }
        if (!data.reason || !String(data.reason).trim()) {
          U.notifyError('Değişiklik nedeni zorunludur.');
          return;
        }
        var target = Store.getSessionById(data.sessionId);
        if (!target) return;
        var targetDetails = Store.getSessionWithDetails(target.id);
        var affected = [];
        if (st) affected.push('Öğrenci: ' + stName);
        if (participant && participant.parent) {
          affected.push('Veli: ' + U.fullName(participant.parent.firstName, participant.parent.lastName));
        }
        if (d.pdrTeacher) affected.push('Eski PDR: ' + U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName));
        if (d.branchTeacher) affected.push('Eski branş: ' + U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName));
        if (targetDetails.pdrTeacher) affected.push('Yeni PDR: ' + U.fullName(targetDetails.pdrTeacher.firstName, targetDetails.pdrTeacher.lastName));
        if (targetDetails.branchTeacher) affected.push('Yeni branş: ' + U.fullName(targetDetails.branchTeacher.firstName, targetDetails.branchTeacher.lastName));
        affected.push('Eski ders: ' + U.formatDateKey(d.session.date) + ' ' + d.session.startTime);
        affected.push('Yeni ders: ' + U.formatDateKey(target.date) + ' ' + target.startTime);
        Confirm.open({
          title: 'Dersi değiştir',
          current: U.formatDateKey(d.session.date) + ' ' + d.session.startTime,
          next: U.formatDateKey(target.date) + ' ' + target.startTime,
          affected: affected,
          warning: 'Eski rezervasyon geçmişte kalır. Yeni derste link yeniden gönderilmelidir.',
          danger: false,
          confirmLabel: 'Taşı',
          onConfirm: function () {
            var result = Store.moveReservationToSession(reservationId, data.sessionId, data.reason, {
              parentApproved: true
            });
            if (!result.ok) {
              U.notifyError(result.error);
              return;
            }
            U.notifySuccess(stName + ' yeni derse taşındı.');
            if (QuickMsg && participant && participant.parent && result.newSession) {
              var meeting = Store.getMeetingBySessionId(result.newSession.id);
              var lt = Store.getLessonTypeById(result.newSession.lessonTypeId);
              QuickMsg.openReschedule({
                parentName: U.fullName(participant.parent.firstName, participant.parent.lastName),
                studentName: stName,
                lessonType: lt ? lt.name : 'Deneme dersi',
                newDate: U.formatDateKey(result.newSession.date),
                newTime: result.newSession.startTime,
                meetingUrl: meeting ? meeting.meetingUrl : '',
                meetingId: meeting ? meeting.meetingId : '',
                passcode: meeting ? meeting.passcode : '',
                phone: participant.parent.phone,
                email: participant.parent.email
              });
            }
            if (global.TMOnSessionChange) global.TMOnSessionChange();
            open(currentSessionId, 1);
          }
        });
      }
    });
  }

  function showTeacherPicker(d, role) {
    if (!Form) return;
    if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
    var isPdr = role === 'pdr';
    var eligible = Store.getTeachers().filter(function (t) {
      if (isPdr) {
        return t.isActive && Rules.isTeacherPdr(t.id) && t.id !== d.session.branchTeacherId &&
          !Rules.hasPdrTeacherConflict(t.id, d.session.date, d.session.startTime, d.session.endTime, d.session.id);
      }
      return t.isActive && Rules.isBranchTeacherEligibleForLessonType(t.id, d.session.lessonTypeId) &&
        t.id !== d.session.pdrTeacherId &&
        !Rules.hasBranchTeacherConflict(t.id, d.session.date, d.session.startTime, d.session.endTime, d.session.id);
    });
    if (!eligible.length) { U.notifyError('Uygun öğretmen bulunamadı.'); return; }
    var current = isPdr ? d.pdrTeacher : d.branchTeacher;
    Form.open({
      title: isPdr ? 'PDR öğretmenini değiştir' : 'Branş öğretmenini değiştir',
      description: 'Online link aynı kalacak. Bilgilendirme durumu sıfırlanır.',
      fields: [{
        type: 'select',
        name: 'teacherId',
        label: 'Yeni öğretmen',
        options: eligible.map(function (t) {
          return { value: t.id, label: U.fullName(t.firstName, t.lastName) };
        })
      }],
      submitLabel: 'Devam',
      onSubmit: function (data) {
        var newT = eligible.find(function (t) { return t.id === data.teacherId; });
        if (!newT) return;
        var affNames = [];
        if (current) affNames.push('Eski: ' + U.fullName(current.firstName, current.lastName));
        affNames.push('Yeni: ' + U.fullName(newT.firstName, newT.lastName));
        if (d.pdrTeacher && role !== 'pdr') affNames.push('PDR: ' + U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName));
        if (d.branchTeacher && role !== 'branch') affNames.push('Branş: ' + U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName));
        Confirm.open({
          title: isPdr ? 'PDR öğretmenini değiştir' : 'Branş öğretmenini değiştir',
          current: current ? U.fullName(current.firstName, current.lastName) : '—',
          next: U.fullName(newT.firstName, newT.lastName),
          affected: affNames,
          warning: 'Online link aynı kalacak. Öğretmen bilgilendirme sıfırlanır.',
          onConfirm: function (reason) {
            var res = isPdr
              ? Store.changeSessionPdrTeacher(d.session.id, newT.id, reason)
              : Store.changeSessionBranchTeacher(d.session.id, newT.id, reason);
            if (!res.ok) U.notifyError(res.error);
            else open(currentSessionId);
            if (global.TMOnSessionChange) global.TMOnSessionChange();
          }
        });
      }
    });
  }

  function showReschedule(d) {
    if (!Form) return;
    if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
    var slots = Rules.HOURLY_SLOTS || ['11:00', '12:00', '13:00', '14:00'];
    Form.open({
      title: 'Tarih ve saat ayarla',
      description: 'Deneme dersi 50 dakikadır; bitiş saati başlangıca göre otomatik belirlenir.',
      fields: [
        { type: 'date', name: 'date', label: 'Yeni tarih', value: d.session.date },
        {
          type: 'select',
          name: 'startTime',
          label: 'Başlangıç saati',
          value: d.session.startTime,
          options: slots.map(function (s) { return { value: s, label: s }; })
        },
        {
          type: 'select',
          name: 'endTime',
          label: 'Bitiş saati',
          value: d.session.endTime,
          options: slots.map(function (s) { var e = Rules.addMinutes(s, 50); return { value: e, label: e }; })
        }
      ],
      submitLabel: 'Devam',
      onSubmit: function (data) {
        if (!data.date || !data.startTime) return;
        var expectedEnd = Rules.addMinutes(data.startTime, 50);
        if (data.endTime && data.endTime !== expectedEnd) {
          U.notifyError('Bitiş saati başlangıçtan 50 dk sonra olmalı (' + expectedEnd + ').');
          return;
        }
        Confirm.open({
          title: 'Tarih ve saat ayarla',
          current: U.formatDateKey(d.session.date) + ' ' + d.session.startTime + '–' + d.session.endTime,
          next: U.formatDateKey(data.date) + ' ' + data.startTime + '–' + expectedEnd,
          warning: 'Dersteki tüm veliler bilgilendirilmelidir.',
          onConfirm: function (reason) {
            var res = Store.rescheduleSession(d.session.id, data.date, data.startTime, reason);
            if (!res.ok) U.notifyError(res.error);
            else { U.notifySuccess('Ders tarihi güncellendi.'); open(currentSessionId); }
            if (global.TMOnSessionChange) global.TMOnSessionChange();
          }
        });
      }
    });
  }

  function openCommForm(d, bodyEl, idx) {
    if (!Form) return;
    if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
    var channelOpts = Object.keys(SL.COMM_CHANNEL).map(function (k) {
      return { value: k, label: SL.COMM_CHANNEL[k] };
    });
    var resultOpts = Object.keys(SL.COMM_RESULT).map(function (k) {
      return { value: k, label: SL.COMM_RESULT[k] };
    });
    Form.open({
      title: 'İletişim kaydı ekle',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: channelOpts, value: 'phone' },
        { type: 'select', name: 'result', label: 'Sonuç', options: resultOpts, value: 'message_sent' },
        { type: 'textarea', name: 'summary', label: 'Özet', rows: 4, required: true }
      ],
      onSubmit: function (data) {
        Store.addCommunicationLog({
          sessionId: d.session.id,
          channel: data.channel,
          result: data.result,
          summary: data.summary
        });
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        renderTab(idx, bodyEl);
      }
    });
  }

  function buildDrawerOpts(sessionId, tab) {
    var d = Store.getSessionWithDetails(sessionId);
    if (!d) return null;
    return {
      title: (d.lessonType ? d.lessonType.name : 'Ders') + ' · ' + U.formatDateKey(d.session.date),
      subtitle: d.session.startTime + ' – ' + d.session.endTime + ' · ' + SL.sessionLabel(d.session.status),
      expandHref: 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(sessionId),
      tabs: [
        { label: 'Özet' }, { label: 'Katılımcılar' }, { label: 'Ders Linki' }, { label: 'Geçmiş' }
      ],
      activeTab: tab || 0,
      onTab: function (idx, bodyEl) { activeTab = idx; renderTab(idx, bodyEl); }
    };
  }

  function open(sessionId, tab) {
    if (!Store || !Drawer) return;
    currentSessionId = sessionId;
    var opts = buildDrawerOpts(sessionId, tab);
    if (opts) Drawer.open(opts);
  }

  function renderTabAt(bodyEl, sessionId, tabIndex) {
    if (!bodyEl || !Store) return;
    currentSessionId = sessionId;
    activeTab = tabIndex || 0;
    renderTab(activeTab, bodyEl);
  }

  var TAB_LABELS = ['Özet', 'Katılımcılar', 'Ders Linki', 'Geçmiş'];

  global.TMSessionDetail = { open: open, renderTabAt: renderTabAt, tabLabels: TAB_LABELS };
})(typeof window !== 'undefined' ? window : this);
