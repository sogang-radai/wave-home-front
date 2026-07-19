/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        display: ['"TAN New York"', 'cursive'],
        geist: ['"Geist"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'plex-kr': ['"IBM Plex Sans KR"', 'sans-serif'],
        'sf-pro': ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      // WaveHome landing page palette (dark cinematic surface). Plain hex/rgba
      // values on purpose, not CSS custom properties, so they can't collide
      // with the dashboard's own --wave/--ink/etc. variables in App.css.
      colors: {
        background: '#05070a',
        wave: {
          DEFAULT: '#95d9f8',
          light: '#cdedfc',
          soft: 'rgba(149, 217, 248, 0.14)',
          deep: '#4fb3e6',
          deepest: '#0e4862',
        },
        ink: '#f3f7fa',
        mist: '#93a2b3',
        surface: {
          DEFAULT: '#0b0f14',
          raised: '#10161d',
        },
        border: 'rgba(149, 217, 248, 0.12)',
      },
    },
  },
  plugins: [],
};
