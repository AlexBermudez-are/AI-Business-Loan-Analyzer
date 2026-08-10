const { z } = require('zod');
const AppError = require('../../utils/AppError');

const exchangeRateQuoteRequestSchema = z
  .object({
    targetCurrencyCodes: z
      .array(
        z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-Z]{3}$/),
      )
      .min(1)
      .max(5),
  })
  .strict()
  .superRefine(({ targetCurrencyCodes }, context) => {
    if (targetCurrencyCodes.includes('USD')) {
      context.addIssue({
        code: 'custom',
        path: ['targetCurrencyCodes'],
        message: 'USD is already the base currency.',
      });
    }

    if (new Set(targetCurrencyCodes).size !== targetCurrencyCodes.length) {
      context.addIssue({
        code: 'custom',
        path: ['targetCurrencyCodes'],
        message: 'Currency codes must be unique.',
      });
    }
  });

exports.validateExchangeRateQuoteFields = (req, _res, next) => {
  const result = exchangeRateQuoteRequestSchema.safeParse(req.body);
  if (!result.success) {
    return next(
      new AppError('VALIDATION_ERROR', 'The request payload is invalid.', 400, {
        fields: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'body',
          message: issue.message,
        })),
      }),
    );
  }

  req.body = result.data;
  return next();
};
