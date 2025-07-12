'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class SocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
          attributes: ['id', 'username', 'level', 'title']
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.username} connected`);
      this.handleConnection(socket);
    });

    return this.io;
  }

  handleConnection(socket) {
    this.userSockets.set(socket.userId, socket.id);

    socket.join(`user:${socket.userId}`);

    socket.on('join:leaderboard', (leaderboardType) => {
      socket.join(`leaderboard:${leaderboardType}`);
    });

    socket.on('leave:leaderboard', (leaderboardType) => {
      socket.leave(`leaderboard:${leaderboardType}`);
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
      this.userSockets.delete(socket.userId);
    });
  }

  emitToUser(userId, event, data) {
    const room = `user:${userId}`;
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  emitProgressionUpdate(userId, progressionData) {
    this.emitToUser(userId, 'progression:update', {
      ...progressionData,
      timestamp: new Date().toISOString()
    });
  }

  emitAchievementUnlocked(userId, achievement) {
    this.emitToUser(userId, 'achievement:unlocked', {
      achievement,
      timestamp: new Date().toISOString()
    });
  }

  emitLevelUp(userId, levelData) {
    this.emitToUser(userId, 'progression:levelup', {
      ...levelData,
      timestamp: new Date().toISOString()
    });

    this.io.emit('global:levelup', {
      userId,
      username: levelData.username,
      newLevel: levelData.level,
      timestamp: new Date().toISOString()
    });
  }

  emitLeaderboardUpdate(leaderboardType, data) {
    const room = `leaderboard:${leaderboardType}`;
    if (this.io) {
      this.io.to(room).emit('leaderboard:update', {
        type: leaderboardType,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  broadcastQuizCompletion(userId, quizData) {
    this.io.emit('global:quizcomplete', {
      userId,
      username: quizData.username,
      score: quizData.score,
      category: quizData.category,
      timestamp: new Date().toISOString()
    });
  }

  broadcastStreakMilestone(userId, streakData) {
    this.io.emit('global:streak', {
      userId,
      username: streakData.username,
      streak: streakData.currentStreak,
      timestamp: new Date().toISOString()
    });
  }

  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  getOnlineCount() {
    return this.userSockets.size;
  }
}

module.exports = new SocketManager();