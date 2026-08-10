const USD_BASE_CURRENCY = 'USD';

const financialCurrencyFields = [
  'monthlyRevenueCurrencyCode',
  'monthlyExpensesCurrencyCode',
  'existingDebtCurrencyCode',
  'monthlyDebtPaymentCurrencyCode',
  'requestedAmountCurrencyCode',
];

const getRequiredExchangeRateTargets = (financialData) =>
  [
    ...new Set(
      financialCurrencyFields
        .map((field) => financialData[field])
        .filter((code) => code && code !== USD_BASE_CURRENCY),
    ),
  ].sort();

module.exports = {
  financialCurrencyFields,
  getRequiredExchangeRateTargets,
  USD_BASE_CURRENCY,
};
