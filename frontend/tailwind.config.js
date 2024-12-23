/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", //we dont really need thid one
    "./src/**/*.{js,ts,jsx,tsx}", // noe tailwind know that all the classes it need to use are in src.anything.js/ts blah blah blah
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

