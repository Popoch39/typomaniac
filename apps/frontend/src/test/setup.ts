import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, expect } from "vitest";

import { readLocaleFrom, useLocaleStore } from "@/stores/locale-store";

// The matcher types come from "@testing-library/jest-dom/vitest" in tsconfig.app.json `types`.
expect.extend(matchers);

// Every test starts in French, as the app was written: their French assertions hold. A test in
// English shows `en` itself. The Locale is kept in the browser's storage again, whatever storage
// a router test gave it.
beforeEach(() => {
  readLocaleFrom(() => window.localStorage);
  useLocaleStore.setState({ locale: "fr", chosen: null });
});

// Without vitest globals, Testing Library cannot register its own cleanup.
afterEach(cleanup);
