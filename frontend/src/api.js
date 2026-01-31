import axios from 'axios';

const API = axios.create({
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
timeout: 10000,
});

// set token into axios header and storage
export function setAuthToken(token, remember) {
const rememberFlag = arguments.length > 1 ? Boolean(remember) : false;

if (token) {
try {
if (rememberFlag) {
localStorage.setItem('mc_token', token);
localStorage.setItem('mc_remember', '1');
} else {
sessionStorage.setItem('mc_token', token);
}
} catch (e) {
try {
localStorage.setItem('mc_token', token);
} catch (_) {}
}
API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
} else {
try {
localStorage.removeItem('mc_token');
localStorage.removeItem('mc_remember');
} catch (_) {}
try {
sessionStorage.removeItem('mc_token');
} catch (_) {}
delete API.defaults.headers.common['Authorization'];
}
}

export function getSavedToken() {
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
if (typeof window !== 'undefined') window.location.href = '/login';
}
return Promise.reject(err);
}
);

export default API;