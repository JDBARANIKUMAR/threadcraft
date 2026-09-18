import React from 'react';

/**
 * High-detail vector T-shirt mockup supporting multiple styles:
 * - Round Neck
 * - V-Neck
 * - Polo
 * - Oversized
 * - Sleeveless
 *
 * And placement views: front, back, left_sleeve, right_sleeve.
 */
const TShirtMockupSVG = ({
  color = '#111827',
  shirtType = 'round_neck', // 'round_neck' | 'v_neck' | 'polo' | 'oversized' | 'sleeveless'
  view = 'front', // 'front' | 'back' | 'left_sleeve' | 'right_sleeve'
  children
}) => {
  const isLightColor = ['#f9fafb', '#ffffff', '#f3f4f6', '#e5e7eb', '#d7c4a5', '#fff'].includes(
    color.toLowerCase()
  );

  // Normalize shirtType input string
  const normalizedType = (shirtType || 'round_neck')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

  const isSleeveless = normalizedType === 'sleeveless';
  const isOversized = normalizedType === 'oversized';
  const isVNeck = normalizedType === 'v_neck';
  const isPolo = normalizedType === 'polo';

  // SVG Paths for T-Shirt Outlines based on type & view
  const getBodyPath = () => {
    if (view === 'left_sleeve' || view === 'right_sleeve') {
      // Sleeve View Silhouette
      return `
        M 170 80
        C 210 80, 310 100, 350 130
        L 390 280
        C 395 295, 385 310, 370 310
        L 280 295
        C 265 292, 255 280, 250 265
        L 210 320
        L 200 480
        C 200 490, 190 495, 180 495
        L 140 495
        C 130 495, 120 488, 120 478
        L 120 180
        Z
      `;
    }

    if (isSleeveless) {
      // Sleeveless Cut (Deep armhole cut)
      return `
        M 190 62
        C 170 66, 150 78, 140 100
        C 145 150, 155 200, 150 240
        L 150 475
        C 150 485, 158 492, 168 492
        L 332 492
        C 342 492, 350 485, 350 475
        L 350 240
        C 345 200, 355 150, 360 100
        C 350 78, 330 66, 310 62
        Q 250 ${isVNeck ? '135' : '102'} 190 62
        Z
      `;
    }

    if (isOversized) {
      // Drop-shoulder Boxy Cut
      return `
        M 190 60
        C 155 64, 110 78, 65 102
        L 15 180
        C 8 190, 12 205, 25 212
        L 85 245
        C 95 250, 110 245, 118 232
        L 135 198
        C 135 240, 136 320, 136 478
        C 136 488, 144 496, 154 496
        L 346 496
        C 356 496, 364 488, 364 478
        L 364 198
        L 382 232
        C 390 245, 405 250, 415 245
        L 475 212
        C 488 205, 492 190, 485 180
        L 435 102
        C 390 78, 345 64, 310 60
        Q 250 100 190 60
        Z
      `;
    }

    // Standard Round Neck, V-Neck, Polo Cut
    return `
      M 190 62
      C 160 66, 125 80, 85 105
      L 32 175
      C 25 185, 30 198, 42 205
      L 92 232
      C 102 237, 115 232, 122 222
      L 142 190
      C 140 215, 142 270, 142 350
      L 142 475
      C 142 485, 150 492, 160 492
      L 340 492
      C 350 492, 358 485, 358 475
      L 358 350
      C 358 270, 360 215, 358 190
      L 378 222
      C 385 232, 398 237, 408 232
      L 458 205
      C 470 198, 475 185, 468 175
      L 415 105
      C 375 80, 340 66, 310 62
      Q 250 ${isVNeck ? '135' : '102'} 190 62
      Z
    `;
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-[1/1.05] mx-auto select-none">
      <svg
        viewBox="0 0 500 520"
        className="w-full h-full drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shirtShading" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={isLightColor ? '0.2' : '0.08'} />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity={isLightColor ? '0.22' : '0.35'} />
          </linearGradient>

          <radialGradient id="innerCollarBack" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
          </radialGradient>
        </defs>

        {/* Inner collar view for front */}
        {view === 'front' && !isSleeveless && (
          <path
            d={
              isVNeck
                ? 'M 190 62 L 250 140 L 310 62 Q 250 48 190 62 Z'
                : 'M 190 62 Q 250 95 310 62 Q 250 48 190 62 Z'
            }
            fill="url(#innerCollarBack)"
          />
        )}

        {/* Base T-Shirt Body Path */}
        <path
          d={getBodyPath()}
          fill={color}
          className="transition-colors duration-300"
        />

        {/* Shading Overlay */}
        <path
          d={getBodyPath()}
          fill="url(#shirtShading)"
        />

        {/* Collar & Neckline details */}
        {view === 'front' && (
          <g>
            {isVNeck ? (
              /* V-Neck Cutout & Ribbing */
              <g>
                <path
                  d="M 190 62 L 250 135 L 310 62"
                  stroke="#000000"
                  strokeWidth="3.5"
                  strokeOpacity={isLightColor ? '0.3' : '0.5'}
                  fill="none"
                />
                <path
                  d="M 193 64 L 250 131 L 307 64"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                  strokeOpacity={isLightColor ? '0.6' : '0.2'}
                  fill="none"
                />
              </g>
            ) : isPolo ? (
              /* Polo Collar & Placket Buttons */
              <g>
                {/* Left Collar Flap */}
                <path
                  d="M 190 62 Q 220 80 248 115 L 210 110 Z"
                  fill="#ffffff"
                  fillOpacity={isLightColor ? '0.9' : '0.15'}
                  stroke="#000000"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
                {/* Right Collar Flap */}
                <path
                  d="M 310 62 Q 280 80 252 115 L 290 110 Z"
                  fill="#ffffff"
                  fillOpacity={isLightColor ? '0.9' : '0.15'}
                  stroke="#000000"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
                {/* Button Placket strip */}
                <rect x="242" y="102" width="16" height="65" rx="3" fill="#000000" fillOpacity="0.25" />
                <circle cx="250" cy="115" r="2.5" fill="#ffffff" stroke="#000" strokeWidth="0.8" />
                <circle cx="250" cy="135" r="2.5" fill="#ffffff" stroke="#000" strokeWidth="0.8" />
                <circle cx="250" cy="155" r="2.5" fill="#ffffff" stroke="#000" strokeWidth="0.8" />
              </g>
            ) : (
              /* Round Neck Ribbing */
              <g>
                <path
                  d="M 190 62 Q 250 102 310 62"
                  stroke="#000000"
                  strokeWidth="3"
                  strokeOpacity={isLightColor ? '0.25' : '0.45'}
                  fill="none"
                />
                <path
                  d="M 190 64 Q 250 110 310 64"
                  stroke="#000000"
                  strokeWidth="1.5"
                  strokeOpacity={isLightColor ? '0.15' : '0.3'}
                  fill="none"
                />
              </g>
            )}
          </g>
        )}

        {view === 'back' && (
          <g>
            <path
              d="M 190 62 Q 250 78 310 62"
              stroke="#000000"
              strokeWidth="3"
              strokeOpacity={isLightColor ? '0.25' : '0.45'}
              fill="none"
            />
            {/* Tag Stitching */}
            <rect x="240" y="68" width="20" height="14" rx="2" fill="#000000" fillOpacity="0.3" />
          </g>
        )}

        {/* Sleeve & Hem Stitching Lines */}
        {!isSleeveless && view !== 'left_sleeve' && view !== 'right_sleeve' && (
          <g>
            <path
              d="M 125 110 Q 138 150 144 190"
              stroke="#000000"
              strokeWidth="1.5"
              strokeOpacity={isLightColor ? '0.18' : '0.35'}
              fill="none"
            />
            <path
              d="M 375 110 Q 362 150 356 190"
              stroke="#000000"
              strokeWidth="1.5"
              strokeOpacity={isLightColor ? '0.18' : '0.35'}
              fill="none"
            />
          </g>
        )}

        {/* Bottom Hem Stitching */}
        <path
          d="M 142 470 L 358 470"
          stroke="#000000"
          strokeWidth="1"
          strokeDasharray="4 2"
          strokeOpacity={isLightColor ? '0.2' : '0.3'}
        />
      </svg>

      {/* Layer Content (Printable area & design elements overlay) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default TShirtMockupSVG;
