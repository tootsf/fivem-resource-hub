import React, { useState } from 'react';
import { useMockAuth } from '../contexts/MockAuthContext';
import { useRecipes } from '../contexts/RecipeContext';

const MyRecipesDashboard = ({ onCreateNew, onEditRecipe }) => {
  const { user, loading: authLoading } = useMockAuth();
  const {
    getUserRecipes,
    deleteRecipe,
    loading: recipeLoading,
    downloadRecipe
  } = useRecipes();

  const [filter, setFilter] = useState('all'); // all, public, private
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular, downloads

  if (authLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please sign in to view your recipes.</p>
        </div>
      </div>
    );
  }

  const myRecipes = getUserRecipes();

  const filteredRecipes = myRecipes.filter(recipe => {
    if (filter === 'public') return recipe.is_public;
    if (filter === 'private') return !recipe.is_public;
    return true;
  });

  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'popular':
        return b.like_count - a.like_count;
      case 'downloads':
        return b.download_count - a.download_count;
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteRecipe(recipeId);
    } catch (error) {
      alert('Error deleting recipe: ' + error.message);
    }
  };

  const handleDownload = async (recipe) => {
    try {
      await downloadRecipe(recipe.id);

      // Generate and download the config file
      const config = generateServerConfig(recipe);
      const blob = new Blob([config], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_server.cfg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading recipe: ' + error.message);
    }
  };

  const stats = {
    total: myRecipes.length,
    public: myRecipes.filter(r => r.is_public).length,
    private: myRecipes.filter(r => !r.is_public).length,
    totalDownloads: myRecipes.reduce((sum, recipe) => sum + recipe.download_count, 0),
    totalLikes: myRecipes.reduce((sum, recipe) => sum + recipe.like_count, 0)
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My Recipes</h1>
          <p>Create and manage your FiveM server configuration recipes</p>
        </div>

        <button onClick={onCreateNew} className="btn-primary">
          + Create New Recipe
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Recipes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.public}</div>
          <div className="stat-label">Public</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalDownloads}</div>
          <div className="stat-label">Total Downloads</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalLikes}</div>
          <div className="stat-label">Total Likes</div>
        </div>
      </div>

      {/* Quick Actions */}
      {myRecipes.length === 0 && (
        <div className="quick-actions">
          <h3>Get Started with Recipe Builder</h3>
          <div className="action-cards">
            <div className="action-card">
              <h4>🚀 Create Your First Recipe</h4>
              <p>Build a complete server configuration with our visual recipe builder.</p>
              <button onClick={onCreateNew} className="btn-primary">
                Create Recipe
              </button>
            </div>
            <div className="action-card">
              <h4>📚 Browse Templates</h4>
              <p>Start from existing recipes and customize them for your server.</p>
              <button className="btn-secondary">
                Browse Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      {myRecipes.length > 0 && (
        <div className="recipe-controls">
          <div className="recipe-filters">
            <button
              className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('all')}
            >
              All ({stats.total})
            </button>
            <button
              className={filter === 'public' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('public')}
            >
              Public ({stats.public})
            </button>
            <button
              className={filter === 'private' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('private')}
            >
              Private ({stats.private})
            </button>
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-recipes">Sort by:</label>
            <select
              id="sort-recipes"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Liked</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>
      )}

      {/* Recipes List */}
      {sortedRecipes.length === 0 ? (
        <div className="empty-state">
          <h3>No recipes found</h3>
          <p>
            {filter === 'all'
              ? "You haven't created any recipes yet. Click 'Create New Recipe' to get started!"
              : `No ${filter} recipes found.`
            }
          </p>
        </div>
      ) : (
        <div className="my-recipes-list">
          {sortedRecipes.map((recipe) => (
            <MyRecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={onEditRecipe}
              onDelete={handleDelete}
              onDownload={handleDownload}
              loading={recipeLoading}
            />
          ))}
        </div>
      )}

      {/* Recipe Builder Tips */}
      {myRecipes.length > 0 && (
        <div className="recipe-tips">
          <h3>💡 Recipe Builder Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>📋 Organize Resources</h4>
              <p>Set proper load orders for your resources to avoid conflicts and ensure smooth server startup.</p>
            </div>
            <div className="tip-card">
              <h4>🔧 Framework Configuration</h4>
              <p>Configure framework-specific settings to match your server's needs and gameplay style.</p>
            </div>
            <div className="tip-card">
              <h4>🌐 Share with Community</h4>
              <p>Make your recipes public to help other server owners and get feedback from the community.</p>
            </div>
            <div className="tip-card">
              <h4>📥 Easy Deployment</h4>
              <p>Download generated server.cfg files and use them directly with your FiveM server setup.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Recipe Card Component
const MyRecipeCard = ({ recipe, onEdit, onDelete, onDownload, loading }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="my-recipe-card">
      <div className="recipe-card-header">
        <div className="recipe-title-section">
          <h3>{recipe.name}</h3>
          <div className="recipe-badges">
            <span className="framework-badge">{recipe.framework.toUpperCase()}</span>
            <span className="category-badge">{recipe.category}</span>
            {recipe.is_public ? (
              <span className="visibility-badge public">Public</span>
            ) : (
              <span className="visibility-badge private">Private</span>
            )}
            {recipe.is_featured && <span className="featured-badge">Featured</span>}
          </div>
        </div>

        <div className="recipe-actions">
          <button
            onClick={() => onEdit(recipe)}
            className="btn-icon"
            title="Edit recipe"
          >
            ✏️
          </button>
          <button
            onClick={() => onDownload(recipe)}
            className="btn-icon"
            title="Download server.cfg"
          >
            📥
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn-icon"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? '▲' : '▼'}
          </button>
          <button
            onClick={() => onDelete(recipe.id)}
            className="btn-icon danger"
            title="Delete recipe"
            disabled={loading}
          >
            🗑️
          </button>
        </div>
      </div>

      <p className="recipe-description">{recipe.description}</p>

      <div className="recipe-quick-stats">
        <div className="stat-item">
          <span className="stat-icon">📦</span>
          <span>{recipe.resources.length} resources</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">👥</span>
          <span>{recipe.server_config.max_players} players</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">❤️</span>
          <span>{recipe.like_count} likes</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📥</span>
          <span>{recipe.download_count} downloads</span>
        </div>
      </div>

      {showDetails && (
        <div className="recipe-details">
          <div className="details-section">
            <h4>Resources ({recipe.resources.length})</h4>
            {recipe.resources.length > 0 ? (
              <div className="resources-list-compact">
                {recipe.resources
                  .sort((a, b) => a.load_order - b.load_order)
                  .map((resource, index) => (
                    <div key={index} className="resource-item-compact">
                      <span className="load-order">#{resource.load_order}</span>
                      <span className="resource-name">{resource.name}</span>
                      {resource.required && <span className="required-indicator">Required</span>}
                      <span className="resource-category">{resource.category}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="no-resources-text">No resources added yet.</p>
            )}
          </div>

          <div className="details-section">
            <h4>Configuration</h4>
            <div className="config-summary">
              <div className="config-item">
                <span className="config-label">Framework:</span>
                <span className="config-value">{recipe.framework.toUpperCase()}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Max Players:</span>
                <span className="config-value">{recipe.server_config.max_players}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Database:</span>
                <span className="config-value">{recipe.server_config.database_config.type}</span>
              </div>
            </div>
          </div>

          {recipe.tags.length > 0 && (
            <div className="details-section">
              <h4>Tags</h4>
              <div className="recipe-tags">
                {recipe.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="recipe-card-footer">
        <div className="recipe-dates">
          <span>Created: {formatDate(recipe.created_at)}</span>
          {recipe.updated_at !== recipe.created_at && (
            <span>Updated: {formatDate(recipe.updated_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate server config
const generateServerConfig = (recipe) => {
  const resources = recipe.resources
    .sort((a, b) => a.load_order - b.load_order)
    .map(resource => resource.name);

  const config = `# ${recipe.name}
# Generated by FiveM Resource Hub Recipe Builder
# ${recipe.description}
# Framework: ${recipe.framework.toUpperCase()}
# Created: ${new Date(recipe.created_at).toLocaleDateString()}

# Basic Server Configuration
endpoint_add_tcp "0.0.0.0:30120"
endpoint_add_udp "0.0.0.0:30120"

# Server Information
sv_hostname "${recipe.name} - Generated Server"
sv_maxclients ${recipe.server_config.max_players}

# Resources
${resources.map(resource => `start ${resource}`).join('\n')}

# Framework Configuration
${recipe.framework === 'esx' ? generateESXConfig(recipe) : ''}
${recipe.framework === 'qbcore' ? generateQBConfig(recipe) : ''}

# Database Configuration
${generateDatabaseConfig(recipe)}

# Additional Configuration
set temp_convar "change_me"
sets tags "${recipe.tags.join(', ')}"

# End of ${recipe.name} Configuration`;

  return config;
};

const generateESXConfig = (recipe) => {
  const config = recipe.server_config.framework_config || {};
  return `
# ESX Configuration
setr es_enableCustomUI 1
setr esx_multichar ${config.enable_multichar ? 'true' : 'false'}
setr esx_starting_money ${config.starting_money || 50000}`;
};

const generateQBConfig = (recipe) => {
  const config = recipe.server_config.framework_config || {};
  return `
# QB-Core Configuration
setr qb_starting_money ${config.starting_money || 50000}
setr qb_racing ${config.enable_racing ? 'true' : 'false'}`;
};

const generateDatabaseConfig = (recipe) => {
  const dbConfig = recipe.server_config.database_config || {};
  return `
# Database Configuration (${dbConfig.type || 'mysql'})
# Required tables: ${(dbConfig.required_tables || []).join(', ')}
set mysql_connection_string "mysql://user:password@localhost:3306/database"`;
};

export default MyRecipesDashboard;
