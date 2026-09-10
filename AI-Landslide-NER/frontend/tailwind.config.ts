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
        bg: "#0a0e14",
        surface: "#111720",
        card: "#161e2a",
        border: "#1e2d3d",
        text: "#c8d8e8",
        muted: "#5a7a9a",
        danger: "#ff3b3b",
        high: "#ff8c00",
        medium: "#f5c400",
        normal: "#2ecc71",
        accent: "#3b9ddd",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
