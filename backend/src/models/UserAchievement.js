'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserAchievement = sequelize.define('UserAchievement', {
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
    achievementId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'achievement_id',
      references: {
        model: 'achievements',
        key: 'id'
      }
    },
    earnedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'earned_at'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    progressData: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'progress_data'
    },
    notified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'user_achievements',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'achievement_id']
      }
    ]
  });

  UserAchievement.associate = function(models) {
    UserAchievement.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    UserAchievement.belongsTo(models.Achievement, {
      foreignKey: 'achievement_id',
      as: 'achievement'
    });
  };

  return UserAchievement;
};