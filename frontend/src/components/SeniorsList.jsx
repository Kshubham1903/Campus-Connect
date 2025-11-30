// frontend/src/components/SeniorsList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import API from '../api';
import RequestModal from './RequestModal';

/**
 * Polished SeniorsList with larger avatars and cleaner layout.
 * Replace your existing SeniorsList.jsx with this file.
 */

function Avatar({ name, avatarUrl, size = 96 }) {
  const initials = (name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || 'S';
  const src = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`) : null;

  return src ? (
    <img
      src={src}
      alt={name || 'avatar'}
      className="rounded-full object-cover shadow-md"
      style={{ width: size, height: size }}
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ''; }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shadow-md"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#6C8CFF,#8bd3c7)'
      }}
    >
      <span style={{ fontSize: Math.round(size / 2.5) }}>{initials}</span>
    </div>
  );
}

function SeniorCard({ senior, onRequest }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-lg transition-shadow duration-200 border border-transparent hover:border-gray-100">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Avatar name={senior.name || senior.email} avatarUrl={senior.avatarUrl} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-slate-900 truncate">{senior.name || '(No name)'}</div>
                <div className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold">{senior.role || 'SENIOR'}</div>
              </div>
              <div className="text-sm text-gray-500 truncate">{senior.email}</div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-gray-400">{senior.years || ''}</div>
              <button
                onClick={() => onRequest(senior)}
                className="px-3 py-1 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-95"
              >
                Request
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-700 line-clamp-3">
            {senior.bio || <span className="text-gray-400">No bio provided — ask about specialization, availability, or experience.</span>}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(senior.tags || []).slice(0,6).map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeniorsList(){
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(()=>{ fetchSeniors(); },[]);

  async function fetchSeniors(){
    setLoading(true);
    try {
      const res = await API.get('/seniors');
      const arr = Array.isArray(res.data) ? res.data : (res.data?.seniors || []);
      setSeniors(arr);
    } catch (err) {
      console.error('load seniors', err);
      setSeniors([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return seniors;
    return seniors.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.tags || []).join(' ').toLowerCase().includes(q) ||
      (s.bio || '').toLowerCase().includes(q)
    );
  }, [seniors, query]);

  function handleRequestClick(s) {
    setSelected(s);
  }

  function closeModal() { setSelected(null); }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Seniors</h2>
          <div className="text-sm text-gray-500 mt-1">Browse available seniors and request help. Total: <strong>{seniors.length}</strong></div>
        </div>

        <div className="flex items-center gap-3">
          <input
            placeholder="Search by name, skill, or email..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input"
            style={{ minWidth: 260 }}
          />
          <button onClick={()=>fetchSeniors()} className="btn btn-ghost">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({length:6}).map((_, i) => <div key={i} className="bg-white animate-pulse p-6 rounded-2xl h-44" />)}
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="text-gray-500">No seniors found.</div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map(s => <SeniorCard key={s._id} senior={s} onRequest={handleRequestClick} />)}
            </div>
          )}
        </>
      )}

      {selected && <RequestModal senior={selected} onClose={closeModal} onSent={() => { setSelected(null); }} />}
    </div>
  );
}
