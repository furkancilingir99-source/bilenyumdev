export default async function handler(req, res) {
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
