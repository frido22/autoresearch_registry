import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      colors: {
        improve: "#16a34a",
        regress: "#dc2626",
      },
      maxWidth: {
        doc: "720px",
      },
    },
  },
  plugins: [],
};
export default config;
