// frontend/src/components/Profile.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [tagsInput, setTagsInput] = useState(''); // comma-separated
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get('/auth/me');
        setUser(res.data.user);
        setName(res.data.user?.name || '');
        setBio(res.data.user?.bio || '');
        setTagsInput((res.data.user?.tags || []).join(', '));
      } catch (err) {
        console.error('fetch profile err', err);
      }
    })();
  }, []);

  async function saveProfile(e) {
    e && e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // prepare payload
      const payload = {
        name: name?.trim() || '',
        bio: bio?.trim() || '',
        tags: tagsInput // backend will accept comma string
      };
      const res = await API.put('/users/me', payload);
      setUser(res.data.user);
      setName(res.data.user?.name || '');
      setBio(res.data.user?.bio || '');
      setTagsInput((res.data.user?.tags || []).join(', '));
      setMessage('Profile saved.');
    } catch (err) {
      console.error('save profile err', err);
      setMessage(err.response?.data?.error || 'Save failed');
    } finally {
      setLoading(false);
      setTimeout(()=>setMessage(''), 3000);
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
      setUser(res.data.user);
      setMessage('Avatar uploaded.');
      setFile(null);
      // update form fields if changed
      setName(res.data.user?.name || name);
      setTagsInput((res.data.user?.tags || []).join(', '));
    } catch (err) {
      console.error('upload avatar err', err);
      setMessage(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setTimeout(()=>setMessage(''), 3000);
    }
  }

  if (!user) return <div className="card max-w-md">Loading profile…</div>;

  const avatarSrc = user.avatarUrl ? `http://localhost:5000${user.avatarUrl}` : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card flex items-start gap-6">
        <div>
          {avatarSrc ? (
            <img src={avatarSrc} alt="avatar" className="w-28 h-28 rounded-xl object-cover" />
          ) : (
            <div className="w-28 h-28 rounded-xl surface border border-white/6 flex items-center justify-center font-bold text-xl text-white/80">
              {(user.name || user.email || 'U').slice(0,2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{user.name || user.email}</div>
              <div className="text-sm text-muted">{user.email}</div>
            </div>
            <div className="text-sm text-gray-500">Role: <strong>{user.role}</strong></div>
          </div>

          <div className="mt-4 text-sm text-gray-700">{user.bio || <em>No bio yet</em>}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(user.tags || []).map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-md surface text-white/85 border border-white/6">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={saveProfile} className="card space-y-4">
        <h3 className="text-lg font-semibold">Edit Profile</h3>

        <div>
          <label className="text-sm">Full name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Short bio</label>
          <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} className="input mt-1" />
        </div>

        <div>
          <label className="text-sm">Tags (comma separated)</label>
          <input value={tagsInput} onChange={e=>setTagsInput(e.target.value)} className="input mt-1" placeholder="react, node, dsa" />
          <div className="text-xs text-gray-500 mt-1">Used for discovery (skills, topics). Separate with commas.</div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving…' : 'Save changes'}</button>
          <button type="button" onClick={() => { setName(user.name||''); setBio(user.bio||''); setTagsInput((user.tags||[]).join(', ')); }} className="btn btn-ghost">Reset</button>
          <div className="text-sm text-green-600">{message}</div>
        </div>
      </form>

      {/* Avatar upload */}
      <form onSubmit={uploadAvatar} className="card flex items-center gap-4">
        <div>
          <label className="text-sm block mb-1">Update photo</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button type="submit" disabled={uploading} className="btn btn-primary">{uploading ? 'Uploading…' : 'Upload Photo'}</button>
        </div>
      </form>
    </div>
  );
}
