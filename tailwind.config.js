/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Myna",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      colors: {
        darkblue: {
          DEFAULT: "#010B40",
          deep: "#010626",
          light: "#0a1854",
          surface: "#061033",
        },
        darkyellow: {
          DEFAULT: "#FFE11D",
          rich: "#F9C700",
          muted: "rgba(255, 225, 29, 0.7)",
          subtle: "rgba(255, 225, 29, 0.15)",
        },
      },
      borderColor: {
        darkyellow: "#FFE11D",
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 225, 29, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 225, 29, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(255, 225, 29, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
