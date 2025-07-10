'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('questions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      question_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'multiple_choice'
      },
      options: {
        type: Sequelize.JSONB
      },
      correct_answer: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      explanation: {
        type: Sequelize.TEXT
      },
      difficulty_level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      image_url: {
        type: Sequelize.TEXT
      },
      audio_url: {
        type: Sequelize.TEXT
      },
      time_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      points: {
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      hint: {
        type: Sequelize.TEXT
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      usage_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      success_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00
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
    await queryInterface.addIndex('questions', ['category_id']);
    await queryInterface.addIndex('questions', ['difficulty_level']);
    await queryInterface.addIndex('questions', ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('questions');
  }
};
