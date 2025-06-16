import React, { useState } from 'react';
import { useReviews } from '../contexts/ReviewContext';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';

const ReviewForm = ({ resource, onSuccess, onCancel }) => {
  const { isAuthenticated } = useAuth();
  const { addReview, loading } = useReviews();

  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    pros: [''],
    cons: [''],
    compatibility: {
      framework: '',
      version: '',
      tested_version: ''
    },
    server_info: {
      player_count: '',
      uptime: ''
    }
  });

  const [errors, setErrors] = useState({});

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
    if (errors.rating) {
      setErrors(prev => ({ ...prev, rating: null }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a title for your review';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Please write a detailed review';
    } else if (formData.content.trim().length < 20) {
      newErrors.content = 'Review must be at least 20 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert('Please login to submit a review');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const reviewData = {
        ...formData,
        resource_url: resource.github_url,
        pros: formData.pros.filter(pro => pro.trim()),
        cons: formData.cons.filter(con => con.trim()),
      };

      const result = await addReview(reviewData);

      if (result.success) {
        if (onSuccess) onSuccess(result.review);
      } else {
        alert('Failed to submit review: ' + result.error);
      }
    } catch (error) {
      alert('Error submitting review: ' + error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="review-form-auth-required">
        <h3>Login Required</h3>
        <p>Please login to write a review for this resource.</p>
      </div>
    );
  }

  return (
    <div className="review-form">
      <div className="review-form-header">
        <h3>Write a Review</h3>
        <p>Share your experience with <strong>{resource.name}</strong></p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div className="form-group">
          <label>
            Overall Rating *
            {errors.rating && <span className="error-text">{errors.rating}</span>}
          </label>
          <StarRating
            rating={formData.rating}
            onRatingChange={handleRatingChange}
            size="large"
            showValue={false}
          />
        </div>

        {/* Title */}
        <div className="form-group">
          <label htmlFor="review-title">
            Review Title *
            {errors.title && <span className="error-text">{errors.title}</span>}
          </label>
          <input
            id="review-title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Great HUD with excellent customization"
            maxLength={100}
            className={errors.title ? 'error' : ''}
          />
          <small>{formData.title.length}/100 characters</small>
        </div>

        {/* Content */}
        <div className="form-group">
          <label htmlFor="review-content">
            Detailed Review *
            {errors.content && <span className="error-text">{errors.content}</span>}
          </label>
          <textarea
            id="review-content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="Share your detailed experience with this resource. How well does it work? Any issues? Installation notes?"
            rows={5}
            className={errors.content ? 'error' : ''}
          />
          <small>{formData.content.length} characters (minimum 20)</small>
        </div>

        {/* Pros */}
        <div className="form-group">
          <label>What did you like? (Pros)</label>
          {formData.pros.map((pro, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={pro}
                onChange={(e) => handleArrayChange('pros', index, e.target.value)}
                placeholder="e.g., Easy to install"
              />
              {formData.pros.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('pros', index)}
                  className="remove-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('pros')}
            className="add-btn"
          >
            + Add Pro
          </button>
        </div>

        {/* Cons */}
        <div className="form-group">
          <label>Any issues? (Cons)</label>
          {formData.cons.map((con, index) => (
            <div key={index} className="array-input">
              <input
                type="text"
                value={con}
                onChange={(e) => handleArrayChange('cons', index, e.target.value)}
                placeholder="e.g., Complex configuration"
              />
              {formData.cons.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('cons', index)}
                  className="remove-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('cons')}
            className="add-btn"
          >
            + Add Con
          </button>
        </div>

        {/* Compatibility */}
        <div className="form-group">
          <label>Compatibility Information</label>
          <div className="compatibility-grid">
            <div>
              <label htmlFor="framework">Framework</label>
              <select
                id="framework"
                value={formData.compatibility.framework}
                onChange={(e) => handleNestedChange('compatibility', 'framework', e.target.value)}
              >
                <option value="">Select framework</option>
                <option value="esx">ESX</option>
                <option value="qbcore">QB-Core</option>
                <option value="vorp">VORP (RedM)</option>
                <option value="standalone">Standalone</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="version">Resource Version</label>
              <input
                id="version"
                type="text"
                value={formData.compatibility.version}
                onChange={(e) => handleNestedChange('compatibility', 'version', e.target.value)}
                placeholder="e.g., 1.2.0"
              />
            </div>
            <div>
              <label htmlFor="tested-version">Tested With</label>
              <input
                id="tested-version"
                type="text"
                value={formData.compatibility.tested_version}
                onChange={(e) => handleNestedChange('compatibility', 'tested_version', e.target.value)}
                placeholder="e.g., ESX 1.6.0"
              />
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="form-group">
          <label>Server Information (Optional)</label>
          <div className="server-info-grid">
            <div>
              <label htmlFor="player-count">Player Count</label>
              <input
                id="player-count"
                type="text"
                value={formData.server_info.player_count}
                onChange={(e) => handleNestedChange('server_info', 'player_count', e.target.value)}
                placeholder="e.g., 64 slots"
              />
            </div>
            <div>
              <label htmlFor="uptime">Server Uptime</label>
              <input
                id="uptime"
                type="text"
                value={formData.server_info.uptime}
                onChange={(e) => handleNestedChange('server_info', 'uptime', e.target.value)}
                placeholder="e.g., 6 months"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;

