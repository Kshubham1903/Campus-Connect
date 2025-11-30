// frontend/src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="
      w-full 
      bg-white 
      border-b border-gray-100 
      sticky top-0 z-50 
      backdrop-blur-sm
    ">
      {/* WIDTH & ALIGNMENT FIXED */}
      <div className="
        mx-auto 
        max-w-[1600px] 
        px-6 md:px-10 lg:px-16 xl:px-24 
        h-20 
        flex items-center justify-between
      ">
        
        {/* LEFT LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <div className="
            w-11 h-11 
            rounded-xl 
            bg-gradient-to-br from-primary to-tealSoft 
            flex items-center justify-center 
            text-white text-lg font-semibold
          ">
            CC
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-slate-800">CampusConnect</div>
            <div className="text-xs text-gray-500">Connect — Learn — Grow</div>
          </div>
        </Link>

        {/* MIDDLE LINKS */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className="text-slate-700 hover:text-primary transition">Home</Link>

          {user && user.role === "SENIOR" && (
            <Link to="/dashboard" className="text-slate-700 hover:text-primary transition">
              Dashboard
            </Link>
          )}

          {user && (
            <Link to="/mychats" className="text-slate-700 hover:text-primary transition">
              My Chats
            </Link>
          )}
        </nav>

        {/* RIGHT SIDE USER SECTION */}
        <div className="flex items-center gap-4">

          {/* If NOT logged in */}
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm font-medium"
            >
              Login
            </button>
          )}

          {/* If logged in */}
          {user && (
            <div className="relative">
              <button
                className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <div className="
                  w-9 h-9 
                  rounded-full 
                  bg-slate-200 
                  flex items-center justify-center 
                  text-sm font-medium text-slate-600
                ">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="text-sm text-slate-700">{user.email}</div>
              </button>

              {/* DROPDOWN */}
              {menuOpen && (
                <div className="
                  absolute right-0 mt-2 w-44 
                  bg-white rounded-xl shadow-lg border 
                  p-2 z-50
                ">
                  <button
                    onClick={onLogout}
                    className="
                      w-full text-left px-3 py-2 
                      rounded-lg text-sm text-red-500 
                      hover:bg-red-50
                    "
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
