'use strict';

const { Achievement, UserAchievement, UserStatistics } = require('../models');
const { Op } = require('sequelize');
const progressionService = require('./ProgressionService');

class AchievementService {
  constructor() {
    this.achievementCheckers = {
      gameplay: this.checkGameplayAchievements.bind(this),
      progression: this.checkProgressionAchievements.bind(this),
      streak: this.checkStreakAchievements.bind(this),
      social: this.checkSocialAchievements.bind(this),
      special: this.checkSpecialAchievements.bind(this)
    };
  }

  async checkAchievements(userId, context = {}) {
    const unlockedAchievements = [];
    
    const achievements = await Achievement.findAll({
      where: { isActive: true }
    });

    const userAchievements = await UserAchievement.findAll({
      where: { userId },
      attributes: ['achievementId']
    });

    const earnedIds = userAchievements.map(ua => ua.achievementId);
    const unearnedAchievements = achievements.filter(a => !earnedIds.includes(a.id));

    for (const achievement of unearnedAchievements) {
      const checker = this.achievementCheckers[achievement.category];
      if (checker) {
        const earned = await checker(userId, achievement, context);
        if (earned) {
          await progressionService.grantAchievement(userId, achievement.id);
          unlockedAchievements.push(achievement);
        }
      }
    }

    await this.updateAchievementProgress(userId, unearnedAchievements, context);

    return unlockedAchievements;
  }

  async checkGameplayAchievements(userId, achievement, context) {
    const { criteria } = achievement;
    const userStats = await UserStatistics.findOne({ where: { userId } });
    
    if (!userStats) return false;

    switch (criteria.type) {
      case 'perfect_games':
        return userStats.perfectGames >= criteria.value;
      
      case 'questions_answered':
        return userStats.questionsAnswered >= criteria.value;
      
      case 'correct_answers':
        return userStats.correctAnswers >= criteria.value;
      
      case 'accuracy':
        const accuracy = userStats.getAccuracy();
        return accuracy >= criteria.value && userStats.questionsAnswered >= criteria.minQuestions;
      
      case 'category_master':
        const categoryStats = userStats.categoriesPlayed[criteria.categoryId];
        if (!categoryStats) return false;
        const categoryAccuracy = (categoryStats.correct / categoryStats.played) * 100;
        return categoryStats.played >= criteria.minGames && categoryAccuracy >= criteria.accuracy;
      
      case 'speed_demon':
        return userStats.fastestAnswerTime && userStats.fastestAnswerTime <= criteria.value;
      
      case 'single_game_score':
        return context.gameScore && context.gameScore >= criteria.value;
      
      default:
        return false;
    }
  }

  async checkProgressionAchievements(userId, achievement, context) {
    const { criteria } = achievement;
    const userStats = await UserStatistics.findOne({ where: { userId } });
    
    if (!userStats) return false;

    switch (criteria.type) {
      case 'level':
        return context.userLevel && context.userLevel >= criteria.value;
      
      case 'total_xp':
        return userStats.totalXp >= criteria.value;
      
      case 'achievements_earned':
        return userStats.achievementsEarned >= criteria.value;
      
      default:
        return false;
    }
  }

  async checkStreakAchievements(userId, achievement, context) {
    const { criteria } = achievement;
    const userStats = await UserStatistics.findOne({ where: { userId } });
    
    if (!userStats) return false;

    switch (criteria.type) {
      case 'current_streak':
        return userStats.currentStreak >= criteria.value;
      
      case 'longest_streak':
        return userStats.longestStreak >= criteria.value;
      
      case 'weekly_streak':
        const daysPlayedThisWeek = await this.getDaysPlayedThisWeek(userId);
        return daysPlayedThisWeek >= criteria.value;
      
      default:
        return false;
    }
  }

  async checkSocialAchievements(userId, achievement, context) {
    const { criteria } = achievement;
    
    switch (criteria.type) {
      case 'multiplayer_wins':
        return context.multiplayerWins && context.multiplayerWins >= criteria.value;
      
      case 'leaderboard_rank':
        return context.leaderboardRank && context.leaderboardRank <= criteria.value;
      
      default:
        return false;
    }
  }

  async checkSpecialAchievements(userId, achievement, context) {
    const { criteria } = achievement;
    
    switch (criteria.type) {
      case 'event':
        return context.eventId === criteria.eventId;
      
      case 'date':
        const today = new Date().toISOString().split('T')[0];
        return today === criteria.date;
      
      case 'time_played':
        const userStats = await UserStatistics.findOne({ where: { userId } });
        return userStats && userStats.totalTimePlayed >= criteria.value;
      
      default:
        return false;
    }
  }

  async updateAchievementProgress(userId, unearnedAchievements, context) {
    for (const achievement of unearnedAchievements) {
      if (achievement.criteria.trackProgress) {
        let progress = await UserAchievement.findOne({
          where: { userId, achievementId: achievement.id }
        });

        if (!progress) {
          progress = await UserAchievement.create({
            userId,
            achievementId: achievement.id,
            progress: 0,
            earnedAt: null
          });
        }

        const newProgress = await this.calculateProgress(userId, achievement, context);
        if (newProgress > progress.progress) {
          progress.progress = newProgress;
          progress.progressData = {
            ...progress.progressData,
            lastUpdated: new Date(),
            context
          };
          await progress.save();
        }
      }
    }
  }

