// frontend/src/components/Layout.jsx
import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfdff,#f5f7fb)]">
      <main className="mx-auto max-w-[var(--max-w)] px-4 py-10">
        <div className="space-y-10">
          {children}
        </div>
      </main>

      <footer className="w-full border-t border-gray-100 mt-12">
        <div className="mx-auto max-w-[var(--max-w)] px-4 py-6 text-sm text-gray-500">
          © {new Date().getFullYear()} CampusConnect — Built with care
        </div>
      </footer>
    </div>
  );
}
