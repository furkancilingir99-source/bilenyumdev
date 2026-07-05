import { sendListStub } from '../trial-manager/lib/stub.mjs';

function emptyMetrics() {
  return {
    todaySessionCount: 0,
    todayStudentCount: 0,
    pendingApprovalCount: 0,
    linkNotSentCount: 0,
    teacherNotInformedCount: 0,
    cancelledCount: 0,
    needsAttendanceCount: 0,
    conversionCount: 0,
    orphanRequestCount: 0,
    newRequestCount: 0,
    actionableCount: 0,
    todaySessions: [],
    pendingApproval: [],
    linkNotSent: [],
    teacherNotInformed: [],
    needsAttendance: [],
    orphanRequests: [],
    newRequests: []
  };
}

function sendHealth(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    service: 'trial-manager',
    version: 1,
    mode: 'api',
    timestamp: new Date().toISOString(),
    endpoints: {
      metrics: '/api/trial-manager/metrics',
      sessions: '/api/trial-manager/sessions',
      requests: '/api/trial-manager/requests',
      reservations: '/api/trial-manager/reservations',
      students: '/api/trial-manager/students',
      parents: '/api/trial-manager/parents',
      teachers: '/api/trial-manager/teachers',
      auditLogs: '/api/trial-manager/audit-logs',
      communicationLogs: '/api/trial-manager/communication-logs'
    },
    note: 'Liste uçları sözleşme stub; veri işlemleri mock TMStore ile devam eder.'
  }));
}

function sendMetrics(res, req) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Yalnızca GET desteklenir.' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({
    ok: true,
    service: 'trial-manager',
    version: 1,
    stub: true,
    timestamp: new Date().toISOString(),
    metrics: emptyMetrics(),
    note: 'Sözleşme uç noktası aktif; gerçek veri TMStore/Supabase bağlantısı sonrası dönecek.'
  }));
}

var LIST_ROUTES = {
  sessions: ['sessions', 'sessions'],
  requests: ['requests', 'requests'],
  reservations: ['reservations', 'reservations'],
  students: ['students', 'students'],
  parents: ['parents', 'parents'],
  teachers: ['teachers', 'teachers'],
  'audit-logs': ['audit-logs', 'auditLogs'],
  'communication-logs': ['communication-logs', 'communicationLogs']
};

export function handleTrialManagerRoute(res, req, resource) {
  if (resource === 'health') {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Yalnızca GET desteklenir.' }));
      return true;
    }
    sendHealth(res);
    return true;
  }

  if (resource === 'metrics') {
    sendMetrics(res, req);
    return true;
  }

  var route = LIST_ROUTES[resource];
  if (route) {
    sendListStub(res, req, route[0], route[1]);
    return true;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false, error: 'Bilinmeyen trial-manager uç noktası: ' + resource }));
  return true;
}
