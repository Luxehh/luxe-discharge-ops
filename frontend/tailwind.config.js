/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e2a4a',
          dark: '#162038',
          light: '#2a3a5c',
        },
        gold: {
          DEFAULT: '#B8860B',
          dark: '#7A5A0B',
          light: '#d4a017',
        },
        cream: {
          DEFAULT: '#f5f0e8',
          light: '#faf7f2',
          soft: '#EFE6D0',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
