const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Business = sequelize.define(
    'Business',
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
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      industry: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      yearsInBusiness: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'Businesses',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'name'],
          name: 'unique_user_business_name',
        },
      ],
    },
  );

  Business.associate = (models) => {
    Business.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'owner',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Business.hasMany(models.LoanApplication, {
      foreignKey: 'businessId',
      as: 'loanApplications',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Business;
};
