const test = require('node:test');
const assert = require('node:assert/strict');
const calculateFinancialMetrics = require('../utils/calculateFinancialMetrics');

test('calculates deterministic financial metrics in one currency', () => {
  const metrics = calculateFinancialMetrics({
    monthlyRevenue: 75000,
    monthlyExpenses: 52000,
    existingDebt: 30000,
    monthlyDebtPayment: 2500,
    requestedAmount: 120000,
  });

  assert.deepEqual(metrics, {
    valuationCurrencyCode: 'USD',
    exchangeRates: [],
    normalizedAmounts: {
      monthlyRevenue: 75000,
      monthlyExpenses: 52000,
      existingDebt: 30000,
      monthlyDebtPayment: 2500,
      requestedAmount: 120000,
    },
    netMonthlyCashFlow: 23000,
    netMonthlyCashFlowCurrencyCode: 'USD',
    expenseRatio: 0.6933,
    requestedAmountToMonthlyRevenue: 1.6,
    existingDebtToMonthlyRevenue: 0.4,
    monthlyDebtPaymentToMonthlyRevenue: 0.0333,
  });
});

test('normalizes every amount to USD with USD as the quote base', () => {
  const metrics = calculateFinancialMetrics({
    monthlyRevenue: 85000000,
    monthlyRevenueCurrencyCode: 'ARS',
    monthlyExpenses: 57000000,
    monthlyExpensesCurrencyCode: 'ARS',
    existingDebt: 22000,
    existingDebtCurrencyCode: 'USD',
    monthlyDebtPayment: 2000,
    monthlyDebtPaymentCurrencyCode: 'USD',
    requestedAmount: 110000,
    requestedAmountCurrencyCode: 'USD',
    exchangeRates: [
      {
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'ARS',
        rate: 1350,
        quotedAt: '2026-08-10',
      },
    ],
  });

  assert.deepEqual(metrics, {
    valuationCurrencyCode: 'USD',
    exchangeRates: [
      {
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'ARS',
        rate: 1350,
        quotedAt: '2026-08-10',
      },
    ],
    normalizedAmounts: {
      monthlyRevenue: 62962.963,
      monthlyExpenses: 42222.2222,
      existingDebt: 22000,
      monthlyDebtPayment: 2000,
      requestedAmount: 110000,
    },
    netMonthlyCashFlow: 20740.74,
    netMonthlyCashFlowCurrencyCode: 'USD',
    expenseRatio: 0.6706,
    requestedAmountToMonthlyRevenue: 1.7471,
    existingDebtToMonthlyRevenue: 0.3494,
    monthlyDebtPaymentToMonthlyRevenue: 0.0318,
  });
});

test('requests one USD-base quote for each non-USD currency', () => {
  const metrics = calculateFinancialMetrics({
    monthlyRevenue: 100000,
    monthlyRevenueCurrencyCode: 'USD',
    monthlyExpenses: 57000000,
    monthlyExpensesCurrencyCode: 'ARS',
    existingDebt: 22000,
    existingDebtCurrencyCode: 'USD',
    monthlyDebtPayment: 2000,
    monthlyDebtPaymentCurrencyCode: 'USD',
    requestedAmount: 110000,
    requestedAmountCurrencyCode: 'EUR',
    exchangeRates: [
      {
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'ARS',
        rate: 1350,
        quotedAt: '2026-08-10',
      },
      {
        fromCurrencyCode: 'USD',
        toCurrencyCode: 'EUR',
        rate: 0.86,
        quotedAt: '2026-08-10',
      },
    ],
  });

  assert.deepEqual(metrics.normalizedAmounts, {
    monthlyRevenue: 100000,
    monthlyExpenses: 42222.2222,
    existingDebt: 22000,
    monthlyDebtPayment: 2000,
    requestedAmount: 127906.9767,
  });
  assert.equal(metrics.netMonthlyCashFlow, 57777.78);
  assert.equal(metrics.expenseRatio, 0.4222);
  assert.equal(metrics.requestedAmountToMonthlyRevenue, 1.2791);
});

test('rejects a cross-currency request without its exchange quote', () => {
  assert.throws(
    () =>
      calculateFinancialMetrics({
        monthlyRevenue: 85000000,
        monthlyRevenueCurrencyCode: 'ARS',
        monthlyExpenses: 57000000,
        monthlyExpensesCurrencyCode: 'ARS',
        existingDebt: 22000,
        existingDebtCurrencyCode: 'USD',
        monthlyDebtPayment: 2000,
        monthlyDebtPaymentCurrencyCode: 'USD',
        requestedAmount: 110000,
        requestedAmountCurrencyCode: 'USD',
      }),
    (error) => error.code === 'VALIDATION_ERROR' && error.statusCode === 400,
  );
});

test('rejects a zero denominator', () => {
  assert.throws(
    () =>
      calculateFinancialMetrics({
        monthlyRevenue: 0,
        monthlyExpenses: 10,
        existingDebt: 0,
        requestedAmount: 10,
      }),
    (error) => error.code === 'VALIDATION_ERROR' && error.statusCode === 400,
  );
});
