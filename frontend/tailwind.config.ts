import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b0b0c",
          muted: "#4b5160",
        },
        accent: {
          DEFAULT: "#3b82f6", // Electric blue
          hover: "#2563eb",
          soft: "#dbeafe",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#10b981", // Emerald
          soft: "#d1fae5",
        },
        danger: {
          DEFAULT: "#e11d48", // Rose
          soft: "#ffe4e6",
        },
        "seat-empty": "#d4d8ee",
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.52)",
          border: "rgba(255, 255, 255, 0.75)",
          elevated: "rgba(255, 255, 255, 0.7)",
        },
      },
      boxShadow: {
        card: "0 10px 40px -12px rgba(59, 70, 140, 0.22)",
        "card-hover": "0 16px 48px -12px rgba(59, 70, 140, 0.28)",
        "glow-accent": "0 0 25px -4px rgba(59, 130, 246, 0.35)",
        pill: "0 4px 14px 0 rgba(0, 0, 0, 0.12)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        "16": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
