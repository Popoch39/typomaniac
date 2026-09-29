import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

import { paraglideOptions } from "./paraglide.options.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Compiles messages/*.json into src/paraglide/, typed message functions (ADR 0011).
    paraglideVitePlugin(paraglideOptions),
    // Must run before the React plugin so generated route files are transformed too.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    // Oxc's Rust React Compiler; logDiagnostics surfaces the components it skips.
    react({ compiler: { logDiagnostics: true } }),
    tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
});
