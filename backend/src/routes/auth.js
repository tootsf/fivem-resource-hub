const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Configure GitHub OAuth Strategy - only if credentials are provided
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub OAuth callback received for user:', profile.username);

      // Check if user exists
      let user = await User.findByGithubId(profile.id);

      const userData = {
        github_id: profile.id,
        username: profile.username,
        display_name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value || null,
        avatar_url: profile.photos?.[0]?.value || null,
        github_url: profile.profileUrl
      };

    if (user) {
      // Update existing user with latest GitHub data
      user = await User.update(user.id, userData);
      console.log('Updated existing user:', user.username);
    } else {
      // Create new user
      user = await User.create(userData);
      console.log('Created new user:', user.username);
    }    // Create or update session with GitHub access token
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    try {
      await Session.create({
        user_id: user.id,
        github_access_token: accessToken,
        expires_at: expiresAt
      });
      console.log('Session created successfully for user:', user.username);
    } catch (sessionError) {
      console.error('Session creation failed (but continuing):', sessionError);
      // Continue without session - the JWT token will handle auth
    }

    return done(null, user);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return done(error, null);
  }
}));
} else {
  console.log('GitHub OAuth not configured - CLIENT_ID and CLIENT_SECRET required');
}

// Initialize passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes

// GitHub OAuth routes - only if configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  // Start GitHub OAuth flow
  router.get('/github', (req, res, next) => {
    console.log('Starting GitHub OAuth flow');
    passport.authenticate('github', {
      scope: ['user:email', 'public_repo', 'read:user']
    })(req, res, next);
  });

  // GitHub OAuth callback
  router.get('/github/callback',
    passport.authenticate('github', { session: false }),
    (req, res) => {
      try {
        console.log('GitHub OAuth successful for user:', req.user.username);

        // Generate JWT token
        const token = jwt.sign(
          {
            userId: req.user.id,
            username: req.user.username
          },
          process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );        // Set HTTP-only cookie (might not work cross-domain)
        res.cookie('auth_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'none', // Allow cross-site cookies
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: '/'
        });

        // Redirect to frontend dashboard with token in URL (fallback)
        const redirectUrl = `${process.env.FRONTEND_URL}/dashboard?login=success&token=${token}`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
      } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
      }
    }
  );
} else {
  // Fallback routes when GitHub OAuth is not configured
  router.get('/github', (req, res) => {
    res.status(503).json({
      error: 'GitHub OAuth not configured',
      message: 'GitHub authentication is not available. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
    });
  });

  router.get('/github/callback', (req, res) => {
    res.status(503).json({
      error: 'GitHub OAuth not configured',
      message: 'GitHub authentication is not available.'
    });
  });
}

// Get current user profile
router.get('/me', authenticateUser, async (req, res) => {
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
      error: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { display_name, bio } = req.body;

    // Basic validation
    if (display_name && display_name.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Display name too long (max 255 characters)'
      });
    }

    if (bio && bio.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Bio too long (max 1000 characters)'
      });
    }

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
});

// Logout
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    // Get token from cookie or header
    const token = req.cookies.auth_token ||
                  (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
                    ? req.headers.authorization.slice(7) : null);

    if (token) {
      // Decode token to get user ID and clean up sessions
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      await Session.deleteByUserId(decoded.userId);
    }

    // Clear cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Health check for auth system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      github_oauth_configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      jwt_configured: !!process.env.JWT_SECRET,
      encryption_configured: !!process.env.ENCRYPTION_KEY
    }
  });
});

module.exports = router;
