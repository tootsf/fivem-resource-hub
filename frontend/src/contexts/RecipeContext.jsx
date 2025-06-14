import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMockAuth } from './MockAuthContext';

const RecipeContext = createContext();

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within RecipeProvider');
  }
  return context;
};

// Recipe template categories
export const RECIPE_CATEGORIES = {
  ROLEPLAY: 'roleplay',
  RACING: 'racing',
  ECONOMY: 'economy',
  POLICE: 'police',
  MEDICAL: 'medical',
  HOUSING: 'housing',
  JOBS: 'jobs',
  CUSTOM: 'custom'
};

// Framework types
export const FRAMEWORKS = {
  ESX: 'esx',
  QBCORE: 'qbcore',
  VORP: 'vorp',
  STANDALONE: 'standalone'
};

// Sample recipe templates
const SAMPLE_RECIPES = [
  {
    id: 1,
    name: 'ESX Basic Roleplay Server',
    description: 'A complete ESX-based roleplay server with essential scripts',
    category: RECIPE_CATEGORIES.ROLEPLAY,
    framework: FRAMEWORKS.ESX,
    author_id: 1,
    author_name: 'FiveM Developer',
    is_public: true,
    is_featured: true,
    download_count: 245,
    like_count: 89,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-02-20T14:15:00Z',
    resources: [
      {
        name: 'es_extended',
        github_url: 'https://github.com/esx-framework/esx_core',
        version: '1.6.0',
        required: true,
        category: 'framework',
        load_order: 1,
        config_notes: 'Core ESX framework - load first'
      },
      {
        name: 'esx_menu_default',
        github_url: 'https://github.com/esx-framework/esx_menu_default',
        version: 'latest',
        required: true,
        category: 'ui',
        load_order: 2,
        config_notes: 'Default ESX menu system'
      },
      {
        name: 'esx_basicneeds',
        github_url: 'https://github.com/esx-framework/esx_basicneeds',
        version: 'latest',
        required: false,
        category: 'survival',
        load_order: 10,
        config_notes: 'Hunger and thirst system'
      }
    ],
    server_config: {
      max_players: 64,
      framework_config: {
        starting_money: 50000,
        enable_multichar: true,
        default_spawn: 'apartments'
      },
      database_config: {
        type: 'mysql',
        required_tables: ['users', 'user_accounts', 'items']
      }
    },
    tags: ['esx', 'roleplay', 'basic', 'starter']
  },
  {
    id: 2,
    name: 'QB-Core Racing Server',
    description: 'High-performance racing server with QB-Core framework',
    category: RECIPE_CATEGORIES.RACING,
    framework: FRAMEWORKS.QBCORE,
    author_id: 2,
    author_name: 'Server Owner',
    is_public: true,
    is_featured: false,
    download_count: 156,
    like_count: 67,
    created_at: '2024-02-01T09:20:00Z',
    updated_at: '2024-02-25T16:30:00Z',
    resources: [
      {
        name: 'qb-core',
        github_url: 'https://github.com/qbcore-framework/qb-core',
        version: 'latest',
        required: true,
        category: 'framework',
        load_order: 1,
        config_notes: 'QB-Core framework base'
      },
      {
        name: 'qb-racing',
        github_url: 'https://github.com/qbcore-framework/qb-racing',
        version: 'latest',
        required: true,
        category: 'racing',
        load_order: 20,
        config_notes: 'Main racing system'
      }
    ],
    server_config: {
      max_players: 128,
      framework_config: {
        starting_money: 100000,
        enable_racing: true,
        racing_rewards: true
      }
    },
    tags: ['qbcore', 'racing', 'performance', 'competitive']
  }
];

