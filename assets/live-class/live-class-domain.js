(function (global) {
  'use strict';

  function uid(prefix) {
    return (prefix || 'lc') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function createClassSession(opts) {
    opts = opts || {};
    return {
      id: opts.id || 'session-demo-1',
      title: opts.title || 'Matematik — Canlı Ders',
      topic: opts.topic || 'Doğrusal Denklemler',
      teacherId: opts.teacherId || 'teacher',
      status: opts.status || 'preclass',
      startedAt: opts.startedAt || null,
      endedAt: opts.endedAt || null,
      currentStageMode: opts.currentStageMode || 'gallery',
      activeAnswerRequestId: opts.activeAnswerRequestId || null,
      activeWhiteboardPageId: opts.activeWhiteboardPageId || null,
      focusModeEnabled: !!opts.focusModeEnabled,
      chatMode: opts.chatMode || 'open',
      recordingMockEnabled: !!opts.recordingMockEnabled
    };
  }

  function createParticipant(opts) {
    opts = opts || {};
    return {
      id: opts.id,
      classSessionId: opts.classSessionId || 'session-demo-1',
      userId: opts.userId || opts.id,
      name: opts.name || 'Katılımcı',
      role: opts.role || 'student',
      isSelf: !!opts.isSelf,
      cameraOn: !!opts.cameraOn,
      micOn: !!opts.micOn,
      isSpeaking: !!opts.isSpeaking,
      isHandRaised: !!opts.isHandRaised,
      isSelectedForWhiteboard: !!opts.isSelectedForWhiteboard,
      isInWaitingRoom: !!opts.isInWaitingRoom,
      isFocusLocked: !!opts.isFocusLocked,
      reaction: opts.reaction || null,
      connectionQuality: opts.connectionQuality || 'good',
      joinedAt: opts.joinedAt || new Date().toISOString(),
      lastActiveAt: opts.lastActiveAt || new Date().toISOString()
    };
  }

  function createClassEvent(type, opts) {
    opts = opts || {};
    return {
      id: opts.id || uid('evt'),
      classSessionId: opts.classSessionId || 'session-demo-1',
      type: type,
      actorId: opts.actorId,
      targetParticipantId: opts.targetParticipantId,
      payload: opts.payload || {},
      createdAt: opts.createdAt || new Date().toISOString()
    };
  }

  function createPermissionState(participantId, opts) {
    opts = opts || {};
    return {
      participantId: participantId,
      canUseMicrophone: opts.canUseMicrophone !== false,
      canUseCamera: opts.canUseCamera !== false,
      canSendChat: opts.canSendChat !== false,
      canAskQuestion: opts.canAskQuestion !== false,
      canRaiseHand: opts.canRaiseHand !== false,
      canUseReactions: opts.canUseReactions !== false,
      canAnswerQuiz: opts.canAnswerQuiz !== false,
      canViewWhiteboard: opts.canViewWhiteboard !== false,
      canDrawOnWhiteboard: !!opts.canDrawOnWhiteboard,
      canUseWhiteboardEraser: !!opts.canUseWhiteboardEraser,
      canUseWhiteboardUndoRedo: !!opts.canUseWhiteboardUndoRedo,
      isFocusLocked: !!opts.isFocusLocked,
      isMutedByTeacher: !!opts.isMutedByTeacher,
      isChatRestricted: !!opts.isChatRestricted,
      whiteboardPermissionReason: opts.whiteboardPermissionReason || 'not_selected',
      updatedAt: opts.updatedAt || new Date().toISOString()
    };
  }

  function createClassPolicy(classSessionId, opts) {
    opts = opts || {};
    return {
      classSessionId: classSessionId || 'session-demo-1',
      chatMode: opts.chatMode || 'open',
      microphonePolicy: opts.microphonePolicy || 'teacher_approval_required',
      cameraPolicy: opts.cameraPolicy || 'students_control',
      whiteboardPolicy: opts.whiteboardPolicy || 'selected_raised_hand_student',
      quizPolicy: opts.quizPolicy || 'open',
      reactionPolicy: opts.reactionPolicy || 'open',
      updatedAt: opts.updatedAt || new Date().toISOString()
    };
  }

  /** Maps legacy crisis bus events to ClassEvent types */
  var LEGACY_EVENT_MAP = {
    mic_muted: 'mic_muted_by_teacher',
    mic_request: 'mic_request_sent',
    wb_revoked: 'whiteboard_permission_revoked',
    wb_locked: 'whiteboard_locked',
    chat_closed: 'chat_mode_changed',
    chat_mode: 'chat_mode_changed',
    focus_on: 'focus_mode_started'
  };

  global.LiveClassDomain = {
    uid: uid,
    createClassSession: createClassSession,
    createParticipant: createParticipant,
    createClassEvent: createClassEvent,
    createPermissionState: createPermissionState,
    createClassPolicy: createClassPolicy,
    LEGACY_EVENT_MAP: LEGACY_EVENT_MAP
  };

})(typeof window !== 'undefined' ? window : this);
