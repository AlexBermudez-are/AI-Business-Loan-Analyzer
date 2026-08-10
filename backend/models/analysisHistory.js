const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnalysisHistory = sequelize.define(
    'AnalysisHistory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
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
    },
    {
      tableName: 'AnalysisHistories',
      timestamps: true,
      indexes: [
        {
          name: 'analysis_histories_user_created_id_idx',
          fields: ['userId', 'createdAt', 'id'],
        },
      ],
    },
  );

  AnalysisHistory.associate = (models) => {
    AnalysisHistory.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    AnalysisHistory.belongsTo(models.LoanApplication, {
      foreignKey: 'loanApplicationId',
      as: 'loanApplication',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return AnalysisHistory;
};
