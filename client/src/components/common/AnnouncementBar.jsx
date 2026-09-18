import React, { useRef, useEffect, useState } from 'react';

/**
 * Promo messages — edit this array to update announcements.
 * Each entry: { icon, text }
 * Icons can be emoji or any short string.
 */
const ANNOUNCEMENTS = [
  { icon: '', text: 'Free shipping on orders above ₹999' },
  { icon: '', text: 'New heavyweight stock just dropped' },
  { icon: '', text: '240 GSM combed cotton, made to last' },
  { icon: '', text: 'Customize your own tee in the studio' },
];

const SEPARATOR = '●';

const AnnouncementBar = () => {
  const trackRef = useRef(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // Measure the single-set width so we can set the exact animation distance
  useEffect(() => {
    if (!trackRef.current) return;
    // Each "set" is half the rendered children (we render 2 copies)
    const firstSet = trackRef.current.children.length / 2;
    let width = 0;
    for (let i = 0; i < firstSet; i++) {
      width += trackRef.current.children[i].offsetWidth;
    }
    setTrackWidth(width);
  }, []);

  // Calculate animation duration for ~45px/sec
  const speed = 45; // px per second
  const duration = trackWidth > 0 ? trackWidth / speed : 26;

  return (
    <section
      className="announcement-strip"
      aria-label="Store announcements"
    >
      <div
        ref={trackRef}
        className="announcement-track"
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        {/* Render two identical sets for seamless loop */}
        {[0, 1].map((setIdx) =>
          ANNOUNCEMENTS.map((item, i) => (
            <span className="announcement-item" key={`${setIdx}-${i}`}>
              <span className="announcement-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="announcement-text">{item.text}</span>
              <span className="announcement-separator" aria-hidden="true">
                {SEPARATOR}
              </span>
            </span>
          ))
        )}
      </div>
    </section>
  );
};

export default AnnouncementBar;
