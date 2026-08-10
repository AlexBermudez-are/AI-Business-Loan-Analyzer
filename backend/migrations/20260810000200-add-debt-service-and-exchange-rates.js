'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'LoanApplications',
        'monthlyDebtPayment',
        {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        'LoanApplications',
        'monthlyDebtPaymentCurrencyCode',
        {
          type: Sequelize.STRING(3),
          allowNull: true,
          references: { model: 'Currencies', key: 'code' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "LoanApplications"
          SET
            "monthlyDebtPayment" = 0,
            "monthlyDebtPaymentCurrencyCode" = "existingDebtCurrencyCode"
        `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'LoanApplications',
        'monthlyDebtPayment',
        {
          type: Sequelize.DECIMAL(19, 4),
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        'LoanApplications',
        'monthlyDebtPaymentCurrencyCode',
        {
          type: Sequelize.STRING(3),
          allowNull: false,
          references: { model: 'Currencies', key: 'code' },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'LoanApplications',
        ['monthlyDebtPaymentCurrencyCode'],
        {
          name: 'loan_applications_monthly_debt_currency_idx',
          transaction,
        },
      );

      await queryInterface.createTable(
        'LoanApplicationExchangeRates',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
            allowNull: false,
            primaryKey: true,
          },
          loanApplicationId: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: 'LoanApplications', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          fromCurrencyCode: {
            type: Sequelize.STRING(3),
            allowNull: false,
            references: { model: 'Currencies', key: 'code' },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          toCurrencyCode: {
            type: Sequelize.STRING(3),
            allowNull: false,
            references: { model: 'Currencies', key: 'code' },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE',
          },
          rate: {
            type: Sequelize.DECIMAL(24, 10),
            allowNull: false,
          },
          quotedAt: {
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('LoanApplicationExchangeRates', {
        fields: ['loanApplicationId', 'fromCurrencyCode', 'toCurrencyCode'],
        type: 'unique',
        name: 'application_exchange_rates_pair_unique',
        transaction,
      });
      await queryInterface.addConstraint('LoanApplicationExchangeRates', {
        fields: ['rate'],
        type: 'check',
        where: { rate: { [Sequelize.Op.gt]: 0 } },
        name: 'application_exchange_rates_rate_positive',
        transaction,
      });
      await queryInterface.addConstraint('LoanApplicationExchangeRates', {
        fields: ['fromCurrencyCode', 'toCurrencyCode'],
        type: 'check',
        where: {
          fromCurrencyCode: {
            [Sequelize.Op.ne]: Sequelize.col('toCurrencyCode'),
          },
        },
        name: 'application_exchange_rates_distinct_currencies',
        transaction,
      });

      for (const [fields, name] of [
        [['loanApplicationId'], 'application_exchange_rates_application_idx'],
        [['fromCurrencyCode'], 'application_exchange_rates_from_currency_idx'],
        [['toCurrencyCode'], 'application_exchange_rates_to_currency_idx'],
      ]) {
        await queryInterface.addIndex('LoanApplicationExchangeRates', fields, {
          name,
          transaction,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('LoanApplicationExchangeRates', {
        transaction,
      });
      await queryInterface.removeIndex(
        'LoanApplications',
        'loan_applications_monthly_debt_currency_idx',
        { transaction },
      );
      await queryInterface.removeColumn(
        'LoanApplications',
        'monthlyDebtPaymentCurrencyCode',
        { transaction },
      );
      await queryInterface.removeColumn(
        'LoanApplications',
        'monthlyDebtPayment',
        { transaction },
      );
    });
  },
};
