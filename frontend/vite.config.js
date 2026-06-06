import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        // Lazy boundaries (React.lazy in App/main) already isolate the heavy
        // feature deps — react-force-graph/d3 land in the NetworkMap chunk,
        // recharts in the OpportunityMatrix chunk, driver.js in the
        // TourController chunk. We additionally pull the React framework into
        // its own long-lived vendor chunk so it can be cached across deploys
        // independently of app code (which changes far more often).
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/react-router") ||
              id.includes("/scheduler/")
            ) {
              return "react-vendor";
            }
          }
        },
      },
    },
  },
});
