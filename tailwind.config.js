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
        },
        darkyellow: {
          DEFAULT: "#FFE11D",
          rich: "#F9C700",
        },
      },
      borderColor: {
        darkyellow: "#FFE11D",
      },
    },
  },
  plugins: [],
};
