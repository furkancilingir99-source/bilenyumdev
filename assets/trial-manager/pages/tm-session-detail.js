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
    var cap = s.enrolledStudentIds.length;
    var remaining = Rules.getSessionRemainingCapacity(s.id);
    var pdrName = d.pdrTeacher ? U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName) : '—';
    var branchName = d.branchTeacher ? U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName) : '—';
    return (
      '<div class="tm-detail-grid">' +
        cell('Ders türü', d.lessonType ? d.lessonType.name : '—') +
        cell('Tarih', U.formatDateKey(s.date)) +
        cell('Saat', U.formatTimeRange(s.startTime, s.endTime)) +
        cell('Süre', '50 dk (PDR veli sunumu 20 + öğrenci denemesi 30)') +
        cell('PDR/Rehberlik Öğretmeni', U.escapeHtml(pdrName)) +
        cell('Branş Öğretmeni', U.escapeHtml(branchName)) +
        cell('Kapasite', cap + ' / 20 (boş: ' + remaining + ')') +
        cell('Durum', SL.sessionBadge(s.status)) +
        cell('PDR bilgilendirme', s.pdrTeacherInformed ? '<span class="tm-badge tm-badge--green">Bilgilendirildi</span>' : '<span class="tm-badge tm-badge--orange">Bilgilendirilmedi</span>') +
        cell('Branş bilgilendirme', s.branchTeacherInformed ? '<span class="tm-badge tm-badge--green">Bilgilendirildi</span>' : '<span class="tm-badge tm-badge--orange">Bilgilendirilmedi</span>') +
        cell('Son güncelleme', U.formatDateTime(s.updatedAt)) +
      '</div>' +
      (s.notes ? '<p><strong>Not:</strong> ' + U.escapeHtml(s.notes) + '</p>' : '') +
      '<div class="tm-detail-actions tm-detail-actions--wrap">' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="change-pdr-teacher" data-tm-require="edit">PDR öğretmenini değiştir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="change-branch-teacher" data-tm-require="edit">Branş öğretmenini değiştir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="reschedule" data-tm-require="edit">Saat değiştir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="inform-pdr" data-tm-require="edit">PDR bilgilendir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="inform-branch" data-tm-require="edit">Branş bilgilendir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="attendance" data-tm-require="edit">Katılım gir</button>' +
        '<button type="button" class="tm-btn tm-btn--danger tm-btn--sm" data-act="cancel" data-tm-require="cancel">Dersi iptal et</button>' +
      '</div>'
    );
  }

  function cell(label, value) {
    return '<div><div class="tm-detail-cell-label">' + label + '</div><div class="tm-detail-cell-value">' + value + '</div></div>';
  }

  function renderParticipants(d) {
    var sessionActive = d.session.status !== 'cancelled' && d.session.status !== 'completed';
    var remaining = Rules.getSessionRemainingCapacity(d.session.id);
    if (!d.participants.length) {
      return (sessionActive ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-participant data-tm-require="edit" style="margin-bottom:12px">Öğrenci ekle</button>' : '') +
        '<p class="tm-empty">Katılımcı yok.</p>';
    }
    var notSent = d.reservations.filter(function (r) { return r.parentApprovalStatus === 'approved' && !r.linkSent; }).length;
    var rows = d.participants.map(function (p) {
      var st = p.student;
      var pa = p.parent;
      var r = p.reservation;
      var removeBtn = sessionActive && r.status !== 'cancelled'
        ? ' <button type="button" class="tm-btn tm-btn--sm tm-btn--danger" data-remove-res="' + r.id + '" data-tm-require="cancel">Çıkar</button>'
        : '';
      var moveBtn = sessionActive && r.status !== 'cancelled' && r.status !== 'rescheduled'
        ? ' <button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-move-res="' + r.id + '" data-tm-require="edit">Dersi değiştir</button>'
        : '';
      return '<tr>' +
        '<td>' + U.escapeHtml(st ? U.fullName(st.firstName, st.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(st ? st.grade : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? U.fullName(pa.firstName, pa.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? pa.phone : '—') + '</td>' +
        '<td>' + SL.parentApprovalBadge(r.parentApprovalStatus) + '</td>' +
        '<td>' + (r.linkSent ? '<span class="tm-badge tm-badge--green">Gönderildi</span>' : '<span class="tm-badge tm-badge--orange">Hayır</span>') + '</td>' +
        '<td>' + SL.reservationBadge(r.status) + '</td>' +
        '<td style="white-space:nowrap">' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-wa-parent="' + r.id + '">WhatsApp</button> ' +
          '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-link-sent="' + r.id + '" data-tm-require="edit">Link gönderildi</button>' +
          moveBtn +
          removeBtn +
        '</td>' +
      '</tr>';
    }).join('');
    return (sessionActive ? '<p class="tm-detail-cell-label" style="margin-bottom:8px">Boş kapasite: ' + remaining + ' / 20</p>' : '') +
      '<p class="tm-form-desc">Bu online deneme dersinde veliler ve öğrenciler aynı bilgisayardan katılır. İlk 20 dakika PDR/Rehberlik Öğretmeni veli sunumu yapar; son 30 dakika Branş Öğretmeni öğrencilere deneme dersi yapar.</p>' +
      (sessionActive ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-participant data-tm-require="edit" style="margin-bottom:12px">Öğrenci ekle</button>' : '') +
      (notSent ? '<p class="tm-alert-row" style="margin-bottom:8px">Onaylı ancak link gönderilmemiş: ' + notSent + ' veli</p>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-bulk-link data-tm-require="edit" style="margin-bottom:12px">Tüm onaylılara link gönderildi işaretle</button>' : '') +
      '<table class="tm-inner-table"><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Telefon</th><th>Veli onay</th><th>Link</th><th>Durum</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderOnlineLink(d) {
    var m = d.meeting;
    var s = d.session;
    if (!m) return '<p class="tm-empty">Toplantı bilgisi yok.</p>';
    var inactive = m.status === 'cancelled' || s.status === 'cancelled';
    var sentCount = d.reservations.filter(function (r) { return r.linkSent; }).length;
    var notSent = d.reservations.filter(function (r) { return !r.linkSent && r.parentApprovalStatus === 'approved'; }).length;
    return (
      (inactive ? '<p class="tm-alert-row is-danger">Bu ders iptal edildiği için link aktif değildir.</p>' : '') +
      '<div class="tm-link-box' + (inactive ? ' is-inactive' : '') + '">' +
        '<div><strong>Platform:</strong> Kurum içi uygulama</div>' +
        copyRow('Davet linki', m.meetingUrl) +
        copyRow('Toplantı ID', m.meetingId) +
        copyRow('Şifre', m.passcode) +
        '<div style="margin-top:8px">' + SL.meetingBadge(m.status) + '</div>' +
        '<div style="margin-top:8px"><strong>PDR öğretmeni erişimi:</strong> ' + (d.pdrTeacher ? U.escapeHtml(U.fullName(d.pdrTeacher.firstName, d.pdrTeacher.lastName)) : '—') + '</div>' +
        '<div><strong>Branş öğretmeni erişimi:</strong> ' + (d.branchTeacher ? U.escapeHtml(U.fullName(d.branchTeacher.firstName, d.branchTeacher.lastName)) : '—') + '</div>' +
        '<div style="margin-top:8px;font-size:12px;color:#64748b">Oluşturulma: ' + U.formatDateTime(m.generatedAt) +
          (m.lastPasscodeChangedAt ? ' · Şifre değişimi: ' + U.formatDateTime(m.lastPasscodeChangedAt) : '') + '</div>' +
        '<div style="margin-top:8px">Link gönderilen: ' + sentCount + ' · Gönderilmeyen (onaylı): ' + notSent + '</div>' +
        '<div style="margin-top:8px;font-size:12px">PDR ve branş öğretmeni aynı linke katılır.</div>' +
      '</div>' +
      '<div class="tm-detail-actions tm-detail-actions--wrap">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-pdr-teacher>PDR WhatsApp</button>' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-branch-teacher>Branş WhatsApp</button>' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-refresh-passcode data-tm-require="edit">Şifre yenile</button>' +
      '</div>'
    );
  }

  function copyRow(label, val) {
    var safe = String(val || '').replace(/"/g, '&quot;');
    return '<div class="tm-copy-row"><span class="tm-detail-cell-label">' + label + '</span><code>' + U.escapeHtml(val) + '</code><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-copy="' + safe + '">Kopyala</button></div>';
  }

  function renderCommunication(d) {
    var logs = Store.getCommunicationLogs().filter(function (l) { return l.sessionId === d.session.id; });
    if (!logs.length) return '<p class="tm-empty">İletişim kaydı yok.</p><button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-comm data-tm-require="edit">İletişim kaydı ekle</button>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>Sonuç</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>' +
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
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.AUDIT_ACTION[l.action] || l.action) +
        '</td><td>' + U.escapeHtml(l.description) + '</td><td>' + U.escapeHtml(l.reason || '—') + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>İşlem</th><th>Açıklama</th><th>Neden</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function renderTab(idx, bodyEl) {
    var d = Store.getSessionWithDetails(currentSessionId);
    if (!d) return;
    var html = '';
    if (idx === 0) html = renderSummary(d);
    else if (idx === 1) html = renderParticipants(d);
    else if (idx === 2) html = renderOnlineLink(d);
    else if (idx === 3) html = renderCommunication(d);
    else if (idx === 4) html = renderAttendance(d);
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
        Confirm.open({
          title: 'Dersi iptal et',
          current: d.lessonType.name + ' · ' + U.formatDateKey(d.session.date) + ' ' + d.session.startTime,
          warning: 'Bağlı rezervasyonlar iptal edilecek. Link görünür kalacak ancak çalışmayacak.',
          affected: names,
          onConfirm: function (reason) {
            Store.cancelSession(d.session.id, reason);
            open(currentSessionId);
            if (global.TMOnSessionChange) global.TMOnSessionChange();
          }
        });
      });
      bodyEl.querySelector('[data-act="inform-pdr"]') && bodyEl.querySelector('[data-act="inform-pdr"]').addEventListener('click', function () {
        if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
        Store.markPdrTeacherInformed(d.session.id);
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        renderTab(0, bodyEl);
      });
      bodyEl.querySelector('[data-act="inform-branch"]') && bodyEl.querySelector('[data-act="inform-branch"]').addEventListener('click', function () {
        if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
        Store.markBranchTeacherInformed(d.session.id);
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        renderTab(0, bodyEl);
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
      bodyEl.querySelectorAll('[data-move-res]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          showMoveReservation(d, btn.getAttribute('data-move-res'));
        });
      });
      bodyEl.querySelectorAll('[data-remove-res]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (global.TMPermissions && !global.TMPermissions.guard('cancel')) return;
          var resId = btn.getAttribute('data-remove-res');
          Confirm.open({
            title: 'Öğrenciyi dersten çıkar',
            warning: 'Rezervasyon iptal edilecek ve kapasite açılacak.',
            requireReason: true,
            danger: true,
            confirmLabel: 'Çıkar',
            onConfirm: function (reason) {
              var result = Store.removeStudentFromSession(d.session.id, resId, reason);
              if (!result.ok) U.notifyError(result.error);
              else {
                U.notifySuccess('Öğrenci dersten çıkarıldı.');
                if (global.TMOnSessionChange) global.TMOnSessionChange();
                renderTab(1, bodyEl);
              }
            }
          });
        });
      });
      bodyEl.querySelector('[data-bulk-link]') && bodyEl.querySelector('[data-bulk-link]').addEventListener('click', function () {
        if (window.TMPermissions && !window.TMPermissions.guard('edit')) return;
        var result = Store.markBulkLinksSentForSession(d.session.id);
        if (!result.ok) U.notifyError(result.error || 'İşlem başarısız.');
        else {
          U.notifySuccess(result.count + ' veli için link gönderildi işaretlendi.');
          if (global.TMOnSessionChange) global.TMOnSessionChange();
          renderTab(1, bodyEl);
        }
      });
      bodyEl.querySelectorAll('[data-wa-parent]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var rid = btn.getAttribute('data-wa-parent');
          var p = d.participants.find(function (x) { return x.reservation.id === rid; });
          if (!p || !p.parent || !QuickMsg) return;
          QuickMsg.openForParent({
            parentName: U.fullName(p.parent.firstName, p.parent.lastName),
            studentName: U.fullName(p.student.firstName, p.student.lastName),
            lessonType: d.lessonType.name,
            date: U.formatDateKey(d.session.date),
            time: d.session.startTime,
            meetingUrl: d.meeting ? d.meeting.meetingUrl : '',
            meetingId: d.meeting ? d.meeting.meetingId : '',
            passcode: d.meeting ? d.meeting.passcode : '',
            phone: p.parent.phone,
            email: p.parent.email
          });
        });
      });
      bodyEl.querySelectorAll('[data-link-sent]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (global.TMPermissions && !global.TMPermissions.guard('edit')) return;
          var res = Store.markLinkSent(btn.getAttribute('data-link-sent'));
          if (!res.ok) U.notifyError(res.error);
          else {
            if (global.TMOnSessionChange) global.TMOnSessionChange();
            renderTab(1, bodyEl);
          }
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
      U.notifyError('Eklenebilecek uygun öğrenci yok (kapasite, branş veya daha önce deneme almış olabilir).');
      return;
    }
    Form.open({
      title: 'Derse öğrenci ekle',
      description: 'Kapasite ve ücretsiz deneme kurallarına uygun öğrenciler listelenir.',
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
      title: 'Saat değiştir',
      fields: [
        { type: 'date', name: 'date', label: 'Yeni tarih', value: d.session.date },
        {
          type: 'select',
          name: 'time',
          label: 'Yeni saat',
          value: d.session.startTime,
          options: slots.map(function (s) { return { value: s, label: s }; })
        }
      ],
      submitLabel: 'Devam',
      onSubmit: function (data) {
        if (!data.date || !data.time) return;
        Confirm.open({
          title: 'Saat değiştir',
          current: U.formatDateKey(d.session.date) + ' ' + d.session.startTime,
          next: U.formatDateKey(data.date) + ' ' + data.time,
          warning: 'Dersteki tüm veliler bilgilendirilmelidir.',
          onConfirm: function (reason) {
            var res = Store.rescheduleSession(d.session.id, data.date, data.time, reason);
            if (!res.ok) U.notifyError(res.error);
            else open(currentSessionId);
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
        { label: 'Özet' }, { label: 'Katılımcılar' }, { label: 'Online Link' },
        { label: 'İletişim' }, { label: 'Katılım' }, { label: 'Geçmiş' }
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

  var TAB_LABELS = ['Özet', 'Katılımcılar', 'Online Link', 'İletişim', 'Katılım', 'Geçmiş'];

  global.TMSessionDetail = { open: open, renderTabAt: renderTabAt, tabLabels: TAB_LABELS };
})(typeof window !== 'undefined' ? window : this);
