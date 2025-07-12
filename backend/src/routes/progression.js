const express = require('express');
const router = express.Router();
const progressionController = require('../controllers/progressionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/me', progressionController.getUserProgression);

router.get('/achievements', progressionController.getUserAchievements);

router.post('/achievements/check', progressionController.checkAchievements);

router.get('/leaderboard', progressionController.getLeaderboard);

router.get('/rank', progressionController.getUserRank);

router.get('/leaderboard/stats', progressionController.getUserLeaderboardStats);

router.get('/top-players', progressionController.getTopPlayers);

module.exports = router;