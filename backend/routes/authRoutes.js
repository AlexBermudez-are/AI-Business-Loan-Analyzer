const express = require('express');
const authController = require('../controllers/authController');
const {
  validateLoginFields,
} = require('../middlewares/fields/validateLoginFields');
const {
  validateRegisterFields,
} = require('../middlewares/fields/validateRegisterFields');

const router = express.Router();
const { authLimiter } = require('../utils/rateLimit');

router.post(
  '/register',
  authLimiter,
  validateRegisterFields,
  authController.register,
);
router.post('/login', authLimiter, validateLoginFields, authController.login);

module.exports = router;
