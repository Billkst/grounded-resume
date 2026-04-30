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
        cream: '#FDFCF8',
        warmgray: '#F5F3EE',
        charcoal: '#2D2D2D',
        terracotta: '#C67B5C',
        sage: '#8B9D83',
        amber: '#D4A373',
        softred: '#C97B7B',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        body: ['-apple-system', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
