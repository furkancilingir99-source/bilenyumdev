/**
 * Trial Manager API adapter — şimdilik TMStore (mock), ileride REST API
 */
(function (global) {
  'use strict';

  var MODE_KEY = 'bilenyum_tm_api_mode';

  var ENDPOINTS = {
    metrics: '/api/trial-manager/metrics',
    sessions: '/api/trial-manager/sessions',
    requests: '/api/trial-manager/requests',
    reservations: '/api/trial-manager/reservations',
    students: '/api/trial-manager/students',
    parents: '/api/trial-manager/parents',
    teachers: '/api/trial-manager/teachers',
    auditLogs: '/api/trial-manager/audit-logs',
    communicationLogs: '/api/trial-manager/communication-logs'
  };

  function getMode() {
    try {
      return sessionStorage.getItem(MODE_KEY) || 'mock';
    } catch (e) {
      return 'mock';
    }
  }

  function setMode(mode) {
    if (mode !== 'mock' && mode !== 'api') {
      return { ok: false, error: 'Geçersiz mod.' };
    }
    if (mode === 'api') {
      return { ok: false, error: 'REST API henüz bağlı değil. Mock mod kullanın.' };
    }
    try {
      sessionStorage.setItem(MODE_KEY, mode);
      return { ok: true, mode: mode };
    } catch (e) {
      return { ok: false, error: 'Mod kaydedilemedi.' };
    }
  }

  function store() {
    if (getMode() !== 'mock') {
      throw new Error('REST API modu henüz uygulanmadı.');
    }
    if (!global.TMStore) {
      throw new Error('TMStore yüklenmedi.');
    }
    return global.TMStore;
  }

  function callStore(method) {
    return function () {
      var s = store();
      var fn = s[method];
      if (typeof fn !== 'function') {
        throw new Error('TMStore.' + method + ' bulunamadı.');
      }
      return fn.apply(s, arguments);
    };
  }

  global.TMApi = {
    getMode: getMode,
    setMode: setMode,
    isMock: function () { return getMode() === 'mock'; },
    endpoints: ENDPOINTS,
    getOperationMetrics: callStore('getOperationMetrics'),
    getMockStats: callStore('getMockStats'),
    getAuditLogs: callStore('getAuditLogs'),
    getSessions: callStore('getSessions'),
    getRequests: callStore('getRequests'),
    getReservations: callStore('getReservations'),
    getStudents: callStore('getStudents'),
    getParents: callStore('getParents'),
    getTeachers: callStore('getTeachers'),
    getCurrentUser: callStore('getCurrentUser'),
    getDataConsistencySnapshot: callStore('getDataConsistencySnapshot'),
    createSimulatedRequest: callStore('createSimulatedRequest'),
    resetMockData: callStore('resetMockData'),
    switchCurrentUser: callStore('switchCurrentUser')
  };
})(typeof window !== 'undefined' ? window : this);
