require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { sequelize } = require('./models');
const { globalLimiter } = require('./utils/rateLimit');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errors/errorHandler');
const logger = require('./utils/logger');
const { corsOptions, validateRuntimeConfig } = require('./config/runtime');

const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: '20kb' }));

app.use('/api', routes);

app.use((req, _res, next) =>
  next(
    new AppError(
      'RESOURCE_NOT_FOUND',
      'The requested route does not exist.',
      404,
    ),
  ),
);

app.use(errorHandler);

const startServer = async () => {
  try {
    validateRuntimeConfig();
    await sequelize.authenticate();
    logger.info('database_connected');

    return app.listen(port, () => {
      logger.info('server_started', { port: Number(port) });
    });
  } catch (error) {
    logger.error('server_start_failed', {
      name: error.name,
    });
    process.exitCode = 1;
    return null;
  }
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer,
};
