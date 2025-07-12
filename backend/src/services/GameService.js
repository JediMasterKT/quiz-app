'use strict';

const { User, GameSession, Question, Category } = require('../models');
const progressionService = require('./ProgressionService');
const achievementService = require('./AchievementService');
const leaderboardService = require('./LeaderboardService');
const socketManager = require('../websocket/socketManager');

class GameService {
  async completeQuiz(userId, gameData) {
    const {
      categoryId,
      questionsAnswered,
      correctAnswers,
      score,
      timeTaken,
      difficulty,
      roomId = null
    } = gameData;

    try {
      const user = await User.findByPk(userId);
      if (!user) throw new Error('User not found');

      const category = await Category.findByPk(categoryId);
      if (!category) throw new Error('Category not found');

      const perfectGame = questionsAnswered === correctAnswers;
      const won = correctAnswers >= (questionsAnswered * 0.5); // Win if 50% or more correct

      const xpEarned = await progressionService.calculateXP(userId, {
        questionsCorrect: correctAnswers,
        totalQuestions: questionsAnswered,
        difficulty,
        timePerQuestion: timeTaken,
        categoryId,
        baseScore: score
      });

      const session = await GameSession.create({
        userId,
        categoryId,
        roomId,
        score,
        questionsAnswered,
        correctAnswers,
        timeTaken,
        difficulty,
        won,
        xpEarned,
        sessionData: {
          perfectGame,
          averageTimePerQuestion: timeTaken / questionsAnswered,
          accuracy: (correctAnswers / questionsAnswered) * 100
        }
      });

      user.totalScore += score;
      user.gamesPlayed += 1;
      if (won) user.gamesWon += 1;
      await user.save();

      await progressionService.updateGameStatistics(userId, {
        questionsCorrect: correctAnswers,
        totalQuestions: questionsAnswered,
        difficulty,
        categoryId,
        timeTaken,
        perfectGame
      });

      const progressionUpdate = await progressionService.updateUserProgression(userId, xpEarned);

      await leaderboardService.updateLeaderboard(userId, score, xpEarned, categoryId);

      const achievementContext = {
        gameScore: score,
        userLevel: user.level,
        perfectGame,
        difficulty,
        categoryId,
        timeTaken,
        questionsAnswered,
        correctAnswers
      };

      const unlockedAchievements = await achievementService.checkAchievements(userId, achievementContext);

      socketManager.broadcastQuizCompletion(userId, {
        username: user.username,
        score,
        category: category.name,
        xpEarned
      });

      const userStats = await progressionService.getUserProgression(userId);
      
      if (userStats.statistics && userStats.statistics.currentStreak > 0 && 
          userStats.statistics.currentStreak % 7 === 0) {
        socketManager.broadcastStreakMilestone(userId, {
          username: user.username,
          currentStreak: userStats.statistics.currentStreak
        });
      }

      return {
        session: session.toJSON(),
        progression: progressionUpdate,
        achievements: unlockedAchievements,
        stats: {
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          winRate: ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2)
        }
      };
    } catch (error) {
      console.error('Error completing quiz:', error);
      throw error;
    }
  }

  async getGameSession(sessionId) {
    const session = await GameSession.findByPk(sessionId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'avatarUrl']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon']
        }
      ]
    });

    if (!session) throw new Error('Game session not found');

    return session;
  }

  async getUserGameHistory(userId, limit = 10, offset = 0) {
    const sessions = await GameSession.findAll({
      where: { userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const total = await GameSession.count({ where: { userId } });

    return {
      sessions: sessions.map(s => s.toJSON()),
      total,
      limit,
      offset
    };
  }

  async getCategoryStats(userId, categoryId) {
    const sessions = await GameSession.findAll({
      where: { userId, categoryId },
      attributes: [
        'score',
        'questionsAnswered',
        'correctAnswers',
        'timeTaken',
        'won'
      ]
    });

    if (sessions.length === 0) {
      return {
        gamesPlayed: 0,
        totalScore: 0,
        averageScore: 0,
        accuracy: 0,
        wins: 0,
        averageTime: 0
      };
    }

    const stats = sessions.reduce((acc, session) => {
      acc.totalScore += session.score;
      acc.totalQuestions += session.questionsAnswered;
      acc.totalCorrect += session.correctAnswers;
      acc.totalTime += session.timeTaken;
      acc.wins += session.won ? 1 : 0;
      return acc;
    }, {
      totalScore: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalTime: 0,
      wins: 0
    });

    return {
      gamesPlayed: sessions.length,
      totalScore: stats.totalScore,
      averageScore: Math.round(stats.totalScore / sessions.length),
      accuracy: ((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(2),
      wins: stats.wins,
      winRate: ((stats.wins / sessions.length) * 100).toFixed(2),
      averageTime: Math.round(stats.totalTime / sessions.length)
    };
  }
}

module.exports = new GameService();