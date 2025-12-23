import react from "@vitejs/plugin-react";
import path from "path"
import tailwindcss from "@tailwindcss/vite"

export default {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
};
