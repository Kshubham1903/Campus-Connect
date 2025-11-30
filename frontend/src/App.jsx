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
import Profile from './components/Profile'; // <-- added

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
        setAuthToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    init();
  }, []);

  function handleLogin(token, userData) {
    setAuthToken(token);
    setUser(userData);
    navigate('/');
  }

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
      <Navbar user={user} onLogout={handleLogout} />

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
