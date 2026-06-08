import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void:    '#060606',
        surface: '#0d0d0d',
        edge:    '#181818',
        gold:    '#f5a623',
        silver:  '#94a3b8',
        bronze:  '#cd7f32',
        muted:   '#383838',
      },
      fontFamily: {
        // These CSS variables are injected by next/font in layout.tsx
        display: ['var(--font-chakra)', 'monospace'],
        body:    ['var(--font-outfit)', 'sans-serif'],
      },
      keyframes: {
        glow: {
          '0%,100%': { boxShadow: '0 0 16px rgba(34,197,94,0.25)' },
          '50%':     { boxShadow: '0 0 32px rgba(34,197,94,0.50)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        glow:   'glow 2s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
