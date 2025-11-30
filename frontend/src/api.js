// frontend/src/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // ensure backend base URL
  timeout: 10000,
});

// set token into axios header and localStorage
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('mc_token', token);
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('mc_token');
    delete API.defaults.headers.common['Authorization'];
  }
}

export function getSavedToken() {
  return localStorage.getItem('mc_token');
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
