const questionService = require('../services/questionService');
const { validationResult } = require('express-validator');

class QuestionController {
  /**
   * Get questions with optional filtering (public endpoint)
   * GET /api/questions?categoryId=1&difficultyLevel=3&limit=20&randomize=true
   */
  async getQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { 
        categoryId, 
        difficultyLevel, 
        limit, 
        randomize, 
        excludeIds 
      } = req.query;
      
      const excludeList = excludeIds ? excludeIds.split(',').map(id => parseInt(id)) : [];
      
      const questions = await questionService.getQuestions({
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        randomize: randomize === 'true',
        excludeIds: excludeList,
        userId: req.user?.id
      });

      res.status(200).json({
        success: true,
        message: 'Questions retrieved successfully',
        data: {
          questions,
          count: questions.length
        }
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve questions',
        error: error.message
      });
    }
  }

  /**
   * Get questions for quiz with specific configuration
   * GET /api/questions/quiz?categoryId=1&difficultyLevel=3&questionCount=10
   */
  async getQuizQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { categoryId, difficultyLevel, questionCount } = req.query;
      
      const questions = await questionService.getQuizQuestions({
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : undefined,
        questionCount: questionCount ? parseInt(questionCount) : 10,
        userId: req.user.id
      });

      res.status(200).json({
        success: true,
        message: 'Quiz questions retrieved successfully',
        data: {
          questions,
          count: questions.length,
          config: {
            categoryId: categoryId ? parseInt(categoryId) : null,
            difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : null,
            questionCount: questions.length
          }
        }
      });
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(400).json({
        success: false,
        message: error.message === 'No questions found matching the specified criteria' 
          ? error.message 
          : 'Failed to retrieve quiz questions',
        error: error.message
      });
    }
  }

  /**
   * Get all available categories
   * GET /api/categories
   */
  async getCategories(req, res) {
    try {
      const categories = await questionService.getCategories();

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories,
          count: categories.length
        }
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message
      });
    }
  }

  /**
   * Get a specific question by ID
   * GET /api/questions/:questionId
   */
  async getQuestionById(req, res) {
    try {
      const { questionId } = req.params;
      
      if (!questionId || isNaN(parseInt(questionId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid question ID is required'
        });
      }

      // Include correct answer only for admin users
      const includeCorrectAnswer = req.canManageQuestions || false;
      const question = await questionService.getQuestionById(
        parseInt(questionId), 
        includeCorrectAnswer
      );

      res.status(200).json({
        success: true,
        message: 'Question retrieved successfully',
        data: { question }
      });
    } catch (error) {
      console.error('Error fetching question by ID:', error);
      
      if (error.message === 'Question not found') {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve question',
        error: error.message
      });
    }
  }

  /**
   * Validate an answer for a specific question
   * POST /api/questions/:questionId/validate
   * Body: { answer: "option_a" }
   */
  async validateAnswer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { questionId } = req.params;
      const { answer } = req.body;
      
      if (!questionId || isNaN(parseInt(questionId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid question ID is required'
        });
      }

      const validation = await questionService.validateAnswer(
        parseInt(questionId), 
        answer, 
        req.user.id
      );

      res.status(200).json({
        success: true,
        message: 'Answer validated successfully',
        data: validation
      });
    } catch (error) {
      console.error('Error validating answer:', error);
      
      if (error.message === 'Question not found') {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to validate answer',
        error: error.message
      });
    }
  }

  /**
   * Search questions by text
   * GET /api/questions/search?q=javascript&categoryId=1&difficultyLevel=3&limit=10
   */
  async searchQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { q: query, categoryId, difficultyLevel, limit } = req.query;
      
      const questions = await questionService.searchQuestions({
        query,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : undefined,
        limit: limit ? parseInt(limit) : 20
      });

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: {
          questions,
          count: questions.length,
          searchTerm: query
        }
      });
    } catch (error) {
      console.error('Error searching questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search questions',
        error: error.message
      });
    }
  }

  /**
   * Get question statistics for analytics
   * GET /api/questions/stats?categoryId=1&difficultyLevel=3
   */
  async getQuestionStats(req, res) {
    try {
      const { categoryId, difficultyLevel } = req.query;
      
      const stats = await questionService.getQuestionStats({
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : undefined
      });

      res.status(200).json({
        success: true,
        message: 'Question statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching question stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve question statistics',
        error: error.message
      });
    }
  }

  // ADMIN ONLY ENDPOINTS

  /**
   * Create a new question (admin only)
   * POST /api/questions
   */
  async createQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const questionData = req.body;
      const question = await questionService.createQuestion(questionData, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: { question }
      });
    } catch (error) {
      console.error('Error creating question:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create question',
        error: error.message
      });
    }
  }

  /**
   * Update a question (admin only)
   * PUT /api/questions/:questionId
   */
  async updateQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { questionId } = req.params;
      const updateData = req.body;

      if (!questionId || isNaN(parseInt(questionId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid question ID is required'
        });
      }

      const question = await questionService.updateQuestion(parseInt(questionId), updateData);

      res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: { question }
      });
    } catch (error) {
      console.error('Error updating question:', error);
      
      if (error.message === 'Question not found') {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.status(400).json({
        success: false,
        message: 'Failed to update question',
        error: error.message
      });
    }
  }

  /**
   * Delete a question (admin only - soft delete)
   * DELETE /api/questions/:questionId
   */
  async deleteQuestion(req, res) {
    try {
      const { questionId } = req.params;

      if (!questionId || isNaN(parseInt(questionId))) {
        return res.status(400).json({
          success: false,
          message: 'Valid question ID is required'
        });
      }

      const result = await questionService.deleteQuestion(parseInt(questionId));

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      
      if (error.message === 'Question not found') {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete question',
        error: error.message
      });
    }
  }

  /**
   * Get available difficulty levels
   * GET /api/questions/difficulties
   */
  async getDifficulties(req, res) {
    try {
      const difficulties = [
        { value: 1, label: 'Beginner', description: 'Perfect for getting started' },
        { value: 2, label: 'Easy', description: 'Basic questions for beginners' },
        { value: 3, label: 'Intermediate', description: 'Intermediate level questions' },
        { value: 4, label: 'Advanced', description: 'Advanced questions for experts' },
        { value: 5, label: 'Expert', description: 'Expert level challenges' }
      ];

      res.status(200).json({
        success: true,
        message: 'Difficulty levels retrieved successfully',
        data: {
          difficulties,
          count: difficulties.length
        }
      });
    } catch (error) {
      console.error('Error fetching difficulties:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve difficulty levels',
        error: error.message
      });
    }
  }

  /**
   * Bulk operations for questions (admin only)
   * POST /api/questions/bulk
   * Body: { action: 'activate|deactivate|delete', questionIds: [1,2,3] }
   */
  async bulkOperations(req, res) {
    try {
      const { action, questionIds } = req.body;

      if (!action || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Action and question IDs array are required'
        });
      }

      const validActions = ['activate', 'deactivate', 'delete'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Must be one of: activate, deactivate, delete'
        });
      }

      let results = [];
      let errors = [];

      for (const questionId of questionIds) {
        try {
          if (action === 'delete') {
            await questionService.deleteQuestion(questionId);
          } else {
            const isActive = action === 'activate';
            await questionService.updateQuestion(questionId, { isActive });
          }
          results.push({ questionId, success: true });
        } catch (error) {
          errors.push({ questionId, error: error.message });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk ${action} operation completed`,
        data: {
          successful: results,
          failed: errors,
          totalProcessed: questionIds.length,
          successCount: results.length,
          errorCount: errors.length
        }
      });
    } catch (error) {
      console.error('Error in bulk operations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation',
        error: error.message
      });
    }
  }
}

module.exports = new QuestionController();