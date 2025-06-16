const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { authenticateUser } = require('../middleware/auth');

// Get all resources with search
router.get('/', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;
    const pageNum = parseInt(page);

    const results = await Resource.search(q, pageNum, 100);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search resources'
    });
  }
});

// Get single resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get resource'
    });
  }
});

// Claim a resource (authenticated users only)
router.post('/:id/claim', authenticateUser, async (req, res) => {  try {
    const resourceId = parseInt(req.params.id);
    const userId = req.user.id;
    const userGithubUsername = req.user.username; // GitHub username from OAuth

    const resource = await Resource.claimResource(resourceId, userId, userGithubUsername);

    res.json({
      success: true,
      message: 'Resource claimed successfully',
      data: resource
    });
  } catch (error) {
    console.error('Claim resource error:', error);

    if (error.message === 'Resource not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
      if (error.message === 'Resource is already claimed by another user') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('You can only claim resources that you own on GitHub')) {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('cannot verify ownership')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to claim resource'
    });
  }
});

// Unclaim a resource (authenticated users only)
router.post('/:id/unclaim', authenticateUser, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const userId = req.user.id;

    const resource = await Resource.unclaimResource(resourceId, userId);

    res.json({
      success: true,
      message: 'Resource unclaimed successfully',
      data: resource
    });
  } catch (error) {
    console.error('Unclaim resource error:', error);

    if (error.message === 'Resource not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message === 'You can only unclaim resources you have claimed') {
      return res.status(403).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to unclaim resource'
    });
  }
});

// Get user's claimed resources
router.get('/user/claimed', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const claimedResources = await Resource.getClaimedByUser(userId);

    res.json({
      success: true,
      data: claimedResources
    });
  } catch (error) {
    console.error('Get claimed resources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get claimed resources'
    });
  }
});

// Get claim statistics (public)
router.get('/stats/claims', async (req, res) => {
  try {
    const stats = await Resource.getClaimStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get claim stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get claim statistics'
    });
  }
});

// Check if user can claim a resource (authenticated users only)
router.get('/:id/can-claim', authenticateUser, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const userGithubUsername = req.user.username;

    const result = await Resource.canUserClaimResource(resourceId, userGithubUsername);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Check claim eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check claim eligibility'
    });
  }
});

// Test endpoint to check ownership verification (for development)
router.get('/test/ownership/:id', authenticateUser, async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const userGithubUsername = req.user.username;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const canClaim = await Resource.canUserClaimResource(resourceId, userGithubUsername);
    const isOwner = await Resource.verifyGitHubOwnership(resource.github_url, userGithubUsername);

    res.json({
      success: true,
      data: {
        resource: {
          id: resource.id,
          name: resource.name,
          github_url: resource.github_url,
          claimed_by: resource.claimed_by
        },
        user: {
          id: req.user.id,
          username: userGithubUsername
        },
        verification: {
          isOwner,
          canClaim,
          repoOwner: resource.github_url?.match(/github\.com\/([^\/]+)/)?.[1] || 'unknown'
        }
      }
    });
  } catch (error) {
    console.error('Ownership test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test ownership'
    });
  }
});

module.exports = router;
