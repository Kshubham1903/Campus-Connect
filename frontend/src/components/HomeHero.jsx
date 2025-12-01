// frontend/src/components/HomeHero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function HomeHero() {
  const navigate = useNavigate();

  function goToSeniors() {
    // if seniors section exists on the page, smooth-scroll to it
    const el = document.getElementById('seniors-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    // otherwise navigate to home which contains the seniors list
    navigate('/');
    // small timeout to allow route to render, then scroll if available
    setTimeout(() => {
      const el2 = document.getElementById('seniors-section');
      if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  }

  return (
    <section className="w-full">
      <div className="w-full card rounded-2xl p-8 lg:p-12 shadow-soft flex flex-col gap-10 items-stretch">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <motion.h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white/95"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
            >
              Connect with experienced seniors — <span className="text-primary neon">get help, fast.</span>
            </motion.h1>

            <p className="mt-4 max-w-2xl text-lg text-white/80">
              CampusConnect pairs juniors with seniors from your college for fast doubt resolution,
              project guidance, and mentorship. Request help, get accepted, and chat instantly —
              all inside one elegant platform.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                onClick={goToSeniors}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-gradient-to-br from-primary to-accent-500 text-white shadow-soft-lg hover:opacity-95 btn-neon"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Seniors
              </motion.button>

              <motion.button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold border border-transparent bg-transparent hover:bg-primary/10 text-sm text-white/80 btn-ghost"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                Login / Signup
              </motion.button>
            </div>

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

      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </section>
  );
}
