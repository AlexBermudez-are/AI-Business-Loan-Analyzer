const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoanApplication = sequelize.define(
    'LoanApplication',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      businessId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Businesses',
          key: 'id',
        },
      },
      monthlyRevenue: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      monthlyRevenueCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 'Currencies',
          key: 'code',
        },
      },
      monthlyExpenses: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      monthlyExpensesCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 'Currencies',
          key: 'code',
        },
      },
      existingDebt: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      existingDebtCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 'Currencies',
          key: 'code',
        },
      },
      monthlyDebtPayment: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      monthlyDebtPaymentCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 'Currencies',
          key: 'code',
        },
      },
      requestedAmount: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      requestedAmountCurrencyCode: {
        type: DataTypes.STRING(3),
        allowNull: false,
        references: {
          model: 'Currencies',
          key: 'code',
        },
      },
      loanPurpose: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'analyzing', 'analyzed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'LoanApplications',
      timestamps: true,
      indexes: [
        { fields: ['businessId'] },
        { fields: ['monthlyRevenueCurrencyCode'] },
        { fields: ['monthlyExpensesCurrencyCode'] },
        { fields: ['existingDebtCurrencyCode'] },
        { fields: ['monthlyDebtPaymentCurrencyCode'] },
        { fields: ['requestedAmountCurrencyCode'] },
      ],
    },
  );

  LoanApplication.associate = (models) => {
    LoanApplication.belongsTo(models.Business, {
      foreignKey: 'businessId',
      as: 'business',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    const currencyRelationships = [
      ['monthlyRevenueCurrencyCode', 'monthlyRevenueCurrency'],
      ['monthlyExpensesCurrencyCode', 'monthlyExpensesCurrency'],
      ['existingDebtCurrencyCode', 'existingDebtCurrency'],
      ['monthlyDebtPaymentCurrencyCode', 'monthlyDebtPaymentCurrency'],
      ['requestedAmountCurrencyCode', 'requestedAmountCurrency'],
    ];

    currencyRelationships.forEach(([foreignKey, as]) => {
      LoanApplication.belongsTo(models.Currency, {
        foreignKey,
        targetKey: 'code',
        as,
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      });
    });

    LoanApplication.hasOne(models.LoanAnalysis, {
      foreignKey: 'loanApplicationId',
      as: 'analysis',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    LoanApplication.hasMany(models.LoanApplicationExchangeRate, {
      foreignKey: 'loanApplicationId',
      as: 'exchangeRates',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    LoanApplication.hasOne(models.AnalysisHistory, {
      foreignKey: 'loanApplicationId',
      as: 'historyEntry',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return LoanApplication;
};
