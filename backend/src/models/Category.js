'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
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
      type: DataTypes.TEXT
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'folder'
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#3B82F6'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'categories',
    underscored: true
  });

  Category.associate = function(models) {
    if (models.Question) {
      Category.hasMany(models.Question, {
        foreignKey: 'category_id',
        as: 'questions'
      });
    }

    Category.hasMany(models.GameSession, {
      foreignKey: 'category_id',
      as: 'gameSessions'
    });

    Category.hasMany(models.LeaderboardEntry, {
      foreignKey: 'category_id',
      as: 'leaderboardEntries'
    });
  };

  return Category;
};