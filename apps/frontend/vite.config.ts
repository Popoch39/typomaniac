import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must run before the React plugin so generated route files are transformed too.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    // Oxc's Rust React Compiler; logDiagnostics surfaces the components it skips.
    react({ compiler: { logDiagnostics: true } }),
    tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
});
