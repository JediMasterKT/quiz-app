'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'total_xp', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'current_level_xp', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'next_level_xp', {
      type: Sequelize.INTEGER,
      defaultValue: 100
    });

    await queryInterface.addColumn('users', 'level_progress', {
      type: Sequelize.FLOAT,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'title', {
      type: Sequelize.STRING(50),
      defaultValue: 'Novice'
    });

    await queryInterface.addIndex('users', ['total_xp']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'total_xp');
    await queryInterface.removeColumn('users', 'current_level_xp');
    await queryInterface.removeColumn('users', 'next_level_xp');
    await queryInterface.removeColumn('users', 'level_progress');
    await queryInterface.removeColumn('users', 'title');
  }
};
