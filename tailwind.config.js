/** @type {import('tailwindcss').Config} */
// ponytail: v4 ignores content (auto-scanned) and plugins (loaded via @plugin in CSS)

const colors = require('tailwindcss/colors');

module.exports = {
  theme: {
    extend: {
      colors: {
        success: colors.green,
        primary: colors.blue,
        danger: colors.red,
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
