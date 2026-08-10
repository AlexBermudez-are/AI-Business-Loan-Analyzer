const { BaseError: SequelizeError } = require('sequelize');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error.type === 'entity.too.large') {
    return new AppError(
      'VALIDATION_ERROR',
      'The request payload is too large.',
      413,
    );
  }

  if (error instanceof SyntaxError && error.status === 400 && error.body) {
    return new AppError(
      'VALIDATION_ERROR',
      'The request body contains invalid JSON.',
      400,
    );
  }

  if (error instanceof SequelizeError) {
    return new AppError('DATABASE_ERROR', 'A database operation failed.', 500);
  }

  return new AppError(
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred.',
    500,
  );
};

module.exports = (error, req, res, _next) => {
  const normalizedError = normalizeError(error);

  if (normalizedError.statusCode >= 500) {
    logger.error('request_failed', {
      method: req.method,
      path: req.path,
      code: normalizedError.code,
    });
  }

  const response = {
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
    },
  };

  if (normalizedError.details) {
    response.error.details = normalizedError.details;
  }

  return res.status(normalizedError.statusCode).json(response);
};
