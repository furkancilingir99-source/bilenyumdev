/**
 * Başvuru (rezervasyon) tabanlı öğrenci seçici — veli / öğretmen iletişim araçları
 */
(function (global) {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function phoneDigits(phone) {
    return String(phone || '').replace(/\D/g, '');
  }

  function reservationDetailUrl(id) {
    return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
  }

  function buildParentSlotMessage(applicant, ctx) {
    ctx = ctx || {};
    var lines = [
      'Merhaba ' + applicant.parent + ',',
      '',
      applicant.name + ' için ' + (ctx.subject || applicant.subject) + ' deneme dersi planlanmaktadır.',
      'Önerilen ders saati: ' + (ctx.lessonSlotLabel || '—') + '.',
      'Mevcut tercih slotunuz: ' + (applicant.preferredSlot || '—') + '.',
      '',
      'Bu saat sizin için uygun mudur? Onayınızı rica ederiz.',
      '',
      'Bilenyum Deneme Dersi Ekibi'
    ];
    return lines.join('\n');
  }

  function buildTeacherLessonMessage(teacher, ctx) {
    ctx = ctx || {};
    var studentLines = (ctx.studentNames || []).length
      ? ctx.studentNames.map(function (n) { return '• ' + n; }).join('\n')
      : '• (Henüz öğrenci seçilmedi)';
    return [
      'Merhaba ' + (teacher ? teacher.name : 'Öğretmen') + ',',
      '',
      'Deneme dersi planı:',
      'Branş: ' + (ctx.subject || '—'),
      'Sınıf: ' + (ctx.grade || '—'),
      'Tarih / saat: ' + (ctx.lessonSlotLabel || '—'),
      ctx.lessonId ? 'Ders ID: ' + ctx.lessonId : '',
      '',
      'Derse katılacak öğrenciler:',
      studentLines,
      '',
      'Değişiklik veya uygunluk bilgisi için lütfen dönüş yapın.',
      '',
      'Bilenyum Deneme Dersi Yöneticisi'
    ].filter(Boolean).join('\n');
  }

  function whatsAppUrl(phone, message) {
    var digits = phoneDigits(phone);
    if (digits.charAt(0) === '0') digits = '90' + digits.slice(1);
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(message || '');
  }

  function mailtoUrl(email, subject, body) {
    return 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subject || '') + '&body=' + encodeURIComponent(body || '');
  }

  function slotBadge(applicant, lessonSlotLabel) {
    if (!lessonSlotLabel) return '<span class="tm-applicant-slot is-neutral">Ders saati seçilmedi</span>';
    if (applicant.slotMatchesLesson && applicant.slotConfirmedByParent) {
      return '<span class="tm-applicant-slot is-ok">Veli onaylı · uyumlu</span>';
    }
    if (applicant.slotMatchesLesson && !applicant.slotConfirmedByParent) {
      return '<span class="tm-applicant-slot is-warn">Slot uyumlu · veli onayı bekleniyor</span>';
    }
    return '<span class="tm-applicant-slot is-warn">Tercih farklı — veli ile görüşün</span>';
  }

  function contactActions(applicant, ctx, inputAttr) {
    var attr = inputAttr || 'data-student-id';
    var parentMsg = buildParentSlotMessage(applicant, ctx);
    var wa = whatsAppUrl(applicant.phone, parentMsg);
    var mail = mailtoUrl(
      applicant.email,
      'Deneme dersi slot onayı — ' + applicant.name,
      parentMsg
    );
    var tel = 'tel:' + phoneDigits(applicant.phone);
    return (
      '<div class="tm-applicant-contacts">' +
        '<a class="tm-contact-chip" href="' + escapeHtml(tel) + '" title="Veliyi ara">Ara</a>' +
        '<a class="tm-contact-chip" href="' + escapeHtml(mail) + '" title="Veliye e-posta">E-posta</a>' +
        '<a class="tm-contact-chip is-wa" href="' + escapeHtml(wa) + '" target="_blank" rel="noopener" title="WhatsApp">WhatsApp</a>' +
        (ctx.lessonSlotLabel && applicant.needsParentContact
          ? '<button type="button" class="tm-contact-chip is-confirm" data-confirm-slot="' + escapeHtml(applicant.reservationId) + '" data-slot-label="' + escapeHtml(ctx.lessonSlotLabel) + '">Veli onayladı</button>'
          : '') +
        '<a class="tm-contact-chip is-ghost" href="' + reservationDetailUrl(applicant.reservationId) + '">Rezervasyon</a>' +
      '</div>'
    );
  }

  function renderTeacherCoordination(teacher, ctx) {
    if (!teacher || !teacher.name) return '';
    var msg = buildTeacherLessonMessage(teacher, ctx);
    var mail = teacher.email ? mailtoUrl(teacher.email, 'Deneme dersi planı — ' + (ctx.subject || ''), msg) : '#';
    var tel = teacher.phone ? 'tel:' + phoneDigits(teacher.phone) : '#';
    var wa = teacher.phone ? whatsAppUrl(teacher.phone, msg) : '#';
    return (
      '<div class="tm-coord-panel is-teacher">' +
        '<div class="tm-coord-panel-head">' +
          '<span class="tm-coord-panel-icon" aria-hidden="true">👨‍🏫</span>' +
          '<div>' +
            '<h4 class="tm-coord-panel-title">Öğretmen ile koordinasyon</h4>' +
            '<p class="tm-coord-panel-sub">Ders saati ve öğrenci listesi değişikliklerinde öğretmeni bilgilendirin.</p>' +
          '</div>' +
        '</div>' +
        '<dl class="tm-coord-dl">' +
          '<div><dt>Öğretmen</dt><dd><strong>' + escapeHtml(teacher.name) + '</strong></dd></div>' +
          (teacher.phone ? '<div><dt>Telefon</dt><dd>' + escapeHtml(teacher.phone) + '</dd></div>' : '') +
          (teacher.email ? '<div><dt>E-posta</dt><dd>' + escapeHtml(teacher.email) + '</dd></div>' : '') +
          (ctx.lessonSlotLabel ? '<div><dt>Planlanan ders</dt><dd>' + escapeHtml(ctx.lessonSlotLabel) + '</dd></div>' : '') +
        '</dl>' +
        '<div class="tm-applicant-contacts">' +
          (teacher.phone ? '<a class="tm-contact-chip" href="' + escapeHtml(tel) + '">Ara</a>' : '') +
          (teacher.email ? '<a class="tm-contact-chip" href="' + escapeHtml(mail) + '">E-posta gönder</a>' : '') +
          (teacher.phone ? '<a class="tm-contact-chip is-wa" href="' + escapeHtml(wa) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderParentCoordinationAlert(applicants, selectedIds, lessonSlotLabel) {
    if (!lessonSlotLabel || !selectedIds.length) return '';
    var needs = applicants.filter(function (a) {
      return selectedIds.indexOf(a.reservationId) !== -1 && a.needsParentContact;
    });
    if (!needs.length) return '';
    return (
      '<div class="tm-coord-panel is-parent-alert">' +
        '<div class="tm-coord-panel-head">' +
          '<span class="tm-coord-panel-icon" aria-hidden="true">📞</span>' +
          '<div>' +
            '<h4 class="tm-coord-panel-title">Veli onayı gerekli (' + needs.length + ')</h4>' +
            '<p class="tm-coord-panel-sub">Seçili öğrencilerden bazılarının tercih slotu ders saatiyle uyuşmuyor veya veli onayı alınmamış. Kaydetmeden önce veli ile iletişime geçin.</p>' +
          '</div>' +
        '</div>' +
        '<ul class="tm-coord-alert-list">' +
          needs.map(function (a) {
            return '<li><strong>' + escapeHtml(a.name) + '</strong> · ' + escapeHtml(a.parent) + ' · tercih: ' + escapeHtml(a.preferredSlot) + '</li>';
          }).join('') +
        '</ul>' +
      '</div>'
    );
  }

  function filterApplicants(applicants, query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return applicants;
    return applicants.filter(function (a) {
      var hay = [
        a.reservationId, a.name, a.parent, a.phone, a.email,
        a.preferredSlot, a.statusLabel
      ].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function renderApplicantTable(applicants, selectedIds, opts) {
    opts = opts || {};
    var inputAttr = opts.inputAttr || 'data-student-id';
    var ctx = {
      subject: opts.subject,
      grade: opts.grade,
      lessonSlotLabel: opts.lessonSlotLabel,
      lessonId: opts.lessonId
    };
    var filtered = filterApplicants(applicants, opts.searchQuery);

    if (!applicants.length) {
      return '<p class="tm-planner-students-hint">Bu branş ve sınıf için uygun başvuru (rezervasyon) bulunamadı.</p>';
    }
    if (!filtered.length) {
      return '<p class="tm-planner-students-hint">Arama kriterine uygun başvuru yok.</p>';
    }

    return (
      '<div class="tm-res-table-wrap tm-applicant-table-wrap">' +
        '<table class="tm-detail-table tm-res-table--rich tm-applicant-table">' +
          '<thead><tr>' +
            '<th class="tm-col-check"></th>' +
            '<th>Rezervasyon</th><th>Öğrenci</th><th>Veli</th><th>İletişim</th>' +
            '<th>Tercih slotu</th><th>Slot durumu</th><th>Başvuru</th><th>Veli / koordinasyon</th>' +
          '</tr></thead>' +
          '<tbody>' +
            filtered.map(function (a) {
              var checked = selectedIds.indexOf(a.reservationId) !== -1;
              var disabled = a.hasConflict && !checked;
              var rowCls = checked ? ' is-selected' : '';
              if (disabled) rowCls += ' is-blocked';
              return (
                '<tr class="tm-applicant-row' + rowCls + '">' +
                  '<td class="tm-col-check">' +
                    '<label class="tm-applicant-check">' +
                      '<input type="checkbox" ' + inputAttr + '="' + escapeHtml(a.reservationId) + '"' +
                        (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
                    '</label>' +
                  '</td>' +
                  '<td><span class="tm-record-id">' + escapeHtml(a.reservationId) + '</span></td>' +
                  '<td><strong>' + escapeHtml(a.name) + '</strong><small>' + escapeHtml(a.grade) + '</small></td>' +
                  '<td>' + escapeHtml(a.parent) + '</td>' +
                  '<td class="tm-cell-contact">' +
                    '<a href="tel:' + phoneDigits(a.phone) + '">' + escapeHtml(a.phone) + '</a>' +
                    '<a href="mailto:' + escapeHtml(a.email) + '">' + escapeHtml(a.email) + '</a>' +
                  '</td>' +
                  '<td>' + escapeHtml(a.preferredSlot) + '</td>' +
                  '<td>' + slotBadge(a, ctx.lessonSlotLabel) +
                    (a.hasConflict && !checked ? '<small class="tm-planner-student-warn">' + escapeHtml(a.conflictMsg) + '</small>' : '') +
                    (a.otherLessons && a.otherLessons.length ? '<small class="tm-applicant-other">Diğer ders: ' + escapeHtml(a.otherLessons.join(', ')) + '</small>' : '') +
                  '</td>' +
                  '<td><span class="tm-status is-' + escapeHtml(a.status) + '">' + escapeHtml(a.statusLabel || a.status) + '</span></td>' +
                  '<td>' + contactActions(a, ctx, inputAttr) + '</td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function renderPickerSection(applicants, selectedIds, opts) {
    opts = opts || {};
    var ctx = {
      subject: opts.subject,
      grade: opts.grade,
      lessonSlotLabel: opts.lessonSlotLabel,
      lessonId: opts.lessonId,
      studentNames: applicants.filter(function (a) {
        return selectedIds.indexOf(a.reservationId) !== -1;
      }).map(function (a) { return a.name; })
    };
    var searchHtml = opts.showSearch !== false
      ? (
        '<label class="tm-filter-field tm-filter-field--search tm-applicant-search">' +
          '<span class="tm-filter-field-label">Başvurularda ara</span>' +
          '<input type="search" class="tm-search" id="' + escapeHtml(opts.searchId || 'tmApplicantSearch') + '" placeholder="Öğrenci, veli, REZ ID, telefon…" value="' + escapeHtml(opts.searchQuery || '') + '">' +
        '</label>'
      )
      : '';

    return (
      '<div class="tm-applicant-picker">' +
        '<p class="tm-applicant-picker-hint">Derse katılacak öğrencileri mevcut başvurular (rezervasyonlar) arasından seçin. Slot uyuşmazlığında veli ile iletişim kurup onay alın; öğretmeni bilgilendirmek için koordinasyon panelini kullanın.</p>' +
        renderParentCoordinationAlert(applicants, selectedIds, opts.lessonSlotLabel) +
        (opts.teacher ? renderTeacherCoordination(opts.teacher, ctx) : '') +
        searchHtml +
        renderApplicantTable(applicants, selectedIds, opts) +
      '</div>'
    );
  }

  function confirmParentSlot(reservationId, slotLabel) {
    var ResMock = global.TrialLessonManagerMock;
    if (!ResMock || !reservationId || !slotLabel) return null;
    return ResMock.updateReservationSlot(reservationId, {
      slotLabel: slotLabel,
      slotConfirmedByParent: true
    });
  }

  function collectSelectedIds(container, inputAttr) {
    var attr = inputAttr || 'data-student-id';
    var ids = [];
    if (!container) return ids;
    container.querySelectorAll('[' + attr + ']:checked').forEach(function (cb) {
      ids.push(cb.getAttribute(attr));
    });
    return ids;
  }

  global.TrialLessonApplicantPicker = {
    escapeHtml: escapeHtml,
    reservationDetailUrl: reservationDetailUrl,
    buildParentSlotMessage: buildParentSlotMessage,
    buildTeacherLessonMessage: buildTeacherLessonMessage,
    whatsAppUrl: whatsAppUrl,
    filterApplicants: filterApplicants,
    renderApplicantTable: renderApplicantTable,
    renderPickerSection: renderPickerSection,
    renderTeacherCoordination: renderTeacherCoordination,
    renderParentCoordinationAlert: renderParentCoordinationAlert,
    renderContactActions: contactActions,
    confirmParentSlot: confirmParentSlot,
    collectSelectedIds: collectSelectedIds
  };
})(typeof window !== 'undefined' ? window : this);
