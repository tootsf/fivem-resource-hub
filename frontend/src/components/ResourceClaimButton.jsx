import React, { useState, useEffect } from 'react';
import { useResourceClaims } from '../contexts/ResourceClaimContext';
import { useAuth } from '../contexts/AuthContext';

const ResourceClaimButton = ({ resource }) => {
  const { isAuthenticated, user } = useAuth();
  const {
    claimResource,
    unclaimResource,
    isResourceClaimedByUser,
    getResourceClaim,
    loading
  } = useResourceClaims();

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimNotes, setClaimNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [canClaim, setCanClaim] = useState(null);

  const isClaimedByMe = isResourceClaimedByUser(resource.id);
  const resourceClaim = getResourceClaim(resource.id);

  // Helper function to extract GitHub username from repository URL
  const getGitHubOwner = (githubUrl) => {
    if (!githubUrl) return null;
    const match = githubUrl.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : null;
  };

  // Check if user owns this repository
  const repoOwner = getGitHubOwner(resource.github_url);
  const isOwner = isAuthenticated && user && repoOwner &&
                 repoOwner.toLowerCase() === user.username.toLowerCase();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setCanClaim(!isClaimedByMe && !isOwner);
    }
  }, [isAuthenticated, loading, isClaimedByMe, isOwner]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      alert('Please login to claim resources');
      return;
    }

    setActionLoading(true);    try {
      const result = await claimResource(resource);

      if (result.success) {
        setShowClaimModal(false);
        setClaimNotes('');
      } else {
        alert('Failed to claim resource: ' + result.error);
      }
    } catch (error) {
      alert('Error claiming resource: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnclaim = async () => {
    if (!window.confirm('Are you sure you want to unclaim this resource?')) {
      return;
    }    setActionLoading(true);
    try {
      const result = await unclaimResource(resource.id);
      if (!result.success) {
        alert('Failed to unclaim resource: ' + result.error);
      }
    } catch (error) {
      alert('Error unclaiming resource: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };
  if (!isAuthenticated) {
    return (
      <button className="claim-btn disabled" disabled>
        <span className="claim-icon">🔒</span>
        Login to Claim
      </button>
    );
  }

  // If already claimed by someone else
  if (resource.claimed_by && !isClaimedByMe) {
    return (
      <div className="claim-status">
        <span className="claim-icon">🔒</span>
        <span className="claim-text">Claimed by {resource.claimed_by_username || 'another user'}</span>
      </div>
    );
  }

  // If claimed by current user
  if (isClaimedByMe) {
    return (
      <div className="claim-status">
        <div className="claimed-indicator">
          <span className="claim-icon">✅</span>
          <span className="claim-text">Claimed by you</span>
          <span className="claim-date">
            {new Date(resourceClaim.claimed_at).toLocaleDateString()}
          </span>
        </div>
        <button
          className="unclaim-btn"
          onClick={handleUnclaim}
          disabled={actionLoading || loading}
        >
          {actionLoading ? 'Unclaiming...' : 'Unclaim'}
        </button>
      </div>
    );  }

  // Check if user can claim (ownership verification)
  if (!isOwner) {
    return (
      <div className="claim-status">
        <span className="claim-icon">ℹ️</span>
        <span className="claim-text">
          Only the repository owner ({repoOwner}) can claim this resource
        </span>
      </div>
    );
  }

  // User can claim - show claim button
  return (
    <>
      <button
        className="claim-btn owner"
        onClick={() => setShowClaimModal(true)}
        disabled={actionLoading || loading}
        title="You own this repository and can claim it"
      >
        <span className="claim-icon">🏆</span>
        {actionLoading ? 'Claiming...' : 'Claim My Resource'}
      </button>

      {showClaimModal && (        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏆 Claim Your Resource</h3>
              <button
                className="modal-close"
                onClick={() => setShowClaimModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="ownership-verification">
                <p className="verification-text">
                  ✅ <strong>Ownership Verified:</strong> You are the owner of this GitHub repository.
                </p>
              </div>

              <div className="resource-preview">
                <h4>{resource.name}</h4>
                <p>{resource.description}</p>
                <div className="resource-meta">
                  <span className="github-owner">👤 {repoOwner}</span>
                  {resource.language && (
                    <span className="language-badge">{resource.language}</span>
                  )}
                  {resource.stars !== undefined && (
                    <span className="stars-badge">⭐ {resource.stars}</span>
                  )}
                </div>
              </div>

              <div className="claim-benefits">
                <h5>By claiming this resource, you can:</h5>
                <ul>
                  <li>📝 Respond to user reviews and feedback</li>
                  <li>📊 View detailed analytics and statistics</li>
                  <li>🏷️ Add custom tags and categories</li>
                  <li>📢 Post updates and announcements</li>
                </ul>
              </div>
                <label htmlFor="claim-notes">
                  Notes (optional)
                  <small>Add any notes about this resource - your experience, compatibility, etc.</small>
                </label>
                <textarea
                  id="claim-notes"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="e.g., Works great on my ESX server, needed minor config changes..."
                  rows={3}
                />
              </div>

              <div className="claim-info">
                <h5>What does claiming mean?</h5>
                <ul>
                  <li>Mark this resource as one you've used or tested</li>
                  <li>Add it to your resource collection</li>
                  <li>Share your experience with the community</li>
                  <li>Help others discover quality resources</li>
                </ul>            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowClaimModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleClaim}
                disabled={actionLoading}
              >
                {actionLoading ? 'Claiming...' : 'Claim My Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceClaimButton;

