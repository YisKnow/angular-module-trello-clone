/** @type {import('tailwindcss').Config} */
// ponytail: v4 ignores content (auto-scanned) and plugins (loaded via @plugin in CSS)
// ponytail: minimalist-ui pastel palette — desaturated, warm monochrome, no bright blues

module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F2FE',
          100: '#E1F3FE',
          200: '#C5E4F7',
          300: '#A8D5F2',
          400: '#7CBFE8',
          500: '#4EA5DC',
          600: '#2F6C9F',
          700: '#1F6C9F',
          800: '#1A5A85',
          900: '#0F3C5E',
        },
        success: {
          50: '#F0F6F0',
          100: '#EDF3EC',
          200: '#CDE0CD',
          300: '#AAC8AA',
          400: '#87B187',
          500: '#689868',
          600: '#4C804C',
          700: '#346538',
          800: '#2A522C',
          900: '#1A3A1C',
        },
        danger: {
          50: '#FEF0F0',
          100: '#FDEBEC',
          200: '#FACDCE',
          300: '#F5ACAE',
          400: '#EF878A',
          500: '#E86468',
          600: '#D6454A',
          700: '#9F2F2D',
          800: '#822322',
          900: '#661919',
        },
        warning: {
          50: '#FFF9E8',
          100: '#FBF3DB',
          200: '#F5E8B8',
          300: '#EFDA91',
          400: '#E7CA6B',
          500: '#DEBA45',
          600: '#B89638',
          700: '#956400',
          800: '#7A5000',
          900: '#5E3D00',
        },
        info: {
          50: '#E8F4FE',
          100: '#DCF0FA',
          200: '#B8E0F5',
          300: '#8FCCEC',
          400: '#66B8E0',
          500: '#3DA4D4',
          600: '#2F84B0',
          700: '#1F6C9F',
          800: '#1A5580',
          900: '#0F3C5E',
        },
      },
      container: {
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1024px',
          '2xl': '1536px',
        },
      }
    },
  },
}
