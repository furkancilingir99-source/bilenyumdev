/**
 * Web formu talep simülasyonu — ayarlar ve talep listesi ortak formu
 */
(function (global) {
  'use strict';

  var Store = global.TMStore;
  var U = global.TMUtils;
  var Form = global.TMFormDialog;
  var Perms = global.TMPermissions;

  var POOLS = [
    { studentFirstName: 'Melis', studentLastName: 'Ergin', studentAge: 10, studentGrade: '5. Sınıf', studentLevel: 'Başlangıç', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Umut', parentLastName: 'Ergin', parentPhone: '0531 220 8891', parentEmail: 'umut.ergin@mail.com' },
    { studentFirstName: 'Kaan', studentLastName: 'Polat', studentAge: 12, studentGrade: '6. Sınıf', studentLevel: 'Orta', requestedLessonTypeId: 'lt-fen', parentFirstName: 'İrem', parentLastName: 'Polat', parentPhone: '0538 441 0021', parentEmail: 'irem.polat@mail.com' },
    { studentFirstName: 'Selin', studentLastName: 'Aksoy', studentAge: 11, studentGrade: '7. Sınıf', studentLevel: 'İleri', requestedLessonTypeId: 'lt-mat', parentFirstName: 'Murat', parentLastName: 'Aksoy', parentPhone: '0542 330 7712', parentEmail: 'murat.aksoy@mail.com' }
  ];

  function defaultDraft() {
    var seq = Store ? Store.getRequests().length : 0;
    return POOLS[seq % POOLS.length];
  }

  function allSessionOptions() {
    var opts = [{ value: '', label: '— Rezervasyonsuz talep (slot seçilmedi) —' }];
    if (!Store) return opts;
    Store.getLessonTypes().forEach(function (lt) {
      Store.getAvailableSessionsForLessonType(lt.id).forEach(function (s) {
        opts.push({
          value: s.id,
          label: lt.name + ' · ' + U.formatDateKey(s.date) + ' ' + s.startTime + ' · ' + s.enrolledStudentIds.length + '/20'
        });
      });
    });
    return opts;
  }

  function open(opts) {
    opts = opts || {};
    if (!Store || !Form) return;
    if (Perms && !Perms.guard('create')) return;

    var sample = defaultDraft();
    var grades = Store.getGrades ? Store.getGrades() : ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
    var levels = Store.getLevels ? Store.getLevels() : ['Başlangıç', 'Orta', 'İleri'];

    Form.open({
      title: 'Web formu talebi simüle et',
      description: 'Gerçek web sitesi formunu taklit eder. Slot seçmezseniz talep rezervasyonsuz (orphan) oluşur.',
      fields: [
        { type: 'text', name: 'studentFirstName', label: 'Öğrenci adı', value: sample.studentFirstName, required: true },
        { type: 'text', name: 'studentLastName', label: 'Öğrenci soyadı', value: sample.studentLastName, required: true },
        { type: 'text', name: 'studentAge', label: 'Yaş', value: String(sample.studentAge), required: true },
        {
          type: 'select',
          name: 'studentGrade',
          label: 'Sınıf',
          value: sample.studentGrade,
          options: grades.map(function (g) { return { value: g, label: g }; })
        },
        {
          type: 'select',
          name: 'studentLevel',
          label: 'Seviye',
          value: sample.studentLevel,
          options: levels.map(function (l) { return { value: l, label: l }; })
        },
        {
          type: 'select',
          name: 'requestedLessonTypeId',
          label: 'Talep edilen ders',
          value: sample.requestedLessonTypeId,
          options: Store.getLessonTypes().map(function (lt) { return { value: lt.id, label: lt.name }; })
        },
        { type: 'text', name: 'parentFirstName', label: 'Veli adı', value: sample.parentFirstName, required: true },
        { type: 'text', name: 'parentLastName', label: 'Veli soyadı', value: sample.parentLastName, required: true },
        { type: 'text', name: 'parentPhone', label: 'Veli telefon', value: sample.parentPhone, required: true },
        { type: 'text', name: 'parentEmail', label: 'Veli e-posta', value: sample.parentEmail, required: false },
        {
          type: 'select',
          name: 'selectedSessionId',
          label: 'Tercih edilen ders slotu',
          value: '',
          options: allSessionOptions()
        }
      ],
      submitLabel: 'Talep oluştur',
      onSubmit: function (data) {
        if (!data.studentFirstName || !data.studentLastName || !data.parentFirstName || !data.parentPhone) {
          if (U.notifyError) U.notifyError('Öğrenci ve veli zorunlu alanları doldurun.');
          return;
        }
        if (data.selectedSessionId) {
          var sess = Store.getSessionById(data.selectedSessionId);
          if (sess && sess.lessonTypeId !== data.requestedLessonTypeId) {
            if (U.notifyError) U.notifyError('Talep edilen ders türü ile seçilen slot uyumsuz.');
            return;
          }
        }
        var res = Store.createSimulatedRequest({
          studentFirstName: data.studentFirstName,
          studentLastName: data.studentLastName,
          studentAge: parseInt(data.studentAge, 10) || 11,
          studentGrade: data.studentGrade,
          studentLevel: data.studentLevel,
          requestedLessonTypeId: data.requestedLessonTypeId,
          parentFirstName: data.parentFirstName,
          parentLastName: data.parentLastName,
          parentPhone: data.parentPhone,
          parentEmail: data.parentEmail,
          selectedSessionId: data.selectedSessionId || undefined
        });
        if (!res.ok) {
          if (U.notifyError) U.notifyError(res.error || 'Talep oluşturulamadı.');
          return;
        }
        var name = res.request.studentFirstName + ' ' + res.request.studentLastName;
        if (global.TMToast) global.TMToast.show('Yeni talep: ' + name, 'success');
        if (global.TMOnSessionChange) global.TMOnSessionChange();
        if (opts.onSuccess) opts.onSuccess(res);
      }
    });
  }

  global.TMSimulateRequest = { open: open };
})(window);
