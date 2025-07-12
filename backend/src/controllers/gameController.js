'use strict';

const gameService = require('../services/GameService');
const { validationResult } = require('express-validator');

const gameController = {
  async completeQuiz(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const gameData = req.body;

      const result = await gameService.completeQuiz(userId, gameData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getGameSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await gameService.getGameSession(sessionId);

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserGameHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;

      const history = await gameService.getUserGameHistory(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  },

  async getCategoryStats(req, res, next) {
    try {
      const userId = req.user.id;
      const { categoryId } = req.params;

      const stats = await gameService.getCategoryStats(userId, parseInt(categoryId));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = gameController;