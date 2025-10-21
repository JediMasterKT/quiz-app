'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove primary key constraint before changing column type
    await queryInterface.removeConstraint('game_sessions', 'game_sessions_pkey');

    // Change id to UUID
    await queryInterface.changeColumn('game_sessions', 'id', {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    });

    // Re-add primary key constraint after changing column type
    await queryInterface.addConstraint('game_sessions', {
      fields: ['id'],
      type: 'primary key',
      name: 'game_sessions_pkey'
    });

    // Add missing columns
    await queryInterface.addColumn('game_sessions', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    });

    await queryInterface.addColumn('game_sessions', 'current_question_index', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('game_sessions', 'score', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('game_sessions', 'incorrect_answers', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('game_sessions', 'question_ids', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('game_sessions', 'answers', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('game_sessions', 'time_per_question', {
      type: Sequelize.JSONB,
      defaultValue: []
    });

    await queryInterface.addColumn('game_sessions', 'total_time_spent', {
      type: Sequelize.INTEGER
    });

    // Rename/update existing columns
    await queryInterface.renameColumn('game_sessions', 'total_score', 'old_total_score');
    await queryInterface.renameColumn('game_sessions', 'questions_answered', 'old_questions_answered');
    await queryInterface.renameColumn('game_sessions', 'time_taken', 'old_time_taken');
    await queryInterface.renameColumn('game_sessions', 'is_completed', 'old_is_completed');

    // Add new indexes
    await queryInterface.addIndex('game_sessions', ['status']);
    await queryInterface.addIndex('game_sessions', ['user_id', 'status']);
    await queryInterface.addIndex('game_sessions', ['started_at']);

    // Remove old index
    await queryInterface.removeIndex('game_sessions', ['is_completed']);
  },

  async down (queryInterface, Sequelize) {
    // Restore old structure
    await queryInterface.addIndex('game_sessions', ['is_completed']);
    await queryInterface.removeIndex('game_sessions', ['status']);
    await queryInterface.removeIndex('game_sessions', ['user_id', 'status']);
    await queryInterface.removeIndex('game_sessions', ['started_at']);

    await queryInterface.renameColumn('game_sessions', 'old_total_score', 'total_score');
    await queryInterface.renameColumn('game_sessions', 'old_questions_answered', 'questions_answered');
    await queryInterface.renameColumn('game_sessions', 'old_time_taken', 'time_taken');
    await queryInterface.renameColumn('game_sessions', 'old_is_completed', 'is_completed');

    await queryInterface.removeColumn('game_sessions', 'status');
    await queryInterface.removeColumn('game_sessions', 'current_question_index');
    await queryInterface.removeColumn('game_sessions', 'score');
    await queryInterface.removeColumn('game_sessions', 'incorrect_answers');
    await queryInterface.removeColumn('game_sessions', 'question_ids');
    await queryInterface.removeColumn('game_sessions', 'answers');
    await queryInterface.removeColumn('game_sessions', 'time_per_question');
    await queryInterface.removeColumn('game_sessions', 'total_time_spent');

    // Remove primary key constraint before changing column type
    await queryInterface.removeConstraint('game_sessions', 'game_sessions_pkey');

    await queryInterface.changeColumn('game_sessions', 'id', {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    });

    // Re-add primary key constraint after changing column type
    await queryInterface.addConstraint('game_sessions', {
      fields: ['id'],
      type: 'primary key',
      name: 'game_sessions_pkey'
    });
  }
};
