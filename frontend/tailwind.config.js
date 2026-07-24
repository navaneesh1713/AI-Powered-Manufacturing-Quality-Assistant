/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          Accent: '#3b82f6',
          Emerald: '#10b981',
          Amber: '#f59e0b',
          Rose: '#f43f5e'
        }
      }
    },
  },
  plugins: [],
}
