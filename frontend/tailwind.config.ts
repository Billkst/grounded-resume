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
        ink: '#11100E',
        paper: '#F4EFE3',
        bone: '#DDD2BE',
        graphite: '#2A2925',
        blueprint: '#1D4E5F',
        'oxidized-cyan': '#2D9CA8',
        brass: '#B8893B',
        'verdict-red': '#C93A2F',
        'evidence-green': '#4F7E55',
        'warning-amber': '#D69A2D',
      },
      fontFamily: {
        display: ['"Newsreader"', '"Noto Serif SC"', 'serif'],
        interface: ['"IBM Plex Sans Condensed"', '-apple-system', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        serif: ['"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
