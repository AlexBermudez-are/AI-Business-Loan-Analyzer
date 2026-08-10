const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoanApplicationExchangeRate = sequelize.define(
    'LoanApplicationExchangeRate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      loanApplicationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fromCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
      },
      toCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
      },
      rate: {
        type: DataTypes.DECIMAL(24, 10),
        allowNull: false,
        validate: { min: 0.0000000001 },
      },
      quotedAt: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      sourceName: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      sourceUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      provider: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      retrievedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'LoanApplicationExchangeRates',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['loanApplicationId', 'fromCurrencyCode', 'toCurrencyCode'],
        },
        { fields: ['loanApplicationId'] },
        { fields: ['fromCurrencyCode'] },
        { fields: ['toCurrencyCode'] },
      ],
    },
  );

  LoanApplicationExchangeRate.associate = (models) => {
    LoanApplicationExchangeRate.belongsTo(models.LoanApplication, {
      foreignKey: 'loanApplicationId',
      as: 'loanApplication',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    LoanApplicationExchangeRate.belongsTo(models.Currency, {
      foreignKey: 'fromCurrencyCode',
      targetKey: 'code',
      as: 'fromCurrency',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    LoanApplicationExchangeRate.belongsTo(models.Currency, {
      foreignKey: 'toCurrencyCode',
      targetKey: 'code',
      as: 'toCurrency',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return LoanApplicationExchangeRate;
};
