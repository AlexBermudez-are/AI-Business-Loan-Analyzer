'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LoanApplications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false,
        primaryKey: true,
      },
      businessId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Businesses',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      monthlyRevenue: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      monthlyExpenses: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      existingDebt: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      requestedAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      loanPurpose: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'analyzing', 'analyzed', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
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

    await queryInterface.addIndex('LoanApplications', ['businessId'], {
      name: 'loan_applications_business_id_index',
    });

    await queryInterface.addConstraint('LoanApplications', {
      fields: ['monthlyRevenue'],
      type: 'check',
      where: { monthlyRevenue: { [Sequelize.Op.gt]: 0 } },
      name: 'loan_applications_monthly_revenue_positive',
    });

    await queryInterface.addConstraint('LoanApplications', {
      fields: ['monthlyExpenses'],
      type: 'check',
      where: { monthlyExpenses: { [Sequelize.Op.gte]: 0 } },
      name: 'loan_applications_monthly_expenses_non_negative',
    });

    await queryInterface.addConstraint('LoanApplications', {
      fields: ['existingDebt'],
      type: 'check',
      where: { existingDebt: { [Sequelize.Op.gte]: 0 } },
      name: 'loan_applications_existing_debt_non_negative',
    });

    await queryInterface.addConstraint('LoanApplications', {
      fields: ['requestedAmount'],
      type: 'check',
      where: { requestedAmount: { [Sequelize.Op.gt]: 0 } },
      name: 'loan_applications_requested_amount_positive',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('LoanApplications');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_LoanApplications_status";',
    );
  },
};
