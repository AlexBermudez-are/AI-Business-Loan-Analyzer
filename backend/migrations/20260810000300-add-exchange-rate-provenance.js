'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const [name, definition] of [
        ['sourceName', { type: Sequelize.STRING(160), allowNull: true }],
        ['sourceUrl', { type: Sequelize.TEXT, allowNull: true }],
        ['provider', { type: Sequelize.STRING(30), allowNull: true }],
        ['model', { type: Sequelize.STRING(120), allowNull: true }],
        ['retrievedAt', { type: Sequelize.DATE, allowNull: true }],
      ]) {
        await queryInterface.addColumn(
          'LoanApplicationExchangeRates',
          name,
          definition,
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        `
          UPDATE "LoanApplicationExchangeRates"
          SET
            "sourceName" = 'Cotización histórica declarada por el usuario',
            "provider" = 'legacy',
            "model" = 'manual',
            "retrievedAt" = "createdAt"
        `,
        { transaction },
      );

      for (const [name, definition] of [
        ['sourceName', { type: Sequelize.STRING(160), allowNull: false }],
        ['provider', { type: Sequelize.STRING(30), allowNull: false }],
        ['model', { type: Sequelize.STRING(120), allowNull: false }],
        ['retrievedAt', { type: Sequelize.DATE, allowNull: false }],
      ]) {
        await queryInterface.changeColumn(
          'LoanApplicationExchangeRates',
          name,
          definition,
          { transaction },
        );
      }

      await queryInterface.addConstraint('LoanApplicationExchangeRates', {
        fields: ['fromCurrencyCode'],
        type: 'check',
        where: { fromCurrencyCode: 'USD' },
        name: 'application_exchange_rates_usd_base',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'LoanApplicationExchangeRates',
        'application_exchange_rates_usd_base',
        { transaction },
      );

      for (const name of [
        'retrievedAt',
        'model',
        'provider',
        'sourceUrl',
        'sourceName',
      ]) {
        await queryInterface.removeColumn(
          'LoanApplicationExchangeRates',
          name,
          {
            transaction,
          },
        );
      }
    });
  },
};