  async calculateProgress(userId, achievement, context) {
    const { criteria } = achievement;
    const userStats = await UserStatistics.findOne({ where: { userId } });
    
    if (!userStats) return 0;

    switch (criteria.type) {
      case 'questions_answered':
        return Math.min((userStats.questionsAnswered / criteria.value) * 100, 100);
      
      case 'perfect_games':
        return Math.min((userStats.perfectGames / criteria.value) * 100, 100);
      
      case 'total_xp':
        return Math.min((userStats.totalXp / criteria.value) * 100, 100);
      
      default:
        return 0;
    }
  }

  async getDaysPlayedThisWeek(userId) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // This would require tracking daily activity in a separate table
    // For now, return based on current streak if within the week
    const userStats = await UserStatistics.findOne({ where: { userId } });
    if (!userStats) return 0;

    const daysSinceWeekStart = Math.floor((new Date() - weekStart) / (1000 * 60 * 60 * 24));
    return Math.min(userStats.currentStreak, daysSinceWeekStart + 1);
  }

  async getUserAchievements(userId) {
    const achievements = await Achievement.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['id', 'ASC']]
    });

    const userAchievements = await UserAchievement.findAll({
      where: { userId },
      include: [{
        model: Achievement,
        as: 'achievement'
      }]
    });

    const earnedMap = {};
    userAchievements.forEach(ua => {
      earnedMap[ua.achievementId] = {
        earnedAt: ua.earnedAt,
        progress: ua.progress,
        progressData: ua.progressData
      };
    });

    const categorized = {};
    achievements.forEach(achievement => {
      if (!categorized[achievement.category]) {
        categorized[achievement.category] = [];
      }

      const achievementData = achievement.toJSON();
      if (earnedMap[achievement.id]) {
        achievementData.earned = true;
        achievementData.earnedAt = earnedMap[achievement.id].earnedAt;
        achievementData.progress = 100;
      } else {
        achievementData.earned = false;
        achievementData.progress = earnedMap[achievement.id]?.progress || 0;
      }

      categorized[achievement.category].push(achievementData);
    });

    const stats = {
      total: achievements.length,
      earned: userAchievements.filter(ua => ua.earnedAt).length,
      progress: Math.round((userAchievements.filter(ua => ua.earnedAt).length / achievements.length) * 100)
    };

    return {
      stats,
      achievements: categorized
    };
  }

  async initializeDefaultAchievements() {
    const defaultAchievements = [
      // Gameplay Achievements
      {
        code: 'first_perfect',
        name: 'Perfect Score',
        description: 'Get a perfect score in any quiz',
        icon: 'star',
        category: 'gameplay',
        rarity: 'common',
        xpReward: 50,
        criteria: { type: 'perfect_games', value: 1 }
      },
      {
        code: 'quiz_master',
        name: 'Quiz Master',
        description: 'Answer 100 questions correctly',
        icon: 'brain',
        category: 'gameplay',
        rarity: 'common',
        xpReward: 100,
        criteria: { type: 'correct_answers', value: 100, trackProgress: true }
      },
      {
        code: 'speed_demon',
        name: 'Speed Demon',
        description: 'Answer a question in under 3 seconds',
        icon: 'lightning',
        category: 'gameplay',
        rarity: 'rare',
        xpReward: 75,
        criteria: { type: 'speed_demon', value: 3 }
      },
      
      // Progression Achievements
      {
        code: 'level_10',
        name: 'Rising Star',
        description: 'Reach level 10',
        icon: 'medal',
        category: 'progression',
        rarity: 'common',
        xpReward: 200,
        criteria: { type: 'level', value: 10 }
      },
      {
        code: 'level_25',
        name: 'Expert Quizzer',
        description: 'Reach level 25',
        icon: 'trophy',
        category: 'progression',
        rarity: 'rare',
        xpReward: 500,
        criteria: { type: 'level', value: 25 }
      },
      
      // Streak Achievements
      {
        code: 'week_streak',
        name: 'Dedicated Player',
        description: 'Play for 7 days in a row',
        icon: 'fire',
        category: 'streak',
        rarity: 'common',
        xpReward: 150,
        criteria: { type: 'current_streak', value: 7 }
      },
      {
        code: 'month_streak',
        name: 'Quiz Addict',
        description: 'Play for 30 days in a row',
        icon: 'flame',
        category: 'streak',
        rarity: 'epic',
        xpReward: 1000,
        criteria: { type: 'current_streak', value: 30 }
      }
    ];

    for (const achievement of defaultAchievements) {
      await Achievement.findOrCreate({
        where: { code: achievement.code },
        defaults: achievement
      });
    }
  }
}

module.exports = new AchievementService();