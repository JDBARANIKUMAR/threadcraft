import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

const cartoonAvatars = ['🧢', '🌟', '🦊', '🐼', '🐸', '🦄'];

const AvatarPicker = ({ value, onChange }) => {
  const handleGalleryChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="avatar-picker">
      <p className="avatar-picker-title">Choose your avatar</p>
      <div className="avatar-picker-actions">
        <label className="avatar-upload-button">
          Choose from gallery
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleGalleryChange} />
        </label>
        <span className="avatar-picker-label">Or choose a cartoon</span>
        <div className="cartoon-avatar-list">
          {cartoonAvatars.map((avatar) => (
            <button
              key={avatar}
              type="button"
              aria-label={`Choose ${avatar} avatar`}
              aria-pressed={value === `emoji:${avatar}`}
              onClick={() => onChange(`emoji:${avatar}`)}
              className={`cartoon-avatar ${value === `emoji:${avatar}` ? 'selected' : ''}`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Profile page – displays the currently logged‑in user's information.
 * Uses a premium glassmorphism design with subtle gradients and animations.
 */
const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [avatar, setAvatar] = useState(() => {
    try {
      return localStorage.getItem('tc_profile_avatar') || '';
    } catch {
      return '';
    }
  });

  // If the user is not authenticated, redirect to login.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAvatarChange = (nextAvatar) => {
    setAvatar(nextAvatar);
    localStorage.setItem('tc_profile_avatar', nextAvatar);
    window.dispatchEvent(new CustomEvent('tc-avatar-updated', { detail: nextAvatar }));
  };

  if (!user) return null; // Guard – render nothing while auth context loads.

  const displayAvatar = avatar || user.avatar || '/default-avatar.png';

  return (
    <section className="profile-page">
      <div className="profile-card">
        <div className="avatar-wrapper">
          {displayAvatar.startsWith('emoji:') ? (
            <div className="avatar avatar-emoji" role="img" aria-label="Selected cartoon avatar">
              {displayAvatar.replace('emoji:', '')}
            </div>
          ) : (
            <img src={displayAvatar} alt={`${user.name}'s avatar`} className="avatar" />
          )}
        </div>
        <AvatarPicker value={displayAvatar} onChange={handleAvatarChange} />
        <h2 className="name">{user.name}</h2>
        <p className="email">{user.email}</p>
        {user.phone && <p className="phone">📞 {user.phone}</p>}
        <div className="actions">
          <button
            className="btn edit"
            onClick={() => navigate('/profile/edit')}
          >
            Edit Profile
          </button>
          <button
            className="btn logout"
            onClick={() => setShowLogout(true)}
          >
            Logout
          </button>
        </div>
        {showLogout && (
          <div className="modal-backdrop" onClick={() => setShowLogout(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <p>Are you sure you want to logout?</p>
              <div className="modal-actions">
                <button className="btn confirm" onClick={() => { logout(); navigate('/login'); }}>
                  Yes, logout
                </button>
                <button className="btn cancel" onClick={() => setShowLogout(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
