import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        card: {
          DEFAULT: "#111215",
          elevated: "#181a1f",
          foreground: "#f4f4f5",
        },
        border: "#23262d",
        accent: {
          DEFAULT: "#34d399", // Electric emerald
          hover: "#10b981",
          foreground: "#09090b",
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(16, 185, 129, 0.18)',
        'glow': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
