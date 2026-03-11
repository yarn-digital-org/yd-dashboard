/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'yarn-blue': '#3B82F6',
        'yarn-purple': '#8B5CF6',
        'yarn-gray': '#6B7280',
      },
    },
  },
  plugins: [],
}