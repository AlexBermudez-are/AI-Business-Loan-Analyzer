const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const generateAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new AppError(
      'INTERNAL_SERVER_ERROR',
      'Authentication is not configured.',
      500,
    );
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      subject: user.id,
      issuer: 'ai-business-loan-analyzer',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },
  );
};

module.exports = generateAccessToken;
