/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-gray": "#202020",
        "button-gray": "#424242",
        "table-gray": "#161616",
        "light-gray": "#ebebeb",
        "correct": "#F9ABAB",
        "incorrect": "#FB4C4C",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
