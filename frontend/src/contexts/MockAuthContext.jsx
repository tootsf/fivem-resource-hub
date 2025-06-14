import React, { createContext, useContext, useState, useEffect } from 'react';

const MockAuthContext = createContext();

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within MockAuthProvider');
  }
  return context;
};

// Mock user data for development
const MOCK_USERS = [
  {
    id: 1,
    username: 'fivem_dev',
    display_name: 'FiveM Developer',
    email: 'dev@fivem.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    github_url: 'https://github.com/fivem_dev',
    bio: 'FiveM resource developer and server owner',
    created_at: '2024-01-15T10:30:00Z',
    claimed_resources_count: 5,
    recipes_count: 3
  },
  {
    id: 2,
    username: 'server_owner',
    display_name: 'Server Owner',
    email: 'owner@server.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
    github_url: 'https://github.com/server_owner',
    bio: 'Running multiple FiveM servers since 2020',
    created_at: '2023-08-22T14:20:00Z',
    claimed_resources_count: 12,
    recipes_count: 8
  },
  {
    id: 3,
    username: 'resource_creator',
    display_name: 'Resource Creator',
    email: 'creator@resources.com',
    avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4',
    github_url: 'https://github.com/resource_creator',
    bio: 'Creating innovative FiveM resources and scripts',
    created_at: '2023-12-01T09:15:00Z',
    claimed_resources_count: 8,
    recipes_count: 15
  }
];

export const MockAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('mockUser');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading mock user:', error);
      } finally {
        setLoading(false);
      }
    };

    // Simulate loading delay
    setTimeout(initAuth, 500);
  }, []);

  const login = (userId = 1) => {
    const selectedUser = MOCK_USERS.find(u => u.id === userId) || MOCK_USERS[0];
    setUser(selectedUser);
    localStorage.setItem('mockUser', JSON.stringify(selectedUser));
    setError(null);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
    localStorage.removeItem('claimedResources');
    setError(null);
  };

  const updateProfile = (profileData) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const updatedUser = {
      ...user,
      ...profileData,
      updated_at: new Date().toISOString()
    };

    setUser(updatedUser);
    localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    
    return { success: true };
  };

  const switchUser = (userId) => {
    const newUser = MOCK_USERS.find(u => u.id === userId);
    if (newUser) {
      login(userId);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    switchUser,
    isAuthenticated: !!user,
    mockUsers: MOCK_USERS,
    isMockMode: true
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};
