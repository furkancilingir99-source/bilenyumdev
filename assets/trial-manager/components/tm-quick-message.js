/**
 * Veli/öğretmen hızlı mesaj — WhatsApp, SMS, e-posta
 */
(function (global) {
  'use strict';

  var Msg = global.TMMessageTemplates;
  var U = global.TMUtils;

  function openForParent(opts) {
    if (!Msg || !opts) return;
    var hasMeeting = opts.meetingUrl && opts.meetingId;
    var text = hasMeeting ? Msg.parentTrial({
      parentName: opts.parentName,
      studentName: opts.studentName,
      lessonType: opts.lessonType,
      date: opts.date,
      time: opts.time,
      meetingUrl: opts.meetingUrl,
      meetingId: opts.meetingId,
      passcode: opts.passcode
    }) : Msg.parentContact({
      parentName: opts.parentName,
      studentName: opts.studentName,
      lessonType: opts.lessonType,
      date: opts.date,
      time: opts.time
    });
    showChooser(opts.parentName, opts.phone, opts.email, text, hasMeeting ? 'Ücretsiz deneme dersi bilgisi' : 'Deneme dersi iletişimi');
  }

  function showChooser(name, phone, email, text, subject) {
    var overlay = document.getElementById('tmQuickMsg');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tmQuickMsg';
      overlay.className = 'tm-form-overlay';
      overlay.innerHTML =
        '<div class="tm-form-dialog tm-quick-msg-dialog" role="dialog">' +
          '<header class="tm-form-head"><h2 class="tm-form-title">Hızlı mesaj</h2></header>' +
          '<div class="tm-form-body">' +
            '<textarea class="tm-dg-control tm-quick-msg-text" rows="10" readonly></textarea>' +
            '<div class="tm-detail-actions" style="margin-top:12px">' +
              '<a class="tm-btn tm-btn--primary" data-qm-wa target="_blank" rel="noopener">WhatsApp</a>' +
              '<a class="tm-btn tm-btn--ghost" data-qm-sms href="#">SMS</a>' +
              '<a class="tm-btn tm-btn--ghost" data-qm-mail target="_blank" rel="noopener">E-posta</a>' +
              '<button type="button" class="tm-btn tm-btn--ghost" data-qm-copy>Kopyala</button>' +
            '</div>' +
          '</div>' +
          '<footer class="tm-form-foot"><button type="button" class="tm-btn tm-btn--ghost" data-qm-close>Kapat</button></footer>' +
        '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay || e.target.closest('[data-qm-close]')) {
          overlay.classList.remove('is-open');
          document.body.classList.remove('tm-drawer-open');
        }
      });
    }
    overlay.querySelector('.tm-quick-msg-text').value = text;
    var wa = overlay.querySelector('[data-qm-wa]');
    wa.href = Msg.whatsappUrl(phone, text);
    overlay.querySelector('[data-qm-sms]').href = 'sms:' + String(phone || '').replace(/\s/g, '') + '?body=' + encodeURIComponent(text);
    overlay.querySelector('[data-qm-mail]').href = Msg.mailtoUrl(email || '', subject || 'Deneme dersi', text);
    overlay.querySelector('[data-qm-copy]').onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText(text);
    };
    overlay.classList.add('is-open');
    document.body.classList.add('tm-drawer-open');
  }

  function openForTeacher(opts) {
    if (!Msg || !opts) return;
    var text = Msg.teacherInfo({
      teacherName: opts.teacherName,
      date: opts.date,
      time: opts.time,
      lessonType: opts.lessonType,
      studentCount: opts.studentCount
    });
    showChooser(opts.teacherName, opts.phone, opts.email, text, 'Deneme dersi öğretmen bilgilendirme');
  }

  global.TMQuickMessage = { openForParent: openForParent, openForTeacher: openForTeacher, show: showChooser };
})(typeof window !== 'undefined' ? window : this);
