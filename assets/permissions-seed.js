(function (global) {
  'use strict';

  var STUDENT_IDS = ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'];

  function defaultPermissionState(studentId) {
    return {
      studentId: studentId,
      canUseMicrophone: true,
      canUseCamera: true,
      canSendChat: true,
      canAskQuestion: true,
      canRaiseHand: true,
      canUseReactions: true,
      canDrawOnWhiteboard: false,
      canUseWhiteboardEraser: false,
      canUseWhiteboardUndo: false,
      canAnswerQuiz: true,
      isFocusLocked: false,
      isMutedByTeacher: studentId !== 's1' && studentId !== 's7',
      isCameraRequestedByTeacher: false,
      isMicRequestedByTeacher: false,
      whiteboardPermissionExpiresAt: null,
      whiteboardStatus: 'not_allowed',
      lastChangedBy: 'system',
      lastChangedAt: new Date(Date.now() - 3600000).toISOString()
    };
  }

  function generatePermissionEvents(count) {
    var keys = ['canUseMicrophone', 'canSendChat', 'canRaiseHand', 'canDrawOnWhiteboard', 'canAnswerQuiz', 'isFocusLocked'];
    var reasons = ['Sınav modu', 'Öğretmen seçimi', 'Whiteboard akışı', 'Odak modu', 'Sistem varsayılanı', 'Tüm sınıf sessize alındı'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var sid = STUDENT_IDS[i % 12];
      var key = keys[i % keys.length];
      out.push({
        id: 'perm-' + i,
        studentId: i % 5 === 0 ? null : sid,
        scope: i % 5 === 0 ? 'class' : 'student',
        permissionKey: key,
        previousValue: true,
        newValue: i % 2 === 0,
        changedBy: i % 3 === 0 ? 'mock' : 'teacher',
        reason: reasons[i % reasons.length],
        createdAt: new Date(Date.now() - i * 120000).toISOString()
      });
    }
    return out;
  }

  function buildAllPermissionStates() {
    var map = {};
    STUDENT_IDS.forEach(function (id) {
      map[id] = defaultPermissionState(id);
    });
    map.s0.canDrawOnWhiteboard = false;
    map.s0.whiteboardStatus = 'raised_hand_waiting';
    map.s4.canDrawOnWhiteboard = false;
    map.s4.whiteboardStatus = 'raised_hand_waiting';
    map.s9.canUseMicrophone = false;
    map.s9.isMutedByTeacher = true;
    map.s11.canUseCamera = false;
    map.s11.canUseMicrophone = false;
    return map;
  }

  var PRESETS = {
    silent_viewer: { canUseMicrophone: false, canSendChat: false, canUseReactions: false, canRaiseHand: true, canDrawOnWhiteboard: false },
    active_participant: { canUseMicrophone: true, canSendChat: true, canUseReactions: true, canRaiseHand: true, canAnswerQuiz: true },
    whiteboard_student: { canDrawOnWhiteboard: true, canUseWhiteboardEraser: true, canUseWhiteboardUndo: true, whiteboardStatus: 'selected_can_draw' },
    quiz_focus: { canAnswerQuiz: true, canSendChat: false, canUseReactions: false, isFocusLocked: true },
    chat_off: { canSendChat: false },
    teacher_only_wb: { canDrawOnWhiteboard: false, whiteboardStatus: 'locked_by_teacher' },
    free_discussion: { canUseMicrophone: true, canSendChat: true, canUseReactions: true, isFocusLocked: false },
    exam_mode: { canUseMicrophone: false, canSendChat: false, canUseReactions: false, canAnswerQuiz: true, canDrawOnWhiteboard: false, isFocusLocked: true }
  };

  global.BilenyumPermissionsSeed = {
    STUDENT_IDS: STUDENT_IDS,
    defaultPermissionState: defaultPermissionState,
    buildAllPermissionStates: buildAllPermissionStates,
    generatePermissionEvents: generatePermissionEvents,
    permissionEvents: generatePermissionEvents(85),
    PRESETS: PRESETS
  };

})(typeof window !== 'undefined' ? window : this);
