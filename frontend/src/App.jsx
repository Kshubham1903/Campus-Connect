import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import API, { getSavedToken, setAuthToken } from './api';
import Navbar from './components/Navbar';
import Layout from './components/Layout';
import HomeHero from './components/HomeHero';
import SeniorsList from './components/SeniorsList';
import Login from './components/Login';
import SeniorDashboard from './components/SeniorDashboard';
import JuniorDashboard from './components/JuniorDashboard';
import Chat from './components/Chat';
import Profile from './components/Profile';
import CompleteProfilePrompt from './components/CompleteProfilePrompt';

export default function App() {
const navigate = useNavigate();
const [user, setUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [showProfilePrompt, setShowProfilePrompt] = useState(false);

useEffect(() => {
async function init() {
const sessionToken =
typeof sessionStorage !== 'undefined'
? sessionStorage.getItem('mc_token')
: null;
if (!sessionToken) {
setAuthLoading(false);
return;
}

  setAuthToken(sessionToken);
  try {
    const res = await API.get('/auth/me');
    setUser(res.data.user);
  } catch {
    setAuthToken(null);
    setUser(null);
  } finally {
    setAuthLoading(false);
  }
}
init();
}, []);

function handleLogin(token, userData, opts = {}) {
  setAuthToken(token);
  setUser(userData);
  // If this was justSignedUp, show a one-time profile prompt unless the user already saw it
  if (opts.justSignedUp) {
    try {
      const key = `mc_profile_prompt_shown_${userData?._id}`;
      const shown = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (!shown) setShowProfilePrompt(true);
    } catch (e) {
      // ignore storage errors
      setShowProfilePrompt(true);
    }
  }

  navigate('/');
}

function handleLogout() {
setAuthToken(null);
setUser(null);
navigate('/login');
}

if (authLoading) {
return (
<div className="min-h-screen flex items-center justify-center text-gray-300">
Checking authentication…
</div>
);
}

return (
<>
<Toaster position="top-right" />
<Navbar user={user} onLogout={handleLogout} />
      {showProfilePrompt && (
        <CompleteProfilePrompt
          user={user}
          onClose={(info) => {
            // mark skip so we don't prompt again
            try {
              const key = `mc_profile_prompt_shown_${user?._id}`;
              if (typeof window !== 'undefined') localStorage.setItem(key, '1');
            } catch (e) {}
            setShowProfilePrompt(false);
          }}
          onComplete={() => {
            try {
              const key = `mc_profile_prompt_shown_${user?._id}`;
              if (typeof window !== 'undefined') localStorage.setItem(key, '1');
            } catch (e) {}
            setShowProfilePrompt(false);
            navigate('/profile');
          }}
        />
      )}
<Routes>
<Route
path="/login"
element={
<div className="min-h-screen flex items-center justify-center px-4 py-12">
<Login onLogin={handleLogin} />
</div>
}
/>
<Route
path="/"
element={
<Layout>
<HomeHero />
<SeniorsList />
</Layout>
}
/>
<Route
path="/dashboard"
element={
<Layout>
<SeniorDashboard />
</Layout>
}
/>
<Route
path="/junior"
element={
<Layout>
<JuniorDashboard />
</Layout>
}
/>
<Route
path="/chat/:chatId"
element={
<Layout>
<Chat />
</Layout>
}
/>
<Route
path="/profile"
element={
<Layout>
<Profile />
</Layout>
}
/>
</Routes>
</>
);
}

