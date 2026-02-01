// frontend/components/Avatar.jsx
import React from 'react';
import API from '../api';
import { displayName, initials } from '../utils/displayName';

export default function Avatar({ name, avatarUrl, user, size = 96 }) {
  const sourceUser = user || (name ? { name } : null);
  const finalName = displayName(sourceUser || {});

  const rawAvatarUrl =
    avatarUrl || user?.avatarUrl || user?.profilePhoto || null;

  const apiBase =
    import.meta?.env?.VITE_API_URL ||
    import.meta?.env?.VITE_SOCKET_URL ||
    'http://localhost:5000';
  const src = rawAvatarUrl
    ? (rawAvatarUrl.startsWith('http') ? rawAvatarUrl : `${apiBase}${rawAvatarUrl}`)
    : null;

  const computedInitials = initials(sourceUser || finalName);

  if (src) {
    return (
      <img
        src={src}
        alt={finalName || 'avatar'}
        loading="lazy"
        className="rounded-full object-cover shadow-md"
        style={{ width: size, height: size }}
        onError={e => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '';
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shadow-md"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#7C3AED,#FF6B6B)',
      }}
      title={finalName}
    >
      <span
        className="truncate"
        style={{
          maxWidth: '80%',
          fontSize: Math.round(size / 3),
        }}
      >
        {computedInitials}
      </span>
    </div>
  );
}
