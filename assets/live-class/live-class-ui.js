(function (global) {
  'use strict';

  var Icons = global.LiveClassTheme ? global.LiveClassTheme.icons : {};

  /** Human-readable status badges for both roles */
  function buildStatusBadges(ctx) {
    ctx = ctx || {};
    var badges = [];
    var perm = ctx.perm || {};
    var state = ctx.state || {};
    var policy = ctx.policy || {};

    if (perm.isMutedByTeacher) badges.push({ key: 'mic-off', cls: 'lc-class-badge--mic-off', icon: Icons.micOff, text: 'Mikrofon kapalı' });
    if (state.chatMode === 'muted' || policy.chatMode === 'muted') badges.push({ key: 'chat-off', cls: 'lc-class-badge--chat-off', icon: Icons.chat, text: 'Chat kapalı' });
    if (state.chatMode === 'exam_mode' || policy.chatMode === 'exam_mode') badges.push({ key: 'quiz', cls: 'lc-class-badge--quiz', icon: Icons.quiz, text: 'Quiz modu' });
    if (state.isFocusMode || state.focusModeEnabled) badges.push({ key: 'focus', cls: 'lc-class-badge--focus', icon: Icons.focus, text: 'Odak modu' });
    if (ctx.wbSelectedSelf) badges.push({ key: 'wb', cls: 'lc-class-badge--wb', icon: Icons.whiteboard, text: 'Tahtadasın' });
    else if (state.handRaised) badges.push({ key: 'hand', cls: 'lc-class-badge--hand', icon: Icons.hand, text: 'El kaldırdın' });
    if (state.connectionQuality === 'poor' || state.connectionQuality === 'critical') {
      badges.push({ key: 'conn', cls: 'lc-class-badge--conn', icon: Icons.connection, text: 'Bağlantı zayıf' });
    }
    return badges;
  }

  function renderStatusBadgesHtml(badges) {
    return badges.map(function (b) {
      return '<span class="lc-class-badge ' + b.cls + '">' + (b.icon ? b.icon + ' ' : '') + b.text + '</span>';
    }).join('');
  }

  /** Signal card — not "AI suggestion" styling */
  function renderSignalCard(signal) {
    var pri = signal.priority === 'urgent' || signal.priority === 'high' ? 'warning' : 'attention';
    return '<div class="lc-class-signal lc-class-signal--' + pri + '">' +
      '<div><span class="lc-class-signal__title">' + signal.title + '</span>' +
      '<span class="lc-class-signal__desc">' + signal.description + '</span></div>' +
      (signal.actionLabel ? '<button type="button" class="lc-class-btn lc-class-btn--sm lc-class-btn--primary" data-signal-act="' + (signal.action || '') + '">' + signal.actionLabel + '</button>' : '') +
    '</div>';
  }

  /** Toast copy — calm, explanatory (PRD §15) */
  var StudentNotices = {
    micMutedByTeacher: 'Ders akışını korumak için mikrofonun kapatıldı.',
    micRequest: 'Öğretmenin mikrofonunu açmanı istiyor.',
    wbRevoked: 'Öğretmen whiteboard yazma iznini kapattı.',
    wbLocked: 'Whiteboard kilitlendi. Şu anda sadece izleyebilirsin.',
    wbSelected: 'Tahtadasın — yazdıkların herkes tarafından görülür.',
    chatExam: 'Quiz sırasında chat kapalı. Cevabını quiz panelinden gönderebilirsin.',
    chatMuted: 'Öğretmen şu anda chat\'i kapattı.',
    chatQuestions: 'Şu anda yalnızca öğretmene soru gönderebilirsin.',
    focusMode: 'Odak modundasın — ders içeriğine odaklan.',
    connWeak: 'Bağlantın zayıf. Ders senkronizasyonu gecikebilir.'
  };

  var TeacherNotices = {
    micMuted: '{name} sessize alındı.',
    wbSelected: '{name} whiteboard\'a seçildi.',
    wbRevoked: 'Whiteboard yazma izni kaldırıldı.',
    chatMode: 'Chat modu güncellendi.',
    focusOn: 'Odak modu başlatıldı.',
    allMuted: 'Tüm sınıf sessize alındı.'
  };

  function formatNotice(template, vars) {
    var out = template;
    Object.keys(vars || {}).forEach(function (k) {
      out = out.replace('{' + k + '}', vars[k]);
    });
    return out;
  }

  global.LiveClassUI = {
    buildStatusBadges: buildStatusBadges,
    renderStatusBadgesHtml: renderStatusBadgesHtml,
    renderSignalCard: renderSignalCard,
    StudentNotices: StudentNotices,
    TeacherNotices: TeacherNotices,
    formatNotice: formatNotice
  };

})(typeof window !== 'undefined' ? window : this);
