'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AnalysisHistories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex(
      'AnalysisHistories',
      ['userId', 'createdAt', 'id'],
      {
        name: 'analysis_histories_user_created_id_idx',
      },
    );

    await queryInterface.sequelize.query(`
      INSERT INTO "AnalysisHistories"
        ("id", "userId", "loanApplicationId", "createdAt", "updatedAt")
      SELECT
        gen_random_uuid(),
        business."userId",
        application."id",
        analysis."createdAt",
        analysis."updatedAt"
      FROM "LoanAnalyses" AS analysis
      INNER JOIN "LoanApplications" AS application
        ON application."id" = analysis."loanApplicationId"
      INNER JOIN "Businesses" AS business
        ON business."id" = application."businessId"
      ON CONFLICT ("loanApplicationId") DO NOTHING;
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AnalysisHistories');
  },
};
