'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LoanAnalyses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },
      loanApplicationId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'LoanApplications',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      provider: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      model: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      financialHealth: {
        type: Sequelize.ENUM('strong', 'moderate', 'weak'),
        allowNull: false,
      },
      riskLevel: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      positiveFactors: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      riskFactors: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      followUpQuestions: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      financialMetrics: {
        type: Sequelize.JSONB,
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LoanAnalyses');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_LoanAnalyses_financialHealth";',
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_LoanAnalyses_riskLevel";',
    );
  },
};
