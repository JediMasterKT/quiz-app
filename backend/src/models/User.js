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
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'user',
      allowNull: false,
      validate: {
        isIn: {
          args: [['user', 'admin', 'moderator']],
          msg: 'Role must be user, admin, or moderator'
        }
      }
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
      email: this.email,
      role: this.role
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  };

  User.prototype.isAdmin = function() {
    return this.role === 'admin';
  };

  User.prototype.isModerator = function() {
    return this.role === 'moderator';
  };

  User.prototype.canManageQuestions = function() {
    return this.role === 'admin' || this.role === 'moderator';
  };

  User.prototype.toJSON = function() {
    const user = this.get();
    delete user.passwordHash;
    delete user.verificationToken;
    delete user.resetToken;
    delete user.resetTokenExpires;
    return user;
  };

  return User;
};