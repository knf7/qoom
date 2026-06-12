/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#e4e4e7',
        card: 'rgba(255,255,255,0.03)',
        'card-foreground': '#e4e4e7',
        primary: '#06b6d4',
        'primary-foreground': '#000000',
        muted: '#18181b',
        'muted-foreground': '#a1a1aa',
        border: 'rgba(255,255,255,0.08)',
        destructive: '#f43f5e',
        warning: '#f59e0b',
        success: '#10b981',
        // Semantic color extensions
        purple: {
          50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe',
          400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce',
          800: '#6b21a8', 900: '#581c87', 950: '#3b0764',
        },
        // Semantic color extensions
        cyan: {
          50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
          400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490',
          800: '#155e75', 900: '#164e63', 950: '#083344',
        },
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b', 950: '#022c22',
        },
        rose: {
          50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337', 950: '#4c0519',
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
        zinc: {
          50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
          400: '#a1a1aa', 500: '#71717a', 600: '#52525b', 700: '#3f3f46',
          800: '#27272a', 900: '#18181b', 950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'Inter', 'sans-serif'],
        display: ['Cairo', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 30px rgba(6, 182, 212, 0.12)',
        'neon-emerald': '0 0 30px rgba(16, 185, 129, 0.12)',
        'neon-rose': '0 0 30px rgba(244, 63, 94, 0.12)',
        'neon-purple': '0 0 30px rgba(168, 85, 247, 0.12)',
        'neon-amber': '0 0 30px rgba(245, 158, 11, 0.12)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'premium': '24px',
      },
      animation: {
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'gradient': 'gradient-x 8s ease infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
