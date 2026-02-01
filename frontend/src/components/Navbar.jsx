import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

import API, { getSavedToken } from '../api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);
  const containerRef = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user) return;
      try {
        const res = await API.get('/notifications');
        if (!mounted) return;
        setNotifications(res?.data?.notifications || []);
      } catch (err) {
        // ignore network errors
        console.error('load notifications', err);
      }
    }
    load();

    // If no user, don't try to connect socket
    if (!user) return () => { mounted = false; };

    const token = getSavedToken();
    if (!token) return () => { mounted = false; };

    // create socket and attach listener
    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });
    socketRef.current = s;

    const onNotification = (n) => {
      // ensure newest first
      setNotifications(prev => [n, ...prev]);
    };

    s.on('notification', onNotification);

    s.on('connect_error', (err) => {
      console.error('socket connect_error', err);
    });

    // cleanup
    return () => {
      mounted = false;
      try {
        s.off('notification', onNotification);
        s.disconnect();
      } catch (e) {
        // ignore
      }
      socketRef.current = null;
    };
  }, [user]);

  // click outside / escape handlers to close menus
  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setMenuOpen(false);
        setNotifOpen(false);
        setMobileNavOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setNotifOpen(false);
        setMobileNavOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function scrollToHero() {
    const doScroll = () => {
      const hero = document.getElementById('home-hero-section');
      if (hero) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 80;
        const top = hero.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (window.location.pathname === '/') {
      doScroll();
      return;
    }

    navigate('/');
    // small delay for route change; this is intentionally short and robust enough
    setTimeout(doScroll, 160);
  }

  // simple mark-all-read helper (optional)
  async function markAllRead() {
    try {
      const unread = notifications.filter(n => !n.read).map(n => n._id);
      await Promise.all(unread.map(id => API.patch(`/notifications/${id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('markAllRead failed', err);
    }
  }

  return (
    <header className="w-full sticky top-0 z-50 bg-black/80 border-b border-white/6">
      <div ref={containerRef} className="mx-auto max-w-[1600px] px-6 md:px-10 lg:px-16 xl:px-24 h-16 surface flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" aria-label="CampusConnect home">
          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.98 }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent-500 flex items-center justify-center text-white text-lg font-semibold neon-pulse"
          >
            CC
          </motion.div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-white/95">CampusConnect</div>
            <div className="text-xs text-white/70">Connect — Learn — Grow</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button onClick={scrollToHero} className="text-white/90 hover:text-primary transition" type="button">
            Home
          </button>
          {user && user.role === 'SENIOR' && (
            <Link to="/dashboard" className="text-white/90 hover:text-primary transition">
              Dashboard
            </Link>
          )}
          {user && (
            <Link to="/junior" className="text-white/90 hover:text-primary transition">
              My Chats
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => { setMobileNavOpen(o => !o); setMenuOpen(false); setNotifOpen(false); }}
            className="md:hidden p-2 rounded-xl hover:bg-white/5"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/90">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          {!user && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl btn-neon text-white/95 hover:opacity-95 text-sm font-medium"
            >
              Login
            </button>
          )}

          {user && (
            <div className="relative hidden md:flex items-center gap-3">
              {/* notifications */}
              <div className="relative">
                <button
                  onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
                  className="p-2 rounded-xl hover:bg-white/3"
                  aria-haspopup="true"
                  aria-expanded={notifOpen}
                  aria-label="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/90">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                      {unread}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full translate-y-2 mt-2 w-80 rounded-xl shadow-lg border p-2 z-50 modal card-pop bg-black/90"
                    style={{ transformOrigin: 'right top' }}
                  >
                    <div className="flex items-center justify-between px-2 pb-2">
                      <div className="text-sm font-semibold">Notifications</div>
                      <div className="flex items-center gap-2">
                        <button onClick={markAllRead} className="text-xs text-white/70 hover:text-white/90">Mark all read</button>
                        <button onClick={() => setNotifOpen(false)} className="text-xs text-white/70 hover:text-white/90">Close</button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-auto space-y-2">
                      {notifications.length === 0 && (
                        <div className="px-3 py-4 text-sm text-white/60">No notifications</div>
                      )}
                      {notifications.map(n => (
                        <div key={n._id} className={`px-3 py-2 rounded-md ${n.read ? 'bg-transparent' : 'bg-white/5'}`}>
                          <div className="text-sm font-medium">{n.message || 'Notification'}</div>
                          <div className="text-xs text-white/70">{n.meta?.text || n.meta?.message || (n.createdAt ? new Date(n.createdAt).toLocaleString() : '')}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* profile menu */}
              <div className="relative">
                <div className="flex items-center gap-2 mr-0 sm:mr-2">
                  <button
                    onClick={() => setMenuOpen(o => !o)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl border surface hover:bg-primary/10 max-w-[140px] sm:max-w-[180px] md:max-w-[210px]"
                    aria-haspopup="true"
                    aria-expanded={menuOpen}
                    type="button"
                  >
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent-500/12 flex items-center justify-center text-xs sm:text-sm font-medium text-white/80 flex-shrink-0">
                      {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <span className="text-xs sm:text-sm text-white/85 truncate">{user.name || user.email}</span>
                      <span className="text-xs text-white/60 truncate hidden sm:block">{user.email}</span>
                    </div>
                  </button>
                </div>

                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-full translate-y-2 mt-0 w-48 rounded-xl shadow-lg border p-2 z-50 modal card-pop bg-black/90"
                    style={{ transformOrigin: 'right top' }}
                  >
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10"
                      type="button"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50"
                      type="button"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {mobileNavOpen && (
        <div className="md:hidden border-t border-white/6 bg-black/80">
          <div className="px-6 py-4 flex flex-col gap-2">
            {user && (
              <>
                {/* Profile info in mobile menu */}
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-lg bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent-500/12 flex items-center justify-center text-sm font-medium text-white/80 flex-shrink-0">
                    {(user.name || user.email || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm text-white/90 truncate font-medium">{user.name || user.email}</span>
                    <span className="text-xs text-white/60 truncate">{user.email}</span>
                  </div>
                </div>

                {/* Notifications in mobile menu */}
                <button
                  onClick={() => { setMobileNavOpen(false); setNotifOpen(true); }}
                  className="flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5"
                  type="button"
                >
                  <span>Notifications</span>
                  {unread > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                      {unread}
                    </span>
                  )}
                </button>
              </>
            )}
            <button
              onClick={() => { setMobileNavOpen(false); scrollToHero(); }}
              className="text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5"
              type="button"
            >
              Home
            </button>
            {user && user.role === 'SENIOR' && (
              <button
                onClick={() => { setMobileNavOpen(false); navigate('/dashboard'); }}
                className="text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5"
                type="button"
              >
                Dashboard
              </button>
            )}
            {user && (
              <button
                onClick={() => { setMobileNavOpen(false); navigate('/junior'); }}
                className="text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5"
                type="button"
              >
                My Chats
              </button>
            )}
            {user ? (
              <button
                onClick={() => { setMobileNavOpen(false); navigate('/profile'); }}
                className="text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5"
                type="button"
              >
                Profile
              </button>
            ) : (
              <button
                onClick={() => { setMobileNavOpen(false); navigate('/login'); }}
                className="text-left px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/5"
                type="button"
              >
                Login / Signup
              </button>
            )}
            {user && (
              <button
                onClick={() => { setMobileNavOpen(false); onLogout && onLogout(); }}
                className="text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
                type="button"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
