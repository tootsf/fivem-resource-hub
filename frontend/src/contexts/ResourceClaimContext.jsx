import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ResourceClaimContext = createContext();

export const useResourceClaims = () => {
  const context = useContext(ResourceClaimContext);
  if (!context) {
    throw new Error('useResourceClaims must be used within ResourceClaimProvider');
  }
  return context;
};

export const ResourceClaimProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [claimedResources, setClaimedResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load claimed resources from API when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadClaimedResources();
    } else {
      setClaimedResources([]);
    }
  }, [isAuthenticated, user]);

  const loadClaimedResources = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.get('/api/resources/user/claimed', { headers });
      if (response.data.success) {
        setClaimedResources(response.data.data);
      }
    } catch (error) {
      console.error('Error loading claimed resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimResource = async (resource) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to claim resources');
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(`/api/resources/${resource.id}/claim`, {}, { headers });
      
      if (response.data.success) {
        // Add the claimed resource to our state
        const claimedResource = {
          ...resource,
          claimed_by: user.id,
          claimed_by_username: user.username,
          claimed_by_display_name: user.display_name
        };
        
        setClaimedResources(prev => {
          const filtered = prev.filter(r => r.id !== resource.id);
          return [...filtered, claimedResource];
        });

        return { success: true, resource: claimedResource };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error claiming resource:', error);
      const errorMessage = error.response?.data?.error || error.message;
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const unclaimResource = async (resourceId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to unclaim resources');
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(`/api/resources/${resourceId}/unclaim`, {}, { headers });
      
      if (response.data.success) {
        // Remove the resource from our state
        setClaimedResources(prev => 
          prev.filter(r => r.id !== resourceId)
        );
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Error unclaiming resource:', error);
      const errorMessage = error.response?.data?.error || error.message;
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const isResourceClaimedByUser = (resourceId) => {
    return claimedResources.some(r => r.id === resourceId && r.claimed_by === user?.id);
  };

  const getResourceClaim = (resourceId) => {
    return claimedResources.find(r => r.id === resourceId);
  };

  const getUserClaimedResources = () => {
    return claimedResources.filter(r => r.claimed_by === user?.id);
  };

  const getClaimStats = () => {
    const userClaims = getUserClaimedResources();
    return {
      total: userClaims.length,
      totalResources: claimedResources.length
    };
  };

  const value = {
    claimedResources,
    loading,
    claimResource,
    unclaimResource,
    isResourceClaimedByUser,
    getResourceClaim,
    getUserClaimedResources,
    getClaimStats,
    refreshClaimedResources: loadClaimedResources
  };

  return (
    <ResourceClaimContext.Provider value={value}>
      {children}
    </ResourceClaimContext.Provider>
  );
};

export default ResourceClaimProvider;
