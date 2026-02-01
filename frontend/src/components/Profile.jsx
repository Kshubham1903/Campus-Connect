import React, { useEffect, useState } from 'react';
import API from '../api';
import StudentProfile from './StudentProfile';
import AlumniProfile from './AlumniProfile';
import { motion } from 'framer-motion';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      try {
        const res = await API.get('/auth/me');
        if (!mounted) return;
        setUser(res.data.user || null);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          if (typeof window !== 'undefined') window.location.href = '/login';
          return;
        }
        console.error('fetch profile err', err);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loadingProfile) return <div className="card max-w-md">Loading profile…</div>;
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  const currentYear = new Date().getFullYear();
  const gy = Number(user.graduationYear);

  // Determine whether to render the StudentProfile or AlumniProfile.
  // Priority: explicit `profileType` -> `role` mapping -> fallback to graduationYear heuristic.
  let isStudent = false;
  if (user?.profileType) {
    isStudent = String(user.profileType).toUpperCase() === 'STUDENT';
  } else if (user?.role) {
    const r = String(user.role).toUpperCase();
    isStudent = r === 'JUNIOR' || r === 'STUDENT';
  } else {
    isStudent = !!(gy && !Number.isNaN(gy) && gy >= currentYear);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="py-4 sm:py-6 px-2 sm:px-0"
    >
      {isStudent ? (
        <StudentProfile user={user} refreshUser={setUser} />
      ) : (
        <AlumniProfile user={user} refreshUser={setUser} />
      )}
    </motion.div>
  );
}
