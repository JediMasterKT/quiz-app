'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('gameplay', 'progression', 'streak', 'social', 'special'),
        allowNull: false
      },
      rarity: {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        allowNull: false,
        defaultValue: 'common'
      },
      xp_reward: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      criteria: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('achievements', ['code']);
    await queryInterface.addIndex('achievements', ['category']);
    await queryInterface.addIndex('achievements', ['rarity']);
    await queryInterface.addIndex('achievements', ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('achievements');
  }
};
