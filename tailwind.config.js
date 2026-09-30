/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A2B4F',
          50: '#F2F6FA',
          100: '#E1EAF3',
          200: '#C3D4E7',
          700: '#12335A',
          800: '#0E2C50',
          900: '#0A2B4F',
          950: '#071D36',
        },
        royal: '#1B3764',
        sky: {
          100: '#E1EEF8',
          200: '#C2DCEF',
          300: '#A9CFEA',
          400: '#8ABAE0',
        },
        gold: {
          DEFAULT: '#FFBB00',
          light: '#FFCA42',
          /** Same institutional gold, tuned to read on white like #FFBB00 does on navy */
          rich: '#E1A500',
          deep: '#B98400',
        },
        ink: '#212529',
        muted: '#495057',
        faint: '#6C757D',
        line: '#E5E7EB',
        page: '#F5F7F9',
      },
      fontFamily: {
        sans: [
          'Inter',
          'Manrope',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 43, 79, 0.06), 0 1px 3px rgba(10, 43, 79, 0.05)',
        lift: '0 6px 16px -6px rgba(10, 43, 79, 0.18), 0 2px 5px rgba(10, 43, 79, 0.06)',
        overlay: '0 24px 60px -24px rgba(7, 29, 54, 0.55), 0 8px 24px -12px rgba(7, 29, 54, 0.4)',
      },
      maxWidth: {
        portal: '80rem',
      },
    },
  },
  plugins: [],
}
