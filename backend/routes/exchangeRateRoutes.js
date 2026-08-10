const express = require('express');
const exchangeRateController = require('../controllers/exchangeRateController');
const authToken = require('../middlewares/auth/authToken');
const {
  validateExchangeRateQuoteFields,
} = require('../middlewares/fields/validateExchangeRateQuoteFields');
const { quoteLimiter } = require('../utils/rateLimit');

const router = express.Router();

router.post(
  '/quote',
  authToken,
  quoteLimiter,
  validateExchangeRateQuoteFields,
  exchangeRateController.createQuote,
);

module.exports = router;
