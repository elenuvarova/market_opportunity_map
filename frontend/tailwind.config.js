/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f172a",
          soft: "#334155",
          muted: "#64748b",
        },
        node: {
          segment: "#3b82f6",
          pain: "#ef4444",
          competitor: "#a855f7",
          feature: "#10b981",
          pricing: "#f59e0b",
          opportunity: "#eab308",
        },
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
