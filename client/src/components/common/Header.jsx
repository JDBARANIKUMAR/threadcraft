// client/src/components/common/Header.jsx
import React from 'react';
import Navbar from './Navbar';
import AnnouncementBar from './AnnouncementBar';

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-50 flex flex-col bg-canvas border-b border-line">
      <Navbar />
      <AnnouncementBar />
    </header>
  );
};

export default Header;
