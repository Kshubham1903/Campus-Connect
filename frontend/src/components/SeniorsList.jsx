// frontend/src/components/SeniorsList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import API from '../api';
import RequestModal from './RequestModal';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

/*
  Professional Seniors list:
  - search + tag filter + sort
  - grid of cards with avatar, tags, brief info
  - pagination
*/

function Avatar({ name, size = 48 }) {
  // simple initials avatar
  const initials = (name || 'S').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-lg text-white font-semibold"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#6c8cff,#8bd3c7)'
      }}
    >
      {initials}
    </div>
  );
}

function SeniorCard({ senior, onRequest }) {
  return (
    <div className="bg-white rounded-lg shadow-soft border p-4 hover:shadow-xl transition-shadow duration-200 flex flex-col">
      <div className="flex items-start gap-4">
        <Avatar name={senior.name || senior.email} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-lg font-semibold text-slate-900">{senior.name || '(No name)'}</div>
              <div className="text-sm text-gray-500">{senior.email}</div>
            </div>
            <div>
              <button
                onClick={() => onRequest(senior)}
                className="px-3 py-1 rounded-md bg-primary text-white text-sm font-medium"
              >
                Request
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-700 min-h-[44px]">
            {/* optional bio / tags preview */}
            {senior.bio ? senior.bio : <span className="text-gray-400">No bio provided.</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(senior.tags || []).slice(0,6).map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">{tag}</span>
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

  // filters / search / pagination state
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'name'
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  useEffect(()=>{ fetchSeniors(); },[]);

  async function fetchSeniors(){
    setLoading(true);
    try {
      const res = await API.get('/seniors');
      // optional: normalize missing fields
      setSeniors((res.data || []).map(s => ({ ...s, tags: s.tags || [], bio: s.bio || '' })));
    } catch (err) {
      console.error('load seniors', err);
      alert('Failed to load seniors. Is backend running?');
    } finally {
      setLoading(false);
    }
  }

  // collect all tag suggestions
  const allTags = useMemo(() => {
    const set = new Set();
    seniors.forEach(s => (s.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [seniors]);

  // derived filtered list
  const filtered = useMemo(() => {
    let list = seniors.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s => (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.tags || []).join(' ').toLowerCase().includes(q));
    }
    if (activeTag) {
      list = list.filter(s => (s.tags || []).includes(activeTag));
    }
    if (sortBy === 'name') list.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    return list;
  }, [seniors, query, activeTag, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  function handleRequestClick(senior){
    setSelected(senior);
  }

  function closeModal(){
    setSelected(null);
  }

  function onRequestSent(){
    // simple success handler: close modal and maybe show toast
    setSelected(null);
    alert('Request sent — you will be notified when accepted.');
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Find a Senior</h2>
          <p className="text-sm text-gray-500 mt-1">Search mentors by name, email, or skills — request a session and chat when accepted.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg px-3 py-2 gap-2 bg-white shadow-soft">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={e=>{ setQuery(e.target.value); setPage(1); }}
              placeholder="Search seniors, skills, email..."
              className="outline-none text-sm"
            />
            {query && <button onClick={()=>setQuery('')} className="text-xs text-gray-400 ml-2">Clear</button>}
          </div>
        </div>
      </div>

      {/* filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTag(''); setPage(1); }}
            className={`px-3 py-1 rounded-md text-sm ${activeTag === '' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
            All
          </button>

          {allTags.slice(0,8).map(tag => (
            <button key={tag}
              onClick={() => { setActiveTag(tag === activeTag ? '' : tag); setPage(1); }}
              className={`px-3 py-1 rounded-md text-sm ${activeTag === tag ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>
              {tag}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort</label>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="p-2 border rounded text-sm">
            <option value="relevance">Relevance</option>
            <option value="name">Name (A→Z)</option>
          </select>
        </div>
      </div>

      {/* grid */}
      <div>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className="bg-white animate-pulse p-4 rounded-lg h-36"/>
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageItems.map(s => <SeniorCard key={s._id} senior={s} onRequest={handleRequestClick} />)}
            </div>

            {/* empty */}
            {filtered.length === 0 && (
              <div className="mt-8 text-center text-gray-500">No seniors match your search.</div>
            )}

            {/* pagination */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p-1))}
                disabled={page === 1}
                className="p-2 rounded-md border bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p+1))}
                disabled={page === totalPages}
                className="p-2 rounded-md border bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {selected && <RequestModal senior={selected} onClose={closeModal} onSent={onRequestSent} />}
    </div>
  );
}
