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
        navy: "#0B2146",
        "logo-navy": "#071D3C",
        "card-navy": "#0C2043",
        plum: "#524056",
        rose: {
          DEFAULT: "#C87475",
          hover: "#D38586",
          dark: "#9A4450",
          light: "#EAB2B3",
        },
        "light-1": "#FBF3F3",
        "search-bg": "#F9F3F3",
        page: "#F6E6E6",
        "light-2": "#EBD8DA",
        "list-page": "#E4D3D3",
        "tile-blue": "#3B467A",
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
          "muted-navy": "var(--color-text-muted-navy)",
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
        success: {
          DEFAULT: "var(--color-success)",
          surface: "var(--color-success-surface)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          surface: "var(--color-warning-surface)",
        },
      },
      borderRadius: {
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        pill: "16px",
        tile: "24px",
        card: "28px",
      },
      boxShadow: {
        "card-soft": "0 14px 36px -10px rgba(11, 33, 70, 0.22)",
        "rose-glow": "0 12px 26px -6px rgba(200, 116, 117, 0.48)",
      },
      spacing: {
        "tap-target": "2.75rem",
        "margin-mobile": "1rem",
        "margin-desktop": "2.5rem",
      },
      maxWidth: {
        "content-max": "70rem",
      },
      fontFamily: {
        sans: [
          "var(--font-ibm-plex-sans-arabic)",
          "var(--font-roboto)",
          "system-ui",
          "sans-serif",
        ],
        arabic: [
          "var(--font-ibm-plex-sans-arabic)",
          "var(--font-roboto)",
          "system-ui",
          "sans-serif",
        ],
        latin: ["var(--font-roboto)", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
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
