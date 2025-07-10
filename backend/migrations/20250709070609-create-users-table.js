'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(100)
      },
      last_name: {
        type: Sequelize.STRING(100)
      },
      avatar_url: {
        type: Sequelize.TEXT
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      total_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      games_played: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      games_won: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_login: {
        type: Sequelize.DATE
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verification_token: {
        type: Sequelize.STRING(255)
      },
      reset_token: {
        type: Sequelize.STRING(255)
      },
      reset_token_expires: {
        type: Sequelize.DATE
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
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['level']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
