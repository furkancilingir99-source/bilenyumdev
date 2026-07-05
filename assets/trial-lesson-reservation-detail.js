(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  var Planner = window.TrialLessonPlannerMock;
  var Modal = window.TrialManagerModal;
  var Tabs = window.TrialManagerTabs;
  if (!Mock || !Planner || !Modal || !Tabs) return;

  var root = document.getElementById('tmResDetailRoot');
  var toastEl = document.getElementById('tmDetailToast');
  var reservationId = null;
  var slotEditor = { dayOffset: 0, slot: null, parentConfirmed: false };

  var MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  function studentName(r) {
    return r.studentFirstName + ' ' + r.studentLastName;
  }

  function parentName(r) {
    return r.parentFirstName + ' ' + r.parentLastName;
  }

  function formatCreatedAt(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + h + ':' + m;
  }

  function statusClass(status) {
    return 'is-' + status;
  }

  function canEditSlot(r) {
    return r && r.status !== 'completed' && r.status !== 'cancelled';
  }

  function canEditStatus(r) {
    return r && r.status !== 'cancelled';
  }

  function slotWasUpdated(r) {
    return !!(r.slotUpdatedAt && r.requestedSlotLabel && r.slotLabel !== r.requestedSlotLabel);
  }

  function plannedDetailUrl(id) {
    return 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(id);
  }

  function slotConfirmLabel(r) {
    if (r.slotConfirmedByParent) return { text: 'Veli onaylı', tone: 'ok' };
    return { text: 'Onay bekleniyor', tone: 'warn' };
  }

  function renderPlannedLessonsTable(lessons) {
    if (!lessons.length) {
      return '<p class="tm-dash-empty">Planlı derse atanmamış. Ders Planla sayfasından ekleyebilirsiniz.</p>';
    }
    return (
      '<div class="tm-dash-table-wrap">' +
        '<table class="tm-dash-table">' +
          '<thead><tr>' +
            '<th>Ders ID</th><th>Branş</th><th>Sınıf</th><th>Öğretmen</th><th>Tarih / Saat</th><th></th>' +
          '</tr></thead>' +
          '<tbody>' +
            lessons.map(function (l) {
              return (
                '<tr>' +
                  '<td><span class="tm-record-id">' + escapeHtml(l.id) + '</span></td>' +
                  '<td>' + escapeHtml(l.subject) + '</td>' +
                  '<td>' + escapeHtml(l.grade) + '</td>' +
                  '<td>' + escapeHtml(l.teacherName) + '</td>' +
                  '<td>' + escapeHtml(l.slotLabel) + '</td>' +
                  '<td><a class="tm-dash-row-link" href="' + plannedDetailUrl(l.id) + '">Detay</a></td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function renderStatusOptions(r) {
    var statuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    return statuses.map(function (s) {
      return '<option value="' + s + '"' + (r.status === s ? ' selected' : '') + '>' + escapeHtml(Mock.STATUS_LABELS[s] || s) + '</option>';
    }).join('');
  }

  function renderPage(r) {
    if (!root) return;
    var lessons = Planner.findLessonsForReservation(r.id);
    var updated = slotWasUpdated(r);
    var slotConfirm = slotConfirmLabel(r);
    var parentNeedsAttention = !r.slotConfirmedByParent && r.status !== 'cancelled';

    var alerts = '';
    if (parentNeedsAttention) {
      alerts += '<div class="tm-admin-alert">Veli slot onayı alınmadı — İletişim sekmesinden veli ile görüşün veya Ders &amp; slot sekmesinden güncelleyin.</div>';
    }
    if (!lessons.length && r.status === 'confirmed') {
      alerts += '<div class="tm-admin-alert">Onaylı başvuru planlı derse atanmamış — Ders Planla ile sınıfa ekleyin.</div>';
    }

    var tabDefs = [
      { id: 'ozet', label: 'Özet' },
      { id: 'iletisim', label: 'İletişim' },
      { id: 'slot', label: 'Ders & slot', badge: parentNeedsAttention ? '!' : '', badgeTone: parentNeedsAttention ? 'warn' : '' },
      { id: 'planli', label: 'Planlı dersler', badge: String(lessons.length), badgeTone: lessons.length ? '' : 'warn' },
      { id: 'kayit', label: 'Kayıt' }
    ];

    var overviewPanel = Tabs.kvGrid([
      { label: 'Öğrenci', value: escapeHtml(studentName(r)) },
      { label: 'Sınıf', value: escapeHtml(r.grade) },
      { label: 'Deneme dersi', value: escapeHtml(r.subject) },
      { label: 'Veli', value: escapeHtml(parentName(r)) },
      { label: 'Kayıt tarihi', value: escapeHtml(formatCreatedAt(r.createdAt)) },
      { label: 'Durum', value: '<span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span>' },
      { label: 'Tercih slotu', value: '<strong>' + escapeHtml(r.slotLabel) + '</strong>', full: true }
    ]);

    var contactPanel =
      Tabs.kvGrid([
        { label: 'Veli adı', value: escapeHtml(parentName(r)) },
        { label: 'Telefon', value: '<a href="tel:' + escapeHtml(r.phone.replace(/\s/g, '')) + '">' + escapeHtml(r.phone) + '</a>' },
        { label: 'E-posta', value: '<a href="mailto:' + escapeHtml(r.email) + '">' + escapeHtml(r.email) + '</a>' },
        { label: 'Öğrenci', value: escapeHtml(studentName(r)) }
      ]) +
      '<div class="tm-admin-inline-actions">' +
        '<a class="tm-planner-btn is-primary" href="tel:' + escapeHtml(r.phone.replace(/\s/g, '')) + '">Ara</a>' +
        '<a class="tm-planner-btn is-ghost" href="mailto:' + escapeHtml(r.email) + '">E-posta gönder</a>' +
      '</div>';

    var slotPanel =
      '<p class="tm-admin-panel-desc">Veli ile mutabık kalınan ders saatini buradan güncelleyin. Kayıttan önce veli onayını işaretleyin.</p>' +
      Tabs.kvGrid([
        { label: 'Güncel slot', value: '<strong>' + escapeHtml(r.slotLabel) + '</strong>' },
        { label: 'Veli onayı', value: '<span class="tm-applicant-slot ' + (r.slotConfirmedByParent ? 'is-ok' : 'is-warn') + '">' + escapeHtml(slotConfirm.text) + '</span>' },
        updated ? { label: 'İlk talep', value: escapeHtml(r.requestedSlotLabel) } : null,
        r.slotUpdatedAt ? { label: 'Slot güncelleme', value: escapeHtml(formatCreatedAt(r.slotUpdatedAt)) } : null
      ].filter(Boolean)) +
      (canEditSlot(r)
        ? '<div class="tm-admin-inline-actions"><button type="button" class="tm-planner-btn is-primary" id="tmOpenSlotModal">Ders tarihini düzenle</button></div>'
        : '<p class="tm-admin-panel-desc">Tamamlanmış veya iptal edilmiş kayıtlarda slot düzenlenemez.</p>');

    var recordPanel =
      Tabs.kvGrid([
        { label: 'Rezervasyon ID', value: '<span class="tm-record-id">' + escapeHtml(r.id) + '</span>', full: true },
        { label: 'Oluşturulma', value: escapeHtml(formatCreatedAt(r.createdAt)) },
        { label: 'Durum', value: escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) }
      ]) +
      (canEditStatus(r)
        ? '<div class="tm-admin-form-row">' +
            '<label class="tm-filter-field">' +
              '<span class="tm-filter-field-label">Durumu güncelle</span>' +
              '<select class="tm-filter-select" id="tmResStatusEdit">' + renderStatusOptions(r) + '</select>' +
            '</label>' +
            '<button type="button" class="tm-planner-btn is-primary" id="tmResStatusSave">Durumu kaydet</button>' +
          '</div>'
        : '');

    var plannedPanel =
      '<p class="tm-admin-panel-desc">Bu başvurunun atandığı planlanmış deneme dersleri.</p>' +
      renderPlannedLessonsTable(lessons) +
      '<div class="tm-admin-inline-actions">' +
        '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-ders-planla.html">Yeni ders planla</a>' +
      '</div>';

    root.innerHTML =
      '<div class="tm-admin" data-admin-root>' +
        '<nav class="tm-breadcrumb">' +
          '<a href="deneme-dersi-yoneticisi-dashboard.html">Merkez</a>' +
          '<span aria-hidden="true">/</span>' +
          '<a href="deneme-dersi-yoneticisi-rezervasyonlar.html">Rezervasyonlar</a>' +
          '<span aria-hidden="true">/</span>' +
          '<span>' + escapeHtml(r.id) + '</span>' +
        '</nav>' +
        '<header class="tm-admin-header">' +
          '<div class="tm-admin-header-main">' +
            '<h1 class="tm-admin-header-title">' + escapeHtml(studentName(r)) + '</h1>' +
            '<p class="tm-admin-header-meta">' + escapeHtml(r.subject) + ' · ' + escapeHtml(r.grade) + ' · Veli: ' + escapeHtml(parentName(r)) + '</p>' +
            '<span class="tm-record-id tm-admin-header-id">' + escapeHtml(r.id) + '</span>' +
          '</div>' +
          '<div class="tm-admin-header-actions">' +
            '<span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span>' +
            (canEditSlot(r) ? '<button type="button" class="tm-planner-btn is-primary" id="tmOpenSlotModalHead">Slot düzenle</button>' : '') +
            '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-rezervasyonlar.html">Listeye dön</a>' +
          '</div>' +
        '</header>' +
        Tabs.summaryCells([
          { label: 'Durum', value: Mock.STATUS_LABELS[r.status] || r.status, tone: r.status === 'pending' ? 'warn' : r.status === 'confirmed' ? 'ok' : 'muted' },
          { label: 'Ders slotu', value: r.slotLabel, tone: '' },
          { label: 'Veli onayı', value: slotConfirm.text, tone: slotConfirm.tone },
          { label: 'Planlı ders', value: lessons.length ? lessons.length + ' ders' : 'Atanmadı', tone: lessons.length ? 'ok' : 'warn' }
        ]) +
        alerts +
        '<div class="tm-admin-body">' +
          Tabs.renderTabNav(tabDefs) +
          '<div class="tm-admin-panels">' +
            Tabs.panelWrap('ozet', overviewPanel) +
            Tabs.panelWrap('iletisim', contactPanel) +
            Tabs.panelWrap('slot', slotPanel) +
            Tabs.panelWrap('planli', plannedPanel) +
            Tabs.panelWrap('kayit', recordPanel) +
          '</div>' +
        '</div>' +
      '</div>';

    Tabs.bind(root.querySelector('[data-admin-root]'));

    ['tmOpenSlotModal', 'tmOpenSlotModalHead'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', openSlotModal);
    });

    var statusSave = document.getElementById('tmResStatusSave');
    if (statusSave) {
      statusSave.addEventListener('click', function () {
        var sel = document.getElementById('tmResStatusEdit');
        if (!sel) return;
        var next = sel.value;
        if (next === 'cancelled' && !Modal.confirmDelete({ subject: 'Bu rezervasyon', detail: r.id + ' iptal edilecek.' })) return;
        Mock.updateReservationSlot(reservationId, { status: next });
        showToast('Durum güncellendi.');
        renderPage(Mock.getReservationById(reservationId));
      });
    }
  }

  function renderSlotModalBody() {
    var slots = Mock.getOpenLessonSlots();
    var full = slots.fullByDay[slotEditor.dayOffset] || {};
    var dayNav = slots.days.map(function (d) {
      return (
        '<button type="button" class="tm-slot-day' + (d.offset === slotEditor.dayOffset ? ' is-active' : '') + '" data-slot-day="' + d.offset + '">' +
          '<strong>' + escapeHtml(d.label) + '</strong><small>' + escapeHtml(d.date) + '</small>' +
        '</button>'
      );
    }).join('');
    var grid = slots.times.map(function (t) {
      var isFull = !!full[t];
      var isSel = !isFull && slotEditor.slot === t;
      return (
        '<button type="button" class="tm-slot' + (isFull ? ' is-full' : '') + (isSel ? ' is-selected' : '') + '" data-slot-time="' + escapeHtml(t) + '"' + (isFull ? ' disabled' : '') + '>' +
          escapeHtml(t) +
          '<span class="tm-slot-badge ' + (isFull ? 'is-full' : 'is-free') + '">' + (isFull ? 'Dolu' : 'Müsait') + '</span>' +
        '</button>'
      );
    }).join('');

    return (
      '<p class="tm-slot-editor-hint">Veli ile görüşüp mutabık kalınan açık ders saatini seçin. Kaydetmeden önce veli onayını işaretleyin.</p>' +
      '<div class="tm-slot-day-nav">' + dayNav + '</div>' +
      '<div class="tm-slot-grid">' + grid + '</div>' +
      '<label class="tm-slot-parent-check">' +
        '<input type="checkbox" id="tmModalParentConfirm"' + (slotEditor.parentConfirmed ? ' checked' : '') + '>' +
        '<span>Veli ile görüşülüp yeni ders tarihi onaylandı</span>' +
      '</label>'
    );
  }

  function syncSlotSaveBtn() {
    var saveBtn = document.getElementById('tmModalSlotSave');
    var cb = document.getElementById('tmModalParentConfirm');
    if (!saveBtn) return;
    saveBtn.disabled = !(cb && cb.checked && slotEditor.slot);
  }

  function bindSlotModalEvents() {
    var body = document.querySelector('[data-tm-modal-body]');
    if (!body) return;

    body.addEventListener('click', function (e) {
      var dayBtn = e.target.closest('[data-slot-day]');
      if (dayBtn) {
        slotEditor.dayOffset = parseInt(dayBtn.getAttribute('data-slot-day'), 10);
        slotEditor.slot = null;
        body.innerHTML = renderSlotModalBody();
        syncSlotSaveBtn();
        return;
      }
      var slotBtn = e.target.closest('[data-slot-time]');
      if (slotBtn && !slotBtn.disabled) {
        slotEditor.slot = slotBtn.getAttribute('data-slot-time');
        body.innerHTML = renderSlotModalBody();
        syncSlotSaveBtn();
      }
    });

    body.addEventListener('change', function (e) {
      if (e.target.id === 'tmModalParentConfirm') {
        slotEditor.parentConfirmed = e.target.checked;
        syncSlotSaveBtn();
      }
    });
  }

  function openSlotModal() {
    slotEditor = { dayOffset: 0, slot: null, parentConfirmed: false };
    Modal.open({
      title: 'Ders tarihi / saat düzenle',
      subtitle: reservationId,
      body: renderSlotModalBody(),
      foot:
        '<button type="button" class="tm-planner-btn is-ghost" data-tm-modal-close>Vazgeç</button>' +
        '<button type="button" class="tm-planner-btn is-primary" id="tmModalSlotSave" disabled>Kaydet</button>'
    });
    bindSlotModalEvents();
    var saveBtn = document.getElementById('tmModalSlotSave');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (!slotEditor.slot) return;
        var cb = document.getElementById('tmModalParentConfirm');
        if (!cb || !cb.checked) return;
        Mock.updateReservationSlot(reservationId, {
          slotLabel: Mock.buildSlotLabel(slotEditor.dayOffset, slotEditor.slot),
          slotConfirmedByParent: true
        });
        Modal.close();
        showToast('Ders tarihi güncellendi.');
        renderPage(Mock.getReservationById(reservationId));
      });
    }
  }

  function init() {
    var params = new URLSearchParams(window.location.search);
    reservationId = params.get('id');
    if (!reservationId) {
      root.innerHTML = '<p class="td-state">Rezervasyon ID bulunamadı. <a href="deneme-dersi-yoneticisi-rezervasyonlar.html">Listeye dön</a></p>';
      return;
    }
    var r = Mock.getReservationById(reservationId);
    if (!r) {
      root.innerHTML = '<p class="td-state">Rezervasyon bulunamadı. <a href="deneme-dersi-yoneticisi-rezervasyonlar.html">Listeye dön</a></p>';
      return;
    }
    document.title = studentName(r) + ' · Rezervasyon · Bilenyum';
    Modal.get('tmModal');
    renderPage(r);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
