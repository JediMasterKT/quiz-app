'use strict';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      validate: {
        len: [3, 50],
        isAlphanumeric: true
      }
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: 'last_name'
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      field: 'avatar_url'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    totalScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_score'
    },
    gamesPlayed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'games_played'
    },
    gamesWon: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'games_won'
    },
    lastLogin: {
      type: DataTypes.DATE,
      field: 'last_login'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    verificationToken: {
      type: DataTypes.STRING(255),
      field: 'verification_token'
    },
    resetToken: {
      type: DataTypes.STRING(255),
      field: 'reset_token'
    },
    resetTokenExpires: {
      type: DataTypes.DATE,
      field: 'reset_token_expires'
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
    nextLevelXp: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'next_level_xp'
    },
    levelProgress: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      field: 'level_progress'
    },
    title: {
      type: DataTypes.STRING(50),
      defaultValue: 'Novice'
    }
  }, {
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('passwordHash')) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  };

  User.prototype.generateJWT = function() {
    return jwt.sign({
      id: this.id,
      username: this.username,
      email: this.email
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  };

  User.prototype.toJSON = function() {
    const user = this.get();
    delete user.passwordHash;
    delete user.verificationToken;
    delete user.resetToken;
    delete user.resetTokenExpires;
    return user;
  };

  User.associate = function(models) {
    User.hasMany(models.UserAchievement, {
      foreignKey: 'user_id',
      as: 'achievements'
    });
    
    User.hasOne(models.UserStatistics, {
      foreignKey: 'user_id',
      as: 'statistics'
    });
    
    User.hasMany(models.LeaderboardEntry, {
      foreignKey: 'user_id',
      as: 'leaderboardEntries'
    });
    
    User.belongsToMany(models.Achievement, {
      through: models.UserAchievement,
      foreignKey: 'user_id',
      as: 'earnedAchievements'
    });
  };

  return User;
};