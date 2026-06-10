/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#e1b368',
        cream: '#ffebcb',
        ink: '#000000',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(225, 179, 104, 0.35)',
      },
    },
  },
  plugins: [],
};
