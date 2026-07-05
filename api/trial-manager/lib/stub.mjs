export function sendListStub(res, req, resource, itemsKey) {
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
    resource: resource,
    [itemsKey]: [],
    count: 0,
    note: resource + ' sözleşme uç noktası aktif; gerçek veri TMStore/Supabase bağlantısı sonrası dolacak.'
  }));
}
