/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgWarm: "#FFFDFB",
        bgCream: "#fbf7ed",
        borderDark: "#1e1e24",
        pastelPurple: "#bca0f5",
        pastelPink: "#ffa4b2",
        pastelYellow: "#ffe869",
        pastelOrange: "#ffb875",
        pastelGreen: "#9ee3b2",
        pastelCyan: "#a4f0fd",
        textMuted: "#666666",
      },
      fontFamily: {
        sans: ["Quicksand", "Fredoka", "system-ui", "sans-serif"],
      },
      boxShadow: {
        neo: "5px 5px 0px #1e1e24",
        neoSm: "3px 3px 0px #1e1e24",
        neoActive: "2px 2px 0px #1e1e24",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  plugins: [],
}
