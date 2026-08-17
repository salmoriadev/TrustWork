import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161917",
        muted: "#68706B",
        app: "#F4F5F2",
        line: "#DDE0DC",
        trust: "#28A98B",
        "trust-deep": "#08755F",
        "trust-soft": "#EAF8F3",
        chain: "#2456F6",
        "chain-deep": "#173EBD",
        "chain-soft": "#EDF2FF",
        coral: "#DC4B3F",
        "coral-soft": "#FFF0ED",
        gold: "#A46706"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(17, 24, 39, 0.08)",
        card: "0 1px 2px rgba(22, 25, 23, 0.04)",
        elevated: "0 12px 30px rgba(22, 25, 23, 0.10)",
        glow: "0 0 0 2px rgba(49, 94, 251, 0.15)"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" }
        }
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;
