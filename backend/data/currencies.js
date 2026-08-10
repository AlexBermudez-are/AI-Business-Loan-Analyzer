'use strict';

const displayNames = new Intl.DisplayNames(['es'], {
  type: 'currency',
  fallback: 'code',
});

const currencies = Intl.supportedValuesOf('currency').map((code) => ({
  code,
  name: displayNames.of(code) || code,
  minorUnit: new Intl.NumberFormat('en', {
    style: 'currency',
    currency: code,
  }).resolvedOptions().maximumFractionDigits,
}));

module.exports = Object.freeze(currencies);
