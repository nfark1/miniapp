/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#020617",        // общий фон
        card: "#020617",
        accent: "#22D3EE",    // твой неон
        accentSoft: "#38BDF8",
      },
      boxShadow: {
        "glass": "0 18px 45px rgba(15,23,42,0.95), 0 0 0 1px rgba(15,23,42,1)",
      },
      borderRadius: {
        "xl2": "1.1rem",
      }
    },
  },
  plugins: [],
}