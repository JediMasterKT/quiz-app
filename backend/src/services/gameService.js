const { GameSession, User, sequelize } = require('../models');
const questionService = require('./questionService');
const { v4: uuidv4 } = require('uuid');

class GameService {
  /**
   * Start a new solo quiz session with enhanced configuration
   * @param {number} userId - User ID
   * @param {Object} config - Session configuration
   * @param {number} config.categoryId - Category ID (optional)
   * @param {number} config.difficultyLevel - Difficulty level 1-5 (optional)
   * @param {number} config.questionCount - Number of questions (default: 10)
   * @returns {Promise<Object>} Session data with first question
   */
  async startSoloQuiz(userId, { categoryId, difficultyLevel, questionCount = 10 } = {}) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check for existing active session
      const existingSession = await GameSession.getActiveSession(userId);
      if (existingSession) {
        await transaction.rollback();
        throw new Error('User already has an active quiz session. Please complete or abandon the current session first.');
      }

      // Get questions for the quiz using fair randomization
      const questions = await questionService.getQuizQuestions({
        categoryId,
        difficultyLevel,
        questionCount,
        userId
      });

      if (questions.length === 0) {
        await transaction.rollback();
        throw new Error('No questions available for the specified criteria');
      }

      // Create session ID
      const sessionId = uuidv4();

