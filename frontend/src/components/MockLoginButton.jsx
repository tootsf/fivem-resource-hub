import React, { useState } from 'react';
import { useMockAuth } from '../contexts/MockAuthContext';

const MockLoginButton = () => {
  const { user, login, logout, loading, mockUsers, isMockMode } = useMockAuth();
  const [showUserSelect, setShowUserSelect] = useState(false);
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
          {isMockMode && <span className="mock-badge">DEMO</span>}
          <span className="dropdown-arrow">▼</span>
        </button>

        {showDropdown && (
          <div className="user-dropdown">
            <div className="dropdown-header">
              <img src={user.avatar_url} alt={user.username} className="dropdown-avatar" />
              <div className="dropdown-info">
                <div className="dropdown-name">{user.display_name || user.username}</div>
                <div className="dropdown-username">@{user.username}</div>
                {isMockMode && <div className="dropdown-mock">Demo Mode</div>}
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <button
              onClick={() => {
                setShowDropdown(false);
                // This would navigate to dashboard in a real app
                // For now, we'll trigger a view change
              }}
              className="dropdown-item"
            >
              <span className="dropdown-icon">📊</span>
              Dashboard
            </button>

            <button
              onClick={() => {
                setShowDropdown(false);
                // Navigate to profile
              }}
              className="dropdown-item"
            >
              <span className="dropdown-icon">👤</span>
              Profile
            </button>

            <button
              onClick={() => {
                setShowDropdown(false);
                // Navigate to my resources
              }}
              className="dropdown-item"
            >
              <span className="dropdown-icon">📦</span>
              My Resources
            </button>

            {isMockMode && (
              <>
                <div className="dropdown-divider"></div>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowUserSelect(true);
                  }}
                  className="dropdown-item"
                >
                  <span className="dropdown-icon">🔄</span>
                  Switch User (Demo)
                </button>
              </>
            )}

            <div className="dropdown-divider"></div>

            <button onClick={logout} className="dropdown-item logout-btn">
              <span className="dropdown-icon">🚪</span>
              Logout
            </button>
          </div>
        )}

        {showUserSelect && (
          <div className="modal-overlay" onClick={() => setShowUserSelect(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Switch Demo User</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowUserSelect(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>Choose a demo user to test different perspectives:</p>
                <div className="user-list">
                  {mockUsers.map(mockUser => (
                    <button
                      key={mockUser.id}
                      className={`user-option ${user.id === mockUser.id ? 'active' : ''}`}
                      onClick={() => {
                        login(mockUser.id);
                        setShowUserSelect(false);
                      }}
                    >
                      <img src={mockUser.avatar_url} alt={mockUser.username} className="user-option-avatar" />
                      <div className="user-option-info">
                        <div className="user-option-name">{mockUser.display_name}</div>
                        <div className="user-option-username">@{mockUser.username}</div>
                        <div className="user-option-stats">
                          {mockUser.claimed_resources_count} resources • {mockUser.recipes_count} recipes
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="login-options">
      <button
        onClick={() => setShowUserSelect(true)}
        className="demo-login-btn"
      >
        <span className="demo-icon">🎭</span>
        Demo Login
      </button>

      {showUserSelect && (
        <div className="modal-overlay" onClick={() => setShowUserSelect(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Demo Login</h3>
              <button
                className="modal-close"
                onClick={() => setShowUserSelect(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Choose a demo user to explore the resource claiming features:</p>
              <div className="user-list">
                {mockUsers.map(mockUser => (
                  <button
                    key={mockUser.id}
                    className="user-option"
                    onClick={() => {
                      login(mockUser.id);
                      setShowUserSelect(false);
                    }}
                  >
                    <img src={mockUser.avatar_url} alt={mockUser.username} className="user-option-avatar" />
                    <div className="user-option-info">
                      <div className="user-option-name">{mockUser.display_name}</div>
                      <div className="user-option-username">@{mockUser.username}</div>
                      <div className="user-option-bio">{mockUser.bio}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="demo-note">
                <p><strong>Note:</strong> This is demo mode for development. Claims are stored locally and reset when you clear browser data.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockLoginButton;
