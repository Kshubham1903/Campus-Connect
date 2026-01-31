// AlumniProfile.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';

export default function AlumniProfile({ user: initialUser, refreshUser }) {
  const [user, setUser] = useState(initialUser || null);

  const [name, setName] = useState(initialUser?.name || '');
  const [bio, setBio] = useState(initialUser?.bio || '');
  const [companyName, setCompanyName] = useState(initialUser?.currentCompany || '');
  const [position, setPosition] = useState(initialUser?.jobTitle || '');
  const [btechIn, setBtechIn] = useState(initialUser?.degree || '');
  const [specialization, setSpecialization] = useState(initialUser?.branch || '');
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setUser(initialUser || null);
    setName(initialUser?.name || '');
    setBio(initialUser?.bio || '');
    setCompanyName(initialUser?.currentCompany || '');
    setPosition(initialUser?.jobTitle || '');
    setBtechIn(initialUser?.degree || '');
    setSpecialization(initialUser?.branch || '');

    // ensure tags exist and include "Alumni" (deduplicated, keep order: Alumni then existing)
    const manual = (initialUser?.tags || []).map(t => String(t || '').trim()).filter(Boolean);
    const lower = new Set();
    const merged = [];
    ['Alumni', ...manual].forEach(t => {
      const k = t.toLowerCase();
      if (!k) return;
      if (!lower.has(k)) {
        lower.add(k);
        merged.push(t);
      }
    });
    setUser(prev => ({ ...(prev || {}), tags: merged }));
  }, [initialUser]);

  useEffect(() => {
    if (!file) {
      setPreviewSrc(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);
    return () => {
      try {
        reader.abort?.();
      } catch {}
      setPreviewSrc(null);
    };
  }, [file]);

  async function saveProfile(e) {
    e && e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // start from current user.tags (or initialUser tags) and ensure Alumni exists
      const existing = (user?.tags || initialUser?.tags || []).map(t => String(t || '').trim()).filter(Boolean);
      const lowerSet = new Set(existing.map(t => t.toLowerCase()));
      if (!lowerSet.has('alumni')) existing.unshift('Alumni');

      const payload = {
        name: name?.trim() || '',
        bio: bio?.trim() || '',
        currentCompany: companyName?.trim() || '',
        jobTitle: position?.trim() || '',
        degree: btechIn?.trim() || '',
        branch: specialization?.trim() || '',
        // send tags as array for consistency / safety
        tags: existing
      };

      const res = await API.put('/users/me', payload);
      const updated = res?.data?.user || null;
      if (updated) {
        setUser(updated);
        refreshUser?.(updated);
        setMessage('Profile saved.');
      } else {
        setMessage('Profile saved (no user returned).');
      }
    } catch (err) {
      console.error('save alumni profile', err);
      setMessage(err?.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  async function uploadAvatar(e) {
    e && e.preventDefault();
    if (!file) return alert('Choose an image first');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await API.post('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updated = res?.data?.user || null;
      if (updated) {
        setUser(updated);
        refreshUser?.(updated);
        setMessage('Avatar uploaded.');
        setFile(null);
        setPreviewSrc(null);
      } else {
        setMessage('Avatar uploaded (no user returned).');
      }
    } catch (err) {
      console.error('upload avatar err', err);
      setMessage(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  const apiBase = import.meta?.env?.VITE_API_URL || 'http://localhost:5000';
  const avatarSrc = user?.avatarUrl ? `${apiBase}${user.avatarUrl}` : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card flex items-start gap-6">
        <div>
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-28 h-28 rounded-xl object-cover" />
          ) : previewSrc ? (
            <img src={previewSrc} alt="preview" className="w-28 h-28 rounded-xl object-cover" />
          ) : (
            <div className="w-28 h-28 rounded-xl surface border border-white/6 flex items-center justify-center font-bold text-xl text-white/80">
              {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{user?.name || user?.email}</div>
              <div className="text-sm text-muted">{user?.email}</div>
            </div>
            {/* role display intentionally removed (do not show SENIOR/JUNIOR labels) */}
          </div>

          <div className="mt-4 text-sm text-gray-200">
            {user?.bio || <em>No bio yet</em>}
          </div>
          <div className="mt-3 text-sm text-gray-300">
            {user?.currentCompany && <div>Company: <strong>{user.currentCompany}</strong></div>}
            {user?.jobTitle && <div>Position: <strong>{user.jobTitle}</strong></div>}
            {user?.degree && <div>BTech in: <strong>{user.degree}</strong></div>}
            {user?.branch && <div>Specialization: <strong>{user.branch}</strong></div>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(user?.tags || []).map(t => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-md surface text-white/85 border border-white/6"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={saveProfile} className="card space-y-4">
        <h3 className="text-lg font-semibold">Edit Alumni Profile</h3>

        <div>
          <label className="text-sm">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Mail</label>
          <input value={user?.email || ''} readOnly className="input mt-1 bg-gray-50" />
        </div>

        <div>
          <label className="text-sm">Company Name</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Position</label>
          <input value={position} onChange={e => setPosition(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">BTech in</label>
          <input value={btechIn} onChange={e => setBtechIn(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Specialization</label>
          <input
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            className="input mt-1"
          />
        </div>

        <div>
          <label className="text-sm">Short bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="input mt-1" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => {
              setName(initialUser?.name || '');
              setBio(initialUser?.bio || '');
              setCompanyName(initialUser?.currentCompany || '');
              setPosition(initialUser?.jobTitle || '');
              setBtechIn(initialUser?.degree || '');
              setSpecialization(initialUser?.branch || '');
              setMessage('');
              setFile(null);
              setPreviewSrc(null);
            }}
            className="btn btn-ghost"
          >
            Reset
          </button>
          <div className="text-sm text-green-500">{message}</div>
        </div>
      </form>

      <form onSubmit={uploadAvatar} className="card flex items-center gap-4">
        <div>
          <label className="text-sm block mb-1">Update photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button type="submit" disabled={uploading} className="btn btn-primary">
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </button>
        </div>
      </form>
    </div>
  );
}
