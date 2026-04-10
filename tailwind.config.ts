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
        "bg-primary": "var(--background-primary)",
        "bg-secondary": "var(--background-secondary)",
        "bg-tertiary": "var(--background-tertiary)",
        surface: "var(--surface)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        foreground: "var(--foreground)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-light": "var(--accent-light)",
        "accent-text": "var(--accent-text)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        success: "var(--success)",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "Courier New", "monospace"],
      },
      borderWidth: {
        hairline: "0.5px",
      },
      borderRadius: {
        card: "16px",
        pill: "8px",
        "card-lg": "20px",
      },
    },
  },
  plugins: [],
};
export default config;
