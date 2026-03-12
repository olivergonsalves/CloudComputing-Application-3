import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "#0a1220",
        panel: "#0f1b2e",
        ink: "#e6eef8",
        accent: "#30b7ff",
        accent2: "#4fffb3"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(8, 20, 40, 0.35)"
      },
      keyframes: {
        reveal: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        reveal: "reveal 260ms ease-out"
      }
    }
  },
  plugins: []
} satisfies Config;
