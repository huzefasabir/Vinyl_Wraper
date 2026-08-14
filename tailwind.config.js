/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b141c',
        surface: '#141c24',
        'surface-container': '#182028',
        'surface-container-high': '#222b33',
        'surface-container-highest': '#2d363e',
        primary: '#38bdf8',
        'primary-container': '#8ed5ff',
        secondary: '#bdc2ff',
        outline: '#87929a',
        'outline-variant': '#3e484f',
        'text-primary': '#dae3ee',
        'text-secondary': '#bdc8d1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '8px',
        modal: '16px',
      }
    },
  },
  plugins: [],
}
