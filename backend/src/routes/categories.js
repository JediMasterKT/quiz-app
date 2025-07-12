const express = require('express');
const router = express.Router();
const questionService = require('../services/questionService');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/categories
 * @desc    Get all available categories with question counts
 * @access  Private
 */
router.get('/', 
  authenticateToken, 
  async (req, res) => {
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
);

module.exports = router;