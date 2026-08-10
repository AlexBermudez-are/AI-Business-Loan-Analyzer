'use strict';

const currencies = require('../data/currencies');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Currencies', currencies, {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Currencies', {
      code: currencies.map(({ code }) => code),
    });
  },
};
