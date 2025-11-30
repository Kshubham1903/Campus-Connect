/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // primary palette
        primary: {
          50: '#f4f7ff',
          100: '#e9eefc',
          200: '#cdd9fb',
          300: '#aebef9',
          400: '#90a4f7',
          DEFAULT: '#6C8CFF', // use as bg-primary
          600: '#5A74EE',
          700: '#415FD6',
          800: '#2F4AA8',
          900: '#22367A'
        },
        tealSoft: '#8bd3c7',
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
