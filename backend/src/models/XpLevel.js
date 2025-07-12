'use strict';

module.exports = (sequelize, DataTypes) => {
  const XpLevel = sequelize.define('XpLevel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    level: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    minXp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'min_xp'
    },
    maxXp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_xp'
    },
    title: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    badgeIcon: {
      type: DataTypes.STRING(50),
      field: 'badge_icon'
    },
    perks: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'xp_levels',
    underscored: true
  });

  return XpLevel;
};