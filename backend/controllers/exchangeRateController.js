const exchangeRateService = require('../services/exchangeRateService');

exports.createQuote = async (req, res, next) => {
  try {
    const quote = await exchangeRateService.createExchangeRateQuote({
      userId: req.user.id,
      targetCurrencyCodes: req.body.targetCurrencyCodes,
    });

    return res.status(200).json({ quote });
  } catch (error) {
    return next(error);
  }
};
