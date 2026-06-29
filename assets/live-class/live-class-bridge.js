(function (global) {
  'use strict';

  var bridgeInitialized = false;

  function initTeacherBridge(ctx) {
    ctx = ctx || {};
    if (!global.LiveClassStore || !global.LiveClassEvents) return null;

    var seed = global.LiveClassDemoSeed ? global.LiveClassDemoSeed.build() : {};
    var store = global.LiveClassStore.initFromSeed(seed, 'teacher', 'teacher');

    if (ctx.participants && ctx.participants.length) {
      store.setState({ participants: ctx.participants.map(function (p) {
        return global.LiveClassDomain ? global.LiveClassDomain.createParticipant(Object.assign({}, p)) : p;
      }) });
    }

    bridgeInitialized = true;
    return store;
  }

  function initStudentBridge(ctx) {
    ctx = ctx || {};
    if (!global.LiveClassStore) return null;

    var store = global.LiveClassStore.getStore();
    if (!bridgeInitialized) {
      var seed = global.LiveClassDemoSeed ? global.LiveClassDemoSeed.build() : {};
      store = global.LiveClassStore.initFromSeed(seed, 'student', 'me');
    }

    store.setState({
      currentUserRole: 'student',
      currentUserId: 'me'
    });

    return store;
  }

  function publishTeacherAction(type, opts) {
    if (global.LiveClassEvents) global.LiveClassEvents.publish(type, opts);
  }

  function wrapSelectForWhiteboard(original, getP) {
    return function (studentId) {
      if (global.LiveClassEvents) {
        global.LiveClassEvents.publish('student_selected_for_whiteboard', {
          actorId: 'teacher',
          targetParticipantId: studentId,
          payload: { source: 'teacher_action' }
        });
      }
      return original(studentId);
    };
  }

  function wrapRevokeWhiteboard(original) {
    return function () {
      if (global.LiveClassEvents) {
        global.LiveClassEvents.publish('whiteboard_permission_revoked', {
          actorId: 'teacher',
          payload: {}
        });
      }
      return original();
    };
  }

  function wrapMuteParticipant(original, id) {
    if (global.LiveClassEvents) {
      global.LiveClassEvents.publish('mic_muted_by_teacher', {
        actorId: 'teacher',
        targetParticipantId: id,
        payload: {}
      });
    }
    return original(id);
  }

  global.LiveClassBridge = {
    initTeacher: initTeacherBridge,
    initStudent: initStudentBridge,
    publishTeacherAction: publishTeacherAction,
    wrapSelectForWhiteboard: wrapSelectForWhiteboard,
    wrapRevokeWhiteboard: wrapRevokeWhiteboard,
    wrapMuteParticipant: wrapMuteParticipant
  };

})(typeof window !== 'undefined' ? window : this);
