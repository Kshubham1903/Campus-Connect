// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import API, { setAuthToken } from '../api';
import Button from './ui/Button'; // optional - if not present, buttons still work

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [role, setRole] = useState('JUNIOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e && e.preventDefault();
    setError('');
    if (!email || !password || (mode === 'signup' && !name)) {
      setError('Please fill required fields.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await API.post('/auth/login', { email, password });
        const { token, user } = res.data;
        if (!token) throw new Error('No token returned');
        setAuthToken(token);
        if (typeof onLogin === 'function') onLogin(token, user);
      } else {
        // signup
        const res = await API.post('/auth/signup', { name, email, password, role });
        const { token, user } = res.data;
        if (!token) throw new Error('No token returned');
        setAuthToken(token);
        if (typeof onLogin === 'function') onLogin(token, user);
      }
    } catch (err) {
      console.error('auth err', err);
      const msg = err.response?.data?.error || err.message || 'Request failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-soft p-6">
      <h3 className="text-xl font-semibold mb-4">{mode === 'login' ? 'Login' : 'Create account'}</h3>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <>
            <label className="text-sm">Full name</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
            <label className="text-sm">Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} className="input">
              <option value="JUNIOR">Junior</option>
              <option value="SENIOR">Senior</option>
            </select>
          </>
        )}

        <label className="text-sm">Email</label>
        <input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />

        <label className="text-sm">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (mode === 'login' ? 'Logging in…' : 'Creating…') : (mode === 'login' ? 'Login' : 'Create account')}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          >
            {mode === 'login' ? 'Create account' : 'Have an account? Login'}
          </button>
        </div>
      </form>

      <div className="text-xs text-muted mt-3">
        Tip: If login fails, check backend is running at http://localhost:5000 and inspect DevTools Network tab.
      </div>
    </div>
  );
}
