// frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Bell } from 'lucide-react';
import { setAuthToken } from '../api';

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

  function handleLogout() {
    setAuthToken(null);
    if (typeof onLogout === 'function') onLogout();
    window.location.href = '/login';
  }

  return (
    <header className="w-full bg-white/70 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="mx-auto max-w-[var(--max-w)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={()=>navigate('/')} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary to-tealSoft text-white flex items-center justify-center font-bold shadow-soft">CC</div>
            <div className="hidden sm:block">
              <div className="text-lg font-semibold leading-none">CampusConnect</div>
              <div className="text-xs text-muted">Connect — Learn — Grow</div>
            </div>
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <button onClick={()=>navigate('/')} className="hover:text-primary">Home</button>
          {user && <button onClick={()=>navigate('/dashboard')} className="hover:text-primary">Dashboard</button>}
          {user && <button onClick={()=>navigate('/junior')} className="hover:text-primary">My Chats</button>}
        </nav>

        <div className="flex items-center gap-3">
          <button title="Notifications" className="p-2 rounded-md hover:bg-gray-50">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative" ref={ref}>
            <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-3 border rounded-xl px-3 py-1 hover:shadow-sm">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                {user?.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'G'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium">{user?.name || 'Guest'}</div>
                <div className="text-xs text-muted">{user?.email || ''}</div>
              </div>
              <Menu className="w-4 h-4 text-gray-500" />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft p-2 z-50">
                {user ? (
                  <>
                    <button onClick={()=>{ navigate('/profile'); setOpen(false); }} className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <div className="border-t my-1" />
                    <button onClick={handleLogout} className="w-full text-left px-2 py-2 rounded hover:bg-gray-50 flex items-center gap-2 text-red-600">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                ) : (
                  <button onClick={()=>{ navigate('/login'); setOpen(false); }} className="w-full text-left px-2 py-2 rounded hover:bg-gray-50">Login / Signup</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
