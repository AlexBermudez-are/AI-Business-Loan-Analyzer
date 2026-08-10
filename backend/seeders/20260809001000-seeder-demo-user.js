'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const password = await bcrypt.hash('DemoPass123!', 10);
    const now = new Date();

    await queryInterface.bulkInsert(
      'Users',
      [
        {
          fullName: 'Demo User',
          email: 'demo@businessloan.local',
          password,
          createdAt: now,
          updatedAt: now,
        },
      ],
      { ignoreDuplicates: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'Users',
      { email: 'demo@businessloan.local' },
      {},
    );
  },
};
