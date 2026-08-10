'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Businesses', {
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
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      industry: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      yearsInBusiness: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addConstraint('Businesses', {
      fields: ['userId', 'name'],
      type: 'unique',
      name: 'unique_user_business_name',
    });

    await queryInterface.addIndex('Businesses', ['userId'], {
      name: 'businesses_user_id_index',
    });

    await queryInterface.addConstraint('Businesses', {
      fields: ['yearsInBusiness'],
      type: 'check',
      where: {
        yearsInBusiness: { [Sequelize.Op.between]: [0, 200] },
      },
      name: 'businesses_years_in_business_range',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Businesses');
  },
};
