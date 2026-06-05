/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta Souza Scooters: azul #4D5F9C + branco + azul claro + preto
        primary: { DEFAULT: '#4D5F9C', dark: '#36437A', light: '#E8ECF7' },
        surface: '#FFFFFF',
        bg: '#F5F7FC',
        text: '#0D0D0F',
        muted: '#6B7280',
        border: '#E2E6F0',
      },
    },
  },
  plugins: [],
}
