'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create simple xp_levels table if it doesn't exist
    const tables = await queryInterface.showAllTables();
    
    if (!tables.includes('xp_levels')) {
      await queryInterface.createTable('xp_levels', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        level: {
          type: Sequelize.INTEGER,
          allowNull: false,
          unique: true
        },
        min_xp: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        max_xp: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // Create simple achievements table if it doesn't exist
    if (!tables.includes('achievements')) {
      await queryInterface.createTable('achievements', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT
        },
        icon: {
          type: Sequelize.STRING(50)
        },
        xp_reward: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // Create user_achievements if it doesn't exist
    if (!tables.includes('user_achievements')) {
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
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }

    // Add XP fields to users table if they don't exist
    const userColumns = await queryInterface.describeTable('users');
    
    if (!userColumns.level) {
      await queryInterface.addColumn('users', 'level', {
        type: Sequelize.INTEGER,
        defaultValue: 1
      });
    }

    if (!userColumns.total_xp) {
      await queryInterface.addColumn('users', 'total_xp', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }

    if (!userColumns.current_xp) {
      await queryInterface.addColumn('users', 'current_xp', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      });
    }

    // Seed initial XP levels
    const xpLevelsCount = await queryInterface.rawSelect('xp_levels', {
      where: {},
    }, ['id']);

    if (!xpLevelsCount) {
      const levels = [];
      for (let i = 1; i <= 50; i++) {
        levels.push({
          level: i,
          min_xp: (i - 1) * 100,
          max_xp: i * 100,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      await queryInterface.bulkInsert('xp_levels', levels);
    }

    // Seed initial achievements
    const achievementsCount = await queryInterface.rawSelect('achievements', {
      where: {},
    }, ['id']);

    if (!achievementsCount) {
      const achievements = [
        { name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', xp_reward: 10 },
        { name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '⭐', xp_reward: 50 },
        { name: 'Streak Master', description: 'Complete 5 quizzes in a row', icon: '🔥', xp_reward: 100 },
        { name: 'Knowledge Seeker', description: 'Complete 10 quizzes', icon: '📚', xp_reward: 200 },
        { name: 'Quiz Champion', description: 'Reach level 10', icon: '🏆', xp_reward: 500 }
      ].map(a => ({ ...a, created_at: new Date(), updated_at: new Date() }));
      
      await queryInterface.bulkInsert('achievements', achievements);
    }
  },

  async down (queryInterface, Sequelize) {
    // Remove XP columns from users
    const userColumns = await queryInterface.describeTable('users');
    
    if (userColumns.level) {
      await queryInterface.removeColumn('users', 'level');
    }
    if (userColumns.total_xp) {
      await queryInterface.removeColumn('users', 'total_xp');
    }
    if (userColumns.current_xp) {
      await queryInterface.removeColumn('users', 'current_xp');
    }

    // Drop tables
    await queryInterface.dropTable('user_achievements', { cascade: true });
    await queryInterface.dropTable('achievements', { cascade: true });
    await queryInterface.dropTable('xp_levels', { cascade: true });
  }
};