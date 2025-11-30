// frontend/src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // ensure backend base URL
  timeout: 10000,
});

// set token into axios header and localStorage
export function setAuthToken(token) {
  // Backwards-compatible: this function now supports optional "remember" persistence
  // but callers may still pass a single token argument (persist=false by default).
  // Usage: setAuthToken(token, remember?: boolean)
  const remember = arguments.length > 1 ? Boolean(arguments[1]) : false;

  if (token) {
    // store token either in sessionStorage (default) or localStorage (when remember=true)
    try {
      if (remember) {
          localStorage.setItem('mc_token', token);
          try { localStorage.setItem('mc_remember', '1'); } catch (_) {}
        } else {
          sessionStorage.setItem('mc_token', token);
        }
    } catch (e) {
      // fallback to localStorage if sessionStorage restricted
      try { localStorage.setItem('mc_token', token); } catch (_) {}
    }
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // clear token from both storages and axios header
    try { localStorage.removeItem('mc_token'); localStorage.removeItem('mc_remember'); } catch (_) {}
    try { sessionStorage.removeItem('mc_token'); } catch (_) {}
    delete API.defaults.headers.common['Authorization'];
  }
}

export function getSavedToken() {
  // Prefer long-term (localStorage) token if present, otherwise session token
  // prefer session token; fall back to local token only if user explicitly chose "remember"
  try {
    const session = sessionStorage.getItem('mc_token');
    if (session) return session;
  } catch (e) {}

  try {
    const remember = localStorage.getItem('mc_remember');
    if (remember === '1') return localStorage.getItem('mc_token');
  } catch (e) {}

  return null;
}

// auto logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      setAuthToken(null);
      // optional: redirect to login
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
