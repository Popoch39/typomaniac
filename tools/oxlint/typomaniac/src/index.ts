import { eslintCompatPlugin } from "@oxlint/plugins";

import { noHardcodedUiTextRule } from "./no-hardcoded-ui-text.ts";

/** The repo's own Oxlint rules, beside the vendored anti-slop ones. */
const typomaniacPlugin = eslintCompatPlugin({
  meta: { name: "typomaniac" },
  rules: {
    "no-hardcoded-ui-text": noHardcodedUiTextRule,
  },
});

export default typomaniacPlugin;