export const RecipeProvider = ({ children }) => {
  const { user, isAuthenticated } = useMockAuth();
  const [recipes, setRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load recipes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recipes');
    if (saved) {
      try {
        setRecipes(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recipes:', error);
        setRecipes(SAMPLE_RECIPES);
      }
    } else {
      setRecipes(SAMPLE_RECIPES);
    }
  }, []);

  // Save to localStorage whenever recipes change
  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  const createNewRecipe = () => {
    const newRecipe = {
      id: Date.now(),
      name: 'New Recipe',
      description: '',
      category: RECIPE_CATEGORIES.CUSTOM,
      framework: FRAMEWORKS.ESX,
      author_id: user?.id,
      author_name: user?.display_name || user?.username,
      is_public: false,
      is_featured: false,
      download_count: 0,
      like_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resources: [],
      server_config: {
        max_players: 32,
        framework_config: {},
        database_config: {
          type: 'mysql',
          required_tables: []
        }
      },
      tags: []
    };

    setCurrentRecipe(newRecipe);
    return newRecipe;
  };

  const saveRecipe = async (recipeData) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to save recipes');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedRecipe = {
        ...recipeData,
        updated_at: new Date().toISOString()
      };

      if (recipeData.id && recipes.find(r => r.id === recipeData.id)) {
        // Update existing recipe
        setRecipes(prev =>
          prev.map(recipe =>
            recipe.id === recipeData.id ? updatedRecipe : recipe
          )
        );
      } else {
        // Create new recipe
        const newRecipe = {
          ...updatedRecipe,
          id: Date.now(),
          created_at: new Date().toISOString()
        };
        setRecipes(prev => [newRecipe, ...prev]);
        setCurrentRecipe(newRecipe);
      }

      return { success: true, recipe: updatedRecipe };
    } catch (error) {
      console.error('Error saving recipe:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to delete recipes');
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setRecipes(prev =>
        prev.filter(recipe => !(recipe.id === recipeId && recipe.author_id === user.id))
      );

      if (currentRecipe?.id === recipeId) {
        setCurrentRecipe(null);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const likeRecipe = async (recipeId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to like recipes');
    }

    // Get current likes from localStorage
    const likedRecipes = JSON.parse(localStorage.getItem(`likedRecipes_${user.id}`) || '[]');

    if (likedRecipes.includes(recipeId)) {
      // Already liked, remove like
      const newLikes = likedRecipes.filter(id => id !== recipeId);
      localStorage.setItem(`likedRecipes_${user.id}`, JSON.stringify(newLikes));

      setRecipes(prev =>
        prev.map(recipe =>
          recipe.id === recipeId
            ? { ...recipe, like_count: Math.max(0, recipe.like_count - 1) }
            : recipe
        )
      );
    } else {
      // Add like
      likedRecipes.push(recipeId);
      localStorage.setItem(`likedRecipes_${user.id}`, JSON.stringify(likedRecipes));

      setRecipes(prev =>
        prev.map(recipe =>
          recipe.id === recipeId
            ? { ...recipe, like_count: recipe.like_count + 1 }
            : recipe
        )
      );
    }

    return { success: true };
  };

  const downloadRecipe = async (recipeId) => {
    // Increment download count
    setRecipes(prev =>
      prev.map(recipe =>
        recipe.id === recipeId
          ? { ...recipe, download_count: recipe.download_count + 1 }
          : recipe
      )
    );

    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }

    return { success: true, recipe };
  };

  const getUserRecipes = (userId = user?.id) => {
    return recipes.filter(recipe => recipe.author_id === userId);
  };

  const getPublicRecipes = () => {
    return recipes.filter(recipe => recipe.is_public);
  };

  const getFeaturedRecipes = () => {
    return recipes.filter(recipe => recipe.is_featured && recipe.is_public);
  };

  const getRecipesByCategory = (category) => {
    return recipes.filter(recipe => recipe.category === category && recipe.is_public);
  };

  const getRecipesByFramework = (framework) => {
    return recipes.filter(recipe => recipe.framework === framework && recipe.is_public);
  };

  const searchRecipes = (query) => {
    const searchTerm = query.toLowerCase();
    return recipes.filter(recipe =>
      recipe.is_public && (
        recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    );
  };

  const getUserLikedRecipes = () => {
    if (!user) return [];
    return JSON.parse(localStorage.getItem(`likedRecipes_${user.id}`) || '[]');
  };

  const generateYAML = (recipe) => {
    // This will generate a server.cfg style configuration
    return generateServerConfig(recipe);
  };

  const value = {
    recipes,
    currentRecipe,
    loading,
    setCurrentRecipe,
    createNewRecipe,
    saveRecipe,
    deleteRecipe,
    likeRecipe,
    downloadRecipe,
    getUserRecipes,
    getPublicRecipes,
    getFeaturedRecipes,
    getRecipesByCategory,
    getRecipesByFramework,
    searchRecipes,
    getUserLikedRecipes,
    generateYAML
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

// Helper function to generate server configuration
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
