export function errorHandler(error, _req, res, _next) {
  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Mã dữ liệu không hợp lệ',
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [
        field,
        detail.message || 'Giá trị không hợp lệ',
      ]),
    );

    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Dữ liệu đã tồn tại',
      errors: error.keyValue,
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || 'Lỗi máy chủ',
    errors: error.errors,
  });
}