      // Prepare session data
      const sessionData = {
        config: { categoryId, difficultyLevel, questionCount },
        questions: questions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          difficultyLevel: q.difficultyLevel,
          points: q.points,
          timeLimit: q.timeLimit,
          imageUrl: q.imageUrl,
          audioUrl: q.audioUrl,
          hint: q.hint,
          category: q.category
        })),
        startTime: new Date()
      };

      // Create game session
      const session = await GameSession.create({
        id: sessionId,
        userId,
        sessionType: 'solo',
        status: 'active',
        categoryId,
        difficultyLevel,
        totalQuestions: questions.length,
        currentQuestionIndex: 0,
        score: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        startedAt: new Date(),
        questionIds: questions.map(q => q.id),
        answers: [],
        timePerQuestion: [],
        sessionData
      }, { transaction });

      await transaction.commit();

      // Return session with first question (without correct answer)
      const firstQuestion = questions[0];
      return {
        sessionId,
        status: 'active',
        totalQuestions: questions.length,
        currentQuestionIndex: 0,
        score: 0,
        question: {
          id: firstQuestion.id,
          questionText: firstQuestion.questionText,
          questionType: firstQuestion.questionType,
          options: firstQuestion.options,
          difficultyLevel: firstQuestion.difficultyLevel,
          points: firstQuestion.points,
          timeLimit: firstQuestion.timeLimit,
          imageUrl: firstQuestion.imageUrl,
          audioUrl: firstQuestion.audioUrl,
          hint: firstQuestion.hint,
          category: firstQuestion.category
        },
        progress: {
          current: 1,
          total: questions.length,
          percentage: Math.round((1 / questions.length) * 100)
        },
        config: sessionData.config
      };
    } catch (error) {
      await transaction.rollback();
      throw new Error(`Failed to start quiz: ${error.message}`);
    }
  }

  /**
   * Submit an answer for the current question with enhanced validation
   * @param {string} sessionId - Session ID
   * @param {string} answer - User's answer
   * @param {number} timeSpent - Time spent on question (seconds)
   * @param {number} userId - User ID for validation
   * @returns {Promise<Object>} Answer result and next question or completion
   */
  async submitAnswer(sessionId, answer, timeSpent = 0, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const session = await GameSession.findByPk(sessionId, { transaction });
      
      if (!session) {
        await transaction.rollback();
        throw new Error('Session not found');
      }

      if (session.userId !== userId) {
        await transaction.rollback();
        throw new Error('Access denied: Session belongs to different user');
      }

      if (session.status !== 'active') {
        await transaction.rollback();
        throw new Error('Session is not active');
      }

      const currentQuestionIndex = session.currentQuestionIndex;
      const questions = session.sessionData.questions;
      
      if (currentQuestionIndex >= questions.length) {
        await transaction.rollback();
        throw new Error('No more questions in this session');
      }

      const currentQuestion = questions[currentQuestionIndex];
      
      // Validate the answer
      const validation = await questionService.validateAnswer(
        currentQuestion.id, 
        answer, 
        userId
      );
      
      // Calculate points with time bonus/penalty
      const basePoints = validation.points;
      const timeBonus = this.calculateTimeBonus(timeSpent, currentQuestion.timeLimit);
      const finalPoints = basePoints + timeBonus;
      
      // Update session data using GameSession methods
      session.addAnswer(
        currentQuestion.id,
        answer,
        validation.correctAnswer,
        validation.isCorrect,
        Math.max(0, finalPoints), // Ensure non-negative points
        timeSpent
      );

      // Check if quiz is complete
      const isComplete = session.currentQuestionIndex >= questions.length;

      if (isComplete) {
        await session.complete();
        
        // Update user statistics
        await this.updateUserStats(userId, {
          score: session.score,
          correctAnswers: session.correctAnswers,
          totalQuestions: questions.length,
          difficultyLevel: session.difficultyLevel,
          categoryId: session.categoryId
        });
      } else {
        await session.save({ transaction });
      }

      await transaction.commit();

      const response = {
        sessionId,
        questionResult: {
          questionId: currentQuestion.id,
          userAnswer: answer,
          correctAnswer: validation.correctAnswer,
          isCorrect: validation.isCorrect,
          basePoints: basePoints,
          timeBonus: timeBonus,
          finalPoints: Math.max(0, finalPoints),
          explanation: validation.explanation,
          hint: validation.hint,
          timeSpent
        },
        sessionProgress: {
          currentScore: session.score,
          correctAnswers: session.correctAnswers,
          incorrectAnswers: session.incorrectAnswers,
          questionsCompleted: session.currentQuestionIndex,
          totalQuestions: questions.length,
          percentage: Math.round((session.currentQuestionIndex / questions.length) * 100)
        }
      };

      if (isComplete) {
        // Quiz completed
        response.sessionComplete = true;
        response.finalStats = session.getDetailedStats();
      } else {
        // Return next question
        const nextQuestion = questions[session.currentQuestionIndex];
        response.nextQuestion = {
          id: nextQuestion.id,
          questionText: nextQuestion.questionText,
          questionType: nextQuestion.questionType,
          options: nextQuestion.options,
          difficultyLevel: nextQuestion.difficultyLevel,
          points: nextQuestion.points,
          timeLimit: nextQuestion.timeLimit,
          imageUrl: nextQuestion.imageUrl,
          audioUrl: nextQuestion.audioUrl,
          hint: nextQuestion.hint,
          category: nextQuestion.category
        };
        response.progress = {
          current: session.currentQuestionIndex + 1,
          total: questions.length,
          percentage: Math.round(((session.currentQuestionIndex + 1) / questions.length) * 100)
        };
      }

      return response;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Calculate time bonus/penalty based on response time
   * @param {number} timeSpent - Time spent in seconds
   * @param {number} timeLimit - Question time limit
   * @returns {number} Bonus/penalty points
   */
  calculateTimeBonus(timeSpent, timeLimit) {
    if (timeSpent <= 0 || timeLimit <= 0) return 0;
    
    const percentageUsed = timeSpent / timeLimit;
    
    if (percentageUsed <= 0.25) {
      // Very fast: 20% bonus
      return Math.floor(timeLimit * 0.2);
    } else if (percentageUsed <= 0.5) {
      // Fast: 10% bonus
      return Math.floor(timeLimit * 0.1);
    } else if (percentageUsed <= 0.75) {
      // Normal: no bonus/penalty
      return 0;
    } else if (percentageUsed <= 1.0) {
      // Slow: 5% penalty
      return -Math.floor(timeLimit * 0.05);
    } else {
      // Overtime: 10% penalty
      return -Math.floor(timeLimit * 0.1);
    }
  }

  /**
   * Get the current state of a session with enhanced details
   * @param {string} sessionId - Session ID
   * @param {number} userId - User ID for validation
   * @returns {Promise<Object>} Current session state
   */
  async getSessionState(sessionId, userId) {
    const session = await GameSession.findByPk(sessionId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'level', 'avatarUrl']
        }
      ]
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Access denied: Session belongs to different user');
    }

    const questions = session.sessionData.questions;
    const currentQuestionIndex = session.currentQuestionIndex;

    const response = {
      sessionId,
      status: session.status,
      user: session.user,
      sessionType: session.sessionType,
      categoryId: session.categoryId,
      difficultyLevel: session.difficultyLevel,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      progress: session.getProgress(),
      scoring: {
        currentScore: session.score,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        accuracy: session.getAccuracy()
      },
      timing: {
        totalTimeSpent: session.totalTimeSpent || 0,
        averageTimePerQuestion: session.getAverageTimePerQuestion()
      }
    };

    if (session.status === 'active' && currentQuestionIndex < questions.length) {
      // Return current question
      const currentQuestion = questions[currentQuestionIndex];
      response.currentQuestion = {
        id: currentQuestion.id,
        questionText: currentQuestion.questionText,
        questionType: currentQuestion.questionType,
        options: currentQuestion.options,
        difficultyLevel: currentQuestion.difficultyLevel,
        points: currentQuestion.points,
        timeLimit: currentQuestion.timeLimit,
        imageUrl: currentQuestion.imageUrl,
        audioUrl: currentQuestion.audioUrl,
        hint: currentQuestion.hint,
        category: currentQuestion.category
      };
    }

    if (session.status === 'completed') {
      response.finalStats = session.getDetailedStats();
    }

    return response;
  }

  /**
   * Get the next question in the session
   * @param {string} sessionId - Session ID
   * @param {number} userId - User ID for validation
   * @returns {Promise<Object>} Next question data
   */
  async getNextQuestion(sessionId, userId) {
    const session = await GameSession.findByPk(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Access denied: Session belongs to different user');
    }

    if (session.status !== 'active') {
      throw new Error('Session is not active');
    }

    const questions = session.sessionData.questions;
    const currentQuestionIndex = session.currentQuestionIndex;

    if (currentQuestionIndex >= questions.length) {
      throw new Error('No more questions in this session');
    }

    const question = questions[currentQuestionIndex];
    return {
      sessionId,
      question: {
        id: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: question.options,
        difficultyLevel: question.difficultyLevel,
        points: question.points,
        timeLimit: question.timeLimit,
        imageUrl: question.imageUrl,
        audioUrl: question.audioUrl,
        hint: question.hint,
        category: question.category
      },
      progress: {
        current: currentQuestionIndex + 1,
        total: questions.length,
        percentage: Math.round(((currentQuestionIndex + 1) / questions.length) * 100)
      }
    };
  }

  /**
   * Abandon/quit a session with proper cleanup
   * @param {string} sessionId - Session ID
   * @param {number} userId - User ID for validation
   * @returns {Promise<Object>} Abandonment confirmation
   */
  async abandonSession(sessionId, userId) {
    const transaction = await sequelize.transaction();
    
    try {
      const session = await GameSession.findByPk(sessionId, { transaction });
      
      if (!session) {
        await transaction.rollback();
        throw new Error('Session not found');
      }

      if (session.userId !== userId) {
        await transaction.rollback();
        throw new Error('Access denied: Session belongs to different user');
      }

      if (session.status !== 'active') {
        await transaction.rollback();
        throw new Error('Session is not active');
      }

      await session.abandon();
      await session.save({ transaction });

      await transaction.commit();

      return {
        sessionId,
        status: 'abandoned',
        finalScore: session.score,
        questionsCompleted: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        timeSpent: session.totalTimeSpent || 0
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Resume an existing active session
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Active session data or null
   */
  async resumeSession(userId) {
    const activeSession = await GameSession.getActiveSession(userId);
    
    if (!activeSession) {
      return null;
    }

    return await this.getSessionState(activeSession.id, userId);
  }

  /**
   * Get user's session history with enhanced filtering
   * @param {number} userId - User ID
   * @param {number} limit - Limit number of sessions
   * @param {Object} filters - Optional filters
   * @returns {Promise<GameSession[]>} Array of user sessions
   */
  async getUserSessions(userId, limit = 10, filters = {}) {
    const whereClause = { userId };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }
    
    if (filters.difficultyLevel) {
      whereClause.difficultyLevel = filters.difficultyLevel;
    }

    return await GameSession.findAll({
      where: whereClause,
      order: [['startedAt', 'DESC']],
      limit,
      attributes: {
        exclude: ['sessionData', 'answers'] // Exclude heavy data for list view
      }
    });
  }

  /**
   * Get detailed session statistics
   * @param {string} sessionId - Session ID
   * @param {number} userId - User ID for validation
   * @returns {Promise<Object>} Detailed session stats
   */
  async getSessionStats(sessionId, userId) {
    const session = await GameSession.findByPk(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Access denied: Session belongs to different user');
    }

    return session.getDetailedStats();
  }

  /**
   * Update user statistics after session completion
   * @param {number} userId - User ID
   * @param {Object} sessionStats - Session statistics
   */
  async updateUserStats(userId, { score, correctAnswers, totalQuestions, difficultyLevel, categoryId }) {
    const user = await User.findByPk(userId);
    
    if (user) {
      const newTotalScore = user.totalScore + score;
      const gamesPlayed = (user.gamesPlayed || 0) + 1;
      
      // Calculate level based on total score (every 1000 points = 1 level)
      const newLevel = Math.floor(newTotalScore / 1000) + 1;

      // Determine if this was a "win" (>75% accuracy)
      const accuracy = (correctAnswers / totalQuestions) * 100;
      const isWin = accuracy >= 75;
      const newGamesWon = (user.gamesWon || 0) + (isWin ? 1 : 0);

      await user.update({
        totalScore: newTotalScore,
        level: Math.max(user.level, newLevel),
        gamesPlayed,
        gamesWon: newGamesWon,
        lastLogin: new Date() // Update last activity
      });
    }
  }

  /**
   * Get leaderboard data
   * @param {Object} filters - Leaderboard filters
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard(filters = {}) {
    const { categoryId, difficultyLevel, timeframe = '30days', limit = 10 } = filters;
    
    const startDate = new Date();
    if (timeframe === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === 'alltime') {
      startDate.setFullYear(2000); // Far back enough
    }

    const whereClause = {
      status: 'completed',
      startedAt: {
        [sequelize.Sequelize.Op.gte]: startDate
      }
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (difficultyLevel) {
      whereClause.difficultyLevel = difficultyLevel;
    }

    const leaderboard = await GameSession.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'level', 'avatarUrl']
        }
      ],
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('GameSession.id')), 'sessionsCount'],
        [sequelize.fn('SUM', sequelize.col('score')), 'totalScore'],
        [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
        [sequelize.fn('SUM', sequelize.col('correct_answers')), 'totalCorrect'],
        [sequelize.fn('SUM', sequelize.col('total_questions')), 'totalQuestions']
      ],
      group: ['userId', 'user.id'],
      order: [[sequelize.fn('SUM', sequelize.col('score')), 'DESC']],
      limit,
      raw: false
    });

    return leaderboard.map(entry => ({
      user: entry.user,
      stats: {
        sessionsCount: parseInt(entry.dataValues.sessionsCount),
        totalScore: parseInt(entry.dataValues.totalScore),
        averageScore: Math.round(parseFloat(entry.dataValues.averageScore)),
        accuracy: Math.round((parseInt(entry.dataValues.totalCorrect) / parseInt(entry.dataValues.totalQuestions)) * 100)
      }
    }));
  }
}

module.exports = new GameService();