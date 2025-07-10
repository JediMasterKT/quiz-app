'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('game_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      session_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      difficulty_level: {
        type: Sequelize.INTEGER
      },
      total_questions: {
        type: Sequelize.INTEGER
      },
      questions_answered: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      correct_answers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      time_taken: {
        type: Sequelize.INTEGER
      },
      started_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      completed_at: {
        type: Sequelize.DATE
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      session_data: {
        type: Sequelize.JSONB
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

    // Add indexes
    await queryInterface.addIndex('game_sessions', ['user_id']);
    await queryInterface.addIndex('game_sessions', ['session_type']);
    await queryInterface.addIndex('game_sessions', ['is_completed']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('game_sessions');
  }
};
