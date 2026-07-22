/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Paleta Souza Scooters: azul da marca + asfalto + âmbar de farol
        primary: { DEFAULT: '#4D5F9C', dark: '#36437A', light: '#E8ECF7' },
        accent: { DEFAULT: '#F2A81D', dark: '#C88A0E', light: '#FDF3DC' },
        ink: { DEFAULT: '#151823', soft: '#1E2231', line: '#2D3348' },
        surface: '#FFFFFF',
        bg: '#F4F6FB',
        text: '#12141C',
        muted: '#5F6577',
        border: '#E2E6F0',
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 20, 28, 0.06), 0 4px 14px rgba(18, 20, 28, 0.05)',
        lift: '0 14px 32px -10px rgba(21, 24, 35, 0.28)',
        glow: '0 8px 24px -6px rgba(77, 95, 156, 0.45)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s ease-out both',
      },
    },
  },
  plugins: [],
}
