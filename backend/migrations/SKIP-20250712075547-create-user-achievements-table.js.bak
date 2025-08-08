'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('user_achievements', {
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
      achievement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      earned_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      progress_data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      notified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('user_achievements', ['user_id']);
    await queryInterface.addIndex('user_achievements', ['achievement_id']);
    await queryInterface.addIndex('user_achievements', ['earned_at']);
    await queryInterface.addIndex('user_achievements', ['user_id', 'achievement_id'], {
      unique: true,
      name: 'user_achievements_unique_idx'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_achievements');
  }
};
