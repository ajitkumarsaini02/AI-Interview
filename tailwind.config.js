/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          bg: '#050816',
          header: '#0B1020',
          card: '#0D1426',
          elevated: '#111A30',
          track: '#1E293B',
        },
        slateText: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #2563EB, #4F46E5, #7C3AED)',
        'avatar-gradient': 'linear-gradient(to bottom right, #2563EB, #7C3AED)',
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(79, 70, 229, 0.3)',
        'glow-md': '0 0 25px -5px rgba(79, 70, 229, 0.4)',
      },
    },
  },
  plugins: [],
};
