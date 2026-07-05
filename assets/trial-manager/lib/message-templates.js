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
      'Ders akışı:\n' +
      'İlk 20 dakika PDR/Rehberlik Öğretmeni tarafından veli bilgilendirme sunumu yapılacaktır.\n' +
      'Sonraki 30 dakika Branş Öğretmeni tarafından öğrenci ücretsiz deneme dersi yapılacaktır.\n\n' +
      'Derse öğrenci ve veli olarak aynı bilgisayardan katılabilirsiniz.\n\n' +
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

  function pdrTeacherInfoMessage(data) {
    return (
      'Merhaba ' + data.teacherName + ',\n\n' +
      data.date + ' tarihinde saat ' + data.time + ' için online ücretsiz deneme dersi kapsamında veli sunumu tarafınıza atanmıştır.\n\n' +
      'Ders türü: ' + data.lessonType + '\n' +
      'Süre: İlk 20 dakika\n' +
      'Göreviniz: Velilere platformu, süreci ve deneme dersi akışını anlatmak.\n\n' +
      'Ders, öğretmen dashboard\'ınızda görüntülenecektir.\n\n' +
      'Online ders bilgileri:\n' +
      'Katılım linki: ' + data.meetingUrl + '\n' +
      'Toplantı ID: ' + data.meetingId + '\n' +
      'Şifre: ' + data.passcode + '\n\n' +
      'İyi çalışmalar.'
    );
  }

  function branchTeacherInfoMessage(data) {
    return (
      'Merhaba ' + data.teacherName + ',\n\n' +
      data.date + ' tarihinde saat ' + data.time + ' için online ücretsiz ' + data.lessonType + ' deneme dersi tarafınıza atanmıştır.\n\n' +
      'Ders akışı:\n' +
      'İlk 20 dakika PDR/Rehberlik Öğretmeni veli sunumu yapacaktır.\n' +
      'Son 30 dakika sizin tarafınızdan öğrencilere ücretsiz deneme dersi yapılacaktır.\n\n' +
      'Katılımcı öğrenci sayısı: ' + data.studentCount + '\n\n' +
      'Ders, öğretmen dashboard\'ınızda görüntülenecektir.\n\n' +
      'Online ders bilgileri:\n' +
      'Katılım linki: ' + data.meetingUrl + '\n' +
      'Toplantı ID: ' + data.meetingId + '\n' +
      'Şifre: ' + data.passcode + '\n\n' +
      'İyi çalışmalar.'
    );
  }

  function teacherInfoMessage(data) {
    return branchTeacherInfoMessage(data);
  }

  function parentContactMessage(data) {
    var slot = (data.date && data.date !== '—' && data.time && data.time !== '—')
      ? 'Planlanan ders: ' + data.date + ' saat ' + data.time + '\n\n'
      : '';
    return (
      'Merhaba ' + data.parentName + ',\n\n' +
      data.studentName + ' için ücretsiz online ' + data.lessonType + ' deneme dersi talebiniz alınmıştır.\n\n' +
      slot +
      'Detayları görüşmek için sizinle iletişime geçiyoruz.\n\nİyi günler dileriz.'
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
    pdrTeacherInfo: pdrTeacherInfoMessage,
    branchTeacherInfo: branchTeacherInfoMessage,
    parentContact: parentContactMessage,
    whatsappUrl: whatsappUrl,
    mailtoUrl: mailtoUrl
  };
})(typeof window !== 'undefined' ? window : this);
