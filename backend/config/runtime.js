const AppError = require('../utils/AppError');

const defaultDevelopmentOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
];

const allowedOrigins = (
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : defaultDevelopmentOrigins
)
  .map((origin) => origin.trim())
  .filter(Boolean);

const validateRuntimeConfig = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must contain explicit trusted origins.');
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        'CORS_ORIGIN_DENIED',
        'The request origin is not allowed.',
        403,
      ),
    );
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 600,
};

module.exports = { allowedOrigins, corsOptions, validateRuntimeConfig };
