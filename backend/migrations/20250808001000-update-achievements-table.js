'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('achievements');
    
    // Add rarity column if it doesn't exist
    if (!tableInfo.rarity) {
      await queryInterface.addColumn('achievements', 'rarity', {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        defaultValue: 'common'
      });
    }

    // Add category column if it doesn't exist
    if (!tableInfo.category) {
      await queryInterface.addColumn('achievements', 'category', {
        type: Sequelize.STRING(50),
        defaultValue: 'general'
      });
    }

    // Add requirement column if it doesn't exist
    if (!tableInfo.requirement) {
      await queryInterface.addColumn('achievements', 'requirement', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    // Add is_active column if it doesn't exist
    if (!tableInfo.is_active) {
      await queryInterface.addColumn('achievements', 'is_active', {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      });
    }

    // Add progress column to user_achievements if it doesn't exist
    const userAchTableInfo = await queryInterface.describeTable('user_achievements');
    
    if (!userAchTableInfo.progress) {
      await queryInterface.addColumn('user_achievements', 'progress', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }

    if (!userAchTableInfo.metadata) {
      await queryInterface.addColumn('user_achievements', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove columns in reverse order
    await queryInterface.removeColumn('user_achievements', 'metadata');
    await queryInterface.removeColumn('user_achievements', 'progress');
    await queryInterface.removeColumn('achievements', 'is_active');
    await queryInterface.removeColumn('achievements', 'requirement');
    await queryInterface.removeColumn('achievements', 'category');
    await queryInterface.removeColumn('achievements', 'rarity');
  }
};