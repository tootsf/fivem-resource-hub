# Database Schema Design

## Core Tables

### Users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  github_id INTEGER UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  github_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Resources
```sql
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  github_repo_url TEXT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(100),
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  last_updated TIMESTAMP,
  
  -- FiveM specific metadata
  fivem_category VARCHAR(100), -- 'scripts', 'maps', 'vehicles', 'weapons', etc.
  framework_compatibility TEXT[], -- ['esx', 'qbcore', 'standalone']
  dependencies TEXT[], -- array of required resources
  tags TEXT[], -- user-defined tags
  
  -- Ownership and claiming
  claimed_by INTEGER REFERENCES users(id),
  claimed_at TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  
  -- Aggregated data
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Reviews
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  pros TEXT,
  cons TEXT,
  recommended BOOLEAN,
  
  -- Helpful voting
  helpful_votes INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(resource_id, user_id) -- One review per user per resource
);
```

### Review Votes
```sql
CREATE TABLE review_votes (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN, -- true = helpful, false = not helpful
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(review_id, user_id)
);
```

### Recipes
```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  
  -- Recipe metadata
  framework VARCHAR(100), -- 'esx', 'qbcore', etc.
  server_type VARCHAR(100), -- 'roleplay', 'racing', 'freeroam'
  tags TEXT[],
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Recipe Items
```sql
CREATE TABLE recipe_items (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
  resource_id INTEGER REFERENCES resources(id),
  
  -- Installation order and configuration
  install_order INTEGER NOT NULL,
  install_notes TEXT,
  environment_vars JSONB, -- key-value pairs for config
  custom_config JSONB, -- any additional config data
  
  -- Optional overrides
  custom_name VARCHAR(255), -- if different from resource name
  is_optional BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Sessions (for auth)
```sql
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  github_access_token TEXT, -- encrypted
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes for Performance

```sql
-- Search indexes
CREATE INDEX idx_resources_name_search ON resources USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_resources_category ON resources(fivem_category);
CREATE INDEX idx_resources_tags ON resources USING gin(tags);
CREATE INDEX idx_resources_framework ON resources USING gin(framework_compatibility);

-- User and auth indexes
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Review indexes
CREATE INDEX idx_reviews_resource ON reviews(resource_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_review_votes_review ON review_votes(review_id);

-- Recipe indexes
CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_recipes_public ON recipes(is_public);
CREATE INDEX idx_recipe_items_recipe ON recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_order ON recipe_items(recipe_id, install_order);
```
