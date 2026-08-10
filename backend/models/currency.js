const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Currency = sequelize.define(
    'Currency',
    {
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        primaryKey: true,
        validate: { is: /^[A-Z]{3}$/ },
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      minorUnit: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
    },
    {
      tableName: 'Currencies',
      timestamps: false,
    },
  );

  Currency.associate = (models) => {
    const relationships = [
      ['monthlyRevenueCurrencyCode', 'revenueLoanApplications'],
      ['monthlyExpensesCurrencyCode', 'expenseLoanApplications'],
      ['existingDebtCurrencyCode', 'debtLoanApplications'],
      ['monthlyDebtPaymentCurrencyCode', 'monthlyDebtLoanApplications'],
      ['requestedAmountCurrencyCode', 'requestedLoanApplications'],
    ];

    relationships.forEach(([foreignKey, as]) => {
      Currency.hasMany(models.LoanApplication, {
        foreignKey,
        sourceKey: 'code',
        as,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });
    });

    Currency.hasMany(models.LoanApplicationExchangeRate, {
      foreignKey: 'fromCurrencyCode',
      sourceKey: 'code',
      as: 'sourceExchangeRates',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    Currency.hasMany(models.LoanApplicationExchangeRate, {
      foreignKey: 'toCurrencyCode',
      sourceKey: 'code',
      as: 'targetExchangeRates',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return Currency;
};
