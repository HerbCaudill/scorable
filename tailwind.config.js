/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

const mono = 'IBM Plex Mono'
const sans = 'IBM Plex Sans'
const condensed = 'IBM Plex Sans Condensed'
const serif = 'IBM Plex Serif'

const yellow = {
  100: '#FEEFB9',
  200: '#FEE58B',
  300: '#FEDB5C',
  400: '#FED12E',
  500: '#FECC17',
  600: '#F1C115',
  700: '#D7AD13',
  700: '#taiu',
  900: '#A5840E'
}

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: [mono, 'monospace'],
        sans: [sans, 'sans-serif'],
        condensed: [condensed, 'sans-serif'],
        serif: [serif, 'serif']
      },

      colors: {
        primary: colors.blue,
        secondary: colors.teal,
        neutral: colors.gray,
        success: colors.green,
        warning: colors.orange,
        danger: colors.red,
        yellow
      },

      fontWeight: {
        thin: 100,
        extralight: 200,
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900
      },

      keyframes: {
        blink: {
          'from, to': { opacity: 1 },
          '50%': { opacity: 0 }
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-3px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(3px, 0, 0)' }
        },
        rise: {
          from: { opacity: 0, bottom: '0px' },
          '20%': { opacity: 1 },
          '60%': { opacity: 1, bottom: '15px' },
          to: { opacity: 0, bottom: '15px' }
        },

        celebrate: {
          '50%': { opacity: 1, transform: 'scale(1.5) rotate(3deg)' }
        },

        float: {
          from: { opacity: 0, bottom: '8px' },
          '50%': { opacity: 1 },
          '60%': { opacity: 1 },
          to: { opacity: 0, bottom: '23px' }
        }
      },

      animation: {
        blink: '1s blink step-end infinite',
        rise: '2s rise ease-out',
        celebrate: '1s celebrate ease-in-out',
        shake: '500ms shake'
      }
    }
  },
  plugins: []
}
