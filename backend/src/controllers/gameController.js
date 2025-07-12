const gameService = require('../services/gameService');
const { validationResult } = require('express-validator');

class GameController {
  /**
   * Start a new solo quiz session
   * POST /api/games/solo/start
   * Body: { categoryId?: number, difficultyLevel?: number, questionCount?: number }
   */
  async startSoloQuiz(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { categoryId, difficultyLevel, questionCount } = req.body;

      const sessionData = await gameService.startSoloQuiz(userId, {
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : undefined,
        questionCount: questionCount ? parseInt(questionCount) : 10
      });

      res.status(201).json({
        success: true,
        message: 'Solo quiz session started successfully',
        data: sessionData
      });
    } catch (error) {
      console.error('Error starting solo quiz:', error);
      
      if (error.message.includes('already has an active quiz session')) {
        return res.status(409).json({
          success: false,
          message: error.message,
          error: error.message
        });
      }
      
      res.status(400).json({
        success: false,
        message: error.message.includes('No questions available') 
          ? error.message 
          : 'Failed to start quiz session',
        error: error.message
      });
    }
  }

  /**
   * Submit an answer for the current question
   * POST /api/games/:sessionId/answer
   * Body: { answer: string, timeSpent?: number }
   */
  async submitAnswer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { answer, timeSpent } = req.body;
      const userId = req.user.id;

      const result = await gameService.submitAnswer(
        sessionId, 
        answer, 
        timeSpent ? parseInt(timeSpent) : 0,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Answer submitted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (error.message === 'Session is not active') {
        return res.status(400).json({
          success: false,
          message: 'Session is not active'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to submit answer',
        error: error.message
      });
    }
  }

  /**
   * Get current session state
   * GET /api/games/:sessionId/state
   */
  async getSessionState(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const sessionState = await gameService.getSessionState(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Session state retrieved successfully',
        data: sessionState
      });
    } catch (error) {
      console.error('Error getting session state:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session state',
        error: error.message
      });
    }
  }

  /**
   * Get next question in the session
   * GET /api/games/:sessionId/next-question
   */
  async getNextQuestion(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const questionData = await gameService.getNextQuestion(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Next question retrieved successfully',
        data: questionData
      });
    } catch (error) {
      console.error('Error getting next question:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (error.message === 'Session is not active') {
        return res.status(400).json({
          success: false,
          message: 'Session is not active'
        });
      }

      if (error.message === 'No more questions in this session') {
        return res.status(400).json({
          success: false,
          message: 'Quiz completed - no more questions available'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve next question',
        error: error.message
      });
    }
  }

  /**
   * Abandon/quit current session
   * POST /api/games/:sessionId/abandon
   */
  async abandonSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const result = await gameService.abandonSession(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Session abandoned successfully',
        data: result
      });
    } catch (error) {
      console.error('Error abandoning session:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (error.message === 'Session is not active') {
        return res.status(400).json({
          success: false,
          message: 'Session is not active'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to abandon session',
        error: error.message
      });
    }
  }

  /**
   * Resume an existing active session
   * GET /api/games/resume
   */
  async resumeSession(req, res) {
    try {
      const userId = req.user.id;

      const sessionState = await gameService.resumeSession(userId);

      if (!sessionState) {
        return res.status(404).json({
          success: false,
          message: 'No active session found to resume'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Active session found',
        data: sessionState
      });
    } catch (error) {
      console.error('Error resuming session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resume session',
        error: error.message
      });
    }
  }

  /**
   * Get user's session history
   * GET /api/games/sessions?limit=10&status=completed&categoryId=1
   */
  async getUserSessions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { limit, status, categoryId, difficultyLevel } = req.query;

      const limitValue = limit ? parseInt(limit) : 10;
      const filters = {};
      
      if (status) filters.status = status;
      if (categoryId) filters.categoryId = parseInt(categoryId);
      if (difficultyLevel) filters.difficultyLevel = parseInt(difficultyLevel);

      const sessions = await gameService.getUserSessions(userId, limitValue, filters);

      res.status(200).json({
        success: true,
        message: 'User sessions retrieved successfully',
        data: {
          sessions,
          count: sessions.length,
          filters: filters
        }
      });
    } catch (error) {
      console.error('Error getting user sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user sessions',
        error: error.message
      });
    }
  }

  /**
   * Get detailed session statistics
   * GET /api/games/:sessionId/stats
   */
  async getSessionStats(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      const stats = await gameService.getSessionStats(sessionId, userId);

      res.status(200).json({
        success: true,
        message: 'Session statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting session stats:', error);
      
      if (error.message === 'Session not found') {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (error.message.includes('Access denied')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session statistics',
        error: error.message
      });
    }
  }

  /**
   * Get available quiz configurations
   * GET /api/games/config
   */
  async getQuizConfig(req, res) {
    try {
      const config = {
        questionCounts: [5, 10, 15, 20, 25, 30],
        difficulties: [
          { value: 1, label: 'Beginner', description: 'Perfect for getting started' },
          { value: 2, label: 'Easy', description: 'Basic questions for beginners' },
          { value: 3, label: 'Intermediate', description: 'Intermediate level questions' },
          { value: 4, label: 'Advanced', description: 'Advanced questions for experts' },
          { value: 5, label: 'Expert', description: 'Expert level challenges' }
        ],
        sessionTypes: [
          { value: 'solo', label: 'Solo Quiz', description: 'Single-player quiz session' }
          // Future: multiplayer types
        ],
        maxQuestionCount: 50,
        defaultQuestionCount: 10,
        timeouts: {
          maxSessionDuration: 3600, // 1 hour in seconds
          maxQuestionTime: 300, // 5 minutes per question
          defaultQuestionTime: 30 // 30 seconds default
        },
        scoring: {
          basePointsRange: { min: 10, max: 100 },
          timeBonusEnabled: true,
          difficultyMultipliers: {
            1: 1.0,   // Beginner
            2: 1.2,   // Easy
            3: 1.5,   // Intermediate
            4: 1.8,   // Advanced
            5: 2.0    // Expert
          }
        }
      };

      res.status(200).json({
        success: true,
        message: 'Quiz configuration retrieved successfully',
        data: config
      });
    } catch (error) {
      console.error('Error getting quiz config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve quiz configuration',
        error: error.message
      });
    }
  }

  /**
   * Get leaderboard data
   * GET /api/games/leaderboard?categoryId=1&difficultyLevel=3&timeframe=30days&limit=10
   */
  async getLeaderboard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { categoryId, difficultyLevel, timeframe, limit } = req.query;

      const filters = {
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : undefined,
        timeframe: timeframe || '30days',
        limit: limit ? parseInt(limit) : 10
      };

      const leaderboard = await gameService.getLeaderboard(filters);

      res.status(200).json({
        success: true,
        message: 'Leaderboard retrieved successfully',
        data: {
          leaderboard,
          filters,
          count: leaderboard.length
        }
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve leaderboard',
        error: error.message
      });
    }
  }

  /**
   * Get user performance analytics
   * GET /api/games/analytics?timeframe=30days
   */
  async getUserAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { timeframe } = req.query;

      // This would typically call a dedicated analytics service
      // For now, we'll use session data to provide basic analytics
      const filters = { 
        status: 'completed'
      };

      const sessions = await gameService.getUserSessions(userId, 100, filters);

      // Calculate analytics from sessions
      const analytics = this.calculateUserAnalytics(sessions, timeframe);

      res.status(200).json({
        success: true,
        message: 'User analytics retrieved successfully',
        data: analytics
      });
    } catch (error) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user analytics',
        error: error.message
      });
    }
  }

  /**
   * Helper method to calculate user analytics
   */
  calculateUserAnalytics(sessions, timeframe = '30days') {
    const now = new Date();
    const timeframeStart = new Date();
    
    if (timeframe === '7days') {
      timeframeStart.setDate(now.getDate() - 7);
    } else if (timeframe === '30days') {
      timeframeStart.setDate(now.getDate() - 30);
    } else {
      timeframeStart.setFullYear(2000); // All time
    }

    const filteredSessions = sessions.filter(session => 
      new Date(session.startedAt) >= timeframeStart
    );

    if (filteredSessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        averageAccuracy: 0,
        totalTimeSpent: 0,
        categoryBreakdown: {},
        difficultyBreakdown: {},
        trend: 'stable'
      };
    }

    const totalScore = filteredSessions.reduce((sum, s) => sum + s.score, 0);
    const totalCorrect = filteredSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalQuestions = filteredSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalTime = filteredSessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0);

    // Category breakdown
    const categoryBreakdown = {};
    filteredSessions.forEach(session => {
      if (session.categoryId) {
        if (!categoryBreakdown[session.categoryId]) {
          categoryBreakdown[session.categoryId] = { count: 0, totalScore: 0 };
        }
        categoryBreakdown[session.categoryId].count++;
        categoryBreakdown[session.categoryId].totalScore += session.score;
      }
    });

    // Difficulty breakdown
    const difficultyBreakdown = {};
    filteredSessions.forEach(session => {
      if (session.difficultyLevel) {
        if (!difficultyBreakdown[session.difficultyLevel]) {
          difficultyBreakdown[session.difficultyLevel] = { count: 0, totalScore: 0 };
        }
        difficultyBreakdown[session.difficultyLevel].count++;
        difficultyBreakdown[session.difficultyLevel].totalScore += session.score;
      }
    });

    return {
      totalSessions: filteredSessions.length,
      averageScore: Math.round(totalScore / filteredSessions.length),
      averageAccuracy: Math.round((totalCorrect / totalQuestions) * 100),
      totalTimeSpent: totalTime,
      categoryBreakdown,
      difficultyBreakdown,
      trend: this.calculateTrend(filteredSessions)
    };
  }

  /**
   * Calculate performance trend
   */
  calculateTrend(sessions) {
    if (sessions.length < 3) return 'stable';

    const recentSessions = sessions.slice(0, Math.floor(sessions.length / 2));
    const olderSessions = sessions.slice(Math.floor(sessions.length / 2));

    const recentAvg = recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length;
    const olderAvg = olderSessions.reduce((sum, s) => sum + s.score, 0) / olderSessions.length;

    const difference = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }
}

module.exports = new GameController();