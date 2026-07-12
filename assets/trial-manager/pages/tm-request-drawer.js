/**
 * Rezervasyon talebi — sağ drawer (liste ve operasyon merkezinden)
 */
(function (global) {
  'use strict';

  var Store = (global.TMBridge && global.TMBridge.store()) || global.TMStore;
  var U = global.TMUtils;
  var SL = global.TMStatusLabels;
  var Drawer = global.TMDetailDrawer;
  var QuickMsg = global.TMQuickMessage;
  var Form = global.TMFormDialog;
  var Confirm = global.TMConfirmDialog;
  var Perms = global.TMPermissions;

  var currentId = null;
  var activeTab = 0;
  var viewStep = null;       // stepper'da görüntülenen adım (gezinme)
  var contactEditing = null; // İletişim kartı düzenleme modunda mı

  function guard(action) {
    return !Perms || Perms.guard(action);
  }

  function notifyChange() {
    if (global.TMOnSessionChange) global.TMOnSessionChange();
  }

  function fullHref(id) {
    return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
  }

  function context(id) {
    var r = Store.getRequestById(id);
    if (!r) return null;
    var lt = Store.getLessonTypeById(r.requestedLessonTypeId);
    var res = Store.getReservationByRequestId(id);
    // İptal edilmiş rezervasyon aktif sayılmaz (silme/yeniden aktifleştirme sonrası akış doğru başlar).
    if (res && res.status === 'cancelled') res = null;
    var sess = r.selectedSessionId ? Store.getSessionById(r.selectedSessionId) : (res ? Store.getSessionById(res.sessionId) : null);
    var meeting = sess ? Store.getMeetingBySessionId(sess.id) : null;
    var rejected = r.status === 'rejected' || r.status === 'cancelled';
    var deleted = !!r.deleted;
    var locked = rejected || deleted;
    var orphan = Store.isOrphanRequest ? Store.isOrphanRequest(id) : !res;
    return { r: r, lt: lt, res: res, sess: sess, meeting: meeting, rejected: rejected, deleted: deleted, locked: locked, orphan: orphan };
  }

  function detail(l, v) {
    return '<div><div class="tm-detail-cell-label">' + l + '</div><div class="tm-detail-cell-value">' +
      (String(v).indexOf('<') >= 0 ? v : U.escapeHtml(String(v))) + '</div></div>';
  }

  var APPROVAL_KEYS = { unreachable: 1, approved: 1, call_again: 1, rejected: 1, not_called: 1 };
  function commBadge(result) {
    if (result === 'reached') return '<span class="tm-badge tm-badge--green">Ulaşıldı</span>';
    if (APPROVAL_KEYS[result] && SL.parentApprovalBadge) return SL.parentApprovalBadge(result);
    return '<span class="tm-badge tm-badge--muted">' + U.escapeHtml((SL.COMM_RESULT && SL.COMM_RESULT[result]) || result) + '</span>';
  }

  function lastContact(r, res) {
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return l.requestId === r.id || (res && l.reservationId === res.id);
    }).slice().sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    return logs[0] || null;
  }

  var STEPS = ['İletişim', 'Ders<br>Ataması', 'Rezerve', 'Onay', 'Link'];

  function isContacted(r, res) {
    return Store.getCommunicationLogs().some(function (l) {
      return (l.requestId === r.id || (res && l.reservationId === res.id)) &&
        (l.result === 'reached' || l.result === 'approved');
    });
  }

  function renderStepper(currentStep, viewStep, locked, isDeleted) {
    if (locked) {
      var msg = isDeleted ? 'Bu talep iptal edildi.' : 'Bu talep reddedildi / iptal edildi.';
      return '<div class="tm-req-status-banner is-rejected">' + msg +
        ' <button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmReactivate" data-tm-require="edit">Aktif hale getir</button></div>';
    }
    return '<div class="tm-req-steps">' + STEPS.map(function (s, i) {
      var n = i + 1;
      var reachable = n <= currentStep;
      var cls = (n === viewStep ? ' is-current' : (n < currentStep ? ' is-done' : '')) + (reachable ? ' is-clickable' : '');
      var inner = '<span class="tm-req-step-dot">' + n + '</span><span class="tm-req-step-label">' + s + '</span>';
      return reachable
        ? '<button type="button" class="tm-req-step' + cls + '" data-goto-step="' + n + '">' + inner + '</button>'
        : '<span class="tm-req-step' + cls + '">' + inner + '</span>';
    }).join('') + '</div>';
  }

  function contactStatusBadge(status) {
    if (status === 'positive') return '<span class="tm-badge tm-badge--green">Olumlu</span>';
    if (status === 'negative') return '<span class="tm-badge tm-badge--red">Olumsuz</span>';
    if (status === 'unreachable') return '<span class="tm-badge tm-badge--orange">Ulaşılamadı</span>';
    return '<span class="tm-badge tm-badge--muted">Görüşülmedi</span>';
  }

  function channelSelect(current) {
    var opts = '<option value="">Kanal seçin</option>' + Object.keys(SL.COMM_CHANNEL).map(function (k) {
      return '<option value="' + k + '"' + (current === k ? ' selected' : '') + '>' + SL.COMM_CHANNEL[k] + '</option>';
    }).join('');
    return '<select class="tm-dg-control" id="tmContactChannel">' + opts + '</select>';
  }

  function contactForm(r) {
    var cs = r.contactStatus;
    function pill(val, label) {
      return '<button type="button" class="tm-contact-pill' + (cs === val ? ' is-selected' : '') + '" data-contact-opt="' + val + '">' + label + '</button>';
    }
    return '<p class="tm-contact-desc">Görüşme durumunu seçin, kanalı ve açıklamayı girin (hepsi zorunlu). <strong>Olumlu</strong> seçilince ders atama adımına geçilir.</p>' +
      '<div class="tm-contact-field"><span class="tm-contact-label">Durum <span class="tm-req">*</span></span>' +
        '<div class="tm-contact-pills">' + pill('positive', 'Olumlu') + pill('negative', 'Olumsuz') + pill('unreachable', 'Ulaşılamadı') + '</div>' +
      '</div>' +
      '<div class="tm-contact-field"><label class="tm-contact-label" for="tmContactChannel">İletişim kanalı <span class="tm-req">*</span></label>' + channelSelect(r.contactChannel) + '</div>' +
      '<div class="tm-contact-field"><label class="tm-contact-label" for="tmContactNote">Açıklama <span class="tm-req">*</span></label>' +
        '<textarea class="tm-dg-control tm-contact-note" id="tmContactNote" rows="3" placeholder="Görüşme detaylarını giriniz.">' + U.escapeHtml(r.contactNote || '') + '</textarea>' +
      '</div>' +
      '<div class="tm-contact-actions">' +
        '<button type="button" class="tm-btn tm-btn--primary tm-contact-save" id="tmContactSave" data-tm-require="edit">Güncelle</button>' +
        (cs ? '<button type="button" class="tm-btn tm-btn--ghost" id="tmContactCancel">Vazgeç</button>' : '') +
      '</div>';
  }

  function contactResult(r) {
    var status = r.contactStatus;
    var msg, cls;
    if (status === 'positive') { cls = 'is-positive'; msg = 'Veli ile olumlu görüşüldü. Ders atama adımına geçebilirsiniz.'; }
    else if (status === 'negative') { cls = 'is-negative'; msg = 'Veli görüşmesi olumsuz oldu — ücretsiz deneme dersi almayacak. Veli geri dönüş yaparsa durumu güncelleyebilirsiniz.'; }
    else { cls = 'is-unreachable'; msg = 'Veli arandı ancak ulaşılamadı. Yeniden arayıp durumu Olumlu ya da Olumsuz olarak güncelleyebilirsiniz.'; }
    return '<div class="tm-contact-result ' + cls + '">' +
        '<div class="tm-contact-result-top">' + contactStatusBadge(status) + '</div>' +
        '<p class="tm-contact-result-msg">' + U.escapeHtml(msg) + '</p>' +
        (r.contactNote ? '<p class="tm-contact-result-note">Not: ' + U.escapeHtml(r.contactNote) + '</p>' : '') +
      '</div>' +
      '<button type="button" class="tm-btn tm-btn--primary tm-contact-save" id="tmContactEdit" data-tm-require="edit">İletişim durumunu güncelle</button>';
  }

  function contactPanel(r) {
    var editing = contactEditing == null ? !r.contactStatus : contactEditing;
    return '<div class="tm-contact-card">' +
      '<div class="tm-contact-head"><span class="tm-wizard-num">1</span> Veli ile iletişim</div>' +
      (editing ? contactForm(r) : contactResult(r)) +
    '</div>';
  }

  function lessonDayName(dateKey) {
    if (!dateKey) return '';
    var p = String(dateKey).split('-');
    if (p.length !== 3) return '';
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return isNaN(d.getTime()) ? '' : (U.WEEKDAYS[d.getDay()] || '');
  }

  function subjectMeta(lt) {
    var id = lt ? lt.id : '';
    if (id === 'lt-mat') return { name: 'Matematik', cls: 'is-mat', icon: '∑' };
    if (id === 'lt-fen') return { name: 'Fen', cls: 'is-fen', icon: '⚛' };
    return { name: lt ? lt.name : 'Ders', cls: 'is-other', icon: '•' };
  }

  // Derse ait bilgi kartı: ID, konu (Matematik/Fen), gün/tarih/saat, TRIAL etiketi.
  function lessonCard(sess, lt, isPref) {
    var subj = subjectMeta(lt);
    var day = lessonDayName(sess.date);
    return '<div class="tm-lesson-card ' + subj.cls + (isPref ? ' is-pref' : '') + '">' +
      '<div class="tm-lesson-card-top">' +
        '<span class="tm-lesson-subject"><span class="tm-lesson-icon">' + subj.icon + '</span>' + U.escapeHtml(subj.name) + '</span>' +
        '<span class="tm-lesson-trial">TRIAL</span>' +
      '</div>' +
      '<div class="tm-lesson-when">' + U.escapeHtml(U.formatDateKey(sess.date)) + (day ? ' · ' + U.escapeHtml(day) : '') + ' · ' + U.escapeHtml(sess.startTime || '') + (sess.endTime ? '–' + U.escapeHtml(sess.endTime) : '') + '</div>' +
      '<div class="tm-lesson-id">Ders ID <code>' + U.escapeHtml(Store.getLessonCode ? Store.getLessonCode(sess) : sess.id) + '</code>' +
        (isPref ? '<span class="tm-lesson-flag">Velinin form tercihi · henüz atanmadı</span>' : '<span class="tm-lesson-flag is-ok">Atandı ✓</span>') +
      '</div>' +
    '</div>';
  }

  function wizardPanel(step, ctx, assigned) {
    var sess = ctx.sess, lt = ctx.lt;
    var wa = QuickMsg ? '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmDrawerWa">WhatsApp</button>' : '';
    var lessonBox = sess ? lessonCard(sess, lt, !assigned) : '';
    function panel(n, title, d, inner, extra) {
      return '<div class="tm-wizard-head"><span class="tm-wizard-num">' + n + '</span>' + title + '</div>' +
        '<p class="tm-wizard-desc">' + d + '</p>' +
        (extra || '') +
        '<div class="tm-wizard-actions">' + inner + '</div>';
    }
    if (step === 2) {
      return panel(2, 'Öğrenciyi derse ata',
        'Öğrenciyi sınıf seviyesine uygun bir Matematik/Fen dersine yerleştirin.',
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmAssignSession" data-tm-require="edit">' + (assigned ? 'Dersi değiştir' : 'Derse ata') + '</button>',
        lessonBox);
    }
    if (step === 3) {
      return panel(3, 'Rezervasyon oluştur',
        'Atanan derste öğrenciye yer ayırın. Yanlışsa dersi değiştirebilirsiniz.',
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--ghost" id="tmAssignSession" data-tm-require="edit">Dersi değiştir</button>' +
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmCreateRes" data-tm-require="create">Rezervasyon oluştur</button>',
        lessonBox);
    }
    if (step === 4) {
      return panel(4, 'Veli onayını al',
        'Veli deneme dersini onayladığında işaretleyin.',
        '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmApproveParent" data-tm-require="edit">Veli onayladı</button>',
        lessonBox);
    }
    if (step === 5) {
      return panel(5, 'Online linki gönder',
        'Meeting linkini veliye ilettikten sonra işaretleyin.',
        wa + '<button type="button" class="tm-btn tm-btn--sm tm-btn--primary" id="tmMarkLink" data-tm-require="edit">Link gönder</button>',
        lessonBox);
    }
    return '<div class="tm-wizard-done">Tüm adımlar tamamlandı ✓</div>';
  }

  function renderInfo(ctx) {
    var r = ctx.r;
    var lt = ctx.lt;
    var res = ctx.res;
    var sess = ctx.sess;
    var meeting = ctx.meeting;
    var locked = ctx.locked;
    // Olumlu iletişim (ya da zaten bir rezervasyonun varlığı) olmadan ders ataması yapılamaz.
    var contacted = r.contactStatus === 'positive' || !!res;
    var positive = contacted;
    var assigned = contacted && r.status !== 'new' && r.status !== 'rejected' && r.status !== 'cancelled' && !!sess;
    var currentStep = !positive ? 1 : (!assigned ? 2 : (!res ? 3 : (res.parentApprovalStatus !== 'approved' ? 4 : (!res.linkSent ? 5 : 6))));
    // viewStep: hangi adımı görüntülüyoruz (stepper ile gezinme). Ulaşılabilir aralığa kıstır.
    var vs = viewStep == null ? currentStep : viewStep;
    if (vs > currentStep) vs = currentStep;
    if (vs < 1) vs = 1;

    var panel;
    if (locked) {
      panel = '';
    } else if (vs === 1) {
      panel = contactPanel(r);
    } else if (currentStep === 6 && vs === 6) {
      panel = '<div class="tm-wizard"><div class="tm-wizard-done">Tüm adımlar tamamlandı ✓</div></div>';
    } else {
      panel = '<div class="tm-wizard">' + wizardPanel(vs, ctx, assigned) + '</div>';
    }

    // Atanan ders: yalnızca gerçekten atanmışsa dolu, atanan derse göre güncellenir. Bitiş saati de gösterilir.
    var assignedText = (assigned && sess)
      ? (U.formatDateKey(sess.date) + ' ' + (sess.startTime || '') + (sess.endTime ? '–' + sess.endTime : '') + ' · ' + (lt ? lt.name : '') + ' (' + (Store.getLessonCode ? Store.getLessonCode(sess) : sess.id) + ')')
      : '—';

    var code = Store.getReservationCode ? Store.getReservationCode(r.id) : r.id;

    // Talebin geldiği an + velinin formda seçtiği ders saati (preferredSessionId, boş olamaz).
    var preferSid = r.preferredSessionId || r.selectedSessionId;
    var preferSess = preferSid ? Store.getSessionById(preferSid) : null;
    var istedigiText = preferSess
      ? (U.formatDateKey(preferSess.date) + ' ' + (preferSess.startTime || '') + (preferSess.endTime ? '–' + preferSess.endTime : ''))
      : '—';

    return (
      '<div class="tm-res-code"><span class="tm-res-code-label">Rezervasyon ID</span><code class="tm-res-code-val">' + U.escapeHtml(code) + '</code></div>' +
      renderStepper(currentStep, vs, locked, ctx.deleted) +
      '<div class="tm-detail-grid">' +
        detail('Talep tarihi', U.formatDateTime(r.createdAt)) +
        detail('İstediği Ders Tarihi', istedigiText) +
        detail('Öğrenci', r.studentFirstName + ' ' + r.studentLastName) +
        detail('Sınıf', r.studentGrade) +
        detail('Ders türü', lt ? lt.name : '—') +
        detail('Veli', r.parentFirstName + ' ' + r.parentLastName) +
        detail('Telefon', r.parentPhone) +
        detail('E-posta', r.parentEmail) +
        detail('İletişim durumu', contactStatusBadge(r.contactStatus)) +
        detail('Atanan ders', assignedText) +
      '</div>' +
      // Link bölümü yalnızca Link aşamasında (onay tamamlanıp link adımına gelince) görünür.
      (meeting && res && currentStep >= 5 ? '<div class="tm-link-box" style="margin-top:12px"><strong>Online link</strong><br>' + U.escapeHtml(meeting.meetingUrl) + '</div>' : '') +
      panel
    );
  }

  function renderComm(ctx) {
    var res = ctx.res;
    var sess = ctx.sess;
    var logs = Store.getCommunicationLogs().filter(function (l) {
      return l.requestId === ctx.r.id || (res && l.reservationId === res.id) || (sess && l.sessionId === sess.id);
    });
    if (!logs.length) return '<p class="tm-empty">İletişim kaydı yok.</p>';
    var rows = logs.map(function (l) {
      var hasTransition = l.contactTo !== undefined && l.contactTo !== null;
      var eski, yeni;
      if (hasTransition) {
        eski = contactStatusBadge(l.contactFrom === 'none' ? null : l.contactFrom);
        yeni = contactStatusBadge(l.contactTo);
      } else {
        var derived = resultToContact(l.result);
        eski = '<span class="tm-audit-none">—</span>';
        yeni = derived ? contactStatusBadge(derived) : '<span class="tm-audit-none">—</span>';
      }
      return '<tr><td>' + U.formatDateTime(l.createdAt) + '</td><td>' + U.escapeHtml(SL.COMM_CHANNEL[l.channel] || l.channel) +
        '</td><td>' + contactByCell(l.createdByUserId) +
        '</td><td>' + eski + '</td><td>' + yeni +
        '</td><td>' + U.escapeHtml(l.summary) + '</td></tr>';
    }).join('');
    return '<table class="tm-inner-table"><thead><tr><th>Tarih</th><th>Kanal</th><th>İletişim Kuran</th><th>Eski Durum</th><th>Yeni Durum</th><th>Özet</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  // İletişim kaydının sonucundan (result) iletişim durumunu türet (eski seed kayıtları için).
  function resultToContact(result) {
    if (result === 'reached' || result === 'approved') return 'positive';
    if (result === 'declined' || result === 'rejected') return 'negative';
    if (result === 'unreachable' || result === 'call_again') return 'unreachable';
    return null;
  }

  function auditUserName(userId) {
    var u = (Store.getUsers ? Store.getUsers() : []).find(function (x) { return x.id === userId; });
    return u ? U.fullName(u.firstName, u.lastName) : 'Sistem';
  }

  // İletişimi kuran kullanıcı (Trial Class Manager) — ad + rol.
  function contactByCell(userId) {
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
    return String(v);
  }

  var CONTACT_TR = { positive: 'Olumlu', negative: 'Olumsuz', unreachable: 'Ulaşılamadı', call_again: 'Tekrar aranacak', none: 'Görüşülmedi' };
  function contactTr(s) { return CONTACT_TR[s] || 'Görüşülmedi'; }
  function byCell(by) {
    if (by === 'website' || !by) return '<span class="tm-comm-by-name">Web formu / Sistem</span>';
    return contactByCell(by);
  }

  // Talebin/rezervasyonun TÜM yaşam döngüsü: talep alındı → iletişim → derse atama/rezervasyon →
  // veli onayı → link → sonraki değişiklikler. Gerçek zaman damgaları + değişikliği yapan kişi.
  function requestHistory(id) {
    var r = Store.getRequestById(id);
    if (!r) return [];
    var res = Store.getReservationByRequestId(id);
    var sess = res && res.sessionId ? Store.getSessionById(res.sessionId) : (r.selectedSessionId ? Store.getSessionById(r.selectedSessionId) : null);
    var lessonCode = sess && Store.getLessonCode ? Store.getLessonCode(sess) : '';
    var ev = [];
    ev.push({ at: r.createdAt, by: 'website', text: 'Web formundan ücretsiz deneme dersi talebi alındı.', oldV: '—', newV: 'Talep alındı' });
    (Store.getCommunicationLogs ? Store.getCommunicationLogs() : []).filter(function (l) { return l.requestId === id; })
      .forEach(function (l) {
        var chan = SL.COMM_CHANNEL && SL.COMM_CHANNEL[l.channel] ? SL.COMM_CHANNEL[l.channel] : (l.channel || '');
        var hasTrans = (l.contactTo !== undefined && l.contactTo !== null);
        ev.push({ at: l.createdAt, by: l.createdByUserId, text: 'İletişim' + (chan ? ' (' + chan + ')' : '') + (l.summary ? ' — ' + l.summary : ''),
          oldV: hasTrans ? contactTr(l.contactFrom === 'none' ? 'none' : l.contactFrom) : '—', newV: hasTrans ? contactTr(l.contactTo) : '—' });
      });
    if (res) {
      ev.push({ at: res.createdAt, by: 'user-manager-1', text: 'Öğrenci derse atandı ve rezervasyon oluşturuldu.', oldV: 'Atanmadı', newV: lessonCode || 'Atandı' });
      if (res.parentApprovalStatus === 'approved') ev.push({ at: res.updatedAt || res.createdAt, by: 'user-manager-1', text: 'Veli deneme dersini onayladı.', oldV: 'Onay bekliyor', newV: 'Onaylandı' });
      if (res.linkSent && res.linkSentAt) ev.push({ at: res.linkSentAt, by: res.linkSentByUserId || 'user-manager-1', text: 'Online ders linki veliye gönderildi.', oldV: 'Gönderilmedi', newV: 'Gönderildi' });
      if (res.status === 'cancelled') ev.push({ at: res.updatedAt || res.createdAt, by: 'user-manager-1', text: 'Rezervasyon iptal edildi.', oldV: 'Aktif', newV: 'İptal Edildi' });
    }
    (Store.getAuditLogs ? Store.getAuditLogs() : []).filter(function (l) {
      return (l.entityType === 'trial_lesson_request' && l.entityId === id) ||
        (res && l.entityType === 'trial_lesson_reservation' && l.entityId === res.id);
    }).forEach(function (l) {
      ev.push({ at: l.createdAt, by: l.createdByUserId, text: (l.description || (SL.AUDIT_ACTION[l.action] || l.action)) + (l.reason ? ' (Neden: ' + l.reason + ')' : ''), oldV: l.previousValue, newV: l.newValue });
    });
    ev.sort(function (a, b) { return String(b.at || '').localeCompare(String(a.at || '')); });
    return ev;
  }

  function hval(v) { return (v === undefined || v === null || v === '') ? '—' : String(v); }
  function renderAudit(id) {
    var ev = requestHistory(id);
    if (!ev.length) return '<p class="tm-empty">Değişiklik geçmişi yok.</p>';
    var rows = ev.map(function (e) {
      return '<tr><td>' + U.escapeHtml(U.formatDateTime(e.at)) + '</td>' +
        '<td>' + byCell(e.by) + '</td>' +
        '<td>' + U.escapeHtml(e.text) + '</td>' +
        '<td><span class="tm-audit-old">' + U.escapeHtml(hval(e.oldV)) + '</span></td>' +
        '<td><span class="tm-audit-new">' + U.escapeHtml(hval(e.newV)) + '</span></td></tr>';
    }).join('');
    return '<table class="tm-inner-table tm-upcoming-table tm-fixed-table"><colgroup><col style="width:16%"><col style="width:20%"><col style="width:32%"><col style="width:16%"><col style="width:16%"></colgroup>' +
      '<thead><tr><th>Tarih &amp; Saat</th><th>Değişikliği yapan</th><th>Değişiklik / İşlem</th><th>Eski Durum</th><th>Yeni Durum</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function openCommForm(ctx) {
    if (!Form || !guard('edit')) return;
    var r = ctx.r;
    var res = ctx.res;
    var sess = ctx.sess;
    Form.open({
      title: 'İletişim kaydı ekle',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: Object.keys(SL.COMM_CHANNEL).map(function (k) { return { value: k, label: SL.COMM_CHANNEL[k] }; }), value: 'phone' },
        { type: 'select', name: 'result', label: 'Sonuç', options: Object.keys(SL.COMM_RESULT).map(function (k) { return { value: k, label: SL.COMM_RESULT[k] }; }), value: 'message_sent' },
        { type: 'textarea', name: 'summary', label: 'Özet', rows: 4, required: true },
        { type: 'text', name: 'nextAction', label: 'Sonraki aksiyon', required: false }
      ],
      onSubmit: function (data) {
        Store.addCommunicationLog({
          summary: data.summary,
          channel: data.channel,
          result: data.result,
          nextAction: data.nextAction || '',
          reservationId: res ? res.id : undefined,
          sessionId: sess ? sess.id : undefined,
          parentId: res ? res.parentId : undefined,
          studentId: res ? res.studentId : undefined
        });
        U.notifySuccess('İletişim kaydı eklendi.');
        notifyChange();
        open(currentId, activeTab);
      }
    });
  }

  // İletişim sonucu (ulaşılamadı / tekrar aranacak) — rezervasyon olmasa da her zaman kaydedilir.
  function recordContact(ctx, result, label) {
    if (!Form || !guard('edit')) return;
    var res = ctx.res;
    Form.open({
      title: label,
      description: 'Görüşme sonucu iletişim geçmişine kaydedilir.',
      fields: [
        { type: 'select', name: 'channel', label: 'Kanal', options: Object.keys(SL.COMM_CHANNEL).map(function (k) { return { value: k, label: SL.COMM_CHANNEL[k] }; }), value: 'phone' },
        { type: 'textarea', name: 'summary', label: 'Görüşme notu', rows: 3, required: true },
        { type: 'text', name: 'nextAction', label: 'Sonraki aksiyon', required: false }
      ],
      submitLabel: 'Kaydet',
      onSubmit: function (data) {
        Store.addCommunicationLog({
          channel: data.channel,
          result: result,
          summary: data.summary,
          nextAction: data.nextAction || '',
          requestId: currentId,
          reservationId: res ? res.id : undefined,
          parentId: res ? res.parentId : undefined,
          studentId: res ? res.studentId : undefined
        });
        if (res && Store.updateParentApproval && (result === 'unreachable' || result === 'call_again')) Store.updateParentApproval(res.id, result);
        U.notifySuccess(label + ' kaydedildi.');
        notifyChange();
        open(currentId, activeTab);
      }
    });
  }

  function recordApproval(ctx) {
    if (!Form || !guard('edit') || !ctx.res) return;
    var res = ctx.res;
    Form.open({
      title: 'Veli onayı',
      description: 'Velinin deneme dersini onayladığını kaydedin.',
      fields: [
        { type: 'textarea', name: 'summary', label: 'Onay notu (opsiyonel)', rows: 2, required: false }
      ],
      submitLabel: 'Onayı kaydet',
      onSubmit: function (data) {
        var result = Store.approveParentForRequest(currentId);
        if (!result.ok) { U.notifyError(result.error); return; }
        Store.addCommunicationLog({
          channel: 'phone',
          result: 'approved',
          summary: data.summary || 'Veli deneme dersini onayladı.',
          requestId: currentId,
          reservationId: res.id,
          parentId: res.parentId,
          studentId: res.studentId
        });
        U.notifySuccess('Veli onayı kaydedildi.');
        notifyChange();
        open(currentId, 0);
      }
    });
  }

  function openAssignSession(ctx) {
    if (!Form || !guard('edit')) return;
    var r = ctx.r;
    // Yalnızca öğrencinin istediği TÜR ve SINIF seviyesine (5/6/7/8) uygun, uygun (gelecek,
    // dolu olmayan) dersler listelenir; böylece atama sırasında "ders uygun değil" oluşmaz.
    var sessions = Store.getAvailableSessionsForLessonType(r.requestedLessonTypeId).filter(function (s) {
      return !s.gradeLevel || s.gradeLevel === r.studentGrade;
    });
    if (!sessions.length) {
      U.notifyError('Bu öğrencinin sınıfına (' + (r.studentGrade || '—') + ') ve istediği derse uygun boş ders bulunamadı. Önce uygun bir ders planlayın.');
      return;
    }
    Form.open({
      title: 'Derse ata',
      description: 'Öğrenci: ' + U.escapeHtml(r.studentFirstName + ' ' + r.studentLastName) + ' · ' + U.escapeHtml(r.studentGrade || '—') +
        ' · ' + U.escapeHtml((ctx.lt ? ctx.lt.name : '')) + '. Yalnızca bu tür ve sınıfa uygun dersler listelenir.',
      fields: [{
        type: 'select',
        name: 'sessionId',
        label: 'Ders oturumu',
        value: (r.selectedSessionId && sessions.some(function (s) { return s.id === r.selectedSessionId; })) ? r.selectedSessionId : '',
        options: sessions.map(function (s) {
          var code = Store.getLessonCode ? Store.getLessonCode(s) : s.id;
          return { value: s.id, label: code + ' · ' + (s.gradeLevel || '') + ' · ' + U.formatDateKey(s.date) + ' ' + s.startTime + (s.endTime ? '–' + s.endTime : '') };
        })
      }],
      onSubmit: function (data) {
        var result = Store.assignRequestToSession(currentId, data.sessionId);
        if (!result.ok) U.notifyError(result.error);
        else {
          U.notifySuccess('Talep derse atandı.');
          notifyChange();
          open(currentId, 0);
        }
      }
    });
  }

  function bindActions(ctx, body) {
    var r = ctx.r;
    var res = ctx.res;
    var sess = ctx.sess;
    var meeting = ctx.meeting;
    var locked = ctx.locked;

    // Kilitli (silinmiş / reddedilmiş / iptal) talebi yeniden aktifleştir → Bekliyor, stepper geri gelir.
    var reactBtn = body.querySelector('#tmReactivate');
    if (reactBtn) reactBtn.onclick = function () {
      if (!guard('edit')) return;
      var name = r.studentFirstName + ' ' + r.studentLastName;
      function doReactivate() {
        var result = Store.reactivateRequest(currentId);
        if (!result.ok) { U.notifyError(result.error); return; }
        U.notifySuccess('Talep yeniden aktifleştirildi.');
        notifyChange();
        open(currentId, 0);
      }
      if (Confirm) {
        Confirm.open({
          title: 'Aktif hale getir',
          warning: name + ' adlı öğrencinin talebini yeniden aktifleştirmek istediğinize emin misiniz? Durum "Bekliyor" olur ve süreç (İletişim → Ders Ataması → Rezerve → Onay → Link) baştan devam eder.',
          requireReason: false,
          confirmLabel: 'Aktif hale getir',
          cancelLabel: 'Vazgeç',
          danger: false,
          onConfirm: doReactivate
        });
      } else if (window.confirm('Talep aktif hale getirilsin mi?')) {
        doReactivate();
      }
    };

    var waBtn = body.querySelector('#tmDrawerWa');
    if (waBtn && QuickMsg) {
      waBtn.onclick = function () {
        QuickMsg.openForParent({
          parentName: r.parentFirstName + ' ' + r.parentLastName,
          studentName: r.studentFirstName + ' ' + r.studentLastName,
          lessonType: ctx.lt ? ctx.lt.name : 'Deneme dersi',
          date: sess ? U.formatDateKey(sess.date) : '—',
          time: sess ? sess.startTime : '—',
          meetingUrl: meeting ? meeting.meetingUrl : '',
          meetingId: meeting ? meeting.meetingId : '',
          passcode: meeting ? meeting.passcode : '',
          phone: r.parentPhone,
          email: r.parentEmail
        });
      };
    }

    var assignBtn = body.querySelector('#tmAssignSession');
    if (assignBtn && !locked) assignBtn.onclick = function () { openAssignSession(ctx); };

    var createBtn = body.querySelector('#tmCreateRes');
    if (createBtn) {
      createBtn.onclick = function () {
        if (!guard('create')) return;
        var result = Store.createReservationFromRequest(currentId);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Rezervasyon oluşturuldu.'); notifyChange(); open(currentId, 0); }
      };
    }

    var approveBtn = body.querySelector('#tmApproveParent');
    if (approveBtn) approveBtn.onclick = function () { recordApproval(ctx); };

    // Stepper ile adımlar arasında gezinme
    body.querySelectorAll('[data-goto-step]').forEach(function (stepBtn) {
      stepBtn.onclick = function () {
        viewStep = parseInt(stepBtn.getAttribute('data-goto-step'), 10) || 1;
        contactEditing = null;
        renderTab(body, currentId, activeTab);
      };
    });

    // İletişim durumu seçenekleri (pill)
    body.querySelectorAll('[data-contact-opt]').forEach(function (pillBtn) {
      pillBtn.onclick = function () {
        body.querySelectorAll('[data-contact-opt]').forEach(function (p) { p.classList.remove('is-selected'); });
        pillBtn.classList.add('is-selected');
      };
    });

    // Sonuç ekranından düzenlemeye geç / vazgeç
    var contactEditBtn = body.querySelector('#tmContactEdit');
    if (contactEditBtn) contactEditBtn.onclick = function () { contactEditing = true; viewStep = 1; renderTab(body, currentId, activeTab); };
    var contactCancelBtn = body.querySelector('#tmContactCancel');
    if (contactCancelBtn) contactCancelBtn.onclick = function () { contactEditing = false; renderTab(body, currentId, activeTab); };

    var contactSaveBtn = body.querySelector('#tmContactSave');
    if (contactSaveBtn) {
      contactSaveBtn.onclick = function () {
        if (!guard('edit')) return;
        var selected = body.querySelector('.tm-contact-pill.is-selected');
        var channelEl = body.querySelector('#tmContactChannel');
        var noteEl = body.querySelector('#tmContactNote');
        var status = selected ? selected.getAttribute('data-contact-opt') : '';
        if (!status) { U.notifyError('Lütfen bir durum seçin: Olumlu, Olumsuz veya Ulaşılamadı.'); return; }
        if (!channelEl || !channelEl.value) { U.notifyError('Lütfen iletişim kanalını seçin.'); return; }
        if (!noteEl || !noteEl.value.trim()) { U.notifyError('Lütfen açıklama girin.'); return; }
        var result = Store.setRequestContactStatus(currentId, { status: status, channel: channelEl.value, note: noteEl.value });
        if (!result.ok) { U.notifyError(result.error); return; }
        U.notifySuccess('İletişim durumu kaydedildi.');
        notifyChange();
        contactEditing = false;
        // Olumlu ise ders atama adımına ilerle; değilse sonuç ekranını göster.
        viewStep = status === 'positive' ? 2 : 1;
        renderTab(body, currentId, activeTab);
      };
    }

    var linkBtn = body.querySelector('#tmMarkLink');
    if (linkBtn && res) {
      linkBtn.onclick = function () {
        if (!guard('edit')) return;
        var result = Store.markLinkSent(res.id);
        if (!result.ok) U.notifyError(result.error);
        else { U.notifySuccess('Link gönderildi.'); notifyChange(); open(currentId, 0); }
      };
    }

    // İletişim sekmesindeki "Kayıt ekle" butonu
    var commBtn = body.querySelector('#tmAddCommTab');
    if (commBtn) commBtn.onclick = function () { openCommForm(ctx); };
  }

  function copyText(text) {
    function ok() { U.notifySuccess('Kişi kartı kopyalandı — WhatsApp/mail ile paylaşabilirsiniz.'); }
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      global.navigator.clipboard.writeText(text).then(ok, function () { legacyCopy(text, ok); });
    } else {
      legacyCopy(text, ok);
    }
  }
  function legacyCopy(text, ok) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      ok();
    } catch (e) {
      U.notifyError('Kopyalanamadı.');
    }
  }

  function renderTab(body, id, tabIndex) {
    var ctx = context(id);
    if (!ctx) {
      body.innerHTML = '<p class="tm-empty">Talep bulunamadı.</p>';
      return;
    }
    if (tabIndex === 1) body.innerHTML = renderComm(ctx);
    else if (tabIndex === 2) body.innerHTML = renderAudit(id);
    else body.innerHTML = renderInfo(ctx);
    bindActions(ctx, body);
    if (Perms && Perms.applyPageChrome) Perms.applyPageChrome(body);
  }

  function open(id, tab, opts) {
    if (!Store || !Drawer || !id) return;
    opts = opts || {};
    currentId = id;
    activeTab = tab || 0;
    viewStep = null;
    contactEditing = null;
    var ctx = context(id);
    if (!ctx) return;
    var r = ctx.r;
    var code = Store.getReservationCode ? Store.getReservationCode(id) : r.id;
    Drawer.open({
      title: r.studentFirstName + ' ' + r.studentLastName,
      subtitle: code,
      tabs: [{ label: 'Talep bilgisi' }, { label: 'İletişim' }, { label: 'Geçmiş' }],
      activeTab: activeTab,
      onBack: opts.onBack || null,
      backLabel: opts.backLabel || null,
      onTab: function (idx, body) {
        activeTab = idx;
        renderTab(body, id, idx);
      }
    });
  }

  global.TMRequestDrawer = { open: open };
})(typeof window !== 'undefined' ? window : this);
