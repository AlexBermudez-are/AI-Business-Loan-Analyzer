const jwt = require('jsonwebtoken');
const AppError = require('../../utils/AppError');

module.exports = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(
        'AUTHENTICATION_ERROR',
        'A valid bearer token is required.',
        401,
      ),
    );
  }

  const token = authHeader.slice('Bearer '.length).trim();

  if (!token || !process.env.JWT_SECRET) {
    return next(
      new AppError(
        'AUTHENTICATION_ERROR',
        'A valid bearer token is required.',
        401,
      ),
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'ai-business-loan-analyzer',
      algorithms: ['HS256'],
    });

    if (typeof decoded !== 'object') throw new Error('Invalid JWT payload.');
    const id = decoded.sub || decoded.id;
    if (!id || !decoded.email) {
      throw new Error('Required JWT claims are missing.');
    }

    req.user = {
      id,
      email: decoded.email,
    };

    return next();
  } catch (_error) {
    return next(
      new AppError(
        'AUTHENTICATION_ERROR',
        'The token is invalid or expired.',
        401,
      ),
    );
  }
};
