(function () {
  'use strict';

  var Mock = window.TrialLessonManagerMock;
  var Planner = window.TrialLessonPlannerMock;
  var Modal = window.TrialManagerModal;
  if (!Mock || !Planner || !Modal) return;

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

  function slotWasUpdated(r) {
    return !!(r.slotUpdatedAt && r.requestedSlotLabel && r.slotLabel !== r.requestedSlotLabel);
  }

  function detailUrl(id) {
    return 'deneme-dersi-yoneticisi-rezervasyon-detay.html?id=' + encodeURIComponent(id);
  }

  function plannedDetailUrl(id) {
    return 'deneme-dersi-yoneticisi-planlanmis-ders-detay.html?id=' + encodeURIComponent(id);
  }

  function renderPlannedLessonsTable(lessons) {
    if (!lessons.length) {
      return '<p class="tm-planned-no-students">Bu öğrenci henüz planlanmış bir derse atanmamış.</p>';
    }
    return (
      '<div class="tm-res-table-wrap">' +
        '<table class="tm-detail-table">' +
          '<thead><tr>' +
            '<th>Ders ID</th><th>Branş</th><th>Sınıf</th><th>Öğretmen</th><th>Ders Saati</th><th></th>' +
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
                  '<td><a class="tm-action-link" href="' + plannedDetailUrl(l.id) + '">Derse git</a></td>' +
                '</tr>'
              );
            }).join('') +
          '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  function renderPage(r) {
    if (!root) return;
    var lessons = Planner.findLessonsForReservation(r.id);
    var updated = slotWasUpdated(r);

    root.innerHTML =
      '<nav class="tm-breadcrumb">' +
        '<a href="deneme-dersi-yoneticisi-rezervasyonlar.html">Rezervasyonlar</a>' +
        '<span aria-hidden="true">/</span>' +
        '<span>' + escapeHtml(r.id) + '</span>' +
      '</nav>' +
      '<header class="tm-detail-hero">' +
        '<div class="tm-detail-hero-main">' +
          '<h1 class="tm-detail-hero-title">' + escapeHtml(studentName(r)) + '</h1>' +
          '<p class="tm-detail-hero-sub">' +
            escapeHtml(r.subject) + ' · ' + escapeHtml(r.grade) + ' · Veli: ' + escapeHtml(parentName(r)) +
          '</p>' +
          '<span class="tm-record-id tm-record-id--lg">' + escapeHtml(r.id) + '</span>' +
        '</div>' +
        '<div class="tm-detail-hero-actions">' +
          '<span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span>' +
          (canEditSlot(r) ? '<button type="button" class="tm-planner-btn is-primary" id="tmOpenSlotModal">Ders tarihini düzenle</button>' : '') +
          '<a class="tm-planner-btn is-ghost" href="deneme-dersi-yoneticisi-rezervasyonlar.html">Listeye dön</a>' +
        '</div>' +
      '</header>' +
      '<div class="tm-detail-grid">' +
        '<div class="tm-detail-card is-student">' +
          '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">🎓</span><h4 class="tm-detail-card-title">Öğrenci</h4></div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(studentName(r)) + '</dd></div>' +
            '<div><dt>Sınıf</dt><dd>' + escapeHtml(r.grade) + '</dd></div>' +
            '<div><dt>Deneme dersi</dt><dd>' + escapeHtml(r.subject) + '</dd></div>' +
          '</dl>' +
        '</div>' +
        '<div class="tm-detail-card is-parent">' +
          '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">👤</span><h4 class="tm-detail-card-title">Veli</h4></div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Ad Soyad</dt><dd>' + escapeHtml(parentName(r)) + '</dd></div>' +
            '<div><dt>Telefon</dt><dd><a href="tel:' + escapeHtml(r.phone.replace(/\s/g, '')) + '">' + escapeHtml(r.phone) + '</a></dd></div>' +
            '<div><dt>E-posta</dt><dd><a href="mailto:' + escapeHtml(r.email) + '">' + escapeHtml(r.email) + '</a></dd></div>' +
          '</dl>' +
        '</div>' +
        '<div class="tm-detail-card is-reservation">' +
          '<div class="tm-detail-card-head"><span class="tm-detail-card-icon" aria-hidden="true">📅</span><h4 class="tm-detail-card-title">Rezervasyon</h4></div>' +
          '<dl class="tm-detail-dl">' +
            '<div><dt>Kayıt tarihi</dt><dd>' + escapeHtml(formatCreatedAt(r.createdAt)) + '</dd></div>' +
            '<div><dt>Ders tarihi / saat</dt><dd><strong>' + escapeHtml(r.slotLabel) + '</strong>' +
              (updated ? '<br><small class="tm-slot-updated-at">İlk talep: ' + escapeHtml(r.requestedSlotLabel) + '</small>' : '') +
              (r.slotUpdatedAt ? '<br><small class="tm-slot-updated-at">Son güncelleme: ' + escapeHtml(formatCreatedAt(r.slotUpdatedAt)) + '</small>' : '') +
            '</dd></div>' +
            '<div><dt>Durum</dt><dd><span class="tm-status ' + statusClass(r.status) + '">' + escapeHtml(Mock.STATUS_LABELS[r.status] || r.status) + '</span></dd></div>' +
          '</dl>' +
        '</div>' +
      '</div>' +
      '<section class="tm-detail-section">' +
        '<div class="tm-detail-section-head">' +
          '<h2 class="tm-detail-section-title">Planlanmış dersler (' + lessons.length + ')</h2>' +
        '</div>' +
        renderPlannedLessonsTable(lessons) +
      '</section>';

    var slotBtn = document.getElementById('tmOpenSlotModal');
    if (slotBtn) slotBtn.addEventListener('click', openSlotModal);
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
