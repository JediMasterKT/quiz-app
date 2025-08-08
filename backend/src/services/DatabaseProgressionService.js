const { User, sequelize } = require('../models');

class DatabaseProgressionService {
  async getUserProgression(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'level', 'totalXp', 'currentXp']
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate next level XP requirement
      const nextLevelXp = user.level * 100;

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          level: user.level || 1,
          totalXp: user.totalXp || 0,
          currentLevelXp: user.currentXp || 0,
          nextLevelXp
        }
      };
    } catch (error) {
      console.error('Error getting user progression:', error);
      throw error;
    }
  }

  async calculateXP(userId, gameData) {
    const { questionsCorrect = 0, totalQuestions = 10, difficulty = 'medium' } = gameData;
    
    let xp = questionsCorrect * 10;
    
    const difficultyMultipliers = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5
    };
    
    xp *= difficultyMultipliers[difficulty] || 1.0;
    
    // Perfect game bonus
    if (questionsCorrect === totalQuestions) {
      xp *= 1.5;
    }
    
    return Math.floor(xp);
  }

  async updateUserProgression(userId, earnedXP) {
    const t = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction: t });
      
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize if needed
      if (user.level === null) user.level = 1;
      if (user.totalXp === null) user.totalXp = 0;
      if (user.currentXp === null) user.currentXp = 0;

      // Add XP
      user.totalXp += earnedXP;
      user.currentXp += earnedXP;

      // Check for level up
      let leveledUp = false;
      
      while (user.currentXp >= user.level * 100) {
        user.currentXp -= user.level * 100;
        user.level++;
        leveledUp = true;
      }

      await user.save({ transaction: t });
      await t.commit();

      return {
        totalXP: user.totalXp,
        level: user.level,
        currentLevelXP: user.currentXp,
        nextLevelXP: user.level * 100,
        leveledUp
      };
    } catch (error) {
      await t.rollback();
      console.error('Error updating user progression:', error);
      throw error;
    }
  }

  async updateGameStatistics(userId, gameData) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // For now, just return success
      // In a full implementation, you'd update user statistics table
      return {
        success: true,
        message: 'Statistics updated'
      };
    } catch (error) {
      console.error('Error updating statistics:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseProgressionService();