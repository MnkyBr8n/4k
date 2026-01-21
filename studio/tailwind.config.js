/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0078d4',
          hover: '#005a9e',
          selected: '#cce4f7',
        },
        success: {
          DEFAULT: '#107c10',
          dark: '#4ec94e',
        },
        warning: {
          DEFAULT: '#ffa500',
          dark: '#ffb84d',
        },
        error: {
          DEFAULT: '#d13438',
          dark: '#f85149',
        },
        dark: {
          bg: '#1e1e1e',
          panel: '#2d2d2d',
          tertiary: '#252525',
          border: '#3a3a3a',
          'border-secondary': '#2f2f2f',
        },
        light: {
          bg: '#f5f5f5',
          panel: '#ffffff',
          tertiary: '#e8e8e8',
          border: '#d0d0d0',
          'border-secondary': '#e0e0e0',
        },
        brand: '#7c5cff',
        'brand-secondary': '#00c2ff',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
        'md': '14px',
        'lg': '16px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      borderRadius: {
        'sm': '2px',
        'md': '4px',
      },
    },
  },
  plugins: [],
}
