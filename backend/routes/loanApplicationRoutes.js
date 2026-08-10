const express = require('express');
const loanApplicationController = require('../controllers/loanApplicationController');
const authToken = require('../middlewares/auth/authToken');
const {
  validateLoanApplicationFields,
  validateLoanApplicationId,
} = require('../middlewares/fields/validateLoanApplicationFields');
const {
  validateLoanHistoryQuery,
} = require('../middlewares/fields/validateLoanHistoryQuery');

const router = express.Router();
const { analysisLimiter } = require('../utils/rateLimit');

router.post(
  '/analyze',
  authToken,
  analysisLimiter,
  validateLoanApplicationFields,
  loanApplicationController.analyzeLoanApplication,
);

router.get(
  '/latest',
  authToken,
  loanApplicationController.getLatestLoanApplication,
);

router.get(
  '/history',
  authToken,
  validateLoanHistoryQuery,
  loanApplicationController.getLoanAnalysisHistory,
);

router.get(
  '/:id',
  authToken,
  validateLoanApplicationId,
  loanApplicationController.getLoanApplicationById,
);

module.exports = router;
