import React, { useEffect, useState } from 'react';
import API from '../api';

export default function StudentProfile({ user: initialUser, refreshUser }) {
  const [user, setUser] = useState(initialUser || null);

  const [name, setName] = useState(initialUser?.name || '');
  const [bio, setBio] = useState(initialUser?.bio || '');
  const [tagsInput, setTagsInput] = useState((initialUser?.tags || []).join(', '));
  const [department, setDepartment] = useState(initialUser?.branch || '');
  const [achievements, setAchievements] = useState(initialUser?.achievements || '');
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const currentYear = new Date().getFullYear();

  const computedYearOfStudy = (() => {
    const gy = Number(user?.graduationYear);
    if (!gy || Number.isNaN(gy)) return null;
    const enrollmentYear = gy - 4;
    if (currentYear < enrollmentYear) return null;
    if (currentYear > gy) return null;
    const studyYearNumber = currentYear - enrollmentYear + 1;
    if (studyYearNumber === 1) return 'First Year';
    if (studyYearNumber === 2) return 'Second Year';
    if (studyYearNumber === 3) return 'Third Year';
    if (studyYearNumber === 4) return 'Final Year';
    return null;
  })();

  const yearOfStudy = user?.currentYearOfStudy || computedYearOfStudy || '';

  useEffect(() => {
    setUser(initialUser || null);
    setName(initialUser?.name || '');
    setBio(initialUser?.bio || '');
    setDepartment(initialUser?.branch || '');
    setAchievements(initialUser?.achievements || '');

    const manual = (initialUser?.tags || []).map(t => t.trim()).filter(Boolean);
    const generated = ['Student'];
    const genYear = (() => {
      const gy = Number(initialUser?.graduationYear);
      if (!gy || Number.isNaN(gy)) return null;
      const enrollmentYear = gy - 4;
      if (currentYear < enrollmentYear) return null;
      if (currentYear > gy) return null;
      const studyYearNumber = currentYear - enrollmentYear + 1;
      if (studyYearNumber === 1) return 'First Year';
      if (studyYearNumber === 2) return 'Second Year';
      if (studyYearNumber === 3) return 'Third Year';
      if (studyYearNumber === 4) return 'Final Year';
      return null;
    })();
    if (genYear) generated.push(genYear);

    const mergedLower = new Set();
    const merged = [];
    [...generated, ...manual].forEach(t => {
      const key = (t || '').toLowerCase();
      if (!key) return;
      if (!mergedLower.has(key)) {
        mergedLower.add(key);
        merged.push(t);
      }
    });
    setTagsInput(merged.join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const generated = ['Student'];
      if (computedYearOfStudy) generated.push(computedYearOfStudy);

      const manual = (tagsInput || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const mergedLower = new Set();
      const merged = [];
      [...generated, ...manual].forEach(t => {
        const key = (t || '').toLowerCase();
        if (!mergedLower.has(key)) {
          mergedLower.add(key);
          merged.push(t);
        }
      });

      // Send tags as an array (safer)
      const payload = {
        name: name?.trim() || '',
        bio: bio?.trim() || '',
        tags: merged,
        branch: department?.trim() || '',
        achievements: achievements?.trim() || '',
        currentYearOfStudy: yearOfStudy || null
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
      console.error('save student profile', err);
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
              {yearOfStudy && (
                <div className="text-sm text-gray-400 mt-1">
                  Year: <strong>{yearOfStudy}</strong>
                </div>
              )}
            </div>
            {/* role display intentionally removed (do not show SENIOR/JUNIOR labels) */}
          </div>

          <div className="mt-4 text-sm text-gray-200">
            {user?.bio || <em>No bio yet</em>}
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
          {user?.branch && (
            <div className="text-sm text-gray-300 mt-2">
              Department: <strong>{user.branch}</strong>
            </div>
          )}
          {user?.achievements && (
            <div className="text-sm text-gray-300 mt-1">
              Achievements: {user.achievements}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={saveProfile} className="card space-y-4">
        <h3 className="text-lg font-semibold">Edit Student Profile</h3>

        <div>
          <label className="text-sm">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Mail</label>
          <input value={user?.email || ''} readOnly className="input mt-1 bg-gray-50" />
        </div>

        <div>
          <label className="text-sm">Department / Branch</label>
          <input value={department} onChange={e => setDepartment(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Achievements</label>
          <input
            value={achievements}
            onChange={e => setAchievements(e.target.value)}
            className="input mt-1"
            placeholder="e.g. Hackathon winner, published paper..."
          />
        </div>

        <div>
          <label className="text-sm">Short bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            className="input mt-1"
          />
        </div>

        <div>
          <label className="text-sm">Skill Tags (comma separated)</label>
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            className="input mt-1"
            placeholder="react, node, dsa"
          />
          <div className="text-xs text-gray-400 mt-1">
            Your tags will be merged with generated tags (Student, Year).
          </div>
        </div>

        <div>
          <label className="text-sm">Year of Study</label>
          <input value={yearOfStudy || ''} readOnly className="input mt-1 bg-gray-50" />
          <div className="text-xs text-gray-400 mt-1">
            Automatically derived from graduation year.
          </div>
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
              setTagsInput((initialUser?.tags || []).join(', '));
              setDepartment(initialUser?.branch || '');
              setAchievements(initialUser?.achievements || '');
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
