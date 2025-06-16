import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from './config/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ResourceClaimProvider } from './contexts/ResourceClaimContext';
import { ReviewProvider, useReviews } from './contexts/ReviewContext';
import { RecipeProvider } from './contexts/RecipeContext';
import LoginButton from './components/LoginButton';
import Dashboard from './components/Dashboard';
import MyResourcesDashboard from './components/MyResourcesDashboard';
import MyReviewsDashboard from './components/MyReviewsDashboard';
import MyRecipesDashboard from './components/MyRecipesDashboard';
import ResourceClaimButton from './components/ResourceClaimButton';
import ResourceReviews from './components/ResourceReviews';
import RecipeGallery from './components/RecipeGallery';
import RecipeBuilder from './components/RecipeBuilder';
import StarRating from './components/StarRating';

// Configure axios defaults - now using environment-based API URL
console.log('API Base URL:', API_CONFIG.BASE_URL);
axios.defaults.withCredentials = true;

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalMatches: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  const [currentView, setCurrentView] = useState('browse'); // 'browse', 'dashboard', 'my-resources', 'my-reviews', 'recipes', 'recipe-builder'
  const [selectedResource, setSelectedResource] = useState(null); // For detailed view
  const [editingRecipe, setEditingRecipe] = useState(null); // For recipe editing

  const { user, isAuthenticated } = useAuth();
  const { getResourceRating } = useReviews();
  // Check URL for dashboard redirect after login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      const token = urlParams.get('token');
      if (token) {
        // Store token in localStorage as fallback for cross-domain cookies
        localStorage.setItem('auth_token', token);
      }
      setCurrentView('dashboard');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (query, page = 1) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get('/search', {
        params: {
          q: query,
          page: page
        }
      });

      setResults(response.data.results);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to search. Please make sure the backend server is running.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery, 1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Initial load
  useEffect(() => {
    performSearch('', 1);
  }, [performSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      performSearch(searchQuery, newPage);
    }
  };

  const handlePrevious = () => {
    if (pagination.hasPrevious) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNext) {
      handlePageChange(pagination.currentPage + 1);
    }
  };  const renderNavigation = () => (
    <nav className="main-nav">
      <button
        onClick={() => setCurrentView('browse')}
        className={currentView === 'browse' ? 'active' : ''}
      >
        Browse Resources
      </button>
      <button
        onClick={() => setCurrentView('recipes')}
        className={currentView === 'recipes' || currentView === 'recipe-builder' ? 'active' : ''}
      >
        Recipe Gallery
      </button>
      {isAuthenticated && (
        <>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={currentView === 'dashboard' ? 'active' : ''}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('my-resources')}
            className={currentView === 'my-resources' ? 'active' : ''}
          >
            My Resources
          </button>
          <button
            onClick={() => setCurrentView('my-reviews')}
            className={currentView === 'my-reviews' ? 'active' : ''}
          >
            My Reviews
          </button>
        </>
      )}
    </nav>
  );

  const renderBrowseView = () => (
    <>
      <div className="search-container">
        <input
          type="text"
          className="search-box"
          placeholder="Search by name, description, or language..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {loading && <div className="loading">Searching...</div>}

      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="results-info">
            {searchQuery ? (
              <>
                Found {pagination.totalMatches} results for "{searchQuery}"
                {pagination.totalPages > 1 && (
                  <> (Page {pagination.currentPage} of {pagination.totalPages})</>
                )}
              </>
            ) : (
              <>
                Showing {pagination.totalMatches} total entries
                {pagination.totalPages > 1 && (
                  <> (Page {pagination.currentPage} of {pagination.totalPages})</>
                )}
              </>
            )}
          </div>

          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((item, index) => (
                <div key={item.id || index} className="result-item">                  <div className="result-header">
                    <div className="resource-info">
                      <h3 className="result-name">{item.name}</h3>
                      <div className="resource-meta">
                        {item.language && (
                          <span className="language-badge">{item.language}</span>
                        )}
                        {/* Rating Display */}
                        {(() => {
                          const rating = getResourceRating(item.github_url);
                          return rating.count > 0 && (
                            <div className="result-rating">
                              <StarRating rating={rating.average} readonly size="small" showValue={false} />
                              <span className="rating-text">
                                {rating.average.toFixed(1)} ({rating.count})
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="resource-stats">
                      {item.stars !== undefined && <span className="stat">⭐ {item.stars}</span>}
                    </div>
                  </div>

                  {item.description && item.description !== "No description" && (
                    <p className="result-description">{item.description}</p>
                  )}

                  <div className="result-stats">
                    {item.rank && <span className="stat">Rank: #{item.rank.toLocaleString()}</span>}
                    {item.players && <span className="stat">Players: {item.players}</span>}
                    {item.servers && <span className="stat">Servers: {item.servers}</span>}
                  </div>

                  {item.rankChange && (
                    <div className={`rank-change ${item.rankChange > 0 ? 'positive' : 'negative'}`}>
                      {item.rankChange > 0 ? '↗' : '↘'} {Math.abs(item.rankChange).toLocaleString()}
                    </div>
                  )}                    <div className="result-actions">
                    {item.github_url && (
                      <a href={item.github_url} target="_blank" rel="noopener noreferrer" className="github-link">
                        View on GitHub
                      </a>
                    )}
                    <button
                      className="view-details-btn"
                      onClick={() => setSelectedResource(item)}
                    >
                      View Details & Reviews
                    </button>
                    <ResourceClaimButton resource={item} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              {searchQuery ? `No results found for "${searchQuery}"` : 'No entries available'}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={handlePrevious}
                disabled={!pagination.hasPrevious}
              >
                Previous
              </button>

              <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={handleNext}
                disabled={!pagination.hasNext}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="container">
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>FiveM Resource Hub</h1>
            <p>Discover, review, and organize FiveM resources</p>
          </div>
            <div className="header-right">
            <LoginButton />
          </div>
        </div>

        {renderNavigation()}
      </div>      <div className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'my-resources' && <MyResourcesDashboard />}
        {currentView === 'my-reviews' && <MyReviewsDashboard />}
        {currentView === 'recipes' && (
          <RecipeGallery
            onCreateNew={() => {
              setEditingRecipe(null);
              setCurrentView('recipe-builder');
            }}
            onEditRecipe={(recipe) => {
              setEditingRecipe(recipe);
              setCurrentView('recipe-builder');
            }}
          />
        )}
        {currentView === 'recipe-builder' && (
          <RecipeBuilder
            recipe={editingRecipe}
            onSave={(recipe) => {
              setCurrentView('recipes');
              setEditingRecipe(null);
            }}
            onCancel={() => {
              setCurrentView('recipes');
              setEditingRecipe(null);
            }}
          />
        )}
        {currentView === 'browse' && !selectedResource && renderBrowseView()}
        {currentView === 'browse' && selectedResource && (
          <div className="resource-detail-view">
            <div className="resource-detail-header">
              <button
                className="back-btn"
                onClick={() => setSelectedResource(null)}
              >
                ← Back to Search
              </button>
              <h2>{selectedResource.name}</h2>
            </div>

            <div className="resource-detail-content">
              <div className="resource-info-section">
                <div className="resource-meta-detailed">
                  {selectedResource.language && (
                    <span className="language-badge">{selectedResource.language}</span>
                  )}
                  {selectedResource.stars !== undefined && (
                    <span className="stars-badge">⭐ {selectedResource.stars}</span>
                  )}
                </div>

                {selectedResource.description && selectedResource.description !== "No description" && (
                  <p className="resource-description">{selectedResource.description}</p>
                )}

                <div className="resource-stats-detailed">
                  {selectedResource.rank && (
                    <div className="stat-item">
                      <span className="stat-label">Rank:</span>
                      <span className="stat-value">#{selectedResource.rank.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedResource.servers && (
                    <div className="stat-item">
                      <span className="stat-label">Servers:</span>
                      <span className="stat-value">{selectedResource.servers}</span>
                    </div>
                  )}
                  {selectedResource.players && (
                    <div className="stat-item">
                      <span className="stat-label">Players:</span>
                      <span className="stat-value">{selectedResource.players}</span>
                    </div>
                  )}
                </div>

                <div className="resource-actions-detailed">
                  {selectedResource.github_url && (
                    <a
                      href={selectedResource.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="github-link-detailed"
                    >
                      View on GitHub
                    </a>
                  )}
                  <ResourceClaimButton resource={selectedResource} />
                </div>
              </div>

              <ResourceReviews resource={selectedResource} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ResourceClaimProvider>
        <ReviewProvider>
          <RecipeProvider>
            <AppContent />
          </RecipeProvider>
        </ReviewProvider>
      </ResourceClaimProvider>
    </AuthProvider>
  );
}

export default App;
