const express = require('express');
const currencyController = require('../controllers/currencyController');
const authToken = require('../middlewares/auth/authToken');

const router = express.Router();

router.get('/', authToken, currencyController.listCurrencies);

module.exports = router;
