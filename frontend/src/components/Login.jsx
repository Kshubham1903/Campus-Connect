import React, { useState } from 'react';
import API, { setAuthToken } from '../api';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('JUNIOR');

  async function signup() {
    try {
      const res = await API.post('/auth/signup', { name, email, password, role });
      const { token, user } = res.data;
      setAuthToken(token);
      onLogin(token, user);
    } catch (err) {
      alert(err.response?.data?.error || 'Signup failed');
    }
  }

  async function login() {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;
      setAuthToken(token);
      onLogin(token, user);
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Login / Signup</h3>
      <input className="w-full p-2 border rounded mb-2" placeholder="Name (signup)" value={name} onChange={e => setName(e.target.value)} />
      <input className="w-full p-2 border rounded mb-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="w-full p-2 border rounded mb-2" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <div className="mb-3">
        <label className="text-sm mr-2">Role:</label>
        <select value={role} onChange={e => setRole(e.target.value)} className="p-2 border rounded">
          <option value="JUNIOR">Junior</option>
          <option value="SENIOR">Senior</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={login} className="px-4 py-2 rounded bg-primary text-white">Login</button>
        <button onClick={signup} className="px-4 py-2 rounded border">Signup</button>
      </div>
      <p className="text-sm text-muted mt-3">Tip: create one Senior account and set verified=true in DB to appear in the list.</p>
    </div>
  );
}
