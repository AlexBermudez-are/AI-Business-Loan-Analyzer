const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoanAnalysis = sequelize.define(
    'LoanAnalysis',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      loanApplicationId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'LoanApplications',
          key: 'id',
        },
      },
      provider: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      model: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      financialHealth: {
        type: DataTypes.ENUM('strong', 'moderate', 'weak'),
        allowNull: false,
      },
      riskLevel: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      positiveFactors: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      riskFactors: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      followUpQuestions: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      financialMetrics: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      tableName: 'LoanAnalyses',
      timestamps: true,
    },
  );

  LoanAnalysis.associate = (models) => {
    LoanAnalysis.belongsTo(models.LoanApplication, {
      foreignKey: 'loanApplicationId',
      as: 'loanApplication',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return LoanAnalysis;
};
