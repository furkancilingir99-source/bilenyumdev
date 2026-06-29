(function (global) {
  'use strict';

  var Domain = global.LiveClassDomain;
  var STORAGE_KEY = 'bilenyum_live_class_events';
  var LEGACY_KEY = 'bilenyum_crisis_bus';
  var listeners = [];
  var eventLog = [];

  function emitClassEvent(event) {
    if (!event || !event.type) return;
    eventLog.unshift(event);
    if (eventLog.length > 100) eventLog.length = 100;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ event: event, at: Date.now() }));
    } catch (e) { /* ignore */ }
    global.dispatchEvent(new CustomEvent('liveclass-event', { detail: event }));
    listeners.forEach(function (fn) { fn(event); });
  }

  function publish(type, opts) {
    var ev = Domain ? Domain.createClassEvent(type, opts) : {
      id: 'evt-' + Date.now(),
      type: type,
      payload: (opts && opts.payload) || {},
      createdAt: new Date().toISOString()
    };
    emitClassEvent(ev);
    return ev;
  }

  /** Bridge legacy crisis bus → ClassEvent */
  function bridgeLegacy(detail) {
    if (!detail || !detail.event) return;
    var mapped = Domain && Domain.LEGACY_EVENT_MAP[detail.event];
    if (!mapped) return;
    publish(mapped, {
      payload: {
        message: detail.message,
        mode: detail.mode,
        legacyEvent: detail.event
      }
    });
  }

  function subscribe(fn) {
    if (typeof fn === 'function') listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (x) { return x !== fn; });
    };
  }

  function getRecent(limit) {
    return eventLog.slice(0, limit || 20);
  }

  function init() {
    global.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          var parsed = JSON.parse(e.newValue);
          if (parsed.event) emitClassEvent(parsed.event);
        } catch (err) { /* ignore */ }
      }
      if (e.key === LEGACY_KEY && e.newValue) {
        try { bridgeLegacy(JSON.parse(e.newValue)); } catch (err) { /* ignore */ }
      }
    });
    global.addEventListener('bilenyum-crisis', function (e) {
      bridgeLegacy(e.detail);
    });
  }

  global.LiveClassEvents = {
    init: init,
    publish: publish,
    subscribe: subscribe,
    getRecent: getRecent,
    emitClassEvent: emitClassEvent
  };

  init();

})(typeof window !== 'undefined' ? window : this);
