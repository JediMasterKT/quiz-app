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

    socket.on('join:leaderboard', (data) => {
      const { type, categoryId } = data;
      const room = categoryId ? `leaderboard:${type}:${categoryId}` : `leaderboard:${type}`;
      socket.join(room);
      socket.emit('leaderboard:joined', { room, type, categoryId });
    });

    socket.on('leave:leaderboard', (data) => {
      const { type, categoryId } = data;
      const room = categoryId ? `leaderboard:${type}:${categoryId}` : `leaderboard:${type}`;
      socket.leave(room);
    });

    socket.on('leaderboard:subscribe', async (data) => {
      const { type, categoryId, limit = 100 } = data;
      const room = categoryId ? `leaderboard:${type}:${categoryId}` : `leaderboard:${type}`;
      socket.join(room);
      
      const leaderboardService = require('../services/LeaderboardService');
      const leaderboard = await leaderboardService.getLeaderboard(type, categoryId, limit, 0);
      
      socket.emit('leaderboard:initial', {
        type,
        categoryId,
        data: leaderboard
      });
    });

    socket.on('rank:subscribe', async () => {
      const leaderboardService = require('../services/LeaderboardService');
      const ranks = await leaderboardService.getUserAllRanks(socket.userId);
      
      socket.emit('rank:update', ranks);
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

  emitLeaderboardUpdate(leaderboardType, data, categoryId = null) {
    const room = categoryId ? `leaderboard:${leaderboardType}:${categoryId}` : `leaderboard:${leaderboardType}`;
    if (this.io) {
      this.io.to(room).emit('leaderboard:update', {
        type: leaderboardType,
        categoryId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  async updateLeaderboardAfterGame(userId, gameData) {
    const leaderboardService = require('../services/LeaderboardService');
    
    const types = ['daily', 'weekly', 'monthly', 'all_time'];
    for (const type of types) {
      const updatedLeaderboard = await leaderboardService.getLeaderboard(type, gameData.categoryId, 100, 0);
      
      this.emitLeaderboardUpdate(type, updatedLeaderboard);
      
      if (gameData.categoryId) {
        this.emitLeaderboardUpdate(type, updatedLeaderboard, gameData.categoryId);
      }
    }
    
    const userRanks = await leaderboardService.getUserAllRanks(userId);
    this.emitToUser(userId, 'rank:update', userRanks);
  }

  emitRankChange(userId, oldRank, newRank, leaderboardType) {
    const improved = newRank < oldRank;
    
    this.emitToUser(userId, 'rank:changed', {
      type: leaderboardType,
      oldRank,
      newRank,
      improved,
      timestamp: new Date().toISOString()
    });

    if (improved && newRank <= 10) {
      this.io.emit('global:topten', {
        userId,
        rank: newRank,
        type: leaderboardType,
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