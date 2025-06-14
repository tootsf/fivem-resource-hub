import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMockAuth } from './MockAuthContext';

const ResourceClaimContext = createContext();

export const useResourceClaims = () => {
  const context = useContext(ResourceClaimContext);
  if (!context) {
    throw new Error('useResourceClaims must be used within ResourceClaimProvider');
  }
  return context;
};

export const ResourceClaimProvider = ({ children }) => {
  const { user, isAuthenticated } = useMockAuth();
  const [claimedResources, setClaimedResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load claimed resources from localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      const saved = localStorage.getItem(`claimedResources_${user.id}`);
      if (saved) {
        try {
          setClaimedResources(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading claimed resources:', error);
          setClaimedResources([]);
        }
      }
    } else {
      setClaimedResources([]);
    }
  }, [isAuthenticated, user]);

  // Save to localStorage whenever claimedResources changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`claimedResources_${user.id}`, JSON.stringify(claimedResources));
    }
  }, [claimedResources, user]);

  const claimResource = async (resource) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to claim resources');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const claimedResource = {
        ...resource,
        claimed_by: user.id,
        claimed_by_user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url
        },
        claimed_at: new Date().toISOString(),
        verified: false,
        claim_status: 'pending', // pending, verified, disputed
        notes: '',
        tags: resource.tags || []
      };

      setClaimedResources(prev => {
        // Remove if already claimed, then add new claim
        const filtered = prev.filter(r => r.github_url !== resource.github_url);
        return [...filtered, claimedResource];
      });

      return { success: true, resource: claimedResource };
    } catch (error) {
      console.error('Error claiming resource:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const unclaimResource = async (resourceUrl) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to unclaim resources');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setClaimedResources(prev => 
        prev.filter(r => r.github_url !== resourceUrl)
      );

      return { success: true };
    } catch (error) {
      console.error('Error unclaiming resource:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateResourceClaim = async (resourceUrl, updates) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to update resource claims');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));

      setClaimedResources(prev =>
        prev.map(r => 
          r.github_url === resourceUrl 
            ? { ...r, ...updates, updated_at: new Date().toISOString() }
            : r
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating resource claim:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const isResourceClaimed = (resourceUrl) => {
    return claimedResources.some(r => r.github_url === resourceUrl);
  };

  const isResourceClaimedByUser = (resourceUrl, userId = user?.id) => {
    return claimedResources.some(r => 
      r.github_url === resourceUrl && r.claimed_by === userId
    );
  };

  const getResourceClaim = (resourceUrl) => {
    return claimedResources.find(r => r.github_url === resourceUrl);
  };

  const getUserClaimedResources = (userId = user?.id) => {
    return claimedResources.filter(r => r.claimed_by === userId);
  };

  const getClaimStats = () => {
    const userClaims = getUserClaimedResources();
    return {
      total: userClaims.length,
      pending: userClaims.filter(r => r.claim_status === 'pending').length,
      verified: userClaims.filter(r => r.claim_status === 'verified').length,
      disputed: userClaims.filter(r => r.claim_status === 'disputed').length
    };
  };

  const value = {
    claimedResources,
    loading,
    claimResource,
    unclaimResource,
    updateResourceClaim,
    isResourceClaimed,
    isResourceClaimedByUser,
    getResourceClaim,
    getUserClaimedResources,
    getClaimStats
  };
  return (
    <ResourceClaimContext.Provider value={value}>
      {children}
    </ResourceClaimContext.Provider>
  );
};

export default ResourceClaimProvider;
