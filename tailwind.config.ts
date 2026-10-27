import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "DM Sans", "system-ui", "sans-serif"]
      },
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        sage: "rgb(var(--sage) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)"
      },
      boxShadow: {
        page: "0 28px 90px rgba(92, 45, 66, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
