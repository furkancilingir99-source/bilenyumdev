(function (g) {
  'use strict';

  g.BilenyumLiveClass = {
    buildUrl: function (opts) {
      opts = opts || {};
      var p = new URLSearchParams();
      if (opts.subject) p.set('subject', opts.subject);
      if (opts.topic) p.set('topic', opts.topic);
      if (opts.teacher) p.set('teacher', opts.teacher);
      if (opts.teacherAvatar) p.set('teacherAvatar', opts.teacherAvatar);
      var s = p.toString();
      return 'ogrenci-canli-ders.html' + (s ? '?' + s : '');
    },
    go: function (opts) {
      g.location.href = g.BilenyumLiveClass.buildUrl(opts);
    }
  };

  g.BilenyumTeacherLiveClass = g.BilenyumTeacherLiveClass || {
    buildUrl: function (opts) {
      opts = opts || {};
      var p = new URLSearchParams();
      if (opts.subject) p.set('subject', opts.subject);
      if (opts.topic) p.set('topic', opts.topic);
      var s = p.toString();
      return 'ogretmen-ogrenci-canli-ders.html' + (s ? '?' + s : '');
    },
    go: function (opts) {
      g.location.href = g.BilenyumTeacherLiveClass.buildUrl(opts);
    }
  };
})(typeof window !== 'undefined' ? window : this);
