import React, { useState } from 'react';
import { useReviews } from '../contexts/ReviewContext';
import { useMockAuth } from '../contexts/MockAuthContext';
import StarRating from './StarRating';

const ReviewCard = ({ review }) => {
  const { user } = useMockAuth();
  const { markHelpful, reportReview, deleteReview, getUserHelpfulVotes } = useReviews();
  const [showFullContent, setShowFullContent] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const helpfulVotes = getUserHelpfulVotes();
  const hasVotedHelpful = helpfulVotes.includes(review.id);
  const isOwnReview = user?.id === review.user_id;

  const handleHelpful = async () => {
    try {
      await markHelpful(review.id);
    } catch (error) {
      alert('Error voting: ' + error.message);
    }
  };

  const handleReport = async (reason) => {
    try {
      await reportReview(review.id, reason);
      setShowReportModal(false);
      alert('Review reported. Thank you for helping keep our community safe.');
    } catch (error) {
      alert('Error reporting review: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteReview(review.id);
    } catch (error) {
      alert('Error deleting review: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shouldTruncate = review.content.length > 300;
  const displayContent = shouldTruncate && !showFullContent 
    ? review.content.slice(0, 300) + '...'
    : review.content;

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="reviewer-info">
          <img 
            src={review.avatar_url} 
            alt={review.display_name} 
            className="reviewer-avatar"
          />
          <div className="reviewer-details">
            <div className="reviewer-name">{review.display_name}</div>
            <div className="reviewer-username">@{review.username}</div>
            <div className="review-date">{formatDate(review.created_at)}</div>
          </div>
        </div>

        <div className="review-rating">
          <StarRating rating={review.rating} readonly size="small" showValue={false} />
          <span className="rating-text">{review.rating}/5</span>
        </div>
      </div>

      <div className="review-content">
        <h4 className="review-title">{review.title}</h4>
        
        <div className="review-text">
          <p>{displayContent}</p>
          {shouldTruncate && (
            <button 
              className="read-more-btn"
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>

        {/* Pros and Cons */}
        {(review.pros?.length > 0 || review.cons?.length > 0) && (
          <div className="pros-cons">
            {review.pros?.length > 0 && (
              <div className="pros">
                <h5>👍 Pros</h5>
                <ul>
                  {review.pros.map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {review.cons?.length > 0 && (
              <div className="cons">
                <h5>👎 Cons</h5>
                <ul>
                  {review.cons.map((con, index) => (
                    <li key={index}>{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Compatibility Info */}
        {review.compatibility && (
          <div className="compatibility-info">
            <h5>🔧 Compatibility</h5>
            <div className="compatibility-details">
              {review.compatibility.framework && (
                <span className="framework-badge">
                  {review.compatibility.framework.toUpperCase()}
                </span>
              )}
              {review.compatibility.version && (
                <span className="version-info">
                  Version: {review.compatibility.version}
                </span>
              )}
              {review.compatibility.tested_version && (
                <span className="tested-info">
                  Tested with: {review.compatibility.tested_version}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Server Info */}
        {review.server_info && (review.server_info.player_count || review.server_info.uptime) && (
          <div className="server-info">
            <h5>🖥️ Server Details</h5>
            <div className="server-details">
              {review.server_info.player_count && (
                <span>Players: {review.server_info.player_count}</span>
              )}
              {review.server_info.uptime && (
                <span>Uptime: {review.server_info.uptime}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="review-actions">
        <button 
          className={`helpful-btn ${hasVotedHelpful ? 'voted' : ''}`}
          onClick={handleHelpful}
          disabled={isOwnReview}
        >
          👍 {hasVotedHelpful ? 'Helpful' : 'Mark Helpful'} ({review.helpful_count})
        </button>

        {!isOwnReview && (
          <button 
            className="report-btn"
            onClick={() => setShowReportModal(true)}
          >
            🚩 Report
          </button>
        )}

        {isOwnReview && (
          <button 
            className="delete-btn"
            onClick={handleDelete}
          >
            🗑️ Delete
          </button>
        )}

        {review.verified_purchase && (
          <span className="verified-badge">
            ✓ Verified User
          </span>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Review</h3>
              <button 
                className="modal-close"
                onClick={() => setShowReportModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Why are you reporting this review?</p>
              <div className="report-reasons">
                <button 
                  className="report-reason"
                  onClick={() => handleReport('spam')}
                >
                  Spam or fake review
                </button>
                <button 
                  className="report-reason"
                  onClick={() => handleReport('inappropriate')}
                >
                  Inappropriate content
                </button>
                <button 
                  className="report-reason"
                  onClick={() => handleReport('misleading')}
                >
                  Misleading information
                </button>
                <button 
                  className="report-reason"
                  onClick={() => handleReport('other')}
                >
                  Other
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
