import { compile } from "@inlang/paraglide-js";

import { paraglideOptions } from "../paraglide.options.ts";

// The messages compiled outside Vite, for `tsc`: `src/paraglide/` is generated, never committed.
// In the dev server's structure (the Vite plugin's default outside production): compiling in
// another one while `vite` runs deletes the files its module graph still imports.
await compile({ ...paraglideOptions, outputStructure: "locale-modules" });
