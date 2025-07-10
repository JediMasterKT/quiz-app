'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('rooms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      room_code: {
        type: Sequelize.STRING(8),
        unique: true,
        allowNull: false
      },
      host_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      room_name: {
        type: Sequelize.STRING(100)
      },
      max_players: {
        type: Sequelize.INTEGER,
        defaultValue: 20
      },
      current_players: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      room_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'waiting'
      },
      game_config: {
        type: Sequelize.JSONB
      },
      started_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('rooms', ['room_code']);
    await queryInterface.addIndex('rooms', ['host_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('rooms');
  }
};
