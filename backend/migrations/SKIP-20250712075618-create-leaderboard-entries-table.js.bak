'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('leaderboard_entries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      leaderboard_type: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'all_time'),
        allowNull: false
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      xp_earned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      games_played: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rank: {
        type: Sequelize.INTEGER
      },
      period_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      period_end: {
        type: Sequelize.DATE,
        allowNull: false
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

    await queryInterface.addIndex('leaderboard_entries', ['user_id']);
    await queryInterface.addIndex('leaderboard_entries', ['leaderboard_type']);
    await queryInterface.addIndex('leaderboard_entries', ['category_id']);
    await queryInterface.addIndex('leaderboard_entries', ['score']);
    await queryInterface.addIndex('leaderboard_entries', ['rank']);
    await queryInterface.addIndex('leaderboard_entries', ['period_start', 'period_end']);
    await queryInterface.addIndex('leaderboard_entries', 
      ['user_id', 'leaderboard_type', 'category_id', 'period_start'], {
      unique: true,
      name: 'leaderboard_entries_unique_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('leaderboard_entries');
  }
};
