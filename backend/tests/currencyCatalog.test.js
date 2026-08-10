const test = require('node:test');
const assert = require('node:assert/strict');
const currencies = require('../data/currencies');

test('builds a unique ISO 4217 currency catalog with common currencies', () => {
  const codes = currencies.map(({ code }) => code);

  assert.ok(currencies.length > 150);
  assert.equal(new Set(codes).size, currencies.length);
  assert.ok(codes.includes('ARS'));
  assert.ok(codes.includes('EUR'));
  assert.ok(codes.includes('USD'));
  assert.ok(currencies.every(({ code }) => /^[A-Z]{3}$/.test(code)));
});
