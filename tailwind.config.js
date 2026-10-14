const { theme } = require("./src/constants/theme.ts");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: theme.colors,
      fontFamily: {
        regular: [theme.fonts.regular],
        medium: [theme.fonts.medium],
        semibold: [theme.fonts.semibold],
        bold: [theme.fonts.bold],
        extraBold: [theme.fonts.extraBold],
      },
    },
  },
  plugins: [],
};
