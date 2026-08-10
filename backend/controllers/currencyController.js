const currencyService = require('../services/currencyService');

exports.listCurrencies = async (_req, res, next) => {
  try {
    const currencies = await currencyService.listCurrencies();
    return res.status(200).json({ currencies });
  } catch (error) {
    return next(error);
  }
};
