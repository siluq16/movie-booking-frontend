/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#C9A84C', light: '#E8C97A', dark: '#8B6914' },
        cinema: {
          deep: '#0A0A0C', dark: '#111115',
          card: '#18181E', card2: '#1E1E26',
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", 'serif'],
        sans: ["'DM Sans'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
