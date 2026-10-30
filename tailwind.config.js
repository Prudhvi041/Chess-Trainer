/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        board: {
          light: '#EEDCB8',
          dark: '#A97A52',
          frame: '#2B2018',
          frameDark: '#16120F',
        },
        gold: {
          50: '#FBF6E7',
          100: '#F4E8C1',
          200: '#EAD48D',
          300: '#DFBE5B',
          400: '#D4AA3A',
          500: '#BE912A',
          600: '#9A7121',
          700: '#74541D',
        },
        ink: {
          50: '#F7F5F2',
          100: '#EDE9E3',
          200: '#D9D3CA',
          300: '#B5ADA1',
          400: '#8A8276',
          500: '#655E54',
          600: '#4A443C',
          700: '#2F2B26',
          800: '#1C1A17',
          900: '#121110',
          950: '#0B0A09',
        },
      },
      boxShadow: {
        board: '0 30px 60px -20px rgba(20, 12, 4, 0.55), 0 12px 24px -12px rgba(20, 12, 4, 0.45)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -12px rgba(0,0,0,0.25)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        bump: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.4)', opacity: '0.9' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        glow: {
          '0%, 100%': { boxShadow: 'inset 0 0 0 3px rgba(52, 211, 153, 0.95)' },
          '50%': { boxShadow: 'inset 0 0 0 6px rgba(52, 211, 153, 0.55)' },
        },
        drain: {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'board-turn': {
          '0%': { opacity: '0.2', transform: 'rotate(-8deg) scale(0.92)' },
          '100%': { opacity: '1', transform: 'rotate(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        pop: 'pop 320ms cubic-bezier(.2,.9,.3,1.2) both',
        bump: 'bump 300ms ease-out',
        shake: 'shake 380ms ease-in-out',
        ripple: 'ripple 520ms ease-out forwards',
        glow: 'glow 900ms ease-in-out infinite',
        'fade-in': 'fade-in 200ms ease-out both',
        'scale-in': 'scale-in 260ms cubic-bezier(.2,.9,.3,1) both',
        'slide-down': 'slide-down 260ms cubic-bezier(.2,.9,.3,1) both',
        'board-turn': 'board-turn 520ms cubic-bezier(.2,.9,.3,1) both',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
};
