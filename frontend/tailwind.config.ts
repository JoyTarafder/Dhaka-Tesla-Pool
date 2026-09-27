import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0b0c",
        foreground: "#f4f4f5",
        card: {
          DEFAULT: "#18181b",
          foreground: "#f4f4f5",
        },
        border: "#27272a",
        accent: {
          DEFAULT: "#34d399", // Electric emerald
          hover: "#10b981",
          foreground: "#0b0b0c",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
