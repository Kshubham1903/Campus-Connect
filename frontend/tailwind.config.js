/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6c8cff',
        tealSoft: '#8bd3c7',
        warm: '#f7b267',
        muted: '#6b7280'
      },
      borderRadius: {
        lg: '12px'
      },
      boxShadow: {
        soft: '0 6px 20px rgba(17,24,39,0.06)'
      }
    }
  },
  plugins: []
};
