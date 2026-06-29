(function (global) {
  'use strict';

  var PermSeed = global.BilenyumPermissionsSeed;

  function createPermissionManager(opts) {
    opts = opts || {};
    var states = {};
    var timeline = [];
    var classSettings = {
      chatEnabled: true,
      reactionsEnabled: true,
      quizEnabled: true,
      whiteboardLocked: false,
      focusMode: false
    };

    function initFromSeed(seedStates, seedEvents) {
      states = {};
      Object.keys(seedStates || {}).forEach(function (k) {
        states[k] = Object.assign({}, seedStates[k]);
      });
      timeline = (seedEvents || []).slice();
    }

    function getState(studentId) {
      if (!states[studentId]) {
        states[studentId] = PermSeed ? PermSeed.defaultPermissionState(studentId) : { studentId: studentId };
      }
      return states[studentId];
    }

    function logEvent(ev) {
      timeline.unshift(ev);
      if (timeline.length > 200) timeline.length = 200;
      if (opts.onEvent) opts.onEvent(ev);
    }

    function setPermission(studentId, key, value, reason) {
      var st = getState(studentId);
      var prev = st[key];
      st[key] = value;
      st.lastChangedBy = 'teacher';
      st.lastChangedAt = new Date().toISOString();
      if (key === 'canDrawOnWhiteboard') {
        st.whiteboardStatus = value ? 'selected_can_draw' : 'not_allowed';
      }
      logEvent({
        id: 'pe-' + Date.now(),
        studentId: studentId,
        scope: 'student',
        permissionKey: key,
        previousValue: prev,
        newValue: value,
        changedBy: 'teacher',
        reason: reason || '',
        createdAt: new Date().toISOString()
      });
      return st;
    }

    function applyPreset(studentId, presetName) {
      var preset = PermSeed && PermSeed.PRESETS[presetName];
      if (!preset) return null;
      Object.keys(preset).forEach(function (k) {
        setPermission(studentId, k, preset[k], 'Preset: ' + presetName);
      });
      return getState(studentId);
    }

    function applyClassPreset(presetName) {
      var preset = PermSeed && PermSeed.PRESETS[presetName];
      if (!preset) return;
      Object.keys(states).forEach(function (sid) {
        Object.keys(preset).forEach(function (k) {
          setPermission(sid, k, preset[k], 'Sınıf preset: ' + presetName);
        });
      });
      if (presetName === 'exam_mode') {
        classSettings.chatEnabled = false;
        classSettings.reactionsEnabled = false;
        classSettings.focusMode = true;
      }
      logEvent({
        id: 'pe-class-' + Date.now(),
        studentId: null,
        scope: 'class',
        permissionKey: 'preset',
        previousValue: null,
        newValue: presetName,
        changedBy: 'teacher',
        reason: 'Sınıf preset uygulandı',
        createdAt: new Date().toISOString()
      });
    }

    function setClassSetting(key, value) {
      classSettings[key] = value;
      logEvent({
        id: 'pe-class-' + Date.now(),
        studentId: null,
        scope: 'class',
        permissionKey: key,
        previousValue: !value,
        newValue: value,
        changedBy: 'teacher',
        createdAt: new Date().toISOString()
      });
    }

    function getTimeline(studentId) {
      if (!studentId) return timeline.slice();
      return timeline.filter(function (e) { return !e.studentId || e.studentId === studentId; });
    }

    function getAllStates() { return states; }

    function getClassSettings() { return Object.assign({}, classSettings); }

    return {
      initFromSeed: initFromSeed,
      getState: getState,
      setPermission: setPermission,
      applyPreset: applyPreset,
      applyClassPreset: applyClassPreset,
      setClassSetting: setClassSetting,
      getTimeline: getTimeline,
      getAllStates: getAllStates,
      getClassSettings: getClassSettings
    };
  }

  global.BilenyumPermissionManager = { create: createPermissionManager };

})(typeof window !== 'undefined' ? window : this);
