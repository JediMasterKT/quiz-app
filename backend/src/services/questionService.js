const { Question, Category, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { cacheService } = require('./cacheService');
const cacheWarmingService = require('./cacheWarmingService');

class QuestionService {
  /**
   * Retrieve questions with optional filtering and fair randomization
   * @param {Object} options - Query options
   * @param {number} options.categoryId - Filter by category ID
   * @param {number} options.difficultyLevel - Filter by difficulty level (1-5)
   * @param {number} options.limit - Maximum number of questions to return
   * @param {boolean} options.randomize - Whether to randomize the results
   * @param {array} options.excludeIds - Question IDs to exclude
   * @param {number} options.userId - User ID for fair distribution
   * @param {boolean} options.useCache - Whether to use caching (default: true)
   * @returns {Promise<Question[]>} Array of questions
   */
  async getQuestions({ 
    categoryId, 
    difficultyLevel, 
    limit, 
    randomize = false, 
    excludeIds = [],
    userId,
    useCache = true
  } = {}) {
    // Generate cache key for this request
    const cacheKey = cacheService.constructor.generateQuestionCacheKey({
      category: categoryId,
      difficulty: difficultyLevel,
      limit,
      excludeIds,
      type: randomize ? 'random' : 'ordered'
    });

    // Try to get from cache first (except for randomized queries with user context)
    if (useCache && (!randomize || !userId)) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const whereClause = {
      isActive: true
    };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (difficultyLevel) {
      whereClause.difficultyLevel = difficultyLevel;
    }

    if (excludeIds.length > 0) {
      whereClause.id = { [Op.notIn]: excludeIds };
    }

    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'iconUrl', 'colorCode']
        }
      ],
      attributes: {
        exclude: ['correctAnswer'] // Don't include correct answer in general queries
      }
    };

    if (randomize && userId) {
      // Use fair randomization that considers usage patterns
      const questions = await this.getFairRandomizedQuestions(whereClause, userId, limit);
      return questions;
    } else if (randomize) {
      // Simple randomization without user context
      queryOptions.order = sequelize.random();
    } else {
      // Default ordering
      queryOptions.order = [['id', 'ASC']];
    }

    if (limit) {
      queryOptions.limit = parseInt(limit);
    }

    const questions = await Question.findAll(queryOptions);
    
    // Cache the results (except for randomized queries with user context)
    if (useCache && (!randomize || !userId)) {
      await cacheService.set(cacheKey, questions, 24 * 60 * 60); // 24 hours
    }
    
    return questions;
  }

  /**
   * Get questions specifically for a quiz with fair distribution
   * @param {Object} options - Query options
   * @param {number} options.categoryId - Filter by category ID
   * @param {number} options.difficultyLevel - Filter by difficulty level
   * @param {number} options.questionCount - Number of questions for the quiz
   * @param {number} options.userId - User ID for fair distribution
   * @returns {Promise<Question[]>} Array of questions with correct answers
   */
  async getQuizQuestions({ categoryId, difficultyLevel, questionCount = 10, userId } = {}) {
    const whereClause = {
      isActive: true
    };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (difficultyLevel) {
      whereClause.difficultyLevel = difficultyLevel;
    }

    // Get all available questions matching criteria
    const allQuestions = await Question.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'iconUrl', 'colorCode']
        }
      ]
    });

    if (allQuestions.length === 0) {
      throw new Error('No questions found matching the specified criteria');
    }

    // Apply fair randomization
    const selectedQuestions = await this.selectFairQuestions(
      allQuestions, 
      questionCount, 
      userId
    );

    return selectedQuestions;
  }

  /**
   * Fair randomization algorithm that ensures users get different questions
   * and considers question usage patterns
   */
  async getFairRandomizedQuestions(whereClause, userId, limit = 10) {
    // Get user's recent question history to avoid repetition
    const recentQuestionIds = await this.getUserRecentQuestions(userId, 50);
    
    // First, try to get questions the user hasn't seen recently
    const freshQuestions = await Question.findAll({
      where: {
        ...whereClause,
        id: { [Op.notIn]: recentQuestionIds }
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'iconUrl', 'colorCode']
        }
      ],
      attributes: {
        exclude: ['correctAnswer']
      }
    });

    let selectedQuestions = [];

    if (freshQuestions.length >= limit) {
      // We have enough fresh questions, use weighted randomization
      selectedQuestions = this.weightedRandomSelection(freshQuestions, limit);
    } else {
      // Not enough fresh questions, mix with some repeated ones
      selectedQuestions = [...freshQuestions];
      
      const needed = limit - freshQuestions.length;
      if (needed > 0) {
        const repeatedQuestions = await Question.findAll({
          where: {
            ...whereClause,
            id: { [Op.in]: recentQuestionIds }
          },
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'description', 'iconUrl', 'colorCode']
            }
          ],
          attributes: {
            exclude: ['correctAnswer']
          }
        });

        const additionalQuestions = this.weightedRandomSelection(repeatedQuestions, needed);
        selectedQuestions = [...selectedQuestions, ...additionalQuestions];
      }
    }

    return this.shuffleArray(selectedQuestions);
  }

  /**
   * Select questions fairly for quiz based on usage patterns and user history
   */
  async selectFairQuestions(allQuestions, count, userId) {
    const recentQuestionIds = await this.getUserRecentQuestions(userId, 30);
    
    // Prioritize questions user hasn't seen recently
    const freshQuestions = allQuestions.filter(q => !recentQuestionIds.includes(q.id));
    const recentQuestions = allQuestions.filter(q => recentQuestionIds.includes(q.id));

    let selectedQuestions = [];

    if (freshQuestions.length >= count) {
      // Enough fresh questions available
      selectedQuestions = this.weightedRandomSelection(freshQuestions, count);
    } else {
      // Mix fresh and recent questions
      selectedQuestions = [...freshQuestions];
      const needed = count - freshQuestions.length;
      
      if (needed > 0 && recentQuestions.length > 0) {
        const additional = this.weightedRandomSelection(recentQuestions, needed);
        selectedQuestions = [...selectedQuestions, ...additional];
      }
    }

    return this.shuffleArray(selectedQuestions);
  }

  /**
   * Weighted random selection that considers question usage statistics
   * Questions with lower usage get higher probability of selection
   */
  weightedRandomSelection(questions, count) {
    if (questions.length <= count) {
      return [...questions];
    }

    // Calculate weights (inverse of usage count + 1 to avoid division by zero)
    const maxUsage = Math.max(...questions.map(q => q.usageCount));
    const weights = questions.map(question => {
      // Questions with lower usage get higher weights
      const normalizedUsage = question.usageCount / (maxUsage || 1);
      return Math.max(0.1, 1 - normalizedUsage); // Minimum weight of 0.1
    });

    const selected = [];
    const remainingQuestions = [...questions];
    const remainingWeights = [...weights];

    for (let i = 0; i < count && remainingQuestions.length > 0; i++) {
      const totalWeight = remainingWeights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      
      let selectedIndex = 0;
      for (let j = 0; j < remainingWeights.length; j++) {
        random -= remainingWeights[j];
        if (random <= 0) {
          selectedIndex = j;
          break;
        }
      }

      selected.push(remainingQuestions[selectedIndex]);
      remainingQuestions.splice(selectedIndex, 1);
      remainingWeights.splice(selectedIndex, 1);
    }

    return selected;
  }

  /**
   * Get user's recent question IDs from game sessions
   */
  async getUserRecentQuestions(userId, limit = 50) {
    try {
      const GameSession = sequelize.models.GameSession;
      if (!GameSession) return [];

      const recentSessions = await GameSession.findAll({
        where: { 
          userId,
          status: { [Op.in]: ['completed', 'abandoned'] }
        },
        order: [['startedAt', 'DESC']],
        limit: 5, // Last 5 sessions
        attributes: ['questionIds']
      });

      const recentQuestionIds = new Set();
      recentSessions.forEach(session => {
        if (session.questionIds && Array.isArray(session.questionIds)) {
          session.questionIds.forEach(id => recentQuestionIds.add(id));
        }
      });

      return Array.from(recentQuestionIds).slice(0, limit);
    } catch (error) {
      console.error('Error getting user recent questions:', error);
      return [];
    }
  }

  /**
   * Get all available categories with question counts
   * @param {boolean} useCache - Whether to use caching (default: true)
   * @returns {Promise<Category[]>} Array of categories with statistics
   */
  async getCategories(useCache = true) {
    const cacheKey = cacheService.constructor.generateCategoriesKey();
    
    if (useCache) {
      return await cacheService.getWithRefresh(
        cacheKey,
        async () => await Category.getCategoriesWithQuestionCounts(),
        24 * 60 * 60 // 24 hours TTL
      );
    }
    
    return await Category.getCategoriesWithQuestionCounts();
  }

  /**
   * Get a specific question by ID with all details (admin/validation use)
   * @param {number} questionId - Question ID
   * @param {boolean} includeCorrectAnswer - Whether to include correct answer
   * @returns {Promise<Question>} Question with all details
   */
  async getQuestionById(questionId, includeCorrectAnswer = false) {
    const attributes = includeCorrectAnswer ? undefined : {
      exclude: ['correctAnswer']
    };

    const question = await Question.findByPk(questionId, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'iconUrl', 'colorCode']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      attributes
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return question;
  }

  /**
   * Validate an answer for a specific question
   * @param {number} questionId - Question ID
   * @param {string} userAnswer - User's answer
   * @param {number} userId - User ID for tracking
   * @returns {Promise<Object>} Validation result with correctness and explanation
   */
  async validateAnswer(questionId, userAnswer, userId = null) {
    const question = await this.getQuestionById(questionId, true);
    
    const isCorrect = question.correctAnswer.toLowerCase().trim() === 
                     userAnswer.toLowerCase().trim();
    
    // Update question usage statistics
    await question.incrementUsage(isCorrect);

    const points = isCorrect ? this.calculatePoints(question.difficultyLevel, question.points) : 0;

    return {
      questionId,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      points,
      explanation: question.explanation,
      hint: question.hint
    };
  }

  /**
   * Calculate points based on difficulty and base points
   */
  calculatePoints(difficultyLevel, basePoints) {
    const difficultyMultiplier = {
      1: 1.0,   // Beginner
      2: 1.2,   // Easy  
      3: 1.5,   // Intermediate
      4: 1.8,   // Advanced
      5: 2.0    // Expert
    };

    return Math.round(basePoints * (difficultyMultiplier[difficultyLevel] || 1.0));
  }

  /**
   * Create a new question (admin only)
   */
  async createQuestion(questionData, createdBy) {
    try {
      const question = await Question.create({
        ...questionData,
        createdBy
      });

      // Invalidate cache for this category
      await cacheWarmingService.invalidateQuestionCache(
        question.categoryId, 
        question.difficultyLevel
      );

      return await this.getQuestionById(question.id, true);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Update a question (admin only)
   */
  async updateQuestion(questionId, updateData) {
    const question = await Question.findByPk(questionId);
    
    if (!question) {
      throw new Error('Question not found');
    }

    const oldCategoryId = question.categoryId;
    const oldDifficultyLevel = question.difficultyLevel;

    try {
      await question.update(updateData);
      
      // Invalidate cache for old category/difficulty
      await cacheWarmingService.invalidateQuestionCache(
        oldCategoryId, 
        oldDifficultyLevel
      );
      
      // If category or difficulty changed, invalidate new one too
      if (updateData.categoryId && updateData.categoryId !== oldCategoryId) {
        await cacheWarmingService.invalidateQuestionCache(
          updateData.categoryId, 
          updateData.difficultyLevel || oldDifficultyLevel
        );
      }
      
      if (updateData.difficultyLevel && updateData.difficultyLevel !== oldDifficultyLevel) {
        await cacheWarmingService.invalidateQuestionCache(
          updateData.categoryId || oldCategoryId, 
          updateData.difficultyLevel
        );
      }

      return await this.getQuestionById(questionId, true);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Soft delete a question (admin only)
   */
  async deleteQuestion(questionId) {
    const question = await Question.findByPk(questionId);
    
    if (!question) {
      throw new Error('Question not found');
    }

    await question.update({ isActive: false });
    
    // Invalidate cache for this category
    await cacheWarmingService.invalidateQuestionCache(
      question.categoryId, 
      question.difficultyLevel
    );
    
    return { message: 'Question deactivated successfully' };
  }

  /**
   * Get question statistics for analytics
   */
  async getQuestionStats(filters = {}) {
    const whereClause = { isActive: true };
    
    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }
    
    if (filters.difficultyLevel) {
      whereClause.difficultyLevel = filters.difficultyLevel;
    }

    const questions = await Question.findAll({
      where: whereClause,
      attributes: ['id', 'usageCount', 'successRate', 'difficultyLevel', 'points'],
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const stats = {
      totalQuestions: questions.length,
      averageSuccessRate: 0,
      difficultyBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      totalUsage: 0,
      averageUsage: 0
    };

    let totalSuccessRate = 0;
    let questionsWithStats = 0;

    questions.forEach(question => {
      if (question.usageCount > 0) {
        totalSuccessRate += parseFloat(question.successRate || 0);
        questionsWithStats++;
        stats.totalUsage += question.usageCount;
      }
      
      if (question.difficultyLevel) {
        stats.difficultyBreakdown[question.difficultyLevel]++;
      }
    });

    if (questionsWithStats > 0) {
      stats.averageSuccessRate = parseFloat((totalSuccessRate / questionsWithStats).toFixed(2));
      stats.averageUsage = parseFloat((stats.totalUsage / questionsWithStats).toFixed(2));
    }

    return stats;
  }

  /**
   * Fisher-Yates shuffle algorithm for randomizing arrays
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Search questions by text content
   */
  async searchQuestions({ query, categoryId, difficultyLevel, limit = 20 } = {}) {
    const whereClause = {
      isActive: true,
      [Op.or]: [
        { questionText: { [Op.iLike]: `%${query}%` } },
        { explanation: { [Op.iLike]: `%${query}%` } }
      ]
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (difficultyLevel) {
      whereClause.difficultyLevel = difficultyLevel;
    }

    const questions = await Question.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: {
        exclude: ['correctAnswer']
      },
      limit: parseInt(limit),
      order: [['usageCount', 'ASC']] // Prioritize less used questions
    });

    return questions;
  }
}

module.exports = new QuestionService();