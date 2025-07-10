'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('room_participants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      room_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'rooms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      left_at: {
        type: Sequelize.DATE
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      current_score: {
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
    await queryInterface.addIndex('room_participants', ['room_id']);
    await queryInterface.addIndex('room_participants', ['user_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('room_participants');
  }
};
