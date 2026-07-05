/**
 * Deneme dersi oturumu detay drawer — 6 sekme
 */
(function (global) {
  'use strict';

  var Store = global.TMStore;
  var U = global.TMUtils;
  var SL = global.TMStatusLabels;
  var Drawer = global.TMDetailDrawer;
  var Confirm = global.TMConfirmDialog;
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
    return (
      '<div class="tm-detail-grid">' +
        cell('Ders türü', d.lessonType ? d.lessonType.name : '—') +
        cell('Tarih', U.formatDateKey(s.date)) +
        cell('Saat', U.formatTimeRange(s.startTime, s.endTime)) +
        cell('Süre', '50 dk (Veli 20 + Öğrenci 30)') +
        cell('Öğretmen', d.teacher ? U.fullName(d.teacher.firstName, d.teacher.lastName) : '—') +
        cell('Kapasite', cap + ' / 20 (boş: ' + remaining + ')') +
        cell('Durum', SL.sessionBadge(s.status)) +
        cell('Öğretmen bilgilendirme', s.teacherInformed ? '<span class="tm-badge tm-badge--green">Bilgilendirildi</span>' : '<span class="tm-badge tm-badge--orange">Bilgilendirilmedi</span>') +
        cell('Son güncelleme', U.formatDateTime(s.updatedAt)) +
      '</div>' +
      (s.notes ? '<p><strong>Not:</strong> ' + U.escapeHtml(s.notes) + '</p>' : '') +
      '<div class="tm-detail-actions">' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="change-teacher">Öğretmen değiştir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="reschedule">Saat değiştir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="inform-teacher">Öğretmeni bilgilendir</button>' +
        '<button type="button" class="tm-btn tm-btn--ghost tm-btn--sm" data-act="attendance">Katılım gir</button>' +
        '<button type="button" class="tm-btn tm-btn--danger tm-btn--sm" data-act="cancel">Dersi iptal et</button>' +
      '</div>'
    );
  }

  function cell(label, value) {
    return '<div><div class="tm-detail-cell-label">' + label + '</div><div class="tm-detail-cell-value">' + value + '</div></div>';
  }

  function renderParticipants(d) {
    if (!d.participants.length) return '<p class="tm-empty">Katılımcı yok.</p>';
    var rows = d.participants.map(function (p) {
      var st = p.student;
      var pa = p.parent;
      var r = p.reservation;
      return '<tr>' +
        '<td>' + U.escapeHtml(st ? U.fullName(st.firstName, st.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(st ? st.grade : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? U.fullName(pa.firstName, pa.lastName) : '—') + '</td>' +
        '<td>' + U.escapeHtml(pa ? pa.phone : '—') + '</td>' +
        '<td>' + SL.parentApprovalBadge(r.parentApprovalStatus) + '</td>' +
        '<td>' + (r.linkSent ? '<span class="tm-badge tm-badge--green">Gönderildi</span>' : '<span class="tm-badge tm-badge--orange">Hayır</span>') + '</td>' +
        '<td>' + SL.reservationBadge(r.status) + '</td>' +
        '<td><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-link-sent="' + r.id + '">Link gönderildi</button></td>' +
      '</tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Öğrenci</th><th>Sınıf</th><th>Veli</th><th>Telefon</th><th>Veli onay</th><th>Link</th><th>Durum</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>';
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
        '<div style="margin-top:8px;font-size:12px;color:#64748b">Oluşturulma: ' + U.formatDateTime(m.generatedAt) +
          (m.lastPasscodeChangedAt ? ' · Şifre değişimi: ' + U.formatDateTime(m.lastPasscodeChangedAt) : '') + '</div>' +
        '<div style="margin-top:8px">Link gönderilen: ' + sentCount + ' · Gönderilmeyen (onaylı): ' + notSent + '</div>' +
      '</div>' +
      '<div class="tm-detail-actions">' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-wa-teacher>Öğretmen WhatsApp</button>' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-refresh-passcode>Şifre yenile</button>' +
      '</div>'
    );
  }

  function copyRow(label, val) {
    var safe = String(val || '').replace(/"/g, '&quot;');
    return '<div class="tm-copy-row"><span class="tm-detail-cell-label">' + label + '</span><code>' + U.escapeHtml(val) + '</code><button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" data-copy="' + safe + '">Kopyala</button></div>';
  }

  function renderCommunication(d) {
    var logs = Store.getCommunicationLogs().filter(function (l) { return l.sessionId === d.session.id; });
    if (!logs.length) return '<p class="tm-empty">İletişim kaydı yok.</p><button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-comm>İletişim kaydı ekle</button>';
    var rows = logs.map(function (l) {
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + U.escapeHtml(SL.COMM_RESULT[l.result] || l.result) + '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>Sonuç</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" data-add-comm style="margin-top:12px">İletişim kaydı ekle</button>';
  }

  function renderAttendance(d) {
    if (d.session.status !== 'completed' && d.session.date >= Store.todayKey()) {
      return '<p class="tm-empty">Ders tamamlandıktan sonra katılım girilebilir. Dersi tamamlamak için sonuçları kaydedin.</p>';
    }
    var rows = d.participants.map(function (p) {
      var r = p.reservation;
      return '<tr data-res="' + r.id + '">' +
        '<td>' + U.escapeHtml(p.student ? U.fullName(p.student.firstName, p.student.lastName) : '') + '</td>' +
        '<td><select class="tm-dg-control" data-att-status><option value="attended"' + (r.status === 'attended' ? ' selected' : '') + '>Katıldı</option><option value="no_show"' + (r.status === 'no_show' ? ' selected' : '') + '>Gelmedi</option></select></td>' +
        '<td><input type="checkbox" data-att-enrolled' + (r.enrolled ? ' checked' : '') + '></td>' +
        '<td><input type="text" class="tm-dg-control" data-att-note value="' + U.escapeHtml(r.notes || '') + '" placeholder="Not"></td>' +
      '</tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Öğrenci</th><th>Katılım</th><th>Kayıt oldu</th><th>Not</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<button type="button" class="tm-btn tm-btn--primary" data-save-attendance style="margin-top:12px">Katılım sonuçlarını kaydet</button>';
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
  }

  function bindTabActions(bodyEl, d, idx) {
    bodyEl.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () { copyText(btn.getAttribute('data-copy')); });
    });
    if (idx === 0) {
      bodyEl.querySelector('[data-act="cancel"]') && bodyEl.querySelector('[data-act="cancel"]').addEventListener('click', function () {
        var affected = Rules.getAffectedPeopleForSessionChange(d.session.id);
        var names = [];
        if (d.teacher) names.push('Öğretmen: ' + U.fullName(d.teacher.firstName, d.teacher.lastName));
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
      bodyEl.querySelector('[data-act="inform-teacher"]') && bodyEl.querySelector('[data-act="inform-teacher"]').addEventListener('click', function () {
        Store.markTeacherInformed(d.session.id);
        renderTab(0, bodyEl);
      });
      bodyEl.querySelector('[data-act="change-teacher"]') && bodyEl.querySelector('[data-act="change-teacher"]').addEventListener('click', function () {
        showTeacherPicker(d);
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
      bodyEl.querySelectorAll('[data-link-sent]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var res = Store.markLinkSent(btn.getAttribute('data-link-sent'));
          if (!res.ok) alert(res.error);
          else renderTab(1, bodyEl);
        });
      });
    }
    if (idx === 2) {
      bodyEl.querySelector('[data-refresh-passcode]') && bodyEl.querySelector('[data-refresh-passcode]').addEventListener('click', function () {
        Confirm.open({
          title: 'Şifre yenile',
          warning: 'Yeni şifre oluşturulacak. Velilere tekrar göndermeniz gerekebilir.',
          onConfirm: function (reason) {
            Store.refreshMeetingPasscode(d.meeting.id, reason);
            renderTab(2, bodyEl);
          }
        });
      });
      bodyEl.querySelector('[data-wa-teacher]') && bodyEl.querySelector('[data-wa-teacher]').addEventListener('click', function () {
        if (!d.teacher || !Msg) return;
        var text = Msg.teacherInfo({
          teacherName: U.fullName(d.teacher.firstName, d.teacher.lastName),
          date: U.formatDateKey(d.session.date),
          time: d.session.startTime,
          lessonType: d.lessonType.name,
          studentCount: d.session.enrolledStudentIds.length
        });
        window.open(Msg.whatsappUrl(d.teacher.phone, text), '_blank');
      });
    }
    if (idx === 4) {
      bodyEl.querySelector('[data-save-attendance]') && bodyEl.querySelector('[data-save-attendance]').addEventListener('click', function () {
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
        alert('Katılım sonuçları kaydedildi.');
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        open(currentSessionId);
      });
    }
  }

  function showTeacherPicker(d) {
    var eligible = Store.getTeachers().filter(function (t) {
      return t.isActive && Rules.isTeacherEligibleForLessonType(t.id, d.session.lessonTypeId) &&
        t.id !== d.session.teacherId &&
        !Rules.hasTeacherConflict(t.id, d.session.date, d.session.startTime, d.session.endTime, d.session.id);
    });
    if (!eligible.length) { alert('Uygun öğretmen bulunamadı.'); return; }
    var names = eligible.map(function (t) { return U.fullName(t.firstName, t.lastName); });
    var choice = prompt('Yeni öğretmen seçin (numara):\n' + names.map(function (n, i) { return (i + 1) + '. ' + n; }).join('\n'));
    var idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || !eligible[idx]) return;
    var newT = eligible[idx];
    var affected = Rules.getAffectedPeopleForSessionChange(d.session.id);
    var affNames = [U.fullName(d.teacher.firstName, d.teacher.lastName), U.fullName(newT.firstName, newT.lastName)];
    Confirm.open({
      title: 'Öğretmen değiştir',
      current: U.fullName(d.teacher.firstName, d.teacher.lastName),
      next: U.fullName(newT.firstName, newT.lastName),
      affected: affNames,
      warning: 'Online link aynı kalacak. Öğretmen bilgilendirme sıfırlanabilir.',
      onConfirm: function (reason) {
        var res = Store.changeSessionTeacher(d.session.id, newT.id, reason);
        if (!res.ok) alert(res.error);
        else open(currentSessionId);
        if (global.TMOnSessionChange) global.TMOnSessionChange();
      }
    });
  }

  function showReschedule(d) {
    var newDate = prompt('Yeni tarih (YYYY-MM-DD):', d.session.date);
    if (!newDate) return;
    var newTime = prompt('Yeni saat (11:00, 12:00, 13:00, 14:00):', d.session.startTime);
    if (!newTime) return;
    Confirm.open({
      title: 'Saat değiştir',
      current: U.formatDateKey(d.session.date) + ' ' + d.session.startTime,
      next: U.formatDateKey(newDate) + ' ' + newTime,
      warning: 'Dersteki tüm veliler bilgilendirilmelidir.',
      onConfirm: function (reason) {
        var res = Store.rescheduleSession(d.session.id, newDate, newTime, reason);
        if (!res.ok) alert(res.error);
        else open(currentSessionId);
        if (global.TMOnSessionChange) global.TMOnSessionChange();
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

  global.TMSessionDetail = { open: open };
})(typeof window !== 'undefined' ? window : this);
