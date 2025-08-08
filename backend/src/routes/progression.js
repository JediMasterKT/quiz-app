const express = require('express');
const router = express.Router();
const progressionController = require('../controllers/progressionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/me', progressionController.getUserProgression);

router.post('/calculate-xp', progressionController.calculateXP);

router.post('/add-xp', progressionController.addXP);

router.post('/update-stats', progressionController.updateStats);

router.get('/achievements', progressionController.getUserAchievements);

router.post('/achievements/check', progressionController.checkAchievements);

router.get('/leaderboard', progressionController.getLeaderboard);

router.get('/rank', progressionController.getUserRank);

router.get('/leaderboard/stats', progressionController.getUserLeaderboardStats);

router.get('/top-players', progressionController.getTopPlayers);

module.exports = router;