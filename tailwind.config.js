/** @type {import('tailwindcss').Config} */
// Sistema visual "Cancha", el mismo de ml2-master-game: papel claro, tinta para la
// estructura, naranjo para la acción. Aquí el verde significa GANANCIA y el rojo
// PÉRDIDA, y nada más: una alternativa verde "afirma" algo antes de tiempo.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', 'Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#FAFAF8',
        ink: '#101114',
        'ink-soft': '#3A3D45',
        muted: '#5F6269',
        faint: '#767980',
        surface: '#FFFFFF',
        'surface-2': '#F2F1ED',
        'surface-3': '#E8E7E2',
        line: '#E6E5E0',
        orange: '#FF5A1F', // solo relleno: lleva texto tinta
        'orange-ink': '#C2400F',
        amber: '#F5A524', // solo relleno
        'amber-ink': '#92400E',
        gain: '#0B7A46',
        'gain-dark': '#09693D',
        loss: '#B3272B',
        'loss-dark': '#8E1F22',
        blue: '#2563EB',
      },
      keyframes: {
        slideUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.6)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'slide-up': 'slideUp 0.45s ease-out both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
};
