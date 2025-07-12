'use strict';

module.exports = (sequelize, DataTypes) => {
  const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
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
    leaderboardType: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'all_time'),
      allowNull: false,
      field: 'leaderboard_type'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'xp_earned'
    },
    gamesPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'games_played'
    },
    rank: {
      type: DataTypes.INTEGER
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'period_start'
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'period_end'
    }
  }, {
    tableName: 'leaderboard_entries',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'leaderboard_type', 'category_id', 'period_start']
      }
    ]
  });

  LeaderboardEntry.associate = function(models) {
    LeaderboardEntry.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    if (models.Category) {
      LeaderboardEntry.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'category'
      });
    }
  };

  return LeaderboardEntry;
};