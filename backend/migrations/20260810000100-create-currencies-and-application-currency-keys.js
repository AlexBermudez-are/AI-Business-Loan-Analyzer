'use strict';

const currencies = require('../data/currencies');

const currencyFields = [
  ['monthlyRevenueCurrencyCode', 'loan_applications_revenue_currency_idx'],
  ['monthlyExpensesCurrencyCode', 'loan_applications_expenses_currency_idx'],
  ['existingDebtCurrencyCode', 'loan_applications_debt_currency_idx'],
  ['requestedAmountCurrencyCode', 'loan_applications_requested_currency_idx'],
];

const moneyFields = [
  'monthlyRevenue',
  'monthlyExpenses',
  'existingDebt',
  'requestedAmount',
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'Currencies',
        {
          code: {
            type: Sequelize.STRING(3),
            allowNull: false,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING(120),
            allowNull: false,
          },
          minorUnit: {
            type: Sequelize.SMALLINT,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.bulkInsert('Currencies', currencies, {
        transaction,
      });

      for (const field of moneyFields) {
        await queryInterface.changeColumn(
          'LoanApplications',
          field,
          {
            type: Sequelize.DECIMAL(19, 4),
            allowNull: false,
          },
          { transaction },
        );
      }

      for (const [field, indexName] of currencyFields) {
        await queryInterface.addColumn(
          'LoanApplications',
          field,
          {
            type: Sequelize.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
            references: {
              model: 'Currencies',
              key: 'code',
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          { transaction },
        );

        await queryInterface.addIndex('LoanApplications', [field], {
          name: indexName,
          transaction,
        });

        await queryInterface.sequelize.query(
          `ALTER TABLE "LoanApplications" ALTER COLUMN "${field}" DROP DEFAULT`,
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const [field, indexName] of [...currencyFields].reverse()) {
        await queryInterface.removeIndex('LoanApplications', indexName, {
          transaction,
        });
        await queryInterface.removeColumn('LoanApplications', field, {
          transaction,
        });
      }

      for (const field of moneyFields) {
        await queryInterface.changeColumn(
          'LoanApplications',
          field,
          {
            type: Sequelize.DECIMAL(15, 2),
            allowNull: false,
          },
          { transaction },
        );
      }

      await queryInterface.dropTable('Currencies', { transaction });
    });
  },
};
