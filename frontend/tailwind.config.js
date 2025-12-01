/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // new premium palette: deep violet ↔ coral accent
        primary: {
          50: '#f6f3ff',
          100: '#efe6ff',
          200: '#e0ccff',
          300: '#caa6ff',
          400: '#b27cff',
          DEFAULT: '#7C3AED', // vivid violet
          600: '#6B2AE0',
          700: '#571CBC',
          800: '#3e0f84',
          900: '#22064a'
        },
        // complementary teal for soft accents (used sparingly)
        tealSoft: '#7EE8D4',
        // warm coral accent for highlights / CTA secondary color
        accent: {
          400: '#FF9F7A',
          500: '#FF6B6B'
        },
        coral: '#ffb199',
        slateSoft: '#eef2f6',
        muted: '#6b7280'
      },
      borderRadius: {
        'xl': '12px'
      },
      boxShadow: {
        'soft-lg': '0 12px 30px rgba(17,24,39,0.07)',
        'soft': '0 6px 20px rgba(17,24,39,0.06)'
      }
    }
  },
  plugins: []
};
