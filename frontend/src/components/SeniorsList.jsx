import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { getSavedToken } from '../api';
import RequestModal from './RequestModal';
import Avatar from './Avatar';
import { displayName } from '../utils/displayName';
// function Avatar({ name, avatarUrl, size = 96 }) {
// const initials =
// (name || '')
// .split(' ')
// .map(n => n)
// .slice(0, 2)
// .join('')
// .toUpperCase() || 'S';

// const src = avatarUrl
// ? (avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000${avatarUrl}`) : null;

// return src ? (
// <img
// src={src}
// alt={name || 'avatar'}
// className="rounded-full object-cover shadow-md"
// style={{ width: size, height: size }}
// onError={e => {
// e.currentTarget.onerror = null;
// e.currentTarget.src = '';
// }}
// />
// ) : (
// <div
// className="rounded-full flex items-center justify-center text-white font-semibold shadow-md"
// style={{
// width: size,
// height: size,
// background: 'linear-gradient(135deg,#7C3AED,#FF6B6B)',
// }}
// >
// <span
// className="truncate"
// style={{
// maxWidth: '80%',
// fontSize: Math.round(size / 3), // smaller text
// }}
// >
// {initials}
// </span>
// </div>
// );
// }

function SeniorCard({ senior, onRequest }) {
  // clicking whole card will open modal with full info
  return (
    <div
      onClick={() => onRequest(senior)}
      className="card rounded-2xl p-5 hover:shadow-lg transition-shadow duration-200 border border-transparent hover:border-white/5 cursor-pointer"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Avatar user={senior} size={64} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold text-white/95 truncate">
                    {displayName(senior)}
                  </div>
                <div className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-semibold">
                  {senior.branch || senior.role || 'SENIOR'}
                </div>
              </div>
              <div className="text-sm text-white/60 truncate">{senior.email}</div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-white/60">{senior.years || ''}</div>
              <button
                onClick={(e) => {
                  // prevent the outer onClick firing when pressing the request button
                  e.stopPropagation();
                  onRequest(senior);
                }}
                className="px-3 py-1 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-95"
              >
                Request
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-white/60">
            {senior.bio || (
              <span className="text-white/50">
                No bio provided — ask about specialization, availability, or experience.
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(senior.tags || []).slice(0, 6).map(t => (
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
    </div>
  );
}


export default function SeniorsList() {
const [seniors, setSeniors] = useState([]);
const [loading, setLoading] = useState(true);
const [selected, setSelected] = useState(null);
const [query, setQuery] = useState('');
const navigate = useNavigate();

useEffect(() => {
fetchSeniors();
}, []);

async function fetchSeniors() {
setLoading(true);
try {
const res = await API.get('/seniors');
const arr = Array.isArray(res.data) ? res.data : res.data?.seniors || [];
setSeniors(arr);
} catch (err) {
console.error('load seniors error:', err.message, err.response?.status, err.response?.data);
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
const token = getSavedToken();
if (!token) {
navigate('/login', { state: { fromRequestFor: s._id } });
return;
}
setSelected(s);
}

function closeModal() {
setSelected(null);
}

return (
<div id="seniors-section" className="w-full space-y-6">
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div>
<h2 className="text-2xl font-semibold">Seniors</h2>
<div className="text-sm text-gray-300 mt-1">
Browse available Students/Alumini and request help. Total:{' '}
<strong>{seniors.length}</strong>
</div>
</div>
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
      <input
        placeholder="Search by name, skill, or email..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="input w-full sm:min-w-[260px]"
      />
      <button onClick={fetchSeniors} className="btn btn-ghost w-full sm:w-auto">
        Refresh
      </button>
    </div>
  </div>

  {loading ? (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="surface animate-pulse p-6 rounded-2xl h-44" />
      ))}
    </div>
  ) : filtered.length === 0 ? (
    <div className="text-gray-400">No seniors found.</div>
  ) : (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map(s => (
        <SeniorCard key={s._id} senior={s} onRequest={handleRequestClick} />
      ))}
    </div>
  )}

  {selected && (
    <RequestModal
      senior={selected}
      onClose={closeModal}
      onSent={() => setSelected(null)}
    />
  )}
</div>
);
}
