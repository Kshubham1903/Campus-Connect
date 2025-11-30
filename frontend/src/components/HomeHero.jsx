// frontend/src/components/HomeHero.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomeHero() {
  const navigate = useNavigate();

  return (
    <section className="w-full">
      <div className="w-full bg-[linear-gradient(180deg,#ffffff,rgba(246,249,255,0.9))] rounded-2xl p-8 lg:p-12 shadow-soft flex flex-col gap-10 items-stretch">

        {/* MAIN HERO CONTENT */}
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">

          {/* LEFT TEXT SIDE */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
              Connect with experienced seniors — <span className="text-primary">get help, fast.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              CampusConnect pairs juniors with seniors from your college for fast doubt resolution,
              project guidance, and mentorship. Request help, get accepted, and chat instantly —
              all inside one elegant platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-gradient-to-br from-primary to-tealSoft text-white shadow-soft-lg hover:opacity-95"
              >
                Explore Seniors
              </button>

              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold border border-gray-200 bg-white hover:bg-gray-50"
              >
                Login / Signup
              </button>
            </div>

            {/* BENEFIT POINTS */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-500">
              <div className="flex items-start gap-3">
                <div className="font-semibold text-slate-700">Fast response</div>
                <div className="text-gray-500">• Connect within minutes</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="font-semibold text-slate-700">Verified seniors</div>
                <div className="text-gray-500">• Hand-picked mentors</div>
              </div>
              <div className="flex items-start gap-3">
                <div className="font-semibold text-slate-700">Safe & private</div>
                <div className="text-gray-500">• Secure chats</div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (Removed Featured Seniors) — simple illustration instead */}
          <div className="hidden lg:flex items-center justify-center w-[400px]">
            <svg width="300" height="200" viewBox="0 0 92 64" fill="none">
              <rect x="2" y="6" width="80" height="44" rx="8" fill="#E9F0FF"/>
              <circle cx="22" cy="28" r="10" fill="#6C8CFF"/>
              <rect x="44" y="18" width="30" height="6" rx="3" fill="#BFDFF8"/>
              <rect x="44" y="30" width="22" height="6" rx="3" fill="#BFDFF8"/>
            </svg>
          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </section>
  );
}
