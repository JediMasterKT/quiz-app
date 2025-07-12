'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('categories', 'display_order', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // Add index for display_order
    await queryInterface.addIndex('categories', ['display_order']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('categories', ['display_order']);
    await queryInterface.removeColumn('categories', 'display_order');
  }
};
