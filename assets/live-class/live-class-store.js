(function (global) {
  'use strict';

  var Domain = global.LiveClassDomain;

  function createStore(initial) {
    initial = initial || {};
    var state = {
      session: initial.session || (Domain ? Domain.createClassSession() : {}),
      participants: initial.participants || [],
      currentUserRole: initial.currentUserRole || 'student',
      currentUserId: initial.currentUserId || 'me',
      permissions: initial.permissions || {},
      classPolicy: initial.classPolicy || (Domain ? Domain.createClassPolicy() : {}),
      whiteboard: initial.whiteboard || {},
      answerRequests: initial.answerRequests || [],
      answerResponses: initial.answerResponses || [],
      chatMessages: initial.chatMessages || [],
      questions: initial.questions || [],
      reactions: initial.reactions || {},
      situations: initial.situations || [],
      signals: initial.signals || [],
      gamificationEvents: initial.gamificationEvents || [],
      studentInsights: initial.studentInsights || {},
      ui: Object.assign({
        rightPanelOpen: true,
        rightPanelTab: 'chat',
        selectedParticipantId: null,
        studentInsightOpen: false,
        commandPaletteOpen: false,
        emergencyDockExpanded: false,
        densityMode: 'calm',
        focusedStageMode: 'gallery'
      }, initial.ui || {})
    };

    var subs = [];

    function getState() {
      return state;
    }

    function setState(partial) {
      Object.keys(partial).forEach(function (k) {
        if (k === 'ui') state.ui = Object.assign({}, state.ui, partial.ui);
        else state[k] = partial[k];
      });
      notify();
    }

    function patchUi(partial) {
      state.ui = Object.assign({}, state.ui, partial);
      notify();
    }

    function notify() {
      subs.forEach(function (fn) { fn(state); });
    }

    function subscribe(fn) {
      subs.push(fn);
      return function () { subs = subs.filter(function (x) { return x !== fn; }); };
    }

    function getParticipant(id) {
      for (var i = 0; i < state.participants.length; i++) {
        if (state.participants[i].id === id) return state.participants[i];
      }
      return null;
    }

    function applyEvent(event) {
      if (!event || !event.type) return;
      switch (event.type) {
        case 'mic_muted_by_teacher':
          if (event.targetParticipantId && state.permissions[event.targetParticipantId]) {
            state.permissions[event.targetParticipantId].isMutedByTeacher = true;
            state.permissions[event.targetParticipantId].canUseMicrophone = false;
          }
          break;
        case 'whiteboard_permission_revoked':
          state.participants.forEach(function (p) {
            if (p.isSelectedForWhiteboard) p.isSelectedForWhiteboard = false;
          });
          break;
        case 'student_selected_for_whiteboard':
          if (event.targetParticipantId) {
            state.participants.forEach(function (p) {
              p.isSelectedForWhiteboard = p.id === event.targetParticipantId;
            });
            state.ui.focusedStageMode = 'whiteboard';
          }
          break;
        case 'chat_mode_changed':
          if (event.payload && event.payload.mode) {
            state.classPolicy.chatMode = event.payload.mode;
            state.session.chatMode = event.payload.mode;
          }
          break;
        case 'focus_mode_started':
          state.session.focusModeEnabled = true;
          state.ui.densityMode = 'active';
          break;
        case 'focus_mode_ended':
          state.session.focusModeEnabled = false;
          break;
        case 'xp_awarded':
          break;
      }
      notify();
    }

    if (global.LiveClassEvents) {
      global.LiveClassEvents.subscribe(applyEvent);
    }

    return {
      getState: getState,
      setState: setState,
      patchUi: patchUi,
      subscribe: subscribe,
      getParticipant: getParticipant,
      applyEvent: applyEvent
    };
  }

  var sharedStore = null;

  function getStore() {
    if (!sharedStore) sharedStore = createStore();
    return sharedStore;
  }

  function initFromSeed(seed, role, userId) {
    var store = getStore();
    store.setState({
      session: seed.session,
      participants: seed.participants,
      permissions: seed.permissions,
      classPolicy: seed.classPolicy,
      chatMessages: seed.chatMessages,
      questions: seed.questions,
      answerRequests: seed.answerRequests,
      situations: seed.situations,
      signals: seed.signals,
      gamificationEvents: seed.gamificationEvents,
      studentInsights: seed.studentInsights,
      currentUserRole: role || 'student',
      currentUserId: userId || 'me'
    });
    return store;
  }

  function useTeacherLiveClass() {
    var s = getStore().getState();
    return {
      role: 'teacher',
      session: s.session,
      participants: s.participants.filter(function (p) { return p.role === 'student'; }),
      ui: s.ui,
      situations: s.situations,
      signals: s.signals
    };
  }

  function useStudentLiveClass() {
    var s = getStore().getState();
    var me = s.participants.find(function (p) { return p.isSelf || p.id === s.currentUserId; });
    return {
      role: 'student',
      session: s.session,
      me: me,
      permissions: s.permissions[s.currentUserId] || s.permissions.me || {},
      classPolicy: s.classPolicy,
      ui: s.ui
    };
  }

  global.LiveClassStore = {
    createStore: createStore,
    getStore: getStore,
    initFromSeed: initFromSeed,
    useTeacherLiveClass: useTeacherLiveClass,
    useStudentLiveClass: useStudentLiveClass
  };

})(typeof window !== 'undefined' ? window : this);
