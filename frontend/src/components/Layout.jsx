// frontend/src/components/Layout.jsx
import React from 'react';

export default function Layout({ children }) {
  return (
    // Let the global body background show — keep layout container transparent
    <div className="min-h-screen bg-transparent">
      {/* Full-width container with LESS side padding */}
      <main className="w-full px-6 md:px-10 lg:px-16 xl:px-24 py-10">
        <div className="mx-auto max-w-[1600px] space-y-10">
          {children}
        </div>
      </main>
    </div>
  );
}
