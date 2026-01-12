/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['"DotGothic16"', 'sans-serif'],
      },
      colors: {
        'retro-bg': '#2c2c2c',
        'retro-text': '#e0e0e0',
        'retro-accent': '#fca311',
      }
    },
  },
  plugins: [],
}
