require('dotenv').config();
const { Sequelize } = require('sequelize');
const databaseConfig = require('../config/config');

const environment = process.env.NODE_ENV || 'development';
const selectedConfig =
  databaseConfig[environment] || databaseConfig.development;
const { url, ...sequelizeOptions } = selectedConfig;
const sequelize = new Sequelize(url, sequelizeOptions);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize);
db.Business = require('./business')(sequelize);
db.Currency = require('./currency')(sequelize);
db.ExchangeRateQuote = require('./exchangeRateQuote')(sequelize);
db.LoanApplication = require('./loanApplication')(sequelize);
db.LoanApplicationExchangeRate = require('./loanApplicationExchangeRate')(
  sequelize,
);
db.LoanAnalysis = require('./loanAnalysis')(sequelize);
db.AnalysisHistory = require('./analysisHistory')(sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName]?.associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
