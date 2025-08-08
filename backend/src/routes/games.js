const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const { authenticateToken } = require('../middleware/auth');
const { body, query, param } = require('express-validator');

/**
 * @route   POST /api/games/start
 * @desc    Start a new quiz session (simplified endpoint)
 * @access  Private
 * @body    categoryId?, difficulty?
 */
router.post('/start',
  authenticateToken,
  async (req, res) => {
    try {
      const { categoryId = 1, difficulty = 'medium' } = req.body;
      const sessionId = require('crypto').randomUUID();
      
      res.json({
        success: true,
        data: {
          sessionId,
          questions: [
            {
              id: 1,
              questionText: 'What is the capital of France?',
              options: ['London', 'Berlin', 'Paris', 'Madrid'],
              difficulty
            }
          ],
          categoryId,
          difficulty
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to start game session',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/games/solo/start
 * @desc    Start a new solo quiz session
 * @access  Private
 * @body    categoryId?, difficultyLevel?, questionCount?
 */
router.post('/solo/start',
  authenticateToken,
  [
    body('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    body('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    body('questionCount').optional().isInt({ min: 1, max: 50 }).withMessage('Question count must be between 1 and 50')
  ],
  gameController.startSoloQuiz
);

/**
 * @route   GET /api/games/config
 * @desc    Get available quiz configurations
 * @access  Private
 */
router.get('/config',
  authenticateToken,
  gameController.getQuizConfig
);

/**
 * @route   GET /api/games/resume
 * @desc    Resume an existing active session
 * @access  Private
 */
router.get('/resume',
  authenticateToken,
  gameController.resumeSession
);

/**
 * @route   GET /api/games/sessions
 * @desc    Get user's session history
 * @access  Private
 * @query   limit, status, categoryId, difficultyLevel
 */
router.get('/sessions',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'completed', 'abandoned', 'expired']).withMessage('Invalid status'),
    query('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5')
  ],
  gameController.getUserSessions
);

/**
 * @route   GET /api/games/leaderboard
 * @desc    Get leaderboard data
 * @access  Private
 * @query   categoryId, difficultyLevel, timeframe, limit
 */
router.get('/leaderboard',
  authenticateToken,
  [
    query('categoryId').optional().isInt({ min: 1 }).withMessage('Category ID must be a positive integer'),
    query('difficultyLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Difficulty level must be between 1 and 5'),
    query('timeframe').optional().isIn(['7days', '30days', 'alltime']).withMessage('Timeframe must be 7days, 30days, or alltime'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  gameController.getLeaderboard
);

/**
 * @route   GET /api/games/analytics
 * @desc    Get user performance analytics
 * @access  Private
 * @query   timeframe
 */
router.get('/analytics',
  authenticateToken,
  [
    query('timeframe').optional().isIn(['7days', '30days', 'alltime']).withMessage('Timeframe must be 7days, 30days, or alltime')
  ],
  gameController.getUserAnalytics
);

/**
 * @route   POST /api/games/:sessionId/answer
 * @desc    Submit an answer for the current question
 * @access  Private
 * @param   sessionId
 * @body    answer, timeSpent?
 */
router.post('/:sessionId/answer',
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID'),
    body('answer').notEmpty().isString().withMessage('Answer is required and must be a string'),
    body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
  ],
  gameController.submitAnswer
);

/**
 * @route   GET /api/games/:sessionId/state
 * @desc    Get current session state
 * @access  Private
 * @param   sessionId
 */
router.get('/:sessionId/state',
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  gameController.getSessionState
);

/**
 * @route   GET /api/games/:sessionId/next-question
 * @desc    Get next question in the session
 * @access  Private
 * @param   sessionId
 */
router.get('/:sessionId/next-question',
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  gameController.getNextQuestion
);

/**
 * @route   POST /api/games/:sessionId/abandon
 * @desc    Abandon/quit current session
 * @access  Private
 * @param   sessionId
 */
router.post('/:sessionId/abandon',
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  gameController.abandonSession
);

/**
 * @route   GET /api/games/:sessionId/stats
 * @desc    Get detailed session statistics
 * @access  Private
 * @param   sessionId
 */
router.get('/:sessionId/stats',
  authenticateToken,
  [
    param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
  ],
  gameController.getSessionStats
);

module.exports = router;