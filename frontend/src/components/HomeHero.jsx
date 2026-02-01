import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function HomeHero() {
  const navigate = useNavigate();

  // Try to scroll to #seniors-section. If not present, navigate to home
  // and poll for the element for up to ~1s.
  function goToSeniors() {
    const scrollIfAvailable = () => {
      const el = document.getElementById('seniors-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    if (scrollIfAvailable()) return;

    // Not on the page — go to root and poll for the element
    navigate('/');

    let tries = 0;
    const maxTries = 10;
    const interval = 100;
    const handle = setInterval(() => {
      tries += 1;
      if (scrollIfAvailable() || tries >= maxTries) {
        clearInterval(handle);
      }
    }, interval);
  }

  return (
    <section id="home-hero-section" className="w-full">
      <div className="w-full card rounded-2xl p-4 sm:p-6 lg:p-12 shadow-soft flex flex-col gap-6 sm:gap-8 lg:gap-10 items-stretch">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 items-center justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <motion.h1
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white/95"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
            >
              Connect with experienced seniors —{' '}
              <span className="text-primary neon">get help, fast.</span>
            </motion.h1>

            <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base lg:text-lg text-white/80">
              CampusConnect pairs juniors with seniors from your college for fast doubt resolution,
              project guidance, and mentorship. Request help, get accepted, and chat instantly —
              all inside one elegant platform.
            </p>

            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
              <motion.button
                onClick={goToSeniors}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold btn-neon w-full sm:w-auto"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                aria-label="Explore seniors"
              >
                Explore Seniors
              </motion.button>

              <motion.button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold border border-transparent bg-transparent hover:bg-primary/10 text-sm text-white/80 btn-ghost w-full sm:w-auto"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                aria-label="Login or Signup"
              >
                Login / Signup
              </motion.button>
            </div>

            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-slate-500">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="font-semibold text-slate-200">Fast response</div>
                <div className="text-gray-400">- Connect within minutes</div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="font-semibold text-slate-200">Verified seniors</div>
                <div className="text-gray-400">- Hand-picked mentors</div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="font-semibold text-slate-200">Safe & private</div>
                <div className="text-gray-400">- Secure chats</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center w-[400px]" aria-hidden="true">
            <svg width="300" height="200" viewBox="0 0 92 64" fill="none" role="img" focusable="false">
              <rect x="2" y="6" width="80" height="44" rx="8" fill="#E9F0FF" />
              <circle cx="22" cy="28" r="10" fill="#6C8CFF" />
              <rect x="44" y="18" width="30" height="6" rx="3" fill="#BFDFF8" />
              <rect x="44" y="30" width="22" height="6" rx="3" fill="#BFDFF8" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </section>
  );
}
