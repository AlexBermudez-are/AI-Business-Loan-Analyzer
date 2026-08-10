const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.use('/auth', require('./authRoutes'));
router.use('/currencies', require('./currencyRoutes'));
router.use('/exchange-rates', require('./exchangeRateRoutes'));
router.use('/loan-applications', require('./loanApplicationRoutes'));

module.exports = router;
