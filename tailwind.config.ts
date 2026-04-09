import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        card: "var(--card)",
        "accent-basic": "var(--accent-basic)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-frac": "var(--accent-frac)",
        "accent-green": "var(--accent-green)",
        "accent-red": "var(--accent-red)",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
