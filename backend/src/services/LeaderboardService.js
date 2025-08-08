'use strict';

const { LeaderboardEntry, User, UserStatistics } = require('../models');
const { Op } = require('sequelize');
const redis = require('redis');
const socketManager = require('../websocket/socketManager');

class LeaderboardService {
  constructor() {
    this.redisClient = null;
    this.initRedis();
    this.leaderboardTypes = ['daily', 'weekly', 'monthly', 'all_time'];
    this.cacheExpiry = {
      daily: 3600,      // 1 hour
      weekly: 7200,     // 2 hours
      monthly: 14400,   // 4 hours
      all_time: 86400   // 24 hours
    };
  }

  async initRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 5000)
        }
      });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.redisClient = null;
      });

      this.redisClient.on('connect', () => {
        console.log('Redis connected for leaderboard caching');
      });

      await this.redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis, falling back to database:', error);
      this.redisClient = null;
    }
  }

  async getCachedLeaderboard(key) {
    if (!this.redisClient) return null;
    
    try {
      const cached = await this.redisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setCachedLeaderboard(key, data, expiry) {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.setEx(key, expiry, JSON.stringify(data));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async invalidateCache(categoryId = null) {
    if (!this.redisClient) return;
    
    try {
      const pattern = categoryId ? `leaderboard:*:${categoryId}` : 'leaderboard:*';
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }
  }

  async updateLeaderboard(userId, score, xpEarned, categoryId = null) {
    const updates = [];

    for (const type of this.leaderboardTypes) {
      const period = this.getPeriodDates(type);
      
      const existingEntry = await LeaderboardEntry.findOne({
        where: {
          userId,
          leaderboardType: type,
          categoryId,
          periodStart: period.start,
          periodEnd: period.end
        }
      });

      if (existingEntry) {
        existingEntry.score += score;
        existingEntry.xpEarned += xpEarned;
        existingEntry.gamesPlayed += 1;
        await existingEntry.save();
        updates.push(existingEntry);
      } else {
        const newEntry = await LeaderboardEntry.create({
          userId,
          leaderboardType: type,
          categoryId,
          score,
          xpEarned,
          gamesPlayed: 1,
          periodStart: period.start,
          periodEnd: period.end
        });
        updates.push(newEntry);
      }
    }

    await this.updateRanks();
    await this.invalidateCache(categoryId);

    // Emit leaderboard updates for each type
    for (const type of this.leaderboardTypes) {
      const leaderboardData = await this.getLeaderboard(type, categoryId, 20);
      socketManager.emitLeaderboardUpdate(type, leaderboardData);
    }

    return updates;
  }

  getPeriodDates(type) {
    const now = new Date();
    let start, end;

    switch (type) {
      case 'daily':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 1);
        break;

      case 'weekly':
        start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        break;

      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      case 'all_time':
        start = new Date('2000-01-01');
        end = new Date('2100-01-01');
        break;
    }

    return { start, end };
  }

  async updateRanks() {
    for (const type of this.leaderboardTypes) {
      const period = this.getPeriodDates(type);
      
      const entries = await LeaderboardEntry.findAll({
        where: {
          leaderboardType: type,
          periodStart: period.start,
          periodEnd: period.end
        },
        order: [['score', 'DESC'], ['xpEarned', 'DESC']]
      });

      let currentRank = 1;
      let previousScore = null;
      let sameRankCount = 0;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        if (previousScore !== null && entry.score < previousScore) {
          currentRank += sameRankCount;
          sameRankCount = 1;
        } else if (entry.score === previousScore) {
          sameRankCount++;
        } else {
          sameRankCount = 1;
        }

        entry.rank = currentRank;
        await entry.save();
        
        previousScore = entry.score;
      }
    }
  }

  async getLeaderboard(type, categoryId = null, limit = 100, offset = 0) {
    const cacheKey = `leaderboard:${type}:${categoryId || 'all'}:${limit}:${offset}`;
    
    // Try to get from cache first
    const cached = await this.getCachedLeaderboard(cacheKey);
    if (cached) {
      return cached;
    }

    const period = this.getPeriodDates(type);
    const where = {
      leaderboardType: type,
      periodStart: period.start,
      periodEnd: period.end
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const entries = await LeaderboardEntry.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'avatarUrl', 'level', 'title']
      }],
      order: [['rank', 'ASC']],
      limit,
      offset
    });

    const total = await LeaderboardEntry.count({ where });

    const leaderboardData = {
      type,
      categoryId,
      period: {
        start: period.start,
        end: period.end
      },
      entries: entries.map(entry => ({
        rank: entry.rank,
        userId: entry.userId,
        username: entry.user.username,
        avatarUrl: entry.user.avatarUrl,
        level: entry.user.level,
        title: entry.user.title,
        score: entry.score,
        xpEarned: entry.xpEarned,
        gamesPlayed: entry.gamesPlayed
      })),
      total,
      limit,
      offset
    };

    // Cache the result
    await this.setCachedLeaderboard(cacheKey, leaderboardData, this.cacheExpiry[type]);

    return leaderboardData;
  }

  async getUserAllRanks(userId) {
    const ranks = {};
    
    for (const type of this.leaderboardTypes) {
      const rank = await this.getUserRank(userId, type);
      ranks[type] = rank || { rank: null, score: 0, totalEntries: 0 };
    }
    
    return {
      globalRank: ranks.all_time?.rank,
      weeklyRank: ranks.weekly?.rank,
      monthlyRank: ranks.monthly?.rank,
      dailyRank: ranks.daily?.rank,
      ranks
    };
  }

  async getUserRank(userId, type, categoryId = null) {
    const period = this.getPeriodDates(type);
    const entry = await LeaderboardEntry.findOne({
      where: {
        userId,
        leaderboardType: type,
        categoryId,
        periodStart: period.start,
        periodEnd: period.end
      }
    });

    if (!entry) {
      return null;
    }

    const totalEntries = await LeaderboardEntry.count({
      where: {
        leaderboardType: type,
        categoryId,
        periodStart: period.start,
        periodEnd: period.end
      }
    });

    return {
      rank: entry.rank,
      score: entry.score,
      xpEarned: entry.xpEarned,
      gamesPlayed: entry.gamesPlayed,
      totalEntries,
      percentile: Math.round(((totalEntries - entry.rank + 1) / totalEntries) * 100)
    };
  }

  async getUserLeaderboardStats(userId) {
    const stats = {};

    for (const type of this.leaderboardTypes) {
      const period = this.getPeriodDates(type);
      const entries = await LeaderboardEntry.findAll({
        where: {
          userId,
          leaderboardType: type,
          periodStart: period.start,
          periodEnd: period.end
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }]
      });

      stats[type] = {
        global: null,
        categories: {}
      };

      for (const entry of entries) {
        const rankInfo = await this.getUserRank(userId, type, entry.categoryId);
        
        if (entry.categoryId === null) {
          stats[type].global = rankInfo;
        } else {
          stats[type].categories[entry.categoryId] = rankInfo;
        }
      }
    }

    return stats;
  }

  async getTopPlayers(limit = 10) {
    const topPlayers = await User.findAll({
      include: [{
        model: UserStatistics,
        as: 'statistics',
        attributes: ['totalXp', 'gamesPlayed', 'correctAnswers']
      }],
      order: [[{ model: UserStatistics, as: 'statistics' }, 'totalXp', 'DESC']],
      limit,
      attributes: ['id', 'username', 'avatarUrl', 'level', 'title']
    });

    return topPlayers.map((player, index) => ({
      rank: index + 1,
      id: player.id,
      username: player.username,
      avatarUrl: player.avatarUrl,
      level: player.level,
      title: player.title,
      totalXp: player.statistics?.totalXp || 0,
      gamesPlayed: player.statistics?.gamesPlayed || 0,
      accuracy: player.statistics ? 
        ((player.statistics.correctAnswers / (player.statistics.questionsAnswered || 1)) * 100).toFixed(1) : 0
    }));
  }

  async invalidateCache(categoryId = null) {
    if (!this.redisClient || !this.redisClient.isReady) return;

    try {
      const pattern = categoryId ? 
        `leaderboard:*:${categoryId}:*` : 
        'leaderboard:*';
      
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
      }
    } catch (error) {
      console.error('Redis invalidate cache error:', error);
    }
  }

  async cleanupOldEntries() {
    const cutoffDates = {
      daily: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),    // 7 days
      weekly: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),   // 30 days
      monthly: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)  // 1 year
    };

    for (const [type, cutoffDate] of Object.entries(cutoffDates)) {
      await LeaderboardEntry.destroy({
        where: {
          leaderboardType: type,
          periodEnd: { [Op.lt]: cutoffDate }
        }
      });
    }
  }
}

module.exports = new LeaderboardService();