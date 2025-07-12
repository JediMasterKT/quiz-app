'use strict';

module.exports = (sequelize, DataTypes) => {
  const GameSession = sequelize.define('GameSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    roomId: {
      type: DataTypes.INTEGER,
      field: 'room_id',
      references: {
        model: 'rooms',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    questionsAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'questions_answered'
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'correct_answers'
    },
    timeTaken: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'time_taken'
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'medium'
    },
    won: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'xp_earned'
    },
    sessionData: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'session_data'
    }
  }, {
    tableName: 'game_sessions',
    underscored: true
  });

  GameSession.associate = function(models) {
    GameSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    if (models.Category) {
      GameSession.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });
    }

    if (models.Room) {
      GameSession.belongsTo(models.Room, {
        foreignKey: 'room_id',
        as: 'room'
      });
    }
  };

  return GameSession;
};