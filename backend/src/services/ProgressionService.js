'use strict';

const { User, UserStatistics, XpLevel, UserAchievement, Achievement } = require('../models');
const { Op } = require('sequelize');
const socketManager = require('../websocket/socketManager');

class ProgressionService {
  constructor() {
    this.xpMultipliers = {
      difficulty: {
        easy: 1,
        medium: 1.5,
        hard: 2
      },
      performance: {
        perfect: 1.5,
        fast: 1.2,
        streak: 1.1
      }
    };
  }

  async calculateXP(userId, gameData) {
    const {
      questionsCorrect,
      totalQuestions,
      difficulty,
      timePerQuestion,
      categoryId,
      baseScore
    } = gameData;

    let xp = 0;
    
    const correctPercentage = (questionsCorrect / totalQuestions) * 100;
    xp += questionsCorrect * 10;
    
    const difficultyMultiplier = this.xpMultipliers.difficulty[difficulty] || 1;
    xp *= difficultyMultiplier;
    
    if (correctPercentage === 100) {
      xp *= this.xpMultipliers.performance.perfect;
    }
    
    const avgTimePerQuestion = timePerQuestion / totalQuestions;
    if (avgTimePerQuestion < 10) {
      xp *= this.xpMultipliers.performance.fast;
    }
    
    const userStats = await UserStatistics.findOne({ where: { userId } });
    if (userStats && userStats.currentStreak > 0) {
      xp *= this.xpMultipliers.performance.streak;
    }
    
    xp += baseScore * 0.1;
    
    return Math.round(xp);
  }

  async updateUserProgression(userId, earnedXP) {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const previousLevel = user.level;
    user.totalXp += earnedXP;

    const userStats = await UserStatistics.findOne({ where: { userId } });
    if (userStats) {
      userStats.totalXp = user.totalXp;
      userStats.weeklyXp += earnedXP;
      userStats.monthlyXp += earnedXP;
    }

    const levelInfo = await this.calculateLevel(user.totalXp);
    user.level = levelInfo.level;
    user.currentLevelXp = levelInfo.currentLevelXp;
    user.nextLevelXp = levelInfo.nextLevelXp;
    user.levelProgress = levelInfo.progress;
    user.title = levelInfo.title;

    await user.save();
    if (userStats) await userStats.save();

    const leveledUp = user.level > previousLevel;
    if (leveledUp) {
      await this.checkLevelAchievements(userId, user.level);
      
      socketManager.emitLevelUp(userId, {
        username: user.username,
        level: user.level,
        previousLevel,
        title: user.title
      });
    }

    const progressionData = {
      earnedXP,
      totalXP: user.totalXp,
      level: user.level,
      currentLevelXP: user.currentLevelXp,
      nextLevelXP: user.nextLevelXp,
      progress: user.levelProgress,
      title: user.title,
      leveledUp,
      previousLevel
    };

    socketManager.emitProgressionUpdate(userId, progressionData);

    return progressionData;
  }

  async calculateLevel(totalXP) {
    const xpLevels = await XpLevel.findAll({
      order: [['level', 'ASC']]
    });

    let currentLevel = null;
    for (const level of xpLevels) {
      if (totalXP >= level.minXp && totalXP <= level.maxXp) {
        currentLevel = level;
        break;
      }
    }

    if (!currentLevel && xpLevels.length > 0) {
      const maxLevel = xpLevels[xpLevels.length - 1];
      if (totalXP > maxLevel.maxXp) {
        currentLevel = maxLevel;
      } else {
        currentLevel = xpLevels[0];
      }
    }

    if (!currentLevel) {
      return {
        level: 1,
        currentLevelXp: totalXP,
        nextLevelXp: 100,
        progress: totalXP / 100,
        title: 'Novice'
      };
    }

    const currentLevelXp = totalXP - currentLevel.minXp;
    const levelRange = currentLevel.maxXp - currentLevel.minXp;
    const progress = currentLevelXp / levelRange;

    return {
      level: currentLevel.level,
      currentLevelXp,
      nextLevelXp: currentLevel.maxXp - totalXP,
      progress: Math.min(progress, 1),
      title: currentLevel.title
    };
  }

