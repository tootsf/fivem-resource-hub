# GitHub OAuth Integration Guide

## 1. GitHub App Setup

### Create GitHub OAuth App
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: "FiveM Resource Hub"
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/auth/github/callback`
   - **Application description**: "Discover, review, and organize FiveM resources"

4. Save the **Client ID** and **Client Secret**

### Required Scopes
- `user:email` - Access user's email addresses
- `public_repo` - Access public repositories (to verify ownership)
- `read:user` - Access basic user profile information

## 2. Backend Implementation

### Environment Variables
```bash
# .env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret
DATABASE_URL=postgresql://user:password@localhost:5432/fivem_hub
```

### OAuth Flow Implementation

#### Install Dependencies
```bash
npm install passport passport-github2 express-session jsonwebtoken bcrypt
```

#### Auth Route Setup
```javascript
// routes/auth.js
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await User.findOne({ github_id: profile.id });
    
    if (user) {
      // Update existing user
      user = await User.findByIdAndUpdate(user.id, {
        username: profile.username,
        display_name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar_url: profile.photos?.[0]?.value,
        github_url: profile.profileUrl,
        updated_at: new Date()
      }, { new: true });
    } else {
      // Create new user
      user = await User.create({
        github_id: profile.id,
        username: profile.username,
        display_name: profile.displayName,
        email: profile.emails?.[0]?.value,
        avatar_url: profile.photos?.[0]?.value,
        github_url: profile.profileUrl
      });
    }

    // Store GitHub access token securely
    await Session.create({
      user_id: user.id,
      github_access_token: encrypt(accessToken),
      session_token: generateSessionToken(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Auth routes
app.get('/auth/github', passport.authenticate('github', { 
  scope: ['user:email', 'public_repo', 'read:user'] 
}));

app.get('/auth/github/callback', 
  passport.authenticate('github', { session: false }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { userId: req.user.id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Redirect to frontend
    res.redirect(process.env.FRONTEND_URL + '/dashboard');
  }
);

app.post('/auth/logout', authenticateUser, (req, res) => {
  res.clearCookie('auth_token');
  // Optionally invalidate session in database
  res.json({ success: true, message: 'Logged out successfully' });
});
```

#### Authentication Middleware
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }
  next();
};

module.exports = { authenticateUser, optionalAuth };
```

## 3. Frontend Implementation

### React Context for Auth
```javascript
// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/auth/me', { withCredentials: true });
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/github`;
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Login Component
```javascript
// components/LoginButton.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginButton = () => {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user) {
    return (
      <div className="user-menu">
        <img src={user.avatar_url} alt={user.username} className="avatar" />
        <span>{user.display_name || user.username}</span>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <button onClick={login} className="github-login-btn">
      <GitHubIcon />
      Sign in with GitHub
    </button>
  );
};
```

## 4. Resource Claiming Verification

### GitHub API Integration
```javascript
// services/githubService.js
const { Octokit } = require('@octokit/rest');

const verifyResourceOwnership = async (githubAccessToken, repoUrl) => {
  try {
    const octokit = new Octokit({ auth: githubAccessToken });
    
    // Parse repo URL to get owner/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    
    const [, owner, repo] = match;
    
    // Check if user has push access to the repository
    const { data: repository } = await octokit.rest.repos.get({ owner, repo });
    const { data: permissions } = await octokit.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: 'current_user' // This gets the authenticated user's permissions
    });
    
    return permissions.permission === 'admin' || permissions.permission === 'write';
  } catch (error) {
    console.error('Ownership verification failed:', error);
    return false;
  }
};

// Usage in claim resource endpoint
app.post('/api/resources/:id/claim', authenticateUser, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (resource.claimed_by) {
      return res.status(400).json({ error: 'Resource already claimed' });
    }

    // Get user's GitHub access token
    const session = await Session.findOne({ user_id: req.user.id });
    const githubToken = decrypt(session.github_access_token);

    // Verify ownership
    const hasAccess = await verifyResourceOwnership(githubToken, resource.github_repo_url);
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this repository' });
    }

    // Claim the resource
    await Resource.findByIdAndUpdate(req.params.id, {
      claimed_by: req.user.id,
      claimed_at: new Date(),
      verified: true
    });

    res.json({ success: true, message: 'Resource claimed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 5. Security Considerations

### Token Security
- Store GitHub access tokens encrypted in database
- Use HTTP-only cookies for auth tokens
- Implement token rotation
- Set appropriate CORS policies

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts'
});

app.use('/auth', authLimiter);
```

### Input Validation
```javascript
const { body, validationResult } = require('express-validator');

const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').isLength({ min: 1, max: 255 }).trim(),
  body('content').isLength({ min: 10, max: 5000 }).trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```
