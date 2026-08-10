const { sequelize } = require('../models');

exports.getHealth = async (_req, res, next) => {
  try {
    await sequelize.query('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      service: 'ai-business-loan-analyzer',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};
