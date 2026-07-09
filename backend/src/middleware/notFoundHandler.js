export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Không tìm thấy API: ${req.method} ${req.originalUrl}`,
  });
}
