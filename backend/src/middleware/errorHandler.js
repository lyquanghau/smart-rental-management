export function errorHandler(error, _req, res, _next) {
  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid resource id',
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.fromEntries(
      Object.entries(error.errors).map(([field, detail]) => [
        field,
        detail.message,
      ]),
    );

    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value',
      errors: error.keyValue,
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    errors: error.errors,
  });
}
