/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#1E2A38',
        'off-white': '#F8F9FA',
        'teal': '#008080',
        'gold': '#7F6200',
        'charcoal': '#4A4A4A',
      }
    },
  },
  plugins: [],
} 