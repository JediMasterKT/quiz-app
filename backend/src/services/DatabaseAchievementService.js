const { Achievement, UserAchievement, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class DatabaseAchievementService {
  constructor() {
    // Define achievement criteria
    this.achievementCriteria = {
      'first_quiz': { type: 'quiz_completed', count: 1 },
      'perfect_score': { type: 'perfect_game', count: 1 },
      'streak_master': { type: 'streak', count: 5 },
      'knowledge_seeker': { type: 'quiz_completed', count: 10 },
      'quiz_champion': { type: 'level_reached', level: 10 },
      'speed_demon': { type: 'quick_completion', seconds: 60 },
      'accuracy_expert': { type: 'accuracy', percentage: 95 },
      'daily_player': { type: 'daily_streak', days: 7 },
      'category_master': { type: 'category_completed', count: 10 },
      'xp_collector': { type: 'total_xp', amount: 1000 }
    };
  }

  async getUserAchievements(userId) {
    try {
      const userAchievements = await UserAchievement.findAll({
        where: { userId },
        include: [{
          model: Achievement,
          as: 'achievement',
          attributes: ['id', 'name', 'description', 'icon', 'xpReward', 'rarity', 'category']
        }],
        order: [['earned_at', 'DESC']]
      });

      // Get all achievements to show locked ones too
      const allAchievements = await Achievement.findAll({
        where: { isActive: true },
        attributes: ['id', 'name', 'description', 'icon', 'xpReward', 'rarity', 'category']
      });

      const earnedIds = userAchievements.map(ua => ua.achievementId);
      
      const achievements = allAchievements.map(achievement => {
        const earned = earnedIds.includes(achievement.id);
        const userAch = userAchievements.find(ua => ua.achievementId === achievement.id);
        
        return {
          ...achievement.toJSON(),
          earned,
          earnedAt: earned ? userAch.earnedAt : null,
          progress: userAch ? userAch.progress : 0
        };
      });

      return {
        total: allAchievements.length,
        earned: earnedIds.length,
        achievements
      };
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  async checkAndGrantAchievements(userId, gameData) {
    const newAchievements = [];
    const t = await sequelize.transaction();

    try {
      // Get user's current state
      const user = await User.findByPk(userId);
      const existingAchievements = await UserAchievement.findAll({
        where: { userId },
        attributes: ['achievementId']
      });
      const earnedIds = existingAchievements.map(ua => ua.achievementId);

      // Check First Quiz
      if (!earnedIds.includes(1) && gameData.questionsCorrect > 0) {
        const achievement = await this.grantAchievement(userId, 1, t);
        if (achievement) newAchievements.push(achievement);
      }

      // Check Perfect Score
      if (!earnedIds.includes(2) && gameData.perfectGame) {
        const achievement = await this.grantAchievement(userId, 2, t);
        if (achievement) newAchievements.push(achievement);
      }

      // Check Level-based achievements
      if (user.level >= 10 && !earnedIds.includes(5)) {
        const achievement = await this.grantAchievement(userId, 5, t);
        if (achievement) newAchievements.push(achievement);
      }

      // Check XP Collector (1000+ XP)
      if (user.totalXp >= 1000 && !earnedIds.includes(10)) {
        const achievement = await this.grantAchievement(userId, 10, t);
        if (achievement) newAchievements.push(achievement);
      }

      // Check Speed Demon (complete quiz in under 60 seconds)
      if (gameData.timeTaken && gameData.timeTaken < 60 && !earnedIds.includes(6)) {
        const achievement = await this.grantAchievement(userId, 6, t);
        if (achievement) newAchievements.push(achievement);
      }

      // Check Accuracy Expert (95%+ accuracy)
      const accuracy = (gameData.questionsCorrect / gameData.totalQuestions) * 100;
      if (accuracy >= 95 && !earnedIds.includes(7)) {
        const achievement = await this.grantAchievement(userId, 7, t);
        if (achievement) newAchievements.push(achievement);
      }

      await t.commit();

      // Add XP rewards for new achievements
      if (newAchievements.length > 0) {
        const totalXpReward = newAchievements.reduce((sum, ach) => sum + (ach.xpReward || 0), 0);
        if (totalXpReward > 0) {
          // Update user's XP
          await user.increment('totalXp', { by: totalXpReward });
          await user.increment('currentXp', { by: totalXpReward });
        }
      }

      return newAchievements;
    } catch (error) {
      await t.rollback();
      console.error('Error checking achievements:', error);
      throw error;
    }
  }

  async grantAchievement(userId, achievementId, transaction) {
    try {
      // Check if already earned
      const existing = await UserAchievement.findOne({
        where: { userId, achievementId },
        transaction
      });

      if (existing) return null;

      // Get achievement details
      const achievement = await Achievement.findByPk(achievementId, { transaction });
      if (!achievement) return null;

      // Grant achievement
      await UserAchievement.create({
        userId,
        achievementId,
        earnedAt: new Date(),
        metadata: { grantedAt: new Date().toISOString() }
      }, { transaction });

      return achievement.toJSON();
    } catch (error) {
      console.error('Error granting achievement:', error);
      throw error;
    }
  }

  async updateAchievementProgress(userId, achievementId, progress) {
    try {
      const [userAchievement, created] = await UserAchievement.findOrCreate({
        where: { userId, achievementId },
        defaults: {
          progress,
          earnedAt: progress >= 100 ? new Date() : null
        }
      });

      if (!created && userAchievement.progress < 100) {
        userAchievement.progress = progress;
        if (progress >= 100) {
          userAchievement.earnedAt = new Date();
        }
        await userAchievement.save();
      }

      return userAchievement;
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      throw error;
    }
  }

  async getAchievementStats(userId) {
    try {
      const stats = await UserAchievement.findAll({
        where: { userId },
        include: [{
          model: Achievement,
          as: 'achievement',
          attributes: ['rarity', 'xpReward', 'category']
        }],
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('UserAchievement.id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('achievement.xp_reward')), 'totalXpEarned']
        ],
        group: ['achievement.rarity'],
        raw: true
      });

      const byCategory = await UserAchievement.findAll({
        where: { userId },
        include: [{
          model: Achievement,
          as: 'achievement',
          attributes: ['category']
        }],
        attributes: [
          'achievement.category',
          [sequelize.fn('COUNT', sequelize.col('UserAchievement.id')), 'count']
        ],
        group: ['achievement.category'],
        raw: true
      });

      return {
        totalEarned: stats.reduce((sum, s) => sum + parseInt(s.total || 0), 0),
        totalXpEarned: stats.reduce((sum, s) => sum + parseInt(s.totalXpEarned || 0), 0),
        byRarity: {
          common: stats.find(s => s['achievement.rarity'] === 'common')?.total || 0,
          rare: stats.find(s => s['achievement.rarity'] === 'rare')?.total || 0,
          epic: stats.find(s => s['achievement.rarity'] === 'epic')?.total || 0,
          legendary: stats.find(s => s['achievement.rarity'] === 'legendary')?.total || 0
        },
        byCategory
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      throw error;
    }
  }

  async seedAchievements() {
    try {
      const achievements = [
        { id: 1, name: 'First Steps', description: 'Complete your first quiz', icon: '🎯', xpReward: 10, rarity: 'common' },
        { id: 2, name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '⭐', xpReward: 50, rarity: 'rare' },
        { id: 3, name: 'Streak Master', description: 'Complete 5 quizzes in a row', icon: '🔥', xpReward: 100, rarity: 'rare' },
        { id: 4, name: 'Knowledge Seeker', description: 'Complete 10 quizzes', icon: '📚', xpReward: 200, rarity: 'epic' },
        { id: 5, name: 'Quiz Champion', description: 'Reach level 10', icon: '🏆', xpReward: 500, rarity: 'legendary' },
        { id: 6, name: 'Speed Demon', description: 'Complete a quiz in under 60 seconds', icon: '⚡', xpReward: 75, rarity: 'rare' },
        { id: 7, name: 'Accuracy Expert', description: 'Get 95% or higher accuracy', icon: '🎯', xpReward: 100, rarity: 'epic' },
        { id: 8, name: 'Daily Player', description: 'Play for 7 days in a row', icon: '📅', xpReward: 150, rarity: 'epic' },
        { id: 9, name: 'Category Master', description: 'Complete 10 quizzes in one category', icon: '🏅', xpReward: 200, rarity: 'epic' },
        { id: 10, name: 'XP Collector', description: 'Earn 1000 total XP', icon: '💎', xpReward: 300, rarity: 'legendary' }
      ];

      for (const achievement of achievements) {
        await Achievement.findOrCreate({
          where: { id: achievement.id },
          defaults: achievement
        });
      }

      console.log('Achievements seeded successfully');
    } catch (error) {
      console.error('Error seeding achievements:', error);
    }
  }
}

module.exports = new DatabaseAchievementService();