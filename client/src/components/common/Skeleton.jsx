import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-canvasd ${className}`}
    />
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="border border-line bg-white flex flex-col gap-3 p-3">
      <Skeleton className="w-full aspect-[4/5]" />
      <Skeleton className="w-1/3 h-3" />
      <Skeleton className="w-4/5 h-4" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="w-1/4 h-5" />
        <Skeleton className="w-1/3 h-9" />
      </div>
    </div>
  );
};

export default Skeleton;
