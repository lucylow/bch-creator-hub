import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get port from environment or use default
  // Lovable will set PORT, otherwise default to 3000
  const port = process.env.PORT ? Number(process.env.PORT) : undefined;
  
  return {
    server: {
      host: "::",
      ...(port && { port }),
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
