import type { Config } from 'tailwindcss';
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          300: "#67e8f9",
          400: "#22d3ee",
          700: "#0e7490",
        },
        fuchsia: {
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          700: "#a21caf",
        },
        zinc: {
          800: "#27272a",
          900: "#18181b",
          950: "#09090b"
        }
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui", "sans-serif"]
      }
    },
  },
  plugins: [],
};
export default config;