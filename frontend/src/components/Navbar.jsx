// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { getSavedToken, setAuthToken } from '../api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function goHome() { navigate('/'); }
  function goDashboard() { navigate('/dashboard'); }
  function goMyChats() { navigate('/junior'); }
  function handleLogout() {
    setAuthToken(null);
    if (onLogout) onLogout();
    navigate('/login');
  }

  return (
    <header className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={goHome} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-tealSoft text-white flex items-center justify-center font-semibold shadow-soft">CC</div>
            <div className="hidden sm:block">
              <div className="text-lg font-semibold leading-none">CampusConnect</div>
              <div className="text-xs text-gray-500">Connect — Learn — Grow</div>
            </div>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-3">
          <button onClick={()=>navigate('/')} className="px-3 py-1 rounded-md text-sm hover:bg-gray-50">Home</button>
          <button onClick={goDashboard} className="px-3 py-1 rounded-md text-sm hover:bg-gray-50">Dashboard</button>
          <button onClick={goMyChats} className="px-3 py-1 rounded-md text-sm hover:bg-gray-50">My Chats</button>
        </nav>

        <div className="flex items-center gap-3">
          <button title="Notifications" className="p-2 rounded-md hover:bg-gray-50">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative" ref={ref}>
            <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 border rounded-lg px-3 py-1 hover:shadow-sm">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                {user?.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium">{user?.name || 'Account'}</div>
                <div className="text-xs text-gray-500">{user?.email || ''}</div>
              </div>
              <Menu className="w-4 h-4 text-gray-500" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-soft border p-2 z-50">
                <button onClick={()=>{ navigate('/profile'); setOpen(false); }} className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={()=>{ navigate('/settings'); setOpen(false); }} className="w-full text-left px-2 py-2 rounded hover:bg-gray-50">Settings</button>
                <div className="border-t my-1" />
                <button onClick={handleLogout} className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2 text-red-600">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* small-screen menu */}
        <div className="md:hidden">
          <button onClick={()=>navigate('/')} className="p-2 rounded-md"><Menu className="w-6 h-6" /></button>
        </div>
      </div>
    </header>
  );
}
