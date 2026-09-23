import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// The matcher types come from "@testing-library/jest-dom/vitest" in tsconfig.app.json `types`.
expect.extend(matchers);

// Without vitest globals, Testing Library cannot register its own cleanup.
afterEach(cleanup);
