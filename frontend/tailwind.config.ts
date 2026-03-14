import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "#0f0f0f",
        panel: "#1a1a1a",
        panel2: "#161616",
        ink: "#ececec",
        muted: "#a7a7a7",
        accent: "#d7d7d7",
        accent2: "#7d7d7d"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(0, 0, 0, 0.35)"
      },
      keyframes: {
        reveal: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        reveal: "reveal 220ms ease-out"
      }
    }
  },
  plugins: []
} satisfies Config;
