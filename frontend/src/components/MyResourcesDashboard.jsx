import React, { useState } from 'react';
import { useMockAuth } from '../contexts/MockAuthContext';
import { useResourceClaims } from '../contexts/ResourceClaimContext';

const MyResourcesDashboard = () => {
  const { user, loading: authLoading } = useMockAuth();
  const {
    getUserClaimedResources,
    getClaimStats,
    updateResourceClaim,
    unclaimResource,
    loading: claimLoading
  } = useResourceClaims();

  const [selectedResource, setSelectedResource] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, verified, disputed

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please sign in to view your claimed resources.</p>
        </div>
      </div>
    );
  }

  const claimedResources = getUserClaimedResources();
  const stats = getClaimStats();

  const filteredResources = claimedResources.filter(resource => {
    if (filter === 'all') return true;
    return resource.claim_status === filter;
  });

  const handleUpdateNotes = async (resourceUrl) => {
    try {
      await updateResourceClaim(resourceUrl, { notes });
      setEditingNotes(false);
      setSelectedResource(null);
    } catch (error) {
      alert('Failed to update notes: ' + error.message);
    }
  };

  const handleStatusChange = async (resourceUrl, newStatus) => {
    try {
      await updateResourceClaim(resourceUrl, { claim_status: newStatus });
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleUnclaim = async (resourceUrl) => {
    if (!window.confirm('Are you sure you want to unclaim this resource?')) {
      return;
    }

    try {
      await unclaimResource(resourceUrl);
    } catch (error) {
      alert('Failed to unclaim resource: ' + error.message);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>My Claimed Resources</h1>
        <p>Manage and organize your FiveM resource collection</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Claimed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.verified}</div>
          <div className="stat-label">Verified</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.disputed}</div>
          <div className="stat-label">Disputed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="resource-filters">
        <button
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={filter === 'pending' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={filter === 'verified' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('verified')}
        >
          Verified ({stats.verified})
        </button>
        <button
          className={filter === 'disputed' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('disputed')}
        >
          Disputed ({stats.disputed})
        </button>
      </div>

      {/* Resources List */}
      {filteredResources.length === 0 ? (
        <div className="empty-state">
          <h3>No resources found</h3>
          <p>
            {filter === 'all'
              ? "You haven't claimed any resources yet. Browse resources to get started!"
              : `No resources with status "${filter}".`
            }
          </p>
        </div>
      ) : (
        <div className="resources-list">
          {filteredResources.map((resource) => (
            <div key={resource.github_url} className="claimed-resource-card">
              <div className="resource-header">
                <div className="resource-info">
                  <h3 className="resource-name">{resource.name}</h3>
                  <div className="resource-meta">
                    {resource.language && (
                      <span className="language-badge">{resource.language}</span>
                    )}
                    {resource.stars !== undefined && (
                      <span className="stars-badge">⭐ {resource.stars}</span>
                    )}
                    <span className={`status-badge ${resource.claim_status}`}>
                      {resource.claim_status}
                    </span>
                  </div>
                </div>

                <div className="resource-actions">
                  <button
                    className="btn-icon"
                    onClick={() => {
                      setSelectedResource(resource);
                      setNotes(resource.notes || '');
                      setEditingNotes(true);
                    }}
                    title="Edit notes"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleUnclaim(resource.github_url)}
                    title="Unclaim resource"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {resource.description && (
                <p className="resource-description">{resource.description}</p>
              )}

              {resource.notes && (
                <div className="resource-notes">
                  <strong>Your notes:</strong>
                  <p>{resource.notes}</p>
                </div>
              )}

              <div className="resource-footer">
                <div className="claim-date">
                  Claimed on {new Date(resource.claimed_at).toLocaleDateString()}
                </div>

                <div className="status-controls">
                  <select
                    value={resource.claim_status}
                    onChange={(e) => handleStatusChange(resource.github_url, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>

                {resource.github_url && (
                  <a
                    href={resource.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                  >
                    View on GitHub
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Notes Modal */}
      {editingNotes && selectedResource && (
        <div className="modal-overlay" onClick={() => setEditingNotes(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Notes: {selectedResource.name}</h3>
              <button
                className="modal-close"
                onClick={() => setEditingNotes(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label htmlFor="resource-notes">
                Your notes about this resource:
              </label>
              <textarea
                id="resource-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your experience, compatibility notes, configuration tips, etc."
                rows={4}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setEditingNotes(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => handleUpdateNotes(selectedResource.github_url)}
                disabled={claimLoading}
              >
                {claimLoading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyResourcesDashboard;
