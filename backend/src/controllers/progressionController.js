'use strict';

// Use database service if available, fallback to simple service
const progressionService = process.env.USE_SIMPLE_PROGRESSION === 'true' 
  ? require('../services/SimpleProgressionService')
  : require('../services/DatabaseProgressionService');
const achievementService = process.env.USE_SIMPLE_ACHIEVEMENTS === 'true'
  ? require('../services/AchievementService')
  : require('../services/DatabaseAchievementService');
const leaderboardService = require('../services/LeaderboardService');

const progressionController = {
  async getUserProgression(req, res, next) {
    try {
      const userId = req.user.id;
      const progression = await progressionService.getUserProgression(userId);
      
      res.json({
        success: true,
        data: progression
      });
    } catch (error) {
      next(error);
    }
  },

  async calculateXP(req, res, next) {
    try {
      const userId = req.user.id;
      const gameData = req.body;
      
      const earnedXP = await progressionService.calculateXP(userId, gameData);
      
      res.json({
        success: true,
        data: { earnedXP }
      });
    } catch (error) {
      next(error);
    }
  },

  async addXP(req, res, next) {
    try {
      const userId = req.user.id;
      const { earnedXP } = req.body;
      
      if (!earnedXP || earnedXP < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid XP amount'
        });
      }
      
      const progressionData = await progressionService.updateUserProgression(userId, earnedXP);
      
      res.json({
        success: true,
        data: progressionData
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStats(req, res, next) {
    try {
      const userId = req.user.id;
      const gameData = req.body;
      
      const stats = await progressionService.updateGameStatistics(userId, gameData);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserAchievements(req, res, next) {
    try {
      const userId = req.user.id;
      const achievements = await achievementService.getUserAchievements(userId);
      
      res.json({
        success: true,
        data: achievements
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAchievements(req, res, next) {
    try {
      const userId = req.user.id;
      const { gameData } = req.body;
      
      console.log('Achievement service:', typeof achievementService.checkAndGrantAchievements);
      
      const newAchievements = await achievementService.checkAndGrantAchievements(userId, gameData);
      
      res.json({
        success: true,
        data: { newAchievements }
      });
    } catch (error) {
      console.error('Check achievements error:', error);
      next(error);
    }
  },

  async getLeaderboard(req, res, next) {
    try {
      const { type = 'weekly', categoryId, limit = 100, offset = 0 } = req.query;
      
      if (!['daily', 'weekly', 'monthly', 'all_time'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid leaderboard type'
        });
      }

      const leaderboard = await leaderboardService.getLeaderboard(
        type,
        categoryId ? parseInt(categoryId) : null,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserRank(req, res, next) {
    try {
      const userId = req.user.id;
      const { type = 'weekly', categoryId } = req.query;

      if (!['daily', 'weekly', 'monthly', 'all_time'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid leaderboard type'
        });
      }

      const rank = await leaderboardService.getUserRank(
        userId,
        type,
        categoryId ? parseInt(categoryId) : null
      );

      res.json({
        success: true,
        data: rank
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserLeaderboardStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await leaderboardService.getUserLeaderboardStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getTopPlayers(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const topPlayers = await leaderboardService.getTopPlayers(parseInt(limit));

      res.json({
        success: true,
        data: topPlayers
      });
    } catch (error) {
      next(error);
    }
  },

  async checkAchievementsOld(req, res, next) {
    try {
      const userId = req.user.id;
      const { context = {} } = req.body;
      
      const unlockedAchievements = await achievementService.checkAchievements(userId, context);

      res.json({
        success: true,
        data: {
          unlocked: unlockedAchievements,
          count: unlockedAchievements.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = progressionController;