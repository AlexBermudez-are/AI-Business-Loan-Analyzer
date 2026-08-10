const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExchangeRateQuote = sequelize.define(
    'ExchangeRateQuote',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
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
        allowNull: false,
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
      tableName: 'ExchangeRateQuotes',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['fromCurrencyCode', 'toCurrencyCode'] },
        { fields: ['fromCurrencyCode'] },
        { fields: ['toCurrencyCode'] },
        { fields: ['retrievedAt'] },
      ],
    },
  );

  ExchangeRateQuote.associate = (models) => {
    ExchangeRateQuote.belongsTo(models.Currency, {
      foreignKey: 'fromCurrencyCode',
      targetKey: 'code',
      as: 'fromCurrency',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    ExchangeRateQuote.belongsTo(models.Currency, {
      foreignKey: 'toCurrencyCode',
      targetKey: 'code',
      as: 'toCurrency',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return ExchangeRateQuote;
};
