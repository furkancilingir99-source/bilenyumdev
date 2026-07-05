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
      auditLogs: '/api/trial-manager/audit-logs'
    },
    note: 'Veri uçları henüz mock TMStore ile eşlenmedi; health kontrolü aktif.'
  }));
}
