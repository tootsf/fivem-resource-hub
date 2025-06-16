import React, { useState } from 'react';
import { useRecipes, RECIPE_CATEGORIES, FRAMEWORKS } from '../contexts/RecipeContext';
import { useAuth } from '../contexts/AuthContext';

const RecipeGallery = ({ onCreateNew, onEditRecipe }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    getPublicRecipes,
    getFeaturedRecipes,
    getRecipesByCategory,
    getRecipesByFramework,
    searchRecipes,
    likeRecipe,
    downloadRecipe,
    getUserLikedRecipes
  } = useRecipes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [sortBy, setSortBy] = useState('featured'); // featured, newest, popular, downloads

  const likedRecipes = getUserLikedRecipes();

  // Get recipes based on filters
  const getFilteredRecipes = () => {
    let recipes = [];

    if (searchQuery.trim()) {
      recipes = searchRecipes(searchQuery);
    } else if (selectedCategory !== 'all') {
      recipes = getRecipesByCategory(selectedCategory);
    } else if (selectedFramework !== 'all') {
      recipes = getRecipesByFramework(selectedFramework);
    } else {
      recipes = getPublicRecipes();
    }

    // Apply sorting
    return recipes.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'popular':
          return b.like_count - a.like_count;
        case 'downloads':
          return b.download_count - a.download_count;
        case 'featured':
        default:
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.download_count - a.download_count;
      }
    });
  };

  const handleLike = async (recipeId) => {
    if (!isAuthenticated) {
      alert('Please login to like recipes');
      return;
    }

    try {
      await likeRecipe(recipeId);
    } catch (error) {
      alert('Error liking recipe: ' + error.message);
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

  const filteredRecipes = getFilteredRecipes();
  const featuredRecipes = getFeaturedRecipes();

  return (
    <div className="recipe-gallery">
      <div className="gallery-header">
        <div className="header-content">
          <h1>Recipe Gallery</h1>
          <p>Discover and download ready-to-use FiveM server configurations</p>
        </div>

        {isAuthenticated && (
          <button onClick={onCreateNew} className="btn-primary">
            + Create New Recipe
          </button>
        )}
      </div>

      {/* Featured Recipes */}
      {featuredRecipes.length > 0 && selectedCategory === 'all' && selectedFramework === 'all' && !searchQuery && (
        <div className="featured-section">
          <h2>Featured Recipes</h2>
          <div className="featured-recipes">
            {featuredRecipes.slice(0, 3).map(recipe => (
              <FeaturedRecipeCard
                key={recipe.id}
                recipe={recipe}
                isLiked={likedRecipes.includes(recipe.id)}
                onLike={handleLike}
                onDownload={handleDownload}
                onEdit={onEditRecipe}
                currentUser={user}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="gallery-filters">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {Object.entries(RECIPE_CATEGORIES).map(([key, value]) => (
              <option key={value} value={value}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="framework-filter">
          <select
            value={selectedFramework}
            onChange={(e) => setSelectedFramework(e.target.value)}
          >
            <option value="all">All Frameworks</option>
            {Object.entries(FRAMEWORKS).map(([key, value]) => (
              <option key={value} value={value}>
                {key === 'QBCORE' ? 'QB-Core' : key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="sort-filter">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Liked</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="gallery-results">
        <div className="results-header">
          <h3>
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Recipes'}
            ({filteredRecipes.length})
          </h3>
        </div>

        {filteredRecipes.length > 0 ? (
          <div className="recipes-grid">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isLiked={likedRecipes.includes(recipe.id)}
                onLike={handleLike}
                onDownload={handleDownload}
                onEdit={onEditRecipe}
                currentUser={user}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <h4>No recipes found</h4>
            <p>
              {searchQuery
                ? `No recipes match "${searchQuery}". Try different keywords.`
                : 'No recipes available with the selected filters.'
              }
            </p>
            {isAuthenticated && (
              <button onClick={onCreateNew} className="btn-primary">
                Create the First Recipe
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Featured Recipe Card Component
const FeaturedRecipeCard = ({ recipe, isLiked, onLike, onDownload, onEdit, currentUser }) => {
  const isOwner = currentUser?.id === recipe.author_id;

  return (
    <div className="featured-recipe-card">
      <div className="featured-badge">Featured</div>

      <div className="recipe-header">
        <h3>{recipe.name}</h3>
        <div className="recipe-meta">
          <span className="framework-badge">{recipe.framework.toUpperCase()}</span>
          <span className="category-badge">{recipe.category}</span>
        </div>
      </div>

      <p className="recipe-description">{recipe.description}</p>

      <div className="recipe-stats">
        <div className="stat">
          <span className="stat-icon">📦</span>
          <span>{recipe.resources.length} resources</span>
        </div>
        <div className="stat">
          <span className="stat-icon">👥</span>
          <span>{recipe.server_config.max_players} players</span>
        </div>
        <div className="stat">
          <span className="stat-icon">📥</span>
          <span>{recipe.download_count} downloads</span>
        </div>
      </div>

      <div className="recipe-tags">
        {recipe.tags.slice(0, 3).map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
        {recipe.tags.length > 3 && <span className="tag-more">+{recipe.tags.length - 3}</span>}
      </div>

      <div className="recipe-actions">
        <button
          onClick={() => onLike(recipe.id)}
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          disabled={!currentUser}
        >
          ❤️ {recipe.like_count}
        </button>

        <button
          onClick={() => onDownload(recipe)}
          className="download-btn"
        >
          📥 Download
        </button>

        {isOwner && (
          <button
            onClick={() => onEdit(recipe)}
            className="edit-btn"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      <div className="recipe-author">
        By {recipe.author_name} • {new Date(recipe.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

// Regular Recipe Card Component
const RecipeCard = ({ recipe, isLiked, onLike, onDownload, onEdit, currentUser }) => {
  const isOwner = currentUser?.id === recipe.author_id;

  return (
    <div className="recipe-card">
      <div className="recipe-card-header">
        <h4>{recipe.name}</h4>
        <div className="recipe-badges">
          <span className="framework-badge">{recipe.framework.toUpperCase()}</span>
          {recipe.is_featured && <span className="featured-badge">Featured</span>}
        </div>
      </div>

      <p className="recipe-card-description">{recipe.description}</p>

      <div className="recipe-card-stats">
        <div className="stat-row">
          <span className="stat-label">Resources:</span>
          <span className="stat-value">{recipe.resources.length}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Max Players:</span>
          <span className="stat-value">{recipe.server_config.max_players}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Category:</span>
          <span className="stat-value">{recipe.category}</span>
        </div>
      </div>

      <div className="recipe-card-tags">
        {recipe.tags.slice(0, 2).map(tag => (
          <span key={tag} className="tag-small">{tag}</span>
        ))}
        {recipe.tags.length > 2 && <span className="tag-more-small">+{recipe.tags.length - 2}</span>}
      </div>

      <div className="recipe-card-footer">
        <div className="recipe-metrics">
          <span>❤️ {recipe.like_count}</span>
          <span>📥 {recipe.download_count}</span>
        </div>

        <div className="recipe-card-actions">
          <button
            onClick={() => onLike(recipe.id)}
            className={`like-btn-small ${isLiked ? 'liked' : ''}`}
            disabled={!currentUser}
            title="Like recipe"
          >
            ❤️
          </button>

          <button
            onClick={() => onDownload(recipe)}
            className="download-btn-small"
            title="Download recipe"
          >
            📥
          </button>

          {isOwner && (
            <button
              onClick={() => onEdit(recipe)}
              className="edit-btn-small"
              title="Edit recipe"
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      <div className="recipe-card-author">
        By {recipe.author_name} • {new Date(recipe.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

// Helper function to generate server config (duplicated from context for download)
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

export default RecipeGallery;

