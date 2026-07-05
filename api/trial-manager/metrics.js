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
    stub: true,
    timestamp: new Date().toISOString(),
    metrics: emptyMetrics(),
    note: 'Sözleşme uç noktası aktif; gerçek veri TMStore/Supabase bağlantısı sonrası dönecek.'
  }));
}
