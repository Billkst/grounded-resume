import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0A0F',
          card: '#111118',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      animation: {
        'drift-1': 'drift-1 20s ease-in-out infinite',
        'drift-2': 'drift-2 25s ease-in-out infinite',
        'drift-3': 'drift-3 18s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 8s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
