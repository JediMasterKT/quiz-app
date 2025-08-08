class SimpleProgressionService {
  constructor() {
    // In-memory storage for progression data (temporary solution)
    this.userProgressData = {};
  }

  async getUserProgression(userId) {
    if (!this.userProgressData[userId]) {
      this.userProgressData[userId] = {
        level: 1,
        totalXp: 0,
        currentLevelXp: 0,
        nextLevelXp: 100,
        gamesPlayed: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        streak: 0
      };
    }

    return {
      user: this.userProgressData[userId]
    };
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
    if (!this.userProgressData[userId]) {
      await this.getUserProgression(userId);
    }

    const userData = this.userProgressData[userId];
    userData.totalXp += earnedXP;
    userData.currentLevelXp += earnedXP;

    // Simple level calculation (100 XP per level)
    while (userData.currentLevelXp >= userData.nextLevelXp) {
      userData.currentLevelXp -= userData.nextLevelXp;
      userData.level++;
      userData.nextLevelXp = userData.level * 100;
    }

    return {
      totalXP: userData.totalXp,
      level: userData.level,
      currentLevelXP: userData.currentLevelXp,
      nextLevelXP: userData.nextLevelXp,
      leveledUp: false
    };
  }

  async updateGameStatistics(userId, gameData) {
    if (!this.userProgressData[userId]) {
      await this.getUserProgression(userId);
    }

    const userData = this.userProgressData[userId];
    const { questionsCorrect = 0, totalQuestions = 10 } = gameData;

    userData.gamesPlayed++;
    userData.totalCorrect += questionsCorrect;
    userData.totalQuestions += totalQuestions;

    // Update streak
    if (questionsCorrect === totalQuestions) {
      userData.streak++;
    } else {
      userData.streak = 0;
    }

    return {
      gamesPlayed: userData.gamesPlayed,
      accuracy: userData.totalQuestions > 0 
        ? Math.round((userData.totalCorrect / userData.totalQuestions) * 100) 
        : 0,
      streak: userData.streak
    };
  }
}

module.exports = new SimpleProgressionService();