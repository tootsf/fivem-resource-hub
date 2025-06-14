const express = require('express');
const User = require('../models/User');
const { authenticateUser, optionalAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get public user profile by username
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.getPublicProfile(username);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Get current user's full profile (private route)
router.get('/profile/me', authenticateUser, async (req, res) => {
  try {
    const userProfile = await User.getProfile(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: userProfile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

// Update current user's profile
router.put('/profile/me', 
  authenticateUser,
  [
    body('display_name')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Display name must be between 1 and 255 characters'),
    body('bio')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { display_name, bio } = req.body;

      const updatedUser = await User.updateProfile(req.user.id, {
        display_name,
        bio
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: updatedUser
        },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }
);

// Get user's claimed resources
router.get('/:username/resources', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // This will need to be implemented when we add the Resource model
    // For now, return empty array
    res.json({
      success: true,
      data: {
        resources: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    console.error('Get user resources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user resources'
    });
  }
});

// Get user's public recipes
router.get('/:username/recipes', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // This will need to be implemented when we add the Recipe model
    // For now, return empty array
    res.json({
      success: true,
      data: {
        recipes: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user recipes'
    });
  }
});

module.exports = router;
