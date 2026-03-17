import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api/analyzer": {
        target: "http://localhost:4001",
        rewrite: (p) => p.replace(/^\/api\/analyzer/, ""),
      },
      "/api/beers": {
        target: "http://localhost:4002",
        rewrite: (p) => p.replace(/^\/api\/beers/, ""),
      },
      "/api/gamify": {
        target: "http://localhost:4003",
        rewrite: (p) => p.replace(/^\/api\/gamify/, ""),
      },
    },
  },
});
