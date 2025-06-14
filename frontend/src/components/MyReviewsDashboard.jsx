import React, { useState } from 'react';
import { useMockAuth } from '../contexts/MockAuthContext';
import { useReviews } from '../contexts/ReviewContext';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';

const MyReviewsDashboard = () => {
  const { user, loading: authLoading } = useMockAuth();
  const { getUserReviews, getReviewStats } = useReviews();
  const [filter, setFilter] = useState('all'); // all, 5-star, 4-star, etc.

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please sign in to view your reviews.</p>
        </div>
      </div>
    );
  }

  const myReviews = getUserReviews();
  const stats = getReviewStats();

  const filteredReviews = myReviews.filter(review => {
    if (filter === 'all') return true;
    const rating = parseInt(filter.split('-')[0]);
    return review.rating === rating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Reviews</h1>
        <p>Manage your resource reviews and see your contribution to the community</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalHelpful}</div>
          <div className="stat-label">Helpful Votes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {stats.total > 0 ? (stats.totalHelpful / stats.total).toFixed(1) : '0.0'}
          </div>
          <div className="stat-label">Avg Helpful/Review</div>
        </div>
      </div>

      {/* Rating Distribution */}
      {myReviews.length > 0 && (
        <div className="rating-breakdown">
          <h3>Your Rating Distribution</h3>
          <div className="rating-breakdown-grid">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = myReviews.filter(review => review.rating === rating).length;
              const percentage = (count / myReviews.length) * 100;

              return (
                <div key={rating} className="rating-breakdown-item">
                  <div className="rating-breakdown-header">
                    <StarRating rating={rating} readonly size="small" showValue={false} />
                    <span className="rating-breakdown-count">({count})</span>
                  </div>
                  <div className="rating-breakdown-bar">
                    <div
                      className="rating-breakdown-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="rating-breakdown-percentage">{percentage.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="review-filters">
        <button
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All Reviews ({myReviews.length})
        </button>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = myReviews.filter(review => review.rating === rating).length;
          if (count === 0) return null;

          return (
            <button
              key={rating}
              className={filter === `${rating}-star` ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter(`${rating}-star`)}
            >
              {rating}★ ({count})
            </button>
          );
        })}
      </div>

      {/* Reviews List */}
      {sortedReviews.length === 0 ? (
        <div className="empty-state">
          <h3>No reviews found</h3>
          <p>
            {filter === 'all'
              ? "You haven't written any reviews yet. Browse resources and share your experiences!"
              : `No reviews with ${filter.replace('-', ' ')}.`
            }
          </p>
        </div>
      ) : (
        <div className="reviews-list">
          <div className="reviews-header">
            <h3>Your Reviews ({sortedReviews.length})</h3>
          </div>

          <div className="my-reviews-container">
            {sortedReviews.map((review) => (
              <div key={review.id} className="my-review-item">
                <div className="my-review-resource">
                  <h4>Review for: {getResourceNameFromUrl(review.resource_url)}</h4>
                  <a
                    href={review.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    View Resource →
                  </a>
                </div>

                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      {myReviews.length > 0 && (
        <div className="review-tips">
          <h3>💡 Review Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>🎯 Be Specific</h4>
              <p>Include details about installation, configuration, and compatibility with your server setup.</p>
            </div>
            <div className="tip-card">
              <h4>⚖️ Stay Balanced</h4>
              <p>Mention both pros and cons to help others make informed decisions.</p>
            </div>
            <div className="tip-card">
              <h4>🔄 Update When Needed</h4>
              <p>If a resource gets updated or your experience changes, consider updating your review.</p>
            </div>
            <div className="tip-card">
              <h4>🤝 Be Constructive</h4>
              <p>Provide helpful feedback that can benefit both users and developers.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to extract resource name from GitHub URL
const getResourceNameFromUrl = (url) => {
  try {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Unknown Resource';
  } catch {
    return 'Unknown Resource';
  }
};

export default MyReviewsDashboard;
