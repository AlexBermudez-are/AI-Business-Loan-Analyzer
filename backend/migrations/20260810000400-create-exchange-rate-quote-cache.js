'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ExchangeRateQuotes',
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
            allowNull: false,
            primaryKey: true,
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
          sourceName: {
            type: Sequelize.STRING(160),
            allowNull: false,
          },
          sourceUrl: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          provider: {
            type: Sequelize.STRING(30),
            allowNull: false,
          },
          model: {
            type: Sequelize.STRING(120),
            allowNull: false,
          },
          retrievedAt: {
            type: Sequelize.DATE,
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

      await queryInterface.addConstraint('ExchangeRateQuotes', {
        fields: ['fromCurrencyCode', 'toCurrencyCode'],
        type: 'unique',
        name: 'exchange_rate_quotes_pair_unique',
        transaction,
      });
      await queryInterface.addConstraint('ExchangeRateQuotes', {
        fields: ['rate'],
        type: 'check',
        where: { rate: { [Sequelize.Op.gt]: 0 } },
        name: 'exchange_rate_quotes_rate_positive',
        transaction,
      });
      await queryInterface.addConstraint('ExchangeRateQuotes', {
        fields: ['fromCurrencyCode'],
        type: 'check',
        where: { fromCurrencyCode: 'USD' },
        name: 'exchange_rate_quotes_usd_base',
        transaction,
      });

      for (const [fields, name] of [
        [['fromCurrencyCode'], 'exchange_rate_quotes_from_currency_idx'],
        [['toCurrencyCode'], 'exchange_rate_quotes_to_currency_idx'],
        [['retrievedAt'], 'exchange_rate_quotes_retrieved_at_idx'],
      ]) {
        await queryInterface.addIndex('ExchangeRateQuotes', fields, {
          name,
          transaction,
        });
      }

      await queryInterface.sequelize.query(
        `
          INSERT INTO "ExchangeRateQuotes" (
            "id", "fromCurrencyCode", "toCurrencyCode", "rate",
            "quotedAt", "sourceName", "sourceUrl", "provider", "model",
            "retrievedAt", "createdAt", "updatedAt"
          )
          SELECT DISTINCT ON ("fromCurrencyCode", "toCurrencyCode")
            gen_random_uuid(), "fromCurrencyCode", "toCurrencyCode", "rate",
            "quotedAt", "sourceName", "sourceUrl", "provider", "model",
            "retrievedAt", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          FROM "LoanApplicationExchangeRates"
          WHERE
            "fromCurrencyCode" = 'USD'
            AND "sourceUrl" IS NOT NULL
            AND "provider" <> 'legacy'
          ORDER BY "fromCurrencyCode", "toCurrencyCode", "retrievedAt" DESC
          ON CONFLICT ("fromCurrencyCode", "toCurrencyCode") DO NOTHING
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ExchangeRateQuotes');
  },
};
