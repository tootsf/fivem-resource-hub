import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResourceClaims } from '../contexts/ResourceClaimContext';
import { useReviews } from '../contexts/ReviewContext';
import { useRecipes } from '../contexts/RecipeContext';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { getUserClaimedResources, getClaimStats } = useResourceClaims();
  const { getReviewStats } = useReviews();
  const { getUserRecipes } = useRecipes();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }
  const claims = getUserClaimedResources();
  const reviewStats = getReviewStats();
  const userRecipes = getUserRecipes();

  const stats = {
    claimedResources: claims.length,
    recipesCreated: userRecipes.length,
    totalReviews: reviewStats.total,
    totalHelpfulVotes: reviewStats.totalHelpful,
    totalRecipeDownloads: userRecipes.reduce((sum, recipe) => sum + recipe.download_count, 0),
    totalRecipeLikes: userRecipes.reduce((sum, recipe) => sum + recipe.like_count, 0)
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user.display_name || user.username}!</h1>
        <p>Manage your FiveM resources, reviews, and recipes</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Quick Stats</h3>
          </div>
          <div className="card-content">
            <div className="stat-item">
              <span className="stat-label">Claimed Resources:</span>
              <span className="stat-value">{stats.claimedResources}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Recipes Created:</span>
              <span className="stat-value">{stats.recipesCreated}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Reviews Written:</span>
              <span className="stat-value">{stats.totalReviews}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Member Since:</span>
              <span className="stat-value">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="card-content">
            <p className="empty-state">No recent activity to display.</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>My Claimed Resources</h3>
          </div>
          <div className="card-content">
            <p className="empty-state">
              You haven't claimed any resources yet.
              <a href="/browse">Browse resources</a> to get started.
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>My Recipes</h3>
          </div>
          <div className="card-content">
            <p className="empty-state">
              You haven't created any recipes yet.
              <a href="/recipe-builder">Create your first recipe</a>.
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recipe Builder Stats</h3>
          </div>
          <div className="card-content">
            <div className="stat-item">
              <span className="stat-label">Total Downloads:</span>
              <span className="stat-value">{stats.totalRecipeDownloads}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Likes:</span>
              <span className="stat-value">{stats.totalRecipeLikes}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Helpful Votes:</span>
              <span className="stat-value">{stats.totalHelpfulVotes}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="card-content">
            <div className="quick-actions">
              <button className="action-btn">
                📦 Browse Resources
              </button>
              <button className="action-btn">
                🛠️ Create Recipe
              </button>
              <button className="action-btn">
                ⭐ Write Review
              </button>
              <button className="action-btn">
                📊 View My Resources
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/browse" className="action-btn primary">
          Browse Resources
        </a>
        <a href="/recipe-builder" className="action-btn secondary">
          Create Recipe
        </a>
        <a href="/profile" className="action-btn tertiary">
          Edit Profile
        </a>
      </div>
    </div>
  );
};

export default Dashboard;

