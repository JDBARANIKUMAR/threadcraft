import React from 'react';

/**
 * Design Library panel — renders the graphics fetched from /api/designs
 * (admin-managed via the Design collection). Shown inside the customizer's
 * Graphics tab when a library is supplied.
 */
const DesignLibraryPanel = ({ designs = [], onAddImage = () => {} }) => {
  if (!designs || designs.length === 0) {
    return (
      <p className="text-xs text-ink-400 text-center py-6">
        No graphics available yet — check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">Click any design to add it to your tee:</p>
      <div className="grid grid-cols-2 gap-2.5">
        {designs.map((design) => (
          <button
            key={design._id}
            type="button"
            onClick={() =>
              onAddImage({
                url: design.image,
                name: design.name,
                naturalWidth: 600,
                naturalHeight: 600,
                lowResWarning: false,
              })
            }
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-sm border border-line bg-canvasd hover:border-ink-900 transition-all text-center group"
            title={design.price > 0 ? `${design.name} (Premium)` : design.name}
          >
            <img
              src={design.image}
              alt={design.name}
              loading="lazy"
              className="h-16 w-16 object-cover rounded-sm"
            />
            <span className="text-[11px] font-semibold text-ink-900 line-clamp-1">{design.name}</span>
            {design.price > 0 ? (
              <span className="text-[10px] font-bold text-clay-600 uppercase tracking-wide">Premium</span>
            ) : (
              <span className="text-[10px] text-ink-400 uppercase tracking-wide">Free</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DesignLibraryPanel;
