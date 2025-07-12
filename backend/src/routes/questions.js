const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken } = require('../middleware/auth');
const { requireQuestionManager, checkAdminStatus } = require('../middleware/adminAuth');
const { body, query, param } = require('express-validator');

/**
 * @route   GET /api/questions
 * @desc    Get questions with optional filtering
 * @access  Private
 * @query   categoryId, difficultyLevel, limit, randomize, excludeIds
 */
router.get('/', 
  authenticateToken,
  checkAdminStatus,
  [
    query('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('randomize').optional().isBoolean().withMessage('Randomize must be a boolean'),
    query('excludeIds').optional().isString().withMessage('Exclude IDs must be a comma-separated string')
  ],
  questionController.getQuestions
);

/**
 * @route   GET /api/questions/quiz
 * @desc    Get questions specifically for a quiz session
 * @access  Private
 * @query   categoryId, difficultyLevel, questionCount
 */
router.get('/quiz',
  authenticateToken,
  [
    query('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    query('questionCount').optional().isInt({ min: 1, max: 50 }).withMessage('Question count must be between 1 and 50')
  ],
  questionController.getQuizQuestions
);

/**
 * @route   GET /api/questions/categories (legacy alias - redirect to /api/categories)
 * @desc    Get all available categories
 * @access  Private
 */
router.get('/categories', 
  authenticateToken, 
  questionController.getCategories
);

/**
 * @route   GET /api/questions/difficulties
 * @desc    Get available difficulty levels
 * @access  Private
 */
router.get('/difficulties', 
  authenticateToken, 
  questionController.getDifficulties
);

/**
 * @route   GET /api/questions/stats
 * @desc    Get question statistics for analytics
 * @access  Private
 * @query   categoryId, difficultyLevel
 */
router.get('/stats',
  authenticateToken,
  [
    query('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5')
  ],
  questionController.getQuestionStats
);

/**
 * @route   GET /api/questions/search
 * @desc    Search questions by text
 * @access  Private
 * @query   q (search term), categoryId, difficultyLevel, limit
 */
router.get('/search',
  authenticateToken,
  [
    query('q').notEmpty().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
    query('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  questionController.searchQuestions
);

/**
 * @route   POST /api/questions
 * @desc    Create a new question (admin only)
 * @access  Private (Admin)
 * @body    Question data
 */
router.post('/',
  authenticateToken,
  requireQuestionManager,
  [
    body('categoryId').isInt({ min: 1 }).withMessage('Category ID is required and must be a positive integer'),
    body('questionText').isLength({ min: 10, max: 1000 }).withMessage('Question text must be between 10 and 1000 characters'),
    body('questionType').optional().isIn(['multiple_choice', 'true_false', 'fill_blank', 'essay']).withMessage('Invalid question type'),
    body('options').isArray({ min: 2, max: 6 }).withMessage('Options must be an array with 2-6 items'),
    body('options.*').isString().isLength({ min: 1 }).withMessage('Each option must be a non-empty string'),
    body('correctAnswer').notEmpty().withMessage('Correct answer is required'),
    body('explanation').optional().isLength({ max: 2000 }).withMessage('Explanation cannot exceed 2000 characters'),
    body('difficultyLevel').isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    body('timeLimit').optional().isInt({ min: 5, max: 300 }).withMessage('Time limit must be between 5 and 300 seconds'),
    body('points').optional().isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
    body('hint').optional().isLength({ max: 500 }).withMessage('Hint cannot exceed 500 characters'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('audioUrl').optional().isURL().withMessage('Audio URL must be a valid URL')
  ],
  questionController.createQuestion
);

/**
 * @route   POST /api/questions/bulk
 * @desc    Bulk operations on questions (admin only)
 * @access  Private (Admin)
 * @body    { action: 'activate|deactivate|delete', questionIds: [1,2,3] }
 */
router.post('/bulk',
  authenticateToken,
  requireQuestionManager,
  [
    body('action').isIn(['activate', 'deactivate', 'delete']).withMessage('Action must be activate, deactivate, or delete'),
    body('questionIds').isArray({ min: 1 }).withMessage('Question IDs must be a non-empty array'),
    body('questionIds.*').isInt({ min: 1 }).withMessage('Each question ID must be a positive integer')
  ],
  questionController.bulkOperations
);

/**
 * @route   GET /api/questions/:questionId
 * @desc    Get a specific question by ID
 * @access  Private
 * @param   questionId
 */
router.get('/:questionId',
  authenticateToken,
  checkAdminStatus,
  [
    param('questionId').isInt({ min: 1 }).withMessage('Question ID must be a positive integer')
  ],
  questionController.getQuestionById
);

/**
 * @route   PUT /api/questions/:questionId
 * @desc    Update a question (admin only)
 * @access  Private (Admin)
 * @param   questionId
 * @body    Updated question data
 */
router.put('/:questionId',
  authenticateToken,
  requireQuestionManager,
  [
    param('questionId').isInt({ min: 1 }).withMessage('Question ID must be a positive integer'),
    body('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    body('questionText').optional().isLength({ min: 10, max: 1000 }).withMessage('Question text must be between 10 and 1000 characters'),
    body('questionType').optional().isIn(['multiple_choice', 'true_false', 'fill_blank', 'essay']).withMessage('Invalid question type'),
    body('options').optional().isArray({ min: 2, max: 6 }).withMessage('Options must be an array with 2-6 items'),
    body('options.*').optional().isString().isLength({ min: 1 }).withMessage('Each option must be a non-empty string'),
    body('correctAnswer').optional().notEmpty().withMessage('Correct answer cannot be empty'),
    body('explanation').optional().isLength({ max: 2000 }).withMessage('Explanation cannot exceed 2000 characters'),
    body('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    body('timeLimit').optional().isInt({ min: 5, max: 300 }).withMessage('Time limit must be between 5 and 300 seconds'),
    body('points').optional().isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
    body('hint').optional().isLength({ max: 500 }).withMessage('Hint cannot exceed 500 characters'),
    body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
    body('audioUrl').optional().isURL().withMessage('Audio URL must be a valid URL'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  questionController.updateQuestion
);

/**
 * @route   DELETE /api/questions/:questionId
 * @desc    Delete a question (admin only - soft delete)
 * @access  Private (Admin)
 * @param   questionId
 */
router.delete('/:questionId',
  authenticateToken,
  requireQuestionManager,
  [
    param('questionId').isInt({ min: 1 }).withMessage('Question ID must be a positive integer')
  ],
  questionController.deleteQuestion
);

/**
 * @route   POST /api/questions/:questionId/validate
 * @desc    Validate an answer for a specific question
 * @access  Private
 * @param   questionId
 * @body    { answer: "user_answer" }
 */
router.post('/:questionId/validate',
  authenticateToken,
  [
    param('questionId').isInt({ min: 1 }).withMessage('Question ID must be a positive integer'),
    body('answer').notEmpty().isString().withMessage('Answer is required and must be a string')
  ],
  questionController.validateAnswer
);

module.exports = router;