'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('xp_levels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      level: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false
      },
      min_xp: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      max_xp: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      badge_icon: {
        type: Sequelize.STRING(50)
      },
      perks: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('xp_levels', ['level']);
    await queryInterface.addIndex('xp_levels', ['min_xp', 'max_xp']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('xp_levels');
  }
};
