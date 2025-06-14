-- Initial database setup for FiveM Resource Hub
-- Run this script to create the initial database structure

-- Create database (run this as a separate command)
-- CREATE DATABASE fivem_resource_hub;

-- Create users table
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

-- Create user sessions table for auth
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  github_access_token TEXT, -- encrypted
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create enhanced resources table
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

-- Create indexes for performance
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_resources_name_search ON resources USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_resources_category ON resources(fivem_category);
CREATE INDEX idx_resources_tags ON resources USING gin(tags);
CREATE INDEX idx_resources_framework ON resources USING gin(framework_compatibility);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
