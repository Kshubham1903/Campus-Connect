// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";
import API, { getSavedToken } from '../api';
import { io } from 'socket.io-client';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      try {
        const res = await API.get('/notifications');
        if (!mounted) return;
        setNotifications(res.data.notifications || []);
      } catch (e) {
        // ignore
      }
    }
    load();

    if (!user) return () => { mounted = false; };
    const token = getSavedToken();
    if (!token) return () => { mounted = false; };
    const s = io('http://localhost:5000', { auth: { token } });
    socketRef.current = s;
    s.on('notification', (n) => {
      setNotifications(prev => [n, ...prev]);
    });

    return () => {
      mounted = false;
      try { s.disconnect(); } catch (_) {}
    };
  }, [user]);

  function scrollToHero() {
    const doScroll = () => {
      const hero = document.getElementById("home-hero-section");
      if (hero) {
        const headerHeight = document.querySelector('header')?.offsetHeight || 80;
        const top = hero.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    if (window.location.pathname === "/") {
      doScroll();
      return;
    }

    navigate("/");
    setTimeout(doScroll, 160);
  }

  return (
    <header className="
      w-full 
      sticky top-0 z-50 
      bg-black/80
      border-b border-white/6
    ">
      <div className="
        mx-auto 
        max-w-[1600px] 
        px-6 md:px-10 lg:px-16 xl:px-24 
        h-16 
        surface
        flex items-center justify-between
      ">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: .98 }} className="
            w-11 h-11 
            rounded-xl 
            bg-gradient-to-br from-primary to-accent-500 
            flex items-center justify-center 
            text-white text-lg font-semibold neon-pulse
          ">
            CC
          </motion.div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-white/95">CampusConnect</div>
            <div className="text-xs text-white/70">Connect — Learn — Grow</div>
          </div>
        </Link>

        {/* Middle links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700 dark:text-slate-300">
          <button onClick={scrollToHero} className="text-white/90 hover:text-primary transition">Home</button>

          {user && user.role === "SENIOR" && (
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

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl border btn-neon text-white/95 hover:opacity-95 text-sm font-medium"
            >
              Login
            </button>
          )}

          {user && (
            <div className="relative">
              {/* profile + bell section */}
              <div className="flex items-center gap-3 mr-2">
                <button
                  className="flex items-center gap-3 px-4 py-2 rounded-xl border surface hover:bg-primary/10"
                  onClick={() => setMenuOpen(o => !o)}
                >
                  <div className="
                    w-9 h-9 
                    rounded-full 
                    bg-gradient-to-br from-primary/30 to-accent-500/12 flex items-center justify-center 
                    text-sm font-medium text-white/80
                  ">
                    {user.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <div className="text-sm text-white/85 hidden sm:block truncate" style={{ maxWidth: 160 }}>
                    {user.name || user.email}
                  </div>
                </button>

                {/* Notification bell */}
                <div className="relative">
                  <button onClick={() => setNotifOpen(o => !o)} className="p-2 rounded-full hover:bg-white/5">
                    <div className="relative">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-white/90"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18.6 14.6V11a6 6 0 1 0-12 0v3.6c0 .538-.214 1.055-.595 1.414L4 17h11z"/></svg>
                      {unread > 0 && (<span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs bg-rose-500 text-white rounded-full">{unread}</span>)}
                    </div>
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full translate-y-2 w-[320px] rounded-xl shadow-lg border p-3 z-50 modal card-pop bg-black/60 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold">Notifications</div>
                        <div className="text-xs text-white/60">{unread > 0 ? `${unread} unread` : 'All read'}</div>
                      </div>
                      <div className="max-h-64 overflow-auto pr-2 space-y-2">
                        {notifications.length === 0 && <div className="text-sm text-white/60">No notifications yet</div>}
                        {notifications.map(n => (
                          <div key={n._id} className={`p-2 rounded-lg ${n.read ? 'bg-white/3' : 'bg-white/5 border border-white/6'} cursor-pointer`} onClick={async () => {
                            if (!n.read) {
                              try { await API.patch(`/notifications/${n._id}/read`); } catch (e) { /* noop */ }
                              setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x));
                            }
                            if (n.meta?.chatId) navigate(`/chat/${n.meta.chatId}`);
                            if (n.meta?.requestId) navigate('/requests');
                          }}>
                            <div className="text-sm font-medium text-white/95 leading-tight">{n.message}</div>
                            <div className="text-xs text-white/60 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* dropdown menu */}
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="
                  absolute right-0 top-full translate-y-2 mt-0 w-48 
                  rounded-xl shadow-lg border 
                  p-2 z-50 modal card-pop
                " style={{ transformOrigin: 'right top' }}>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-primary/10"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); onLogout && onLogout(); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
