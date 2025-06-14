import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

function App() {
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
  const [error, setError] = useState('');

  // Debounced search function
  const performSearch = useCallback(async (query, page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_BASE_URL}/search`, {
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
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Resource Search</h1>
        <p>Search through {pagination.totalMatches || 0} entries</p>
      </div>

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
          </div>          {results.length > 0 ? (
            <div className="results-grid">
              {results.map((item, index) => (
                <div key={item.id || index} className="result-item">
                  <div className="result-header">
                    <h3 className="result-name">{item.name}</h3>
                    {item.language && (
                      <span className="language-badge">{item.language}</span>
                    )}
                  </div>
                  
                  {item.description && item.description !== "No description" && (
                    <p className="result-description">{item.description}</p>
                  )}
                  
                  <div className="result-stats">
                    {item.rank && <span className="stat">Rank: #{item.rank.toLocaleString()}</span>}
                    {item.players && <span className="stat">Players: {item.players}</span>}
                    {item.servers && <span className="stat">Servers: {item.servers}</span>}
                    {item.stars !== undefined && <span className="stat">⭐ {item.stars}</span>}
                  </div>
                  
                  {item.rankChange && (
                    <div className={`rank-change ${item.rankChange > 0 ? 'positive' : 'negative'}`}>
                      {item.rankChange > 0 ? '↗' : '↘'} {Math.abs(item.rankChange).toLocaleString()}
                    </div>
                  )}
                  
                  {item.github_url && (
                    <a href={item.github_url} target="_blank" rel="noopener noreferrer" className="github-link">
                      View on GitHub
                    </a>
                  )}
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
    </div>
  );
}

export default App;
