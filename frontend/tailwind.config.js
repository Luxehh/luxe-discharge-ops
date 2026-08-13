/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Remapped to referral.luxehh.com / Luxe brand (layout unchanged)
        navy: {
          DEFAULT: '#6e6847',
          dark: '#5a5539',
          light: '#8a845f',
        },
        gold: {
          DEFAULT: '#6e6847',
          dark: '#5a5539',
          light: '#8a845f',
        },
        cream: {
          DEFAULT: '#ffffff',
          light: '#faf9f6',
          soft: '#ede6d9',
        },
        luxe: {
          olive: '#6e6847',
          'olive-dark': '#5a5539',
          beige: '#f2ede4',
          gray: '#8e949a',
          btn: '#706c4f',
          text: '#333333',
          muted: '#666666',
          footer: '#f8f8f8',
          page: '#f5f4f1',
          border: '#e5e1d8',
        },
      },
      fontFamily: {
        sans: [
          'DM Sans',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Playfair Display',
          'Georgia',
          'Times New Roman',
          'serif',
        ],
      },
      boxShadow: {
        'luxe-card': '0 8px 30px rgba(0, 0, 0, 0.18)',
      },
    },
  },
  plugins: [],
}
