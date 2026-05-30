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
        // Note: runtime node-type colors live in src/lib/nodeStyles.js
        // (NODE_COLORS), keyed by the actual node type strings
        // ("pain_point", "pricing_tier", ...). Don't duplicate here.
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
