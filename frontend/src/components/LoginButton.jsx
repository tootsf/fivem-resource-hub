import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginButton = () => {
  const { user, login, logout, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (user) {
    return (
      <div className="user-menu">
        <button
          className="user-profile-btn"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <img
            src={user.avatar_url}
            alt={user.username}
            className="user-avatar"
          />
          <span className="user-name">{user.display_name || user.username}</span>
          <span className="dropdown-arrow">▼</span>
        </button>

        {showDropdown && (
          <div className="user-dropdown">
            <div className="dropdown-header">
              <img src={user.avatar_url} alt={user.username} className="dropdown-avatar" />
              <div className="dropdown-info">
                <div className="dropdown-name">{user.display_name || user.username}</div>
                <div className="dropdown-username">@{user.username}</div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <a href="/dashboard" className="dropdown-item">
              <span className="dropdown-icon">📊</span>
              Dashboard
            </a>

            <a href="/profile" className="dropdown-item">
              <span className="dropdown-icon">👤</span>
              Profile
            </a>

            <a href="/my-recipes" className="dropdown-item">
              <span className="dropdown-icon">📋</span>
              My Recipes
            </a>

            <div className="dropdown-divider"></div>

            <button onClick={logout} className="dropdown-item logout-btn">
              <span className="dropdown-icon">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={login} className="github-login-btn">
      <svg className="github-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      Sign in with GitHub
    </button>
  );
};

export default LoginButton;
