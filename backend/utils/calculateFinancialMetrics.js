const AppError = require('./AppError');

const round = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const safeDivide = (numerator, denominator) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Financial values must be finite numbers.',
      400,
    );
  }

  if (denominator === 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Financial ratios cannot be calculated with a zero denominator.',
      400,
    );
  }

  return numerator / denominator;
};

const calculateFinancialMetrics = ({
  monthlyRevenue,
  monthlyRevenueCurrencyCode = 'USD',
  monthlyExpenses,
  monthlyExpensesCurrencyCode = 'USD',
  existingDebt,
  existingDebtCurrencyCode = 'USD',
  monthlyDebtPayment = 0,
  monthlyDebtPaymentCurrencyCode = 'USD',
  requestedAmount,
  requestedAmountCurrencyCode = 'USD',
  exchangeRates = [],
}) => {
  const valuationCurrencyCode = 'USD';
  const ratesByTarget = new Map(
    exchangeRates.map((exchangeRate) => [
      exchangeRate.toCurrencyCode,
      exchangeRate,
    ]),
  );

  const normalize = (amount, currencyCode) => {
    if (currencyCode === valuationCurrencyCode) return amount;

    const exchangeRate = ratesByTarget.get(currencyCode);
    if (
      !exchangeRate ||
      exchangeRate.fromCurrencyCode !== valuationCurrencyCode ||
      !Number.isFinite(exchangeRate.rate) ||
      exchangeRate.rate <= 0
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        `A valid ${valuationCurrencyCode}/${currencyCode} exchange quote is required.`,
        400,
      );
    }

    return amount / exchangeRate.rate;
  };

  const normalizedMonthlyRevenue = normalize(
    monthlyRevenue,
    monthlyRevenueCurrencyCode,
  );

  const normalizedMonthlyExpenses = normalize(
    monthlyExpenses,
    monthlyExpensesCurrencyCode,
  );
  const normalizedExistingDebt = normalize(
    existingDebt,
    existingDebtCurrencyCode,
  );
  const normalizedMonthlyDebtPayment = normalize(
    monthlyDebtPayment,
    monthlyDebtPaymentCurrencyCode,
  );
  const normalizedRequestedAmount = normalize(
    requestedAmount,
    requestedAmountCurrencyCode,
  );

  return {
    valuationCurrencyCode,
    exchangeRates: exchangeRates.map((exchangeRate) => ({
      fromCurrencyCode: exchangeRate.fromCurrencyCode,
      toCurrencyCode: exchangeRate.toCurrencyCode,
      rate: exchangeRate.rate,
      quotedAt: exchangeRate.quotedAt,
    })),
    normalizedAmounts: {
      monthlyRevenue: round(normalizedMonthlyRevenue, 4),
      monthlyExpenses: round(normalizedMonthlyExpenses, 4),
      existingDebt: round(normalizedExistingDebt, 4),
      monthlyDebtPayment: round(normalizedMonthlyDebtPayment, 4),
      requestedAmount: round(normalizedRequestedAmount, 4),
    },
    netMonthlyCashFlow: round(
      normalizedMonthlyRevenue - normalizedMonthlyExpenses,
      2,
    ),
    netMonthlyCashFlowCurrencyCode: valuationCurrencyCode,
    expenseRatio: round(
      safeDivide(normalizedMonthlyExpenses, normalizedMonthlyRevenue),
      4,
    ),
    requestedAmountToMonthlyRevenue: round(
      safeDivide(normalizedRequestedAmount, normalizedMonthlyRevenue),
      4,
    ),
    existingDebtToMonthlyRevenue: round(
      safeDivide(normalizedExistingDebt, normalizedMonthlyRevenue),
      4,
    ),
    monthlyDebtPaymentToMonthlyRevenue: round(
      safeDivide(normalizedMonthlyDebtPayment, normalizedMonthlyRevenue),
      4,
    ),
  };
};

module.exports = calculateFinancialMetrics;
