import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 5, reviewsCount, size = 'sm' }) => {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-ink-900">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? 'fill-ink-900 text-ink-900'
                : 'text-ink-200'
            }`}
          />
        ))}
      </div>
      {reviewsCount !== undefined && (
        <span className="text-xs text-ink-500 font-medium">({reviewsCount})</span>
      )}
    </div>
  );
};

export default RatingStars;
