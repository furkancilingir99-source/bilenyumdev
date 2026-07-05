/**
 * Hızlı mesaj şablonları (WhatsApp / SMS / e-posta)
 */
(function (global) {
  'use strict';

  function parentTrialMessage(data) {
    return (
      'Merhaba ' + data.parentName + ',\n\n' +
      data.studentName + ' için ücretsiz online ' + data.lessonType + ' deneme dersiniz ' +
      data.date + ' tarihinde saat ' + data.time + ' olarak planlanmıştır.\n\n' +
      'Ders akışı:\nİlk 20 dakika veli bilgilendirme sunumu,\nsonraki 30 dakika öğrenci deneme dersi şeklindedir.\n\n' +
      'Derse aynı bilgisayardan katılabilirsiniz.\n\n' +
      'Katılım linki:\n' + data.meetingUrl + '\n\n' +
      'Toplantı ID:\n' + data.meetingId + '\n\n' +
      'Şifre:\n' + data.passcode + '\n\n' +
      'İyi günler dileriz.'
    );
  }

  function rescheduleMessage(data) {
    return (
      'Merhaba ' + data.parentName + ',\n\n' +
      data.studentName + ' için ücretsiz online ' + data.lessonType + ' deneme dersi planlamanız güncellenmiştir.\n\n' +
      'Yeni ders tarihi: ' + data.newDate + '\n' +
      'Yeni ders saati: ' + data.newTime + '\n\n' +
      'Katılım linki:\n' + data.meetingUrl + '\n\n' +
      'Toplantı ID:\n' + data.meetingId + '\n\n' +
      'Şifre:\n' + data.passcode + '\n\n' +
      'İyi günler dileriz.'
    );
  }

  function cancelMessage(data) {
    return (
      'Merhaba ' + data.parentName + ',\n\n' +
      data.studentName + ' için planlanan ücretsiz online ' + data.lessonType + ' deneme dersi iptal edilmiştir.\n\n' +
      'İptal nedeni:\n' + data.cancelReason + '\n\n' +
      'Yeni bir deneme dersi planlamak için sizinle tekrar iletişime geçeceğiz.\n\n' +
      'İyi günler dileriz.'
    );
  }

  function teacherInfoMessage(data) {
    return (
      'Merhaba ' + data.teacherName + ',\n\n' +
      data.date + ' tarihinde saat ' + data.time + ' için online ' + data.lessonType +
      ' ücretsiz deneme dersi tarafınıza atanmıştır.\n\n' +
      'Ders süresi: 50 dakika\n' +
      'İlk 20 dakika: Veli sunumu\n' +
      'Son 30 dakika: Öğrenci deneme dersi\n' +
      'Katılımcı öğrenci sayısı: ' + data.studentCount + '\n\n' +
      'Ders, öğretmen dashboard\'ınızda görüntülenecektir.\n\n' +
      'İyi çalışmalar.'
    );
  }

  function whatsappUrl(phone, text) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.indexOf('0') === 0) digits = '90' + digits.slice(1);
    else if (digits.length === 10) digits = '90' + digits;
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
  }

  function mailtoUrl(email, subject, body) {
    return 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subject || '') +
      '&body=' + encodeURIComponent(body || '');
  }

  global.TMMessageTemplates = {
    parentTrial: parentTrialMessage,
    reschedule: rescheduleMessage,
    cancel: cancelMessage,
    teacherInfo: teacherInfoMessage,
    whatsappUrl: whatsappUrl,
    mailtoUrl: mailtoUrl
  };
})(typeof window !== 'undefined' ? window : this);
