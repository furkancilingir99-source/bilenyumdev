/**
 * Trial Manager API adapter — şimdilik TMStore (mock), ileride REST API
 */
(function (global) {
  'use strict';

  var MODE_KEY = 'bilenyum_tm_api_mode';

  var ENDPOINTS = {
    health: '/api/trial-manager/health',
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
    try {
      sessionStorage.setItem(MODE_KEY, mode);
      return {
        ok: true,
        mode: mode,
        note: mode === 'api'
          ? 'Health ve metrik uçları REST üzerinden; veri işlemleri mock TMStore ile devam eder.'
          : null
      };
    } catch (e) {
      return { ok: false, error: 'Mod kaydedilemedi.' };
    }
  }

  function store() {
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

  function data() {
    return store();
  }

  function invoke(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    var fn = data()[method];
    if (typeof fn !== 'function') {
      throw new Error('TMStore.' + method + ' bulunamadı.');
    }
    return fn.apply(data(), args);
  }

  function fetchJson(path, options) {
    options = options || {};
    var headers = Object.assign({ Accept: 'application/json' }, options.headers || {});
    return fetch(path, Object.assign({ credentials: 'same-origin', headers: headers }, options))
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (body) {
            throw new Error(body || ('HTTP ' + res.status));
          });
        }
        return res.json();
      });
  }

  function checkHealth() {
    if (getMode() === 'mock') {
      return Promise.resolve({
        ok: true,
        mode: 'mock',
        message: 'Mock mod aktif — veriler tarayıcı oturumunda.'
      });
    }
    return fetchJson(ENDPOINTS.health).then(function (data) {
      return { ok: true, mode: 'api', data: data };
    }).catch(function (err) {
      return { ok: false, mode: 'api', error: err.message || 'Bağlantı başarısız.' };
    });
  }

  function probeHealth() {
    return fetchJson(ENDPOINTS.health).then(function (data) {
      return { ok: true, data: data };
    }).catch(function (err) {
      return { ok: false, error: err.message || 'Bağlantı başarısız.' };
    });
  }

  function fetchOperationMetrics() {
    if (getMode() === 'mock') {
      return Promise.resolve(store().getOperationMetrics());
    }
    return fetchJson(ENDPOINTS.metrics).then(function (body) {
      if (!body || !body.ok) {
        throw new Error((body && body.error) || 'Metrik alınamadı.');
      }
      return body.metrics;
    });
  }

  function probeMetrics() {
    return fetchJson(ENDPOINTS.metrics).then(function (body) {
      if (!body || !body.ok) {
        throw new Error((body && body.error) || 'Metrik alınamadı.');
      }
      return { ok: true, data: body };
    }).catch(function (err) {
      return { ok: false, error: err.message || 'Bağlantı başarısız.' };
    });
  }

  function probeResource(resourceKey) {
    var path = ENDPOINTS[resourceKey];
    if (!path) {
      return Promise.resolve({ ok: false, resource: resourceKey, error: 'Bilinmeyen kaynak.' });
    }
    return fetchJson(path).then(function (body) {
      return { ok: !!(body && body.ok), resource: resourceKey, data: body };
    }).catch(function (err) {
      return { ok: false, resource: resourceKey, error: err.message || 'Bağlantı başarısız.' };
    });
  }

  function probeAllEndpoints() {
    var keys = [
      'health', 'metrics', 'sessions', 'requests', 'reservations',
      'students', 'parents', 'teachers', 'auditLogs', 'communicationLogs'
    ];
    return Promise.all(keys.map(function (key) {
      if (key === 'health') return probeHealth();
      if (key === 'metrics') return probeMetrics();
      return probeResource(key);
    })).then(function (results) {
      var passed = results.filter(function (r) { return r.ok; }).length;
      return { ok: passed === results.length, passed: passed, total: results.length, results: results };
    });
  }

  global.TMApi = {
    getMode: getMode,
    setMode: setMode,
    isMock: function () { return getMode() === 'mock'; },
    endpoints: ENDPOINTS,
    data: data,
    invoke: invoke,
    fetchJson: fetchJson,
    checkHealth: checkHealth,
    probeHealth: probeHealth,
    probeResource: probeResource,
    probeAllEndpoints: probeAllEndpoints,
    fetchOperationMetrics: fetchOperationMetrics,
    probeMetrics: probeMetrics,
    getOperationMetrics: callStore('getOperationMetrics'),
    getMockStats: callStore('getMockStats'),
    getAuditLogs: callStore('getAuditLogs'),
    getSessions: callStore('getSessions'),
    getRequests: callStore('getRequests'),
    getReservations: callStore('getReservations'),
    getStudents: callStore('getStudents'),
    getParents: callStore('getParents'),
    getTeachers: callStore('getTeachers'),
    getUsers: callStore('getUsers'),
    getCurrentUser: callStore('getCurrentUser'),
    getDataConsistencySnapshot: callStore('getDataConsistencySnapshot'),
    createSimulatedRequest: callStore('createSimulatedRequest'),
    resetMockData: callStore('resetMockData'),
    exportMockSnapshot: callStore('exportMockSnapshot'),
    importMockSnapshot: callStore('importMockSnapshot'),
    switchCurrentUser: callStore('switchCurrentUser'),
    updateUserPermissions: callStore('updateUserPermissions'),
    markAllApprovedLinksSent: callStore('markAllApprovedLinksSent'),
    markBulkLinksSentForSession: callStore('markBulkLinksSentForSession'),
    moveReservationToSession: callStore('moveReservationToSession'),
    updateTeacherAvailability: callStore('updateTeacherAvailability'),
    updateTeacherOperationalNotes: callStore('updateTeacherOperationalNotes'),
    updateApplicationContactInfo: callStore('updateApplicationContactInfo'),
    updateApplicationStudentInfo: callStore('updateApplicationStudentInfo')
  };

  global.TMData = global.TMApi;

  global.TMBridge = {
    store: data,
    call: invoke,
    available: function () {
      return !!(global.TMApi || global.TMStore);
    }
  };
})(typeof window !== 'undefined' ? window : this);
