import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ReviewContext = createContext();

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within ReviewProvider');
  }
  return context;
};

// Mock review data for development
const INITIAL_REVIEWS = [
  {
    id: 1,
    resource_url: 'https://github.com/sungjihun00/EV_HUD',
    user_id: 1,
    username: 'fivem_dev',
    display_name: 'FiveM Developer',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    rating: 4,
    title: 'Great HUD with minor issues',
    content: 'Really clean design and easy to configure. Had some trouble with the minimap integration but overall works well on our ESX server. The health and armor bars are very smooth.',
    pros: ['Clean design', 'Easy to configure', 'Smooth animations'],
    cons: ['Minimap integration issues', 'Limited customization options'],
    compatibility: {
      framework: 'esx',
      version: '1.6.0',
      tested_version: 'ESX 1.6.0'
    },
    helpful_count: 12,
    reported_count: 0,
    created_at: '2024-02-15T10:30:00Z',
    updated_at: '2024-02-15T10:30:00Z',
    verified_purchase: false,
    server_info: {
      player_count: '64 slots',
      uptime: '6 months'
    }
  },
  {
    id: 2,
    resource_url: 'https://github.com/theiski/iski-hud',
    user_id: 2,
    username: 'server_owner',
    display_name: 'Server Owner',
    avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
    rating: 5,
    title: 'Perfect for QB-Core servers',
    content: 'This HUD is absolutely perfect for QB-Core. Installation was seamless and it integrates beautifully with all our existing scripts. The style is modern and our players love it.',
    pros: ['Perfect QB-Core integration', 'Modern design', 'Easy installation', 'Great player feedback'],
    cons: [],
    compatibility: {
      framework: 'qbcore',
      version: '1.0.0',
      tested_version: 'QB-Core latest'
    },
    helpful_count: 25,
    reported_count: 0,
    created_at: '2024-01-20T14:20:00Z',
    updated_at: '2024-01-20T14:20:00Z',
    verified_purchase: true,
    server_info: {
      player_count: '128 slots',
      uptime: '2 years'
    }
  },
  {
    id: 3,
    resource_url: 'https://github.com/Nightt7/jn-hud',
    user_id: 3,
    username: 'resource_creator',
    display_name: 'Resource Creator',
    avatar_url: 'https://avatars.githubusercontent.com/u/3?v=4',
    rating: 3,
    title: 'Good concept but needs work',
    content: 'The idea behind this HUD is great and it has some unique features, but there are quite a few bugs and the documentation could be better. With some updates this could be really good.',
    pros: ['Unique features', 'Good concept', 'Actively developed'],
    cons: ['Several bugs', 'Poor documentation', 'Complex setup'],
    compatibility: {
      framework: 'esx',
      version: '1.0.2',
      tested_version: 'ESX 1.7.5'
    },
    helpful_count: 8,
    reported_count: 1,
    created_at: '2023-12-10T09:15:00Z',
    updated_at: '2023-12-10T09:15:00Z',
    verified_purchase: false,
    server_info: {
      player_count: '32 slots',
      uptime: '3 months'
    }
  }
];

export const ReviewProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load reviews from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('reviews');
    if (saved) {
      try {
        setReviews(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews(INITIAL_REVIEWS);
      }
    } else {
      setReviews(INITIAL_REVIEWS);
    }
  }, []);

  // Save to localStorage whenever reviews change
  useEffect(() => {
    localStorage.setItem('reviews', JSON.stringify(reviews));
  }, [reviews]);

  const addReview = async (reviewData) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to add reviews');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const newReview = {
        id: Date.now(), // Simple ID generation for demo
        ...reviewData,
        user_id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        helpful_count: 0,
        reported_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        verified_purchase: false // Could be enhanced to check if user claimed the resource
      };

      setReviews(prev => [newReview, ...prev]);

      return { success: true, review: newReview };
    } catch (error) {
      console.error('Error adding review:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (reviewId, updates) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to update reviews');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));

      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId && review.user_id === user.id
            ? { ...review, ...updates, updated_at: new Date().toISOString() }
            : review
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Error updating review:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (reviewId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to delete reviews');
    }

    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setReviews(prev =>
        prev.filter(review => !(review.id === reviewId && review.user_id === user.id))
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting review:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const markHelpful = async (reviewId) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to mark reviews as helpful');
    }

    // Get current helpful votes from localStorage
    const helpfulVotes = JSON.parse(localStorage.getItem(`helpfulVotes_${user.id}`) || '[]');

    if (helpfulVotes.includes(reviewId)) {
      // Already voted, remove vote
      const newVotes = helpfulVotes.filter(id => id !== reviewId);
      localStorage.setItem(`helpfulVotes_${user.id}`, JSON.stringify(newVotes));

      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, helpful_count: Math.max(0, review.helpful_count - 1) }
            : review
        )
      );
    } else {
      // Add vote
      helpfulVotes.push(reviewId);
      localStorage.setItem(`helpfulVotes_${user.id}`, JSON.stringify(helpfulVotes));

      setReviews(prev =>
        prev.map(review =>
          review.id === reviewId
            ? { ...review, helpful_count: review.helpful_count + 1 }
            : review
        )
      );
    }

    return { success: true };
  };

  const reportReview = async (reviewId, reason) => {
    if (!isAuthenticated || !user) {
      throw new Error('Must be authenticated to report reviews');
    }

    // For demo purposes, just increment report count
    setReviews(prev =>
      prev.map(review =>
        review.id === reviewId
          ? { ...review, reported_count: review.reported_count + 1 }
          : review
      )
    );

    return { success: true };
  };

  const getResourceReviews = (resourceUrl) => {
    return reviews.filter(review => review.resource_url === resourceUrl);
  };

  const getUserReviews = (userId = user?.id) => {
    return reviews.filter(review => review.user_id === userId);
  };

  const getResourceRating = (resourceUrl) => {
    const resourceReviews = getResourceReviews(resourceUrl);
    if (resourceReviews.length === 0) {
      return { average: 0, count: 0 };
    }

    const total = resourceReviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / resourceReviews.length;

    return {
      average: Math.round(average * 10) / 10, // Round to 1 decimal
      count: resourceReviews.length
    };
  };

  const hasUserReviewed = (resourceUrl, userId = user?.id) => {
    return reviews.some(review =>
      review.resource_url === resourceUrl && review.user_id === userId
    );
  };

  const getUserHelpfulVotes = () => {
    if (!user) return [];
    return JSON.parse(localStorage.getItem(`helpfulVotes_${user.id}`) || '[]');
  };

  const getReviewStats = () => {
    const userReviews = getUserReviews();
    const totalHelpful = userReviews.reduce((sum, review) => sum + review.helpful_count, 0);

    return {
      total: userReviews.length,
      totalHelpful,
      averageRating: userReviews.length > 0
        ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length
        : 0
    };
  };

  const value = {
    reviews,
    loading,
    addReview,
    updateReview,
    deleteReview,
    markHelpful,
    reportReview,
    getResourceReviews,
    getUserReviews,
    getResourceRating,
    hasUserReviewed,
    getUserHelpfulVotes,
    getReviewStats
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};
