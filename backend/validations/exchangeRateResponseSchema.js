const { z } = require('zod');
const AppError = require('../utils/AppError');

const MAX_EXCHANGE_RATE = 1_000_000_000_000;

const httpsUrl = z
  .url()
  .max(2048)
  .refine(
    (value) => new URL(value).protocol === 'https:' && !/[\s【】]/.test(value),
    { message: 'The exchange-rate source must use HTTPS.' },
  );

const exchangeRateQuoteSchema = z
  .object({
    toCurrencyCode: z.string().regex(/^[A-Z]{3}$/),
    rate: z.number().finite().positive().max(MAX_EXCHANGE_RATE),
    quotedAt: z.iso.date(),
    sourceName: z.string().trim().min(2).max(160),
    sourceUrl: httpsUrl,
  })
  .strict();

const exchangeRateSearchResponseSchema = z
  .object({
    quotes: z.array(exchangeRateQuoteSchema).min(1).max(5),
  })
  .strict();

const exchangeRateSearchJsonSchema = Object.freeze({
  type: 'object',
  properties: {
    quotes: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: {
        type: 'object',
        properties: {
          toCurrencyCode: { type: 'string', pattern: '^[A-Z]{3}$' },
          rate: { type: 'number', exclusiveMinimum: 0 },
          quotedAt: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          sourceName: { type: 'string' },
          sourceUrl: { type: 'string', pattern: '^https://.+' },
        },
        required: [
          'toCurrencyCode',
          'rate',
          'quotedAt',
          'sourceName',
          'sourceUrl',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['quotes'],
  additionalProperties: false,
});

const parseExchangeRateSearchResponse = (content, targetCurrencyCodes) => {
  let parsedContent;

  try {
    parsedContent = JSON.parse(content);
  } catch (_error) {
    throw new AppError(
      'AI_INVALID_RESPONSE',
      'The AI provider returned invalid exchange-rate data.',
      502,
    );
  }

  const result = exchangeRateSearchResponseSchema.safeParse(parsedContent);
  if (!result.success) {
    throw new AppError(
      'AI_INVALID_RESPONSE',
      'The AI provider returned incompatible exchange-rate data.',
      502,
    );
  }

  const expected = [...new Set(targetCurrencyCodes)].sort();
  const received = result.data.quotes
    .map(({ toCurrencyCode }) => toCurrencyCode)
    .sort();

  if (
    expected.length !== received.length ||
    expected.some((code, index) => code !== received[index])
  ) {
    throw new AppError(
      'AI_INVALID_RESPONSE',
      'The AI provider did not return the requested exchange-rate pairs.',
      502,
    );
  }

  return result.data.quotes;
};

module.exports = {
  exchangeRateSearchJsonSchema,
  exchangeRateSearchResponseSchema,
  parseExchangeRateSearchResponse,
};
