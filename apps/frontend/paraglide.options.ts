import type { CompilerOptions } from "@inlang/paraglide-js";

// How the messages are compiled, the same for the Vite plugin (dev, build, tests) and the
// `messages` script (type checking without Vite). Kept here rather than in
// `project.inlang/paraglide.config.ts`: inlang ignores every file of its folder but its settings.
// The app resolves the Locale itself (`src/locale/`, ADR 0011): the runtime's own strategies are
// never used, the Locale store overwrites `getLocale`. The router's rewrite prefixes both Locales
// in the URL, rather than Paraglide's URL patterns, whose custom form ships a URLPattern polyfill.
export const paraglideOptions = {
  project: "./project.inlang",
  outdir: "./src/paraglide",
  strategy: ["baseLocale"],
  emitGitIgnore: false,
  emitPrettierIgnore: false,
  emitReadme: false,
} satisfies CompilerOptions;
