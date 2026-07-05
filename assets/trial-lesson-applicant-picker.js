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

  function contactActions(applicant, ctx) {
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

  function applyApplicantFilters(applicants, opts, selectedIds) {
    var list = applicants.slice();
    var filters = (opts && opts.filters) || {};
    var q = (opts && opts.searchQuery || '').trim().toLowerCase();

    if (q) {
      list = list.filter(function (a) {
        var hay = [
          a.reservationId, a.name, a.parent, a.phone, a.email,
          a.preferredSlot, a.statusLabel, a.grade, a.subject
        ].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter(function (a) { return a.status === filters.status; });
    }

    if (filters.slotMatch && filters.slotMatch !== 'all') {
      if (filters.slotMatch === 'matches') {
        list = list.filter(function (a) { return a.slotMatchesLesson; });
      } else if (filters.slotMatch === 'needs-contact') {
        list = list.filter(function (a) { return a.needsParentContact; });
      } else if (filters.slotMatch === 'confirmed-slot') {
        list = list.filter(function (a) { return a.slotMatchesLesson && a.slotConfirmedByParent; });
      } else if (filters.slotMatch === 'conflict') {
        list = list.filter(function (a) { return a.hasConflict; });
      }
    }

    if (filters.selection && filters.selection !== 'all') {
      if (filters.selection === 'selected') {
        list = list.filter(function (a) { return selectedIds.indexOf(a.reservationId) !== -1; });
      } else if (filters.selection === 'unselected') {
        list = list.filter(function (a) { return selectedIds.indexOf(a.reservationId) === -1; });
      }
    }

    return list;
  }

  function filterApplicants(applicants, query) {
    return applyApplicantFilters(applicants, { searchQuery: query }, []);
  }

  function defaultApplicantFilters() {
    return { status: 'all', slotMatch: 'all', selection: 'all' };
  }

  function renderApplicantFilters(opts) {
    opts = opts || {};
    var filters = opts.filters || defaultApplicantFilters();
    var prefix = opts.filterPrefix || 'tmApplicant';
    return (
      '<div class="tm-applicant-filter-grid">' +
        '<label class="tm-filter-field">' +
          '<span class="tm-filter-field-label">Başvuru durumu</span>' +
          '<select class="tm-filter-select tm-applicant-filter" id="' + prefix + 'FilterStatus" data-applicant-filter="status">' +
            '<option value="all"' + (filters.status === 'all' ? ' selected' : '') + '>Tümü</option>' +
            '<option value="pending"' + (filters.status === 'pending' ? ' selected' : '') + '>Onay bekliyor</option>' +
            '<option value="confirmed"' + (filters.status === 'confirmed' ? ' selected' : '') + '>Onaylandı</option>' +
            '<option value="completed"' + (filters.status === 'completed' ? ' selected' : '') + '>Tamamlandı</option>' +
          '</select>' +
        '</label>' +
        '<label class="tm-filter-field">' +
          '<span class="tm-filter-field-label">Slot durumu</span>' +
          '<select class="tm-filter-select tm-applicant-filter" id="' + prefix + 'FilterSlot" data-applicant-filter="slotMatch">' +
            '<option value="all"' + (filters.slotMatch === 'all' ? ' selected' : '') + '>Tümü</option>' +
            '<option value="matches"' + (filters.slotMatch === 'matches' ? ' selected' : '') + '>Ders slotu ile uyumlu</option>' +
            '<option value="confirmed-slot"' + (filters.slotMatch === 'confirmed-slot' ? ' selected' : '') + '>Veli onaylı slot</option>' +
            '<option value="needs-contact"' + (filters.slotMatch === 'needs-contact' ? ' selected' : '') + '>Veli görüşmesi gerekli</option>' +
            '<option value="conflict"' + (filters.slotMatch === 'conflict' ? ' selected' : '') + '>Çakışma var</option>' +
          '</select>' +
        '</label>' +
        '<label class="tm-filter-field">' +
          '<span class="tm-filter-field-label">Derse seçim</span>' +
          '<select class="tm-filter-select tm-applicant-filter" id="' + prefix + 'FilterSelection" data-applicant-filter="selection">' +
            '<option value="all"' + (filters.selection === 'all' ? ' selected' : '') + '>Tümü</option>' +
            '<option value="selected"' + (filters.selection === 'selected' ? ' selected' : '') + '>Derse seçilmiş</option>' +
            '<option value="unselected"' + (filters.selection === 'unselected' ? ' selected' : '') + '>Henüz seçilmemiş</option>' +
          '</select>' +
        '</label>' +
        '<button type="button" class="tm-date-clear tm-applicant-filter-clear" id="' + prefix + 'FilterClear"' + (
          filters.status === 'all' && filters.slotMatch === 'all' && filters.selection === 'all' ? ' hidden' : ''
        ) + '>Filtreleri temizle</button>' +
      '</div>'
    );
  }

  function renderApplicantDetailBody(applicant, ctx, isSelected) {
    ctx = ctx || {};
    var statusLabel = applicant.statusLabel || applicant.status || '—';
    return (
      '<div class="tm-applicant-detail">' +
        '<div class="tm-detail-grid tm-applicant-detail-grid">' +
          '<div class="tm-detail-card is-student">' +
            '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">🎓</span><h4 class="tm-detail-card-title">Öğrenci</h4></div>' +
            '<dl class="tm-detail-dl">' +
              '<div><dt>Ad Soyad</dt><dd><strong>' + escapeHtml(applicant.name) + '</strong></dd></div>' +
              '<div><dt>Sınıf</dt><dd>' + escapeHtml(applicant.grade) + '</dd></div>' +
              '<div><dt>Branş</dt><dd>' + escapeHtml(applicant.subject) + '</dd></div>' +
              '<div><dt>Rezervasyon ID</dt><dd><span class="tm-record-id">' + escapeHtml(applicant.reservationId) + '</span></dd></div>' +
              '<div><dt>Başvuru durumu</dt><dd><span class="tm-status is-' + escapeHtml(applicant.status) + '">' + escapeHtml(statusLabel) + '</span></dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="tm-detail-card is-parent">' +
            '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">👤</span><h4 class="tm-detail-card-title">Veli</h4></div>' +
            '<dl class="tm-detail-dl">' +
              '<div><dt>Ad Soyad</dt><dd><strong>' + escapeHtml(applicant.parent) + '</strong></dd></div>' +
              '<div><dt>Telefon</dt><dd><a href="tel:' + phoneDigits(applicant.phone) + '">' + escapeHtml(applicant.phone) + '</a></dd></div>' +
              '<div><dt>E-posta</dt><dd><a href="mailto:' + escapeHtml(applicant.email) + '">' + escapeHtml(applicant.email) + '</a></dd></div>' +
            '</dl>' +
          '</div>' +
          '<div class="tm-detail-card is-slot">' +
            '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">🗓</span><h4 class="tm-detail-card-title">Slot & planlama</h4></div>' +
            '<dl class="tm-detail-dl">' +
              '<div><dt>Tercih slotu</dt><dd>' + escapeHtml(applicant.preferredSlot) + '</dd></div>' +
              (applicant.requestedSlotLabel && applicant.requestedSlotLabel !== applicant.preferredSlot
                ? '<div><dt>İlk tercih</dt><dd>' + escapeHtml(applicant.requestedSlotLabel) + '</dd></div>' : '') +
              '<div><dt>Planlanan ders slotu</dt><dd>' + escapeHtml(ctx.lessonSlotLabel || '—') + '</dd></div>' +
              '<div><dt>Slot durumu</dt><dd>' + slotBadge(applicant, ctx.lessonSlotLabel) + '</dd></div>' +
              '<div><dt>Veli slot onayı</dt><dd>' + (applicant.slotConfirmedByParent ? 'Alındı' : 'Bekleniyor') + '</dd></div>' +
              (applicant.otherLessons && applicant.otherLessons.length
                ? '<div><dt>Diğer dersler</dt><dd>' + escapeHtml(applicant.otherLessons.join(', ')) + '</dd></div>' : '') +
              (applicant.hasConflict
                ? '<div><dt>Çakışma</dt><dd class="tm-planner-student-warn">' + escapeHtml(applicant.conflictMsg) + '</dd></div>' : '') +
            '</dl>' +
          '</div>' +
        '</div>' +
        '<section class="tm-applicant-detail-actions">' +
          '<h4 class="tm-applicant-detail-actions-title">Veli iletişim & koordinasyon</h4>' +
          contactActions(applicant, ctx) +
        '</section>' +
        (isSelected
          ? '<p class="tm-applicant-detail-selected-note">Bu öğrenci derse <strong>eklenmiş</strong> durumda.</p>'
          : (applicant.hasConflict
            ? '<p class="tm-applicant-detail-warn">Çakışma nedeniyle derse eklenemez.</p>'
            : '')) +
      '</div>'
    );
  }

  function findApplicantById(applicants, id) {
    for (var i = 0; i < applicants.length; i++) {
      if (applicants[i].reservationId === id) return applicants[i];
    }
    return null;
  }

  function renderApplicantTable(applicants, selectedIds, opts) {
    opts = opts || {};
    var ctx = {
      subject: opts.subject,
      grade: opts.grade,
      lessonSlotLabel: opts.lessonSlotLabel,
      lessonId: opts.lessonId
    };
    var filtered = applyApplicantFilters(applicants, opts, selectedIds);

    if (!applicants.length) {
      return '<p class="tm-planner-students-hint">Bu branş ve sınıf için uygun başvuru (rezervasyon) bulunamadı.</p>';
    }
    if (!filtered.length) {
      return '<p class="tm-planner-students-hint">Arama kriterine uygun başvuru yok.</p>';
    }

    return (
      '<div class="tm-res-table-wrap tm-applicant-table-wrap" data-applicant-table>' +
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
                      '<input type="checkbox" class="tm-applicant-cb" value="' + escapeHtml(a.reservationId) + '"' +
                        (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>' +
                    '</label>' +
                  '</td>' +
                  '<td><span class="tm-record-id">' + escapeHtml(a.reservationId) + '</span></td>' +
                  '<td><button type="button" class="tm-applicant-name-btn" data-view-applicant="' + escapeHtml(a.reservationId) + '"><strong>' + escapeHtml(a.name) + '</strong></button><small>' + escapeHtml(a.grade) + '</small></td>' +
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
                  '<td>' + contactActions(a, ctx) + '</td>' +
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

    var filteredCount = applyApplicantFilters(applicants, opts, selectedIds).length;
    var isEmbedded = !!opts.embedded;
    var showTeacherCoordination = opts.showTeacherCoordination;
    if (showTeacherCoordination === undefined) showTeacherCoordination = !isEmbedded;
    var metaClass = 'tm-applicant-picker-meta' + (isEmbedded ? ' tm-applicant-picker-meta--embedded' : '');

    return (
      '<div class="tm-applicant-picker' + (isEmbedded ? ' tm-applicant-picker--embedded' : '') + '" data-applicant-picker>' +
        '<p class="tm-applicant-picker-hint">Başvuruları filtreleyin; öğrenci adına tıklayarak veli ve iletişim detaylarını görün. Derse eklemek için satırın solundaki kutuyu işaretleyin.</p>' +
        renderParentCoordinationAlert(applicants, selectedIds, opts.lessonSlotLabel) +
        (showTeacherCoordination && opts.teacher ? renderTeacherCoordination(opts.teacher, ctx) : '') +
        renderApplicantFilters(opts) +
        searchHtml +
        '<div class="' + metaClass + '">' +
          (!isEmbedded
            ? '<span class="tm-planner-section-count" data-applicant-count>' + selectedIds.length + ' seçili</span>'
            : '') +
          '<span class="tm-applicant-filter-count">' + filteredCount + ' / ' + applicants.length + ' başvuru</span>' +
        '</div>' +
        renderApplicantTable(applicants, selectedIds, opts) +
      '</div>'
    );
  }

  function readFiltersFromContainer(container, prefix) {
    var filters = defaultApplicantFilters();
    if (!container) return filters;
    container.querySelectorAll('[data-applicant-filter]').forEach(function (el) {
      var key = el.getAttribute('data-applicant-filter');
      if (key && el.value) filters[key] = el.value;
    });
    return filters;
  }

  function confirmParentSlot(reservationId, slotLabel) {
    var ResMock = global.TrialLessonManagerMock;
    if (!ResMock || !reservationId || !slotLabel) return null;
    return ResMock.updateReservationSlot(reservationId, {
      slotLabel: slotLabel,
      slotConfirmedByParent: true
    });
  }

  function collectSelectedIds(container) {
    var ids = [];
    if (!container) return ids;
    container.querySelectorAll('input.tm-applicant-cb:checked').forEach(function (cb) {
      if (cb.value) ids.push(cb.value);
    });
    return ids;
  }

  function updatePickerSelectionUI(container, selectedCount) {
    if (!container) return;
    var countEl = container.querySelector('[data-applicant-count]');
    if (countEl) countEl.textContent = selectedCount + ' seçili';
    container.querySelectorAll('.tm-applicant-row').forEach(function (row) {
      var cb = row.querySelector('input.tm-applicant-cb');
      if (!cb) return;
      row.classList.toggle('is-selected', cb.checked);
    });
  }

  global.TrialLessonApplicantPicker = {
    escapeHtml: escapeHtml,
    reservationDetailUrl: reservationDetailUrl,
    buildParentSlotMessage: buildParentSlotMessage,
    buildTeacherLessonMessage: buildTeacherLessonMessage,
    whatsAppUrl: whatsAppUrl,
    filterApplicants: filterApplicants,
    applyApplicantFilters: applyApplicantFilters,
    defaultApplicantFilters: defaultApplicantFilters,
    readFiltersFromContainer: readFiltersFromContainer,
    renderApplicantFilters: renderApplicantFilters,
    renderApplicantDetailBody: renderApplicantDetailBody,
    findApplicantById: findApplicantById,
    renderApplicantTable: renderApplicantTable,
    renderPickerSection: renderPickerSection,
    renderTeacherCoordination: renderTeacherCoordination,
    renderParentCoordinationAlert: renderParentCoordinationAlert,
    renderContactActions: contactActions,
    confirmParentSlot: confirmParentSlot,
    collectSelectedIds: collectSelectedIds,
    updatePickerSelectionUI: updatePickerSelectionUI
  };
})(typeof window !== 'undefined' ? window : this);
