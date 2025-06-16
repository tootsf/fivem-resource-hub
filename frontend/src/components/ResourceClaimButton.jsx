import React, { useState } from 'react';
import { useResourceClaims } from '../contexts/ResourceClaimContext';
import { useAuth } from '../contexts/AuthContext';

const ResourceClaimButton = ({ resource }) => {
  const { isAuthenticated } = useAuth();
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

  const isClaimedByMe = isResourceClaimedByUser(resource.github_url);
  const resourceClaim = getResourceClaim(resource.github_url);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      alert('Please login to claim resources');
      return;
    }

    setActionLoading(true);
    try {
      const result = await claimResource({
        ...resource,
        notes: claimNotes
      });

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
    }

    setActionLoading(true);
    try {
      const result = await unclaimResource(resource.github_url);
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
    );
  }

  return (
    <>
      <button
        className="claim-btn"
        onClick={() => setShowClaimModal(true)}
        disabled={actionLoading || loading}
      >
        <span className="claim-icon">📌</span>
        {actionLoading ? 'Claiming...' : 'Claim Resource'}
      </button>

      {showClaimModal && (
        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Claim Resource</h3>
              <button
                className="modal-close"
                onClick={() => setShowClaimModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="resource-preview">
                <h4>{resource.name}</h4>
                <p>{resource.description}</p>
                <div className="resource-meta">
                  {resource.language && (
                    <span className="language-badge">{resource.language}</span>
                  )}
                  {resource.stars !== undefined && (
                    <span className="stars-badge">⭐ {resource.stars}</span>
                  )}
                </div>
              </div>

              <div className="claim-form">
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
                </ul>
              </div>
            </div>

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
                {actionLoading ? 'Claiming...' : 'Claim Resource'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResourceClaimButton;

