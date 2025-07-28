/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
      },
      colors: {
        // UI-TARS refined neutral palette
        gray: {
          50: '#f9fafb',   100: '#f3f4f6',   200: '#e5e7eb',
          300: '#d1d5db',  400: '#9ca3af',   500: '#6b7280',
          600: '#4b5563',  700: '#374151',   800: '#1f2937',
          900: '#111827',  950: '#0b0f1a'
        },
        // Primary color (elegant slate blue)
        primary: {
          50: '#f8fafc',   100: '#f1f5f9',   200: '#e2e8f0',
          300: '#cbd5e1',  400: '#94a3b8',   500: '#64748b',
          600: '#475569',  700: '#334155',   800: '#1e293b',
          900: '#0f172a',  950: '#020617'
        },
        // Accent color (refined indigo tones)
        accent: {
          50: '#eef2ff',   100: '#e0e7ff',   200: '#c7d2fe',
          300: '#a5b4fc',  400: '#818cf8',   500: '#6366f1',
          600: '#4f46e5',  700: '#4338ca',   800: '#3730a3',
          900: '#312e81',  950: '#1e1b4b'
        },
      },
      keyframes: {
        'thinking': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        'border-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'thinking': 'thinking 1.4s ease-in-out infinite both',
        'border-flow': 'border-flow 4s infinite linear',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};