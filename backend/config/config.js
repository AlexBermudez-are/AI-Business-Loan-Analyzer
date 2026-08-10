require('dotenv').config();

const useSsl = process.env.DATABASE_SSL === 'true';

const createConfig = () => ({
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  seederStorage: 'sequelize',
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized:
            process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      }
    : {},
});

module.exports = {
  development: createConfig(),
  test: createConfig(),
  production: createConfig(),
};
