import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#667085",
        app: "#F6F7FB",
        line: "#D9DEE8",
        trust: "#0F9F8F",
        chain: "#315EFB",
        coral: "#E24A5A",
        gold: "#C98718"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(17, 24, 39, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
