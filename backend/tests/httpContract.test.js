process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgres://postgres:postgres@localhost:5432/ai_business_loan_analyzer_test';
process.env.JWT_SECRET = 'test-only-jwt-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { sequelize } = require('../models');

test.after(async () => {
  await sequelize.close();
});

const withServer = async (callback) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
};

const createTestToken = () =>
  jwt.sign({ email: 'security-test@example.com' }, process.env.JWT_SECRET, {
    subject: '00000000-0000-4000-8000-000000000001',
    issuer: 'ai-business-loan-analyzer',
    algorithm: 'HS256',
    expiresIn: '5m',
  });

test('returns the stable not-found error contract', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/missing-route`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.error.code, 'RESOURCE_NOT_FOUND');
  });
});

test('protects the analysis endpoint with bearer authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/loan-applications/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTHENTICATION_ERROR');
  });
});

test('protects the analysis history endpoint with bearer authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/loan-applications/history`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTHENTICATION_ERROR');
  });
});

test('protects the currency catalog with bearer authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/currencies`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTHENTICATION_ERROR');
  });
});

test('protects the exchange-rate search with bearer authentication', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/exchange-rates/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetCurrencyCodes: ['ARS'] }),
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'AUTHENTICATION_ERROR');
  });
});

test('rejects unknown login fields before accessing the database', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@businessloan.local',
        password: 'DemoPass123!',
        unexpected: true,
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});

test('rejects a weak registration password before accessing the database', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'weak',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});

test('maps malformed JSON to a validation error', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
    assert.equal(body.error.stack, undefined);
  });
});

test('rejects requests from origins outside the CORS allowlist', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: 'https://attacker.example' },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error.code, 'CORS_ORIGIN_DENIED');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });
});

test('rejects an SQL injection-shaped application id before querying', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/loan-applications/${encodeURIComponent("' OR 1=1 --")}`,
      { headers: { Authorization: `Bearer ${createTestToken()}` } },
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});

test('requires a server-issued quote token for cross-currency metrics', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/loan-applications/analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${createTestToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        business: {
          name: 'Security Test',
          industry: 'Services',
          yearsInBusiness: 2,
        },
        financialData: {
          monthlyRevenue: 100000,
          monthlyRevenueCurrencyCode: 'ARS',
          monthlyExpenses: 50000,
          monthlyExpensesCurrencyCode: 'ARS',
          existingDebt: 1000,
          existingDebtCurrencyCode: 'USD',
          monthlyDebtPayment: 100,
          monthlyDebtPaymentCurrencyCode: 'USD',
          requestedAmount: 5000,
          requestedAmountCurrencyCode: 'USD',
          loanPurpose: 'Working capital',
        },
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});
