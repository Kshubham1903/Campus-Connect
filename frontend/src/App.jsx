// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import SeniorsList from './components/SeniorsList';
import SeniorDashboard from './components/SeniorDashboard';
import JuniorDashboard from './components/JuniorDashboard';
import Chat from './components/Chat';
import Navbar from './components/Navbar';
import HomeHero from './components/HomeHero';
import { setAuthToken, getSavedToken } from './api';

export default function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(getSavedToken());
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) setAuthToken(token);
    else setAuthToken(null);
  }, [token]);

  function handleLogin(tokenValue, userValue) {
    setToken(tokenValue);
    setUser(userValue);
    navigate('/');
  }

  function handleLogout() {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="py-6">
        <Routes>
          <Route path="/" element={<><HomeHero /><div className="container mx-auto px-4 py-6"><SeniorsList /></div></>} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/dashboard" element={<SeniorDashboard />} />
          <Route path="/junior" element={<JuniorDashboard />} />
          <Route path="/chat/:chatId" element={<Chat />} />
        </Routes>
      </main>
    </div>
  );
}
