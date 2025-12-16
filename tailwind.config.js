/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "Space Grotesk", "system-ui", "sans-serif"]
      },
      colors: {
        surface: {
          900: "#0b0f16",
          800: "#111827",
          700: "#161f2f",
          600: "#1f2937"
        },
        accent: {
          500: "#5865f2",
          400: "#6e7bff",
          300: "#8794ff"
        },
        success: {
          500: "#3ba55d"
        },
        warning: {
          500: "#f59e0b"
        }
      },
      boxShadow: {
        card: "0 12px 40px rgba(0,0,0,0.25)"
      }
    }
  },
  plugins: []
};
