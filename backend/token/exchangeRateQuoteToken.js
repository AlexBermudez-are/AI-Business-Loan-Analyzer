const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const issuer = 'ai-business-loan-analyzer';
const audience = 'exchange-rate-quote';

const generateExchangeRateQuoteToken = ({
  userId,
  quotes,
  provider,
  model,
  retrievedAt,
}) =>
  jwt.sign(
    {
      type: 'exchange-rate-quote',
      quotes,
      provider,
      model,
      retrievedAt,
    },
    process.env.JWT_SECRET,
    {
      subject: userId,
      issuer,
      audience,
      algorithm: 'HS256',
      expiresIn: '1h',
    },
  );

const verifyExchangeRateQuoteToken = ({ token, userId }) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer,
      audience,
      subject: userId,
    });

    if (decoded.type !== 'exchange-rate-quote') throw new Error();
    return decoded;
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    throw new AppError(
      isExpired ? 'EXCHANGE_RATE_QUOTE_EXPIRED' : 'VALIDATION_ERROR',
      isExpired
        ? 'La cotización venció. Actualízala antes de continuar.'
        : 'La cotización no es válida para este usuario.',
      400,
    );
  }
};

module.exports = {
  generateExchangeRateQuoteToken,
  verifyExchangeRateQuoteToken,
};
