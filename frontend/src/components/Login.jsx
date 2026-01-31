import React, { useState } from 'react';
import API, { setAuthToken } from '../api';

export default function Login({ onLogin }) {
const [mode, setMode] = useState('login');
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [graduationYear, setGraduationYear] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [remember, setRemember] = useState(false);

const currentYear = new Date().getFullYear();

function computeYearOfStudy() {
const gy = Number(graduationYear);
if (!gy || Number.isNaN(gy)) return '';

const enrollmentYear = gy - 4;
if (currentYear > gy) return '';
if (currentYear < enrollmentYear) return '';

const studyYearNumber = currentYear - enrollmentYear + 1;
if (studyYearNumber === 1) return 'First Year';
if (studyYearNumber === 2) return 'Second Year';
if (studyYearNumber === 3) return 'Third Year';
if (studyYearNumber === 4) return 'Final Year';
return '';
}

const yearOfStudy = computeYearOfStudy();
const showYearInput = yearOfStudy !== '';

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
    setAuthToken(token, remember);
    onLogin?.(token, user, { justSignedUp: false });
  } else {
    const payload = {
      name,
      email,
      password,
      graduationYear: Number(graduationYear) || undefined
    };
    const res = await API.post('/auth/signup', payload);
    const { token, user } = res.data;
    if (!token) throw new Error('No token returned');
    setAuthToken(token, remember);
    onLogin?.(token, user, { justSignedUp: true });
  }
} catch (err) {
  const msg = err.response?.data?.error || err.message || 'Request failed';
  setError(msg);
} finally {
  setLoading(false);
}
}

return (
<div className="max-w-md w-full card rounded-xl shadow-soft p-6">
<h3 className="text-xl font-semibold mb-4 text-white/95">
{mode === 'login' ? 'Login' : 'Create account'}
</h3>
<form onSubmit={submit} className="space-y-3">
{mode === 'signup' && (
<>
<label className="text-sm">Full name</label>
<input
className="input"
value={name}
onChange={e => setName(e.target.value)}
placeholder="Your name"
/>


        <label className="text-sm">Graduation Year</label>
        <input
          className="input"
          type="number"
          value={graduationYear}
          onChange={e => setGraduationYear(e.target.value)}
          placeholder="e.g. 2027"
        />

        {showYearInput && (
          <>
            <label className="text-sm">Year of Study</label>
            <input
              className="input bg-gray-50"
              value={yearOfStudy}
              readOnly
              placeholder="Automatically calculated"
            />
          </>
        )}
      </>
    )}

    <label className="text-sm">Email</label>
    <input
      className="input"
      value={email}
      onChange={e => setEmail(e.target.value)}
      placeholder="you@example.com"
    />

    <label className="text-sm">Password</label>
    <input
      className="input"
      type="password"
      value={password}
      onChange={e => setPassword(e.target.value)}
      placeholder="password"
    />

    {error && <div className="text-sm text-red-600">{error}</div>}

    <div className="flex items-center justify-between gap-3">
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading
          ? (mode === 'login' ? 'Logging in…' : 'Creating…')
          : (mode === 'login' ? 'Login' : 'Create account')}
      </button>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login');
          setError('');
        }}
      >
        {mode === 'login' ? 'Create account' : 'Have an account? Login'}
      </button>
    </div>

    <label className="inline-flex items-center gap-2 text-sm mt-2">
      <input
        type="checkbox"
        checked={remember}
        onChange={e => setRemember(e.target.checked)}
      />
      <span>Remember me on this device</span>
    </label>
  </form>

  <div className="text-xs text-muted mt-3">
    Tip: If login fails, check backend is running at http://localhost:5000
  </div>
</div>
);
}