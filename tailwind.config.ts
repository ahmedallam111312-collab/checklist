import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
          sunken: "var(--color-surface-sunken)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
        text: {
          DEFAULT: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          pressed: "var(--color-primary-pressed)",
          foreground: "var(--color-on-primary)",
        },
        "on-primary": "var(--color-on-primary)",
        "focus-ring": "var(--color-focus-ring)",
        critical: {
          DEFAULT: "var(--color-critical)",
          surface: "var(--color-critical-surface)",
          foreground: "var(--color-on-critical)",
        },
        "on-critical": "var(--color-on-critical)",
        danger: {
          DEFAULT: "var(--color-danger)",
          surface: "var(--color-danger-surface)",
        },
        success: "var(--color-success)",
      },
      borderRadius: {
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      spacing: {
        "tap-target": "2.75rem", // 44px
        "margin-mobile": "1rem",
        "margin-desktop": "2.5rem",
      },
      maxWidth: {
        "content-max": "70rem",
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-ibm-plex-sans-arabic)", "var(--font-ibm-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      aspectRatio: {
        "16/10": "16 / 10",
        "16/9": "16 / 9",
      },
    },
  },
  plugins: [],
};

export default config;
