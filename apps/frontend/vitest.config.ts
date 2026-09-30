import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "happy-dom",
      setupFiles: ["./src/test/setup.ts"],
      // A window wide enough for the whole sidebar: below 1440 px it folds into its Rail, which a
      // test of the Rail sets itself (`window.happyDOM.setViewport`).
      environmentOptions: { happyDOM: { width: 1440, height: 900 } },
      // The app's stylesheet keeps its content (every other CSS file is empty in tests): the test of
      // the Theme set before the first paint reads each Theme's ink in it.
      css: { include: [/src\/index\.css/] },
    },
  }),
);
