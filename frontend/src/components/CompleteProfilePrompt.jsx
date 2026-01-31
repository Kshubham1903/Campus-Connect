import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import { displayName, initials } from '../utils/displayName';

export default function CompleteProfilePrompt({ user, onClose, onComplete }) {
  if (!user) return null;
  const name = displayName(user) || 'User';
  // Intentionally do not display the user's role/profileType (e.g., SENIOR/JUNIOR)
  const subtitle = '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-black/70 backdrop-blur backdrop-filter"
      onClick={() => onClose?.({ skipped: true })}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        initial={{ y: 16, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="max-w-3xl w-full rounded-3xl bg-gradient-to-b from-[#0b1220] to-[#0f1724] border border-white/6 shadow-2xl p-6 lg:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-br from-primary to-accent-500">
              <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center text-white text-xl font-semibold">
                {initials(user)}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white">Welcome, {name}!</h3>
                <div className="text-sm text-white/60 mt-1">{subtitle}</div>
              </div>
              <button
                aria-label="Close"
                onClick={() => onClose?.({ skipped: true })}
                className="text-white/60 hover:text-white p-2 rounded-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-4 text-sm text-white/70 max-w-xl">
              A complete profile increases your chances to get helpful responses — add your skills, a short bio, and where you're headed.
            </p>

            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-primary">01</div>
                <div>
                  <div className="text-sm font-semibold text-white">Add skills & tags</div>
                  <div className="text-xs text-white/60">Show what you can do (React, Node, ML)</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-primary">02</div>
                <div>
                  <div className="text-sm font-semibold text-white">Write a brief bio</div>
                  <div className="text-xs text-white/60">Tell seniors what help you need</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-primary">03</div>
                <div>
                  <div className="text-sm font-semibold text-white">Confirm year / role</div>
                  <div className="text-xs text-white/60">Make your profile discoverable</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/5 flex items-center justify-center text-primary">04</div>
                <div>
                  <div className="text-sm font-semibold text-white">Add a photo</div>
                  <div className="text-xs text-white/60">People connect better with a face</div>
                </div>
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-3 justify-end">
              <button
                className="btn btn-ghost text-sm px-4 py-2"
                onClick={() => onClose?.({ skipped: true })}
              >
                Skip for now
              </button>

              <button
                className="btn btn-primary px-5 py-2 text-sm"
                onClick={() => onComplete?.()}
              >
                Complete profile
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
