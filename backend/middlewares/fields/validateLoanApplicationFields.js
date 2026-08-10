const { z } = require('zod');
const AppError = require('../../utils/AppError');

const MAX_MONEY_VALUE = 1_000_000_000_000;

const nonNegativeMoney = z.number().finite().min(0).max(MAX_MONEY_VALUE);

const positiveMoney = z.number().finite().positive().max(MAX_MONEY_VALUE);

const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);

const loanApplicationSchema = z
  .object({
    business: z
      .object({
        name: z.string().trim().min(2).max(120),
        industry: z.string().trim().min(2).max(80),
        yearsInBusiness: z.number().int().min(0).max(200),
      })
      .strict(),
    financialData: z
      .object({
        monthlyRevenue: positiveMoney,
        monthlyRevenueCurrencyCode: currencyCode,
        monthlyExpenses: nonNegativeMoney,
        monthlyExpensesCurrencyCode: currencyCode,
        existingDebt: nonNegativeMoney,
        existingDebtCurrencyCode: currencyCode,
        monthlyDebtPayment: nonNegativeMoney,
        monthlyDebtPaymentCurrencyCode: currencyCode,
        requestedAmount: positiveMoney,
        requestedAmountCurrencyCode: currencyCode,
        loanPurpose: z.string().trim().min(3).max(500),
        exchangeRateQuoteToken: z.string().min(1).max(10000).optional(),
      })
      .strict()
      .superRefine((financialData, context) => {
        const requiresQuote = [
          financialData.monthlyRevenueCurrencyCode,
          financialData.monthlyExpensesCurrencyCode,
          financialData.existingDebtCurrencyCode,
          financialData.monthlyDebtPaymentCurrencyCode,
          financialData.requestedAmountCurrencyCode,
        ].some((code) => code !== 'USD');

        if (requiresQuote && !financialData.exchangeRateQuoteToken) {
          context.addIssue({
            code: 'custom',
            path: ['exchangeRateQuoteToken'],
            message: 'A server-issued USD exchange quote is required.',
          });
        }
      }),
  })
  .strict();

const loanApplicationIdSchema = z.string().uuid();

const validationError = (issues) =>
  new AppError('VALIDATION_ERROR', 'The request payload is invalid.', 400, {
    fields: issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    })),
  });

exports.validateLoanApplicationFields = (req, _res, next) => {
  const result = loanApplicationSchema.safeParse(req.body);

  if (!result.success) {
    return next(validationError(result.error.issues));
  }

  req.body = result.data;
  return next();
};

exports.validateLoanApplicationId = (req, _res, next) => {
  const result = loanApplicationIdSchema.safeParse(req.params.id);

  if (!result.success) {
    return next(
      new AppError(
        'VALIDATION_ERROR',
        'The loan application id is invalid.',
        400,
      ),
    );
  }

  return next();
};
