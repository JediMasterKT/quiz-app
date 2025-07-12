'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_statistics', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      total_xp: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      current_level_xp: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      questions_answered: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      correct_answers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      perfect_games: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      current_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      longest_streak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_activity_date: {
        type: Sequelize.DATE
      },
      total_time_played: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      fastest_answer_time: {
        type: Sequelize.INTEGER
      },
      categories_played: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      difficulty_stats: {
        type: Sequelize.JSONB,
        defaultValue: {
          easy: { played: 0, correct: 0 },
          medium: { played: 0, correct: 0 },
          hard: { played: 0, correct: 0 }
        }
      },
      achievements_earned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      weekly_xp: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      monthly_xp: {
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

    await queryInterface.addIndex('user_statistics', ['user_id']);
    await queryInterface.addIndex('user_statistics', ['total_xp']);
    await queryInterface.addIndex('user_statistics', ['current_streak']);
    await queryInterface.addIndex('user_statistics', ['weekly_xp']);
    await queryInterface.addIndex('user_statistics', ['monthly_xp']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_statistics');
  }
};
