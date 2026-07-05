/**
 * Türkçe statü etiketleri ve badge sınıfları
 */
(function (global) {
  'use strict';

  var SESSION_STATUS = {
    draft: { label: 'Taslak', badge: 'tm-badge--muted' },
    scheduled: { label: 'Planlandı', badge: 'tm-badge--blue' },
    confirmed: { label: 'Onaylandı', badge: 'tm-badge--green' },
    completed: { label: 'Tamamlandı', badge: 'tm-badge--purple' },
    cancelled: { label: 'İptal', badge: 'tm-badge--red' },
    rescheduled: { label: 'Yeniden Planlandı', badge: 'tm-badge--orange' }
  };

  var RESERVATION_STATUS = {
    pending: { label: 'Bekliyor', badge: 'tm-badge--orange' },
    confirmed: { label: 'Onaylandı', badge: 'tm-badge--green' },
    cancelled: { label: 'İptal', badge: 'tm-badge--red' },
    rescheduled: { label: 'Yeniden Planlandı', badge: 'tm-badge--orange' },
    attended: { label: 'Katıldı', badge: 'tm-badge--green' },
    no_show: { label: 'Gelmedi', badge: 'tm-badge--red' }
  };

  var PARENT_APPROVAL = {
    not_called: { label: 'Aranmadı', badge: 'tm-badge--muted' },
    unreachable: { label: 'Ulaşılamadı', badge: 'tm-badge--red' },
    approved: { label: 'Onayladı', badge: 'tm-badge--green' },
    rejected: { label: 'Reddetti', badge: 'tm-badge--red' },
    call_again: { label: 'Tekrar Aranacak', badge: 'tm-badge--orange' }
  };

  var REQUEST_STATUS = {
    new: { label: 'Yeni', badge: 'tm-badge--blue' },
    reviewing: { label: 'İnceleniyor', badge: 'tm-badge--orange' },
    assigned: { label: 'Atandı', badge: 'tm-badge--green' },
    rejected: { label: 'Reddedildi', badge: 'tm-badge--red' },
    cancelled: { label: 'İptal', badge: 'tm-badge--red' }
  };

  var STUDENT_STATUS = {
    new_request: { label: 'Yeni Talep', badge: 'tm-badge--blue' },
    awaiting_assignment: { label: 'Atama Bekliyor', badge: 'tm-badge--orange' },
    scheduled: { label: 'Planlandı', badge: 'tm-badge--blue' },
    confirmed: { label: 'Onaylandı', badge: 'tm-badge--green' },
    attended: { label: 'Katıldı', badge: 'tm-badge--green' },
    no_show: { label: 'Gelmedi', badge: 'tm-badge--red' },
    enrolled: { label: 'Kayıt Oldu', badge: 'tm-badge--purple' },
    cancelled: { label: 'İptal', badge: 'tm-badge--red' },
    lost: { label: 'Kaybedildi', badge: 'tm-badge--muted' }
  };

  var MEETING_STATUS = {
    active: { label: 'Aktif', badge: 'tm-badge--green' },
    inactive: { label: 'Pasif', badge: 'tm-badge--muted' },
    cancelled: { label: 'İptal Edildi', badge: 'tm-badge--red' },
    expired: { label: 'Süresi Doldu', badge: 'tm-badge--muted' }
  };

  var LINK_STATUS = {
    created: { label: 'Oluşturuldu', badge: 'tm-badge--blue' },
    not_sent: { label: 'Gönderilmedi', badge: 'tm-badge--orange' },
    sent: { label: 'Gönderildi', badge: 'tm-badge--green' },
    passcode_changed: { label: 'Şifre Değişti', badge: 'tm-badge--orange' },
    cancelled: { label: 'İptal Edildi', badge: 'tm-badge--red' },
    expired: { label: 'Süresi Doldu', badge: 'tm-badge--muted' }
  };

  var TEACHER_INFO = {
    not_informed: { label: 'Bilgilendirilmedi', badge: 'tm-badge--orange' },
    informed: { label: 'Bilgilendirildi', badge: 'tm-badge--green' },
    needs_reinform: { label: 'Tekrar Bilgilendirilmeli', badge: 'tm-badge--orange' }
  };

  var COMM_CHANNEL = {
    phone: 'Telefon',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    email: 'E-posta'
  };

  var COMM_RESULT = {
    not_called: 'Aranmadı',
    unreachable: 'Ulaşılamadı',
    approved: 'Onayladı',
    rejected: 'Reddetti',
    call_again: 'Tekrar aranacak',
    message_sent: 'Mesaj gönderildi',
    teacher_informed: 'Öğretmen bilgilendirildi',
    link_sent: 'Link gönderildi'
  };

  var AUDIT_ACTION = {
    created: 'Oluşturuldu',
    updated: 'Güncellendi',
    cancelled: 'İptal edildi',
    rescheduled: 'Yeniden planlandı',
    teacher_changed: 'Öğretmen değiştirildi',
    lesson_type_changed: 'Ders türü değiştirildi',
    time_changed: 'Saat değiştirildi',
    student_assigned: 'Öğrenci atandı',
    student_removed: 'Öğrenci çıkarıldı',
    parent_approved: 'Veli onayladı',
    parent_rejected: 'Veli reddetti',
    request_rejected: 'Talep reddedildi',
    link_sent: 'Link gönderildi',
    passcode_changed: 'Şifre değiştirildi',
    teacher_informed: 'Öğretmen bilgilendirildi',
    attendance_marked: 'Katılım işaretlendi',
    converted_to_enrollment: 'Kayda dönüştürüldü',
    permission_changed: 'Yetki değiştirildi'
  };

  function badgeHtml(map, key, fallback) {
    var item = map[key];
    if (!item) return '<span class="tm-badge tm-badge--muted">' + (fallback || key || '—') + '</span>';
    return '<span class="tm-badge ' + item.badge + '">' + item.label + '</span>';
  }

  function label(map, key, fallback) {
    var item = map[key];
    return item ? item.label : (fallback || key || '—');
  }

  global.TMStatusLabels = {
    SESSION_STATUS: SESSION_STATUS,
    RESERVATION_STATUS: RESERVATION_STATUS,
    PARENT_APPROVAL: PARENT_APPROVAL,
    REQUEST_STATUS: REQUEST_STATUS,
    STUDENT_STATUS: STUDENT_STATUS,
    MEETING_STATUS: MEETING_STATUS,
    LINK_STATUS: LINK_STATUS,
    TEACHER_INFO: TEACHER_INFO,
    COMM_CHANNEL: COMM_CHANNEL,
    COMM_RESULT: COMM_RESULT,
    AUDIT_ACTION: AUDIT_ACTION,
    sessionBadge: function (s) { return badgeHtml(SESSION_STATUS, s); },
    reservationBadge: function (s) { return badgeHtml(RESERVATION_STATUS, s); },
    parentApprovalBadge: function (s) { return badgeHtml(PARENT_APPROVAL, s); },
    requestBadge: function (s) { return badgeHtml(REQUEST_STATUS, s); },
    studentBadge: function (s) { return badgeHtml(STUDENT_STATUS, s); },
    meetingBadge: function (s) { return badgeHtml(MEETING_STATUS, s); },
    sessionLabel: function (s) { return label(SESSION_STATUS, s); },
    reservationLabel: function (s) { return label(RESERVATION_STATUS, s); },
    parentApprovalLabel: function (s) { return label(PARENT_APPROVAL, s); },
    requestLabel: function (s) { return label(REQUEST_STATUS, s); }
  };
})(typeof window !== 'undefined' ? window : this);
