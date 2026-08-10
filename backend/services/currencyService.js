const { Currency } = require('../models');

const listCurrencies = () =>
  Currency.findAll({
    attributes: ['code', 'name', 'minorUnit'],
    order: [['code', 'ASC']],
  });

module.exports = { listCurrencies };
