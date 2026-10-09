/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FDFDFC',
          100: '#F9F8F5',
          200: '#F2EFE9',
          300: '#E6E1D6',
          400: '#D5CDBF',
        },
        forest: {
          900: '#112217',
          800: '#183323',
          700: '#224732',
          600: '#2E5F43',
          500: '#3D7D59',
          100: '#E7EFEA',
          50: '#F3F7F4',
        },
        canopy: {
          emerald: '#2D6A4F',
          moss: '#52796F',
          sage: '#84A98C',
          leaf: '#A8C39E',
          mist: '#CAD2C5',
        },
        sunlit: {
          ochre: '#C88D2B',
          amber: '#E09F3E',
          sand: '#EED971',
          glare: '#F7E7B4',
        },
        stone: {
          charcoal: '#1A1E1C',
          slate: '#363E3A',
          muted: '#626B66',
          border: '#D9D5CC',
        }
      },
      fontFamily: {
        serif: ['Charter', 'Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      screens: {
        xs: '375px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
