/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#121212',
          navy: '#1a1a1a',
          primary: '#A5CD39',
          'primary-light': '#b8d85e',
          secondary: '#6d7d42',
          tertiary: '#f5a0ff',
          muted: '#6b6b6b',
          surface: '#f5f5f5',
          border: '#e0e0e0',
          gray: '#3d3d3b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
