'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING(20),
      defaultValue: 'user',
      allowNull: false,
      validate: {
        isIn: [['user', 'admin', 'moderator']]
      }
    });

    // Add index for role-based queries
    await queryInterface.addIndex('users', ['role']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', ['role']);
    await queryInterface.removeColumn('users', 'role');
  }
};
