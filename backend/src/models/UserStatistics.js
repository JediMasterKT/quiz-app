'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserStatistics = sequelize.define('UserStatistics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalXp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_xp'
    },
    currentLevelXp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_level_xp'
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
    perfectGames: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'perfect_games'
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'current_streak'
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'longest_streak'
    },
    lastActivityDate: {
      type: DataTypes.DATE,
      field: 'last_activity_date'
    },
    totalTimePlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_time_played'
    },
    fastestAnswerTime: {
      type: DataTypes.INTEGER,
      field: 'fastest_answer_time'
    },
    categoriesPlayed: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'categories_played'
    },
    difficultyStats: {
      type: DataTypes.JSONB,
      defaultValue: {
        easy: { played: 0, correct: 0 },
        medium: { played: 0, correct: 0 },
        hard: { played: 0, correct: 0 }
      },
      field: 'difficulty_stats'
    },
    achievementsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'achievements_earned'
    },
    weeklyXp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'weekly_xp'
    },
    monthlyXp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'monthly_xp'
    }
  }, {
    tableName: 'user_statistics',
    underscored: true
  });

  UserStatistics.associate = function(models) {
    UserStatistics.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  UserStatistics.prototype.getAccuracy = function() {
    if (this.questionsAnswered === 0) return 0;
    return (this.correctAnswers / this.questionsAnswered * 100).toFixed(2);
  };

  UserStatistics.prototype.getAverageTimePerQuestion = function() {
    if (this.questionsAnswered === 0) return 0;
    return Math.round(this.totalTimePlayed / this.questionsAnswered);
  };

  return UserStatistics;
};