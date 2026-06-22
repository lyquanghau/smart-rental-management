export function getHealth(_req, res) {
  res.json({
    status: 'ok',
    service: 'smart-rental-api',
    timestamp: new Date().toISOString(),
  });
}
