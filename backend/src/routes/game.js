const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/complete', [
  body('categoryId').isInt().withMessage('Category ID must be an integer'),
  body('questionsAnswered').isInt({ min: 1 }).withMessage('Questions answered must be at least 1'),
  body('correctAnswers').isInt({ min: 0 }).withMessage('Correct answers must be non-negative'),
  body('score').isInt({ min: 0 }).withMessage('Score must be non-negative'),
  body('timeTaken').isInt({ min: 0 }).withMessage('Time taken must be non-negative'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
], gameController.completeQuiz);

router.get('/session/:sessionId', gameController.getGameSession);

router.get('/history', gameController.getUserGameHistory);

router.get('/stats/category/:categoryId', gameController.getCategoryStats);

module.exports = router;