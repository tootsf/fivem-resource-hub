import React, { useState } from 'react';

const StarRating = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showValue = true
}) => {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    small: 'star-rating-small',
    medium: 'star-rating-medium',
    large: 'star-rating-large'
  };

  const handleClick = (value) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readonly) {
      setHover(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHover(0);
    }
  };

  const displayRating = hover || rating;

  return (
    <div className={`star-rating ${sizeClasses[size]} ${readonly ? 'readonly' : 'interactive'}`}>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= displayRating ? 'filled' : 'empty'}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      {showValue && (
        <span className="rating-value">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
