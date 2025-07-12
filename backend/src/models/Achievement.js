'use strict';

module.exports = (sequelize, DataTypes) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('gameplay', 'progression', 'streak', 'social', 'special'),
      allowNull: false
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      allowNull: false,
      defaultValue: 'common'
    },
    xpReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'xp_reward'
    },
    criteria: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    tableName: 'achievements',
    underscored: true
  });

  Achievement.associate = function(models) {
    Achievement.belongsToMany(models.User, {
      through: models.UserAchievement,
      foreignKey: 'achievement_id',
      as: 'users'
    });
  };

  return Achievement;
};