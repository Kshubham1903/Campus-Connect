// frontend/src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import API, { getSavedToken, setAuthToken } from './api';

import Navbar from './components/Navbar';
import Layout from './components/Layout';

import HomeHero from './components/HomeHero';
import SeniorsList from './components/SeniorsList';
import Login from './components/Login';
import SeniorDashboard from './components/SeniorDashboard';
import JuniorDashboard from './components/JuniorDashboard';
import Chat from './components/Chat';

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // validate saved token on app start
  useEffect(() => {
    async function init() {
      const token = getSavedToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }

      setAuthToken(token);
      try {
        const res = await API.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        // invalid token -> clear
        setAuthToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    init();
  }, []);

  // after login/signup
  function handleLogin(token, userData) {
    setAuthToken(token);
    setUser(userData);
    navigate('/');
  }

  // logout
  function handleLogout() {
    setAuthToken(null);
    setUser(null);
    navigate('/login');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking authentication…
      </div>
    );
  }

  return (
    <>
      {/* single Navbar for the app */}
      <Navbar user={user} onLogout={handleLogout} />

      <Routes>
        {/* Login page: full-width, centered */}
        <Route
          path="/login"
          element={
            <div className="min-h-screen flex items-center justify-center px-4 py-12">
              <Login onLogin={handleLogin} />
            </div>
          }
        />

        {/* Home (boxed layout) */}
        <Route
          path="/"
          element={
            <Layout>
              <HomeHero />
              <SeniorsList />
            </Layout>
          }
        />

        {/* Dashboard (boxed layout) */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <SeniorDashboard />
            </Layout>
          }
        />

        {/* Junior chats (boxed layout) */}
        <Route
          path="/junior"
          element={
            <Layout>
              <JuniorDashboard />
            </Layout>
          }
        />

        {/* Chat page */}
        <Route
          path="/chat/:chatId"
          element={
            <Layout>
              <Chat />
            </Layout>
          }
        />
      </Routes>
    </>
  );
}
