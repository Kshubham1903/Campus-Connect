// frontend/components/RequestModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import toast from 'react-hot-toast';
import Avatar from './Avatar';
import { displayName, initials } from '../utils/displayName';

export default function RequestModal({ senior = {}, onClose, onSent }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const currentYear = new Date().getFullYear();

  const isStudent = (() => {
    const gy = Number(senior?.graduationYear);
    return !!(gy && !Number.isNaN(gy) && gy >= currentYear);
  })();

  const computedYearOfStudy = (() => {
    const gy = Number(senior?.graduationYear);
    if (!gy || Number.isNaN(gy)) return null;
    const enrollmentYear = gy - 4;
    if (currentYear < enrollmentYear) return null;
    if (currentYear > gy) return null;
    const studyYearNumber = currentYear - enrollmentYear + 1;
    if (studyYearNumber === 1) return 'First Year';
    if (studyYearNumber === 2) return 'Second Year';
    if (studyYearNumber === 3) return 'Third Year';
    if (studyYearNumber === 4) return 'Final Year';
    return null;
  })();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  useEffect(() => {
    // lock background scroll and focus textarea
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    textareaRef.current?.focus();
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  async function sendRequest() {
    const text = (message || '').trim();
    if (!text) {
      toast.error('Please write a short message for the request');
      return;
    }

    setSending(true);
    try {
      await API.post('/requests', {
        toUserId: senior._id,
        message: text,
      });
      toast.success('Request sent');
      onSent?.();
      onClose?.();
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login', { state: { fromRequestFor: senior._id } });
        return;
      }
      console.error('sendRequest err', err);
      toast.error(err.response?.data?.error || 'Failed to send request');
    } finally {
      setSending(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        initial={{ y: 12, opacity: 0, scale: 0.995 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="max-w-3xl w-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0b1220] to-[#0f1724] border border-white/6 shadow-2xl p-4 sm:p-6 lg:p-8 overflow-auto max-h-[95dvh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start">
          <div className="flex-shrink-0 self-center sm:self-auto">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-br from-primary to-accent-500">
              <Avatar user={senior} size={72} />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{displayName(senior)}</h3>
                <div className="text-xs sm:text-sm text-white/60 mt-1">{senior.email || ''}</div>
                {computedYearOfStudy && (
                  <div className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Year: <strong>{computedYearOfStudy}</strong></div>
                )}
              </div>
            </div>

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/70 max-w-2xl text-center sm:text-left">
              {senior.bio || 'No bio available.'}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {senior.branch && <div className="text-xs text-white/60">Domain: <strong className="text-white">{senior.branch}</strong></div>}
              {senior.achievements && <div className="text-xs text-white/60">Achievements: <strong className="text-white">{senior.achievements}</strong></div>}
              {senior.currentCompany && <div className="text-xs text-white/60">Company: <strong className="text-white">{senior.currentCompany}</strong></div>}
              {senior.jobTitle && <div className="text-xs text-white/60">Position: <strong className="text-white">{senior.jobTitle}</strong></div>}
            </div>

            <div className="mt-6">
              <label className="text-sm text-white/90">Write a short message to request help</label>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Hi ${displayName(senior).split(' ')[0] || 'there'}, I need help with ...`}
                className="input w-full h-24 sm:h-28 resize-none mt-2 bg-black/40 placeholder:text-white/50"
                maxLength={500}
                aria-label={`Message to ${displayName(senior)}`}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-end">
              <button
                onClick={onClose}
                className="btn btn-ghost px-4 w-full sm:w-auto"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={sendRequest}
                disabled={!message.trim() || sending}
                className="btn btn-primary px-6 w-full sm:w-auto"
              >
                {sending ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
