import React, { useState, useEffect } from 'react';
import { useRecipes, RECIPE_CATEGORIES, FRAMEWORKS } from '../contexts/RecipeContext';
import { useAuth } from '../contexts/AuthContext';

const RecipeBuilder = ({ recipe: initialRecipe, onSave, onCancel }) => {
  const { isAuthenticated } = useAuth();
  const { saveRecipe, loading } = useRecipes();

  const [recipe, setRecipe] = useState(initialRecipe || {
    name: '',
    description: '',
    category: RECIPE_CATEGORIES.CUSTOM,
    framework: FRAMEWORKS.ESX,
    is_public: false,
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
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic'); // basic, resources, config, preview

  useEffect(() => {
    if (initialRecipe) {
      setRecipe(initialRecipe);
    }
  }, [initialRecipe]);

  const handleInputChange = (field, value) => {
    setRecipe(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setRecipe(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleFrameworkConfigChange = (field, value) => {
    setRecipe(prev => ({
      ...prev,
      server_config: {
        ...prev.server_config,
        framework_config: {
          ...prev.server_config.framework_config,
          [field]: value
        }
      }
    }));
  };

  const addResource = () => {
    const newResource = {
      name: '',
      github_url: '',
      version: 'latest',
      required: true,
      category: 'other',
      load_order: recipe.resources.length + 1,
      config_notes: ''
    };

    setRecipe(prev => ({
      ...prev,
      resources: [...prev.resources, newResource]
    }));
  };

  const updateResource = (index, field, value) => {
    setRecipe(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const removeResource = (index) => {
    setRecipe(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const moveResource = (index, direction) => {
    const newResources = [...recipe.resources];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newResources.length) {
      [newResources[index], newResources[targetIndex]] = [newResources[targetIndex], newResources[index]];

      // Update load_order
      newResources.forEach((resource, i) => {
        resource.load_order = i + 1;
      });

      setRecipe(prev => ({ ...prev, resources: newResources }));
    }
  };

  const addTag = (tag) => {
    if (tag && !recipe.tags.includes(tag)) {
      setRecipe(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag) => {
    setRecipe(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!recipe.name.trim()) {
      newErrors.name = 'Recipe name is required';
    }

    if (!recipe.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (recipe.resources.length === 0) {
      newErrors.resources = 'At least one resource is required';
    }

    // Validate resources
    recipe.resources.forEach((resource, index) => {
      if (!resource.name.trim()) {
        newErrors[`resource_${index}_name`] = 'Resource name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      alert('Please login to save recipes');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const result = await saveRecipe(recipe);
      if (result.success) {
        if (onSave) onSave(result.recipe);
      } else {
        alert('Failed to save recipe: ' + result.error);
      }
    } catch (error) {
      alert('Error saving recipe: ' + error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="recipe-builder-auth-required">
        <h3>Login Required</h3>
        <p>Please login to create and edit recipes.</p>
      </div>
    );
  }

  return (
    <div className="recipe-builder">
      <div className="recipe-builder-header">
        <h2>{initialRecipe ? 'Edit Recipe' : 'Create New Recipe'}</h2>
        <div className="recipe-builder-actions">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      </div>

      <div className="recipe-builder-tabs">
        <button
          className={activeTab === 'basic' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('basic')}
        >
          Basic Info
        </button>
        <button
          className={activeTab === 'resources' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('resources')}
        >
          Resources ({recipe.resources.length})
        </button>
        <button
          className={activeTab === 'config' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('config')}
        >
          Configuration
        </button>
        <button
          className={activeTab === 'preview' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('preview')}
        >
          Preview & Export
        </button>
      </div>

      <div className="recipe-builder-content">
        {activeTab === 'basic' && (
          <BasicInfoTab
            recipe={recipe}
            errors={errors}
            onInputChange={handleInputChange}
            onAddTag={addTag}
            onRemoveTag={removeTag}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesTab
            resources={recipe.resources}
            errors={errors}
            onAddResource={addResource}
            onUpdateResource={updateResource}
            onRemoveResource={removeResource}
            onMoveResource={moveResource}
          />
        )}

        {activeTab === 'config' && (
          <ConfigurationTab
            recipe={recipe}
            onNestedChange={handleNestedChange}
            onFrameworkConfigChange={handleFrameworkConfigChange}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewTab recipe={recipe} />
        )}
      </div>
    </div>
  );
};

// Basic Info Tab Component
const BasicInfoTab = ({ recipe, errors, onInputChange, onAddTag, onRemoveTag }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim().toLowerCase());
      setNewTag('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="basic-info-tab">
      <div className="form-group">
        <label htmlFor="recipe-name">
          Recipe Name *
          {errors.name && <span className="error-text">{errors.name}</span>}
        </label>
        <input
          id="recipe-name"
          type="text"
          value={recipe.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          placeholder="e.g., ESX Roleplay Server"
          className={errors.name ? 'error' : ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="recipe-description">
          Description *
          {errors.description && <span className="error-text">{errors.description}</span>}
        </label>
        <textarea
          id="recipe-description"
          value={recipe.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Describe what this recipe creates and its purpose..."
          rows={3}
          className={errors.description ? 'error' : ''}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="recipe-category">Category</label>
          <select
            id="recipe-category"
            value={recipe.category}
            onChange={(e) => onInputChange('category', e.target.value)}
          >
            {Object.entries(RECIPE_CATEGORIES).map(([key, value]) => (
              <option key={value} value={value}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="recipe-framework">Framework</label>
          <select
            id="recipe-framework"
            value={recipe.framework}
            onChange={(e) => onInputChange('framework', e.target.value)}
          >
            {Object.entries(FRAMEWORKS).map(([key, value]) => (
              <option key={value} value={value}>
                {key === 'QBCORE' ? 'QB-Core' : key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={recipe.is_public}
            onChange={(e) => onInputChange('is_public', e.target.checked)}
          />
          Make this recipe public (others can discover and download it)
        </label>
      </div>

      <div className="form-group">
        <label>Tags</label>
        <div className="tags-input">
          <div className="current-tags">
            {recipe.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="add-tag">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn-small"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Resources Tab Component
const ResourcesTab = ({ resources, errors, onAddResource, onUpdateResource, onRemoveResource, onMoveResource }) => {
  return (
    <div className="resources-tab">
      <div className="resources-header">
        <h3>Resources</h3>
        <button onClick={onAddResource} className="btn-primary">
          + Add Resource
        </button>
      </div>

      {errors.resources && (
        <div className="error-message">{errors.resources}</div>
      )}

      <div className="resources-list">
        {resources.map((resource, index) => (
          <ResourceEditor
            key={index}
            resource={resource}
            index={index}
            errors={errors}
            onUpdate={onUpdateResource}
            onRemove={onRemoveResource}
            onMove={onMoveResource}
            canMoveUp={index > 0}
            canMoveDown={index < resources.length - 1}
          />
        ))}

        {resources.length === 0 && (
          <div className="no-resources">
            <p>No resources added yet. Click "Add Resource" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Resource Editor
const ResourceEditor = ({ resource, index, errors, onUpdate, onRemove, onMove, canMoveUp, canMoveDown }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="resource-editor">
      <div className="resource-header">
        <div className="resource-info">
          <span className="load-order">#{resource.load_order}</span>
          <input
            type="text"
            value={resource.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="Resource name"
            className={errors[`resource_${index}_name`] ? 'error' : ''}
          />
          {resource.required && <span className="required-badge">Required</span>}
        </div>

        <div className="resource-controls">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={!canMoveUp}
            className="btn-icon"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={!canMoveDown}
            className="btn-icon"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-icon"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▼' : '▲'}
          </button>
          <button
            onClick={() => onRemove(index)}
            className="btn-icon danger"
            title="Remove"
          >
            ×
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="resource-details">
          <div className="form-row">
            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="url"
                value={resource.github_url}
                onChange={(e) => onUpdate(index, 'github_url', e.target.value)}
                placeholder="https://github.com/user/repo"
              />
            </div>
            <div className="form-group">
              <label>Version</label>
              <input
                type="text"
                value={resource.version}
                onChange={(e) => onUpdate(index, 'version', e.target.value)}
                placeholder="latest"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={resource.category}
                onChange={(e) => onUpdate(index, 'category', e.target.value)}
              >
                <option value="framework">Framework</option>
                <option value="ui">User Interface</option>
                <option value="jobs">Jobs</option>
                <option value="vehicles">Vehicles</option>
                <option value="weapons">Weapons</option>
                <option value="maps">Maps</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={resource.required}
                  onChange={(e) => onUpdate(index, 'required', e.target.checked)}
                />
                Required Resource
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Configuration Notes</label>
            <textarea
              value={resource.config_notes}
              onChange={(e) => onUpdate(index, 'config_notes', e.target.value)}
              placeholder="Special configuration notes for this resource..."
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Configuration Tab Component
const ConfigurationTab = ({ recipe, onNestedChange, onFrameworkConfigChange }) => {
  return (
    <div className="configuration-tab">
      <div className="config-section">
        <h3>Server Configuration</h3>

        <div className="form-group">
          <label>Maximum Players</label>
          <input
            type="number"
            min="1"
            max="1024"
            value={recipe.server_config.max_players}
            onChange={(e) => onNestedChange('server_config', 'max_players', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div className="config-section">
        <h3>{recipe.framework.toUpperCase()} Framework Configuration</h3>

        {recipe.framework === 'esx' && (
          <ESXConfigSection
            config={recipe.server_config.framework_config}
            onChange={onFrameworkConfigChange}
          />
        )}

        {recipe.framework === 'qbcore' && (
          <QBConfigSection
            config={recipe.server_config.framework_config}
            onChange={onFrameworkConfigChange}
          />
        )}

        {(recipe.framework === 'vorp' || recipe.framework === 'standalone') && (
          <div className="config-placeholder">
            <p>Framework-specific configuration options will be added here.</p>
          </div>
        )}
      </div>

      <div className="config-section">
        <h3>Database Configuration</h3>

        <div className="form-group">
          <label>Database Type</label>
          <select
            value={recipe.server_config.database_config.type}
            onChange={(e) => onNestedChange('database_config', 'type', e.target.value)}
          >
            <option value="mysql">MySQL</option>
            <option value="mariadb">MariaDB</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ESX Configuration Section
const ESXConfigSection = ({ config, onChange }) => {
  return (
    <>
      <div className="form-group">
        <label>Starting Money</label>
        <input
          type="number"
          min="0"
          value={config.starting_money || 50000}
          onChange={(e) => onChange('starting_money', parseInt(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.enable_multichar || false}
            onChange={(e) => onChange('enable_multichar', e.target.checked)}
          />
          Enable Multi-Character
        </label>
      </div>

      <div className="form-group">
        <label>Default Spawn Location</label>
        <select
          value={config.default_spawn || 'apartments'}
          onChange={(e) => onChange('default_spawn', e.target.value)}
        >
          <option value="apartments">Apartments</option>
          <option value="garage">Garage</option>
          <option value="last_position">Last Position</option>
        </select>
      </div>
    </>
  );
};

// QB-Core Configuration Section
const QBConfigSection = ({ config, onChange }) => {
  return (
    <>
      <div className="form-group">
        <label>Starting Money</label>
        <input
          type="number"
          min="0"
          value={config.starting_money || 50000}
          onChange={(e) => onChange('starting_money', parseInt(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.enable_racing || false}
            onChange={(e) => onChange('enable_racing', e.target.checked)}
          />
          Enable Racing System
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.racing_rewards || false}
            onChange={(e) => onChange('racing_rewards', e.target.checked)}
          />
          Enable Racing Rewards
        </label>
      </div>
    </>
  );
};

// Preview Tab Component
const PreviewTab = ({ recipe }) => {
  const { generateYAML } = useRecipes();

  const handleDownload = () => {
    const config = generateYAML(recipe);
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_server.cfg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="preview-tab">
      <div className="preview-header">
        <h3>Recipe Preview</h3>
        <button onClick={handleDownload} className="btn-primary">
          📥 Download server.cfg
        </button>
      </div>

      <div className="recipe-summary">
        <h4>{recipe.name}</h4>
        <p>{recipe.description}</p>
        <div className="recipe-meta">
          <span className="framework-badge">{recipe.framework.toUpperCase()}</span>
          <span className="category-badge">{recipe.category}</span>
          <span className="players-badge">Max {recipe.server_config.max_players} players</span>
        </div>
      </div>

      <div className="resources-summary">
        <h4>Resources ({recipe.resources.length})</h4>
        <div className="resources-list-preview">
          {recipe.resources.map((resource, index) => (
            <div key={index} className="resource-preview-item">
              <span className="load-order">#{resource.load_order}</span>
              <span className="resource-name">{resource.name}</span>
              {resource.required && <span className="required-indicator">Required</span>}
              <span className="resource-category">{resource.category}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="config-preview">
        <h4>Generated Configuration</h4>
        <pre className="config-output">
          <code>{generateYAML(recipe)}</code>
        </pre>
      </div>
    </div>
  );
};

export default RecipeBuilder;

