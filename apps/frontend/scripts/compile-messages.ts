import { compile } from "@inlang/paraglide-js";

import { paraglideOptions } from "../paraglide.options.ts";

// The messages compiled outside Vite, for `tsc`: `src/paraglide/` is generated, never committed.
await compile(paraglideOptions);
