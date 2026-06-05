/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Body text + secondary text tokens.
        // ink.muted darkened from #64748b (~4.57:1 on white) to #475569 (~7.0:1)
        // so 12px / 11px text passes WCAG 1.4.3 even on tinted card backgrounds.
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#475569",
        },
        // Mirrors src/lib/tokens.js (the single source of truth). Runtime hex
        // for Canvas/Recharts/SVG comes from tokens.js; these utility aliases
        // exist for static Tailwind classes (e.g. text-node-segment). Keep both
        // in lockstep. nodeStyles.js re-keys node colors onto raw type strings
        // ("pain_point", "pricing_tier"); these use the canonical short names.
        node: {
          segment: "#3b82f6",
          pain: "#ef4444",
          competitor: "#a855f7",
          feature: "#10b981",
          pricing: "#f59e0b",
          opportunity: "#eab308",
        },
        decision: {
          strong: "#059669", // emerald-600 (darker than node.feature on purpose)
          validate: "#eab308",
          research: "#f97316",
          low: "#94a3b8",
        },
        // Border roles: subtle (slate-200/70), DEFAULT (slate-200), strong (slate-300).
        border: {
          subtle: "rgb(226 232 240 / 0.7)",
          DEFAULT: "#e2e8f0",
          strong: "#cbd5e1",
        },
      },
      fontSize: {
        // 11px — replaces scattered text-[10px]/text-[11px] usages.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      zIndex: {
        sticky: "20",
        dropdown: "30",
        overlay: "40",
        modal: "50",
        toast: "60",
        skip: "70",
      },
      height: {
        "chart-sm": "380px",
        "chart-lg": "520px",
      },
      maxWidth: {
        drawer: "480px",
      },
      spacing: {
        "accent-bar": "3px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        cardLg:
          "0 4px 10px -2px rgba(15, 23, 42, 0.08), 0 10px 24px -8px rgba(15, 23, 42, 0.12)",
      },
    },
  },
  plugins: [],
};
