'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('game_sessions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
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
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'active'
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
      current_question_index: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      correct_answers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      incorrect_answers: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      question_ids: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      answers: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      time_per_question: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      total_time_spent: {
        type: Sequelize.INTEGER
      },
      started_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      completed_at: {
        type: Sequelize.DATE
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
    await queryInterface.addIndex('game_sessions', ['status']);
    await queryInterface.addIndex('game_sessions', ['started_at']);
    await queryInterface.addIndex('game_sessions', ['user_id', 'status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('game_sessions');
  }
};