  async updateGameStatistics(userId, gameData) {
    const {
      questionsCorrect,
      totalQuestions,
      difficulty,
      categoryId,
      timeTaken,
      perfectGame
    } = gameData;

    let userStats = await UserStatistics.findOne({ where: { userId } });
    
    if (!userStats) {
      userStats = await UserStatistics.create({ userId });
    }

    userStats.questionsAnswered += totalQuestions;
    userStats.correctAnswers += questionsCorrect;
    userStats.totalTimePlayed += timeTaken;

    if (perfectGame) {
      userStats.perfectGames += 1;
    }

    const difficultyKey = difficulty.toLowerCase();
    if (userStats.difficultyStats[difficultyKey]) {
      userStats.difficultyStats[difficultyKey].played += 1;
      userStats.difficultyStats[difficultyKey].correct += questionsCorrect;
    }

    if (!userStats.categoriesPlayed[categoryId]) {
      userStats.categoriesPlayed[categoryId] = {
        played: 0,
        correct: 0,
        totalTime: 0
      };
    }
    userStats.categoriesPlayed[categoryId].played += 1;
    userStats.categoriesPlayed[categoryId].correct += questionsCorrect;
    userStats.categoriesPlayed[categoryId].totalTime += timeTaken;

    const avgTimePerQuestion = timeTaken / totalQuestions;
    if (!userStats.fastestAnswerTime || avgTimePerQuestion < userStats.fastestAnswerTime) {
      userStats.fastestAnswerTime = avgTimePerQuestion;
    }

    await this.updateStreaks(userStats);

    await userStats.save();
    return userStats;
  }

  async updateStreaks(userStats) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = userStats.lastActivityDate;
    
    if (!lastActivity) {
      userStats.currentStreak = 1;
      userStats.longestStreak = 1;
    } else {
      const lastActivityDate = new Date(lastActivity);
      lastActivityDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change to streak
      } else if (daysDiff === 1) {
        userStats.currentStreak += 1;
        if (userStats.currentStreak > userStats.longestStreak) {
          userStats.longestStreak = userStats.currentStreak;
        }
      } else {
        userStats.currentStreak = 1;
      }
    }

    userStats.lastActivityDate = new Date();
  }

  async checkLevelAchievements(userId, newLevel) {
    const levelAchievements = await Achievement.findAll({
      where: {
        category: 'progression',
        'criteria.type': 'level',
        'criteria.value': { [Op.lte]: newLevel }
      }
    });

    for (const achievement of levelAchievements) {
      await this.grantAchievement(userId, achievement.id);
    }
  }

  async grantAchievement(userId, achievementId) {
    const existing = await UserAchievement.findOne({
      where: { userId, achievementId }
    });

    if (!existing) {
      await UserAchievement.create({
        userId,
        achievementId,
        earnedAt: new Date()
      });

      const achievement = await Achievement.findByPk(achievementId);
      if (achievement && achievement.xpReward > 0) {
        await this.updateUserProgression(userId, achievement.xpReward);
      }

      const userStats = await UserStatistics.findOne({ where: { userId } });
      if (userStats) {
        userStats.achievementsEarned += 1;
        await userStats.save();
      }

      socketManager.emitAchievementUnlocked(userId, achievement.toJSON());

      return true;
    }

    return false;
  }

  async getUserProgression(userId) {
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'username', 'level', 'totalXp', 
        'currentLevelXp', 'nextLevelXp', 'levelProgress', 'title'
      ]
    });

    if (!user) throw new Error('User not found');

    const userStats = await UserStatistics.findOne({
      where: { userId },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    });

    const recentAchievements = await UserAchievement.findAll({
      where: { userId },
      include: [{
        model: Achievement,
        as: 'achievement',
        attributes: ['name', 'description', 'icon', 'rarity', 'xpReward']
      }],
      order: [['earnedAt', 'DESC']],
      limit: 5
    });

    return {
      user: user.toJSON(),
      statistics: userStats ? userStats.toJSON() : null,
      recentAchievements: recentAchievements.map(ua => ({
        ...ua.achievement.toJSON(),
        earnedAt: ua.earnedAt
      }))
    };
  }
}

module.exports = new ProgressionService();