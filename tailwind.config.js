/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'acid-yellow': '#F5F500',
        'hot-pink': '#FF2D78',
        'electric-blue': '#0066FF',
        'lime-green': '#39FF14',
        'brutal-orange': '#FF5F1F',
        'brutal-purple': '#9000FF',
        'off-white': '#FAFAF5',
        'brutal-black': '#0A0A0A',
      },
      fontFamily: {
        brutal: ['Archivo Black', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        brutal: '6px 6px 0px #000',
        'brutal-sm': '4px 4px 0px #000',
        'brutal-lg': '8px 8px 0px #000',
        'brutal-pressed': '2px 2px 0px #000',
        'brutal-yellow': '6px 6px 0px #F5F500',
        'brutal-pink': '6px 6px 0px #FF2D78',
      },
      borderWidth: {
        3: '3px',
        5: '5px',
      },
    },
  },
  plugins: [
    // Hide scrollbar utility (.no-scrollbar) — keeps scroll, hides the bar
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom, 0px)',
        },
      });
    },
  ],
};
