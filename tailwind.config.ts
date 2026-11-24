import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Brand Colors ────────────────────────────────────────────────────────
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          pink:        "#FF6B9D", // Primary brand pink
          "pink-light": "#FFB3D1", // Soft highlight / hover
          "dark-blue": "#1E3A5F", // Deep navy for text & accents
          yellow:      "#FFD700", // Sunny accent / CTA
          green:       "#4CAF50", // Fresh / "healthy" accent
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        fredoka: ["var(--font-fredoka)", "Fredoka", "sans-serif"],
        nunito:  ["var(--font-nunito)",  "Nunito",  "sans-serif"],
      },

      // ─── Animations ──────────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to:   { opacity: "0", transform: "translateY(8px)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-6px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%":       { transform: "rotate(3deg)" },
        },
        "pulse-pink": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 107, 157, 0.4)" },
          "50%":       { boxShadow: "0 0 0 8px rgba(255, 107, 157, 0)" },
        },
      },
      animation: {
        // Standard animations (respect prefers-reduced-motion via CSS layer)
        "fade-in":    "fade-in 0.3s ease-out both",
        "fade-out":   "fade-out 0.3s ease-in  both",
        "scale-in":   "scale-in 0.25s ease-out both",
        "bounce-soft": "bounce-soft 1.4s ease-in-out infinite",
        "wiggle":     "wiggle 0.6s ease-in-out",
        "pulse-pink": "pulse-pink 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },

      // ─── Spacing / Sizing extras ─────────────────────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // ─── Box Shadows ─────────────────────────────────────────────────────────
      boxShadow: {
        "pink-sm": "0 2px 8px  rgba(255, 107, 157, 0.25)",
        "pink-md": "0 4px 16px rgba(255, 107, 157, 0.35)",
        "pink-lg": "0 8px 32px rgba(255, 107, 157, 0.40)",
      },
    },
  },
  plugins: [],
};
export default config;
