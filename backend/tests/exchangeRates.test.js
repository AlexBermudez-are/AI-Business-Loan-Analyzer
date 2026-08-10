const test = require('node:test');
const assert = require('node:assert/strict');
const { getRequiredExchangeRateTargets } = require('../utils/exchangeRates');
const {
  generateExchangeRateQuoteToken,
  verifyExchangeRateQuoteToken,
} = require('../token/exchangeRateQuoteToken');
const {
  parseExchangeRateSearchResponse,
} = require('../validations/exchangeRateResponseSchema');

process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-only-secret-with-at-least-32-characters';

const quotes = [
  {
    fromCurrencyCode: 'USD',
    toCurrencyCode: 'ARS',
    rate: 1350,
    quotedAt: '2026-08-10',
    sourceName: 'Fuente financiera',
    sourceUrl: 'https://example.com/usd-ars',
    provider: 'groq',
    model: 'groq/compound-mini',
    retrievedAt: '2026-08-10T12:00:00.000Z',
  },
];

test('derives unique non-USD targets from all financial fields', () => {
  assert.deepEqual(
    getRequiredExchangeRateTargets({
      monthlyRevenueCurrencyCode: 'USD',
      monthlyExpensesCurrencyCode: 'ARS',
      existingDebtCurrencyCode: 'USD',
      monthlyDebtPaymentCurrencyCode: 'USD',
      requestedAmountCurrencyCode: 'EUR',
    }),
    ['ARS', 'EUR'],
  );
});

test('validates the exact requested exchange-rate response', () => {
  const parsed = parseExchangeRateSearchResponse(
    JSON.stringify({
      quotes: quotes.map(
        ({ toCurrencyCode, rate, quotedAt, sourceName, sourceUrl }) => ({
          toCurrencyCode,
          rate,
          quotedAt,
          sourceName,
          sourceUrl,
        }),
      ),
    }),
    ['ARS'],
  );

  assert.equal(parsed[0].rate, 1350);
  assert.throws(
    () =>
      parseExchangeRateSearchResponse(JSON.stringify({ quotes: [] }), ['ARS']),
    (error) => error.code === 'AI_INVALID_RESPONSE',
  );
});

test('binds signed exchange quotes to the authenticated user', () => {
  const token = generateExchangeRateQuoteToken({
    userId: '00000000-0000-4000-8000-000000000001',
    quotes,
    provider: 'groq',
    model: 'groq/compound-mini',
    retrievedAt: '2026-08-10T12:00:00.000Z',
  });
  const decoded = verifyExchangeRateQuoteToken({
    token,
    userId: '00000000-0000-4000-8000-000000000001',
  });

  assert.deepEqual(decoded.quotes, quotes);
  assert.throws(
    () =>
      verifyExchangeRateQuoteToken({
        token,
        userId: '00000000-0000-4000-8000-000000000002',
      }),
    (error) => error.code === 'VALIDATION_ERROR',
  );
});
