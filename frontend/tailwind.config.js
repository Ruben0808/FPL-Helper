/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fpl: {
          purple: '#37003c',
          green: '#00ff87',
          'light-purple': '#963cff',
          pink: '#ff2882',
          'dark-bg': '#1a0020',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
