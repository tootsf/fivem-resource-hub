import React, { useState } from 'react';
import { useReviews } from '../contexts/ReviewContext';
import { useMockAuth } from '../contexts/MockAuthContext';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

const ResourceReviews = ({ resource }) => {
  const { isAuthenticated } = useMockAuth();
  const { getResourceReviews, getResourceRating, hasUserReviewed } = useReviews();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rating-high, rating-low, helpful

  const reviews = getResourceReviews(resource.github_url);
  const rating = getResourceRating(resource.github_url);
  const userHasReviewed = hasUserReviewed(resource.github_url);

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'rating-high':
        return b.rating - a.rating;
      case 'rating-low':
        return a.rating - b.rating;
      case 'helpful':
        return b.helpful_count - a.helpful_count;
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(review => review.rating === star).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { star, count, percentage };
  });

  const handleReviewSuccess = (newReview) => {
    setShowReviewForm(false);
    // Review is automatically added to context, no need to do anything else
  };

  return (
    <div className="resource-reviews">
      <div className="reviews-header">
        <h3>Reviews & Ratings</h3>
        
        {/* Overall Rating Summary */}
        <div className="rating-summary">
          <div className="rating-overview">
            <div className="overall-rating">
              <span className="rating-number">{rating.average.toFixed(1)}</span>
              <StarRating rating={rating.average} readonly size="large" showValue={false} />
              <span className="rating-count">
                {rating.count} review{rating.count !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Rating Distribution */}
            {reviews.length > 0 && (
              <div className="rating-distribution">
                {ratingDistribution.map(({ star, count, percentage }) => (
                  <div key={star} className="rating-row">
                    <span className="star-label">{star}★</span>
                    <div className="rating-bar">
                      <div 
                        className="rating-fill" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="rating-count-small">({count})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write Review Button */}
          <div className="review-actions">
            {!isAuthenticated ? (
              <div className="auth-prompt">
                <p>Sign in to write a review</p>
              </div>
            ) : userHasReviewed ? (
              <div className="already-reviewed">
                <p>✓ You've already reviewed this resource</p>
              </div>
            ) : (
              <button 
                className="write-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                ✍️ Write a Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="review-form-container">
          <ReviewForm 
            resource={resource}
            onSuccess={handleReviewSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="reviews-list">
          <div className="reviews-controls">
            <div className="sort-controls">
              <label htmlFor="sort-select">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>

          <div className="reviews-container">
            {sortedReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}          </div>
        </div>
      ) : !showReviewForm && (
        <div className="no-reviews">
          <div className="no-reviews-content">
            <h4>No reviews yet</h4>
            <p>Be the first to share your experience with this resource!</p>
            {isAuthenticated && !userHasReviewed && (
              <button 
                className="write-first-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                Write the First Review
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceReviews;
