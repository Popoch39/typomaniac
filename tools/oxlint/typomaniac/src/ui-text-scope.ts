// Where `no-hardcoded-ui-text` runs, read by the root `oxlint.config.ts` and by the rule's test.
// Paths are relative to the repo root, as the config's globs are.

const front = (path: string) => `apps/frontend/src/${path}`;

// The delivered front: JSX lives in `.tsx` files only.
export const uiTextFiles = [front("**/*.tsx")];

// Never delivered, so never translated: the tests, and the code only a dev build has (the
// `/dev/*` pages, the Face-off lab, the Aura gallery, the dev email sign-in).
export const outOfScopeFiles = [
  "**/*.test.tsx",
  "test/**",
  "pages/aura-gallery-page.tsx",
  "pages/aura-maniac-prototype-page.tsx",
  "pages/duel-hud-dev-page.tsx",
  "pages/face-off-dev-page.tsx",
  "pages/intro-dev-page.tsx",
  "pages/tier-up-dev-page.tsx",
  "components/aura-gallery/**",
  "components/aura-maniac-prototype/**",
  "components/duel-hud-dev/**",
  "components/face-off-lab/**",
  "components/intro-dev/**",
  "components/tier-up-dev/**",
  "components/auth/dev-email-sign-in.tsx",
].map(front);

// The files that still have hardcoded text. Each extraction ticket removes the ones it
// translates, and the list is empty once English opens. The test fails on a file that no
// longer has any, so it cannot stay here.
export const untranslatedFiles = [
  "components/desktop-only.tsx",
  "components/leaderboard/leaderboard-empty.tsx",
  "components/leaderboard/leaderboard-header.tsx",
  "components/leaderboard/leaderboard-list.tsx",
  "components/leaderboard/leaderboard-place-pending.tsx",
  "components/leaderboard/leaderboard-place-ranked.tsx",
  "components/leaderboard/leaderboard-place.tsx",
  "components/leaderboard/leaderboard-podium.tsx",
  "components/leaderboard/leaderboard-you.tsx",
  "components/leaderboard/tier-legend-row.tsx",
  "components/leaderboard/tier-legend.tsx",
  "components/theme/active-theme.tsx",
  "components/theme/theme-effects.tsx",
  "components/theme/theme-option.tsx",
  "components/theme/theme-picker.tsx",
  "components/theme/theme-preview.tsx",
  "components/theme/theme-roles.tsx",
  "pages/health-page.tsx",
  "pages/themes-page.tsx",
].map(front);
