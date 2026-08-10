'use strict';

require('dotenv').config();
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Sequelize } = require('sequelize');
const databaseConfig = require('../config/config');

const projectRoot = path.resolve(__dirname, '..');
const cliPath = require.resolve('sequelize-cli/lib/sequelize');
const environment = process.env.NODE_ENV || 'development';

const runCli = (...args) => {
  const result = spawnSync(
    process.execPath,
    [cliPath, ...args, '--env', environment],
    {
      cwd: projectRoot,
      stdio: 'inherit',
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};

const clearSeederMetadata = async () => {
  const selectedConfig =
    databaseConfig[environment] || databaseConfig.development;
  const { url, ...options } = selectedConfig;
  const sequelize = new Sequelize(url, options);

  try {
    const tables = await sequelize.getQueryInterface().showAllTables();
    const tableNames = tables.map((table) =>
      typeof table === 'string' ? table : table.tableName,
    );

    if (tableNames.includes('SequelizeData')) {
      await sequelize.getQueryInterface().bulkDelete('SequelizeData', null, {});
    }
  } finally {
    await sequelize.close();
  }
};

const resetDatabase = async () => {
  runCli('db:migrate:undo:all');
  await clearSeederMetadata();
  runCli('db:migrate');
  runCli('db:seed:all');
};

resetDatabase().catch((error) => {
  process.stderr.write(`Database reset failed: ${error.name}\n`);
  process.exitCode = 1;
});
