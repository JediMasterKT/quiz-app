'use strict';

module.exports = (sequelize, DataTypes) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    xpReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'xp_reward'
    },
    rarity: {
      type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
      defaultValue: 'common'
    },
    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'general'
    },
    requirement: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'JSON object defining the achievement criteria'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'achievements',
    underscored: true,
    timestamps: true
  });

  Achievement.associate = function(models) {
    Achievement.belongsToMany(models.User, {
      through: 'user_achievements',
      foreignKey: 'achievement_id',
      otherKey: 'user_id',
      as: 'users'
    });
  };

  return Achievement;
};