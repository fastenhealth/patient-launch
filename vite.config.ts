import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/patient-launch/",
  resolve: {
    alias: {
      "@mui/material/utils": "@mui/material/utils",
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
