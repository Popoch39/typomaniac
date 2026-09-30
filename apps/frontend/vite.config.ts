import { paraglideVitePlugin } from "@inlang/paraglide-js";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig, type Plugin } from "vite";

import { paraglideOptions } from "./paraglide.options.ts";

// The fonts of what Jouer shows first (src/fonts.css): Onest, the app's text, and Martian Mono, the
// training sample's.
const firstPaintFonts = ["onest-latin-wght-normal", "martian-mono-latin-wght-normal"];

// Preloaded from index.html by their hashed name in the build: downloaded along with the CSS, not
// after it.
const preloadFirstPaintFonts = (): Plugin => ({
  name: "typomaniac:preload-first-paint-fonts",
  apply: "build",
  transformIndexHtml: (_html, { bundle }) =>
    Object.keys(bundle ?? {}).flatMap((fileName) =>
      firstPaintFonts.some((font) => fileName.startsWith(`assets/${font}-`))
        ? [
            {
              tag: "link",
              attrs: {
                rel: "preload",
                href: `/${fileName}`,
                as: "font",
                type: "font/woff2",
                crossorigin: "",
              },
              injectTo: "head",
            },
          ]
        : [],
    ),
});

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
    preloadFirstPaintFonts(),
  ],
  resolve: { tsconfigPaths: true },
  build: {
    rolldownOptions: {
      output: {
        // The libraries in chunks of their own, apart from the app's code: a deploy leaves their
        // hash as it is, a returning visitor keeps them from the cache.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            {
              name: "tanstack",
              test: /node_modules[\\/]@tanstack[\\/](react-router|router-core|history|store|react-store|react-query|query-core)[\\/]/,
            },
            { name: "gsap", test: /node_modules[\\/](gsap|@gsap[\\/]react)[\\/]/ },
          ],
        },
      },
    },
  },
  // The Duel's page and all it imports (Face-off, HUD, Duel end, Tier-up) transformed as the dev
  // server starts: the first Face-off does not wait for them one by one.
  server: { warmup: { clientFiles: ["./src/pages/duel-page.tsx"] } },
});
