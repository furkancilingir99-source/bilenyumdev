(function (global) {
  'use strict';

  var XP_RULES = {
    attendance_minute: 0,
    quiz_answered: 10,
    quiz_correct: 15,
    quiz_fast_answer: 5,
    open_answer_submitted: 10,
    question_asked: 8,
    hand_raised: 5,
    whiteboard_selected: 10,
    whiteboard_stroke: 2,
    whiteboard_solution_completed: 20,
    reaction_sent: 2,
    help_requested: 3,
    focus_mode_completed: 5,
    badge_earned: 0,
    teacher_bonus_xp: 0,
    joined_class: 5,
    active_10min: 5
  };

  var HAND_RAISE_XP_LIMIT = 3;
  var REACTION_XP_COOLDOWN_MS = 60000;

  function createGamificationEngine() {
    var events = [];
    var handRaiseXpCount = {};
    var lastReactionXp = {};

    function emit(ev) {
      events.push(ev);
      if (global.dispatchEvent) {
        global.dispatchEvent(new CustomEvent('bilenyum-gamification', { detail: ev }));
      }
      return ev;
    }

    function awardXp(studentId, type, opts) {
      opts = opts || {};
      var delta = opts.xpDelta != null ? opts.xpDelta : (XP_RULES[type] || 0);
      if (!delta && type !== 'teacher_bonus_xp') return null;

      if (type === 'hand_raised') {
        handRaiseXpCount[studentId] = (handRaiseXpCount[studentId] || 0) + 1;
        if (handRaiseXpCount[studentId] > HAND_RAISE_XP_LIMIT) return null;
      }
      if (type === 'reaction_sent') {
        var last = lastReactionXp[studentId] || 0;
        if (Date.now() - last < REACTION_XP_COOLDOWN_MS) return null;
        lastReactionXp[studentId] = Date.now();
      }
      if (type === 'teacher_bonus_xp') delta = opts.xpDelta || 10;

      var ev = {
        id: 'gxp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        studentId: studentId,
        type: type,
        xpDelta: delta,
        scoreCategory: opts.scoreCategory || categoryForType(type),
        sourceId: opts.sourceId,
        metadata: opts.metadata || {},
        createdAt: new Date().toISOString()
      };
      return emit(ev);
    }

    function categoryForType(type) {
      if (type.indexOf('quiz') >= 0) return 'quiz';
      if (type.indexOf('whiteboard') >= 0) return 'whiteboard';
      if (type === 'question_asked' || type === 'help_requested') return 'help_seeking';
      if (type === 'focus_mode_completed') return 'focus';
      if (type === 'reaction_sent') return 'collaboration';
      return 'participation';
    }

    function getEvents(studentId) {
      if (!studentId) return events.slice();
      return events.filter(function (e) { return e.studentId === studentId; });
    }

    function getLessonXp(studentId, baseLessonXp) {
      var earned = events.filter(function (e) { return e.studentId === studentId; }).reduce(function (s, e) { return s + e.xpDelta; }, 0);
      return (baseLessonXp || 0) + earned;
    }

    function loadSeed(seedEvents) {
      events = (seedEvents || []).slice();
    }

    return {
      XP_RULES: XP_RULES,
      awardXp: awardXp,
      getEvents: getEvents,
      getLessonXp: getLessonXp,
      loadSeed: loadSeed,
      getAllEvents: function () { return events.slice(); }
    };
  }

  function generateGamificationEvents(count) {
    var ids = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'];
    var types = Object.keys(XP_RULES).filter(function (k) { return XP_RULES[k] > 0; });
    var cats = ['participation', 'quiz', 'whiteboard', 'focus', 'collaboration', 'help_seeking'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var t = types[i % types.length];
      out.push({
        id: 'gseed-' + i,
        studentId: ids[i % 12],
        type: t,
        xpDelta: XP_RULES[t],
        scoreCategory: cats[i % cats.length],
        createdAt: new Date(Date.now() - i * 45000).toISOString()
      });
    }
    return out;
  }

  global.BilenyumGamification = {
    createEngine: createGamificationEngine,
    XP_RULES: XP_RULES,
    seedEvents: generateGamificationEvents(110)
  };

})(typeof window !== 'undefined' ? window : this);
